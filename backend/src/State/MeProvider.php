<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\Users;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * GET /api/me : l'utilisateur connecté (l'accès anonyme est déjà refusé par access_control).
 *
 * @implements ProviderInterface<Users>
 */
final class MeProvider implements ProviderInterface
{
    public function __construct(private readonly Security $security)
    {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): ?Users
    {
        $user = $this->security->getUser();

        return $user instanceof Users ? $user : null;
    }
}
