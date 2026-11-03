<script setup lang="ts">
// MAQUETTE (E-EV-01, E-EV-02, E-EV-04 à E-EV-07) : données de démonstration et état local.
// Ajouter `?vide` à l'adresse affiche l'état vide.
import type { DemoRetour } from '~/demo/base'
import { RETOURS_ETUDIANT } from '~/demo/etudiant'

useSeoMeta({ title: 'Mes retours' })

type Filtre = 'tous' | DemoRetour['type']

const route = useRoute()

// Copie locale : marquer comme lu ne touche pas aux données de démonstration
const retours = ref<DemoRetour[]>(
  'vide' in route.query ? [] : RETOURS_ETUDIANT.map((r) => ({ ...r })),
)
const filtre = ref<Filtre>('tous')

// Plus récents d'abord
const tries = computed(() => [...retours.value].sort((a, b) => b.date.localeCompare(a.date)))
const affiches = computed(() =>
  filtre.value === 'tous' ? tries.value : tries.value.filter((r) => r.type === filtre.value),
)
const nonLus = computed(() => retours.value.filter((r) => !r.lu).length)

const filtres = computed(() => [
  { value: 'tous' as const, label: 'Tous', count: retours.value.length },
  {
    value: 'evaluation' as const,
    label: 'Évaluations',
    count: retours.value.filter((r) => r.type === 'evaluation').length,
  },
  {
    value: 'commentaire' as const,
    label: 'Commentaires',
    count: retours.value.filter((r) => r.type === 'commentaire').length,
  },
])

// Message annoncé par les lecteurs d'écran après « Tout marquer comme lu »
const annonce = ref('')

function markAllRead() {
  if (nonLus.value === 0) return
  for (const retour of retours.value) retour.lu = true
  annonce.value = 'Tous les retours sont marqués comme lus.'
}

function markRead(retour: DemoRetour) {
  retour.lu = true
}

const emptyMessage = computed(() => {
  if (retours.value.length === 0) {
    return 'Vous n’avez encore reçu aucun retour. Les évaluations et commentaires de vos enseignants apparaîtront ici.'
  }
  return filtre.value === 'evaluation'
    ? 'Aucune évaluation pour l’instant.'
    : 'Aucun commentaire pour l’instant.'
})
</script>

<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="font-titre text-2xl text-highlighted sm:text-3xl">Mes retours</h1>
        <p class="mt-3 text-muted">
          <template v-if="nonLus === 0">Aucun retour non lu.</template>
          <template v-else-if="nonLus === 1">1 retour non lu.</template>
          <template v-else>{{ nonLus }} retours non lus.</template>
          Évaluations et commentaires de vos enseignants sur vos traces.
        </p>
      </div>
      <!-- aria-disabled plutôt que disabled : le bouton garde le focus après le clic -->
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-check-check"
        :aria-disabled="nonLus === 0"
        :class="{ 'cursor-not-allowed opacity-75': nonLus === 0 }"
        @click="markAllRead"
      >
        Tout marquer comme lu
      </UButton>
    </div>
    <p role="status" class="sr-only">{{ annonce }}</p>

    <div role="group" aria-label="Filtrer les retours" class="mt-8 flex flex-wrap gap-2">
      <UButton
        v-for="f in filtres"
        :key="f.value"
        :color="filtre === f.value ? 'primary' : 'neutral'"
        :variant="filtre === f.value ? 'solid' : 'outline'"
        :aria-pressed="filtre === f.value"
        size="sm"
        @click="filtre = f.value"
      >
        {{ f.label }}
        <span :class="filtre === f.value ? '' : 'text-muted'">({{ f.count }})</span>
      </UButton>
    </div>

    <ul
      v-if="affiches.length"
      class="mt-4 divide-y divide-default overflow-hidden rounded-panneau bg-muted"
      aria-label="Retours"
    >
      <li v-for="retour in affiches" :key="retour.id">
        <RetourItem :retour="retour" @open="markRead(retour)" />
      </li>
    </ul>
    <div v-else class="mt-4 flex flex-col items-center gap-3 rounded-panneau bg-muted px-6 py-12">
      <UIcon name="i-lucide-inbox" class="size-8 text-muted" aria-hidden="true" />
      <p class="max-w-md text-center text-muted">{{ emptyMessage }}</p>
    </div>
  </div>
</template>
