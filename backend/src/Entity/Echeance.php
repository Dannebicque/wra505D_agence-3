<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Repository\EcheanceRepository;
use App\State\EcheanceProcessor;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Serializer\Attribute\SerializedName;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

/**
 * Échéance saisie par un enseignant pour une année ou un groupe de son département (E-DB-03, P-OR-06 ; décision du PO,
 * point ouvert n° 1). L'étudiant lit les échéances à venir qui le concernent ; l'enseignant celles de ses départements.
 * Seul son auteur la modifie ou la supprime. Périmètre : App\Doctrine\ProprietaireExtension.
 */
#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
        new Post(processor: EcheanceProcessor::class, security: "is_granted('ROLE_ENSEIGNANT')"),
        new Patch(processor: EcheanceProcessor::class, security: "is_granted('ROLE_ENSEIGNANT') and object.getEnseignant() === user.getEnseignant()"),
        new Delete(security: "is_granted('ROLE_ENSEIGNANT') and object.getEnseignant() === user.getEnseignant()"),
    ],
    normalizationContext: ['groups' => ['echeance:read']],
    denormalizationContext: ['groups' => ['echeance:write']],
    order: ['date' => 'ASC', 'id' => 'ASC'],
    security: "is_granted('ROLE_ETUDIANT') or is_granted('ROLE_ENSEIGNANT')",
    collectDenormalizationErrors: true,
)]
#[ORM\Entity(repositoryClass: EcheanceRepository::class)]
class Echeance
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    private string $libelle = '';

    #[ORM\Column(type: Types::DATE_IMMUTABLE)]
    private ?\DateTimeImmutable $date = null;

    /** Date reçue mais impossible à lire. */
    private bool $dateInvalide = false;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(onDelete: 'CASCADE')]
    private ?Annee $annee = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(onDelete: 'CASCADE')]
    private ?Groupe $groupe = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Enseignant $enseignant = null;

    #[ORM\Column]
    private \DateTimeImmutable $dateCreation;

    public function __construct()
    {
        $this->dateCreation = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    #[Groups(['echeance:read'])]
    public function getLibelle(): string
    {
        return $this->libelle;
    }

    #[Groups(['echeance:write'])]
    public function setLibelle(?string $libelle): self
    {
        $this->libelle = null === $libelle ? '' : mb_trim(str_replace("\0", '', $libelle));

        return $this;
    }

    public function getDate(): ?\DateTimeImmutable
    {
        return $this->date;
    }

    public function setDate(?\DateTimeImmutable $date): self
    {
        $this->date = $date;

        return $this;
    }

    /** Jour seul (AAAA-MM-JJ). */
    #[Groups(['echeance:read'])]
    #[SerializedName('date')]
    public function getDateJour(): ?string
    {
        return $this->date?->format('Y-m-d');
    }

    /** Lecture stricte : le 30 février est refusé. */
    #[Groups(['echeance:write'])]
    #[SerializedName('date')]
    public function setDateJour(?string $jour): self
    {
        $date = null === $jour ? false : \DateTimeImmutable::createFromFormat('!Y-m-d', $jour);
        $this->dateInvalide = false === $date || $date->format('Y-m-d') !== $jour || (int) $date->format('Y') < 1;
        $this->date = $this->dateInvalide ? null : $date;

        return $this;
    }

    #[Groups(['echeance:read'])]
    public function getAnnee(): ?Annee
    {
        return $this->annee;
    }

    #[Groups(['echeance:write'])]
    public function setAnnee(?Annee $annee): self
    {
        $this->annee = $annee;

        return $this;
    }

    #[Groups(['echeance:read'])]
    public function getGroupe(): ?Groupe
    {
        return $this->groupe;
    }

    #[Groups(['echeance:write'])]
    public function setGroupe(?Groupe $groupe): self
    {
        $this->groupe = $groupe;

        return $this;
    }

    #[Groups(['echeance:read'])]
    public function getEnseignant(): ?Enseignant
    {
        return $this->enseignant;
    }

    public function setEnseignant(?Enseignant $enseignant): self
    {
        $this->enseignant = $enseignant;

        return $this;
    }

    #[Groups(['echeance:read'])]
    public function getDateCreation(): \DateTimeImmutable
    {
        return $this->dateCreation;
    }

    /** Département visé : celui de l'année, ou du groupe (par son semestre). */
    public function getDepartement(): ?Departement
    {
        return ($this->annee ?? $this->groupe?->getSemestre()?->getAnnee())?->getDiplome()?->getDepartement();
    }

    #[Assert\Callback]
    public function valider(ExecutionContextInterface $context): void
    {
        if ('' === $this->libelle) {
            $context->buildViolation('Le libellé est obligatoire.')->atPath('libelle')->addViolation();
        } elseif (intdiv(\strlen((string) mb_convert_encoding($this->libelle, 'UTF-16LE', 'UTF-8')), 2) > 100) {
            $context->buildViolation('Le libellé ne doit pas dépasser 100 caractères.')->atPath('libelle')->addViolation();
        }
        if ($this->dateInvalide || null === $this->date) {
            $context->buildViolation('Saisissez une date valide.')->atPath('date')->addViolation();
        }
        if ((null === $this->annee) === (null === $this->groupe)) {
            $context->buildViolation('Choisissez une année ou un groupe.')->atPath('annee')->addViolation();
        }
    }
}
