<?php
/*
 * Copyright (c) 2023. | Cyndel Herolt | IUT de Troyes  - All Rights Reserved
 * @author cyndelherolt
 * @project UniFolio
 */

use Symfony\Component\Dotenv\Dotenv;

require dirname(__DIR__).'/vendor/autoload.php';

(new Dotenv())->bootEnv(dirname(__DIR__).'/.env');

// Garde-fou : on va tout effacer, la base doit être celle des tests (suffixe _test de doctrine.yaml)
$base = trim((string) shell_exec(sprintf('php "%s/bin/console" dbal:run-sql "SELECT current_database()" --env=test 2>&1', dirname(__DIR__))));
if (!preg_match('/\b\w+_test\b/', $base)) {
    fwrite(STDERR, "Base de test introuvable ou mal nommée, rien n'est effacé :\n$base\n");
    exit(1);
}

// Base de test repartie de zéro à chaque lancement : schéma par les migrations, puis fixtures.
// Chaque test travaille ensuite dans une transaction annulée (voir tests/DatabaseTestCase.php).
foreach ([
    'doctrine:database:create --if-not-exists',
    'doctrine:schema:drop --full-database --force',
    'doctrine:migrations:migrate --no-interaction',
    'doctrine:fixtures:load --no-interaction',
] as $commande) {
    passthru(sprintf('php "%s/bin/console" %s --env=test --quiet', dirname(__DIR__), $commande), $code);
    if (0 !== $code) {
        fwrite(STDERR, sprintf("Préparation de la base de test impossible (%s)\n", $commande));
        exit(1);
    }
}
