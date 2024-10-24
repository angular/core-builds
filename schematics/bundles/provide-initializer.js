'use strict';
/**
 * @license Angular v19.1.0-next.0+sha-2aa9f8b
 * (c) 2010-2024 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var schematics = require('@angular-devkit/schematics');
var p = require('path');
var project_tsconfig_paths = require('./project_tsconfig_paths-e9ccccbf.js');
var compiler_host = require('./compiler_host-8ffa8f26.js');
var ts = require('typescript');
var imports = require('./imports-4ac08251.js');
var nodes = require('./nodes-a535b2be.js');
require('@angular-devkit/core');
require('./checker-d4a34401.js');
require('os');
require('fs');
require('module');
require('url');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var ts__default = /*#__PURE__*/_interopDefaultLegacy(ts);

function migrateFile(sourceFile, rewriteFn) {
    const changeTracker = new compiler_host.ChangeTracker(ts__default["default"].createPrinter());
    const visitNode = (node) => {
        const provider = tryParseProviderExpression(node);
        if (provider) {
            replaceProviderWithNewApi({
                sourceFile: sourceFile,
                node: node,
                provider: provider,
                changeTracker,
            });
            return;
        }
        ts__default["default"].forEachChild(node, visitNode);
    };
    ts__default["default"].forEachChild(sourceFile, visitNode);
    for (const change of changeTracker.recordChanges().get(sourceFile)?.values() ?? []) {
        rewriteFn(change.start, change.removeLength ?? 0, change.text);
    }
}
function replaceProviderWithNewApi({ sourceFile, node, provider, changeTracker, }) {
    const { initializerCode, importInject, provideInitializerFunctionName, initializerToken } = provider;
    const initializerTokenSpecifier = imports.getImportSpecifier(sourceFile, angularCoreModule, initializerToken);
    // The token doesn't come from `@angular/core`.
    if (!initializerTokenSpecifier) {
        return;
    }
    // Replace the provider with the new provide function.
    changeTracker.replaceText(sourceFile, node.getStart(), node.getWidth(), `${provideInitializerFunctionName}(${initializerCode})`);
    // Import declaration and named imports are necessarily there.
    const namedImports = nodes.closestNode(initializerTokenSpecifier, ts__default["default"].isNamedImports);
    // `provide*Initializer` function is already imported.
    const hasProvideInitializeFunction = namedImports.elements.some((element) => element.name.getText() === provideInitializerFunctionName);
    const newNamedImports = ts__default["default"].factory.updateNamedImports(namedImports, [
        // Remove the `*_INITIALIZER` token from imports.
        ...namedImports.elements.filter((element) => element !== initializerTokenSpecifier),
        // Add the `inject` function to imports if needed.
        ...(importInject ? [createImportSpecifier('inject')] : []),
        // Add the `provide*Initializer` function to imports.
        ...(!hasProvideInitializeFunction
            ? [createImportSpecifier(provideInitializerFunctionName)]
            : []),
    ]);
    changeTracker.replaceNode(namedImports, newNamedImports);
}
function createImportSpecifier(name) {
    return ts__default["default"].factory.createImportSpecifier(false, undefined, ts__default["default"].factory.createIdentifier(name));
}
function tryParseProviderExpression(node) {
    if (!ts__default["default"].isObjectLiteralExpression(node)) {
        return;
    }
    let deps = [];
    let initializerToken;
    let useExisting;
    let useFactory;
    let useValue;
    let multi = false;
    for (const property of node.properties) {
        if (!ts__default["default"].isPropertyAssignment(property) || !ts__default["default"].isIdentifier(property.name)) {
            continue;
        }
        switch (property.name.text) {
            case 'deps':
                if (ts__default["default"].isArrayLiteralExpression(property.initializer)) {
                    deps = property.initializer.elements.map((el) => el.getText());
                }
                break;
            case 'provide':
                initializerToken = property.initializer.getText();
                break;
            case 'useExisting':
                useExisting = property.initializer;
                break;
            case 'useFactory':
                useFactory = property.initializer;
                break;
            case 'useValue':
                useValue = property.initializer;
                break;
            case 'multi':
                multi = property.initializer.kind === ts__default["default"].SyntaxKind.TrueKeyword;
                break;
        }
    }
    if (!initializerToken || !multi) {
        return;
    }
    const provideInitializerFunctionName = initializerTokenToFunctionMap.get(initializerToken);
    if (!provideInitializerFunctionName) {
        return;
    }
    const info = {
        initializerToken,
        provideInitializerFunctionName,
        importInject: false,
    };
    if (useExisting) {
        return {
            ...info,
            importInject: true,
            initializerCode: `() => inject(${useExisting.getText()})()`,
        };
    }
    if (useFactory) {
        const args = deps.map((dep) => `inject(${dep})`);
        return {
            ...info,
            importInject: deps.length > 0,
            initializerCode: `() => { return (${useFactory.getText()})(${args.join(', ')}); }`,
        };
    }
    if (useValue) {
        return { ...info, initializerCode: useValue.getText() };
    }
    return;
}
const angularCoreModule = '@angular/core';
const initializerTokenToFunctionMap = new Map([
    ['APP_INITIALIZER', 'provideAppInitializer'],
    ['ENVIRONMENT_INITIALIZER', 'provideEnvironmentInitializer'],
    ['PLATFORM_INITIALIZER', 'providePlatformInitializer'],
]);

function migrate() {
    return async (tree) => {
        const { buildPaths, testPaths } = await project_tsconfig_paths.getProjectTsConfigPaths(tree);
        const basePath = process.cwd();
        const allPaths = [...buildPaths, ...testPaths];
        if (!allPaths.length) {
            throw new schematics.SchematicsException('Could not find any tsconfig file. Cannot run the provide initializer migration.');
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
