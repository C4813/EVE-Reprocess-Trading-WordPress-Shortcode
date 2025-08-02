<?php
/*
Plugin Name: EVE Reprocess Trading
Description: Displays trade hub mineral prices, brokerage and tax estimates based on skills and standings.
Version: 0.2
Author: C4813
*/

defined('ABSPATH') || exit;

function eve_reprocess_trading_shortcode() {
    // Load static mineral data
    $invTypes = json_decode(file_get_contents(__DIR__ . '/invTypes.json'), true);

    // Enqueue assets
    wp_enqueue_style('eve-reprocess-trading-style', plugin_dir_url(__FILE__) . 'style.css');
    wp_enqueue_script('eve-reprocess-trading-script', plugin_dir_url(__FILE__) . 'script.js', [], false, true);

    // Provide hub → faction/corp mapping to JS
    wp_localize_script('eve-reprocess-trading-script', 'EVE_DATA', [
        'factionCorpMap' => [
            'Jita'     => ['faction' => 'Caldari State',      'corp' => 'Caldari Navy'],
            'Amarr'    => ['faction' => 'Amarr Empire',       'corp' => 'Emperor Family'],
            'Dodixie'  => ['faction' => 'Gallente Federation','corp' => 'Federation Navy'],
            'Hek'      => ['faction' => 'Minmatar Republic',  'corp' => 'Boundless Creations'],
            'Rens'     => ['faction' => 'Minmatar Republic',  'corp' => 'Brutor Tribe'],
        ]
    ]);

    // Output the HTML template
    ob_start();
    include plugin_dir_path(__FILE__) . 'template.php';
    return ob_get_clean();
}

add_shortcode('eve_reprocess_trading', 'eve_reprocess_trading_shortcode');
