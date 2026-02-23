'use strict';
/**
 * @license Angular v22.0.0-next.0+sha-9a3f5cb
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
'use strict';

require('@angular-devkit/core');
require('node:path/posix');
var project_paths = require('./project_paths-D2V-Uh2L.cjs');
var migrations = require('@angular/compiler-cli/private/migrations');
var ts = require('typescript');
var ng_decorators = require('./ng_decorators-DYy6II6x.cjs');
require('@angular/compiler-cli');
require('node:path');
var apply_import_manager = require('./apply_import_manager-CxA_YYgB.cjs');
require('@angular-devkit/schematics');
require('./project_tsconfig_paths-DkkMibv-.cjs');
require('./imports-CVmcbVA9.cjs');

class ChangeDetectionEagerMigration extends project_paths.TsurgeFunnelMigration {
    config;
    constructor(config = {}) {
        super();
        this.config = config;
    }
    async analyze(info) {
        const { sourceFiles, program } = info;
        const typeChecker = program.getTypeChecker();
        const replacements = [];
        const importManager = new migrations.ImportManager();
        const printer = ts.createPrinter();
        for (const sf of sourceFiles) {
            const file = project_paths.projectFile(sf, info);
            if (this.config.shouldMigrate && !this.config.shouldMigrate(file)) {
                continue;
            }
            ts.forEachChild(sf, (node) => {
                if (!ts.isClassDeclaration(node)) {
                    return;
                }
                const decorators = ng_decorators.getAngularDecorators(typeChecker, ts.getDecorators(node) || []);
                const componentDecorator = decorators.find((d) => d.name === 'Component' && d.moduleName === '@angular/core');
                if (!componentDecorator) {
                    return;
                }
                // The helper `getAngularDecorators` guarantees that `node` is `CallExpressionDecorator`.
                // So `componentDecorator.node.expression` is `ts.CallExpression`.
                const callExpression = componentDecorator.node.expression;
                if (callExpression.arguments.length !== 1 ||
                    !ts.isObjectLiteralExpression(callExpression.arguments[0])) {
                    return;
                }
                const metadata = callExpression.arguments[0];
                const changeDetectionProp = metadata.properties.find((p) => ts.isPropertyAssignment(p) &&
                    (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) &&
                    p.name.text === 'changeDetection');
                if (!changeDetectionProp) {
                    // Property missing. Add it.
                    const changeDetectionStrategyExpr = importManager.addImport({
                        exportModuleSpecifier: '@angular/core',
                        exportSymbolName: 'ChangeDetectionStrategy',
                        requestedFile: sf,
                    });
                    // Print the identifier
                    const exprText = printer.printNode(ts.EmitHint.Unspecified, changeDetectionStrategyExpr, sf);
                    const properties = metadata.properties;
                    let insertPos;
                    let toInsert;
                    if (properties.length > 0) {
                        const lastProp = properties[properties.length - 1];
                        insertPos = lastProp.getEnd();
                        // Simpler approach: check comma after last property.
                        const textAfter = sf.text.substring(lastProp.getEnd());
                        const hasComma = /^\s*,/.test(textAfter);
                        const prefix = hasComma ? '' : ',';
                        toInsert = `${prefix}\n  changeDetection: ${exprText}.Eager`;
                    }
                    else {
                        insertPos = metadata.getStart() + 1;
                        toInsert = `\n  changeDetection: ${exprText}.Eager\n`;
                    }
                    replacements.push(new project_paths.Replacement(project_paths.projectFile(sf, info), new project_paths.TextUpdate({
                        position: insertPos,
                        end: insertPos,
                        toInsert: toInsert,
                    })));
                    return;
                }
                // Check if explicitly set to Default.
                if (!ts.isPropertyAccessExpression(changeDetectionProp.initializer)) {
                    return;
                }
                const initializer = changeDetectionProp.initializer;
                // Best effort check for ChangeDetectionStrategy.Default
                if (!ts.isIdentifier(initializer.expression) || initializer.name.text !== 'Default') {
                    return;
                }
                // Verify it is indeed ChangeDetectionStrategy.
                // We can check if the symbol of the expression is imported from @angular/core and named ChangeDetectionStrategy.
                const symbol = typeChecker.getSymbolAtLocation(initializer.expression);
                if (!symbol || !symbol.declarations || symbol.declarations.length === 0) {
                    return;
                }
                const declaration = symbol.declarations[0];
                if (!ts.isImportSpecifier(declaration)) {
                    return;
                }
                const propertyName = declaration.propertyName?.text ?? declaration.name.text;
                const importDecl = declaration.parent.parent.parent;
                if (!ts.isImportDeclaration(importDecl) ||
                    !ts.isStringLiteral(importDecl.moduleSpecifier) ||
                    importDecl.moduleSpecifier.text !== '@angular/core' ||
                    propertyName !== 'ChangeDetectionStrategy') {
                    return;
                }
                replacements.push(new project_paths.Replacement(project_paths.projectFile(sf, info), new project_paths.TextUpdate({
                    position: initializer.name.getStart(),
                    end: initializer.name.getEnd(),
                    toInsert: 'Eager',
                })));
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

function migrate(options) {
    return async (tree, context) => {
        await project_paths.runMigrationInDevkit({
            tree,
            getMigration: (fs) => new ChangeDetectionEagerMigration(),
        });
    };
}

exports.migrate = migrate;
