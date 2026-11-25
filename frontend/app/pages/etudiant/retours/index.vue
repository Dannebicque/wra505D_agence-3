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

/** Revient à tous les retours ; le bouton cliqué disparaît, le focus va au filtre « Tous ». */
async function showAll() {
  filtre.value = 'tous'
  await nextTick()
  document.querySelector<HTMLElement>('[data-filtre="tous"]')?.focus()
}

function markRead(retour: DemoRetour) {
  retour.lu = true
}

const chapeau = computed(() => {
  const unread =
    nonLus.value === 0
      ? 'Aucun retour non lu.'
      : `${nonLus.value} ${nonLus.value > 1 ? 'retours non lus' : 'retour non lu'}.`
  return `${unread} Évaluations et commentaires de vos enseignants sur vos traces.`
})

// État vide : ce qui manque, puis l'étape suivante (déposer une trace, ou revenir à tous les retours)
const emptyTitle = computed(() => {
  if (retours.value.length === 0) return 'Aucun retour pour l’instant'
  return filtre.value === 'evaluation' ? 'Aucune évaluation' : 'Aucun commentaire'
})
const emptyMessage = computed(() => {
  if (retours.value.length === 0) {
    return 'Vous n’avez encore reçu aucun retour. Les évaluations et commentaires de vos enseignants apparaîtront ici, dès qu’ils auront lu vos traces finalisées.'
  }
  return filtre.value === 'evaluation'
    ? 'Aucune évaluation pour l’instant.'
    : 'Aucun commentaire pour l’instant.'
})
</script>

<template>
  <div>
    <UiEnTetePage titre="Mes retours" :chapeau="chapeau">
      <template #actions>
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
      </template>
    </UiEnTetePage>
    <p role="status" class="sr-only">{{ annonce }}</p>

    <div role="group" aria-label="Filtrer les retours" class="mt-8 flex flex-wrap gap-2">
      <UButton
        v-for="f in filtres"
        :key="f.value"
        color="neutral"
        :variant="filtre === f.value ? 'solid' : 'outline'"
        :aria-pressed="filtre === f.value"
        :data-filtre="f.value"
        size="sm"
        @click="filtre = f.value"
      >
        {{ f.label }}
        <span class="tabular-nums" :class="{ 'text-muted': filtre !== f.value }">
          ({{ f.count }})
        </span>
      </UButton>
    </div>

    <UiAsyncState
      status="success"
      :empty="affiches.length === 0"
      :empty-title="emptyTitle"
      :empty-message="emptyMessage"
      class="mt-4"
    >
      <template #empty-action>
        <UButton v-if="retours.length > 0" color="neutral" variant="outline" @click="showAll">
          Voir tous les retours
        </UButton>
        <UButton
          v-else
          to="/etudiant/traces"
          color="neutral"
          variant="outline"
          icon="i-lucide-files"
        >
          Voir mes traces
        </UButton>
      </template>

      <!-- Liste de type boîte de réception : une feuille bordée, une ligne par retour -->
      <ul
        class="divide-y divide-default overflow-hidden rounded-panneau border border-default"
        aria-label="Retours"
      >
        <li v-for="retour in affiches" :key="retour.id">
          <RetourItem :retour="retour" @open="markRead(retour)" />
        </li>
      </ul>
    </UiAsyncState>
  </div>
</template>
