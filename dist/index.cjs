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

// src/search.ts
var import_node_url = __toESM(require("url"), 1);
var import_core = require("@tavily/core");
async function searxngSearch(apiUrl, params) {
  try {
    const {
      query,
      limit = 10,
      categories = "general",
      engines = "all",
      safeSearch = 0,
      format = "json",
      language = "auto",
      timeRange = "",
      timeout = 1e4,
      apiKey = ""
    } = params;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Number(timeout));
    const config2 = {
      q: query,
      pageno: limit,
      categories,
      format,
      safesearch: safeSearch,
      language,
      engines,
      time_range: timeRange
    };
    const endpoint = `${apiUrl}/search`;
    const queryParams = import_node_url.default.format({ query: config2 });
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
    const result = await res.json();
    if (result.results) {
      const results = result.results.map((item) => {
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
    process.stdout.write(err?.message ?? "Searxng search error.");
    throw err;
  }
}
var tvly = null;
async function tavilySearch(query, options) {
  const {
    limit = 10,
    categories = "general",
    timeRange,
    apiKey
  } = options;
  if (!apiKey) {
    throw new Error("Tavily API key is required");
  }
  if (!tvly) {
    tvly = (0, import_core.tavily)({
      apiKey
    });
  }
  const params = {
    topic: categories,
    timeRange,
    maxResults: limit
  };
  const res = await tvly.search(query, params);
  const results = res.results.map((item) => ({
    title: item.title,
    url: item.url,
    snippet: item.content
  }));
  return {
    results,
    success: true
  };
}

// src/index.ts
var import_stdio = require("@modelcontextprotocol/sdk/server/stdio.js");
var import_dotenvx = __toESM(require("@dotenvx/dotenvx"), 1);
import_dotenvx.default.config();
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
        description: "Maximum number of results to return (default: 5)"
      },
      language: {
        type: "string",
        description: "Language code for search results (default: en)"
      },
      categories: {
        type: "string",
        description: "Categories to search for (default: general)"
      },
      timeRange: {
        type: "string",
        description: "Time range for search results (default: all)"
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
var SEARCH_API_URL = process.env.SEARCH_API_URL;
var SEARCH_API_KEY = process.env.SEARCH_API_KEY;
var SEARCH_PROVIDER = process.env.SEARCH_PROVIDER ?? "searxng";
if (!SEARCH_API_URL) {
  process.stderr.write("SEARCH_API_URL must be set");
  process.exit(1);
}
var SAFE_SEARCH = process.env.SAFE_SEARCH ?? 0;
var LIMIT = process.env.LIMIT ?? 10;
var CATEGORIES = process.env.CATEGORIES ?? "general";
var ENGINES = process.env.ENGINES ?? "all";
var FORMAT = process.env.FORMAT ?? "json";
var LANGUAGE = process.env.LANGUAGE ?? "auto";
var TIME_RANGE = process.env.TIME_RANGE ?? "";
var DEFAULT_TIMEOUT = process.env.TIMEOUT ?? 1e4;
var config = {
  pageno: LIMIT,
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
          const { results, success } = await processSearch(SEARCH_API_URL, {
            ...config,
            ...args,
            apiKey: SEARCH_API_KEY ?? ""
          });
          if (!success) {
            throw new Error("Failed to search");
          }
          return {
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
            error: msg
          };
        }
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
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
      error: error instanceof Error ? error.message : msg
    };
  } finally {
    server.sendLoggingMessage({
      level: "info",
      data: `[${(/* @__PURE__ */ new Date()).toISOString()}] Request completed in ${Date.now() - startTime}ms`
    });
  }
});
async function processSearch(apiUrl, args) {
  switch (SEARCH_PROVIDER) {
    case "searxng":
      return await searxngSearch(apiUrl, {
        ...config,
        ...args,
        apiKey: SEARCH_API_KEY
      });
    case "tavily":
      return await tavilySearch(apiUrl, {
        ...config,
        ...args,
        apiKey: SEARCH_API_KEY
      });
    default:
      throw new Error(`Unsupported search provider: ${SEARCH_PROVIDER}`);
  }
}
function checkSearchArgs(args) {
  return typeof args === "object" && args !== null && "query" in args && typeof args.query === "string";
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