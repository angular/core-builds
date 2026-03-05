'use strict';
/**
 * @license Angular v22.0.0-next.1+sha-d69c468
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
'use strict';

require('@angular-devkit/core');
require('node:path/posix');
var project_paths = require('./project_paths-D2V-Uh2L.cjs');
var migrations = require('@angular/compiler-cli/private/migrations');
var ts = require('typescript');
require('@angular/compiler-cli');
require('node:path');
var apply_import_manager = require('./apply_import_manager-CxA_YYgB.cjs');
var imports = require('./imports-CKV-ITqD.cjs');
require('@angular-devkit/schematics');
require('./project_tsconfig_paths-DkkMibv-.cjs');

const HTTP = '@angular/common/http';
const provideHttpClient = 'provideHttpClient';
const WITH_FETCH = 'withFetch';
const WITH_XHR = 'withXhr';
const HTTP_PACKAGE = '@angular/common/http';
ts.factory.createIdentifier('provideHttpClient');
class XhrBackendMigration extends project_paths.TsurgeFunnelMigration {
    config;
    constructor(config = {}) {
        super();
        this.config = config;
    }
    async analyze(info) {
        const replacements = [];
        const importManager = new migrations.ImportManager();
        for (const sourceFile of info.sourceFiles) {
            const walk = (node) => {
                const file = project_paths.projectFile(sourceFile, info);
                if (this.config.shouldMigrate && !this.config.shouldMigrate(file)) {
                    return;
                }
                const httpImports = imports.getNamedImports(sourceFile, HTTP);
                if (!httpImports) {
                    return;
                }
                const importSpecifier = imports.getImportSpecifier(sourceFile, HTTP, provideHttpClient);
                if (!importSpecifier) {
                    return;
                }
                node.forEachChild(walk);
                if (!ts.isCallExpression(node))
                    return;
                if (!ts.isIdentifier(node.expression))
                    return;
                if (node.expression.text !== 'provideHttpClient')
                    return;
                const withFetchNode = node.arguments.find((arg) => {
                    return (ts.isCallExpression(arg) &&
                        ts.isIdentifier(arg.expression) &&
                        arg.expression.text === WITH_FETCH);
                });
                const withXhrNode = node.arguments.find((arg) => {
                    return (ts.isCallExpression(arg) &&
                        ts.isIdentifier(arg.expression) &&
                        arg.expression.text === WITH_XHR);
                });
                if (!withFetchNode && !withXhrNode) {
                    replacements.push(new project_paths.Replacement(project_paths.projectFile(sourceFile, info), new project_paths.TextUpdate({
                        position: node.arguments.pos,
                        end: node.arguments.pos,
                        toInsert: node.arguments.length ? 'withXhr(), ' : 'withXhr()',
                    })));
                    importManager.addImport({
                        exportModuleSpecifier: HTTP_PACKAGE,
                        exportSymbolName: WITH_XHR,
                        requestedFile: sourceFile,
                    });
                }
                else if (withFetchNode) {
                    const isLastArg = node.arguments[node.arguments.length - 1] === withFetchNode;
                    replacements.push(new project_paths.Replacement(project_paths.projectFile(sourceFile, info), new project_paths.TextUpdate({
                        position: withFetchNode.getStart(),
                        end: isLastArg ? withFetchNode.getEnd() : withFetchNode.getEnd() + 2, // +2 to remove the comma and space, could be improved
                        toInsert: '',
                    })));
                    importManager.removeImport(sourceFile, 'withFetch', HTTP_PACKAGE);
                }
            };
            sourceFile.forEachChild(walk);
        }
        apply_import_manager.applyImportManagerChanges(importManager, replacements, info.sourceFiles, info);
        return project_paths.confirmAsSerializable({ replacements });
    }
    async combine(unitA, unitB) {
        const combined = [...unitA.replacements, ...unitB.replacements];
        return project_paths.confirmAsSerializable({ replacements: combined });
    }
    async globalMeta(data) {
        return project_paths.confirmAsSerializable(data);
    }
    async stats(data) {
        return project_paths.confirmAsSerializable({});
    }
    async migrate(data) {
        return { replacements: data.replacements };
    }
}

function migrate() {
    return async (tree) => {
        await project_paths.runMigrationInDevkit({
            tree,
            getMigration: () => new XhrBackendMigration(),
        });
    };
}

exports.migrate = migrate;
