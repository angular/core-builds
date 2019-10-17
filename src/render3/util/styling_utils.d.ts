/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { PropertyAliases, TNode } from '../interfaces/node';
import { LStylingData, StylingMapArray, TStylingConfig, TStylingContext, TStylingContextIndex } from '../interfaces/styling';
import { NO_CHANGE } from '../tokens';
export declare const MAP_BASED_ENTRY_PROP_NAME = "[MAP]";
export declare const TEMPLATE_DIRECTIVE_INDEX = 0;
/**
 * Default fallback value for a styling binding.
 *
 * A value of `null` is used here which signals to the styling algorithm that
 * the styling value is not present. This way if there are no other values
 * detected then it will be removed once the style/class property is dirty and
 * diffed within the styling algorithm present in `flushStyling`.
 */
export declare const DEFAULT_BINDING_VALUE: null;
export declare const DEFAULT_BINDING_INDEX = 0;
export declare const DEFAULT_GUARD_MASK_VALUE = 1;
/**
 * Creates a new instance of the `TStylingContext`.
 *
 * The `TStylingContext` is used as a manifest of all style or all class bindings on
 * an element. Because it is a T-level data-structure, it is only created once per
 * tNode for styles and for classes. This function allocates a new instance of a
 * `TStylingContext` with the initial values (see `interfaces.ts` for more info).
 */
export declare function allocTStylingContext(initialStyling: StylingMapArray | null, hasDirectives: boolean): TStylingContext;
export declare function allocStylingMapArray(): StylingMapArray;
export declare function getConfig(context: TStylingContext): TStylingConfig;
export declare function hasConfig(context: TStylingContext, flag: TStylingConfig): boolean;
/**
 * Determines whether or not to apply styles/classes directly or via context resolution.
 *
 * There are three cases that are matched here:
 * 1. there are no directives present AND ngDevMode is falsy
 * 2. context is locked for template or host bindings (depending on `hostBindingsMode`)
 * 3. There are no collisions (i.e. properties with more than one binding) across multiple
 *    sources (i.e. template + directive, directive + directive, directive + component)
 */
export declare function allowDirectStyling(context: TStylingContext, hostBindingsMode: boolean): boolean;
export declare function setConfig(context: TStylingContext, value: TStylingConfig): void;
export declare function patchConfig(context: TStylingContext, flag: TStylingConfig): void;
export declare function getProp(context: TStylingContext, index: number): string;
export declare function isSanitizationRequired(context: TStylingContext, index: number): boolean;
export declare function getGuardMask(context: TStylingContext, index: number, isHostBinding: boolean): number;
export declare function setGuardMask(context: TStylingContext, index: number, maskValue: number, isHostBinding: boolean): void;
export declare function getValuesCount(context: TStylingContext): number;
export declare function getTotalSources(context: TStylingContext): number;
export declare function getBindingValue(context: TStylingContext, index: number, offset: number): string | number;
export declare function getDefaultValue(context: TStylingContext, index: number): string | boolean | null;
export declare function setDefaultValue(context: TStylingContext, index: number, value: string | boolean | null): string | boolean | null;
export declare function setValue(data: LStylingData, bindingIndex: number, value: any): void;
export declare function getValue<T = any>(data: LStylingData, bindingIndex: number): T | null;
export declare function lockContext(context: TStylingContext, hostBindingsMode: boolean): void;
export declare function isContextLocked(context: TStylingContext, hostBindingsMode: boolean): boolean;
export declare function getLockedConfig(hostBindingsMode: boolean): TStylingConfig;
export declare function getPropValuesStartPosition(context: TStylingContext): TStylingContextIndex;
export declare function hasValueChanged(a: NO_CHANGE | StylingMapArray | number | String | string | null | boolean | undefined | {}, b: NO_CHANGE | StylingMapArray | number | String | string | null | boolean | undefined | {}): boolean;
/**
 * Determines whether the provided styling value is truthy or falsy.
 */
export declare function isStylingValueDefined<T extends string | number | {} | null>(value: T): value is NonNullable<T>;
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
export declare function isStylingContext(value: any): boolean;
export declare function isStylingMapArray(value: TStylingContext | StylingMapArray | null): boolean;
export declare function getInitialStylingValue(context: TStylingContext | StylingMapArray | null): string;
export declare function hasClassInput(tNode: TNode): boolean;
export declare function hasStyleInput(tNode: TNode): boolean;
export declare function getMapProp(map: StylingMapArray, index: number): string;
export declare function setMapAsDirty(map: StylingMapArray): void;
export declare function setMapValue(map: StylingMapArray, index: number, value: string | boolean | null): void;
export declare function getMapValue(map: StylingMapArray, index: number): string | null;
export declare function forceClassesAsString(classes: string | {
    [key: string]: any;
} | null | undefined): string;
export declare function forceStylesAsString(styles: {
    [key: string]: any;
} | null | undefined): string;
export declare function isHostStylingActive(directiveOrSourceId: number): boolean;
/**
 * Converts the provided styling map array into a string.
 *
 * Classes => `one two three`
 * Styles => `prop:value; prop2:value2`
 */
export declare function stylingMapToString(map: StylingMapArray, isClassBased: boolean): string;
/**
 * Converts the provided styling map array into a key value map.
 */
export declare function stylingMapToStringMap(map: StylingMapArray | null): {
    [key: string]: any;
};
/**
 * Inserts the provided item into the provided styling array at the right spot.
 *
 * The `StylingMapArray` type is a sorted key/value array of entries. This means
 * that when a new entry is inserted it must be placed at the right spot in the
 * array. This function figures out exactly where to place it.
 */
export declare function addItemToStylingMap(stylingMapArr: StylingMapArray, prop: string, value: string | boolean | null, allowOverwrite?: boolean): boolean;
/**
 * Used to convert a {key:value} map into a `StylingMapArray` array.
 *
 * This function will either generate a new `StylingMapArray` instance
 * or it will patch the provided `newValues` map value into an
 * existing `StylingMapArray` value (this only happens if `bindingValue`
 * is an instance of `StylingMapArray`).
 *
 * If a new key/value map is provided with an old `StylingMapArray`
 * value then all properties will be overwritten with their new
 * values or with `null`. This means that the array will never
 * shrink in size (but it will also not be created and thrown
 * away whenever the `{key:value}` map entries change).
 */
export declare function normalizeIntoStylingMap(bindingValue: null | StylingMapArray, newValues: {
    [key: string]: any;
} | string | null | undefined, normalizeProps?: boolean): StylingMapArray;
export declare function selectClassBasedInputName(inputs: PropertyAliases): string;
