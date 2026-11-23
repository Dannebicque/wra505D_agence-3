<!--
  Mise en page de la page d'accueil (#32) : pas de « feuille » bordée comme `default`, la page
  occupe toute la fenêtre ; sa barre a des liens d'ancre vers les sections, et un pied de page.
  `default` reste celle de la connexion et du portfolio public.
-->
<script setup lang="ts">
const SECTIONS = [
  { label: 'Comment ça marche', to: '#comment-ca-marche' },
  { label: 'Pour qui', to: '#pour-qui' },
  { label: 'Démo', to: '#demo' },
]
</script>

<template>
  <div class="zone-sure flex min-h-dvh flex-col bg-default">
    <!-- zone-sure : rien sous l'encoche ni sous les barres système (viewport-fit=cover) -->
    <header>
      <div
        class="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-12"
      >
        <LayoutAppLogo to="/" />
        <!-- Liens d'ancre à partir de `md` : sur téléphone, la page se lit en défilant -->
        <nav aria-label="Sections de la page" class="hidden md:block">
          <ul class="flex items-center gap-1">
            <li v-for="section in SECTIONS" :key="section.to">
              <UButton :to="section.to" color="neutral" variant="ghost">
                {{ section.label }}
              </UButton>
            </li>
          </ul>
        </nav>
        <div class="flex items-center gap-2">
          <UButton to="/connexion" color="neutral" variant="outline">Se connecter</UButton>
          <UColorModeButton />
        </div>
      </div>
    </header>

    <main id="contenu" tabindex="-1" class="flex-1 focus:outline-none">
      <slot />
    </main>

    <footer class="border-t border-default">
      <div
        class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-12"
      >
        <!-- Le nom en grand, au corps du titre de la page -->
        <AccueilTitre as="p" :lignes="['UniFolio']" />
        <p class="text-sm text-muted md:text-right">
          Portfolio de compétences de l’IUT de Troyes.<br />
          Projet WRA505, agence 3.
        </p>
      </div>
    </footer>
  </div>
</template>
