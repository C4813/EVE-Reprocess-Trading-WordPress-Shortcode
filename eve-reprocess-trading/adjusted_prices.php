<?php
header('Content-Type: application/json');
$cache_dir = __DIR__ . '/cache/';
if (!is_dir($cache_dir)) mkdir($cache_dir);

$chunk_size = 150;
$api_url = "https://esi.evetech.net/latest/markets/prices/";
$base_path = $cache_dir . "adjusted_prices";

// Check cache
function is_cache_fresh($base_path) {
    $first_file = $base_path . "_1.json";
    return file_exists($first_file) && (time() - filemtime($first_file) < 86400);
}

// Handle clear/refresh
$refresh = isset($_GET['refresh']) && $_GET['refresh'] == 1;
if (!$refresh && is_cache_fresh($base_path)) {
    echo json_encode(['ok'=>true, 'cache'=>'fresh']);
    exit;
}

// Download ESI
$data = @file_get_contents($api_url);
if (!$data) {
    echo json_encode(['ok'=>false, 'error'=>'Failed to fetch ESI']);
    exit;
}
$arr = json_decode($data, true);
if (!is_array($arr)) {
    echo json_encode(['ok'=>false, 'error'=>'Invalid ESI data']);
    exit;
}

// Remove old
for ($i=1; $i<=99; $i++) {
    $f = "{$base_path}_{$i}.json";
    if (file_exists($f)) unlink($f);
}

// Format & split
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
foreach ($chunks as $i => $chunk) {
    $file = "{$base_path}_" . ($i+1) . ".json";
    file_put_contents($file, json_encode($chunk));
}

echo json_encode(['ok'=>true, 'files'=>count($chunks)]);
?>
