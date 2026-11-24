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

### Ressources

Toutes exigent d'être connecté (401 sinon). Collections paginées par 30 (`?page=`). Formats : ceux de `shared/types/` côté front (JSON-LD, `Accept: application/ld+json`).

#### Structure et utilisateurs (Sprint 0, lecture seule)

| Ressource | Accès |
|---|---|
| `/api/departements`, `/api/diplomes`, `/api/annees`, `/api/annee_universitaires`, `/api/semestres`, `/api/groupes`, `/api/parcours`, `/api/enseignants` | toute personne connectée |
| `/api/etudiants` | enseignant ou admin |
| `/api/etudiants/{id}` | l'étudiant lui-même, un enseignant ou un admin |
| `/api/users/{id}` | l'utilisateur lui-même ou un admin |
| `/api/intranet/*` (synchro, POST en `Content-Type: application/json` uniquement, contre le CSRF) | admin |

#### Référentiel, traces, fichiers, validations (Sprint 1)

| Ressource | Opérations | Accès |
|---|---|---|
| `/api/referentiels`, `/api/referentiels/{id}` | lecture ; l'arbre compétences → niveaux → apprentissages critiques est embarqué (`/api/competences/{id}`, `/api/niveaux/{id}`, `/api/apprentissages_critiques/{id}` lisibles seuls) | toute personne connectée |
| `/api/traces` | `GET` (liste, détail), `POST`, `PATCH` (`Content-Type: application/merge-patch+json`), `DELETE` (corbeille) | étudiant, sur ses seules traces |
| `/api/bibliotheques/{id}` | `GET` | étudiant, la sienne |
| `/api/fichiers` | `POST` multipart (`type` = `image` ou `pdf`, `fichier`), `GET /api/fichiers/{id}` renvoie le contenu | étudiant, ses seuls fichiers |
| `/api/validations` | `GET`, `POST {trace, niveau}`, `DELETE` tant que non évaluée (409 sinon) | étudiant, sur ses traces |

Règles à connaître côté front :

- **Cloisonnement** : la trace, le fichier ou la validation d'un autre étudiant répond 404 (son existence ne se devine pas). Les admins reçoivent 403 ; les enseignants lisent selon les règles du Sprint 3 ci-dessous.
- **Erreurs de saisie** : 422 avec `violations[]` (`propertyPath`, `message`), mêmes règles, même ordre et mêmes messages que `shared/utils/trace-validation.ts` et `shared/utils/fichier.ts`. Une valeur du mauvais type JSON (`titre: 12`, `statut: null`) donne un 422 sur le bon champ mais avec un message générique.
- **Écart voulu avec le front** : une adresse web doit avoir un schéma http(s), un hôte et aucun espace ; `new URL()` accepte `https:exemple.fr` ou un espace dans le chemin, le serveur les refuse.
- **Champs du serveur** : `bibliotheque`, `dateCreation`, `dateModification`, `dateSuppression` d'une trace, `etat` et `enseignant` d'une validation sont fixés par le serveur ; envoyés, ils sont ignorés.
- **Corbeille** : une trace supprimée (`DELETE`, 204) disparaît de la lecture, de la liste et des validations, mais reste en base (restauration au Sprint 5, C-09).
- **Fichiers** : format reconnu sur le contenu réel (JPEG, PNG, WebP, GIF jusqu'à 2 Mo, PDF jusqu'à 10 Mo, SVG refusé), nom nettoyé avec l'extension du type réel, 100 fichiers et 200 Mo au plus par étudiant. Ils sont rangés hors de `public/`, dans `var/fichiers/<env>/`. Une trace image ou PDF ne peut référencer que `/api/fichiers/<uuid>` déposé par son étudiant (ou garder un ancien fichier `/fichiers/…` inchangé).

#### Portfolios et pages-projets (Sprint 2)

