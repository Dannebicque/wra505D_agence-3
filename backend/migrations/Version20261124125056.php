<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Sprint 5 : un CV par étudiant. L'ancienne version en permettait plusieurs : le plus récent reste rattaché,
 * les autres sont détachés (etudiant_id à NULL) plutôt qu'effacés.
 */
final class Version20261124125056 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'CV : un par étudiant';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('UPDATE cv SET etudiant_id = NULL WHERE etudiant_id IS NOT NULL AND id NOT IN (SELECT MAX(id) FROM cv WHERE etudiant_id IS NOT NULL GROUP BY etudiant_id)');
        $this->addSql('DROP INDEX idx_b66ffe92ddeab1a3');
        $this->addSql('CREATE UNIQUE INDEX cv_unique_par_etudiant ON cv (etudiant_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX cv_unique_par_etudiant');
        $this->addSql('CREATE INDEX idx_b66ffe92ddeab1a3 ON cv (etudiant_id)');
    }
}
