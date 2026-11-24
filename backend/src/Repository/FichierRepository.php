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
     * Fichier montré par un portfolio public hors corbeille : sa bannière, ou le contenu d'une trace finalisée
     * de l'une de ses pages hors corbeille (lien public, E-PF-06).
     */
    public function estPublic(Fichier $fichier): bool
    {
        return false !== $this->getEntityManager()->getConnection()->fetchOne(<<<'SQL'
            SELECT 1 FROM portfolio p
            -- Portfolio de l'étudiant propriétaire du fichier : le fichier d'un autre ne devient jamais public par lui
            JOIN users u ON u.etudiant_id = p.etudiant_id AND u.id = :proprietaire
            WHERE p.visibilite AND p.date_suppression IS NULL AND (
                p.banniere = :iri OR EXISTS (
                    SELECT 1 FROM page pa
                    JOIN ordre_trace ot ON ot.page_id = pa.id
                    JOIN trace t ON t.id = ot.trace_id
                    WHERE pa.portfolio_id = p.id AND pa.date_suppression IS NULL
                      AND t.date_suppression IS NULL AND t.statut = 'finalisee'
                      AND jsonb_exists(t.contenu::jsonb, :iri)
                )
            )
            LIMIT 1
            SQL, ['iri' => '/api/fichiers/' . $fichier->getId(), 'proprietaire' => $fichier->getProprietaire()->getId()]);
    }

    /**
     * Fichier d'une trace finalisée, hors corbeille, d'un étudiant de l'un de ces départements (lecture enseignant).
     *
     * @param list<int> $departements
     */
    public function lisibleParEnseignant(Fichier $fichier, array $departements): bool
    {
        return [] !== $departements && false !== $this->getEntityManager()->getConnection()->fetchOne(<<<'SQL'
            SELECT 1 FROM trace t
            JOIN bibliotheque b ON b.id = t.bibliotheque_id
            JOIN etudiant e ON e.id = b.etudiant_id
            JOIN semestre s ON s.id = e.semestre_id
            JOIN annee a ON a.id = s.annee_id
            JOIN diplome d ON d.id = a.diplome_id
            -- Le fichier doit être celui de l'étudiant de la trace
            JOIN users u ON u.etudiant_id = e.id AND u.id = :proprietaire
            WHERE t.statut = 'finalisee' AND t.date_suppression IS NULL
              AND d.departement_id IN (:departements)
              AND jsonb_exists(t.contenu::jsonb, :iri)
            LIMIT 1
            SQL, ['iri' => '/api/fichiers/' . $fichier->getId(), 'proprietaire' => $fichier->getProprietaire()->getId(), 'departements' => $departements], ['departements' => \Doctrine\DBAL\ArrayParameterType::INTEGER]);
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
