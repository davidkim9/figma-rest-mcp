# Available Tools

## Workflow Overview

This MCP server provides optimized tools for working with large Figma files without overwhelming LLM context windows.

### Recommended Workflow

1. **Discovery** - Find your files
   - `list_teams` → Get team IDs
   - `list_projects` → Get project IDs
   - `list_files` → Get file keys

2. **Structure** - Understand file organization
   - `get_file_structure` → Lightweight overview of pages and frames

3. **Content Extraction** - Get all text
   - `get_content_nodes` → Extract all text content with IDs

4. **Exploration** - Navigate interactively
   - `browse_file` → Explore pages and nodes step-by-step

5. **Details** - Get specific node information
   - `get_node_details` → Full JSON for specific nodes

6. **Export** - Download assets
   - `export_images` → Export as SVG/PNG/JPG

---

## Discovery Tools

### 1. `list_teams`
List teams that the authenticated user has access to.

**Parameters:** None

**Returns:**
- User information (email, ID)
- List of teams with names and IDs

**Example:**
```javascript
list_teams()
```

---

### 2. `list_projects`
List all projects in a Figma team.

**Parameters:**
- `team_id` (required): Team ID from list_teams

**Returns:**
- List of projects with names and IDs

**Example:**
```javascript
list_projects({ team_id: "123456" })
```

---

### 3. `list_files`
List Figma files in a project.

**Parameters:**
- `project_id` (optional): Project ID from list_projects

**Returns:**
- If `project_id` provided: List of files with names, keys, last modified dates, and thumbnails
- If no `project_id`: User information and instructions

**Example:**
```javascript
list_files({ project_id: "789012" })
```

---

## Structure & Exploration Tools

### 4. `get_file_structure`
Get lightweight file structure overview.

**Parameters:**
- `file_key` (required): Figma file key or URL

**Returns:**
- Hierarchical tree view of file structure
- Shows all pages and frames

**Why use this:** Perfect first step for understanding file organization without downloading massive JSON.

**Example:**
```javascript
get_file_structure({
  file_key: "abc123xyz"
})
```

---

### 5. `get_content_nodes`
Get all text content nodes from a Figma file.

**Parameters:**
- `file_key` (required): Figma file key or URL

**Returns:**
- Array of all text nodes with:
  - Node ID
  - Node name
  - Text content
  - Parent node ID

**Why use this:** Extract all text from a design file in one call. Perfect for content audits, translation, or finding specific text.

**Example:**
```javascript
get_content_nodes({
  file_key: "abc123xyz"
})
```

---

### 7. `browse_file`
Interactively browse a Figma file, exploring one level at a time.

**Parameters:**
- `file_key` (required): Figma file key or URL
- `node_id` (optional): Node ID to browse into (if omitted, shows pages)

**Returns:**
- List of children for the current node
- Node IDs for further exploration

**Why use this:** Navigate large files progressively instead of loading everything at once.

**Examples:**
```javascript
// Start at root (shows pages)
browse_file({ file_key: "abc123xyz" })

// Explore a specific page
browse_file({
  file_key: "abc123xyz",
  node_id: "1:2"
})
```

---

## Detail Tools

### 8. `get_node_details`
Get JSON details for specific nodes WITHOUT nested children.

**Parameters:**
- `file_key` (required): Figma file key or URL
- `node_ids` (required): Array of node IDs (must provide)

**Returns:**
- Node properties (fills, strokes, effects, constraints, etc.)
- Children replaced with: `children_count` and `children_ids` (just ID/name/type)
- No nested children data (prevents context explosion)
- No vector geometry
- Minified JSON format

**Why use this:** Get exact node properties without downloading entire subtrees. Perfect for inspecting individual nodes.

**Example:**
```javascript
get_node_details({
  file_key: "abc123xyz",
  node_ids: ["1:2"]
})
```

---

## Export Tool

### 8. `export_images`
Export Figma nodes as images.

**Parameters:**
- `file_key` (required): Figma file key or URL
- `node_ids` (required): Node IDs to export
- `format` (optional): "svg", "png", or "jpg" (default: "png")

**Returns:**
- URLs to exported images

**Example:**
```javascript
export_images({
  file_key: "abc123xyz",
  node_ids: ["1:2", "1:3"],
  format: "png"
})
```

---

## Tips for Working with Large Files

1. **Always start with `get_file_structure`** - Understand the layout before diving in
2. **Use `get_content_nodes` for text extraction** - Get all text content in one call
3. **Use `browse_file` for navigation** - Explore incrementally instead of loading everything
4. **Request specific nodes** - Never fetch entire files unless absolutely necessary
5. **Tools are simplified** - No version parameters or complex options to avoid errors

## Getting File Keys

You can use either:
- The file key directly: `abc123xyz`
- The full Figma URL: `https://www.figma.com/file/abc123xyz/My-Design`

All tools automatically extract the file key from URLs.
