import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Trace } from '#shared/types/trace'
import TraceEditor from '~/components/trace/TraceEditor.vue'
import { useTraceStore } from '~/stores/trace'

const TRACE: Trace = {
  '@id': '/api/traces/7',
  '@type': 'Trace',
  bibliotheque: '/api/bibliotheques/1',
  titre: 'Business model',
  description: null,
  contexte: null,
  legende: null,
  type: 'lien',
  contenu: [],
  statut: 'brouillon',
  conceptionIa: 'non_renseigne',
  realisationIa: 'non_renseigne',
  dateRealisation: null,
  dateCreation: '2026-10-30',
  dateModification: '2026-10-30',
  dateSuppression: null,
}

afterEach(() => vi.restoreAllMocks())

describe('éditeur de trace', () => {
  // Bloquant de relecture : un « Finaliser » refusé ne doit pas finaliser en douce
  it('garde le statut enregistré dans la sauvegarde automatique après un « Finaliser » refusé', async () => {
    const save = vi.spyOn(useTraceStore(), 'save').mockResolvedValue(TRACE)
    const editor = await mountSuspended(TraceEditor, { props: { trace: TRACE } })

    await editor.get('button[data-action="finaliser"]').trigger('click')
    await vi.waitFor(() =>
      expect(editor.text()).toContain('Ajoutez le contenu de la trace avant de la finaliser.'),
    )
    await editor.get('input[name="adresse"]').setValue('https://bm.example')

    await vi.waitFor(() => expect(save).toHaveBeenCalled(), { timeout: 4000 })
    expect(save.mock.calls.at(-1)?.[1]).toMatchObject({
      statut: 'brouillon',
      contenu: ['https://bm.example'],
    })
  })

  it('n’enregistre qu’une fois sur un double clic « Finaliser »', async () => {
    const save = vi
      .spyOn(useTraceStore(), 'save')
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ...TRACE }), 50)),
      )
    const editor = await mountSuspended(TraceEditor, {
      props: { trace: { ...TRACE, contenu: ['https://bm.example'] } },
    })

    const finaliser = editor.get('button[data-action="finaliser"]')
    await finaliser.trigger('click')
    await finaliser.trigger('click')

    await vi.waitFor(() => expect(save).toHaveBeenCalled())
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(save).toHaveBeenCalledTimes(1)
  })
})
