'use strict';
/**
 * @license Angular v20.0.5+sha-74004f6
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var schematics = require('@angular-devkit/schematics');
var fs = require('fs');
var p = require('path');
var compiler_host = require('./compiler_host-Kg3VLaJg.cjs');
var project_tsconfig_paths = require('./project_tsconfig_paths-CDVxT6Ov.cjs');
var ts = require('typescript');
var checker = require('./checker-bovuFVqM.cjs');
var property_name = require('./property_name-BBwFuqMe.cjs');
require('os');
require('@angular-devkit/core');
require('module');
require('url');

/**
 * Finds the class declaration that is being referred to by a node.
 * @param reference Node referring to a class declaration.
 * @param typeChecker
 */
function findClassDeclaration(reference, typeChecker) {
    return (typeChecker
        .getTypeAtLocation(reference)
        .getSymbol()
        ?.declarations?.find(ts.isClassDeclaration) || null);
}

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
/**
 * Checks whether a component is standalone.
 * @param node Class being checked.
 * @param reflector The reflection host to use.
 */
function isStandaloneComponent(node, reflector) {
    const decorators = reflector.getDecoratorsOfDeclaration(node);
    if (decorators === null) {
        return false;
    }
    const decorator = checker.findAngularDecorator(decorators, 'Component', false);
    if (decorator === undefined || decorator.args === null || decorator.args.length !== 1) {
        return false;
    }
    const arg = decorator.args[0];
    if (ts.isObjectLiteralExpression(arg)) {
        const property = property_name.findLiteralProperty(arg, 'standalone');
        if (property) {
            return property.initializer.getText() === 'true';
        }
        else {
            return true; // standalone is true by default in v19
        }
    }
    return false;
}
/**
 * Checks whether a node is variable declaration of type Routes or Route[] and comes from @angular/router
 * @param node Variable declaration being checked.
 * @param typeChecker
 */
function isAngularRoutesArray(node, typeChecker) {
    if (ts.isVariableDeclaration(node)) {
        const type = typeChecker.getTypeAtLocation(node);
        if (type && typeChecker.isArrayType(type)) {
            // Route[] is an array type
            const typeArguments = typeChecker.getTypeArguments(type);
            const symbol = typeArguments[0]?.getSymbol();
            return (symbol?.name === 'Route' &&
                symbol?.declarations?.some((decl) => {
                    return decl.getSourceFile().fileName.includes('@angular/router');
                }));
        }
    }
    return false;
}
/**
 * Checks whether a node is a call expression to a router module method.
 * Examples:
 * - RouterModule.forRoot(routes)
 * - RouterModule.forChild(routes)
 */
function isRouterModuleCallExpression(node, typeChecker) {
    if (ts.isPropertyAccessExpression(node.expression)) {
        const propAccess = node.expression;
        const moduleSymbol = typeChecker.getSymbolAtLocation(propAccess.expression);
        return (moduleSymbol?.name === 'RouterModule' &&
            (propAccess.name.text === 'forRoot' || propAccess.name.text === 'forChild'));
    }
    return false;
}
/**
 * Checks whether a node is a call expression to a router method.
 * Example: this.router.resetConfig(routes)
 */
function isRouterCallExpression(node, typeChecker) {
    if (ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'resetConfig') {
        const calleeExpression = node.expression.expression;
        const symbol = typeChecker.getSymbolAtLocation(calleeExpression);
        if (symbol) {
            const type = typeChecker.getTypeOfSymbolAtLocation(symbol, calleeExpression);
            // if type of router is Router, then it is a router call expression
            return type.aliasSymbol?.escapedName === 'Router';
        }
    }
    return false;
}
/**
 * Checks whether a node is a call expression to router provide function.
 * Example: provideRoutes(routes)
 */
function isRouterProviderCallExpression(node, typeChecker) {
    if (ts.isIdentifier(node.expression)) {
        const moduleSymbol = typeChecker.getSymbolAtLocation(node.expression);
        return moduleSymbol && moduleSymbol.name === 'provideRoutes';
    }
    return false;
}
/**
 * Checks whether a node is a call expression to provideRouter function.
 * Example: provideRouter(routes)
 */
