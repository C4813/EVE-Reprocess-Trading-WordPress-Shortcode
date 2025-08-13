<?php
/*
Plugin Name: EVE Reprocess Trading
Description: Displays trade hub mineral prices, brokerage and tax estimates based on skills and standings.
Version: 2.1
Author: C4813
*/

defined('ABSPATH') || exit;


require_once __DIR__ . '/inc/ert-utils.php';
if (!defined('ERT_VERSION')) {
    define('ERT_VERSION', '2.0');
}

function ert_plugin_path(): string { return plugin_dir_path(__FILE__); }
function ert_plugin_url(): string  { return plugin_dir_url(__FILE__); }

/**
 * Enqueue assets (only when shortcode is used)
 */
function ert_enqueue_assets() {
    $url  = ert_plugin_url();
    $path = ert_plugin_path();

    $ver_style  = file_exists($path . 'style.css') ? filemtime($path . 'style.css') : ERT_VERSION;
    $ver_script = file_exists($path . 'script.js') ? filemtime($path . 'script.js') : ERT_VERSION;

    wp_enqueue_style('eve-reprocess-trading-style', $url . 'style.css', [], $ver_style);

    wp_enqueue_script('eve-reprocess-trading-script', $url . 'script.js', [], $ver_script, true);

    // Localize environment for JS
    $uploads = wp_upload_dir();
    wp_localize_script('eve-reprocess-trading-script', 'EVE_DATA', [
        'baseUrl'     => trailingslashit($url),
        'uploadsBase' => trailingslashit($uploads['baseurl']) . 'eve-reprocess-trading/',
        'nonce'       => wp_create_nonce('ert_api'),
    ]);
}

/**
 * Shortcode for Main UI.
 */
function eve_reprocess_trading_shortcode() {
    // Enqueue assets now (scoped)
    ert_enqueue_assets();

    // Render template
    $template = ert_plugin_path() . 'template.php';
    if (is_readable($template)) {
        ob_start();
        include $template;
        return ob_get_clean();
    }

    return '<div class="eve-reprocess-trading-error">Template not found. Please ensure <code>template.php</code> exists in the plugin folder.</div>';
}
add_shortcode('eve_reprocess_trading', 'eve_reprocess_trading_shortcode');

/**
 * Admin: Cache Clear Shortcode
 */
add_shortcode('eve_reprocess_clear_cache', function() {
    if (!current_user_can('manage_options')) return '';

    $deleted = false;
    if (
        isset($_POST['eve_reprocess_clear_cache']) &&
        isset($_POST['eve_reprocess_clear_cache_nonce']) &&
        wp_verify_nonce($_POST['eve_reprocess_clear_cache_nonce'], 'eve_reprocess_clear_cache_action')
    ) {
        $upload_dir = wp_upload_dir();
        $base_dir   = trailingslashit($upload_dir['basedir']) . 'eve-reprocess-trading/';
        $cache_dir  = $base_dir . 'cache/';

        if (is_dir($cache_dir)) {
            foreach (glob($cache_dir . '*.json') as $filename) {
                @unlink($filename);
            }
        }
        $deleted = true;
    }

    ob_start(); 
// --- First-run adjusted prices cache builder ---
add_action('init', function () {
    if (!function_exists('wp_upload_dir')) return;
    $up = wp_upload_dir();
    $base_dir  = trailingslashit($up['basedir']) . 'eve-reprocess-trading/';
    $cache_dir = $base_dir . 'cache/';
    // If cache dir or first chunk is missing, kick the builder once (non-blocking best-effort)
    $first_chunk = $cache_dir . 'adjusted_prices_1.json';
    if (!file_exists($first_chunk)) {
        $url = plugins_url('adjusted_prices.php?refresh=1', __FILE__);
        // fire and forget
        wp_remote_get($url, ['timeout' => 5, 'blocking' => false, 'sslverify' => false]);
    }
}, 20);

?>
    <form method="post" class="mt-24">
        <?php wp_nonce_field('eve_reprocess_clear_cache_action', 'eve_reprocess_clear_cache_nonce'); 
// --- First-run adjusted prices cache builder ---
add_action('init', function () {
    if (!function_exists('wp_upload_dir')) return;
    $up = wp_upload_dir();
    $base_dir  = trailingslashit($up['basedir']) . 'eve-reprocess-trading/';
    $cache_dir = $base_dir . 'cache/';
    // If cache dir or first chunk is missing, kick the builder once (non-blocking best-effort)
    $first_chunk = $cache_dir . 'adjusted_prices_1.json';
    if (!file_exists($first_chunk)) {
        $url = plugins_url('adjusted_prices.php?refresh=1', __FILE__);
        // fire and forget
        wp_remote_get($url, ['timeout' => 5, 'blocking' => false, 'sslverify' => false]);
    }
}, 20);

?>
        <button type="submit" name="eve_reprocess_clear_cache"
            class="eve-btn eve-cache-clear-btn"
            onclick="return confirm('Are you sure you want to clear the plugin cache?');">
            Clear ESI Cache
        </button>
    </form>
    <?php if ($deleted): 
// --- First-run adjusted prices cache builder ---
add_action('init', function () {
    if (!function_exists('wp_upload_dir')) return;
    $up = wp_upload_dir();
    $base_dir  = trailingslashit($up['basedir']) . 'eve-reprocess-trading/';
    $cache_dir = $base_dir . 'cache/';
    // If cache dir or first chunk is missing, kick the builder once (non-blocking best-effort)
    $first_chunk = $cache_dir . 'adjusted_prices_1.json';
    if (!file_exists($first_chunk)) {
        $url = plugins_url('adjusted_prices.php?refresh=1', __FILE__);
        // fire and forget
        wp_remote_get($url, ['timeout' => 5, 'blocking' => false, 'sslverify' => false]);
    }
}, 20);

?>
        <div class="eve-cache-success">All plugin caches cleared!</div>
    <?php endif;
    return ob_get_clean();
});

