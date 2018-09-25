/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import './ng_dev_mode';
import { assertEqual } from './assert';
import { CONTEXT, DIRECTIVES, HEADER_OFFSET, TVIEW } from './interfaces/view';
/** *
 * This property will be monkey-patched on elements, components and directives
  @type {?} */
export const MONKEY_PATCH_KEY_NAME = '__ngContext__';
/**
 * The internal view context which is specific to a given DOM element, directive or
 * component instance. Each value in here (besides the LViewData and element node details)
 * can be present, null or undefined. If undefined then it implies the value has not been
 * looked up yet, otherwise, if null, then a lookup was executed and nothing was found.
 *
 * Each value will get filled when the respective value is examined within the getContext
 * function. The component, element and each directive instance will share the same instance
 * of the context.
 * @record
 */
export function LContext() { }
/**
 * The component's parent view data
 * @type {?}
 */
LContext.prototype.lViewData;
/**
 * The index instance of the LNode
 * @type {?}
 */
LContext.prototype.lNodeIndex;
/**
 * The instance of the DOM node that is attached to the lNode
 * @type {?}
 */
LContext.prototype.native;
/**
 * The instance of the Component node
 * @type {?}
 */
LContext.prototype.component;
/**
 * The list of indices for the active directives that exist on this element
 * @type {?}
 */
LContext.prototype.directiveIndices;
/**
 * The list of active directives that exist on this element
 * @type {?}
 */
LContext.prototype.directives;
/**
 * Returns the matching `LContext` data for a given DOM node, directive or component instance.
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
 * @param {?} target
 * @return {?}
 */
