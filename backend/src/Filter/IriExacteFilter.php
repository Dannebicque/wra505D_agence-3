<?php

namespace App\Filter;

use ApiPlatform\Doctrine\Orm\Filter\FilterInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use Doctrine\ORM\QueryBuilder;
use Symfony\Component\DependencyInjection\Attribute\Exclude;

/**
 * Filtre ?<champ>=/api/<ressource>/{id} (ex. ?portfolio= sur /api/pages, ?trace= sur /api/validations), ou
 * ?<champ>=<entier> pour un champ scalaire (ex. ?etat=0). Toute autre valeur donne une liste vide : le filtre IRI
 * d'ApiPlatform ignore une IRI introuvable et plante sur une valeur mal formée. Le périmètre reste celui de
 * ProprietaireExtension.
 */
#[Exclude] // instancié dans les attributs des ressources, pas un service
final class IriExacteFilter implements FilterInterface
{
    /** @param string|null $ressource segment de l'IRI (« portfolios ») ; null pour un champ entier */
    public function __construct(private readonly string $champ, private readonly ?string $ressource, private readonly int $max = 2147483647)
    {
    }

    public function apply(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, ?Operation $operation = null, array $context = []): void
    {
        $valeur = $context['parameter']->getValue();
        $motif = null === $this->ressource ? '#^([0-9]+)\z#' : sprintf('#^/api/%s/([1-9][0-9]*)\z#', preg_quote($this->ressource, '#'));
        // Valeur dans les bornes d'un entier PostgreSQL (sinon erreur 500)
        $id = \is_string($valeur) && preg_match($motif, $valeur, $morceaux)
            ? filter_var($morceaux[1], \FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => $this->max]])
            : false;
        if (false === $id) {
            $queryBuilder->andWhere('1 = 0');

            return;
        }
        $parametre = $queryNameGenerator->generateParameterName($this->champ);
        $colonne = sprintf(null === $this->ressource ? '%s.%s' : 'IDENTITY(%s.%s)', $queryBuilder->getRootAliases()[0], $this->champ);
        $queryBuilder->andWhere(sprintf('%s = :%s', $colonne, $parametre))->setParameter($parametre, $id);
    }

    public function getDescription(string $resourceClass): array
    {
        return [];
    }
}
