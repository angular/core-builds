'use strict';
/**
 * @license Angular v20.0.0-rc.1+sha-e13d6a3
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var schematics = require('@angular-devkit/schematics');
var p = require('path');
var compiler_host = require('./compiler_host-CAfDJO3W.js');
var compiler = require('./compiler-CWuG67kz.js');
var ts = require('typescript');
var project_tsconfig_paths = require('./project_tsconfig_paths-CDVxT6Ov.js');
require('@angular-devkit/core');

function lookupIdentifiersInSourceFile(sourceFile, names) {
    const results = new Set();
    const visit = (node) => {
        if (ts.isIdentifier(node) && names.includes(node.text)) {
            results.add(node);
        }
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    return results;
}

const ngtemplate = 'ng-template';
const boundngifelse = '[ngIfElse]';
const boundngifthenelse = '[ngIfThenElse]';
const boundngifthen = '[ngIfThen]';
const nakedngfor$1 = 'ngFor';
const startMarker = '◬';
const endMarker = '✢';
const startI18nMarker = '⚈';
const endI18nMarker = '⚉';
const importRemovals = [
    'NgIf',
    'NgIfElse',
    'NgIfThenElse',
    'NgFor',
    'NgForOf',
    'NgForTrackBy',
    'NgSwitch',
    'NgSwitchCase',
    'NgSwitchDefault',
];
const importWithCommonRemovals = [...importRemovals, 'CommonModule'];
function allFormsOf(selector) {
    return [selector, `*${selector}`, `[${selector}]`];
}
const commonModuleDirectives = new Set([
    ...allFormsOf('ngComponentOutlet'),
    ...allFormsOf('ngTemplateOutlet'),
    ...allFormsOf('ngClass'),
    ...allFormsOf('ngPlural'),
    ...allFormsOf('ngPluralCase'),
    ...allFormsOf('ngStyle'),
    ...allFormsOf('ngTemplateOutlet'),
    ...allFormsOf('ngComponentOutlet'),
    '[NgForOf]',
    '[NgForTrackBy]',
    '[ngIfElse]',
    '[ngIfThenElse]',
]);
function pipeMatchRegExpFor(name) {
    return new RegExp(`\\|\\s*${name}`);
}
const commonModulePipes = [
    'date',
    'async',
    'currency',
    'number',
    'i18nPlural',
    'i18nSelect',
    'json',
    'keyvalue',
    'slice',
    'lowercase',
    'uppercase',
    'titlecase',
    'percent',
].map((name) => pipeMatchRegExpFor(name));
/**
 * Represents an element with a migratable attribute
 */
class ElementToMigrate {
    el;
    attr;
    elseAttr;
    thenAttr;
    forAttrs;
    aliasAttrs;
    nestCount = 0;
    hasLineBreaks = false;
    constructor(el, attr, elseAttr = undefined, thenAttr = undefined, forAttrs = undefined, aliasAttrs = undefined) {
        this.el = el;
        this.attr = attr;
        this.elseAttr = elseAttr;
        this.thenAttr = thenAttr;
        this.forAttrs = forAttrs;
        this.aliasAttrs = aliasAttrs;
    }
    normalizeConditionString(value) {
        value = this.insertSemicolon(value, value.indexOf(' else '));
        value = this.insertSemicolon(value, value.indexOf(' then '));
        value = this.insertSemicolon(value, value.indexOf(' let '));
        return value.replace(';;', ';');
    }
    insertSemicolon(str, ix) {
        return ix > -1 ? `${str.slice(0, ix)};${str.slice(ix)}` : str;
    }
    getCondition() {
        const chunks = this.normalizeConditionString(this.attr.value).split(';');
        let condition = chunks[0];
        // checks for case of no usage of `;` in if else / if then else
        const elseIx = condition.indexOf(' else ');
        const thenIx = condition.indexOf(' then ');
        if (thenIx > -1) {
            condition = condition.slice(0, thenIx);
        }
        else if (elseIx > -1) {
            condition = condition.slice(0, elseIx);
        }
        let letVar = chunks.find((c) => c.search(/\s*let\s/) > -1);
        return condition + (letVar ? ';' + letVar : '');
    }
    getTemplateName(targetStr, secondStr) {
        const targetLocation = this.attr.value.indexOf(targetStr);
        const secondTargetLocation = secondStr ? this.attr.value.indexOf(secondStr) : undefined;
        let templateName = this.attr.value.slice(targetLocation + targetStr.length, secondTargetLocation);
        if (templateName.startsWith(':')) {
            templateName = templateName.slice(1).trim();
        }
        return templateName.split(';')[0].trim();
    }
    getValueEnd(offset) {
        return ((this.attr.valueSpan ? this.attr.valueSpan.end.offset + 1 : this.attr.keySpan.end.offset) -
            offset);
    }
    hasChildren() {
        return this.el.children.length > 0;
    }
    getChildSpan(offset) {
        const childStart = this.el.children[0].sourceSpan.start.offset - offset;
        const childEnd = this.el.children[this.el.children.length - 1].sourceSpan.end.offset - offset;
        return { childStart, childEnd };
    }
    shouldRemoveElseAttr() {
        return ((this.el.name === 'ng-template' || this.el.name === 'ng-container') &&
            this.elseAttr !== undefined);
    }
    getElseAttrStr() {
        if (this.elseAttr !== undefined) {
            const elseValStr = this.elseAttr.value !== '' ? `="${this.elseAttr.value}"` : '';
            return `${this.elseAttr.name}${elseValStr}`;
        }
        return '';
    }
    start(offset) {
        return this.el.sourceSpan?.start.offset - offset;
    }
    end(offset) {
        return this.el.sourceSpan?.end.offset - offset;
    }
    length() {
        return this.el.sourceSpan?.end.offset - this.el.sourceSpan?.start.offset;
    }
}
/**
 * Represents an ng-template inside a template being migrated to new control flow
 */
