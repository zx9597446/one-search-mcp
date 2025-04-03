#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import  { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ISearchRequestOptions, ISearchResponse, SearchProvider } from './interface.js';
import { bingSearch, duckDuckGoSearch, searxngSearch, tavilySearch, localSearch } from './search/index.js';
import { SEARCH_TOOL, EXTRACT_TOOL, SCRAPE_TOOL, MAP_TOOL } from './tools.js';
import FirecrawlApp, { MapParams, ScrapeParams } from '@mendable/firecrawl-js';
import dotenvx from '@dotenvx/dotenvx';
import { SafeSearchType } from 'duck-duck-scrape';

dotenvx.config();

// search api
const SEARCH_API_URL = process.env.SEARCH_API_URL;
const SEARCH_API_KEY = process.env.SEARCH_API_KEY;
const SEARCH_PROVIDER: SearchProvider = process.env.SEARCH_PROVIDER as SearchProvider ?? 'searxng';

// search query params
const SAFE_SEARCH = process.env.SAFE_SEARCH ?? 0;
const LIMIT = process.env.LIMIT ?? 10;
const CATEGORIES = process.env.CATEGORIES ?? 'general';
const ENGINES = process.env.ENGINES ?? 'all';
const FORMAT = process.env.FORMAT ?? 'json';
const LANGUAGE = process.env.LANGUAGE ?? 'auto';
const TIME_RANGE = process.env.TIME_RANGE ?? '';
const DEFAULT_TIMEOUT = process.env.TIMEOUT ?? 10000;

// firecrawl api
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_API_URL = process.env.FIRECRAWL_API_URL;

// firecrawl client
const firecrawl = new FirecrawlApp({
  apiKey: FIRECRAWL_API_KEY ?? '',
  ...(FIRECRAWL_API_URL ? { apiUrl: FIRECRAWL_API_URL } : {}),
});

// Server implementation
const server = new Server(
  {
    name: 'one-search-mcp',
    version: '0.0.1',
  },
  {
    capabilities: {
      tools: {},
      logging: {},
    },
  },
);

const searchDefaultConfig = {
  limit: Number(LIMIT),
  categories: CATEGORIES,
  format: FORMAT,
  safesearch: SAFE_SEARCH,
  language: LANGUAGE,
  engines: ENGINES,
  time_range: TIME_RANGE,
  timeout: DEFAULT_TIMEOUT,
};

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    SEARCH_TOOL,
    EXTRACT_TOOL,
    SCRAPE_TOOL,
    MAP_TOOL,
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const startTime = Date.now();

  try {
    const { name, arguments: args } = request.params;

    if (!args) {
      throw new Error('No arguments provided');
    }
  
    server.sendLoggingMessage({
      level: 'info',
      data: `[${new Date().toISOString()}] Received request for tool: [${name}]`,
    });
  
    switch (name) {
      case 'one_search': {
        // check args.
        if (!checkSearchArgs(args)) {
          throw new Error(`Invalid arguments for tool: [${name}]`);
        }
        try {
          const { results, success } = await processSearch({
            ...args,
            apiKey: SEARCH_API_KEY ?? '',
            apiUrl: SEARCH_API_URL,
          });
          if (!success) {
            throw new Error('Failed to search');
          }
          const resultsText = results.map((result) => (
            `Title: ${result.title}
URL: ${result.url}
Description: ${result.snippet}
${result.markdown ? `Content: ${result.markdown}` : ''}`
          ));
          return {
            content: [
              {
                type: 'text',
                text: resultsText.join('\n\n'),
              },
            ],
            results,
            success,
          };
        } catch (error) {
          server.sendLoggingMessage({
            level: 'error',
            data: `[${new Date().toISOString()}] Error searching: ${error}`,
          });
          const msg = error instanceof Error ? error.message : 'Unknown error';
          return {
            success: false,
            content: [
              {
                type: 'text',
                text: msg,
              },
            ],
          };
        }
      }
      case 'one_scrape': {
        if (!checkScrapeArgs(args)) {
          throw new Error(`Invalid arguments for tool: [${name}]`);
        }
        try {
          const startTime = Date.now();
          server.sendLoggingMessage({
            level: 'info',
            data: `[${new Date().toISOString()}] Scraping started for url: [${args.url}]`,
          });

          const { url, ...scrapeArgs } = args;
          const { content, success, result } = await processScrape(url, scrapeArgs);

          server.sendLoggingMessage({
            level: 'info',
            data: `[${new Date().toISOString()}] Scraping completed in ${Date.now() - startTime}ms`,
          });

          return {
            content,
            result,
            success,
          };
        } catch (error) {
          server.sendLoggingMessage({
            level: 'error',
            data: `[${new Date().toISOString()}] Error scraping: ${error}`,
          });
          const msg = error instanceof Error ? error.message : 'Unknown error';
          return {
            success: false,
            content: [
              {
                type: 'text',
                text: msg,
              },
            ],
          };
        }
      }
      case 'one_map': {
        if (!checkMapArgs(args)) {
          throw new Error(`Invalid arguments for tool: [${name}]`);
        }
        try {
          const { content, success, result } = await processMapUrl(args.url, args);
          return {
            content,
            result,
            success,
          };
        } catch (error) {
          server.sendLoggingMessage({
            level: 'error',
            data: `[${new Date().toISOString()}] Error mapping: ${error}`,
          });
          const msg = error instanceof Error ? error.message : String(error);
          return {
            success: false,
            content: [
              {
                type: 'text',
                text: msg,
              },
            ],
          };
        }
      }
      default: {
        throw new Error(`Unknown tool: ${name}`);
      }
    }
  } catch(error) {
    const msg = error instanceof Error ? error.message : String(error);
    server.sendLoggingMessage({
      level: 'error',
      data: {
        message: `[${new Date().toISOString()}] Error processing request: ${msg}`,
        tool: request.params.name,
        arguments: request.params.arguments,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      },
    });
    return {
      success: false,
      content: [
        {
          type: 'text',
          text: msg,
        },
      ],
    };
  } finally {
    server.sendLoggingMessage({
      level: 'info',
      data: `[${new Date().toISOString()}] Request completed in ${Date.now() - startTime}ms`,
    });
  }
});

