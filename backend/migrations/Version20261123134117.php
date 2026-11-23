<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Sprint 1 : fichiers déposés pour les traces image et PDF (contenu rangé hors de public/).
 */
final class Version20261123134117 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Fichiers des traces';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE fichier (id UUID NOT NULL, date_creation TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, nom VARCHAR(100) NOT NULL, mime_type VARCHAR(50) NOT NULL, taille INT NOT NULL, proprietaire_id INT NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE INDEX IDX_9B76551F76C50E4A ON fichier (proprietaire_id)');
        $this->addSql('ALTER TABLE fichier ADD CONSTRAINT FK_9B76551F76C50E4A FOREIGN KEY (proprietaire_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE fichier DROP CONSTRAINT FK_9B76551F76C50E4A');
        $this->addSql('DROP TABLE fichier');
    }
}
