# Bascule du front vers l'API ApiPlatform (Sprint 4)

Guide pour Enzo et Solène : brancher les écrans du front (`frontend/`) sur la vraie API (`backend/`), écran par écran.
Les routes, les règles et les messages d'erreur de l'API sont détaillés dans [`backend/README.md`](../backend/README.md).

## 1. Lancer le front sur la vraie API

```bash
cd backend && docker compose up -d                 # API sur http://localhost:8000
cd frontend && NUXT_API_PROXY=http://localhost:8000 npm run dev
```

- `NUXT_API_PROXY` (ou dans `frontend/.env`) : Nuxt **relaie** toute requête `/api/**` vers l'API
  ([`server/middleware/api-proxy.ts`](../frontend/server/middleware/api-proxy.ts)). Le navigateur et le rendu serveur
  restent sur l'origine du front : le cookie de session, les fichiers (`/api/fichiers/…`) et les erreurs passent sans
  CORS. Laisser `NUXT_PUBLIC_API_BASE` **vide**.
- C'est **tout ou rien** sur `/api/**` : avec `NUXT_API_PROXY`, plus aucune route factice ne répond. Sans, rien ne change : les routes Nitro factices de `server/api/` répondent, comme avant. Les écrans qui lisent encore `app/demo/` (sans appel à l'API) restent en démo dans les deux cas.
- Le relais ne sort jamais de `/api/` (chemin normalisé, `server/utils/api-proxy-url.ts`), transmet `Accept`, relaie le corps au fil de l'eau et refuse en 413 un envoi de plus de 11 Mo.
- Comptes de démo (fixtures), mot de passe `test` : `etudiant`, `etudiant2`, `enseignant`, `enseignant2` (autre
  département), `enseignant3` (même département), `admin`. Recharger les données :
  `docker compose exec php bin/console doctrine:fixtures:load -n`.
- **Rendu serveur** : tout appel fait pendant le SSR doit recevoir `useApiRequestOptions()` (le cookie du visiteur),
  sinon l'API répond 401. C'est déjà le cas des stores et composables existants ; `listReferentiels` et
  `getReferentiel` prennent maintenant ces options.

Vérifié le 2026-11-24 avec le proxy : liste et détail des traces, page-projet (traces, ordre), envoi et lecture d'un
fichier, création d'une trace, erreur 422 champ par champ, connexion et déconnexion. Pas encore vérifié dans un
navigateur (seulement par HTTP à travers le front).

## 2. Connexion (Solène, C-13)

| Requête | Réponse |
|---|---|
| `POST /api/login` `{"username", "password"}` (JSON) | 204 + cookie de session HttpOnly ; 401 identifiants incorrects ; 403 compte non activé ; 429 après 5 essais en une minute |
| `GET /api/me` | l'utilisateur (`User` de `shared/types/utilisateur.ts` : `roles`, `etudiant` ou `enseignant` en IRI) ; 401 si non connecté |
| `POST /api/logout` | 204, la session est fermée |

À faire côté front :
- `app/pages/connexion.vue` : envoyer le formulaire à `POST /api/login`, puis lire `/api/me` et rediriger selon le rôle.
- Un store `auth` (utilisateur courant, `GET /api/me` au démarrage, y compris pendant le SSR avec
  `useApiRequestOptions()`), et un middleware de route par rôle (`/etudiant`, `/enseignant`, `/admin`).
- Toute réponse 401 renvoie vers `/connexion`. Le serveur décide toujours : le middleware n'est qu'un confort.
- Retirer `server/middleware/demo-session.ts` et le cookie `uf_demo` une fois tous les écrans basculés.

## 3. Écrans

