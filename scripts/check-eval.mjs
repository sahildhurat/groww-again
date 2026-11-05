import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT_DIR = process.cwd();
const RESULTS_PATH = path.join(ROOT_DIR, 'eval', 'results.json');
const PROMPTS_DIR = path.join(ROOT_DIR, 'prompts');

console.log('Running Eval Gate on build (scripts/check-eval.mjs)...');

// 1. Verify results.json exists
if (!fs.existsSync(RESULTS_PATH)) {
  console.error('EVAL GATE FAILED: eval/results.json is missing. Run `npm run eval` before building.');
  process.exit(1);
}

let results;
try {
  results = JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf-8'));
} catch (e) {
  console.error('EVAL GATE FAILED: Could not parse eval/results.json');
  process.exit(1);
}

// 2. Verify all thresholds were met
if (!results.thresholds_met) {
  console.error('EVAL GATE FAILED: Some golden set thresholds were unmet in eval/results.json.');
  process.exit(1);
}

// 3. Verify prompt sha256 hashes match current prompts on disk
const promptFiles = fs.readdirSync(PROMPTS_DIR).filter(f => f.endsWith('.md'));
const savedHashes = results.prompt_hashes || {};

for (const file of promptFiles) {
  const filePath = path.join(PROMPTS_DIR, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const currentHash = crypto.createHash('sha256').update(content).digest('hex');

  const savedHash = savedHashes[file];
  if (!savedHash) {
    console.error(`EVAL GATE FAILED: No recorded prompt hash for ${file} in eval/results.json. Run \`npm run eval\`.`);
    process.exit(1);
  }

  if (currentHash !== savedHash) {
    console.error(`EVAL GATE FAILED: Prompt ${file} has changed (hash mismatch). Changing prompts forces a new eval before building.`);
    process.exit(1);
  }
}

console.log('Eval Gate passed: All golden set thresholds met and prompt hashes verified.');
process.exit(0);
