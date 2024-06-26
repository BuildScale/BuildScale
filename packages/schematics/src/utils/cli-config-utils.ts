import * as yargsParser from 'yargs-parser';

import { readJsonFile } from './fileutils';

export function getAppDirectoryUsingCliConfig() {
  const cli = readJsonFile(process.cwd() + '/.angular-cli.json');

  const appName = getAppName();

  if (appName) {
    const app = cli.apps.find(a => a.name === appName);
    if (!app) {
      console.error(`Cannot find app '${appName}'.`);
      process.exit(1);
    } else if (app.root.startsWith('libs')) {
      console.error(`Cannot run e2e tests for a library.`);
      process.exit(1);
    } else {
      return `apps/${appName}`;
    }
  } else {
    console.error(`Please provide the app name using --app or -a.`);
    process.exit(1);
  }
}

export function makeSureNoAppIsSelected() {
  if (getAppName()) {
    console.error(
      'BuildScale only supports running unit tests for all apps and libs.'
    );
    console.error('You cannot use -a or --app.');
    console.error('Use fdescribe or fit to select a subset of tests to run.');
    process.exit(1);
  }
}

function getAppName() {
  return yargsParser(process.argv, {
    alias: {
      app: ['a']
    },
    string: ['app']
  }).app;
}
