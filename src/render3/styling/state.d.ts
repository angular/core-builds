/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { RElement } from '../interfaces/renderer';
import { StylingMapArray } from '../interfaces/styling';
/**
 * --------
 *
 * This file contains all state-based logic for styling in Angular.
 *
 * Styling in Angular is evaluated with a series of styling-specific
 * template instructions which are called one after another each time
 * change detection occurs in Angular.
 *
 * Styling makes use of various temporary, state-based variables between
 * instructions so that it can better cache and optimize its values.
 * These values are usually populated and cleared when an element is
 * exited in change detection (once all the instructions are run for
 * that element).
 *
 * To learn more about the algorithm see `TStylingContext`.
 *
 * --------
 */
/**
 * Used as a state reference for update values between style/class binding instructions.
 *
 * In addition to storing the element and bit-mask related values, the state also
 * stores the `sourceIndex` value. The `sourceIndex` value is an incremented value
 * that identifies what "source" (i.e. the template, a specific directive by index or
 * component) is currently applying its styling bindings to the element.
 */
export interface StylingState {
    /** The element that is currently being processed */
    element: RElement | null;
    /** The directive index that is currently active (`0` === template) */
    directiveIndex: number;
    /** The source (column) index that is currently active (`0` === template) */
    sourceIndex: number;
    /** The classes update bit mask value that is processed during each class binding */
    classesBitMask: number;
    /** The classes update bit index value that is processed during each class binding */
    classesIndex: number;
    /** The styles update bit mask value that is processed during each style binding */
    stylesBitMask: number;
    /** The styles update bit index value that is processed during each style binding */
    stylesIndex: number;
    /**
     * The last class map that was applied (i.e. `[class]="x"`).
     *
     * Note that this property is only populated when direct class values are applied
     * (i.e. context resolution is not used).
     *
     * See `allowDirectStyling` for more info.
    */
    lastDirectClassMap: StylingMapArray | null;
    /**
     * The last style map that was applied (i.e. `[style]="x"`)
     *
     * Note that this property is only populated when direct style values are applied
     * (i.e. context resolution is not used).
     *
     * See `allowDirectStyling` for more info.
    */
    lastDirectStyleMap: StylingMapArray | null;
}
/**
 * Returns (or instantiates) the styling state for the given element.
 *
 * Styling state is accessed and processed each time a style or class binding
 * is evaluated.
 *
 * If and when the provided `element` doesn't match the current element in the
 * state then this means that styling was recently cleared or the element has
 * changed in change detection. In both cases the styling state is fully reset.
 *
 * If and when the provided `directiveIndex` doesn't match the current directive
 * index in the state then this means that a new source has introduced itself into
 * the styling code (or, in other words, another directive or component has started
 * to apply its styling host bindings to the element).
 */
export declare function getStylingState(element: RElement, directiveIndex: number): StylingState;
/**
 * Clears the styling state so that it can be used by another element's styling code.
 */
export declare function resetStylingState(): void;
