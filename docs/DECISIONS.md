# Décisions techniques

Format : date, décision, alternatives écartées, raison.

## 2026-10-14 — Stack front : Nuxt 4, TypeScript, Pinia, Nuxt UI

- **Décision** : Nuxt 4 (TypeScript strict par défaut), Pinia (`@pinia/nuxt`) pour l'état, Nuxt UI 4 (Reka UI + Tailwind 4) pour les composants.
- **Alternatives écartées** : Vue seul (stack imposée : Vue ou Nuxt ; Nuxt apporte le SSR utile au portfolio public et Nitro pour simuler l'API) ; Tailwind seul ou CSS maison (accessibilité des composants riches à notre charge).
- **Raison** : composants accessibles prêts à l'emploi (modales, onglets, formulaires), mode sombre intégré (C-02), gain de temps sur le socle.

## 2026-10-14 — npm et Node 24

- **Décision** : npm ; Node 24 fixé par `.nvmrc` (lu aussi par la CI) et `engines` (`^24.15.0`, minimum exigé par Nuxt 4.6).
- **Alternatives écartées** : pnpm, yarn.
- **Raison** : déjà installé sur tous les postes, aucune configuration supplémentaire.

## 2026-10-14 — Outillage qualité

- **Décision** : `@nuxt/eslint` (règles stylistiques désactivées) + Prettier, avec `eslint-config-prettier` ; Vitest avec deux projets (`unit` en environnement Node, `nuxt` avec `@nuxt/test-utils`) ; Playwright pour l'E2E, avec `@axe-core/playwright` pour l'accessibilité (WCAG 2.2 A/AA, modes clair et sombre), sur un profil ordinateur et un profil mobile.
- **Alternatives écartées** : Cypress (plus lourd en CI, moins de navigateurs) ; Biome (moins bien intégré à Vue/Nuxt) ; ESLint Stylistic seul.
- **Raison** : outils officiels de l'écosystème Nuxt ; l'accessibilité est une exigence forte du client, elle est vérifiée automatiquement à chaque PR.

## 2026-10-14 — Cache disque de Vitest désactivé pour le projet `nuxt`

- **Décision** : `fsModuleCache: false` dans le projet Vitest `nuxt`.
- **Alternatives écartées** : vider le cache avant chaque lancement (`vitest --clearCache`).
- **Raison** : avec Vitest 5 et `@nuxt/test-utils` 4.3, le cache disque mémorise un chemin erroné pour l'entrée virtuelle de l'application ; dès le second lancement, `Failed to resolve import … nuxt-vitest-app-entry.js`. Invisible en CI (cache vide à chaque run). À retirer quand le correctif sera publié en amont.

## 2026-10-14 — Icônes Lucide embarquées

- **Décision** : collection `@iconify-json/lucide` installée (dépendance de développement), utilisée par Nuxt UI.
- **Alternatives écartées** : chargement des icônes à la demande depuis l'API publique Iconify (comportement par défaut sans collection locale).
- **Raison** : aucune requête vers un service tiers en production, icônes disponibles hors ligne et plus rapides.

## 2026-10-14 — CI GitHub Actions

- **Décision** : un workflow `ci.yml` sur chaque PR et chaque push sur `develop`/`main` : `npm ci`, lint, format, typage, tests, build, E2E (Chromium). Rapport Playwright publié en cas d'échec.
- **Raison** : les portes de validation d'`AGENTS.md` sont vérifiées de la même façon pour tous, quel que soit le poste ou l'assistant IA.

## 2026-10-14 — Pas de Docker pour le front

- **Décision** : pas de conteneur pour le développement du front ; Docker sera introduit avec l'API ApiPlatform (Sprint 4).
- **Alternatives écartées** : environnement de développement Nuxt sous Docker.
- **Raison** : sous Windows, montage de fichiers lent et rechargement à chaud peu fiable. L'homogénéité est assurée par `.nvmrc`, `package-lock.json` (`npm ci`), `.gitattributes` et la CI.

## 2026-10-14 — Fins de ligne LF

- **Décision** : `.gitattributes` impose LF dans le dépôt.
- **Raison** : postes Windows et autres ; évite les diffs parasites.

## 2026-10-14 — Dépendances de l'éditeur Nuxt UI non déclarées

- **Décision** : les paquets `@tiptap/*` (pairs du composant éditeur de Nuxt UI) ne sont pas déclarés dans `package.json` ; npm les installe automatiquement comme dépendances pairs.
- **Raison** : ne pas encombrer `package.json` de 17 paquets inutilisés. À déclarer si l'éditeur riche est utilisé un jour.

## 2026-10-14 — Vulnérabilités `npm audit` acceptées

- **Décision** : vulnérabilités signalées par `npm audit` acceptées en l'état, sans `overrides` : `node-forge` (via `listhen`, serveur de dev), `braces` (via `nitropack`, outillage de build), `esbuild` (via `@nuxt/fonts`, serveur de dev sous Windows).
- **Alternatives écartées** : `npm audit fix --force` (rétrograderait Nuxt en 4.1) ; `overrides` (aucune version corrigée publiée pour `node-forge` et `braces`).
- **Raison** : outils de développement et de build uniquement, rien n'est livré au navigateur. À réévaluer à chaque mise à jour de Nuxt.

## 2026-11-02 — Modèle de données du front (`shared/types/`)

- **Décision** : types du domaine communs à `app/` et `server/`, calqués sur le format ApiPlatform (JSON-LD : `@id`, `@type`, relations en IRI). Champs du domaine en français (vocabulaire métier), comme dans l'ancienne version. Corrections par rapport à l'ancienne version :
  - ordre des pages et des traces porté par un seul tableau d'IRI ordonné (`Portfolio.pages`, `Page.traces`) ;
  - lien trace ↔ niveau de compétence par `Validation` avec l'**IRI** du niveau (et non son libellé, qui n'est pas unique) ;
  - usage de l'IA en codes texte (`non_renseigne`, `aucun`…) avec des libellés en `Record` exhaustif ;
  - type de trace `'image' | 'pdf' | 'video' | 'lien'` (et non un nom de classe PHP) ;
  - suppression douce par `dateSuppression` sur `Trace`, `Page` et `Portfolio` (corbeille, C-09) ;
  - statut de trace `brouillon` / `finalisee` (E-TR-05).