| Ressource | Opérations | Accès |
|---|---|---|
| `/api/portfolios` | `GET`, `POST {intitule, description, visibilite, visibleRecruteurs, banniere}`, `PATCH` (mêmes champs + `pages` : nouvel ordre), `DELETE` (corbeille) | étudiant, ses portfolios |
| `/api/pages` (`?portfolio=/api/portfolios/1`) | `GET` (dans l'ordre), `POST {portfolio, intitule, description}` (en fin de portfolio), `PATCH {intitule, description, traces}`, `DELETE` (corbeille) | étudiant, ses pages |
| `/api/portfolios/{id}/public` | `GET` : portfolio, prénom et nom de l'étudiant, pages et traces finalisées embarquées | **sans connexion**, portfolio `publique` hors corbeille (404 sinon) |

Règles à connaître côté front :

- **Un portfolio par année** (E-PF-10) : l'étudiant et l'année (celle de son semestre) sont fixés par le serveur ; un second POST la même année répond 422 « Vous avez déjà un portfolio pour cette année. ». Un portfolio de la corbeille ne compte plus.
- **Visibilité** : un seul réglage (`publique` / `privee`), `publique` active le lien public (point ouvert n° 14 tranché par le PO).
- **Bannière** : l'IRI d'une image déposée par l'étudiant (`POST /api/fichiers`, type `image`) ; elle se lit sans connexion tant que le portfolio est public.
- **Ordre des pages** : `PATCH /api/portfolios/{id}` avec `pages` reprenant exactement les pages actuelles, sinon 422.
- **Traces d'une page** : `PATCH /api/pages/{id}` avec `traces` dans l'ordre voulu ; une trace ajoutée doit être finalisée et absente des autres pages du portfolio (mêmes messages que `page-rules.ts`). Une trace mise à la corbeille est masquée de `traces` mais garde sa place (elle reviendra si elle est restaurée). Une IRI de trace introuvable est signalée sur `traces[0]`, `traces[1]`…
- **Corbeille** : une page supprimée disparaît de `pages` et libère ses traces pour d'autres pages ; un portfolio supprimé emporte ses pages.
- **Lien public** : seules les traces finalisées s'affichent ; leurs fichiers se lisent sans connexion, tout autre fichier répond 404 au visiteur.
- **Images** : JPEG, PNG et WebP sont réencodés à l'envoi (métadonnées et position GPS retirées, photo remise dans le bon sens) ; au-delà de 16 mégapixels, l'image est refusée. La taille renvoyée est celle du fichier réencodé.
- **Limites proposées** (à valider avec Solène) : intitulé d'un portfolio obligatoire, 100 caractères ; description 2 000 caractères.

#### Évaluation, commentaires et notifications (Sprint 3)

Comptes de démo en plus : `enseignant2` (département CJ, ne voit aucun étudiant des fixtures) et `enseignant3` (MMI, collègue de `enseignant`).

| Ressource | Opérations | Accès |
|---|---|---|
| Lecture enseignant | `GET` sur `/api/etudiants`, `/api/traces`, `/api/validations`, `/api/bibliotheques/{id}`, `/api/portfolios`, `/api/pages`, `/api/fichiers/{id}` | enseignant : étudiants de **ses départements**, traces **finalisées**, portfolios **publics** (choix du PO) ; le reste répond 404 |
| `/api/validations/{id}` | `PATCH {etat: 1, 2 ou 3}` (merge-patch) ; filtres `?etat=0`, `?trace=` | enseignant du département |
| `/api/commentaires` | `GET` (`?trace=`, `?portfolio=`), `POST {trace ou portfolio, contenu, visibleEtudiant}`, `PATCH {contenu, visibleEtudiant}`, `DELETE` | enseignant (auteur seul pour modifier ou supprimer) ; étudiant : lecture de ses commentaires visibles |
| `/api/notifications` | `GET` (plus récentes d'abord), `PATCH {lu}` | étudiant, les siennes |

Règles à connaître côté front :

- **Évaluer** : seul `etat` change ; l'enseignant et `dateModification` sont fixés par le serveur. Chaque niveau s'évalue à part (point ouvert n° 16 : évaluation partielle permise). 422 « Choisissez un niveau d’acquisition… » hors de 1 à 3. `etat` est obligatoire ; l'étudiant reçoit une notification `evaluation` quand l'état change (pas pour une réévaluation au même niveau).
- **Commentaire** : une trace finalisée **ou** un portfolio public, jamais les deux (422 « Commentez une trace ou un portfolio. ») ; 2 000 caractères au plus. Non visible, c'est une note entre enseignants ; l'étudiant est notifié la première fois qu'il lui devient visible.
- **Page lue par un enseignant** : `traces` ne liste que les traces finalisées.
- **Notification** : celle d'un commentaire repassé en note privée disparaît avec lui. `destinataire` est l'IRI de l'étudiant ; `trace` est la trace à ouvrir (E-EV-07), celle de l'évaluation ou du commentaire (null pour un commentaire de portfolio).
- **Filtres** : une valeur inconnue ou mal formée donne une liste vide. Les autres filtres enseignant (groupe, année, étudiants ayant des travaux en attente) se calculent dans le navigateur à partir de ces collections.
- `/api/etudiants` est désormais limité au département de l'enseignant ; la fiche d'un autre étudiant répond 404 (au lieu de 403).

#### Corbeille, échéances, CV, bilans, recherche (Sprint 5)

| Ressource | Opérations | Accès |
|---|---|---|
| `/api/corbeille` | `GET` : traces, pages et portfolios supprimés (`type`, `ressource`, `titre`, `dateSuppression`, `dateEffacement`) | étudiant, les siens |
| `/api/{traces,pages,portfolios}/{id}/restaurer` | `POST` avec un corps JSON (`{}`) : 204 ; 409 si impossible | étudiant, les siens |
| `/api/echeances` | `GET` (de la plus proche à la plus lointaine), `POST {libelle, date, annee ou groupe}`, `PATCH`, `DELETE` | enseignant (son département ; auteur seul pour modifier) ; étudiant : celles à venir de son année et de ses groupes |
| `/api/cvs` | `GET`, `POST`, `PATCH` : `titre`, `email`, `telephone`, `ville`, `accroches {stage, alternance}`, `experiences[]`, `formations[]`, `langues[]`, `competences[]` | étudiant, un CV, le sien |
| `/api/bilans/etudiants/{id}`, `/api/bilans/annees/{id}`, `/api/bilans/groupes/{id}` | `GET` en JSON, ou `?format=csv` | individuel : l'étudiant lui-même ou un enseignant du département ; collectif : enseignant du département |
| `/api/recherche?q=…&type=…` | `GET` : traces, pages, compétences (`type`, `ressource`, `titre`, `extrait`) | ce que l'utilisateur lit déjà |

Règles à connaître côté front :

- **Corbeille** (point ouvert n° 17 tranché par le PO) : 30 jours, puis effacement définitif par `bin/console app:corbeille:vider`, **à planifier chaque jour** (cron), qui efface aussi les fichiers qu'aucune trace ni bannière n'utilise plus. Une trace restaurée retrouve sa place dans ses pages ; une page n'est restaurable qu'avec son portfolio en place (409 « Restaurez d’abord le portfolio de cette page. ») ; un portfolio ne l'est pas si un autre de la même année est actif (409).
- **Échéances** (point ouvert n° 1 tranché par le PO) : saisies par un enseignant pour une année **ou** un groupe de son département, à une date qui n'est pas passée ; `date` au format AAAA-MM-JJ.
- **CV** : format de `CV_DEMO` (`frontend/app/demo/etudiant.ts`), `prenom` et `nom` viennent de la fiche étudiant. Chaque élément de liste reçoit un `id` de position ; niveaux de langue du CECRL (`A1 : débutant` … `Langue maternelle`). Erreurs rangées par champ (`experiences[0].poste`). Le PDF est fait par le navigateur (impression), comme celui des bilans (décision du PO).
- **Bilans** : comptes `acquis`, `enCours`, `nonAcquis`, `enAttente` sur les traces finalisées hors corbeille, par compétence et par niveau du référentiel du département. CSV pour Excel (BOM UTF-8, point-virgule).
- **Recherche** : sans accents ni casse, 2 à 100 caractères (422 sinon), 10 résultats au plus par type.

Le front autorisé à appeler l'API est fixé par `CORS_ALLOW_ORIGIN` (`.env`, par défaut `http://localhost:3000`).

### En production

Image et compose dédiés (cible `prod` du `Dockerfile`, code et dépendances dans l'image, opcache, migrations au démarrage) :

    cp .env.prod.example .env.prod   # puis remplir les secrets (openssl rand -hex 32)
    docker compose -f compose.prod.yaml --env-file .env.prod up -d --build

Planifier chaque jour l'effacement de la corbeille, par exemple dans la crontab de l'hôte : `0 3 * * * docker compose -f compose.prod.yaml exec -T php bin/console app:corbeille:vider`.

Le démarrage refuse un `APP_SECRET` absent, par défaut ou de moins de 32 caractères. `.env.prod` n'entre jamais dans l'image (`.dockerignore`). L'API n'est publiée que sur `127.0.0.1` (le front ou le reverse proxy la joint depuis l'hôte) et la base pas du tout ; les fichiers des traces sont dans le volume `fichiers`, à sauvegarder avec la base. Une seule instance de l'API : les migrations sont appliquées à chaque démarrage, sans verrou. Les sessions sont des fichiers du conteneur : un redéploiement déconnecte les utilisateurs. Le front relaie `/api/**` vers l'API ([`docs/BASCULE-API.md`](../docs/BASCULE-API.md)).

- `CORS_ALLOW_ORIGIN` : l'adresse du front de production (expression régulière, par ex. `'^https://portfolio\.exemple\.fr$'`).
- `TRUSTED_PROXIES` : l'IP ou le sous-réseau exact du reverse proxy, ou du serveur Nuxt qui relaie `/api/**` (sinon la limite de connexion compte tous les utilisateurs comme une seule IP). Jamais `REMOTE_ADDR` si l'API est joignable sans passer par le proxy.
- Fichiers des traces : `var/fichiers/prod/` doit être un volume persistant et sauvegardé (les fiches sont en base, le contenu sur disque).
- `APP_SECRET` : une vraie valeur secrète, dans `.env.local` ou les variables d'environnement du serveur.
- Le cookie de session est toujours `Secure` en prod ; la documentation `/api/docs` y est désactivée.

## Tests

    docker compose exec php vendor/bin/phpunit

Chaque lancement recrée la base `unifolio_test` (migrations puis fixtures) ; chaque test travaille dans une transaction annulée à la fin (`tests/DatabaseTestCase.php`). Les tests échouent sur toute dépréciation PHP. Un seul fichier : `vendor/bin/phpunit tests/Repository/EnseignantDepartementRepositoryTest.php`.

## Licence

[MPL-2.0](https://choosealicense.com/licenses/mpl-2.0/)
