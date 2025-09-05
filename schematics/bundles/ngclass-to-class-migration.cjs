'use strict';
/**
 * @license Angular v21.0.0-next.2+sha-f560536
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var ts = require('typescript');
require('os');
var project_tsconfig_paths = require('./project_tsconfig_paths-DZ17BWwk.cjs');
var index = require('./index-B6-f9bil.cjs');
require('path');
require('node:path');
var project_paths = require('./project_paths-D64fJzoa.cjs');
var apply_import_manager = require('./apply_import_manager-B3czqUhF.cjs');
var imports = require('./imports-26VeX8i-.cjs');
var parse_html = require('./parse_html-C8TYlOyu.cjs');
var ng_component_template = require('./ng_component_template-DUAg-x1h.cjs');
require('@angular-devkit/core');
require('node:path/posix');
require('fs');
require('module');
require('url');
require('@angular-devkit/schematics');
require('./ng_decorators-CtYwz9Lw.cjs');
require('./property_name-BBwFuqMe.cjs');

const ngClassStr = 'NgClass';
const commonModuleStr = '@angular/common';
const commonModuleImportsStr = 'CommonModule';
function migrateNgClassBindings(template, config, componentNode, typeChecker) {
    const parsed = parse_html.parseTemplate(template);
    if (!parsed.tree || !parsed.tree.rootNodes.length) {
        return { migrated: template, changed: false, replacementCount: 0 };
    }
    const visitor = new NgClassCollector(template, componentNode, typeChecker);
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
    return { migrated: newTemplate, changed: newTemplate !== template, replacementCount };
}
/**
 * Creates a Replacement to remove `NgClass` from a component's `imports` array.
 * Uses ReflectionHost + PartialEvaluator for robust AST analysis.
 */
function createNgClassImportsArrayRemoval(classNode, file, typeChecker) {
    const reflector = new project_tsconfig_paths.TypeScriptReflectionHost(typeChecker);
    const evaluator = new index.PartialEvaluator(reflector, typeChecker, null);
    // Use ReflectionHost to get decorators instead of manual AST traversal
    const decorators = reflector.getDecoratorsOfDeclaration(classNode);
    if (!decorators) {
        return null;
    }
    // Find @Component decorator using ReflectionHost
    const componentDecorator = decorators.find((decorator) => decorator.name === 'Component');
    if (!componentDecorator || !componentDecorator.args || componentDecorator.args.length === 0) {
        return null;
    }
    // Use PartialEvaluator to evaluate the decorator metadata
    const decoratorMetadata = evaluator.evaluate(componentDecorator.args[0]);
    if (!decoratorMetadata || typeof decoratorMetadata !== 'object') {
        return null;
    }
    // Get the actual AST node for the imports property
    const componentDecoratorNode = componentDecorator.node;
    if (!ts.isDecorator(componentDecoratorNode) ||
        !ts.isCallExpression(componentDecoratorNode.expression) ||
        !ts.isObjectLiteralExpression(componentDecoratorNode.expression.arguments[0])) {
        return null;
    }
    const objLiteral = componentDecoratorNode.expression.arguments[0];
    const importsProperty = objLiteral.properties.find((p) => ts.isPropertyAssignment(p) &&
        p.name.getText() === 'imports' &&
        ts.isArrayLiteralExpression(p.initializer));
    if (!importsProperty || !ts.isArrayLiteralExpression(importsProperty.initializer)) {
        return null;
    }
    const importsArray = importsProperty.initializer;
    const ngClassIndex = importsArray.elements.findIndex((e) => ts.isIdentifier(e) && e.text === ngClassStr);
    if (ngClassIndex === -1) {
        return null;
    }
    const elements = importsArray.elements;
    const ngClassElement = elements[ngClassIndex];
    const range = getNgClassRemovalRange(importsProperty, importsArray, ngClassElement, classNode.getSourceFile());
    return new project_paths.Replacement(file, new project_paths.TextUpdate({ position: range.start, end: range.end, toInsert: '' }));
}
function getElementRemovalRange(elementNode, sourceFile) {
    const parent = elementNode.parent;
    // Check if in array context (imports: [..]) or object context (@Component({..}))
    const isArrayLiteralExpression = ts.isArrayLiteralExpression(parent);
    const isObjectLiteralExpression = ts.isObjectLiteralExpression(parent);
    let elements;
    if (isArrayLiteralExpression) {
        elements = parent.elements;
    }
    else if (isObjectLiteralExpression) {
        elements = parent.properties;
    }
    else {
        return { start: elementNode.getStart(sourceFile), end: elementNode.getEnd() };
    }
    const elementIndex = elements.indexOf(elementNode);
    const isLastElement = elementIndex === elements.length - 1;
    if (isLastElement) {
        // If this is the LAST element, the range is from the END of the previous element
        // to the END of this element. This captures the comma and space preceding it.
        // Ex: `[a, b]` -> remove `, b`
        const start = elementIndex > 0 ? elements[elementIndex - 1].getEnd() : elementNode.getStart(sourceFile); // If it is also the first (only) element, there is no comma before it.
        return { start: start, end: elementNode.getEnd() };
    }
    else {
        // If it's the FIRST or MIDDLE element, the range goes from the BEGINNING of this element
        // to the BEGINNING of the next one. This captures the element itself and the comma that FOLLOWS it.
        // Ex: `[a, b]` -> remove `a,`
        const nextElement = elements[elementIndex + 1];
        return {
            start: elementNode.getStart(sourceFile),
            end: nextElement.getStart(sourceFile),
        };
    }
}
/**
 * If there is more than one import, it affects the NgClass element within the array.
 * Otherwise, `NgClass` is the only import. The removal affects the entire `imports: [...]` property.
 */
