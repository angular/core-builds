/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/migrations/initial-navigation/util", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/imports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isExtraOptions = exports.isRouterModuleForRoot = void 0;
    const ts = require("typescript");
    const imports_1 = require("@angular/core/schematics/utils/typescript/imports");
    /** Determine whether a node is a ModuleWithProviders type reference node without a generic type */
    function isRouterModuleForRoot(typeChecker, node) {
        if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression) ||
            !ts.isIdentifier(node.expression.expression) || node.expression.name.text !== 'forRoot') {
            return false;
        }
        const imp = (0, imports_1.getImportOfIdentifier)(typeChecker, node.expression.expression);
        return !!imp && imp.name === 'RouterModule' && imp.importModule === '@angular/router' &&
            !node.typeArguments;
    }
    exports.isRouterModuleForRoot = isRouterModuleForRoot;
    function isExtraOptions(typeChecker, node) {
        if (!ts.isTypeReferenceNode(node) || !ts.isIdentifier(node.typeName)) {
            return false;
        }
        const imp = (0, imports_1.getImportOfIdentifier)(typeChecker, node.typeName);
        return imp !== null && imp.name === 'ExtraOptions' && imp.importModule === '@angular/router' &&
            !node.typeArguments;
    }
    exports.isExtraOptions = isExtraOptions;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL2luaXRpYWwtbmF2aWdhdGlvbi91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUNqQywrRUFBcUU7SUFFckUsbUdBQW1HO0lBQ25HLFNBQWdCLHFCQUFxQixDQUNqQyxXQUEyQixFQUFFLElBQWE7UUFDNUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQzdFLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUU7WUFDM0YsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUNELE1BQU0sR0FBRyxHQUFHLElBQUEsK0JBQXFCLEVBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDM0UsT0FBTyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssY0FBYyxJQUFJLEdBQUcsQ0FBQyxZQUFZLEtBQUssaUJBQWlCO1lBQ2pGLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQztJQUMxQixDQUFDO0lBVEQsc0RBU0M7SUFFRCxTQUFnQixjQUFjLENBQzFCLFdBQTJCLEVBQUUsSUFBYTtRQUM1QyxJQUFJLENBQUMsRUFBRSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDcEUsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUVELE1BQU0sR0FBRyxHQUFHLElBQUEsK0JBQXFCLEVBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5RCxPQUFPLEdBQUcsS0FBSyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxjQUFjLElBQUksR0FBRyxDQUFDLFlBQVksS0FBSyxpQkFBaUI7WUFDeEYsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO0lBQzFCLENBQUM7SUFURCx3Q0FTQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7Z2V0SW1wb3J0T2ZJZGVudGlmaWVyfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2ltcG9ydHMnO1xuXG4vKiogRGV0ZXJtaW5lIHdoZXRoZXIgYSBub2RlIGlzIGEgTW9kdWxlV2l0aFByb3ZpZGVycyB0eXBlIHJlZmVyZW5jZSBub2RlIHdpdGhvdXQgYSBnZW5lcmljIHR5cGUgKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1JvdXRlck1vZHVsZUZvclJvb3QoXG4gICAgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLCBub2RlOiB0cy5Ob2RlKTogbm9kZSBpcyB0cy5DYWxsRXhwcmVzc2lvbiB7XG4gIGlmICghdHMuaXNDYWxsRXhwcmVzc2lvbihub2RlKSB8fCAhdHMuaXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24obm9kZS5leHByZXNzaW9uKSB8fFxuICAgICAgIXRzLmlzSWRlbnRpZmllcihub2RlLmV4cHJlc3Npb24uZXhwcmVzc2lvbikgfHwgbm9kZS5leHByZXNzaW9uLm5hbWUudGV4dCAhPT0gJ2ZvclJvb3QnKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IGltcCA9IGdldEltcG9ydE9mSWRlbnRpZmllcih0eXBlQ2hlY2tlciwgbm9kZS5leHByZXNzaW9uLmV4cHJlc3Npb24pO1xuICByZXR1cm4gISFpbXAgJiYgaW1wLm5hbWUgPT09ICdSb3V0ZXJNb2R1bGUnICYmIGltcC5pbXBvcnRNb2R1bGUgPT09ICdAYW5ndWxhci9yb3V0ZXInICYmXG4gICAgICAhbm9kZS50eXBlQXJndW1lbnRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNFeHRyYU9wdGlvbnMoXG4gICAgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLCBub2RlOiB0cy5Ob2RlKTogbm9kZSBpcyB0cy5UeXBlUmVmZXJlbmNlTm9kZSB7XG4gIGlmICghdHMuaXNUeXBlUmVmZXJlbmNlTm9kZShub2RlKSB8fCAhdHMuaXNJZGVudGlmaWVyKG5vZGUudHlwZU5hbWUpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29uc3QgaW1wID0gZ2V0SW1wb3J0T2ZJZGVudGlmaWVyKHR5cGVDaGVja2VyLCBub2RlLnR5cGVOYW1lKTtcbiAgcmV0dXJuIGltcCAhPT0gbnVsbCAmJiBpbXAubmFtZSA9PT0gJ0V4dHJhT3B0aW9ucycgJiYgaW1wLmltcG9ydE1vZHVsZSA9PT0gJ0Bhbmd1bGFyL3JvdXRlcicgJiZcbiAgICAgICFub2RlLnR5cGVBcmd1bWVudHM7XG59XG4iXX0=