import { createTraceRepository } from '../utils/trace-repository'
import { TRACES } from './traces'

/** Provisoire : traces de démonstration, une copie par visiteur. */
export const traceRepository = createTraceRepository(TRACES)
