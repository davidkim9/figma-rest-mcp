import fs from 'fs';
import path from 'path';

export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function generateScreenshotFilename(sessionId: string, selector: string, format: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const selectorSafe = selector.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 50);
  return `screenshot-${sessionId}-${selectorSafe}-${timestamp}.${format}`;
}

export function generateSectionFilename(index: number, selector: string, format: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const selectorHash = selector.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30);
  return `section-${index + 1}-${selectorHash}-${timestamp}.${format}`;
}