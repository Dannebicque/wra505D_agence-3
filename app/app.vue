<script setup lang="ts">
import { fr } from '@nuxt/ui/locale'
</script>

<template>
  <UApp :locale="fr">
    <LayoutSkipLink />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
