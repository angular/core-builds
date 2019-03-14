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
        define("@angular/core/schematics/migrations/static-queries/typescript/functions", ["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    /** Checks whether a given node is a function like declaration. */
    function isFunctionLikeDeclaration(node) {
        return ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) ||
            ts.isArrowFunction(node) || ts.isFunctionExpression(node) ||
            ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node);
    }
    exports.isFunctionLikeDeclaration = isFunctionLikeDeclaration;
    /**
     * Unwraps a given expression TypeScript node. Expressions can be wrapped within multiple
     * parentheses. e.g. "(((({exp}))))()". The function should return the TypeScript node
     * referring to the inner expression. e.g "exp".
     */
    function unwrapExpression(node) {
        if (ts.isParenthesizedExpression(node)) {
            return unwrapExpression(node.expression);
        }
        else {
            return node;
        }
    }
    exports.unwrapExpression = unwrapExpression;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVuY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvc3RhdGljLXF1ZXJpZXMvdHlwZXNjcmlwdC9mdW5jdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCxpQ0FBaUM7SUFFakMsa0VBQWtFO0lBQ2xFLFNBQWdCLHlCQUF5QixDQUFDLElBQWE7UUFDckQsT0FBTyxFQUFFLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQztZQUNqRSxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUM7WUFDekQsRUFBRSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM3RSxDQUFDO0lBSkQsOERBSUM7SUFFRDs7OztPQUlHO0lBQ0gsU0FBZ0IsZ0JBQWdCLENBQUMsSUFBZ0Q7UUFDL0UsSUFBSSxFQUFFLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDdEMsT0FBTyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDMUM7YUFBTTtZQUNMLE9BQU8sSUFBSSxDQUFDO1NBQ2I7SUFDSCxDQUFDO0lBTkQsNENBTUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG4vKiogQ2hlY2tzIHdoZXRoZXIgYSBnaXZlbiBub2RlIGlzIGEgZnVuY3Rpb24gbGlrZSBkZWNsYXJhdGlvbi4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0Z1bmN0aW9uTGlrZURlY2xhcmF0aW9uKG5vZGU6IHRzLk5vZGUpOiBub2RlIGlzIHRzLkZ1bmN0aW9uTGlrZURlY2xhcmF0aW9uIHtcbiAgcmV0dXJuIHRzLmlzRnVuY3Rpb25EZWNsYXJhdGlvbihub2RlKSB8fCB0cy5pc01ldGhvZERlY2xhcmF0aW9uKG5vZGUpIHx8XG4gICAgICB0cy5pc0Fycm93RnVuY3Rpb24obm9kZSkgfHwgdHMuaXNGdW5jdGlvbkV4cHJlc3Npb24obm9kZSkgfHxcbiAgICAgIHRzLmlzR2V0QWNjZXNzb3JEZWNsYXJhdGlvbihub2RlKSB8fCB0cy5pc1NldEFjY2Vzc29yRGVjbGFyYXRpb24obm9kZSk7XG59XG5cbi8qKlxuICogVW53cmFwcyBhIGdpdmVuIGV4cHJlc3Npb24gVHlwZVNjcmlwdCBub2RlLiBFeHByZXNzaW9ucyBjYW4gYmUgd3JhcHBlZCB3aXRoaW4gbXVsdGlwbGVcbiAqIHBhcmVudGhlc2VzLiBlLmcuIFwiKCgoKHtleHB9KSkpKSgpXCIuIFRoZSBmdW5jdGlvbiBzaG91bGQgcmV0dXJuIHRoZSBUeXBlU2NyaXB0IG5vZGVcbiAqIHJlZmVycmluZyB0byB0aGUgaW5uZXIgZXhwcmVzc2lvbi4gZS5nIFwiZXhwXCIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bndyYXBFeHByZXNzaW9uKG5vZGU6IHRzLkV4cHJlc3Npb24gfCB0cy5QYXJlbnRoZXNpemVkRXhwcmVzc2lvbik6IHRzLkV4cHJlc3Npb24ge1xuICBpZiAodHMuaXNQYXJlbnRoZXNpemVkRXhwcmVzc2lvbihub2RlKSkge1xuICAgIHJldHVybiB1bndyYXBFeHByZXNzaW9uKG5vZGUuZXhwcmVzc2lvbik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cbn1cbiJdfQ==