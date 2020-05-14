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
        if (decoratorCall.arguments.length !== 1 ||
            !ts.isObjectLiteralExpression(decoratorCall.arguments[0])) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlX2lucHV0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL2FuZ3VsYXIvZGlyZWN0aXZlX2lucHV0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCxpQ0FBaUM7SUFDakMsZ0ZBQWtFO0lBQ2xFLDJGQUFpRztJQUVqRyx1RkFBdUY7SUFDdkYsU0FBZ0Isb0JBQW9CLENBQ2hDLElBQXlCLEVBQUUsV0FBMkI7UUFDeEQsTUFBTSxvQkFBb0IsR0FBYSxFQUFFLENBQUM7UUFFMUMsaUZBQWlGO1FBQ2pGLHNGQUFzRjtRQUN0RixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUN2QixJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTTtnQkFDckMsQ0FBQyxFQUFFLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDaEYsT0FBTzthQUNSO1lBRUQsTUFBTSxjQUFjLEdBQ2hCLG9DQUFvQixDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsVUFBVyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxPQUFPLENBQUMsQ0FBQztZQUVuRixJQUFJLGNBQWMsSUFBSSxtQ0FBbUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ2pELG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3hDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxxRkFBcUY7UUFDckYsbUZBQW1GO1FBQ25GLG9GQUFvRjtRQUNwRixNQUFNLGNBQWMsR0FBRyx5QkFBeUIsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFFcEUsSUFBSSxjQUFjLEVBQUU7WUFDbEIsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEdBQUcsY0FBYyxDQUFDLENBQUM7U0FDOUM7UUFFRCxPQUFPLG9CQUFvQixDQUFDO0lBQzlCLENBQUM7SUE5QkQsb0RBOEJDO0lBRUQ7OztPQUdHO0lBQ0gsU0FBUyx5QkFBeUIsQ0FDOUIsSUFBeUIsRUFBRSxXQUEyQjtRQUN4RCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFO1lBQy9DLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxNQUFNLFNBQVMsR0FBRyxvQ0FBb0IsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQzthQUM3QyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLFdBQVcsSUFBSSxDQUFDLENBQUMsSUFBSSxLQUFLLFdBQVcsQ0FBQyxDQUFDO1FBRW5GLCtFQUErRTtRQUMvRSx3RUFBd0U7UUFDeEUsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNkLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUVoRCx1RUFBdUU7UUFDdkUscUVBQXFFO1FBQ3JFLHdFQUF3RTtRQUN4RSxzREFBc0Q7UUFDdEQsSUFBSSxhQUFhLENBQUMsU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDO1lBQ3BDLENBQUMsRUFBRSxDQUFDLHlCQUF5QixDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUM3RCxPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsTUFBTSxRQUFRLEdBQUcsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQStCLENBQUM7UUFDMUUsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLG9CQUFvQixDQUFDO2FBQzlDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLG1DQUFtQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxRQUFRLENBQUMsQ0FBQztRQUV4RSxtRUFBbUU7UUFDbkUsa0VBQWtFO1FBQ2xFLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsd0JBQXdCLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQy9ELE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxPQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsbUJBQW1CLENBQUM7YUFDNUQsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUN6RCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7Z2V0QW5ndWxhckRlY29yYXRvcnN9IGZyb20gJy4uLy4uLy4uL3V0aWxzL25nX2RlY29yYXRvcnMnO1xuaW1wb3J0IHtnZXRQcm9wZXJ0eU5hbWVUZXh0LCBoYXNQcm9wZXJ0eU5hbWVUZXh0fSBmcm9tICcuLi8uLi8uLi91dGlscy90eXBlc2NyaXB0L3Byb3BlcnR5X25hbWUnO1xuXG4vKiogQW5hbHl6ZXMgdGhlIGdpdmVuIGNsYXNzIGFuZCByZXNvbHZlcyB0aGUgbmFtZSBvZiBhbGwgaW5wdXRzIHdoaWNoIGFyZSBkZWNsYXJlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbnB1dE5hbWVzT2ZDbGFzcyhcbiAgICBub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IHJlc29sdmVkSW5wdXRTZXR0ZXJzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIC8vIERldGVybWluZXMgdGhlIG5hbWVzIG9mIGFsbCBpbnB1dHMgZGVmaW5lZCBpbiB0aGUgY3VycmVudCBjbGFzcyBkZWNsYXJhdGlvbiBieVxuICAvLyBjaGVja2luZyB3aGV0aGVyIGEgZ2l2ZW4gcHJvcGVydHkvZ2V0dGVyL3NldHRlciBoYXMgdGhlIFwiQElucHV0XCIgZGVjb3JhdG9yIGFwcGxpZWQuXG4gIG5vZGUubWVtYmVycy5mb3JFYWNoKG0gPT4ge1xuICAgIGlmICghbS5kZWNvcmF0b3JzIHx8ICFtLmRlY29yYXRvcnMubGVuZ3RoIHx8XG4gICAgICAgICF0cy5pc1Byb3BlcnR5RGVjbGFyYXRpb24obSkgJiYgIXRzLmlzU2V0QWNjZXNzb3IobSkgJiYgIXRzLmlzR2V0QWNjZXNzb3IobSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpbnB1dERlY29yYXRvciA9XG4gICAgICAgIGdldEFuZ3VsYXJEZWNvcmF0b3JzKHR5cGVDaGVja2VyLCBtLmRlY29yYXRvcnMhKS5maW5kKGQgPT4gZC5uYW1lID09PSAnSW5wdXQnKTtcblxuICAgIGlmIChpbnB1dERlY29yYXRvciAmJiBoYXNQcm9wZXJ0eU5hbWVUZXh0KG0ubmFtZSkpIHtcbiAgICAgIHJlc29sdmVkSW5wdXRTZXR0ZXJzLnB1c2gobS5uYW1lLnRleHQpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gQmVzaWRlcyBsb29raW5nIGZvciBpbW1lZGlhdGUgc2V0dGVycyBpbiB0aGUgY3VycmVudCBjbGFzcyBkZWNsYXJhdGlvbiwgZGV2ZWxvcGVyc1xuICAvLyBjYW4gYWxzbyBkZWZpbmUgaW5wdXRzIGluIHRoZSBkaXJlY3RpdmUgbWV0YWRhdGEgdXNpbmcgdGhlIFwiaW5wdXRzXCIgcHJvcGVydHkuIFdlXG4gIC8vIGFsc28gbmVlZCB0byBkZXRlcm1pbmUgdGhlc2UgaW5wdXRzIHdoaWNoIGFyZSBkZWNsYXJlZCBpbiB0aGUgZGlyZWN0aXZlIG1ldGFkYXRhLlxuICBjb25zdCBtZXRhZGF0YUlucHV0cyA9IGdldElucHV0TmFtZXNGcm9tTWV0YWRhdGEobm9kZSwgdHlwZUNoZWNrZXIpO1xuXG4gIGlmIChtZXRhZGF0YUlucHV0cykge1xuICAgIHJlc29sdmVkSW5wdXRTZXR0ZXJzLnB1c2goLi4ubWV0YWRhdGFJbnB1dHMpO1xuICB9XG5cbiAgcmV0dXJuIHJlc29sdmVkSW5wdXRTZXR0ZXJzO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgdGhlIG5hbWVzIG9mIGFsbCBpbnB1dHMgZGVjbGFyZWQgaW4gdGhlIGRpcmVjdGl2ZS9jb21wb25lbnQgbWV0YWRhdGFcbiAqIG9mIHRoZSBnaXZlbiBjbGFzcy5cbiAqL1xuZnVuY3Rpb24gZ2V0SW5wdXROYW1lc0Zyb21NZXRhZGF0YShcbiAgICBub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIpOiBzdHJpbmdbXXxudWxsIHtcbiAgaWYgKCFub2RlLmRlY29yYXRvcnMgfHwgIW5vZGUuZGVjb3JhdG9ycy5sZW5ndGgpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IGRlY29yYXRvciA9IGdldEFuZ3VsYXJEZWNvcmF0b3JzKHR5cGVDaGVja2VyLCBub2RlLmRlY29yYXRvcnMpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmluZChkID0+IGQubmFtZSA9PT0gJ0RpcmVjdGl2ZScgfHwgZC5uYW1lID09PSAnQ29tcG9uZW50Jyk7XG5cbiAgLy8gSW4gY2FzZSBubyBkaXJlY3RpdmUvY29tcG9uZW50IGRlY29yYXRvciBjb3VsZCBiZSBmb3VuZCBmb3IgdGhpcyBjbGFzcywganVzdFxuICAvLyByZXR1cm4gbnVsbCBhcyB0aGVyZSBpcyBubyBtZXRhZGF0YSB3aGVyZSBhbiBpbnB1dCBjb3VsZCBiZSBkZWNsYXJlZC5cbiAgaWYgKCFkZWNvcmF0b3IpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IGRlY29yYXRvckNhbGwgPSBkZWNvcmF0b3Iubm9kZS5leHByZXNzaW9uO1xuXG4gIC8vIEluIGNhc2UgdGhlIGRlY29yYXRvciBkb2VzIGRlZmluZSBhbnkgbWV0YWRhdGEsIHRoZXJlIGlzIG5vIG1ldGFkYXRhXG4gIC8vIHdoZXJlIGlucHV0cyBjb3VsZCBiZSBkZWNsYXJlZC4gVGhpcyBpcyBhbiBlZGdlIGNhc2UgYmVjYXVzZSB0aGVyZVxuICAvLyBhbHdheXMgbmVlZHMgdG8gYmUgYW4gb2JqZWN0IGxpdGVyYWwsIGJ1dCBpbiBjYXNlIHRoZXJlIGlzbid0IHdlIGp1c3RcbiAgLy8gd2FudCB0byBza2lwIHRoZSBpbnZhbGlkIGRlY29yYXRvciBhbmQgcmV0dXJuIG51bGwuXG4gIGlmIChkZWNvcmF0b3JDYWxsLmFyZ3VtZW50cy5sZW5ndGggIT09IDEgfHxcbiAgICAgICF0cy5pc09iamVjdExpdGVyYWxFeHByZXNzaW9uKGRlY29yYXRvckNhbGwuYXJndW1lbnRzWzBdKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgbWV0YWRhdGEgPSBkZWNvcmF0b3JDYWxsLmFyZ3VtZW50c1swXSBhcyB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbjtcbiAgY29uc3QgaW5wdXRzID0gbWV0YWRhdGEucHJvcGVydGllcy5maWx0ZXIodHMuaXNQcm9wZXJ0eUFzc2lnbm1lbnQpXG4gICAgICAgICAgICAgICAgICAgICAuZmluZChwID0+IGdldFByb3BlcnR5TmFtZVRleHQocC5uYW1lKSA9PT0gJ2lucHV0cycpO1xuXG4gIC8vIEluIGNhc2UgdGhlcmUgaXMgbm8gXCJpbnB1dHNcIiBwcm9wZXJ0eSBpbiB0aGUgZGlyZWN0aXZlIG1ldGFkYXRhLFxuICAvLyBqdXN0IHJldHVybiBcIm51bGxcIiBhcyBubyBpbnB1dHMgY2FuIGJlIGRlY2xhcmVkIGZvciB0aGlzIGNsYXNzLlxuICBpZiAoIWlucHV0cyB8fCAhdHMuaXNBcnJheUxpdGVyYWxFeHByZXNzaW9uKGlucHV0cy5pbml0aWFsaXplcikpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiBpbnB1dHMuaW5pdGlhbGl6ZXIuZWxlbWVudHMuZmlsdGVyKHRzLmlzU3RyaW5nTGl0ZXJhbExpa2UpXG4gICAgICAubWFwKGVsZW1lbnQgPT4gZWxlbWVudC50ZXh0LnNwbGl0KCc6JylbMF0udHJpbSgpKTtcbn1cbiJdfQ==