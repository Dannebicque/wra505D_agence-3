<!--
  Choix unique parmi quelques options courtes (2 à 5), en sélecteur segmenté : une pastille glisse
  sous l'option choisie. Remplace un groupe de boutons radio quand toutes les options tiennent sur
  une ligne (type de trace…).

  Ce sont de vrais boutons radio natifs, masqués visuellement : nom du groupe par la légende,
  flèches du clavier, envoi du formulaire et lecteurs d'écran fonctionnent sans rien ajouter.
  Dans un `UFormField`, l'erreur du champ est reliée à chaque bouton (aria-describedby), et le
  bouton choisi porte l'id du champ, que le formulaire focalise en cas d'erreur.

  <UFormField name="type">
    <UiChoixSegmente v-model="state.type" legend="Type de trace" :items="ITEMS" />
  </UFormField>
-->
<script setup lang="ts" generic="T extends string">
export interface SegmentedItem<V extends string = string> {
  label: string
  value: V
  /** Icône Lucide, au-dessus du libellé sur téléphone, à sa gauche au-delà. */
  icon?: string
}

const props = defineProps<{
  legend: string
  items: readonly SegmentedItem<T>[]
}>()

const model = defineModel<T>({ required: true })

const { id, name, ariaAttrs, emitFormChange, emitFormInput } = useFormField()
const fallbackName = useId()
const groupName = computed(() => name.value ?? fallbackName)

// -1 si la valeur n'est pas dans la liste : aucun bouton coché, donc pas de pastille
const selectedIndex = computed(() => props.items.findIndex((item) => item.value === model.value))
/** Bouton qui porte l'id du champ (focalisé en cas d'erreur) : le coché, sinon le premier. */
const focusIndex = computed(() => Math.max(0, selectedIndex.value))

function onChange() {
  emitFormChange()
  emitFormInput()
}
</script>

<template>
  <fieldset class="min-w-0">
    <legend class="mb-2 text-sm font-medium text-default">{{ legend }}</legend>
    <!--
      Colonnes égales : la pastille fait une colonne de large (moins le retrait `p-1` de la piste)
      et se décale d'autant de fois sa largeur que le rang de l'option choisie, sans mesure ni
      script (rendu serveur compris)
    -->
    <div
      class="relative grid rounded-full bg-elevated p-1"
      :style="{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }"
    >
      <!--
        Pastille : contour prune (7,5:1 sur la piste en clair), pas seulement un fond un peu plus
        clair (1,3:1) ; en couleurs forcées, le fond disparaît mais le contour reste
      -->
      <span
        v-if="selectedIndex >= 0"
        aria-hidden="true"
        class="absolute inset-y-1 start-1 rounded-full border border-primary bg-default shadow-carte motion-safe:transition-[translate] motion-safe:duration-300 motion-safe:ease-out dark:bg-accented"
        :style="{
          width: `calc((100% - var(--spacing) * 2) / ${items.length})`,
          translate: `${selectedIndex * 100}% 0`,
        }"
      />
      <label
        v-for="(item, index) in items"
        :key="item.value"
        class="relative flex min-w-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-full px-2 py-2 text-sm font-medium text-muted transition-colors hover:text-highlighted has-checked:font-semibold has-checked:text-highlighted has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary motion-reduce:transition-none sm:flex-row sm:gap-2"
      >
        <input
          :id="index === focusIndex ? id : undefined"
          v-model="model"
          type="radio"
          class="sr-only"
          :name="groupName"
          :value="item.value"
          v-bind="ariaAttrs"
          @change="onChange"
        />
        <UIcon v-if="item.icon" :name="item.icon" class="size-4 shrink-0" aria-hidden="true" />
        <span class="max-w-full truncate">{{ item.label }}</span>
      </label>
    </div>
  </fieldset>
</template>
