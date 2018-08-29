/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RElement } from './interfaces/renderer';
import { LViewData } from './interfaces/view';
export declare const MONKEY_PATCH_KEY_NAME = "__ng_data__";
/** The internal element context which is specific to a given DOM node */
export interface ElementContext {
    /** The component\'s view data */
    lViewData: LViewData;
    /** The index of the element within the view data array */
    index: number;
    /** The instance of the DOM node */
    native: RElement;
}
/** Returns the matching `ElementContext` data for a given DOM node.
 *
 * This function will examine the provided DOM element's monkey-patched property to figure out the
 * associated index and view data (`LViewData`).
 *
 * If the monkey-patched value is the `LViewData` instance then the element context for that
 * element will be created and the monkey-patch reference will be updated. Therefore when this
 * function is called it may mutate the provided element\'s monkey-patch value.
 *
 * If the monkey-patch value is not detected then the code will walk up the DOM until an element
 * is found which contains a monkey-patch reference. When that occurs then the provided element
 * will be updated with a new context (which is then returned).
 */
export declare function getElementContext(element: RElement): ElementContext | null;
/** Assigns the given data to a DOM element using monkey-patching */
export declare function attachLViewDataToNode(node: any, data: LViewData | ElementContext): void;