async function processSearch(args: ISearchRequestOptions): Promise<ISearchResponse> {
  switch (SEARCH_PROVIDER) {
    case 'searxng': {
      // merge default config with args
      const params = {
        ...searchDefaultConfig,
        ...args,
        apiKey: SEARCH_API_KEY,
      };

      // but categories and language have higher priority (ENV > args).
      const { categories, language } = searchDefaultConfig;

      if (categories) {
        params.categories = categories;
      }
      if (language) {
        params.language = language;
      }
      return await searxngSearch(params);
    }
    case 'tavily': {
      return await tavilySearch({
        ...searchDefaultConfig,
        ...args,
        apiKey: SEARCH_API_KEY,
      });
    }
    case 'bing': {
      return await bingSearch({
        ...searchDefaultConfig,
        ...args,
        apiKey: SEARCH_API_KEY,
      });
    }
    case 'duckduckgo': {
      const safeSearch = args.safeSearch ?? 0;
      const safeSearchOptions = [SafeSearchType.STRICT, SafeSearchType.MODERATE, SafeSearchType.OFF];
      return await duckDuckGoSearch({
        ...searchDefaultConfig,
        ...args,
        apiKey: SEARCH_API_KEY,
        safeSearch: safeSearchOptions[safeSearch],
      });
    }
    case 'local': {
      return await localSearch({
        ...searchDefaultConfig,
        ...args,
      });
    }
    default:
      throw new Error(`Unsupported search provider: ${SEARCH_PROVIDER}`);
  }
}

async function processScrape(url: string, args: ScrapeParams) {
  const res = await firecrawl.scrapeUrl(url, {
    ...args,
  });

  if (!res.success) {
    throw new Error(`Failed to scrape: ${res.error}`);
  }

  const content: string[] = [];

  if (res.markdown) {
    content.push(res.markdown);
  }

  if (res.rawHtml) {
    content.push(res.rawHtml);
  }

  if (res.links) {
    content.push(res.links.join('\n'));
  }

  if (res.screenshot) {
    content.push(res.screenshot);
  }

  if (res.html) {
    content.push(res.html);
  }

  if (res.extract) {
    content.push(res.extract);
  }

  return {
    content: [
      {
        type: 'text',
        text: content.join('\n\n') || 'No content found',
      },
    ],
    result: res,
    success: true,
  };
}

async function processMapUrl(url: string, args: MapParams) {
  const res = await firecrawl.mapUrl(url, {
    ...args,
  });

  if ('error' in res) {
    throw new Error(`Failed to map: ${res.error}`);
  }

  if (!res.links) {
    throw new Error(`No links found from: ${url}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: res.links.join('\n').trim(),
      },
    ],
    result: res.links,
    success: true,
  };
}

function checkSearchArgs(args: unknown): args is ISearchRequestOptions {
  return (
    typeof args === 'object' &&
    args !== null &&
    'query' in args &&
    typeof args.query === 'string'
  );
}

function checkScrapeArgs(args: unknown): args is ScrapeParams & { url: string } {
  return (
    typeof args === 'object' &&
    args !== null &&
    'url' in args &&
    typeof args.url === 'string'
  );
}

function checkMapArgs(args: unknown): args is MapParams & { url: string } {
  return (
    typeof args === 'object' &&
    args !== null &&
    'url' in args &&
    typeof args.url === 'string'
  );
}

async function runServer() {
  try {
    process.stdout.write('Starting OneSearch MCP server...\n');

    const transport = new StdioServerTransport();
    await server.connect(transport);

    server.sendLoggingMessage({
      level: 'info',
      data: 'OneSearch MCP server started',
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error starting server: ${msg}\n`);
    process.exit(1);
  }
}

// run server
runServer().catch((error) => {
  const msg = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Error running server: ${msg}\n`);
  process.exit(1);
});

// export types
export * from './interface.js';
