<?php

namespace App\DataFixtures;

use App\Entity\AnneeUniversitaire;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\OrderedFixtureInterface;
use Doctrine\Persistence\ObjectManager;

class AnneeUniversitaireFixture extends Fixture implements OrderedFixtureInterface
{
    public function getOrder(): int
    {
        return 11;
    }

    public function load(ObjectManager $manager): void
    {
        $manager->persist((new AnneeUniversitaire())->setLibelle('2025-2026')->setAnnee(2025)->setActive(false));
        $manager->persist((new AnneeUniversitaire())->setLibelle('2026-2027')->setAnnee(2026)->setActive(true));
        $manager->flush();
    }
}
