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
            const baseTypes = class_declaration_1.getBaseTypeIdentifiers(currentClass);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZF9iYXNlX2NsYXNzZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvdXRpbHMvdHlwZXNjcmlwdC9maW5kX2Jhc2VfY2xhc3Nlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCxpQ0FBaUM7SUFDakMsbUdBQTJEO0lBRTNELDJFQUEyRTtJQUMzRSxTQUFnQix5QkFBeUIsQ0FBQyxJQUF5QixFQUFFLFdBQTJCO1FBQzlGLE1BQU0sTUFBTSxHQUE2RCxFQUFFLENBQUM7UUFDNUUsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBRXhCLE9BQU8sWUFBWSxFQUFFO1lBQ25CLE1BQU0sU0FBUyxHQUFHLDBDQUFzQixDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3ZELElBQUksQ0FBQyxTQUFTLElBQUksU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQ3hDLE1BQU07YUFDUDtZQUNELE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUN2RSx3RkFBd0Y7WUFDeEYsa0VBQWtFO1lBQ2xFLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxFQUFFLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEVBQUU7Z0JBQzFGLE1BQU07YUFDUDtZQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsZ0JBQWdCLEVBQUMsQ0FBQyxDQUFDO1lBQ3ZFLFlBQVksR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUM7U0FDeEM7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBbkJELDhEQW1CQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge2dldEJhc2VUeXBlSWRlbnRpZmllcnN9IGZyb20gJy4vY2xhc3NfZGVjbGFyYXRpb24nO1xuXG4vKiogR2V0cyBhbGwgYmFzZSBjbGFzcyBkZWNsYXJhdGlvbnMgb2YgdGhlIHNwZWNpZmllZCBjbGFzcyBkZWNsYXJhdGlvbi4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kQmFzZUNsYXNzRGVjbGFyYXRpb25zKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24sIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcikge1xuICBjb25zdCByZXN1bHQ6IHtpZGVudGlmaWVyOiB0cy5JZGVudGlmaWVyLCBub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9ufVtdID0gW107XG4gIGxldCBjdXJyZW50Q2xhc3MgPSBub2RlO1xuXG4gIHdoaWxlIChjdXJyZW50Q2xhc3MpIHtcbiAgICBjb25zdCBiYXNlVHlwZXMgPSBnZXRCYXNlVHlwZUlkZW50aWZpZXJzKGN1cnJlbnRDbGFzcyk7XG4gICAgaWYgKCFiYXNlVHlwZXMgfHwgYmFzZVR5cGVzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNvbnN0IHN5bWJvbCA9IHR5cGVDaGVja2VyLmdldFR5cGVBdExvY2F0aW9uKGJhc2VUeXBlc1swXSkuZ2V0U3ltYm9sKCk7XG4gICAgLy8gTm90ZTogYHRzLlN5bWJvbCN2YWx1ZURlY2xhcmF0aW9uYCBjYW4gYmUgdW5kZWZpbmVkLiBUeXBlU2NyaXB0IGhhcyBhbiBpbmNvcnJlY3QgdHlwZVxuICAgIC8vIGZvciB0aGlzOiBodHRwczovL2dpdGh1Yi5jb20vbWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzI0NzA2LlxuICAgIGlmICghc3ltYm9sIHx8ICFzeW1ib2wudmFsdWVEZWNsYXJhdGlvbiB8fCAhdHMuaXNDbGFzc0RlY2xhcmF0aW9uKHN5bWJvbC52YWx1ZURlY2xhcmF0aW9uKSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJlc3VsdC5wdXNoKHtpZGVudGlmaWVyOiBiYXNlVHlwZXNbMF0sIG5vZGU6IHN5bWJvbC52YWx1ZURlY2xhcmF0aW9ufSk7XG4gICAgY3VycmVudENsYXNzID0gc3ltYm9sLnZhbHVlRGVjbGFyYXRpb247XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cbiJdfQ==