function isProvideRoutesCallExpression(node, typeChecker) {
    if (ts.isIdentifier(node.expression)) {
        const moduleSymbol = typeChecker.getSymbolAtLocation(node.expression);
        return moduleSymbol && moduleSymbol.name === 'provideRouter';
    }
    return false;
}

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
/**
 * Converts all application routes that are using standalone components to be lazy loaded.
 * @param sourceFile File that should be migrated.
 * @param program
 */
function migrateFileToLazyRoutes(sourceFile, program) {
    const typeChecker = program.getTypeChecker();
    const reflector = new checker.TypeScriptReflectionHost(typeChecker);
    const printer = ts.createPrinter();
    const tracker = new compiler_host.ChangeTracker(printer);
    const routeArraysToMigrate = findRoutesArrayToMigrate(sourceFile, typeChecker);
    if (routeArraysToMigrate.length === 0) {
        return { pendingChanges: [], skippedRoutes: [], migratedRoutes: [] };
    }
    const { skippedRoutes, migratedRoutes } = migrateRoutesArray(routeArraysToMigrate, typeChecker, reflector, tracker);
    return {
        pendingChanges: tracker.recordChanges().get(sourceFile) || [],
        skippedRoutes,
        migratedRoutes,
    };
}
/** Finds route object that can be migrated */
function findRoutesArrayToMigrate(sourceFile, typeChecker) {
    const routesArrays = [];
    sourceFile.forEachChild(function walk(node) {
        if (ts.isCallExpression(node)) {
            if (isRouterModuleCallExpression(node, typeChecker) ||
                isRouterProviderCallExpression(node, typeChecker) ||
                isRouterCallExpression(node, typeChecker) ||
                isProvideRoutesCallExpression(node, typeChecker)) {
                const arg = node.arguments[0]; // ex: RouterModule.forRoot(routes) or provideRouter(routes)
                const routeFileImports = sourceFile.statements.filter(ts.isImportDeclaration);
                if (ts.isArrayLiteralExpression(arg) && arg.elements.length > 0) {
                    // ex: inline routes array: RouterModule.forRoot([{ path: 'test', component: TestComponent }])
                    routesArrays.push({
                        routeFilePath: sourceFile.fileName,
                        array: arg,
                        routeFileImports,
                    });
                }
                else if (ts.isIdentifier(arg)) {
                    // ex: reference to routes array: RouterModule.forRoot(routes)
                    // RouterModule.forRoot(routes), provideRouter(routes), provideRoutes(routes)
                    const symbol = typeChecker.getSymbolAtLocation(arg);
                    if (!symbol?.declarations)
                        return;
                    for (const declaration of symbol.declarations) {
                        if (ts.isVariableDeclaration(declaration)) {
                            const initializer = declaration.initializer;
                            if (initializer && ts.isArrayLiteralExpression(initializer)) {
                                // ex: const routes = [{ path: 'test', component: TestComponent }];
                                routesArrays.push({
                                    routeFilePath: sourceFile.fileName,
                                    array: initializer,
                                    routeFileImports,
                                });
                            }
                        }
                    }
                }
            }
        }
        if (ts.isVariableDeclaration(node)) {
            if (isAngularRoutesArray(node, typeChecker)) {
                const initializer = node.initializer;
                if (initializer &&
                    ts.isArrayLiteralExpression(initializer) &&
                    initializer.elements.length > 0) {
                    // ex: const routes: Routes = [{ path: 'test', component: TestComponent }];
                    if (routesArrays.find((x) => x.array === initializer)) {
                        // already exists
                        return;
                    }
                    routesArrays.push({
                        routeFilePath: sourceFile.fileName,
                        array: initializer,
                        routeFileImports: sourceFile.statements.filter(ts.isImportDeclaration),
                    });
                }
            }
        }
        node.forEachChild(walk);
    });
    return routesArrays;
}
/** Migrate a routes object standalone components to be lazy loaded. */
function migrateRoutesArray(routesArray, typeChecker, reflector, tracker) {
    const migratedRoutes = [];
    const skippedRoutes = [];
    const importsToRemove = [];
    for (const route of routesArray) {
        route.array.elements.forEach((element) => {
            if (ts.isObjectLiteralExpression(element)) {
                const { migratedRoutes: migrated, skippedRoutes: toBeSkipped, importsToRemove: toBeRemoved, } = migrateRoute(element, route, typeChecker, reflector, tracker);
                migratedRoutes.push(...migrated);
                skippedRoutes.push(...toBeSkipped);
                importsToRemove.push(...toBeRemoved);
            }
        });
    }
    for (const importToRemove of importsToRemove) {
        tracker.removeNode(importToRemove);
    }
    return { migratedRoutes, skippedRoutes };
}
/**
 * Migrates a single route object and returns the results of the migration
 * It recursively migrates the children routes if they exist
 */
