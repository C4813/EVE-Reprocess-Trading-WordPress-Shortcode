<?php
ob_start();
header('Content-Type: application/json');

function log_debug($msg) {
    file_put_contents(__DIR__ . '/plugin_debug.log', date('[Y-m-d H:i:s] ') . $msg . PHP_EOL, FILE_APPEND);
}

$input = json_decode(file_get_contents('php://input'), true);
$hub = strtolower($input['hub'] ?? 'jita');
$scope = ($input['includeSecondary'] ?? 'no') === 'yes' ? 'secondary' : 'primary';
$requestedMaterials = $input['materials'] ?? [];

$hub_map = [
    'jita' => ['region' => 10000002, 'primary' => 30000142, 'secondary' => 30000144],
    'amarr' => ['region' => 10000043, 'primary' => 30002187, 'secondary' => 30003491],
    'rens' => ['region' => 10000030, 'primary' => 30002510, 'secondary' => 30002526],
    'hek' => ['region' => 10000042, 'primary' => 30002053, 'secondary' => 30002068],
    'dodixie' => ['region' => 10000032, 'primary' => 30002659, 'secondary' => 30002661],
];

if (!isset($hub_map[$hub])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid hub']);
    exit;
}

$region_id = $hub_map[$hub]['region'];
$primary_system = $hub_map[$hub]['primary'];
$secondary_system = $hub_map[$hub]['secondary'];

$invTypes = json_decode(file_get_contents(__DIR__ . '/invTypes.json'), true);
$map_file = __DIR__ . "/location_system_map.json";
$system_map = file_exists($map_file) ? json_decode(file_get_contents($map_file), true) : [];

$cache_file = __DIR__ . "/esi_cache_{$hub}_{$scope}.json";
$cache_ttl = 21600; // 6 hours

// Load the existing cache if available and valid
$cache = [];
if (file_exists($cache_file) && (time() - filemtime($cache_file)) < $cache_ttl) {
    $cache = json_decode(file_get_contents($cache_file), true) ?: [];
    log_debug("Loaded from cache: $cache_file");
}

// Set up output arrays with cached values where possible
$buy = $cache['buy'] ?? [];
$sell = $cache['sell'] ?? [];
$volumes = $cache['volumes'] ?? [];

// Which materials need to be fetched
$toFetch = [];
foreach ($requestedMaterials as $mat) {
    // Only fetch if missing or value is 0 (could refine this: 0 could mean "no market", but safe for now)
    if (!isset($buy[$mat]) || !isset($sell[$mat]) || !isset($volumes[$mat]) || $buy[$mat] === 0 || $sell[$mat] === 0 || $volumes[$mat] === 0) {
        $toFetch[] = $mat;
        $buy[$mat] = 0;
        $sell[$mat] = 0;
        $volumes[$mat] = 0;
    }
}

// Updated system ID resolver for player structures
function resolve_system_id($locationID, &$map, $primary_system, $secondary_system, $scope) {
    if (isset($map[$locationID])) return $map[$locationID];
    if ($locationID >= 1000000000000) {
        $assumed = ($scope === 'secondary') ? $secondary_system : $primary_system;
        $map[$locationID] = $assumed;
        log_debug("Assume player structure: $locationID mapped to systemID $assumed (scope: $scope)");
        return $assumed;
    }
    $url = "https://esi.evetech.net/latest/universe/stations/{$locationID}/";
    $res = @file_get_contents($url);
    $info = json_decode($res, true);
    $systemID = $info['system_id'] ?? null;
    $map[$locationID] = $systemID;
    log_debug("Station $locationID mapped to systemID $systemID");
    return $systemID;
}

// Fetch and cache orders for a type
function fetch_orders_for_type($region_id, $typeID) {
    $orders = [];
    $page = 1;
    do {
        $url = "https://esi.evetech.net/latest/markets/{$region_id}/orders/?order_type=all&type_id={$typeID}&page={$page}";
        log_debug("Fetching: $url");
        $res = @file_get_contents($url);
        $batch = json_decode($res, true);
        if (!is_array($batch) || empty($batch)) break;
        $orders = array_merge($orders, $batch);
        $page++;
        usleep(200000); // 0.2s pause to avoid ESI errors
    } while (count($batch) === 1000);
    return $orders;
}

