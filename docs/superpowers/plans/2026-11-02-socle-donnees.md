# Socle de données (Sprint 0, part d'Enzo) — plan d'implémentation

> **Pour les agents :** sous-skill requis : `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans`, tâche par tâche. Les étapes utilisent des cases à cocher (`- [ ]`).

**Objectif :** poser les types du domaine, le format ApiPlatform des réponses Nitro et la couche `app/services/`, avec le référentiel de compétences comme premier exemple de bout en bout (données factices → route Nitro → service), sans interface.

**Architecture :** les types et les listes de valeurs du domaine vivent dans `shared/` (communs à `app/` et `server/`). Les routes Nitro renvoient du JSON-LD / Hydra comme ApiPlatform 4 (`member`, `totalItems`, `view`, sans préfixe `hydra:`). Côté app, tout appel passe par `apiFetch()` qui normalise les erreurs en `ApiError` avec un message français ; la bascule vers ApiPlatform (Sprint 4) ne changera que `runtimeConfig.public.apiBase`.

**Stack :** Nuxt 4.6 (Nitro 2, h3 v1), TypeScript strict, Vitest 5 (projets `unit` et `nuxt`), Playwright.

**Cadrage :** pas de document de conception séparé (l'utilisateur a demandé de démarrer sans questions). Ce plan s'appuie sur `docs/ROADMAP.md` (Sprint 0 et section « Répartition »), `AGENTS.md` (§1 domaine, §8 conventions) et le modèle de l'ancienne version (`../unifolio_old/src/Entity`, lu le 2026-11-02). Les choix de modélisation ci-dessous sont **des choix de l'auteur du plan**, à valider par l'utilisateur.

## Choix de modélisation (corrigent l'ancienne version)

| Sujet | Ancienne version | Choix ici |
|---|---|---|
| Ordre des pages / traces | Tables `OrdrePage` / `OrdreTrace` en 1-1 **et** liens N-N sans ordre, plus des champs `ordre` en doublon | `Portfolio.pages: Iri[]` et `Page.traces: Iri[]` **ordonnés** : une seule source de vérité, réordonner = un `PATCH` du tableau |
| Trace ↔ compétences | Via `Validation`, niveau retrouvé **par libellé** (non unique, bug) | Toujours via `Validation`, mais par **IRI de niveau** |
| Usage de l'IA | Deux enums entiers, « non renseigné » = 3 ou 4, libellé absent (plantage) | Codes texte (`'non_renseigne'`, `'aucun'`…) et libellés en `Record` exhaustif (vérifié par TypeScript) |
| Type de trace | Nom de classe PHP (`App\…\TraceTypeImage`) | `'image' \| 'pdf' \| 'video' \| 'lien'` |
| Suppression | Aucune suppression douce, cascades dangereuses | `dateSuppression: DateIso \| null` sur `Trace`, `Page`, `Portfolio` (corbeille C-09) |
| Brouillon | Absent | `Trace.statut: 'brouillon' \| 'finalisee'` (E-TR-05 ; « à compléter », point ouvert n° 9, s'ajoutera à cette union) |

Hors périmètre de ce plan (YAGNI) : CV, modèles de pages, réponses aux commentaires (retirées ou Sprint 5).

## Contraintes globales

- Nommage (AGENTS §8) : fonctions et utilitaires en anglais ; **champs du domaine en français** (`titre`, `dateRealisation`…), car c'est le vocabulaire métier ; constantes en `UPPER_SNAKE_CASE`.
- Types du domaine **uniquement** dans `shared/types/`. Listes de valeurs et libellés dans `shared/utils/`.
- Dans `shared/` et `server/utils/hydra.ts` : imports **relatifs explicites** (`import type { Iri } from '../types/api'`), pour que les tests du projet Vitest `unit` (Node, sans auto-imports) puissent les charger.
- **Ne jamais `import … from 'h3'`** dans `server/` : le `h3` hissé dans `node_modules` est la v2, Nitro utilise la v1. Utiliser les auto-imports Nitro (`defineEventHandler`, `getRouterParam`, `getQuery`, `createError`).
- Dates : chaînes ISO 8601 (`type DateIso = string`).
- Messages destinés à l'utilisateur en français, avec la typographie française (apostrophe `'`, espaces avant `?` non requises).
- Aucun `any`, `@ts-ignore`, `.skip` (AGENTS §7).

## Points de vigilance pour la relecture

1. Paramètre `page` invalide (`0`, `-1`, `abc`, `2.5`, très grand) : la collection répond quand même (page 1, ou `member` vide au-delà de la dernière page), jamais d'erreur 500. → Tâche 2.
2. Identifiant inconnu ou non numérique (`999`, `abc`) sur une route d'item : 404 avec message français, pas 500. → Tâche 3.
3. Erreur serveur 5xx : le message technique du serveur n'est **pas** montré à l'utilisateur, il reçoit un message générique. → Tâche 4.
4. Panne réseau (pas de statut HTTP) : message « Impossible de joindre le serveur… », pas une exception brute. → Tâche 4.
5. Format d'erreur ApiPlatform (`detail`, problem+json) **et** format Nitro (`message`) : les deux donnent le bon message, pour que la bascule du Sprint 4 ne casse rien. → Tâche 4.

---

## Préparation (avant la tâche 1)

- [ ] Créer l'issue GitHub « Socle de données : types du domaine, format ApiPlatform, couche services (Sprint 0) » citant C-13 (socle) et la ROADMAP. **Nécessite l'accord de l'utilisateur.**
- [ ] `git fetch`, puis créer la branche `feature/<n°>-socle-donnees`. `develop` ne contient pas encore #3 : partir de `feature/3-init-nuxt` (branche empilée) **ou** attendre la fusion de la PR #3. **Choix de l'utilisateur.**
- [ ] Committer ce plan sur la nouvelle branche : `docs: ajoute le plan du socle de données`.

---

### Tâche 1 : types du domaine et utilitaires partagés

**Fichiers :**
- Créer : `shared/types/api.ts`, `shared/types/utilisateur.ts`, `shared/types/structure.ts`, `shared/types/referentiel.ts`, `shared/types/trace.ts`, `shared/types/portfolio.ts`, `shared/types/evaluation.ts`
- Créer : `shared/utils/iri.ts`, `shared/utils/domaine.ts`
- Tester : `tests/unit/shared/iri.test.ts`, `tests/unit/shared/domaine.test.ts`
- Modifier : `docs/DECISIONS.md` (entrée « Modèle de données du front »)

**Interfaces produites** (`Notification` renommé `NotificationUtilisateur`, voir ledger ; utilisées par toutes les tâches suivantes et par Solène et Mathéo) — définitions exactes :

```ts
// shared/types/api.ts
export type Iri = `/api/${string}`
export type DateIso = string
export interface JsonLdResource { '@id': Iri; '@type': string }
export interface HydraView {
  '@id': string
  '@type': 'PartialCollectionView'
  first?: string
  last?: string
  previous?: string
  next?: string
}
export interface HydraCollection<T> {
  '@context'?: string
  '@id': string
  '@type': 'Collection'
  totalItems: number
  member: T[]
  view?: HydraView
}

// shared/types/utilisateur.ts
export type Role = 'ROLE_ETUDIANT' | 'ROLE_ENSEIGNANT' | 'ROLE_ADMIN'
export interface User extends JsonLdResource {
  '@type': 'User'; username: string; email: string; roles: Role[]
  etudiant: Iri | null; enseignant: Iri | null
}
export interface Etudiant extends JsonLdResource {
  '@type': 'Etudiant'; prenom: string; nom: string; mailUniv: string
  semestre: Iri | null; groupes: Iri[]; anneeUniversitaire: Iri | null; user: Iri
}
export interface Enseignant extends JsonLdResource {
  '@type': 'Enseignant'; prenom: string; nom: string; mailUniv: string
  departements: Iri[]; user: Iri
}

// shared/types/structure.ts
export type GroupeType = 'CM' | 'TD' | 'TP'
export interface Departement extends JsonLdResource { '@type': 'Departement'; libelle: string }
export interface Diplome extends JsonLdResource {
  '@type': 'Diplome'; libelle: string; sigle: string; departement: Iri; parcours: Iri | null
}
export interface Annee extends JsonLdResource { '@type': 'Annee'; libelle: string; ordre: number; diplome: Iri }
export interface AnneeUniversitaire extends JsonLdResource {
  '@type': 'AnneeUniversitaire'; libelle: string; annee: number; active: boolean
}
export interface Semestre extends JsonLdResource { '@type': 'Semestre'; libelle: string; ordre: number; annee: Iri }
export interface Groupe extends JsonLdResource {
  '@type': 'Groupe'; libelle: string; type: GroupeType; semestre: Iri; parcours: Iri | null
}

// shared/types/referentiel.ts  (enfants embarqués : on lit toujours le référentiel en entier)
export interface ApprentissageCritique extends JsonLdResource {
  '@type': 'ApprentissageCritique'; code: string; libelle: string
}
export interface Niveau extends JsonLdResource {
  '@type': 'Niveau'; libelle: string; ordre: number; annee: Iri | null
  apprentissagesCritiques: ApprentissageCritique[]
}
export interface Competence extends JsonLdResource {
  '@type': 'Competence'; libelle: string; nomCourt: string
  couleur: string // jeton de thème 'c1'…'c5', traduit en couleur par l'interface
  niveaux: Niveau[]
}
export interface Referentiel extends JsonLdResource {
  '@type': 'Referentiel'; libelle: string; departement: Iri | null; competences: Competence[]
}

// shared/types/trace.ts
export type TraceType = 'image' | 'pdf' | 'video' | 'lien'
export type TraceStatut = 'brouillon' | 'finalisee'
export type ConceptionIa = 'non_renseigne' | 'aucun' | 'moyen' | 'avance'
export type RealisationIa = 'non_renseigne' | 'aucun' | 'peu' | 'moyen' | 'avance'
export interface Bibliotheque extends JsonLdResource {
  '@type': 'Bibliotheque'; etudiant: Iri; annee: Iri; anneeUniversitaire: Iri
}
export interface Trace extends JsonLdResource {
  '@type': 'Trace'; bibliotheque: Iri; titre: string
  description: string | null; contexte: string | null; legende: string | null
  type: TraceType; contenu: string[] // URL ou chemin de fichier, selon le type
  statut: TraceStatut; conceptionIa: ConceptionIa; realisationIa: RealisationIa
  dateRealisation: DateIso | null; dateCreation: DateIso
  dateModification: DateIso | null; dateSuppression: DateIso | null
}

// shared/types/portfolio.ts
export type PortfolioVisibilite = 'publique' | 'privee'
export interface Portfolio extends JsonLdResource {
  '@type': 'Portfolio'; etudiant: Iri; annee: Iri; intitule: string
  description: string | null; banniere: string | null
  visibilite: PortfolioVisibilite; visibleRecruteurs: boolean
  pages: Iri[] // ordonnées
  dateCreation: DateIso; dateModification: DateIso | null; dateSuppression: DateIso | null
}
export interface Page extends JsonLdResource {
  '@type': 'Page'; portfolio: Iri; intitule: string; description: string | null
  traces: Iri[] // ordonnées
  dateSuppression: DateIso | null
}

// shared/types/evaluation.ts
export type ValidationEtat = 0 | 1 | 2 | 3 // en attente, non acquis, en cours d'acquisition, acquis
export type NotificationType = 'evaluation' | 'commentaire'
export interface Validation extends JsonLdResource {
  '@type': 'Validation'; trace: Iri; niveau: Iri; enseignant: Iri | null
  etat: ValidationEtat; dateCreation: DateIso; dateModification: DateIso | null
}
export interface Commentaire extends JsonLdResource {
  '@type': 'Commentaire'; enseignant: Iri; trace: Iri | null; portfolio: Iri | null
  contenu: string; visibleEtudiant: boolean; dateCreation: DateIso; dateModification: DateIso | null
}
export interface Notification extends JsonLdResource {
  '@type': 'Notification'; destinataire: Iri; type: NotificationType
  trace: Iri | null // cible du lien (E-EV-07)
  lu: boolean; dateCreation: DateIso
}
```

Fonctions et constantes produites :
- `shared/utils/iri.ts` : `iri(resource: string, id: string | number): Iri` et `idFromIri(value: Iri): string`.
- `shared/utils/domaine.ts` : `TRACE_TYPES: readonly TraceType[]`, `VALIDATION_ETATS: readonly ValidationEtat[]`, `TRACE_TYPE_LIBELLES: Record<TraceType, string>`, `VALIDATION_ETAT_LIBELLES: Record<ValidationEtat, string>`, `CONCEPTION_IA_LIBELLES: Record<ConceptionIa, string>`, `REALISATION_IA_LIBELLES: Record<RealisationIa, string>`.

Libellés exacts (repris de l'ancienne version, plus le « non renseigné » manquant) :
- Types : image « Image », pdf « PDF », video « Vidéo », lien « Lien ».
- États : 0 « En attente », 1 « Non acquis », 2 « En cours d'acquisition », 3 « Acquis ».
- Conception : non_renseigne « Non renseigné », aucun « Aucun usage de l'IA », moyen « Je me suis aidé de l'IA pour réfléchir à partir de mes idées », avance « J'ai rédigé un prompt à partir des consignes pour trouver des idées ».
- Réalisation : non_renseigne « Non renseigné », aucun « Aucun usage de l'IA », peu « Quelques éléments du projet ont été générés avec l'IA (moins de 50 %) », moyen « La plupart des éléments du projet ont été générés avec l'IA (plus de 50 %) », avance « J'ai rédigé un prompt à partir des consignes ou le projet a été généré avec l'IA (plus de 90 %) ».

- [ ] **Étape 1 : écrire les tests qui échouent**

`tests/unit/shared/iri.test.ts` :
- `iri('traces', 12)` vaut `'/api/traces/12'` ; `iri('referentiels', 'mmi')` vaut `'/api/referentiels/mmi'`.
- `idFromIri('/api/traces/12')` vaut `'12'`.

`tests/unit/shared/domaine.test.ts` :
- `TRACE_TYPES` vaut `['image', 'pdf', 'video', 'lien']` ; `VALIDATION_ETATS` vaut `[0, 1, 2, 3]`.
- Chaque valeur de `TRACE_TYPES` et de `VALIDATION_ETATS` a un libellé non vide.
- `CONCEPTION_IA_LIBELLES.non_renseigne` et `REALISATION_IA_LIBELLES.non_renseigne` valent `'Non renseigné'` (bug de l'ancienne version).
- `VALIDATION_ETAT_LIBELLES[3]` vaut `'Acquis'`.

- [ ] **Étape 2 : vérifier l'échec** — `npx vitest run --project unit` → échec (modules introuvables).
- [ ] **Étape 3 : écrire les types** (`shared/types/*`, définitions ci-dessus) **et les utilitaires** (`shared/utils/iri.ts`, `shared/utils/domaine.ts`).
- [ ] **Étape 4 : vérifier** — `npx vitest run --project unit` → PASS ; `npm run typecheck` → aucune erreur.
- [ ] **Étape 5 : documenter** — `docs/DECISIONS.md`, entrée « 2026-11-02 — Modèle de données du front » : le tableau « Choix de modélisation » ci-dessus en résumé (décision, alternative écartée = modèle de l'ancienne version, raison).
- [ ] **Étape 6 : commit** — `feat: ajoute les types du domaine et les libellés partagés`.

---

### Tâche 2 : format ApiPlatform côté Nitro

**Fichiers :**
- Créer : `server/utils/hydra.ts`
- Tester : `tests/unit/server/hydra.test.ts`

**Interfaces :**
- Consomme : `Iri`, `JsonLdResource`, `HydraCollection`, `HydraView` (tâche 1).
- Produit :
  - `ITEMS_PER_PAGE = 30` (valeur par défaut d'ApiPlatform) ;
  - `toCollection<T>(path: string, items: readonly T[], query: Record<string, unknown>): HydraCollection<T>` ;
  - `findByIri<T extends JsonLdResource>(items: readonly T[], value: string): T | undefined`.

Règles de `toCollection` :
- `page` = `query.page` converti en entier ; s'il n'est pas un entier ≥ 1, on prend 1.
- `'@id'` = `path`, `totalItems` = nombre total d'éléments, `member` = la tranche de la page (vide au-delà de la dernière page).
- `view` présent **seulement** si `totalItems > ITEMS_PER_PAGE` : `'@id'` = `${path}?page=${page}`, `first` = `?page=1`, `last` = `?page=<dernière>`, `previous` si `page > 1`, `next` si `page < dernière`.

- [ ] **Étape 1 : tests qui échouent** (`tests/unit/server/hydra.test.ts`), avec 65 éléments sur `/api/tests` :
  - sans `page` : 30 éléments, `totalItems` 65, `view.next` `'/api/tests?page=2'`, `view.last` `'/api/tests?page=3'`, pas de `view.previous` ;
  - `page: '3'` : 5 éléments, `view.previous` `'/api/tests?page=2'`, pas de `view.next` ;
  - `page` vaut `'abc'`, `'0'`, `'-1'`, `'2.5'` : identique à la page 1 ;
  - `page: '99'` : `member` vide, `totalItems` 65 ;
  - 10 éléments : pas de `view` ;
  - `findByIri` retrouve un élément par `'@id'` et renvoie `undefined` pour un IRI inconnu.
- [ ] **Étape 2 : vérifier l'échec** — `npx vitest run tests/unit/server/hydra.test.ts` → échec.
- [ ] **Étape 3 : implémenter** `server/utils/hydra.ts` (fonctions pures, imports relatifs, aucun import de `h3`).
- [ ] **Étape 4 : vérifier** — même commande → PASS.
- [ ] **Étape 5 : commit** — `feat: formate les collections Nitro comme ApiPlatform`.

---

### Tâche 3 : référentiel factice et routes Nitro

**Fichiers :**
- Créer : `server/data/referentiels.ts`, `server/api/referentiels/index.get.ts`, `server/api/referentiels/[id].get.ts`
- Tester : `tests/unit/server/referentiels-data.test.ts`, `tests/e2e/api-referentiels.spec.ts`

**Interfaces :**
- Consomme : `Referentiel` et ses enfants, `iri()` (tâche 1) ; `toCollection`, `findByIri` (tâche 2).
- Produit :
  - `REFERENTIELS: readonly Referentiel[]` ;
  - `GET /api/referentiels` → `HydraCollection<Referentiel>` ;
  - `GET /api/referentiels/{id}` → `Referentiel`, ou 404 avec `message: 'Référentiel introuvable.'`.

Données : un référentiel `'/api/referentiels/1'`, libellé « Référentiel de compétences du B.U.T. MMI ».
- **Compétences** : les 5 compétences de `../unifolio_old/src/DataFixtures/CompetenceFixture.php`, avec leurs `libelle`, `nomCourt` et `couleur` exacts (c1 Comprendre, c2 Concevoir, c3 Exprimer, c4 Développer, c5 Entreprendre), dans cet ordre.
- **Niveaux** : 3 niveaux par compétence, libellés exacts de `ApcNiveauFixture.php`, `ordre` 1 à 3, `annee: null`.
- **Apprentissages critiques** : 2 par niveau, code `AC<n° compétence><n° niveau>.0<k>` (ex. `AC11.01`). Les libellés sont **factices** (l'ancienne version n'en fournit pas) ; le signaler par un commentaire en tête de fichier.
- **IRI** : construits avec `iri()` et uniques (`/api/competences/1`, `/api/niveaux/1`, `/api/apprentissages_critiques/1`…).

Routes : `index.get.ts` renvoie `toCollection('/api/referentiels', REFERENTIELS, getQuery(event))`. `[id].get.ts` cherche `iri('referentiels', getRouterParam(event, 'id') ?? '')` ; s'il ne trouve rien, `throw createError({ statusCode: 404, statusMessage: 'Not Found', message: 'Référentiel introuvable.' })`.

- [ ] **Étape 1 : tests qui échouent**
  - `tests/unit/server/referentiels-data.test.ts` :
    - 5 compétences, chacune avec 3 niveaux d'`ordre` 1, 2, 3 ;
    - chaque niveau a au moins 1 apprentissage critique ;
    - tous les `'@id'` du référentiel (récursivement) sont uniques et commencent par `/api/`.
  - `tests/e2e/api-referentiels.spec.ts` (fixture `request` de Playwright) :
    - `GET /api/referentiels` → 200, `'@type'` `'Collection'`, `totalItems` 1, `member[0].competences` de longueur 5 ;
    - `GET /api/referentiels/1` → 200, `'@id'` `'/api/referentiels/1'` ;
    - `GET /api/referentiels/999` et `GET /api/referentiels/abc` → 404, `message` `'Référentiel introuvable.'`.
- [ ] **Étape 2 : vérifier l'échec** — `npx vitest run tests/unit/server/referentiels-data.test.ts` → échec.
- [ ] **Étape 3 : écrire** les données et les deux routes.
- [ ] **Étape 4 : vérifier**
  - `npx vitest run --project unit` → PASS ;
  - `npm run build && npx playwright test tests/e2e/api-referentiels.spec.ts` → PASS.
  - Si le message du 404 n'apparaît pas tel quel dans la réponse de production, ajuster le test au format réel de Nitro **sans** retirer la vérification du statut et du message.
- [ ] **Étape 5 : commit** — `feat: sert le référentiel de compétences factice via Nitro`.

---

### Tâche 4 : couche services

**Fichiers :**
- Créer : `app/services/errors.ts` (pur, sans dépendance Nuxt), `app/services/api.ts`, `app/services/referentiel.ts`, `.env.example`
- Modifier : `nuxt.config.ts` (`runtimeConfig.public.apiBase: ''`), `docs/DECISIONS.md` (entrée « Couche services et bascule ApiPlatform »)
- Tester : `tests/unit/services/errors.test.ts`, `tests/nuxt/services/referentiel.test.ts`

**Interfaces :**
- Consomme : `HydraCollection`, `Referentiel` (tâche 1) ; les routes de la tâche 3.
- Produit :
  - `class ApiError extends Error { readonly status: number }` (`status` vaut 0 si aucune réponse) ;
  - `toApiError(error: unknown): ApiError` ;
  - `apiFetch<T>(path: string, options?: Parameters<typeof $fetch>[1]): Promise<T>` ;
  - `listReferentiels(): Promise<Referentiel[]>` ;
  - `getReferentiel(id: string | number): Promise<Referentiel>`.

Règles :
- **Base de l'API** : `apiBase` est une **origine** (`''` pour Nitro, `NUXT_PUBLIC_API_BASE=https://…` pour ApiPlatform). Les chemins passés à `apiFetch` sont toujours complets (`'/api/referentiels'`), ce qui permet d'appeler directement un IRI.
- **`apiFetch`** : `$fetch` avec `baseURL: useRuntimeConfig().public.apiBase` et `headers: { Accept: 'application/ld+json' }`. Toute erreur est relancée via `toApiError`.
- **`toApiError`** :
  - statut lu dans `error.statusCode ?? error.status` (0 si absent) ;
  - pour un **4xx**, message = `data.detail ?? data.message` (formats ApiPlatform puis Nitro) s'il s'agit d'une chaîne non vide, sinon le message par défaut ;
  - pour un **5xx ou 0**, toujours le message par défaut.
- **Messages par défaut** :
  - 0 : « Impossible de joindre le serveur. Vérifiez votre connexion. »
  - 401 : « Vous devez vous connecter pour continuer. »
  - 403 : « Vous n'avez pas accès à cette ressource. »
  - 404 : « Ressource introuvable. »
  - autre 4xx : « La requête n'a pas pu aboutir. »
  - 5xx : « Le serveur a rencontré une erreur. Réessayez plus tard. »
- **`listReferentiels`** renvoie `member` de la première page.

- [ ] **Étape 1 : tests qui échouent**
  - `tests/unit/services/errors.test.ts` :
    - `{ statusCode: 404, data: { message: 'Référentiel introuvable.' } }` → status 404, message `'Référentiel introuvable.'` ;
    - `{ status: 422, data: { detail: 'titre: Cette valeur ne doit pas être vide.' } }` → message `detail` ;
    - `{ statusCode: 500, data: { message: 'SQLSTATE[42S02]…' } }` → message 5xx par défaut ;
    - `new TypeError('fetch failed')` → status 0 et message réseau ;
    - `{ statusCode: 403, data: {} }` → message 403 par défaut ;
    - le résultat est une instance d'`ApiError`.
  - `tests/nuxt/services/referentiel.test.ts` :
    - `registerEndpoint('/api/referentiels', …)` renvoie une collection d'un élément, et `listReferentiels()` résout ce tableau ;
    - `registerEndpoint('/api/referentiels/1', …)` renvoie un référentiel, et `getReferentiel(1)` le résout.
- [ ] **Étape 2 : vérifier l'échec** — `npm run test` → échec (modules introuvables).
- [ ] **Étape 3 : implémenter** `errors.ts`, `api.ts`, `referentiel.ts`, la clé `runtimeConfig` et `.env.example` (`NUXT_PUBLIC_API_BASE=` avec un commentaire : vide = routes Nitro locales).
- [ ] **Étape 4 : vérifier** — `npm run test` → PASS ; `npm run typecheck` → aucune erreur.
- [ ] **Étape 5 : documenter** — `docs/DECISIONS.md` : `apiBase` = origine et chemins complets (alternative écartée : `baseURL '/api'`, qui casserait les appels par IRI) ; `ApiError` et messages français (alternative écartée : laisser remonter `FetchError`).
- [ ] **Étape 6 : commit** — `feat: ajoute la couche services et le service du référentiel`.

---

### Tâche 5 : validation finale et PR

- [ ] **Portes de validation** (AGENTS §7) : `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run test:e2e` → tous verts.
- [ ] **Navigateur** : ouvrir `http://localhost:3000/api/referentiels` et `/api/referentiels/1` (`npm run dev`) et vérifier le JSON. Aucune page n'est modifiée.
- [ ] **Relecture croisée** (AGENTS §6) par un agent neuf, avec le diff et l'objectif. Corriger les points bloquants, puis faire relire à nouveau.
- [ ] **Documentation** : la section « Types et données » est-elle à ajouter à `AGENTS.md` §1 (arborescence) ? Seulement si une règle change ; sinon rien.
- [ ] **Push et PR** vers `develop` (`Closes #<n°>`) : **accord de l'utilisateur requis**. Proposer l'entrée `AI_PROMPT_BOOK.md`.
