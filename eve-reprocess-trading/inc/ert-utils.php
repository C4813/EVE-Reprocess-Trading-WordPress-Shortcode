<?php
// EVE Reprocess Trading - shared utilities

if (!function_exists('ert_trailingslashit')) {
    function ert_trailingslashit($string) {
        return rtrim($string, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
    }
}

if (!function_exists('ert_ensure_dir')) {
    function ert_ensure_dir($dir) {
        if (is_dir($dir)) return true;
        return mkdir($dir, 0755, true) && is_dir($dir);
    }
}

if (!function_exists('ert_safe_write_json')) {
    function ert_safe_write_json($file, $data) {
        $json = json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);
        if ($json === false) return false;
        $ok = @file_put_contents($file, $json, LOCK_EX);
        if ($ok === false) return false;
        @chmod($file, 0644);
        return true;
    }
}

if (!function_exists('ert_is_fresh')) {
    function ert_is_fresh($path_pattern_or_file, $ttl) {
        $list = glob($path_pattern_or_file) ?: [];
        if (!$list) return false;
        $latest = 0;
        foreach ($list as $f) {
            $t = @filemtime($f);
            if ($t && $t > $latest) $latest = $t;
        }
        if ($latest === 0) return false;
        return (time() - $latest) < $ttl;
    }
}

if (!function_exists('ert_throttle_touch_ok')) {
    function ert_throttle_touch_ok($throttle_file, $window_seconds) {
        if (file_exists($throttle_file) && (time() - filemtime($throttle_file)) < $window_seconds) {
            return false;
        }
        @file_put_contents($throttle_file, (string) time());
        chmod($throttle_file, 0644);
        return true;
    }
}

if (!function_exists('ert_collect_cached_chunks')) {
    function ert_collect_cached_chunks($pattern) {
        $chunks = [];
        foreach (glob($pattern) as $file) {
            $data = @json_decode(@file_get_contents($file), true);
            if (is_array($data)) $chunks = array_merge($chunks, $data);
        }
        return $chunks;
    }
}

if (!function_exists('ert_create_guards')) {
    function ert_create_guards($base) {
        @file_put_contents($base . 'index.html', '');
        @file_put_contents($base . '.htaccess', "Options -Indexes\n<FilesMatch \"\\.(php|phtml|php5)$\">\\n  Deny from all\\n</FilesMatch>\\n");
        @chmod($base . 'index.html', 0644);
        @chmod($base . '.htaccess', 0644);
    }
}

if (!function_exists('ert_update_system_map')) {
    function ert_update_system_map($map_file, $map_array) {
        $json = json_encode($map_array, JSON_UNESCAPED_SLASHES|JSON_PRETTY_PRINT);
        if ($json === false) return false;
        $ok = @file_put_contents($map_file, $json, LOCK_EX);
        if ($ok === false) return false;
        chmod($map_file, 0644);
        return true;
    }
}
