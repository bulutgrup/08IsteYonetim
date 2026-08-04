<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Inputları filtrele
    $name = strip_tags(trim($_POST["name"] ?? ""));
    $email = filter_var(trim($_POST["email"] ?? ""), FILTER_SANITIZE_EMAIL);
    $company = strip_tags(trim($_POST["company"] ?? ""));
    $size = strip_tags(trim($_POST["size"] ?? ""));
    $message = strip_tags(trim($_POST["message"] ?? ""));

    if (empty($name) || empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Lütfen geçerli ad soyad ve e-posta adresi girin."]);
        exit;
    }

    // Alıcı Adresi
    $to = "admin@isteyonetim.com";
    $subject = "İşteYönetim - Yeni Demo & İletişim Talebi ($company)";

    // E-posta İçeriği (HTML formatında)
    $email_content = "
    <html>
    <head>
        <title>İşteYönetim Demo Talebi</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { padding: 20px; border: 1px solid #eee; border-radius: 8px; }
            h2 { color: #1E6462; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            td { padding: 10px; border-bottom: 1px solid #eee; }
            .label { font-weight: bold; width: 150px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <h2>İşteYönetim Yeni İletişim / Demo Başvurusu</h2>
            <p>Web sitenizdeki iletişim formu aracılığıyla yeni bir talep alındı. Detaylar aşağıdadır:</p>
            <table>
                <tr><td class='label'>Ad Soyad:</td><td>$name</td></tr>
                <tr><td class='label'>E-posta:</td><td>$email</td></tr>
                <tr><td class='label'>Şirket:</td><td>$company</td></tr>
                <tr><td class='label'>Ekip Büyüklüğü:</td><td>$size</td></tr>
                <tr><td class='label'>Mesaj:</td><td>" . nl2br($message) . "</td></tr>
            </table>
        </div>
    </body>
    </html>";

    // Headers
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8" . "\r\n";
    $headers .= "From: İşteYönetim Web <no-reply@isteyonetim.com>" . "\r\n";
    $headers .= "Reply-To: $name <$email>" . "\r\n";

    // Gönderim
    if (mail($to, $subject, $email_content, $headers)) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Talebiniz başarıyla gönderildi."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Sunucu hatası! E-posta gönderilemedi."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Yalnızca POST isteklerine izin verilir."]);
}
?>
