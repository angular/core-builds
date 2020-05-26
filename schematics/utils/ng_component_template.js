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
        define("@angular/core/schematics/utils/ng_component_template", ["require", "exports", "fs", "path", "typescript", "@angular/core/schematics/utils/line_mappings", "@angular/core/schematics/utils/ng_decorators", "@angular/core/schematics/utils/typescript/functions", "@angular/core/schematics/utils/typescript/property_name"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NgComponentTemplateVisitor = void 0;
    const fs_1 = require("fs");
    const path_1 = require("path");
    const ts = require("typescript");
    const line_mappings_1 = require("@angular/core/schematics/utils/line_mappings");
    const ng_decorators_1 = require("@angular/core/schematics/utils/ng_decorators");
    const functions_1 = require("@angular/core/schematics/utils/typescript/functions");
    const property_name_1 = require("@angular/core/schematics/utils/typescript/property_name");
    /**
     * Visitor that can be used to determine Angular templates referenced within given
     * TypeScript source files (inline templates or external referenced templates)
     */
    class NgComponentTemplateVisitor {
        constructor(typeChecker) {
            this.typeChecker = typeChecker;
            this.resolvedTemplates = [];
        }
        visitNode(node) {
            if (node.kind === ts.SyntaxKind.ClassDeclaration) {
                this.visitClassDeclaration(node);
            }
            ts.forEachChild(node, n => this.visitNode(n));
        }
        visitClassDeclaration(node) {
            if (!node.decorators || !node.decorators.length) {
                return;
            }
            const ngDecorators = ng_decorators_1.getAngularDecorators(this.typeChecker, node.decorators);
            const componentDecorator = ngDecorators.find(dec => dec.name === 'Component');
            // In case no "@Component" decorator could be found on the current class, skip.
            if (!componentDecorator) {
                return;
            }
            const decoratorCall = componentDecorator.node.expression;
            // In case the component decorator call is not valid, skip this class declaration.
            if (decoratorCall.arguments.length !== 1) {
                return;
            }
            const componentMetadata = functions_1.unwrapExpression(decoratorCall.arguments[0]);
            // Ensure that the component metadata is an object literal expression.
            if (!ts.isObjectLiteralExpression(componentMetadata)) {
                return;
            }
            const sourceFile = node.getSourceFile();
            const sourceFileName = sourceFile.fileName;
            // Walk through all component metadata properties and determine the referenced
            // HTML templates (either external or inline)
            componentMetadata.properties.forEach(property => {
                if (!ts.isPropertyAssignment(property)) {
                    return;
                }
                const propertyName = property_name_1.getPropertyNameText(property.name);
                // In case there is an inline template specified, ensure that the value is statically
                // analyzable by checking if the initializer is a string literal-like node.
                if (propertyName === 'template' && ts.isStringLiteralLike(property.initializer)) {
                    // Need to add an offset of one to the start because the template quotes are
                    // not part of the template content.
                    const templateStartIdx = property.initializer.getStart() + 1;
                    const filePath = path_1.resolve(sourceFileName);
                    this.resolvedTemplates.push({
                        filePath: filePath,
                        container: node,
                        content: property.initializer.text,
                        inline: true,
                        start: templateStartIdx,
                        getCharacterAndLineOfPosition: pos => ts.getLineAndCharacterOfPosition(sourceFile, pos + templateStartIdx)
                    });
                }
                if (propertyName === 'templateUrl' && ts.isStringLiteralLike(property.initializer)) {
                    const templatePath = path_1.resolve(path_1.dirname(sourceFileName), property.initializer.text);
                    // In case the template does not exist in the file system, skip this
                    // external template.
                    if (!fs_1.existsSync(templatePath)) {
                        return;
                    }
                    const fileContent = fs_1.readFileSync(templatePath, 'utf8');
                    const lineStartsMap = line_mappings_1.computeLineStartsMap(fileContent);
                    this.resolvedTemplates.push({
                        filePath: templatePath,
                        container: node,
                        content: fileContent,
                        inline: false,
                        start: 0,
                        getCharacterAndLineOfPosition: pos => line_mappings_1.getLineAndCharacterFromPosition(lineStartsMap, pos),
                    });
                }
            });
        }
    }
    exports.NgComponentTemplateVisitor = NgComponentTemplateVisitor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfY29tcG9uZW50X3RlbXBsYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL3V0aWxzL25nX2NvbXBvbmVudF90ZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCwyQkFBNEM7SUFDNUMsK0JBQXNDO0lBQ3RDLGlDQUFpQztJQUVqQyxnRkFBc0Y7SUFDdEYsZ0ZBQXFEO0lBQ3JELG1GQUF3RDtJQUN4RCwyRkFBK0Q7SUF1Qi9EOzs7T0FHRztJQUNILE1BQWEsMEJBQTBCO1FBR3JDLFlBQW1CLFdBQTJCO1lBQTNCLGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQUY5QyxzQkFBaUIsR0FBdUIsRUFBRSxDQUFDO1FBRU0sQ0FBQztRQUVsRCxTQUFTLENBQUMsSUFBYTtZQUNyQixJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRTtnQkFDaEQsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQTJCLENBQUMsQ0FBQzthQUN6RDtZQUVELEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFFTyxxQkFBcUIsQ0FBQyxJQUF5QjtZQUNyRCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFO2dCQUMvQyxPQUFPO2FBQ1I7WUFFRCxNQUFNLFlBQVksR0FBRyxvQ0FBb0IsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM3RSxNQUFNLGtCQUFrQixHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FB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cUJBQzFGLENBQUMsQ0FBQztpQkFDSjtZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUNGO0lBNUZELGdFQTRGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtleGlzdHNTeW5jLCByZWFkRmlsZVN5bmN9IGZyb20gJ2ZzJztcbmltcG9ydCB7ZGlybmFtZSwgcmVzb2x2ZX0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtjb21wdXRlTGluZVN0YXJ0c01hcCwgZ2V0TGluZUFuZENoYXJhY3RlckZyb21Qb3NpdGlvbn0gZnJvbSAnLi9saW5lX21hcHBpbmdzJztcbmltcG9ydCB7Z2V0QW5ndWxhckRlY29yYXRvcnN9IGZyb20gJy4vbmdfZGVjb3JhdG9ycyc7XG5pbXBvcnQge3Vud3JhcEV4cHJlc3Npb259IGZyb20gJy4vdHlwZXNjcmlwdC9mdW5jdGlvbnMnO1xuaW1wb3J0IHtnZXRQcm9wZXJ0eU5hbWVUZXh0fSBmcm9tICcuL3R5cGVzY3JpcHQvcHJvcGVydHlfbmFtZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVzb2x2ZWRUZW1wbGF0ZSB7XG4gIC8qKiBDbGFzcyBkZWNsYXJhdGlvbiB0aGF0IGNvbnRhaW5zIHRoaXMgdGVtcGxhdGUuICovXG4gIGNvbnRhaW5lcjogdHMuQ2xhc3NEZWNsYXJhdGlvbjtcbiAgLyoqIEZpbGUgY29udGVudCBvZiB0aGUgZ2l2ZW4gdGVtcGxhdGUuICovXG4gIGNvbnRlbnQ6IHN0cmluZztcbiAgLyoqIFN0YXJ0IG9mZnNldCBvZiB0aGUgdGVtcGxhdGUgY29udGVudCAoZS5nLiBpbiB0aGUgaW5saW5lIHNvdXJjZSBmaWxlKSAqL1xuICBzdGFydDogbnVtYmVyO1xuICAvKiogV2hldGhlciB0aGUgZ2l2ZW4gdGVtcGxhdGUgaXMgaW5saW5lIG9yIG5vdC4gKi9cbiAgaW5saW5lOiBib29sZWFuO1xuICAvKiogUGF0aCB0byB0aGUgZmlsZSB0aGF0IGNvbnRhaW5zIHRoaXMgdGVtcGxhdGUuICovXG4gIGZpbGVQYXRoOiBzdHJpbmc7XG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjaGFyYWN0ZXIgYW5kIGxpbmUgb2YgYSBnaXZlbiBwb3NpdGlvbiBpbmRleCBpbiB0aGUgdGVtcGxhdGUuXG4gICAqIElmIHRoZSB0ZW1wbGF0ZSBpcyBkZWNsYXJlZCBpbmxpbmUgd2l0aGluIGEgVHlwZVNjcmlwdCBzb3VyY2UgZmlsZSwgdGhlIGxpbmUgYW5kXG4gICAqIGNoYXJhY3RlciBhcmUgYmFzZWQgb24gdGhlIGZ1bGwgc291cmNlIGZpbGUgY29udGVudC5cbiAgICovXG4gIGdldENoYXJhY3RlckFuZExpbmVPZlBvc2l0aW9uOiAocG9zOiBudW1iZXIpID0+IHtcbiAgICBjaGFyYWN0ZXI6IG51bWJlciwgbGluZTogbnVtYmVyXG4gIH07XG59XG5cbi8qKlxuICogVmlzaXRvciB0aGF0IGNhbiBiZSB1c2VkIHRvIGRldGVybWluZSBBbmd1bGFyIHRlbXBsYXRlcyByZWZlcmVuY2VkIHdpdGhpbiBnaXZlblxuICogVHlwZVNjcmlwdCBzb3VyY2UgZmlsZXMgKGlubGluZSB0ZW1wbGF0ZXMgb3IgZXh0ZXJuYWwgcmVmZXJlbmNlZCB0ZW1wbGF0ZXMpXG4gKi9cbmV4cG9ydCBjbGFzcyBOZ0NvbXBvbmVudFRlbXBsYXRlVmlzaXRvciB7XG4gIHJlc29sdmVkVGVtcGxhdGVzOiBSZXNvbHZlZFRlbXBsYXRlW10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyKSB7fVxuXG4gIHZpc2l0Tm9kZShub2RlOiB0cy5Ob2RlKSB7XG4gICAgaWYgKG5vZGUua2luZCA9PT0gdHMuU3ludGF4S2luZC5DbGFzc0RlY2xhcmF0aW9uKSB7XG4gICAgICB0aGlzLnZpc2l0Q2xhc3NEZWNsYXJhdGlvbihub2RlIGFzIHRzLkNsYXNzRGVjbGFyYXRpb24pO1xuICAgIH1cblxuICAgIHRzLmZvckVhY2hDaGlsZChub2RlLCBuID0+IHRoaXMudmlzaXROb2RlKG4pKTtcbiAgfVxuXG4gIHByaXZhdGUgdmlzaXRDbGFzc0RlY2xhcmF0aW9uKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24pIHtcbiAgICBpZiAoIW5vZGUuZGVjb3JhdG9ycyB8fCAhbm9kZS5kZWNvcmF0b3JzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG5nRGVjb3JhdG9ycyA9IGdldEFuZ3VsYXJEZWNvcmF0b3JzKHRoaXMudHlwZUNoZWNrZXIsIG5vZGUuZGVjb3JhdG9ycyk7XG4gICAgY29uc3QgY29tcG9uZW50RGVjb3JhdG9yID0gbmdEZWNvcmF0b3JzLmZpbmQoZGVjID0+IGRlYy5uYW1lID09PSAnQ29tcG9uZW50Jyk7XG5cbiAgICAvLyBJbiBjYXNlIG5vIFwiQENvbXBvbmVudFwiIGRlY29yYXRvciBjb3VsZCBiZSBmb3VuZCBvbiB0aGUgY3VycmVudCBjbGFzcywgc2tpcC5cbiAgICBpZiAoIWNvbXBvbmVudERlY29yYXRvcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGRlY29yYXRvckNhbGwgPSBjb21wb25lbnREZWNvcmF0b3Iubm9kZS5leHByZXNzaW9uO1xuXG4gICAgLy8gSW4gY2FzZSB0aGUgY29tcG9uZW50IGRlY29yYXRvciBjYWxsIGlzIG5vdCB2YWxpZCwgc2tpcCB0aGlzIGNsYXNzIGRlY2xhcmF0aW9uLlxuICAgIGlmIChkZWNvcmF0b3JDYWxsLmFyZ3VtZW50cy5sZW5ndGggIT09IDEpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjb21wb25lbnRNZXRhZGF0YSA9IHVud3JhcEV4cHJlc3Npb24oZGVjb3JhdG9yQ2FsbC5hcmd1bWVudHNbMF0pO1xuXG4gICAgLy8gRW5zdXJlIHRoYXQgdGhlIGNvbXBvbmVudCBtZXRhZGF0YSBpcyBhbiBvYmplY3QgbGl0ZXJhbCBleHByZXNzaW9uLlxuICAgIGlmICghdHMuaXNPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihjb21wb25lbnRNZXRhZGF0YSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzb3VyY2VGaWxlID0gbm9kZS5nZXRTb3VyY2VGaWxlKCk7XG4gICAgY29uc3Qgc291cmNlRmlsZU5hbWUgPSBzb3VyY2VGaWxlLmZpbGVOYW1lO1xuXG4gICAgLy8gV2FsayB0aHJvdWdoIGFsbCBjb21wb25lbnQgbWV0YWRhdGEgcHJvcGVydGllcyBhbmQgZGV0ZXJtaW5lIHRoZSByZWZlcmVuY2VkXG4gICAgLy8gSFRNTCB0ZW1wbGF0ZXMgKGVpdGhlciBleHRlcm5hbCBvciBpbmxpbmUpXG4gICAgY29tcG9uZW50TWV0YWRhdGEucHJvcGVydGllcy5mb3JFYWNoKHByb3BlcnR5ID0+IHtcbiAgICAgIGlmICghdHMuaXNQcm9wZXJ0eUFzc2lnbm1lbnQocHJvcGVydHkpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcHJvcGVydHlOYW1lID0gZ2V0UHJvcGVydHlOYW1lVGV4dChwcm9wZXJ0eS5uYW1lKTtcblxuICAgICAgLy8gSW4gY2FzZSB0aGVyZSBpcyBhbiBpbmxpbmUgdGVtcGxhdGUgc3BlY2lmaWVkLCBlbnN1cmUgdGhhdCB0aGUgdmFsdWUgaXMgc3RhdGljYWxseVxuICAgICAgLy8gYW5hbHl6YWJsZSBieSBjaGVja2luZyBpZiB0aGUgaW5pdGlhbGl6ZXIgaXMgYSBzdHJpbmcgbGl0ZXJhbC1saWtlIG5vZGUuXG4gICAgICBpZiAocHJvcGVydHlOYW1lID09PSAndGVtcGxhdGUnICYmIHRzLmlzU3RyaW5nTGl0ZXJhbExpa2UocHJvcGVydHkuaW5pdGlhbGl6ZXIpKSB7XG4gICAgICAgIC8vIE5lZWQgdG8gYWRkIGFuIG9mZnNldCBvZiBvbmUgdG8gdGhlIHN0YXJ0IGJlY2F1c2UgdGhlIHRlbXBsYXRlIHF1b3RlcyBhcmVcbiAgICAgICAgLy8gbm90IHBhcnQgb2YgdGhlIHRlbXBsYXRlIGNvbnRlbnQuXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlU3RhcnRJZHggPSBwcm9wZXJ0eS5pbml0aWFsaXplci5nZXRTdGFydCgpICsgMTtcbiAgICAgICAgY29uc3QgZmlsZVBhdGggPSByZXNvbHZlKHNvdXJjZUZpbGVOYW1lKTtcbiAgICAgICAgdGhpcy5yZXNvbHZlZFRlbXBsYXRlcy5wdXNoKHtcbiAgICAgICAgICBmaWxlUGF0aDogZmlsZVBhdGgsXG4gICAgICAgICAgY29udGFpbmVyOiBub2RlLFxuICAgICAgICAgIGNvbnRlbnQ6IHByb3BlcnR5LmluaXRpYWxpemVyLnRleHQsXG4gICAgICAgICAgaW5saW5lOiB0cnVlLFxuICAgICAgICAgIHN0YXJ0OiB0ZW1wbGF0ZVN0YXJ0SWR4LFxuICAgICAgICAgIGdldENoYXJhY3RlckFuZExpbmVPZlBvc2l0aW9uOiBwb3MgPT5cbiAgICAgICAgICAgICAgdHMuZ2V0TGluZUFuZENoYXJhY3Rlck9mUG9zaXRpb24oc291cmNlRmlsZSwgcG9zICsgdGVtcGxhdGVTdGFydElkeClcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBpZiAocHJvcGVydHlOYW1lID09PSAndGVtcGxhdGVVcmwnICYmIHRzLmlzU3RyaW5nTGl0ZXJhbExpa2UocHJvcGVydHkuaW5pdGlhbGl6ZXIpKSB7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlUGF0aCA9IHJlc29sdmUoZGlybmFtZShzb3VyY2VGaWxlTmFtZSksIHByb3BlcnR5LmluaXRpYWxpemVyLnRleHQpO1xuXG4gICAgICAgIC8vIEluIGNhc2UgdGhlIHRlbXBsYXRlIGRvZXMgbm90IGV4aXN0IGluIHRoZSBmaWxlIHN5c3RlbSwgc2tpcCB0aGlzXG4gICAgICAgIC8vIGV4dGVybmFsIHRlbXBsYXRlLlxuICAgICAgICBpZiAoIWV4aXN0c1N5bmModGVtcGxhdGVQYXRoKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZpbGVDb250ZW50ID0gcmVhZEZpbGVTeW5jKHRlbXBsYXRlUGF0aCwgJ3V0ZjgnKTtcbiAgICAgICAgY29uc3QgbGluZVN0YXJ0c01hcCA9IGNvbXB1dGVMaW5lU3RhcnRzTWFwKGZpbGVDb250ZW50KTtcblxuICAgICAgICB0aGlzLnJlc29sdmVkVGVtcGxhdGVzLnB1c2goe1xuICAgICAgICAgIGZpbGVQYXRoOiB0ZW1wbGF0ZVBhdGgsXG4gICAgICAgICAgY29udGFpbmVyOiBub2RlLFxuICAgICAgICAgIGNvbnRlbnQ6IGZpbGVDb250ZW50LFxuICAgICAgICAgIGlubGluZTogZmFsc2UsXG4gICAgICAgICAgc3RhcnQ6IDAsXG4gICAgICAgICAgZ2V0Q2hhcmFjdGVyQW5kTGluZU9mUG9zaXRpb246IHBvcyA9PiBnZXRMaW5lQW5kQ2hhcmFjdGVyRnJvbVBvc2l0aW9uKGxpbmVTdGFydHNNYXAsIHBvcyksXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG4iXX0=