class Template {
    el;
    name;
    count = 0;
    contents = '';
    children = '';
    i18n = null;
    attributes;
    constructor(el, name, i18n) {
        this.el = el;
        this.name = name;
        this.attributes = el.attrs;
        this.i18n = i18n;
    }
    get isNgTemplateOutlet() {
        return this.attributes.find((attr) => attr.name === '*ngTemplateOutlet') !== undefined;
    }
    get outletContext() {
        const letVar = this.attributes.find((attr) => attr.name.startsWith('let-'));
        return letVar ? `; context: {$implicit: ${letVar.name.split('-')[1]}}` : '';
    }
    generateTemplateOutlet() {
        const attr = this.attributes.find((attr) => attr.name === '*ngTemplateOutlet');
        const outletValue = attr?.value ?? this.name.slice(1);
        return `<ng-container *ngTemplateOutlet="${outletValue}${this.outletContext}"></ng-container>`;
    }
    generateContents(tmpl) {
        this.contents = tmpl.slice(this.el.sourceSpan.start.offset, this.el.sourceSpan.end.offset);
        this.children = '';
        if (this.el.children.length > 0) {
            this.children = tmpl.slice(this.el.children[0].sourceSpan.start.offset, this.el.children[this.el.children.length - 1].sourceSpan.end.offset);
        }
    }
}
/** Represents a file that was analyzed by the migration. */
class AnalyzedFile {
    ranges = [];
    removeCommonModule = false;
    canRemoveImports = false;
    sourceFile;
    importRanges = [];
    templateRanges = [];
    constructor(sourceFile) {
        this.sourceFile = sourceFile;
    }
    /** Returns the ranges in the order in which they should be migrated. */
    getSortedRanges() {
        // templates first for checking on whether certain imports can be safely removed
        this.templateRanges = this.ranges
            .slice()
            .filter((x) => x.type === 'template' || x.type === 'templateUrl')
            .sort((aStart, bStart) => bStart.start - aStart.start);
        this.importRanges = this.ranges
            .slice()
            .filter((x) => x.type === 'importDecorator' || x.type === 'importDeclaration')
            .sort((aStart, bStart) => bStart.start - aStart.start);
        return [...this.templateRanges, ...this.importRanges];
    }
    /**
     * Adds a text range to an `AnalyzedFile`.
     * @param path Path of the file.
     * @param analyzedFiles Map keeping track of all the analyzed files.
     * @param range Range to be added.
     */
    static addRange(path, sourceFile, analyzedFiles, range) {
        let analysis = analyzedFiles.get(path);
        if (!analysis) {
            analysis = new AnalyzedFile(sourceFile);
            analyzedFiles.set(path, analysis);
        }
        const duplicate = analysis.ranges.find((current) => current.start === range.start && current.end === range.end);
        if (!duplicate) {
            analysis.ranges.push(range);
        }
    }
    /**
     * This verifies whether a component class is safe to remove module imports.
     * It is only run on .ts files.
     */
    verifyCanRemoveImports() {
        const importDeclaration = this.importRanges.find((r) => r.type === 'importDeclaration');
        const instances = lookupIdentifiersInSourceFile(this.sourceFile, importWithCommonRemovals);
        let foundImportDeclaration = false;
        let count = 0;
        for (let range of this.importRanges) {
            for (let instance of instances) {
                if (instance.getStart() >= range.start && instance.getEnd() <= range.end) {
                    if (range === importDeclaration) {
                        foundImportDeclaration = true;
                    }
                    count++;
                }
            }
        }
        if (instances.size !== count && importDeclaration !== undefined && foundImportDeclaration) {
            importDeclaration.remove = false;
        }
    }
}
/** Finds all non-control flow elements from common module. */
class CommonCollector extends compiler.RecursiveVisitor$1 {
    count = 0;
    visitElement(el) {
        if (el.attrs.length > 0) {
            for (const attr of el.attrs) {
                if (this.hasDirectives(attr.name) || this.hasPipes(attr.value)) {
                    this.count++;
                }
            }
        }
        super.visitElement(el, null);
    }
    visitBlock(ast) {
        for (const blockParam of ast.parameters) {
            if (this.hasPipes(blockParam.expression)) {
                this.count++;
            }
        }
        super.visitBlock(ast, null);
    }
    visitText(ast) {
        if (this.hasPipes(ast.value)) {
            this.count++;
        }
    }
    visitLetDeclaration(decl) {
        if (this.hasPipes(decl.value)) {
            this.count++;
        }
        super.visitLetDeclaration(decl, null);
    }
    hasDirectives(input) {
        return commonModuleDirectives.has(input);
    }
    hasPipes(input) {
        return commonModulePipes.some((regexp) => regexp.test(input));
    }
}
/** Finds all elements that represent i18n blocks. */
class i18nCollector extends compiler.RecursiveVisitor$1 {
    elements = [];
    visitElement(el) {
        if (el.attrs.find((a) => a.name === 'i18n') !== undefined) {
            this.elements.push(el);
        }
        super.visitElement(el, null);
    }
}
/** Finds all elements with ngif structural directives. */
class ElementCollector extends compiler.RecursiveVisitor$1 {
    _attributes;
    elements = [];
    constructor(_attributes = []) {
        super();
        this._attributes = _attributes;
    }
    visitElement(el) {
        if (el.attrs.length > 0) {
            for (const attr of el.attrs) {
                if (this._attributes.includes(attr.name)) {
                    const elseAttr = el.attrs.find((x) => x.name === boundngifelse);
                    const thenAttr = el.attrs.find((x) => x.name === boundngifthenelse || x.name === boundngifthen);
                    const forAttrs = attr.name === nakedngfor$1 ? this.getForAttrs(el) : undefined;
                    const aliasAttrs = this.getAliasAttrs(el);
                    this.elements.push(new ElementToMigrate(el, attr, elseAttr, thenAttr, forAttrs, aliasAttrs));
                }
            }
        }
        super.visitElement(el, null);
    }
    getForAttrs(el) {
        let trackBy = '';
        let forOf = '';
        for (const attr of el.attrs) {
            if (attr.name === '[ngForTrackBy]') {
                trackBy = attr.value;
            }
            if (attr.name === '[ngForOf]') {
                forOf = attr.value;
            }
        }
        return { forOf, trackBy };
    }
    getAliasAttrs(el) {
        const aliases = new Map();
        let item = '';
        for (const attr of el.attrs) {
            if (attr.name.startsWith('let-')) {
                if (attr.value === '') {
                    // item
                    item = attr.name.replace('let-', '');
                }
                else {
                    // alias
                    aliases.set(attr.name.replace('let-', ''), attr.value);
                }
            }
        }
        return { item, aliases };
    }
}
/** Finds all elements with ngif structural directives. */
class TemplateCollector extends compiler.RecursiveVisitor$1 {
    elements = [];
    templates = new Map();
    visitElement(el) {
        if (el.name === ngtemplate) {
            let i18n = null;
            let templateAttr = null;
            for (const attr of el.attrs) {
                if (attr.name === 'i18n') {
                    i18n = attr;
                }
                if (attr.name.startsWith('#')) {
                    templateAttr = attr;
                }
            }
            if (templateAttr !== null && !this.templates.has(templateAttr.name)) {
                this.templates.set(templateAttr.name, new Template(el, templateAttr.name, i18n));
                this.elements.push(new ElementToMigrate(el, templateAttr));
            }
            else if (templateAttr !== null) {
                throw new Error(`A duplicate ng-template name "${templateAttr.name}" was found. ` +
                    `The control flow migration requires unique ng-template names within a component.`);
            }
        }
        super.visitElement(el, null);
    }
}

const startMarkerRegex = new RegExp(startMarker, 'gm');
const endMarkerRegex = new RegExp(endMarker, 'gm');
const startI18nMarkerRegex = new RegExp(startI18nMarker, 'gm');
const endI18nMarkerRegex = new RegExp(endI18nMarker, 'gm');
const replaceMarkerRegex = new RegExp(`${startMarker}|${endMarker}`, 'gm');
/**
 * Analyzes a source file to find file that need to be migrated and the text ranges within them.
 * @param sourceFile File to be analyzed.
 * @param analyzedFiles Map in which to store the results.
 */
function analyze(sourceFile, analyzedFiles) {
    forEachClass(sourceFile, (node) => {
        if (ts.isClassDeclaration(node)) {
            analyzeDecorators(node, sourceFile, analyzedFiles);
        }
        else {
            analyzeImportDeclarations(node, sourceFile, analyzedFiles);
        }
    });
}
function checkIfShouldChange(decl, file) {
    const range = file.importRanges.find((r) => r.type === 'importDeclaration');
    if (range === undefined || !range.remove) {
        return false;
    }
    // should change if you can remove the common module
    // if it's not safe to remove the common module
    // and that's the only thing there, we should do nothing.
    const clause = decl.getChildAt(1);
    return !(!file.removeCommonModule &&
        clause.namedBindings &&
        ts.isNamedImports(clause.namedBindings) &&
        clause.namedBindings.elements.length === 1 &&
        clause.namedBindings.elements[0].getText() === 'CommonModule');
}
function updateImportDeclaration(decl, removeCommonModule) {
    const clause = decl.getChildAt(1);
    const updatedClause = updateImportClause(clause, removeCommonModule);
    if (updatedClause === null) {
        return '';
    }
    // removeComments is set to true to prevent duplication of comments
    // when the import declaration is at the top of the file, but right after a comment
    // without this, the comment gets duplicated when the declaration is updated.
    // the typescript AST includes that preceding comment as part of the import declaration full text.
    const printer = ts.createPrinter({
        removeComments: true,
    });
    const updated = ts.factory.updateImportDeclaration(decl, decl.modifiers, updatedClause, decl.moduleSpecifier, undefined);
    return printer.printNode(ts.EmitHint.Unspecified, updated, clause.getSourceFile());
}
function updateImportClause(clause, removeCommonModule) {
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
        const removals = removeCommonModule ? importWithCommonRemovals : importRemovals;
        const elements = clause.namedBindings.elements.filter((el) => !removals.includes(el.getText()));
        if (elements.length === 0) {
            return null;
        }
        clause = ts.factory.updateImportClause(clause, clause.isTypeOnly, clause.name, ts.factory.createNamedImports(elements));
    }
    return clause;
}
function updateClassImports(propAssignment, removeCommonModule) {
    const printer = ts.createPrinter();
    const importList = propAssignment.initializer;
    // Can't change non-array literals.
    if (!ts.isArrayLiteralExpression(importList)) {
        return null;
    }
    const removals = removeCommonModule ? importWithCommonRemovals : importRemovals;
    const elements = importList.elements.filter((el) => !ts.isIdentifier(el) || !removals.includes(el.text));
    if (elements.length === importList.elements.length) {
        // nothing changed
        return null;
    }
    const updatedElements = ts.factory.updateArrayLiteralExpression(importList, elements);
    const updatedAssignment = ts.factory.updatePropertyAssignment(propAssignment, propAssignment.name, updatedElements);
    return printer.printNode(ts.EmitHint.Unspecified, updatedAssignment, updatedAssignment.getSourceFile());
}
function analyzeImportDeclarations(node, sourceFile, analyzedFiles) {
    if (node.getText().indexOf('@angular/common') === -1) {
        return;
    }
    const clause = node.getChildAt(1);
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
        const elements = clause.namedBindings.elements.filter((el) => importWithCommonRemovals.includes(el.getText()));
        if (elements.length > 0) {
            AnalyzedFile.addRange(sourceFile.fileName, sourceFile, analyzedFiles, {
                start: node.getStart(),
                end: node.getEnd(),
                node,
                type: 'importDeclaration',
                remove: true,
            });
        }
    }
}
function analyzeDecorators(node, sourceFile, analyzedFiles) {
    // Note: we have a utility to resolve the Angular decorators from a class declaration already.
    // We don't use it here, because it requires access to the type checker which makes it more
    // time-consuming to run internally.
    const decorator = ts.getDecorators(node)?.find((dec) => {
        return (ts.isCallExpression(dec.expression) &&
            ts.isIdentifier(dec.expression.expression) &&
            dec.expression.expression.text === 'Component');
    });
    const metadata = decorator &&
        decorator.expression.arguments.length > 0 &&
        ts.isObjectLiteralExpression(decorator.expression.arguments[0])
        ? decorator.expression.arguments[0]
        : null;
    if (!metadata) {
        return;
    }
    for (const prop of metadata.properties) {
        // All the properties we care about should have static
        // names and be initialized to a static string.
        if (!ts.isPropertyAssignment(prop) ||
            (!ts.isIdentifier(prop.name) && !ts.isStringLiteralLike(prop.name))) {
            continue;
        }
        switch (prop.name.text) {
            case 'template':
                // +1/-1 to exclude the opening/closing characters from the range.
                AnalyzedFile.addRange(sourceFile.fileName, sourceFile, analyzedFiles, {
                    start: prop.initializer.getStart() + 1,
                    end: prop.initializer.getEnd() - 1,
                    node: prop,
                    type: 'template',
                    remove: true,
                });
                break;
            case 'imports':
                AnalyzedFile.addRange(sourceFile.fileName, sourceFile, analyzedFiles, {
                    start: prop.name.getStart(),
                    end: prop.initializer.getEnd(),
                    node: prop,
                    type: 'importDecorator',
                    remove: true,
                });
                break;
            case 'templateUrl':
                // Leave the end as undefined which means that the range is until the end of the file.
                if (ts.isStringLiteralLike(prop.initializer)) {
                    const path = p.join(p.dirname(sourceFile.fileName), prop.initializer.text);
                    AnalyzedFile.addRange(path, sourceFile, analyzedFiles, {
                        start: 0,
                        node: prop,
                        type: 'templateUrl',
                        remove: true,
                    });
                }
                break;
        }
    }
}
/**
 * returns the level deep a migratable element is nested
 */
