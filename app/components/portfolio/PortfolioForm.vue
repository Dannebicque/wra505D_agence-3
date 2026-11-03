<script setup lang="ts">
import type { FormError, FormErrorEvent } from '@nuxt/ui'
import { PORTFOLIO_LIMITS, type DemoPortfolioForm } from '~/demo/portfolio'

// Formulaire d'un portfolio, commun à la création (E-PF-01) et à la modification (E-PF-02,
// E-PF-03). Maquette : il valide la saisie et émet `submit`, sans rien enregistrer.
const props = defineProps<{
  initial?: DemoPortfolioForm
  /** Nom de l'image de bannière déjà en place. */
  banniere?: string | null
  submitLabel: string
}>()

const emit = defineEmits<{ submit: [values: DemoPortfolioForm] }>()

const state = reactive<DemoPortfolioForm>({
  intitule: props.initial?.intitule ?? '',
  description: props.initial?.description ?? '',
  visibilite: props.initial?.visibilite ?? 'privee',
  visibleRecruteurs: props.initial?.visibleRecruteurs ?? false,
})

function validate(values: Partial<DemoPortfolioForm>): FormError[] {
  const errors: FormError[] = []
  const intitule = values.intitule?.trim() ?? ''
  if (!intitule) errors.push({ name: 'intitule', message: 'Donnez un intitulé à votre portfolio.' })
  else if (intitule.length > PORTFOLIO_LIMITS.intitule)
    errors.push({
      name: 'intitule',
      message: `L’intitulé ne doit pas dépasser ${PORTFOLIO_LIMITS.intitule} caractères.`,
    })
  if ((values.description?.length ?? 0) > PORTFOLIO_LIMITS.description)
    errors.push({
      name: 'description',
      message: `L’introduction ne doit pas dépasser ${PORTFOLIO_LIMITS.description} caractères.`,
    })
  return errors
}

/** Après un envoi refusé, le focus va au premier champ en erreur. */
function onError(event: FormErrorEvent) {
  const first = event.errors[0]
  setTimeout(() => {
    const field =
      (first?.id ? document.getElementById(first.id) : null) ??
      (first?.name ? document.querySelector<HTMLElement>(`[name="${first.name}"]`) : null)
    field?.focus()
  })
}

const VISIBILITE_ITEMS = [
  {
    label: 'Privé',
    value: 'privee',
    description: 'Seuls vous et l’équipe enseignante le voyez. Aucun lien public.',
  },
  {
    label: 'Public',
    value: 'publique',
    description: 'Une fois publié, toute personne disposant du lien peut le consulter.',
  },
]
</script>

<template>
  <UForm
    :state="state"
    :validate="validate"
    :validate-on="['blur']"
    novalidate
    class="space-y-6"
    @submit="emit('submit', { ...state, intitule: state.intitule.trim() })"
    @error="onError"
  >
    <UFormField
      label="Intitulé"
      name="intitule"
      required
      description="Le titre affiché en tête de votre portfolio."
      :hint="`${state.intitule.length} / ${PORTFOLIO_LIMITS.intitule}`"
    >
      <UInput
        v-model="state.intitule"
        :maxlength="PORTFOLIO_LIMITS.intitule"
        aria-required="true"
        autocomplete="off"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Introduction"
      name="description"
      description="Présentez-vous en quelques phrases : formation, parcours, ce qui vous anime."
      :hint="`${state.description.length} / ${PORTFOLIO_LIMITS.description}`"
    >
      <UTextarea
        v-model="state.description"
        :rows="4"
        :maxlength="PORTFOLIO_LIMITS.description"
        autoresize
        class="w-full"
      />
    </UFormField>

    <PortfolioBannerField :current-name="banniere" />

    <div class="space-y-5 rounded-panneau bg-muted p-5">
      <URadioGroup
        v-model="state.visibilite"
        name="visibilite"
        legend="Visibilité"
        :items="VISIBILITE_ITEMS"
        :ui="{ legend: 'mb-2 text-sm font-semibold text-highlighted' }"
      />
      <USwitch
        v-model="state.visibleRecruteurs"
        name="visibleRecruteurs"
        label="Visible par les recruteurs"
        description="Les recruteurs partenaires de l’IUT peuvent consulter ce portfolio s’il est public."
      />
    </div>

    <div class="flex flex-wrap justify-end gap-3">
      <slot name="actions" />
      <UButton type="submit">{{ submitLabel }}</UButton>
    </div>
  </UForm>
</template>
