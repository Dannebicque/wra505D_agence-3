<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
import type { Iri, Violation } from '#shared/types/api'
import type { PageInfo } from '#shared/types/portfolio'
import { PAGE_LIMITS, validatePage } from '#shared/utils/page-validation'
import type { PageTraceItem } from '~/composables/usePageProjet'
import { ApiError, errorMessage } from '~/services/errors'

// Page-projet (E-PG-01, E-TR-08) : intitulé, description et traces ordonnées, enregistrés par l'API.
const route = useRoute()
const portfolioId = String(route.params.id)
const pageId = String(route.params.pageId)

const {
  portfolio,
  info,
  traces,
  available,
  usedElsewhereCount,
  status,
  error,
  refresh,
  tracesStatus,
  tracesError,
  reorderTraces,
  addTraces,
  removeTrace,
  saveInfo,
} = await usePageProjet(portfolioId, pageId)

// Page inconnue, ou d'un autre portfolio : vraie réponse 404, comme une adresse inconnue
if ((error.value as { statusCode?: number } | null)?.statusCode === 404) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
    message: 'Page introuvable',
    fatal: true,
  })
}

// Le titre de l'onglet et le fil d'Ariane suivent l'intitulé enregistré
useSeoMeta({
  title: () =>
    info.value.intitule ? `Modifier la page « ${info.value.intitule} »` : 'Modifier la page',
})
const editPath = `/etudiant/portfolios/${portfolioId}`
const breadcrumb = computed(() => [
  { label: 'Mes portfolios', to: '/etudiant/portfolios' },
  { label: portfolio.value?.intitule ?? 'Portfolio', to: editPath },
  { label: info.value.intitule || 'Page' },
])

// Chapeau : à quel portfolio appartient la page, et ce qu'elle contient
const chapeau = computed(() => {
  if (!portfolio.value) return undefined
  const count = traces.value.length
  const content =
    count === 0 ? 'aucune trace pour l’instant' : `${count} ${count > 1 ? 'traces' : 'trace'}`
  return `Page-projet du portfolio « ${portfolio.value.intitule} » : ${content}.`
})

// --- Informations de la page ---
const state = reactive({ intitule: '', description: '' })
watch(
  info,
  (saved) => {
    state.intitule = saved.intitule
    state.description = saved.description ?? ''
  },
  { immediate: true },
)
const { message: infoMessage, announce: announceInfo, clear: clearInfo } = useStatusMessage()
/** Échec de l'enregistrement des informations hors erreur de champ (réseau, serveur…). */
const infoError = ref('')
const isSavingInfo = ref(false)
const infoForm = useTemplateRef('infoForm')
const INFO_FIELDS = new Set(['intitule', 'description'])

const toFormErrors = (violations: Violation[]): FormError[] =>
  violations.map((v) => ({ name: v.propertyPath, message: v.message }))

function validate(values: Partial<typeof state>): FormError[] {
  const result = validatePage(values)
  return result.ok ? [] : toFormErrors(result.violations)
}

const { onError } = useFocusFirstError()

async function onSubmit() {
  // Valeurs normalisées (espaces retirés), celles que le serveur enregistrera
  const result = validatePage(state)
  if (!result.ok || isSavingInfo.value) return
  isSavingInfo.value = true
  infoError.value = ''
  // Un ancien « Page enregistrée. » ne doit pas côtoyer l'issue de ce nouvel envoi
  clearInfo()
  try {
    await saveInfo(result.value satisfies PageInfo)
    void announceInfo('Page enregistrée.')
  } catch (cause) {
    // Erreurs de champ sous le champ concerné ; les autres dans l'alerte du formulaire
    const violations = cause instanceof ApiError ? cause.violations : []
    const fieldErrors = violations.filter((v) => INFO_FIELDS.has(v.propertyPath))
    const others = violations.filter((v) => !INFO_FIELDS.has(v.propertyPath))
    infoForm.value?.setErrors(toFormErrors(fieldErrors))
    if (others.length || !fieldErrors.length) {
      const detail = others.length ? others.map((v) => v.message).join(' ') : errorMessage(cause)
      infoError.value = `La page n’a pas été enregistrée : ${detail}`
    }
    const first = fieldErrors[0]?.propertyPath
    if (first) nextTick(() => document.querySelector<HTMLElement>(`[name="${first}"]`)?.focus())
  } finally {
    isSavingInfo.value = false
  }
}

