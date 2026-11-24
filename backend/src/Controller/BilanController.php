<?php

namespace App\Controller;

use App\Entity\Annee;
use App\Entity\Etudiant;
use App\Entity\Groupe;
use App\Entity\Users;
use App\Service\Bilans;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

/**
 * Bilans (P-ST-03, P-ST-08 à P-ST-10) en JSON, ou en CSV avec ?format=csv (le PDF passe par l'impression du navigateur,
 * décision du PO). Individuel : l'étudiant lui-même, ou un enseignant de son département. Collectif (année, groupe) :
 * un enseignant du département. Hors périmètre : 404.
 */
final class BilanController
{
    private const ID = '[1-9][0-9]{0,8}|1[0-9]{9}|20[0-9]{8}|21[0-3][0-9]{7}|214[0-6][0-9]{6}|2147[0-3][0-9]{5}|21474[0-7][0-9]{4}|214748[0-2][0-9]{3}|2147483[0-5][0-9]{2}|21474836[0-3][0-9]|214748364[0-7]';
    private const ENTETES_TOTAUX = ['Acquis', 'En cours d’acquisition', 'Non acquis', 'En attente'];

    public function __construct(private readonly Bilans $bilans, private readonly EntityManagerInterface $em)
    {
    }

    #[Route('/api/bilans/etudiants/{id}', name: 'api_bilan_etudiant', requirements: ['id' => self::ID], methods: ['GET'])]
    public function individuel(int $id, Request $request, #[CurrentUser] ?Users $user): Response
    {
        $etudiant = $this->em->find(Etudiant::class, $id);
        $permis = null !== $etudiant && ($user?->getEtudiant() === $etudiant || $this->duDepartement($user, $etudiant->getSemestre()?->getAnnee()));
        if (!$permis) {
            $this->refuser($user);
        }
        $bilan = $this->bilans->individuel($etudiant);

        if ($this->enCsv($request)) {
            $lignes = [['Compétence', 'Niveau', ...self::ENTETES_TOTAUX]];
            foreach ($bilan['competences'] as $competence) {
                foreach ($competence['niveaux'] as $niveau) {
                    $lignes[] = [$competence['nomCourt'], $niveau['libelle'], ...array_values($niveau['totaux'])];
                }
            }

            return $this->csv($lignes, sprintf('bilan-%s-%s.csv', $etudiant->getNom(), $etudiant->getPrenom()));
        }

        return $this->json(['@id' => "/api/bilans/etudiants/$id", '@type' => 'Bilan', 'etudiant' => "/api/etudiants/$id", 'prenom' => $etudiant->getPrenom(), 'nom' => $etudiant->getNom(), ...$bilan]);
    }

    #[Route('/api/bilans/{cible}/{id}', name: 'api_bilan_collectif', requirements: ['cible' => 'annees|groupes', 'id' => self::ID], methods: ['GET'])]
    public function collectif(string $cible, int $id, Request $request, #[CurrentUser] ?Users $user): Response
    {
        $objet = $this->em->find('annees' === $cible ? Annee::class : Groupe::class, $id);
        $annee = $objet instanceof Groupe ? $objet->getSemestre()?->getAnnee() : $objet;
        if (null === $objet || !$this->duDepartement($user, $annee)) {
            $this->refuser($user);
        }
        $etudiants = $objet instanceof Groupe
            ? $objet->getEtudiants()->toArray()
            : $this->em->createQuery('SELECT e FROM App\Entity\Etudiant e JOIN e.semestre s WHERE s.annee = :annee')->setParameter('annee', $objet)->getResult();
        $bilan = $this->bilans->collectif(array_values($etudiants));

        if ($this->enCsv($request)) {
            $lignes = [['Nom', 'Prénom', ...self::ENTETES_TOTAUX]];
            foreach ($bilan['etudiants'] as $ligne) {
                $lignes[] = [$ligne['nom'], $ligne['prenom'], ...array_values($ligne['totaux'])];
            }

            return $this->csv($lignes, sprintf('bilan-%s.csv', $objet->getLibelle()));
        }

        return $this->json(['@id' => "/api/bilans/$cible/$id", '@type' => 'BilanCollectif', ('annees' === $cible ? 'annee' : 'groupe') => "/api/$cible/$id", ...$bilan]);
    }

    /** Enseignant d'un département de cette année. */
    private function duDepartement(?Users $user, ?Annee $annee): bool
    {
        $departement = $annee?->getDiplome()?->getDepartement();

        return null !== $departement && null !== $user?->getEnseignant() && \in_array($departement, $user->getEnseignant()->getDepartements(), true);
    }

    private function refuser(?Users $user): never
    {
        if (null === $user?->getEtudiant() && null === $user?->getEnseignant()) {
            throw new AccessDeniedHttpException('Réservé aux étudiants et aux enseignants.');
        }
        throw new NotFoundHttpException('Bilan introuvable.');
    }

    private function enCsv(Request $request): bool
    {
        return 'csv' === $request->query->get('format');
    }

    private function json(array $donnees): JsonResponse
    {
        return new JsonResponse($donnees, headers: ['Content-Type' => 'application/ld+json']);
    }

    /** CSV pour Excel en français : BOM UTF-8, point-virgule ; une cellule qui commence par = + - @ est neutralisée. */
    private function csv(array $lignes, string $nom): Response
    {
        $flux = fopen('php://temp', 'r+');
        fwrite($flux, "\u{FEFF}");
        foreach ($lignes as $ligne) {
            fputcsv($flux, array_map(static fn ($c) => \is_string($c) && preg_match('/^[=+\-@\t\r]/', $c) ? "'" . $c : $c, $ligne), ';', '"', '');
        }
        rewind($flux);
        $contenu = (string) stream_get_contents($flux);
        $propre = (string) preg_replace('/[^A-Za-z0-9._-]+/', '-', iconv('UTF-8', 'ASCII//TRANSLIT', $nom) ?: 'bilan.csv');

        return new Response($contenu, 200, [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => sprintf('attachment; filename="%s"', $propre),
        ]);
    }
}
