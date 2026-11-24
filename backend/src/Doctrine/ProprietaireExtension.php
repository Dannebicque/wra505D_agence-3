<?php

namespace App\Doctrine;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\Bibliotheque;
use App\Entity\Commentaire;
use App\Entity\Etudiant;
use App\Entity\Notification;
use App\Entity\Page;
use App\Entity\Portfolio;
use App\Entity\Trace;
use App\Entity\Users;
use App\Entity\Validation;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Restreint les données dans la requête même : une ressource hors de portée répond 404 (son existence ne se devine
 * pas) et une collection ne contient que ce qui est permis. Vaut aussi pour la lecture d'un IRI dans un corps.
 * - Étudiant : ses seules données, hors corbeille ; d'un commentaire, seulement ceux qui lui sont visibles.
 * - Enseignant : les étudiants de ses départements, leurs traces finalisées, leurs portfolios publics (choix du PO,
 *   Sprint 3), le tout hors corbeille ; ni brouillon, ni portfolio privé.
 */
final class ProprietaireExtension implements QueryCollectionExtensionInterface, QueryItemExtensionInterface
{
    private const RESSOURCES = [Trace::class, Bibliotheque::class, Validation::class, Portfolio::class, Page::class, Commentaire::class, Notification::class, Etudiant::class];

    public function __construct(private readonly Security $security)
    {
    }

    public function applyToCollection(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, ?Operation $operation = null, array $context = []): void
    {
        $this->restreindre($queryBuilder, $queryNameGenerator, $resourceClass);
    }

    public function applyToItem(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, array $identifiers, ?Operation $operation = null, array $context = []): void
    {
        $this->restreindre($queryBuilder, $queryNameGenerator, $resourceClass);
    }

    private function restreindre(QueryBuilder $qb, QueryNameGeneratorInterface $noms, string $resourceClass): void
    {
        if (!\in_array($resourceClass, self::RESSOURCES, true)) {
            return;
        }
        // L'admin garde la liste des étudiants du Sprint 0 ; le reste lui est refusé par la sécurité des ressources
        if (Etudiant::class === $resourceClass && $this->security->isGranted('ROLE_ADMIN')) {
            return;
        }
        $user = $this->security->getUser();
        $racine = $qb->getRootAliases()[0];
        if ($user instanceof Users && null !== $user->getEtudiant()) {
            $this->pourEtudiant($qb, $noms, $resourceClass, $racine, $user);
        } elseif ($user instanceof Users && null !== $user->getEnseignant()) {
            $this->pourEnseignant($qb, $noms, $resourceClass, $racine, $user);
        } else {
            $qb->andWhere('1 = 0');
        }
    }

    private function pourEtudiant(QueryBuilder $qb, QueryNameGeneratorInterface $noms, string $classe, string $racine, Users $user): void
    {
        $moi = $noms->generateParameterName('etudiant');
        $qb->setParameter($moi, $user->getEtudiant());

        match ($classe) {
            Etudiant::class => $qb->andWhere(sprintf('%s = :%s', $racine, $moi)),
            Bibliotheque::class => $qb->andWhere(sprintf('%s.etudiant = :%s', $racine, $moi)),
            // Notification d'un commentaire repassé en note privée : masquée avec lui (lien mort et fuite sinon)
            Notification::class => $qb->andWhere(sprintf('%s.etudiant = :%s AND (%3$s.id IS NULL OR %3$s.visibilite = true)', $racine, $moi, $this->joindre($qb, $noms, $racine, 'commentaire', true))),
            Portfolio::class => $qb->andWhere(sprintf('%s.etudiant = :%s AND %1$s.date_suppression IS NULL', $racine, $moi)),
            // Une page d'un portfolio supprimé disparaît avec lui
            Page::class => $qb->andWhere(sprintf('%s.date_suppression IS NULL AND %s', $racine, sprintf('%s.etudiant = :%s AND %1$s.date_suppression IS NULL', $this->joindre($qb, $noms, $racine, 'portfolio'), $moi))),
            // Corbeille : une trace supprimée n'est plus lue ni modifiable (restauration au Sprint 5, C-09)
            Trace::class => $qb->andWhere($this->traceDeLEtudiant($qb, $noms, $racine, $moi)),
            Validation::class => $qb->andWhere($this->traceDeLEtudiant($qb, $noms, $this->joindre($qb, $noms, $racine, 'trace'), $moi)),
            // Commentaire visible, sur l'une de ses traces ou l'un de ses portfolios hors corbeille
            Commentaire::class => $qb->andWhere($this->commentairePourEtudiant($qb, $noms, $racine, $moi)),
        };
    }

