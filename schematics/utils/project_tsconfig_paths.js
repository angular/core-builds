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
        // Start with some tsconfig paths that are generally used within CLI projects.
        const tsconfigPaths = new Set([
            'tsconfig.json',
            'src/tsconfig.json',
            'src/tsconfig.app.json',
        ]);
        // Add any tsconfig directly referenced in a build or test task of the angular.json workspace.
        const workspace = getWorkspaceConfigGracefully(tree);
        if (workspace) {
            const projects = Object.keys(workspace.projects).map(name => workspace.projects[name]);
            for (const project of projects) {
                ['build', 'test'].forEach(targetName => {
                    if (project.targets && project.targets[targetName] && project.targets[targetName].options &&
                        project.targets[targetName].options.tsConfig) {
                        tsconfigPaths.add(core_1.normalize(project.targets[targetName].options.tsConfig));
                    }
                    if (project.architect && project.architect[targetName] &&
                        project.architect[targetName].options &&
                        project.architect[targetName].options.tsConfig) {
                        tsconfigPaths.add(core_1.normalize(project.architect[targetName].options.tsConfig));
                    }
                });
            }
        }
        // Filter out tsconfig files that don't exist in the CLI project.
        return Array.from(tsconfigPaths).filter(p => tree.exists(p));
    }
    exports.getProjectTsConfigPaths = getProjectTsConfigPaths;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdF90c2NvbmZpZ19wYXRocy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsK0NBQStDO0lBRy9DLHFFQUFxRTtJQUNyRSxNQUFNLDJCQUEyQixHQUFHLENBQUMsZUFBZSxFQUFFLGdCQUFnQixDQUFDLENBQUM7SUFFeEU7OztPQUdHO0lBQ0gsU0FBZ0IsdUJBQXVCLENBQUMsSUFBVTtRQUNoRCw4RUFBOEU7UUFDOUUsTUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLENBQVM7WUFDcEMsZUFBZTtZQUNmLG1CQUFtQjtZQUNuQix1QkFBdUI7U0FDeEIsQ0FBQyxDQUFDO1FBRUgsOEZBQThGO1FBQzlGLE1BQU0sU0FBUyxHQUFHLDRCQUE0QixDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXJELElBQUksU0FBUyxFQUFFO1lBQ2IsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3ZGLEtBQUssTUFBTSxPQUFPLElBQUksUUFBUSxFQUFFO2dCQUM5QixDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7b0JBQ3JDLElBQUksT0FBTyxDQUFDLE9BQU8sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTzt3QkFDckYsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFO3dCQUNoRCxhQUFhLENBQUMsR0FBRyxDQUFDLGdCQUFTLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztxQkFDNUU7b0JBRUQsSUFBSSxPQUFPLENBQUMsU0FBUyxJQUFJLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDO3dCQUNsRCxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU87d0JBQ3JDLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRTt3QkFDbEQsYUFBYSxDQUFDLEdBQUcsQ0FBQyxnQkFBUyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7cUJBQzlFO2dCQUNILENBQUMsQ0FBQyxDQUFDO2FBQ0o7U0FDRjtRQUVELGlFQUFpRTtRQUNqRSxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUEvQkQsMERBK0JDO0lBRUQ7Ozs7O09BS0c7SUFDSCxTQUFTLDRCQUE0QixDQUFDLElBQVU7UUFDOUMsTUFBTSxJQUFJLEdBQUcsMkJBQTJCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ2pGLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBTSxDQUFDLENBQUM7UUFFdkMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRTtZQUMxQixPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsSUFBSTtZQUNGLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztTQUM1QztRQUFDLFdBQU07WUFDTixPQUFPLElBQUksQ0FBQztTQUNiO0lBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtub3JtYWxpemV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7VHJlZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuXG4vKiogTmFtZSBvZiB0aGUgZGVmYXVsdCBBbmd1bGFyIENMSSB3b3Jrc3BhY2UgY29uZmlndXJhdGlvbiBmaWxlcy4gKi9cbmNvbnN0IGRlZmF1bHRXb3Jrc3BhY2VDb25maWdQYXRocyA9IFsnL2FuZ3VsYXIuanNvbicsICcvLmFuZ3VsYXIuanNvbiddO1xuXG4vKipcbiAqIEdldHMgYWxsIHRzY29uZmlnIHBhdGhzIGZyb20gYSBDTEkgcHJvamVjdCBieSByZWFkaW5nIHRoZSB3b3Jrc3BhY2UgY29uZmlndXJhdGlvblxuICogYW5kIGxvb2tpbmcgZm9yIGNvbW1vbiB0c2NvbmZpZyBsb2NhdGlvbnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9qZWN0VHNDb25maWdQYXRocyh0cmVlOiBUcmVlKTogc3RyaW5nW10ge1xuICAvLyBTdGFydCB3aXRoIHNvbWUgdHNjb25maWcgcGF0aHMgdGhhdCBhcmUgZ2VuZXJhbGx5IHVzZWQgd2l0aGluIENMSSBwcm9qZWN0cy5cbiAgY29uc3QgdHNjb25maWdQYXRocyA9IG5ldyBTZXQ8c3RyaW5nPihbXG4gICAgJ3RzY29uZmlnLmpzb24nLFxuICAgICdzcmMvdHNjb25maWcuanNvbicsXG4gICAgJ3NyYy90c2NvbmZpZy5hcHAuanNvbicsXG4gIF0pO1xuXG4gIC8vIEFkZCBhbnkgdHNjb25maWcgZGlyZWN0bHkgcmVmZXJlbmNlZCBpbiBhIGJ1aWxkIG9yIHRlc3QgdGFzayBvZiB0aGUgYW5ndWxhci5qc29uIHdvcmtzcGFjZS5cbiAgY29uc3Qgd29ya3NwYWNlID0gZ2V0V29ya3NwYWNlQ29uZmlnR3JhY2VmdWxseSh0cmVlKTtcblxuICBpZiAod29ya3NwYWNlKSB7XG4gICAgY29uc3QgcHJvamVjdHMgPSBPYmplY3Qua2V5cyh3b3Jrc3BhY2UucHJvamVjdHMpLm1hcChuYW1lID0+IHdvcmtzcGFjZS5wcm9qZWN0c1tuYW1lXSk7XG4gICAgZm9yIChjb25zdCBwcm9qZWN0IG9mIHByb2plY3RzKSB7XG4gICAgICBbJ2J1aWxkJywgJ3Rlc3QnXS5mb3JFYWNoKHRhcmdldE5hbWUgPT4ge1xuICAgICAgICBpZiAocHJvamVjdC50YXJnZXRzICYmIHByb2plY3QudGFyZ2V0c1t0YXJnZXROYW1lXSAmJiBwcm9qZWN0LnRhcmdldHNbdGFyZ2V0TmFtZV0ub3B0aW9ucyAmJlxuICAgICAgICAgICAgcHJvamVjdC50YXJnZXRzW3RhcmdldE5hbWVdLm9wdGlvbnMudHNDb25maWcpIHtcbiAgICAgICAgICB0c2NvbmZpZ1BhdGhzLmFkZChub3JtYWxpemUocHJvamVjdC50YXJnZXRzW3RhcmdldE5hbWVdLm9wdGlvbnMudHNDb25maWcpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9qZWN0LmFyY2hpdGVjdCAmJiBwcm9qZWN0LmFyY2hpdGVjdFt0YXJnZXROYW1lXSAmJlxuICAgICAgICAgICAgcHJvamVjdC5hcmNoaXRlY3RbdGFyZ2V0TmFtZV0ub3B0aW9ucyAmJlxuICAgICAgICAgICAgcHJvamVjdC5hcmNoaXRlY3RbdGFyZ2V0TmFtZV0ub3B0aW9ucy50c0NvbmZpZykge1xuICAgICAgICAgIHRzY29uZmlnUGF0aHMuYWRkKG5vcm1hbGl6ZShwcm9qZWN0LmFyY2hpdGVjdFt0YXJnZXROYW1lXS5vcHRpb25zLnRzQ29uZmlnKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIEZpbHRlciBvdXQgdHNjb25maWcgZmlsZXMgdGhhdCBkb24ndCBleGlzdCBpbiB0aGUgQ0xJIHByb2plY3QuXG4gIHJldHVybiBBcnJheS5mcm9tKHRzY29uZmlnUGF0aHMpLmZpbHRlcihwID0+IHRyZWUuZXhpc3RzKHApKTtcbn1cblxuLyoqXG4gKiBSZXNvbHZlIHRoZSB3b3Jrc3BhY2UgY29uZmlndXJhdGlvbiBvZiB0aGUgc3BlY2lmaWVkIHRyZWUgZ3JhY2VmdWxseS4gV2UgY2Fubm90IHVzZSB0aGUgdXRpbGl0eVxuICogZnVuY3Rpb25zIGZyb20gdGhlIGRlZmF1bHQgQW5ndWxhciBzY2hlbWF0aWNzIGJlY2F1c2UgdGhvc2UgbWlnaHQgbm90IGJlIHByZXNlbnQgaW4gb2xkZXJcbiAqIHZlcnNpb25zIG9mIHRoZSBDTEkuIEFsc28gaXQncyBpbXBvcnRhbnQgdG8gcmVzb2x2ZSB0aGUgd29ya3NwYWNlIGdyYWNlZnVsbHkgYmVjYXVzZVxuICogdGhlIENMSSBwcm9qZWN0IGNvdWxkIGJlIHN0aWxsIHVzaW5nIGAuYW5ndWxhci1jbGkuanNvbmAgaW5zdGVhZCBvZiB0aGV3IG5ldyBjb25maWcuXG4gKi9cbmZ1bmN0aW9uIGdldFdvcmtzcGFjZUNvbmZpZ0dyYWNlZnVsbHkodHJlZTogVHJlZSk6IGFueSB7XG4gIGNvbnN0IHBhdGggPSBkZWZhdWx0V29ya3NwYWNlQ29uZmlnUGF0aHMuZmluZChmaWxlUGF0aCA9PiB0cmVlLmV4aXN0cyhmaWxlUGF0aCkpO1xuICBjb25zdCBjb25maWdCdWZmZXIgPSB0cmVlLnJlYWQocGF0aCAhKTtcblxuICBpZiAoIXBhdGggfHwgIWNvbmZpZ0J1ZmZlcikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgdHJ5IHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShjb25maWdCdWZmZXIudG9TdHJpbmcoKSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iXX0=