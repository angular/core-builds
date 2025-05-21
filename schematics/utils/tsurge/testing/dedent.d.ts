/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
/**
 * Template string function that can be used to dedent the resulting
 * string literal. The smallest common indentation will be omitted.
 * Additionally, whitespace in empty lines is removed.
 */
export declare function dedent(strings: TemplateStringsArray, ...values: any[]): string;
