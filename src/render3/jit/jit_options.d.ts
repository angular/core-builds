/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ViewEncapsulation } from '../../metadata/view';
export interface JitCompilerOptions {
    defaultEncapsulation?: ViewEncapsulation;
    preserveWhitespaces?: boolean;
}
export declare function setJitOptions(options: JitCompilerOptions): void;
export declare function getJitOptions(): JitCompilerOptions | null;
export declare function resetJitOptions(): void;
