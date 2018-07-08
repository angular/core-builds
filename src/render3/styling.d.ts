/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InitialStylingFlags } from './interfaces/definition';
import { LElementNode } from './interfaces/node';
import { Renderer3 } from './interfaces/renderer';
/**
 * The styling context acts as a styling manifest (shaped as an array) for determining which
 * styling properties have been assigned via the provided `updateStyleMap` and `updateStyleProp`
 * functions. There are also two initialization functions `allocStylingContext` and
 * `createStylingContextTemplate` which are used to initialize and/or clone the context.
 *
 * The context is an array where the first two cells are used for static data (initial styling)
 * and dirty flags / index offsets). The remaining set of cells is used for multi (map) and single
 * (prop) style values.
 *
 * each value from here onwards is mapped as so:
 * [i] = mutation/type flag for the style value
 * [i + 1] = prop string (or null incase it has been removed)
 * [i + 2] = value string (or null incase it has been removed)
 *
 * There are three types of styling types stored in this context:
 *   initial: any styles that are passed in once the context is created
 *            (these are stored in the first cell of the array and the first
 *             value of this array is always `null` even if no initial styles exist.
 *             the `null` value is there so that any new styles have a parent to point
 *             to. This way we can always assume that there is a parent.)
 *
 *   single: any styles that are updated using `updateStyleProp` (fixed set)
 *
 *   multi: any styles that are updated using `updateStyleMap` (dynamic set)
 *
 * Note that context is only used to collect style information. Only when `renderStyles`
 * is called is when the styling payload will be rendered (or built as a key/value map).
 *
 * When the context is created, depending on what initial styles are passed in, the context itself
 * will be pre-filled with slots based on the initial style properties. Say for example we have a
 * series of initial styles that look like so:
 *
 *   style="width:100px; height:200px;"
 *
 * Then the initial state of the context (once initialized) will look like so:
 *
 * ```
 * context = [
 *   [null, '100px', '200px'],  // property names are not needed since they have already been
 * written to DOM.
 *
 *   configMasterVal,
 *
 *   // 2
 *   'width',
 *   pointers(1, 8);  // Point to static `width`: `100px` and multi `width`.
 *   null,
 *
 *   // 5
 *   'height',
 *   pointers(2, 11); // Point to static `height`: `200px` and multi `height`.
 *   null,
 *
 *   // 8
 *   'width',
 *   pointers(1, 2);  // Point to static `width`: `100px` and single `width`.
 *   null,
 *
 *   // 11
 *   'height',
 *   pointers(2, 5);  // Point to static `height`: `200px` and single `height`.
 *   null,
 * ]
 *
 * function pointers(staticIndex: number, dynamicIndex: number) {
 *   // combine the two indices into a single word.
 *   return (staticIndex << StylingFlags.BitCountSize) |
 *     (dynamicIndex << (StylingIndex.BitCountSize + StylingFlags.BitCountSize));
 * }
 * ```
 *
 * The values are duplicated so that space is set aside for both multi ([style])
 * and single ([style.prop]) values. The respective config values (configValA, configValB, etc...)
 * are a combination of the StylingFlags with two index values: the `initialIndex` (which points to
 * the index location of the style value in the initial styles array in slot 0) and the
 * `dynamicIndex` (which points to the matching single/multi index position in the context array
 * for the same prop).
 *
 * This means that every time `updateStyleProp` is called it must be called using an index value
 * (not a property string) which references the index value of the initial style when the context
 * was created. This also means that `updateStyleProp` cannot be called with a new property
 * (only `updateStyleMap` can include new CSS properties that will be added to the context).
 */
export interface StylingContext extends Array<InitialStyles | number | string | null> {
    /**
     * Location of initial data shared by all instances of this style.
     */
    [0]: InitialStyles;
    /**
     * A numeric value representing the configuration status (whether the context is dirty or not)
     * mixed together (using bit shifting) with a index value which tells the starting index value
     * of where the multi style entries begin.
     */
    [1]: number;
}
/**
 * The initial styles is populated whether or not there are any initial styles passed into
 * the context during allocation. The 0th value must be null so that index values of `0` within
 * the context flags can always point to a null value safely when nothing is set.
 *
 * All other entries in this array are of `string` value and correspond to the values that
 * were extracted from the `style=""` attribute in the HTML code for the provided template.
 */