/**
 * Activation: create cache folders and drop guard files
 */
function eve_reprocess_create_cache_folder() {
    $upload_dir = wp_upload_dir();
    $base = trailingslashit($upload_dir['basedir']) . 'eve-reprocess-trading/';
    $cache = $base . 'cache/';
    wp_mkdir_p($cache);

    // Guard files to prevent indexing/execution
    @file_put_contents($base . 'index.html', '');
    @file_put_contents($cache . 'index.html', '');
    @file_put_contents($base . '.htaccess', "Options -Indexes\n<FilesMatch \"\\.(php|phtml|php5)$\">\n  Deny from all\n</FilesMatch>\n");
    @chmod($base . 'index.html', 0644);
    @chmod($cache . 'index.html', 0644);
    @chmod($base . '.htaccess', 0644);
}
register_activation_hook(__FILE__, 'eve_reprocess_create_cache_folder');

/**
 * Uninstall: remove plugin cache directory and base folder (safely).
 */
function ert_plugin_uninstall() {
    // Resolve uploads base and our plugin subfolder
    $upload_dir = wp_upload_dir();
    $uploads_base = trailingslashit($upload_dir['basedir']);
    $base  = $uploads_base . 'eve-reprocess-trading/';
    $cache = $base . 'cache/';

    // Safety: only delete paths inside uploads base
    $rp_uploads = realpath($uploads_base);
    $rp_base    = realpath($base);
    $rp_cache   = realpath($cache);

    // Abort if uploads base is not resolvable
    if (!$rp_uploads) {
        return;
    }

    // Helper: ensure $path is inside uploads
    $inside_uploads = static function($path) use ($rp_uploads) {
        $rp = $path ? realpath($path) : false;
        return ($rp && strpos($rp, $rp_uploads) === 0);
    };

    // Helper: recursive delete limited to uploads subtree
    $safe_rrmdir = static function($dir) use (&$safe_rrmdir, $inside_uploads) {
        if (!$inside_uploads($dir) || !is_dir($dir)) return;
        $items = scandir($dir);
        if ($items === false) return;
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') continue;
            $path = $dir . DIRECTORY_SEPARATOR . $item;
            if (is_dir($path)) {
                $safe_rrmdir($path);
            } elseif (is_file($path)) {
                // Only unlink if path is inside uploads
                if ($inside_uploads($path)) {
                    @unlink($path);
                }
            }
        }
        // Remove the directory itself (still inside uploads)
        if ($inside_uploads($dir)) {
            @rmdir($dir);
        }
    };

    // Remove cache directory first
    if ($rp_cache && strpos($rp_cache, $rp_uploads) === 0) {
        $safe_rrmdir($rp_cache);
    }

    // Remove guard files (defensive checks)
    if ($rp_base && strpos($rp_base, $rp_uploads) === 0) {
        @unlink($rp_base . DIRECTORY_SEPARATOR . 'index.html');
        @unlink($rp_base . DIRECTORY_SEPARATOR . '.htaccess');

        // Finally try to remove the (now-empty) base folder
        @rmdir($rp_base);
    }
}
register_uninstall_hook(__FILE__, 'ert_plugin_uninstall');

/**
 * Optional: AJAX endpoint stub (admin only).
 */
add_action('wp_ajax_eve_reprocess_refresh_cache', 'eve_reprocess_refresh_cache_handler');
function eve_reprocess_refresh_cache_handler() {
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Unauthorized');
    }
    $result = eve_reprocess_refresh_cache();
    wp_send_json_success($result);
}
function eve_reprocess_refresh_cache() {
    // Implement cache refresh if desired
    return ['ok' => true, 'msg' => 'Cache refresh not implemented'];
}
