/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { LView, RootContext } from '../interfaces/view';
/**
 * Gets the parent LView of the passed LView, if the PARENT is an LContainer, will get the parent of
 * that LContainer, which is an LView
 * @param lView the lView whose parent to get
 */
export declare function getLViewParent(lView: LView): LView | null;
/**
 * Retrieve the root view from any component or `LView` by walking the parent `LView` until
 * reaching the root `LView`.
 *
 * @param componentOrLView any component or `LView`
 */
export declare function getRootView(componentOrLView: LView | {}): LView;
/**
 * Given an `LView`, find the closest declaration view which is not an embedded view.
 *
 * This method searches for the `LView` associated with the component which declared the `LView`.
 *
 * This function may return itself if the `LView` passed in is not an embedded `LView`. Otherwise
 * it walks the declaration parents until it finds a component view (non-embedded-view.)
 *
 * @param lView LView for which we want a host element node
 * @returns The host node
 */
export declare function findComponentView(lView: LView): LView;
/**
 * Returns the `RootContext` instance that is associated with
 * the application where the target is situated. It does this by walking the parent views until it
 * gets to the root view, then getting the context off of that.
 *
 * @param viewOrComponent the `LView` or component to get the root context for.
 */
export declare function getRootContext(viewOrComponent: LView | {}): RootContext;
