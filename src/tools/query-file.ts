import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import vm from 'vm';
import { z } from 'zod';

import type { ToolContext, ToolDefinition } from '../shared/types.js';

const inputSchema = z.object({
  file_key: z.string().describe('Figma file key or URL'),
  query: z.string().describe('JavaScript code to query the design data. Use `document` to access the root node, or use helper functions like findByType(), findByName(), findById(), getAllText()')
});

// Helper functions available in the sandbox
const createHelpers = (document: any) => {
  const allNodes: any[] = [];
  
  // Recursively collect all nodes (skip hidden nodes)
  function collectAllNodes(node: any, collected: any[] = []) {
    // Skip hidden nodes (visible === false)
    if (node.visible === false) {
      return collected;
    }
    
    collected.push(node);
    if (node.children) {
      for (const child of node.children) {
        collectAllNodes(child, collected);
      }
    }
    return collected;
  }
  
  collectAllNodes(document, allNodes);
  
  return {
    document,
    
    // Find a node by ID
    findById: (id: string) => {
      return allNodes.find(n => n.id === id);
    },
    
    // Find all nodes by type
    findByType: (type: string) => {
      return allNodes.filter(n => n.type === type);
    },
    
    // Find all nodes by name (exact match)
    findByName: (name: string) => {
      return allNodes.filter(n => n.name === name);
    },
    
    // Find all nodes where name contains string (case insensitive)
    findByNameContains: (substring: string) => {
      const lower = substring.toLowerCase();
      return allNodes.filter(n => n.name.toLowerCase().includes(lower));
    },
    
    // Get all text content from the file
    getAllText: () => {
      return allNodes
        .filter(n => n.type === 'TEXT' && n.characters)
        .map(n => ({
          id: n.id,
          name: n.name,
          text: n.characters
        }));
    },
    
    // Get all components
    getAllComponents: () => {
      return allNodes.filter(n => n.type === 'COMPONENT');
    },
    
    // Get all component instances
    getAllInstances: () => {
      return allNodes.filter(n => n.type === 'INSTANCE');
    },
    
    // Get all frames
    getAllFrames: () => {
      return allNodes.filter(n => n.type === 'FRAME');
    },
    
    // Get direct children of a node
    getChildren: (nodeId: string) => {
      const node = allNodes.find(n => n.id === nodeId);
      return node?.children || [];
    },
    
    // Search nodes with custom predicate
    search: (predicate: (node: any) => boolean) => {
      return allNodes.filter(predicate);
    },
    
    // Get all nodes (for advanced queries)
    getAllNodes: () => allNodes
  };
};

// Strip heavy data from nodes to prevent context explosion
// Only strips geometry data which can be massive (thousands of path points)
function stripHeavyData(obj: any, maxDepth: number = 50, currentDepth: number = 0): any {
  if (currentDepth > maxDepth) {
    return '[Max depth reached]';
  }
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => stripHeavyData(item, maxDepth, currentDepth + 1));
  }
  
  if (typeof obj === 'object') {
    const stripped: any = {};
    for (const key in obj) {
      // Only skip pure geometry data (not style data)
      if (key === 'fillGeometry' || 
          key === 'strokeGeometry') {
        stripped[key] = '[Geometry data removed]';
        continue;
      }
      
      stripped[key] = stripHeavyData(obj[key], maxDepth, currentDepth + 1);
    }
    return stripped;
  }
  
  return obj;
}

async function handler(params: z.infer<typeof inputSchema>, context: ToolContext): Promise<CallToolResult> {
  let { file_key, query } = params;
  const { figma } = context;

  try {
    // Sanitize input
    file_key = file_key.trim();
    query = query.trim();

    // Extract file key from URL
    let actualFileKey = file_key;
    if (file_key.includes('figma.com')) {
      const match = file_key.match(/file\/([a-zA-Z0-9]+)/);
      if (match) {
        actualFileKey = match[1];
      }
    }

    const endpoint = `${figma.baseUrl}/v1/files/${actualFileKey}`;

    const response = await fetch(endpoint, {
      headers: {
        'X-Figma-Token': figma.accessToken
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Figma API error: ${response.status} ${response.statusText}. Details: ${errorBody}`);
    }

    const data = await response.json();

    // Create sandbox context with helpers
    const helpers = createHelpers(data.document);
    const sandbox = {
      ...helpers,
      console: {
        log: (...args: any[]) => console.log('[Query]', ...args)
      },
      JSON,
      Array,
      Object,
      String,
      Number,
      Math
    };

    // Execute the query
    // Detect if it's a single expression or multi-line statements
    const hasStatements = /\b(const|let|var|if|for|while|return)\b/.test(query) || query.includes(';');
    
    let wrappedQuery: string;
    if (hasStatements) {
      // Multi-line code - wrap in IIFE, user must use 'return'
      wrappedQuery = `(() => { ${query} })()`;
    } else {
      // Single expression - auto-return it
      wrappedQuery = `(() => { return ${query} })()`;
    }
    
    const script = new vm.Script(wrappedQuery);
    const vmContext = vm.createContext(sandbox);
    const result = script.runInContext(vmContext, {
      timeout: 5000, // 5 second timeout
      displayErrors: true
    });

    // Strip heavy data from result
    const strippedResult = stripHeavyData(result);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          file_name: data.name,
          file_key: actualFileKey,
          result: strippedResult
        })
      }]
    };

  } catch (error) {
    if (error instanceof Error && error.message.includes('timeout')) {
      return {
        content: [{
          type: 'text',
          text: `Query timeout: execution took longer than 5 seconds. Try a simpler query.`
        }]
      };
    }
    
    return {
      content: [{
        type: 'text',
        text: `Error executing query: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

export const queryFile: ToolDefinition = {
  name: 'query_file',
  description: `Execute JavaScript code to query Figma design data. Returns only the data you specify. Hidden nodes (visible: false) are automatically excluded.

Available helpers:
- document: Root node of the design
- findById(id): Find node by ID
- findByType(type): Find all nodes of type (e.g., 'FRAME', 'TEXT', 'COMPONENT')
- findByName(name): Find nodes by exact name
- findByNameContains(substring): Find nodes whose name contains substring
- getAllText(): Get all text content
- getAllComponents(): Get all components
- getAllInstances(): Get all component instances
- getAllFrames(): Get all frames
- getChildren(nodeId): Get direct children of a node
- search(predicate): Search with custom function
- getAllNodes(): Get all nodes for advanced queries

Example queries (single expression):
- findByType('TEXT').map(n => ({ name: n.name, text: n.characters }))
- document.children.map(page => ({ name: page.name, frameCount: page.children.length }))

Example queries (multi-line with return):
- const buttons = findByNameContains('Button'); return buttons.map(b => b.name);
- const frame = findById('123:456'); return frame.children.filter(n => n.type === 'TEXT');`,
  inputSchema,
  handler
};

