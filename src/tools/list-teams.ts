import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import type { ToolContext, ToolDefinition } from '../shared/types.js';

const inputSchema = z.object({});

async function handler(params: z.infer<typeof inputSchema>, context: ToolContext): Promise<CallToolResult> {
  const { figma } = context;

  try {
    // Get user information which includes team memberships
    const response = await fetch(`${figma.baseUrl}/v1/me`, {
      headers: {
        'X-Figma-Token': figma.accessToken
      }
    });

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }

    const userData = await response.json();

    let output = `User: ${userData.email || 'N/A'}\n`;
    output += `ID: ${userData.id || 'N/A'}\n\n`;

    // Check if user has team information
    if (userData.teams && userData.teams.length > 0) {
      output += `Teams:\n`;
      for (const team of userData.teams) {
        output += `Name: ${team.name}\n`;
        output += `ID: ${team.id}\n\n`;
      }
    } else {
      output += `No teams found. Personal Figma accounts may not have team access. You can still access files directly if you have the file key.\n`;
    }

    return {
      content: [{
        type: 'text',
        text: output.trim()
      }]
    };

  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error accessing Figma API: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

export const listTeams: ToolDefinition = {
  name: 'list_teams',
  description: 'List teams that the authenticated user has access to. Returns user information and team IDs.',
  inputSchema,
  handler
};
