<?php

namespace App\Tests\Api;

use App\Tests\ApiTestCase;

/**
 * Association d'un niveau de compétence à une trace (Sprint 1, E-CP-02) : contrat de shared/types/evaluation.ts,
 * validation toujours en attente à la création, retrait possible tant qu'elle n'est pas évaluée.
 */
class ValidationTest extends ApiTestCase
{
    /** Niveau du référentiel MMI (département des étudiants des fixtures). */
    private const NIVEAU_MMI = "SELECT '/api/niveaux/' || n.id FROM apc_niveau n JOIN competence c ON c.id = n.competences_id JOIN apc_referentiel r ON r.id = c.referentiel_id WHERE r.departement_id = 1 ORDER BY n.id LIMIT 1 OFFSET %d";

    public function testAssocieUnNiveauEnAttente(): void
    {
        $this->connecter('etudiant');
        $trace = $this->trace();

        $validation = $this->envoyer('POST', '/api/validations', [
            'trace' => $trace,
            'niveau' => $this->niveau(),
            // Réservés à l'évaluation par l'enseignant : ignorés
            'etat' => 3,
            'enseignant' => $this->iri("SELECT '/api/enseignants/' || id FROM enseignant LIMIT 1"),
        ]);

        self::assertResponseStatusCodeSame(201);
        $cles = array_keys($validation);
        sort($cles);
        self::assertSame(['@context', '@id', '@type', 'dateCreation', 'dateModification', 'enseignant', 'etat', 'niveau', 'trace'], $cles);
        self::assertSame('Validation', $validation['@type']);
        self::assertSame($trace, $validation['trace']);
        self::assertSame($this->niveau(), $validation['niveau']);
        self::assertSame(0, $validation['etat']);
        self::assertNull($validation['enseignant']);
        self::assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}$/', $validation['dateCreation']);
        self::assertNull($validation['dateModification']);
    }

    public function testRefuseUnNiveauDejaAssocieOuAbsent(): void
    {
        $this->connecter('etudiant');
        $trace = $this->trace();
        $this->associer($trace, $this->niveau());

        $doublon = $this->envoyer('POST', '/api/validations', ['trace' => $trace, 'niveau' => $this->niveau()]);
        self::assertResponseStatusCodeSame(422);
        self::assertSame([['niveau', 'Ce niveau de compétence est déjà associé à la trace.']], $this->violations($doublon));

        $sansNiveau = $this->envoyer('POST', '/api/validations', ['trace' => $trace]);
        self::assertResponseStatusCodeSame(422);
        self::assertSame([['niveau', 'Choisissez un niveau de compétence.']], $this->violations($sansNiveau));
    }

    public function testNiveauInconnuSignaleSurLeChampNiveau(): void
    {
        $this->connecter('etudiant');

        $reponse = $this->envoyer('POST', '/api/validations', ['trace' => $this->trace(), 'niveau' => '/api/niveaux/999999']);

        self::assertResponseStatusCodeSame(422);
        self::assertSame([['niveau', 'Niveau de compétence introuvable.']], array_map(static fn (array $v) => [$v['propertyPath'], $v['message']], $reponse['violations']));
    }

    public function testRefuseUnNiveauDUnAutreReferentiel(): void
    {
        $this->connecter('etudiant');
        $autreDepartement = $this->iri("SELECT '/api/niveaux/' || n.id FROM apc_niveau n JOIN competence c ON c.id = n.competences_id JOIN apc_referentiel r ON r.id = c.referentiel_id WHERE r.departement_id <> 1 LIMIT 1");

        $reponse = $this->envoyer('POST', '/api/validations', ['trace' => $this->trace(), 'niveau' => $autreDepartement]);

        self::assertResponseStatusCodeSame(422);
        self::assertSame([['niveau', 'Ce niveau ne fait pas partie du référentiel de votre formation.']], $this->violations($reponse));
    }

    public function testRefuseLaTraceDUnAutreEtudiantOuDeLaCorbeille(): void
    {
        $this->connecter('etudiant2');
        $autre = $this->trace();
        $this->connecter('etudiant');
        $supprimee = $this->trace();
        $this->envoyer('DELETE', $supprimee);

        foreach (['trace d’un autre étudiant' => $autre, 'trace dans la corbeille' => $supprimee] as $cas => $trace) {
            $reponse = $this->envoyer('POST', '/api/validations', ['trace' => $trace, 'niveau' => $this->niveau()]);
            self::assertResponseStatusCodeSame(422, $cas);
            self::assertSame('trace', $reponse['violations'][0]['propertyPath'], $cas);
        }
        self::assertSame(0, (int) $this->connection->fetchOne('SELECT COUNT(*) FROM validation WHERE trace_id = ?', [basename($autre)]));
    }

    public function testListeLesSeulesValidationsDeSesTracesHorsCorbeille(): void
    {
        $this->connecter('etudiant2');
        $autre = $this->associer($this->trace(), $this->niveau());
        $this->connecter('etudiant');
        $trace = $this->trace();
        $mienne = $this->associer($trace, $this->niveau());
        $corbeille = $this->associer($this->trace(), $this->niveau(1));
        $this->envoyer('DELETE', $this->lire($corbeille)['trace']);

        $iris = array_column($this->lire('/api/validations')['member'], '@id');

        self::assertResponseIsSuccessful();
        self::assertContains($mienne, $iris);
        self::assertNotContains($autre, $iris);
        self::assertNotContains($corbeille, $iris);
        $this->lire($autre);
        self::assertResponseStatusCodeSame(404);
    }

    public function testRetireUnNiveauEnAttenteSansToucherALaTrace(): void
    {
        $this->connecter('etudiant');
        $trace = $this->trace();
        $validation = $this->associer($trace, $this->niveau());

        $this->envoyer('DELETE', $validation);

        self::assertResponseStatusCodeSame(204);
        $this->lire($validation);
        self::assertResponseStatusCodeSame(404);
        $this->lire($trace);
        self::assertResponseIsSuccessful();
    }

    public function testNeRetirePasUnNiveauEvalue(): void
    {
        $this->connecter('etudiant');
        $validation = $this->associer($this->trace(), $this->niveau());
        $this->connection->executeStatement('UPDATE validation SET etat = 3 WHERE id = ?', [basename($validation)]);

        $reponse = $this->envoyer('DELETE', $validation);

        self::assertResponseStatusCodeSame(409);
        self::assertSame('Ce niveau a déjà été évalué : il ne peut plus être retiré de la trace.', $reponse['detail']);
    }

    public function testUnEtudiantNeRetirePasLaValidationDUnAutre(): void
    {
        $this->connecter('etudiant2');
        $validation = $this->associer($this->trace(), $this->niveau());
        $this->connecter('etudiant');

        $this->envoyer('DELETE', $validation);

        self::assertResponseStatusCodeSame(404);
    }

    public function testCorpsReduitAUneIriNeRemetPasEnAttente(): void
    {
        $this->connecter('etudiant');
        $validation = $this->associer($this->trace(), $this->niveau());
        $this->connection->executeStatement('UPDATE validation SET etat = 3 WHERE id = ?', [basename($validation)]);

        $this->client->request('POST', '/api/validations', server: ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/ld+json'], content: json_encode($validation));

        self::assertResponseStatusCodeSame(422);
        self::assertSame(3, $this->lire($validation)['etat']);
    }

    private function trace(): string
    {
        $trace = $this->envoyer('POST', '/api/traces', ['titre' => 'Mon site', 'type' => 'lien', 'contenu' => ['https://exemple.fr'], 'statut' => 'finalisee']);
        self::assertResponseStatusCodeSame(201);

        return $trace['@id'];
    }

    private function niveau(int $rang = 0): string
    {
        return $this->iri(sprintf(self::NIVEAU_MMI, $rang));
    }

    private function associer(string $trace, string $niveau): string
    {
        $validation = $this->envoyer('POST', '/api/validations', ['trace' => $trace, 'niveau' => $niveau]);
        self::assertResponseStatusCodeSame(201, json_encode($validation, \JSON_UNESCAPED_UNICODE));

        return $validation['@id'];
    }

    /** @return list<array{string, string}> */
    private function violations(array $reponse): array
    {
        return array_map(static fn (array $v) => [$v['propertyPath'], $v['message']], $reponse['violations'] ?? []);
    }
}
