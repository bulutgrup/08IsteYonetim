<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$token = $_REQUEST['token'] ?? '';

if (empty($token)) {
    echo json_encode(["status" => "error", "message" => "Token is required"]);
    exit;
}

$apiKey = "VaI359vu5GfPj2WStETiEQVPXnRreJkv";
$secretKey = "Bsy7cE6t6FmcXUpQvdVNvw8hsLIC61GT";

// Dynamically determine baseUrl (sandbox vs live) based on apiKey format
$isSandbox = (strpos($apiKey, 'sandbox-') === 0);
$baseUrl = $isSandbox ? "https://sandbox-api.iyzipay.com" : "https://api.iyzipay.com";

$payload = [
    "locale" => "tr",
    "conversationId" => uniqid(),
    "token" => $token
];

$body = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
$uri = "/payment/iyzipos/checkoutform/auth/ecom/detail";
$rnd = bin2hex(random_bytes(8));

// iyzico V2 Signature generation
$hashString = $rnd . $uri . $body;
$signature = hash_hmac('sha256', $hashString, $secretKey); // hex output

// Authorization header format: IYZWSv2 base64("apiKey:APIKEY&randomKey:RND&signature:SIGNATURE")
$authString = "apiKey:" . $apiKey . "&randomKey:" . $rnd . "&signature:" . $signature;
$authorization = base64_encode($authString);

$headers = [
    "Authorization: IYZWSv2 " . $authorization,
    "x-iyzi-rnd: " . $rnd,
    "Content-Type: application/json",
    "Accept: application/json"
];

$ch = curl_init($baseUrl . $uri);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
if (curl_errno($ch)) {
    echo json_encode(["status" => "error", "message" => "cURL error: " . curl_error($ch)]);
    curl_close($ch);
    exit;
}
curl_close($ch);

$result = json_decode($response, true);

if (isset($result['status']) && $result['status'] === 'success' && isset($result['paymentStatus']) && $result['paymentStatus'] === 'SUCCESS') {
    // Payment was successful!
    // Parse basketId: tenantId:planType:billingCycle
    $basketId = $result['basketId'] ?? '';
    $parts = explode(':', $basketId);
    
    $tenantId = $parts[0] ?? '';
    $planType = $parts[1] ?? 'deneme';
    $billingCycle = $parts[2] ?? 'monthly';
    
    echo json_encode([
        "status" => "success",
        "tenant_id" => $tenantId,
        "plan_type" => $planType,
        "billing_cycle" => $billingCycle,
        "amount" => $result['paidPrice'] ?? ''
    ]);
} else {
    // Payment failed or is pending
    $errorMessage = $result['errorMessage'] ?? 'Payment failed or token is invalid';
    echo json_encode([
        "status" => "error",
        "message" => $errorMessage,
        "raw" => $result
    ]);
}
