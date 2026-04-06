'use strict';
/**
 * @license Angular v22.0.0-next.6+sha-33b001d
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
'use strict';

var project_tsconfig_paths = require('./project_tsconfig_paths-DkkMibv-.cjs');
require('@angular-devkit/core');

/**
 * Migration that adds `strictTemplates: false` to `tsconfig.json` files.
 */
function migrate() {
    return async (tree) => {
        const { buildPaths, testPaths } = await project_tsconfig_paths.getProjectTsConfigPaths(tree);
        const allPaths = [...new Set([...buildPaths, ...testPaths])];
        for (const path of allPaths) {
            const content = tree.read(path);
            if (!content)
                continue;
            const contentStr = content.toString('utf-8');
            // Check if it's already there to avoid parsing if not needed.
            if (contentStr.includes('strictTemplates')) {
                continue;
            }
            try {
                // Use a simple JSON.parse for now. In a real world scenario we might want to use
                // a parser that supports comments (JSONC), but for this migration it's likely
                // that tsconfig files are standard enough or that overwriting them is acceptable
                // in the context of an ng update.
                const json = JSON.parse(contentStr);
                if (!json.compilerOptions || Object.keys(json.compilerOptions).length === 0) {
                    continue;
                }
                if (!json.angularCompilerOptions) {
                    json.angularCompilerOptions = { strictTemplates: false };
                    tree.overwrite(path, JSON.stringify(json, null, 2));
                    continue;
                }
                if (json.angularCompilerOptions.strictTemplates === undefined) {
                    json.angularCompilerOptions.strictTemplates = false;
                    tree.overwrite(path, JSON.stringify(json, null, 2));
                }
            }
            catch (e) {
                // If parsing fails, skip the file to avoid corrupting it.
                continue;
            }
        }
    };
}

exports.migrate = migrate;
