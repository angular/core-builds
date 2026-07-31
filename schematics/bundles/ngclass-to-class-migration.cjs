'use strict';
/**
 * @license Angular v22.1.0+sha-aa6d318
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
'use strict';

var ts = require('typescript');
require('@angular/compiler-cli');
var migrations = require('@angular/compiler-cli/private/migrations');
require('node:path');
var project_paths = require('./project_paths-LBcwW5BF.cjs');
var compiler = require('@angular/compiler');
var apply_import_manager = require('./apply_import_manager-BsCkDgPj.cjs');
var imports = require('./imports-CKV-ITqD.cjs');
var parse_html = require('./parse_html-C8eKA9px.cjs');
var ng_component_template = require('./ng_component_template-DPAF1aEA.cjs');
require('@angular-devkit/core');
require('node:path/posix');
require('@angular-devkit/schematics');
require('./project_tsconfig_paths-BejwmdOG.cjs');
require('./ng_decorators-IVztR9rk.cjs');
require('./property_name-BCpALNpZ.cjs');

const ngClassStr = 'NgClass';
const commonModuleStr = '@angular/common';
const commonModuleImportsStr = 'CommonModule';
function migrateNgClassBindings(template, config, componentNode, typeChecker) {
    const parsed = parse_html.parseTemplate(template);
    if (!parsed.tree || !parsed.tree.rootNodes.length) {
        return {
            migrated: template,
            changed: false,
            replacementCount: 0,
            canRemoveNgClass: true,
            canRemoveCommonModule: false,
        };
    }
    const visitor = new NgClassCollector(template, componentNode, typeChecker);
    compiler.visitAll(visitor, parsed.tree.rootNodes, config);
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
        canRemoveNgClass: visitor.skippedNgClassCount === 0,
        canRemoveCommonModule: changed ? parse_html.canRemoveCommonModule(newTemplate) : false,
    };
}
/**
 * Creates a Replacement to remove `NgClass` from a component's `imports` array.
 * Uses ReflectionHost + PartialEvaluator for robust AST analysis.
 */
