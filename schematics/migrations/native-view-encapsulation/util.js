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
        define("@angular/core/schematics/migrations/native-view-encapsulation/util", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/imports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findNativeEncapsulationNodes = void 0;
    const typescript_1 = __importDefault(require("typescript"));
    const imports_1 = require("@angular/core/schematics/utils/typescript/imports");
    /** Finds all the Identifier nodes in a file that refer to `Native` view encapsulation. */
    function findNativeEncapsulationNodes(typeChecker, sourceFile) {
        const results = new Set();
        sourceFile.forEachChild(function walkNode(node) {
            // Note that we look directly for nodes in the form of `<something>.Native`, rather than going
            // for `Component` class decorators, because it's much simpler and it allows us to handle cases
            // where `ViewEncapsulation.Native` might be used in a different context (e.g. a variable).
            // Using the encapsulation outside of a decorator is an edge case, but we do have public APIs
            // where it can be passed in (see the `defaultViewEncapsulation` property on the
            // `COMPILER_OPTIONS` provider).
            if (typescript_1.default.isPropertyAccessExpression(node) && typescript_1.default.isIdentifier(node.name) &&
                node.name.text === 'Native' && typescript_1.default.isIdentifier(node.expression)) {
                const expressionImport = (0, imports_1.getImportOfIdentifier)(typeChecker, node.expression);
                if (expressionImport && expressionImport.name === 'ViewEncapsulation' &&
                    expressionImport.importModule === '@angular/core') {
                    results.add(node.name);
                }
            }
            else {
                node.forEachChild(walkNode);
            }
        });
        return results;
    }
    exports.findNativeEncapsulationNodes = findNativeEncapsulationNodes;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL25hdGl2ZS12aWV3LWVuY2Fwc3VsYXRpb24vdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7SUFFSCw0REFBNEI7SUFFNUIsK0VBQXFFO0lBRXJFLDBGQUEwRjtJQUMxRixTQUFnQiw0QkFBNEIsQ0FDeEMsV0FBMkIsRUFBRSxVQUF5QjtRQUN4RCxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsRUFBaUIsQ0FBQztRQUV6QyxVQUFVLENBQUMsWUFBWSxDQUFDLFNBQVMsUUFBUSxDQUFDLElBQWE7WUFDckQsOEZBQThGO1lBQzlGLCtGQUErRjtZQUMvRiwyRkFBMkY7WUFDM0YsNkZBQTZGO1lBQzdGLGdGQUFnRjtZQUNoRixnQ0FBZ0M7WUFDaEMsSUFBSSxvQkFBRSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxJQUFJLG9CQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ2pFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLFFBQVEsSUFBSSxvQkFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQ25FLE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSwrQkFBcUIsRUFBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUM3RSxJQUFJLGdCQUFnQixJQUFJLGdCQUFnQixDQUFDLElBQUksS0FBSyxtQkFBbUI7b0JBQ2pFLGdCQUFnQixDQUFDLFlBQVksS0FBSyxlQUFlLEVBQUU7b0JBQ3JELE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUN4QjthQUNGO2lCQUFNO2dCQUNMLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDN0I7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUF4QkQsb0VBd0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtnZXRJbXBvcnRPZklkZW50aWZpZXJ9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvaW1wb3J0cyc7XG5cbi8qKiBGaW5kcyBhbGwgdGhlIElkZW50aWZpZXIgbm9kZXMgaW4gYSBmaWxlIHRoYXQgcmVmZXIgdG8gYE5hdGl2ZWAgdmlldyBlbmNhcHN1bGF0aW9uLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmROYXRpdmVFbmNhcHN1bGF0aW9uTm9kZXMoXG4gICAgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLCBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogU2V0PHRzLklkZW50aWZpZXI+IHtcbiAgY29uc3QgcmVzdWx0cyA9IG5ldyBTZXQ8dHMuSWRlbnRpZmllcj4oKTtcblxuICBzb3VyY2VGaWxlLmZvckVhY2hDaGlsZChmdW5jdGlvbiB3YWxrTm9kZShub2RlOiB0cy5Ob2RlKSB7XG4gICAgLy8gTm90ZSB0aGF0IHdlIGxvb2sgZGlyZWN0bHkgZm9yIG5vZGVzIGluIHRoZSBmb3JtIG9mIGA8c29tZXRoaW5nPi5OYXRpdmVgLCByYXRoZXIgdGhhbiBnb2luZ1xuICAgIC8vIGZvciBgQ29tcG9uZW50YCBjbGFzcyBkZWNvcmF0b3JzLCBiZWNhdXNlIGl0J3MgbXVjaCBzaW1wbGVyIGFuZCBpdCBhbGxvd3MgdXMgdG8gaGFuZGxlIGNhc2VzXG4gICAgLy8gd2hlcmUgYFZpZXdFbmNhcHN1bGF0aW9uLk5hdGl2ZWAgbWlnaHQgYmUgdXNlZCBpbiBhIGRpZmZlcmVudCBjb250ZXh0IChlLmcuIGEgdmFyaWFibGUpLlxuICAgIC8vIFVzaW5nIHRoZSBlbmNhcHN1bGF0aW9uIG91dHNpZGUgb2YgYSBkZWNvcmF0b3IgaXMgYW4gZWRnZSBjYXNlLCBidXQgd2UgZG8gaGF2ZSBwdWJsaWMgQVBJc1xuICAgIC8vIHdoZXJlIGl0IGNhbiBiZSBwYXNzZWQgaW4gKHNlZSB0aGUgYGRlZmF1bHRWaWV3RW5jYXBzdWxhdGlvbmAgcHJvcGVydHkgb24gdGhlXG4gICAgLy8gYENPTVBJTEVSX09QVElPTlNgIHByb3ZpZGVyKS5cbiAgICBpZiAodHMuaXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24obm9kZSkgJiYgdHMuaXNJZGVudGlmaWVyKG5vZGUubmFtZSkgJiZcbiAgICAgICAgbm9kZS5uYW1lLnRleHQgPT09ICdOYXRpdmUnICYmIHRzLmlzSWRlbnRpZmllcihub2RlLmV4cHJlc3Npb24pKSB7XG4gICAgICBjb25zdCBleHByZXNzaW9uSW1wb3J0ID0gZ2V0SW1wb3J0T2ZJZGVudGlmaWVyKHR5cGVDaGVja2VyLCBub2RlLmV4cHJlc3Npb24pO1xuICAgICAgaWYgKGV4cHJlc3Npb25JbXBvcnQgJiYgZXhwcmVzc2lvbkltcG9ydC5uYW1lID09PSAnVmlld0VuY2Fwc3VsYXRpb24nICYmXG4gICAgICAgICAgZXhwcmVzc2lvbkltcG9ydC5pbXBvcnRNb2R1bGUgPT09ICdAYW5ndWxhci9jb3JlJykge1xuICAgICAgICByZXN1bHRzLmFkZChub2RlLm5hbWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBub2RlLmZvckVhY2hDaGlsZCh3YWxrTm9kZSk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gcmVzdWx0cztcbn1cbiJdfQ==