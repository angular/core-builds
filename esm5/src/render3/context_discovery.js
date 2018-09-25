/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import './ng_dev_mode';
import { assertEqual } from './assert';
import { CONTEXT, DIRECTIVES, HEADER_OFFSET, TVIEW } from './interfaces/view';
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
            var lNodeIndex = void 0;
            var component = undefined;
            var directiveIndices = undefined;
            var directives = undefined;
            if (isComponentInstance(target)) {
                lNodeIndex = findViaComponent(lViewData, target);
                if (lNodeIndex == -1) {
                    throw new Error('The provided component was not found in the application');
                }
                component = target;
            }
            else if (isDirectiveInstance(target)) {
                lNodeIndex = findViaDirective(lViewData, target);
                if (lNodeIndex == -1) {
                    throw new Error('The provided directive was not found in the application');
                }
                directiveIndices = discoverDirectiveIndices(lViewData, lNodeIndex);
                directives = directiveIndices ? discoverDirectives(lViewData, directiveIndices) : null;
            }
            else {
                lNodeIndex = findViaNativeElement(lViewData, target);
                if (lNodeIndex == -1) {
                    return null;
                }
            }
            // the goal is not to fill the entire context full of data because the lookups
            // are expensive. Instead, only the target data (the element, compontent or
            // directive details) are filled into the context. If called multiple times
            // with different target values then the missing target data will be filled in.
            var lNode = getLNodeFromViewData(lViewData, lNodeIndex);
            var existingCtx = readPatchedData(lNode.native);
            var context = (existingCtx && !Array.isArray(existingCtx)) ?
                existingCtx :
                createLContext(lViewData, lNodeIndex, lNode.native);
            // only when the component has been discovered then update the monkey-patch
            if (component && context.component === undefined) {
                context.component = component;
                attachPatchData(context.component, context);
            }
            // only when the directives have been discovered then update the monkey-patch
            if (directives && directiveIndices && context.directives === undefined) {
                context.directiveIndices = directiveIndices;
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
        lNodeIndex: lNodeIndex,
        native: native,
        component: undefined,
        directiveIndices: undefined,
        directives: undefined,
    };
}
/**
 * A utility function for retrieving the matching lElementNode
 * from a given DOM element, component or directive.
 */
