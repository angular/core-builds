/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../util/ng_dev_mode';
import { assertDefined, assertDomNode } from '../util/assert';
import { EMPTY_ARRAY } from '../util/empty';
import { assertLView } from './assert';
import { LContext } from './interfaces/context';
import { getLViewById, registerLView } from './interfaces/lview_tracking';
import { isLView } from './interfaces/type_checks';
import { CONTEXT, HEADER_OFFSET, HOST, ID, TVIEW } from './interfaces/view';
import { getComponentLViewByIndex, unwrapRNode } from './util/view_utils';
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
 * @param target Component, Directive or DOM Node.
 */
export function getLContext(target) {
    let mpValue = readPatchedData(target);
    if (mpValue) {
        // only when it's an array is it considered an LView instance
        // ... otherwise it's an already constructed LContext instance
        if (isLView(mpValue)) {
            const lView = mpValue;
            let nodeIndex;
            let component = undefined;
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
                nodeIndex = findViaNativeElement(lView, target);
                if (nodeIndex == -1) {
                    return null;
                }
            }
            // the goal is not to fill the entire context full of data because the lookups
            // are expensive. Instead, only the target data (the element, component, container, ICU
            // expression or directive details) are filled into the context. If called multiple times
            // with different target values then the missing target data will be filled in.
            const native = unwrapRNode(lView[nodeIndex]);
            const existingCtx = readPatchedData(native);
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
        const rElement = target;
        ngDevMode && assertDomNode(rElement);
        // if the context is not found then we need to traverse upwards up the DOM
        // to find the nearest element that has already been monkey patched with data
        let parent = rElement;
        while (parent = parent.parentNode) {
            const parentContext = readPatchedData(parent);
            if (parentContext) {
                const lView = Array.isArray(parentContext) ? parentContext : parentContext.lView;
                // the edge of the app was also reached here through another means
                // (maybe because the DOM was changed manually).
                if (!lView) {
                    return null;
                }
                const index = findViaNativeElement(lView, rElement);
                if (index >= 0) {
                    const native = unwrapRNode(lView[index]);
                    const context = createLContext(lView, index, native);
                    attachPatchData(native, context);
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
function createLContext(lView, nodeIndex, native) {
    return new LContext(lView[ID], nodeIndex, native);
}
/**
 * Takes a component instance and returns the view for that component.
 *
 * @param componentInstance
 * @returns The component's view
 */
export function getComponentViewByInstance(componentInstance) {
    let patchedData = readPatchedData(componentInstance);
    let lView;
    if (isLView(patchedData)) {
        const contextLView = patchedData;
        const nodeIndex = findViaComponent(contextLView, componentInstance);
        lView = getComponentLViewByIndex(nodeIndex, contextLView);
        const context = createLContext(contextLView, nodeIndex, lView[HOST]);
        context.component = componentInstance;
        attachPatchData(componentInstance, context);
        attachPatchData(context.native, context);
    }
    else {
        const context = patchedData;
        const contextLView = context.lView;
        ngDevMode && assertLView(contextLView);
        lView = getComponentLViewByIndex(context.nodeIndex, contextLView);
    }
    return lView;
}
/**
 * This property will be monkey-patched on elements, components and directives.
 */
const MONKEY_PATCH_KEY_NAME = '__ngContext__';
/**
 * Assigns the given data to the given target (which could be a component,
 * directive or DOM node instance) using monkey-patching.
 */
export function attachPatchData(target, data) {
    ngDevMode && assertDefined(target, 'Target expected');
    // Only attach the ID of the view in order to avoid memory leaks (see #41047). We only do this
    // for `LView`, because we have control over when an `LView` is created and destroyed, whereas
    // we can't know when to remove an `LContext`.
    if (isLView(data)) {
        target[MONKEY_PATCH_KEY_NAME] = data[ID];
        registerLView(data);
    }
    else {
        target[MONKEY_PATCH_KEY_NAME] = data;
    }
}
/**
 * Returns the monkey-patch value data present on the target (which could be
 * a component, directive or a DOM node).
 */
export function readPatchedData(target) {
    ngDevMode && assertDefined(target, 'Target expected');
    const data = target[MONKEY_PATCH_KEY_NAME];
    return (typeof data === 'number') ? getLViewById(data) : data || null;
}
export function readPatchedLView(target) {
    const value = readPatchedData(target);
    if (value) {
        return isLView(value) ? value : value.lView;
    }
    return null;
}
export function isComponentInstance(instance) {
    return instance && instance.constructor && instance.constructor.ɵcmp;
}
export function isDirectiveInstance(instance) {
    return instance && instance.constructor && instance.constructor.ɵdir;
}
/**
 * Locates the element within the given LView and returns the matching index
 */
function findViaNativeElement(lView, target) {
    const tView = lView[TVIEW];
    for (let i = HEADER_OFFSET; i < tView.bindingStartIndex; i++) {
        if (unwrapRNode(lView[i]) === target) {
            return i;
        }
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
 */
function findViaComponent(lView, componentInstance) {
    const componentIndices = lView[TVIEW].components;
    if (componentIndices) {
        for (let i = 0; i < componentIndices.length; i++) {
            const elementComponentIndex = componentIndices[i];
            const componentView = getComponentLViewByIndex(elementComponentIndex, lView);
            if (componentView[CONTEXT] === componentInstance) {
                return elementComponentIndex;
            }
        }
    }
    else {
        const rootComponentView = getComponentLViewByIndex(HEADER_OFFSET, lView);
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
 */
function findViaDirective(lView, directiveInstance) {
    // if a directive is monkey patched then it will (by default)
    // have a reference to the LView of the current view. The
    // element bound to the directive being search lives somewhere
    // in the view data. We loop through the nodes and check their
    // list of directives for the instance.
    let tNode = lView[TVIEW].firstChild;
    while (tNode) {
        const directiveIndexStart = tNode.directiveStart;
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
 * @param nodeIndex The node index
 * @param lView The target view data
 * @param includeComponents Whether or not to include components in returned directives
 */
export function getDirectivesAtNodeIndex(nodeIndex, lView, includeComponents) {
    const tNode = lView[TVIEW].data[nodeIndex];
    let directiveStartIndex = tNode.directiveStart;
    if (directiveStartIndex == 0)
        return EMPTY_ARRAY;
    const directiveEndIndex = tNode.directiveEnd;
    if (!includeComponents && tNode.flags & 2 /* isComponentHost */)
        directiveStartIndex++;
    return lView.slice(directiveStartIndex, directiveEndIndex);
}
export function getComponentAtNodeIndex(nodeIndex, lView) {
    const tNode = lView[TVIEW].data[nodeIndex];
    let directiveStartIndex = tNode.directiveStart;
    return tNode.flags & 2 /* isComponentHost */ ? lView[directiveStartIndex] : null;
}
/**
 * Returns a map of local references (local reference name => element or directive instance) that
 * exist on a given element.
 */
export function discoverLocalRefs(lView, nodeIndex) {
    const tNode = lView[TVIEW].data[nodeIndex];
    if (tNode && tNode.localNames) {
        const result = {};
        let localIndex = tNode.index + 1;
        for (let i = 0; i < tNode.localNames.length; i += 2) {
            result[tNode.localNames[i]] = lView[localIndex];
            localIndex++;
        }
        return result;
    }
    return null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9kaXNjb3ZlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2NvbnRleHRfZGlzY292ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8scUJBQXFCLENBQUM7QUFFN0IsT0FBTyxFQUFDLGFBQWEsRUFBRSxhQUFhLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM1RCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRTFDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDckMsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxZQUFZLEVBQUUsYUFBYSxFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFHeEUsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQVMsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakYsT0FBTyxFQUFDLHdCQUF3QixFQUFFLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBSXhFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUJHO0FBQ0gsTUFBTSxVQUFVLFdBQVcsQ0FBQyxNQUFXO0lBQ3JDLElBQUksT0FBTyxHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN0QyxJQUFJLE9BQU8sRUFBRTtRQUNYLDZEQUE2RDtRQUM3RCw4REFBOEQ7UUFDOUQsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDcEIsTUFBTSxLQUFLLEdBQVUsT0FBUSxDQUFDO1lBQzlCLElBQUksU0FBaUIsQ0FBQztZQUN0QixJQUFJLFNBQVMsR0FBUSxTQUFTLENBQUM7WUFDL0IsSUFBSSxVQUFVLEdBQXlCLFNBQVMsQ0FBQztZQUVqRCxJQUFJLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUMvQixTQUFTLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUM1QyxJQUFJLFNBQVMsSUFBSSxDQUFDLENBQUMsRUFBRTtvQkFDbkIsTUFBTSxJQUFJLEtBQUssQ0FBQyx5REFBeUQsQ0FBQyxDQUFDO2lCQUM1RTtnQkFDRCxTQUFTLEdBQUcsTUFBTSxDQUFDO2FBQ3BCO2lCQUFNLElBQUksbUJBQW1CLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ3RDLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQzVDLElBQUksU0FBUyxJQUFJLENBQUMsQ0FBQyxFQUFFO29CQUNuQixNQUFNLElBQUksS0FBSyxDQUFDLHlEQUF5RCxDQUFDLENBQUM7aUJBQzVFO2dCQUNELFVBQVUsR0FBRyx3QkFBd0IsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQ2hFO2lCQUFNO2dCQUNMLFNBQVMsR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsTUFBa0IsQ0FBQyxDQUFDO2dCQUM1RCxJQUFJLFNBQVMsSUFBSSxDQUFDLENBQUMsRUFBRTtvQkFDbkIsT0FBTyxJQUFJLENBQUM7aUJBQ2I7YUFDRjtZQUVELDhFQUE4RTtZQUM5RSx1RkFBdUY7WUFDdkYseUZBQXlGO1lBQ3pGLCtFQUErRTtZQUMvRSxNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDN0MsTUFBTSxXQUFXLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVDLE1BQU0sT0FBTyxHQUFhLENBQUMsV0FBVyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BFLFdBQVcsQ0FBQyxDQUFDO2dCQUNiLGNBQWMsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRTdDLDJFQUEyRTtZQUMzRSxJQUFJLFNBQVMsSUFBSSxPQUFPLENBQUMsU0FBUyxLQUFLLFNBQVMsRUFBRTtnQkFDaEQsT0FBTyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7Z0JBQzlCLGVBQWUsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2FBQzdDO1lBRUQsNkVBQTZFO1lBQzdFLElBQUksVUFBVSxJQUFJLE9BQU8sQ0FBQyxVQUFVLEtBQUssU0FBUyxFQUFFO2dCQUNsRCxPQUFPLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztnQkFDaEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQzFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7aUJBQ3pDO2FBQ0Y7WUFFRCxlQUFlLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN6QyxPQUFPLEdBQUcsT0FBTyxDQUFDO1NBQ25CO0tBQ0Y7U0FBTTtRQUNMLE1BQU0sUUFBUSxHQUFHLE1BQWtCLENBQUM7UUFDcEMsU0FBUyxJQUFJLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVyQywwRUFBMEU7UUFDMUUsNkVBQTZFO1FBQzdFLElBQUksTUFBTSxHQUFHLFFBQWUsQ0FBQztRQUM3QixPQUFPLE1BQU0sR0FBRyxNQUFNLENBQUMsVUFBVSxFQUFFO1lBQ2pDLE1BQU0sYUFBYSxHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM5QyxJQUFJLGFBQWEsRUFBRTtnQkFDakIsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBc0IsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztnQkFFMUYsa0VBQWtFO2dCQUNsRSxnREFBZ0Q7Z0JBQ2hELElBQUksQ0FBQyxLQUFLLEVBQUU7b0JBQ1YsT0FBTyxJQUFJLENBQUM7aUJBQ2I7Z0JBRUQsTUFBTSxLQUFLLEdBQUcsb0JBQW9CLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNwRCxJQUFJLEtBQUssSUFBSSxDQUFDLEVBQUU7b0JBQ2QsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO29CQUN6QyxNQUFNLE9BQU8sR0FBRyxjQUFjLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztvQkFDckQsZUFBZSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDakMsT0FBTyxHQUFHLE9BQU8sQ0FBQztvQkFDbEIsTUFBTTtpQkFDUDthQUNGO1NBQ0Y7S0FDRjtJQUNELE9BQVEsT0FBb0IsSUFBSSxJQUFJLENBQUM7QUFDdkMsQ0FBQztBQUVEOztHQUVHO0FBQ0gsU0FBUyxjQUFjLENBQUMsS0FBWSxFQUFFLFNBQWlCLEVBQUUsTUFBYTtJQUNwRSxPQUFPLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDcEQsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLDBCQUEwQixDQUFDLGlCQUFxQjtJQUM5RCxJQUFJLFdBQVcsR0FBRyxlQUFlLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUNyRCxJQUFJLEtBQVksQ0FBQztJQUVqQixJQUFJLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFBRTtRQUN4QixNQUFNLFlBQVksR0FBVSxXQUFXLENBQUM7UUFDeEMsTUFBTSxTQUFTLEdBQUcsZ0JBQWdCLENBQUMsWUFBWSxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDcEUsS0FBSyxHQUFHLHdCQUF3QixDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUMxRCxNQUFNLE9BQU8sR0FBRyxjQUFjLENBQUMsWUFBWSxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFhLENBQUMsQ0FBQztRQUNqRixPQUFPLENBQUMsU0FBUyxHQUFHLGlCQUFpQixDQUFDO1FBQ3RDLGVBQWUsQ0FBQyxpQkFBaUIsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM1QyxlQUFlLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztLQUMxQztTQUFNO1FBQ0wsTUFBTSxPQUFPLEdBQUcsV0FBa0MsQ0FBQztRQUNuRCxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsS0FBTSxDQUFDO1FBQ3BDLFNBQVMsSUFBSSxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDdkMsS0FBSyxHQUFHLHdCQUF3QixDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLENBQUM7S0FDbkU7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0scUJBQXFCLEdBQUcsZUFBZSxDQUFDO0FBRTlDOzs7R0FHRztBQUNILE1BQU0sVUFBVSxlQUFlLENBQUMsTUFBVyxFQUFFLElBQW9CO0lBQy9ELFNBQVMsSUFBSSxhQUFhLENBQUMsTUFBTSxFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFDdEQsOEZBQThGO0lBQzlGLDhGQUE4RjtJQUM5Riw4Q0FBOEM7SUFDOUMsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDakIsTUFBTSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3pDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNyQjtTQUFNO1FBQ0wsTUFBTSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsSUFBSSxDQUFDO0tBQ3RDO0FBQ0gsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSxlQUFlLENBQUMsTUFBVztJQUN6QyxTQUFTLElBQUksYUFBYSxDQUFDLE1BQU0sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0lBQ3RELE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0lBQzNDLE9BQU8sQ0FBQyxPQUFPLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDO0FBQ3hFLENBQUM7QUFFRCxNQUFNLFVBQVUsZ0JBQWdCLENBQUMsTUFBVztJQUMxQyxNQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdEMsSUFBSSxLQUFLLEVBQUU7UUFDVCxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO0tBQzdDO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsTUFBTSxVQUFVLG1CQUFtQixDQUFDLFFBQWE7SUFDL0MsT0FBTyxRQUFRLElBQUksUUFBUSxDQUFDLFdBQVcsSUFBSSxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztBQUN2RSxDQUFDO0FBRUQsTUFBTSxVQUFVLG1CQUFtQixDQUFDLFFBQWE7SUFDL0MsT0FBTyxRQUFRLElBQUksUUFBUSxDQUFDLFdBQVcsSUFBSSxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztBQUN2RSxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLG9CQUFvQixDQUFDLEtBQVksRUFBRSxNQUFnQjtJQUMxRCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsS0FBSyxJQUFJLENBQUMsR0FBRyxhQUFhLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUM1RCxJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxNQUFNLEVBQUU7WUFDcEMsT0FBTyxDQUFDLENBQUM7U0FDVjtLQUNGO0lBRUQsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNaLENBQUM7QUFFRDs7R0FFRztBQUNILFNBQVMsbUJBQW1CLENBQUMsS0FBWTtJQUN2QyxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUU7UUFDZixPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUM7S0FDcEI7U0FBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUU7UUFDckIsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDO0tBQ25CO1NBQU07UUFDTCw4RUFBOEU7UUFDOUUseUZBQXlGO1FBQ3pGLG9FQUFvRTtRQUNwRSxPQUFPLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRTtZQUN6QyxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztTQUN0QjtRQUNELE9BQU8sS0FBSyxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztLQUMxQztBQUNILENBQUM7QUFFRDs7R0FFRztBQUNILFNBQVMsZ0JBQWdCLENBQUMsS0FBWSxFQUFFLGlCQUFxQjtJQUMzRCxNQUFNLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVLENBQUM7SUFDakQsSUFBSSxnQkFBZ0IsRUFBRTtRQUNwQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2hELE1BQU0scUJBQXFCLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEQsTUFBTSxhQUFhLEdBQUcsd0JBQXdCLENBQUMscUJBQXFCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDN0UsSUFBSSxhQUFhLENBQUMsT0FBTyxDQUFDLEtBQUssaUJBQWlCLEVBQUU7Z0JBQ2hELE9BQU8scUJBQXFCLENBQUM7YUFDOUI7U0FDRjtLQUNGO1NBQU07UUFDTCxNQUFNLGlCQUFpQixHQUFHLHdCQUF3QixDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN6RSxNQUFNLGFBQWEsR0FBRyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNqRCxJQUFJLGFBQWEsS0FBSyxpQkFBaUIsRUFBRTtZQUN2Qyx1RUFBdUU7WUFDdkUsdUVBQXVFO1lBQ3ZFLE9BQU8sYUFBYSxDQUFDO1NBQ3RCO0tBQ0Y7SUFDRCxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ1osQ0FBQztBQUVEOztHQUVHO0FBQ0gsU0FBUyxnQkFBZ0IsQ0FBQyxLQUFZLEVBQUUsaUJBQXFCO0lBQzNELDZEQUE2RDtJQUM3RCx5REFBeUQ7SUFDekQsOERBQThEO0lBQzlELDhEQUE4RDtJQUM5RCx1Q0FBdUM7SUFDdkMsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsQ0FBQztJQUNwQyxPQUFPLEtBQUssRUFBRTtRQUNaLE1BQU0sbUJBQW1CLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQztRQUNqRCxNQUFNLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUM7UUFDN0MsS0FBSyxJQUFJLENBQUMsR0FBRyxtQkFBbUIsRUFBRSxDQUFDLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDNUQsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssaUJBQWlCLEVBQUU7Z0JBQ2xDLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQzthQUNwQjtTQUNGO1FBQ0QsS0FBSyxHQUFHLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ3BDO0lBQ0QsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNaLENBQUM7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxVQUFVLHdCQUF3QixDQUNwQyxTQUFpQixFQUFFLEtBQVksRUFBRSxpQkFBMEI7SUFDN0QsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQVUsQ0FBQztJQUNwRCxJQUFJLG1CQUFtQixHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUM7SUFDL0MsSUFBSSxtQkFBbUIsSUFBSSxDQUFDO1FBQUUsT0FBTyxXQUFXLENBQUM7SUFDakQsTUFBTSxpQkFBaUIsR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDO0lBQzdDLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxLQUFLLENBQUMsS0FBSywwQkFBNkI7UUFBRSxtQkFBbUIsRUFBRSxDQUFDO0lBQzFGLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBQzdELENBQUM7QUFFRCxNQUFNLFVBQVUsdUJBQXVCLENBQUMsU0FBaUIsRUFBRSxLQUFZO0lBQ3JFLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFVLENBQUM7SUFDcEQsSUFBSSxtQkFBbUIsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDO0lBQy9DLE9BQU8sS0FBSyxDQUFDLEtBQUssMEJBQTZCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDdEYsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxLQUFZLEVBQUUsU0FBaUI7SUFDL0QsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQVUsQ0FBQztJQUNwRCxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsVUFBVSxFQUFFO1FBQzdCLE1BQU0sTUFBTSxHQUF5QixFQUFFLENBQUM7UUFDeEMsSUFBSSxVQUFVLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7UUFDakMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDbkQsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDaEQsVUFBVSxFQUFFLENBQUM7U0FDZDtRQUNELE9BQU8sTUFBTSxDQUFDO0tBQ2Y7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCAnLi4vdXRpbC9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RG9tTm9kZX0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtFTVBUWV9BUlJBWX0gZnJvbSAnLi4vdXRpbC9lbXB0eSc7XG5cbmltcG9ydCB7YXNzZXJ0TFZpZXd9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7TENvbnRleHR9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250ZXh0JztcbmltcG9ydCB7Z2V0TFZpZXdCeUlkLCByZWdpc3RlckxWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvbHZpZXdfdHJhY2tpbmcnO1xuaW1wb3J0IHtUTm9kZSwgVE5vZGVGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudCwgUk5vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcl9kb20nO1xuaW1wb3J0IHtpc0xWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtDT05URVhULCBIRUFERVJfT0ZGU0VULCBIT1NULCBJRCwgTFZpZXcsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldENvbXBvbmVudExWaWV3QnlJbmRleCwgdW53cmFwUk5vZGV9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcblxuXG5cbi8qKlxuICogUmV0dXJucyB0aGUgbWF0Y2hpbmcgYExDb250ZXh0YCBkYXRhIGZvciBhIGdpdmVuIERPTSBub2RlLCBkaXJlY3RpdmUgb3IgY29tcG9uZW50IGluc3RhbmNlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBleGFtaW5lIHRoZSBwcm92aWRlZCBET00gZWxlbWVudCwgY29tcG9uZW50LCBvciBkaXJlY3RpdmUgaW5zdGFuY2VcXCdzXG4gKiBtb25rZXktcGF0Y2hlZCBwcm9wZXJ0eSB0byBkZXJpdmUgdGhlIGBMQ29udGV4dGAgZGF0YS4gT25jZSBjYWxsZWQgdGhlbiB0aGUgbW9ua2V5LXBhdGNoZWRcbiAqIHZhbHVlIHdpbGwgYmUgdGhhdCBvZiB0aGUgbmV3bHkgY3JlYXRlZCBgTENvbnRleHRgLlxuICpcbiAqIElmIHRoZSBtb25rZXktcGF0Y2hlZCB2YWx1ZSBpcyB0aGUgYExWaWV3YCBpbnN0YW5jZSB0aGVuIHRoZSBjb250ZXh0IHZhbHVlIGZvciB0aGF0XG4gKiB0YXJnZXQgd2lsbCBiZSBjcmVhdGVkIGFuZCB0aGUgbW9ua2V5LXBhdGNoIHJlZmVyZW5jZSB3aWxsIGJlIHVwZGF0ZWQuIFRoZXJlZm9yZSB3aGVuIHRoaXNcbiAqIGZ1bmN0aW9uIGlzIGNhbGxlZCBpdCBtYXkgbXV0YXRlIHRoZSBwcm92aWRlZCBlbGVtZW50XFwncywgY29tcG9uZW50XFwncyBvciBhbnkgb2YgdGhlIGFzc29jaWF0ZWRcbiAqIGRpcmVjdGl2ZVxcJ3MgbW9ua2V5LXBhdGNoIHZhbHVlcy5cbiAqXG4gKiBJZiB0aGUgbW9ua2V5LXBhdGNoIHZhbHVlIGlzIG5vdCBkZXRlY3RlZCB0aGVuIHRoZSBjb2RlIHdpbGwgd2FsayB1cCB0aGUgRE9NIHVudGlsIGFuIGVsZW1lbnRcbiAqIGlzIGZvdW5kIHdoaWNoIGNvbnRhaW5zIGEgbW9ua2V5LXBhdGNoIHJlZmVyZW5jZS4gV2hlbiB0aGF0IG9jY3VycyB0aGVuIHRoZSBwcm92aWRlZCBlbGVtZW50XG4gKiB3aWxsIGJlIHVwZGF0ZWQgd2l0aCBhIG5ldyBjb250ZXh0ICh3aGljaCBpcyB0aGVuIHJldHVybmVkKS4gSWYgdGhlIG1vbmtleS1wYXRjaCB2YWx1ZSBpcyBub3RcbiAqIGRldGVjdGVkIGZvciBhIGNvbXBvbmVudC9kaXJlY3RpdmUgaW5zdGFuY2UgdGhlbiBpdCB3aWxsIHRocm93IGFuIGVycm9yIChhbGwgY29tcG9uZW50cyBhbmRcbiAqIGRpcmVjdGl2ZXMgc2hvdWxkIGJlIGF1dG9tYXRpY2FsbHkgbW9ua2V5LXBhdGNoZWQgYnkgaXZ5KS5cbiAqXG4gKiBAcGFyYW0gdGFyZ2V0IENvbXBvbmVudCwgRGlyZWN0aXZlIG9yIERPTSBOb2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TENvbnRleHQodGFyZ2V0OiBhbnkpOiBMQ29udGV4dHxudWxsIHtcbiAgbGV0IG1wVmFsdWUgPSByZWFkUGF0Y2hlZERhdGEodGFyZ2V0KTtcbiAgaWYgKG1wVmFsdWUpIHtcbiAgICAvLyBvbmx5IHdoZW4gaXQncyBhbiBhcnJheSBpcyBpdCBjb25zaWRlcmVkIGFuIExWaWV3IGluc3RhbmNlXG4gICAgLy8gLi4uIG90aGVyd2lzZSBpdCdzIGFuIGFscmVhZHkgY29uc3RydWN0ZWQgTENvbnRleHQgaW5zdGFuY2VcbiAgICBpZiAoaXNMVmlldyhtcFZhbHVlKSkge1xuICAgICAgY29uc3QgbFZpZXc6IExWaWV3ID0gbXBWYWx1ZSE7XG4gICAgICBsZXQgbm9kZUluZGV4OiBudW1iZXI7XG4gICAgICBsZXQgY29tcG9uZW50OiBhbnkgPSB1bmRlZmluZWQ7XG4gICAgICBsZXQgZGlyZWN0aXZlczogYW55W118bnVsbHx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgICAgIGlmIChpc0NvbXBvbmVudEluc3RhbmNlKHRhcmdldCkpIHtcbiAgICAgICAgbm9kZUluZGV4ID0gZmluZFZpYUNvbXBvbmVudChsVmlldywgdGFyZ2V0KTtcbiAgICAgICAgaWYgKG5vZGVJbmRleCA9PSAtMSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHByb3ZpZGVkIGNvbXBvbmVudCB3YXMgbm90IGZvdW5kIGluIHRoZSBhcHBsaWNhdGlvbicpO1xuICAgICAgICB9XG4gICAgICAgIGNvbXBvbmVudCA9IHRhcmdldDtcbiAgICAgIH0gZWxzZSBpZiAoaXNEaXJlY3RpdmVJbnN0YW5jZSh0YXJnZXQpKSB7XG4gICAgICAgIG5vZGVJbmRleCA9IGZpbmRWaWFEaXJlY3RpdmUobFZpZXcsIHRhcmdldCk7XG4gICAgICAgIGlmIChub2RlSW5kZXggPT0gLTEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBwcm92aWRlZCBkaXJlY3RpdmUgd2FzIG5vdCBmb3VuZCBpbiB0aGUgYXBwbGljYXRpb24nKTtcbiAgICAgICAgfVxuICAgICAgICBkaXJlY3RpdmVzID0gZ2V0RGlyZWN0aXZlc0F0Tm9kZUluZGV4KG5vZGVJbmRleCwgbFZpZXcsIGZhbHNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGVJbmRleCA9IGZpbmRWaWFOYXRpdmVFbGVtZW50KGxWaWV3LCB0YXJnZXQgYXMgUkVsZW1lbnQpO1xuICAgICAgICBpZiAobm9kZUluZGV4ID09IC0xKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gdGhlIGdvYWwgaXMgbm90IHRvIGZpbGwgdGhlIGVudGlyZSBjb250ZXh0IGZ1bGwgb2YgZGF0YSBiZWNhdXNlIHRoZSBsb29rdXBzXG4gICAgICAvLyBhcmUgZXhwZW5zaXZlLiBJbnN0ZWFkLCBvbmx5IHRoZSB0YXJnZXQgZGF0YSAodGhlIGVsZW1lbnQsIGNvbXBvbmVudCwgY29udGFpbmVyLCBJQ1VcbiAgICAgIC8vIGV4cHJlc3Npb24gb3IgZGlyZWN0aXZlIGRldGFpbHMpIGFyZSBmaWxsZWQgaW50byB0aGUgY29udGV4dC4gSWYgY2FsbGVkIG11bHRpcGxlIHRpbWVzXG4gICAgICAvLyB3aXRoIGRpZmZlcmVudCB0YXJnZXQgdmFsdWVzIHRoZW4gdGhlIG1pc3NpbmcgdGFyZ2V0IGRhdGEgd2lsbCBiZSBmaWxsZWQgaW4uXG4gICAgICBjb25zdCBuYXRpdmUgPSB1bndyYXBSTm9kZShsVmlld1tub2RlSW5kZXhdKTtcbiAgICAgIGNvbnN0IGV4aXN0aW5nQ3R4ID0gcmVhZFBhdGNoZWREYXRhKG5hdGl2ZSk7XG4gICAgICBjb25zdCBjb250ZXh0OiBMQ29udGV4dCA9IChleGlzdGluZ0N0eCAmJiAhQXJyYXkuaXNBcnJheShleGlzdGluZ0N0eCkpID9cbiAgICAgICAgICBleGlzdGluZ0N0eCA6XG4gICAgICAgICAgY3JlYXRlTENvbnRleHQobFZpZXcsIG5vZGVJbmRleCwgbmF0aXZlKTtcblxuICAgICAgLy8gb25seSB3aGVuIHRoZSBjb21wb25lbnQgaGFzIGJlZW4gZGlzY292ZXJlZCB0aGVuIHVwZGF0ZSB0aGUgbW9ua2V5LXBhdGNoXG4gICAgICBpZiAoY29tcG9uZW50ICYmIGNvbnRleHQuY29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGV4dC5jb21wb25lbnQgPSBjb21wb25lbnQ7XG4gICAgICAgIGF0dGFjaFBhdGNoRGF0YShjb250ZXh0LmNvbXBvbmVudCwgY29udGV4dCk7XG4gICAgICB9XG5cbiAgICAgIC8vIG9ubHkgd2hlbiB0aGUgZGlyZWN0aXZlcyBoYXZlIGJlZW4gZGlzY292ZXJlZCB0aGVuIHVwZGF0ZSB0aGUgbW9ua2V5LXBhdGNoXG4gICAgICBpZiAoZGlyZWN0aXZlcyAmJiBjb250ZXh0LmRpcmVjdGl2ZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb250ZXh0LmRpcmVjdGl2ZXMgPSBkaXJlY3RpdmVzO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBhdHRhY2hQYXRjaERhdGEoZGlyZWN0aXZlc1tpXSwgY29udGV4dCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgYXR0YWNoUGF0Y2hEYXRhKGNvbnRleHQubmF0aXZlLCBjb250ZXh0KTtcbiAgICAgIG1wVmFsdWUgPSBjb250ZXh0O1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCByRWxlbWVudCA9IHRhcmdldCBhcyBSRWxlbWVudDtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RG9tTm9kZShyRWxlbWVudCk7XG5cbiAgICAvLyBpZiB0aGUgY29udGV4dCBpcyBub3QgZm91bmQgdGhlbiB3ZSBuZWVkIHRvIHRyYXZlcnNlIHVwd2FyZHMgdXAgdGhlIERPTVxuICAgIC8vIHRvIGZpbmQgdGhlIG5lYXJlc3QgZWxlbWVudCB0aGF0IGhhcyBhbHJlYWR5IGJlZW4gbW9ua2V5IHBhdGNoZWQgd2l0aCBkYXRhXG4gICAgbGV0IHBhcmVudCA9IHJFbGVtZW50IGFzIGFueTtcbiAgICB3aGlsZSAocGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGUpIHtcbiAgICAgIGNvbnN0IHBhcmVudENvbnRleHQgPSByZWFkUGF0Y2hlZERhdGEocGFyZW50KTtcbiAgICAgIGlmIChwYXJlbnRDb250ZXh0KSB7XG4gICAgICAgIGNvbnN0IGxWaWV3ID0gQXJyYXkuaXNBcnJheShwYXJlbnRDb250ZXh0KSA/IHBhcmVudENvbnRleHQgYXMgTFZpZXcgOiBwYXJlbnRDb250ZXh0LmxWaWV3O1xuXG4gICAgICAgIC8vIHRoZSBlZGdlIG9mIHRoZSBhcHAgd2FzIGFsc28gcmVhY2hlZCBoZXJlIHRocm91Z2ggYW5vdGhlciBtZWFuc1xuICAgICAgICAvLyAobWF5YmUgYmVjYXVzZSB0aGUgRE9NIHdhcyBjaGFuZ2VkIG1hbnVhbGx5KS5cbiAgICAgICAgaWYgKCFsVmlldykge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaW5kZXggPSBmaW5kVmlhTmF0aXZlRWxlbWVudChsVmlldywgckVsZW1lbnQpO1xuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgIGNvbnN0IG5hdGl2ZSA9IHVud3JhcFJOb2RlKGxWaWV3W2luZGV4XSk7XG4gICAgICAgICAgY29uc3QgY29udGV4dCA9IGNyZWF0ZUxDb250ZXh0KGxWaWV3LCBpbmRleCwgbmF0aXZlKTtcbiAgICAgICAgICBhdHRhY2hQYXRjaERhdGEobmF0aXZlLCBjb250ZXh0KTtcbiAgICAgICAgICBtcFZhbHVlID0gY29udGV4dDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gKG1wVmFsdWUgYXMgTENvbnRleHQpIHx8IG51bGw7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlbXB0eSBpbnN0YW5jZSBvZiBhIGBMQ29udGV4dGAgY29udGV4dFxuICovXG5mdW5jdGlvbiBjcmVhdGVMQ29udGV4dChsVmlldzogTFZpZXcsIG5vZGVJbmRleDogbnVtYmVyLCBuYXRpdmU6IFJOb2RlKTogTENvbnRleHQge1xuICByZXR1cm4gbmV3IExDb250ZXh0KGxWaWV3W0lEXSwgbm9kZUluZGV4LCBuYXRpdmUpO1xufVxuXG4vKipcbiAqIFRha2VzIGEgY29tcG9uZW50IGluc3RhbmNlIGFuZCByZXR1cm5zIHRoZSB2aWV3IGZvciB0aGF0IGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50SW5zdGFuY2VcbiAqIEByZXR1cm5zIFRoZSBjb21wb25lbnQncyB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21wb25lbnRWaWV3QnlJbnN0YW5jZShjb21wb25lbnRJbnN0YW5jZToge30pOiBMVmlldyB7XG4gIGxldCBwYXRjaGVkRGF0YSA9IHJlYWRQYXRjaGVkRGF0YShjb21wb25lbnRJbnN0YW5jZSk7XG4gIGxldCBsVmlldzogTFZpZXc7XG5cbiAgaWYgKGlzTFZpZXcocGF0Y2hlZERhdGEpKSB7XG4gICAgY29uc3QgY29udGV4dExWaWV3OiBMVmlldyA9IHBhdGNoZWREYXRhO1xuICAgIGNvbnN0IG5vZGVJbmRleCA9IGZpbmRWaWFDb21wb25lbnQoY29udGV4dExWaWV3LCBjb21wb25lbnRJbnN0YW5jZSk7XG4gICAgbFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgobm9kZUluZGV4LCBjb250ZXh0TFZpZXcpO1xuICAgIGNvbnN0IGNvbnRleHQgPSBjcmVhdGVMQ29udGV4dChjb250ZXh0TFZpZXcsIG5vZGVJbmRleCwgbFZpZXdbSE9TVF0gYXMgUkVsZW1lbnQpO1xuICAgIGNvbnRleHQuY29tcG9uZW50ID0gY29tcG9uZW50SW5zdGFuY2U7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKGNvbXBvbmVudEluc3RhbmNlLCBjb250ZXh0KTtcbiAgICBhdHRhY2hQYXRjaERhdGEoY29udGV4dC5uYXRpdmUsIGNvbnRleHQpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGNvbnRleHQgPSBwYXRjaGVkRGF0YSBhcyB1bmtub3duIGFzIExDb250ZXh0O1xuICAgIGNvbnN0IGNvbnRleHRMVmlldyA9IGNvbnRleHQubFZpZXchO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhjb250ZXh0TFZpZXcpO1xuICAgIGxWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KGNvbnRleHQubm9kZUluZGV4LCBjb250ZXh0TFZpZXcpO1xuICB9XG4gIHJldHVybiBsVmlldztcbn1cblxuLyoqXG4gKiBUaGlzIHByb3BlcnR5IHdpbGwgYmUgbW9ua2V5LXBhdGNoZWQgb24gZWxlbWVudHMsIGNvbXBvbmVudHMgYW5kIGRpcmVjdGl2ZXMuXG4gKi9cbmNvbnN0IE1PTktFWV9QQVRDSF9LRVlfTkFNRSA9ICdfX25nQ29udGV4dF9fJztcblxuLyoqXG4gKiBBc3NpZ25zIHRoZSBnaXZlbiBkYXRhIHRvIHRoZSBnaXZlbiB0YXJnZXQgKHdoaWNoIGNvdWxkIGJlIGEgY29tcG9uZW50LFxuICogZGlyZWN0aXZlIG9yIERPTSBub2RlIGluc3RhbmNlKSB1c2luZyBtb25rZXktcGF0Y2hpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hQYXRjaERhdGEodGFyZ2V0OiBhbnksIGRhdGE6IExWaWV3fExDb250ZXh0KSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRhcmdldCwgJ1RhcmdldCBleHBlY3RlZCcpO1xuICAvLyBPbmx5IGF0dGFjaCB0aGUgSUQgb2YgdGhlIHZpZXcgaW4gb3JkZXIgdG8gYXZvaWQgbWVtb3J5IGxlYWtzIChzZWUgIzQxMDQ3KS4gV2Ugb25seSBkbyB0aGlzXG4gIC8vIGZvciBgTFZpZXdgLCBiZWNhdXNlIHdlIGhhdmUgY29udHJvbCBvdmVyIHdoZW4gYW4gYExWaWV3YCBpcyBjcmVhdGVkIGFuZCBkZXN0cm95ZWQsIHdoZXJlYXNcbiAgLy8gd2UgY2FuJ3Qga25vdyB3aGVuIHRvIHJlbW92ZSBhbiBgTENvbnRleHRgLlxuICBpZiAoaXNMVmlldyhkYXRhKSkge1xuICAgIHRhcmdldFtNT05LRVlfUEFUQ0hfS0VZX05BTUVdID0gZGF0YVtJRF07XG4gICAgcmVnaXN0ZXJMVmlldyhkYXRhKTtcbiAgfSBlbHNlIHtcbiAgICB0YXJnZXRbTU9OS0VZX1BBVENIX0tFWV9OQU1FXSA9IGRhdGE7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBtb25rZXktcGF0Y2ggdmFsdWUgZGF0YSBwcmVzZW50IG9uIHRoZSB0YXJnZXQgKHdoaWNoIGNvdWxkIGJlXG4gKiBhIGNvbXBvbmVudCwgZGlyZWN0aXZlIG9yIGEgRE9NIG5vZGUpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZFBhdGNoZWREYXRhKHRhcmdldDogYW55KTogTFZpZXd8TENvbnRleHR8bnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRhcmdldCwgJ1RhcmdldCBleHBlY3RlZCcpO1xuICBjb25zdCBkYXRhID0gdGFyZ2V0W01PTktFWV9QQVRDSF9LRVlfTkFNRV07XG4gIHJldHVybiAodHlwZW9mIGRhdGEgPT09ICdudW1iZXInKSA/IGdldExWaWV3QnlJZChkYXRhKSA6IGRhdGEgfHwgbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRQYXRjaGVkTFZpZXcodGFyZ2V0OiBhbnkpOiBMVmlld3xudWxsIHtcbiAgY29uc3QgdmFsdWUgPSByZWFkUGF0Y2hlZERhdGEodGFyZ2V0KTtcbiAgaWYgKHZhbHVlKSB7XG4gICAgcmV0dXJuIGlzTFZpZXcodmFsdWUpID8gdmFsdWUgOiB2YWx1ZS5sVmlldztcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29tcG9uZW50SW5zdGFuY2UoaW5zdGFuY2U6IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gaW5zdGFuY2UgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IuybVjbXA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0RpcmVjdGl2ZUluc3RhbmNlKGluc3RhbmNlOiBhbnkpOiBib29sZWFuIHtcbiAgcmV0dXJuIGluc3RhbmNlICYmIGluc3RhbmNlLmNvbnN0cnVjdG9yICYmIGluc3RhbmNlLmNvbnN0cnVjdG9yLsm1ZGlyO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGVsZW1lbnQgd2l0aGluIHRoZSBnaXZlbiBMVmlldyBhbmQgcmV0dXJucyB0aGUgbWF0Y2hpbmcgaW5kZXhcbiAqL1xuZnVuY3Rpb24gZmluZFZpYU5hdGl2ZUVsZW1lbnQobFZpZXc6IExWaWV3LCB0YXJnZXQ6IFJFbGVtZW50KTogbnVtYmVyIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGZvciAobGV0IGkgPSBIRUFERVJfT0ZGU0VUOyBpIDwgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7IGkrKykge1xuICAgIGlmICh1bndyYXBSTm9kZShsVmlld1tpXSkgPT09IHRhcmdldCkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIG5leHQgdE5vZGUgKGNoaWxkLCBzaWJsaW5nIG9yIHBhcmVudCkuXG4gKi9cbmZ1bmN0aW9uIHRyYXZlcnNlTmV4dEVsZW1lbnQodE5vZGU6IFROb2RlKTogVE5vZGV8bnVsbCB7XG4gIGlmICh0Tm9kZS5jaGlsZCkge1xuICAgIHJldHVybiB0Tm9kZS5jaGlsZDtcbiAgfSBlbHNlIGlmICh0Tm9kZS5uZXh0KSB7XG4gICAgcmV0dXJuIHROb2RlLm5leHQ7XG4gIH0gZWxzZSB7XG4gICAgLy8gTGV0J3MgdGFrZSB0aGUgZm9sbG93aW5nIHRlbXBsYXRlOiA8ZGl2PjxzcGFuPnRleHQ8L3NwYW4+PC9kaXY+PGNvbXBvbmVudC8+XG4gICAgLy8gQWZ0ZXIgY2hlY2tpbmcgdGhlIHRleHQgbm9kZSwgd2UgbmVlZCB0byBmaW5kIHRoZSBuZXh0IHBhcmVudCB0aGF0IGhhcyBhIFwibmV4dFwiIFROb2RlLFxuICAgIC8vIGluIHRoaXMgY2FzZSB0aGUgcGFyZW50IGBkaXZgLCBzbyB0aGF0IHdlIGNhbiBmaW5kIHRoZSBjb21wb25lbnQuXG4gICAgd2hpbGUgKHROb2RlLnBhcmVudCAmJiAhdE5vZGUucGFyZW50Lm5leHQpIHtcbiAgICAgIHROb2RlID0gdE5vZGUucGFyZW50O1xuICAgIH1cbiAgICByZXR1cm4gdE5vZGUucGFyZW50ICYmIHROb2RlLnBhcmVudC5uZXh0O1xuICB9XG59XG5cbi8qKlxuICogTG9jYXRlcyB0aGUgY29tcG9uZW50IHdpdGhpbiB0aGUgZ2l2ZW4gTFZpZXcgYW5kIHJldHVybnMgdGhlIG1hdGNoaW5nIGluZGV4XG4gKi9cbmZ1bmN0aW9uIGZpbmRWaWFDb21wb25lbnQobFZpZXc6IExWaWV3LCBjb21wb25lbnRJbnN0YW5jZToge30pOiBudW1iZXIge1xuICBjb25zdCBjb21wb25lbnRJbmRpY2VzID0gbFZpZXdbVFZJRVddLmNvbXBvbmVudHM7XG4gIGlmIChjb21wb25lbnRJbmRpY2VzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wb25lbnRJbmRpY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbGVtZW50Q29tcG9uZW50SW5kZXggPSBjb21wb25lbnRJbmRpY2VzW2ldO1xuICAgICAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleChlbGVtZW50Q29tcG9uZW50SW5kZXgsIGxWaWV3KTtcbiAgICAgIGlmIChjb21wb25lbnRWaWV3W0NPTlRFWFRdID09PSBjb21wb25lbnRJbnN0YW5jZSkge1xuICAgICAgICByZXR1cm4gZWxlbWVudENvbXBvbmVudEluZGV4O1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCByb290Q29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleChIRUFERVJfT0ZGU0VULCBsVmlldyk7XG4gICAgY29uc3Qgcm9vdENvbXBvbmVudCA9IHJvb3RDb21wb25lbnRWaWV3W0NPTlRFWFRdO1xuICAgIGlmIChyb290Q29tcG9uZW50ID09PSBjb21wb25lbnRJbnN0YW5jZSkge1xuICAgICAgLy8gd2UgYXJlIGRlYWxpbmcgd2l0aCB0aGUgcm9vdCBlbGVtZW50IGhlcmUgdGhlcmVmb3JlIHdlIGtub3cgdGhhdCB0aGVcbiAgICAgIC8vIGVsZW1lbnQgaXMgdGhlIHZlcnkgZmlyc3QgZWxlbWVudCBhZnRlciB0aGUgSEVBREVSIGRhdGEgaW4gdGhlIGxWaWV3XG4gICAgICByZXR1cm4gSEVBREVSX09GRlNFVDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGRpcmVjdGl2ZSB3aXRoaW4gdGhlIGdpdmVuIExWaWV3IGFuZCByZXR1cm5zIHRoZSBtYXRjaGluZyBpbmRleFxuICovXG5mdW5jdGlvbiBmaW5kVmlhRGlyZWN0aXZlKGxWaWV3OiBMVmlldywgZGlyZWN0aXZlSW5zdGFuY2U6IHt9KTogbnVtYmVyIHtcbiAgLy8gaWYgYSBkaXJlY3RpdmUgaXMgbW9ua2V5IHBhdGNoZWQgdGhlbiBpdCB3aWxsIChieSBkZWZhdWx0KVxuICAvLyBoYXZlIGEgcmVmZXJlbmNlIHRvIHRoZSBMVmlldyBvZiB0aGUgY3VycmVudCB2aWV3LiBUaGVcbiAgLy8gZWxlbWVudCBib3VuZCB0byB0aGUgZGlyZWN0aXZlIGJlaW5nIHNlYXJjaCBsaXZlcyBzb21ld2hlcmVcbiAgLy8gaW4gdGhlIHZpZXcgZGF0YS4gV2UgbG9vcCB0aHJvdWdoIHRoZSBub2RlcyBhbmQgY2hlY2sgdGhlaXJcbiAgLy8gbGlzdCBvZiBkaXJlY3RpdmVzIGZvciB0aGUgaW5zdGFuY2UuXG4gIGxldCB0Tm9kZSA9IGxWaWV3W1RWSUVXXS5maXJzdENoaWxkO1xuICB3aGlsZSAodE5vZGUpIHtcbiAgICBjb25zdCBkaXJlY3RpdmVJbmRleFN0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gICAgY29uc3QgZGlyZWN0aXZlSW5kZXhFbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gICAgZm9yIChsZXQgaSA9IGRpcmVjdGl2ZUluZGV4U3RhcnQ7IGkgPCBkaXJlY3RpdmVJbmRleEVuZDsgaSsrKSB7XG4gICAgICBpZiAobFZpZXdbaV0gPT09IGRpcmVjdGl2ZUluc3RhbmNlKSB7XG4gICAgICAgIHJldHVybiB0Tm9kZS5pbmRleDtcbiAgICAgIH1cbiAgICB9XG4gICAgdE5vZGUgPSB0cmF2ZXJzZU5leHRFbGVtZW50KHROb2RlKTtcbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIGxpc3Qgb2YgZGlyZWN0aXZlcyBleHRyYWN0ZWQgZnJvbSB0aGUgZ2l2ZW4gdmlldyBiYXNlZCBvbiB0aGVcbiAqIHByb3ZpZGVkIGxpc3Qgb2YgZGlyZWN0aXZlIGluZGV4IHZhbHVlcy5cbiAqXG4gKiBAcGFyYW0gbm9kZUluZGV4IFRoZSBub2RlIGluZGV4XG4gKiBAcGFyYW0gbFZpZXcgVGhlIHRhcmdldCB2aWV3IGRhdGFcbiAqIEBwYXJhbSBpbmNsdWRlQ29tcG9uZW50cyBXaGV0aGVyIG9yIG5vdCB0byBpbmNsdWRlIGNvbXBvbmVudHMgaW4gcmV0dXJuZWQgZGlyZWN0aXZlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGlyZWN0aXZlc0F0Tm9kZUluZGV4KFxuICAgIG5vZGVJbmRleDogbnVtYmVyLCBsVmlldzogTFZpZXcsIGluY2x1ZGVDb21wb25lbnRzOiBib29sZWFuKTogYW55W118bnVsbCB7XG4gIGNvbnN0IHROb2RlID0gbFZpZXdbVFZJRVddLmRhdGFbbm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgbGV0IGRpcmVjdGl2ZVN0YXJ0SW5kZXggPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgaWYgKGRpcmVjdGl2ZVN0YXJ0SW5kZXggPT0gMCkgcmV0dXJuIEVNUFRZX0FSUkFZO1xuICBjb25zdCBkaXJlY3RpdmVFbmRJbmRleCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgaWYgKCFpbmNsdWRlQ29tcG9uZW50cyAmJiB0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnRIb3N0KSBkaXJlY3RpdmVTdGFydEluZGV4Kys7XG4gIHJldHVybiBsVmlldy5zbGljZShkaXJlY3RpdmVTdGFydEluZGV4LCBkaXJlY3RpdmVFbmRJbmRleCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21wb25lbnRBdE5vZGVJbmRleChub2RlSW5kZXg6IG51bWJlciwgbFZpZXc6IExWaWV3KToge318bnVsbCB7XG4gIGNvbnN0IHROb2RlID0gbFZpZXdbVFZJRVddLmRhdGFbbm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgbGV0IGRpcmVjdGl2ZVN0YXJ0SW5kZXggPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgcmV0dXJuIHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudEhvc3QgPyBsVmlld1tkaXJlY3RpdmVTdGFydEluZGV4XSA6IG51bGw7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIG1hcCBvZiBsb2NhbCByZWZlcmVuY2VzIChsb2NhbCByZWZlcmVuY2UgbmFtZSA9PiBlbGVtZW50IG9yIGRpcmVjdGl2ZSBpbnN0YW5jZSkgdGhhdFxuICogZXhpc3Qgb24gYSBnaXZlbiBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlzY292ZXJMb2NhbFJlZnMobFZpZXc6IExWaWV3LCBub2RlSW5kZXg6IG51bWJlcik6IHtba2V5OiBzdHJpbmddOiBhbnl9fG51bGwge1xuICBjb25zdCB0Tm9kZSA9IGxWaWV3W1RWSUVXXS5kYXRhW25vZGVJbmRleF0gYXMgVE5vZGU7XG4gIGlmICh0Tm9kZSAmJiB0Tm9kZS5sb2NhbE5hbWVzKSB7XG4gICAgY29uc3QgcmVzdWx0OiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICAgIGxldCBsb2NhbEluZGV4ID0gdE5vZGUuaW5kZXggKyAxO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdE5vZGUubG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgcmVzdWx0W3ROb2RlLmxvY2FsTmFtZXNbaV1dID0gbFZpZXdbbG9jYWxJbmRleF07XG4gICAgICBsb2NhbEluZGV4Kys7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cbiJdfQ==