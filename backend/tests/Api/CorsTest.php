<?php

namespace App\Tests\Api;

use App\Tests\ApiTestCase;

class CorsTest extends ApiTestCase
{
    public function testFrontAutoriseAvecCookies(): void
    {
        $this->preflight('http://localhost:3000');

        self::assertResponseIsSuccessful();
        self::assertResponseHeaderSame('Access-Control-Allow-Origin', 'http://localhost:3000');
        self::assertResponseHeaderSame('Access-Control-Allow-Credentials', 'true');
    }

    public function testAutreOrigineRefusee(): void
    {
        $this->preflight('https://site-malveillant.example');

        self::assertResponseNotHasHeader('Access-Control-Allow-Origin');
    }

    public function testModificationEtSuppressionAutoriseesAuFront(): void
    {
        foreach (['PATCH', 'DELETE'] as $methode) {
            $this->preflight('http://localhost:3000', $methode);

            self::assertResponseIsSuccessful();
            self::assertStringContainsString($methode, (string) $this->client->getResponse()->headers->get('Access-Control-Allow-Methods'));
        }
    }

    private function preflight(string $origine, string $methode = 'GET'): void
    {
        $this->client->request('OPTIONS', '/api/me', server: [
            'HTTP_ORIGIN' => $origine,
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => $methode,
        ]);
    }
}
