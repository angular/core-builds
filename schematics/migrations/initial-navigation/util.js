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
        define("@angular/core/schematics/migrations/initial-navigation/util", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/imports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isExtraOptions = exports.isRouterModuleForRoot = void 0;
    const typescript_1 = __importDefault(require("typescript"));
    const imports_1 = require("@angular/core/schematics/utils/typescript/imports");
    /** Determine whether a node is a ModuleWithProviders type reference node without a generic type */
    function isRouterModuleForRoot(typeChecker, node) {
        if (!typescript_1.default.isCallExpression(node) || !typescript_1.default.isPropertyAccessExpression(node.expression) ||
            !typescript_1.default.isIdentifier(node.expression.expression) || node.expression.name.text !== 'forRoot') {
            return false;
        }
        const imp = (0, imports_1.getImportOfIdentifier)(typeChecker, node.expression.expression);
        return !!imp && imp.name === 'RouterModule' && imp.importModule === '@angular/router' &&
            !node.typeArguments;
    }
    exports.isRouterModuleForRoot = isRouterModuleForRoot;
    function isExtraOptions(typeChecker, node) {
        if (!typescript_1.default.isTypeReferenceNode(node) || !typescript_1.default.isIdentifier(node.typeName)) {
            return false;
        }
        const imp = (0, imports_1.getImportOfIdentifier)(typeChecker, node.typeName);
        return imp !== null && imp.name === 'ExtraOptions' && imp.importModule === '@angular/router' &&
            !node.typeArguments;
    }
    exports.isExtraOptions = isExtraOptions;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL2luaXRpYWwtbmF2aWdhdGlvbi91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7OztJQUVILDREQUE0QjtJQUM1QiwrRUFBcUU7SUFFckUsbUdBQW1HO0lBQ25HLFNBQWdCLHFCQUFxQixDQUNqQyxXQUEyQixFQUFFLElBQWE7UUFDNUMsSUFBSSxDQUFDLG9CQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBRSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDN0UsQ0FBQyxvQkFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUU7WUFDM0YsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUNELE1BQU0sR0FBRyxHQUFHLElBQUEsK0JBQXFCLEVBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDM0UsT0FBTyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssY0FBYyxJQUFJLEdBQUcsQ0FBQyxZQUFZLEtBQUssaUJBQWlCO1lBQ2pGLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQztJQUMxQixDQUFDO0lBVEQsc0RBU0M7SUFFRCxTQUFnQixjQUFjLENBQzFCLFdBQTJCLEVBQUUsSUFBYTtRQUM1QyxJQUFJLENBQUMsb0JBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNwRSxPQUFPLEtBQUssQ0FBQztTQUNkO1FBRUQsTUFBTSxHQUFHLEdBQUcsSUFBQSwrQkFBcUIsRUFBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlELE9BQU8sR0FBRyxLQUFLLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLGNBQWMsSUFBSSxHQUFHLENBQUMsWUFBWSxLQUFLLGlCQUFpQjtZQUN4RixDQUFDLElBQUksQ0FBQyxhQUFhLENBQUM7SUFDMUIsQ0FBQztJQVRELHdDQVNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7Z2V0SW1wb3J0T2ZJZGVudGlmaWVyfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2ltcG9ydHMnO1xuXG4vKiogRGV0ZXJtaW5lIHdoZXRoZXIgYSBub2RlIGlzIGEgTW9kdWxlV2l0aFByb3ZpZGVycyB0eXBlIHJlZmVyZW5jZSBub2RlIHdpdGhvdXQgYSBnZW5lcmljIHR5cGUgKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1JvdXRlck1vZHVsZUZvclJvb3QoXG4gICAgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLCBub2RlOiB0cy5Ob2RlKTogbm9kZSBpcyB0cy5DYWxsRXhwcmVzc2lvbiB7XG4gIGlmICghdHMuaXNDYWxsRXhwcmVzc2lvbihub2RlKSB8fCAhdHMuaXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24obm9kZS5leHByZXNzaW9uKSB8fFxuICAgICAgIXRzLmlzSWRlbnRpZmllcihub2RlLmV4cHJlc3Npb24uZXhwcmVzc2lvbikgfHwgbm9kZS5leHByZXNzaW9uLm5hbWUudGV4dCAhPT0gJ2ZvclJvb3QnKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IGltcCA9IGdldEltcG9ydE9mSWRlbnRpZmllcih0eXBlQ2hlY2tlciwgbm9kZS5leHByZXNzaW9uLmV4cHJlc3Npb24pO1xuICByZXR1cm4gISFpbXAgJiYgaW1wLm5hbWUgPT09ICdSb3V0ZXJNb2R1bGUnICYmIGltcC5pbXBvcnRNb2R1bGUgPT09ICdAYW5ndWxhci9yb3V0ZXInICYmXG4gICAgICAhbm9kZS50eXBlQXJndW1lbnRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNFeHRyYU9wdGlvbnMoXG4gICAgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLCBub2RlOiB0cy5Ob2RlKTogbm9kZSBpcyB0cy5UeXBlUmVmZXJlbmNlTm9kZSB7XG4gIGlmICghdHMuaXNUeXBlUmVmZXJlbmNlTm9kZShub2RlKSB8fCAhdHMuaXNJZGVudGlmaWVyKG5vZGUudHlwZU5hbWUpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29uc3QgaW1wID0gZ2V0SW1wb3J0T2ZJZGVudGlmaWVyKHR5cGVDaGVja2VyLCBub2RlLnR5cGVOYW1lKTtcbiAgcmV0dXJuIGltcCAhPT0gbnVsbCAmJiBpbXAubmFtZSA9PT0gJ0V4dHJhT3B0aW9ucycgJiYgaW1wLmltcG9ydE1vZHVsZSA9PT0gJ0Bhbmd1bGFyL3JvdXRlcicgJiZcbiAgICAgICFub2RlLnR5cGVBcmd1bWVudHM7XG59XG4iXX0=