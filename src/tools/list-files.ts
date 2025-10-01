import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import type { ToolContext, ToolDefinition } from '../shared/types.js';

const inputSchema = z.object({
  project_id: z.string().optional().describe('Project ID to list files from')
});

async function handler(params: z.infer<typeof inputSchema>, context: ToolContext): Promise<CallToolResult> {
  let { project_id } = params;
  const { figma } = context;

  try {
    // Sanitize input - strip whitespace
    if (project_id) {
      project_id = project_id.trim();
    }

    if (project_id) {
      // List files in a specific project
      const response = await fetch(`${figma.baseUrl}/v1/projects/${project_id}/files`, {
        headers: {
          'X-Figma-Token': figma.accessToken
        }
      });

      if (!response.ok) {
        throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const files = data.files || [];

      if (files.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'No files found in this project.'
          }]
        };
      }

      let output = '';

      for (const file of files) {
        output += `Name: ${file.name}\n`;
        output += `Key: ${file.key}\n`;
        output += `Last Modified: ${file.last_modified}\n`;
        output += `Thumbnail: ${file.thumbnail_url || 'N/A'}\n\n`;
      }

      return {
        content: [{
          type: 'text',
          text: output.trim()
        }]
      };
    } else {
      // Get user info with teams
      const meResponse = await fetch(`${figma.baseUrl}/v1/me`, {
        headers: {
          'X-Figma-Token': figma.accessToken
        }
      });

      if (!meResponse.ok) {
        throw new Error(`Figma API error: ${meResponse.status} ${meResponse.statusText}`);
      }

      const userData = await meResponse.json();

      let output = `Email: ${userData.email || 'N/A'}\n`;
      output += `ID: ${userData.id || 'N/A'}\n`;
      output += `Handle: ${userData.handle || 'N/A'}\n\n`;

      // Try to get team information from recent files
      if (userData.id) {
        // Get recent files which may include team information
        output += `To list files:\n`;
        output += `1. Use list_teams to get team IDs\n`;
        output += `2. Use list_projects with team_id to get project IDs\n`;
        output += `3. Use list_files with project_id to get files\n`;
      }

      return {
        content: [{
          type: 'text',
          text: output
        }]
      };
    }

  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error accessing Figma API: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

export const listFiles: ToolDefinition = {
  name: 'list_files',
  description: 'List Figma files in a project. If no project_id is provided, returns user information and instructions. Use list_teams and list_projects to discover IDs.',
  inputSchema,
  handler
};