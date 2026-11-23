export function portfolioNotFound() {
  return createError({
    statusCode: 404,
    statusMessage: 'Not Found',
    message: 'Portfolio introuvable.',
  })
}

export function pageNotFound() {
  return createError({ statusCode: 404, statusMessage: 'Not Found', message: 'Page introuvable.' })
}
