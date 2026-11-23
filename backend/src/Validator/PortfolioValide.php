<?php

namespace App\Validator;

use Symfony\Component\Validator\Constraint;

/** Règles de saisie d'un portfolio (proposées au front : intitulé, visibilité, bannière, ordre des pages, un par année). */
#[\Attribute(\Attribute::TARGET_CLASS)]
final class PortfolioValide extends Constraint
{
    public function getTargets(): string
    {
        return self::CLASS_CONSTRAINT;
    }
}
