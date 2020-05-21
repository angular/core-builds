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
        define("@angular/core/schematics/utils/project_tsconfig_paths", ["require", "exports", "@angular-devkit/core"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getProjectTsConfigPaths = void 0;
    const core_1 = require("@angular-devkit/core");
    /** Name of the default Angular CLI workspace configuration files. */
    const defaultWorkspaceConfigPaths = ['/angular.json', '/.angular.json'];
    /**
     * Gets all tsconfig paths from a CLI project by reading the workspace configuration
     * and looking for common tsconfig locations.
     */
    function getProjectTsConfigPaths(tree) {
        // Start with some tsconfig paths that are generally used within CLI projects. Note
        // that we are not interested in IDE-specific tsconfig files (e.g. /tsconfig.json)
        const buildPaths = new Set(['src/tsconfig.app.json']);
        const testPaths = new Set(['src/tsconfig.spec.json']);
        // Add any tsconfig directly referenced in a build or test task of the angular.json workspace.
        const workspace = getWorkspaceConfigGracefully(tree);
        if (workspace) {
            const projects = Object.keys(workspace.projects).map(name => workspace.projects[name]);
            for (const project of projects) {
                const buildPath = getTargetTsconfigPath(project, 'build');
                const testPath = getTargetTsconfigPath(project, 'test');
                if (buildPath) {
                    buildPaths.add(buildPath);
                }
                if (testPath) {
                    testPaths.add(testPath);
                }
            }
        }
        // Filter out tsconfig files that don't exist in the CLI project.
        return {
            buildPaths: Array.from(buildPaths).filter(p => tree.exists(p)),
            testPaths: Array.from(testPaths).filter(p => tree.exists(p)),
        };
    }
    exports.getProjectTsConfigPaths = getProjectTsConfigPaths;
    /** Gets the tsconfig path from the given target within the specified project. */
    function getTargetTsconfigPath(project, targetName) {
        if (project.targets && project.targets[targetName] && project.targets[targetName].options &&
            project.targets[targetName].options.tsConfig) {
            return core_1.normalize(project.targets[targetName].options.tsConfig);
        }
        if (project.architect && project.architect[targetName] && project.architect[targetName].options &&
            project.architect[targetName].options.tsConfig) {
            return core_1.normalize(project.architect[targetName].options.tsConfig);
        }
        return null;
    }
    /**
     * Resolve the workspace configuration of the specified tree gracefully. We cannot use the utility
     * functions from the default Angular schematics because those might not be present in older
     * versions of the CLI. Also it's important to resolve the workspace gracefully because
     * the CLI project could be still using `.angular-cli.json` instead of thew new config.
     */
    function getWorkspaceConfigGracefully(tree) {
        const path = defaultWorkspaceConfigPaths.find(filePath => tree.exists(filePath));
        const configBuffer = tree.read(path);
        if (!path || !configBuffer) {
            return null;
        }
        try {
            // Parse the workspace file as JSON5 which is also supported for CLI
            // workspace configurations.
            return core_1.parseJson(configBuffer.toString(), core_1.JsonParseMode.Json5);
        }
        catch (e) {
            return null;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdF90c2NvbmZpZ19wYXRocy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILCtDQUF5RTtJQUl6RSxxRUFBcUU7SUFDckUsTUFBTSwyQkFBMkIsR0FBRyxDQUFDLGVBQWUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0lBRXhFOzs7T0FHRztJQUNILFNBQWdCLHVCQUF1QixDQUFDLElBQVU7UUFDaEQsbUZBQW1GO1FBQ25GLGtGQUFrRjtRQUNsRixNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBUyxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQztRQUM5RCxNQUFNLFNBQVMsR0FBRyxJQUFJLEdBQUcsQ0FBUyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQztRQUU5RCw4RkFBOEY7UUFDOUYsTUFBTSxTQUFTLEdBQUcsNEJBQTRCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFckQsSUFBSSxTQUFTLEVBQUU7WUFDYixNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDdkYsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLEVBQUU7Z0JBQzlCLE1BQU0sU0FBUyxHQUFHLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxRQUFRLEdBQUcscUJBQXFCLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUV4RCxJQUFJLFNBQVMsRUFBRTtvQkFDYixVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2lCQUMzQjtnQkFFRCxJQUFJLFFBQVEsRUFBRTtvQkFDWixTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2lCQUN6QjthQUNGO1NBQ0Y7UUFFRCxpRUFBaUU7UUFDakUsT0FBTztZQUNMLFVBQVUsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUQsU0FBUyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUM3RCxDQUFDO0lBQ0osQ0FBQztJQTlCRCwwREE4QkM7SUFFRCxpRkFBaUY7SUFDakYsU0FBUyxxQkFBcUIsQ0FBQyxPQUF5QixFQUFFLFVBQWtCO1FBQzFFLElBQUksT0FBTyxDQUFDLE9BQU8sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTztZQUNyRixPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUU7WUFDaEQsT0FBTyxnQkFBUyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ2hFO1FBRUQsSUFBSSxPQUFPLENBQUMsU0FBUyxJQUFJLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPO1lBQzNGLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRTtZQUNsRCxPQUFPLGdCQUFTLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDbEU7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFNBQVMsNEJBQTRCLENBQUMsSUFBVTtRQUM5QyxNQUFNLElBQUksR0FBRywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDakYsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFLLENBQUMsQ0FBQztRQUV0QyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFO1lBQzFCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxJQUFJO1lBQ0Ysb0VBQW9FO1lBQ3BFLDRCQUE0QjtZQUM1QixPQUFPLGdCQUFTLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxFQUFFLG9CQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDaEU7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLE9BQU8sSUFBSSxDQUFDO1NBQ2I7SUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0pzb25QYXJzZU1vZGUsIG5vcm1hbGl6ZSwgcGFyc2VKc29ufSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge1RyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7V29ya3NwYWNlUHJvamVjdH0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L3dvcmtzcGFjZS1tb2RlbHMnO1xuXG4vKiogTmFtZSBvZiB0aGUgZGVmYXVsdCBBbmd1bGFyIENMSSB3b3Jrc3BhY2UgY29uZmlndXJhdGlvbiBmaWxlcy4gKi9cbmNvbnN0IGRlZmF1bHRXb3Jrc3BhY2VDb25maWdQYXRocyA9IFsnL2FuZ3VsYXIuanNvbicsICcvLmFuZ3VsYXIuanNvbiddO1xuXG4vKipcbiAqIEdldHMgYWxsIHRzY29uZmlnIHBhdGhzIGZyb20gYSBDTEkgcHJvamVjdCBieSByZWFkaW5nIHRoZSB3b3Jrc3BhY2UgY29uZmlndXJhdGlvblxuICogYW5kIGxvb2tpbmcgZm9yIGNvbW1vbiB0c2NvbmZpZyBsb2NhdGlvbnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9qZWN0VHNDb25maWdQYXRocyh0cmVlOiBUcmVlKToge2J1aWxkUGF0aHM6IHN0cmluZ1tdLCB0ZXN0UGF0aHM6IHN0cmluZ1tdfSB7XG4gIC8vIFN0YXJ0IHdpdGggc29tZSB0c2NvbmZpZyBwYXRocyB0aGF0IGFyZSBnZW5lcmFsbHkgdXNlZCB3aXRoaW4gQ0xJIHByb2plY3RzLiBOb3RlXG4gIC8vIHRoYXQgd2UgYXJlIG5vdCBpbnRlcmVzdGVkIGluIElERS1zcGVjaWZpYyB0c2NvbmZpZyBmaWxlcyAoZS5nLiAvdHNjb25maWcuanNvbilcbiAgY29uc3QgYnVpbGRQYXRocyA9IG5ldyBTZXQ8c3RyaW5nPihbJ3NyYy90c2NvbmZpZy5hcHAuanNvbiddKTtcbiAgY29uc3QgdGVzdFBhdGhzID0gbmV3IFNldDxzdHJpbmc+KFsnc3JjL3RzY29uZmlnLnNwZWMuanNvbiddKTtcblxuICAvLyBBZGQgYW55IHRzY29uZmlnIGRpcmVjdGx5IHJlZmVyZW5jZWQgaW4gYSBidWlsZCBvciB0ZXN0IHRhc2sgb2YgdGhlIGFuZ3VsYXIuanNvbiB3b3Jrc3BhY2UuXG4gIGNvbnN0IHdvcmtzcGFjZSA9IGdldFdvcmtzcGFjZUNvbmZpZ0dyYWNlZnVsbHkodHJlZSk7XG5cbiAgaWYgKHdvcmtzcGFjZSkge1xuICAgIGNvbnN0IHByb2plY3RzID0gT2JqZWN0LmtleXMod29ya3NwYWNlLnByb2plY3RzKS5tYXAobmFtZSA9PiB3b3Jrc3BhY2UucHJvamVjdHNbbmFtZV0pO1xuICAgIGZvciAoY29uc3QgcHJvamVjdCBvZiBwcm9qZWN0cykge1xuICAgICAgY29uc3QgYnVpbGRQYXRoID0gZ2V0VGFyZ2V0VHNjb25maWdQYXRoKHByb2plY3QsICdidWlsZCcpO1xuICAgICAgY29uc3QgdGVzdFBhdGggPSBnZXRUYXJnZXRUc2NvbmZpZ1BhdGgocHJvamVjdCwgJ3Rlc3QnKTtcblxuICAgICAgaWYgKGJ1aWxkUGF0aCkge1xuICAgICAgICBidWlsZFBhdGhzLmFkZChidWlsZFBhdGgpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGVzdFBhdGgpIHtcbiAgICAgICAgdGVzdFBhdGhzLmFkZCh0ZXN0UGF0aCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gRmlsdGVyIG91dCB0c2NvbmZpZyBmaWxlcyB0aGF0IGRvbid0IGV4aXN0IGluIHRoZSBDTEkgcHJvamVjdC5cbiAgcmV0dXJuIHtcbiAgICBidWlsZFBhdGhzOiBBcnJheS5mcm9tKGJ1aWxkUGF0aHMpLmZpbHRlcihwID0+IHRyZWUuZXhpc3RzKHApKSxcbiAgICB0ZXN0UGF0aHM6IEFycmF5LmZyb20odGVzdFBhdGhzKS5maWx0ZXIocCA9PiB0cmVlLmV4aXN0cyhwKSksXG4gIH07XG59XG5cbi8qKiBHZXRzIHRoZSB0c2NvbmZpZyBwYXRoIGZyb20gdGhlIGdpdmVuIHRhcmdldCB3aXRoaW4gdGhlIHNwZWNpZmllZCBwcm9qZWN0LiAqL1xuZnVuY3Rpb24gZ2V0VGFyZ2V0VHNjb25maWdQYXRoKHByb2plY3Q6IFdvcmtzcGFjZVByb2plY3QsIHRhcmdldE5hbWU6IHN0cmluZyk6IHN0cmluZ3xudWxsIHtcbiAgaWYgKHByb2plY3QudGFyZ2V0cyAmJiBwcm9qZWN0LnRhcmdldHNbdGFyZ2V0TmFtZV0gJiYgcHJvamVjdC50YXJnZXRzW3RhcmdldE5hbWVdLm9wdGlvbnMgJiZcbiAgICAgIHByb2plY3QudGFyZ2V0c1t0YXJnZXROYW1lXS5vcHRpb25zLnRzQ29uZmlnKSB7XG4gICAgcmV0dXJuIG5vcm1hbGl6ZShwcm9qZWN0LnRhcmdldHNbdGFyZ2V0TmFtZV0ub3B0aW9ucy50c0NvbmZpZyk7XG4gIH1cblxuICBpZiAocHJvamVjdC5hcmNoaXRlY3QgJiYgcHJvamVjdC5hcmNoaXRlY3RbdGFyZ2V0TmFtZV0gJiYgcHJvamVjdC5hcmNoaXRlY3RbdGFyZ2V0TmFtZV0ub3B0aW9ucyAmJlxuICAgICAgcHJvamVjdC5hcmNoaXRlY3RbdGFyZ2V0TmFtZV0ub3B0aW9ucy50c0NvbmZpZykge1xuICAgIHJldHVybiBub3JtYWxpemUocHJvamVjdC5hcmNoaXRlY3RbdGFyZ2V0TmFtZV0ub3B0aW9ucy50c0NvbmZpZyk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogUmVzb2x2ZSB0aGUgd29ya3NwYWNlIGNvbmZpZ3VyYXRpb24gb2YgdGhlIHNwZWNpZmllZCB0cmVlIGdyYWNlZnVsbHkuIFdlIGNhbm5vdCB1c2UgdGhlIHV0aWxpdHlcbiAqIGZ1bmN0aW9ucyBmcm9tIHRoZSBkZWZhdWx0IEFuZ3VsYXIgc2NoZW1hdGljcyBiZWNhdXNlIHRob3NlIG1pZ2h0IG5vdCBiZSBwcmVzZW50IGluIG9sZGVyXG4gKiB2ZXJzaW9ucyBvZiB0aGUgQ0xJLiBBbHNvIGl0J3MgaW1wb3J0YW50IHRvIHJlc29sdmUgdGhlIHdvcmtzcGFjZSBncmFjZWZ1bGx5IGJlY2F1c2VcbiAqIHRoZSBDTEkgcHJvamVjdCBjb3VsZCBiZSBzdGlsbCB1c2luZyBgLmFuZ3VsYXItY2xpLmpzb25gIGluc3RlYWQgb2YgdGhldyBuZXcgY29uZmlnLlxuICovXG5mdW5jdGlvbiBnZXRXb3Jrc3BhY2VDb25maWdHcmFjZWZ1bGx5KHRyZWU6IFRyZWUpOiBhbnkge1xuICBjb25zdCBwYXRoID0gZGVmYXVsdFdvcmtzcGFjZUNvbmZpZ1BhdGhzLmZpbmQoZmlsZVBhdGggPT4gdHJlZS5leGlzdHMoZmlsZVBhdGgpKTtcbiAgY29uc3QgY29uZmlnQnVmZmVyID0gdHJlZS5yZWFkKHBhdGghKTtcblxuICBpZiAoIXBhdGggfHwgIWNvbmZpZ0J1ZmZlcikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgdHJ5IHtcbiAgICAvLyBQYXJzZSB0aGUgd29ya3NwYWNlIGZpbGUgYXMgSlNPTjUgd2hpY2ggaXMgYWxzbyBzdXBwb3J0ZWQgZm9yIENMSVxuICAgIC8vIHdvcmtzcGFjZSBjb25maWd1cmF0aW9ucy5cbiAgICByZXR1cm4gcGFyc2VKc29uKGNvbmZpZ0J1ZmZlci50b1N0cmluZygpLCBKc29uUGFyc2VNb2RlLkpzb241KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iXX0=