- **Alternatives écartées** : reprendre tel quel le modèle Doctrine de l'ancienne version (tables `OrdrePage` / `OrdreTrace` en 1-1 contredites par des liens N-N, enums entiers dont la valeur « non renseigné » n'a pas de libellé et fait planter l'affichage, cascades de suppression qui effacent la trace ou l'étudiant).
- **Raison** : une seule source de vérité par information, des erreurs détectées par TypeScript, et le même contrat de données pour les routes Nitro et la future API ApiPlatform. Le type de notification s'appelle `NotificationUtilisateur` pour ne pas masquer l'API `Notification` du navigateur (les types de `shared/types/` sont importés automatiquement partout).

## 2026-11-02 — Couche services et bascule vers ApiPlatform

- **Décision** : tout appel passe par `apiFetch()` (`app/services/api.ts`).
  - `runtimeConfig.public.apiBase` est une **origine** (vide = routes Nitro locales, `NUXT_PUBLIC_API_BASE` pour ApiPlatform) et les chemins sont toujours complets (`/api/...`). Le plugin `app/plugins/api.ts` la transmet une fois au démarrage : `apiFetch` n'appelle aucun composable Nuxt, car pendant le rendu serveur le contexte Nuxt est perdu après un `await` (une action de store qui enchaîne deux appels planterait).
  - `Accept: application/ld+json` est ajouté sans écraser les en-têtes de l'appelant (sinon ApiPlatform répond en JSON simple, sans `@id` ni `member`).
  - Toute erreur devient une `ApiError` (`status`, message en français). Le message du serveur (`detail` d'ApiPlatform, puis `message` de Nitro) n'est repris que pour 400, 409 et 422, rédigés pour l'utilisateur ; pour 401, 403, 404, 405 et 5xx, un message français par défaut (le serveur renvoie souvent de l'anglais ou des détails techniques, comme « Page not found: /api/… ») ; un message dédié couvre la panne réseau.
