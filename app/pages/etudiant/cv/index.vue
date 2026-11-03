<script setup lang="ts">
// MAQUETTE (E-CV-01, E-CV-05, E-CV-06) : CV de démonstration modifié en état local, sans
// enregistrement. Le téléchargement PDF (E-CV-03) arrive au sprint 5. Pas de liens GitHub ou
// LinkedIn : E-CV-04 est retirée.
import {
  CV_DEMO,
  CV_VARIANTES,
  NIVEAUX_LANGUE,
  type CvVariante,
  type DemoCv,
} from '~/demo/etudiant'

useSeoMeta({ title: 'Mon CV' })

// Copie profonde : les modifications restent locales à la page
const cv = reactive<DemoCv>(structuredClone(CV_DEMO))
const variante = ref<CvVariante>('stage')
const varianteLabel = computed(
  () => CV_VARIANTES.find((v) => v.value === variante.value)?.label.toLowerCase() ?? '',
)

// Mobile : un bouton pour modifier, un pour l'aperçu (boutons à bascule, pas un motif d'onglets
// incomplet). Desktop : les deux côte à côte.
type View = 'edition' | 'apercu'
const view = ref<View>('edition')
const VIEWS: { label: string; value: View; icon: string }[] = [
  { label: 'Modifier', value: 'edition', icon: 'i-lucide-pencil' },
  { label: 'Aperçu', value: 'apercu', icon: 'i-lucide-eye' },
]

// Sections répétables -----------------------------------------------------------------------

type Section = 'experiences' | 'formations' | 'langues'

const SECTION_LABELS: Record<Section, string> = {
  experiences: 'Expérience',
  formations: 'Formation',
  langues: 'Langue',
}

let nextId = 100
// Chaque annonce est perçue, même identique à la précédente (deux langues ajoutées de suite)
const { message: announcement, announce } = useStatusMessage()

/** Place le focus dans le premier champ d'un élément (après ajout) ou sur un bouton d'ajout. */
async function focusSelector(selector: string) {
  await nextTick()
  document.querySelector<HTMLElement>(selector)?.focus()
}

function add(section: Section) {
  const id = nextId++
  if (section === 'experiences') {
    cv.experiences.push({ id, poste: '', structure: '', periode: '', description: '' })
  } else if (section === 'formations') {
    cv.formations.push({ id, diplome: '', etablissement: '', periode: '' })
  } else {
    cv.langues.push({ id, langue: '', niveau: 'B1 : intermédiaire' })
  }
  announce(`${SECTION_LABELS[section]} ajoutée.`)
  focusSelector(`[data-cv-item="${section}-${id}"] input`)
}

function remove(section: Section, id: number) {
  const list = cv[section]
  const index = list.findIndex((item) => item.id === id)
  if (index !== -1) list.splice(index, 1)
  announce(`${SECTION_LABELS[section]} supprimée.`)
  focusSelector(`[data-cv-add="${section}"]`)
}

// Compétences (étiquettes) --------------------------------------------------------------------

const newCompetence = ref('')

function addCompetence() {
  const value = newCompetence.value.trim()
  if (!value) return
  if (!cv.competences.some((c) => c.toLowerCase() === value.toLowerCase())) {
    cv.competences.push(value)
    announce(`Compétence « ${value} » ajoutée.`)
  } else {
    announce(`La compétence « ${value} » figure déjà dans le CV.`)
  }
  newCompetence.value = ''
}

function removeCompetence(competence: string) {
  cv.competences = cv.competences.filter((c) => c !== competence)
  announce(`Compétence « ${competence} » supprimée.`)
  focusSelector('#cv-nouvelle-competence')
}
</script>

