<?php

namespace App\Controller;

use App\Entity\Users;
use App\Service\Corbeille;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

/**
 * Corbeille de l'étudiant (C-09) : GET /api/corbeille, POST /api/{traces|pages|portfolios}/{id}/restaurer.
 * Réponses au format JSON-LD du reste de l'API ; la restauration exige un corps JSON (contre le CSRF).
 */
final class CorbeilleController
{
    private const ID = '[1-9][0-9]{0,8}|1[0-9]{9}|20[0-9]{8}|21[0-3][0-9]{7}|214[0-6][0-9]{6}|2147[0-3][0-9]{5}|21474[0-7][0-9]{4}|214748[0-2][0-9]{3}|2147483[0-5][0-9]{2}|21474836[0-3][0-9]|214748364[0-7]';

    public function __construct(private readonly Corbeille $corbeille)
    {
    }

    #[Route('/api/corbeille', name: 'api_corbeille', methods: ['GET'])]
    public function liste(#[CurrentUser] ?Users $user): JsonResponse
    {
        $etudiant = $user?->getEtudiant() ?? throw new AccessDeniedHttpException('Réservé aux étudiants.');
        $membres = array_map(static function (array $element): array {
            $objet = $element['objet'];

            return [
                '@type' => 'ElementSupprime',
                'type' => $element['type'],
                'ressource' => sprintf('/api/%ss/%d', $element['type'], $objet->getId()),
                'titre' => $objet instanceof \App\Entity\Trace ? $objet->getTitre() : $objet->getIntitule(),
                'dateSuppression' => $objet->getDateSuppression()->format(\DATE_RFC3339),
                'dateEffacement' => Corbeille::dateEffacement($objet->getDateSuppression())->format(\DATE_RFC3339),
            ];
        }, $this->corbeille->elements($etudiant));

        return new JsonResponse(['@id' => '/api/corbeille', '@type' => 'Collection', 'totalItems' => \count($membres), 'member' => $membres], headers: ['Content-Type' => 'application/ld+json']);
    }

    #[Route('/api/{ressource}/{id}/restaurer', name: 'api_corbeille_restaurer', requirements: ['ressource' => 'traces|pages|portfolios', 'id' => self::ID], methods: ['POST'], condition: "request.getContentTypeFormat() === 'json'")]
    public function restaurer(string $ressource, int $id, #[CurrentUser] ?Users $user): Response
    {
        $etudiant = $user?->getEtudiant() ?? throw new AccessDeniedHttpException('Réservé aux étudiants.');
        $this->corbeille->restaurer($etudiant, $ressource, $id);

        return new Response(null, Response::HTTP_NO_CONTENT);
    }
}
