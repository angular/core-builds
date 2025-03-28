'use strict';
/**
 * @license Angular v19.2.4+sha-b18215d
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var schematics = require('@angular-devkit/schematics');
var signalQueriesMigration = require('./signal-queries-migration.js');
var signalInputMigration = require('./signal-input-migration.js');
var outputMigration = require('./output-migration.js');
require('./project_tsconfig_paths-CDVxT6Ov.js');
require('@angular-devkit/core');
require('./project_paths-t2ghQjtj.js');
require('node:path/posix');
require('os');
require('typescript');
require('./checker-B_GCUUMg.js');
require('fs');
require('module');
require('path');
require('url');
require('./program-C93pimal.js');
require('./apply_import_manager-BljPBKs2.js');
require('./migrate_ts_type_references-LiyxAZTZ.js');
require('assert');
require('./index-BMdgCMBZ.js');
require('./leading_space-D9nQ8UQC.js');

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
