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
        define("@angular/core/schematics/migrations/module-with-providers/transform", ["require", "exports", "typescript", "@angular/core/schematics/migrations/module-with-providers/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ModuleWithProvidersTransform = void 0;
    const typescript_1 = __importDefault(require("typescript"));
    const util_1 = require("@angular/core/schematics/migrations/module-with-providers/util");
    const TODO_COMMENT = 'TODO: The following node requires a generic type for `ModuleWithProviders`';
    class ModuleWithProvidersTransform {
        constructor(typeChecker, getUpdateRecorder, compilerCliMigrationsModule) {
            this.typeChecker = typeChecker;
            this.getUpdateRecorder = getUpdateRecorder;
            this.compilerCliMigrationsModule = compilerCliMigrationsModule;
            this.printer = typescript_1.default.createPrinter();
            this.partialEvaluator = new this.compilerCliMigrationsModule.PartialEvaluator(new this.compilerCliMigrationsModule.TypeScriptReflectionHost(this.typeChecker), this.typeChecker, 
            /* dependencyTracker */ null);
        }
        /** Migrates a given NgModule by walking through the referenced providers and static methods. */
        migrateModule(module) {
            return module.staticMethodsWithoutType.map(this._migrateStaticNgModuleMethod.bind(this))
                .filter(v => v);
        }
        /** Migrates a ModuleWithProviders type definition that has no explicit generic type */
        migrateType(type) {
            const parent = type.parent;
            let moduleText;
            if ((typescript_1.default.isFunctionDeclaration(parent) || typescript_1.default.isMethodDeclaration(parent)) && parent.body) {
                const returnStatement = parent.body.statements.find(typescript_1.default.isReturnStatement);
                // No return type found, exit
                if (!returnStatement || !returnStatement.expression) {
                    return [{ node: parent, message: `Return type is not statically analyzable.` }];
                }
                moduleText = this._getNgModuleTypeOfExpression(returnStatement.expression);
            }
            else if (typescript_1.default.isPropertyDeclaration(parent) || typescript_1.default.isVariableDeclaration(parent)) {
                if (!parent.initializer) {
                    addTodoToNode(type, TODO_COMMENT);
                    this._updateNode(type, type);
                    return [{ node: parent, message: `Unable to determine type for declaration.` }];
                }
                moduleText = this._getNgModuleTypeOfExpression(parent.initializer);
            }
            if (moduleText) {
                this._addGenericToTypeReference(type, moduleText);
                return [];
            }
            return [{ node: parent, message: `Type is not statically analyzable.` }];
        }
        /** Add a given generic to a type reference node */
        _addGenericToTypeReference(node, typeName) {
            const newGenericExpr = (0, util_1.createModuleWithProvidersType)(typeName, node);
            this._updateNode(node, newGenericExpr);
        }
        /**
         * Migrates a given static method if its ModuleWithProviders does not provide
         * a generic type.
         */
        _updateStaticMethodType(method, typeName) {
            const newGenericExpr = (0, util_1.createModuleWithProvidersType)(typeName, method.type);
            const newMethodDecl = typescript_1.default.updateMethod(method, method.decorators, method.modifiers, method.asteriskToken, method.name, method.questionToken, method.typeParameters, method.parameters, newGenericExpr, method.body);
            this._updateNode(method, newMethodDecl);
        }
        /** Whether the resolved value map represents a ModuleWithProviders object */
        isModuleWithProvidersType(value) {
            const ngModule = value.get('ngModule') !== undefined;
            const providers = value.get('providers') !== undefined;
            return ngModule && (value.size === 1 || (providers && value.size === 2));
        }
        /**
         * Determine the generic type of a suspected ModuleWithProviders return type and add it
         * explicitly
         */
        _migrateStaticNgModuleMethod(node) {
            const returnStatement = node.body &&
                node.body.statements.find(n => typescript_1.default.isReturnStatement(n));
            // No return type found, exit
            if (!returnStatement || !returnStatement.expression) {
                return { node: node, message: `Return type is not statically analyzable.` };
            }
            const moduleText = this._getNgModuleTypeOfExpression(returnStatement.expression);
            if (moduleText) {
                this._updateStaticMethodType(node, moduleText);
                return null;
            }
            return { node: node, message: `Method type is not statically analyzable.` };
        }
        /** Evaluate and return the ngModule type from an expression */
        _getNgModuleTypeOfExpression(expr) {
            const evaluatedExpr = this.partialEvaluator.evaluate(expr);
            return this._getTypeOfResolvedValue(evaluatedExpr);
        }
        /**
         * Visits a given object literal expression to determine the ngModule type. If the expression
         * cannot be resolved, add a TODO to alert the user.
         */
        _getTypeOfResolvedValue(value) {
            if (value instanceof Map && this.isModuleWithProvidersType(value)) {
                const mapValue = value.get('ngModule');
                if (mapValue instanceof this.compilerCliMigrationsModule.Reference &&
                    typescript_1.default.isClassDeclaration(mapValue.node) && mapValue.node.name) {
                    return mapValue.node.name.text;
                }
                else if (mapValue instanceof this.compilerCliMigrationsModule.DynamicValue) {
                    addTodoToNode(mapValue.node, TODO_COMMENT);
                    this._updateNode(mapValue.node, mapValue.node);
                }
            }
            return undefined;
        }
        _updateNode(node, newNode) {
            const newText = this.printer.printNode(typescript_1.default.EmitHint.Unspecified, newNode, node.getSourceFile());
            const recorder = this.getUpdateRecorder(node.getSourceFile());
            recorder.remove(node.getStart(), node.getWidth());
            recorder.insertRight(node.getStart(), newText);
        }
    }
    exports.ModuleWithProvidersTransform = ModuleWithProvidersTransform;
    /**
     * Adds a to-do to the given TypeScript node which alerts developers to fix
     * potential issues identified by the migration.
     */
    function addTodoToNode(node, text) {
        typescript_1.default.setSyntheticLeadingComments(node, [{
                pos: -1,
                end: -1,
                hasTrailingNewLine: false,
                kind: typescript_1.default.SyntaxKind.MultiLineCommentTrivia,
                text: ` ${text} `
            }]);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvbW9kdWxlLXdpdGgtcHJvdmlkZXJzL3RyYW5zZm9ybS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7SUFJSCw0REFBNEI7SUFHNUIseUZBQXFEO0lBT3JELE1BQU0sWUFBWSxHQUFHLDRFQUE0RSxDQUFDO0lBRWxHLE1BQWEsNEJBQTRCO1FBT3ZDLFlBQ1ksV0FBMkIsRUFDM0IsaUJBQXdELEVBQ3hELDJCQUNxRDtZQUhyRCxnQkFBVyxHQUFYLFdBQVcsQ0FBZ0I7WUFDM0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUF1QztZQUN4RCxnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQzBCO1lBVnpELFlBQU8sR0FBRyxvQkFBRSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQzdCLHFCQUFnQixHQUFHLElBQUksSUFBSSxDQUFDLDJCQUEyQixDQUFDLGdCQUFnQixDQUM1RSxJQUFJLElBQUksQ0FBQywyQkFBMkIsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQy9FLElBQUksQ0FBQyxXQUFXO1lBQ2hCLHVCQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDO1FBTWtDLENBQUM7UUFFckUsZ0dBQWdHO1FBQ2hHLGFBQWEsQ0FBQyxNQUF3QjtZQUNwQyxPQUFPLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDNUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFzQixDQUFDO1FBQ2xELENBQUM7UUFFRCx1RkFBdUY7UUFDdkYsV0FBVyxDQUFDLElBQTBCO1lBQ3BDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FB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YUFBYSxDQUFDLElBQWEsRUFBRSxJQUFZO1FBQ2hELG9CQUFFLENBQUMsMkJBQTJCLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ0wsR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFDUCxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUNQLGtCQUFrQixFQUFFLEtBQUs7Z0JBQ3pCLElBQUksRUFBRSxvQkFBRSxDQUFDLFVBQVUsQ0FBQyxzQkFBc0I7Z0JBQzFDLElBQUksRUFBRSxJQUFJLElBQUksR0FBRzthQUNsQixDQUFDLENBQUMsQ0FBQztJQUNyQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VXBkYXRlUmVjb3JkZXJ9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB0eXBlIHtSZXNvbHZlZFZhbHVlLCBSZXNvbHZlZFZhbHVlTWFwfSBmcm9tICdAYW5ndWxhci9jb21waWxlci1jbGkvcHJpdmF0ZS9taWdyYXRpb25zJztcbmltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtSZXNvbHZlZE5nTW9kdWxlfSBmcm9tICcuL2NvbGxlY3Rvcic7XG5pbXBvcnQge2NyZWF0ZU1vZHVsZVdpdGhQcm92aWRlcnNUeXBlfSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFuYWx5c2lzRmFpbHVyZSB7XG4gIG5vZGU6IHRzLk5vZGU7XG4gIG1lc3NhZ2U6IHN0cmluZztcbn1cblxuY29uc3QgVE9ET19DT01NRU5UID0gJ1RPRE86IFRoZSBmb2xsb3dpbmcgbm9kZSByZXF1aXJlcyBhIGdlbmVyaWMgdHlwZSBmb3IgYE1vZHVsZVdpdGhQcm92aWRlcnNgJztcblxuZXhwb3J0IGNsYXNzIE1vZHVsZVdpdGhQcm92aWRlcnNUcmFuc2Zvcm0ge1xuICBwcml2YXRlIHByaW50ZXIgPSB0cy5jcmVhdGVQcmludGVyKCk7XG4gIHByaXZhdGUgcGFydGlhbEV2YWx1YXRvciA9IG5ldyB0aGlzLmNvbXBpbGVyQ2xpTWlncmF0aW9uc01vZHVsZS5QYXJ0aWFsRXZhbHVhdG9yKFxuICAgICAgbmV3IHRoaXMuY29tcGlsZXJDbGlNaWdyYXRpb25zTW9kdWxlLlR5cGVTY3JpcHRSZWZsZWN0aW9uSG9zdCh0aGlzLnR5cGVDaGVja2VyKSxcbiAgICAgIHRoaXMudHlwZUNoZWNrZXIsXG4gICAgICAvKiBkZXBlbmRlbmN5VHJhY2tlciAqLyBudWxsKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLFxuICAgICAgcHJpdmF0ZSBnZXRVcGRhdGVSZWNvcmRlcjogKHNmOiB0cy5Tb3VyY2VGaWxlKSA9PiBVcGRhdGVSZWNvcmRlcixcbiAgICAgIHByaXZhdGUgY29tcGlsZXJDbGlNaWdyYXRpb25zTW9kdWxlOlxuICAgICAgICAgIHR5cGVvZiBpbXBvcnQoJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9wcml2YXRlL21pZ3JhdGlvbnMnKSkge31cblxuICAvKiogTWlncmF0ZXMgYSBnaXZlbiBOZ01vZHVsZSBieSB3YWxraW5nIHRocm91Z2ggdGhlIHJlZmVyZW5jZWQgcHJvdmlkZXJzIGFuZCBzdGF0aWMgbWV0aG9kcy4gKi9cbiAgbWlncmF0ZU1vZHVsZShtb2R1bGU6IFJlc29sdmVkTmdNb2R1bGUpOiBBbmFseXNpc0ZhaWx1cmVbXSB7XG4gICAgcmV0dXJuIG1vZHVsZS5zdGF0aWNNZXRob2RzV2l0aG91dFR5cGUubWFwKHRoaXMuX21pZ3JhdGVTdGF0aWNOZ01vZHVsZU1ldGhvZC5iaW5kKHRoaXMpKVxuICAgICAgICAgICAgICAgLmZpbHRlcih2ID0+IHYpIGFzIEFuYWx5c2lzRmFpbHVyZVtdO1xuICB9XG5cbiAgLyoqIE1pZ3JhdGVzIGEgTW9kdWxlV2l0aFByb3ZpZGVycyB0eXBlIGRlZmluaXRpb24gdGhhdCBoYXMgbm8gZXhwbGljaXQgZ2VuZXJpYyB0eXBlICovXG4gIG1pZ3JhdGVUeXBlKHR5cGU6IHRzLlR5cGVSZWZlcmVuY2VOb2RlKTogQW5hbHlzaXNGYWlsdXJlW10ge1xuICAgIGNvbnN0IHBhcmVudCA9IHR5cGUucGFyZW50O1xuICAgIGxldCBtb2R1bGVUZXh0OiBzdHJpbmd8dW5kZWZpbmVkO1xuICAgIGlmICgodHMuaXNGdW5jdGlvbkRlY2xhcmF0aW9uKHBhcmVudCkgfHwgdHMuaXNNZXRob2REZWNsYXJhdGlvbihwYXJlbnQpKSAmJiBwYXJlbnQuYm9keSkge1xuICAgICAgY29uc3QgcmV0dXJuU3RhdGVtZW50ID0gcGFyZW50LmJvZHkuc3RhdGVtZW50cy5maW5kKHRzLmlzUmV0dXJuU3RhdGVtZW50KTtcblxuICAgICAgLy8gTm8gcmV0dXJuIHR5cGUgZm91bmQsIGV4aXRcbiAgICAgIGlmICghcmV0dXJuU3RhdGVtZW50IHx8ICFyZXR1cm5TdGF0ZW1lbnQuZXhwcmVzc2lvbikge1xuICAgICAgICByZXR1cm4gW3tub2RlOiBwYXJlbnQsIG1lc3NhZ2U6IGBSZXR1cm4gdHlwZSBpcyBub3Qgc3RhdGljYWxseSBhbmFseXphYmxlLmB9XTtcbiAgICAgIH1cblxuICAgICAgbW9kdWxlVGV4dCA9IHRoaXMuX2dldE5nTW9kdWxlVHlwZU9mRXhwcmVzc2lvbihyZXR1cm5TdGF0ZW1lbnQuZXhwcmVzc2lvbik7XG4gICAgfSBlbHNlIGlmICh0cy5pc1Byb3BlcnR5RGVjbGFyYXRpb24ocGFyZW50KSB8fCB0cy5pc1ZhcmlhYmxlRGVjbGFyYXRpb24ocGFyZW50KSkge1xuICAgICAgaWYgKCFwYXJlbnQuaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgYWRkVG9kb1RvTm9kZSh0eXBlLCBUT0RPX0NPTU1FTlQpO1xuICAgICAgICB0aGlzLl91cGRhdGVOb2RlKHR5cGUsIHR5cGUpO1xuICAgICAgICByZXR1cm4gW3tub2RlOiBwYXJlbnQsIG1lc3NhZ2U6IGBVbmFibGUgdG8gZGV0ZXJtaW5lIHR5cGUgZm9yIGRlY2xhcmF0aW9uLmB9XTtcbiAgICAgIH1cblxuICAgICAgbW9kdWxlVGV4dCA9IHRoaXMuX2dldE5nTW9kdWxlVHlwZU9mRXhwcmVzc2lvbihwYXJlbnQuaW5pdGlhbGl6ZXIpO1xuICAgIH1cblxuICAgIGlmIChtb2R1bGVUZXh0KSB7XG4gICAgICB0aGlzLl9hZGRHZW5lcmljVG9UeXBlUmVmZXJlbmNlKHR5cGUsIG1vZHVsZVRleHQpO1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIHJldHVybiBbe25vZGU6IHBhcmVudCwgbWVzc2FnZTogYFR5cGUgaXMgbm90IHN0YXRpY2FsbHkgYW5hbHl6YWJsZS5gfV07XG4gIH1cblxuICAvKiogQWRkIGEgZ2l2ZW4gZ2VuZXJpYyB0byBhIHR5cGUgcmVmZXJlbmNlIG5vZGUgKi9cbiAgcHJpdmF0ZSBfYWRkR2VuZXJpY1RvVHlwZVJlZmVyZW5jZShub2RlOiB0cy5UeXBlUmVmZXJlbmNlTm9kZSwgdHlwZU5hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IG5ld0dlbmVyaWNFeHByID0gY3JlYXRlTW9kdWxlV2l0aFByb3ZpZGVyc1R5cGUodHlwZU5hbWUsIG5vZGUpO1xuICAgIHRoaXMuX3VwZGF0ZU5vZGUobm9kZSwgbmV3R2VuZXJpY0V4cHIpO1xuICB9XG5cbiAgLyoqXG4gICAqIE1pZ3JhdGVzIGEgZ2l2ZW4gc3RhdGljIG1ldGhvZCBpZiBpdHMgTW9kdWxlV2l0aFByb3ZpZGVycyBkb2VzIG5vdCBwcm92aWRlXG4gICAqIGEgZ2VuZXJpYyB0eXBlLlxuICAgKi9cbiAgcHJpdmF0ZSBfdXBkYXRlU3RhdGljTWV0aG9kVHlwZShtZXRob2Q6IHRzLk1ldGhvZERlY2xhcmF0aW9uLCB0eXBlTmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgbmV3R2VuZXJpY0V4cHIgPVxuICAgICAgICBjcmVhdGVNb2R1bGVXaXRoUHJvdmlkZXJzVHlwZSh0eXBlTmFtZSwgbWV0aG9kLnR5cGUgYXMgdHMuVHlwZVJlZmVyZW5jZU5vZGUpO1xuICAgIGNvbnN0IG5ld01ldGhvZERlY2wgPSB0cy51cGRhdGVNZXRob2QoXG4gICAgICAgIG1ldGhvZCwgbWV0aG9kLmRlY29yYXRvcnMsIG1ldGhvZC5tb2RpZmllcnMsIG1ldGhvZC5hc3Rlcmlza1Rva2VuLCBtZXRob2QubmFtZSxcbiAgICAgICAgbWV0aG9kLnF1ZXN0aW9uVG9rZW4sIG1ldGhvZC50eXBlUGFyYW1ldGVycywgbWV0aG9kLnBhcmFtZXRlcnMsIG5ld0dlbmVyaWNFeHByLFxuICAgICAgICBtZXRob2QuYm9keSk7XG5cbiAgICB0aGlzLl91cGRhdGVOb2RlKG1ldGhvZCwgbmV3TWV0aG9kRGVjbCk7XG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgcmVzb2x2ZWQgdmFsdWUgbWFwIHJlcHJlc2VudHMgYSBNb2R1bGVXaXRoUHJvdmlkZXJzIG9iamVjdCAqL1xuICBpc01vZHVsZVdpdGhQcm92aWRlcnNUeXBlKHZhbHVlOiBSZXNvbHZlZFZhbHVlTWFwKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbmdNb2R1bGUgPSB2YWx1ZS5nZXQoJ25nTW9kdWxlJykgIT09IHVuZGVmaW5lZDtcbiAgICBjb25zdCBwcm92aWRlcnMgPSB2YWx1ZS5nZXQoJ3Byb3ZpZGVycycpICE9PSB1bmRlZmluZWQ7XG5cbiAgICByZXR1cm4gbmdNb2R1bGUgJiYgKHZhbHVlLnNpemUgPT09IDEgfHwgKHByb3ZpZGVycyAmJiB2YWx1ZS5zaXplID09PSAyKSk7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lIHRoZSBnZW5lcmljIHR5cGUgb2YgYSBzdXNwZWN0ZWQgTW9kdWxlV2l0aFByb3ZpZGVycyByZXR1cm4gdHlwZSBhbmQgYWRkIGl0XG4gICAqIGV4cGxpY2l0bHlcbiAgICovXG4gIHByaXZhdGUgX21pZ3JhdGVTdGF0aWNOZ01vZHVsZU1ldGhvZChub2RlOiB0cy5NZXRob2REZWNsYXJhdGlvbik6IEFuYWx5c2lzRmFpbHVyZXxudWxsIHtcbiAgICBjb25zdCByZXR1cm5TdGF0ZW1lbnQgPSBub2RlLmJvZHkgJiZcbiAgICAgICAgbm9kZS5ib2R5LnN0YXRlbWVudHMuZmluZChuID0+IHRzLmlzUmV0dXJuU3RhdGVtZW50KG4pKSBhcyB0cy5SZXR1cm5TdGF0ZW1lbnQgfCB1bmRlZmluZWQ7XG5cbiAgICAvLyBObyByZXR1cm4gdHlwZSBmb3VuZCwgZXhpdFxuICAgIGlmICghcmV0dXJuU3RhdGVtZW50IHx8ICFyZXR1cm5TdGF0ZW1lbnQuZXhwcmVzc2lvbikge1xuICAgICAgcmV0dXJuIHtub2RlOiBub2RlLCBtZXNzYWdlOiBgUmV0dXJuIHR5cGUgaXMgbm90IHN0YXRpY2FsbHkgYW5hbHl6YWJsZS5gfTtcbiAgICB9XG5cbiAgICBjb25zdCBtb2R1bGVUZXh0ID0gdGhpcy5fZ2V0TmdNb2R1bGVUeXBlT2ZFeHByZXNzaW9uKHJldHVyblN0YXRlbWVudC5leHByZXNzaW9uKTtcblxuICAgIGlmIChtb2R1bGVUZXh0KSB7XG4gICAgICB0aGlzLl91cGRhdGVTdGF0aWNNZXRob2RUeXBlKG5vZGUsIG1vZHVsZVRleHQpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtub2RlOiBub2RlLCBtZXNzYWdlOiBgTWV0aG9kIHR5cGUgaXMgbm90IHN0YXRpY2FsbHkgYW5hbHl6YWJsZS5gfTtcbiAgfVxuXG4gIC8qKiBFdmFsdWF0ZSBhbmQgcmV0dXJuIHRoZSBuZ01vZHVsZSB0eXBlIGZyb20gYW4gZXhwcmVzc2lvbiAqL1xuICBwcml2YXRlIF9nZXROZ01vZHVsZVR5cGVPZkV4cHJlc3Npb24oZXhwcjogdHMuRXhwcmVzc2lvbik6IHN0cmluZ3x1bmRlZmluZWQge1xuICAgIGNvbnN0IGV2YWx1YXRlZEV4cHIgPSB0aGlzLnBhcnRpYWxFdmFsdWF0b3IuZXZhbHVhdGUoZXhwcik7XG4gICAgcmV0dXJuIHRoaXMuX2dldFR5cGVPZlJlc29sdmVkVmFsdWUoZXZhbHVhdGVkRXhwcik7XG4gIH1cblxuICAvKipcbiAgICogVmlzaXRzIGEgZ2l2ZW4gb2JqZWN0IGxpdGVyYWwgZXhwcmVzc2lvbiB0byBkZXRlcm1pbmUgdGhlIG5nTW9kdWxlIHR5cGUuIElmIHRoZSBleHByZXNzaW9uXG4gICAqIGNhbm5vdCBiZSByZXNvbHZlZCwgYWRkIGEgVE9ETyB0byBhbGVydCB0aGUgdXNlci5cbiAgICovXG4gIHByaXZhdGUgX2dldFR5cGVPZlJlc29sdmVkVmFsdWUodmFsdWU6IFJlc29sdmVkVmFsdWUpOiBzdHJpbmd8dW5kZWZpbmVkIHtcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBNYXAgJiYgdGhpcy5pc01vZHVsZVdpdGhQcm92aWRlcnNUeXBlKHZhbHVlKSkge1xuICAgICAgY29uc3QgbWFwVmFsdWUgPSB2YWx1ZS5nZXQoJ25nTW9kdWxlJykhO1xuICAgICAgaWYgKG1hcFZhbHVlIGluc3RhbmNlb2YgdGhpcy5jb21waWxlckNsaU1pZ3JhdGlvbnNNb2R1bGUuUmVmZXJlbmNlICYmXG4gICAgICAgICAgdHMuaXNDbGFzc0RlY2xhcmF0aW9uKG1hcFZhbHVlLm5vZGUpICYmIG1hcFZhbHVlLm5vZGUubmFtZSkge1xuICAgICAgICByZXR1cm4gbWFwVmFsdWUubm9kZS5uYW1lLnRleHQ7XG4gICAgICB9IGVsc2UgaWYgKG1hcFZhbHVlIGluc3RhbmNlb2YgdGhpcy5jb21waWxlckNsaU1pZ3JhdGlvbnNNb2R1bGUuRHluYW1pY1ZhbHVlKSB7XG4gICAgICAgIGFkZFRvZG9Ub05vZGUobWFwVmFsdWUubm9kZSwgVE9ET19DT01NRU5UKTtcbiAgICAgICAgdGhpcy5fdXBkYXRlTm9kZShtYXBWYWx1ZS5ub2RlLCBtYXBWYWx1ZS5ub2RlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgcHJpdmF0ZSBfdXBkYXRlTm9kZShub2RlOiB0cy5Ob2RlLCBuZXdOb2RlOiB0cy5Ob2RlKSB7XG4gICAgY29uc3QgbmV3VGV4dCA9IHRoaXMucHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIG5ld05vZGUsIG5vZGUuZ2V0U291cmNlRmlsZSgpKTtcbiAgICBjb25zdCByZWNvcmRlciA9IHRoaXMuZ2V0VXBkYXRlUmVjb3JkZXIobm9kZS5nZXRTb3VyY2VGaWxlKCkpO1xuXG4gICAgcmVjb3JkZXIucmVtb3ZlKG5vZGUuZ2V0U3RhcnQoKSwgbm9kZS5nZXRXaWR0aCgpKTtcbiAgICByZWNvcmRlci5pbnNlcnRSaWdodChub2RlLmdldFN0YXJ0KCksIG5ld1RleHQpO1xuICB9XG59XG5cbi8qKlxuICogQWRkcyBhIHRvLWRvIHRvIHRoZSBnaXZlbiBUeXBlU2NyaXB0IG5vZGUgd2hpY2ggYWxlcnRzIGRldmVsb3BlcnMgdG8gZml4XG4gKiBwb3RlbnRpYWwgaXNzdWVzIGlkZW50aWZpZWQgYnkgdGhlIG1pZ3JhdGlvbi5cbiAqL1xuZnVuY3Rpb24gYWRkVG9kb1RvTm9kZShub2RlOiB0cy5Ob2RlLCB0ZXh0OiBzdHJpbmcpIHtcbiAgdHMuc2V0U3ludGhldGljTGVhZGluZ0NvbW1lbnRzKG5vZGUsIFt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvczogLTEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZDogLTEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc1RyYWlsaW5nTmV3TGluZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtpbmQ6IHRzLlN5bnRheEtpbmQuTXVsdGlMaW5lQ29tbWVudFRyaXZpYSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogYCAke3RleHR9IGBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1dKTtcbn1cbiJdfQ==