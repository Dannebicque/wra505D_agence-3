<?php

namespace App\Tests\Api;

use App\Tests\ApiTestCase;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpFoundation\File\UploadedFile;

/**
 * Portfolios (Sprint 2) : contrat de shared/types/portfolio.ts, un par année, ordre des pages, corbeille, cloisonnement.
 * Fixtures : « etudiant » a un portfolio public de l'année avec deux pages ; « etudiant2 » n'en a pas.
 */
class PortfolioTest extends ApiTestCase
{
    public function testListeSonPortfolioAuFormatDuContrat(): void
    {
        $this->connecter('etudiant');

        $liste = $this->lire('/api/portfolios');

        self::assertResponseIsSuccessful();
        self::assertSame(1, $liste['totalItems']);
        $portfolio = $liste['member'][0];
        $cles = array_keys($portfolio);
        sort($cles);
        self::assertSame(['@id', '@type', 'annee', 'banniere', 'dateCreation', 'dateModification', 'dateSuppression', 'description', 'etudiant', 'intitule', 'pages', 'visibilite', 'visibleRecruteurs'], $cles);
        self::assertSame('publique', $portfolio['visibilite']);
        self::assertFalse($portfolio['visibleRecruteurs']);
        self::assertStringStartsWith('/api/annees/', $portfolio['annee']);
        self::assertCount(2, $portfolio['pages']);
    }

    public function testCreeUnSeulPortfolioParAnnee(): void
    {
        $this->connecter('etudiant2');

        $portfolio = $this->envoyer('POST', '/api/portfolios', ['intitule' => '  Mon portfolio  ', 'visibilite' => 'privee', 'etudiant' => '/api/etudiants/1', 'annee' => '/api/annees/1', 'pages' => ['/api/pages/1']]);

        self::assertResponseStatusCodeSame(201);
        self::assertSame('Mon portfolio', $portfolio['intitule']);
        self::assertSame($this->iri("SELECT '/api/etudiants/' || id FROM etudiant WHERE username = 'etudiant2'"), $portfolio['etudiant']);
        self::assertSame($this->iri("SELECT '/api/annees/' || s.annee_id FROM etudiant e JOIN semestre s ON s.id = e.semestre_id WHERE e.username = 'etudiant2'"), $portfolio['annee']);
        self::assertSame([], $portfolio['pages']);
        self::assertSame('privee', $portfolio['visibilite']);

        $doublon = $this->envoyer('POST', '/api/portfolios', ['intitule' => 'Un autre', 'visibilite' => 'privee']);
        self::assertResponseStatusCodeSame(422);
        self::assertSame('Vous avez déjà un portfolio pour cette année.', $doublon['violations'][0]['message']);

        // Une fois le premier dans la corbeille, un nouveau peut être créé
        $this->envoyer('DELETE', $portfolio['@id']);
        $this->envoyer('POST', '/api/portfolios', ['intitule' => 'Un autre', 'visibilite' => 'privee']);
        self::assertResponseStatusCodeSame(201);
    }

    public static function saisiesInvalides(): iterable
    {
        yield 'intitulé vide' => [['intitule' => ' '], 'intitule', 'L’intitulé est obligatoire.'];
        yield 'intitulé trop long' => [['intitule' => str_repeat('a', 101)], 'intitule', 'L’intitulé ne doit pas dépasser 100 caractères.'];
        yield 'description trop longue' => [['description' => str_repeat('a', 2001)], 'description', 'La description ne doit pas dépasser 2 000 caractères.'];
        yield 'visibilité inconnue' => [['visibilite' => 'amis'], 'visibilite', 'Choisissez la visibilité du portfolio.'];
        yield 'bannière hors des fichiers déposés' => [['banniere' => 'https://exemple.fr/image.png'], 'banniere', 'Déposez une image avant de l’utiliser comme bannière.'];
    }

    #[DataProvider('saisiesInvalides')]
    public function testRefuseUneModificationInvalide(array $champs, string $champ, string $message): void
    {
        $this->connecter('etudiant');

        $reponse = $this->envoyer('PATCH', $this->portfolio(), $champs);

        self::assertResponseStatusCodeSame(422);
        self::assertSame([[$champ, $message]], array_map(static fn (array $v) => [$v['propertyPath'], $v['message']], $reponse['violations']));
    }

