/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DebugContext } from './view';
export declare function getType(error: Error): Function;
export declare function getDebugContext(error: Error): DebugContext;
export declare function getOriginalError(error: Error): Error;
export declare function getErrorLogger(error: Error): (console: Console, ...values: any[]) => void;
