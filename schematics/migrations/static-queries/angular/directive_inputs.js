/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
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
            const inputDecorator = ng_decorators_1.getAngularDecorators(typeChecker, m.decorators).find(d => d.name === 'Input');
            if (inputDecorator && property_name_1.hasPropertyNameText(m.name)) {
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
        const decorator = ng_decorators_1.getAngularDecorators(typeChecker, node.decorators)
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
        if (!ts.isObjectLiteralExpression(decoratorCall.arguments[0])) {
            return null;
        }
        const metadata = decoratorCall.arguments[0];
        const inputs = metadata.properties.filter(ts.isPropertyAssignment)
            .find(p => property_name_1.getPropertyNameText(p.name) === 'inputs');
        // In case there is no "inputs" property in the directive metadata,
        // just return "null" as no inputs can be declared for this class.
        if (!inputs || !ts.isArrayLiteralExpression(inputs.initializer)) {
            return null;
        }
        return inputs.initializer.elements.filter(ts.isStringLiteralLike)
            .map(element => element.text.split(':')[0].trim());
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlX2lucHV0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL2FuZ3VsYXIvZGlyZWN0aXZlX2lucHV0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUNqQyxnRkFBa0U7SUFDbEUsMkZBQWlHO0lBRWpHLHVGQUF1RjtJQUN2RixTQUFnQixvQkFBb0IsQ0FDaEMsSUFBeUIsRUFBRSxXQUEyQjtRQUN4RCxNQUFNLG9CQUFvQixHQUFhLEVBQUUsQ0FBQztRQUUxQyxpRkFBaUY7UUFDakYsc0ZBQXNGO1FBQ3RGLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ3ZCLElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNO2dCQUNyQyxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNoRixPQUFPO2FBQ1I7WUFFRCxNQUFNLGNBQWMsR0FDaEIsb0NBQW9CLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxVQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLE9BQU8sQ0FBQyxDQUFDO1lBRXBGLElBQUksY0FBYyxJQUFJLG1DQUFtQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDakQsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDeEM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILHFGQUFxRjtRQUNyRixtRkFBbUY7UUFDbkYsb0ZBQW9GO1FBQ3BGLE1BQU0sY0FBYyxHQUFHLHlCQUF5QixDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztRQUVwRSxJQUFJLGNBQWMsRUFBRTtZQUNsQixvQkFBb0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxjQUFjLENBQUMsQ0FBQztTQUM5QztRQUVELE9BQU8sb0JBQW9CLENBQUM7SUFDOUIsQ0FBQztJQTlCRCxvREE4QkM7SUFFRDs7O09BR0c7SUFDSCxTQUFTLHlCQUF5QixDQUM5QixJQUF5QixFQUFFLFdBQTJCO1FBQ3hELElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUU7WUFDL0MsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELE1BQU0sU0FBUyxHQUFHLG9DQUFvQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDO2FBQzdDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssV0FBVyxJQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUssV0FBVyxDQUFDLENBQUM7UUFFbkYsK0VBQStFO1FBQy9FLHdFQUF3RTtRQUN4RSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2QsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBRWhELHVFQUF1RTtRQUN2RSxxRUFBcUU7UUFDckUsd0VBQXdFO1FBQ3hFLHNEQUFzRDtRQUN0RCxJQUFJLENBQUMsRUFBRSxDQUFDLHlCQUF5QixDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUM3RCxPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsTUFBTSxRQUFRLEdBQUcsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQStCLENBQUM7UUFDMUUsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLG9CQUFvQixDQUFDO2FBQzlDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLG1DQUFtQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxRQUFRLENBQUMsQ0FBQztRQUV4RSxtRUFBbUU7UUFDbkUsa0VBQWtFO1FBQ2xFLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsd0JBQXdCLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQy9ELE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxPQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsbUJBQW1CLENBQUM7YUFDNUQsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUN6RCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7Z2V0QW5ndWxhckRlY29yYXRvcnN9IGZyb20gJy4uLy4uLy4uL3V0aWxzL25nX2RlY29yYXRvcnMnO1xuaW1wb3J0IHtnZXRQcm9wZXJ0eU5hbWVUZXh0LCBoYXNQcm9wZXJ0eU5hbWVUZXh0fSBmcm9tICcuLi8uLi8uLi91dGlscy90eXBlc2NyaXB0L3Byb3BlcnR5X25hbWUnO1xuXG4vKiogQW5hbHl6ZXMgdGhlIGdpdmVuIGNsYXNzIGFuZCByZXNvbHZlcyB0aGUgbmFtZSBvZiBhbGwgaW5wdXRzIHdoaWNoIGFyZSBkZWNsYXJlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbnB1dE5hbWVzT2ZDbGFzcyhcbiAgICBub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IHJlc29sdmVkSW5wdXRTZXR0ZXJzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIC8vIERldGVybWluZXMgdGhlIG5hbWVzIG9mIGFsbCBpbnB1dHMgZGVmaW5lZCBpbiB0aGUgY3VycmVudCBjbGFzcyBkZWNsYXJhdGlvbiBieVxuICAvLyBjaGVja2luZyB3aGV0aGVyIGEgZ2l2ZW4gcHJvcGVydHkvZ2V0dGVyL3NldHRlciBoYXMgdGhlIFwiQElucHV0XCIgZGVjb3JhdG9yIGFwcGxpZWQuXG4gIG5vZGUubWVtYmVycy5mb3JFYWNoKG0gPT4ge1xuICAgIGlmICghbS5kZWNvcmF0b3JzIHx8ICFtLmRlY29yYXRvcnMubGVuZ3RoIHx8XG4gICAgICAgICF0cy5pc1Byb3BlcnR5RGVjbGFyYXRpb24obSkgJiYgIXRzLmlzU2V0QWNjZXNzb3IobSkgJiYgIXRzLmlzR2V0QWNjZXNzb3IobSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpbnB1dERlY29yYXRvciA9XG4gICAgICAgIGdldEFuZ3VsYXJEZWNvcmF0b3JzKHR5cGVDaGVja2VyLCBtLmRlY29yYXRvcnMgISkuZmluZChkID0+IGQubmFtZSA9PT0gJ0lucHV0Jyk7XG5cbiAgICBpZiAoaW5wdXREZWNvcmF0b3IgJiYgaGFzUHJvcGVydHlOYW1lVGV4dChtLm5hbWUpKSB7XG4gICAgICByZXNvbHZlZElucHV0U2V0dGVycy5wdXNoKG0ubmFtZS50ZXh0KTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIEJlc2lkZXMgbG9va2luZyBmb3IgaW1tZWRpYXRlIHNldHRlcnMgaW4gdGhlIGN1cnJlbnQgY2xhc3MgZGVjbGFyYXRpb24sIGRldmVsb3BlcnNcbiAgLy8gY2FuIGFsc28gZGVmaW5lIGlucHV0cyBpbiB0aGUgZGlyZWN0aXZlIG1ldGFkYXRhIHVzaW5nIHRoZSBcImlucHV0c1wiIHByb3BlcnR5LiBXZVxuICAvLyBhbHNvIG5lZWQgdG8gZGV0ZXJtaW5lIHRoZXNlIGlucHV0cyB3aGljaCBhcmUgZGVjbGFyZWQgaW4gdGhlIGRpcmVjdGl2ZSBtZXRhZGF0YS5cbiAgY29uc3QgbWV0YWRhdGFJbnB1dHMgPSBnZXRJbnB1dE5hbWVzRnJvbU1ldGFkYXRhKG5vZGUsIHR5cGVDaGVja2VyKTtcblxuICBpZiAobWV0YWRhdGFJbnB1dHMpIHtcbiAgICByZXNvbHZlZElucHV0U2V0dGVycy5wdXNoKC4uLm1ldGFkYXRhSW5wdXRzKTtcbiAgfVxuXG4gIHJldHVybiByZXNvbHZlZElucHV0U2V0dGVycztcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHRoZSBuYW1lcyBvZiBhbGwgaW5wdXRzIGRlY2xhcmVkIGluIHRoZSBkaXJlY3RpdmUvY29tcG9uZW50IG1ldGFkYXRhXG4gKiBvZiB0aGUgZ2l2ZW4gY2xhc3MuXG4gKi9cbmZ1bmN0aW9uIGdldElucHV0TmFtZXNGcm9tTWV0YWRhdGEoXG4gICAgbm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyKTogc3RyaW5nW118bnVsbCB7XG4gIGlmICghbm9kZS5kZWNvcmF0b3JzIHx8ICFub2RlLmRlY29yYXRvcnMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBkZWNvcmF0b3IgPSBnZXRBbmd1bGFyRGVjb3JhdG9ycyh0eXBlQ2hlY2tlciwgbm9kZS5kZWNvcmF0b3JzKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbmQoZCA9PiBkLm5hbWUgPT09ICdEaXJlY3RpdmUnIHx8IGQubmFtZSA9PT0gJ0NvbXBvbmVudCcpO1xuXG4gIC8vIEluIGNhc2Ugbm8gZGlyZWN0aXZlL2NvbXBvbmVudCBkZWNvcmF0b3IgY291bGQgYmUgZm91bmQgZm9yIHRoaXMgY2xhc3MsIGp1c3RcbiAgLy8gcmV0dXJuIG51bGwgYXMgdGhlcmUgaXMgbm8gbWV0YWRhdGEgd2hlcmUgYW4gaW5wdXQgY291bGQgYmUgZGVjbGFyZWQuXG4gIGlmICghZGVjb3JhdG9yKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBkZWNvcmF0b3JDYWxsID0gZGVjb3JhdG9yLm5vZGUuZXhwcmVzc2lvbjtcblxuICAvLyBJbiBjYXNlIHRoZSBkZWNvcmF0b3IgZG9lcyBkZWZpbmUgYW55IG1ldGFkYXRhLCB0aGVyZSBpcyBubyBtZXRhZGF0YVxuICAvLyB3aGVyZSBpbnB1dHMgY291bGQgYmUgZGVjbGFyZWQuIFRoaXMgaXMgYW4gZWRnZSBjYXNlIGJlY2F1c2UgdGhlcmVcbiAgLy8gYWx3YXlzIG5lZWRzIHRvIGJlIGFuIG9iamVjdCBsaXRlcmFsLCBidXQgaW4gY2FzZSB0aGVyZSBpc24ndCB3ZSBqdXN0XG4gIC8vIHdhbnQgdG8gc2tpcCB0aGUgaW52YWxpZCBkZWNvcmF0b3IgYW5kIHJldHVybiBudWxsLlxuICBpZiAoIXRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24oZGVjb3JhdG9yQ2FsbC5hcmd1bWVudHNbMF0pKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBtZXRhZGF0YSA9IGRlY29yYXRvckNhbGwuYXJndW1lbnRzWzBdIGFzIHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uO1xuICBjb25zdCBpbnB1dHMgPSBtZXRhZGF0YS5wcm9wZXJ0aWVzLmZpbHRlcih0cy5pc1Byb3BlcnR5QXNzaWdubWVudClcbiAgICAgICAgICAgICAgICAgICAgIC5maW5kKHAgPT4gZ2V0UHJvcGVydHlOYW1lVGV4dChwLm5hbWUpID09PSAnaW5wdXRzJyk7XG5cbiAgLy8gSW4gY2FzZSB0aGVyZSBpcyBubyBcImlucHV0c1wiIHByb3BlcnR5IGluIHRoZSBkaXJlY3RpdmUgbWV0YWRhdGEsXG4gIC8vIGp1c3QgcmV0dXJuIFwibnVsbFwiIGFzIG5vIGlucHV0cyBjYW4gYmUgZGVjbGFyZWQgZm9yIHRoaXMgY2xhc3MuXG4gIGlmICghaW5wdXRzIHx8ICF0cy5pc0FycmF5TGl0ZXJhbEV4cHJlc3Npb24oaW5wdXRzLmluaXRpYWxpemVyKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIGlucHV0cy5pbml0aWFsaXplci5lbGVtZW50cy5maWx0ZXIodHMuaXNTdHJpbmdMaXRlcmFsTGlrZSlcbiAgICAgIC5tYXAoZWxlbWVudCA9PiBlbGVtZW50LnRleHQuc3BsaXQoJzonKVswXS50cmltKCkpO1xufVxuIl19