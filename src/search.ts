import url from 'node:url';
import { tavily, TavilySearchOptions } from '@tavily/core';
import { BingSearchOptions, BingSearchWebPage, ISearchRequestOptions, ISearchResponse, ISearchResponseResult } from './interface.js';

/**
 * SearxNG Search API
 * - https://docs.searxng.org/dev/search_api.html
 */
export async function searxngSearch(params: ISearchRequestOptions): Promise<ISearchResponse> {
  try {
    const {
      query,
      page = 1,
      limit = 10,
      categories = 'general',
      engines = 'all',
      safeSearch = 0,
      format = 'json',
      language = 'auto',
      timeRange = '',
      timeout = 10000,
      apiKey,
      apiUrl,
    } = params;

    if (!apiUrl) {
      throw new Error('SearxNG API URL is required');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Number(timeout));

    const config = {
      q: query,
      pageno: page,
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
    const response = await res.json();
    if (response.results) {
      const list = (response.results as Array<Record<string, any>>).slice(0, limit);
      const results: ISearchResponseResult[] = list.map((item: Record<string, any>) => {
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Searxng search error.';
    process.stdout.write(msg);
    throw err;
  }
}

/**
 * Bing Search API
 */
export async function bingSearch(options: ISearchRequestOptions): Promise<ISearchResponse> {
  const { query, limit = 10, safeSearch = 0, page = 1, apiUrl = 'https://api.bing.microsoft.com/v7.0/search', apiKey, language } = options;

  const bingSafeSearchOptions = ['Off', 'Moderate', 'Strict'];

  if (!apiKey) {
    throw new Error('Bing API key is required');
  }

  const bingSearchOptions: BingSearchOptions = {
    q: query,
    count: limit,
    offset: (page - 1) * limit,
    mkt: language,
    safeSearch: bingSafeSearchOptions[safeSearch] as 'Off' | 'Moderate' | 'Strict',
  };

  try {
    const queryParams = new URLSearchParams();
    Object.entries(bingSearchOptions).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.set(key, value.toString());
      }
    });

    const res = await fetch(`${apiUrl}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': apiKey,
      },
    });

    if (!res.ok) {
      throw new Error(`Bing search error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const serp = data.webPages?.value as Array<BingSearchWebPage>;
    const results = serp?.map((item: BingSearchWebPage) => ({
      title: item.name,
      snippet: item.snippet,
      url: item.url,
      source: item.siteName,
      thumbnailUrl: item.thumbnailUrl,
      language: item.language,
      image: null,
      video: null,
      engine: 'bing',
    })) ?? [];

    return {
      results,
      success: true,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Bing search error.';
    process.stdout.write(msg);
    throw err;
  }
}

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
}
