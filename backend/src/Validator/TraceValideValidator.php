<?php

namespace App\Validator;

use App\Entity\Fichier;
use App\Entity\Trace;
use App\Entity\Users;
use App\Enum\ConceptionIaEnum;
use App\Enum\RealisationIaEnum;
use App\Repository\FichierRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;

/**
 * Même ordre et mêmes messages que validateTrace() du front, pour que l'étudiant lise la même erreur
 * que le formulaire l'ait vue ou non. Les textes ont déjà été nettoyés par les setters de Trace.
 */
final class TraceValideValidator extends ConstraintValidator
{
    /** Fichier déposé (/api/fichiers/<uuid>) ou fichier repris de l'ancienne version (/fichiers/…). */
    private const CHEMIN_FICHIER = '#^/api/fichiers/[0-9a-f-]{36}$|^/fichiers/[\w.-]+$#';

    public function __construct(
        private readonly Security $security,
        private readonly FichierRepository $fichiers,
        private readonly EntityManagerInterface $em,
    ) {
    }

    public function validate(mixed $trace, Constraint $constraint): void
    {
        if (!$trace instanceof Trace) {
            return;
        }
        $echec = fn (string $champ, string $message) => $this->context->buildViolation($message)->atPath($champ)->addViolation();

        $titre = $trace->getTitre() ?? '';
        if ('' === $titre) {
            $echec('titre', 'Le titre est obligatoire.');
        } elseif (mb_strlen($titre) > 100) {
            $echec('titre', 'Le titre ne doit pas dépasser 100 caractères.');
        }
        if (mb_strlen($trace->getDescription() ?? '') > 5000) {
            $echec('description', 'La description ne doit pas dépasser 5 000 caractères.');
        }
        if (mb_strlen($trace->getContexte() ?? '') > 255) {
            $echec('contexte', 'Le contexte ne doit pas dépasser 255 caractères.');
        }

        $type = $trace->getTypeTrace();
        if (!\in_array($type, Trace::TYPES, true)) {
            $echec('type', 'Choisissez un type de trace.');
        }
        $finalisee = 'finalisee' === $trace->getStatut();
        if (!\in_array($trace->getStatut(), Trace::STATUTS, true)) {
            $echec('statut', 'Statut de trace inconnu.');
        }

        $contenu = $trace->getContenu();
        if ([] === $contenu && $finalisee) {
            $echec('contenu', 'Ajoutez le contenu de la trace avant de la finaliser.');
        } elseif (\count($contenu) > 1) {
            // Plusieurs fichiers ou liens par trace : fonctionnalité E-TR-03 retirée
            $echec('contenu', 'Une seule adresse par trace.');
        } elseif (array_filter($contenu, static fn (string $item): bool => mb_strlen($item) > 2048)) {
            $echec('contenu', 'L’adresse ne doit pas dépasser 2 048 caractères.');
        } elseif (\in_array($type, ['lien', 'video'], true) && array_filter($contenu, static fn (string $item): bool => !self::estAdresseWeb($item))) {
            $echec('contenu', 'Saisissez une adresse web valide, commençant par https:// ou http://.');
        } elseif (\in_array($type, ['image', 'pdf'], true) && array_filter($contenu, static fn (string $item): bool => !preg_match(self::CHEMIN_FICHIER, $item))) {
            $echec('contenu', 'Fichier invalide.');
        }

        // Légende d'une image : son texte alternatif (accessibilité), obligatoire pour finaliser
        $legende = $trace->getLegende();
        if (mb_strlen($legende ?? '') > 100) {
            $echec('legende', 'La légende ne doit pas dépasser 100 caractères.');
        } elseif ('image' === $type && $finalisee && null === $legende) {
            $echec('legende', 'Ajoutez une légende décrivant l’image avant de finaliser.');
        }

        if (null === ConceptionIaEnum::tryFrom($trace->getConceptionIa())) {
            $echec('conceptionIa', 'Choisissez une déclaration d’usage de l’IA.');
        }
        if (null === RealisationIaEnum::tryFrom($trace->getRealisationIa())) {
            $echec('realisationIa', 'Choisissez une déclaration d’usage de l’IA.');
        }

        $aujourdhui = (new \DateTimeImmutable('now', new \DateTimeZone('Europe/Paris')))->format('Y-m-d');
        if ($trace->isDateRealisationInvalide()) {
            $echec('dateRealisation', 'Saisissez une date valide.');
        } elseif ($trace->getDateRealisationJour() > $aujourdhui) {
            $echec('dateRealisation', 'La date de réalisation ne peut pas être dans le futur.');
        }

        // Comme fileFieldViolations() côté Nitro, une fois la saisie valide : une image ou un PDF doit être un fichier
        // déposé par CET étudiant et du bon format, sinon n'importe quel chemin ou le fichier d'un autre y serait glissé.
        // Un fichier inchangé reste accepté (fichiers repris de l'ancienne version), un brouillon sans fichier aussi.
        if (0 === \count($this->context->getViolations()) && \in_array($type, ['image', 'pdf'], true) && [] !== $contenu
            && !$this->fichierInchange($trace) && !$this->fichierDeLEtudiant($contenu[0], $type)) {
            $echec('contenu', 'Déposez un fichier du bon format avant de l’associer.');
        }
    }

    private function fichierInchange(Trace $trace): bool
    {
        $origine = $this->em->getUnitOfWork()->getOriginalEntityData($trace);

        return [] !== $origine && $origine['type_trace'] === $trace->getTypeTrace() && ($origine['contenu'] ?? []) === $trace->getContenu();
    }

    private function fichierDeLEtudiant(string $chemin, string $type): bool
    {
        $user = $this->security->getUser();
        $fichier = $user instanceof Users && preg_match('#^/api/fichiers/([0-9a-f-]{36})$#', $chemin, $id)
            ? $this->fichiers->duProprietaire($id[1], $user)
            : null;

        return null !== $fichier && \in_array($fichier->getMimeType(), Fichier::REGLES[$type]['types'], true);
    }

    /** Comme `new URL()` du navigateur limité à http(s) : un schéma web et un hôte, sans espace. */
    private static function estAdresseWeb(string $adresse): bool
    {
        $parties = parse_url($adresse);

        return false !== $parties
            && \in_array(strtolower($parties['scheme'] ?? ''), ['http', 'https'], true)
            && '' !== ($parties['host'] ?? '')
            && !preg_match('/\s/', $adresse);
    }
}
