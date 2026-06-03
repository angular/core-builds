'use strict';
/**
 * @license Angular v22.1.0-next.0+sha-e843003
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
'use strict';

require('@angular-devkit/core');
require('node:path/posix');
var project_paths = require('./project_paths-D2V-Uh2L.cjs');
var migrations = require('@angular/compiler-cli/private/migrations');
var ts = require('typescript');
require('@angular/compiler-cli');
require('node:path');
var apply_import_manager = require('./apply_import_manager-CxA_YYgB.cjs');
require('@angular-devkit/schematics');
require('./project_tsconfig_paths-DkkMibv-.cjs');

class IncrementalHydrationMigration extends project_paths.TsurgeFunnelMigration {
    async analyze(info) {
        const { sourceFiles, program } = info;
        program.getTypeChecker();
        const replacements = [];
        const importManager = new migrations.ImportManager();
        const printer = ts.createPrinter();
        for (const sf of sourceFiles) {
            ts.forEachChild(sf, function visit(node) {
                if (ts.isCallExpression(node) &&
                    ts.isIdentifier(node.expression) &&
                    node.expression.text === 'provideClientHydration') {
                    let hasIncremental = false;
                    let hasNoIncremental = false;
                    for (const arg of node.arguments) {
                        if (ts.isCallExpression(arg) && ts.isIdentifier(arg.expression)) {
                            if (arg.expression.text === 'withIncrementalHydration') {
                                hasIncremental = true;
                            }
                            else if (arg.expression.text === 'withNoIncrementalHydration') {
                                hasNoIncremental = true;
                            }
                        }
                    }
                    if (!hasIncremental && !hasNoIncremental) {
                        // Add withNoIncrementalHydration()
                        const withNoIncrementalExpr = importManager.addImport({
                            exportModuleSpecifier: '@angular/platform-browser',
                            exportSymbolName: 'withNoIncrementalHydration',
                            requestedFile: sf,
                        });
                        const exprText = printer.printNode(ts.EmitHint.Unspecified, withNoIncrementalExpr, sf);
                        const insertPos = node.arguments.end;
                        const toInsert = node.arguments.length > 0 ? `, ${exprText}()` : `${exprText}()`;
                        replacements.push(new project_paths.Replacement(project_paths.projectFile(sf, info), new project_paths.TextUpdate({
                            position: insertPos,
                            end: insertPos,
                            toInsert: toInsert,
                        })));
                    }
                }
                ts.forEachChild(node, visit);
            });
        }
        apply_import_manager.applyImportManagerChanges(importManager, replacements, sourceFiles, info);
        return project_paths.confirmAsSerializable({
            replacements,
        });
    }
    async combine(unitA, unitB) {
        return project_paths.confirmAsSerializable({
            replacements: [...unitA.replacements, ...unitB.replacements],
        });
    }
    async globalMeta(combinedData) {
        return project_paths.confirmAsSerializable(combinedData);
    }
    async stats(globalMetadata) {
        return project_paths.confirmAsSerializable({});
    }
    async migrate(globalData) {
        return { replacements: globalData.replacements };
    }
}

function migrate() {
    return async (tree, context) => {
        await project_paths.runMigrationInDevkit({
            tree,
            getMigration: (fs) => new IncrementalHydrationMigration(),
        });
    };
}

exports.migrate = migrate;
