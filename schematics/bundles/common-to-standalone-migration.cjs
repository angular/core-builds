'use strict';
/**
 * @license Angular v21.0.0-next.8+sha-7d7b4be
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var ts = require('typescript');
require('os');
var project_tsconfig_paths = require('./project_tsconfig_paths-BsnCX6yC.cjs');
require('./index-254JQkzr.cjs');
require('path');
require('node:path');
var project_paths = require('./project_paths-CEdf9s9U.cjs');
var ng_component_template = require('./ng_component_template-CVjm_e4R.cjs');
var ng_decorators = require('./ng_decorators-BI0uV7KI.cjs');
var apply_import_manager = require('./apply_import_manager-D23Wjj1B.cjs');
var imports = require('./imports-DwPXlGFl.cjs');
require('@angular-devkit/core');
require('node:path/posix');
require('fs');
require('module');
require('url');
require('@angular-devkit/schematics');
require('./property_name-BBwFuqMe.cjs');

const commonModuleStr = 'CommonModule';
const angularCommonStr = '@angular/common';
const PATTERN_IMPORTS = [
    // Structural directives
    { pattern: /\*ngIf\b/g, imports: ['NgIf'] },
    { pattern: /\*ngFor\b/g, imports: ['NgFor'] },
    { pattern: /\[ngForOf]\b/g, imports: ['NgForOf'] },
    { pattern: /\[ngPlural\]/g, imports: ['NgPlural'] },
    // Match ngPluralCase as structural (*ngPluralCase) or attribute (ngPluralCase="value")
    { pattern: /(\*ngPluralCase\b|\s+ngPluralCase\s*=)/g, imports: ['NgPluralCase'] },
    // Match ngSwitchCase as structural (*ngSwitchCase) or attribute (ngSwitchCase="value")
    { pattern: /(\*ngSwitchCase\b|\s+ngSwitchCase\s*=)/g, imports: ['NgSwitchCase'] },
    // Match ngSwitchDefault as structural (*ngSwitchDefault) or standalone attribute (ngSwitchDefault>)
    { pattern: /(\*ngSwitchDefault\b|\s+ngSwitchDefault(?=\s*>))/g, imports: ['NgSwitchDefault'] },
    { pattern: /\[ngClass\]/g, imports: ['NgClass'] },
    { pattern: /\[ngStyle\]/g, imports: ['NgStyle'] },
    // Match ngSwitch as property binding [ngSwitch] or attribute ngSwitch="value"
    { pattern: /(\[ngSwitch\]|\s+ngSwitch\s*=)/g, imports: ['NgSwitch'] },
    { pattern: /\[ngTemplateOutlet\]/g, imports: ['NgTemplateOutlet'] },
    { pattern: /\[ngComponentOutlet\]/g, imports: ['NgComponentOutlet'] },
    // Common pipes
    { pattern: /\|\s*async\b/g, imports: ['AsyncPipe'] },
    { pattern: /\|\s*json\b/g, imports: ['JsonPipe'] },
    { pattern: /\|\s*date\b/g, imports: ['DatePipe'] },
    { pattern: /\|\s*currency\b/g, imports: ['CurrencyPipe'] },
    { pattern: /\|\s*number\b/g, imports: ['DecimalPipe'] },
    { pattern: /\|\s*percent\b/g, imports: ['PercentPipe'] },
    { pattern: /\|\s*lowercase\b/g, imports: ['LowerCasePipe'] },
    { pattern: /\|\s*uppercase\b/g, imports: ['UpperCasePipe'] },
    { pattern: /\|\s*titlecase\b/g, imports: ['TitleCasePipe'] },
    { pattern: /\|\s*slice\b/g, imports: ['SlicePipe'] },
    { pattern: /\|\s*keyvalue\b/g, imports: ['KeyValuePipe'] },
    { pattern: /\|\s*i18nPlural\b/g, imports: ['I18nPluralPipe'] },
    { pattern: /\|\s*i18nSelect\b/g, imports: ['I18nSelectPipe'] },
];
function analyzeTemplateWithRegex(template, neededImports) {
    PATTERN_IMPORTS.forEach(({ pattern, imports }) => {
        // Reset regex lastIndex to avoid state issues with global flag
        pattern.lastIndex = 0;
        if (pattern.test(template)) {
            imports.forEach((imp) => neededImports.add(imp));
        }
    });
}
function migrateCommonModuleUsage(template, componentNode, typeChecker) {
    const analysis = analyzeTemplateContent(template);
    const hasCommonModule = hasCommonModuleInImports(componentNode, typeChecker);
    return {
        migrated: template,
        changed: hasCommonModule,
        replacementCount: hasCommonModule ? 1 : 0,
        canRemoveCommonModule: hasCommonModule,
        neededImports: Array.from(analysis.neededImports),
    };
}
function createCommonModuleImportsArrayRemoval(classNode, file, typeChecker, neededImports) {
    const reflector = new project_tsconfig_paths.TypeScriptReflectionHost(typeChecker);
    const decorators = reflector.getDecoratorsOfDeclaration(classNode);
    if (!decorators) {
        return null;
    }
    const decorator = decorators.find((decorator) => decorator.name === 'Component');
    if (!decorator?.node) {
        return null;
    }
    const decoratorNode = decorator.node;
    if (!ts.isDecorator(decoratorNode) ||
        !ts.isCallExpression(decoratorNode.expression) ||
        decoratorNode.expression.arguments.length === 0 ||
        !ts.isObjectLiteralExpression(decoratorNode.expression.arguments[0])) {
        return null;
    }
    const metadata = decoratorNode.expression.arguments[0];
    const importsProperty = metadata.properties.find((p) => ts.isPropertyAssignment(p) && p.name?.getText() === 'imports');
    if (!importsProperty || !ts.isArrayLiteralExpression(importsProperty.initializer)) {
        return null;
    }
    const importsArray = importsProperty.initializer;
    const originalElements = importsArray.elements;
    const filteredElements = originalElements.filter((el) => {
        if (!ts.isIdentifier(el))
            return true;
        return !isCommonModuleFromAngularCommon(typeChecker, el);
    });
    const newElements = [
        ...filteredElements,
        ...neededImports.sort().map((imp) => ts.factory.createIdentifier(imp)),
    ];
    if (newElements.length === originalElements.length && neededImports.length === 0) {
        return null;
    }
    if (newElements.length === 0) {
        // For standalone components, keep imports: [] instead of removing the property entirely
        const printer = ts.createPrinter();
        const emptyArray = ts.factory.createArrayLiteralExpression([]);
        const newText = printer.printNode(ts.EmitHint.Unspecified, emptyArray, classNode.getSourceFile());
        return new project_paths.Replacement(file, new project_paths.TextUpdate({
            position: importsArray.getStart(),
            end: importsArray.getEnd(),
            toInsert: newText,
        }));
    }
    const printer = ts.createPrinter();
    const newArray = ts.factory.updateArrayLiteralExpression(importsArray, newElements);
    const newText = printer.printNode(ts.EmitHint.Unspecified, newArray, classNode.getSourceFile());
    return new project_paths.Replacement(file, new project_paths.TextUpdate({
        position: importsArray.getStart(),
        end: importsArray.getEnd(),
        toInsert: newText,
    }));
}
function analyzeTemplateContent(templateContent) {
    const neededImports = new Set();
    const errors = [];
    try {
        analyzeTemplateWithRegex(templateContent, neededImports);
    }
    catch (error) {
        errors.push(`Failed to analyze template: ${error}`);
    }
    return { neededImports, errors };
}
function hasCommonModuleInImports(componentNode, typeChecker) {
    // First check if there's a CommonModule in the imports array
    const reflector = new project_tsconfig_paths.TypeScriptReflectionHost(typeChecker);
    const decorators = reflector.getDecoratorsOfDeclaration(componentNode);
    if (!decorators) {
        return false;
    }
    const decorator = decorators.find((decorator) => decorator.name === 'Component');
    if (!decorator?.node) {
        return false;
    }
    const decoratorNode = decorator.node;
    if (!ts.isDecorator(decoratorNode) ||
        !ts.isCallExpression(decoratorNode.expression) ||
        decoratorNode.expression.arguments.length === 0 ||
        !ts.isObjectLiteralExpression(decoratorNode.expression.arguments[0])) {
        return false;
    }
    const metadata = decoratorNode.expression.arguments[0];
    const importsProperty = metadata.properties.find((p) => ts.isPropertyAssignment(p) && p.name?.getText() === 'imports');
    if (!importsProperty || !ts.isArrayLiteralExpression(importsProperty.initializer)) {
        return false;
    }
    const importsArray = importsProperty.initializer;
    return importsArray.elements.some((el) => {
        if (!ts.isIdentifier(el))
            return false;
        return isCommonModuleFromAngularCommon(typeChecker, el);
    });
}
function isCommonModuleFromAngularCommon(typeChecker, identifier) {
    const importInfo = imports.getImportOfIdentifier(typeChecker, identifier);
    return (importInfo !== null &&
        importInfo.name === commonModuleStr &&
        importInfo.importModule === angularCommonStr);
}
function processResolvedTemplate(template, componentNode, info, typeChecker, replacements, filesWithNeededImports) {
    const result = migrateCommonModuleUsage(template.content, componentNode, typeChecker);
    if (result.changed) {
        const sourceFile = componentNode.getSourceFile();
        const file = project_paths.projectFile(sourceFile, info);
        filesWithNeededImports.set(sourceFile.fileName, result.neededImports);
        const replacement = createCommonModuleImportsArrayRemoval(componentNode, file, typeChecker, result.neededImports);
        if (replacement) {
            replacements.push(replacement);
        }
        const importManager = new project_tsconfig_paths.ImportManager({
            shouldUseSingleQuotes: () => true,
        });
        // Always remove 'CommonModule' regardless of whether it's aliased or not
        // ImportManager handles removing the correct import specifier
        importManager.removeImport(sourceFile, commonModuleStr, angularCommonStr);
        if (result.neededImports.length > 0) {
            result.neededImports.forEach((importName) => {
                importManager.addImport({
                    exportSymbolName: importName,
                    exportModuleSpecifier: angularCommonStr,
                    requestedFile: sourceFile,
                });
            });
        }
        const importReplacements = [];
        apply_import_manager.applyImportManagerChanges(importManager, importReplacements, [sourceFile], info);
        replacements.push(...importReplacements);
    }
}

/**
 * Angular Common to Standalone migration.
 *
 * This migration converts standalone components and Angular modules from using
 * CommonModule to importing individual directives and pipes.
 */
