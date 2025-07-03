'use strict';
/**
 * @license Angular v20.0.6+sha-a7ce3cc
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var ts = require('typescript');
require('os');
var checker = require('./checker-a0VNmSrQ.cjs');
require('./index-jMQgXbRg.cjs');
require('path');
var project_paths = require('./project_paths-C4WM31v5.cjs');
var ng_decorators = require('./ng_decorators-B5HCqr20.cjs');
var property_name = require('./property_name-BBwFuqMe.cjs');
require('@angular-devkit/core');
require('node:path/posix');
require('fs');
require('module');
require('url');
require('@angular-devkit/schematics');
require('./project_tsconfig_paths-CDVxT6Ov.cjs');
require('./imports-CIX-JgAN.cjs');

/**
 * Unwraps a given expression TypeScript node. Expressions can be wrapped within multiple
 * parentheses or as expression. e.g. "(((({exp}))))()". The function should return the
 * TypeScript node referring to the inner expression. e.g "exp".
 */
function unwrapExpression(node) {
    if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node)) {
        return unwrapExpression(node.expression);
    }
    else {
        return node;
    }
}

/** Extracts `@Directive` or `@Component` metadata from the given class. */
function extractAngularClassMetadata(typeChecker, node) {
    const decorators = ts.getDecorators(node);
    if (!decorators || !decorators.length) {
        return null;
    }
    const ngDecorators = ng_decorators.getAngularDecorators(typeChecker, decorators);
    const componentDecorator = ngDecorators.find((dec) => dec.name === 'Component');
    const directiveDecorator = ngDecorators.find((dec) => dec.name === 'Directive');
    const decorator = componentDecorator ?? directiveDecorator;
    // In case no decorator could be found on the current class, skip.
    if (!decorator) {
        return null;
    }
    const decoratorCall = decorator.node.expression;
    // In case the decorator call is not valid, skip this class declaration.
    if (decoratorCall.arguments.length !== 1) {
        return null;
    }
    const metadata = unwrapExpression(decoratorCall.arguments[0]);
    // Ensure that the metadata is an object literal expression.
    if (!ts.isObjectLiteralExpression(metadata)) {
        return null;
    }
    return {
        type: componentDecorator ? 'component' : 'directive',
        node: metadata,
    };
}

const LF_CHAR = 10;
const CR_CHAR = 13;
const LINE_SEP_CHAR = 8232;
const PARAGRAPH_CHAR = 8233;
/** Gets the line and character for the given position from the line starts map. */
function getLineAndCharacterFromPosition(lineStartsMap, position) {
    const lineIndex = findClosestLineStartPosition(lineStartsMap, position);
    return { character: position - lineStartsMap[lineIndex], line: lineIndex };
}
/**
 * Computes the line start map of the given text. This can be used in order to
 * retrieve the line and character of a given text position index.
 */
function computeLineStartsMap(text) {
    const result = [0];
    let pos = 0;
    while (pos < text.length) {
        const char = text.charCodeAt(pos++);
        // Handles the "CRLF" line break. In that case we peek the character
        // after the "CR" and check if it is a line feed.
        if (char === CR_CHAR) {
            if (text.charCodeAt(pos) === LF_CHAR) {
                pos++;
            }
            result.push(pos);
        }
        else if (char === LF_CHAR || char === LINE_SEP_CHAR || char === PARAGRAPH_CHAR) {
            result.push(pos);
        }
    }
    result.push(pos);
    return result;
}
/** Finds the closest line start for the given position. */
function findClosestLineStartPosition(linesMap, position, low = 0, high = linesMap.length - 1) {
    while (low <= high) {
        const pivotIdx = Math.floor((low + high) / 2);
        const pivotEl = linesMap[pivotIdx];
        if (pivotEl === position) {
            return pivotIdx;
        }
        else if (position > pivotEl) {
            low = pivotIdx + 1;
        }
        else {
            high = pivotIdx - 1;
        }
    }
    // In case there was no exact match, return the closest "lower" line index. We also
    // subtract the index by one because want the index of the previous line start.
    return low - 1;
}

/**
 * Visitor that can be used to determine Angular templates referenced within given
 * TypeScript source files (inline templates or external referenced templates)
 */
