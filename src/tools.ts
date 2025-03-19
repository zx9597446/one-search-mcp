import { Tool } from '@modelcontextprotocol/sdk/types.js';

// tools definition
export const SEARCH_TOOL: Tool = {
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
        description: 'Maximum number of results to return (default: 10)',
      },
      language: {
        type: 'string',
        description: 'Language code for search results (default: auto)',
      },
      categories: {
        type: 'string',
        enum: [
          'general',
          'news',
          'images',
          'videos',
          'it',
          'science',
          'map',
          'music',
          'files',
          'social_media',
        ],
        description: 'Categories to search for (default: general)',
      },
      timeRange: {
        type: 'string',
        description: 'Time range for search results (default: all)',
        enum: [
          'all',
          'day',
          'week',
          'month',
          'year',
        ],
      },
    },
    required: ['query'],
  },
};

export const SCRAPE_TOOL: Tool = {
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

export const EXTRACT_TOOL: Tool = {
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
