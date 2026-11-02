<?php

namespace App\Tests\Api;

use App\Tests\ApiTestCase;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Les réponses doivent correspondre exactement aux types du front (shared/types/structure.ts et utilisateur.ts) :
 * mêmes clés, aucun champ en plus (données personnelles) ni en moins (champs nullables compris).
 */
class ContratTest extends ApiTestCase
{
    public static function ressources(): iterable
    {
        yield 'Departement' => ['/api/departements', 'Departement', ['libelle']];
        yield 'Diplome' => ['/api/diplomes', 'Diplome', ['libelle', 'sigle', 'departement', 'parcours']];
        yield 'Annee' => ['/api/annees', 'Annee', ['libelle', 'ordre', 'diplome']];
        yield 'AnneeUniversitaire' => ['/api/annee_universitaires', 'AnneeUniversitaire', ['libelle', 'annee', 'active']];
        yield 'Semestre' => ['/api/semestres', 'Semestre', ['libelle', 'ordre', 'annee']];
        yield 'Groupe' => ['/api/groupes', 'Groupe', ['libelle', 'type', 'semestre', 'parcours']];
        yield 'Parcours' => ['/api/parcours', 'Parcours', ['libelle', 'code', 'referentiel']];
        yield 'Etudiant' => ['/api/etudiants', 'Etudiant', ['prenom', 'nom', 'mailUniv', 'semestre', 'groupes', 'anneeUniversitaire', 'user']];
        yield 'Enseignant' => ['/api/enseignants', 'Enseignant', ['prenom', 'nom', 'mailUniv', 'departements', 'user']];
    }

    /**
     * @param string[] $champs
     */
    #[DataProvider('ressources')]
    public function testCollectionAuFormatDuContrat(string $url, string $type, array $champs): void
    {
        $this->connecter('admin');

        $collection = $this->lire($url);

        self::assertResponseIsSuccessful();
        self::assertSame('Collection', $collection['@type']);
        self::assertGreaterThan(0, $collection['totalItems']);
        $element = $collection['member'][0];
        self::assertSame($type, $element['@type']);
        self::assertStringStartsWith('/api/', $element['@id']);
        $attendu = ['@id', '@type', ...$champs];
        sort($attendu);
        $obtenu = array_keys($element);
        sort($obtenu);
        self::assertSame($attendu, $obtenu);
    }

    public function testUtilisateurCourantAuFormatDuContrat(): void
    {
        $this->connecter('enseignant');

        $me = $this->lire('/api/me');

        $cles = array_keys($me);
        sort($cles);
        self::assertSame(['@context', '@id', '@type', 'email', 'enseignant', 'etudiant', 'roles', 'username'], $cles);
        self::assertNull($me['etudiant']);
        self::assertStringStartsWith('/api/enseignants/', $me['enseignant']);
    }

    public function testEtudiantRelationsEnIri(): void
    {
        $this->connecter('enseignant');

        $etudiant = $this->lire('/api/etudiants')['member'][0];

        self::assertStringStartsWith('/api/semestres/', $etudiant['semestre']);
        self::assertStringStartsWith('/api/annee_universitaires/', $etudiant['anneeUniversitaire']);
        self::assertStringStartsWith('/api/users/', $etudiant['user']);
        self::assertCount(3, $etudiant['groupes'], 'Un groupe CM, un TD et un TP');
    }

    public function testPaginationHydraParTrente(): void
    {
        $this->connecter('admin');

        $groupes = $this->lire('/api/groupes');

        self::assertCount(30, $groupes['member']);
        self::assertSame('PartialCollectionView', $groupes['view']['@type']);
        self::assertSame('/api/groupes?page=2', $groupes['view']['next']);
    }

    public function testReferentielPasEncoreExpose(): void
    {
        // Sprint 0 : seules ses IRI existent (exposition au Sprint 1)
        $this->connecter('admin');
        $referentiel = $this->lire('/api/parcours')['member'][0]['referentiel'];
        self::assertStringStartsWith('/api/referentiels/', $referentiel);

        $this->lire($referentiel);

        self::assertResponseStatusCodeSame(404);
    }
}
