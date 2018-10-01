/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { StyleSanitizeFn } from '../../sanitization/style_sanitizer';
import { LContext } from '../context_discovery';
import { LElementNode } from '../interfaces/node';
import { PlayerContext } from '../interfaces/player';
import { InitialStyles, StylingContext } from '../interfaces/styling';
export declare const EMPTY_ARR: any[];
export declare const EMPTY_OBJ: {
    [key: string]: any;
};
export declare function createEmptyStylingContext(element?: LElementNode | null, sanitizer?: StyleSanitizeFn | null, initialStylingValues?: InitialStyles): StylingContext;
export declare function getOrCreatePlayerContext(target: {}, context?: LContext | null): PlayerContext;
