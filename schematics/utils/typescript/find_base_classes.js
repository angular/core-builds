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
        define("@angular/core/schematics/utils/typescript/find_base_classes", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/class_declaration"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findBaseClassDeclarations = void 0;
    const ts = require("typescript");
    const class_declaration_1 = require("@angular/core/schematics/utils/typescript/class_declaration");
    /** Gets all base class declarations of the specified class declaration. */
    function findBaseClassDeclarations(node, typeChecker) {
        const result = [];
        let currentClass = node;
        while (currentClass) {
            const baseTypes = (0, class_declaration_1.getBaseTypeIdentifiers)(currentClass);
            if (!baseTypes || baseTypes.length !== 1) {
                break;
            }
            const symbol = typeChecker.getTypeAtLocation(baseTypes[0]).getSymbol();
            // Note: `ts.Symbol#valueDeclaration` can be undefined. TypeScript has an incorrect type
            // for this: https://github.com/microsoft/TypeScript/issues/24706.
            if (!symbol || !symbol.valueDeclaration || !ts.isClassDeclaration(symbol.valueDeclaration)) {
                break;
            }
            result.push({ identifier: baseTypes[0], node: symbol.valueDeclaration });
            currentClass = symbol.valueDeclaration;
        }
        return result;
    }
    exports.findBaseClassDeclarations = findBaseClassDeclarations;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZF9iYXNlX2NsYXNzZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvdXRpbHMvdHlwZXNjcmlwdC9maW5kX2Jhc2VfY2xhc3Nlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCxpQ0FBaUM7SUFDakMsbUdBQTJEO0lBRTNELDJFQUEyRTtJQUMzRSxTQUFnQix5QkFBeUIsQ0FBQyxJQUF5QixFQUFFLFdBQTJCO1FBQzlGLE1BQU0sTUFBTSxHQUE2RCxFQUFFLENBQUM7UUFDNUUsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBRXhCLE9BQU8sWUFBWSxFQUFFO1lBQ25CLE1BQU0sU0FBUyxHQUFHLElBQUEsMENBQXNCLEVBQUMsWUFBWSxDQUFDLENBQUM7WUFDdkQsSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDeEMsTUFBTTthQUNQO1lBQ0QsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3ZFLHdGQUF3RjtZQUN4RixrRUFBa0U7WUFDbEUsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsSUFBSSxDQUFDLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtnQkFDMUYsTUFBTTthQUNQO1lBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBQyxDQUFDLENBQUM7WUFDdkUsWUFBWSxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztTQUN4QztRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFuQkQsOERBbUJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtnZXRCYXNlVHlwZUlkZW50aWZpZXJzfSBmcm9tICcuL2NsYXNzX2RlY2xhcmF0aW9uJztcblxuLyoqIEdldHMgYWxsIGJhc2UgY2xhc3MgZGVjbGFyYXRpb25zIG9mIHRoZSBzcGVjaWZpZWQgY2xhc3MgZGVjbGFyYXRpb24uICovXG5leHBvcnQgZnVuY3Rpb24gZmluZEJhc2VDbGFzc0RlY2xhcmF0aW9ucyhub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIpIHtcbiAgY29uc3QgcmVzdWx0OiB7aWRlbnRpZmllcjogdHMuSWRlbnRpZmllciwgbm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbn1bXSA9IFtdO1xuICBsZXQgY3VycmVudENsYXNzID0gbm9kZTtcblxuICB3aGlsZSAoY3VycmVudENsYXNzKSB7XG4gICAgY29uc3QgYmFzZVR5cGVzID0gZ2V0QmFzZVR5cGVJZGVudGlmaWVycyhjdXJyZW50Q2xhc3MpO1xuICAgIGlmICghYmFzZVR5cGVzIHx8IGJhc2VUeXBlcy5sZW5ndGggIT09IDEpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjb25zdCBzeW1ib2wgPSB0eXBlQ2hlY2tlci5nZXRUeXBlQXRMb2NhdGlvbihiYXNlVHlwZXNbMF0pLmdldFN5bWJvbCgpO1xuICAgIC8vIE5vdGU6IGB0cy5TeW1ib2wjdmFsdWVEZWNsYXJhdGlvbmAgY2FuIGJlIHVuZGVmaW5lZC4gVHlwZVNjcmlwdCBoYXMgYW4gaW5jb3JyZWN0IHR5cGVcbiAgICAvLyBmb3IgdGhpczogaHR0cHM6Ly9naXRodWIuY29tL21pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8yNDcwNi5cbiAgICBpZiAoIXN5bWJvbCB8fCAhc3ltYm9sLnZhbHVlRGVjbGFyYXRpb24gfHwgIXRzLmlzQ2xhc3NEZWNsYXJhdGlvbihzeW1ib2wudmFsdWVEZWNsYXJhdGlvbikpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXN1bHQucHVzaCh7aWRlbnRpZmllcjogYmFzZVR5cGVzWzBdLCBub2RlOiBzeW1ib2wudmFsdWVEZWNsYXJhdGlvbn0pO1xuICAgIGN1cnJlbnRDbGFzcyA9IHN5bWJvbC52YWx1ZURlY2xhcmF0aW9uO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG4iXX0=