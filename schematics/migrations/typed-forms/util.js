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
        // For each control class, migrate all of its uses.
        for (let i = imports.length; i >= 0; i--) {
            const imp = imports[i];
            const usages = getUsages(sourceFile, typeChecker, imp);
            if (usages.length === 0) {
                // Since there are no usages of this class we need to migrate it, we should completely
                // skip it for the subsequent migration steps.
                imports.splice(i, 1);
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3R5cGVkLWZvcm1zL3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7O0lBRUgsNERBQTRCO0lBRTVCLCtFQUFrRTtJQUNsRSw2RUFBa0U7SUFFckQsUUFBQSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxXQUFXLEVBQUUsYUFBYSxFQUFFLGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO0lBQzVFLFFBQUEsYUFBYSxHQUFHLFNBQVMsQ0FBQztJQUMxQixRQUFBLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQztJQVN0QyxTQUFnQixXQUFXLENBQ3ZCLFVBQXlCLEVBQUUsV0FBMkIsRUFBRSxPQUFrQjtRQUM1RSxNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFdkMsMERBQTBEO1FBQzFELElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDO1lBQUUsT0FBTztRQUVqQyxtREFBbUQ7UUFDbkQsS0FBSyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDeEMsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZELElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQ3ZCLHNGQUFzRjtnQkFDdEYsOENBQThDO2dCQUM5QyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzthQUN0QjtZQUNELEtBQUssTUFBTSxLQUFLLElBQUks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QUMsQ0FBQztRQUN2QyxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtnZXRJbXBvcnRTcGVjaWZpZXJ9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvaW1wb3J0cyc7XG5pbXBvcnQge2lzUmVmZXJlbmNlVG9JbXBvcnR9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvc3ltYm9sJztcblxuZXhwb3J0IGNvbnN0IGNsYXNzZXMgPSBuZXcgU2V0KFsnRm9ybUFycmF5JywgJ0Zvcm1CdWlsZGVyJywgJ0Zvcm1Db250cm9sJywgJ0Zvcm1Hcm91cCddKTtcbmV4cG9ydCBjb25zdCB1bnR5cGVkUHJlZml4ID0gJ1VudHlwZWQnO1xuZXhwb3J0IGNvbnN0IGZvcm1zID0gJ0Bhbmd1bGFyL2Zvcm1zJztcblxuZXhwb3J0IGludGVyZmFjZSBNaWdyYXRhYmxlTm9kZSB7XG4gIG5vZGU6IHRzLkV4cHJlc3Npb247XG4gIGltcG9ydE5hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IHR5cGUgcmV3cml0ZUZuID0gKHN0YXJ0UG9zOiBudW1iZXIsIG9yaWdMZW5ndGg6IG51bWJlciwgdGV4dDogc3RyaW5nKSA9PiB2b2lkO1xuXG5leHBvcnQgZnVuY3Rpb24gbWlncmF0ZUZpbGUoXG4gICAgc291cmNlRmlsZTogdHMuU291cmNlRmlsZSwgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLCByZXdyaXRlOiByZXdyaXRlRm4pIHtcbiAgY29uc3QgaW1wb3J0cyA9IGdldEltcG9ydHMoc291cmNlRmlsZSk7XG5cbiAgLy8gSWYgbm8gcmVsZXZhbnQgY2xhc3NlcyBhcmUgaW1wb3J0ZWQsIHdlIGNhbiBleGl0IGVhcmx5LlxuICBpZiAoaW1wb3J0cy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICAvLyBGb3IgZWFjaCBjb250cm9sIGNsYXNzLCBtaWdyYXRlIGFsbCBvZiBpdHMgdXNlcy5cbiAgZm9yIChsZXQgaSA9IGltcG9ydHMubGVuZ3RoOyBpID49IDA7IGktLSkge1xuICAgIGNvbnN0IGltcCA9IGltcG9ydHNbaV07XG4gICAgY29uc3QgdXNhZ2VzID0gZ2V0VXNhZ2VzKHNvdXJjZUZpbGUsIHR5cGVDaGVja2VyLCBpbXApO1xuICAgIGlmICh1c2FnZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAvLyBTaW5jZSB0aGVyZSBhcmUgbm8gdXNhZ2VzIG9mIHRoaXMgY2xhc3Mgd2UgbmVlZCB0byBtaWdyYXRlIGl0LCB3ZSBzaG91bGQgY29tcGxldGVseVxuICAgICAgLy8gc2tpcCBpdCBmb3IgdGhlIHN1YnNlcXVlbnQgbWlncmF0aW9uIHN0ZXBzLlxuICAgICAgaW1wb3J0cy5zcGxpY2UoaSwgMSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgdXNhZ2Ugb2YgdXNhZ2VzKSB7XG4gICAgICBjb25zdCBuZXdOYW1lID0gZ2V0VW50eXBlZFZlcnNpb25PZkltcG9ydE9yTmFtZSh1c2FnZS5pbXBvcnROYW1lKTtcbiAgICAgIGlmIChuZXdOYW1lID09PSBudWxsKSB7XG4gICAgICAgIC8vIFRoaXMgc2hvdWxkIG5ldmVyIGhhcHBlbi5cbiAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgIGBUeXBlZCBmb3JtcyBtaWdyYXRpb24gZXJyb3I6IHVua25vd24gcmVwbGFjZW1lbnQgZm9yIHVzYWdlICR7dXNhZ2Uubm9kZS5nZXRUZXh0KCl9YCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgcmV3cml0ZSh1c2FnZS5ub2RlLmdldFN0YXJ0KCksIHVzYWdlLm5vZGUuZ2V0V2lkdGgoKSwgbmV3TmFtZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gRm9yIGVhY2ggaW1wb3J0ZWQgY29udHJvbCBjbGFzcywgaW5zZXJ0IHRoZSBjb3JyZXNwb25kaW5nIHVwdHlwZWQgaW1wb3J0LlxuICBmb3IgKGNvbnN0IGltcCBvZiBpbXBvcnRzKSB7XG4gICAgY29uc3QgdW50eXBlZENsYXNzID0gZ2V0VW50eXBlZFZlcnNpb25PZkltcG9ydE9yTmFtZShpbXAuZ2V0VGV4dCgpKTtcbiAgICBpZiAodW50eXBlZENsYXNzID09PSBudWxsKSB7XG4gICAgICAvLyBUaGlzIHNob3VsZCBuZXZlciBoYXBwZW4uXG4gICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgIGBUeXBlZCBmb3JtcyBtaWdyYXRpb24gZXJyb3I6IHVua25vd24gdW50eXBlZCB2ZXJzaW9uIG9mIGltcG9ydCAke2ltcC5nZXRUZXh0KCl9YCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGdldEltcG9ydFNwZWNpZmllcihzb3VyY2VGaWxlLCBmb3JtcywgdW50eXBlZENsYXNzKSkge1xuICAgICAgLy8gSW4gb3JkZXIgdG8gbWFrZSB0aGUgbWlncmF0aW9uIGlkZW1wb3RlbnQsIHdlIG11c3QgY2hlY2sgd2hldGhlciB0aGUgdW50eXBlZCB2ZXJzaW9uIG9mIHRoZVxuICAgICAgLy8gY2xhc3MgaXMgYWxyZWFkeSBwcmVzZW50LiBJZiBwcmVzZW50LCBpbW1lZGlhdGVseSBjb250aW51ZS5cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICByZXdyaXRlKGltcC5nZXRFbmQoKSwgMCwgYCwgJHt1bnR5cGVkQ2xhc3N9YCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0SW1wb3J0cyhzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogdHMuSW1wb3J0U3BlY2lmaWVyW10ge1xuICBsZXQgaW1wb3J0czogdHMuSW1wb3J0U3BlY2lmaWVyW10gPSBbXTtcbiAgZm9yIChjb25zdCBjYyBvZiBjbGFzc2VzKSB7XG4gICAgY29uc3Qgc3BlY2lmaWVyID0gZ2V0SW1wb3J0U3BlY2lmaWVyKHNvdXJjZUZpbGUsIGZvcm1zLCBjYyk7XG4gICAgaWYgKCFzcGVjaWZpZXIpIGNvbnRpbnVlO1xuICAgIGltcG9ydHMucHVzaChzcGVjaWZpZXIpO1xuICB9XG4gIHJldHVybiBpbXBvcnRzO1xufVxuXG5mdW5jdGlvbiBnZXRVbnR5cGVkVmVyc2lvbk9mSW1wb3J0T3JOYW1lKG5hbWU6IHN0cmluZyk6IHN0cmluZ3xudWxsIHtcbiAgZm9yIChjb25zdCBjYyBvZiBjbGFzc2VzKSB7XG4gICAgaWYgKG5hbWUuaW5jbHVkZXMoY2MpKSB7XG4gICAgICByZXR1cm4gYCR7dW50eXBlZFByZWZpeH0ke2NjfWA7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXRVc2FnZXMoXG4gICAgc291cmNlRmlsZTogdHMuU291cmNlRmlsZSwgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLFxuICAgIGltcG9ydFNwZWNpZmllcjogdHMuSW1wb3J0U3BlY2lmaWVyfG51bGwpOiBNaWdyYXRhYmxlTm9kZVtdIHtcbiAgaWYgKGltcG9ydFNwZWNpZmllciA9PT0gbnVsbCkgcmV0dXJuIFtdO1xuICBjb25zdCB1c2FnZXM6IE1pZ3JhdGFibGVOb2RlW10gPSBbXTtcbiAgY29uc3QgdmlzaXROb2RlID0gKG5vZGU6IHRzLk5vZGUpID0+IHtcbiAgICAvLyBMb29rIGZvciBhIGBuZXdgIGV4cHJlc3Npb24gd2l0aCBubyB0eXBlIGFyZ3VtZW50cyB3aGljaCByZWZlcmVuY2VzIGFuIGltcG9ydCB3ZSBjYXJlIGFib3V0OlxuICAgIC8vIGBuZXcgRm9ybUNvbnRyb2woKWBcbiAgICBpZiAodHMuaXNOZXdFeHByZXNzaW9uKG5vZGUpICYmICFub2RlLnR5cGVBcmd1bWVudHMgJiZcbiAgICAgICAgaXNSZWZlcmVuY2VUb0ltcG9ydCh0eXBlQ2hlY2tlciwgbm9kZS5leHByZXNzaW9uLCBpbXBvcnRTcGVjaWZpZXIpKSB7XG4gICAgICB1c2FnZXMucHVzaCh7bm9kZTogbm9kZS5leHByZXNzaW9uLCBpbXBvcnROYW1lOiBpbXBvcnRTcGVjaWZpZXIuZ2V0VGV4dCgpfSk7XG4gICAgfVxuICAgIHRzLmZvckVhY2hDaGlsZChub2RlLCB2aXNpdE5vZGUpO1xuICB9O1xuICB0cy5mb3JFYWNoQ2hpbGQoc291cmNlRmlsZSwgdmlzaXROb2RlKTtcbiAgcmV0dXJuIHVzYWdlcztcbn1cbiJdfQ==