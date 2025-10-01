import type { ToolDefinition } from '../shared/types.js';

// Figma REST API tools - organized by workflow
import { exportImages } from './export-images.js';
import { getNodeDetails } from './get-node-details.js';
import { listFiles } from './list-files.js';
import { listProjects } from './list-projects.js';
import { listTeams } from './list-teams.js';
import { queryFile } from './query-file.js';

/**
 * Figma REST API Tool Registry
 *
 * Organized workflow for exploring Figma files:
 * 1. Discovery: list_teams → list_projects → list_files
 * 3. Query: query_file (execute JavaScript to query/filter design data)
 * 4. Details: get_node_details (specific node properties)
 * 5. Export: export_images (asset download)
 */
export const AVAILABLE_TOOLS: ToolDefinition[] = [
  listTeams,
  listProjects,
  listFiles,
  queryFile,
  getNodeDetails,
  exportImages
];

/**
 * Get all registered tools
 */
export function getAllTools(): ToolDefinition[] {
  return AVAILABLE_TOOLS;
}

/**
 * Get a specific tool by name
 */
export function getToolByName(name: string): ToolDefinition | undefined {
  return AVAILABLE_TOOLS.find(tool => tool.name === name);
}