export interface InitialStyles extends Array<string | null> {
    [0]: null;
}
/**
 * Used to set the context to be dirty or not both on the master flag (position 1)
 * or for each single/multi property that exists in the context.
 */
export declare const enum StylingFlags {
    None = 0,
    Dirty = 1,
    BitCountSize = 1
}
/** Used as numeric pointer values to determine what cells to update in the `StylingContext` */
export declare const enum StylingIndex {
    InitialStylesPosition = 0,
    MasterFlagPosition = 1,
    SingleStylesStartPosition = 2,
    FlagsOffset = 0,
    PropertyOffset = 1,
    ValueOffset = 2,
    Size = 3,
    BitCountSize = 15,
    BitMask = 32767
}
/**
 * Used clone a copy of a pre-computed template of a styling context.
 *
 * A pre-computed template is designed to be computed once for a given element
 * (instructions.ts has logic for caching this).
 */
export declare function allocStylingContext(templateStyleContext: StylingContext): StylingContext;
/**
 * Creates a styling context template where styling information is stored.
 * Any styles that are later referenced using `updateStyleProp` must be
 * passed in within this function. Initial values for those styles are to
 * be declared after all initial style properties are declared (this change in
 * mode between declarations and initial styles is made possible using a special
 * enum value found in `definition.ts`).
 *
 * @param initialStyleDeclarations a list of style declarations and initial style values
 *    that are used later within the styling context.
 *
 *    -> ['width', 'height', SPECIAL_ENUM_VAL, 'width', '100px']
 *       This implies that `width` and `height` will be later styled and that the `width`
 *       property has an initial value of `100px`.
 */
export declare function createStylingContextTemplate(initialStyleDeclarations?: (string | InitialStylingFlags)[] | null): StylingContext;
/**
 * Sets and resolves all `multi` styles on an `StylingContext` so that they can be
 * applied to the element once `renderStyles` is called.
 *
 * All missing styles (any values that are not provided in the new `styles` param)
 * will resolve to `null` within their respective positions in the context.
 *
 * @param context The styling context that will be updated with the
 *    newly provided style values.
 * @param styles The key/value map of CSS styles that will be used for the update.
 */
export declare function updateStyleMap(context: StylingContext, styles: {
    [key: string]: any;
} | null): void;
/**
 * Sets and resolves a single CSS style on a property on an `StylingContext` so that they
 * can be applied to the element once `renderElementStyles` is called.
 *
 * Note that prop-level styles are considered higher priority than styles that are applied
 * using `updateStyleMap`, therefore, when styles are rendered then any styles that
 * have been applied using this function will be considered first (then multi values second
 * and then initial values as a backup).
 *
 * @param context The styling context that will be updated with the
 *    newly provided style value.
 * @param index The index of the property which is being updated.
 * @param value The CSS style value that will be assigned
 */
export declare function updateStyleProp(context: StylingContext, index: number, value: string | null): void;
/**
 * Renders all queued styles using a renderer onto the given element.
 *
 * This function works by rendering any styles (that have been applied
 * using `updateStyleMap` and `updateStyleProp`) onto the
 * provided element using the provided renderer. Just before the styles
 * are rendered a final key/value style map will be assembled.
 *
 * @param lElement the element that the styles will be rendered on
 * @param context The styling context that will be used to determine
 *      what styles will be rendered
 * @param renderer the renderer that will be used to apply the styling
 * @param styleStore if provided, the updated style values will be applied
 *    to this key/value map instead of being renderered via the renderer.
 * @returns an object literal. `{ color: 'red', height: 'auto'}`.
 */
export declare function renderStyles(lElement: LElementNode, context: StylingContext, renderer: Renderer3, styleStore?: {
    [key: string]: any;
}): void;
export declare function isContextDirty(context: StylingContext): boolean;
export declare function setContextDirty(context: StylingContext, isDirtyYes: boolean): void;
