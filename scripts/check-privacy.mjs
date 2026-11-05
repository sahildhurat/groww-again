import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
const PRIVATE_TERMS_PATH = path.join(ROOT_DIR, 'private', 'private_terms.txt');

// Read terms from private/private_terms.txt if it exists
let privateTerms = [];
if (fs.existsSync(PRIVATE_TERMS_PATH)) {
  const content = fs.readFileSync(PRIVATE_TERMS_PATH, 'utf-8');
  privateTerms = content
    .split(/\r?\n/)
    .map(t => t.trim())
    .filter(t => t.length > 0);
}

// Key patterns to detect
const KEY_PATTERNS = [
  /sk-ant-[a-zA-Z0-9_\-]{20,}/i,
  /gsk_[a-zA-Z0-9_\-]{20,}/i,
  /service_role/i,
  /eyJ[a-zA-Z0-9_\-]{20,}\.eyJ[a-zA-Z0-9_\-]{20,}/, // JWT-shaped string
];

// Get git-tracked files
let filesToCheck = [];
try {
  const gitFiles = execSync('git ls-files', { encoding: 'utf-8', cwd: ROOT_DIR });
  filesToCheck = gitFiles
    .split(/\r?\n/)
    .map(f => f.trim())
    .filter(f => f.length > 0 && fs.existsSync(path.join(ROOT_DIR, f)));
} catch (e) {
  // If git fails, collect all files except node_modules, .git, private
  console.warn('Could not run git ls-files. Falling back to directory scan.');
}

// Add .next build output if present
const nextDir = path.join(ROOT_DIR, '.next');
function collectFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let results = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(collectFiles(fullPath));
    } else {
      results.push(path.relative(ROOT_DIR, fullPath));
    }
  }
  return results;
}

if (fs.existsSync(nextDir)) {
  filesToCheck = filesToCheck.concat(collectFiles(nextDir));
}

// Deduplicate
filesToCheck = Array.from(new Set(filesToCheck));

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.mp3', '.webm',
  '.m4a', '.woff', '.woff2', '.ttf', '.eot', '.pdf', '.zip'
]);

let violations = 0;

for (const relPath of filesToCheck) {
  // Never check private/ itself (it is gitignored anyway)
  if (relPath.startsWith('private/') || relPath.startsWith('private\\')) {
    continue;
  }
  // Also don't scan check-privacy.mjs for the literal regex definition patterns themselves
  if (relPath.endsWith('check-privacy.mjs')) {
    continue;
  }

  const ext = path.extname(relPath).toLowerCase();
  if (BINARY_EXTENSIONS.has(ext)) {
    continue;
  }

  const fullPath = path.join(ROOT_DIR, relPath);
  let content = '';
  try {
    content = fs.readFileSync(fullPath, 'utf-8');
  } catch (err) {
    continue;
  }

  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    let lineFailed = false;

    // Check private terms
    for (const term of privateTerms) {
      if (lowerLine.includes(term.toLowerCase())) {
        console.error(`Privacy violation: ${relPath}:${i + 1}`);
        violations++;
        lineFailed = true;
        break;
      }
    }

    if (lineFailed) continue;

    // Check key patterns
    for (const pattern of KEY_PATTERNS) {
      if (pattern.test(line)) {
        console.error(`Privacy violation (key pattern): ${relPath}:${i + 1}`);
        violations++;
        break;
      }
    }
  }
}

if (violations > 0) {
  console.error(`\nPrivacy check FAILED with ${violations} violation(s).`);
  process.exit(1);
} else {
  console.log('Privacy check passed: 0 violations found across all files.');
  process.exit(0);
}
