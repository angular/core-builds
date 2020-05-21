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
        define("@angular/core/schematics/utils/typescript/class_declaration", ["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hasExplicitConstructor = exports.findParentClassDeclaration = exports.getBaseTypeIdentifiers = void 0;
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
    /** Checks whether the given class declaration has an explicit constructor or not. */
    function hasExplicitConstructor(node) {
        return node.members.some(ts.isConstructorDeclaration);
    }
    exports.hasExplicitConstructor = hasExplicitConstructor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3NfZGVjbGFyYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvdXRpbHMvdHlwZXNjcmlwdC9jbGFzc19kZWNsYXJhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCxpQ0FBaUM7SUFFakMsNkVBQTZFO0lBQzdFLFNBQWdCLHNCQUFzQixDQUFDLElBQXlCO1FBQzlELElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFO1lBQ3pCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQzthQUN0RixNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFzQyxDQUFDO2FBQzdGLEdBQUcsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUM7YUFDaEQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBVEQsd0RBU0M7SUFFRCxxRUFBcUU7SUFDckUsU0FBZ0IsMEJBQTBCLENBQUMsSUFBYTtRQUN0RCxPQUFPLENBQUMsRUFBRSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ25DLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDekIsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUNELElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1NBQ3BCO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBUkQsZ0VBUUM7SUFFRCxxRkFBcUY7SUFDckYsU0FBZ0Isc0JBQXNCLENBQUMsSUFBeUI7UUFDOUQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsd0JBQXdCLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRkQsd0RBRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG4vKiogRGV0ZXJtaW5lcyB0aGUgYmFzZSB0eXBlIGlkZW50aWZpZXJzIG9mIGEgc3BlY2lmaWVkIGNsYXNzIGRlY2xhcmF0aW9uLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEJhc2VUeXBlSWRlbnRpZmllcnMobm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbik6IHRzLklkZW50aWZpZXJbXXxudWxsIHtcbiAgaWYgKCFub2RlLmhlcml0YWdlQ2xhdXNlcykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIG5vZGUuaGVyaXRhZ2VDbGF1c2VzLmZpbHRlcihjbGF1c2UgPT4gY2xhdXNlLnRva2VuID09PSB0cy5TeW50YXhLaW5kLkV4dGVuZHNLZXl3b3JkKVxuICAgICAgLnJlZHVjZSgodHlwZXMsIGNsYXVzZSkgPT4gdHlwZXMuY29uY2F0KGNsYXVzZS50eXBlcyksIFtdIGFzIHRzLkV4cHJlc3Npb25XaXRoVHlwZUFyZ3VtZW50c1tdKVxuICAgICAgLm1hcCh0eXBlRXhwcmVzc2lvbiA9PiB0eXBlRXhwcmVzc2lvbi5leHByZXNzaW9uKVxuICAgICAgLmZpbHRlcih0cy5pc0lkZW50aWZpZXIpO1xufVxuXG4vKiogR2V0cyB0aGUgZmlyc3QgZm91bmQgcGFyZW50IGNsYXNzIGRlY2xhcmF0aW9uIG9mIGEgZ2l2ZW4gbm9kZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kUGFyZW50Q2xhc3NEZWNsYXJhdGlvbihub2RlOiB0cy5Ob2RlKTogdHMuQ2xhc3NEZWNsYXJhdGlvbnxudWxsIHtcbiAgd2hpbGUgKCF0cy5pc0NsYXNzRGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICBpZiAodHMuaXNTb3VyY2VGaWxlKG5vZGUpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgbm9kZSA9IG5vZGUucGFyZW50O1xuICB9XG4gIHJldHVybiBub2RlO1xufVxuXG4vKiogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIGNsYXNzIGRlY2xhcmF0aW9uIGhhcyBhbiBleHBsaWNpdCBjb25zdHJ1Y3RvciBvciBub3QuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzRXhwbGljaXRDb25zdHJ1Y3Rvcihub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKTogYm9vbGVhbiB7XG4gIHJldHVybiBub2RlLm1lbWJlcnMuc29tZSh0cy5pc0NvbnN0cnVjdG9yRGVjbGFyYXRpb24pO1xufVxuIl19