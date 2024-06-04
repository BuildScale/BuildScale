import { updateJsonFile } from '../src/utils/fileutils';

export default {
  description: 'Update the schema file to point to the buildscale schema.',
  run: () => {
    updateJsonFile('.angular-cli.json', json => {
      json['$schema'] = './node_modules/@buildscale/schematics/src/schema.json';
    });
  }
};
