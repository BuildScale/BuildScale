#!/usr/bin/env node

import { execSync } from 'child_process';
import { dirSync } from 'tmp';
import { lt } from 'semver';
import { writeFileSync } from 'fs';
import * as path from 'path';
import * as yargsParser from 'yargs-parser';

import { readJsonFile } from '../src/utils/fileutils';

const parsedArgs = yargsParser(process.argv, {
  string: ['directory'],
  boolean: ['yarn', 'bazel', 'help']
});

if (parsedArgs.help) {
  console.log(`
    Usage: create-buildscale-workspace <directory> [options] [ng new options]

    Create a new BuildScale workspace (that is to say a new angular-cli project using @buildscale/schematics)

    Options:

      directory             path to the workspace root directory
      --yarn                use yarn instead of npm (default to false)
      --bazel               use bazel instead of webpack (default to false)

      [ng new options]      any 'ng new' options
                            run 'ng help new' for more informations
  `);
  process.exit(0);
}
const useYarn = parsedArgs.yarn;

const schematicsTool = {
  name: 'Schematics',
  packageName: '@buildscale/schematics'
};
const bazelTool = {
  name: 'Bazel',
  packageName: '@buildscale/bazel'
};

const buildscaleTool = parsedArgs.bazel ? bazelTool : schematicsTool;

if (!useYarn) {
  try {
    // check the correct version of the NPM is installed
    const output = execSync('npm --version').toString();
    if (lt(output, '5.0.0')) {
      console.error(
        'To create a workspace you must have NPM >= 5.0.0 installed.'
      );
      process.exit(1);
    }
  } catch (e) {
    console.error(
      'Cannot find npm. If you want to use yarn to create a project, pass the --yarn flag.'
    );
    process.exit(1);
  }
}

const projectName = parsedArgs._[2];

// check that the workspace name is passed in
if (!projectName) {
  console.error(
    'Please provide a project name (e.g., create-buildscale-workspace buildscale-proj)'
  );
  process.exit(1);
}

// creating the sandbox
console.log(
  `Creating a sandbox with the CLI and BuildScale ${buildscaleTool.name}...`
);
const tmpDir = dirSync().name;
const buildscaleVersion = readJsonFile(
  path.join(path.dirname(__dirname), 'package.json')
).version;
writeFileSync(
  path.join(tmpDir, 'package.json'),
  JSON.stringify({
    dependencies: {
      [buildscaleTool.packageName]: buildscaleVersion,
      '@angular/cli': '1.7.1'
    },
    license: 'MIT'
  })
);

if (useYarn) {
  execSync('yarn install --silent', { cwd: tmpDir, stdio: [0, 1, 2] });
} else {
  execSync('npm install --silent', { cwd: tmpDir, stdio: [0, 1, 2] });
}

// creating the app itself
const args = process.argv
  .slice(2)
  .filter(a => a !== '--yarn' && a !== '--bazel')
  .map(a => `"${a}"`)
  .join(' ');
console.log(`ng new ${args} --collection=${buildscaleTool.packageName}`);
execSync(
  `${path.join(
    tmpDir,
    'node_modules',
    '.bin',
    'ng'
  )} new ${args} --skip-install --collection=${buildscaleTool.packageName}`,
  {
    stdio: [0, 1, 2]
  }
);

const dir = parsedArgs.directory;

const cwd = dir ? dir.split('=')[1] : projectName;

if (useYarn) {
  execSync(`yarn install`, { stdio: [0, 1, 2], cwd });
} else {
  execSync(`npm install`, { stdio: [0, 1, 2], cwd });
}
