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
        define("@angular/core/schematics/migrations/activated-route-snapshot-fragment/util", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/nodes", "@angular/core/schematics/utils/typescript/symbol"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.migrateActivatedRouteSnapshotFragment = exports.findFragmentAccesses = void 0;
    const ts = require("typescript");
    const nodes_1 = require("@angular/core/schematics/utils/typescript/nodes");
    const symbol_1 = require("@angular/core/schematics/utils/typescript/symbol");
    /**
     * Finds all the accesses of `ActivatedRouteSnapshot.fragment`
     * that need to be migrated within a particular file.
     */
    function findFragmentAccesses(typeChecker, sourceFile) {
        const results = new Set();
        sourceFile.forEachChild(function walk(node) {
            if (ts.isPropertyAccessExpression(node) && node.name.text === 'fragment' &&
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
        return ts.createNonNullExpression(node);
    }
    exports.migrateActivatedRouteSnapshotFragment = migrateActivatedRouteSnapshotFragment;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL2FjdGl2YXRlZC1yb3V0ZS1zbmFwc2hvdC1mcmFnbWVudC91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUNqQywyRUFBdUU7SUFDdkUsNkVBQTRFO0lBRTVFOzs7T0FHRztJQUNILFNBQWdCLG9CQUFvQixDQUNoQyxXQUEyQixFQUFFLFVBQXlCO1FBQ3hELE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUErQixDQUFDO1FBRXZELFVBQVUsQ0FBQyxZQUFZLENBQUMsU0FBUyxJQUFJLENBQUMsSUFBYTtZQUNqRCxJQUFJLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxVQUFVO2dCQUNwRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFBLG1CQUFXLEVBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFBLG9CQUFZLEVBQUMsSUFBSSxDQUFDO2dCQUMvRCxJQUFBLHNCQUFhLEVBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO2dCQUN2RSxJQUFBLHVCQUFjLEVBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxFQUFFO2dCQUNyQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ25CO1lBRUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxQixDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFoQkQsb0RBZ0JDO0lBRUQsNERBQTREO0lBQzVELFNBQWdCLHFDQUFxQyxDQUFDLElBQWlDO1FBQ3JGLDZDQUE2QztRQUM3QyxPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBSEQsc0ZBR0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge2lzTnVsbENoZWNrLCBpc1NhZmVBY2Nlc3N9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvbm9kZXMnO1xuaW1wb3J0IHtoYXNPbmVPZlR5cGVzLCBpc051bGxhYmxlVHlwZX0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9zeW1ib2wnO1xuXG4vKipcbiAqIEZpbmRzIGFsbCB0aGUgYWNjZXNzZXMgb2YgYEFjdGl2YXRlZFJvdXRlU25hcHNob3QuZnJhZ21lbnRgXG4gKiB0aGF0IG5lZWQgdG8gYmUgbWlncmF0ZWQgd2l0aGluIGEgcGFydGljdWxhciBmaWxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZEZyYWdtZW50QWNjZXNzZXMoXG4gICAgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLCBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogU2V0PHRzLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbj4ge1xuICBjb25zdCByZXN1bHRzID0gbmV3IFNldDx0cy5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24+KCk7XG5cbiAgc291cmNlRmlsZS5mb3JFYWNoQ2hpbGQoZnVuY3Rpb24gd2Fsayhub2RlOiB0cy5Ob2RlKSB7XG4gICAgaWYgKHRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKG5vZGUpICYmIG5vZGUubmFtZS50ZXh0ID09PSAnZnJhZ21lbnQnICYmXG4gICAgICAgICFyZXN1bHRzLmhhcyhub2RlKSAmJiAhaXNOdWxsQ2hlY2sobm9kZSkgJiYgIWlzU2FmZUFjY2Vzcyhub2RlKSAmJlxuICAgICAgICBoYXNPbmVPZlR5cGVzKHR5cGVDaGVja2VyLCBub2RlLmV4cHJlc3Npb24sIFsnQWN0aXZhdGVkUm91dGVTbmFwc2hvdCddKSAmJlxuICAgICAgICBpc051bGxhYmxlVHlwZSh0eXBlQ2hlY2tlciwgbm9kZSkpIHtcbiAgICAgIHJlc3VsdHMuYWRkKG5vZGUpO1xuICAgIH1cblxuICAgIG5vZGUuZm9yRWFjaENoaWxkKHdhbGspO1xuICB9KTtcblxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLyoqIE1pZ3JhdGVzIGFuIGBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90LmZyYWdtZW50YCBhY2Nlc3MuICovXG5leHBvcnQgZnVuY3Rpb24gbWlncmF0ZUFjdGl2YXRlZFJvdXRlU25hcHNob3RGcmFnbWVudChub2RlOiB0cy5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24pOiB0cy5Ob2RlIHtcbiAgLy8gVHVybnMgYGZvby5mcmFnbWVudGAgaW50byBgZm9vLmZyYWdtZW50IWAuXG4gIHJldHVybiB0cy5jcmVhdGVOb25OdWxsRXhwcmVzc2lvbihub2RlKTtcbn1cbiJdfQ==