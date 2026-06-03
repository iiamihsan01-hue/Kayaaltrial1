<?php
// send_mail.php
// Backend email handler for Kayaal Beauty Lounge bookings

// Set response headers to return JSON
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Accept");

// Only process POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method Not Allowed"]);
    exit;
}

// Autoload PHPMailer via Composer
require 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// --- CONFIGURATION ---
// IMPORTANT: To send via Gmail SMTP, you must use a Gmail App Password.
// Go to Google Account > Security > 2-Step Verification > App passwords.
// Generate a new app password and paste it below (16 characters, no spaces).
define('SMTP_EMAIL', 'kayaalbeautylounge@gmail.com'); 
define('SMTP_PASSWORD', 'YOUR_GMAIL_APP_PASSWORD'); // <-- REPLACE THIS WITH YOUR 16-CHAR APP PASSWORD
define('RECIPIENT_EMAIL', 'kayaalbeautylounge@gmail.com');
// ---------------------

// Gather form data
$name = isset($_POST['name']) ? strip_tags(trim($_POST['name'])) : '';
$phone = isset($_POST['phone']) ? strip_tags(trim($_POST['phone'])) : '';
$service = isset($_POST['service']) ? strip_tags(trim($_POST['service'])) : '';
$date = isset($_POST['date']) ? strip_tags(trim($_POST['date'])) : '';
$time = isset($_POST['time']) ? strip_tags(trim($_POST['time'])) : '';
$notes = isset($_POST['notes']) ? strip_tags(trim($_POST['notes'])) : '';

// Validate required fields
if (empty($name) || empty($phone) || empty($service) || empty($date) || empty($time)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Please fill in all required fields."]);
    exit;
}

$mail = new PHPMailer(true);

try {
    // Server settings
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_EMAIL;
    $mail->Password   = SMTP_PASSWORD;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // Enable TLS encryption
    $mail->Port       = 587;                            // TCP port to connect to

    // Recipients
    $mail->setFrom(SMTP_EMAIL, 'Kayaal Booking System');
    $mail->addAddress(RECIPIENT_EMAIL, 'Kayaal Beauty Lounge');
    
    // Content
    $mail->isHTML(true);
    $mail->Subject = 'New Reservation Enquiry - ' . $name;
    
    // Create email HTML body
    $email_body = "
    <h2>New Reservation Request</h2>
    <table style='border-collapse: collapse; width: 100%; max-width: 600px; font-family: Arial, sans-serif;'>
        <tr style='background-color: #f2f2f2;'><td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Customer Name</td><td style='padding: 8px; border: 1px solid #ddd;'>{$name}</td></tr>
        <tr><td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Phone Number</td><td style='padding: 8px; border: 1px solid #ddd;'>{$phone}</td></tr>
        <tr style='background-color: #f2f2f2;'><td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Service</td><td style='padding: 8px; border: 1px solid #ddd;'>{$service}</td></tr>
        <tr><td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Preferred Date</td><td style='padding: 8px; border: 1px solid #ddd;'>{$date}</td></tr>
        <tr style='background-color: #f2f2f2;'><td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Preferred Time</td><td style='padding: 8px; border: 1px solid #ddd;'>{$time}</td></tr>
        <tr><td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Additional Notes</td><td style='padding: 8px; border: 1px solid #ddd;'>{$notes}</td></tr>
    </table>
    ";

    $mail->Body    = $email_body;
    $mail->AltBody = "New Reservation Request\nName: {$name}\nPhone: {$phone}\nService: {$service}\nDate: {$date}\nTime: {$time}\nNotes: {$notes}";

    $mail->send();
    echo json_encode(["success" => true, "message" => "Reservation inquiry sent successfully."]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Mailer Error: {$mail->ErrorInfo}"]);
}
