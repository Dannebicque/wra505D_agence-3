# UniFolio

Un outil de création de portfolio à destination de l'IUT de Troyes.

Backend de la refonte : le Symfony de [l'ancienne version](https://github.com/CyndelHerolt/UniFolio) (commit `bab3d3a`), sans les vues (Twig, EasyAdmin, Live Components, formulaires, assets). Le front est géré à part.

## Installation (Docker)

Prérequis : Docker et Docker Compose. PHP, Composer et PostgreSQL tournent dans les containers : rien à installer sur la machine.

    cd backend
    docker compose up -d --build

Au démarrage, le container `php` lance `composer install` puis FrankenPHP : attendre « FrankenPHP started » dans `docker compose logs -f php`. L'API répond sur http://localhost:8000/api (voir « API » ci-dessous). PostgreSQL 17 est exposé sur `localhost:5432` (base `unifolio`, utilisateur et mot de passe `app`).

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
| Tests PHPUnit | `docker compose exec php vendor/bin/phpunit` |
| Logs | `docker compose logs -f php` |
| Arrêter | `docker compose down` (ajouter `-v` pour effacer la base) |
| Reconstruire après une modification du Dockerfile | `docker compose up -d --build` |

Versions : PHP 8.4 (image `dunglas/frankenphp`), Composer 2, PostgreSQL 17. Pour changer de version ou ajouter une extension PHP, modifier `Dockerfile` (`install-php-extensions …`) puis reconstruire.

Le container tourne en root : `var/`, et les fichiers générés dans le container (migrations, `vendor/` après un `composer require`), appartiennent à root sur la machine hôte. Lancer la console dans le container, et rendre un fichier généré avec `docker compose exec php chown $(id -u):$(id -g) <fichier>`.

## API

API ApiPlatform au format JSON-LD/Hydra, conforme aux types du front (`shared/types/`). Documentation interactive en dev : http://localhost:8000/api/docs.

### Connexion

Par cookie de session (HttpOnly, SameSite=Lax) : le front envoie ses requêtes avec `credentials: 'include'`.

| Requête | Réponse |
|---|---|
| `POST /api/login` avec `{"username": "…", "password": "…"}` (JSON) | 204 et cookie de session ; 401 si identifiants incorrects, 403 si compte non activé, 429 après 5 essais en une minute |
| `GET /api/me` | l'utilisateur connecté (`User`) |
| `POST /api/logout` | 204 |

Comptes de démo (fixtures, dev et test uniquement), mot de passe `test` : `admin`, `enseignant`, `etudiant`, `etudiant2`. Charger les fixtures : `docker compose exec php bin/console doctrine:fixtures:load`.

### Ressources (lecture seule au Sprint 0)

Toutes exigent d'être connecté (401 sinon). Collections paginées par 30 (`?page=`).

| Ressource | Accès |
|---|---|
| `/api/departements`, `/api/diplomes`, `/api/annees`, `/api/annee_universitaires`, `/api/semestres`, `/api/groupes`, `/api/parcours`, `/api/enseignants` | toute personne connectée |
| `/api/etudiants` | enseignant ou admin |
| `/api/etudiants/{id}` | l'étudiant lui-même, un enseignant ou un admin |
| `/api/users/{id}` | l'utilisateur lui-même ou un admin |
| `/api/intranet/*` (synchro, POST) | admin |

Le front autorisé à appeler l'API est fixé par `CORS_ALLOW_ORIGIN` (`.env`, par défaut `http://localhost:3000`).

## Tests

    docker compose exec php vendor/bin/phpunit

Chaque lancement recrée la base `unifolio_test` (migrations puis fixtures) ; chaque test travaille dans une transaction annulée à la fin (`tests/DatabaseTestCase.php`). Les tests échouent sur toute dépréciation PHP. Un seul fichier : `vendor/bin/phpunit tests/Repository/EnseignantDepartementRepositoryTest.php`.

## Licence

[MPL-2.0](https://choosealicense.com/licenses/mpl-2.0/)
