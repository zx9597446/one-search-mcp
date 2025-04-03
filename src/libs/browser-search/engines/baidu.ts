/**
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import { Page } from '../../browser/index.js';
import type { SearchEngineAdapter, SearchResult } from '../types.js';

/**
 * Baidu search engine adapter implementation.
 * Provides functionality to generate Baidu search URLs and extract search results from Baidu search pages.
 */
export class BaiduSearchEngine implements SearchEngineAdapter {
  /**
   * Generates a Baidu search URL based on the provided query and options.
   *
   * @param query - The search query string
   * @param options - Search configuration options
   * @param options.count - Number of search results to request (default: 10)
   * @param options.excludeDomains - Array of domain names to exclude from search results
   * @returns Formatted Baidu search URL as a string
   */
  getSearchUrl(
    query: string,
    options: {
      count?: number;
      excludeDomains?: string[];
    },
  ): string {
    // Baidu doesn't support excluding domains in the same way as Google
    // But we can add '-site:domain' to the query
    const excludeDomainsQuery =
      options.excludeDomains && options.excludeDomains.length > 0
        ? options.excludeDomains.map((domain) => `-site:${domain}`).join(' ')
        : '';

    const searchParams = new URLSearchParams({
      wd: excludeDomainsQuery ? `${excludeDomainsQuery} ${query}` : query,
      rn: `${options.count || 10}`, // rn is the parameter for result count
    });

    return `https://www.baidu.com/s?${searchParams.toString()}`;
  }

  /**
   * Extracts search results from a Baidu search page.
   *
   * @param window - The browser window object containing the loaded Baidu search page
   * @returns Array of search results extracted from the page
   */
  extractSearchResults(window: Window): SearchResult[] {
    const links: SearchResult[] = [];
    const document = window.document;

    try {
      // Baidu search results are in elements with class 'result'
      const elements = document.querySelectorAll('.result');
      elements.forEach((element) => {
        const titleEl = element.querySelector('.t a');
        const url = titleEl?.getAttribute('href');
        const snippetEl = element.querySelector('.c-span-last .content-right_2s-H4');

        if (!url) return;

        const item: SearchResult = {
          title: titleEl?.textContent || '',
          url, // Note: Baidu uses redirects, we'll need to follow them
          snippet: snippetEl?.textContent || '',
          content: '',
        };

        if (!item.title || !item.url) return;

        links.push(item);
      });
    } catch (error) {
      console.error('Error extracting search results from Baidu:', error);
    }

    return links;
  }

  /**
  * Waits for Bing search results to load completely.
  *
  * @param page - The Puppeteer page object
  * @returns Promise that resolves when search results are loaded
  */
  async waitForSearchResults(page: Page, timeout?: number): Promise<void> {
    await page.waitForSelector('#page', {
      timeout: timeout ?? 10000,
    });
  }
}