<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\Post;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Commentaire;
use App\Entity\Notification;
use App\Entity\Users;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * Écritures d'un commentaire : signé par l'enseignant connecté, daté par le serveur. L'étudiant est notifié dès que
 * le commentaire lui devient visible (à la création, ou plus tard s'il était caché), une seule fois (E-EV-05).
 *
 * @implements ProcessorInterface<Commentaire, Commentaire>
 */
final class CommentaireProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persist,
        private readonly Security $security,
        private readonly EntityManagerInterface $em,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Commentaire
    {
        if (($operation instanceof Post && null !== $data->getId()) || (isset($uriVariables['id']) && $data->getId() !== (int) $uriVariables['id'])) {
            throw new UnprocessableEntityHttpException('Commentaire invalide.');
        }
        $maintenant = new \DateTime();
        if ($operation instanceof Post) {
            $user = $this->security->getUser();
            \assert($user instanceof Users);
            $data->setEnseignant($user->getEnseignant());
            $data->setDateCreation($maintenant);
        } else {
            $data->setDateModification($maintenant);
        }

        $etudiant = $data->getEtudiantConcerne();
        if ($data->isVisibilite() && null !== $etudiant && $data->getNotifications()->isEmpty()) {
            $notification = Notification::pour($etudiant, commentaire: $data);
            $data->addNotification($notification);
            $this->em->persist($notification);
        }

        return $this->persist->process($data, $operation, $uriVariables, $context);
    }
}
