# Fetch MCP Server

![fetch mcp logo](logo.jpg)

This MCP server provides functionality to fetch web content in various formats, including HTML, JSON, plain text, and Markdown.

[Available on NPM](https://www.npmjs.com/package/mcp-fetch-server)

<a href="https://glama.ai/mcp/servers/nu09wf23ao">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/nu09wf23ao/badge" alt="Fetch Server MCP server" />
</a>

## Components

### Tools

- **impit_fetch_html**
  - Fetch a website and return the content as HTML
  - Input:
    - `url` (string, required): URL of the website to impit
    - `headers` (object, optional): Custom headers to include in the request
    - `max_length` (number, optional): Maximum length to fetch (default 5000, can change via environment variable)
    - `start_index` (number, optional): Used together with max_length to retrieve contents piece by piece, 0 by default
  - Returns the raw HTML content of the webpage

- **impit_fetch_json**
  - Fetch a JSON file from a URL
  - Input:
    - `url` (string, required): URL of the JSON to impit
    - `headers` (object, optional): Custom headers to include in the request
    - `max_length` (number, optional): Maximum length to fetch (default 5000, can change via environment variable)
    - `start_index` (number, optional): Used together with max_length to retrieve contents piece by piece, 0 by default
  - Returns the parsed JSON content

- **impit_fetch_txt**
  - Fetch a website and return the content as plain text (no HTML)
  - Input:
    - `url` (string, required): URL of the website to impit
    - `headers` (object, optional): Custom headers to include in the request
    - `max_length` (number, optional): Maximum length to fetch (default 5000, can change via environment variable)
    - `start_index` (number, optional): Used together with max_length to retrieve contents piece by piece, 0 by default
  - Returns the text content of the webpage with HTML tags, scripts, and styles removed

- **impit_fetch_markdown**
  - Fetch a website and return the content as Markdown
  - Input:
    - `url` (string, required): URL of the website to impit
    - `headers` (object, optional): Custom headers to include in the request
    - `max_length` (number, optional): Maximum length to fetch (default 5000, can change via environment variable)
    - `start_index` (number, optional): Used together with max_length to retrieve contents piece by piece, 0 by default
  - Returns the content of the webpage converted to Markdown format

### Resources

This server does not provide any persistent resources. It's designed to fetch and transform web content on demand.

## Getting started

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the server: `npm run build`

### Usage

To use the server, you can run it directly:

```bash
npm start
```

This will start the Fetch MCP Server running on stdio.

### Environment variables

- **DEFAULT_LIMIT** - sets the default size limit for the fetch (0 = no limit)

### Usage with Desktop App

#### For Published Packages
```json
{
  "mcpServers": {
    "fetch": {
      "command": "npx",
      "args": ["mcp-fetch-server"],
      "env": {
        "DEFAULT_LIMIT": "50000"
      }
    }
  }
}
```

#### For GitHub Forks
```json
{
  "mcpServers": {
    "fetch": {
      "command": "npx",
      "args": ["github:alpgul/impit-mcp"],
      "env": {
        "DEFAULT_LIMIT": "50000"
      }
    }
  }
}
```

## Features

- Fetches web content using Impit library for browser impersonation and advanced HTTP features
- Supports custom headers for requests
- Provides content in multiple formats: HTML, JSON, plain text, and Markdown
- Uses JSDOM for HTML parsing and text extraction
- Uses TurndownService for HTML to Markdown conversion
- Includes custom private IP blocking logic for security

## Development

- Run `npm run dev` to start the TypeScript compiler in watch mode
- After adding Impit, remember to install dependencies with `npm install`
- Use `npm test` to run the test suite

## License

This project is licensed under the MIT License.
