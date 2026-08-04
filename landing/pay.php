<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Read JSON input
$input = json_decode(file_get_contents('php://input'), true);

$apiKey = "VaI359vu5GfPj2WStETiEQVPXnRreJkv";
$secretKey = "Bsy7cE6t6FmcXUpQvdVNvw8hsLIC61GT";

// Dynamically determine baseUrl (sandbox vs live) based on apiKey format
$isSandbox = (strpos($apiKey, 'sandbox-') === 0);
$baseUrl = $isSandbox ? "https://sandbox-api.iyzipay.com" : "https://api.iyzipay.com";

// Determine plan details
$planType = $input['plan_type'] ?? 'deneme';
$billingCycle = $input['billing_cycle'] ?? 'monthly';
$tenantId = $input['tenant_id'] ?? '';

// Sanitize Email (ensure valid format)
$buyerEmail = trim($input['buyer_email'] ?? '');
if (empty($buyerEmail) || !filter_var($buyerEmail, FILTER_VALIDATE_EMAIL)) {
    $buyerEmail = 'test@isteyonetim.com';
}

// Sanitize Name and Surname (ensure they are not empty)
$buyerName = trim($input['buyer_name'] ?? '');
$buyerSurname = trim($input['buyer_surname'] ?? '');
if (empty($buyerName)) {
    $buyerName = 'Fatih';
}
if (empty($buyerSurname)) {
    $buyerSurname = 'Akyildiz';
}

// Sanitize Phone Number to ensure international gsm format "+905XXXXXXXXX" without spaces or leading zeros
$buyerPhoneRaw = $input['buyer_phone'] ?? '+905321234567';
$buyerPhoneDigits = preg_replace('/[^0-9]/', '', $buyerPhoneRaw);

if (substr($buyerPhoneDigits, 0, 2) === '00') {
    $buyerPhoneDigits = substr($buyerPhoneDigits, 2);
}
if (substr($buyerPhoneDigits, 0, 2) === '90') {
    $buyerPhoneDigits = substr($buyerPhoneDigits, 2);
}
if (substr($buyerPhoneDigits, 0, 1) === '0') {
    $buyerPhoneDigits = substr($buyerPhoneDigits, 1);
}

if (strlen($buyerPhoneDigits) === 10 && substr($buyerPhoneDigits, 0, 1) === '5') {
    $buyerPhone = '+90' . $buyerPhoneDigits;
} else {
    $buyerPhone = '+905321234567'; // Safe default test fallback
}

// Sanitize IP address (must be valid IPv4)
$ip = $_SERVER['REMOTE_ADDR'] ?? "85.34.78.112";
if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
    $ip = "85.34.78.112"; // Fallback to a real Turkish IP address if local/IPv6
}

// Prices
$price = 1.0;
if ($planType === 'deneme') {
    $price = 1.0;
} elseif ($planType === 'kobi') {
    $price = ($billingCycle === 'yearly') ? 2990.0 : 299.0;
} elseif ($planType === 'profesyonel') {
    $price = ($billingCycle === 'yearly') ? 4990.0 : 499.0;
}

// Format price with standard two decimal places (e.g. 1.00, 2990.00)
$priceStr = number_format($price, 2, '.', '');

$conversationId = uniqid();
// Store tenant_id, plan_type and cycle inside basketId separated by colons
$basketId = $tenantId . ':' . $planType . ':' . $billingCycle;

// Callback URL pointing to iyzico-callback.php with dynamic host parameter
$clientHost = $input['host'] ?? 'cpis.isteyonetim.com';
$callbackUrl = "https://isteyonetim.com/iyzico-callback.php?host=" . urlencode($clientHost);

$payload = [
    "locale" => "tr",
    "conversationId" => $conversationId,
    "price" => $priceStr,
    "paidPrice" => $priceStr,
    "currency" => "TRY",
    "basketId" => $basketId,
    "paymentGroup" => "PRODUCT",
    "callbackUrl" => $callbackUrl,
    "enabledInstallments" => [1],
    "buyer" => [
        "id" => $tenantId ?: "guest",
        "name" => $buyerName,
        "surname" => $buyerSurname,
        "gsmNumber" => $buyerPhone,
        "email" => $buyerEmail,
        "identityNumber" => "11111111111",
        "lastLoginDate" => date("Y-m-d H:i:s"),
        "registrationDate" => date("Y-m-d H:i:s"),
        "registrationAddress" => "Mustafa Kemal Mah. Maidan Is Merkezi 4C Blok No:140 Cankaya",
        "ip" => $ip,
        "city" => "Ankara",
        "country" => "Turkey",
        "zipCode" => "06510"
    ],
    "shippingAddress" => [
        "contactName" => $buyerName . " " . $buyerSurname,
        "city" => "Ankara",
        "country" => "Turkey",
        "address" => "Mustafa Kemal Mah. Maidan Is Merkezi 4C Blok No:140 Cankaya"
    ],
    "billingAddress" => [
        "contactName" => $buyerName . " " . $buyerSurname,
        "city" => "Ankara",
        "country" => "Turkey",
        "address" => "Mustafa Kemal Mah. Maidan Is Merkezi 4C Blok No:140 Cankaya"
    ],
    "basketItems" => [
        [
            "id" => "PLAN_" . strtoupper($planType),
            "name" => "IsteYonetim " . ucfirst($planType) . " Paket Subscription",
            "category1" => "SaaS",
            "itemType" => "VIRTUAL",
            "price" => $priceStr
        ]
    ]
];

$body = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
$uri = "/payment/iyzipos/checkoutform/initialize/auth/ecom";
$rnd = bin2hex(random_bytes(8));

// iyzico V2 Signature generation
// Formula: HMAC-SHA256(randomKey + uri + body, secretKey) -> hex digest
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
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    echo json_encode(["status" => "failure", "errorMessage" => "cURL error: " . curl_error($ch)]);
    curl_close($ch);
    exit;
}
curl_close($ch);

// Log for debugging (can be removed in production)
$logData = [
    "timestamp" => date("Y-m-d H:i:s"),
    "baseUrl" => $baseUrl,
    "httpCode" => $httpCode,
    "request" => $payload,
    "response" => json_decode($response, true)
];
@file_put_contents(__DIR__ . '/iyzico-debug.log', json_encode($logData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n---\n", FILE_APPEND);

// Merge iyzico response with debug info for frontend
$iyzicoResult = json_decode($response, true);
if (is_array($iyzicoResult)) {
    $iyzicoResult['_debug_buyer_email'] = $buyerEmail;
    $iyzicoResult['_debug_buyer_phone'] = $buyerPhone;
    $iyzicoResult['_debug_baseUrl'] = $baseUrl;
    echo json_encode($iyzicoResult, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} else {
    echo $response;
}
