'use strict';
/**
 * @license Angular v21.0.0-next.1+sha-1bb30c7
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var ts = require('typescript');
require('os');
require('./project_tsconfig_paths-D7xzGqRi.cjs');
require('./index-jjHOgYYs.cjs');
require('path');
require('node:path');
var project_paths = require('./project_paths-T_M15e2g.cjs');
var imports = require('./imports-26VeX8i-.cjs');
var symbol = require('./symbol-VPWguRxr.cjs');
require('@angular-devkit/core');
require('node:path/posix');
require('fs');
require('module');
require('url');
require('@angular-devkit/schematics');

/** Name of the method being replaced. */
const METHOD_NAME = 'lastSuccessfulNavigation';
/** Migration that replaces `Router.lastSuccessfulNavigation` usages with `Router.lastSuccessfulNavigation()`. */
class RouterLastSuccessfulNavigationMigration extends project_paths.TsurgeFunnelMigration {
    async analyze(info) {
        const locations = [];
        for (const sourceFile of info.sourceFiles) {
            const routerSpecifier = imports.getImportSpecifier(sourceFile, '@angular/router', 'Router');
            if (routerSpecifier === null) {
                continue;
            }
            const typeChecker = info.program.getTypeChecker();
            sourceFile.forEachChild(function walk(node) {
                if (ts.isPropertyAccessExpression(node) &&
                    node.name.text === METHOD_NAME &&
                    isRouterType(typeChecker, node.expression, routerSpecifier)) {
                    locations.push({ file: project_paths.projectFile(sourceFile, info), position: node.name.getStart() });
                }
                else {
                    node.forEachChild(walk);
                }
            });
        }
        return project_paths.confirmAsSerializable({ locations });
    }
    async migrate(globalData) {
        const replacements = globalData.locations.map(({ file, position }) => {
            return new project_paths.Replacement(file, new project_paths.TextUpdate({
                position: position,
                end: position + METHOD_NAME.length,
                toInsert: 'lastSuccessfulNavigation()',
            }));
        });
        return project_paths.confirmAsSerializable({ replacements });
    }
    async combine(unitA, unitB) {
        const seen = new Set();
        const locations = [];
        const combined = [...unitA.locations, ...unitB.locations];
        for (const location of combined) {
            const key = `${location.file.id}#${location.position}`;
            if (!seen.has(key)) {
                seen.add(key);
                locations.push(location);
            }
        }
        return project_paths.confirmAsSerializable({ locations });
    }
    async globalMeta(combinedData) {
        return project_paths.confirmAsSerializable(combinedData);
    }
    async stats() {
        return project_paths.confirmAsSerializable({});
    }
}
/**
 * Checks if the given symbol represents a Router type.
 */
function isRouterType(typeChecker, expression, routerSpecifier) {
    const expressionType = typeChecker.getTypeAtLocation(expression);
    const expressionSymbol = expressionType.getSymbol();
    if (!expressionSymbol) {
        return false;
    }
    const declarations = expressionSymbol.getDeclarations() ?? [];
    for (const declaration of declarations) {
        if (symbol.isReferenceToImport(typeChecker, declaration, routerSpecifier)) {
            return true;
        }
    }
    return declarations.some((decl) => decl === routerSpecifier);
}

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
function migrate() {
    return async (tree) => {
        await project_paths.runMigrationInDevkit({
            tree,
            getMigration: () => new RouterLastSuccessfulNavigationMigration(),
        });
    };
}

exports.migrate = migrate;
