<?php

/*
 * Copyright (c) 2023. | Cyndel Herolt | IUT de Troyes  - All Rights Reserved
 * @author cyndelherolt
 * @project UniFolio
 */
namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\QueryParameter;
use App\Enum\ConceptionIaEnum;
use App\Enum\RealisationIaEnum;
use App\Filter\IriExacteFilter;
use App\Repository\TraceRepository;
use App\State\TraceProcessor;
use App\Validator\TraceValide;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Serializer\Attribute\SerializedName;

/**
 * Trace d'un étudiant, au format de shared/types/trace.ts.
 * Un étudiant ne voit que ses traces hors corbeille (App\Doctrine\ProprietaireExtension) : celles des autres répondent 404.
 */
#[ApiResource(
    operations: [
        // ?etudiant=/api/etudiants/1 : traces d'un étudiant (fiche de l'espace enseignant, #41)
        new GetCollection(parameters: ['etudiant' => new QueryParameter(filter: new IriExacteFilter('bibliotheque.etudiant', 'etudiants'))]),
        new Get(),
        new Post(processor: TraceProcessor::class, security: "is_granted('ROLE_ETUDIANT')"),
        new Patch(processor: TraceProcessor::class, security: "is_granted('ROLE_ETUDIANT')"),
        // Suppression douce : la trace part dans la corbeille (dateSuppression), C-09
        new Delete(processor: TraceProcessor::class, security: "is_granted('ROLE_ETUDIANT')"),
    ],
    normalizationContext: ['groups' => ['trace:read']],
    denormalizationContext: ['groups' => ['trace:write']],
    order: ['id' => 'ASC'],
    // Lecture : l'étudiant (ses données) et l'enseignant (ses départements), cf. App\Doctrine\ProprietaireExtension
    security: "is_granted('ROLE_ETUDIANT') or is_granted('ROLE_ENSEIGNANT')",
    // Valeur du mauvais type (titre: 12…) : 422 avec le champ en cause, comme les autres erreurs de saisie
    collectDenormalizationErrors: true,
)]
#[TraceValide]
#[ORM\Entity(repositoryClass: TraceRepository::class)]
class Trace
{
    public const TYPES = ['image', 'pdf', 'video', 'lien'];
    public const STATUTS = ['brouillon', 'finalisee'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeInterface $date_creation = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeInterface $date_modification = null;

    /** Renseignée quand la trace est dans la corbeille. */
    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $date_suppression = null;

    #[ORM\ManyToOne(inversedBy: 'traces')]
    private ?Bibliotheque $bibliotheque = null;

    #[ORM\OneToMany(mappedBy: 'trace', targetEntity: Validation::class, cascade: ['persist', 'remove'])]
    private Collection $validations;

    #[ORM\OneToMany(mappedBy: 'trace', targetEntity: Commentaire::class, cascade: ['persist', 'remove'])]
    private Collection $commentaires;

    /** Une valeur de Trace::TYPES (« type » côté API). */
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $type_trace = null;

    #[ORM\Column(type: Types::JSON, length: 255, nullable: true)]
    private ?array $contenu = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $titre = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(nullable: true)]
    private ?int $ordre = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $legende = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $date_realisation = null;

    /** Date reçue mais impossible à lire (30 février, format inconnu) : signalée par App\Validator\TraceValide. */
    private bool $dateRealisationInvalide = false;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $contexte = null;

    /** Une valeur de ConceptionIaEnum. */
    #[ORM\Column(length: 20)]
    private string $conception_ia = ConceptionIaEnum::NON_RENSEIGNE->value;

    /** Une valeur de RealisationIaEnum. */
    #[ORM\Column(length: 20)]
    private string $realisation_ia = RealisationIaEnum::NON_RENSEIGNE->value;

    /** Une valeur de Trace::STATUTS : un brouillon peut être incomplet (E-TR-05). */
    #[ORM\Column(length: 20, options: ['default' => 'brouillon'])]
    private string $statut = 'brouillon';

