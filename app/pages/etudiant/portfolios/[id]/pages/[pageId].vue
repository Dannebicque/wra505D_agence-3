<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
import {
  competenceById,
  ETUDIANT_COURANT_ID,
  formatDate,
  TRACES,
  traceById,
  type DemoTrace,
} from '~/demo/base'
import { numericParam, PORTFOLIO_LIMITS, pageProjetById, portfolioById } from '~/demo/portfolio'

// MAQUETTE (E-PG-01, E-TR-08) : intitulé, description et traces ordonnées d'une page-projet.
// L'ordre, les ajouts et les retraits ne vivent que dans l'état local de la page.
const route = useRoute()
const portfolio = portfolioById(numericParam(route.params.id))
const found = portfolio ? pageProjetById(portfolio, numericParam(route.params.pageId)) : undefined
if (!portfolio || !found) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
    message: 'Page introuvable',
    fatal: true,
  })
}
const page = found

useSeoMeta({ title: `Modifier la page « ${page.intitule} »` })

const editPath = `/etudiant/portfolios/${portfolio.id}`
const breadcrumb = [
  { label: 'Mes portfolios', to: '/etudiant/portfolios' },
  { label: portfolio.intitule, to: editPath },
  { label: page.intitule },
]

// --- Informations de la page ---
const state = reactive({ intitule: page.intitule, description: page.description })
const infoMessage = ref('')

function validate(values: Partial<typeof state>): FormError[] {
  const errors: FormError[] = []
  if (!values.intitule?.trim())
    errors.push({ name: 'intitule', message: 'Donnez un intitulé à la page.' })
  return errors
}

const { onError } = useFocusFirstError()

function onSubmit() {
  infoMessage.value =
    'Maquette : modifications appliquées à cette page seulement, rien n’est enregistré.'
}

// --- Traces de la page, dans l'ordre (E-TR-08) ---
const traces = ref<DemoTrace[]>(
  page.traceIds.map((id) => traceById(id)).filter((t): t is DemoTrace => t !== undefined),
)
const tracesMessage = ref('')
const tracesHeading = useTemplateRef('tracesHeading')

function removeTrace(trace: DemoTrace) {
  traces.value = traces.value.filter((t) => t.id !== trace.id)
  tracesMessage.value = `« ${trace.titre} » retirée de la page. Elle reste dans votre bibliothèque.`
  // Le bouton cliqué disparaît : le focus revient au titre de la section
  nextTick(() => tracesHeading.value?.focus())
}

// --- Ajout de traces : traces finalisées de l'étudiant, absentes de la page ---
const available = computed(() =>
  TRACES.filter(
    (t) =>
      t.etudiantId === ETUDIANT_COURANT_ID &&
      t.statut === 'finalisee' &&
      !traces.value.some((inPage) => inPage.id === t.id),
  ),
)
const availableItems = computed(() =>
  available.value.map((t) => ({
    label: t.titre,
    description: `${TRACE_TYPE_LIBELLES[t.type]} · ${formatDate(t.date)}`,
    value: String(t.id),
  })),
)
const selected = ref<string[]>([])
const addMessage = ref('')
const addError = ref('')
const addForm = useTemplateRef('addForm')

function onSelectionChange() {
  addMessage.value = ''
  addError.value = ''
}

async function addSelected() {
  const added = available.value.filter((t) => selected.value.includes(String(t.id)))
  if (added.length === 0) {
    // Erreur liée au groupe de cases (aria-describedby) ; le focus va à la première case
    addError.value = 'Cochez au moins une trace à ajouter.'
    await nextTick()
    addForm.value?.querySelector<HTMLElement>('[role="checkbox"]')?.focus()
    return
  }
  traces.value = [...traces.value, ...added]
  selected.value = []
  addError.value = ''
  addMessage.value =
    added.length === 1
      ? `« ${added[0]?.titre} » ajoutée en fin de page.`
      : `${added.length} traces ajoutées en fin de page.`
  // Plus rien à ajouter : le formulaire disparaît avec le bouton cliqué, le focus va aux traces
  await nextTick()
  if (available.value.length === 0) tracesHeading.value?.focus()
}

const competenceNames = (trace: DemoTrace) =>
  trace.competences
    .map(({ competenceId }) => competenceById(competenceId)?.nomCourt)
    .filter((name): name is string => Boolean(name))
</script>

