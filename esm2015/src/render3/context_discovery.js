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
            const directiveIndexStart = getDirectiveStartIndex(tNode);
            const directiveIndexEnd = getDirectiveEndIndex(tNode, directiveIndexStart);
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
    const tNode = lViewData[TVIEW].data[lNodeIndex];
    if (lNode && directivesAcrossView && directivesAcrossView.length) {
        // this check for tNode is to determine if the calue is a LEmementNode instance
        const directiveIndexStart = getDirectiveStartIndex(tNode);
        const directiveIndexEnd = getDirectiveEndIndex(tNode, directiveIndexStart);
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
    const count = tNode.flags & 4095 /* DirectiveCountMask */;
    return count ? (startIndex + count) : -1;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9kaXNjb3ZlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2NvbnRleHRfZGlzY292ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFHckMsT0FBTyxFQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsYUFBYSxFQUFhLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3ZGLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUV4Qzs7R0FFRztBQUNILE1BQU0sQ0FBQyxNQUFNLHFCQUFxQixHQUFHLGVBQWUsQ0FBQztBQWdDckQ7Ozs7Ozs7Ozs7Ozs7Ozs7R0FnQkc7QUFDSCxNQUFNLFVBQVUsVUFBVSxDQUFDLE1BQVc7SUFDcEMsSUFBSSxPQUFPLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3RDLElBQUksT0FBTyxFQUFFO1FBQ1gsaUVBQWlFO1FBQ2pFLDhEQUE4RDtRQUM5RCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDMUIsTUFBTSxTQUFTLEdBQWMsT0FBUyxDQUFDO1lBQ3ZDLElBQUksVUFBa0IsQ0FBQztZQUN2QixJQUFJLFNBQVMsR0FBUSxTQUFTLENBQUM7WUFDL0IsSUFBSSxnQkFBZ0IsR0FBNEIsU0FBUyxDQUFDO1lBQzFELElBQUksVUFBVSxHQUF5QixTQUFTLENBQUM7WUFFakQsSUFBSSxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDL0IsVUFBVSxHQUFHLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDakQsSUFBSSxVQUFVLElBQUksQ0FBQyxDQUFDLEVBQUU7b0JBQ3BCLE1BQU0sSUFB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LElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUFDLFNBQW9CLEVBQUUsZ0JBQTBCO0lBQzFFLE1BQU0sVUFBVSxHQUFVLEVBQUUsQ0FBQztJQUM3QixNQUFNLGtCQUFrQixHQUFHLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNqRCxJQUFJLGtCQUFrQixFQUFFO1FBQ3RCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDaEQsTUFBTSxjQUFjLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0MsTUFBTSxTQUFTLEdBQUcsa0JBQWtCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDckQsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUM1QjtLQUNGO0lBQ0QsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQztBQUVELFNBQVMsc0JBQXNCLENBQUMsS0FBWTtJQUMxQywwREFBMEQ7SUFDMUQsMERBQTBEO0lBQzFELHNEQUFzRDtJQUN0RCxPQUFPLEtBQUssQ0FBQyxLQUFLLHdDQUEwQyxDQUFDO0FBQy9ELENBQUM7QUFFRCxTQUFTLG9CQUFvQixDQUFDLEtBQVksRUFBRSxVQUFrQjtJQUM1RCxnREFBZ0Q7SUFDaEQscURBQXFEO0lBQ3JELG9CQUFvQjtJQUNwQixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxnQ0FBZ0MsQ0FBQztJQUMxRCxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzNDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgJy4vbmdfZGV2X21vZGUnO1xuXG5pbXBvcnQge2Fzc2VydEVxdWFsfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge0xFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0NPTlRFWFQsIERJUkVDVElWRVMsIEhFQURFUl9PRkZTRVQsIExWaWV3RGF0YSwgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7cmVhZEVsZW1lbnRWYWx1ZX0gZnJvbSAnLi91dGlsJztcblxuLyoqXG4gKiBUaGlzIHByb3BlcnR5IHdpbGwgYmUgbW9ua2V5LXBhdGNoZWQgb24gZWxlbWVudHMsIGNvbXBvbmVudHMgYW5kIGRpcmVjdGl2ZXNcbiAqL1xuZXhwb3J0IGNvbnN0IE1PTktFWV9QQVRDSF9LRVlfTkFNRSA9ICdfX25nQ29udGV4dF9fJztcblxuLyoqXG4gKiBUaGUgaW50ZXJuYWwgdmlldyBjb250ZXh0IHdoaWNoIGlzIHNwZWNpZmljIHRvIGEgZ2l2ZW4gRE9NIGVsZW1lbnQsIGRpcmVjdGl2ZSBvclxuICogY29tcG9uZW50IGluc3RhbmNlLiBFYWNoIHZhbHVlIGluIGhlcmUgKGJlc2lkZXMgdGhlIExWaWV3RGF0YSBhbmQgZWxlbWVudCBub2RlIGRldGFpbHMpXG4gKiBjYW4gYmUgcHJlc2VudCwgbnVsbCBvciB1bmRlZmluZWQuIElmIHVuZGVmaW5lZCB0aGVuIGl0IGltcGxpZXMgdGhlIHZhbHVlIGhhcyBub3QgYmVlblxuICogbG9va2VkIHVwIHlldCwgb3RoZXJ3aXNlLCBpZiBudWxsLCB0aGVuIGEgbG9va3VwIHdhcyBleGVjdXRlZCBhbmQgbm90aGluZyB3YXMgZm91bmQuXG4gKlxuICogRWFjaCB2YWx1ZSB3aWxsIGdldCBmaWxsZWQgd2hlbiB0aGUgcmVzcGVjdGl2ZSB2YWx1ZSBpcyBleGFtaW5lZCB3aXRoaW4gdGhlIGdldENvbnRleHRcbiAqIGZ1bmN0aW9uLiBUaGUgY29tcG9uZW50LCBlbGVtZW50IGFuZCBlYWNoIGRpcmVjdGl2ZSBpbnN0YW5jZSB3aWxsIHNoYXJlIHRoZSBzYW1lIGluc3RhbmNlXG4gKiBvZiB0aGUgY29udGV4dC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBMQ29udGV4dCB7XG4gIC8qKiBUaGUgY29tcG9uZW50XFwncyB2aWV3IGRhdGEgKi9cbiAgbFZpZXdEYXRhOiBMVmlld0RhdGE7XG5cbiAgLyoqIFRoZSBpbmRleCBpbnN0YW5jZSBvZiB0aGUgTE5vZGUgKi9cbiAgbE5vZGVJbmRleDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgaW5zdGFuY2Ugb2YgdGhlIERPTSBub2RlIHRoYXQgaXMgYXR0YWNoZWQgdG8gdGhlIGxOb2RlICovXG4gIG5hdGl2ZTogUkVsZW1lbnQ7XG5cbiAgLyoqIFRoZSBpbnN0YW5jZSBvZiB0aGUgQ29tcG9uZW50IG5vZGUgKi9cbiAgY29tcG9uZW50OiB7fXxudWxsfHVuZGVmaW5lZDtcblxuICAvKiogVGhlIGxpc3Qgb2YgaW5kaWNlcyBmb3IgdGhlIGFjdGl2ZSBkaXJlY3RpdmVzIHRoYXQgZXhpc3Qgb24gdGhpcyBlbGVtZW50ICovXG4gIGRpcmVjdGl2ZUluZGljZXM6IG51bWJlcltdfG51bGx8dW5kZWZpbmVkO1xuXG4gIC8qKiBUaGUgbGlzdCBvZiBhY3RpdmUgZGlyZWN0aXZlcyB0aGF0IGV4aXN0IG9uIHRoaXMgZWxlbWVudCAqL1xuICBkaXJlY3RpdmVzOiBBcnJheTx7fT58bnVsbHx1bmRlZmluZWQ7XG59XG5cbi8qKiBSZXR1cm5zIHRoZSBtYXRjaGluZyBgTENvbnRleHRgIGRhdGEgZm9yIGEgZ2l2ZW4gRE9NIG5vZGUsIGRpcmVjdGl2ZSBvciBjb21wb25lbnQgaW5zdGFuY2UuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGV4YW1pbmUgdGhlIHByb3ZpZGVkIERPTSBlbGVtZW50LCBjb21wb25lbnQsIG9yIGRpcmVjdGl2ZSBpbnN0YW5jZVxcJ3NcbiAqIG1vbmtleS1wYXRjaGVkIHByb3BlcnR5IHRvIGRlcml2ZSB0aGUgYExDb250ZXh0YCBkYXRhLiBPbmNlIGNhbGxlZCB0aGVuIHRoZSBtb25rZXktcGF0Y2hlZFxuICogdmFsdWUgd2lsbCBiZSB0aGF0IG9mIHRoZSBuZXdseSBjcmVhdGVkIGBMQ29udGV4dGAuXG4gKlxuICogSWYgdGhlIG1vbmtleS1wYXRjaGVkIHZhbHVlIGlzIHRoZSBgTFZpZXdEYXRhYCBpbnN0YW5jZSB0aGVuIHRoZSBjb250ZXh0IHZhbHVlIGZvciB0aGF0XG4gKiB0YXJnZXQgd2lsbCBiZSBjcmVhdGVkIGFuZCB0aGUgbW9ua2V5LXBhdGNoIHJlZmVyZW5jZSB3aWxsIGJlIHVwZGF0ZWQuIFRoZXJlZm9yZSB3aGVuIHRoaXNcbiAqIGZ1bmN0aW9uIGlzIGNhbGxlZCBpdCBtYXkgbXV0YXRlIHRoZSBwcm92aWRlZCBlbGVtZW50XFwncywgY29tcG9uZW50XFwncyBvciBhbnkgb2YgdGhlIGFzc29jaWF0ZWRcbiAqIGRpcmVjdGl2ZVxcJ3MgbW9ua2V5LXBhdGNoIHZhbHVlcy5cbiAqXG4gKiBJZiB0aGUgbW9ua2V5LXBhdGNoIHZhbHVlIGlzIG5vdCBkZXRlY3RlZCB0aGVuIHRoZSBjb2RlIHdpbGwgd2FsayB1cCB0aGUgRE9NIHVudGlsIGFuIGVsZW1lbnRcbiAqIGlzIGZvdW5kIHdoaWNoIGNvbnRhaW5zIGEgbW9ua2V5LXBhdGNoIHJlZmVyZW5jZS4gV2hlbiB0aGF0IG9jY3VycyB0aGVuIHRoZSBwcm92aWRlZCBlbGVtZW50XG4gKiB3aWxsIGJlIHVwZGF0ZWQgd2l0aCBhIG5ldyBjb250ZXh0ICh3aGljaCBpcyB0aGVuIHJldHVybmVkKS4gSWYgdGhlIG1vbmtleS1wYXRjaCB2YWx1ZSBpcyBub3RcbiAqIGRldGVjdGVkIGZvciBhIGNvbXBvbmVudC9kaXJlY3RpdmUgaW5zdGFuY2UgdGhlbiBpdCB3aWxsIHRocm93IGFuIGVycm9yIChhbGwgY29tcG9uZW50cyBhbmRcbiAqIGRpcmVjdGl2ZXMgc2hvdWxkIGJlIGF1dG9tYXRpY2FsbHkgbW9ua2V5LXBhdGNoZWQgYnkgaXZ5KS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbnRleHQodGFyZ2V0OiBhbnkpOiBMQ29udGV4dHxudWxsIHtcbiAgbGV0IG1wVmFsdWUgPSByZWFkUGF0Y2hlZERhdGEodGFyZ2V0KTtcbiAgaWYgKG1wVmFsdWUpIHtcbiAgICAvLyBvbmx5IHdoZW4gaXQncyBhbiBhcnJheSBpcyBpdCBjb25zaWRlcmVkIGFuIExWaWV3RGF0YSBpbnN0YW5jZVxuICAgIC8vIC4uLiBvdGhlcndpc2UgaXQncyBhbiBhbHJlYWR5IGNvbnN0cnVjdGVkIExDb250ZXh0IGluc3RhbmNlXG4gICAgaWYgKEFycmF5LmlzQXJyYXkobXBWYWx1ZSkpIHtcbiAgICAgIGNvbnN0IGxWaWV3RGF0YTogTFZpZXdEYXRhID0gbXBWYWx1ZSAhO1xuICAgICAgbGV0IGxOb2RlSW5kZXg6IG51bWJlcjtcbiAgICAgIGxldCBjb21wb25lbnQ6IGFueSA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCBkaXJlY3RpdmVJbmRpY2VzOiBudW1iZXJbXXxudWxsfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCBkaXJlY3RpdmVzOiBhbnlbXXxudWxsfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAgICAgaWYgKGlzQ29tcG9uZW50SW5zdGFuY2UodGFyZ2V0KSkge1xuICAgICAgICBsTm9kZUluZGV4ID0gZmluZFZpYUNvbXBvbmVudChsVmlld0RhdGEsIHRhcmdldCk7XG4gICAgICAgIGlmIChsTm9kZUluZGV4ID09IC0xKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgcHJvdmlkZWQgY29tcG9uZW50IHdhcyBub3QgZm91bmQgaW4gdGhlIGFwcGxpY2F0aW9uJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29tcG9uZW50ID0gdGFyZ2V0O1xuICAgICAgfSBlbHNlIGlmIChpc0RpcmVjdGl2ZUluc3RhbmNlKHRhcmdldCkpIHtcbiAgICAgICAgbE5vZGVJbmRleCA9IGZpbmRWaWFEaXJlY3RpdmUobFZpZXdEYXRhLCB0YXJnZXQpO1xuICAgICAgICBpZiAobE5vZGVJbmRleCA9PSAtMSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHByb3ZpZGVkIGRpcmVjdGl2ZSB3YXMgbm90IGZvdW5kIGluIHRoZSBhcHBsaWNhdGlvbicpO1xuICAgICAgICB9XG4gICAgICAgIGRpcmVjdGl2ZUluZGljZXMgPSBkaXNjb3ZlckRpcmVjdGl2ZUluZGljZXMobFZpZXdEYXRhLCBsTm9kZUluZGV4KTtcbiAgICAgICAgZGlyZWN0aXZlcyA9IGRpcmVjdGl2ZUluZGljZXMgPyBkaXNjb3ZlckRpcmVjdGl2ZXMobFZpZXdEYXRhLCBkaXJlY3RpdmVJbmRpY2VzKSA6IG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsTm9kZUluZGV4ID0gZmluZFZpYU5hdGl2ZUVsZW1lbnQobFZpZXdEYXRhLCB0YXJnZXQgYXMgUkVsZW1lbnQpO1xuICAgICAgICBpZiAobE5vZGVJbmRleCA9PSAtMSkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIHRoZSBnb2FsIGlzIG5vdCB0byBmaWxsIHRoZSBlbnRpcmUgY29udGV4dCBmdWxsIG9mIGRhdGEgYmVjYXVzZSB0aGUgbG9va3Vwc1xuICAgICAgLy8gYXJlIGV4cGVuc2l2ZS4gSW5zdGVhZCwgb25seSB0aGUgdGFyZ2V0IGRhdGEgKHRoZSBlbGVtZW50LCBjb21wb250ZW50IG9yXG4gICAgICAvLyBkaXJlY3RpdmUgZGV0YWlscykgYXJlIGZpbGxlZCBpbnRvIHRoZSBjb250ZXh0LiBJZiBjYWxsZWQgbXVsdGlwbGUgdGltZXNcbiAgICAgIC8vIHdpdGggZGlmZmVyZW50IHRhcmdldCB2YWx1ZXMgdGhlbiB0aGUgbWlzc2luZyB0YXJnZXQgZGF0YSB3aWxsIGJlIGZpbGxlZCBpbi5cbiAgICAgIGNvbnN0IGxOb2RlID0gZ2V0TE5vZGVGcm9tVmlld0RhdGEobFZpZXdEYXRhLCBsTm9kZUluZGV4KSAhO1xuICAgICAgY29uc3QgZXhpc3RpbmdDdHggPSByZWFkUGF0Y2hlZERhdGEobE5vZGUubmF0aXZlKTtcbiAgICAgIGNvbnN0IGNvbnRleHQ6IExDb250ZXh0ID0gKGV4aXN0aW5nQ3R4ICYmICFBcnJheS5pc0FycmF5KGV4aXN0aW5nQ3R4KSkgP1xuICAgICAgICAgIGV4aXN0aW5nQ3R4IDpcbiAgICAgICAgICBjcmVhdGVMQ29udGV4dChsVmlld0RhdGEsIGxOb2RlSW5kZXgsIGxOb2RlLm5hdGl2ZSk7XG5cbiAgICAgIC8vIG9ubHkgd2hlbiB0aGUgY29tcG9uZW50IGhhcyBiZWVuIGRpc2NvdmVyZWQgdGhlbiB1cGRhdGUgdGhlIG1vbmtleS1wYXRjaFxuICAgICAgaWYgKGNvbXBvbmVudCAmJiBjb250ZXh0LmNvbXBvbmVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRleHQuY29tcG9uZW50ID0gY29tcG9uZW50O1xuICAgICAgICBhdHRhY2hQYXRjaERhdGEoY29udGV4dC5jb21wb25lbnQsIGNvbnRleHQpO1xuICAgICAgfVxuXG4gICAgICAvLyBvbmx5IHdoZW4gdGhlIGRpcmVjdGl2ZXMgaGF2ZSBiZWVuIGRpc2NvdmVyZWQgdGhlbiB1cGRhdGUgdGhlIG1vbmtleS1wYXRjaFxuICAgICAgaWYgKGRpcmVjdGl2ZXMgJiYgZGlyZWN0aXZlSW5kaWNlcyAmJiBjb250ZXh0LmRpcmVjdGl2ZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb250ZXh0LmRpcmVjdGl2ZUluZGljZXMgPSBkaXJlY3RpdmVJbmRpY2VzO1xuICAgICAgICBjb250ZXh0LmRpcmVjdGl2ZXMgPSBkaXJlY3RpdmVzO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBhdHRhY2hQYXRjaERhdGEoZGlyZWN0aXZlc1tpXSwgY29udGV4dCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgYXR0YWNoUGF0Y2hEYXRhKGNvbnRleHQubmF0aXZlLCBjb250ZXh0KTtcbiAgICAgIG1wVmFsdWUgPSBjb250ZXh0O1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCByRWxlbWVudCA9IHRhcmdldCBhcyBSRWxlbWVudDtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RG9tRWxlbWVudChyRWxlbWVudCk7XG5cbiAgICAvLyBpZiB0aGUgY29udGV4dCBpcyBub3QgZm91bmQgdGhlbiB3ZSBuZWVkIHRvIHRyYXZlcnNlIHVwd2FyZHMgdXAgdGhlIERPTVxuICAgIC8vIHRvIGZpbmQgdGhlIG5lYXJlc3QgZWxlbWVudCB0aGF0IGhhcyBhbHJlYWR5IGJlZW4gbW9ua2V5IHBhdGNoZWQgd2l0aCBkYXRhXG4gICAgbGV0IHBhcmVudCA9IHJFbGVtZW50IGFzIGFueTtcbiAgICB3aGlsZSAocGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGUpIHtcbiAgICAgIGNvbnN0IHBhcmVudENvbnRleHQgPSByZWFkUGF0Y2hlZERhdGEocGFyZW50KTtcbiAgICAgIGlmIChwYXJlbnRDb250ZXh0KSB7XG4gICAgICAgIGxldCBsVmlld0RhdGE6IExWaWV3RGF0YXxudWxsO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwYXJlbnRDb250ZXh0KSkge1xuICAgICAgICAgIGxWaWV3RGF0YSA9IHBhcmVudENvbnRleHQgYXMgTFZpZXdEYXRhO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxWaWV3RGF0YSA9IHBhcmVudENvbnRleHQubFZpZXdEYXRhO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdGhlIGVkZ2Ugb2YgdGhlIGFwcCB3YXMgYWxzbyByZWFjaGVkIGhlcmUgdGhyb3VnaCBhbm90aGVyIG1lYW5zXG4gICAgICAgIC8vIChtYXliZSBiZWNhdXNlIHRoZSBET00gd2FzIGNoYW5nZWQgbWFudWFsbHkpLlxuICAgICAgICBpZiAoIWxWaWV3RGF0YSkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaW5kZXggPSBmaW5kVmlhTmF0aXZlRWxlbWVudChsVmlld0RhdGEsIHJFbGVtZW50KTtcbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICBjb25zdCBsTm9kZSA9IGdldExOb2RlRnJvbVZpZXdEYXRhKGxWaWV3RGF0YSwgaW5kZXgpICE7XG4gICAgICAgICAgY29uc3QgY29udGV4dCA9IGNyZWF0ZUxDb250ZXh0KGxWaWV3RGF0YSwgaW5kZXgsIGxOb2RlLm5hdGl2ZSk7XG4gICAgICAgICAgYXR0YWNoUGF0Y2hEYXRhKGxOb2RlLm5hdGl2ZSwgY29udGV4dCk7XG4gICAgICAgICAgbXBWYWx1ZSA9IGNvbnRleHQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIChtcFZhbHVlIGFzIExDb250ZXh0KSB8fCBudWxsO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gZW1wdHkgaW5zdGFuY2Ugb2YgYSBgTENvbnRleHRgIGNvbnRleHRcbiAqL1xuZnVuY3Rpb24gY3JlYXRlTENvbnRleHQobFZpZXdEYXRhOiBMVmlld0RhdGEsIGxOb2RlSW5kZXg6IG51bWJlciwgbmF0aXZlOiBSRWxlbWVudCk6IExDb250ZXh0IHtcbiAgcmV0dXJuIHtcbiAgICBsVmlld0RhdGEsXG4gICAgbE5vZGVJbmRleCxcbiAgICBuYXRpdmUsXG4gICAgY29tcG9uZW50OiB1bmRlZmluZWQsXG4gICAgZGlyZWN0aXZlSW5kaWNlczogdW5kZWZpbmVkLFxuICAgIGRpcmVjdGl2ZXM6IHVuZGVmaW5lZCxcbiAgfTtcbn1cblxuLyoqXG4gKiBBIHV0aWxpdHkgZnVuY3Rpb24gZm9yIHJldHJpZXZpbmcgdGhlIG1hdGNoaW5nIGxFbGVtZW50Tm9kZVxuICogZnJvbSBhIGdpdmVuIERPTSBlbGVtZW50LCBjb21wb25lbnQgb3IgZGlyZWN0aXZlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TEVsZW1lbnROb2RlKHRhcmdldDogYW55KTogTEVsZW1lbnROb2RlfG51bGwge1xuICBjb25zdCBjb250ZXh0ID0gZ2V0Q29udGV4dCh0YXJnZXQpO1xuICByZXR1cm4gY29udGV4dCA/IGdldExOb2RlRnJvbVZpZXdEYXRhKGNvbnRleHQubFZpZXdEYXRhLCBjb250ZXh0LmxOb2RlSW5kZXgpIDogbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldExFbGVtZW50RnJvbVJvb3RDb21wb25lbnQocm9vdENvbXBvbmVudEluc3RhbmNlOiB7fSk6IExFbGVtZW50Tm9kZXxudWxsIHtcbiAgLy8gdGhlIGhvc3QgZWxlbWVudCBmb3IgdGhlIHJvb3QgY29tcG9uZW50IGlzIEFMV0FZUyB0aGUgZmlyc3QgZWxlbWVudFxuICAvLyBpbiB0aGUgbFZpZXdEYXRhIGFycmF5ICh3aGljaCBpcyB3aGVyZSBIRUFERVJfT0ZGU0VUIHBvaW50cyB0bylcbiAgY29uc3QgbFZpZXdEYXRhID0gcmVhZFBhdGNoZWRMVmlld0RhdGEocm9vdENvbXBvbmVudEluc3RhbmNlKSAhO1xuICByZXR1cm4gcmVhZEVsZW1lbnRWYWx1ZShsVmlld0RhdGFbSEVBREVSX09GRlNFVF0pO1xufVxuXG4vKipcbiAqIEEgc2ltcGxpZmllZCBsb29rdXAgZnVuY3Rpb24gZm9yIGZpbmRpbmcgdGhlIExFbGVtZW50Tm9kZSBmcm9tIGEgY29tcG9uZW50IGluc3RhbmNlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gZXhpc3RzIGZvciB0cmVlLXNoYWtpbmcgcHVycG9zZXMgdG8gYXZvaWQgaGF2aW5nIHRvIHB1bGwgaW4gZXZlcnl0aGluZ1xuICogdGhhdCBgZ2V0Q29udGV4dGAgaGFzIGluIHRoZSBldmVudCB0aGF0IGFuIEFuZ3VsYXIgYXBwbGljYXRpb24gZG9lc24ndCBuZWVkIHRvIGhhdmVcbiAqIGFueSBwcm9ncmFtbWF0aWMgYWNjZXNzIHRvIGFuIGVsZW1lbnQncyBjb250ZXh0IChvbmx5IGNoYW5nZSBkZXRlY3Rpb24gdXNlcyB0aGlzIGZ1bmN0aW9uKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExFbGVtZW50RnJvbUNvbXBvbmVudChjb21wb25lbnRJbnN0YW5jZToge30pOiBMRWxlbWVudE5vZGV8bnVsbCB7XG4gIGxldCBsVmlld0RhdGEgPSByZWFkUGF0Y2hlZERhdGEoY29tcG9uZW50SW5zdGFuY2UpO1xuICBsZXQgbE5vZGU6IExFbGVtZW50Tm9kZTtcblxuICBpZiAoQXJyYXkuaXNBcnJheShsVmlld0RhdGEpKSB7XG4gICAgY29uc3QgbE5vZGVJbmRleCA9IGZpbmRWaWFDb21wb25lbnQobFZpZXdEYXRhLCBjb21wb25lbnRJbnN0YW5jZSk7XG4gICAgbE5vZGUgPSByZWFkRWxlbWVudFZhbHVlKGxWaWV3RGF0YVtsTm9kZUluZGV4XSk7XG4gICAgY29uc3QgY29udGV4dCA9IGNyZWF0ZUxDb250ZXh0KGxWaWV3RGF0YSwgbE5vZGVJbmRleCwgbE5vZGUubmF0aXZlKTtcbiAgICBjb250ZXh0LmNvbXBvbmVudCA9IGNvbXBvbmVudEluc3RhbmNlO1xuICAgIGF0dGFjaFBhdGNoRGF0YShjb21wb25lbnRJbnN0YW5jZSwgY29udGV4dCk7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKGNvbnRleHQubmF0aXZlLCBjb250ZXh0KTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBjb250ZXh0ID0gbFZpZXdEYXRhIGFzIGFueSBhcyBMQ29udGV4dDtcbiAgICBsTm9kZSA9IHJlYWRFbGVtZW50VmFsdWUoY29udGV4dC5sVmlld0RhdGFbY29udGV4dC5sTm9kZUluZGV4XSk7XG4gIH1cblxuICByZXR1cm4gbE5vZGU7XG59XG5cbi8qKlxuICogQXNzaWducyB0aGUgZ2l2ZW4gZGF0YSB0byB0aGUgZ2l2ZW4gdGFyZ2V0ICh3aGljaCBjb3VsZCBiZSBhIGNvbXBvbmVudCxcbiAqIGRpcmVjdGl2ZSBvciBET00gbm9kZSBpbnN0YW5jZSkgdXNpbmcgbW9ua2V5LXBhdGNoaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoUGF0Y2hEYXRhKHRhcmdldDogYW55LCBkYXRhOiBMVmlld0RhdGEgfCBMQ29udGV4dCkge1xuICB0YXJnZXRbTU9OS0VZX1BBVENIX0tFWV9OQU1FXSA9IGRhdGE7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbW9ua2V5LXBhdGNoIHZhbHVlIGRhdGEgcHJlc2VudCBvbiB0aGUgdGFyZ2V0ICh3aGljaCBjb3VsZCBiZVxuICogYSBjb21wb25lbnQsIGRpcmVjdGl2ZSBvciBhIERPTSBub2RlKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRQYXRjaGVkRGF0YSh0YXJnZXQ6IGFueSk6IExWaWV3RGF0YXxMQ29udGV4dHxudWxsIHtcbiAgcmV0dXJuIHRhcmdldFtNT05LRVlfUEFUQ0hfS0VZX05BTUVdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZFBhdGNoZWRMVmlld0RhdGEodGFyZ2V0OiBhbnkpOiBMVmlld0RhdGF8bnVsbCB7XG4gIGNvbnN0IHZhbHVlID0gcmVhZFBhdGNoZWREYXRhKHRhcmdldCk7XG4gIGlmICh2YWx1ZSkge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlIDogKHZhbHVlIGFzIExDb250ZXh0KS5sVmlld0RhdGE7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbXBvbmVudEluc3RhbmNlKGluc3RhbmNlOiBhbnkpOiBib29sZWFuIHtcbiAgcmV0dXJuIGluc3RhbmNlICYmIGluc3RhbmNlLmNvbnN0cnVjdG9yICYmIGluc3RhbmNlLmNvbnN0cnVjdG9yLm5nQ29tcG9uZW50RGVmO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNEaXJlY3RpdmVJbnN0YW5jZShpbnN0YW5jZTogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiBpbnN0YW5jZSAmJiBpbnN0YW5jZS5jb25zdHJ1Y3RvciAmJiBpbnN0YW5jZS5jb25zdHJ1Y3Rvci5uZ0RpcmVjdGl2ZURlZjtcbn1cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBlbGVtZW50IHdpdGhpbiB0aGUgZ2l2ZW4gTFZpZXdEYXRhIGFuZCByZXR1cm5zIHRoZSBtYXRjaGluZyBpbmRleFxuICovXG5mdW5jdGlvbiBmaW5kVmlhTmF0aXZlRWxlbWVudChsVmlld0RhdGE6IExWaWV3RGF0YSwgbmF0aXZlOiBSRWxlbWVudCk6IG51bWJlciB7XG4gIGxldCB0Tm9kZSA9IGxWaWV3RGF0YVtUVklFV10uZmlyc3RDaGlsZDtcbiAgd2hpbGUgKHROb2RlKSB7XG4gICAgY29uc3QgbE5vZGUgPSBnZXRMTm9kZUZyb21WaWV3RGF0YShsVmlld0RhdGEsIHROb2RlLmluZGV4KSAhO1xuICAgIGlmIChsTm9kZS5uYXRpdmUgPT09IG5hdGl2ZSkge1xuICAgICAgcmV0dXJuIHROb2RlLmluZGV4O1xuICAgIH1cbiAgICB0Tm9kZSA9IHRyYXZlcnNlTmV4dEVsZW1lbnQodE5vZGUpO1xuICB9XG5cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIG5leHQgdE5vZGUgKGNoaWxkLCBzaWJsaW5nIG9yIHBhcmVudCkuXG4gKi9cbmZ1bmN0aW9uIHRyYXZlcnNlTmV4dEVsZW1lbnQodE5vZGU6IFROb2RlKTogVE5vZGV8bnVsbCB7XG4gIGlmICh0Tm9kZS5jaGlsZCkge1xuICAgIHJldHVybiB0Tm9kZS5jaGlsZDtcbiAgfSBlbHNlIGlmICh0Tm9kZS5uZXh0KSB7XG4gICAgcmV0dXJuIHROb2RlLm5leHQ7XG4gIH0gZWxzZSBpZiAodE5vZGUucGFyZW50KSB7XG4gICAgcmV0dXJuIHROb2RlLnBhcmVudC5uZXh0IHx8IG51bGw7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogTG9jYXRlcyB0aGUgY29tcG9uZW50IHdpdGhpbiB0aGUgZ2l2ZW4gTFZpZXdEYXRhIGFuZCByZXR1cm5zIHRoZSBtYXRjaGluZyBpbmRleFxuICovXG5mdW5jdGlvbiBmaW5kVmlhQ29tcG9uZW50KGxWaWV3RGF0YTogTFZpZXdEYXRhLCBjb21wb25lbnRJbnN0YW5jZToge30pOiBudW1iZXIge1xuICBjb25zdCBjb21wb25lbnRJbmRpY2VzID0gbFZpZXdEYXRhW1RWSUVXXS5jb21wb25lbnRzO1xuICBpZiAoY29tcG9uZW50SW5kaWNlcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50SW5kaWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZWxlbWVudENvbXBvbmVudEluZGV4ID0gY29tcG9uZW50SW5kaWNlc1tpXTtcbiAgICAgIGNvbnN0IGxOb2RlRGF0YSA9IHJlYWRFbGVtZW50VmFsdWUobFZpZXdEYXRhW2VsZW1lbnRDb21wb25lbnRJbmRleF0gISkuZGF0YSAhO1xuICAgICAgaWYgKGxOb2RlRGF0YVtDT05URVhUXSA9PT0gY29tcG9uZW50SW5zdGFuY2UpIHtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnRDb21wb25lbnRJbmRleDtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qgcm9vdE5vZGUgPSBsVmlld0RhdGFbSEVBREVSX09GRlNFVF07XG4gICAgY29uc3Qgcm9vdENvbXBvbmVudCA9IHJvb3ROb2RlLmRhdGFbQ09OVEVYVF07XG4gICAgaWYgKHJvb3RDb21wb25lbnQgPT09IGNvbXBvbmVudEluc3RhbmNlKSB7XG4gICAgICAvLyB3ZSBhcmUgZGVhbGluZyB3aXRoIHRoZSByb290IGVsZW1lbnQgaGVyZSB0aGVyZWZvcmUgd2Uga25vdyB0aGF0IHRoZVxuICAgICAgLy8gZWxlbWVudCBpcyB0aGUgdmVyeSBmaXJzdCBlbGVtZW50IGFmdGVyIHRoZSBIRUFERVIgZGF0YSBpbiB0aGUgbFZpZXdcbiAgICAgIHJldHVybiBIRUFERVJfT0ZGU0VUO1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuICogTG9jYXRlcyB0aGUgZGlyZWN0aXZlIHdpdGhpbiB0aGUgZ2l2ZW4gTFZpZXdEYXRhIGFuZCByZXR1cm5zIHRoZSBtYXRjaGluZyBpbmRleFxuICovXG5mdW5jdGlvbiBmaW5kVmlhRGlyZWN0aXZlKGxWaWV3RGF0YTogTFZpZXdEYXRhLCBkaXJlY3RpdmVJbnN0YW5jZToge30pOiBudW1iZXIge1xuICAvLyBpZiBhIGRpcmVjdGl2ZSBpcyBtb25rZXkgcGF0Y2hlZCB0aGVuIGl0IHdpbGwgKGJ5IGRlZmF1bHQpXG4gIC8vIGhhdmUgYSByZWZlcmVuY2UgdG8gdGhlIExWaWV3RGF0YSBvZiB0aGUgY3VycmVudCB2aWV3LiBUaGVcbiAgLy8gZWxlbWVudCBib3VuZCB0byB0aGUgZGlyZWN0aXZlIGJlaW5nIHNlYXJjaCBsaXZlcyBzb21ld2hlcmVcbiAgLy8gaW4gdGhlIHZpZXcgZGF0YS4gQnkgZmlyc3QgY2hlY2tpbmcgdG8gc2VlIGlmIHRoZSBpbnN0YW5jZVxuICAvLyBpcyBhY3R1YWxseSBwcmVzZW50IHdlIGNhbiBuYXJyb3cgZG93biB0byB3aGljaCBsRWxlbWVudE5vZGVcbiAgLy8gY29udGFpbnMgdGhlIGluc3RhbmNlIG9mIHRoZSBkaXJlY3RpdmUgYW5kIHRoZW4gcmV0dXJuIHRoZSBpbmRleFxuICBjb25zdCBkaXJlY3RpdmVzQWNyb3NzVmlldyA9IGxWaWV3RGF0YVtESVJFQ1RJVkVTXTtcbiAgY29uc3QgZGlyZWN0aXZlSW5kZXggPVxuICAgICAgZGlyZWN0aXZlc0Fjcm9zc1ZpZXcgPyBkaXJlY3RpdmVzQWNyb3NzVmlldy5pbmRleE9mKGRpcmVjdGl2ZUluc3RhbmNlKSA6IC0xO1xuICBpZiAoZGlyZWN0aXZlSW5kZXggPj0gMCkge1xuICAgIGxldCB0Tm9kZSA9IGxWaWV3RGF0YVtUVklFV10uZmlyc3RDaGlsZDtcbiAgICB3aGlsZSAodE5vZGUpIHtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4U3RhcnQgPSBnZXREaXJlY3RpdmVTdGFydEluZGV4KHROb2RlKTtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4RW5kID0gZ2V0RGlyZWN0aXZlRW5kSW5kZXgodE5vZGUsIGRpcmVjdGl2ZUluZGV4U3RhcnQpO1xuICAgICAgaWYgKGRpcmVjdGl2ZUluZGV4ID49IGRpcmVjdGl2ZUluZGV4U3RhcnQgJiYgZGlyZWN0aXZlSW5kZXggPCBkaXJlY3RpdmVJbmRleEVuZCkge1xuICAgICAgICByZXR1cm4gdE5vZGUuaW5kZXg7XG4gICAgICB9XG4gICAgICB0Tm9kZSA9IHRyYXZlcnNlTmV4dEVsZW1lbnQodE5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAtMTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0RG9tRWxlbWVudChlbGVtZW50OiBhbnkpIHtcbiAgYXNzZXJ0RXF1YWwoZWxlbWVudC5ub2RlVHlwZSwgMSwgJ1RoZSBwcm92aWRlZCB2YWx1ZSBtdXN0IGJlIGFuIGluc3RhbmNlIG9mIGFuIEhUTUxFbGVtZW50Jyk7XG59XG5cbi8qKlxuICogUmV0cnVucyB0aGUgaW5zdGFuY2Ugb2YgdGhlIExFbGVtZW50Tm9kZSBhdCB0aGUgZ2l2ZW4gaW5kZXggaW4gdGhlIExWaWV3RGF0YS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgYWxzbyB1bndyYXAgdGhlIGlubmVyIHZhbHVlIGluY2FzZSBpdCdzIHN0dWZmZWQgaW50byBhblxuICogYXJyYXkgKHdoaWNoIGlzIHdoYXQgaGFwcGVucyB3aGVuIFtzdHlsZV0gYW5kIFtjbGFzc10gYmluZGluZ3MgYXJlIHByZXNlbnRcbiAqIGluIHRoZSB2aWV3IGluc3RydWN0aW9ucyBmb3IgdGhlIGVsZW1lbnQgYmVpbmcgcmV0dXJuZWQpLlxuICovXG5mdW5jdGlvbiBnZXRMTm9kZUZyb21WaWV3RGF0YShsVmlld0RhdGE6IExWaWV3RGF0YSwgbEVsZW1lbnRJbmRleDogbnVtYmVyKTogTEVsZW1lbnROb2RlfG51bGwge1xuICBjb25zdCB2YWx1ZSA9IGxWaWV3RGF0YVtsRWxlbWVudEluZGV4XTtcbiAgcmV0dXJuIHZhbHVlID8gcmVhZEVsZW1lbnRWYWx1ZSh2YWx1ZSkgOiBudWxsO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBjb2xsZWN0aW9uIG9mIGRpcmVjdGl2ZSBpbmRleCB2YWx1ZXMgdGhhdCBhcmUgdXNlZCBvbiB0aGUgZWxlbWVudFxuICogKHdoaWNoIGlzIHJlZmVyZW5jZWQgYnkgdGhlIGxOb2RlSW5kZXgpXG4gKi9cbmZ1bmN0aW9uIGRpc2NvdmVyRGlyZWN0aXZlSW5kaWNlcyhsVmlld0RhdGE6IExWaWV3RGF0YSwgbE5vZGVJbmRleDogbnVtYmVyKTogbnVtYmVyW118bnVsbCB7XG4gIGNvbnN0IGRpcmVjdGl2ZXNBY3Jvc3NWaWV3ID0gbFZpZXdEYXRhW0RJUkVDVElWRVNdO1xuICBjb25zdCBsTm9kZSA9IGdldExOb2RlRnJvbVZpZXdEYXRhKGxWaWV3RGF0YSwgbE5vZGVJbmRleCk7XG4gIGNvbnN0IHROb2RlID0gbFZpZXdEYXRhW1RWSUVXXS5kYXRhW2xOb2RlSW5kZXhdIGFzIFROb2RlO1xuICBpZiAobE5vZGUgJiYgZGlyZWN0aXZlc0Fjcm9zc1ZpZXcgJiYgZGlyZWN0aXZlc0Fjcm9zc1ZpZXcubGVuZ3RoKSB7XG4gICAgLy8gdGhpcyBjaGVjayBmb3IgdE5vZGUgaXMgdG8gZGV0ZXJtaW5lIGlmIHRoZSBjYWx1ZSBpcyBhIExFbWVtZW50Tm9kZSBpbnN0YW5jZVxuICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4U3RhcnQgPSBnZXREaXJlY3RpdmVTdGFydEluZGV4KHROb2RlKTtcbiAgICBjb25zdCBkaXJlY3RpdmVJbmRleEVuZCA9IGdldERpcmVjdGl2ZUVuZEluZGV4KHROb2RlLCBkaXJlY3RpdmVJbmRleFN0YXJ0KTtcbiAgICBjb25zdCBkaXJlY3RpdmVJbmRpY2VzOiBudW1iZXJbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSBkaXJlY3RpdmVJbmRleFN0YXJ0OyBpIDwgZGlyZWN0aXZlSW5kZXhFbmQ7IGkrKykge1xuICAgICAgLy8gc3BlY2lhbCBjYXNlIHNpbmNlIHRoZSBpbnN0YW5jZSBvZiB0aGUgY29tcG9uZW50IChpZiBpdCBleGlzdHMpXG4gICAgICAvLyBpcyBzdG9yZWQgaW4gdGhlIGRpcmVjdGl2ZXMgYXJyYXkuXG4gICAgICBpZiAoaSA+IGRpcmVjdGl2ZUluZGV4U3RhcnQgfHxcbiAgICAgICAgICAhaXNDb21wb25lbnRJbnN0YW5jZShkaXJlY3RpdmVzQWNyb3NzVmlld1tkaXJlY3RpdmVJbmRleFN0YXJ0XSkpIHtcbiAgICAgICAgZGlyZWN0aXZlSW5kaWNlcy5wdXNoKGkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGlyZWN0aXZlSW5kaWNlcy5sZW5ndGggPyBkaXJlY3RpdmVJbmRpY2VzIDogbnVsbDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gZGlzY292ZXJEaXJlY3RpdmVzKGxWaWV3RGF0YTogTFZpZXdEYXRhLCBkaXJlY3RpdmVJbmRpY2VzOiBudW1iZXJbXSk6IG51bWJlcltdfG51bGwge1xuICBjb25zdCBkaXJlY3RpdmVzOiBhbnlbXSA9IFtdO1xuICBjb25zdCBkaXJlY3RpdmVJbnN0YW5jZXMgPSBsVmlld0RhdGFbRElSRUNUSVZFU107XG4gIGlmIChkaXJlY3RpdmVJbnN0YW5jZXMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZUluZGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gZGlyZWN0aXZlSW5kaWNlc1tpXTtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGRpcmVjdGl2ZUluc3RhbmNlc1tkaXJlY3RpdmVJbmRleF07XG4gICAgICBkaXJlY3RpdmVzLnB1c2goZGlyZWN0aXZlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRpcmVjdGl2ZXM7XG59XG5cbmZ1bmN0aW9uIGdldERpcmVjdGl2ZVN0YXJ0SW5kZXgodE5vZGU6IFROb2RlKTogbnVtYmVyIHtcbiAgLy8gdGhlIHROb2RlIGluc3RhbmNlcyBzdG9yZSBhIGZsYWcgdmFsdWUgd2hpY2ggdGhlbiBoYXMgYVxuICAvLyBwb2ludGVyIHdoaWNoIHRlbGxzIHRoZSBzdGFydGluZyBpbmRleCBvZiB3aGVyZSBhbGwgdGhlXG4gIC8vIGFjdGl2ZSBkaXJlY3RpdmVzIGFyZSBpbiB0aGUgbWFzdGVyIGRpcmVjdGl2ZSBhcnJheVxuICByZXR1cm4gdE5vZGUuZmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG59XG5cbmZ1bmN0aW9uIGdldERpcmVjdGl2ZUVuZEluZGV4KHROb2RlOiBUTm9kZSwgc3RhcnRJbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgLy8gVGhlIGVuZCB2YWx1ZSBpcyBhbHNvIGEgcGFydCBvZiB0aGUgc2FtZSBmbGFnXG4gIC8vIChzZWUgYFROb2RlRmxhZ3NgIHRvIHNlZSBob3cgdGhlIGZsYWcgYml0IHNoaWZ0aW5nXG4gIC8vIHZhbHVlcyBhcmUgdXNlZCkuXG4gIGNvbnN0IGNvdW50ID0gdE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaztcbiAgcmV0dXJuIGNvdW50ID8gKHN0YXJ0SW5kZXggKyBjb3VudCkgOiAtMTtcbn1cbiJdfQ==