export function getContext(target) {
    /** @type {?} */
    let mpValue = readPatchedData(target);
    if (mpValue) {
        // only when it's an array is it considered an LViewData instance
        // ... otherwise it's an already constructed LContext instance
        if (Array.isArray(mpValue)) {
            /** @type {?} */
            const lViewData = /** @type {?} */ ((mpValue));
            /** @type {?} */
            let lNodeIndex;
            /** @type {?} */
            let component = undefined;
            /** @type {?} */
            let directiveIndices = undefined;
            /** @type {?} */
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
                lNodeIndex = findViaNativeElement(lViewData, /** @type {?} */ (target));
                if (lNodeIndex == -1) {
                    return null;
                }
            }
            /** @type {?} */
            const lNode = /** @type {?} */ ((getLNodeFromViewData(lViewData, lNodeIndex)));
            /** @type {?} */
            const existingCtx = readPatchedData(lNode.native);
            /** @type {?} */
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
        /** @type {?} */
        const rElement = /** @type {?} */ (target);
        ngDevMode && assertDomElement(rElement);
        /** @type {?} */
        let parent = /** @type {?} */ (rElement);
        while (parent = parent.parentNode) {
            /** @type {?} */
            const parentContext = readPatchedData(parent);
            if (parentContext) {
                /** @type {?} */
                let lViewData;
                if (Array.isArray(parentContext)) {
                    lViewData = /** @type {?} */ (parentContext);
                }
                else {
                    lViewData = parentContext.lViewData;
                }
                // the edge of the app was also reached here through another means
                // (maybe because the DOM was changed manually).
                if (!lViewData) {
                    return null;
                }
                /** @type {?} */
                const index = findViaNativeElement(lViewData, rElement);
                if (index >= 0) {
                    /** @type {?} */
                    const lNode = /** @type {?} */ ((getLNodeFromViewData(lViewData, index)));
                    /** @type {?} */
                    const context = createLContext(lViewData, index, lNode.native);
                    attachPatchData(lNode.native, context);
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
 * @param {?} lViewData
 * @param {?} lNodeIndex
 * @param {?} native
 * @return {?}
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
 * @param {?} target
 * @return {?}
 */
export function getLElementNode(target) {
    /** @type {?} */
    const context = getContext(target);
    return context ? getLNodeFromViewData(context.lViewData, context.lNodeIndex) : null;
}
/**
 * @param {?} rootComponentInstance
 * @return {?}
 */
export function getLElementFromRootComponent(rootComponentInstance) {
    /** @type {?} */
    const lViewData = /** @type {?} */ ((readPatchedLViewData(rootComponentInstance)));
    return readElementValue(lViewData[HEADER_OFFSET]);
}
/**
 * A simplified lookup function for finding the LElementNode from a component instance.
 *
 * This function exists for tree-shaking purposes to avoid having to pull in everything
 * that `getContext` has in the event that an Angular application doesn't need to have
 * any programmatic access to an element's context (only change detection uses this function).
 * @param {?} componentInstance
 * @return {?}
 */
export function getLElementFromComponent(componentInstance) {
    /** @type {?} */
    let lViewData = readPatchedData(componentInstance);
    /** @type {?} */
    let lNode;
    if (Array.isArray(lViewData)) {
        /** @type {?} */
        const lNodeIndex = findViaComponent(lViewData, componentInstance);
        lNode = readElementValue(lViewData[lNodeIndex]);
        /** @type {?} */
        const context = createLContext(lViewData, lNodeIndex, lNode.native);
        context.component = componentInstance;
        attachPatchData(componentInstance, context);
        attachPatchData(context.native, context);
    }
    else {
        /** @type {?} */
        const context = /** @type {?} */ ((lViewData));
        lNode = readElementValue(context.lViewData[context.lNodeIndex]);
    }
    return lNode;
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
 * Returns the monkey-patch value data present on the target (which could be
 * a component, directive or a DOM node).
 * @param {?} target
 * @return {?}
 */
export function readPatchedData(target) {
    return target[MONKEY_PATCH_KEY_NAME];
}
/**
 * @param {?} target
 * @return {?}
 */
export function readPatchedLViewData(target) {
    /** @type {?} */
    const value = readPatchedData(target);
    if (value) {
        return Array.isArray(value) ? value : (/** @type {?} */ (value)).lViewData;
    }
    return null;
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
 * Locates the element within the given LViewData and returns the matching index
 * @param {?} lViewData
 * @param {?} native
 * @return {?}
 */
function findViaNativeElement(lViewData, native) {
    /** @type {?} */
    let tNode = lViewData[TVIEW].firstChild;
    while (tNode) {
        /** @type {?} */
        const lNode = /** @type {?} */ ((getLNodeFromViewData(lViewData, tNode.index)));
        if (lNode.native === native) {
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
 * Locates the component within the given LViewData and returns the matching index
 * @param {?} lViewData
 * @param {?} componentInstance
 * @return {?}
 */
function findViaComponent(lViewData, componentInstance) {
    /** @type {?} */
    const componentIndices = lViewData[TVIEW].components;
    if (componentIndices) {
        for (let i = 0; i < componentIndices.length; i++) {
            /** @type {?} */
            const elementComponentIndex = componentIndices[i];
            /** @type {?} */
            const lNodeData = /** @type {?} */ ((readElementValue(/** @type {?} */ ((lViewData[elementComponentIndex]))).data));
            if (lNodeData[CONTEXT] === componentInstance) {
                return elementComponentIndex;
            }
        }
    }
    else {
        /** @type {?} */
        const rootNode = lViewData[HEADER_OFFSET];
        /** @type {?} */
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
 * @param {?} lViewData
 * @param {?} directiveInstance
 * @return {?}
 */
function findViaDirective(lViewData, directiveInstance) {
    /** @type {?} */
    const directivesAcrossView = lViewData[DIRECTIVES];
    /** @type {?} */
    const directiveIndex = directivesAcrossView ? directivesAcrossView.indexOf(directiveInstance) : -1;
    if (directiveIndex >= 0) {
        /** @type {?} */
        let tNode = lViewData[TVIEW].firstChild;
        while (tNode) {
            /** @type {?} */
            const directiveIndexStart = getDirectiveStartIndex(tNode);
            /** @type {?} */
            const directiveIndexEnd = getDirectiveEndIndex(tNode, directiveIndexStart);
            if (directiveIndex >= directiveIndexStart && directiveIndex < directiveIndexEnd) {
                return tNode.index;
            }
            tNode = traverseNextElement(tNode);
        }
    }
    return -1;
}
/**
 * @param {?} element
 * @return {?}
 */
function assertDomElement(element) {
    assertEqual(element.nodeType, 1, 'The provided value must be an instance of an HTMLElement');
}
/**
 * Retruns the instance of the LElementNode at the given index in the LViewData.
 *
 * This function will also unwrap the inner value incase it's stuffed into an
 * array (which is what happens when [style] and [class] bindings are present
 * in the view instructions for the element being returned).
 * @param {?} lViewData
 * @param {?} lElementIndex
 * @return {?}
 */
function getLNodeFromViewData(lViewData, lElementIndex) {
    /** @type {?} */
    const value = lViewData[lElementIndex];
    return value ? readElementValue(value) : null;
}
/**
 * Returns a collection of directive index values that are used on the element
 * (which is referenced by the lNodeIndex)
 * @param {?} lViewData
 * @param {?} lNodeIndex
 * @param {?=} includeComponents
 * @return {?}
 */
export function discoverDirectiveIndices(lViewData, lNodeIndex, includeComponents) {
    /** @type {?} */
    const directivesAcrossView = lViewData[DIRECTIVES];
    /** @type {?} */
    const tNode = /** @type {?} */ (lViewData[TVIEW].data[lNodeIndex]);
    if (directivesAcrossView && directivesAcrossView.length) {
        /** @type {?} */
        const directiveIndexStart = getDirectiveStartIndex(tNode);
        /** @type {?} */
        const directiveIndexEnd = getDirectiveEndIndex(tNode, directiveIndexStart);
        /** @type {?} */
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
/**
 * Returns a list of directives extracted from the given view based on the
 * provided list of directive index values.
 *
 * @param {?} lViewData The target view data
 * @param {?} indices A collection of directive index values which will be used to
 *    figure out the directive instances
 * @return {?}
 */
export function discoverDirectives(lViewData, indices) {
    /** @type {?} */
    const directives = [];
    /** @type {?} */
    const directiveInstances = lViewData[DIRECTIVES];
    if (directiveInstances) {
        for (let i = 0; i < indices.length; i++) {
            /** @type {?} */
            const directiveIndex = indices[i];
            /** @type {?} */
            const directive = directiveInstances[directiveIndex];
            directives.push(directive);
        }
    }
    return directives;
}
/**
 * @param {?} tNode
 * @return {?}
 */
function getDirectiveStartIndex(tNode) {
    // the tNode instances store a flag value which then has a
    // pointer which tells the starting index of where all the
    // active directives are in the master directive array
    return tNode.flags >> 15 /* DirectiveStartingIndexShift */;
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
/**
 * @param {?} value
 * @return {?}
 */
export function readElementValue(value) {
    return /** @type {?} */ ((Array.isArray(value) ? (/** @type {?} */ ((value)))[0] : value));
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9kaXNjb3ZlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2NvbnRleHRfZGlzY292ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFPQSxPQUFPLGVBQWUsQ0FBQztBQUV2QixPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBR3JDLE9BQU8sRUFBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLGFBQWEsRUFBYSxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQzs7OztBQUt2RixhQUFhLHFCQUFxQixHQUFHLGVBQWUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaURyRCxNQUFNLFVBQVUsVUFBVSxDQUFDLE1BQVc7O0lBQ3BDLElBQUksT0FBTyxHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN0QyxJQUFJLE9BQU8sRUFBRTs7O1FBR1gsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFOztZQUMxQixNQUFNLFNBQVMsc0JBQWMsT0FBTyxHQUFHOztZQUN2QyxJQUFJLFVBQVUsQ0FBUzs7WUFDdkIsSUFBSSxTQUFTLEdBQVEsU0FBUyxDQUFDOztZQUMvQixJQUFJLGdCQUFnQixHQUE0QixTQUFTLENBQUM7O1lBQzFELElBQUksVUFBVSxHQUF5QixTQUFTLENBQUM7WUFFakQsSUFBSSxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDL0IsVUFBVSxHQUFHLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDakQsSUFBSSxVQUFVLElBQUksQ0FBQyxDQUFDLEVBQUU7b0JBQ3BCLE1BQU0sSUFBSSxLQUFLLENBQUMseURBQXlELENBQUMsQ0FBQztpQkFDNUU7Z0JBQ0QsU0FBUyxHQUFHLE1B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UyxzQkFBc0IsQ0FBQyxLQUFZOzs7O0lBSTFDLE9BQU8sS0FBSyxDQUFDLEtBQUssd0NBQTBDLENBQUM7Q0FDOUQ7Ozs7OztBQUVELFNBQVMsb0JBQW9CLENBQUMsS0FBWSxFQUFFLFVBQWtCOztJQUk1RCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxnQ0FBZ0MsQ0FBQztJQUMxRCxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQzFDOzs7OztBQUVELE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxLQUEyQjtJQUMxRCx5QkFBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLG9CQUFDLEtBQVksR0FBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQWlCLEVBQUM7Q0FDcEYiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgJy4vbmdfZGV2X21vZGUnO1xuXG5pbXBvcnQge2Fzc2VydEVxdWFsfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge0xFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0NPTlRFWFQsIERJUkVDVElWRVMsIEhFQURFUl9PRkZTRVQsIExWaWV3RGF0YSwgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcblxuLyoqXG4gKiBUaGlzIHByb3BlcnR5IHdpbGwgYmUgbW9ua2V5LXBhdGNoZWQgb24gZWxlbWVudHMsIGNvbXBvbmVudHMgYW5kIGRpcmVjdGl2ZXNcbiAqL1xuZXhwb3J0IGNvbnN0IE1PTktFWV9QQVRDSF9LRVlfTkFNRSA9ICdfX25nQ29udGV4dF9fJztcblxuLyoqXG4gKiBUaGUgaW50ZXJuYWwgdmlldyBjb250ZXh0IHdoaWNoIGlzIHNwZWNpZmljIHRvIGEgZ2l2ZW4gRE9NIGVsZW1lbnQsIGRpcmVjdGl2ZSBvclxuICogY29tcG9uZW50IGluc3RhbmNlLiBFYWNoIHZhbHVlIGluIGhlcmUgKGJlc2lkZXMgdGhlIExWaWV3RGF0YSBhbmQgZWxlbWVudCBub2RlIGRldGFpbHMpXG4gKiBjYW4gYmUgcHJlc2VudCwgbnVsbCBvciB1bmRlZmluZWQuIElmIHVuZGVmaW5lZCB0aGVuIGl0IGltcGxpZXMgdGhlIHZhbHVlIGhhcyBub3QgYmVlblxuICogbG9va2VkIHVwIHlldCwgb3RoZXJ3aXNlLCBpZiBudWxsLCB0aGVuIGEgbG9va3VwIHdhcyBleGVjdXRlZCBhbmQgbm90aGluZyB3YXMgZm91bmQuXG4gKlxuICogRWFjaCB2YWx1ZSB3aWxsIGdldCBmaWxsZWQgd2hlbiB0aGUgcmVzcGVjdGl2ZSB2YWx1ZSBpcyBleGFtaW5lZCB3aXRoaW4gdGhlIGdldENvbnRleHRcbiAqIGZ1bmN0aW9uLiBUaGUgY29tcG9uZW50LCBlbGVtZW50IGFuZCBlYWNoIGRpcmVjdGl2ZSBpbnN0YW5jZSB3aWxsIHNoYXJlIHRoZSBzYW1lIGluc3RhbmNlXG4gKiBvZiB0aGUgY29udGV4dC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBMQ29udGV4dCB7XG4gIC8qKiBUaGUgY29tcG9uZW50J3MgcGFyZW50IHZpZXcgZGF0YSAqL1xuICBsVmlld0RhdGE6IExWaWV3RGF0YTtcblxuICAvKiogVGhlIGluZGV4IGluc3RhbmNlIG9mIHRoZSBMTm9kZSAqL1xuICBsTm9kZUluZGV4OiBudW1iZXI7XG5cbiAgLyoqIFRoZSBpbnN0YW5jZSBvZiB0aGUgRE9NIG5vZGUgdGhhdCBpcyBhdHRhY2hlZCB0byB0aGUgbE5vZGUgKi9cbiAgbmF0aXZlOiBSRWxlbWVudDtcblxuICAvKiogVGhlIGluc3RhbmNlIG9mIHRoZSBDb21wb25lbnQgbm9kZSAqL1xuICBjb21wb25lbnQ6IHt9fG51bGx8dW5kZWZpbmVkO1xuXG4gIC8qKiBUaGUgbGlzdCBvZiBpbmRpY2VzIGZvciB0aGUgYWN0aXZlIGRpcmVjdGl2ZXMgdGhhdCBleGlzdCBvbiB0aGlzIGVsZW1lbnQgKi9cbiAgZGlyZWN0aXZlSW5kaWNlczogbnVtYmVyW118bnVsbHx1bmRlZmluZWQ7XG5cbiAgLyoqIFRoZSBsaXN0IG9mIGFjdGl2ZSBkaXJlY3RpdmVzIHRoYXQgZXhpc3Qgb24gdGhpcyBlbGVtZW50ICovXG4gIGRpcmVjdGl2ZXM6IEFycmF5PHt9PnxudWxsfHVuZGVmaW5lZDtcbn1cblxuLyoqIFJldHVybnMgdGhlIG1hdGNoaW5nIGBMQ29udGV4dGAgZGF0YSBmb3IgYSBnaXZlbiBET00gbm9kZSwgZGlyZWN0aXZlIG9yIGNvbXBvbmVudCBpbnN0YW5jZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgZXhhbWluZSB0aGUgcHJvdmlkZWQgRE9NIGVsZW1lbnQsIGNvbXBvbmVudCwgb3IgZGlyZWN0aXZlIGluc3RhbmNlXFwnc1xuICogbW9ua2V5LXBhdGNoZWQgcHJvcGVydHkgdG8gZGVyaXZlIHRoZSBgTENvbnRleHRgIGRhdGEuIE9uY2UgY2FsbGVkIHRoZW4gdGhlIG1vbmtleS1wYXRjaGVkXG4gKiB2YWx1ZSB3aWxsIGJlIHRoYXQgb2YgdGhlIG5ld2x5IGNyZWF0ZWQgYExDb250ZXh0YC5cbiAqXG4gKiBJZiB0aGUgbW9ua2V5LXBhdGNoZWQgdmFsdWUgaXMgdGhlIGBMVmlld0RhdGFgIGluc3RhbmNlIHRoZW4gdGhlIGNvbnRleHQgdmFsdWUgZm9yIHRoYXRcbiAqIHRhcmdldCB3aWxsIGJlIGNyZWF0ZWQgYW5kIHRoZSBtb25rZXktcGF0Y2ggcmVmZXJlbmNlIHdpbGwgYmUgdXBkYXRlZC4gVGhlcmVmb3JlIHdoZW4gdGhpc1xuICogZnVuY3Rpb24gaXMgY2FsbGVkIGl0IG1heSBtdXRhdGUgdGhlIHByb3ZpZGVkIGVsZW1lbnRcXCdzLCBjb21wb25lbnRcXCdzIG9yIGFueSBvZiB0aGUgYXNzb2NpYXRlZFxuICogZGlyZWN0aXZlXFwncyBtb25rZXktcGF0Y2ggdmFsdWVzLlxuICpcbiAqIElmIHRoZSBtb25rZXktcGF0Y2ggdmFsdWUgaXMgbm90IGRldGVjdGVkIHRoZW4gdGhlIGNvZGUgd2lsbCB3YWxrIHVwIHRoZSBET00gdW50aWwgYW4gZWxlbWVudFxuICogaXMgZm91bmQgd2hpY2ggY29udGFpbnMgYSBtb25rZXktcGF0Y2ggcmVmZXJlbmNlLiBXaGVuIHRoYXQgb2NjdXJzIHRoZW4gdGhlIHByb3ZpZGVkIGVsZW1lbnRcbiAqIHdpbGwgYmUgdXBkYXRlZCB3aXRoIGEgbmV3IGNvbnRleHQgKHdoaWNoIGlzIHRoZW4gcmV0dXJuZWQpLiBJZiB0aGUgbW9ua2V5LXBhdGNoIHZhbHVlIGlzIG5vdFxuICogZGV0ZWN0ZWQgZm9yIGEgY29tcG9uZW50L2RpcmVjdGl2ZSBpbnN0YW5jZSB0aGVuIGl0IHdpbGwgdGhyb3cgYW4gZXJyb3IgKGFsbCBjb21wb25lbnRzIGFuZFxuICogZGlyZWN0aXZlcyBzaG91bGQgYmUgYXV0b21hdGljYWxseSBtb25rZXktcGF0Y2hlZCBieSBpdnkpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29udGV4dCh0YXJnZXQ6IGFueSk6IExDb250ZXh0fG51bGwge1xuICBsZXQgbXBWYWx1ZSA9IHJlYWRQYXRjaGVkRGF0YSh0YXJnZXQpO1xuICBpZiAobXBWYWx1ZSkge1xuICAgIC8vIG9ubHkgd2hlbiBpdCdzIGFuIGFycmF5IGlzIGl0IGNvbnNpZGVyZWQgYW4gTFZpZXdEYXRhIGluc3RhbmNlXG4gICAgLy8gLi4uIG90aGVyd2lzZSBpdCdzIGFuIGFscmVhZHkgY29uc3RydWN0ZWQgTENvbnRleHQgaW5zdGFuY2VcbiAgICBpZiAoQXJyYXkuaXNBcnJheShtcFZhbHVlKSkge1xuICAgICAgY29uc3QgbFZpZXdEYXRhOiBMVmlld0RhdGEgPSBtcFZhbHVlICE7XG4gICAgICBsZXQgbE5vZGVJbmRleDogbnVtYmVyO1xuICAgICAgbGV0IGNvbXBvbmVudDogYW55ID0gdW5kZWZpbmVkO1xuICAgICAgbGV0IGRpcmVjdGl2ZUluZGljZXM6IG51bWJlcltdfG51bGx8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgbGV0IGRpcmVjdGl2ZXM6IGFueVtdfG51bGx8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gICAgICBpZiAoaXNDb21wb25lbnRJbnN0YW5jZSh0YXJnZXQpKSB7XG4gICAgICAgIGxOb2RlSW5kZXggPSBmaW5kVmlhQ29tcG9uZW50KGxWaWV3RGF0YSwgdGFyZ2V0KTtcbiAgICAgICAgaWYgKGxOb2RlSW5kZXggPT0gLTEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBwcm92aWRlZCBjb21wb25lbnQgd2FzIG5vdCBmb3VuZCBpbiB0aGUgYXBwbGljYXRpb24nKTtcbiAgICAgICAgfVxuICAgICAgICBjb21wb25lbnQgPSB0YXJnZXQ7XG4gICAgICB9IGVsc2UgaWYgKGlzRGlyZWN0aXZlSW5zdGFuY2UodGFyZ2V0KSkge1xuICAgICAgICBsTm9kZUluZGV4ID0gZmluZFZpYURpcmVjdGl2ZShsVmlld0RhdGEsIHRhcmdldCk7XG4gICAgICAgIGlmIChsTm9kZUluZGV4ID09IC0xKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgcHJvdmlkZWQgZGlyZWN0aXZlIHdhcyBub3QgZm91bmQgaW4gdGhlIGFwcGxpY2F0aW9uJyk7XG4gICAgICAgIH1cbiAgICAgICAgZGlyZWN0aXZlSW5kaWNlcyA9IGRpc2NvdmVyRGlyZWN0aXZlSW5kaWNlcyhsVmlld0RhdGEsIGxOb2RlSW5kZXgpO1xuICAgICAgICBkaXJlY3RpdmVzID0gZGlyZWN0aXZlSW5kaWNlcyA/IGRpc2NvdmVyRGlyZWN0aXZlcyhsVmlld0RhdGEsIGRpcmVjdGl2ZUluZGljZXMpIDogbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxOb2RlSW5kZXggPSBmaW5kVmlhTmF0aXZlRWxlbWVudChsVmlld0RhdGEsIHRhcmdldCBhcyBSRWxlbWVudCk7XG4gICAgICAgIGlmIChsTm9kZUluZGV4ID09IC0xKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gdGhlIGdvYWwgaXMgbm90IHRvIGZpbGwgdGhlIGVudGlyZSBjb250ZXh0IGZ1bGwgb2YgZGF0YSBiZWNhdXNlIHRoZSBsb29rdXBzXG4gICAgICAvLyBhcmUgZXhwZW5zaXZlLiBJbnN0ZWFkLCBvbmx5IHRoZSB0YXJnZXQgZGF0YSAodGhlIGVsZW1lbnQsIGNvbXBvbnRlbnQgb3JcbiAgICAgIC8vIGRpcmVjdGl2ZSBkZXRhaWxzKSBhcmUgZmlsbGVkIGludG8gdGhlIGNvbnRleHQuIElmIGNhbGxlZCBtdWx0aXBsZSB0aW1lc1xuICAgICAgLy8gd2l0aCBkaWZmZXJlbnQgdGFyZ2V0IHZhbHVlcyB0aGVuIHRoZSBtaXNzaW5nIHRhcmdldCBkYXRhIHdpbGwgYmUgZmlsbGVkIGluLlxuICAgICAgY29uc3QgbE5vZGUgPSBnZXRMTm9kZUZyb21WaWV3RGF0YShsVmlld0RhdGEsIGxOb2RlSW5kZXgpICE7XG4gICAgICBjb25zdCBleGlzdGluZ0N0eCA9IHJlYWRQYXRjaGVkRGF0YShsTm9kZS5uYXRpdmUpO1xuICAgICAgY29uc3QgY29udGV4dDogTENvbnRleHQgPSAoZXhpc3RpbmdDdHggJiYgIUFycmF5LmlzQXJyYXkoZXhpc3RpbmdDdHgpKSA/XG4gICAgICAgICAgZXhpc3RpbmdDdHggOlxuICAgICAgICAgIGNyZWF0ZUxDb250ZXh0KGxWaWV3RGF0YSwgbE5vZGVJbmRleCwgbE5vZGUubmF0aXZlKTtcblxuICAgICAgLy8gb25seSB3aGVuIHRoZSBjb21wb25lbnQgaGFzIGJlZW4gZGlzY292ZXJlZCB0aGVuIHVwZGF0ZSB0aGUgbW9ua2V5LXBhdGNoXG4gICAgICBpZiAoY29tcG9uZW50ICYmIGNvbnRleHQuY29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGV4dC5jb21wb25lbnQgPSBjb21wb25lbnQ7XG4gICAgICAgIGF0dGFjaFBhdGNoRGF0YShjb250ZXh0LmNvbXBvbmVudCwgY29udGV4dCk7XG4gICAgICB9XG5cbiAgICAgIC8vIG9ubHkgd2hlbiB0aGUgZGlyZWN0aXZlcyBoYXZlIGJlZW4gZGlzY292ZXJlZCB0aGVuIHVwZGF0ZSB0aGUgbW9ua2V5LXBhdGNoXG4gICAgICBpZiAoZGlyZWN0aXZlcyAmJiBkaXJlY3RpdmVJbmRpY2VzICYmIGNvbnRleHQuZGlyZWN0aXZlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRleHQuZGlyZWN0aXZlSW5kaWNlcyA9IGRpcmVjdGl2ZUluZGljZXM7XG4gICAgICAgIGNvbnRleHQuZGlyZWN0aXZlcyA9IGRpcmVjdGl2ZXM7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGF0dGFjaFBhdGNoRGF0YShkaXJlY3RpdmVzW2ldLCBjb250ZXh0KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBhdHRhY2hQYXRjaERhdGEoY29udGV4dC5uYXRpdmUsIGNvbnRleHQpO1xuICAgICAgbXBWYWx1ZSA9IGNvbnRleHQ7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHJFbGVtZW50ID0gdGFyZ2V0IGFzIFJFbGVtZW50O1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREb21FbGVtZW50KHJFbGVtZW50KTtcblxuICAgIC8vIGlmIHRoZSBjb250ZXh0IGlzIG5vdCBmb3VuZCB0aGVuIHdlIG5lZWQgdG8gdHJhdmVyc2UgdXB3YXJkcyB1cCB0aGUgRE9NXG4gICAgLy8gdG8gZmluZCB0aGUgbmVhcmVzdCBlbGVtZW50IHRoYXQgaGFzIGFscmVhZHkgYmVlbiBtb25rZXkgcGF0Y2hlZCB3aXRoIGRhdGFcbiAgICBsZXQgcGFyZW50ID0gckVsZW1lbnQgYXMgYW55O1xuICAgIHdoaWxlIChwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZSkge1xuICAgICAgY29uc3QgcGFyZW50Q29udGV4dCA9IHJlYWRQYXRjaGVkRGF0YShwYXJlbnQpO1xuICAgICAgaWYgKHBhcmVudENvbnRleHQpIHtcbiAgICAgICAgbGV0IGxWaWV3RGF0YTogTFZpZXdEYXRhfG51bGw7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHBhcmVudENvbnRleHQpKSB7XG4gICAgICAgICAgbFZpZXdEYXRhID0gcGFyZW50Q29udGV4dCBhcyBMVmlld0RhdGE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbFZpZXdEYXRhID0gcGFyZW50Q29udGV4dC5sVmlld0RhdGE7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0aGUgZWRnZSBvZiB0aGUgYXBwIHdhcyBhbHNvIHJlYWNoZWQgaGVyZSB0aHJvdWdoIGFub3RoZXIgbWVhbnNcbiAgICAgICAgLy8gKG1heWJlIGJlY2F1c2UgdGhlIERPTSB3YXMgY2hhbmdlZCBtYW51YWxseSkuXG4gICAgICAgIGlmICghbFZpZXdEYXRhKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpbmRleCA9IGZpbmRWaWFOYXRpdmVFbGVtZW50KGxWaWV3RGF0YSwgckVsZW1lbnQpO1xuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgIGNvbnN0IGxOb2RlID0gZ2V0TE5vZGVGcm9tVmlld0RhdGEobFZpZXdEYXRhLCBpbmRleCkgITtcbiAgICAgICAgICBjb25zdCBjb250ZXh0ID0gY3JlYXRlTENvbnRleHQobFZpZXdEYXRhLCBpbmRleCwgbE5vZGUubmF0aXZlKTtcbiAgICAgICAgICBhdHRhY2hQYXRjaERhdGEobE5vZGUubmF0aXZlLCBjb250ZXh0KTtcbiAgICAgICAgICBtcFZhbHVlID0gY29udGV4dDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gKG1wVmFsdWUgYXMgTENvbnRleHQpIHx8IG51bGw7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlbXB0eSBpbnN0YW5jZSBvZiBhIGBMQ29udGV4dGAgY29udGV4dFxuICovXG5mdW5jdGlvbiBjcmVhdGVMQ29udGV4dChsVmlld0RhdGE6IExWaWV3RGF0YSwgbE5vZGVJbmRleDogbnVtYmVyLCBuYXRpdmU6IFJFbGVtZW50KTogTENvbnRleHQge1xuICByZXR1cm4ge1xuICAgIGxWaWV3RGF0YSxcbiAgICBsTm9kZUluZGV4LFxuICAgIG5hdGl2ZSxcbiAgICBjb21wb25lbnQ6IHVuZGVmaW5lZCxcbiAgICBkaXJlY3RpdmVJbmRpY2VzOiB1bmRlZmluZWQsXG4gICAgZGlyZWN0aXZlczogdW5kZWZpbmVkLFxuICB9O1xufVxuXG4vKipcbiAqIEEgdXRpbGl0eSBmdW5jdGlvbiBmb3IgcmV0cmlldmluZyB0aGUgbWF0Y2hpbmcgbEVsZW1lbnROb2RlXG4gKiBmcm9tIGEgZ2l2ZW4gRE9NIGVsZW1lbnQsIGNvbXBvbmVudCBvciBkaXJlY3RpdmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMRWxlbWVudE5vZGUodGFyZ2V0OiBhbnkpOiBMRWxlbWVudE5vZGV8bnVsbCB7XG4gIGNvbnN0IGNvbnRleHQgPSBnZXRDb250ZXh0KHRhcmdldCk7XG4gIHJldHVybiBjb250ZXh0ID8gZ2V0TE5vZGVGcm9tVmlld0RhdGEoY29udGV4dC5sVmlld0RhdGEsIGNvbnRleHQubE5vZGVJbmRleCkgOiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TEVsZW1lbnRGcm9tUm9vdENvbXBvbmVudChyb290Q29tcG9uZW50SW5zdGFuY2U6IHt9KTogTEVsZW1lbnROb2RlfG51bGwge1xuICAvLyB0aGUgaG9zdCBlbGVtZW50IGZvciB0aGUgcm9vdCBjb21wb25lbnQgaXMgQUxXQVlTIHRoZSBmaXJzdCBlbGVtZW50XG4gIC8vIGluIHRoZSBsVmlld0RhdGEgYXJyYXkgKHdoaWNoIGlzIHdoZXJlIEhFQURFUl9PRkZTRVQgcG9pbnRzIHRvKVxuICBjb25zdCBsVmlld0RhdGEgPSByZWFkUGF0Y2hlZExWaWV3RGF0YShyb290Q29tcG9uZW50SW5zdGFuY2UpICE7XG4gIHJldHVybiByZWFkRWxlbWVudFZhbHVlKGxWaWV3RGF0YVtIRUFERVJfT0ZGU0VUXSk7XG59XG5cbi8qKlxuICogQSBzaW1wbGlmaWVkIGxvb2t1cCBmdW5jdGlvbiBmb3IgZmluZGluZyB0aGUgTEVsZW1lbnROb2RlIGZyb20gYSBjb21wb25lbnQgaW5zdGFuY2UuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBleGlzdHMgZm9yIHRyZWUtc2hha2luZyBwdXJwb3NlcyB0byBhdm9pZCBoYXZpbmcgdG8gcHVsbCBpbiBldmVyeXRoaW5nXG4gKiB0aGF0IGBnZXRDb250ZXh0YCBoYXMgaW4gdGhlIGV2ZW50IHRoYXQgYW4gQW5ndWxhciBhcHBsaWNhdGlvbiBkb2Vzbid0IG5lZWQgdG8gaGF2ZVxuICogYW55IHByb2dyYW1tYXRpYyBhY2Nlc3MgdG8gYW4gZWxlbWVudCdzIGNvbnRleHQgKG9ubHkgY2hhbmdlIGRldGVjdGlvbiB1c2VzIHRoaXMgZnVuY3Rpb24pLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TEVsZW1lbnRGcm9tQ29tcG9uZW50KGNvbXBvbmVudEluc3RhbmNlOiB7fSk6IExFbGVtZW50Tm9kZSB7XG4gIGxldCBsVmlld0RhdGEgPSByZWFkUGF0Y2hlZERhdGEoY29tcG9uZW50SW5zdGFuY2UpO1xuICBsZXQgbE5vZGU6IExFbGVtZW50Tm9kZTtcblxuICBpZiAoQXJyYXkuaXNBcnJheShsVmlld0RhdGEpKSB7XG4gICAgY29uc3QgbE5vZGVJbmRleCA9IGZpbmRWaWFDb21wb25lbnQobFZpZXdEYXRhLCBjb21wb25lbnRJbnN0YW5jZSk7XG4gICAgbE5vZGUgPSByZWFkRWxlbWVudFZhbHVlKGxWaWV3RGF0YVtsTm9kZUluZGV4XSk7XG4gICAgY29uc3QgY29udGV4dCA9IGNyZWF0ZUxDb250ZXh0KGxWaWV3RGF0YSwgbE5vZGVJbmRleCwgbE5vZGUubmF0aXZlKTtcbiAgICBjb250ZXh0LmNvbXBvbmVudCA9IGNvbXBvbmVudEluc3RhbmNlO1xuICAgIGF0dGFjaFBhdGNoRGF0YShjb21wb25lbnRJbnN0YW5jZSwgY29udGV4dCk7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKGNvbnRleHQubmF0aXZlLCBjb250ZXh0KTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBjb250ZXh0ID0gbFZpZXdEYXRhIGFzIGFueSBhcyBMQ29udGV4dDtcbiAgICBsTm9kZSA9IHJlYWRFbGVtZW50VmFsdWUoY29udGV4dC5sVmlld0RhdGFbY29udGV4dC5sTm9kZUluZGV4XSk7XG4gIH1cblxuICByZXR1cm4gbE5vZGU7XG59XG5cbi8qKlxuICogQXNzaWducyB0aGUgZ2l2ZW4gZGF0YSB0byB0aGUgZ2l2ZW4gdGFyZ2V0ICh3aGljaCBjb3VsZCBiZSBhIGNvbXBvbmVudCxcbiAqIGRpcmVjdGl2ZSBvciBET00gbm9kZSBpbnN0YW5jZSkgdXNpbmcgbW9ua2V5LXBhdGNoaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoUGF0Y2hEYXRhKHRhcmdldDogYW55LCBkYXRhOiBMVmlld0RhdGEgfCBMQ29udGV4dCkge1xuICB0YXJnZXRbTU9OS0VZX1BBVENIX0tFWV9OQU1FXSA9IGRhdGE7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbW9ua2V5LXBhdGNoIHZhbHVlIGRhdGEgcHJlc2VudCBvbiB0aGUgdGFyZ2V0ICh3aGljaCBjb3VsZCBiZVxuICogYSBjb21wb25lbnQsIGRpcmVjdGl2ZSBvciBhIERPTSBub2RlKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRQYXRjaGVkRGF0YSh0YXJnZXQ6IGFueSk6IExWaWV3RGF0YXxMQ29udGV4dHxudWxsIHtcbiAgcmV0dXJuIHRhcmdldFtNT05LRVlfUEFUQ0hfS0VZX05BTUVdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZFBhdGNoZWRMVmlld0RhdGEodGFyZ2V0OiBhbnkpOiBMVmlld0RhdGF8bnVsbCB7XG4gIGNvbnN0IHZhbHVlID0gcmVhZFBhdGNoZWREYXRhKHRhcmdldCk7XG4gIGlmICh2YWx1ZSkge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlIDogKHZhbHVlIGFzIExDb250ZXh0KS5sVmlld0RhdGE7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbXBvbmVudEluc3RhbmNlKGluc3RhbmNlOiBhbnkpOiBib29sZWFuIHtcbiAgcmV0dXJuIGluc3RhbmNlICYmIGluc3RhbmNlLmNvbnN0cnVjdG9yICYmIGluc3RhbmNlLmNvbnN0cnVjdG9yLm5nQ29tcG9uZW50RGVmO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNEaXJlY3RpdmVJbnN0YW5jZShpbnN0YW5jZTogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiBpbnN0YW5jZSAmJiBpbnN0YW5jZS5jb25zdHJ1Y3RvciAmJiBpbnN0YW5jZS5jb25zdHJ1Y3Rvci5uZ0RpcmVjdGl2ZURlZjtcbn1cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBlbGVtZW50IHdpdGhpbiB0aGUgZ2l2ZW4gTFZpZXdEYXRhIGFuZCByZXR1cm5zIHRoZSBtYXRjaGluZyBpbmRleFxuICovXG5mdW5jdGlvbiBmaW5kVmlhTmF0aXZlRWxlbWVudChsVmlld0RhdGE6IExWaWV3RGF0YSwgbmF0aXZlOiBSRWxlbWVudCk6IG51bWJlciB7XG4gIGxldCB0Tm9kZSA9IGxWaWV3RGF0YVtUVklFV10uZmlyc3RDaGlsZDtcbiAgd2hpbGUgKHROb2RlKSB7XG4gICAgY29uc3QgbE5vZGUgPSBnZXRMTm9kZUZyb21WaWV3RGF0YShsVmlld0RhdGEsIHROb2RlLmluZGV4KSAhO1xuICAgIGlmIChsTm9kZS5uYXRpdmUgPT09IG5hdGl2ZSkge1xuICAgICAgcmV0dXJuIHROb2RlLmluZGV4O1xuICAgIH1cbiAgICB0Tm9kZSA9IHRyYXZlcnNlTmV4dEVsZW1lbnQodE5vZGUpO1xuICB9XG5cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIG5leHQgdE5vZGUgKGNoaWxkLCBzaWJsaW5nIG9yIHBhcmVudCkuXG4gKi9cbmZ1bmN0aW9uIHRyYXZlcnNlTmV4dEVsZW1lbnQodE5vZGU6IFROb2RlKTogVE5vZGV8bnVsbCB7XG4gIGlmICh0Tm9kZS5jaGlsZCkge1xuICAgIHJldHVybiB0Tm9kZS5jaGlsZDtcbiAgfSBlbHNlIGlmICh0Tm9kZS5uZXh0KSB7XG4gICAgcmV0dXJuIHROb2RlLm5leHQ7XG4gIH0gZWxzZSBpZiAodE5vZGUucGFyZW50KSB7XG4gICAgcmV0dXJuIHROb2RlLnBhcmVudC5uZXh0IHx8IG51bGw7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogTG9jYXRlcyB0aGUgY29tcG9uZW50IHdpdGhpbiB0aGUgZ2l2ZW4gTFZpZXdEYXRhIGFuZCByZXR1cm5zIHRoZSBtYXRjaGluZyBpbmRleFxuICovXG5mdW5jdGlvbiBmaW5kVmlhQ29tcG9uZW50KGxWaWV3RGF0YTogTFZpZXdEYXRhLCBjb21wb25lbnRJbnN0YW5jZToge30pOiBudW1iZXIge1xuICBjb25zdCBjb21wb25lbnRJbmRpY2VzID0gbFZpZXdEYXRhW1RWSUVXXS5jb21wb25lbnRzO1xuICBpZiAoY29tcG9uZW50SW5kaWNlcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50SW5kaWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZWxlbWVudENvbXBvbmVudEluZGV4ID0gY29tcG9uZW50SW5kaWNlc1tpXTtcbiAgICAgIGNvbnN0IGxOb2RlRGF0YSA9IHJlYWRFbGVtZW50VmFsdWUobFZpZXdEYXRhW2VsZW1lbnRDb21wb25lbnRJbmRleF0gISkuZGF0YSAhO1xuICAgICAgaWYgKGxOb2RlRGF0YVtDT05URVhUXSA9PT0gY29tcG9uZW50SW5zdGFuY2UpIHtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnRDb21wb25lbnRJbmRleDtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qgcm9vdE5vZGUgPSBsVmlld0RhdGFbSEVBREVSX09GRlNFVF07XG4gICAgY29uc3Qgcm9vdENvbXBvbmVudCA9IHJvb3ROb2RlLmRhdGFbQ09OVEVYVF07XG4gICAgaWYgKHJvb3RDb21wb25lbnQgPT09IGNvbXBvbmVudEluc3RhbmNlKSB7XG4gICAgICAvLyB3ZSBhcmUgZGVhbGluZyB3aXRoIHRoZSByb290IGVsZW1lbnQgaGVyZSB0aGVyZWZvcmUgd2Uga25vdyB0aGF0IHRoZVxuICAgICAgLy8gZWxlbWVudCBpcyB0aGUgdmVyeSBmaXJzdCBlbGVtZW50IGFmdGVyIHRoZSBIRUFERVIgZGF0YSBpbiB0aGUgbFZpZXdcbiAgICAgIHJldHVybiBIRUFERVJfT0ZGU0VUO1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuICogTG9jYXRlcyB0aGUgZGlyZWN0aXZlIHdpdGhpbiB0aGUgZ2l2ZW4gTFZpZXdEYXRhIGFuZCByZXR1cm5zIHRoZSBtYXRjaGluZyBpbmRleFxuICovXG5mdW5jdGlvbiBmaW5kVmlhRGlyZWN0aXZlKGxWaWV3RGF0YTogTFZpZXdEYXRhLCBkaXJlY3RpdmVJbnN0YW5jZToge30pOiBudW1iZXIge1xuICAvLyBpZiBhIGRpcmVjdGl2ZSBpcyBtb25rZXkgcGF0Y2hlZCB0aGVuIGl0IHdpbGwgKGJ5IGRlZmF1bHQpXG4gIC8vIGhhdmUgYSByZWZlcmVuY2UgdG8gdGhlIExWaWV3RGF0YSBvZiB0aGUgY3VycmVudCB2aWV3LiBUaGVcbiAgLy8gZWxlbWVudCBib3VuZCB0byB0aGUgZGlyZWN0aXZlIGJlaW5nIHNlYXJjaCBsaXZlcyBzb21ld2hlcmVcbiAgLy8gaW4gdGhlIHZpZXcgZGF0YS4gQnkgZmlyc3QgY2hlY2tpbmcgdG8gc2VlIGlmIHRoZSBpbnN0YW5jZVxuICAvLyBpcyBhY3R1YWxseSBwcmVzZW50IHdlIGNhbiBuYXJyb3cgZG93biB0byB3aGljaCBsRWxlbWVudE5vZGVcbiAgLy8gY29udGFpbnMgdGhlIGluc3RhbmNlIG9mIHRoZSBkaXJlY3RpdmUgYW5kIHRoZW4gcmV0dXJuIHRoZSBpbmRleFxuICBjb25zdCBkaXJlY3RpdmVzQWNyb3NzVmlldyA9IGxWaWV3RGF0YVtESVJFQ1RJVkVTXTtcbiAgY29uc3QgZGlyZWN0aXZlSW5kZXggPVxuICAgICAgZGlyZWN0aXZlc0Fjcm9zc1ZpZXcgPyBkaXJlY3RpdmVzQWNyb3NzVmlldy5pbmRleE9mKGRpcmVjdGl2ZUluc3RhbmNlKSA6IC0xO1xuICBpZiAoZGlyZWN0aXZlSW5kZXggPj0gMCkge1xuICAgIGxldCB0Tm9kZSA9IGxWaWV3RGF0YVtUVklFV10uZmlyc3RDaGlsZDtcbiAgICB3aGlsZSAodE5vZGUpIHtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4U3RhcnQgPSBnZXREaXJlY3RpdmVTdGFydEluZGV4KHROb2RlKTtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4RW5kID0gZ2V0RGlyZWN0aXZlRW5kSW5kZXgodE5vZGUsIGRpcmVjdGl2ZUluZGV4U3RhcnQpO1xuICAgICAgaWYgKGRpcmVjdGl2ZUluZGV4ID49IGRpcmVjdGl2ZUluZGV4U3RhcnQgJiYgZGlyZWN0aXZlSW5kZXggPCBkaXJlY3RpdmVJbmRleEVuZCkge1xuICAgICAgICByZXR1cm4gdE5vZGUuaW5kZXg7XG4gICAgICB9XG4gICAgICB0Tm9kZSA9IHRyYXZlcnNlTmV4dEVsZW1lbnQodE5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAtMTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0RG9tRWxlbWVudChlbGVtZW50OiBhbnkpIHtcbiAgYXNzZXJ0RXF1YWwoZWxlbWVudC5ub2RlVHlwZSwgMSwgJ1RoZSBwcm92aWRlZCB2YWx1ZSBtdXN0IGJlIGFuIGluc3RhbmNlIG9mIGFuIEhUTUxFbGVtZW50Jyk7XG59XG5cbi8qKlxuICogUmV0cnVucyB0aGUgaW5zdGFuY2Ugb2YgdGhlIExFbGVtZW50Tm9kZSBhdCB0aGUgZ2l2ZW4gaW5kZXggaW4gdGhlIExWaWV3RGF0YS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgYWxzbyB1bndyYXAgdGhlIGlubmVyIHZhbHVlIGluY2FzZSBpdCdzIHN0dWZmZWQgaW50byBhblxuICogYXJyYXkgKHdoaWNoIGlzIHdoYXQgaGFwcGVucyB3aGVuIFtzdHlsZV0gYW5kIFtjbGFzc10gYmluZGluZ3MgYXJlIHByZXNlbnRcbiAqIGluIHRoZSB2aWV3IGluc3RydWN0aW9ucyBmb3IgdGhlIGVsZW1lbnQgYmVpbmcgcmV0dXJuZWQpLlxuICovXG5mdW5jdGlvbiBnZXRMTm9kZUZyb21WaWV3RGF0YShsVmlld0RhdGE6IExWaWV3RGF0YSwgbEVsZW1lbnRJbmRleDogbnVtYmVyKTogTEVsZW1lbnROb2RlfG51bGwge1xuICBjb25zdCB2YWx1ZSA9IGxWaWV3RGF0YVtsRWxlbWVudEluZGV4XTtcbiAgcmV0dXJuIHZhbHVlID8gcmVhZEVsZW1lbnRWYWx1ZSh2YWx1ZSkgOiBudWxsO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBjb2xsZWN0aW9uIG9mIGRpcmVjdGl2ZSBpbmRleCB2YWx1ZXMgdGhhdCBhcmUgdXNlZCBvbiB0aGUgZWxlbWVudFxuICogKHdoaWNoIGlzIHJlZmVyZW5jZWQgYnkgdGhlIGxOb2RlSW5kZXgpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXNjb3ZlckRpcmVjdGl2ZUluZGljZXMoXG4gICAgbFZpZXdEYXRhOiBMVmlld0RhdGEsIGxOb2RlSW5kZXg6IG51bWJlciwgaW5jbHVkZUNvbXBvbmVudHM/OiBib29sZWFuKTogbnVtYmVyW118bnVsbCB7XG4gIGNvbnN0IGRpcmVjdGl2ZXNBY3Jvc3NWaWV3ID0gbFZpZXdEYXRhW0RJUkVDVElWRVNdO1xuICBjb25zdCB0Tm9kZSA9IGxWaWV3RGF0YVtUVklFV10uZGF0YVtsTm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgaWYgKGRpcmVjdGl2ZXNBY3Jvc3NWaWV3ICYmIGRpcmVjdGl2ZXNBY3Jvc3NWaWV3Lmxlbmd0aCkge1xuICAgIC8vIHRoaXMgY2hlY2sgZm9yIHROb2RlIGlzIHRvIGRldGVybWluZSBpZiB0aGUgdmFsdWUgaXMgYSBMRWxlbWVudE5vZGUgaW5zdGFuY2VcbiAgICBjb25zdCBkaXJlY3RpdmVJbmRleFN0YXJ0ID0gZ2V0RGlyZWN0aXZlU3RhcnRJbmRleCh0Tm9kZSk7XG4gICAgY29uc3QgZGlyZWN0aXZlSW5kZXhFbmQgPSBnZXREaXJlY3RpdmVFbmRJbmRleCh0Tm9kZSwgZGlyZWN0aXZlSW5kZXhTdGFydCk7XG4gICAgY29uc3QgZGlyZWN0aXZlSW5kaWNlczogbnVtYmVyW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gZGlyZWN0aXZlSW5kZXhTdGFydDsgaSA8IGRpcmVjdGl2ZUluZGV4RW5kOyBpKyspIHtcbiAgICAgIC8vIHNwZWNpYWwgY2FzZSBzaW5jZSB0aGUgaW5zdGFuY2Ugb2YgdGhlIGNvbXBvbmVudCAoaWYgaXQgZXhpc3RzKVxuICAgICAgLy8gaXMgc3RvcmVkIGluIHRoZSBkaXJlY3RpdmVzIGFycmF5LlxuICAgICAgaWYgKGkgPiBkaXJlY3RpdmVJbmRleFN0YXJ0IHx8XG4gICAgICAgICAgIWlzQ29tcG9uZW50SW5zdGFuY2UoZGlyZWN0aXZlc0Fjcm9zc1ZpZXdbZGlyZWN0aXZlSW5kZXhTdGFydF0pKSB7XG4gICAgICAgIGRpcmVjdGl2ZUluZGljZXMucHVzaChpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRpcmVjdGl2ZUluZGljZXMubGVuZ3RoID8gZGlyZWN0aXZlSW5kaWNlcyA6IG51bGw7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIGxpc3Qgb2YgZGlyZWN0aXZlcyBleHRyYWN0ZWQgZnJvbSB0aGUgZ2l2ZW4gdmlldyBiYXNlZCBvbiB0aGVcbiAqIHByb3ZpZGVkIGxpc3Qgb2YgZGlyZWN0aXZlIGluZGV4IHZhbHVlcy5cbiAqXG4gKiBAcGFyYW0gbFZpZXdEYXRhIFRoZSB0YXJnZXQgdmlldyBkYXRhXG4gKiBAcGFyYW0gaW5kaWNlcyBBIGNvbGxlY3Rpb24gb2YgZGlyZWN0aXZlIGluZGV4IHZhbHVlcyB3aGljaCB3aWxsIGJlIHVzZWQgdG9cbiAqICAgIGZpZ3VyZSBvdXQgdGhlIGRpcmVjdGl2ZSBpbnN0YW5jZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpc2NvdmVyRGlyZWN0aXZlcyhsVmlld0RhdGE6IExWaWV3RGF0YSwgaW5kaWNlczogbnVtYmVyW10pOiBudW1iZXJbXXxudWxsIHtcbiAgY29uc3QgZGlyZWN0aXZlczogYW55W10gPSBbXTtcbiAgY29uc3QgZGlyZWN0aXZlSW5zdGFuY2VzID0gbFZpZXdEYXRhW0RJUkVDVElWRVNdO1xuICBpZiAoZGlyZWN0aXZlSW5zdGFuY2VzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbmRpY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGluZGljZXNbaV07XG4gICAgICBjb25zdCBkaXJlY3RpdmUgPSBkaXJlY3RpdmVJbnN0YW5jZXNbZGlyZWN0aXZlSW5kZXhdO1xuICAgICAgZGlyZWN0aXZlcy5wdXNoKGRpcmVjdGl2ZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBkaXJlY3RpdmVzO1xufVxuXG5mdW5jdGlvbiBnZXREaXJlY3RpdmVTdGFydEluZGV4KHROb2RlOiBUTm9kZSk6IG51bWJlciB7XG4gIC8vIHRoZSB0Tm9kZSBpbnN0YW5jZXMgc3RvcmUgYSBmbGFnIHZhbHVlIHdoaWNoIHRoZW4gaGFzIGFcbiAgLy8gcG9pbnRlciB3aGljaCB0ZWxscyB0aGUgc3RhcnRpbmcgaW5kZXggb2Ygd2hlcmUgYWxsIHRoZVxuICAvLyBhY3RpdmUgZGlyZWN0aXZlcyBhcmUgaW4gdGhlIG1hc3RlciBkaXJlY3RpdmUgYXJyYXlcbiAgcmV0dXJuIHROb2RlLmZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xufVxuXG5mdW5jdGlvbiBnZXREaXJlY3RpdmVFbmRJbmRleCh0Tm9kZTogVE5vZGUsIHN0YXJ0SW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIC8vIFRoZSBlbmQgdmFsdWUgaXMgYWxzbyBhIHBhcnQgb2YgdGhlIHNhbWUgZmxhZ1xuICAvLyAoc2VlIGBUTm9kZUZsYWdzYCB0byBzZWUgaG93IHRoZSBmbGFnIGJpdCBzaGlmdGluZ1xuICAvLyB2YWx1ZXMgYXJlIHVzZWQpLlxuICBjb25zdCBjb3VudCA9IHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2s7XG4gIHJldHVybiBjb3VudCA/IChzdGFydEluZGV4ICsgY291bnQpIDogLTE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkRWxlbWVudFZhbHVlKHZhbHVlOiBMRWxlbWVudE5vZGUgfCBhbnlbXSk6IExFbGVtZW50Tm9kZSB7XG4gIHJldHVybiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyAodmFsdWUgYXMgYW55IGFzIGFueVtdKVswXSA6IHZhbHVlKSBhcyBMRWxlbWVudE5vZGU7XG59XG4iXX0=