<?php

namespace App\Command;

use App\Service\Corbeille;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Output\OutputInterface;

/** À planifier une fois par jour (cron) : efface ce qui est dans la corbeille depuis plus de 30 jours. */
#[AsCommand(name: 'app:corbeille:vider', description: 'Efface définitivement les éléments de la corbeille de plus de 30 jours et les fichiers inutilisés')]
final class ViderCorbeilleCommand
{
    public function __construct(private readonly Corbeille $corbeille)
    {
    }

    public function __invoke(OutputInterface $output): int
    {
        $compte = $this->corbeille->vider(new \DateTimeImmutable());
        $output->writeln(sprintf('Effacés : %d portfolio(s), %d page(s), %d trace(s), %d fichier(s).', $compte['portfolios'], $compte['pages'], $compte['traces'], $compte['fichiers']));

        return Command::SUCCESS;
    }
}
