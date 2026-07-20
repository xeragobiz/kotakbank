const fs = require('fs');
const path = require('path');

const root = process.cwd();
const excludeDirs = new Set(['.git', 'node_modules', 'dist']);
const textExtensions = new Set(['.js', '.css', '.html', '.json', '.md', '.yaml', '.yml', '.txt']);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!excludeDirs.has(entry.name)) {
        walk(fullPath);
      }
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!textExtensions.has(ext)) {
      continue;
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('\r\n')) {
      fs.writeFileSync(fullPath, content.replace(/\r\n/g, '\n'));
    }
  }
}

walk(root);