// --- Traces de la page, dans l'ordre (E-TR-08) ---
const tracesOrder = computed({
  get: () => traces.value,
  set: (next: PageTraceItem[]) => void reorderTraces(next),
})
const { message: tracesMessage, announce: announceTraces } = useStatusMessage()
const tracesHeading = useTemplateRef('tracesHeading')
const tracesAlert = computed(() =>
  tracesStatus.value === 'error'
    ? `Les traces de la page n’ont pas été enregistrées : ${errorMessage(tracesError.value)} La page a repris son état précédent.`
    : '',
)

async function onRemove(item: PageTraceItem) {
  // Le bouton cliqué disparaît : le focus revient au titre de la section
  const saving = removeTrace(item.trace['@id'])
  await nextTick()
  tracesHeading.value?.focus()
  // Échec : l'alerte de la section l'explique, rien à annoncer en plus
  if (await saving) {
    void announceTraces(
      `« ${item.trace.titre} » retirée de la page. Elle reste dans votre bibliothèque.`,
    )
  }
}

// --- Ajout de traces : traces finalisées de l'étudiant, absentes du portfolio ---
const availableItems = computed(() =>
  available.value.map(({ trace }) => ({
    label: trace.titre,
    description: `${TRACE_TYPE_LIBELLES[trace.type]} · ${formatDay(trace.dateCreation)}`,
    value: trace['@id'],
  })),
)
const selected = ref<Iri[]>([])
/** Traces cochées encore proposées (une trace en cours d'ajout quitte la liste). */
const selectedCount = computed(
  () => available.value.filter(({ trace }) => selected.value.includes(trace['@id'])).length,
)
const isAddingTraces = ref(false)
const { message: addMessage, announce: announceAdd } = useStatusMessage()
const addError = ref('')
const addForm = useTemplateRef('addForm')

function onSelectionChange() {
  addError.value = ''
}

async function addSelected() {
  if (isAddingTraces.value) return
  const added = available.value.filter(({ trace }) => selected.value.includes(trace['@id']))
  if (added.length === 0) {
    // Erreur liée au groupe de cases (aria-describedby) ; le focus va à la première case
    addError.value = 'Cochez au moins une trace à ajouter.'
    await nextTick()
    addForm.value?.querySelector<HTMLElement>('[role="checkbox"]')?.focus()
    return
  }
  addError.value = ''
  const addedIris = added.map(({ trace }) => trace['@id'])
  isAddingTraces.value = true
  const saving = addTraces(addedIris).finally(() => (isAddingTraces.value = false))
  // Plus rien à ajouter : le formulaire disparaît avec le bouton cliqué, le focus va aux traces
  await nextTick()
  if (available.value.length === 0) tracesHeading.value?.focus()
  // Échec : les traces reviennent dans la liste, toujours cochées ; l'alerte explique la cause
  if (!(await saving)) return
  selected.value = selected.value.filter((traceIri) => !addedIris.includes(traceIri))
  void announceAdd(
    added.length === 1
      ? `« ${added[0]?.trace.titre} » ajoutée en fin de page.`
      : `${added.length} traces ajoutées en fin de page.`,
  )
}

const dayMonthYear = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Paris',
})
const formatDay = (date: string) => dayMonthYear.format(new Date(date))
</script>

