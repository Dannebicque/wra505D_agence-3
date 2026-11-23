<?php

namespace App\Repository;

use App\Entity\Fichier;
use App\Entity\Users;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<Fichier>
 */
class FichierRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Fichier::class);
    }

    /** Fichier de cet utilisateur, ou null (identifiant mal formé, inconnu ou fichier d'un autre). */
    public function duProprietaire(string $id, Users $proprietaire): ?Fichier
    {
        return Uuid::isValid($id) ? $this->findOneBy(['id' => Uuid::fromString($id), 'proprietaire' => $proprietaire]) : null;
    }

    /**
     * Nombre de fichiers et octets déjà déposés par l'utilisateur.
     *
     * @return array{int, int}
     */
    public function utilisation(Users $proprietaire): array
    {
        $ligne = $this->createQueryBuilder('f')
            ->select('COUNT(f.id) AS nombre, COALESCE(SUM(f.taille), 0) AS octets')
            ->where('f.proprietaire = :proprietaire')
            ->setParameter('proprietaire', $proprietaire)
            ->getQuery()
            ->getSingleResult();

        return [(int) $ligne['nombre'], (int) $ligne['octets']];
    }
}
