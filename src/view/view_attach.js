/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { dirtyParentQueries } from './query';
import { RenderNodeAction, declaredViewContainer, renderNode, visitRootRenderNodes } from './util';
/**
 * @param {?} elementData
 * @param {?} viewIndex
 * @param {?} view
 * @return {?}
 */
export function attachEmbeddedView(elementData, viewIndex, view) {
    let /** @type {?} */ embeddedViews = elementData.embeddedViews;
    if (viewIndex == null) {
        viewIndex = embeddedViews.length;
    }
    addToArray(embeddedViews, viewIndex, view);
    const /** @type {?} */ dvcElementData = declaredViewContainer(view);
    if (dvcElementData && dvcElementData !== elementData) {
        let /** @type {?} */ projectedViews = dvcElementData.projectedViews;
        if (!projectedViews) {
            projectedViews = dvcElementData.projectedViews = [];
        }
        projectedViews.push(view);
    }
    dirtyParentQueries(view);
    const /** @type {?} */ prevView = viewIndex > 0 ? embeddedViews[viewIndex - 1] : null;
    renderAttachEmbeddedView(elementData, prevView, view);
}
/**
 * @param {?} elementData
 * @param {?} viewIndex
 * @return {?}
 */
export function detachEmbeddedView(elementData, viewIndex) {
    const /** @type {?} */ embeddedViews = elementData.embeddedViews;
    if (viewIndex == null) {
        viewIndex = embeddedViews.length;
    }
    const /** @type {?} */ view = embeddedViews[viewIndex];
    removeFromArray(embeddedViews, viewIndex);
    const /** @type {?} */ dvcElementData = declaredViewContainer(view);
    if (dvcElementData && dvcElementData !== elementData) {
        const /** @type {?} */ projectedViews = dvcElementData.projectedViews;
        removeFromArray(projectedViews, projectedViews.indexOf(view));
    }
    dirtyParentQueries(view);
    renderDetachEmbeddedView(elementData, view);
    return view;
}
/**
 * @param {?} elementData
 * @param {?} oldViewIndex
 * @param {?} newViewIndex
 * @return {?}
 */
export function moveEmbeddedView(elementData, oldViewIndex, newViewIndex) {
    const /** @type {?} */ embeddedViews = elementData.embeddedViews;
    const /** @type {?} */ view = embeddedViews[oldViewIndex];
    removeFromArray(embeddedViews, oldViewIndex);
    if (newViewIndex == null) {
        newViewIndex = embeddedViews.length;
    }
    addToArray(embeddedViews, newViewIndex, view);
    // Note: Don't need to change projectedViews as the order in there
    // as always invalid...
    dirtyParentQueries(view);
    renderDetachEmbeddedView(elementData, view);
    const /** @type {?} */ prevView = newViewIndex > 0 ? embeddedViews[newViewIndex - 1] : null;
    renderAttachEmbeddedView(elementData, prevView, view);
    return view;
}
/**
 * @param {?} elementData
 * @param {?} prevView
 * @param {?} view
 * @return {?}
 */
function renderAttachEmbeddedView(elementData, prevView, view) {
    const /** @type {?} */ prevRenderNode = prevView ? renderNode(prevView, prevView.def.lastRootNode) : elementData.renderElement;
    const /** @type {?} */ parentNode = view.renderer.parentNode(prevRenderNode);
    const /** @type {?} */ nextSibling = view.renderer.nextSibling(prevRenderNode);
    // Note: We can't check if `nextSibling` is present, as on WebWorkers it will always be!
    // However, browsers automatically do `appendChild` when there is no `nextSibling`.
    visitRootRenderNodes(view, RenderNodeAction.InsertBefore, parentNode, nextSibling, undefined);
}
/**
 * @param {?} elementData
 * @param {?} view
 * @return {?}
 */
function renderDetachEmbeddedView(elementData, view) {
    const /** @type {?} */ parentNode = view.renderer.parentNode(elementData.renderElement);
    visitRootRenderNodes(view, RenderNodeAction.RemoveChild, parentNode, null, undefined);
}
/**
 * @param {?} arr
 * @param {?} index
 * @param {?} value
 * @return {?}
 */
function addToArray(arr, index, value) {
    // perf: array.push is faster than array.splice!
    if (index >= arr.length) {
        arr.push(value);
    }
    else {
        arr.splice(index, 0, value);
    }
}
/**
 * @param {?} arr
 * @param {?} index
 * @return {?}
 */
function removeFromArray(arr, index) {
    // perf: array.pop is faster than array.splice!
    if (index >= arr.length - 1) {
        arr.pop();
    }
    else {
        arr.splice(index, 1);
    }
}
//# sourceMappingURL=view_attach.js.map