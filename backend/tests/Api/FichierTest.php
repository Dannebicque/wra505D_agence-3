<?php

namespace App\Tests\Api;

use App\Tests\ApiTestCase;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpFoundation\File\UploadedFile;

/**
 * Fichiers des traces (Sprint 1) : contrôle sur le contenu réel, lecture par le seul propriétaire,
 * association à une trace. Règles et messages de shared/utils/fichier.ts et des routes Nitro.
 */
class FichierTest extends ApiTestCase
{
    /** PNG 1 × 1 valide. */
    private const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    public function testDeposeUneImageEtLaRelit(): void
    {
        $this->connecter('etudiant');

        $fichier = $this->deposer('image', base64_decode(self::PNG), '../../dossier/Photo du café<script>.png');

        self::assertResponseStatusCodeSame(201);
        $cles = array_keys($fichier);
        sort($cles);
        self::assertSame(['@context', '@id', '@type', 'mimeType', 'nom', 'taille'], $cles);
        self::assertSame('Fichier', $fichier['@type']);
        self::assertMatchesRegularExpression('#^/api/fichiers/[0-9a-f-]{36}$#', $fichier['@id']);
        self::assertSame('Photo du café_script_.png', $fichier['nom']);
        self::assertSame('image/png', $fichier['mimeType']);
        self::assertSame(\strlen(base64_decode(self::PNG)), $fichier['taille']);

        $this->client->request('GET', $fichier['@id']);
        $reponse = $this->client->getInternalResponse();
        self::assertResponseIsSuccessful();
        self::assertSame(base64_decode(self::PNG), $this->client->getInternalResponse()->getContent());
        self::assertSame('image/png', $reponse->getHeader('Content-Type'));
        self::assertSame('nosniff', $reponse->getHeader('X-Content-Type-Options'));
        self::assertSame('same-site', $reponse->getHeader('Cross-Origin-Resource-Policy'));
        self::assertStringContainsString('sandbox', $reponse->getHeader('Content-Security-Policy'));
        self::assertStringStartsWith('inline;', $reponse->getHeader('Content-Disposition'));
        self::assertStringContainsString('private', $reponse->getHeader('Cache-Control'));
    }

    public function testUnPdfEstServiSansBacASable(): void
    {
        $this->connecter('etudiant');

        $fichier = $this->deposer('pdf', "%PDF-1.4\n%%EOF\n", 'rapport.pdf');
        self::assertResponseStatusCodeSame(201);

        $this->client->request('GET', $fichier['@id']);
        self::assertResponseIsSuccessful();
        self::assertSame('application/pdf', $this->client->getInternalResponse()->getHeader('Content-Type'));
        self::assertNull($this->client->getInternalResponse()->getHeader('Content-Security-Policy'));
    }

    public function testFichierLisibleParSonSeulProprietaire(): void
    {
        $this->connecter('etudiant2');
        $iri = $this->deposer('image', base64_decode(self::PNG))['@id'];

        $this->connecter('etudiant');
        $this->client->request('GET', $iri);
        self::assertResponseStatusCodeSame(404);
        $this->client->request('GET', '/api/fichiers/pas-un-uuid');
        self::assertResponseStatusCodeSame(404);

        // Sans cookie de session : visiteur anonyme
        $this->client->getCookieJar()->clear();
        $this->client->request('GET', $iri);
        self::assertResponseStatusCodeSame(401);
    }