function migrateRoute(element, route, typeChecker, reflector, tracker) {
    const skippedRoutes = [];
    const migratedRoutes = [];
    const importsToRemove = [];
    const component = property_name.findLiteralProperty(element, 'component');
    // this can be empty string or a variable that is not a string, or not present at all
    const routePath = property_name.findLiteralProperty(element, 'path')?.getText() ?? '';
    const children = property_name.findLiteralProperty(element, 'children');
    // recursively migrate children routes first if they exist
    if (children && ts.isArrayLiteralExpression(children.initializer)) {
        for (const childRoute of children.initializer.elements) {
            if (ts.isObjectLiteralExpression(childRoute)) {
                const { migratedRoutes: migrated, skippedRoutes: toBeSkipped, importsToRemove: toBeRemoved, } = migrateRoute(childRoute, route, typeChecker, reflector, tracker);
                migratedRoutes.push(...migrated);
                skippedRoutes.push(...toBeSkipped);
                importsToRemove.push(...toBeRemoved);
            }
        }
    }
    const routeMigrationResults = { migratedRoutes, skippedRoutes, importsToRemove };
    if (!component) {
        return routeMigrationResults;
    }
    const componentDeclaration = findClassDeclaration(component, typeChecker);
    if (!componentDeclaration) {
        return routeMigrationResults;
    }
    // if component is not a standalone component, skip it
    if (!isStandaloneComponent(componentDeclaration, reflector)) {
        skippedRoutes.push({ path: routePath, file: route.routeFilePath });
        return routeMigrationResults;
    }
    const componentClassName = componentDeclaration.name && ts.isIdentifier(componentDeclaration.name)
        ? componentDeclaration.name.text
        : null;
    if (!componentClassName) {
        return routeMigrationResults;
    }
    // if component is in the same file as the routes array, skip it
    if (componentDeclaration.getSourceFile().fileName === route.routeFilePath) {
        return routeMigrationResults;
    }
    const componentImport = route.routeFileImports.find((importDecl) => importDecl.importClause?.getText().includes(componentClassName));
    // remove single and double quotes from the import path
    let componentImportPath = ts.isStringLiteral(componentImport?.moduleSpecifier)
        ? componentImport.moduleSpecifier.text
        : null;
    // if the import path is not a string literal, skip it
    if (!componentImportPath) {
        skippedRoutes.push({ path: routePath, file: route.routeFilePath });
        return routeMigrationResults;
    }
    const isDefaultExport = componentDeclaration.modifiers?.some((x) => x.kind === ts.SyntaxKind.DefaultKeyword) ?? false;
    const loadComponent = createLoadComponentPropertyAssignment(componentImportPath, componentClassName, isDefaultExport);
    tracker.replaceNode(component, loadComponent);
    // Add the import statement for the standalone component
    if (!importsToRemove.includes(componentImport)) {
        importsToRemove.push(componentImport);
    }
    migratedRoutes.push({ path: routePath, file: route.routeFilePath });
    // the component was migrated, so we return the results
    return routeMigrationResults;
}
/**
 * Generates the loadComponent property assignment for a given component.
 *
 * Example:
 * loadComponent: () => import('./path').then(m => m.componentName)
 * or
 * loadComponent: () => import('./path') // when isDefaultExport is true
 */
function createLoadComponentPropertyAssignment(componentImportPath, componentDeclarationName, isDefaultExport) {
    return ts.factory.createPropertyAssignment('loadComponent', ts.factory.createArrowFunction(undefined, undefined, [], undefined, ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), isDefaultExport
        ? createImportCallExpression(componentImportPath) // will generate import('./path) and will skip the then() call
        : ts.factory.createCallExpression(
        // will generate import('./path).then(m => m.componentName)
        ts.factory.createPropertyAccessExpression(createImportCallExpression(componentImportPath), 'then'), undefined, [createImportThenCallExpression(componentDeclarationName)])));
}
// import('./path)
const createImportCallExpression = (componentImportPath) => ts.factory.createCallExpression(ts.factory.createIdentifier('import'), undefined, [
    ts.factory.createStringLiteral(componentImportPath, true),
]);
// m => m.componentName
const createImportThenCallExpression = (componentDeclarationName) => ts.factory.createArrowFunction(undefined, undefined, [ts.factory.createParameterDeclaration(undefined, undefined, 'm', undefined, undefined)], undefined, ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('m'), componentDeclarationName));

