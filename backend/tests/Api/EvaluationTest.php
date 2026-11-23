<?php

namespace App\Tests\Api;

use App\Tests\ApiTestCase;

/**
 * Évaluation par l'enseignant (Sprint 3, P-EV-03, P-EV-07, P-OR-01) et notifications de l'étudiant (E-EV-04 à 07).
 * Fixtures : la validation de la vidéo d'« etudiant » est en attente ; celle du site est acquise et notifiée (lue),
 * le site a un commentaire visible notifié (non lu).
 */
class EvaluationTest extends ApiTestCase
{
    public function testFiltreLesEvaluationsEnAttenteEtParTrace(): void
    {
        $this->connecter('enseignant');

        $enAttente = $this->lire('/api/validations?etat=0')['member'];
        self::assertSame([0], array_unique(array_column($enAttente, 'etat')));
        self::assertSame([$this->enAttente()], array_column($enAttente, '@id'));

        $trace = $this->lire($this->enAttente())['trace'];
        self::assertSame([$trace], array_unique(array_column($this->lire('/api/validations?trace=' . urlencode($trace))['member'], 'trace')));
        foreach (['abc', '4', '/api/pages/1'] as $inconnu) {
            self::assertSame(0, $this->lire('/api/validations?trace=' . urlencode($inconnu))['totalItems'], $inconnu);
        }
    }

    public function testEvalueEtNotifieLEtudiant(): void
    {
        $this->connecter('enseignant');

        $validation = $this->envoyer('PATCH', $this->enAttente(), ['etat' => 2, 'enseignant' => '/api/enseignants/999', 'trace' => '/api/traces/1', 'niveau' => '/api/niveaux/1']);

        self::assertResponseIsSuccessful();
        self::assertSame(2, $validation['etat']);
        self::assertSame($this->iri("SELECT '/api/enseignants/' || id FROM enseignant WHERE username = 'enseignant'"), $validation['enseignant']);
        self::assertSame(date('Y-m-d'), $validation['dateModification']);
        // Seul l'état change
        $avant = $this->connection->fetchAssociative('SELECT trace_id, apc_niveau_id FROM validation WHERE id = ?', [basename($this->enAttente())]);
        self::assertStringEndsWith('/' . $avant['trace_id'], $validation['trace']);

        $this->connecter('etudiant');
        $notification = $this->lire('/api/notifications')['member'][0];
        self::assertSame('evaluation', $notification['type']);
        self::assertSame($this->enAttente(), $notification['validation']);
        self::assertSame($validation['trace'], $notification['trace']);
        self::assertFalse($notification['lu']);
    }

    public function testModifieUneEvaluation(): void
    {
        $this->connecter('enseignant');
        $this->envoyer('PATCH', $this->enAttente(), ['etat' => 1]);

        $validation = $this->envoyer('PATCH', $this->enAttente(), ['etat' => 3]);

        self::assertResponseIsSuccessful();
        self::assertSame(3, $validation['etat']);
    }

    public function testRefuseUnEtatHorsDesTroisNiveaux(): void
    {
        $this->connecter('enseignant');

        foreach ([0, 4, null] as $etat) {
            $reponse = $this->envoyer('PATCH', $this->enAttente(), ['etat' => $etat]);
            self::assertResponseStatusCodeSame(422, var_export($etat, true));
            self::assertSame([['etat', 'Choisissez un niveau d’acquisition : non acquis, en cours d’acquisition ou acquis.']], array_map(static fn (array $v) => [$v['propertyPath'], $v['message']], $reponse['violations']));
        }
        self::assertSame(0, $this->lire($this->enAttente())['etat']);
    }

    public function testSeulUnEnseignantDuDepartementEvalue(): void
    {
        $this->connecter('etudiant');
        $this->envoyer('PATCH', $this->enAttente(), ['etat' => 3]);
        self::assertResponseStatusCodeSame(403);

        $this->connecter('enseignant2');
        $this->envoyer('PATCH', $this->enAttente(), ['etat' => 3]);
        self::assertResponseStatusCodeSame(404);

        self::assertSame(0, (int) $this->connection->fetchOne('SELECT etat FROM validation WHERE id = ?', [basename($this->enAttente())]));
    }

    public function testLEtudiantLitEtMarqueSesNotifications(): void
    {
        $this->connecter('etudiant');

        $liste = $this->lire('/api/notifications');

        self::assertResponseIsSuccessful();
        self::assertSame(['commentaire', 'evaluation'], array_column($liste['member'], 'type'), 'La plus récente d’abord');
        $notification = $liste['member'][0];
        $cles = array_keys($notification);
        sort($cles);
        self::assertSame(['@id', '@type', 'commentaire', 'dateCreation', 'destinataire', 'lu', 'trace', 'type', 'validation'], $cles);
        self::assertSame($this->iri("SELECT '/api/etudiants/' || id FROM etudiant WHERE username = 'etudiant'"), $notification['destinataire']);

        $lue = $this->envoyer('PATCH', $notification['@id'], ['lu' => true, 'type' => 'evaluation', 'destinataire' => '/api/etudiants/1']);
        self::assertResponseIsSuccessful();
        self::assertTrue($lue['lu']);
        self::assertSame('commentaire', $lue['type']);
    }

    public function testNotificationsCloisonnees(): void
    {
        $this->connecter('etudiant');
        $notification = $this->lire('/api/notifications')['member'][0]['@id'];

        $this->connecter('etudiant2');
        self::assertSame(0, $this->lire('/api/notifications')['totalItems']);
        $this->envoyer('PATCH', $notification, ['lu' => true]);
        self::assertResponseStatusCodeSame(404);

        $this->connecter('enseignant');
        $this->lire('/api/notifications');
        self::assertResponseStatusCodeSame(403);
    }

    private function enAttente(): string
    {
        return $this->iri("SELECT '/api/validations/' || v.id FROM validation v JOIN trace t ON t.id = v.trace_id WHERE t.titre = 'Motion design du festival'");
    }
}
