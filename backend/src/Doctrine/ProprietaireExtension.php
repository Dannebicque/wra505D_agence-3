<?php

namespace App\Doctrine;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\Bibliotheque;
use App\Entity\Trace;
use App\Entity\Users;
use App\Entity\Validation;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Restreint les données d'un étudiant à lui seul, dans la requête même : une ressource d'autrui
 * répond 404 (son existence ne se devine pas) et une collection ne contient que les siennes.
 * Vaut aussi pour la lecture d'un IRI dans un corps de requête.
 */
final class ProprietaireExtension implements QueryCollectionExtensionInterface, QueryItemExtensionInterface
{
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

    private function restreindre(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $noms, string $resourceClass): void
    {
        if (!\in_array($resourceClass, [Trace::class, Bibliotheque::class, Validation::class], true)) {
            return;
        }
        $racine = $queryBuilder->getRootAliases()[0];
        $user = $this->security->getUser();
        $etudiant = $user instanceof Users ? $user->getEtudiant() : null;
        if (null === $etudiant) {
            $queryBuilder->andWhere('1 = 0');

            return;
        }
        $parametre = $noms->generateParameterName('etudiant');
        $queryBuilder->setParameter($parametre, $etudiant);

        if (Bibliotheque::class === $resourceClass) {
            $queryBuilder->andWhere(sprintf('%s.etudiant = :%s', $racine, $parametre));

            return;
        }
        // Validation : rattachée à l'étudiant par sa trace
        $trace = $racine;
        if (Validation::class === $resourceClass) {
            $trace = $noms->generateJoinAlias('trace');
            $queryBuilder->join(sprintf('%s.trace', $racine), $trace);
        }
        $bibliotheque = $noms->generateJoinAlias('bibliotheque');
        $queryBuilder
            ->join(sprintf('%s.bibliotheque', $trace), $bibliotheque)
            ->andWhere(sprintf('%s.etudiant = :%s', $bibliotheque, $parametre))
            // Corbeille : une trace supprimée n'est plus lue ni modifiable (restauration au Sprint 5, C-09)
            ->andWhere(sprintf('%s.date_suppression IS NULL', $trace));
    }
}