class NgComponentTemplateVisitor {
    typeChecker;
    resolvedTemplates = [];
    fs = checker.getFileSystem();
    constructor(typeChecker) {
        this.typeChecker = typeChecker;
    }
    visitNode(node) {
        if (node.kind === ts.SyntaxKind.ClassDeclaration) {
            this.visitClassDeclaration(node);
        }
        ts.forEachChild(node, (n) => this.visitNode(n));
    }
    visitClassDeclaration(node) {
        const metadata = extractAngularClassMetadata(this.typeChecker, node);
        if (metadata === null || metadata.type !== 'component') {
            return;
        }
        const sourceFile = node.getSourceFile();
        const sourceFileName = sourceFile.fileName;
        // Walk through all component metadata properties and determine the referenced
        // HTML templates (either external or inline)
        metadata.node.properties.forEach((property) => {
            if (!ts.isPropertyAssignment(property)) {
                return;
            }
            const propertyName = property_name.getPropertyNameText(property.name);
            // In case there is an inline template specified, ensure that the value is statically
            // analyzable by checking if the initializer is a string literal-like node.
            if (propertyName === 'template' && ts.isStringLiteralLike(property.initializer)) {
                // Need to add an offset of one to the start because the template quotes are
                // not part of the template content.
                // The `getText()` method gives us the original raw text.
                // We could have used the `text` property, but if the template is defined as a backtick
                // string then the `text` property contains a "cooked" version of the string. Such cooked
                // strings will have converted CRLF characters to only LF. This messes up string
                // replacements in template migrations.
                // The raw text returned by `getText()` includes the enclosing quotes so we change the
                // `content` and `start` values accordingly.
                const content = property.initializer.getText().slice(1, -1);
                const start = property.initializer.getStart() + 1;
                this.resolvedTemplates.push({
                    filePath: sourceFileName,
                    container: node,
                    content,
                    inline: true,
                    start: start,
                    getCharacterAndLineOfPosition: (pos) => ts.getLineAndCharacterOfPosition(sourceFile, pos + start),
                });
            }
            if (propertyName === 'templateUrl' && ts.isStringLiteralLike(property.initializer)) {
                const absolutePath = this.fs.resolve(this.fs.dirname(sourceFileName), property.initializer.text);
                if (!this.fs.exists(absolutePath)) {
                    return;
                }
                const fileContent = this.fs.readFile(absolutePath);
                const lineStartsMap = computeLineStartsMap(fileContent);
                this.resolvedTemplates.push({
                    filePath: absolutePath,
                    container: node,
                    content: fileContent,
                    inline: false,
                    start: 0,
                    getCharacterAndLineOfPosition: (pos) => getLineAndCharacterFromPosition(lineStartsMap, pos),
                });
            }
        });
    }
}

function parseTemplate(template) {
    let parsed;
    try {
        // Note: we use the HtmlParser here, instead of the `parseTemplate` function, because the
        // latter returns an Ivy AST, not an HTML AST. The HTML AST has the advantage of preserving
        // interpolated text as text nodes containing a mixture of interpolation tokens and text tokens,
        // rather than turning them into `BoundText` nodes like the Ivy AST does. This allows us to
        // easily get the text-only ranges without having to reconstruct the original text.
        parsed = new checker.HtmlParser().parse(template, '', {
            // Allows for ICUs to be parsed.
            tokenizeExpansionForms: true,
            // Explicitly disable blocks so that their characters are treated as plain text.
            tokenizeBlocks: true,
            preserveLineEndings: true,
        });
        // Don't migrate invalid templates.
        if (parsed.errors && parsed.errors.length > 0) {
            const errors = parsed.errors.map((e) => ({ type: 'parse', error: e }));
            return { tree: undefined, errors };
        }
    }
    catch (e) {
        return { tree: undefined, errors: [{ type: 'parse', error: e }] };
    }
    return { tree: parsed, errors: [] };
}

function migrateTemplateToSelfClosingTags(template) {
    let parsed = parseTemplate(template);
    if (parsed.tree === undefined) {
        return { migrated: template, changed: false, replacementCount: 0 };
    }
    const visitor = new AngularElementCollector();
    checker.visitAll$1(visitor, parsed.tree.rootNodes);
    let newTemplate = template;
    let changedOffset = 0;
    let replacementCount = 0;
    for (let element of visitor.elements) {
        const { start, end, tagName } = element;
        const currentLength = newTemplate.length;
        const templatePart = newTemplate.slice(start + changedOffset, end + changedOffset);
        const convertedTemplate = replaceWithSelfClosingTag(templatePart, tagName);
        // if the template has changed, replace the original template with the new one
        if (convertedTemplate.length !== templatePart.length) {
            newTemplate = replaceTemplate(newTemplate, convertedTemplate, start, end, changedOffset);
            changedOffset += newTemplate.length - currentLength;
            replacementCount++;
        }
    }
    return { migrated: newTemplate, changed: changedOffset !== 0, replacementCount };
}
function replaceWithSelfClosingTag(html, tagName) {
    const pattern = new RegExp(`<\\s*${tagName}\\s*([^>]*?(?:"[^"]*"|'[^']*'|[^'">])*)\\s*>([\\s\\S]*?)<\\s*/\\s*${tagName}\\s*>`, 'gi');
    return html.replace(pattern, (_, content) => `<${tagName}${content ? ` ${content}` : ''} />`);
}
/**
 * Replace the value in the template with the new value based on the start and end position + offset
 */
