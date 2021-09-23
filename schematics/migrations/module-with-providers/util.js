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
        const imp = (0, imports_1.getImportOfIdentifier)(typeChecker, node.typeName);
        return !!imp && imp.name === 'ModuleWithProviders' && imp.importModule === '@angular/core' &&
            !node.typeArguments;
    }
    exports.isModuleWithProvidersNotGeneric = isModuleWithProvidersNotGeneric;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL21vZHVsZS13aXRoLXByb3ZpZGVycy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUNqQywrRUFBcUU7SUFFckUsOENBQThDO0lBQzlDLFNBQWdCLDZCQUE2QixDQUN6QyxJQUFZLEVBQUUsSUFBMkI7UUFDM0MsTUFBTSxRQUFRLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxxQkFBcUIsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMvRSxNQUFNLGlCQUFpQixHQUFHLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDcEYsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQzdCLFFBQVEsRUFBRSxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1RSxDQUFDO0lBTkQsc0VBTUM7SUFFRCxtR0FBbUc7SUFDbkcsU0FBZ0IsK0JBQStCLENBQzNDLFdBQTJCLEVBQUUsSUFBYTtRQUM1QyxJQUFJLENBQUMsRUFBRSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDcEUsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUVELE1BQU0sR0FBRyxHQUFHLElBQUEsK0JBQXFCLEVBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5RCxPQUFPLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxxQkFBcUIsSUFBSSxHQUFHLENBQUMsWUFBWSxLQUFLLGVBQWU7WUFDdEYsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO0lBQzFCLENBQUM7SUFURCwwRUFTQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7Z2V0SW1wb3J0T2ZJZGVudGlmaWVyfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2ltcG9ydHMnO1xuXG4vKiogQWRkIGEgZ2VuZXJpYyB0eXBlIHRvIGEgdHlwZSByZWZlcmVuY2UuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTW9kdWxlV2l0aFByb3ZpZGVyc1R5cGUoXG4gICAgdHlwZTogc3RyaW5nLCBub2RlPzogdHMuVHlwZVJlZmVyZW5jZU5vZGUpOiB0cy5UeXBlUmVmZXJlbmNlTm9kZSB7XG4gIGNvbnN0IHR5cGVOb2RlID0gbm9kZSB8fCB0cy5jcmVhdGVUeXBlUmVmZXJlbmNlTm9kZSgnTW9kdWxlV2l0aFByb3ZpZGVycycsIFtdKTtcbiAgY29uc3QgdHlwZVJlZmVyZW5jZU5vZGUgPSB0cy5jcmVhdGVUeXBlUmVmZXJlbmNlTm9kZSh0cy5jcmVhdGVJZGVudGlmaWVyKHR5cGUpLCBbXSk7XG4gIHJldHVybiB0cy51cGRhdGVUeXBlUmVmZXJlbmNlTm9kZShcbiAgICAgIHR5cGVOb2RlLCB0eXBlTm9kZS50eXBlTmFtZSwgdHMuY3JlYXRlTm9kZUFycmF5KFt0eXBlUmVmZXJlbmNlTm9kZV0pKTtcbn1cblxuLyoqIERldGVybWluZSB3aGV0aGVyIGEgbm9kZSBpcyBhIE1vZHVsZVdpdGhQcm92aWRlcnMgdHlwZSByZWZlcmVuY2Ugbm9kZSB3aXRob3V0IGEgZ2VuZXJpYyB0eXBlICovXG5leHBvcnQgZnVuY3Rpb24gaXNNb2R1bGVXaXRoUHJvdmlkZXJzTm90R2VuZXJpYyhcbiAgICB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsIG5vZGU6IHRzLk5vZGUpOiBub2RlIGlzIHRzLlR5cGVSZWZlcmVuY2VOb2RlIHtcbiAgaWYgKCF0cy5pc1R5cGVSZWZlcmVuY2VOb2RlKG5vZGUpIHx8ICF0cy5pc0lkZW50aWZpZXIobm9kZS50eXBlTmFtZSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjb25zdCBpbXAgPSBnZXRJbXBvcnRPZklkZW50aWZpZXIodHlwZUNoZWNrZXIsIG5vZGUudHlwZU5hbWUpO1xuICByZXR1cm4gISFpbXAgJiYgaW1wLm5hbWUgPT09ICdNb2R1bGVXaXRoUHJvdmlkZXJzJyAmJiBpbXAuaW1wb3J0TW9kdWxlID09PSAnQGFuZ3VsYXIvY29yZScgJiZcbiAgICAgICFub2RlLnR5cGVBcmd1bWVudHM7XG59XG4iXX0=