import {
  newApp,
  newLib,
  newProject,
  runCLI,
  runCommand,
  updateFile,
  readJson
} from '../utils';

describe('Command line', () => {
  it(
    'lint should ensure module boundaries',
    () => {
      newProject();
      newApp('myapp --tags=validtag');
      newApp('myapp2');
      newLib('mylib');
      newLib('lazylib');
      newLib('invalidtaglib --tags=invalidtag');
      newLib('validtaglib --tags=validtag');

      const tslint = readJson('tslint.json');
      tslint.rules['buildscale-enforce-module-boundaries'][1].depConstraints = [
        { sourceTag: 'validtag', onlyDependOnLibsWithTags: ['validtag'] },
        ...tslint.rules['buildscale-enforce-module-boundaries'][1]
          .depConstraints
      ];
      updateFile('tslint.json', JSON.stringify(tslint, null, 2));

      updateFile(
        'apps/myapp/src/main.ts',
        `
      import '../../../libs/mylib';
      import '@proj/lazylib';
      import '@proj/mylib/deep';
      import '@proj/myapp2';
      import '@proj/invalidtaglib';
      import '@proj/validtaglib';

      const s = {loadChildren: '@proj/lazylib'};
    `
      );

      const out = runCLI('lint --type-check', { silenceError: true });
      expect(out).toContain('library imports must start with @proj/');
      expect(out).toContain('imports of lazy-loaded libraries are forbidden');
      expect(out).toContain('deep imports into libraries are forbidden');
      expect(out).toContain('imports of apps are forbidden');
      expect(out).toContain(
        'A project tagged with "validtag" can only depend on libs tagged with "validtag"'
      );
    },
    1000000
  );

  it('should run buildscale lint', () => {
    newProject();
    newApp('myapp');
    newApp('app_before');
    runCommand('mv apps/app-before apps/app-after');

    try {
      runCommand('npm run lint');
      fail('Boom!');
    } catch (e) {
      const errorOutput = e.stderr.toString();
      expect(errorOutput).toContain(
        `Cannot find project 'app-before' in 'apps/app-before'`
      );
      expect(errorOutput).toContain(
        `The 'apps/app-after/e2e/app.e2e-spec.ts' file doesn't belong to any project.`
      );
    }
  });

  it(
    'update should run migrations',
    () => {
      newProject();
      updateFile(
        'node_modules/@buildscale/schematics/migrations/20200101-test-migration.js',
        `
        exports.default = {
          description: 'Test migration',
          run: function() {
            console.log('Running test migration');
          }
        };
      `
      );
      const checkOut = runCommand('npm run update:check');
      expect(checkOut).toContain(
        'Run "npm run update" to run the following migrations'
      );
      expect(checkOut).toContain('20200101-test-migration');

      const migrateOut = runCommand('npm run update');
      expect(migrateOut).toContain('Test migration');
      expect(migrateOut).toContain('Running test migration');
      expect(migrateOut).toContain(
        `The latestMigration property in .angular-cli.json has been set to "20200101-test-migration".`
      );

      updateFile(
        'node_modules/@buildscale/schematics/migrations/20200102-test-migration.js',
        `
        exports.default = {
          description: 'Test migration2',
          run: function() {
            console.log('Running test migration');
          }
        };
      `
      );

      const checkOut2 = runCommand('npm run update:check');
      expect(checkOut2).toContain(
        'Run "npm run update" to run the following migrations'
      );
      expect(checkOut2).toContain('20200102-test-migration');

      const skipOut = runCommand('npm run update:skip');
      expect(skipOut).toContain(
        `The latestMigration property in .angular-cli.json has been set to "20200102-test-migration".`
      );

      expect(runCommand('npm run update:check')).not.toContain('IMPORTANT');
      expect(runCommand('npm run update')).toContain('No migrations to run');
    },
    1000000
  );

  it(
    'affected should print, build, and test affected apps',
    () => {
      newProject();
      newApp('myapp');
      newApp('myapp2');
      newLib('mylib');

      updateFile(
        'apps/myapp/src/app/app.component.spec.ts',
        `import '@proj/mylib';`
      );

      const affectedApps = runCommand(
        'npm run affected:apps -- --files="libs/mylib/index.ts"'
      );
      expect(affectedApps).toContain('myapp');
      expect(affectedApps).not.toContain('myapp2');

      const build = runCommand(
        'npm run affected:build -- --files="libs/mylib/index.ts"'
      );
      expect(build).toContain('Building myapp');

      const e2e = runCommand(
        'npm run affected:e2e -- --files="libs/mylib/index.ts"'
      );
      expect(e2e).toContain('should display welcome message');
    },
    1000000
  );

  it(
    'format should check and reformat the code',
    () => {
      newProject();
      newApp('myapp');
      newLib('mylib');
      updateFile(
        'apps/myapp/src/main.ts',
        `
         const x = 1111;
    `
      );

      updateFile(
        'apps/myapp/src/app/app.module.ts',
        `
         const y = 1111;
    `
      );

      updateFile(
        'apps/myapp/src/app/app.component.ts',
        `
         const z = 1111;
    `
      );

      updateFile(
        'libs/mylib/index.ts',
        `
         const x = 1111;
    `
      );
      updateFile(
        'libs/mylib/src/mylib.module.ts',
        `
         const y = 1111;
    `
      );

      try {
        // this will group it by lib, so all three files will be "marked"
        runCommand(
          'npm run -s format:check -- --files="libs/mylib/index.ts" --libs-and-apps'
        );
        fail('boom');
      } catch (e) {
        expect(e.stdout.toString()).toContain('libs/mylib/index.ts');
        expect(e.stdout.toString()).toContain('libs/mylib/src/mylib.module.ts');
      }

      try {
        // this is a global run
        runCommand('npm run -s format:check');
        fail('boom');
      } catch (e) {
        expect(e.stdout.toString()).toContain('apps/myapp/src/main.ts');
        expect(e.stdout.toString()).toContain(
          'apps/myapp/src/app/app.module.ts'
        );
        expect(e.stdout.toString()).toContain(
          'apps/myapp/src/app/app.component.ts'
        );
      }
      runCommand(
        'npm run format:write -- --files="apps/myapp/src/app/app.module.ts,apps/myapp/src/app/app.component.ts"'
      );

      try {
        runCommand('npm run -s format:check');
        fail('boom');
      } catch (e) {
        expect(e.stdout.toString()).toContain('apps/myapp/src/main.ts');
        expect(e.stdout.toString()).not.toContain(
          'apps/myapp/src/app/app.module.ts'
        );
        expect(e.stdout.toString()).not.toContain(
          'apps/myapp/src/app/app.component.ts'
        );
      }

      runCommand('npm run format:write');
      expect(runCommand('npm run -s format:check')).toEqual('');
    },
    1000000
  );
});
