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
        define("@angular/core/schematics/migrations/abstract-control-parent/util", ["require", "exports", "path", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findParentAccesses = void 0;
    const path_1 = require("path");
    const ts = require("typescript");
    /** Names of symbols from `@angular/forms` whose `parent` accesses have to be migrated. */
    const abstractControlSymbols = new Set([
        'AbstractControl',
        'FormArray',
        'FormControl',
        'FormGroup',
    ]);
    /**
     * Finds the `PropertyAccessExpression`-s that are accessing the `parent` property in
     * such a way that may result in a compilation error after the v11 type changes.
     */
    function findParentAccesses(typeChecker, sourceFile) {
        const results = [];
        sourceFile.forEachChild(function walk(node) {
            if (ts.isPropertyAccessExpression(node) && node.name.text === 'parent' && !isNullCheck(node) &&
                !isSafeAccess(node) && results.indexOf(node) === -1 &&
                isAbstractControlReference(typeChecker, node) && isNullableType(typeChecker, node)) {
                results.unshift(node);
            }
            node.forEachChild(walk);
        });
        return results;
    }
    exports.findParentAccesses = findParentAccesses;
    /** Checks whether a node's type is nullable (`null`, `undefined` or `void`). */
    function isNullableType(typeChecker, node) {
        // Skip expressions in the form of `foo.bar!.baz` since the `TypeChecker` seems
        // to identify them as null, even though the user indicated that it won't be.
        if (node.parent && ts.isNonNullExpression(node.parent)) {
            return false;
        }
        const type = typeChecker.getTypeAtLocation(node);
        const typeNode = typeChecker.typeToTypeNode(type, undefined, ts.NodeBuilderFlags.None);
        let hasSeenNullableType = false;
        // Trace the type of the node back to a type node, walk
        // through all of its sub-nodes and look for nullable tyes.
        if (typeNode) {
            (function walk(current) {
                if (current.kind === ts.SyntaxKind.NullKeyword ||
                    current.kind === ts.SyntaxKind.UndefinedKeyword ||
                    current.kind === ts.SyntaxKind.VoidKeyword) {
                    hasSeenNullableType = true;
                    // Note that we don't descend into type literals, because it may cause
                    // us to mis-identify the root type as nullable, because it has a nullable
                    // property (e.g. `{ foo: string | null }`).
                }
                else if (!hasSeenNullableType && !ts.isTypeLiteralNode(current)) {
                    current.forEachChild(walk);
                }
            })(typeNode);
        }
        return hasSeenNullableType;
    }
    /**
     * Checks whether a particular node is part of a null check. E.g. given:
     * `control.parent ? control.parent.value : null` the null check would be `control.parent`.
     */
    function isNullCheck(node) {
        if (!node.parent) {
            return false;
        }
        // `control.parent && control.parent.value` where `node` is `control.parent`.
        if (ts.isBinaryExpression(node.parent) && node.parent.left === node) {
            return true;
        }
        // `control.parent && control.parent.parent && control.parent.parent.value`
        // where `node` is `control.parent`.
        if (node.parent.parent && ts.isBinaryExpression(node.parent.parent) &&
            node.parent.parent.left === node.parent) {
            return true;
        }
        // `if (control.parent) {...}` where `node` is `control.parent`.
        if (ts.isIfStatement(node.parent) && node.parent.expression === node) {
            return true;
        }
        // `control.parent ? control.parent.value : null` where `node` is `control.parent`.
        if (ts.isConditionalExpression(node.parent) && node.parent.condition === node) {
            return true;
        }
        return false;
    }
    /** Checks whether a property access is safe (e.g. `foo.parent?.value`). */
    function isSafeAccess(node) {
        return node.parent != null && ts.isPropertyAccessExpression(node.parent) &&
            node.parent.expression === node && node.parent.questionDotToken != null;
    }
    /** Checks whether a property access is on an `AbstractControl` coming from `@angular/forms`. */
    function isAbstractControlReference(typeChecker, node) {
        var _a;
        let current = node;
        const formsPattern = /node_modules\/?.*\/@angular\/forms/;
        // Walks up the property access chain and tries to find a symbol tied to a `SourceFile`.
        // If such a node is found, we check whether the type is one of the `AbstractControl` symbols
        // and whether it comes from the `@angular/forms` directory in the `node_modules`.
        while (ts.isPropertyAccessExpression(current)) {
            const type = typeChecker.getTypeAtLocation(current.expression);
            const symbol = type.getSymbol();
            if (symbol && type) {
                const sourceFile = (_a = symbol.valueDeclaration) === null || _a === void 0 ? void 0 : _a.getSourceFile();
                return sourceFile != null &&
                    formsPattern.test(path_1.normalize(sourceFile.fileName).replace(/\\/g, '/')) &&
                    hasAbstractControlType(typeChecker, type);
            }
            current = current.expression;
        }
        return false;
    }
    /**
     * Walks through the sub-types of a type, looking for a type that
     * has the same name as one of the `AbstractControl` types.
     */
    function hasAbstractControlType(typeChecker, type) {
        const typeNode = typeChecker.typeToTypeNode(type, undefined, ts.NodeBuilderFlags.None);
        let hasMatch = false;
        if (typeNode) {
            (function walk(current) {
                if (ts.isIdentifier(current) && abstractControlSymbols.has(current.text)) {
                    hasMatch = true;
                    // Note that we don't descend into type literals, because it may cause
                    // us to mis-identify the root type as nullable, because it has a nullable
                    // property (e.g. `{ foo: FormControl }`).
                }
                else if (!hasMatch && !ts.isTypeLiteralNode(current)) {
                    current.forEachChild(walk);
                }
            })(typeNode);
        }
        return hasMatch;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL2Fic3RyYWN0LWNvbnRyb2wtcGFyZW50L3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBRUgsK0JBQStCO0lBQy9CLGlDQUFpQztJQUVqQywwRkFBMEY7SUFDMUYsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLEdBQUcsQ0FBUztRQUM3QyxpQkFBaUI7UUFDakIsV0FBVztRQUNYLGFBQWE7UUFDYixXQUFXO0tBQ1osQ0FBQyxDQUFDO0lBRUg7OztPQUdHO0lBQ0gsU0FBZ0Isa0JBQWtCLENBQzlCLFdBQTJCLEVBQUUsVUFBeUI7UUFDeEQsTUFBTSxPQUFPLEdBQWtDLEVBQUUsQ0FBQztRQUVsRCxVQUFVLENBQUMsWUFBWSxDQUFDLFNBQVMsSUFBSSxDQUFDLElBQWE7WUFDakQsSUFBSSxFQUFFLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztnQkFDeEYsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ25ELDBCQUEwQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsSUFBSSxjQUFjLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxFQUFFO2dCQUN0RixPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3ZCO1lBRUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxQixDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFmRCxnREFlQztJQUVELGdG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RUFBRTtZQUNaLENBQUMsU0FBUyxJQUFJLENBQUMsT0FBZ0I7Z0JBQzdCLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUN4RSxRQUFRLEdBQUcsSUFBSSxDQUFDO29CQUNoQixzRUFBc0U7b0JBQ3RFLDBFQUEwRTtvQkFDMUUsMENBQTBDO2lCQUMzQztxQkFBTSxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsRUFBRSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxFQUFFO29CQUN0RCxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUM1QjtZQUNILENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ2Q7UUFDRCxPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7bm9ybWFsaXplfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG4vKiogTmFtZXMgb2Ygc3ltYm9scyBmcm9tIGBAYW5ndWxhci9mb3Jtc2Agd2hvc2UgYHBhcmVudGAgYWNjZXNzZXMgaGF2ZSB0byBiZSBtaWdyYXRlZC4gKi9cbmNvbnN0IGFic3RyYWN0Q29udHJvbFN5bWJvbHMgPSBuZXcgU2V0PHN0cmluZz4oW1xuICAnQWJzdHJhY3RDb250cm9sJyxcbiAgJ0Zvcm1BcnJheScsXG4gICdGb3JtQ29udHJvbCcsXG4gICdGb3JtR3JvdXAnLFxuXSk7XG5cbi8qKlxuICogRmluZHMgdGhlIGBQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb25gLXMgdGhhdCBhcmUgYWNjZXNzaW5nIHRoZSBgcGFyZW50YCBwcm9wZXJ0eSBpblxuICogc3VjaCBhIHdheSB0aGF0IG1heSByZXN1bHQgaW4gYSBjb21waWxhdGlvbiBlcnJvciBhZnRlciB0aGUgdjExIHR5cGUgY2hhbmdlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRQYXJlbnRBY2Nlc3NlcyhcbiAgICB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsIHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpOiB0cy5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb25bXSB7XG4gIGNvbnN0IHJlc3VsdHM6IHRzLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbltdID0gW107XG5cbiAgc291cmNlRmlsZS5mb3JFYWNoQ2hpbGQoZnVuY3Rpb24gd2Fsayhub2RlOiB0cy5Ob2RlKSB7XG4gICAgaWYgKHRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKG5vZGUpICYmIG5vZGUubmFtZS50ZXh0ID09PSAncGFyZW50JyAmJiAhaXNOdWxsQ2hlY2sobm9kZSkgJiZcbiAgICAgICAgIWlzU2FmZUFjY2Vzcyhub2RlKSAmJiByZXN1bHRzLmluZGV4T2Yobm9kZSkgPT09IC0xICYmXG4gICAgICAgIGlzQWJzdHJhY3RDb250cm9sUmVmZXJlbmNlKHR5cGVDaGVja2VyLCBub2RlKSAmJiBpc051bGxhYmxlVHlwZSh0eXBlQ2hlY2tlciwgbm9kZSkpIHtcbiAgICAgIHJlc3VsdHMudW5zaGlmdChub2RlKTtcbiAgICB9XG5cbiAgICBub2RlLmZvckVhY2hDaGlsZCh3YWxrKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8qKiBDaGVja3Mgd2hldGhlciBhIG5vZGUncyB0eXBlIGlzIG51bGxhYmxlIChgbnVsbGAsIGB1bmRlZmluZWRgIG9yIGB2b2lkYCkuICovXG5mdW5jdGlvbiBpc051bGxhYmxlVHlwZSh0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsIG5vZGU6IHRzLk5vZGUpIHtcbiAgLy8gU2tpcCBleHByZXNzaW9ucyBpbiB0aGUgZm9ybSBvZiBgZm9vLmJhciEuYmF6YCBzaW5jZSB0aGUgYFR5cGVDaGVja2VyYCBzZWVtc1xuICAvLyB0byBpZGVudGlmeSB0aGVtIGFzIG51bGwsIGV2ZW4gdGhvdWdoIHRoZSB1c2VyIGluZGljYXRlZCB0aGF0IGl0IHdvbid0IGJlLlxuICBpZiAobm9kZS5wYXJlbnQgJiYgdHMuaXNOb25OdWxsRXhwcmVzc2lvbihub2RlLnBhcmVudCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjb25zdCB0eXBlID0gdHlwZUNoZWNrZXIuZ2V0VHlwZUF0TG9jYXRpb24obm9kZSk7XG4gIGNvbnN0IHR5cGVOb2RlID0gdHlwZUNoZWNrZXIudHlwZVRvVHlwZU5vZGUodHlwZSwgdW5kZWZpbmVkLCB0cy5Ob2RlQnVpbGRlckZsYWdzLk5vbmUpO1xuICBsZXQgaGFzU2Vlbk51bGxhYmxlVHlwZSA9IGZhbHNlO1xuXG4gIC8vIFRyYWNlIHRoZSB0eXBlIG9mIHRoZSBub2RlIGJhY2sgdG8gYSB0eXBlIG5vZGUsIHdhbGtcbiAgLy8gdGhyb3VnaCBhbGwgb2YgaXRzIHN1Yi1ub2RlcyBhbmQgbG9vayBmb3IgbnVsbGFibGUgdHllcy5cbiAgaWYgKHR5cGVOb2RlKSB7XG4gICAgKGZ1bmN0aW9uIHdhbGsoY3VycmVudDogdHMuTm9kZSkge1xuICAgICAgaWYgKGN1cnJlbnQua2luZCA9PT0gdHMuU3ludGF4S2luZC5OdWxsS2V5d29yZCB8fFxuICAgICAgICAgIGN1cnJlbnQua2luZCA9PT0gdHMuU3ludGF4S2luZC5VbmRlZmluZWRLZXl3b3JkIHx8XG4gICAgICAgICAgY3VycmVudC5raW5kID09PSB0cy5TeW50YXhLaW5kLlZvaWRLZXl3b3JkKSB7XG4gICAgICAgIGhhc1NlZW5OdWxsYWJsZVR5cGUgPSB0cnVlO1xuICAgICAgICAvLyBOb3RlIHRoYXQgd2UgZG9uJ3QgZGVzY2VuZCBpbnRvIHR5cGUgbGl0ZXJhbHMsIGJlY2F1c2UgaXQgbWF5IGNhdXNlXG4gICAgICAgIC8vIHVzIHRvIG1pcy1pZGVudGlmeSB0aGUgcm9vdCB0eXBlIGFzIG51bGxhYmxlLCBiZWNhdXNlIGl0IGhhcyBhIG51bGxhYmxlXG4gICAgICAgIC8vIHByb3BlcnR5IChlLmcuIGB7IGZvbzogc3RyaW5nIHwgbnVsbCB9YCkuXG4gICAgICB9IGVsc2UgaWYgKCFoYXNTZWVuTnVsbGFibGVUeXBlICYmICF0cy5pc1R5cGVMaXRlcmFsTm9kZShjdXJyZW50KSkge1xuICAgICAgICBjdXJyZW50LmZvckVhY2hDaGlsZCh3YWxrKTtcbiAgICAgIH1cbiAgICB9KSh0eXBlTm9kZSk7XG4gIH1cblxuICByZXR1cm4gaGFzU2Vlbk51bGxhYmxlVHlwZTtcbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciBhIHBhcnRpY3VsYXIgbm9kZSBpcyBwYXJ0IG9mIGEgbnVsbCBjaGVjay4gRS5nLiBnaXZlbjpcbiAqIGBjb250cm9sLnBhcmVudCA/IGNvbnRyb2wucGFyZW50LnZhbHVlIDogbnVsbGAgdGhlIG51bGwgY2hlY2sgd291bGQgYmUgYGNvbnRyb2wucGFyZW50YC5cbiAqL1xuZnVuY3Rpb24gaXNOdWxsQ2hlY2sobm9kZTogdHMuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKTogYm9vbGVhbiB7XG4gIGlmICghbm9kZS5wYXJlbnQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBgY29udHJvbC5wYXJlbnQgJiYgY29udHJvbC5wYXJlbnQudmFsdWVgIHdoZXJlIGBub2RlYCBpcyBgY29udHJvbC5wYXJlbnRgLlxuICBpZiAodHMuaXNCaW5hcnlFeHByZXNzaW9uKG5vZGUucGFyZW50KSAmJiBub2RlLnBhcmVudC5sZWZ0ID09PSBub2RlKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBgY29udHJvbC5wYXJlbnQgJiYgY29udHJvbC5wYXJlbnQucGFyZW50ICYmIGNvbnRyb2wucGFyZW50LnBhcmVudC52YWx1ZWBcbiAgLy8gd2hlcmUgYG5vZGVgIGlzIGBjb250cm9sLnBhcmVudGAuXG4gIGlmIChub2RlLnBhcmVudC5wYXJlbnQgJiYgdHMuaXNCaW5hcnlFeHByZXNzaW9uKG5vZGUucGFyZW50LnBhcmVudCkgJiZcbiAgICAgIG5vZGUucGFyZW50LnBhcmVudC5sZWZ0ID09PSBub2RlLnBhcmVudCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gYGlmIChjb250cm9sLnBhcmVudCkgey4uLn1gIHdoZXJlIGBub2RlYCBpcyBgY29udHJvbC5wYXJlbnRgLlxuICBpZiAodHMuaXNJZlN0YXRlbWVudChub2RlLnBhcmVudCkgJiYgbm9kZS5wYXJlbnQuZXhwcmVzc2lvbiA9PT0gbm9kZSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gYGNvbnRyb2wucGFyZW50ID8gY29udHJvbC5wYXJlbnQudmFsdWUgOiBudWxsYCB3aGVyZSBgbm9kZWAgaXMgYGNvbnRyb2wucGFyZW50YC5cbiAgaWYgKHRzLmlzQ29uZGl0aW9uYWxFeHByZXNzaW9uKG5vZGUucGFyZW50KSAmJiBub2RlLnBhcmVudC5jb25kaXRpb24gPT09IG5vZGUpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqIENoZWNrcyB3aGV0aGVyIGEgcHJvcGVydHkgYWNjZXNzIGlzIHNhZmUgKGUuZy4gYGZvby5wYXJlbnQ/LnZhbHVlYCkuICovXG5mdW5jdGlvbiBpc1NhZmVBY2Nlc3Mobm9kZTogdHMuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKTogYm9vbGVhbiB7XG4gIHJldHVybiBub2RlLnBhcmVudCAhPSBudWxsICYmIHRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKG5vZGUucGFyZW50KSAmJlxuICAgICAgbm9kZS5wYXJlbnQuZXhwcmVzc2lvbiA9PT0gbm9kZSAmJiBub2RlLnBhcmVudC5xdWVzdGlvbkRvdFRva2VuICE9IG51bGw7XG59XG5cbi8qKiBDaGVja3Mgd2hldGhlciBhIHByb3BlcnR5IGFjY2VzcyBpcyBvbiBhbiBgQWJzdHJhY3RDb250cm9sYCBjb21pbmcgZnJvbSBgQGFuZ3VsYXIvZm9ybXNgLiAqL1xuZnVuY3Rpb24gaXNBYnN0cmFjdENvbnRyb2xSZWZlcmVuY2UoXG4gICAgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLCBub2RlOiB0cy5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24pOiBib29sZWFuIHtcbiAgbGV0IGN1cnJlbnQ6IHRzLkV4cHJlc3Npb24gPSBub2RlO1xuICBjb25zdCBmb3Jtc1BhdHRlcm4gPSAvbm9kZV9tb2R1bGVzXFwvPy4qXFwvQGFuZ3VsYXJcXC9mb3Jtcy87XG4gIC8vIFdhbGtzIHVwIHRoZSBwcm9wZXJ0eSBhY2Nlc3MgY2hhaW4gYW5kIHRyaWVzIHRvIGZpbmQgYSBzeW1ib2wgdGllZCB0byBhIGBTb3VyY2VGaWxlYC5cbiAgLy8gSWYgc3VjaCBhIG5vZGUgaXMgZm91bmQsIHdlIGNoZWNrIHdoZXRoZXIgdGhlIHR5cGUgaXMgb25lIG9mIHRoZSBgQWJzdHJhY3RDb250cm9sYCBzeW1ib2xzXG4gIC8vIGFuZCB3aGV0aGVyIGl0IGNvbWVzIGZyb20gdGhlIGBAYW5ndWxhci9mb3Jtc2AgZGlyZWN0b3J5IGluIHRoZSBgbm9kZV9tb2R1bGVzYC5cbiAgd2hpbGUgKHRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKGN1cnJlbnQpKSB7XG4gICAgY29uc3QgdHlwZSA9IHR5cGVDaGVja2VyLmdldFR5cGVBdExvY2F0aW9uKGN1cnJlbnQuZXhwcmVzc2lvbik7XG4gICAgY29uc3Qgc3ltYm9sID0gdHlwZS5nZXRTeW1ib2woKTtcbiAgICBpZiAoc3ltYm9sICYmIHR5cGUpIHtcbiAgICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBzeW1ib2wudmFsdWVEZWNsYXJhdGlvbj8uZ2V0U291cmNlRmlsZSgpO1xuICAgICAgcmV0dXJuIHNvdXJjZUZpbGUgIT0gbnVsbCAmJlxuICAgICAgICAgIGZvcm1zUGF0dGVybi50ZXN0KG5vcm1hbGl6ZShzb3VyY2VGaWxlLmZpbGVOYW1lKS5yZXBsYWNlKC9cXFxcL2csICcvJykpICYmXG4gICAgICAgICAgaGFzQWJzdHJhY3RDb250cm9sVHlwZSh0eXBlQ2hlY2tlciwgdHlwZSk7XG4gICAgfVxuICAgIGN1cnJlbnQgPSBjdXJyZW50LmV4cHJlc3Npb247XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIFdhbGtzIHRocm91Z2ggdGhlIHN1Yi10eXBlcyBvZiBhIHR5cGUsIGxvb2tpbmcgZm9yIGEgdHlwZSB0aGF0XG4gKiBoYXMgdGhlIHNhbWUgbmFtZSBhcyBvbmUgb2YgdGhlIGBBYnN0cmFjdENvbnRyb2xgIHR5cGVzLlxuICovXG5mdW5jdGlvbiBoYXNBYnN0cmFjdENvbnRyb2xUeXBlKHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwgdHlwZTogdHMuVHlwZSk6IGJvb2xlYW4ge1xuICBjb25zdCB0eXBlTm9kZSA9IHR5cGVDaGVja2VyLnR5cGVUb1R5cGVOb2RlKHR5cGUsIHVuZGVmaW5lZCwgdHMuTm9kZUJ1aWxkZXJGbGFncy5Ob25lKTtcbiAgbGV0IGhhc01hdGNoID0gZmFsc2U7XG4gIGlmICh0eXBlTm9kZSkge1xuICAgIChmdW5jdGlvbiB3YWxrKGN1cnJlbnQ6IHRzLk5vZGUpIHtcbiAgICAgIGlmICh0cy5pc0lkZW50aWZpZXIoY3VycmVudCkgJiYgYWJzdHJhY3RDb250cm9sU3ltYm9scy5oYXMoY3VycmVudC50ZXh0KSkge1xuICAgICAgICBoYXNNYXRjaCA9IHRydWU7XG4gICAgICAgIC8vIE5vdGUgdGhhdCB3ZSBkb24ndCBkZXNjZW5kIGludG8gdHlwZSBsaXRlcmFscywgYmVjYXVzZSBpdCBtYXkgY2F1c2VcbiAgICAgICAgLy8gdXMgdG8gbWlzLWlkZW50aWZ5IHRoZSByb290IHR5cGUgYXMgbnVsbGFibGUsIGJlY2F1c2UgaXQgaGFzIGEgbnVsbGFibGVcbiAgICAgICAgLy8gcHJvcGVydHkgKGUuZy4gYHsgZm9vOiBGb3JtQ29udHJvbCB9YCkuXG4gICAgICB9IGVsc2UgaWYgKCFoYXNNYXRjaCAmJiAhdHMuaXNUeXBlTGl0ZXJhbE5vZGUoY3VycmVudCkpIHtcbiAgICAgICAgY3VycmVudC5mb3JFYWNoQ2hpbGQod2Fsayk7XG4gICAgICB9XG4gICAgfSkodHlwZU5vZGUpO1xuICB9XG4gIHJldHVybiBoYXNNYXRjaDtcbn1cbiJdfQ==