function getNgClassRemovalRange(importsProperty, importsArray, ngClassElement, sourceFile) {
    if (importsArray.elements.length > 1) {
        return getElementRemovalRange(ngClassElement, sourceFile);
    }
    else {
        return getElementRemovalRange(importsProperty, sourceFile);
    }
}
function calculateImportReplacements(info, sourceFiles) {
    const importReplacements = {};
    const importManager = new project_tsconfig_paths.ImportManager();
    for (const sf of sourceFiles) {
        const file = project_paths.projectFile(sf, info);
        importManager.removeImport(sf, ngClassStr, commonModuleStr);
        const addRemove = [];
        apply_import_manager.applyImportManagerChanges(importManager, addRemove, [sf], info);
        importReplacements[file.id] = {
            add: [],
            addAndRemove: addRemove,
        };
    }
    return importReplacements;
}
function replaceTemplate(template, replaceValue, start, end, offset) {
    return template.slice(0, start + offset) + replaceValue + template.slice(end + offset);
}
/**
 * Visitor class that scans Angular templates and collects replacements
 * for [ngClass] bindings that use static object literals.
 */
class NgClassCollector extends project_tsconfig_paths.RecursiveVisitor$1 {
    componentNode;
    typeChecker;
    replacements = [];
    originalTemplate;
    isNgClassImported = true; // Default to true (permissive)
    constructor(template, componentNode, typeChecker) {
        super();
        this.componentNode = componentNode;
        this.typeChecker = typeChecker;
        this.originalTemplate = template;
        // If we have enough information, check if NgClass is actually imported.
        // If not, we can confidently disable the migration for this component.
        if (componentNode && typeChecker) {
            const imports$1 = imports.getImportSpecifiers(componentNode.getSourceFile(), commonModuleStr, [
                ngClassStr,
                commonModuleImportsStr,
            ]);
            if (imports$1.length === 0) {
                this.isNgClassImported = false;
            }
        }
    }
    visitElement(element, config) {
        // If NgClass is not imported, do not attempt to migrate.
        if (!this.isNgClassImported) {
            return;
        }
        for (const attr of element.attrs) {
            if (attr.name === '[ngClass]' && attr.valueSpan) {
                const expr = this.originalTemplate.slice(attr.valueSpan.start.offset, attr.valueSpan.end.offset);
                const staticMatch = tryParseStaticObjectLiteral(expr);
                if (staticMatch === null) {
                    continue;
                }
                let replacement;
                if (staticMatch.length === 0) {
                    replacement = '[class]=""';
                }
                else if (staticMatch.length === 1) {
                    const { key, value } = staticMatch[0];
                    // Special case: If the key is an empty string, use [class]=""
                    if (key === '') {
                        replacement = '[class]=""';
                    }
                    else {
                        // Normal single condition: use [class.className]="condition"
                        replacement = `[class.${key}]="${value}"`;
                    }
                }
                else {
                    // Check if all entries have the same value (condition)
                    const allSameValue = staticMatch.every((entry) => entry.value === staticMatch[0].value);
                    if (allSameValue &&
                        staticMatch.length > 1 &&
                        // Check if this was originally a single key with multiple classes
                        expr.includes('{') &&
                        expr.includes('}') &&
                        expr.split(':').length === 2) {
                        // Multiple classes with the same condition: use [class.class1]="condition" [class.class2]="condition"
                        if (config.migrateSpaceSeparatedKey) {
                            replacement = staticMatch
                                .map(({ key, value }) => `[class.${key}]="${value}"`)
                                .join(' ');
                        }
                        else {
                            continue;
                        }
                    }
                    else {
                        // Multiple conditions with different values: use [class]="{'class1': condition1, 'class2': condition2}"
                        replacement = `[class]="${expr}"`;
                    }
                }
                this.replacements.push({
                    start: attr.sourceSpan.start.offset,
                    end: attr.sourceSpan.end.offset,
                    replacement,
                });
                continue;
            }
            if (attr.name === 'ngClass' && attr.value) {
                this.replacements.push({
                    start: attr.sourceSpan.start.offset,
                    end: attr.sourceSpan.end.offset,
                    replacement: `class="${attr.value}"`,
                });
            }
        }
        return super.visitElement(element, config);
    }
}
function tryParseStaticObjectLiteral(expr) {
    const trimmedExpr = expr.trim();
    if (trimmedExpr === '{}' || trimmedExpr === '[]') {
        return [];
    }
    if (!isObjectLiteralSyntax(trimmedExpr)) {
        return null;
    }
    try {
        const objectLiteral = parseAsObjectLiteral(trimmedExpr);
        if (!objectLiteral) {
            return null;
        }
        return extractClassBindings(objectLiteral);
    }
    catch {
        return null;
    }
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
    try {
        const sourceFile = ts.createSourceFile('temp.ts', `const obj = ${expr}`, ts.ScriptTarget.Latest, true);
        const variableStatement = sourceFile.statements[0];
        if (!ts.isVariableStatement(variableStatement)) {
            return null;
        }
        const declaration = variableStatement.declarationList.declarations[0];
        if (!declaration.initializer || !ts.isObjectLiteralExpression(declaration.initializer)) {
            return null;
        }
        // Manage invalid syntax ngClass="{class1 class2}"
        const content = expr.slice(1, -1).trim();
        if (content && !content.includes(':') && content.includes(' ') && !content.includes(',')) {
            return null;
        }
        return declaration.initializer;
    }
    catch (error) {
        return null;
    }
}
/**
 * Extracts class bindings from object literal properties
 */
