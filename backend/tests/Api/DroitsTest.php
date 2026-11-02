<?php

namespace App\Tests\Api;

use App\Tests\ApiTestCase;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Contrôle d'accès des ressources (C-13).
 */
class DroitsTest extends ApiTestCase
{
    public static function ressources(): iterable
    {
        foreach (['departements', 'diplomes', 'annees', 'annee_universitaires', 'semestres', 'groupes', 'parcours', 'etudiants', 'enseignants'] as $ressource) {
            yield $ressource => ["/api/$ressource"];
        }
        yield 'me' => ['/api/me'];
    }

    #[DataProvider('ressources')]
    public function testRefuseSansConnexion(string $url): void
    {
        $this->lire($url);

        self::assertResponseStatusCodeSame(401);
    }

    public function testEtudiantLitSaFicheMaisPasCelleDUnAutre(): void
    {
        $this->connecter('etudiant');

        $this->lire($this->ficheEtudiant('etudiant'));
        self::assertResponseIsSuccessful();

        $this->lire($this->ficheEtudiant('etudiant2'));
        self::assertResponseStatusCodeSame(403);
    }

    public function testEtudiantNeVoitPasLaListeDesEtudiants(): void
    {
        $this->connecter('etudiant');

        $this->lire('/api/etudiants');

        self::assertResponseStatusCodeSame(403);
    }

    public function testEtudiantNeLitPasLeCompteDUnAutre(): void
    {
        $this->connecter('etudiant');

        $this->lire($this->iri("SELECT '/api/users/' || id FROM users WHERE username = 'etudiant'"));
        self::assertResponseIsSuccessful();

        $this->lire($this->iri("SELECT '/api/users/' || id FROM users WHERE username = 'etudiant2'"));
        self::assertResponseStatusCodeSame(403);
    }

    public function testEtudiantNAccedePasALaSynchro(): void
    {
        $this->connecter('etudiant');

        $this->client->jsonRequest('POST', '/api/intranet/structure');

        self::assertResponseStatusCodeSame(403);
    }

    public function testEnseignantNeLitPasLeCompteDUnEtudiant(): void
    {
        $this->connecter('enseignant');

        $this->lire($this->iri("SELECT '/api/users/' || id FROM users WHERE username = 'etudiant'"));

        self::assertResponseStatusCodeSame(403);
    }

    public static function ecritures(): iterable
    {
        foreach (['POST', 'PUT', 'PATCH', 'DELETE'] as $methode) {
            yield "$methode étudiant" => [$methode, "SELECT '/api/etudiants/' || id FROM etudiant WHERE username = 'etudiant'"];
            yield "$methode utilisateur" => [$methode, "SELECT '/api/users/' || id FROM users WHERE username = 'etudiant'"];
            yield "$methode département" => [$methode, "SELECT '/api/departements/' || id FROM departement LIMIT 1"];
        }
    }

    #[DataProvider('ecritures')]
    public function testAucuneEcritureAuSprint0(string $methode, string $sql): void
    {
        $this->connecter('admin');

        $this->client->jsonRequest($methode, $this->iri($sql), ['nom' => 'Pirate']);

        self::assertResponseStatusCodeSame(405);
    }

    public function testEnseignantVoitTousLesEtudiants(): void
    {
        $this->connecter('enseignant');

        $liste = $this->lire('/api/etudiants');
        self::assertResponseIsSuccessful();
        self::assertSame(2, $liste['totalItems']);

        $this->lire($this->ficheEtudiant('etudiant2'));
        self::assertResponseIsSuccessful();
    }

    public function testAdminVoitTousLesEtudiants(): void
    {
        $this->connecter('admin');

        $this->lire('/api/etudiants');

        self::assertResponseIsSuccessful();
    }

    private function ficheEtudiant(string $username): string
    {
        return $this->iri("SELECT '/api/etudiants/' || id FROM etudiant WHERE username = '$username'");
    }
}