class CommonToStandaloneMigration extends project_paths.TsurgeFunnelMigration {
    config;
    constructor(config = {}) {
        super();
        this.config = config;
    }
    async analyze(info) {
        const fileReplacements = [];
        const references = [];
        const filesWithNeededImports = new Map();
        for (const sf of info.sourceFiles) {
            const file = project_paths.projectFile(sf, info);
            if (this.config.shouldMigrate && !this.config.shouldMigrate(file)) {
                continue;
            }
            this.visitSourceFile(sf, info, fileReplacements, references, filesWithNeededImports);
        }
        return project_paths.confirmAsSerializable({
            replacements: fileReplacements,
            references,
            filesWithNeededImports,
        });
    }
    visitSourceFile(sourceFile, info, replacements, references, filesWithNeededImports) {
        const typeChecker = info.program.getTypeChecker();
        const visit = (node) => {
            const hasNode = ts.isClassDeclaration(node) && node.name;
            if (!hasNode) {
                ts.forEachChild(node, visit);
                return;
            }
            const nodeDecorators = ts.getDecorators(node);
            if (!nodeDecorators) {
                ts.forEachChild(node, visit);
                return;
            }
            const decorators = ng_decorators.getAngularDecorators(typeChecker, nodeDecorators);
            const hasComponentDecorator = decorators.some((d) => d.name === 'Component');
            if (!hasComponentDecorator) {
                return;
            }
            const ref = this.analyzeClass(node, typeChecker);
            if (!ref) {
                return;
            }
            references.push(ref);
            const templateVisitor = new ng_component_template.NgComponentTemplateVisitor(typeChecker);
            templateVisitor.visitNode(node);
            for (const template of templateVisitor.resolvedTemplates) {
                processResolvedTemplate(template, node, info, typeChecker, replacements, filesWithNeededImports);
            }
            // Component has CommonModule in imports but no template content to analyze
            // We still need to process these cases to remove unused CommonModule imports
            if (templateVisitor.resolvedTemplates.length === 0) {
                processResolvedTemplate({ content: ''}, node, info, typeChecker, replacements, filesWithNeededImports);
            }
            ts.forEachChild(node, visit);
        };
        visit(sourceFile);
    }
    analyzeClass(node, typeChecker) {
        const nodeDecorators = ts.getDecorators(node);
        if (!nodeDecorators)
            return null;
        const decorators = ng_decorators.getAngularDecorators(typeChecker, nodeDecorators);
        // Only process Component decorators, not Directive or other Angular decorators
        for (const decorator of decorators) {
            if (decorator.name === 'Component') {
                return this.analyzeComponentDecorator(node, decorator, typeChecker);
            }
        }
        return null;
    }
    analyzeComponentDecorator(node, decorator, typeChecker) {
        const decoratorNode = decorator.node;
        if (!ts.isCallExpression(decoratorNode.expression)) {
            return null;
        }
        const config = decoratorNode.expression.arguments[0];
        if (!ts.isObjectLiteralExpression(config)) {
            return null;
        }
        if (hasCommonModuleInImports(node, typeChecker)) {
            return { node };
        }
        return null;
    }
    async combine(unitA, unitB) {
        const combinedFilesWithNeededImports = new Map(unitA.filesWithNeededImports);
        for (const [fileName, imports] of unitB.filesWithNeededImports) {
            if (combinedFilesWithNeededImports.has(fileName)) {
                const existingImports = combinedFilesWithNeededImports.get(fileName) || [];
                const mergedImports = Array.from(new Set([...existingImports, ...imports]));
                combinedFilesWithNeededImports.set(fileName, mergedImports);
            }
            else {
                combinedFilesWithNeededImports.set(fileName, imports);
            }
        }
        return project_paths.confirmAsSerializable({
            replacements: [...unitA.replacements, ...unitB.replacements],
            references: [...unitA.references, ...unitB.references],
            filesWithNeededImports: combinedFilesWithNeededImports,
        });
    }
    async globalMeta(combinedData) {
        return project_paths.confirmAsSerializable(combinedData);
    }
    async stats(globalMetadata) {
        const stats = {
            counters: {
                replacements: globalMetadata.replacements.length,
                references: globalMetadata.references.length,
            },
        };
        return stats;
    }
    async migrate(globalData) {
        return {
            replacements: globalData.replacements,
        };
    }
}

