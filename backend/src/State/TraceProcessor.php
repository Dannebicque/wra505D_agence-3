<?php

namespace App\State;

use ApiPlatform\Metadata\DeleteOperationInterface;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\Post;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Trace;
use App\Entity\Users;
use App\Repository\BibliothequeRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

/**
 * Écritures d'une trace : le serveur fixe la bibliothèque et les dates (le corps ne peut pas les changer),
 * et DELETE met la trace dans la corbeille au lieu de l'effacer.
 *
 * @implements ProcessorInterface<Trace, Trace|null>
 */
final class TraceProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persist,
        private readonly BibliothequeRepository $bibliotheques,
        private readonly Security $security,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ?Trace
    {
        $maintenant = new \DateTimeImmutable();
        // Un corps réduit à l'IRI d'une trace existante ("/api/traces/1") est accepté par le désérialiseur :
        // il ne doit ni recréer cette trace (POST) ni en modifier une autre que celle de l'URL (PATCH)
        if (($operation instanceof Post && null !== $data->getId()) || (isset($uriVariables['id']) && $data->getId() !== (int) $uriVariables['id'])) {
            throw new UnprocessableEntityHttpException('Trace invalide.');
        }

        if ($operation instanceof DeleteOperationInterface) {
            $data->setDateSuppression($maintenant);
            $this->persist->process($data, $operation, $uriVariables, $context);

            return null;
        }

        if ($operation instanceof Post) {
            $user = $this->security->getUser();
            $etudiant = $user instanceof Users ? $user->getEtudiant() : null;
            if (null === $etudiant) {
                throw new AccessDeniedException('Compte sans fiche étudiant.');
            }
            $data->setBibliotheque($this->bibliotheques->courante($etudiant));
            $data->setDateCreation($maintenant);
        }
        $data->setDateModification($maintenant);

        return $this->persist->process($data, $operation, $uriVariables, $context);
    }
}
