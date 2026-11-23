<?php

namespace App\DataFixtures;

use App\Entity\ApcApprentissageCritique;
use App\Repository\AnneeRepository;
use App\Repository\ApcNiveauRepository;
use App\Repository\ApcParcoursRepository;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\OrderedFixtureInterface;
use Doctrine\Persistence\ObjectManager;

/**
 * Complète le référentiel des fixtures : deux apprentissages critiques par niveau (libellés FACTICES, les vrais
 * viennent de la synchro intranet, comme dans server/data/referentiels.ts du front), l'année des niveaux 1
 * et un parcours pour les niveaux 2 et 3 de « Développer ». Chargé après les années et les parcours.
 */
class ApcApprentissageCritiqueFixture extends Fixture implements OrderedFixtureInterface
{
    public function __construct(
        private readonly ApcNiveauRepository $niveaux,
        private readonly AnneeRepository $annees,
        private readonly ApcParcoursRepository $parcours,
    ) {
    }

    public function getOrder(): int
    {
        return 12;
    }

    public function load(ObjectManager $manager): void
    {
        $id = 0;
        $premiereAnnee = $this->annees->findOneBy(['ordre' => 1]);
        $unParcours = $this->parcours->findOneBy([], ['id' => 'ASC']);
        foreach ($this->niveaux->findBy([], ['id' => 'ASC']) as $niveau) {
            if (1 === $niveau->getOrdre()) {
                $niveau->setAnnees($premiereAnnee);
            } elseif ('Développer' === $niveau->getCompetences()?->getNomCourt() && null !== $unParcours) {
                $niveau->addApcParcour($unParcours);
            }
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
