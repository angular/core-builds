'use strict';
/**
 * @license Angular v19.2.1+sha-23ca885
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
require('./project_paths-f84aa05f.js');
require('node:path/posix');
require('os');
require('typescript');
require('./checker-9a0e59d0.js');
require('fs');
require('module');
require('path');
require('url');
require('./program-2e69ad65.js');
require('./apply_import_manager-13fe9e8d.js');
require('./migrate_ts_type_references-d65e0e8c.js');
require('assert');
require('./index-0bb548df.js');
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
