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
export const MONKEY_PATCH_KEY_NAME = '__ngContext__';
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
    let mpValue = readPatchedData(target);
    if (mpValue) {
        // only when it's an array is it considered an LViewData instance
        // ... otherwise it's an already constructed LContext instance
        if (Array.isArray(mpValue)) {
            const lViewData = mpValue;
            let lNodeIndex;
            let component = undefined;
            let directiveIndices = undefined;
            let directives = undefined;
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
            const lNode = getLNodeFromViewData(lViewData, lNodeIndex);
            const existingCtx = readPatchedData(lNode.native);
            const context = (existingCtx && !Array.isArray(existingCtx)) ?
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
                for (let i = 0; i < directives.length; i++) {
                    attachPatchData(directives[i], context);
                }
            }
            attachPatchData(context.native, context);
            mpValue = context;
        }
    }
    else {
        const rElement = target;
        ngDevMode && assertDomElement(rElement);
        // if the context is not found then we need to traverse upwards up the DOM
        // to find the nearest element that has already been monkey patched with data
        let parent = rElement;
        while (parent = parent.parentNode) {
            const parentContext = readPatchedData(parent);
            if (parentContext) {
                let lViewData;
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
                const index = findViaNativeElement(lViewData, rElement);
                if (index >= 0) {
                    const lNode = getLNodeFromViewData(lViewData, index);
                    const context = createLContext(lViewData, index, lNode.native);
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
        lViewData,
        lNodeIndex,
        native,
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
    const context = getContext(target);
    return context ? getLNodeFromViewData(context.lViewData, context.lNodeIndex) : null;
}
export function getLElementFromRootComponent(rootComponentInstance) {
    // the host element for the root component is ALWAYS the first element
    // in the lViewData array (which is where HEADER_OFFSET points to)
    const lViewData = readPatchedLViewData(rootComponentInstance);
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
    let lViewData = readPatchedData(componentInstance);
    let lNode;
    if (Array.isArray(lViewData)) {
        const lNodeIndex = findViaComponent(lViewData, componentInstance);
        lNode = readElementValue(lViewData[lNodeIndex]);
        const context = createLContext(lViewData, lNodeIndex, lNode.native);
        context.component = componentInstance;
        attachPatchData(componentInstance, context);
        attachPatchData(context.native, context);
    }
    else {
        const context = lViewData;
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
    const value = readPatchedData(target);
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
    let tNode = lViewData[TVIEW].firstChild;
    while (tNode) {
        const lNode = getLNodeFromViewData(lViewData, tNode.index);
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
    const componentIndices = lViewData[TVIEW].components;
    if (componentIndices) {
        for (let i = 0; i < componentIndices.length; i++) {
            const elementComponentIndex = componentIndices[i];
            const lNodeData = readElementValue(lViewData[elementComponentIndex]).data;
            if (lNodeData[CONTEXT] === componentInstance) {
                return elementComponentIndex;
            }
        }
    }
    else {
        const rootNode = lViewData[HEADER_OFFSET];
        const rootComponent = rootNode.data[CONTEXT];
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
    const directivesAcrossView = lViewData[DIRECTIVES];
    const directiveIndex = directivesAcrossView ? directivesAcrossView.indexOf(directiveInstance) : -1;
    if (directiveIndex >= 0) {
        let tNode = lViewData[TVIEW].firstChild;
        while (tNode) {
            const lNode = getLNodeFromViewData(lViewData, tNode.index);
            const directiveIndexStart = getDirectiveStartIndex(lNode);
            const directiveIndexEnd = getDirectiveEndIndex(lNode, directiveIndexStart);
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
    const value = lViewData[lElementIndex];
    return value ? readElementValue(value) : null;
}
/**
 * Returns a collection of directive index values that are used on the element
 * (which is referenced by the lNodeIndex)
 */
function discoverDirectiveIndices(lViewData, lNodeIndex) {
    const directivesAcrossView = lViewData[DIRECTIVES];
    const lNode = getLNodeFromViewData(lViewData, lNodeIndex);
    if (lNode && directivesAcrossView && directivesAcrossView.length) {
        // this check for tNode is to determine if the calue is a LEmementNode instance
        const directiveIndexStart = getDirectiveStartIndex(lNode);
        const directiveIndexEnd = getDirectiveEndIndex(lNode, directiveIndexStart);
        const directiveIndices = [];
        for (let i = directiveIndexStart; i < directiveIndexEnd; i++) {
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
    const directives = [];
    const directiveInstances = lViewData[DIRECTIVES];
    if (directiveInstances) {
        for (let i = 0; i < directiveIndices.length; i++) {
            const directiveIndex = directiveIndices[i];
            const directive = directiveInstances[directiveIndex];
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
    const count = lNode.tNode.flags & 4095 /* DirectiveCountMask */;
    return count ? (startIndex + count) : -1;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9kaXNjb3ZlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2NvbnRleHRfZGlzY292ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFHckMsT0FBTyxFQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsYUFBYSxFQUFhLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3ZGLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUV4Qzs7R0FFRztBQUNILE1BQU0sQ0FBQyxNQUFNLHFCQUFxQixHQUFHLGVBQWUsQ0FBQztBQWdDckQ7Ozs7Ozs7Ozs7Ozs7Ozs7R0FnQkc7QUFDSCxNQUFNLFVBQVUsVUFBVSxDQUFDLE1BQVc7SUFDcEMsSUFBSSxPQUFPLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3RDLElBQUksT0FBTyxFQUFFO1FBQ1gsaUVBQWlFO1FBQ2pFLDhEQUE4RDtRQUM5RCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDMUIsTUFBTSxTQUFTLEdBQWMsT0FBUyxDQUFDO1lBQ3ZDLElBQUksVUFBa0IsQ0FBQztZQUN2QixJQUFJLFNBQVMsR0FBUSxTQUFTLENBQUM7WUFDL0IsSUFBSSxnQkFBZ0IsR0FBNEIsU0FBUyxDQUFDO1lBQzFELElBQUksVUFBVSxHQUF5QixTQUFTLENBQUM7WUFFakQsSUFBSSxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDL0IsVUFBVSxHQUFHLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDakQsSUFBSSxVQUFVLElBQUksQ0FBQyxDQUFDLEVBQUU7b0JBQ3BCLE1BQU0sSUFB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QUksQ0FBQztBQUNkLENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUFDLFNBQW9CLEVBQUUsZ0JBQTBCO0lBQzFFLE1BQU0sVUFBVSxHQUFVLEVBQUUsQ0FBQztJQUM3QixNQUFNLGtCQUFrQixHQUFHLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNqRCxJQUFJLGtCQUFrQixFQUFFO1FBQ3RCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDaEQsTUFBTSxjQUFjLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0MsTUFBTSxTQUFTLEdBQUcsa0JBQWtCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDckQsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUM1QjtLQUNGO0lBQ0QsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQztBQUVELFNBQVMsc0JBQXNCLENBQUMsS0FBbUI7SUFDakQsMERBQTBEO0lBQzFELDBEQUEwRDtJQUMxRCxzREFBc0Q7SUFDdEQsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssd0NBQTBDLENBQUM7QUFDckUsQ0FBQztBQUVELFNBQVMsb0JBQW9CLENBQUMsS0FBbUIsRUFBRSxVQUFrQjtJQUNuRSwrQ0FBK0M7SUFDL0MscURBQXFEO0lBQ3JELG9CQUFvQjtJQUNwQixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssZ0NBQWdDLENBQUM7SUFDaEUsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICcuL25nX2Rldl9tb2RlJztcblxuaW1wb3J0IHthc3NlcnRFcXVhbH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtMRWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtDT05URVhULCBESVJFQ1RJVkVTLCBIRUFERVJfT0ZGU0VULCBMVmlld0RhdGEsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge3JlYWRFbGVtZW50VmFsdWV9IGZyb20gJy4vdXRpbCc7XG5cbi8qKlxuICogVGhpcyBwcm9wZXJ0eSB3aWxsIGJlIG1vbmtleS1wYXRjaGVkIG9uIGVsZW1lbnRzLCBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzXG4gKi9cbmV4cG9ydCBjb25zdCBNT05LRVlfUEFUQ0hfS0VZX05BTUUgPSAnX19uZ0NvbnRleHRfXyc7XG5cbi8qKlxuICogVGhlIGludGVybmFsIHZpZXcgY29udGV4dCB3aGljaCBpcyBzcGVjaWZpYyB0byBhIGdpdmVuIERPTSBlbGVtZW50LCBkaXJlY3RpdmUgb3JcbiAqIGNvbXBvbmVudCBpbnN0YW5jZS4gRWFjaCB2YWx1ZSBpbiBoZXJlIChiZXNpZGVzIHRoZSBMVmlld0RhdGEgYW5kIGVsZW1lbnQgbm9kZSBkZXRhaWxzKVxuICogY2FuIGJlIHByZXNlbnQsIG51bGwgb3IgdW5kZWZpbmVkLiBJZiB1bmRlZmluZWQgdGhlbiBpdCBpbXBsaWVzIHRoZSB2YWx1ZSBoYXMgbm90IGJlZW5cbiAqIGxvb2tlZCB1cCB5ZXQsIG90aGVyd2lzZSwgaWYgbnVsbCwgdGhlbiBhIGxvb2t1cCB3YXMgZXhlY3V0ZWQgYW5kIG5vdGhpbmcgd2FzIGZvdW5kLlxuICpcbiAqIEVhY2ggdmFsdWUgd2lsbCBnZXQgZmlsbGVkIHdoZW4gdGhlIHJlc3BlY3RpdmUgdmFsdWUgaXMgZXhhbWluZWQgd2l0aGluIHRoZSBnZXRDb250ZXh0XG4gKiBmdW5jdGlvbi4gVGhlIGNvbXBvbmVudCwgZWxlbWVudCBhbmQgZWFjaCBkaXJlY3RpdmUgaW5zdGFuY2Ugd2lsbCBzaGFyZSB0aGUgc2FtZSBpbnN0YW5jZVxuICogb2YgdGhlIGNvbnRleHQuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTENvbnRleHQge1xuICAvKiogVGhlIGNvbXBvbmVudFxcJ3MgdmlldyBkYXRhICovXG4gIGxWaWV3RGF0YTogTFZpZXdEYXRhO1xuXG4gIC8qKiBUaGUgaW5kZXggaW5zdGFuY2Ugb2YgdGhlIExOb2RlICovXG4gIGxOb2RlSW5kZXg6IG51bWJlcjtcblxuICAvKiogVGhlIGluc3RhbmNlIG9mIHRoZSBET00gbm9kZSB0aGF0IGlzIGF0dGFjaGVkIHRvIHRoZSBsTm9kZSAqL1xuICBuYXRpdmU6IFJFbGVtZW50O1xuXG4gIC8qKiBUaGUgaW5zdGFuY2Ugb2YgdGhlIENvbXBvbmVudCBub2RlICovXG4gIGNvbXBvbmVudDoge318bnVsbHx1bmRlZmluZWQ7XG5cbiAgLyoqIFRoZSBsaXN0IG9mIGluZGljZXMgZm9yIHRoZSBhY3RpdmUgZGlyZWN0aXZlcyB0aGF0IGV4aXN0IG9uIHRoaXMgZWxlbWVudCAqL1xuICBkaXJlY3RpdmVJbmRpY2VzOiBudW1iZXJbXXxudWxsfHVuZGVmaW5lZDtcblxuICAvKiogVGhlIGxpc3Qgb2YgYWN0aXZlIGRpcmVjdGl2ZXMgdGhhdCBleGlzdCBvbiB0aGlzIGVsZW1lbnQgKi9cbiAgZGlyZWN0aXZlczogQXJyYXk8e30+fG51bGx8dW5kZWZpbmVkO1xufVxuXG4vKiogUmV0dXJucyB0aGUgbWF0Y2hpbmcgYExDb250ZXh0YCBkYXRhIGZvciBhIGdpdmVuIERPTSBub2RlLCBkaXJlY3RpdmUgb3IgY29tcG9uZW50IGluc3RhbmNlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBleGFtaW5lIHRoZSBwcm92aWRlZCBET00gZWxlbWVudCwgY29tcG9uZW50LCBvciBkaXJlY3RpdmUgaW5zdGFuY2VcXCdzXG4gKiBtb25rZXktcGF0Y2hlZCBwcm9wZXJ0eSB0byBkZXJpdmUgdGhlIGBMQ29udGV4dGAgZGF0YS4gT25jZSBjYWxsZWQgdGhlbiB0aGUgbW9ua2V5LXBhdGNoZWRcbiAqIHZhbHVlIHdpbGwgYmUgdGhhdCBvZiB0aGUgbmV3bHkgY3JlYXRlZCBgTENvbnRleHRgLlxuICpcbiAqIElmIHRoZSBtb25rZXktcGF0Y2hlZCB2YWx1ZSBpcyB0aGUgYExWaWV3RGF0YWAgaW5zdGFuY2UgdGhlbiB0aGUgY29udGV4dCB2YWx1ZSBmb3IgdGhhdFxuICogdGFyZ2V0IHdpbGwgYmUgY3JlYXRlZCBhbmQgdGhlIG1vbmtleS1wYXRjaCByZWZlcmVuY2Ugd2lsbCBiZSB1cGRhdGVkLiBUaGVyZWZvcmUgd2hlbiB0aGlzXG4gKiBmdW5jdGlvbiBpcyBjYWxsZWQgaXQgbWF5IG11dGF0ZSB0aGUgcHJvdmlkZWQgZWxlbWVudFxcJ3MsIGNvbXBvbmVudFxcJ3Mgb3IgYW55IG9mIHRoZSBhc3NvY2lhdGVkXG4gKiBkaXJlY3RpdmVcXCdzIG1vbmtleS1wYXRjaCB2YWx1ZXMuXG4gKlxuICogSWYgdGhlIG1vbmtleS1wYXRjaCB2YWx1ZSBpcyBub3QgZGV0ZWN0ZWQgdGhlbiB0aGUgY29kZSB3aWxsIHdhbGsgdXAgdGhlIERPTSB1bnRpbCBhbiBlbGVtZW50XG4gKiBpcyBmb3VuZCB3aGljaCBjb250YWlucyBhIG1vbmtleS1wYXRjaCByZWZlcmVuY2UuIFdoZW4gdGhhdCBvY2N1cnMgdGhlbiB0aGUgcHJvdmlkZWQgZWxlbWVudFxuICogd2lsbCBiZSB1cGRhdGVkIHdpdGggYSBuZXcgY29udGV4dCAod2hpY2ggaXMgdGhlbiByZXR1cm5lZCkuIElmIHRoZSBtb25rZXktcGF0Y2ggdmFsdWUgaXMgbm90XG4gKiBkZXRlY3RlZCBmb3IgYSBjb21wb25lbnQvZGlyZWN0aXZlIGluc3RhbmNlIHRoZW4gaXQgd2lsbCB0aHJvdyBhbiBlcnJvciAoYWxsIGNvbXBvbmVudHMgYW5kXG4gKiBkaXJlY3RpdmVzIHNob3VsZCBiZSBhdXRvbWF0aWNhbGx5IG1vbmtleS1wYXRjaGVkIGJ5IGl2eSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb250ZXh0KHRhcmdldDogYW55KTogTENvbnRleHR8bnVsbCB7XG4gIGxldCBtcFZhbHVlID0gcmVhZFBhdGNoZWREYXRhKHRhcmdldCk7XG4gIGlmIChtcFZhbHVlKSB7XG4gICAgLy8gb25seSB3aGVuIGl0J3MgYW4gYXJyYXkgaXMgaXQgY29uc2lkZXJlZCBhbiBMVmlld0RhdGEgaW5zdGFuY2VcbiAgICAvLyAuLi4gb3RoZXJ3aXNlIGl0J3MgYW4gYWxyZWFkeSBjb25zdHJ1Y3RlZCBMQ29udGV4dCBpbnN0YW5jZVxuICAgIGlmIChBcnJheS5pc0FycmF5KG1wVmFsdWUpKSB7XG4gICAgICBjb25zdCBsVmlld0RhdGE6IExWaWV3RGF0YSA9IG1wVmFsdWUgITtcbiAgICAgIGxldCBsTm9kZUluZGV4OiBudW1iZXI7XG4gICAgICBsZXQgY29tcG9uZW50OiBhbnkgPSB1bmRlZmluZWQ7XG4gICAgICBsZXQgZGlyZWN0aXZlSW5kaWNlczogbnVtYmVyW118bnVsbHx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICBsZXQgZGlyZWN0aXZlczogYW55W118bnVsbHx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgICAgIGlmIChpc0NvbXBvbmVudEluc3RhbmNlKHRhcmdldCkpIHtcbiAgICAgICAgbE5vZGVJbmRleCA9IGZpbmRWaWFDb21wb25lbnQobFZpZXdEYXRhLCB0YXJnZXQpO1xuICAgICAgICBpZiAobE5vZGVJbmRleCA9PSAtMSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHByb3ZpZGVkIGNvbXBvbmVudCB3YXMgbm90IGZvdW5kIGluIHRoZSBhcHBsaWNhdGlvbicpO1xuICAgICAgICB9XG4gICAgICAgIGNvbXBvbmVudCA9IHRhcmdldDtcbiAgICAgIH0gZWxzZSBpZiAoaXNEaXJlY3RpdmVJbnN0YW5jZSh0YXJnZXQpKSB7XG4gICAgICAgIGxOb2RlSW5kZXggPSBmaW5kVmlhRGlyZWN0aXZlKGxWaWV3RGF0YSwgdGFyZ2V0KTtcbiAgICAgICAgaWYgKGxOb2RlSW5kZXggPT0gLTEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBwcm92aWRlZCBkaXJlY3RpdmUgd2FzIG5vdCBmb3VuZCBpbiB0aGUgYXBwbGljYXRpb24nKTtcbiAgICAgICAgfVxuICAgICAgICBkaXJlY3RpdmVJbmRpY2VzID0gZGlzY292ZXJEaXJlY3RpdmVJbmRpY2VzKGxWaWV3RGF0YSwgbE5vZGVJbmRleCk7XG4gICAgICAgIGRpcmVjdGl2ZXMgPSBkaXJlY3RpdmVJbmRpY2VzID8gZGlzY292ZXJEaXJlY3RpdmVzKGxWaWV3RGF0YSwgZGlyZWN0aXZlSW5kaWNlcykgOiBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbE5vZGVJbmRleCA9IGZpbmRWaWFOYXRpdmVFbGVtZW50KGxWaWV3RGF0YSwgdGFyZ2V0IGFzIFJFbGVtZW50KTtcbiAgICAgICAgaWYgKGxOb2RlSW5kZXggPT0gLTEpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyB0aGUgZ29hbCBpcyBub3QgdG8gZmlsbCB0aGUgZW50aXJlIGNvbnRleHQgZnVsbCBvZiBkYXRhIGJlY2F1c2UgdGhlIGxvb2t1cHNcbiAgICAgIC8vIGFyZSBleHBlbnNpdmUuIEluc3RlYWQsIG9ubHkgdGhlIHRhcmdldCBkYXRhICh0aGUgZWxlbWVudCwgY29tcG9udGVudCBvclxuICAgICAgLy8gZGlyZWN0aXZlIGRldGFpbHMpIGFyZSBmaWxsZWQgaW50byB0aGUgY29udGV4dC4gSWYgY2FsbGVkIG11bHRpcGxlIHRpbWVzXG4gICAgICAvLyB3aXRoIGRpZmZlcmVudCB0YXJnZXQgdmFsdWVzIHRoZW4gdGhlIG1pc3NpbmcgdGFyZ2V0IGRhdGEgd2lsbCBiZSBmaWxsZWQgaW4uXG4gICAgICBjb25zdCBsTm9kZSA9IGdldExOb2RlRnJvbVZpZXdEYXRhKGxWaWV3RGF0YSwgbE5vZGVJbmRleCkgITtcbiAgICAgIGNvbnN0IGV4aXN0aW5nQ3R4ID0gcmVhZFBhdGNoZWREYXRhKGxOb2RlLm5hdGl2ZSk7XG4gICAgICBjb25zdCBjb250ZXh0OiBMQ29udGV4dCA9IChleGlzdGluZ0N0eCAmJiAhQXJyYXkuaXNBcnJheShleGlzdGluZ0N0eCkpID9cbiAgICAgICAgICBleGlzdGluZ0N0eCA6XG4gICAgICAgICAgY3JlYXRlTENvbnRleHQobFZpZXdEYXRhLCBsTm9kZUluZGV4LCBsTm9kZS5uYXRpdmUpO1xuXG4gICAgICAvLyBvbmx5IHdoZW4gdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBkaXNjb3ZlcmVkIHRoZW4gdXBkYXRlIHRoZSBtb25rZXktcGF0Y2hcbiAgICAgIGlmIChjb21wb25lbnQgJiYgY29udGV4dC5jb21wb25lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb250ZXh0LmNvbXBvbmVudCA9IGNvbXBvbmVudDtcbiAgICAgICAgYXR0YWNoUGF0Y2hEYXRhKGNvbnRleHQuY29tcG9uZW50LCBjb250ZXh0KTtcbiAgICAgIH1cblxuICAgICAgLy8gb25seSB3aGVuIHRoZSBkaXJlY3RpdmVzIGhhdmUgYmVlbiBkaXNjb3ZlcmVkIHRoZW4gdXBkYXRlIHRoZSBtb25rZXktcGF0Y2hcbiAgICAgIGlmIChkaXJlY3RpdmVzICYmIGRpcmVjdGl2ZUluZGljZXMgJiYgY29udGV4dC5kaXJlY3RpdmVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGV4dC5kaXJlY3RpdmVJbmRpY2VzID0gZGlyZWN0aXZlSW5kaWNlcztcbiAgICAgICAgY29udGV4dC5kaXJlY3RpdmVzID0gZGlyZWN0aXZlcztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaXJlY3RpdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgYXR0YWNoUGF0Y2hEYXRhKGRpcmVjdGl2ZXNbaV0sIGNvbnRleHQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGF0dGFjaFBhdGNoRGF0YShjb250ZXh0Lm5hdGl2ZSwgY29udGV4dCk7XG4gICAgICBtcFZhbHVlID0gY29udGV4dDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgckVsZW1lbnQgPSB0YXJnZXQgYXMgUkVsZW1lbnQ7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERvbUVsZW1lbnQockVsZW1lbnQpO1xuXG4gICAgLy8gaWYgdGhlIGNvbnRleHQgaXMgbm90IGZvdW5kIHRoZW4gd2UgbmVlZCB0byB0cmF2ZXJzZSB1cHdhcmRzIHVwIHRoZSBET01cbiAgICAvLyB0byBmaW5kIHRoZSBuZWFyZXN0IGVsZW1lbnQgdGhhdCBoYXMgYWxyZWFkeSBiZWVuIG1vbmtleSBwYXRjaGVkIHdpdGggZGF0YVxuICAgIGxldCBwYXJlbnQgPSByRWxlbWVudCBhcyBhbnk7XG4gICAgd2hpbGUgKHBhcmVudCA9IHBhcmVudC5wYXJlbnROb2RlKSB7XG4gICAgICBjb25zdCBwYXJlbnRDb250ZXh0ID0gcmVhZFBhdGNoZWREYXRhKHBhcmVudCk7XG4gICAgICBpZiAocGFyZW50Q29udGV4dCkge1xuICAgICAgICBsZXQgbFZpZXdEYXRhOiBMVmlld0RhdGF8bnVsbDtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocGFyZW50Q29udGV4dCkpIHtcbiAgICAgICAgICBsVmlld0RhdGEgPSBwYXJlbnRDb250ZXh0IGFzIExWaWV3RGF0YTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsVmlld0RhdGEgPSBwYXJlbnRDb250ZXh0LmxWaWV3RGF0YTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRoZSBlZGdlIG9mIHRoZSBhcHAgd2FzIGFsc28gcmVhY2hlZCBoZXJlIHRocm91Z2ggYW5vdGhlciBtZWFuc1xuICAgICAgICAvLyAobWF5YmUgYmVjYXVzZSB0aGUgRE9NIHdhcyBjaGFuZ2VkIG1hbnVhbGx5KS5cbiAgICAgICAgaWYgKCFsVmlld0RhdGEpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGluZGV4ID0gZmluZFZpYU5hdGl2ZUVsZW1lbnQobFZpZXdEYXRhLCByRWxlbWVudCk7XG4gICAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgICAgY29uc3QgbE5vZGUgPSBnZXRMTm9kZUZyb21WaWV3RGF0YShsVmlld0RhdGEsIGluZGV4KSAhO1xuICAgICAgICAgIGNvbnN0IGNvbnRleHQgPSBjcmVhdGVMQ29udGV4dChsVmlld0RhdGEsIGluZGV4LCBsTm9kZS5uYXRpdmUpO1xuICAgICAgICAgIGF0dGFjaFBhdGNoRGF0YShsTm9kZS5uYXRpdmUsIGNvbnRleHQpO1xuICAgICAgICAgIG1wVmFsdWUgPSBjb250ZXh0O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiAobXBWYWx1ZSBhcyBMQ29udGV4dCkgfHwgbnVsbDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGVtcHR5IGluc3RhbmNlIG9mIGEgYExDb250ZXh0YCBjb250ZXh0XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUxDb250ZXh0KGxWaWV3RGF0YTogTFZpZXdEYXRhLCBsTm9kZUluZGV4OiBudW1iZXIsIG5hdGl2ZTogUkVsZW1lbnQpOiBMQ29udGV4dCB7XG4gIHJldHVybiB7XG4gICAgbFZpZXdEYXRhLFxuICAgIGxOb2RlSW5kZXgsXG4gICAgbmF0aXZlLFxuICAgIGNvbXBvbmVudDogdW5kZWZpbmVkLFxuICAgIGRpcmVjdGl2ZUluZGljZXM6IHVuZGVmaW5lZCxcbiAgICBkaXJlY3RpdmVzOiB1bmRlZmluZWQsXG4gIH07XG59XG5cbi8qKlxuICogQSB1dGlsaXR5IGZ1bmN0aW9uIGZvciByZXRyaWV2aW5nIHRoZSBtYXRjaGluZyBsRWxlbWVudE5vZGVcbiAqIGZyb20gYSBnaXZlbiBET00gZWxlbWVudCwgY29tcG9uZW50IG9yIGRpcmVjdGl2ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExFbGVtZW50Tm9kZSh0YXJnZXQ6IGFueSk6IExFbGVtZW50Tm9kZXxudWxsIHtcbiAgY29uc3QgY29udGV4dCA9IGdldENvbnRleHQodGFyZ2V0KTtcbiAgcmV0dXJuIGNvbnRleHQgPyBnZXRMTm9kZUZyb21WaWV3RGF0YShjb250ZXh0LmxWaWV3RGF0YSwgY29udGV4dC5sTm9kZUluZGV4KSA6IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRMRWxlbWVudEZyb21Sb290Q29tcG9uZW50KHJvb3RDb21wb25lbnRJbnN0YW5jZToge30pOiBMRWxlbWVudE5vZGV8bnVsbCB7XG4gIC8vIHRoZSBob3N0IGVsZW1lbnQgZm9yIHRoZSByb290IGNvbXBvbmVudCBpcyBBTFdBWVMgdGhlIGZpcnN0IGVsZW1lbnRcbiAgLy8gaW4gdGhlIGxWaWV3RGF0YSBhcnJheSAod2hpY2ggaXMgd2hlcmUgSEVBREVSX09GRlNFVCBwb2ludHMgdG8pXG4gIGNvbnN0IGxWaWV3RGF0YSA9IHJlYWRQYXRjaGVkTFZpZXdEYXRhKHJvb3RDb21wb25lbnRJbnN0YW5jZSkgITtcbiAgcmV0dXJuIHJlYWRFbGVtZW50VmFsdWUobFZpZXdEYXRhW0hFQURFUl9PRkZTRVRdKTtcbn1cblxuLyoqXG4gKiBBIHNpbXBsaWZpZWQgbG9va3VwIGZ1bmN0aW9uIGZvciBmaW5kaW5nIHRoZSBMRWxlbWVudE5vZGUgZnJvbSBhIGNvbXBvbmVudCBpbnN0YW5jZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGV4aXN0cyBmb3IgdHJlZS1zaGFraW5nIHB1cnBvc2VzIHRvIGF2b2lkIGhhdmluZyB0byBwdWxsIGluIGV2ZXJ5dGhpbmdcbiAqIHRoYXQgYGdldENvbnRleHRgIGhhcyBpbiB0aGUgZXZlbnQgdGhhdCBhbiBBbmd1bGFyIGFwcGxpY2F0aW9uIGRvZXNuJ3QgbmVlZCB0byBoYXZlXG4gKiBhbnkgcHJvZ3JhbW1hdGljIGFjY2VzcyB0byBhbiBlbGVtZW50J3MgY29udGV4dCAob25seSBjaGFuZ2UgZGV0ZWN0aW9uIHVzZXMgdGhpcyBmdW5jdGlvbikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMRWxlbWVudEZyb21Db21wb25lbnQoY29tcG9uZW50SW5zdGFuY2U6IHt9KTogTEVsZW1lbnROb2RlfG51bGwge1xuICBsZXQgbFZpZXdEYXRhID0gcmVhZFBhdGNoZWREYXRhKGNvbXBvbmVudEluc3RhbmNlKTtcbiAgbGV0IGxOb2RlOiBMRWxlbWVudE5vZGU7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkobFZpZXdEYXRhKSkge1xuICAgIGNvbnN0IGxOb2RlSW5kZXggPSBmaW5kVmlhQ29tcG9uZW50KGxWaWV3RGF0YSwgY29tcG9uZW50SW5zdGFuY2UpO1xuICAgIGxOb2RlID0gcmVhZEVsZW1lbnRWYWx1ZShsVmlld0RhdGFbbE5vZGVJbmRleF0pO1xuICAgIGNvbnN0IGNvbnRleHQgPSBjcmVhdGVMQ29udGV4dChsVmlld0RhdGEsIGxOb2RlSW5kZXgsIGxOb2RlLm5hdGl2ZSk7XG4gICAgY29udGV4dC5jb21wb25lbnQgPSBjb21wb25lbnRJbnN0YW5jZTtcbiAgICBhdHRhY2hQYXRjaERhdGEoY29tcG9uZW50SW5zdGFuY2UsIGNvbnRleHQpO1xuICAgIGF0dGFjaFBhdGNoRGF0YShjb250ZXh0Lm5hdGl2ZSwgY29udGV4dCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgY29udGV4dCA9IGxWaWV3RGF0YSBhcyBhbnkgYXMgTENvbnRleHQ7XG4gICAgbE5vZGUgPSByZWFkRWxlbWVudFZhbHVlKGNvbnRleHQubFZpZXdEYXRhW2NvbnRleHQubE5vZGVJbmRleF0pO1xuICB9XG5cbiAgcmV0dXJuIGxOb2RlO1xufVxuXG4vKipcbiAqIEFzc2lnbnMgdGhlIGdpdmVuIGRhdGEgdG8gdGhlIGdpdmVuIHRhcmdldCAod2hpY2ggY291bGQgYmUgYSBjb21wb25lbnQsXG4gKiBkaXJlY3RpdmUgb3IgRE9NIG5vZGUgaW5zdGFuY2UpIHVzaW5nIG1vbmtleS1wYXRjaGluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaFBhdGNoRGF0YSh0YXJnZXQ6IGFueSwgZGF0YTogTFZpZXdEYXRhIHwgTENvbnRleHQpIHtcbiAgdGFyZ2V0W01PTktFWV9QQVRDSF9LRVlfTkFNRV0gPSBkYXRhO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIG1vbmtleS1wYXRjaCB2YWx1ZSBkYXRhIHByZXNlbnQgb24gdGhlIHRhcmdldCAod2hpY2ggY291bGQgYmVcbiAqIGEgY29tcG9uZW50LCBkaXJlY3RpdmUgb3IgYSBET00gbm9kZSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkUGF0Y2hlZERhdGEodGFyZ2V0OiBhbnkpOiBMVmlld0RhdGF8TENvbnRleHR8bnVsbCB7XG4gIHJldHVybiB0YXJnZXRbTU9OS0VZX1BBVENIX0tFWV9OQU1FXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRQYXRjaGVkTFZpZXdEYXRhKHRhcmdldDogYW55KTogTFZpZXdEYXRhfG51bGwge1xuICBjb25zdCB2YWx1ZSA9IHJlYWRQYXRjaGVkRGF0YSh0YXJnZXQpO1xuICBpZiAodmFsdWUpIHtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyB2YWx1ZSA6ICh2YWx1ZSBhcyBMQ29udGV4dCkubFZpZXdEYXRhO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb21wb25lbnRJbnN0YW5jZShpbnN0YW5jZTogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiBpbnN0YW5jZSAmJiBpbnN0YW5jZS5jb25zdHJ1Y3RvciAmJiBpbnN0YW5jZS5jb25zdHJ1Y3Rvci5uZ0NvbXBvbmVudERlZjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRGlyZWN0aXZlSW5zdGFuY2UoaW5zdGFuY2U6IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gaW5zdGFuY2UgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IubmdEaXJlY3RpdmVEZWY7XG59XG5cbi8qKlxuICogTG9jYXRlcyB0aGUgZWxlbWVudCB3aXRoaW4gdGhlIGdpdmVuIExWaWV3RGF0YSBhbmQgcmV0dXJucyB0aGUgbWF0Y2hpbmcgaW5kZXhcbiAqL1xuZnVuY3Rpb24gZmluZFZpYU5hdGl2ZUVsZW1lbnQobFZpZXdEYXRhOiBMVmlld0RhdGEsIG5hdGl2ZTogUkVsZW1lbnQpOiBudW1iZXIge1xuICBsZXQgdE5vZGUgPSBsVmlld0RhdGFbVFZJRVddLmZpcnN0Q2hpbGQ7XG4gIHdoaWxlICh0Tm9kZSkge1xuICAgIGNvbnN0IGxOb2RlID0gZ2V0TE5vZGVGcm9tVmlld0RhdGEobFZpZXdEYXRhLCB0Tm9kZS5pbmRleCkgITtcbiAgICBpZiAobE5vZGUubmF0aXZlID09PSBuYXRpdmUpIHtcbiAgICAgIHJldHVybiB0Tm9kZS5pbmRleDtcbiAgICB9XG4gICAgdE5vZGUgPSB0cmF2ZXJzZU5leHRFbGVtZW50KHROb2RlKTtcbiAgfVxuXG4gIHJldHVybiAtMTtcbn1cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBuZXh0IHROb2RlIChjaGlsZCwgc2libGluZyBvciBwYXJlbnQpLlxuICovXG5mdW5jdGlvbiB0cmF2ZXJzZU5leHRFbGVtZW50KHROb2RlOiBUTm9kZSk6IFROb2RlfG51bGwge1xuICBpZiAodE5vZGUuY2hpbGQpIHtcbiAgICByZXR1cm4gdE5vZGUuY2hpbGQ7XG4gIH0gZWxzZSBpZiAodE5vZGUubmV4dCkge1xuICAgIHJldHVybiB0Tm9kZS5uZXh0O1xuICB9IGVsc2UgaWYgKHROb2RlLnBhcmVudCkge1xuICAgIHJldHVybiB0Tm9kZS5wYXJlbnQubmV4dCB8fCBudWxsO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGNvbXBvbmVudCB3aXRoaW4gdGhlIGdpdmVuIExWaWV3RGF0YSBhbmQgcmV0dXJucyB0aGUgbWF0Y2hpbmcgaW5kZXhcbiAqL1xuZnVuY3Rpb24gZmluZFZpYUNvbXBvbmVudChsVmlld0RhdGE6IExWaWV3RGF0YSwgY29tcG9uZW50SW5zdGFuY2U6IHt9KTogbnVtYmVyIHtcbiAgY29uc3QgY29tcG9uZW50SW5kaWNlcyA9IGxWaWV3RGF0YVtUVklFV10uY29tcG9uZW50cztcbiAgaWYgKGNvbXBvbmVudEluZGljZXMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudEluZGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVsZW1lbnRDb21wb25lbnRJbmRleCA9IGNvbXBvbmVudEluZGljZXNbaV07XG4gICAgICBjb25zdCBsTm9kZURhdGEgPSByZWFkRWxlbWVudFZhbHVlKGxWaWV3RGF0YVtlbGVtZW50Q29tcG9uZW50SW5kZXhdICEpLmRhdGEgITtcbiAgICAgIGlmIChsTm9kZURhdGFbQ09OVEVYVF0gPT09IGNvbXBvbmVudEluc3RhbmNlKSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50Q29tcG9uZW50SW5kZXg7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHJvb3ROb2RlID0gbFZpZXdEYXRhW0hFQURFUl9PRkZTRVRdO1xuICAgIGNvbnN0IHJvb3RDb21wb25lbnQgPSByb290Tm9kZS5kYXRhW0NPTlRFWFRdO1xuICAgIGlmIChyb290Q29tcG9uZW50ID09PSBjb21wb25lbnRJbnN0YW5jZSkge1xuICAgICAgLy8gd2UgYXJlIGRlYWxpbmcgd2l0aCB0aGUgcm9vdCBlbGVtZW50IGhlcmUgdGhlcmVmb3JlIHdlIGtub3cgdGhhdCB0aGVcbiAgICAgIC8vIGVsZW1lbnQgaXMgdGhlIHZlcnkgZmlyc3QgZWxlbWVudCBhZnRlciB0aGUgSEVBREVSIGRhdGEgaW4gdGhlIGxWaWV3XG4gICAgICByZXR1cm4gSEVBREVSX09GRlNFVDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGRpcmVjdGl2ZSB3aXRoaW4gdGhlIGdpdmVuIExWaWV3RGF0YSBhbmQgcmV0dXJucyB0aGUgbWF0Y2hpbmcgaW5kZXhcbiAqL1xuZnVuY3Rpb24gZmluZFZpYURpcmVjdGl2ZShsVmlld0RhdGE6IExWaWV3RGF0YSwgZGlyZWN0aXZlSW5zdGFuY2U6IHt9KTogbnVtYmVyIHtcbiAgLy8gaWYgYSBkaXJlY3RpdmUgaXMgbW9ua2V5IHBhdGNoZWQgdGhlbiBpdCB3aWxsIChieSBkZWZhdWx0KVxuICAvLyBoYXZlIGEgcmVmZXJlbmNlIHRvIHRoZSBMVmlld0RhdGEgb2YgdGhlIGN1cnJlbnQgdmlldy4gVGhlXG4gIC8vIGVsZW1lbnQgYm91bmQgdG8gdGhlIGRpcmVjdGl2ZSBiZWluZyBzZWFyY2ggbGl2ZXMgc29tZXdoZXJlXG4gIC8vIGluIHRoZSB2aWV3IGRhdGEuIEJ5IGZpcnN0IGNoZWNraW5nIHRvIHNlZSBpZiB0aGUgaW5zdGFuY2VcbiAgLy8gaXMgYWN0dWFsbHkgcHJlc2VudCB3ZSBjYW4gbmFycm93IGRvd24gdG8gd2hpY2ggbEVsZW1lbnROb2RlXG4gIC8vIGNvbnRhaW5zIHRoZSBpbnN0YW5jZSBvZiB0aGUgZGlyZWN0aXZlIGFuZCB0aGVuIHJldHVybiB0aGUgaW5kZXhcbiAgY29uc3QgZGlyZWN0aXZlc0Fjcm9zc1ZpZXcgPSBsVmlld0RhdGFbRElSRUNUSVZFU107XG4gIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID1cbiAgICAgIGRpcmVjdGl2ZXNBY3Jvc3NWaWV3ID8gZGlyZWN0aXZlc0Fjcm9zc1ZpZXcuaW5kZXhPZihkaXJlY3RpdmVJbnN0YW5jZSkgOiAtMTtcbiAgaWYgKGRpcmVjdGl2ZUluZGV4ID49IDApIHtcbiAgICBsZXQgdE5vZGUgPSBsVmlld0RhdGFbVFZJRVddLmZpcnN0Q2hpbGQ7XG4gICAgd2hpbGUgKHROb2RlKSB7XG4gICAgICBjb25zdCBsTm9kZSA9IGdldExOb2RlRnJvbVZpZXdEYXRhKGxWaWV3RGF0YSwgdE5vZGUuaW5kZXgpICE7XG4gICAgICBjb25zdCBkaXJlY3RpdmVJbmRleFN0YXJ0ID0gZ2V0RGlyZWN0aXZlU3RhcnRJbmRleChsTm9kZSk7XG4gICAgICBjb25zdCBkaXJlY3RpdmVJbmRleEVuZCA9IGdldERpcmVjdGl2ZUVuZEluZGV4KGxOb2RlLCBkaXJlY3RpdmVJbmRleFN0YXJ0KTtcbiAgICAgIGlmIChkaXJlY3RpdmVJbmRleCA+PSBkaXJlY3RpdmVJbmRleFN0YXJ0ICYmIGRpcmVjdGl2ZUluZGV4IDwgZGlyZWN0aXZlSW5kZXhFbmQpIHtcbiAgICAgICAgcmV0dXJuIHROb2RlLmluZGV4O1xuICAgICAgfVxuICAgICAgdE5vZGUgPSB0cmF2ZXJzZU5leHRFbGVtZW50KHROb2RlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gLTE7XG59XG5cbmZ1bmN0aW9uIGFzc2VydERvbUVsZW1lbnQoZWxlbWVudDogYW55KSB7XG4gIGFzc2VydEVxdWFsKGVsZW1lbnQubm9kZVR5cGUsIDEsICdUaGUgcHJvdmlkZWQgdmFsdWUgbXVzdCBiZSBhbiBpbnN0YW5jZSBvZiBhbiBIVE1MRWxlbWVudCcpO1xufVxuXG4vKipcbiAqIFJldHJ1bnMgdGhlIGluc3RhbmNlIG9mIHRoZSBMRWxlbWVudE5vZGUgYXQgdGhlIGdpdmVuIGluZGV4IGluIHRoZSBMVmlld0RhdGEuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGFsc28gdW53cmFwIHRoZSBpbm5lciB2YWx1ZSBpbmNhc2UgaXQncyBzdHVmZmVkIGludG8gYW5cbiAqIGFycmF5ICh3aGljaCBpcyB3aGF0IGhhcHBlbnMgd2hlbiBbc3R5bGVdIGFuZCBbY2xhc3NdIGJpbmRpbmdzIGFyZSBwcmVzZW50XG4gKiBpbiB0aGUgdmlldyBpbnN0cnVjdGlvbnMgZm9yIHRoZSBlbGVtZW50IGJlaW5nIHJldHVybmVkKS5cbiAqL1xuZnVuY3Rpb24gZ2V0TE5vZGVGcm9tVmlld0RhdGEobFZpZXdEYXRhOiBMVmlld0RhdGEsIGxFbGVtZW50SW5kZXg6IG51bWJlcik6IExFbGVtZW50Tm9kZXxudWxsIHtcbiAgY29uc3QgdmFsdWUgPSBsVmlld0RhdGFbbEVsZW1lbnRJbmRleF07XG4gIHJldHVybiB2YWx1ZSA/IHJlYWRFbGVtZW50VmFsdWUodmFsdWUpIDogbnVsbDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgY29sbGVjdGlvbiBvZiBkaXJlY3RpdmUgaW5kZXggdmFsdWVzIHRoYXQgYXJlIHVzZWQgb24gdGhlIGVsZW1lbnRcbiAqICh3aGljaCBpcyByZWZlcmVuY2VkIGJ5IHRoZSBsTm9kZUluZGV4KVxuICovXG5mdW5jdGlvbiBkaXNjb3ZlckRpcmVjdGl2ZUluZGljZXMobFZpZXdEYXRhOiBMVmlld0RhdGEsIGxOb2RlSW5kZXg6IG51bWJlcik6IG51bWJlcltdfG51bGwge1xuICBjb25zdCBkaXJlY3RpdmVzQWNyb3NzVmlldyA9IGxWaWV3RGF0YVtESVJFQ1RJVkVTXTtcbiAgY29uc3QgbE5vZGUgPSBnZXRMTm9kZUZyb21WaWV3RGF0YShsVmlld0RhdGEsIGxOb2RlSW5kZXgpO1xuICBpZiAobE5vZGUgJiYgZGlyZWN0aXZlc0Fjcm9zc1ZpZXcgJiYgZGlyZWN0aXZlc0Fjcm9zc1ZpZXcubGVuZ3RoKSB7XG4gICAgLy8gdGhpcyBjaGVjayBmb3IgdE5vZGUgaXMgdG8gZGV0ZXJtaW5lIGlmIHRoZSBjYWx1ZSBpcyBhIExFbWVtZW50Tm9kZSBpbnN0YW5jZVxuICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4U3RhcnQgPSBnZXREaXJlY3RpdmVTdGFydEluZGV4KGxOb2RlKTtcbiAgICBjb25zdCBkaXJlY3RpdmVJbmRleEVuZCA9IGdldERpcmVjdGl2ZUVuZEluZGV4KGxOb2RlLCBkaXJlY3RpdmVJbmRleFN0YXJ0KTtcbiAgICBjb25zdCBkaXJlY3RpdmVJbmRpY2VzOiBudW1iZXJbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSBkaXJlY3RpdmVJbmRleFN0YXJ0OyBpIDwgZGlyZWN0aXZlSW5kZXhFbmQ7IGkrKykge1xuICAgICAgLy8gc3BlY2lhbCBjYXNlIHNpbmNlIHRoZSBpbnN0YW5jZSBvZiB0aGUgY29tcG9uZW50IChpZiBpdCBleGlzdHMpXG4gICAgICAvLyBpcyBzdG9yZWQgaW4gdGhlIGRpcmVjdGl2ZXMgYXJyYXkuXG4gICAgICBpZiAoaSA+IGRpcmVjdGl2ZUluZGV4U3RhcnQgfHxcbiAgICAgICAgICAhaXNDb21wb25lbnRJbnN0YW5jZShkaXJlY3RpdmVzQWNyb3NzVmlld1tkaXJlY3RpdmVJbmRleFN0YXJ0XSkpIHtcbiAgICAgICAgZGlyZWN0aXZlSW5kaWNlcy5wdXNoKGkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGlyZWN0aXZlSW5kaWNlcy5sZW5ndGggPyBkaXJlY3RpdmVJbmRpY2VzIDogbnVsbDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gZGlzY292ZXJEaXJlY3RpdmVzKGxWaWV3RGF0YTogTFZpZXdEYXRhLCBkaXJlY3RpdmVJbmRpY2VzOiBudW1iZXJbXSk6IG51bWJlcltdfG51bGwge1xuICBjb25zdCBkaXJlY3RpdmVzOiBhbnlbXSA9IFtdO1xuICBjb25zdCBkaXJlY3RpdmVJbnN0YW5jZXMgPSBsVmlld0RhdGFbRElSRUNUSVZFU107XG4gIGlmIChkaXJlY3RpdmVJbnN0YW5jZXMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZUluZGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gZGlyZWN0aXZlSW5kaWNlc1tpXTtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGRpcmVjdGl2ZUluc3RhbmNlc1tkaXJlY3RpdmVJbmRleF07XG4gICAgICBkaXJlY3RpdmVzLnB1c2goZGlyZWN0aXZlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRpcmVjdGl2ZXM7XG59XG5cbmZ1bmN0aW9uIGdldERpcmVjdGl2ZVN0YXJ0SW5kZXgobE5vZGU6IExFbGVtZW50Tm9kZSk6IG51bWJlciB7XG4gIC8vIHRoZSB0Tm9kZSBpbnN0YW5jZXMgc3RvcmUgYSBmbGFnIHZhbHVlIHdoaWNoIHRoZW4gaGFzIGFcbiAgLy8gcG9pbnRlciB3aGljaCB0ZWxscyB0aGUgc3RhcnRpbmcgaW5kZXggb2Ygd2hlcmUgYWxsIHRoZVxuICAvLyBhY3RpdmUgZGlyZWN0aXZlcyBhcmUgaW4gdGhlIG1hc3RlciBkaXJlY3RpdmUgYXJyYXlcbiAgcmV0dXJuIGxOb2RlLnROb2RlLmZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xufVxuXG5mdW5jdGlvbiBnZXREaXJlY3RpdmVFbmRJbmRleChsTm9kZTogTEVsZW1lbnROb2RlLCBzdGFydEluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICAvLyBUaGUgZW5kIHZhbHVlIGlzIGFsc28gYXBhcnQgb2YgdGhlIHNhbWUgZmxhZ1xuICAvLyAoc2VlIGBUTm9kZUZsYWdzYCB0byBzZWUgaG93IHRoZSBmbGFnIGJpdCBzaGlmdGluZ1xuICAvLyB2YWx1ZXMgYXJlIHVzZWQpLlxuICBjb25zdCBjb3VudCA9IGxOb2RlLnROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2s7XG4gIHJldHVybiBjb3VudCA/IChzdGFydEluZGV4ICsgY291bnQpIDogLTE7XG59XG4iXX0=