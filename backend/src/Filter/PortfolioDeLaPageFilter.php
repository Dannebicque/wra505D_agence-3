<?php

namespace App\Filter;

use ApiPlatform\Doctrine\Orm\Filter\FilterInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use Doctrine\ORM\QueryBuilder;

/**
 * ?portfolio=/api/portfolios/{id} sur /api/pages. Toute autre valeur donne une liste vide (le filtre IRI d'ApiPlatform
 * ignore une IRI introuvable et plante sur une valeur mal formée). La propriété reste vérifiée par ProprietaireExtension.
 */
final class PortfolioDeLaPageFilter implements FilterInterface
{
    public function apply(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, ?Operation $operation = null, array $context = []): void
    {
        $valeur = $context['parameter']->getValue();
        // Identifiant dans les bornes d'un entier PostgreSQL (sinon erreur 500)
        $id = \is_string($valeur) && preg_match('#^/api/portfolios/(\d+)\z#', $valeur, $morceaux)
            ? filter_var($morceaux[1], \FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 2147483647]])
            : false;
        if (false === $id) {
            $queryBuilder->andWhere('1 = 0');

            return;
        }
        $parametre = $queryNameGenerator->generateParameterName('portfolio');
        $queryBuilder->andWhere(sprintf('IDENTITY(%s.portfolio) = :%s', $queryBuilder->getRootAliases()[0], $parametre))
            ->setParameter($parametre, $id);
    }

    public function getDescription(string $resourceClass): array
    {
        return [];
    }
}
