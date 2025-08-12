<?php
// EVE Reprocess Trading - bootstrap (headers + WP context)

// Bootstrap WordPress for wp_upload_dir() and nonce utilities
if (!defined('ABSPATH')) {
    header('HTTP/1.1 403 Forbidden');
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'Not in WP context'], JSON_UNESCAPED_SLASHES);
    exit;
}

// Uniform security headers
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('Cross-Origin-Resource-Policy: same-origin');
header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

// No global nonce check here because adjusted_prices.php is intentionally public read.
// price_api.php performs its own POST nonce validation to avoid behavior changes.
