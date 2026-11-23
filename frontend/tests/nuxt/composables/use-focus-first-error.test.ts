import type { FormErrorEvent } from '@nuxt/ui'
import { afterEach, describe, expect, it } from 'vitest'
import { useFocusFirstError } from '~/composables/useFocusFirstError'

function errorEvent(errors: FormErrorEvent['errors']): FormErrorEvent {
  return Object.assign(new Event('error'), { errors }) as FormErrorEvent
}

function input(attrs: { id?: string; name?: string }) {
  const element = document.createElement('input')
  if (attrs.id) element.id = attrs.id
  if (attrs.name) element.name = attrs.name
  document.body.append(element)
  return element
}

describe('useFocusFirstError', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('place le focus sur le premier champ en erreur, repéré par son id', async () => {
    input({ id: 'champ-intitule', name: 'intitule' })
    const description = input({ id: 'champ-description', name: 'description' })
    const { onError } = useFocusFirstError()

    onError(
      errorEvent([
        { id: 'champ-description', name: 'description', message: 'Trop longue.' },
        { id: 'champ-intitule', name: 'intitule', message: 'Obligatoire.' },
      ]),
    )

    await expect.poll(() => document.activeElement).toBe(description)
  })

  it('retombe sur l’attribut name quand l’erreur n’a pas d’id', async () => {
    const identifiant = input({ name: 'identifiant' })
    const { onError } = useFocusFirstError()

    onError(errorEvent([{ name: 'identifiant', message: 'Obligatoire.' }]))

    await expect.poll(() => document.activeElement).toBe(identifiant)
  })

  it('ne fait rien sans erreur ni champ correspondant', async () => {
    const before = document.activeElement
    const { onError } = useFocusFirstError()

    onError(errorEvent([]))
    onError(errorEvent([{ name: 'inexistant', message: 'Erreur.' }]))
    await new Promise((resolve) => setTimeout(resolve))

    expect(document.activeElement).toBe(before)
  })
})
