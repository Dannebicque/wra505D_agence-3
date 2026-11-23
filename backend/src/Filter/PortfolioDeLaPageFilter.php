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
        if (!\is_string($valeur) || !preg_match('#^/api/portfolios/(\d+)$#', $valeur, $id)) {
            $queryBuilder->andWhere('1 = 0');

            return;
        }
        $parametre = $queryNameGenerator->generateParameterName('portfolio');
        $queryBuilder->andWhere(sprintf('IDENTITY(%s.portfolio) = :%s', $queryBuilder->getRootAliases()[0], $parametre))
            ->setParameter($parametre, (int) $id[1]);
    }

    public function getDescription(string $resourceClass): array
    {
        return [];
    }
}
