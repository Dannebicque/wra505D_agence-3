<?php

namespace App\Tests;

use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Test sur la base de test (préparée par tests/bootstrap.php avec les fixtures).
 * Tout ce que fait un test est annulé à la fin : les tests restent indépendants.
 */
abstract class DatabaseTestCase extends KernelTestCase
{
    protected EntityManagerInterface $em;
    protected Connection $connection;

    protected function setUp(): void
    {
        self::bootKernel();
        $this->em = self::getContainer()->get(EntityManagerInterface::class);
        $this->connection = $this->em->getConnection();
        $this->connection->beginTransaction();
    }

    protected function tearDown(): void
    {
        $this->connection->rollBack();
        parent::tearDown();
    }

    protected function compte(string $table): int
    {
        return (int) $this->connection->fetchOne("SELECT COUNT(*) FROM $table");
    }

    /**
     * Appelle une action de contrôleur avec ses services, l'API intranet étant simulée par $reponseApi.
     */
    protected function appelerAction(string $controleur, string $action, MockResponse $reponseApi): Response
    {
        $instance = self::getContainer()->get($controleur);
        $arguments = [];
        foreach ((new \ReflectionMethod($instance, $action))->getParameters() as $parametre) {
            $type = $parametre->getType()->getName();
            $arguments[] = HttpClientInterface::class === $type
                ? new MockHttpClient(static fn () => clone $reponseApi)
                : self::getContainer()->get($type);
        }

        return $instance->$action(...$arguments);
    }
}
