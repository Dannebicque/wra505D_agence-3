<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Entity\Fichier;
use App\Entity\Users;
use App\Repository\FichierRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationList;

/**
 * POST /api/fichiers : contrôle le fichier sur son contenu réel (pas sur son nom ni le type annoncé),
 * le range hors de public/ et renvoie sa fiche. Mêmes messages que la route Nitro du front.
 *
 * @implements ProcessorInterface<null, Fichier>
 */
final class FichierProcessor implements ProcessorInterface
{
    /** PDF de 10 Mo plus la marge du formulaire multipart. */
    private const ENVOI_MAX = 10 * 1024 * 1024 + 64 * 1024;

    /**
     * Plafonds par étudiant : en octets et en nombre (des milliers de fichiers minuscules rempliraient le disque
     * sous le plafond en octets). shortcut: pas de nettoyage des fichiers jamais associés à une trace ; à revoir avec la corbeille (C-09).
     */
    private const ESPACE_MAX = 200 * 1024 * 1024;
    private const NOMBRE_MAX = 100;

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly FichierRepository $fichiers,
        private readonly Security $security,
        #[Autowire('%fichiers_dir%')]
        private readonly string $dossier,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Fichier
    {
        $request = $context['request'];
        \assert($request instanceof Request);
        // Au-delà de post_max_size, PHP vide le formulaire : on répond sur la taille plutôt que « Choisissez un fichier »
        if ((int) $request->headers->get('Content-Length') > self::ENVOI_MAX) {
            throw new HttpException(413, 'Le fichier dépasse la taille maximale (10 Mo).');
        }

        $type = $request->request->get('type');
        $envoi = $request->files->get('fichier');
        if (!\in_array($type, ['image', 'pdf'], true) || !$envoi instanceof UploadedFile) {
            throw self::refus('Choisissez un fichier.');
        }
        $regles = Fichier::REGLES[$type];
        if (\in_array($envoi->getError(), [\UPLOAD_ERR_INI_SIZE, \UPLOAD_ERR_FORM_SIZE], true)) {
            throw self::refus(self::tropGros($regles['max']));
        }
        if (!$envoi->isValid()) {
            throw self::refus('Le fichier n’a pas pu être reçu. Réessayez.');
        }

        $taille = (int) $envoi->getSize();
        $mimeType = Fichier::typeReel((string) file_get_contents($envoi->getPathname(), length: 16));
        if (0 === $taille) {
            throw self::refus('Le fichier est vide.');
        }
        if (!\in_array($mimeType, $regles['types'], true)) {
            throw self::refus($regles['mauvaisFormat']);
        }
        if ($taille > $regles['max']) {
            throw self::refus(self::tropGros($regles['max']));
        }

        $user = $this->security->getUser();
        \assert($user instanceof Users);
        $fichier = new Fichier($user, Fichier::nomPropre($envoi->getClientOriginalName(), $mimeType), $mimeType, $taille);

        // Ligne de l'utilisateur verrouillée : deux envois simultanés ne lisent pas le même total et ne dépassent pas les plafonds
        $this->em->wrapInTransaction(function () use ($user, $fichier, $taille): void {
            $this->em->getConnection()->executeQuery('SELECT id FROM users WHERE id = ? FOR UPDATE', [$user->getId()]);
            [$nombre, $octets] = $this->fichiers->utilisation($user);
            if ($nombre >= self::NOMBRE_MAX || $octets + $taille > self::ESPACE_MAX) {
                throw self::refus('Vous avez atteint l’espace maximal de fichiers.');
            }
            $this->em->persist($fichier);
            $this->em->flush();
        });

        // Fichier rangé une fois la ligne enregistrée ; s'il ne peut pas l'être, la ligne est retirée (pas de fiche sans contenu)
        try {
            $envoi->move($this->dossier, (string) $fichier->getId());
        } catch (\Throwable $erreur) {
            $this->em->remove($fichier);
            $this->em->flush();
            throw $erreur;
        }

        return $fichier;
    }

    private static function tropGros(int $max): string
    {
        return sprintf('Le fichier dépasse la taille maximale (%d Mo).', $max / (1024 * 1024));
    }

    /** Erreur 422 sur le champ « fichier », au format des autres erreurs de saisie. */
    private static function refus(string $message): ValidationException
    {
        return new ValidationException(new ConstraintViolationList([new ConstraintViolation($message, $message, [], null, 'fichier', null)]));
    }
}