- **Alternatives écartées** : `baseURL: '/api'` (un IRI comme `/api/traces/12` deviendrait `/api/api/traces/12`) ; `useRuntimeConfig()` dans `apiFetch` (erreur `NUXT_E1001` en SSR après un `await`) ; `experimental.asyncContext` (option expérimentale de Nuxt) ; laisser remonter la `FetchError` d'ofetch (chaque composant devrait traduire les erreurs lui-même).
- **Raison** : la bascule du Sprint 4 se limite à une variable d'environnement ; les composants affichent `error.message` sans traitement, et le format d'erreur d'ApiPlatform est déjà pris en charge.

## 2026-11-02 — Délai du hook de démarrage Nuxt dans Vitest

- **Décision** : `hookTimeout: 60_000` dans le projet Vitest `nuxt`.
- **Alternatives écartées** : délai passé à chaque fichier de test (à répéter partout) ; garder 10 s (un test sans import lourd échoue systématiquement).
- **Complément (2026-11-03)** : `testTimeout: 20_000` dans le même projet : le premier montage d'un formulaire complet et les attentes de la sauvegarde automatique (délai de 1,5 s) dépassaient la limite par défaut de 5 s quand toute la suite tourne en parallèle.
- **Raison** : sous Windows, le démarrage de l'environnement Nuxt (`beforeAll` de `@nuxt/test-utils`) prend 12 à 15 s. Même un test vide échouait ; `index.test.ts` ne passait que parce que l'import de la page laissait à Nuxt le temps de démarrer. Le délai ne concerne que ce démarrage : un test bloqué échoue toujours.

## 2026-11-02 — Thème du style A (éditorial) et polices servies par l'application

- **Décision** : le style « éditorial » (maquette `docs/design/maquette-a-editorial.png`) est porté uniquement par des jetons : palette `sarcelle` et variables `--ui-*` de Nuxt UI dans `app/assets/css/main.css`, couleurs `primary` / `neutral` dans `app/app.config.ts`, classes `bg-cadre`, `rounded-feuille`, `rounded-panneau`, `font-serif`. La couleur d'action est le sarcelle 700 en mode clair (texte blanc à contraste AA) et 400 en mode sombre (texte foncé). Les polices Instrument Sans et Instrument Serif sont téléchargées au build par `@nuxt/fonts` (fourni par Nuxt UI) et servies par l'application ; un test E2E vérifie qu'aucune requête ne part vers Google.
- **Alternatives écartées** : polices chargées depuis Google Fonts (requête tierce à chaque visite, vie privée des étudiants) ; couleurs posées dans les composants (chaque ajustement visuel, prévu par l'équipe, toucherait des dizaines de fichiers) ; garder le primaire Nuxt UI par défaut en clair (500, contraste insuffisant avec un texte blanc).
- **Raison** : l'équipe ajustera le visuel plus tard ; tout changement se fait dans deux fichiers, et le contraste reste vérifié par axe en clair et en sombre.

## 2026-11-02 — Mises en page choisies par l'URL, navigation par espace

- **Décision** : deux mises en page, `espace` (barre latérale, menu plein écran sur téléphone, composants `UDashboard*` de Nuxt UI) et `default` (publique). Les règles de route (`routeRules` avec `appLayout` dans `nuxt.config.ts`) attribuent la mise en page `espace` aux préfixes `/etudiant`, `/enseignant` et `/admin`, au rendu serveur comme côté client ; une page peut toujours imposer la sienne avec `definePageMeta({ layout })`, qui reste prioritaire. La navigation de chaque espace vient d'une configuration unique (`app/utils/navigation.ts`) qui ne liste que des pages existantes ; un test le vérifie. La zone « compte » (`app/components/layout/AccountMenu.vue`) est le seul point à modifier pour afficher l'utilisateur connecté.
- **Alternatives écartées** : `definePageMeta({ layout })` dans chaque page (facile à oublier sur une nouvelle page) ; un middleware global qui appelle `setPageLayout` (première version, écartée à la relecture : il écrasait la mise en page déclarée par une page et dépendait de l'ordre des middlewares, dont la future garde d'authentification) ; navigation dépendant du rôle de l'utilisateur connecté (la charpente aurait attendu l'authentification ; c'est la garde de route qui décide qui entre dans un espace) ; barre latérale et menu mobile écrits à la main (focus piégé, Échap, retour du focus déjà fournis et testés par Nuxt UI).
- **Raison** : aucune page n'a à se soucier de sa mise en page, pas de saut visuel au chargement, et l'authentification se branche sans toucher aux mises en page.

## 2026-11-02 — Éditeur de trace : validation partagée et données de démo par visiteur

- **Décision** :
  - Les règles de validation d'une trace vivent une seule fois dans `shared/utils/trace-validation.ts`, utilisées par le formulaire (erreurs sous chaque champ) et par les routes Nitro (erreur 422 au format `ConstraintViolationList` d'ApiPlatform, que `ApiError.violations` sait lire).
  - Routes Nitro provisoires `GET` / `POST` / `PATCH` des traces : chaque visiteur reçoit un cookie de démonstration (`uf_demo`) et sa propre copie des traces en mémoire (`server/utils/trace-repository.ts`, 500 visiteurs au plus).
  - Pendant le rendu serveur, les appels transmettent le cookie du visiteur (`useApiRequestOptions`) : indispensable aussi pour l'authentification réelle.
  - Couleurs d'état (succès, alerte, erreur) en nuance 800 / 700 en mode clair et 400 en sombre : le défaut de Nuxt UI (500) ne donne pas un texte AA sur les pastilles teintées.
