'use strict';
/**
 * @license Angular v21.0.0-next.3+sha-1352fbd
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var ts = require('typescript');
require('os');
var project_tsconfig_paths = require('./project_tsconfig_paths-Bkx6zyd-.cjs');
require('./index-BlB9uKd8.cjs');
require('path');
require('node:path');
var project_paths = require('./project_paths-DHb3CiJv.cjs');
var apply_import_manager = require('./apply_import_manager-elRnCekE.cjs');
var imports = require('./imports-26VeX8i-.cjs');
var parse_html = require('./parse_html-Bp1a87ts.cjs');
var ng_component_template = require('./ng_component_template-C8lCq-Y7.cjs');
require('@angular-devkit/core');
require('node:path/posix');
require('fs');
require('module');
require('url');
require('@angular-devkit/schematics');
require('./ng_decorators-CtYwz9Lw.cjs');
require('./property_name-BBwFuqMe.cjs');

const ngStyleStr = 'NgStyle';
const commonModuleStr = '@angular/common';
const commonModuleImportsStr = 'CommonModule';
function migrateNgStyleBindings(template, config, componentNode, typeChecker) {
    const parsed = parse_html.parseTemplate(template);
    if (!parsed.tree || !parsed.tree.rootNodes.length) {
        return { migrated: template, changed: false, replacementCount: 0, canRemoveCommonModule: false };
    }
    const visitor = new NgStyleCollector(template, componentNode, typeChecker);
    project_tsconfig_paths.visitAll$1(visitor, parsed.tree.rootNodes, config);
    let newTemplate = template;
    let changedOffset = 0;
    let replacementCount = 0;
    for (const { start, end, replacement } of visitor.replacements) {
        const currentLength = newTemplate.length;
        newTemplate = replaceTemplate(newTemplate, replacement, start, end, changedOffset);
        changedOffset += newTemplate.length - currentLength;
        replacementCount++;
    }
    const changed = newTemplate !== template;
    return {
        migrated: newTemplate,
        changed,
        replacementCount,
        canRemoveCommonModule: changed ? parse_html.canRemoveCommonModule(newTemplate) : false,
    };
}
/**
 * Creates a Replacement to remove `NgStyle` from a component's `imports` array.
 * Uses ReflectionHost + PartialEvaluator for robust AST analysis.
 */
function createNgStyleImportsArrayRemoval(classNode, file, typeChecker, removeCommonModule) {
    const reflector = new project_tsconfig_paths.TypeScriptReflectionHost(typeChecker);
    const decorators = reflector.getDecoratorsOfDeclaration(classNode);
    if (!decorators) {
        return null;
    }
    const componentDecorator = decorators.find((decorator) => decorator.name === 'Component');
    if (!componentDecorator?.node) {
        return null;
    }
    const decoratorNode = componentDecorator.node;
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
    const elementsToRemove = new Set([ngStyleStr]);
    if (removeCommonModule) {
        elementsToRemove.add(commonModuleImportsStr);
    }
    const originalElements = importsArray.elements;
    const filteredElements = originalElements.filter((el) => !ts.isIdentifier(el) || !elementsToRemove.has(el.text));
    if (filteredElements.length === originalElements.length) {
        return null; // No changes needed.
    }
    // If the array becomes empty, remove the entire `imports` property.
    if (filteredElements.length === 0) {
        const removalRange = getPropertyRemovalRange(importsProperty);
        return new project_paths.Replacement(file, new project_paths.TextUpdate({
            position: removalRange.start,
            end: removalRange.end,
            toInsert: '',
        }));
    }
    const printer = ts.createPrinter();
    const newArray = ts.factory.updateArrayLiteralExpression(importsArray, filteredElements);
    const newText = printer.printNode(ts.EmitHint.Unspecified, newArray, classNode.getSourceFile());
    return new project_paths.Replacement(file, new project_paths.TextUpdate({
        position: importsArray.getStart(),
        end: importsArray.getEnd(),
        toInsert: newText,
    }));
}
/**
 * Calculates the removal range for a property in an object literal,
 * including the trailing comma if it's not the last property.
 */
