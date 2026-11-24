<?php

namespace App\Tests\Api;

use App\Tests\ApiTestCase;

/**
 * CV de l'étudiant (Sprint 5, E-CV-01, E-CV-05, E-CV-06) : format de CV_DEMO (frontend/app/demo/etudiant.ts),
 * un CV par étudiant, lisible par lui seul.
 */
class CvTest extends ApiTestCase
{
    private const CV = [
        'titre' => '  Étudiante en BUT MMI  ',
        'email' => 'lea.martin@etudiant.exemple.fr',
        'telephone' => '06 12 34 56 78',
        'ville' => 'Troyes',
        'accroches' => ['stage' => 'Je cherche un stage.', 'alternance' => 'Je cherche une alternance.', 'cdi' => 'ignorée'],
        'experiences' => [['poste' => 'Développeuse web', 'structure' => 'BDE', 'periode' => '2026', 'description' => 'Refonte du site.', 'pirate' => 'x']],
        'formations' => [['diplome' => 'BUT MMI', 'etablissement' => 'IUT de Troyes', 'periode' => '2025 à 2028']],
        'langues' => [['langue' => 'Anglais', 'niveau' => 'B2 : avancé']],
        'competences' => ['Vue et Nuxt', '  ', 'Figma'],
    ];

    public function testCreeEtRelitSonCvAuFormatDuFront(): void
    {
        // « etudiant » a déjà le CV des fixtures
        $this->connecter('etudiant2');

        $cv = $this->envoyer('POST', '/api/cvs', self::CV);

        self::assertResponseStatusCodeSame(201);
        $cles = array_keys($cv);
        sort($cles);
        self::assertSame(['@context', '@id', '@type', 'accroches', 'competences', 'dateModification', 'email', 'experiences', 'formations', 'langues', 'nom', 'prenom', 'telephone', 'titre', 'ville'], $cles);
        self::assertSame('Étudiante en BUT MMI', $cv['titre']);
        self::assertSame(['stage' => 'Je cherche un stage.', 'alternance' => 'Je cherche une alternance.'], $cv['accroches']);
        self::assertSame([['id' => 1, 'poste' => 'Développeuse web', 'structure' => 'BDE', 'periode' => '2026', 'description' => 'Refonte du site.']], $cv['experiences']);
        self::assertSame([['id' => 1, 'langue' => 'Anglais', 'niveau' => 'B2 : avancé']], $cv['langues']);
        self::assertSame(['Vue et Nuxt', 'Figma'], $cv['competences']);
        self::assertNotNull($cv['prenom']);

        self::assertSame([$cv['@id']], array_column($this->lire('/api/cvs')['member'], '@id'));
        $modifie = $this->envoyer('PATCH', $cv['@id'], ['ville' => 'Reims', 'competences' => ['Git']]);
        self::assertResponseIsSuccessful();
        self::assertSame(['Reims', ['Git'], 'BUT MMI'], [$modifie['ville'], $modifie['competences'], $modifie['formations'][0]['diplome']]);
    }

    public function testUnSeulCvParEtudiant(): void
    {
        $this->connecter('etudiant');

        $reponse = $this->envoyer('POST', '/api/cvs', self::CV);

        self::assertResponseStatusCodeSame(422);
        self::assertSame('Vous avez déjà un CV : modifiez-le.', $reponse['violations'][0]['message']);
    }

    public function testRefuseUneSaisieInvalide(): void
    {
        $this->connecter('etudiant2');

        $reponse = $this->envoyer('POST', '/api/cvs', [...self::CV,
            'email' => 'pas-une-adresse',
            'telephone' => 'abc',
            'experiences' => [['poste' => '', 'structure' => str_repeat('a', 101)]],
            'langues' => [['langue' => 'Anglais', 'niveau' => 'Bilingue']],
        ]);

        self::assertResponseStatusCodeSame(422);
        self::assertSame(
            ['email', 'telephone', 'experiences[0].poste', 'experiences[0].structure', 'langues[0].niveau'],
            array_column($reponse['violations'], 'propertyPath'),
        );
    }

    public function testCvLisibleParSonSeulEtudiant(): void
    {
        $this->connecter('etudiant');
        $cv = $this->lire('/api/cvs')['member'][0]['@id'];

        $this->connecter('etudiant2');
        $this->lire($cv);
        self::assertResponseStatusCodeSame(404);
        $this->envoyer('PATCH', $cv, ['ville' => 'Pirate']);
        self::assertResponseStatusCodeSame(404);
        self::assertSame(0, $this->lire('/api/cvs')['totalItems']);

        $this->connecter('enseignant');
        $this->lire('/api/cvs');
        self::assertResponseStatusCodeSame(403);
    }
}