<template>
  <div>
    <h1 class="font-titre text-3xl text-highlighted">Mon CV</h1>
    <p class="mt-3 max-w-2xl text-muted">
      Complétez votre CV et adaptez-le à chaque candidature. L’aperçu se met à jour au fil de la
      saisie.
    </p>
    <p role="status" class="sr-only">{{ announcement }}</p>

    <div
      class="mt-8 flex flex-col gap-4 rounded-panneau bg-muted p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6"
    >
      <URadioGroup
        v-model="variante"
        legend="Version du CV"
        :items="CV_VARIANTES"
        :ui="{
          legend: 'mb-2 text-sm font-semibold text-highlighted',
          fieldset: 'gap-y-3 sm:flex-row sm:gap-x-6',
        }"
      />
      <div class="flex flex-col items-start gap-1 lg:items-end">
        <!-- aria-disabled plutôt que disabled : le bouton reste focalisable, et « Bientôt
             disponible » est lu avec lui -->
        <UButton
          icon="i-lucide-download"
          aria-disabled="true"
          aria-describedby="cv-pdf-bientot"
          class="cursor-not-allowed opacity-75"
        >
          Télécharger en PDF
        </UButton>
        <p id="cv-pdf-bientot" class="text-xs text-muted">Bientôt disponible</p>
      </div>
    </div>

    <div role="group" aria-label="Afficher" class="mt-6 flex gap-2 lg:hidden">
      <UButton
        v-for="v in VIEWS"
        :key="v.value"
        :icon="v.icon"
        :color="view === v.value ? 'primary' : 'neutral'"
        :variant="view === v.value ? 'solid' : 'outline'"
        :aria-pressed="view === v.value"
        @click="view = v.value"
      >
        {{ v.label }}
      </UButton>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
      <section
        aria-labelledby="cv-edition"
        class="space-y-4"
        :class="{ 'max-lg:hidden': view !== 'edition' }"
      >
        <h2 id="cv-edition" class="sr-only">Modifier le CV</h2>

        <!-- Identité -->
        <fieldset class="space-y-4 rounded-panneau bg-muted p-5">
          <legend class="float-left mb-1 text-sm font-semibold text-highlighted">Identité</legend>
          <div class="clear-both grid gap-4 sm:grid-cols-2">
            <UFormField label="Prénom">
              <UInput v-model="cv.prenom" autocomplete="given-name" class="w-full" />
            </UFormField>
            <UFormField label="Nom">
              <UInput v-model="cv.nom" autocomplete="family-name" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Titre" description="Une ligne sous votre nom.">
            <UInput v-model="cv.titre" class="w-full" />
          </UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Adresse e-mail">
              <UInput v-model="cv.email" type="email" autocomplete="email" class="w-full" />
            </UFormField>
            <UFormField label="Téléphone">
              <UInput v-model="cv.telephone" type="tel" autocomplete="tel" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Ville">
            <UInput v-model="cv.ville" autocomplete="address-level2" class="w-full" />
          </UFormField>
        </fieldset>

        <!-- Accroche, propre à chaque variante (E-CV-06) -->
        <fieldset class="rounded-panneau bg-muted p-5">
          <legend class="float-left mb-3 text-sm font-semibold text-highlighted">Accroche</legend>
          <UFormField
            :label="`Accroche pour la ${varianteLabel}`"
            description="Chaque version du CV garde sa propre accroche."
            class="clear-both"
          >
            <UTextarea v-model="cv.accroches[variante]" :rows="4" autoresize class="w-full" />
          </UFormField>
        </fieldset>

        <!-- Expériences -->
        <fieldset class="rounded-panneau bg-muted p-5">
          <legend class="float-left mb-3 text-sm font-semibold text-highlighted">
            Expériences
          </legend>
          <p v-if="cv.experiences.length === 0" class="clear-both text-sm text-muted">
            Aucune expérience. Stages, projets, emplois d’été : tout compte.
          </p>
          <ol v-else class="clear-both space-y-4">
            <li
              v-for="(e, index) in cv.experiences"
              :key="e.id"
              :data-cv-item="`experiences-${e.id}`"
              class="space-y-3 rounded-feuille bg-default p-4"
            >
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-medium text-highlighted">Expérience {{ index + 1 }}</p>
                <UButton
                  icon="i-lucide-trash-2"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  :aria-label="`Supprimer l’expérience ${index + 1}${e.poste ? ` (${e.poste})` : ''}`"
                  @click="remove('experiences', e.id)"
                />
              </div>
              <UFormField label="Poste ou projet">
                <UInput v-model="e.poste" class="w-full" />
              </UFormField>
              <div class="grid gap-3 sm:grid-cols-2">
                <UFormField label="Structure">
                  <UInput v-model="e.structure" class="w-full" />
                </UFormField>
                <UFormField label="Période">
                  <UInput v-model="e.periode" placeholder="Ex. : été 2026" class="w-full" />
                </UFormField>
              </div>
              <UFormField label="Missions et réalisations">
                <UTextarea v-model="e.description" :rows="2" autoresize class="w-full" />
              </UFormField>
            </li>
          </ol>
          <UButton
            data-cv-add="experiences"
            icon="i-lucide-plus"
            color="neutral"
            variant="outline"
            size="sm"
            class="mt-4"
            @click="add('experiences')"
          >
            Ajouter une expérience
          </UButton>
        </fieldset>

        <!-- Formations -->
        <fieldset class="rounded-panneau bg-muted p-5">
          <legend class="float-left mb-3 text-sm font-semibold text-highlighted">Formations</legend>
          <p v-if="cv.formations.length === 0" class="clear-both text-sm text-muted">
            Aucune formation.
          </p>
          <ol v-else class="clear-both space-y-4">
            <li
              v-for="(f, index) in cv.formations"
              :key="f.id"
              :data-cv-item="`formations-${f.id}`"
              class="space-y-3 rounded-feuille bg-default p-4"
            >
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-medium text-highlighted">Formation {{ index + 1 }}</p>
                <UButton
                  icon="i-lucide-trash-2"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  :aria-label="`Supprimer la formation ${index + 1}${f.diplome ? ` (${f.diplome})` : ''}`"
                  @click="remove('formations', f.id)"
                />
              </div>
              <UFormField label="Diplôme">
                <UInput v-model="f.diplome" class="w-full" />
              </UFormField>
              <div class="grid gap-3 sm:grid-cols-2">
                <UFormField label="Établissement">
                  <UInput v-model="f.etablissement" class="w-full" />
                </UFormField>
                <UFormField label="Période">
                  <UInput v-model="f.periode" placeholder="Ex. : 2025 à 2028" class="w-full" />
                </UFormField>
              </div>
            </li>
          </ol>
          <UButton
            data-cv-add="formations"
            icon="i-lucide-plus"
            color="neutral"
            variant="outline"
            size="sm"
            class="mt-4"
            @click="add('formations')"
          >
            Ajouter une formation
          </UButton>
        </fieldset>

        <!-- Langues -->
        <fieldset class="rounded-panneau bg-muted p-5">
          <legend class="float-left mb-3 text-sm font-semibold text-highlighted">Langues</legend>
          <p v-if="cv.langues.length === 0" class="clear-both text-sm text-muted">Aucune langue.</p>
          <ol v-else class="clear-both space-y-3">
            <li
              v-for="(l, index) in cv.langues"
              :key="l.id"
              :data-cv-item="`langues-${l.id}`"
              class="grid grid-cols-[1fr_auto] items-end gap-3 rounded-feuille bg-default p-4 sm:grid-cols-[1fr_1fr_auto]"
            >
              <UFormField :label="`Langue ${index + 1}`" class="col-span-2 sm:col-span-1">
                <UInput v-model="l.langue" class="w-full" />
              </UFormField>
              <UFormField label="Niveau">
                <USelect v-model="l.niveau" :items="[...NIVEAUX_LANGUE]" class="w-full" />
              </UFormField>
              <UButton
                icon="i-lucide-trash-2"
                color="neutral"
                variant="ghost"
                :aria-label="`Supprimer la langue ${index + 1}${l.langue ? ` (${l.langue})` : ''}`"
                @click="remove('langues', l.id)"
              />
            </li>
          </ol>
          <UButton
            data-cv-add="langues"
            icon="i-lucide-plus"
            color="neutral"
            variant="outline"
            size="sm"
            class="mt-4"
            @click="add('langues')"
          >
            Ajouter une langue
          </UButton>
        </fieldset>

        <!-- Compétences (étiquettes libres) -->
        <fieldset class="rounded-panneau bg-muted p-5">
          <legend class="float-left mb-3 text-sm font-semibold text-highlighted">
            Compétences
          </legend>
          <ul v-if="cv.competences.length" class="clear-both flex flex-wrap gap-2">
            <li
              v-for="c in cv.competences"
              :key="c"
              class="flex items-center gap-1 rounded-full bg-default py-0.5 pr-0.5 pl-3 text-sm"
            >
              {{ c }}
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                :aria-label="`Retirer la compétence ${c}`"
                @click="removeCompetence(c)"
              />
            </li>
          </ul>
          <p v-else class="clear-both text-sm text-muted">Aucune compétence.</p>
          <form class="mt-4 flex items-end gap-2" @submit.prevent="addCompetence">
            <UFormField label="Nouvelle compétence" class="flex-1">
              <UInput
                id="cv-nouvelle-competence"
                v-model="newCompetence"
                placeholder="Ex. : Figma"
                class="w-full"
              />
            </UFormField>
            <UButton type="submit" icon="i-lucide-plus" color="neutral" variant="outline">
              Ajouter
            </UButton>
          </form>
        </fieldset>
      </section>

      <section
        aria-labelledby="cv-apercu"
        class="lg:sticky lg:top-0"
        :class="{ 'max-lg:hidden': view !== 'apercu' }"
      >
        <h2 id="cv-apercu" class="mb-3 text-sm font-semibold text-highlighted">
          Aperçu, {{ varianteLabel }}
        </h2>
        <CvApercu :cv="cv" :variante="variante" />
      </section>
    </div>
  </div>
</template>
