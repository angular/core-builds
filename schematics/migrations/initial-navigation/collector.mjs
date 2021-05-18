/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ts from 'typescript';
import { isExtraOptions, isRouterModuleForRoot } from './util';
/** The property name for the options that need to be migrated */
const INITIAL_NAVIGATION = 'initialNavigation';
/**
 * Visitor that walks through specified TypeScript nodes and collects all
 * found ExtraOptions#InitialNavigation assignments.
 */
export class InitialNavigationCollector {
    constructor(typeChecker) {
        this.typeChecker = typeChecker;
        this.assignments = new Set();
    }
    visitNode(node) {
        let extraOptionsLiteral = null;
        if (isRouterModuleForRoot(this.typeChecker, node) && node.arguments.length > 0) {
            if (node.arguments.length === 1) {
                return;
            }
            if (ts.isObjectLiteralExpression(node.arguments[1])) {
                extraOptionsLiteral = node.arguments[1];
            }
            else if (ts.isIdentifier(node.arguments[1])) {
                extraOptionsLiteral =
                    this.getLiteralNeedingMigrationFromIdentifier(node.arguments[1]);
            }
        }
        else if (ts.isVariableDeclaration(node)) {
            extraOptionsLiteral = this.getLiteralNeedingMigration(node);
        }
        if (extraOptionsLiteral !== null) {
            this.visitExtraOptionsLiteral(extraOptionsLiteral);
        }
        else {
            // no match found, continue iteration
            ts.forEachChild(node, n => this.visitNode(n));
        }
    }
    visitExtraOptionsLiteral(extraOptionsLiteral) {
        for (const prop of extraOptionsLiteral.properties) {
            if (ts.isPropertyAssignment(prop) &&
                (ts.isIdentifier(prop.name) || ts.isStringLiteralLike(prop.name))) {
                if (prop.name.text === INITIAL_NAVIGATION && isValidInitialNavigationValue(prop)) {
                    this.assignments.add(prop);
                }
            }
            else if (ts.isSpreadAssignment(prop) && ts.isIdentifier(prop.expression)) {
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
        if (symbolForIdentifier.declarations.length === 0) {
            return null;
        }
        const declarationNode = symbolForIdentifier.declarations[0];
        if (!ts.isVariableDeclaration(declarationNode) || declarationNode.initializer === undefined ||
            !ts.isObjectLiteralExpression(declarationNode.initializer)) {
            return null;
        }
        return declarationNode.initializer;
    }
    getLiteralNeedingMigration(node) {
        if (node.initializer === undefined) {
            return null;
        }
        // declaration could be `x: ExtraOptions = {}` or `x = {} as ExtraOptions`
        if (ts.isAsExpression(node.initializer) &&
            ts.isObjectLiteralExpression(node.initializer.expression) &&
            isExtraOptions(this.typeChecker, node.initializer.type)) {
            return node.initializer.expression;
        }
        else if (node.type !== undefined && ts.isObjectLiteralExpression(node.initializer) &&
            isExtraOptions(this.typeChecker, node.type)) {
            return node.initializer;
        }
        return null;
    }
}
/**
 * Check whether the value assigned to an `initialNavigation` assignment
 * conforms to the expected types for ExtraOptions#InitialNavigation
 * @param node the property assignment to check
 */
function isValidInitialNavigationValue(node) {
    return ts.isStringLiteralLike(node.initializer) ||
        node.initializer.kind === ts.SyntaxKind.FalseKeyword ||
        node.initializer.kind === ts.SyntaxKind.TrueKeyword;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvaW5pdGlhbC1uYXZpZ2F0aW9uL2NvbGxlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFDSCxPQUFPLEtBQUssRUFBRSxNQUFNLFlBQVksQ0FBQztBQUNqQyxPQUFPLEVBQUMsY0FBYyxFQUFFLHFCQUFxQixFQUFDLE1BQU0sUUFBUSxDQUFDO0FBRzdELGlFQUFpRTtBQUNqRSxNQUFNLGtCQUFrQixHQUFHLG1CQUFtQixDQUFDO0FBRS9DOzs7R0FHRztBQUNILE1BQU0sT0FBTywwQkFBMEI7SUFHckMsWUFBNkIsV0FBMkI7UUFBM0IsZ0JBQVcsR0FBWCxXQUFXLENBQWdCO1FBRmpELGdCQUFXLEdBQStCLElBQUksR0FBRyxFQUFFLENBQUM7SUFFQSxDQUFDO0lBRTVELFNBQVMsQ0FBQyxJQUFhO1FBQ3JCLElBQUksbUJBQW1CLEdBQW9DLElBQUksQ0FBQztRQUNoRSxJQUFJLHFCQUFxQixDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQzlFLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO2dCQUMvQixPQUFPO2FBQ1I7WUFFRCxJQUFJLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ25ELG1CQUFtQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUErQixDQUFDO2FBQ3ZFO2lCQUFNLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQzdDLG1CQUFtQjtv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SSxDQUFDLEVBQUU7WUFDM0QsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQztTQUNwQzthQUFNLElBQ0gsSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLElBQUksRUFBRSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7WUFDekUsY0FBYyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQy9DLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztTQUN6QjtRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztDQUNGO0FBRUQ7Ozs7R0FJRztBQUNILFNBQVMsNkJBQTZCLENBQUMsSUFBMkI7SUFDaEUsT0FBTyxFQUFFLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUMzQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLFlBQVk7UUFDcEQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUM7QUFDMUQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge2lzRXh0cmFPcHRpb25zLCBpc1JvdXRlck1vZHVsZUZvclJvb3R9IGZyb20gJy4vdXRpbCc7XG5cblxuLyoqIFRoZSBwcm9wZXJ0eSBuYW1lIGZvciB0aGUgb3B0aW9ucyB0aGF0IG5lZWQgdG8gYmUgbWlncmF0ZWQgKi9cbmNvbnN0IElOSVRJQUxfTkFWSUdBVElPTiA9ICdpbml0aWFsTmF2aWdhdGlvbic7XG5cbi8qKlxuICogVmlzaXRvciB0aGF0IHdhbGtzIHRocm91Z2ggc3BlY2lmaWVkIFR5cGVTY3JpcHQgbm9kZXMgYW5kIGNvbGxlY3RzIGFsbFxuICogZm91bmQgRXh0cmFPcHRpb25zI0luaXRpYWxOYXZpZ2F0aW9uIGFzc2lnbm1lbnRzLlxuICovXG5leHBvcnQgY2xhc3MgSW5pdGlhbE5hdmlnYXRpb25Db2xsZWN0b3Ige1xuICBwdWJsaWMgYXNzaWdubWVudHM6IFNldDx0cy5Qcm9wZXJ0eUFzc2lnbm1lbnQ+ID0gbmV3IFNldCgpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyKSB7fVxuXG4gIHZpc2l0Tm9kZShub2RlOiB0cy5Ob2RlKSB7XG4gICAgbGV0IGV4dHJhT3B0aW9uc0xpdGVyYWw6IHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9ufG51bGwgPSBudWxsO1xuICAgIGlmIChpc1JvdXRlck1vZHVsZUZvclJvb3QodGhpcy50eXBlQ2hlY2tlciwgbm9kZSkgJiYgbm9kZS5hcmd1bWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKG5vZGUuYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmICh0cy5pc09iamVjdExpdGVyYWxFeHByZXNzaW9uKG5vZGUuYXJndW1lbnRzWzFdKSkge1xuICAgICAgICBleHRyYU9wdGlvbnNMaXRlcmFsID0gbm9kZS5hcmd1bWVudHNbMV0gYXMgdHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb247XG4gICAgICB9IGVsc2UgaWYgKHRzLmlzSWRlbnRpZmllcihub2RlLmFyZ3VtZW50c1sxXSkpIHtcbiAgICAgICAgZXh0cmFPcHRpb25zTGl0ZXJhbCA9XG4gICAgICAgICAgICB0aGlzLmdldExpdGVyYWxOZWVkaW5nTWlncmF0aW9uRnJvbUlkZW50aWZpZXIobm9kZS5hcmd1bWVudHNbMV0gYXMgdHMuSWRlbnRpZmllcik7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0cy5pc1ZhcmlhYmxlRGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICAgIGV4dHJhT3B0aW9uc0xpdGVyYWwgPSB0aGlzLmdldExpdGVyYWxOZWVkaW5nTWlncmF0aW9uKG5vZGUpO1xuICAgIH1cblxuICAgIGlmIChleHRyYU9wdGlvbnNMaXRlcmFsICE9PSBudWxsKSB7XG4gICAgICB0aGlzLnZpc2l0RXh0cmFPcHRpb25zTGl0ZXJhbChleHRyYU9wdGlvbnNMaXRlcmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gbm8gbWF0Y2ggZm91bmQsIGNvbnRpbnVlIGl0ZXJhdGlvblxuICAgICAgdHMuZm9yRWFjaENoaWxkKG5vZGUsIG4gPT4gdGhpcy52aXNpdE5vZGUobikpO1xuICAgIH1cbiAgfVxuXG4gIHZpc2l0RXh0cmFPcHRpb25zTGl0ZXJhbChleHRyYU9wdGlvbnNMaXRlcmFsOiB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbikge1xuICAgIGZvciAoY29uc3QgcHJvcCBvZiBleHRyYU9wdGlvbnNMaXRlcmFsLnByb3BlcnRpZXMpIHtcbiAgICAgIGlmICh0cy5pc1Byb3BlcnR5QXNzaWdubWVudChwcm9wKSAmJlxuICAgICAgICAgICh0cy5pc0lkZW50aWZpZXIocHJvcC5uYW1lKSB8fCB0cy5pc1N0cmluZ0xpdGVyYWxMaWtlKHByb3AubmFtZSkpKSB7XG4gICAgICAgIGlmIChwcm9wLm5hbWUudGV4dCA9PT0gSU5JVElBTF9OQVZJR0FUSU9OICYmIGlzVmFsaWRJbml0aWFsTmF2aWdhdGlvblZhbHVlKHByb3ApKSB7XG4gICAgICAgICAgdGhpcy5hc3NpZ25tZW50cy5hZGQocHJvcCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodHMuaXNTcHJlYWRBc3NpZ25tZW50KHByb3ApICYmIHRzLmlzSWRlbnRpZmllcihwcm9wLmV4cHJlc3Npb24pKSB7XG4gICAgICAgIGNvbnN0IGxpdGVyYWxGcm9tU3ByZWFkQXNzaWdubWVudCA9XG4gICAgICAgICAgICB0aGlzLmdldExpdGVyYWxOZWVkaW5nTWlncmF0aW9uRnJvbUlkZW50aWZpZXIocHJvcC5leHByZXNzaW9uKTtcbiAgICAgICAgaWYgKGxpdGVyYWxGcm9tU3ByZWFkQXNzaWdubWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgIHRoaXMudmlzaXRFeHRyYU9wdGlvbnNMaXRlcmFsKGxpdGVyYWxGcm9tU3ByZWFkQXNzaWdubWVudCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldExpdGVyYWxOZWVkaW5nTWlncmF0aW9uRnJvbUlkZW50aWZpZXIoaWQ6IHRzLklkZW50aWZpZXIpOiB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvblxuICAgICAgfG51bGwge1xuICAgIGNvbnN0IHN5bWJvbEZvcklkZW50aWZpZXIgPSB0aGlzLnR5cGVDaGVja2VyLmdldFN5bWJvbEF0TG9jYXRpb24oaWQpO1xuICAgIGlmIChzeW1ib2xGb3JJZGVudGlmaWVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmIChzeW1ib2xGb3JJZGVudGlmaWVyLmRlY2xhcmF0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGRlY2xhcmF0aW9uTm9kZSA9IHN5bWJvbEZvcklkZW50aWZpZXIuZGVjbGFyYXRpb25zWzBdO1xuICAgIGlmICghdHMuaXNWYXJpYWJsZURlY2xhcmF0aW9uKGRlY2xhcmF0aW9uTm9kZSkgfHwgZGVjbGFyYXRpb25Ob2RlLmluaXRpYWxpemVyID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgIXRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24oZGVjbGFyYXRpb25Ob2RlLmluaXRpYWxpemVyKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlY2xhcmF0aW9uTm9kZS5pbml0aWFsaXplcjtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0TGl0ZXJhbE5lZWRpbmdNaWdyYXRpb24obm9kZTogdHMuVmFyaWFibGVEZWNsYXJhdGlvbik6IHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uXG4gICAgICB8bnVsbCB7XG4gICAgaWYgKG5vZGUuaW5pdGlhbGl6ZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gZGVjbGFyYXRpb24gY291bGQgYmUgYHg6IEV4dHJhT3B0aW9ucyA9IHt9YCBvciBgeCA9IHt9IGFzIEV4dHJhT3B0aW9uc2BcbiAgICBpZiAodHMuaXNBc0V4cHJlc3Npb24obm9kZS5pbml0aWFsaXplcikgJiZcbiAgICAgICAgdHMuaXNPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihub2RlLmluaXRpYWxpemVyLmV4cHJlc3Npb24pICYmXG4gICAgICAgIGlzRXh0cmFPcHRpb25zKHRoaXMudHlwZUNoZWNrZXIsIG5vZGUuaW5pdGlhbGl6ZXIudHlwZSkpIHtcbiAgICAgIHJldHVybiBub2RlLmluaXRpYWxpemVyLmV4cHJlc3Npb247XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICAgbm9kZS50eXBlICE9PSB1bmRlZmluZWQgJiYgdHMuaXNPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihub2RlLmluaXRpYWxpemVyKSAmJlxuICAgICAgICBpc0V4dHJhT3B0aW9ucyh0aGlzLnR5cGVDaGVja2VyLCBub2RlLnR5cGUpKSB7XG4gICAgICByZXR1cm4gbm9kZS5pbml0aWFsaXplcjtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIHZhbHVlIGFzc2lnbmVkIHRvIGFuIGBpbml0aWFsTmF2aWdhdGlvbmAgYXNzaWdubWVudFxuICogY29uZm9ybXMgdG8gdGhlIGV4cGVjdGVkIHR5cGVzIGZvciBFeHRyYU9wdGlvbnMjSW5pdGlhbE5hdmlnYXRpb25cbiAqIEBwYXJhbSBub2RlIHRoZSBwcm9wZXJ0eSBhc3NpZ25tZW50IHRvIGNoZWNrXG4gKi9cbmZ1bmN0aW9uIGlzVmFsaWRJbml0aWFsTmF2aWdhdGlvblZhbHVlKG5vZGU6IHRzLlByb3BlcnR5QXNzaWdubWVudCk6IGJvb2xlYW4ge1xuICByZXR1cm4gdHMuaXNTdHJpbmdMaXRlcmFsTGlrZShub2RlLmluaXRpYWxpemVyKSB8fFxuICAgICAgbm9kZS5pbml0aWFsaXplci5raW5kID09PSB0cy5TeW50YXhLaW5kLkZhbHNlS2V5d29yZCB8fFxuICAgICAgbm9kZS5pbml0aWFsaXplci5raW5kID09PSB0cy5TeW50YXhLaW5kLlRydWVLZXl3b3JkO1xufVxuIl19