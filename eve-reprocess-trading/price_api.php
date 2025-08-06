<?php
// Bootstrap WordPress so we can call wp_upload_dir()
require_once dirname(__DIR__, 3) . '/wp-load.php';

// Prevent direct access if wp-load.php failed to define ABSPATH
if ( ! defined( 'ABSPATH' ) ) {
    header('HTTP/1.1 403 Forbidden');
    exit;
}

header('Content-Type: application/json');

$input = json_decode( file_get_contents('php://input'), true );
$hub   = strtolower( $input['hub']           ?? 'jita' );
$scope = ( $input['includeSecondary'] === 'yes' ) ? 'secondary' : 'primary';
$requestNames = $input['materials'] ?? [];

// hub → region/system mapping
$map = [
    'jita'    => ['region'=>10000002,'primary'=>30000142,'secondary'=>30000144],
    'amarr'   => ['region'=>10000043,'primary'=>30002187,'secondary'=>30003491],
    'rens'    => ['region'=>10000030,'primary'=>30002510,'secondary'=>30002526],
    'hek'     => ['region'=>10000042,'primary'=>30002053,'secondary'=>30002068],
    'dodixie' => ['region'=>10000032,'primary'=>30002659,'secondary'=>30002661],
];

if ( ! isset( $map[$hub] ) ) {
    http_response_code(400);
    echo json_encode(['error'=>'Invalid hub']);
    exit;
}

$region_id      = $map[$hub]['region'];
$primary_sys_id = $map[$hub]['primary'];
$secondary_sys_id = $map[$hub]['secondary'];

$invTypes = json_decode( file_get_contents( __DIR__ . '/invTypes.json' ), true );

// Use uploads folder for cache
$up = wp_upload_dir();
$cache_dir = trailingslashit( $up['basedir'] ) . 'eve-reprocess-trading/cache/';
if ( ! is_dir( $cache_dir ) ) {
    mkdir( $cache_dir, 0755, true );
}

// load or init location→system map
$map_file    = $cache_dir . 'location_system_map.json';
$system_map  = is_file($map_file)
    ? json_decode( file_get_contents($map_file), true )
    : [];

// prefix for chunked cache
$cache_prefix = $cache_dir . "esi_cache_{$hub}_{$scope}";
$ttl          = 86400; // 24h

// merge all existing cache chunks
$cache = ['buy'=>[],'sell'=>[],'volumes'=>[]];
for ( $i = 1; $i <= 99; $i++ ) {
    $file = "{$cache_prefix}_{$i}.json";
    if ( is_file($file) && time() - filemtime($file) < $ttl ) {
        $c = json_decode( file_get_contents($file), true );
        if ( is_array($c) ) {
            foreach ( ['buy','sell','volumes'] as $k ) {
                if ( ! empty($c[$k]) ) {
                    $cache[$k] = array_merge( $cache[$k], $c[$k] );
                }
            }
        }
    } else {
        break;
    }
}

$buy     = $cache['buy'];
$sell    = $cache['sell'];
$volumes = $cache['volumes'];

// figure out which materials still need fresh data
$toFetch = [];
foreach ( $requestNames as $name ) {
    if ( empty($buy[$name]) || empty($sell[$name]) || empty($volumes[$name]) ) {
        $toFetch[]    = $name;
        $buy[$name]   = 0;
        $sell[$name]  = 0;
        $volumes[$name] = 0;
    }
}

// resolve system_id for a location (caches in $system_map)
function resolve_system_id($loc, &$map, $pri, $sec, $scope) {
    if ( isset($map[$loc]) ) return $map[$loc];
    if ( $loc >= 1e12 ) {
        // player structure → assume primary or secondary
        $map[$loc] = ($scope==='secondary') ? $sec : $pri;
        return $map[$loc];
    }
    $info = @file_get_contents("https://esi.evetech.net/latest/universe/stations/{$loc}/");
    $j = json_decode($info,true);
    $map[$loc] = $j['system_id'] ?? null;
    return $map[$loc];
}

