import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import type { ToolContext, ToolDefinition } from '../shared/types.js';

const inputSchema = z.object({
  team_id: z.string().describe('Team ID to list projects from')
});

async function handler(params: z.infer<typeof inputSchema>, context: ToolContext): Promise<CallToolResult> {
  let { team_id } = params;
  const { figma } = context;

  try {
    // Sanitize input - strip whitespace
    team_id = team_id.trim();

    const response = await fetch(`${figma.baseUrl}/v1/teams/${team_id}/projects`, {
      headers: {
        'X-Figma-Token': figma.accessToken
      }
    });

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const projects = data.projects || [];

    if (projects.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No projects found in this team.'
        }]
      };
    }

    let output = '';

    for (const project of projects) {
      output += `Name: ${project.name}\n`;
      output += `ID: ${project.id}\n\n`;
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

export const listProjects: ToolDefinition = {
  name: 'list_projects',
  description: 'List all projects in a Figma team. Requires team_id from list_teams.',
  inputSchema,
  handler
};
