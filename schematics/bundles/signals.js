'use strict';
/**
 * @license Angular v20.0.0-next.5+sha-3d85d93
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var schematics = require('@angular-devkit/schematics');
var signalQueriesMigration = require('./signal-queries-migration.js');
var signalInputMigration = require('./signal-input-migration.js');
var outputMigration = require('./output-migration.js');
require('./compiler-BQ7R7w2v.js');
require('typescript');
require('./checker-BRvGmaOO.js');
require('os');
require('fs');
require('module');
require('path');
require('url');
require('./index-BzVBAdce.js');
require('./project_paths-CYSd-c5s.js');
require('@angular-devkit/core');
require('node:path/posix');
require('./project_tsconfig_paths-CDVxT6Ov.js');
require('./apply_import_manager-DO1s35eE.js');
require('./migrate_ts_type_references-Cvc6zy0n.js');
require('assert');
require('./index-brz8Qy4V.js');
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
