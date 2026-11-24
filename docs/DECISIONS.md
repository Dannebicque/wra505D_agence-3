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
- *Révisé le 2026-11-23 : le sarcelle est remplacé par le prune de l'IUT, voir « Identité IUT ».*

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
- *Révisé le 2026-11-23 : l'interlettrage suit désormais la taille du texte (jetons de main.css), `font-titre` ne porte plus que la famille et la graisse.*

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

## 2026-11-23 — Identité IUT : palettes prune et or, neutre teinté, finitions globales (#24)

- **Décision** :
  - **Couleurs** (`app/assets/css/main.css`, en OKLCH, teinte constante et clarté régulière de 50 à 950) : `prune` (violet de l'IUT, ancre `#4D3677` = prune 700, h 297,55) remplace `sarcelle`, supprimée, comme `primary` ; `or` (jaune de l'IUT, ancre `#F7B000` = or 400, h 79,41) est un **accent décoratif** : trait de l'élément actif de la navigation des espaces, page arrière du logo, fond de la sélection de texte (`::selection`, or 200 en clair, or 400 en sombre, sous un texte prune 950). Jamais de texte or, jamais d'information portée par l'or seul ; `warning` reste l'ambre (un état), distinct de l'or (aucun sens).
  - **Neutre** : `gris`, très légèrement teinté vers le prune (même teinte, chroma ≤ 0,01), au lieu de `slate`. Les surfaces et textes (`--ui-bg-*`, `--ui-text*`, `--ui-border`, `--uf-cadre`) gardent exactement les clartés validées du thème précédent, seule leur teinte change.
  - **Action** : prune 700 en clair (texte blanc ; survol prune 800), prune 400 en sombre (texte gris 900 ; survol prune 300). Anneau de focus `--ui-primary` dans les deux modes.
  - **Contrastes mesurés** (WCAG, script Node, sRGB) — clair : blanc sur prune 700 **9,95:1**, sur prune 800 **12,87:1** ; prune 700 (texte, lien, focus) sur blanc / muted / cadre / elevated **9,95 / 9,28 / 8,77 / 7,87:1** ; texte **16,43 / 15,32 / 14,48 / 12,99:1** ; texte atténué **6,04 / 5,63 / 5,32 / 4,77:1** ; sélection prune 950 sur or 200 **14,46:1** ; or 400 sur prune 700 (logo) **5,29:1** ; or 400 sur blanc **1,88:1** (d'où l'interdiction en texte), sur le cadre **1,66:1** (trait décoratif seulement : la pilule grise et la graisse signalent la page active). Sombre : gris 900 sur prune 400 **6,20:1**, sur prune 300 **9,00:1** ; prune 400 (texte, lien, focus) sur bg / muted / cadre / elevated **6,14 / 5,58 / 6,55 / 4,99:1** ; texte **14,62 / 13,27 / 15,58 / 11,87:1** ; texte atténué **7,15 / 6,49 / 7,62 / 5,81:1** ; trait or 400 sur le cadre **10,01:1** ; sélection prune 950 sur or 400 **9,63:1**.
  - **Typographie** : jetons `leading-corps` (1,6, appliqué aux paragraphes), `leading-interface` (1,25), `leading-titre` (1,25) ; interlignage et interlettrage des grands corps liés à la taille (`text-xl` / `2xl` : -0,01 em, `3xl` et plus : -0,02 em, interlignage 1,25 → 1,15), donc `font-titre` ne porte plus que la famille et la graisse ; `max-w-mesure` (65ch) pour le texte courant ; `text-wrap: pretty` (paragraphes) et `balance` (titres) ; `font-kerning: normal`, `font-optical-sizing: auto`. `tabular-nums` quitte le `body` et ne s'applique qu'aux nombres qui s'alignent (positions de la liste réordonnable, puis compteurs et tuiles en phase 2). Utilitaire `centre-optique` (`text-box: trim-both cap alphabetic`) pour un chiffre dans une pastille.
  - **Police de secours** : Instrument Sans est déclarée hors de `@theme` (`--font-instrument`), car @nuxt/fonts ne lit pas l'intérieur de `@theme` ; il produit désormais les polices de secours aux métriques ajustées (« Instrument Sans Fallback: Arial », `size-adjust`, `ascent-override`…). L'option `global` de la famille est retirée.
  - **Interaction** : `viewport-fit=cover` et utilitaire `zone-sure` (`env(safe-area-inset-*)`) sur les mises en page et le menu plein écran ; `scrollbar-gutter: stable` sur `html` (page publique) et `gouttiere-stable` sur le panneau qui défile dans les espaces, `scroll-body=false` sur `UApp` pour qu'une fenêtre qui s'ouvre ne décale rien ; boutons icône de 44 × 44 px au moins sous `pointer: coarse` (variante `square` du bouton dans `app.config.ts`) ; `experimental.viewTransition` (fondu de 150 ms) ; sous « réduire les animations », transitions de vue coupées et durées d'animation ramenées à 0,01 ms partout ; squelettes de `UiAsyncState` à la forme du contenu (`skeleton` : bloc, liste, tuiles, formulaire).