- **Alternatives écartées** : validation dupliquée côté client et côté serveur (divergence assurée) ; un seul jeu de données partagé par tous les visiteurs (les tests E2E en parallèle et les démonstrations du QA se marcheraient dessus) ; route de réinitialisation réservée aux tests (accès à protéger, tests dépendants de l'ordre d'exécution).
- **Raison** : un seul endroit pour les règles métier de saisie, des tests indépendants, et une couche services déjà prête à transmettre l'identité de l'utilisateur. Le dépôt en mémoire disparaît à la bascule vers ApiPlatform.

## 2026-11-02 — Titres en Instrument Sans (au lieu d'Instrument Serif)

- **Décision** : les titres passent en Instrument Sans graisse 600, interlettrage -0,02 em, via l'utilitaire `font-titre` de `app/assets/css/main.css` (seul endroit à modifier pour changer les titres). Instrument Serif n'est plus chargée.
- **Alternatives écartées** : garder Instrument Serif (choix initial de la maquette A, trop fine à l'écran selon l'équipe) ; Fraunces, Space Grotesk, Playfair Display (présentées sur maquette).
- **Raison** : choix de l'équipe (Enzo) sur comparaison visuelle ; une seule famille de polices, donc une requête de moins et un rendu plus net d'« application ».

## 2026-11-03 — Sauvegarde automatique des traces

