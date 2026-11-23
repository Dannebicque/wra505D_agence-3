<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\Users;
use App\Repository\FichierRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * GET /api/fichiers/{id} : le contenu du fichier, à son seul propriétaire (404 pour les autres étudiants, 403 sinon).
 * Les en-têtes empêchent le navigateur d'interpréter le fichier autrement que son type réel.
 *
 * @implements ProviderInterface<BinaryFileResponse>
 */
final class FichierProvider implements ProviderInterface
{
    public function __construct(
        private readonly FichierRepository $fichiers,
        private readonly Security $security,
        #[Autowire('%fichiers_dir%')]
        private readonly string $dossier,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): BinaryFileResponse
    {
        $user = $this->security->getUser();
        $fichier = $user instanceof Users ? $this->fichiers->duProprietaire((string) ($uriVariables['id'] ?? ''), $user) : null;
        $chemin = $this->dossier . '/' . $fichier?->getId();
        if (null === $fichier || !is_file($chemin)) {
            throw new NotFoundHttpException('Fichier introuvable.');
        }

        $reponse = new BinaryFileResponse($chemin, 200, [
            'Content-Type' => $fichier->getMimeType(),
            'X-Content-Type-Options' => 'nosniff',
            // Le front (autre port, même site) peut l'afficher ; un autre site ne peut pas l'intégrer
            'Cross-Origin-Resource-Policy' => 'same-site',
            // Pas de copie réutilisée sans vérification (poste partagé après déconnexion)
            'Cache-Control' => 'private, no-cache',
        ], public: false, autoEtag: false, autoLastModified: false);
        $reponse->headers->set('Content-Disposition', $reponse->headers->makeDisposition(
            ResponseHeaderBag::DISPOSITION_INLINE,
            $fichier->getNom(),
            (string) preg_replace('/[^\x20-\x7e]|[%\/\\\\]/u', '_', $fichier->getNom()),
        ));
        // Une image ouverte seule ne peut rien exécuter (le lecteur PDF du navigateur refuse « sandbox »)
        if ('application/pdf' !== $fichier->getMimeType()) {
            $reponse->headers->set('Content-Security-Policy', "default-src 'none'; sandbox");
        }

        return $reponse;
    }
}
