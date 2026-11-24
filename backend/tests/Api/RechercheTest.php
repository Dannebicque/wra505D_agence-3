<?php

namespace App\Tests\Api;

use App\Tests\ApiTestCase;

/**
 * Recherche globale (Sprint 5, C-03, C-04) : traces, pages et compétences lisibles par l'utilisateur, sans tenir
 * compte des accents ni de la casse.
 */
class RechercheTest extends ApiTestCase
{
    public function testTrouveSesTracesEtPagesSansAccentNiCasse(): void
    {
        $this->connecter('etudiant');

        $resultats = $this->lire('/api/recherche?q=' . urlencode('ASSOCIATION'));

        self::assertResponseIsSuccessful();
        self::assertSame([['trace', 'Site vitrine d’une association'], ['page', 'Projet web']], array_map(static fn (array $r) => [$r['type'], $r['titre']], $resultats['member']));
        $cles = array_keys($resultats['member'][0]);
        sort($cles);
        self::assertSame(['@type', 'extrait', 'ressource', 'titre', 'type'], $cles);
        self::assertStringStartsWith('/api/traces/', $resultats['member'][0]['ressource']);

        $competences = $this->lire('/api/recherche?type=competence&q=' . urlencode('developper'));
        self::assertSame(['competence'], array_unique(array_column($competences['member'], 'type')));
        self::assertNotEmpty($competences['member']);
    }

    public function testNeTrouvePasCeQueLUtilisateurNePeutPasLire(): void
    {
        $this->connecter('etudiant2');
        self::assertSame(0, $this->lire('/api/recherche?type=trace&q=vitrine')['totalItems'], 'Trace d’un autre étudiant');

        $this->connecter('enseignant');
        self::assertSame(1, $this->lire('/api/recherche?type=trace&q=vitrine')['totalItems']);
        self::assertSame(0, $this->lire('/api/recherche?type=trace&q=' . urlencode('Affiche en cours'))['totalItems'], 'Brouillon');

        $this->connecter('etudiant');
        $this->envoyer('DELETE', $this->iri("SELECT '/api/traces/' || id FROM trace WHERE titre = 'Site vitrine d’une association'"));
        self::assertSame(0, $this->lire('/api/recherche?type=trace&q=vitrine')['totalItems'], 'Corbeille');
    }

    public function testLesCaracteresSpeciauxSontCherchesTelsQuels(): void
    {
        $this->connecter('etudiant');

        self::assertSame(0, $this->lire('/api/recherche?q=' . urlencode('%%'))['totalItems']);
        self::assertSame(0, $this->lire('/api/recherche?q=' . urlencode('__'))['totalItems']);
    }

    public function testRefuseUneRechercheTropCourteOuSansCompte(): void
    {
        $this->connecter('etudiant');
        $reponse = $this->lire('/api/recherche?q=a');
        self::assertResponseStatusCodeSame(422);
        self::assertSame('q', $reponse['violations'][0]['propertyPath']);

        $this->connecter('admin');
        $this->lire('/api/recherche?q=web');
        self::assertResponseStatusCodeSame(403);
    }
}
