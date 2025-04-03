import { ISearchRequestOptions, ISearchResponse, ISearchResponseResult } from '../interface.js';
import { BrowserSearch, LocalBrowserSearchEngine } from '../libs/browser-search/index.js';
import { ConsoleLogger } from '@agent-infra/logger';

const logger = new ConsoleLogger('[LocalSearch]');

export async function localSearch(options: ISearchRequestOptions): Promise<ISearchResponse> {
  const { query, limit = 10 } = options;
  let { engines = 'all' } = options;
  const browserSearch = new BrowserSearch({
    logger,
    browserOptions: {
      headless: true,
    },
  });

  if (engines === 'all') {
    engines = 'bing,google,baidu,sogou';
  }

  try {
    const engineList = engines.split(',');

    if (engineList.length === 0) {
      throw new Error('engines is required');
    }

    const results: ISearchResponseResult[] = [];

    for (const engine of engineList) {
      const res = await browserSearch.perform({
        query,
        count: limit,
        engine: engine as LocalBrowserSearchEngine,
        needVisitedUrls: false,
      });

      if (res.length > 0) {
        results.push(...res);
        break;
      }
    }

    logger.info(`Found ${results.length} results for ${query}`, results);

    return {
      results,
      success: true,
    };
  } finally {
    await browserSearch.closeBrowser();
  }
}