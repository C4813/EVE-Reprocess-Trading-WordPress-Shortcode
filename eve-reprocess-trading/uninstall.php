<?php
if (!defined('WP_UNINSTALL_PLUGIN')) { exit; }
$upload_dir = wp_upload_dir();
$plugin_upload_path = trailingslashit($upload_dir['basedir']) . 'eve-reprocess-trading/';
function ert_rrmdir($dir) {
    if (!is_dir($dir)) return;
    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($it as $file) {
        $file->isDir() ? @rmdir($file->getRealPath()) : @unlink($file->getRealPath());
    }
    @rmdir($dir);
}
ert_rrmdir($plugin_upload_path);
