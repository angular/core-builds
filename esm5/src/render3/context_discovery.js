/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import './ng_dev_mode';
import { assertEqual } from './assert';
import { ACTIVE_INDEX, HOST_NATIVE } from './interfaces/container';
import { CONTEXT, HEADER_OFFSET, TVIEW } from './interfaces/view';
/**
 * This property will be monkey-patched on elements, components and directives
 */
export var MONKEY_PATCH_KEY_NAME = '__ngContext__';
/** Returns the matching `LContext` data for a given DOM node, directive or component instance.
 *
 * This function will examine the provided DOM element, component, or directive instance\'s
 * monkey-patched property to derive the `LContext` data. Once called then the monkey-patched
 * value will be that of the newly created `LContext`.
 *
 * If the monkey-patched value is the `LViewData` instance then the context value for that
 * target will be created and the monkey-patch reference will be updated. Therefore when this
 * function is called it may mutate the provided element\'s, component\'s or any of the associated
 * directive\'s monkey-patch values.
 *
 * If the monkey-patch value is not detected then the code will walk up the DOM until an element
 * is found which contains a monkey-patch reference. When that occurs then the provided element
 * will be updated with a new context (which is then returned). If the monkey-patch value is not
 * detected for a component/directive instance then it will throw an error (all components and
 * directives should be automatically monkey-patched by ivy).
 */
export function getContext(target) {
    var mpValue = readPatchedData(target);
    if (mpValue) {
        // only when it's an array is it considered an LViewData instance
        // ... otherwise it's an already constructed LContext instance
        if (Array.isArray(mpValue)) {
            var lViewData = mpValue;
            var nodeIndex = void 0;
            var component = undefined;
            var directives = undefined;
            if (isComponentInstance(target)) {
                nodeIndex = findViaComponent(lViewData, target);
                if (nodeIndex == -1) {
                    throw new Error('The provided component was not found in the application');
                }
                component = target;
            }
            else if (isDirectiveInstance(target)) {
                nodeIndex = findViaDirective(lViewData, target);
                if (nodeIndex == -1) {
                    throw new Error('The provided directive was not found in the application');
                }
                directives = discoverDirectives(nodeIndex, lViewData, false);
            }
            else {
                nodeIndex = findViaNativeElement(lViewData, target);
                if (nodeIndex == -1) {
                    return null;
                }
            }
            // the goal is not to fill the entire context full of data because the lookups
            // are expensive. Instead, only the target data (the element, compontent or
            // directive details) are filled into the context. If called multiple times
            // with different target values then the missing target data will be filled in.
            var lNode = getLNodeFromViewData(lViewData, nodeIndex);
            var existingCtx = readPatchedData(lNode.native);
            var context = (existingCtx && !Array.isArray(existingCtx)) ?
                existingCtx :
                createLContext(lViewData, nodeIndex, lNode.native);
            // only when the component has been discovered then update the monkey-patch
            if (component && context.component === undefined) {
                context.component = component;
                attachPatchData(context.component, context);
            }
            // only when the directives have been discovered then update the monkey-patch
            if (directives && context.directives === undefined) {
                context.directives = directives;
                for (var i = 0; i < directives.length; i++) {
                    attachPatchData(directives[i], context);
                }
            }
            attachPatchData(context.native, context);
            mpValue = context;
        }
    }
    else {
        var rElement = target;
        ngDevMode && assertDomElement(rElement);
        // if the context is not found then we need to traverse upwards up the DOM
        // to find the nearest element that has already been monkey patched with data
        var parent_1 = rElement;
        while (parent_1 = parent_1.parentNode) {
            var parentContext = readPatchedData(parent_1);
            if (parentContext) {
                var lViewData = void 0;
                if (Array.isArray(parentContext)) {
                    lViewData = parentContext;
                }
                else {
                    lViewData = parentContext.lViewData;
                }
                // the edge of the app was also reached here through another means
                // (maybe because the DOM was changed manually).
                if (!lViewData) {
                    return null;
                }
                var index = findViaNativeElement(lViewData, rElement);
                if (index >= 0) {
                    var lNode = getLNodeFromViewData(lViewData, index);
                    var context = createLContext(lViewData, index, lNode.native);
                    attachPatchData(lNode.native, context);
                    mpValue = context;
                    break;
                }
            }
        }
    }
    return mpValue || null;
}
/**
 * Creates an empty instance of a `LContext` context
 */
function createLContext(lViewData, lNodeIndex, native) {
    return {
        lViewData: lViewData,
        nodeIndex: lNodeIndex, native: native,
        component: undefined,
        directives: undefined,
        localRefs: undefined,
    };
}
/**
 * A simplified lookup function for finding the LElementNode from a component instance.
 *
 * This function exists for tree-shaking purposes to avoid having to pull in everything
 * that `getContext` has in the event that an Angular application doesn't need to have
 * any programmatic access to an element's context (only change detection uses this function).
 */
export function getLElementFromComponent(componentInstance) {
    var lViewData = readPatchedData(componentInstance);
    var lNode;
    if (Array.isArray(lViewData)) {
        var lNodeIndex = findViaComponent(lViewData, componentInstance);
        lNode = readElementValue(lViewData[lNodeIndex]);
        var context = createLContext(lViewData, lNodeIndex, lNode.native);
        context.component = componentInstance;
        attachPatchData(componentInstance, context);
        attachPatchData(context.native, context);
    }
    else {
        var context = lViewData;
        lNode = readElementValue(context.lViewData[context.nodeIndex]);
    }
    return lNode;
}
/**
 * Assigns the given data to the given target (which could be a component,
 * directive or DOM node instance) using monkey-patching.
 */
export function attachPatchData(target, data) {
    target[MONKEY_PATCH_KEY_NAME] = data;
}
/**
 * Returns the monkey-patch value data present on the target (which could be
 * a component, directive or a DOM node).
 */
export function readPatchedData(target) {
    return target[MONKEY_PATCH_KEY_NAME];
}
export function readPatchedLViewData(target) {
    var value = readPatchedData(target);
    if (value) {
        return Array.isArray(value) ? value : value.lViewData;
    }
    return null;
}
export function isComponentInstance(instance) {
    return instance && instance.constructor && instance.constructor.ngComponentDef;
}
export function isDirectiveInstance(instance) {
    return instance && instance.constructor && instance.constructor.ngDirectiveDef;
}
/**
 * Locates the element within the given LViewData and returns the matching index
 */
function findViaNativeElement(lViewData, native) {
    var tNode = lViewData[TVIEW].firstChild;
    while (tNode) {
        var lNode = getLNodeFromViewData(lViewData, tNode.index);
        if (lNode.native === native) {
            return tNode.index;
        }
        tNode = traverseNextElement(tNode);
    }
    return -1;
}
/**
 * Locates the next tNode (child, sibling or parent).
 */
