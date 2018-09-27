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
 * The component's parent view data.
 * @type {?}
 */
LContext.prototype.lViewData;
/**
 * The index instance of the LNode.
 * @type {?}
 */
LContext.prototype.lNodeIndex;
/**
 * The instance of the DOM node that is attached to the lNode.
 * @type {?}
 */
LContext.prototype.native;
/**
 * The instance of the Component node.
 * @type {?}
 */
LContext.prototype.component;
/**
 * The list of indices for the active directives that exist on this element.
 * @type {?}
 */
LContext.prototype.directiveIndices;
/**
 * The list of active directives that exist on this element.
 * @type {?}
 */
LContext.prototype.directives;
/**
 * The map of local references (local reference name => element or directive instance) that exist
 * on this element.
 * @type {?}
 */
LContext.prototype.localRefs;
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
        localRefs: undefined,
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
 * Returns a map of local references (local reference name => element or directive instance) that
 * exist on a given element.
 * @param {?} lViewData
 * @param {?} lNodeIndex
 * @return {?}
 */
export function discoverLocalRefs(lViewData, lNodeIndex) {
    /** @type {?} */
    const tNode = /** @type {?} */ (lViewData[TVIEW].data[lNodeIndex]);
    if (tNode && tNode.localNames) {
        /** @type {?} */
        const result = {};
        for (let i = 0; i < tNode.localNames.length; i += 2) {
            /** @type {?} */
            const localRefName = tNode.localNames[i];
            /** @type {?} */
            const directiveIndex = /** @type {?} */ (tNode.localNames[i + 1]);
            result[localRefName] = directiveIndex === -1 ? /** @type {?} */ ((getLNodeFromViewData(lViewData, lNodeIndex))).native : /** @type {?} */ ((lViewData[DIRECTIVES]))[directiveIndex];
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9kaXNjb3ZlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2NvbnRleHRfZGlzY292ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFPQSxPQUFPLGVBQWUsQ0FBQztBQUV2QixPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBR3JDLE9BQU8sRUFBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLGFBQWEsRUFBYSxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQzs7OztBQUt2RixhQUFhLHFCQUFxQixHQUFHLGVBQWUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUVyRCxNQUFNLFVBQVUsVUFBVSxDQUFDLE1BQVc7O0lBQ3BDLElBQUksT0FBTyxHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN0QyxJQUFJLE9BQU8sRUFBRTs7O1FBR1gsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFOztZQUMxQixNQUFNLFNBQVMsc0JBQWMsT0FBTyxHQUFHOztZQUN2QyxJQUFJLFVBQVUsQ0FBUzs7WUFDdkIsSUFBSSxTQUFTLEdBQVEsU0FBUyxDQUFDOztZQUMvQixJQUFJLGdCQUFnQixHQUE0QixTQUFTLENBQUM7O1lBQzFELElBQUksVUFBVSxHQUF5QixTQUFTLENBQUM7WUFFakQsSUFBSSxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDL0IsVUFBVSxHQUFHLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDakQsSUFBSSxVQUFVLElBQUksQ0FBQyxDQUFDLEVBQUU7b0JBQ3BCLE1BQU0sSUFBSSxLQUFLLENBQUMseURBQXlELENBQUMsQ0FBQztpQkFDNUU7Z0JBQ0QsU0FBUyxH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QUMsQ0FBQyxDQUFDO0NBQzFDOzs7OztBQUVELE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxLQUEyQjtJQUMxRCx5QkFBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLG9CQUFDLEtBQVksR0FBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQWlCLEVBQUM7Q0FDcEYiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgJy4vbmdfZGV2X21vZGUnO1xuXG5pbXBvcnQge2Fzc2VydEVxdWFsfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge0xFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0NPTlRFWFQsIERJUkVDVElWRVMsIEhFQURFUl9PRkZTRVQsIExWaWV3RGF0YSwgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcblxuLyoqXG4gKiBUaGlzIHByb3BlcnR5IHdpbGwgYmUgbW9ua2V5LXBhdGNoZWQgb24gZWxlbWVudHMsIGNvbXBvbmVudHMgYW5kIGRpcmVjdGl2ZXNcbiAqL1xuZXhwb3J0IGNvbnN0IE1PTktFWV9QQVRDSF9LRVlfTkFNRSA9ICdfX25nQ29udGV4dF9fJztcblxuLyoqXG4gKiBUaGUgaW50ZXJuYWwgdmlldyBjb250ZXh0IHdoaWNoIGlzIHNwZWNpZmljIHRvIGEgZ2l2ZW4gRE9NIGVsZW1lbnQsIGRpcmVjdGl2ZSBvclxuICogY29tcG9uZW50IGluc3RhbmNlLiBFYWNoIHZhbHVlIGluIGhlcmUgKGJlc2lkZXMgdGhlIExWaWV3RGF0YSBhbmQgZWxlbWVudCBub2RlIGRldGFpbHMpXG4gKiBjYW4gYmUgcHJlc2VudCwgbnVsbCBvciB1bmRlZmluZWQuIElmIHVuZGVmaW5lZCB0aGVuIGl0IGltcGxpZXMgdGhlIHZhbHVlIGhhcyBub3QgYmVlblxuICogbG9va2VkIHVwIHlldCwgb3RoZXJ3aXNlLCBpZiBudWxsLCB0aGVuIGEgbG9va3VwIHdhcyBleGVjdXRlZCBhbmQgbm90aGluZyB3YXMgZm91bmQuXG4gKlxuICogRWFjaCB2YWx1ZSB3aWxsIGdldCBmaWxsZWQgd2hlbiB0aGUgcmVzcGVjdGl2ZSB2YWx1ZSBpcyBleGFtaW5lZCB3aXRoaW4gdGhlIGdldENvbnRleHRcbiAqIGZ1bmN0aW9uLiBUaGUgY29tcG9uZW50LCBlbGVtZW50IGFuZCBlYWNoIGRpcmVjdGl2ZSBpbnN0YW5jZSB3aWxsIHNoYXJlIHRoZSBzYW1lIGluc3RhbmNlXG4gKiBvZiB0aGUgY29udGV4dC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBMQ29udGV4dCB7XG4gIC8qKlxuICAgKiBUaGUgY29tcG9uZW50J3MgcGFyZW50IHZpZXcgZGF0YS5cbiAgICovXG4gIGxWaWV3RGF0YTogTFZpZXdEYXRhO1xuXG4gIC8qKlxuICAgKiBUaGUgaW5kZXggaW5zdGFuY2Ugb2YgdGhlIExOb2RlLlxuICAgKi9cbiAgbE5vZGVJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgaW5zdGFuY2Ugb2YgdGhlIERPTSBub2RlIHRoYXQgaXMgYXR0YWNoZWQgdG8gdGhlIGxOb2RlLlxuICAgKi9cbiAgbmF0aXZlOiBSRWxlbWVudDtcblxuICAvKipcbiAgICogVGhlIGluc3RhbmNlIG9mIHRoZSBDb21wb25lbnQgbm9kZS5cbiAgICovXG4gIGNvbXBvbmVudDoge318bnVsbHx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFRoZSBsaXN0IG9mIGluZGljZXMgZm9yIHRoZSBhY3RpdmUgZGlyZWN0aXZlcyB0aGF0IGV4aXN0IG9uIHRoaXMgZWxlbWVudC5cbiAgICovXG4gIGRpcmVjdGl2ZUluZGljZXM6IG51bWJlcltdfG51bGx8dW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBUaGUgbGlzdCBvZiBhY3RpdmUgZGlyZWN0aXZlcyB0aGF0IGV4aXN0IG9uIHRoaXMgZWxlbWVudC5cbiAgICovXG4gIGRpcmVjdGl2ZXM6IGFueVtdfG51bGx8dW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBUaGUgbWFwIG9mIGxvY2FsIHJlZmVyZW5jZXMgKGxvY2FsIHJlZmVyZW5jZSBuYW1lID0+IGVsZW1lbnQgb3IgZGlyZWN0aXZlIGluc3RhbmNlKSB0aGF0IGV4aXN0XG4gICAqIG9uIHRoaXMgZWxlbWVudC5cbiAgICovXG4gIGxvY2FsUmVmczoge1trZXk6IHN0cmluZ106IGFueX18bnVsbHx1bmRlZmluZWQ7XG59XG5cbi8qKiBSZXR1cm5zIHRoZSBtYXRjaGluZyBgTENvbnRleHRgIGRhdGEgZm9yIGEgZ2l2ZW4gRE9NIG5vZGUsIGRpcmVjdGl2ZSBvciBjb21wb25lbnQgaW5zdGFuY2UuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGV4YW1pbmUgdGhlIHByb3ZpZGVkIERPTSBlbGVtZW50LCBjb21wb25lbnQsIG9yIGRpcmVjdGl2ZSBpbnN0YW5jZVxcJ3NcbiAqIG1vbmtleS1wYXRjaGVkIHByb3BlcnR5IHRvIGRlcml2ZSB0aGUgYExDb250ZXh0YCBkYXRhLiBPbmNlIGNhbGxlZCB0aGVuIHRoZSBtb25rZXktcGF0Y2hlZFxuICogdmFsdWUgd2lsbCBiZSB0aGF0IG9mIHRoZSBuZXdseSBjcmVhdGVkIGBMQ29udGV4dGAuXG4gKlxuICogSWYgdGhlIG1vbmtleS1wYXRjaGVkIHZhbHVlIGlzIHRoZSBgTFZpZXdEYXRhYCBpbnN0YW5jZSB0aGVuIHRoZSBjb250ZXh0IHZhbHVlIGZvciB0aGF0XG4gKiB0YXJnZXQgd2lsbCBiZSBjcmVhdGVkIGFuZCB0aGUgbW9ua2V5LXBhdGNoIHJlZmVyZW5jZSB3aWxsIGJlIHVwZGF0ZWQuIFRoZXJlZm9yZSB3aGVuIHRoaXNcbiAqIGZ1bmN0aW9uIGlzIGNhbGxlZCBpdCBtYXkgbXV0YXRlIHRoZSBwcm92aWRlZCBlbGVtZW50XFwncywgY29tcG9uZW50XFwncyBvciBhbnkgb2YgdGhlIGFzc29jaWF0ZWRcbiAqIGRpcmVjdGl2ZVxcJ3MgbW9ua2V5LXBhdGNoIHZhbHVlcy5cbiAqXG4gKiBJZiB0aGUgbW9ua2V5LXBhdGNoIHZhbHVlIGlzIG5vdCBkZXRlY3RlZCB0aGVuIHRoZSBjb2RlIHdpbGwgd2FsayB1cCB0aGUgRE9NIHVudGlsIGFuIGVsZW1lbnRcbiAqIGlzIGZvdW5kIHdoaWNoIGNvbnRhaW5zIGEgbW9ua2V5LXBhdGNoIHJlZmVyZW5jZS4gV2hlbiB0aGF0IG9jY3VycyB0aGVuIHRoZSBwcm92aWRlZCBlbGVtZW50XG4gKiB3aWxsIGJlIHVwZGF0ZWQgd2l0aCBhIG5ldyBjb250ZXh0ICh3aGljaCBpcyB0aGVuIHJldHVybmVkKS4gSWYgdGhlIG1vbmtleS1wYXRjaCB2YWx1ZSBpcyBub3RcbiAqIGRldGVjdGVkIGZvciBhIGNvbXBvbmVudC9kaXJlY3RpdmUgaW5zdGFuY2UgdGhlbiBpdCB3aWxsIHRocm93IGFuIGVycm9yIChhbGwgY29tcG9uZW50cyBhbmRcbiAqIGRpcmVjdGl2ZXMgc2hvdWxkIGJlIGF1dG9tYXRpY2FsbHkgbW9ua2V5LXBhdGNoZWQgYnkgaXZ5KS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbnRleHQodGFyZ2V0OiBhbnkpOiBMQ29udGV4dHxudWxsIHtcbiAgbGV0IG1wVmFsdWUgPSByZWFkUGF0Y2hlZERhdGEodGFyZ2V0KTtcbiAgaWYgKG1wVmFsdWUpIHtcbiAgICAvLyBvbmx5IHdoZW4gaXQncyBhbiBhcnJheSBpcyBpdCBjb25zaWRlcmVkIGFuIExWaWV3RGF0YSBpbnN0YW5jZVxuICAgIC8vIC4uLiBvdGhlcndpc2UgaXQncyBhbiBhbHJlYWR5IGNvbnN0cnVjdGVkIExDb250ZXh0IGluc3RhbmNlXG4gICAgaWYgKEFycmF5LmlzQXJyYXkobXBWYWx1ZSkpIHtcbiAgICAgIGNvbnN0IGxWaWV3RGF0YTogTFZpZXdEYXRhID0gbXBWYWx1ZSAhO1xuICAgICAgbGV0IGxOb2RlSW5kZXg6IG51bWJlcjtcbiAgICAgIGxldCBjb21wb25lbnQ6IGFueSA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCBkaXJlY3RpdmVJbmRpY2VzOiBudW1iZXJbXXxudWxsfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCBkaXJlY3RpdmVzOiBhbnlbXXxudWxsfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAgICAgaWYgKGlzQ29tcG9uZW50SW5zdGFuY2UodGFyZ2V0KSkge1xuICAgICAgICBsTm9kZUluZGV4ID0gZmluZFZpYUNvbXBvbmVudChsVmlld0RhdGEsIHRhcmdldCk7XG4gICAgICAgIGlmIChsTm9kZUluZGV4ID09IC0xKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgcHJvdmlkZWQgY29tcG9uZW50IHdhcyBub3QgZm91bmQgaW4gdGhlIGFwcGxpY2F0aW9uJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29tcG9uZW50ID0gdGFyZ2V0O1xuICAgICAgfSBlbHNlIGlmIChpc0RpcmVjdGl2ZUluc3RhbmNlKHRhcmdldCkpIHtcbiAgICAgICAgbE5vZGVJbmRleCA9IGZpbmRWaWFEaXJlY3RpdmUobFZpZXdEYXRhLCB0YXJnZXQpO1xuICAgICAgICBpZiAobE5vZGVJbmRleCA9PSAtMSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHByb3ZpZGVkIGRpcmVjdGl2ZSB3YXMgbm90IGZvdW5kIGluIHRoZSBhcHBsaWNhdGlvbicpO1xuICAgICAgICB9XG4gICAgICAgIGRpcmVjdGl2ZUluZGljZXMgPSBkaXNjb3ZlckRpcmVjdGl2ZUluZGljZXMobFZpZXdEYXRhLCBsTm9kZUluZGV4KTtcbiAgICAgICAgZGlyZWN0aXZlcyA9IGRpcmVjdGl2ZUluZGljZXMgPyBkaXNjb3ZlckRpcmVjdGl2ZXMobFZpZXdEYXRhLCBkaXJlY3RpdmVJbmRpY2VzKSA6IG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsTm9kZUluZGV4ID0gZmluZFZpYU5hdGl2ZUVsZW1lbnQobFZpZXdEYXRhLCB0YXJnZXQgYXMgUkVsZW1lbnQpO1xuICAgICAgICBpZiAobE5vZGVJbmRleCA9PSAtMSkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIHRoZSBnb2FsIGlzIG5vdCB0byBmaWxsIHRoZSBlbnRpcmUgY29udGV4dCBmdWxsIG9mIGRhdGEgYmVjYXVzZSB0aGUgbG9va3Vwc1xuICAgICAgLy8gYXJlIGV4cGVuc2l2ZS4gSW5zdGVhZCwgb25seSB0aGUgdGFyZ2V0IGRhdGEgKHRoZSBlbGVtZW50LCBjb21wb250ZW50IG9yXG4gICAgICAvLyBkaXJlY3RpdmUgZGV0YWlscykgYXJlIGZpbGxlZCBpbnRvIHRoZSBjb250ZXh0LiBJZiBjYWxsZWQgbXVsdGlwbGUgdGltZXNcbiAgICAgIC8vIHdpdGggZGlmZmVyZW50IHRhcmdldCB2YWx1ZXMgdGhlbiB0aGUgbWlzc2luZyB0YXJnZXQgZGF0YSB3aWxsIGJlIGZpbGxlZCBpbi5cbiAgICAgIGNvbnN0IGxOb2RlID0gZ2V0TE5vZGVGcm9tVmlld0RhdGEobFZpZXdEYXRhLCBsTm9kZUluZGV4KSAhO1xuICAgICAgY29uc3QgZXhpc3RpbmdDdHggPSByZWFkUGF0Y2hlZERhdGEobE5vZGUubmF0aXZlKTtcbiAgICAgIGNvbnN0IGNvbnRleHQ6IExDb250ZXh0ID0gKGV4aXN0aW5nQ3R4ICYmICFBcnJheS5pc0FycmF5KGV4aXN0aW5nQ3R4KSkgP1xuICAgICAgICAgIGV4aXN0aW5nQ3R4IDpcbiAgICAgICAgICBjcmVhdGVMQ29udGV4dChsVmlld0RhdGEsIGxOb2RlSW5kZXgsIGxOb2RlLm5hdGl2ZSk7XG5cbiAgICAgIC8vIG9ubHkgd2hlbiB0aGUgY29tcG9uZW50IGhhcyBiZWVuIGRpc2NvdmVyZWQgdGhlbiB1cGRhdGUgdGhlIG1vbmtleS1wYXRjaFxuICAgICAgaWYgKGNvbXBvbmVudCAmJiBjb250ZXh0LmNvbXBvbmVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRleHQuY29tcG9uZW50ID0gY29tcG9uZW50O1xuICAgICAgICBhdHRhY2hQYXRjaERhdGEoY29udGV4dC5jb21wb25lbnQsIGNvbnRleHQpO1xuICAgICAgfVxuXG4gICAgICAvLyBvbmx5IHdoZW4gdGhlIGRpcmVjdGl2ZXMgaGF2ZSBiZWVuIGRpc2NvdmVyZWQgdGhlbiB1cGRhdGUgdGhlIG1vbmtleS1wYXRjaFxuICAgICAgaWYgKGRpcmVjdGl2ZXMgJiYgZGlyZWN0aXZlSW5kaWNlcyAmJiBjb250ZXh0LmRpcmVjdGl2ZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb250ZXh0LmRpcmVjdGl2ZUluZGljZXMgPSBkaXJlY3RpdmVJbmRpY2VzO1xuICAgICAgICBjb250ZXh0LmRpcmVjdGl2ZXMgPSBkaXJlY3RpdmVzO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBhdHRhY2hQYXRjaERhdGEoZGlyZWN0aXZlc1tpXSwgY29udGV4dCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgYXR0YWNoUGF0Y2hEYXRhKGNvbnRleHQubmF0aXZlLCBjb250ZXh0KTtcbiAgICAgIG1wVmFsdWUgPSBjb250ZXh0O1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCByRWxlbWVudCA9IHRhcmdldCBhcyBSRWxlbWVudDtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RG9tRWxlbWVudChyRWxlbWVudCk7XG5cbiAgICAvLyBpZiB0aGUgY29udGV4dCBpcyBub3QgZm91bmQgdGhlbiB3ZSBuZWVkIHRvIHRyYXZlcnNlIHVwd2FyZHMgdXAgdGhlIERPTVxuICAgIC8vIHRvIGZpbmQgdGhlIG5lYXJlc3QgZWxlbWVudCB0aGF0IGhhcyBhbHJlYWR5IGJlZW4gbW9ua2V5IHBhdGNoZWQgd2l0aCBkYXRhXG4gICAgbGV0IHBhcmVudCA9IHJFbGVtZW50IGFzIGFueTtcbiAgICB3aGlsZSAocGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGUpIHtcbiAgICAgIGNvbnN0IHBhcmVudENvbnRleHQgPSByZWFkUGF0Y2hlZERhdGEocGFyZW50KTtcbiAgICAgIGlmIChwYXJlbnRDb250ZXh0KSB7XG4gICAgICAgIGxldCBsVmlld0RhdGE6IExWaWV3RGF0YXxudWxsO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwYXJlbnRDb250ZXh0KSkge1xuICAgICAgICAgIGxWaWV3RGF0YSA9IHBhcmVudENvbnRleHQgYXMgTFZpZXdEYXRhO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxWaWV3RGF0YSA9IHBhcmVudENvbnRleHQubFZpZXdEYXRhO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdGhlIGVkZ2Ugb2YgdGhlIGFwcCB3YXMgYWxzbyByZWFjaGVkIGhlcmUgdGhyb3VnaCBhbm90aGVyIG1lYW5zXG4gICAgICAgIC8vIChtYXliZSBiZWNhdXNlIHRoZSBET00gd2FzIGNoYW5nZWQgbWFudWFsbHkpLlxuICAgICAgICBpZiAoIWxWaWV3RGF0YSkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaW5kZXggPSBmaW5kVmlhTmF0aXZlRWxlbWVudChsVmlld0RhdGEsIHJFbGVtZW50KTtcbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICBjb25zdCBsTm9kZSA9IGdldExOb2RlRnJvbVZpZXdEYXRhKGxWaWV3RGF0YSwgaW5kZXgpICE7XG4gICAgICAgICAgY29uc3QgY29udGV4dCA9IGNyZWF0ZUxDb250ZXh0KGxWaWV3RGF0YSwgaW5kZXgsIGxOb2RlLm5hdGl2ZSk7XG4gICAgICAgICAgYXR0YWNoUGF0Y2hEYXRhKGxOb2RlLm5hdGl2ZSwgY29udGV4dCk7XG4gICAgICAgICAgbXBWYWx1ZSA9IGNvbnRleHQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIChtcFZhbHVlIGFzIExDb250ZXh0KSB8fCBudWxsO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gZW1wdHkgaW5zdGFuY2Ugb2YgYSBgTENvbnRleHRgIGNvbnRleHRcbiAqL1xuZnVuY3Rpb24gY3JlYXRlTENvbnRleHQobFZpZXdEYXRhOiBMVmlld0RhdGEsIGxOb2RlSW5kZXg6IG51bWJlciwgbmF0aXZlOiBSRWxlbWVudCk6IExDb250ZXh0IHtcbiAgcmV0dXJuIHtcbiAgICBsVmlld0RhdGEsXG4gICAgbE5vZGVJbmRleCxcbiAgICBuYXRpdmUsXG4gICAgY29tcG9uZW50OiB1bmRlZmluZWQsXG4gICAgZGlyZWN0aXZlSW5kaWNlczogdW5kZWZpbmVkLFxuICAgIGRpcmVjdGl2ZXM6IHVuZGVmaW5lZCxcbiAgICBsb2NhbFJlZnM6IHVuZGVmaW5lZCxcbiAgfTtcbn1cblxuLyoqXG4gKiBBIHV0aWxpdHkgZnVuY3Rpb24gZm9yIHJldHJpZXZpbmcgdGhlIG1hdGNoaW5nIGxFbGVtZW50Tm9kZVxuICogZnJvbSBhIGdpdmVuIERPTSBlbGVtZW50LCBjb21wb25lbnQgb3IgZGlyZWN0aXZlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TEVsZW1lbnROb2RlKHRhcmdldDogYW55KTogTEVsZW1lbnROb2RlfG51bGwge1xuICBjb25zdCBjb250ZXh0ID0gZ2V0Q29udGV4dCh0YXJnZXQpO1xuICByZXR1cm4gY29udGV4dCA/IGdldExOb2RlRnJvbVZpZXdEYXRhKGNvbnRleHQubFZpZXdEYXRhLCBjb250ZXh0LmxOb2RlSW5kZXgpIDogbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldExFbGVtZW50RnJvbVJvb3RDb21wb25lbnQocm9vdENvbXBvbmVudEluc3RhbmNlOiB7fSk6IExFbGVtZW50Tm9kZXxudWxsIHtcbiAgLy8gdGhlIGhvc3QgZWxlbWVudCBmb3IgdGhlIHJvb3QgY29tcG9uZW50IGlzIEFMV0FZUyB0aGUgZmlyc3QgZWxlbWVudFxuICAvLyBpbiB0aGUgbFZpZXdEYXRhIGFycmF5ICh3aGljaCBpcyB3aGVyZSBIRUFERVJfT0ZGU0VUIHBvaW50cyB0bylcbiAgY29uc3QgbFZpZXdEYXRhID0gcmVhZFBhdGNoZWRMVmlld0RhdGEocm9vdENvbXBvbmVudEluc3RhbmNlKSAhO1xuICByZXR1cm4gcmVhZEVsZW1lbnRWYWx1ZShsVmlld0RhdGFbSEVBREVSX09GRlNFVF0pO1xufVxuXG4vKipcbiAqIEEgc2ltcGxpZmllZCBsb29rdXAgZnVuY3Rpb24gZm9yIGZpbmRpbmcgdGhlIExFbGVtZW50Tm9kZSBmcm9tIGEgY29tcG9uZW50IGluc3RhbmNlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gZXhpc3RzIGZvciB0cmVlLXNoYWtpbmcgcHVycG9zZXMgdG8gYXZvaWQgaGF2aW5nIHRvIHB1bGwgaW4gZXZlcnl0aGluZ1xuICogdGhhdCBgZ2V0Q29udGV4dGAgaGFzIGluIHRoZSBldmVudCB0aGF0IGFuIEFuZ3VsYXIgYXBwbGljYXRpb24gZG9lc24ndCBuZWVkIHRvIGhhdmVcbiAqIGFueSBwcm9ncmFtbWF0aWMgYWNjZXNzIHRvIGFuIGVsZW1lbnQncyBjb250ZXh0IChvbmx5IGNoYW5nZSBkZXRlY3Rpb24gdXNlcyB0aGlzIGZ1bmN0aW9uKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExFbGVtZW50RnJvbUNvbXBvbmVudChjb21wb25lbnRJbnN0YW5jZToge30pOiBMRWxlbWVudE5vZGUge1xuICBsZXQgbFZpZXdEYXRhID0gcmVhZFBhdGNoZWREYXRhKGNvbXBvbmVudEluc3RhbmNlKTtcbiAgbGV0IGxOb2RlOiBMRWxlbWVudE5vZGU7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkobFZpZXdEYXRhKSkge1xuICAgIGNvbnN0IGxOb2RlSW5kZXggPSBmaW5kVmlhQ29tcG9uZW50KGxWaWV3RGF0YSwgY29tcG9uZW50SW5zdGFuY2UpO1xuICAgIGxOb2RlID0gcmVhZEVsZW1lbnRWYWx1ZShsVmlld0RhdGFbbE5vZGVJbmRleF0pO1xuICAgIGNvbnN0IGNvbnRleHQgPSBjcmVhdGVMQ29udGV4dChsVmlld0RhdGEsIGxOb2RlSW5kZXgsIGxOb2RlLm5hdGl2ZSk7XG4gICAgY29udGV4dC5jb21wb25lbnQgPSBjb21wb25lbnRJbnN0YW5jZTtcbiAgICBhdHRhY2hQYXRjaERhdGEoY29tcG9uZW50SW5zdGFuY2UsIGNvbnRleHQpO1xuICAgIGF0dGFjaFBhdGNoRGF0YShjb250ZXh0Lm5hdGl2ZSwgY29udGV4dCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgY29udGV4dCA9IGxWaWV3RGF0YSBhcyBhbnkgYXMgTENvbnRleHQ7XG4gICAgbE5vZGUgPSByZWFkRWxlbWVudFZhbHVlKGNvbnRleHQubFZpZXdEYXRhW2NvbnRleHQubE5vZGVJbmRleF0pO1xuICB9XG5cbiAgcmV0dXJuIGxOb2RlO1xufVxuXG4vKipcbiAqIEFzc2lnbnMgdGhlIGdpdmVuIGRhdGEgdG8gdGhlIGdpdmVuIHRhcmdldCAod2hpY2ggY291bGQgYmUgYSBjb21wb25lbnQsXG4gKiBkaXJlY3RpdmUgb3IgRE9NIG5vZGUgaW5zdGFuY2UpIHVzaW5nIG1vbmtleS1wYXRjaGluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaFBhdGNoRGF0YSh0YXJnZXQ6IGFueSwgZGF0YTogTFZpZXdEYXRhIHwgTENvbnRleHQpIHtcbiAgdGFyZ2V0W01PTktFWV9QQVRDSF9LRVlfTkFNRV0gPSBkYXRhO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIG1vbmtleS1wYXRjaCB2YWx1ZSBkYXRhIHByZXNlbnQgb24gdGhlIHRhcmdldCAod2hpY2ggY291bGQgYmVcbiAqIGEgY29tcG9uZW50LCBkaXJlY3RpdmUgb3IgYSBET00gbm9kZSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkUGF0Y2hlZERhdGEodGFyZ2V0OiBhbnkpOiBMVmlld0RhdGF8TENvbnRleHR8bnVsbCB7XG4gIHJldHVybiB0YXJnZXRbTU9OS0VZX1BBVENIX0tFWV9OQU1FXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRQYXRjaGVkTFZpZXdEYXRhKHRhcmdldDogYW55KTogTFZpZXdEYXRhfG51bGwge1xuICBjb25zdCB2YWx1ZSA9IHJlYWRQYXRjaGVkRGF0YSh0YXJnZXQpO1xuICBpZiAodmFsdWUpIHtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyB2YWx1ZSA6ICh2YWx1ZSBhcyBMQ29udGV4dCkubFZpZXdEYXRhO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb21wb25lbnRJbnN0YW5jZShpbnN0YW5jZTogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiBpbnN0YW5jZSAmJiBpbnN0YW5jZS5jb25zdHJ1Y3RvciAmJiBpbnN0YW5jZS5jb25zdHJ1Y3Rvci5uZ0NvbXBvbmVudERlZjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRGlyZWN0aXZlSW5zdGFuY2UoaW5zdGFuY2U6IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gaW5zdGFuY2UgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IubmdEaXJlY3RpdmVEZWY7XG59XG5cbi8qKlxuICogTG9jYXRlcyB0aGUgZWxlbWVudCB3aXRoaW4gdGhlIGdpdmVuIExWaWV3RGF0YSBhbmQgcmV0dXJucyB0aGUgbWF0Y2hpbmcgaW5kZXhcbiAqL1xuZnVuY3Rpb24gZmluZFZpYU5hdGl2ZUVsZW1lbnQobFZpZXdEYXRhOiBMVmlld0RhdGEsIG5hdGl2ZTogUkVsZW1lbnQpOiBudW1iZXIge1xuICBsZXQgdE5vZGUgPSBsVmlld0RhdGFbVFZJRVddLmZpcnN0Q2hpbGQ7XG4gIHdoaWxlICh0Tm9kZSkge1xuICAgIGNvbnN0IGxOb2RlID0gZ2V0TE5vZGVGcm9tVmlld0RhdGEobFZpZXdEYXRhLCB0Tm9kZS5pbmRleCkgITtcbiAgICBpZiAobE5vZGUubmF0aXZlID09PSBuYXRpdmUpIHtcbiAgICAgIHJldHVybiB0Tm9kZS5pbmRleDtcbiAgICB9XG4gICAgdE5vZGUgPSB0cmF2ZXJzZU5leHRFbGVtZW50KHROb2RlKTtcbiAgfVxuXG4gIHJldHVybiAtMTtcbn1cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBuZXh0IHROb2RlIChjaGlsZCwgc2libGluZyBvciBwYXJlbnQpLlxuICovXG5mdW5jdGlvbiB0cmF2ZXJzZU5leHRFbGVtZW50KHROb2RlOiBUTm9kZSk6IFROb2RlfG51bGwge1xuICBpZiAodE5vZGUuY2hpbGQpIHtcbiAgICByZXR1cm4gdE5vZGUuY2hpbGQ7XG4gIH0gZWxzZSBpZiAodE5vZGUubmV4dCkge1xuICAgIHJldHVybiB0Tm9kZS5uZXh0O1xuICB9IGVsc2UgaWYgKHROb2RlLnBhcmVudCkge1xuICAgIHJldHVybiB0Tm9kZS5wYXJlbnQubmV4dCB8fCBudWxsO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGNvbXBvbmVudCB3aXRoaW4gdGhlIGdpdmVuIExWaWV3RGF0YSBhbmQgcmV0dXJucyB0aGUgbWF0Y2hpbmcgaW5kZXhcbiAqL1xuZnVuY3Rpb24gZmluZFZpYUNvbXBvbmVudChsVmlld0RhdGE6IExWaWV3RGF0YSwgY29tcG9uZW50SW5zdGFuY2U6IHt9KTogbnVtYmVyIHtcbiAgY29uc3QgY29tcG9uZW50SW5kaWNlcyA9IGxWaWV3RGF0YVtUVklFV10uY29tcG9uZW50cztcbiAgaWYgKGNvbXBvbmVudEluZGljZXMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudEluZGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVsZW1lbnRDb21wb25lbnRJbmRleCA9IGNvbXBvbmVudEluZGljZXNbaV07XG4gICAgICBjb25zdCBsTm9kZURhdGEgPSByZWFkRWxlbWVudFZhbHVlKGxWaWV3RGF0YVtlbGVtZW50Q29tcG9uZW50SW5kZXhdICEpLmRhdGEgITtcbiAgICAgIGlmIChsTm9kZURhdGFbQ09OVEVYVF0gPT09IGNvbXBvbmVudEluc3RhbmNlKSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50Q29tcG9uZW50SW5kZXg7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHJvb3ROb2RlID0gbFZpZXdEYXRhW0hFQURFUl9PRkZTRVRdO1xuICAgIGNvbnN0IHJvb3RDb21wb25lbnQgPSByb290Tm9kZS5kYXRhW0NPTlRFWFRdO1xuICAgIGlmIChyb290Q29tcG9uZW50ID09PSBjb21wb25lbnRJbnN0YW5jZSkge1xuICAgICAgLy8gd2UgYXJlIGRlYWxpbmcgd2l0aCB0aGUgcm9vdCBlbGVtZW50IGhlcmUgdGhlcmVmb3JlIHdlIGtub3cgdGhhdCB0aGVcbiAgICAgIC8vIGVsZW1lbnQgaXMgdGhlIHZlcnkgZmlyc3QgZWxlbWVudCBhZnRlciB0aGUgSEVBREVSIGRhdGEgaW4gdGhlIGxWaWV3XG4gICAgICByZXR1cm4gSEVBREVSX09GRlNFVDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGRpcmVjdGl2ZSB3aXRoaW4gdGhlIGdpdmVuIExWaWV3RGF0YSBhbmQgcmV0dXJucyB0aGUgbWF0Y2hpbmcgaW5kZXhcbiAqL1xuZnVuY3Rpb24gZmluZFZpYURpcmVjdGl2ZShsVmlld0RhdGE6IExWaWV3RGF0YSwgZGlyZWN0aXZlSW5zdGFuY2U6IHt9KTogbnVtYmVyIHtcbiAgLy8gaWYgYSBkaXJlY3RpdmUgaXMgbW9ua2V5IHBhdGNoZWQgdGhlbiBpdCB3aWxsIChieSBkZWZhdWx0KVxuICAvLyBoYXZlIGEgcmVmZXJlbmNlIHRvIHRoZSBMVmlld0RhdGEgb2YgdGhlIGN1cnJlbnQgdmlldy4gVGhlXG4gIC8vIGVsZW1lbnQgYm91bmQgdG8gdGhlIGRpcmVjdGl2ZSBiZWluZyBzZWFyY2ggbGl2ZXMgc29tZXdoZXJlXG4gIC8vIGluIHRoZSB2aWV3IGRhdGEuIEJ5IGZpcnN0IGNoZWNraW5nIHRvIHNlZSBpZiB0aGUgaW5zdGFuY2VcbiAgLy8gaXMgYWN0dWFsbHkgcHJlc2VudCB3ZSBjYW4gbmFycm93IGRvd24gdG8gd2hpY2ggbEVsZW1lbnROb2RlXG4gIC8vIGNvbnRhaW5zIHRoZSBpbnN0YW5jZSBvZiB0aGUgZGlyZWN0aXZlIGFuZCB0aGVuIHJldHVybiB0aGUgaW5kZXhcbiAgY29uc3QgZGlyZWN0aXZlc0Fjcm9zc1ZpZXcgPSBsVmlld0RhdGFbRElSRUNUSVZFU107XG4gIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID1cbiAgICAgIGRpcmVjdGl2ZXNBY3Jvc3NWaWV3ID8gZGlyZWN0aXZlc0Fjcm9zc1ZpZXcuaW5kZXhPZihkaXJlY3RpdmVJbnN0YW5jZSkgOiAtMTtcbiAgaWYgKGRpcmVjdGl2ZUluZGV4ID49IDApIHtcbiAgICBsZXQgdE5vZGUgPSBsVmlld0RhdGFbVFZJRVddLmZpcnN0Q2hpbGQ7XG4gICAgd2hpbGUgKHROb2RlKSB7XG4gICAgICBjb25zdCBkaXJlY3RpdmVJbmRleFN0YXJ0ID0gZ2V0RGlyZWN0aXZlU3RhcnRJbmRleCh0Tm9kZSk7XG4gICAgICBjb25zdCBkaXJlY3RpdmVJbmRleEVuZCA9IGdldERpcmVjdGl2ZUVuZEluZGV4KHROb2RlLCBkaXJlY3RpdmVJbmRleFN0YXJ0KTtcbiAgICAgIGlmIChkaXJlY3RpdmVJbmRleCA+PSBkaXJlY3RpdmVJbmRleFN0YXJ0ICYmIGRpcmVjdGl2ZUluZGV4IDwgZGlyZWN0aXZlSW5kZXhFbmQpIHtcbiAgICAgICAgcmV0dXJuIHROb2RlLmluZGV4O1xuICAgICAgfVxuICAgICAgdE5vZGUgPSB0cmF2ZXJzZU5leHRFbGVtZW50KHROb2RlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gLTE7XG59XG5cbmZ1bmN0aW9uIGFzc2VydERvbUVsZW1lbnQoZWxlbWVudDogYW55KSB7XG4gIGFzc2VydEVxdWFsKGVsZW1lbnQubm9kZVR5cGUsIDEsICdUaGUgcHJvdmlkZWQgdmFsdWUgbXVzdCBiZSBhbiBpbnN0YW5jZSBvZiBhbiBIVE1MRWxlbWVudCcpO1xufVxuXG4vKipcbiAqIFJldHJ1bnMgdGhlIGluc3RhbmNlIG9mIHRoZSBMRWxlbWVudE5vZGUgYXQgdGhlIGdpdmVuIGluZGV4IGluIHRoZSBMVmlld0RhdGEuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGFsc28gdW53cmFwIHRoZSBpbm5lciB2YWx1ZSBpbmNhc2UgaXQncyBzdHVmZmVkIGludG8gYW5cbiAqIGFycmF5ICh3aGljaCBpcyB3aGF0IGhhcHBlbnMgd2hlbiBbc3R5bGVdIGFuZCBbY2xhc3NdIGJpbmRpbmdzIGFyZSBwcmVzZW50XG4gKiBpbiB0aGUgdmlldyBpbnN0cnVjdGlvbnMgZm9yIHRoZSBlbGVtZW50IGJlaW5nIHJldHVybmVkKS5cbiAqL1xuZnVuY3Rpb24gZ2V0TE5vZGVGcm9tVmlld0RhdGEobFZpZXdEYXRhOiBMVmlld0RhdGEsIGxFbGVtZW50SW5kZXg6IG51bWJlcik6IExFbGVtZW50Tm9kZXxudWxsIHtcbiAgY29uc3QgdmFsdWUgPSBsVmlld0RhdGFbbEVsZW1lbnRJbmRleF07XG4gIHJldHVybiB2YWx1ZSA/IHJlYWRFbGVtZW50VmFsdWUodmFsdWUpIDogbnVsbDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgY29sbGVjdGlvbiBvZiBkaXJlY3RpdmUgaW5kZXggdmFsdWVzIHRoYXQgYXJlIHVzZWQgb24gdGhlIGVsZW1lbnRcbiAqICh3aGljaCBpcyByZWZlcmVuY2VkIGJ5IHRoZSBsTm9kZUluZGV4KVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlzY292ZXJEaXJlY3RpdmVJbmRpY2VzKFxuICAgIGxWaWV3RGF0YTogTFZpZXdEYXRhLCBsTm9kZUluZGV4OiBudW1iZXIsIGluY2x1ZGVDb21wb25lbnRzPzogYm9vbGVhbik6IG51bWJlcltdfG51bGwge1xuICBjb25zdCBkaXJlY3RpdmVzQWNyb3NzVmlldyA9IGxWaWV3RGF0YVtESVJFQ1RJVkVTXTtcbiAgY29uc3QgdE5vZGUgPSBsVmlld0RhdGFbVFZJRVddLmRhdGFbbE5vZGVJbmRleF0gYXMgVE5vZGU7XG4gIGlmIChkaXJlY3RpdmVzQWNyb3NzVmlldyAmJiBkaXJlY3RpdmVzQWNyb3NzVmlldy5sZW5ndGgpIHtcbiAgICAvLyB0aGlzIGNoZWNrIGZvciB0Tm9kZSBpcyB0byBkZXRlcm1pbmUgaWYgdGhlIHZhbHVlIGlzIGEgTEVsZW1lbnROb2RlIGluc3RhbmNlXG4gICAgY29uc3QgZGlyZWN0aXZlSW5kZXhTdGFydCA9IGdldERpcmVjdGl2ZVN0YXJ0SW5kZXgodE5vZGUpO1xuICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4RW5kID0gZ2V0RGlyZWN0aXZlRW5kSW5kZXgodE5vZGUsIGRpcmVjdGl2ZUluZGV4U3RhcnQpO1xuICAgIGNvbnN0IGRpcmVjdGl2ZUluZGljZXM6IG51bWJlcltdID0gW107XG4gICAgZm9yIChsZXQgaSA9IGRpcmVjdGl2ZUluZGV4U3RhcnQ7IGkgPCBkaXJlY3RpdmVJbmRleEVuZDsgaSsrKSB7XG4gICAgICAvLyBzcGVjaWFsIGNhc2Ugc2luY2UgdGhlIGluc3RhbmNlIG9mIHRoZSBjb21wb25lbnQgKGlmIGl0IGV4aXN0cylcbiAgICAgIC8vIGlzIHN0b3JlZCBpbiB0aGUgZGlyZWN0aXZlcyBhcnJheS5cbiAgICAgIGlmIChpID4gZGlyZWN0aXZlSW5kZXhTdGFydCB8fFxuICAgICAgICAgICFpc0NvbXBvbmVudEluc3RhbmNlKGRpcmVjdGl2ZXNBY3Jvc3NWaWV3W2RpcmVjdGl2ZUluZGV4U3RhcnRdKSkge1xuICAgICAgICBkaXJlY3RpdmVJbmRpY2VzLnB1c2goaSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkaXJlY3RpdmVJbmRpY2VzLmxlbmd0aCA/IGRpcmVjdGl2ZUluZGljZXMgOiBudWxsO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBsaXN0IG9mIGRpcmVjdGl2ZXMgZXh0cmFjdGVkIGZyb20gdGhlIGdpdmVuIHZpZXcgYmFzZWQgb24gdGhlXG4gKiBwcm92aWRlZCBsaXN0IG9mIGRpcmVjdGl2ZSBpbmRleCB2YWx1ZXMuXG4gKlxuICogQHBhcmFtIGxWaWV3RGF0YSBUaGUgdGFyZ2V0IHZpZXcgZGF0YVxuICogQHBhcmFtIGluZGljZXMgQSBjb2xsZWN0aW9uIG9mIGRpcmVjdGl2ZSBpbmRleCB2YWx1ZXMgd2hpY2ggd2lsbCBiZSB1c2VkIHRvXG4gKiAgICBmaWd1cmUgb3V0IHRoZSBkaXJlY3RpdmUgaW5zdGFuY2VzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXNjb3ZlckRpcmVjdGl2ZXMobFZpZXdEYXRhOiBMVmlld0RhdGEsIGluZGljZXM6IG51bWJlcltdKTogbnVtYmVyW118bnVsbCB7XG4gIGNvbnN0IGRpcmVjdGl2ZXM6IGFueVtdID0gW107XG4gIGNvbnN0IGRpcmVjdGl2ZUluc3RhbmNlcyA9IGxWaWV3RGF0YVtESVJFQ1RJVkVTXTtcbiAgaWYgKGRpcmVjdGl2ZUluc3RhbmNlcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5kaWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBpbmRpY2VzW2ldO1xuICAgICAgY29uc3QgZGlyZWN0aXZlID0gZGlyZWN0aXZlSW5zdGFuY2VzW2RpcmVjdGl2ZUluZGV4XTtcbiAgICAgIGRpcmVjdGl2ZXMucHVzaChkaXJlY3RpdmUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGlyZWN0aXZlcztcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbWFwIG9mIGxvY2FsIHJlZmVyZW5jZXMgKGxvY2FsIHJlZmVyZW5jZSBuYW1lID0+IGVsZW1lbnQgb3IgZGlyZWN0aXZlIGluc3RhbmNlKSB0aGF0XG4gKiBleGlzdCBvbiBhIGdpdmVuIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXNjb3ZlckxvY2FsUmVmcyhsVmlld0RhdGE6IExWaWV3RGF0YSwgbE5vZGVJbmRleDogbnVtYmVyKToge1trZXk6IHN0cmluZ106IGFueX18XG4gICAgbnVsbCB7XG4gIGNvbnN0IHROb2RlID0gbFZpZXdEYXRhW1RWSUVXXS5kYXRhW2xOb2RlSW5kZXhdIGFzIFROb2RlO1xuICBpZiAodE5vZGUgJiYgdE5vZGUubG9jYWxOYW1lcykge1xuICAgIGNvbnN0IHJlc3VsdDoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHROb2RlLmxvY2FsTmFtZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGxvY2FsUmVmTmFtZSA9IHROb2RlLmxvY2FsTmFtZXNbaV07XG4gICAgICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IHROb2RlLmxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIHJlc3VsdFtsb2NhbFJlZk5hbWVdID0gZGlyZWN0aXZlSW5kZXggPT09IC0xID9cbiAgICAgICAgICBnZXRMTm9kZUZyb21WaWV3RGF0YShsVmlld0RhdGEsIGxOb2RlSW5kZXgpICEubmF0aXZlIDpcbiAgICAgICAgICBsVmlld0RhdGFbRElSRUNUSVZFU10gIVtkaXJlY3RpdmVJbmRleF07XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gZ2V0RGlyZWN0aXZlU3RhcnRJbmRleCh0Tm9kZTogVE5vZGUpOiBudW1iZXIge1xuICAvLyB0aGUgdE5vZGUgaW5zdGFuY2VzIHN0b3JlIGEgZmxhZyB2YWx1ZSB3aGljaCB0aGVuIGhhcyBhXG4gIC8vIHBvaW50ZXIgd2hpY2ggdGVsbHMgdGhlIHN0YXJ0aW5nIGluZGV4IG9mIHdoZXJlIGFsbCB0aGVcbiAgLy8gYWN0aXZlIGRpcmVjdGl2ZXMgYXJlIGluIHRoZSBtYXN0ZXIgZGlyZWN0aXZlIGFycmF5XG4gIHJldHVybiB0Tm9kZS5mbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbn1cblxuZnVuY3Rpb24gZ2V0RGlyZWN0aXZlRW5kSW5kZXgodE5vZGU6IFROb2RlLCBzdGFydEluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICAvLyBUaGUgZW5kIHZhbHVlIGlzIGFsc28gYSBwYXJ0IG9mIHRoZSBzYW1lIGZsYWdcbiAgLy8gKHNlZSBgVE5vZGVGbGFnc2AgdG8gc2VlIGhvdyB0aGUgZmxhZyBiaXQgc2hpZnRpbmdcbiAgLy8gdmFsdWVzIGFyZSB1c2VkKS5cbiAgY29uc3QgY291bnQgPSB0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuICByZXR1cm4gY291bnQgPyAoc3RhcnRJbmRleCArIGNvdW50KSA6IC0xO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZEVsZW1lbnRWYWx1ZSh2YWx1ZTogTEVsZW1lbnROb2RlIHwgYW55W10pOiBMRWxlbWVudE5vZGUge1xuICByZXR1cm4gKEFycmF5LmlzQXJyYXkodmFsdWUpID8gKHZhbHVlIGFzIGFueSBhcyBhbnlbXSlbMF0gOiB2YWx1ZSkgYXMgTEVsZW1lbnROb2RlO1xufVxuIl19