import { StyleSanitizeFn } from '../../sanitization/style_sanitizer';
import { StylingContext } from '../interfaces/styling';
import { LView } from '../interfaces/view';
import { LStylingMap, TStylingContext } from './interfaces';
/**
 * Creates a new instance of the `TStylingContext`.
 *
 * This function will also pre-fill the context with data
 * for map-based bindings.
 */
export declare function allocTStylingContext(): TStylingContext;
/**
 * Temporary function that allows for a string-based property name to be
 * obtained from an index-based property identifier.
 *
 * This function will be removed once the new styling refactor code (which
 * lives inside of `render3/styling_next/`) replaces the existing styling
 * implementation.
 */
export declare function getBindingNameFromIndex(stylingContext: StylingContext, offset: number, directiveIndex: number, isClassBased: boolean): string;
export declare function updateContextDirectiveIndex(context: TStylingContext, index: number): void;
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
export declare function allowStylingFlush(context: TStylingContext, index: number): boolean;
export declare function lockContext(context: TStylingContext): void;
export declare function isContextLocked(context: TStylingContext): boolean;
export declare function getPropValuesStartPosition(context: TStylingContext): number;
export declare function isMapBased(prop: string): boolean;
export declare function hasValueChanged(a: LStylingMap | number | String | string | null | boolean | undefined | {}, b: LStylingMap | number | String | string | null | boolean | undefined | {}): boolean;
/**
 * Determines whether the provided styling value is truthy or falsy.
 */
export declare function isStylingValueDefined(value: any): boolean;
/**
 * Returns the current style sanitizer function for the given view.
 *
 * The default style sanitizer (which lives inside of `LView`) will
 * be returned depending on whether the `styleSanitizer` instruction
 * was called or not prior to any styling instructions running.
 */
export declare function getCurrentOrLViewSanitizer(lView: LView): StyleSanitizeFn | null;
