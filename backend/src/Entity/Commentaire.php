<?php

/*
 * Copyright (c) 2023. | Cyndel Herolt | IUT de Troyes  - All Rights Reserved
 * @author cyndelherolt
 * @project UniFolio
 */
namespace App\Entity;

use App\Repository\CommentaireRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\QueryParameter;
use App\Filter\IriExacteFilter;
use App\State\CommentaireProcessor;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Serializer\Attribute\SerializedName;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

/**
 * Commentaire d'un enseignant sur une trace ou un portfolio, au format de shared/types/evaluation.ts (P-EV-04,
 * P-CO-01). `visibleEtudiant` : lu par l'étudiant (E-EV-02) et notifié (E-EV-05), sinon note réservée aux
 * enseignants. Seul son auteur le modifie ou le supprime. Périmètre : App\Doctrine\ProprietaireExtension.
 */
#[ApiResource(
    operations: [
        new GetCollection(parameters: [
            'trace' => new QueryParameter(filter: new IriExacteFilter('trace', 'traces')),
            'portfolio' => new QueryParameter(filter: new IriExacteFilter('portfolio', 'portfolios')),
        ]),
        new Get(),
        new Post(processor: CommentaireProcessor::class, denormalizationContext: ['groups' => ['commentaire:write', 'commentaire:cible']], security: "is_granted('ROLE_ENSEIGNANT')"),
        new Patch(processor: CommentaireProcessor::class, security: "is_granted('ROLE_ENSEIGNANT') and object.getEnseignant() === user.getEnseignant()"),
        new Delete(security: "is_granted('ROLE_ENSEIGNANT') and object.getEnseignant() === user.getEnseignant()"),
    ],
    normalizationContext: ['groups' => ['commentaire:read']],
    denormalizationContext: ['groups' => ['commentaire:write']],
    order: ['date_creation' => 'ASC', 'id' => 'ASC'],
    security: "is_granted('ROLE_ETUDIANT') or is_granted('ROLE_ENSEIGNANT')",
    collectDenormalizationErrors: true,
)]
#[ORM\Entity(repositoryClass: CommentaireRepository::class)]
class Commentaire
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $date_creation = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $date_modification = null;

    #[ORM\ManyToOne(inversedBy: 'commentaires')]
    private ?Portfolio $portfolio = null;

    #[ORM\ManyToOne(inversedBy: 'commentaires')]
    private ?Trace $trace = null;

    #[ORM\ManyToOne(inversedBy: 'commentaires')]
    private ?Enseignant $enseignant = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $contenu = '';

    /** Visible par l'étudiant. */
    #[ORM\Column]
    private ?bool $visibilite = true;

    #[ORM\OneToMany(targetEntity: Notification::class, mappedBy: 'commentaire', cascade: ['persist', 'remove'])]
    private ?Collection $notifications = null;

    #[ORM\Column(nullable: true)]
    private ?int $commentaire_parent = null;

    #[ORM\Column(nullable: true)]
    private ?int $commentaire_enfant = null;

    public function __construct()
    {
        $this->notifications = new ArrayCollection();
    }

    #[Assert\Callback]
    public function valider(ExecutionContextInterface $context): void
    {
        $contenu = $this->contenu ?? '';
        if ('' === $contenu) {
            $context->buildViolation('Le commentaire est obligatoire.')->atPath('contenu')->addViolation();
        } elseif (intdiv(\strlen((string) mb_convert_encoding($contenu, 'UTF-16LE', 'UTF-8')), 2) > 2000) {
            $context->buildViolation('Le commentaire ne doit pas dépasser 2 000 caractères.')->atPath('contenu')->addViolation();
        }
        if ((null === $this->trace) === (null === $this->portfolio)) {
            $context->buildViolation('Commentez une trace ou un portfolio.')->atPath('trace')->addViolation();
        }
    }

    /** Étudiant concerné : celui de la trace ou du portfolio commenté. */
    public function getEtudiantConcerne(): ?Etudiant
    {
        return $this->trace?->getBibliotheque()?->getEtudiant() ?? $this->portfolio?->getEtudiant();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    #[Groups(['commentaire:read'])]
    public function getDateCreation(): ?\DateTimeInterface
    {
        return $this->date_creation;
    }

    public function setDateCreation(?\DateTimeInterface $date_creation): self
    {
        $this->date_creation = $date_creation;

        return $this;
    }

    #[Groups(['commentaire:read'])]
    public function getDateModification(): ?\DateTimeInterface
    {
        return $this->date_modification;
    }

    public function setDateModification(?\DateTimeInterface $date_modification): self
    {
        $this->date_modification = $date_modification;

        return $this;
    }

    #[Groups(['commentaire:read'])]
    public function getPortfolio(): ?Portfolio
    {
        return $this->portfolio;
    }

    #[Groups(['commentaire:cible'])]
    public function setPortfolio(?Portfolio $portfolio): self
    {
        $this->portfolio = $portfolio;

        return $this;
    }

    #[Groups(['commentaire:read'])]
    public function getTrace(): ?Trace
    {
        return $this->trace;
    }

    #[Groups(['commentaire:cible'])]
    public function setTrace(?Trace $trace): self
    {
        $this->trace = $trace;

        return $this;
    }

    #[Groups(['commentaire:read'])]
    public function getEnseignant(): ?Enseignant
    {
        return $this->enseignant;
    }

    public function setEnseignant(?Enseignant $enseignant): self
    {
        $this->enseignant = $enseignant;

        return $this;
    }

    #[Groups(['commentaire:read'])]
    public function getContenu(): ?string
    {
        return $this->contenu;
    }

    #[Groups(['commentaire:write'])]
    public function setContenu(?string $contenu): static
    {
        $this->contenu = null === $contenu ? '' : mb_trim(str_replace("\0", '', $contenu));

        return $this;
    }

    #[Groups(['commentaire:read'])]
    #[SerializedName('visibleEtudiant')]
    public function isVisibilite(): ?bool
    {
        return $this->visibilite;
    }

    #[Groups(['commentaire:write'])]
    #[SerializedName('visibleEtudiant')]
    public function setVisibilite(bool $visibilite): static
    {
        $this->visibilite = $visibilite;

        return $this;
    }

    /**
     * @return Collection|Notification[]
     */
    public function getNotifications(): Collection
    {
        return $this->notifications;
    }

    public function addNotification(Notification $notification): self
    {
        if (!$this->notifications->contains($notification)) {
            $this->notifications[] = $notification;
            $notification->setCommentaire($this);
        }

        return $this;
    }

    public function removeNotification(Notification $notification): self
    {
        if ($this->notifications->removeElement($notification)) {
            // set the owning side to null (unless already changed)
            if ($notification->getCommentaire() === $this) {
                $notification->setCommentaire(null);
            }
        }

        return $this;
    }

    public function getCommentaireParent(): ?int
    {
        return $this->commentaire_parent;
    }

    public function setCommentaireParent(?int $commentaire_parent): static
    {
        $this->commentaire_parent = $commentaire_parent;

        return $this;
    }

    public function getCommentaireEnfant(): ?int
    {
        return $this->commentaire_enfant;
    }

    public function setCommentaireEnfant(?int $commentaire_enfant): static
    {
        $this->commentaire_enfant = $commentaire_enfant;

        return $this;
    }
}
