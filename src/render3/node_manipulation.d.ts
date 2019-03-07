/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { LContainer } from './interfaces/container';
import { TNode, TProjectionNode, TViewNode } from './interfaces/node';
import { RComment, RElement, RNode, RText, Renderer3 } from './interfaces/renderer';
import { LView } from './interfaces/view';
export declare function getLContainer(tNode: TViewNode, embeddedView: LView): LContainer | null;
export declare function createTextNode(value: any, renderer: Renderer3): RText;
/**
 * Adds or removes all DOM elements associated with a view.
 *
 * Because some root nodes of the view may be containers, we sometimes need
 * to propagate deeply into the nested containers to remove all elements in the
 * views beneath it.
 *
 * @param viewToWalk The view from which elements should be added or removed
 * @param insertMode Whether or not elements should be added (if false, removing)
 * @param beforeNode The node before which elements should be added, if insert mode
 */
export declare function addRemoveViewFromContainer(viewToWalk: LView, insertMode: true, beforeNode: RNode | null): void;
export declare function addRemoveViewFromContainer(viewToWalk: LView, insertMode: false): void;
/**
 * Detach a `LView` from the DOM by detaching its nodes.
 *
 * @param lView the `LView` to be detached.
 */
export declare function renderDetachView(lView: LView): void;
/**
 * Traverses down and up the tree of views and containers to remove listeners and
 * call onDestroy callbacks.
 *
 * Notes:
 *  - Because it's used for onDestroy calls, it needs to be bottom-up.
 *  - Must process containers instead of their views to avoid splicing
 *  when views are destroyed and re-added.
 *  - Using a while loop because it's faster than recursion
 *  - Destroy only called on movement to sibling or movement to parent (laterally or up)
 *
 *  @param rootView The view to destroy
 */
export declare function destroyViewTree(rootView: LView): void;
/**
 * Inserts a view into a container.
 *
 * This adds the view to the container's array of active views in the correct
 * position. It also adds the view's elements to the DOM if the container isn't a
 * root node of another view (in that case, the view's elements will be added when
 * the container's parent view is added later).
 *
 * @param lView The view to insert
 * @param lContainer The container into which the view should be inserted
 * @param index Which index in the container to insert the child view into
 */
export declare function insertView(lView: LView, lContainer: LContainer, index: number): void;
/**
 * Detaches a view from a container.
 *
 * This method splices the view from the container's array of active views. It also
 * removes the view's elements from the DOM.
 *
 * @param lContainer The container from which to detach a view
 * @param removeIndex The index of the view to detach
 * @returns Detached LView instance.
 */
export declare function detachView(lContainer: LContainer, removeIndex: number): LView;
/**
 * Removes a view from a container, i.e. detaches it and then destroys the underlying LView.
 *
 * @param lContainer The container from which to remove a view
 * @param removeIndex The index of the view to remove
 */
export declare function removeView(lContainer: LContainer, removeIndex: number): void;
/**
 * A standalone function which destroys an LView,
 * conducting cleanup (e.g. removing listeners, calling onDestroys).
 *
 * @param view The view to be destroyed.
 */
export declare function destroyLView(view: LView): void;
/**
 * Determines which LViewOrLContainer to jump to when traversing back up the
 * tree in destroyViewTree.
 *
 * Normally, the view's parent LView should be checked, but in the case of
 * embedded views, the container (which is the view node's parent, but not the
 * LView's parent) needs to be checked for a possible next property.
 *
 * @param lViewOrLContainer The LViewOrLContainer for which we need a parent state
 * @param rootView The rootView, so we don't propagate too far up the view tree
 * @returns The correct parent LViewOrLContainer
 */
export declare function getParentState(lViewOrLContainer: LView | LContainer, rootView: LView): LView | LContainer | null;
/**
 * Inserts a native node before another native node for a given parent using {@link Renderer3}.
 * This is a utility function that can be used when native nodes were determined - it abstracts an
 * actual renderer being used.
 */
export declare function nativeInsertBefore(renderer: Renderer3, parent: RElement, child: RNode, beforeNode: RNode | null): void;
/**
 * Returns a native parent of a given native node.
 */
export declare function nativeParentNode(renderer: Renderer3, node: RNode): RElement | null;
/**
 * Returns a native sibling of a given native node.
 */
export declare function nativeNextSibling(renderer: Renderer3, node: RNode): RNode | null;
/**
 * Appends the `child` native node (or a collection of nodes) to the `parent`.
 *
 * The element insertion might be delayed {@link canInsertNativeNode}.
 *
 * @param childEl The native child (or children) that should be appended
 * @param childTNode The TNode of the child element
 * @param currentView The current LView
 * @returns Whether or not the child was appended
 */
export declare function appendChild(childEl: RNode | RNode[], childTNode: TNode, currentView: LView): void;
export declare function getBeforeNodeForView(index: number, views: LView[], containerNative: RComment): RNode;
/**
 * Removes a native node itself using a given renderer. To remove the node we are looking up its
 * parent from the native tree as not all platforms / browsers support the equivalent of
 * node.remove().
 *
 * @param renderer A renderer to be used
 * @param rNode The native node that should be removed
 * @param isHostElement A flag indicating if a node to be removed is a host of a component.
 */
export declare function nativeRemoveNode(renderer: Renderer3, rNode: RNode, isHostElement?: boolean): void;
/**
 * Appends nodes to a target projection place. Nodes to insert were previously re-distribution and
 * stored on a component host level.
 * @param lView A LView where nodes are inserted (target VLview)
 * @param tProjectionNode A projection node where previously re-distribution should be appended
 * (target insertion place)
 * @param selectorIndex A bucket from where nodes to project should be taken
 * @param componentView A where projectable nodes were initially created (source view)
 */
export declare function appendProjectedNodes(lView: LView, tProjectionNode: TProjectionNode, selectorIndex: number, componentView: LView): void;
