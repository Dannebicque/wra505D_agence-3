<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Sprint 5 : CV au format du front (coordonnées, accroches par candidature, expériences et formations en JSON).
 */
final class Version20261124121307 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'CV : coordonnées, accroches, expériences et formations';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE cv ADD email VARCHAR(180) DEFAULT NULL');
        $this->addSql('ALTER TABLE cv ADD telephone VARCHAR(30) DEFAULT NULL');
        $this->addSql('ALTER TABLE cv ADD ville VARCHAR(100) DEFAULT NULL');
        $this->addSql('ALTER TABLE cv ADD accroches JSON DEFAULT NULL');
        $this->addSql('ALTER TABLE cv ADD experiences_cv JSON DEFAULT NULL');
        $this->addSql('ALTER TABLE cv ADD formations_cv JSON DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE cv DROP email');
        $this->addSql('ALTER TABLE cv DROP telephone');
        $this->addSql('ALTER TABLE cv DROP ville');
        $this->addSql('ALTER TABLE cv DROP accroches');
        $this->addSql('ALTER TABLE cv DROP experiences_cv');
        $this->addSql('ALTER TABLE cv DROP formations_cv');
    }
}
