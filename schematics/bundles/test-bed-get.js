'use strict';
/**
 * @license Angular v20.0.0-next.4+sha-7cb8639
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var ts = require('typescript');
require('os');
require('./checker-DYcSWDNs.js');
require('./compiler-DiOULWIB.js');
require('./index-DkPnSSP_.js');
require('path');
var run_in_devkit = require('./run_in_devkit-ZB_pVLiX.js');
var imports = require('./imports-CIX-JgAN.js');
var symbol = require('./symbol-VPWguRxr.js');
require('@angular-devkit/core');
require('node:path/posix');
require('fs');
require('module');
require('url');
require('@angular-devkit/schematics');
require('./project_tsconfig_paths-CDVxT6Ov.js');

/** Name of the method being replaced. */
const METHOD_NAME = 'get';
/** Migration that replaces `TestBed.get` usages with `TestBed.inject`. */
class TestBedGetMigration extends run_in_devkit.TsurgeFunnelMigration {
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
                    locations.push({ file: run_in_devkit.projectFile(sourceFile, info), position: node.name.getStart() });
                }
                else {
                    node.forEachChild(walk);
                }
            });
        }
        return run_in_devkit.confirmAsSerializable({ locations });
    }
    async migrate(globalData) {
        const replacements = globalData.locations.map(({ file, position }) => {
            return new run_in_devkit.Replacement(file, new run_in_devkit.TextUpdate({
                position: position,
                end: position + METHOD_NAME.length,
                toInsert: 'inject',
            }));
        });
        return run_in_devkit.confirmAsSerializable({ replacements });
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
        return run_in_devkit.confirmAsSerializable({ locations });
    }
    async globalMeta(combinedData) {
        return run_in_devkit.confirmAsSerializable(combinedData);
    }
    async stats() {
        return { counters: {} };
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
        await run_in_devkit.runMigrationInDevkit({
            tree,
            getMigration: () => new TestBedGetMigration(),
        });
    };
}

exports.migrate = migrate;
