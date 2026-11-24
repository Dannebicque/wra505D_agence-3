<?php

namespace App\Service;

use App\Entity\Etudiant;
use App\Entity\Fichier;
use App\Entity\Page;
use App\Entity\Portfolio;
use App\Entity\Trace;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Corbeille d'un étudiant (C-09) : traces, pages et portfolios supprimés, restaurables 30 jours puis effacés
 * définitivement (décision du PO, point ouvert n° 17). Une page n'est listée que si son portfolio est en place :
 * un portfolio restauré revient avec ses pages.
 */
final class Corbeille
{
    public const DUREE_JOURS = 30;

    private const CLASSES = ['traces' => Trace::class, 'pages' => Page::class, 'portfolios' => Portfolio::class];

    public function __construct(
        private readonly EntityManagerInterface $em,
        #[Autowire('%fichiers_dir%')]
        private readonly string $dossier,
    ) {
    }

    /** @return list<array{type: string, objet: Trace|Page|Portfolio}> du plus récemment supprimé au plus ancien */
    public function elements(Etudiant $etudiant): array
    {
        $traces = $this->em->createQuery('SELECT t FROM App\Entity\Trace t JOIN t.bibliotheque b WHERE b.etudiant = :e AND t.date_suppression IS NOT NULL')
            ->setParameter('e', $etudiant)->getResult();
        $pages = $this->em->createQuery('SELECT pa FROM App\Entity\Page pa JOIN pa.portfolio p WHERE p.etudiant = :e AND pa.date_suppression IS NOT NULL AND p.date_suppression IS NULL')
            ->setParameter('e', $etudiant)->getResult();
        $portfolios = $this->em->createQuery('SELECT p FROM App\Entity\Portfolio p WHERE p.etudiant = :e AND p.date_suppression IS NOT NULL')
            ->setParameter('e', $etudiant)->getResult();

        $elements = [
            ...array_map(static fn (Trace $t) => ['type' => 'trace', 'objet' => $t], $traces),
            ...array_map(static fn (Page $p) => ['type' => 'page', 'objet' => $p], $pages),
            ...array_map(static fn (Portfolio $p) => ['type' => 'portfolio', 'objet' => $p], $portfolios),
        ];
        usort($elements, static fn (array $a, array $b) => $b['objet']->getDateSuppression() <=> $a['objet']->getDateSuppression());

        return $elements;
    }

    public static function dateEffacement(\DateTimeImmutable $dateSuppression): \DateTimeImmutable
    {
        return $dateSuppression->modify(sprintf('+%d days', self::DUREE_JOURS));
    }

    /** Remet en place l'élément supprimé de cet étudiant ; 404 s'il n'est pas dans sa corbeille, 409 si impossible. */
    public function restaurer(Etudiant $etudiant, string $ressource, int $id): Trace|Page|Portfolio
    {
        $objet = isset(self::CLASSES[$ressource]) ? $this->em->find(self::CLASSES[$ressource], $id) : null;
        $proprietaire = match (true) {
            $objet instanceof Trace => $objet->getBibliotheque()?->getEtudiant(),
            $objet instanceof Page => $objet->getPortfolio()?->getEtudiant(),
            $objet instanceof Portfolio => $objet->getEtudiant(),
            default => null,
        };
        if (null === $objet || $proprietaire !== $etudiant || null === $objet->getDateSuppression()) {
            throw new NotFoundHttpException('Élément introuvable dans la corbeille.');
        }

        if ($objet instanceof Page && null !== $objet->getPortfolio()->getDateSuppression()) {
            throw new ConflictHttpException('Restaurez d’abord le portfolio de cette page.');
        }
        if ($objet instanceof Portfolio && null !== $this->em->getRepository(Portfolio::class)->findOneBy(['etudiant' => $etudiant, 'annee' => $objet->getAnnee(), 'date_suppression' => null])) {
            throw new ConflictHttpException('Vous avez déjà un portfolio pour cette année : supprimez-le avant de restaurer celui-ci.');
        }
        if ($objet instanceof Page) {
            // Une trace ne figure qu'une fois par portfolio : celles placées depuis dans une autre page y restent
            $ailleurs = [];
            foreach ($objet->getPortfolio()->getPagesVisibles() as $autre) {
                array_push($ailleurs, ...$autre->getTraces());
            }
            foreach ($objet->getOrdreTraces()->toArray() as $lien) {
                if (\in_array($lien->getTrace(), $ailleurs, true)) {
                    $objet->getOrdreTraces()->removeElement($lien);
                }
            }
        }

        $objet->setDateSuppression(null);
        $this->em->flush();

        return $objet;
    }

    /**
     * Efface définitivement ce qui est dans la corbeille depuis plus de DUREE_JOURS, puis les fichiers qu'aucune trace
     * ni bannière n'utilise plus (y compris ceux déposés et jamais associés). Renvoie le nombre d'éléments effacés.
     *
     * @return array{traces: int, pages: int, portfolios: int, fichiers: int}
     */
    public function vider(\DateTimeImmutable $maintenant): array
    {
        $limite = $maintenant->modify(sprintf('-%d days', self::DUREE_JOURS));
        $compte = [];
        foreach (['portfolios' => Portfolio::class, 'pages' => Page::class, 'traces' => Trace::class] as $nom => $classe) {
            $anciens = $this->em->createQuery(sprintf('SELECT o FROM %s o WHERE o.date_suppression < :limite', $classe))
                ->setParameter('limite', $limite)->getResult();
            foreach ($anciens as $objet) {
                $this->em->remove($objet);
            }
            $this->em->flush();
            $compte[$nom] = \count($anciens);
        }

        $orphelins = $this->em->getConnection()->fetchFirstColumn(<<<'SQL'
            SELECT f.id FROM fichier f
            WHERE f.date_creation < :limite
              AND NOT EXISTS (SELECT 1 FROM trace t WHERE jsonb_exists(t.contenu::jsonb, '/api/fichiers/' || f.id))
              AND NOT EXISTS (SELECT 1 FROM portfolio p WHERE p.banniere = '/api/fichiers/' || f.id)
            SQL, ['limite' => $limite->format('Y-m-d H:i:s')]);
        foreach ($orphelins as $id) {
            $fichier = $this->em->find(Fichier::class, $id);
            if (null !== $fichier) {
                $this->em->remove($fichier);
            }
            @unlink($this->dossier . '/' . $id);
        }
        $this->em->flush();
        $compte['fichiers'] = \count($orphelins);

        return $compte;
    }
}
