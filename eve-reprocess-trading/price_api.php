<?php

// ---- DEBUG/DIAGNOSTICS (top) ----
error_reporting(E_ALL);
ini_set('display_errors','0');
if (!function_exists('ert_log_path')) {
    function ert_log_path() {
        if (function_exists('wp_upload_dir')) {
            $up = wp_upload_dir();
            $base_dir  = trailingslashit($up['basedir']) . 'eve-reprocess-trading/';
            if (!is_dir($base_dir)) @wp_mkdir_p($base_dir);
            return $base_dir . 'price_api_error.log';
        }
        return __DIR__ . '/price_api_error.log';
    }
}
if (!function_exists('ert_log')) {
    function ert_log($msg) { @file_put_contents(ert_log_path(), '['.date('c').'] '.$msg.PHP_EOL, FILE_APPEND); }
}
set_error_handler(function($severity, $message, $file, $line) {
    ert_log("PHP Error ($severity) $message at $file:$line");
    return false;
});
set_exception_handler(function($ex){
    ert_log("Uncaught Exception: " . $ex->getMessage() . " at " . $ex->getFile() . ':' . $ex->getLine());
    http_response_code(500);
    echo json_encode(['error'=>'server exception','detail'=>$ex->getMessage()]);
    exit;
});
register_shutdown_function(function(){
    $e = error_get_last();
    if ($e && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        ert_log("Fatal: {$e['message']} at {$e['file']}:{$e['line']}");
        if (!headers_sent()) {
            http_response_code(500);
            echo json_encode(['error'=>'server fatal','detail'=>$e['message']]);
        }
    }
});
// ---- END DEBUG ----

// Robust WordPress bootstrap: walk up until we find wp-load.php
$__ert_root = __DIR__;
$__ert_tried = [];
for ($__i = 0; $__i < 8; $__i++) {
    $candidate = $__ert_root . '/wp-load.php';
    $__ert_tried[] = $candidate;
    if (is_file($candidate)) { require_once $candidate; break; }
    $__ert_root = dirname($__ert_root);
}
if (!defined('ABSPATH')) {
    http_response_code(500);
    echo json_encode(['error'=>'wp-load.php not found','tried'=>$__ert_tried], JSON_UNESCAPED_SLASHES);
    exit;
}
require_once __DIR__ . '/inc/ert-bootstrap.php';
require_once __DIR__ . '/inc/ert-utils.php';

// ---- DEBUG/DIAGNOSTICS (bootstrap) ----
error_reporting(E_ALL);
ini_set('display_errors','0');

if (!function_exists('ert_log_path')) {
    function ert_log_path() {
        if (function_exists('wp_upload_dir')) {
            $up = wp_upload_dir();
            $base_dir  = trailingslashit($up['basedir']) . 'eve-reprocess-trading/';
            if (!is_dir($base_dir)) @wp_mkdir_p($base_dir);
            return $base_dir . 'price_api_error.log';
        }
        return __DIR__ . '/price_api_error.log';
    }
}
if (!function_exists('ert_log')) {
    function ert_log($msg) {
        $line = '[' . date('c') . '] ' . $msg . PHP_EOL;
        @file_put_contents(ert_log_path(), $line, FILE_APPEND);
    }
}

set_error_handler(function($severity, $message, $file, $line) {
    ert_log("PHP Error ($severity) $message at $file:$line");
    return false;
});
set_exception_handler(function($ex){
    ert_log("Uncaught Exception: " . $ex->getMessage() . " at " . $ex->getFile() . ':' . $ex->getLine());
    http_response_code(500);
    echo json_encode(['error'=>'server exception','detail'=>$ex->getMessage()]);
    exit;
});
register_shutdown_function(function(){
    $e = error_get_last();
    if ($e && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        ert_log("Fatal: {$e['message']} at {$e['file']}:{$e['line']}");
        if (!headers_sent()) {
            http_response_code(500);
            echo json_encode(['error'=>'server fatal','detail'=>$e['message']]);
        }
    }
});
// ---- END DEBUG ----




