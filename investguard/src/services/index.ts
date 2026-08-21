import { IPortfolioService } from "./portfolioService.interface";
import { MockPortfolioService } from "./mockPortfolioService";

/**
 * Single entry point the rest of the app imports.
 *
 * To switch data sources later, swap this line only, e.g.:
 *   export const portfolioService: IPortfolioService = new PortfolioApiService();
 *   export const portfolioService: IPortfolioService = new PortfolioDatabaseService();
 * No component or calculation needs to change.
 */
export const portfolioService: IPortfolioService = new MockPortfolioService();

export type { IPortfolioService };
