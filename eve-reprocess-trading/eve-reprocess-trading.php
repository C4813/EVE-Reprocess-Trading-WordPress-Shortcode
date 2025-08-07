<?php
/*
Plugin Name: EVE Reprocess Trading
Description: Displays trade hub mineral prices, brokerage and tax estimates based on skills and standings.
Version: 0.7.3
Author: C4813
*/

defined('ABSPATH') || exit;

// ---- Shortcode for Main UI ----
function eve_reprocess_trading_shortcode() {
    // Load static mineral data (never shown to user, but forces plugin files to load on page)
    $invTypes = json_decode(file_get_contents(__DIR__ . '/invTypes.json'), true);

    // Enqueue plugin assets
    wp_enqueue_style('eve-reprocess-trading-style', plugin_dir_url(__FILE__) . 'style.css');
    wp_enqueue_script('eve-reprocess-trading-script', plugin_dir_url(__FILE__) . 'script.js', [], false, true);

    // Localize hub data to JS
    wp_localize_script('eve-reprocess-trading-script', 'EVE_DATA', [
        'factionCorpMap' => [
            'Jita'     => ['faction' => 'Caldari State',      'corp' => 'Caldari Navy'],
            'Amarr'    => ['faction' => 'Amarr Empire',       'corp' => 'Emperor Family'],
            'Dodixie'  => ['faction' => 'Gallente Federation','corp' => 'Federation Navy'],
            'Hek'      => ['faction' => 'Minmatar Republic',  'corp' => 'Boundless Creations'],
            'Rens'     => ['faction' => 'Minmatar Republic',  'corp' => 'Brutor Tribe'],
        ]
    ]);

    ob_start();
    include plugin_dir_path(__FILE__) . 'template.php';
    return ob_get_clean();
}
add_shortcode('eve_reprocess_trading', 'eve_reprocess_trading_shortcode');

// ---- Admin: Cache Clear Shortcode ----
add_shortcode('eve_reprocess_clear_cache', function() {
    if (!current_user_can('manage_options')) return '';
    $deleted = false;
    if (
        isset($_POST['eve_reprocess_clear_cache']) &&
        isset($_POST['eve_reprocess_clear_cache_nonce']) &&
        wp_verify_nonce($_POST['eve_reprocess_clear_cache_nonce'], 'eve_reprocess_clear_cache_action')
    ) {
        $upload_dir = wp_upload_dir();
        $cache_dir = trailingslashit($upload_dir['basedir']) . 'eve-reprocess-trading/cache/';
        if (is_dir($cache_dir)) {
            foreach (glob($cache_dir . '*.json') as $filename) @unlink($filename);
        }
        $deleted = true;
    }

    ob_start(); ?>
    <form method="post" style="margin:30px 0;">
        <?php wp_nonce_field('eve_reprocess_clear_cache_action', 'eve_reprocess_clear_cache_nonce'); ?>
        <button type="submit" name="eve_reprocess_clear_cache"
            class="eve-btn eve-cache-clear-btn"
            onclick="return confirm('Are you sure you want to clear the plugin cache?');">
            Clear ESI Cache
        </button>
    </form>
    <?php if ($deleted): ?>
        <div class="eve-cache-success">All plugin caches cleared!</div>
    <?php endif;
    return ob_get_clean();
});

// ---- Create cache folders on activation ----
register_activation_hook(__FILE__, 'eve_reprocess_create_cache_folder');
function eve_reprocess_create_cache_folder() {
    $upload_dir = wp_upload_dir();
    $base = trailingslashit($upload_dir['basedir']) . 'eve-reprocess-trading/';
    wp_mkdir_p($base . 'cache/');
}

// ---- Optional: AJAX endpoint stub ----
add_action('wp_ajax_eve_reprocess_refresh_cache', 'eve_reprocess_refresh_cache_handler');
function eve_reprocess_refresh_cache_handler() {
    if (!current_user_can('manage_options')) wp_send_json_error('Unauthorized');
    $result = eve_reprocess_refresh_cache();
    wp_send_json_success($result);
}
function eve_reprocess_refresh_cache() {
    // Implement cache refresh if desired
    return ['ok' => true, 'msg' => 'Cache refresh not implemented'];
}
