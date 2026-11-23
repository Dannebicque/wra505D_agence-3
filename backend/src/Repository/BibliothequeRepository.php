<?php

/*
 * Copyright (c) 2023. | Cyndel Herolt | IUT de Troyes  - All Rights Reserved
 * @author cyndelherolt
 * @project UniFolio
 */
namespace App\Repository;

use App\Entity\Bibliotheque;
use App\Entity\Etudiant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Bibliotheque>
 *
 * @method Bibliotheque|null find($id, $lockMode = null, $lockVersion = null)
 * @method Bibliotheque|null findOneBy(array $criteria, array $orderBy = null)
 * @method Bibliotheque[]    findAll()
 * @method Bibliotheque[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class BibliothequeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Bibliotheque::class);
    }

    public function save(Bibliotheque $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * Bibliothèque qui reçoit les nouvelles traces de l'étudiant, créée au besoin.
     * shortcut: la plus récente fait foi ; à revoir si l'étudiant doit choisir l'année de ses traces.
     */
    public function courante(Etudiant $etudiant): Bibliotheque
    {
        $bibliotheque = $this->findOneBy(['etudiant' => $etudiant], ['id' => 'DESC']) ?? (new Bibliotheque())->setEtudiant($etudiant);
        // Bibliothèques créées par la synchro sans année : complétées depuis la fiche de l'étudiant
        $bibliotheque->setAnnee($bibliotheque->getAnnee() ?? $etudiant->getSemestre()?->getAnnee());
        $bibliotheque->setAnneeUniversitaire($bibliotheque->getAnneeUniversitaire() ?? $etudiant->getAnneeUniversitaire());
        $this->getEntityManager()->persist($bibliotheque);

        return $bibliotheque;
    }

    public function remove(Bibliotheque $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

//    /**
//     * @return Bibliotheque[] Returns an array of Bibliotheque objects
//     */
//    public function findByExampleField($value): array
//    {
//        return $this->createQueryBuilder('b')
//            ->andWhere('b.exampleField = :val')
//            ->setParameter('val', $value)
//            ->orderBy('b.id', 'ASC')
//            ->setMaxResults(10)
//            ->getQuery()
//            ->getResult()
//        ;
//    }

//    public function findOneBySomeField($value): ?Bibliotheque
//    {
//        return $this->createQueryBuilder('b')
//            ->andWhere('b.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
