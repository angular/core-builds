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
import { readElementValue } from './util';
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
export function getLElementFromRootComponent(componentInstance) {
    // the host element for the root component is ALWAYS the first element
    // in the lViewData array (which is where HEADER_OFFSET points to)
    return getLElementFromComponent(componentInstance, HEADER_OFFSET);
}
/**
 * A simplified lookup function for finding the LElementNode from a component instance.
 *
 * This function exists for tree-shaking purposes to avoid having to pull in everything
 * that `getContext` has in the event that an Angular application doesn't need to have
 * any programmatic access to an element's context (only change detection uses this function).
 */
export function getLElementFromComponent(componentInstance, expectedLNodeIndex) {
    var lViewData = readPatchedData(componentInstance);
    var lNode;
    if (Array.isArray(lViewData)) {
        expectedLNodeIndex = expectedLNodeIndex || findViaComponent(lViewData, componentInstance);
        lNode = readElementValue(lViewData[expectedLNodeIndex]);
        var context = createLContext(lViewData, expectedLNodeIndex, lNode.native);
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
            var lNode = getLNodeFromViewData(lViewData, tNode.index);
            var directiveIndexStart = getDirectiveStartIndex(lNode);
            var directiveIndexEnd = getDirectiveEndIndex(lNode, directiveIndexStart);
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
function discoverDirectiveIndices(lViewData, lNodeIndex) {
    var directivesAcrossView = lViewData[DIRECTIVES];
    var lNode = getLNodeFromViewData(lViewData, lNodeIndex);
    if (lNode && directivesAcrossView && directivesAcrossView.length) {
        // this check for tNode is to determine if the calue is a LEmementNode instance
        var directiveIndexStart = getDirectiveStartIndex(lNode);
        var directiveIndexEnd = getDirectiveEndIndex(lNode, directiveIndexStart);
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
function discoverDirectives(lViewData, directiveIndices) {
    var directives = [];
    var directiveInstances = lViewData[DIRECTIVES];
    if (directiveInstances) {
        for (var i = 0; i < directiveIndices.length; i++) {
            var directiveIndex = directiveIndices[i];
            var directive = directiveInstances[directiveIndex];
            directives.push(directive);
        }
    }
    return directives;
}
function getDirectiveStartIndex(lNode) {
    // the tNode instances store a flag value which then has a
    // pointer which tells the starting index of where all the
    // active directives are in the master directive array
    return lNode.tNode.flags >> 15 /* DirectiveStartingIndexShift */;
}
function getDirectiveEndIndex(lNode, startIndex) {
    // The end value is also apart of the same flag
    // (see `TNodeFlags` to see how the flag bit shifting
    // values are used).
    var count = lNode.tNode.flags & 4095 /* DirectiveCountMask */;
    return count ? (startIndex + count) : -1;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9kaXNjb3ZlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2NvbnRleHRfZGlzY292ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFHckMsT0FBTyxFQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsYUFBYSxFQUFhLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3ZGLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUV4Qzs7R0FFRztBQUNILE1BQU0sQ0FBQyxJQUFNLHFCQUFxQixHQUFHLGVBQWUsQ0FBQztBQWdDckQ7Ozs7Ozs7Ozs7Ozs7Ozs7R0FnQkc7QUFDSCxNQUFNLFVBQVUsVUFBVSxDQUFDLE1BQVc7SUFDcEMsSUFBSSxPQUFPLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3RDLElBQUksT0FBTyxFQUFFO1FBQ1gsaUVBQWlFO1FBQ2pFLDhEQUE4RDtRQUM5RCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDMUIsSUFBTSxTQUFTLEdBQWMsT0FBUyxDQUFDO1lBQ3ZDLElBQUksVUFBVSxTQUFRLENBQUM7WUFDdkIsSUFBSSxTQUFTLEdBQVEsU0FBUyxDQUFDO1lBQy9CLElBQUksZ0JBQWdCLEdBQTRCLFNBQVMsQ0FBQztZQUMxRCxJQUFJLFVBQVUsR0FBeUIsU0FBUyxDQUFDO1lBRWpELElBQUksbUJBQW1CLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQy9CLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ2pELElBQUksVUFBVSxJQUFJLENBQUMsQ0FBQyxFQUFFO29C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QUUsQ0FBQyxFQUFFLEVBQUU7WUFDaEQsSUFBTSxjQUFjLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0MsSUFBTSxTQUFTLEdBQUcsa0JBQWtCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDckQsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUM1QjtLQUNGO0lBQ0QsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQztBQUVELFNBQVMsc0JBQXNCLENBQUMsS0FBbUI7SUFDakQsMERBQTBEO0lBQzFELDBEQUEwRDtJQUMxRCxzREFBc0Q7SUFDdEQsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssd0NBQTBDLENBQUM7QUFDckUsQ0FBQztBQUVELFNBQVMsb0JBQW9CLENBQUMsS0FBbUIsRUFBRSxVQUFrQjtJQUNuRSwrQ0FBK0M7SUFDL0MscURBQXFEO0lBQ3JELG9CQUFvQjtJQUNwQixJQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssZ0NBQWdDLENBQUM7SUFDaEUsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICcuL25nX2Rldl9tb2RlJztcblxuaW1wb3J0IHthc3NlcnRFcXVhbH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtMRWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtDT05URVhULCBESVJFQ1RJVkVTLCBIRUFERVJfT0ZGU0VULCBMVmlld0RhdGEsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge3JlYWRFbGVtZW50VmFsdWV9IGZyb20gJy4vdXRpbCc7XG5cbi8qKlxuICogVGhpcyBwcm9wZXJ0eSB3aWxsIGJlIG1vbmtleS1wYXRjaGVkIG9uIGVsZW1lbnRzLCBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzXG4gKi9cbmV4cG9ydCBjb25zdCBNT05LRVlfUEFUQ0hfS0VZX05BTUUgPSAnX19uZ0NvbnRleHRfXyc7XG5cbi8qKlxuICogVGhlIGludGVybmFsIHZpZXcgY29udGV4dCB3aGljaCBpcyBzcGVjaWZpYyB0byBhIGdpdmVuIERPTSBlbGVtZW50LCBkaXJlY3RpdmUgb3JcbiAqIGNvbXBvbmVudCBpbnN0YW5jZS4gRWFjaCB2YWx1ZSBpbiBoZXJlIChiZXNpZGVzIHRoZSBMVmlld0RhdGEgYW5kIGVsZW1lbnQgbm9kZSBkZXRhaWxzKVxuICogY2FuIGJlIHByZXNlbnQsIG51bGwgb3IgdW5kZWZpbmVkLiBJZiB1bmRlZmluZWQgdGhlbiBpdCBpbXBsaWVzIHRoZSB2YWx1ZSBoYXMgbm90IGJlZW5cbiAqIGxvb2tlZCB1cCB5ZXQsIG90aGVyd2lzZSwgaWYgbnVsbCwgdGhlbiBhIGxvb2t1cCB3YXMgZXhlY3V0ZWQgYW5kIG5vdGhpbmcgd2FzIGZvdW5kLlxuICpcbiAqIEVhY2ggdmFsdWUgd2lsbCBnZXQgZmlsbGVkIHdoZW4gdGhlIHJlc3BlY3RpdmUgdmFsdWUgaXMgZXhhbWluZWQgd2l0aGluIHRoZSBnZXRDb250ZXh0XG4gKiBmdW5jdGlvbi4gVGhlIGNvbXBvbmVudCwgZWxlbWVudCBhbmQgZWFjaCBkaXJlY3RpdmUgaW5zdGFuY2Ugd2lsbCBzaGFyZSB0aGUgc2FtZSBpbnN0YW5jZVxuICogb2YgdGhlIGNvbnRleHQuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTENvbnRleHQge1xuICAvKiogVGhlIGNvbXBvbmVudFxcJ3MgdmlldyBkYXRhICovXG4gIGxWaWV3RGF0YTogTFZpZXdEYXRhO1xuXG4gIC8qKiBUaGUgaW5kZXggaW5zdGFuY2Ugb2YgdGhlIExOb2RlICovXG4gIGxOb2RlSW5kZXg6IG51bWJlcjtcblxuICAvKiogVGhlIGluc3RhbmNlIG9mIHRoZSBET00gbm9kZSB0aGF0IGlzIGF0dGFjaGVkIHRvIHRoZSBsTm9kZSAqL1xuICBuYXRpdmU6IFJFbGVtZW50O1xuXG4gIC8qKiBUaGUgaW5zdGFuY2Ugb2YgdGhlIENvbXBvbmVudCBub2RlICovXG4gIGNvbXBvbmVudDoge318bnVsbHx1bmRlZmluZWQ7XG5cbiAgLyoqIFRoZSBsaXN0IG9mIGluZGljZXMgZm9yIHRoZSBhY3RpdmUgZGlyZWN0aXZlcyB0aGF0IGV4aXN0IG9uIHRoaXMgZWxlbWVudCAqL1xuICBkaXJlY3RpdmVJbmRpY2VzOiBudW1iZXJbXXxudWxsfHVuZGVmaW5lZDtcblxuICAvKiogVGhlIGxpc3Qgb2YgYWN0aXZlIGRpcmVjdGl2ZXMgdGhhdCBleGlzdCBvbiB0aGlzIGVsZW1lbnQgKi9cbiAgZGlyZWN0aXZlczogQXJyYXk8e30+fG51bGx8dW5kZWZpbmVkO1xufVxuXG4vKiogUmV0dXJucyB0aGUgbWF0Y2hpbmcgYExDb250ZXh0YCBkYXRhIGZvciBhIGdpdmVuIERPTSBub2RlLCBkaXJlY3RpdmUgb3IgY29tcG9uZW50IGluc3RhbmNlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBleGFtaW5lIHRoZSBwcm92aWRlZCBET00gZWxlbWVudCwgY29tcG9uZW50LCBvciBkaXJlY3RpdmUgaW5zdGFuY2VcXCdzXG4gKiBtb25rZXktcGF0Y2hlZCBwcm9wZXJ0eSB0byBkZXJpdmUgdGhlIGBMQ29udGV4dGAgZGF0YS4gT25jZSBjYWxsZWQgdGhlbiB0aGUgbW9ua2V5LXBhdGNoZWRcbiAqIHZhbHVlIHdpbGwgYmUgdGhhdCBvZiB0aGUgbmV3bHkgY3JlYXRlZCBgTENvbnRleHRgLlxuICpcbiAqIElmIHRoZSBtb25rZXktcGF0Y2hlZCB2YWx1ZSBpcyB0aGUgYExWaWV3RGF0YWAgaW5zdGFuY2UgdGhlbiB0aGUgY29udGV4dCB2YWx1ZSBmb3IgdGhhdFxuICogdGFyZ2V0IHdpbGwgYmUgY3JlYXRlZCBhbmQgdGhlIG1vbmtleS1wYXRjaCByZWZlcmVuY2Ugd2lsbCBiZSB1cGRhdGVkLiBUaGVyZWZvcmUgd2hlbiB0aGlzXG4gKiBmdW5jdGlvbiBpcyBjYWxsZWQgaXQgbWF5IG11dGF0ZSB0aGUgcHJvdmlkZWQgZWxlbWVudFxcJ3MsIGNvbXBvbmVudFxcJ3Mgb3IgYW55IG9mIHRoZSBhc3NvY2lhdGVkXG4gKiBkaXJlY3RpdmVcXCdzIG1vbmtleS1wYXRjaCB2YWx1ZXMuXG4gKlxuICogSWYgdGhlIG1vbmtleS1wYXRjaCB2YWx1ZSBpcyBub3QgZGV0ZWN0ZWQgdGhlbiB0aGUgY29kZSB3aWxsIHdhbGsgdXAgdGhlIERPTSB1bnRpbCBhbiBlbGVtZW50XG4gKiBpcyBmb3VuZCB3aGljaCBjb250YWlucyBhIG1vbmtleS1wYXRjaCByZWZlcmVuY2UuIFdoZW4gdGhhdCBvY2N1cnMgdGhlbiB0aGUgcHJvdmlkZWQgZWxlbWVudFxuICogd2lsbCBiZSB1cGRhdGVkIHdpdGggYSBuZXcgY29udGV4dCAod2hpY2ggaXMgdGhlbiByZXR1cm5lZCkuIElmIHRoZSBtb25rZXktcGF0Y2ggdmFsdWUgaXMgbm90XG4gKiBkZXRlY3RlZCBmb3IgYSBjb21wb25lbnQvZGlyZWN0aXZlIGluc3RhbmNlIHRoZW4gaXQgd2lsbCB0aHJvdyBhbiBlcnJvciAoYWxsIGNvbXBvbmVudHMgYW5kXG4gKiBkaXJlY3RpdmVzIHNob3VsZCBiZSBhdXRvbWF0aWNhbGx5IG1vbmtleS1wYXRjaGVkIGJ5IGl2eSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb250ZXh0KHRhcmdldDogYW55KTogTENvbnRleHR8bnVsbCB7XG4gIGxldCBtcFZhbHVlID0gcmVhZFBhdGNoZWREYXRhKHRhcmdldCk7XG4gIGlmIChtcFZhbHVlKSB7XG4gICAgLy8gb25seSB3aGVuIGl0J3MgYW4gYXJyYXkgaXMgaXQgY29uc2lkZXJlZCBhbiBMVmlld0RhdGEgaW5zdGFuY2VcbiAgICAvLyAuLi4gb3RoZXJ3aXNlIGl0J3MgYW4gYWxyZWFkeSBjb25zdHJ1Y3RlZCBMQ29udGV4dCBpbnN0YW5jZVxuICAgIGlmIChBcnJheS5pc0FycmF5KG1wVmFsdWUpKSB7XG4gICAgICBjb25zdCBsVmlld0RhdGE6IExWaWV3RGF0YSA9IG1wVmFsdWUgITtcbiAgICAgIGxldCBsTm9kZUluZGV4OiBudW1iZXI7XG4gICAgICBsZXQgY29tcG9uZW50OiBhbnkgPSB1bmRlZmluZWQ7XG4gICAgICBsZXQgZGlyZWN0aXZlSW5kaWNlczogbnVtYmVyW118bnVsbHx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICBsZXQgZGlyZWN0aXZlczogYW55W118bnVsbHx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgICAgIGlmIChpc0NvbXBvbmVudEluc3RhbmNlKHRhcmdldCkpIHtcbiAgICAgICAgbE5vZGVJbmRleCA9IGZpbmRWaWFDb21wb25lbnQobFZpZXdEYXRhLCB0YXJnZXQpO1xuICAgICAgICBpZiAobE5vZGVJbmRleCA9PSAtMSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHByb3ZpZGVkIGNvbXBvbmVudCB3YXMgbm90IGZvdW5kIGluIHRoZSBhcHBsaWNhdGlvbicpO1xuICAgICAgICB9XG4gICAgICAgIGNvbXBvbmVudCA9IHRhcmdldDtcbiAgICAgIH0gZWxzZSBpZiAoaXNEaXJlY3RpdmVJbnN0YW5jZSh0YXJnZXQpKSB7XG4gICAgICAgIGxOb2RlSW5kZXggPSBmaW5kVmlhRGlyZWN0aXZlKGxWaWV3RGF0YSwgdGFyZ2V0KTtcbiAgICAgICAgaWYgKGxOb2RlSW5kZXggPT0gLTEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBwcm92aWRlZCBkaXJlY3RpdmUgd2FzIG5vdCBmb3VuZCBpbiB0aGUgYXBwbGljYXRpb24nKTtcbiAgICAgICAgfVxuICAgICAgICBkaXJlY3RpdmVJbmRpY2VzID0gZGlzY292ZXJEaXJlY3RpdmVJbmRpY2VzKGxWaWV3RGF0YSwgbE5vZGVJbmRleCk7XG4gICAgICAgIGRpcmVjdGl2ZXMgPSBkaXJlY3RpdmVJbmRpY2VzID8gZGlzY292ZXJEaXJlY3RpdmVzKGxWaWV3RGF0YSwgZGlyZWN0aXZlSW5kaWNlcykgOiBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbE5vZGVJbmRleCA9IGZpbmRWaWFOYXRpdmVFbGVtZW50KGxWaWV3RGF0YSwgdGFyZ2V0IGFzIFJFbGVtZW50KTtcbiAgICAgICAgaWYgKGxOb2RlSW5kZXggPT0gLTEpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyB0aGUgZ29hbCBpcyBub3QgdG8gZmlsbCB0aGUgZW50aXJlIGNvbnRleHQgZnVsbCBvZiBkYXRhIGJlY2F1c2UgdGhlIGxvb2t1cHNcbiAgICAgIC8vIGFyZSBleHBlbnNpdmUuIEluc3RlYWQsIG9ubHkgdGhlIHRhcmdldCBkYXRhICh0aGUgZWxlbWVudCwgY29tcG9udGVudCBvclxuICAgICAgLy8gZGlyZWN0aXZlIGRldGFpbHMpIGFyZSBmaWxsZWQgaW50byB0aGUgY29udGV4dC4gSWYgY2FsbGVkIG11bHRpcGxlIHRpbWVzXG4gICAgICAvLyB3aXRoIGRpZmZlcmVudCB0YXJnZXQgdmFsdWVzIHRoZW4gdGhlIG1pc3NpbmcgdGFyZ2V0IGRhdGEgd2lsbCBiZSBmaWxsZWQgaW4uXG4gICAgICBjb25zdCBsTm9kZSA9IGdldExOb2RlRnJvbVZpZXdEYXRhKGxWaWV3RGF0YSwgbE5vZGVJbmRleCkgITtcbiAgICAgIGNvbnN0IGV4aXN0aW5nQ3R4ID0gcmVhZFBhdGNoZWREYXRhKGxOb2RlLm5hdGl2ZSk7XG4gICAgICBjb25zdCBjb250ZXh0OiBMQ29udGV4dCA9IChleGlzdGluZ0N0eCAmJiAhQXJyYXkuaXNBcnJheShleGlzdGluZ0N0eCkpID9cbiAgICAgICAgICBleGlzdGluZ0N0eCA6XG4gICAgICAgICAgY3JlYXRlTENvbnRleHQobFZpZXdEYXRhLCBsTm9kZUluZGV4LCBsTm9kZS5uYXRpdmUpO1xuXG4gICAgICAvLyBvbmx5IHdoZW4gdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBkaXNjb3ZlcmVkIHRoZW4gdXBkYXRlIHRoZSBtb25rZXktcGF0Y2hcbiAgICAgIGlmIChjb21wb25lbnQgJiYgY29udGV4dC5jb21wb25lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb250ZXh0LmNvbXBvbmVudCA9IGNvbXBvbmVudDtcbiAgICAgICAgYXR0YWNoUGF0Y2hEYXRhKGNvbnRleHQuY29tcG9uZW50LCBjb250ZXh0KTtcbiAgICAgIH1cblxuICAgICAgLy8gb25seSB3aGVuIHRoZSBkaXJlY3RpdmVzIGhhdmUgYmVlbiBkaXNjb3ZlcmVkIHRoZW4gdXBkYXRlIHRoZSBtb25rZXktcGF0Y2hcbiAgICAgIGlmIChkaXJlY3RpdmVzICYmIGRpcmVjdGl2ZUluZGljZXMgJiYgY29udGV4dC5kaXJlY3RpdmVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGV4dC5kaXJlY3RpdmVJbmRpY2VzID0gZGlyZWN0aXZlSW5kaWNlcztcbiAgICAgICAgY29udGV4dC5kaXJlY3RpdmVzID0gZGlyZWN0aXZlcztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaXJlY3RpdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgYXR0YWNoUGF0Y2hEYXRhKGRpcmVjdGl2ZXNbaV0sIGNvbnRleHQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGF0dGFjaFBhdGNoRGF0YShjb250ZXh0Lm5hdGl2ZSwgY29udGV4dCk7XG4gICAgICBtcFZhbHVlID0gY29udGV4dDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgckVsZW1lbnQgPSB0YXJnZXQgYXMgUkVsZW1lbnQ7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERvbUVsZW1lbnQockVsZW1lbnQpO1xuXG4gICAgLy8gaWYgdGhlIGNvbnRleHQgaXMgbm90IGZvdW5kIHRoZW4gd2UgbmVlZCB0byB0cmF2ZXJzZSB1cHdhcmRzIHVwIHRoZSBET01cbiAgICAvLyB0byBmaW5kIHRoZSBuZWFyZXN0IGVsZW1lbnQgdGhhdCBoYXMgYWxyZWFkeSBiZWVuIG1vbmtleSBwYXRjaGVkIHdpdGggZGF0YVxuICAgIGxldCBwYXJlbnQgPSByRWxlbWVudCBhcyBhbnk7XG4gICAgd2hpbGUgKHBhcmVudCA9IHBhcmVudC5wYXJlbnROb2RlKSB7XG4gICAgICBjb25zdCBwYXJlbnRDb250ZXh0ID0gcmVhZFBhdGNoZWREYXRhKHBhcmVudCk7XG4gICAgICBpZiAocGFyZW50Q29udGV4dCkge1xuICAgICAgICBsZXQgbFZpZXdEYXRhOiBMVmlld0RhdGF8bnVsbDtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocGFyZW50Q29udGV4dCkpIHtcbiAgICAgICAgICBsVmlld0RhdGEgPSBwYXJlbnRDb250ZXh0IGFzIExWaWV3RGF0YTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsVmlld0RhdGEgPSBwYXJlbnRDb250ZXh0LmxWaWV3RGF0YTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRoZSBlZGdlIG9mIHRoZSBhcHAgd2FzIGFsc28gcmVhY2hlZCBoZXJlIHRocm91Z2ggYW5vdGhlciBtZWFuc1xuICAgICAgICAvLyAobWF5YmUgYmVjYXVzZSB0aGUgRE9NIHdhcyBjaGFuZ2VkIG1hbnVhbGx5KS5cbiAgICAgICAgaWYgKCFsVmlld0RhdGEpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGluZGV4ID0gZmluZFZpYU5hdGl2ZUVsZW1lbnQobFZpZXdEYXRhLCByRWxlbWVudCk7XG4gICAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgICAgY29uc3QgbE5vZGUgPSBnZXRMTm9kZUZyb21WaWV3RGF0YShsVmlld0RhdGEsIGluZGV4KSAhO1xuICAgICAgICAgIGNvbnN0IGNvbnRleHQgPSBjcmVhdGVMQ29udGV4dChsVmlld0RhdGEsIGluZGV4LCBsTm9kZS5uYXRpdmUpO1xuICAgICAgICAgIGF0dGFjaFBhdGNoRGF0YShsTm9kZS5uYXRpdmUsIGNvbnRleHQpO1xuICAgICAgICAgIG1wVmFsdWUgPSBjb250ZXh0O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiAobXBWYWx1ZSBhcyBMQ29udGV4dCkgfHwgbnVsbDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGVtcHR5IGluc3RhbmNlIG9mIGEgYExDb250ZXh0YCBjb250ZXh0XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUxDb250ZXh0KGxWaWV3RGF0YTogTFZpZXdEYXRhLCBsTm9kZUluZGV4OiBudW1iZXIsIG5hdGl2ZTogUkVsZW1lbnQpOiBMQ29udGV4dCB7XG4gIHJldHVybiB7XG4gICAgbFZpZXdEYXRhLFxuICAgIGxOb2RlSW5kZXgsXG4gICAgbmF0aXZlLFxuICAgIGNvbXBvbmVudDogdW5kZWZpbmVkLFxuICAgIGRpcmVjdGl2ZUluZGljZXM6IHVuZGVmaW5lZCxcbiAgICBkaXJlY3RpdmVzOiB1bmRlZmluZWQsXG4gIH07XG59XG5cbi8qKlxuICogQSB1dGlsaXR5IGZ1bmN0aW9uIGZvciByZXRyaWV2aW5nIHRoZSBtYXRjaGluZyBsRWxlbWVudE5vZGVcbiAqIGZyb20gYSBnaXZlbiBET00gZWxlbWVudCwgY29tcG9uZW50IG9yIGRpcmVjdGl2ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExFbGVtZW50Tm9kZSh0YXJnZXQ6IGFueSk6IExFbGVtZW50Tm9kZXxudWxsIHtcbiAgY29uc3QgY29udGV4dCA9IGdldENvbnRleHQodGFyZ2V0KTtcbiAgcmV0dXJuIGNvbnRleHQgPyBnZXRMTm9kZUZyb21WaWV3RGF0YShjb250ZXh0LmxWaWV3RGF0YSwgY29udGV4dC5sTm9kZUluZGV4KSA6IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRMRWxlbWVudEZyb21Sb290Q29tcG9uZW50KGNvbXBvbmVudEluc3RhbmNlOiB7fSk6IExFbGVtZW50Tm9kZXxudWxsIHtcbiAgLy8gdGhlIGhvc3QgZWxlbWVudCBmb3IgdGhlIHJvb3QgY29tcG9uZW50IGlzIEFMV0FZUyB0aGUgZmlyc3QgZWxlbWVudFxuICAvLyBpbiB0aGUgbFZpZXdEYXRhIGFycmF5ICh3aGljaCBpcyB3aGVyZSBIRUFERVJfT0ZGU0VUIHBvaW50cyB0bylcbiAgcmV0dXJuIGdldExFbGVtZW50RnJvbUNvbXBvbmVudChjb21wb25lbnRJbnN0YW5jZSwgSEVBREVSX09GRlNFVCk7XG59XG5cbi8qKlxuICogQSBzaW1wbGlmaWVkIGxvb2t1cCBmdW5jdGlvbiBmb3IgZmluZGluZyB0aGUgTEVsZW1lbnROb2RlIGZyb20gYSBjb21wb25lbnQgaW5zdGFuY2UuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBleGlzdHMgZm9yIHRyZWUtc2hha2luZyBwdXJwb3NlcyB0byBhdm9pZCBoYXZpbmcgdG8gcHVsbCBpbiBldmVyeXRoaW5nXG4gKiB0aGF0IGBnZXRDb250ZXh0YCBoYXMgaW4gdGhlIGV2ZW50IHRoYXQgYW4gQW5ndWxhciBhcHBsaWNhdGlvbiBkb2Vzbid0IG5lZWQgdG8gaGF2ZVxuICogYW55IHByb2dyYW1tYXRpYyBhY2Nlc3MgdG8gYW4gZWxlbWVudCdzIGNvbnRleHQgKG9ubHkgY2hhbmdlIGRldGVjdGlvbiB1c2VzIHRoaXMgZnVuY3Rpb24pLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TEVsZW1lbnRGcm9tQ29tcG9uZW50KFxuICAgIGNvbXBvbmVudEluc3RhbmNlOiB7fSwgZXhwZWN0ZWRMTm9kZUluZGV4PzogbnVtYmVyKTogTEVsZW1lbnROb2RlfG51bGwge1xuICBsZXQgbFZpZXdEYXRhID0gcmVhZFBhdGNoZWREYXRhKGNvbXBvbmVudEluc3RhbmNlKTtcbiAgbGV0IGxOb2RlOiBMRWxlbWVudE5vZGU7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkobFZpZXdEYXRhKSkge1xuICAgIGV4cGVjdGVkTE5vZGVJbmRleCA9IGV4cGVjdGVkTE5vZGVJbmRleCB8fCBmaW5kVmlhQ29tcG9uZW50KGxWaWV3RGF0YSwgY29tcG9uZW50SW5zdGFuY2UpO1xuICAgIGxOb2RlID0gcmVhZEVsZW1lbnRWYWx1ZShsVmlld0RhdGFbZXhwZWN0ZWRMTm9kZUluZGV4XSk7XG4gICAgY29uc3QgY29udGV4dCA9IGNyZWF0ZUxDb250ZXh0KGxWaWV3RGF0YSwgZXhwZWN0ZWRMTm9kZUluZGV4LCBsTm9kZS5uYXRpdmUpO1xuICAgIGNvbnRleHQuY29tcG9uZW50ID0gY29tcG9uZW50SW5zdGFuY2U7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKGNvbXBvbmVudEluc3RhbmNlLCBjb250ZXh0KTtcbiAgICBhdHRhY2hQYXRjaERhdGEoY29udGV4dC5uYXRpdmUsIGNvbnRleHQpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGNvbnRleHQgPSBsVmlld0RhdGEgYXMgYW55IGFzIExDb250ZXh0O1xuICAgIGxOb2RlID0gcmVhZEVsZW1lbnRWYWx1ZShjb250ZXh0LmxWaWV3RGF0YVtjb250ZXh0LmxOb2RlSW5kZXhdKTtcbiAgfVxuXG4gIHJldHVybiBsTm9kZTtcbn1cblxuLyoqXG4gKiBBc3NpZ25zIHRoZSBnaXZlbiBkYXRhIHRvIHRoZSBnaXZlbiB0YXJnZXQgKHdoaWNoIGNvdWxkIGJlIGEgY29tcG9uZW50LFxuICogZGlyZWN0aXZlIG9yIERPTSBub2RlIGluc3RhbmNlKSB1c2luZyBtb25rZXktcGF0Y2hpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hQYXRjaERhdGEodGFyZ2V0OiBhbnksIGRhdGE6IExWaWV3RGF0YSB8IExDb250ZXh0KSB7XG4gIHRhcmdldFtNT05LRVlfUEFUQ0hfS0VZX05BTUVdID0gZGF0YTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBtb25rZXktcGF0Y2ggdmFsdWUgZGF0YSBwcmVzZW50IG9uIHRoZSB0YXJnZXQgKHdoaWNoIGNvdWxkIGJlXG4gKiBhIGNvbXBvbmVudCwgZGlyZWN0aXZlIG9yIGEgRE9NIG5vZGUpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZFBhdGNoZWREYXRhKHRhcmdldDogYW55KTogTFZpZXdEYXRhfExDb250ZXh0fG51bGwge1xuICByZXR1cm4gdGFyZ2V0W01PTktFWV9QQVRDSF9LRVlfTkFNRV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbXBvbmVudEluc3RhbmNlKGluc3RhbmNlOiBhbnkpOiBib29sZWFuIHtcbiAgcmV0dXJuIGluc3RhbmNlICYmIGluc3RhbmNlLmNvbnN0cnVjdG9yICYmIGluc3RhbmNlLmNvbnN0cnVjdG9yLm5nQ29tcG9uZW50RGVmO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNEaXJlY3RpdmVJbnN0YW5jZShpbnN0YW5jZTogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiBpbnN0YW5jZSAmJiBpbnN0YW5jZS5jb25zdHJ1Y3RvciAmJiBpbnN0YW5jZS5jb25zdHJ1Y3Rvci5uZ0RpcmVjdGl2ZURlZjtcbn1cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBlbGVtZW50IHdpdGhpbiB0aGUgZ2l2ZW4gTFZpZXdEYXRhIGFuZCByZXR1cm5zIHRoZSBtYXRjaGluZyBpbmRleFxuICovXG5mdW5jdGlvbiBmaW5kVmlhTmF0aXZlRWxlbWVudChsVmlld0RhdGE6IExWaWV3RGF0YSwgbmF0aXZlOiBSRWxlbWVudCk6IG51bWJlciB7XG4gIGxldCB0Tm9kZSA9IGxWaWV3RGF0YVtUVklFV10uZmlyc3RDaGlsZDtcbiAgd2hpbGUgKHROb2RlKSB7XG4gICAgY29uc3QgbE5vZGUgPSBnZXRMTm9kZUZyb21WaWV3RGF0YShsVmlld0RhdGEsIHROb2RlLmluZGV4KSAhO1xuICAgIGlmIChsTm9kZS5uYXRpdmUgPT09IG5hdGl2ZSkge1xuICAgICAgcmV0dXJuIHROb2RlLmluZGV4O1xuICAgIH1cbiAgICB0Tm9kZSA9IHRyYXZlcnNlTmV4dEVsZW1lbnQodE5vZGUpO1xuICB9XG5cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIG5leHQgdE5vZGUgKGNoaWxkLCBzaWJsaW5nIG9yIHBhcmVudCkuXG4gKi9cbmZ1bmN0aW9uIHRyYXZlcnNlTmV4dEVsZW1lbnQodE5vZGU6IFROb2RlKTogVE5vZGV8bnVsbCB7XG4gIGlmICh0Tm9kZS5jaGlsZCkge1xuICAgIHJldHVybiB0Tm9kZS5jaGlsZDtcbiAgfSBlbHNlIGlmICh0Tm9kZS5uZXh0KSB7XG4gICAgcmV0dXJuIHROb2RlLm5leHQ7XG4gIH0gZWxzZSBpZiAodE5vZGUucGFyZW50KSB7XG4gICAgcmV0dXJuIHROb2RlLnBhcmVudC5uZXh0IHx8IG51bGw7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogTG9jYXRlcyB0aGUgY29tcG9uZW50IHdpdGhpbiB0aGUgZ2l2ZW4gTFZpZXdEYXRhIGFuZCByZXR1cm5zIHRoZSBtYXRjaGluZyBpbmRleFxuICovXG5mdW5jdGlvbiBmaW5kVmlhQ29tcG9uZW50KGxWaWV3RGF0YTogTFZpZXdEYXRhLCBjb21wb25lbnRJbnN0YW5jZToge30pOiBudW1iZXIge1xuICBjb25zdCBjb21wb25lbnRJbmRpY2VzID0gbFZpZXdEYXRhW1RWSUVXXS5jb21wb25lbnRzO1xuICBpZiAoY29tcG9uZW50SW5kaWNlcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50SW5kaWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZWxlbWVudENvbXBvbmVudEluZGV4ID0gY29tcG9uZW50SW5kaWNlc1tpXTtcbiAgICAgIGNvbnN0IGxOb2RlRGF0YSA9IHJlYWRFbGVtZW50VmFsdWUobFZpZXdEYXRhW2VsZW1lbnRDb21wb25lbnRJbmRleF0gISkuZGF0YSAhO1xuICAgICAgaWYgKGxOb2RlRGF0YVtDT05URVhUXSA9PT0gY29tcG9uZW50SW5zdGFuY2UpIHtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnRDb21wb25lbnRJbmRleDtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qgcm9vdE5vZGUgPSBsVmlld0RhdGFbSEVBREVSX09GRlNFVF07XG4gICAgY29uc3Qgcm9vdENvbXBvbmVudCA9IHJvb3ROb2RlLmRhdGFbQ09OVEVYVF07XG4gICAgaWYgKHJvb3RDb21wb25lbnQgPT09IGNvbXBvbmVudEluc3RhbmNlKSB7XG4gICAgICAvLyB3ZSBhcmUgZGVhbGluZyB3aXRoIHRoZSByb290IGVsZW1lbnQgaGVyZSB0aGVyZWZvcmUgd2Uga25vdyB0aGF0IHRoZVxuICAgICAgLy8gZWxlbWVudCBpcyB0aGUgdmVyeSBmaXJzdCBlbGVtZW50IGFmdGVyIHRoZSBIRUFERVIgZGF0YSBpbiB0aGUgbFZpZXdcbiAgICAgIHJldHVybiBIRUFERVJfT0ZGU0VUO1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuICogTG9jYXRlcyB0aGUgZGlyZWN0aXZlIHdpdGhpbiB0aGUgZ2l2ZW4gTFZpZXdEYXRhIGFuZCByZXR1cm5zIHRoZSBtYXRjaGluZyBpbmRleFxuICovXG5mdW5jdGlvbiBmaW5kVmlhRGlyZWN0aXZlKGxWaWV3RGF0YTogTFZpZXdEYXRhLCBkaXJlY3RpdmVJbnN0YW5jZToge30pOiBudW1iZXIge1xuICAvLyBpZiBhIGRpcmVjdGl2ZSBpcyBtb25rZXkgcGF0Y2hlZCB0aGVuIGl0IHdpbGwgKGJ5IGRlZmF1bHQpXG4gIC8vIGhhdmUgYSByZWZlcmVuY2UgdG8gdGhlIExWaWV3RGF0YSBvZiB0aGUgY3VycmVudCB2aWV3LiBUaGVcbiAgLy8gZWxlbWVudCBib3VuZCB0byB0aGUgZGlyZWN0aXZlIGJlaW5nIHNlYXJjaCBsaXZlcyBzb21ld2hlcmVcbiAgLy8gaW4gdGhlIHZpZXcgZGF0YS4gQnkgZmlyc3QgY2hlY2tpbmcgdG8gc2VlIGlmIHRoZSBpbnN0YW5jZVxuICAvLyBpcyBhY3R1YWxseSBwcmVzZW50IHdlIGNhbiBuYXJyb3cgZG93biB0byB3aGljaCBsRWxlbWVudE5vZGVcbiAgLy8gY29udGFpbnMgdGhlIGluc3RhbmNlIG9mIHRoZSBkaXJlY3RpdmUgYW5kIHRoZW4gcmV0dXJuIHRoZSBpbmRleFxuICBjb25zdCBkaXJlY3RpdmVzQWNyb3NzVmlldyA9IGxWaWV3RGF0YVtESVJFQ1RJVkVTXTtcbiAgY29uc3QgZGlyZWN0aXZlSW5kZXggPVxuICAgICAgZGlyZWN0aXZlc0Fjcm9zc1ZpZXcgPyBkaXJlY3RpdmVzQWNyb3NzVmlldy5pbmRleE9mKGRpcmVjdGl2ZUluc3RhbmNlKSA6IC0xO1xuICBpZiAoZGlyZWN0aXZlSW5kZXggPj0gMCkge1xuICAgIGxldCB0Tm9kZSA9IGxWaWV3RGF0YVtUVklFV10uZmlyc3RDaGlsZDtcbiAgICB3aGlsZSAodE5vZGUpIHtcbiAgICAgIGNvbnN0IGxOb2RlID0gZ2V0TE5vZGVGcm9tVmlld0RhdGEobFZpZXdEYXRhLCB0Tm9kZS5pbmRleCkgITtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4U3RhcnQgPSBnZXREaXJlY3RpdmVTdGFydEluZGV4KGxOb2RlKTtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4RW5kID0gZ2V0RGlyZWN0aXZlRW5kSW5kZXgobE5vZGUsIGRpcmVjdGl2ZUluZGV4U3RhcnQpO1xuICAgICAgaWYgKGRpcmVjdGl2ZUluZGV4ID49IGRpcmVjdGl2ZUluZGV4U3RhcnQgJiYgZGlyZWN0aXZlSW5kZXggPCBkaXJlY3RpdmVJbmRleEVuZCkge1xuICAgICAgICByZXR1cm4gdE5vZGUuaW5kZXg7XG4gICAgICB9XG4gICAgICB0Tm9kZSA9IHRyYXZlcnNlTmV4dEVsZW1lbnQodE5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAtMTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0RG9tRWxlbWVudChlbGVtZW50OiBhbnkpIHtcbiAgYXNzZXJ0RXF1YWwoZWxlbWVudC5ub2RlVHlwZSwgMSwgJ1RoZSBwcm92aWRlZCB2YWx1ZSBtdXN0IGJlIGFuIGluc3RhbmNlIG9mIGFuIEhUTUxFbGVtZW50Jyk7XG59XG5cbi8qKlxuICogUmV0cnVucyB0aGUgaW5zdGFuY2Ugb2YgdGhlIExFbGVtZW50Tm9kZSBhdCB0aGUgZ2l2ZW4gaW5kZXggaW4gdGhlIExWaWV3RGF0YS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgYWxzbyB1bndyYXAgdGhlIGlubmVyIHZhbHVlIGluY2FzZSBpdCdzIHN0dWZmZWQgaW50byBhblxuICogYXJyYXkgKHdoaWNoIGlzIHdoYXQgaGFwcGVucyB3aGVuIFtzdHlsZV0gYW5kIFtjbGFzc10gYmluZGluZ3MgYXJlIHByZXNlbnRcbiAqIGluIHRoZSB2aWV3IGluc3RydWN0aW9ucyBmb3IgdGhlIGVsZW1lbnQgYmVpbmcgcmV0dXJuZWQpLlxuICovXG5mdW5jdGlvbiBnZXRMTm9kZUZyb21WaWV3RGF0YShsVmlld0RhdGE6IExWaWV3RGF0YSwgbEVsZW1lbnRJbmRleDogbnVtYmVyKTogTEVsZW1lbnROb2RlfG51bGwge1xuICBjb25zdCB2YWx1ZSA9IGxWaWV3RGF0YVtsRWxlbWVudEluZGV4XTtcbiAgcmV0dXJuIHZhbHVlID8gcmVhZEVsZW1lbnRWYWx1ZSh2YWx1ZSkgOiBudWxsO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBjb2xsZWN0aW9uIG9mIGRpcmVjdGl2ZSBpbmRleCB2YWx1ZXMgdGhhdCBhcmUgdXNlZCBvbiB0aGUgZWxlbWVudFxuICogKHdoaWNoIGlzIHJlZmVyZW5jZWQgYnkgdGhlIGxOb2RlSW5kZXgpXG4gKi9cbmZ1bmN0aW9uIGRpc2NvdmVyRGlyZWN0aXZlSW5kaWNlcyhsVmlld0RhdGE6IExWaWV3RGF0YSwgbE5vZGVJbmRleDogbnVtYmVyKTogbnVtYmVyW118bnVsbCB7XG4gIGNvbnN0IGRpcmVjdGl2ZXNBY3Jvc3NWaWV3ID0gbFZpZXdEYXRhW0RJUkVDVElWRVNdO1xuICBjb25zdCBsTm9kZSA9IGdldExOb2RlRnJvbVZpZXdEYXRhKGxWaWV3RGF0YSwgbE5vZGVJbmRleCk7XG4gIGlmIChsTm9kZSAmJiBkaXJlY3RpdmVzQWNyb3NzVmlldyAmJiBkaXJlY3RpdmVzQWNyb3NzVmlldy5sZW5ndGgpIHtcbiAgICAvLyB0aGlzIGNoZWNrIGZvciB0Tm9kZSBpcyB0byBkZXRlcm1pbmUgaWYgdGhlIGNhbHVlIGlzIGEgTEVtZW1lbnROb2RlIGluc3RhbmNlXG4gICAgY29uc3QgZGlyZWN0aXZlSW5kZXhTdGFydCA9IGdldERpcmVjdGl2ZVN0YXJ0SW5kZXgobE5vZGUpO1xuICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4RW5kID0gZ2V0RGlyZWN0aXZlRW5kSW5kZXgobE5vZGUsIGRpcmVjdGl2ZUluZGV4U3RhcnQpO1xuICAgIGNvbnN0IGRpcmVjdGl2ZUluZGljZXM6IG51bWJlcltdID0gW107XG4gICAgZm9yIChsZXQgaSA9IGRpcmVjdGl2ZUluZGV4U3RhcnQ7IGkgPCBkaXJlY3RpdmVJbmRleEVuZDsgaSsrKSB7XG4gICAgICAvLyBzcGVjaWFsIGNhc2Ugc2luY2UgdGhlIGluc3RhbmNlIG9mIHRoZSBjb21wb25lbnQgKGlmIGl0IGV4aXN0cylcbiAgICAgIC8vIGlzIHN0b3JlZCBpbiB0aGUgZGlyZWN0aXZlcyBhcnJheS5cbiAgICAgIGlmIChpID4gZGlyZWN0aXZlSW5kZXhTdGFydCB8fFxuICAgICAgICAgICFpc0NvbXBvbmVudEluc3RhbmNlKGRpcmVjdGl2ZXNBY3Jvc3NWaWV3W2RpcmVjdGl2ZUluZGV4U3RhcnRdKSkge1xuICAgICAgICBkaXJlY3RpdmVJbmRpY2VzLnB1c2goaSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkaXJlY3RpdmVJbmRpY2VzLmxlbmd0aCA/IGRpcmVjdGl2ZUluZGljZXMgOiBudWxsO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBkaXNjb3ZlckRpcmVjdGl2ZXMobFZpZXdEYXRhOiBMVmlld0RhdGEsIGRpcmVjdGl2ZUluZGljZXM6IG51bWJlcltdKTogbnVtYmVyW118bnVsbCB7XG4gIGNvbnN0IGRpcmVjdGl2ZXM6IGFueVtdID0gW107XG4gIGNvbnN0IGRpcmVjdGl2ZUluc3RhbmNlcyA9IGxWaWV3RGF0YVtESVJFQ1RJVkVTXTtcbiAgaWYgKGRpcmVjdGl2ZUluc3RhbmNlcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlSW5kaWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBkaXJlY3RpdmVJbmRpY2VzW2ldO1xuICAgICAgY29uc3QgZGlyZWN0aXZlID0gZGlyZWN0aXZlSW5zdGFuY2VzW2RpcmVjdGl2ZUluZGV4XTtcbiAgICAgIGRpcmVjdGl2ZXMucHVzaChkaXJlY3RpdmUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGlyZWN0aXZlcztcbn1cblxuZnVuY3Rpb24gZ2V0RGlyZWN0aXZlU3RhcnRJbmRleChsTm9kZTogTEVsZW1lbnROb2RlKTogbnVtYmVyIHtcbiAgLy8gdGhlIHROb2RlIGluc3RhbmNlcyBzdG9yZSBhIGZsYWcgdmFsdWUgd2hpY2ggdGhlbiBoYXMgYVxuICAvLyBwb2ludGVyIHdoaWNoIHRlbGxzIHRoZSBzdGFydGluZyBpbmRleCBvZiB3aGVyZSBhbGwgdGhlXG4gIC8vIGFjdGl2ZSBkaXJlY3RpdmVzIGFyZSBpbiB0aGUgbWFzdGVyIGRpcmVjdGl2ZSBhcnJheVxuICByZXR1cm4gbE5vZGUudE5vZGUuZmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG59XG5cbmZ1bmN0aW9uIGdldERpcmVjdGl2ZUVuZEluZGV4KGxOb2RlOiBMRWxlbWVudE5vZGUsIHN0YXJ0SW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIC8vIFRoZSBlbmQgdmFsdWUgaXMgYWxzbyBhcGFydCBvZiB0aGUgc2FtZSBmbGFnXG4gIC8vIChzZWUgYFROb2RlRmxhZ3NgIHRvIHNlZSBob3cgdGhlIGZsYWcgYml0IHNoaWZ0aW5nXG4gIC8vIHZhbHVlcyBhcmUgdXNlZCkuXG4gIGNvbnN0IGNvdW50ID0gbE5vZGUudE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaztcbiAgcmV0dXJuIGNvdW50ID8gKHN0YXJ0SW5kZXggKyBjb3VudCkgOiAtMTtcbn1cbiJdfQ==