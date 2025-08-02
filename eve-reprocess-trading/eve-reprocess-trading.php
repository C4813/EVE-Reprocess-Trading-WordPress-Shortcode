<?php
/*
Plugin Name: EVE Reprocess Trading
Description: Displays Jita 4-4 buy/sell prices and Forge daily volume using ESI. Includes standings calculator.
Version: 0.1.1
Author: C4813
*/

defined('ABSPATH') || exit;

function eve_reprocess_trading_shortcode() {
    // Load data
    $corpList = json_decode(file_get_contents(__DIR__ . '/corps.json'), true);
    $corpFactionMap = json_decode(file_get_contents(__DIR__ . '/corp_to_faction.json'), true);
    $invTypes = json_decode(file_get_contents(__DIR__ . '/invTypes.json'), true);

    // Expose to JS
    wp_enqueue_style('eve-reprocess-trading-style', plugin_dir_url(__FILE__) . 'style.css');
    wp_enqueue_script('eve-reprocess-trading-script', plugin_dir_url(__FILE__) . 'script.js', [], false, true);
    wp_localize_script('eve-reprocess-trading-script', 'EVE_DATA', [
        'corpList' => $corpList,
        'corpToFaction' => $corpFactionMap
    ]);

    // Set up variables
    $minerals = ["Isogen", "Megacyte", "Mexallon", "Morphite", "Nocxium", "Pyerite", "Tritanium", "Zydrine"];
    $buy = $sell = $volumes = array_fill_keys($minerals, 0);
    $cache_file = __DIR__ . '/esi_cache.json';

    // Fetch helper
    function fetch_all_orders($typeID, $name) {
        $orders = [];
        $page = 1;

        do {
            $url = "https://esi.evetech.net/latest/markets/10000002/orders/?type_id=$typeID&page=$page";
            $data = @file_get_contents($url);
            $batch = json_decode($data, true);
            if (!is_array($batch) || count($batch) === 0) break;
            $orders = array_merge($orders, $batch);
            $page++;
            sleep(1);
        } while (count($batch) === 1000);

        return $orders;
    }

    // Cache refresh
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
        $orders = fetch_all_orders($typeID, $name);
        error_log("$name ($typeID): Total orders = " . count($orders));

        $buyOrders = array_filter($orders, fn($o) => $o['is_buy_order'] && in_array($o['location_id'], [60003760, 30000142]));
        $sellOrders = array_filter($orders, fn($o) => !$o['is_buy_order'] && in_array($o['location_id'], [60003760, 30000142]));

        error_log("$name: Buy Orders = " . count($buyOrders) . ", Sell Orders = " . count($sellOrders));

        usort($buyOrders, fn($a, $b) => $b['price'] <=> $a['price']);
        usort($sellOrders, fn($a, $b) => $a['price'] <=> $b['price']);

        $buy[$name] = $buyOrders[0]['price'] ?? 0;
        $sell[$name] = $sellOrders[0]['price'] ?? 0;

        // Log selected prices
        error_log("$name: Buy = {$buy[$name]}, Sell = {$sell[$name]}");

        $history = @file_get_contents("https://esi.evetech.net/latest/markets/10000002/history/?type_id=$typeID");
        $data = json_decode($history, true);
        if (is_array($data) && count($data) > 0) {
            $volumes[$name] = round(array_sum(array_column(array_slice($data, -7), 'volume')) / 7);
            error_log("$name: Daily Volume = {$volumes[$name]}");
        } else {
            error_log("$name: No history data");
        }
    }

    file_put_contents($cache_file, json_encode([
        'buy' => $buy,
        'sell' => $sell,
        'volumes' => $volumes
    ]));
} else {
    error_log("Loading prices from cache...");
    $cache = json_decode(file_get_contents($cache_file), true);
    $buy = $cache['buy'] ?? $buy;
    $sell = $cache['sell'] ?? $sell;
    $volumes = $cache['volumes'] ?? $volumes;
}


    // Output template
    ob_start();
    include plugin_dir_path(__FILE__) . 'template.php';
    return ob_get_clean();
}

add_shortcode('eve_reprocess_trading', 'eve_reprocess_trading_shortcode');
