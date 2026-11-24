<?php

namespace App\State;

use ApiPlatform\Metadata\DeleteOperationInterface;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Entity\Notification;
use App\Entity\Users;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationList;
use App\Entity\Validation;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * Association d'un niveau à une trace par l'étudiant : la validation part toujours en attente, sans enseignant.
 * Elle ne se retire que tant qu'elle n'a pas été évaluée. L'évaluation (PATCH) est faite par un enseignant.
 *
 * @implements ProcessorInterface<Validation, Validation|null>
 */
final class ValidationProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persist,
        #[Autowire(service: 'api_platform.doctrine.orm.state.remove_processor')]
        private readonly ProcessorInterface $remove,
        private readonly Security $security,
        private readonly EntityManagerInterface $em,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ?Validation
    {
        if ($operation instanceof DeleteOperationInterface) {
            if (0 !== $data->isEtat()) {
                throw new ConflictHttpException('Ce niveau a déjà été évalué : il ne peut plus être retiré de la trace.');
            }
            $this->remove->process($data, $operation, $uriVariables, $context);

            return null;
        }

        // Évaluation : l'enseignant connecté la signe, et l'étudiant en est notifié (E-EV-04)
        if ($operation instanceof Patch) {
            if ($data->getId() !== (int) ($uriVariables['id'] ?? 0)) {
                throw new UnprocessableEntityHttpException('Validation invalide.');
            }
            // Sans état, rien n'est évalué : ni signature ni notification
            if (!$data->isEvaluee()) {
                throw new ValidationException(new ConstraintViolationList([new ConstraintViolation('Choisissez un niveau d’acquisition : non acquis, en cours d’acquisition ou acquis.', 'Choisissez un niveau d’acquisition : non acquis, en cours d’acquisition ou acquis.', [], null, 'etat', null)]));
            }
            $avant = $context['previous_data'] ?? null;
            if ($avant instanceof Validation && $avant->isEtat() === $data->isEtat()) {
                return $data;
            }
            $user = $this->security->getUser();
            \assert($user instanceof Users);
            $data->setEnseignant($user->getEnseignant());
            $data->setDateModification(new \DateTime());
            $etudiant = $data->getTrace()?->getBibliotheque()?->getEtudiant();
            // Notifiée seulement quand l'état change (une réévaluation au même niveau ne dérange pas l'étudiant)
            if (null !== $etudiant) {
                $this->em->persist(Notification::pour($etudiant, $data));
            }

            return $this->persist->process($data, $operation, $uriVariables, $context);
        }

        // Corps réduit à l'IRI d'une validation existante : sans ce refus, une validation évaluée repasserait en attente
        if ($operation instanceof Post && null !== $data->getId()) {
            throw new UnprocessableEntityHttpException('Validation invalide.');
        }
        $data->setEtat(0);
        $data->setEnseignant(null);
        $data->setDateCreation(new \DateTime());
        $data->setDateModification(null);

        return $this->persist->process($data, $operation, $uriVariables, $context);
    }
}
