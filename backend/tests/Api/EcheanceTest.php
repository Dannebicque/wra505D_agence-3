<?php

namespace App\Tests\Api;

use App\Tests\ApiTestCase;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Échéances (Sprint 5, E-DB-03, P-OR-06 ; décision du PO : saisies par l'enseignant). Fixtures : « enseignant » (MMI)
 * a posé une échéance pour l'année d'« etudiant », une pour l'un de ses groupes, et une passée.
 */
class EcheanceTest extends ApiTestCase
{
    public function testLEtudiantVoitSesEcheancesAVenir(): void
    {
        $this->connecter('etudiant');

        $liste = $this->lire('/api/echeances');

        self::assertResponseIsSuccessful();
        self::assertSame(['Rendu du dossier de TP', 'Dépôt des traces du projet tutoré'], array_column($liste['member'], 'libelle'), 'À venir, la plus proche d’abord');
        $echeance = $liste['member'][0];
        $cles = array_keys($echeance);
        sort($cles);
        self::assertSame(['@id', '@type', 'annee', 'date', 'dateCreation', 'enseignant', 'groupe', 'libelle'], $cles);
        self::assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}$/', $echeance['date']);
        self::assertNull($echeance['annee']);
        self::assertStringStartsWith('/api/groupes/', $echeance['groupe']);
    }

    public function testLEnseignantVoitCellesDeSonDepartement(): void
    {
        $this->connecter('enseignant');
        self::assertSame(3, $this->lire('/api/echeances')['totalItems'], 'Passées comprises');

        $this->connecter('enseignant2');
        self::assertSame(0, $this->lire('/api/echeances')['totalItems']);
    }

    public function testCreeUneEcheancePourUneAnneeDeSonDepartement(): void
    {
        $this->connecter('enseignant');

        $echeance = $this->envoyer('POST', '/api/echeances', ['libelle' => '  Soutenance  ', 'date' => $this->dans(20), 'annee' => $this->annee(), 'enseignant' => '/api/enseignants/999']);

        self::assertResponseStatusCodeSame(201);
        self::assertSame('Soutenance', $echeance['libelle']);
        self::assertSame($this->iri("SELECT '/api/enseignants/' || id FROM enseignant WHERE username = 'enseignant'"), $echeance['enseignant']);

        $this->connecter('etudiant');
        self::assertContains('Soutenance', array_column($this->lire('/api/echeances')['member'], 'libelle'));
        $this->connecter('etudiant2');
        self::assertContains('Soutenance', array_column($this->lire('/api/echeances')['member'], 'libelle'), 'Même année');
    }

    public static function saisiesInvalides(): iterable
    {
        yield 'libellé vide' => [['libelle' => ' '], 'libelle', 'Le libellé est obligatoire.'];
        yield 'libellé trop long' => [['libelle' => str_repeat('a', 101)], 'libelle', 'Le libellé ne doit pas dépasser 100 caractères.'];
        yield '30 février' => [['date' => '2030-02-30'], 'date', 'Saisissez une date valide.'];
        yield 'sans cible' => [['annee' => null], 'annee', 'Choisissez une année ou un groupe.'];
        yield 'deux cibles' => [['groupe' => 'GROUPE'], 'annee', 'Choisissez une année ou un groupe.'];
        yield 'date passée' => [['date' => '2020-01-01'], 'date', 'La date de l’échéance est déjà passée.'];
    }

    #[DataProvider('saisiesInvalides')]
    public function testRefuseUneSaisieInvalide(array $champs, string $champ, string $message): void
    {
        $this->connecter('enseignant');
        $corps = [...['libelle' => 'Soutenance', 'date' => $this->dans(20), 'annee' => $this->annee()], ...$champs];
        $corps = array_map(fn ($v) => 'GROUPE' === $v ? $this->iri('SELECT \'/api/groupes/\' || id FROM groupe LIMIT 1') : $v, $corps);

        $reponse = $this->envoyer('POST', '/api/echeances', $corps);

        self::assertResponseStatusCodeSame(422);
        self::assertSame([[$champ, $message]], array_map(static fn (array $v) => [$v['propertyPath'], $v['message']], $reponse['violations']));
    }

    public function testDateDuMauvaisTypeSousLeChampDate(): void
    {
        $this->connecter('enseignant');

        $reponse = $this->envoyer('POST', '/api/echeances', ['libelle' => 'Soutenance', 'date' => ['a' => 1], 'annee' => $this->annee()]);

        self::assertResponseStatusCodeSame(422);
        self::assertSame('date', $reponse['violations'][0]['propertyPath']);
    }

    public function testRefuseUneAnneeDUnAutreDepartement(): void
    {
        $this->connecter('enseignant2');

        $reponse = $this->envoyer('POST', '/api/echeances', ['libelle' => 'Soutenance', 'date' => $this->dans(20), 'annee' => $this->annee()]);

        self::assertResponseStatusCodeSame(422);
        self::assertSame('Choisissez une année ou un groupe de votre département.', $reponse['violations'][0]['message']);
    }

    public function testSeulLAuteurModifieOuSupprime(): void
    {
        $echeance = $this->iri("SELECT '/api/echeances/' || id FROM echeance WHERE libelle = 'Rendu du dossier de TP'");

        $this->connecter('etudiant');
        $this->envoyer('PATCH', $echeance, ['libelle' => 'Pirate']);
        self::assertResponseStatusCodeSame(403);
        $this->envoyer('POST', '/api/echeances', ['libelle' => 'Pirate', 'date' => $this->dans(5), 'annee' => $this->annee()]);
        self::assertResponseStatusCodeSame(403);

        $this->connecter('enseignant3');
        $this->envoyer('PATCH', $echeance, ['libelle' => 'Pirate']);
        self::assertResponseStatusCodeSame(403);

        $this->connecter('enseignant');
        self::assertSame('Rendu reporté', $this->envoyer('PATCH', $echeance, ['libelle' => 'Rendu reporté', 'date' => $this->dans(7)])['libelle']);
        $this->envoyer('DELETE', $echeance);
        self::assertResponseStatusCodeSame(204);
    }

    private function annee(): string
    {
        return $this->iri("SELECT '/api/annees/' || s.annee_id FROM etudiant e JOIN semestre s ON s.id = e.semestre_id WHERE e.username = 'etudiant'");
    }

    private function dans(int $jours): string
    {
        return (new \DateTimeImmutable("+$jours days"))->format('Y-m-d');
    }
}
