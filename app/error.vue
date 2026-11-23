<script setup lang="ts">
import type { NuxtError } from '#app'
import { fr } from '@nuxt/ui/locale'

// Page d'erreur de l'application (C-10) : en français, dans la mise en page publique.
const props = defineProps<{ error: NuxtError }>()

const isNotFound = computed(() => props.error.statusCode === 404)
const title = computed(() => (isNotFound.value ? 'Page introuvable' : 'Une erreur est survenue'))
// Les pages lèvent leurs 404 avec `statusMessage: 'Not Found'` et un message français
// (ex. « Portfolio introuvable ») ; une route inconnue porte un message anglais de Nuxt, non affiché.
const description = computed(() => {
  if (!isNotFound.value) {
    return 'Réessayez dans un instant. Si le problème persiste, contactez l’équipe UniFolio.'
  }
  const detail =
    props.error.statusMessage === 'Not Found' && props.error.message
      ? props.error.message
      : 'Cette adresse ne correspond à aucune page'
  return `${detail}. Le lien est peut-être erroné, ou l’élément a été supprimé.`
})

// Retour à l'accueil de l'espace concerné, sinon à l'accueil du site
const espace = computed(() => espaceFromPath(useRoute().path))
const homePath = computed(() => (espace.value ? `/${espace.value}` : '/'))
const homeLabel = computed(() =>
  espace.value ? `Revenir à l’${ESPACE_LABELS[espace.value].toLowerCase()}` : 'Revenir à l’accueil',
)

useSeoMeta({ title })
</script>

<template>
  <!-- scroll-body=false : voir app.vue -->
  <UApp :locale="fr" :scroll-body="false">
    <LayoutSkipLink />
    <NuxtLayout name="default">
      <div class="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-16 sm:py-24">
        <p class="text-sm text-muted">Erreur {{ error.statusCode }}</p>
        <h1 class="font-titre text-4xl text-highlighted">{{ title }}</h1>
        <p class="text-lg text-muted">{{ description }}</p>
        <div>
          <UButton size="lg" @click="clearError({ redirect: homePath })">{{ homeLabel }}</UButton>
        </div>
      </div>
    </NuxtLayout>
  </UApp>
</template>
