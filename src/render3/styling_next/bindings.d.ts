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
import { ApplyStylingFn, LStylingData, StylingMapArray, SyncStylingMapsFn, TStylingContext } from './interfaces';
/**
 * --------
 *
 * This file contains the core logic for styling in Angular.
 *
 * All styling bindings (i.e. `[style]`, `[style.prop]`, `[class]` and `[class.name]`)
 * will have their values be applied through the logic in this file.
 *
 * When a binding is encountered (e.g. `<div [style.width]="w">`) then
 * the binding data will be populated into a `TStylingContext` data-structure.
 * There is only one `TStylingContext` per `TNode` and each element instance
 * will update its style/class binding values in concert with the styling
 * context.
 *
 * To learn more about the algorithm see `TStylingContext`.
 *
 * --------
 */
export declare const DEFAULT_GUARD_MASK_VALUE = 1;
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
export declare function updateClassBinding(context: TStylingContext, data: LStylingData, element: RElement, prop: string | null, bindingIndex: number, value: boolean | string | null | undefined | StylingMapArray, deferRegistration: boolean, forceUpdate: boolean): boolean;
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
export declare function updateStyleBinding(context: TStylingContext, data: LStylingData, element: RElement, prop: string | null, bindingIndex: number, value: string | number | SafeValue | null | undefined | StylingMapArray, sanitizer: StyleSanitizeFn | null, deferRegistration: boolean, forceUpdate: boolean): boolean;
/**
 * Registers the provided binding (prop + bindingIndex) into the context.
 *
 * This function is shared between bindings that are assigned immediately
 * (via `updateBindingData`) and at a deferred stage. When called, it will
 * figure out exactly where to place the binding data in the context.
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
 * much the same as prop-based bindings, but, because they do not have a property value
 * (since it's a map), all map-based entries are stored in an already populated area of
 * the context at the top (which is reserved for map-based entries).
 */
export declare function registerBinding(context: TStylingContext, countId: number, prop: string | null, bindingValue: number | null | string | boolean, sanitizationRequired?: boolean): boolean;
/**
 * Applies all pending style and class bindings to the provided element.
 *
 * This function will attempt to flush styling via the provided `classesContext`
 * and `stylesContext` context values. This function is designed to be run from
 * the `stylingApply()` instruction (which is run at the very end of styling
 * change detection) and will rely on any state values that are set from when
 * any styling bindings update.
 *
 * This function may be called multiple times on the same element because it can
 * be called from the template code as well as from host bindings. In order for
 * styling to be successfully flushed to the element (which will only happen once
 * despite this being called multiple times), the following criteria must be met:
 *
 * - `flushStyling` is called from the very last directive that has styling for
 *    the element (see `allowStylingFlush()`).
 * - one or more bindings for classes or styles has updated (this is checked by
 *   examining the classes or styles bit mask).
 *
 * If the style and class values are successfully applied to the element then
 * the temporary state values for the element will be cleared. Otherwise, if
 * this did not occur then the styling state is persisted (see `state.ts` for
 * more information on how this works).
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
 * Visit `styling_next/map_based_bindings.ts` to learn more about how the
 * algorithm works for map-based styling bindings.
 *
 * Note that this function is not designed to be called in isolation (use
 * `applyClasses` and `applyStyles` to actually apply styling values).
 */
export declare function applyStyling(context: TStylingContext, renderer: Renderer3 | ProceduralRenderer3 | null, element: RElement, bindingData: LStylingData, bitMaskValue: number | boolean, applyStylingFn: ApplyStylingFn, sanitizer: StyleSanitizeFn | null): void;
export declare function getStylingMapsSyncFn(): SyncStylingMapsFn | null;
export declare function setStylingMapsSyncFn(fn: SyncStylingMapsFn): void;
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
