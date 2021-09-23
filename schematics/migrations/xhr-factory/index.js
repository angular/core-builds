(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/migrations/xhr-factory", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/imports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const imports_1 = require("@angular/core/schematics/utils/typescript/imports");
    function* visit(directory) {
        for (const path of directory.subfiles) {
            if (path.endsWith('.ts') && !path.endsWith('.d.ts')) {
                const entry = directory.file(path);
                if (entry) {
                    const content = entry.content;
                    if (content.includes('XhrFactory')) {
                        const source = ts.createSourceFile(entry.path, content.toString().replace(/^\uFEFF/, ''), ts.ScriptTarget.Latest, true);
                        yield source;
                    }
                }
            }
        }
        for (const path of directory.subdirs) {
            if (path === 'node_modules' || path.startsWith('.')) {
                continue;
            }
            yield* visit(directory.dir(path));
        }
    }
    function default_1() {
        return tree => {
            const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
            for (const sourceFile of visit(tree.root)) {
                let recorder;
                const allImportDeclarations = sourceFile.statements.filter(n => ts.isImportDeclaration(n));
                if (allImportDeclarations.length === 0) {
                    continue;
                }
                const httpCommonImport = findImportDeclaration('@angular/common/http', allImportDeclarations);
                if (!httpCommonImport) {
                    continue;
                }
                const commonHttpNamedBinding = getNamedImports(httpCommonImport);
                if (commonHttpNamedBinding) {
                    const commonHttpNamedImports = commonHttpNamedBinding.elements;
                    const xhrFactorySpecifier = (0, imports_1.findImportSpecifier)(commonHttpNamedImports, 'XhrFactory');
                    if (!xhrFactorySpecifier) {
                        continue;
                    }
                    recorder = tree.beginUpdate(sourceFile.fileName);
                    // Remove 'XhrFactory' from '@angular/common/http'
                    if (commonHttpNamedImports.length > 1) {
                        // Remove 'XhrFactory' named import
                        const index = commonHttpNamedBinding.getStart();
                        const length = commonHttpNamedBinding.getWidth();
                        const newImports = printer.printNode(ts.EmitHint.Unspecified, ts.factory.updateNamedImports(commonHttpNamedBinding, commonHttpNamedBinding.elements.filter(e => e !== xhrFactorySpecifier)), sourceFile);
                        recorder.remove(index, length).insertLeft(index, newImports);
                    }
                    else {
                        // Remove '@angular/common/http' import
                        const index = httpCommonImport.getFullStart();
                        const length = httpCommonImport.getFullWidth();
                        recorder.remove(index, length);
                    }
                    // Import XhrFactory from @angular/common
                    const commonImport = findImportDeclaration('@angular/common', allImportDeclarations);
                    const commonNamedBinding = getNamedImports(commonImport);
                    if (commonNamedBinding) {
                        // Already has an import for '@angular/common', just add the named import.
                        const index = commonNamedBinding.getStart();
                        const length = commonNamedBinding.getWidth();
                        const newImports = printer.printNode(ts.EmitHint.Unspecified, ts.factory.updateNamedImports(commonNamedBinding, [...commonNamedBinding.elements, xhrFactorySpecifier]), sourceFile);
                        recorder.remove(index, length).insertLeft(index, newImports);
                    }
                    else {
                        // Add import to '@angular/common'
                        const index = httpCommonImport.getFullStart();
                        recorder.insertLeft(index, `\nimport { XhrFactory } from '@angular/common';`);
                    }
                }
                if (recorder) {
                    tree.commitUpdate(recorder);
                }
            }
        };
    }
    exports.default = default_1;
    function findImportDeclaration(moduleSpecifier, importDeclarations) {
        return importDeclarations.find(n => ts.isStringLiteral(n.moduleSpecifier) && n.moduleSpecifier.text === moduleSpecifier);
    }
    function getNamedImports(importDeclaration) {
        var _a;
        const namedBindings = (_a = importDeclaration === null || importDeclaration === void 0 ? void 0 : importDeclaration.importClause) === null || _a === void 0 ? void 0 : _a.namedBindings;
        if (namedBindings && ts.isNamedImports(namedBindings)) {
            return namedBindings;
        }
        return undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy94aHItZmFjdG9yeS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQVFBLGlDQUFpQztJQUNqQywrRUFBbUU7SUFFbkUsUUFBUSxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQW1CO1FBQ2pDLEtBQUssTUFBTSxJQUFJLElBQUksU0FBUyxDQUFDLFFBQVEsRUFBRTtZQUNyQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNuRCxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNuQyxJQUFJLEtBQUssRUFBRTtvQkFDVCxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO29CQUM5QixJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLEVBQUU7d0JBQ2xDLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FDOUIsS0FBSyxDQUFDLElBQUksRUFDVixPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsRUFDekMsRUFBRSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQ3RCLElBQUksQ0FDUCxDQUFDO3dCQUVGLE1BQU0sTUFBTSxDQUFDO3FCQUNkO2lCQUNGO2FBQ0Y7U0FDRjtRQUVELEtBQUssTUFBTSxJQUFJLElBQUksU0FBUyxDQUFDLE9BQU8sRUFBRTtZQUNwQyxJQUFJLElBQUksS0FBSyxjQUFjLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDbkQsU0FBUzthQUNWO1lBRUQsS0FBSyxDQUFDLENBQUMs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QUN0QjtRQUVELE9BQU8sU0FBUyxDQUFDO0lBQ25CLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7RGlyRW50cnksIFJ1bGUsIFVwZGF0ZVJlY29yZGVyfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7ZmluZEltcG9ydFNwZWNpZmllcn0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9pbXBvcnRzJztcblxuZnVuY3Rpb24qIHZpc2l0KGRpcmVjdG9yeTogRGlyRW50cnkpOiBJdGVyYWJsZUl0ZXJhdG9yPHRzLlNvdXJjZUZpbGU+IHtcbiAgZm9yIChjb25zdCBwYXRoIG9mIGRpcmVjdG9yeS5zdWJmaWxlcykge1xuICAgIGlmIChwYXRoLmVuZHNXaXRoKCcudHMnKSAmJiAhcGF0aC5lbmRzV2l0aCgnLmQudHMnKSkge1xuICAgICAgY29uc3QgZW50cnkgPSBkaXJlY3RvcnkuZmlsZShwYXRoKTtcbiAgICAgIGlmIChlbnRyeSkge1xuICAgICAgICBjb25zdCBjb250ZW50ID0gZW50cnkuY29udGVudDtcbiAgICAgICAgaWYgKGNvbnRlbnQuaW5jbHVkZXMoJ1hockZhY3RvcnknKSkge1xuICAgICAgICAgIGNvbnN0IHNvdXJjZSA9IHRzLmNyZWF0ZVNvdXJjZUZpbGUoXG4gICAgICAgICAgICAgIGVudHJ5LnBhdGgsXG4gICAgICAgICAgICAgIGNvbnRlbnQudG9TdHJpbmcoKS5yZXBsYWNlKC9eXFx1RkVGRi8sICcnKSxcbiAgICAgICAgICAgICAgdHMuU2NyaXB0VGFyZ2V0LkxhdGVzdCxcbiAgICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgeWllbGQgc291cmNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZm9yIChjb25zdCBwYXRoIG9mIGRpcmVjdG9yeS5zdWJkaXJzKSB7XG4gICAgaWYgKHBhdGggPT09ICdub2RlX21vZHVsZXMnIHx8IHBhdGguc3RhcnRzV2l0aCgnLicpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICB5aWVsZCogdmlzaXQoZGlyZWN0b3J5LmRpcihwYXRoKSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKTogUnVsZSB7XG4gIHJldHVybiB0cmVlID0+IHtcbiAgICBjb25zdCBwcmludGVyID0gdHMuY3JlYXRlUHJpbnRlcih7bmV3TGluZTogdHMuTmV3TGluZUtpbmQuTGluZUZlZWR9KTtcblxuICAgIGZvciAoY29uc3Qgc291cmNlRmlsZSBvZiB2aXNpdCh0cmVlLnJvb3QpKSB7XG4gICAgICBsZXQgcmVjb3JkZXI6IFVwZGF0ZVJlY29yZGVyfHVuZGVmaW5lZDtcblxuICAgICAgY29uc3QgYWxsSW1wb3J0RGVjbGFyYXRpb25zID1cbiAgICAgICAgICBzb3VyY2VGaWxlLnN0YXRlbWVudHMuZmlsdGVyKG4gPT4gdHMuaXNJbXBvcnREZWNsYXJhdGlvbihuKSkgYXMgdHMuSW1wb3J0RGVjbGFyYXRpb25bXTtcbiAgICAgIGlmIChhbGxJbXBvcnREZWNsYXJhdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBodHRwQ29tbW9uSW1wb3J0ID0gZmluZEltcG9ydERlY2xhcmF0aW9uKCdAYW5ndWxhci9jb21tb24vaHR0cCcsIGFsbEltcG9ydERlY2xhcmF0aW9ucyk7XG4gICAgICBpZiAoIWh0dHBDb21tb25JbXBvcnQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbW1vbkh0dHBOYW1lZEJpbmRpbmcgPSBnZXROYW1lZEltcG9ydHMoaHR0cENvbW1vbkltcG9ydCk7XG4gICAgICBpZiAoY29tbW9uSHR0cE5hbWVkQmluZGluZykge1xuICAgICAgICBjb25zdCBjb21tb25IdHRwTmFtZWRJbXBvcnRzID0gY29tbW9uSHR0cE5hbWVkQmluZGluZy5lbGVtZW50cztcbiAgICAgICAgY29uc3QgeGhyRmFjdG9yeVNwZWNpZmllciA9IGZpbmRJbXBvcnRTcGVjaWZpZXIoY29tbW9uSHR0cE5hbWVkSW1wb3J0cywgJ1hockZhY3RvcnknKTtcblxuICAgICAgICBpZiAoIXhockZhY3RvcnlTcGVjaWZpZXIpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlY29yZGVyID0gdHJlZS5iZWdpblVwZGF0ZShzb3VyY2VGaWxlLmZpbGVOYW1lKTtcblxuICAgICAgICAvLyBSZW1vdmUgJ1hockZhY3RvcnknIGZyb20gJ0Bhbmd1bGFyL2NvbW1vbi9odHRwJ1xuICAgICAgICBpZiAoY29tbW9uSHR0cE5hbWVkSW1wb3J0cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgLy8gUmVtb3ZlICdYaHJGYWN0b3J5JyBuYW1lZCBpbXBvcnRcbiAgICAgICAgICBjb25zdCBpbmRleCA9IGNvbW1vbkh0dHBOYW1lZEJpbmRpbmcuZ2V0U3RhcnQoKTtcbiAgICAgICAgICBjb25zdCBsZW5ndGggPSBjb21tb25IdHRwTmFtZWRCaW5kaW5nLmdldFdpZHRoKCk7XG5cbiAgICAgICAgICBjb25zdCBuZXdJbXBvcnRzID0gcHJpbnRlci5wcmludE5vZGUoXG4gICAgICAgICAgICAgIHRzLkVtaXRIaW50LlVuc3BlY2lmaWVkLFxuICAgICAgICAgICAgICB0cy5mYWN0b3J5LnVwZGF0ZU5hbWVkSW1wb3J0cyhcbiAgICAgICAgICAgICAgICAgIGNvbW1vbkh0dHBOYW1lZEJpbmRpbmcsXG4gICAgICAgICAgICAgICAgICBjb21tb25IdHRwTmFtZWRCaW5kaW5nLmVsZW1lbnRzLmZpbHRlcihlID0+IGUgIT09IHhockZhY3RvcnlTcGVjaWZpZXIpKSxcbiAgICAgICAgICAgICAgc291cmNlRmlsZSk7XG4gICAgICAgICAgcmVjb3JkZXIucmVtb3ZlKGluZGV4LCBsZW5ndGgpLmluc2VydExlZnQoaW5kZXgsIG5ld0ltcG9ydHMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIFJlbW92ZSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnIGltcG9ydFxuICAgICAgICAgIGNvbnN0IGluZGV4ID0gaHR0cENvbW1vbkltcG9ydC5nZXRGdWxsU3RhcnQoKTtcbiAgICAgICAgICBjb25zdCBsZW5ndGggPSBodHRwQ29tbW9uSW1wb3J0LmdldEZ1bGxXaWR0aCgpO1xuICAgICAgICAgIHJlY29yZGVyLnJlbW92ZShpbmRleCwgbGVuZ3RoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEltcG9ydCBYaHJGYWN0b3J5IGZyb20gQGFuZ3VsYXIvY29tbW9uXG4gICAgICAgIGNvbnN0IGNvbW1vbkltcG9ydCA9IGZpbmRJbXBvcnREZWNsYXJhdGlvbignQGFuZ3VsYXIvY29tbW9uJywgYWxsSW1wb3J0RGVjbGFyYXRpb25zKTtcbiAgICAgICAgY29uc3QgY29tbW9uTmFtZWRCaW5kaW5nID0gZ2V0TmFtZWRJbXBvcnRzKGNvbW1vbkltcG9ydCk7XG4gICAgICAgIGlmIChjb21tb25OYW1lZEJpbmRpbmcpIHtcbiAgICAgICAgICAvLyBBbHJlYWR5IGhhcyBhbiBpbXBvcnQgZm9yICdAYW5ndWxhci9jb21tb24nLCBqdXN0IGFkZCB0aGUgbmFtZWQgaW1wb3J0LlxuICAgICAgICAgIGNvbnN0IGluZGV4ID0gY29tbW9uTmFtZWRCaW5kaW5nLmdldFN0YXJ0KCk7XG4gICAgICAgICAgY29uc3QgbGVuZ3RoID0gY29tbW9uTmFtZWRCaW5kaW5nLmdldFdpZHRoKCk7XG4gICAgICAgICAgY29uc3QgbmV3SW1wb3J0cyA9IHByaW50ZXIucHJpbnROb2RlKFxuICAgICAgICAgICAgICB0cy5FbWl0SGludC5VbnNwZWNpZmllZCxcbiAgICAgICAgICAgICAgdHMuZmFjdG9yeS51cGRhdGVOYW1lZEltcG9ydHMoXG4gICAgICAgICAgICAgICAgICBjb21tb25OYW1lZEJpbmRpbmcsIFsuLi5jb21tb25OYW1lZEJpbmRpbmcuZWxlbWVudHMsIHhockZhY3RvcnlTcGVjaWZpZXJdKSxcbiAgICAgICAgICAgICAgc291cmNlRmlsZSk7XG5cbiAgICAgICAgICByZWNvcmRlci5yZW1vdmUoaW5kZXgsIGxlbmd0aCkuaW5zZXJ0TGVmdChpbmRleCwgbmV3SW1wb3J0cyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQWRkIGltcG9ydCB0byAnQGFuZ3VsYXIvY29tbW9uJ1xuICAgICAgICAgIGNvbnN0IGluZGV4ID0gaHR0cENvbW1vbkltcG9ydC5nZXRGdWxsU3RhcnQoKTtcbiAgICAgICAgICByZWNvcmRlci5pbnNlcnRMZWZ0KGluZGV4LCBgXFxuaW1wb3J0IHsgWGhyRmFjdG9yeSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7YCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHJlY29yZGVyKSB7XG4gICAgICAgIHRyZWUuY29tbWl0VXBkYXRlKHJlY29yZGVyKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIGZpbmRJbXBvcnREZWNsYXJhdGlvbihtb2R1bGVTcGVjaWZpZXI6IHN0cmluZywgaW1wb3J0RGVjbGFyYXRpb25zOiB0cy5JbXBvcnREZWNsYXJhdGlvbltdKTpcbiAgICB0cy5JbXBvcnREZWNsYXJhdGlvbnx1bmRlZmluZWQge1xuICByZXR1cm4gaW1wb3J0RGVjbGFyYXRpb25zLmZpbmQoXG4gICAgICBuID0+IHRzLmlzU3RyaW5nTGl0ZXJhbChuLm1vZHVsZVNwZWNpZmllcikgJiYgbi5tb2R1bGVTcGVjaWZpZXIudGV4dCA9PT0gbW9kdWxlU3BlY2lmaWVyKTtcbn1cblxuZnVuY3Rpb24gZ2V0TmFtZWRJbXBvcnRzKGltcG9ydERlY2xhcmF0aW9uOiB0cy5JbXBvcnREZWNsYXJhdGlvbnx1bmRlZmluZWQpOiB0cy5OYW1lZEltcG9ydHN8XG4gICAgdW5kZWZpbmVkIHtcbiAgY29uc3QgbmFtZWRCaW5kaW5ncyA9IGltcG9ydERlY2xhcmF0aW9uPy5pbXBvcnRDbGF1c2U/Lm5hbWVkQmluZGluZ3M7XG4gIGlmIChuYW1lZEJpbmRpbmdzICYmIHRzLmlzTmFtZWRJbXBvcnRzKG5hbWVkQmluZGluZ3MpKSB7XG4gICAgcmV0dXJuIG5hbWVkQmluZGluZ3M7XG4gIH1cblxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuIl19