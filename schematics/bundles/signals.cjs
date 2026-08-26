'use strict';
/**
 * @license Angular v22.2.0-next.3+sha-2e6a057
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
require('./project_paths-LBcwW5BF.cjs');
require('@angular-devkit/core');
require('node:path/posix');
require('./project_tsconfig_paths-BejwmdOG.cjs');
require('./apply_import_manager-BsCkDgPj.cjs');
require('./migrate_ts_type_references-kFRw1WeT.cjs');
require('assert');
require('./index-CYvBVnIF.cjs');
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
