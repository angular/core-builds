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
        define("@angular/core/schematics/migrations/static-queries/angular/decorators", ["require", "exports", "@angular/core/schematics/migrations/static-queries/typescript/decorators"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const decorators_1 = require("@angular/core/schematics/migrations/static-queries/typescript/decorators");
    /**
     * Gets all decorators which are imported from an Angular package (e.g. "@angular/core")
     * from a list of decorators.
     */
    function getAngularDecorators(typeChecker, decorators) {
        return decorators.map(node => ({ node, importData: decorators_1.getCallDecoratorImport(typeChecker, node) }))
            .filter(({ importData }) => importData && importData.importModule.startsWith('@angular/'))
            .map(({ node, importData }) => ({ node, name: importData.name }));
    }
    exports.getAngularDecorators = getAngularDecorators;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL2FuZ3VsYXIvZGVjb3JhdG9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUdILHlHQUFnRTtJQU9oRTs7O09BR0c7SUFDSCxTQUFnQixvQkFBb0IsQ0FDaEMsV0FBMkIsRUFBRSxVQUF1QztRQUN0RSxPQUFPLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxtQ0FBc0IsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLEVBQUMsQ0FBQyxDQUFDO2FBQ3pGLE1BQU0sQ0FBQyxDQUFDLEVBQUMsVUFBVSxFQUFDLEVBQUUsRUFBRSxDQUFDLFVBQVUsSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQzthQUN2RixHQUFHLENBQUMsQ0FBQyxFQUFDLElBQUksRUFBRSxVQUFVLEVBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsVUFBWSxDQUFDLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQztJQUN0RSxDQUFDO0lBTEQsb0RBS0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtnZXRDYWxsRGVjb3JhdG9ySW1wb3J0fSBmcm9tICcuLi90eXBlc2NyaXB0L2RlY29yYXRvcnMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIE5nRGVjb3JhdG9yIHtcbiAgbmFtZTogc3RyaW5nO1xuICBub2RlOiB0cy5EZWNvcmF0b3I7XG59XG5cbi8qKlxuICogR2V0cyBhbGwgZGVjb3JhdG9ycyB3aGljaCBhcmUgaW1wb3J0ZWQgZnJvbSBhbiBBbmd1bGFyIHBhY2thZ2UgKGUuZy4gXCJAYW5ndWxhci9jb3JlXCIpXG4gKiBmcm9tIGEgbGlzdCBvZiBkZWNvcmF0b3JzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QW5ndWxhckRlY29yYXRvcnMoXG4gICAgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLCBkZWNvcmF0b3JzOiBSZWFkb25seUFycmF5PHRzLkRlY29yYXRvcj4pOiBOZ0RlY29yYXRvcltdIHtcbiAgcmV0dXJuIGRlY29yYXRvcnMubWFwKG5vZGUgPT4gKHtub2RlLCBpbXBvcnREYXRhOiBnZXRDYWxsRGVjb3JhdG9ySW1wb3J0KHR5cGVDaGVja2VyLCBub2RlKX0pKVxuICAgICAgLmZpbHRlcigoe2ltcG9ydERhdGF9KSA9PiBpbXBvcnREYXRhICYmIGltcG9ydERhdGEuaW1wb3J0TW9kdWxlLnN0YXJ0c1dpdGgoJ0Bhbmd1bGFyLycpKVxuICAgICAgLm1hcCgoe25vZGUsIGltcG9ydERhdGF9KSA9PiAoe25vZGUsIG5hbWU6IGltcG9ydERhdGEgIS5uYW1lfSkpO1xufVxuIl19