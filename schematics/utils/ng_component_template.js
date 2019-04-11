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
            this.resolvedTemplates = new Map();
        }
        visitNode(node) {
            if (node.kind === ts.SyntaxKind.ClassDeclaration) {
                this.visitClassDeclaration(node);
            }
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
                    this.resolvedTemplates.set(filePath, {
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
                    this.resolvedTemplates.set(templatePath, {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfY29tcG9uZW50X3RlbXBsYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL3V0aWxzL25nX2NvbXBvbmVudF90ZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILDJCQUE0QztJQUM1QywrQkFBc0M7SUFDdEMsaUNBQWlDO0lBRWpDLGdGQUFzRjtJQUN0RixnRkFBcUQ7SUFDckQsbUZBQXdEO0lBQ3hELDJGQUErRDtJQXFCL0Q7OztPQUdHO0lBQ0gsTUFBYSwwQkFBMEI7UUFHckMsWUFBbUIsV0FBMkI7WUFBM0IsZ0JBQVcsR0FBWCxXQUFXLENBQWdCO1lBRjlDLHNCQUFpQixHQUFHLElBQUksR0FBRyxFQUE0QixDQUFDO1FBRVAsQ0FBQztRQUVsRCxTQUFTLENBQUMsSUFBYTtZQUNyQixJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRTtnQkFDaEQsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQTJCLENBQUMsQ0FBQzthQUN6RDtRQUNILENBQUM7UUFFTyxxQkFBcUIsQ0FBQyxJQUF5QjtZQUNyRCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFO2dCQUMvQyxPQUFPO2FBQ1I7WUFFRCxNQUFNLFlBQVksR0FBRyxvQ0FBb0IsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM3RSxNQUFNLGtCQUFrQixHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLFdBQVcsQ0FBQyxDQUFDO1lBRTlFLCtFQUErRTtZQUMvRSxJQUFJLENBQUMsa0JBQWtCLEVBQUU7Z0JBQ3ZCLE9B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MEZDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2V4aXN0c1N5bmMsIHJlYWRGaWxlU3luY30gZnJvbSAnZnMnO1xuaW1wb3J0IHtkaXJuYW1lLCByZXNvbHZlfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2NvbXB1dGVMaW5lU3RhcnRzTWFwLCBnZXRMaW5lQW5kQ2hhcmFjdGVyRnJvbVBvc2l0aW9ufSBmcm9tICcuL2xpbmVfbWFwcGluZ3MnO1xuaW1wb3J0IHtnZXRBbmd1bGFyRGVjb3JhdG9yc30gZnJvbSAnLi9uZ19kZWNvcmF0b3JzJztcbmltcG9ydCB7dW53cmFwRXhwcmVzc2lvbn0gZnJvbSAnLi90eXBlc2NyaXB0L2Z1bmN0aW9ucyc7XG5pbXBvcnQge2dldFByb3BlcnR5TmFtZVRleHR9IGZyb20gJy4vdHlwZXNjcmlwdC9wcm9wZXJ0eV9uYW1lJztcblxuZXhwb3J0IGludGVyZmFjZSBSZXNvbHZlZFRlbXBsYXRlIHtcbiAgLyoqIENsYXNzIGRlY2xhcmF0aW9uIHRoYXQgY29udGFpbnMgdGhpcyB0ZW1wbGF0ZS4gKi9cbiAgY29udGFpbmVyOiB0cy5DbGFzc0RlY2xhcmF0aW9uO1xuICAvKiogRmlsZSBjb250ZW50IG9mIHRoZSBnaXZlbiB0ZW1wbGF0ZS4gKi9cbiAgY29udGVudDogc3RyaW5nO1xuICAvKiogU3RhcnQgb2Zmc2V0IG9mIHRoZSB0ZW1wbGF0ZSBjb250ZW50IChlLmcuIGluIHRoZSBpbmxpbmUgc291cmNlIGZpbGUpICovXG4gIHN0YXJ0OiBudW1iZXI7XG4gIC8qKiBXaGV0aGVyIHRoZSBnaXZlbiB0ZW1wbGF0ZSBpcyBpbmxpbmUgb3Igbm90LiAqL1xuICBpbmxpbmU6IGJvb2xlYW47XG4gIC8qKiBQYXRoIHRvIHRoZSBmaWxlIHRoYXQgY29udGFpbnMgdGhpcyB0ZW1wbGF0ZS4gKi9cbiAgZmlsZVBhdGg6IHN0cmluZztcbiAgLyoqXG4gICAqIEdldHMgdGhlIGNoYXJhY3RlciBhbmQgbGluZSBvZiBhIGdpdmVuIHBvc2l0aW9uIGluZGV4IGluIHRoZSB0ZW1wbGF0ZS5cbiAgICogSWYgdGhlIHRlbXBsYXRlIGlzIGRlY2xhcmVkIGlubGluZSB3aXRoaW4gYSBUeXBlU2NyaXB0IHNvdXJjZSBmaWxlLCB0aGUgbGluZSBhbmRcbiAgICogY2hhcmFjdGVyIGFyZSBiYXNlZCBvbiB0aGUgZnVsbCBzb3VyY2UgZmlsZSBjb250ZW50LlxuICAgKi9cbiAgZ2V0Q2hhcmFjdGVyQW5kTGluZU9mUG9zaXRpb246IChwb3M6IG51bWJlcikgPT4geyBjaGFyYWN0ZXI6IG51bWJlciwgbGluZTogbnVtYmVyIH07XG59XG5cbi8qKlxuICogVmlzaXRvciB0aGF0IGNhbiBiZSB1c2VkIHRvIGRldGVybWluZSBBbmd1bGFyIHRlbXBsYXRlcyByZWZlcmVuY2VkIHdpdGhpbiBnaXZlblxuICogVHlwZVNjcmlwdCBzb3VyY2UgZmlsZXMgKGlubGluZSB0ZW1wbGF0ZXMgb3IgZXh0ZXJuYWwgcmVmZXJlbmNlZCB0ZW1wbGF0ZXMpXG4gKi9cbmV4cG9ydCBjbGFzcyBOZ0NvbXBvbmVudFRlbXBsYXRlVmlzaXRvciB7XG4gIHJlc29sdmVkVGVtcGxhdGVzID0gbmV3IE1hcDxzdHJpbmcsIFJlc29sdmVkVGVtcGxhdGU+KCk7XG5cbiAgY29uc3RydWN0b3IocHVibGljIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcikge31cblxuICB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSkge1xuICAgIGlmIChub2RlLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuQ2xhc3NEZWNsYXJhdGlvbikge1xuICAgICAgdGhpcy52aXNpdENsYXNzRGVjbGFyYXRpb24obm9kZSBhcyB0cy5DbGFzc0RlY2xhcmF0aW9uKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHZpc2l0Q2xhc3NEZWNsYXJhdGlvbihub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKSB7XG4gICAgaWYgKCFub2RlLmRlY29yYXRvcnMgfHwgIW5vZGUuZGVjb3JhdG9ycy5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBuZ0RlY29yYXRvcnMgPSBnZXRBbmd1bGFyRGVjb3JhdG9ycyh0aGlzLnR5cGVDaGVja2VyLCBub2RlLmRlY29yYXRvcnMpO1xuICAgIGNvbnN0IGNvbXBvbmVudERlY29yYXRvciA9IG5nRGVjb3JhdG9ycy5maW5kKGRlYyA9PiBkZWMubmFtZSA9PT0gJ0NvbXBvbmVudCcpO1xuXG4gICAgLy8gSW4gY2FzZSBubyBcIkBDb21wb25lbnRcIiBkZWNvcmF0b3IgY291bGQgYmUgZm91bmQgb24gdGhlIGN1cnJlbnQgY2xhc3MsIHNraXAuXG4gICAgaWYgKCFjb21wb25lbnREZWNvcmF0b3IpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBkZWNvcmF0b3JDYWxsID0gY29tcG9uZW50RGVjb3JhdG9yLm5vZGUuZXhwcmVzc2lvbjtcblxuICAgIC8vIEluIGNhc2UgdGhlIGNvbXBvbmVudCBkZWNvcmF0b3IgY2FsbCBpcyBub3QgdmFsaWQsIHNraXAgdGhpcyBjbGFzcyBkZWNsYXJhdGlvbi5cbiAgICBpZiAoZGVjb3JhdG9yQ2FsbC5hcmd1bWVudHMubGVuZ3RoICE9PSAxKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY29tcG9uZW50TWV0YWRhdGEgPSB1bndyYXBFeHByZXNzaW9uKGRlY29yYXRvckNhbGwuYXJndW1lbnRzWzBdKTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IHRoZSBjb21wb25lbnQgbWV0YWRhdGEgaXMgYW4gb2JqZWN0IGxpdGVyYWwgZXhwcmVzc2lvbi5cbiAgICBpZiAoIXRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24oY29tcG9uZW50TWV0YWRhdGEpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc291cmNlRmlsZSA9IG5vZGUuZ2V0U291cmNlRmlsZSgpO1xuICAgIGNvbnN0IHNvdXJjZUZpbGVOYW1lID0gc291cmNlRmlsZS5maWxlTmFtZTtcblxuICAgIC8vIFdhbGsgdGhyb3VnaCBhbGwgY29tcG9uZW50IG1ldGFkYXRhIHByb3BlcnRpZXMgYW5kIGRldGVybWluZSB0aGUgcmVmZXJlbmNlZFxuICAgIC8vIEhUTUwgdGVtcGxhdGVzIChlaXRoZXIgZXh0ZXJuYWwgb3IgaW5saW5lKVxuICAgIGNvbXBvbmVudE1ldGFkYXRhLnByb3BlcnRpZXMuZm9yRWFjaChwcm9wZXJ0eSA9PiB7XG4gICAgICBpZiAoIXRzLmlzUHJvcGVydHlBc3NpZ25tZW50KHByb3BlcnR5KSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHByb3BlcnR5TmFtZSA9IGdldFByb3BlcnR5TmFtZVRleHQocHJvcGVydHkubmFtZSk7XG5cbiAgICAgIC8vIEluIGNhc2UgdGhlcmUgaXMgYW4gaW5saW5lIHRlbXBsYXRlIHNwZWNpZmllZCwgZW5zdXJlIHRoYXQgdGhlIHZhbHVlIGlzIHN0YXRpY2FsbHlcbiAgICAgIC8vIGFuYWx5emFibGUgYnkgY2hlY2tpbmcgaWYgdGhlIGluaXRpYWxpemVyIGlzIGEgc3RyaW5nIGxpdGVyYWwtbGlrZSBub2RlLlxuICAgICAgaWYgKHByb3BlcnR5TmFtZSA9PT0gJ3RlbXBsYXRlJyAmJiB0cy5pc1N0cmluZ0xpdGVyYWxMaWtlKHByb3BlcnR5LmluaXRpYWxpemVyKSkge1xuICAgICAgICAvLyBOZWVkIHRvIGFkZCBhbiBvZmZzZXQgb2Ygb25lIHRvIHRoZSBzdGFydCBiZWNhdXNlIHRoZSB0ZW1wbGF0ZSBxdW90ZXMgYXJlXG4gICAgICAgIC8vIG5vdCBwYXJ0IG9mIHRoZSB0ZW1wbGF0ZSBjb250ZW50LlxuICAgICAgICBjb25zdCB0ZW1wbGF0ZVN0YXJ0SWR4ID0gcHJvcGVydHkuaW5pdGlhbGl6ZXIuZ2V0U3RhcnQoKSArIDE7XG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gcmVzb2x2ZShzb3VyY2VGaWxlTmFtZSk7XG4gICAgICAgIHRoaXMucmVzb2x2ZWRUZW1wbGF0ZXMuc2V0KGZpbGVQYXRoLCB7XG4gICAgICAgICAgZmlsZVBhdGg6IGZpbGVQYXRoLFxuICAgICAgICAgIGNvbnRhaW5lcjogbm9kZSxcbiAgICAgICAgICBjb250ZW50OiBwcm9wZXJ0eS5pbml0aWFsaXplci50ZXh0LFxuICAgICAgICAgIGlubGluZTogdHJ1ZSxcbiAgICAgICAgICBzdGFydDogdGVtcGxhdGVTdGFydElkeCxcbiAgICAgICAgICBnZXRDaGFyYWN0ZXJBbmRMaW5lT2ZQb3NpdGlvbjpcbiAgICAgICAgICAgICAgcG9zID0+IHRzLmdldExpbmVBbmRDaGFyYWN0ZXJPZlBvc2l0aW9uKHNvdXJjZUZpbGUsIHBvcyArIHRlbXBsYXRlU3RhcnRJZHgpXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKHByb3BlcnR5TmFtZSA9PT0gJ3RlbXBsYXRlVXJsJyAmJiB0cy5pc1N0cmluZ0xpdGVyYWxMaWtlKHByb3BlcnR5LmluaXRpYWxpemVyKSkge1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZVBhdGggPSByZXNvbHZlKGRpcm5hbWUoc291cmNlRmlsZU5hbWUpLCBwcm9wZXJ0eS5pbml0aWFsaXplci50ZXh0KTtcblxuICAgICAgICAvLyBJbiBjYXNlIHRoZSB0ZW1wbGF0ZSBkb2VzIG5vdCBleGlzdCBpbiB0aGUgZmlsZSBzeXN0ZW0sIHNraXAgdGhpc1xuICAgICAgICAvLyBleHRlcm5hbCB0ZW1wbGF0ZS5cbiAgICAgICAgaWYgKCFleGlzdHNTeW5jKHRlbXBsYXRlUGF0aCkpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmaWxlQ29udGVudCA9IHJlYWRGaWxlU3luYyh0ZW1wbGF0ZVBhdGgsICd1dGY4Jyk7XG4gICAgICAgIGNvbnN0IGxpbmVTdGFydHNNYXAgPSBjb21wdXRlTGluZVN0YXJ0c01hcChmaWxlQ29udGVudCk7XG5cbiAgICAgICAgdGhpcy5yZXNvbHZlZFRlbXBsYXRlcy5zZXQodGVtcGxhdGVQYXRoLCB7XG4gICAgICAgICAgZmlsZVBhdGg6IHRlbXBsYXRlUGF0aCxcbiAgICAgICAgICBjb250YWluZXI6IG5vZGUsXG4gICAgICAgICAgY29udGVudDogZmlsZUNvbnRlbnQsXG4gICAgICAgICAgaW5saW5lOiBmYWxzZSxcbiAgICAgICAgICBzdGFydDogMCxcbiAgICAgICAgICBnZXRDaGFyYWN0ZXJBbmRMaW5lT2ZQb3NpdGlvbjogcG9zID0+IGdldExpbmVBbmRDaGFyYWN0ZXJGcm9tUG9zaXRpb24obGluZVN0YXJ0c01hcCwgcG9zKSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==