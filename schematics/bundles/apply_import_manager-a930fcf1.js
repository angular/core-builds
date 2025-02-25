'use strict';
/**
 * @license Angular v19.2.0-rc.0+sha-ce3a9a2
 * (c) 2010-2024 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var ts = require('typescript');
require('os');
var checker = require('./checker-2eecc677.js');
var project_paths = require('./project_paths-b073c4d6.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var ts__default = /*#__PURE__*/_interopDefaultLegacy(ts);

/**
 * Applies import manager changes, and writes them as replacements the
 * given result array.
 */
function applyImportManagerChanges(importManager, replacements, sourceFiles, info) {
    const { newImports, updatedImports, deletedImports } = importManager.finalize();
    const printer = ts__default["default"].createPrinter({});
    const pathToFile = new Map(sourceFiles.map((s) => [s.fileName, s]));
    // Capture new imports
    newImports.forEach((newImports, fileName) => {
        newImports.forEach((newImport) => {
            const printedImport = printer.printNode(ts__default["default"].EmitHint.Unspecified, newImport, pathToFile.get(fileName));
            replacements.push(new project_paths.Replacement(project_paths.projectFile(checker.absoluteFrom(fileName), info), new project_paths.TextUpdate({ position: 0, end: 0, toInsert: `${printedImport}\n` })));
        });
    });
    // Capture updated imports
    for (const [oldBindings, newBindings] of updatedImports.entries()) {
        // The import will be generated as multi-line if it already is multi-line,
        // or if the number of elements significantly increased and it previously
        // consisted of very few specifiers.
        const isMultiline = oldBindings.getText().includes('\n') ||
            (newBindings.elements.length >= 6 && oldBindings.elements.length <= 3);
        const hasSpaceBetweenBraces = oldBindings.getText().startsWith('{ ');
        let formatFlags = ts__default["default"].ListFormat.NamedImportsOrExportsElements |
            ts__default["default"].ListFormat.Indented |
            ts__default["default"].ListFormat.Braces |
            ts__default["default"].ListFormat.PreserveLines |
            (isMultiline ? ts__default["default"].ListFormat.MultiLine : ts__default["default"].ListFormat.SingleLine);
        if (hasSpaceBetweenBraces) {
            formatFlags |= ts__default["default"].ListFormat.SpaceBetweenBraces;
        }
        else {
            formatFlags &= ~ts__default["default"].ListFormat.SpaceBetweenBraces;
        }
        const printedBindings = printer.printList(formatFlags, newBindings.elements, oldBindings.getSourceFile());
        replacements.push(new project_paths.Replacement(project_paths.projectFile(oldBindings.getSourceFile(), info), new project_paths.TextUpdate({
            position: oldBindings.getStart(),
            end: oldBindings.getEnd(),
            // TS uses four spaces as indent. We migrate to two spaces as we
            // assume this to be more common.
            toInsert: printedBindings.replace(/^ {4}/gm, '  '),
        })));
    }
    // Update removed imports
    for (const removedImport of deletedImports) {
        replacements.push(new project_paths.Replacement(project_paths.projectFile(removedImport.getSourceFile(), info), new project_paths.TextUpdate({
            position: removedImport.getStart(),
            end: removedImport.getEnd(),
            toInsert: '',
        })));
    }
}

exports.applyImportManagerChanges = applyImportManagerChanges;
