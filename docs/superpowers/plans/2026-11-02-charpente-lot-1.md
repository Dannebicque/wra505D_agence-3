# Charpente visuelle, lot 1 (#7) : thème, cadre, navigation, clavier — plan d'implémentation

> **Pour les agents :** sous-skill requis : `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans`, tâche par tâche. Étapes en cases à cocher (`- [ ]`).

**Objectif :** livrer le thème du style A (clair et sombre), les deux mises en page (`espace`, publique), la navigation par espace et l'accessibilité clavier, avec les pages d'accueil des trois espaces.

**Architecture :** le thème vit dans `app/assets/css/main.css` (jetons CSS et palette) et `app/app.config.ts` (couleurs Nuxt UI) ; aucun composant ne porte de couleur en dur. Les mises en page s'appuient sur les composants `UDashboard*` de Nuxt UI (barre latérale, menu mobile en fenêtre modale avec focus piégé). Un middleware global choisit la mise en page selon le préfixe d'URL ; la navigation vient d'une configuration unique, filtrée par espace.

**Stack :** Nuxt 4.6, Nuxt UI 4.11 (Reka UI, Tailwind 4), `@nuxt/fonts` (fourni par Nuxt UI), Vitest 5, Playwright + axe.

**Spec :** `docs/superpowers/specs/2026-11-02-charpente-visuelle-design.md` (référence visuelle : `docs/design/maquette-a-editorial.png`). Lot 1 = C-01, C-02, C-11 ; le lot 2 (#8 : confirmation, états, page d'erreur) n'est **pas** dans ce plan.

## Contraintes globales

- Valeurs du style A, copiées de la spec (le tableau de la spec fait foi) :
  - **Clair** : cadre `#eef1f4`, feuille `#ffffff` (bord `#e3e6ea`, rayon 16px), panneau `#f6f7f8` (rayon 22px), texte `#1f201d`, texte secondaire `#636361`, action sarcelle `#1b6e66` avec texte blanc, élément actif de la navigation `#e1e5ea`.
  - **Sombre** : cadre `#0f1214`, feuille `#16191c` (bord `#262a2e`), panneau `#1e2226`, texte `#e8eaeb`, secondaire `#a0a6ab`, action sarcelle éclairci (≈ `#4fb0a5`) avec texte foncé, élément actif `#262b30`.
- **Polices** : Instrument Sans (400, 500, 600) partout ; Instrument Serif (400) seulement pour le grand titre d'accueil. **Aucune requête vers `fonts.googleapis.com` ni `fonts.gstatic.com`** dans le build de production.
- **Contraste AA** dans les deux modes (texte 4,5:1, composants 3:1), vérifié par axe.
- **Valeurs visuelles** : jetons du thème ou classes Tailwind du thème uniquement, aucune couleur ni taille magique dans les composants. **Pas** d'ombre au repos, de dégradé, d'emoji, ni d'étiquette en majuscules espacées.
- **Code** : conventions d'AGENTS.md §8 ; composants de mise en page dans `app/components/layout/` ; textes d'interface en français.
- **Fichiers partagés** touchés (`app/app.config.ts`, `main.css`, `nuxt.config.ts`) : à signaler dans la PR.

## Points de vigilance pour la relecture

1. **Liens morts** : un lien de navigation pointe vers une page qui n'existe pas encore → test de la tâche 2 qui vérifie l'existence du fichier de page pour chaque lien.
2. **Préfixes trompeurs** : une URL qui commence comme un espace sans en être un (`/etudiants`, `/administration`) est classée par erreur dans un espace → tâche 2.
3. **Menu mobile** : il reste ouvert après un clic sur un lien, ou le focus ne revient pas au bouton menu après Échap → tâche 4 (E2E).
4. **Contraste du mode sombre** : la couleur d'action ou le texte secondaire ne passe pas AA → tâche 4 (axe en sombre sur chaque espace, ordinateur et téléphone).
5. **Rechargement d'une page d'espace** : le rendu serveur affiche la mise en page publique, puis la bonne après l'hydratation (saut visuel), parce que la mise en page est choisie côté client seulement → tâche 3 (test E2E sur le HTML servi, avant hydratation).

---

## Préparation

- [ ] Branche `feature/7-charpente-visuelle` (déjà créée, empilée sur `feature/5-socle-donnees`). Committer ce plan : `docs: ajoute le plan du lot 1 de la charpente visuelle`.

---

### Tâche 1 : thème et polices

**Fichiers :**
- Modifier : `app/assets/css/main.css`
- Créer : `app/app.config.ts`
- Tester : `tests/e2e/theme.spec.ts`
- Modifier : `docs/DECISIONS.md`

**Interfaces produites :**
- La palette Tailwind `sarcelle` (50 à 950), avec l'ancre `sarcelle-700 = #1b6e66`. Repères : 400 ≈ `#4fb0a5`, 900 ≈ `#164944`. Le constructeur complète l'échelle de façon régulière.
- `app.config.ts` : `ui.colors.primary = 'sarcelle'`, `ui.colors.neutral = 'slate'`.
- Les variables Nuxt UI, surchargées dans `:root` (clair) et `.dark` :
  - `--ui-primary` : 700 en clair, pour un texte blanc AA sur les boutons ; 400 en sombre ;
  - `--ui-bg` : la feuille ;
  - `--ui-bg-muted` : le panneau ;
  - `--ui-bg-elevated` : l'élément actif ;
  - `--ui-text`, `--ui-text-muted`, `--ui-border` : valeurs des contraintes globales.
- Deux jetons propres : `--uf-cadre` (fond du cadre, clair et sombre), exposé en classe `bg-cadre` via `@theme`, et `--uf-radius-panneau: 22px`.
- Polices déclarées dans `@theme` :
  - `--font-sans: 'Instrument Sans', …` ;
  - `--font-serif: 'Instrument Serif', …`, exposée en classe `font-serif`, réservée au titre d'accueil.
  - `@nuxt/fonts` les télécharge au build et les sert depuis l'application.

- [ ] **Étape 1 : tests qui échouent.** Dans `tests/e2e/theme.spec.ts`, sur `/` (page existante) :
  - **police** : `document.fonts.check('16px "Instrument Sans"')` vaut `true` après `document.fonts.ready`, et la `font-family` calculée du `body` commence par `"Instrument Sans"` ;
  - **aucune requête tierce** : aucune requête du chargement de la page n'a une URL contenant `fonts.googleapis.com` ou `fonts.gstatic.com` (écoute de `page.on('request')`) ;
  - **couleur d'action** : en mode clair, la couleur de fond calculée d'un bouton primaire de la page vaut `rgb(27, 110, 102)`. Ajouter à `app/pages/index.vue` les liens vers les espaces sous forme de `UButton` (voir tâche 3).
- [ ] **Étape 2 : vérifier l'échec.** `npm run build && npx playwright test tests/e2e/theme.spec.ts` → échec sur la police et la couleur.
- [ ] **Étape 3 : implémenter** `main.css` et `app.config.ts`. Si `@nuxt/fonts` ne télécharge pas les polices par défaut, régler son option de téléchargement local dans `nuxt.config.ts` (`fonts`), sans ajouter de dépendance.
- [ ] **Étape 4 : vérifier.** Même commande, puis `npm run test:e2e` → les tests d'axe existants passent toujours (contraste clair et sombre sur `/`).
- [ ] **Étape 5 : documenter.** Entrée « Thème du style A et polices servies par l'application » dans `docs/DECISIONS.md` : primaire 700 en clair pour le contraste ; alternative écartée : polices chargées depuis Google (requête tierce, vie privée).
- [ ] **Étape 6 : commit.** `feat: ajoute le thème du style éditorial et ses polices`.

---

### Tâche 2 : configuration de la navigation par espace

**Fichiers :**
- Créer : `app/utils/navigation.ts` (pur, sans dépendance Nuxt)
- Tester : `tests/unit/navigation.test.ts`

**Interfaces produites :**
```ts
export type Espace = 'etudiant' | 'enseignant' | 'admin'
export interface NavItem { label: string; to: string; icon?: string }
export const ESPACES: readonly Espace[]                    // ['etudiant', 'enseignant', 'admin']
export const ESPACE_LIBELLES: Record<Espace, string>        // 'Espace étudiant', 'Espace enseignant', 'Administration'
export const NAVIGATION: Record<Espace, readonly NavItem[]>
export function espaceFromPath(path: string): Espace | null
```
- `NAVIGATION` ne contient pour l'instant qu'un élément par espace : `{ label: 'Tableau de bord', to: '/<espace>', icon: 'i-lucide-layout-dashboard' }`. Chaque fonctionnalité future ajoutera sa ligne en même temps que sa page.
- `espaceFromPath` renvoie l'espace si le chemin vaut `/<espace>` ou commence par `/<espace>/`, et `null` sinon.

- [ ] **Étape 1 : tests qui échouent.**
  - `espaceFromPath` :
    - `'/etudiant'` → `'etudiant'`, `'/etudiant/traces/12'` → `'etudiant'`, `'/enseignant'` → `'enseignant'`, `'/admin/'` → `'admin'` ;
    - `'/'`, `'/etudiants'`, `'/administration'`, `'/portfolio/abc'` → `null`.
  - Chaque élément de `NAVIGATION[e]` a un `to` égal à `/${e}` ou commençant par `/${e}/`.
  - **Pas de lien mort** : pour chaque `to`, il existe un fichier de page, soit `app/pages${to}.vue`, soit `app/pages${to}/index.vue` (vérifié avec `node:fs` depuis la racine du dépôt).
  - Chaque espace de `ESPACES` a un libellé et au moins un élément de navigation.
- [ ] **Étape 2 : vérifier l'échec.** `npx vitest run tests/unit/navigation.test.ts` → échec (module introuvable).
- [ ] **Étape 3 : implémenter** `app/utils/navigation.ts`, puis créer les trois pages d'accueil :
  - fichiers `app/pages/etudiant/index.vue`, `app/pages/enseignant/index.vue`, `app/pages/admin/index.vue` ;
  - chacune avec `useSeoMeta({ title })`, un `h1` (le libellé de l'espace) et une phrase sans faux contenu, par exemple « Votre tableau de bord arrive au fil des prochains sprints. ».
- [ ] **Étape 4 : vérifier.** Même commande → PASS. Lancer aussi `npm run typecheck`.
- [ ] **Étape 5 : commit.** `feat: ajoute la navigation par espace et les pages d'accueil des espaces`.

---

### Tâche 3 : mises en page et choix automatique

**Fichiers :**
- Créer :
  - `app/layouts/default.vue` : mise en page publique ;
  - `app/layouts/espace.vue` ;
  - `app/middleware/layout.global.ts` ;
  - `app/components/layout/AppLogo.vue` ;
  - `app/components/layout/AccountMenu.vue` ;
  - `app/components/layout/SkipLink.vue`.
- Modifier :
  - `app/app.vue` : `SkipLink`, puis `NuxtLayout` autour de `NuxtPage` ;
  - `app/pages/index.vue` : mise en page publique, liens vers les trois espaces.
- Tester :
  - `tests/nuxt/layout/espace.test.ts` ;
  - `tests/nuxt/layout/skip-link.test.ts` ;
  - `tests/e2e/espaces.spec.ts`.

**Interfaces :**
- Consomme : `espaceFromPath`, `NAVIGATION`, `ESPACE_LIBELLES` (tâche 2) ; les jetons de la tâche 1.
- Produit :
  - `app/middleware/layout.global.ts` appelle `setPageLayout(espaceFromPath(to.path) ? 'espace' : 'default')`, **côté serveur comme côté client**. Aucune page n'a donc besoin de `definePageMeta({ layout })`.
  - `AppLogo` : la marque SVG (deux rectangles arrondis de la spec, en `currentColor` / primaire, `aria-hidden`) suivie du mot « UniFolio ». C'est un lien vers l'accueil de l'espace, ou vers `/` hors espace.
  - `AccountMenu` : zone « compte », qui ne contient pour l'instant que `UColorModeButton`. **Point d'extension réservé à l'authentification** (commentaire en tête de fichier).
  - `SkipLink` : un lien « Aller au contenu » vers `#contenu`. Il est visuellement masqué et devient visible au focus ; c'est le premier élément focalisable.
  - Mise en page `espace` :
    - `UDashboardGroup` ;
    - `UDashboardSidebar` en `mode="modal"` sur mobile, avec `AppLogo` en en-tête, `UNavigationMenu` vertical sur `NAVIGATION[espace]` dans un `nav` nommé « Navigation de l'espace », et `AccountMenu` en pied ;
    - `UDashboardPanel`, dont le contenu est dans `<main id="contenu" tabindex="-1">`.
    - Cadre `bg-cadre`, feuille en `--ui-bg` avec un bord, rayon 16px, décalée de 8px sur ordinateur.
    - Fermeture automatique du menu mobile à la navigation (`autoClose`).
  - Mise en page `default` (publique) : une barre haute (`AppLogo` à gauche, `UColorModeButton` à droite) et `<main id="contenu" tabindex="-1">` sur une feuille centrée.

- [ ] **Étape 1 : tests qui échouent.**
  - `tests/nuxt/layout/espace.test.ts`, en montant la mise en page `espace` (`mountSuspended`) avec la route `/etudiant` :
    - un `nav` nommé « Navigation de l'espace » contient le lien « Tableau de bord » vers `/etudiant`, avec `aria-current="page"` ;
    - un élément `main#contenu` est présent ;
    - le texte « UniFolio » est présent.
  - `tests/nuxt/layout/skip-link.test.ts` : `SkipLink` rend un lien de texte « Aller au contenu » et `href="#contenu"`.
  - `tests/e2e/espaces.spec.ts`, profil ordinateur :
    - le HTML servi par `GET /enseignant` (via `request.get`, **avant hydratation**) contient « Navigation de l'espace », et celui de `GET /` ne le contient pas (point de vigilance 5) ;
    - sur `/admin`, le `h1` est « Administration » et le lien « Tableau de bord » a `aria-current="page"`.
- [ ] **Étape 2 : vérifier l'échec.** `npx vitest run tests/nuxt/layout` → échec ; `npm run build && npx playwright test tests/e2e/espaces.spec.ts` → échec.
- [ ] **Étape 3 : implémenter** les fichiers listés. Si le texte des boutons ou des libellés internes de `UDashboardSidebar` (ouvrir et fermer le menu) n'est pas traduit par la locale `fr`, le fournir en français par les props.
- [ ] **Étape 4 : vérifier.** `npm run test`, puis `npm run build && npm run test:e2e` → PASS. Les tests existants de l'accueil passent toujours.
- [ ] **Étape 5 : commit.** `feat: ajoute les mises en page espace et publique`.

---

### Tâche 4 : parcours clavier, menu mobile et accessibilité des espaces

**Fichiers :**
- Tester : `tests/e2e/navigation-clavier.spec.ts`, `tests/e2e/espaces-accessibilite.spec.ts`
- Modifier : les composants de la tâche 3, si un test le demande.

**Interfaces :** consomme les mises en page de la tâche 3. Ne produit rien de nouveau.

- [ ] **Étape 1 : tests qui échouent ou qui révèlent un défaut.**
  - `navigation-clavier.spec.ts`, profils ordinateur et téléphone, sur `/etudiant` après hydratation (`gotoHydrated`) :
    - **lien d'évitement** : la première pression sur `Tab` met le focus sur « Aller au contenu », qui devient visible ; `Entrée` place le focus sur `main#contenu`.
    - **menu mobile**, profil téléphone seulement :
      - la navigation de l'espace n'est pas visible au départ ;
      - le bouton d'ouverture du menu (nom accessible en français) l'ouvre, et le focus passe dans le menu ;
      - `Échap` le ferme et le focus revient sur le bouton d'ouverture ;
      - en le rouvrant puis en cliquant sur « Tableau de bord », le menu se ferme.
  - `espaces-accessibilite.spec.ts` : pour chaque espace (`/etudiant`, `/enseignant`, `/admin`), en mode clair puis sombre, sur les deux profils, aucune violation axe WCAG 2.2 A/AA (mêmes étiquettes que `tests/e2e/accueil.spec.ts`).
- [ ] **Étape 2 : lancer.** `npm run build && npx playwright test tests/e2e/navigation-clavier.spec.ts tests/e2e/espaces-accessibilite.spec.ts`. Si tout passe d'emblée parce que `UDashboardSidebar` fournit déjà le comportement, le noter dans le registre. Le test garde alors sa valeur de non-régression ; vérifier qu'il **peut** échouer, par exemple en retirant temporairement `id="contenu"`, puis remettre.
- [ ] **Étape 3 : corriger** chaque échec à la source : contraste par les jetons de la tâche 1, focus et nom accessible dans les composants.
- [ ] **Étape 4 : vérifier.** `npm run test:e2e` → tout passe.
- [ ] **Étape 5 : commit.** `test: vérifie le parcours clavier et l'accessibilité des espaces`. Ajouter `fix: …` si des corrections ont été faites.

---

### Tâche 5 : validation finale et PR

- [ ] **Portes de validation** (AGENTS §7) : lint, format, typage, `npm run test`, build, `npm run test:e2e`.
- [ ] **Rendu** : captures de `/`, `/etudiant` et `/enseignant` à 390, 768 et 1440 px, en clair et en sombre (build de production), comparées à `docs/design/maquette-a-editorial.png` ; écarts notés.
- [ ] **Documentation** : `AGENTS.md` §1, arborescence (ajouter `layouts/`) ; `docs/DECISIONS.md` (choix de la mise en page par middleware : alternative écartée, `definePageMeta` dans chaque page, facile à oublier).
- [ ] **Relecture croisée** par un agent neuf (diff et objectif), puis correction des points bloquants.
- [ ] **Push et PR** vers `feature/5-socle-donnees` (`Closes #7`) : **accord de l'utilisateur requis**. Proposer l'entrée `AI_PROMPT_BOOK.md`.
