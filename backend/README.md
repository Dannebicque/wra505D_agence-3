# UniFolio

Un outil de création de portfolio à destination de l'IUT de Troyes.

Backend de la refonte : le Symfony de [l'ancienne version](https://github.com/CyndelHerolt/UniFolio) (commit `bab3d3a`), sans les vues (Twig, EasyAdmin, Live Components, formulaires, assets). Le front est géré à part.

## Installation

### Clonage du projet

    cd backend
    composer install

### Mise à jours des infos

    cp .env .env.local

Mettre à jour le fichier .env.local avec vos informations

### Créer la database et importer les données

    bin/console doctrine:database:create

    // version courte
    bin/console d:d:c

Mettre à jour la database
    bin/console doctrine:schema:update --force

    // version courte
    bin/console d:s:u -f

## Licence

[MPL-2.0](https://choosealicense.com/licenses/mpl-2.0/)
