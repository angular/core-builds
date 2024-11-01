'use strict';
/**
 * @license Angular v19.1.0-next.0+sha-3e2bc69
 * (c) 2010-2024 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var core = require('@angular-devkit/core');

/**
 * Gets all tsconfig paths from a CLI project by reading the workspace configuration
 * and looking for common tsconfig locations.
 */
async function getProjectTsConfigPaths(tree) {
    // Start with some tsconfig paths that are generally used within CLI projects. Note
    // that we are not interested in IDE-specific tsconfig files (e.g. /tsconfig.json)
    const buildPaths = new Set();
    const testPaths = new Set();
    const workspace = await getWorkspace(tree);
    for (const [, project] of workspace.projects) {
        for (const [name, target] of project.targets) {
            if (name !== 'build' && name !== 'test') {
                continue;
            }
            for (const [, options] of allTargetOptions(target)) {
                const tsConfig = options['tsConfig'];
                // Filter out tsconfig files that don't exist in the CLI project.
                if (typeof tsConfig !== 'string' || !tree.exists(tsConfig)) {
                    continue;
                }
                if (name === 'build') {
                    buildPaths.add(core.normalize(tsConfig));
                }
                else {
                    testPaths.add(core.normalize(tsConfig));
                }
            }
        }
    }
    return {
        buildPaths: [...buildPaths],
        testPaths: [...testPaths],
    };
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
