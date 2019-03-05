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
        define("@angular/core/schematics/utils/project_tsconfig_paths", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /** Name of the default Angular CLI workspace configuration files. */
    const defaultWorkspaceConfigPaths = ['/angular.json', '/.angular.json'];
    /**
     * Gets all tsconfig paths from a CLI project by reading the workspace configuration
     * and looking for common tsconfig locations.
     */
    function getProjectTsConfigPaths(tree) {
        // Start with some tsconfig paths that are generally used within CLI projects.
        const tsconfigPaths = new Set([
            './tsconfig.json',
            './src/tsconfig.json',
            './src/tsconfig.app.json',
        ]);
        // Add any tsconfig directly referenced in a build or test task of the angular.json workspace.
        const workspace = getWorkspaceConfigGracefully(tree);
        if (workspace) {
            const projects = Object.keys(workspace.projects).map(name => workspace.projects[name]);
            for (const project of projects) {
                ['build', 'test'].forEach(targetName => {
                    if (project.targets && project.targets[targetName] && project.targets[targetName].options &&
                        project.targets[targetName].options.tsConfig) {
                        tsconfigPaths.add(project.targets[targetName].options.tsConfig);
                    }
                    if (project.architect && project.architect[targetName] &&
                        project.architect[targetName].options &&
                        project.architect[targetName].options.tsConfig) {
                        tsconfigPaths.add(project.architect[targetName].options.tsConfig);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdF90c2NvbmZpZ19wYXRocy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBSUgscUVBQXFFO0lBQ3JFLE1BQU0sMkJBQTJCLEdBQUcsQ0FBQyxlQUFlLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztJQUV4RTs7O09BR0c7SUFDSCxTQUFnQix1QkFBdUIsQ0FBQyxJQUFVO1FBQ2hELDhFQUE4RTtRQUM5RSxNQUFNLGFBQWEsR0FBRyxJQUFJLEdBQUcsQ0FBUztZQUNwQyxpQkFBaUI7WUFDakIscUJBQXFCO1lBQ3JCLHlCQUF5QjtTQUMxQixDQUFDLENBQUM7UUFFSCw4RkFBOEY7UUFDOUYsTUFBTSxTQUFTLEdBQUcsNEJBQTRCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFckQsSUFBSSxTQUFTLEVBQUU7WUFDYixNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDdkYsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLEVBQUU7Z0JBQzlCLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRTtvQkFDckMsSUFBSSxPQUFPLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPO3dCQUNyRixPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUU7d0JBQ2hELGFBQWEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7cUJBQ2pFO29CQUVELElBQUksT0FBTyxDQUFDLFNBQVMsSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQzt3QkFDbEQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPO3dCQUNyQyxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUU7d0JBQ2xELGFBQWEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7cUJBQ25FO2dCQUNILENBQUMsQ0FBQyxDQUFDO2FBQ0o7U0FDRjtRQUVELGlFQUFpRTtRQUNqRSxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUEvQkQsMERBK0JDO0lBRUQ7Ozs7O09BS0c7SUFDSCxTQUFTLDRCQUE0QixDQUFDLElBQVU7UUFDOUMsTUFBTSxJQUFJLEdBQUcsMkJBQTJCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ2pGLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBTSxDQUFDLENBQUM7UUFFdkMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRTtZQUMxQixPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsSUFBSTtZQUNGLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztTQUM1QztRQUFDLFdBQU07WUFDTixPQUFPLElBQUksQ0FBQztTQUNiO0lBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5cbi8qKiBOYW1lIG9mIHRoZSBkZWZhdWx0IEFuZ3VsYXIgQ0xJIHdvcmtzcGFjZSBjb25maWd1cmF0aW9uIGZpbGVzLiAqL1xuY29uc3QgZGVmYXVsdFdvcmtzcGFjZUNvbmZpZ1BhdGhzID0gWycvYW5ndWxhci5qc29uJywgJy8uYW5ndWxhci5qc29uJ107XG5cbi8qKlxuICogR2V0cyBhbGwgdHNjb25maWcgcGF0aHMgZnJvbSBhIENMSSBwcm9qZWN0IGJ5IHJlYWRpbmcgdGhlIHdvcmtzcGFjZSBjb25maWd1cmF0aW9uXG4gKiBhbmQgbG9va2luZyBmb3IgY29tbW9uIHRzY29uZmlnIGxvY2F0aW9ucy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFByb2plY3RUc0NvbmZpZ1BhdGhzKHRyZWU6IFRyZWUpOiBzdHJpbmdbXSB7XG4gIC8vIFN0YXJ0IHdpdGggc29tZSB0c2NvbmZpZyBwYXRocyB0aGF0IGFyZSBnZW5lcmFsbHkgdXNlZCB3aXRoaW4gQ0xJIHByb2plY3RzLlxuICBjb25zdCB0c2NvbmZpZ1BhdGhzID0gbmV3IFNldDxzdHJpbmc+KFtcbiAgICAnLi90c2NvbmZpZy5qc29uJyxcbiAgICAnLi9zcmMvdHNjb25maWcuanNvbicsXG4gICAgJy4vc3JjL3RzY29uZmlnLmFwcC5qc29uJyxcbiAgXSk7XG5cbiAgLy8gQWRkIGFueSB0c2NvbmZpZyBkaXJlY3RseSByZWZlcmVuY2VkIGluIGEgYnVpbGQgb3IgdGVzdCB0YXNrIG9mIHRoZSBhbmd1bGFyLmpzb24gd29ya3NwYWNlLlxuICBjb25zdCB3b3Jrc3BhY2UgPSBnZXRXb3Jrc3BhY2VDb25maWdHcmFjZWZ1bGx5KHRyZWUpO1xuXG4gIGlmICh3b3Jrc3BhY2UpIHtcbiAgICBjb25zdCBwcm9qZWN0cyA9IE9iamVjdC5rZXlzKHdvcmtzcGFjZS5wcm9qZWN0cykubWFwKG5hbWUgPT4gd29ya3NwYWNlLnByb2plY3RzW25hbWVdKTtcbiAgICBmb3IgKGNvbnN0IHByb2plY3Qgb2YgcHJvamVjdHMpIHtcbiAgICAgIFsnYnVpbGQnLCAndGVzdCddLmZvckVhY2godGFyZ2V0TmFtZSA9PiB7XG4gICAgICAgIGlmIChwcm9qZWN0LnRhcmdldHMgJiYgcHJvamVjdC50YXJnZXRzW3RhcmdldE5hbWVdICYmIHByb2plY3QudGFyZ2V0c1t0YXJnZXROYW1lXS5vcHRpb25zICYmXG4gICAgICAgICAgICBwcm9qZWN0LnRhcmdldHNbdGFyZ2V0TmFtZV0ub3B0aW9ucy50c0NvbmZpZykge1xuICAgICAgICAgIHRzY29uZmlnUGF0aHMuYWRkKHByb2plY3QudGFyZ2V0c1t0YXJnZXROYW1lXS5vcHRpb25zLnRzQ29uZmlnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9qZWN0LmFyY2hpdGVjdCAmJiBwcm9qZWN0LmFyY2hpdGVjdFt0YXJnZXROYW1lXSAmJlxuICAgICAgICAgICAgcHJvamVjdC5hcmNoaXRlY3RbdGFyZ2V0TmFtZV0ub3B0aW9ucyAmJlxuICAgICAgICAgICAgcHJvamVjdC5hcmNoaXRlY3RbdGFyZ2V0TmFtZV0ub3B0aW9ucy50c0NvbmZpZykge1xuICAgICAgICAgIHRzY29uZmlnUGF0aHMuYWRkKHByb2plY3QuYXJjaGl0ZWN0W3RhcmdldE5hbWVdLm9wdGlvbnMudHNDb25maWcpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvLyBGaWx0ZXIgb3V0IHRzY29uZmlnIGZpbGVzIHRoYXQgZG9uJ3QgZXhpc3QgaW4gdGhlIENMSSBwcm9qZWN0LlxuICByZXR1cm4gQXJyYXkuZnJvbSh0c2NvbmZpZ1BhdGhzKS5maWx0ZXIocCA9PiB0cmVlLmV4aXN0cyhwKSk7XG59XG5cbi8qKlxuICogUmVzb2x2ZSB0aGUgd29ya3NwYWNlIGNvbmZpZ3VyYXRpb24gb2YgdGhlIHNwZWNpZmllZCB0cmVlIGdyYWNlZnVsbHkuIFdlIGNhbm5vdCB1c2UgdGhlIHV0aWxpdHlcbiAqIGZ1bmN0aW9ucyBmcm9tIHRoZSBkZWZhdWx0IEFuZ3VsYXIgc2NoZW1hdGljcyBiZWNhdXNlIHRob3NlIG1pZ2h0IG5vdCBiZSBwcmVzZW50IGluIG9sZGVyXG4gKiB2ZXJzaW9ucyBvZiB0aGUgQ0xJLiBBbHNvIGl0J3MgaW1wb3J0YW50IHRvIHJlc29sdmUgdGhlIHdvcmtzcGFjZSBncmFjZWZ1bGx5IGJlY2F1c2VcbiAqIHRoZSBDTEkgcHJvamVjdCBjb3VsZCBiZSBzdGlsbCB1c2luZyBgLmFuZ3VsYXItY2xpLmpzb25gIGluc3RlYWQgb2YgdGhldyBuZXcgY29uZmlnLlxuICovXG5mdW5jdGlvbiBnZXRXb3Jrc3BhY2VDb25maWdHcmFjZWZ1bGx5KHRyZWU6IFRyZWUpOiBhbnkge1xuICBjb25zdCBwYXRoID0gZGVmYXVsdFdvcmtzcGFjZUNvbmZpZ1BhdGhzLmZpbmQoZmlsZVBhdGggPT4gdHJlZS5leGlzdHMoZmlsZVBhdGgpKTtcbiAgY29uc3QgY29uZmlnQnVmZmVyID0gdHJlZS5yZWFkKHBhdGggISk7XG5cbiAgaWYgKCFwYXRoIHx8ICFjb25maWdCdWZmZXIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UoY29uZmlnQnVmZmVyLnRvU3RyaW5nKCkpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIl19