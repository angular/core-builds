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
        define("@angular/core/schematics/migrations/static-queries/typescript/class_declaration", ["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    /** Determines the base type identifiers of a specified class declaration. */
    function getBaseTypeIdentifiers(node) {
        if (!node.heritageClauses) {
            return null;
        }
        return node.heritageClauses.filter(clause => clause.token === ts.SyntaxKind.ExtendsKeyword)
            .reduce((types, clause) => types.concat(clause.types), [])
            .map(typeExpression => typeExpression.expression)
            .filter(ts.isIdentifier);
    }
    exports.getBaseTypeIdentifiers = getBaseTypeIdentifiers;
    /** Gets the first found parent class declaration of a given node. */
    function findParentClassDeclaration(node) {
        while (!ts.isClassDeclaration(node)) {
            if (ts.isSourceFile(node)) {
                return null;
            }
            node = node.parent;
        }
        return node;
    }
    exports.findParentClassDeclaration = findParentClassDeclaration;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3NfZGVjbGFyYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy90eXBlc2NyaXB0L2NsYXNzX2RlY2xhcmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBRWpDLDZFQUE2RTtJQUM3RSxTQUFnQixzQkFBc0IsQ0FBQyxJQUF5QjtRQUM5RCxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRTtZQUN6QixPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUM7YUFDdEYsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBc0MsQ0FBQzthQUM3RixHQUFHLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDO2FBQ2hELE1BQU0sQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQVRELHdEQVNDO0lBRUQscUVBQXFFO0lBQ3JFLFNBQWdCLDBCQUEwQixDQUFDLElBQWE7UUFDdEQsT0FBTyxDQUFDLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNuQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3pCLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFDRCxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztTQUNwQjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQVJELGdFQVFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuLyoqIERldGVybWluZXMgdGhlIGJhc2UgdHlwZSBpZGVudGlmaWVycyBvZiBhIHNwZWNpZmllZCBjbGFzcyBkZWNsYXJhdGlvbi4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRCYXNlVHlwZUlkZW50aWZpZXJzKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24pOiB0cy5JZGVudGlmaWVyW118bnVsbCB7XG4gIGlmICghbm9kZS5oZXJpdGFnZUNsYXVzZXMpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiBub2RlLmhlcml0YWdlQ2xhdXNlcy5maWx0ZXIoY2xhdXNlID0+IGNsYXVzZS50b2tlbiA9PT0gdHMuU3ludGF4S2luZC5FeHRlbmRzS2V5d29yZClcbiAgICAgIC5yZWR1Y2UoKHR5cGVzLCBjbGF1c2UpID0+IHR5cGVzLmNvbmNhdChjbGF1c2UudHlwZXMpLCBbXSBhcyB0cy5FeHByZXNzaW9uV2l0aFR5cGVBcmd1bWVudHNbXSlcbiAgICAgIC5tYXAodHlwZUV4cHJlc3Npb24gPT4gdHlwZUV4cHJlc3Npb24uZXhwcmVzc2lvbilcbiAgICAgIC5maWx0ZXIodHMuaXNJZGVudGlmaWVyKTtcbn1cblxuLyoqIEdldHMgdGhlIGZpcnN0IGZvdW5kIHBhcmVudCBjbGFzcyBkZWNsYXJhdGlvbiBvZiBhIGdpdmVuIG5vZGUuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZFBhcmVudENsYXNzRGVjbGFyYXRpb24obm9kZTogdHMuTm9kZSk6IHRzLkNsYXNzRGVjbGFyYXRpb258bnVsbCB7XG4gIHdoaWxlICghdHMuaXNDbGFzc0RlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgaWYgKHRzLmlzU291cmNlRmlsZShub2RlKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIG5vZGUgPSBub2RlLnBhcmVudDtcbiAgfVxuICByZXR1cm4gbm9kZTtcbn1cbiJdfQ==