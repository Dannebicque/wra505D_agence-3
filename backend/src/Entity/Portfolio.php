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
use App\Repository\PortfolioRepository;
use App\State\PortfolioProcessor;
use App\State\PortfolioPublicProvider;
use App\Validator\PortfolioValide;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Serializer\Attribute\SerializedName;

/**
 * Portfolio d'un étudiant, au format de shared/types/portfolio.ts : un par année (E-PF-10).
 * Public (`visibilite: publique`), il se lit sans connexion à /api/portfolios/{id}/public (E-PF-06).
 * L'étudiant ne voit que ses portfolios hors corbeille (App\Doctrine\ProprietaireExtension).
 */
#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
        new Post(processor: PortfolioProcessor::class),
        new Patch(processor: PortfolioProcessor::class, denormalizationContext: ['groups' => ['portfolio:write', 'portfolio:ordre']]),
        new Delete(processor: PortfolioProcessor::class),
        new Get(
            uriTemplate: '/portfolios/{id}/public',
            provider: PortfolioPublicProvider::class,
            normalizationContext: ['groups' => ['portfolio:public']],
            security: 'true',
            name: 'portfolio_public',
        ),
    ],
    normalizationContext: ['groups' => ['portfolio:read']],
    denormalizationContext: ['groups' => ['portfolio:write']],
    order: ['id' => 'ASC'],
    security: "is_granted('ROLE_ETUDIANT')",
    collectDenormalizationErrors: true,
)]
#[PortfolioValide]
#[ORM\Entity(repositoryClass: PortfolioRepository::class)]
// Un portfolio par étudiant et par année, hors corbeille
#[ORM\UniqueConstraint(name: 'portfolio_unique_par_annee', fields: ['etudiant', 'annee'], options: ['where' => '(date_suppression IS NULL)'])]
class Portfolio
{
    public const VISIBILITES = ['publique', 'privee'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $date_creation = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $date_modification = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $date_suppression = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $intitule = null;

    /** @var Collection<int, Page> */
    #[ORM\OneToMany(mappedBy: 'portfolio', targetEntity: Page::class)]
    #[ORM\OrderBy(['ordre' => \SortDirection::Ascending, 'id' => \SortDirection::Ascending])]
    private Collection $pages;

    #[ORM\ManyToOne(inversedBy: 'portfolios')]
    private ?Etudiant $etudiant = null;

    #[ORM\OneToMany(mappedBy: 'portfolio', targetEntity: Commentaire::class, cascade: ['persist', 'remove'])]
    private Collection $commentaires;

    /** true = public (lien public actif), false = privé. */
    #[ORM\Column]
    private ?bool $visibilite = false;

    /** Valeur reçue hors de VISIBILITES, signalée par App\Validator\PortfolioValide. */
    private ?string $visibiliteInvalide = null;

    /** IRI d'une image déposée par l'étudiant (/api/fichiers/<uuid>), ou null. */
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $banniere = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\ManyToOne(inversedBy: 'portfolio')]
    private ?Annee $annee = null;

    #[ORM\ManyToOne(inversedBy: 'portfolio')]
    private ?Cv $cv = null;

    /** Visible par les recruteurs. */
    #[ORM\Column]
    private ?bool $opt_search = false;

    /** Ordre de pages envoyé par l'étudiant, contrôlé par App\Validator\PortfolioValide. */
    private ?array $pagesDemandees = null;

