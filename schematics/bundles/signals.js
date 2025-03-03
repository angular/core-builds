'use strict';
/**
 * @license Angular v19.2.0+sha-cd31bfc
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
require('./project_paths-8d8090c4.js');
require('node:path/posix');
require('os');
require('typescript');
require('./checker-a9b8c723.js');
require('fs');
require('module');
require('path');
require('url');
require('./program-b3483bba.js');
require('./apply_import_manager-2c29fa65.js');
require('./migrate_ts_type_references-bb1d3ba7.js');
require('assert');
require('./index-70604a89.js');
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
