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

        $this->client->request('GET', $fichier['@id']);
        $reponse = $this->client->getInternalResponse();
        self::assertResponseIsSuccessful();
        // Image réencodée (métadonnées retirées) : la taille annoncée est celle du fichier servi
        self::assertStringStartsWith("\x89PNG", $reponse->getContent());
        self::assertSame(\strlen($reponse->getContent()), $fichier['taille']);
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
        // Visiteur anonyme : 404, comme un fichier qui n'existe pas (seuls ceux d'un portfolio public sont ouverts)
        self::assertResponseStatusCodeSame(404);
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

    public function testRefuseAuDelaDuNombreMaximal(): void
    {
        $this->connecter('etudiant');
        $proprietaire = $this->connection->fetchOne("SELECT id FROM users WHERE username = 'etudiant'");
        for ($i = 0; $i < 100; ++$i) {
            $this->connection->insert('fichier', ['id' => sprintf('00000000-0000-4000-8000-%012d', $i), 'date_creation' => '2026-01-01', 'nom' => 'x.png', 'mime_type' => 'image/png', 'taille' => 1, 'proprietaire_id' => $proprietaire]);
        }

        $reponse = $this->deposer('image', base64_decode(self::PNG));

        self::assertResponseStatusCodeSame(422);
        self::assertSame('Vous avez atteint l’espace maximal de fichiers.', $reponse['violations'][0]['message']);
    }

    public function testNomNormaliseEtExtensionDuTypeReel(): void
    {
        $this->connecter('etudiant');

        self::assertSame('page.png', $this->deposer('image', base64_decode(self::PNG), 'page.html')['nom']);
        // « café » en forme décomposée (noms de fichiers macOS)
        self::assertSame('Photo café.png', $this->deposer('image', base64_decode(self::PNG), "Photo cafe\u{0301}.png")['nom']);
        $fichier = $this->deposer('image', base64_decode(self::PNG), 'Été.png');
        $this->client->request('GET', $fichier['@id']);
        self::assertSame("inline; filename=_t_.png; filename*=utf-8''%C3%89t%C3%A9.png", $this->client->getInternalResponse()->getHeader('Content-Disposition'));
    }

    public function testFichierTropGrosPourPhp(): void
    {
        $this->connecter('etudiant');
        $chemin = tempnam(sys_get_temp_dir(), 'envoi');

        $this->client->request('POST', '/api/fichiers', ['type' => 'pdf'], ['fichier' => new UploadedFile($chemin, 'gros.pdf', null, \UPLOAD_ERR_INI_SIZE, true)], ['HTTP_ACCEPT' => 'application/ld+json']);
        self::assertResponseStatusCodeSame(422);
        self::assertStringContainsString('10 Mo', $this->client->getResponse()->getContent());

        $this->client->request('POST', '/api/fichiers', ['type' => 'pdf'], [], ['HTTP_ACCEPT' => 'application/ld+json', 'HTTP_CONTENT_LENGTH' => (string) (11 * 1024 * 1024)]);
        self::assertResponseStatusCodeSame(413);
    }

    public function testPhotoSansSesMetadonnees(): void
    {
        $this->connecter('etudiant');
        $image = imagecreatetruecolor(4, 4);
        ob_start();
        imagejpeg($image);
        $jpeg = (string) ob_get_clean();
        // Bloc EXIF (APP1) glissé après le marqueur de début, avec une « position » repérable
        $exif = "Exif\0\0MM\0*\0\0\0\x08GPSsecret-48.29N-4.07E";
        $photo = substr($jpeg, 0, 2) . "\xFF\xE1" . pack('n', \strlen($exif) + 2) . $exif . substr($jpeg, 2);

        $fichier = $this->deposer('image', $photo, 'photo.jpg');
        self::assertResponseStatusCodeSame(201);

        $this->client->request('GET', $fichier['@id']);
        self::assertStringStartsWith("\xFF\xD8\xFF", $this->client->getInternalResponse()->getContent());
        self::assertStringNotContainsString('GPSsecret', $this->client->getInternalResponse()->getContent());
    }

    public function testRefuseUneImageDemesuree(): void
    {
        $this->connecter('etudiant');
        // En-tête PNG annonçant 10 000 × 10 000 pixels (100 mégapixels), sans les données
        $png = base64_decode(self::PNG);
        $enorme = substr($png, 0, 16) . pack('NN', 10000, 10000) . substr($png, 24);

        $reponse = $this->deposer('image', $enorme, 'enorme.png');

        self::assertResponseStatusCodeSame(422);
        self::assertSame('L’image est trop grande (40 mégapixels au plus).', $reponse['violations'][0]['message']);
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

    public function testPatchNeGlissePasLeFichierDUnAutre(): void
    {
        $this->connecter('etudiant2');
        $autre = $this->deposer('image', base64_decode(self::PNG))['@id'];
        $this->connecter('etudiant');
        $image = $this->deposer('image', base64_decode(self::PNG))['@id'];
        $trace = $this->envoyer('POST', '/api/traces', $this->traceImage($image))['@id'];

        $this->envoyer('PATCH', $trace, ['contenu' => [$autre]]);
        self::assertResponseStatusCodeSame(422);
        // Même fichier, type changé en PDF : refusé (c'est une image)
        $this->envoyer('PATCH', $trace, ['type' => 'pdf']);
        self::assertResponseStatusCodeSame(422);
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
