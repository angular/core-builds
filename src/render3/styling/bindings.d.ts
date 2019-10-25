/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { SafeValue } from '../../sanitization/bypass';
import { StyleSanitizeFn } from '../../sanitization/style_sanitizer';
import { ProceduralRenderer3, RElement, Renderer3 } from '../interfaces/renderer';
import { ApplyStylingFn, LStylingData, StylingMapArray, SyncStylingMapsFn, TStylingContext } from '../interfaces/styling';
import { NO_CHANGE } from '../tokens';
/**
 * Visits a class-based binding and updates the new value (if changed).
 *
 * This function is called each time a class-based styling instruction
 * is executed. It's important that it's always called (even if the value
 * has not changed) so that the inner counter index value is incremented.
 * This way, each instruction is always guaranteed to get the same counter
 * state each time it's called (which then allows the `TStylingContext`
 * and the bit mask values to be in sync).
 */
export declare function updateClassViaContext(context: TStylingContext, data: LStylingData, element: RElement, directiveIndex: number, prop: string | null, bindingIndex: number, value: boolean | string | null | undefined | StylingMapArray | NO_CHANGE, forceUpdate?: boolean): boolean;
/**
 * Visits a style-based binding and updates the new value (if changed).
 *
 * This function is called each time a style-based styling instruction
 * is executed. It's important that it's always called (even if the value
 * has not changed) so that the inner counter index value is incremented.
 * This way, each instruction is always guaranteed to get the same counter
 * state each time it's called (which then allows the `TStylingContext`
 * and the bit mask values to be in sync).
 */
export declare function updateStyleViaContext(context: TStylingContext, data: LStylingData, element: RElement, directiveIndex: number, prop: string | null, bindingIndex: number, value: string | number | SafeValue | null | undefined | StylingMapArray | NO_CHANGE, sanitizer: StyleSanitizeFn | null, forceUpdate?: boolean): boolean;
/**
 * Registers the provided binding (prop + bindingIndex) into the context.
 *
 * It is needed because it will either update or insert a styling property
 * into the context at the correct spot.
 *
 * When called, one of two things will happen:
 *
 * 1) If the property already exists in the context then it will just add
 *    the provided `bindingValue` to the end of the binding sources region
 *    for that particular property.
 *
 *    - If the binding value is a number then it will be added as a new
 *      binding index source next to the other binding sources for the property.
 *
 *    - Otherwise, if the binding value is a string/boolean/null type then it will
 *      replace the default value for the property if the default value is `null`.
 *
 * 2) If the property does not exist then it will be inserted into the context.
 *    The styling context relies on all properties being stored in alphabetical
 *    order, so it knows exactly where to store it.
 *
 *    When inserted, a default `null` value is created for the property which exists
 *    as the default value for the binding. If the bindingValue property is inserted
 *    and it is either a string, number or null value then that will replace the default
 *    value.
 *
 * Note that this function is also used for map-based styling bindings. They are treated
 * much the same as prop-based bindings, but, their property name value is set as `[MAP]`.
 */
export declare function registerBinding(context: TStylingContext, countId: number, sourceIndex: number, prop: string | null, bindingValue: number | null | string | boolean, sanitizationRequired?: boolean): void;
/**
 * Applies all pending style and class bindings to the provided element.
 *
 * This function will attempt to flush styling via the provided `classesContext`
 * and `stylesContext` context values. This function is designed to be run from
 * the internal `stylingApply` function (which is scheduled to run at the very
 * end of change detection for an element if one or more style/class bindings
 * were processed) and will rely on any state values that are set from when
 * any of the styling bindings executed.
 *
 * This function is designed to be called twice: one when change detection has
 * processed an element within the template bindings (i.e. just as `advance()`
 * is called) and when host bindings have been processed. In both cases the
 * styles and classes in both contexts will be applied to the element, but the
 * algorithm will selectively decide which bindings to run depending on the
 * columns in the context. The provided `directiveIndex` value will help the
 * algorithm determine which bindings to apply: either the template bindings or
 * the host bindings (see `applyStylingToElement` for more information).
 *
 * Note that once this function is called all temporary styling state data
 * (i.e. the `bitMask` and `counter` values for styles and classes will be cleared).
 */
export declare function flushStyling(renderer: Renderer3 | ProceduralRenderer3 | null, data: LStylingData, classesContext: TStylingContext | null, stylesContext: TStylingContext | null, element: RElement, directiveIndex: number, styleSanitizer: StyleSanitizeFn | null): void;
/**
 * Runs through the provided styling context and applies each value to
 * the provided element (via the renderer) if one or more values are present.
 *
 * This function will iterate over all entries present in the provided
 * `TStylingContext` array (both prop-based and map-based bindings).-
 *
 * Each entry, within the `TStylingContext` array, is stored alphabetically
 * and this means that each prop/value entry will be applied in order
 * (so long as it is marked dirty in the provided `bitMask` value).
 *
 * If there are any map-based entries present (which are applied to the
 * element via the `[style]` and `[class]` bindings) then those entries
 * will be applied as well. However, the code for that is not a part of
 * this function. Instead, each time a property is visited, then the
 * code below will call an external function called `stylingMapsSyncFn`
 * and, if present, it will keep the application of styling values in
 * map-based bindings up to sync with the application of prop-based
 * bindings.
 *
 * Visit `styling/map_based_bindings.ts` to learn more about how the
 * algorithm works for map-based styling bindings.
 *
 * Note that this function is not designed to be called in isolation (use
 * the `flushStyling` function so that it can call this function for both
 * the styles and classes contexts).
 */
