import { StylingBindingData, TStylingContext } from './interfaces';
/**
 * A debug/testing-oriented summary of a styling entry.
 *
 * A value such as this is generated as an artifact of the `DebugStyling`
 * summary.
 */
export interface StylingSummary {
    /** The style/class property that the summary is attached to */
    prop: string;
    /** The last applied value for the style/class property */
    value: string | null;
    /** The binding index of the last applied style/class property */
    bindingIndex: number | null;
    /** Every binding source that is writing the style/class property represented in this tuple */
    sourceValues: {
        value: string | number | null;
        bindingIndex: number | null;
    }[];
}
/**
 * A debug/testing-oriented summary of all styling entries for a `DebugNode` instance.
 */
export interface DebugStyling {
    /** The associated TStylingContext instance */
    context: TStylingContext;
    /**
     * A summarization of each style/class property
     * present in the context.
     */
    summary: {
        [key: string]: StylingSummary;
    } | null;
    /**
     * A key/value map of all styling properties and their
     * runtime values.
     */
    values: {
        [key: string]: string | number | null | boolean;
    };
}
/**
 * A debug/testing-oriented summary of all styling entries within a `TStylingContext`.
 */
export interface TStylingTupleSummary {
    /** The property (style or class property) that this tuple represents */
    prop: string;
    /** The total amount of styling entries apart of this tuple */
    valuesCount: number;
    /**
     * The bit guard mask that is used to compare and protect against
     * styling changes when and styling bindings update
     */
    guardMask: number;
    /**
     * The default value that will be applied if any bindings are falsy.
     */
    defaultValue: string | boolean | null;
    /**
     * All bindingIndex sources that have been registered for this style.
     */
    sources: (number | null | string)[];
}
/**
 * Instantiates and attaches an instance of `TStylingContextDebug` to the provided context.
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
    readonly isLocked: boolean;
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
    private _contextDebug;
    constructor(context: TStylingContext, _data: StylingBindingData);
    /**
     * Returns a detailed summary of each styling entry in the context and
     * what their runtime representation is.
     *
     * See `StylingSummary`.
     */
    readonly summary: {
        [key: string]: StylingSummary;
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
