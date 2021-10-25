/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
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
    const typescript_1 = __importDefault(require("typescript"));
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
            if (typescript_1.default.isNamedImports(node)) {
                this.visitNamedImport(node);
            }
            typescript_1.default.forEachChild(node, node => this.visitNode(node));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRfaW1wb3J0X3Zpc2l0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9tb3ZlLWRvY3VtZW50L2RvY3VtZW50X2ltcG9ydF92aXNpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7OztJQUVILDREQUE0QjtJQUVmLFFBQUEsYUFBYSxHQUFHLGlCQUFpQixDQUFDO0lBQ2xDLFFBQUEsdUJBQXVCLEdBQUcsMkJBQTJCLENBQUM7SUFDdEQsUUFBQSxtQkFBbUIsR0FBRyxVQUFVLENBQUM7SUFTOUMsOEVBQThFO0lBQzlFLE1BQWEscUJBQXFCO1FBR2hDLFlBQW1CLFdBQTJCO1lBQTNCLGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQUY5QyxlQUFVLEdBQStDLElBQUksR0FBRyxFQUFFLENBQUM7UUFFbEIsQ0FBQztRQUVsRCxTQUFTLENBQUMsSUFBYTtZQUNyQixJQUFJLG9CQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUMzQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDN0I7WUFFRCxvQkFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUVPLGdCQUFnQixDQUFDLElBQXFCO1lBQzVDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7Z0JBQzNDLE9BQU87YUFDUjtZQUVELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDN0MsNERBQTREO1lBQzVELE1BQU0sZUFBZSxHQUFHLGlCQUFpQixDQUFDLGVBQW1DLENBQUM7WUFDOUUsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3hDLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzlDLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQ1osT0FBTyxHQUFHO29CQUNSLHFCQUFxQixFQUFFLElBQUk7b0JBQzNCLFlBQVksRUFBRSxJQUFJO29CQUNsQixlQUFlLEVBQUUsSUFBSTtpQkFDdEIsQ0FBQzthQUNIO1lBRUQsSUFBSSxlQUFlLENBQUMsSUFBSSxLQUFLLCtCQUF1QixFQUFFO2dCQUNwRCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3RELElBQUksZUFBZSxFQUFFO29CQUNuQixPQUFPLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDO29CQUNyQyxPQUFPLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztpQkFDM0M7YUFDRjtpQkFBTSxJQUFJLGVBQWUsQ0FBQyxJQUFJLEtBQUsscUJBQWEsRUFBRTtnQkFDakQsT0FBTyxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7YUFDN0I7aUJBQU07Z0JBQ0wsT0FBTzthQUNSO1lBQ0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFFTyxrQkFBa0IsQ0FBQyxJQUFxQjtZQUM5QyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQy9CLE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFlBQVksSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxLQUFLLDJCQUFtQixDQUFDLENBQUM7UUFDL0YsQ0FBQztLQUNGO0lBakRELHNEQWlEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmV4cG9ydCBjb25zdCBDT01NT05fSU1QT1JUID0gJ0Bhbmd1bGFyL2NvbW1vbic7XG5leHBvcnQgY29uc3QgUExBVEZPUk1fQlJPV1NFUl9JTVBPUlQgPSAnQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3Nlcic7XG5leHBvcnQgY29uc3QgRE9DVU1FTlRfVE9LRU5fTkFNRSA9ICdET0NVTUVOVCc7XG5cbi8qKiBUaGlzIGNvbnRhaW5zIHRoZSBtZXRhZGF0YSBuZWNlc3NhcnkgdG8gbW92ZSBpdGVtcyBmcm9tIG9uZSBpbXBvcnQgdG8gYW5vdGhlciAqL1xuZXhwb3J0IGludGVyZmFjZSBSZXNvbHZlZERvY3VtZW50SW1wb3J0IHtcbiAgcGxhdGZvcm1Ccm93c2VySW1wb3J0OiB0cy5OYW1lZEltcG9ydHN8bnVsbDtcbiAgY29tbW9uSW1wb3J0OiB0cy5OYW1lZEltcG9ydHN8bnVsbDtcbiAgZG9jdW1lbnRFbGVtZW50OiB0cy5JbXBvcnRTcGVjaWZpZXJ8bnVsbDtcbn1cblxuLyoqIFZpc2l0b3IgdGhhdCBjYW4gYmUgdXNlZCB0byBmaW5kIGEgc2V0IG9mIGltcG9ydHMgaW4gYSBUeXBlU2NyaXB0IGZpbGUuICovXG5leHBvcnQgY2xhc3MgRG9jdW1lbnRJbXBvcnRWaXNpdG9yIHtcbiAgaW1wb3J0c01hcDogTWFwPHRzLlNvdXJjZUZpbGUsIFJlc29sdmVkRG9jdW1lbnRJbXBvcnQ+ID0gbmV3IE1hcCgpO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIpIHt9XG5cbiAgdmlzaXROb2RlKG5vZGU6IHRzLk5vZGUpIHtcbiAgICBpZiAodHMuaXNOYW1lZEltcG9ydHMobm9kZSkpIHtcbiAgICAgIHRoaXMudmlzaXROYW1lZEltcG9ydChub2RlKTtcbiAgICB9XG5cbiAgICB0cy5mb3JFYWNoQ2hpbGQobm9kZSwgbm9kZSA9PiB0aGlzLnZpc2l0Tm9kZShub2RlKSk7XG4gIH1cblxuICBwcml2YXRlIHZpc2l0TmFtZWRJbXBvcnQobm9kZTogdHMuTmFtZWRJbXBvcnRzKSB7XG4gICAgaWYgKCFub2RlLmVsZW1lbnRzIHx8ICFub2RlLmVsZW1lbnRzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGltcG9ydERlY2xhcmF0aW9uID0gbm9kZS5wYXJlbnQucGFyZW50O1xuICAgIC8vIElmIHRoaXMgaXMgbm90IGEgU3RyaW5nTGl0ZXJhbCBpdCB3aWxsIGJlIGEgZ3JhbW1hciBlcnJvclxuICAgIGNvbnN0IG1vZHVsZVNwZWNpZmllciA9IGltcG9ydERlY2xhcmF0aW9uLm1vZHVsZVNwZWNpZmllciBhcyB0cy5TdHJpbmdMaXRlcmFsO1xuICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBub2RlLmdldFNvdXJjZUZpbGUoKTtcbiAgICBsZXQgaW1wb3J0cyA9IHRoaXMuaW1wb3J0c01hcC5nZXQoc291cmNlRmlsZSk7XG4gICAgaWYgKCFpbXBvcnRzKSB7XG4gICAgICBpbXBvcnRzID0ge1xuICAgICAgICBwbGF0Zm9ybUJyb3dzZXJJbXBvcnQ6IG51bGwsXG4gICAgICAgIGNvbW1vbkltcG9ydDogbnVsbCxcbiAgICAgICAgZG9jdW1lbnRFbGVtZW50OiBudWxsLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAobW9kdWxlU3BlY2lmaWVyLnRleHQgPT09IFBMQVRGT1JNX0JST1dTRVJfSU1QT1JUKSB7XG4gICAgICBjb25zdCBkb2N1bWVudEVsZW1lbnQgPSB0aGlzLmdldERvY3VtZW50RWxlbWVudChub2RlKTtcbiAgICAgIGlmIChkb2N1bWVudEVsZW1lbnQpIHtcbiAgICAgICAgaW1wb3J0cy5wbGF0Zm9ybUJyb3dzZXJJbXBvcnQgPSBub2RlO1xuICAgICAgICBpbXBvcnRzLmRvY3VtZW50RWxlbWVudCA9IGRvY3VtZW50RWxlbWVudDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG1vZHVsZVNwZWNpZmllci50ZXh0ID09PSBDT01NT05fSU1QT1JUKSB7XG4gICAgICBpbXBvcnRzLmNvbW1vbkltcG9ydCA9IG5vZGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5pbXBvcnRzTWFwLnNldChzb3VyY2VGaWxlLCBpbXBvcnRzKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0RG9jdW1lbnRFbGVtZW50KG5vZGU6IHRzLk5hbWVkSW1wb3J0cyk6IHRzLkltcG9ydFNwZWNpZmllcnx1bmRlZmluZWQge1xuICAgIGNvbnN0IGVsZW1lbnRzID0gbm9kZS5lbGVtZW50cztcbiAgICByZXR1cm4gZWxlbWVudHMuZmluZChlbCA9PiAoZWwucHJvcGVydHlOYW1lIHx8IGVsLm5hbWUpLmVzY2FwZWRUZXh0ID09PSBET0NVTUVOVF9UT0tFTl9OQU1FKTtcbiAgfVxufVxuIl19