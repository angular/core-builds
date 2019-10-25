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
            context.logger.info('------ ngcc postinstall migration ------');
            context.logger.info('This migration adds an ngcc invocation to npm/yarn\'s ');
            context.logger.info('postinstall script. See more info here: ');
            context.logger.info('https://v9.angular.io/guide/migration-ngcc');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9wb3N0aW5zdGFsbC1uZ2NjL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsK0NBQWlFO0lBQ2pFLDJEQUE2RjtJQUM3Riw0REFBd0U7SUFDeEUsdUVBQTRJO0lBRzVJOztPQUVHO0lBQ0g7UUFDRSxPQUFPLENBQUMsSUFBVSxFQUFFLE9BQXlCLEVBQUUsRUFBRTtZQUMvQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQywwQ0FBMEMsQ0FBQyxDQUFDO1lBQ2hFLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLHdEQUF3RCxDQUFDLENBQUM7WUFDOUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsMENBQTBDLENBQUMsQ0FBQztZQUNoRSxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDO1lBRWxFLG9CQUFvQixDQUNoQixJQUFJLEVBQUUsYUFBYSxFQUNuQixxRkFBcUYsQ0FBQyxDQUFDO1lBQzNGLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSw4QkFBc0IsRUFBRSxDQUFDLENBQUM7UUFDaEQsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQVpELDRCQVlDO0lBRUQsU0FBUyxvQkFBb0IsQ0FBQyxJQUFVLEVBQUUsVUFBa0IsRUFBRSxNQUFjO1FBQzFFLE1BQU0sV0FBVyxHQUFHLGVBQWUsQ0FBQztRQUVwQyw2Q0FBNkM7UUFDN0MsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN0QyxJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUU7WUFDbkIsTUFBTSxJQUFJLGdDQUFtQixDQUFDLDhCQUE4QixDQUFDLENBQUM7U0FDL0Q7UUFDRCxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7UUFFbEMsTUFBTSxjQUFjLEdBQUcsbUJBQVksQ0FBQyxPQUFPLEVBQUUsb0JBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNuRSxJQUFJLGNBQWMsQ0FBQyxJQUFJLElBQUksUUFBUSxFQUFFO1lBQ25DLE1BQU0sSUFBSSxnQ0FBbUIsQ0FBQyxnREFBZ0QsQ0FBQyxDQUFDO1NBQ2pGO1FBRUQsMkJBQTJCO1FBQzNCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDL0MsTUFBTSxXQUFXLEdBQUcsb0NBQXVCLENBQUMsY0FBYyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBRXZFLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDaEIseUVBQXlFO1lBQ3pFLHNDQUF5QixDQUNyQixRQUFRLEVBQUUsY0FBYyxFQUFFLFNBQVMsRUFBRTtnQkFDbkMsQ0FBQyxVQUFVLENBQUMsRUFBRSxNQUFNO2FBQ3JCLEVBQ0QsQ0FBQyxDQUFDLENBQUM7U0FDUjthQUFNLElBQUksV0FBVyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7WUFDeEMsd0NBQXdDO1lBQ3hDLE1BQU0sVUFBVSxHQUFHLG9DQUF1QixDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUVwRSxJQUFJLENBQUMsVUFBVSxFQUFFO2dCQUNmLDRCQUE0QjtnQkFDNUIsNkNBQWdDLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQ2hGO2lCQUFNO2dCQUNMLGdEQUFnRDtnQkFDaEQsTUFBTSxhQUFhLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQztnQkFDdkMsSUFBSSxPQUFPLGFBQWEsSUFBSSxRQUFRLEVBQUU7b0JBQ3BDLHlEQUF5RDtvQkFDekQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUU7d0JBQ25DLE1BQU0sRUFBQyxLQUFLLEVBQUUsR0FBRyxFQUFDLEdBQUcsVUFBVSxDQUFDO3dCQUNoQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7d0JBQ3pELFFBQVEsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsTUFBTSxPQUFPLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztxQkFDckY7aUJBQ0Y7cUJBQU07b0JBQ0wsTUFBTSxJQUFJLGdDQUFtQixDQUN6QixxRUFBcUUsQ0FBQyxDQUFDO2lCQUM1RTthQUNGO1NBQ0Y7UUFFRCxxQkFBcUI7UUFDckIsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM5QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0pzb25QYXJzZU1vZGUsIHBhcnNlSnNvbkFzdH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge05vZGVQYWNrYWdlSW5zdGFsbFRhc2t9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzL3Rhc2tzJztcbmltcG9ydCB7YXBwZW5kUHJvcGVydHlJbkFzdE9iamVjdCwgZmluZFByb3BlcnR5SW5Bc3RPYmplY3QsIGluc2VydFByb3BlcnR5SW5Bc3RPYmplY3RJbk9yZGVyfSBmcm9tICdAc2NoZW1hdGljcy9hbmd1bGFyL3V0aWxpdHkvanNvbi11dGlscyc7XG5cblxuLyoqXG4gKiBSdW5zIHRoZSBuZ2NjIHBvc3RpbnN0YWxsIG1pZ3JhdGlvbiBmb3IgdGhlIGN1cnJlbnQgQ0xJIHdvcmtzcGFjZS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKTogUnVsZSB7XG4gIHJldHVybiAodHJlZTogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnRleHQubG9nZ2VyLmluZm8oJy0tLS0tLSBuZ2NjIHBvc3RpbnN0YWxsIG1pZ3JhdGlvbiAtLS0tLS0nKTtcbiAgICBjb250ZXh0LmxvZ2dlci5pbmZvKCdUaGlzIG1pZ3JhdGlvbiBhZGRzIGFuIG5nY2MgaW52b2NhdGlvbiB0byBucG0veWFyblxcJ3MgJyk7XG4gICAgY29udGV4dC5sb2dnZXIuaW5mbygncG9zdGluc3RhbGwgc2NyaXB0LiBTZWUgbW9yZSBpbmZvIGhlcmU6ICcpO1xuICAgIGNvbnRleHQubG9nZ2VyLmluZm8oJ2h0dHBzOi8vdjkuYW5ndWxhci5pby9ndWlkZS9taWdyYXRpb24tbmdjYycpO1xuXG4gICAgYWRkUGFja2FnZUpzb25TY3JpcHQoXG4gICAgICAgIHRyZWUsICdwb3N0aW5zdGFsbCcsXG4gICAgICAgICduZ2NjIC0tcHJvcGVydGllcyBlczIwMTUgYnJvd3NlciBtb2R1bGUgbWFpbiAtLWZpcnN0LW9ubHkgLS1jcmVhdGUtaXZ5LWVudHJ5LXBvaW50cycpO1xuICAgIGNvbnRleHQuYWRkVGFzayhuZXcgTm9kZVBhY2thZ2VJbnN0YWxsVGFzaygpKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gYWRkUGFja2FnZUpzb25TY3JpcHQodHJlZTogVHJlZSwgc2NyaXB0TmFtZTogc3RyaW5nLCBzY3JpcHQ6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBwa2dKc29uUGF0aCA9ICcvcGFja2FnZS5qc29uJztcblxuICAvLyBSZWFkIHBhY2thZ2UuanNvbiBhbmQgdHVybiBpdCBpbnRvIGFuIEFTVC5cbiAgY29uc3QgYnVmZmVyID0gdHJlZS5yZWFkKHBrZ0pzb25QYXRoKTtcbiAgaWYgKGJ1ZmZlciA9PT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKCdDb3VsZCBub3QgcmVhZCBwYWNrYWdlLmpzb24uJyk7XG4gIH1cbiAgY29uc3QgY29udGVudCA9IGJ1ZmZlci50b1N0cmluZygpO1xuXG4gIGNvbnN0IHBhY2thZ2VKc29uQXN0ID0gcGFyc2VKc29uQXN0KGNvbnRlbnQsIEpzb25QYXJzZU1vZGUuU3RyaWN0KTtcbiAgaWYgKHBhY2thZ2VKc29uQXN0LmtpbmQgIT0gJ29iamVjdCcpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbignSW52YWxpZCBwYWNrYWdlLmpzb24uIFdhcyBleHBlY3RpbmcgYW4gb2JqZWN0LicpO1xuICB9XG5cbiAgLy8gQmVnaW4gcmVjb3JkaW5nIGNoYW5nZXMuXG4gIGNvbnN0IHJlY29yZGVyID0gdHJlZS5iZWdpblVwZGF0ZShwa2dKc29uUGF0aCk7XG4gIGNvbnN0IHNjcmlwdHNOb2RlID0gZmluZFByb3BlcnR5SW5Bc3RPYmplY3QocGFja2FnZUpzb25Bc3QsICdzY3JpcHRzJyk7XG5cbiAgaWYgKCFzY3JpcHRzTm9kZSkge1xuICAgIC8vIEhhdmVuJ3QgZm91bmQgdGhlIHNjcmlwdHMga2V5LCBhZGQgaXQgdG8gdGhlIHJvb3Qgb2YgdGhlIHBhY2thZ2UuanNvbi5cbiAgICBhcHBlbmRQcm9wZXJ0eUluQXN0T2JqZWN0KFxuICAgICAgICByZWNvcmRlciwgcGFja2FnZUpzb25Bc3QsICdzY3JpcHRzJywge1xuICAgICAgICAgIFtzY3JpcHROYW1lXTogc2NyaXB0LFxuICAgICAgICB9LFxuICAgICAgICAyKTtcbiAgfSBlbHNlIGlmIChzY3JpcHRzTm9kZS5raW5kID09PSAnb2JqZWN0Jykge1xuICAgIC8vIENoZWNrIGlmIHRoZSBzY3JpcHQgaXMgYWxyZWFkeSB0aGVyZS5cbiAgICBjb25zdCBzY3JpcHROb2RlID0gZmluZFByb3BlcnR5SW5Bc3RPYmplY3Qoc2NyaXB0c05vZGUsIHNjcmlwdE5hbWUpO1xuXG4gICAgaWYgKCFzY3JpcHROb2RlKSB7XG4gICAgICAvLyBTY3JpcHQgbm90IGZvdW5kLCBhZGQgaXQuXG4gICAgICBpbnNlcnRQcm9wZXJ0eUluQXN0T2JqZWN0SW5PcmRlcihyZWNvcmRlciwgc2NyaXB0c05vZGUsIHNjcmlwdE5hbWUsIHNjcmlwdCwgNCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFNjcmlwdCBmb3VuZCwgcHJlcGVuZCB0aGUgbmV3IHNjcmlwdCB3aXRoICYmLlxuICAgICAgY29uc3QgY3VycmVudFNjcmlwdCA9IHNjcmlwdE5vZGUudmFsdWU7XG4gICAgICBpZiAodHlwZW9mIGN1cnJlbnRTY3JpcHQgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gT25seSBhZGQgc2NyaXB0IGlmIHRoZXJlJ3Mgbm8gbmdjYyBjYWxsIHRoZXJlIGFscmVhZHkuXG4gICAgICAgIGlmICghY3VycmVudFNjcmlwdC5pbmNsdWRlcygnbmdjYycpKSB7XG4gICAgICAgICAgY29uc3Qge3N0YXJ0LCBlbmR9ID0gc2NyaXB0Tm9kZTtcbiAgICAgICAgICByZWNvcmRlci5yZW1vdmUoc3RhcnQub2Zmc2V0LCBlbmQub2Zmc2V0IC0gc3RhcnQub2Zmc2V0KTtcbiAgICAgICAgICByZWNvcmRlci5pbnNlcnRSaWdodChzdGFydC5vZmZzZXQsIEpTT04uc3RyaW5naWZ5KGAke3NjcmlwdH0gJiYgJHtjdXJyZW50U2NyaXB0fWApKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgICAnSW52YWxpZCBwb3N0aW5zdGFsbCBzY3JpcHQgaW4gcGFja2FnZS5qc29uLiBXYXMgZXhwZWN0aW5nIGEgc3RyaW5nLicpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFdyaXRlIHRoZSBjaGFuZ2VzLlxuICB0cmVlLmNvbW1pdFVwZGF0ZShyZWNvcmRlcik7XG59XG4iXX0=