function migrate(options) {
    return async (tree, context) => {
        const { buildPaths } = await project_tsconfig_paths.getProjectTsConfigPaths(tree);
        const basePath = process.cwd();
        // TS and Schematic use paths in POSIX format even on Windows. This is needed as otherwise
        // string matching such as `sourceFile.fileName.startsWith(pathToMigrate)` might not work.
        const pathToMigrate = compiler_host.normalizePath(p.join(basePath, options.path));
        if (!buildPaths.length) {
            throw new schematics.SchematicsException('Could not find any tsconfig file. Cannot run the route lazy loading migration.');
        }
        let migratedRoutes = [];
        let skippedRoutes = [];
        for (const tsconfigPath of buildPaths) {
            const { migratedRoutes: migrated, skippedRoutes: skipped } = standaloneRoutesMigration(tree, tsconfigPath, basePath, pathToMigrate, options);
            migratedRoutes.push(...migrated);
            skippedRoutes.push(...skipped);
        }
        if (migratedRoutes.length === 0 && skippedRoutes.length === 0) {
            throw new schematics.SchematicsException(`Could not find any files to migrate under the path ${pathToMigrate}.`);
        }
        context.logger.info('🎉 Automated migration step has finished! 🎉');
        context.logger.info(`Number of updated routes: ${migratedRoutes.length}`);
        context.logger.info(`Number of skipped routes: ${skippedRoutes.length}`);
        if (skippedRoutes.length > 0) {
            context.logger.info(`Note: this migration was unable to optimize the following routes, since they use components declared in NgModules:`);
            for (const route of skippedRoutes) {
                context.logger.info(`- \`${route.path}\` path at \`${route.file}\``);
            }
            context.logger.info(`Consider making those components standalone and run this migration again. More information about standalone migration can be found at https://angular.dev/reference/migrations/standalone`);
        }
        context.logger.info('IMPORTANT! Please verify manually that your application builds and behaves as expected.');
        context.logger.info(`See https://angular.dev/reference/migrations/route-lazy-loading for more information.`);
    };
}
function standaloneRoutesMigration(tree, tsconfigPath, basePath, pathToMigrate, schematicOptions) {
    if (schematicOptions.path.startsWith('..')) {
        throw new schematics.SchematicsException('Cannot run route lazy loading migration outside of the current project.');
    }
    if (fs.existsSync(pathToMigrate) && !fs.statSync(pathToMigrate).isDirectory()) {
        throw new schematics.SchematicsException(`Migration path ${pathToMigrate} has to be a directory. Cannot run the route lazy loading migration.`);
    }
    const program = compiler_host.createMigrationProgram(tree, tsconfigPath, basePath);
    const sourceFiles = program
        .getSourceFiles()
        .filter((sourceFile) => sourceFile.fileName.startsWith(pathToMigrate) &&
        compiler_host.canMigrateFile(basePath, sourceFile, program));
    const migratedRoutes = [];
    const skippedRoutes = [];
    if (sourceFiles.length === 0) {
        return { migratedRoutes, skippedRoutes };
    }
    for (const sourceFile of sourceFiles) {
        const { pendingChanges, skippedRoutes: skipped, migratedRoutes: migrated, } = migrateFileToLazyRoutes(sourceFile, program);
        skippedRoutes.push(...skipped);
        migratedRoutes.push(...migrated);
        const update = tree.beginUpdate(p.relative(basePath, sourceFile.fileName));
        pendingChanges.forEach((change) => {
            if (change.removeLength != null) {
                update.remove(change.start, change.removeLength);
            }
            update.insertRight(change.start, change.text);
        });
        tree.commitUpdate(update);
    }
    return { migratedRoutes, skippedRoutes };
}

exports.migrate = migrate;
