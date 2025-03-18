# 🚀 OneSearch MCP Server: Web Search & Crawl & Scraper & Extract

A Model Context Protocol (MCP) server implementation that integrates with Searxng/Firecrawl/Tavily for web search and scraping capabilities.

## Features

- Web Search, scrape, crawl and extract content from websites.
- Support multiple search engines and web scrapers: SearXNG, Firecrawl, Tavily, etc.
- Support for self-hosted: SearXNG, Firecrawl, etc. (see [Deploy](./deploy/README.md))

## Installation

```shell
# Install globally
npm install -g one-search-mcp
```

```shell
# Running with npx
env SEARCH_API_KEY=YOUR_API_KEY SEARCH_API_URL=YOUR_API_URL npx -y one-search-mcp
```

## Environment Variables

- SEARCH_PROVIDER (Optional): The search provider to use, either `searxng` or `tavily`, default is `searxng`.
- SEARCH_API_URL (Optional): The URL of the SearxNG API, required for `searxng`.
- SEARCH_API_KEY (Optional): The API key for the search provider, required for `tavily`.

## Running on Cursor

Your `mcp.json` file will look like this:

```json
{
  "mcpServers": {
    "one-search-mcp": {
      "command": "npx",
      "args": ["-y", "one-search-mcp"],
      "env": {
        "SEARCH_PROVIDER": "searxng",
        "SEARCH_API_URL": "http://127.0.0.1:8080",
        "SEARCH_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

## Running on Windsurf

Add this to your `./codeium/windsurf/model_config.json` file:

```json
{
  "mcpServers": {
    "one-search-mcp": {
      "command": "npx",
      "args": ["-y", "one-search-mcp"],
      "env": {
        "SEARCH_PROVIDER": "searxng",
        "SEARCH_API_URL": "http://127.0.0.1:8080",
        "SEARCH_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

## Self-host

Local deployment of SearXNG and Firecrawl, please refer to [Deploy](./deploy/README.md)

## License

MIT License - see [LICENSE](./LICENSE) file for details.
