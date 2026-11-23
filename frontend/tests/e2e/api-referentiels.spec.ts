import { expect, test } from '@playwright/test'

// Contrat de l'API factice : même format qu'ApiPlatform (JSON-LD, collection Hydra).
test.describe('API référentiels', () => {
  test('liste les référentiels sous forme de collection', async ({ request }) => {
    const response = await request.get('/api/referentiels')

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body['@type']).toBe('Collection')
    expect(body.totalItems).toBe(1)
    expect(body.member[0].competences).toHaveLength(5)
  })

  test('renvoie un référentiel par son identifiant', async ({ request }) => {
    const response = await request.get('/api/referentiels/1')

    expect(response.status()).toBe(200)
    expect((await response.json())['@id']).toBe('/api/referentiels/1')
  })

  for (const id of ['999', 'abc']) {
    test(`répond 404 avec un message en français pour l’identifiant « ${id} »`, async ({
      request,
    }) => {
      const response = await request.get(`/api/referentiels/${id}`)

      expect(response.status()).toBe(404)
      expect((await response.json()).message).toBe('Référentiel introuvable.')
    })
  }
})
