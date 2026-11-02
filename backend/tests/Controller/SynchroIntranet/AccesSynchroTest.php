<?php

namespace App\Tests\Controller\SynchroIntranet;

use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpClient\MockHttpClient;

/**
 * Les routes de synchro écrivent en base : elles ne doivent jamais être accessibles anonymement.
 */
class AccesSynchroTest extends WebTestCase
{
    private KernelBrowser $client;
    private Connection $connection;

    // Si une régression ouvrait une route, l'appel ne doit ni vider la base de test ni joindre la vraie API
    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->client->disableReboot();
        static::getContainer()->set('http_client', new MockHttpClient());
        $this->connection = static::getContainer()->get(EntityManagerInterface::class)->getConnection();
        $this->connection->beginTransaction();
    }

    protected function tearDown(): void
    {
        try {
            while ($this->connection->isTransactionActive()) {
                $this->connection->rollBack();
            }
        } finally {
            parent::tearDown();
        }
    }

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
        $this->client->request('POST', $route);

        self::assertResponseStatusCodeSame(401);
    }

    #[DataProvider('routes')]
    public function testGetInterdit(string $route): void
    {
        $this->client->request('GET', $route);

        self::assertResponseStatusCodeSame(405);
    }

    public function testAnciennesRoutesUtilitairesNonExposees(): void
    {
        $this->client->request('POST', '/api/intranet/etudiant');

        self::assertResponseStatusCodeSame(404);
    }
}
