'use strict';
/**
 * @license Angular v19.2.5+sha-00bbd9b
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
require('./project_paths-CTgTxqrW.js');
require('node:path/posix');
require('os');
require('typescript');
require('./checker-CQvNmpT3.js');
require('fs');
require('module');
require('path');
require('url');
require('./program-XYcLSXb1.js');
require('./apply_import_manager-CTrezOPF.js');
require('./migrate_ts_type_references-CHRyhQvi.js');
require('assert');
require('./index-BKWl7N44.js');
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
