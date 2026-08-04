<?php
/**
 * ask-fcab-config.example.php
 *
 * Kopieer dit bestand naar "ask-fcab-config.php" en vul je eigen Anthropic
 * API-key in. Zet het daarna, indien mogelijk, EEN NIVEAU BOVEN je publieke
 * webroot (dus niet in dezelfde map als ask-fcab.php / public_html), zodat
 * bezoekers het bestand nooit rechtstreeks via de browser kunnen openen.
 *
 * Kan dat niet op jouw hosting? Zet ask-fcab-config.php dan wel gewoon in
 * public_html, maar voeg in diezelfde map een .htaccess-bestand toe met
 * (in elk geval) deze regel, zodat het bestand niet direct opvraagbaar is:
 *
 *   <Files "ask-fcab-config.php">
 *     Require all denied
 *   </Files>
 *
 * BELANGRIJK: commit ask-fcab-config.php NOOIT naar (een publieke) GitHub-
 * repository. Zet het in .gitignore. Alleen ask-fcab-config.example.php
 * (zonder echte key) hoort in de repo thuis.
 */

// Jouw geheime Anthropic API-key (begint met "sk-ant-"). Nooit delen.
define('ANTHROPIC_API_KEY', 'sk-ant-VUL-HIER-JE-KEY-IN');

// Welk model "Vraag FCAB" gebruikt. Pas aan als Anthropic een nieuwer
// model uitbrengt, zonder dat de website zelf aangepast hoeft te worden.
define('ANTHROPIC_MODEL', 'claude-sonnet-4-5');

// Maximaal aantal vragen per uur per IP-adres (bescherming tegen misbruik
// en onverwacht hoge kosten). Verhoog of verlaag naar wens.
define('RATE_LIMIT_PER_HOUR', 20);