    public static function envoisRefuses(): iterable
    {
        $png = base64_decode(self::PNG);

        yield 'texte déguisé en image' => ['image', 'Bonjour', 'faux.png', 'Choisissez une image JPEG, PNG, WebP ou GIF.'];
        yield 'SVG' => ['image', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', 'dessin.svg', 'Choisissez une image JPEG, PNG, WebP ou GIF.'];
        yield 'image annoncée comme PDF' => ['pdf', $png, 'faux.pdf', 'Choisissez un fichier PDF.'];
        yield 'fichier vide' => ['image', '', 'vide.png', 'Le fichier est vide.'];
        yield 'image de plus de 2 Mo' => ['image', $png . str_repeat("\0", 2 * 1024 * 1024), 'grande.png', 'Le fichier dépasse la taille maximale (2 Mo).'];
        yield 'type de trace inconnu' => ['video', $png, 'photo.png', 'Choisissez un fichier.'];
    }

    #[DataProvider('envoisRefuses')]
    public function testRefuseUnEnvoiInvalide(string $type, string $contenu, string $nom, string $message): void
    {
        $this->connecter('etudiant');

        $reponse = $this->deposer($type, $contenu, $nom);

        self::assertResponseStatusCodeSame(422);
        self::assertSame([['fichier', $message]], array_map(static fn (array $v) => [$v['propertyPath'], $v['message']], $reponse['violations']));
    }

    public function testRefuseAuDelaDeLEspaceMaximal(): void
    {
        $this->connecter('etudiant');
        $this->deposer('image', base64_decode(self::PNG));
        $this->connection->executeStatement("UPDATE fichier SET taille = 200 * 1024 * 1024 WHERE proprietaire_id = (SELECT id FROM users WHERE username = 'etudiant')");

        $reponse = $this->deposer('image', base64_decode(self::PNG));

        self::assertResponseStatusCodeSame(422);
        self::assertSame('Vous avez atteint l’espace maximal de fichiers.', $reponse['violations'][0]['message']);
    }

    public function testEnseignantNeDeposePas(): void
    {
        $this->connecter('enseignant');

        $this->deposer('image', base64_decode(self::PNG));

        self::assertResponseStatusCodeSame(403);
    }

    public function testUneTraceImageUtiliseUnFichierDeLEtudiant(): void
    {
        $this->connecter('etudiant');
        $image = $this->deposer('image', base64_decode(self::PNG))['@id'];
        $pdf = $this->deposer('pdf', "%PDF-1.4\n%%EOF\n")['@id'];
        $this->connecter('etudiant2');
        $autre = $this->deposer('image', base64_decode(self::PNG))['@id'];
        $this->connecter('etudiant');

        $this->envoyer('POST', '/api/traces', $this->traceImage($image));
        self::assertResponseStatusCodeSame(201);

        foreach (['fichier d’un autre étudiant' => $autre, 'PDF dans une trace image' => $pdf, 'fichier inconnu' => '/api/fichiers/00000000-0000-4000-8000-000000000000', 'ancien fichier' => '/fichiers/ancien.png'] as $cas => $contenu) {
            $reponse = $this->envoyer('POST', '/api/traces', $this->traceImage($contenu));
            self::assertResponseStatusCodeSame(422, $cas);
            self::assertSame('Déposez un fichier du bon format avant de l’associer.', $reponse['violations'][0]['message'], $cas);
        }
    }

    public function testUnAncienFichierInchangeResteAccepte(): void
    {
        $this->connecter('etudiant');
        $trace = $this->envoyer('POST', '/api/traces', ['titre' => 'Affiche', 'type' => 'image', 'contenu' => [], 'statut' => 'brouillon']);
        // Trace reprise de l'ancienne version : son fichier n'a pas été déposé par l'API
        $this->connection->executeStatement("UPDATE trace SET contenu = '[\"/fichiers/ancien.png\"]' WHERE id = ?", [basename($trace['@id'])]);

        $modifiee = $this->envoyer('PATCH', $trace['@id'], ['titre' => 'Affiche du festival', 'legende' => 'Affiche bleue']);
        self::assertResponseIsSuccessful();
        self::assertSame(['/fichiers/ancien.png'], $modifiee['contenu']);

        $this->envoyer('PATCH', $trace['@id'], ['contenu' => ['/fichiers/autre.png']]);
        self::assertResponseStatusCodeSame(422);
    }

    private function traceImage(string $contenu): array
    {
        return ['titre' => 'Mon affiche', 'type' => 'image', 'contenu' => [$contenu], 'legende' => 'Une affiche', 'statut' => 'finalisee'];
    }

    private function deposer(string $type, string $contenu, string $nom = 'photo.png'): array
    {
        $chemin = tempnam(sys_get_temp_dir(), 'envoi');
        file_put_contents($chemin, $contenu);
        $this->client->request(
            'POST',
            '/api/fichiers',
            ['type' => $type],
            ['fichier' => new UploadedFile($chemin, $nom, null, null, true)],
            ['HTTP_ACCEPT' => 'application/ld+json'],
        );

        return json_decode((string) $this->client->getResponse()->getContent(), true) ?? [];
    }
}
