<?php

namespace App\Tests\Api;

use App\Tests\ApiTestCase;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Un identifiant au-delà d'un entier PostgreSQL (2147483647) répond 404 (URL) ou 422 sur le bon champ (IRI dans
 * un corps), jamais 500 : contrainte `requirements.id` par défaut dans config/packages/api_platform.yaml.
 */
class IdentifiantsHorsBornesTest extends ApiTestCase
{
    public static function adresses(): iterable
    {
        foreach (['traces', 'bibliotheques', 'validations', 'portfolios', 'pages', 'referentiels', 'niveaux', 'competences', 'apprentissages_critiques', 'departements', 'diplomes', 'annees', 'semestres', 'groupes', 'parcours', 'etudiants', 'enseignants', 'users'] as $ressource) {
            yield $ressource => ["/api/$ressource/2147483648"];
        }
        yield 'très grand' => ['/api/traces/99999999999999999999'];
        yield 'zéro' => ['/api/traces/0'];
        yield 'lien public' => ['/api/portfolios/2147483648/public'];
    }

    #[DataProvider('adresses')]
    public function testUrlHorsBornesIntrouvable(string $url): void
    {
        $this->connecter('etudiant');

        $this->lire($url);

        self::assertResponseStatusCodeSame(404);
    }

    public function testLaBorneElleMemeResteUneAdresseValide(): void
    {
        $this->connecter('etudiant');

        $this->lire('/api/traces/2147483647');

        self::assertResponseStatusCodeSame(404, 'Route trouvée, trace inexistante');
        self::assertStringContainsString('Not Found', (string) $this->client->getResponse()->getContent());
    }

    public function testIriHorsBornesDansUnCorps(): void
    {
        $this->connecter('etudiant');
        $niveau = $this->iri("SELECT '/api/niveaux/' || id FROM apc_niveau LIMIT 1");
        $page = $this->iri("SELECT '/api/pages/' || id FROM page LIMIT 1");

        $validation = $this->envoyer('POST', '/api/validations', ['trace' => '/api/traces/2147483648', 'niveau' => $niveau]);
        self::assertResponseStatusCodeSame(422);
        self::assertSame([['trace', 'Trace introuvable.']], array_map(static fn (array $v) => [$v['propertyPath'], $v['message']], $validation['violations']));

        $reponse = $this->envoyer('PATCH', $page, ['traces' => ['/api/traces/2147483648']]);
        self::assertResponseStatusCodeSame(422);
        self::assertSame([['traces', 'Trace introuvable.']], array_map(static fn (array $v) => [$v['propertyPath'], $v['message']], $reponse['violations']));
    }

    public function testUnFichierGardeSonIdentifiantUuid(): void
    {
        $this->connecter('etudiant');

        $this->client->request('GET', '/api/fichiers/00000000-0000-4000-8000-000000000000');

        self::assertResponseStatusCodeSame(404);
        self::assertStringContainsString('Fichier introuvable.', (string) $this->client->getResponse()->getContent());
    }
}
