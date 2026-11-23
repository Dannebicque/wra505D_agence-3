<?php

namespace App\Tests\Api;

use App\Tests\ApiTestCase;
use Symfony\Component\HttpFoundation\File\UploadedFile;

/**
 * Lien public d'un portfolio (E-PF-06), sans connexion : seul un portfolio public hors corbeille se lit,
 * avec ses pages, leurs traces finalisées et leurs fichiers. Fixtures : le portfolio d'« etudiant » est public.
 */
class PortfolioPublicTest extends ApiTestCase
{
    public function testUnVisiteurLitUnPortfolioPublic(): void
    {
        $portfolio = $this->lire($this->portfolio() . '/public');

        self::assertResponseIsSuccessful();
        self::assertSame('Mon parcours en MMI', $portfolio['intitule']);
        self::assertSame(['@id', '@type', 'nom', 'prenom'], $this->cles($portfolio['etudiant']));
        self::assertSame(['Projet web', 'Motion design'], array_column($portfolio['pages'], 'intitule'));
        $trace = $portfolio['pages'][0]['traces'][0];
        self::assertSame(['@id', '@type', 'contenu', 'contexte', 'dateRealisation', 'description', 'legende', 'titre', 'type'], $this->cles($trace));
        // Rien de privé : ni dates de travail, ni usage de l'IA, ni courriel
        self::assertArrayNotHasKey('visibleRecruteurs', $portfolio);
        self::assertStringNotContainsString('mail', (string) json_encode($portfolio));
    }

    public function testPortfolioPriveOuSupprimeIntrouvable(): void
    {
        $id = basename($this->portfolio());
        $this->connection->executeStatement('UPDATE portfolio SET visibilite = false WHERE id = ?', [$id]);
        $this->lire($this->portfolio() . '/public');
        self::assertResponseStatusCodeSame(404);

        $this->connection->executeStatement('UPDATE portfolio SET visibilite = true, date_suppression = NOW() WHERE id = ?', [$id]);
        $this->lire("/api/portfolios/$id/public");
        self::assertResponseStatusCodeSame(404);

        foreach (['999999', '2147483648'] as $inconnu) {
            $this->lire("/api/portfolios/$inconnu/public");
            self::assertResponseStatusCodeSame(404, $inconnu);
        }
    }

    public function testMasqueLesPagesSupprimeesEtLesTracesRepasseesEnBrouillon(): void
    {
        $this->connection->executeStatement("UPDATE page SET date_suppression = NOW() WHERE intitule = 'Motion design'");
        $this->connection->executeStatement("UPDATE trace SET statut = 'brouillon' WHERE titre = 'Site vitrine d’une association'");

        $portfolio = $this->lire($this->portfolio() . '/public');

        self::assertSame(['Projet web'], array_column($portfolio['pages'], 'intitule'));
        self::assertSame([], $portfolio['pages'][0]['traces']);
    }

    public function testLeVisiteurNeVoitQueLesFichiersDuPortfolioPublic(): void
    {
        $this->connecter('etudiant');
        $montre = $this->deposerImage();
        $cache = $this->deposerImage();
        $banniere = $this->deposerImage();
        $trace = $this->envoyer('POST', '/api/traces', ['titre' => 'Affiche', 'type' => 'image', 'contenu' => [$montre], 'legende' => 'Une affiche', 'statut' => 'finalisee'])['@id'];
        $page = $this->iri("SELECT '/api/pages/' || id FROM page WHERE intitule = 'Projet web'");
        $this->envoyer('PATCH', $page, ['traces' => [$trace]]);
        $this->envoyer('PATCH', $this->portfolio(), ['banniere' => $banniere]);
        self::assertResponseIsSuccessful();
        $this->client->getCookieJar()->clear();

        foreach ([$montre, $banniere] as $fichier) {
            $this->client->request('GET', $fichier);
            self::assertResponseIsSuccessful();
        }
        $this->client->request('GET', $cache);
        self::assertResponseStatusCodeSame(404);

        // Portfolio repassé en privé : plus rien n'est ouvert
        $this->connection->executeStatement('UPDATE portfolio SET visibilite = false WHERE id = ?', [basename($this->portfolio())]);
        $this->client->request('GET', $montre);
        self::assertResponseStatusCodeSame(404);
    }

    public function testLeVisiteurNeLitRienDAutre(): void
    {
        foreach (['/api/portfolios', $this->portfolio(), '/api/pages', '/api/traces'] as $url) {
            $this->lire($url);
            self::assertResponseStatusCodeSame(401, $url);
        }
    }

    private function portfolio(): string
    {
        return $this->iri("SELECT '/api/portfolios/' || p.id FROM portfolio p JOIN etudiant e ON e.id = p.etudiant_id WHERE e.username = 'etudiant'");
    }

    private function cles(array $objet): array
    {
        $cles = array_keys($objet);
        sort($cles);

        return $cles;
    }

    private function deposerImage(): string
    {
        $chemin = tempnam(sys_get_temp_dir(), 'envoi');
        imagepng(imagecreatetruecolor(2, 2), $chemin);
        $this->client->request('POST', '/api/fichiers', ['type' => 'image'], ['fichier' => new UploadedFile($chemin, 'image.png', null, null, true)], ['HTTP_ACCEPT' => 'application/ld+json']);
        self::assertResponseStatusCodeSame(201);

        return json_decode((string) $this->client->getResponse()->getContent(), true)['@id'];
    }
}
