/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RenderFlags } from '../interfaces/definition';
/**
 * Marks the start of an embedded view.
 *
 * @param viewBlockId The ID of this view
 * @return boolean Whether or not this view is in creation mode
 *
 * @publicApi
 */
export declare function ΔembeddedViewStart(viewBlockId: number, consts: number, vars: number): RenderFlags;
/**
 * Marks the end of an embedded view.
 *
 * @publicApi
 */
export declare function ΔembeddedViewEnd(): void;
