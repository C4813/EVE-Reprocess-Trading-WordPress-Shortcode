<?php
// Bootstrap WordPress so we can call wp_upload_dir()
require_once dirname(__DIR__, 3) . '/wp-load.php';

// Prevent direct access if wp-load.php failed to define ABSPATH
if (!defined('ABSPATH')) {
    header('HTTP/1.1 403 Forbidden');
    exit;
}

header('Content-Type: application/json');

// Use the uploads folder for cache
$upload_dir = wp_upload_dir();
$cache_dir = trailingslashit($upload_dir['basedir']) . 'eve-reprocess-trading/cache/';

// Create cache directory if it doesn't exist
if (!is_dir($cache_dir)) {
    if (!mkdir($cache_dir, 0755, true) && !is_dir($cache_dir)) {
        echo json_encode(['ok' => false, 'error' => 'Failed to create cache directory']);
        exit;
    }
}

$chunk_size = 150;
$api_url = "https://esi.evetech.net/latest/markets/prices/";
$base_path = $cache_dir . "adjusted_prices";

// Check cache freshness (file less than 24h old)
function is_cache_fresh($base_path) {
    $first_file = $base_path . "_1.json";
    return file_exists($first_file) && (time() - filemtime($first_file) < 86400);
}

// If the cache is fresh and no ?refresh=1, just say "fresh"
$refresh = isset($_GET['refresh']) && $_GET['refresh'] == 1;
if (!$refresh && is_cache_fresh($base_path)) {
    echo json_encode(['ok' => true, 'cache' => 'fresh']);
    exit;
}

// Download data from ESI
$data = @file_get_contents($api_url);
if (!$data) {
    echo json_encode(['ok' => false, 'error' => 'Failed to fetch ESI']);
    exit;
}

$arr = json_decode($data, true);
if (!is_array($arr)) {
    echo json_encode(['ok' => false, 'error' => 'Invalid ESI data']);
    exit;
}

// Remove old cache files (max 99 chunks)
for ($i = 1; $i <= 99; $i++) {
    $file = "{$base_path}_{$i}.json";
    if (file_exists($file)) {
        @unlink($file);
    }
}

// Prepare and chunk data (just price/type_id)
$out = [];
foreach ($arr as $row) {
    if (!isset($row['adjusted_price']) || !isset($row['type_id'])) continue;
    $out[] = [
        "adjusted_price" => $row['adjusted_price'],
        "average_price" => $row['average_price'] ?? 0,
        "type_id" => $row['type_id']
    ];
}
$chunks = array_chunk($out, $chunk_size);

// Write new chunked cache files
foreach ($chunks as $i => $chunk) {
    $file = "{$base_path}_" . ($i + 1) . ".json";
    $written = file_put_contents($file, json_encode($chunk));
    if ($written === false) {
        echo json_encode(['ok' => false, 'error' => "Failed to write cache file {$file}"]);
        exit;
    }
}

echo json_encode(['ok' => true, 'files' => count($chunks)]);
exit;
