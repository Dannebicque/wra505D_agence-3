<script setup lang="ts">
import type { DemoPageProjet } from '~/demo/base'
import { formatDate } from '~/demo/base'
import {
  isPubliclyVisible,
  numericParam,
  PORTFOLIO_LIMITS,
  portfolioById,
  publicPath,
  type DemoPortfolioForm,
} from '~/demo/portfolio'

// MAQUETTE (E-PF-02, E-PF-03, E-PF-05, E-PF-06, E-PG-01, E-PG-02, E-PG-04) : tout se passe dans
// l'état local de la page (ordre des pages, publication, ajouts, suppressions), rien n'est enregistré.
const route = useRoute()
const found = portfolioById(numericParam(route.params.id))
if (!found) {
  throw createError({ statusCode: 404, statusMessage: 'Portfolio introuvable', fatal: true })
}
const portfolio = found

useSeoMeta({ title: `Modifier « ${portfolio.intitule} »` })

const breadcrumb = [
  { label: 'Mes portfolios', to: '/etudiant/portfolios' },
  { label: portfolio.intitule },
]

// --- Informations (intitulé, introduction, bannière, visibilité) ---
const intitule = ref(portfolio.intitule)
const visibilite = ref(portfolio.visibilite)
const formMessage = ref('')
function onSubmit(values: DemoPortfolioForm) {
  intitule.value = values.intitule
  visibilite.value = values.visibilite
  formMessage.value =
    'Maquette : modifications appliquées à cette page seulement, rien n’est enregistré.'
}

// --- Publication (E-PF-05) et lien public (E-PF-06) ---
const publie = ref(portfolio.publie)
const publicationMessage = ref('')
const isPublic = computed(() =>
  isPubliclyVisible({ visibilite: visibilite.value, publie: publie.value }),
)
const requestUrl = useRequestURL()
const publicUrl = `${requestUrl.origin}${publicPath(portfolio)}`
const publicLinkId = useId()