<template>
  <div>
    <UBreadcrumb :items="breadcrumb" aria-label="Fil d’Ariane" />
    <h1 class="mt-4 font-titre text-3xl text-highlighted">Modifier la page</h1>
    <p class="mt-2 text-muted">Page-projet du portfolio « {{ portfolio.intitule }} ».</p>

    <div class="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem] lg:gap-8">
      <div class="min-w-0 space-y-10">
        <section aria-labelledby="informations">
          <h2 id="informations" class="text-lg font-semibold text-highlighted">Informations</h2>
          <UForm
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
              :hint="`${state.intitule.length} / ${PORTFOLIO_LIMITS.pageIntitule}`"
            >
              <UInput
                v-model="state.intitule"
                :maxlength="PORTFOLIO_LIMITS.pageIntitule"
                aria-required="true"
                autocomplete="off"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Description"
              name="description"
              description="Contexte du projet : durée, équipe, commanditaire, votre rôle."
              :hint="`${state.description.length} / ${PORTFOLIO_LIMITS.pageDescription}`"
            >
              <UTextarea
                v-model="state.description"
                :rows="3"
                :maxlength="PORTFOLIO_LIMITS.pageDescription"
                autoresize
                class="w-full"
              />
            </UFormField>
            <div class="flex flex-wrap justify-end gap-3">
              <UButton :to="editPath" color="neutral" variant="outline">
                Retour au portfolio
              </UButton>
              <UButton type="submit">Enregistrer la page</UButton>
            </div>
          </UForm>
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
          <p class="mt-1 text-sm text-muted">
            Affichées dans cet ordre sur votre portfolio. Glissez-déposez une trace ou utilisez les
            flèches pour la déplacer.
          </p>

          <p v-if="traces.length === 0" class="mt-4 rounded-panneau bg-muted p-5 text-muted">
            Cette page ne contient encore aucune trace. Ajoutez-en depuis votre bibliothèque.
          </p>
          <PortfolioOrderedList
            v-else
            v-model="traces"
            class="mt-4"
            label="Traces de la page"
            :item-label="(trace) => trace.titre"
          >
            <template #item="{ item }">
              <p class="font-medium break-words text-highlighted">{{ item.titre }}</p>
              <p class="text-sm text-muted">
                {{ TRACE_TYPE_LIBELLES[item.type] }} · {{ formatDate(item.date) }}
              </p>
              <ul
                v-if="competenceNames(item).length"
                class="mt-2 flex flex-wrap gap-1.5"
                :aria-label="`Compétences de « ${item.titre} »`"
              >
                <li v-for="name in competenceNames(item)" :key="name">
                  <UBadge color="primary" variant="subtle" class="rounded-full">{{ name }}</UBadge>
                </li>
              </ul>
            </template>
            <template #actions="{ item }">
              <UButton
                icon="i-lucide-circle-minus"
                color="neutral"
                variant="ghost"
                :aria-label="`Retirer « ${item.titre} » de la page`"
                @click="removeTrace(item)"
              />
            </template>
          </PortfolioOrderedList>
          <p role="status" class="sr-only">{{ tracesMessage }}</p>
        </section>
      </div>

      <aside
        aria-labelledby="ajouter-des-traces"
        class="space-y-4 rounded-panneau bg-muted p-5 lg:sticky lg:top-6 lg:self-start"
      >
        <h2 id="ajouter-des-traces" class="text-sm font-semibold text-highlighted">
          Ajouter des traces
        </h2>
        <template v-if="available.length">
          <p class="text-sm text-muted">Seules vos traces finalisées peuvent être ajoutées.</p>
          <form ref="addForm" novalidate class="space-y-4" @submit.prevent="addSelected">
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
            <UButton type="submit" icon="i-lucide-plus" block>
              Ajouter la sélection<template v-if="selected.length">
                ({{ selected.length }})</template
              >
            </UButton>
          </form>
        </template>
        <p v-else class="text-sm text-muted">
          Toutes vos traces finalisées sont déjà dans cette page.
        </p>
        <p role="status" class="text-sm text-default" :class="{ 'sr-only': !addMessage }">
          {{ addMessage }}
        </p>
        <UButton
          to="/etudiant/traces/nouvelle"
          icon="i-lucide-file-plus"
          color="neutral"
          variant="link"
          class="px-0"
        >
          Déposer une nouvelle trace
        </UButton>
      </aside>
    </div>
  </div>
</template>
