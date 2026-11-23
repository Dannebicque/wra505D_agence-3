<?php

/*
 * Copyright (c) 2023. | Cyndel Herolt | IUT de Troyes  - All Rights Reserved
 * @author cyndelherolt
 * @project UniFolio
 */
namespace App\Entity;

use App\Repository\ValidationRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use App\State\ValidationProcessor;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Serializer\Attribute\Context;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Serializer\Attribute\SerializedName;
use Symfony\Component\Serializer\Normalizer\DateTimeNormalizer;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

/**
 * Évaluation d'une trace pour un niveau de compétence, au format de shared/types/evaluation.ts.
 * L'étudiant associe un niveau à sa trace (validation en attente, E-CP-02) et peut la retirer tant qu'elle
 * n'est pas évaluée ; l'évaluation par l'enseignant viendra au Sprint 3. Il ne voit que les validations
 * de ses traces hors corbeille (App\Doctrine\ProprietaireExtension).
 */
#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
        new Post(processor: ValidationProcessor::class, security: "is_granted('ROLE_ETUDIANT')"),
        new Delete(processor: ValidationProcessor::class, security: "is_granted('ROLE_ETUDIANT')"),
    ],
    normalizationContext: ['groups' => ['validation:read']],
    denormalizationContext: ['groups' => ['validation:write']],
    order: ['id' => 'ASC'],
    // Lecture : l'étudiant (ses données) et l'enseignant (ses départements), cf. App\Doctrine\ProprietaireExtension
    security: "is_granted('ROLE_ETUDIANT') or is_granted('ROLE_ENSEIGNANT')",
    // IRI d'une trace d'autrui, de la corbeille ou inexistante : 422 sur le champ, comme les autres erreurs de saisie
    collectDenormalizationErrors: true,
)]
#[UniqueEntity(fields: ['trace', 'niveau'], message: 'Ce niveau de compétence est déjà associé à la trace.', errorPath: 'niveau')]
#[ORM\Entity(repositoryClass: ValidationRepository::class)]
#[ORM\UniqueConstraint(fields: ['trace', 'niveau'])]
class Validation
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'validations')]
    private ?Trace $trace = null;

    #[ORM\ManyToOne(inversedBy: 'validations')]
    private ?Enseignant $enseignant = null;

    #[ORM\Column(nullable: true)]
    private ?int $etat = null;

    #[ORM\ManyToOne(inversedBy: 'validation')]
    #[ORM\JoinColumn(name: 'apc_niveau_id')]
    private ?ApcNiveau $niveau = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $dateCreation = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $dateModification = null;

    #[ORM\OneToMany(mappedBy: 'validation', targetEntity: Notification::class, cascade: ['persist', 'remove'])]
    private Collection $notifications;

    public function __construct()
    {
        $this->notifications = new ArrayCollection();
    }

    #[Assert\Callback]
    public function valider(ExecutionContextInterface $context): void
    {
        if (null === $this->trace) {
            $context->buildViolation('Choisissez une trace.')->atPath('trace')->addViolation();
        }
        if (null === $this->niveau) {
            $context->buildViolation('Choisissez un niveau de compétence.')->atPath('niveau')->addViolation();

            return;
        }
        // Le niveau doit venir du référentiel du département de l'étudiant
        $departement = $this->trace?->getBibliotheque()?->getEtudiant()?->getSemestre()?->getAnnee()?->getDiplome()?->getDepartement();
        if (null !== $departement && $this->niveau->getCompetences()?->getReferentiel()?->getDepartement() !== $departement) {
            $context->buildViolation('Ce niveau ne fait pas partie du référentiel de votre formation.')->atPath('niveau')->addViolation();
        }
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    #[Groups(['validation:read', 'validation:write'])]
    public function getTrace(): ?Trace
    {
        return $this->trace;
    }

    #[Groups(['validation:write'])]
    public function setTrace(?Trace $trace): self
    {
        $this->trace = $trace;

        return $this;
    }

    #[Groups(['validation:read'])]
    public function getEnseignant(): ?Enseignant
    {
        return $this->enseignant;
    }

    public function setEnseignant(?Enseignant $enseignant): self
    {
        $this->enseignant = $enseignant;

        return $this;
    }

    #[Groups(['validation:read'])]
    public function isEtat(): ?int
    {
        return $this->etat;
    }

    public function setEtat(?int $etat): self
    {
        $this->etat = $etat;

        return $this;
    }

    #[Groups(['validation:read', 'validation:write'])]
    public function getNiveau(): ?ApcNiveau
    {
        return $this->niveau;
    }

    #[Groups(['validation:write'])]
    public function setNiveau(?ApcNiveau $niveau): static
    {
        $this->niveau = $niveau;

        return $this;
    }

    #[Groups(['validation:read'])]
    #[Context(normalizationContext: [DateTimeNormalizer::FORMAT_KEY => 'Y-m-d'])]
    public function getDateCreation(): ?\DateTimeInterface
    {
        return $this->dateCreation;
    }

    public function setDateCreation(?\DateTimeInterface $dateCreation): static
    {
        $this->dateCreation = $dateCreation;

        return $this;
    }

    #[Groups(['validation:read'])]
    #[Context(normalizationContext: [DateTimeNormalizer::FORMAT_KEY => 'Y-m-d'])]
    public function getDateModification(): ?\DateTimeInterface
    {
        return $this->dateModification;
    }

    public function setDateModification(?\DateTimeInterface $dateModification): static
    {
        $this->dateModification = $dateModification;

        return $this;
    }

    /**
     * @return Collection<int, Notification>
     */
    public function getNotifications(): Collection
    {
        return $this->notifications;
    }

    public function addNotification(Notification $notification): static
    {
        if (!$this->notifications->contains($notification)) {
            $this->notifications->add($notification);
            $notification->setValidation($this);
        }

        return $this;
    }

    public function removeNotification(Notification $notification): static
    {
        if ($this->notifications->removeElement($notification)) {
            // set the owning side to null (unless already changed)
            if ($notification->getValidation() === $this) {
                $notification->setValidation(null);
            }
        }

        return $this;
    }
}
