<script setup lang="ts">
// « Démo » : les trois accès de démonstration, en grandes lignes entièrement cliquables. Chaque
// ligne connecte au compte fictif de l'espace (mêmes comptes que la page de connexion) ; son nom
// accessible (le texte affiché, ponctué) donne l'espace puis ce qu'on y fait.
const { connectDemo, isPending, error } = useConnexion()
const pendingDemo = ref<string | null>(null)

async function onDemo(username: string) {
  pendingDemo.value = username
  await connectDemo(username)
  pendingDemo.value = null
}
</script>

<template>
  <div class="grid gap-8 lg:grid-cols-12 lg:gap-12">
    <div class="lg:col-span-5">
      <h2 id="demo-titre" class="font-titre text-2xl text-highlighted sm:text-4xl">
        Essayer la démo
      </h2>
      <p class="mt-4 max-w-mesure text-lg text-muted">
        Avec un compte fictif : choisissez un espace et parcourez-le avec des données de
        démonstration.
      </p>
    </div>

    <div class="lg:col-span-7">
      <ul class="border-t border-default">
        <li v-for="compte in COMPTES_DEMO" :key="compte.username" class="border-b border-default">
          <button
            type="button"
            :disabled="isPending"
            :aria-busy="pendingDemo === compte.username"
            :aria-label="`${compte.espace}, ${compte.description}`"
            class="group flex w-full items-center justify-between gap-4 rounded-feuille px-2 py-6 text-start hover:bg-muted disabled:cursor-not-allowed motion-safe:transition-colors sm:px-4"
            @click="onDemo(compte.username)"
          >
            <span class="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
              <span class="text-lg leading-titre font-semibold text-highlighted">
                {{ compte.espace }}
              </span>
              <span class="text-muted">{{ compte.description }}</span>
            </span>
            <UIcon
              :name="
                pendingDemo === compte.username ? 'i-lucide-loader-circle' : 'i-lucide-arrow-right'
              "
              aria-hidden="true"
              class="size-6 shrink-0 text-highlighted"
              :class="
                pendingDemo === compte.username
                  ? 'motion-safe:animate-spin'
                  : 'motion-safe:transition-transform motion-safe:group-hover:translate-x-1'
              "
            />
          </button>
        </li>
      </ul>
      <div role="alert">
        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          title="Connexion à la démo impossible"
          :description="error"
          class="mt-4"
        />
      </div>
    </div>
  </div>
</template>
