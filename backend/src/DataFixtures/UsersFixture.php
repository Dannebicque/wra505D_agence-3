<?php

/*
 * Copyright (c) 2023. | Cyndel Herolt | IUT de Troyes  - All Rights Reserved
 * @author cyndelherolt
 * @project UniFolio
 */
namespace App\DataFixtures;

use App\Entity\Bibliotheque;
use App\Entity\Enseignant;
use App\Entity\EnseignantDepartement;
use App\Entity\Etudiant;
use App\Entity\Groupe;
use App\Entity\AnneeUniversitaire;
use App\Entity\Semestre;
use App\Repository\AnneeUniversitaireRepository;
use App\Repository\BibliothequeRepository;
use App\Repository\DepartementRepository;
use App\Repository\EnseignantRepository;
use App\Repository\EtudiantRepository;
use App\Repository\GroupeRepository;
use App\Repository\SemestreRepository;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use App\Entity\Users;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Doctrine\Common\DataFixtures\OrderedFixtureInterface;

class UsersFixture extends Fixture implements OrderedFixtureInterface
{
    public function getOrder(): int
    {
        // Retourner un entier qui indique l'ordre de chargement des fixations
        return 12;
    }

    public function __construct(
        private readonly UserPasswordHasherInterface $encoder,
        protected EtudiantRepository $etudiantRepository,
        protected BibliothequeRepository $bibliothequeRepository,
        protected EnseignantRepository $enseignantRepository,
        protected DepartementRepository $departementRepository,
        protected GroupeRepository $groupeRepository,
        protected SemestreRepository $semestreRepository,
        protected AnneeUniversitaireRepository $anneeUniversitaireRepository,
    ) {
    }

    public function load(ObjectManager $manager): void
    {
        $user1 = new Users();

        $password = $this->encoder->hashPassword($user1, 'test');

        $user1->setUsername('admin')
            ->setPassword($password)
            ->setRoles(['ROLE_ADMIN'])
            ->setIsVerified(true)
        ;

        $manager->persist($user1);

        //---------------------------------------------------------
        //---------------------------------------------------------
        //---------------------------------------------------------

        // Deux étudiants de démo (le second sert à tester qu'un étudiant ne voit pas la fiche d'un autre)
        $semestre = $this->semestreRepository->findOneBy(['id' => 7]);
        // Un groupe de chaque type (CM, TD, TP) du semestre, comme un vrai étudiant
        $groupes = [];
        foreach ($this->groupeRepository->createQueryBuilder('g')
            ->join('g.type_groupe', 't')
            ->join('t.semestre', 's')
            ->where('s = :semestre')
            ->setParameter('semestre', $semestre)
            ->orderBy('g.id')
            ->getQuery()->getResult() as $groupe) {
            $groupes[$groupe->getType()] ??= $groupe;
        }
        $anneeUniversitaire = $this->anneeUniversitaireRepository->findOneBy(['active' => true]);
        $this->etudiant($manager, 'etudiant', 'Camille', 'Martin', $semestre, $groupes, $anneeUniversitaire);
        $this->etudiant($manager, 'etudiant2', 'Lucas', 'Bernard', $semestre, $groupes, $anneeUniversitaire);

        $user11 = new Users();

        $password = $this->encoder->hashPassword($user11, 'test');

        $user11->setUsername('enseignant')
            ->setPassword($password)
            ->setRoles(['ROLE_ENSEIGNANT'])
            ->setEmail('prof@univ-reims.fr')
            ->setIsVerified(true);
        $enseignant = new Enseignant();

        $enseignant->setUsers($user11);

        $enseignant->setNom('Durand');
        $enseignant->setPrenom('Sophie');
        $enseignant->setMailPerso('persoTest@mail.com');
        $enseignant->setMailUniv('prof@univ-reims.fr');
        $enseignant->setTelephone('0123456782');
        $enseignant->setUsername('enseignant');
        $departement = $this->departementRepository->findOneBy(['id' => 1]);
        $newEnseignantDepartement = new EnseignantDepartement($enseignant, $departement);
        $enseignant->AddEnseignantDepartement($newEnseignantDepartement);

        $manager->persist($enseignant);
        $manager->persist($user11);

        // Enseignant d'un autre département (CJ) : ne voit aucun étudiant des fixtures (cloisonnement, Sprint 3)
        $user12 = new Users();
        $user12->setUsername('enseignant2')
            ->setPassword($this->encoder->hashPassword($user12, 'test'))
            ->setRoles(['ROLE_ENSEIGNANT'])
            ->setEmail('prof2@univ-reims.fr')
            ->setIsVerified(true);
        $enseignant2 = new Enseignant();
        $enseignant2->setUsers($user12);
        $enseignant2->setNom('Lefèvre');
        $enseignant2->setPrenom('Karim');
        $enseignant2->setMailUniv('prof2@univ-reims.fr');
        $enseignant2->setUsername('enseignant2');
        $enseignant2->AddEnseignantDepartement(new EnseignantDepartement($enseignant2, $this->departementRepository->findOneBy(['id' => 2])));
        $manager->persist($enseignant2);
        $manager->persist($user12);
        $manager->flush();
    }

    /**
     * @param Groupe[] $groupes
     */
    private function etudiant(ObjectManager $manager, string $username, string $prenom, string $nom, ?Semestre $semestre, array $groupes, ?AnneeUniversitaire $anneeUniversitaire): void
    {
        $user = new Users();
        $user->setUsername($username)
            ->setPassword($this->encoder->hashPassword($user, 'test'))
            ->setRoles(['ROLE_ETUDIANT'])
            ->setEmail($username . '@etudiant.univ-reims.fr')
            ->setIsVerified(true);

        $etudiant = new Etudiant();
        $etudiant->setUsers($user);
        $etudiant->setNom($nom);
        $etudiant->setPrenom($prenom);
        $etudiant->setMailPerso($username . '@exemple.fr');
        $etudiant->setMailUniv($username . '@etudiant.univ-reims.fr');
        $etudiant->setTelephone('0100000000');
        $etudiant->setUsername($username);
        $etudiant->setSemestre($semestre);
        $etudiant->setAnneeUniversitaire($anneeUniversitaire);
        foreach ($groupes as $groupe) {
            $etudiant->addGroupe($groupe);
        }

        $bibliotheque = new Bibliotheque();
        $bibliotheque->setEtudiant($etudiant)
            ->setAnnee($semestre?->getAnnee())
            ->setAnneeUniversitaire($anneeUniversitaire);

        $manager->persist($etudiant);
        $manager->persist($bibliotheque);
        $manager->persist($user);
    }
}
