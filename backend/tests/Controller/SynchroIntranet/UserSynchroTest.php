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
        $this->em->persist((new Etudiant())->setUsername('jdupont'));
        $this->em->flush();

        $reponse = $this->appelerAction(UserSynchro::class, 'updateEtudiant', new MockResponse('panne', ['http_code' => 500]));

        self::assertSame(200, $reponse->getStatusCode());
        self::assertSame([
            'message' => 'Les données ont bien été mises à jour.',
            'erreurs' => ['Erreur API (500) pour jdupont : panne'],
        ], json_decode($reponse->getContent(), true));
    }
}
