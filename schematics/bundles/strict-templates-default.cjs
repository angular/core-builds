'use strict';
/**
 * @license Angular v22.1.0-next.0+sha-2d2d5fc
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
'use strict';

var project_tsconfig_paths = require('./project_tsconfig_paths-BejwmdOG.cjs');
var jsonFile = require('./json-file-Drblb4E1.cjs');
var ts = require('typescript');
var path = require('node:path');
require('@angular-devkit/core');
require('node:os');

function getResolvedAngularCompilerOptions(tree, tsconfigPath) {
    if (!tree.exists(tsconfigPath))
        return {};
    const sourceFile = ts.readJsonConfigFile(tsconfigPath, (path) => tree.readText(path));
    const config = ts.convertToObject(sourceFile, []);
    let angularOptions = config.angularCompilerOptions || {};
    // Manually resolve inheritance for Angular-specific options.
    // Since the TypeScript API doesn't perform a deep merge of custom/non-standard keys
    // during config parsing, we must traverse the inheritance chain manually
    if (config.extends) {
        // Management extends property...
        const parentPath = path.join(path.dirname(tsconfigPath), config.extends);
        const parentOptions = getResolvedAngularCompilerOptions(tree, parentPath);
        // Merge: the options of the current file overwrite those of the parent
        angularOptions = {
            ...parentOptions,
            ...angularOptions,
        };
    }
    return angularOptions;
}
/**
 * Migration that adds `strictTemplates: false` to `tsconfig.json` files.
 */
function migrate() {
    return async (tree) => {
        const { buildPaths, testPaths } = await project_tsconfig_paths.getProjectTsConfigPaths(tree);
        const allPaths = [...new Set([...buildPaths, ...testPaths])];
        for (const tsconfigPath of allPaths) {
            const json = new jsonFile.jsonFileExports.JSONFile(tree, tsconfigPath);
            const compilerOptions = json.get(['compilerOptions']);
            if (!compilerOptions ||
                typeof compilerOptions !== 'object' ||
                Object.keys(compilerOptions).length === 0) {
                continue;
            }
            const angularOptions = getResolvedAngularCompilerOptions(tree, tsconfigPath);
            if (angularOptions['strictTemplates'] !== undefined) {
                continue;
            }
            if (json.get(['angularCompilerOptions', 'strictTemplates']) === undefined) {
                json.modify(['angularCompilerOptions', 'strictTemplates'], false);
            }
        }
    };
}

exports.migrate = migrate;
