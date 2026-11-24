<?php

namespace App\Tests\Api;

use App\Service\Corbeille;
use App\Tests\ApiTestCase;

/**
 * Corbeille (Sprint 5, C-09) : liste des éléments supprimés de l'étudiant, restauration, effacement à 30 jours
 * (décision du PO, point ouvert n° 17). Fixtures : portfolio d'« etudiant » avec « Projet web » (site) et « Motion
 * design » (vidéo).
 */
class CorbeilleTest extends ApiTestCase
{
    public function testListeCeQuiEstSupprimeAvecSaDateDEffacement(): void
    {
        $this->connecter('etudiant');
        $this->envoyer('DELETE', $this->trace('Affiche en cours'));
        $this->envoyer('DELETE', $this->page('Motion design'));
        // Supprimées dans la même seconde : la page passe pour la plus récente
        $this->connection->executeStatement("UPDATE trace SET date_suppression = date_suppression - INTERVAL '1 hour' WHERE titre = 'Affiche en cours'");

        $corbeille = $this->lire('/api/corbeille');

        self::assertResponseIsSuccessful();
        self::assertSame(2, $corbeille['totalItems']);
        $element = $corbeille['member'][0];
        $cles = array_keys($element);
        sort($cles);
        self::assertSame(['@type', 'dateEffacement', 'dateSuppression', 'ressource', 'titre', 'type'], $cles);
        self::assertSame(['page', $this->page('Motion design'), 'Motion design'], [$element['type'], $element['ressource'], $element['titre']], 'Le plus récent d’abord');
        self::assertSame(
            (new \DateTimeImmutable($element['dateSuppression']))->modify('+30 days')->format(\DATE_RFC3339),
            $element['dateEffacement'],
        );

        $this->connecter('etudiant2');
        self::assertSame(0, $this->lire('/api/corbeille')['totalItems']);
    }

    public function testUnePageDUnPortfolioSupprimeRevientAvecLui(): void
    {
        $this->connecter('etudiant');
        $this->envoyer('DELETE', $this->page('Motion design'));
        $this->envoyer('DELETE', $this->portfolio());

        self::assertSame(['portfolio'], array_column($this->lire('/api/corbeille')['member'], 'type'));

        $this->restaurer($this->page('Motion design'));
        self::assertResponseStatusCodeSame(409, 'Pas restaurable seule tant que le portfolio est supprimé');
        self::assertStringContainsString('Restaurez d’abord le portfolio', (string) $this->client->getResponse()->getContent());

        $this->restaurer($this->portfolio());
        self::assertResponseStatusCodeSame(204);
        self::assertSame(['page'], array_column($this->lire('/api/corbeille')['member'], 'type'));
        $this->restaurer($this->page('Motion design'));
        self::assertResponseStatusCodeSame(204);
        self::assertSame([$this->page('Projet web'), $this->page('Motion design')], $this->lire($this->portfolio())['pages']);
    }

    public function testUneTraceRestaureeRetrouveSaPlace(): void
    {
        $this->connecter('etudiant');
        $site = $this->trace('Site vitrine d’une association');
        $this->envoyer('DELETE', $site);
        self::assertSame([], $this->lire($this->page('Projet web'))['traces']);

        $this->restaurer($site);

        self::assertResponseStatusCodeSame(204);
        self::assertSame([$site], $this->lire($this->page('Projet web'))['traces']);
        self::assertContains($site, array_column($this->lire('/api/traces')['member'], '@id'));
        self::assertSame(0, $this->lire('/api/corbeille')['totalItems']);
    }

    public function testUnePageRestaureeLaisseLesTracesPlaceesAilleurs(): void
    {
        $this->connecter('etudiant');
        $video = $this->trace('Motion design du festival');
        $this->envoyer('DELETE', $this->page('Motion design'));
        // Sa vidéo, libérée, est rangée dans l'autre page entre-temps
        $this->envoyer('PATCH', $this->page('Projet web'), ['traces' => [$this->trace('Site vitrine d’une association'), $video]]);

        $this->restaurer($this->page('Motion design'));

        self::assertResponseStatusCodeSame(204);
        self::assertSame([], $this->lire($this->page('Motion design'))['traces']);
        self::assertContains($video, $this->lire($this->page('Projet web'))['traces']);
    }

