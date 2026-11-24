<?php

namespace App\Tests\Api;

use App\Tests\ApiTestCase;

/**
 * Bilans (Sprint 5, P-ST-03, P-ST-08 à P-ST-10). Fixtures : « etudiant » a une validation acquise (site) et une en
 * attente (vidéo), sur des traces finalisées ; le brouillon ne compte pas.
 */
class BilanTest extends ApiTestCase
{
    public function testBilanIndividuelParCompetenceEtNiveau(): void
    {
        $this->connecter('enseignant');

        $bilan = $this->lire('/api/bilans/etudiants/' . $this->etudiant('etudiant'));

        self::assertResponseIsSuccessful();
        self::assertSame(['acquis' => 1, 'enCours' => 0, 'nonAcquis' => 0, 'enAttente' => 1], $bilan['totaux']);
        $competence = $bilan['competences'][0];
        $cles = array_keys($competence);
        sort($cles);
        self::assertSame(['competence', 'couleur', 'libelle', 'niveaux', 'nomCourt', 'totaux'], $cles);
        self::assertStringStartsWith('/api/niveaux/', $competence['niveaux'][0]['niveau']);
        $somme = ['acquis' => 0, 'enCours' => 0, 'nonAcquis' => 0, 'enAttente' => 0];
        foreach ($bilan['competences'] as $c) {
            foreach ($c['totaux'] as $cle => $n) {
                $somme[$cle] += $n;
            }
        }
        self::assertSame($bilan['totaux'], $somme, 'Le total reprend les compétences');
    }

    public function testUneTraceDeLaCorbeilleOuEnBrouillonNeComptePas(): void
    {
        $this->connection->executeStatement("UPDATE trace SET date_suppression = NOW() WHERE titre = 'Motion design du festival'");
        $this->connection->executeStatement("UPDATE trace SET statut = 'brouillon' WHERE titre = 'Site vitrine d’une association'");
        $this->connecter('etudiant');

        $bilan = $this->lire('/api/bilans/etudiants/' . $this->etudiant('etudiant'));

        self::assertResponseIsSuccessful();
        self::assertSame(['acquis' => 0, 'enCours' => 0, 'nonAcquis' => 0, 'enAttente' => 0], $bilan['totaux'], 'L’étudiant lit le sien');
    }

    public function testBilanCollectifDUneAnneeEtDUnGroupe(): void
    {
        $this->connecter('enseignant');
        $annee = $this->iri("SELECT s.annee_id FROM etudiant e JOIN semestre s ON s.id = e.semestre_id WHERE e.username = 'etudiant'");
        $groupe = $this->iri("SELECT g.groupe_id FROM etudiant_groupe g JOIN etudiant e ON e.id = g.etudiant_id WHERE e.username = 'etudiant' LIMIT 1");

        $bilan = $this->lire("/api/bilans/annees/$annee");
        self::assertResponseIsSuccessful();
        self::assertSame('BilanCollectif', $bilan['@type']);
        self::assertSame(['acquis' => 1, 'enCours' => 0, 'nonAcquis' => 0, 'enAttente' => 1], $bilan['totaux']);
        self::assertCount(2, $bilan['etudiants'], 'Les deux étudiants de l’année');
        self::assertNotEmpty($bilan['competences']);

        $this->lire("/api/bilans/groupes/$groupe");
        self::assertResponseIsSuccessful();
    }

    public function testExportCsv(): void
    {
        $this->connecter('enseignant');
        $annee = $this->iri("SELECT s.annee_id FROM etudiant e JOIN semestre s ON s.id = e.semestre_id WHERE e.username = 'etudiant'");
        $this->connection->executeStatement("UPDATE etudiant SET nom = '=HYPERLINK(1)' WHERE username = 'etudiant2'");

        $this->client->request('GET', "/api/bilans/annees/$annee?format=csv");

        self::assertResponseIsSuccessful();
        $reponse = $this->client->getResponse();
        self::assertStringStartsWith('text/csv', $reponse->headers->get('Content-Type'));
        self::assertStringStartsWith('attachment; filename="bilan-', $reponse->headers->get('Content-Disposition'));
        $lignes = array_map(static fn (string $l) => str_getcsv($l, ';', '"', ''), explode("\n", trim(substr((string) $reponse->getContent(), 3))));
        self::assertSame(['Nom', 'Prénom', 'Acquis', 'En cours d’acquisition', 'Non acquis', 'En attente'], $lignes[0]);
        self::assertContains("'=HYPERLINK(1)", array_column($lignes, 0), 'Formule neutralisée');
    }

    public function testHorsPerimetre(): void
    {
        $etudiant = $this->etudiant('etudiant');
        $annee = $this->iri("SELECT s.annee_id FROM etudiant e JOIN semestre s ON s.id = e.semestre_id WHERE e.username = 'etudiant'");

        $this->connecter('etudiant2');
        $this->lire("/api/bilans/etudiants/$etudiant");
        self::assertResponseStatusCodeSame(404);
        $this->lire("/api/bilans/annees/$annee");
        self::assertResponseStatusCodeSame(404);

        $this->connecter('enseignant2');
        $this->lire("/api/bilans/etudiants/$etudiant");
        self::assertResponseStatusCodeSame(404);

        $this->connecter('admin');
        $this->lire("/api/bilans/etudiants/$etudiant");
        self::assertResponseStatusCodeSame(403);

        $this->client->getCookieJar()->clear();
        $this->lire("/api/bilans/etudiants/$etudiant");
        self::assertResponseStatusCodeSame(401);
    }

    private function etudiant(string $username): string
    {
        return $this->iri("SELECT id FROM etudiant WHERE username = '$username'");
    }
}