function replaceTemplate(template, replaceValue, start, end, offset) {
    return template.slice(0, start + offset) + replaceValue + template.slice(end + offset);
}
const ALL_HTML_TAGS = new checker.DomElementSchemaRegistry().allKnownElementNames();
class AngularElementCollector extends checker.RecursiveVisitor$1 {
    elements = [];
    constructor() {
        super();
    }
    visitElement(element) {
        const isHtmlTag = ALL_HTML_TAGS.includes(element.name);
        if (isHtmlTag) {
            return;
        }
        const hasNoContent = this.elementHasNoContent(element);
        const hasNoClosingTag = this.elementHasNoClosingTag(element);
        if (hasNoContent && !hasNoClosingTag) {
            this.elements.push({
                tagName: element.name,
                start: element.sourceSpan.start.offset,
                end: element.sourceSpan.end.offset,
            });
        }
        return super.visitElement(element, null);
    }
    elementHasNoContent(element) {
        if (!element.children?.length) {
            return true;
        }
        if (element.children.length === 1) {
            const child = element.children[0];
            return child instanceof checker.Text && /^\s*$/.test(child.value);
        }
        return false;
    }
    elementHasNoClosingTag(element) {
        const { startSourceSpan, endSourceSpan } = element;
        if (!endSourceSpan) {
            return true;
        }
        return (startSourceSpan.start.offset === endSourceSpan.start.offset &&
            startSourceSpan.end.offset === endSourceSpan.end.offset);
    }
}

class SelfClosingTagsMigration extends project_paths.TsurgeFunnelMigration {
    config;
    constructor(config = {}) {
        super();
        this.config = config;
    }
    async analyze(info) {
        const { sourceFiles, program } = info;
        const typeChecker = program.getTypeChecker();
        const tagReplacements = [];
        for (const sf of sourceFiles) {
            ts.forEachChild(sf, (node) => {
                // Skipping any non component declarations
                if (!ts.isClassDeclaration(node)) {
                    return;
                }
                const file = project_paths.projectFile(node.getSourceFile(), info);
                if (this.config.shouldMigrate && this.config.shouldMigrate(file) === false) {
                    return;
                }
                const templateVisitor = new NgComponentTemplateVisitor(typeChecker);
                templateVisitor.visitNode(node);
                templateVisitor.resolvedTemplates.forEach((template) => {
                    const { migrated, changed, replacementCount } = migrateTemplateToSelfClosingTags(template.content);
                    if (!changed) {
                        return;
                    }
                    const fileToMigrate = template.inline
                        ? file
                        : project_paths.projectFile(template.filePath, info);
                    const end = template.start + template.content.length;
                    const replacements = [
                        prepareTextReplacement(fileToMigrate, migrated, template.start, end),
                    ];
                    const fileReplacements = tagReplacements.find((tagReplacement) => tagReplacement.file === file);
                    if (fileReplacements) {
                        fileReplacements.replacements.push(...replacements);
                        fileReplacements.replacementCount += replacementCount;
                    }
                    else {
                        tagReplacements.push({ file, replacements, replacementCount });
                    }
                });
            });
        }
        return project_paths.confirmAsSerializable({ tagReplacements });
    }
    async combine(unitA, unitB) {
        return project_paths.confirmAsSerializable({
            tagReplacements: [...unitA.tagReplacements, ...unitB.tagReplacements],
        });
    }
    async globalMeta(combinedData) {
        const globalMeta = {
            tagReplacements: combinedData.tagReplacements,
        };
        return project_paths.confirmAsSerializable(globalMeta);
    }
    async stats(globalMetadata) {
        const touchedFilesCount = globalMetadata.tagReplacements.length;
        const replacementCount = globalMetadata.tagReplacements.reduce((acc, cur) => acc + cur.replacementCount, 0);
        return project_paths.confirmAsSerializable({
            touchedFilesCount,
            replacementCount,
        });
    }
    async migrate(globalData) {
        return { replacements: globalData.tagReplacements.flatMap(({ replacements }) => replacements) };
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
            getMigration: (fs) => new SelfClosingTagsMigration({
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
            whenDone: ({ touchedFilesCount, replacementCount }) => {
                context.logger.info('');
                context.logger.info(`Successfully migrated to self-closing tags 🎉`);
                context.logger.info(`  -> Migrated ${replacementCount} components to self-closing tags in ${touchedFilesCount} component files.`);
            },
        });
    };
}

exports.migrate = migrate;