function togglePublication() {
  publie.value = !publie.value
  publicationMessage.value = publie.value
    ? 'Portfolio publié.'
    : 'Portfolio dépublié : son lien public ne fonctionne plus.'
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

// --- Pages-projets (E-PG-01, E-PG-02, E-PG-04) ---
type EditablePage = DemoPageProjet & {
  /** Ajoutée pendant cette visite (maquette) : pas encore de page d'édition. */
  isNew?: boolean
}
const pages = ref<EditablePage[]>(portfolio.pages.map((page) => ({ ...page })))
const pagesMessage = ref('')
const pagesHeading = useTemplateRef('pagesHeading')

const isAdding = ref(false)
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

function addPage() {
  const title = newTitle.value.trim()
  if (!title) {
    newTitleError.value = 'Donnez un intitulé à la page.'
    newTitleInput.value?.inputRef?.focus()
    return
  }
  const nextId = Math.max(0, ...pages.value.map((p) => p.id)) + 1000
  pages.value = [
    ...pages.value,
    { id: nextId, intitule: title, description: '', traceIds: [], isNew: true },
  ]
  pagesMessage.value = `Page « ${title} » ajoutée en fin de liste.`
  cancelAdd()
}

// Suppression : confirmation obligatoire (action destructive)
const pageToDelete = ref<EditablePage | null>(null)
// Gardé après la fermeture : le titre de la fenêtre ne se vide pas pendant son animation
const deleteLabel = ref('')
function askDelete(page: EditablePage) {
  deleteLabel.value = page.intitule
  pageToDelete.value = page
}
const isDeleteOpen = computed({
  get: () => pageToDelete.value !== null,
  set: (open: boolean) => {
    if (!open) pageToDelete.value = null
  },
})
const justDeleted = ref(false)

function confirmDelete() {
  const page = pageToDelete.value
  if (!page) return
  pages.value = pages.value.filter((p) => p.id !== page.id)
  pagesMessage.value = `Page « ${page.intitule} » supprimée.`
  justDeleted.value = true
  pageToDelete.value = null
}

/** Le bouton qui a ouvert la confirmation n'existe plus : le focus va au titre de la section. */
function onCloseAutoFocus(event: Event) {
  if (!justDeleted.value) return
  event.preventDefault()
  justDeleted.value = false
  pagesHeading.value?.focus()
}

const traceCount = (page: EditablePage) =>
  page.traceIds.length === 0
    ? 'Aucune trace'
    : `${page.traceIds.length} trace${page.traceIds.length > 1 ? 's' : ''}`
</script>

<template>
  <div>
    <UBreadcrumb :items="breadcrumb" aria-label="Fil d’Ariane" />

    <div class="mt-4 flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="font-titre text-3xl text-highlighted">Modifier le portfolio</h1>
        <p class="mt-2 text-muted">
          {{ intitule }} · année {{ portfolio.annee }} · modifié le
          {{ formatDate(portfolio.dateModification) }}
        </p>
      </div>
      <UButton
        :to="`/etudiant/portfolios/${portfolio.id}/apercu`"
        icon="i-lucide-eye"
        color="neutral"
        variant="outline"
      >
        Prévisualiser
      </UButton>
    </div>

    <div class="mt-8 grid gap-6 lg:grid-cols-[1fr_18rem] lg:gap-8">
      <div class="min-w-0 space-y-10">
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
              <p class="mt-1 text-sm text-muted">
                Une page par projet, affichées dans cet ordre. Glissez-déposez une page ou utilisez
                les flèches pour la déplacer.
              </p>
            </div>
            <UButton
              v-if="!isAdding"
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
            class="mt-4 rounded-panneau bg-muted p-4 sm:p-5"
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
                :maxlength="PORTFOLIO_LIMITS.pageIntitule"
                autocomplete="off"
                class="w-full"
                @update:model-value="newTitleError = ''"
              />
            </UFormField>
            <div class="mt-4 flex flex-wrap justify-end gap-2">
              <UButton color="neutral" variant="ghost" @click="cancelAdd">Annuler</UButton>
              <UButton type="submit" icon="i-lucide-plus">Ajouter la page</UButton>
            </div>
          </form>

          <p v-if="pages.length === 0" class="mt-4 rounded-panneau bg-muted p-5 text-muted">
            Aucune page pour l’instant. Ajoutez une page pour chacun de vos projets.
          </p>
          <PortfolioOrderedList
            v-else
            v-model="pages"
            class="mt-4"
            label="Pages du portfolio"
            :item-label="(page) => page.intitule"
          >
            <template #item="{ item }">
              <p class="flex flex-wrap items-center gap-2 font-medium text-highlighted">
                <span class="break-words">{{ item.intitule }}</span>
                <UBadge v-if="item.isNew" color="warning" variant="subtle" class="rounded-full">
                  Non enregistrée
                </UBadge>
              </p>
              <p class="text-sm text-muted">
                {{ traceCount(item)
                }}<template v-if="item.description"> · {{ item.description }}</template>
              </p>
            </template>
            <template #actions="{ item }">
              <UButton
                v-if="!item.isNew"
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
          <p role="status" class="sr-only">{{ pagesMessage }}</p>
        </section>
      </div>

      <aside
        aria-labelledby="publication"
        class="space-y-4 rounded-panneau bg-muted p-5 lg:sticky lg:top-6 lg:self-start"
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
          <span class="flex items-center gap-1.5 text-sm text-default">
            <UIcon
              :name="visibilite === 'publique' ? 'i-lucide-globe' : 'i-lucide-lock'"
              class="size-4 text-muted"
              aria-hidden="true"
            />
            {{ visibilite === 'publique' ? 'Public' : 'Privé' }}
          </span>
        </div>

        <p class="text-sm text-muted">
          <template v-if="visibilite === 'privee'">
            Portfolio privé : même publié, il n’a pas de lien public. Choisissez « Public » dans les
            informations pour le partager.
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

    <UModal
      v-model:open="isDeleteOpen"
      :title="`Supprimer la page « ${deleteLabel} » ?`"
      description="La page et son ordre de traces seront supprimés. Les traces elles-mêmes restent dans votre bibliothèque."
      :content="{ onCloseAutoFocus }"
    >
      <template #footer="{ close }">
        <div class="flex w-full flex-wrap justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="close">Annuler</UButton>
          <UButton color="error" icon="i-lucide-trash-2" @click="confirmDelete">
            Supprimer la page
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
