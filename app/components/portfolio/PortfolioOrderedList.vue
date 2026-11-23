<script setup lang="ts" generic="T extends { id: number | string }">
// Liste réordonnable (pages d'un portfolio E-PG-04, traces d'une page E-TR-08).
//
// Deux façons de déplacer un élément :
// - glisser-déposer à la souris (poignée visuelle, toute la ligne se saisit) ;
// - boutons « Monter » / « Descendre », l'alternative clavier et tactile (WCAG 2.5.7) : le focus
//   suit l'élément déplacé et une zone vivante annonce sa nouvelle position.
// Le composant ne fait qu'émettre le nouvel ordre (v-model) : le parent décide de l'enregistrer.
const props = defineProps<{
  /** Nom accessible de la liste (« Pages du portfolio »). */
  label: string
  /** Libellé lisible d'un élément, pour les boutons et les annonces. */
  itemLabel: (item: T) => string
}>()

const items = defineModel<T[]>({ required: true })

defineSlots<{
  /** Contenu de la ligne (titre, détails). */
  item(props: { item: T; index: number }): unknown
  /** Actions propres à l'élément (modifier, retirer…), après les flèches. */
  actions?(props: { item: T; index: number }): unknown
}>()

const listId = useId()
const buttonId = (item: T, direction: 'up' | 'down') => `${listId}-${item.id}-${direction}`

/** Annonce aux lecteurs d'écran (zone toujours présente, seul son texte change). */
const announcement = ref('')
function announce(text: string) {
  announcement.value = ''
  nextTick(() => (announcement.value = text))
}

function moveItem(from: number, to: number) {
  const next = [...items.value]
  const [moved] = next.splice(from, 1)
  if (!moved) return
  next.splice(to, 0, moved)
  items.value = next
  announce(`« ${props.itemLabel(moved)} » : position ${to + 1} sur ${next.length}.`)
}

async function moveBy(index: number, delta: -1 | 1) {
  const target = index + delta
  const item = items.value[index]
  if (!item || target < 0 || target >= items.value.length) return
  moveItem(index, target)
  // Le DOM a bougé : on rend le focus au même bouton, ou à l'autre s'il est désactivé (bout de liste)
  await nextTick()
  const same = document.getElementById(buttonId(item, delta < 0 ? 'up' : 'down'))
  const other = document.getElementById(buttonId(item, delta < 0 ? 'down' : 'up'))
  const focusTarget = same instanceof HTMLButtonElement && !same.disabled ? same : other
  focusTarget?.focus()
}

// L'ordre peut aussi changer sans action ici : le parent annule un déplacement refusé par le
// serveur. Le navigateur peut alors perdre le focus : la ligne focalisée est déplacée dans le DOM,
// ou sa flèche devient inactive (bout de liste). On le rend à la même flèche, ou à l'autre.
const lastArrowId = ref<string | null>(null)
const isArrowId = (id: string) => id.startsWith(listId) && /-(up|down)$/.test(id)

function onFocusIn(event: FocusEvent) {
  const target = event.target
  lastArrowId.value = target instanceof HTMLElement && isArrowId(target.id) ? target.id : null
}

/** Le focus part vers un autre élément de la page : on cesse de le suivre. */
function onFocusOut(event: FocusEvent) {
  const next = event.relatedTarget
  if (next instanceof Node && !(event.currentTarget as Node).contains(next))
    lastArrowId.value = null
}

const enabledButton = (id: string) => {
  const element = document.getElementById(id)
  return element instanceof HTMLButtonElement && !element.disabled ? element : null
}

watch(
  items,
  () => {
    const id = lastArrowId.value
    const arrow = id ? document.getElementById(id) : null
    if (!id || !arrow) return
    const isLost = document.activeElement === document.body || document.activeElement === arrow
    if (!isLost) return
    const sibling = id.replace(/-(up|down)$/, (_, d) => (d === 'up' ? '-down' : '-up'))
    const target = enabledButton(id) ?? enabledButton(sibling)
    if (target && document.activeElement !== target) target.focus()
  },
  { flush: 'post' },
)

// Glisser-déposer (souris) : simple état local, l'indicateur montre où l'élément sera posé
const draggedIndex = ref<number | null>(null)
const overIndex = ref<number | null>(null)

function onDragStart(event: DragEvent, index: number) {
  draggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    // Firefox n'entame le glisser que si des données sont posées
    event.dataTransfer.setData('text/plain', String(index))
  }
}

/** Passer d'une ligne à l'un de ses enfants déclenche aussi `dragleave` : on l'ignore. */
function onDragLeave(event: DragEvent, index: number) {
  const row = event.currentTarget
  if (
    row instanceof Node &&
    event.relatedTarget instanceof Node &&
    row.contains(event.relatedTarget)
  )
    return
  if (overIndex.value === index) overIndex.value = null
}

function onDrop(index: number) {
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    moveItem(draggedIndex.value, index)
  }
  onDragEnd()
}

function onDragEnd() {
  draggedIndex.value = null
  overIndex.value = null
}
</script>

<template>
  <div>
    <ol :aria-label="label" class="space-y-2" @focusin="onFocusIn" @focusout="onFocusOut">
      <li
        v-for="(item, index) in items"
        :key="item.id"
        draggable="true"
        class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-feuille border bg-default p-3 transition-colors motion-reduce:transition-none sm:p-4"
        :class="[
          overIndex === index && draggedIndex !== index
            ? 'border-primary ring-1 ring-primary'
            : 'border-default',
          draggedIndex === index ? 'opacity-60' : '',
        ]"
        @dragstart="onDragStart($event, index)"
        @dragover.prevent="overIndex = index"
        @dragleave="onDragLeave($event, index)"
        @drop.prevent="onDrop(index)"
        @dragend="onDragEnd"
      >
        <!-- Poignée visuelle : le glisser-déposer est réservé à la souris, les flèches le doublent -->
        <span class="flex cursor-grab items-center gap-2 text-muted" aria-hidden="true">
          <UIcon name="i-lucide-grip-vertical" class="size-5" />
          <!-- Chiffres de même largeur (tabular-nums), centrés sur la hauteur des capitales -->
          <span
            class="flex size-7 items-center justify-center rounded-full bg-muted text-sm font-medium text-highlighted tabular-nums"
          >
            <span class="centre-optique">{{ index + 1 }}</span>
          </span>
        </span>

        <div class="min-w-0 flex-1 basis-48">
          <slot name="item" :item="item" :index="index" />
        </div>

        <div class="ms-auto flex items-center gap-1">
          <UButton
            :id="buttonId(item, 'up')"
            icon="i-lucide-arrow-up"
            color="neutral"
            variant="ghost"
            :disabled="index === 0"
            :aria-label="`Monter « ${itemLabel(item)} »`"
            @click="moveBy(index, -1)"
          />
          <UButton
            :id="buttonId(item, 'down')"
            icon="i-lucide-arrow-down"
            color="neutral"
            variant="ghost"
            :disabled="index === items.length - 1"
            :aria-label="`Descendre « ${itemLabel(item)} »`"
            @click="moveBy(index, 1)"
          />
          <slot name="actions" :item="item" :index="index" />
        </div>
      </li>
    </ol>
    <p role="status" class="sr-only">{{ announcement }}</p>
  </div>
</template>
