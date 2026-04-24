#!/usr/bin/env node
/**
 * Cross-platform entry point for tw3002.
 * Tries the compiled binary first, falls back to Bun source run.
 */

const { execSync, spawn } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');

const binary = join(__dirname, '..', 'tw3002');

if (existsSync(binary)) {
  // Compiled binary exists — use it
  const child = spawn(binary, process.argv.slice(2), {
    stdio: 'inherit',
    env: process.env,
  });
  child.on('exit', (code) => process.exit(code ?? 0));
} else if (process.argv.includes('--build')) {
  // Build the binary
  console.log('Building tw3002 binary...');
  try {
    execSync('bun run build', { cwd: join(__dirname, '..'), stdio: 'inherit' });
    console.log('Build complete. Run `tw3002` again.');
  } catch {
    console.error('Build failed. Ensure Bun is installed: https://bun.sh');
    process.exit(1);
  }
} else {
  console.error('Compiled binary not found.');
  console.error('');
  console.error('Options:');
  console.error('  1. Install Bun (https://bun.sh) and run: tw3002 --build');
  console.error('  2. Or build from source: cd cli && bun run build && ./tw3002');
  console.error('');
  console.error('For pre-built binaries, see GitHub Releases:');
  console.error('  https://github.com/prillcode/tw-3002-ai/releases');
  process.exit(1);
}
