<?php

namespace App\Security;

use App\Entity\Users;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * Refuse la connexion d'un compte dont l'adresse mail n'a pas été vérifiée (comme l'ancienne version).
 */
class UserChecker implements UserCheckerInterface
{
    public function checkPreAuth(UserInterface $user): void
    {
    }

    // Après la vérification du mot de passe : sinon un mauvais mot de passe suffirait à savoir qu'un compte existe
    public function checkPostAuth(UserInterface $user, ?TokenInterface $token = null): void
    {
        if ($user instanceof Users && !$user->getIsVerified()) {
            throw new CustomUserMessageAccountStatusException("Votre compte n'est pas encore activé : vérifiez votre adresse mail.");
        }
    }
}
