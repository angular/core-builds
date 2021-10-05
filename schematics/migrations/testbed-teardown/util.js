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
        define("@angular/core/schematics/migrations/testbed-teardown/util", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/imports", "@angular/core/schematics/utils/typescript/symbol"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.migrateTestModuleMetadataLiteral = exports.migrateInitTestEnvironment = exports.findTestModuleMetadataNodes = exports.findInitTestEnvironmentCalls = void 0;
    const typescript_1 = __importDefault(require("typescript"));
    const imports_1 = require("@angular/core/schematics/utils/typescript/imports");
    const symbol_1 = require("@angular/core/schematics/utils/typescript/symbol");
    /** Finds the `initTestEnvironment` calls that need to be migrated. */
    function findInitTestEnvironmentCalls(typeChecker, allSourceFiles) {
        const callsToMigrate = new Set();
        let totalCalls = 0;
        allSourceFiles.forEach(sourceFile => {
            sourceFile.forEachChild(function walk(node) {
                if (typescript_1.default.isCallExpression(node) && typescript_1.default.isPropertyAccessExpression(node.expression) &&
                    typescript_1.default.isIdentifier(node.expression.name) &&
                    node.expression.name.text === 'initTestEnvironment' &&
                    isTestBedAccess(typeChecker, node.expression)) {
                    totalCalls++;
                    if (shouldMigrateInitTestEnvironment(node)) {
                        callsToMigrate.add(node);
                    }
                }
                node.forEachChild(walk);
            });
        });
        return {
            // Sort the nodes so that they will be migrated in reverse source order (nodes at the end of
            // the file are migrated first). This avoids issues where a migrated node will offset the
            // bounds of all nodes that come after it. Note that the nodes here are from all of the
            // passed in source files, but that doesn't matter since the later nodes will still appear
            // after the earlier ones.
            callsToMigrate: sortInReverseSourceOrder(Array.from(callsToMigrate)),
            totalCalls
        };
    }
    exports.findInitTestEnvironmentCalls = findInitTestEnvironmentCalls;
    /** Finds the `configureTestingModule` and `withModule` calls that need to be migrated. */
    function findTestModuleMetadataNodes(typeChecker, sourceFile) {
        const testModuleMetadataLiterals = new Set();
        const withModuleImport = (0, imports_1.getImportSpecifier)(sourceFile, '@angular/core/testing', 'withModule');
        sourceFile.forEachChild(function walk(node) {
            if (typescript_1.default.isCallExpression(node)) {
                const isConfigureTestingModuleCall = typescript_1.default.isPropertyAccessExpression(node.expression) &&
                    typescript_1.default.isIdentifier(node.expression.name) &&
                    node.expression.name.text === 'configureTestingModule' &&
                    isTestBedAccess(typeChecker, node.expression) && shouldMigrateModuleConfigCall(node);
                const isWithModuleCall = withModuleImport && typescript_1.default.isIdentifier(node.expression) &&
                    (0, symbol_1.isReferenceToImport)(typeChecker, node.expression, withModuleImport) &&
                    shouldMigrateModuleConfigCall(node);
                if (isConfigureTestingModuleCall || isWithModuleCall) {
                    testModuleMetadataLiterals.add(node.arguments[0]);
                }
            }
            node.forEachChild(walk);
        });
        // Sort the nodes so that they will be migrated in reverse source order (nodes at the end of
        // the file are migrated first). This avoids issues where a migrated node will offset the
        // bounds of all nodes that come after it.
        return sortInReverseSourceOrder(Array.from(testModuleMetadataLiterals));
    }
    exports.findTestModuleMetadataNodes = findTestModuleMetadataNodes;
    /** Migrates a call to `TestBed.initTestEnvironment`. */
    function migrateInitTestEnvironment(node) {
        const literalProperties = [];
        if (node.arguments.length > 2) {
            if (isFunction(node.arguments[2])) {
                // If the last argument is a function, add the function as the `aotSummaries` property.
                literalProperties.push(typescript_1.default.createPropertyAssignment('aotSummaries', node.arguments[2]));
            }
            else if (typescript_1.default.isObjectLiteralExpression(node.arguments[2])) {
                // If the property is an object literal, copy over all the properties.
                literalProperties.push(...node.arguments[2].properties);
            }
        }
        // Finally push the teardown object so that it appears last.
        literalProperties.push(createTeardownAssignment());
        return typescript_1.default.createCall(node.expression, node.typeArguments, [...node.arguments.slice(0, 2), typescript_1.default.createObjectLiteral(literalProperties, true)]);
    }
    exports.migrateInitTestEnvironment = migrateInitTestEnvironment;
    /** Migrates an object literal that is passed into `configureTestingModule` or `withModule`. */
    function migrateTestModuleMetadataLiteral(node) {
        return typescript_1.default.createObjectLiteral([...node.properties, createTeardownAssignment()], node.properties.length > 0);
    }
    exports.migrateTestModuleMetadataLiteral = migrateTestModuleMetadataLiteral;
    /** Returns whether a property access points to `TestBed`. */
    function isTestBedAccess(typeChecker, node) {
        var _a, _b;
        const symbolName = (_b = (_a = typeChecker.getTypeAtLocation(node.expression)) === null || _a === void 0 ? void 0 : _a.getSymbol()) === null || _b === void 0 ? void 0 : _b.getName();
        return symbolName === 'TestBed' || symbolName === 'TestBedStatic';
    }
    /** Whether a call to `initTestEnvironment` should be migrated. */
    function shouldMigrateInitTestEnvironment(node) {
        // If there is no third argument, we definitely have to migrate it.
        if (node.arguments.length === 2) {
            return true;
        }
        // This is technically a type error so we shouldn't mess with it.
        if (node.arguments.length < 2) {
            return false;
        }
        // Otherwise we need to figure out if the `teardown` flag is set on the last argument.
        const lastArg = node.arguments[2];
        // Note: the checks below will identify something like `initTestEnvironment(..., ..., {})`,
        // but they'll ignore a variable being passed in as the last argument like `const config = {};
        // initTestEnvironment(..., ..., config)`. While we can resolve the variable to its declaration
        // using `typeChecker.getTypeAtLocation(lastArg).getSymbol()?.valueDeclaration`, we deliberately
        // don't, because it introduces some complexity and we may end up breaking user code. E.g.
        // the `config` from the example above may be passed in to other functions or the `teardown`
        // flag could be added later on by a function call.
        // If the argument is an object literal and there are no
        // properties called `teardown`, we have to migrate it.
        if (isObjectLiteralWithoutTeardown(lastArg)) {
            return true;
        }
        // If the last argument is an `aotSummaries` function, we also have to migrate.
        if (isFunction(lastArg)) {
            return true;
        }
        // Otherwise don't migrate if we couldn't identify the last argument.
        return false;
    }
    /**
     * Whether a call to a module configuration function should be migrated. This covers
     * `TestBed.configureTestingModule` and `withModule` since they both accept `TestModuleMetadata`
     * as their first argument.
     */
    function shouldMigrateModuleConfigCall(node) {
        return node.arguments.length > 0 && isObjectLiteralWithoutTeardown(node.arguments[0]);
    }
    /** Returns whether a node is a function literal. */
    function isFunction(node) {
        return typescript_1.default.isArrowFunction(node) || typescript_1.default.isFunctionExpression(node) ||
            typescript_1.default.isFunctionDeclaration(node);
    }
    /** Checks whether a node is an object literal that doesn't contain a property called `teardown`. */
    function isObjectLiteralWithoutTeardown(node) {
        return typescript_1.default.isObjectLiteralExpression(node) && !node.properties.find(prop => {
            var _a;
            return ((_a = prop.name) === null || _a === void 0 ? void 0 : _a.getText()) === 'teardown';
        });
    }
    /** Creates a teardown configuration property assignment. */
    function createTeardownAssignment() {
        // `teardown: {destroyAfterEach: false}`
        return typescript_1.default.createPropertyAssignment('teardown', typescript_1.default.createObjectLiteral([typescript_1.default.createPropertyAssignment('destroyAfterEach', typescript_1.default.createFalse())]));
    }
    /** Sorts an array of AST nodes in reverse source order. */
    function sortInReverseSourceOrder(nodes) {
        return nodes.sort((a, b) => b.getEnd() - a.getEnd());
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3Rlc3RiZWQtdGVhcmRvd24vdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7SUFFSCw0REFBNEI7SUFFNUIsK0VBQWtFO0lBQ2xFLDZFQUFrRTtJQVVsRSxzRUFBc0U7SUFDdEUsU0FBZ0IsNEJBQTRCLENBQ3hDLFdBQTJCLEVBQUUsY0FBK0I7UUFDOUQsTUFBTSxjQUFjLEdBQUcsSUFBSSxHQUFHLEVBQXFCLENBQUM7UUFDcEQsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO1FBRW5CLGNBQWMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDbEMsVUFBVSxDQUFDLFlBQVksQ0FBQyxTQUFTLElBQUksQ0FBQyxJQUFhO2dCQUNqRCxJQUFJLG9CQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksb0JBQUUsQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO29CQUMzRSxvQkFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztvQkFDckMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLHFCQUFxQjtvQkFDbkQsZUFBZSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUU7b0JBQ2pELFVBQVUsRUFBRSxDQUFDO29CQUNiLElBQUksZ0NBQWdDLENBQUMsSUFBSSxDQUFDLEVBQUU7d0JBQzFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7cUJBQzFCO2lCQUNGO2dCQUVELElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDMUIsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMs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T0FBTyxvQkFBRSxDQUFDLHdCQUF3QixDQUM5QixVQUFVLEVBQ1Ysb0JBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLG9CQUFFLENBQUMsd0JBQXdCLENBQUMsa0JBQWtCLEVBQUUsb0JBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25HLENBQUM7SUFFRCwyREFBMkQ7SUFDM0QsU0FBUyx3QkFBd0IsQ0FBb0IsS0FBVTtRQUM3RCxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDdkQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Z2V0SW1wb3J0U3BlY2lmaWVyfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2ltcG9ydHMnO1xuaW1wb3J0IHtpc1JlZmVyZW5jZVRvSW1wb3J0fSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L3N5bWJvbCc7XG5cbi8qKiBSZXN1bHQgb2YgYSBmdWxsLXByb2dyYW0gYW5hbHlzaXMgbG9va2luZyBmb3IgYGluaXRUZXN0RW52aXJvbm1lbnRgIGNhbGxzLiAqL1xuZXhwb3J0IGludGVyZmFjZSBJbml0VGVzdEVudmlyb25tZW50QW5hbHlzaXMge1xuICAvKiogVG90YWwgbnVtYmVyIG9mIGNhbGxzIHRoYXQgd2VyZSBmb3VuZC4gKi9cbiAgdG90YWxDYWxsczogbnVtYmVyO1xuICAvKiogQ2FsbHMgdGhhdCBuZWVkIHRvIGJlIG1pZ3JhdGVkLiAqL1xuICBjYWxsc1RvTWlncmF0ZTogdHMuQ2FsbEV4cHJlc3Npb25bXTtcbn1cblxuLyoqIEZpbmRzIHRoZSBgaW5pdFRlc3RFbnZpcm9ubWVudGAgY2FsbHMgdGhhdCBuZWVkIHRvIGJlIG1pZ3JhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRJbml0VGVzdEVudmlyb25tZW50Q2FsbHMoXG4gICAgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLCBhbGxTb3VyY2VGaWxlczogdHMuU291cmNlRmlsZVtdKTogSW5pdFRlc3RFbnZpcm9ubWVudEFuYWx5c2lzIHtcbiAgY29uc3QgY2FsbHNUb01pZ3JhdGUgPSBuZXcgU2V0PHRzLkNhbGxFeHByZXNzaW9uPigpO1xuICBsZXQgdG90YWxDYWxscyA9IDA7XG5cbiAgYWxsU291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IHtcbiAgICBzb3VyY2VGaWxlLmZvckVhY2hDaGlsZChmdW5jdGlvbiB3YWxrKG5vZGU6IHRzLk5vZGUpIHtcbiAgICAgIGlmICh0cy5pc0NhbGxFeHByZXNzaW9uKG5vZGUpICYmIHRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKG5vZGUuZXhwcmVzc2lvbikgJiZcbiAgICAgICAgICB0cy5pc0lkZW50aWZpZXIobm9kZS5leHByZXNzaW9uLm5hbWUpICYmXG4gICAgICAgICAgbm9kZS5leHByZXNzaW9uLm5hbWUudGV4dCA9PT0gJ2luaXRUZXN0RW52aXJvbm1lbnQnICYmXG4gICAgICAgICAgaXNUZXN0QmVkQWNjZXNzKHR5cGVDaGVja2VyLCBub2RlLmV4cHJlc3Npb24pKSB7XG4gICAgICAgIHRvdGFsQ2FsbHMrKztcbiAgICAgICAgaWYgKHNob3VsZE1pZ3JhdGVJbml0VGVzdEVudmlyb25tZW50KG5vZGUpKSB7XG4gICAgICAgICAgY2FsbHNUb01pZ3JhdGUuYWRkKG5vZGUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIG5vZGUuZm9yRWFjaENoaWxkKHdhbGspO1xuICAgIH0pO1xuICB9KTtcblxuICByZXR1cm4ge1xuICAgIC8vIFNvcnQgdGhlIG5vZGVzIHNvIHRoYXQgdGhleSB3aWxsIGJlIG1pZ3JhdGVkIGluIHJldmVyc2Ugc291cmNlIG9yZGVyIChub2RlcyBhdCB0aGUgZW5kIG9mXG4gICAgLy8gdGhlIGZpbGUgYXJlIG1pZ3JhdGVkIGZpcnN0KS4gVGhpcyBhdm9pZHMgaXNzdWVzIHdoZXJlIGEgbWlncmF0ZWQgbm9kZSB3aWxsIG9mZnNldCB0aGVcbiAgICAvLyBib3VuZHMgb2YgYWxsIG5vZGVzIHRoYXQgY29tZSBhZnRlciBpdC4gTm90ZSB0aGF0IHRoZSBub2RlcyBoZXJlIGFyZSBmcm9tIGFsbCBvZiB0aGVcbiAgICAvLyBwYXNzZWQgaW4gc291cmNlIGZpbGVzLCBidXQgdGhhdCBkb2Vzbid0IG1hdHRlciBzaW5jZSB0aGUgbGF0ZXIgbm9kZXMgd2lsbCBzdGlsbCBhcHBlYXJcbiAgICAvLyBhZnRlciB0aGUgZWFybGllciBvbmVzLlxuICAgIGNhbGxzVG9NaWdyYXRlOiBzb3J0SW5SZXZlcnNlU291cmNlT3JkZXIoQXJyYXkuZnJvbShjYWxsc1RvTWlncmF0ZSkpLFxuICAgIHRvdGFsQ2FsbHNcbiAgfTtcbn1cblxuLyoqIEZpbmRzIHRoZSBgY29uZmlndXJlVGVzdGluZ01vZHVsZWAgYW5kIGB3aXRoTW9kdWxlYCBjYWxscyB0aGF0IG5lZWQgdG8gYmUgbWlncmF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZFRlc3RNb2R1bGVNZXRhZGF0YU5vZGVzKFxuICAgIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwgc291cmNlRmlsZTogdHMuU291cmNlRmlsZSkge1xuICBjb25zdCB0ZXN0TW9kdWxlTWV0YWRhdGFMaXRlcmFscyA9IG5ldyBTZXQ8dHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24+KCk7XG4gIGNvbnN0IHdpdGhNb2R1bGVJbXBvcnQgPSBnZXRJbXBvcnRTcGVjaWZpZXIoc291cmNlRmlsZSwgJ0Bhbmd1bGFyL2NvcmUvdGVzdGluZycsICd3aXRoTW9kdWxlJyk7XG5cbiAgc291cmNlRmlsZS5mb3JFYWNoQ2hpbGQoZnVuY3Rpb24gd2Fsayhub2RlOiB0cy5Ob2RlKSB7XG4gICAgaWYgKHRzLmlzQ2FsbEV4cHJlc3Npb24obm9kZSkpIHtcbiAgICAgIGNvbnN0IGlzQ29uZmlndXJlVGVzdGluZ01vZHVsZUNhbGwgPSB0cy5pc1Byb3BlcnR5QWNjZXNzRXhwcmVzc2lvbihub2RlLmV4cHJlc3Npb24pICYmXG4gICAgICAgICAgdHMuaXNJZGVudGlmaWVyKG5vZGUuZXhwcmVzc2lvbi5uYW1lKSAmJlxuICAgICAgICAgIG5vZGUuZXhwcmVzc2lvbi5uYW1lLnRleHQgPT09ICdjb25maWd1cmVUZXN0aW5nTW9kdWxlJyAmJlxuICAgICAgICAgIGlzVGVzdEJlZEFjY2Vzcyh0eXBlQ2hlY2tlciwgbm9kZS5leHByZXNzaW9uKSAmJiBzaG91bGRNaWdyYXRlTW9kdWxlQ29uZmlnQ2FsbChub2RlKTtcbiAgICAgIGNvbnN0IGlzV2l0aE1vZHVsZUNhbGwgPSB3aXRoTW9kdWxlSW1wb3J0ICYmIHRzLmlzSWRlbnRpZmllcihub2RlLmV4cHJlc3Npb24pICYmXG4gICAgICAgICAgaXNSZWZlcmVuY2VUb0ltcG9ydCh0eXBlQ2hlY2tlciwgbm9kZS5leHByZXNzaW9uLCB3aXRoTW9kdWxlSW1wb3J0KSAmJlxuICAgICAgICAgIHNob3VsZE1pZ3JhdGVNb2R1bGVDb25maWdDYWxsKG5vZGUpO1xuXG4gICAgICBpZiAoaXNDb25maWd1cmVUZXN0aW5nTW9kdWxlQ2FsbCB8fCBpc1dpdGhNb2R1bGVDYWxsKSB7XG4gICAgICAgIHRlc3RNb2R1bGVNZXRhZGF0YUxpdGVyYWxzLmFkZChub2RlLmFyZ3VtZW50c1swXSBhcyB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbm9kZS5mb3JFYWNoQ2hpbGQod2Fsayk7XG4gIH0pO1xuXG4gIC8vIFNvcnQgdGhlIG5vZGVzIHNvIHRoYXQgdGhleSB3aWxsIGJlIG1pZ3JhdGVkIGluIHJldmVyc2Ugc291cmNlIG9yZGVyIChub2RlcyBhdCB0aGUgZW5kIG9mXG4gIC8vIHRoZSBmaWxlIGFyZSBtaWdyYXRlZCBmaXJzdCkuIFRoaXMgYXZvaWRzIGlzc3VlcyB3aGVyZSBhIG1pZ3JhdGVkIG5vZGUgd2lsbCBvZmZzZXQgdGhlXG4gIC8vIGJvdW5kcyBvZiBhbGwgbm9kZXMgdGhhdCBjb21lIGFmdGVyIGl0LlxuICByZXR1cm4gc29ydEluUmV2ZXJzZVNvdXJjZU9yZGVyKEFycmF5LmZyb20odGVzdE1vZHVsZU1ldGFkYXRhTGl0ZXJhbHMpKTtcbn1cblxuLyoqIE1pZ3JhdGVzIGEgY2FsbCB0byBgVGVzdEJlZC5pbml0VGVzdEVudmlyb25tZW50YC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtaWdyYXRlSW5pdFRlc3RFbnZpcm9ubWVudChub2RlOiB0cy5DYWxsRXhwcmVzc2lvbik6IHRzLkNhbGxFeHByZXNzaW9uIHtcbiAgY29uc3QgbGl0ZXJhbFByb3BlcnRpZXM6IHRzLk9iamVjdExpdGVyYWxFbGVtZW50TGlrZVtdID0gW107XG5cbiAgaWYgKG5vZGUuYXJndW1lbnRzLmxlbmd0aCA+IDIpIHtcbiAgICBpZiAoaXNGdW5jdGlvbihub2RlLmFyZ3VtZW50c1syXSkpIHtcbiAgICAgIC8vIElmIHRoZSBsYXN0IGFyZ3VtZW50IGlzIGEgZnVuY3Rpb24sIGFkZCB0aGUgZnVuY3Rpb24gYXMgdGhlIGBhb3RTdW1tYXJpZXNgIHByb3BlcnR5LlxuICAgICAgbGl0ZXJhbFByb3BlcnRpZXMucHVzaCh0cy5jcmVhdGVQcm9wZXJ0eUFzc2lnbm1lbnQoJ2FvdFN1bW1hcmllcycsIG5vZGUuYXJndW1lbnRzWzJdKSk7XG4gICAgfSBlbHNlIGlmICh0cy5pc09iamVjdExpdGVyYWxFeHByZXNzaW9uKG5vZGUuYXJndW1lbnRzWzJdKSkge1xuICAgICAgLy8gSWYgdGhlIHByb3BlcnR5IGlzIGFuIG9iamVjdCBsaXRlcmFsLCBjb3B5IG92ZXIgYWxsIHRoZSBwcm9wZXJ0aWVzLlxuICAgICAgbGl0ZXJhbFByb3BlcnRpZXMucHVzaCguLi5ub2RlLmFyZ3VtZW50c1syXS5wcm9wZXJ0aWVzKTtcbiAgICB9XG4gIH1cblxuICAvLyBGaW5hbGx5IHB1c2ggdGhlIHRlYXJkb3duIG9iamVjdCBzbyB0aGF0IGl0IGFwcGVhcnMgbGFzdC5cbiAgbGl0ZXJhbFByb3BlcnRpZXMucHVzaChjcmVhdGVUZWFyZG93bkFzc2lnbm1lbnQoKSk7XG5cbiAgcmV0dXJuIHRzLmNyZWF0ZUNhbGwoXG4gICAgICBub2RlLmV4cHJlc3Npb24sIG5vZGUudHlwZUFyZ3VtZW50cyxcbiAgICAgIFsuLi5ub2RlLmFyZ3VtZW50cy5zbGljZSgwLCAyKSwgdHMuY3JlYXRlT2JqZWN0TGl0ZXJhbChsaXRlcmFsUHJvcGVydGllcywgdHJ1ZSldKTtcbn1cblxuLyoqIE1pZ3JhdGVzIGFuIG9iamVjdCBsaXRlcmFsIHRoYXQgaXMgcGFzc2VkIGludG8gYGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGVgIG9yIGB3aXRoTW9kdWxlYC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtaWdyYXRlVGVzdE1vZHVsZU1ldGFkYXRhTGl0ZXJhbChub2RlOiB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbik6XG4gICAgdHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24ge1xuICByZXR1cm4gdHMuY3JlYXRlT2JqZWN0TGl0ZXJhbChcbiAgICAgIFsuLi5ub2RlLnByb3BlcnRpZXMsIGNyZWF0ZVRlYXJkb3duQXNzaWdubWVudCgpXSwgbm9kZS5wcm9wZXJ0aWVzLmxlbmd0aCA+IDApO1xufVxuXG4vKiogUmV0dXJucyB3aGV0aGVyIGEgcHJvcGVydHkgYWNjZXNzIHBvaW50cyB0byBgVGVzdEJlZGAuICovXG5mdW5jdGlvbiBpc1Rlc3RCZWRBY2Nlc3ModHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLCBub2RlOiB0cy5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24pOiBib29sZWFuIHtcbiAgY29uc3Qgc3ltYm9sTmFtZSA9IHR5cGVDaGVja2VyLmdldFR5cGVBdExvY2F0aW9uKG5vZGUuZXhwcmVzc2lvbik/LmdldFN5bWJvbCgpPy5nZXROYW1lKCk7XG4gIHJldHVybiBzeW1ib2xOYW1lID09PSAnVGVzdEJlZCcgfHwgc3ltYm9sTmFtZSA9PT0gJ1Rlc3RCZWRTdGF0aWMnO1xufVxuXG4vKiogV2hldGhlciBhIGNhbGwgdG8gYGluaXRUZXN0RW52aXJvbm1lbnRgIHNob3VsZCBiZSBtaWdyYXRlZC4gKi9cbmZ1bmN0aW9uIHNob3VsZE1pZ3JhdGVJbml0VGVzdEVudmlyb25tZW50KG5vZGU6IHRzLkNhbGxFeHByZXNzaW9uKTogYm9vbGVhbiB7XG4gIC8vIElmIHRoZXJlIGlzIG5vIHRoaXJkIGFyZ3VtZW50LCB3ZSBkZWZpbml0ZWx5IGhhdmUgdG8gbWlncmF0ZSBpdC5cbiAgaWYgKG5vZGUuYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gVGhpcyBpcyB0ZWNobmljYWxseSBhIHR5cGUgZXJyb3Igc28gd2Ugc2hvdWxkbid0IG1lc3Mgd2l0aCBpdC5cbiAgaWYgKG5vZGUuYXJndW1lbnRzLmxlbmd0aCA8IDIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBPdGhlcndpc2Ugd2UgbmVlZCB0byBmaWd1cmUgb3V0IGlmIHRoZSBgdGVhcmRvd25gIGZsYWcgaXMgc2V0IG9uIHRoZSBsYXN0IGFyZ3VtZW50LlxuICBjb25zdCBsYXN0QXJnID0gbm9kZS5hcmd1bWVudHNbMl07XG5cbiAgLy8gTm90ZTogdGhlIGNoZWNrcyBiZWxvdyB3aWxsIGlkZW50aWZ5IHNvbWV0aGluZyBsaWtlIGBpbml0VGVzdEVudmlyb25tZW50KC4uLiwgLi4uLCB7fSlgLFxuICAvLyBidXQgdGhleSdsbCBpZ25vcmUgYSB2YXJpYWJsZSBiZWluZyBwYXNzZWQgaW4gYXMgdGhlIGxhc3QgYXJndW1lbnQgbGlrZSBgY29uc3QgY29uZmlnID0ge307XG4gIC8vIGluaXRUZXN0RW52aXJvbm1lbnQoLi4uLCAuLi4sIGNvbmZpZylgLiBXaGlsZSB3ZSBjYW4gcmVzb2x2ZSB0aGUgdmFyaWFibGUgdG8gaXRzIGRlY2xhcmF0aW9uXG4gIC8vIHVzaW5nIGB0eXBlQ2hlY2tlci5nZXRUeXBlQXRMb2NhdGlvbihsYXN0QXJnKS5nZXRTeW1ib2woKT8udmFsdWVEZWNsYXJhdGlvbmAsIHdlIGRlbGliZXJhdGVseVxuICAvLyBkb24ndCwgYmVjYXVzZSBpdCBpbnRyb2R1Y2VzIHNvbWUgY29tcGxleGl0eSBhbmQgd2UgbWF5IGVuZCB1cCBicmVha2luZyB1c2VyIGNvZGUuIEUuZy5cbiAgLy8gdGhlIGBjb25maWdgIGZyb20gdGhlIGV4YW1wbGUgYWJvdmUgbWF5IGJlIHBhc3NlZCBpbiB0byBvdGhlciBmdW5jdGlvbnMgb3IgdGhlIGB0ZWFyZG93bmBcbiAgLy8gZmxhZyBjb3VsZCBiZSBhZGRlZCBsYXRlciBvbiBieSBhIGZ1bmN0aW9uIGNhbGwuXG5cbiAgLy8gSWYgdGhlIGFyZ3VtZW50IGlzIGFuIG9iamVjdCBsaXRlcmFsIGFuZCB0aGVyZSBhcmUgbm9cbiAgLy8gcHJvcGVydGllcyBjYWxsZWQgYHRlYXJkb3duYCwgd2UgaGF2ZSB0byBtaWdyYXRlIGl0LlxuICBpZiAoaXNPYmplY3RMaXRlcmFsV2l0aG91dFRlYXJkb3duKGxhc3RBcmcpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBJZiB0aGUgbGFzdCBhcmd1bWVudCBpcyBhbiBgYW90U3VtbWFyaWVzYCBmdW5jdGlvbiwgd2UgYWxzbyBoYXZlIHRvIG1pZ3JhdGUuXG4gIGlmIChpc0Z1bmN0aW9uKGxhc3RBcmcpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBPdGhlcndpc2UgZG9uJ3QgbWlncmF0ZSBpZiB3ZSBjb3VsZG4ndCBpZGVudGlmeSB0aGUgbGFzdCBhcmd1bWVudC5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIFdoZXRoZXIgYSBjYWxsIHRvIGEgbW9kdWxlIGNvbmZpZ3VyYXRpb24gZnVuY3Rpb24gc2hvdWxkIGJlIG1pZ3JhdGVkLiBUaGlzIGNvdmVyc1xuICogYFRlc3RCZWQuY29uZmlndXJlVGVzdGluZ01vZHVsZWAgYW5kIGB3aXRoTW9kdWxlYCBzaW5jZSB0aGV5IGJvdGggYWNjZXB0IGBUZXN0TW9kdWxlTWV0YWRhdGFgXG4gKiBhcyB0aGVpciBmaXJzdCBhcmd1bWVudC5cbiAqL1xuZnVuY3Rpb24gc2hvdWxkTWlncmF0ZU1vZHVsZUNvbmZpZ0NhbGwobm9kZTogdHMuQ2FsbEV4cHJlc3Npb24pOiBub2RlIGlzIHRzLkNhbGxFeHByZXNzaW9uJlxuICAgIHthcmd1bWVudHM6IFt0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbiwgLi4udHMuRXhwcmVzc2lvbltdXX0ge1xuICByZXR1cm4gbm9kZS5hcmd1bWVudHMubGVuZ3RoID4gMCAmJiBpc09iamVjdExpdGVyYWxXaXRob3V0VGVhcmRvd24obm9kZS5hcmd1bWVudHNbMF0pO1xufVxuXG4vKiogUmV0dXJucyB3aGV0aGVyIGEgbm9kZSBpcyBhIGZ1bmN0aW9uIGxpdGVyYWwuICovXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKG5vZGU6IHRzLk5vZGUpOiBub2RlIGlzIHRzLkFycm93RnVuY3Rpb258dHMuRnVuY3Rpb25FeHByZXNzaW9ufFxuICAgIHRzLkZ1bmN0aW9uRGVjbGFyYXRpb24ge1xuICByZXR1cm4gdHMuaXNBcnJvd0Z1bmN0aW9uKG5vZGUpIHx8IHRzLmlzRnVuY3Rpb25FeHByZXNzaW9uKG5vZGUpIHx8XG4gICAgICB0cy5pc0Z1bmN0aW9uRGVjbGFyYXRpb24obm9kZSk7XG59XG5cbi8qKiBDaGVja3Mgd2hldGhlciBhIG5vZGUgaXMgYW4gb2JqZWN0IGxpdGVyYWwgdGhhdCBkb2Vzbid0IGNvbnRhaW4gYSBwcm9wZXJ0eSBjYWxsZWQgYHRlYXJkb3duYC4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0TGl0ZXJhbFdpdGhvdXRUZWFyZG93bihub2RlOiB0cy5Ob2RlKTogbm9kZSBpcyB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbiB7XG4gIHJldHVybiB0cy5pc09iamVjdExpdGVyYWxFeHByZXNzaW9uKG5vZGUpICYmICFub2RlLnByb3BlcnRpZXMuZmluZChwcm9wID0+IHtcbiAgICByZXR1cm4gcHJvcC5uYW1lPy5nZXRUZXh0KCkgPT09ICd0ZWFyZG93bic7XG4gIH0pO1xufVxuXG4vKiogQ3JlYXRlcyBhIHRlYXJkb3duIGNvbmZpZ3VyYXRpb24gcHJvcGVydHkgYXNzaWdubWVudC4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVRlYXJkb3duQXNzaWdubWVudCgpOiB0cy5Qcm9wZXJ0eUFzc2lnbm1lbnQge1xuICAvLyBgdGVhcmRvd246IHtkZXN0cm95QWZ0ZXJFYWNoOiBmYWxzZX1gXG4gIHJldHVybiB0cy5jcmVhdGVQcm9wZXJ0eUFzc2lnbm1lbnQoXG4gICAgICAndGVhcmRvd24nLFxuICAgICAgdHMuY3JlYXRlT2JqZWN0TGl0ZXJhbChbdHMuY3JlYXRlUHJvcGVydHlBc3NpZ25tZW50KCdkZXN0cm95QWZ0ZXJFYWNoJywgdHMuY3JlYXRlRmFsc2UoKSldKSk7XG59XG5cbi8qKiBTb3J0cyBhbiBhcnJheSBvZiBBU1Qgbm9kZXMgaW4gcmV2ZXJzZSBzb3VyY2Ugb3JkZXIuICovXG5mdW5jdGlvbiBzb3J0SW5SZXZlcnNlU291cmNlT3JkZXI8VCBleHRlbmRzIHRzLk5vZGU+KG5vZGVzOiBUW10pOiBUW10ge1xuICByZXR1cm4gbm9kZXMuc29ydCgoYSwgYikgPT4gYi5nZXRFbmQoKSAtIGEuZ2V0RW5kKCkpO1xufVxuIl19