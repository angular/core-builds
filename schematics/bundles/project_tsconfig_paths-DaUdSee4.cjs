'use strict';
/**
 * @license Angular v22.1.4+sha-0a1bbbe
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
'use strict';

var core = require('@angular-devkit/core');

/**
 * Gets all tsconfig paths from a CLI project by reading the workspace configuration
 * and looking for common tsconfig locations.
 *
 * When `angularBuildersOnly` is set, only targets that use an Angular builder are considered.
 * This avoids picking up tsconfig files of non-Angular projects in a mixed workspace (e.g. an Nx
 * monorepo), which should not be touched by Angular migrations.
 */
async function getProjectTsConfigPaths(tree, { angularBuildersOnly = false } = {}) {
    // Start with some tsconfig paths that are generally used within CLI projects. Note
    // that we are not interested in IDE-specific tsconfig files (e.g. /tsconfig.json)
    const buildPaths = new Set();
    const testPaths = new Set();
    const workspace = await getWorkspace(tree);
    for (const [, project] of workspace.projects) {
        for (const [name, target] of project.targets) {
            if (angularBuildersOnly && !isAngularBuilder(target.builder)) {
                continue;
            }
            for (const [, options] of allTargetOptions(target)) {
                const tsConfig = options['tsConfig'];
                // Filter out tsconfig files that don't exist in the CLI project.
                if (typeof tsConfig !== 'string' || !tree.exists(tsConfig)) {
                    continue;
                }
                if (name === 'test' || name.includes('test')) {
                    testPaths.add(core.normalize(tsConfig));
                }
                else {
                    buildPaths.add(core.normalize(tsConfig));
                }
            }
        }
    }
    return {
        buildPaths: [...buildPaths],
        testPaths: [...testPaths],
    };
}
/** Prefixes of Angular builders, including common community builders (e.g. Nx). */
const angularBuilderPrefixes = [
    '@angular-devkit/build-angular:',
    '@angular/build:',
    '@nx/angular:',
    '@angular-builders/',
    'ngx-build-plus:',
];
/** Whether the given builder is a recognized Angular builder. */
function isAngularBuilder(builder) {
    return (builder !== undefined && angularBuilderPrefixes.some((prefix) => builder.startsWith(prefix)));
}
/** Get options for all configurations for the passed builder target. */
function* allTargetOptions(target) {
    if (target.options) {
        yield [undefined, target.options];
    }
    if (!target.configurations) {
        return;
    }
    for (const [name, options] of Object.entries(target.configurations)) {
        if (options) {
            yield [name, options];
        }
    }
}
function createHost(tree) {
    return {
        async readFile(path) {
            const data = tree.read(path);
            if (!data) {
                throw new Error('File not found.');
            }
            return core.virtualFs.fileBufferToString(data);
        },
        async writeFile(path, data) {
            return tree.overwrite(path, data);
        },
        async isDirectory(path) {
            // Approximate a directory check.
            // We don't need to consider empty directories and hence this is a good enough approach.
            // This is also per documentation, see:
            // https://angular.dev/tools/cli/schematics-for-libraries#get-the-project-configuration
            return !tree.exists(path) && tree.getDir(path).subfiles.length > 0;
        },
        async isFile(path) {
            return tree.exists(path);
        },
    };
}
async function getWorkspace(tree) {
    const host = createHost(tree);
    const { workspace } = await core.workspaces.readWorkspace('/', host);
    return workspace;
}

exports.getProjectTsConfigPaths = getProjectTsConfigPaths;
