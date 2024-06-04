import { updateJsonFile } from '../src/utils/fileutils';

export default {
  description: 'Update npm scripts to use the buildscale command',
  run: () => {
    updateJsonFile('package.json', json => {
      json.scripts = {
        ...json.scripts,

        'apps:affected': './node_modules/.bin/buildscale affected apps',
        'build:affected': './node_modules/.bin/buildscale affected build',
        'e2e:affected': './node_modules/.bin/buildscale affected e2e',

        'affected:apps': './node_modules/.bin/buildscale affected apps',
        'affected:build': './node_modules/.bin/buildscale affected build',
        'affected:e2e': './node_modules/.bin/buildscale affected e2e',

        format: './node_modules/.bin/buildscale format write',
        'format:write': './node_modules/.bin/buildscale format write',
        'format:check': './node_modules/.bin/buildscale format check',

        'buildscale-migrate': './node_modules/.bin/buildscale migrate'
      };
    });
  }
};
