<?php
/*
 * Copyright (c) 2023. | Cyndel Herolt | IUT de Troyes  - All Rights Reserved
 * @author cyndelherolt
 * @project UniFolio
 */

use Symfony\Component\Dotenv\Dotenv;

require dirname(__DIR__).'/vendor/autoload.php';

(new Dotenv())->bootEnv(dirname(__DIR__).'/.env');

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
        exit(sprintf("Préparation de la base de test impossible (%s)\n", $commande));
    }
}
