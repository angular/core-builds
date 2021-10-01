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
        define("@angular/core/schematics/migrations/module-with-providers/transform", ["require", "exports", "@angular/compiler-cli/private/migrations", "typescript", "@angular/core/schematics/migrations/module-with-providers/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ModuleWithProvidersTransform = void 0;
    const migrations_1 = require("@angular/compiler-cli/private/migrations");
    const typescript_1 = __importDefault(require("typescript"));
    const util_1 = require("@angular/core/schematics/migrations/module-with-providers/util");
    const TODO_COMMENT = 'TODO: The following node requires a generic type for `ModuleWithProviders`';
    class ModuleWithProvidersTransform {
        constructor(typeChecker, getUpdateRecorder) {
            this.typeChecker = typeChecker;
            this.getUpdateRecorder = getUpdateRecorder;
            this.printer = typescript_1.default.createPrinter();
            this.partialEvaluator = new migrations_1.PartialEvaluator(new migrations_1.TypeScriptReflectionHost(this.typeChecker), this.typeChecker, 
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
                if (mapValue instanceof migrations_1.Reference && typescript_1.default.isClassDeclaration(mapValue.node) &&
                    mapValue.node.name) {
                    return mapValue.node.name.text;
                }
                else if (mapValue instanceof migrations_1.DynamicValue) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvbW9kdWxlLXdpdGgtcHJvdmlkZXJzL3RyYW5zZm9ybS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7SUFHSCx5RUFBOEo7SUFDOUosNERBQTRCO0lBRzVCLHlGQUFxRDtJQU9yRCxNQUFNLFlBQVksR0FBRyw0RUFBNEUsQ0FBQztJQUVsRyxNQUFhLDRCQUE0QjtRQU12QyxZQUNZLFdBQTJCLEVBQzNCLGlCQUF3RDtZQUR4RCxnQkFBVyxHQUFYLFdBQVcsQ0FBZ0I7WUFDM0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUF1QztZQVA1RCxZQUFPLEdBQUcsb0JBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUM3QixxQkFBZ0IsR0FBcUIsSUFBSSw2QkFBZ0IsQ0FDN0QsSUFBSSxxQ0FBd0IsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsSUFBSSxDQUFDLFdBQVc7WUFDaEUsdUJBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFJcUMsQ0FBQztRQUV4RSxnR0FBZ0c7UUFDaEcsYUFBYSxDQUFDLE1BQXdCO1lBQ3BDLE9BQU8sTUFBTSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsNEJBQTRCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUM1RSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQXNCLENBQUM7UUFDbEQsQ0FBQztRQUVELHVGQUF1RjtRQUN2RixXQUFXLENBQUMsSUFBMEI7WUFDcEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUMzQixJQUFJLFVBQTRCLENBQUM7WUFDakMsSUFBSSxDQUFDLG9CQUFFLENBQUMscUJBQXFCLENBQUMsTUFB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QUM7Z0JBQ1Asa0JBQWtCLEVBQUUsS0FBSztnQkFDekIsSUFBSSxFQUFFLG9CQUFFLENBQUMsVUFBVSxDQUFDLHNCQUFzQjtnQkFDMUMsSUFBSSxFQUFFLElBQUksSUFBSSxHQUFHO2FBQ2xCLENBQUMsQ0FBQyxDQUFDO0lBQ3JDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtVcGRhdGVSZWNvcmRlcn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtEeW5hbWljVmFsdWUsIFBhcnRpYWxFdmFsdWF0b3IsIFJlZmVyZW5jZSwgUmVzb2x2ZWRWYWx1ZSwgUmVzb2x2ZWRWYWx1ZU1hcCwgVHlwZVNjcmlwdFJlZmxlY3Rpb25Ib3N0fSBmcm9tICdAYW5ndWxhci9jb21waWxlci1jbGkvcHJpdmF0ZS9taWdyYXRpb25zJztcbmltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtSZXNvbHZlZE5nTW9kdWxlfSBmcm9tICcuL2NvbGxlY3Rvcic7XG5pbXBvcnQge2NyZWF0ZU1vZHVsZVdpdGhQcm92aWRlcnNUeXBlfSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFuYWx5c2lzRmFpbHVyZSB7XG4gIG5vZGU6IHRzLk5vZGU7XG4gIG1lc3NhZ2U6IHN0cmluZztcbn1cblxuY29uc3QgVE9ET19DT01NRU5UID0gJ1RPRE86IFRoZSBmb2xsb3dpbmcgbm9kZSByZXF1aXJlcyBhIGdlbmVyaWMgdHlwZSBmb3IgYE1vZHVsZVdpdGhQcm92aWRlcnNgJztcblxuZXhwb3J0IGNsYXNzIE1vZHVsZVdpdGhQcm92aWRlcnNUcmFuc2Zvcm0ge1xuICBwcml2YXRlIHByaW50ZXIgPSB0cy5jcmVhdGVQcmludGVyKCk7XG4gIHByaXZhdGUgcGFydGlhbEV2YWx1YXRvcjogUGFydGlhbEV2YWx1YXRvciA9IG5ldyBQYXJ0aWFsRXZhbHVhdG9yKFxuICAgICAgbmV3IFR5cGVTY3JpcHRSZWZsZWN0aW9uSG9zdCh0aGlzLnR5cGVDaGVja2VyKSwgdGhpcy50eXBlQ2hlY2tlcixcbiAgICAgIC8qIGRlcGVuZGVuY3lUcmFja2VyICovIG51bGwpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsXG4gICAgICBwcml2YXRlIGdldFVwZGF0ZVJlY29yZGVyOiAoc2Y6IHRzLlNvdXJjZUZpbGUpID0+IFVwZGF0ZVJlY29yZGVyKSB7fVxuXG4gIC8qKiBNaWdyYXRlcyBhIGdpdmVuIE5nTW9kdWxlIGJ5IHdhbGtpbmcgdGhyb3VnaCB0aGUgcmVmZXJlbmNlZCBwcm92aWRlcnMgYW5kIHN0YXRpYyBtZXRob2RzLiAqL1xuICBtaWdyYXRlTW9kdWxlKG1vZHVsZTogUmVzb2x2ZWROZ01vZHVsZSk6IEFuYWx5c2lzRmFpbHVyZVtdIHtcbiAgICByZXR1cm4gbW9kdWxlLnN0YXRpY01ldGhvZHNXaXRob3V0VHlwZS5tYXAodGhpcy5fbWlncmF0ZVN0YXRpY05nTW9kdWxlTWV0aG9kLmJpbmQodGhpcykpXG4gICAgICAgICAgICAgICAuZmlsdGVyKHYgPT4gdikgYXMgQW5hbHlzaXNGYWlsdXJlW107XG4gIH1cblxuICAvKiogTWlncmF0ZXMgYSBNb2R1bGVXaXRoUHJvdmlkZXJzIHR5cGUgZGVmaW5pdGlvbiB0aGF0IGhhcyBubyBleHBsaWNpdCBnZW5lcmljIHR5cGUgKi9cbiAgbWlncmF0ZVR5cGUodHlwZTogdHMuVHlwZVJlZmVyZW5jZU5vZGUpOiBBbmFseXNpc0ZhaWx1cmVbXSB7XG4gICAgY29uc3QgcGFyZW50ID0gdHlwZS5wYXJlbnQ7XG4gICAgbGV0IG1vZHVsZVRleHQ6IHN0cmluZ3x1bmRlZmluZWQ7XG4gICAgaWYgKCh0cy5pc0Z1bmN0aW9uRGVjbGFyYXRpb24ocGFyZW50KSB8fCB0cy5pc01ldGhvZERlY2xhcmF0aW9uKHBhcmVudCkpICYmIHBhcmVudC5ib2R5KSB7XG4gICAgICBjb25zdCByZXR1cm5TdGF0ZW1lbnQgPSBwYXJlbnQuYm9keS5zdGF0ZW1lbnRzLmZpbmQodHMuaXNSZXR1cm5TdGF0ZW1lbnQpO1xuXG4gICAgICAvLyBObyByZXR1cm4gdHlwZSBmb3VuZCwgZXhpdFxuICAgICAgaWYgKCFyZXR1cm5TdGF0ZW1lbnQgfHwgIXJldHVyblN0YXRlbWVudC5leHByZXNzaW9uKSB7XG4gICAgICAgIHJldHVybiBbe25vZGU6IHBhcmVudCwgbWVzc2FnZTogYFJldHVybiB0eXBlIGlzIG5vdCBzdGF0aWNhbGx5IGFuYWx5emFibGUuYH1dO1xuICAgICAgfVxuXG4gICAgICBtb2R1bGVUZXh0ID0gdGhpcy5fZ2V0TmdNb2R1bGVUeXBlT2ZFeHByZXNzaW9uKHJldHVyblN0YXRlbWVudC5leHByZXNzaW9uKTtcbiAgICB9IGVsc2UgaWYgKHRzLmlzUHJvcGVydHlEZWNsYXJhdGlvbihwYXJlbnQpIHx8IHRzLmlzVmFyaWFibGVEZWNsYXJhdGlvbihwYXJlbnQpKSB7XG4gICAgICBpZiAoIXBhcmVudC5pbml0aWFsaXplcikge1xuICAgICAgICBhZGRUb2RvVG9Ob2RlKHR5cGUsIFRPRE9fQ09NTUVOVCk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZU5vZGUodHlwZSwgdHlwZSk7XG4gICAgICAgIHJldHVybiBbe25vZGU6IHBhcmVudCwgbWVzc2FnZTogYFVuYWJsZSB0byBkZXRlcm1pbmUgdHlwZSBmb3IgZGVjbGFyYXRpb24uYH1dO1xuICAgICAgfVxuXG4gICAgICBtb2R1bGVUZXh0ID0gdGhpcy5fZ2V0TmdNb2R1bGVUeXBlT2ZFeHByZXNzaW9uKHBhcmVudC5pbml0aWFsaXplcik7XG4gICAgfVxuXG4gICAgaWYgKG1vZHVsZVRleHQpIHtcbiAgICAgIHRoaXMuX2FkZEdlbmVyaWNUb1R5cGVSZWZlcmVuY2UodHlwZSwgbW9kdWxlVGV4dCk7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgcmV0dXJuIFt7bm9kZTogcGFyZW50LCBtZXNzYWdlOiBgVHlwZSBpcyBub3Qgc3RhdGljYWxseSBhbmFseXphYmxlLmB9XTtcbiAgfVxuXG4gIC8qKiBBZGQgYSBnaXZlbiBnZW5lcmljIHRvIGEgdHlwZSByZWZlcmVuY2Ugbm9kZSAqL1xuICBwcml2YXRlIF9hZGRHZW5lcmljVG9UeXBlUmVmZXJlbmNlKG5vZGU6IHRzLlR5cGVSZWZlcmVuY2VOb2RlLCB0eXBlTmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgbmV3R2VuZXJpY0V4cHIgPSBjcmVhdGVNb2R1bGVXaXRoUHJvdmlkZXJzVHlwZSh0eXBlTmFtZSwgbm9kZSk7XG4gICAgdGhpcy5fdXBkYXRlTm9kZShub2RlLCBuZXdHZW5lcmljRXhwcik7XG4gIH1cblxuICAvKipcbiAgICogTWlncmF0ZXMgYSBnaXZlbiBzdGF0aWMgbWV0aG9kIGlmIGl0cyBNb2R1bGVXaXRoUHJvdmlkZXJzIGRvZXMgbm90IHByb3ZpZGVcbiAgICogYSBnZW5lcmljIHR5cGUuXG4gICAqL1xuICBwcml2YXRlIF91cGRhdGVTdGF0aWNNZXRob2RUeXBlKG1ldGhvZDogdHMuTWV0aG9kRGVjbGFyYXRpb24sIHR5cGVOYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBuZXdHZW5lcmljRXhwciA9XG4gICAgICAgIGNyZWF0ZU1vZHVsZVdpdGhQcm92aWRlcnNUeXBlKHR5cGVOYW1lLCBtZXRob2QudHlwZSBhcyB0cy5UeXBlUmVmZXJlbmNlTm9kZSk7XG4gICAgY29uc3QgbmV3TWV0aG9kRGVjbCA9IHRzLnVwZGF0ZU1ldGhvZChcbiAgICAgICAgbWV0aG9kLCBtZXRob2QuZGVjb3JhdG9ycywgbWV0aG9kLm1vZGlmaWVycywgbWV0aG9kLmFzdGVyaXNrVG9rZW4sIG1ldGhvZC5uYW1lLFxuICAgICAgICBtZXRob2QucXVlc3Rpb25Ub2tlbiwgbWV0aG9kLnR5cGVQYXJhbWV0ZXJzLCBtZXRob2QucGFyYW1ldGVycywgbmV3R2VuZXJpY0V4cHIsXG4gICAgICAgIG1ldGhvZC5ib2R5KTtcblxuICAgIHRoaXMuX3VwZGF0ZU5vZGUobWV0aG9kLCBuZXdNZXRob2REZWNsKTtcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoZSByZXNvbHZlZCB2YWx1ZSBtYXAgcmVwcmVzZW50cyBhIE1vZHVsZVdpdGhQcm92aWRlcnMgb2JqZWN0ICovXG4gIGlzTW9kdWxlV2l0aFByb3ZpZGVyc1R5cGUodmFsdWU6IFJlc29sdmVkVmFsdWVNYXApOiBib29sZWFuIHtcbiAgICBjb25zdCBuZ01vZHVsZSA9IHZhbHVlLmdldCgnbmdNb2R1bGUnKSAhPT0gdW5kZWZpbmVkO1xuICAgIGNvbnN0IHByb3ZpZGVycyA9IHZhbHVlLmdldCgncHJvdmlkZXJzJykgIT09IHVuZGVmaW5lZDtcblxuICAgIHJldHVybiBuZ01vZHVsZSAmJiAodmFsdWUuc2l6ZSA9PT0gMSB8fCAocHJvdmlkZXJzICYmIHZhbHVlLnNpemUgPT09IDIpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgdGhlIGdlbmVyaWMgdHlwZSBvZiBhIHN1c3BlY3RlZCBNb2R1bGVXaXRoUHJvdmlkZXJzIHJldHVybiB0eXBlIGFuZCBhZGQgaXRcbiAgICogZXhwbGljaXRseVxuICAgKi9cbiAgcHJpdmF0ZSBfbWlncmF0ZVN0YXRpY05nTW9kdWxlTWV0aG9kKG5vZGU6IHRzLk1ldGhvZERlY2xhcmF0aW9uKTogQW5hbHlzaXNGYWlsdXJlfG51bGwge1xuICAgIGNvbnN0IHJldHVyblN0YXRlbWVudCA9IG5vZGUuYm9keSAmJlxuICAgICAgICBub2RlLmJvZHkuc3RhdGVtZW50cy5maW5kKG4gPT4gdHMuaXNSZXR1cm5TdGF0ZW1lbnQobikpIGFzIHRzLlJldHVyblN0YXRlbWVudCB8IHVuZGVmaW5lZDtcblxuICAgIC8vIE5vIHJldHVybiB0eXBlIGZvdW5kLCBleGl0XG4gICAgaWYgKCFyZXR1cm5TdGF0ZW1lbnQgfHwgIXJldHVyblN0YXRlbWVudC5leHByZXNzaW9uKSB7XG4gICAgICByZXR1cm4ge25vZGU6IG5vZGUsIG1lc3NhZ2U6IGBSZXR1cm4gdHlwZSBpcyBub3Qgc3RhdGljYWxseSBhbmFseXphYmxlLmB9O1xuICAgIH1cblxuICAgIGNvbnN0IG1vZHVsZVRleHQgPSB0aGlzLl9nZXROZ01vZHVsZVR5cGVPZkV4cHJlc3Npb24ocmV0dXJuU3RhdGVtZW50LmV4cHJlc3Npb24pO1xuXG4gICAgaWYgKG1vZHVsZVRleHQpIHtcbiAgICAgIHRoaXMuX3VwZGF0ZVN0YXRpY01ldGhvZFR5cGUobm9kZSwgbW9kdWxlVGV4dCk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4ge25vZGU6IG5vZGUsIG1lc3NhZ2U6IGBNZXRob2QgdHlwZSBpcyBub3Qgc3RhdGljYWxseSBhbmFseXphYmxlLmB9O1xuICB9XG5cbiAgLyoqIEV2YWx1YXRlIGFuZCByZXR1cm4gdGhlIG5nTW9kdWxlIHR5cGUgZnJvbSBhbiBleHByZXNzaW9uICovXG4gIHByaXZhdGUgX2dldE5nTW9kdWxlVHlwZU9mRXhwcmVzc2lvbihleHByOiB0cy5FeHByZXNzaW9uKTogc3RyaW5nfHVuZGVmaW5lZCB7XG4gICAgY29uc3QgZXZhbHVhdGVkRXhwciA9IHRoaXMucGFydGlhbEV2YWx1YXRvci5ldmFsdWF0ZShleHByKTtcbiAgICByZXR1cm4gdGhpcy5fZ2V0VHlwZU9mUmVzb2x2ZWRWYWx1ZShldmFsdWF0ZWRFeHByKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWaXNpdHMgYSBnaXZlbiBvYmplY3QgbGl0ZXJhbCBleHByZXNzaW9uIHRvIGRldGVybWluZSB0aGUgbmdNb2R1bGUgdHlwZS4gSWYgdGhlIGV4cHJlc3Npb25cbiAgICogY2Fubm90IGJlIHJlc29sdmVkLCBhZGQgYSBUT0RPIHRvIGFsZXJ0IHRoZSB1c2VyLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0VHlwZU9mUmVzb2x2ZWRWYWx1ZSh2YWx1ZTogUmVzb2x2ZWRWYWx1ZSk6IHN0cmluZ3x1bmRlZmluZWQge1xuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIE1hcCAmJiB0aGlzLmlzTW9kdWxlV2l0aFByb3ZpZGVyc1R5cGUodmFsdWUpKSB7XG4gICAgICBjb25zdCBtYXBWYWx1ZSA9IHZhbHVlLmdldCgnbmdNb2R1bGUnKSE7XG4gICAgICBpZiAobWFwVmFsdWUgaW5zdGFuY2VvZiBSZWZlcmVuY2UgJiYgdHMuaXNDbGFzc0RlY2xhcmF0aW9uKG1hcFZhbHVlLm5vZGUpICYmXG4gICAgICAgICAgbWFwVmFsdWUubm9kZS5uYW1lKSB7XG4gICAgICAgIHJldHVybiBtYXBWYWx1ZS5ub2RlLm5hbWUudGV4dDtcbiAgICAgIH0gZWxzZSBpZiAobWFwVmFsdWUgaW5zdGFuY2VvZiBEeW5hbWljVmFsdWUpIHtcbiAgICAgICAgYWRkVG9kb1RvTm9kZShtYXBWYWx1ZS5ub2RlLCBUT0RPX0NPTU1FTlQpO1xuICAgICAgICB0aGlzLl91cGRhdGVOb2RlKG1hcFZhbHVlLm5vZGUsIG1hcFZhbHVlLm5vZGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBwcml2YXRlIF91cGRhdGVOb2RlKG5vZGU6IHRzLk5vZGUsIG5ld05vZGU6IHRzLk5vZGUpIHtcbiAgICBjb25zdCBuZXdUZXh0ID0gdGhpcy5wcmludGVyLnByaW50Tm9kZSh0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgbmV3Tm9kZSwgbm9kZS5nZXRTb3VyY2VGaWxlKCkpO1xuICAgIGNvbnN0IHJlY29yZGVyID0gdGhpcy5nZXRVcGRhdGVSZWNvcmRlcihub2RlLmdldFNvdXJjZUZpbGUoKSk7XG5cbiAgICByZWNvcmRlci5yZW1vdmUobm9kZS5nZXRTdGFydCgpLCBub2RlLmdldFdpZHRoKCkpO1xuICAgIHJlY29yZGVyLmluc2VydFJpZ2h0KG5vZGUuZ2V0U3RhcnQoKSwgbmV3VGV4dCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBZGRzIGEgdG8tZG8gdG8gdGhlIGdpdmVuIFR5cGVTY3JpcHQgbm9kZSB3aGljaCBhbGVydHMgZGV2ZWxvcGVycyB0byBmaXhcbiAqIHBvdGVudGlhbCBpc3N1ZXMgaWRlbnRpZmllZCBieSB0aGUgbWlncmF0aW9uLlxuICovXG5mdW5jdGlvbiBhZGRUb2RvVG9Ob2RlKG5vZGU6IHRzLk5vZGUsIHRleHQ6IHN0cmluZykge1xuICB0cy5zZXRTeW50aGV0aWNMZWFkaW5nQ29tbWVudHMobm9kZSwgW3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zOiAtMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kOiAtMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzVHJhaWxpbmdOZXdMaW5lOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2luZDogdHMuU3ludGF4S2luZC5NdWx0aUxpbmVDb21tZW50VHJpdmlhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBgICR7dGV4dH0gYFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfV0pO1xufVxuIl19