<?php

namespace App\State;

use ApiPlatform\Metadata\DeleteOperationInterface;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\Post;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Entity\Portfolio;
use App\Entity\Users;
use App\Repository\PortfolioRepository;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationList;

/**
 * Écritures d'un portfolio : l'étudiant et l'année (celle de son semestre) sont fixés par le serveur, un seul
 * portfolio par année (E-PF-10), DELETE le met dans la corbeille.
 *
 * @implements ProcessorInterface<Portfolio, Portfolio|null>
 */
final class PortfolioProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persist,
        private readonly PortfolioRepository $portfolios,
        private readonly Security $security,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ?Portfolio
    {
        // Corps réduit à l'IRI d'un portfolio existant : ni recréé (POST) ni substitué à celui de l'URL (PATCH)
        if (($operation instanceof Post && null !== $data->getId()) || (isset($uriVariables['id']) && $data->getId() !== (int) $uriVariables['id'])) {
            throw new UnprocessableEntityHttpException('Portfolio invalide.');
        }
        $maintenant = new \DateTime();

        if ($operation instanceof DeleteOperationInterface) {
            $data->setDateSuppression(\DateTimeImmutable::createFromMutable($maintenant));
            $this->persist->process($data, $operation, $uriVariables, $context);

            return null;
        }

        if ($operation instanceof Post) {
            $user = $this->security->getUser();
            $etudiant = $user instanceof Users ? $user->getEtudiant() : null;
            $annee = $etudiant?->getSemestre()?->getAnnee();
            if (null === $annee) {
                throw self::refus('Votre fiche étudiant n’a pas d’année de formation : impossible de créer un portfolio.');
            }
            if (null !== $this->portfolios->findOneBy(['etudiant' => $etudiant, 'annee' => $annee, 'date_suppression' => null])) {
                throw self::refus('Vous avez déjà un portfolio pour cette année.');
            }
            $data->setEtudiant($etudiant);
            $data->setAnnee($annee);
            $data->setDateCreation($maintenant);
        }
        $data->setDateModification($maintenant);

        try {
            return $this->persist->process($data, $operation, $uriVariables, $context);
        } catch (UniqueConstraintViolationException) {
            // Deux créations simultanées : l'index partiel portfolio_unique_par_annee arrête la seconde
            throw self::refus('Vous avez déjà un portfolio pour cette année.');
        }
    }

    private static function refus(string $message): ValidationException
    {
        return new ValidationException(new ConstraintViolationList([new ConstraintViolation($message, $message, [], null, '', null)]));
    }
}