function getPropertyRemovalRange(property) {
    const parent = property.parent;
    if (!ts.isObjectLiteralExpression(parent)) {
        return { start: property.getStart(), end: property.getEnd() };
    }
    const properties = parent.properties;
    const propertyIndex = properties.indexOf(property);
    const end = property.getEnd();
    if (propertyIndex < properties.length - 1) {
        const nextProperty = properties[propertyIndex + 1];
        return { start: property.getStart(), end: nextProperty.getStart() };
    }
    return { start: property.getStart(), end };
}
function calculateImportReplacements(info, sourceFiles, filesToRemoveCommonModule) {
    const importReplacements = {};
    const importManager = new project_tsconfig_paths.ImportManager();
    for (const sf of sourceFiles) {
        const file = project_paths.projectFile(sf, info);
        // Always remove NgStyle if it's imported directly.
        importManager.removeImport(sf, ngStyleStr, commonModuleStr);
        // Conditionally remove CommonModule if it's no longer needed.
        if (filesToRemoveCommonModule.has(file.id)) {
            importManager.removeImport(sf, commonModuleImportsStr, commonModuleStr);
        }
        const addRemove = [];
        apply_import_manager.applyImportManagerChanges(importManager, addRemove, [sf], info);
        if (addRemove.length > 0) {
            importReplacements[file.id] = {
                add: [],
                addAndRemove: addRemove,
            };
        }
    }
    return importReplacements;
}
function replaceTemplate(template, replaceValue, start, end, offset) {
    return template.slice(0, start + offset) + replaceValue + template.slice(end + offset);
}
/**
 * Visitor class that scans Angular templates and collects replacements
 * for [ngStyle] bindings that use static object literals.
 */
class NgStyleCollector extends project_tsconfig_paths.RecursiveVisitor$1 {
    originalTemplate;
    replacements = [];
    isNgStyleImported = true; // Default to true (permissive)
    constructor(originalTemplate, componentNode, typeChecker) {
        super();
        this.originalTemplate = originalTemplate;
        // If we have enough information, check if NgStyle is actually imported.
        // If not, we can confidently disable the migration for this component.
        if (componentNode && typeChecker) {
            const imports$1 = imports.getImportSpecifiers(componentNode.getSourceFile(), commonModuleStr, [
                ngStyleStr,
                commonModuleImportsStr,
            ]);
            if (imports$1.length === 0) {
                this.isNgStyleImported = false;
            }
        }
    }
    visitElement(element, config) {
        // If NgStyle is not imported, do not attempt to migrate.
        if (!this.isNgStyleImported) {
            return;
        }
        for (const attr of element.attrs) {
            if (attr.name !== '[ngStyle]' && attr.name !== 'ngStyle') {
                continue;
            }
            if (attr.name === '[ngStyle]' && attr.valueSpan) {
                const expr = this.originalTemplate.slice(attr.valueSpan.start.offset, attr.valueSpan.end.offset);
                const staticMatch = parseStaticObjectLiteral(expr);
                if (staticMatch === null) {
                    if (config.bestEffortMode && !isObjectLiteralSyntax(expr.trim())) {
                        const keyReplacement = this.originalTemplate
                            .slice(attr.sourceSpan.start.offset, attr.valueSpan.start.offset)
                            .replace('[ngStyle]', '[style]');
                        this.replacements.push({
                            start: attr.sourceSpan.start.offset,
                            end: attr.valueSpan.start.offset,
                            replacement: keyReplacement,
                        });
                    }
                    continue;
                }
                let replacement;
                if (staticMatch.length === 0) {
                    replacement = '';
                }
                else if (staticMatch.length === 1) {
                    const { key, value } = staticMatch[0];
                    // Special case: If the key is an empty string, use [style]=""
                    if (key === '') {
                        replacement = '';
                    }
                    else {
                        // Normal single condition: use [style.styleName]="condition"
                        replacement = `[style.${key}]="${value}"`;
                    }
                }
                else {
                    replacement = `[style]="${expr}"`;
                }
                this.replacements.push({
                    start: attr.sourceSpan.start.offset,
                    end: attr.sourceSpan.end.offset,
                    replacement,
                });
                continue;
            }
            if (attr.name === 'ngStyle' && attr.value) {
                this.replacements.push({
                    start: attr.sourceSpan.start.offset,
                    end: attr.sourceSpan.end.offset,
                    replacement: `style="${attr.value}"`,
                });
            }
        }
        return super.visitElement(element, config);
    }
}
function parseStaticObjectLiteral(expr) {
    const trimmedExpr = expr.trim();
    if (trimmedExpr === '{}' || trimmedExpr === '[]') {
        return [];
    }
    if (!isObjectLiteralSyntax(trimmedExpr)) {
        return null;
    }
    const objectLiteral = parseAsObjectLiteral(trimmedExpr);
    if (!objectLiteral) {
        return null;
    }
    return extractStyleBindings(objectLiteral);
}
/**
 * Validates basic object literal syntax
 */
