<?php

namespace App\Tests\Api;

use App\Tests\ApiTestCase;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Pages-projets (Sprint 2) : contrat de shared/types/portfolio.ts, règles de page-validation.ts et page-rules.ts.
 * Fixtures : le portfolio d'« etudiant » a « Projet web » (site) puis « Motion design » (vidéo) ; le brouillon d'image
 * n'est dans aucune page.
 */
class PageTest extends ApiTestCase
{
    public function testListeLesPagesDUnPortfolioDansLOrdre(): void
    {
        $this->connecter('etudiant');

        $liste = $this->lire('/api/pages?portfolio=' . urlencode($this->portfolio()));

        self::assertResponseIsSuccessful();
        self::assertSame(['Projet web', 'Motion design'], array_column($liste['member'], 'intitule'));
        $page = $liste['member'][0];
        $cles = array_keys($page);
        sort($cles);
        self::assertSame(['@id', '@type', 'dateSuppression', 'description', 'intitule', 'portfolio', 'traces'], $cles);
        self::assertSame($this->portfolio(), $page['portfolio']);
        self::assertSame([$this->trace('Site vitrine d’une association')], $page['traces']);
        foreach (['/api/portfolios/999999', 'abc', '/api/pages/1'] as $inconnu) {
            self::assertSame(0, $this->lire('/api/pages?portfolio=' . urlencode($inconnu))['totalItems'], $inconnu);
        }
    }

    public function testCreeUnePageEnFinDePortfolio(): void
    {
        $this->connecter('etudiant');

        $page = $this->envoyer('POST', '/api/pages', ['portfolio' => $this->portfolio(), 'intitule' => '  Affiche  ', 'description' => '', 'traces' => [$this->trace('Site vitrine d’une association')]]);

        self::assertResponseStatusCodeSame(201);
        self::assertSame('Affiche', $page['intitule']);
        self::assertNull($page['description']);
        self::assertSame([], $page['traces']);
        self::assertSame($page['@id'], end($this->lire($this->portfolio())['pages']));
    }

    public static function saisiesInvalides(): iterable
    {
        yield 'intitulé vide' => [['intitule' => ''], 'intitule', 'L’intitulé est obligatoire.'];
        yield 'intitulé trop long' => [['intitule' => str_repeat('a', 101)], 'intitule', 'L’intitulé ne doit pas dépasser 100 caractères.'];
        yield 'description trop longue' => [['description' => str_repeat('a', 501)], 'description', 'La description ne doit pas dépasser 500 caractères.'];
    }

    #[DataProvider('saisiesInvalides')]
    public function testRefuseUneSaisieInvalide(array $champs, string $champ, string $message): void
    {
        $this->connecter('etudiant');

        $reponse = $this->envoyer('PATCH', $this->page('Projet web'), $champs);

        self::assertResponseStatusCodeSame(422);
        self::assertSame([[$champ, $message]], array_map(static fn (array $v) => [$v['propertyPath'], $v['message']], $reponse['violations']));
    }

    public function testRefuseLePortfolioDUnAutreEtudiant(): void
    {
        $this->connecter('etudiant2');

        $reponse = $this->envoyer('POST', '/api/pages', ['portfolio' => $this->portfolio(), 'intitule' => 'Pirate']);

        self::assertResponseStatusCodeSame(422);
        self::assertSame([['portfolio', 'Portfolio introuvable.']], array_map(static fn (array $v) => [$v['propertyPath'], $v['message']], $reponse['violations']));
    }

    public function testRangeEtRetireDesTraces(): void
    {
        $this->connecter('etudiant');
        $site = $this->trace('Site vitrine d’une association');
        $nouvelle = $this->creerTrace('Logo');

        $page = $this->envoyer('PATCH', $this->page('Projet web'), ['traces' => [$nouvelle, $site]]);
        self::assertResponseIsSuccessful();
        self::assertSame([$nouvelle, $site], $page['traces']);

        $page = $this->envoyer('PATCH', $this->page('Projet web'), ['traces' => [$site]]);
        self::assertSame([$site], $page['traces']);
        // La trace retirée reste dans la bibliothèque
        $this->lire($nouvelle);
        self::assertResponseIsSuccessful();
    }

