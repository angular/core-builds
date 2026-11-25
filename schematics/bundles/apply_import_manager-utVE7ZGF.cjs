'use strict';
/**
 * @license Angular v22.4.0-next.0+sha-63fa515
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
'use strict';

var ts = require('typescript');
var compilerCli = require('@angular/compiler-cli');
var project_paths = require('./project_paths-CEexbl9C.cjs');

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
            replacements.push(new project_paths.Replacement(project_paths.projectFile(compilerCli.absoluteFrom(fileName), info), new project_paths.TextUpdate({ position: 0, end: 0, toInsert: `${printedImport}\n` })));
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
        const sf = removedImport.getSourceFile();
        const text = sf.getFullText();
        let start = removedImport.getStart();
        let end = removedImport.getEnd();
        // Remove leading horizontal whitespace on the same line if nothing precedes the import.
        let lineStart = start;
        while (lineStart > 0 && (text[lineStart - 1] === ' ' || text[lineStart - 1] === '\t')) {
            lineStart--;
        }
        const isAtLineStart = lineStart === 0 || text[lineStart - 1] === '\n' || text[lineStart - 1] === '\r';
        if (isAtLineStart) {
            start = lineStart;
        }
        // Remove trailing horizontal whitespace and a single line break if nothing else follows.
        if (isAtLineStart) {
            let lineEnd = end;
            while (lineEnd < text.length && (text[lineEnd] === ' ' || text[lineEnd] === '\t')) {
                lineEnd++;
            }
            if (text[lineEnd] === '\r' && text[lineEnd + 1] === '\n') {
                end = lineEnd + 2;
            }
            else if (text[lineEnd] === '\n' || text[lineEnd] === '\r') {
                end = lineEnd + 1;
            }
        }
        replacements.push(new project_paths.Replacement(project_paths.projectFile(sf, info), new project_paths.TextUpdate({
            position: start,
            end,
            toInsert: '',
        })));
    }
}

exports.applyImportManagerChanges = applyImportManagerChanges;
