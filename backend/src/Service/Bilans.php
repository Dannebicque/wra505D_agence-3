<?php

namespace App\Service;

use App\Entity\ApcReferentiel;
use App\Entity\Etudiant;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Bilans d'évaluation (P-ST-03, P-ST-08, P-ST-09) : comptes des validations (acquis, en cours, non acquis, en attente)
 * sur les traces finalisées hors corbeille, par compétence et par niveau du référentiel du département.
 */
final class Bilans
{
    /** État d'une validation => clé du bilan. */
    private const ETATS = [3 => 'acquis', 2 => 'enCours', 1 => 'nonAcquis', 0 => 'enAttente'];

    public function __construct(private readonly EntityManagerInterface $em)
    {
    }

    /** @return array<string, int> */
    public static function zero(): array
    {
        return array_fill_keys(array_values(self::ETATS), 0);
    }

    public function individuel(Etudiant $etudiant): array
    {
        $comptes = $this->comptes([$etudiant]);
        $competences = [];
        $totaux = self::zero();
        foreach ($this->referentiels($etudiant) as $referentiel) {
            foreach ($referentiel->getCompetences() as $competence) {
                $niveaux = [];
                $parCompetence = self::zero();
                foreach ($competence->getApcNiveaux() as $niveau) {
                    $parNiveau = $comptes[$etudiant->getId()][$niveau->getId()] ?? self::zero();
                    $parCompetence = self::ajouter($parCompetence, $parNiveau);
                    $niveaux[] = ['niveau' => '/api/niveaux/' . $niveau->getId(), 'libelle' => $niveau->getLibelle(), 'ordre' => $niveau->getOrdre(), 'totaux' => $parNiveau];
                }
                $totaux = self::ajouter($totaux, $parCompetence);
                $competences[] = [
                    'competence' => '/api/competences/' . $competence->getId(),
                    'libelle' => $competence->getLibelle(),
                    'nomCourt' => $competence->getNomCourt(),
                    'couleur' => $competence->getCouleur(),
                    'totaux' => $parCompetence,
                    'niveaux' => $niveaux,
                ];
            }
        }

        return ['totaux' => $totaux, 'competences' => $competences];
    }

    /** @param list<Etudiant> $etudiants */
    public function collectif(array $etudiants): array
    {
        $comptes = $this->comptes($etudiants);
        $lignes = [];
        $parCompetence = [];
        $totaux = self::zero();
        foreach ($etudiants as $etudiant) {
            $total = self::zero();
            foreach ($this->referentiels($etudiant) as $referentiel) {
                foreach ($referentiel->getCompetences() as $competence) {
                    $cle = '/api/competences/' . $competence->getId();
                    $parCompetence[$cle] ??= ['competence' => $cle, 'libelle' => $competence->getLibelle(), 'nomCourt' => $competence->getNomCourt(), 'couleur' => $competence->getCouleur(), 'totaux' => self::zero()];
                    foreach ($competence->getApcNiveaux() as $niveau) {
                        $c = $comptes[$etudiant->getId()][$niveau->getId()] ?? self::zero();
                        $total = self::ajouter($total, $c);
                        $parCompetence[$cle]['totaux'] = self::ajouter($parCompetence[$cle]['totaux'], $c);
                    }
                }
            }
            $totaux = self::ajouter($totaux, $total);
            $lignes[] = ['etudiant' => '/api/etudiants/' . $etudiant->getId(), 'prenom' => $etudiant->getPrenom(), 'nom' => $etudiant->getNom(), 'totaux' => $total];
        }
        usort($lignes, static fn (array $a, array $b) => [$a['nom'], $a['prenom']] <=> [$b['nom'], $b['prenom']]);

        return ['totaux' => $totaux, 'competences' => array_values($parCompetence), 'etudiants' => $lignes];
    }

    /**
     * Comptes par étudiant, par niveau et par état, en une requête.
     *
     * @param list<Etudiant> $etudiants
     *
     * @return array<int, array<int, array<string, int>>>
     */
    private function comptes(array $etudiants): array
    {
        if ([] === $etudiants) {
            return [];
        }
        $lignes = $this->em->createQuery(<<<'DQL'
            SELECT IDENTITY(b.etudiant) AS etudiant, IDENTITY(v.niveau) AS niveau, v.etat AS etat, COUNT(v.id) AS nombre
            FROM App\Entity\Validation v JOIN v.trace t JOIN t.bibliotheque b
            WHERE b.etudiant IN (:etudiants) AND t.statut = 'finalisee' AND t.date_suppression IS NULL
            GROUP BY b.etudiant, v.niveau, v.etat
            DQL)->setParameter('etudiants', $etudiants)->getArrayResult();

        $comptes = [];
        foreach ($lignes as $ligne) {
            $cle = self::ETATS[(int) $ligne['etat']] ?? null;
            if (null !== $cle) {
                $comptes[(int) $ligne['etudiant']][(int) $ligne['niveau']] ??= self::zero();
                $comptes[(int) $ligne['etudiant']][(int) $ligne['niveau']][$cle] += (int) $ligne['nombre'];
            }
        }

        return $comptes;
    }

    /** @return list<ApcReferentiel> référentiels du département de l'étudiant */
    private function referentiels(Etudiant $etudiant): array
    {
        $departement = $etudiant->getSemestre()?->getAnnee()?->getDiplome()?->getDepartement();

        return null === $departement ? [] : $this->em->getRepository(ApcReferentiel::class)->findBy(['departement' => $departement], ['id' => 'ASC']);
    }

    private static function ajouter(array $a, array $b): array
    {
        foreach ($b as $cle => $valeur) {
            $a[$cle] += $valeur;
        }

        return $a;
    }
}
