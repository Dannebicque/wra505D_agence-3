<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Core\User\UserInterface;

class SecurityController
{
    /**
     * Atteint seulement après une connexion réussie (json_login) : le front lit ensuite /api/me.
     */
    public function login(#[CurrentUser] ?UserInterface $user): Response
    {
        if (null === $user) {
            throw new UnauthorizedHttpException('', 'Identifiant ou mot de passe manquant.');
        }

        return new Response(null, Response::HTTP_NO_CONTENT);
    }
}
