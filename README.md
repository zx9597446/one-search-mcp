# 🚀 OneSearch MCP Server: Web Search & Crawl & Scraper & Extract

A Model Context Protocol (MCP) server implementation that integrates with Searxng/Firecrawl/Tavily for web search and scraping capabilities.

## Features

- Web Search, scrape, crawl and extract content from websites.
- Support multiple search engines and web scrapers: SearXNG, Firecrawl, Tavily, etc.
- Support for self-hosted: SearXNG, Firecrawl, etc. (see [Deploy](./deploy/README.md))

## Installation

```shell
npm install -g one-search-mcp
```

```shell
# Running with npx
env SEARCH_API_KEY=YOUR_API_KEY SEARCH_API_URL=YOUR_API_URL npx -y one-search-mcp
```

## Self-host

Local deployment of Searxng and Firecrawl, please refer to [Deploy](./deploy/README.md)

## License

MIT License - see [LICENSE](./LICENSE) file for details.
