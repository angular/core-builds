/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import ts from 'typescript';
/** Options that are good defaults for Tsurge migrations. */
export const defaultMigrationTsOptions = {
    // Avoid checking libraries to speed up migrations.
    skipLibCheck: true,
    skipDefaultLibCheck: true,
    noEmit: true,
    // Does not apply to g3 and externally is enforced when the app is built by the compiler.
    disableTypeScriptVersionCheck: true,
};
/**
 * Creates an instance of a TypeScript program for the given project.
 */
export function createPlainTsProgram(tsHost, tsconfig, optionOverrides) {
    const program = ts.createProgram({
        rootNames: tsconfig.rootNames,
        options: {
            ...tsconfig.options,
            ...defaultMigrationTsOptions,
            ...optionOverrides,
        },
    });
    return {
        ngCompiler: null,
        program,
        userOptions: tsconfig.options,
        __programAbsoluteRootFileNames: tsconfig.rootNames,
        host: tsHost,
    };
}
//# sourceMappingURL=ts_program.js.map