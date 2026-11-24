<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\Post;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Entity\Cv;
use App\Entity\Users;
use App\Repository\CvRepository;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationList;

/**
 * Écritures du CV : rattaché à l'étudiant connecté, un seul par étudiant, daté par le serveur.
 *
 * @implements ProcessorInterface<Cv, Cv>
 */
final class CvProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persist,
        private readonly CvRepository $cvs,
        private readonly Security $security,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Cv
    {
        if (($operation instanceof Post && null !== $data->getId()) || (isset($uriVariables['id']) && $data->getId() !== (int) $uriVariables['id'])) {
            throw new UnprocessableEntityHttpException('CV invalide.');
        }
        $maintenant = new \DateTimeImmutable();
        if ($operation instanceof Post) {
            $user = $this->security->getUser();
            \assert($user instanceof Users);
            if (null !== $this->cvs->findOneBy(['etudiant' => $user->getEtudiant()])) {
                throw new ValidationException(new ConstraintViolationList([new ConstraintViolation('Vous avez déjà un CV : modifiez-le.', null, [], null, '', null)]));
            }
            $data->setEtudiant($user->getEtudiant());
            $data->setDateCreation($maintenant);
        }
        $data->setDateModification($maintenant);

        try {
            return $this->persist->process($data, $operation, $uriVariables, $context);
        } catch (UniqueConstraintViolationException) {
            throw new ValidationException(new ConstraintViolationList([new ConstraintViolation('Vous avez déjà un CV : modifiez-le.', null, [], null, '', null)]));
        }
    }
}
