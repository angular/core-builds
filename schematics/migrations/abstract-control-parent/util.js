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
        define("@angular/core/schematics/migrations/abstract-control-parent/util", ["require", "exports", "path", "typescript", "@angular/core/schematics/utils/typescript/nodes", "@angular/core/schematics/utils/typescript/symbol"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findParentAccesses = void 0;
    const path_1 = require("path");
    const typescript_1 = __importDefault(require("typescript"));
    const nodes_1 = require("@angular/core/schematics/utils/typescript/nodes");
    const symbol_1 = require("@angular/core/schematics/utils/typescript/symbol");
    /** Names of symbols from `@angular/forms` whose `parent` accesses have to be migrated. */
    const abstractControlSymbols = ['AbstractControl', 'FormArray', 'FormControl', 'FormGroup'];
    /**
     * Finds the `PropertyAccessExpression`-s that are accessing the `parent` property in
     * such a way that may result in a compilation error after the v11 type changes.
     */
    function findParentAccesses(typeChecker, sourceFile) {
        const results = [];
        sourceFile.forEachChild(function walk(node) {
            if (typescript_1.default.isPropertyAccessExpression(node) && node.name.text === 'parent' && !(0, nodes_1.isNullCheck)(node) &&
                !(0, nodes_1.isSafeAccess)(node) && results.indexOf(node) === -1 &&
                isAbstractControlReference(typeChecker, node) && (0, symbol_1.isNullableType)(typeChecker, node)) {
                results.unshift(node);
            }
            node.forEachChild(walk);
        });
        return results;
    }
    exports.findParentAccesses = findParentAccesses;
    /** Checks whether a property access is on an `AbstractControl` coming from `@angular/forms`. */
    function isAbstractControlReference(typeChecker, node) {
        var _a, _b;
        let current = node;
        const formsPattern = /node_modules\/?.*\/@angular\/forms/;
        // Walks up the property access chain and tries to find a symbol tied to a `SourceFile`.
        // If such a node is found, we check whether the type is one of the `AbstractControl` symbols
        // and whether it comes from the `@angular/forms` directory in the `node_modules`.
        while (typescript_1.default.isPropertyAccessExpression(current)) {
            const symbol = (_a = typeChecker.getTypeAtLocation(current.expression)) === null || _a === void 0 ? void 0 : _a.getSymbol();
            if (symbol) {
                const sourceFile = (_b = symbol.valueDeclaration) === null || _b === void 0 ? void 0 : _b.getSourceFile();
                return sourceFile != null &&
                    formsPattern.test((0, path_1.normalize)(sourceFile.fileName).replace(/\\/g, '/')) &&
                    (0, symbol_1.hasOneOfTypes)(typeChecker, current.expression, abstractControlSymbols);
            }
            current = current.expression;
        }
        return false;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL2Fic3RyYWN0LWNvbnRyb2wtcGFyZW50L3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7O0lBRUgsK0JBQStCO0lBQy9CLDREQUE0QjtJQUM1QiwyRUFBdUU7SUFDdkUsNkVBQTRFO0lBRTVFLDBGQUEwRjtJQUMxRixNQUFNLHNCQUFzQixHQUFHLENBQUMsaUJBQWlCLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUU1Rjs7O09BR0c7SUFDSCxTQUFnQixrQkFBa0IsQ0FDOUIsV0FBMkIsRUFBRSxVQUF5QjtRQUN4RCxNQUFNLE9BQU8sR0FBa0MsRUFBRSxDQUFDO1FBRWxELFVBQVUsQ0FBQyxZQUFZLENBQUMsU0FBUyxJQUFJLENBQUMsSUFBYTtZQUNqRCxJQUFJLG9CQUFFLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxJQUFJLENBQUMsSUFBQSxtQkFBVyxFQUFDLElBQUksQ0FBQztnQkFDeEYsQ0FBQyxJQUFBLG9CQUFZLEVBQUMsSUFBSSxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ25ELDBCQUEwQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsSUFBSSxJQUFBLHVCQUFjLEVBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxFQUFFO2dCQUN0RixPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3ZCO1lBRUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxQixDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFmRCxnREFlQztJQUVELGdHQUFnRztJQUNoRyxTQUFTLDBCQUEwQixDQUMvQixXQUEyQixFQUFFLElBQWlDOztRQUNoRSxJQUFJLE9BQU8sR0FBa0IsSUFBSSxDQUFDO1FBQ2xDLE1BQU0sWUFBWSxHQUFHLG9DQUFvQyxDQUFDO1FBQzFELHdGQUF3RjtRQUN4Riw2RkFBNkY7UUFDN0Ysa0ZBQWtGO1FBQ2xGLE9BQU8sb0JBQUUsQ0FBQywwQkFBMEIsQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUM3QyxNQUFNLE1BQU0sR0FBRyxNQUFBLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLDBDQUFFLFNBQVMsRUFBRSxDQUFDO1lBQzlFLElBQUksTUFBTSxFQUFFO2dCQUNWLE1BQU0sVUFBVSxHQUFHLE1BQUEsTUFBTSxDQUFDLGdCQUFnQiwwQ0FBRSxhQUFhLEVBQUUsQ0FBQztnQkFDNUQsT0FBTyxVQUFVLElBQUksSUFBSTtvQkFDckIsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFBLGdCQUFTLEVBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7b0JBQ3JFLElBQUEsc0JBQWEsRUFBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLFVBQVUsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO2FBQzVFO1lBQ0QsT0FBTyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUM7U0FDOUI7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtub3JtYWxpemV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtpc051bGxDaGVjaywgaXNTYWZlQWNjZXNzfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L25vZGVzJztcbmltcG9ydCB7aGFzT25lT2ZUeXBlcywgaXNOdWxsYWJsZVR5cGV9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvc3ltYm9sJztcblxuLyoqIE5hbWVzIG9mIHN5bWJvbHMgZnJvbSBgQGFuZ3VsYXIvZm9ybXNgIHdob3NlIGBwYXJlbnRgIGFjY2Vzc2VzIGhhdmUgdG8gYmUgbWlncmF0ZWQuICovXG5jb25zdCBhYnN0cmFjdENvbnRyb2xTeW1ib2xzID0gWydBYnN0cmFjdENvbnRyb2wnLCAnRm9ybUFycmF5JywgJ0Zvcm1Db250cm9sJywgJ0Zvcm1Hcm91cCddO1xuXG4vKipcbiAqIEZpbmRzIHRoZSBgUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uYC1zIHRoYXQgYXJlIGFjY2Vzc2luZyB0aGUgYHBhcmVudGAgcHJvcGVydHkgaW5cbiAqIHN1Y2ggYSB3YXkgdGhhdCBtYXkgcmVzdWx0IGluIGEgY29tcGlsYXRpb24gZXJyb3IgYWZ0ZXIgdGhlIHYxMSB0eXBlIGNoYW5nZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kUGFyZW50QWNjZXNzZXMoXG4gICAgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLCBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogdHMuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uW10ge1xuICBjb25zdCByZXN1bHRzOiB0cy5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb25bXSA9IFtdO1xuXG4gIHNvdXJjZUZpbGUuZm9yRWFjaENoaWxkKGZ1bmN0aW9uIHdhbGsobm9kZTogdHMuTm9kZSkge1xuICAgIGlmICh0cy5pc1Byb3BlcnR5QWNjZXNzRXhwcmVzc2lvbihub2RlKSAmJiBub2RlLm5hbWUudGV4dCA9PT0gJ3BhcmVudCcgJiYgIWlzTnVsbENoZWNrKG5vZGUpICYmXG4gICAgICAgICFpc1NhZmVBY2Nlc3Mobm9kZSkgJiYgcmVzdWx0cy5pbmRleE9mKG5vZGUpID09PSAtMSAmJlxuICAgICAgICBpc0Fic3RyYWN0Q29udHJvbFJlZmVyZW5jZSh0eXBlQ2hlY2tlciwgbm9kZSkgJiYgaXNOdWxsYWJsZVR5cGUodHlwZUNoZWNrZXIsIG5vZGUpKSB7XG4gICAgICByZXN1bHRzLnVuc2hpZnQobm9kZSk7XG4gICAgfVxuXG4gICAgbm9kZS5mb3JFYWNoQ2hpbGQod2Fsayk7XG4gIH0pO1xuXG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vKiogQ2hlY2tzIHdoZXRoZXIgYSBwcm9wZXJ0eSBhY2Nlc3MgaXMgb24gYW4gYEFic3RyYWN0Q29udHJvbGAgY29taW5nIGZyb20gYEBhbmd1bGFyL2Zvcm1zYC4gKi9cbmZ1bmN0aW9uIGlzQWJzdHJhY3RDb250cm9sUmVmZXJlbmNlKFxuICAgIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwgbm9kZTogdHMuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKTogYm9vbGVhbiB7XG4gIGxldCBjdXJyZW50OiB0cy5FeHByZXNzaW9uID0gbm9kZTtcbiAgY29uc3QgZm9ybXNQYXR0ZXJuID0gL25vZGVfbW9kdWxlc1xcLz8uKlxcL0Bhbmd1bGFyXFwvZm9ybXMvO1xuICAvLyBXYWxrcyB1cCB0aGUgcHJvcGVydHkgYWNjZXNzIGNoYWluIGFuZCB0cmllcyB0byBmaW5kIGEgc3ltYm9sIHRpZWQgdG8gYSBgU291cmNlRmlsZWAuXG4gIC8vIElmIHN1Y2ggYSBub2RlIGlzIGZvdW5kLCB3ZSBjaGVjayB3aGV0aGVyIHRoZSB0eXBlIGlzIG9uZSBvZiB0aGUgYEFic3RyYWN0Q29udHJvbGAgc3ltYm9sc1xuICAvLyBhbmQgd2hldGhlciBpdCBjb21lcyBmcm9tIHRoZSBgQGFuZ3VsYXIvZm9ybXNgIGRpcmVjdG9yeSBpbiB0aGUgYG5vZGVfbW9kdWxlc2AuXG4gIHdoaWxlICh0cy5pc1Byb3BlcnR5QWNjZXNzRXhwcmVzc2lvbihjdXJyZW50KSkge1xuICAgIGNvbnN0IHN5bWJvbCA9IHR5cGVDaGVja2VyLmdldFR5cGVBdExvY2F0aW9uKGN1cnJlbnQuZXhwcmVzc2lvbik/LmdldFN5bWJvbCgpO1xuICAgIGlmIChzeW1ib2wpIHtcbiAgICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBzeW1ib2wudmFsdWVEZWNsYXJhdGlvbj8uZ2V0U291cmNlRmlsZSgpO1xuICAgICAgcmV0dXJuIHNvdXJjZUZpbGUgIT0gbnVsbCAmJlxuICAgICAgICAgIGZvcm1zUGF0dGVybi50ZXN0KG5vcm1hbGl6ZShzb3VyY2VGaWxlLmZpbGVOYW1lKS5yZXBsYWNlKC9cXFxcL2csICcvJykpICYmXG4gICAgICAgICAgaGFzT25lT2ZUeXBlcyh0eXBlQ2hlY2tlciwgY3VycmVudC5leHByZXNzaW9uLCBhYnN0cmFjdENvbnRyb2xTeW1ib2xzKTtcbiAgICB9XG4gICAgY3VycmVudCA9IGN1cnJlbnQuZXhwcmVzc2lvbjtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG4iXX0=