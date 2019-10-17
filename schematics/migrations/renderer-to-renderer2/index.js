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
        define("@angular/core/schematics/migrations/renderer-to-renderer2", ["require", "exports", "@angular-devkit/schematics", "path", "typescript", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/utils/typescript/parse_tsconfig", "@angular/core/schematics/migrations/renderer-to-renderer2/helpers", "@angular/core/schematics/migrations/renderer-to-renderer2/migration", "@angular/core/schematics/migrations/renderer-to-renderer2/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const ts = require("typescript");
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const compiler_host_1 = require("@angular/core/schematics/utils/typescript/compiler_host");
    const parse_tsconfig_1 = require("@angular/core/schematics/utils/typescript/parse_tsconfig");
    const helpers_1 = require("@angular/core/schematics/migrations/renderer-to-renderer2/helpers");
    const migration_1 = require("@angular/core/schematics/migrations/renderer-to-renderer2/migration");
    const util_1 = require("@angular/core/schematics/migrations/renderer-to-renderer2/util");
    /**
     * Migration that switches from `Renderer` to `Renderer2`. More information on how it works:
     * https://hackmd.angular.io/UTzUZTnPRA-cSa_4mHyfYw
     */
    function default_1() {
        return (tree, context) => {
            const { buildPaths, testPaths } = project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
            const basePath = process.cwd();
            const allPaths = [...buildPaths, ...testPaths];
            const logger = context.logger;
            logger.info('------ Renderer to Renderer2 Migration ------');
            logger.info('As of Angular 9, the Renderer class is no longer available.');
            logger.info('Renderer2 should be used instead.');
            if (!allPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot migrate Renderer usages to Renderer2.');
            }
            for (const tsconfigPath of allPaths) {
                runRendererToRenderer2Migration(tree, tsconfigPath, basePath);
            }
        };
    }
    exports.default = default_1;
    function runRendererToRenderer2Migration(tree, tsconfigPath, basePath) {
        const parsed = parse_tsconfig_1.parseTsconfigFile(tsconfigPath, path_1.dirname(tsconfigPath));
        const host = compiler_host_1.createMigrationCompilerHost(tree, parsed.options, basePath);
        const program = ts.createProgram(parsed.fileNames, parsed.options, host);
        const typeChecker = program.getTypeChecker();
        const printer = ts.createPrinter();
        const sourceFiles = program.getSourceFiles().filter(f => !f.isDeclarationFile && !program.isSourceFileFromExternalLibrary(f));
        sourceFiles.forEach(sourceFile => {
            const rendererImport = util_1.findCoreImport(sourceFile, 'Renderer');
            // If there are no imports for the `Renderer`, we can exit early.
            if (!rendererImport) {
                return;
            }
            const { typedNodes, methodCalls, forwardRefs } = util_1.findRendererReferences(sourceFile, typeChecker, rendererImport);
            const update = tree.beginUpdate(path_1.relative(basePath, sourceFile.fileName));
            const helpersToAdd = new Set();
            // Change the `Renderer` import to `Renderer2`.
            update.remove(rendererImport.getStart(), rendererImport.getWidth());
            update.insertRight(rendererImport.getStart(), printer.printNode(ts.EmitHint.Unspecified, migration_1.replaceImport(rendererImport, 'Renderer', 'Renderer2'), sourceFile));
            // Change the method parameter and property types to `Renderer2`.
            typedNodes.forEach(node => {
                const type = node.type;
                if (type) {
                    update.remove(type.getStart(), type.getWidth());
                    update.insertRight(type.getStart(), 'Renderer2');
                }
            });
            // Change all identifiers inside `forwardRef` referring to the `Renderer`.
            forwardRefs.forEach(identifier => {
                update.remove(identifier.getStart(), identifier.getWidth());
                update.insertRight(identifier.getStart(), 'Renderer2');
            });
            // Migrate all of the method calls.
            methodCalls.forEach(call => {
                const { node, requiredHelpers } = migration_1.migrateExpression(call, typeChecker);
                if (node) {
                    // If we migrated the node to a new expression, replace only the call expression.
                    update.remove(call.getStart(), call.getWidth());
                    update.insertRight(call.getStart(), printer.printNode(ts.EmitHint.Unspecified, node, sourceFile));
                }
                else if (call.parent && ts.isExpressionStatement(call.parent)) {
                    // Otherwise if the call is inside an expression statement, drop the entire statement.
                    // This takes care of any trailing semicolons. We only need to drop nodes for cases like
                    // `setBindingDebugInfo` which have been noop for a while so they can be removed safely.
                    update.remove(call.parent.getStart(), call.parent.getWidth());
                }
                if (requiredHelpers) {
                    requiredHelpers.forEach(helperName => helpersToAdd.add(helperName));
                }
            });
            // Some of the methods can't be mapped directly to `Renderer2` and need extra logic around them.
            // The safest way to do so is to declare helper functions similar to the ones emitted by TS
            // which encapsulate the extra "glue" logic. We should only emit these functions once per file.
            helpersToAdd.forEach(helperName => {
                update.insertLeft(sourceFile.endOfFileToken.getStart(), helpers_1.getHelper(helperName, sourceFile, printer));
            });
            tree.commitUpdate(update);
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9yZW5kZXJlci10by1yZW5kZXJlcjIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCwyREFBNkY7SUFDN0YsK0JBQXVDO0lBQ3ZDLGlDQUFpQztJQUVqQyxrR0FBMkU7SUFDM0UsMkZBQWlGO0lBQ2pGLDZGQUF3RTtJQUV4RSwrRkFBb0Q7SUFDcEQsbUdBQTZEO0lBQzdELHlGQUE4RDtJQUk5RDs7O09BR0c7SUFDSDtRQUNFLE9BQU8sQ0FBQyxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1lBQy9DLE1BQU0sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLEdBQUcsZ0RBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQy9CLE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBRyxVQUFVLEVBQUUsR0FBRyxTQUFTLENBQUMsQ0FBQztZQUMvQyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBRTlCLE1BQU0sQ0FBQyxJQUFJLENBQUMsK0NBQStDLENBQUMsQ0FBQztZQUM3RCxNQUFNLENBQUMsSUFBSSxDQUFDLDZEQUE2RCxDQUFDLENBQUM7WUFDM0UsTUFBTSxDQUFDLElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO1lBRWpELElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFO2dCQUNwQixNQUFNLElBQUksZ0NBQW1CLENBQ3pCLGdGQUFnRixDQUFDLENBQUM7YUFDdkY7WUFFRCxLQUFLLE1BQU0sWUFBWSxJQUFJLFFBQVEsRUFBRTtnQkFDbkMsK0JBQStCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQzth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LENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDNUIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY0NvbnRleHQsIFNjaGVtYXRpY3NFeGNlcHRpb24sIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7ZGlybmFtZSwgcmVsYXRpdmV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Z2V0UHJvamVjdFRzQ29uZmlnUGF0aHN9IGZyb20gJy4uLy4uL3V0aWxzL3Byb2plY3RfdHNjb25maWdfcGF0aHMnO1xuaW1wb3J0IHtjcmVhdGVNaWdyYXRpb25Db21waWxlckhvc3R9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvY29tcGlsZXJfaG9zdCc7XG5pbXBvcnQge3BhcnNlVHNjb25maWdGaWxlfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L3BhcnNlX3RzY29uZmlnJztcblxuaW1wb3J0IHtIZWxwZXJGdW5jdGlvbiwgZ2V0SGVscGVyfSBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0IHttaWdyYXRlRXhwcmVzc2lvbiwgcmVwbGFjZUltcG9ydH0gZnJvbSAnLi9taWdyYXRpb24nO1xuaW1wb3J0IHtmaW5kQ29yZUltcG9ydCwgZmluZFJlbmRlcmVyUmVmZXJlbmNlc30gZnJvbSAnLi91dGlsJztcblxuXG5cbi8qKlxuICogTWlncmF0aW9uIHRoYXQgc3dpdGNoZXMgZnJvbSBgUmVuZGVyZXJgIHRvIGBSZW5kZXJlcjJgLiBNb3JlIGluZm9ybWF0aW9uIG9uIGhvdyBpdCB3b3JrczpcbiAqIGh0dHBzOi8vaGFja21kLmFuZ3VsYXIuaW8vVVR6VVpUblBSQS1jU2FfNG1IeWZZd1xuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpOiBSdWxlIHtcbiAgcmV0dXJuICh0cmVlOiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3Qge2J1aWxkUGF0aHMsIHRlc3RQYXRoc30gPSBnZXRQcm9qZWN0VHNDb25maWdQYXRocyh0cmVlKTtcbiAgICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG4gICAgY29uc3QgYWxsUGF0aHMgPSBbLi4uYnVpbGRQYXRocywgLi4udGVzdFBhdGhzXTtcbiAgICBjb25zdCBsb2dnZXIgPSBjb250ZXh0LmxvZ2dlcjtcblxuICAgIGxvZ2dlci5pbmZvKCctLS0tLS0gUmVuZGVyZXIgdG8gUmVuZGVyZXIyIE1pZ3JhdGlvbiAtLS0tLS0nKTtcbiAgICBsb2dnZXIuaW5mbygnQXMgb2YgQW5ndWxhciA5LCB0aGUgUmVuZGVyZXIgY2xhc3MgaXMgbm8gbG9uZ2VyIGF2YWlsYWJsZS4nKTtcbiAgICBsb2dnZXIuaW5mbygnUmVuZGVyZXIyIHNob3VsZCBiZSB1c2VkIGluc3RlYWQuJyk7XG5cbiAgICBpZiAoIWFsbFBhdGhzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgJ0NvdWxkIG5vdCBmaW5kIGFueSB0c2NvbmZpZyBmaWxlLiBDYW5ub3QgbWlncmF0ZSBSZW5kZXJlciB1c2FnZXMgdG8gUmVuZGVyZXIyLicpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgdHNjb25maWdQYXRoIG9mIGFsbFBhdGhzKSB7XG4gICAgICBydW5SZW5kZXJlclRvUmVuZGVyZXIyTWlncmF0aW9uKHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgpO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gcnVuUmVuZGVyZXJUb1JlbmRlcmVyMk1pZ3JhdGlvbih0cmVlOiBUcmVlLCB0c2NvbmZpZ1BhdGg6IHN0cmluZywgYmFzZVBhdGg6IHN0cmluZykge1xuICBjb25zdCBwYXJzZWQgPSBwYXJzZVRzY29uZmlnRmlsZSh0c2NvbmZpZ1BhdGgsIGRpcm5hbWUodHNjb25maWdQYXRoKSk7XG4gIGNvbnN0IGhvc3QgPSBjcmVhdGVNaWdyYXRpb25Db21waWxlckhvc3QodHJlZSwgcGFyc2VkLm9wdGlvbnMsIGJhc2VQYXRoKTtcbiAgY29uc3QgcHJvZ3JhbSA9IHRzLmNyZWF0ZVByb2dyYW0ocGFyc2VkLmZpbGVOYW1lcywgcGFyc2VkLm9wdGlvbnMsIGhvc3QpO1xuICBjb25zdCB0eXBlQ2hlY2tlciA9IHByb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKTtcbiAgY29uc3QgcHJpbnRlciA9IHRzLmNyZWF0ZVByaW50ZXIoKTtcbiAgY29uc3Qgc291cmNlRmlsZXMgPSBwcm9ncmFtLmdldFNvdXJjZUZpbGVzKCkuZmlsdGVyKFxuICAgICAgZiA9PiAhZi5pc0RlY2xhcmF0aW9uRmlsZSAmJiAhcHJvZ3JhbS5pc1NvdXJjZUZpbGVGcm9tRXh0ZXJuYWxMaWJyYXJ5KGYpKTtcblxuICBzb3VyY2VGaWxlcy5mb3JFYWNoKHNvdXJjZUZpbGUgPT4ge1xuICAgIGNvbnN0IHJlbmRlcmVySW1wb3J0ID0gZmluZENvcmVJbXBvcnQoc291cmNlRmlsZSwgJ1JlbmRlcmVyJyk7XG5cbiAgICAvLyBJZiB0aGVyZSBhcmUgbm8gaW1wb3J0cyBmb3IgdGhlIGBSZW5kZXJlcmAsIHdlIGNhbiBleGl0IGVhcmx5LlxuICAgIGlmICghcmVuZGVyZXJJbXBvcnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB7dHlwZWROb2RlcywgbWV0aG9kQ2FsbHMsIGZvcndhcmRSZWZzfSA9XG4gICAgICAgIGZpbmRSZW5kZXJlclJlZmVyZW5jZXMoc291cmNlRmlsZSwgdHlwZUNoZWNrZXIsIHJlbmRlcmVySW1wb3J0KTtcbiAgICBjb25zdCB1cGRhdGUgPSB0cmVlLmJlZ2luVXBkYXRlKHJlbGF0aXZlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLmZpbGVOYW1lKSk7XG4gICAgY29uc3QgaGVscGVyc1RvQWRkID0gbmV3IFNldDxIZWxwZXJGdW5jdGlvbj4oKTtcblxuICAgIC8vIENoYW5nZSB0aGUgYFJlbmRlcmVyYCBpbXBvcnQgdG8gYFJlbmRlcmVyMmAuXG4gICAgdXBkYXRlLnJlbW92ZShyZW5kZXJlckltcG9ydC5nZXRTdGFydCgpLCByZW5kZXJlckltcG9ydC5nZXRXaWR0aCgpKTtcbiAgICB1cGRhdGUuaW5zZXJ0UmlnaHQoXG4gICAgICAgIHJlbmRlcmVySW1wb3J0LmdldFN0YXJ0KCksXG4gICAgICAgIHByaW50ZXIucHJpbnROb2RlKFxuICAgICAgICAgICAgdHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIHJlcGxhY2VJbXBvcnQocmVuZGVyZXJJbXBvcnQsICdSZW5kZXJlcicsICdSZW5kZXJlcjInKSxcbiAgICAgICAgICAgIHNvdXJjZUZpbGUpKTtcblxuICAgIC8vIENoYW5nZSB0aGUgbWV0aG9kIHBhcmFtZXRlciBhbmQgcHJvcGVydHkgdHlwZXMgdG8gYFJlbmRlcmVyMmAuXG4gICAgdHlwZWROb2Rlcy5mb3JFYWNoKG5vZGUgPT4ge1xuICAgICAgY29uc3QgdHlwZSA9IG5vZGUudHlwZTtcblxuICAgICAgaWYgKHR5cGUpIHtcbiAgICAgICAgdXBkYXRlLnJlbW92ZSh0eXBlLmdldFN0YXJ0KCksIHR5cGUuZ2V0V2lkdGgoKSk7XG4gICAgICAgIHVwZGF0ZS5pbnNlcnRSaWdodCh0eXBlLmdldFN0YXJ0KCksICdSZW5kZXJlcjInKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIENoYW5nZSBhbGwgaWRlbnRpZmllcnMgaW5zaWRlIGBmb3J3YXJkUmVmYCByZWZlcnJpbmcgdG8gdGhlIGBSZW5kZXJlcmAuXG4gICAgZm9yd2FyZFJlZnMuZm9yRWFjaChpZGVudGlmaWVyID0+IHtcbiAgICAgIHVwZGF0ZS5yZW1vdmUoaWRlbnRpZmllci5nZXRTdGFydCgpLCBpZGVudGlmaWVyLmdldFdpZHRoKCkpO1xuICAgICAgdXBkYXRlLmluc2VydFJpZ2h0KGlkZW50aWZpZXIuZ2V0U3RhcnQoKSwgJ1JlbmRlcmVyMicpO1xuICAgIH0pO1xuXG4gICAgLy8gTWlncmF0ZSBhbGwgb2YgdGhlIG1ldGhvZCBjYWxscy5cbiAgICBtZXRob2RDYWxscy5mb3JFYWNoKGNhbGwgPT4ge1xuICAgICAgY29uc3Qge25vZGUsIHJlcXVpcmVkSGVscGVyc30gPSBtaWdyYXRlRXhwcmVzc2lvbihjYWxsLCB0eXBlQ2hlY2tlcik7XG5cbiAgICAgIGlmIChub2RlKSB7XG4gICAgICAgIC8vIElmIHdlIG1pZ3JhdGVkIHRoZSBub2RlIHRvIGEgbmV3IGV4cHJlc3Npb24sIHJlcGxhY2Ugb25seSB0aGUgY2FsbCBleHByZXNzaW9uLlxuICAgICAgICB1cGRhdGUucmVtb3ZlKGNhbGwuZ2V0U3RhcnQoKSwgY2FsbC5nZXRXaWR0aCgpKTtcbiAgICAgICAgdXBkYXRlLmluc2VydFJpZ2h0KFxuICAgICAgICAgICAgY2FsbC5nZXRTdGFydCgpLCBwcmludGVyLnByaW50Tm9kZSh0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgbm9kZSwgc291cmNlRmlsZSkpO1xuICAgICAgfSBlbHNlIGlmIChjYWxsLnBhcmVudCAmJiB0cy5pc0V4cHJlc3Npb25TdGF0ZW1lbnQoY2FsbC5wYXJlbnQpKSB7XG4gICAgICAgIC8vIE90aGVyd2lzZSBpZiB0aGUgY2FsbCBpcyBpbnNpZGUgYW4gZXhwcmVzc2lvbiBzdGF0ZW1lbnQsIGRyb3AgdGhlIGVudGlyZSBzdGF0ZW1lbnQuXG4gICAgICAgIC8vIFRoaXMgdGFrZXMgY2FyZSBvZiBhbnkgdHJhaWxpbmcgc2VtaWNvbG9ucy4gV2Ugb25seSBuZWVkIHRvIGRyb3Agbm9kZXMgZm9yIGNhc2VzIGxpa2VcbiAgICAgICAgLy8gYHNldEJpbmRpbmdEZWJ1Z0luZm9gIHdoaWNoIGhhdmUgYmVlbiBub29wIGZvciBhIHdoaWxlIHNvIHRoZXkgY2FuIGJlIHJlbW92ZWQgc2FmZWx5LlxuICAgICAgICB1cGRhdGUucmVtb3ZlKGNhbGwucGFyZW50LmdldFN0YXJ0KCksIGNhbGwucGFyZW50LmdldFdpZHRoKCkpO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVxdWlyZWRIZWxwZXJzKSB7XG4gICAgICAgIHJlcXVpcmVkSGVscGVycy5mb3JFYWNoKGhlbHBlck5hbWUgPT4gaGVscGVyc1RvQWRkLmFkZChoZWxwZXJOYW1lKSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBTb21lIG9mIHRoZSBtZXRob2RzIGNhbid0IGJlIG1hcHBlZCBkaXJlY3RseSB0byBgUmVuZGVyZXIyYCBhbmQgbmVlZCBleHRyYSBsb2dpYyBhcm91bmQgdGhlbS5cbiAgICAvLyBUaGUgc2FmZXN0IHdheSB0byBkbyBzbyBpcyB0byBkZWNsYXJlIGhlbHBlciBmdW5jdGlvbnMgc2ltaWxhciB0byB0aGUgb25lcyBlbWl0dGVkIGJ5IFRTXG4gICAgLy8gd2hpY2ggZW5jYXBzdWxhdGUgdGhlIGV4dHJhIFwiZ2x1ZVwiIGxvZ2ljLiBXZSBzaG91bGQgb25seSBlbWl0IHRoZXNlIGZ1bmN0aW9ucyBvbmNlIHBlciBmaWxlLlxuICAgIGhlbHBlcnNUb0FkZC5mb3JFYWNoKGhlbHBlck5hbWUgPT4ge1xuICAgICAgdXBkYXRlLmluc2VydExlZnQoXG4gICAgICAgICAgc291cmNlRmlsZS5lbmRPZkZpbGVUb2tlbi5nZXRTdGFydCgpLCBnZXRIZWxwZXIoaGVscGVyTmFtZSwgc291cmNlRmlsZSwgcHJpbnRlcikpO1xuICAgIH0pO1xuXG4gICAgdHJlZS5jb21taXRVcGRhdGUodXBkYXRlKTtcbiAgfSk7XG59XG4iXX0=