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
        define("@angular/core/schematics/migrations/static-queries/angular/directive_inputs", ["require", "exports", "typescript", "@angular/core/schematics/migrations/static-queries/typescript/property_name", "@angular/core/schematics/migrations/static-queries/angular/decorators"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const property_name_1 = require("@angular/core/schematics/migrations/static-queries/typescript/property_name");
    const decorators_1 = require("@angular/core/schematics/migrations/static-queries/angular/decorators");
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
            const inputDecorator = decorators_1.getAngularDecorators(typeChecker, m.decorators).find(d => d.name === 'Input');
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
        const decorator = decorators_1.getAngularDecorators(typeChecker, node.decorators)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlX2lucHV0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL2FuZ3VsYXIvZGlyZWN0aXZlX2lucHV0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUVqQywrR0FBcUY7SUFDckYsc0dBQWtEO0lBRWxELHVGQUF1RjtJQUN2RixTQUFnQixvQkFBb0IsQ0FDaEMsSUFBeUIsRUFBRSxXQUEyQjtRQUN4RCxNQUFNLG9CQUFvQixHQUFhLEVBQUUsQ0FBQztRQUUxQyxpRkFBaUY7UUFDakYsc0ZBQXNGO1FBQ3RGLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ3ZCLElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNO2dCQUNyQyxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNoRixPQUFPO2FBQ1I7WUFFRCxNQUFNLGNBQWMsR0FDaEIsaUNBQW9CLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxVQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLE9BQU8sQ0FBQyxDQUFDO1lBRXBGLElBQUksY0FBYyxJQUFJLG1DQUFtQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDakQsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDeEM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILHFGQUFxRjtRQUNyRixtRkFBbUY7UUFDbkYsb0ZBQW9GO1FBQ3BGLE1BQU0sY0FBYyxHQUFHLHlCQUF5QixDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztRQUVwRSxJQUFJLGNBQWMsRUFBRTtZQUNsQixvQkFBb0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxjQUFjLENBQUMsQ0FBQztTQUM5QztRQUVELE9BQU8sb0JBQW9CLENBQUM7SUFDOUIsQ0FBQztJQTlCRCxvREE4QkM7SUFFRDs7O09BR0c7SUFDSCxTQUFTLHlCQUF5QixDQUM5QixJQUF5QixFQUFFLFdBQTJCO1FBQ3hELElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUU7WUFDL0MsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELE1BQU0sU0FBUyxHQUFHLGlDQUFvQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDO2FBQzdDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssV0FBVyxJQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUssV0FBVyxDQUFDLENBQUM7UUFFbkYsK0VBQStFO1FBQy9FLHdFQUF3RTtRQUN4RSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2QsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBK0IsQ0FBQztRQUVyRSx1RUFBdUU7UUFDdkUscUVBQXFFO1FBQ3JFLHdFQUF3RTtRQUN4RSxzREFBc0Q7UUFDdEQsSUFBSSxDQUFDLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDN0QsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELE1BQU0sUUFBUSxHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUErQixDQUFDO1FBQzFFLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQzthQUM5QyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxtQ0FBbUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssUUFBUSxDQUFDLENBQUM7UUFFeEUsbUVBQW1FO1FBQ25FLGtFQUFrRTtRQUNsRSxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUMvRCxPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsT0FBTyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLG1CQUFtQixDQUFDO2FBQzVELEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7SUFDekQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Z2V0UHJvcGVydHlOYW1lVGV4dCwgaGFzUHJvcGVydHlOYW1lVGV4dH0gZnJvbSAnLi4vdHlwZXNjcmlwdC9wcm9wZXJ0eV9uYW1lJztcbmltcG9ydCB7Z2V0QW5ndWxhckRlY29yYXRvcnN9IGZyb20gJy4vZGVjb3JhdG9ycyc7XG5cbi8qKiBBbmFseXplcyB0aGUgZ2l2ZW4gY2xhc3MgYW5kIHJlc29sdmVzIHRoZSBuYW1lIG9mIGFsbCBpbnB1dHMgd2hpY2ggYXJlIGRlY2xhcmVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldElucHV0TmFtZXNPZkNsYXNzKFxuICAgIG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24sIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcik6IHN0cmluZ1tdIHtcbiAgY29uc3QgcmVzb2x2ZWRJbnB1dFNldHRlcnM6IHN0cmluZ1tdID0gW107XG5cbiAgLy8gRGV0ZXJtaW5lcyB0aGUgbmFtZXMgb2YgYWxsIGlucHV0cyBkZWZpbmVkIGluIHRoZSBjdXJyZW50IGNsYXNzIGRlY2xhcmF0aW9uIGJ5XG4gIC8vIGNoZWNraW5nIHdoZXRoZXIgYSBnaXZlbiBwcm9wZXJ0eS9nZXR0ZXIvc2V0dGVyIGhhcyB0aGUgXCJASW5wdXRcIiBkZWNvcmF0b3IgYXBwbGllZC5cbiAgbm9kZS5tZW1iZXJzLmZvckVhY2gobSA9PiB7XG4gICAgaWYgKCFtLmRlY29yYXRvcnMgfHwgIW0uZGVjb3JhdG9ycy5sZW5ndGggfHxcbiAgICAgICAgIXRzLmlzUHJvcGVydHlEZWNsYXJhdGlvbihtKSAmJiAhdHMuaXNTZXRBY2Nlc3NvcihtKSAmJiAhdHMuaXNHZXRBY2Nlc3NvcihtKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGlucHV0RGVjb3JhdG9yID1cbiAgICAgICAgZ2V0QW5ndWxhckRlY29yYXRvcnModHlwZUNoZWNrZXIsIG0uZGVjb3JhdG9ycyAhKS5maW5kKGQgPT4gZC5uYW1lID09PSAnSW5wdXQnKTtcblxuICAgIGlmIChpbnB1dERlY29yYXRvciAmJiBoYXNQcm9wZXJ0eU5hbWVUZXh0KG0ubmFtZSkpIHtcbiAgICAgIHJlc29sdmVkSW5wdXRTZXR0ZXJzLnB1c2gobS5uYW1lLnRleHQpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gQmVzaWRlcyBsb29raW5nIGZvciBpbW1lZGlhdGUgc2V0dGVycyBpbiB0aGUgY3VycmVudCBjbGFzcyBkZWNsYXJhdGlvbiwgZGV2ZWxvcGVyc1xuICAvLyBjYW4gYWxzbyBkZWZpbmUgaW5wdXRzIGluIHRoZSBkaXJlY3RpdmUgbWV0YWRhdGEgdXNpbmcgdGhlIFwiaW5wdXRzXCIgcHJvcGVydHkuIFdlXG4gIC8vIGFsc28gbmVlZCB0byBkZXRlcm1pbmUgdGhlc2UgaW5wdXRzIHdoaWNoIGFyZSBkZWNsYXJlZCBpbiB0aGUgZGlyZWN0aXZlIG1ldGFkYXRhLlxuICBjb25zdCBtZXRhZGF0YUlucHV0cyA9IGdldElucHV0TmFtZXNGcm9tTWV0YWRhdGEobm9kZSwgdHlwZUNoZWNrZXIpO1xuXG4gIGlmIChtZXRhZGF0YUlucHV0cykge1xuICAgIHJlc29sdmVkSW5wdXRTZXR0ZXJzLnB1c2goLi4ubWV0YWRhdGFJbnB1dHMpO1xuICB9XG5cbiAgcmV0dXJuIHJlc29sdmVkSW5wdXRTZXR0ZXJzO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgdGhlIG5hbWVzIG9mIGFsbCBpbnB1dHMgZGVjbGFyZWQgaW4gdGhlIGRpcmVjdGl2ZS9jb21wb25lbnQgbWV0YWRhdGFcbiAqIG9mIHRoZSBnaXZlbiBjbGFzcy5cbiAqL1xuZnVuY3Rpb24gZ2V0SW5wdXROYW1lc0Zyb21NZXRhZGF0YShcbiAgICBub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIpOiBzdHJpbmdbXXxudWxsIHtcbiAgaWYgKCFub2RlLmRlY29yYXRvcnMgfHwgIW5vZGUuZGVjb3JhdG9ycy5sZW5ndGgpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IGRlY29yYXRvciA9IGdldEFuZ3VsYXJEZWNvcmF0b3JzKHR5cGVDaGVja2VyLCBub2RlLmRlY29yYXRvcnMpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmluZChkID0+IGQubmFtZSA9PT0gJ0RpcmVjdGl2ZScgfHwgZC5uYW1lID09PSAnQ29tcG9uZW50Jyk7XG5cbiAgLy8gSW4gY2FzZSBubyBkaXJlY3RpdmUvY29tcG9uZW50IGRlY29yYXRvciBjb3VsZCBiZSBmb3VuZCBmb3IgdGhpcyBjbGFzcywganVzdFxuICAvLyByZXR1cm4gbnVsbCBhcyB0aGVyZSBpcyBubyBtZXRhZGF0YSB3aGVyZSBhbiBpbnB1dCBjb3VsZCBiZSBkZWNsYXJlZC5cbiAgaWYgKCFkZWNvcmF0b3IpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IGRlY29yYXRvckNhbGwgPSBkZWNvcmF0b3Iubm9kZS5leHByZXNzaW9uIGFzIHRzLkNhbGxFeHByZXNzaW9uO1xuXG4gIC8vIEluIGNhc2UgdGhlIGRlY29yYXRvciBkb2VzIGRlZmluZSBhbnkgbWV0YWRhdGEsIHRoZXJlIGlzIG5vIG1ldGFkYXRhXG4gIC8vIHdoZXJlIGlucHV0cyBjb3VsZCBiZSBkZWNsYXJlZC4gVGhpcyBpcyBhbiBlZGdlIGNhc2UgYmVjYXVzZSB0aGVyZVxuICAvLyBhbHdheXMgbmVlZHMgdG8gYmUgYW4gb2JqZWN0IGxpdGVyYWwsIGJ1dCBpbiBjYXNlIHRoZXJlIGlzbid0IHdlIGp1c3RcbiAgLy8gd2FudCB0byBza2lwIHRoZSBpbnZhbGlkIGRlY29yYXRvciBhbmQgcmV0dXJuIG51bGwuXG4gIGlmICghdHMuaXNPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihkZWNvcmF0b3JDYWxsLmFyZ3VtZW50c1swXSkpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IG1ldGFkYXRhID0gZGVjb3JhdG9yQ2FsbC5hcmd1bWVudHNbMF0gYXMgdHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb247XG4gIGNvbnN0IGlucHV0cyA9IG1ldGFkYXRhLnByb3BlcnRpZXMuZmlsdGVyKHRzLmlzUHJvcGVydHlBc3NpZ25tZW50KVxuICAgICAgICAgICAgICAgICAgICAgLmZpbmQocCA9PiBnZXRQcm9wZXJ0eU5hbWVUZXh0KHAubmFtZSkgPT09ICdpbnB1dHMnKTtcblxuICAvLyBJbiBjYXNlIHRoZXJlIGlzIG5vIFwiaW5wdXRzXCIgcHJvcGVydHkgaW4gdGhlIGRpcmVjdGl2ZSBtZXRhZGF0YSxcbiAgLy8ganVzdCByZXR1cm4gXCJudWxsXCIgYXMgbm8gaW5wdXRzIGNhbiBiZSBkZWNsYXJlZCBmb3IgdGhpcyBjbGFzcy5cbiAgaWYgKCFpbnB1dHMgfHwgIXRzLmlzQXJyYXlMaXRlcmFsRXhwcmVzc2lvbihpbnB1dHMuaW5pdGlhbGl6ZXIpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gaW5wdXRzLmluaXRpYWxpemVyLmVsZW1lbnRzLmZpbHRlcih0cy5pc1N0cmluZ0xpdGVyYWxMaWtlKVxuICAgICAgLm1hcChlbGVtZW50ID0+IGVsZW1lbnQudGV4dC5zcGxpdCgnOicpWzBdLnRyaW0oKSk7XG59XG4iXX0=