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
                    const angularDecorators = member.decorators && (0, ng_decorators_1.getAngularDecorators)(typeChecker, member.decorators);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL2R5bmFtaWMtcXVlcmllcy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUNqQyxnRkFBK0Q7SUFFL0Q7Ozs7Ozs7T0FPRztJQUNILFNBQWdCLHlCQUF5QixDQUFDLFdBQTJCLEVBQUUsVUFBeUI7UUFDOUYsTUFBTSxjQUFjLEdBQWlDLEVBQUUsQ0FBQztRQUN4RCxNQUFNLGVBQWUsR0FBd0IsRUFBRSxDQUFDO1FBRWhELFVBQVUsQ0FBQyxZQUFZLENBQUMsU0FBUyxJQUFJLENBQUMsSUFBYTtZQUNqRCxJQUFJLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7b0JBQzVCLE1BQU0saUJBQWlCLEdBQ25CLE1BQU0sQ0FBQyxVQUFVLElBQUksSUFBQSxvQ0FBb0IsRUFBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUU5RSxJQUFJLGlCQUFpQixFQUFFO3dCQUNyQixpQkFBaUI7NEJBQ2IsMERBQTBEOzZCQUN6RCxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUU7NEJBQ2xCLE9BQU8sU0FBUyxDQUFDLElBQUksS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDLElBQUksS0FBSyxjQUFjLENBQUM7d0JBQzdFLENBQUMsQ0FBQzs0QkFDRiwrRUFBK0U7NkJBQzlFLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRTs0QkFDbEIsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUN2RCxPQUFPLE9BQU8sSUFBSSxFQUFFLENBQUMseUJBQXlCLENBQUMsT0FBTyxDQUFDO2dDQUNuRCxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FDbkIsUUFBUSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDO29DQUN6QyxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDO3dCQUN4RSxDQUFDLENBQUM7NkJBQ0QsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFOzRCQUNuQixNQUFNLE9BQU8sR0FDVCxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUErQixDQUFDOzRCQUV6RSxvRkFBb0Y7NEJBQ3BGLGdGQUFnRjs0QkFDaEYsMEJBQTBCOzRCQUMxQixJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQ0FDbkMsZUFBZSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDOzZCQUNqRDtpQ0FBTTtnQ0FDTCxjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDOzZCQUM5Qjt3QkFDSCxDQUFDLENBQUMsQ0FBQztxQkFDUjtnQkFDSCxDQUFDLENBQUMsQ0FBQzthQUNKO1lBRUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxQixDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sRUFBQyxjQUFjLEVBQUUsZUFBZSxFQUFDLENBQUM7SUFDM0MsQ0FBQztJQTdDRCw4REE2Q0M7SUFFRCxxRkFBcUY7SUFDckYsU0FBZ0Isc0JBQXNCLENBQUMsSUFBdUI7UUFDNUQsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2RixDQUFDO0lBRkQsd0RBRUM7SUFFRCx1RUFBdUU7SUFDdkUsU0FBZ0IsZ0JBQWdCLENBQUMsSUFBZ0M7UUFDL0QsT0FBTyxFQUFFLENBQUMsbUJBQW1CLENBQ3pCLElBQUksRUFDSixJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ2pHLENBQUM7SUFKRCw0Q0FJQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7Z2V0QW5ndWxhckRlY29yYXRvcnN9IGZyb20gJy4uLy4uL3V0aWxzL25nX2RlY29yYXRvcnMnO1xuXG4vKipcbiAqIElkZW50aWZpZXMgdGhlIG5vZGVzIHRoYXQgc2hvdWxkIGJlIG1pZ3JhdGVkIGJ5IHRoZSBkeW5hbWljXG4gKiBxdWVyaWVzIHNjaGVtYXRpYy4gU3BsaXRzIHRoZSBub2RlcyBpbnRvIHRoZSBmb2xsb3dpbmcgY2F0ZWdvcmllczpcbiAqIC0gYHJlbW92ZVByb3BlcnR5YCAtIHF1ZXJpZXMgZnJvbSB3aGljaCB3ZSBzaG91bGQgb25seSByZW1vdmUgdGhlIGBzdGF0aWNgIHByb3BlcnR5IG9mIHRoZVxuICogIGBvcHRpb25zYCBwYXJhbWV0ZXIgKGUuZy4gYEBWaWV3Q2hpbGQoJ2NoaWxkJywge3N0YXRpYzogZmFsc2UsIHJlYWQ6IEVsZW1lbnRSZWZ9KWApLlxuICogLSBgcmVtb3ZlUGFyYW1ldGVyYCAtIHF1ZXJpZXMgZnJvbSB3aGljaCB3ZSBzaG91bGQgZHJvcCB0aGUgZW50aXJlIGBvcHRpb25zYCBwYXJhbWV0ZXIuXG4gKiAgKGUuZy4gYEBWaWV3Q2hpbGQoJ2NoaWxkJywge3N0YXRpYzogZmFsc2V9KWApLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaWRlbnRpZnlEeW5hbWljUXVlcnlOb2Rlcyh0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsIHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpIHtcbiAgY29uc3QgcmVtb3ZlUHJvcGVydHk6IHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uW10gPSBbXTtcbiAgY29uc3QgcmVtb3ZlUGFyYW1ldGVyOiB0cy5DYWxsRXhwcmVzc2lvbltdID0gW107XG5cbiAgc291cmNlRmlsZS5mb3JFYWNoQ2hpbGQoZnVuY3Rpb24gd2Fsayhub2RlOiB0cy5Ob2RlKSB7XG4gICAgaWYgKHRzLmlzQ2xhc3NEZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgbm9kZS5tZW1iZXJzLmZvckVhY2gobWVtYmVyID0+IHtcbiAgICAgICAgY29uc3QgYW5ndWxhckRlY29yYXRvcnMgPVxuICAgICAgICAgICAgbWVtYmVyLmRlY29yYXRvcnMgJiYgZ2V0QW5ndWxhckRlY29yYXRvcnModHlwZUNoZWNrZXIsIG1lbWJlci5kZWNvcmF0b3JzKTtcblxuICAgICAgICBpZiAoYW5ndWxhckRlY29yYXRvcnMpIHtcbiAgICAgICAgICBhbmd1bGFyRGVjb3JhdG9yc1xuICAgICAgICAgICAgICAvLyBGaWx0ZXIgb3V0IHRoZSBxdWVyaWVzIHRoYXQgY2FuIGhhdmUgdGhlIGBzdGF0aWNgIGZsYWcuXG4gICAgICAgICAgICAgIC5maWx0ZXIoZGVjb3JhdG9yID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVjb3JhdG9yLm5hbWUgPT09ICdWaWV3Q2hpbGQnIHx8IGRlY29yYXRvci5uYW1lID09PSAnQ29udGVudENoaWxkJztcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLy8gRmlsdGVyIG91dCB0aGUgcXVlcmllcyB3aGVyZSB0aGUgYHN0YXRpY2AgZmxhZyBpcyBleHBsaWNpdGx5IHNldCB0byBgZmFsc2VgLlxuICAgICAgICAgICAgICAuZmlsdGVyKGRlY29yYXRvciA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGRlY29yYXRvci5ub2RlLmV4cHJlc3Npb24uYXJndW1lbnRzWzFdO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcHRpb25zICYmIHRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24ob3B0aW9ucykgJiZcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5wcm9wZXJ0aWVzLnNvbWUoXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eSA9PiB0cy5pc1Byb3BlcnR5QXNzaWdubWVudChwcm9wZXJ0eSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eS5pbml0aWFsaXplci5raW5kID09PSB0cy5TeW50YXhLaW5kLkZhbHNlS2V5d29yZCk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5mb3JFYWNoKGRlY29yYXRvciA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9XG4gICAgICAgICAgICAgICAgICAgIGRlY29yYXRvci5ub2RlLmV4cHJlc3Npb24uYXJndW1lbnRzWzFdIGFzIHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uO1xuXG4gICAgICAgICAgICAgICAgLy8gQXQgdGhpcyBwb2ludCB3ZSBrbm93IHRoYXQgYXQgbGVhc3Qgb25lIHByb3BlcnR5IGlzIHRoZSBgc3RhdGljYCBmbGFnLiBJZiB0aGlzIGlzXG4gICAgICAgICAgICAgICAgLy8gdGhlIG9ubHkgcHJvcGVydHkgd2UgY2FuIGRyb3AgdGhlIGVudGlyZSBvYmplY3QgbGl0ZXJhbCwgb3RoZXJ3aXNlIHdlIGhhdmUgdG9cbiAgICAgICAgICAgICAgICAvLyBkcm9wIG9ubHkgdGhlIHByb3BlcnR5LlxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnByb3BlcnRpZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICByZW1vdmVQYXJhbWV0ZXIucHVzaChkZWNvcmF0b3Iubm9kZS5leHByZXNzaW9uKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgcmVtb3ZlUHJvcGVydHkucHVzaChvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBub2RlLmZvckVhY2hDaGlsZCh3YWxrKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHtyZW1vdmVQcm9wZXJ0eSwgcmVtb3ZlUGFyYW1ldGVyfTtcbn1cblxuLyoqIFJlbW92ZXMgdGhlIGBvcHRpb25zYCBwYXJhbWV0ZXIgZnJvbSB0aGUgY2FsbCBleHByZXNzaW9uIG9mIGEgcXVlcnkgZGVjb3JhdG9yLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZU9wdGlvbnNQYXJhbWV0ZXIobm9kZTogdHMuQ2FsbEV4cHJlc3Npb24pOiB0cy5DYWxsRXhwcmVzc2lvbiB7XG4gIHJldHVybiB0cy51cGRhdGVDYWxsKG5vZGUsIG5vZGUuZXhwcmVzc2lvbiwgbm9kZS50eXBlQXJndW1lbnRzLCBbbm9kZS5hcmd1bWVudHNbMF1dKTtcbn1cblxuLyoqIFJlbW92ZXMgdGhlIGBzdGF0aWNgIHByb3BlcnR5IGZyb20gYW4gb2JqZWN0IGxpdGVyYWwgZXhwcmVzc2lvbi4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVTdGF0aWNGbGFnKG5vZGU6IHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uKTogdHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24ge1xuICByZXR1cm4gdHMudXBkYXRlT2JqZWN0TGl0ZXJhbChcbiAgICAgIG5vZGUsXG4gICAgICBub2RlLnByb3BlcnRpZXMuZmlsdGVyKHByb3BlcnR5ID0+IHByb3BlcnR5Lm5hbWUgJiYgcHJvcGVydHkubmFtZS5nZXRUZXh0KCkgIT09ICdzdGF0aWMnKSk7XG59XG4iXX0=