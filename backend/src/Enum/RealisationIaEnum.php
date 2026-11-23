<?php

namespace App\Enum;

/** Usage de l'IA pendant la réalisation d'une trace ; valeurs du front (shared/types/trace.ts). */
enum RealisationIaEnum: string
{
    case NON_RENSEIGNE = 'non_renseigne';
    case AUCUN = 'aucun';
    case PEU = 'peu';
    case MOYEN = 'moyen';
    case AVANCE = 'avance';

    public function getLibelle(): string
    {
        return match($this) {
            self::NON_RENSEIGNE => 'Non renseigné',
            self::AUCUN => 'Aucun usage de l\'IA',
            self::PEU => 'Quelques éléments du projet ont été générés avec l\'IA (<50%)',
            self::MOYEN => 'La plupart des éléments du projet ont été générés avec l\'IA (>50%)',
            self::AVANCE => 'J\'ai rédigé un prompt à partir des consignes ou le projet a été généré avec l\'IA (>90%)',
        };
    }
}
