'use strict';
/**
 * @license Angular v22.0.1+sha-1d97355
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
'use strict';

require('@angular/compiler-cli');
var migrations = require('@angular/compiler-cli/private/migrations');
var ts = require('typescript');
require('node:path');
var project_paths = require('./project_paths-C3_ORvxG.cjs');
var imports = require('./imports-CKV-ITqD.cjs');
var apply_import_manager = require('./apply_import_manager-aRrR-E5x.cjs');
require('@angular-devkit/core');
require('node:path/posix');
require('@angular-devkit/schematics');
require('./project_tsconfig_paths-BejwmdOG.cjs');

class ModelOutputMigration extends project_paths.TsurgeFunnelMigration {
    config;
    constructor(config = {}) {
        super();
        this.config = config;
    }
    async analyze(info) {
        const replacements = [];
        for (const sourceFile of info.sourceFiles) {
            if (this.config.shouldMigrate && !this.config.shouldMigrate(project_paths.projectFile(sourceFile, info))) {
                continue;
            }
            const importManager = new migrations.ImportManager();
            const visit = (node) => {
                if (ts.isClassDeclaration(node)) {
                    this.analyzeClass(node, info.program.getTypeChecker(), importManager, replacements, sourceFile, info);
                }
                ts.forEachChild(node, visit);
            };
            visit(sourceFile);
            apply_import_manager.applyImportManagerChanges(importManager, replacements, [sourceFile], info);
        }
        return project_paths.confirmAsSerializable({
            replacements,
        });
    }
    analyzeClass(classNode, typeChecker, importManager, replacements, sourceFile, info) {
        const modelProperties = [];
        const outputProperties = new Map();
        for (const member of classNode.members) {
            if (!ts.isPropertyDeclaration(member) || !ts.isIdentifier(member.name)) {
                continue;
            }
            // Check for @Output() decorators
            const decorators = ts.getDecorators(member);
            if (decorators) {
                for (const decorator of decorators) {
                    if (ts.isCallExpression(decorator.expression) &&
                        ts.isIdentifier(decorator.expression.expression) &&
                        decorator.expression.expression.text === 'Output') {
                        const name = member.name.text;
                        outputProperties.set(name, member);
                    }
                }
            }
            if (!member.initializer || !ts.isCallExpression(member.initializer)) {
                continue;
            }
            const call = member.initializer;
            let identifier = null;
            if (ts.isIdentifier(call.expression)) {
                identifier = call.expression;
            }
            else if (ts.isPropertyAccessExpression(call.expression)) {
                let current = call.expression;
                while (ts.isPropertyAccessExpression(current)) {
                    if (ts.isIdentifier(current.name) && current.name.text === 'model') {
                        identifier = current.name;
                        break;
                    }
                    current = current.expression;
                }
                if (!identifier && ts.isIdentifier(current) && current.text === 'model') {
                    identifier = current;
                }
            }
            if (!identifier)
                continue;
            const imp = imports.getImportOfIdentifier(typeChecker, identifier);
            if (!imp || imp.importModule !== '@angular/core')
                continue;
            if (imp.name === 'model') {
                modelProperties.push(member);
            }
            else if (imp.name === 'output') {
                const name = member.name.text;
                outputProperties.set(name, member);
            }
        }
        for (const modelProp of modelProperties) {
            const modelName = modelProp.name.text;
            const expectedOutputName = `${modelName}Change`;
            if (outputProperties.has(expectedOutputName)) {
                const update = this.migrateModelProperty(modelProp, importManager, sourceFile);
                replacements.push(new project_paths.Replacement(project_paths.projectFile(sourceFile, info), update));
            }
        }
    }
    migrateModelProperty(modelProp, importManager, sourceFile) {
        const modelName = modelProp.name.text;
        const call = modelProp.initializer;
        const isRequired = ts.isPropertyAccessExpression(call.expression) && call.expression.name.text === 'required';
        const typeArgs = call.typeArguments
            ? `<${call.typeArguments.map((t) => t.getText()).join(', ')}>`
            : '';
        // Use input and linkedSignal
        importManager.addImport({
            exportModuleSpecifier: '@angular/core',
            exportSymbolName: 'input',
            requestedFile: sourceFile,
        });
        importManager.addImport({
            exportModuleSpecifier: '@angular/core',
            exportSymbolName: 'linkedSignal',
            requestedFile: sourceFile,
        });
        const inputName = `${modelName}Input`;
        const initialValue = isRequired ? undefined : (call.arguments[0]?.getText() ?? 'undefined');
        const optionsNode = isRequired ? call.arguments[0] : call.arguments[1];
        const aliasProperty = `alias: '${modelName}'`;
        let inputArgs;
        if (!optionsNode) {
            inputArgs = `{${aliasProperty}}`;
        }
        else if (ts.isObjectLiteralExpression(optionsNode)) {
            const hasAlias = optionsNode.properties.some((p) => {
                if (!ts.isPropertyAssignment(p) && !ts.isShorthandPropertyAssignment(p)) {
                    return false;
                }
                return (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) && p.name.text === 'alias';
            });
            if (hasAlias) {
                inputArgs = optionsNode.getText();
            }
            else {
                const optionsText = optionsNode.getText();
                const inner = optionsText.slice(1, -1).trim();
                inputArgs = `{${aliasProperty}${inner ? `, ${inner}` : ''}}`;
            }
        }
        else {
            inputArgs = `{${aliasProperty}, ...${optionsNode.getText()}}`;
        }
        if (initialValue !== undefined) {
            inputArgs = `${initialValue}, ${inputArgs}`;
        }
        const modifiers = modelProp.modifiers
            ? modelProp.modifiers.map((m) => m.getText()).join(' ') + ' '
            : '';
        // Detect indentation
        const { character } = sourceFile.getLineAndCharacterOfPosition(modelProp.getStart());
        const indent = sourceFile.text.substring(modelProp.getStart() - character, modelProp.getStart());
        const inputCall = isRequired ? 'input.required' : 'input';
        const newContent = `${modifiers}${inputName} = ${inputCall}${typeArgs}(${inputArgs});\n${indent}${modifiers}${modelName} = linkedSignal(this.${inputName});`;
        return new project_paths.TextUpdate({
            position: modelProp.getStart(),
            end: modelProp.getEnd(),
            toInsert: newContent,
        });
    }
    async combine(unitA, unitB) {
        return project_paths.confirmAsSerializable({
            replacements: [...unitA.replacements, ...unitB.replacements],
        });
    }
    async globalMeta(combinedData) {
        return project_paths.confirmAsSerializable({
            replacements: combinedData.replacements,
        });
    }
    async migrate(globalData) {
        return project_paths.confirmAsSerializable({
            replacements: globalData.replacements,
        });
    }
    async stats(globalMetadata) {
        return project_paths.confirmAsSerializable({});
    }
}

function migrate(options) {
    return async (tree, context) => {
        await project_paths.runMigrationInDevkit({
            tree,
            getMigration: (fs) => new ModelOutputMigration(),
        });
    };
}

exports.migrate = migrate;
