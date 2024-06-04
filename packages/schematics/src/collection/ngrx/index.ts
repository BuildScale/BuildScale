import {
  apply,
  branchAndMerge,
  chain,
  externalSchematic,
  mergeWith,
  move,
  Rule,
  template,
  url
} from '@angular-devkit/schematics';
import { Tree } from '@angular-devkit/schematics';

import { Schema } from './schema';
import * as path from 'path';

import { names, toFileName } from '../../utils/name-utils';
import { wrapIntoFormat } from '../../utils/tasks';

import {
  RequestContext,
  updateNgrxReducers,
  updateNgrxActions,
  updateNgrxEffects,
  addImportsToModule,
  addNgRxToPackageJson
} from './rules';
import { deleteFile } from '../../utils/rules/deleteFile';

/**
 * Rule to generate the BuildScale 'ngrx' Collection
 */
export default function generateNgrxCollection(_options: Schema): Rule {
  return wrapIntoFormat((host: Tree) => {
    const options = normalizeOptions(_options);
    const context: RequestContext = {
      featureName: options.name,
      moduleDir: path.dirname(options.module),
      options,
      host
    };

    const fileGeneration = options.onlyEmptyRoot
      ? []
      : [
          branchAndMerge(generateNgrxFiles(context)),
          branchAndMerge(generateBuildScaleFiles(context)),
          updateNgrxActions(context),
          updateNgrxReducers(context),
          updateNgrxEffects(context)
        ];

    const moduleModification = options.onlyAddFiles
      ? []
      : [addImportsToModule(context)];
    const packageJsonModification = options.skipPackageJson
      ? []
      : [addNgRxToPackageJson()];

    return chain([
      ...fileGeneration,
      ...moduleModification,
      ...packageJsonModification
    ]);
  });
}

// ********************************************************
// Internal Function
// ********************************************************

/**
 * Generate the BuildScale files that are NOT created by the @ngrx/schematic(s)
 */
function generateBuildScaleFiles(context: RequestContext) {
  const templateSource = apply(url('./files'), [
    template({ ...context.options, tmpl: '', ...names(context.featureName) }),
    move(context.moduleDir)
  ]);
  return chain([mergeWith(templateSource)]);
}

/**
 * Using @ngrx/schematics, generate scaffolding for 'feature': action, reducer, effect files
 */
function generateNgrxFiles(context: RequestContext) {
  const filePrefix = `app/${context.featureName}/${context.featureName}`;

  return chain([
    externalSchematic('@ngrx/schematics', 'feature', {
      name: context.featureName,
      sourceDir: './',
      flat: false
    }),
    deleteFile(`/${filePrefix}.effects.spec.ts`),
    deleteFile(`/${filePrefix}.reducer.spec.ts`),
    moveToBuildScaleMonoTree(
      context.featureName,
      context.moduleDir,
      context.options.directory
    )
  ]);
}

/**
 * @ngrx/schematics generates files in:
 *    `/apps/<ngrxFeatureName>/`
 *
 * For BuildScale monorepo, however, we need to move the files to either
 *  a) apps/<appName>/src/app/<directory>, or
 *  b) libs/<libName>/src/<directory>
 */
function moveToBuildScaleMonoTree(
  ngrxFeatureName: string,
  buildscaleDir: string,
  directory: string
): Rule {
  return move(`app/${ngrxFeatureName}`, path.join(buildscaleDir, directory));
}

/**
 * Extract the parent 'directory' for the specified
 */
function normalizeOptions(options: Schema): Schema {
  return { ...options, directory: toFileName(options.directory) };
}
