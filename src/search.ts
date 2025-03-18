import url from 'node:url';
import { tavily, TavilyClient, TavilySearchOptions } from '@tavily/core';
import { ISearchRequestOptions, ISearchResponse, ISearchResponseResult } from './interface.js';

/**
 * SearxNG Search API
 * - https://docs.searxng.org/dev/search_api.html
 */
export async function searxngSearch(apiUrl: string, params: ISearchRequestOptions): Promise<ISearchResponse> {
  try {
    const {
      query,
      limit = 10,
      categories = 'general',
      engines = 'all',
      safeSearch = 0,
      format = 'json',
      language = 'auto',
      timeRange = '',
      timeout = 10000,
      apiKey = '',
    } = params;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Number(timeout));

    const config = {
      q: query,
      pageno: limit,
      categories,
      format,
      safesearch: safeSearch,
      language,
      engines,
      time_range: timeRange,
    };

    const endpoint = `${apiUrl}/search`;

    const queryParams = url.format({ query: config });

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const res = await fetch(`${endpoint}${queryParams}`, {
      method: 'POST',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const result = await res.json();
    if (result.results) {
      const results: ISearchResponseResult[] = result.results.map((item: Record<string, unknown>) => {
        const image = item.img_src ? {
          thumbnail: item.thumbnail_src,
          src: item.img_src,
        } : null;
        const video = item.iframe_src ? {
          thumbnail: item.thumbnail_src,
          src: item.iframe_src,
        } : null;
        return {
          title: item.title,
          snippet: item.content,
          url: item.url,
          source: item.source,
          image,
          video,
          engine: item.engine,
        };
      });
      return {
        results,
        success: true,
      };
    }
    return {
      results: [],
      success: false,
    };
  } catch (err: any) {
    process.stdout.write(err?.message ?? 'Searxng search error.');
    throw err;
  }
}


let tvly: TavilyClient | null = null;
export async function tavilySearch(query: string, options: ISearchRequestOptions): Promise<ISearchResponse> {
  const {
    limit = 10,
    categories = 'general',
    timeRange,
    apiKey,
  } = options;

  if (!apiKey) {
    throw new Error('Tavily API key is required');
  }

  if (!tvly) {
    tvly = tavily({
      apiKey,
    });
  }

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
  }));

  return {
    results,
    success: true,
  };
}
