<?php

namespace App\Enum;

/** Usage de l'IA pendant la conception d'une trace ; valeurs du front (shared/types/trace.ts). */
enum ConceptionIaEnum: string
{
    case NON_RENSEIGNE = 'non_renseigne';
    case AUCUN = 'aucun';
    case MOYEN = 'moyen';
    case AVANCE = 'avance';

    public function getLibelle(): string
    {
        return match($this) {
            self::NON_RENSEIGNE => 'Non renseigné',
            self::AUCUN => 'Aucun usage de l\'IA',
            self::MOYEN => 'Je me suis aidé de l\'IA pour réfléchir à partir de mes idées',
            self::AVANCE => 'J\'ai rédigé un prompt à partir des consignes pour trouver des idées',
        };
    }
}
