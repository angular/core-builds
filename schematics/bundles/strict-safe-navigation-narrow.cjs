'use strict';
/**
 * @license Angular v22.0.0-rc.3+sha-e10647b
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
'use strict';

var project_tsconfig_paths = require('./project_tsconfig_paths-DkkMibv-.cjs');
var jsonFile = require('./json-file-Drblb4E1.cjs');
require('@angular-devkit/core');
require('node:os');

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
            json.modify(['angularCompilerOptions', 'extendedDiagnostics', 'checks', 'nullishCoalescingNotNullable'], 'suppress');
            json.modify(['angularCompilerOptions', 'extendedDiagnostics', 'checks', 'optionalChainNotNullable'], 'suppress');
        }
    };
}

exports.migrate = migrate;
