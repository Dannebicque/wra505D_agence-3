<?php

namespace App\Tests\Controller\SynchroIntranet;

use App\Controller\SynchroIntranet\UserSynchro;
use App\Entity\Etudiant;
use App\Tests\DatabaseTestCase;
use Symfony\Component\HttpClient\Response\MockResponse;

class UserSynchroTest extends DatabaseTestCase
{
    public function testMiseAJourEtudiantsRenvoieLesErreursApiEnJson(): void
    {
        $etudiant = (new Etudiant())->setUsername('jdupont')->setNom('Dupont');
        $this->em->persist($etudiant);
        $this->em->flush();

        $reponse = $this->appelerAction(UserSynchro::class, 'updateEtudiant', new MockResponse('panne', ['http_code' => 500]));

        $json = json_decode($reponse->getContent(), true);
        self::assertSame(200, $reponse->getStatusCode());
        self::assertSame('Les données ont bien été mises à jour.', $json['message']);
        // Une erreur par étudiant interrogé (l'étudiant de démo « etudiant » est ignoré par la synchro)
        self::assertContains('Erreur API (500) pour jdupont : panne', $json['erreurs']);
        self::assertNotContains('Erreur API (500) pour etudiant : panne', $json['erreurs']);
        $this->em->refresh($etudiant);
        self::assertSame('Dupont', $etudiant->getNom(), "Un étudiant en erreur ne doit pas être modifié");
    }
}
