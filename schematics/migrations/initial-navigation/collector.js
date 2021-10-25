var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/migrations/initial-navigation/collector", ["require", "exports", "typescript", "@angular/core/schematics/migrations/initial-navigation/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InitialNavigationCollector = void 0;
    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    const typescript_1 = __importDefault(require("typescript"));
    const util_1 = require("@angular/core/schematics/migrations/initial-navigation/util");
    /** The property name for the options that need to be migrated */
    const INITIAL_NAVIGATION = 'initialNavigation';
    /**
     * Visitor that walks through specified TypeScript nodes and collects all
     * found ExtraOptions#InitialNavigation assignments.
     */
    class InitialNavigationCollector {
        constructor(typeChecker) {
            this.typeChecker = typeChecker;
            this.assignments = new Set();
        }
        visitNode(node) {
            let extraOptionsLiteral = null;
            if ((0, util_1.isRouterModuleForRoot)(this.typeChecker, node) && node.arguments.length > 0) {
                if (node.arguments.length === 1) {
                    return;
                }
                if (typescript_1.default.isObjectLiteralExpression(node.arguments[1])) {
                    extraOptionsLiteral = node.arguments[1];
                }
                else if (typescript_1.default.isIdentifier(node.arguments[1])) {
                    extraOptionsLiteral =
                        this.getLiteralNeedingMigrationFromIdentifier(node.arguments[1]);
                }
            }
            else if (typescript_1.default.isVariableDeclaration(node)) {
                extraOptionsLiteral = this.getLiteralNeedingMigration(node);
            }
            if (extraOptionsLiteral !== null) {
                this.visitExtraOptionsLiteral(extraOptionsLiteral);
            }
            else {
                // no match found, continue iteration
                typescript_1.default.forEachChild(node, n => this.visitNode(n));
            }
        }
        visitExtraOptionsLiteral(extraOptionsLiteral) {
            for (const prop of extraOptionsLiteral.properties) {
                if (typescript_1.default.isPropertyAssignment(prop) &&
                    (typescript_1.default.isIdentifier(prop.name) || typescript_1.default.isStringLiteralLike(prop.name))) {
                    if (prop.name.text === INITIAL_NAVIGATION && isValidInitialNavigationValue(prop)) {
                        this.assignments.add(prop);
                    }
                }
                else if (typescript_1.default.isSpreadAssignment(prop) && typescript_1.default.isIdentifier(prop.expression)) {
                    const literalFromSpreadAssignment = this.getLiteralNeedingMigrationFromIdentifier(prop.expression);
                    if (literalFromSpreadAssignment !== null) {
                        this.visitExtraOptionsLiteral(literalFromSpreadAssignment);
                    }
                }
            }
        }
        getLiteralNeedingMigrationFromIdentifier(id) {
            const symbolForIdentifier = this.typeChecker.getSymbolAtLocation(id);
            if (symbolForIdentifier === undefined) {
                return null;
            }
            if (symbolForIdentifier.declarations === undefined ||
                symbolForIdentifier.declarations.length === 0) {
                return null;
            }
            const declarationNode = symbolForIdentifier.declarations[0];
            if (!typescript_1.default.isVariableDeclaration(declarationNode) || declarationNode.initializer === undefined ||
                !typescript_1.default.isObjectLiteralExpression(declarationNode.initializer)) {
                return null;
            }
            return declarationNode.initializer;
        }
        getLiteralNeedingMigration(node) {
            if (node.initializer === undefined) {
                return null;
            }
            // declaration could be `x: ExtraOptions = {}` or `x = {} as ExtraOptions`
            if (typescript_1.default.isAsExpression(node.initializer) &&
                typescript_1.default.isObjectLiteralExpression(node.initializer.expression) &&
                (0, util_1.isExtraOptions)(this.typeChecker, node.initializer.type)) {
                return node.initializer.expression;
            }
            else if (node.type !== undefined && typescript_1.default.isObjectLiteralExpression(node.initializer) &&
                (0, util_1.isExtraOptions)(this.typeChecker, node.type)) {
                return node.initializer;
            }
            return null;
        }
    }
    exports.InitialNavigationCollector = InitialNavigationCollector;
    /**
     * Check whether the value assigned to an `initialNavigation` assignment
     * conforms to the expected types for ExtraOptions#InitialNavigation
     * @param node the property assignment to check
     */
    function isValidInitialNavigationValue(node) {
        return typescript_1.default.isStringLiteralLike(node.initializer) ||
            node.initializer.kind === typescript_1.default.SyntaxKind.FalseKeyword ||
            node.initializer.kind === typescript_1.default.SyntaxKind.TrueKeyword;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvaW5pdGlhbC1uYXZpZ2F0aW9uL2NvbGxlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7SUFBQTs7Ozs7O09BTUc7SUFDSCw0REFBNEI7SUFDNUIsc0ZBQTZEO0lBRzdELGlFQUFpRTtJQUNqRSxNQUFNLGtCQUFrQixHQUFHLG1CQUFtQixDQUFDO0lBRS9DOzs7T0FHRztJQUNILE1BQWEsMEJBQTBCO1FBR3JDLFlBQTZCLFdBQTJCO1lBQTNCLGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQUZqRCxnQkFBVyxHQUErQixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBRUEsQ0FBQztRQUU1RCxTQUFTLENBQUMsSUFBYTtZQUNyQixJQUFJLG1CQUFtQixHQUFvQyxJQUFJLENBQUM7WUFDaEUsSUFBSSxJQUFBLDRCQUFxQixFQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUM5RSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtvQkFDL0IsT0FBTztpQkFDUjtnQkFFRCxJQUFJLG9CQUFFLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO29CQUNuRCxtQkFBbUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBK0IsQ0FBQztpQkFDdkU7cUJBQU0sSUFBSSxvQkFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQzdDLG1CQUFtQjt3QkFDZixJQUFJLENBQUMsd0NBQXdDLENBQUMsSUFBSSxDQUFDLFNBQVMs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QUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDM0QsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQzthQUNwQztpQkFBTSxJQUNILElBQUksQ0FBQyxJQUFJLEtBQUssU0FBUyxJQUFJLG9CQUFFLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztnQkFDekUsSUFBQSxxQkFBYyxFQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUMvQyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7YUFDekI7WUFFRCxPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7S0FDRjtJQXZGRCxnRUF1RkM7SUFFRDs7OztPQUlHO0lBQ0gsU0FBUyw2QkFBNkIsQ0FBQyxJQUEyQjtRQUNoRSxPQUFPLG9CQUFFLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUMzQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksS0FBSyxvQkFBRSxDQUFDLFVBQVUsQ0FBQyxZQUFZO1lBQ3BELElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxLQUFLLG9CQUFFLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQztJQUMxRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge2lzRXh0cmFPcHRpb25zLCBpc1JvdXRlck1vZHVsZUZvclJvb3R9IGZyb20gJy4vdXRpbCc7XG5cblxuLyoqIFRoZSBwcm9wZXJ0eSBuYW1lIGZvciB0aGUgb3B0aW9ucyB0aGF0IG5lZWQgdG8gYmUgbWlncmF0ZWQgKi9cbmNvbnN0IElOSVRJQUxfTkFWSUdBVElPTiA9ICdpbml0aWFsTmF2aWdhdGlvbic7XG5cbi8qKlxuICogVmlzaXRvciB0aGF0IHdhbGtzIHRocm91Z2ggc3BlY2lmaWVkIFR5cGVTY3JpcHQgbm9kZXMgYW5kIGNvbGxlY3RzIGFsbFxuICogZm91bmQgRXh0cmFPcHRpb25zI0luaXRpYWxOYXZpZ2F0aW9uIGFzc2lnbm1lbnRzLlxuICovXG5leHBvcnQgY2xhc3MgSW5pdGlhbE5hdmlnYXRpb25Db2xsZWN0b3Ige1xuICBwdWJsaWMgYXNzaWdubWVudHM6IFNldDx0cy5Qcm9wZXJ0eUFzc2lnbm1lbnQ+ID0gbmV3IFNldCgpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyKSB7fVxuXG4gIHZpc2l0Tm9kZShub2RlOiB0cy5Ob2RlKSB7XG4gICAgbGV0IGV4dHJhT3B0aW9uc0xpdGVyYWw6IHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9ufG51bGwgPSBudWxsO1xuICAgIGlmIChpc1JvdXRlck1vZHVsZUZvclJvb3QodGhpcy50eXBlQ2hlY2tlciwgbm9kZSkgJiYgbm9kZS5hcmd1bWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKG5vZGUuYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmICh0cy5pc09iamVjdExpdGVyYWxFeHByZXNzaW9uKG5vZGUuYXJndW1lbnRzWzFdKSkge1xuICAgICAgICBleHRyYU9wdGlvbnNMaXRlcmFsID0gbm9kZS5hcmd1bWVudHNbMV0gYXMgdHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb247XG4gICAgICB9IGVsc2UgaWYgKHRzLmlzSWRlbnRpZmllcihub2RlLmFyZ3VtZW50c1sxXSkpIHtcbiAgICAgICAgZXh0cmFPcHRpb25zTGl0ZXJhbCA9XG4gICAgICAgICAgICB0aGlzLmdldExpdGVyYWxOZWVkaW5nTWlncmF0aW9uRnJvbUlkZW50aWZpZXIobm9kZS5hcmd1bWVudHNbMV0gYXMgdHMuSWRlbnRpZmllcik7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0cy5pc1ZhcmlhYmxlRGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICAgIGV4dHJhT3B0aW9uc0xpdGVyYWwgPSB0aGlzLmdldExpdGVyYWxOZWVkaW5nTWlncmF0aW9uKG5vZGUpO1xuICAgIH1cblxuICAgIGlmIChleHRyYU9wdGlvbnNMaXRlcmFsICE9PSBudWxsKSB7XG4gICAgICB0aGlzLnZpc2l0RXh0cmFPcHRpb25zTGl0ZXJhbChleHRyYU9wdGlvbnNMaXRlcmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gbm8gbWF0Y2ggZm91bmQsIGNvbnRpbnVlIGl0ZXJhdGlvblxuICAgICAgdHMuZm9yRWFjaENoaWxkKG5vZGUsIG4gPT4gdGhpcy52aXNpdE5vZGUobikpO1xuICAgIH1cbiAgfVxuXG4gIHZpc2l0RXh0cmFPcHRpb25zTGl0ZXJhbChleHRyYU9wdGlvbnNMaXRlcmFsOiB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbikge1xuICAgIGZvciAoY29uc3QgcHJvcCBvZiBleHRyYU9wdGlvbnNMaXRlcmFsLnByb3BlcnRpZXMpIHtcbiAgICAgIGlmICh0cy5pc1Byb3BlcnR5QXNzaWdubWVudChwcm9wKSAmJlxuICAgICAgICAgICh0cy5pc0lkZW50aWZpZXIocHJvcC5uYW1lKSB8fCB0cy5pc1N0cmluZ0xpdGVyYWxMaWtlKHByb3AubmFtZSkpKSB7XG4gICAgICAgIGlmIChwcm9wLm5hbWUudGV4dCA9PT0gSU5JVElBTF9OQVZJR0FUSU9OICYmIGlzVmFsaWRJbml0aWFsTmF2aWdhdGlvblZhbHVlKHByb3ApKSB7XG4gICAgICAgICAgdGhpcy5hc3NpZ25tZW50cy5hZGQocHJvcCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodHMuaXNTcHJlYWRBc3NpZ25tZW50KHByb3ApICYmIHRzLmlzSWRlbnRpZmllcihwcm9wLmV4cHJlc3Npb24pKSB7XG4gICAgICAgIGNvbnN0IGxpdGVyYWxGcm9tU3ByZWFkQXNzaWdubWVudCA9XG4gICAgICAgICAgICB0aGlzLmdldExpdGVyYWxOZWVkaW5nTWlncmF0aW9uRnJvbUlkZW50aWZpZXIocHJvcC5leHByZXNzaW9uKTtcbiAgICAgICAgaWYgKGxpdGVyYWxGcm9tU3ByZWFkQXNzaWdubWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgIHRoaXMudmlzaXRFeHRyYU9wdGlvbnNMaXRlcmFsKGxpdGVyYWxGcm9tU3ByZWFkQXNzaWdubWVudCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldExpdGVyYWxOZWVkaW5nTWlncmF0aW9uRnJvbUlkZW50aWZpZXIoaWQ6IHRzLklkZW50aWZpZXIpOiB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvblxuICAgICAgfG51bGwge1xuICAgIGNvbnN0IHN5bWJvbEZvcklkZW50aWZpZXIgPSB0aGlzLnR5cGVDaGVja2VyLmdldFN5bWJvbEF0TG9jYXRpb24oaWQpO1xuICAgIGlmIChzeW1ib2xGb3JJZGVudGlmaWVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmIChzeW1ib2xGb3JJZGVudGlmaWVyLmRlY2xhcmF0aW9ucyA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICAgIHN5bWJvbEZvcklkZW50aWZpZXIuZGVjbGFyYXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZGVjbGFyYXRpb25Ob2RlID0gc3ltYm9sRm9ySWRlbnRpZmllci5kZWNsYXJhdGlvbnNbMF07XG4gICAgaWYgKCF0cy5pc1ZhcmlhYmxlRGVjbGFyYXRpb24oZGVjbGFyYXRpb25Ob2RlKSB8fCBkZWNsYXJhdGlvbk5vZGUuaW5pdGlhbGl6ZXIgPT09IHVuZGVmaW5lZCB8fFxuICAgICAgICAhdHMuaXNPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihkZWNsYXJhdGlvbk5vZGUuaW5pdGlhbGl6ZXIpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gZGVjbGFyYXRpb25Ob2RlLmluaXRpYWxpemVyO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRMaXRlcmFsTmVlZGluZ01pZ3JhdGlvbihub2RlOiB0cy5WYXJpYWJsZURlY2xhcmF0aW9uKTogdHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb25cbiAgICAgIHxudWxsIHtcbiAgICBpZiAobm9kZS5pbml0aWFsaXplciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBkZWNsYXJhdGlvbiBjb3VsZCBiZSBgeDogRXh0cmFPcHRpb25zID0ge31gIG9yIGB4ID0ge30gYXMgRXh0cmFPcHRpb25zYFxuICAgIGlmICh0cy5pc0FzRXhwcmVzc2lvbihub2RlLmluaXRpYWxpemVyKSAmJlxuICAgICAgICB0cy5pc09iamVjdExpdGVyYWxFeHByZXNzaW9uKG5vZGUuaW5pdGlhbGl6ZXIuZXhwcmVzc2lvbikgJiZcbiAgICAgICAgaXNFeHRyYU9wdGlvbnModGhpcy50eXBlQ2hlY2tlciwgbm9kZS5pbml0aWFsaXplci50eXBlKSkge1xuICAgICAgcmV0dXJuIG5vZGUuaW5pdGlhbGl6ZXIuZXhwcmVzc2lvbjtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgICBub2RlLnR5cGUgIT09IHVuZGVmaW5lZCAmJiB0cy5pc09iamVjdExpdGVyYWxFeHByZXNzaW9uKG5vZGUuaW5pdGlhbGl6ZXIpICYmXG4gICAgICAgIGlzRXh0cmFPcHRpb25zKHRoaXMudHlwZUNoZWNrZXIsIG5vZGUudHlwZSkpIHtcbiAgICAgIHJldHVybiBub2RlLmluaXRpYWxpemVyO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgdmFsdWUgYXNzaWduZWQgdG8gYW4gYGluaXRpYWxOYXZpZ2F0aW9uYCBhc3NpZ25tZW50XG4gKiBjb25mb3JtcyB0byB0aGUgZXhwZWN0ZWQgdHlwZXMgZm9yIEV4dHJhT3B0aW9ucyNJbml0aWFsTmF2aWdhdGlvblxuICogQHBhcmFtIG5vZGUgdGhlIHByb3BlcnR5IGFzc2lnbm1lbnQgdG8gY2hlY2tcbiAqL1xuZnVuY3Rpb24gaXNWYWxpZEluaXRpYWxOYXZpZ2F0aW9uVmFsdWUobm9kZTogdHMuUHJvcGVydHlBc3NpZ25tZW50KTogYm9vbGVhbiB7XG4gIHJldHVybiB0cy5pc1N0cmluZ0xpdGVyYWxMaWtlKG5vZGUuaW5pdGlhbGl6ZXIpIHx8XG4gICAgICBub2RlLmluaXRpYWxpemVyLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuRmFsc2VLZXl3b3JkIHx8XG4gICAgICBub2RlLmluaXRpYWxpemVyLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuVHJ1ZUtleXdvcmQ7XG59XG4iXX0=