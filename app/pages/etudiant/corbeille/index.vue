<script setup lang="ts">
// MAQUETTE (C-09) : éléments supprimés de démonstration. « Restaurer » est sans effet pour
// l'instant ; « Supprimer définitivement » (avec confirmation, C-08) retire l'élément de la liste
// dans l'état local de la page seulement. Ajouter `?vide` à l'adresse affiche l'état vide.
import { formatDate } from '~/demo/base'
import {
  CORBEILLE,
  CORBEILLE_DUREE_JOURS,
  ELEMENT_SUPPRIME_TYPES,
  dateExpiration,
  type DemoElementSupprime,
} from '~/demo/etudiant'

useSeoMeta({ title: 'Corbeille' })

const route = useRoute()

// Éléments effacés pendant cette visite (maquette : rien n'est enregistré)
const erasedIds = ref<number[]>([])

// Plus récemment supprimés d'abord
const elements = computed(() =>
  'vide' in route.query
    ? []
    : CORBEILLE.filter((element) => !erasedIds.value.includes(element.id)).sort((a, b) =>
        b.dateSuppression.localeCompare(a.dateSuppression),
      ),
)

// --- Suppression définitive : confirmation obligatoire (C-08) ---
const elementToErase = ref<DemoElementSupprime | null>(null)
// Gardé après la fermeture : le titre de la fenêtre ne se vide pas pendant son animation
const eraseLabel = ref('')
const isEraseOpen = ref(false)
const message = ref('')
const pageHeading = useTemplateRef('pageHeading')

function askErase(element: DemoElementSupprime) {
  elementToErase.value = element
  eraseLabel.value = element.titre
  isEraseOpen.value = true
}

function confirmErase() {
  const element = elementToErase.value
  if (!element) return
  erasedIds.value = [...erasedIds.value, element.id]
  message.value = `Suppression définitive de « ${element.titre} » effectuée.`
  elementToErase.value = null
}

/** La ligne supprimée emporte le bouton d'origine : le focus va au titre de la page. */
const eraseReturnFocus = (reason: 'confirm' | 'cancel') =>
  reason === 'confirm' ? pageHeading.value : undefined
</script>

<template>
  <div>
    <h1
      ref="pageHeading"
      tabindex="-1"
      class="font-titre text-2xl text-highlighted sm:text-3xl focus:outline-none"
    >
      Corbeille
    </h1>
    <!-- Durée de conservation à confirmer avec le client (30 jours proposés par l'équipe) -->
    <p class="mt-3 max-w-2xl text-muted">
      Les traces, pages et portfolios supprimés restent ici {{ CORBEILLE_DUREE_JOURS }} jours avant
      d’être effacés définitivement. Vous pouvez les restaurer d’ici là.
    </p>
    <p role="status" class="sr-only">{{ message }}</p>

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
          <UIcon
            :name="ELEMENT_SUPPRIME_TYPES[element.type].icon"
            class="mt-1 size-4 shrink-0 text-muted"
            aria-hidden="true"
          />
          <div class="min-w-0">
            <p class="text-sm text-muted">{{ ELEMENT_SUPPRIME_TYPES[element.type].label }}</p>
            <h2 class="font-medium wrap-break-word text-highlighted">{{ element.titre }}</h2>
            <p v-if="element.origine" class="text-sm text-muted">
              Dans le portfolio « {{ element.origine }} »
            </p>
            <p class="mt-1 text-xs text-muted">
              Suppression le
              <time :datetime="element.dateSuppression">
                {{ formatDate(element.dateSuppression) }}
              </time>
              · effacement définitif le
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
            @click="askErase(element)"
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

    <CommunConfirmationSuppression
      v-model:open="isEraseOpen"
      :title="`Supprimer définitivement « ${eraseLabel} » ?`"
      description="L’élément sera effacé tout de suite, sans attendre la fin du délai. Cette action est irréversible."
      confirm-label="Supprimer définitivement"
      :return-focus="eraseReturnFocus"
      @confirm="confirmErase"
      @cancel="elementToErase = null"
    />
  </div>
</template>
