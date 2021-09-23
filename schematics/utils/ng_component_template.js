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
            const ngDecorators = (0, ng_decorators_1.getAngularDecorators)(this.typeChecker, node.decorators);
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
            const componentMetadata = (0, functions_1.unwrapExpression)(decoratorCall.arguments[0]);
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
                const propertyName = (0, property_name_1.getPropertyNameText)(property.name);
                // In case there is an inline template specified, ensure that the value is statically
                // analyzable by checking if the initializer is a string literal-like node.
                if (propertyName === 'template' && ts.isStringLiteralLike(property.initializer)) {
                    // Need to add an offset of one to the start because the template quotes are
                    // not part of the template content.
                    const templateStartIdx = property.initializer.getStart() + 1;
                    const filePath = (0, path_1.resolve)(sourceFileName);
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
                    const templatePath = (0, path_1.resolve)((0, path_1.dirname)(sourceFileName), property.initializer.text);
                    // In case the template does not exist in the file system, skip this
                    // external template.
                    if (!(0, fs_1.existsSync)(templatePath)) {
                        return;
                    }
                    const fileContent = (0, fs_1.readFileSync)(templatePath, 'utf8');
                    const lineStartsMap = (0, line_mappings_1.computeLineStartsMap)(fileContent);
                    this.resolvedTemplates.push({
                        filePath: templatePath,
                        container: node,
                        content: fileContent,
                        inline: false,
                        start: 0,
                        getCharacterAndLineOfPosition: pos => (0, line_mappings_1.getLineAndCharacterFromPosition)(lineStartsMap, pos),
                    });
                }
            });
        }
    }
    exports.NgComponentTemplateVisitor = NgComponentTemplateVisitor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfY29tcG9uZW50X3RlbXBsYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL3V0aWxzL25nX2NvbXBvbmVudF90ZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCwyQkFBNEM7SUFDNUMsK0JBQXNDO0lBQ3RDLGlDQUFpQztJQUVqQyxnRkFBc0Y7SUFDdEYsZ0ZBQXFEO0lBQ3JELG1GQUF3RDtJQUN4RCwyRkFBK0Q7SUF1Qi9EOzs7T0FHRztJQUNILE1BQWEsMEJBQTBCO1FBR3JDLFlBQW1CLFdBQTJCO1lBQTNCLGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQUY5QyxzQkFBaUIsR0FBdUIsRUFBRSxDQUFDO1FBRU0sQ0FBQztRQUVsRCxTQUFTLENBQUMsSUFBYTtZQUNyQixJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRTtnQkFDaEQsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQTJCLENBQUMsQ0FBQzthQUN6RDtZQUVELEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFFTyxxQkFBcUIsQ0FBQyxJQUF5QjtZQUNyRCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFO2dCQUMvQyxPQUFPO2FBQ1I7WUFFRCxNQUFNLFlBQVksR0FBRyxJQUFBLG9DQUFvQixFQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzdFLE1BQU0sa0JBQWtCLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFB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QUMsRUFBRSxDQUFDLElBQUEsK0NBQStCLEVBQUMsYUFBYSxFQUFFLEdBQUcsQ0FBQztxQkFDMUYsQ0FBQyxDQUFDO2lCQUNKO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0tBQ0Y7SUE1RkQsZ0VBNEZDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7ZXhpc3RzU3luYywgcmVhZEZpbGVTeW5jfSBmcm9tICdmcyc7XG5pbXBvcnQge2Rpcm5hbWUsIHJlc29sdmV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Y29tcHV0ZUxpbmVTdGFydHNNYXAsIGdldExpbmVBbmRDaGFyYWN0ZXJGcm9tUG9zaXRpb259IGZyb20gJy4vbGluZV9tYXBwaW5ncyc7XG5pbXBvcnQge2dldEFuZ3VsYXJEZWNvcmF0b3JzfSBmcm9tICcuL25nX2RlY29yYXRvcnMnO1xuaW1wb3J0IHt1bndyYXBFeHByZXNzaW9ufSBmcm9tICcuL3R5cGVzY3JpcHQvZnVuY3Rpb25zJztcbmltcG9ydCB7Z2V0UHJvcGVydHlOYW1lVGV4dH0gZnJvbSAnLi90eXBlc2NyaXB0L3Byb3BlcnR5X25hbWUnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlc29sdmVkVGVtcGxhdGUge1xuICAvKiogQ2xhc3MgZGVjbGFyYXRpb24gdGhhdCBjb250YWlucyB0aGlzIHRlbXBsYXRlLiAqL1xuICBjb250YWluZXI6IHRzLkNsYXNzRGVjbGFyYXRpb247XG4gIC8qKiBGaWxlIGNvbnRlbnQgb2YgdGhlIGdpdmVuIHRlbXBsYXRlLiAqL1xuICBjb250ZW50OiBzdHJpbmc7XG4gIC8qKiBTdGFydCBvZmZzZXQgb2YgdGhlIHRlbXBsYXRlIGNvbnRlbnQgKGUuZy4gaW4gdGhlIGlubGluZSBzb3VyY2UgZmlsZSkgKi9cbiAgc3RhcnQ6IG51bWJlcjtcbiAgLyoqIFdoZXRoZXIgdGhlIGdpdmVuIHRlbXBsYXRlIGlzIGlubGluZSBvciBub3QuICovXG4gIGlubGluZTogYm9vbGVhbjtcbiAgLyoqIFBhdGggdG8gdGhlIGZpbGUgdGhhdCBjb250YWlucyB0aGlzIHRlbXBsYXRlLiAqL1xuICBmaWxlUGF0aDogc3RyaW5nO1xuICAvKipcbiAgICogR2V0cyB0aGUgY2hhcmFjdGVyIGFuZCBsaW5lIG9mIGEgZ2l2ZW4gcG9zaXRpb24gaW5kZXggaW4gdGhlIHRlbXBsYXRlLlxuICAgKiBJZiB0aGUgdGVtcGxhdGUgaXMgZGVjbGFyZWQgaW5saW5lIHdpdGhpbiBhIFR5cGVTY3JpcHQgc291cmNlIGZpbGUsIHRoZSBsaW5lIGFuZFxuICAgKiBjaGFyYWN0ZXIgYXJlIGJhc2VkIG9uIHRoZSBmdWxsIHNvdXJjZSBmaWxlIGNvbnRlbnQuXG4gICAqL1xuICBnZXRDaGFyYWN0ZXJBbmRMaW5lT2ZQb3NpdGlvbjogKHBvczogbnVtYmVyKSA9PiB7XG4gICAgY2hhcmFjdGVyOiBudW1iZXIsIGxpbmU6IG51bWJlclxuICB9O1xufVxuXG4vKipcbiAqIFZpc2l0b3IgdGhhdCBjYW4gYmUgdXNlZCB0byBkZXRlcm1pbmUgQW5ndWxhciB0ZW1wbGF0ZXMgcmVmZXJlbmNlZCB3aXRoaW4gZ2l2ZW5cbiAqIFR5cGVTY3JpcHQgc291cmNlIGZpbGVzIChpbmxpbmUgdGVtcGxhdGVzIG9yIGV4dGVybmFsIHJlZmVyZW5jZWQgdGVtcGxhdGVzKVxuICovXG5leHBvcnQgY2xhc3MgTmdDb21wb25lbnRUZW1wbGF0ZVZpc2l0b3Ige1xuICByZXNvbHZlZFRlbXBsYXRlczogUmVzb2x2ZWRUZW1wbGF0ZVtdID0gW107XG5cbiAgY29uc3RydWN0b3IocHVibGljIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcikge31cblxuICB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSkge1xuICAgIGlmIChub2RlLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuQ2xhc3NEZWNsYXJhdGlvbikge1xuICAgICAgdGhpcy52aXNpdENsYXNzRGVjbGFyYXRpb24obm9kZSBhcyB0cy5DbGFzc0RlY2xhcmF0aW9uKTtcbiAgICB9XG5cbiAgICB0cy5mb3JFYWNoQ2hpbGQobm9kZSwgbiA9PiB0aGlzLnZpc2l0Tm9kZShuKSk7XG4gIH1cblxuICBwcml2YXRlIHZpc2l0Q2xhc3NEZWNsYXJhdGlvbihub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKSB7XG4gICAgaWYgKCFub2RlLmRlY29yYXRvcnMgfHwgIW5vZGUuZGVjb3JhdG9ycy5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBuZ0RlY29yYXRvcnMgPSBnZXRBbmd1bGFyRGVjb3JhdG9ycyh0aGlzLnR5cGVDaGVja2VyLCBub2RlLmRlY29yYXRvcnMpO1xuICAgIGNvbnN0IGNvbXBvbmVudERlY29yYXRvciA9IG5nRGVjb3JhdG9ycy5maW5kKGRlYyA9PiBkZWMubmFtZSA9PT0gJ0NvbXBvbmVudCcpO1xuXG4gICAgLy8gSW4gY2FzZSBubyBcIkBDb21wb25lbnRcIiBkZWNvcmF0b3IgY291bGQgYmUgZm91bmQgb24gdGhlIGN1cnJlbnQgY2xhc3MsIHNraXAuXG4gICAgaWYgKCFjb21wb25lbnREZWNvcmF0b3IpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBkZWNvcmF0b3JDYWxsID0gY29tcG9uZW50RGVjb3JhdG9yLm5vZGUuZXhwcmVzc2lvbjtcblxuICAgIC8vIEluIGNhc2UgdGhlIGNvbXBvbmVudCBkZWNvcmF0b3IgY2FsbCBpcyBub3QgdmFsaWQsIHNraXAgdGhpcyBjbGFzcyBkZWNsYXJhdGlvbi5cbiAgICBpZiAoZGVjb3JhdG9yQ2FsbC5hcmd1bWVudHMubGVuZ3RoICE9PSAxKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY29tcG9uZW50TWV0YWRhdGEgPSB1bndyYXBFeHByZXNzaW9uKGRlY29yYXRvckNhbGwuYXJndW1lbnRzWzBdKTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IHRoZSBjb21wb25lbnQgbWV0YWRhdGEgaXMgYW4gb2JqZWN0IGxpdGVyYWwgZXhwcmVzc2lvbi5cbiAgICBpZiAoIXRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24oY29tcG9uZW50TWV0YWRhdGEpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc291cmNlRmlsZSA9IG5vZGUuZ2V0U291cmNlRmlsZSgpO1xuICAgIGNvbnN0IHNvdXJjZUZpbGVOYW1lID0gc291cmNlRmlsZS5maWxlTmFtZTtcblxuICAgIC8vIFdhbGsgdGhyb3VnaCBhbGwgY29tcG9uZW50IG1ldGFkYXRhIHByb3BlcnRpZXMgYW5kIGRldGVybWluZSB0aGUgcmVmZXJlbmNlZFxuICAgIC8vIEhUTUwgdGVtcGxhdGVzIChlaXRoZXIgZXh0ZXJuYWwgb3IgaW5saW5lKVxuICAgIGNvbXBvbmVudE1ldGFkYXRhLnByb3BlcnRpZXMuZm9yRWFjaChwcm9wZXJ0eSA9PiB7XG4gICAgICBpZiAoIXRzLmlzUHJvcGVydHlBc3NpZ25tZW50KHByb3BlcnR5KSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHByb3BlcnR5TmFtZSA9IGdldFByb3BlcnR5TmFtZVRleHQocHJvcGVydHkubmFtZSk7XG5cbiAgICAgIC8vIEluIGNhc2UgdGhlcmUgaXMgYW4gaW5saW5lIHRlbXBsYXRlIHNwZWNpZmllZCwgZW5zdXJlIHRoYXQgdGhlIHZhbHVlIGlzIHN0YXRpY2FsbHlcbiAgICAgIC8vIGFuYWx5emFibGUgYnkgY2hlY2tpbmcgaWYgdGhlIGluaXRpYWxpemVyIGlzIGEgc3RyaW5nIGxpdGVyYWwtbGlrZSBub2RlLlxuICAgICAgaWYgKHByb3BlcnR5TmFtZSA9PT0gJ3RlbXBsYXRlJyAmJiB0cy5pc1N0cmluZ0xpdGVyYWxMaWtlKHByb3BlcnR5LmluaXRpYWxpemVyKSkge1xuICAgICAgICAvLyBOZWVkIHRvIGFkZCBhbiBvZmZzZXQgb2Ygb25lIHRvIHRoZSBzdGFydCBiZWNhdXNlIHRoZSB0ZW1wbGF0ZSBxdW90ZXMgYXJlXG4gICAgICAgIC8vIG5vdCBwYXJ0IG9mIHRoZSB0ZW1wbGF0ZSBjb250ZW50LlxuICAgICAgICBjb25zdCB0ZW1wbGF0ZVN0YXJ0SWR4ID0gcHJvcGVydHkuaW5pdGlhbGl6ZXIuZ2V0U3RhcnQoKSArIDE7XG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gcmVzb2x2ZShzb3VyY2VGaWxlTmFtZSk7XG4gICAgICAgIHRoaXMucmVzb2x2ZWRUZW1wbGF0ZXMucHVzaCh7XG4gICAgICAgICAgZmlsZVBhdGg6IGZpbGVQYXRoLFxuICAgICAgICAgIGNvbnRhaW5lcjogbm9kZSxcbiAgICAgICAgICBjb250ZW50OiBwcm9wZXJ0eS5pbml0aWFsaXplci50ZXh0LFxuICAgICAgICAgIGlubGluZTogdHJ1ZSxcbiAgICAgICAgICBzdGFydDogdGVtcGxhdGVTdGFydElkeCxcbiAgICAgICAgICBnZXRDaGFyYWN0ZXJBbmRMaW5lT2ZQb3NpdGlvbjogcG9zID0+XG4gICAgICAgICAgICAgIHRzLmdldExpbmVBbmRDaGFyYWN0ZXJPZlBvc2l0aW9uKHNvdXJjZUZpbGUsIHBvcyArIHRlbXBsYXRlU3RhcnRJZHgpXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKHByb3BlcnR5TmFtZSA9PT0gJ3RlbXBsYXRlVXJsJyAmJiB0cy5pc1N0cmluZ0xpdGVyYWxMaWtlKHByb3BlcnR5LmluaXRpYWxpemVyKSkge1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZVBhdGggPSByZXNvbHZlKGRpcm5hbWUoc291cmNlRmlsZU5hbWUpLCBwcm9wZXJ0eS5pbml0aWFsaXplci50ZXh0KTtcblxuICAgICAgICAvLyBJbiBjYXNlIHRoZSB0ZW1wbGF0ZSBkb2VzIG5vdCBleGlzdCBpbiB0aGUgZmlsZSBzeXN0ZW0sIHNraXAgdGhpc1xuICAgICAgICAvLyBleHRlcm5hbCB0ZW1wbGF0ZS5cbiAgICAgICAgaWYgKCFleGlzdHNTeW5jKHRlbXBsYXRlUGF0aCkpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmaWxlQ29udGVudCA9IHJlYWRGaWxlU3luYyh0ZW1wbGF0ZVBhdGgsICd1dGY4Jyk7XG4gICAgICAgIGNvbnN0IGxpbmVTdGFydHNNYXAgPSBjb21wdXRlTGluZVN0YXJ0c01hcChmaWxlQ29udGVudCk7XG5cbiAgICAgICAgdGhpcy5yZXNvbHZlZFRlbXBsYXRlcy5wdXNoKHtcbiAgICAgICAgICBmaWxlUGF0aDogdGVtcGxhdGVQYXRoLFxuICAgICAgICAgIGNvbnRhaW5lcjogbm9kZSxcbiAgICAgICAgICBjb250ZW50OiBmaWxlQ29udGVudCxcbiAgICAgICAgICBpbmxpbmU6IGZhbHNlLFxuICAgICAgICAgIHN0YXJ0OiAwLFxuICAgICAgICAgIGdldENoYXJhY3RlckFuZExpbmVPZlBvc2l0aW9uOiBwb3MgPT4gZ2V0TGluZUFuZENoYXJhY3RlckZyb21Qb3NpdGlvbihsaW5lU3RhcnRzTWFwLCBwb3MpLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuIl19