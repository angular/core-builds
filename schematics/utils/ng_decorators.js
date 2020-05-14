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
        define("@angular/core/schematics/utils/ng_decorators", ["require", "exports", "@angular/core/schematics/utils/typescript/decorators"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getAngularDecorators = void 0;
    const decorators_1 = require("@angular/core/schematics/utils/typescript/decorators");
    /**
     * Gets all decorators which are imported from an Angular package (e.g. "@angular/core")
     * from a list of decorators.
     */
    function getAngularDecorators(typeChecker, decorators) {
        return decorators.map(node => ({ node, importData: decorators_1.getCallDecoratorImport(typeChecker, node) }))
            .filter(({ importData }) => importData && importData.importModule.startsWith('@angular/'))
            .map(({ node, importData }) => ({
            node: node,
            name: importData.name,
            moduleName: importData.importModule,
            importNode: importData.node
        }));
    }
    exports.getAngularDecorators = getAngularDecorators;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfZGVjb3JhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy91dGlscy9uZ19kZWNvcmF0b3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUdILHFGQUErRDtJQWEvRDs7O09BR0c7SUFDSCxTQUFnQixvQkFBb0IsQ0FDaEMsV0FBMkIsRUFBRSxVQUF1QztRQUN0RSxPQUFPLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxtQ0FBc0IsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLEVBQUMsQ0FBQyxDQUFDO2FBQ3pGLE1BQU0sQ0FBQyxDQUFDLEVBQUMsVUFBVSxFQUFDLEVBQUUsRUFBRSxDQUFDLFVBQVUsSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQzthQUN2RixHQUFHLENBQUMsQ0FBQyxFQUFDLElBQUksRUFBRSxVQUFVLEVBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN2QixJQUFJLEVBQUUsSUFBK0I7WUFDckMsSUFBSSxFQUFFLFVBQVcsQ0FBQyxJQUFJO1lBQ3RCLFVBQVUsRUFBRSxVQUFXLENBQUMsWUFBWTtZQUNwQyxVQUFVLEVBQUUsVUFBVyxDQUFDLElBQUk7U0FDN0IsQ0FBQyxDQUFDLENBQUM7SUFDZixDQUFDO0lBVkQsb0RBVUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtnZXRDYWxsRGVjb3JhdG9ySW1wb3J0fSBmcm9tICcuL3R5cGVzY3JpcHQvZGVjb3JhdG9ycyc7XG5cbmV4cG9ydCB0eXBlIENhbGxFeHByZXNzaW9uRGVjb3JhdG9yID0gdHMuRGVjb3JhdG9yJntcbiAgZXhwcmVzc2lvbjogdHMuQ2FsbEV4cHJlc3Npb247XG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIE5nRGVjb3JhdG9yIHtcbiAgbmFtZTogc3RyaW5nO1xuICBtb2R1bGVOYW1lOiBzdHJpbmc7XG4gIG5vZGU6IENhbGxFeHByZXNzaW9uRGVjb3JhdG9yO1xuICBpbXBvcnROb2RlOiB0cy5JbXBvcnREZWNsYXJhdGlvbjtcbn1cblxuLyoqXG4gKiBHZXRzIGFsbCBkZWNvcmF0b3JzIHdoaWNoIGFyZSBpbXBvcnRlZCBmcm9tIGFuIEFuZ3VsYXIgcGFja2FnZSAoZS5nLiBcIkBhbmd1bGFyL2NvcmVcIilcbiAqIGZyb20gYSBsaXN0IG9mIGRlY29yYXRvcnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRBbmd1bGFyRGVjb3JhdG9ycyhcbiAgICB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsIGRlY29yYXRvcnM6IFJlYWRvbmx5QXJyYXk8dHMuRGVjb3JhdG9yPik6IE5nRGVjb3JhdG9yW10ge1xuICByZXR1cm4gZGVjb3JhdG9ycy5tYXAobm9kZSA9PiAoe25vZGUsIGltcG9ydERhdGE6IGdldENhbGxEZWNvcmF0b3JJbXBvcnQodHlwZUNoZWNrZXIsIG5vZGUpfSkpXG4gICAgICAuZmlsdGVyKCh7aW1wb3J0RGF0YX0pID0+IGltcG9ydERhdGEgJiYgaW1wb3J0RGF0YS5pbXBvcnRNb2R1bGUuc3RhcnRzV2l0aCgnQGFuZ3VsYXIvJykpXG4gICAgICAubWFwKCh7bm9kZSwgaW1wb3J0RGF0YX0pID0+ICh7XG4gICAgICAgICAgICAgbm9kZTogbm9kZSBhcyBDYWxsRXhwcmVzc2lvbkRlY29yYXRvcixcbiAgICAgICAgICAgICBuYW1lOiBpbXBvcnREYXRhIS5uYW1lLFxuICAgICAgICAgICAgIG1vZHVsZU5hbWU6IGltcG9ydERhdGEhLmltcG9ydE1vZHVsZSxcbiAgICAgICAgICAgICBpbXBvcnROb2RlOiBpbXBvcnREYXRhIS5ub2RlXG4gICAgICAgICAgIH0pKTtcbn1cbiJdfQ==