import {
  affectedApps,
  dependencies,
  DependencyType,
  ProjectType,
  touchedProjects
} from './affected-apps';

describe('Calculates Dependencies Between Apps and Libs', () => {
  describe('dependencies', () => {
    it('should return a graph with a key for every project', () => {
      const deps = dependencies(
        'buildscale',
        [
          {
            name: 'app1',
            root: '',
            files: [],
            tags: [],
            type: ProjectType.app
          },
          {
            name: 'app2',
            root: '',
            files: [],
            tags: [],
            type: ProjectType.app
          }
        ],
        () => null
      );

      expect(deps).toEqual({ app1: [], app2: [] });
    });

    it('should infer deps between projects based on imports', () => {
      const deps = dependencies(
        'buildscale',
        [
          {
            name: 'app1',
            root: '',
            files: ['app1.ts'],
            tags: [],
            type: ProjectType.app
          },
          {
            name: 'lib1',
            root: '',
            files: ['lib1.ts'],
            tags: [],
            type: ProjectType.lib
          },
          {
            name: 'lib2',
            root: '',
            files: ['lib2.ts'],
            tags: [],
            type: ProjectType.lib
          }
        ],
        file => {
          switch (file) {
            case 'app1.ts':
              return `
            import '@buildscale/lib1';
            import '@buildscale/lib2/deep';
          `;
            case 'lib1.ts':
              return `import '@buildscale/lib2'`;
            case 'lib2.ts':
              return '';
          }
        }
      );

      expect(deps).toEqual({
        app1: [
          { projectName: 'lib1', type: DependencyType.es6Import },
          { projectName: 'lib2', type: DependencyType.es6Import }
        ],
        lib1: [{ projectName: 'lib2', type: DependencyType.es6Import }],
        lib2: []
      });
    });

    it('should infer dependencies expressed via loadChildren', () => {
      const deps = dependencies(
        'buildscale',
        [
          {
            name: 'app1',
            root: '',
            files: ['app1.ts'],
            tags: [],
            type: ProjectType.app
          },
          {
            name: 'lib1',
            root: '',
            files: ['lib1.ts'],
            tags: [],
            type: ProjectType.lib
          },
          {
            name: 'lib2',
            root: '',
            files: ['lib2.ts'],
            tags: [],
            type: ProjectType.lib
          }
        ],
        file => {
          switch (file) {
            case 'app1.ts':
              return `
            const routes = {
              path: 'a', loadChildren: '@buildscale/lib1#LibModule',
              path: 'b', loadChildren: '@buildscale/lib2/deep#LibModule'
            };
          `;
            case 'lib1.ts':
              return '';
            case 'lib2.ts':
              return '';
          }
        }
      );

      expect(deps).toEqual({
        app1: [
          { projectName: 'lib1', type: DependencyType.loadChildren },
          { projectName: 'lib2', type: DependencyType.loadChildren }
        ],
        lib1: [],
        lib2: []
      });
    });

    it('should handle non-ts files', () => {
      const deps = dependencies(
        'buildscale',
        [
          {
            name: 'app1',
            root: '',
            files: ['index.html'],
            tags: [],
            type: ProjectType.app
          }
        ],
        () => null
      );

      expect(deps).toEqual({ app1: [] });
    });

    it('should handle projects with the names starting with the same string', () => {
      const deps = dependencies(
        'buildscale',
        [
          {
            name: 'aa',
            root: '',
            files: ['aa.ts'],
            tags: [],
            type: ProjectType.app
          },
          {
            name: 'aa/bb',
            root: '',
            files: ['bb.ts'],
            tags: [],
            type: ProjectType.app
          }
        ],
        file => {
          switch (file) {
            case 'aa.ts':
              return `import '@buildscale/aa/bb'`;
            case 'bb.ts':
              return '';
          }
        }
      );

      expect(deps).toEqual({
        aa: [{ projectName: 'aa/bb', type: DependencyType.es6Import }],
        'aa/bb': []
      });
    });

    it('should not add the same dependency twice', () => {
      const deps = dependencies(
        'buildscale',
        [
          {
            name: 'aa',
            root: '',
            files: ['aa.ts'],
            tags: [],
            type: ProjectType.app
          },
          {
            name: 'bb',
            root: '',
            files: ['bb.ts'],
            tags: [],
            type: ProjectType.app
          }
        ],
        file => {
          switch (file) {
            case 'aa.ts':
              return `
              import '@buildscale/bb/bb'
              import '@buildscale/bb/bb'
              `;
            case 'bb.ts':
              return '';
          }
        }
      );

      expect(deps).toEqual({
        aa: [{ projectName: 'bb', type: DependencyType.es6Import }],
        bb: []
      });
    });

    it('should not add a dependency on self', () => {
      const deps = dependencies(
        'buildscale',
        [
          {
            name: 'aa',
            root: '',
            files: ['aa.ts'],
            tags: [],
            type: ProjectType.app
          }
        ],
        file => {
          switch (file) {
            case 'aa.ts':
              return `
              import '@buildscale/aa/aa'
              `;
          }
        }
      );

      expect(deps).toEqual({ aa: [] });
    });
  });

  describe('affectedApps', () => {
    it('should return the list of affected files', () => {
      const affected = affectedApps(
        'buildscale',
        [
          {
            name: 'app1',
            root: '',
            files: ['app1.ts'],
            tags: [],
            type: ProjectType.app
          },
          {
            name: 'app2',
            root: '',
            files: ['app2.ts'],
            tags: [],
            type: ProjectType.app
          },
          {
            name: 'lib1',
            root: '',
            files: ['lib1.ts'],
            tags: [],
            type: ProjectType.lib
          },
          {
            name: 'lib2',
            root: '',
            files: ['lib2.ts'],
            tags: [],
            type: ProjectType.lib
          }
        ],
        file => {
          switch (file) {
            case 'app1.ts':
              return `
            import '@buildscale/lib1';
          `;
            case 'app2.ts':
              return ``;
            case 'lib1.ts':
              return `import '@buildscale/lib2'`;
            case 'lib2.ts':
              return '';
          }
        },
        ['lib2.ts']
      );

      expect(affected).toEqual(['app1']);
    });

    it('should return app app names if a touched file is not part of a project', () => {
      const affected = affectedApps(
        'buildscale',
        [
          {
            name: 'app1',
            root: '',
            files: ['app1.ts'],
            tags: [],
            type: ProjectType.app
          },
          {
            name: 'app2',
            root: '',
            files: ['app2.ts'],
            tags: [],
            type: ProjectType.app
          },
          {
            name: 'lib1',
            root: '',
            files: ['lib1.ts'],
            tags: [],
            type: ProjectType.lib
          }
        ],
        file => {
          switch (file) {
            case 'app1.ts':
              return `
            import '@buildscale/lib1';
          `;
            case 'app2.ts':
              return ``;
            case 'lib1.ts':
              return `import '@buildscale/lib2'`;
          }
        },
        ['package.json']
      );

      expect(affected).toEqual(['app2', 'app1']);
    });

    it('should handle slashes', () => {
      const affected = affectedApps(
        'buildscale',
        [
          {
            name: 'app1',
            root: '',
            files: ['one\\app1.ts', 'two/app1.ts'],
            tags: [],
            type: ProjectType.app
          }
        ],
        file => {
          switch (file) {
            case 'one/app1.ts':
              return '';
            case 'two/app1.ts':
              return '';
          }
        },
        ['one/app1.ts', 'two/app1.ts']
      );

      expect(affected).toEqual(['app1']);
    });

    it('should handle circular dependencies', () => {
      const affected = affectedApps(
        'buildscale',
        [
          {
            name: 'app1',
            root: '',
            files: ['app1.ts'],
            tags: [],
            type: ProjectType.app
          },
          {
            name: 'app2',
            root: '',
            files: ['app2.ts'],
            tags: [],
            type: ProjectType.app
          }
        ],
        file => {
          switch (file) {
            case 'app1.ts':
              return `import '@buildscale/app2';`;
            case 'app2.ts':
              return `import '@buildscale/app1';`;
          }
        },
        ['app1.ts']
      );

      expect(affected).toEqual(['app2', 'app1']);
    });
  });

  describe('touchedProjects', () => {
    it('should return the list of touchedProjects', () => {
      const tp = touchedProjects(
        [
          {
            name: 'app1',
            root: '',
            files: ['app1.ts'],
            tags: [],
            type: ProjectType.app
          },
          {
            name: 'app2',
            root: '',
            files: ['app2.ts'],
            tags: [],
            type: ProjectType.app
          },
          {
            name: 'lib1',
            root: '',
            files: ['lib1.ts'],
            tags: [],
            type: ProjectType.lib
          },
          {
            name: 'lib2',
            root: '',
            files: ['lib2.ts'],
            tags: [],
            type: ProjectType.lib
          }
        ],
        ['lib2.ts', 'app2.ts', 'package.json']
      );

      expect(tp).toEqual(['lib2', 'app2', null]);
    });
  });
});