| Écran | État avec l'API | Ce qui reste |
|---|---|---|
| `etudiant/traces` (liste), `traces/[id]`, `traces/nouvelle` | **branché** | rien |
| `etudiant/portfolios/[id]/pages/[pageId]` | **branché** | rien |
| `etudiant/portfolios/[id]` | pages branchées, informations du portfolio en démo | lire `GET /api/portfolios/{id}`, modifier par `PATCH` (Solène) |
| `etudiant/index` (tableau de bord) | **404** : `DEMO_ETUDIANT_ID = 1` | prendre l'étudiant de `/api/me` (store auth) |
| `etudiant/portfolios`, `portfolios/nouveau`, `portfolios/[id]/apercu` | démo (`app/demo/`) | `GET/POST /api/portfolios` ; aperçu : `GET /api/portfolios/{id}/public` |
| `portfolio/[slug]` (lien public) | démo | l'API sert `GET /api/portfolios/{id}/public` **sans connexion** : utiliser l'identifiant comme `slug` (pas de slug côté API) |
| `etudiant/competences`, `etudiant/retours` | démo | `GET /api/validations`, `GET /api/commentaires`, `GET /api/notifications`, `PATCH /api/notifications/{id} {lu: true}` |
| `etudiant/corbeille`, `etudiant/cv` | démo | Sprint 5 (pas encore de route) |
| `enseignant/*` | démo | voir § 4 |

## 4. Espace enseignant (Sprint 3 de l'API)

Décisions du PO : un enseignant ne voit que les étudiants de **ses départements**, leurs traces **finalisées** et
leurs portfolios **publics** ; le reste lui répond 404. Écritures de l'étudiant : 403.

| Besoin | Route |
|---|---|
| Liste des étudiants, fiche | `GET /api/etudiants`, `GET /api/etudiants/{id}` (filtres groupe, année, recherche : dans le navigateur) |
| Traces d'un étudiant, détail, fichier | `GET /api/traces`, `GET /api/traces/{id}`, `GET /api/fichiers/{id}` |
| Évaluations en attente (P-OR-01) | `GET /api/validations?etat=0` ; d'une trace : `?trace=/api/traces/{id}` |
| Évaluer un niveau (P-EV-03, P-EV-07) | `PATCH /api/validations/{id}` `{"etat": 1, 2 ou 3}` (merge-patch) ; l'étudiant est notifié |
| Commenter (P-EV-04, P-CO-01) | `POST /api/commentaires` `{trace ou portfolio, contenu, visibleEtudiant}` ; `PATCH`/`DELETE` par son auteur |
| Portfolios d'un étudiant | `GET /api/portfolios`, `GET /api/pages?portfolio=/api/portfolios/{id}` |

Écart avec les maquettes : un portfolio **privé** n'est pas visible par l'enseignant (point ouvert n° 15 tranché par
le PO).

## 5. Différences avec les routes Nitro factices

- **Identifiants** : ceux de la base (les fixtures ne donnent pas `1` à la première trace). Ne jamais coder un
  identifiant en dur ; partir des collections ou de `/api/me`.
- **Erreurs** : 422 avec `violations[]` (`propertyPath`, `message`) et `detail`, comme Nitro. Une IRI introuvable
  est signalée sur son champ (« Trace introuvable. », « Portfolio introuvable. »). Une valeur du mauvais type JSON
  donne un message générique sur le bon champ.
- **404 plutôt que 403** pour la ressource d'un autre (son existence ne se devine pas) : déjà géré par `errors.ts`.
- **Suppression** : `DELETE` met traces, pages et portfolios dans la corbeille (204) ; la ressource répond ensuite 404.
- **Routes en plus** : `DELETE /api/traces/{id}`, `POST`/`DELETE /api/validations`, `POST`/`PATCH`/`DELETE
  /api/portfolios`, `/api/commentaires`, `/api/notifications`, `/api/portfolios/{id}/public`.

## 6. Production

- API : `backend/compose.prod.yaml` (voir `backend/README.md`, § Production).
- Front : `NUXT_API_PROXY` pointe vers l'API (`http://127.0.0.1:8000` si elle tourne sur le même hôte) ; l'API déclare
  l'IP du serveur Nuxt dans `TRUSTED_PROXIES`, pour que la limite de connexion compte les visiteurs et non Nuxt.
  `CORS_ALLOW_ORIGIN` reste l'origine du front.
- **Limite connue** : le relais transmet l'IP et le protocole de la connexion qu'il reçoit. Si Nuxt est lui-même derrière
  un reverse proxy HTTPS, l'API verrait l'IP de ce proxy pour tous les visiteurs (limite de connexion commune) :
  exposer Nuxt directement, ou adapter `api-proxy.ts` pour faire confiance à ce proxy (dernière adresse de
  `X-Forwarded-For` seulement).
