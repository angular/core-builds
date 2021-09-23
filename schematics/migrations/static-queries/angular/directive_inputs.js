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
        define("@angular/core/schematics/migrations/static-queries/angular/directive_inputs", ["require", "exports", "typescript", "@angular/core/schematics/utils/ng_decorators", "@angular/core/schematics/utils/typescript/property_name"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getInputNamesOfClass = void 0;
    const ts = require("typescript");
    const ng_decorators_1 = require("@angular/core/schematics/utils/ng_decorators");
    const property_name_1 = require("@angular/core/schematics/utils/typescript/property_name");
    /** Analyzes the given class and resolves the name of all inputs which are declared. */
    function getInputNamesOfClass(node, typeChecker) {
        const resolvedInputSetters = [];
        // Determines the names of all inputs defined in the current class declaration by
        // checking whether a given property/getter/setter has the "@Input" decorator applied.
        node.members.forEach(m => {
            if (!m.decorators || !m.decorators.length ||
                !ts.isPropertyDeclaration(m) && !ts.isSetAccessor(m) && !ts.isGetAccessor(m)) {
                return;
            }
            const inputDecorator = (0, ng_decorators_1.getAngularDecorators)(typeChecker, m.decorators).find(d => d.name === 'Input');
            if (inputDecorator && (0, property_name_1.hasPropertyNameText)(m.name)) {
                resolvedInputSetters.push(m.name.text);
            }
        });
        // Besides looking for immediate setters in the current class declaration, developers
        // can also define inputs in the directive metadata using the "inputs" property. We
        // also need to determine these inputs which are declared in the directive metadata.
        const metadataInputs = getInputNamesFromMetadata(node, typeChecker);
        if (metadataInputs) {
            resolvedInputSetters.push(...metadataInputs);
        }
        return resolvedInputSetters;
    }
    exports.getInputNamesOfClass = getInputNamesOfClass;
    /**
     * Determines the names of all inputs declared in the directive/component metadata
     * of the given class.
     */
    function getInputNamesFromMetadata(node, typeChecker) {
        if (!node.decorators || !node.decorators.length) {
            return null;
        }
        const decorator = (0, ng_decorators_1.getAngularDecorators)(typeChecker, node.decorators)
            .find(d => d.name === 'Directive' || d.name === 'Component');
        // In case no directive/component decorator could be found for this class, just
        // return null as there is no metadata where an input could be declared.
        if (!decorator) {
            return null;
        }
        const decoratorCall = decorator.node.expression;
        // In case the decorator does define any metadata, there is no metadata
        // where inputs could be declared. This is an edge case because there
        // always needs to be an object literal, but in case there isn't we just
        // want to skip the invalid decorator and return null.
        if (decoratorCall.arguments.length !== 1 ||
            !ts.isObjectLiteralExpression(decoratorCall.arguments[0])) {
            return null;
        }
        const metadata = decoratorCall.arguments[0];
        const inputs = metadata.properties.filter(ts.isPropertyAssignment)
            .find(p => (0, property_name_1.getPropertyNameText)(p.name) === 'inputs');
        // In case there is no "inputs" property in the directive metadata,
        // just return "null" as no inputs can be declared for this class.
        if (!inputs || !ts.isArrayLiteralExpression(inputs.initializer)) {
            return null;
        }
        return inputs.initializer.elements.filter(ts.isStringLiteralLike)
            .map(element => element.text.split(':')[0].trim());
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlX2lucHV0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL2FuZ3VsYXIvZGlyZWN0aXZlX2lucHV0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCxpQ0FBaUM7SUFDakMsZ0ZBQWtFO0lBQ2xFLDJGQUFpRztJQUVqRyx1RkFBdUY7SUFDdkYsU0FBZ0Isb0JBQW9CLENBQ2hDLElBQXlCLEVBQUUsV0FBMkI7UUFDeEQsTUFBTSxvQkFBb0IsR0FBYSxFQUFFLENBQUM7UUFFMUMsaUZBQWlGO1FBQ2pGLHNGQUFzRjtRQUN0RixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUN2QixJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTTtnQkFDckMsQ0FBQyxFQUFFLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDaEYsT0FBTzthQUNSO1lBRUQsTUFBTSxjQUFjLEdBQ2hCLElBQUEsb0NBQW9CLEVBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxVQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLE9BQU8sQ0FBQyxDQUFDO1lBRW5GLElBQUksY0FBYyxJQUFJLElBQUEsbUNBQW1CLEVBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNqRCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUN4QztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgscUZBQXFGO1FBQ3JGLG1GQUFtRjtRQUNuRixvRkFBb0Y7UUFDcEYsTUFBTSxjQUFjLEdBQUcseUJBQXlCLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBRXBFLElBQUksY0FBYyxFQUFFO1lBQ2xCLG9CQUFvQixDQUFDLElBQUksQ0FBQyxHQUFHLGNBQWMsQ0FBQyxDQUFDO1NBQzlDO1FBRUQsT0FBTyxvQkFBb0IsQ0FBQztJQUM5QixDQUFDO0lBOUJELG9EQThCQztJQUVEOzs7T0FHRztJQUNILFNBQVMseUJBQXlCLENBQzlCLElBQXlCLEVBQUUsV0FBMkI7UUFDeEQsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRTtZQUMvQyxPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsTUFBTSxTQUFTLEdBQUcsSUFBQSxvQ0FBb0IsRUFBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQzthQUM3QyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLFdBQVcsSUFBSSxDQUFDLENBQUMsSUFBSSxLQUFLLFdBQVcsQ0FBQyxDQUFDO1FBRW5GLCtFQUErRTtRQUMvRSx3RUFBd0U7UUFDeEUsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNkLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUVoRCx1RUFBdUU7UUFDdkUscUVBQXFFO1FBQ3JFLHdFQUF3RTtRQUN4RSxzREFBc0Q7UUFDdEQsSUFBSSxhQUFhLENBQUMsU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDO1lBQ3BDLENBQUMsRUFBRSxDQUFDLHlCQUF5QixDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUM3RCxPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsTUFBTSxRQUFRLEdBQUcsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQStCLENBQUM7UUFDMUUsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLG9CQUFvQixDQUFDO2FBQzlDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUEsbUNBQW1CLEVBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLFFBQVEsQ0FBQyxDQUFDO1FBRXhFLG1FQUFtRTtRQUNuRSxrRUFBa0U7UUFDbEUsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFDL0QsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELE9BQU8sTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQzthQUM1RCxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3pELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge2dldEFuZ3VsYXJEZWNvcmF0b3JzfSBmcm9tICcuLi8uLi8uLi91dGlscy9uZ19kZWNvcmF0b3JzJztcbmltcG9ydCB7Z2V0UHJvcGVydHlOYW1lVGV4dCwgaGFzUHJvcGVydHlOYW1lVGV4dH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9wcm9wZXJ0eV9uYW1lJztcblxuLyoqIEFuYWx5emVzIHRoZSBnaXZlbiBjbGFzcyBhbmQgcmVzb2x2ZXMgdGhlIG5hbWUgb2YgYWxsIGlucHV0cyB3aGljaCBhcmUgZGVjbGFyZWQuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5wdXROYW1lc09mQ2xhc3MoXG4gICAgbm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyKTogc3RyaW5nW10ge1xuICBjb25zdCByZXNvbHZlZElucHV0U2V0dGVyczogc3RyaW5nW10gPSBbXTtcblxuICAvLyBEZXRlcm1pbmVzIHRoZSBuYW1lcyBvZiBhbGwgaW5wdXRzIGRlZmluZWQgaW4gdGhlIGN1cnJlbnQgY2xhc3MgZGVjbGFyYXRpb24gYnlcbiAgLy8gY2hlY2tpbmcgd2hldGhlciBhIGdpdmVuIHByb3BlcnR5L2dldHRlci9zZXR0ZXIgaGFzIHRoZSBcIkBJbnB1dFwiIGRlY29yYXRvciBhcHBsaWVkLlxuICBub2RlLm1lbWJlcnMuZm9yRWFjaChtID0+IHtcbiAgICBpZiAoIW0uZGVjb3JhdG9ycyB8fCAhbS5kZWNvcmF0b3JzLmxlbmd0aCB8fFxuICAgICAgICAhdHMuaXNQcm9wZXJ0eURlY2xhcmF0aW9uKG0pICYmICF0cy5pc1NldEFjY2Vzc29yKG0pICYmICF0cy5pc0dldEFjY2Vzc29yKG0pKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaW5wdXREZWNvcmF0b3IgPVxuICAgICAgICBnZXRBbmd1bGFyRGVjb3JhdG9ycyh0eXBlQ2hlY2tlciwgbS5kZWNvcmF0b3JzISkuZmluZChkID0+IGQubmFtZSA9PT0gJ0lucHV0Jyk7XG5cbiAgICBpZiAoaW5wdXREZWNvcmF0b3IgJiYgaGFzUHJvcGVydHlOYW1lVGV4dChtLm5hbWUpKSB7XG4gICAgICByZXNvbHZlZElucHV0U2V0dGVycy5wdXNoKG0ubmFtZS50ZXh0KTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIEJlc2lkZXMgbG9va2luZyBmb3IgaW1tZWRpYXRlIHNldHRlcnMgaW4gdGhlIGN1cnJlbnQgY2xhc3MgZGVjbGFyYXRpb24sIGRldmVsb3BlcnNcbiAgLy8gY2FuIGFsc28gZGVmaW5lIGlucHV0cyBpbiB0aGUgZGlyZWN0aXZlIG1ldGFkYXRhIHVzaW5nIHRoZSBcImlucHV0c1wiIHByb3BlcnR5LiBXZVxuICAvLyBhbHNvIG5lZWQgdG8gZGV0ZXJtaW5lIHRoZXNlIGlucHV0cyB3aGljaCBhcmUgZGVjbGFyZWQgaW4gdGhlIGRpcmVjdGl2ZSBtZXRhZGF0YS5cbiAgY29uc3QgbWV0YWRhdGFJbnB1dHMgPSBnZXRJbnB1dE5hbWVzRnJvbU1ldGFkYXRhKG5vZGUsIHR5cGVDaGVja2VyKTtcblxuICBpZiAobWV0YWRhdGFJbnB1dHMpIHtcbiAgICByZXNvbHZlZElucHV0U2V0dGVycy5wdXNoKC4uLm1ldGFkYXRhSW5wdXRzKTtcbiAgfVxuXG4gIHJldHVybiByZXNvbHZlZElucHV0U2V0dGVycztcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHRoZSBuYW1lcyBvZiBhbGwgaW5wdXRzIGRlY2xhcmVkIGluIHRoZSBkaXJlY3RpdmUvY29tcG9uZW50IG1ldGFkYXRhXG4gKiBvZiB0aGUgZ2l2ZW4gY2xhc3MuXG4gKi9cbmZ1bmN0aW9uIGdldElucHV0TmFtZXNGcm9tTWV0YWRhdGEoXG4gICAgbm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyKTogc3RyaW5nW118bnVsbCB7XG4gIGlmICghbm9kZS5kZWNvcmF0b3JzIHx8ICFub2RlLmRlY29yYXRvcnMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBkZWNvcmF0b3IgPSBnZXRBbmd1bGFyRGVjb3JhdG9ycyh0eXBlQ2hlY2tlciwgbm9kZS5kZWNvcmF0b3JzKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbmQoZCA9PiBkLm5hbWUgPT09ICdEaXJlY3RpdmUnIHx8IGQubmFtZSA9PT0gJ0NvbXBvbmVudCcpO1xuXG4gIC8vIEluIGNhc2Ugbm8gZGlyZWN0aXZlL2NvbXBvbmVudCBkZWNvcmF0b3IgY291bGQgYmUgZm91bmQgZm9yIHRoaXMgY2xhc3MsIGp1c3RcbiAgLy8gcmV0dXJuIG51bGwgYXMgdGhlcmUgaXMgbm8gbWV0YWRhdGEgd2hlcmUgYW4gaW5wdXQgY291bGQgYmUgZGVjbGFyZWQuXG4gIGlmICghZGVjb3JhdG9yKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBkZWNvcmF0b3JDYWxsID0gZGVjb3JhdG9yLm5vZGUuZXhwcmVzc2lvbjtcblxuICAvLyBJbiBjYXNlIHRoZSBkZWNvcmF0b3IgZG9lcyBkZWZpbmUgYW55IG1ldGFkYXRhLCB0aGVyZSBpcyBubyBtZXRhZGF0YVxuICAvLyB3aGVyZSBpbnB1dHMgY291bGQgYmUgZGVjbGFyZWQuIFRoaXMgaXMgYW4gZWRnZSBjYXNlIGJlY2F1c2UgdGhlcmVcbiAgLy8gYWx3YXlzIG5lZWRzIHRvIGJlIGFuIG9iamVjdCBsaXRlcmFsLCBidXQgaW4gY2FzZSB0aGVyZSBpc24ndCB3ZSBqdXN0XG4gIC8vIHdhbnQgdG8gc2tpcCB0aGUgaW52YWxpZCBkZWNvcmF0b3IgYW5kIHJldHVybiBudWxsLlxuICBpZiAoZGVjb3JhdG9yQ2FsbC5hcmd1bWVudHMubGVuZ3RoICE9PSAxIHx8XG4gICAgICAhdHMuaXNPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihkZWNvcmF0b3JDYWxsLmFyZ3VtZW50c1swXSkpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IG1ldGFkYXRhID0gZGVjb3JhdG9yQ2FsbC5hcmd1bWVudHNbMF0gYXMgdHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb247XG4gIGNvbnN0IGlucHV0cyA9IG1ldGFkYXRhLnByb3BlcnRpZXMuZmlsdGVyKHRzLmlzUHJvcGVydHlBc3NpZ25tZW50KVxuICAgICAgICAgICAgICAgICAgICAgLmZpbmQocCA9PiBnZXRQcm9wZXJ0eU5hbWVUZXh0KHAubmFtZSkgPT09ICdpbnB1dHMnKTtcblxuICAvLyBJbiBjYXNlIHRoZXJlIGlzIG5vIFwiaW5wdXRzXCIgcHJvcGVydHkgaW4gdGhlIGRpcmVjdGl2ZSBtZXRhZGF0YSxcbiAgLy8ganVzdCByZXR1cm4gXCJudWxsXCIgYXMgbm8gaW5wdXRzIGNhbiBiZSBkZWNsYXJlZCBmb3IgdGhpcyBjbGFzcy5cbiAgaWYgKCFpbnB1dHMgfHwgIXRzLmlzQXJyYXlMaXRlcmFsRXhwcmVzc2lvbihpbnB1dHMuaW5pdGlhbGl6ZXIpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gaW5wdXRzLmluaXRpYWxpemVyLmVsZW1lbnRzLmZpbHRlcih0cy5pc1N0cmluZ0xpdGVyYWxMaWtlKVxuICAgICAgLm1hcChlbGVtZW50ID0+IGVsZW1lbnQudGV4dC5zcGxpdCgnOicpWzBdLnRyaW0oKSk7XG59XG4iXX0=