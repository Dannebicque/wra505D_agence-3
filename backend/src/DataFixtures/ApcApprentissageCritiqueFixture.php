<?php

namespace App\DataFixtures;

use App\Entity\ApcApprentissageCritique;
use App\Repository\ApcNiveauRepository;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\OrderedFixtureInterface;
use Doctrine\Persistence\ObjectManager;

/**
 * Deux apprentissages critiques par niveau. Libellés FACTICES : les vrais viennent de la synchro intranet
 * (comme dans server/data/referentiels.ts du front).
 */
class ApcApprentissageCritiqueFixture extends Fixture implements OrderedFixtureInterface
{
    public function __construct(private readonly ApcNiveauRepository $niveaux)
    {
    }

    public function getOrder(): int
    {
        return 12;
    }

    public function load(ObjectManager $manager): void
    {
        $id = 0;
        foreach ($this->niveaux->findBy([], ['id' => 'ASC']) as $niveau) {
            foreach ([1, 2] as $numero) {
                $manager->persist((new ApcApprentissageCritique())
                    ->setId(++$id)
                    ->setCode(sprintf('AC%d%d.0%d', $niveau->getCompetences()?->getId() ?? 0, $niveau->getOrdre(), $numero))
                    ->setLibelle(sprintf('Apprentissage critique %d du niveau « %s »', $numero, $niveau->getLibelle()))
                    ->setNiveaux($niveau));
            }
        }
        $manager->flush();
    }
}
