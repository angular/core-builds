'use strict';
/**
 * @license Angular v22.1.0-next.5+sha-d43acaf
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
'use strict';

require('@angular-devkit/core');
require('node:path/posix');
var project_paths = require('./project_paths-LBcwW5BF.cjs');
var ts = require('typescript');
require('@angular/compiler-cli');
require('@angular/compiler-cli/private/migrations');
require('node:path');
require('@angular-devkit/schematics');
require('./project_tsconfig_paths-BejwmdOG.cjs');

class CanMatchSnapshotRequiredMigration extends project_paths.TsurgeFunnelMigration {
    async analyze(info) {
        const replacements = [];
        const { sourceFiles, program } = info;
        const typeChecker = program.getTypeChecker();
        for (const sourceFile of sourceFiles) {
            const walk = (node) => {
                ts.forEachChild(node, walk);
                if (ts.isCallExpression(node)) {
                    let shouldMigrate = false;
                    // 1. Method calls objective: obj.canMatch(a, b)
                    if (ts.isPropertyAccessExpression(node.expression) &&
                        node.expression.name.text === 'canMatch') {
                        const type = typeChecker.getTypeAtLocation(node.expression.expression);
                        const classSymbol = type.getSymbol();
                        if (classSymbol && classSymbol.declarations) {
                            const decl = classSymbol.declarations[0];
                            if (ts.isClassDeclaration(decl)) {
                                if (implementsInterface(decl, 'CanMatch')) {
                                    shouldMigrate = true;
                                }
                            }
                        }
                    }
                    // 2. Function calls objective: canMatch(a, b)
                    if (ts.isIdentifier(node.expression) && node.expression.text === 'canMatch') {
                        const type = typeChecker.getTypeAtLocation(node.expression);
                        const typeStr = typeChecker.typeToString(type);
                        if (typeStr.includes('CanMatchFn')) {
                            shouldMigrate = true;
                        }
                    }
                    if (shouldMigrate && node.arguments.length === 2) {
                        const lastArg = node.arguments[1];
                        replacements.push(new project_paths.Replacement(project_paths.projectFile(sourceFile, info), new project_paths.TextUpdate({
                            position: lastArg.getEnd(),
                            end: lastArg.getEnd(),
                            toInsert: ', {} as any /* added by migration */',
                        })));
                    }
                }
            };
            ts.forEachChild(sourceFile, walk);
        }
        return project_paths.confirmAsSerializable({ replacements });
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
function implementsInterface(decl, interfaceName) {
    if (!decl.heritageClauses)
        return false;
    for (const clause of decl.heritageClauses) {
        if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
            for (const expr of clause.types) {
                if (ts.isIdentifier(expr.expression) && expr.expression.text === interfaceName) {
                    return true;
                }
            }
        }
    }
    return false;
}

function migrate(options) {
    return async (tree, context) => {
        await project_paths.runMigrationInDevkit({
            tree,
            getMigration: (fs) => new CanMatchSnapshotRequiredMigration(),
        });
    };
}

exports.migrate = migrate;
