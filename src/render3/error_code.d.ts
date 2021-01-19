/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export declare const enum RuntimeErrorCode {
    EXPRESSION_CHANGED_AFTER_CHECKED = "100",
    CYCLIC_DI_DEPENDENCY = "200",
    PROVIDER_NOT_FOUND = "201",
    MULTIPLE_COMPONENTS_MATCH = "300",
    EXPORT_NOT_FOUND = "301",
    PIPE_NOT_FOUND = "302",
    UNKNOWN_BINDING = "303",
    UNKNOWN_ELEMENT = "304"
}
export declare class RuntimeError extends Error {
    code: RuntimeErrorCode;
    constructor(code: RuntimeErrorCode, message: string);
}
export declare const RUNTIME_ERRORS_WITH_GUIDES: Set<RuntimeErrorCode>;
/** Called to format a runtime error */
export declare function formatRuntimeError(code: RuntimeErrorCode, message: string): string;