    private function traceDeLEtudiant(QueryBuilder $qb, QueryNameGeneratorInterface $noms, string $trace, string $moi): string
    {
        return sprintf('%s.date_suppression IS NULL AND %s.etudiant = :%s', $trace, $this->joindre($qb, $noms, $trace, 'bibliotheque'), $moi);
    }

    private function commentairePourEtudiant(QueryBuilder $qb, QueryNameGeneratorInterface $noms, string $racine, string $moi): string
    {
        $trace = $this->joindre($qb, $noms, $racine, 'trace', true);
        $bibliotheque = $this->joindre($qb, $noms, $trace, 'bibliotheque', true);
        $portfolio = $this->joindre($qb, $noms, $racine, 'portfolio', true);

        return sprintf(
            '%s.visibilite = true AND ((%s.etudiant = :%s AND %s.date_suppression IS NULL) OR (%s.etudiant = :%3$s AND %5$s.date_suppression IS NULL))',
            $racine, $bibliotheque, $moi, $trace, $portfolio,
        );
    }

    private function pourEnseignant(QueryBuilder $qb, QueryNameGeneratorInterface $noms, string $classe, string $racine, Users $user): void
    {
        $departements = $noms->generateParameterName('departements');
        $qb->setParameter($departements, $user->getEnseignant()->getDepartements());

        match ($classe) {
            Etudiant::class => $qb->andWhere($this->duDepartement($qb, $noms, $racine, $departements)),
            Bibliotheque::class => $qb->andWhere($this->duDepartement($qb, $noms, $this->joindre($qb, $noms, $racine, 'etudiant'), $departements)),
            Trace::class => $qb->andWhere($this->traceVisible($qb, $noms, $racine, $departements)),
            Validation::class => $qb->andWhere($this->traceVisible($qb, $noms, $this->joindre($qb, $noms, $racine, 'trace'), $departements)),
            Portfolio::class => $qb->andWhere($this->portfolioVisible($qb, $noms, $racine, $departements)),
            Page::class => $qb->andWhere(sprintf('%s.date_suppression IS NULL AND %s', $racine, $this->portfolioVisible($qb, $noms, $this->joindre($qb, $noms, $racine, 'portfolio'), $departements))),
            // Commentaires (visibles ou non) sur une trace ou un portfolio qu'il peut lire
            Commentaire::class => $qb->andWhere(sprintf(
                '(%s) OR (%s)',
                $this->traceVisible($qb, $noms, $this->joindre($qb, $noms, $racine, 'trace', true), $departements, true),
                $this->portfolioVisible($qb, $noms, $this->joindre($qb, $noms, $racine, 'portfolio', true), $departements, true),
            )),
            // Les notifications sont celles des étudiants (E-EV-04 à 07)
            Notification::class => $qb->andWhere('1 = 0'),
        };
    }

    /** Trace finalisée, hors corbeille, d'un étudiant des départements. */
    private function traceVisible(QueryBuilder $qb, QueryNameGeneratorInterface $noms, string $trace, string $departements, bool $gauche = false): string
    {
        $etudiant = $this->joindre($qb, $noms, $this->joindre($qb, $noms, $trace, 'bibliotheque', $gauche), 'etudiant', $gauche);

        return sprintf("%s.statut = 'finalisee' AND %1\$s.date_suppression IS NULL AND %s", $trace, $this->duDepartement($qb, $noms, $etudiant, $departements, $gauche));
    }

    /** Portfolio public, hors corbeille, d'un étudiant des départements. */
    private function portfolioVisible(QueryBuilder $qb, QueryNameGeneratorInterface $noms, string $portfolio, string $departements, bool $gauche = false): string
    {
        $etudiant = $this->joindre($qb, $noms, $portfolio, 'etudiant', $gauche);

        return sprintf('%s.visibilite = true AND %1$s.date_suppression IS NULL AND %s', $portfolio, $this->duDepartement($qb, $noms, $etudiant, $departements, $gauche));
    }

    /** Étudiant inscrit dans l'un des départements (par son semestre → année → diplôme). */
    private function duDepartement(QueryBuilder $qb, QueryNameGeneratorInterface $noms, string $etudiant, string $departements, bool $gauche = false): string
    {
        $diplome = $etudiant;
        foreach (['semestre', 'annee', 'diplome'] as $relation) {
            $diplome = $this->joindre($qb, $noms, $diplome, $relation, $gauche);
        }

        return sprintf('%s.departement IN (:%s)', $diplome, $departements);
    }

    private function joindre(QueryBuilder $qb, QueryNameGeneratorInterface $noms, string $depuis, string $relation, bool $gauche = false): string
    {
        $alias = $noms->generateJoinAlias($relation);
        $gauche ? $qb->leftJoin(sprintf('%s.%s', $depuis, $relation), $alias) : $qb->join(sprintf('%s.%s', $depuis, $relation), $alias);

        return $alias;
    }
}
