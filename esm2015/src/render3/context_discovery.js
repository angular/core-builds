/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../util/ng_dev_mode';
import { assertDomNode } from '../util/assert';
import { EMPTY_ARRAY } from './empty';
import { MONKEY_PATCH_KEY_NAME } from './interfaces/context';
import { CONTEXT, HEADER_OFFSET, HOST, TVIEW } from './interfaces/view';
import { getComponentLViewByIndex, getNativeByTNodeOrNull, readPatchedData, unwrapRNode } from './util/view_utils';
/**
 * Returns the matching `LContext` data for a given DOM node, directive or component instance.
 *
 * This function will examine the provided DOM element, component, or directive instance\'s
 * monkey-patched property to derive the `LContext` data. Once called then the monkey-patched
 * value will be that of the newly created `LContext`.
 *
 * If the monkey-patched value is the `LView` instance then the context value for that
 * target will be created and the monkey-patch reference will be updated. Therefore when this
 * function is called it may mutate the provided element\'s, component\'s or any of the associated
 * directive\'s monkey-patch values.
 *
 * If the monkey-patch value is not detected then the code will walk up the DOM until an element
 * is found which contains a monkey-patch reference. When that occurs then the provided element
 * will be updated with a new context (which is then returned). If the monkey-patch value is not
 * detected for a component/directive instance then it will throw an error (all components and
 * directives should be automatically monkey-patched by ivy).
 *
 * @param {?} target Component, Directive or DOM Node.
 * @return {?}
 */
export function getLContext(target) {
    /** @type {?} */
    let mpValue = readPatchedData(target);
    if (mpValue) {
        // only when it's an array is it considered an LView instance
        // ... otherwise it's an already constructed LContext instance
        if (Array.isArray(mpValue)) {
            /** @type {?} */
            const lView = (/** @type {?} */ (mpValue));
            /** @type {?} */
            let nodeIndex;
            /** @type {?} */
            let component = undefined;
            /** @type {?} */
            let directives = undefined;
            if (isComponentInstance(target)) {
                nodeIndex = findViaComponent(lView, target);
                if (nodeIndex == -1) {
                    throw new Error('The provided component was not found in the application');
                }
                component = target;
            }
            else if (isDirectiveInstance(target)) {
                nodeIndex = findViaDirective(lView, target);
                if (nodeIndex == -1) {
                    throw new Error('The provided directive was not found in the application');
                }
                directives = getDirectivesAtNodeIndex(nodeIndex, lView, false);
            }
            else {
                nodeIndex = findViaNativeElement(lView, (/** @type {?} */ (target)));
                if (nodeIndex == -1) {
                    return null;
                }
            }
            // the goal is not to fill the entire context full of data because the lookups
            // are expensive. Instead, only the target data (the element, component, container, ICU
            // expression or directive details) are filled into the context. If called multiple times
            // with different target values then the missing target data will be filled in.
            /** @type {?} */
            const native = unwrapRNode(lView[nodeIndex]);
            /** @type {?} */
            const existingCtx = readPatchedData(native);
            /** @type {?} */
            const context = (existingCtx && !Array.isArray(existingCtx)) ?
                existingCtx :
                createLContext(lView, nodeIndex, native);
            // only when the component has been discovered then update the monkey-patch
            if (component && context.component === undefined) {
                context.component = component;
                attachPatchData(context.component, context);
            }
            // only when the directives have been discovered then update the monkey-patch
            if (directives && context.directives === undefined) {
                context.directives = directives;
                for (let i = 0; i < directives.length; i++) {
                    attachPatchData(directives[i], context);
                }
            }
            attachPatchData(context.native, context);
            mpValue = context;
        }
    }
    else {
        /** @type {?} */
        const rElement = (/** @type {?} */ (target));
        ngDevMode && assertDomNode(rElement);
        // if the context is not found then we need to traverse upwards up the DOM
        // to find the nearest element that has already been monkey patched with data
        /** @type {?} */
        let parent = (/** @type {?} */ (rElement));
        while (parent = parent.parentNode) {
            /** @type {?} */
            const parentContext = readPatchedData(parent);
            if (parentContext) {
                /** @type {?} */
                let lView;
                if (Array.isArray(parentContext)) {
                    lView = (/** @type {?} */ (parentContext));
                }
                else {
                    lView = parentContext.lView;
                }
                // the edge of the app was also reached here through another means
                // (maybe because the DOM was changed manually).
                if (!lView) {
                    return null;
                }
                /** @type {?} */
                const index = findViaNativeElement(lView, rElement);
                if (index >= 0) {
                    /** @type {?} */
                    const native = unwrapRNode(lView[index]);
                    /** @type {?} */
                    const context = createLContext(lView, index, native);
                    attachPatchData(native, context);
                    mpValue = context;
                    break;
                }
            }
        }
    }
    return ((/** @type {?} */ (mpValue))) || null;
}
/**
 * Creates an empty instance of a `LContext` context
 * @param {?} lView
 * @param {?} nodeIndex
 * @param {?} native
 * @return {?}
 */
function createLContext(lView, nodeIndex, native) {
    return {
        lView,
        nodeIndex,
        native,
        component: undefined,
        directives: undefined,
        localRefs: undefined,
    };
}
/**
 * Takes a component instance and returns the view for that component.
 *
 * @param {?} componentInstance
 * @return {?} The component's view
 */
