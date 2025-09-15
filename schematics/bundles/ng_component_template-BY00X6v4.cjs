'use strict';
/**
 * @license Angular v21.0.0-next.3+sha-a5e5dbb
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var ts = require('typescript');
var ng_decorators = require('./ng_decorators-CtYwz9Lw.cjs');
var property_name = require('./property_name-BBwFuqMe.cjs');
require('os');
var project_tsconfig_paths = require('./project_tsconfig_paths-DhD8nPO0.cjs');

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
    fs = project_tsconfig_paths.getFileSystem();
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

exports.NgComponentTemplateVisitor = NgComponentTemplateVisitor;
