<?php

namespace App\Tests\Api;

use App\Tests\ApiTestCase;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpFoundation\File\UploadedFile;

/**
 * Lecture par l'enseignant (Sprint 3, choix du PO) : les étudiants de ses départements, leurs traces finalisées et
 * leurs fichiers, leurs validations, leurs portfolios publics et leurs pages ; ni brouillon, ni portfolio privé, ni
 * autre département (404). Fixtures : « enseignant » est en MMI comme les étudiants, « enseignant2 » en CJ.
 */
class EnseignantTest extends ApiTestCase
{
    public function testLitLesTracesFinaliseesDeSonDepartement(): void
    {
        $this->connecter('enseignant');

        $titres = array_column($this->lire('/api/traces')['member'], 'titre');

        self::assertResponseIsSuccessful();
        self::assertContains('Site vitrine d’une association', $titres);
        self::assertNotContains('Affiche en cours', $titres, 'Brouillon caché');
        $this->lire($this->trace('Affiche en cours'));
        self::assertResponseStatusCodeSame(404);
        $this->lire($this->trace('Site vitrine d’une association'));
        self::assertResponseIsSuccessful();
    }

    public function testLitLesValidationsLaBibliothequeEtLePortfolioPublic(): void
    {
        $this->connecter('enseignant');

        self::assertGreaterThan(0, $this->lire('/api/validations')['totalItems']);
        $this->lire($this->iri("SELECT '/api/bibliotheques/' || b.id FROM bibliotheque b JOIN etudiant e ON e.id = b.etudiant_id WHERE e.username = 'etudiant'"));
        self::assertResponseIsSuccessful();
        self::assertSame(1, $this->lire('/api/portfolios')['totalItems']);
        self::assertSame(2, $this->lire('/api/pages?portfolio=' . urlencode($this->portfolio()))['totalItems']);
    }

    public function testNeVoitPasUnPortfolioPrive(): void
    {
        $this->connection->executeStatement('UPDATE portfolio SET visibilite = false');
        $this->connecter('enseignant');

        self::assertSame(0, $this->lire('/api/portfolios')['totalItems']);
        $this->lire($this->portfolio());
        self::assertResponseStatusCodeSame(404);
        self::assertSame(0, $this->lire('/api/pages')['totalItems']);
    }

    public static function ressources(): iterable
    {
        yield 'traces' => ['/api/traces'];
        yield 'validations' => ['/api/validations'];
        yield 'portfolios' => ['/api/portfolios'];
        yield 'pages' => ['/api/pages'];
    }

    #[DataProvider('ressources')]
    public function testUnAutreDepartementNeVoitRien(string $collection): void
    {
        $this->connecter('enseignant2');

        self::assertSame(0, $this->lire($collection)['totalItems']);
    }

    public function testUnAutreDepartementNOuvrePasLaTrace(): void
    {
        $this->connecter('enseignant2');

        $this->lire($this->trace('Site vitrine d’une association'));

        self::assertResponseStatusCodeSame(404);
    }

    public function testLitLeFichierDUneTraceFinaliseeSeulement(): void
    {
        $this->connecter('etudiant');
        $chemin = tempnam(sys_get_temp_dir(), 'envoi');
        imagepng(imagecreatetruecolor(2, 2), $chemin);
        $this->client->request('POST', '/api/fichiers', ['type' => 'image'], ['fichier' => new UploadedFile($chemin, 'affiche.png', null, null, true)], ['HTTP_ACCEPT' => 'application/ld+json']);
        $fichier = json_decode((string) $this->client->getResponse()->getContent(), true)['@id'];
        $trace = $this->envoyer('POST', '/api/traces', ['titre' => 'Affiche', 'type' => 'image', 'contenu' => [$fichier], 'legende' => 'Une affiche', 'statut' => 'brouillon'])['@id'];
        $this->connection->executeStatement('UPDATE portfolio SET visibilite = false');

        $this->connecter('enseignant');
        $this->client->request('GET', $fichier);
        self::assertResponseStatusCodeSame(404, 'Brouillon : fichier caché');

        $this->connecter('etudiant');
        $this->envoyer('PATCH', $trace, ['statut' => 'finalisee']);
        $this->connecter('enseignant');
        $this->client->request('GET', $fichier);
        self::assertResponseIsSuccessful();

        $this->connecter('enseignant2');
        $this->client->request('GET', $fichier);
        self::assertResponseStatusCodeSame(404, 'Autre département');
    }

    public function testNEcritRienPourLEtudiant(): void
    {
        $this->connecter('enseignant');

        $this->envoyer('POST', '/api/traces', ['titre' => 'Pirate', 'type' => 'lien', 'contenu' => ['https://a.fr'], 'statut' => 'finalisee']);
        self::assertResponseStatusCodeSame(403);
        $this->envoyer('PATCH', $this->trace('Site vitrine d’une association'), ['titre' => 'Pirate']);
        self::assertResponseStatusCodeSame(403);
        $this->envoyer('PATCH', $this->portfolio(), ['intitule' => 'Pirate']);
        self::assertResponseStatusCodeSame(403);
        $this->envoyer('POST', '/api/pages', ['portfolio' => $this->portfolio(), 'intitule' => 'Pirate']);
        self::assertResponseStatusCodeSame(403);
    }

    private function trace(string $titre): string
    {
        return $this->iri(sprintf("SELECT '/api/traces/' || id FROM trace WHERE titre = '%s'", str_replace("'", "''", $titre)));
    }

    private function portfolio(): string
    {
        return $this->iri("SELECT '/api/portfolios/' || id FROM portfolio LIMIT 1");
    }
}
