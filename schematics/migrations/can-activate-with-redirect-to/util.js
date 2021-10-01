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
        define("@angular/core/schematics/migrations/can-activate-with-redirect-to/util", ["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findLiteralsToMigrate = exports.migrateLiteral = void 0;
    const typescript_1 = __importDefault(require("typescript"));
    const CAN_ACTIVATE = 'canActivate';
    const REDIRECT_TO = 'redirectTo';
    function migrateLiteral(node) {
        const propertiesToKeep = [];
        node.properties.forEach(property => {
            // Only look for regular and shorthand property assignments since resolving things
            // like spread operators becomes too complicated for this migration.
            if ((typescript_1.default.isPropertyAssignment(property) || typescript_1.default.isShorthandPropertyAssignment(property)) &&
                (typescript_1.default.isStringLiteralLike(property.name) || typescript_1.default.isNumericLiteral(property.name) ||
                    typescript_1.default.isIdentifier(property.name))) {
                if (property.name.text !== CAN_ACTIVATE) {
                    propertiesToKeep.push(property);
                }
            }
            else {
                propertiesToKeep.push(property);
            }
        });
        return typescript_1.default.createObjectLiteral(propertiesToKeep);
    }
    exports.migrateLiteral = migrateLiteral;
    function findLiteralsToMigrate(sourceFile) {
        const results = new Set();
        sourceFile.forEachChild(function visitNode(node) {
            if (!typescript_1.default.isObjectLiteralExpression(node)) {
                node.forEachChild(visitNode);
                return;
            }
            if (hasProperty(node, REDIRECT_TO) && hasProperty(node, CAN_ACTIVATE)) {
                results.add(node);
            }
        });
        return results;
    }
    exports.findLiteralsToMigrate = findLiteralsToMigrate;
    function hasProperty(node, propertyName) {
        for (const property of node.properties) {
            // Only look for regular and shorthand property assignments since resolving things
            // like spread operators becomes too complicated for this migration.
            if ((typescript_1.default.isPropertyAssignment(property) || typescript_1.default.isShorthandPropertyAssignment(property)) &&
                (typescript_1.default.isStringLiteralLike(property.name) || typescript_1.default.isNumericLiteral(property.name) ||
                    typescript_1.default.isIdentifier(property.name)) &&
                property.name.text === propertyName) {
                return true;
            }
        }
        return false;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL2Nhbi1hY3RpdmF0ZS13aXRoLXJlZGlyZWN0LXRvL3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7O0lBRUgsNERBQTRCO0lBRTVCLE1BQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQztJQUNuQyxNQUFNLFdBQVcsR0FBRyxZQUFZLENBQUM7SUFFakMsU0FBZ0IsY0FBYyxDQUFDLElBQWdDO1FBQzdELE1BQU0sZ0JBQWdCLEdBQWtDLEVBQUUsQ0FBQztRQUMzRCxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNqQyxrRkFBa0Y7WUFDbEYsb0VBQW9FO1lBQ3BFLElBQUksQ0FBQyxvQkFBRSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxJQUFJLG9CQUFFLENBQUMsNkJBQTZCLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ2pGLENBQUMsb0JBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksb0JBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO29CQUMzRSxvQkFBRSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtnQkFDcEMsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxZQUFZLEVBQUU7b0JBQ3ZDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztpQkFDakM7YUFDRjtpQkFBTTtnQkFDTCxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDakM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sb0JBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFqQkQsd0NBaUJDO0lBR0QsU0FBZ0IscUJBQXFCLENBQUMsVUFBeUI7UUFDN0QsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQThCLENBQUM7UUFFdEQsVUFBVSxDQUFDLFlBQVksQ0FBQyxTQUFTLFNBQVMsQ0FBQyxJQUFhO1lBQ3RELElBQUksQ0FBQyxvQkFBRSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN2QyxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUM3QixPQUFPO2FBQ1I7WUFDRCxJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLElBQUksV0FBVyxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsRUFBRTtnQkFDckUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNuQjtRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQWRELHNEQWNDO0lBRUQsU0FBUyxXQUFXLENBQUMsSUFBZ0MsRUFBRSxZQUFvQjtRQUN6RSxLQUFLLE1BQU0sUUFBUSxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDdEMsa0ZBQWtGO1lBQ2xGLG9FQUFvRTtZQUNwRSxJQUFJLENBQUMsb0JBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxvQkFBRSxDQUFDLDZCQUE2QixDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNqRixDQUFDLG9CQUFFLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLG9CQUFFLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztvQkFDM0Usb0JBQUUsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNoQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxZQUFZLEVBQUU7Z0JBQ3ZDLE9BQU8sSUFBSSxDQUFDO2FBQ2I7U0FDRjtRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmNvbnN0IENBTl9BQ1RJVkFURSA9ICdjYW5BY3RpdmF0ZSc7XG5jb25zdCBSRURJUkVDVF9UTyA9ICdyZWRpcmVjdFRvJztcblxuZXhwb3J0IGZ1bmN0aW9uIG1pZ3JhdGVMaXRlcmFsKG5vZGU6IHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uKTogdHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24ge1xuICBjb25zdCBwcm9wZXJ0aWVzVG9LZWVwOiB0cy5PYmplY3RMaXRlcmFsRWxlbWVudExpa2VbXSA9IFtdO1xuICBub2RlLnByb3BlcnRpZXMuZm9yRWFjaChwcm9wZXJ0eSA9PiB7XG4gICAgLy8gT25seSBsb29rIGZvciByZWd1bGFyIGFuZCBzaG9ydGhhbmQgcHJvcGVydHkgYXNzaWdubWVudHMgc2luY2UgcmVzb2x2aW5nIHRoaW5nc1xuICAgIC8vIGxpa2Ugc3ByZWFkIG9wZXJhdG9ycyBiZWNvbWVzIHRvbyBjb21wbGljYXRlZCBmb3IgdGhpcyBtaWdyYXRpb24uXG4gICAgaWYgKCh0cy5pc1Byb3BlcnR5QXNzaWdubWVudChwcm9wZXJ0eSkgfHwgdHMuaXNTaG9ydGhhbmRQcm9wZXJ0eUFzc2lnbm1lbnQocHJvcGVydHkpKSAmJlxuICAgICAgICAodHMuaXNTdHJpbmdMaXRlcmFsTGlrZShwcm9wZXJ0eS5uYW1lKSB8fCB0cy5pc051bWVyaWNMaXRlcmFsKHByb3BlcnR5Lm5hbWUpIHx8XG4gICAgICAgICB0cy5pc0lkZW50aWZpZXIocHJvcGVydHkubmFtZSkpKSB7XG4gICAgICBpZiAocHJvcGVydHkubmFtZS50ZXh0ICE9PSBDQU5fQUNUSVZBVEUpIHtcbiAgICAgICAgcHJvcGVydGllc1RvS2VlcC5wdXNoKHByb3BlcnR5KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcHJvcGVydGllc1RvS2VlcC5wdXNoKHByb3BlcnR5KTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiB0cy5jcmVhdGVPYmplY3RMaXRlcmFsKHByb3BlcnRpZXNUb0tlZXApO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kTGl0ZXJhbHNUb01pZ3JhdGUoc291cmNlRmlsZTogdHMuU291cmNlRmlsZSkge1xuICBjb25zdCByZXN1bHRzID0gbmV3IFNldDx0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbj4oKTtcblxuICBzb3VyY2VGaWxlLmZvckVhY2hDaGlsZChmdW5jdGlvbiB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSkge1xuICAgIGlmICghdHMuaXNPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihub2RlKSkge1xuICAgICAgbm9kZS5mb3JFYWNoQ2hpbGQodmlzaXROb2RlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGhhc1Byb3BlcnR5KG5vZGUsIFJFRElSRUNUX1RPKSAmJiBoYXNQcm9wZXJ0eShub2RlLCBDQU5fQUNUSVZBVEUpKSB7XG4gICAgICByZXN1bHRzLmFkZChub2RlKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiByZXN1bHRzO1xufVxuXG5mdW5jdGlvbiBoYXNQcm9wZXJ0eShub2RlOiB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbiwgcHJvcGVydHlOYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgZm9yIChjb25zdCBwcm9wZXJ0eSBvZiBub2RlLnByb3BlcnRpZXMpIHtcbiAgICAvLyBPbmx5IGxvb2sgZm9yIHJlZ3VsYXIgYW5kIHNob3J0aGFuZCBwcm9wZXJ0eSBhc3NpZ25tZW50cyBzaW5jZSByZXNvbHZpbmcgdGhpbmdzXG4gICAgLy8gbGlrZSBzcHJlYWQgb3BlcmF0b3JzIGJlY29tZXMgdG9vIGNvbXBsaWNhdGVkIGZvciB0aGlzIG1pZ3JhdGlvbi5cbiAgICBpZiAoKHRzLmlzUHJvcGVydHlBc3NpZ25tZW50KHByb3BlcnR5KSB8fCB0cy5pc1Nob3J0aGFuZFByb3BlcnR5QXNzaWdubWVudChwcm9wZXJ0eSkpICYmXG4gICAgICAgICh0cy5pc1N0cmluZ0xpdGVyYWxMaWtlKHByb3BlcnR5Lm5hbWUpIHx8IHRzLmlzTnVtZXJpY0xpdGVyYWwocHJvcGVydHkubmFtZSkgfHxcbiAgICAgICAgIHRzLmlzSWRlbnRpZmllcihwcm9wZXJ0eS5uYW1lKSkgJiZcbiAgICAgICAgcHJvcGVydHkubmFtZS50ZXh0ID09PSBwcm9wZXJ0eU5hbWUpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG4iXX0=