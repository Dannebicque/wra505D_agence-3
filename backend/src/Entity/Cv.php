<?php

/*
 * Copyright (c) 2023. | Cyndel Herolt | IUT de Troyes  - All Rights Reserved
 * @author cyndelherolt
 * @project UniFolio
 */
namespace App\Entity;

use App\Repository\CvRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\State\CvProcessor;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Serializer\Attribute\SerializedName;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

/**
 * CV de l'étudiant (E-CV-01, E-CV-05, E-CV-06), au format CV_DEMO du front (app/demo/etudiant.ts) : titre,
 * coordonnées, une accroche par candidature (stage, alternance), expériences, formations, langues, compétences.
 * Un CV par étudiant, lisible par lui seul ; le PDF (E-CV-03) est fait par le navigateur (décision du PO).
 * Les anciennes relations Experience et Formation de la version précédente ne sont pas exposées.
 */
#[ApiResource(
    shortName: 'Cv',
    operations: [
        new GetCollection(),
        new Get(),
        new Post(processor: CvProcessor::class),
        new Patch(processor: CvProcessor::class),
    ],
    normalizationContext: ['groups' => ['cv:read']],
    denormalizationContext: ['groups' => ['cv:write']],
    security: "is_granted('ROLE_ETUDIANT')",
    collectDenormalizationErrors: true,
)]
#[ORM\Entity(repositoryClass: CvRepository::class)]
// Un CV par étudiant (le processeur le dit aussi ; l'index arrête deux créations simultanées)
#[ORM\UniqueConstraint(name: 'cv_unique_par_etudiant', fields: ['etudiant'])]
class Cv
{
    public const NIVEAUX_LANGUE = ['A1 : débutant', 'A2 : élémentaire', 'B1 : intermédiaire', 'B2 : avancé', 'C1 : autonome', 'C2 : maîtrise', 'Langue maternelle'];
    public const VARIANTES = ['stage', 'alternance'];

    /** Champs de chaque liste : nom => [longueur maximale, obligatoire] ; nombre maximal d'éléments. */
    private const LISTES = [
        'experiences' => ['max' => 20, 'champs' => ['poste' => [100, true], 'structure' => [100, false], 'periode' => [50, false], 'description' => [1000, false]]],
        'formations' => ['max' => 20, 'champs' => ['diplome' => [150, true], 'etablissement' => [150, false], 'periode' => [50, false]]],
        'langues' => ['max' => 10, 'champs' => ['langue' => [50, true], 'niveau' => [50, true]]],
    ];

    #[ORM\Column(length: 180, nullable: true)]
    private ?string $email = null;

    #[ORM\Column(length: 30, nullable: true)]
    private ?string $telephone = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $ville = null;

    /** @var array<string, string> accroche par variante de candidature */
    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $accroches = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $experiencesCv = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $formationsCv = null;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeInterface $date_creation = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeInterface $date_modification = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $intitule = null;

    #[ORM\ManyToOne(inversedBy: 'cvs')]
    private ?Etudiant $etudiant = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $langues = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $soft_skills = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $hard_skills = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $reseaux = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $poste = null;

    #[ORM\ManyToMany(targetEntity: Experience::class, inversedBy: 'cvs', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $experience;

    #[ORM\ManyToMany(targetEntity: Formation::class, inversedBy: 'cvs', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $formation;

    #[ORM\OneToMany(mappedBy: 'cv', targetEntity: Portfolio::class)]
    private Collection $portfolio;