    public function testReglesDesTracesAjoutees(): void
    {
        $this->connecter('etudiant');
        $site = $this->trace('Site vitrine d’une association');
        $video = $this->trace('Motion design du festival');
        $brouillon = $this->trace('Affiche en cours');

        $cas = [
            'doublon' => [[$site, $site], 'Une trace ne peut figurer qu’une fois dans la page.'],
            'brouillon' => [[$site, $brouillon], 'Seule une trace finalisée peut être ajoutée à une page.'],
            'déjà dans une autre page' => [[$site, $video], '« Motion design du festival » est déjà dans une autre page de ce portfolio.'],
        ];
        foreach ($cas as $nom => [$traces, $message]) {
            $reponse = $this->envoyer('PATCH', $this->page('Projet web'), ['traces' => $traces]);
            self::assertResponseStatusCodeSame(422, $nom);
            self::assertSame([['traces', $message]], array_map(static fn (array $v) => [$v['propertyPath'], $v['message']], $reponse['violations']), $nom);
        }
        self::assertSame([$site], $this->lire($this->page('Projet web'))['traces']);
    }

    public function testRefuseLaTraceDUnAutreEtudiant(): void
    {
        $this->connecter('etudiant2');
        $autre = $this->creerTrace('Chez un autre');
        $this->connecter('etudiant');

        $reponse = $this->envoyer('PATCH', $this->page('Projet web'), ['traces' => [$autre]]);

        self::assertResponseStatusCodeSame(422);
        self::assertSame([['traces', 'Trace introuvable.']], array_map(static fn (array $v) => [$v['propertyPath'], $v['message']], $reponse['violations']));
    }

    public function testUneTraceDeLaCorbeilleEstMasqueeMaisGardeSaPlace(): void
    {
        $this->connecter('etudiant');
        $site = $this->trace('Site vitrine d’une association');
        $logo = $this->creerTrace('Logo');
        $this->envoyer('PATCH', $this->page('Projet web'), ['traces' => [$site, $logo]]);

        $this->envoyer('DELETE', $site);
        self::assertSame([$logo], $this->lire($this->page('Projet web'))['traces']);

        // Le front renvoie la liste visible : la trace supprimée n'en est pas retirée pour autant
        $this->envoyer('PATCH', $this->page('Projet web'), ['traces' => [$logo]]);
        self::assertResponseIsSuccessful();
        $this->connection->executeStatement('UPDATE trace SET date_suppression = NULL WHERE id = ?', [basename($site)]);
        self::assertSame([$site, $logo], $this->lire($this->page('Projet web'))['traces'], 'Restaurée à sa place');
    }

    public function testCorbeilleEtCloisonnement(): void
    {
        $this->connecter('etudiant2');
        $this->lire($this->page('Projet web'));
        self::assertResponseStatusCodeSame(404);
        $this->envoyer('PATCH', $this->page('Projet web'), ['intitule' => 'Pirate']);
        self::assertResponseStatusCodeSame(404);
        self::assertSame(0, $this->lire('/api/pages')['totalItems']);

        $this->connecter('etudiant');
        $page = $this->page('Projet web');
        $this->envoyer('DELETE', $page);
        self::assertResponseStatusCodeSame(204);
        $this->lire($page);
        self::assertResponseStatusCodeSame(404);
        self::assertNotContains($page, $this->lire($this->portfolio())['pages']);
        // Ses traces restent dans la bibliothèque et redeviennent disponibles pour une autre page
        $page = $this->envoyer('PATCH', $this->page('Motion design'), ['traces' => [$this->trace('Motion design du festival'), $this->trace('Site vitrine d’une association')]]);
        self::assertResponseIsSuccessful();
    }

    private function portfolio(): string
    {
        return $this->iri("SELECT '/api/portfolios/' || p.id FROM portfolio p JOIN etudiant e ON e.id = p.etudiant_id WHERE e.username = 'etudiant'");
    }

    private function page(string $intitule): string
    {
        return $this->iri(sprintf("SELECT '/api/pages/' || id FROM page WHERE intitule = '%s'", $intitule));
    }

    private function trace(string $titre): string
    {
        return $this->iri(sprintf("SELECT '/api/traces/' || id FROM trace WHERE titre = '%s'", str_replace("'", "''", $titre)));
    }

    private function creerTrace(string $titre): string
    {
        $trace = $this->envoyer('POST', '/api/traces', ['titre' => $titre, 'type' => 'lien', 'contenu' => ['https://exemple.fr'], 'statut' => 'finalisee']);
        self::assertResponseStatusCodeSame(201);

        return $trace['@id'];
    }
}
