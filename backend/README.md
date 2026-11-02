# UniFolio

Un outil de création de portfolio à destination de l'IUT de Troyes.

Backend de la refonte : le Symfony de [l'ancienne version](https://github.com/CyndelHerolt/UniFolio) (commit `bab3d3a`), sans les vues (Twig, EasyAdmin, Live Components, formulaires, assets). Le front est géré à part.

## Installation (Docker)

Prérequis : Docker et Docker Compose. PHP, Composer et PostgreSQL tournent dans les containers : rien à installer sur la machine.

    cd backend
    docker compose up -d --build

Au démarrage, le container `php` lance `composer install` puis FrankenPHP : attendre « FrankenPHP started » dans `docker compose logs -f php`. L'API répond sur http://localhost:8000 (`/` renvoie 404 : seules les routes `POST /api/intranet/*` existent pour l'instant, réservées aux admins). PostgreSQL 17 est exposé sur `localhost:5432` (base `unifolio`, utilisateur et mot de passe `app`).

Les secrets et valeurs locales vont dans `.env.local` (jamais versionné).

### Créer le schéma

    docker compose exec php bin/console doctrine:migrations:migrate

Si la base a été créée avant les migrations (avec `doctrine:schema:update`), `migrate` échoue car les tables existent : marquer la migration comme jouée avec `docker compose exec php bin/console doctrine:migrations:version --add --all`, ou repartir d'une base vide avec `docker compose down -v` (efface les données).

Après une modification des entités : `docker compose exec php bin/console doctrine:migrations:diff`, relire la migration générée, puis `migrate`.

### Commandes courantes

| Action | Commande |
|---|---|
| Console Symfony | `docker compose exec php bin/console <commande>` |
| Composer | `docker compose exec php composer <commande>` |
| Logs | `docker compose logs -f php` |
| Arrêter | `docker compose down` (ajouter `-v` pour effacer la base) |
| Reconstruire après une modification du Dockerfile | `docker compose up -d --build` |

Versions : PHP 8.4 (image `dunglas/frankenphp`), Composer 2, PostgreSQL 17. Pour changer de version ou ajouter une extension PHP, modifier `Dockerfile` (`install-php-extensions …`) puis reconstruire.

Le container tourne en root : `var/`, et les fichiers générés dans le container (migrations, `vendor/` après un `composer require`), appartiennent à root sur la machine hôte. Lancer la console dans le container, et rendre un fichier généré avec `docker compose exec php chown $(id -u):$(id -g) <fichier>`.

## Licence

[MPL-2.0](https://choosealicense.com/licenses/mpl-2.0/)
