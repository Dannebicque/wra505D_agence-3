<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\Portfolio;
use App\Repository\PortfolioRepository;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * GET /api/portfolios/{id}/public, sans connexion (E-PF-06) : un portfolio public hors corbeille, avec ses pages
 * et leurs traces finalisées. Un portfolio privé ou supprimé répond 404, comme un portfolio inexistant.
 *
 * @implements ProviderInterface<Portfolio>
 */
final class PortfolioPublicProvider implements ProviderInterface
{
    public function __construct(private readonly PortfolioRepository $portfolios)
    {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): Portfolio
    {
        $id = filter_var($uriVariables['id'] ?? null, \FILTER_VALIDATE_INT);
        $portfolio = false === $id ? null : $this->portfolios->findOneBy(['id' => $id, 'visibilite' => true, 'date_suppression' => null]);

        return $portfolio ?? throw new NotFoundHttpException('Portfolio introuvable.');
    }
}
