<?php

namespace App\Tests\Api;

use App\Tests\ApiTestCase;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Traces de l'étudiant (Sprint 1) : contrat de shared/types/trace.ts, règles de shared/utils/trace-validation.ts,
 * brouillon, corbeille et cloisonnement entre étudiants.
 */
class TraceTest extends ApiTestCase
{
    private const LIEN = ['titre' => 'Mon site', 'type' => 'lien', 'contenu' => ['https://exemple.fr'], 'statut' => 'finalisee'];

    public function testCreeUneTraceAuFormatDuContrat(): void
    {
        $this->connecter('etudiant');

        $trace = $this->creer([
            'description' => '  Un site vitrine  ',
            'contexte' => '   ',
            'dateRealisation' => '2026-01-15',
            'conceptionIa' => 'aucun',
            // Champs fixés par le serveur : ignorés
            'bibliotheque' => '/api/bibliotheques/999',
            'dateCreation' => '2000-01-01T00:00:00+00:00',
            'dateSuppression' => '2000-01-01T00:00:00+00:00',
        ]);

        $cles = array_keys($trace);
        sort($cles);
        self::assertSame(['@context', '@id', '@type', 'bibliotheque', 'conceptionIa', 'contenu', 'contexte', 'dateCreation', 'dateModification', 'dateRealisation', 'dateSuppression', 'description', 'legende', 'realisationIa', 'statut', 'titre', 'type'], $cles);
        self::assertSame('Trace', $trace['@type']);
        self::assertStringStartsWith('/api/traces/', $trace['@id']);
        self::assertSame($this->bibliotheque('etudiant'), $trace['bibliotheque']);
        self::assertSame('Un site vitrine', $trace['description']);
        self::assertNull($trace['contexte']);
        self::assertNull($trace['legende']);
        self::assertSame(['https://exemple.fr'], $trace['contenu']);
        self::assertSame('2026-01-15', $trace['dateRealisation']);
        self::assertSame('aucun', $trace['conceptionIa']);
        self::assertSame('non_renseigne', $trace['realisationIa']);
        self::assertStringStartsNotWith('2000', $trace['dateCreation']);
        self::assertNotNull($trace['dateModification']);
        self::assertNull($trace['dateSuppression']);
    }

    public function testBrouillonIncompletAccepte(): void
    {
        $this->connecter('etudiant');

        $trace = $this->creer(['titre' => 'Idée', 'type' => 'image', 'contenu' => [], 'statut' => 'brouillon']);

        self::assertSame('brouillon', $trace['statut']);
        self::assertSame([], $trace['contenu']);
    }

