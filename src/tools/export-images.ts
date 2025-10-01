import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import type { ToolContext, ToolDefinition } from '../shared/types.js';

const inputSchema = z.object({
  file_key: z.string().describe('Figma file key or URL'),
  node_ids: z.array(z.string()).describe('Node IDs to export as images (required)'),
  format: z.enum(['svg', 'png', 'jpg']).optional().default('png').describe('Image export format')
});

async function handler(params: z.infer<typeof inputSchema>, context: ToolContext): Promise<CallToolResult> {
  let { file_key, node_ids, format } = params;
  const { figma } = context;

  try {
    // Sanitize inputs - strip whitespace
    file_key = file_key.trim();
    if (node_ids) {
      node_ids = node_ids.map(id => id.trim()).filter(id => id.length > 0);
    }

    // Extract file key from URL if provided
    let actualFileKey = file_key;
    if (file_key.includes('figma.com')) {
      const match = file_key.match(/file\/([a-zA-Z0-9]+)/);
      if (match) {
        actualFileKey = match[1];
      }
    }

    // Export as image
    if (!node_ids || node_ids.length === 0) {
      throw new Error('node_ids are required for image exports');
    }

      const queryParams = new URLSearchParams({
        ids: node_ids.join(','),
        format: format
      });

      const response = await fetch(
        `${figma.baseUrl}/v1/images/${actualFileKey}?${queryParams.toString()}`,
        {
          headers: {
            'X-Figma-Token': figma.accessToken
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      let output = '';

      if (data.err) {
        output += `Error: ${data.err}\n`;
      }

      if (data.images) {
        for (const [nodeId, url] of Object.entries(data.images)) {
          output += `${nodeId}: ${url}\n`;
        }
      }

    return {
      content: [{
        type: 'text',
        text: output
      }]
    };

  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error fetching nodes: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

export const exportImages: ToolDefinition = {
  name: 'export_images',
  description: 'Export Figma nodes as images (SVG, PNG, JPG). Requires node_ids. Returns image URLs for download.',
  inputSchema,
  handler
};