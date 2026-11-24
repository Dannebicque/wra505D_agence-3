<?php

namespace App\Tests\Api;

use App\Tests\ApiTestCase;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Commentaires d'enseignant (Sprint 3, P-EV-04, P-CO-01, E-EV-02, E-EV-05) : contrat de shared/types/evaluation.ts,
 * visibilité pour l'étudiant, auteur seul à modifier, notification à la première visibilité.
 */
class CommentaireTest extends ApiTestCase
{
    public function testCommenteUneTraceEtNotifieLEtudiant(): void
    {
        $this->connecter('enseignant');

        $commentaire = $this->envoyer('POST', '/api/commentaires', ['trace' => $this->trace(), 'contenu' => '  Très bien  ', 'visibleEtudiant' => true, 'enseignant' => '/api/enseignants/999']);

        self::assertResponseStatusCodeSame(201);
        $cles = array_keys($commentaire);
        sort($cles);
        self::assertSame(['@context', '@id', '@type', 'contenu', 'dateCreation', 'dateModification', 'enseignant', 'portfolio', 'trace', 'visibleEtudiant'], $cles);
        self::assertSame('Très bien', $commentaire['contenu']);
        self::assertSame($this->enseignant('enseignant'), $commentaire['enseignant']);
        self::assertNull($commentaire['portfolio']);

        $this->connecter('etudiant');
        self::assertContains($commentaire['@id'], array_column($this->lire('/api/commentaires?trace=' . urlencode($this->trace()))['member'], '@id'));
        $notification = $this->lire('/api/notifications')['member'][0];
        self::assertSame(['commentaire', $commentaire['@id'], $this->trace()], [$notification['type'], $notification['commentaire'], $notification['trace']]);
    }

    public function testUneNotePriveeResteEntreEnseignants(): void
    {
        $this->connecter('enseignant');
        $note = $this->envoyer('POST', '/api/commentaires', ['trace' => $this->trace(), 'contenu' => 'À revoir en équipe', 'visibleEtudiant' => false])['@id'];

        $this->connecter('etudiant');
        $this->lire($note);
        self::assertResponseStatusCodeSame(404);
        self::assertNotContains($note, array_column($this->lire('/api/commentaires')['member'], '@id'));
        self::assertSame(2, $this->lire('/api/notifications')['totalItems'], 'Pas de notification');

        // Rendue visible plus tard : l'étudiant la lit et en est notifié une fois
        $this->connecter('enseignant');
        $this->envoyer('PATCH', $note, ['visibleEtudiant' => true]);
        $this->envoyer('PATCH', $note, ['contenu' => 'À revoir, voir le cours 3']);
        $this->connecter('etudiant');
        $this->lire($note);
        self::assertResponseIsSuccessful();
        self::assertSame(3, $this->lire('/api/notifications')['totalItems']);
    }

    public function testRemasqueNeLaissePasDeNotificationNiNeLaDouble(): void
    {
        $this->connecter('enseignant');
        $commentaire = $this->envoyer('POST', '/api/commentaires', ['trace' => $this->trace(), 'contenu' => 'Bien', 'visibleEtudiant' => true])['@id'];

        $this->envoyer('PATCH', $commentaire, ['visibleEtudiant' => false]);
        $this->connecter('etudiant');
        self::assertNotContains($commentaire, array_column($this->lire('/api/notifications')['member'], 'commentaire'), 'Notification masquée avec le commentaire');

        $this->connecter('enseignant');
        $this->envoyer('PATCH', $commentaire, ['visibleEtudiant' => true]);
        $this->connecter('etudiant');
        self::assertSame(1, \count(array_keys(array_column($this->lire('/api/notifications')['member'], 'commentaire'), $commentaire)), 'Une seule notification');
    }

    public function testUnCollegueNeModifiePasLeCommentaireDUnAutre(): void
    {
        $existant = $this->iri("SELECT '/api/commentaires/' || id FROM commentaire LIMIT 1");
        $this->connecter('enseignant3');

        $this->lire($existant);
        self::assertResponseIsSuccessful();
        $this->envoyer('PATCH', $existant, ['contenu' => 'Pirate']);
        self::assertResponseStatusCodeSame(403);
        $this->envoyer('DELETE', $existant);
        self::assertResponseStatusCodeSame(403);
    }