// Only fetch what's needed
foreach ($toFetch as $name) {
    $typeID = $invTypes[$name]['typeID'] ?? null;
    if (!$typeID) {
        log_debug("No typeID for $name, skipping");
        continue;
    }
    $orders = fetch_orders_for_type($region_id, $typeID);
    $buyOrders = $sellOrders = [];

    foreach ($orders as $order) {
        $sysID = resolve_system_id(
            $order['location_id'],
            $system_map,
            $primary_system,
            $secondary_system,
            $scope
        );
        if (!$sysID) continue;

        $isPrimary = $sysID === $primary_system;
        $isSecondary = $sysID === $secondary_system;

        log_debug("Order for $name: price={$order['price']} sysID=$sysID isPrimary=" . ($isPrimary ? 1 : 0) . " isSecondary=" . ($isSecondary ? 1 : 0));

        if ($scope === 'primary' && !$isPrimary) continue;
        if ($scope === 'secondary' && !$isPrimary && !$isSecondary) continue;

        if ($order['is_buy_order']) {
            $buyOrders[] = ['price' => $order['price'], 'system_id' => $sysID];
        } else {
            $sellOrders[] = ['price' => $order['price'], 'system_id' => $sysID];
        }
    }

    // Sort and select best prices
    $primaryBuys = array_filter($buyOrders, fn($o) => $o['system_id'] === $primary_system);
    $secondaryBuys = array_filter($buyOrders, fn($o) => $o['system_id'] === $secondary_system);
    $primarySells = array_filter($sellOrders, fn($o) => $o['system_id'] === $primary_system);
    $secondarySells = array_filter($sellOrders, fn($o) => $o['system_id'] === $secondary_system);

    usort($primaryBuys, fn($a, $b) => $b['price'] <=> $a['price']);
    usort($secondaryBuys, fn($a, $b) => $b['price'] <=> $a['price']);
    usort($primarySells, fn($a, $b) => $a['price'] <=> $b['price']);
    usort($secondarySells, fn($a, $b) => $a['price'] <=> $b['price']);

    $bestBuy = max($primaryBuys[0]['price'] ?? 0, $secondaryBuys[0]['price'] ?? 0);
    $bestSell = min($primarySells[0]['price'] ?? INF, $secondarySells[0]['price'] ?? INF);
    if ($bestSell === INF) $bestSell = 0;

    log_debug("Best Buy for $name: primary=" . ($primaryBuys[0]['price'] ?? 0) . ", secondary=" . ($secondaryBuys[0]['price'] ?? 0) . " => chosen $bestBuy");
    log_debug("Best Sell for $name: primary=" . ($primarySells[0]['price'] ?? 0) . ", secondary=" . ($secondarySells[0]['price'] ?? 0) . " => chosen $bestSell");

    $buy[$name] = $bestBuy;
    $sell[$name] = $bestSell;

    // Volumes (by region, can't be split by system)
    $history = @file_get_contents("https://esi.evetech.net/latest/markets/{$region_id}/history/?type_id={$typeID}");
    $data = json_decode($history, true);
    if (is_array($data) && count($data) > 0) {
        $volumes[$name] = round(array_sum(array_column(array_slice($data, -7), 'volume')) / 7);
    } else {
        $volumes[$name] = 0;
    }
}

// Save updates
file_put_contents($map_file, json_encode($system_map));
file_put_contents($cache_file, json_encode(['buy' => $buy, 'sell' => $sell, 'volumes' => $volumes]));
log_debug("Updated and wrote cache file: $cache_file");

// Output only what was requested
$reply = ['buy' => [], 'sell' => [], 'volumes' => []];
foreach ($requestedMaterials as $mat) {
    $reply['buy'][$mat] = $buy[$mat] ?? 0;
    $reply['sell'][$mat] = $sell[$mat] ?? 0;
    $reply['volumes'][$mat] = $volumes[$mat] ?? 0;
}

ob_end_clean();
echo json_encode($reply);