export function getComponentViewByInstance(componentInstance) {
    /** @type {?} */
    let lView = readPatchedData(componentInstance);
    /** @type {?} */
    let view;
    if (Array.isArray(lView)) {
        /** @type {?} */
        const nodeIndex = findViaComponent(lView, componentInstance);
        view = getComponentLViewByIndex(nodeIndex, lView);
        /** @type {?} */
        const context = createLContext(lView, nodeIndex, (/** @type {?} */ (view[HOST])));
        context.component = componentInstance;
        attachPatchData(componentInstance, context);
        attachPatchData(context.native, context);
    }
    else {
        /** @type {?} */
        const context = (/** @type {?} */ ((/** @type {?} */ (lView))));
        view = getComponentLViewByIndex(context.nodeIndex, context.lView);
    }
    return view;
}
/**
 * Assigns the given data to the given target (which could be a component,
 * directive or DOM node instance) using monkey-patching.
 * @param {?} target
 * @param {?} data
 * @return {?}
 */
export function attachPatchData(target, data) {
    target[MONKEY_PATCH_KEY_NAME] = data;
}
/**
 * @param {?} instance
 * @return {?}
 */
export function isComponentInstance(instance) {
    return instance && instance.constructor && instance.constructor.ɵcmp;
}
/**
 * @param {?} instance
 * @return {?}
 */
export function isDirectiveInstance(instance) {
    return instance && instance.constructor && instance.constructor.ɵdir;
}
/**
 * Locates the element within the given LView and returns the matching index
 * @param {?} lView
 * @param {?} target
 * @return {?}
 */
function findViaNativeElement(lView, target) {
    /** @type {?} */
    let tNode = lView[TVIEW].firstChild;
    while (tNode) {
        /** @type {?} */
        const native = (/** @type {?} */ (getNativeByTNodeOrNull(tNode, lView)));
        if (native === target) {
            return tNode.index;
        }
        tNode = traverseNextElement(tNode);
    }
    return -1;
}
/**
 * Locates the next tNode (child, sibling or parent).
 * @param {?} tNode
 * @return {?}
 */
function traverseNextElement(tNode) {
    if (tNode.child) {
        return tNode.child;
    }
    else if (tNode.next) {
        return tNode.next;
    }
    else {
        // Let's take the following template: <div><span>text</span></div><component/>
        // After checking the text node, we need to find the next parent that has a "next" TNode,
        // in this case the parent `div`, so that we can find the component.
        while (tNode.parent && !tNode.parent.next) {
            tNode = tNode.parent;
        }
        return tNode.parent && tNode.parent.next;
    }
}
/**
 * Locates the component within the given LView and returns the matching index
 * @param {?} lView
 * @param {?} componentInstance
 * @return {?}
 */
function findViaComponent(lView, componentInstance) {
    /** @type {?} */
    const componentIndices = lView[TVIEW].components;
    if (componentIndices) {
        for (let i = 0; i < componentIndices.length; i++) {
            /** @type {?} */
            const elementComponentIndex = componentIndices[i];
            /** @type {?} */
            const componentView = getComponentLViewByIndex(elementComponentIndex, lView);
            if (componentView[CONTEXT] === componentInstance) {
                return elementComponentIndex;
            }
        }
    }
    else {
        /** @type {?} */
        const rootComponentView = getComponentLViewByIndex(HEADER_OFFSET, lView);
        /** @type {?} */
        const rootComponent = rootComponentView[CONTEXT];
        if (rootComponent === componentInstance) {
            // we are dealing with the root element here therefore we know that the
            // element is the very first element after the HEADER data in the lView
            return HEADER_OFFSET;
        }
    }
    return -1;
}
/**
 * Locates the directive within the given LView and returns the matching index
 * @param {?} lView
 * @param {?} directiveInstance
 * @return {?}
 */
function findViaDirective(lView, directiveInstance) {
    // if a directive is monkey patched then it will (by default)
    // have a reference to the LView of the current view. The
    // element bound to the directive being search lives somewhere
    // in the view data. We loop through the nodes and check their
    // list of directives for the instance.
    /** @type {?} */
    let tNode = lView[TVIEW].firstChild;
    while (tNode) {
        /** @type {?} */
        const directiveIndexStart = tNode.directiveStart;
        /** @type {?} */
        const directiveIndexEnd = tNode.directiveEnd;
        for (let i = directiveIndexStart; i < directiveIndexEnd; i++) {
            if (lView[i] === directiveInstance) {
                return tNode.index;
            }
        }
        tNode = traverseNextElement(tNode);
    }
    return -1;
}
/**
 * Returns a list of directives extracted from the given view based on the
 * provided list of directive index values.
 *
 * @param {?} nodeIndex The node index
 * @param {?} lView The target view data
 * @param {?} includeComponents Whether or not to include components in returned directives
 * @return {?}
 */
export function getDirectivesAtNodeIndex(nodeIndex, lView, includeComponents) {
    /** @type {?} */
    const tNode = (/** @type {?} */ (lView[TVIEW].data[nodeIndex]));
    /** @type {?} */
    let directiveStartIndex = tNode.directiveStart;
    if (directiveStartIndex == 0)
        return EMPTY_ARRAY;
    /** @type {?} */
    const directiveEndIndex = tNode.directiveEnd;
    if (!includeComponents && tNode.flags & 2 /* isComponentHost */)
        directiveStartIndex++;
    return lView.slice(directiveStartIndex, directiveEndIndex);
}
/**
 * @param {?} nodeIndex
 * @param {?} lView
 * @return {?}
 */
