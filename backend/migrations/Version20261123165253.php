<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Sprint 3 : notifications datées à la seconde (tri du plus récent) et retirées avec leur évaluation ou leur commentaire.
 */
final class Version20261123165253 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Notifications : date et heure, suppression en cascade';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE notification DROP CONSTRAINT fk_bf5476caba9cd190');
        $this->addSql('ALTER TABLE notification DROP CONSTRAINT fk_bf5476caa2274850');
        $this->addSql('ALTER TABLE notification ALTER date_creation TYPE TIMESTAMP(0) WITHOUT TIME ZONE');
        $this->addSql('ALTER TABLE notification ADD CONSTRAINT FK_BF5476CABA9CD190 FOREIGN KEY (commentaire_id) REFERENCES commentaire (id) ON DELETE CASCADE NOT DEFERRABLE');
        $this->addSql('ALTER TABLE notification ADD CONSTRAINT FK_BF5476CAA2274850 FOREIGN KEY (validation_id) REFERENCES validation (id) ON DELETE CASCADE NOT DEFERRABLE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE notification DROP CONSTRAINT FK_BF5476CAA2274850');
        $this->addSql('ALTER TABLE notification DROP CONSTRAINT FK_BF5476CABA9CD190');
        $this->addSql('ALTER TABLE notification ALTER date_creation TYPE DATE');
        $this->addSql('ALTER TABLE notification ADD CONSTRAINT fk_bf5476caa2274850 FOREIGN KEY (validation_id) REFERENCES validation (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE notification ADD CONSTRAINT fk_bf5476caba9cd190 FOREIGN KEY (commentaire_id) REFERENCES commentaire (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }
}
