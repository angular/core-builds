/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    /**
     * Gets all tsconfig paths from a CLI project by reading the workspace configuration
     * and looking for common tsconfig locations.
     */
    function getProjectTsConfigPaths(tree) {
        return __awaiter(this, void 0, void 0, function* () {
            // Start with some tsconfig paths that are generally used within CLI projects. Note
            // that we are not interested in IDE-specific tsconfig files (e.g. /tsconfig.json)
            const buildPaths = new Set();
            const testPaths = new Set();
            const workspace = yield getWorkspace(tree);
            for (const [, project] of workspace.projects) {
                for (const [name, target] of project.targets) {
                    if (name !== 'build' && name !== 'test') {
                        continue;
                    }
                    for (const [, options] of allTargetOptions(target)) {
                        const tsConfig = options.tsConfig;
                        // Filter out tsconfig files that don't exist in the CLI project.
                        if (typeof tsConfig !== 'string' || !tree.exists(tsConfig)) {
                            continue;
                        }
                        if (name === 'build') {
                            buildPaths.add(core_1.normalize(tsConfig));
                        }
                        else {
                            testPaths.add(core_1.normalize(tsConfig));
                        }
                    }
                }
            }
            return {
                buildPaths: [...buildPaths],
                testPaths: [...testPaths],
            };
        });
    }
    exports.getProjectTsConfigPaths = getProjectTsConfigPaths;
    /** Get options for all configurations for the passed builder target. */
    function* allTargetOptions(target) {
        if (target.options) {
            yield [undefined, target.options];
        }
        if (!target.configurations) {
            return;
        }
        for (const [name, options] of Object.entries(target.configurations)) {
            if (options) {
                yield [name, options];
            }
        }
    }
    function createHost(tree) {
        return {
            readFile(path) {
                return __awaiter(this, void 0, void 0, function* () {
                    const data = tree.read(path);
                    if (!data) {
                        throw new Error('File not found.');
                    }
                    return core_1.virtualFs.fileBufferToString(data);
                });
            },
            writeFile(path, data) {
                return __awaiter(this, void 0, void 0, function* () {
                    return tree.overwrite(path, data);
                });
            },
            isDirectory(path) {
                return __awaiter(this, void 0, void 0, function* () {
                    // Approximate a directory check.
                    // We don't need to consider empty directories and hence this is a good enough approach.
                    // This is also per documentation, see:
                    // https://angular.io/guide/schematics-for-libraries#get-the-project-configuration
                    return !tree.exists(path) && tree.getDir(path).subfiles.length > 0;
                });
            },
            isFile(path) {
                return __awaiter(this, void 0, void 0, function* () {
                    return tree.exists(path);
                });
            },
        };
    }
    function getWorkspace(tree) {
        return __awaiter(this, void 0, void 0, function* () {
            const host = createHost(tree);
            const { workspace } = yield core_1.workspaces.readWorkspace('/', host);
            return workspace;
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdF90c2NvbmZpZ19wYXRocy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUVILCtDQUE0RTtJQUc1RTs7O09BR0c7SUFDSCxTQUFzQix1QkFBdUIsQ0FBQyxJQUFVOztZQUV0RCxtRkFBbUY7WUFDbkYsa0ZBQWtGO1lBQ2xGLE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7WUFDckMsTUFBTSxTQUFTLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztZQUVwQyxNQUFNLFNBQVMsR0FBRyxNQUFNLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMzQyxLQUFLLE1BQU0sQ0FBQyxFQUFFLE9BQU8sQ0FBQyxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUU7Z0JBQzVDLEtBQUssTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFO29CQUM1QyxJQUFJLElBQUksS0FBSyxPQUFPLElBQUksSUFBSSxLQUFLLE1BQU0sRUFBRTt3QkFDdkMsU0FBUztxQkFDVjtvQkFFRCxLQUFLLE1BQU0sQ0FBQyxFQUFFLE9BQU8sQ0FBQyxJQUFJLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxFQUFFO3dCQUNsRCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDO3dCQUNsQyxpRUFBaUU7d0JBQ2pFLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRTs0QkFDMUQsU0FBUzt5QkFDVjt3QkFFRCxJQUFJLElBQUksS0FBSyxPQUFPLEVBQUU7NEJBQ3BCLFVBQVUsQ0FBQyxHQUFHLENBQUMsZ0JBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO3lCQUNyQzs2QkFBTTs0QkFDTCxTQUFTLENBQUMsR0FBRyxDQUFDLGdCQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQzt5QkFDcEM7cUJBQ0Y7aUJBQ0Y7YUFDRjtZQUVELE9BQU87Z0JBQ0wsVUFBVSxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUM7Z0JBQzNCLFNBQVMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDO2FBQzFCLENBQUM7UUFDSixDQUFDO0tBQUE7SUFsQ0QsMERBa0NDO0lBRUQsd0VBQXdFO0lBQ3hFLFFBQVEsQ0FBQyxDQUNMLGdCQUFnQixDQUFDLE1BQW1DO1FBRXRELElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRTtZQUNsQixNQUFNLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUNuQztRQUVELElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFO1lBQzFCLE9BQU87U0FDUjtRQUVELEtBQUssTUFBTSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsRUFBRTtZQUNuRSxJQUFJLE9BQU8sRUFBRTtnQkFDWCxNQUFNLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2FBQ3ZCO1NBQ0Y7SUFDSCxDQUFDO0lBRUQsU0FBUyxVQUFVLENBQUMsSUFBVTtRQUM1QixPQUFPO1lBQ0MsUUFBUSxDQUFDLElBQVk7O29CQUN6QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUM3QixJQUFJLENBQUMsSUFBSSxFQUFFO3dCQUNULE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztxQkFDcEM7b0JBRUQsT0FBTyxnQkFBUyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM1QyxDQUFDO2FBQUE7WUFDSyxTQUFTLENBQUMsSUFBWSxFQUFFLElBQVk7O29CQUN4QyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNwQyxDQUFDO2FBQUE7WUFDSyxXQUFXLENBQUMsSUFBWTs7b0JBQzVCLGlDQUFpQztvQkFDakMsd0ZBQXdGO29CQUN4Rix1Q0FBdUM7b0JBQ3ZDLGtGQUFrRjtvQkFDbEYsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztnQkFDckUsQ0FBQzthQUFBO1lBQ0ssTUFBTSxDQUFDLElBQVk7O29CQUN2QixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzNCLENBQUM7YUFBQTtTQUNGLENBQUM7SUFDSixDQUFDO0lBRUQsU0FBZSxZQUFZLENBQUMsSUFBVTs7WUFDcEMsTUFBTSxJQUFJLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlCLE1BQU0sRUFBQyxTQUFTLEVBQUMsR0FBRyxNQUFNLGlCQUFVLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUU5RCxPQUFPLFNBQVMsQ0FBQztRQUNuQixDQUFDO0tBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtqc29uLCBub3JtYWxpemUsIHZpcnR1YWxGcywgd29ya3NwYWNlc30gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5cbi8qKlxuICogR2V0cyBhbGwgdHNjb25maWcgcGF0aHMgZnJvbSBhIENMSSBwcm9qZWN0IGJ5IHJlYWRpbmcgdGhlIHdvcmtzcGFjZSBjb25maWd1cmF0aW9uXG4gKiBhbmQgbG9va2luZyBmb3IgY29tbW9uIHRzY29uZmlnIGxvY2F0aW9ucy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFByb2plY3RUc0NvbmZpZ1BhdGhzKHRyZWU6IFRyZWUpOlxuICAgIFByb21pc2U8e2J1aWxkUGF0aHM6IHN0cmluZ1tdOyB0ZXN0UGF0aHM6IHN0cmluZ1tdO30+IHtcbiAgLy8gU3RhcnQgd2l0aCBzb21lIHRzY29uZmlnIHBhdGhzIHRoYXQgYXJlIGdlbmVyYWxseSB1c2VkIHdpdGhpbiBDTEkgcHJvamVjdHMuIE5vdGVcbiAgLy8gdGhhdCB3ZSBhcmUgbm90IGludGVyZXN0ZWQgaW4gSURFLXNwZWNpZmljIHRzY29uZmlnIGZpbGVzIChlLmcuIC90c2NvbmZpZy5qc29uKVxuICBjb25zdCBidWlsZFBhdGhzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHRlc3RQYXRocyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGNvbnN0IHdvcmtzcGFjZSA9IGF3YWl0IGdldFdvcmtzcGFjZSh0cmVlKTtcbiAgZm9yIChjb25zdCBbLCBwcm9qZWN0XSBvZiB3b3Jrc3BhY2UucHJvamVjdHMpIHtcbiAgICBmb3IgKGNvbnN0IFtuYW1lLCB0YXJnZXRdIG9mIHByb2plY3QudGFyZ2V0cykge1xuICAgICAgaWYgKG5hbWUgIT09ICdidWlsZCcgJiYgbmFtZSAhPT0gJ3Rlc3QnKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IFssIG9wdGlvbnNdIG9mIGFsbFRhcmdldE9wdGlvbnModGFyZ2V0KSkge1xuICAgICAgICBjb25zdCB0c0NvbmZpZyA9IG9wdGlvbnMudHNDb25maWc7XG4gICAgICAgIC8vIEZpbHRlciBvdXQgdHNjb25maWcgZmlsZXMgdGhhdCBkb24ndCBleGlzdCBpbiB0aGUgQ0xJIHByb2plY3QuXG4gICAgICAgIGlmICh0eXBlb2YgdHNDb25maWcgIT09ICdzdHJpbmcnIHx8ICF0cmVlLmV4aXN0cyh0c0NvbmZpZykpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChuYW1lID09PSAnYnVpbGQnKSB7XG4gICAgICAgICAgYnVpbGRQYXRocy5hZGQobm9ybWFsaXplKHRzQ29uZmlnKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGVzdFBhdGhzLmFkZChub3JtYWxpemUodHNDb25maWcpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgYnVpbGRQYXRoczogWy4uLmJ1aWxkUGF0aHNdLFxuICAgIHRlc3RQYXRoczogWy4uLnRlc3RQYXRoc10sXG4gIH07XG59XG5cbi8qKiBHZXQgb3B0aW9ucyBmb3IgYWxsIGNvbmZpZ3VyYXRpb25zIGZvciB0aGUgcGFzc2VkIGJ1aWxkZXIgdGFyZ2V0LiAqL1xuZnVuY3Rpb24qXG4gICAgYWxsVGFyZ2V0T3B0aW9ucyh0YXJnZXQ6IHdvcmtzcGFjZXMuVGFyZ2V0RGVmaW5pdGlvbik6XG4gICAgICAgIEl0ZXJhYmxlPFtzdHJpbmcgfCB1bmRlZmluZWQsIFJlY29yZDxzdHJpbmcsIGpzb24uSnNvblZhbHVlfHVuZGVmaW5lZD5dPiB7XG4gIGlmICh0YXJnZXQub3B0aW9ucykge1xuICAgIHlpZWxkIFt1bmRlZmluZWQsIHRhcmdldC5vcHRpb25zXTtcbiAgfVxuXG4gIGlmICghdGFyZ2V0LmNvbmZpZ3VyYXRpb25zKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgZm9yIChjb25zdCBbbmFtZSwgb3B0aW9uc10gb2YgT2JqZWN0LmVudHJpZXModGFyZ2V0LmNvbmZpZ3VyYXRpb25zKSkge1xuICAgIGlmIChvcHRpb25zKSB7XG4gICAgICB5aWVsZCBbbmFtZSwgb3B0aW9uc107XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUhvc3QodHJlZTogVHJlZSk6IHdvcmtzcGFjZXMuV29ya3NwYWNlSG9zdCB7XG4gIHJldHVybiB7XG4gICAgYXN5bmMgcmVhZEZpbGUocGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSB0cmVlLnJlYWQocGF0aCk7XG4gICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGaWxlIG5vdCBmb3VuZC4nKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHZpcnR1YWxGcy5maWxlQnVmZmVyVG9TdHJpbmcoZGF0YSk7XG4gICAgfSxcbiAgICBhc3luYyB3cml0ZUZpbGUocGF0aDogc3RyaW5nLCBkYXRhOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgIHJldHVybiB0cmVlLm92ZXJ3cml0ZShwYXRoLCBkYXRhKTtcbiAgICB9LFxuICAgIGFzeW5jIGlzRGlyZWN0b3J5KHBhdGg6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgLy8gQXBwcm94aW1hdGUgYSBkaXJlY3RvcnkgY2hlY2suXG4gICAgICAvLyBXZSBkb24ndCBuZWVkIHRvIGNvbnNpZGVyIGVtcHR5IGRpcmVjdG9yaWVzIGFuZCBoZW5jZSB0aGlzIGlzIGEgZ29vZCBlbm91Z2ggYXBwcm9hY2guXG4gICAgICAvLyBUaGlzIGlzIGFsc28gcGVyIGRvY3VtZW50YXRpb24sIHNlZTpcbiAgICAgIC8vIGh0dHBzOi8vYW5ndWxhci5pby9ndWlkZS9zY2hlbWF0aWNzLWZvci1saWJyYXJpZXMjZ2V0LXRoZS1wcm9qZWN0LWNvbmZpZ3VyYXRpb25cbiAgICAgIHJldHVybiAhdHJlZS5leGlzdHMocGF0aCkgJiYgdHJlZS5nZXREaXIocGF0aCkuc3ViZmlsZXMubGVuZ3RoID4gMDtcbiAgICB9LFxuICAgIGFzeW5jIGlzRmlsZShwYXRoOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgIHJldHVybiB0cmVlLmV4aXN0cyhwYXRoKTtcbiAgICB9LFxuICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRXb3Jrc3BhY2UodHJlZTogVHJlZSk6IFByb21pc2U8d29ya3NwYWNlcy5Xb3Jrc3BhY2VEZWZpbml0aW9uPiB7XG4gIGNvbnN0IGhvc3QgPSBjcmVhdGVIb3N0KHRyZWUpO1xuICBjb25zdCB7d29ya3NwYWNlfSA9IGF3YWl0IHdvcmtzcGFjZXMucmVhZFdvcmtzcGFjZSgnLycsIGhvc3QpO1xuXG4gIHJldHVybiB3b3Jrc3BhY2U7XG59XG4iXX0=