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
        define("@angular/core/schematics/migrations/static-queries/transform", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/property_name", "@angular/core/schematics/migrations/static-queries/angular/query-definition"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const property_name_1 = require("@angular/core/schematics/utils/typescript/property_name");
    const query_definition_1 = require("@angular/core/schematics/migrations/static-queries/angular/query-definition");
    /**
     * Transforms the given query decorator by explicitly specifying the timing based on the
     * determined timing. The updated decorator call expression node will be returned.
     */
    function getTransformedQueryCallExpr(query, timing) {
        const queryExpr = query.decorator.node.expression;
        const queryArguments = queryExpr.arguments;
        const timingPropertyAssignment = ts.createPropertyAssignment('static', timing === query_definition_1.QueryTiming.STATIC ? ts.createTrue() : ts.createFalse());
        // If the query decorator is already called with two arguments, we need to
        // keep the existing options untouched and just add the new property if needed.
        if (queryArguments.length === 2) {
            const existingOptions = queryArguments[1];
            // In case the options already contains a property for the "static" flag, we just
            // skip this query and leave it untouched.
            if (existingOptions.properties.some(p => !!p.name && property_name_1.getPropertyNameText(p.name) === 'static')) {
                return null;
            }
            const updatedOptions = ts.updateObjectLiteral(existingOptions, existingOptions.properties.concat(timingPropertyAssignment));
            return ts.updateCall(queryExpr, queryExpr.expression, queryExpr.typeArguments, [queryArguments[0], updatedOptions]);
        }
        return ts.updateCall(queryExpr, queryExpr.expression, queryExpr.typeArguments, [queryArguments[0], ts.createObjectLiteral([timingPropertyAssignment])]);
    }
    exports.getTransformedQueryCallExpr = getTransformedQueryCallExpr;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvc3RhdGljLXF1ZXJpZXMvdHJhbnNmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBQ2pDLDJGQUF5RTtJQUN6RSxrSEFBMEU7SUFFMUU7OztPQUdHO0lBQ0gsU0FBZ0IsMkJBQTJCLENBQ3ZDLEtBQXdCLEVBQUUsTUFBbUI7UUFDL0MsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ2xELE1BQU0sY0FBYyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUM7UUFDM0MsTUFBTSx3QkFBd0IsR0FBRyxFQUFFLENBQUMsd0JBQXdCLENBQ3hELFFBQVEsRUFBRSxNQUFNLEtBQUssOEJBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFFbEYsMEVBQTBFO1FBQzFFLCtFQUErRTtRQUMvRSxJQUFJLGNBQWMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQy9CLE1BQU0sZUFBZSxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQStCLENBQUM7WUFFeEUsaUZBQWlGO1lBQ2pGLDBDQUEwQztZQUMxQyxJQUFJLGVBQWUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUMzQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLG1DQUFtQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxRQUFRLENBQUMsRUFBRTtnQkFDbEUsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUVELE1BQU0sY0FBYyxHQUFHLEVBQUUsQ0FBQyxtQkFBbUIsQ0FDekMsZUFBZSxFQUFFLGVBQWUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQztZQUNsRixPQUFPLEVBQUUsQ0FBQyxVQUFVLENBQ2hCLFNBQVMsRUFBRSxTQUFTLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxhQUFhLEVBQ3hELENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUM7U0FDMUM7UUFFRCxPQUFPLEVBQUUsQ0FBQyxVQUFVLENBQ2hCLFNBQVMsRUFBRSxTQUFTLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxhQUFhLEVBQ3hELENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDL0UsQ0FBQztJQTdCRCxrRUE2QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtnZXRQcm9wZXJ0eU5hbWVUZXh0fSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L3Byb3BlcnR5X25hbWUnO1xuaW1wb3J0IHtOZ1F1ZXJ5RGVmaW5pdGlvbiwgUXVlcnlUaW1pbmd9IGZyb20gJy4vYW5ndWxhci9xdWVyeS1kZWZpbml0aW9uJztcblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHRoZSBnaXZlbiBxdWVyeSBkZWNvcmF0b3IgYnkgZXhwbGljaXRseSBzcGVjaWZ5aW5nIHRoZSB0aW1pbmcgYmFzZWQgb24gdGhlXG4gKiBkZXRlcm1pbmVkIHRpbWluZy4gVGhlIHVwZGF0ZWQgZGVjb3JhdG9yIGNhbGwgZXhwcmVzc2lvbiBub2RlIHdpbGwgYmUgcmV0dXJuZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUcmFuc2Zvcm1lZFF1ZXJ5Q2FsbEV4cHIoXG4gICAgcXVlcnk6IE5nUXVlcnlEZWZpbml0aW9uLCB0aW1pbmc6IFF1ZXJ5VGltaW5nKTogdHMuQ2FsbEV4cHJlc3Npb258bnVsbCB7XG4gIGNvbnN0IHF1ZXJ5RXhwciA9IHF1ZXJ5LmRlY29yYXRvci5ub2RlLmV4cHJlc3Npb247XG4gIGNvbnN0IHF1ZXJ5QXJndW1lbnRzID0gcXVlcnlFeHByLmFyZ3VtZW50cztcbiAgY29uc3QgdGltaW5nUHJvcGVydHlBc3NpZ25tZW50ID0gdHMuY3JlYXRlUHJvcGVydHlBc3NpZ25tZW50KFxuICAgICAgJ3N0YXRpYycsIHRpbWluZyA9PT0gUXVlcnlUaW1pbmcuU1RBVElDID8gdHMuY3JlYXRlVHJ1ZSgpIDogdHMuY3JlYXRlRmFsc2UoKSk7XG5cbiAgLy8gSWYgdGhlIHF1ZXJ5IGRlY29yYXRvciBpcyBhbHJlYWR5IGNhbGxlZCB3aXRoIHR3byBhcmd1bWVudHMsIHdlIG5lZWQgdG9cbiAgLy8ga2VlcCB0aGUgZXhpc3Rpbmcgb3B0aW9ucyB1bnRvdWNoZWQgYW5kIGp1c3QgYWRkIHRoZSBuZXcgcHJvcGVydHkgaWYgbmVlZGVkLlxuICBpZiAocXVlcnlBcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgY29uc3QgZXhpc3RpbmdPcHRpb25zID0gcXVlcnlBcmd1bWVudHNbMV0gYXMgdHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb247XG5cbiAgICAvLyBJbiBjYXNlIHRoZSBvcHRpb25zIGFscmVhZHkgY29udGFpbnMgYSBwcm9wZXJ0eSBmb3IgdGhlIFwic3RhdGljXCIgZmxhZywgd2UganVzdFxuICAgIC8vIHNraXAgdGhpcyBxdWVyeSBhbmQgbGVhdmUgaXQgdW50b3VjaGVkLlxuICAgIGlmIChleGlzdGluZ09wdGlvbnMucHJvcGVydGllcy5zb21lKFxuICAgICAgICAgICAgcCA9PiAhIXAubmFtZSAmJiBnZXRQcm9wZXJ0eU5hbWVUZXh0KHAubmFtZSkgPT09ICdzdGF0aWMnKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZE9wdGlvbnMgPSB0cy51cGRhdGVPYmplY3RMaXRlcmFsKFxuICAgICAgICBleGlzdGluZ09wdGlvbnMsIGV4aXN0aW5nT3B0aW9ucy5wcm9wZXJ0aWVzLmNvbmNhdCh0aW1pbmdQcm9wZXJ0eUFzc2lnbm1lbnQpKTtcbiAgICByZXR1cm4gdHMudXBkYXRlQ2FsbChcbiAgICAgICAgcXVlcnlFeHByLCBxdWVyeUV4cHIuZXhwcmVzc2lvbiwgcXVlcnlFeHByLnR5cGVBcmd1bWVudHMsXG4gICAgICAgIFtxdWVyeUFyZ3VtZW50c1swXSwgdXBkYXRlZE9wdGlvbnNdKTtcbiAgfVxuXG4gIHJldHVybiB0cy51cGRhdGVDYWxsKFxuICAgICAgcXVlcnlFeHByLCBxdWVyeUV4cHIuZXhwcmVzc2lvbiwgcXVlcnlFeHByLnR5cGVBcmd1bWVudHMsXG4gICAgICBbcXVlcnlBcmd1bWVudHNbMF0sIHRzLmNyZWF0ZU9iamVjdExpdGVyYWwoW3RpbWluZ1Byb3BlcnR5QXNzaWdubWVudF0pXSk7XG59XG4iXX0=