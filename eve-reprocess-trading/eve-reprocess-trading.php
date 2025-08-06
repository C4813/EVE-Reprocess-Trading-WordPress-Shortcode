<?php
/*
Plugin Name: EVE Reprocess Trading
Description: Displays trade hub mineral prices, brokerage and tax estimates based on skills and standings.
Version: 0.6.7
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

// Enhanced cache clear logic:
add_shortcode('eve_reprocess_clear_cache', function() {
    if (!current_user_can('manage_options')) return ''; // Only for admins

    $deleted = false;
    if (isset($_POST['eve_reprocess_clear_cache'])) {
        $cache_dir = plugin_dir_path(__FILE__) . 'cache/';
        if (is_dir($cache_dir)) {
            // Delete all ESI cache chunks
            foreach (glob($cache_dir . 'esi_cache_*.json') as $filename) {
                unlink($filename);
            }
            // Delete all adjusted price cache chunks
            foreach (glob($cache_dir . 'adjusted_prices_*.json') as $filename) {
                unlink($filename);
            }
            // Delete location_system_map.json
            $mapfile = $cache_dir . 'location_system_map.json';
            if (file_exists($mapfile)) unlink($mapfile);
        }
        $deleted = true;
    }
    ob_start();
    ?>
    <form method="post" style="margin:30px 0;">
        <button type="submit" name="eve_reprocess_clear_cache" onclick="return confirm('Are you sure you want to clear the plugin cache?');" style="background: #c0392b; color:#fff; font-weight:bold; padding:10px 24px; border-radius:8px; border:none; font-size:16px;">
            Clear ESI Cache
        </button>
    </form>
    <?php if ($deleted): ?>
        <div style="color:#27ae60; font-weight:bold;">All plugin caches cleared!</div>
    <?php endif; ?>
    <?php
    return ob_get_clean();
});
