'use strict';
/**
 * @license Angular v19.1.0-next.3+sha-c181903
 * (c) 2010-2024 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var schematics = require('@angular-devkit/schematics');
var p = require('path');
var project_tsconfig_paths = require('./project_tsconfig_paths-e9ccccbf.js');
var compiler_host = require('./compiler_host-22f6513d.js');
var ts = require('typescript');
var imports = require('./imports-abe29092.js');
require('@angular-devkit/core');
require('./checker-884633eb.js');
require('os');
require('fs');
require('module');
require('url');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var ts__default = /*#__PURE__*/_interopDefaultLegacy(ts);

const CORE = '@angular/core';
const DIRECTIVE = 'Directive';
const COMPONENT = 'Component';
const PIPE = 'Pipe';
function migrateFile(sourceFile, rewriteFn) {
    const changeTracker = new compiler_host.ChangeTracker(ts__default["default"].createPrinter());
    // Check if there are any imports of the `AfterRenderPhase` enum.
    const coreImports = imports.getNamedImports(sourceFile, CORE);
    if (!coreImports) {
        return;
    }
    const directive = imports.getImportSpecifier(sourceFile, CORE, DIRECTIVE);
    const component = imports.getImportSpecifier(sourceFile, CORE, COMPONENT);
    const pipe = imports.getImportSpecifier(sourceFile, CORE, PIPE);
    if (!directive && !component && !pipe) {
        return;
    }
    ts__default["default"].forEachChild(sourceFile, function visit(node) {
        ts__default["default"].forEachChild(node, visit);
        // First we need to check for class declarations
        // Decorators will come after
        if (!ts__default["default"].isClassDeclaration(node)) {
            return;
        }
        ts__default["default"].getDecorators(node)?.forEach((decorator) => {
            if (!ts__default["default"].isDecorator(decorator)) {
                return;
            }
            const callExpression = decorator.expression;
            if (!ts__default["default"].isCallExpression(callExpression)) {
                return;
            }
            const decoratorIdentifier = callExpression.expression;
            if (!ts__default["default"].isIdentifier(decoratorIdentifier)) {
                return;
            }
            // Checking the identifier of the decorator by comparing to the import specifier
            switch (decoratorIdentifier.text) {
                case directive?.name.text:
                case component?.name.text:
                case pipe?.name.text:
                    break;
                default:
                    // It's not a decorator to migrate
                    return;
            }
            const [decoratorArgument] = callExpression.arguments;
            if (!decoratorArgument || !ts__default["default"].isObjectLiteralExpression(decoratorArgument)) {
                return;
            }
            const properties = decoratorArgument.properties;
            const standaloneProp = getStandaloneProperty(properties);
            const hasImports = decoratorHasImports(decoratorArgument);
            // We'll use the presence of imports to keep the migration idempotent
            // We need to take care of 3 cases
            // - standalone: true  => remove the property if we have imports
            // - standalone: false => nothing
            // - No standalone property => add a standalone: false property if there are no imports
            let newProperties;
            if (!standaloneProp) {
                if (!hasImports) {
                    const standaloneFalseProperty = ts__default["default"].factory.createPropertyAssignment('standalone', ts__default["default"].factory.createFalse());
                    newProperties = [...properties, standaloneFalseProperty];
                }
            }
            else if (standaloneProp.value === ts__default["default"].SyntaxKind.TrueKeyword && hasImports) {
                // To keep the migration idempotent, we'll only remove the standalone prop when there are imports
                newProperties = properties.filter((p) => p !== standaloneProp.property);
            }
            if (newProperties) {
                // At this point we know that we need to add standalone: false or
                // remove an existing standalone: true property.
                const newPropsArr = ts__default["default"].factory.createNodeArray(newProperties);
                const newFirstArg = ts__default["default"].factory.createObjectLiteralExpression(newPropsArr, true);
                changeTracker.replaceNode(decoratorArgument, newFirstArg);
            }
        });
    });
    // Write the changes.
    for (const changesInFile of changeTracker.recordChanges().values()) {
        for (const change of changesInFile) {
            rewriteFn(change.start, change.removeLength ?? 0, change.text);
        }
    }
}
function getStandaloneProperty(properties) {
    for (const prop of properties) {
        if (ts__default["default"].isShorthandPropertyAssignment(prop) && prop.name.text) {
            return { property: prop, value: prop.objectAssignmentInitializer };
        }
        if (isStandaloneProperty(prop)) {
            if (prop.initializer.kind === ts__default["default"].SyntaxKind.TrueKeyword ||
                prop.initializer.kind === ts__default["default"].SyntaxKind.FalseKeyword) {
                return { property: prop, value: prop.initializer.kind };
            }
            else {
                return { property: prop, value: prop.initializer };
            }
        }
    }
    return undefined;
}
function isStandaloneProperty(prop) {
    return (ts__default["default"].isPropertyAssignment(prop) && ts__default["default"].isIdentifier(prop.name) && prop.name.text === 'standalone');
}
function decoratorHasImports(decoratorArgument) {
    for (const prop of decoratorArgument.properties) {
        if (ts__default["default"].isPropertyAssignment(prop) &&
            ts__default["default"].isIdentifier(prop.name) &&
            prop.name.text === 'imports') {
            if (prop.initializer.kind === ts__default["default"].SyntaxKind.ArrayLiteralExpression ||
                prop.initializer.kind === ts__default["default"].SyntaxKind.Identifier) {
                return true;
            }
        }
    }
    return false;
}

function migrate() {
    return async (tree) => {
        const { buildPaths, testPaths } = await project_tsconfig_paths.getProjectTsConfigPaths(tree);
        const basePath = process.cwd();
        const allPaths = [...buildPaths, ...testPaths];
        if (!allPaths.length) {
            throw new schematics.SchematicsException('Could not find any tsconfig file. Cannot run the explicit-standalone-flag migration.');
        }
        for (const tsconfigPath of allPaths) {
            runMigration(tree, tsconfigPath, basePath);
        }
    };
}
function runMigration(tree, tsconfigPath, basePath) {
    const program = compiler_host.createMigrationProgram(tree, tsconfigPath, basePath);
    const sourceFiles = program
        .getSourceFiles()
        .filter((sourceFile) => compiler_host.canMigrateFile(basePath, sourceFile, program));
    for (const sourceFile of sourceFiles) {
        let update = null;
        const rewriter = (startPos, width, text) => {
            if (update === null) {
                // Lazily initialize update, because most files will not require migration.
                update = tree.beginUpdate(p.relative(basePath, sourceFile.fileName));
            }
            update.remove(startPos, width);
            if (text !== null) {
                update.insertLeft(startPos, text);
            }
        };
        migrateFile(sourceFile, rewriter);
        if (update !== null) {
            tree.commitUpdate(update);
        }
    }
}

exports.migrate = migrate;
