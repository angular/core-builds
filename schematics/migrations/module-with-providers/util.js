/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
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
        define("@angular/core/schematics/migrations/module-with-providers/util", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/imports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isModuleWithProvidersNotGeneric = exports.createModuleWithProvidersType = void 0;
    const ts = require("typescript");
    const imports_1 = require("@angular/core/schematics/utils/typescript/imports");
    /** Add a generic type to a type reference. */
    function createModuleWithProvidersType(type, node) {
        const typeNode = node || ts.createTypeReferenceNode('ModuleWithProviders', []);
        const typeReferenceNode = ts.createTypeReferenceNode(ts.createIdentifier(type), []);
        return ts.updateTypeReferenceNode(typeNode, typeNode.typeName, ts.createNodeArray([typeReferenceNode]));
    }
    exports.createModuleWithProvidersType = createModuleWithProvidersType;
    /** Determine whether a node is a ModuleWithProviders type reference node without a generic type */
    function isModuleWithProvidersNotGeneric(typeChecker, node) {
        if (!ts.isTypeReferenceNode(node) || !ts.isIdentifier(node.typeName)) {
            return false;
        }
        const imp = imports_1.getImportOfIdentifier(typeChecker, node.typeName);
        return !!imp && imp.name === 'ModuleWithProviders' && imp.importModule === '@angular/core' &&
            !node.typeArguments;
    }
    exports.isModuleWithProvidersNotGeneric = isModuleWithProvidersNotGeneric;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL21vZHVsZS13aXRoLXByb3ZpZGVycy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUNqQywrRUFBcUU7SUFFckUsOENBQThDO0lBQzlDLFNBQWdCLDZCQUE2QixDQUN6QyxJQUFZLEVBQUUsSUFBMkI7UUFDM0MsTUFBTSxRQUFRLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxxQkFBcUIsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMvRSxNQUFNLGlCQUFpQixHQUFHLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDcEYsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQzdCLFFBQVEsRUFBRSxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1RSxDQUFDO0lBTkQsc0VBTUM7SUFFRCxtR0FBbUc7SUFDbkcsU0FBZ0IsK0JBQStCLENBQzNDLFdBQTJCLEVBQUUsSUFBYTtRQUM1QyxJQUFJLENBQUMsRUFBRSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDcEUsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUVELE1BQU0sR0FBRyxHQUFHLCtCQUFxQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDOUQsT0FBTyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUsscUJBQXFCLElBQUksR0FBRyxDQUFDLFlBQVksS0FBSyxlQUFlO1lBQ3RGLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQztJQUMxQixDQUFDO0lBVEQsMEVBU0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtnZXRJbXBvcnRPZklkZW50aWZpZXJ9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvaW1wb3J0cyc7XG5cbi8qKiBBZGQgYSBnZW5lcmljIHR5cGUgdG8gYSB0eXBlIHJlZmVyZW5jZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVNb2R1bGVXaXRoUHJvdmlkZXJzVHlwZShcbiAgICB0eXBlOiBzdHJpbmcsIG5vZGU/OiB0cy5UeXBlUmVmZXJlbmNlTm9kZSk6IHRzLlR5cGVSZWZlcmVuY2VOb2RlIHtcbiAgY29uc3QgdHlwZU5vZGUgPSBub2RlIHx8IHRzLmNyZWF0ZVR5cGVSZWZlcmVuY2VOb2RlKCdNb2R1bGVXaXRoUHJvdmlkZXJzJywgW10pO1xuICBjb25zdCB0eXBlUmVmZXJlbmNlTm9kZSA9IHRzLmNyZWF0ZVR5cGVSZWZlcmVuY2VOb2RlKHRzLmNyZWF0ZUlkZW50aWZpZXIodHlwZSksIFtdKTtcbiAgcmV0dXJuIHRzLnVwZGF0ZVR5cGVSZWZlcmVuY2VOb2RlKFxuICAgICAgdHlwZU5vZGUsIHR5cGVOb2RlLnR5cGVOYW1lLCB0cy5jcmVhdGVOb2RlQXJyYXkoW3R5cGVSZWZlcmVuY2VOb2RlXSkpO1xufVxuXG4vKiogRGV0ZXJtaW5lIHdoZXRoZXIgYSBub2RlIGlzIGEgTW9kdWxlV2l0aFByb3ZpZGVycyB0eXBlIHJlZmVyZW5jZSBub2RlIHdpdGhvdXQgYSBnZW5lcmljIHR5cGUgKi9cbmV4cG9ydCBmdW5jdGlvbiBpc01vZHVsZVdpdGhQcm92aWRlcnNOb3RHZW5lcmljKFxuICAgIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwgbm9kZTogdHMuTm9kZSk6IG5vZGUgaXMgdHMuVHlwZVJlZmVyZW5jZU5vZGUge1xuICBpZiAoIXRzLmlzVHlwZVJlZmVyZW5jZU5vZGUobm9kZSkgfHwgIXRzLmlzSWRlbnRpZmllcihub2RlLnR5cGVOYW1lKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IGltcCA9IGdldEltcG9ydE9mSWRlbnRpZmllcih0eXBlQ2hlY2tlciwgbm9kZS50eXBlTmFtZSk7XG4gIHJldHVybiAhIWltcCAmJiBpbXAubmFtZSA9PT0gJ01vZHVsZVdpdGhQcm92aWRlcnMnICYmIGltcC5pbXBvcnRNb2R1bGUgPT09ICdAYW5ndWxhci9jb3JlJyAmJlxuICAgICAgIW5vZGUudHlwZUFyZ3VtZW50cztcbn1cbiJdfQ==