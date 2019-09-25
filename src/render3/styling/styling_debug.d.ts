/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { StyleSanitizeFn } from '../../sanitization/style_sanitizer';
import { LStylingData, TStylingContext } from '../interfaces/styling';
/**
 * --------
 *
 * This file contains the core debug functionality for styling in Angular.
 *
 * To learn more about the algorithm see `TStylingContext`.
 *
 * --------
 */
/**
 * A debug/testing-oriented summary of a styling entry.
 *
 * A value such as this is generated as an artifact of the `DebugStyling`
 * summary.
 */
export interface LStylingSummary {
    /** The style/class property that the summary is attached to */
    prop: string;
    /** The last applied value for the style/class property */
    value: string | boolean | null;
    /** The binding index of the last applied style/class property */
    bindingIndex: number | null;
}
/**
 * A debug/testing-oriented summary of all styling entries for a `DebugNode` instance.
 */
export interface DebugStyling {
    /** The associated TStylingContext instance */
    context: TStylingContext;
    /** Which configuration flags are active (see `TStylingContextConfig`) */
    config: {
        hasMapBindings: boolean;
        hasPropBindings: boolean;
        hasCollisions: boolean;
        hasTemplateBindings: boolean;
        hasHostBindings: boolean;
        templateBindingsLocked: boolean;
        hostBindingsLocked: boolean;
        allowDirectStyling: boolean;
    };
    /**
     * A summarization of each style/class property
     * present in the context
     */
    summary: {
        [propertyName: string]: LStylingSummary;
    };
    /**
     * A key/value map of all styling properties and their
     * runtime values
     */
    values: {
        [propertyName: string]: string | number | null | boolean;
    };
    /**
     * Overrides the sanitizer used to process styles
     */
    overrideSanitizer(sanitizer: StyleSanitizeFn | null): void;
}
/**
 * A debug/testing-oriented summary of all styling entries within a `TStylingContext`.
 */
export interface TStylingTupleSummary {
    /** The property (style or class property) that this tuple represents */
    prop: string;
    /** The total amount of styling entries a part of this tuple */
    valuesCount: number;
    /**
     * The bit guard mask that is used to compare and protect against
     * styling changes when any template style/class bindings update
     */
    templateBitMask: number;
    /**
     * The bit guard mask that is used to compare and protect against
     * styling changes when any host style/class bindings update
     */
    hostBindingsBitMask: number;
    /**
     * Whether or not the entry requires sanitization
     */
    sanitizationRequired: boolean;
    /**
     * The default value that will be applied if any bindings are falsy
     */
    defaultValue: string | boolean | null;
    /**
     * All bindingIndex sources that have been registered for this style
     */
    sources: (number | null | string)[];
}
/**
 * Instantiates and attaches an instance of `TStylingContextDebug` to the provided context
 */
export declare function attachStylingDebugObject(context: TStylingContext): TStylingContextDebug;
/**
 * A human-readable debug summary of the styling data present within `TStylingContext`.
 *
 * This class is designed to be used within testing code or when an
 * application has `ngDevMode` activated.
 */
declare class TStylingContextDebug {
    readonly context: TStylingContext;
    constructor(context: TStylingContext);
    readonly isTemplateLocked: boolean;
    readonly isHostBindingsLocked: boolean;
    /**
     * Returns a detailed summary of each styling entry in the context.
     *
     * See `TStylingTupleSummary`.
     */
    readonly entries: {
        [prop: string]: TStylingTupleSummary;
    };
}
/**
 * A human-readable debug summary of the styling data present for a `DebugNode` instance.
 *
 * This class is designed to be used within testing code or when an
 * application has `ngDevMode` activated.
 */
export declare class NodeStylingDebug implements DebugStyling {
    context: TStylingContext;
    private _data;
    private _isClassBased?;
    private _sanitizer;
    constructor(context: TStylingContext, _data: LStylingData, _isClassBased?: boolean | undefined);
    /**
     * Overrides the sanitizer used to process styles.
     */
    overrideSanitizer(sanitizer: StyleSanitizeFn | null): void;
    /**
     * Returns a detailed summary of each styling entry in the context and
     * what their runtime representation is.
     *
     * See `LStylingSummary`.
     */
    readonly summary: {
        [key: string]: LStylingSummary;
    };
    readonly config: {
        hasMapBindings: boolean;
        hasPropBindings: boolean;
        hasCollisions: boolean;
        hasTemplateBindings: boolean;
        hasHostBindings: boolean;
        templateBindingsLocked: boolean;
        hostBindingsLocked: boolean;
        allowDirectStyling: boolean;
    };
    /**
     * Returns a key/value map of all the styles/classes that were last applied to the element.
     */
    readonly values: {
        [key: string]: any;
    };
    private _mapValues;
}
export {};
