/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/migrations/typed-forms/util", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/imports", "@angular/core/schematics/utils/typescript/symbol"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.migrateFile = exports.forms = exports.untypedPrefix = exports.classes = void 0;
    const typescript_1 = __importDefault(require("typescript"));
    const imports_1 = require("@angular/core/schematics/utils/typescript/imports");
    const symbol_1 = require("@angular/core/schematics/utils/typescript/symbol");
    exports.classes = new Set(['FormArray', 'FormBuilder', 'FormControl', 'FormGroup']);
    exports.untypedPrefix = 'Untyped';
    exports.forms = '@angular/forms';
    function migrateFile(sourceFile, typeChecker, rewrite) {
        const imports = getImports(sourceFile);
        // If no relevant classes are imported, we can exit early.
        if (imports.length === 0)
            return;
        // For each imported control class, insert the corresponding uptyped import.
        for (const imp of imports) {
            const untypedClass = getUntypedVersionOfImportOrName(imp.getText());
            if (untypedClass === null) {
                // This should never happen.
                console.error(`Typed forms migration error: unknown untyped version of import ${imp.getText()}`);
                continue;
            }
            if ((0, imports_1.getImportSpecifier)(sourceFile, exports.forms, untypedClass)) {
                // In order to make the migration idempotent, we must check whether the untyped version of the
                // class is already present. If present, immediately continue.
                continue;
            }
            rewrite(imp.getEnd(), 0, `, ${untypedClass}`);
        }
        // For each control class, migrate all of its uses.
        for (const imp of imports) {
            const usages = getUsages(sourceFile, typeChecker, imp);
            for (const usage of usages) {
                const newName = getUntypedVersionOfImportOrName(usage.importName);
                if (newName === null) {
                    // This should never happen.
                    console.error(`Typed forms migration error: unknown replacement for usage ${usage.node.getText()}`);
                    continue;
                }
                rewrite(usage.node.getStart(), usage.node.getWidth(), newName);
            }
        }
    }
    exports.migrateFile = migrateFile;
    function getImports(sourceFile) {
        let imports = [];
        for (const cc of exports.classes) {
            const specifier = (0, imports_1.getImportSpecifier)(sourceFile, exports.forms, cc);
            if (!specifier)
                continue;
            imports.push(specifier);
        }
        return imports;
    }
    function getUntypedVersionOfImportOrName(name) {
        for (const cc of exports.classes) {
            if (name.includes(cc)) {
                return `${exports.untypedPrefix}${cc}`;
            }
        }
        return null;
    }
    function getUsages(sourceFile, typeChecker, importSpecifier) {
        if (importSpecifier === null)
            return [];
        const usages = [];
        const visitNode = (node) => {
            // Look for a `new` expression with no type arguments which references an import we care about:
            // `new FormControl()`
            if (typescript_1.default.isNewExpression(node) && !node.typeArguments &&
                (0, symbol_1.isReferenceToImport)(typeChecker, node.expression, importSpecifier)) {
                usages.push({ node: node.expression, importName: importSpecifier.getText() });
            }
            typescript_1.default.forEachChild(node, visitNode);
        };
        typescript_1.default.forEachChild(sourceFile, visitNode);
        return usages;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3R5cGVkLWZvcm1zL3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7O0lBRUgsNERBQTRCO0lBRTVCLCtFQUFrRTtJQUNsRSw2RUFBa0U7SUFFckQsUUFBQSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxXQUFXLEVBQUUsYUFBYSxFQUFFLGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO0lBQzVFLFFBQUEsYUFBYSxHQUFHLFNBQVMsQ0FBQztJQUMxQixRQUFBLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQztJQVN0QyxTQUFnQixXQUFXLENBQ3ZCLFVBQXlCLEVBQUUsV0FBMkIsRUFBRSxPQUFrQjtRQUM1RSxNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFdkMsMERBQTBEO1FBQzFELElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDO1lBQUUsT0FBTztRQUVqQyw0RUFBNEU7UUFDNUUsS0FBSyxNQUFNLEdBQUcsSUFBSSxPQUFPLEVBQUU7WUFDekIsTUFBTSxZQUFZLEdBQUcsK0JBQStCLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDcEUsSUFBSSxZQUFZLEtBQUssSUFBSSxFQUFFO2dCQUN6Qiw0QkFBNEI7Z0JBQzVCLE9BQU8sQ0FBQyxLQUFLLENBQ1Qsa0VBQWtFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3ZGLFNBQVM7YUFDVjtZQUNELElBQUksSUFBQSw0QkFBa0IsRUFBQyxVQUFVLEVBQUUsYUFBSyxFQUFFLFlBQVksQ0FBQyxFQUFFO2dCQUN2RCw4RkFBOEY7Z0JBQzlGLDhEQUE4RDtnQkFDOUQsU0FBUzthQUNWO1lBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsS0FBSyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1NBQy9DO1FBRUQsbURBQW1EO1FBQ25ELEtBQUssTUFBTSxHQUFHLElBQUksT0FBTyxFQUFFO1lBQ3pCLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZELEtBQUssTUFBTSxLQUFLLElBQUksTUFBTSxFQUFFO2dCQUMxQixNQUFNLE9BQU8sR0FBRywrQkFBK0IsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ2xFLElBQUksT0FBTyxLQUFLLElBQUksRUFBRTtvQkFDcEIsNEJBQTRCO29CQUM1QixPQUFPLENBQUMsS0FBSyxDQUNULDhEQUE4RCxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztvQkFDMUYsU0FBUztpQkFDVjtnQkFDRCxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2FBQ2hFO1NBQ0Y7SUFDSCxDQUFDO0lBdENELGtDQXNDQztJQUVELFNBQVMsVUFBVSxDQUFDLFVBQXlCO1FBQzNDLElBQUksT0FBTyxHQUF5QixFQUFFLENBQUM7UUFDdkMsS0FBSyxNQUFNLEVBQUUsSUFBSSxlQUFPLEVBQUU7WUFDeEIsTUFBTSxTQUFTLEdBQUcsSUFBQSw0QkFBa0IsRUFBQyxVQUFVLEVBQUUsYUFBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzVELElBQUksQ0FBQyxTQUFTO2dCQUFFLFNBQVM7WUFDekIsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUN6QjtRQUNELE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFRCxTQUFTLCtCQUErQixDQUFDLElBQVk7UUFDbkQsS0FBSyxNQUFNLEVBQUUsSUFBSSxlQUFPLEVBQUU7WUFDeEIsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxFQUFFO2dCQUNyQixPQUFPLEdBQUcscUJBQWEsR0FBRyxFQUFFLEVBQUUsQ0FBQzthQUNoQztTQUNGO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsU0FBUyxTQUFTLENBQ2QsVUFBeUIsRUFBRSxXQUEyQixFQUN0RCxlQUF3QztRQUMxQyxJQUFJLGVBQWUsS0FBSyxJQUFJO1lBQUUsT0FBTyxFQUFFLENBQUM7UUFDeEMsTUFBTSxNQUFNLEdBQXFCLEVBQUUsQ0FBQztRQUNwQyxNQUFNLFNBQVMsR0FBRyxDQUFDLElBQWEsRUFBRSxFQUFFO1lBQ2xDLCtGQUErRjtZQUMvRixzQkFBc0I7WUFDdEIsSUFBSSxvQkFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhO2dCQUMvQyxJQUFBLDRCQUFtQixFQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLGVBQWUsQ0FBQyxFQUFFO2dCQUN0RSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLGVBQWUsQ0FBQyxPQUFPLEVBQUUsRUFBQyxDQUFDLENBQUM7YUFDN0U7WUFDRCxvQkFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDbkMsQ0FBQyxDQUFDO1FBQ0Ysb0JBQUUsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3ZDLE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2dldEltcG9ydFNwZWNpZmllcn0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9pbXBvcnRzJztcbmltcG9ydCB7aXNSZWZlcmVuY2VUb0ltcG9ydH0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9zeW1ib2wnO1xuXG5leHBvcnQgY29uc3QgY2xhc3NlcyA9IG5ldyBTZXQoWydGb3JtQXJyYXknLCAnRm9ybUJ1aWxkZXInLCAnRm9ybUNvbnRyb2wnLCAnRm9ybUdyb3VwJ10pO1xuZXhwb3J0IGNvbnN0IHVudHlwZWRQcmVmaXggPSAnVW50eXBlZCc7XG5leHBvcnQgY29uc3QgZm9ybXMgPSAnQGFuZ3VsYXIvZm9ybXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIE1pZ3JhdGFibGVOb2RlIHtcbiAgbm9kZTogdHMuRXhwcmVzc2lvbjtcbiAgaW1wb3J0TmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgdHlwZSByZXdyaXRlRm4gPSAoc3RhcnRQb3M6IG51bWJlciwgb3JpZ0xlbmd0aDogbnVtYmVyLCB0ZXh0OiBzdHJpbmcpID0+IHZvaWQ7XG5cbmV4cG9ydCBmdW5jdGlvbiBtaWdyYXRlRmlsZShcbiAgICBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlLCB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsIHJld3JpdGU6IHJld3JpdGVGbikge1xuICBjb25zdCBpbXBvcnRzID0gZ2V0SW1wb3J0cyhzb3VyY2VGaWxlKTtcblxuICAvLyBJZiBubyByZWxldmFudCBjbGFzc2VzIGFyZSBpbXBvcnRlZCwgd2UgY2FuIGV4aXQgZWFybHkuXG4gIGlmIChpbXBvcnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gIC8vIEZvciBlYWNoIGltcG9ydGVkIGNvbnRyb2wgY2xhc3MsIGluc2VydCB0aGUgY29ycmVzcG9uZGluZyB1cHR5cGVkIGltcG9ydC5cbiAgZm9yIChjb25zdCBpbXAgb2YgaW1wb3J0cykge1xuICAgIGNvbnN0IHVudHlwZWRDbGFzcyA9IGdldFVudHlwZWRWZXJzaW9uT2ZJbXBvcnRPck5hbWUoaW1wLmdldFRleHQoKSk7XG4gICAgaWYgKHVudHlwZWRDbGFzcyA9PT0gbnVsbCkge1xuICAgICAgLy8gVGhpcyBzaG91bGQgbmV2ZXIgaGFwcGVuLlxuICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICBgVHlwZWQgZm9ybXMgbWlncmF0aW9uIGVycm9yOiB1bmtub3duIHVudHlwZWQgdmVyc2lvbiBvZiBpbXBvcnQgJHtpbXAuZ2V0VGV4dCgpfWApO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChnZXRJbXBvcnRTcGVjaWZpZXIoc291cmNlRmlsZSwgZm9ybXMsIHVudHlwZWRDbGFzcykpIHtcbiAgICAgIC8vIEluIG9yZGVyIHRvIG1ha2UgdGhlIG1pZ3JhdGlvbiBpZGVtcG90ZW50LCB3ZSBtdXN0IGNoZWNrIHdoZXRoZXIgdGhlIHVudHlwZWQgdmVyc2lvbiBvZiB0aGVcbiAgICAgIC8vIGNsYXNzIGlzIGFscmVhZHkgcHJlc2VudC4gSWYgcHJlc2VudCwgaW1tZWRpYXRlbHkgY29udGludWUuXG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgcmV3cml0ZShpbXAuZ2V0RW5kKCksIDAsIGAsICR7dW50eXBlZENsYXNzfWApO1xuICB9XG5cbiAgLy8gRm9yIGVhY2ggY29udHJvbCBjbGFzcywgbWlncmF0ZSBhbGwgb2YgaXRzIHVzZXMuXG4gIGZvciAoY29uc3QgaW1wIG9mIGltcG9ydHMpIHtcbiAgICBjb25zdCB1c2FnZXMgPSBnZXRVc2FnZXMoc291cmNlRmlsZSwgdHlwZUNoZWNrZXIsIGltcCk7XG4gICAgZm9yIChjb25zdCB1c2FnZSBvZiB1c2FnZXMpIHtcbiAgICAgIGNvbnN0IG5ld05hbWUgPSBnZXRVbnR5cGVkVmVyc2lvbk9mSW1wb3J0T3JOYW1lKHVzYWdlLmltcG9ydE5hbWUpO1xuICAgICAgaWYgKG5ld05hbWUgPT09IG51bGwpIHtcbiAgICAgICAgLy8gVGhpcyBzaG91bGQgbmV2ZXIgaGFwcGVuLlxuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICAgYFR5cGVkIGZvcm1zIG1pZ3JhdGlvbiBlcnJvcjogdW5rbm93biByZXBsYWNlbWVudCBmb3IgdXNhZ2UgJHt1c2FnZS5ub2RlLmdldFRleHQoKX1gKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICByZXdyaXRlKHVzYWdlLm5vZGUuZ2V0U3RhcnQoKSwgdXNhZ2Uubm9kZS5nZXRXaWR0aCgpLCBuZXdOYW1lKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0SW1wb3J0cyhzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogdHMuSW1wb3J0U3BlY2lmaWVyW10ge1xuICBsZXQgaW1wb3J0czogdHMuSW1wb3J0U3BlY2lmaWVyW10gPSBbXTtcbiAgZm9yIChjb25zdCBjYyBvZiBjbGFzc2VzKSB7XG4gICAgY29uc3Qgc3BlY2lmaWVyID0gZ2V0SW1wb3J0U3BlY2lmaWVyKHNvdXJjZUZpbGUsIGZvcm1zLCBjYyk7XG4gICAgaWYgKCFzcGVjaWZpZXIpIGNvbnRpbnVlO1xuICAgIGltcG9ydHMucHVzaChzcGVjaWZpZXIpO1xuICB9XG4gIHJldHVybiBpbXBvcnRzO1xufVxuXG5mdW5jdGlvbiBnZXRVbnR5cGVkVmVyc2lvbk9mSW1wb3J0T3JOYW1lKG5hbWU6IHN0cmluZyk6IHN0cmluZ3xudWxsIHtcbiAgZm9yIChjb25zdCBjYyBvZiBjbGFzc2VzKSB7XG4gICAgaWYgKG5hbWUuaW5jbHVkZXMoY2MpKSB7XG4gICAgICByZXR1cm4gYCR7dW50eXBlZFByZWZpeH0ke2NjfWA7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXRVc2FnZXMoXG4gICAgc291cmNlRmlsZTogdHMuU291cmNlRmlsZSwgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLFxuICAgIGltcG9ydFNwZWNpZmllcjogdHMuSW1wb3J0U3BlY2lmaWVyfG51bGwpOiBNaWdyYXRhYmxlTm9kZVtdIHtcbiAgaWYgKGltcG9ydFNwZWNpZmllciA9PT0gbnVsbCkgcmV0dXJuIFtdO1xuICBjb25zdCB1c2FnZXM6IE1pZ3JhdGFibGVOb2RlW10gPSBbXTtcbiAgY29uc3QgdmlzaXROb2RlID0gKG5vZGU6IHRzLk5vZGUpID0+IHtcbiAgICAvLyBMb29rIGZvciBhIGBuZXdgIGV4cHJlc3Npb24gd2l0aCBubyB0eXBlIGFyZ3VtZW50cyB3aGljaCByZWZlcmVuY2VzIGFuIGltcG9ydCB3ZSBjYXJlIGFib3V0OlxuICAgIC8vIGBuZXcgRm9ybUNvbnRyb2woKWBcbiAgICBpZiAodHMuaXNOZXdFeHByZXNzaW9uKG5vZGUpICYmICFub2RlLnR5cGVBcmd1bWVudHMgJiZcbiAgICAgICAgaXNSZWZlcmVuY2VUb0ltcG9ydCh0eXBlQ2hlY2tlciwgbm9kZS5leHByZXNzaW9uLCBpbXBvcnRTcGVjaWZpZXIpKSB7XG4gICAgICB1c2FnZXMucHVzaCh7bm9kZTogbm9kZS5leHByZXNzaW9uLCBpbXBvcnROYW1lOiBpbXBvcnRTcGVjaWZpZXIuZ2V0VGV4dCgpfSk7XG4gICAgfVxuICAgIHRzLmZvckVhY2hDaGlsZChub2RlLCB2aXNpdE5vZGUpO1xuICB9O1xuICB0cy5mb3JFYWNoQ2hpbGQoc291cmNlRmlsZSwgdmlzaXROb2RlKTtcbiAgcmV0dXJuIHVzYWdlcztcbn1cbiJdfQ==