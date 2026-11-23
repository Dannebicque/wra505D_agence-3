<?php

namespace App\Tests;

use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpClient\MockHttpClient;

/**
 * Test HTTP de l'API sur la base de test (fixtures), annulé en fin de test.
 * L'API intranet est simulée : aucune requête ne sort, même si une route était ouverte par erreur.
 */
abstract class ApiTestCase extends WebTestCase
{
    protected KernelBrowser $client;
    protected Connection $connection;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->client->disableReboot();
        static::getContainer()->set('http_client', new MockHttpClient());
        // Compteurs de tentatives de connexion remis à zéro : chaque test part d'un état connu
        static::getContainer()->get('cache.rate_limiter')->clear();
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

    /** Connexion avec un compte des fixtures (mot de passe « test »). */
    protected function connecter(string $username, string $password = 'test'): void
    {
        $this->client->jsonRequest('POST', '/api/login', ['username' => $username, 'password' => $password]);
        self::assertResponseStatusCodeSame(204, "Connexion de $username impossible");
    }

    /** GET en JSON-LD ; renvoie le corps décodé. */
    protected function lire(string $url): array
    {
        $this->client->request('GET', $url, server: ['HTTP_ACCEPT' => 'application/ld+json']);

        return json_decode((string) $this->client->getResponse()->getContent(), true) ?? [];
    }

    /** Requête JSON comme le front (merge-patch pour PATCH) ; renvoie le corps décodé. */
    protected function envoyer(string $methode, string $url, ?array $corps = null): array
    {
        $type = 'PATCH' === $methode ? 'application/merge-patch+json' : 'application/json';
        $this->client->request($methode, $url, server: ['CONTENT_TYPE' => $type, 'HTTP_ACCEPT' => 'application/ld+json'], content: null === $corps ? null : json_encode($corps));

        return json_decode((string) $this->client->getResponse()->getContent(), true) ?? [];
    }

    protected function iri(string $sql): string
    {
        return (string) $this->connection->fetchOne($sql);
    }
}
