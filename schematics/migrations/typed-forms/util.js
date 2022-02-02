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
    exports.findFormBuilderCalls = exports.findControlClassUsages = exports.getAnyImport = exports.getFormBuilderImport = exports.getControlClassImports = exports.anySymbolName = exports.builderMethodNames = exports.controlClassNames = void 0;
    const typescript_1 = __importDefault(require("typescript"));
    const imports_1 = require("@angular/core/schematics/utils/typescript/imports");
    const symbol_1 = require("@angular/core/schematics/utils/typescript/symbol");
    exports.controlClassNames = ['AbstractControl', 'FormArray', 'FormControl', 'FormGroup'];
    exports.builderMethodNames = ['control', 'group', 'array'];
    exports.anySymbolName = 'AnyForUntypedForms';
    function getControlClassImports(sourceFile) {
        return exports.controlClassNames.map(cclass => (0, imports_1.getImportSpecifier)(sourceFile, '@angular/forms', cclass))
            .filter(v => v != null);
    }
    exports.getControlClassImports = getControlClassImports;
    function getFormBuilderImport(sourceFile) {
        return (0, imports_1.getImportSpecifier)(sourceFile, '@angular/forms', 'FormBuilder');
    }
    exports.getFormBuilderImport = getFormBuilderImport;
    function getAnyImport(sourceFile) {
        return (0, imports_1.getImportSpecifier)(sourceFile, '@angular/forms', exports.anySymbolName);
    }
    exports.getAnyImport = getAnyImport;
    function findControlClassUsages(sourceFile, typeChecker, importSpecifier) {
        if (importSpecifier === null)
            return [];
        const generic = `<${exports.anySymbolName}>`;
        const usages = [];
        const visitNode = (node) => {
            // Look for a `new` expression with no type arguments which references an import we care about:
            // `new FormControl()`
            if (typescript_1.default.isNewExpression(node) && !node.typeArguments &&
                (0, symbol_1.isReferenceToImport)(typeChecker, node.expression, importSpecifier)) {
                usages.push({ node: node.expression, generic });
            }
            typescript_1.default.forEachChild(node, visitNode);
        };
        typescript_1.default.forEachChild(sourceFile, visitNode);
        return usages;
    }
    exports.findControlClassUsages = findControlClassUsages;
    function findFormBuilderCalls(sourceFile, typeChecker, importSpecifier) {
        if (!importSpecifier)
            return [];
        const usages = new Array();
        typescript_1.default.forEachChild(sourceFile, function visitNode(node) {
            // Look for calls that look like `foo.<method to migrate>`.
            if (typescript_1.default.isCallExpression(node) && !node.typeArguments &&
                typescript_1.default.isPropertyAccessExpression(node.expression) && typescript_1.default.isIdentifier(node.expression.name) &&
                exports.builderMethodNames.includes(node.expression.name.text)) {
                const generic = `<${exports.anySymbolName}>`;
                // Check whether the type of the object on which the function is called refers to the
                // provided import.
                if ((0, symbol_1.isReferenceToImport)(typeChecker, node.expression.expression, importSpecifier)) {
                    usages.push({ node: node.expression, generic });
                }
            }
            typescript_1.default.forEachChild(node, visitNode);
        });
        return usages;
    }
    exports.findFormBuilderCalls = findFormBuilderCalls;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3R5cGVkLWZvcm1zL3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7O0lBRUgsNERBQTRCO0lBRTVCLCtFQUFrRTtJQUNsRSw2RUFBa0U7SUFFckQsUUFBQSxpQkFBaUIsR0FBRyxDQUFDLGlCQUFpQixFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDakYsUUFBQSxrQkFBa0IsR0FBRyxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDbkQsUUFBQSxhQUFhLEdBQUcsb0JBQW9CLENBQUM7SUFPbEQsU0FBZ0Isc0JBQXNCLENBQUMsVUFBeUI7UUFDOUQsT0FBTyx5QkFBaUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFBLDRCQUFrQixFQUFDLFVBQVUsRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsQ0FBQzthQUMzRixNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUhELHdEQUdDO0lBRUQsU0FBZ0Isb0JBQW9CLENBQUMsVUFBeUI7UUFDNUQsT0FBTyxJQUFBLDRCQUFrQixFQUFDLFVBQVUsRUFBRSxnQkFBZ0IsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUN6RSxDQUFDO0lBRkQsb0RBRUM7SUFFRCxTQUFnQixZQUFZLENBQUMsVUFBeUI7UUFDcEQsT0FBTyxJQUFBLDRCQUFrQixFQUFDLFVBQVUsRUFBRSxnQkFBZ0IsRUFBRSxxQkFBYSxDQUFDLENBQUM7SUFDekUsQ0FBQztJQUZELG9DQUVDO0lBRUQsU0FBZ0Isc0JBQXNCLENBQ2xDLFVBQXlCLEVBQUUsV0FBMkIsRUFDdEQsZUFBd0M7UUFDMUMsSUFBSSxlQUFlLEtBQUssSUFBSTtZQUFFLE9BQU8sRUFBRSxDQUFDO1FBQ3hDLE1BQU0sT0FBTyxHQUFHLElBQUkscUJBQWEsR0FBRyxDQUFDO1FBQ3JDLE1BQU0sTUFBTSxHQUFxQixFQUFFLENBQUM7UUFDcEMsTUFBTSxTQUFTLEdBQUcsQ0FBQyxJQUFhLEVBQUUsRUFBRTtZQUNsQywrRkFBK0Y7WUFDL0Ysc0JBQXNCO1lBQ3RCLElBQUksb0JBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYTtnQkFDL0MsSUFBQSw0QkFBbUIsRUFBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxlQUFlLENBQUMsRUFBRTtnQkFDdEUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFDLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBQyxDQUFDLENBQUM7YUFDL0M7WUFDRCxvQkFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDbkMsQ0FBQyxDQUFDO1FBQ0Ysb0JBQUUsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3ZDLE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFqQkQsd0RBaUJDO0lBRUQsU0FBZ0Isb0JBQW9CLENBQ2hDLFVBQXlCLEVBQUUsV0FBMkIsRUFDdEQsZUFBd0M7UUFDMUMsSUFBSSxDQUFDLGVBQWU7WUFBRSxPQUFPLEVBQUUsQ0FBQztRQUNoQyxNQUFNLE1BQU0sR0FBRyxJQUFJLEtBQUssRUFBa0IsQ0FBQztRQUMzQyxvQkFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsU0FBUyxTQUFTLENBQUMsSUFBYTtZQUMxRCwyREFBMkQ7WUFDM0QsSUFBSSxvQkFBRSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWE7Z0JBQ2hELG9CQUFFLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLG9CQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO2dCQUN2RiwwQkFBa0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQzFELE1BQU0sT0FBTyxHQUFHLElBQUkscUJBQWEsR0FBRyxDQUFDO2dCQUNyQyxxRkFBcUY7Z0JBQ3JGLG1CQUFtQjtnQkFDbkIsSUFBSSxJQUFBLDRCQUFtQixFQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxlQUFlLENBQUMsRUFBRTtvQkFDakYsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFDLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBQyxDQUFDLENBQUM7aUJBQy9DO2FBQ0Y7WUFDRCxvQkFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDbkMsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBcEJELG9EQW9CQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Z2V0SW1wb3J0U3BlY2lmaWVyfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2ltcG9ydHMnO1xuaW1wb3J0IHtpc1JlZmVyZW5jZVRvSW1wb3J0fSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L3N5bWJvbCc7XG5cbmV4cG9ydCBjb25zdCBjb250cm9sQ2xhc3NOYW1lcyA9IFsnQWJzdHJhY3RDb250cm9sJywgJ0Zvcm1BcnJheScsICdGb3JtQ29udHJvbCcsICdGb3JtR3JvdXAnXTtcbmV4cG9ydCBjb25zdCBidWlsZGVyTWV0aG9kTmFtZXMgPSBbJ2NvbnRyb2wnLCAnZ3JvdXAnLCAnYXJyYXknXTtcbmV4cG9ydCBjb25zdCBhbnlTeW1ib2xOYW1lID0gJ0FueUZvclVudHlwZWRGb3Jtcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWlncmF0YWJsZU5vZGUge1xuICBub2RlOiB0cy5FeHByZXNzaW9uO1xuICBnZW5lcmljOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb250cm9sQ2xhc3NJbXBvcnRzKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpIHtcbiAgcmV0dXJuIGNvbnRyb2xDbGFzc05hbWVzLm1hcChjY2xhc3MgPT4gZ2V0SW1wb3J0U3BlY2lmaWVyKHNvdXJjZUZpbGUsICdAYW5ndWxhci9mb3JtcycsIGNjbGFzcykpXG4gICAgICAuZmlsdGVyKHYgPT4gdiAhPSBudWxsKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEZvcm1CdWlsZGVySW1wb3J0KHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpIHtcbiAgcmV0dXJuIGdldEltcG9ydFNwZWNpZmllcihzb3VyY2VGaWxlLCAnQGFuZ3VsYXIvZm9ybXMnLCAnRm9ybUJ1aWxkZXInKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEFueUltcG9ydChzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKSB7XG4gIHJldHVybiBnZXRJbXBvcnRTcGVjaWZpZXIoc291cmNlRmlsZSwgJ0Bhbmd1bGFyL2Zvcm1zJywgYW55U3ltYm9sTmFtZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kQ29udHJvbENsYXNzVXNhZ2VzKFxuICAgIHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUsIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcixcbiAgICBpbXBvcnRTcGVjaWZpZXI6IHRzLkltcG9ydFNwZWNpZmllcnxudWxsKTogTWlncmF0YWJsZU5vZGVbXSB7XG4gIGlmIChpbXBvcnRTcGVjaWZpZXIgPT09IG51bGwpIHJldHVybiBbXTtcbiAgY29uc3QgZ2VuZXJpYyA9IGA8JHthbnlTeW1ib2xOYW1lfT5gO1xuICBjb25zdCB1c2FnZXM6IE1pZ3JhdGFibGVOb2RlW10gPSBbXTtcbiAgY29uc3QgdmlzaXROb2RlID0gKG5vZGU6IHRzLk5vZGUpID0+IHtcbiAgICAvLyBMb29rIGZvciBhIGBuZXdgIGV4cHJlc3Npb24gd2l0aCBubyB0eXBlIGFyZ3VtZW50cyB3aGljaCByZWZlcmVuY2VzIGFuIGltcG9ydCB3ZSBjYXJlIGFib3V0OlxuICAgIC8vIGBuZXcgRm9ybUNvbnRyb2woKWBcbiAgICBpZiAodHMuaXNOZXdFeHByZXNzaW9uKG5vZGUpICYmICFub2RlLnR5cGVBcmd1bWVudHMgJiZcbiAgICAgICAgaXNSZWZlcmVuY2VUb0ltcG9ydCh0eXBlQ2hlY2tlciwgbm9kZS5leHByZXNzaW9uLCBpbXBvcnRTcGVjaWZpZXIpKSB7XG4gICAgICB1c2FnZXMucHVzaCh7bm9kZTogbm9kZS5leHByZXNzaW9uLCBnZW5lcmljfSk7XG4gICAgfVxuICAgIHRzLmZvckVhY2hDaGlsZChub2RlLCB2aXNpdE5vZGUpO1xuICB9O1xuICB0cy5mb3JFYWNoQ2hpbGQoc291cmNlRmlsZSwgdmlzaXROb2RlKTtcbiAgcmV0dXJuIHVzYWdlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRGb3JtQnVpbGRlckNhbGxzKFxuICAgIHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUsIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcixcbiAgICBpbXBvcnRTcGVjaWZpZXI6IHRzLkltcG9ydFNwZWNpZmllcnxudWxsKTogTWlncmF0YWJsZU5vZGVbXSB7XG4gIGlmICghaW1wb3J0U3BlY2lmaWVyKSByZXR1cm4gW107XG4gIGNvbnN0IHVzYWdlcyA9IG5ldyBBcnJheTxNaWdyYXRhYmxlTm9kZT4oKTtcbiAgdHMuZm9yRWFjaENoaWxkKHNvdXJjZUZpbGUsIGZ1bmN0aW9uIHZpc2l0Tm9kZShub2RlOiB0cy5Ob2RlKSB7XG4gICAgLy8gTG9vayBmb3IgY2FsbHMgdGhhdCBsb29rIGxpa2UgYGZvby48bWV0aG9kIHRvIG1pZ3JhdGU+YC5cbiAgICBpZiAodHMuaXNDYWxsRXhwcmVzc2lvbihub2RlKSAmJiAhbm9kZS50eXBlQXJndW1lbnRzICYmXG4gICAgICAgIHRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKG5vZGUuZXhwcmVzc2lvbikgJiYgdHMuaXNJZGVudGlmaWVyKG5vZGUuZXhwcmVzc2lvbi5uYW1lKSAmJlxuICAgICAgICBidWlsZGVyTWV0aG9kTmFtZXMuaW5jbHVkZXMobm9kZS5leHByZXNzaW9uLm5hbWUudGV4dCkpIHtcbiAgICAgIGNvbnN0IGdlbmVyaWMgPSBgPCR7YW55U3ltYm9sTmFtZX0+YDtcbiAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlIHR5cGUgb2YgdGhlIG9iamVjdCBvbiB3aGljaCB0aGUgZnVuY3Rpb24gaXMgY2FsbGVkIHJlZmVycyB0byB0aGVcbiAgICAgIC8vIHByb3ZpZGVkIGltcG9ydC5cbiAgICAgIGlmIChpc1JlZmVyZW5jZVRvSW1wb3J0KHR5cGVDaGVja2VyLCBub2RlLmV4cHJlc3Npb24uZXhwcmVzc2lvbiwgaW1wb3J0U3BlY2lmaWVyKSkge1xuICAgICAgICB1c2FnZXMucHVzaCh7bm9kZTogbm9kZS5leHByZXNzaW9uLCBnZW5lcmljfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRzLmZvckVhY2hDaGlsZChub2RlLCB2aXNpdE5vZGUpO1xuICB9KTtcbiAgcmV0dXJuIHVzYWdlcztcbn1cbiJdfQ==