/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
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
export function getContext(target) {
    /** @type {?} */
    let mpValue = readPatchedData(target);
    if (mpValue) {
        // only when it's an array is it considered an LView instance
        // ... otherwise it's an already constructed LContext instance
        if (Array.isArray(mpValue)) {
            /** @type {?} */
            const lView = /** @type {?} */ ((mpValue));
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
                nodeIndex = findViaNativeElement(lView, /** @type {?} */ (target));
                if (nodeIndex == -1) {
                    return null;
                }
            }
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
        const rElement = /** @type {?} */ (target);
        ngDevMode && assertDomNode(rElement);
        /** @type {?} */
        let parent = /** @type {?} */ (rElement);
        while (parent = parent.parentNode) {
            /** @type {?} */
            const parentContext = readPatchedData(parent);
            if (parentContext) {
                /** @type {?} */
                let lView;
                if (Array.isArray(parentContext)) {
                    lView = /** @type {?} */ (parentContext);
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
    return (/** @type {?} */ (mpValue)) || null;
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
        const context = createLContext(lView, nodeIndex, /** @type {?} */ (view[HOST]));
        context.component = componentInstance;
        attachPatchData(componentInstance, context);
        attachPatchData(context.native, context);
    }
    else {
        /** @type {?} */
        const context = /** @type {?} */ ((lView));
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
        const native = /** @type {?} */ ((getNativeByTNode(tNode, lView)));
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
    else if (tNode.parent) {
        return tNode.parent.next || null;
    }
    return null;
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
    /** @type {?} */
    let tNode = lView[TVIEW].firstChild;
    while (tNode) {
        /** @type {?} */
        const directiveIndexStart = getDirectiveStartIndex(tNode);
        /** @type {?} */
        const directiveIndexEnd = getDirectiveEndIndex(tNode, directiveIndexStart);
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
    const tNode = /** @type {?} */ (lView[TVIEW].data[nodeIndex]);
    /** @type {?} */
    let directiveStartIndex = getDirectiveStartIndex(tNode);
    if (directiveStartIndex == 0)
        return EMPTY_ARRAY;
    /** @type {?} */
    const directiveEndIndex = getDirectiveEndIndex(tNode, directiveStartIndex);
    if (!includeComponents && tNode.flags & 4096 /* isComponent */)
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
    const tNode = /** @type {?} */ (lView[TVIEW].data[nodeIndex]);
    /** @type {?} */
    let directiveStartIndex = getDirectiveStartIndex(tNode);
    return tNode.flags & 4096 /* isComponent */ ? lView[directiveStartIndex] : null;
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
    const tNode = /** @type {?} */ (lView[TVIEW].data[nodeIndex]);
    if (tNode && tNode.localNames) {
        /** @type {?} */
        const result = {};
        for (let i = 0; i < tNode.localNames.length; i += 2) {
            /** @type {?} */
            const localRefName = tNode.localNames[i];
            /** @type {?} */
            const directiveIndex = /** @type {?} */ (tNode.localNames[i + 1]);
            result[localRefName] =
                directiveIndex === -1 ? /** @type {?} */ ((getNativeByTNode(tNode, lView))) : lView[directiveIndex];
        }
        return result;
    }
    return null;
}
/**
 * @param {?} tNode
 * @return {?}
 */
function getDirectiveStartIndex(tNode) {
    // the tNode instances store a flag value which then has a
    // pointer which tells the starting index of where all the
    // active directives are in the master directive array
    return tNode.flags >> 16 /* DirectiveStartingIndexShift */;
}
/**
 * @param {?} tNode
 * @param {?} startIndex
 * @return {?}
 */
function getDirectiveEndIndex(tNode, startIndex) {
    /** @type {?} */
    const count = tNode.flags & 4095 /* DirectiveCountMask */;
    return count ? (startIndex + count) : -1;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9kaXNjb3ZlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2NvbnRleHRfZGlzY292ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFPQSxPQUFPLGVBQWUsQ0FBQztBQUV2QixPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3ZDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDekMsT0FBTyxFQUFXLHFCQUFxQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFHckUsT0FBTyxFQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFTLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzdFLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxlQUFlLEVBQUMsTUFBTSxRQUFRLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF1QnBHLE1BQU0sVUFBVSxVQUFVLENBQUMsTUFBVzs7SUFDcEMsSUFBSSxPQUFPLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3RDLElBQUksT0FBTyxFQUFFOzs7UUFHWCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7O1lBQzFCLE1BQU0sS0FBSyxzQkFBVSxPQUFPLEdBQUc7O1lBQy9CLElBQUksU0FBUyxDQUFTOztZQUN0QixJQUFJLFNBQVMsR0FBUSxTQUFTLENBQUM7O1lBQy9CLElBQUksVUFBVSxHQUF5QixTQUFTLENBQUM7WUFFakQsSUFBSSxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDL0IsU0FBUyxHQUFHLGdCQUFnQixDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDNUMsSUFBSSxTQUFTLElBQUksQ0FBQyxDQUFDLEVBQUU7b0JBQ25CLE1BQU0sSUFBSSxL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LEtBQUssQ0FBQyxLQUFLLGdDQUFnQyxDQUFDO0lBQzFELE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDMUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgJy4vbmdfZGV2X21vZGUnO1xuXG5pbXBvcnQge2Fzc2VydERvbU5vZGV9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7RU1QVFlfQVJSQVl9IGZyb20gJy4vZGVmaW5pdGlvbic7XG5pbXBvcnQge0xDb250ZXh0LCBNT05LRVlfUEFUQ0hfS0VZX05BTUV9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250ZXh0JztcbmltcG9ydCB7VE5vZGUsIFROb2RlRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0NPTlRFWFQsIEhFQURFUl9PRkZTRVQsIEhPU1QsIExWaWV3LCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRDb21wb25lbnRWaWV3QnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgcmVhZEVsZW1lbnRWYWx1ZSwgcmVhZFBhdGNoZWREYXRhfSBmcm9tICcuL3V0aWwnO1xuXG5cblxuLyoqIFJldHVybnMgdGhlIG1hdGNoaW5nIGBMQ29udGV4dGAgZGF0YSBmb3IgYSBnaXZlbiBET00gbm9kZSwgZGlyZWN0aXZlIG9yIGNvbXBvbmVudCBpbnN0YW5jZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgZXhhbWluZSB0aGUgcHJvdmlkZWQgRE9NIGVsZW1lbnQsIGNvbXBvbmVudCwgb3IgZGlyZWN0aXZlIGluc3RhbmNlXFwnc1xuICogbW9ua2V5LXBhdGNoZWQgcHJvcGVydHkgdG8gZGVyaXZlIHRoZSBgTENvbnRleHRgIGRhdGEuIE9uY2UgY2FsbGVkIHRoZW4gdGhlIG1vbmtleS1wYXRjaGVkXG4gKiB2YWx1ZSB3aWxsIGJlIHRoYXQgb2YgdGhlIG5ld2x5IGNyZWF0ZWQgYExDb250ZXh0YC5cbiAqXG4gKiBJZiB0aGUgbW9ua2V5LXBhdGNoZWQgdmFsdWUgaXMgdGhlIGBMVmlld2AgaW5zdGFuY2UgdGhlbiB0aGUgY29udGV4dCB2YWx1ZSBmb3IgdGhhdFxuICogdGFyZ2V0IHdpbGwgYmUgY3JlYXRlZCBhbmQgdGhlIG1vbmtleS1wYXRjaCByZWZlcmVuY2Ugd2lsbCBiZSB1cGRhdGVkLiBUaGVyZWZvcmUgd2hlbiB0aGlzXG4gKiBmdW5jdGlvbiBpcyBjYWxsZWQgaXQgbWF5IG11dGF0ZSB0aGUgcHJvdmlkZWQgZWxlbWVudFxcJ3MsIGNvbXBvbmVudFxcJ3Mgb3IgYW55IG9mIHRoZSBhc3NvY2lhdGVkXG4gKiBkaXJlY3RpdmVcXCdzIG1vbmtleS1wYXRjaCB2YWx1ZXMuXG4gKlxuICogSWYgdGhlIG1vbmtleS1wYXRjaCB2YWx1ZSBpcyBub3QgZGV0ZWN0ZWQgdGhlbiB0aGUgY29kZSB3aWxsIHdhbGsgdXAgdGhlIERPTSB1bnRpbCBhbiBlbGVtZW50XG4gKiBpcyBmb3VuZCB3aGljaCBjb250YWlucyBhIG1vbmtleS1wYXRjaCByZWZlcmVuY2UuIFdoZW4gdGhhdCBvY2N1cnMgdGhlbiB0aGUgcHJvdmlkZWQgZWxlbWVudFxuICogd2lsbCBiZSB1cGRhdGVkIHdpdGggYSBuZXcgY29udGV4dCAod2hpY2ggaXMgdGhlbiByZXR1cm5lZCkuIElmIHRoZSBtb25rZXktcGF0Y2ggdmFsdWUgaXMgbm90XG4gKiBkZXRlY3RlZCBmb3IgYSBjb21wb25lbnQvZGlyZWN0aXZlIGluc3RhbmNlIHRoZW4gaXQgd2lsbCB0aHJvdyBhbiBlcnJvciAoYWxsIGNvbXBvbmVudHMgYW5kXG4gKiBkaXJlY3RpdmVzIHNob3VsZCBiZSBhdXRvbWF0aWNhbGx5IG1vbmtleS1wYXRjaGVkIGJ5IGl2eSkuXG4gKlxuICogQHBhcmFtIHRhcmdldCBDb21wb25lbnQsIERpcmVjdGl2ZSBvciBET00gTm9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbnRleHQodGFyZ2V0OiBhbnkpOiBMQ29udGV4dHxudWxsIHtcbiAgbGV0IG1wVmFsdWUgPSByZWFkUGF0Y2hlZERhdGEodGFyZ2V0KTtcbiAgaWYgKG1wVmFsdWUpIHtcbiAgICAvLyBvbmx5IHdoZW4gaXQncyBhbiBhcnJheSBpcyBpdCBjb25zaWRlcmVkIGFuIExWaWV3IGluc3RhbmNlXG4gICAgLy8gLi4uIG90aGVyd2lzZSBpdCdzIGFuIGFscmVhZHkgY29uc3RydWN0ZWQgTENvbnRleHQgaW5zdGFuY2VcbiAgICBpZiAoQXJyYXkuaXNBcnJheShtcFZhbHVlKSkge1xuICAgICAgY29uc3QgbFZpZXc6IExWaWV3ID0gbXBWYWx1ZSAhO1xuICAgICAgbGV0IG5vZGVJbmRleDogbnVtYmVyO1xuICAgICAgbGV0IGNvbXBvbmVudDogYW55ID0gdW5kZWZpbmVkO1xuICAgICAgbGV0IGRpcmVjdGl2ZXM6IGFueVtdfG51bGx8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gICAgICBpZiAoaXNDb21wb25lbnRJbnN0YW5jZSh0YXJnZXQpKSB7XG4gICAgICAgIG5vZGVJbmRleCA9IGZpbmRWaWFDb21wb25lbnQobFZpZXcsIHRhcmdldCk7XG4gICAgICAgIGlmIChub2RlSW5kZXggPT0gLTEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBwcm92aWRlZCBjb21wb25lbnQgd2FzIG5vdCBmb3VuZCBpbiB0aGUgYXBwbGljYXRpb24nKTtcbiAgICAgICAgfVxuICAgICAgICBjb21wb25lbnQgPSB0YXJnZXQ7XG4gICAgICB9IGVsc2UgaWYgKGlzRGlyZWN0aXZlSW5zdGFuY2UodGFyZ2V0KSkge1xuICAgICAgICBub2RlSW5kZXggPSBmaW5kVmlhRGlyZWN0aXZlKGxWaWV3LCB0YXJnZXQpO1xuICAgICAgICBpZiAobm9kZUluZGV4ID09IC0xKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgcHJvdmlkZWQgZGlyZWN0aXZlIHdhcyBub3QgZm91bmQgaW4gdGhlIGFwcGxpY2F0aW9uJyk7XG4gICAgICAgIH1cbiAgICAgICAgZGlyZWN0aXZlcyA9IGdldERpcmVjdGl2ZXNBdE5vZGVJbmRleChub2RlSW5kZXgsIGxWaWV3LCBmYWxzZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBub2RlSW5kZXggPSBmaW5kVmlhTmF0aXZlRWxlbWVudChsVmlldywgdGFyZ2V0IGFzIFJFbGVtZW50KTtcbiAgICAgICAgaWYgKG5vZGVJbmRleCA9PSAtMSkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIHRoZSBnb2FsIGlzIG5vdCB0byBmaWxsIHRoZSBlbnRpcmUgY29udGV4dCBmdWxsIG9mIGRhdGEgYmVjYXVzZSB0aGUgbG9va3Vwc1xuICAgICAgLy8gYXJlIGV4cGVuc2l2ZS4gSW5zdGVhZCwgb25seSB0aGUgdGFyZ2V0IGRhdGEgKHRoZSBlbGVtZW50LCBjb21wb250ZW50IG9yXG4gICAgICAvLyBkaXJlY3RpdmUgZGV0YWlscykgYXJlIGZpbGxlZCBpbnRvIHRoZSBjb250ZXh0LiBJZiBjYWxsZWQgbXVsdGlwbGUgdGltZXNcbiAgICAgIC8vIHdpdGggZGlmZmVyZW50IHRhcmdldCB2YWx1ZXMgdGhlbiB0aGUgbWlzc2luZyB0YXJnZXQgZGF0YSB3aWxsIGJlIGZpbGxlZCBpbi5cbiAgICAgIGNvbnN0IG5hdGl2ZSA9IHJlYWRFbGVtZW50VmFsdWUobFZpZXdbbm9kZUluZGV4XSk7XG4gICAgICBjb25zdCBleGlzdGluZ0N0eCA9IHJlYWRQYXRjaGVkRGF0YShuYXRpdmUpO1xuICAgICAgY29uc3QgY29udGV4dDogTENvbnRleHQgPSAoZXhpc3RpbmdDdHggJiYgIUFycmF5LmlzQXJyYXkoZXhpc3RpbmdDdHgpKSA/XG4gICAgICAgICAgZXhpc3RpbmdDdHggOlxuICAgICAgICAgIGNyZWF0ZUxDb250ZXh0KGxWaWV3LCBub2RlSW5kZXgsIG5hdGl2ZSk7XG5cbiAgICAgIC8vIG9ubHkgd2hlbiB0aGUgY29tcG9uZW50IGhhcyBiZWVuIGRpc2NvdmVyZWQgdGhlbiB1cGRhdGUgdGhlIG1vbmtleS1wYXRjaFxuICAgICAgaWYgKGNvbXBvbmVudCAmJiBjb250ZXh0LmNvbXBvbmVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRleHQuY29tcG9uZW50ID0gY29tcG9uZW50O1xuICAgICAgICBhdHRhY2hQYXRjaERhdGEoY29udGV4dC5jb21wb25lbnQsIGNvbnRleHQpO1xuICAgICAgfVxuXG4gICAgICAvLyBvbmx5IHdoZW4gdGhlIGRpcmVjdGl2ZXMgaGF2ZSBiZWVuIGRpc2NvdmVyZWQgdGhlbiB1cGRhdGUgdGhlIG1vbmtleS1wYXRjaFxuICAgICAgaWYgKGRpcmVjdGl2ZXMgJiYgY29udGV4dC5kaXJlY3RpdmVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGV4dC5kaXJlY3RpdmVzID0gZGlyZWN0aXZlcztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaXJlY3RpdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgYXR0YWNoUGF0Y2hEYXRhKGRpcmVjdGl2ZXNbaV0sIGNvbnRleHQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGF0dGFjaFBhdGNoRGF0YShjb250ZXh0Lm5hdGl2ZSwgY29udGV4dCk7XG4gICAgICBtcFZhbHVlID0gY29udGV4dDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgckVsZW1lbnQgPSB0YXJnZXQgYXMgUkVsZW1lbnQ7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERvbU5vZGUockVsZW1lbnQpO1xuXG4gICAgLy8gaWYgdGhlIGNvbnRleHQgaXMgbm90IGZvdW5kIHRoZW4gd2UgbmVlZCB0byB0cmF2ZXJzZSB1cHdhcmRzIHVwIHRoZSBET01cbiAgICAvLyB0byBmaW5kIHRoZSBuZWFyZXN0IGVsZW1lbnQgdGhhdCBoYXMgYWxyZWFkeSBiZWVuIG1vbmtleSBwYXRjaGVkIHdpdGggZGF0YVxuICAgIGxldCBwYXJlbnQgPSByRWxlbWVudCBhcyBhbnk7XG4gICAgd2hpbGUgKHBhcmVudCA9IHBhcmVudC5wYXJlbnROb2RlKSB7XG4gICAgICBjb25zdCBwYXJlbnRDb250ZXh0ID0gcmVhZFBhdGNoZWREYXRhKHBhcmVudCk7XG4gICAgICBpZiAocGFyZW50Q29udGV4dCkge1xuICAgICAgICBsZXQgbFZpZXc6IExWaWV3fG51bGw7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHBhcmVudENvbnRleHQpKSB7XG4gICAgICAgICAgbFZpZXcgPSBwYXJlbnRDb250ZXh0IGFzIExWaWV3O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxWaWV3ID0gcGFyZW50Q29udGV4dC5sVmlldztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRoZSBlZGdlIG9mIHRoZSBhcHAgd2FzIGFsc28gcmVhY2hlZCBoZXJlIHRocm91Z2ggYW5vdGhlciBtZWFuc1xuICAgICAgICAvLyAobWF5YmUgYmVjYXVzZSB0aGUgRE9NIHdhcyBjaGFuZ2VkIG1hbnVhbGx5KS5cbiAgICAgICAgaWYgKCFsVmlldykge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaW5kZXggPSBmaW5kVmlhTmF0aXZlRWxlbWVudChsVmlldywgckVsZW1lbnQpO1xuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgIGNvbnN0IG5hdGl2ZSA9IHJlYWRFbGVtZW50VmFsdWUobFZpZXdbaW5kZXhdKTtcbiAgICAgICAgICBjb25zdCBjb250ZXh0ID0gY3JlYXRlTENvbnRleHQobFZpZXcsIGluZGV4LCBuYXRpdmUpO1xuICAgICAgICAgIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIGNvbnRleHQpO1xuICAgICAgICAgIG1wVmFsdWUgPSBjb250ZXh0O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiAobXBWYWx1ZSBhcyBMQ29udGV4dCkgfHwgbnVsbDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGVtcHR5IGluc3RhbmNlIG9mIGEgYExDb250ZXh0YCBjb250ZXh0XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUxDb250ZXh0KGxWaWV3OiBMVmlldywgbm9kZUluZGV4OiBudW1iZXIsIG5hdGl2ZTogUkVsZW1lbnQpOiBMQ29udGV4dCB7XG4gIHJldHVybiB7XG4gICAgbFZpZXcsXG4gICAgbm9kZUluZGV4LFxuICAgIG5hdGl2ZSxcbiAgICBjb21wb25lbnQ6IHVuZGVmaW5lZCxcbiAgICBkaXJlY3RpdmVzOiB1bmRlZmluZWQsXG4gICAgbG9jYWxSZWZzOiB1bmRlZmluZWQsXG4gIH07XG59XG5cbi8qKlxuICogVGFrZXMgYSBjb21wb25lbnQgaW5zdGFuY2UgYW5kIHJldHVybnMgdGhlIHZpZXcgZm9yIHRoYXQgY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnRJbnN0YW5jZVxuICogQHJldHVybnMgVGhlIGNvbXBvbmVudCdzIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbXBvbmVudFZpZXdCeUluc3RhbmNlKGNvbXBvbmVudEluc3RhbmNlOiB7fSk6IExWaWV3IHtcbiAgbGV0IGxWaWV3ID0gcmVhZFBhdGNoZWREYXRhKGNvbXBvbmVudEluc3RhbmNlKTtcbiAgbGV0IHZpZXc6IExWaWV3O1xuXG4gIGlmIChBcnJheS5pc0FycmF5KGxWaWV3KSkge1xuICAgIGNvbnN0IG5vZGVJbmRleCA9IGZpbmRWaWFDb21wb25lbnQobFZpZXcsIGNvbXBvbmVudEluc3RhbmNlKTtcbiAgICB2aWV3ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgobm9kZUluZGV4LCBsVmlldyk7XG4gICAgY29uc3QgY29udGV4dCA9IGNyZWF0ZUxDb250ZXh0KGxWaWV3LCBub2RlSW5kZXgsIHZpZXdbSE9TVF0gYXMgUkVsZW1lbnQpO1xuICAgIGNvbnRleHQuY29tcG9uZW50ID0gY29tcG9uZW50SW5zdGFuY2U7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKGNvbXBvbmVudEluc3RhbmNlLCBjb250ZXh0KTtcbiAgICBhdHRhY2hQYXRjaERhdGEoY29udGV4dC5uYXRpdmUsIGNvbnRleHQpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGNvbnRleHQgPSBsVmlldyBhcyBhbnkgYXMgTENvbnRleHQ7XG4gICAgdmlldyA9IGdldENvbXBvbmVudFZpZXdCeUluZGV4KGNvbnRleHQubm9kZUluZGV4LCBjb250ZXh0LmxWaWV3KTtcbiAgfVxuICByZXR1cm4gdmlldztcbn1cblxuLyoqXG4gKiBBc3NpZ25zIHRoZSBnaXZlbiBkYXRhIHRvIHRoZSBnaXZlbiB0YXJnZXQgKHdoaWNoIGNvdWxkIGJlIGEgY29tcG9uZW50LFxuICogZGlyZWN0aXZlIG9yIERPTSBub2RlIGluc3RhbmNlKSB1c2luZyBtb25rZXktcGF0Y2hpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hQYXRjaERhdGEodGFyZ2V0OiBhbnksIGRhdGE6IExWaWV3IHwgTENvbnRleHQpIHtcbiAgdGFyZ2V0W01PTktFWV9QQVRDSF9LRVlfTkFNRV0gPSBkYXRhO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb21wb25lbnRJbnN0YW5jZShpbnN0YW5jZTogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiBpbnN0YW5jZSAmJiBpbnN0YW5jZS5jb25zdHJ1Y3RvciAmJiBpbnN0YW5jZS5jb25zdHJ1Y3Rvci5uZ0NvbXBvbmVudERlZjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRGlyZWN0aXZlSW5zdGFuY2UoaW5zdGFuY2U6IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gaW5zdGFuY2UgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IubmdEaXJlY3RpdmVEZWY7XG59XG5cbi8qKlxuICogTG9jYXRlcyB0aGUgZWxlbWVudCB3aXRoaW4gdGhlIGdpdmVuIExWaWV3IGFuZCByZXR1cm5zIHRoZSBtYXRjaGluZyBpbmRleFxuICovXG5mdW5jdGlvbiBmaW5kVmlhTmF0aXZlRWxlbWVudChsVmlldzogTFZpZXcsIHRhcmdldDogUkVsZW1lbnQpOiBudW1iZXIge1xuICBsZXQgdE5vZGUgPSBsVmlld1tUVklFV10uZmlyc3RDaGlsZDtcbiAgd2hpbGUgKHROb2RlKSB7XG4gICAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpICE7XG4gICAgaWYgKG5hdGl2ZSA9PT0gdGFyZ2V0KSB7XG4gICAgICByZXR1cm4gdE5vZGUuaW5kZXg7XG4gICAgfVxuICAgIHROb2RlID0gdHJhdmVyc2VOZXh0RWxlbWVudCh0Tm9kZSk7XG4gIH1cblxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuICogTG9jYXRlcyB0aGUgbmV4dCB0Tm9kZSAoY2hpbGQsIHNpYmxpbmcgb3IgcGFyZW50KS5cbiAqL1xuZnVuY3Rpb24gdHJhdmVyc2VOZXh0RWxlbWVudCh0Tm9kZTogVE5vZGUpOiBUTm9kZXxudWxsIHtcbiAgaWYgKHROb2RlLmNoaWxkKSB7XG4gICAgcmV0dXJuIHROb2RlLmNoaWxkO1xuICB9IGVsc2UgaWYgKHROb2RlLm5leHQpIHtcbiAgICByZXR1cm4gdE5vZGUubmV4dDtcbiAgfSBlbHNlIGlmICh0Tm9kZS5wYXJlbnQpIHtcbiAgICByZXR1cm4gdE5vZGUucGFyZW50Lm5leHQgfHwgbnVsbDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBjb21wb25lbnQgd2l0aGluIHRoZSBnaXZlbiBMVmlldyBhbmQgcmV0dXJucyB0aGUgbWF0Y2hpbmcgaW5kZXhcbiAqL1xuZnVuY3Rpb24gZmluZFZpYUNvbXBvbmVudChsVmlldzogTFZpZXcsIGNvbXBvbmVudEluc3RhbmNlOiB7fSk6IG51bWJlciB7XG4gIGNvbnN0IGNvbXBvbmVudEluZGljZXMgPSBsVmlld1tUVklFV10uY29tcG9uZW50cztcbiAgaWYgKGNvbXBvbmVudEluZGljZXMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudEluZGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVsZW1lbnRDb21wb25lbnRJbmRleCA9IGNvbXBvbmVudEluZGljZXNbaV07XG4gICAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgoZWxlbWVudENvbXBvbmVudEluZGV4LCBsVmlldyk7XG4gICAgICBpZiAoY29tcG9uZW50Vmlld1tDT05URVhUXSA9PT0gY29tcG9uZW50SW5zdGFuY2UpIHtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnRDb21wb25lbnRJbmRleDtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qgcm9vdENvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleChIRUFERVJfT0ZGU0VULCBsVmlldyk7XG4gICAgY29uc3Qgcm9vdENvbXBvbmVudCA9IHJvb3RDb21wb25lbnRWaWV3W0NPTlRFWFRdO1xuICAgIGlmIChyb290Q29tcG9uZW50ID09PSBjb21wb25lbnRJbnN0YW5jZSkge1xuICAgICAgLy8gd2UgYXJlIGRlYWxpbmcgd2l0aCB0aGUgcm9vdCBlbGVtZW50IGhlcmUgdGhlcmVmb3JlIHdlIGtub3cgdGhhdCB0aGVcbiAgICAgIC8vIGVsZW1lbnQgaXMgdGhlIHZlcnkgZmlyc3QgZWxlbWVudCBhZnRlciB0aGUgSEVBREVSIGRhdGEgaW4gdGhlIGxWaWV3XG4gICAgICByZXR1cm4gSEVBREVSX09GRlNFVDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGRpcmVjdGl2ZSB3aXRoaW4gdGhlIGdpdmVuIExWaWV3IGFuZCByZXR1cm5zIHRoZSBtYXRjaGluZyBpbmRleFxuICovXG5mdW5jdGlvbiBmaW5kVmlhRGlyZWN0aXZlKGxWaWV3OiBMVmlldywgZGlyZWN0aXZlSW5zdGFuY2U6IHt9KTogbnVtYmVyIHtcbiAgLy8gaWYgYSBkaXJlY3RpdmUgaXMgbW9ua2V5IHBhdGNoZWQgdGhlbiBpdCB3aWxsIChieSBkZWZhdWx0KVxuICAvLyBoYXZlIGEgcmVmZXJlbmNlIHRvIHRoZSBMVmlldyBvZiB0aGUgY3VycmVudCB2aWV3LiBUaGVcbiAgLy8gZWxlbWVudCBib3VuZCB0byB0aGUgZGlyZWN0aXZlIGJlaW5nIHNlYXJjaCBsaXZlcyBzb21ld2hlcmVcbiAgLy8gaW4gdGhlIHZpZXcgZGF0YS4gV2UgbG9vcCB0aHJvdWdoIHRoZSBub2RlcyBhbmQgY2hlY2sgdGhlaXJcbiAgLy8gbGlzdCBvZiBkaXJlY3RpdmVzIGZvciB0aGUgaW5zdGFuY2UuXG4gIGxldCB0Tm9kZSA9IGxWaWV3W1RWSUVXXS5maXJzdENoaWxkO1xuICB3aGlsZSAodE5vZGUpIHtcbiAgICBjb25zdCBkaXJlY3RpdmVJbmRleFN0YXJ0ID0gZ2V0RGlyZWN0aXZlU3RhcnRJbmRleCh0Tm9kZSk7XG4gICAgY29uc3QgZGlyZWN0aXZlSW5kZXhFbmQgPSBnZXREaXJlY3RpdmVFbmRJbmRleCh0Tm9kZSwgZGlyZWN0aXZlSW5kZXhTdGFydCk7XG4gICAgZm9yIChsZXQgaSA9IGRpcmVjdGl2ZUluZGV4U3RhcnQ7IGkgPCBkaXJlY3RpdmVJbmRleEVuZDsgaSsrKSB7XG4gICAgICBpZiAobFZpZXdbaV0gPT09IGRpcmVjdGl2ZUluc3RhbmNlKSB7XG4gICAgICAgIHJldHVybiB0Tm9kZS5pbmRleDtcbiAgICAgIH1cbiAgICB9XG4gICAgdE5vZGUgPSB0cmF2ZXJzZU5leHRFbGVtZW50KHROb2RlKTtcbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIGxpc3Qgb2YgZGlyZWN0aXZlcyBleHRyYWN0ZWQgZnJvbSB0aGUgZ2l2ZW4gdmlldyBiYXNlZCBvbiB0aGVcbiAqIHByb3ZpZGVkIGxpc3Qgb2YgZGlyZWN0aXZlIGluZGV4IHZhbHVlcy5cbiAqXG4gKiBAcGFyYW0gbm9kZUluZGV4IFRoZSBub2RlIGluZGV4XG4gKiBAcGFyYW0gbFZpZXcgVGhlIHRhcmdldCB2aWV3IGRhdGFcbiAqIEBwYXJhbSBpbmNsdWRlQ29tcG9uZW50cyBXaGV0aGVyIG9yIG5vdCB0byBpbmNsdWRlIGNvbXBvbmVudHMgaW4gcmV0dXJuZWQgZGlyZWN0aXZlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGlyZWN0aXZlc0F0Tm9kZUluZGV4KFxuICAgIG5vZGVJbmRleDogbnVtYmVyLCBsVmlldzogTFZpZXcsIGluY2x1ZGVDb21wb25lbnRzOiBib29sZWFuKTogYW55W118bnVsbCB7XG4gIGNvbnN0IHROb2RlID0gbFZpZXdbVFZJRVddLmRhdGFbbm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgbGV0IGRpcmVjdGl2ZVN0YXJ0SW5kZXggPSBnZXREaXJlY3RpdmVTdGFydEluZGV4KHROb2RlKTtcbiAgaWYgKGRpcmVjdGl2ZVN0YXJ0SW5kZXggPT0gMCkgcmV0dXJuIEVNUFRZX0FSUkFZO1xuICBjb25zdCBkaXJlY3RpdmVFbmRJbmRleCA9IGdldERpcmVjdGl2ZUVuZEluZGV4KHROb2RlLCBkaXJlY3RpdmVTdGFydEluZGV4KTtcbiAgaWYgKCFpbmNsdWRlQ29tcG9uZW50cyAmJiB0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQpIGRpcmVjdGl2ZVN0YXJ0SW5kZXgrKztcbiAgcmV0dXJuIGxWaWV3LnNsaWNlKGRpcmVjdGl2ZVN0YXJ0SW5kZXgsIGRpcmVjdGl2ZUVuZEluZGV4KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbXBvbmVudEF0Tm9kZUluZGV4KG5vZGVJbmRleDogbnVtYmVyLCBsVmlldzogTFZpZXcpOiB7fXxudWxsIHtcbiAgY29uc3QgdE5vZGUgPSBsVmlld1tUVklFV10uZGF0YVtub2RlSW5kZXhdIGFzIFROb2RlO1xuICBsZXQgZGlyZWN0aXZlU3RhcnRJbmRleCA9IGdldERpcmVjdGl2ZVN0YXJ0SW5kZXgodE5vZGUpO1xuICByZXR1cm4gdE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50ID8gbFZpZXdbZGlyZWN0aXZlU3RhcnRJbmRleF0gOiBudWxsO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBtYXAgb2YgbG9jYWwgcmVmZXJlbmNlcyAobG9jYWwgcmVmZXJlbmNlIG5hbWUgPT4gZWxlbWVudCBvciBkaXJlY3RpdmUgaW5zdGFuY2UpIHRoYXRcbiAqIGV4aXN0IG9uIGEgZ2l2ZW4gZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpc2NvdmVyTG9jYWxSZWZzKGxWaWV3OiBMVmlldywgbm9kZUluZGV4OiBudW1iZXIpOiB7W2tleTogc3RyaW5nXTogYW55fXxudWxsIHtcbiAgY29uc3QgdE5vZGUgPSBsVmlld1tUVklFV10uZGF0YVtub2RlSW5kZXhdIGFzIFROb2RlO1xuICBpZiAodE5vZGUgJiYgdE5vZGUubG9jYWxOYW1lcykge1xuICAgIGNvbnN0IHJlc3VsdDoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHROb2RlLmxvY2FsTmFtZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGxvY2FsUmVmTmFtZSA9IHROb2RlLmxvY2FsTmFtZXNbaV07XG4gICAgICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IHROb2RlLmxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIHJlc3VsdFtsb2NhbFJlZk5hbWVdID1cbiAgICAgICAgICBkaXJlY3RpdmVJbmRleCA9PT0gLTEgPyBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgISA6IGxWaWV3W2RpcmVjdGl2ZUluZGV4XTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXREaXJlY3RpdmVTdGFydEluZGV4KHROb2RlOiBUTm9kZSk6IG51bWJlciB7XG4gIC8vIHRoZSB0Tm9kZSBpbnN0YW5jZXMgc3RvcmUgYSBmbGFnIHZhbHVlIHdoaWNoIHRoZW4gaGFzIGFcbiAgLy8gcG9pbnRlciB3aGljaCB0ZWxscyB0aGUgc3RhcnRpbmcgaW5kZXggb2Ygd2hlcmUgYWxsIHRoZVxuICAvLyBhY3RpdmUgZGlyZWN0aXZlcyBhcmUgaW4gdGhlIG1hc3RlciBkaXJlY3RpdmUgYXJyYXlcbiAgcmV0dXJuIHROb2RlLmZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xufVxuXG5mdW5jdGlvbiBnZXREaXJlY3RpdmVFbmRJbmRleCh0Tm9kZTogVE5vZGUsIHN0YXJ0SW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIC8vIFRoZSBlbmQgdmFsdWUgaXMgYWxzbyBhIHBhcnQgb2YgdGhlIHNhbWUgZmxhZ1xuICAvLyAoc2VlIGBUTm9kZUZsYWdzYCB0byBzZWUgaG93IHRoZSBmbGFnIGJpdCBzaGlmdGluZ1xuICAvLyB2YWx1ZXMgYXJlIHVzZWQpLlxuICBjb25zdCBjb3VudCA9IHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2s7XG4gIHJldHVybiBjb3VudCA/IChzdGFydEluZGV4ICsgY291bnQpIDogLTE7XG59XG4iXX0=