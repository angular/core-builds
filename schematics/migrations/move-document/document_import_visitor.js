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
        define("@angular/core/schematics/migrations/move-document/document_import_visitor", ["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DocumentImportVisitor = exports.DOCUMENT_TOKEN_NAME = exports.PLATFORM_BROWSER_IMPORT = exports.COMMON_IMPORT = void 0;
    const ts = require("typescript");
    exports.COMMON_IMPORT = '@angular/common';
    exports.PLATFORM_BROWSER_IMPORT = '@angular/platform-browser';
    exports.DOCUMENT_TOKEN_NAME = 'DOCUMENT';
    /** Visitor that can be used to find a set of imports in a TypeScript file. */
    class DocumentImportVisitor {
        constructor(typeChecker) {
            this.typeChecker = typeChecker;
            this.importsMap = new Map();
        }
        visitNode(node) {
            if (ts.isNamedImports(node)) {
                this.visitNamedImport(node);
            }
            ts.forEachChild(node, node => this.visitNode(node));
        }
        visitNamedImport(node) {
            if (!node.elements || !node.elements.length) {
                return;
            }
            const importDeclaration = node.parent.parent;
            // If this is not a StringLiteral it will be a grammar error
            const moduleSpecifier = importDeclaration.moduleSpecifier;
            const sourceFile = node.getSourceFile();
            let imports = this.importsMap.get(sourceFile);
            if (!imports) {
                imports = {
                    platformBrowserImport: null,
                    commonImport: null,
                    documentElement: null,
                };
            }
            if (moduleSpecifier.text === exports.PLATFORM_BROWSER_IMPORT) {
                const documentElement = this.getDocumentElement(node);
                if (documentElement) {
                    imports.platformBrowserImport = node;
                    imports.documentElement = documentElement;
                }
            }
            else if (moduleSpecifier.text === exports.COMMON_IMPORT) {
                imports.commonImport = node;
            }
            else {
                return;
            }
            this.importsMap.set(sourceFile, imports);
        }
        getDocumentElement(node) {
            const elements = node.elements;
            return elements.find(el => (el.propertyName || el.name).escapedText === exports.DOCUMENT_TOKEN_NAME);
        }
    }
    exports.DocumentImportVisitor = DocumentImportVisitor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRfaW1wb3J0X3Zpc2l0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9tb3ZlLWRvY3VtZW50L2RvY3VtZW50X2ltcG9ydF92aXNpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUVwQixRQUFBLGFBQWEsR0FBRyxpQkFBaUIsQ0FBQztJQUNsQyxRQUFBLHVCQUF1QixHQUFHLDJCQUEyQixDQUFDO0lBQ3RELFFBQUEsbUJBQW1CLEdBQUcsVUFBVSxDQUFDO0lBUzlDLDhFQUE4RTtJQUM5RSxNQUFhLHFCQUFxQjtRQUdoQyxZQUFtQixXQUEyQjtZQUEzQixnQkFBVyxHQUFYLFdBQVcsQ0FBZ0I7WUFGOUMsZUFBVSxHQUErQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBRWxCLENBQUM7UUFFbEQsU0FBUyxDQUFDLElBQWE7WUFDckIsSUFBSSxFQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUMzQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDN0I7WUFFRCxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRU8sZ0JBQWdCLENBQUMsSUFBcUI7WUFDNUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRTtnQkFDM0MsT0FBTzthQUNSO1lBRUQsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUM3Qyw0REFBNEQ7WUFDNUQsTUFBTSxlQUFlLEdBQUcsaUJBQWlCLENBQUMsZUFBbUMsQ0FBQztZQUM5RSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDeEMsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDOUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDWixPQUFPLEdBQUc7b0JBQ1IscUJBQXFCLEVBQUUsSUFBSTtvQkFDM0IsWUFBWSxFQUFFLElBQUk7b0JBQ2xCLGVBQWUsRUFBRSxJQUFJO2lCQUN0QixDQUFDO2FBQ0g7WUFFRCxJQUFJLGVBQWUsQ0FBQyxJQUFJLEtBQUssK0JBQXVCLEVBQUU7Z0JBQ3BELE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdEQsSUFBSSxlQUFlLEVBQUU7b0JBQ25CLE9BQU8sQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUM7b0JBQ3JDLE9BQU8sQ0FBQyxlQUFlLEdBQUcsZUFBZSxDQUFDO2lCQUMzQzthQUNGO2lCQUFNLElBQUksZUFBZSxDQUFDLElBQUksS0FBSyxxQkFBYSxFQUFFO2dCQUNqRCxPQUFPLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQzthQUM3QjtpQkFBTTtnQkFDTCxPQUFPO2FBQ1I7WUFDRCxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDM0MsQ0FBQztRQUVPLGtCQUFrQixDQUFDLElBQXFCO1lBQzlDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDL0IsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsWUFBWSxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEtBQUssMkJBQW1CLENBQUMsQ0FBQztRQUMvRixDQUFDO0tBQ0Y7SUFqREQsc0RBaURDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuZXhwb3J0IGNvbnN0IENPTU1PTl9JTVBPUlQgPSAnQGFuZ3VsYXIvY29tbW9uJztcbmV4cG9ydCBjb25zdCBQTEFURk9STV9CUk9XU0VSX0lNUE9SVCA9ICdAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyJztcbmV4cG9ydCBjb25zdCBET0NVTUVOVF9UT0tFTl9OQU1FID0gJ0RPQ1VNRU5UJztcblxuLyoqIFRoaXMgY29udGFpbnMgdGhlIG1ldGFkYXRhIG5lY2Vzc2FyeSB0byBtb3ZlIGl0ZW1zIGZyb20gb25lIGltcG9ydCB0byBhbm90aGVyICovXG5leHBvcnQgaW50ZXJmYWNlIFJlc29sdmVkRG9jdW1lbnRJbXBvcnQge1xuICBwbGF0Zm9ybUJyb3dzZXJJbXBvcnQ6IHRzLk5hbWVkSW1wb3J0c3xudWxsO1xuICBjb21tb25JbXBvcnQ6IHRzLk5hbWVkSW1wb3J0c3xudWxsO1xuICBkb2N1bWVudEVsZW1lbnQ6IHRzLkltcG9ydFNwZWNpZmllcnxudWxsO1xufVxuXG4vKiogVmlzaXRvciB0aGF0IGNhbiBiZSB1c2VkIHRvIGZpbmQgYSBzZXQgb2YgaW1wb3J0cyBpbiBhIFR5cGVTY3JpcHQgZmlsZS4gKi9cbmV4cG9ydCBjbGFzcyBEb2N1bWVudEltcG9ydFZpc2l0b3Ige1xuICBpbXBvcnRzTWFwOiBNYXA8dHMuU291cmNlRmlsZSwgUmVzb2x2ZWREb2N1bWVudEltcG9ydD4gPSBuZXcgTWFwKCk7XG5cbiAgY29uc3RydWN0b3IocHVibGljIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcikge31cblxuICB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSkge1xuICAgIGlmICh0cy5pc05hbWVkSW1wb3J0cyhub2RlKSkge1xuICAgICAgdGhpcy52aXNpdE5hbWVkSW1wb3J0KG5vZGUpO1xuICAgIH1cblxuICAgIHRzLmZvckVhY2hDaGlsZChub2RlLCBub2RlID0+IHRoaXMudmlzaXROb2RlKG5vZGUpKTtcbiAgfVxuXG4gIHByaXZhdGUgdmlzaXROYW1lZEltcG9ydChub2RlOiB0cy5OYW1lZEltcG9ydHMpIHtcbiAgICBpZiAoIW5vZGUuZWxlbWVudHMgfHwgIW5vZGUuZWxlbWVudHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaW1wb3J0RGVjbGFyYXRpb24gPSBub2RlLnBhcmVudC5wYXJlbnQ7XG4gICAgLy8gSWYgdGhpcyBpcyBub3QgYSBTdHJpbmdMaXRlcmFsIGl0IHdpbGwgYmUgYSBncmFtbWFyIGVycm9yXG4gICAgY29uc3QgbW9kdWxlU3BlY2lmaWVyID0gaW1wb3J0RGVjbGFyYXRpb24ubW9kdWxlU3BlY2lmaWVyIGFzIHRzLlN0cmluZ0xpdGVyYWw7XG4gICAgY29uc3Qgc291cmNlRmlsZSA9IG5vZGUuZ2V0U291cmNlRmlsZSgpO1xuICAgIGxldCBpbXBvcnRzID0gdGhpcy5pbXBvcnRzTWFwLmdldChzb3VyY2VGaWxlKTtcbiAgICBpZiAoIWltcG9ydHMpIHtcbiAgICAgIGltcG9ydHMgPSB7XG4gICAgICAgIHBsYXRmb3JtQnJvd3NlckltcG9ydDogbnVsbCxcbiAgICAgICAgY29tbW9uSW1wb3J0OiBudWxsLFxuICAgICAgICBkb2N1bWVudEVsZW1lbnQ6IG51bGwsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChtb2R1bGVTcGVjaWZpZXIudGV4dCA9PT0gUExBVEZPUk1fQlJPV1NFUl9JTVBPUlQpIHtcbiAgICAgIGNvbnN0IGRvY3VtZW50RWxlbWVudCA9IHRoaXMuZ2V0RG9jdW1lbnRFbGVtZW50KG5vZGUpO1xuICAgICAgaWYgKGRvY3VtZW50RWxlbWVudCkge1xuICAgICAgICBpbXBvcnRzLnBsYXRmb3JtQnJvd3NlckltcG9ydCA9IG5vZGU7XG4gICAgICAgIGltcG9ydHMuZG9jdW1lbnRFbGVtZW50ID0gZG9jdW1lbnRFbGVtZW50O1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAobW9kdWxlU3BlY2lmaWVyLnRleHQgPT09IENPTU1PTl9JTVBPUlQpIHtcbiAgICAgIGltcG9ydHMuY29tbW9uSW1wb3J0ID0gbm9kZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmltcG9ydHNNYXAuc2V0KHNvdXJjZUZpbGUsIGltcG9ydHMpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXREb2N1bWVudEVsZW1lbnQobm9kZTogdHMuTmFtZWRJbXBvcnRzKTogdHMuSW1wb3J0U3BlY2lmaWVyfHVuZGVmaW5lZCB7XG4gICAgY29uc3QgZWxlbWVudHMgPSBub2RlLmVsZW1lbnRzO1xuICAgIHJldHVybiBlbGVtZW50cy5maW5kKGVsID0+IChlbC5wcm9wZXJ0eU5hbWUgfHwgZWwubmFtZSkuZXNjYXBlZFRleHQgPT09IERPQ1VNRU5UX1RPS0VOX05BTUUpO1xuICB9XG59XG4iXX0=