    public static function saisiesInvalides(): iterable
    {
        $demain = (new \DateTimeImmutable('tomorrow', new \DateTimeZone('Europe/Paris')))->format('Y-m-d');

        yield 'titre vide' => [['titre' => '   '], 'titre', 'Le titre est obligatoire.'];
        yield 'titre trop long' => [['titre' => str_repeat('é', 101)], 'titre', 'Le titre ne doit pas dépasser 100 caractères.'];
        yield 'description trop longue' => [['description' => str_repeat('a', 5001)], 'description', 'La description ne doit pas dépasser 5 000 caractères.'];
        yield 'contexte trop long' => [['contexte' => str_repeat('a', 256)], 'contexte', 'Le contexte ne doit pas dépasser 255 caractères.'];
        yield 'type inconnu' => [['type' => 'audio'], 'type', 'Choisissez un type de trace.'];
        yield 'type absent' => [['type' => null], 'type', 'Choisissez un type de trace.'];
        yield 'statut inconnu' => [['statut' => 'publiee'], 'statut', 'Statut de trace inconnu.'];
        yield 'finalisée sans contenu' => [['contenu' => ['  ']], 'contenu', 'Ajoutez le contenu de la trace avant de la finaliser.'];
        yield 'deux adresses' => [['contenu' => ['https://a.fr', 'https://b.fr']], 'contenu', 'Une seule adresse par trace.'];
        yield 'adresse trop longue' => [['contenu' => ['https://exemple.fr/' . str_repeat('a', 2048)]], 'contenu', 'L’adresse ne doit pas dépasser 2 048 caractères.'];
        yield 'lien javascript' => [['contenu' => ['javascript:alert(1)']], 'contenu', 'Saisissez une adresse web valide, commençant par https:// ou http://.'];
        yield 'lien sans schéma' => [['contenu' => ['exemple.fr']], 'contenu', 'Saisissez une adresse web valide, commençant par https:// ou http://.'];
        yield 'vidéo sans hôte' => [['type' => 'video', 'contenu' => ['https://']], 'contenu', 'Saisissez une adresse web valide, commençant par https:// ou http://.'];
        yield 'image hors des fichiers déposés' => [['type' => 'image', 'legende' => 'Un chat', 'contenu' => ['/etc/passwd']], 'contenu', 'Fichier invalide.'];
        yield 'image finalisée sans légende' => [['type' => 'image', 'contenu' => ['/fichiers/ancien.png']], 'legende', 'Ajoutez une légende décrivant l’image avant de finaliser.'];
        yield 'légende trop longue' => [['legende' => str_repeat('a', 101)], 'legende', 'La légende ne doit pas dépasser 100 caractères.'];
        yield 'conception IA inconnue' => [['conceptionIa' => 'beaucoup'], 'conceptionIa', 'Choisissez une déclaration d’usage de l’IA.'];
        yield 'réalisation IA inconnue' => [['realisationIa' => 'beaucoup'], 'realisationIa', 'Choisissez une déclaration d’usage de l’IA.'];
        yield '30 février' => [['dateRealisation' => '2026-02-30'], 'dateRealisation', 'Saisissez une date valide.'];
        yield 'date au format français' => [['dateRealisation' => '15/01/2026'], 'dateRealisation', 'Saisissez une date valide.'];
        yield 'date future' => [['dateRealisation' => $demain], 'dateRealisation', 'La date de réalisation ne peut pas être dans le futur.'];
    }

    #[DataProvider('saisiesInvalides')]
    public function testRefuseUneSaisieInvalideAvecLeMessageDuFront(array $champs, string $champ, string $message): void
    {
        $this->connecter('etudiant');

        $reponse = $this->envoyer('POST', '/api/traces', [...self::LIEN, ...$champs]);

        self::assertResponseStatusCodeSame(422);
        self::assertSame([[$champ, $message]], array_map(static fn (array $v) => [$v['propertyPath'], $v['message']], $reponse['violations']));
    }

    public function testValeurDuMauvaisTypeEn422(): void
    {
        $this->connecter('etudiant');

        $reponse = $this->envoyer('POST', '/api/traces', [...self::LIEN, 'titre' => 12]);

        self::assertResponseStatusCodeSame(422);
        self::assertSame('titre', $reponse['violations'][0]['propertyPath']);
    }

    public function testModifiePartiellementSansToucherAuxChampsDuServeur(): void
    {
        $this->connecter('etudiant');
        $trace = $this->creer(['description' => 'Avant']);

        $modifiee = $this->envoyer('PATCH', $trace['@id'], [
            'titre' => 'Nouveau titre',
            'bibliotheque' => '/api/bibliotheques/999',
            'dateSuppression' => '2020-01-01T00:00:00+00:00',
        ]);

        self::assertResponseIsSuccessful();
        self::assertSame('Nouveau titre', $modifiee['titre']);
        self::assertSame('Avant', $modifiee['description']);
        self::assertSame($trace['bibliotheque'], $modifiee['bibliotheque']);
        self::assertSame($trace['dateCreation'], $modifiee['dateCreation']);
        self::assertNull($modifiee['dateSuppression']);
    }

    public function testModificationInvalideNEnregistreRien(): void
    {
        $this->connecter('etudiant');
        $trace = $this->creer();

        $this->envoyer('PATCH', $trace['@id'], ['titre' => 'Nouveau', 'contenu' => []]);
        self::assertResponseStatusCodeSame(422);

        self::assertSame('Mon site', $this->lire($trace['@id'])['titre']);
    }

    public function testListeLesSeulesTracesDeLEtudiant(): void
    {
        $this->connecter('etudiant2');
        $autre = $this->creer()['@id'];
        $this->connecter('etudiant');
        $mienne = $this->creer()['@id'];

        $liste = $this->lire('/api/traces');

        self::assertResponseIsSuccessful();
        $iris = array_column($liste['member'], '@id');
        self::assertContains($mienne, $iris);
        self::assertNotContains($autre, $iris);
        self::assertSame(\count($iris), $liste['totalItems']);
    }