    public function testCommenteUnPortfolioPublic(): void
    {
        $this->connecter('enseignant');

        $commentaire = $this->envoyer('POST', '/api/commentaires', ['portfolio' => $this->portfolio(), 'contenu' => 'Belle progression', 'visibleEtudiant' => true]);

        self::assertResponseStatusCodeSame(201);
        self::assertSame($this->portfolio(), $commentaire['portfolio']);
        self::assertSame(1, $this->lire('/api/commentaires?portfolio=' . urlencode($this->portfolio()))['totalItems']);
    }

    public static function saisiesInvalides(): iterable
    {
        yield 'vide' => [['contenu' => '  '], 'contenu', 'Le commentaire est obligatoire.'];
        yield 'trop long' => [['contenu' => str_repeat('a', 2001)], 'contenu', 'Le commentaire ne doit pas dépasser 2 000 caractères.'];
        yield 'sans cible' => [['trace' => null], 'trace', 'Commentez une trace ou un portfolio.'];
        yield 'deux cibles' => [['portfolio' => 'PORTFOLIO'], 'trace', 'Commentez une trace ou un portfolio.'];
        yield 'trace introuvable' => [['trace' => '/api/traces/999999'], 'trace', 'Trace introuvable.'];
    }

    #[DataProvider('saisiesInvalides')]
    public function testRefuseUneSaisieInvalide(array $champs, string $champ, string $message): void
    {
        $this->connecter('enseignant');
        $corps = [...['trace' => $this->trace(), 'contenu' => 'Bien', 'visibleEtudiant' => true], ...$champs];
        $corps = array_map(fn ($v) => 'PORTFOLIO' === $v ? $this->portfolio() : $v, $corps);

        $reponse = $this->envoyer('POST', '/api/commentaires', $corps);

        self::assertResponseStatusCodeSame(422);
        self::assertSame([[$champ, $message]], array_map(static fn (array $v) => [$v['propertyPath'], $v['message']], $reponse['violations']));
    }

    public function testRefuseUnBrouillonUnPortfolioPriveOuUnAutreDepartement(): void
    {
        $this->connection->executeStatement('UPDATE portfolio SET visibilite = false');
        $brouillon = $this->iri("SELECT '/api/traces/' || id FROM trace WHERE titre = 'Affiche en cours'");
        $this->connecter('enseignant');

        foreach (['trace' => $brouillon, 'portfolio' => $this->portfolio()] as $champ => $cible) {
            $reponse = $this->envoyer('POST', '/api/commentaires', [$champ => $cible, 'contenu' => 'Bien', 'visibleEtudiant' => true]);
            self::assertResponseStatusCodeSame(422, $champ);
            self::assertSame($champ, $reponse['violations'][0]['propertyPath']);
        }

        $this->connecter('enseignant2');
        $this->envoyer('POST', '/api/commentaires', ['trace' => $this->trace(), 'contenu' => 'Bien', 'visibleEtudiant' => true]);
        self::assertResponseStatusCodeSame(422);
    }

    public function testSeulLAuteurModifieOuSupprime(): void
    {
        $existant = $this->iri("SELECT '/api/commentaires/' || id FROM commentaire LIMIT 1");

        $this->connecter('etudiant');
        $this->envoyer('PATCH', $existant, ['contenu' => 'Pirate']);
        self::assertResponseStatusCodeSame(403);
        $this->envoyer('POST', '/api/commentaires', ['trace' => $this->trace(), 'contenu' => 'Pirate', 'visibleEtudiant' => true]);
        self::assertResponseStatusCodeSame(403);

        $this->connecter('enseignant2');
        $this->envoyer('DELETE', $existant);
        self::assertResponseStatusCodeSame(404);

        $this->connecter('enseignant');
        $modifie = $this->envoyer('PATCH', $existant, ['contenu' => 'Corrigé', 'trace' => null]);
        self::assertResponseIsSuccessful();
        self::assertSame('Corrigé', $modifie['contenu']);
        self::assertSame($this->trace(), $modifie['trace'], 'La cible ne change pas');
        self::assertNotNull($modifie['dateModification']);
        $this->envoyer('DELETE', $existant);
        self::assertResponseStatusCodeSame(204);
        $this->lire($existant);
        self::assertResponseStatusCodeSame(404);
    }

    private function trace(): string
    {
        return $this->iri("SELECT '/api/traces/' || id FROM trace WHERE titre = 'Site vitrine d’une association'");
    }

    private function portfolio(): string
    {
        return $this->iri("SELECT '/api/portfolios/' || id FROM portfolio LIMIT 1");
    }

    private function enseignant(string $username): string
    {
        return $this->iri("SELECT '/api/enseignants/' || id FROM enseignant WHERE username = '$username'");
    }
}
