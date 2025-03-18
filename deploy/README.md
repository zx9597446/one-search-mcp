# Self-hosting Guide (using Docker)

This document mainly explains how to deploy SearXNG and Firecrawl locally using Docker. You can also use other methods such as APIs provided by cloud services.

## Prerequisites

Before we dive in, make sure you have:

- Docker installed and running (version 20.10.0 or higher)
- At least 4GB of RAM available for the container

> Pro tip: Run `docker info` to check your Docker installation and available resources.

## How to deploy

```bash
git clone https://github.com/yokingma/one-search-mcp.git
cd one-search-mcp/deploy
docker compose up -d
```

Then you can access the server at:

- `http://127.0.0.1:8080` for SearXNG
- `http://127.0.0.1:3002` for Firecrawl

> Pro tip: If you want to change the port, you can modify the `docker-compose.yaml` file.

## SearXNG (Self-host)

Create a new SearXNG instance using Docker, for details see [searxng-docker](https://github.com/searxng/searxng-docker).

## Firecrawl (Self-host)

Create a new Firecrawl instance using Docker, for details see [firecrawl-self-host](https://github.com/mendableai/firecrawl/blob/main/SELF_HOST.md).