// fetch market orders
function fetch_orders($region, $typeID) {
    $orders=[]; $page=1;
    do {
        $u = "https://esi.evetech.net/latest/markets/{$region}/orders/?order_type=all&type_id={$typeID}&page={$page}";
        $b = @file_get_contents($u);
        $j = json_decode($b,true);
        if ( ! is_array($j) || empty($j) ) break;
        $orders = array_merge($orders,$j);
        $page++;
        usleep(200000);
    } while (count($j)===1000);
    return $orders;
}

// pull in any missing materials
foreach ( $toFetch as $name ) {
    $typeID = $invTypes[$name]['typeID'] ?? null;
    if ( ! $typeID ) {
        continue;
    }
    $orders = fetch_orders($region_id, $typeID);
    $bO=[]; $sO=[];
    foreach ( $orders as $o ) {
        $sys = resolve_system_id($o['location_id'], $system_map, $primary_sys_id, $secondary_sys_id, $scope);
        if ( ! $sys ) continue;
        if ( $scope==='primary' && $sys!==$primary_sys_id ) continue;
        if ( $scope==='secondary' && !in_array($sys,[$primary_sys_id,$secondary_sys_id],true) ) continue;
        if ( $o['is_buy_order'] ) {
            $bO[] = ['price'=>$o['price'],'sys'=>$sys];
        } else {
            $sO[] = ['price'=>$o['price'],'sys'=>$sys];
        }
    }
    // pick best buy/sell
    $bestBuy  = 0;
    $bestSell = INF;
    foreach ( $bO as $o ) if ($o['sys']===$primary_sys_id||$o['sys']===$secondary_sys_id) {
        $bestBuy = max($bestBuy,$o['price']);
    }
    foreach ( $sO as $o ) if ($o['sys']===$primary_sys_id||$o['sys']===$secondary_sys_id) {
        $bestSell = min($bestSell,$o['price']);
    }
    if ( $bestSell===INF ) $bestSell=0;
    $buy[$name]   = $bestBuy;
    $sell[$name]  = $bestSell;
    // 7-day volume
    $h = @file_get_contents("https://esi.evetech.net/latest/markets/{$region_id}/history/?type_id={$typeID}");
    $d = json_decode($h,true);
    $volumes[$name] = is_array($d)&&count($d)
        ? round(array_sum(array_column(array_slice($d,-7),'volume'))/7)
        : 0;
}

// persist updated station→system map
file_put_contents($map_file, json_encode($system_map));

// save chunked cache back out
function save_chunks($prefix, $cache, $limit=150) {
    $lock = fopen($prefix.'_lock','w+');
    if ( $lock ) {
        flock($lock,LOCK_EX);
        $keys = array_keys($cache['buy']+$cache['sell']+$cache['volumes']);
        $chunks = array_chunk($keys,$limit);
        for($i=1;$i<=99;$i++){
            @unlink("{$prefix}_{$i}.json");
        }
        foreach($chunks as $i=>$set){
            $arr=['buy'=>[],'sell'=>[],'volumes'=>[]];
            foreach($set as $m){
                if(isset($cache['buy'][$m]))   $arr['buy'][$m]=$cache['buy'][$m];
                if(isset($cache['sell'][$m]))  $arr['sell'][$m]=$cache['sell'][$m];
                if(isset($cache['volumes'][$m]))$arr['volumes'][$m]=$cache['volumes'][$m];
            }
            file_put_contents("{$prefix}_".($i+1).".json",json_encode($arr));
        }
        flock($lock,LOCK_UN);
        fclose($lock);
    }
}
save_chunks($cache_prefix, ['buy'=>$buy,'sell'=>$sell,'volumes'=>$volumes]);

// build and send reply
$reply=['buy'=>[],'sell'=>[],'volumes'=>[]];
foreach($requestNames as $n){
    $reply['buy'][$n]     = $buy[$n]     ?? 0;
    $reply['sell'][$n]    = $sell[$n]    ?? 0;
    $reply['volumes'][$n] = $volumes[$n] ?? 0;
}

echo json_encode($reply);
exit;
