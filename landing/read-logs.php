<?php
header('Content-Type: application/json');

$key = $_GET['key'] ?? '';
if ($key !== 'debug123') {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$callbackLogFile = __DIR__ . '/iyzico-callback-debug.log';
$apiLogFile = __DIR__ . '/iyzico-debug.log';

$data = [
    "callback_logs" => [],
    "api_logs" => []
];

if (file_exists($callbackLogFile)) {
    $content = file_get_contents($callbackLogFile);
    $data["callback_logs"] = array_filter(explode("\n---\n", $content));
}

if (file_exists($apiLogFile)) {
    $content = file_get_contents($apiLogFile);
    $data["api_logs"] = array_filter(explode("\n---\n", $content));
}

echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