function createNgClassImportsArrayRemoval(classNode, file, typeChecker, removeCommonModule) {
    const reflector = new migrations.TypeScriptReflectionHost(typeChecker);
    const evaluator = new migrations.PartialEvaluator(reflector, typeChecker, null);
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
    const elementsToRemove = new Set([ngClassStr]);
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
function getPropertyRemovalRange(property) {
    const parent = property.parent;
    if (!ts.isObjectLiteralExpression(parent)) {
        return { start: property.getStart(), end: property.getEnd() };
    }
    const properties = parent.properties;
    const propertyIndex = properties.indexOf(property);
    if (properties.length === 1) {
        const sourceFile = property.getSourceFile();
        let end = property.getEnd();
        const textAfter = sourceFile.text.substring(end, parent.getEnd());
        const commaIndex = textAfter.indexOf(',');
        if (commaIndex !== -1) {
            end += commaIndex + 1;
        }
        return { start: property.getFullStart(), end };
    }
    if (propertyIndex === 0) {
        return { start: property.getFullStart(), end: properties[1].getFullStart() };
    }
    return { start: properties[propertyIndex - 1].getEnd(), end: property.getEnd() };
}
function calculateImportReplacements(info, sourceFiles, filesToRemoveCommonModule) {
    const importReplacements = {};
    const importManager = new migrations.ImportManager();
    for (const sf of sourceFiles) {
        const file = project_paths.projectFile(sf, info);
        // Always remove NgClass if it's imported directly.
        importManager.removeImport(sf, ngClassStr, commonModuleStr);
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
 * for [ngClass] bindings that use static object literals.
 */
class NgClassCollector extends compiler.RecursiveVisitor {
    componentNode;
    typeChecker;
    replacements = [];
    skippedNgClassCount = 0;
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
                const parseResult = tryParseStaticObjectLiteral(expr);
                if (parseResult === null) {
                    this.skippedNgClassCount++;
                    continue;
                }
                const { bindings: staticMatch, hasSpaceSeparatedKeys } = parseResult;
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
                    // Multiple bindings. If any original key contained spaces, [class]="{...}" object
                    // syntax cannot be used because [class] does not support space-separated key names
                    // (only [ngClass] does). Either expand every binding individually, or skip.
                    if (hasSpaceSeparatedKeys) {
                        // Expanding is only safe if every binding maps to a distinct, non-empty class
                        // name that doesn't contain a dot: an empty key would produce the invalid
                        // `[class.]` binding, duplicate keys would produce multiple conflicting
                        // `[class.foo]` bindings on one element, and a dot in the class name (e.g.
                        // 'a.b') would silently bind to the wrong property since `[class.a.b]` is
                        // parsed as `[class.a]` — everything after the first dot is discarded.
                        const expandedKeys = staticMatch.map(({ key }) => key);
                        const canExpand = expandedKeys.every((key) => key !== '' && !key.includes('.')) &&
                            new Set(expandedKeys).size === expandedKeys.length;
                        if (config.migrateSpaceSeparatedKey && canExpand) {
                            replacement = staticMatch
                                .map(({ key, value }) => `[class.${key}]="${value}"`)
                                .join(' ');
                        }
                        else {
                            // Cannot produce valid [class]="..." output — leave binding as-is.
                            this.skippedNgClassCount++;
                            continue;
                        }
                    }
                    else {
                        // All keys are single class names: [class]="{'cls1': cond1, 'cls2': cond2}" is valid.
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
        return { bindings: [], hasSpaceSeparatedKeys: false };
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
 * Extracts class bindings from object literal properties.
 * Returns the list of individual `{key, value}` bindings (space-separated keys are expanded)
 * along with a flag indicating whether any original key contained spaces.
 */
function extractClassBindings(objectLiteral) {
    const bindings = [];
    let hasSpaceSeparatedKeys = false;
    for (const property of objectLiteral.properties) {
        if (ts.isShorthandPropertyAssignment(property)) {
            const key = property.name.getText();
            if (key.includes(' ')) {
                return null;
            }
            bindings.push({ key, value: key });
        }
        else if (ts.isPropertyAssignment(property)) {
            const keyText = extractPropertyKey(property.name);
            const valueText = extractPropertyValue(property.initializer);
            if (keyText === '' && valueText) {
                bindings.push({ key: '', value: valueText });
            }
            else {
                if (!keyText || !valueText) {
                    return null;
                }
                // Handle multiple CSS classes in single key (e.g., 'class1 class2': condition)
                const classNames = keyText.split(/\s+/).filter(Boolean);
                if (classNames.length > 1) {
                    hasSpaceSeparatedKeys = true;
                }
                for (const className of classNames) {
                    bindings.push({ key: className, value: valueText });
                }
            }
        }
        else {
            return null;
        }
    }
    return { bindings, hasSpaceSeparatedKeys };
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
    processTemplate(template, node, file, info, typeChecker) {
        const { migrated, changed, replacementCount, canRemoveNgClass, canRemoveCommonModule } = migrateNgClassBindings(template.content, this.config, node, typeChecker);
        if (!changed) {
            // Even when no replacements were made, we must propagate the real `canRemoveNgClass`
            // value. If the template contained [ngClass] bindings that could not be migrated (e.g.
            // dynamic variable or array bindings), the visitor's `skippedNgClassCount` will be > 0
            // and `canRemoveNgClass` will be false. Returning `true` here unconditionally would
            // cause the migration to incorrectly strip `NgClass` from the component's `imports`
            // array and from the top-level import statement.
            return {
                replacements: [],
                replacementCount: 0,
                canRemoveNgClass,
                canRemoveCommonModule,
            };
        }
        const fileToMigrate = template.inline
            ? file
            : project_paths.projectFile(template.filePath, info);
        const end = template.start + template.content.length;
        return {
            replacements: [prepareTextReplacement(fileToMigrate, migrated, template.start, end)],
            replacementCount,
            canRemoveNgClass,
            canRemoveCommonModule,
        };
    }
    /** Migrates a single class declaration, if it has a component template using `[ngClass]`. */
    processClass(node, file, info, typeChecker) {
        const templateVisitor = new ng_component_template.NgComponentTemplateVisitor(typeChecker);
        templateVisitor.visitNode(node);
        if (templateVisitor.resolvedTemplates.length === 0) {
            return null;
        }
        const replacements = [];
        let replacementCount = 0;
        let canRemoveNgClass = true;
        let canRemoveCommonModule = true;
        for (const template of templateVisitor.resolvedTemplates) {
            const result = this.processTemplate(template, node, file, info, typeChecker);
            replacements.push(...result.replacements);
            replacementCount += result.replacementCount;
            canRemoveNgClass = canRemoveNgClass && result.canRemoveNgClass;
            canRemoveCommonModule = canRemoveCommonModule && result.canRemoveCommonModule;
        }
        // Handle the `@Component({ imports: [...] })` array.
        // Only remove NgClass from this class's own imports array if all of its [ngClass] bindings were migrated.
        if (canRemoveNgClass) {
            const importsRemoval = createNgClassImportsArrayRemoval(node, file, typeChecker, canRemoveCommonModule);
            if (importsRemoval) {
                replacements.push(importsRemoval);
            }
        }
        return { replacements, replacementCount, canRemoveNgClass, canRemoveCommonModule };
    }
    async analyze(info) {
        const { sourceFiles, program } = info;
        const typeChecker = program.getTypeChecker();
        const ngClassReplacements = [];
        const filesWithNgClassDeclarations = new Set();
        const filesToRemoveCommonModule = new Set();
        for (const sf of sourceFiles) {
            const file = project_paths.projectFile(sf, info);
            const classResults = [];
            ts.forEachChild(sf, (node) => {
                if (!ts.isClassDeclaration(node)) {
                    return;
                }
                if (this.config.shouldMigrate && !this.config.shouldMigrate(file)) {
                    return;
                }
                const result = this.processClass(node, file, info, typeChecker);
                if (result !== null) {
                    classResults.push(result);
                }
            });
            if (classResults.length === 0) {
                continue;
            }
            for (const { replacements, replacementCount } of classResults) {
                if (replacements.length > 0) {
                    ngClassReplacements.push({ file, replacementCount, replacements });
                }
            }
            // A single source file may declare multiple classes/components. The top-level
            // `NgClass`/`CommonModule` import statements are shared across all of them, so they can
            // only be removed once every class in the file no longer needs them.
            if (classResults.every((result) => result.canRemoveNgClass)) {
                filesWithNgClassDeclarations.add(sf);
            }
            if (classResults.every((result) => result.canRemoveCommonModule)) {
                filesToRemoveCommonModule.add(file.id);
            }
        }
        const importReplacements = calculateImportReplacements(info, filesWithNgClassDeclarations, filesToRemoveCommonModule);
        return project_paths.confirmAsSerializable({
            ngClassReplacements,
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
