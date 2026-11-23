<script setup lang="ts">
import { PAGE_LIMITS, validatePage } from '#shared/utils/page-validation'
import type { PageItem } from '~/composables/usePagesProjets'
import { formatDate } from '~/demo/base'
import {
  isPubliclyVisible,
  numericParam,
  portfolioById,
  publicPath,
  type DemoPortfolioForm,
} from '~/demo/portfolio'
import { ApiError, errorMessage } from '~/services/errors'

// Pages-projets (E-PG-01, E-PG-02, E-PG-04) : enregistrées par l'API.
// MAQUETTE pour le reste (E-PF-02, E-PF-03, E-PF-05, E-PF-06, lot de Solène) : informations et
// publication ne vivent que dans l'état local de la page, rien n'est enregistré.
const route = useRoute()
const found = portfolioById(numericParam(route.params.id))
if (!found) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
    message: 'Portfolio introuvable',
    fatal: true,
  })
}
const portfolio = found

// --- Informations (intitulé, introduction, bannière, visibilité) ---
const intitule = ref(portfolio.intitule)

// Le titre de l'onglet et le fil d'Ariane suivent l'intitulé enregistré
useSeoMeta({ title: () => `Modifier « ${intitule.value} »` })
const breadcrumb = computed(() => [
  { label: 'Mes portfolios', to: '/etudiant/portfolios' },
  { label: intitule.value },
])

const visibilite = ref(portfolio.visibilite)
const formMessage = ref('')
function onSubmit(values: DemoPortfolioForm) {
  intitule.value = values.intitule
  visibilite.value = values.visibilite
  formMessage.value =
    'Maquette : modifications appliquées à cette page seulement, rien n’est enregistré.'
}

// --- Publication (E-PF-05) et lien public (E-PF-06) ---
// À faire trancher par le PO : visibilité (public/privé) et publication sont deux réglages
// distincts ; un portfolio privé peut-il être « publié » (visible de l'équipe enseignante
// seulement) ou la publication suppose-t-elle un portfolio public ? En attendant, on interdit de
// publier un portfolio privé, sans changer le modèle.
const publie = ref(portfolio.publie)
const publicationMessage = ref('')
const isPublic = computed(() =>
  isPubliclyVisible({ visibilite: visibilite.value, publie: publie.value }),
)
const isPrivate = computed(() => visibilite.value === 'privee')
/** « Publier » reste focalisable mais inactif quand le portfolio est privé. */
const isPublishBlocked = computed(() => !publie.value && isPrivate.value)
const requestUrl = useRequestURL()
const publicUrl = `${requestUrl.origin}${publicPath(portfolio)}`
const publicLinkId = useId()
const publicationHintId = useId()
const statusSummary = computed(
  () => `${publie.value ? 'publié' : 'non publié'}, ${isPrivate.value ? 'privé' : 'public'}`,
)

function togglePublication() {
  if (isPublishBlocked.value) {
    publicationMessage.value =
      'Publication impossible : choisissez d’abord « Public » dans les informations, puis enregistrez.'
    return
  }
  // Le lien public ne « cesse de fonctionner » que s'il fonctionnait avant
  const hadPublicLink = isPublic.value
  publie.value = !publie.value
  if (publie.value) publicationMessage.value = 'Portfolio publié.'
  else
    publicationMessage.value = hadPublicLink
      ? 'Portfolio dépublié : son lien public ne fonctionne plus.'
      : 'Portfolio dépublié.'
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(publicUrl)
    publicationMessage.value = 'Lien public copié.'
  } catch {
    publicationMessage.value =
      'Copie impossible : sélectionnez le lien dans le champ et copiez-le vous-même.'
  }
}

// --- Pages-projets (E-PG-01, E-PG-02, E-PG-04) : branchées sur l'API ---
const {
  pages,
  status: pagesStatus,
  error: pagesLoadError,
  refresh: refreshPages,
  orderStatus,
  orderError,
  reorder,
  create,
  remove,
} = usePagesProjets(String(portfolio.id))
/** Échec d'une suppression, affiché et annoncé ; effacé par l'action suivante. */
const actionError = ref('')
const pagesOrder = computed({
  get: () => pages.value,
  set: (next) => {
    actionError.value = ''
    void reorder(next)
  },
})