// Robust WordPress bootstrap: walk up until we find wp-load.php
$__ert_root = __DIR__;
$__ert_tried = [];
for ($__i = 0; $__i < 8; $__i++) {
    $candidate = $__ert_root . '/wp-load.php';
    $__ert_tried[] = $candidate;
    if (is_file($candidate)) { require_once $candidate; break; }
    $__ert_root = dirname($__ert_root);
}
if (!defined('ABSPATH')) {
    http_response_code(500);
    echo json_encode(['error'=>'wp-load.php not found','tried'=>$__ert_tried], JSON_UNESCAPED_SLASHES);
    exit;
}
if (!defined('ABSPATH')) {
    header('HTTP/1.1 403 Forbidden');
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Not in WP context']);
    exit;
}
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
// (moved to top)
error_reporting(E_ALL);
ini_set('display_errors','0');

function ert_log_path() {
    if (function_exists('wp_upload_dir')) {
        $up = wp_upload_dir();
        $base_dir  = trailingslashit($up['basedir']) . 'eve-reprocess-trading/';
        if (!is_dir($base_dir)) @wp_mkdir_p($base_dir);
        return $base_dir . 'price_api_error.log';
    }
    return __DIR__ . '/price_api_error.log';
}

function ert_log($msg) {
    $line = '[' . date('c') . '] ' . $msg . PHP_EOL;
    @file_put_contents(ert_log_path(), $line, FILE_APPEND);
}

set_error_handler(function($severity, $message, $file, $line) {
    ert_log("PHP Error ($severity) $message at $file:$line");
    return false; // let normal handlers run too
});

set_exception_handler(function($ex){
    ert_log("Uncaught Exception: " . $ex->getMessage() . " at " . $ex->getFile() . ':' . $ex->getLine());
    http_response_code(500);
    echo json_encode(['error'=>'server exception','detail'=>$ex->getMessage()]);
    exit;
});

register_shutdown_function(function(){
    $e = error_get_last();
    if ($e && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        ert_log("Fatal: {$e['message']} at {$e['file']}:{$e['line']}");
        if (!headers_sent()) {
            http_response_code(500);
            echo json_encode(['error'=>'server fatal','detail'=>$e['message']]);
        }
    }
});
// ---- END DEBUG ----

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cross-Origin-Resource-Policy: same-origin');
header('Permissions-Policy: geolocation=(), microphone=(), camera=()');

// Require nonce for POST to mitigate CSRF / cross-site abuse
if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    $nonce = $_SERVER['HTTP_X_WP_NONCE'] ?? '';
    if (!wp_verify_nonce($nonce, 'ert_api')) {
        http_response_code(403);
        echo json_encode(['error' => 'Bad nonce']);
        exit;
    }
}

