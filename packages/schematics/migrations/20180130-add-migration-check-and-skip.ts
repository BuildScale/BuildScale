import { updateJsonFile } from '../src/utils/fileutils';

export default {
  description: 'Add buildscale-migrate:check and buildscale-migrate:skip to npm scripts',
  run: () => {
    updateJsonFile('package.json', json => {
      json.scripts = {
        ...json.scripts,

        'buildscale-migrate': './node_modules/.bin/buildscale migrate',
        'buildscale-migrate:check': './node_modules/.bin/buildscale migrate check',
        'buildscale-migrate:skip': './node_modules/.bin/buildscale migrate skip'
      };
    });
  }
};
