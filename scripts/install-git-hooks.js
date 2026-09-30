#!/usr/bin/env node
/**
 * Points git at .githooks/ so the pre-commit design token check runs.
 * Runs on "npm install" (prepare). Does nothing when this package is installed as a dependency
 * (no .git folder here) or when git is not available.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

if (!fs.existsSync(path.join(ROOT, '.git'))) {
  process.exit(0);
}
try {
  execSync('git config core.hooksPath .githooks', { cwd: ROOT, stdio: 'ignore' });
  fs.chmodSync(path.join(ROOT, '.githooks/pre-commit'), 0o755);
  console.log('Git hooks installed: .githooks/pre-commit runs the design token validation.');
} catch (e) {
  console.warn(`Could not install git hooks: ${e.message}`);
}
