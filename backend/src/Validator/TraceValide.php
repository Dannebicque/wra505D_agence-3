<?php

namespace App\Validator;

use Symfony\Component\Validator\Constraint;

/** Règles de saisie d'une trace, reprises de shared/utils/trace-validation.ts (mêmes messages). */
#[\Attribute(\Attribute::TARGET_CLASS)]
final class TraceValide extends Constraint
{
    public function getTargets(): string
    {
        return self::CLASS_CONSTRAINT;
    }
}
