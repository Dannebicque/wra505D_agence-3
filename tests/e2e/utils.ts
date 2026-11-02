import type { Page } from '@playwright/test'

type NuxtWindow = Window & { useNuxtApp?: () => { isHydrating?: boolean } }

/** Ouvre une page et attend que Vue ait pris la main sur le HTML rendu par le serveur. */
export async function gotoHydrated(page: Page, path: string) {
  await page.goto(path)
  await page.waitForFunction(() => (window as NuxtWindow).useNuxtApp?.().isHydrating === false)
}
