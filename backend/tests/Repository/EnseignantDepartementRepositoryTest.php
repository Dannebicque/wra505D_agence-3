<?php

namespace App\Tests\Repository;

use App\Entity\Departement;
use App\Entity\Enseignant;
use App\Entity\EnseignantDepartement;
use App\Repository\EnseignantDepartementRepository;
use App\Tests\DatabaseTestCase;

class EnseignantDepartementRepositoryTest extends DatabaseTestCase
{
    public function testSaveEnregistreLeRattachement(): void
    {
        $enseignant = $this->em->getRepository(Enseignant::class)->findOneBy([]);
        $departement = $this->em->getRepository(Departement::class)->findOneBy(['libelle' => 'CJ']);
        $avant = $this->compte('enseignant_departement');

        self::getContainer()->get(EnseignantDepartementRepository::class)
            ->save(new EnseignantDepartement($enseignant, $departement), true);

        self::assertSame($avant + 1, $this->compte('enseignant_departement'));
    }
}