const { message: pagesMessage, announce: announcePages } = useStatusMessage()
/** Échecs à montrer : l'ordre refusé et la suppression refusée peuvent coexister. */
const pagesAlerts = computed(() => [
  ...(orderStatus.value === 'error'
    ? [
        `L’ordre des pages n’a pas été enregistré : ${errorMessage(orderError.value)} Les pages ont repris leur ordre précédent.`,
      ]
    : []),
  ...(actionError.value ? [actionError.value] : []),
])
const pagesHeading = useTemplateRef('pagesHeading')

const isAdding = ref(false)
const isCreating = ref(false)
const newTitle = ref('')
const newTitleError = ref('')
const newTitleInput = useTemplateRef('newTitleInput')
const addButton = useTemplateRef('addButton')

function openAddForm() {
  isAdding.value = true
  nextTick(() => newTitleInput.value?.inputRef?.focus())
}

/** Ferme le formulaire d'ajout ; le focus revient au bouton « Ajouter une page ». */
function cancelAdd() {
  isAdding.value = false
  newTitle.value = ''
  newTitleError.value = ''
  nextTick(() => addButton.value?.$el?.focus())
}

async function addPage() {
  if (isCreating.value) return
  // Mêmes règles que l'écran de la page et que le serveur
  const result = validatePage({ intitule: newTitle.value, description: null })
  if (!result.ok) {
    newTitleError.value = result.violations[0]?.message ?? ''
    newTitleInput.value?.inputRef?.focus()
    return
  }
  isCreating.value = true
  actionError.value = ''
  try {
    const page = await create(result.value)
    void announcePages(`Page « ${page.intitule} » ajoutée en fin de liste.`)
    cancelAdd()
  } catch (cause) {
    // Erreur sous le champ (intitulé refusé par le serveur, panne réseau…), focus au champ
    const violation = cause instanceof ApiError ? cause.violations[0] : undefined
    newTitleError.value = violation?.message ?? errorMessage(cause)
    newTitleInput.value?.inputRef?.focus()
  } finally {
    isCreating.value = false
  }
}

// Suppression : confirmation obligatoire (action destructive, C-08)
const pageToDelete = ref<PageItem | null>(null)
// Gardé après la fermeture : le titre de la fenêtre ne se vide pas pendant son animation
const deleteLabel = ref('')
const isDeleteOpen = ref(false)
function askDelete(page: PageItem) {
  deleteLabel.value = page.intitule
  pageToDelete.value = page
  isDeleteOpen.value = true
}

async function confirmDelete() {
  const page = pageToDelete.value
  if (!page) return
  pageToDelete.value = null
  actionError.value = ''
  try {
    await remove(page)
    void announcePages(`Page « ${page.intitule} » supprimée.`)
  } catch (cause) {
    actionError.value = `La page « ${page.intitule} » n’a pas été supprimée : ${errorMessage(cause)}`
  }
}

/** Après suppression, le bouton qui a ouvert la confirmation n'existe plus : focus au titre. */
const deleteReturnFocus = (reason: 'confirm' | 'cancel') =>
  reason === 'confirm' ? pagesHeading.value : undefined

const traceCount = (page: PageItem) =>
  page.traces.length === 0
    ? 'Aucune trace'
    : `${page.traces.length} trace${page.traces.length > 1 ? 's' : ''}`
</script>

