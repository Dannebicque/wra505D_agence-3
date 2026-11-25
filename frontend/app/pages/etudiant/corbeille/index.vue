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
const pageHeader = useTemplateRef('pageHeader')

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

/**
 * La ligne supprimée emporte le bouton d'origine : le focus va au titre de la page, rendu
 * focalisable par programme seulement (tabindex="-1" : il n'entre pas dans l'ordre de tabulation).
 */
function eraseReturnFocus(reason: 'confirm' | 'cancel') {
  if (reason !== 'confirm') return undefined
  return pageHeader.value?.heading ?? undefined
}
</script>

<template>
  <div>
    <!-- Durée de conservation à confirmer avec le client (30 jours proposés par l'équipe) -->
    <UiEnTetePage
      ref="pageHeader"
      titre="Corbeille"
      :chapeau="`Les traces, pages et portfolios supprimés restent ici ${CORBEILLE_DUREE_JOURS} jours avant d’être effacés définitivement. Vous pouvez les restaurer d’ici là.`"
    />
    <p role="status" class="sr-only">{{ message }}</p>

    <UiAsyncState
      status="success"
      :empty="elements.length === 0"
      empty-title="La corbeille est vide"
      :empty-message="`Les éléments que vous supprimez y restent ${CORBEILLE_DUREE_JOURS} jours : vous pourrez les restaurer d’ici là.`"
      class="mt-8"
    >
      <!-- Cartes de liste ; elles ne mènent nulle part : les actions de ligne sont tertiaires -->
      <ul class="space-y-3" aria-label="Éléments supprimés">
        <li
          v-for="element in elements"
          :key="element.id"
          class="flex flex-col gap-3 rounded-feuille border border-default p-4 sm:flex-row sm:items-center sm:justify-between"
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
              <p class="mt-1 text-xs text-muted tabular-nums">
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

          <!-- Sur téléphone, les actions s'alignent sur le texte (icône size-4 + gap-4) -->
          <div class="flex shrink-0 flex-wrap gap-1 pl-8 sm:pl-0">
            <UButton
              icon="i-lucide-rotate-ccw"
              color="neutral"
              variant="ghost"
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
    </UiAsyncState>

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