    public function testModifieLesInformationsEtLaBanniere(): void
    {
        $this->connecter('etudiant');
        $banniere = $this->deposerImage();

        $portfolio = $this->envoyer('PATCH', $this->portfolio(), ['intitule' => 'Nouveau titre', 'visibilite' => 'privee', 'visibleRecruteurs' => true, 'banniere' => $banniere, 'dateSuppression' => '2020-01-01T00:00:00+00:00']);

        self::assertResponseIsSuccessful();
        self::assertSame('Nouveau titre', $portfolio['intitule']);
        self::assertSame('privee', $portfolio['visibilite']);
        self::assertTrue($portfolio['visibleRecruteurs']);
        self::assertSame($banniere, $portfolio['banniere']);
        self::assertNull($portfolio['dateSuppression']);
    }

    public function testRefuseLaBanniereDUnAutreEtudiant(): void
    {
        $this->connecter('etudiant2');
        $autre = $this->deposerImage();
        $this->connecter('etudiant');

        $this->envoyer('PATCH', $this->portfolio(), ['banniere' => $autre]);

        self::assertResponseStatusCodeSame(422);
    }

    public function testReordonneLesPages(): void
    {
        $this->connecter('etudiant');
        $pages = $this->lire($this->portfolio())['pages'];

        $portfolio = $this->envoyer('PATCH', $this->portfolio(), ['pages' => array_reverse($pages)]);

        self::assertResponseIsSuccessful();
        self::assertSame(array_reverse($pages), $portfolio['pages']);
        self::assertSame(array_reverse($pages), array_column($this->lire('/api/pages?portfolio=' . urlencode($this->portfolio()))['member'], '@id'));
    }

    public static function ordresInvalides(): iterable
    {
        yield 'une page en moins' => [static fn (array $pages) => [$pages[0]]];
        yield 'une page en double' => [static fn (array $pages) => [$pages[0], $pages[0]]];
        yield 'liste vide' => [static fn (array $pages) => []];
        yield 'page d’un autre portfolio' => [static fn (array $pages) => [$pages[0], '/api/pages/999999']];
    }

    #[DataProvider('ordresInvalides')]
    public function testRefuseUnOrdreQuiNeReprendPasLesPages(\Closure $ordre): void
    {
        $this->connecter('etudiant');
        $pages = $this->lire($this->portfolio())['pages'];

        $reponse = $this->envoyer('PATCH', $this->portfolio(), ['pages' => $ordre($pages)]);

        self::assertResponseStatusCodeSame(422);
        self::assertSame('L’ordre doit reprendre exactement les pages du portfolio.', $reponse['violations'][0]['message']);
        self::assertSame($pages, $this->lire($this->portfolio())['pages']);
    }

    public function testCorbeilleEtCloisonnement(): void
    {
        $this->connecter('etudiant2');
        $this->lire($this->portfolio());
        self::assertResponseStatusCodeSame(404);
        $this->envoyer('PATCH', $this->portfolio(), ['intitule' => 'Pirate']);
        self::assertResponseStatusCodeSame(404);
        $this->envoyer('DELETE', $this->portfolio());
        self::assertResponseStatusCodeSame(404);

        $this->connecter('etudiant');
        $this->envoyer('DELETE', $this->portfolio());
        self::assertResponseStatusCodeSame(204);
        $this->lire($this->portfolio());
        self::assertResponseStatusCodeSame(404);
        self::assertSame(0, $this->lire('/api/portfolios')['totalItems']);
        // Ses pages disparaissent avec lui
        self::assertSame(0, $this->lire('/api/pages')['totalItems']);
    }

    private function portfolio(): string
    {
        return $this->iri("SELECT '/api/portfolios/' || p.id FROM portfolio p JOIN etudiant e ON e.id = p.etudiant_id WHERE e.username = 'etudiant' AND p.date_suppression IS NULL");
    }

    private function deposerImage(): string
    {
        $chemin = tempnam(sys_get_temp_dir(), 'envoi');
        $image = imagecreatetruecolor(2, 2);
        imagepng($image, $chemin);
        $this->client->request('POST', '/api/fichiers', ['type' => 'image'], ['fichier' => new UploadedFile($chemin, 'banniere.png', null, null, true)], ['HTTP_ACCEPT' => 'application/ld+json']);
        self::assertResponseStatusCodeSame(201);

        return json_decode((string) $this->client->getResponse()->getContent(), true)['@id'];
    }
}
