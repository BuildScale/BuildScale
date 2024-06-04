import { updateJsonFile } from '../src/utils/fileutils';

export default {
  description: 'Add postinstall script to run buildscale-migrate:check',
  run: () => {
    updateJsonFile('package.json', json => {
      if (!json.scripts.postinstall) {
        json.scripts = {
          ...json.scripts,
          postinstall: './node_modules/.bin/buildscale migrate check'
        };
      }
    });
  }
};
