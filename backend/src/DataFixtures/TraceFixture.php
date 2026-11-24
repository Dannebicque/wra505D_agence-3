<?php

namespace App\DataFixtures;

use App\Entity\Commentaire;
use App\Entity\Cv;
use App\Entity\Echeance;
use App\Entity\Notification;
use App\Entity\Page;
use App\Entity\Portfolio;
use App\Entity\Trace;
use App\Entity\Validation;
use App\Repository\ApcNiveauRepository;
use App\Repository\BibliothequeRepository;
use App\Repository\EnseignantRepository;
use App\Repository\EtudiantRepository;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\OrderedFixtureInterface;
use Doctrine\Persistence\ObjectManager;

/**
 * Traces de démonstration du compte « etudiant » : une par état utile au front (lien finalisé et évalué,
 * vidéo en attente d'évaluation, brouillon d'image sans fichier), et son portfolio public de l'année avec deux
 * pages-projets ; un commentaire visible de « enseignant » sur le site, et les notifications de l'évaluation et du
 * commentaire (une lue, une non lue) ; trois échéances de « enseignant » (année, groupe, une passée) ; un CV.
 * « etudiant2 » n'a ni trace ni portfolio.
 */
class TraceFixture extends Fixture implements OrderedFixtureInterface
{
    public function __construct(
        private readonly EtudiantRepository $etudiants,
        private readonly BibliothequeRepository $bibliotheques,
        private readonly ApcNiveauRepository $niveaux,
        private readonly EnseignantRepository $enseignants,
    ) {
    }

    public function getOrder(): int
    {
        return 13;
    }

    public function load(ObjectManager $manager): void
    {
        $etudiant = $this->etudiants->findOneBy(['username' => 'etudiant']);
        $bibliotheque = $this->bibliotheques->courante($etudiant);
        [$niveau1, $niveau2] = $this->niveaux->findBy(['ordre' => 1], ['id' => 'ASC'], 2);

        $site = $this->trace($bibliotheque, 'Site vitrine d’une association', 'lien', ['https://exemple.fr'], 'finalisee')
            ->setDescription('Conception et intégration d’un site responsive pour une association locale.')
            ->setContexte('SAÉ 1.05');
        $video = $this->trace($bibliotheque, 'Motion design du festival', 'video', ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'], 'finalisee');
        $brouillon = $this->trace($bibliotheque, 'Affiche en cours', 'image', [], 'brouillon');

        $evaluee = (new Validation())->setTrace($site)->setNiveau($niveau1)->setEtat(3)
            ->setEnseignant($this->enseignants->findOneBy(['username' => 'enseignant']))
            ->setDateCreation(new \DateTime('-10 days'))->setDateModification(new \DateTime('-3 days'));
        $enAttente = (new Validation())->setTrace($video)->setNiveau($niveau2)->setEtat(0)->setDateCreation(new \DateTime('-2 days'));

        $portfolio = (new Portfolio())->setEtudiant($etudiant)->setIntitule('Mon parcours en MMI')
            ->setDescription('Mes projets de première année.')->setVisibilite(true)
            ->setDateCreation(new \DateTime('-5 days'))->setDateModification(new \DateTime('-1 day'));
        $portfolio->setAnnee($etudiant->getSemestre()?->getAnnee());
        $web = (new Page())->setIntitule('Projet web')->setDescription('Site d’une association.')->setOrdre(1);
        $motion = (new Page())->setIntitule('Motion design')->setOrdre(2);
        $portfolio->addPage($web);
        $portfolio->addPage($motion);
        $web->setTraces([$site]);
        $motion->setTraces([$video]);

        $commentaire = (new Commentaire())->setTrace($site)->setEnseignant($evaluee->getEnseignant())
            ->setContenu('Site clair et accessible : pensez à justifier vos choix de couleurs.')->setVisibilite(true)
            ->setDateCreation(new \DateTime('-3 days'));
        $notifEvaluation = Notification::pour($etudiant, $evaluee)->setLu(true)->setDateCreation(new \DateTime('-3 days'));
        $notifCommentaire = Notification::pour($etudiant, commentaire: $commentaire)->setDateCreation(new \DateTime('-3 days +1 minute'));

        $groupe = $etudiant->getGroupe()?->first() ?: null;
        $echeances = [
            (new Echeance())->setLibelle('Dépôt des traces du projet tutoré')->setAnnee($etudiant->getSemestre()?->getAnnee())->setDate(new \DateTimeImmutable('+10 days'))->setEnseignant($evaluee->getEnseignant()),
            (new Echeance())->setLibelle('Rendu du dossier de TP')->setGroupe($groupe)->setDate(new \DateTimeImmutable('+3 days'))->setEnseignant($evaluee->getEnseignant()),
            (new Echeance())->setLibelle('Jury de mi-parcours')->setAnnee($etudiant->getSemestre()?->getAnnee())->setDate(new \DateTimeImmutable('-5 days'))->setEnseignant($evaluee->getEnseignant()),
        ];

        $cv = (new Cv())->setEtudiant($etudiant)->setTitre('Étudiante en BUT MMI')->setEmail('etudiant@exemple.fr')->setVille('Troyes')
            ->setAccroches(['stage' => 'Je recherche un stage de 10 semaines en développement web.', 'alternance' => 'Je recherche une alternance en développement web.'])
            ->setExperiencesCv([['poste' => 'Développeuse web (projet tutoré)', 'structure' => 'BDE de l’IUT', 'periode' => '2026', 'description' => 'Refonte du site du BDE.']])
            ->setFormationsCv([['diplome' => 'BUT MMI', 'etablissement' => 'IUT de Troyes', 'periode' => '2025 à 2028']])
            ->setLanguesCv([['langue' => 'Anglais', 'niveau' => 'B2 : avancé']])
            ->setCompetencesCv(['Vue et Nuxt', 'Accessibilité numérique']);
        $cv->setDateCreation(new \DateTimeImmutable())->setDateModification(new \DateTimeImmutable());

        foreach ([$site, $video, $brouillon, $evaluee, $enAttente, $portfolio, $web, $motion, $commentaire, $notifEvaluation, $notifCommentaire, ...$echeances, $cv] as $entite) {
            $manager->persist($entite);
        }
        $manager->flush();
    }

    private function trace($bibliotheque, string $titre, string $type, array $contenu, string $statut): Trace
    {
        return (new Trace())->setBibliotheque($bibliotheque)->setTitre($titre)->setTypeTrace($type)
            ->setContenu($contenu)->setStatut($statut)->setDateModification(new \DateTimeImmutable());
    }
}