function isObjectLiteralSyntax(expr) {
    return expr.startsWith('{') && expr.endsWith('}');
}
/**
 * Parses expression as TypeScript object literal
 */
function parseAsObjectLiteral(expr) {
    const sourceFile = ts.createSourceFile('temp.ts', `const obj = ${expr}`, ts.ScriptTarget.Latest, true);
    const variableStatement = sourceFile.statements[0];
    if (!ts.isVariableStatement(variableStatement)) {
        return null;
    }
    const declaration = variableStatement.declarationList.declarations[0];
    if (!declaration.initializer || !ts.isObjectLiteralExpression(declaration.initializer)) {
        return null;
    }
    return declaration.initializer;
}
function extractStyleBindings(objectLiteral) {
    const result = [];
    for (const property of objectLiteral.properties) {
        if (ts.isShorthandPropertyAssignment(property)) {
            return null;
        }
        else if (ts.isPropertyAssignment(property)) {
            const keyText = extractPropertyKey(property.name);
            const valueText = extractPropertyValue(property.initializer);
            if (keyText === '' && valueText) {
                result.push({ key: '', value: valueText });
                continue;
            }
            if (!keyText || !valueText) {
                return null;
            }
            result.push({ key: keyText, value: valueText });
        }
        else {
            return null;
        }
    }
    return result;
}
/**
 * Extracts text from property key (name)
 */
function extractPropertyKey(name) {
    if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
        return name.text;
    }
    return null;
}
/**
 * Extracts text from property value
 */
function extractPropertyValue(initializer) {
    // String literals: 'value' or "value"
    if (ts.isStringLiteral(initializer)) {
        return `'${initializer.text}'`;
    }
    // Numeric literals: 42, 3.14
    if (ts.isNumericLiteral(initializer) || ts.isIdentifier(initializer)) {
        return initializer.text;
    }
    // Boolean and null keywords
    if (initializer.kind === ts.SyntaxKind.TrueKeyword) {
        return 'true';
    }
    if (initializer.kind === ts.SyntaxKind.FalseKeyword) {
        return 'false';
    }
    if (initializer.kind === ts.SyntaxKind.NullKeyword) {
        return 'null';
    }
    return initializer.getText();
}