export declare function applyStylingViaContext(context: TStylingContext, renderer: Renderer3 | ProceduralRenderer3 | null, element: RElement, bindingData: LStylingData, bitMaskValue: number | boolean, applyStylingFn: ApplyStylingFn, sanitizer: StyleSanitizeFn | null, hostBindingsMode: boolean): void;
/**
 * Applies the provided styling map to the element directly (without context resolution).
 *
 * This function is designed to be run from the styling instructions and will be called
 * automatically. This function is intended to be used for performance reasons in the
 * event that there is no need to apply styling via context resolution.
 *
 * This function has three different cases that can occur (for each item in the map):
 *
 * - Case 1: Attempt to apply the current value in the map to the element (if it's `non null`).
 *
 * - Case 2: If a map value fails to be applied then the algorithm will find a matching entry in
 *           the initial values present in the context and attempt to apply that.
 *
 * - Default Case: If the initial value cannot be applied then a default value of `null` will be
 *                 applied (which will remove the style/class value from the element).
 *
 * See `allowDirectStylingApply` to learn the logic used to determine whether any style/class
 * bindings can be directly applied.
 *
 * @returns whether or not the styling map was applied to the element.
 */
export declare function applyStylingMapDirectly(renderer: any, context: TStylingContext, element: RElement, data: LStylingData, bindingIndex: number, value: {
    [key: string]: any;
} | string | null, isClassBased: boolean, sanitizer?: StyleSanitizeFn | null, forceUpdate?: boolean, bindingValueContainsInitial?: boolean): void;
export declare function writeStylingValueDirectly(renderer: any, element: RElement, value: {
    [key: string]: any;
} | string | null, isClassBased: boolean, initialValue: string | null): string;
/**
 * Applies the provided styling prop/value to the element directly (without context resolution).
 *
 * This function is designed to be run from the styling instructions and will be called
 * automatically. This function is intended to be used for performance reasons in the
 * event that there is no need to apply styling via context resolution.
 *
 * This function has four different cases that can occur:
 *
 * - Case 1: Apply the provided prop/value (style or class) entry to the element
 *           (if it is `non null`).
 *
 * - Case 2: If value does not get applied (because its `null` or `undefined`) then the algorithm
 *           will check to see if a styling map value was applied to the element as well just
 *           before this (via `styleMap` or `classMap`). If and when a map is present then the
  *          algorithm will find the matching property in the map and apply its value.
  *
 * - Case 3: If a map value fails to be applied then the algorithm will check to see if there
 *           are any initial values present and attempt to apply a matching value based on
 *           the target prop.
 *
 * - Default Case: If a matching initial value cannot be applied then a default value
 *                 of `null` will be applied (which will remove the style/class value
 *                 from the element).
 *
 * See `allowDirectStylingApply` to learn the logic used to determine whether any style/class
 * bindings can be directly applied.
 *
 * @returns whether or not the prop/value styling was applied to the element.
 */
export declare function applyStylingValueDirectly(renderer: any, context: TStylingContext, element: RElement, data: LStylingData, bindingIndex: number, prop: string, value: any, isClassBased: boolean, sanitizer?: StyleSanitizeFn | null): boolean;
export declare function getStylingMapsSyncFn(): SyncStylingMapsFn | null;
export declare function setStylingMapsSyncFn(fn: SyncStylingMapsFn): void;
/**
 * Assigns a style value to a style property for the given element.
 */
export declare const setStyle: ApplyStylingFn;
/**
 * Adds/removes the provided className value to the provided element.
 */
export declare const setClass: ApplyStylingFn;
export declare const setClassName: (renderer: import("@angular/core/src/render3/interfaces/renderer").ObjectOrientedRenderer3 | ProceduralRenderer3 | null, native: RElement, className: string) => void;
export declare const setStyleAttr: (renderer: import("@angular/core/src/render3/interfaces/renderer").ObjectOrientedRenderer3 | ProceduralRenderer3 | null, native: RElement, value: string) => void;
/**
 * Iterates over all provided styling entries and renders them on the element.
 *
 * This function is used alongside a `StylingMapArray` entry. This entry is not
 * the same as the `TStylingContext` and is only really used when an element contains
 * initial styling values (e.g. `<div style="width:200px">`), but no style/class bindings
 * are present. If and when that happens then this function will be called to render all
 * initial styling values on an element.
 */
export declare function renderStylingMap(renderer: Renderer3, element: RElement, stylingValues: TStylingContext | StylingMapArray | null, isClassBased: boolean): void;
