import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

export interface ToolFunction {
  (params: any, context: ToolContext): Promise<CallToolResult>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodObject<any>;
  handler: ToolFunction;
}

export interface FigmaConfig {
  accessToken: string;
  baseUrl: string;
}

export interface ToolContext {
  figma: FigmaConfig;
}