- **Décision** : `createAutosave` (`app/utils/autosave.ts`, logique Vue pure, testée avec des minuteurs simulés) enregistre la saisie 1,5 s après la dernière modification, un seul envoi à la fois (la dernière valeur est renvoyée si elle a changé pendant l'envoi), jamais une saisie invalide, et se met en pause pendant un enregistrement explicite. `TraceEditor` l'utilise pour la création comme pour la modification : une nouvelle trace est créée en brouillon dès que son titre est valide, puis l'adresse devient celle de la trace (`history.replaceState`, sans recharger la page ni interrompre la saisie). La sauvegarde automatique garde le statut de la trace. En quittant la page, l'enregistrement en attente part d'abord ; une confirmation n'apparaît que s'il reste des modifications non enregistrées. Seuls « enregistré », « invalide » et « échec » sont annoncés aux lecteurs d'écran.
- **Alternatives écartées** : enregistrer à chaque frappe (requêtes en rafale) ; enregistrer seulement en quittant le champ (une fermeture d'onglet perdrait la saisie) ; naviguer vers la page de modification après la création automatique (la saisie tapée pendant le rechargement serait perdue) ; `useEventListener` de `@vueuse/core` (dépendance seulement indirecte, non déclarée).
- **Précisions après relecture** : la sauvegarde automatique envoie toujours le **statut enregistré** (un « Finaliser » refusé ne finalise pas en douce) ; la réécriture de l'adresse ne se fait que si l'éditeur est encore affiché à `/etudiant/traces/nouvelle` et met à jour `history.state.current` (sinon le routeur la défaisait à la navigation suivante) ; un double clic sur « Finaliser » n'enregistre qu'une fois ; l'enregistrement part aussi quand la page est masquée (mobile) ; un échec affiche sa cause et un bouton « Réessayer ».
- **Limite connue** : pas de détection des modifications simultanées dans deux onglets (la dernière écriture l'emporte) ; à traiter avec ApiPlatform (ETag ou numéro de version).

## 2026-11-03 — Fichiers des traces (image, PDF)

- **Décision** :
  - Formats acceptés : JPEG, PNG, WebP et GIF jusqu'à 2 Mo (comme l'ancienne version), PDF jusqu'à 10 Mo. Le **SVG est refusé** (il peut contenir du script).
  - Le format est reconnu sur le **contenu réel** du fichier (ses premiers octets), pas sur son extension ni sur le type déclaré par le navigateur. Les règles (`shared/utils/fichier.ts`) sont communes au formulaire (contrôle avant l'envoi, message immédiat) et au serveur (contrôle qui fait foi).
  - Routes Nitro provisoires `POST /api/fichiers` et `GET /api/fichiers/{id}` : fichiers rangés par visiteur (cookie de démo) dans le stockage **en mémoire** de Nitro, comme les traces (ils disparaissent ensemble au redémarrage). Plafonds : 10 fichiers et 30 Mo par visiteur, 100 visiteurs et 200 Mo pour tous (les plus anciens sont oubliés) ; envois d'un même visiteur traités un par un ; taille de l'envoi exigée et vérifiée avant lecture (411, 413). Identifiants aléatoires (UUID), noms nettoyés. Le fichier est servi au seul visiteur qui l'a déposé, avec `X-Content-Type-Options: nosniff`, `Cross-Origin-Resource-Policy: same-origin` et, pour les images, une CSP `sandbox`.
  - Une trace image ou PDF référence son fichier par son adresse ; le serveur vérifie que ce fichier appartient au visiteur et correspond au type (un fichier de l'ancienne version reste accepté s'il n'est pas modifié).
  - Une **légende est obligatoire pour finaliser une image** : elle sert de texte alternatif (accessibilité). Choix de l'équipe, à confirmer par le PO.
- **Alternatives écartées** : se fier à l'extension ou au type MIME envoyé (falsifiables) ; accepter le SVG (risque XSS) ; fichiers sur disque (`.data/`, première version : orphelins après redémarrage et disque saturable) ; plusieurs fichiers par trace (E-TR-03, retirée) ; le champ de dépôt de Nuxt UI tel quel (son libellé, ses formats et ses erreurs visent un élément caché aux lecteurs d'écran : le champ utilise un vrai bouton nommé et décrit).
- **Limites connues** : un script sans cookie peut, par envois répétés, faire oublier les fichiers de démonstration de tous les visiteurs (plafond global), et le nombre d'envois traités en même temps n'est pas plafonné ; acceptable pour des données factices, à revoir avec ApiPlatform. L'accès réservé au visiteur qui a déposé le fichier ne conviendra pas à l'enseignant évaluateur ni au portfolio public ; les droits d'accès seront définis avec ApiPlatform et l'authentification.
- **Raison** : sécurité et accessibilité exigées par le client ; tout ce provisoire disparaît avec le téléversement d'ApiPlatform (Sprint 4), le front ne dépendant que du contrat (`Fichier`, adresse du fichier dans `contenu`).

## 2026-11-03 — Pages maquettes alimentées par `app/demo/`

- **Décision** : toutes les pages des fonctionnalités retenues sont d'abord livrées en **maquettes** : interface complète, accessible et responsive, mais sans logique fonctionnelle. Leurs données viennent de fichiers de démonstration typés dans `app/demo/` (`base.ts` partagé, un fichier par domaine), importés explicitement (`~/demo/...`) pour rester faciles à repérer. Les actions sont sans effet ou en état local. Quand une page est branchée, elle passe par son store et `app/services/`, et cesse d'importer `app/demo/` ; le dossier disparaîtra avec la dernière maquette. Les types de `app/demo/` sont des modèles d'affichage propres aux maquettes, pas des types du domaine (`shared/types/` reste la seule référence). Un test E2E (`tests/e2e/maquettes-accessibilite.spec.ts`) vérifie que chaque maquette s'affiche et passe axe, en clair et en sombre.
- **Alternatives écartées** : de fausses routes Nitro et les stores dès maintenant (plus long, et empiète sur la couche back de Mathéo) ; des données en dur dans chaque page (dispersées, difficiles à retirer).
- **Raison** : montrer vite au client l'ensemble des écrans et valider les parcours avant de les rendre fonctionnels, sprint par sprint.

## 2026-11-04 — Recherche et filtres de « Mes traces » côté navigateur

- **Décision** : la liste charge toutes les traces, puis `app/utils/bibliotheque-filters.ts` applique la recherche et les filtres dans le navigateur ; les critères vivent dans l'URL. Les traces, les validations et le référentiel sont chargés ensemble : si l'une de ces sources échoue, la page affiche l'erreur et « Réessayer », comme le tableau de bord. Le filtre « statut » reprend les deux statuts du modèle (brouillon, finalisée). E-DB-06 et E-DB-07 restent **partielles** : le filtre par portfolio et la recherche de pages attendent les routes portfolio et pages (Sprint 2, Mathéo) ; aucun contrôle sans effet n'est affiché d'ici là.
- **Alternatives écartées** : filtrer côté serveur (routes de filtre prévues côté back, pas encore livrées ; à reconsidérer avec ApiPlatform si les volumes le justifient) ; afficher les traces sans compétences quand une source secondaire échoue (mode dégradé plus complexe, et un filtre compétence inopérant sans explication) ; un statut « évaluée » (dépend du point ouvert n° 9).
- **Raison** : livrer vite un écran utile avec un nombre de traces faible par étudiant, sans dépendre du back ; la logique reste pure et testée, donc facile à déplacer.

## 2026-11-23 — Pages-projets : chaque déplacement est enregistré tout de suite

- **Décision** :
  - Sur l'écran du portfolio (pages) et sur celui d'une page (traces), chaque déplacement (glisser-déposer ou flèches), ajout ou retrait est **enregistré aussitôt**, sans bouton « Enregistrer l'ordre ». L'écran est mis à jour tout de suite ; l'envoi suit.
  - Les envois d'un même écran passent par une file (`app/utils/serial-queue.ts`) : **un seul à la fois**, et les déplacements faits pendant un envoi sont regroupés en un seul envoi, avec l'ordre final. Une création ou une suppression de page attend son tour dans la même file, pour que l'ordre envoyé reprenne toujours les pages existantes.
  - En cas d'échec, la liste reprend le **dernier ordre enregistré** et une alerte (`role="alert"`) explique la cause.
  - La liste des traces à ajouter ne propose que les traces finalisées absentes de **toutes** les pages du portfolio (E-TR-06, réutiliser une trace, est retirée) ; le serveur reste seul juge.
  - Les informations du portfolio et sa publication restent en maquette (lot de Solène, point ouvert n° 14) : l'écran du portfolio mélange une partie branchée (pages) et une partie maquette. L'aperçu et la page publique lisent encore `app/demo/` et ne reflètent donc pas l'ordre enregistré.
  - Un changement mis en file derrière un envoi qui échoue est annulé avec lui : l'erreur reste affichée et aucune réussite n'est annoncée. Une suppression qui reçoit 404 (page déjà supprimée) compte comme réussie.
- **Limites connues (pour la bascule ApiPlatform, Mathéo)** : une trace mise à la corbeille reste dans `Page.traces` ; l'écran de la page la masque, mais le nombre de traces affiché dans la liste des pages la compte encore. À trancher côté back (retirer la trace des pages, ou exposer le nombre de traces visibles). L'écran du portfolio vérifie encore l'existence du portfolio par `app/demo/` (partie maquette) : à remplacer par `GET /api/portfolios/{id}` quand le lot de Solène sera branché.
- **Alternatives écartées** : un bouton « Enregistrer l'ordre » (travail perdu en quittant la page, et une étape de plus pour l'étudiant) ; une requête par déplacement sans file (deux réponses dans le désordre laisseraient un ordre périmé sur le serveur) ; laisser la liste dans l'ordre refusé (l'écran ne montrerait plus ce qui est enregistré).
- **Raison** : comportement cohérent avec la sauvegarde automatique des traces (E-TR-10) ; « ce qui est fait sur la page survit au rechargement » (issue #18).
