<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\Post;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Entity\Echeance;
use App\Entity\Users;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationList;

/**
 * Écritures d'une échéance : signée par l'enseignant connecté, pour une année ou un groupe de SES départements,
 * à une date qui n'est pas passée (à la création).
 *
 * @implements ProcessorInterface<Echeance, Echeance>
 */
final class EcheanceProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persist,
        private readonly Security $security,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Echeance
    {
        if (($operation instanceof Post && null !== $data->getId()) || (isset($uriVariables['id']) && $data->getId() !== (int) $uriVariables['id'])) {
            throw new UnprocessableEntityHttpException('Échéance invalide.');
        }
        $user = $this->security->getUser();
        \assert($user instanceof Users);
        $enseignant = $user->getEnseignant();

        if (!\in_array($data->getDepartement(), $enseignant->getDepartements(), true)) {
            throw self::refus(null === $data->getAnnee() ? 'groupe' : 'annee', 'Choisissez une année ou un groupe de votre département.');
        }
        $aujourdhui = (new \DateTimeImmutable('today', new \DateTimeZone('Europe/Paris')))->format('Y-m-d');
        if ($operation instanceof Post) {
            if ($data->getDateJour() < $aujourdhui) {
                throw self::refus('date', 'La date de l’échéance est déjà passée.');
            }
            $data->setEnseignant($enseignant);
        }

        return $this->persist->process($data, $operation, $uriVariables, $context);
    }

    private static function refus(string $champ, string $message): ValidationException
    {
        return new ValidationException(new ConstraintViolationList([new ConstraintViolation($message, $message, [], null, $champ, null)]));
    }
}