    public function __construct()
    {
        $this->pages = new ArrayCollection();
        $this->commentaires = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    #[Groups(['portfolio:read'])]
    public function getDateCreation(): ?\DateTimeInterface
    {
        return $this->date_creation;
    }

    public function setDateCreation(?\DateTimeInterface $date_creation): self
    {
        $this->date_creation = $date_creation;

        return $this;
    }

    #[Groups(['portfolio:read'])]
    public function getDateModification(): ?\DateTimeInterface
    {
        return $this->date_modification;
    }

    public function setDateModification(?\DateTimeInterface $date_modification): self
    {
        $this->date_modification = $date_modification;

        return $this;
    }

    #[Groups(['portfolio:read'])]
    public function getDateSuppression(): ?\DateTimeImmutable
    {
        return $this->date_suppression;
    }

    public function setDateSuppression(?\DateTimeImmutable $date_suppression): self
    {
        $this->date_suppression = $date_suppression;

        return $this;
    }

    #[Groups(['portfolio:read', 'portfolio:public'])]
    public function getIntitule(): ?string
    {
        return $this->intitule;
    }

    #[Groups(['portfolio:write'])]
    public function setIntitule(?string $intitule): self
    {
        $this->intitule = null === $intitule ? null : mb_trim($intitule);

        return $this;
    }

    /**
     * Pages hors corbeille, dans l'ordre d'affichage.
     *
     * @return list<Page>
     */
    #[Groups(['portfolio:read', 'portfolio:public'])]
    #[SerializedName('pages')]
    public function getPagesVisibles(): array
    {
        return array_values($this->pages->filter(static fn (Page $page): bool => null === $page->getDateSuppression())->toArray());
    }

    /**
     * Nouvel ordre des pages : appliqué tel quel, puis contrôlé (il doit reprendre exactement les pages).
     *
     * @param list<Page> $pages
     */
    #[Groups(['portfolio:ordre'])]
    #[SerializedName('pages')]
    public function setPagesVisibles(array $pages): self
    {
        $this->pagesDemandees = $pages;
        foreach (array_values($pages) as $rang => $page) {
            $page->setOrdre($rang + 1);
        }

        return $this;
    }

    public function getPagesDemandees(): ?array
    {
        return $this->pagesDemandees;
    }

    /** @return Collection<int, Page> */
    public function getPages(): Collection
    {
        return $this->pages;
    }

    public function addPage(Page $page): self
    {
        if (!$this->pages->contains($page)) {
            $this->pages->add($page);
            $page->setPortfolio($this);
        }

        return $this;
    }

    #[Groups(['portfolio:read', 'portfolio:public'])]
    public function getEtudiant(): ?Etudiant
    {
        return $this->etudiant;
    }

    public function setEtudiant(?Etudiant $etudiant): self
    {
        $this->etudiant = $etudiant;

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
            $commentaire->setPortfolio($this);
        }

        return $this;
    }

    public function removeCommentaire(Commentaire $commentaire): self
    {
        if ($this->commentaires->removeElement($commentaire)) {
            // set the owning side to null (unless already changed)
            if ($commentaire->getPortfolio() === $this) {
                $commentaire->setPortfolio(null);
            }
        }

        return $this;
    }

    public function isVisibilite(): ?bool
    {
        return $this->visibilite;
    }

    public function setVisibilite(bool $visibilite): self
    {
        $this->visibilite = $visibilite;

        return $this;
    }

    public function getVisibilite(): ?bool
    {
        return $this->visibilite;
    }

    #[Groups(['portfolio:read'])]
    #[SerializedName('visibilite')]
    public function getVisibiliteApi(): string
    {
        return $this->visibilite ? 'publique' : 'privee';
    }

    #[Groups(['portfolio:write'])]
    #[SerializedName('visibilite')]
    public function setVisibiliteApi(?string $visibilite): self
    {
        $this->visibiliteInvalide = \in_array($visibilite, self::VISIBILITES, true) ? null : (string) $visibilite;
        if (null === $this->visibiliteInvalide) {
            $this->visibilite = 'publique' === $visibilite;
        }

        return $this;
    }

    public function getVisibiliteInvalide(): ?string
    {
        return $this->visibiliteInvalide;
    }

    #[Groups(['portfolio:read', 'portfolio:public'])]
    public function getBanniere(): ?string
    {
        return $this->banniere;
    }

    #[Groups(['portfolio:write'])]
    public function setBanniere(?string $banniere): self
    {
        $banniere = null === $banniere ? null : mb_trim($banniere);
        $this->banniere = '' === $banniere ? null : $banniere;

        return $this;
    }

    #[Groups(['portfolio:read', 'portfolio:public'])]
    public function getDescription(): ?string
    {
        return $this->description;
    }

    #[Groups(['portfolio:write'])]
    public function setDescription(?string $description): static
    {
        $description = null === $description ? null : mb_trim($description);
        $this->description = '' === $description ? null : $description;

        return $this;
    }

    #[Groups(['portfolio:read'])]
    public function getAnnee(): ?Annee
    {
        return $this->annee;
    }

    public function setAnnee(?Annee $annee): void
    {
        $this->annee = $annee;
    }

    public function getCv(): ?Cv
    {
        return $this->cv;
    }

    public function setCv(?Cv $cv): static
    {
        $this->cv = $cv;

        return $this;
    }

    public function isOptSearch(): ?bool
    {
        return $this->opt_search;
    }

    public function setOptSearch(bool $opt_search): static
    {
        $this->opt_search = $opt_search;

        return $this;
    }

    #[Groups(['portfolio:read'])]
    #[SerializedName('visibleRecruteurs')]
    public function isVisibleRecruteurs(): bool
    {
        return (bool) $this->opt_search;
    }

    #[Groups(['portfolio:write'])]
    #[SerializedName('visibleRecruteurs')]
    public function setVisibleRecruteurs(bool $visible): self
    {
        $this->opt_search = $visible;

        return $this;
    }
}
