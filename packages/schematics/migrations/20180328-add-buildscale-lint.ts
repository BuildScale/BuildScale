import { updateJsonFile } from '@buildscale/schematics/src/utils/fileutils';

export default {
  description: 'Run lint checks ensuring the integrity of the workspace',
  run: () => {
    updateJsonFile('package.json', json => {
      json.scripts = {
        ...json.scripts,
        lint: './node_modules/.bin/buildscale lint && ng lint'
      };
    });
  }
};
