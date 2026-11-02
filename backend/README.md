# UniFolio

Un outil de création de portfolio à destination de l'IUT de Troyes.

Backend de la refonte : le Symfony de [l'ancienne version](https://github.com/CyndelHerolt/UniFolio) (commit `bab3d3a`), sans les vues (Twig, EasyAdmin, Live Components, formulaires, assets). Le front est géré à part.

## Installation (Docker)

Prérequis : Docker et Docker Compose. PHP, Composer et PostgreSQL tournent dans les containers : rien à installer sur la machine.

    cd backend
    docker compose up -d --build

Au démarrage, le container `php` lance `composer install` puis FrankenPHP. L'API répond sur http://localhost:8000. PostgreSQL 17 est exposé sur `localhost:5432` (base `unifolio`, utilisateur et mot de passe `app`).

Les secrets et valeurs locales vont dans `.env.local` (jamais versionné).

### Créer le schéma

    docker compose exec php bin/console doctrine:schema:update --force

### Commandes courantes

| Action | Commande |
|---|---|
| Console Symfony | `docker compose exec php bin/console <commande>` |
| Composer | `docker compose exec php composer <commande>` |
| Logs | `docker compose logs -f php` |
| Arrêter | `docker compose down` (ajouter `-v` pour effacer la base) |
| Reconstruire après une modification du Dockerfile | `docker compose up -d --build` |

Versions : PHP 8.4 (image `dunglas/frankenphp`), Composer 2, PostgreSQL 17. Pour changer de version ou ajouter une extension PHP, modifier `Dockerfile` (`install-php-extensions …`) puis reconstruire.

Le container tourne en root : `var/` appartient à root sur la machine hôte. Lancer la console dans le container.

## Licence

[MPL-2.0](https://choosealicense.com/licenses/mpl-2.0/)
