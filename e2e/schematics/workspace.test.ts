import {
  checkFilesExist,
  cleanup,
  copyMissingPackages,
  runCLI,
  runNgNew,
  updateFile,
  readFile,
  readJson
} from '../utils';
import { angularCliSchema } from '../../packages/schematics/src/lib-versions';

describe('Nrwl Convert to BuildScale Workspace', () => {
  beforeEach(cleanup);

  it('should generate a workspace', () => {
    runNgNew();
    copyMissingPackages();

    // update package.json
    const packageJson = readJson('package.json');
    packageJson.description = 'some description';
    updateFile('package.json', JSON.stringify(packageJson, null, 2));
    // confirm that @buildscale and @ngrx dependencies do not exist yet
    expect(
      packageJson.devDependencies['@buildscale/schematics']
    ).not.toBeDefined();
    expect(
      packageJson.dependencies['@buildscale/buildscale']
    ).not.toBeDefined();
    expect(packageJson.dependencies['@ngrx/store']).not.toBeDefined();
    expect(packageJson.dependencies['@ngrx/effects']).not.toBeDefined();
    expect(packageJson.dependencies['@ngrx/router-store']).not.toBeDefined();
    expect(packageJson.dependencies['@ngrx/store-devtools']).not.toBeDefined();

    // update tsconfig.json
    const tsconfigJson = readJson('tsconfig.json');
    tsconfigJson.compilerOptions.paths = { a: ['b'] };
    updateFile('tsconfig.json', JSON.stringify(tsconfigJson, null, 2));

    // update angular-cli.json
    const angularCLIJson = readJson('.angular-cli.json');
    angularCLIJson.apps[0].scripts = ['../node_modules/x.js'];
    updateFile('.angular-cli.json', JSON.stringify(angularCLIJson, null, 2));

    // run the command
    runCLI(
      'generate workspace proj --npmScope=proj --collection=@buildscale/schematics'
    );

    // check that prettier config exits and that files have been moved!
    checkFilesExist(
      '.prettierrc',
      'apps/proj/src/main.ts',
      'apps/proj/src/app/app.module.ts'
    );

    // check that package.json got merged
    const updatedPackageJson = readJson('package.json');
    expect(updatedPackageJson.description).toEqual('some description');
    expect(
      updatedPackageJson.devDependencies['@buildscale/schematics']
    ).toBeDefined();
    expect(
      updatedPackageJson.dependencies['@buildscale/buildscale']
    ).toBeDefined();
    expect(updatedPackageJson.dependencies['@ngrx/store']).toBeDefined();
    expect(updatedPackageJson.dependencies['@ngrx/effects']).toBeDefined();
    expect(updatedPackageJson.dependencies['@ngrx/router-store']).toBeDefined();
    expect(
      updatedPackageJson.dependencies['@ngrx/store-devtools']
    ).toBeDefined();

    // check if angular-cli.json get merged
    const updatedAngularCLIJson = readJson('.angular-cli.json');
    expect(updatedAngularCLIJson.$schema).toEqual(angularCliSchema);
    expect(updatedAngularCLIJson.apps[0].name).toEqual('proj');
    expect(updatedAngularCLIJson.apps[0].root).toEqual('apps/proj/src');
    expect(updatedAngularCLIJson.apps[0].outDir).toEqual('dist/apps/proj');
    expect(updatedAngularCLIJson.apps[0].test).toEqual('../../../test.js');
    expect(updatedAngularCLIJson.apps[0].tsconfig).toEqual('tsconfig.app.json');
    expect(updatedAngularCLIJson.apps[0].testTsconfig).toEqual(
      '../../../tsconfig.spec.json'
    );
    expect(updatedAngularCLIJson.apps[0].scripts[0]).toEqual(
      '../../../node_modules/x.js'
    );
    expect(updatedAngularCLIJson.defaults.schematics.collection).toEqual(
      '@buildscale/schematics'
    );

    expect(updatedAngularCLIJson.lint[0].project).toEqual(
      'apps/proj/src/tsconfig.app.json'
    );
    expect(updatedAngularCLIJson.lint[1].project).toEqual(
      './tsconfig.spec.json'
    );
    expect(updatedAngularCLIJson.lint[2].project).toEqual(
      'apps/proj/e2e/tsconfig.e2e.json'
    );

    // check if tsconfig.json get merged
    const updatedTsConfig = readJson('tsconfig.json');
    expect(updatedTsConfig.compilerOptions.paths).toEqual({
      a: ['b'],
      '@proj/*': ['libs/*']
    });

    const karmaConf = readFile('karma.conf.js');
    expect(karmaConf).toContain('makeSureNoAppIsSelected();');

    const protractorConf = readFile('protractor.conf.js');
    expect(protractorConf).toContain(
      'const appDir = getAppDirectoryUsingCliConfig();'
    );
    expect(protractorConf).toContain(`appDir + '/e2e/**/*.e2e-spec.ts'`);
  });

  it('should generate a workspace and not change dependencies or devDependencies if they already exist', () => {
    // create a new AngularCLI app
    runNgNew();
    const buildscaleVersion = '0.0.0';
    const schematicsVersion = '0.0.0';
    const ngrxVersion = '0.0.0';
    // update package.json
    const existingPackageJson = readJson('package.json');
    existingPackageJson.devDependencies[
      '@buildscale/schematics'
    ] = schematicsVersion;
    existingPackageJson.dependencies[
      '@buildscale/buildscale'
    ] = buildscaleVersion;
    existingPackageJson.dependencies['@ngrx/store'] = ngrxVersion;
    existingPackageJson.dependencies['@ngrx/effects'] = ngrxVersion;
    existingPackageJson.dependencies['@ngrx/router-store'] = ngrxVersion;
    existingPackageJson.dependencies['@ngrx/store-devtools'] = ngrxVersion;
    updateFile('package.json', JSON.stringify(existingPackageJson, null, 2));
    // run the command
    runCLI('generate workspace proj --collection=@buildscale/schematics');
    // check that dependencies and devDependencies remained the same
    const packageJson = readJson('package.json');
    expect(packageJson.devDependencies['@buildscale/schematics']).toEqual(
      schematicsVersion
    );
    expect(packageJson.dependencies['@buildscale/buildscale']).toEqual(
      buildscaleVersion
    );
    expect(packageJson.dependencies['@ngrx/store']).toEqual(ngrxVersion);
    expect(packageJson.dependencies['@ngrx/effects']).toEqual(ngrxVersion);
    expect(packageJson.dependencies['@ngrx/router-store']).toEqual(ngrxVersion);
    expect(packageJson.dependencies['@ngrx/store-devtools']).toEqual(
      ngrxVersion
    );
  });
});
