#!/usr/bin/env node
import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { ToolContext, FigmaConfig } from './shared/types.js';
import { getAllTools } from './tools/registry.js';

/*
 * FIGMA REST API MCP SERVER (STDIO)
 *
 * This is the stdio version of the Figma REST API MCP server.
 * It provides Figma file management and data access capabilities via stdio transport.
 */

// Initialize Figma configuration
const figmaConfig: FigmaConfig = {
  accessToken: process.env.FIGMA_ACCESS_TOKEN || '',
  baseUrl: process.env.FIGMA_BASE_URL || 'https://api.figma.com'
};

// Validate configuration
if (!figmaConfig.accessToken) {
  console.error('Error: FIGMA_ACCESS_TOKEN environment variable is required');
  process.exit(1);
}

// Create tool context
const toolContext: ToolContext = {
  figma: figmaConfig
};

const getServer = () => {
  const server = new McpServer({
    name: 'figma-rest-mcp-server',
    version: '1.0.0',
  }, { capabilities: { logging: {} } });

  // Register all tools from the registry
  const tools = getAllTools();

  tools.forEach(toolDef => {
    server.tool(
      toolDef.name,
      toolDef.description,
      toolDef.inputSchema.shape,
      async (params: unknown) => {
        return await toolDef.handler(params, toolContext);
      }
    );
  });

  console.error(`✅ Registered ${tools.length} tools:`);
  tools.forEach(tool => {
    console.error(`   • ${tool.name}: ${tool.description}`);
  });

  return server;
};

// Main function to start the stdio server
async function main() {
  const server = getServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error('🎨 Figma REST API MCP Server running on stdio');

  // Handle server shutdown
  const cleanup = async () => {
    console.error('\n🔄 Shutting down server...');
    console.error('👋 Server shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});