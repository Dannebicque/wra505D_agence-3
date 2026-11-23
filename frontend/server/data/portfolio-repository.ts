import { createPortfolioRepository } from '../utils/portfolio-repository'
import { PAGES, PORTFOLIOS } from './portfolios'

/** Provisoire : portfolios de démonstration, une copie par visiteur. */
export const portfolioRepository = createPortfolioRepository({
  portfolios: PORTFOLIOS,
  pages: PAGES,
})
