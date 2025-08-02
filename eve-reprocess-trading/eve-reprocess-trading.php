<?php
/*
Plugin Name: EVE Reprocess Trading
Description: Displays trade hub buy/sell prices and regional volume using ESI. Includes standings calculator.
Version: 0.1.5
Author: C4813
*/

defined('ABSPATH') || exit;

function eve_reprocess_trading_shortcode() {
    // --- Determine selected hub ---
    $hub = $_GET['hub'] ?? 'jita';
    $hubMap = [
        'jita' => ['system' => 30000142, 'region' => 10000002, 'corp' => 'Caldari Navy'],
        'amarr' => ['system' => 30002187, 'region' => 10000043, 'corp' => 'Emperor Family'],
        'dodixie' => ['system' => 30002659, 'region' => 10000032, 'corp' => 'Federation Navy'],
        'rens' => ['system' => 30002510, 'region' => 10000030, 'corp' => 'Brutor Tribe'],
        'hek' => ['system' => 30002053, 'region' => 10000042, 'corp' => 'Boundless Creations'],
    ];
    $systemId = $hubMap[$hub]['system'] ?? 30000142;
    $regionId = $hubMap[$hub]['region'] ?? 10000002;
    $selectedCorp = $hubMap[$hub]['corp'] ?? 'Caldari Navy';

    // --- Load static data ---
    $corpList = json_decode(file_get_contents(__DIR__ . '/corps.json'), true);
    $corpFactionMap = json_decode(file_get_contents(__DIR__ . '/corp_to_faction.json'), true);
    $invTypes = json_decode(file_get_contents(__DIR__ . '/invTypes.json'), true);
    $selectedFaction = $corpFactionMap[$selectedCorp] ?? 'Caldari State';

    // --- Enqueue CSS/JS ---
    wp_enqueue_style('eve-reprocess-trading-style', plugin_dir_url(__FILE__) . 'style.css');
    wp_enqueue_script('eve-reprocess-trading-script', plugin_dir_url(__FILE__) . 'script.js', [], false, true);
    wp_localize_script('eve-reprocess-trading-script', 'EVE_DATA', [
        'corpList' => $corpList,
        'corpToFaction' => $corpFactionMap
    ]);

    // --- Set up price data ---
    $minerals = ["Isogen", "Megacyte", "Mexallon", "Morphite", "Nocxium", "Pyerite", "Tritanium", "Zydrine"];
    $buy = $sell = $volumes = array_fill_keys($minerals, 0);
    $cache_file = __DIR__ . "/esi_cache_{$hub}.json";

    // --- ESI helper ---
    function fetch_all_orders($typeID, $regionId) {
        $orders = [];
        $page = 1;
        do {
            $url = "https://esi.evetech.net/latest/markets/$regionId/orders/?type_id=$typeID&page=$page";
            $data = @file_get_contents($url);
            $batch = json_decode($data, true);
            if (!is_array($batch) || count($batch) === 0) break;
            $orders = array_merge($orders, $batch);
            $page++;
            sleep(1);
        } while (count($batch) === 1000);
        return $orders;
    }

    // --- Use cache or fetch fresh ---
    if (!file_exists($cache_file) || (time() - filemtime($cache_file)) > 3600) {
        $typeIDs = [];
        foreach ($minerals as $name) {
            if (isset($invTypes[$name]['typeID'])) {
                $typeIDs[$name] = $invTypes[$name]['typeID'];
            } else {
                error_log("Missing typeID for $name");
            }
        }

        foreach ($typeIDs as $name => $typeID) {
            $orders = fetch_all_orders($typeID, $regionId);

            $buyOrders = array_filter($orders, fn($o) => $o['is_buy_order'] && $o['system_id'] == $systemId);
            $sellOrders = array_filter($orders, fn($o) => !$o['is_buy_order'] && $o['system_id'] == $systemId);

            usort($buyOrders, fn($a, $b) => $b['price'] <=> $a['price']);
            usort($sellOrders, fn($a, $b) => $a['price'] <=> $b['price']);

            $buy[$name] = $buyOrders[0]['price'] ?? 0;
            $sell[$name] = $sellOrders[0]['price'] ?? 0;

            $history = @file_get_contents("https://esi.evetech.net/latest/markets/{$regionId}/history/?type_id=$typeID");
            $data = json_decode($history, true);
            if (is_array($data) && count($data) > 0) {
                $volumes[$name] = round(array_sum(array_column(array_slice($data, -7), 'volume')) / 7);
            }
        }

        file_put_contents($cache_file, json_encode([
            'buy' => $buy,
            'sell' => $sell,
            'volumes' => $volumes
        ]));
    } else {
        $cache = json_decode(file_get_contents($cache_file), true);
        $buy = $cache['buy'] ?? $buy;
        $sell = $cache['sell'] ?? $sell;
        $volumes = $cache['volumes'] ?? $volumes;
    }

    // --- Render template ---
    ob_start();
    include plugin_dir_path(__FILE__) . 'template.php';
    return ob_get_clean();
}

add_shortcode('eve_reprocess_trading', 'eve_reprocess_trading_shortcode');
