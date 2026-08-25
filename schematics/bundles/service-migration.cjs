'use strict';
/**
 * @license Angular v22.1.3+sha-b199bdf
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
'use strict';

var schematics = require('@angular-devkit/schematics');
var path = require('path');
var change_tracker = require('./change_tracker-BzE4pgz5.cjs');
var ts = require('typescript');
var ng_decorators = require('./ng_decorators-IVztR9rk.cjs');
var class_declaration = require('./class_declaration-BiS_wq9g.cjs');
var project_tsconfig_paths = require('./project_tsconfig_paths-BejwmdOG.cjs');
require('@angular/compiler-cli/private/migrations');
require('./imports-CKV-ITqD.cjs');
require('@angular-devkit/core');

/** Gets all base class declarations of the specified class declaration. */
function findBaseClassDeclarations(node, typeChecker) {
    const result = [];
    let currentClass = node;
    while (currentClass) {
        const baseTypes = class_declaration.getBaseTypeIdentifiers(currentClass);
        if (!baseTypes || baseTypes.length !== 1) {
            break;
        }
        const symbol = typeChecker.getTypeAtLocation(baseTypes[0]).getSymbol();
        // Note: `ts.Symbol#valueDeclaration` can be undefined. TypeScript has an incorrect type
        // for this: https://github.com/microsoft/TypeScript/issues/24706.
        if (!symbol || !symbol.valueDeclaration || !ts.isClassDeclaration(symbol.valueDeclaration)) {
            break;
        }
        result.push({ identifier: baseTypes[0], node: symbol.valueDeclaration });
        currentClass = symbol.valueDeclaration;
    }
    return result;
}

function migrateFile(sourceFile, typeChecker) {
    const tracker = new change_tracker.ChangeTracker(ts.createPrinter());
    let totalInjectables = 0;
    let migratedInjectables = 0;
    ts.forEachChild(sourceFile, function visit(node) {
        if (ts.isClassDeclaration(node)) {
            const decorator = ng_decorators.getAngularDecorators(typeChecker, ts.getDecorators(node) || []).find((d) => d.name === 'Injectable' && d.moduleName === '@angular/core');
            if (decorator) {
                const analysis = analyzeClass(node, decorator.node.expression.arguments, typeChecker);
                totalInjectables++;
                if (analysis.canMigrate) {
                    migratedInjectables++;
                    tracker.addImport(sourceFile, 'Service', '@angular/core');
                    tracker.replaceText(sourceFile, decorator.node.getStart(), decorator.node.getWidth(), `@Service(${analysis.providedInRoot ? '' : '{ autoProvided: false }'})`);
                }
            }
        }
        ts.forEachChild(node, visit);
    });
    if (totalInjectables > 0 && totalInjectables === migratedInjectables) {
        tracker.removeImport(sourceFile, 'Injectable', '@angular/core');
    }
    return tracker.recordChanges().get(sourceFile) || [];
}
function analyzeClass(node, decoratorArgs, typeChecker) {
    const analysis = {
        canMigrate: false,
        providedInRoot: false,
    };
    // We can't migrate if the class is using constructor DI.
    if (usesConstructorDI(node, typeChecker)) {
        return analysis;
    }
    else if (decoratorArgs.length === 0) {
        analysis.canMigrate = true;
        return analysis;
    }
    else if (decoratorArgs.length !== 1 || !ts.isObjectLiteralExpression(decoratorArgs[0])) {
        return analysis;
    }
    for (const prop of decoratorArgs[0].properties) {
        // We can't migrate if there's any other property than `providedIn`.
        if (!ts.isPropertyAssignment(prop) ||
            (!ts.isIdentifier(prop.name) && !ts.isStringLiteralLike(prop.name)) ||
            prop.name.text !== 'providedIn') {
            analysis.canMigrate = false;
            return analysis;
        }
        // We can only migrate if `providedIn` is set to `root`.
        if (ts.isStringLiteralLike(prop.initializer) && prop.initializer.text === 'root') {
            analysis.providedInRoot = true;
        }
        else {
            // Otherwise we can't migrate it either.
            analysis.canMigrate = false;
            return analysis;
        }
    }
    // If we made it this, it's possible to migrate.
    analysis.canMigrate = true;
    return analysis;
}
/** Determines whether a class uses constructor-based dependency injection. */
function usesConstructorDI(node, typeChecker) {
    const baseClasses = [node, ...findBaseClassDeclarations(node, typeChecker).map((c) => c.node)];
    for (const current of baseClasses) {
        const constructorNode = current.members.find((member) => ts.isConstructorDeclaration(member) && !!member.body);
        if (constructorNode) {
            return constructorNode.parameters.length > 0;
        }
    }
    return false;
}

function migrate(options) {
    return async (tree, context) => {
        const basePath = process.cwd();
        let pathToMigrate;
        if (options.path) {
            if (options.path.startsWith('..')) {
                throw new schematics.SchematicsException('Cannot run service migration outside of the current project.');
            }
            pathToMigrate = change_tracker.normalizePath(path.join(basePath, options.path));
        }
        const { buildPaths, testPaths } = await project_tsconfig_paths.getProjectTsConfigPaths(tree);
        const allPaths = [...buildPaths, ...testPaths];
        if (!allPaths.length) {
            context.logger.warn('Could not find any tsconfig file. Cannot run the service migration.');
            return;
        }
        let sourceFilesCount = 0;
        for (const tsconfigPath of allPaths) {
            const program = change_tracker.createMigrationProgram(tree, tsconfigPath, basePath);
            const sourceFiles = program
                .getSourceFiles()
                .filter((sourceFile) => (pathToMigrate ? sourceFile.fileName.startsWith(pathToMigrate) : true) &&
                change_tracker.canMigrateFile(basePath, sourceFile, program));
            sourceFilesCount += runServiceMigration(tree, program.getTypeChecker(), sourceFiles, basePath);
        }
        if (sourceFilesCount === 0) {
            context.logger.warn('Service migration did not find any files to migrate');
        }
    };
}
function runServiceMigration(tree, typeChecker, sourceFiles, basePath) {
    let migratedFiles = 0;
    for (const sourceFile of sourceFiles) {
        const changes = migrateFile(sourceFile, typeChecker);
        if (changes.length > 0) {
            const update = tree.beginUpdate(path.relative(basePath, sourceFile.fileName));
            for (const change of changes) {
                if (change.removeLength != null) {
                    update.remove(change.start, change.removeLength);
                }
                update.insertRight(change.start, change.text);
            }
            tree.commitUpdate(update);
            migratedFiles++;
        }
    }
    return migratedFiles;
}

exports.migrate = migrate;
