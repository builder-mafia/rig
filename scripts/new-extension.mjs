#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import inquirer from 'inquirer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const extensionsDir = path.join(rootDir, 'extensions');
const boilerplateDir = path.join(extensionsDir, 'boilerplate');

function toPascalCase(str) {
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function replaceTemplateVars(content, vars) {
  let result = content;
  result = result.replaceAll('{{name}}', vars.name);
  result = result.replaceAll('{{pascalName}}', vars.pascalName);
  result = result.replaceAll('{{description}}', vars.description);
  return result;
}

const IGNORE_DIRS = ['node_modules', '.turbo', 'dist'];

function copyDir(src, dest, vars) {
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    // Skip ignored directories
    if (IGNORE_DIRS.includes(entry.name)) {
      continue;
    }

    const srcPath = path.join(src, entry.name);
    let destName = entry.name;

    // Rename extension.tsx to {name}Extension.tsx
    if (entry.name === 'extension.tsx') {
      destName = `${vars.name}Extension.tsx`;
    }

    const destPath = path.join(dest, destName);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, vars);
    } else {
      const content = fs.readFileSync(srcPath, 'utf-8');
      const processed = replaceTemplateVars(content, vars);
      fs.writeFileSync(destPath, processed);
    }
  }
}

async function main() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Extension name (kebab-case):',
      validate: input => {
        if (!input) return 'Name is required';
        if (!/^[a-z][a-z0-9-]*$/.test(input)) {
          return 'Name must be kebab-case (e.g., my-extension)';
        }
        if (fs.existsSync(path.join(extensionsDir, input))) {
          return `Extension "${input}" already exists`;
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'description',
      message: 'Extension description:',
      default: 'A new ALLIN extension',
    },
  ]);

  const vars = {
    name: answers.name,
    pascalName: toPascalCase(answers.name),
    description: answers.description,
  };

  const targetDir = path.join(extensionsDir, answers.name);

  console.log(`\nCreating extension "${answers.name}"...`);

  copyDir(boilerplateDir, targetDir, vars);

  // Run biome format on created files
  console.log('\nFormatting files with Biome...');
  try {
    execSync(`pnpm biome format --write "${targetDir}"`, {
      cwd: rootDir,
      stdio: 'inherit',
    });
  } catch {
    console.warn(
      'Warning: Biome formatting failed, but extension was created.',
    );
  }

  console.log(`\n✅ Extension created at: extensions/${answers.name}`);
  console.log('\nNext steps:');
  console.log(`  1. cd extensions/${answers.name}`);
  console.log('  2. pnpm install');
  console.log('  3. pnpm dev');
}

main().catch(console.error);
