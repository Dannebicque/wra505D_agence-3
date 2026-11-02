<?php

namespace App\Tests\Controller\SynchroIntranet;

use App\Tests\ApiTestCase;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Les routes de synchro écrivent en base : elles ne doivent jamais être accessibles anonymement.
 */
class AccesSynchroTest extends ApiTestCase
{
    public static function routes(): iterable
    {
        yield ['/api/intranet/referentiel'];
        yield ['/api/intranet/structure'];
        yield ['/api/intranet/etudiant/update'];
        yield ['/api/intranet/enseignant/update'];
    }

    #[DataProvider('routes')]
    public function testPostAnonymeRefuse(string $route): void
    {
        $this->client->jsonRequest('POST', $route);

        self::assertResponseStatusCodeSame(401);
    }

    #[DataProvider('routes')]
    public function testGetNeLancePasLaSynchro(string $route): void
    {
        // La route n'existe qu'en POST JSON : un GET (lien, image…) n'y aboutit jamais
        $this->connecter('admin');
        $this->client->request('GET', $route);

        self::assertResponseStatusCodeSame(404);
    }

    #[DataProvider('routes')]
    public function testAdminConnecteSansJsonRefuse(string $route): void
    {
        // Protection CSRF : un formulaire envoyé depuis une autre page ne doit pas lancer la synchro
        $this->connecter('admin');
        $departements = (int) $this->connection->fetchOne('SELECT COUNT(*) FROM departement');

        $this->client->request('POST', $route, ['champ' => 'valeur']);

        self::assertResponseStatusCodeSame(404);
        self::assertSame($departements, (int) $this->connection->fetchOne('SELECT COUNT(*) FROM departement'));
    }

    public function testAnciennesRoutesUtilitairesNonExposees(): void
    {
        $this->client->request('POST', '/api/intranet/etudiant');

        self::assertResponseStatusCodeSame(404);
    }
}
