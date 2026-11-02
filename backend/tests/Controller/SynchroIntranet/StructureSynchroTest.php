<?php

namespace App\Tests\Controller\SynchroIntranet;

use App\Controller\SynchroIntranet\StructureSynchro;
use App\Entity\Etudiant;
use App\Entity\Semestre;
use App\Tests\DatabaseTestCase;
use Doctrine\DBAL\Exception\ForeignKeyConstraintViolationException;
use Symfony\Component\HttpClient\Response\MockResponse;

/**
 * Réinitialisation des tables quand le département « Fixtures » existe (données de démo).
 */
class StructureSynchroTest extends DatabaseTestCase
{
    private const TABLES = [
        'departement', 'apc_referentiel', 'competence', 'apc_niveau', 'apc_apprentissage_critique',
        'apc_parcours', 'diplome', 'annee', 'semestre', 'type_groupe', 'groupe',
    ];

    public function testVideLesTablesPuisRepondEnJson(): void
    {
        self::assertGreaterThan(0, $this->compte('groupe'), 'Les fixtures doivent être chargées');

        $reponse = $this->appelerAction(StructureSynchro::class, 'index', new MockResponse('[]'));

        self::assertSame(200, $reponse->getStatusCode());
        self::assertSame(['message' => 'Les données ont bien été importées.'], json_decode($reponse->getContent(), true));
        foreach (self::TABLES as $table) {
            self::assertSame(0, $this->compte($table), "Table $table non vidée");
        }
        self::assertSame(0, $this->compte('etudiant'), "L'étudiant de démo doit être supprimé");
    }

    public function testAnnuleToutSiUneDonneeLieeBloqueLaSuppression(): void
    {
        // Un vrai étudiant rattaché à un semestre empêche de vider les semestres
        $etudiant = (new Etudiant())->setUsername('vrai.etudiant');
        $etudiant->setSemestre($this->em->getRepository(Semestre::class)->findOneBy([]));
        $this->em->persist($etudiant);
        $this->em->flush();
        $avant = array_map($this->compte(...), self::TABLES);

        try {
            $this->appelerAction(StructureSynchro::class, 'index', new MockResponse('[]'));
            self::fail('La suppression aurait dû échouer');
        } catch (ForeignKeyConstraintViolationException) {
        }

        self::assertSame($avant, array_map($this->compte(...), self::TABLES), 'Des tables ont été vidées malgré l\'échec');
    }
}
