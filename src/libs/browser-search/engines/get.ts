import { BingSearchEngine } from './bing.js';
import { BaiduSearchEngine } from './baidu.js';
import type { LocalBrowserSearchEngine, SearchEngineAdapter } from '../types.js';
import { SogouSearchEngine } from './sogou.js';
import { GoogleSearchEngine } from './google.js';

/**
 * Factory function to get the appropriate search engine adapter instance.
 *
 * @param engine - The search engine identifier ('sogou', 'bing', or 'baidu')
 * @returns An instance of the requested search engine adapter
 */
export function getSearchEngine(engine: LocalBrowserSearchEngine): SearchEngineAdapter {
  switch (engine) {
    case 'bing':
      return new BingSearchEngine();
    case 'baidu':
      return new BaiduSearchEngine();
    case 'sogou':
      return new SogouSearchEngine();
    case 'google':
      return new GoogleSearchEngine();
    default:
      return new BingSearchEngine();
  }
}