class NgStyleMigration extends project_paths.TsurgeFunnelMigration {
    config;
    constructor(config = {}) {
        super();
        this.config = config;
    }
    processTemplate(template, node, file, info, typeChecker) {
        const { migrated, changed, replacementCount, canRemoveCommonModule } = migrateNgStyleBindings(template.content, this.config, node, typeChecker);
        if (!changed) {
            return null;
        }
        const fileToMigrate = template.inline
            ? file
            : project_paths.projectFile(template.filePath, info);
        const end = template.start + template.content.length;
        return {
            replacements: [prepareTextReplacement(fileToMigrate, migrated, template.start, end)],
            replacementCount,
            canRemoveCommonModule,
        };
    }
    async analyze(info) {
        const { sourceFiles, program } = info;
        const typeChecker = program.getTypeChecker();
        const ngStyleReplacements = [];
        const filesWithNgStyleDeclarations = new Set();
        const filesToRemoveCommonModule = new Set();
        for (const sf of sourceFiles) {
            ts.forEachChild(sf, (node) => {
                if (!ts.isClassDeclaration(node)) {
                    return;
                }
                const file = project_paths.projectFile(sf, info);
                if (this.config.shouldMigrate && !this.config.shouldMigrate(file)) {
                    return;
                }
                const templateVisitor = new ng_component_template.NgComponentTemplateVisitor(typeChecker);
                templateVisitor.visitNode(node);
                const replacementsForStyle = [];
                let replacementCountForStyle = 0;
                let canRemoveCommonModuleForFile = true;
                for (const template of templateVisitor.resolvedTemplates) {
                    const result = this.processTemplate(template, node, file, info, typeChecker);
                    if (result) {
                        replacementsForStyle.push(...result.replacements);
                        replacementCountForStyle += result.replacementCount;
                        if (!result.canRemoveCommonModule) {
                            canRemoveCommonModuleForFile = false;
                        }
                    }
                }
                if (replacementsForStyle.length > 0) {
                    if (canRemoveCommonModuleForFile) {
                        filesToRemoveCommonModule.add(file.id);
                    }
                    // Handle the `@Component({ imports: [...] })` array.
                    const importsRemoval = createNgStyleImportsArrayRemoval(node, file, typeChecker, canRemoveCommonModuleForFile);
                    if (importsRemoval) {
                        replacementsForStyle.push(importsRemoval);
                    }
                    ngStyleReplacements.push({
                        file,
                        replacementCount: replacementCountForStyle,
                        replacements: replacementsForStyle,
                    });
                    filesWithNgStyleDeclarations.add(sf);
                }
            });
        }
        const importReplacements = calculateImportReplacements(info, filesWithNgStyleDeclarations, filesToRemoveCommonModule);
        return project_paths.confirmAsSerializable({
            ngStyleReplacements,
            importReplacements,
        });
    }
    async combine(unitA, unitB) {
        const importReplacements = {};
        for (const unit of [unitA, unitB]) {
            for (const fileIDStr of Object.keys(unit.importReplacements)) {
                const fileID = fileIDStr;
                importReplacements[fileID] = unit.importReplacements[fileID];
            }
        }
        return project_paths.confirmAsSerializable({
            ngStyleReplacements: [...unitA.ngStyleReplacements, ...unitB.ngStyleReplacements],
            importReplacements,
        });
    }
    async globalMeta(combinedData) {
        return project_paths.confirmAsSerializable({
            ngStyleReplacements: combinedData.ngStyleReplacements,
            importReplacements: combinedData.importReplacements,
        });
    }
    async stats(globalMetadata) {
        const touchedFilesCount = globalMetadata.ngStyleReplacements.length;
        const replacementCount = globalMetadata.ngStyleReplacements.reduce((acc, cur) => acc + cur.replacementCount, 0);
        return project_paths.confirmAsSerializable({
            touchedFilesCount,
            replacementCount,
        });
    }
    async migrate(globalData) {
        const replacements = [];
        replacements.push(...globalData.ngStyleReplacements.flatMap(({ replacements }) => replacements));
        for (const fileIDStr of Object.keys(globalData.importReplacements)) {
            const fileID = fileIDStr;
            const importReplacements = globalData.importReplacements[fileID];
            replacements.push(...importReplacements.addAndRemove);
        }
        return { replacements };
    }
}
function prepareTextReplacement(file, replacement, start, end) {
    return new project_paths.Replacement(file, new project_paths.TextUpdate({
        position: start,
        end: end,
        toInsert: replacement,
    }));
}

function migrate(options) {
    return async (tree, context) => {
        await project_paths.runMigrationInDevkit({
            tree,
            getMigration: (fs) => new NgStyleMigration({
                bestEffortMode: options.bestEffortMode,
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
                context.logger.info(`Scanning for component tags: ${tsconfigPath}...`);
            },
            afterAllAnalyzed: () => {
                context.logger.info(``);
                context.logger.info(`Processing analysis data between targets...`);
                context.logger.info(``);
            },
            afterAnalysisFailure: () => {
                context.logger.error('Migration failed unexpectedly with no analysis data');
            },
            whenDone: ({ touchedFilesCount, replacementCount, }) => {
                context.logger.info('');
                context.logger.info(`Successfully migrated to style bindings from ngStyle 🎉`);
                context.logger.info(`  -> Migrated ${replacementCount} ngStyle to style bindings in ${touchedFilesCount} files.`);
            },
        });
    };
}

exports.migrate = migrate;
