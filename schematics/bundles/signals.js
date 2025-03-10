'use strict';
/**
 * @license Angular v19.2.1+sha-30f6db3
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var schematics = require('@angular-devkit/schematics');
var signalQueriesMigration = require('./signal-queries-migration.js');
var signalInputMigration = require('./signal-input-migration.js');
var outputMigration = require('./output-migration.js');
require('./project_tsconfig_paths-b558633b.js');
require('@angular-devkit/core');
require('./project_paths-e73be6d4.js');
require('node:path/posix');
require('os');
require('typescript');
require('./checker-9a0e59d0.js');
require('fs');
require('module');
require('path');
require('url');
require('./program-7decdce7.js');
require('./apply_import_manager-8c4a9399.js');
require('./migrate_ts_type_references-d1cbb9bd.js');
require('assert');
require('./index-07fe1521.js');
require('./leading_space-f8944434.js');

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
