<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
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
            // Requête qui n'est pas du JSON : json_login ne l'a pas traitée
            return new JsonResponse(['message' => 'Identifiant ou mot de passe manquant.'], Response::HTTP_UNAUTHORIZED);
        }

        return new Response(null, Response::HTTP_NO_CONTENT);
    }
}