    public function __construct()
    {
        $this->experience = new ArrayCollection();
        $this->formation = new ArrayCollection();
        $this->portfolio = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDateCreation(): ?\DateTimeInterface
    {
        return $this->date_creation;
    }

    public function setDateCreation(?\DateTimeInterface $date_creation): self
    {
        $this->date_creation = $date_creation;

        return $this;
    }

    public function getDateModification(): ?\DateTimeInterface
    {
        return $this->date_modification;
    }

    public function setDateModification(?\DateTimeInterface $date_modification): self
    {
        $this->date_modification = $date_modification;

        return $this;
    }

    public function getIntitule(): ?string
    {
        return $this->intitule;
    }

    public function setIntitule(?string $intitule): self
    {
        $this->intitule = $intitule;

        return $this;
    }

    public function getEtudiant(): ?Etudiant
    {
        return $this->etudiant;
    }

    public function setEtudiant(?Etudiant $etudiant): self
    {
        $this->etudiant = $etudiant;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;

        return $this;
    }

    public function getSoftSkills(): array
    {
        return $this->soft_skills;
    }

    public function setSoftSkills(?array $soft_skills): self
    {
        $this->soft_skills = $soft_skills;

        return $this;
    }

    public function getHardSkills(): array
    {
        return $this->hard_skills;
    }

    public function setHardSkills(?array $hard_skills): self
    {
        $this->hard_skills = $hard_skills;

        return $this;
    }

    public function getLangues(): ?array
    {
        return $this->langues;
    }

    public function setLangues(?array $langues): self
    {
        $this->langues = $langues;

        return $this;
    }

    public function getReseaux(): ?array
    {
        return $this->reseaux;
    }

    public function setReseaux(?array $reseaux): self
    {
        $this->reseaux = $reseaux;

        return $this;
    }

    public function getPoste(): ?string
    {
        return $this->poste;
    }

    public function setPoste(?string $poste): self
    {
        $this->poste = $poste;

        return $this;
    }

    /**
     * @return Collection<int, Experience>
     */
    public function getExperience(): Collection
    {
        return $this->experience;
    }

    public function addExperience(Experience $experience): self
    {
        if (!$this->experience->contains($experience)) {
            $this->experience->add($experience);
        }

        return $this;
    }

    public function removeExperience(Experience $experience): self
    {
        $this->experience->removeElement($experience);

        return $this;
    }

    /**
     * @return Collection<int, Formation>
     */
    public function getFormation(): Collection
    {
        return $this->formation;
    }

    public function addFormation(Formation $formation): self
    {
        if (!$this->formation->contains($formation)) {
            $this->formation->add($formation);
        }

        return $this;
    }

    public function removeFormation(Formation $formation): self
    {
        $this->formation->removeElement($formation);

        return $this;
    }

    /**
     * @return Collection<int, Portfolio>
     */
    public function getPortfolio(): Collection
    {
        return $this->portfolio;
    }

    public function addPortfolio(Portfolio $portfolio): static
    {
        if (!$this->portfolio->contains($portfolio)) {
            $this->portfolio->add($portfolio);
            $portfolio->setCv($this);
        }

        return $this;
    }

    public function removePortfolio(Portfolio $portfolio): static
    {
        if ($this->portfolio->removeElement($portfolio)) {
            // set the owning side to null (unless already changed)
            if ($portfolio->getCv() === $this) {
                $portfolio->setCv(null);
            }
        }

        return $this;
    }

    // ------------------------------------------------------------------------------------------
    // Champs du CV exposés par l'API (format du front)
    // ------------------------------------------------------------------------------------------

    #[Groups(['cv:read'])]
    public function getPrenom(): ?string
    {
        return $this->etudiant?->getPrenom();
    }

    #[Groups(['cv:read'])]
    public function getNom(): ?string
    {
        return $this->etudiant?->getNom();
    }

    #[Groups(['cv:read'])]
    #[SerializedName('titre')]
    public function getTitre(): ?string
    {
        return $this->poste;
    }

    #[Groups(['cv:write'])]
    #[SerializedName('titre')]
    public function setTitre(?string $titre): self
    {
        $this->poste = self::texte($titre);

        return $this;
    }

    #[Groups(['cv:read'])]
    public function getEmail(): ?string
    {
        return $this->email;
    }

    #[Groups(['cv:write'])]
    public function setEmail(?string $email): self
    {
        $this->email = self::texte($email);

        return $this;
    }

    #[Groups(['cv:read'])]
    public function getTelephone(): ?string
    {
        return $this->telephone;
    }

    #[Groups(['cv:write'])]
    public function setTelephone(?string $telephone): self
    {
        $this->telephone = self::texte($telephone);

        return $this;
    }

    #[Groups(['cv:read'])]
    public function getVille(): ?string
    {
        return $this->ville;
    }

    #[Groups(['cv:write'])]
    public function setVille(?string $ville): self
    {
        $this->ville = self::texte($ville);

        return $this;
    }

    /** @return array{stage: string, alternance: string} */
    #[Groups(['cv:read'])]
    public function getAccroches(): array
    {
        return array_combine(self::VARIANTES, array_map(fn (string $v) => $this->accroches[$v] ?? '', self::VARIANTES));
    }

    /** Seules les variantes connues sont gardées. */
    #[Groups(['cv:write'])]
    public function setAccroches(array $accroches): self
    {
        foreach (self::VARIANTES as $variante) {
            $this->accroches[$variante] = \is_string($accroches[$variante] ?? null) ? (self::texte($accroches[$variante]) ?? '') : ($this->accroches[$variante] ?? '');
        }

        return $this;
    }

    #[Groups(['cv:read'])]
    #[SerializedName('experiences')]
    public function getExperiencesCv(): array
    {
        return self::numerote($this->experiencesCv ?? []);
    }

    #[Groups(['cv:write'])]
    #[SerializedName('experiences')]
    public function setExperiencesCv(array $experiences): self
    {
        $this->experiencesCv = self::liste($experiences, 'experiences');

        return $this;
    }

    #[Groups(['cv:read'])]
    #[SerializedName('formations')]
    public function getFormationsCv(): array
    {
        return self::numerote($this->formationsCv ?? []);
    }

    #[Groups(['cv:write'])]
    #[SerializedName('formations')]
    public function setFormationsCv(array $formations): self
    {
        $this->formationsCv = self::liste($formations, 'formations');

        return $this;
    }

    #[Groups(['cv:read'])]
    #[SerializedName('langues')]
    public function getLanguesCv(): array
    {
        return self::numerote($this->langues ?? []);
    }

    #[Groups(['cv:write'])]
    #[SerializedName('langues')]
    public function setLanguesCv(array $langues): self
    {
        $this->langues = self::liste($langues, 'langues');

        return $this;
    }

    /** @return list<string> */
    #[Groups(['cv:read'])]
    #[SerializedName('competences')]
    public function getCompetencesCv(): array
    {
        return array_values($this->hard_skills ?? []);
    }

    #[Groups(['cv:write'])]
    #[SerializedName('competences')]
    public function setCompetencesCv(array $competences): self
    {
        $this->hard_skills = array_values(array_filter(array_map(static fn ($c) => \is_string($c) ? (self::texte($c) ?? '') : '', $competences), static fn (string $c) => '' !== $c));

        return $this;
    }

    #[Groups(['cv:read'])]
    #[SerializedName('dateModification')]
    public function getDateModificationCv(): ?\DateTimeInterface
    {
        return $this->date_modification;
    }

    #[Assert\Callback]
    public function valider(ExecutionContextInterface $context): void
    {
        $echec = static fn (string $champ, string $message) => $context->buildViolation($message)->atPath($champ)->addViolation();
        foreach (['titre' => [$this->poste, 100], 'telephone' => [$this->telephone, 30], 'ville' => [$this->ville, 100]] as $champ => [$valeur, $max]) {
            if (self::longueur($valeur ?? '') > $max) {
                $echec($champ, sprintf('Ce champ ne doit pas dépasser %d caractères.', $max));
            }
        }
        if (null !== $this->email && (self::longueur($this->email) > 180 || false === filter_var($this->email, \FILTER_VALIDATE_EMAIL))) {
            $echec('email', 'Saisissez une adresse électronique valide.');
        }
        if (null !== $this->telephone && !preg_match('/^\+?[0-9 .()-]{6,30}$/', $this->telephone)) {
            $echec('telephone', 'Saisissez un numéro de téléphone valide.');
        }
        foreach ($this->getAccroches() as $variante => $accroche) {
            if (self::longueur($accroche) > 600) {
                $echec("accroches.$variante", 'L’accroche ne doit pas dépasser 600 caractères.');
            }
        }
        foreach (['experiences' => $this->experiencesCv, 'formations' => $this->formationsCv, 'langues' => $this->langues] as $nom => $elements) {
            $regles = self::LISTES[$nom];
            if (\count($elements ?? []) > $regles['max']) {
                $echec($nom, sprintf('%d éléments au plus.', $regles['max']));
                continue;
            }
            foreach ($elements ?? [] as $i => $element) {
                foreach ($regles['champs'] as $champ => [$max, $obligatoire]) {
                    $valeur = $element[$champ] ?? '';
                    if ($obligatoire && '' === $valeur) {
                        $echec("{$nom}[$i].$champ", 'Ce champ est obligatoire.');
                    } elseif (self::longueur($valeur) > $max) {
                        $echec("{$nom}[$i].$champ", sprintf('Ce champ ne doit pas dépasser %d caractères.', $max));
                    }
                }
                if ('langues' === $nom && '' !== ($element['niveau'] ?? '') && !\in_array($element['niveau'], self::NIVEAUX_LANGUE, true)) {
                    $echec("langues[$i].niveau", 'Choisissez un niveau du cadre européen.');
                }
            }
        }
        if (\count($this->hard_skills ?? []) > 30) {
            $echec('competences', '30 compétences au plus.');
        } elseif (array_filter($this->hard_skills ?? [], static fn ($c) => self::longueur((string) $c) > 50)) {
            $echec('competences', 'Une compétence ne doit pas dépasser 50 caractères.');
        }
    }

    /** Éléments d'une liste : seulement les champs connus, en texte nettoyé. */
    private static function liste(array $elements, string $nom): array
    {
        $champs = array_keys(self::LISTES[$nom]['champs']);

        return array_values(array_map(
            static fn ($e) => array_combine($champs, array_map(static fn (string $c) => \is_array($e) && \is_string($e[$c] ?? null) ? (self::texte($e[$c]) ?? '') : '', $champs)),
            $elements,
        ));
    }

    /** Ajoute l'identifiant de position attendu par le front (clé de liste). */
    private static function numerote(array $elements): array
    {
        return array_map(static fn (array $e, int $i) => ['id' => $i + 1, ...$e], array_values($elements), array_keys(array_values($elements)));
    }

    private static function texte(?string $texte): ?string
    {
        $texte = null === $texte ? null : mb_trim(str_replace("\0", '', $texte));

        return '' === $texte ? null : $texte;
    }

    private static function longueur(string $texte): int
    {
        return intdiv(\strlen((string) mb_convert_encoding($texte, 'UTF-16LE', 'UTF-8')), 2);
    }
}
