<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Sprint 5 : extension unaccent de PostgreSQL, pour la recherche globale insensible aux accents.
 */
final class Version20261124122711 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Extension unaccent (recherche globale)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE EXTENSION IF NOT EXISTS unaccent');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP EXTENSION IF EXISTS unaccent');
    }
}
