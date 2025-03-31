import { tavily, TavilySearchOptions } from '@tavily/core';
import { ISearchRequestOptions, ISearchResponse } from '../interface.js';

/**
 * Tavily Search API
 * - https://docs.tavily.com/documentation/quickstart
 */
export async function tavilySearch(options: ISearchRequestOptions): Promise<ISearchResponse> {
  const {
    query,
    limit = 10,
    categories = 'general',
    timeRange,
    apiKey,
  } = options;

  if (!apiKey) {
    throw new Error('Tavily API key is required');
  }

  try {
    const tvly = tavily({
      apiKey,
    });
  
    const params: TavilySearchOptions = {
      topic: categories as TavilySearchOptions['topic'],
      timeRange: timeRange as TavilySearchOptions['timeRange'],
      maxResults: limit,
    };
  
    const res = await tvly.search(query, params);
    const results = res.results.map(item => ({
      title: item.title,
      url: item.url,
      snippet: item.content,
      engine: 'tavily',
    }));
  
    return {
      results,
      success: true,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Tavily search error.';
    process.stdout.write(msg);
    throw error;
  }
}