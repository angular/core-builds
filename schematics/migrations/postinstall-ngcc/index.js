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
        define("@angular/core/schematics/migrations/postinstall-ngcc", ["require", "exports", "@angular-devkit/core", "@angular-devkit/schematics", "@angular-devkit/schematics/tasks", "@schematics/angular/utility/json-utils"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const core_1 = require("@angular-devkit/core");
    const schematics_1 = require("@angular-devkit/schematics");
    const tasks_1 = require("@angular-devkit/schematics/tasks");
    const json_utils_1 = require("@schematics/angular/utility/json-utils");
    /**
     * Runs the ngcc postinstall migration for the current CLI workspace.
     */
    function default_1() {
        return (tree, context) => {
            addPackageJsonScript(tree, 'postinstall', 'ngcc --properties es2015 browser module main --first-only --create-ivy-entry-points');
            context.addTask(new tasks_1.NodePackageInstallTask());
        };
    }
    exports.default = default_1;
    function addPackageJsonScript(tree, scriptName, script) {
        const pkgJsonPath = '/package.json';
        // Read package.json and turn it into an AST.
        const buffer = tree.read(pkgJsonPath);
        if (buffer === null) {
            throw new schematics_1.SchematicsException('Could not read package.json.');
        }
        const content = buffer.toString();
        const packageJsonAst = core_1.parseJsonAst(content, core_1.JsonParseMode.Strict);
        if (packageJsonAst.kind != 'object') {
            throw new schematics_1.SchematicsException('Invalid package.json. Was expecting an object.');
        }
        // Begin recording changes.
        const recorder = tree.beginUpdate(pkgJsonPath);
        const scriptsNode = json_utils_1.findPropertyInAstObject(packageJsonAst, 'scripts');
        if (!scriptsNode) {
            // Haven't found the scripts key, add it to the root of the package.json.
            json_utils_1.appendPropertyInAstObject(recorder, packageJsonAst, 'scripts', {
                [scriptName]: script,
            }, 2);
        }
        else if (scriptsNode.kind === 'object') {
            // Check if the script is already there.
            const scriptNode = json_utils_1.findPropertyInAstObject(scriptsNode, scriptName);
            if (!scriptNode) {
                // Script not found, add it.
                json_utils_1.insertPropertyInAstObjectInOrder(recorder, scriptsNode, scriptName, script, 4);
            }
            else {
                // Script found, prepend the new script with &&.
                const currentScript = scriptNode.value;
                if (typeof currentScript == 'string') {
                    // Only add script if there's no ngcc call there already.
                    if (!currentScript.includes('ngcc')) {
                        const { start, end } = scriptNode;
                        recorder.remove(start.offset, end.offset - start.offset);
                        recorder.insertRight(start.offset, JSON.stringify(`${script} && ${currentScript}`));
                    }
                }
                else {
                    throw new schematics_1.SchematicsException('Invalid postinstall script in package.json. Was expecting a string.');
                }
            }
        }
        // Write the changes.
        tree.commitUpdate(recorder);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9wb3N0aW5zdGFsbC1uZ2NjL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsK0NBQWlFO0lBQ2pFLDJEQUE2RjtJQUM3Riw0REFBd0U7SUFDeEUsdUVBQTRJO0lBRzVJOztPQUVHO0lBQ0g7UUFDRSxPQUFPLENBQUMsSUFBVSxFQUFFLE9BQXlCLEVBQUUsRUFBRTtZQUMvQyxvQkFBb0IsQ0FDaEIsSUFBSSxFQUFFLGFBQWEsRUFDbkIscUZBQXFGLENBQUMsQ0FBQztZQUMzRixPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksOEJBQXNCLEVBQUUsQ0FBQyxDQUFDO1FBQ2hELENBQUMsQ0FBQztJQUNKLENBQUM7SUFQRCw0QkFPQztJQUVELFNBQVMsb0JBQW9CLENBQUMsSUFBVSxFQUFFLFVBQWtCLEVBQUUsTUFBYztRQUMxRSxNQUFNLFdBQVcsR0FBRyxlQUFlLENBQUM7UUFFcEMsNkNBQTZDO1FBQzdDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDdEMsSUFBSSxNQUFNLEtBQUssSUFBSSxFQUFFO1lBQ25CLE1BQU0sSUFBSSxnQ0FBbUIsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1NBQy9EO1FBQ0QsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRWxDLE1BQU0sY0FBYyxHQUFHLG1CQUFZLENBQUMsT0FBTyxFQUFFLG9CQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbkUsSUFBSSxjQUFjLENBQUMsSUFBSSxJQUFJLFFBQVEsRUFBRTtZQUNuQyxNQUFNLElBQUksZ0NBQW1CLENBQUMsZ0RBQWdELENBQUMsQ0FBQztTQUNqRjtRQUVELDJCQUEyQjtRQUMzQixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQy9DLE1BQU0sV0FBVyxHQUFHLG9DQUF1QixDQUFDLGNBQWMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUV2RSxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ2hCLHlFQUF5RTtZQUN6RSxzQ0FBeUIsQ0FDckIsUUFBUSxFQUFFLGNBQWMsRUFBRSxTQUFTLEVBQUU7Z0JBQ25DLENBQUMsVUFBVSxDQUFDLEVBQUUsTUFBTTthQUNyQixFQUNELENBQUMsQ0FBQyxDQUFDO1NBQ1I7YUFBTSxJQUFJLFdBQVcsQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFO1lBQ3hDLHdDQUF3QztZQUN4QyxNQUFNLFVBQVUsR0FBRyxvQ0FBdUIsQ0FBQyxXQUFXLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFcEUsSUFBSSxDQUFDLFVBQVUsRUFBRTtnQkFDZiw0QkFBNEI7Z0JBQzVCLDZDQUFnQyxDQUFDLFFBQVEsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQzthQUNoRjtpQkFBTTtnQkFDTCxnREFBZ0Q7Z0JBQ2hELE1BQU0sYUFBYSxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUM7Z0JBQ3ZDLElBQUksT0FBTyxhQUFhLElBQUksUUFBUSxFQUFFO29CQUNwQyx5REFBeUQ7b0JBQ3pELElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO3dCQUNuQyxNQUFNLEVBQUMsS0FBSyxFQUFFLEdBQUcsRUFBQyxHQUFHLFVBQVUsQ0FBQzt3QkFDaEMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUN6RCxRQUFRLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLE1BQU0sT0FBTyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7cUJBQ3JGO2lCQUNGO3FCQUFNO29CQUNMLE1BQU0sSUFBSSxnQ0FBbUIsQ0FDekIscUVBQXFFLENBQUMsQ0FBQztpQkFDNUU7YUFDRjtTQUNGO1FBRUQscUJBQXFCO1FBQ3JCLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDOUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtKc29uUGFyc2VNb2RlLCBwYXJzZUpzb25Bc3R9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7UnVsZSwgU2NoZW1hdGljQ29udGV4dCwgU2NoZW1hdGljc0V4Y2VwdGlvbiwgVHJlZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtOb2RlUGFja2FnZUluc3RhbGxUYXNrfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcy90YXNrcyc7XG5pbXBvcnQge2FwcGVuZFByb3BlcnR5SW5Bc3RPYmplY3QsIGZpbmRQcm9wZXJ0eUluQXN0T2JqZWN0LCBpbnNlcnRQcm9wZXJ0eUluQXN0T2JqZWN0SW5PcmRlcn0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L2pzb24tdXRpbHMnO1xuXG5cbi8qKlxuICogUnVucyB0aGUgbmdjYyBwb3N0aW5zdGFsbCBtaWdyYXRpb24gZm9yIHRoZSBjdXJyZW50IENMSSB3b3Jrc3BhY2UuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBhZGRQYWNrYWdlSnNvblNjcmlwdChcbiAgICAgICAgdHJlZSwgJ3Bvc3RpbnN0YWxsJyxcbiAgICAgICAgJ25nY2MgLS1wcm9wZXJ0aWVzIGVzMjAxNSBicm93c2VyIG1vZHVsZSBtYWluIC0tZmlyc3Qtb25seSAtLWNyZWF0ZS1pdnktZW50cnktcG9pbnRzJyk7XG4gICAgY29udGV4dC5hZGRUYXNrKG5ldyBOb2RlUGFja2FnZUluc3RhbGxUYXNrKCkpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBhZGRQYWNrYWdlSnNvblNjcmlwdCh0cmVlOiBUcmVlLCBzY3JpcHROYW1lOiBzdHJpbmcsIHNjcmlwdDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IHBrZ0pzb25QYXRoID0gJy9wYWNrYWdlLmpzb24nO1xuXG4gIC8vIFJlYWQgcGFja2FnZS5qc29uIGFuZCB0dXJuIGl0IGludG8gYW4gQVNULlxuICBjb25zdCBidWZmZXIgPSB0cmVlLnJlYWQocGtnSnNvblBhdGgpO1xuICBpZiAoYnVmZmVyID09PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oJ0NvdWxkIG5vdCByZWFkIHBhY2thZ2UuanNvbi4nKTtcbiAgfVxuICBjb25zdCBjb250ZW50ID0gYnVmZmVyLnRvU3RyaW5nKCk7XG5cbiAgY29uc3QgcGFja2FnZUpzb25Bc3QgPSBwYXJzZUpzb25Bc3QoY29udGVudCwgSnNvblBhcnNlTW9kZS5TdHJpY3QpO1xuICBpZiAocGFja2FnZUpzb25Bc3Qua2luZCAhPSAnb2JqZWN0Jykge1xuICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKCdJbnZhbGlkIHBhY2thZ2UuanNvbi4gV2FzIGV4cGVjdGluZyBhbiBvYmplY3QuJyk7XG4gIH1cblxuICAvLyBCZWdpbiByZWNvcmRpbmcgY2hhbmdlcy5cbiAgY29uc3QgcmVjb3JkZXIgPSB0cmVlLmJlZ2luVXBkYXRlKHBrZ0pzb25QYXRoKTtcbiAgY29uc3Qgc2NyaXB0c05vZGUgPSBmaW5kUHJvcGVydHlJbkFzdE9iamVjdChwYWNrYWdlSnNvbkFzdCwgJ3NjcmlwdHMnKTtcblxuICBpZiAoIXNjcmlwdHNOb2RlKSB7XG4gICAgLy8gSGF2ZW4ndCBmb3VuZCB0aGUgc2NyaXB0cyBrZXksIGFkZCBpdCB0byB0aGUgcm9vdCBvZiB0aGUgcGFja2FnZS5qc29uLlxuICAgIGFwcGVuZFByb3BlcnR5SW5Bc3RPYmplY3QoXG4gICAgICAgIHJlY29yZGVyLCBwYWNrYWdlSnNvbkFzdCwgJ3NjcmlwdHMnLCB7XG4gICAgICAgICAgW3NjcmlwdE5hbWVdOiBzY3JpcHQsXG4gICAgICAgIH0sXG4gICAgICAgIDIpO1xuICB9IGVsc2UgaWYgKHNjcmlwdHNOb2RlLmtpbmQgPT09ICdvYmplY3QnKSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhlIHNjcmlwdCBpcyBhbHJlYWR5IHRoZXJlLlxuICAgIGNvbnN0IHNjcmlwdE5vZGUgPSBmaW5kUHJvcGVydHlJbkFzdE9iamVjdChzY3JpcHRzTm9kZSwgc2NyaXB0TmFtZSk7XG5cbiAgICBpZiAoIXNjcmlwdE5vZGUpIHtcbiAgICAgIC8vIFNjcmlwdCBub3QgZm91bmQsIGFkZCBpdC5cbiAgICAgIGluc2VydFByb3BlcnR5SW5Bc3RPYmplY3RJbk9yZGVyKHJlY29yZGVyLCBzY3JpcHRzTm9kZSwgc2NyaXB0TmFtZSwgc2NyaXB0LCA0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gU2NyaXB0IGZvdW5kLCBwcmVwZW5kIHRoZSBuZXcgc2NyaXB0IHdpdGggJiYuXG4gICAgICBjb25zdCBjdXJyZW50U2NyaXB0ID0gc2NyaXB0Tm9kZS52YWx1ZTtcbiAgICAgIGlmICh0eXBlb2YgY3VycmVudFNjcmlwdCA9PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBPbmx5IGFkZCBzY3JpcHQgaWYgdGhlcmUncyBubyBuZ2NjIGNhbGwgdGhlcmUgYWxyZWFkeS5cbiAgICAgICAgaWYgKCFjdXJyZW50U2NyaXB0LmluY2x1ZGVzKCduZ2NjJykpIHtcbiAgICAgICAgICBjb25zdCB7c3RhcnQsIGVuZH0gPSBzY3JpcHROb2RlO1xuICAgICAgICAgIHJlY29yZGVyLnJlbW92ZShzdGFydC5vZmZzZXQsIGVuZC5vZmZzZXQgLSBzdGFydC5vZmZzZXQpO1xuICAgICAgICAgIHJlY29yZGVyLmluc2VydFJpZ2h0KHN0YXJ0Lm9mZnNldCwgSlNPTi5zdHJpbmdpZnkoYCR7c2NyaXB0fSAmJiAke2N1cnJlbnRTY3JpcHR9YCkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgICAgICdJbnZhbGlkIHBvc3RpbnN0YWxsIHNjcmlwdCBpbiBwYWNrYWdlLmpzb24uIFdhcyBleHBlY3RpbmcgYSBzdHJpbmcuJyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gV3JpdGUgdGhlIGNoYW5nZXMuXG4gIHRyZWUuY29tbWl0VXBkYXRlKHJlY29yZGVyKTtcbn1cbiJdfQ==