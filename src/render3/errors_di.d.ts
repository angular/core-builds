/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectorType } from '../di/interface/defs';
/** Called when directives inject each other (creating a circular dependency) */
export declare function throwCyclicDependencyError(token: string, path?: string[]): never;
export declare function throwMixedMultiProviderError(): void;
export declare function throwInvalidProviderError(ngModuleType?: InjectorType<any>, providers?: any[], provider?: any): void;
/** Throws an error when a token is not found in DI. */
export declare function throwProviderNotFoundError(token: any, injectorName?: string): never;
