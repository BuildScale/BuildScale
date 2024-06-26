import { ProjectNode } from './affected-apps';
import * as path from 'path';

export interface ErrorGroup {
  header: string;
  errors: string[];
}

export class WorkspaceIntegrityChecks {
  constructor(
    private projectNodes: ProjectNode[],
    private files: string[],
    private packageJson: any
  ) {}

  run(): ErrorGroup[] {
    return [
      ...this.packageJsonConsistencyCheck(),
      ...this.projectWithoutFilesCheck(),
      ...this.filesWithoutProjects()
    ];
  }

  private packageJsonConsistencyCheck(): ErrorGroup[] {
    const buildscale = this.packageJson.dependencies['@buildscale/buildscale'];
    const schematics = this.packageJson.devDependencies[
      '@buildscale/schematics'
    ];
    if (buildscale !== schematics) {
      return [
        {
          header: 'The package.json is inconsistent',
          errors: [
            'The versions of the @buildscale/buildscale and @buildscale/schematics packages must be the same.'
          ]
        }
      ];
    } else {
      return [];
    }
  }

  private projectWithoutFilesCheck(): ErrorGroup[] {
    const errors = this.projectNodes
      .filter(n => n.files.length === 0)
      .map(p => `Cannot find project '${p.name}' in '${path.dirname(p.root)}'`);

    return errors.length === 0
      ? []
      : [{ header: 'The .angular-cli.json file is out of sync', errors }];
  }

  private filesWithoutProjects(): ErrorGroup[] {
    const allFilesFromProjects = this.allProjectFiles();
    const allFilesWithoutProjects = minus(this.files, allFilesFromProjects);
    const first5FilesWithoutProjects =
      allFilesWithoutProjects.length > 5
        ? allFilesWithoutProjects.slice(0, 5)
        : allFilesWithoutProjects;

    const errors = first5FilesWithoutProjects.map(
      p => `The '${p}' file doesn't belong to any project.`
    );

    return errors.length === 0
      ? []
      : [
          {
            header: `All files in 'apps' and 'libs' must be part of a project.`,
            errors
          }
        ];
  }

  private allProjectFiles() {
    return this.projectNodes.reduce((m, c) => [...m, ...c.files], []);
  }
}

function minus(a: string[], b: string[]): string[] {
  return a.filter(aa => b.indexOf(aa) === -1);
}
