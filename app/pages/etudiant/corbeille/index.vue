<script setup lang="ts">
// MAQUETTE (C-09) : éléments supprimés de démonstration. « Restaurer » et « Supprimer
// définitivement » sont sans effet pour l'instant. Ajouter `?vide` à l'adresse affiche l'état vide.
import { formatDate } from '~/demo/base'
import {
  CORBEILLE,
  CORBEILLE_DUREE_JOURS,
  ELEMENT_SUPPRIME_TYPES,
  dateExpiration,
} from '~/demo/etudiant'

useSeoMeta({ title: 'Corbeille' })

const route = useRoute()

// Plus récemment supprimés d'abord
const elements = computed(() =>
  'vide' in route.query
    ? []
    : [...CORBEILLE].sort((a, b) => b.dateSuppression.localeCompare(a.dateSuppression)),
)
</script>

<template>
  <div>
    <h1 class="font-titre text-3xl text-highlighted">Corbeille</h1>
    <!-- Durée de conservation à confirmer avec le client (30 jours proposés par l'équipe) -->
    <p class="mt-3 max-w-2xl text-muted">
      Les traces, pages et portfolios supprimés restent ici {{ CORBEILLE_DUREE_JOURS }} jours avant
      d’être effacés définitivement. Vous pouvez les restaurer d’ici là.
    </p>

    <ul
      v-if="elements.length"
      class="mt-8 divide-y divide-default rounded-panneau bg-muted"
      aria-label="Éléments supprimés"
    >
      <li
        v-for="element in elements"
        :key="element.id"
        class="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex min-w-0 gap-4">
          <span
            class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-elevated text-highlighted"
            aria-hidden="true"
          >
            <UIcon :name="ELEMENT_SUPPRIME_TYPES[element.type].icon" class="size-4" />
          </span>
          <div class="min-w-0">
            <p class="text-sm text-muted">{{ ELEMENT_SUPPRIME_TYPES[element.type].label }}</p>
            <h2 class="font-medium wrap-break-word text-highlighted">{{ element.titre }}</h2>
            <p v-if="element.origine" class="text-sm text-muted">
              Dans le portfolio « {{ element.origine }} »
            </p>
            <p class="mt-1 text-xs text-muted">
              Supprimé le
              <time :datetime="element.dateSuppression">
                {{ formatDate(element.dateSuppression) }}
              </time>
              · effacé définitivement le
              <time :datetime="dateExpiration(element.dateSuppression)">
                {{ formatDate(dateExpiration(element.dateSuppression)) }}
              </time>
            </p>
          </div>
        </div>

        <div class="flex shrink-0 flex-wrap gap-2 pl-13 sm:pl-0">
          <UButton
            icon="i-lucide-rotate-ccw"
            color="neutral"
            variant="outline"
            size="sm"
            :aria-label="`Restaurer « ${element.titre} »`"
          >
            Restaurer
          </UButton>
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            :aria-label="`Supprimer définitivement « ${element.titre} »`"
          >
            Supprimer définitivement
          </UButton>
        </div>
      </li>
    </ul>

    <div v-else class="mt-8 flex flex-col items-center gap-3 rounded-panneau bg-muted px-6 py-12">
      <UIcon name="i-lucide-trash" class="size-8 text-muted" aria-hidden="true" />
      <p class="max-w-md text-center text-muted">
        La corbeille est vide. Les éléments que vous supprimez y restent
        {{ CORBEILLE_DUREE_JOURS }} jours.
      </p>
    </div>
  </div>
</template>
