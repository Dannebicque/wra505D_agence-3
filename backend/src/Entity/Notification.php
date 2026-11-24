<?php

/*
 * Copyright (c) 2023. | Cyndel Herolt | IUT de Troyes  - All Rights Reserved
 * @author cyndelherolt
 * @project UniFolio
 */
namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use App\Repository\NotificationRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Serializer\Attribute\SerializedName;

/**
 * Notification d'un étudiant, au format NotificationUtilisateur de shared/types/evaluation.ts : créée quand une de
 * ses traces est évaluée ou reçoit un commentaire visible (E-EV-04, E-EV-05). L'étudiant ne voit que les siennes,
 * les plus récentes d'abord, et les marque comme lues (PATCH { lu: true }).
 */
#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
        new Patch(),
    ],
    normalizationContext: ['groups' => ['notification:read']],
    denormalizationContext: ['groups' => ['notification:write']],
    order: ['dateCreation' => 'DESC', 'id' => 'DESC'],
    security: "is_granted('ROLE_ETUDIANT')",
    collectDenormalizationErrors: true,
)]
#[ORM\Entity(repositoryClass: NotificationRepository::class)]
class Notification
{
    public const EVALUATION = 'evaluation';
    public const COMMENTAIRE = 'commentaire';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $dateCreation = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $type = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $url = null;

    #[ORM\Column]
    private ?bool $lu = false;

    #[ORM\Column(length: 1, nullable: true)]
    private ?string $type_user = null;

    #[ORM\ManyToOne(inversedBy: 'notifications')]
    private ?Etudiant $etudiant = null;

    #[ORM\ManyToOne(inversedBy: 'notifications')]
    private ?Enseignant $enseignant = null;

    #[ORM\ManyToOne(inversedBy: 'notifications')]
    #[ORM\JoinColumn(onDelete: 'CASCADE')]
    private ?Validation $validation = null;

    #[ORM\ManyToOne(targetEntity: Commentaire::class, inversedBy: 'notifications')]
    #[ORM\JoinColumn(onDelete: 'CASCADE')]
    private ?Commentaire $commentaire = null;

    /** Notification de l'étudiant de la trace (ou du portfolio) concernée. */
    public static function pour(Etudiant $etudiant, ?Validation $validation = null, ?Commentaire $commentaire = null): self
    {
        return (new self())
            ->setEtudiant($etudiant)
            ->setType(null !== $validation ? self::EVALUATION : self::COMMENTAIRE)
            ->setValidation($validation)
            ->setCommentaire($commentaire)
            ->setEnseignant($validation?->getEnseignant() ?? $commentaire?->getEnseignant())
            ->setLu(false)
            ->setDateCreation(new \DateTime());
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    #[Groups(['notification:read'])]
    public function getDateCreation(): ?\DateTimeInterface
    {
        return $this->dateCreation;
    }

    public function setDateCreation(?\DateTimeInterface $dateCreation): static
    {
        $this->dateCreation = $dateCreation;

        return $this;
    }

    #[Groups(['notification:read'])]
    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(?string $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function getUrl(): ?string
    {
        return $this->url;
    }

    public function setUrl(?string $url): static
    {
        $this->url = $url;

        return $this;
    }

    #[Groups(['notification:read'])]
    public function isLu(): ?bool
    {
        return $this->lu;
    }

    #[Groups(['notification:write'])]
    public function setLu(bool $lu): static
    {
        $this->lu = $lu;

        return $this;
    }

    public function getTypeUser(): ?string
    {
        return $this->type_user;
    }

    public function setTypeUser(?string $type_user): static
    {
        $this->type_user = $type_user;

        return $this;
    }

    #[Groups(['notification:read'])]
    #[SerializedName('destinataire')]
    public function getEtudiant(): ?Etudiant
    {
        return $this->etudiant;
    }

    public function setEtudiant(?Etudiant $etudiant): static
    {
        $this->etudiant = $etudiant;

        return $this;
    }

    public function getEnseignant(): ?Enseignant
    {
        return $this->enseignant;
    }

    public function setEnseignant(?Enseignant $enseignant): static
    {
        $this->enseignant = $enseignant;

        return $this;
    }

    /** Trace à ouvrir depuis la notification (E-EV-07). */
    #[Groups(['notification:read'])]
    public function getTrace(): ?Trace
    {
        return $this->validation?->getTrace() ?? $this->commentaire?->getTrace();
    }

    #[Groups(['notification:read'])]
    public function getValidation(): ?Validation
    {
        return $this->validation;
    }

    public function setValidation(?Validation $validation): static
    {
        $this->validation = $validation;

        return $this;
    }

    #[Groups(['notification:read'])]
    public function getCommentaire(): ?Commentaire
    {
        return $this->commentaire;
    }

    public function setCommentaire(?Commentaire $commentaire): static
    {
        $this->commentaire = $commentaire;

        return $this;
    }
}
