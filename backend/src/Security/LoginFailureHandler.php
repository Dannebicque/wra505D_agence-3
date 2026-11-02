<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\AccountStatusException;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\TooManyLoginAttemptsAuthenticationException;
use Symfony\Component\Security\Http\Authentication\AuthenticationFailureHandlerInterface;

/**
 * Échec de connexion : réponse JSON avec un message en français, sans dire si l'identifiant existe.
 */
class LoginFailureHandler implements AuthenticationFailureHandlerInterface
{
    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): Response
    {
        return match (true) {
            $exception instanceof TooManyLoginAttemptsAuthenticationException => new JsonResponse(
                ['message' => 'Trop de tentatives de connexion. Réessayez dans une minute.'],
                Response::HTTP_TOO_MANY_REQUESTS,
            ),
            $exception instanceof AccountStatusException => new JsonResponse(
                ['message' => $exception->getMessageKey()],
                Response::HTTP_FORBIDDEN,
            ),
            default => new JsonResponse(
                ['message' => 'Identifiant ou mot de passe incorrect.'],
                Response::HTTP_UNAUTHORIZED,
            ),
        };
    }
}
