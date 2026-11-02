<?php

namespace App\Tests\Controller\SynchroIntranet;

use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Les routes de synchro écrivent en base : elles ne doivent jamais être accessibles anonymement.
 */
class AccesSynchroTest extends WebTestCase
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
        $client = static::createClient();
        $client->request('POST', $route);

        self::assertResponseStatusCodeSame(401);
    }

    #[DataProvider('routes')]
    public function testGetInterdit(string $route): void
    {
        $client = static::createClient();
        $client->request('GET', $route);

        self::assertResponseStatusCodeSame(405);
    }

    public function testAnciennesRoutesUtilitairesNonExposees(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/intranet/etudiant');

        self::assertResponseStatusCodeSame(404);
    }
}
