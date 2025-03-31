#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
module.exports = __toCommonJS(index_exports);
var import_server = require("@modelcontextprotocol/sdk/server/index.js");
var import_types = require("@modelcontextprotocol/sdk/types.js");
var import_stdio = require("@modelcontextprotocol/sdk/server/stdio.js");

// src/search.ts
var import_node_url = __toESM(require("url"), 1);
var import_core = require("@tavily/core");
async function searxngSearch(params) {
  try {
    const {
      query,
      page = 1,
      limit = 10,
      categories = "general",
      engines = "all",
      safeSearch = 0,
      format = "json",
      language = "auto",
      timeRange = "",
      timeout = 1e4,
      apiKey,
      apiUrl
    } = params;
    if (!apiUrl) {
      throw new Error("SearxNG API URL is required");
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
      time_range: timeRange
    };
    const endpoint = `${apiUrl}/search`;
    const queryParams = import_node_url.default.format({ query: config });
    const headers = {
      "Content-Type": "application/json"
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    const res = await fetch(`${endpoint}${queryParams}`, {
      method: "POST",
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const response = await res.json();
    if (response.results) {
      const list = response.results.slice(0, limit);
      const results = list.map((item) => {
        const image = item.img_src ? {
          thumbnail: item.thumbnail_src,
          src: item.img_src
        } : null;
        const video = item.iframe_src ? {
          thumbnail: item.thumbnail_src,
          src: item.iframe_src
        } : null;
        return {
          title: item.title,
          snippet: item.content,
          url: item.url,
          source: item.source,
          image,
          video,
          engine: item.engine
        };
      });
      return {
        results,
        success: true
      };
    }
    return {
      results: [],
      success: false
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Searxng search error.";
    process.stdout.write(msg);
    throw err;
  }
}
async function bingSearch(options) {
  const { query, limit = 10, safeSearch = 0, page = 1, apiUrl = "https://api.bing.microsoft.com/v7.0/search", apiKey, language } = options;
  const bingSafeSearchOptions = ["Off", "Moderate", "Strict"];
  if (!apiKey) {
    throw new Error("Bing API key is required");
  }
  const bingSearchOptions = {
    q: query,
    count: limit,
    offset: (page - 1) * limit,
    mkt: language,
    safeSearch: bingSafeSearchOptions[safeSearch]
  };
  try {
    const queryParams = new URLSearchParams();
    Object.entries(bingSearchOptions).forEach(([key, value]) => {
      if (value !== void 0) {
        queryParams.set(key, value.toString());
      }
    });
    const res = await fetch(`${apiUrl}?${queryParams}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": apiKey
      }
    });
    if (!res.ok) {
      throw new Error(`Bing search error: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    const serp = data.webPages?.value;
    const results = serp?.map((item) => ({
      title: item.name,
      snippet: item.snippet,
      url: item.url,
      source: item.siteName,
      thumbnailUrl: item.thumbnailUrl,
      language: item.language,
      image: null,
      video: null,
      engine: "bing"
    })) ?? [];
    return {
      results,
      success: true
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Bing search error.";
    process.stdout.write(msg);
    throw err;
  }
}
async function tavilySearch(options) {
  const {
    query,
    limit = 10,
    categories = "general",
    timeRange,
    apiKey
  } = options;
  if (!apiKey) {
    throw new Error("Tavily API key is required");
  }
  const tvly = (0, import_core.tavily)({
    apiKey
  });
  const params = {
    topic: categories,
    timeRange,
    maxResults: limit
  };
  const res = await tvly.search(query, params);
  const results = res.results.map((item) => ({
    title: item.title,
    url: item.url,
    snippet: item.content,
    engine: "tavily"
  }));
  return {
    results,
    success: true
  };
}

// src/tools.ts
var SEARCH_TOOL = {
  name: "one_search",
  description: "Search and retrieve content from web pages. Returns SERP results by default (url, title, description).",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query string"
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return (default: 10)"
      },
      language: {
        type: "string",
        description: "Language code for search results (default: auto)"
      },
      categories: {
        type: "string",
        enum: [
          "general",
          "news",
          "images",
          "videos",
          "it",
          "science",
          "map",
          "music",
          "files",
          "social_media"
        ],
        description: "Categories to search for (default: general)"
      },
      timeRange: {
        type: "string",
        description: "Time range for search results (default: all)",
        enum: [
          "all",
          "day",
          "week",
          "month",
          "year"
        ]
      }
    },
    required: ["query"]
  }
};
var SCRAPE_TOOL = {
  name: "one_scrape",
  description: "Scrape a single webpage with advanced options for content extraction. Supports various formats including markdown, HTML, and screenshots. Can execute custom actions like clicking or scrolling before scraping.",
  inputSchema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "The URL to scrape"
      },
      formats: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "markdown",
            "html",
            "rawHtml",
            "screenshot",
            "links",
            "screenshot@fullPage",
            "extract"
          ]
        },
        description: "Content formats to extract (default: ['markdown'])"
      },
      onlyMainContent: {
        type: "boolean",
        description: "Extract only the main content, filtering out navigation, footers, etc."
      },
      includeTags: {
        type: "array",
        items: { type: "string" },
        description: "HTML tags to specifically include in extraction"
      },
      excludeTags: {
        type: "array",
        items: { type: "string" },
        description: "HTML tags to exclude from extraction"
      },
      waitFor: {
        type: "number",
        description: "Time in milliseconds to wait for dynamic content to load"
      },
      timeout: {
        type: "number",
        description: "Maximum time in milliseconds to wait for the page to load"
      },
      actions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: [
                "wait",
                "click",
                "screenshot",
                "write",
                "press",
                "scroll",
                "scrape",
                "executeJavascript"
              ],
              description: "Type of action to perform"
            },
            selector: {
              type: "string",
              description: "CSS selector for the target element"
            },
            milliseconds: {
              type: "number",
              description: "Time to wait in milliseconds (for wait action)"
            },
            text: {
              type: "string",
              description: "Text to write (for write action)"
            },
            key: {
              type: "string",
              description: "Key to press (for press action)"
            },
            direction: {
              type: "string",
              enum: ["up", "down"],
              description: "Scroll direction"
            },
            script: {
              type: "string",
              description: "JavaScript code to execute"
            },
            fullPage: {
              type: "boolean",
              description: "Take full page screenshot"
            }
          },
          required: ["type"]
        },
        description: "List of actions to perform before scraping"
      },
      extract: {
        type: "object",
        properties: {
          schema: {
            type: "object",
            description: "Schema for structured data extraction"
          },
          systemPrompt: {
            type: "string",
            description: "System prompt for LLM extraction"
          },
          prompt: {
            type: "string",
            description: "User prompt for LLM extraction"
          }
        },
        description: "Configuration for structured data extraction"
      },
      mobile: {
        type: "boolean",
        description: "Use mobile viewport"
      },
      skipTlsVerification: {
        type: "boolean",
        description: "Skip TLS certificate verification"
      },
      removeBase64Images: {
        type: "boolean",
        description: "Remove base64 encoded images from output"
      },
      location: {
        type: "object",
        properties: {
          country: {
            type: "string",
            description: "Country code for geolocation"
          },
          languages: {
            type: "array",
            items: { type: "string" },
            description: "Language codes for content"
          }
        },
        description: "Location settings for scraping"
      }
    },
    required: ["url"]
  }
};
var EXTRACT_TOOL = {
  name: "one_extract",
  description: "Extract structured information from web pages using LLM. Supports both cloud AI and self-hosted LLM extraction.",
  inputSchema: {
    type: "object",
    properties: {
      urls: {
        type: "array",
        items: { type: "string" },
        description: "List of URLs to extract information from"
      },
      prompt: {
        type: "string",
        description: "Prompt for the LLM extraction"
      },
      systemPrompt: {
        type: "string",
        description: "System prompt for LLM extraction"
      },
      schema: {
        type: "object",
        description: "JSON schema for structured data extraction"
      },
      allowExternalLinks: {
        type: "boolean",
        description: "Allow extraction from external links"
      },
      enableWebSearch: {
        type: "boolean",
        description: "Enable web search for additional context"
      },
      includeSubdomains: {
        type: "boolean",
        description: "Include subdomains in extraction"
      }
    },
    required: ["urls"]
  }
};