- **Alternatives écartées** : garder `slate` (bleu, chroma jusqu'à 0,04 : il jurait avec le violet, et les surfaces maison n'étaient déjà plus du slate) ; un neutre plus teinté (l'interface aurait viré au mauve, le violet doit rester un accent) ; nommer les palettes `violet` et `yellow` (noms déjà pris par Tailwind) ; l'or en texte ou en pastille sur fond clair sans texte foncé (1,88:1) ; or 600 pour le trait de navigation (3:1 mais moutarde, plus la couleur de l'IUT) ; forcer l'interlignage 1,25 sur les boutons Nuxt UI (hauteurs et zones tactiles modifiées) ; une utilitaire d'espacement « panneau » (conflits d'ordre avec les `p-*` posés à côté : les combinaisons de classes sont documentées en tête de `main.css`).
- **Raison** : donner les couleurs de l'IUT sans perdre la sobriété du style éditorial ni l'accessibilité (contrastes AA mesurés en clair et en sombre) ; poser une seule fois, pour les trois espaces, les règles que les écrans appliqueront.
- *Révisé le 2026-11-23 (audit WCAG 2.2 AA de la passe #24)* :
  - **Trait de la page courante** : prune (`bg-primary`) en clair, or 400 en sombre. En clair, l'or faisait 1,49:1 sur la pilule et la pilule 1,12:1 sur le cadre : seule la graisse distinguait la page courante. Mesuré : prune 700 sur la pilule (elevated) / le cadre **7,87 / 8,77:1** ; or 400 sur la pilule / le cadre en sombre **7,63 / 10,01:1**. L'or reste un décor (logo, sélection de texte, trait en sombre), jamais un texte.
  - **Contour des champs** (WCAG 1.4.11) : nouveau jeton `contour` (`--uf-contour`, gris 500 dans les deux modes), posé par `app.config.ts` sur les champs de saisie, `USelect`, `USelectMenu`, cases, radios et la piste de l'interrupteur éteint. Mesuré : clair **4,79 / 4,46:1** sur bg-default / bg-muted, sombre **3,69 / 3,35:1** ; curseur de l'interrupteur sur la piste **4,79:1** (clair) et **3,69:1** (sombre). `--ui-border-accented` (gris 300, 1,49:1) n'est pas modifié : il sert aussi aux boutons, badges et alertes « outline », aux séparateurs et au survol des cartes, qu'un gris 500 alourdirait sans gain d'accessibilité (leur texte les identifie).
  - **Option active des listes** (`USelect`, `USelectMenu`) : fond plein et anneau prune de 2 px, comme la recherche globale (le fond à 50 % faisait 1,1:1).

## 2026-11-23 — Écrans de la passe #24 : tableaux de bord, filtres, divulgation progressive

- **Décision** :
  - **Tableaux de bord** (étudiant et enseignant) : un panneau central (deux colonnes sur trois) porte la progression par compétence, avec un **taux d'acquisition** en grand et une barre segmentée par compétence, toutes à la même échelle, chaque part écrite en toutes lettres à côté de sa pastille (`app/components/tableau-de-bord/`). La couleur porte l'état (acquis, en cours, non acquis, en attente), le nom porte la compétence : « acquis » est le segment le plus marqué dans les deux modes (prune 700 en clair, prune 200 en sombre), chaque segment ≥ 3:1 contre le panneau. Les chiffres secondaires deviennent une liste sans surface ; le h1 passe à `text-2xl`. Le même graphique sert à `/etudiant/competences`, aux bilans et à la fiche d'un étudiant.
  - **Filtres longs ou à chercher** (compétence de « Mes traces », étudiant et groupe côté enseignant) : composant `CommunFiltreListe` (`USelectMenu` avec recherche), nommé par son libellé **et** sa valeur (`aria-labelledby` vers le libellé puis vers lui-même), synchronisé avec l'URL là où la page l'était déjà (pas sur les bilans). Les listes de 7 options ou moins restent des `USelect`.
  - **Divulgation progressive** : « Plus de détails » dans le formulaire de trace (contexte, date de réalisation, usage de l'IA), fermée par défaut, ouverte d'emblée si un de ces champs est renseigné et rouverte avec le focus sur le champ en cas d'erreur ; « Besoin d'aller plus loin ? » dans l'aide. Rien n'est replié sur l'écran d'évaluation : la déclaration d'usage de l'IA doit rester sous les yeux de l'évaluateur.
  - **Rythme** : chapeau à 2 pas du h1 ; mosaïques de panneaux à 3 pas (4 sur grand écran) ; lignes et cartes de liste entièrement cliquables par un lien étendu, avec le même état au survol et au focus clavier.
  - **Transitions d'élément partagé** : titre de carte → titre de page pour les portfolios (étudiant) et pour les traces, étudiants et portfolios (enseignant), noms uniques dans chaque page.
- **Alternatives écartées** : graphique en anneau (comparaison entre compétences difficile) ; couleur par compétence (les jetons `c1`…`c5` ne sont reliés à aucune couleur, et l'état est l'information utile) ; `UInputMenu` pour les filtres (le déclencheur bouton garde la lecture « libellé, valeur » une fois nommé) ; replier la déclaration d'IA à l'évaluation.
- **Taux d'acquisition** : part des évaluations **rendues** (hors « en attente ») qui sont acquises, même définition dans les deux espaces ; « Aucune évaluation pour l'instant » si rien n'est rendu ; l'arrondi ne dit jamais « 0 % » avec un acquis ni « 100 % » s'il en manque un.
- **À confirmer par le PO** : le panneau de répartition par compétence ajouté au tableau de bord enseignant (repris des bilans, P-ST-09) ; les brouillons « À terminer » devenus des liens vers l'éditeur ; le taux compté en évaluations plutôt qu'en compétences (point ouvert n° 11).
- **Raison** : des écrans d'arrivée lisibles d'un coup d'œil, sans perdre l'accessibilité (audit WCAG 2.2 AA de la passe : 0 bloquant restant, voir l'entrée précédente pour les corrections).

## 2026-11-23 — Le front dans `frontend/`, le back dans `backend/` (#26)

- **Décision** : l'application Nuxt complète (`app/`, `server/`, `shared/`, `tests/`, `public/`, `package.json`, configurations, `.nvmrc`, `.env.example`) est déplacée dans `frontend/` avec `git mv` (historique conservé). La future API ApiPlatform aura son dossier `backend/` (Sprint 4). Restent à la racine : `docs/`, `.github/`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `AI_PROMPT_BOOK.md`, `README.md`, `.gitignore`, `.gitattributes`. La CI s'exécute dans `frontend/`. Dans `AGENTS.md` et `docs/`, les chemins `app/`, `server/`… sont relatifs à `frontend/`.
- **Routes Nitro provisoires** : elles restent dans `frontend/server/`, car elles font partie de l'application Nuxt (même serveur, même build) ; elles disparaîtront avec la bascule vers ApiPlatform.
- **Alternatives écartées** : tout mettre dans `frontend/`, docs et règles IA comprises (ces documents concernent tout le projet, back compris) ; déplacer `server/` vers `backend/` (impossible sans sortir les routes de l'application Nuxt).
- **Conséquence pour l'équipe** : chaque branche créée avant ce déplacement doit être mise à jour (Git suit les fichiers renommés) ; les commandes se lancent depuis `frontend/`, et `npm ci` y est à refaire une fois.
- **Raison** : séparer clairement le front du back sur GitHub, à la demande de l'équipe.

## 2026-11-23 — Passe UI/UX : landing, hiérarchie des actions et profondeur (#32)

Design : `docs/superpowers/specs/2026-11-23-passe-ui-ux-design.md`.

- **Décision** :
  - **Hiérarchie des actions**, fixée dans `app.config.ts` :
    - principale : bouton plein prune, une seule par écran, placée en dernier ;
    - secondaire : `neutral` `outline` ;
    - tertiaire : `neutral` `ghost` ;
    - destructive : `error`, pleine seulement dans la confirmation.
    - Tous les boutons sont en demi-gras et s'enfoncent d'un pixel à l'appui. Les boutons pleins ont un reflet et une ombre courte (`shadow-touche`).
  - **En-tête de page commun** (`UiEnTetePage`) : fil d'Ariane, titre, chapeau factuel, puis les actions dans un ordre fixe (secondaires, puis principale). Sur téléphone, les actions s'empilent et la principale est en bas. Le composant porte aussi le nom de transition du titre et le remet en focus (`focusTitle`).
  - **Relief** : rien n'a d'ombre au repos, sauf ce qu'on presse et ce qui flotte (`shadow-flottant`). Un écran peut avoir au plus un aplat prune (`champ-fort`, prune 900), où les jetons `--ui-*` sont redéfinis. Contrastes mesurés sur prune 900 : texte 15,7:1, texte discret 10,4:1, contour 5,4:1, bouton or 8,3:1 (texte prune 950 sur or : 9,6:1).
  - **Tableaux de bord** : ils commencent par « À faire maintenant » (étudiant) ou « À évaluer maintenant » (enseignant), en aplat prune. Chaque ligne a un verbe et son bouton ; la plus pressante porte le bouton or.
    - Côté étudiant, l'ordre est : retours non lus, brouillons du plus récent au plus ancien, première compétence sans trace (`studentNextActions`).
    - L'indicateur devient un compte (« 3 sur 6 évaluations rendues sont acquises, soit 50 % »).
    - Le bloc « En chiffres » est retiré : ses valeurs sont dans la barre de synthèse ou dans les blocs.
  - **États vides** : `UiAsyncState` reçoit `empty-title` et un slot `empty-action`, qui propose l'étape suivante.
  - **Accueil `/`** : une mise en page dédiée (`layouts/accueil.vue`). La page comprend :
    - un grand titre ;
    - un aperçu de l'interface en HTML avec une bascule étudiant / enseignant ;
    - le parcours d'une trace en bordereau ;
    - « Pour qui » en aplat prune ;
    - les trois accès de démo.
    - Aucun chiffre ni témoignage n'est inventé.
- **Alternatives écartées** :
  - des aplats de couleur pleine page sur l'accueil (le prune serait devenu majoritaire) ;
  - un stagger au défilement (il retarde la lecture, déjà écarté en #24) ;
  - deux boutons pleins prune sur un tableau de bord (l'action du bloc prune est en or, l'en-tête garde la seule principale prune).
- **À confirmer par le PO** :
  - l'action « Évaluer ses traces », ajoutée à la fiche d'un étudiant ;
  - « Télécharger en PDF » (CV) et « Exporter en PDF » (bilans), mis en action principale alors qu'ils restent sans effet en maquette ;
  - des écrans sans action principale : portfolio publié, liste des étudiants, corbeille, retours.
- **Raison** : l'interface était jugée plate et ses actions sans ordre. Chaque écran dit maintenant ce qu'on y fait, et l'action principale est toujours au même endroit.

## 2026-11-24 — Surfaces mieux séparées, ombre des cartes cliquables (#32)

- **Constat** : panneau gris sur feuille blanche à 1,07:1 (sombre 1,10), bordure des cartes à 1,25 (1,22), piste des barres sur le panneau à 1,18 (1,12), cadre à 1,13 (1,07) : les blocs se confondaient.
- **Décision** : changer les clartés des jetons (`app/assets/css/main.css`) plutôt qu'ajouter des ombres partout. Paliers, clair / sombre : panneau 1,13 / 1,16, bordure 1,41 / 1,44, cadre 1,18 / 1,09 ; la piste sur le panneau reste à 1,17 en clair (le panneau a foncé avec elle) et passe à 1,15 en sombre ; `--ui-bg-accented` redéfini sous `bg-elevated` pour que le survol des boutons neutres « soft » fonce ; `--ui-border-accented` foncé pour que le survol d'une carte se voie encore. Les cartes cliquables d'une liste (traces, portfolios, traces à évaluer, bilans individuels, accès de démonstration) prennent `shadow-carte`, renforcée au survol et au focus (`shadow-carte-survol`), en noir avec un liseré clair en sombre, où une ombre prune ne se voyait pas.
- **Écartés** : des ombres sur tous les panneaux (tout aurait l'air de flotter, et l'ombre ne dirait plus « cliquable ») ; un gris encore plus foncé (l'écran s'alourdit sans mieux séparer).
- **Contraintes vérifiées** : texte discret sur `bg-elevated` 4,56:1 (clair), contour des champs sur le panneau 4,23 / 3,17:1, segments des barres de progression 3,17:1 au moins. Le contour des champs tombe à 2,76:1 sur `bg-elevated` en sombre : aucune commande n'y est posée (garde-fou écrit dans `main.css`).

## 2026-11-24 — Bascule vers ApiPlatform par un relais même origine (Sprint 4)

- **Décision** (PO, Mathéo) : le front relaie `/api/**` vers l'API (`frontend/server/middleware/api-proxy.ts`, variable `NUXT_API_PROXY`), au lieu d'appeler une autre origine. C'est tout ou rien sur `/api/**` ; sans la variable, les routes Nitro factices répondent. Les écrans encore sur `app/demo/` basculent un par un. Guide : `docs/BASCULE-API.md`.
- **Alternatives écartées** : appeler l'API sur son origine (`NUXT_PUBLIC_API_BASE`) : il faudrait `credentials: 'include'` sur chaque appel, et en production des cookies `SameSite=None; Secure` si les domaines diffèrent ; les liens `/api/fichiers/…` des traces seraient à réécrire.
- **Raison** : même origine en dev et en prod, donc cookie de session, fichiers et rendu serveur sans réglage ; le relais transmet l'IP du visiteur (`X-Forwarded-For`) pour la limite de connexion de l'API (`TRUSTED_PROXIES`).

## 2026-11-24 — Image de production du back (Sprint 4)

- **Décision** : une seule `backend/Dockerfile` à deux cibles (`dev`, `prod`) et `backend/compose.prod.yaml` : code et dépendances sans dev dans l'image, php.ini de production, opcache sans relecture des fichiers, migrations au démarrage, secrets par variables (`.env.prod`, jamais versionné), refus de démarrer avec l'`APP_SECRET` par défaut.
- **Alternatives écartées** : un second Dockerfile (extensions et réglages PHP dupliqués) ; le mode worker de FrankenPHP (plus rapide, mais l'état partagé entre requêtes demande une revue du code repris de l'ancienne version).
- **Raison** : la roadmap prévoit l'API sous Docker pour le Sprint 4 ; la même base d'image en dev et en prod évite les écarts d'extensions.

