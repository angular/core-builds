'use strict';
/**
 * @license Angular v21.2.0-next.0+sha-a4f6d40
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
'use strict';

var schematics = require('@angular-devkit/schematics');
var signalQueriesMigration = require('./signal-queries-migration.cjs');
var signalInputMigration = require('./signal-input-migration.cjs');
var outputMigration = require('./output-migration.cjs');
require('@angular/compiler-cli/private/migrations');
require('typescript');
require('@angular/compiler-cli');
require('node:path');
require('./project_paths-D2V-Uh2L.cjs');
require('@angular-devkit/core');
require('node:path/posix');
require('./project_tsconfig_paths-DkkMibv-.cjs');
require('./apply_import_manager-CxA_YYgB.cjs');
require('./migrate_ts_type_references-MWoZx-Cb.cjs');
require('assert');
require('./index-BtLcQH8g.cjs');
require('@angular/compiler');
require('./leading_space-BTPRV0wu.cjs');

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