function traverseNextElement(tNode) {
    if (tNode.child) {
        return tNode.child;
    }
    else if (tNode.next) {
        return tNode.next;
    }
    else if (tNode.parent) {
        return tNode.parent.next || null;
    }
    return null;
}
/**
 * Locates the component within the given LViewData and returns the matching index
 */
function findViaComponent(lViewData, componentInstance) {
    var componentIndices = lViewData[TVIEW].components;
    if (componentIndices) {
        for (var i = 0; i < componentIndices.length; i++) {
            var elementComponentIndex = componentIndices[i];
            var lNodeData = readElementValue(lViewData[elementComponentIndex]).data;
            if (lNodeData[CONTEXT] === componentInstance) {
                return elementComponentIndex;
            }
        }
    }
    else {
        var rootNode = lViewData[HEADER_OFFSET];
        var rootComponent = rootNode.data[CONTEXT];
        if (rootComponent === componentInstance) {
            // we are dealing with the root element here therefore we know that the
            // element is the very first element after the HEADER data in the lView
            return HEADER_OFFSET;
        }
    }
    return -1;
}
/**
 * Locates the directive within the given LViewData and returns the matching index
 */
function findViaDirective(lViewData, directiveInstance) {
    // if a directive is monkey patched then it will (by default)
    // have a reference to the LViewData of the current view. The
    // element bound to the directive being search lives somewhere
    // in the view data. We loop through the nodes and check their
    // list of directives for the instance.
    var tNode = lViewData[TVIEW].firstChild;
    while (tNode) {
        var directiveIndexStart = getDirectiveStartIndex(tNode);
        var directiveIndexEnd = getDirectiveEndIndex(tNode, directiveIndexStart);
        for (var i = directiveIndexStart; i < directiveIndexEnd; i++) {
            if (lViewData[i] === directiveInstance) {
                return tNode.index;
            }
        }
        tNode = traverseNextElement(tNode);
    }
    return -1;
}
function assertDomElement(element) {
    assertEqual(element.nodeType, 1, 'The provided value must be an instance of an HTMLElement');
}
/**
 * Retruns the instance of the LElementNode at the given index in the LViewData.
 *
 * This function will also unwrap the inner value incase it's stuffed into an
 * array (which is what happens when [style] and [class] bindings are present
 * in the view instructions for the element being returned).
 */
function getLNodeFromViewData(lViewData, lElementIndex) {
    var value = lViewData[lElementIndex];
    return value ? readElementValue(value) : null;
}
/**
 * Returns a list of directives extracted from the given view based on the
 * provided list of directive index values.
 *
 * @param nodeIndex The node index
 * @param lViewData The target view data
 * @param includeComponents Whether or not to include components in returned directives
 */
export function discoverDirectives(nodeIndex, lViewData, includeComponents) {
    var tNode = lViewData[TVIEW].data[nodeIndex];
    var directiveStartIndex = getDirectiveStartIndex(tNode);
    var directiveEndIndex = getDirectiveEndIndex(tNode, directiveStartIndex);
    if (!includeComponents && tNode.flags & 4096 /* isComponent */)
        directiveStartIndex++;
    return lViewData.slice(directiveStartIndex, directiveEndIndex);
}
/**
 * Returns a map of local references (local reference name => element or directive instance) that
 * exist on a given element.
 */
export function discoverLocalRefs(lViewData, lNodeIndex) {
    var tNode = lViewData[TVIEW].data[lNodeIndex];
    if (tNode && tNode.localNames) {
        var result = {};
        for (var i = 0; i < tNode.localNames.length; i += 2) {
            var localRefName = tNode.localNames[i];
            var directiveIndex = tNode.localNames[i + 1];
            result[localRefName] = directiveIndex === -1 ?
                getLNodeFromViewData(lViewData, lNodeIndex).native :
                lViewData[directiveIndex];
        }
        return result;
    }
    return null;
}
function getDirectiveStartIndex(tNode) {
    // the tNode instances store a flag value which then has a
    // pointer which tells the starting index of where all the
    // active directives are in the master directive array
    return tNode.flags >> 15 /* DirectiveStartingIndexShift */;
}
function getDirectiveEndIndex(tNode, startIndex) {
    // The end value is also a part of the same flag
    // (see `TNodeFlags` to see how the flag bit shifting
    // values are used).
    var count = tNode.flags & 4095 /* DirectiveCountMask */;
    return count ? (startIndex + count) : -1;
}
/**
 * Takes the value of a slot in `LViewData` and returns the element node.
 *
 * Normally, element nodes are stored flat, but if the node has styles/classes on it,
 * it might be wrapped in a styling context. Or if that node has a directive that injects
 * ViewContainerRef, it may be wrapped in an LContainer.
 *
 * @param value The initial value in `LViewData`
 */
