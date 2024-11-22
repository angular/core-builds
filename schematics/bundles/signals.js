'use strict';
/**
 * @license Angular v19.1.0-next.0+sha-aca8cc0
 * (c) 2010-2024 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var schematics = require('@angular-devkit/schematics');
var signalQueriesMigration = require('./signal-queries-migration.js');
var signalInputMigration = require('./signal-input-migration.js');
var outputMigration = require('./output-migration.js');
require('./project_tsconfig_paths-e9ccccbf.js');
require('@angular-devkit/core');
require('./combine_units-3b5a4512.js');
require('node:path/posix');
require('os');
require('typescript');
require('./checker-8326aad1.js');
require('fs');
require('module');
require('path');
require('url');
require('./program-103ecc0e.js');
require('./migrate_ts_type_references-21104c20.js');
require('assert');
require('./leading_space-d190b83b.js');

function migrate(options) {
    // The migrations are independent so we can run them in any order, but we sort them here
    // alphabetically so we get a consistent execution order in case of issue reports.
    const migrations = options.migrations.slice().sort();
    const rules = [];
    for (const migration of migrations) {
        switch (migration) {
            case "inputs" /* SupportedMigrations.inputs */:
                rules.push(signalInputMigration.migrate(options));
                break;
            case "outputs" /* SupportedMigrations.outputs */:
                rules.push(outputMigration.migrate(options));
                break;
            case "queries" /* SupportedMigrations.queries */:
                rules.push(signalQueriesMigration.migrate(options));
                break;
            default:
                throw new schematics.SchematicsException(`Unsupported migration "${migration}"`);
        }
    }
    return schematics.chain(rules);
}

exports.migrate = migrate;
