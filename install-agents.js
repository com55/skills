#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

const REPO_ROOT = __dirname;
const AGENTS_SRC = path.join(REPO_ROOT, 'agents');
const AGENTS_DEST = path.join(os.homedir(), '.claude', 'agents');

function parseOnlyFlag(argv) {
  const idx = argv.indexOf('--only');
  if (idx === -1) return null;
  const name = argv[idx + 1];
  if (!name) {
    console.error('--only requires a name, e.g. --only scrutinize-reviewer');
    process.exit(1);
  }
  return name;
}

function main() {
  const only = parseOnlyFlag(process.argv.slice(2));
  fs.mkdirSync(AGENTS_DEST, { recursive: true });

  const files = fs.readdirSync(AGENTS_SRC).filter((f) => f.endsWith('.md'));
  const targets = only ? files.filter((f) => f === `${only}.md`) : files;

  if (only && targets.length === 0) {
    console.error(`no agent named "${only}" found in ${AGENTS_SRC}`);
    process.exit(1);
  }

  for (const file of targets) {
    fs.copyFileSync(path.join(AGENTS_SRC, file), path.join(AGENTS_DEST, file));
    console.log(`installed: ${path.join(AGENTS_DEST, file)}`);
  }

  console.log('start a new session in your harness to activate the installed agent(s)');
}

main();
