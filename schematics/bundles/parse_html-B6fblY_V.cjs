'use strict';
/**
 * @license Angular v21.0.0-next.6+sha-9eac43c
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var project_tsconfig_paths = require('./project_tsconfig_paths-sFatqIE5.cjs');

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
        parsed = new project_tsconfig_paths.HtmlParser().parse(template, '', {
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
    '*ngIf',
    '*ngSwitch',
    '*ngFor',
]);
/**
 * determines if the CommonModule can be safely removed from imports
 */
function canRemoveCommonModule(template) {
    const parsed = parseTemplate(template);
    let removeCommonModule = false;
    if (parsed.tree !== undefined) {
        const visitor = new CommonCollector();
        project_tsconfig_paths.visitAll$1(visitor, parsed.tree.rootNodes);
        removeCommonModule = visitor.count === 0;
    }
    return removeCommonModule;
}
/** Finds all non-control flow elements from common module. */
class CommonCollector extends project_tsconfig_paths.RecursiveVisitor$1 {
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

exports.canRemoveCommonModule = canRemoveCommonModule;
exports.parseTemplate = parseTemplate;
