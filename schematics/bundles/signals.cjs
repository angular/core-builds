'use strict';
/**
 * @license Angular v21.0.0-next.2+sha-efb9474
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var schematics = require('@angular-devkit/schematics');
var signalQueriesMigration = require('./signal-queries-migration.cjs');
var signalInputMigration = require('./signal-input-migration.cjs');
var outputMigration = require('./output-migration.cjs');
require('./project_tsconfig_paths-bRwOJEk9.cjs');
require('typescript');
require('os');
require('fs');
require('module');
require('path');
require('url');
require('@angular-devkit/core');
require('./index-ZW8O9xDM.cjs');
require('node:path');
require('./project_paths-DxoASkM9.cjs');
require('node:path/posix');
require('./apply_import_manager-BDLDoaQb.cjs');
require('./migrate_ts_type_references-BfgTgqKx.cjs');
require('assert');
require('./index-M4f9d6Ht.cjs');
require('./leading_space-D9nQ8UQC.cjs');

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
