/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import './ng_dev_mode';
import { assertDomNode } from './assert';
import { EMPTY_ARRAY } from './definition';
import { MONKEY_PATCH_KEY_NAME } from './interfaces/context';
import { CONTEXT, HEADER_OFFSET, HOST, TVIEW } from './interfaces/view';
import { getComponentViewByIndex, getNativeByTNode, readElementValue, readPatchedData } from './util';
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
            const native = readElementValue(lView[nodeIndex]);
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
                    const native = readElementValue(lView[index]);
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
        view = getComponentViewByIndex(nodeIndex, lView);
        /** @type {?} */
        const context = createLContext(lView, nodeIndex, (/** @type {?} */ (view[HOST])));
        context.component = componentInstance;
        attachPatchData(componentInstance, context);
        attachPatchData(context.native, context);
    }
    else {
        /** @type {?} */
        const context = (/** @type {?} */ ((/** @type {?} */ (lView))));
        view = getComponentViewByIndex(context.nodeIndex, context.lView);
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
    return instance && instance.constructor && instance.constructor.ngComponentDef;
}
/**
 * @param {?} instance
 * @return {?}
 */
export function isDirectiveInstance(instance) {
    return instance && instance.constructor && instance.constructor.ngDirectiveDef;
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
        const native = (/** @type {?} */ (getNativeByTNode(tNode, lView)));
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
            const componentView = getComponentViewByIndex(elementComponentIndex, lView);
            if (componentView[CONTEXT] === componentInstance) {
                return elementComponentIndex;
            }
        }
    }
    else {
        /** @type {?} */
        const rootComponentView = getComponentViewByIndex(HEADER_OFFSET, lView);
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
    if (!includeComponents && tNode.flags & 1 /* isComponent */)
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
    return tNode.flags & 1 /* isComponent */ ? lView[directiveStartIndex] : null;
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
        for (let i = 0; i < tNode.localNames.length; i += 2) {
            /** @type {?} */
            const localRefName = tNode.localNames[i];
            /** @type {?} */
            const directiveIndex = (/** @type {?} */ (tNode.localNames[i + 1]));
            result[localRefName] =
                directiveIndex === -1 ? (/** @type {?} */ (getNativeByTNode(tNode, lView))) : lView[directiveIndex];
        }
        return result;
    }
    return null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9kaXNjb3ZlcnkuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2NvbnRleHRfZGlzY292ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQ3pDLE9BQU8sRUFBVyxxQkFBcUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBR3JFLE9BQU8sRUFBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBUyxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM3RSxPQUFPLEVBQUMsdUJBQXVCLEVBQUUsZ0JBQWdCLEVBQVksZ0JBQWdCLEVBQUUsZUFBZSxFQUFDLE1BQU0sUUFBUSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBc0I5RyxNQUFNLFVBQVUsV0FBVyxDQUFDLE1BQVc7O1FBQ2pDLE9BQU8sR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDO0lBQ3JDLElBQUksT0FBTyxFQUFFO1FBQ1gsNkRBQTZEO1FBQzdELDhEQUE4RDtRQUM5RCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7O2tCQUNwQixLQUFLLEdBQVUsbUJBQUEsT0FBTyxFQUFFOztnQkFDMUIsU0FBaUI7O2dCQUNqQixTQUFTLEdBQVEsU0FBUzs7Z0JBQzFCLFVBQVUsR0FBeUIsU0FBUztZQUVoRCxJQUFJLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUMvQixTQUFTLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUM1QyxJQUFJLFNBQVMsSUFBSSxDQUFDLENBQUMsRUFBRTtvQkFDbkIsTUFBTSxJQUFJLEtBQUssQ0FBQyx5REFBeUQsQ0FB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LEdBQUcsS0FBSyxDQUFDLGNBQWM7SUFDOUMsT0FBTyxLQUFLLENBQUMsS0FBSyxzQkFBeUIsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUNsRixDQUFDOzs7Ozs7OztBQU1ELE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxLQUFZLEVBQUUsU0FBaUI7O1VBQ3pELEtBQUssR0FBRyxtQkFBQSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFTO0lBQ25ELElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxVQUFVLEVBQUU7O2NBQ3ZCLE1BQU0sR0FBeUIsRUFBRTtRQUN2QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTs7a0JBQzdDLFlBQVksR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQzs7a0JBQ2xDLGNBQWMsR0FBRyxtQkFBQSxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBVTtZQUN4RCxNQUFNLENBQUMsWUFBWSxDQUFDO2dCQUNoQixjQUFjLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLG1CQUFBLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7U0FDdEY7UUFDRCxPQUFPLE1BQU0sQ0FBQztLQUNmO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICcuL25nX2Rldl9tb2RlJztcbmltcG9ydCB7YXNzZXJ0RG9tTm9kZX0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtFTVBUWV9BUlJBWX0gZnJvbSAnLi9kZWZpbml0aW9uJztcbmltcG9ydCB7TENvbnRleHQsIE1PTktFWV9QQVRDSF9LRVlfTkFNRX0gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRleHQnO1xuaW1wb3J0IHtUTm9kZSwgVE5vZGVGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Q09OVEVYVCwgSEVBREVSX09GRlNFVCwgSE9TVCwgTFZpZXcsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldENvbXBvbmVudFZpZXdCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlLCBnZXRUTm9kZSwgcmVhZEVsZW1lbnRWYWx1ZSwgcmVhZFBhdGNoZWREYXRhfSBmcm9tICcuL3V0aWwnO1xuXG5cbi8qKiBSZXR1cm5zIHRoZSBtYXRjaGluZyBgTENvbnRleHRgIGRhdGEgZm9yIGEgZ2l2ZW4gRE9NIG5vZGUsIGRpcmVjdGl2ZSBvciBjb21wb25lbnQgaW5zdGFuY2UuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGV4YW1pbmUgdGhlIHByb3ZpZGVkIERPTSBlbGVtZW50LCBjb21wb25lbnQsIG9yIGRpcmVjdGl2ZSBpbnN0YW5jZVxcJ3NcbiAqIG1vbmtleS1wYXRjaGVkIHByb3BlcnR5IHRvIGRlcml2ZSB0aGUgYExDb250ZXh0YCBkYXRhLiBPbmNlIGNhbGxlZCB0aGVuIHRoZSBtb25rZXktcGF0Y2hlZFxuICogdmFsdWUgd2lsbCBiZSB0aGF0IG9mIHRoZSBuZXdseSBjcmVhdGVkIGBMQ29udGV4dGAuXG4gKlxuICogSWYgdGhlIG1vbmtleS1wYXRjaGVkIHZhbHVlIGlzIHRoZSBgTFZpZXdgIGluc3RhbmNlIHRoZW4gdGhlIGNvbnRleHQgdmFsdWUgZm9yIHRoYXRcbiAqIHRhcmdldCB3aWxsIGJlIGNyZWF0ZWQgYW5kIHRoZSBtb25rZXktcGF0Y2ggcmVmZXJlbmNlIHdpbGwgYmUgdXBkYXRlZC4gVGhlcmVmb3JlIHdoZW4gdGhpc1xuICogZnVuY3Rpb24gaXMgY2FsbGVkIGl0IG1heSBtdXRhdGUgdGhlIHByb3ZpZGVkIGVsZW1lbnRcXCdzLCBjb21wb25lbnRcXCdzIG9yIGFueSBvZiB0aGUgYXNzb2NpYXRlZFxuICogZGlyZWN0aXZlXFwncyBtb25rZXktcGF0Y2ggdmFsdWVzLlxuICpcbiAqIElmIHRoZSBtb25rZXktcGF0Y2ggdmFsdWUgaXMgbm90IGRldGVjdGVkIHRoZW4gdGhlIGNvZGUgd2lsbCB3YWxrIHVwIHRoZSBET00gdW50aWwgYW4gZWxlbWVudFxuICogaXMgZm91bmQgd2hpY2ggY29udGFpbnMgYSBtb25rZXktcGF0Y2ggcmVmZXJlbmNlLiBXaGVuIHRoYXQgb2NjdXJzIHRoZW4gdGhlIHByb3ZpZGVkIGVsZW1lbnRcbiAqIHdpbGwgYmUgdXBkYXRlZCB3aXRoIGEgbmV3IGNvbnRleHQgKHdoaWNoIGlzIHRoZW4gcmV0dXJuZWQpLiBJZiB0aGUgbW9ua2V5LXBhdGNoIHZhbHVlIGlzIG5vdFxuICogZGV0ZWN0ZWQgZm9yIGEgY29tcG9uZW50L2RpcmVjdGl2ZSBpbnN0YW5jZSB0aGVuIGl0IHdpbGwgdGhyb3cgYW4gZXJyb3IgKGFsbCBjb21wb25lbnRzIGFuZFxuICogZGlyZWN0aXZlcyBzaG91bGQgYmUgYXV0b21hdGljYWxseSBtb25rZXktcGF0Y2hlZCBieSBpdnkpLlxuICpcbiAqIEBwYXJhbSB0YXJnZXQgQ29tcG9uZW50LCBEaXJlY3RpdmUgb3IgRE9NIE5vZGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMQ29udGV4dCh0YXJnZXQ6IGFueSk6IExDb250ZXh0fG51bGwge1xuICBsZXQgbXBWYWx1ZSA9IHJlYWRQYXRjaGVkRGF0YSh0YXJnZXQpO1xuICBpZiAobXBWYWx1ZSkge1xuICAgIC8vIG9ubHkgd2hlbiBpdCdzIGFuIGFycmF5IGlzIGl0IGNvbnNpZGVyZWQgYW4gTFZpZXcgaW5zdGFuY2VcbiAgICAvLyAuLi4gb3RoZXJ3aXNlIGl0J3MgYW4gYWxyZWFkeSBjb25zdHJ1Y3RlZCBMQ29udGV4dCBpbnN0YW5jZVxuICAgIGlmIChBcnJheS5pc0FycmF5KG1wVmFsdWUpKSB7XG4gICAgICBjb25zdCBsVmlldzogTFZpZXcgPSBtcFZhbHVlICE7XG4gICAgICBsZXQgbm9kZUluZGV4OiBudW1iZXI7XG4gICAgICBsZXQgY29tcG9uZW50OiBhbnkgPSB1bmRlZmluZWQ7XG4gICAgICBsZXQgZGlyZWN0aXZlczogYW55W118bnVsbHx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgICAgIGlmIChpc0NvbXBvbmVudEluc3RhbmNlKHRhcmdldCkpIHtcbiAgICAgICAgbm9kZUluZGV4ID0gZmluZFZpYUNvbXBvbmVudChsVmlldywgdGFyZ2V0KTtcbiAgICAgICAgaWYgKG5vZGVJbmRleCA9PSAtMSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHByb3ZpZGVkIGNvbXBvbmVudCB3YXMgbm90IGZvdW5kIGluIHRoZSBhcHBsaWNhdGlvbicpO1xuICAgICAgICB9XG4gICAgICAgIGNvbXBvbmVudCA9IHRhcmdldDtcbiAgICAgIH0gZWxzZSBpZiAoaXNEaXJlY3RpdmVJbnN0YW5jZSh0YXJnZXQpKSB7XG4gICAgICAgIG5vZGVJbmRleCA9IGZpbmRWaWFEaXJlY3RpdmUobFZpZXcsIHRhcmdldCk7XG4gICAgICAgIGlmIChub2RlSW5kZXggPT0gLTEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBwcm92aWRlZCBkaXJlY3RpdmUgd2FzIG5vdCBmb3VuZCBpbiB0aGUgYXBwbGljYXRpb24nKTtcbiAgICAgICAgfVxuICAgICAgICBkaXJlY3RpdmVzID0gZ2V0RGlyZWN0aXZlc0F0Tm9kZUluZGV4KG5vZGVJbmRleCwgbFZpZXcsIGZhbHNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGVJbmRleCA9IGZpbmRWaWFOYXRpdmVFbGVtZW50KGxWaWV3LCB0YXJnZXQgYXMgUkVsZW1lbnQpO1xuICAgICAgICBpZiAobm9kZUluZGV4ID09IC0xKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gdGhlIGdvYWwgaXMgbm90IHRvIGZpbGwgdGhlIGVudGlyZSBjb250ZXh0IGZ1bGwgb2YgZGF0YSBiZWNhdXNlIHRoZSBsb29rdXBzXG4gICAgICAvLyBhcmUgZXhwZW5zaXZlLiBJbnN0ZWFkLCBvbmx5IHRoZSB0YXJnZXQgZGF0YSAodGhlIGVsZW1lbnQsIGNvbXBvbmVudCwgY29udGFpbmVyLCBJQ1VcbiAgICAgIC8vIGV4cHJlc3Npb24gb3IgZGlyZWN0aXZlIGRldGFpbHMpIGFyZSBmaWxsZWQgaW50byB0aGUgY29udGV4dC4gSWYgY2FsbGVkIG11bHRpcGxlIHRpbWVzXG4gICAgICAvLyB3aXRoIGRpZmZlcmVudCB0YXJnZXQgdmFsdWVzIHRoZW4gdGhlIG1pc3NpbmcgdGFyZ2V0IGRhdGEgd2lsbCBiZSBmaWxsZWQgaW4uXG4gICAgICBjb25zdCBuYXRpdmUgPSByZWFkRWxlbWVudFZhbHVlKGxWaWV3W25vZGVJbmRleF0pO1xuICAgICAgY29uc3QgZXhpc3RpbmdDdHggPSByZWFkUGF0Y2hlZERhdGEobmF0aXZlKTtcbiAgICAgIGNvbnN0IGNvbnRleHQ6IExDb250ZXh0ID0gKGV4aXN0aW5nQ3R4ICYmICFBcnJheS5pc0FycmF5KGV4aXN0aW5nQ3R4KSkgP1xuICAgICAgICAgIGV4aXN0aW5nQ3R4IDpcbiAgICAgICAgICBjcmVhdGVMQ29udGV4dChsVmlldywgbm9kZUluZGV4LCBuYXRpdmUpO1xuXG4gICAgICAvLyBvbmx5IHdoZW4gdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBkaXNjb3ZlcmVkIHRoZW4gdXBkYXRlIHRoZSBtb25rZXktcGF0Y2hcbiAgICAgIGlmIChjb21wb25lbnQgJiYgY29udGV4dC5jb21wb25lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb250ZXh0LmNvbXBvbmVudCA9IGNvbXBvbmVudDtcbiAgICAgICAgYXR0YWNoUGF0Y2hEYXRhKGNvbnRleHQuY29tcG9uZW50LCBjb250ZXh0KTtcbiAgICAgIH1cblxuICAgICAgLy8gb25seSB3aGVuIHRoZSBkaXJlY3RpdmVzIGhhdmUgYmVlbiBkaXNjb3ZlcmVkIHRoZW4gdXBkYXRlIHRoZSBtb25rZXktcGF0Y2hcbiAgICAgIGlmIChkaXJlY3RpdmVzICYmIGNvbnRleHQuZGlyZWN0aXZlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRleHQuZGlyZWN0aXZlcyA9IGRpcmVjdGl2ZXM7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGF0dGFjaFBhdGNoRGF0YShkaXJlY3RpdmVzW2ldLCBjb250ZXh0KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBhdHRhY2hQYXRjaERhdGEoY29udGV4dC5uYXRpdmUsIGNvbnRleHQpO1xuICAgICAgbXBWYWx1ZSA9IGNvbnRleHQ7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHJFbGVtZW50ID0gdGFyZ2V0IGFzIFJFbGVtZW50O1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREb21Ob2RlKHJFbGVtZW50KTtcblxuICAgIC8vIGlmIHRoZSBjb250ZXh0IGlzIG5vdCBmb3VuZCB0aGVuIHdlIG5lZWQgdG8gdHJhdmVyc2UgdXB3YXJkcyB1cCB0aGUgRE9NXG4gICAgLy8gdG8gZmluZCB0aGUgbmVhcmVzdCBlbGVtZW50IHRoYXQgaGFzIGFscmVhZHkgYmVlbiBtb25rZXkgcGF0Y2hlZCB3aXRoIGRhdGFcbiAgICBsZXQgcGFyZW50ID0gckVsZW1lbnQgYXMgYW55O1xuICAgIHdoaWxlIChwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZSkge1xuICAgICAgY29uc3QgcGFyZW50Q29udGV4dCA9IHJlYWRQYXRjaGVkRGF0YShwYXJlbnQpO1xuICAgICAgaWYgKHBhcmVudENvbnRleHQpIHtcbiAgICAgICAgbGV0IGxWaWV3OiBMVmlld3xudWxsO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwYXJlbnRDb250ZXh0KSkge1xuICAgICAgICAgIGxWaWV3ID0gcGFyZW50Q29udGV4dCBhcyBMVmlldztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsVmlldyA9IHBhcmVudENvbnRleHQubFZpZXc7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0aGUgZWRnZSBvZiB0aGUgYXBwIHdhcyBhbHNvIHJlYWNoZWQgaGVyZSB0aHJvdWdoIGFub3RoZXIgbWVhbnNcbiAgICAgICAgLy8gKG1heWJlIGJlY2F1c2UgdGhlIERPTSB3YXMgY2hhbmdlZCBtYW51YWxseSkuXG4gICAgICAgIGlmICghbFZpZXcpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGluZGV4ID0gZmluZFZpYU5hdGl2ZUVsZW1lbnQobFZpZXcsIHJFbGVtZW50KTtcbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICBjb25zdCBuYXRpdmUgPSByZWFkRWxlbWVudFZhbHVlKGxWaWV3W2luZGV4XSk7XG4gICAgICAgICAgY29uc3QgY29udGV4dCA9IGNyZWF0ZUxDb250ZXh0KGxWaWV3LCBpbmRleCwgbmF0aXZlKTtcbiAgICAgICAgICBhdHRhY2hQYXRjaERhdGEobmF0aXZlLCBjb250ZXh0KTtcbiAgICAgICAgICBtcFZhbHVlID0gY29udGV4dDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gKG1wVmFsdWUgYXMgTENvbnRleHQpIHx8IG51bGw7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlbXB0eSBpbnN0YW5jZSBvZiBhIGBMQ29udGV4dGAgY29udGV4dFxuICovXG5mdW5jdGlvbiBjcmVhdGVMQ29udGV4dChsVmlldzogTFZpZXcsIG5vZGVJbmRleDogbnVtYmVyLCBuYXRpdmU6IFJFbGVtZW50KTogTENvbnRleHQge1xuICByZXR1cm4ge1xuICAgIGxWaWV3LFxuICAgIG5vZGVJbmRleCxcbiAgICBuYXRpdmUsXG4gICAgY29tcG9uZW50OiB1bmRlZmluZWQsXG4gICAgZGlyZWN0aXZlczogdW5kZWZpbmVkLFxuICAgIGxvY2FsUmVmczogdW5kZWZpbmVkLFxuICB9O1xufVxuXG4vKipcbiAqIFRha2VzIGEgY29tcG9uZW50IGluc3RhbmNlIGFuZCByZXR1cm5zIHRoZSB2aWV3IGZvciB0aGF0IGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50SW5zdGFuY2VcbiAqIEByZXR1cm5zIFRoZSBjb21wb25lbnQncyB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21wb25lbnRWaWV3QnlJbnN0YW5jZShjb21wb25lbnRJbnN0YW5jZToge30pOiBMVmlldyB7XG4gIGxldCBsVmlldyA9IHJlYWRQYXRjaGVkRGF0YShjb21wb25lbnRJbnN0YW5jZSk7XG4gIGxldCB2aWV3OiBMVmlldztcblxuICBpZiAoQXJyYXkuaXNBcnJheShsVmlldykpIHtcbiAgICBjb25zdCBub2RlSW5kZXggPSBmaW5kVmlhQ29tcG9uZW50KGxWaWV3LCBjb21wb25lbnRJbnN0YW5jZSk7XG4gICAgdmlldyA9IGdldENvbXBvbmVudFZpZXdCeUluZGV4KG5vZGVJbmRleCwgbFZpZXcpO1xuICAgIGNvbnN0IGNvbnRleHQgPSBjcmVhdGVMQ29udGV4dChsVmlldywgbm9kZUluZGV4LCB2aWV3W0hPU1RdIGFzIFJFbGVtZW50KTtcbiAgICBjb250ZXh0LmNvbXBvbmVudCA9IGNvbXBvbmVudEluc3RhbmNlO1xuICAgIGF0dGFjaFBhdGNoRGF0YShjb21wb25lbnRJbnN0YW5jZSwgY29udGV4dCk7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKGNvbnRleHQubmF0aXZlLCBjb250ZXh0KTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBjb250ZXh0ID0gbFZpZXcgYXMgYW55IGFzIExDb250ZXh0O1xuICAgIHZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleChjb250ZXh0Lm5vZGVJbmRleCwgY29udGV4dC5sVmlldyk7XG4gIH1cbiAgcmV0dXJuIHZpZXc7XG59XG5cbi8qKlxuICogQXNzaWducyB0aGUgZ2l2ZW4gZGF0YSB0byB0aGUgZ2l2ZW4gdGFyZ2V0ICh3aGljaCBjb3VsZCBiZSBhIGNvbXBvbmVudCxcbiAqIGRpcmVjdGl2ZSBvciBET00gbm9kZSBpbnN0YW5jZSkgdXNpbmcgbW9ua2V5LXBhdGNoaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoUGF0Y2hEYXRhKHRhcmdldDogYW55LCBkYXRhOiBMVmlldyB8IExDb250ZXh0KSB7XG4gIHRhcmdldFtNT05LRVlfUEFUQ0hfS0VZX05BTUVdID0gZGF0YTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29tcG9uZW50SW5zdGFuY2UoaW5zdGFuY2U6IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gaW5zdGFuY2UgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IubmdDb21wb25lbnREZWY7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0RpcmVjdGl2ZUluc3RhbmNlKGluc3RhbmNlOiBhbnkpOiBib29sZWFuIHtcbiAgcmV0dXJuIGluc3RhbmNlICYmIGluc3RhbmNlLmNvbnN0cnVjdG9yICYmIGluc3RhbmNlLmNvbnN0cnVjdG9yLm5nRGlyZWN0aXZlRGVmO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGVsZW1lbnQgd2l0aGluIHRoZSBnaXZlbiBMVmlldyBhbmQgcmV0dXJucyB0aGUgbWF0Y2hpbmcgaW5kZXhcbiAqL1xuZnVuY3Rpb24gZmluZFZpYU5hdGl2ZUVsZW1lbnQobFZpZXc6IExWaWV3LCB0YXJnZXQ6IFJFbGVtZW50KTogbnVtYmVyIHtcbiAgbGV0IHROb2RlID0gbFZpZXdbVFZJRVddLmZpcnN0Q2hpbGQ7XG4gIHdoaWxlICh0Tm9kZSkge1xuICAgIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSAhO1xuICAgIGlmIChuYXRpdmUgPT09IHRhcmdldCkge1xuICAgICAgcmV0dXJuIHROb2RlLmluZGV4O1xuICAgIH1cbiAgICB0Tm9kZSA9IHRyYXZlcnNlTmV4dEVsZW1lbnQodE5vZGUpO1xuICB9XG5cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIG5leHQgdE5vZGUgKGNoaWxkLCBzaWJsaW5nIG9yIHBhcmVudCkuXG4gKi9cbmZ1bmN0aW9uIHRyYXZlcnNlTmV4dEVsZW1lbnQodE5vZGU6IFROb2RlKTogVE5vZGV8bnVsbCB7XG4gIGlmICh0Tm9kZS5jaGlsZCkge1xuICAgIHJldHVybiB0Tm9kZS5jaGlsZDtcbiAgfSBlbHNlIGlmICh0Tm9kZS5uZXh0KSB7XG4gICAgcmV0dXJuIHROb2RlLm5leHQ7XG4gIH0gZWxzZSB7XG4gICAgLy8gTGV0J3MgdGFrZSB0aGUgZm9sbG93aW5nIHRlbXBsYXRlOiA8ZGl2PjxzcGFuPnRleHQ8L3NwYW4+PC9kaXY+PGNvbXBvbmVudC8+XG4gICAgLy8gQWZ0ZXIgY2hlY2tpbmcgdGhlIHRleHQgbm9kZSwgd2UgbmVlZCB0byBmaW5kIHRoZSBuZXh0IHBhcmVudCB0aGF0IGhhcyBhIFwibmV4dFwiIFROb2RlLFxuICAgIC8vIGluIHRoaXMgY2FzZSB0aGUgcGFyZW50IGBkaXZgLCBzbyB0aGF0IHdlIGNhbiBmaW5kIHRoZSBjb21wb25lbnQuXG4gICAgd2hpbGUgKHROb2RlLnBhcmVudCAmJiAhdE5vZGUucGFyZW50Lm5leHQpIHtcbiAgICAgIHROb2RlID0gdE5vZGUucGFyZW50O1xuICAgIH1cbiAgICByZXR1cm4gdE5vZGUucGFyZW50ICYmIHROb2RlLnBhcmVudC5uZXh0O1xuICB9XG59XG5cbi8qKlxuICogTG9jYXRlcyB0aGUgY29tcG9uZW50IHdpdGhpbiB0aGUgZ2l2ZW4gTFZpZXcgYW5kIHJldHVybnMgdGhlIG1hdGNoaW5nIGluZGV4XG4gKi9cbmZ1bmN0aW9uIGZpbmRWaWFDb21wb25lbnQobFZpZXc6IExWaWV3LCBjb21wb25lbnRJbnN0YW5jZToge30pOiBudW1iZXIge1xuICBjb25zdCBjb21wb25lbnRJbmRpY2VzID0gbFZpZXdbVFZJRVddLmNvbXBvbmVudHM7XG4gIGlmIChjb21wb25lbnRJbmRpY2VzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wb25lbnRJbmRpY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbGVtZW50Q29tcG9uZW50SW5kZXggPSBjb21wb25lbnRJbmRpY2VzW2ldO1xuICAgICAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudFZpZXdCeUluZGV4KGVsZW1lbnRDb21wb25lbnRJbmRleCwgbFZpZXcpO1xuICAgICAgaWYgKGNvbXBvbmVudFZpZXdbQ09OVEVYVF0gPT09IGNvbXBvbmVudEluc3RhbmNlKSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50Q29tcG9uZW50SW5kZXg7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHJvb3RDb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgoSEVBREVSX09GRlNFVCwgbFZpZXcpO1xuICAgIGNvbnN0IHJvb3RDb21wb25lbnQgPSByb290Q29tcG9uZW50Vmlld1tDT05URVhUXTtcbiAgICBpZiAocm9vdENvbXBvbmVudCA9PT0gY29tcG9uZW50SW5zdGFuY2UpIHtcbiAgICAgIC8vIHdlIGFyZSBkZWFsaW5nIHdpdGggdGhlIHJvb3QgZWxlbWVudCBoZXJlIHRoZXJlZm9yZSB3ZSBrbm93IHRoYXQgdGhlXG4gICAgICAvLyBlbGVtZW50IGlzIHRoZSB2ZXJ5IGZpcnN0IGVsZW1lbnQgYWZ0ZXIgdGhlIEhFQURFUiBkYXRhIGluIHRoZSBsVmlld1xuICAgICAgcmV0dXJuIEhFQURFUl9PRkZTRVQ7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBkaXJlY3RpdmUgd2l0aGluIHRoZSBnaXZlbiBMVmlldyBhbmQgcmV0dXJucyB0aGUgbWF0Y2hpbmcgaW5kZXhcbiAqL1xuZnVuY3Rpb24gZmluZFZpYURpcmVjdGl2ZShsVmlldzogTFZpZXcsIGRpcmVjdGl2ZUluc3RhbmNlOiB7fSk6IG51bWJlciB7XG4gIC8vIGlmIGEgZGlyZWN0aXZlIGlzIG1vbmtleSBwYXRjaGVkIHRoZW4gaXQgd2lsbCAoYnkgZGVmYXVsdClcbiAgLy8gaGF2ZSBhIHJlZmVyZW5jZSB0byB0aGUgTFZpZXcgb2YgdGhlIGN1cnJlbnQgdmlldy4gVGhlXG4gIC8vIGVsZW1lbnQgYm91bmQgdG8gdGhlIGRpcmVjdGl2ZSBiZWluZyBzZWFyY2ggbGl2ZXMgc29tZXdoZXJlXG4gIC8vIGluIHRoZSB2aWV3IGRhdGEuIFdlIGxvb3AgdGhyb3VnaCB0aGUgbm9kZXMgYW5kIGNoZWNrIHRoZWlyXG4gIC8vIGxpc3Qgb2YgZGlyZWN0aXZlcyBmb3IgdGhlIGluc3RhbmNlLlxuICBsZXQgdE5vZGUgPSBsVmlld1tUVklFV10uZmlyc3RDaGlsZDtcbiAgd2hpbGUgKHROb2RlKSB7XG4gICAgY29uc3QgZGlyZWN0aXZlSW5kZXhTdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4RW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICAgIGZvciAobGV0IGkgPSBkaXJlY3RpdmVJbmRleFN0YXJ0OyBpIDwgZGlyZWN0aXZlSW5kZXhFbmQ7IGkrKykge1xuICAgICAgaWYgKGxWaWV3W2ldID09PSBkaXJlY3RpdmVJbnN0YW5jZSkge1xuICAgICAgICByZXR1cm4gdE5vZGUuaW5kZXg7XG4gICAgICB9XG4gICAgfVxuICAgIHROb2RlID0gdHJhdmVyc2VOZXh0RWxlbWVudCh0Tm9kZSk7XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBsaXN0IG9mIGRpcmVjdGl2ZXMgZXh0cmFjdGVkIGZyb20gdGhlIGdpdmVuIHZpZXcgYmFzZWQgb24gdGhlXG4gKiBwcm92aWRlZCBsaXN0IG9mIGRpcmVjdGl2ZSBpbmRleCB2YWx1ZXMuXG4gKlxuICogQHBhcmFtIG5vZGVJbmRleCBUaGUgbm9kZSBpbmRleFxuICogQHBhcmFtIGxWaWV3IFRoZSB0YXJnZXQgdmlldyBkYXRhXG4gKiBAcGFyYW0gaW5jbHVkZUNvbXBvbmVudHMgV2hldGhlciBvciBub3QgdG8gaW5jbHVkZSBjb21wb25lbnRzIGluIHJldHVybmVkIGRpcmVjdGl2ZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldERpcmVjdGl2ZXNBdE5vZGVJbmRleChcbiAgICBub2RlSW5kZXg6IG51bWJlciwgbFZpZXc6IExWaWV3LCBpbmNsdWRlQ29tcG9uZW50czogYm9vbGVhbik6IGFueVtdfG51bGwge1xuICBjb25zdCB0Tm9kZSA9IGxWaWV3W1RWSUVXXS5kYXRhW25vZGVJbmRleF0gYXMgVE5vZGU7XG4gIGxldCBkaXJlY3RpdmVTdGFydEluZGV4ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gIGlmIChkaXJlY3RpdmVTdGFydEluZGV4ID09IDApIHJldHVybiBFTVBUWV9BUlJBWTtcbiAgY29uc3QgZGlyZWN0aXZlRW5kSW5kZXggPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGlmICghaW5jbHVkZUNvbXBvbmVudHMgJiYgdE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50KSBkaXJlY3RpdmVTdGFydEluZGV4Kys7XG4gIHJldHVybiBsVmlldy5zbGljZShkaXJlY3RpdmVTdGFydEluZGV4LCBkaXJlY3RpdmVFbmRJbmRleCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21wb25lbnRBdE5vZGVJbmRleChub2RlSW5kZXg6IG51bWJlciwgbFZpZXc6IExWaWV3KToge318bnVsbCB7XG4gIGNvbnN0IHROb2RlID0gbFZpZXdbVFZJRVddLmRhdGFbbm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgbGV0IGRpcmVjdGl2ZVN0YXJ0SW5kZXggPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgcmV0dXJuIHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCA/IGxWaWV3W2RpcmVjdGl2ZVN0YXJ0SW5kZXhdIDogbnVsbDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbWFwIG9mIGxvY2FsIHJlZmVyZW5jZXMgKGxvY2FsIHJlZmVyZW5jZSBuYW1lID0+IGVsZW1lbnQgb3IgZGlyZWN0aXZlIGluc3RhbmNlKSB0aGF0XG4gKiBleGlzdCBvbiBhIGdpdmVuIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXNjb3ZlckxvY2FsUmVmcyhsVmlldzogTFZpZXcsIG5vZGVJbmRleDogbnVtYmVyKToge1trZXk6IHN0cmluZ106IGFueX18bnVsbCB7XG4gIGNvbnN0IHROb2RlID0gbFZpZXdbVFZJRVddLmRhdGFbbm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgaWYgKHROb2RlICYmIHROb2RlLmxvY2FsTmFtZXMpIHtcbiAgICBjb25zdCByZXN1bHQ6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0Tm9kZS5sb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBsb2NhbFJlZk5hbWUgPSB0Tm9kZS5sb2NhbE5hbWVzW2ldO1xuICAgICAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSB0Tm9kZS5sb2NhbE5hbWVzW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgICByZXN1bHRbbG9jYWxSZWZOYW1lXSA9XG4gICAgICAgICAgZGlyZWN0aXZlSW5kZXggPT09IC0xID8gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpICEgOiBsVmlld1tkaXJlY3RpdmVJbmRleF07XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cbiJdfQ==