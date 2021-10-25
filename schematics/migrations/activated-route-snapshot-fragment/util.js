/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/migrations/activated-route-snapshot-fragment/util", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/nodes", "@angular/core/schematics/utils/typescript/symbol"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.migrateActivatedRouteSnapshotFragment = exports.findFragmentAccesses = void 0;
    const typescript_1 = __importDefault(require("typescript"));
    const nodes_1 = require("@angular/core/schematics/utils/typescript/nodes");
    const symbol_1 = require("@angular/core/schematics/utils/typescript/symbol");
    /**
     * Finds all the accesses of `ActivatedRouteSnapshot.fragment`
     * that need to be migrated within a particular file.
     */
    function findFragmentAccesses(typeChecker, sourceFile) {
        const results = new Set();
        sourceFile.forEachChild(function walk(node) {
            if (typescript_1.default.isPropertyAccessExpression(node) && node.name.text === 'fragment' &&
                !results.has(node) && !(0, nodes_1.isNullCheck)(node) && !(0, nodes_1.isSafeAccess)(node) &&
                (0, symbol_1.hasOneOfTypes)(typeChecker, node.expression, ['ActivatedRouteSnapshot']) &&
                (0, symbol_1.isNullableType)(typeChecker, node)) {
                results.add(node);
            }
            node.forEachChild(walk);
        });
        return results;
    }
    exports.findFragmentAccesses = findFragmentAccesses;
    /** Migrates an `ActivatedRouteSnapshot.fragment` access. */
    function migrateActivatedRouteSnapshotFragment(node) {
        // Turns `foo.fragment` into `foo.fragment!`.
        return typescript_1.default.createNonNullExpression(node);
    }
    exports.migrateActivatedRouteSnapshotFragment = migrateActivatedRouteSnapshotFragment;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL2FjdGl2YXRlZC1yb3V0ZS1zbmFwc2hvdC1mcmFnbWVudC91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7OztJQUVILDREQUE0QjtJQUM1QiwyRUFBdUU7SUFDdkUsNkVBQTRFO0lBRTVFOzs7T0FHRztJQUNILFNBQWdCLG9CQUFvQixDQUNoQyxXQUEyQixFQUFFLFVBQXlCO1FBQ3hELE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUErQixDQUFDO1FBRXZELFVBQVUsQ0FBQyxZQUFZLENBQUMsU0FBUyxJQUFJLENBQUMsSUFBYTtZQUNqRCxJQUFJLG9CQUFFLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssVUFBVTtnQkFDcEUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBQSxtQkFBVyxFQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBQSxvQkFBWSxFQUFDLElBQUksQ0FBQztnQkFDL0QsSUFBQSxzQkFBYSxFQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsd0JBQXdCLENBQUMsQ0FBQztnQkFDdkUsSUFBQSx1QkFBYyxFQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsRUFBRTtnQkFDckMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNuQjtZQUVELElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUIsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBaEJELG9EQWdCQztJQUVELDREQUE0RDtJQUM1RCxTQUFnQixxQ0FBcUMsQ0FBQyxJQUFpQztRQUNyRiw2Q0FBNkM7UUFDN0MsT0FBTyxvQkFBRSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFIRCxzRkFHQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge2lzTnVsbENoZWNrLCBpc1NhZmVBY2Nlc3N9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvbm9kZXMnO1xuaW1wb3J0IHtoYXNPbmVPZlR5cGVzLCBpc051bGxhYmxlVHlwZX0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9zeW1ib2wnO1xuXG4vKipcbiAqIEZpbmRzIGFsbCB0aGUgYWNjZXNzZXMgb2YgYEFjdGl2YXRlZFJvdXRlU25hcHNob3QuZnJhZ21lbnRgXG4gKiB0aGF0IG5lZWQgdG8gYmUgbWlncmF0ZWQgd2l0aGluIGEgcGFydGljdWxhciBmaWxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZEZyYWdtZW50QWNjZXNzZXMoXG4gICAgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLCBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogU2V0PHRzLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbj4ge1xuICBjb25zdCByZXN1bHRzID0gbmV3IFNldDx0cy5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24+KCk7XG5cbiAgc291cmNlRmlsZS5mb3JFYWNoQ2hpbGQoZnVuY3Rpb24gd2Fsayhub2RlOiB0cy5Ob2RlKSB7XG4gICAgaWYgKHRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKG5vZGUpICYmIG5vZGUubmFtZS50ZXh0ID09PSAnZnJhZ21lbnQnICYmXG4gICAgICAgICFyZXN1bHRzLmhhcyhub2RlKSAmJiAhaXNOdWxsQ2hlY2sobm9kZSkgJiYgIWlzU2FmZUFjY2Vzcyhub2RlKSAmJlxuICAgICAgICBoYXNPbmVPZlR5cGVzKHR5cGVDaGVja2VyLCBub2RlLmV4cHJlc3Npb24sIFsnQWN0aXZhdGVkUm91dGVTbmFwc2hvdCddKSAmJlxuICAgICAgICBpc051bGxhYmxlVHlwZSh0eXBlQ2hlY2tlciwgbm9kZSkpIHtcbiAgICAgIHJlc3VsdHMuYWRkKG5vZGUpO1xuICAgIH1cblxuICAgIG5vZGUuZm9yRWFjaENoaWxkKHdhbGspO1xuICB9KTtcblxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLyoqIE1pZ3JhdGVzIGFuIGBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90LmZyYWdtZW50YCBhY2Nlc3MuICovXG5leHBvcnQgZnVuY3Rpb24gbWlncmF0ZUFjdGl2YXRlZFJvdXRlU25hcHNob3RGcmFnbWVudChub2RlOiB0cy5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24pOiB0cy5Ob2RlIHtcbiAgLy8gVHVybnMgYGZvby5mcmFnbWVudGAgaW50byBgZm9vLmZyYWdtZW50IWAuXG4gIHJldHVybiB0cy5jcmVhdGVOb25OdWxsRXhwcmVzc2lvbihub2RlKTtcbn1cbiJdfQ==