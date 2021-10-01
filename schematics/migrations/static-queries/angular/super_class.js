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
        define("@angular/core/schematics/migrations/static-queries/angular/super_class", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSuperClassDeclarations = void 0;
    /**
     * Gets all chained super-class TypeScript declarations for the given class
     * by using the specified class metadata map.
     */
    function getSuperClassDeclarations(classDecl, classMetadataMap) {
        const declarations = [];
        let current = classMetadataMap.get(classDecl);
        while (current && current.superClass) {
            declarations.push(current.superClass);
            current = classMetadataMap.get(current.superClass);
        }
        return declarations;
    }
    exports.getSuperClassDeclarations = getSuperClassDeclarations;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VwZXJfY2xhc3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9hbmd1bGFyL3N1cGVyX2NsYXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUtIOzs7T0FHRztJQUNILFNBQWdCLHlCQUF5QixDQUNyQyxTQUE4QixFQUFFLGdCQUFrQztRQUNwRSxNQUFNLFlBQVksR0FBMEIsRUFBRSxDQUFDO1FBRS9DLElBQUksT0FBTyxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM5QyxPQUFPLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBVSxFQUFFO1lBQ3BDLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3RDLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQ3BEO1FBRUQsT0FBTyxZQUFZLENBQUM7SUFDdEIsQ0FBQztJQVhELDhEQVdDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7Q2xhc3NNZXRhZGF0YU1hcH0gZnJvbSAnLi9uZ19xdWVyeV92aXNpdG9yJztcblxuLyoqXG4gKiBHZXRzIGFsbCBjaGFpbmVkIHN1cGVyLWNsYXNzIFR5cGVTY3JpcHQgZGVjbGFyYXRpb25zIGZvciB0aGUgZ2l2ZW4gY2xhc3NcbiAqIGJ5IHVzaW5nIHRoZSBzcGVjaWZpZWQgY2xhc3MgbWV0YWRhdGEgbWFwLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3VwZXJDbGFzc0RlY2xhcmF0aW9ucyhcbiAgICBjbGFzc0RlY2w6IHRzLkNsYXNzRGVjbGFyYXRpb24sIGNsYXNzTWV0YWRhdGFNYXA6IENsYXNzTWV0YWRhdGFNYXApIHtcbiAgY29uc3QgZGVjbGFyYXRpb25zOiB0cy5DbGFzc0RlY2xhcmF0aW9uW10gPSBbXTtcblxuICBsZXQgY3VycmVudCA9IGNsYXNzTWV0YWRhdGFNYXAuZ2V0KGNsYXNzRGVjbCk7XG4gIHdoaWxlIChjdXJyZW50ICYmIGN1cnJlbnQuc3VwZXJDbGFzcykge1xuICAgIGRlY2xhcmF0aW9ucy5wdXNoKGN1cnJlbnQuc3VwZXJDbGFzcyk7XG4gICAgY3VycmVudCA9IGNsYXNzTWV0YWRhdGFNYXAuZ2V0KGN1cnJlbnQuc3VwZXJDbGFzcyk7XG4gIH1cblxuICByZXR1cm4gZGVjbGFyYXRpb25zO1xufVxuIl19