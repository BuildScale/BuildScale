import { checkFilesExist, createBuildScaleWorkspace, readJson } from '../utils';

/**
 * Too slow to run on CI :(
 */
xdescribe('CreateBuildScaleWorkspace', () => {
  it(
    'should create a new workspace using npm',
    () => {
      const res = createBuildScaleWorkspace('proj --npmScope=myscope');
      expect(res).toContain("Project 'proj' successfully created.");

      const config = readJson('.angular-cli.json');
      expect(config.project.name).toEqual('proj');
      expect(config.project.npmScope).toEqual('myscope');

      checkFilesExist('package-lock.json');
    },
    1000000
  );

  it(
    'should create a new workspace using yarn',
    () => {
      const res = createBuildScaleWorkspace('proj --npmScope=myscope --yarn');
      expect(res).toContain("Project 'proj' successfully created.");

      const config = readJson('.angular-cli.json');
      expect(config.project.name).toEqual('proj');
      expect(config.project.npmScope).toEqual('myscope');

      checkFilesExist('yarn.lock');
    },
    1000000
  );

  it(
    'should create a new workspace with the --directory option',
    () => {
      const res = createBuildScaleWorkspace(
        'myproj --npmScope=myscope --directory=proj'
      );
      expect(res).toContain("Project 'myproj' successfully created.");
      checkFilesExist('package-lock.json');
    },
    1000000
  );

  it(
    'should create a new workspace with the --bazel option',
    () => {
      const res = createBuildScaleWorkspace('mybazelproj --bazel');
      expect(res).toContain("Project 'mybazelproj' successfully created.");
    },
    1000000
  );

  it(
    'should error when no name is given',
    () => {
      expect(() => createBuildScaleWorkspace('')).toThrowError(
        'Please provide a project name'
      );
    },
    1000000
  );
});
