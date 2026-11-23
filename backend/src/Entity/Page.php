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
use App\Filter\PortfolioDeLaPageFilter;
use App\Repository\PageRepository;
use App\State\PageProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Serializer\Attribute\SerializedName;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

/**
 * Page-projet d'un portfolio, au format de shared/types/portfolio.ts. Elle appartient à un seul portfolio,
 * y a sa place (`ordre`) et range ses traces dans l'ordre (OrdreTrace). Règles de shared/utils/page-validation.ts
 * et server/utils/page-rules.ts du front. Un étudiant ne voit que ses pages (App\Doctrine\ProprietaireExtension).
 */
#[ApiResource(
    operations: [
        // ?portfolio=/api/portfolios/1 : pages d'un portfolio (app/services/portfolio.ts)
        new GetCollection(parameters: ['portfolio' => new QueryParameter(filter: new PortfolioDeLaPageFilter())]),
        new Get(),
        new Post(processor: PageProcessor::class, denormalizationContext: ['groups' => ['page:write', 'page:creation']], security: "is_granted('ROLE_ETUDIANT')"),
        new Patch(processor: PageProcessor::class, denormalizationContext: ['groups' => ['page:write', 'page:traces']], security: "is_granted('ROLE_ETUDIANT')"),
        // Corbeille : ses traces restent dans la bibliothèque
        new Delete(processor: PageProcessor::class, security: "is_granted('ROLE_ETUDIANT')"),
    ],
    normalizationContext: ['groups' => ['page:read']],
    order: ['ordre' => 'ASC', 'id' => 'ASC'],
    // Lecture : l'étudiant (ses données) et l'enseignant (ses départements), cf. App\Doctrine\ProprietaireExtension
    security: "is_granted('ROLE_ETUDIANT') or is_granted('ROLE_ENSEIGNANT')",
    collectDenormalizationErrors: true,
)]
#[ORM\Entity(repositoryClass: PageRepository::class)]
class Page
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /** Place de la page dans son portfolio. */
    #[ORM\Column(nullable: true)]
    private ?int $ordre = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $intitule = null;

    #[ORM\ManyToOne(inversedBy: 'pages')]
    private ?Templates $templates = null;

    #[ORM\ManyToOne(inversedBy: 'pages')]
    #[ORM\JoinColumn(onDelete: 'CASCADE')]
    private ?Portfolio $portfolio = null;

    /** @var Collection<int, OrdreTrace> */
    #[ORM\OneToMany(mappedBy: 'page', targetEntity: OrdreTrace::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['ordre' => \SortDirection::Ascending])]
    private Collection $ordreTraces;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $date_suppression = null;

    /** Liste envoyée par l'étudiant (doublons compris) et traces déjà présentes, pour App\Entity\Page::valider(). */
    private ?array $tracesDemandees = null;
    private array $tracesAvant = [];

    public function __construct()
    {
        $this->ordreTraces = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
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

    #[Groups(['page:read', 'portfolio:public'])]
    public function getIntitule(): ?string
    {
        return $this->intitule;
    }

    #[Groups(['page:write'])]
    public function setIntitule(?string $intitule): self
    {
        $this->intitule = null === $intitule ? null : mb_trim($intitule);

        return $this;
    }

    #[Groups(['page:read', 'portfolio:public'])]
    public function getDescription(): ?string
    {
        return $this->description;
    }

    #[Groups(['page:write'])]
    public function setDescription(?string $description): static
    {
        $description = null === $description ? null : mb_trim($description);
        $this->description = '' === $description ? null : $description;

        return $this;
    }

    public function getTemplates(): ?Templates
    {
        return $this->templates;
    }

    public function setTemplates(?Templates $templates): self
    {
        $this->templates = $templates;

        return $this;
    }

    #[Groups(['page:read'])]
    public function getPortfolio(): ?Portfolio
    {
        return $this->portfolio;
    }

    /** Fixé à la création ; ensuite la page ne change pas de portfolio. */
    #[Groups(['page:creation'])]
    public function setPortfolio(?Portfolio $portfolio): self
    {
        $this->portfolio = $portfolio;

        return $this;
    }

    /** @return Collection<int, OrdreTrace> */
    public function getOrdreTraces(): Collection
    {
        return $this->ordreTraces;
    }

    /**
     * Traces visibles, dans l'ordre : une trace mise à la corbeille est masquée mais garde sa place,
     * pour revenir si elle est restaurée.
     *
     * @return list<Trace>
     */
    #[Groups(['page:read'])]
    public function getTraces(): array
    {
        $traces = [];
        foreach ($this->ordreTraces as $lien) {
            if (null === $lien->getTrace()?->getDateSuppression()) {
                $traces[] = $lien->getTrace();
            }
        }

        return $traces;
    }

    /**
     * Version publique : seules les traces finalisées (une trace repassée en brouillon ne s'affiche plus).
     *
     * @return list<Trace>
     */
    #[Groups(['portfolio:public'])]
    #[SerializedName('traces')]
    public function getTracesPubliques(): array
    {
        return array_values(array_filter($this->getTraces(), static fn (Trace $trace): bool => 'finalisee' === $trace->getStatut()));
    }

    /**
     * Nouvel ordre des traces visibles. Une trace de la corbeille garde son rang parmi les autres : chaque place
     * ancienne est reprise par la trace visible suivante de la nouvelle liste, sauf celles de la corbeille.
     *
     * @param list<Trace> $traces
     */
    #[Groups(['page:traces'])]
    public function setTraces(array $traces): self
    {
        $this->tracesAvant = $this->getTraces();
        $this->tracesDemandees = $traces;
        $liens = [];
        foreach ($this->ordreTraces as $lien) {
            $liens[spl_object_id($lien->getTrace())] = $lien;
        }
        $visibles = [];
        foreach ($traces as $trace) {
            $visibles[spl_object_id($trace)] ??= $liens[spl_object_id($trace)] ?? (new OrdreTrace())->setPage($this)->setTrace($trace);
        }
        $visibles = array_values($visibles);

        $ordre = 0;
        $gardes = [];
        foreach ($this->ordreTraces as $lien) {
            $gardes[] = null !== $lien->getTrace()?->getDateSuppression() ? $lien : array_shift($visibles);
        }
        $gardes = array_filter([...$gardes, ...$visibles]);
        foreach ($gardes as $lien) {
            $lien->setOrdre(++$ordre);
        }
        foreach ($this->ordreTraces as $lien) {
            if (!\in_array($lien, $gardes, true)) {
                $this->ordreTraces->removeElement($lien);
            }
        }
        foreach ($gardes as $lien) {
            if (!$this->ordreTraces->contains($lien)) {
                $this->ordreTraces->add($lien);
            }
        }

        return $this;
    }

    #[Groups(['page:read'])]
    public function getDateSuppression(): ?\DateTimeImmutable
    {
        return $this->date_suppression;
    }

    public function setDateSuppression(?\DateTimeImmutable $date_suppression): self
    {
        $this->date_suppression = $date_suppression;

        return $this;
    }

    /** Mêmes règles et messages que validatePage() et checkPageTraces() du front. */
    #[Assert\Callback]
    public function valider(ExecutionContextInterface $context): void
    {
        $echec = static fn (string $champ, string $message) => $context->buildViolation($message)->atPath($champ)->addViolation();

        $intitule = $this->intitule ?? '';
        if ('' === $intitule) {
            $echec('intitule', 'L’intitulé est obligatoire.');
        } elseif (self::longueur($intitule) > 100) {
            $echec('intitule', 'L’intitulé ne doit pas dépasser 100 caractères.');
        }
        if (self::longueur($this->description ?? '') > 500) {
            $echec('description', 'La description ne doit pas dépasser 500 caractères.');
        }
        if (null === $this->portfolio || null !== $this->portfolio->getDateSuppression()) {
            $echec('portfolio', 'Portfolio introuvable.');

            return;
        }
        if (null === $this->tracesDemandees) {
            return;
        }

        if (\count(array_unique(array_map(spl_object_id(...), $this->tracesDemandees))) !== \count($this->tracesDemandees)) {
            $echec('traces', 'Une trace ne peut figurer qu’une fois dans la page.');

            return;
        }
        // Une trace ajoutée doit être finalisée et absente des autres pages (E-TR-06, réutiliser une trace, retirée) ;
        // une trace déjà présente reste, même repassée en brouillon depuis
        $ailleurs = [];
        foreach ($this->portfolio->getPagesVisibles() as $page) {
            if ($page !== $this) {
                array_push($ailleurs, ...$page->getTraces());
            }
        }
        foreach ($this->tracesDemandees as $trace) {
            if (\in_array($trace, $this->tracesAvant, true)) {
                continue;
            }
            if ('finalisee' !== $trace->getStatut()) {
                $echec('traces', 'Seule une trace finalisée peut être ajoutée à une page.');

                return;
            }
            if (\in_array($trace, $ailleurs, true)) {
                $echec('traces', sprintf('« %s » est déjà dans une autre page de ce portfolio.', $trace->getTitre()));

                return;
            }
        }
    }

    /** Longueur comptée comme `.length` en JavaScript (unités UTF-16). */
    private static function longueur(string $texte): int
    {
        return intdiv(\strlen((string) mb_convert_encoding($texte, 'UTF-16LE', 'UTF-8')), 2);
    }
}