    public function testUnEtudiantNAtteintPasLaTraceDUnAutre(): void
    {
        $this->connecter('etudiant2');
        $iri = $this->creer()['@id'];
        $this->connecter('etudiant');

        $this->lire($iri);
        self::assertResponseStatusCodeSame(404);
        $this->envoyer('PATCH', $iri, ['titre' => 'Pirate']);
        self::assertResponseStatusCodeSame(404);
        $this->envoyer('DELETE', $iri);
        self::assertResponseStatusCodeSame(404);

        self::assertSame('Mon site', $this->connection->fetchOne('SELECT titre FROM trace WHERE id = ?', [basename($iri)]));
    }

    public function testEnseignantNAccedePasAuxTraces(): void
    {
        $this->connecter('enseignant');

        $this->lire('/api/traces');
        self::assertResponseStatusCodeSame(403);
        $this->envoyer('POST', '/api/traces', self::LIEN);
        self::assertResponseStatusCodeSame(403);
    }

    public function testSuppressionDouceDansLaCorbeille(): void
    {
        $this->connecter('etudiant');
        $iri = $this->creer()['@id'];

        $this->envoyer('DELETE', $iri);
        self::assertResponseStatusCodeSame(204);

        $this->lire($iri);
        self::assertResponseStatusCodeSame(404);
        self::assertNotContains($iri, array_column($this->lire('/api/traces')['member'], '@id'));
        $this->envoyer('PATCH', $iri, ['titre' => 'Retour']);
        self::assertResponseStatusCodeSame(404);
        // Toujours en base, restaurable (C-09)
        self::assertNotNull($this->connection->fetchOne('SELECT date_suppression FROM trace WHERE id = ?', [basename($iri)]));
    }

    public function testBibliothequeLisibleParSonSeulEtudiant(): void
    {
        $this->connecter('etudiant');

        $bibliotheque = $this->lire($this->bibliotheque('etudiant'));

        self::assertResponseIsSuccessful();
        $cles = array_keys($bibliotheque);
        sort($cles);
        self::assertSame(['@context', '@id', '@type', 'annee', 'anneeUniversitaire', 'etudiant'], $cles);
        self::assertSame($this->iri("SELECT '/api/etudiants/' || id FROM etudiant WHERE username = 'etudiant'"), $bibliotheque['etudiant']);
        self::assertStringStartsWith('/api/annees/', $bibliotheque['annee']);
        self::assertStringStartsWith('/api/annee_universitaires/', $bibliotheque['anneeUniversitaire']);

        $this->lire($this->bibliotheque('etudiant2'));
        self::assertResponseStatusCodeSame(404);
    }

    public function testBibliothequeCreeeOuCompleteeALaPremiereTrace(): void
    {
        // Comme après la synchro intranet : bibliothèque sans année, ou pas de bibliothèque du tout
        $this->connection->executeStatement("UPDATE bibliotheque SET annee_id = NULL, annee_universitaire_id = NULL WHERE etudiant_id = (SELECT id FROM etudiant WHERE username = 'etudiant')");
        $this->connection->executeStatement("DELETE FROM bibliotheque WHERE etudiant_id = (SELECT id FROM etudiant WHERE username = 'etudiant2') AND id NOT IN (SELECT bibliotheque_id FROM trace WHERE bibliotheque_id IS NOT NULL)");

        $this->connecter('etudiant');
        $complete = $this->lire($this->creer()['bibliotheque']);
        self::assertStringStartsWith('/api/annees/', $complete['annee']);

        $this->connecter('etudiant2');
        $creee = $this->creer()['bibliotheque'];
        self::assertSame($this->bibliotheque('etudiant2'), $creee);
    }

    private function creer(array $champs = []): array
    {
        $trace = $this->envoyer('POST', '/api/traces', [...self::LIEN, ...$champs]);
        self::assertResponseStatusCodeSame(201, json_encode($trace, \JSON_UNESCAPED_UNICODE));

        return $trace;
    }

    private function bibliotheque(string $username): string
    {
        return $this->iri("SELECT '/api/bibliotheques/' || b.id FROM bibliotheque b JOIN etudiant e ON e.id = b.etudiant_id WHERE e.username = '$username' ORDER BY b.id DESC LIMIT 1");
    }
}
