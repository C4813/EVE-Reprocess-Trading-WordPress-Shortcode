<?php
// price_api.php
ob_start();
header('Content-Type: application/json');

function log_debug($msg) {
    file_put_contents(__DIR__ . '/plugin_debug.log', date('[Y-m-d H:i:s] ') . $msg . PHP_EOL, FILE_APPEND);
}

$input = json_decode(file_get_contents('php://input'), true);
$hub = $input['hub'] ?? 'jita';
$scope = ($input['includeSecondary'] ?? 'no') === 'yes' ? 'secondary' : 'primary';

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

$minerals = ["Isogen", "Megacyte", "Mexallon", "Morphite", "Nocxium", "Pyerite", "Tritanium", "Zydrine"];
$invTypes = json_decode(file_get_contents(__DIR__ . '/invTypes.json'), true);

$cache_file = __DIR__ . "/esi_cache_{$hub}_{$scope}.json";
$map_file = __DIR__ . "/location_system_map.json";
$system_map = file_exists($map_file) ? json_decode(file_get_contents($map_file), true) : [];

$buy = $sell = $volumes = array_fill_keys($minerals, 0);

function resolve_system_id($locationID, &$map) {
    if (isset($map[$locationID])) return $map[$locationID];
    if ($locationID >= 1000000000000) {
        $map[$locationID] = null;
        log_debug("Skipped player structure: $locationID");
        return null;
    }
    $url = "https://esi.evetech.net/latest/universe/stations/{$locationID}/";
    $res = @file_get_contents($url);
    $info = json_decode($res, true);
    $systemID = $info['system_id'] ?? null;
    if ($systemID) {
        $map[$locationID] = $systemID;
        return $systemID;
    }
    log_debug("Could not resolve station system ID for location $locationID");
    $map[$locationID] = null;
    return null;
}

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
        sleep(1);
    } while (count($batch) === 1000);
    return $orders;
}

if (!file_exists($cache_file) || (time() - filemtime($cache_file)) > 3600) {
    foreach ($minerals as $name) {
        $typeID = $invTypes[$name]['typeID'] ?? null;
        if (!$typeID) continue;

        $orders = fetch_orders_for_type($region_id, $typeID);
        $buyOrders = $sellOrders = [];

        foreach ($orders as $order) {
            $sysID = resolve_system_id($order['location_id'], $system_map);
            if (!$sysID) continue;

            $isPrimary = $sysID === $primary_system;
            $isSecondary = $sysID === $secondary_system;

            if ($scope === 'primary' && !$isPrimary) continue;
            if ($scope === 'secondary' && !$isPrimary && !$isSecondary) continue;

            if ($order['is_buy_order']) {
                $buyOrders[] = ['price' => $order['price'], 'system_id' => $sysID];
            } else {
                $sellOrders[] = ['price' => $order['price'], 'system_id' => $sysID];
            }
        }

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

        $buy[$name] = $bestBuy;
        $sell[$name] = $bestSell;

        $history = @file_get_contents("https://esi.evetech.net/latest/markets/{$region_id}/history/?type_id={$typeID}");
        $data = json_decode($history, true);
        if (is_array($data) && count($data) > 0) {
            $volumes[$name] = round(array_sum(array_column(array_slice($data, -7), 'volume')) / 7);
        }
    }

    file_put_contents($map_file, json_encode($system_map));
    file_put_contents($cache_file, json_encode(['buy' => $buy, 'sell' => $sell, 'volumes' => $volumes]));
} else {
    $cache = json_decode(file_get_contents($cache_file), true);
    $buy = $cache['buy'] ?? $buy;
    $sell = $cache['sell'] ?? $sell;
    $volumes = $cache['volumes'] ?? $volumes;
}

ob_end_clean();
echo json_encode(['buy' => $buy, 'sell' => $sell, 'volumes' => $volumes]);
