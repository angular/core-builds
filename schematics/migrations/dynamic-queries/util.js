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
        define("@angular/core/schematics/migrations/dynamic-queries/util", ["require", "exports", "typescript", "@angular/core/schematics/utils/ng_decorators"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.removeStaticFlag = exports.removeOptionsParameter = exports.identifyDynamicQueryNodes = void 0;
    const ts = require("typescript");
    const ng_decorators_1 = require("@angular/core/schematics/utils/ng_decorators");
    /**
     * Identifies the nodes that should be migrated by the dynamic
     * queries schematic. Splits the nodes into the following categories:
     * - `removeProperty` - queries from which we should only remove the `static` property of the
     *  `options` parameter (e.g. `@ViewChild('child', {static: false, read: ElementRef})`).
     * - `removeParameter` - queries from which we should drop the entire `options` parameter.
     *  (e.g. `@ViewChild('child', {static: false})`).
     */
    function identifyDynamicQueryNodes(typeChecker, sourceFile) {
        const removeProperty = [];
        const removeParameter = [];
        sourceFile.forEachChild(function walk(node) {
            if (ts.isClassDeclaration(node)) {
                node.members.forEach(member => {
                    const angularDecorators = member.decorators && ng_decorators_1.getAngularDecorators(typeChecker, member.decorators);
                    if (angularDecorators) {
                        angularDecorators
                            // Filter out the queries that can have the `static` flag.
                            .filter(decorator => {
                            return decorator.name === 'ViewChild' || decorator.name === 'ContentChild';
                        })
                            // Filter out the queries where the `static` flag is explicitly set to `false`.
                            .filter(decorator => {
                            const options = decorator.node.expression.arguments[1];
                            return options && ts.isObjectLiteralExpression(options) &&
                                options.properties.some(property => ts.isPropertyAssignment(property) &&
                                    property.initializer.kind === ts.SyntaxKind.FalseKeyword);
                        })
                            .forEach(decorator => {
                            const options = decorator.node.expression.arguments[1];
                            // At this point we know that at least one property is the `static` flag. If this is
                            // the only property we can drop the entire object literal, otherwise we have to
                            // drop only the property.
                            if (options.properties.length === 1) {
                                removeParameter.push(decorator.node.expression);
                            }
                            else {
                                removeProperty.push(options);
                            }
                        });
                    }
                });
            }
            node.forEachChild(walk);
        });
        return { removeProperty, removeParameter };
    }
    exports.identifyDynamicQueryNodes = identifyDynamicQueryNodes;
    /** Removes the `options` parameter from the call expression of a query decorator. */
    function removeOptionsParameter(node) {
        return ts.updateCall(node, node.expression, node.typeArguments, [node.arguments[0]]);
    }
    exports.removeOptionsParameter = removeOptionsParameter;
    /** Removes the `static` property from an object literal expression. */
    function removeStaticFlag(node) {
        return ts.updateObjectLiteral(node, node.properties.filter(property => property.name && property.name.getText() !== 'static'));
    }
    exports.removeStaticFlag = removeStaticFlag;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL2R5bmFtaWMtcXVlcmllcy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUNqQyxnRkFBK0Q7SUFFL0Q7Ozs7Ozs7T0FPRztJQUNILFNBQWdCLHlCQUF5QixDQUFDLFdBQTJCLEVBQUUsVUFBeUI7UUFDOUYsTUFBTSxjQUFjLEdBQWlDLEVBQUUsQ0FBQztRQUN4RCxNQUFNLGVBQWUsR0FBd0IsRUFBRSxDQUFDO1FBRWhELFVBQVUsQ0FBQyxZQUFZLENBQUMsU0FBUyxJQUFJLENBQUMsSUFBYTtZQUNqRCxJQUFJLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7b0JBQzVCLE1BQU0saUJBQWlCLEdBQ25CLE1BQU0sQ0FBQyxVQUFVLElBQUksb0NBQW9CLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFFOUUsSUFBSSxpQkFBaUIsRUFBRTt3QkFDckIsaUJBQWlCOzRCQUNiLDBEQUEwRDs2QkFDekQsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFOzRCQUNsQixPQUFPLFNBQVMsQ0FBQyxJQUFJLEtBQUssV0FBVyxJQUFJLFNBQVMsQ0FBQyxJQUFJLEtBQUssY0FBYyxDQUFDO3dCQUM3RSxDQUFDLENBQUM7NEJBQ0YsK0VBQStFOzZCQUM5RSxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUU7NEJBQ2xCLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDdkQsT0FBTyxPQUFPLElBQUksRUFBRSxDQUFDLHlCQUF5QixDQUFDLE9BQU8sQ0FBQztnQ0FDbkQsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQ25CLFFBQVEsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQztvQ0FDekMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQzt3QkFDeEUsQ0FBQyxDQUFDOzZCQUNELE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTs0QkFDbkIsTUFBTSxPQUFPLEdBQ1QsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBK0IsQ0FBQzs0QkFFekUsb0ZBQW9GOzRCQUNwRixnRkFBZ0Y7NEJBQ2hGLDBCQUEwQjs0QkFDMUIsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0NBQ25DLGVBQWUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQzs2QkFDakQ7aUNBQU07Z0NBQ0wsY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzs2QkFDOUI7d0JBQ0gsQ0FBQyxDQUFDLENBQUM7cUJBQ1I7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7YUFDSjtZQUVELElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUIsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFFLGVBQWUsRUFBQyxDQUFDO0lBQzNDLENBQUM7SUE3Q0QsOERBNkNDO0lBRUQscUZBQXFGO0lBQ3JGLFNBQWdCLHNCQUFzQixDQUFDLElBQXVCO1FBQzVELE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkYsQ0FBQztJQUZELHdEQUVDO0lBRUQsdUVBQXVFO0lBQ3ZFLFNBQWdCLGdCQUFnQixDQUFDLElBQWdDO1FBQy9ELE9BQU8sRUFBRSxDQUFDLG1CQUFtQixDQUN6QixJQUFJLEVBQ0osSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztJQUNqRyxDQUFDO0lBSkQsNENBSUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtnZXRBbmd1bGFyRGVjb3JhdG9yc30gZnJvbSAnLi4vLi4vdXRpbHMvbmdfZGVjb3JhdG9ycyc7XG5cbi8qKlxuICogSWRlbnRpZmllcyB0aGUgbm9kZXMgdGhhdCBzaG91bGQgYmUgbWlncmF0ZWQgYnkgdGhlIGR5bmFtaWNcbiAqIHF1ZXJpZXMgc2NoZW1hdGljLiBTcGxpdHMgdGhlIG5vZGVzIGludG8gdGhlIGZvbGxvd2luZyBjYXRlZ29yaWVzOlxuICogLSBgcmVtb3ZlUHJvcGVydHlgIC0gcXVlcmllcyBmcm9tIHdoaWNoIHdlIHNob3VsZCBvbmx5IHJlbW92ZSB0aGUgYHN0YXRpY2AgcHJvcGVydHkgb2YgdGhlXG4gKiAgYG9wdGlvbnNgIHBhcmFtZXRlciAoZS5nLiBgQFZpZXdDaGlsZCgnY2hpbGQnLCB7c3RhdGljOiBmYWxzZSwgcmVhZDogRWxlbWVudFJlZn0pYCkuXG4gKiAtIGByZW1vdmVQYXJhbWV0ZXJgIC0gcXVlcmllcyBmcm9tIHdoaWNoIHdlIHNob3VsZCBkcm9wIHRoZSBlbnRpcmUgYG9wdGlvbnNgIHBhcmFtZXRlci5cbiAqICAoZS5nLiBgQFZpZXdDaGlsZCgnY2hpbGQnLCB7c3RhdGljOiBmYWxzZX0pYCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpZGVudGlmeUR5bmFtaWNRdWVyeU5vZGVzKHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwgc291cmNlRmlsZTogdHMuU291cmNlRmlsZSkge1xuICBjb25zdCByZW1vdmVQcm9wZXJ0eTogdHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb25bXSA9IFtdO1xuICBjb25zdCByZW1vdmVQYXJhbWV0ZXI6IHRzLkNhbGxFeHByZXNzaW9uW10gPSBbXTtcblxuICBzb3VyY2VGaWxlLmZvckVhY2hDaGlsZChmdW5jdGlvbiB3YWxrKG5vZGU6IHRzLk5vZGUpIHtcbiAgICBpZiAodHMuaXNDbGFzc0RlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICBub2RlLm1lbWJlcnMuZm9yRWFjaChtZW1iZXIgPT4ge1xuICAgICAgICBjb25zdCBhbmd1bGFyRGVjb3JhdG9ycyA9XG4gICAgICAgICAgICBtZW1iZXIuZGVjb3JhdG9ycyAmJiBnZXRBbmd1bGFyRGVjb3JhdG9ycyh0eXBlQ2hlY2tlciwgbWVtYmVyLmRlY29yYXRvcnMpO1xuXG4gICAgICAgIGlmIChhbmd1bGFyRGVjb3JhdG9ycykge1xuICAgICAgICAgIGFuZ3VsYXJEZWNvcmF0b3JzXG4gICAgICAgICAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHF1ZXJpZXMgdGhhdCBjYW4gaGF2ZSB0aGUgYHN0YXRpY2AgZmxhZy5cbiAgICAgICAgICAgICAgLmZpbHRlcihkZWNvcmF0b3IgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBkZWNvcmF0b3IubmFtZSA9PT0gJ1ZpZXdDaGlsZCcgfHwgZGVjb3JhdG9yLm5hbWUgPT09ICdDb250ZW50Q2hpbGQnO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAvLyBGaWx0ZXIgb3V0IHRoZSBxdWVyaWVzIHdoZXJlIHRoZSBgc3RhdGljYCBmbGFnIGlzIGV4cGxpY2l0bHkgc2V0IHRvIGBmYWxzZWAuXG4gICAgICAgICAgICAgIC5maWx0ZXIoZGVjb3JhdG9yID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0gZGVjb3JhdG9yLm5vZGUuZXhwcmVzc2lvbi5hcmd1bWVudHNbMV07XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMgJiYgdHMuaXNPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihvcHRpb25zKSAmJlxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnByb3BlcnRpZXMuc29tZShcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5ID0+IHRzLmlzUHJvcGVydHlBc3NpZ25tZW50KHByb3BlcnR5KSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5LmluaXRpYWxpemVyLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuRmFsc2VLZXl3b3JkKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmZvckVhY2goZGVjb3JhdG9yID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID1cbiAgICAgICAgICAgICAgICAgICAgZGVjb3JhdG9yLm5vZGUuZXhwcmVzc2lvbi5hcmd1bWVudHNbMV0gYXMgdHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb247XG5cbiAgICAgICAgICAgICAgICAvLyBBdCB0aGlzIHBvaW50IHdlIGtub3cgdGhhdCBhdCBsZWFzdCBvbmUgcHJvcGVydHkgaXMgdGhlIGBzdGF0aWNgIGZsYWcuIElmIHRoaXMgaXNcbiAgICAgICAgICAgICAgICAvLyB0aGUgb25seSBwcm9wZXJ0eSB3ZSBjYW4gZHJvcCB0aGUgZW50aXJlIG9iamVjdCBsaXRlcmFsLCBvdGhlcndpc2Ugd2UgaGF2ZSB0b1xuICAgICAgICAgICAgICAgIC8vIGRyb3Agb25seSB0aGUgcHJvcGVydHkuXG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMucHJvcGVydGllcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgIHJlbW92ZVBhcmFtZXRlci5wdXNoKGRlY29yYXRvci5ub2RlLmV4cHJlc3Npb24pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICByZW1vdmVQcm9wZXJ0eS5wdXNoKG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIG5vZGUuZm9yRWFjaENoaWxkKHdhbGspO1xuICB9KTtcblxuICByZXR1cm4ge3JlbW92ZVByb3BlcnR5LCByZW1vdmVQYXJhbWV0ZXJ9O1xufVxuXG4vKiogUmVtb3ZlcyB0aGUgYG9wdGlvbnNgIHBhcmFtZXRlciBmcm9tIHRoZSBjYWxsIGV4cHJlc3Npb24gb2YgYSBxdWVyeSBkZWNvcmF0b3IuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlT3B0aW9uc1BhcmFtZXRlcihub2RlOiB0cy5DYWxsRXhwcmVzc2lvbik6IHRzLkNhbGxFeHByZXNzaW9uIHtcbiAgcmV0dXJuIHRzLnVwZGF0ZUNhbGwobm9kZSwgbm9kZS5leHByZXNzaW9uLCBub2RlLnR5cGVBcmd1bWVudHMsIFtub2RlLmFyZ3VtZW50c1swXV0pO1xufVxuXG4vKiogUmVtb3ZlcyB0aGUgYHN0YXRpY2AgcHJvcGVydHkgZnJvbSBhbiBvYmplY3QgbGl0ZXJhbCBleHByZXNzaW9uLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZVN0YXRpY0ZsYWcobm9kZTogdHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24pOiB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbiB7XG4gIHJldHVybiB0cy51cGRhdGVPYmplY3RMaXRlcmFsKFxuICAgICAgbm9kZSxcbiAgICAgIG5vZGUucHJvcGVydGllcy5maWx0ZXIocHJvcGVydHkgPT4gcHJvcGVydHkubmFtZSAmJiBwcm9wZXJ0eS5uYW1lLmdldFRleHQoKSAhPT0gJ3N0YXRpYycpKTtcbn1cbiJdfQ==