<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Sprint 1 : un niveau de compétence n'est associé qu'une fois à une même trace.
 */
final class Version20261123134529 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Validations : un niveau par trace au plus une fois';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE UNIQUE INDEX UNIQ_16AC5B6EBE0D4B709445617E ON validation (trace_id, apc_niveau_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX UNIQ_16AC5B6EBE0D4B709445617E');
    }
}
