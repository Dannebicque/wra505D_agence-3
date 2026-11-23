<?php

namespace App\Tests\Security;

use App\Security\LoginFailureHandler;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\PasswordHasherFactoryInterface;
use Symfony\Component\PasswordHasher\PasswordHasherInterface;
use Symfony\Component\Security\Core\Exception\BadCredentialsException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;

/**
 * Un identifiant inconnu doit coûter un hachage, comme un mauvais mot de passe (pas d'énumération par le temps).
 */
class LoginFailureHandlerTest extends TestCase
{
    public function testIdentifiantInconnuHacheQuandMeme(): void
    {
        self::assertSame(1, $this->hachagesPour(new BadCredentialsException('Bad credentials.', 0, new UserNotFoundException())));
    }

    public function testMauvaisMotDePassePasDeHachageEnPlus(): void
    {
        // Le mot de passe a déjà été vérifié (donc haché) par Symfony
        self::assertSame(0, $this->hachagesPour(new BadCredentialsException('Bad credentials.')));
    }

    private function hachagesPour(BadCredentialsException $exception): int
    {
        $hasher = $this->createMock(PasswordHasherInterface::class);
        $compteur = 0;
        $hasher->method('hash')->willReturnCallback(function () use (&$compteur) {
            ++$compteur;

            return 'hash';
        });
        $factory = $this->createStub(PasswordHasherFactoryInterface::class);
        $factory->method('getPasswordHasher')->willReturn($hasher);

        $reponse = (new LoginFailureHandler($factory))->onAuthenticationFailure(new Request(), $exception);

        self::assertSame(401, $reponse->getStatusCode());

        return $compteur;
    }
}
