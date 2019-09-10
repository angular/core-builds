/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { TNode } from '../interfaces/node';
import { NO_CHANGE } from '../tokens';
import { StylingMapArray, TStylingContext } from './interfaces';
/**
 * Creates a new instance of the `TStylingContext`.
 *
 * The `TStylingContext` is used as a manifest of all style or all class bindings on
 * an element. Because it is a T-level data-structure, it is only created once per
 * tNode for styles and for classes. This function allocates a new instance of a
 * `TStylingContext` with the initial values (see `interfaces.ts` for more info).
 */
export declare function allocTStylingContext(initialStyling?: StylingMapArray | null): TStylingContext;
/**
 * Sets the provided directive as the last directive index in the provided `TStylingContext`.
 *
 * Styling in Angular can be applied from the template as well as multiple sources of
 * host bindings. This means that each binding function (the template function or the
 * hostBindings functions) will generate styling instructions as well as a styling
 * apply function (i.e. `stylingApply()`). Because host bindings functions and the
 * template function are independent from one another this means that the styling apply
 * function will be called multiple times. By tracking the last directive index (which
 * is what happens in this function) the styling algorithm knows exactly when to flush
 * styling (which is when the last styling apply function is executed).
 */
export declare function updateLastDirectiveIndex(context: TStylingContext, lastDirectiveIndex: number): void;
export declare function setConfig(context: TStylingContext, value: number): void;
export declare function getProp(context: TStylingContext, index: number): string;
export declare function isSanitizationRequired(context: TStylingContext, index: number): boolean;
export declare function getGuardMask(context: TStylingContext, index: number): number;
export declare function setGuardMask(context: TStylingContext, index: number, maskValue: number): void;
export declare function getValuesCount(context: TStylingContext, index: number): number;
export declare function getBindingValue(context: TStylingContext, index: number, offset: number): string | number;
export declare function getDefaultValue(context: TStylingContext, index: number): string | boolean | null;
/**
 * Temporary function which determines whether or not a context is
 * allowed to be flushed based on the provided directive index.
 */
export declare function allowStylingFlush(context: TStylingContext | null, index: number): boolean;
export declare function lockContext(context: TStylingContext): void;
export declare function isContextLocked(context: TStylingContext): boolean;
export declare function stateIsPersisted(context: TStylingContext): boolean;
export declare function markContextToPersistState(context: TStylingContext): void;
export declare function getPropValuesStartPosition(context: TStylingContext): number;
export declare function isMapBased(prop: string): boolean;
export declare function hasValueChanged(a: NO_CHANGE | StylingMapArray | number | String | string | null | boolean | undefined | {}, b: NO_CHANGE | StylingMapArray | number | String | string | null | boolean | undefined | {}): boolean;
/**
 * Determines whether the provided styling value is truthy or falsy.
 */
export declare function isStylingValueDefined(value: any): boolean;
export declare function concatString(a: string, b: string, separator?: string): string;
export declare function hyphenate(value: string): string;
/**
 * Returns an instance of `StylingMapArray`.
 *
 * This function is designed to find an instance of `StylingMapArray` in case it is stored
 * inside of an instance of `TStylingContext`. When a styling context is created it
 * will copy over an initial styling values from the tNode (which are stored as a
 * `StylingMapArray` on the `tNode.classes` or `tNode.styles` values).
 */
export declare function getStylingMapArray(value: TStylingContext | StylingMapArray | null): StylingMapArray | null;
export declare function isStylingContext(value: TStylingContext | StylingMapArray | null): boolean;
export declare function getInitialStylingValue(context: TStylingContext | StylingMapArray | null): string;
export declare function hasClassInput(tNode: TNode): boolean;
export declare function hasStyleInput(tNode: TNode): boolean;
export declare function getMapProp(map: StylingMapArray, index: number): string;
export declare function setMapValue(map: StylingMapArray, index: number, value: string | boolean | null): void;
export declare function getMapValue(map: StylingMapArray, index: number): string | null;
export declare function forceClassesAsString(classes: string | {
    [key: string]: any;
} | null | undefined): string;
export declare function forceStylesAsString(styles: {
    [key: string]: any;
} | null | undefined): string;
