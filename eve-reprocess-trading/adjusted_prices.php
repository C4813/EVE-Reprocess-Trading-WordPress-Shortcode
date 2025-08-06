<?php
// Bootstrap WordPress for wp_upload_dir()
require_once dirname(__DIR__, 3) . '/wp-load.php';
if (!defined('ABSPATH')) {
    header('HTTP/1.1 403 Forbidden');
    exit;
}

header('Content-Type: application/json');

// Helper in case trailingslashit() is not defined
if (!function_exists('trailingslashit')) {
    function trailingslashit($string) {
        return rtrim($string, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
    }
}

// --- Cache setup ---
$upload_dir = wp_upload_dir();
$cache_dir = trailingslashit($upload_dir['basedir']) . 'eve-reprocess-trading' . DIRECTORY_SEPARATOR . 'cache' . DIRECTORY_SEPARATOR;
$chunk_size = 150;
$api_url = "https://esi.evetech.net/latest/markets/prices/";
$base_path = $cache_dir . "adjusted_prices";

// Ensure cache directory exists
if (!is_dir($cache_dir)) {
    if (!mkdir($cache_dir, 0755, true) && !is_dir($cache_dir)) {
        echo json_encode(['ok' => false, 'error' => 'Failed to create cache directory']);
        exit;
    }
}

// --- Helper: Check cache freshness ---
function is_cache_fresh($base_path) {
    $first_file = $base_path . "_1.json";
    return file_exists($first_file) && (time() - filemtime($first_file) < 86400);
}

// --- Helper: Read all cache chunks as array-of-arrays ---
function read_all_cache_chunks($base_path) {
    $chunks = [];
    for ($i = 1; $i <= 99; $i++) {
        $file = "{$base_path}_{$i}.json";
        if (file_exists($file)) {
            $data = json_decode(file_get_contents($file), true);
            if (is_array($data)) $chunks[] = $data;
        } else {
            break;
        }
    }
    return $chunks;
}

// --- Main logic ---
$refresh = isset($_GET['refresh']) && $_GET['refresh'] == 1;

if (!$refresh && is_cache_fresh($base_path)) {
    // Cache is fresh, return all cached data in one response
    $chunks = read_all_cache_chunks($base_path);
    echo json_encode(['ok' => true, 'cache' => 'fresh', 'data' => $chunks]);
    exit;
}

// --- Need to refresh from ESI ---
$data = @file_get_contents($api_url);
if (!$data) {
    // Try to fallback to stale cache if possible
    $chunks = read_all_cache_chunks($base_path);
    if (!empty($chunks)) {
        echo json_encode(['ok' => false, 'error' => 'Failed to fetch ESI, using stale cache', 'data' => $chunks]);
    } else {
        echo json_encode(['ok' => false, 'error' => 'Failed to fetch ESI and no cache']);
    }
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

// Prepare and chunk data (just price/type_id/average_price)
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
    $written = file_put_contents($file, json_encode($chunk, JSON_PRETTY_PRINT), LOCK_EX);
    if ($written === false) {
        echo json_encode(['ok' => false, 'error' => "Failed to write cache file {$file}"]);
        exit;
    }
    @chmod($file, 0644);
}

// Respond with the full chunked data
echo json_encode(['ok' => true, 'cache' => 'updated', 'data' => $chunks]);
exit;
