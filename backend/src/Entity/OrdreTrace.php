<?php

/*
 * Copyright (c) 2023. | Cyndel Herolt | IUT de Troyes  - All Rights Reserved
 * @author cyndelherolt
 * @project UniFolio
 */
namespace App\Entity;

use App\Repository\OrdreTraceRepository;
use Doctrine\ORM\Mapping as ORM;

/** Trace rangée dans une page, à sa place (`ordre`). Une trace figure au plus une fois par page. */
#[ORM\Entity(repositoryClass: OrdreTraceRepository::class)]
#[ORM\UniqueConstraint(fields: ['page', 'trace'])]
class OrdreTrace
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Trace $trace = null;

    #[ORM\ManyToOne(inversedBy: 'ordreTraces')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Page $page = null;

    #[ORM\Column(nullable: true)]
    private ?int $ordre = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTrace(): ?Trace
    {
        return $this->trace;
    }

    public function setTrace(?Trace $trace): self
    {
        $this->trace = $trace;

        return $this;
    }

    public function getPage(): ?Page
    {
        return $this->page;
    }

    public function setPage(?Page $page): self
    {
        $this->page = $page;

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
}
