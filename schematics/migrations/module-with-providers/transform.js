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
        define("@angular/core/schematics/migrations/module-with-providers/transform", ["require", "exports", "@angular/compiler-cli/src/ngtsc/imports", "@angular/compiler-cli/src/ngtsc/partial_evaluator", "@angular/compiler-cli/src/ngtsc/reflection", "typescript", "@angular/core/schematics/migrations/module-with-providers/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ModuleWithProvidersTransform = void 0;
    const imports_1 = require("@angular/compiler-cli/src/ngtsc/imports");
    const partial_evaluator_1 = require("@angular/compiler-cli/src/ngtsc/partial_evaluator");
    const reflection_1 = require("@angular/compiler-cli/src/ngtsc/reflection");
    const ts = require("typescript");
    const util_1 = require("@angular/core/schematics/migrations/module-with-providers/util");
    const TODO_COMMENT = 'TODO: The following node requires a generic type for `ModuleWithProviders`';
    class ModuleWithProvidersTransform {
        constructor(typeChecker, getUpdateRecorder) {
            this.typeChecker = typeChecker;
            this.getUpdateRecorder = getUpdateRecorder;
            this.printer = ts.createPrinter();
            this.partialEvaluator = new partial_evaluator_1.PartialEvaluator(new reflection_1.TypeScriptReflectionHost(this.typeChecker), this.typeChecker, 
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
            if ((ts.isFunctionDeclaration(parent) || ts.isMethodDeclaration(parent)) && parent.body) {
                const returnStatement = parent.body.statements.find(ts.isReturnStatement);
                // No return type found, exit
                if (!returnStatement || !returnStatement.expression) {
                    return [{ node: parent, message: `Return type is not statically analyzable.` }];
                }
                moduleText = this._getNgModuleTypeOfExpression(returnStatement.expression);
            }
            else if (ts.isPropertyDeclaration(parent) || ts.isVariableDeclaration(parent)) {
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
            const newMethodDecl = ts.updateMethod(method, method.decorators, method.modifiers, method.asteriskToken, method.name, method.questionToken, method.typeParameters, method.parameters, newGenericExpr, method.body);
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
                node.body.statements.find(n => ts.isReturnStatement(n));
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
                if (mapValue instanceof imports_1.Reference && ts.isClassDeclaration(mapValue.node) &&
                    mapValue.node.name) {
                    return mapValue.node.name.text;
                }
                else if (mapValue instanceof partial_evaluator_1.DynamicValue) {
                    addTodoToNode(mapValue.node, TODO_COMMENT);
                    this._updateNode(mapValue.node, mapValue.node);
                }
            }
            return undefined;
        }
        _updateNode(node, newNode) {
            const newText = this.printer.printNode(ts.EmitHint.Unspecified, newNode, node.getSourceFile());
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
        ts.setSyntheticLeadingComments(node, [{
                pos: -1,
                end: -1,
                hasTrailingNewLine: false,
                kind: ts.SyntaxKind.MultiLineCommentTrivia,
                text: ` ${text} `
            }]);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvbW9kdWxlLXdpdGgtcHJvdmlkZXJzL3RyYW5zZm9ybS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFHSCxxRUFBa0U7SUFDbEUseUZBQWtJO0lBQ2xJLDJFQUFvRjtJQUNwRixpQ0FBaUM7SUFHakMseUZBQXFEO0lBT3JELE1BQU0sWUFBWSxHQUFHLDRFQUE0RSxDQUFDO0lBRWxHLE1BQWEsNEJBQTRCO1FBTXZDLFlBQ1ksV0FBMkIsRUFDM0IsaUJBQXdEO1lBRHhELGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQUMzQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQXVDO1lBUDVELFlBQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDN0IscUJBQWdCLEdBQXFCLElBQUksb0NBQWdCLENBQzdELElBQUkscUNBQXdCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLElBQUksQ0FBQyxXQUFXO1lBQ2hFLHVCQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDO1FBSXFDLENBQUM7UUFFeEUsZ0dBQWdHO1FBQ2hHLGFBQWEsQ0FBQyxNQUF3QjtZQUNwQyxPQUFPLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDNUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFzQixDQUFDO1FBQ2xELENBQUM7UUFFRCx1RkFBdUY7UUFDdkYsV0FBVyxDQUFDLElBQTBCO1lBQ3BDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDM0IsSUFBSSxVQUE0QixDQUFDO1lBQ2pDLElBQUksQ0FBQyxFQUFF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RUFBRSxDQUFDLENBQUM7Z0JBQ1Asa0JBQWtCLEVBQUUsS0FBSztnQkFDekIsSUFBSSxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsc0JBQXNCO2dCQUMxQyxJQUFJLEVBQUUsSUFBSSxJQUFJLEdBQUc7YUFDbEIsQ0FBQyxDQUFDLENBQUM7SUFDckMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1VwZGF0ZVJlY29yZGVyfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge1JlZmVyZW5jZX0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpL3NyYy9uZ3RzYy9pbXBvcnRzJztcbmltcG9ydCB7RHluYW1pY1ZhbHVlLCBQYXJ0aWFsRXZhbHVhdG9yLCBSZXNvbHZlZFZhbHVlLCBSZXNvbHZlZFZhbHVlTWFwfSBmcm9tICdAYW5ndWxhci9jb21waWxlci1jbGkvc3JjL25ndHNjL3BhcnRpYWxfZXZhbHVhdG9yJztcbmltcG9ydCB7VHlwZVNjcmlwdFJlZmxlY3Rpb25Ib3N0fSBmcm9tICdAYW5ndWxhci9jb21waWxlci1jbGkvc3JjL25ndHNjL3JlZmxlY3Rpb24nO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7UmVzb2x2ZWROZ01vZHVsZX0gZnJvbSAnLi9jb2xsZWN0b3InO1xuaW1wb3J0IHtjcmVhdGVNb2R1bGVXaXRoUHJvdmlkZXJzVHlwZX0gZnJvbSAnLi91dGlsJztcblxuZXhwb3J0IGludGVyZmFjZSBBbmFseXNpc0ZhaWx1cmUge1xuICBub2RlOiB0cy5Ob2RlO1xuICBtZXNzYWdlOiBzdHJpbmc7XG59XG5cbmNvbnN0IFRPRE9fQ09NTUVOVCA9ICdUT0RPOiBUaGUgZm9sbG93aW5nIG5vZGUgcmVxdWlyZXMgYSBnZW5lcmljIHR5cGUgZm9yIGBNb2R1bGVXaXRoUHJvdmlkZXJzYCc7XG5cbmV4cG9ydCBjbGFzcyBNb2R1bGVXaXRoUHJvdmlkZXJzVHJhbnNmb3JtIHtcbiAgcHJpdmF0ZSBwcmludGVyID0gdHMuY3JlYXRlUHJpbnRlcigpO1xuICBwcml2YXRlIHBhcnRpYWxFdmFsdWF0b3I6IFBhcnRpYWxFdmFsdWF0b3IgPSBuZXcgUGFydGlhbEV2YWx1YXRvcihcbiAgICAgIG5ldyBUeXBlU2NyaXB0UmVmbGVjdGlvbkhvc3QodGhpcy50eXBlQ2hlY2tlciksIHRoaXMudHlwZUNoZWNrZXIsXG4gICAgICAvKiBkZXBlbmRlbmN5VHJhY2tlciAqLyBudWxsKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLFxuICAgICAgcHJpdmF0ZSBnZXRVcGRhdGVSZWNvcmRlcjogKHNmOiB0cy5Tb3VyY2VGaWxlKSA9PiBVcGRhdGVSZWNvcmRlcikge31cblxuICAvKiogTWlncmF0ZXMgYSBnaXZlbiBOZ01vZHVsZSBieSB3YWxraW5nIHRocm91Z2ggdGhlIHJlZmVyZW5jZWQgcHJvdmlkZXJzIGFuZCBzdGF0aWMgbWV0aG9kcy4gKi9cbiAgbWlncmF0ZU1vZHVsZShtb2R1bGU6IFJlc29sdmVkTmdNb2R1bGUpOiBBbmFseXNpc0ZhaWx1cmVbXSB7XG4gICAgcmV0dXJuIG1vZHVsZS5zdGF0aWNNZXRob2RzV2l0aG91dFR5cGUubWFwKHRoaXMuX21pZ3JhdGVTdGF0aWNOZ01vZHVsZU1ldGhvZC5iaW5kKHRoaXMpKVxuICAgICAgICAgICAgICAgLmZpbHRlcih2ID0+IHYpIGFzIEFuYWx5c2lzRmFpbHVyZVtdO1xuICB9XG5cbiAgLyoqIE1pZ3JhdGVzIGEgTW9kdWxlV2l0aFByb3ZpZGVycyB0eXBlIGRlZmluaXRpb24gdGhhdCBoYXMgbm8gZXhwbGljaXQgZ2VuZXJpYyB0eXBlICovXG4gIG1pZ3JhdGVUeXBlKHR5cGU6IHRzLlR5cGVSZWZlcmVuY2VOb2RlKTogQW5hbHlzaXNGYWlsdXJlW10ge1xuICAgIGNvbnN0IHBhcmVudCA9IHR5cGUucGFyZW50O1xuICAgIGxldCBtb2R1bGVUZXh0OiBzdHJpbmd8dW5kZWZpbmVkO1xuICAgIGlmICgodHMuaXNGdW5jdGlvbkRlY2xhcmF0aW9uKHBhcmVudCkgfHwgdHMuaXNNZXRob2REZWNsYXJhdGlvbihwYXJlbnQpKSAmJiBwYXJlbnQuYm9keSkge1xuICAgICAgY29uc3QgcmV0dXJuU3RhdGVtZW50ID0gcGFyZW50LmJvZHkuc3RhdGVtZW50cy5maW5kKHRzLmlzUmV0dXJuU3RhdGVtZW50KTtcblxuICAgICAgLy8gTm8gcmV0dXJuIHR5cGUgZm91bmQsIGV4aXRcbiAgICAgIGlmICghcmV0dXJuU3RhdGVtZW50IHx8ICFyZXR1cm5TdGF0ZW1lbnQuZXhwcmVzc2lvbikge1xuICAgICAgICByZXR1cm4gW3tub2RlOiBwYXJlbnQsIG1lc3NhZ2U6IGBSZXR1cm4gdHlwZSBpcyBub3Qgc3RhdGljYWxseSBhbmFseXphYmxlLmB9XTtcbiAgICAgIH1cblxuICAgICAgbW9kdWxlVGV4dCA9IHRoaXMuX2dldE5nTW9kdWxlVHlwZU9mRXhwcmVzc2lvbihyZXR1cm5TdGF0ZW1lbnQuZXhwcmVzc2lvbik7XG4gICAgfSBlbHNlIGlmICh0cy5pc1Byb3BlcnR5RGVjbGFyYXRpb24ocGFyZW50KSB8fCB0cy5pc1ZhcmlhYmxlRGVjbGFyYXRpb24ocGFyZW50KSkge1xuICAgICAgaWYgKCFwYXJlbnQuaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgYWRkVG9kb1RvTm9kZSh0eXBlLCBUT0RPX0NPTU1FTlQpO1xuICAgICAgICB0aGlzLl91cGRhdGVOb2RlKHR5cGUsIHR5cGUpO1xuICAgICAgICByZXR1cm4gW3tub2RlOiBwYXJlbnQsIG1lc3NhZ2U6IGBVbmFibGUgdG8gZGV0ZXJtaW5lIHR5cGUgZm9yIGRlY2xhcmF0aW9uLmB9XTtcbiAgICAgIH1cblxuICAgICAgbW9kdWxlVGV4dCA9IHRoaXMuX2dldE5nTW9kdWxlVHlwZU9mRXhwcmVzc2lvbihwYXJlbnQuaW5pdGlhbGl6ZXIpO1xuICAgIH1cblxuICAgIGlmIChtb2R1bGVUZXh0KSB7XG4gICAgICB0aGlzLl9hZGRHZW5lcmljVG9UeXBlUmVmZXJlbmNlKHR5cGUsIG1vZHVsZVRleHQpO1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIHJldHVybiBbe25vZGU6IHBhcmVudCwgbWVzc2FnZTogYFR5cGUgaXMgbm90IHN0YXRpY2FsbHkgYW5hbHl6YWJsZS5gfV07XG4gIH1cblxuICAvKiogQWRkIGEgZ2l2ZW4gZ2VuZXJpYyB0byBhIHR5cGUgcmVmZXJlbmNlIG5vZGUgKi9cbiAgcHJpdmF0ZSBfYWRkR2VuZXJpY1RvVHlwZVJlZmVyZW5jZShub2RlOiB0cy5UeXBlUmVmZXJlbmNlTm9kZSwgdHlwZU5hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IG5ld0dlbmVyaWNFeHByID0gY3JlYXRlTW9kdWxlV2l0aFByb3ZpZGVyc1R5cGUodHlwZU5hbWUsIG5vZGUpO1xuICAgIHRoaXMuX3VwZGF0ZU5vZGUobm9kZSwgbmV3R2VuZXJpY0V4cHIpO1xuICB9XG5cbiAgLyoqXG4gICAqIE1pZ3JhdGVzIGEgZ2l2ZW4gc3RhdGljIG1ldGhvZCBpZiBpdHMgTW9kdWxlV2l0aFByb3ZpZGVycyBkb2VzIG5vdCBwcm92aWRlXG4gICAqIGEgZ2VuZXJpYyB0eXBlLlxuICAgKi9cbiAgcHJpdmF0ZSBfdXBkYXRlU3RhdGljTWV0aG9kVHlwZShtZXRob2Q6IHRzLk1ldGhvZERlY2xhcmF0aW9uLCB0eXBlTmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgbmV3R2VuZXJpY0V4cHIgPVxuICAgICAgICBjcmVhdGVNb2R1bGVXaXRoUHJvdmlkZXJzVHlwZSh0eXBlTmFtZSwgbWV0aG9kLnR5cGUgYXMgdHMuVHlwZVJlZmVyZW5jZU5vZGUpO1xuICAgIGNvbnN0IG5ld01ldGhvZERlY2wgPSB0cy51cGRhdGVNZXRob2QoXG4gICAgICAgIG1ldGhvZCwgbWV0aG9kLmRlY29yYXRvcnMsIG1ldGhvZC5tb2RpZmllcnMsIG1ldGhvZC5hc3Rlcmlza1Rva2VuLCBtZXRob2QubmFtZSxcbiAgICAgICAgbWV0aG9kLnF1ZXN0aW9uVG9rZW4sIG1ldGhvZC50eXBlUGFyYW1ldGVycywgbWV0aG9kLnBhcmFtZXRlcnMsIG5ld0dlbmVyaWNFeHByLFxuICAgICAgICBtZXRob2QuYm9keSk7XG5cbiAgICB0aGlzLl91cGRhdGVOb2RlKG1ldGhvZCwgbmV3TWV0aG9kRGVjbCk7XG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgcmVzb2x2ZWQgdmFsdWUgbWFwIHJlcHJlc2VudHMgYSBNb2R1bGVXaXRoUHJvdmlkZXJzIG9iamVjdCAqL1xuICBpc01vZHVsZVdpdGhQcm92aWRlcnNUeXBlKHZhbHVlOiBSZXNvbHZlZFZhbHVlTWFwKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbmdNb2R1bGUgPSB2YWx1ZS5nZXQoJ25nTW9kdWxlJykgIT09IHVuZGVmaW5lZDtcbiAgICBjb25zdCBwcm92aWRlcnMgPSB2YWx1ZS5nZXQoJ3Byb3ZpZGVycycpICE9PSB1bmRlZmluZWQ7XG5cbiAgICByZXR1cm4gbmdNb2R1bGUgJiYgKHZhbHVlLnNpemUgPT09IDEgfHwgKHByb3ZpZGVycyAmJiB2YWx1ZS5zaXplID09PSAyKSk7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lIHRoZSBnZW5lcmljIHR5cGUgb2YgYSBzdXNwZWN0ZWQgTW9kdWxlV2l0aFByb3ZpZGVycyByZXR1cm4gdHlwZSBhbmQgYWRkIGl0XG4gICAqIGV4cGxpY2l0bHlcbiAgICovXG4gIHByaXZhdGUgX21pZ3JhdGVTdGF0aWNOZ01vZHVsZU1ldGhvZChub2RlOiB0cy5NZXRob2REZWNsYXJhdGlvbik6IEFuYWx5c2lzRmFpbHVyZXxudWxsIHtcbiAgICBjb25zdCByZXR1cm5TdGF0ZW1lbnQgPSBub2RlLmJvZHkgJiZcbiAgICAgICAgbm9kZS5ib2R5LnN0YXRlbWVudHMuZmluZChuID0+IHRzLmlzUmV0dXJuU3RhdGVtZW50KG4pKSBhcyB0cy5SZXR1cm5TdGF0ZW1lbnQgfCB1bmRlZmluZWQ7XG5cbiAgICAvLyBObyByZXR1cm4gdHlwZSBmb3VuZCwgZXhpdFxuICAgIGlmICghcmV0dXJuU3RhdGVtZW50IHx8ICFyZXR1cm5TdGF0ZW1lbnQuZXhwcmVzc2lvbikge1xuICAgICAgcmV0dXJuIHtub2RlOiBub2RlLCBtZXNzYWdlOiBgUmV0dXJuIHR5cGUgaXMgbm90IHN0YXRpY2FsbHkgYW5hbHl6YWJsZS5gfTtcbiAgICB9XG5cbiAgICBjb25zdCBtb2R1bGVUZXh0ID0gdGhpcy5fZ2V0TmdNb2R1bGVUeXBlT2ZFeHByZXNzaW9uKHJldHVyblN0YXRlbWVudC5leHByZXNzaW9uKTtcblxuICAgIGlmIChtb2R1bGVUZXh0KSB7XG4gICAgICB0aGlzLl91cGRhdGVTdGF0aWNNZXRob2RUeXBlKG5vZGUsIG1vZHVsZVRleHQpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtub2RlOiBub2RlLCBtZXNzYWdlOiBgTWV0aG9kIHR5cGUgaXMgbm90IHN0YXRpY2FsbHkgYW5hbHl6YWJsZS5gfTtcbiAgfVxuXG4gIC8qKiBFdmFsdWF0ZSBhbmQgcmV0dXJuIHRoZSBuZ01vZHVsZSB0eXBlIGZyb20gYW4gZXhwcmVzc2lvbiAqL1xuICBwcml2YXRlIF9nZXROZ01vZHVsZVR5cGVPZkV4cHJlc3Npb24oZXhwcjogdHMuRXhwcmVzc2lvbik6IHN0cmluZ3x1bmRlZmluZWQge1xuICAgIGNvbnN0IGV2YWx1YXRlZEV4cHIgPSB0aGlzLnBhcnRpYWxFdmFsdWF0b3IuZXZhbHVhdGUoZXhwcik7XG4gICAgcmV0dXJuIHRoaXMuX2dldFR5cGVPZlJlc29sdmVkVmFsdWUoZXZhbHVhdGVkRXhwcik7XG4gIH1cblxuICAvKipcbiAgICogVmlzaXRzIGEgZ2l2ZW4gb2JqZWN0IGxpdGVyYWwgZXhwcmVzc2lvbiB0byBkZXRlcm1pbmUgdGhlIG5nTW9kdWxlIHR5cGUuIElmIHRoZSBleHByZXNzaW9uXG4gICAqIGNhbm5vdCBiZSByZXNvbHZlZCwgYWRkIGEgVE9ETyB0byBhbGVydCB0aGUgdXNlci5cbiAgICovXG4gIHByaXZhdGUgX2dldFR5cGVPZlJlc29sdmVkVmFsdWUodmFsdWU6IFJlc29sdmVkVmFsdWUpOiBzdHJpbmd8dW5kZWZpbmVkIHtcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBNYXAgJiYgdGhpcy5pc01vZHVsZVdpdGhQcm92aWRlcnNUeXBlKHZhbHVlKSkge1xuICAgICAgY29uc3QgbWFwVmFsdWUgPSB2YWx1ZS5nZXQoJ25nTW9kdWxlJykhO1xuICAgICAgaWYgKG1hcFZhbHVlIGluc3RhbmNlb2YgUmVmZXJlbmNlICYmIHRzLmlzQ2xhc3NEZWNsYXJhdGlvbihtYXBWYWx1ZS5ub2RlKSAmJlxuICAgICAgICAgIG1hcFZhbHVlLm5vZGUubmFtZSkge1xuICAgICAgICByZXR1cm4gbWFwVmFsdWUubm9kZS5uYW1lLnRleHQ7XG4gICAgICB9IGVsc2UgaWYgKG1hcFZhbHVlIGluc3RhbmNlb2YgRHluYW1pY1ZhbHVlKSB7XG4gICAgICAgIGFkZFRvZG9Ub05vZGUobWFwVmFsdWUubm9kZSwgVE9ET19DT01NRU5UKTtcbiAgICAgICAgdGhpcy5fdXBkYXRlTm9kZShtYXBWYWx1ZS5ub2RlLCBtYXBWYWx1ZS5ub2RlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgcHJpdmF0ZSBfdXBkYXRlTm9kZShub2RlOiB0cy5Ob2RlLCBuZXdOb2RlOiB0cy5Ob2RlKSB7XG4gICAgY29uc3QgbmV3VGV4dCA9IHRoaXMucHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIG5ld05vZGUsIG5vZGUuZ2V0U291cmNlRmlsZSgpKTtcbiAgICBjb25zdCByZWNvcmRlciA9IHRoaXMuZ2V0VXBkYXRlUmVjb3JkZXIobm9kZS5nZXRTb3VyY2VGaWxlKCkpO1xuXG4gICAgcmVjb3JkZXIucmVtb3ZlKG5vZGUuZ2V0U3RhcnQoKSwgbm9kZS5nZXRXaWR0aCgpKTtcbiAgICByZWNvcmRlci5pbnNlcnRSaWdodChub2RlLmdldFN0YXJ0KCksIG5ld1RleHQpO1xuICB9XG59XG5cbi8qKlxuICogQWRkcyBhIHRvLWRvIHRvIHRoZSBnaXZlbiBUeXBlU2NyaXB0IG5vZGUgd2hpY2ggYWxlcnRzIGRldmVsb3BlcnMgdG8gZml4XG4gKiBwb3RlbnRpYWwgaXNzdWVzIGlkZW50aWZpZWQgYnkgdGhlIG1pZ3JhdGlvbi5cbiAqL1xuZnVuY3Rpb24gYWRkVG9kb1RvTm9kZShub2RlOiB0cy5Ob2RlLCB0ZXh0OiBzdHJpbmcpIHtcbiAgdHMuc2V0U3ludGhldGljTGVhZGluZ0NvbW1lbnRzKG5vZGUsIFt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvczogLTEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZDogLTEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc1RyYWlsaW5nTmV3TGluZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtpbmQ6IHRzLlN5bnRheEtpbmQuTXVsdGlMaW5lQ29tbWVudFRyaXZpYSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogYCAke3RleHR9IGBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1dKTtcbn1cbiJdfQ==