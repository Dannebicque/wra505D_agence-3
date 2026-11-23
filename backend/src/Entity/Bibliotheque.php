<?php

/*
 * Copyright (c) 2023. | Cyndel Herolt | IUT de Troyes  - All Rights Reserved
 * @author cyndelherolt
 * @project UniFolio
 */
namespace App\Entity;

use App\Repository\BibliothequeRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use Symfony\Component\Serializer\Attribute\Groups;

/** Bibliothèque d'un étudiant pour une année ; lisible par lui seul (App\Doctrine\ProprietaireExtension). */
#[ApiResource(
    operations: [new Get()],
    normalizationContext: ['groups' => ['bibliotheque:read']],
    // Lecture : l'étudiant (ses données) et l'enseignant (ses départements), cf. App\Doctrine\ProprietaireExtension
    security: "is_granted('ROLE_ETUDIANT') or is_granted('ROLE_ENSEIGNANT')",
)]
#[ORM\Entity(repositoryClass: BibliothequeRepository::class)]
class Bibliotheque
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(cascade: ['persist', 'remove'], inversedBy: 'bibliotheques')]
    private ?Etudiant $etudiant = null;

    #[ORM\ManyToOne(inversedBy: 'bibliotheques')]
    private ?AnneeUniversitaire $annee_universitaire = null;

    #[ORM\ManyToOne(inversedBy: 'bibliotheques')]
    private ?Annee $annee = null;

    #[ORM\OneToMany(mappedBy: 'bibliotheque', targetEntity: Trace::class)]
    private Collection $traces;

    public function __construct()
    {
        $this->traces = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    #[Groups(['bibliotheque:read'])]
    public function getEtudiant(): ?Etudiant
    {
        return $this->etudiant;
    }

    public function setEtudiant(?Etudiant $etudiant): self
    {
        $this->etudiant = $etudiant;

        return $this;
    }

    #[Groups(['bibliotheque:read'])]
    public function getAnneeUniversitaire(): ?AnneeUniversitaire
    {
        return $this->annee_universitaire;
    }

    public function setAnneeUniversitaire(?AnneeUniversitaire $annee_universitaire): self
    {
        $this->annee_universitaire = $annee_universitaire;

        return $this;
    }

    #[Groups(['bibliotheque:read'])]
    public function getAnnee(): ?Annee
    {
        return $this->annee;
    }

    public function setAnnee(?Annee $annee): self
    {
        $this->annee = $annee;

        return $this;
    }

    /**
     * @return Collection<int, Trace>
     */
    public function getTraces(): Collection
    {
        return $this->traces;
    }

    public function addTrace(Trace $trace): self
    {
        if (!$this->traces->contains($trace)) {
            $this->traces->add($trace);
            $trace->setBibliotheque($this);
        }

        return $this;
    }

    public function removeTrace(Trace $trace): self
    {
        if ($this->traces->removeElement($trace)) {
            // set the owning side to null (unless already changed)
            if ($trace->getBibliotheque() === $this) {
                $trace->setBibliotheque(null);
            }
        }

        return $this;
    }
}