<template>
  <div>
    <!--
      Action principale de l'écran : « Publier », dans le panneau de publication (qui dit ce
      qu'elle fait). L'enregistrement des informations est une action secondaire de sa section.
    -->
    <!-- Titre : Le titre de la carte de « Mes portfolios » s'y transforme (même nom de transition) -->
    <UiEnTetePage
      titre="Modifier le portfolio"
      :transition-name="`portfolio-${portfolio.id}-titre`"
    >
      <template #avant>
        <UBreadcrumb :items="breadcrumb" aria-label="Fil d’Ariane" />
      </template>
      <template #chapeau>
        {{ intitule }} · année {{ portfolio.annee }} · modifié le
        {{ formatDate(portfolio.dateModification) }}
        <!-- Mobile et tablette : le panneau de publication suit le contenu, son état est rappelé ici -->
        <span class="mt-2 block text-sm text-default lg:hidden">
          Portfolio {{ statusSummary }} ·
          <a
            href="#publication-panneau"
            class="font-medium text-primary underline underline-offset-4"
          >
            Gérer la publication
          </a>
        </span>
      </template>
      <template #actions>
        <UButton
          :to="`/etudiant/portfolios/${portfolio.id}/apercu`"
          icon="i-lucide-eye"
          color="neutral"
          variant="outline"
        >
          Prévisualiser
        </UButton>
      </template>
    </UiEnTetePage>

    <div class="mt-8 grid gap-6 lg:grid-cols-[1fr_18rem] lg:gap-8">
      <div class="min-w-0 space-y-12">
        <section aria-labelledby="informations">
          <h2 id="informations" class="text-lg font-semibold text-highlighted">Informations</h2>
          <PortfolioForm
            class="mt-4"
            :initial="{
              intitule: portfolio.intitule,
              description: portfolio.description,
              visibilite: portfolio.visibilite,
              visibleRecruteurs: false,
            }"
            submit-label="Enregistrer les informations"
            submit-icon="i-lucide-save"
            secondary-submit
            @submit="onSubmit"
          />
          <p role="status" class="mt-3 text-sm text-muted" :class="{ 'sr-only': !formMessage }">
            {{ formMessage }}
          </p>
        </section>

        <section aria-labelledby="pages-projets">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="pages-projets"
                ref="pagesHeading"
                tabindex="-1"
                class="text-lg font-semibold text-highlighted focus:outline-none"
              >
                Pages-projets
              </h2>
              <p class="mt-1 max-w-mesure text-sm text-muted">
                Une page par projet, affichées dans cet ordre. Glissez-déposez une page ou utilisez
                les flèches pour la déplacer : l’ordre est enregistré à chaque déplacement.
              </p>
            </div>
            <UButton
              v-if="!isAdding && pagesStatus === 'success'"
              ref="addButton"
              icon="i-lucide-plus"
              color="neutral"
              variant="outline"
              @click="openAddForm"
            >
              Ajouter une page
            </UButton>
          </div>

          <form
            v-if="isAdding"
            novalidate
            class="mt-4 rounded-panneau bg-muted p-4 sm:p-6"
            @submit.prevent="addPage"
          >
            <UFormField
              label="Intitulé de la nouvelle page"
              name="nouvellePage"
              description="Par exemple le nom du projet. Vous ajouterez ses traces ensuite."
              :error="newTitleError || undefined"
            >
              <UInput
                ref="newTitleInput"
                v-model="newTitle"
                :maxlength="PAGE_LIMITS.intitule"
                autocomplete="off"
                class="w-full"
                @update:model-value="newTitleError = ''"
              />
            </UFormField>
            <div class="mt-4 flex flex-wrap justify-end gap-2">
              <!-- Pendant l'envoi, annuler ferait perdre son résultat (page créée ou erreur) -->
              <UButton color="neutral" variant="ghost" :disabled="isCreating" @click="cancelAdd">
                Annuler
              </UButton>
              <UButton type="submit" icon="i-lucide-plus" :loading="isCreating">
                {{ isCreating ? 'Ajout…' : 'Ajouter la page' }}
              </UButton>
            </div>
          </form>

          <!-- Zone d'alerte permanente : l'échec d'un enregistrement est annoncé dès qu'il s'affiche -->
          <div role="alert" class="mt-4 space-y-2 empty:hidden">
            <UAlert
              v-for="alert in pagesAlerts"
              :key="alert"
              color="error"
              variant="subtle"
              icon="i-lucide-circle-alert"
              :description="alert"
            />
          </div>

          <UiAsyncState
            :status="pagesStatus"
            :error="pagesLoadError"
            :empty="pages.length === 0"
            empty-title="Aucune page pour l’instant"
            empty-message="Une page par projet : ajoutez-en une avec « Ajouter une page », puis rangez-y les traces du projet."
            skeleton="liste"
            class="mt-4"
            @retry="refreshPages()"
          >
            <PortfolioOrderedList
              v-model="pagesOrder"
              label="Pages du portfolio"
              :item-label="(page) => page.intitule"
            >
              <template #item="{ item }">
                <p class="font-medium break-words text-highlighted">{{ item.intitule }}</p>
                <p class="text-sm break-words text-muted">
                  {{ traceCount(item)
                  }}<template v-if="item.description"> · {{ item.description }}</template>
                </p>
              </template>
              <template #actions="{ item }">
                <UButton
                  :to="`/etudiant/portfolios/${portfolio.id}/pages/${item.id}`"
                  icon="i-lucide-pencil"
                  color="neutral"
                  variant="ghost"
                  :aria-label="`Modifier la page « ${item.intitule} »`"
                />
                <UButton
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  :aria-label="`Supprimer la page « ${item.intitule} »`"
                  @click="askDelete(item)"
                />
              </template>
            </PortfolioOrderedList>
          </UiAsyncState>
          <p role="status" class="sr-only">{{ pagesMessage }}</p>
        </section>
      </div>

      <aside
        id="publication-panneau"
        aria-labelledby="publication"
        class="space-y-4 rounded-panneau bg-muted p-4 sm:p-6 lg:sticky lg:top-6 lg:self-start"
      >
        <h2 id="publication" class="text-sm font-semibold text-highlighted">Publication</h2>

        <div class="flex flex-wrap items-center gap-2">
          <UBadge
            :color="publie ? 'success' : 'neutral'"
            variant="subtle"
            :icon="publie ? 'i-lucide-circle-check' : 'i-lucide-circle-dashed'"
            class="rounded-full"
          >
            {{ publie ? 'Publié' : 'Non publié' }}
          </UBadge>
          <span class="flex items-center gap-1 text-sm text-default">
            <UIcon
              :name="visibilite === 'publique' ? 'i-lucide-globe' : 'i-lucide-lock'"
              class="size-4 text-muted"
              aria-hidden="true"
            />
            {{ visibilite === 'publique' ? 'Public' : 'Privé' }}
          </span>
        </div>

        <p :id="publicationHintId" class="text-sm text-muted">
          <template v-if="isPublishBlocked">
            Portfolio privé : il ne peut pas être publié et n’a pas de lien public. Choisissez «
            Public » dans les informations, puis enregistrez, pour le publier.
          </template>
          <template v-else-if="isPrivate">
            Portfolio privé : même publié, il n’a pas de lien public. Choisissez « Public » dans les
            informations, puis enregistrez, pour le partager.
          </template>
          <template v-else-if="publie">
            Toute personne disposant du lien peut consulter votre portfolio.
          </template>
          <template v-else>
            Prévisualisez votre portfolio, puis publiez-le pour activer son lien public.
          </template>
        </p>

        <UButton
          block
          :color="publie ? 'neutral' : 'primary'"
          :variant="publie ? 'outline' : 'solid'"
          :icon="publie ? 'i-lucide-eye-off' : 'i-lucide-send'"
          :aria-disabled="isPublishBlocked || undefined"
          :aria-describedby="isPublishBlocked ? publicationHintId : undefined"
          @click="togglePublication"
        >
          {{ publie ? 'Dépublier' : 'Publier' }}
        </UButton>

        <div v-if="isPublic" class="space-y-2 border-t border-default pt-4">
          <label :for="publicLinkId" class="block text-sm font-medium text-default">
            Lien public
          </label>
          <UInput :id="publicLinkId" :model-value="publicUrl" readonly class="w-full" />
          <div class="flex flex-wrap gap-2">
            <UButton
              icon="i-lucide-copy"
              color="neutral"
              variant="outline"
              size="sm"
              @click="copyLink"
            >
              Copier le lien
            </UButton>
            <UButton
              :to="publicPath(portfolio)"
              target="_blank"
              icon="i-lucide-external-link"
              color="neutral"
              variant="ghost"
              size="sm"
            >
              Ouvrir<span class="sr-only"> la page publique (nouvel onglet)</span>
            </UButton>
          </div>
        </div>

        <p role="status" class="text-sm text-default" :class="{ 'sr-only': !publicationMessage }">
          {{ publicationMessage }}
        </p>
      </aside>
    </div>

    <CommunConfirmationSuppression
      v-model:open="isDeleteOpen"
      :title="`Supprimer la page « ${deleteLabel} » ?`"
      description="La page et son ordre de traces seront supprimés. Les traces elles-mêmes restent dans votre bibliothèque."
      confirm-label="Supprimer la page"
      :return-focus="deleteReturnFocus"
      @confirm="confirmDelete"
      @cancel="pageToDelete = null"
    />
  </div>
</template>
