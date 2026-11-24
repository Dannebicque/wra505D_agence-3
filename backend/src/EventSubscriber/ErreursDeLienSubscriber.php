<?php

namespace App\EventSubscriber;

use ApiPlatform\Validator\Exception\ValidationException;
use App\Entity\Commentaire;
use App\Entity\Page;
use App\Entity\Portfolio;
use App\Entity\Validation;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Validator\Constraints\Type;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationList;

/**
 * Une IRI introuvable (ressource inexistante ou d'un autre étudiant) ou du mauvais type dans un corps de requête
 * donne une erreur de type générique, au chemin interne (« traces[0] », « pagesVisibles[1] »). Elle est réécrite
 * avec le champ et le message du front (server/utils/page-rules.ts), pour qu'il l'affiche sous le bon champ.
 * Même réponse pour « inexistante » et « d'autrui » : rien ne se devine.
 */
final class ErreursDeLienSubscriber implements EventSubscriberInterface
{
    /** Ressource => [motif du chemin, champ du front, message]. */
    private const MESSAGES = [
        Page::class => [
            ['/^traces\[\d+\]$/', 'traces', 'Trace introuvable.'],
            ['/^traces$/', 'traces', 'Liste de traces invalide.'],
            ['/^portfolio$/', 'portfolio', 'Portfolio introuvable.'],
        ],
        Portfolio::class => [
            ['/^pagesVisibles(\[\d+\])?$/', 'pages', 'L’ordre doit reprendre exactement les pages du portfolio.'],
        ],
        Commentaire::class => [
            ['/^trace$/', 'trace', 'Trace introuvable.'],
            ['/^portfolio$/', 'portfolio', 'Portfolio introuvable.'],
        ],
        Validation::class => [
            ['/^trace$/', 'trace', 'Trace introuvable.'],
            ['/^niveau$/', 'niveau', 'Niveau de compétence introuvable.'],
            ['/^etatEvalue$/', 'etat', 'Choisissez un niveau d’acquisition : non acquis, en cours d’acquisition ou acquis.'],
        ],
    ];

    public static function getSubscribedEvents(): array
    {
        // Avant l'écouteur d'erreurs de Symfony et d'ApiPlatform (priorité -128)
        return [KernelEvents::EXCEPTION => 'reecrire'];
    }

    public function reecrire(ExceptionEvent $event): void
    {
        $erreur = $event->getThrowable();
        $regles = self::MESSAGES[$event->getRequest()->attributes->get('_api_resource_class')] ?? null;
        if (!$erreur instanceof ValidationException || null === $regles) {
            return;
        }

        $violations = new ConstraintViolationList();
        $dejaVues = [];
        foreach ($erreur->getConstraintViolationList() as $violation) {
            $regle = Type::INVALID_TYPE_ERROR === $violation->getCode()
                ? current(array_filter($regles, static fn (array $r): bool => 1 === preg_match($r[0], $violation->getPropertyPath())))
                : false;
            if (false === $regle) {
                $violations->add($violation);
                continue;
            }
            [, $champ, $message] = $regle;
            if (!isset($dejaVues[$champ])) {
                $dejaVues[$champ] = true;
                $violations->add(new ConstraintViolation($message, $message, [], $violation->getRoot(), $champ, $violation->getInvalidValue(), null, $violation->getCode()));
            }
        }
        $event->setThrowable(new ValidationException($violations));
    }
}
