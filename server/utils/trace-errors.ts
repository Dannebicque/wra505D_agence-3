import type { Violation } from '../../shared/types/api'

/** Erreur 422 au format d'ApiPlatform (`ConstraintViolationList`), message de chaque champ en français. */
export function validationError(violations: Violation[]) {
  const detail = violations
    .map((v) => (v.propertyPath ? `${v.propertyPath}: ${v.message}` : v.message))
    .join('\n')
  return createError({
    statusCode: 422,
    statusMessage: 'Unprocessable Entity',
    message: detail,
    data: { '@type': 'ConstraintViolationList', title: 'Erreur de validation', detail, violations },
  })
}

export function traceNotFound() {
  return createError({ statusCode: 404, statusMessage: 'Not Found', message: 'Trace introuvable.' })
}
