'use strict';
/**
 * @license Angular v21.0.0-next.0+sha-f4f5a8a
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var project_tsconfig_paths = require('./project_tsconfig_paths-D7xzGqRi.cjs');

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

exports.parseTemplate = parseTemplate;