<template>
  <div>
    <UiEnTetePage titre="Modifier la page" :chapeau="chapeau">
      <template #avant>
        <UBreadcrumb :items="breadcrumb" aria-label="Fil d’Ariane" />
      </template>
    </UiEnTetePage>

    <UiAsyncState
      :status="status"
      :error="error"
      skeleton="formulaire"
      :skeleton-count="2"
      class="mt-8"
      @retry="refresh()"
    >
      <div class="grid gap-6 lg:grid-cols-[1fr_20rem] lg:gap-8">
        <div class="min-w-0 space-y-12">
          <section aria-labelledby="informations">
            <h2 id="informations" class="text-lg font-semibold text-highlighted">Informations</h2>
            <UForm
              ref="infoForm"
              :state="state"
              :validate="validate"
              :validate-on="['blur']"
              novalidate
              class="mt-4 space-y-6"
              @submit="onSubmit"
              @error="onError"
            >
              <UFormField
                label="Intitulé"
                name="intitule"
                required
                description="Le plus souvent, le nom du projet."
                :hint="`${state.intitule.length} / ${PAGE_LIMITS.intitule}`"
              >
                <UInput
                  v-model="state.intitule"
                  name="intitule"
                  :maxlength="PAGE_LIMITS.intitule"
                  aria-required="true"
                  autocomplete="off"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Description"
                name="description"
                description="Contexte du projet : durée, équipe, commanditaire, votre rôle."
                :hint="`${state.description.length} / ${PAGE_LIMITS.description}`"
              >
                <UTextarea
                  v-model="state.description"
                  name="description"
                  :rows="3"
                  :maxlength="PAGE_LIMITS.description"
                  autoresize
                  class="w-full"
                />
              </UFormField>
              <!-- Actions en bas : le retour (tertiaire) puis l'enregistrement, action principale -->
              <div
                class="flex flex-col gap-2 border-t border-default pt-6 max-sm:*:justify-center sm:flex-row sm:flex-wrap sm:justify-end"
              >
                <UButton :to="editPath" color="neutral" variant="ghost" icon="i-lucide-arrow-left">
                  Retour au portfolio
                </UButton>
                <UButton type="submit" icon="i-lucide-save" :loading="isSavingInfo">
                  {{ isSavingInfo ? 'Enregistrement…' : 'Enregistrer la page' }}
                </UButton>
              </div>
            </UForm>
            <div role="alert" class="mt-3 empty:hidden">
              <UAlert
                v-if="infoError"
                color="error"
                variant="subtle"
                icon="i-lucide-circle-alert"
                :description="infoError"
              />
            </div>
            <p role="status" class="mt-3 text-sm text-muted" :class="{ 'sr-only': !infoMessage }">
              {{ infoMessage }}
            </p>
          </section>

          <section aria-labelledby="traces-de-la-page">
            <h2
              id="traces-de-la-page"
              ref="tracesHeading"
              tabindex="-1"
              class="text-lg font-semibold text-highlighted focus:outline-none"
            >
              Traces de la page
            </h2>
            <p class="mt-1 max-w-mesure text-sm text-muted">
              Affichées dans cet ordre sur votre portfolio. Glissez-déposez une trace ou utilisez
              les flèches pour la déplacer : l’ordre est enregistré à chaque déplacement.
            </p>

            <!-- Zone d'alerte permanente : l'échec d'un enregistrement est annoncé dès qu'il s'affiche -->
            <div role="alert" class="mt-4 empty:hidden">
              <UAlert
                v-if="tracesAlert"
                color="error"
                variant="subtle"
                icon="i-lucide-circle-alert"
                :description="tracesAlert"
              />
            </div>

            <!-- État vide : ce qui manque, et où se trouve l'étape suivante -->
            <div v-if="traces.length === 0" class="mt-4 rounded-panneau border border-default p-6">
              <p class="leading-titre font-semibold text-highlighted">
                Aucune trace dans cette page
              </p>
              <p class="mt-1 max-w-mesure text-muted">
                Cochez vos traces finalisées dans « Ajouter des traces », puis ajoutez la sélection.
              </p>
            </div>
            <PortfolioOrderedList
              v-else
              v-model="tracesOrder"
              class="mt-4"
              label="Traces de la page"
              :item-label="(item) => item.trace.titre"
            >
              <template #item="{ item }">
                <p class="font-medium break-words text-highlighted">{{ item.trace.titre }}</p>
                <p class="mt-1 text-sm text-muted tabular-nums">
                  {{ TRACE_TYPE_LIBELLES[item.trace.type] }} ·
                  {{ formatDay(item.trace.dateCreation) }}
                </p>
                <ul
                  v-if="item.competences.length"
                  class="mt-2 flex flex-wrap gap-2"
                  :aria-label="`Compétences de « ${item.trace.titre} »`"
                >
                  <li v-for="competence in item.competences" :key="competence['@id']">
                    <UBadge color="primary" variant="subtle" class="rounded-full">
                      {{ competence.nomCourt }}
                    </UBadge>
                  </li>
                </ul>
              </template>
              <template #actions="{ item }">
                <UButton
                  icon="i-lucide-circle-minus"
                  color="neutral"
                  variant="ghost"
                  :aria-label="`Retirer « ${item.trace.titre} » de la page`"
                  @click="onRemove(item)"
                />
              </template>
            </PortfolioOrderedList>
            <p role="status" class="sr-only">{{ tracesMessage }}</p>
          </section>
        </div>

        <aside
          aria-labelledby="ajouter-des-traces"
          class="space-y-4 rounded-panneau bg-muted p-4 sm:p-6 lg:sticky lg:top-6 lg:self-start"
        >
          <h2 id="ajouter-des-traces" class="text-sm font-semibold text-highlighted">
            Ajouter des traces
          </h2>
          <p class="text-sm text-muted">
            Seules vos traces finalisées peuvent être ajoutées, et chacune ne figure que dans une
            page du portfolio.
          </p>
          <form
            v-if="available.length"
            ref="addForm"
            novalidate
            class="space-y-4"
            @submit.prevent="addSelected"
          >
            <UFormField name="traces" :error="addError || undefined">
              <UCheckboxGroup
                v-model="selected"
                name="traces"
                legend="Traces disponibles"
                :items="availableItems"
                :ui="{ legend: 'sr-only', fieldset: 'gap-y-3' }"
                @update:model-value="onSelectionChange"
              />
            </UFormField>
            <!-- Secondaire : l'action principale de l'écran est l'enregistrement de la page -->
            <UButton
              type="submit"
              icon="i-lucide-plus"
              color="neutral"
              variant="outline"
              block
              :loading="isAddingTraces"
            >
              <template v-if="isAddingTraces">Ajout…</template>
              <template v-else>
                Ajouter la sélection<template v-if="selectedCount"> ({{ selectedCount }})</template>
              </template>
            </UButton>
          </form>
          <p v-else class="text-sm text-muted">
            <template v-if="traces.length === 0 && usedElsewhereCount === 0">
              Vous n’avez encore aucune trace finalisée.
            </template>
            <template v-else-if="usedElsewhereCount > 0">
              Vos autres traces finalisées sont déjà dans cette page ou dans une autre page du
              portfolio.
            </template>
            <template v-else>Toutes vos traces finalisées sont déjà dans cette page.</template>
          </p>
          <p role="status" class="text-sm text-default" :class="{ 'sr-only': !addMessage }">
            {{ addMessage }}
          </p>
          <UButton
            to="/etudiant/traces/nouvelle"
            icon="i-lucide-file-plus"
            color="neutral"
            variant="ghost"
            block
            class="justify-start"
          >
            Déposer une nouvelle trace
          </UButton>
        </aside>
      </div>
    </UiAsyncState>
  </div>
</template>
