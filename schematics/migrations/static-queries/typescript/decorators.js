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
        define("@angular/core/schematics/migrations/static-queries/typescript/decorators", ["require", "exports", "typescript", "@angular/core/schematics/migrations/static-queries/typescript/imports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const imports_1 = require("@angular/core/schematics/migrations/static-queries/typescript/imports");
    function getCallDecoratorImport(typeChecker, decorator) {
        // Note that this does not cover the edge case where decorators are called from
        // a namespace import: e.g. "@core.Component()". This is not handled by Ngtsc either.
        if (!ts.isCallExpression(decorator.expression) ||
            !ts.isIdentifier(decorator.expression.expression)) {
            return null;
        }
        const identifier = decorator.expression.expression;
        return imports_1.getImportOfIdentifier(typeChecker, identifier);
    }
    exports.getCallDecoratorImport = getCallDecoratorImport;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL3R5cGVzY3JpcHQvZGVjb3JhdG9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUVqQyxtR0FBd0Q7SUFFeEQsU0FBZ0Isc0JBQXNCLENBQ2xDLFdBQTJCLEVBQUUsU0FBdUI7UUFDdEQsK0VBQStFO1FBQy9FLHFGQUFxRjtRQUNyRixJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7WUFDMUMsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDckQsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELE1BQU0sVUFBVSxHQUFHLFNBQVMsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDO1FBQ25ELE9BQU8sK0JBQXFCLENBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFYRCx3REFXQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7SW1wb3J0LCBnZXRJbXBvcnRPZklkZW50aWZpZXJ9IGZyb20gJy4vaW1wb3J0cyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDYWxsRGVjb3JhdG9ySW1wb3J0KFxuICAgIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwgZGVjb3JhdG9yOiB0cy5EZWNvcmF0b3IpOiBJbXBvcnR8bnVsbCB7XG4gIC8vIE5vdGUgdGhhdCB0aGlzIGRvZXMgbm90IGNvdmVyIHRoZSBlZGdlIGNhc2Ugd2hlcmUgZGVjb3JhdG9ycyBhcmUgY2FsbGVkIGZyb21cbiAgLy8gYSBuYW1lc3BhY2UgaW1wb3J0OiBlLmcuIFwiQGNvcmUuQ29tcG9uZW50KClcIi4gVGhpcyBpcyBub3QgaGFuZGxlZCBieSBOZ3RzYyBlaXRoZXIuXG4gIGlmICghdHMuaXNDYWxsRXhwcmVzc2lvbihkZWNvcmF0b3IuZXhwcmVzc2lvbikgfHxcbiAgICAgICF0cy5pc0lkZW50aWZpZXIoZGVjb3JhdG9yLmV4cHJlc3Npb24uZXhwcmVzc2lvbikpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IGlkZW50aWZpZXIgPSBkZWNvcmF0b3IuZXhwcmVzc2lvbi5leHByZXNzaW9uO1xuICByZXR1cm4gZ2V0SW1wb3J0T2ZJZGVudGlmaWVyKHR5cGVDaGVja2VyLCBpZGVudGlmaWVyKTtcbn1cbiJdfQ==