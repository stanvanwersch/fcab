<?php
/**
 * ask-fcab.php - server-side proxy voor "Vraag FCAB"
 *
 * Doel: de Anthropic API-key blijft op de server en wordt NOOIT naar de
 * browser van de bezoeker gestuurd. De client (FCAB_docs_4_5_15_21.html)
 * stuurt alleen de vraag + relevante paginatekst hierheen; dit script zet
 * dat om in een aanroep naar api.anthropic.com met de geheime key.
 *
 * INSTALLATIE (TransIP webhosting):
 * 1. Zet dit bestand in een map die publiek bereikbaar is via je website,
 *    bijvoorbeeld: public_html/api/ask-fcab.php
 *    -> de site roept dan aan: https://jouwdomein.nl/api/ask-fcab.php
 * 2. Zet ask-fcab-config.php ZOVER MOGELIJK BUITEN de publieke webroot
 *    (dus niet in public_html zelf, maar een niveau hoger, in dezelfde map
 *    als "public_html" staat). Vul daarin je eigen Anthropic API-key in.
 *    Kan dat niet op jouw hosting? Zet het bestand dan wel in public_html,
 *    maar geef het een niet-voor-de-hand-liggende naam en blokkeer directe
 *    toegang via .htaccess (zie ask-fcab-config.example.php voor een
 *    voorbeeldregel).
 * 3. Pas hieronder $configPath aan als je een andere locatie kiest.
 * 4. Werkt de website vanaf een ANDER domein dan waar dit script staat?
 *    Vervang dan de '*' bij Access-Control-Allow-Origin hieronder door
 *    exact jouw domein (bijv. 'https://docs.dgbc.nl').
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => ['message' => 'Alleen POST-aanvragen toegestaan.']]);
    exit;
}

// --- Config (bevat de geheime API-key) inladen ---
$configPath = __DIR__ . '/../ask-fcab-config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(['error' => ['message' => 'Serverconfiguratie ontbreekt. Zie installatie-instructies bovenaan ask-fcab.php.']]);
    exit;
}
require $configPath;

if (!defined('ANTHROPIC_API_KEY') || ANTHROPIC_API_KEY === '' || ANTHROPIC_API_KEY === 'sk-ant-VUL-HIER-JE-KEY-IN') {
    http_response_code(500);
    echo json_encode(['error' => ['message' => 'Er is nog geen geldige Anthropic API-key ingesteld in ask-fcab-config.php.']]);
    exit;
}

// --- Invoer lezen ---
$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
$question = isset($body['question']) ? trim((string)$body['question']) : '';
$context  = isset($body['context'])  ? trim((string)$body['context'])  : '';

if ($question === '') {
    http_response_code(400);
    echo json_encode(['error' => ['message' => 'Geen vraag meegegeven.']]);
    exit;
}
if (mb_strlen($question) > 2000) {
    http_response_code(400);
    echo json_encode(['error' => ['message' => 'Vraag is te lang (max 2000 tekens).']]);
    exit;
}
// Ruime marge, maar voorkomt dat iemand met opzet een enorme context meestuurt.
if (mb_strlen($context) > 20000) {
    $context = mb_substr($context, 0, 20000);
}

// --- Eenvoudige, bestandsgebaseerde rate-limit per IP-adres ---
// Voorkomt dat één bezoeker (of misbruik) het volledige API-budget opmaakt.
// Bij voorkeur max. 20 vragen per uur per IP-adres; pas RATE_LIMIT_PER_HOUR
// hieronder aan (of in ask-fcab-config.php) naar wens.
$rateLimitPerHour = defined('RATE_LIMIT_PER_HOUR') ? RATE_LIMIT_PER_HOUR : 20;
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = sys_get_temp_dir() . '/fcab-rate-' . md5($ip) . '.json';
$now = time();
$hits = [];
if (file_exists($rateFile)) {
    $decoded = json_decode((string)file_get_contents($rateFile), true);
    if (is_array($decoded)) $hits = $decoded;
}
$hits = array_values(array_filter($hits, function ($t) use ($now) {
    return is_numeric($t) && $t > $now - 3600;
}));
if (count($hits) >= $rateLimitPerHour) {
    http_response_code(429);
    echo json_encode(['error' => ['message' => 'Te veel vragen vanaf dit IP-adres binnen een uur. Probeer het later opnieuw.']]);
    exit;
}
$hits[] = $now;
@file_put_contents($rateFile, json_encode($hits));

// --- Systeemprompt + aanroep naar Anthropic ---
$system = "Je bent \"Vraag FCAB\", een assistent die vragen beantwoordt over de FCAB-methodiek "
    . "(Framework for Climate Adaptive Buildings) van DGBC, uitsluitend op basis van de meegegeven "
    . "documentatiefragmenten hieronder. Antwoord in het Nederlands, beknopt en feitelijk. Als het "
    . "antwoord niet in de fragmenten staat, zeg dat expliciet in plaats van te gokken. Verwijs waar "
    . "relevant naar de betreffende pagina.\n\nDOCUMENTATIEFRAGMENTEN:\n" . $context;

$model = defined('ANTHROPIC_MODEL') ? ANTHROPIC_MODEL : 'claude-sonnet-4-5';

$payload = json_encode([
    'model'      => $model,
    'max_tokens' => 800,
    'system'     => $system,
    'messages'   => [['role' => 'user', 'content' => $question]],
]);

$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => [
        'content-type: application/json',
        'x-api-key: ' . ANTHROPIC_API_KEY,
        'anthropic-version: 2023-06-01',
    ],
    CURLOPT_TIMEOUT => 30,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    echo json_encode(['error' => ['message' => 'Kon Anthropic niet bereiken: ' . $curlErr]]);
    exit;
}

http_response_code($httpCode ?: 500);
echo $response;