export function getLElementNode(target) {
    var context = getContext(target);
    return context ? getLNodeFromViewData(context.lViewData, context.lNodeIndex) : null;
}
export function getLElementFromRootComponent(rootComponentInstance) {
    // the host element for the root component is ALWAYS the first element
    // in the lViewData array (which is where HEADER_OFFSET points to)
    var lViewData = readPatchedLViewData(rootComponentInstance);
    return readElementValue(lViewData[HEADER_OFFSET]);
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
        lNode = readElementValue(context.lViewData[context.lNodeIndex]);
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
    // in the view data. By first checking to see if the instance
    // is actually present we can narrow down to which lElementNode
    // contains the instance of the directive and then return the index
    var directivesAcrossView = lViewData[DIRECTIVES];
    var directiveIndex = directivesAcrossView ? directivesAcrossView.indexOf(directiveInstance) : -1;
    if (directiveIndex >= 0) {
        var tNode = lViewData[TVIEW].firstChild;
        while (tNode) {
            var directiveIndexStart = getDirectiveStartIndex(tNode);
            var directiveIndexEnd = getDirectiveEndIndex(tNode, directiveIndexStart);
            if (directiveIndex >= directiveIndexStart && directiveIndex < directiveIndexEnd) {
                return tNode.index;
            }
            tNode = traverseNextElement(tNode);
        }
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
 * Returns a collection of directive index values that are used on the element
 * (which is referenced by the lNodeIndex)
 */
export function discoverDirectiveIndices(lViewData, lNodeIndex, includeComponents) {
    var directivesAcrossView = lViewData[DIRECTIVES];
    var tNode = lViewData[TVIEW].data[lNodeIndex];
    if (directivesAcrossView && directivesAcrossView.length) {
        // this check for tNode is to determine if the value is a LElementNode instance
        var directiveIndexStart = getDirectiveStartIndex(tNode);
        var directiveIndexEnd = getDirectiveEndIndex(tNode, directiveIndexStart);
        var directiveIndices = [];
        for (var i = directiveIndexStart; i < directiveIndexEnd; i++) {
            // special case since the instance of the component (if it exists)
            // is stored in the directives array.
            if (i > directiveIndexStart ||
                !isComponentInstance(directivesAcrossView[directiveIndexStart])) {
                directiveIndices.push(i);
            }
        }
        return directiveIndices.length ? directiveIndices : null;
    }
    return null;
}
/**
 * Returns a list of directives extracted from the given view based on the
 * provided list of directive index values.
 *
 * @param lViewData The target view data
 * @param indices A collection of directive index values which will be used to
 *    figure out the directive instances
 */
export function discoverDirectives(lViewData, indices) {
    var directives = [];
    var directiveInstances = lViewData[DIRECTIVES];
    if (directiveInstances) {
        for (var i = 0; i < indices.length; i++) {
            var directiveIndex = indices[i];
            var directive = directiveInstances[directiveIndex];
            directives.push(directive);
        }
    }
    return directives;
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
export function readElementValue(value) {
    return (Array.isArray(value) ? value[0] : value);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9kaXNjb3ZlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2NvbnRleHRfZGlzY292ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFHckMsT0FBTyxFQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsYUFBYSxFQUFhLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRXZGOztHQUVHO0FBQ0gsTUFBTSxDQUFDLElBQU0scUJBQXFCLEdBQUcsZUFBZSxDQUFDO0FBZ0NyRDs7Ozs7Ozs7Ozs7Ozs7OztHQWdCRztBQUNILE1BQU0sVUFBVSxVQUFVLENBQUMsTUFBVztJQUNwQyxJQUFJLE9BQU8sR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdEMsSUFBSSxPQUFPLEVBQUU7UUFDWCxpRUFBaUU7UUFDakUsOERBQThEO1FBQzlELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUMxQixJQUFNLFNBQVMsR0FBYyxPQUFTLENBQUM7WUFDdkMsSUFBSSxVQUFVLFNBQVEsQ0FBQztZQUN2QixJQUFJLFNBQVMsR0FBUSxTQUFTLENBQUM7WUFDL0IsSUFBSSxnQkFBZ0IsR0FBNEIsU0FBUyxDQUFDO1lBQzFELElBQUksVUFBVSxHQUF5QixTQUFTLENBQUM7WUFFakQsSUFBSSxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDL0IsVUFBVSxHQUFHLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDakQsSUFBSSxVQUFVLElBQUksQ0FBQyxDQUFDLEVBQUU7b0JBQ3BCLE1BQU0sSUFBSSxLQUFLLENBQUMseURBQXlELENBQUMsQ0FBQztp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ICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCAnLi9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7YXNzZXJ0RXF1YWx9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7TEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Q09OVEVYVCwgRElSRUNUSVZFUywgSEVBREVSX09GRlNFVCwgTFZpZXdEYXRhLCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuXG4vKipcbiAqIFRoaXMgcHJvcGVydHkgd2lsbCBiZSBtb25rZXktcGF0Y2hlZCBvbiBlbGVtZW50cywgY29tcG9uZW50cyBhbmQgZGlyZWN0aXZlc1xuICovXG5leHBvcnQgY29uc3QgTU9OS0VZX1BBVENIX0tFWV9OQU1FID0gJ19fbmdDb250ZXh0X18nO1xuXG4vKipcbiAqIFRoZSBpbnRlcm5hbCB2aWV3IGNvbnRleHQgd2hpY2ggaXMgc3BlY2lmaWMgdG8gYSBnaXZlbiBET00gZWxlbWVudCwgZGlyZWN0aXZlIG9yXG4gKiBjb21wb25lbnQgaW5zdGFuY2UuIEVhY2ggdmFsdWUgaW4gaGVyZSAoYmVzaWRlcyB0aGUgTFZpZXdEYXRhIGFuZCBlbGVtZW50IG5vZGUgZGV0YWlscylcbiAqIGNhbiBiZSBwcmVzZW50LCBudWxsIG9yIHVuZGVmaW5lZC4gSWYgdW5kZWZpbmVkIHRoZW4gaXQgaW1wbGllcyB0aGUgdmFsdWUgaGFzIG5vdCBiZWVuXG4gKiBsb29rZWQgdXAgeWV0LCBvdGhlcndpc2UsIGlmIG51bGwsIHRoZW4gYSBsb29rdXAgd2FzIGV4ZWN1dGVkIGFuZCBub3RoaW5nIHdhcyBmb3VuZC5cbiAqXG4gKiBFYWNoIHZhbHVlIHdpbGwgZ2V0IGZpbGxlZCB3aGVuIHRoZSByZXNwZWN0aXZlIHZhbHVlIGlzIGV4YW1pbmVkIHdpdGhpbiB0aGUgZ2V0Q29udGV4dFxuICogZnVuY3Rpb24uIFRoZSBjb21wb25lbnQsIGVsZW1lbnQgYW5kIGVhY2ggZGlyZWN0aXZlIGluc3RhbmNlIHdpbGwgc2hhcmUgdGhlIHNhbWUgaW5zdGFuY2VcbiAqIG9mIHRoZSBjb250ZXh0LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIExDb250ZXh0IHtcbiAgLyoqIFRoZSBjb21wb25lbnQncyBwYXJlbnQgdmlldyBkYXRhICovXG4gIGxWaWV3RGF0YTogTFZpZXdEYXRhO1xuXG4gIC8qKiBUaGUgaW5kZXggaW5zdGFuY2Ugb2YgdGhlIExOb2RlICovXG4gIGxOb2RlSW5kZXg6IG51bWJlcjtcblxuICAvKiogVGhlIGluc3RhbmNlIG9mIHRoZSBET00gbm9kZSB0aGF0IGlzIGF0dGFjaGVkIHRvIHRoZSBsTm9kZSAqL1xuICBuYXRpdmU6IFJFbGVtZW50O1xuXG4gIC8qKiBUaGUgaW5zdGFuY2Ugb2YgdGhlIENvbXBvbmVudCBub2RlICovXG4gIGNvbXBvbmVudDoge318bnVsbHx1bmRlZmluZWQ7XG5cbiAgLyoqIFRoZSBsaXN0IG9mIGluZGljZXMgZm9yIHRoZSBhY3RpdmUgZGlyZWN0aXZlcyB0aGF0IGV4aXN0IG9uIHRoaXMgZWxlbWVudCAqL1xuICBkaXJlY3RpdmVJbmRpY2VzOiBudW1iZXJbXXxudWxsfHVuZGVmaW5lZDtcblxuICAvKiogVGhlIGxpc3Qgb2YgYWN0aXZlIGRpcmVjdGl2ZXMgdGhhdCBleGlzdCBvbiB0aGlzIGVsZW1lbnQgKi9cbiAgZGlyZWN0aXZlczogQXJyYXk8e30+fG51bGx8dW5kZWZpbmVkO1xufVxuXG4vKiogUmV0dXJucyB0aGUgbWF0Y2hpbmcgYExDb250ZXh0YCBkYXRhIGZvciBhIGdpdmVuIERPTSBub2RlLCBkaXJlY3RpdmUgb3IgY29tcG9uZW50IGluc3RhbmNlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBleGFtaW5lIHRoZSBwcm92aWRlZCBET00gZWxlbWVudCwgY29tcG9uZW50LCBvciBkaXJlY3RpdmUgaW5zdGFuY2VcXCdzXG4gKiBtb25rZXktcGF0Y2hlZCBwcm9wZXJ0eSB0byBkZXJpdmUgdGhlIGBMQ29udGV4dGAgZGF0YS4gT25jZSBjYWxsZWQgdGhlbiB0aGUgbW9ua2V5LXBhdGNoZWRcbiAqIHZhbHVlIHdpbGwgYmUgdGhhdCBvZiB0aGUgbmV3bHkgY3JlYXRlZCBgTENvbnRleHRgLlxuICpcbiAqIElmIHRoZSBtb25rZXktcGF0Y2hlZCB2YWx1ZSBpcyB0aGUgYExWaWV3RGF0YWAgaW5zdGFuY2UgdGhlbiB0aGUgY29udGV4dCB2YWx1ZSBmb3IgdGhhdFxuICogdGFyZ2V0IHdpbGwgYmUgY3JlYXRlZCBhbmQgdGhlIG1vbmtleS1wYXRjaCByZWZlcmVuY2Ugd2lsbCBiZSB1cGRhdGVkLiBUaGVyZWZvcmUgd2hlbiB0aGlzXG4gKiBmdW5jdGlvbiBpcyBjYWxsZWQgaXQgbWF5IG11dGF0ZSB0aGUgcHJvdmlkZWQgZWxlbWVudFxcJ3MsIGNvbXBvbmVudFxcJ3Mgb3IgYW55IG9mIHRoZSBhc3NvY2lhdGVkXG4gKiBkaXJlY3RpdmVcXCdzIG1vbmtleS1wYXRjaCB2YWx1ZXMuXG4gKlxuICogSWYgdGhlIG1vbmtleS1wYXRjaCB2YWx1ZSBpcyBub3QgZGV0ZWN0ZWQgdGhlbiB0aGUgY29kZSB3aWxsIHdhbGsgdXAgdGhlIERPTSB1bnRpbCBhbiBlbGVtZW50XG4gKiBpcyBmb3VuZCB3aGljaCBjb250YWlucyBhIG1vbmtleS1wYXRjaCByZWZlcmVuY2UuIFdoZW4gdGhhdCBvY2N1cnMgdGhlbiB0aGUgcHJvdmlkZWQgZWxlbWVudFxuICogd2lsbCBiZSB1cGRhdGVkIHdpdGggYSBuZXcgY29udGV4dCAod2hpY2ggaXMgdGhlbiByZXR1cm5lZCkuIElmIHRoZSBtb25rZXktcGF0Y2ggdmFsdWUgaXMgbm90XG4gKiBkZXRlY3RlZCBmb3IgYSBjb21wb25lbnQvZGlyZWN0aXZlIGluc3RhbmNlIHRoZW4gaXQgd2lsbCB0aHJvdyBhbiBlcnJvciAoYWxsIGNvbXBvbmVudHMgYW5kXG4gKiBkaXJlY3RpdmVzIHNob3VsZCBiZSBhdXRvbWF0aWNhbGx5IG1vbmtleS1wYXRjaGVkIGJ5IGl2eSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb250ZXh0KHRhcmdldDogYW55KTogTENvbnRleHR8bnVsbCB7XG4gIGxldCBtcFZhbHVlID0gcmVhZFBhdGNoZWREYXRhKHRhcmdldCk7XG4gIGlmIChtcFZhbHVlKSB7XG4gICAgLy8gb25seSB3aGVuIGl0J3MgYW4gYXJyYXkgaXMgaXQgY29uc2lkZXJlZCBhbiBMVmlld0RhdGEgaW5zdGFuY2VcbiAgICAvLyAuLi4gb3RoZXJ3aXNlIGl0J3MgYW4gYWxyZWFkeSBjb25zdHJ1Y3RlZCBMQ29udGV4dCBpbnN0YW5jZVxuICAgIGlmIChBcnJheS5pc0FycmF5KG1wVmFsdWUpKSB7XG4gICAgICBjb25zdCBsVmlld0RhdGE6IExWaWV3RGF0YSA9IG1wVmFsdWUgITtcbiAgICAgIGxldCBsTm9kZUluZGV4OiBudW1iZXI7XG4gICAgICBsZXQgY29tcG9uZW50OiBhbnkgPSB1bmRlZmluZWQ7XG4gICAgICBsZXQgZGlyZWN0aXZlSW5kaWNlczogbnVtYmVyW118bnVsbHx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICBsZXQgZGlyZWN0aXZlczogYW55W118bnVsbHx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgICAgIGlmIChpc0NvbXBvbmVudEluc3RhbmNlKHRhcmdldCkpIHtcbiAgICAgICAgbE5vZGVJbmRleCA9IGZpbmRWaWFDb21wb25lbnQobFZpZXdEYXRhLCB0YXJnZXQpO1xuICAgICAgICBpZiAobE5vZGVJbmRleCA9PSAtMSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHByb3ZpZGVkIGNvbXBvbmVudCB3YXMgbm90IGZvdW5kIGluIHRoZSBhcHBsaWNhdGlvbicpO1xuICAgICAgICB9XG4gICAgICAgIGNvbXBvbmVudCA9IHRhcmdldDtcbiAgICAgIH0gZWxzZSBpZiAoaXNEaXJlY3RpdmVJbnN0YW5jZSh0YXJnZXQpKSB7XG4gICAgICAgIGxOb2RlSW5kZXggPSBmaW5kVmlhRGlyZWN0aXZlKGxWaWV3RGF0YSwgdGFyZ2V0KTtcbiAgICAgICAgaWYgKGxOb2RlSW5kZXggPT0gLTEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBwcm92aWRlZCBkaXJlY3RpdmUgd2FzIG5vdCBmb3VuZCBpbiB0aGUgYXBwbGljYXRpb24nKTtcbiAgICAgICAgfVxuICAgICAgICBkaXJlY3RpdmVJbmRpY2VzID0gZGlzY292ZXJEaXJlY3RpdmVJbmRpY2VzKGxWaWV3RGF0YSwgbE5vZGVJbmRleCk7XG4gICAgICAgIGRpcmVjdGl2ZXMgPSBkaXJlY3RpdmVJbmRpY2VzID8gZGlzY292ZXJEaXJlY3RpdmVzKGxWaWV3RGF0YSwgZGlyZWN0aXZlSW5kaWNlcykgOiBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbE5vZGVJbmRleCA9IGZpbmRWaWFOYXRpdmVFbGVtZW50KGxWaWV3RGF0YSwgdGFyZ2V0IGFzIFJFbGVtZW50KTtcbiAgICAgICAgaWYgKGxOb2RlSW5kZXggPT0gLTEpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyB0aGUgZ29hbCBpcyBub3QgdG8gZmlsbCB0aGUgZW50aXJlIGNvbnRleHQgZnVsbCBvZiBkYXRhIGJlY2F1c2UgdGhlIGxvb2t1cHNcbiAgICAgIC8vIGFyZSBleHBlbnNpdmUuIEluc3RlYWQsIG9ubHkgdGhlIHRhcmdldCBkYXRhICh0aGUgZWxlbWVudCwgY29tcG9udGVudCBvclxuICAgICAgLy8gZGlyZWN0aXZlIGRldGFpbHMpIGFyZSBmaWxsZWQgaW50byB0aGUgY29udGV4dC4gSWYgY2FsbGVkIG11bHRpcGxlIHRpbWVzXG4gICAgICAvLyB3aXRoIGRpZmZlcmVudCB0YXJnZXQgdmFsdWVzIHRoZW4gdGhlIG1pc3NpbmcgdGFyZ2V0IGRhdGEgd2lsbCBiZSBmaWxsZWQgaW4uXG4gICAgICBjb25zdCBsTm9kZSA9IGdldExOb2RlRnJvbVZpZXdEYXRhKGxWaWV3RGF0YSwgbE5vZGVJbmRleCkgITtcbiAgICAgIGNvbnN0IGV4aXN0aW5nQ3R4ID0gcmVhZFBhdGNoZWREYXRhKGxOb2RlLm5hdGl2ZSk7XG4gICAgICBjb25zdCBjb250ZXh0OiBMQ29udGV4dCA9IChleGlzdGluZ0N0eCAmJiAhQXJyYXkuaXNBcnJheShleGlzdGluZ0N0eCkpID9cbiAgICAgICAgICBleGlzdGluZ0N0eCA6XG4gICAgICAgICAgY3JlYXRlTENvbnRleHQobFZpZXdEYXRhLCBsTm9kZUluZGV4LCBsTm9kZS5uYXRpdmUpO1xuXG4gICAgICAvLyBvbmx5IHdoZW4gdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBkaXNjb3ZlcmVkIHRoZW4gdXBkYXRlIHRoZSBtb25rZXktcGF0Y2hcbiAgICAgIGlmIChjb21wb25lbnQgJiYgY29udGV4dC5jb21wb25lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb250ZXh0LmNvbXBvbmVudCA9IGNvbXBvbmVudDtcbiAgICAgICAgYXR0YWNoUGF0Y2hEYXRhKGNvbnRleHQuY29tcG9uZW50LCBjb250ZXh0KTtcbiAgICAgIH1cblxuICAgICAgLy8gb25seSB3aGVuIHRoZSBkaXJlY3RpdmVzIGhhdmUgYmVlbiBkaXNjb3ZlcmVkIHRoZW4gdXBkYXRlIHRoZSBtb25rZXktcGF0Y2hcbiAgICAgIGlmIChkaXJlY3RpdmVzICYmIGRpcmVjdGl2ZUluZGljZXMgJiYgY29udGV4dC5kaXJlY3RpdmVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGV4dC5kaXJlY3RpdmVJbmRpY2VzID0gZGlyZWN0aXZlSW5kaWNlcztcbiAgICAgICAgY29udGV4dC5kaXJlY3RpdmVzID0gZGlyZWN0aXZlcztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaXJlY3RpdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgYXR0YWNoUGF0Y2hEYXRhKGRpcmVjdGl2ZXNbaV0sIGNvbnRleHQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGF0dGFjaFBhdGNoRGF0YShjb250ZXh0Lm5hdGl2ZSwgY29udGV4dCk7XG4gICAgICBtcFZhbHVlID0gY29udGV4dDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgckVsZW1lbnQgPSB0YXJnZXQgYXMgUkVsZW1lbnQ7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERvbUVsZW1lbnQockVsZW1lbnQpO1xuXG4gICAgLy8gaWYgdGhlIGNvbnRleHQgaXMgbm90IGZvdW5kIHRoZW4gd2UgbmVlZCB0byB0cmF2ZXJzZSB1cHdhcmRzIHVwIHRoZSBET01cbiAgICAvLyB0byBmaW5kIHRoZSBuZWFyZXN0IGVsZW1lbnQgdGhhdCBoYXMgYWxyZWFkeSBiZWVuIG1vbmtleSBwYXRjaGVkIHdpdGggZGF0YVxuICAgIGxldCBwYXJlbnQgPSByRWxlbWVudCBhcyBhbnk7XG4gICAgd2hpbGUgKHBhcmVudCA9IHBhcmVudC5wYXJlbnROb2RlKSB7XG4gICAgICBjb25zdCBwYXJlbnRDb250ZXh0ID0gcmVhZFBhdGNoZWREYXRhKHBhcmVudCk7XG4gICAgICBpZiAocGFyZW50Q29udGV4dCkge1xuICAgICAgICBsZXQgbFZpZXdEYXRhOiBMVmlld0RhdGF8bnVsbDtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocGFyZW50Q29udGV4dCkpIHtcbiAgICAgICAgICBsVmlld0RhdGEgPSBwYXJlbnRDb250ZXh0IGFzIExWaWV3RGF0YTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsVmlld0RhdGEgPSBwYXJlbnRDb250ZXh0LmxWaWV3RGF0YTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRoZSBlZGdlIG9mIHRoZSBhcHAgd2FzIGFsc28gcmVhY2hlZCBoZXJlIHRocm91Z2ggYW5vdGhlciBtZWFuc1xuICAgICAgICAvLyAobWF5YmUgYmVjYXVzZSB0aGUgRE9NIHdhcyBjaGFuZ2VkIG1hbnVhbGx5KS5cbiAgICAgICAgaWYgKCFsVmlld0RhdGEpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGluZGV4ID0gZmluZFZpYU5hdGl2ZUVsZW1lbnQobFZpZXdEYXRhLCByRWxlbWVudCk7XG4gICAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgICAgY29uc3QgbE5vZGUgPSBnZXRMTm9kZUZyb21WaWV3RGF0YShsVmlld0RhdGEsIGluZGV4KSAhO1xuICAgICAgICAgIGNvbnN0IGNvbnRleHQgPSBjcmVhdGVMQ29udGV4dChsVmlld0RhdGEsIGluZGV4LCBsTm9kZS5uYXRpdmUpO1xuICAgICAgICAgIGF0dGFjaFBhdGNoRGF0YShsTm9kZS5uYXRpdmUsIGNvbnRleHQpO1xuICAgICAgICAgIG1wVmFsdWUgPSBjb250ZXh0O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiAobXBWYWx1ZSBhcyBMQ29udGV4dCkgfHwgbnVsbDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGVtcHR5IGluc3RhbmNlIG9mIGEgYExDb250ZXh0YCBjb250ZXh0XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUxDb250ZXh0KGxWaWV3RGF0YTogTFZpZXdEYXRhLCBsTm9kZUluZGV4OiBudW1iZXIsIG5hdGl2ZTogUkVsZW1lbnQpOiBMQ29udGV4dCB7XG4gIHJldHVybiB7XG4gICAgbFZpZXdEYXRhLFxuICAgIGxOb2RlSW5kZXgsXG4gICAgbmF0aXZlLFxuICAgIGNvbXBvbmVudDogdW5kZWZpbmVkLFxuICAgIGRpcmVjdGl2ZUluZGljZXM6IHVuZGVmaW5lZCxcbiAgICBkaXJlY3RpdmVzOiB1bmRlZmluZWQsXG4gIH07XG59XG5cbi8qKlxuICogQSB1dGlsaXR5IGZ1bmN0aW9uIGZvciByZXRyaWV2aW5nIHRoZSBtYXRjaGluZyBsRWxlbWVudE5vZGVcbiAqIGZyb20gYSBnaXZlbiBET00gZWxlbWVudCwgY29tcG9uZW50IG9yIGRpcmVjdGl2ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExFbGVtZW50Tm9kZSh0YXJnZXQ6IGFueSk6IExFbGVtZW50Tm9kZXxudWxsIHtcbiAgY29uc3QgY29udGV4dCA9IGdldENvbnRleHQodGFyZ2V0KTtcbiAgcmV0dXJuIGNvbnRleHQgPyBnZXRMTm9kZUZyb21WaWV3RGF0YShjb250ZXh0LmxWaWV3RGF0YSwgY29udGV4dC5sTm9kZUluZGV4KSA6IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRMRWxlbWVudEZyb21Sb290Q29tcG9uZW50KHJvb3RDb21wb25lbnRJbnN0YW5jZToge30pOiBMRWxlbWVudE5vZGV8bnVsbCB7XG4gIC8vIHRoZSBob3N0IGVsZW1lbnQgZm9yIHRoZSByb290IGNvbXBvbmVudCBpcyBBTFdBWVMgdGhlIGZpcnN0IGVsZW1lbnRcbiAgLy8gaW4gdGhlIGxWaWV3RGF0YSBhcnJheSAod2hpY2ggaXMgd2hlcmUgSEVBREVSX09GRlNFVCBwb2ludHMgdG8pXG4gIGNvbnN0IGxWaWV3RGF0YSA9IHJlYWRQYXRjaGVkTFZpZXdEYXRhKHJvb3RDb21wb25lbnRJbnN0YW5jZSkgITtcbiAgcmV0dXJuIHJlYWRFbGVtZW50VmFsdWUobFZpZXdEYXRhW0hFQURFUl9PRkZTRVRdKTtcbn1cblxuLyoqXG4gKiBBIHNpbXBsaWZpZWQgbG9va3VwIGZ1bmN0aW9uIGZvciBmaW5kaW5nIHRoZSBMRWxlbWVudE5vZGUgZnJvbSBhIGNvbXBvbmVudCBpbnN0YW5jZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGV4aXN0cyBmb3IgdHJlZS1zaGFraW5nIHB1cnBvc2VzIHRvIGF2b2lkIGhhdmluZyB0byBwdWxsIGluIGV2ZXJ5dGhpbmdcbiAqIHRoYXQgYGdldENvbnRleHRgIGhhcyBpbiB0aGUgZXZlbnQgdGhhdCBhbiBBbmd1bGFyIGFwcGxpY2F0aW9uIGRvZXNuJ3QgbmVlZCB0byBoYXZlXG4gKiBhbnkgcHJvZ3JhbW1hdGljIGFjY2VzcyB0byBhbiBlbGVtZW50J3MgY29udGV4dCAob25seSBjaGFuZ2UgZGV0ZWN0aW9uIHVzZXMgdGhpcyBmdW5jdGlvbikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMRWxlbWVudEZyb21Db21wb25lbnQoY29tcG9uZW50SW5zdGFuY2U6IHt9KTogTEVsZW1lbnROb2RlIHtcbiAgbGV0IGxWaWV3RGF0YSA9IHJlYWRQYXRjaGVkRGF0YShjb21wb25lbnRJbnN0YW5jZSk7XG4gIGxldCBsTm9kZTogTEVsZW1lbnROb2RlO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KGxWaWV3RGF0YSkpIHtcbiAgICBjb25zdCBsTm9kZUluZGV4ID0gZmluZFZpYUNvbXBvbmVudChsVmlld0RhdGEsIGNvbXBvbmVudEluc3RhbmNlKTtcbiAgICBsTm9kZSA9IHJlYWRFbGVtZW50VmFsdWUobFZpZXdEYXRhW2xOb2RlSW5kZXhdKTtcbiAgICBjb25zdCBjb250ZXh0ID0gY3JlYXRlTENvbnRleHQobFZpZXdEYXRhLCBsTm9kZUluZGV4LCBsTm9kZS5uYXRpdmUpO1xuICAgIGNvbnRleHQuY29tcG9uZW50ID0gY29tcG9uZW50SW5zdGFuY2U7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKGNvbXBvbmVudEluc3RhbmNlLCBjb250ZXh0KTtcbiAgICBhdHRhY2hQYXRjaERhdGEoY29udGV4dC5uYXRpdmUsIGNvbnRleHQpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGNvbnRleHQgPSBsVmlld0RhdGEgYXMgYW55IGFzIExDb250ZXh0O1xuICAgIGxOb2RlID0gcmVhZEVsZW1lbnRWYWx1ZShjb250ZXh0LmxWaWV3RGF0YVtjb250ZXh0LmxOb2RlSW5kZXhdKTtcbiAgfVxuXG4gIHJldHVybiBsTm9kZTtcbn1cblxuLyoqXG4gKiBBc3NpZ25zIHRoZSBnaXZlbiBkYXRhIHRvIHRoZSBnaXZlbiB0YXJnZXQgKHdoaWNoIGNvdWxkIGJlIGEgY29tcG9uZW50LFxuICogZGlyZWN0aXZlIG9yIERPTSBub2RlIGluc3RhbmNlKSB1c2luZyBtb25rZXktcGF0Y2hpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hQYXRjaERhdGEodGFyZ2V0OiBhbnksIGRhdGE6IExWaWV3RGF0YSB8IExDb250ZXh0KSB7XG4gIHRhcmdldFtNT05LRVlfUEFUQ0hfS0VZX05BTUVdID0gZGF0YTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBtb25rZXktcGF0Y2ggdmFsdWUgZGF0YSBwcmVzZW50IG9uIHRoZSB0YXJnZXQgKHdoaWNoIGNvdWxkIGJlXG4gKiBhIGNvbXBvbmVudCwgZGlyZWN0aXZlIG9yIGEgRE9NIG5vZGUpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZFBhdGNoZWREYXRhKHRhcmdldDogYW55KTogTFZpZXdEYXRhfExDb250ZXh0fG51bGwge1xuICByZXR1cm4gdGFyZ2V0W01PTktFWV9QQVRDSF9LRVlfTkFNRV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkUGF0Y2hlZExWaWV3RGF0YSh0YXJnZXQ6IGFueSk6IExWaWV3RGF0YXxudWxsIHtcbiAgY29uc3QgdmFsdWUgPSByZWFkUGF0Y2hlZERhdGEodGFyZ2V0KTtcbiAgaWYgKHZhbHVlKSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWUgOiAodmFsdWUgYXMgTENvbnRleHQpLmxWaWV3RGF0YTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29tcG9uZW50SW5zdGFuY2UoaW5zdGFuY2U6IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gaW5zdGFuY2UgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IubmdDb21wb25lbnREZWY7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0RpcmVjdGl2ZUluc3RhbmNlKGluc3RhbmNlOiBhbnkpOiBib29sZWFuIHtcbiAgcmV0dXJuIGluc3RhbmNlICYmIGluc3RhbmNlLmNvbnN0cnVjdG9yICYmIGluc3RhbmNlLmNvbnN0cnVjdG9yLm5nRGlyZWN0aXZlRGVmO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGVsZW1lbnQgd2l0aGluIHRoZSBnaXZlbiBMVmlld0RhdGEgYW5kIHJldHVybnMgdGhlIG1hdGNoaW5nIGluZGV4XG4gKi9cbmZ1bmN0aW9uIGZpbmRWaWFOYXRpdmVFbGVtZW50KGxWaWV3RGF0YTogTFZpZXdEYXRhLCBuYXRpdmU6IFJFbGVtZW50KTogbnVtYmVyIHtcbiAgbGV0IHROb2RlID0gbFZpZXdEYXRhW1RWSUVXXS5maXJzdENoaWxkO1xuICB3aGlsZSAodE5vZGUpIHtcbiAgICBjb25zdCBsTm9kZSA9IGdldExOb2RlRnJvbVZpZXdEYXRhKGxWaWV3RGF0YSwgdE5vZGUuaW5kZXgpICE7XG4gICAgaWYgKGxOb2RlLm5hdGl2ZSA9PT0gbmF0aXZlKSB7XG4gICAgICByZXR1cm4gdE5vZGUuaW5kZXg7XG4gICAgfVxuICAgIHROb2RlID0gdHJhdmVyc2VOZXh0RWxlbWVudCh0Tm9kZSk7XG4gIH1cblxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuICogTG9jYXRlcyB0aGUgbmV4dCB0Tm9kZSAoY2hpbGQsIHNpYmxpbmcgb3IgcGFyZW50KS5cbiAqL1xuZnVuY3Rpb24gdHJhdmVyc2VOZXh0RWxlbWVudCh0Tm9kZTogVE5vZGUpOiBUTm9kZXxudWxsIHtcbiAgaWYgKHROb2RlLmNoaWxkKSB7XG4gICAgcmV0dXJuIHROb2RlLmNoaWxkO1xuICB9IGVsc2UgaWYgKHROb2RlLm5leHQpIHtcbiAgICByZXR1cm4gdE5vZGUubmV4dDtcbiAgfSBlbHNlIGlmICh0Tm9kZS5wYXJlbnQpIHtcbiAgICByZXR1cm4gdE5vZGUucGFyZW50Lm5leHQgfHwgbnVsbDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBjb21wb25lbnQgd2l0aGluIHRoZSBnaXZlbiBMVmlld0RhdGEgYW5kIHJldHVybnMgdGhlIG1hdGNoaW5nIGluZGV4XG4gKi9cbmZ1bmN0aW9uIGZpbmRWaWFDb21wb25lbnQobFZpZXdEYXRhOiBMVmlld0RhdGEsIGNvbXBvbmVudEluc3RhbmNlOiB7fSk6IG51bWJlciB7XG4gIGNvbnN0IGNvbXBvbmVudEluZGljZXMgPSBsVmlld0RhdGFbVFZJRVddLmNvbXBvbmVudHM7XG4gIGlmIChjb21wb25lbnRJbmRpY2VzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wb25lbnRJbmRpY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbGVtZW50Q29tcG9uZW50SW5kZXggPSBjb21wb25lbnRJbmRpY2VzW2ldO1xuICAgICAgY29uc3QgbE5vZGVEYXRhID0gcmVhZEVsZW1lbnRWYWx1ZShsVmlld0RhdGFbZWxlbWVudENvbXBvbmVudEluZGV4XSAhKS5kYXRhICE7XG4gICAgICBpZiAobE5vZGVEYXRhW0NPTlRFWFRdID09PSBjb21wb25lbnRJbnN0YW5jZSkge1xuICAgICAgICByZXR1cm4gZWxlbWVudENvbXBvbmVudEluZGV4O1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCByb290Tm9kZSA9IGxWaWV3RGF0YVtIRUFERVJfT0ZGU0VUXTtcbiAgICBjb25zdCByb290Q29tcG9uZW50ID0gcm9vdE5vZGUuZGF0YVtDT05URVhUXTtcbiAgICBpZiAocm9vdENvbXBvbmVudCA9PT0gY29tcG9uZW50SW5zdGFuY2UpIHtcbiAgICAgIC8vIHdlIGFyZSBkZWFsaW5nIHdpdGggdGhlIHJvb3QgZWxlbWVudCBoZXJlIHRoZXJlZm9yZSB3ZSBrbm93IHRoYXQgdGhlXG4gICAgICAvLyBlbGVtZW50IGlzIHRoZSB2ZXJ5IGZpcnN0IGVsZW1lbnQgYWZ0ZXIgdGhlIEhFQURFUiBkYXRhIGluIHRoZSBsVmlld1xuICAgICAgcmV0dXJuIEhFQURFUl9PRkZTRVQ7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBkaXJlY3RpdmUgd2l0aGluIHRoZSBnaXZlbiBMVmlld0RhdGEgYW5kIHJldHVybnMgdGhlIG1hdGNoaW5nIGluZGV4XG4gKi9cbmZ1bmN0aW9uIGZpbmRWaWFEaXJlY3RpdmUobFZpZXdEYXRhOiBMVmlld0RhdGEsIGRpcmVjdGl2ZUluc3RhbmNlOiB7fSk6IG51bWJlciB7XG4gIC8vIGlmIGEgZGlyZWN0aXZlIGlzIG1vbmtleSBwYXRjaGVkIHRoZW4gaXQgd2lsbCAoYnkgZGVmYXVsdClcbiAgLy8gaGF2ZSBhIHJlZmVyZW5jZSB0byB0aGUgTFZpZXdEYXRhIG9mIHRoZSBjdXJyZW50IHZpZXcuIFRoZVxuICAvLyBlbGVtZW50IGJvdW5kIHRvIHRoZSBkaXJlY3RpdmUgYmVpbmcgc2VhcmNoIGxpdmVzIHNvbWV3aGVyZVxuICAvLyBpbiB0aGUgdmlldyBkYXRhLiBCeSBmaXJzdCBjaGVja2luZyB0byBzZWUgaWYgdGhlIGluc3RhbmNlXG4gIC8vIGlzIGFjdHVhbGx5IHByZXNlbnQgd2UgY2FuIG5hcnJvdyBkb3duIHRvIHdoaWNoIGxFbGVtZW50Tm9kZVxuICAvLyBjb250YWlucyB0aGUgaW5zdGFuY2Ugb2YgdGhlIGRpcmVjdGl2ZSBhbmQgdGhlbiByZXR1cm4gdGhlIGluZGV4XG4gIGNvbnN0IGRpcmVjdGl2ZXNBY3Jvc3NWaWV3ID0gbFZpZXdEYXRhW0RJUkVDVElWRVNdO1xuICBjb25zdCBkaXJlY3RpdmVJbmRleCA9XG4gICAgICBkaXJlY3RpdmVzQWNyb3NzVmlldyA/IGRpcmVjdGl2ZXNBY3Jvc3NWaWV3LmluZGV4T2YoZGlyZWN0aXZlSW5zdGFuY2UpIDogLTE7XG4gIGlmIChkaXJlY3RpdmVJbmRleCA+PSAwKSB7XG4gICAgbGV0IHROb2RlID0gbFZpZXdEYXRhW1RWSUVXXS5maXJzdENoaWxkO1xuICAgIHdoaWxlICh0Tm9kZSkge1xuICAgICAgY29uc3QgZGlyZWN0aXZlSW5kZXhTdGFydCA9IGdldERpcmVjdGl2ZVN0YXJ0SW5kZXgodE5vZGUpO1xuICAgICAgY29uc3QgZGlyZWN0aXZlSW5kZXhFbmQgPSBnZXREaXJlY3RpdmVFbmRJbmRleCh0Tm9kZSwgZGlyZWN0aXZlSW5kZXhTdGFydCk7XG4gICAgICBpZiAoZGlyZWN0aXZlSW5kZXggPj0gZGlyZWN0aXZlSW5kZXhTdGFydCAmJiBkaXJlY3RpdmVJbmRleCA8IGRpcmVjdGl2ZUluZGV4RW5kKSB7XG4gICAgICAgIHJldHVybiB0Tm9kZS5pbmRleDtcbiAgICAgIH1cbiAgICAgIHROb2RlID0gdHJhdmVyc2VOZXh0RWxlbWVudCh0Tm9kZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIC0xO1xufVxuXG5mdW5jdGlvbiBhc3NlcnREb21FbGVtZW50KGVsZW1lbnQ6IGFueSkge1xuICBhc3NlcnRFcXVhbChlbGVtZW50Lm5vZGVUeXBlLCAxLCAnVGhlIHByb3ZpZGVkIHZhbHVlIG11c3QgYmUgYW4gaW5zdGFuY2Ugb2YgYW4gSFRNTEVsZW1lbnQnKTtcbn1cblxuLyoqXG4gKiBSZXRydW5zIHRoZSBpbnN0YW5jZSBvZiB0aGUgTEVsZW1lbnROb2RlIGF0IHRoZSBnaXZlbiBpbmRleCBpbiB0aGUgTFZpZXdEYXRhLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBhbHNvIHVud3JhcCB0aGUgaW5uZXIgdmFsdWUgaW5jYXNlIGl0J3Mgc3R1ZmZlZCBpbnRvIGFuXG4gKiBhcnJheSAod2hpY2ggaXMgd2hhdCBoYXBwZW5zIHdoZW4gW3N0eWxlXSBhbmQgW2NsYXNzXSBiaW5kaW5ncyBhcmUgcHJlc2VudFxuICogaW4gdGhlIHZpZXcgaW5zdHJ1Y3Rpb25zIGZvciB0aGUgZWxlbWVudCBiZWluZyByZXR1cm5lZCkuXG4gKi9cbmZ1bmN0aW9uIGdldExOb2RlRnJvbVZpZXdEYXRhKGxWaWV3RGF0YTogTFZpZXdEYXRhLCBsRWxlbWVudEluZGV4OiBudW1iZXIpOiBMRWxlbWVudE5vZGV8bnVsbCB7XG4gIGNvbnN0IHZhbHVlID0gbFZpZXdEYXRhW2xFbGVtZW50SW5kZXhdO1xuICByZXR1cm4gdmFsdWUgPyByZWFkRWxlbWVudFZhbHVlKHZhbHVlKSA6IG51bGw7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIGNvbGxlY3Rpb24gb2YgZGlyZWN0aXZlIGluZGV4IHZhbHVlcyB0aGF0IGFyZSB1c2VkIG9uIHRoZSBlbGVtZW50XG4gKiAod2hpY2ggaXMgcmVmZXJlbmNlZCBieSB0aGUgbE5vZGVJbmRleClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpc2NvdmVyRGlyZWN0aXZlSW5kaWNlcyhcbiAgICBsVmlld0RhdGE6IExWaWV3RGF0YSwgbE5vZGVJbmRleDogbnVtYmVyLCBpbmNsdWRlQ29tcG9uZW50cz86IGJvb2xlYW4pOiBudW1iZXJbXXxudWxsIHtcbiAgY29uc3QgZGlyZWN0aXZlc0Fjcm9zc1ZpZXcgPSBsVmlld0RhdGFbRElSRUNUSVZFU107XG4gIGNvbnN0IHROb2RlID0gbFZpZXdEYXRhW1RWSUVXXS5kYXRhW2xOb2RlSW5kZXhdIGFzIFROb2RlO1xuICBpZiAoZGlyZWN0aXZlc0Fjcm9zc1ZpZXcgJiYgZGlyZWN0aXZlc0Fjcm9zc1ZpZXcubGVuZ3RoKSB7XG4gICAgLy8gdGhpcyBjaGVjayBmb3IgdE5vZGUgaXMgdG8gZGV0ZXJtaW5lIGlmIHRoZSB2YWx1ZSBpcyBhIExFbGVtZW50Tm9kZSBpbnN0YW5jZVxuICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4U3RhcnQgPSBnZXREaXJlY3RpdmVTdGFydEluZGV4KHROb2RlKTtcbiAgICBjb25zdCBkaXJlY3RpdmVJbmRleEVuZCA9IGdldERpcmVjdGl2ZUVuZEluZGV4KHROb2RlLCBkaXJlY3RpdmVJbmRleFN0YXJ0KTtcbiAgICBjb25zdCBkaXJlY3RpdmVJbmRpY2VzOiBudW1iZXJbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSBkaXJlY3RpdmVJbmRleFN0YXJ0OyBpIDwgZGlyZWN0aXZlSW5kZXhFbmQ7IGkrKykge1xuICAgICAgLy8gc3BlY2lhbCBjYXNlIHNpbmNlIHRoZSBpbnN0YW5jZSBvZiB0aGUgY29tcG9uZW50IChpZiBpdCBleGlzdHMpXG4gICAgICAvLyBpcyBzdG9yZWQgaW4gdGhlIGRpcmVjdGl2ZXMgYXJyYXkuXG4gICAgICBpZiAoaSA+IGRpcmVjdGl2ZUluZGV4U3RhcnQgfHxcbiAgICAgICAgICAhaXNDb21wb25lbnRJbnN0YW5jZShkaXJlY3RpdmVzQWNyb3NzVmlld1tkaXJlY3RpdmVJbmRleFN0YXJ0XSkpIHtcbiAgICAgICAgZGlyZWN0aXZlSW5kaWNlcy5wdXNoKGkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGlyZWN0aXZlSW5kaWNlcy5sZW5ndGggPyBkaXJlY3RpdmVJbmRpY2VzIDogbnVsbDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbGlzdCBvZiBkaXJlY3RpdmVzIGV4dHJhY3RlZCBmcm9tIHRoZSBnaXZlbiB2aWV3IGJhc2VkIG9uIHRoZVxuICogcHJvdmlkZWQgbGlzdCBvZiBkaXJlY3RpdmUgaW5kZXggdmFsdWVzLlxuICpcbiAqIEBwYXJhbSBsVmlld0RhdGEgVGhlIHRhcmdldCB2aWV3IGRhdGFcbiAqIEBwYXJhbSBpbmRpY2VzIEEgY29sbGVjdGlvbiBvZiBkaXJlY3RpdmUgaW5kZXggdmFsdWVzIHdoaWNoIHdpbGwgYmUgdXNlZCB0b1xuICogICAgZmlndXJlIG91dCB0aGUgZGlyZWN0aXZlIGluc3RhbmNlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlzY292ZXJEaXJlY3RpdmVzKGxWaWV3RGF0YTogTFZpZXdEYXRhLCBpbmRpY2VzOiBudW1iZXJbXSk6IG51bWJlcltdfG51bGwge1xuICBjb25zdCBkaXJlY3RpdmVzOiBhbnlbXSA9IFtdO1xuICBjb25zdCBkaXJlY3RpdmVJbnN0YW5jZXMgPSBsVmlld0RhdGFbRElSRUNUSVZFU107XG4gIGlmIChkaXJlY3RpdmVJbnN0YW5jZXMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluZGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gaW5kaWNlc1tpXTtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGRpcmVjdGl2ZUluc3RhbmNlc1tkaXJlY3RpdmVJbmRleF07XG4gICAgICBkaXJlY3RpdmVzLnB1c2goZGlyZWN0aXZlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRpcmVjdGl2ZXM7XG59XG5cbmZ1bmN0aW9uIGdldERpcmVjdGl2ZVN0YXJ0SW5kZXgodE5vZGU6IFROb2RlKTogbnVtYmVyIHtcbiAgLy8gdGhlIHROb2RlIGluc3RhbmNlcyBzdG9yZSBhIGZsYWcgdmFsdWUgd2hpY2ggdGhlbiBoYXMgYVxuICAvLyBwb2ludGVyIHdoaWNoIHRlbGxzIHRoZSBzdGFydGluZyBpbmRleCBvZiB3aGVyZSBhbGwgdGhlXG4gIC8vIGFjdGl2ZSBkaXJlY3RpdmVzIGFyZSBpbiB0aGUgbWFzdGVyIGRpcmVjdGl2ZSBhcnJheVxuICByZXR1cm4gdE5vZGUuZmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG59XG5cbmZ1bmN0aW9uIGdldERpcmVjdGl2ZUVuZEluZGV4KHROb2RlOiBUTm9kZSwgc3RhcnRJbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgLy8gVGhlIGVuZCB2YWx1ZSBpcyBhbHNvIGEgcGFydCBvZiB0aGUgc2FtZSBmbGFnXG4gIC8vIChzZWUgYFROb2RlRmxhZ3NgIHRvIHNlZSBob3cgdGhlIGZsYWcgYml0IHNoaWZ0aW5nXG4gIC8vIHZhbHVlcyBhcmUgdXNlZCkuXG4gIGNvbnN0IGNvdW50ID0gdE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaztcbiAgcmV0dXJuIGNvdW50ID8gKHN0YXJ0SW5kZXggKyBjb3VudCkgOiAtMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRFbGVtZW50VmFsdWUodmFsdWU6IExFbGVtZW50Tm9kZSB8IGFueVtdKTogTEVsZW1lbnROb2RlIHtcbiAgcmV0dXJuIChBcnJheS5pc0FycmF5KHZhbHVlKSA/ICh2YWx1ZSBhcyBhbnkgYXMgYW55W10pWzBdIDogdmFsdWUpIGFzIExFbGVtZW50Tm9kZTtcbn1cbiJdfQ==