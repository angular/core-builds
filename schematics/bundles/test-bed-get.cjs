'use strict';
/**
 * @license Angular v20.0.0-rc.1+sha-fcd4355
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var ts = require('typescript');
require('os');
require('./checker-C4hSR1KC.cjs');
require('./compiler-CWuG67kz.cjs');
require('./index-CzdlVfCg.cjs');
require('path');
var project_paths = require('./project_paths-Gk3GIvw4.cjs');
var imports = require('./imports-CIX-JgAN.cjs');
var symbol = require('./symbol-VPWguRxr.cjs');
require('@angular-devkit/core');
require('node:path/posix');
require('fs');
require('module');
require('url');
require('@angular-devkit/schematics');
require('./project_tsconfig_paths-CDVxT6Ov.cjs');

/** Name of the method being replaced. */
const METHOD_NAME = 'get';
/** Migration that replaces `TestBed.get` usages with `TestBed.inject`. */
class TestBedGetMigration extends project_paths.TsurgeFunnelMigration {
    async analyze(info) {
        const locations = [];
        for (const sourceFile of info.sourceFiles) {
            const specifier = imports.getImportSpecifier(sourceFile, '@angular/core/testing', 'TestBed');
            if (specifier === null) {
                continue;
            }
            const typeChecker = info.program.getTypeChecker();
            sourceFile.forEachChild(function walk(node) {
                if (ts.isPropertyAccessExpression(node) &&
                    node.name.text === METHOD_NAME &&
                    ts.isIdentifier(node.expression) &&
                    symbol.isReferenceToImport(typeChecker, node.expression, specifier)) {
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
                toInsert: 'inject',
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
            getMigration: () => new TestBedGetMigration(),
        });
    };
}

exports.migrate = migrate;
