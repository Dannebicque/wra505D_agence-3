<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Sprint 1 : statut (brouillon / finalisée) et corbeille des traces ; usages de l'IA stockés avec les valeurs du front.
 */
final class Version20261123132834 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Traces : statut, corbeille et usages de l\'IA en texte';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE trace ADD date_suppression TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE trace ADD statut VARCHAR(20) DEFAULT \'brouillon\' NOT NULL');
        // Traces reprises de l'ancienne version : pas de brouillon à l'époque, et type rangé sous le nom de sa classe
        $this->addSql("UPDATE trace SET statut = 'finalisee'");
        $this->addSql("UPDATE trace SET type_trace = CASE WHEN type_trace LIKE '%TraceTypeImage' THEN 'image' WHEN type_trace LIKE '%TraceTypePdf' THEN 'pdf' WHEN type_trace LIKE '%TraceTypeVideo' THEN 'video' WHEN type_trace LIKE '%TraceTypeLien' THEN 'lien' ELSE type_trace END");
        // Anciens entiers de ConceptionIaEnum / RealisationIaEnum convertis en valeurs du front
        $this->addSql("ALTER TABLE trace ALTER conception_ia TYPE VARCHAR(20) USING CASE conception_ia WHEN 0 THEN 'aucun' WHEN 1 THEN 'moyen' WHEN 2 THEN 'avance' ELSE 'non_renseigne' END");
        $this->addSql("ALTER TABLE trace ALTER realisation_ia TYPE VARCHAR(20) USING CASE realisation_ia WHEN 0 THEN 'aucun' WHEN 1 THEN 'peu' WHEN 2 THEN 'moyen' WHEN 3 THEN 'avance' ELSE 'non_renseigne' END");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE trace DROP date_suppression');
        $this->addSql('ALTER TABLE trace DROP statut');
        $this->addSql("UPDATE trace SET type_trace = CASE type_trace WHEN 'image' THEN 'App\\Components\\Trace\\TypeTrace\\TraceTypeImage' WHEN 'pdf' THEN 'App\\Components\\Trace\\TypeTrace\\TraceTypePdf' WHEN 'video' THEN 'App\\Components\\Trace\\TypeTrace\\TraceTypeVideo' WHEN 'lien' THEN 'App\\Components\\Trace\\TypeTrace\\TraceTypeLien' ELSE type_trace END");
        $this->addSql("ALTER TABLE trace ALTER conception_ia TYPE SMALLINT USING CASE conception_ia WHEN 'aucun' THEN 0 WHEN 'moyen' THEN 1 WHEN 'avance' THEN 2 ELSE 3 END");
        $this->addSql("ALTER TABLE trace ALTER realisation_ia TYPE SMALLINT USING CASE realisation_ia WHEN 'aucun' THEN 0 WHEN 'peu' THEN 1 WHEN 'moyen' THEN 2 WHEN 'avance' THEN 3 ELSE 4 END");
    }
}
