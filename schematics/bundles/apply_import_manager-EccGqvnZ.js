'use strict';
/**
 * @license Angular v20.0.0-rc.1+sha-c0fb34b
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var ts = require('typescript');
require('os');
var checker = require('./checker-C-1ft_Lg.js');
var project_paths = require('./project_paths-DDAlTEip.js');

/**
 * Applies import manager changes, and writes them as replacements the
 * given result array.
 */
function applyImportManagerChanges(importManager, replacements, sourceFiles, info) {
    const { newImports, updatedImports, deletedImports } = importManager.finalize();
    const printer = ts.createPrinter({});
    const pathToFile = new Map(sourceFiles.map((s) => [s.fileName, s]));
    // Capture new imports
    newImports.forEach((newImports, fileName) => {
        newImports.forEach((newImport) => {
            const printedImport = printer.printNode(ts.EmitHint.Unspecified, newImport, pathToFile.get(fileName));
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
        let formatFlags = ts.ListFormat.NamedImportsOrExportsElements |
            ts.ListFormat.Indented |
            ts.ListFormat.Braces |
            ts.ListFormat.PreserveLines |
            (isMultiline ? ts.ListFormat.MultiLine : ts.ListFormat.SingleLine);
        if (hasSpaceBetweenBraces) {
            formatFlags |= ts.ListFormat.SpaceBetweenBraces;
        }
        else {
            formatFlags &= ~ts.ListFormat.SpaceBetweenBraces;
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
