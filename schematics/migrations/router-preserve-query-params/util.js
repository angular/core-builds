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
        define("@angular/core/schematics/migrations/router-preserve-query-params/util", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/imports", "@angular/core/schematics/utils/typescript/symbol"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findLiteralsToMigrate = exports.migrateLiteral = void 0;
    const ts = require("typescript");
    const imports_1 = require("@angular/core/schematics/utils/typescript/imports");
    const symbol_1 = require("@angular/core/schematics/utils/typescript/symbol");
    /**
     * Configures the methods that the migration should be looking for
     * and the properties from `NavigationExtras` that should be preserved.
     */
    const methodConfig = new Set(['navigate', 'createUrlTree']);
    const preserveQueryParamsKey = 'preserveQueryParams';
    function migrateLiteral(methodName, node) {
        var _a;
        const isMigratableMethod = methodConfig.has(methodName);
        if (!isMigratableMethod) {
            throw Error(`Attempting to migrate unconfigured method called ${methodName}.`);
        }
        const propertiesToKeep = [];
        let propertyToMigrate = undefined;
        for (const property of node.properties) {
            // Only look for regular and shorthand property assignments since resolving things
            // like spread operators becomes too complicated for this migration.
            if ((ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property)) &&
                (ts.isStringLiteralLike(property.name) || ts.isNumericLiteral(property.name) ||
                    ts.isIdentifier(property.name)) &&
                (property.name.text === preserveQueryParamsKey)) {
                propertyToMigrate = property;
                continue;
            }
            propertiesToKeep.push(property);
        }
        // Don't modify the node if there's nothing to migrate.
        if (propertyToMigrate === undefined) {
            return node;
        }
        if ((ts.isShorthandPropertyAssignment(propertyToMigrate) &&
            ((_a = propertyToMigrate.objectAssignmentInitializer) === null || _a === void 0 ? void 0 : _a.kind) === ts.SyntaxKind.TrueKeyword) ||
            (ts.isPropertyAssignment(propertyToMigrate) &&
                propertyToMigrate.initializer.kind === ts.SyntaxKind.TrueKeyword)) {
            return ts.updateObjectLiteral(node, propertiesToKeep.concat(ts.createPropertyAssignment('queryParamsHandling', ts.createIdentifier(`'preserve'`))));
        }
        return ts.updateObjectLiteral(node, propertiesToKeep);
    }
    exports.migrateLiteral = migrateLiteral;
    function findLiteralsToMigrate(sourceFile, typeChecker) {
        const results = new Map(Array.from(methodConfig.keys(), key => [key, new Set()]));
        const routerImport = (0, imports_1.getImportSpecifier)(sourceFile, '@angular/router', 'Router');
        const seenLiterals = new Map();
        if (routerImport) {
            sourceFile.forEachChild(function visitNode(node) {
                var _a;
                // Look for calls that look like `foo.<method to migrate>` with more than one parameter.
                if (ts.isCallExpression(node) && node.arguments.length > 1 &&
                    ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.name) &&
                    methodConfig.has(node.expression.name.text)) {
                    // Check whether the type of the object on which the
                    // function is called refers to the Router import.
                    if ((0, symbol_1.isReferenceToImport)(typeChecker, node.expression.expression, routerImport)) {
                        const methodName = node.expression.name.text;
                        const parameterDeclaration = (_a = typeChecker.getTypeAtLocation(node.arguments[1]).getSymbol()) === null || _a === void 0 ? void 0 : _a.valueDeclaration;
                        // Find the source of the object literal.
                        if (parameterDeclaration && ts.isObjectLiteralExpression(parameterDeclaration)) {
                            if (!seenLiterals.has(parameterDeclaration)) {
                                results.get(methodName).add(parameterDeclaration);
                                seenLiterals.set(parameterDeclaration, methodName);
                                // If the same literal has been passed into multiple different methods, we can't
                                // migrate it, because the supported properties are different. When we detect such
                                // a case, we drop it from the results so that it gets ignored. If it's used multiple
                                // times for the same method, it can still be migrated.
                            }
                            else if (seenLiterals.get(parameterDeclaration) !== methodName) {
                                results.forEach(literals => literals.delete(parameterDeclaration));
                            }
                        }
                    }
                }
                else {
                    node.forEachChild(visitNode);
                }
            });
        }
        return results;
    }
    exports.findLiteralsToMigrate = findLiteralsToMigrate;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3JvdXRlci1wcmVzZXJ2ZS1xdWVyeS1wYXJhbXMvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCxpQ0FBaUM7SUFFakMsK0VBQWtFO0lBQ2xFLDZFQUFrRTtJQUVsRTs7O09BR0c7SUFDSCxNQUFNLFlBQVksR0FBRyxJQUFJLEdBQUcsQ0FBUyxDQUFDLFVBQVUsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDO0lBRXBFLE1BQU0sc0JBQXNCLEdBQUcscUJBQXFCLENBQUM7SUFFckQsU0FBZ0IsY0FBYyxDQUMxQixVQUFrQixFQUFFLElBQWdDOztRQUN0RCxNQUFNLGtCQUFrQixHQUFHLFlBQVksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFeEQsSUFBSSxDQUFDLGtCQUFrQixFQUFFO1lBQ3ZCLE1BQU0sS0FBSyxDQUFDLG9EQUFvRCxVQUFVLEdBQUcsQ0FBQyxDQUFDO1NBQ2hGO1FBR0QsTUFBTSxnQkFBZ0IsR0FBa0MsRUFBRSxDQUFDO1FBQzNELElBQUksaUJBQWlCLEdBQW1FLFNBQVMsQ0FBQztRQUVsRyxLQUFLLE1BQU0sUUFBUSxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDdEMsa0ZBQWtGO1lBQ2xGLG9FQUFvRTtZQUNwRSxJQUFJLENBQUMsRUFBRSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyw2QkFBNkIsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDakYsQ0FBQyxFQUFFLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO29CQUMzRSxFQUFFLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDaEMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxzQkFBc0IsQ0FBQyxFQUFFO2dCQUNuRCxpQkFBaUIsR0FBRyxRQUFRLENBQUM7Z0JBQzdCLFNBQVM7YUFDVjtZQUNELGdCQUFnQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUNqQztRQUVELHVEQUF1RDtRQUN2RCxJQUFJLGlCQUFpQixLQUFLLFNBQVMsRUFBRTtZQUNuQyxPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsSUFBSSxDQUFDLEVBQUUsQ0FBQyw2QkFBNkIsQ0FBQyxpQkFBaUIsQ0FBQztZQUNuRCxDQUFBLE1BQUEsaUJBQWlCLENBQUMsMkJBQTJCLDBDQUFFLElBQUksTUFBSyxFQUFFLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQztZQUNuRixDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxpQkFBaUIsQ0FBQztnQkFDMUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQ3RFLE9BQU8sRUFBRSxDQUFDLG1CQUFtQixDQUN6QixJQUFJLEVBQ0osZ0JBQWdCLENBQUMsTUFBTSxDQUNuQixFQUFFLENBQUMsd0JBQXdCLENBQUMscUJBQXFCLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2pHO1FBRUQsT0FBTyxFQUFFLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFLGdCQUFnQixDQUFDLENBQUM7SUFDeEQsQ0FBQztJQXpDRCx3Q0F5Q0M7SUFFRCxTQUFnQixxQkFBcUIsQ0FBQyxVQUF5QixFQUFFLFdBQTJCO1FBQzFGLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUNuQixLQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUQsTUFBTSxZQUFZLEdBQUcsSUFBQSw0QkFBa0IsRUFBQyxVQUFVLEVBQUUsaUJBQWlCLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDakYsTUFBTSxZQUFZLEdBQUcsSUFBSSxHQUFHLEVBQXNDLENBQUM7UUFFbkUsSUFBSSxZQUFZLEVBQUU7WUFDaEIsVUFBVSxDQUFDLFlBQVksQ0FBQyxTQUFTLFNBQVMsQ0FBQyxJQUFhOztnQkFDdEQsd0ZBQXdGO2dCQUN4RixJQUFJLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDO29CQUN0RCxFQUFFLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7b0JBQ3ZGLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQy9DLG9EQUFvRDtvQkFDcEQsa0RBQWtEO29CQUNsRCxJQUFJLElBQUEsNEJBQW1CLEVBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxFQUFFO3dCQUM5RSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7d0JBQzdDLE1BQU0sb0JBQW9CLEdBQ3RCLE1BQUEsV0FBVyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsMENBQUUsZ0JBQWdCLENBQUM7d0JBRW5GLHlDQUF5Qzt3QkFDekMsSUFBSSxvQkFBb0IsSUFBSSxFQUFFLENBQUMseUJBQXlCLENBQUMsb0JBQW9CLENBQUMsRUFBRTs0QkFDOUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsRUFBRTtnQ0FDM0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUUsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsQ0FBQztnQ0FDbkQsWUFBWSxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxVQUFVLENBQUMsQ0FBQztnQ0FDbkQsZ0ZBQWdGO2dDQUNoRixrRkFBa0Y7Z0NBQ2xGLHFGQUFxRjtnQ0FDckYsdURBQXVEOzZCQUN4RDtpQ0FBTSxJQUFJLFlBQVksQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsS0FBSyxVQUFVLEVBQUU7Z0NBQ2hFLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQzs2QkFDcEU7eUJBQ0Y7cUJBQ0Y7aUJBQ0Y7cUJBQU07b0JBQ0wsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztpQkFDOUI7WUFDSCxDQUFDLENBQUMsQ0FBQztTQUNKO1FBRUQsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQXhDRCxzREF3Q0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Z2V0SW1wb3J0U3BlY2lmaWVyfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2ltcG9ydHMnO1xuaW1wb3J0IHtpc1JlZmVyZW5jZVRvSW1wb3J0fSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L3N5bWJvbCc7XG5cbi8qKlxuICogQ29uZmlndXJlcyB0aGUgbWV0aG9kcyB0aGF0IHRoZSBtaWdyYXRpb24gc2hvdWxkIGJlIGxvb2tpbmcgZm9yXG4gKiBhbmQgdGhlIHByb3BlcnRpZXMgZnJvbSBgTmF2aWdhdGlvbkV4dHJhc2AgdGhhdCBzaG91bGQgYmUgcHJlc2VydmVkLlxuICovXG5jb25zdCBtZXRob2RDb25maWcgPSBuZXcgU2V0PHN0cmluZz4oWyduYXZpZ2F0ZScsICdjcmVhdGVVcmxUcmVlJ10pO1xuXG5jb25zdCBwcmVzZXJ2ZVF1ZXJ5UGFyYW1zS2V5ID0gJ3ByZXNlcnZlUXVlcnlQYXJhbXMnO1xuXG5leHBvcnQgZnVuY3Rpb24gbWlncmF0ZUxpdGVyYWwoXG4gICAgbWV0aG9kTmFtZTogc3RyaW5nLCBub2RlOiB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbik6IHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uIHtcbiAgY29uc3QgaXNNaWdyYXRhYmxlTWV0aG9kID0gbWV0aG9kQ29uZmlnLmhhcyhtZXRob2ROYW1lKTtcblxuICBpZiAoIWlzTWlncmF0YWJsZU1ldGhvZCkge1xuICAgIHRocm93IEVycm9yKGBBdHRlbXB0aW5nIHRvIG1pZ3JhdGUgdW5jb25maWd1cmVkIG1ldGhvZCBjYWxsZWQgJHttZXRob2ROYW1lfS5gKTtcbiAgfVxuXG5cbiAgY29uc3QgcHJvcGVydGllc1RvS2VlcDogdHMuT2JqZWN0TGl0ZXJhbEVsZW1lbnRMaWtlW10gPSBbXTtcbiAgbGV0IHByb3BlcnR5VG9NaWdyYXRlOiB0cy5Qcm9wZXJ0eUFzc2lnbm1lbnR8dHMuU2hvcnRoYW5kUHJvcGVydHlBc3NpZ25tZW50fHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICBmb3IgKGNvbnN0IHByb3BlcnR5IG9mIG5vZGUucHJvcGVydGllcykge1xuICAgIC8vIE9ubHkgbG9vayBmb3IgcmVndWxhciBhbmQgc2hvcnRoYW5kIHByb3BlcnR5IGFzc2lnbm1lbnRzIHNpbmNlIHJlc29sdmluZyB0aGluZ3NcbiAgICAvLyBsaWtlIHNwcmVhZCBvcGVyYXRvcnMgYmVjb21lcyB0b28gY29tcGxpY2F0ZWQgZm9yIHRoaXMgbWlncmF0aW9uLlxuICAgIGlmICgodHMuaXNQcm9wZXJ0eUFzc2lnbm1lbnQocHJvcGVydHkpIHx8IHRzLmlzU2hvcnRoYW5kUHJvcGVydHlBc3NpZ25tZW50KHByb3BlcnR5KSkgJiZcbiAgICAgICAgKHRzLmlzU3RyaW5nTGl0ZXJhbExpa2UocHJvcGVydHkubmFtZSkgfHwgdHMuaXNOdW1lcmljTGl0ZXJhbChwcm9wZXJ0eS5uYW1lKSB8fFxuICAgICAgICAgdHMuaXNJZGVudGlmaWVyKHByb3BlcnR5Lm5hbWUpKSAmJlxuICAgICAgICAocHJvcGVydHkubmFtZS50ZXh0ID09PSBwcmVzZXJ2ZVF1ZXJ5UGFyYW1zS2V5KSkge1xuICAgICAgcHJvcGVydHlUb01pZ3JhdGUgPSBwcm9wZXJ0eTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBwcm9wZXJ0aWVzVG9LZWVwLnB1c2gocHJvcGVydHkpO1xuICB9XG5cbiAgLy8gRG9uJ3QgbW9kaWZ5IHRoZSBub2RlIGlmIHRoZXJlJ3Mgbm90aGluZyB0byBtaWdyYXRlLlxuICBpZiAocHJvcGVydHlUb01pZ3JhdGUgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgaWYgKCh0cy5pc1Nob3J0aGFuZFByb3BlcnR5QXNzaWdubWVudChwcm9wZXJ0eVRvTWlncmF0ZSkgJiZcbiAgICAgICBwcm9wZXJ0eVRvTWlncmF0ZS5vYmplY3RBc3NpZ25tZW50SW5pdGlhbGl6ZXI/LmtpbmQgPT09IHRzLlN5bnRheEtpbmQuVHJ1ZUtleXdvcmQpIHx8XG4gICAgICAodHMuaXNQcm9wZXJ0eUFzc2lnbm1lbnQocHJvcGVydHlUb01pZ3JhdGUpICYmXG4gICAgICAgcHJvcGVydHlUb01pZ3JhdGUuaW5pdGlhbGl6ZXIua2luZCA9PT0gdHMuU3ludGF4S2luZC5UcnVlS2V5d29yZCkpIHtcbiAgICByZXR1cm4gdHMudXBkYXRlT2JqZWN0TGl0ZXJhbChcbiAgICAgICAgbm9kZSxcbiAgICAgICAgcHJvcGVydGllc1RvS2VlcC5jb25jYXQoXG4gICAgICAgICAgICB0cy5jcmVhdGVQcm9wZXJ0eUFzc2lnbm1lbnQoJ3F1ZXJ5UGFyYW1zSGFuZGxpbmcnLCB0cy5jcmVhdGVJZGVudGlmaWVyKGAncHJlc2VydmUnYCkpKSk7XG4gIH1cblxuICByZXR1cm4gdHMudXBkYXRlT2JqZWN0TGl0ZXJhbChub2RlLCBwcm9wZXJ0aWVzVG9LZWVwKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRMaXRlcmFsc1RvTWlncmF0ZShzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlLCB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIpIHtcbiAgY29uc3QgcmVzdWx0cyA9IG5ldyBNYXA8c3RyaW5nLCBTZXQ8dHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24+PihcbiAgICAgIEFycmF5LmZyb20obWV0aG9kQ29uZmlnLmtleXMoKSwga2V5ID0+IFtrZXksIG5ldyBTZXQoKV0pKTtcbiAgY29uc3Qgcm91dGVySW1wb3J0ID0gZ2V0SW1wb3J0U3BlY2lmaWVyKHNvdXJjZUZpbGUsICdAYW5ndWxhci9yb3V0ZXInLCAnUm91dGVyJyk7XG4gIGNvbnN0IHNlZW5MaXRlcmFscyA9IG5ldyBNYXA8dHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24sIHN0cmluZz4oKTtcblxuICBpZiAocm91dGVySW1wb3J0KSB7XG4gICAgc291cmNlRmlsZS5mb3JFYWNoQ2hpbGQoZnVuY3Rpb24gdmlzaXROb2RlKG5vZGU6IHRzLk5vZGUpIHtcbiAgICAgIC8vIExvb2sgZm9yIGNhbGxzIHRoYXQgbG9vayBsaWtlIGBmb28uPG1ldGhvZCB0byBtaWdyYXRlPmAgd2l0aCBtb3JlIHRoYW4gb25lIHBhcmFtZXRlci5cbiAgICAgIGlmICh0cy5pc0NhbGxFeHByZXNzaW9uKG5vZGUpICYmIG5vZGUuYXJndW1lbnRzLmxlbmd0aCA+IDEgJiZcbiAgICAgICAgICB0cy5pc1Byb3BlcnR5QWNjZXNzRXhwcmVzc2lvbihub2RlLmV4cHJlc3Npb24pICYmIHRzLmlzSWRlbnRpZmllcihub2RlLmV4cHJlc3Npb24ubmFtZSkgJiZcbiAgICAgICAgICBtZXRob2RDb25maWcuaGFzKG5vZGUuZXhwcmVzc2lvbi5uYW1lLnRleHQpKSB7XG4gICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlIHR5cGUgb2YgdGhlIG9iamVjdCBvbiB3aGljaCB0aGVcbiAgICAgICAgLy8gZnVuY3Rpb24gaXMgY2FsbGVkIHJlZmVycyB0byB0aGUgUm91dGVyIGltcG9ydC5cbiAgICAgICAgaWYgKGlzUmVmZXJlbmNlVG9JbXBvcnQodHlwZUNoZWNrZXIsIG5vZGUuZXhwcmVzc2lvbi5leHByZXNzaW9uLCByb3V0ZXJJbXBvcnQpKSB7XG4gICAgICAgICAgY29uc3QgbWV0aG9kTmFtZSA9IG5vZGUuZXhwcmVzc2lvbi5uYW1lLnRleHQ7XG4gICAgICAgICAgY29uc3QgcGFyYW1ldGVyRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICB0eXBlQ2hlY2tlci5nZXRUeXBlQXRMb2NhdGlvbihub2RlLmFyZ3VtZW50c1sxXSkuZ2V0U3ltYm9sKCk/LnZhbHVlRGVjbGFyYXRpb247XG5cbiAgICAgICAgICAvLyBGaW5kIHRoZSBzb3VyY2Ugb2YgdGhlIG9iamVjdCBsaXRlcmFsLlxuICAgICAgICAgIGlmIChwYXJhbWV0ZXJEZWNsYXJhdGlvbiAmJiB0cy5pc09iamVjdExpdGVyYWxFeHByZXNzaW9uKHBhcmFtZXRlckRlY2xhcmF0aW9uKSkge1xuICAgICAgICAgICAgaWYgKCFzZWVuTGl0ZXJhbHMuaGFzKHBhcmFtZXRlckRlY2xhcmF0aW9uKSkge1xuICAgICAgICAgICAgICByZXN1bHRzLmdldChtZXRob2ROYW1lKSEuYWRkKHBhcmFtZXRlckRlY2xhcmF0aW9uKTtcbiAgICAgICAgICAgICAgc2VlbkxpdGVyYWxzLnNldChwYXJhbWV0ZXJEZWNsYXJhdGlvbiwgbWV0aG9kTmFtZSk7XG4gICAgICAgICAgICAgIC8vIElmIHRoZSBzYW1lIGxpdGVyYWwgaGFzIGJlZW4gcGFzc2VkIGludG8gbXVsdGlwbGUgZGlmZmVyZW50IG1ldGhvZHMsIHdlIGNhbid0XG4gICAgICAgICAgICAgIC8vIG1pZ3JhdGUgaXQsIGJlY2F1c2UgdGhlIHN1cHBvcnRlZCBwcm9wZXJ0aWVzIGFyZSBkaWZmZXJlbnQuIFdoZW4gd2UgZGV0ZWN0IHN1Y2hcbiAgICAgICAgICAgICAgLy8gYSBjYXNlLCB3ZSBkcm9wIGl0IGZyb20gdGhlIHJlc3VsdHMgc28gdGhhdCBpdCBnZXRzIGlnbm9yZWQuIElmIGl0J3MgdXNlZCBtdWx0aXBsZVxuICAgICAgICAgICAgICAvLyB0aW1lcyBmb3IgdGhlIHNhbWUgbWV0aG9kLCBpdCBjYW4gc3RpbGwgYmUgbWlncmF0ZWQuXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNlZW5MaXRlcmFscy5nZXQocGFyYW1ldGVyRGVjbGFyYXRpb24pICE9PSBtZXRob2ROYW1lKSB7XG4gICAgICAgICAgICAgIHJlc3VsdHMuZm9yRWFjaChsaXRlcmFscyA9PiBsaXRlcmFscy5kZWxldGUocGFyYW1ldGVyRGVjbGFyYXRpb24pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGUuZm9yRWFjaENoaWxkKHZpc2l0Tm9kZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0cztcbn1cbiJdfQ==