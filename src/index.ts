import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import  { CallToolRequestSchema, ListToolsRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js';
import { ISearchRequestOptions, ISearchResponse, Provider } from './interface.js';
import { searxngSearch, tavilySearch } from './search.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// export types
export * from './interface.js';

// tools definition
const SEARCH_TOOL: Tool = {
  name: 'one_search',
  description:
    'Search and retrieve content from web pages. ' +
    'Returns SERP results by default (url, title, description).',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query string',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 5)',
      },
      language: {
        type: 'string',
        description: 'Language code for search results (default: en)',
      },
      categories: {
        type: 'string',
        description: 'Categories to search for (default: general)',
      },
      timeRange: {
        type: 'string',
        description: 'Time range for search results (default: all)',
      },
    },
    required: ['query'],
  },
};

const SCRAPE_TOOL: Tool = {
  name: 'one_scrape',
  description:
    'Scrape a single webpage with advanced options for content extraction. ' +
    'Supports various formats including markdown, HTML, and screenshots. ' +
    'Can execute custom actions like clicking or scrolling before scraping.',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to scrape',
      },
      formats: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'markdown',
            'html',
            'rawHtml',
            'screenshot',
            'links',
            'screenshot@fullPage',
            'extract',
          ],
        },
        description: "Content formats to extract (default: ['markdown'])",
      },
      onlyMainContent: {
        type: 'boolean',
        description:
          'Extract only the main content, filtering out navigation, footers, etc.',
      },
      includeTags: {
        type: 'array',
        items: { type: 'string' },
        description: 'HTML tags to specifically include in extraction',
      },
      excludeTags: {
        type: 'array',
        items: { type: 'string' },
        description: 'HTML tags to exclude from extraction',
      },
      waitFor: {
        type: 'number',
        description: 'Time in milliseconds to wait for dynamic content to load',
      },
      timeout: {
        type: 'number',
        description:
          'Maximum time in milliseconds to wait for the page to load',
      },
      actions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: [
                'wait',
                'click',
                'screenshot',
                'write',
                'press',
                'scroll',
                'scrape',
                'executeJavascript',
              ],
              description: 'Type of action to perform',
            },
            selector: {
              type: 'string',
              description: 'CSS selector for the target element',
            },
            milliseconds: {
              type: 'number',
              description: 'Time to wait in milliseconds (for wait action)',
            },
            text: {
              type: 'string',
              description: 'Text to write (for write action)',
            },
            key: {
              type: 'string',
              description: 'Key to press (for press action)',
            },
            direction: {
              type: 'string',
              enum: ['up', 'down'],
              description: 'Scroll direction',
            },
            script: {
              type: 'string',
              description: 'JavaScript code to execute',
            },
            fullPage: {
              type: 'boolean',
              description: 'Take full page screenshot',
            },
          },
          required: ['type'],
        },
        description: 'List of actions to perform before scraping',
      },
      extract: {
        type: 'object',
        properties: {
          schema: {
            type: 'object',
            description: 'Schema for structured data extraction',
          },
          systemPrompt: {
            type: 'string',
            description: 'System prompt for LLM extraction',
          },
          prompt: {
            type: 'string',
            description: 'User prompt for LLM extraction',
          },
        },
        description: 'Configuration for structured data extraction',
      },
      mobile: {
        type: 'boolean',
        description: 'Use mobile viewport',
      },
      skipTlsVerification: {
        type: 'boolean',
        description: 'Skip TLS certificate verification',
      },
      removeBase64Images: {
        type: 'boolean',
        description: 'Remove base64 encoded images from output',
      },
      location: {
        type: 'object',
        properties: {
          country: {
            type: 'string',
            description: 'Country code for geolocation',
          },
          languages: {
            type: 'array',
            items: { type: 'string' },
            description: 'Language codes for content',
          },
        },
        description: 'Location settings for scraping',
      },
    },
    required: ['url'],
  },
};

const EXTRACT_TOOL: Tool = {
  name: 'one_extract',
  description:
    'Extract structured information from web pages using LLM. ' +
    'Supports both cloud AI and self-hosted LLM extraction.',
  inputSchema: {
    type: 'object',
    properties: {
      urls: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of URLs to extract information from',
      },
      prompt: {
        type: 'string',
        description: 'Prompt for the LLM extraction',
      },
      systemPrompt: {
        type: 'string',
        description: 'System prompt for LLM extraction',
      },
      schema: {
        type: 'object',
        description: 'JSON schema for structured data extraction',
      },
      allowExternalLinks: {
        type: 'boolean',
        description: 'Allow extraction from external links',
      },
      enableWebSearch: {
        type: 'boolean',
        description: 'Enable web search for additional context',
      },
      includeSubdomains: {
        type: 'boolean',
        description: 'Include subdomains in extraction',
      },
    },
    required: ['urls'],
  },
};

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

// searxng api
const SEARCH_API_URL = process.env.SEARCH_API_URL;
const SEARCH_API_KEY = process.env.SEARCH_API_KEY;
const SEARCH_PROVIDER: Provider = process.env.SEARCH_PROVIDER as Provider ?? 'searxng';

if (!SEARCH_API_URL) {
  process.stderr.write('SEARCH_API_URL must be set');
  process.exit(1);
}

// query params
const SAFE_SEARCH = process.env.SAFE_SEARCH ?? 0;
const LIMIT = process.env.LIMIT ?? 10;
const CATEGORIES = process.env.CATEGORIES ?? 'general';
const ENGINES = process.env.ENGINES ?? 'all';
const FORMAT = process.env.FORMAT ?? 'json';
const LANGUAGE = process.env.LANGUAGE ?? 'auto';
const TIME_RANGE = process.env.TIME_RANGE ?? '';
const DEFAULT_TIMEOUT = process.env.TIMEOUT ?? 10000;

const config = {
  pageno: LIMIT,
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
        const { results, success } = await processSearch(SEARCH_API_URL, {
          ...config,
          ...args,
          apiKey: SEARCH_API_KEY ?? '',
        });
        if (!success) {
          throw new Error('Failed to search');
        }
        return {
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
          error: msg,
        };
      }
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
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
      error: error instanceof Error ? error.message : msg,
    };
  } finally {
    server.sendLoggingMessage({
      level: 'info',
      data: `[${new Date().toISOString()}] Request completed in ${Date.now() - startTime}ms`,
    });
  }
});

async function processSearch(apiUrl: string, args: ISearchRequestOptions): Promise<ISearchResponse> {
  switch (SEARCH_PROVIDER) {
  case 'searxng':
    return await searxngSearch(apiUrl, {
      ...config,
      ...args,
      apiKey: SEARCH_API_KEY,
    });
  case 'tavily':
    return await tavilySearch(apiUrl, {
      ...config,
      ...args,
      apiKey: SEARCH_API_KEY,
    });
  default:
    throw new Error(`Unsupported search provider: ${SEARCH_PROVIDER}`);
  }
}

function checkSearchArgs(args: unknown): args is ISearchRequestOptions {
  return (
    typeof args === 'object' &&
    args !== null &&
    'query' in args &&
    typeof args.query === 'string'
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
