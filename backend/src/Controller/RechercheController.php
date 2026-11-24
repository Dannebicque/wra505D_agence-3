<?php

namespace App\Controller;

use ApiPlatform\Doctrine\Orm\Util\QueryNameGenerator;
use App\Doctrine\ProprietaireExtension;
use App\Entity\Competence;
use App\Entity\Page;
use App\Entity\Trace;
use App\Entity\Users;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

/**
 * Recherche globale (C-03, C-04) : GET /api/recherche?q=…[&type=trace|page|competence]. Cherche dans les traces, pages
 * et compétences que l'utilisateur peut déjà lire (même filtre que les collections : ProprietaireExtension), sans
 * tenir compte des accents ni de la casse ; 10 résultats au plus par type.
 */
final class RechercheController
{
    private const PAR_TYPE = 10;

    /** Type => [classe, champs cherchés, champ du titre, champ de l'extrait, segment d'IRI]. */
    private const TYPES = [
        'trace' => [Trace::class, ['titre', 'description', 'contexte'], 'titre', 'description', 'traces'],
        'page' => [Page::class, ['intitule', 'description'], 'intitule', 'description', 'pages'],
        'competence' => [Competence::class, ['libelle', 'nom_court'], 'libelle', 'nom_court', 'competences'],
    ];

    public function __construct(private readonly EntityManagerInterface $em, private readonly ProprietaireExtension $perimetre)
    {
    }

    #[Route('/api/recherche', name: 'api_recherche', methods: ['GET'])]
    public function __invoke(Request $request, #[CurrentUser] ?Users $user): JsonResponse
    {
        if (null === $user?->getEtudiant() && null === $user?->getEnseignant()) {
            throw new AccessDeniedHttpException('Réservé aux étudiants et aux enseignants.');
        }
        $q = mb_trim((string) $request->query->get('q', ''));
        if (mb_strlen($q) < 2 || mb_strlen($q) > 100) {
            $message = 'Saisissez entre 2 et 100 caractères.';

            return new JsonResponse(['@type' => 'ConstraintViolation', 'status' => 422, 'detail' => "q: $message", 'violations' => [['propertyPath' => 'q', 'message' => $message]]], 422, ['Content-Type' => 'application/problem+json']);
        }
        $type = $request->query->get('type');
        $types = \is_string($type) && isset(self::TYPES[$type]) ? [$type => self::TYPES[$type]] : self::TYPES;
        // Caractères spéciaux de LIKE pris tels quels
        $motif = '%' . addcslashes(mb_strtolower($q), '%_\\') . '%';

        $resultats = [];
        foreach ($types as $nom => [$classe, $champs, $titre, $extrait, $segment]) {
            $qb = $this->em->getRepository($classe)->createQueryBuilder('o');
            // Traces, pages : périmètre de l'utilisateur ; compétences : référentiel lisible par tous
            $this->perimetre->applyToCollection($qb, new QueryNameGenerator(), $classe);
            $conditions = array_map(static fn (string $champ) => "UNACCENT(LOWER(o.$champ)) LIKE UNACCENT(:motif)", $champs);
            $objets = $qb->andWhere(implode(' OR ', $conditions))->setParameter('motif', $motif)
                ->orderBy('o.id', \SortDirection::Descending)->setMaxResults(self::PAR_TYPE)->getQuery()->getResult();
            foreach ($objets as $objet) {
                $lire = static fn (string $champ) => (new \ReflectionProperty($objet, $champ))->getValue($objet);
                $texte = (string) ($lire($extrait) ?? '');
                $resultats[] = [
                    '@type' => 'ResultatRecherche',
                    'type' => $nom,
                    'ressource' => "/api/$segment/" . $objet->getId(),
                    'titre' => $lire($titre),
                    'extrait' => mb_strlen($texte) > 160 ? mb_substr($texte, 0, 159) . '…' : $texte,
                ];
            }
        }

        return new JsonResponse([
            '@id' => '/api/recherche?q=' . rawurlencode($q),
            '@type' => 'Collection',
            'totalItems' => \count($resultats),
            'member' => $resultats,
        ], headers: ['Content-Type' => 'application/ld+json']);
    }
}
