# Figma REST MCP Server

![Let it run code](image.png)

A Model Context Protocol (MCP) server that provides Figma REST API automation capabilities. This server enables AI assistants like Claude/Cursor/ChatGPT to manage and interact with Figma files, retrieve design data, and export assets.

This package minimizes the amount of tools to help AI Agents pick the right tool for a given prompt.

## Features

- 🎨 **File Management** - List and inspect Figma files and projects
- 📊 **Design Data Access** - Get comprehensive file and node information
- 🖼️ **Asset Export** - Export nodes as images (SVG, PNG, JPG)
- 🚀 **Dual Transport** - HTTP and stdio (for Claude Code)

For detailed information about available tools, see [tools.md](tools.md).

## Table of Contents

- [Figma REST MCP Server](#figma-rest-mcp-server)
  - [Features](#features)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
    - [Prerequisites](#prerequisites)
    - [Quick Start](#quick-start)
  - [Configuration](#configuration)
    - [Cursor / Claude Code / Claude Desktop Configuration](#cursor--claude-code--claude-desktop-configuration)
    - [HTTP Transport (for n8n or other HTTP clients)](#http-transport-for-n8n-or-other-http-clients)
  - [Development](#development)
    - [Development Scripts](#development-scripts)
  - [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)
    - [Debug Logging](#debug-logging)
  - [Contributing](#contributing)
  - [License](#license)
  - [Acknowledgments](#acknowledgments)

## Installation

### Prerequisites
- Node.js 18 or higher
- Figma Access Token (Personal or OAuth)
- npm or yarn

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd figma-rest-mcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

   This will install dependencies and build the project.

3. **Run the server (http only)**

   For HTTP transport (n8n):
   ```bash
   FIGMA_ACCESS_TOKEN=your_token npm start
   ```

   For configuration based clients: [MCP Configuration](#configuration)

## Configuration

### Cursor / Claude Code / Claude Desktop Configuration

To use this server with Cursor/Claude Code/Claude Desktop, add it to your MCP settings file.

**Configuration:**
```json
{
  "mcpServers": {
    "figma-rest": {
      "command": "/Users/yourname/.nvm/versions/node/v24.4.1/bin/node",
      "args": [
        "/Users/yourname/projects/figma-rest-mcp/dist/stdio-server.js"
      ],
      "env": {
        "FIGMA_ACCESS_TOKEN": "your_figma_token_here"
      }
    }
  }
}
```

To get your Figma Access Token:
[https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens](https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens)


> **Note:** After updating the configuration, restart Claude Code/Desktop for changes to take effect.
>
> **Important:** Ensure you have a valid Figma Access Token set in the environment variables.

> **Note:** After updating the configuration, restart Cursor for changes to take effect.
>
> **Important:** Never commit your Figma Access Token to version control.

### HTTP Transport (for n8n or other HTTP clients)

Start the HTTP server:
```bash
FIGMA_ACCESS_TOKEN=your_token npm start
# or with custom port
FIGMA_ACCESS_TOKEN=your_token PORT=4202 npm start

# With authentication
FIGMA_ACCESS_TOKEN=your_token MCP_AUTH_TOKEN=your-secret-token npm start
```

The server will listen on `http://localhost:4202/mcp` (or your custom port).

**Authentication (Optional):**

You can secure the HTTP server with token-based authentication by setting the `MCP_AUTH_TOKEN` environment variable. If set, all requests must include the token in the `Authorization` header.

**Example HTTP Request (without authentication):**
```bash
curl -X POST http://localhost:4202/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_files",
      "arguments": {}
    }
  }'
```

**Example HTTP Request (with authentication):**
```bash
curl -X POST http://localhost:4202/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-token" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_files",
      "arguments": {}
    }
  }'
```

## Development

### Development Scripts

```bash
# Start HTTP server with auto-reload
npm run dev

# Start stdio server with auto-reload
npm run dev:stdio

# Build TypeScript to JavaScript
npm run build
```

## Troubleshooting

### Common Issues

**1. Missing Figma Access Token**
```
Error: FIGMA_ACCESS_TOKEN environment variable is required
```
Solution: Set your Figma Access Token in the environment variables or configuration file.

**2. Invalid Figma Access Token**
```
Error: Figma API error: 403 Forbidden
```
Solution: Verify your token is valid and has the necessary permissions. Generate a new token if needed.

**3. Node.js version too old**
```
Error: Node.js 18 or higher required
```
Solution: Update Node.js to version 18 or higher.

**4. File not found**
```
Error: Figma API error: 404 Not Found
```
Solution: Verify the file key or URL is correct with `get_file_info`.

**5. Port already in use (HTTP mode)**
```
Error: listen EADDRINUSE: address already in use :::4202
```
Solution: Change the port with `PORT=3001 npm start`

**6. Rate limiting**
```
Error: Figma API error: 429 Too Many Requests
```
Solution: Wait a moment before retrying. Figma has rate limits on API requests.

### Debug Logging

For stdio mode, logs are written to stderr and appear in Claude Code logs:
- macOS: `~/Library/Logs/Claude/mcp-server-figma-rest.log`
- Linux: `~/.config/Claude/logs/mcp-server-figma-rest.log`

For HTTP mode, logs appear in the terminal where you started the server.

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run build` to ensure it compiles
5. Test your changes
6. Submit a pull request

## License

MIT

## Acknowledgments

Built with:
- [Figma REST API](https://www.figma.com/developers/api) - Figma API
- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk) - MCP implementation
- [Zod](https://zod.dev/) - Schema validation
- [Express](https://expressjs.com/) - HTTP server
