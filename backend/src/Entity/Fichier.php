<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Post;
use App\Repository\FichierRepository;
use App\State\FichierProcessor;
use App\State\FichierProvider;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;

/**
 * Fichier déposé par un étudiant pour une trace image ou PDF, au format de shared/types/fichier.ts.
 * POST /api/fichiers (multipart : `type`, `fichier`) l'enregistre ; GET /api/fichiers/{id} renvoie son contenu.
 */
#[ApiResource(
    operations: [
        new Get(provider: FichierProvider::class),
        new Post(inputFormats: ['multipart' => ['multipart/form-data']], deserialize: false, processor: FichierProcessor::class),
    ],
    normalizationContext: ['groups' => ['fichier:read']],
    security: "is_granted('ROLE_ETUDIANT')",
)]
#[ORM\Entity(repositoryClass: FichierRepository::class)]
class Fichier
{
    private const MO = 1024 * 1024;

    /** Formats acceptés par type de trace, comme FILE_RULES (shared/utils/fichier.ts). Le SVG est exclu : il peut contenir du script. */
    public const REGLES = [
        'image' => [
            'types' => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
            'max' => 2 * self::MO,
            'mauvaisFormat' => 'Choisissez une image JPEG, PNG, WebP ou GIF.',
        ],
        'pdf' => [
            'types' => ['application/pdf'],
            'max' => 10 * self::MO,
            'mauvaisFormat' => 'Choisissez un fichier PDF.',
        ],
    ];

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $id;

    #[ORM\Column]
    private \DateTimeImmutable $dateCreation;

    public function __construct(
        #[ORM\ManyToOne]
        #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
        private Users $proprietaire,
        #[ORM\Column(length: 100)]
        private string $nom,
        #[ORM\Column(length: 50)]
        private string $mimeType,
        #[ORM\Column]
        private int $taille,
    ) {
        $this->id = Uuid::v4();
        $this->dateCreation = new \DateTimeImmutable();
    }

    /** Type réel d'après les premiers octets (« nombre magique »), comme detectFileKind() du front ; null si inconnu. */
    public static function typeReel(string $debut): ?string
    {
        return match (true) {
            str_starts_with($debut, "\xFF\xD8\xFF") => 'image/jpeg',
            str_starts_with($debut, "\x89PNG\r\n\x1A\n") => 'image/png',
            str_starts_with($debut, 'GIF87a'), str_starts_with($debut, 'GIF89a') => 'image/gif',
            str_starts_with($debut, 'RIFF') && 'WEBP' === substr($debut, 8, 4) => 'image/webp',
            str_starts_with($debut, '%PDF-') => 'application/pdf',
            default => null,
        };
    }

    /** Nom affichable et sans danger, comme cleanName() du front : pas de chemin ni de caractère spécial, accents gardés. */
    public static function nomPropre(string $nom): string
    {
        $base = basename(str_replace('\\', '/', $nom));
        $propre = (string) preg_replace('/[^\p{L}\p{N} ._-]+/u', '_', $base);
        $propre = mb_substr((string) preg_replace('/^[_.\s]+/u', '', $propre), 0, 100);

        return '' === $propre ? 'fichier' : $propre;
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getProprietaire(): Users
    {
        return $this->proprietaire;
    }

    #[Groups(['fichier:read'])]
    public function getNom(): string
    {
        return $this->nom;
    }

    #[Groups(['fichier:read'])]
    public function getMimeType(): string
    {
        return $this->mimeType;
    }

    /** Taille en octets. */
    #[Groups(['fichier:read'])]
    public function getTaille(): int
    {
        return $this->taille;
    }

    public function getDateCreation(): \DateTimeImmutable
    {
        return $this->dateCreation;
    }
}
