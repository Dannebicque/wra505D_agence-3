<?php
/*
 * Copyright (c) 2023. | Cyndel Herolt | IUT de Troyes  - All Rights Reserved
 * @author cyndelherolt
 * @project UniFolio
 */

use Symfony\Component\Dotenv\Dotenv;

require dirname(__DIR__).'/vendor/autoload.php';

(new Dotenv())->bootEnv(dirname(__DIR__).'/.env');

// Garde-fou : on va tout effacer, la base doit être celle des tests (suffixe _test de doctrine.yaml).
// Nom lu dans la configuration, sans connexion : ne dépend ni de l'existence de la base ni d'un message d'erreur.
$kernel = new App\Kernel('test', true);
$kernel->boot();
$base = (string) ($kernel->getContainer()->get('doctrine')->getConnection()->getParams()['dbname'] ?? '');
$kernel->shutdown();
if (!str_ends_with($base, '_test')) {
    fwrite(STDERR, sprintf("La base de test doit finir par _test (trouvé : « %s ») : rien n'est effacé.\n", $base));
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
