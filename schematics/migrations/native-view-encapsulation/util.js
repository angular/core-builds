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
        define("@angular/core/schematics/migrations/native-view-encapsulation/util", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/imports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findNativeEncapsulationNodes = void 0;
    const ts = require("typescript");
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
            if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.name) &&
                node.name.text === 'Native' && ts.isIdentifier(node.expression)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL25hdGl2ZS12aWV3LWVuY2Fwc3VsYXRpb24vdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCxpQ0FBaUM7SUFFakMsK0VBQXFFO0lBRXJFLDBGQUEwRjtJQUMxRixTQUFnQiw0QkFBNEIsQ0FDeEMsV0FBMkIsRUFBRSxVQUF5QjtRQUN4RCxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsRUFBaUIsQ0FBQztRQUV6QyxVQUFVLENBQUMsWUFBWSxDQUFDLFNBQVMsUUFBUSxDQUFDLElBQWE7WUFDckQsOEZBQThGO1lBQzlGLCtGQUErRjtZQUMvRiwyRkFBMkY7WUFDM0YsNkZBQTZGO1lBQzdGLGdGQUFnRjtZQUNoRixnQ0FBZ0M7WUFDaEMsSUFBSSxFQUFFLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2dCQUNqRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQ25FLE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSwrQkFBcUIsRUFBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUM3RSxJQUFJLGdCQUFnQixJQUFJLGdCQUFnQixDQUFDLElBQUksS0FBSyxtQkFBbUI7b0JBQ2pFLGdCQUFnQixDQUFDLFlBQVksS0FBSyxlQUFlLEVBQUU7b0JBQ3JELE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUN4QjthQUNGO2lCQUFNO2dCQUNMLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDN0I7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUF4QkQsb0VBd0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2dldEltcG9ydE9mSWRlbnRpZmllcn0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9pbXBvcnRzJztcblxuLyoqIEZpbmRzIGFsbCB0aGUgSWRlbnRpZmllciBub2RlcyBpbiBhIGZpbGUgdGhhdCByZWZlciB0byBgTmF0aXZlYCB2aWV3IGVuY2Fwc3VsYXRpb24uICovXG5leHBvcnQgZnVuY3Rpb24gZmluZE5hdGl2ZUVuY2Fwc3VsYXRpb25Ob2RlcyhcbiAgICB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsIHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpOiBTZXQ8dHMuSWRlbnRpZmllcj4ge1xuICBjb25zdCByZXN1bHRzID0gbmV3IFNldDx0cy5JZGVudGlmaWVyPigpO1xuXG4gIHNvdXJjZUZpbGUuZm9yRWFjaENoaWxkKGZ1bmN0aW9uIHdhbGtOb2RlKG5vZGU6IHRzLk5vZGUpIHtcbiAgICAvLyBOb3RlIHRoYXQgd2UgbG9vayBkaXJlY3RseSBmb3Igbm9kZXMgaW4gdGhlIGZvcm0gb2YgYDxzb21ldGhpbmc+Lk5hdGl2ZWAsIHJhdGhlciB0aGFuIGdvaW5nXG4gICAgLy8gZm9yIGBDb21wb25lbnRgIGNsYXNzIGRlY29yYXRvcnMsIGJlY2F1c2UgaXQncyBtdWNoIHNpbXBsZXIgYW5kIGl0IGFsbG93cyB1cyB0byBoYW5kbGUgY2FzZXNcbiAgICAvLyB3aGVyZSBgVmlld0VuY2Fwc3VsYXRpb24uTmF0aXZlYCBtaWdodCBiZSB1c2VkIGluIGEgZGlmZmVyZW50IGNvbnRleHQgKGUuZy4gYSB2YXJpYWJsZSkuXG4gICAgLy8gVXNpbmcgdGhlIGVuY2Fwc3VsYXRpb24gb3V0c2lkZSBvZiBhIGRlY29yYXRvciBpcyBhbiBlZGdlIGNhc2UsIGJ1dCB3ZSBkbyBoYXZlIHB1YmxpYyBBUElzXG4gICAgLy8gd2hlcmUgaXQgY2FuIGJlIHBhc3NlZCBpbiAoc2VlIHRoZSBgZGVmYXVsdFZpZXdFbmNhcHN1bGF0aW9uYCBwcm9wZXJ0eSBvbiB0aGVcbiAgICAvLyBgQ09NUElMRVJfT1BUSU9OU2AgcHJvdmlkZXIpLlxuICAgIGlmICh0cy5pc1Byb3BlcnR5QWNjZXNzRXhwcmVzc2lvbihub2RlKSAmJiB0cy5pc0lkZW50aWZpZXIobm9kZS5uYW1lKSAmJlxuICAgICAgICBub2RlLm5hbWUudGV4dCA9PT0gJ05hdGl2ZScgJiYgdHMuaXNJZGVudGlmaWVyKG5vZGUuZXhwcmVzc2lvbikpIHtcbiAgICAgIGNvbnN0IGV4cHJlc3Npb25JbXBvcnQgPSBnZXRJbXBvcnRPZklkZW50aWZpZXIodHlwZUNoZWNrZXIsIG5vZGUuZXhwcmVzc2lvbik7XG4gICAgICBpZiAoZXhwcmVzc2lvbkltcG9ydCAmJiBleHByZXNzaW9uSW1wb3J0Lm5hbWUgPT09ICdWaWV3RW5jYXBzdWxhdGlvbicgJiZcbiAgICAgICAgICBleHByZXNzaW9uSW1wb3J0LmltcG9ydE1vZHVsZSA9PT0gJ0Bhbmd1bGFyL2NvcmUnKSB7XG4gICAgICAgIHJlc3VsdHMuYWRkKG5vZGUubmFtZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vZGUuZm9yRWFjaENoaWxkKHdhbGtOb2RlKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiByZXN1bHRzO1xufVxuIl19