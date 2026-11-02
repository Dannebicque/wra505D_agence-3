<?php

namespace App\Tests\Api;

use App\Tests\ApiTestCase;

class ConnexionTest extends ApiTestCase
{
    public function testConnexionPuisUtilisateurCourant(): void
    {
        $this->connecter('etudiant');

        // Nom de session de l'environnement de test (PHPSESSID en dev et en prod)
        $cookie = $this->client->getCookieJar()->get('MOCKSESSID');
        self::assertNotNull($cookie, 'Cookie de session attendu');
        self::assertTrue($cookie->isHttpOnly(), 'Le cookie de session doit être HttpOnly');

        $me = $this->lire('/api/me');
        self::assertResponseIsSuccessful();
        self::assertSame('User', $me['@type']);
        self::assertSame('etudiant', $me['username']);
        self::assertSame(['ROLE_ETUDIANT'], $me['roles']);
        self::assertSame($this->iri("SELECT '/api/users/' || id FROM users WHERE username = 'etudiant'"), $me['@id']);
        self::assertSame($this->iri("SELECT '/api/etudiants/' || etudiant_id FROM users WHERE username = 'etudiant'"), $me['etudiant']);
        self::assertNull($me['enseignant']);
    }

    public function testMauvaisMotDePasse(): void
    {
        $this->client->jsonRequest('POST', '/api/login', ['username' => 'etudiant', 'password' => 'faux']);

        self::assertResponseStatusCodeSame(401);
        self::assertSame(['message' => 'Identifiant ou mot de passe incorrect.'], json_decode($this->client->getResponse()->getContent(), true));
    }

    public function testIdentifiantInconnuMemeMessage(): void
    {
        // Même réponse qu'un mauvais mot de passe : on ne révèle pas quels identifiants existent
        $this->client->jsonRequest('POST', '/api/login', ['username' => 'inconnu', 'password' => 'test']);

        self::assertResponseStatusCodeSame(401);
        self::assertSame(['message' => 'Identifiant ou mot de passe incorrect.'], json_decode($this->client->getResponse()->getContent(), true));
    }

    public function testCompteNonVerifieRefuse(): void
    {
        $this->connection->executeStatement("UPDATE users SET is_verified = false WHERE username = 'etudiant'");

        $this->client->jsonRequest('POST', '/api/login', ['username' => 'etudiant', 'password' => 'test']);

        self::assertResponseStatusCodeSame(403);
        self::assertSame(
            ['message' => "Votre compte n'est pas encore activé : vérifiez votre adresse mail."],
            json_decode($this->client->getResponse()->getContent(), true),
        );
        $this->lire('/api/me');
        self::assertResponseStatusCodeSame(401);
    }

    public function testLimitationDesTentatives(): void
    {
        for ($i = 0; $i < 5; ++$i) {
            $this->client->jsonRequest('POST', '/api/login', ['username' => 'etudiant2', 'password' => 'faux']);
            self::assertResponseStatusCodeSame(401);
        }

        // Même le bon mot de passe est refusé tant que la limite est atteinte
        $this->client->jsonRequest('POST', '/api/login', ['username' => 'etudiant2', 'password' => 'test']);
        self::assertResponseStatusCodeSame(429);
    }

    public function testRequeteSansJsonRefusee(): void
    {
        $this->client->request('POST', '/api/login', ['username' => 'etudiant', 'password' => 'test']);

        self::assertResponseStatusCodeSame(401);
        $this->lire('/api/me');
        self::assertResponseStatusCodeSame(401);
    }

    public function testDeconnexion(): void
    {
        $this->connecter('etudiant');

        $this->client->request('POST', '/api/logout');
        self::assertResponseStatusCodeSame(204);

        $this->lire('/api/me');
        self::assertResponseStatusCodeSame(401);
    }
}
