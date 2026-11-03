<script setup lang="ts">
import type { FormError, FormErrorEvent } from '@nuxt/ui'
import type { Violation } from '#shared/types/api'
import type {
  ConceptionIa,
  RealisationIa,
  TraceInput,
  TraceStatut,
  TraceType,
} from '#shared/types/trace'

const props = defineProps<{
  initial?: TraceInput
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [input: TraceInput]
  /** Chaque modification de la saisie (sauvegarde automatique). */
  change: [input: TraceInput]
}>()

const isFileType = (type: TraceType) => type === 'image' || type === 'pdf'
const initialIsFile = props.initial ? isFileType(props.initial.type) : false

const state = reactive({
  titre: props.initial?.titre ?? '',
  type: (props.initial?.type ?? 'lien') as TraceType,
  // Contenu selon le type : une adresse web (lien, vidéo) ou un fichier déposé (image, PDF)
  adresse: initialIsFile ? '' : (props.initial?.contenu[0] ?? ''),
  fichier: initialIsFile ? (props.initial?.contenu[0] ?? null) : null,
  legende: props.initial?.legende ?? '',
  description: props.initial?.description ?? '',
  contexte: props.initial?.contexte ?? '',
  dateRealisation: props.initial?.dateRealisation ?? '',
  conceptionIa: (props.initial?.conceptionIa ?? 'non_renseigne') as ConceptionIa,
  realisationIa: (props.initial?.realisationIa ?? 'non_renseigne') as RealisationIa,
})

const hasFile = computed(() => isFileType(state.type))

// Fixé par le bouton cliqué, avant la validation du formulaire
const statut = ref<TraceStatut>(props.initial?.statut ?? 'brouillon')

const today = todayInParis()

function toInput(): TraceInput {
  return {
    titre: state.titre,
    type: state.type,
    contenu: hasFile.value
      ? state.fichier
        ? [state.fichier]
        : []
      : state.adresse.trim()
        ? [state.adresse.trim()]
        : [],
    // La légende ne concerne que les images (texte alternatif)
    legende: state.type === 'image' ? state.legende : null,
    description: state.description,
    contexte: state.contexte,
    dateRealisation: state.dateRealisation || null,
    conceptionIa: state.conceptionIa,
    realisationIa: state.realisationIa,
    statut: statut.value,
  }
}

/** Les erreurs du contenu s'affichent sous le champ du fichier ou de l'adresse. */
const fieldOf = (propertyPath: string) =>
  propertyPath === 'contenu' ? (hasFile.value ? 'fichier' : 'adresse') : propertyPath

/** Champs affichés, donc capables de montrer une erreur. */
const visibleFields = computed(
  () =>
    new Set([
      'titre',
      'description',
      'contexte',
      'dateRealisation',
      'conceptionIa',
      'realisationIa',
      'type',
      hasFile.value ? 'fichier' : 'adresse',
      ...(state.type === 'image' ? ['legende'] : []),
    ]),
)

const toFormErrors = (violations: Violation[]): FormError[] =>
  violations.map((v) => ({ name: fieldOf(v.propertyPath), message: v.message }))

function validate(): FormError[] {
  const result = validateTrace(toInput(), { today })
  return result.ok ? [] : toFormErrors(result.violations)
}

watch(state, () => emit('change', toInput()), { deep: true })

function onSubmit() {
  const result = validateTrace(toInput(), { today })
  if (result.ok) emit('submit', result.value)
}

const form = useTemplateRef('form')
// NB : `submit()` de UForm appelle `reportValidity()` du navigateur, qui ignore `novalidate`.
// Aucun champ ne porte donc de contrainte native (type="url", max…) : les règles en français
// de `validateTrace` s'appliquent seules, sans bulle native ni envoi bloqué.

/** Après un envoi refusé, le focus va au premier champ en erreur (lecteur d'écran, clavier). */
function focusField(id: string | undefined, name: string | undefined) {
  const field =
    (id ? document.getElementById(id) : null) ??
    (name ? document.querySelector<HTMLElement>(`[name="${name}"]`) : null)
  field?.focus()
}

function onError(event: FormErrorEvent) {
  const first = event.errors[0]
  // Pendant l'envoi, UForm désactive les champs (un champ désactivé refuse le focus) et ne les
  // réactive qu'après avoir émis l'erreur : on attend la fin de ce rendu
  setTimeout(() => focusField(first?.id, first?.name))
}

/** Les deux actions envoient le formulaire elles-mêmes : Entrée dans un champ ne change jamais le statut. */
function submitAs(value: TraceStatut) {
  statut.value = value
  form.value?.submit()
}