// src/index.ts
var import_firecrawl_js = __toESM(require("@mendable/firecrawl-js"), 1);
var import_dotenvx = __toESM(require("@dotenvx/dotenvx"), 1);
import_dotenvx.default.config();
var SEARCH_API_URL = process.env.SEARCH_API_URL;
var SEARCH_API_KEY = process.env.SEARCH_API_KEY;
var SEARCH_PROVIDER = process.env.SEARCH_PROVIDER ?? "searxng";
var SAFE_SEARCH = process.env.SAFE_SEARCH ?? 0;
var LIMIT = process.env.LIMIT ?? 10;
var CATEGORIES = process.env.CATEGORIES ?? "general";
var ENGINES = process.env.ENGINES ?? "all";
var FORMAT = process.env.FORMAT ?? "json";
var LANGUAGE = process.env.LANGUAGE ?? "auto";
var TIME_RANGE = process.env.TIME_RANGE ?? "";
var DEFAULT_TIMEOUT = process.env.TIMEOUT ?? 1e4;
var FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
var FIRECRAWL_API_URL = process.env.FIRECRAWL_API_URL;
var firecrawl = new import_firecrawl_js.default({
  apiKey: FIRECRAWL_API_KEY ?? "",
  ...FIRECRAWL_API_URL ? { apiUrl: FIRECRAWL_API_URL } : {}
});
var server = new import_server.Server(
  {
    name: "one-search-mcp",
    version: "0.0.1"
  },
  {
    capabilities: {
      tools: {},
      logging: {}
    }
  }
);
var searchDefaultConfig = {
  limit: Number(LIMIT),
  categories: CATEGORIES,
  format: FORMAT,
  safesearch: SAFE_SEARCH,
  language: LANGUAGE,
  engines: ENGINES,
  time_range: TIME_RANGE,
  timeout: DEFAULT_TIMEOUT
};
server.setRequestHandler(import_types.ListToolsRequestSchema, async () => ({
  tools: [
    SEARCH_TOOL,
    EXTRACT_TOOL,
    SCRAPE_TOOL
  ]
}));
server.setRequestHandler(import_types.CallToolRequestSchema, async (request) => {
  const startTime = Date.now();
  try {
    const { name, arguments: args } = request.params;
    if (!args) {
      throw new Error("No arguments provided");
    }
    server.sendLoggingMessage({
      level: "info",
      data: `[${(/* @__PURE__ */ new Date()).toISOString()}] Received request for tool: [${name}]`
    });
    switch (name) {
      case "one_search": {
        if (!checkSearchArgs(args)) {
          throw new Error(`Invalid arguments for tool: [${name}]`);
        }
        try {
          const { results, success } = await processSearch({
            ...args,
            apiKey: SEARCH_API_KEY ?? "",
            apiUrl: SEARCH_API_URL
          });
          if (!success) {
            throw new Error("Failed to search");
          }
          const resultsText = results.map((result) => `Title: ${result.title}
URL: ${result.url}
Description: ${result.snippet}
${result.markdown ? `Content: ${result.markdown}` : ""}`);
          return {
            content: [
              {
                type: "text",
                text: resultsText.join("\n\n")
              }
            ],
            results,
            success
          };
        } catch (error) {
          server.sendLoggingMessage({
            level: "error",
            data: `[${(/* @__PURE__ */ new Date()).toISOString()}] Error searching: ${error}`
          });
          const msg = error instanceof Error ? error.message : "Unknown error";
          return {
            success: false,
            content: [
              {
                type: "text",
                text: msg
              }
            ]
          };
        }
      }
      case "one_scrape": {
        if (!checkScrapeArgs(args)) {
          throw new Error(`Invalid arguments for tool: [${name}]`);
        }
        try {
          const startTime2 = Date.now();
          server.sendLoggingMessage({
            level: "info",
            data: `[${(/* @__PURE__ */ new Date()).toISOString()}] Scraping started for url: [${args.url}]`
          });
          const { url: url2, ...scrapeArgs } = args;
          const { content, success, result } = await processScrape(url2, scrapeArgs);
          server.sendLoggingMessage({
            level: "info",
            data: `[${(/* @__PURE__ */ new Date()).toISOString()}] Scraping completed in ${Date.now() - startTime2}ms`
          });
          return {
            content,
            result,
            success
          };
        } catch (error) {
          server.sendLoggingMessage({
            level: "error",
            data: `[${(/* @__PURE__ */ new Date()).toISOString()}] Error scraping: ${error}`
          });
          const msg = error instanceof Error ? error.message : "Unknown error";
          return {
            success: false,
            content: [
              {
                type: "text",
                text: msg
              }
            ]
          };
        }
      }
      default: {
        throw new Error(`Unknown tool: ${name}`);
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    server.sendLoggingMessage({
      level: "error",
      data: {
        message: `[${(/* @__PURE__ */ new Date()).toISOString()}] Error processing request: ${msg}`,
        tool: request.params.name,
        arguments: request.params.arguments,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        duration: Date.now() - startTime
      }
    });
    return {
      success: false,
      content: [
        {
          type: "text",
          text: msg
        }
      ]
    };
  } finally {
    server.sendLoggingMessage({
      level: "info",
      data: `[${(/* @__PURE__ */ new Date()).toISOString()}] Request completed in ${Date.now() - startTime}ms`
    });
  }
});
async function processSearch(args) {
  switch (SEARCH_PROVIDER) {
    case "searxng": {
      const params = {
        ...searchDefaultConfig,
        ...args,
        apiKey: SEARCH_API_KEY
      };
      const { categories, language } = searchDefaultConfig;
      if (categories) {
        params.categories = categories;
      }
      if (language) {
        params.language = language;
      }
      return await searxngSearch(params);
    }
    case "tavily": {
      return await tavilySearch({
        ...searchDefaultConfig,
        ...args,
        apiKey: SEARCH_API_KEY
      });
    }
    case "bing": {
      return await bingSearch({
        ...searchDefaultConfig,
        ...args,
        apiKey: SEARCH_API_KEY
      });
    }
    default:
      throw new Error(`Unsupported search provider: ${SEARCH_PROVIDER}`);
  }
}
async function processScrape(url2, args) {
  const res = await firecrawl.scrapeUrl(url2, {
    ...args
  });
  if (!res.success) {
    throw new Error(`Failed to scrape: ${res.error}`);
  }
  const content = [];
  if (res.markdown) {
    content.push(res.markdown);
  }
  if (res.rawHtml) {
    content.push(res.rawHtml);
  }
  if (res.links) {
    content.push(res.links.join("\n"));
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
        type: "text",
        text: content.join("\n\n") || "No content found"
      }
    ],
    result: res,
    success: true
  };
}
function checkSearchArgs(args) {
  return typeof args === "object" && args !== null && "query" in args && typeof args.query === "string";
}
function checkScrapeArgs(args) {
  return typeof args === "object" && args !== null && "url" in args && typeof args.url === "string";
}
async function runServer() {
  try {
    process.stdout.write("Starting OneSearch MCP server...\n");
    const transport = new import_stdio.StdioServerTransport();
    await server.connect(transport);
    server.sendLoggingMessage({
      level: "info",
      data: "OneSearch MCP server started"
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error starting server: ${msg}
`);
    process.exit(1);
  }
}
runServer().catch((error) => {
  const msg = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Error running server: ${msg}
`);
  process.exit(1);
});
//# sourceMappingURL=index.cjs.map