export function getComponentAtNodeIndex(nodeIndex, lView) {
    /** @type {?} */
    const tNode = (/** @type {?} */ (lView[TVIEW].data[nodeIndex]));
    /** @type {?} */
    let directiveStartIndex = tNode.directiveStart;
    return tNode.flags & 2 /* isComponentHost */ ? lView[directiveStartIndex] : null;
}
/**
 * Returns a map of local references (local reference name => element or directive instance) that
 * exist on a given element.
 * @param {?} lView
 * @param {?} nodeIndex
 * @return {?}
 */
export function discoverLocalRefs(lView, nodeIndex) {
    /** @type {?} */
    const tNode = (/** @type {?} */ (lView[TVIEW].data[nodeIndex]));
    if (tNode && tNode.localNames) {
        /** @type {?} */
        const result = {};
        /** @type {?} */
        let localIndex = tNode.index + 1;
        for (let i = 0; i < tNode.localNames.length; i += 2) {
            result[tNode.localNames[i]] = lView[localIndex];
            localIndex++;
        }
        return result;
    }
    return null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9kaXNjb3ZlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2NvbnRleHRfZGlzY292ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxxQkFBcUIsQ0FBQztBQUU3QixPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFN0MsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNwQyxPQUFPLEVBQVcscUJBQXFCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUdyRSxPQUFPLEVBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQVMsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDN0UsT0FBTyxFQUFDLHdCQUF3QixFQUFFLHNCQUFzQixFQUFFLGVBQWUsRUFBRSxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXVCakgsTUFBTSxVQUFVLFdBQVcsQ0FBQyxNQUFXOztRQUNqQyxPQUFPLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQztJQUNyQyxJQUFJLE9BQU8sRUFBRTtRQUNYLDZEQUE2RDtRQUM3RCw4REFBOEQ7UUFDOUQsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFOztrQkFDcEIsS0FBSyxHQUFVLG1CQUFBLE9BQU8sRUFBRTs7Z0JBQzFCLFNBQWlCOztnQkFDakIsU0FBUyxHQUFRLFNBQVM7O2dCQUMxQixVQUFVLEdBQXlCLFNBQVM7WUFFaEQsSUFBSSxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDL0IsU0FBUyxHQUFHLGdCQUFnQixDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDNUMsSUFBSSxTQUFTLElBQUksQ0FBQyxDQUFDLEVBQUU7b0JBQ25CLE1BQU0sSUFBSSxL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OztRQUMvQyxtQkFBbUIsR0FBRyxLQUFLLENBQUMsY0FBYztJQUM5QyxPQUFPLEtBQUssQ0FBQyxLQUFLLDBCQUE2QixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQ3RGLENBQUM7Ozs7Ozs7O0FBTUQsTUFBTSxVQUFVLGlCQUFpQixDQUFDLEtBQVksRUFBRSxTQUFpQjs7VUFDekQsS0FBSyxHQUFHLG1CQUFBLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQVM7SUFDbkQsSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLFVBQVUsRUFBRTs7Y0FDdkIsTUFBTSxHQUF5QixFQUFFOztZQUNuQyxVQUFVLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDO1FBQ2hDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ25ELE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2hELFVBQVUsRUFBRSxDQUFDO1NBQ2Q7UUFDRCxPQUFPLE1BQU0sQ0FBQztLQUNmO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICcuLi91dGlsL25nX2Rldl9tb2RlJztcblxuaW1wb3J0IHthc3NlcnREb21Ob2RlfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7RU1QVFlfQVJSQVl9IGZyb20gJy4vZW1wdHknO1xuaW1wb3J0IHtMQ29udGV4dCwgTU9OS0VZX1BBVENIX0tFWV9OQU1FfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGV4dCc7XG5pbXBvcnQge1ROb2RlLCBUTm9kZUZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50LCBSTm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Q09OVEVYVCwgSEVBREVSX09GRlNFVCwgSE9TVCwgTFZpZXcsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldENvbXBvbmVudExWaWV3QnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZU9yTnVsbCwgcmVhZFBhdGNoZWREYXRhLCB1bndyYXBSTm9kZX0gZnJvbSAnLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5cblxuLyoqIFJldHVybnMgdGhlIG1hdGNoaW5nIGBMQ29udGV4dGAgZGF0YSBmb3IgYSBnaXZlbiBET00gbm9kZSwgZGlyZWN0aXZlIG9yIGNvbXBvbmVudCBpbnN0YW5jZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgZXhhbWluZSB0aGUgcHJvdmlkZWQgRE9NIGVsZW1lbnQsIGNvbXBvbmVudCwgb3IgZGlyZWN0aXZlIGluc3RhbmNlXFwnc1xuICogbW9ua2V5LXBhdGNoZWQgcHJvcGVydHkgdG8gZGVyaXZlIHRoZSBgTENvbnRleHRgIGRhdGEuIE9uY2UgY2FsbGVkIHRoZW4gdGhlIG1vbmtleS1wYXRjaGVkXG4gKiB2YWx1ZSB3aWxsIGJlIHRoYXQgb2YgdGhlIG5ld2x5IGNyZWF0ZWQgYExDb250ZXh0YC5cbiAqXG4gKiBJZiB0aGUgbW9ua2V5LXBhdGNoZWQgdmFsdWUgaXMgdGhlIGBMVmlld2AgaW5zdGFuY2UgdGhlbiB0aGUgY29udGV4dCB2YWx1ZSBmb3IgdGhhdFxuICogdGFyZ2V0IHdpbGwgYmUgY3JlYXRlZCBhbmQgdGhlIG1vbmtleS1wYXRjaCByZWZlcmVuY2Ugd2lsbCBiZSB1cGRhdGVkLiBUaGVyZWZvcmUgd2hlbiB0aGlzXG4gKiBmdW5jdGlvbiBpcyBjYWxsZWQgaXQgbWF5IG11dGF0ZSB0aGUgcHJvdmlkZWQgZWxlbWVudFxcJ3MsIGNvbXBvbmVudFxcJ3Mgb3IgYW55IG9mIHRoZSBhc3NvY2lhdGVkXG4gKiBkaXJlY3RpdmVcXCdzIG1vbmtleS1wYXRjaCB2YWx1ZXMuXG4gKlxuICogSWYgdGhlIG1vbmtleS1wYXRjaCB2YWx1ZSBpcyBub3QgZGV0ZWN0ZWQgdGhlbiB0aGUgY29kZSB3aWxsIHdhbGsgdXAgdGhlIERPTSB1bnRpbCBhbiBlbGVtZW50XG4gKiBpcyBmb3VuZCB3aGljaCBjb250YWlucyBhIG1vbmtleS1wYXRjaCByZWZlcmVuY2UuIFdoZW4gdGhhdCBvY2N1cnMgdGhlbiB0aGUgcHJvdmlkZWQgZWxlbWVudFxuICogd2lsbCBiZSB1cGRhdGVkIHdpdGggYSBuZXcgY29udGV4dCAod2hpY2ggaXMgdGhlbiByZXR1cm5lZCkuIElmIHRoZSBtb25rZXktcGF0Y2ggdmFsdWUgaXMgbm90XG4gKiBkZXRlY3RlZCBmb3IgYSBjb21wb25lbnQvZGlyZWN0aXZlIGluc3RhbmNlIHRoZW4gaXQgd2lsbCB0aHJvdyBhbiBlcnJvciAoYWxsIGNvbXBvbmVudHMgYW5kXG4gKiBkaXJlY3RpdmVzIHNob3VsZCBiZSBhdXRvbWF0aWNhbGx5IG1vbmtleS1wYXRjaGVkIGJ5IGl2eSkuXG4gKlxuICogQHBhcmFtIHRhcmdldCBDb21wb25lbnQsIERpcmVjdGl2ZSBvciBET00gTm9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExDb250ZXh0KHRhcmdldDogYW55KTogTENvbnRleHR8bnVsbCB7XG4gIGxldCBtcFZhbHVlID0gcmVhZFBhdGNoZWREYXRhKHRhcmdldCk7XG4gIGlmIChtcFZhbHVlKSB7XG4gICAgLy8gb25seSB3aGVuIGl0J3MgYW4gYXJyYXkgaXMgaXQgY29uc2lkZXJlZCBhbiBMVmlldyBpbnN0YW5jZVxuICAgIC8vIC4uLiBvdGhlcndpc2UgaXQncyBhbiBhbHJlYWR5IGNvbnN0cnVjdGVkIExDb250ZXh0IGluc3RhbmNlXG4gICAgaWYgKEFycmF5LmlzQXJyYXkobXBWYWx1ZSkpIHtcbiAgICAgIGNvbnN0IGxWaWV3OiBMVmlldyA9IG1wVmFsdWUgITtcbiAgICAgIGxldCBub2RlSW5kZXg6IG51bWJlcjtcbiAgICAgIGxldCBjb21wb25lbnQ6IGFueSA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCBkaXJlY3RpdmVzOiBhbnlbXXxudWxsfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAgICAgaWYgKGlzQ29tcG9uZW50SW5zdGFuY2UodGFyZ2V0KSkge1xuICAgICAgICBub2RlSW5kZXggPSBmaW5kVmlhQ29tcG9uZW50KGxWaWV3LCB0YXJnZXQpO1xuICAgICAgICBpZiAobm9kZUluZGV4ID09IC0xKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgcHJvdmlkZWQgY29tcG9uZW50IHdhcyBub3QgZm91bmQgaW4gdGhlIGFwcGxpY2F0aW9uJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29tcG9uZW50ID0gdGFyZ2V0O1xuICAgICAgfSBlbHNlIGlmIChpc0RpcmVjdGl2ZUluc3RhbmNlKHRhcmdldCkpIHtcbiAgICAgICAgbm9kZUluZGV4ID0gZmluZFZpYURpcmVjdGl2ZShsVmlldywgdGFyZ2V0KTtcbiAgICAgICAgaWYgKG5vZGVJbmRleCA9PSAtMSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHByb3ZpZGVkIGRpcmVjdGl2ZSB3YXMgbm90IGZvdW5kIGluIHRoZSBhcHBsaWNhdGlvbicpO1xuICAgICAgICB9XG4gICAgICAgIGRpcmVjdGl2ZXMgPSBnZXREaXJlY3RpdmVzQXROb2RlSW5kZXgobm9kZUluZGV4LCBsVmlldywgZmFsc2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbm9kZUluZGV4ID0gZmluZFZpYU5hdGl2ZUVsZW1lbnQobFZpZXcsIHRhcmdldCBhcyBSRWxlbWVudCk7XG4gICAgICAgIGlmIChub2RlSW5kZXggPT0gLTEpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyB0aGUgZ29hbCBpcyBub3QgdG8gZmlsbCB0aGUgZW50aXJlIGNvbnRleHQgZnVsbCBvZiBkYXRhIGJlY2F1c2UgdGhlIGxvb2t1cHNcbiAgICAgIC8vIGFyZSBleHBlbnNpdmUuIEluc3RlYWQsIG9ubHkgdGhlIHRhcmdldCBkYXRhICh0aGUgZWxlbWVudCwgY29tcG9uZW50LCBjb250YWluZXIsIElDVVxuICAgICAgLy8gZXhwcmVzc2lvbiBvciBkaXJlY3RpdmUgZGV0YWlscykgYXJlIGZpbGxlZCBpbnRvIHRoZSBjb250ZXh0LiBJZiBjYWxsZWQgbXVsdGlwbGUgdGltZXNcbiAgICAgIC8vIHdpdGggZGlmZmVyZW50IHRhcmdldCB2YWx1ZXMgdGhlbiB0aGUgbWlzc2luZyB0YXJnZXQgZGF0YSB3aWxsIGJlIGZpbGxlZCBpbi5cbiAgICAgIGNvbnN0IG5hdGl2ZSA9IHVud3JhcFJOb2RlKGxWaWV3W25vZGVJbmRleF0pO1xuICAgICAgY29uc3QgZXhpc3RpbmdDdHggPSByZWFkUGF0Y2hlZERhdGEobmF0aXZlKTtcbiAgICAgIGNvbnN0IGNvbnRleHQ6IExDb250ZXh0ID0gKGV4aXN0aW5nQ3R4ICYmICFBcnJheS5pc0FycmF5KGV4aXN0aW5nQ3R4KSkgP1xuICAgICAgICAgIGV4aXN0aW5nQ3R4IDpcbiAgICAgICAgICBjcmVhdGVMQ29udGV4dChsVmlldywgbm9kZUluZGV4LCBuYXRpdmUpO1xuXG4gICAgICAvLyBvbmx5IHdoZW4gdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBkaXNjb3ZlcmVkIHRoZW4gdXBkYXRlIHRoZSBtb25rZXktcGF0Y2hcbiAgICAgIGlmIChjb21wb25lbnQgJiYgY29udGV4dC5jb21wb25lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb250ZXh0LmNvbXBvbmVudCA9IGNvbXBvbmVudDtcbiAgICAgICAgYXR0YWNoUGF0Y2hEYXRhKGNvbnRleHQuY29tcG9uZW50LCBjb250ZXh0KTtcbiAgICAgIH1cblxuICAgICAgLy8gb25seSB3aGVuIHRoZSBkaXJlY3RpdmVzIGhhdmUgYmVlbiBkaXNjb3ZlcmVkIHRoZW4gdXBkYXRlIHRoZSBtb25rZXktcGF0Y2hcbiAgICAgIGlmIChkaXJlY3RpdmVzICYmIGNvbnRleHQuZGlyZWN0aXZlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRleHQuZGlyZWN0aXZlcyA9IGRpcmVjdGl2ZXM7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGF0dGFjaFBhdGNoRGF0YShkaXJlY3RpdmVzW2ldLCBjb250ZXh0KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBhdHRhY2hQYXRjaERhdGEoY29udGV4dC5uYXRpdmUsIGNvbnRleHQpO1xuICAgICAgbXBWYWx1ZSA9IGNvbnRleHQ7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHJFbGVtZW50ID0gdGFyZ2V0IGFzIFJFbGVtZW50O1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREb21Ob2RlKHJFbGVtZW50KTtcblxuICAgIC8vIGlmIHRoZSBjb250ZXh0IGlzIG5vdCBmb3VuZCB0aGVuIHdlIG5lZWQgdG8gdHJhdmVyc2UgdXB3YXJkcyB1cCB0aGUgRE9NXG4gICAgLy8gdG8gZmluZCB0aGUgbmVhcmVzdCBlbGVtZW50IHRoYXQgaGFzIGFscmVhZHkgYmVlbiBtb25rZXkgcGF0Y2hlZCB3aXRoIGRhdGFcbiAgICBsZXQgcGFyZW50ID0gckVsZW1lbnQgYXMgYW55O1xuICAgIHdoaWxlIChwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZSkge1xuICAgICAgY29uc3QgcGFyZW50Q29udGV4dCA9IHJlYWRQYXRjaGVkRGF0YShwYXJlbnQpO1xuICAgICAgaWYgKHBhcmVudENvbnRleHQpIHtcbiAgICAgICAgbGV0IGxWaWV3OiBMVmlld3xudWxsO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwYXJlbnRDb250ZXh0KSkge1xuICAgICAgICAgIGxWaWV3ID0gcGFyZW50Q29udGV4dCBhcyBMVmlldztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsVmlldyA9IHBhcmVudENvbnRleHQubFZpZXc7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0aGUgZWRnZSBvZiB0aGUgYXBwIHdhcyBhbHNvIHJlYWNoZWQgaGVyZSB0aHJvdWdoIGFub3RoZXIgbWVhbnNcbiAgICAgICAgLy8gKG1heWJlIGJlY2F1c2UgdGhlIERPTSB3YXMgY2hhbmdlZCBtYW51YWxseSkuXG4gICAgICAgIGlmICghbFZpZXcpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGluZGV4ID0gZmluZFZpYU5hdGl2ZUVsZW1lbnQobFZpZXcsIHJFbGVtZW50KTtcbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICBjb25zdCBuYXRpdmUgPSB1bndyYXBSTm9kZShsVmlld1tpbmRleF0pO1xuICAgICAgICAgIGNvbnN0IGNvbnRleHQgPSBjcmVhdGVMQ29udGV4dChsVmlldywgaW5kZXgsIG5hdGl2ZSk7XG4gICAgICAgICAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgY29udGV4dCk7XG4gICAgICAgICAgbXBWYWx1ZSA9IGNvbnRleHQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIChtcFZhbHVlIGFzIExDb250ZXh0KSB8fCBudWxsO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gZW1wdHkgaW5zdGFuY2Ugb2YgYSBgTENvbnRleHRgIGNvbnRleHRcbiAqL1xuZnVuY3Rpb24gY3JlYXRlTENvbnRleHQobFZpZXc6IExWaWV3LCBub2RlSW5kZXg6IG51bWJlciwgbmF0aXZlOiBSTm9kZSk6IExDb250ZXh0IHtcbiAgcmV0dXJuIHtcbiAgICBsVmlldyxcbiAgICBub2RlSW5kZXgsXG4gICAgbmF0aXZlLFxuICAgIGNvbXBvbmVudDogdW5kZWZpbmVkLFxuICAgIGRpcmVjdGl2ZXM6IHVuZGVmaW5lZCxcbiAgICBsb2NhbFJlZnM6IHVuZGVmaW5lZCxcbiAgfTtcbn1cblxuLyoqXG4gKiBUYWtlcyBhIGNvbXBvbmVudCBpbnN0YW5jZSBhbmQgcmV0dXJucyB0aGUgdmlldyBmb3IgdGhhdCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudEluc3RhbmNlXG4gKiBAcmV0dXJucyBUaGUgY29tcG9uZW50J3Mgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tcG9uZW50Vmlld0J5SW5zdGFuY2UoY29tcG9uZW50SW5zdGFuY2U6IHt9KTogTFZpZXcge1xuICBsZXQgbFZpZXcgPSByZWFkUGF0Y2hlZERhdGEoY29tcG9uZW50SW5zdGFuY2UpO1xuICBsZXQgdmlldzogTFZpZXc7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkobFZpZXcpKSB7XG4gICAgY29uc3Qgbm9kZUluZGV4ID0gZmluZFZpYUNvbXBvbmVudChsVmlldywgY29tcG9uZW50SW5zdGFuY2UpO1xuICAgIHZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgobm9kZUluZGV4LCBsVmlldyk7XG4gICAgY29uc3QgY29udGV4dCA9IGNyZWF0ZUxDb250ZXh0KGxWaWV3LCBub2RlSW5kZXgsIHZpZXdbSE9TVF0gYXMgUkVsZW1lbnQpO1xuICAgIGNvbnRleHQuY29tcG9uZW50ID0gY29tcG9uZW50SW5zdGFuY2U7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKGNvbXBvbmVudEluc3RhbmNlLCBjb250ZXh0KTtcbiAgICBhdHRhY2hQYXRjaERhdGEoY29udGV4dC5uYXRpdmUsIGNvbnRleHQpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGNvbnRleHQgPSBsVmlldyBhcyBhbnkgYXMgTENvbnRleHQ7XG4gICAgdmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleChjb250ZXh0Lm5vZGVJbmRleCwgY29udGV4dC5sVmlldyk7XG4gIH1cbiAgcmV0dXJuIHZpZXc7XG59XG5cbi8qKlxuICogQXNzaWducyB0aGUgZ2l2ZW4gZGF0YSB0byB0aGUgZ2l2ZW4gdGFyZ2V0ICh3aGljaCBjb3VsZCBiZSBhIGNvbXBvbmVudCxcbiAqIGRpcmVjdGl2ZSBvciBET00gbm9kZSBpbnN0YW5jZSkgdXNpbmcgbW9ua2V5LXBhdGNoaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoUGF0Y2hEYXRhKHRhcmdldDogYW55LCBkYXRhOiBMVmlldyB8IExDb250ZXh0KSB7XG4gIHRhcmdldFtNT05LRVlfUEFUQ0hfS0VZX05BTUVdID0gZGF0YTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29tcG9uZW50SW5zdGFuY2UoaW5zdGFuY2U6IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gaW5zdGFuY2UgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IuybVjbXA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0RpcmVjdGl2ZUluc3RhbmNlKGluc3RhbmNlOiBhbnkpOiBib29sZWFuIHtcbiAgcmV0dXJuIGluc3RhbmNlICYmIGluc3RhbmNlLmNvbnN0cnVjdG9yICYmIGluc3RhbmNlLmNvbnN0cnVjdG9yLsm1ZGlyO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGVsZW1lbnQgd2l0aGluIHRoZSBnaXZlbiBMVmlldyBhbmQgcmV0dXJucyB0aGUgbWF0Y2hpbmcgaW5kZXhcbiAqL1xuZnVuY3Rpb24gZmluZFZpYU5hdGl2ZUVsZW1lbnQobFZpZXc6IExWaWV3LCB0YXJnZXQ6IFJFbGVtZW50KTogbnVtYmVyIHtcbiAgbGV0IHROb2RlID0gbFZpZXdbVFZJRVddLmZpcnN0Q2hpbGQ7XG4gIHdoaWxlICh0Tm9kZSkge1xuICAgIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGVPck51bGwodE5vZGUsIGxWaWV3KSAhO1xuICAgIGlmIChuYXRpdmUgPT09IHRhcmdldCkge1xuICAgICAgcmV0dXJuIHROb2RlLmluZGV4O1xuICAgIH1cbiAgICB0Tm9kZSA9IHRyYXZlcnNlTmV4dEVsZW1lbnQodE5vZGUpO1xuICB9XG5cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIG5leHQgdE5vZGUgKGNoaWxkLCBzaWJsaW5nIG9yIHBhcmVudCkuXG4gKi9cbmZ1bmN0aW9uIHRyYXZlcnNlTmV4dEVsZW1lbnQodE5vZGU6IFROb2RlKTogVE5vZGV8bnVsbCB7XG4gIGlmICh0Tm9kZS5jaGlsZCkge1xuICAgIHJldHVybiB0Tm9kZS5jaGlsZDtcbiAgfSBlbHNlIGlmICh0Tm9kZS5uZXh0KSB7XG4gICAgcmV0dXJuIHROb2RlLm5leHQ7XG4gIH0gZWxzZSB7XG4gICAgLy8gTGV0J3MgdGFrZSB0aGUgZm9sbG93aW5nIHRlbXBsYXRlOiA8ZGl2PjxzcGFuPnRleHQ8L3NwYW4+PC9kaXY+PGNvbXBvbmVudC8+XG4gICAgLy8gQWZ0ZXIgY2hlY2tpbmcgdGhlIHRleHQgbm9kZSwgd2UgbmVlZCB0byBmaW5kIHRoZSBuZXh0IHBhcmVudCB0aGF0IGhhcyBhIFwibmV4dFwiIFROb2RlLFxuICAgIC8vIGluIHRoaXMgY2FzZSB0aGUgcGFyZW50IGBkaXZgLCBzbyB0aGF0IHdlIGNhbiBmaW5kIHRoZSBjb21wb25lbnQuXG4gICAgd2hpbGUgKHROb2RlLnBhcmVudCAmJiAhdE5vZGUucGFyZW50Lm5leHQpIHtcbiAgICAgIHROb2RlID0gdE5vZGUucGFyZW50O1xuICAgIH1cbiAgICByZXR1cm4gdE5vZGUucGFyZW50ICYmIHROb2RlLnBhcmVudC5uZXh0O1xuICB9XG59XG5cbi8qKlxuICogTG9jYXRlcyB0aGUgY29tcG9uZW50IHdpdGhpbiB0aGUgZ2l2ZW4gTFZpZXcgYW5kIHJldHVybnMgdGhlIG1hdGNoaW5nIGluZGV4XG4gKi9cbmZ1bmN0aW9uIGZpbmRWaWFDb21wb25lbnQobFZpZXc6IExWaWV3LCBjb21wb25lbnRJbnN0YW5jZToge30pOiBudW1iZXIge1xuICBjb25zdCBjb21wb25lbnRJbmRpY2VzID0gbFZpZXdbVFZJRVddLmNvbXBvbmVudHM7XG4gIGlmIChjb21wb25lbnRJbmRpY2VzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wb25lbnRJbmRpY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbGVtZW50Q29tcG9uZW50SW5kZXggPSBjb21wb25lbnRJbmRpY2VzW2ldO1xuICAgICAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleChlbGVtZW50Q29tcG9uZW50SW5kZXgsIGxWaWV3KTtcbiAgICAgIGlmIChjb21wb25lbnRWaWV3W0NPTlRFWFRdID09PSBjb21wb25lbnRJbnN0YW5jZSkge1xuICAgICAgICByZXR1cm4gZWxlbWVudENvbXBvbmVudEluZGV4O1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCByb290Q29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleChIRUFERVJfT0ZGU0VULCBsVmlldyk7XG4gICAgY29uc3Qgcm9vdENvbXBvbmVudCA9IHJvb3RDb21wb25lbnRWaWV3W0NPTlRFWFRdO1xuICAgIGlmIChyb290Q29tcG9uZW50ID09PSBjb21wb25lbnRJbnN0YW5jZSkge1xuICAgICAgLy8gd2UgYXJlIGRlYWxpbmcgd2l0aCB0aGUgcm9vdCBlbGVtZW50IGhlcmUgdGhlcmVmb3JlIHdlIGtub3cgdGhhdCB0aGVcbiAgICAgIC8vIGVsZW1lbnQgaXMgdGhlIHZlcnkgZmlyc3QgZWxlbWVudCBhZnRlciB0aGUgSEVBREVSIGRhdGEgaW4gdGhlIGxWaWV3XG4gICAgICByZXR1cm4gSEVBREVSX09GRlNFVDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGRpcmVjdGl2ZSB3aXRoaW4gdGhlIGdpdmVuIExWaWV3IGFuZCByZXR1cm5zIHRoZSBtYXRjaGluZyBpbmRleFxuICovXG5mdW5jdGlvbiBmaW5kVmlhRGlyZWN0aXZlKGxWaWV3OiBMVmlldywgZGlyZWN0aXZlSW5zdGFuY2U6IHt9KTogbnVtYmVyIHtcbiAgLy8gaWYgYSBkaXJlY3RpdmUgaXMgbW9ua2V5IHBhdGNoZWQgdGhlbiBpdCB3aWxsIChieSBkZWZhdWx0KVxuICAvLyBoYXZlIGEgcmVmZXJlbmNlIHRvIHRoZSBMVmlldyBvZiB0aGUgY3VycmVudCB2aWV3LiBUaGVcbiAgLy8gZWxlbWVudCBib3VuZCB0byB0aGUgZGlyZWN0aXZlIGJlaW5nIHNlYXJjaCBsaXZlcyBzb21ld2hlcmVcbiAgLy8gaW4gdGhlIHZpZXcgZGF0YS4gV2UgbG9vcCB0aHJvdWdoIHRoZSBub2RlcyBhbmQgY2hlY2sgdGhlaXJcbiAgLy8gbGlzdCBvZiBkaXJlY3RpdmVzIGZvciB0aGUgaW5zdGFuY2UuXG4gIGxldCB0Tm9kZSA9IGxWaWV3W1RWSUVXXS5maXJzdENoaWxkO1xuICB3aGlsZSAodE5vZGUpIHtcbiAgICBjb25zdCBkaXJlY3RpdmVJbmRleFN0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gICAgY29uc3QgZGlyZWN0aXZlSW5kZXhFbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gICAgZm9yIChsZXQgaSA9IGRpcmVjdGl2ZUluZGV4U3RhcnQ7IGkgPCBkaXJlY3RpdmVJbmRleEVuZDsgaSsrKSB7XG4gICAgICBpZiAobFZpZXdbaV0gPT09IGRpcmVjdGl2ZUluc3RhbmNlKSB7XG4gICAgICAgIHJldHVybiB0Tm9kZS5pbmRleDtcbiAgICAgIH1cbiAgICB9XG4gICAgdE5vZGUgPSB0cmF2ZXJzZU5leHRFbGVtZW50KHROb2RlKTtcbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIGxpc3Qgb2YgZGlyZWN0aXZlcyBleHRyYWN0ZWQgZnJvbSB0aGUgZ2l2ZW4gdmlldyBiYXNlZCBvbiB0aGVcbiAqIHByb3ZpZGVkIGxpc3Qgb2YgZGlyZWN0aXZlIGluZGV4IHZhbHVlcy5cbiAqXG4gKiBAcGFyYW0gbm9kZUluZGV4IFRoZSBub2RlIGluZGV4XG4gKiBAcGFyYW0gbFZpZXcgVGhlIHRhcmdldCB2aWV3IGRhdGFcbiAqIEBwYXJhbSBpbmNsdWRlQ29tcG9uZW50cyBXaGV0aGVyIG9yIG5vdCB0byBpbmNsdWRlIGNvbXBvbmVudHMgaW4gcmV0dXJuZWQgZGlyZWN0aXZlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGlyZWN0aXZlc0F0Tm9kZUluZGV4KFxuICAgIG5vZGVJbmRleDogbnVtYmVyLCBsVmlldzogTFZpZXcsIGluY2x1ZGVDb21wb25lbnRzOiBib29sZWFuKTogYW55W118bnVsbCB7XG4gIGNvbnN0IHROb2RlID0gbFZpZXdbVFZJRVddLmRhdGFbbm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgbGV0IGRpcmVjdGl2ZVN0YXJ0SW5kZXggPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgaWYgKGRpcmVjdGl2ZVN0YXJ0SW5kZXggPT0gMCkgcmV0dXJuIEVNUFRZX0FSUkFZO1xuICBjb25zdCBkaXJlY3RpdmVFbmRJbmRleCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgaWYgKCFpbmNsdWRlQ29tcG9uZW50cyAmJiB0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnRIb3N0KSBkaXJlY3RpdmVTdGFydEluZGV4Kys7XG4gIHJldHVybiBsVmlldy5zbGljZShkaXJlY3RpdmVTdGFydEluZGV4LCBkaXJlY3RpdmVFbmRJbmRleCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21wb25lbnRBdE5vZGVJbmRleChub2RlSW5kZXg6IG51bWJlciwgbFZpZXc6IExWaWV3KToge318bnVsbCB7XG4gIGNvbnN0IHROb2RlID0gbFZpZXdbVFZJRVddLmRhdGFbbm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgbGV0IGRpcmVjdGl2ZVN0YXJ0SW5kZXggPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgcmV0dXJuIHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudEhvc3QgPyBsVmlld1tkaXJlY3RpdmVTdGFydEluZGV4XSA6IG51bGw7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIG1hcCBvZiBsb2NhbCByZWZlcmVuY2VzIChsb2NhbCByZWZlcmVuY2UgbmFtZSA9PiBlbGVtZW50IG9yIGRpcmVjdGl2ZSBpbnN0YW5jZSkgdGhhdFxuICogZXhpc3Qgb24gYSBnaXZlbiBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlzY292ZXJMb2NhbFJlZnMobFZpZXc6IExWaWV3LCBub2RlSW5kZXg6IG51bWJlcik6IHtba2V5OiBzdHJpbmddOiBhbnl9fG51bGwge1xuICBjb25zdCB0Tm9kZSA9IGxWaWV3W1RWSUVXXS5kYXRhW25vZGVJbmRleF0gYXMgVE5vZGU7XG4gIGlmICh0Tm9kZSAmJiB0Tm9kZS5sb2NhbE5hbWVzKSB7XG4gICAgY29uc3QgcmVzdWx0OiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICAgIGxldCBsb2NhbEluZGV4ID0gdE5vZGUuaW5kZXggKyAxO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdE5vZGUubG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgcmVzdWx0W3ROb2RlLmxvY2FsTmFtZXNbaV1dID0gbFZpZXdbbG9jYWxJbmRleF07XG4gICAgICBsb2NhbEluZGV4Kys7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cbiJdfQ==