    public function __construct()
    {
        $this->date_creation = new \DateTimeImmutable();
        $this->date_modification = null;
        $this->validations = new ArrayCollection();
        $this->commentaires = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    #[Groups(['trace:read'])]
    public function getDateCreation(): \DateTimeImmutable
    {
        return $this->date_creation;
    }

    public function setDateCreation(?\DateTimeInterface $date_creation): self
    {
        $this->date_creation = $date_creation;

        return $this;
    }

    #[Groups(['trace:read'])]
    public function getDateModification(): ?\DateTimeInterface
    {
        return $this->date_modification;
    }

    public function setDateModification(?\DateTimeInterface $date_modification): self
    {
        $this->date_modification = $date_modification;

        return $this;
    }

    #[Groups(['trace:read'])]
    public function getDateSuppression(): ?\DateTimeImmutable
    {
        return $this->date_suppression;
    }

    public function setDateSuppression(?\DateTimeImmutable $date_suppression): self
    {
        $this->date_suppression = $date_suppression;

        return $this;
    }

    #[Groups(['trace:read'])]
    public function getBibliotheque(): ?Bibliotheque
    {
        return $this->bibliotheque;
    }

    /** Auteur de la trace, sans passer par sa bibliothèque (file d'évaluations, #41). */
    #[Groups(['trace:read'])]
    public function getEtudiant(): ?Etudiant
    {
        return $this->bibliotheque?->getEtudiant();
    }

    public function setBibliotheque(?Bibliotheque $bibliotheque): self
    {
        $this->bibliotheque = $bibliotheque;

        $bibliotheque?->addTrace($this);

        return $this;
    }

    /**
     * @return Collection<int, Validation>
     */
    public function getValidations(): Collection
    {
        return $this->validations;
    }

    public function addValidation(Validation $validation): self
    {
        if (!$this->validations->contains($validation)) {
            $this->validations->add($validation);
            $validation->setTrace($this);
        }

        return $this;
    }

    public function removeValidation(Validation $validation): self
    {
        if ($this->validations->removeElement($validation)) {
            // set the owning side to null (unless already changed)
            if ($validation->getTrace() === $this) {
                $validation->setTrace(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Commentaire>
     */
    public function getCommentaires(): Collection
    {
        return $this->commentaires;
    }

    public function addCommentaire(Commentaire $commentaire): self
    {
        if (!$this->commentaires->contains($commentaire)) {
            $this->commentaires->add($commentaire);
            $commentaire->setTrace($this);
        }

        return $this;
    }

    public function removeCommentaire(Commentaire $commentaire): self
    {
        if ($this->commentaires->removeElement($commentaire)) {
            // set the owning side to null (unless already changed)
            if ($commentaire->getTrace() === $this) {
                $commentaire->setTrace(null);
            }
        }

        return $this;
    }

    #[Groups(['trace:read', 'portfolio:public'])]
    #[SerializedName('type')]
    public function getTypeTrace(): ?string
    {
        return $this->type_trace;
    }

    #[Groups(['trace:write'])]
    #[SerializedName('type')]
    public function setTypeTrace(?string $type_trace): self
    {
        $this->type_trace = $type_trace;

        return $this;
    }

    /** @return string[] */
    #[Groups(['trace:read', 'portfolio:public'])]
    public function getContenu(): array
    {
        return $this->contenu ?? [];
    }

    /** Adresses ou fichiers, sans espaces autour ni entrée vide (comme le formulaire du front). */
    #[Groups(['trace:write'])]
    public function setContenu(?array $contenu): self
    {
        $items = array_map(static fn (mixed $item): string => \is_string($item) ? self::nettoyer($item) : '', $contenu ?? []);
        $this->contenu = array_values(array_filter($items, static fn (string $item): bool => '' !== $item));

        return $this;
    }

    #[Groups(['trace:read', 'portfolio:public'])]
    public function getTitre(): ?string
    {
        return $this->titre;
    }

    #[Groups(['trace:write'])]
    public function setTitre(?string $titre): self
    {
        $this->titre = null === $titre ? null : self::nettoyer($titre);

        return $this;
    }

    #[Groups(['trace:read', 'portfolio:public'])]
    public function getDescription(): ?string
    {
        return $this->description;
    }

    #[Groups(['trace:write'])]
    public function setDescription(?string $description): self
    {
        $this->description = self::texteOptionnel($description);

        return $this;
    }

    public function getOrdre(): ?int
    {
        return $this->ordre;
    }

    public function setOrdre(?int $ordre): self
    {
        $this->ordre = $ordre;

        return $this;
    }

    #[Groups(['trace:read', 'portfolio:public'])]
    public function getLegende(): ?string
    {
        return $this->legende;
    }

    #[Groups(['trace:write'])]
    public function setLegende(?string $legende): static
    {
        $this->legende = self::texteOptionnel($legende);

        return $this;
    }

    public function getDateRealisation(): ?\DateTimeInterface
    {
        return $this->date_realisation;
    }

    public function setDateRealisation(?\DateTimeInterface $date_realisation): static
    {
        $this->date_realisation = $date_realisation;
        $this->dateRealisationInvalide = false;

        return $this;
    }

    /** Jour seul (AAAA-MM-JJ), comme le champ date du formulaire. */
    #[Groups(['trace:read', 'portfolio:public'])]
    #[SerializedName('dateRealisation')]
    public function getDateRealisationJour(): ?string
    {
        return $this->date_realisation?->format('Y-m-d');
    }

    /** Lecture stricte : le 30 février est refusé (le parseur de PHP le changerait en 2 mars). */
    #[Groups(['trace:write'])]
    #[SerializedName('dateRealisation')]
    public function setDateRealisationJour(?string $jour): static
    {
        $jour = self::texteOptionnel($jour);
        $date = null === $jour ? null : \DateTime::createFromFormat('!Y-m-d', $jour);
        // L'an 0 n'existe pas pour PostgreSQL (erreur 500 sinon)
        $valide = null === $jour || (false !== $date && $date->format('Y-m-d') === $jour && (int) $date->format('Y') >= 1);
        $this->setDateRealisation($valide ? $date : null);
        $this->dateRealisationInvalide = !$valide;

        return $this;
    }

    public function isDateRealisationInvalide(): bool
    {
        return $this->dateRealisationInvalide;
    }

    #[Groups(['trace:read', 'portfolio:public'])]
    public function getContexte(): ?string
    {
        return $this->contexte;
    }

    #[Groups(['trace:write'])]
    public function setContexte(?string $contexte): static
    {
        $this->contexte = self::texteOptionnel($contexte);

        return $this;
    }

    #[Groups(['trace:read'])]
    public function getConceptionIa(): string
    {
        return $this->conception_ia;
    }

    /** Valeur de ConceptionIaEnum ; absente ou nulle = non renseigné. */
    #[Groups(['trace:write'])]
    public function setConceptionIa(?string $conception_ia): void
    {
        $this->conception_ia = $conception_ia ?? ConceptionIaEnum::NON_RENSEIGNE->value;
    }

    #[Groups(['trace:read'])]
    public function getRealisationIa(): string
    {
        return $this->realisation_ia;
    }

    /** Valeur de RealisationIaEnum ; absente ou nulle = non renseigné. */
    #[Groups(['trace:write'])]
    public function setRealisationIa(?string $realisation_ia): void
    {
        $this->realisation_ia = $realisation_ia ?? RealisationIaEnum::NON_RENSEIGNE->value;
    }

    #[Groups(['trace:read'])]
    public function getStatut(): string
    {
        return $this->statut;
    }

    #[Groups(['trace:write'])]
    public function setStatut(?string $statut): self
    {
        $this->statut = $statut ?? '';

        return $this;
    }

    /** Texte facultatif : sans espaces autour, null s'il est vide. */
    private static function texteOptionnel(?string $texte): ?string
    {
        $texte = null === $texte ? null : self::nettoyer($texte);

        return '' === $texte ? null : $texte;
    }

    /**
     * Espaces Unicode retirés autour (mb_trim, proche de trim() de JavaScript : espace insécable compris), et caractère NUL
     * supprimé : PostgreSQL tronquerait le texte en silence.
     */
    private static function nettoyer(string $texte): string
    {
        return mb_trim(str_replace("\0", '', $texte));
    }
}