export function readElementValue(value) {
    if (Array.isArray(value)) {
        if (typeof value[ACTIVE_INDEX] === 'number') {
            // This is an LContainer. It may also have a styling context.
            value = value[HOST_NATIVE];
            return Array.isArray(value) ? value[0 /* ElementPosition */] : value;
        }
        else {
            // This is a StylingContext, which stores the element node at 0.
            return value[0 /* ElementPosition */];
        }
    }
    else {
        return value; // Regular LNode is stored here
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9kaXNjb3ZlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2NvbnRleHRfZGlzY292ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDckMsT0FBTyxFQUFDLFlBQVksRUFBRSxXQUFXLEVBQWEsTUFBTSx3QkFBd0IsQ0FBQztBQUk3RSxPQUFPLEVBQUMsT0FBTyxFQUFFLGFBQWEsRUFBYSxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUUzRTs7R0FFRztBQUNILE1BQU0sQ0FBQyxJQUFNLHFCQUFxQixHQUFHLGVBQWUsQ0FBQztBQTZDckQ7Ozs7Ozs7Ozs7Ozs7Ozs7R0FnQkc7QUFDSCxNQUFNLFVBQVUsVUFBVSxDQUFDLE1BQVc7SUFDcEMsSUFBSSxPQUFPLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3RDLElBQUksT0FBTyxFQUFFO1FBQ1gsaUVBQWlFO1FBQ2pFLDhEQUE4RDtRQUM5RCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDMUIsSUFBTSxTQUFTLEdBQWMsT0FBUyxDQUFDO1lBQ3ZDLElBQUksU0FBUyxTQUFRLENBQUM7WUFDdEIsSUFBSSxTQUFTLEdBQVEsU0FBUyxDQUFDO1lBQy9CLElBQUksVUFBVSxHQUF5QixTQUFTLENBQUM7WUFFakQsSUFBSSxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDL0IsU0FBUyxHQUFHLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDaEQsSUFBSSxTQUFTLElBQUksQ0FBQyxDQUFDLEVBQUU7b0JBQ25CLE1BQU0sSUFBSSxLQUFLLENBQUMseURBQXlELENB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QUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUN4QixJQUFJLE9BQU8sS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLFFBQVEsRUFBRTtZQUMzQyw2REFBNkQ7WUFDN0QsS0FBSyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQWtDLENBQUM7WUFDNUQsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLHlCQUFnQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7U0FDN0U7YUFBTTtZQUNMLGdFQUFnRTtZQUNoRSxPQUFPLEtBQUsseUJBQThDLENBQUM7U0FDNUQ7S0FDRjtTQUFNO1FBQ0wsT0FBTyxLQUFLLENBQUMsQ0FBRSwrQkFBK0I7S0FDL0M7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICcuL25nX2Rldl9tb2RlJztcblxuaW1wb3J0IHthc3NlcnRFcXVhbH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtBQ1RJVkVfSU5ERVgsIEhPU1RfTkFUSVZFLCBMQ29udGFpbmVyfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7TEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U3R5bGluZ0NvbnRleHQsIFN0eWxpbmdJbmRleH0gZnJvbSAnLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtDT05URVhULCBIRUFERVJfT0ZGU0VULCBMVmlld0RhdGEsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5cbi8qKlxuICogVGhpcyBwcm9wZXJ0eSB3aWxsIGJlIG1vbmtleS1wYXRjaGVkIG9uIGVsZW1lbnRzLCBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzXG4gKi9cbmV4cG9ydCBjb25zdCBNT05LRVlfUEFUQ0hfS0VZX05BTUUgPSAnX19uZ0NvbnRleHRfXyc7XG5cbi8qKlxuICogVGhlIGludGVybmFsIHZpZXcgY29udGV4dCB3aGljaCBpcyBzcGVjaWZpYyB0byBhIGdpdmVuIERPTSBlbGVtZW50LCBkaXJlY3RpdmUgb3JcbiAqIGNvbXBvbmVudCBpbnN0YW5jZS4gRWFjaCB2YWx1ZSBpbiBoZXJlIChiZXNpZGVzIHRoZSBMVmlld0RhdGEgYW5kIGVsZW1lbnQgbm9kZSBkZXRhaWxzKVxuICogY2FuIGJlIHByZXNlbnQsIG51bGwgb3IgdW5kZWZpbmVkLiBJZiB1bmRlZmluZWQgdGhlbiBpdCBpbXBsaWVzIHRoZSB2YWx1ZSBoYXMgbm90IGJlZW5cbiAqIGxvb2tlZCB1cCB5ZXQsIG90aGVyd2lzZSwgaWYgbnVsbCwgdGhlbiBhIGxvb2t1cCB3YXMgZXhlY3V0ZWQgYW5kIG5vdGhpbmcgd2FzIGZvdW5kLlxuICpcbiAqIEVhY2ggdmFsdWUgd2lsbCBnZXQgZmlsbGVkIHdoZW4gdGhlIHJlc3BlY3RpdmUgdmFsdWUgaXMgZXhhbWluZWQgd2l0aGluIHRoZSBnZXRDb250ZXh0XG4gKiBmdW5jdGlvbi4gVGhlIGNvbXBvbmVudCwgZWxlbWVudCBhbmQgZWFjaCBkaXJlY3RpdmUgaW5zdGFuY2Ugd2lsbCBzaGFyZSB0aGUgc2FtZSBpbnN0YW5jZVxuICogb2YgdGhlIGNvbnRleHQuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTENvbnRleHQge1xuICAvKipcbiAgICogVGhlIGNvbXBvbmVudCdzIHBhcmVudCB2aWV3IGRhdGEuXG4gICAqL1xuICBsVmlld0RhdGE6IExWaWV3RGF0YTtcblxuICAvKipcbiAgICogVGhlIGluZGV4IGluc3RhbmNlIG9mIHRoZSBub2RlLlxuICAgKi9cbiAgbm9kZUluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBpbnN0YW5jZSBvZiB0aGUgRE9NIG5vZGUgdGhhdCBpcyBhdHRhY2hlZCB0byB0aGUgbE5vZGUuXG4gICAqL1xuICBuYXRpdmU6IFJFbGVtZW50O1xuXG4gIC8qKlxuICAgKiBUaGUgaW5zdGFuY2Ugb2YgdGhlIENvbXBvbmVudCBub2RlLlxuICAgKi9cbiAgY29tcG9uZW50OiB7fXxudWxsfHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogVGhlIGxpc3Qgb2YgYWN0aXZlIGRpcmVjdGl2ZXMgdGhhdCBleGlzdCBvbiB0aGlzIGVsZW1lbnQuXG4gICAqL1xuICBkaXJlY3RpdmVzOiBhbnlbXXxudWxsfHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogVGhlIG1hcCBvZiBsb2NhbCByZWZlcmVuY2VzIChsb2NhbCByZWZlcmVuY2UgbmFtZSA9PiBlbGVtZW50IG9yIGRpcmVjdGl2ZSBpbnN0YW5jZSkgdGhhdCBleGlzdFxuICAgKiBvbiB0aGlzIGVsZW1lbnQuXG4gICAqL1xuICBsb2NhbFJlZnM6IHtba2V5OiBzdHJpbmddOiBhbnl9fG51bGx8dW5kZWZpbmVkO1xufVxuXG4vKiogUmV0dXJucyB0aGUgbWF0Y2hpbmcgYExDb250ZXh0YCBkYXRhIGZvciBhIGdpdmVuIERPTSBub2RlLCBkaXJlY3RpdmUgb3IgY29tcG9uZW50IGluc3RhbmNlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBleGFtaW5lIHRoZSBwcm92aWRlZCBET00gZWxlbWVudCwgY29tcG9uZW50LCBvciBkaXJlY3RpdmUgaW5zdGFuY2VcXCdzXG4gKiBtb25rZXktcGF0Y2hlZCBwcm9wZXJ0eSB0byBkZXJpdmUgdGhlIGBMQ29udGV4dGAgZGF0YS4gT25jZSBjYWxsZWQgdGhlbiB0aGUgbW9ua2V5LXBhdGNoZWRcbiAqIHZhbHVlIHdpbGwgYmUgdGhhdCBvZiB0aGUgbmV3bHkgY3JlYXRlZCBgTENvbnRleHRgLlxuICpcbiAqIElmIHRoZSBtb25rZXktcGF0Y2hlZCB2YWx1ZSBpcyB0aGUgYExWaWV3RGF0YWAgaW5zdGFuY2UgdGhlbiB0aGUgY29udGV4dCB2YWx1ZSBmb3IgdGhhdFxuICogdGFyZ2V0IHdpbGwgYmUgY3JlYXRlZCBhbmQgdGhlIG1vbmtleS1wYXRjaCByZWZlcmVuY2Ugd2lsbCBiZSB1cGRhdGVkLiBUaGVyZWZvcmUgd2hlbiB0aGlzXG4gKiBmdW5jdGlvbiBpcyBjYWxsZWQgaXQgbWF5IG11dGF0ZSB0aGUgcHJvdmlkZWQgZWxlbWVudFxcJ3MsIGNvbXBvbmVudFxcJ3Mgb3IgYW55IG9mIHRoZSBhc3NvY2lhdGVkXG4gKiBkaXJlY3RpdmVcXCdzIG1vbmtleS1wYXRjaCB2YWx1ZXMuXG4gKlxuICogSWYgdGhlIG1vbmtleS1wYXRjaCB2YWx1ZSBpcyBub3QgZGV0ZWN0ZWQgdGhlbiB0aGUgY29kZSB3aWxsIHdhbGsgdXAgdGhlIERPTSB1bnRpbCBhbiBlbGVtZW50XG4gKiBpcyBmb3VuZCB3aGljaCBjb250YWlucyBhIG1vbmtleS1wYXRjaCByZWZlcmVuY2UuIFdoZW4gdGhhdCBvY2N1cnMgdGhlbiB0aGUgcHJvdmlkZWQgZWxlbWVudFxuICogd2lsbCBiZSB1cGRhdGVkIHdpdGggYSBuZXcgY29udGV4dCAod2hpY2ggaXMgdGhlbiByZXR1cm5lZCkuIElmIHRoZSBtb25rZXktcGF0Y2ggdmFsdWUgaXMgbm90XG4gKiBkZXRlY3RlZCBmb3IgYSBjb21wb25lbnQvZGlyZWN0aXZlIGluc3RhbmNlIHRoZW4gaXQgd2lsbCB0aHJvdyBhbiBlcnJvciAoYWxsIGNvbXBvbmVudHMgYW5kXG4gKiBkaXJlY3RpdmVzIHNob3VsZCBiZSBhdXRvbWF0aWNhbGx5IG1vbmtleS1wYXRjaGVkIGJ5IGl2eSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb250ZXh0KHRhcmdldDogYW55KTogTENvbnRleHR8bnVsbCB7XG4gIGxldCBtcFZhbHVlID0gcmVhZFBhdGNoZWREYXRhKHRhcmdldCk7XG4gIGlmIChtcFZhbHVlKSB7XG4gICAgLy8gb25seSB3aGVuIGl0J3MgYW4gYXJyYXkgaXMgaXQgY29uc2lkZXJlZCBhbiBMVmlld0RhdGEgaW5zdGFuY2VcbiAgICAvLyAuLi4gb3RoZXJ3aXNlIGl0J3MgYW4gYWxyZWFkeSBjb25zdHJ1Y3RlZCBMQ29udGV4dCBpbnN0YW5jZVxuICAgIGlmIChBcnJheS5pc0FycmF5KG1wVmFsdWUpKSB7XG4gICAgICBjb25zdCBsVmlld0RhdGE6IExWaWV3RGF0YSA9IG1wVmFsdWUgITtcbiAgICAgIGxldCBub2RlSW5kZXg6IG51bWJlcjtcbiAgICAgIGxldCBjb21wb25lbnQ6IGFueSA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCBkaXJlY3RpdmVzOiBhbnlbXXxudWxsfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAgICAgaWYgKGlzQ29tcG9uZW50SW5zdGFuY2UodGFyZ2V0KSkge1xuICAgICAgICBub2RlSW5kZXggPSBmaW5kVmlhQ29tcG9uZW50KGxWaWV3RGF0YSwgdGFyZ2V0KTtcbiAgICAgICAgaWYgKG5vZGVJbmRleCA9PSAtMSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHByb3ZpZGVkIGNvbXBvbmVudCB3YXMgbm90IGZvdW5kIGluIHRoZSBhcHBsaWNhdGlvbicpO1xuICAgICAgICB9XG4gICAgICAgIGNvbXBvbmVudCA9IHRhcmdldDtcbiAgICAgIH0gZWxzZSBpZiAoaXNEaXJlY3RpdmVJbnN0YW5jZSh0YXJnZXQpKSB7XG4gICAgICAgIG5vZGVJbmRleCA9IGZpbmRWaWFEaXJlY3RpdmUobFZpZXdEYXRhLCB0YXJnZXQpO1xuICAgICAgICBpZiAobm9kZUluZGV4ID09IC0xKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgcHJvdmlkZWQgZGlyZWN0aXZlIHdhcyBub3QgZm91bmQgaW4gdGhlIGFwcGxpY2F0aW9uJyk7XG4gICAgICAgIH1cbiAgICAgICAgZGlyZWN0aXZlcyA9IGRpc2NvdmVyRGlyZWN0aXZlcyhub2RlSW5kZXgsIGxWaWV3RGF0YSwgZmFsc2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbm9kZUluZGV4ID0gZmluZFZpYU5hdGl2ZUVsZW1lbnQobFZpZXdEYXRhLCB0YXJnZXQgYXMgUkVsZW1lbnQpO1xuICAgICAgICBpZiAobm9kZUluZGV4ID09IC0xKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gdGhlIGdvYWwgaXMgbm90IHRvIGZpbGwgdGhlIGVudGlyZSBjb250ZXh0IGZ1bGwgb2YgZGF0YSBiZWNhdXNlIHRoZSBsb29rdXBzXG4gICAgICAvLyBhcmUgZXhwZW5zaXZlLiBJbnN0ZWFkLCBvbmx5IHRoZSB0YXJnZXQgZGF0YSAodGhlIGVsZW1lbnQsIGNvbXBvbnRlbnQgb3JcbiAgICAgIC8vIGRpcmVjdGl2ZSBkZXRhaWxzKSBhcmUgZmlsbGVkIGludG8gdGhlIGNvbnRleHQuIElmIGNhbGxlZCBtdWx0aXBsZSB0aW1lc1xuICAgICAgLy8gd2l0aCBkaWZmZXJlbnQgdGFyZ2V0IHZhbHVlcyB0aGVuIHRoZSBtaXNzaW5nIHRhcmdldCBkYXRhIHdpbGwgYmUgZmlsbGVkIGluLlxuICAgICAgY29uc3QgbE5vZGUgPSBnZXRMTm9kZUZyb21WaWV3RGF0YShsVmlld0RhdGEsIG5vZGVJbmRleCkgITtcbiAgICAgIGNvbnN0IGV4aXN0aW5nQ3R4ID0gcmVhZFBhdGNoZWREYXRhKGxOb2RlLm5hdGl2ZSk7XG4gICAgICBjb25zdCBjb250ZXh0OiBMQ29udGV4dCA9IChleGlzdGluZ0N0eCAmJiAhQXJyYXkuaXNBcnJheShleGlzdGluZ0N0eCkpID9cbiAgICAgICAgICBleGlzdGluZ0N0eCA6XG4gICAgICAgICAgY3JlYXRlTENvbnRleHQobFZpZXdEYXRhLCBub2RlSW5kZXgsIGxOb2RlLm5hdGl2ZSk7XG5cbiAgICAgIC8vIG9ubHkgd2hlbiB0aGUgY29tcG9uZW50IGhhcyBiZWVuIGRpc2NvdmVyZWQgdGhlbiB1cGRhdGUgdGhlIG1vbmtleS1wYXRjaFxuICAgICAgaWYgKGNvbXBvbmVudCAmJiBjb250ZXh0LmNvbXBvbmVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRleHQuY29tcG9uZW50ID0gY29tcG9uZW50O1xuICAgICAgICBhdHRhY2hQYXRjaERhdGEoY29udGV4dC5jb21wb25lbnQsIGNvbnRleHQpO1xuICAgICAgfVxuXG4gICAgICAvLyBvbmx5IHdoZW4gdGhlIGRpcmVjdGl2ZXMgaGF2ZSBiZWVuIGRpc2NvdmVyZWQgdGhlbiB1cGRhdGUgdGhlIG1vbmtleS1wYXRjaFxuICAgICAgaWYgKGRpcmVjdGl2ZXMgJiYgY29udGV4dC5kaXJlY3RpdmVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGV4dC5kaXJlY3RpdmVzID0gZGlyZWN0aXZlcztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaXJlY3RpdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgYXR0YWNoUGF0Y2hEYXRhKGRpcmVjdGl2ZXNbaV0sIGNvbnRleHQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGF0dGFjaFBhdGNoRGF0YShjb250ZXh0Lm5hdGl2ZSwgY29udGV4dCk7XG4gICAgICBtcFZhbHVlID0gY29udGV4dDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgckVsZW1lbnQgPSB0YXJnZXQgYXMgUkVsZW1lbnQ7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERvbUVsZW1lbnQockVsZW1lbnQpO1xuXG4gICAgLy8gaWYgdGhlIGNvbnRleHQgaXMgbm90IGZvdW5kIHRoZW4gd2UgbmVlZCB0byB0cmF2ZXJzZSB1cHdhcmRzIHVwIHRoZSBET01cbiAgICAvLyB0byBmaW5kIHRoZSBuZWFyZXN0IGVsZW1lbnQgdGhhdCBoYXMgYWxyZWFkeSBiZWVuIG1vbmtleSBwYXRjaGVkIHdpdGggZGF0YVxuICAgIGxldCBwYXJlbnQgPSByRWxlbWVudCBhcyBhbnk7XG4gICAgd2hpbGUgKHBhcmVudCA9IHBhcmVudC5wYXJlbnROb2RlKSB7XG4gICAgICBjb25zdCBwYXJlbnRDb250ZXh0ID0gcmVhZFBhdGNoZWREYXRhKHBhcmVudCk7XG4gICAgICBpZiAocGFyZW50Q29udGV4dCkge1xuICAgICAgICBsZXQgbFZpZXdEYXRhOiBMVmlld0RhdGF8bnVsbDtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocGFyZW50Q29udGV4dCkpIHtcbiAgICAgICAgICBsVmlld0RhdGEgPSBwYXJlbnRDb250ZXh0IGFzIExWaWV3RGF0YTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsVmlld0RhdGEgPSBwYXJlbnRDb250ZXh0LmxWaWV3RGF0YTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRoZSBlZGdlIG9mIHRoZSBhcHAgd2FzIGFsc28gcmVhY2hlZCBoZXJlIHRocm91Z2ggYW5vdGhlciBtZWFuc1xuICAgICAgICAvLyAobWF5YmUgYmVjYXVzZSB0aGUgRE9NIHdhcyBjaGFuZ2VkIG1hbnVhbGx5KS5cbiAgICAgICAgaWYgKCFsVmlld0RhdGEpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGluZGV4ID0gZmluZFZpYU5hdGl2ZUVsZW1lbnQobFZpZXdEYXRhLCByRWxlbWVudCk7XG4gICAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgICAgY29uc3QgbE5vZGUgPSBnZXRMTm9kZUZyb21WaWV3RGF0YShsVmlld0RhdGEsIGluZGV4KSAhO1xuICAgICAgICAgIGNvbnN0IGNvbnRleHQgPSBjcmVhdGVMQ29udGV4dChsVmlld0RhdGEsIGluZGV4LCBsTm9kZS5uYXRpdmUpO1xuICAgICAgICAgIGF0dGFjaFBhdGNoRGF0YShsTm9kZS5uYXRpdmUsIGNvbnRleHQpO1xuICAgICAgICAgIG1wVmFsdWUgPSBjb250ZXh0O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiAobXBWYWx1ZSBhcyBMQ29udGV4dCkgfHwgbnVsbDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGVtcHR5IGluc3RhbmNlIG9mIGEgYExDb250ZXh0YCBjb250ZXh0XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUxDb250ZXh0KGxWaWV3RGF0YTogTFZpZXdEYXRhLCBsTm9kZUluZGV4OiBudW1iZXIsIG5hdGl2ZTogUkVsZW1lbnQpOiBMQ29udGV4dCB7XG4gIHJldHVybiB7XG4gICAgbFZpZXdEYXRhLFxuICAgIG5vZGVJbmRleDogbE5vZGVJbmRleCwgbmF0aXZlLFxuICAgIGNvbXBvbmVudDogdW5kZWZpbmVkLFxuICAgIGRpcmVjdGl2ZXM6IHVuZGVmaW5lZCxcbiAgICBsb2NhbFJlZnM6IHVuZGVmaW5lZCxcbiAgfTtcbn1cblxuLyoqXG4gKiBBIHNpbXBsaWZpZWQgbG9va3VwIGZ1bmN0aW9uIGZvciBmaW5kaW5nIHRoZSBMRWxlbWVudE5vZGUgZnJvbSBhIGNvbXBvbmVudCBpbnN0YW5jZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGV4aXN0cyBmb3IgdHJlZS1zaGFraW5nIHB1cnBvc2VzIHRvIGF2b2lkIGhhdmluZyB0byBwdWxsIGluIGV2ZXJ5dGhpbmdcbiAqIHRoYXQgYGdldENvbnRleHRgIGhhcyBpbiB0aGUgZXZlbnQgdGhhdCBhbiBBbmd1bGFyIGFwcGxpY2F0aW9uIGRvZXNuJ3QgbmVlZCB0byBoYXZlXG4gKiBhbnkgcHJvZ3JhbW1hdGljIGFjY2VzcyB0byBhbiBlbGVtZW50J3MgY29udGV4dCAob25seSBjaGFuZ2UgZGV0ZWN0aW9uIHVzZXMgdGhpcyBmdW5jdGlvbikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMRWxlbWVudEZyb21Db21wb25lbnQoY29tcG9uZW50SW5zdGFuY2U6IHt9KTogTEVsZW1lbnROb2RlIHtcbiAgbGV0IGxWaWV3RGF0YSA9IHJlYWRQYXRjaGVkRGF0YShjb21wb25lbnRJbnN0YW5jZSk7XG4gIGxldCBsTm9kZTogTEVsZW1lbnROb2RlO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KGxWaWV3RGF0YSkpIHtcbiAgICBjb25zdCBsTm9kZUluZGV4ID0gZmluZFZpYUNvbXBvbmVudChsVmlld0RhdGEsIGNvbXBvbmVudEluc3RhbmNlKTtcbiAgICBsTm9kZSA9IHJlYWRFbGVtZW50VmFsdWUobFZpZXdEYXRhW2xOb2RlSW5kZXhdKTtcbiAgICBjb25zdCBjb250ZXh0ID0gY3JlYXRlTENvbnRleHQobFZpZXdEYXRhLCBsTm9kZUluZGV4LCBsTm9kZS5uYXRpdmUpO1xuICAgIGNvbnRleHQuY29tcG9uZW50ID0gY29tcG9uZW50SW5zdGFuY2U7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKGNvbXBvbmVudEluc3RhbmNlLCBjb250ZXh0KTtcbiAgICBhdHRhY2hQYXRjaERhdGEoY29udGV4dC5uYXRpdmUsIGNvbnRleHQpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGNvbnRleHQgPSBsVmlld0RhdGEgYXMgYW55IGFzIExDb250ZXh0O1xuICAgIGxOb2RlID0gcmVhZEVsZW1lbnRWYWx1ZShjb250ZXh0LmxWaWV3RGF0YVtjb250ZXh0Lm5vZGVJbmRleF0pO1xuICB9XG5cbiAgcmV0dXJuIGxOb2RlO1xufVxuXG4vKipcbiAqIEFzc2lnbnMgdGhlIGdpdmVuIGRhdGEgdG8gdGhlIGdpdmVuIHRhcmdldCAod2hpY2ggY291bGQgYmUgYSBjb21wb25lbnQsXG4gKiBkaXJlY3RpdmUgb3IgRE9NIG5vZGUgaW5zdGFuY2UpIHVzaW5nIG1vbmtleS1wYXRjaGluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaFBhdGNoRGF0YSh0YXJnZXQ6IGFueSwgZGF0YTogTFZpZXdEYXRhIHwgTENvbnRleHQpIHtcbiAgdGFyZ2V0W01PTktFWV9QQVRDSF9LRVlfTkFNRV0gPSBkYXRhO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIG1vbmtleS1wYXRjaCB2YWx1ZSBkYXRhIHByZXNlbnQgb24gdGhlIHRhcmdldCAod2hpY2ggY291bGQgYmVcbiAqIGEgY29tcG9uZW50LCBkaXJlY3RpdmUgb3IgYSBET00gbm9kZSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkUGF0Y2hlZERhdGEodGFyZ2V0OiBhbnkpOiBMVmlld0RhdGF8TENvbnRleHR8bnVsbCB7XG4gIHJldHVybiB0YXJnZXRbTU9OS0VZX1BBVENIX0tFWV9OQU1FXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRQYXRjaGVkTFZpZXdEYXRhKHRhcmdldDogYW55KTogTFZpZXdEYXRhfG51bGwge1xuICBjb25zdCB2YWx1ZSA9IHJlYWRQYXRjaGVkRGF0YSh0YXJnZXQpO1xuICBpZiAodmFsdWUpIHtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyB2YWx1ZSA6ICh2YWx1ZSBhcyBMQ29udGV4dCkubFZpZXdEYXRhO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb21wb25lbnRJbnN0YW5jZShpbnN0YW5jZTogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiBpbnN0YW5jZSAmJiBpbnN0YW5jZS5jb25zdHJ1Y3RvciAmJiBpbnN0YW5jZS5jb25zdHJ1Y3Rvci5uZ0NvbXBvbmVudERlZjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRGlyZWN0aXZlSW5zdGFuY2UoaW5zdGFuY2U6IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gaW5zdGFuY2UgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IubmdEaXJlY3RpdmVEZWY7XG59XG5cbi8qKlxuICogTG9jYXRlcyB0aGUgZWxlbWVudCB3aXRoaW4gdGhlIGdpdmVuIExWaWV3RGF0YSBhbmQgcmV0dXJucyB0aGUgbWF0Y2hpbmcgaW5kZXhcbiAqL1xuZnVuY3Rpb24gZmluZFZpYU5hdGl2ZUVsZW1lbnQobFZpZXdEYXRhOiBMVmlld0RhdGEsIG5hdGl2ZTogUkVsZW1lbnQpOiBudW1iZXIge1xuICBsZXQgdE5vZGUgPSBsVmlld0RhdGFbVFZJRVddLmZpcnN0Q2hpbGQ7XG4gIHdoaWxlICh0Tm9kZSkge1xuICAgIGNvbnN0IGxOb2RlID0gZ2V0TE5vZGVGcm9tVmlld0RhdGEobFZpZXdEYXRhLCB0Tm9kZS5pbmRleCkgITtcbiAgICBpZiAobE5vZGUubmF0aXZlID09PSBuYXRpdmUpIHtcbiAgICAgIHJldHVybiB0Tm9kZS5pbmRleDtcbiAgICB9XG4gICAgdE5vZGUgPSB0cmF2ZXJzZU5leHRFbGVtZW50KHROb2RlKTtcbiAgfVxuXG4gIHJldHVybiAtMTtcbn1cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBuZXh0IHROb2RlIChjaGlsZCwgc2libGluZyBvciBwYXJlbnQpLlxuICovXG5mdW5jdGlvbiB0cmF2ZXJzZU5leHRFbGVtZW50KHROb2RlOiBUTm9kZSk6IFROb2RlfG51bGwge1xuICBpZiAodE5vZGUuY2hpbGQpIHtcbiAgICByZXR1cm4gdE5vZGUuY2hpbGQ7XG4gIH0gZWxzZSBpZiAodE5vZGUubmV4dCkge1xuICAgIHJldHVybiB0Tm9kZS5uZXh0O1xuICB9IGVsc2UgaWYgKHROb2RlLnBhcmVudCkge1xuICAgIHJldHVybiB0Tm9kZS5wYXJlbnQubmV4dCB8fCBudWxsO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGNvbXBvbmVudCB3aXRoaW4gdGhlIGdpdmVuIExWaWV3RGF0YSBhbmQgcmV0dXJucyB0aGUgbWF0Y2hpbmcgaW5kZXhcbiAqL1xuZnVuY3Rpb24gZmluZFZpYUNvbXBvbmVudChsVmlld0RhdGE6IExWaWV3RGF0YSwgY29tcG9uZW50SW5zdGFuY2U6IHt9KTogbnVtYmVyIHtcbiAgY29uc3QgY29tcG9uZW50SW5kaWNlcyA9IGxWaWV3RGF0YVtUVklFV10uY29tcG9uZW50cztcbiAgaWYgKGNvbXBvbmVudEluZGljZXMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudEluZGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVsZW1lbnRDb21wb25lbnRJbmRleCA9IGNvbXBvbmVudEluZGljZXNbaV07XG4gICAgICBjb25zdCBsTm9kZURhdGEgPSByZWFkRWxlbWVudFZhbHVlKGxWaWV3RGF0YVtlbGVtZW50Q29tcG9uZW50SW5kZXhdICEpLmRhdGEgITtcbiAgICAgIGlmIChsTm9kZURhdGFbQ09OVEVYVF0gPT09IGNvbXBvbmVudEluc3RhbmNlKSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50Q29tcG9uZW50SW5kZXg7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHJvb3ROb2RlID0gbFZpZXdEYXRhW0hFQURFUl9PRkZTRVRdO1xuICAgIGNvbnN0IHJvb3RDb21wb25lbnQgPSByb290Tm9kZS5kYXRhW0NPTlRFWFRdO1xuICAgIGlmIChyb290Q29tcG9uZW50ID09PSBjb21wb25lbnRJbnN0YW5jZSkge1xuICAgICAgLy8gd2UgYXJlIGRlYWxpbmcgd2l0aCB0aGUgcm9vdCBlbGVtZW50IGhlcmUgdGhlcmVmb3JlIHdlIGtub3cgdGhhdCB0aGVcbiAgICAgIC8vIGVsZW1lbnQgaXMgdGhlIHZlcnkgZmlyc3QgZWxlbWVudCBhZnRlciB0aGUgSEVBREVSIGRhdGEgaW4gdGhlIGxWaWV3XG4gICAgICByZXR1cm4gSEVBREVSX09GRlNFVDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGRpcmVjdGl2ZSB3aXRoaW4gdGhlIGdpdmVuIExWaWV3RGF0YSBhbmQgcmV0dXJucyB0aGUgbWF0Y2hpbmcgaW5kZXhcbiAqL1xuZnVuY3Rpb24gZmluZFZpYURpcmVjdGl2ZShsVmlld0RhdGE6IExWaWV3RGF0YSwgZGlyZWN0aXZlSW5zdGFuY2U6IHt9KTogbnVtYmVyIHtcbiAgLy8gaWYgYSBkaXJlY3RpdmUgaXMgbW9ua2V5IHBhdGNoZWQgdGhlbiBpdCB3aWxsIChieSBkZWZhdWx0KVxuICAvLyBoYXZlIGEgcmVmZXJlbmNlIHRvIHRoZSBMVmlld0RhdGEgb2YgdGhlIGN1cnJlbnQgdmlldy4gVGhlXG4gIC8vIGVsZW1lbnQgYm91bmQgdG8gdGhlIGRpcmVjdGl2ZSBiZWluZyBzZWFyY2ggbGl2ZXMgc29tZXdoZXJlXG4gIC8vIGluIHRoZSB2aWV3IGRhdGEuIFdlIGxvb3AgdGhyb3VnaCB0aGUgbm9kZXMgYW5kIGNoZWNrIHRoZWlyXG4gIC8vIGxpc3Qgb2YgZGlyZWN0aXZlcyBmb3IgdGhlIGluc3RhbmNlLlxuICBsZXQgdE5vZGUgPSBsVmlld0RhdGFbVFZJRVddLmZpcnN0Q2hpbGQ7XG4gIHdoaWxlICh0Tm9kZSkge1xuICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4U3RhcnQgPSBnZXREaXJlY3RpdmVTdGFydEluZGV4KHROb2RlKTtcbiAgICBjb25zdCBkaXJlY3RpdmVJbmRleEVuZCA9IGdldERpcmVjdGl2ZUVuZEluZGV4KHROb2RlLCBkaXJlY3RpdmVJbmRleFN0YXJ0KTtcbiAgICBmb3IgKGxldCBpID0gZGlyZWN0aXZlSW5kZXhTdGFydDsgaSA8IGRpcmVjdGl2ZUluZGV4RW5kOyBpKyspIHtcbiAgICAgIGlmIChsVmlld0RhdGFbaV0gPT09IGRpcmVjdGl2ZUluc3RhbmNlKSB7XG4gICAgICAgIHJldHVybiB0Tm9kZS5pbmRleDtcbiAgICAgIH1cbiAgICB9XG4gICAgdE5vZGUgPSB0cmF2ZXJzZU5leHRFbGVtZW50KHROb2RlKTtcbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbmZ1bmN0aW9uIGFzc2VydERvbUVsZW1lbnQoZWxlbWVudDogYW55KSB7XG4gIGFzc2VydEVxdWFsKGVsZW1lbnQubm9kZVR5cGUsIDEsICdUaGUgcHJvdmlkZWQgdmFsdWUgbXVzdCBiZSBhbiBpbnN0YW5jZSBvZiBhbiBIVE1MRWxlbWVudCcpO1xufVxuXG4vKipcbiAqIFJldHJ1bnMgdGhlIGluc3RhbmNlIG9mIHRoZSBMRWxlbWVudE5vZGUgYXQgdGhlIGdpdmVuIGluZGV4IGluIHRoZSBMVmlld0RhdGEuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGFsc28gdW53cmFwIHRoZSBpbm5lciB2YWx1ZSBpbmNhc2UgaXQncyBzdHVmZmVkIGludG8gYW5cbiAqIGFycmF5ICh3aGljaCBpcyB3aGF0IGhhcHBlbnMgd2hlbiBbc3R5bGVdIGFuZCBbY2xhc3NdIGJpbmRpbmdzIGFyZSBwcmVzZW50XG4gKiBpbiB0aGUgdmlldyBpbnN0cnVjdGlvbnMgZm9yIHRoZSBlbGVtZW50IGJlaW5nIHJldHVybmVkKS5cbiAqL1xuZnVuY3Rpb24gZ2V0TE5vZGVGcm9tVmlld0RhdGEobFZpZXdEYXRhOiBMVmlld0RhdGEsIGxFbGVtZW50SW5kZXg6IG51bWJlcik6IExFbGVtZW50Tm9kZXxudWxsIHtcbiAgY29uc3QgdmFsdWUgPSBsVmlld0RhdGFbbEVsZW1lbnRJbmRleF07XG4gIHJldHVybiB2YWx1ZSA/IHJlYWRFbGVtZW50VmFsdWUodmFsdWUpIDogbnVsbDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbGlzdCBvZiBkaXJlY3RpdmVzIGV4dHJhY3RlZCBmcm9tIHRoZSBnaXZlbiB2aWV3IGJhc2VkIG9uIHRoZVxuICogcHJvdmlkZWQgbGlzdCBvZiBkaXJlY3RpdmUgaW5kZXggdmFsdWVzLlxuICpcbiAqIEBwYXJhbSBub2RlSW5kZXggVGhlIG5vZGUgaW5kZXhcbiAqIEBwYXJhbSBsVmlld0RhdGEgVGhlIHRhcmdldCB2aWV3IGRhdGFcbiAqIEBwYXJhbSBpbmNsdWRlQ29tcG9uZW50cyBXaGV0aGVyIG9yIG5vdCB0byBpbmNsdWRlIGNvbXBvbmVudHMgaW4gcmV0dXJuZWQgZGlyZWN0aXZlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlzY292ZXJEaXJlY3RpdmVzKFxuICAgIG5vZGVJbmRleDogbnVtYmVyLCBsVmlld0RhdGE6IExWaWV3RGF0YSwgaW5jbHVkZUNvbXBvbmVudHM6IGJvb2xlYW4pOiBhbnlbXXxudWxsIHtcbiAgY29uc3QgdE5vZGUgPSBsVmlld0RhdGFbVFZJRVddLmRhdGFbbm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgbGV0IGRpcmVjdGl2ZVN0YXJ0SW5kZXggPSBnZXREaXJlY3RpdmVTdGFydEluZGV4KHROb2RlKTtcbiAgY29uc3QgZGlyZWN0aXZlRW5kSW5kZXggPSBnZXREaXJlY3RpdmVFbmRJbmRleCh0Tm9kZSwgZGlyZWN0aXZlU3RhcnRJbmRleCk7XG4gIGlmICghaW5jbHVkZUNvbXBvbmVudHMgJiYgdE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50KSBkaXJlY3RpdmVTdGFydEluZGV4Kys7XG4gIHJldHVybiBsVmlld0RhdGEuc2xpY2UoZGlyZWN0aXZlU3RhcnRJbmRleCwgZGlyZWN0aXZlRW5kSW5kZXgpO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBtYXAgb2YgbG9jYWwgcmVmZXJlbmNlcyAobG9jYWwgcmVmZXJlbmNlIG5hbWUgPT4gZWxlbWVudCBvciBkaXJlY3RpdmUgaW5zdGFuY2UpIHRoYXRcbiAqIGV4aXN0IG9uIGEgZ2l2ZW4gZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpc2NvdmVyTG9jYWxSZWZzKGxWaWV3RGF0YTogTFZpZXdEYXRhLCBsTm9kZUluZGV4OiBudW1iZXIpOiB7W2tleTogc3RyaW5nXTogYW55fXxcbiAgICBudWxsIHtcbiAgY29uc3QgdE5vZGUgPSBsVmlld0RhdGFbVFZJRVddLmRhdGFbbE5vZGVJbmRleF0gYXMgVE5vZGU7XG4gIGlmICh0Tm9kZSAmJiB0Tm9kZS5sb2NhbE5hbWVzKSB7XG4gICAgY29uc3QgcmVzdWx0OiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdE5vZGUubG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgbG9jYWxSZWZOYW1lID0gdE5vZGUubG9jYWxOYW1lc1tpXTtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gdE5vZGUubG9jYWxOYW1lc1tpICsgMV0gYXMgbnVtYmVyO1xuICAgICAgcmVzdWx0W2xvY2FsUmVmTmFtZV0gPSBkaXJlY3RpdmVJbmRleCA9PT0gLTEgP1xuICAgICAgICAgIGdldExOb2RlRnJvbVZpZXdEYXRhKGxWaWV3RGF0YSwgbE5vZGVJbmRleCkgIS5uYXRpdmUgOlxuICAgICAgICAgIGxWaWV3RGF0YVtkaXJlY3RpdmVJbmRleF07XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gZ2V0RGlyZWN0aXZlU3RhcnRJbmRleCh0Tm9kZTogVE5vZGUpOiBudW1iZXIge1xuICAvLyB0aGUgdE5vZGUgaW5zdGFuY2VzIHN0b3JlIGEgZmxhZyB2YWx1ZSB3aGljaCB0aGVuIGhhcyBhXG4gIC8vIHBvaW50ZXIgd2hpY2ggdGVsbHMgdGhlIHN0YXJ0aW5nIGluZGV4IG9mIHdoZXJlIGFsbCB0aGVcbiAgLy8gYWN0aXZlIGRpcmVjdGl2ZXMgYXJlIGluIHRoZSBtYXN0ZXIgZGlyZWN0aXZlIGFycmF5XG4gIHJldHVybiB0Tm9kZS5mbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbn1cblxuZnVuY3Rpb24gZ2V0RGlyZWN0aXZlRW5kSW5kZXgodE5vZGU6IFROb2RlLCBzdGFydEluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICAvLyBUaGUgZW5kIHZhbHVlIGlzIGFsc28gYSBwYXJ0IG9mIHRoZSBzYW1lIGZsYWdcbiAgLy8gKHNlZSBgVE5vZGVGbGFnc2AgdG8gc2VlIGhvdyB0aGUgZmxhZyBiaXQgc2hpZnRpbmdcbiAgLy8gdmFsdWVzIGFyZSB1c2VkKS5cbiAgY29uc3QgY291bnQgPSB0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuICByZXR1cm4gY291bnQgPyAoc3RhcnRJbmRleCArIGNvdW50KSA6IC0xO1xufVxuXG4vKipcbiAqIFRha2VzIHRoZSB2YWx1ZSBvZiBhIHNsb3QgaW4gYExWaWV3RGF0YWAgYW5kIHJldHVybnMgdGhlIGVsZW1lbnQgbm9kZS5cbiAqXG4gKiBOb3JtYWxseSwgZWxlbWVudCBub2RlcyBhcmUgc3RvcmVkIGZsYXQsIGJ1dCBpZiB0aGUgbm9kZSBoYXMgc3R5bGVzL2NsYXNzZXMgb24gaXQsXG4gKiBpdCBtaWdodCBiZSB3cmFwcGVkIGluIGEgc3R5bGluZyBjb250ZXh0LiBPciBpZiB0aGF0IG5vZGUgaGFzIGEgZGlyZWN0aXZlIHRoYXQgaW5qZWN0c1xuICogVmlld0NvbnRhaW5lclJlZiwgaXQgbWF5IGJlIHdyYXBwZWQgaW4gYW4gTENvbnRhaW5lci5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgVGhlIGluaXRpYWwgdmFsdWUgaW4gYExWaWV3RGF0YWBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRFbGVtZW50VmFsdWUodmFsdWU6IExFbGVtZW50Tm9kZSB8IFN0eWxpbmdDb250ZXh0IHwgTENvbnRhaW5lcik6IExFbGVtZW50Tm9kZSB7XG4gIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWVbQUNUSVZFX0lOREVYXSA9PT0gJ251bWJlcicpIHtcbiAgICAgIC8vIFRoaXMgaXMgYW4gTENvbnRhaW5lci4gSXQgbWF5IGFsc28gaGF2ZSBhIHN0eWxpbmcgY29udGV4dC5cbiAgICAgIHZhbHVlID0gdmFsdWVbSE9TVF9OQVRJVkVdIGFzIExFbGVtZW50Tm9kZSB8IFN0eWxpbmdDb250ZXh0O1xuICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWVbU3R5bGluZ0luZGV4LkVsZW1lbnRQb3NpdGlvbl0gISA6IHZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUaGlzIGlzIGEgU3R5bGluZ0NvbnRleHQsIHdoaWNoIHN0b3JlcyB0aGUgZWxlbWVudCBub2RlIGF0IDAuXG4gICAgICByZXR1cm4gdmFsdWVbU3R5bGluZ0luZGV4LkVsZW1lbnRQb3NpdGlvbl0gYXMgTEVsZW1lbnROb2RlO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdmFsdWU7ICAvLyBSZWd1bGFyIExOb2RlIGlzIHN0b3JlZCBoZXJlXG4gIH1cbn1cbiJdfQ==