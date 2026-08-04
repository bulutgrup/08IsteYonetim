<?php
// iyzico callback script

$logData = [
    "timestamp" => date("Y-m-d H:i:s"),
    "get" => $_GET,
    "post" => $_POST
];
@file_put_contents(__DIR__ . '/iyzico-callback-debug.log', json_encode($logData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n---\n", FILE_APPEND);

$token = $_POST['token'] ?? '';
$status = $_POST['status'] ?? '';

// If the transaction is successful, redirect to the success route of our web panel.
// We redirect to panel.isteyonetim.com in production, or if in localhost test, we can use localhost.
// To make it dynamic, we can redirect to panel.isteyonetim.com. 
// If we want to support both local and production tests, we can check the HTTP referrer or use the standard panel domain.
// Parse dynamic host parameter from query string
$host = $_GET['host'] ?? 'cpis.isteyonetim.com';

// Prevent open redirect vulnerabilities by validating allowed hosts/patterns
if ($host !== 'cpis.isteyonetim.com' && $host !== 'panel.isteyonetim.com' && strpos($host, 'localhost') !== 0 && strpos($host, '127.0.0.1') !== 0) {
    $host = 'cpis.isteyonetim.com';
}

$protocol = (strpos($host, 'localhost') === 0 || strpos($host, '127.0.0.1') === 0) ? 'http://' : 'https://';
$panelUrl = $protocol . $host . "/upgrade";

if (!empty($token)) {
    header("Location: " . $panelUrl . "?status=success&token=" . urlencode($token));
} else {
    header("Location: " . $panelUrl . "?status=error");
}
exit;