function getNestedCount(etm, aggregator) {
    if (aggregator.length === 0) {
        return 0;
    }
    if (etm.el.sourceSpan.start.offset < aggregator[aggregator.length - 1] &&
        etm.el.sourceSpan.end.offset !== aggregator[aggregator.length - 1]) {
        // element is nested
        aggregator.push(etm.el.sourceSpan.end.offset);
        return aggregator.length - 1;
    }
    else {
        // not nested
        aggregator.pop();
        return getNestedCount(etm, aggregator);
    }
}
/**
 * parses the template string into the Html AST
 */
function parseTemplate(template) {
    let parsed;
    try {
        // Note: we use the HtmlParser here, instead of the `parseTemplate` function, because the
        // latter returns an Ivy AST, not an HTML AST. The HTML AST has the advantage of preserving
        // interpolated text as text nodes containing a mixture of interpolation tokens and text tokens,
        // rather than turning them into `BoundText` nodes like the Ivy AST does. This allows us to
        // easily get the text-only ranges without having to reconstruct the original text.
        parsed = new compiler.HtmlParser().parse(template, '', {
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
function validateMigratedTemplate(migrated, fileName) {
    const parsed = parseTemplate(migrated);
    let errors = [];
    if (parsed.errors.length > 0) {
        errors.push({
            type: 'parse',
            error: new Error(`The migration resulted in invalid HTML for ${fileName}. ` +
                `Please check the template for valid HTML structures and run the migration again.`),
        });
    }
    if (parsed.tree) {
        const i18nError = validateI18nStructure(parsed.tree, fileName);
        if (i18nError !== null) {
            errors.push({ type: 'i18n', error: i18nError });
        }
    }
    return errors;
}
function validateI18nStructure(parsed, fileName) {
    const visitor = new i18nCollector();
    compiler.visitAll$1(visitor, parsed.rootNodes);
    const parents = visitor.elements.filter((el) => el.children.length > 0);
    for (const p of parents) {
        for (const el of visitor.elements) {
            if (el === p)
                continue;
            if (isChildOf(p, el)) {
                return new Error(`i18n Nesting error: The migration would result in invalid i18n nesting for ` +
                    `${fileName}. Element with i18n attribute "${p.name}" would result having a child of ` +
                    `element with i18n attribute "${el.name}". Please fix and re-run the migration.`);
            }
        }
    }
    return null;
}
function isChildOf(parent, el) {
    return (parent.sourceSpan.start.offset < el.sourceSpan.start.offset &&
        parent.sourceSpan.end.offset > el.sourceSpan.end.offset);
}
/** Possible placeholders that can be generated by `getPlaceholder`. */
var PlaceholderKind;
(function (PlaceholderKind) {
    PlaceholderKind[PlaceholderKind["Default"] = 0] = "Default";
    PlaceholderKind[PlaceholderKind["Alternate"] = 1] = "Alternate";
})(PlaceholderKind || (PlaceholderKind = {}));
/**
 * Wraps a string in a placeholder that makes it easier to identify during replacement operations.
 */
function getPlaceholder(value, kind = PlaceholderKind.Default) {
    const name = `<<<ɵɵngControlFlowMigration_${kind}ɵɵ>>>`;
    return `___${name}${value}${name}___`;
}
/**
 * calculates the level of nesting of the items in the collector
 */
function calculateNesting(visitor, hasLineBreaks) {
    // start from top of template
    // loop through each element
    let nestedQueue = [];
    for (let i = 0; i < visitor.elements.length; i++) {
        let currEl = visitor.elements[i];
        if (i === 0) {
            nestedQueue.push(currEl.el.sourceSpan.end.offset);
            currEl.hasLineBreaks = hasLineBreaks;
            continue;
        }
        currEl.hasLineBreaks = hasLineBreaks;
        currEl.nestCount = getNestedCount(currEl, nestedQueue);
        if (currEl.el.sourceSpan.end.offset !== nestedQueue[nestedQueue.length - 1]) {
            nestedQueue.push(currEl.el.sourceSpan.end.offset);
        }
    }
}
/**
 * determines if a given template string contains line breaks
 */
function hasLineBreaks(template) {
    return /\r|\n/.test(template);
}
/**
 * properly adjusts template offsets based on current nesting levels
 */
function reduceNestingOffset(el, nestLevel, offset, postOffsets) {
    if (el.nestCount <= nestLevel) {
        const count = nestLevel - el.nestCount;
        // reduced nesting, add postoffset
        for (let i = 0; i <= count; i++) {
            offset += postOffsets.pop() ?? 0;
        }
    }
    return offset;
}
/**
 * Replaces structural directive control flow instances with block control flow equivalents.
 * Returns null if the migration failed (e.g. there was a syntax error).
 */
function getTemplates(template) {
    const parsed = parseTemplate(template);
    if (parsed.tree !== undefined) {
        const visitor = new TemplateCollector();
        compiler.visitAll$1(visitor, parsed.tree.rootNodes);
        for (let [key, tmpl] of visitor.templates) {
            tmpl.count = countTemplateUsage(parsed.tree.rootNodes, key);
            tmpl.generateContents(template);
        }
        return visitor.templates;
    }
    return new Map();
}
function countTemplateUsage(nodes, templateName) {
    let count = 0;
    let isReferencedInTemplateOutlet = false;
    for (const node of nodes) {
        if (node.attrs) {
            for (const attr of node.attrs) {
                if (attr.name === '*ngTemplateOutlet' && attr.value === templateName.slice(1)) {
                    isReferencedInTemplateOutlet = true;
                    break;
                }
                if (attr.name.trim() === templateName) {
                    count++;
                }
            }
        }
        if (node.children) {
            if (node.name === 'for') {
                for (const child of node.children) {
                    if (child.value?.includes(templateName.slice(1))) {
                        count++;
                    }
                }
            }
            count += countTemplateUsage(node.children, templateName);
        }
    }
    return isReferencedInTemplateOutlet ? count + 2 : count;
}
function updateTemplates(template, templates) {
    const updatedTemplates = getTemplates(template);
    for (let [key, tmpl] of updatedTemplates) {
        templates.set(key, tmpl);
    }
    return templates;
}
function wrapIntoI18nContainer(i18nAttr, content) {
    const { start, middle, end } = generatei18nContainer(i18nAttr, content);
    return `${start}${middle}${end}`;
}
function generatei18nContainer(i18nAttr, middle) {
    const i18n = i18nAttr.value === '' ? 'i18n' : `i18n="${i18nAttr.value}"`;
    return { start: `<ng-container ${i18n}>`, middle, end: `</ng-container>` };
}
/**
 * Counts, replaces, and removes any necessary ng-templates post control flow migration
 */
function processNgTemplates(template, sourceFile) {
    // count usage
    try {
        const templates = getTemplates(template);
        // swap placeholders and remove
        for (const [name, t] of templates) {
            const replaceRegex = new RegExp(getPlaceholder(name.slice(1)), 'g');
            const forRegex = new RegExp(getPlaceholder(name.slice(1), PlaceholderKind.Alternate), 'g');
            const forMatches = [...template.matchAll(forRegex)];
            const matches = [...forMatches, ...template.matchAll(replaceRegex)];
            let safeToRemove = true;
            if (matches.length > 0) {
                if (t.i18n !== null) {
                    const container = wrapIntoI18nContainer(t.i18n, t.children);
                    template = template.replace(replaceRegex, container);
                }
                else if (t.children.trim() === '' && t.isNgTemplateOutlet) {
                    template = template.replace(replaceRegex, t.generateTemplateOutlet());
                }
                else if (forMatches.length > 0) {
                    if (t.count === 2) {
                        template = template.replace(forRegex, t.children);
                    }
                    else {
                        template = template.replace(forRegex, t.generateTemplateOutlet());
                        safeToRemove = false;
                    }
                }
                else {
                    template = template.replace(replaceRegex, t.children);
                }
                const dist = matches.filter((obj, index, self) => index === self.findIndex((t) => t.input === obj.input));
                if ((t.count === dist.length || t.count - matches.length === 1) && safeToRemove) {
                    const refsInComponentFile = getViewChildOrViewChildrenNames(sourceFile);
                    if (refsInComponentFile?.length > 0) {
                        const templateRefs = getTemplateReferences(template);
                        for (const ref of refsInComponentFile) {
                            if (!templateRefs.includes(ref)) {
                                template = template.replace(t.contents, `${startMarker}${endMarker}`);
                            }
                        }
                    }
                    else {
                        template = template.replace(t.contents, `${startMarker}${endMarker}`);
                    }
                }
                // templates may have changed structure from nested replaced templates
                // so we need to reprocess them before the next loop.
                updateTemplates(template, templates);
            }
        }
        // template placeholders may still exist if the ng-template name is not
        // present in the component. This could be because it's passed in from
        // another component. In that case, we need to replace any remaining
        // template placeholders with template outlets.
        template = replaceRemainingPlaceholders(template);
        return { migrated: template, err: undefined };
    }
    catch (err) {
        return { migrated: template, err: err };
    }
}
function getViewChildOrViewChildrenNames(sourceFile) {
    const names = [];
    function visit(node) {
        if (ts.isDecorator(node) && ts.isCallExpression(node.expression)) {
            const expr = node.expression;
            if (ts.isIdentifier(expr.expression) &&
                (expr.expression.text === 'ViewChild' || expr.expression.text === 'ViewChildren')) {
                const firstArg = expr.arguments[0];
                if (firstArg && ts.isStringLiteral(firstArg)) {
                    names.push(firstArg.text);
                }
                return;
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    return names;
}
function getTemplateReferences(template) {
    const parsed = parseTemplate(template);
    if (parsed.tree === undefined) {
        return [];
    }
    const references = [];
    function visitNodes(nodes) {
        for (const node of nodes) {
            if (node?.name === 'ng-template') {
                references.push(...node.attrs?.map((ref) => ref?.name?.slice(1)));
            }
            if (node.children) {
                visitNodes(node.children);
            }
        }
    }
    visitNodes(parsed.tree.rootNodes);
    return references;
}
function replaceRemainingPlaceholders(template) {
    const pattern = '.*';
    const placeholderPattern = getPlaceholder(pattern);
    const replaceRegex = new RegExp(placeholderPattern, 'g');
    const [placeholderStart, placeholderEnd] = placeholderPattern.split(pattern);
    const placeholders = [...template.matchAll(replaceRegex)];
    for (let ph of placeholders) {
        const placeholder = ph[0];
        const name = placeholder.slice(placeholderStart.length, placeholder.length - placeholderEnd.length);
        template = template.replace(placeholder, `<ng-template [ngTemplateOutlet]="${name}"></ng-template>`);
    }
    return template;
}
/**
 * determines if the CommonModule can be safely removed from imports
 */
function canRemoveCommonModule(template) {
    const parsed = parseTemplate(template);
    let removeCommonModule = false;
    if (parsed.tree !== undefined) {
        const visitor = new CommonCollector();
        compiler.visitAll$1(visitor, parsed.tree.rootNodes);
        removeCommonModule = visitor.count === 0;
    }
    return removeCommonModule;
}
/**
 * removes imports from template imports and import declarations
 */
function removeImports(template, node, file) {
    if (template.startsWith('imports') && ts.isPropertyAssignment(node)) {
        const updatedImport = updateClassImports(node, file.removeCommonModule);
        return updatedImport ?? template;
    }
    else if (ts.isImportDeclaration(node) && checkIfShouldChange(node, file)) {
        return updateImportDeclaration(node, file.removeCommonModule);
    }
    return template;
}
/**
 * retrieves the original block of text in the template for length comparison during migration
 * processing
 */
function getOriginals(etm, tmpl, offset) {
    // original opening block
    if (etm.el.children.length > 0) {
        const childStart = etm.el.children[0].sourceSpan.start.offset - offset;
        const childEnd = etm.el.children[etm.el.children.length - 1].sourceSpan.end.offset - offset;
        const start = tmpl.slice(etm.el.sourceSpan.start.offset - offset, etm.el.children[0].sourceSpan.start.offset - offset);
        // original closing block
        const end = tmpl.slice(etm.el.children[etm.el.children.length - 1].sourceSpan.end.offset - offset, etm.el.sourceSpan.end.offset - offset);
        const childLength = childEnd - childStart;
        return {
            start,
            end,
            childLength,
            children: getOriginalChildren(etm.el.children, tmpl, offset),
            childNodes: etm.el.children,
        };
    }
    // self closing or no children
    const start = tmpl.slice(etm.el.sourceSpan.start.offset - offset, etm.el.sourceSpan.end.offset - offset);
    // original closing block
    return { start, end: '', childLength: 0, children: [], childNodes: [] };
}
function getOriginalChildren(children, tmpl, offset) {
    return children.map((child) => {
        return tmpl.slice(child.sourceSpan.start.offset - offset, child.sourceSpan.end.offset - offset);
    });
}
function isI18nTemplate(etm, i18nAttr) {
    let attrCount = countAttributes(etm);
    const safeToRemove = etm.el.attrs.length === attrCount + (i18nAttr !== undefined ? 1 : 0);
    return etm.el.name === 'ng-template' && i18nAttr !== undefined && safeToRemove;
}
function isRemovableContainer(etm) {
    let attrCount = countAttributes(etm);
    const safeToRemove = etm.el.attrs.length === attrCount;
    return (etm.el.name === 'ng-container' || etm.el.name === 'ng-template') && safeToRemove;
}
function countAttributes(etm) {
    let attrCount = 1;
    if (etm.elseAttr !== undefined) {
        attrCount++;
    }
    if (etm.thenAttr !== undefined) {
        attrCount++;
    }
    attrCount += etm.aliasAttrs?.aliases.size ?? 0;
    attrCount += etm.aliasAttrs?.item ? 1 : 0;
    attrCount += etm.forAttrs?.trackBy ? 1 : 0;
    attrCount += etm.forAttrs?.forOf ? 1 : 0;
    return attrCount;
}
/**
 * builds the proper contents of what goes inside a given control flow block after migration
 */
function getMainBlock(etm, tmpl, offset) {
    const i18nAttr = etm.el.attrs.find((x) => x.name === 'i18n');
    // removable containers are ng-templates or ng-containers that no longer need to exist
    // post migration
    if (isRemovableContainer(etm)) {
        let middle = '';
        if (etm.hasChildren()) {
            const { childStart, childEnd } = etm.getChildSpan(offset);
            middle = tmpl.slice(childStart, childEnd);
        }
        else {
            middle = '';
        }
        return { start: '', middle, end: '' };
    }
    else if (isI18nTemplate(etm, i18nAttr)) {
        // here we're removing an ng-template used for control flow and i18n and
        // converting it to an ng-container with i18n
        const { childStart, childEnd } = etm.getChildSpan(offset);
        return generatei18nContainer(i18nAttr, tmpl.slice(childStart, childEnd));
    }
    // the index of the start of the attribute adjusting for offset shift
    const attrStart = etm.attr.keySpan.start.offset - 1 - offset;
    // the index of the very end of the attribute value adjusted for offset shift
    const valEnd = etm.getValueEnd(offset);
    // the index of the children start and end span, if they exist. Otherwise use the value end.
    const { childStart, childEnd } = etm.hasChildren()
        ? etm.getChildSpan(offset)
        : { childStart: valEnd, childEnd: valEnd };
    // the beginning of the updated string in the main block, for example: <div some="attributes">
    let start = tmpl.slice(etm.start(offset), attrStart) + tmpl.slice(valEnd, childStart);
    // the middle is the actual contents of the element
    const middle = tmpl.slice(childStart, childEnd);
    // the end is the closing part of the element, example: </div>
    let end = tmpl.slice(childEnd, etm.end(offset));
    if (etm.shouldRemoveElseAttr()) {
        // this removes a bound ngIfElse attribute that's no longer needed
        // this could be on the start or end
        start = start.replace(etm.getElseAttrStr(), '');
        end = end.replace(etm.getElseAttrStr(), '');
    }
    return { start, middle, end };
}
function generateI18nMarkers(tmpl) {
    let parsed = parseTemplate(tmpl);
    if (parsed.tree !== undefined) {
        const visitor = new i18nCollector();
        compiler.visitAll$1(visitor, parsed.tree.rootNodes);
        for (const [ix, el] of visitor.elements.entries()) {
            // we only care about elements with children and i18n tags
            // elements without children have nothing to translate
            // offset accounts for the addition of the 2 marker characters with each loop.
            const offset = ix * 2;
            if (el.children.length > 0) {
                tmpl = addI18nMarkers(tmpl, el, offset);
            }
        }
    }
    return tmpl;
}
function addI18nMarkers(tmpl, el, offset) {
    const startPos = el.children[0].sourceSpan.start.offset + offset;
    const endPos = el.children[el.children.length - 1].sourceSpan.end.offset + offset;
    return (tmpl.slice(0, startPos) +
        startI18nMarker +
        tmpl.slice(startPos, endPos) +
        endI18nMarker +
        tmpl.slice(endPos));
}
const selfClosingList = 'input|br|img|base|wbr|area|col|embed|hr|link|meta|param|source|track';
/**
 * re-indents all the lines in the template properly post migration
 */
function formatTemplate(tmpl, templateType) {
    if (tmpl.indexOf('\n') > -1) {
        tmpl = generateI18nMarkers(tmpl);
        // tracks if a self closing element opened without closing yet
        let openSelfClosingEl = false;
        // match any type of control flow block as start of string ignoring whitespace
        // @if | @switch | @case | @default | @for | } @else
        const openBlockRegex = /^\s*\@(if|switch|case|default|for)|^\s*\}\s\@else/;
        // regex for matching an html element opening
        // <div thing="stuff" [binding]="true"> || <div thing="stuff" [binding]="true"
        const openElRegex = /^\s*<([a-z0-9]+)(?![^>]*\/>)[^>]*>?/;
        // regex for matching an attribute string that was left open at the endof a line
        // so we can ensure we have the proper indent
        // <div thing="aefaefwe
        const openAttrDoubleRegex = /="([^"]|\\")*$/;
        const openAttrSingleRegex = /='([^']|\\')*$/;
        // regex for matching an attribute string that was closes on a separate line
        // from when it was opened.
        // <div thing="aefaefwe
        //             i18n message is here">
        const closeAttrDoubleRegex = /^\s*([^><]|\\")*"/;
        const closeAttrSingleRegex = /^\s*([^><]|\\')*'/;
        // regex for matching a self closing html element that has no />
        // <input type="button" [binding]="true">
        const selfClosingRegex = new RegExp(`^\\s*<(${selfClosingList}).+\\/?>`);
        // regex for matching a self closing html element that is on multi lines
        // <input type="button" [binding]="true"> || <input type="button" [binding]="true"
        const openSelfClosingRegex = new RegExp(`^\\s*<(${selfClosingList})(?![^>]*\\/>)[^>]*$`);
        // match closing block or else block
        // } | } @else
        const closeBlockRegex = /^\s*\}\s*$|^\s*\}\s\@else/;
        // matches closing of an html element
        // </element>
        const closeElRegex = /\s*<\/([a-zA-Z0-9\-_]+)\s*>/m;
        // matches closing of a self closing html element when the element is on multiple lines
        // [binding]="value" />
        const closeMultiLineElRegex = /^\s*([a-zA-Z0-9\-_\[\]]+)?=?"?([^”<]+)?"?\s?\/>$/;
        // matches closing of a self closing html element when the element is on multiple lines
        // with no / in the closing: [binding]="value">
        const closeSelfClosingMultiLineRegex = /^\s*([a-zA-Z0-9\-_\[\]]+)?=?"?([^”\/<]+)?"?\s?>$/;
        // matches an open and close of an html element on a single line with no breaks
        // <div>blah</div>
        const singleLineElRegex = /\s*<([a-zA-Z0-9]+)(?![^>]*\/>)[^>]*>.*<\/([a-zA-Z0-9\-_]+)\s*>/;
        const lines = tmpl.split('\n');
        const formatted = [];
        // the indent applied during formatting
        let indent = '';
        // the pre-existing indent in an inline template that we'd like to preserve
        let mindent = '';
        let depth = 0;
        let i18nDepth = 0;
        let inMigratedBlock = false;
        let inI18nBlock = false;
        let inAttribute = false;
        let isDoubleQuotes = false;
        for (let [index, line] of lines.entries()) {
            depth +=
                [...line.matchAll(startMarkerRegex)].length - [...line.matchAll(endMarkerRegex)].length;
            inMigratedBlock = depth > 0;
            i18nDepth +=
                [...line.matchAll(startI18nMarkerRegex)].length -
                    [...line.matchAll(endI18nMarkerRegex)].length;
            let lineWasMigrated = false;
            if (line.match(replaceMarkerRegex)) {
                line = line.replace(replaceMarkerRegex, '');
                lineWasMigrated = true;
            }
            if (line.trim() === '' &&
                index !== 0 &&
                index !== lines.length - 1 &&
                (inMigratedBlock || lineWasMigrated) &&
                !inI18nBlock &&
                !inAttribute) {
                // skip blank lines except if it's the first line or last line
                // this preserves leading and trailing spaces if they are already present
                continue;
            }
            // preserves the indentation of an inline template
            if (templateType === 'template' && index <= 1) {
                // first real line of an inline template
                const ind = line.search(/\S/);
                mindent = ind > -1 ? line.slice(0, ind) : '';
            }
            // if a block closes, an element closes, and it's not an element on a single line or the end
            // of a self closing tag
            if ((closeBlockRegex.test(line) ||
                (closeElRegex.test(line) &&
                    !singleLineElRegex.test(line) &&
                    !closeMultiLineElRegex.test(line))) &&
                indent !== '') {
                // close block, reduce indent
                indent = indent.slice(2);
            }
            // if a line ends in an unclosed attribute, we need to note that and close it later
            const isOpenDoubleAttr = openAttrDoubleRegex.test(line);
            const isOpenSingleAttr = openAttrSingleRegex.test(line);
            if (!inAttribute && isOpenDoubleAttr) {
                inAttribute = true;
                isDoubleQuotes = true;
            }
            else if (!inAttribute && isOpenSingleAttr) {
                inAttribute = true;
                isDoubleQuotes = false;
            }
            const newLine = inI18nBlock || inAttribute
                ? line
                : mindent + (line.trim() !== '' ? indent : '') + line.trim();
            formatted.push(newLine);
            if (!isOpenDoubleAttr &&
                !isOpenSingleAttr &&
                ((inAttribute && isDoubleQuotes && closeAttrDoubleRegex.test(line)) ||
                    (inAttribute && !isDoubleQuotes && closeAttrSingleRegex.test(line)))) {
                inAttribute = false;
            }
            // this matches any self closing element that actually has a />
            if (closeMultiLineElRegex.test(line)) {
                // multi line self closing tag
                indent = indent.slice(2);
                if (openSelfClosingEl) {
                    openSelfClosingEl = false;
                }
            }
            // this matches a self closing element that doesn't have a / in the >
            if (closeSelfClosingMultiLineRegex.test(line) && openSelfClosingEl) {
                openSelfClosingEl = false;
                indent = indent.slice(2);
            }
            // this matches an open control flow block, an open HTML element, but excludes single line
            // self closing tags
            if ((openBlockRegex.test(line) || openElRegex.test(line)) &&
                !singleLineElRegex.test(line) &&
                !selfClosingRegex.test(line) &&
                !openSelfClosingRegex.test(line)) {
                // open block, increase indent
                indent += '  ';
            }
            // This is a self closing element that is definitely not fully closed and is on multiple lines
            if (openSelfClosingRegex.test(line)) {
                openSelfClosingEl = true;
                // add to the indent for the properties on it to look nice
                indent += '  ';
            }
            inI18nBlock = i18nDepth > 0;
        }
        tmpl = formatted.join('\n');
    }
    return tmpl;
}
/** Executes a callback on each class declaration in a file. */
function forEachClass(sourceFile, callback) {
    sourceFile.forEachChild(function walk(node) {
        if (ts.isClassDeclaration(node) || ts.isImportDeclaration(node)) {
            callback(node);
        }
        node.forEachChild(walk);
    });
}

const boundcase = '[ngSwitchCase]';
const switchcase = '*ngSwitchCase';
const nakedcase = 'ngSwitchCase';
const switchdefault = '*ngSwitchDefault';
const nakeddefault = 'ngSwitchDefault';
const cases = [boundcase, switchcase, nakedcase, switchdefault, nakeddefault];
/**
 * Replaces structural directive ngSwitch instances with new switch.
 * Returns null if the migration failed (e.g. there was a syntax error).
 */
function migrateCase(template) {
    let errors = [];
    let parsed = parseTemplate(template);
    if (parsed.tree === undefined) {
        return { migrated: template, errors, changed: false };
    }
    let result = template;
    const visitor = new ElementCollector(cases);
    compiler.visitAll$1(visitor, parsed.tree.rootNodes);
    calculateNesting(visitor, hasLineBreaks(template));
    // this tracks the character shift from different lengths of blocks from
    // the prior directives so as to adjust for nested block replacement during
    // migration. Each block calculates length differences and passes that offset
    // to the next migrating block to adjust character offsets properly.
    let offset = 0;
    let nestLevel = -1;
    let postOffsets = [];
    for (const el of visitor.elements) {
        let migrateResult = { tmpl: result, offsets: { pre: 0, post: 0 } };
        // applies the post offsets after closing
        offset = reduceNestingOffset(el, nestLevel, offset, postOffsets);
        if (el.attr.name === switchcase || el.attr.name === nakedcase || el.attr.name === boundcase) {
            try {
                migrateResult = migrateNgSwitchCase(el, result, offset);
            }
            catch (error) {
                errors.push({ type: switchcase, error });
            }
        }
        else if (el.attr.name === switchdefault || el.attr.name === nakeddefault) {
            try {
                migrateResult = migrateNgSwitchDefault(el, result, offset);
            }
            catch (error) {
                errors.push({ type: switchdefault, error });
            }
        }
        result = migrateResult.tmpl;
        offset += migrateResult.offsets.pre;
        postOffsets.push(migrateResult.offsets.post);
        nestLevel = el.nestCount;
    }
    const changed = visitor.elements.length > 0;
    return { migrated: result, errors, changed };
}
function migrateNgSwitchCase(etm, tmpl, offset) {
    // includes the mandatory semicolon before as
    const lbString = etm.hasLineBreaks ? '\n' : '';
    const leadingSpace = etm.hasLineBreaks ? '' : ' ';
    // ngSwitchCases with no values results into `case ()` which isn't valid, based off empty
    // value we add quotes instead of generating empty case
    const condition = etm.attr.value.length === 0 ? `''` : etm.attr.value;
    const originals = getOriginals(etm, tmpl, offset);
    const { start, middle, end } = getMainBlock(etm, tmpl, offset);
    const startBlock = `${startMarker}${leadingSpace}@case (${condition}) {${leadingSpace}${lbString}${start}`;
    const endBlock = `${end}${lbString}${leadingSpace}}${endMarker}`;
    const defaultBlock = startBlock + middle + endBlock;
    const updatedTmpl = tmpl.slice(0, etm.start(offset)) + defaultBlock + tmpl.slice(etm.end(offset));
    // this should be the difference between the starting element up to the start of the closing
    // element and the mainblock sans }
    const pre = originals.start.length - startBlock.length;
    const post = originals.end.length - endBlock.length;
    return { tmpl: updatedTmpl, offsets: { pre, post } };
}
function migrateNgSwitchDefault(etm, tmpl, offset) {
    // includes the mandatory semicolon before as
    const lbString = etm.hasLineBreaks ? '\n' : '';
    const leadingSpace = etm.hasLineBreaks ? '' : ' ';
    const originals = getOriginals(etm, tmpl, offset);
    const { start, middle, end } = getMainBlock(etm, tmpl, offset);
    const startBlock = `${startMarker}${leadingSpace}@default {${leadingSpace}${lbString}${start}`;
    const endBlock = `${end}${lbString}${leadingSpace}}${endMarker}`;
    const defaultBlock = startBlock + middle + endBlock;
    const updatedTmpl = tmpl.slice(0, etm.start(offset)) + defaultBlock + tmpl.slice(etm.end(offset));
    // this should be the difference between the starting element up to the start of the closing
    // element and the mainblock sans }
    const pre = originals.start.length - startBlock.length;
    const post = originals.end.length - endBlock.length;
    return { tmpl: updatedTmpl, offsets: { pre, post } };
}

const ngfor = '*ngFor';
const nakedngfor = 'ngFor';
const fors = [ngfor, nakedngfor];
const commaSeparatedSyntax = new Map([
    ['(', ')'],
    ['{', '}'],
    ['[', ']'],
]);
const stringPairs = new Map([
    [`"`, `"`],
    [`'`, `'`],
]);
/**
 * Replaces structural directive ngFor instances with new for.
 * Returns null if the migration failed (e.g. there was a syntax error).
 */
function migrateFor(template) {
    let errors = [];
    let parsed = parseTemplate(template);
    if (parsed.tree === undefined) {
        return { migrated: template, errors, changed: false };
    }
    let result = template;
    const visitor = new ElementCollector(fors);
    compiler.visitAll$1(visitor, parsed.tree.rootNodes);
    calculateNesting(visitor, hasLineBreaks(template));
    // this tracks the character shift from different lengths of blocks from
    // the prior directives so as to adjust for nested block replacement during
    // migration. Each block calculates length differences and passes that offset
    // to the next migrating block to adjust character offsets properly.
    let offset = 0;
    let nestLevel = -1;
    let postOffsets = [];
    for (const el of visitor.elements) {
        let migrateResult = { tmpl: result, offsets: { pre: 0, post: 0 } };
        // applies the post offsets after closing
        offset = reduceNestingOffset(el, nestLevel, offset, postOffsets);
        try {
            migrateResult = migrateNgFor(el, result, offset);
        }
        catch (error) {
            errors.push({ type: ngfor, error });
        }
        result = migrateResult.tmpl;
        offset += migrateResult.offsets.pre;
        postOffsets.push(migrateResult.offsets.post);
        nestLevel = el.nestCount;
    }
    const changed = visitor.elements.length > 0;
    return { migrated: result, errors, changed };
}
function migrateNgFor(etm, tmpl, offset) {
    if (etm.forAttrs !== undefined) {
        return migrateBoundNgFor(etm, tmpl, offset);
    }
    return migrateStandardNgFor(etm, tmpl, offset);
}
function migrateStandardNgFor(etm, tmpl, offset) {
    const aliasWithEqualRegexp = /=\s*(count|index|first|last|even|odd)/gm;
    const aliasWithAsRegexp = /(count|index|first|last|even|odd)\s+as/gm;
    const aliases = [];
    const lbString = etm.hasLineBreaks ? '\n' : '';
    const parts = getNgForParts(etm.attr.value);
    const originals = getOriginals(etm, tmpl, offset);
    // first portion should always be the loop definition prefixed with `let`
    const condition = parts[0].replace('let ', '');
    if (condition.indexOf(' as ') > -1) {
        let errorMessage = `Found an aliased collection on an ngFor: "${condition}".` +
            ' Collection aliasing is not supported with @for.' +
            ' Refactor the code to remove the `as` alias and re-run the migration.';
        throw new Error(errorMessage);
    }
    const loopVar = condition.split(' of ')[0];
    let trackBy = loopVar;
    let aliasedIndex = null;
    let tmplPlaceholder = '';
    for (let i = 1; i < parts.length; i++) {
        const part = parts[i].trim();
        if (part.startsWith('trackBy:')) {
            // build trackby value
            const trackByFn = part.replace('trackBy:', '').trim();
            trackBy = `${trackByFn}($index, ${loopVar})`;
        }
        // template
        if (part.startsWith('template:')) {
            // use an alternate placeholder here to avoid conflicts
            tmplPlaceholder = getPlaceholder(part.split(':')[1].trim(), PlaceholderKind.Alternate);
        }
        // aliases
        // declared with `let myIndex = index`
        if (part.match(aliasWithEqualRegexp)) {
            // 'let myIndex = index' -> ['let myIndex', 'index']
            const aliasParts = part.split('=');
            const aliasedName = aliasParts[0].replace('let', '').trim();
            const originalName = aliasParts[1].trim();
            if (aliasedName !== '$' + originalName) {
                // -> 'let myIndex = $index'
                aliases.push(` let ${aliasedName} = $${originalName}`);
            }
            // if the aliased variable is the index, then we store it
            if (originalName === 'index') {
                // 'let myIndex' -> 'myIndex'
                aliasedIndex = aliasedName;
            }
        }
        // declared with `index as myIndex`
        if (part.match(aliasWithAsRegexp)) {
            // 'index    as   myIndex' -> ['index', 'myIndex']
            const aliasParts = part.split(/\s+as\s+/);
            const originalName = aliasParts[0].trim();
            const aliasedName = aliasParts[1].trim();
            if (aliasedName !== '$' + originalName) {
                // -> 'let myIndex = $index'
                aliases.push(` let ${aliasedName} = $${originalName}`);
            }
            // if the aliased variable is the index, then we store it
            if (originalName === 'index') {
                aliasedIndex = aliasedName;
            }
        }
    }
    // if an alias has been defined for the index, then the trackBy function must use it
    if (aliasedIndex !== null && trackBy !== loopVar) {
        // byId($index, user) -> byId(i, user)
        trackBy = trackBy.replace('$index', aliasedIndex);
    }
    const aliasStr = aliases.length > 0 ? `;${aliases.join(';')}` : '';
    let startBlock = `${startMarker}@for (${condition}; track ${trackBy}${aliasStr}) {${lbString}`;
    let endBlock = `${lbString}}${endMarker}`;
    let forBlock = '';
    if (tmplPlaceholder !== '') {
        startBlock = startBlock + tmplPlaceholder;
        forBlock = startBlock + endBlock;
    }
    else {
        const { start, middle, end } = getMainBlock(etm, tmpl, offset);
        startBlock += start;
        endBlock = end + endBlock;
        forBlock = startBlock + middle + endBlock;
    }
    const updatedTmpl = tmpl.slice(0, etm.start(offset)) + forBlock + tmpl.slice(etm.end(offset));
    const pre = originals.start.length - startBlock.length;
    const post = originals.end.length - endBlock.length;
    return { tmpl: updatedTmpl, offsets: { pre, post } };
}
function migrateBoundNgFor(etm, tmpl, offset) {
    const forAttrs = etm.forAttrs;
    const aliasAttrs = etm.aliasAttrs;
    const aliasMap = aliasAttrs.aliases;
    const originals = getOriginals(etm, tmpl, offset);
    const condition = `${aliasAttrs.item} of ${forAttrs.forOf}`;
    const aliases = [];
    let aliasedIndex = '$index';
    for (const [key, val] of aliasMap) {
        aliases.push(` let ${key.trim()} = $${val}`);
        if (val.trim() === 'index') {
            aliasedIndex = key;
        }
    }
    const aliasStr = aliases.length > 0 ? `;${aliases.join(';')}` : '';
    let trackBy = aliasAttrs.item;
    if (forAttrs.trackBy !== '') {
        // build trackby value
        trackBy = `${forAttrs.trackBy.trim()}(${aliasedIndex}, ${aliasAttrs.item})`;
    }
    const { start, middle, end } = getMainBlock(etm, tmpl, offset);
    const startBlock = `${startMarker}@for (${condition}; track ${trackBy}${aliasStr}) {\n${start}`;
    const endBlock = `${end}\n}${endMarker}`;
    const forBlock = startBlock + middle + endBlock;
    const updatedTmpl = tmpl.slice(0, etm.start(offset)) + forBlock + tmpl.slice(etm.end(offset));
    const pre = originals.start.length - startBlock.length;
    const post = originals.end.length - endBlock.length;
    return { tmpl: updatedTmpl, offsets: { pre, post } };
}
function getNgForParts(expression) {
    const parts = [];
    const commaSeparatedStack = [];
    const stringStack = [];
    let current = '';
    for (let i = 0; i < expression.length; i++) {
        const char = expression[i];
        const isInString = stringStack.length === 0;
        const isInCommaSeparated = commaSeparatedStack.length === 0;
        // Any semicolon is a delimiter, as well as any comma outside
        // of comma-separated syntax, as long as they're outside of a string.
        if (isInString &&
            current.length > 0 &&
            (char === ';' || (char === ',' && isInCommaSeparated))) {
            parts.push(current);
            current = '';
            continue;
        }
        if (stringStack.length > 0 && stringStack[stringStack.length - 1] === char) {
            stringStack.pop();
        }
        else if (stringPairs.has(char)) {
            stringStack.push(stringPairs.get(char));
        }
        if (commaSeparatedSyntax.has(char)) {
            commaSeparatedStack.push(commaSeparatedSyntax.get(char));
        }
        else if (commaSeparatedStack.length > 0 &&
            commaSeparatedStack[commaSeparatedStack.length - 1] === char) {
            commaSeparatedStack.pop();
        }
        current += char;
    }
    if (current.length > 0) {
        parts.push(current);
    }
    return parts;
}

const ngif = '*ngIf';
const boundngif = '[ngIf]';
const nakedngif = 'ngIf';
const ifs = [ngif, nakedngif, boundngif];
/**
 * Replaces structural directive ngif instances with new if.
 * Returns null if the migration failed (e.g. there was a syntax error).
 */
function migrateIf(template) {
    let errors = [];
    let parsed = parseTemplate(template);
    if (parsed.tree === undefined) {
        return { migrated: template, errors, changed: false };
    }
    let result = template;
    const visitor = new ElementCollector(ifs);
    compiler.visitAll$1(visitor, parsed.tree.rootNodes);
    calculateNesting(visitor, hasLineBreaks(template));
    // this tracks the character shift from different lengths of blocks from
    // the prior directives so as to adjust for nested block replacement during
    // migration. Each block calculates length differences and passes that offset
    // to the next migrating block to adjust character offsets properly.
    let offset = 0;
    let nestLevel = -1;
    let postOffsets = [];
    for (const el of visitor.elements) {
        let migrateResult = { tmpl: result, offsets: { pre: 0, post: 0 } };
        // applies the post offsets after closing
        offset = reduceNestingOffset(el, nestLevel, offset, postOffsets);
        try {
            migrateResult = migrateNgIf(el, result, offset);
        }
        catch (error) {
            errors.push({ type: ngif, error });
        }
        result = migrateResult.tmpl;
        offset += migrateResult.offsets.pre;
        postOffsets.push(migrateResult.offsets.post);
        nestLevel = el.nestCount;
    }
    const changed = visitor.elements.length > 0;
    return { migrated: result, errors, changed };
}
function migrateNgIf(etm, tmpl, offset) {
    const matchThen = etm.attr.value.match(/[^\w\d];?\s*then/gm);
    const matchElse = etm.attr.value.match(/[^\w\d];?\s*else/gm);
    if (etm.thenAttr !== undefined || etm.elseAttr !== undefined) {
        // bound if then / if then else
        return buildBoundIfElseBlock(etm, tmpl, offset);
    }
    else if (matchThen && matchThen.length > 0 && matchElse && matchElse.length > 0) {
        // then else
        return buildStandardIfThenElseBlock(etm, tmpl, matchThen[0], matchElse[0], offset);
    }
    else if (matchThen && matchThen.length > 0) {
        // just then
        return buildStandardIfThenBlock(etm, tmpl, matchThen[0], offset);
    }
    else if (matchElse && matchElse.length > 0) {
        // just else
        return buildStandardIfElseBlock(etm, tmpl, matchElse[0], offset);
    }
    return buildIfBlock(etm, tmpl, offset);
}
function buildIfBlock(etm, tmpl, offset) {
    const aliasAttrs = etm.aliasAttrs;
    const aliases = [...aliasAttrs.aliases.keys()];
    if (aliasAttrs.item) {
        aliases.push(aliasAttrs.item);
    }
    // includes the mandatory semicolon before as
    const lbString = etm.hasLineBreaks ? '\n' : '';
    let condition = etm.attr.value
        .replace(' as ', '; as ')
        // replace 'let' with 'as' whatever spaces are between ; and 'let'
        .replace(/;\s*let/g, '; as');
    if (aliases.length > 1 || (aliases.length === 1 && condition.indexOf('; as') > -1)) {
        // only 1 alias allowed
        throw new Error('Found more than one alias on your ngIf. Remove one of them and re-run the migration.');
    }
    else if (aliases.length === 1) {
        condition += `; as ${aliases[0]}`;
    }
    const originals = getOriginals(etm, tmpl, offset);
    const { start, middle, end } = getMainBlock(etm, tmpl, offset);
    const startBlock = `${startMarker}@if (${condition}) {${lbString}${start}`;
    const endBlock = `${end}${lbString}}${endMarker}`;
    const ifBlock = startBlock + middle + endBlock;
    const updatedTmpl = tmpl.slice(0, etm.start(offset)) + ifBlock + tmpl.slice(etm.end(offset));
    // this should be the difference between the starting element up to the start of the closing
    // element and the mainblock sans }
    const pre = originals.start.length - startBlock.length;
    const post = originals.end.length - endBlock.length;
    return { tmpl: updatedTmpl, offsets: { pre, post } };
}
function buildStandardIfElseBlock(etm, tmpl, elseString, offset) {
    // includes the mandatory semicolon before as
    const condition = etm
        .getCondition()
        .replace(' as ', '; as ')
        // replace 'let' with 'as' whatever spaces are between ; and 'let'
        .replace(/;\s*let/g, '; as');
    const elsePlaceholder = getPlaceholder(etm.getTemplateName(elseString));
    return buildIfElseBlock(etm, tmpl, condition, elsePlaceholder, offset);
}
function buildBoundIfElseBlock(etm, tmpl, offset) {
    const aliasAttrs = etm.aliasAttrs;
    const aliases = [...aliasAttrs.aliases.keys()];
    if (aliasAttrs.item) {
        aliases.push(aliasAttrs.item);
    }
    // includes the mandatory semicolon before as
    let condition = etm.attr.value.replace(' as ', '; as ');
    if (aliases.length > 1 || (aliases.length === 1 && condition.indexOf('; as') > -1)) {
        // only 1 alias allowed
        throw new Error('Found more than one alias on your ngIf. Remove one of them and re-run the migration.');
    }
    else if (aliases.length === 1) {
        condition += `; as ${aliases[0]}`;
    }
    const elsePlaceholder = getPlaceholder(etm.elseAttr.value.trim());
    if (etm.thenAttr !== undefined) {
        const thenPlaceholder = getPlaceholder(etm.thenAttr.value.trim());
        return buildIfThenElseBlock(etm, tmpl, condition, thenPlaceholder, elsePlaceholder, offset);
    }
    return buildIfElseBlock(etm, tmpl, condition, elsePlaceholder, offset);
}
function buildIfElseBlock(etm, tmpl, condition, elsePlaceholder, offset) {
    const lbString = etm.hasLineBreaks ? '\n' : '';
    const originals = getOriginals(etm, tmpl, offset);
    const { start, middle, end } = getMainBlock(etm, tmpl, offset);
    const startBlock = `${startMarker}@if (${condition}) {${lbString}${start}`;
    const elseBlock = `${end}${lbString}} @else {${lbString}`;
    const postBlock = elseBlock + elsePlaceholder + `${lbString}}${endMarker}`;
    const ifElseBlock = startBlock + middle + postBlock;
    const tmplStart = tmpl.slice(0, etm.start(offset));
    const tmplEnd = tmpl.slice(etm.end(offset));
    const updatedTmpl = tmplStart + ifElseBlock + tmplEnd;
    const pre = originals.start.length - startBlock.length;
    const post = originals.end.length - postBlock.length;
    return { tmpl: updatedTmpl, offsets: { pre, post } };
}
function buildStandardIfThenElseBlock(etm, tmpl, thenString, elseString, offset) {
    // includes the mandatory semicolon before as
    const condition = etm
        .getCondition()
        .replace(' as ', '; as ')
        // replace 'let' with 'as' whatever spaces are between ; and 'let'
        .replace(/;\s*let/g, '; as');
    const thenPlaceholder = getPlaceholder(etm.getTemplateName(thenString, elseString));
    const elsePlaceholder = getPlaceholder(etm.getTemplateName(elseString));
    return buildIfThenElseBlock(etm, tmpl, condition, thenPlaceholder, elsePlaceholder, offset);
}
function buildStandardIfThenBlock(etm, tmpl, thenString, offset) {
    // includes the mandatory semicolon before as
    const condition = etm
        .getCondition()
        .replace(' as ', '; as ')
        // replace 'let' with 'as' whatever spaces are between ; and 'let'
        .replace(/;\s*let/g, '; as');
    const thenPlaceholder = getPlaceholder(etm.getTemplateName(thenString));
    return buildIfThenBlock(etm, tmpl, condition, thenPlaceholder, offset);
}
function buildIfThenElseBlock(etm, tmpl, condition, thenPlaceholder, elsePlaceholder, offset) {
    const lbString = etm.hasLineBreaks ? '\n' : '';
    const originals = getOriginals(etm, tmpl, offset);
    const startBlock = `${startMarker}@if (${condition}) {${lbString}`;
    const elseBlock = `${lbString}} @else {${lbString}`;
    const postBlock = thenPlaceholder + elseBlock + elsePlaceholder + `${lbString}}${endMarker}`;
    const ifThenElseBlock = startBlock + postBlock;
    const tmplStart = tmpl.slice(0, etm.start(offset));
    const tmplEnd = tmpl.slice(etm.end(offset));
    const updatedTmpl = tmplStart + ifThenElseBlock + tmplEnd;
    // We ignore the contents of the element on if then else.
    // If there's anything there, we need to account for the length in the offset.
    const pre = originals.start.length + originals.childLength - startBlock.length;
    const post = originals.end.length - postBlock.length;
    return { tmpl: updatedTmpl, offsets: { pre, post } };
}
function buildIfThenBlock(etm, tmpl, condition, thenPlaceholder, offset) {
    const lbString = etm.hasLineBreaks ? '\n' : '';
    const originals = getOriginals(etm, tmpl, offset);
    const startBlock = `${startMarker}@if (${condition}) {${lbString}`;
    const postBlock = thenPlaceholder + `${lbString}}${endMarker}`;
    const ifThenBlock = startBlock + postBlock;
    const tmplStart = tmpl.slice(0, etm.start(offset));
    const tmplEnd = tmpl.slice(etm.end(offset));
    const updatedTmpl = tmplStart + ifThenBlock + tmplEnd;
    // We ignore the contents of the element on if then else.
    // If there's anything there, we need to account for the length in the offset.
    const pre = originals.start.length + originals.childLength - startBlock.length;
    const post = originals.end.length - postBlock.length;
    return { tmpl: updatedTmpl, offsets: { pre, post } };
}

const ngswitch = '[ngSwitch]';
const switches = [ngswitch];
/**
 * Replaces structural directive ngSwitch instances with new switch.
 * Returns null if the migration failed (e.g. there was a syntax error).
 */
function migrateSwitch(template) {
    let errors = [];
    let parsed = parseTemplate(template);
    if (parsed.tree === undefined) {
        return { migrated: template, errors, changed: false };
    }
    let result = template;
    const visitor = new ElementCollector(switches);
    compiler.visitAll$1(visitor, parsed.tree.rootNodes);
    calculateNesting(visitor, hasLineBreaks(template));
    // this tracks the character shift from different lengths of blocks from
    // the prior directives so as to adjust for nested block replacement during
    // migration. Each block calculates length differences and passes that offset
    // to the next migrating block to adjust character offsets properly.
    let offset = 0;
    let nestLevel = -1;
    let postOffsets = [];
    for (const el of visitor.elements) {
        let migrateResult = { tmpl: result, offsets: { pre: 0, post: 0 } };
        // applies the post offsets after closing
        offset = reduceNestingOffset(el, nestLevel, offset, postOffsets);
        if (el.attr.name === ngswitch) {
            try {
                migrateResult = migrateNgSwitch(el, result, offset);
            }
            catch (error) {
                errors.push({ type: ngswitch, error });
            }
        }
        result = migrateResult.tmpl;
        offset += migrateResult.offsets.pre;
        postOffsets.push(migrateResult.offsets.post);
        nestLevel = el.nestCount;
    }
    const changed = visitor.elements.length > 0;
    return { migrated: result, errors, changed };
}
function assertValidSwitchStructure(children) {
    for (const child of children) {
        if (child instanceof compiler.Text && child.value.trim() !== '') {
            throw new Error(`Text node: "${child.value}" would result in invalid migrated @switch block structure. ` +
                `@switch can only have @case or @default as children.`);
        }
        else if (child instanceof compiler.Element$1) {
            let hasCase = false;
            for (const attr of child.attrs) {
                if (cases.includes(attr.name)) {
                    hasCase = true;
                }
            }
            if (!hasCase) {
                throw new Error(`Element node: "${child.name}" would result in invalid migrated @switch block structure. ` +
                    `@switch can only have @case or @default as children.`);
            }
        }
    }
}
function migrateNgSwitch(etm, tmpl, offset) {
    const lbString = etm.hasLineBreaks ? '\n' : '';
    const condition = etm.attr.value;
    const originals = getOriginals(etm, tmpl, offset);
    assertValidSwitchStructure(originals.childNodes);
    const { start, middle, end } = getMainBlock(etm, tmpl, offset);
    const startBlock = `${startMarker}${start}${lbString}@switch (${condition}) {`;
    const endBlock = `}${lbString}${end}${endMarker}`;
    const switchBlock = startBlock + middle + endBlock;
    const updatedTmpl = tmpl.slice(0, etm.start(offset)) + switchBlock + tmpl.slice(etm.end(offset));
    // this should be the difference between the starting element up to the start of the closing
    // element and the mainblock sans }
    const pre = originals.start.length - startBlock.length;
    const post = originals.end.length - endBlock.length;
    return { tmpl: updatedTmpl, offsets: { pre, post } };
}

/**
 * Actually migrates a given template to the new syntax
 */
function migrateTemplate(template, templateType, node, file, format = true, analyzedFiles) {
    let errors = [];
    let migrated = template;
    if (templateType === 'template' || templateType === 'templateUrl') {
        const ifResult = migrateIf(template);
        const forResult = migrateFor(ifResult.migrated);
        const switchResult = migrateSwitch(forResult.migrated);
        if (switchResult.errors.length > 0) {
            return { migrated: template, errors: switchResult.errors };
        }
        const caseResult = migrateCase(switchResult.migrated);
        const templateResult = processNgTemplates(caseResult.migrated, file.sourceFile);
        if (templateResult.err !== undefined) {
            return { migrated: template, errors: [{ type: 'template', error: templateResult.err }] };
        }
        migrated = templateResult.migrated;
        const changed = ifResult.changed || forResult.changed || switchResult.changed || caseResult.changed;
        if (changed) {
            // determine if migrated template is a valid structure
            // if it is not, fail out
            const errors = validateMigratedTemplate(migrated, file.sourceFile.fileName);
            if (errors.length > 0) {
                return { migrated: template, errors };
            }
        }
        if (format && changed) {
            migrated = formatTemplate(migrated, templateType);
        }
        const markerRegex = new RegExp(`${startMarker}|${endMarker}|${startI18nMarker}|${endI18nMarker}`, 'gm');
        migrated = migrated.replace(markerRegex, '');
        file.removeCommonModule = canRemoveCommonModule(template);
        file.canRemoveImports = true;
        // when migrating an external template, we have to pass back
        // whether it's safe to remove the CommonModule to the
        // original component class source file
        if (templateType === 'templateUrl' &&
            analyzedFiles !== null &&
            analyzedFiles.has(file.sourceFile.fileName)) {
            const componentFile = analyzedFiles.get(file.sourceFile.fileName);
            componentFile.getSortedRanges();
            // we have already checked the template file to see if it is safe to remove the imports
            // and common module. This check is passed off to the associated .ts file here so
            // the class knows whether it's safe to remove from the template side.
            componentFile.removeCommonModule = file.removeCommonModule;
            componentFile.canRemoveImports = file.canRemoveImports;
            // At this point, we need to verify the component class file doesn't have any other imports
            // that prevent safe removal of common module. It could be that there's an associated ngmodule
            // and in that case we can't safely remove the common module import.
            componentFile.verifyCanRemoveImports();
        }
        file.verifyCanRemoveImports();
        errors = [
            ...ifResult.errors,
            ...forResult.errors,
            ...switchResult.errors,
            ...caseResult.errors,
        ];
    }
    else if (file.canRemoveImports) {
        migrated = removeImports(template, node, file);
    }
    return { migrated, errors };
}

function migrate() {
    return async (tree, context) => {
        const { buildPaths, testPaths } = await project_tsconfig_paths.getProjectTsConfigPaths(tree);
        const basePath = process.cwd();
        const allPaths = [...buildPaths, ...testPaths];
        if (!allPaths.length) {
            throw new schematics.SchematicsException('Could not find any tsconfig file. Cannot run the http providers migration.');
        }
        let errors = [];
        for (const tsconfigPath of allPaths) {
            const migrateErrors = runControlFlowMigration(tree, tsconfigPath, basePath);
            errors = [...errors, ...migrateErrors];
        }
        if (errors.length > 0) {
            context.logger.warn(`WARNING: ${errors.length} errors occurred during your migration:\n`);
            errors.forEach((err) => {
                context.logger.warn(err);
            });
        }
    };
}
function runControlFlowMigration(tree, tsconfigPath, basePath) {
    const program = compiler_host.createMigrationProgram(tree, tsconfigPath, basePath);
    const sourceFiles = program
        .getSourceFiles()
        .filter((sourceFile) => compiler_host.canMigrateFile(basePath, sourceFile, program));
    const analysis = new Map();
    const migrateErrors = new Map();
    for (const sourceFile of sourceFiles) {
        analyze(sourceFile, analysis);
    }
    // sort files with .html files first
    // this ensures class files know if it's safe to remove CommonModule
    const paths = sortFilePaths([...analysis.keys()]);
    for (const path of paths) {
        const file = analysis.get(path);
        const ranges = file.getSortedRanges();
        const relativePath = p.relative(basePath, path);
        const content = tree.readText(relativePath);
        const update = tree.beginUpdate(relativePath);
        for (const { start, end, node, type } of ranges) {
            const template = content.slice(start, end);
            const length = (end ?? content.length) - start;
            const { migrated, errors } = migrateTemplate(template, type, node, file, true, analysis);
            if (migrated !== null) {
                update.remove(start, length);
                update.insertLeft(start, migrated);
            }
            if (errors.length > 0) {
                migrateErrors.set(path, errors);
            }
        }
        tree.commitUpdate(update);
    }
    const errorList = [];
    for (let [template, errors] of migrateErrors) {
        errorList.push(generateErrorMessage(template, errors));
    }
    return errorList;
}
function sortFilePaths(names) {
    names.sort((a, _) => (a.endsWith('.html') ? -1 : 0));
    return names;
}
function generateErrorMessage(path, errors) {
    let errorMessage = `Template "${path}" encountered ${errors.length} errors during migration:\n`;
    errorMessage += errors.map((e) => ` - ${e.type}: ${e.error}\n`);
    return errorMessage;
}

exports.migrate = migrate;
