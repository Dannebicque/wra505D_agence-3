<script setup lang="ts">
import { fr } from '@nuxt/ui/locale'

// Libellés français propres à UniFolio : sur téléphone, la barre latérale est un « menu »
const locale = extendLocale(fr, {
  messages: {
    dashboardSidebar: { title: 'Menu', description: 'Navigation de l’espace' },
    dashboardSidebarToggle: { open: 'Ouvrir le menu', close: 'Fermer le menu' },
  },
})
</script>

<template>
  <!--
    scroll-body=false : à l'ouverture d'une fenêtre, pas de marge ajoutée à la place de la barre de
    défilement, déjà réservée par scrollbar-gutter (main.css) : le contenu ne se décale pas.
  -->
  <UApp :locale="locale" :scroll-body="false">
    <LayoutSkipLink />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