// --- Utility for JSON output & errors ---
function json_die($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

// --- Config & Validate Input ---
$inputRaw = file_get_contents('php://input');
$input = [];
if ($inputRaw !== false && $inputRaw !== '') {
    $input = json_decode($inputRaw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON payload'], JSON_UNESCAPED_SLASHES);
        exit;
    }
}
$hubs = [
    'jita'    => ['region'=>10000002,'primary'=>30000142,'secondary'=>30000144],
    'amarr'   => ['region'=>10000043,'primary'=>30002187,'secondary'=>30003491],
    'rens'    => ['region'=>10000030,'primary'=>30002510,'secondary'=>30002526],
    'hek'     => ['region'=>10000042,'primary'=>30002053,'secondary'=>30002068],
    'dodixie' => ['region'=>10000032,'primary'=>30002659,'secondary'=>30002661],
];

$hub = strtolower($input['hub'] ?? 'jita');
$scope = ($input['includeSecondary'] ?? '') === 'yes' ? 'secondary' : 'primary';
$requestNames = $input['materials'] ?? [];

if (!isset($hubs[$hub])) json_die(['error'=>'Invalid hub'], 400);
if (!is_array($requestNames) || count($requestNames) < 1 || count($requestNames) > 50)
    json_die(['error'=>'You must request 1–50 materials per call'], 400);
foreach ($requestNames as $n)
    if (!is_string($n) || strlen($n) < 1 || strlen($n) > 80)
        json_die(['error'=>"Invalid material name: $n"], 400);

// --- Data, Paths, and Cache ---
$region_id        = $hubs[$hub]['region'];
$primary_sys_id   = $hubs[$hub]['primary'];
$secondary_sys_id = $hubs[$hub]['secondary'];
$invTypes = json_decode(file_get_contents(__DIR__ . '/data/invTypes.json'), true);
if (!is_array($invTypes)) { json_die(['error' => 'invTypes.json missing or invalid at ' . (__DIR__ . '/data/invTypes.json')], 500);}
// Only keep materials that exist in invTypes to avoid useless ESI calls
$requestNames = array_values(array_filter($requestNames, function($n) use ($invTypes) {
    return isset($invTypes[$n]['typeID']);
}));
if (!$requestNames) json_die(['error' => 'No valid materials'], 400);

$up = wp_upload_dir();
$base_dir  = trailingslashit($up['basedir']) . 'eve-reprocess-trading/';
$cache_dir = $base_dir . 'cache/';
if (!is_dir($cache_dir)) wp_mkdir_p($cache_dir);

$map_file = $cache_dir . 'location_system_map.json';
$system_map = is_file($map_file) ? json_decode(file_get_contents($map_file), true) : [];

$cache_prefix = $cache_dir . "esi_cache_{$hub}_{$scope}";
$ttl = 21600;

// --- Merge cache chunks ---
$cache = ['buy'=>[],'sell'=>[],'volumes'=>[]];
for ($i = 1; $i <= 99; $i++) {
    $file = "{$cache_prefix}_{$i}.json";
    if (is_file($file) && time() - filemtime($file) < $ttl) {
        $c = json_decode(file_get_contents($file), true);
        if (is_array($c)) foreach (['buy','sell','volumes'] as $k)
            if (!empty($c[$k])) $cache[$k] = array_merge($cache[$k], $c[$k]);
    } else break;
}
$buy = $cache['buy']; $sell = $cache['sell']; $volumes = $cache['volumes'];

// --- Find which need fetching ---
$toFetch = [];
foreach ($requestNames as $name)
    if (empty($buy[$name]) || empty($sell[$name]) || empty($volumes[$name])) {
        $toFetch[]      = $name;
        $buy[$name]     = 0;
        $sell[$name]    = 0;
        $volumes[$name] = 0;
    }

// --- Fetch util ---
function fetch_json($url) {
    if (function_exists('wp_remote_get')) {
        $resp = wp_remote_get($url, ['timeout'=>12]);
        if (is_wp_error($resp) || wp_remote_retrieve_response_code($resp) !== 200) return null;
        return json_decode(wp_remote_retrieve_body($resp), true);
    }
    $data = @file_get_contents($url);
    return $data ? json_decode($data, true) : null;
}
function resolve_system_id($loc, &$map, $pri, $sec, $scope) {
    if (isset($map[$loc])) return $map[$loc];
    if ($loc >= 1e12) return $map[$loc] = ($scope==='secondary' ? $sec : $pri);
    $info = fetch_json("https://esi.evetech.net/latest/universe/stations/{$loc}/");
    return $map[$loc] = $info['system_id'] ?? null;
}
function fetch_orders($region, $typeID) {
    $orders = []; $page = 1; $maxPages = 10;
    do {
        $u = "https://esi.evetech.net/latest/markets/{$region}/orders/?order_type=all&type_id={$typeID}&page={$page}";
        $j = fetch_json($u);
        if (!is_array($j) || empty($j)) break;
        $orders = array_merge($orders, $j);
        $page++;
        usleep(200000);
    } while (count($j) === 1000 && $page <= $maxPages);
    return $orders;
}

// --- Fetch missing market data ---
foreach ($toFetch as $name) {
    $typeID = $invTypes[$name]['typeID'] ?? null;
    if (!$typeID) continue;
    $orders = fetch_orders($region_id, $typeID);
    $bO=[]; $sO=[];
    foreach ($orders as $o) {
        $sys = resolve_system_id($o['location_id'], $system_map, $primary_sys_id, $secondary_sys_id, $scope);
        if (!$sys) continue;
        if ($scope==='primary' && $sys!==$primary_sys_id) continue;
        if ($scope==='secondary' && !in_array($sys,[$primary_sys_id,$secondary_sys_id],true)) continue;
        if ($o['is_buy_order']) $bO[] = ['price'=>$o['price'],'sys'=>$sys];
        else $sO[] = ['price'=>$o['price'],'sys'=>$sys];
    }
    $bestBuy = 0; $bestSell = INF;
    foreach ($bO as $o) if ($o['sys']===$primary_sys_id||$o['sys']===$secondary_sys_id) $bestBuy = max($bestBuy,$o['price']);
    foreach ($sO as $o) if ($o['sys']===$primary_sys_id||$o['sys']===$secondary_sys_id) $bestSell = min($bestSell,$o['price']);
    if ($bestSell===INF) $bestSell=0;
    $buy[$name]   = $bestBuy;
    $sell[$name]  = $bestSell;
    $d = fetch_json("https://esi.evetech.net/latest/markets/{$region_id}/history/?type_id={$typeID}");
    $volumes[$name] = is_array($d)&&count($d)
        ? round(array_sum(array_column(array_slice($d,-7),'volume'))/7)
        : 0;
}

// --- Save updated system map (locked) ---
@file_put_contents($map_file, json_encode($system_map, JSON_UNESCAPED_SLASHES), LOCK_EX);
chmod($map_file, 0644);

// --- Save chunks ---
function save_chunks($prefix, $cache, $limit=150) {
    $lock = fopen($prefix.'_lock','w+');
    if ($lock) {
        flock($lock,LOCK_EX);
        $keys = array_keys($cache['buy']+$cache['sell']+$cache['volumes']);
        $chunks = array_chunk($keys,$limit);
        for($i=1;$i<=99;$i++){
            $f="{$prefix}_{$i}.json";
            if (file_exists($f)) unlink($f);
        }
        foreach($chunks as $i=>$set){
            $arr=['buy'=>[],'sell'=>[],'volumes'=>[]];
            foreach($set as $m){
                if(isset($cache['buy'][$m]))    $arr['buy'][$m]=$cache['buy'][$m];
                if(isset($cache['sell'][$m]))   $arr['sell'][$m]=$cache['sell'][$m];
                if(isset($cache['volumes'][$m]))$arr['volumes'][$m]=$cache['volumes'][$m];
            }
            $file = "{$prefix}_".($i+1).".json";
            file_put_contents($file,json_encode($arr, JSON_UNESCAPED_SLASHES),LOCK_EX);
            @chmod($file, 0644);
        }
        flock($lock,LOCK_UN);
        fclose($lock);
    }
}
save_chunks($cache_prefix, ['buy'=>$buy,'sell'=>$sell,'volumes'=>$volumes]);

// --- Output response ---
$reply=['buy'=>[],'sell'=>[],'volumes'=>[]];
foreach($requestNames as $n){
    $reply['buy'][$n]     = $buy[$n]     ?? 0;
    $reply['sell'][$n]    = $sell[$n]    ?? 0;
    $reply['volumes'][$n] = $volumes[$n] ?? 0;
}

echo json_encode($reply, JSON_UNESCAPED_SLASHES);
exit;
