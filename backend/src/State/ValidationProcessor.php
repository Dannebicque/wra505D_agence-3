<?php

namespace App\State;

use ApiPlatform\Metadata\DeleteOperationInterface;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\Post;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Validation;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * Association d'un niveau à une trace par l'étudiant : la validation part toujours en attente, sans enseignant.
 * Elle ne se retire que tant qu'elle n'a pas été évaluée.
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