/**
 * Erreurs renvoyées par le serveur (422), affichées sous chaque champ.
 * Renvoie celles qui ne correspondent à aucun champ affiché, pour les montrer autrement.
 */
function setServerErrors(violations: Violation[]): Violation[] {
  const shown = violations.filter((v) => visibleFields.value.has(fieldOf(v.propertyPath)))
  form.value?.setErrors(toFormErrors(shown))
  const first = shown[0]
  if (first) nextTick(() => focusField(undefined, fieldOf(first.propertyPath)))
  return violations.filter((v) => !shown.includes(v))
}
defineExpose({ setServerErrors })

const TYPE_ITEMS = [
  { label: 'Lien', value: 'lien' },
  { label: 'Vidéo', value: 'video' },
  { label: 'Image', value: 'image' },
  { label: 'PDF', value: 'pdf' },
]
const CONCEPTION_ITEMS = Object.entries(CONCEPTION_IA_LIBELLES).map(([value, label]) => ({
  label,
  value,
}))
const REALISATION_ITEMS = Object.entries(REALISATION_IA_LIBELLES).map(([value, label]) => ({
  label,
  value,
}))
</script>

<template>
  <UForm
    ref="form"
    :state="state"
    :validate="validate"
    :validate-on="['blur']"
    novalidate
    class="space-y-6"
    @submit="onSubmit"
    @error="onError"
  >
    <UFormField
      label="Titre"
      name="titre"
      required
      :hint="`${state.titre.length} / ${TRACE_LIMITS.titre}`"
    >
      <UInput
        v-model="state.titre"
        :maxlength="TRACE_LIMITS.titre"
        aria-required="true"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Type de trace" name="type">
      <URadioGroup v-model="state.type" :items="TYPE_ITEMS" orientation="horizontal" />
    </UFormField>

    <TraceFileField
      v-if="state.type === 'image' || state.type === 'pdf'"
      v-model="state.fichier"
      :type="state.type"
    />

    <UFormField
      v-if="state.type === 'image'"
      label="Légende"
      name="legende"
      description="Décrivez l’image pour les personnes qui ne la voient pas. Obligatoire pour finaliser."
      :hint="`${state.legende.length} / ${TRACE_LIMITS.legende}`"
    >
      <UInput v-model="state.legende" :maxlength="TRACE_LIMITS.legende" class="w-full" />
    </UFormField>

    <UFormField
      v-if="!hasFile"
      :label="state.type === 'video' ? 'Adresse de la vidéo' : 'Adresse du lien'"
      name="adresse"
      description="Obligatoire pour finaliser la trace."
    >
      <UInput
        v-model="state.adresse"
        type="text"
        inputmode="url"
        placeholder="https://"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Description" name="description">
      <UTextarea
        v-model="state.description"
        :rows="4"
        :maxlength="TRACE_LIMITS.description"
        autoresize
        class="w-full"
      />
    </UFormField>

    <div class="grid gap-6 sm:grid-cols-2">
      <UFormField
        label="Contexte"
        name="contexte"
        description="Cours, projet ou stage où la trace a été produite."
      >
        <UInput v-model="state.contexte" :maxlength="TRACE_LIMITS.contexte" class="w-full" />
      </UFormField>

      <UFormField label="Date de réalisation" name="dateRealisation">
        <UInput v-model="state.dateRealisation" type="date" class="w-full" />
      </UFormField>
    </div>

    <fieldset class="space-y-4 rounded-panneau bg-muted p-5">
      <legend class="float-left mb-1 text-sm font-semibold text-highlighted">
        Usage de l’intelligence artificielle
      </legend>
      <UFormField label="Pendant la conception" name="conceptionIa" class="clear-both">
        <USelect v-model="state.conceptionIa" :items="CONCEPTION_ITEMS" class="w-full" />
      </UFormField>
      <UFormField label="Pendant la réalisation" name="realisationIa">
        <USelect v-model="state.realisationIa" :items="REALISATION_ITEMS" class="w-full" />
      </UFormField>
    </fieldset>

    <div class="flex flex-wrap justify-end gap-3">
      <UButton
        type="button"
        data-action="brouillon"
        color="neutral"
        variant="outline"
        :loading="submitting && statut === 'brouillon'"
        :disabled="submitting"
        @click="submitAs('brouillon')"
      >
        Enregistrer le brouillon
      </UButton>
      <UButton
        type="button"
        data-action="finaliser"
        :loading="submitting && statut === 'finalisee'"
        :disabled="submitting"
        @click="submitAs('finalisee')"
      >
        Finaliser la trace
      </UButton>
    </div>
  </UForm>
</template>
