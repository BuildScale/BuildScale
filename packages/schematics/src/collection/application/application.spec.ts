import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { Tree, VirtualTree } from '@angular-devkit/schematics';
import { readJsonInTree } from '../../utils/ast-utils';

describe('application', () => {
  const schematicRunner = new SchematicTestRunner(
    '@buildscale/schematics',
    path.join(__dirname, '../../collection.json')
  );

  let appTree: Tree;

  beforeEach(() => {
    appTree = new VirtualTree();
  });

  it('should generate files', () => {
    const tree = schematicRunner.runSchematic(
      'application',
      { name: 'myApp', directory: 'my-app' },
      appTree
    );
    expect(tree.files).toEqual([
      '/my-app/.prettierrc',
      '/my-app/README.md',
      '/my-app/.angular-cli.json',
      '/my-app/.editorconfig',
      '/my-app/.gitignore',
      '/my-app/apps/.gitkeep',
      '/my-app/karma.conf.js',
      '/my-app/libs/.gitkeep',
      '/my-app/package.json',
      '/my-app/protractor.conf.js',
      '/my-app/test.js',
      '/my-app/tsconfig.json',
      '/my-app/tsconfig.spec.json',
      '/my-app/tslint.json'
    ]);
  });

  it('should update package.json', () => {
    const tree = schematicRunner.runSchematic(
      'application',
      { name: 'myApp', directory: 'my-app' },
      appTree
    );
    const packageJson = readJsonInTree(tree, '/my-app/package.json');

    expect(packageJson.devDependencies['@buildscale/schematics']).toBeDefined();
    expect(packageJson.dependencies['@buildscale/buildscale']).toBeDefined();
    expect(packageJson.dependencies['@ngrx/store']).toBeDefined();
    expect(packageJson.dependencies['@ngrx/effects']).toBeDefined();
    expect(packageJson.dependencies['@ngrx/router-store']).toBeDefined();
    expect(packageJson.dependencies['@ngrx/store-devtools']).toBeDefined();
  });

  it('should set right npmScope', () => {
    const tree = schematicRunner.runSchematic(
      'application',
      { name: 'myApp', directory: 'my-app' },
      appTree
    );

    const angularCliJson = readJsonInTree(tree, '/my-app/.angular-cli.json');
    expect(angularCliJson.project.npmScope).toEqual('myApp');

    const tsconfigJson = readJsonInTree(tree, '/my-app/tsconfig.json');
    expect(tsconfigJson.compilerOptions.paths).toEqual({
      '@myApp/*': ['libs/*']
    });
  });
});
