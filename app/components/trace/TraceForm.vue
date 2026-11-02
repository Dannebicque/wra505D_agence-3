<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
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

const emit = defineEmits<{ submit: [input: TraceInput] }>()

const state = reactive({
  titre: props.initial?.titre ?? '',
  type: (props.initial?.type ?? 'lien') as TraceType,
  adresse: props.initial?.contenu[0] ?? '',
  description: props.initial?.description ?? '',
  contexte: props.initial?.contexte ?? '',
  dateRealisation: props.initial?.dateRealisation ?? '',
  conceptionIa: (props.initial?.conceptionIa ?? 'non_renseigne') as ConceptionIa,
  realisationIa: (props.initial?.realisationIa ?? 'non_renseigne') as RealisationIa,
})

// Lot A : on saisit un lien ou une vidéo ; une trace image ou PDF existante garde son fichier
// (le téléversement arrive au lot C)
const fileName = computed(() =>
  state.type === 'image' || state.type === 'pdf'
    ? (props.initial?.contenu[0]?.split('/').pop() ?? '')
    : null,
)

// Fixé par le bouton cliqué, avant la validation du formulaire
const statut = ref<TraceStatut>(props.initial?.statut ?? 'brouillon')

const today = todayInParis()

function toInput(): TraceInput {
  return {
    titre: state.titre,
    type: state.type,
    contenu:
      fileName.value !== null
        ? (props.initial?.contenu ?? [])
        : state.adresse.trim()
          ? [state.adresse.trim()]
          : [],
    description: state.description,
    contexte: state.contexte,
    dateRealisation: state.dateRealisation || null,
    conceptionIa: state.conceptionIa,
    realisationIa: state.realisationIa,
    statut: statut.value,
  }
}

/** Les erreurs du contenu s'affichent sous le champ « adresse ». */
const toFormErrors = (violations: Violation[]): FormError[] =>
  violations.map((v) => ({
    name: v.propertyPath === 'contenu' ? 'adresse' : v.propertyPath,
    message: v.message,
  }))

function validate(): FormError[] {
  const result = validateTrace(toInput(), { today })
  return result.ok ? [] : toFormErrors(result.violations)
}

function onSubmit() {
  const result = validateTrace(toInput(), { today })
  if (result.ok) emit('submit', result.value)
}

const form = useTemplateRef('form')

/** Erreurs renvoyées par le serveur (422), affichées sous chaque champ. */
function setServerErrors(violations: Violation[]) {
  form.value?.setErrors(toFormErrors(violations))
}
defineExpose({ setServerErrors })

const TYPE_ITEMS = [
  { label: 'Lien', value: 'lien' },
  { label: 'Vidéo', value: 'video' },
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
    class="space-y-6"
    @submit="onSubmit"
  >
    <UFormField label="Titre" name="titre" required :hint="`${state.titre.length} / 100`">
      <UInput v-model="state.titre" :maxlength="100" class="w-full" />
    </UFormField>

    <UFormField v-if="fileName !== null" label="Fichier joint" name="adresse">
      <p class="text-sm">
        {{ TRACE_TYPE_LIBELLES[state.type] }} · {{ fileName }}
        <span class="block text-muted">Le remplacement du fichier arrive prochainement.</span>
      </p>
    </UFormField>

    <UFormField v-if="fileName === null" label="Type de trace" name="type">
      <URadioGroup v-model="state.type" :items="TYPE_ITEMS" orientation="horizontal" />
    </UFormField>

    <UFormField
      v-if="fileName === null"
      :label="state.type === 'video' ? 'Adresse de la vidéo' : 'Adresse du lien'"
      name="adresse"
      description="Obligatoire pour finaliser la trace."
    >
      <UInput
        v-model="state.adresse"
        type="url"
        inputmode="url"
        placeholder="https://"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Description" name="description">
      <UTextarea
        v-model="state.description"
        :rows="4"
        :maxlength="5000"
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
        <UInput v-model="state.contexte" :maxlength="255" class="w-full" />
      </UFormField>

      <UFormField label="Date de réalisation" name="dateRealisation">
        <UInput v-model="state.dateRealisation" type="date" :max="today" class="w-full" />
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
        type="submit"
        data-action="brouillon"
        color="neutral"
        variant="outline"
        :loading="submitting && statut === 'brouillon'"
        :disabled="submitting"
        @click="statut = 'brouillon'"
      >
        Enregistrer le brouillon
      </UButton>
      <UButton
        type="submit"
        data-action="finaliser"
        :loading="submitting && statut === 'finalisee'"
        :disabled="submitting"
        @click="statut = 'finalisee'"
      >
        Finaliser la trace
      </UButton>
    </div>
  </UForm>
</template>
