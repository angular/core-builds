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
import { getLViewById } from './interfaces/lview_tracking';
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
    target[MONKEY_PATCH_KEY_NAME] = isLView(data) ? data[ID] : data;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9kaXNjb3ZlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2NvbnRleHRfZGlzY292ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8scUJBQXFCLENBQUM7QUFFN0IsT0FBTyxFQUFDLGFBQWEsRUFBRSxhQUFhLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM1RCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRTFDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDckMsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUd6RCxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDakQsT0FBTyxFQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBUyxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRixPQUFPLEVBQUMsd0JBQXdCLEVBQUUsV0FBVyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFJeEU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7QUFDSCxNQUFNLFVBQVUsV0FBVyxDQUFDLE1BQVc7SUFDckMsSUFBSSxPQUFPLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3RDLElBQUksT0FBTyxFQUFFO1FBQ1gsNkRBQTZEO1FBQzdELDhEQUE4RDtRQUM5RCxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUNwQixNQUFNLEtBQUssR0FBVSxPQUFRLENBQUM7WUFDOUIsSUFBSSxTQUFpQixDQUFDO1lBQ3RCLElBQUksU0FBUyxHQUFRLFNBQVMsQ0FBQztZQUMvQixJQUFJLFVBQVUsR0FBeUIsU0FB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LyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgJy4uL3V0aWwvbmdfZGV2X21vZGUnO1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydERvbU5vZGV9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7RU1QVFlfQVJSQVl9IGZyb20gJy4uL3V0aWwvZW1wdHknO1xuXG5pbXBvcnQge2Fzc2VydExWaWV3fSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge0xDb250ZXh0fSBmcm9tICcuL2ludGVyZmFjZXMvY29udGV4dCc7XG5pbXBvcnQge2dldExWaWV3QnlJZH0gZnJvbSAnLi9pbnRlcmZhY2VzL2x2aWV3X3RyYWNraW5nJztcbmltcG9ydCB7VE5vZGUsIFROb2RlRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnQsIFJOb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7aXNMVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7Q09OVEVYVCwgSEVBREVSX09GRlNFVCwgSE9TVCwgSUQsIExWaWV3LCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRDb21wb25lbnRMVmlld0J5SW5kZXgsIHVud3JhcFJOb2RlfSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5cblxuXG4vKipcbiAqIFJldHVybnMgdGhlIG1hdGNoaW5nIGBMQ29udGV4dGAgZGF0YSBmb3IgYSBnaXZlbiBET00gbm9kZSwgZGlyZWN0aXZlIG9yIGNvbXBvbmVudCBpbnN0YW5jZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgZXhhbWluZSB0aGUgcHJvdmlkZWQgRE9NIGVsZW1lbnQsIGNvbXBvbmVudCwgb3IgZGlyZWN0aXZlIGluc3RhbmNlXFwnc1xuICogbW9ua2V5LXBhdGNoZWQgcHJvcGVydHkgdG8gZGVyaXZlIHRoZSBgTENvbnRleHRgIGRhdGEuIE9uY2UgY2FsbGVkIHRoZW4gdGhlIG1vbmtleS1wYXRjaGVkXG4gKiB2YWx1ZSB3aWxsIGJlIHRoYXQgb2YgdGhlIG5ld2x5IGNyZWF0ZWQgYExDb250ZXh0YC5cbiAqXG4gKiBJZiB0aGUgbW9ua2V5LXBhdGNoZWQgdmFsdWUgaXMgdGhlIGBMVmlld2AgaW5zdGFuY2UgdGhlbiB0aGUgY29udGV4dCB2YWx1ZSBmb3IgdGhhdFxuICogdGFyZ2V0IHdpbGwgYmUgY3JlYXRlZCBhbmQgdGhlIG1vbmtleS1wYXRjaCByZWZlcmVuY2Ugd2lsbCBiZSB1cGRhdGVkLiBUaGVyZWZvcmUgd2hlbiB0aGlzXG4gKiBmdW5jdGlvbiBpcyBjYWxsZWQgaXQgbWF5IG11dGF0ZSB0aGUgcHJvdmlkZWQgZWxlbWVudFxcJ3MsIGNvbXBvbmVudFxcJ3Mgb3IgYW55IG9mIHRoZSBhc3NvY2lhdGVkXG4gKiBkaXJlY3RpdmVcXCdzIG1vbmtleS1wYXRjaCB2YWx1ZXMuXG4gKlxuICogSWYgdGhlIG1vbmtleS1wYXRjaCB2YWx1ZSBpcyBub3QgZGV0ZWN0ZWQgdGhlbiB0aGUgY29kZSB3aWxsIHdhbGsgdXAgdGhlIERPTSB1bnRpbCBhbiBlbGVtZW50XG4gKiBpcyBmb3VuZCB3aGljaCBjb250YWlucyBhIG1vbmtleS1wYXRjaCByZWZlcmVuY2UuIFdoZW4gdGhhdCBvY2N1cnMgdGhlbiB0aGUgcHJvdmlkZWQgZWxlbWVudFxuICogd2lsbCBiZSB1cGRhdGVkIHdpdGggYSBuZXcgY29udGV4dCAod2hpY2ggaXMgdGhlbiByZXR1cm5lZCkuIElmIHRoZSBtb25rZXktcGF0Y2ggdmFsdWUgaXMgbm90XG4gKiBkZXRlY3RlZCBmb3IgYSBjb21wb25lbnQvZGlyZWN0aXZlIGluc3RhbmNlIHRoZW4gaXQgd2lsbCB0aHJvdyBhbiBlcnJvciAoYWxsIGNvbXBvbmVudHMgYW5kXG4gKiBkaXJlY3RpdmVzIHNob3VsZCBiZSBhdXRvbWF0aWNhbGx5IG1vbmtleS1wYXRjaGVkIGJ5IGl2eSkuXG4gKlxuICogQHBhcmFtIHRhcmdldCBDb21wb25lbnQsIERpcmVjdGl2ZSBvciBET00gTm9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExDb250ZXh0KHRhcmdldDogYW55KTogTENvbnRleHR8bnVsbCB7XG4gIGxldCBtcFZhbHVlID0gcmVhZFBhdGNoZWREYXRhKHRhcmdldCk7XG4gIGlmIChtcFZhbHVlKSB7XG4gICAgLy8gb25seSB3aGVuIGl0J3MgYW4gYXJyYXkgaXMgaXQgY29uc2lkZXJlZCBhbiBMVmlldyBpbnN0YW5jZVxuICAgIC8vIC4uLiBvdGhlcndpc2UgaXQncyBhbiBhbHJlYWR5IGNvbnN0cnVjdGVkIExDb250ZXh0IGluc3RhbmNlXG4gICAgaWYgKGlzTFZpZXcobXBWYWx1ZSkpIHtcbiAgICAgIGNvbnN0IGxWaWV3OiBMVmlldyA9IG1wVmFsdWUhO1xuICAgICAgbGV0IG5vZGVJbmRleDogbnVtYmVyO1xuICAgICAgbGV0IGNvbXBvbmVudDogYW55ID0gdW5kZWZpbmVkO1xuICAgICAgbGV0IGRpcmVjdGl2ZXM6IGFueVtdfG51bGx8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gICAgICBpZiAoaXNDb21wb25lbnRJbnN0YW5jZSh0YXJnZXQpKSB7XG4gICAgICAgIG5vZGVJbmRleCA9IGZpbmRWaWFDb21wb25lbnQobFZpZXcsIHRhcmdldCk7XG4gICAgICAgIGlmIChub2RlSW5kZXggPT0gLTEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBwcm92aWRlZCBjb21wb25lbnQgd2FzIG5vdCBmb3VuZCBpbiB0aGUgYXBwbGljYXRpb24nKTtcbiAgICAgICAgfVxuICAgICAgICBjb21wb25lbnQgPSB0YXJnZXQ7XG4gICAgICB9IGVsc2UgaWYgKGlzRGlyZWN0aXZlSW5zdGFuY2UodGFyZ2V0KSkge1xuICAgICAgICBub2RlSW5kZXggPSBmaW5kVmlhRGlyZWN0aXZlKGxWaWV3LCB0YXJnZXQpO1xuICAgICAgICBpZiAobm9kZUluZGV4ID09IC0xKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgcHJvdmlkZWQgZGlyZWN0aXZlIHdhcyBub3QgZm91bmQgaW4gdGhlIGFwcGxpY2F0aW9uJyk7XG4gICAgICAgIH1cbiAgICAgICAgZGlyZWN0aXZlcyA9IGdldERpcmVjdGl2ZXNBdE5vZGVJbmRleChub2RlSW5kZXgsIGxWaWV3LCBmYWxzZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBub2RlSW5kZXggPSBmaW5kVmlhTmF0aXZlRWxlbWVudChsVmlldywgdGFyZ2V0IGFzIFJFbGVtZW50KTtcbiAgICAgICAgaWYgKG5vZGVJbmRleCA9PSAtMSkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIHRoZSBnb2FsIGlzIG5vdCB0byBmaWxsIHRoZSBlbnRpcmUgY29udGV4dCBmdWxsIG9mIGRhdGEgYmVjYXVzZSB0aGUgbG9va3Vwc1xuICAgICAgLy8gYXJlIGV4cGVuc2l2ZS4gSW5zdGVhZCwgb25seSB0aGUgdGFyZ2V0IGRhdGEgKHRoZSBlbGVtZW50LCBjb21wb25lbnQsIGNvbnRhaW5lciwgSUNVXG4gICAgICAvLyBleHByZXNzaW9uIG9yIGRpcmVjdGl2ZSBkZXRhaWxzKSBhcmUgZmlsbGVkIGludG8gdGhlIGNvbnRleHQuIElmIGNhbGxlZCBtdWx0aXBsZSB0aW1lc1xuICAgICAgLy8gd2l0aCBkaWZmZXJlbnQgdGFyZ2V0IHZhbHVlcyB0aGVuIHRoZSBtaXNzaW5nIHRhcmdldCBkYXRhIHdpbGwgYmUgZmlsbGVkIGluLlxuICAgICAgY29uc3QgbmF0aXZlID0gdW53cmFwUk5vZGUobFZpZXdbbm9kZUluZGV4XSk7XG4gICAgICBjb25zdCBleGlzdGluZ0N0eCA9IHJlYWRQYXRjaGVkRGF0YShuYXRpdmUpO1xuICAgICAgY29uc3QgY29udGV4dDogTENvbnRleHQgPSAoZXhpc3RpbmdDdHggJiYgIUFycmF5LmlzQXJyYXkoZXhpc3RpbmdDdHgpKSA/XG4gICAgICAgICAgZXhpc3RpbmdDdHggOlxuICAgICAgICAgIGNyZWF0ZUxDb250ZXh0KGxWaWV3LCBub2RlSW5kZXgsIG5hdGl2ZSk7XG5cbiAgICAgIC8vIG9ubHkgd2hlbiB0aGUgY29tcG9uZW50IGhhcyBiZWVuIGRpc2NvdmVyZWQgdGhlbiB1cGRhdGUgdGhlIG1vbmtleS1wYXRjaFxuICAgICAgaWYgKGNvbXBvbmVudCAmJiBjb250ZXh0LmNvbXBvbmVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRleHQuY29tcG9uZW50ID0gY29tcG9uZW50O1xuICAgICAgICBhdHRhY2hQYXRjaERhdGEoY29udGV4dC5jb21wb25lbnQsIGNvbnRleHQpO1xuICAgICAgfVxuXG4gICAgICAvLyBvbmx5IHdoZW4gdGhlIGRpcmVjdGl2ZXMgaGF2ZSBiZWVuIGRpc2NvdmVyZWQgdGhlbiB1cGRhdGUgdGhlIG1vbmtleS1wYXRjaFxuICAgICAgaWYgKGRpcmVjdGl2ZXMgJiYgY29udGV4dC5kaXJlY3RpdmVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGV4dC5kaXJlY3RpdmVzID0gZGlyZWN0aXZlcztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaXJlY3RpdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgYXR0YWNoUGF0Y2hEYXRhKGRpcmVjdGl2ZXNbaV0sIGNvbnRleHQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGF0dGFjaFBhdGNoRGF0YShjb250ZXh0Lm5hdGl2ZSwgY29udGV4dCk7XG4gICAgICBtcFZhbHVlID0gY29udGV4dDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgckVsZW1lbnQgPSB0YXJnZXQgYXMgUkVsZW1lbnQ7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERvbU5vZGUockVsZW1lbnQpO1xuXG4gICAgLy8gaWYgdGhlIGNvbnRleHQgaXMgbm90IGZvdW5kIHRoZW4gd2UgbmVlZCB0byB0cmF2ZXJzZSB1cHdhcmRzIHVwIHRoZSBET01cbiAgICAvLyB0byBmaW5kIHRoZSBuZWFyZXN0IGVsZW1lbnQgdGhhdCBoYXMgYWxyZWFkeSBiZWVuIG1vbmtleSBwYXRjaGVkIHdpdGggZGF0YVxuICAgIGxldCBwYXJlbnQgPSByRWxlbWVudCBhcyBhbnk7XG4gICAgd2hpbGUgKHBhcmVudCA9IHBhcmVudC5wYXJlbnROb2RlKSB7XG4gICAgICBjb25zdCBwYXJlbnRDb250ZXh0ID0gcmVhZFBhdGNoZWREYXRhKHBhcmVudCk7XG4gICAgICBpZiAocGFyZW50Q29udGV4dCkge1xuICAgICAgICBjb25zdCBsVmlldyA9IEFycmF5LmlzQXJyYXkocGFyZW50Q29udGV4dCkgPyBwYXJlbnRDb250ZXh0IGFzIExWaWV3IDogcGFyZW50Q29udGV4dC5sVmlldztcblxuICAgICAgICAvLyB0aGUgZWRnZSBvZiB0aGUgYXBwIHdhcyBhbHNvIHJlYWNoZWQgaGVyZSB0aHJvdWdoIGFub3RoZXIgbWVhbnNcbiAgICAgICAgLy8gKG1heWJlIGJlY2F1c2UgdGhlIERPTSB3YXMgY2hhbmdlZCBtYW51YWxseSkuXG4gICAgICAgIGlmICghbFZpZXcpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGluZGV4ID0gZmluZFZpYU5hdGl2ZUVsZW1lbnQobFZpZXcsIHJFbGVtZW50KTtcbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICBjb25zdCBuYXRpdmUgPSB1bndyYXBSTm9kZShsVmlld1tpbmRleF0pO1xuICAgICAgICAgIGNvbnN0IGNvbnRleHQgPSBjcmVhdGVMQ29udGV4dChsVmlldywgaW5kZXgsIG5hdGl2ZSk7XG4gICAgICAgICAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgY29udGV4dCk7XG4gICAgICAgICAgbXBWYWx1ZSA9IGNvbnRleHQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIChtcFZhbHVlIGFzIExDb250ZXh0KSB8fCBudWxsO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gZW1wdHkgaW5zdGFuY2Ugb2YgYSBgTENvbnRleHRgIGNvbnRleHRcbiAqL1xuZnVuY3Rpb24gY3JlYXRlTENvbnRleHQobFZpZXc6IExWaWV3LCBub2RlSW5kZXg6IG51bWJlciwgbmF0aXZlOiBSTm9kZSk6IExDb250ZXh0IHtcbiAgcmV0dXJuIG5ldyBMQ29udGV4dChsVmlld1tJRF0sIG5vZGVJbmRleCwgbmF0aXZlKTtcbn1cblxuLyoqXG4gKiBUYWtlcyBhIGNvbXBvbmVudCBpbnN0YW5jZSBhbmQgcmV0dXJucyB0aGUgdmlldyBmb3IgdGhhdCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudEluc3RhbmNlXG4gKiBAcmV0dXJucyBUaGUgY29tcG9uZW50J3Mgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tcG9uZW50Vmlld0J5SW5zdGFuY2UoY29tcG9uZW50SW5zdGFuY2U6IHt9KTogTFZpZXcge1xuICBsZXQgcGF0Y2hlZERhdGEgPSByZWFkUGF0Y2hlZERhdGEoY29tcG9uZW50SW5zdGFuY2UpO1xuICBsZXQgbFZpZXc6IExWaWV3O1xuXG4gIGlmIChpc0xWaWV3KHBhdGNoZWREYXRhKSkge1xuICAgIGNvbnN0IGNvbnRleHRMVmlldzogTFZpZXcgPSBwYXRjaGVkRGF0YTtcbiAgICBjb25zdCBub2RlSW5kZXggPSBmaW5kVmlhQ29tcG9uZW50KGNvbnRleHRMVmlldywgY29tcG9uZW50SW5zdGFuY2UpO1xuICAgIGxWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KG5vZGVJbmRleCwgY29udGV4dExWaWV3KTtcbiAgICBjb25zdCBjb250ZXh0ID0gY3JlYXRlTENvbnRleHQoY29udGV4dExWaWV3LCBub2RlSW5kZXgsIGxWaWV3W0hPU1RdIGFzIFJFbGVtZW50KTtcbiAgICBjb250ZXh0LmNvbXBvbmVudCA9IGNvbXBvbmVudEluc3RhbmNlO1xuICAgIGF0dGFjaFBhdGNoRGF0YShjb21wb25lbnRJbnN0YW5jZSwgY29udGV4dCk7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKGNvbnRleHQubmF0aXZlLCBjb250ZXh0KTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBjb250ZXh0ID0gcGF0Y2hlZERhdGEgYXMgdW5rbm93biBhcyBMQ29udGV4dDtcbiAgICBjb25zdCBjb250ZXh0TFZpZXcgPSBjb250ZXh0LmxWaWV3ITtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcoY29udGV4dExWaWV3KTtcbiAgICBsVmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleChjb250ZXh0Lm5vZGVJbmRleCwgY29udGV4dExWaWV3KTtcbiAgfVxuICByZXR1cm4gbFZpZXc7XG59XG5cbi8qKlxuICogVGhpcyBwcm9wZXJ0eSB3aWxsIGJlIG1vbmtleS1wYXRjaGVkIG9uIGVsZW1lbnRzLCBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzLlxuICovXG5jb25zdCBNT05LRVlfUEFUQ0hfS0VZX05BTUUgPSAnX19uZ0NvbnRleHRfXyc7XG5cbi8qKlxuICogQXNzaWducyB0aGUgZ2l2ZW4gZGF0YSB0byB0aGUgZ2l2ZW4gdGFyZ2V0ICh3aGljaCBjb3VsZCBiZSBhIGNvbXBvbmVudCxcbiAqIGRpcmVjdGl2ZSBvciBET00gbm9kZSBpbnN0YW5jZSkgdXNpbmcgbW9ua2V5LXBhdGNoaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoUGF0Y2hEYXRhKHRhcmdldDogYW55LCBkYXRhOiBMVmlld3xMQ29udGV4dCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0YXJnZXQsICdUYXJnZXQgZXhwZWN0ZWQnKTtcbiAgLy8gT25seSBhdHRhY2ggdGhlIElEIG9mIHRoZSB2aWV3IGluIG9yZGVyIHRvIGF2b2lkIG1lbW9yeSBsZWFrcyAoc2VlICM0MTA0NykuIFdlIG9ubHkgZG8gdGhpc1xuICAvLyBmb3IgYExWaWV3YCwgYmVjYXVzZSB3ZSBoYXZlIGNvbnRyb2wgb3ZlciB3aGVuIGFuIGBMVmlld2AgaXMgY3JlYXRlZCBhbmQgZGVzdHJveWVkLCB3aGVyZWFzXG4gIC8vIHdlIGNhbid0IGtub3cgd2hlbiB0byByZW1vdmUgYW4gYExDb250ZXh0YC5cbiAgdGFyZ2V0W01PTktFWV9QQVRDSF9LRVlfTkFNRV0gPSBpc0xWaWV3KGRhdGEpID8gZGF0YVtJRF0gOiBkYXRhO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIG1vbmtleS1wYXRjaCB2YWx1ZSBkYXRhIHByZXNlbnQgb24gdGhlIHRhcmdldCAod2hpY2ggY291bGQgYmVcbiAqIGEgY29tcG9uZW50LCBkaXJlY3RpdmUgb3IgYSBET00gbm9kZSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkUGF0Y2hlZERhdGEodGFyZ2V0OiBhbnkpOiBMVmlld3xMQ29udGV4dHxudWxsIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodGFyZ2V0LCAnVGFyZ2V0IGV4cGVjdGVkJyk7XG4gIGNvbnN0IGRhdGEgPSB0YXJnZXRbTU9OS0VZX1BBVENIX0tFWV9OQU1FXTtcbiAgcmV0dXJuICh0eXBlb2YgZGF0YSA9PT0gJ251bWJlcicpID8gZ2V0TFZpZXdCeUlkKGRhdGEpIDogZGF0YSB8fCBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZFBhdGNoZWRMVmlldyh0YXJnZXQ6IGFueSk6IExWaWV3fG51bGwge1xuICBjb25zdCB2YWx1ZSA9IHJlYWRQYXRjaGVkRGF0YSh0YXJnZXQpO1xuICBpZiAodmFsdWUpIHtcbiAgICByZXR1cm4gaXNMVmlldyh2YWx1ZSkgPyB2YWx1ZSA6IHZhbHVlLmxWaWV3O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb21wb25lbnRJbnN0YW5jZShpbnN0YW5jZTogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiBpbnN0YW5jZSAmJiBpbnN0YW5jZS5jb25zdHJ1Y3RvciAmJiBpbnN0YW5jZS5jb25zdHJ1Y3Rvci7JtWNtcDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRGlyZWN0aXZlSW5zdGFuY2UoaW5zdGFuY2U6IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gaW5zdGFuY2UgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IuybVkaXI7XG59XG5cbi8qKlxuICogTG9jYXRlcyB0aGUgZWxlbWVudCB3aXRoaW4gdGhlIGdpdmVuIExWaWV3IGFuZCByZXR1cm5zIHRoZSBtYXRjaGluZyBpbmRleFxuICovXG5mdW5jdGlvbiBmaW5kVmlhTmF0aXZlRWxlbWVudChsVmlldzogTFZpZXcsIHRhcmdldDogUkVsZW1lbnQpOiBudW1iZXIge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgZm9yIChsZXQgaSA9IEhFQURFUl9PRkZTRVQ7IGkgPCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDsgaSsrKSB7XG4gICAgaWYgKHVud3JhcFJOb2RlKGxWaWV3W2ldKSA9PT0gdGFyZ2V0KSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuICogTG9jYXRlcyB0aGUgbmV4dCB0Tm9kZSAoY2hpbGQsIHNpYmxpbmcgb3IgcGFyZW50KS5cbiAqL1xuZnVuY3Rpb24gdHJhdmVyc2VOZXh0RWxlbWVudCh0Tm9kZTogVE5vZGUpOiBUTm9kZXxudWxsIHtcbiAgaWYgKHROb2RlLmNoaWxkKSB7XG4gICAgcmV0dXJuIHROb2RlLmNoaWxkO1xuICB9IGVsc2UgaWYgKHROb2RlLm5leHQpIHtcbiAgICByZXR1cm4gdE5vZGUubmV4dDtcbiAgfSBlbHNlIHtcbiAgICAvLyBMZXQncyB0YWtlIHRoZSBmb2xsb3dpbmcgdGVtcGxhdGU6IDxkaXY+PHNwYW4+dGV4dDwvc3Bhbj48L2Rpdj48Y29tcG9uZW50Lz5cbiAgICAvLyBBZnRlciBjaGVja2luZyB0aGUgdGV4dCBub2RlLCB3ZSBuZWVkIHRvIGZpbmQgdGhlIG5leHQgcGFyZW50IHRoYXQgaGFzIGEgXCJuZXh0XCIgVE5vZGUsXG4gICAgLy8gaW4gdGhpcyBjYXNlIHRoZSBwYXJlbnQgYGRpdmAsIHNvIHRoYXQgd2UgY2FuIGZpbmQgdGhlIGNvbXBvbmVudC5cbiAgICB3aGlsZSAodE5vZGUucGFyZW50ICYmICF0Tm9kZS5wYXJlbnQubmV4dCkge1xuICAgICAgdE5vZGUgPSB0Tm9kZS5wYXJlbnQ7XG4gICAgfVxuICAgIHJldHVybiB0Tm9kZS5wYXJlbnQgJiYgdE5vZGUucGFyZW50Lm5leHQ7XG4gIH1cbn1cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBjb21wb25lbnQgd2l0aGluIHRoZSBnaXZlbiBMVmlldyBhbmQgcmV0dXJucyB0aGUgbWF0Y2hpbmcgaW5kZXhcbiAqL1xuZnVuY3Rpb24gZmluZFZpYUNvbXBvbmVudChsVmlldzogTFZpZXcsIGNvbXBvbmVudEluc3RhbmNlOiB7fSk6IG51bWJlciB7XG4gIGNvbnN0IGNvbXBvbmVudEluZGljZXMgPSBsVmlld1tUVklFV10uY29tcG9uZW50cztcbiAgaWYgKGNvbXBvbmVudEluZGljZXMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudEluZGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVsZW1lbnRDb21wb25lbnRJbmRleCA9IGNvbXBvbmVudEluZGljZXNbaV07XG4gICAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KGVsZW1lbnRDb21wb25lbnRJbmRleCwgbFZpZXcpO1xuICAgICAgaWYgKGNvbXBvbmVudFZpZXdbQ09OVEVYVF0gPT09IGNvbXBvbmVudEluc3RhbmNlKSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50Q29tcG9uZW50SW5kZXg7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHJvb3RDb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KEhFQURFUl9PRkZTRVQsIGxWaWV3KTtcbiAgICBjb25zdCByb290Q29tcG9uZW50ID0gcm9vdENvbXBvbmVudFZpZXdbQ09OVEVYVF07XG4gICAgaWYgKHJvb3RDb21wb25lbnQgPT09IGNvbXBvbmVudEluc3RhbmNlKSB7XG4gICAgICAvLyB3ZSBhcmUgZGVhbGluZyB3aXRoIHRoZSByb290IGVsZW1lbnQgaGVyZSB0aGVyZWZvcmUgd2Uga25vdyB0aGF0IHRoZVxuICAgICAgLy8gZWxlbWVudCBpcyB0aGUgdmVyeSBmaXJzdCBlbGVtZW50IGFmdGVyIHRoZSBIRUFERVIgZGF0YSBpbiB0aGUgbFZpZXdcbiAgICAgIHJldHVybiBIRUFERVJfT0ZGU0VUO1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuICogTG9jYXRlcyB0aGUgZGlyZWN0aXZlIHdpdGhpbiB0aGUgZ2l2ZW4gTFZpZXcgYW5kIHJldHVybnMgdGhlIG1hdGNoaW5nIGluZGV4XG4gKi9cbmZ1bmN0aW9uIGZpbmRWaWFEaXJlY3RpdmUobFZpZXc6IExWaWV3LCBkaXJlY3RpdmVJbnN0YW5jZToge30pOiBudW1iZXIge1xuICAvLyBpZiBhIGRpcmVjdGl2ZSBpcyBtb25rZXkgcGF0Y2hlZCB0aGVuIGl0IHdpbGwgKGJ5IGRlZmF1bHQpXG4gIC8vIGhhdmUgYSByZWZlcmVuY2UgdG8gdGhlIExWaWV3IG9mIHRoZSBjdXJyZW50IHZpZXcuIFRoZVxuICAvLyBlbGVtZW50IGJvdW5kIHRvIHRoZSBkaXJlY3RpdmUgYmVpbmcgc2VhcmNoIGxpdmVzIHNvbWV3aGVyZVxuICAvLyBpbiB0aGUgdmlldyBkYXRhLiBXZSBsb29wIHRocm91Z2ggdGhlIG5vZGVzIGFuZCBjaGVjayB0aGVpclxuICAvLyBsaXN0IG9mIGRpcmVjdGl2ZXMgZm9yIHRoZSBpbnN0YW5jZS5cbiAgbGV0IHROb2RlID0gbFZpZXdbVFZJRVddLmZpcnN0Q2hpbGQ7XG4gIHdoaWxlICh0Tm9kZSkge1xuICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4U3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgICBjb25zdCBkaXJlY3RpdmVJbmRleEVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgICBmb3IgKGxldCBpID0gZGlyZWN0aXZlSW5kZXhTdGFydDsgaSA8IGRpcmVjdGl2ZUluZGV4RW5kOyBpKyspIHtcbiAgICAgIGlmIChsVmlld1tpXSA9PT0gZGlyZWN0aXZlSW5zdGFuY2UpIHtcbiAgICAgICAgcmV0dXJuIHROb2RlLmluZGV4O1xuICAgICAgfVxuICAgIH1cbiAgICB0Tm9kZSA9IHRyYXZlcnNlTmV4dEVsZW1lbnQodE5vZGUpO1xuICB9XG4gIHJldHVybiAtMTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbGlzdCBvZiBkaXJlY3RpdmVzIGV4dHJhY3RlZCBmcm9tIHRoZSBnaXZlbiB2aWV3IGJhc2VkIG9uIHRoZVxuICogcHJvdmlkZWQgbGlzdCBvZiBkaXJlY3RpdmUgaW5kZXggdmFsdWVzLlxuICpcbiAqIEBwYXJhbSBub2RlSW5kZXggVGhlIG5vZGUgaW5kZXhcbiAqIEBwYXJhbSBsVmlldyBUaGUgdGFyZ2V0IHZpZXcgZGF0YVxuICogQHBhcmFtIGluY2x1ZGVDb21wb25lbnRzIFdoZXRoZXIgb3Igbm90IHRvIGluY2x1ZGUgY29tcG9uZW50cyBpbiByZXR1cm5lZCBkaXJlY3RpdmVzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXREaXJlY3RpdmVzQXROb2RlSW5kZXgoXG4gICAgbm9kZUluZGV4OiBudW1iZXIsIGxWaWV3OiBMVmlldywgaW5jbHVkZUNvbXBvbmVudHM6IGJvb2xlYW4pOiBhbnlbXXxudWxsIHtcbiAgY29uc3QgdE5vZGUgPSBsVmlld1tUVklFV10uZGF0YVtub2RlSW5kZXhdIGFzIFROb2RlO1xuICBsZXQgZGlyZWN0aXZlU3RhcnRJbmRleCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBpZiAoZGlyZWN0aXZlU3RhcnRJbmRleCA9PSAwKSByZXR1cm4gRU1QVFlfQVJSQVk7XG4gIGNvbnN0IGRpcmVjdGl2ZUVuZEluZGV4ID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBpZiAoIWluY2x1ZGVDb21wb25lbnRzICYmIHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudEhvc3QpIGRpcmVjdGl2ZVN0YXJ0SW5kZXgrKztcbiAgcmV0dXJuIGxWaWV3LnNsaWNlKGRpcmVjdGl2ZVN0YXJ0SW5kZXgsIGRpcmVjdGl2ZUVuZEluZGV4KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbXBvbmVudEF0Tm9kZUluZGV4KG5vZGVJbmRleDogbnVtYmVyLCBsVmlldzogTFZpZXcpOiB7fXxudWxsIHtcbiAgY29uc3QgdE5vZGUgPSBsVmlld1tUVklFV10uZGF0YVtub2RlSW5kZXhdIGFzIFROb2RlO1xuICBsZXQgZGlyZWN0aXZlU3RhcnRJbmRleCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICByZXR1cm4gdE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50SG9zdCA/IGxWaWV3W2RpcmVjdGl2ZVN0YXJ0SW5kZXhdIDogbnVsbDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbWFwIG9mIGxvY2FsIHJlZmVyZW5jZXMgKGxvY2FsIHJlZmVyZW5jZSBuYW1lID0+IGVsZW1lbnQgb3IgZGlyZWN0aXZlIGluc3RhbmNlKSB0aGF0XG4gKiBleGlzdCBvbiBhIGdpdmVuIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXNjb3ZlckxvY2FsUmVmcyhsVmlldzogTFZpZXcsIG5vZGVJbmRleDogbnVtYmVyKToge1trZXk6IHN0cmluZ106IGFueX18bnVsbCB7XG4gIGNvbnN0IHROb2RlID0gbFZpZXdbVFZJRVddLmRhdGFbbm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgaWYgKHROb2RlICYmIHROb2RlLmxvY2FsTmFtZXMpIHtcbiAgICBjb25zdCByZXN1bHQ6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gICAgbGV0IGxvY2FsSW5kZXggPSB0Tm9kZS5pbmRleCArIDE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0Tm9kZS5sb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICByZXN1bHRbdE5vZGUubG9jYWxOYW1lc1tpXV0gPSBsVmlld1tsb2NhbEluZGV4XTtcbiAgICAgIGxvY2FsSW5kZXgrKztcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuIl19