/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { getFileSystem, isLocalRelativePath, } from '@angular/compiler-cli/src/ngtsc/file_system';
/**
 * Gets a project file instance for the given file.
 *
 * Use this helper for dealing with project paths throughout your
 * migration. The return type is serializable.
 *
 * See {@link ProjectFile}.
 */
export function projectFile(file, { sortedRootDirs, projectRoot }) {
    const fs = getFileSystem();
    const filePath = fs.resolve(typeof file === 'string' ? file : file.fileName);
    // Sorted root directories are sorted longest to shortest. First match
    // is the appropriate root directory for ID computation.
    for (const rootDir of sortedRootDirs) {
        if (!isWithinBasePath(fs, rootDir, filePath)) {
            continue;
        }
        return {
            id: fs.relative(rootDir, filePath),
            rootRelativePath: fs.relative(projectRoot, filePath),
        };
    }
    // E.g. project directory may be `src/`, but files may be looked up
    // from `node_modules/`. This is fine, but in those cases, no root
    // directory matches.
    const rootRelativePath = fs.relative(projectRoot, filePath);
    return {
        id: rootRelativePath,
        rootRelativePath: rootRelativePath,
    };
}
/**
 * Whether `path` is a descendant of the `base`?
 * E.g. `a/b/c` is within `a/b` but not within `a/x`.
 */
function isWithinBasePath(fs, base, path) {
    return isLocalRelativePath(fs.relative(base, path));
}
//# sourceMappingURL=project_paths.js.map