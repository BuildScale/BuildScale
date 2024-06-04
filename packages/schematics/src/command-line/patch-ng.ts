import { readFileSync, statSync, writeFileSync } from 'fs';
import * as path from 'path';

const buildscaleCheck = `
// buildscale-check
if (options.cliArgs.indexOf('update') > -1) {
  console.log("This is an BuildScale workspace, and it provides an enhanced 'update' command.");
  console.log('Please run "npm run update" or "yarn update" instead.');
  process.exit(1);

} else {
  return cli(options);
}
// buildscale-check-end
`;

export function patchNg() {
  const cli = path.join('node_modules', '@angular', 'cli', 'lib', 'cli', 'index.js');
  if (fileExists(cli)) {
    const file = readFileSync(cli).toString();
    writeFileSync(cli, addBuildScaleCheck(file));
  }
}

function addBuildScaleCheck(file: string): string {
  if (file.indexOf('buildscale-check') > -1) return file;
  return file.replace(`return cli(options);`, buildscaleCheck);
}

function fileExists(filePath: string): boolean {
  try {
    return statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}
