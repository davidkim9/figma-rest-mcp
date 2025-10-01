import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import type { ToolContext, ToolDefinition } from '../shared/types.js';

const inputSchema = z.object({
  file_key: z.string().describe('Figma file key or URL'),
  node_ids: z.array(z.string()).describe('Array of node IDs to retrieve (required)')
});

function findNodeById(node: any, targetId: string): any | null {
  if (node.id === targetId) {
    return node;
  }

  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, targetId);
      if (found) return found;
    }
  }

  return null;
}

function stripChildren(node: any): any {
  // Create a shallow copy without children property
  const stripped: any = {};

  for (const key in node) {
    if (key === 'children') {
      // Replace children array with just count and IDs
      if (node.children && node.children.length > 0) {
        stripped.children_count = node.children.length;
        stripped.children_ids = node.children.map((child: any) => ({
          id: child.id,
          name: child.name,
          type: child.type
        }));
      }
    } else if (key === 'fillGeometry' || key === 'strokeGeometry') {
      // Strip geometry data entirely
      continue;
    } else {
      stripped[key] = node[key];
    }
  }

  return stripped;
}

async function handler(params: z.infer<typeof inputSchema>, context: ToolContext): Promise<CallToolResult> {
  let { file_key, node_ids } = params;
  const { figma } = context;

  try {
    // Sanitize inputs
    file_key = file_key.trim();
    node_ids = node_ids.map(id => id.trim()).filter(id => id.length > 0);

    if (node_ids.length === 0) {
      throw new Error('At least one node_id is required');
    }

    // Extract file key from URL
    let actualFileKey = file_key;
    if (file_key.includes('figma.com')) {
      const match = file_key.match(/file\/([a-zA-Z0-9]+)/);
      if (match) {
        actualFileKey = match[1];
      }
    }

    // Build endpoint with parameters (no geometry to keep response small)
    const queryParams = new URLSearchParams({
      ids: node_ids.join(',')
    });
    const endpoint = `${figma.baseUrl}/v1/files/${actualFileKey}?${queryParams.toString()}`;

    const response = await fetch(endpoint, {
      headers: {
        'X-Figma-Token': figma.accessToken
      }
    });

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Extract only requested nodes and strip children
    const requestedNodes: any = {};

    for (const nodeId of node_ids) {
      const node = findNodeById(data.document, nodeId);
      if (node) {
        requestedNodes[nodeId] = stripChildren(node);
      }
    }

    // Return minified JSON with minimal data
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          name: data.name,
          nodes: requestedNodes
        })
      }]
    };

  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error fetching node details: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

export const getNodeDetails: ToolDefinition = {
  name: 'get_node_details',
  description: 'Get JSON details for specific nodes WITHOUT nested children. Returns node properties, styles, and child IDs only. Children are replaced with count and ID list to prevent context explosion.',
  inputSchema,
  handler
};