function migrate(options) {
    return async (tree, context) => {
        await project_paths.runMigrationInDevkit({
            tree,
            getMigration: (fs) => new CommonToStandaloneMigration({
                shouldMigrate: (file) => {
                    return (file.rootRelativePath.startsWith(fs.normalize(options.path)) &&
                        !/(^|\/)node_modules\//.test(file.rootRelativePath));
                },
            }),
            beforeProgramCreation: (tsconfigPath, stage) => {
                if (stage === project_paths.MigrationStage.Analysis) {
                    context.logger.info(`Preparing analysis for: ${tsconfigPath}...`);
                }
                else {
                    context.logger.info(`Running migration for: ${tsconfigPath}...`);
                }
            },
            beforeUnitAnalysis: (tsconfigPath) => {
                context.logger.info(`Scanning for CommonModule usage: ${tsconfigPath}...`);
            },
            afterAllAnalyzed: () => {
                context.logger.info(``);
                context.logger.info(`Processing analysis data between targets...`);
                context.logger.info(``);
            },
            afterAnalysisFailure: () => {
                context.logger.error('Migration failed unexpectedly with no analysis data');
            },
            whenDone: (stats) => {
                context.logger.info('');
                context.logger.info(`Successfully migrated CommonModule to standalone imports 🎉`);
                context.logger.info(`  -> Migrated ${stats.counters.replacements} CommonModule references affecting ${stats.counters.references} components.`);
            },
        });
    };
}

exports.migrate = migrate;
