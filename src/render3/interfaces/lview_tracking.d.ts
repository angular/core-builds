/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { LView } from './view';
/** Starts tracking an LView and returns a unique ID that can be used for future lookups. */
export declare function registerLView(lView: LView): number;
/** Gets an LView by its unique ID. */
export declare function getLViewById(id: number): LView | null;
/** Stops tracking an LView. */
export declare function unregisterLView(lView: LView): void;
