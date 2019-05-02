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
            return JSON.parse(configBuffer.toString());
        }
        catch (_a) {
            return null;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdF90c2NvbmZpZ19wYXRocy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsK0NBQStDO0lBSS9DLHFFQUFxRTtJQUNyRSxNQUFNLDJCQUEyQixHQUFHLENBQUMsZUFBZSxFQUFFLGdCQUFnQixDQUFDLENBQUM7SUFFeEU7OztPQUdHO0lBQ0gsU0FBZ0IsdUJBQXVCLENBQUMsSUFBVTtRQUNoRCxtRkFBbUY7UUFDbkYsa0ZBQWtGO1FBQ2xGLE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxDQUFTLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDO1FBQzlELE1BQU0sU0FBUyxHQUFHLElBQUksR0FBRyxDQUFTLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDO1FBRTlELDhGQUE4RjtRQUM5RixNQUFNLFNBQVMsR0FBRyw0QkFBNEIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVyRCxJQUFJLFNBQVMsRUFBRTtZQUNiLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN2RixLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRTtnQkFDOUIsTUFBTSxTQUFTLEdBQUcscUJBQXFCLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUMxRCxNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBRXhELElBQUksU0FBUyxFQUFFO29CQUNiLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7aUJBQzNCO2dCQUVELElBQUksUUFBUSxFQUFFO29CQUNaLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7aUJBQ3pCO2FBQ0Y7U0FDRjtRQUVELGlFQUFpRTtRQUNqRSxPQUFPO1lBQ0wsVUFBVSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5RCxTQUFTLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQzdELENBQUM7SUFDSixDQUFDO0lBOUJELDBEQThCQztJQUVELGlGQUFpRjtJQUNqRixTQUFTLHFCQUFxQixDQUFDLE9BQXlCLEVBQUUsVUFBa0I7UUFDMUUsSUFBSSxPQUFPLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPO1lBQ3JGLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRTtZQUNoRCxPQUFPLGdCQUFTLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDaEU7UUFFRCxJQUFJLE9BQU8sQ0FBQyxTQUFTLElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU87WUFDM0YsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFO1lBQ2xELE9BQU8sZ0JBQVMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUNsRTtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsU0FBUyw0QkFBNEIsQ0FBQyxJQUFVO1FBQzlDLE1BQU0sSUFBSSxHQUFHLDJCQUEyQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNqRixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQU0sQ0FBQyxDQUFDO1FBRXZDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUU7WUFDMUIsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELElBQUk7WUFDRixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDNUM7UUFBQyxXQUFNO1lBQ04sT0FBTyxJQUFJLENBQUM7U0FDYjtJQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7bm9ybWFsaXplfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge1RyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7V29ya3NwYWNlUHJvamVjdH0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L3dvcmtzcGFjZS1tb2RlbHMnO1xuXG4vKiogTmFtZSBvZiB0aGUgZGVmYXVsdCBBbmd1bGFyIENMSSB3b3Jrc3BhY2UgY29uZmlndXJhdGlvbiBmaWxlcy4gKi9cbmNvbnN0IGRlZmF1bHRXb3Jrc3BhY2VDb25maWdQYXRocyA9IFsnL2FuZ3VsYXIuanNvbicsICcvLmFuZ3VsYXIuanNvbiddO1xuXG4vKipcbiAqIEdldHMgYWxsIHRzY29uZmlnIHBhdGhzIGZyb20gYSBDTEkgcHJvamVjdCBieSByZWFkaW5nIHRoZSB3b3Jrc3BhY2UgY29uZmlndXJhdGlvblxuICogYW5kIGxvb2tpbmcgZm9yIGNvbW1vbiB0c2NvbmZpZyBsb2NhdGlvbnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9qZWN0VHNDb25maWdQYXRocyh0cmVlOiBUcmVlKToge2J1aWxkUGF0aHM6IHN0cmluZ1tdLCB0ZXN0UGF0aHM6IHN0cmluZ1tdfSB7XG4gIC8vIFN0YXJ0IHdpdGggc29tZSB0c2NvbmZpZyBwYXRocyB0aGF0IGFyZSBnZW5lcmFsbHkgdXNlZCB3aXRoaW4gQ0xJIHByb2plY3RzLiBOb3RlXG4gIC8vIHRoYXQgd2UgYXJlIG5vdCBpbnRlcmVzdGVkIGluIElERS1zcGVjaWZpYyB0c2NvbmZpZyBmaWxlcyAoZS5nLiAvdHNjb25maWcuanNvbilcbiAgY29uc3QgYnVpbGRQYXRocyA9IG5ldyBTZXQ8c3RyaW5nPihbJ3NyYy90c2NvbmZpZy5hcHAuanNvbiddKTtcbiAgY29uc3QgdGVzdFBhdGhzID0gbmV3IFNldDxzdHJpbmc+KFsnc3JjL3RzY29uZmlnLnNwZWMuanNvbiddKTtcblxuICAvLyBBZGQgYW55IHRzY29uZmlnIGRpcmVjdGx5IHJlZmVyZW5jZWQgaW4gYSBidWlsZCBvciB0ZXN0IHRhc2sgb2YgdGhlIGFuZ3VsYXIuanNvbiB3b3Jrc3BhY2UuXG4gIGNvbnN0IHdvcmtzcGFjZSA9IGdldFdvcmtzcGFjZUNvbmZpZ0dyYWNlZnVsbHkodHJlZSk7XG5cbiAgaWYgKHdvcmtzcGFjZSkge1xuICAgIGNvbnN0IHByb2plY3RzID0gT2JqZWN0LmtleXMod29ya3NwYWNlLnByb2plY3RzKS5tYXAobmFtZSA9PiB3b3Jrc3BhY2UucHJvamVjdHNbbmFtZV0pO1xuICAgIGZvciAoY29uc3QgcHJvamVjdCBvZiBwcm9qZWN0cykge1xuICAgICAgY29uc3QgYnVpbGRQYXRoID0gZ2V0VGFyZ2V0VHNjb25maWdQYXRoKHByb2plY3QsICdidWlsZCcpO1xuICAgICAgY29uc3QgdGVzdFBhdGggPSBnZXRUYXJnZXRUc2NvbmZpZ1BhdGgocHJvamVjdCwgJ3Rlc3QnKTtcblxuICAgICAgaWYgKGJ1aWxkUGF0aCkge1xuICAgICAgICBidWlsZFBhdGhzLmFkZChidWlsZFBhdGgpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGVzdFBhdGgpIHtcbiAgICAgICAgdGVzdFBhdGhzLmFkZCh0ZXN0UGF0aCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gRmlsdGVyIG91dCB0c2NvbmZpZyBmaWxlcyB0aGF0IGRvbid0IGV4aXN0IGluIHRoZSBDTEkgcHJvamVjdC5cbiAgcmV0dXJuIHtcbiAgICBidWlsZFBhdGhzOiBBcnJheS5mcm9tKGJ1aWxkUGF0aHMpLmZpbHRlcihwID0+IHRyZWUuZXhpc3RzKHApKSxcbiAgICB0ZXN0UGF0aHM6IEFycmF5LmZyb20odGVzdFBhdGhzKS5maWx0ZXIocCA9PiB0cmVlLmV4aXN0cyhwKSksXG4gIH07XG59XG5cbi8qKiBHZXRzIHRoZSB0c2NvbmZpZyBwYXRoIGZyb20gdGhlIGdpdmVuIHRhcmdldCB3aXRoaW4gdGhlIHNwZWNpZmllZCBwcm9qZWN0LiAqL1xuZnVuY3Rpb24gZ2V0VGFyZ2V0VHNjb25maWdQYXRoKHByb2plY3Q6IFdvcmtzcGFjZVByb2plY3QsIHRhcmdldE5hbWU6IHN0cmluZyk6IHN0cmluZ3xudWxsIHtcbiAgaWYgKHByb2plY3QudGFyZ2V0cyAmJiBwcm9qZWN0LnRhcmdldHNbdGFyZ2V0TmFtZV0gJiYgcHJvamVjdC50YXJnZXRzW3RhcmdldE5hbWVdLm9wdGlvbnMgJiZcbiAgICAgIHByb2plY3QudGFyZ2V0c1t0YXJnZXROYW1lXS5vcHRpb25zLnRzQ29uZmlnKSB7XG4gICAgcmV0dXJuIG5vcm1hbGl6ZShwcm9qZWN0LnRhcmdldHNbdGFyZ2V0TmFtZV0ub3B0aW9ucy50c0NvbmZpZyk7XG4gIH1cblxuICBpZiAocHJvamVjdC5hcmNoaXRlY3QgJiYgcHJvamVjdC5hcmNoaXRlY3RbdGFyZ2V0TmFtZV0gJiYgcHJvamVjdC5hcmNoaXRlY3RbdGFyZ2V0TmFtZV0ub3B0aW9ucyAmJlxuICAgICAgcHJvamVjdC5hcmNoaXRlY3RbdGFyZ2V0TmFtZV0ub3B0aW9ucy50c0NvbmZpZykge1xuICAgIHJldHVybiBub3JtYWxpemUocHJvamVjdC5hcmNoaXRlY3RbdGFyZ2V0TmFtZV0ub3B0aW9ucy50c0NvbmZpZyk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogUmVzb2x2ZSB0aGUgd29ya3NwYWNlIGNvbmZpZ3VyYXRpb24gb2YgdGhlIHNwZWNpZmllZCB0cmVlIGdyYWNlZnVsbHkuIFdlIGNhbm5vdCB1c2UgdGhlIHV0aWxpdHlcbiAqIGZ1bmN0aW9ucyBmcm9tIHRoZSBkZWZhdWx0IEFuZ3VsYXIgc2NoZW1hdGljcyBiZWNhdXNlIHRob3NlIG1pZ2h0IG5vdCBiZSBwcmVzZW50IGluIG9sZGVyXG4gKiB2ZXJzaW9ucyBvZiB0aGUgQ0xJLiBBbHNvIGl0J3MgaW1wb3J0YW50IHRvIHJlc29sdmUgdGhlIHdvcmtzcGFjZSBncmFjZWZ1bGx5IGJlY2F1c2VcbiAqIHRoZSBDTEkgcHJvamVjdCBjb3VsZCBiZSBzdGlsbCB1c2luZyBgLmFuZ3VsYXItY2xpLmpzb25gIGluc3RlYWQgb2YgdGhldyBuZXcgY29uZmlnLlxuICovXG5mdW5jdGlvbiBnZXRXb3Jrc3BhY2VDb25maWdHcmFjZWZ1bGx5KHRyZWU6IFRyZWUpOiBhbnkge1xuICBjb25zdCBwYXRoID0gZGVmYXVsdFdvcmtzcGFjZUNvbmZpZ1BhdGhzLmZpbmQoZmlsZVBhdGggPT4gdHJlZS5leGlzdHMoZmlsZVBhdGgpKTtcbiAgY29uc3QgY29uZmlnQnVmZmVyID0gdHJlZS5yZWFkKHBhdGggISk7XG5cbiAgaWYgKCFwYXRoIHx8ICFjb25maWdCdWZmZXIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UoY29uZmlnQnVmZmVyLnRvU3RyaW5nKCkpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIl19