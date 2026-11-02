<?php

namespace App\Security;

use App\Entity\Users;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\AccountStatusException;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\PasswordHasher\Hasher\PasswordHasherFactoryInterface;
use Symfony\Component\Security\Core\Exception\TooManyLoginAttemptsAuthenticationException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Http\Authentication\AuthenticationFailureHandlerInterface;

/**
 * Échec de connexion : réponse JSON avec un message en français, sans dire si l'identifiant existe.
 */
class LoginFailureHandler implements AuthenticationFailureHandlerInterface
{
    public function __construct(private readonly PasswordHasherFactoryInterface $hasherFactory)
    {
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): Response
    {
        if ($exception->getPrevious() instanceof UserNotFoundException) {
            // Identifiant inconnu : hachage factice pour répondre aussi lentement qu'à un mauvais mot de passe,
            // sinon le temps de réponse révèle quels identifiants existent
            $this->hasherFactory->getPasswordHasher(Users::class)->hash('identifiant-inconnu');
        }

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
