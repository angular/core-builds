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
        define("@angular/core/schematics/migrations/module-with-providers/util", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/imports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isModuleWithProvidersNotGeneric = exports.createModuleWithProvidersType = void 0;
    const typescript_1 = __importDefault(require("typescript"));
    const imports_1 = require("@angular/core/schematics/utils/typescript/imports");
    /** Add a generic type to a type reference. */
    function createModuleWithProvidersType(type, node) {
        const typeNode = node || typescript_1.default.createTypeReferenceNode('ModuleWithProviders', []);
        const typeReferenceNode = typescript_1.default.createTypeReferenceNode(typescript_1.default.createIdentifier(type), []);
        return typescript_1.default.updateTypeReferenceNode(typeNode, typeNode.typeName, typescript_1.default.createNodeArray([typeReferenceNode]));
    }
    exports.createModuleWithProvidersType = createModuleWithProvidersType;
    /** Determine whether a node is a ModuleWithProviders type reference node without a generic type */
    function isModuleWithProvidersNotGeneric(typeChecker, node) {
        if (!typescript_1.default.isTypeReferenceNode(node) || !typescript_1.default.isIdentifier(node.typeName)) {
            return false;
        }
        const imp = (0, imports_1.getImportOfIdentifier)(typeChecker, node.typeName);
        return !!imp && imp.name === 'ModuleWithProviders' && imp.importModule === '@angular/core' &&
            !node.typeArguments;
    }
    exports.isModuleWithProvidersNotGeneric = isModuleWithProvidersNotGeneric;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL21vZHVsZS13aXRoLXByb3ZpZGVycy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7OztJQUVILDREQUE0QjtJQUM1QiwrRUFBcUU7SUFFckUsOENBQThDO0lBQzlDLFNBQWdCLDZCQUE2QixDQUN6QyxJQUFZLEVBQUUsSUFBMkI7UUFDM0MsTUFBTSxRQUFRLEdBQUcsSUFBSSxJQUFJLG9CQUFFLENBQUMsdUJBQXVCLENBQUMscUJBQXFCLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDL0UsTUFBTSxpQkFBaUIsR0FBRyxvQkFBRSxDQUFDLHVCQUF1QixDQUFDLG9CQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDcEYsT0FBTyxvQkFBRSxDQUFDLHVCQUF1QixDQUM3QixRQUFRLEVBQUUsUUFBUSxDQUFDLFFBQVEsRUFBRSxvQkFBRSxDQUFDLGVBQWUsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVFLENBQUM7SUFORCxzRUFNQztJQUVELG1HQUFtRztJQUNuRyxTQUFnQiwrQkFBK0IsQ0FDM0MsV0FBMkIsRUFBRSxJQUFhO1FBQzVDLElBQUksQ0FBQyxvQkFBRSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ3BFLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFBLCtCQUFxQixFQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDOUQsT0FBTyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUsscUJBQXFCLElBQUksR0FBRyxDQUFDLFlBQVksS0FBSyxlQUFlO1lBQ3RGLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQztJQUMxQixDQUFDO0lBVEQsMEVBU0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtnZXRJbXBvcnRPZklkZW50aWZpZXJ9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvaW1wb3J0cyc7XG5cbi8qKiBBZGQgYSBnZW5lcmljIHR5cGUgdG8gYSB0eXBlIHJlZmVyZW5jZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVNb2R1bGVXaXRoUHJvdmlkZXJzVHlwZShcbiAgICB0eXBlOiBzdHJpbmcsIG5vZGU/OiB0cy5UeXBlUmVmZXJlbmNlTm9kZSk6IHRzLlR5cGVSZWZlcmVuY2VOb2RlIHtcbiAgY29uc3QgdHlwZU5vZGUgPSBub2RlIHx8IHRzLmNyZWF0ZVR5cGVSZWZlcmVuY2VOb2RlKCdNb2R1bGVXaXRoUHJvdmlkZXJzJywgW10pO1xuICBjb25zdCB0eXBlUmVmZXJlbmNlTm9kZSA9IHRzLmNyZWF0ZVR5cGVSZWZlcmVuY2VOb2RlKHRzLmNyZWF0ZUlkZW50aWZpZXIodHlwZSksIFtdKTtcbiAgcmV0dXJuIHRzLnVwZGF0ZVR5cGVSZWZlcmVuY2VOb2RlKFxuICAgICAgdHlwZU5vZGUsIHR5cGVOb2RlLnR5cGVOYW1lLCB0cy5jcmVhdGVOb2RlQXJyYXkoW3R5cGVSZWZlcmVuY2VOb2RlXSkpO1xufVxuXG4vKiogRGV0ZXJtaW5lIHdoZXRoZXIgYSBub2RlIGlzIGEgTW9kdWxlV2l0aFByb3ZpZGVycyB0eXBlIHJlZmVyZW5jZSBub2RlIHdpdGhvdXQgYSBnZW5lcmljIHR5cGUgKi9cbmV4cG9ydCBmdW5jdGlvbiBpc01vZHVsZVdpdGhQcm92aWRlcnNOb3RHZW5lcmljKFxuICAgIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwgbm9kZTogdHMuTm9kZSk6IG5vZGUgaXMgdHMuVHlwZVJlZmVyZW5jZU5vZGUge1xuICBpZiAoIXRzLmlzVHlwZVJlZmVyZW5jZU5vZGUobm9kZSkgfHwgIXRzLmlzSWRlbnRpZmllcihub2RlLnR5cGVOYW1lKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IGltcCA9IGdldEltcG9ydE9mSWRlbnRpZmllcih0eXBlQ2hlY2tlciwgbm9kZS50eXBlTmFtZSk7XG4gIHJldHVybiAhIWltcCAmJiBpbXAubmFtZSA9PT0gJ01vZHVsZVdpdGhQcm92aWRlcnMnICYmIGltcC5pbXBvcnRNb2R1bGUgPT09ICdAYW5ndWxhci9jb3JlJyAmJlxuICAgICAgIW5vZGUudHlwZUFyZ3VtZW50cztcbn1cbiJdfQ==