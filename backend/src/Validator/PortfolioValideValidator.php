<?php

namespace App\Validator;

use App\Entity\Fichier;
use App\Entity\Portfolio;
use App\Entity\Users;
use App\Repository\FichierRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;

final class PortfolioValideValidator extends ConstraintValidator
{
    public function __construct(
        private readonly Security $security,
        private readonly FichierRepository $fichiers,
    ) {
    }

    public function validate(mixed $portfolio, Constraint $constraint): void
    {
        if (!$portfolio instanceof Portfolio) {
            return;
        }
        $echec = fn (string $champ, string $message) => $this->context->buildViolation($message)->atPath($champ)->addViolation();

        $intitule = $portfolio->getIntitule() ?? '';
        if ('' === $intitule) {
            $echec('intitule', 'L’intitulé est obligatoire.');
        } elseif (self::longueur($intitule) > 100) {
            $echec('intitule', 'L’intitulé ne doit pas dépasser 100 caractères.');
        }
        if (self::longueur($portfolio->getDescription() ?? '') > 2000) {
            $echec('description', 'La description ne doit pas dépasser 2 000 caractères.');
        }
        if (null !== $portfolio->getVisibiliteInvalide()) {
            $echec('visibilite', 'Choisissez la visibilité du portfolio.');
        }

        // Bannière : une image déposée par l'étudiant (elle devient publique avec le portfolio)
        $banniere = $portfolio->getBanniere();
        if (null !== $banniere) {
            $user = $this->security->getUser();
            $fichier = $user instanceof Users && preg_match('#^/api/fichiers/([0-9a-f-]{36})$#', $banniere, $id)
                ? $this->fichiers->duProprietaire($id[1], $user)
                : null;
            if (null === $fichier || !\in_array($fichier->getMimeType(), Fichier::REGLES['image']['types'], true)) {
                $echec('banniere', 'Déposez une image avant de l’utiliser comme bannière.');
            }
        }

        // Ordre des pages : exactement les pages actuelles du portfolio (checkPageOrder() du front)
        $demandees = $portfolio->getPagesDemandees();
        if (null !== $demandees) {
            $actuelles = $portfolio->getPagesVisibles();
            $ids = static fn (array $pages): array => array_map(spl_object_id(...), $pages);
            $memes = \count($demandees) === \count($actuelles)
                && \count(array_unique($ids($demandees))) === \count($demandees)
                && [] === array_diff($ids($demandees), $ids($actuelles));
            if (!$memes) {
                $echec('pages', 'L’ordre doit reprendre exactement les pages du portfolio.');
            }
        }

    }

    private static function longueur(string $texte): int
    {
        return intdiv(\strlen((string) mb_convert_encoding($texte, 'UTF-16LE', 'UTF-8')), 2);
    }
}
