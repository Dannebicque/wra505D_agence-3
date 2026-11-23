<?php

/*
 * Copyright (c) 2023. | Cyndel Herolt | IUT de Troyes  - All Rights Reserved
 * @author cyndelherolt
 * @project UniFolio
 */
namespace App\Entity;

use App\Repository\EnseignantDepartementRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: EnseignantDepartementRepository::class)]
class EnseignantDepartement extends BaseEntity
{
    #[ORM\Column(type: Types::BOOLEAN)]
    private bool $defaut = false;

    public function __construct(
        #[ORM\ManyToOne(targetEntity: Enseignant::class, inversedBy: 'enseignantDepartements')]
        private Enseignant $enseignant,
        #[ORM\ManyToOne(targetEntity: Departement::class, inversedBy: 'enseignantDepartements')]
        private Departement $departement
    ) {
    }

    public function getEnseignant(): ?Enseignant
    {
        return $this->enseignant;
    }

    public function setEnseignant(?Enseignant $enseignant): self
    {
        $this->enseignant = $enseignant;

        return $this;
    }

    public function getDepartement(): ?Departement
    {
        return $this->departement;
    }

    public function setDepartement(?Departement $departement): self
    {
        $this->departement = $departement;

        return $this;
    }

    public function getDefaut(): ?bool
    {
        return $this->defaut;
    }

    public function setDefaut(bool $defaut): self
    {
        $this->defaut = $defaut;

        return $this;
    }
}