function extractClassBindings(objectLiteral) {
    const result = [];
    for (const property of objectLiteral.properties) {
        if (ts.isShorthandPropertyAssignment(property)) {
            const key = property.name.getText();
            if (key.includes(' ')) {
                return null;
            }
            result.push({ key, value: key });
        }
        else if (ts.isPropertyAssignment(property)) {
            const keyText = extractPropertyKey(property.name);
            const valueText = extractPropertyValue(property.initializer);
            if (keyText === '' && valueText) {
                result.push({ key: '', value: valueText });
            }
            else {
                if (!keyText || !valueText) {
                    return null;
                }
                // Handle multiple CSS classes in single key (e.g., 'class1 class2': condition)
                const classNames = keyText.split(/\s+/).filter(Boolean);
                for (const className of classNames) {
                    result.push({ key: className, value: valueText });
                }
            }
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
    if (ts.isIdentifier(name)) {
        return name.text;
    }
    if (ts.isStringLiteral(name)) {
        return name.text;
    }
    if (ts.isNumericLiteral(name)) {
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
    if (ts.isNumericLiteral(initializer)) {
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
    // Identifiers: isActive, condition, etc.
    if (ts.isIdentifier(initializer)) {
        return initializer.text;
    }
    return initializer.getText();
}

class NgClassMigration extends project_paths.TsurgeFunnelMigration {
    config;
    constructor(config = {}) {
        super();
        this.config = config;
    }
    async analyze(info) {
        const { sourceFiles, program } = info;
        const typeChecker = program.getTypeChecker();
        const ngClassReplacements = [];
        const filesWithNgClassDeclarations = new Set();
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
                const replacementsForClass = [];
                let replacementCountForClass = 0;
                templateVisitor.resolvedTemplates.forEach((template) => {
                    const { migrated, changed, replacementCount } = migrateNgClassBindings(template.content, this.config, node, typeChecker);
                    if (!changed) {
                        return;
                    }
                    replacementCountForClass += replacementCount;
                    const fileToMigrate = template.inline
                        ? file
                        : project_paths.projectFile(template.filePath, info);
                    const end = template.start + template.content.length;
                    replacementsForClass.push(prepareTextReplacement(fileToMigrate, migrated, template.start, end));
                });
                if (replacementCountForClass === 0) {
                    return;
                }
                filesWithNgClassDeclarations.add(sf);
                const importArrayRemoval = createNgClassImportsArrayRemoval(node, file, typeChecker);
                if (importArrayRemoval) {
                    replacementsForClass.push(importArrayRemoval);
                }
                const existing = ngClassReplacements.find((entry) => entry.file === file);
                if (existing) {
                    existing.replacements.push(...replacementsForClass);
                    existing.replacementCount += replacementCountForClass;
                }
                else {
                    ngClassReplacements.push({
                        file,
                        replacements: replacementsForClass,
                        replacementCount: replacementCountForClass,
                    });
                }
            });
        }
        const importReplacements = calculateImportReplacements(info, filesWithNgClassDeclarations);
        return project_paths.confirmAsSerializable({ ngClassReplacements, importReplacements });
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
            ngClassReplacements: [...unitA.ngClassReplacements, ...unitB.ngClassReplacements],
            importReplacements,
        });
    }
    async globalMeta(combinedData) {
        return project_paths.confirmAsSerializable({
            ngClassReplacements: combinedData.ngClassReplacements,
            importReplacements: combinedData.importReplacements,
        });
    }
    async stats(globalMetadata) {
        const touchedFilesCount = globalMetadata.ngClassReplacements.length;
        const replacementCount = globalMetadata.ngClassReplacements.reduce((acc, cur) => acc + cur.replacementCount, 0);
        return project_paths.confirmAsSerializable({
            touchedFilesCount,
            replacementCount,
        });
    }
    async migrate(globalData) {
        const replacements = [];
        replacements.push(...globalData.ngClassReplacements.flatMap(({ replacements }) => replacements));
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
            getMigration: (fs) => new NgClassMigration({
                migrateSpaceSeparatedKey: options.migrateSpaceSeparatedKey,
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
                context.logger.info(`Scanning for ngClass bindings: ${tsconfigPath}...`);
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
                context.logger.info(`Successfully migrated to class from ngClass 🎉`);
                context.logger.info(`  -> Migrated ${replacementCount} ngClass to class in ${touchedFilesCount} files.`);
            },
        });
    };
}

exports.migrate = migrate;
