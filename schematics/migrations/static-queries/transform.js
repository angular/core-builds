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
        define("@angular/core/schematics/migrations/static-queries/transform", ["require", "exports", "typescript", "@angular/core/schematics/migrations/static-queries/angular/query-definition", "@angular/core/schematics/migrations/static-queries/typescript/property_name"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const query_definition_1 = require("@angular/core/schematics/migrations/static-queries/angular/query-definition");
    const property_name_1 = require("@angular/core/schematics/migrations/static-queries/typescript/property_name");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvc3RhdGljLXF1ZXJpZXMvdHJhbnNmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBRWpDLGtIQUEwRTtJQUMxRSwrR0FBK0Q7SUFHL0Q7OztPQUdHO0lBQ0gsU0FBZ0IsMkJBQTJCLENBQ3ZDLEtBQXdCLEVBQUUsTUFBbUI7UUFDL0MsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBK0IsQ0FBQztRQUN2RSxNQUFNLGNBQWMsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDO1FBQzNDLE1BQU0sd0JBQXdCLEdBQUcsRUFBRSxDQUFDLHdCQUF3QixDQUN4RCxRQUFRLEVBQUUsTUFBTSxLQUFLLDhCQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1FBRWxGLDBFQUEwRTtRQUMxRSwrRUFBK0U7UUFDL0UsSUFBSSxjQUFjLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUMvQixNQUFNLGVBQWUsR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUErQixDQUFDO1lBRXhFLGlGQUFpRjtZQUNqRiwwQ0FBMEM7WUFDMUMsSUFBSSxlQUFlLENBQUMsVUFBVSxDQUFDLElBQUksQ0FDM0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxtQ0FBbUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssUUFBUSxDQUFDLEVBQUU7Z0JBQ2xFLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFFRCxNQUFNLGNBQWMsR0FBRyxFQUFFLENBQUMsbUJBQW1CLENBQ3pDLGVBQWUsRUFBRSxlQUFlLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUM7WUFDbEYsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUNoQixTQUFTLEVBQUUsU0FBUyxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsYUFBYSxFQUN4RCxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDO1NBQzFDO1FBRUQsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUNoQixTQUFTLEVBQUUsU0FBUyxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsYUFBYSxFQUN4RCxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsbUJBQW1CLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQy9FLENBQUM7SUE3QkQsa0VBNkJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtOZ1F1ZXJ5RGVmaW5pdGlvbiwgUXVlcnlUaW1pbmd9IGZyb20gJy4vYW5ndWxhci9xdWVyeS1kZWZpbml0aW9uJztcbmltcG9ydCB7Z2V0UHJvcGVydHlOYW1lVGV4dH0gZnJvbSAnLi90eXBlc2NyaXB0L3Byb3BlcnR5X25hbWUnO1xuXG5cbi8qKlxuICogVHJhbnNmb3JtcyB0aGUgZ2l2ZW4gcXVlcnkgZGVjb3JhdG9yIGJ5IGV4cGxpY2l0bHkgc3BlY2lmeWluZyB0aGUgdGltaW5nIGJhc2VkIG9uIHRoZVxuICogZGV0ZXJtaW5lZCB0aW1pbmcuIFRoZSB1cGRhdGVkIGRlY29yYXRvciBjYWxsIGV4cHJlc3Npb24gbm9kZSB3aWxsIGJlIHJldHVybmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHJhbnNmb3JtZWRRdWVyeUNhbGxFeHByKFxuICAgIHF1ZXJ5OiBOZ1F1ZXJ5RGVmaW5pdGlvbiwgdGltaW5nOiBRdWVyeVRpbWluZyk6IHRzLkNhbGxFeHByZXNzaW9ufG51bGwge1xuICBjb25zdCBxdWVyeUV4cHIgPSBxdWVyeS5kZWNvcmF0b3Iubm9kZS5leHByZXNzaW9uIGFzIHRzLkNhbGxFeHByZXNzaW9uO1xuICBjb25zdCBxdWVyeUFyZ3VtZW50cyA9IHF1ZXJ5RXhwci5hcmd1bWVudHM7XG4gIGNvbnN0IHRpbWluZ1Byb3BlcnR5QXNzaWdubWVudCA9IHRzLmNyZWF0ZVByb3BlcnR5QXNzaWdubWVudChcbiAgICAgICdzdGF0aWMnLCB0aW1pbmcgPT09IFF1ZXJ5VGltaW5nLlNUQVRJQyA/IHRzLmNyZWF0ZVRydWUoKSA6IHRzLmNyZWF0ZUZhbHNlKCkpO1xuXG4gIC8vIElmIHRoZSBxdWVyeSBkZWNvcmF0b3IgaXMgYWxyZWFkeSBjYWxsZWQgd2l0aCB0d28gYXJndW1lbnRzLCB3ZSBuZWVkIHRvXG4gIC8vIGtlZXAgdGhlIGV4aXN0aW5nIG9wdGlvbnMgdW50b3VjaGVkIGFuZCBqdXN0IGFkZCB0aGUgbmV3IHByb3BlcnR5IGlmIG5lZWRlZC5cbiAgaWYgKHF1ZXJ5QXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xuICAgIGNvbnN0IGV4aXN0aW5nT3B0aW9ucyA9IHF1ZXJ5QXJndW1lbnRzWzFdIGFzIHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uO1xuXG4gICAgLy8gSW4gY2FzZSB0aGUgb3B0aW9ucyBhbHJlYWR5IGNvbnRhaW5zIGEgcHJvcGVydHkgZm9yIHRoZSBcInN0YXRpY1wiIGZsYWcsIHdlIGp1c3RcbiAgICAvLyBza2lwIHRoaXMgcXVlcnkgYW5kIGxlYXZlIGl0IHVudG91Y2hlZC5cbiAgICBpZiAoZXhpc3RpbmdPcHRpb25zLnByb3BlcnRpZXMuc29tZShcbiAgICAgICAgICAgIHAgPT4gISFwLm5hbWUgJiYgZ2V0UHJvcGVydHlOYW1lVGV4dChwLm5hbWUpID09PSAnc3RhdGljJykpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWRPcHRpb25zID0gdHMudXBkYXRlT2JqZWN0TGl0ZXJhbChcbiAgICAgICAgZXhpc3RpbmdPcHRpb25zLCBleGlzdGluZ09wdGlvbnMucHJvcGVydGllcy5jb25jYXQodGltaW5nUHJvcGVydHlBc3NpZ25tZW50KSk7XG4gICAgcmV0dXJuIHRzLnVwZGF0ZUNhbGwoXG4gICAgICAgIHF1ZXJ5RXhwciwgcXVlcnlFeHByLmV4cHJlc3Npb24sIHF1ZXJ5RXhwci50eXBlQXJndW1lbnRzLFxuICAgICAgICBbcXVlcnlBcmd1bWVudHNbMF0sIHVwZGF0ZWRPcHRpb25zXSk7XG4gIH1cblxuICByZXR1cm4gdHMudXBkYXRlQ2FsbChcbiAgICAgIHF1ZXJ5RXhwciwgcXVlcnlFeHByLmV4cHJlc3Npb24sIHF1ZXJ5RXhwci50eXBlQXJndW1lbnRzLFxuICAgICAgW3F1ZXJ5QXJndW1lbnRzWzBdLCB0cy5jcmVhdGVPYmplY3RMaXRlcmFsKFt0aW1pbmdQcm9wZXJ0eUFzc2lnbm1lbnRdKV0pO1xufVxuIl19