    public function testRefuseDeRestaurerUnSecondPortfolioDeLAnnee(): void
    {
        $this->connecter('etudiant');
        $ancien = $this->portfolio();
        $this->envoyer('DELETE', $ancien);
        $this->envoyer('POST', '/api/portfolios', ['intitule' => 'Nouveau', 'visibilite' => 'privee']);
        self::assertResponseStatusCodeSame(201);

        $reponse = $this->restaurer($ancien);

        self::assertResponseStatusCodeSame(409);
        self::assertSame('Vous avez déjà un portfolio pour cette année : supprimez-le avant de restaurer celui-ci.', $reponse['detail']);
    }

    public function testNeRestaureQueLesSiensEtCeQuiEstSupprime(): void
    {
        $this->connecter('etudiant');
        $this->restaurer($this->trace('Site vitrine d’une association'));
        self::assertResponseStatusCodeSame(404, 'Pas supprimée');
        $this->envoyer('DELETE', $this->trace('Site vitrine d’une association'));

        $this->connecter('etudiant2');
        $this->restaurer($this->trace('Site vitrine d’une association'));
        self::assertResponseStatusCodeSame(404);

        $this->connecter('enseignant');
        $this->restaurer($this->trace('Site vitrine d’une association'));
        self::assertResponseStatusCodeSame(403);
        $this->lire('/api/corbeille');
        self::assertResponseStatusCodeSame(403);

        // Sans corps JSON (formulaire d'un autre site) : la route ne répond pas
        $this->connecter('etudiant');
        $this->client->request('POST', $this->trace('Site vitrine d’une association') . '/restaurer');
        self::assertNotSame(204, $this->client->getResponse()->getStatusCode());
    }

    public function testEffaceApresTrenteJoursAvecLesFichiersInutilises(): void
    {
        $this->connecter('etudiant');
        $vieille = $this->trace('Affiche en cours');
        $recente = $this->trace('Motion design du festival');
        $this->envoyer('DELETE', $vieille);
        $this->envoyer('DELETE', $recente);
        $this->connection->executeStatement("UPDATE trace SET date_suppression = NOW() - INTERVAL '31 days' WHERE id = ?", [basename($vieille)]);
        $proprietaire = $this->connection->fetchOne("SELECT id FROM users WHERE username = 'etudiant'");
        $this->connection->insert('fichier', ['id' => '00000000-0000-4000-8000-000000000001', 'date_creation' => '2020-01-01', 'nom' => 'oublie.png', 'mime_type' => 'image/png', 'taille' => 1, 'proprietaire_id' => $proprietaire]);

        $compte = static::getContainer()->get(Corbeille::class)->vider(new \DateTimeImmutable());

        self::assertSame(1, $compte['traces']);
        self::assertSame(1, $compte['fichiers']);
        self::assertFalse($this->connection->fetchOne('SELECT 1 FROM trace WHERE id = ?', [basename($vieille)]));
        self::assertSame(1, (int) $this->connection->fetchOne('SELECT 1 FROM trace WHERE id = ?', [basename($recente)]), 'Encore restaurable');
        self::assertFalse($this->connection->fetchOne("SELECT 1 FROM fichier WHERE nom = 'oublie.png'"));
    }

    private function restaurer(string $iri): ?array
    {
        $this->client->request('POST', $iri . '/restaurer', server: ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/ld+json'], content: '{}');

        return json_decode((string) $this->client->getResponse()->getContent(), true);
    }

    private function trace(string $titre): string
    {
        return $this->iri(sprintf("SELECT '/api/traces/' || id FROM trace WHERE titre = '%s'", str_replace("'", "''", $titre)));
    }

    private function page(string $intitule): string
    {
        return $this->iri(sprintf("SELECT '/api/pages/' || id FROM page WHERE intitule = '%s'", $intitule));
    }

    private function portfolio(): string
    {
        return $this->iri("SELECT '/api/portfolios/' || p.id FROM portfolio p JOIN etudiant e ON e.id = p.etudiant_id WHERE e.username = 'etudiant' AND p.intitule = 'Mon parcours en MMI'");
    }
}
