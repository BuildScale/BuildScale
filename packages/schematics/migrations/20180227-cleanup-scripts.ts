import { updateJsonFile } from '../src/utils/fileutils';

export default {
  description: 'Add update, update:skip, update:check scripts',
  run: () => {
    updateJsonFile('package.json', json => {
      json.scripts = {
        ...json.scripts,
        update: './node_modules/.bin/buildscale update',
        'update:check': './node_modules/.bin/buildscale update check',
        'update:skip': './node_modules/.bin/buildscale update skip',
        'buildscale-migrate': undefined,
        'buildscale-migrate:check': undefined,
        'buildscale-migrate:skip': undefined,
        'apps:affected': undefined,
        'build:affected': undefined,
        'e2e:affected': undefined
      };

      if (
        json.scripts.postinstall ===
        './node_modules/.bin/buildscale migrate check'
      ) {
        json.scripts.postinstall = './node_modules/.bin/buildscale postinstall';
      }
    });
  }
};
