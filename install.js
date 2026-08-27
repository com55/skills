#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

const REPO_ROOT = __dirname;
const SKILLS_SRC = path.join(REPO_ROOT, 'skills');
const AGENTS_SRC = path.join(REPO_ROOT, 'agents');

// Cursor and Claude Code both read ~/.claude/skills/ and ~/.claude/agents/
// natively. ~/.agents/skills/ is the emerging vendor-neutral convention for
// skills (OpenCode reads it too). ~/.agents/agents/ has no confirmed reader
// yet as of writing — nothing is known to look there — but it's a cheap,
// harmless bet on the same convention extending to agents later.
const SKILLS_DESTS = [
  path.join(os.homedir(), '.claude', 'skills'),
  path.join(os.homedir(), '.agents', 'skills'),
];
const AGENTS_DESTS = [
  path.join(os.homedir(), '.claude', 'agents'),
  path.join(os.homedir(), '.agents', 'agents'),
];

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

function installSkills(only) {
  const names = fs
    .readdirSync(SKILLS_SRC)
    .filter((n) => fs.statSync(path.join(SKILLS_SRC, n)).isDirectory());
  const targets = only ? names.filter((n) => n === only) : names;

  for (const name of targets) {
    const src = path.join(SKILLS_SRC, name);
    for (const destRoot of SKILLS_DESTS) {
      fs.mkdirSync(destRoot, { recursive: true });
      const dest = path.join(destRoot, name);
      fs.cpSync(src, dest, { recursive: true });
      console.log(`installed skill: ${dest}`);
    }
  }
  return targets;
}

function installAgents(only) {
  const files = fs.readdirSync(AGENTS_SRC).filter((f) => f.endsWith('.md'));
  const targets = only ? files.filter((f) => f === `${only}.md`) : files;

  for (const file of targets) {
    for (const destRoot of AGENTS_DESTS) {
      fs.mkdirSync(destRoot, { recursive: true });
      const dest = path.join(destRoot, file);
      fs.copyFileSync(path.join(AGENTS_SRC, file), dest);
      console.log(`installed agent: ${dest}`);
    }
  }
  return targets;
}

function main() {
  const only = parseOnlyFlag(process.argv.slice(2));

  const installedSkills = installSkills(only);
  const installedAgents = installAgents(only);

  if (only && installedSkills.length === 0 && installedAgents.length === 0) {
    console.error(`no skill or agent named "${only}" found in this repo`);
    process.exit(1);
  }

  console.log('start a new session in your harness to activate what was installed');
}

main();
