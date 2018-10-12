/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import './ng_dev_mode';
import { assertEqual } from './assert';
import { ACTIVE_INDEX, HOST_NATIVE } from './interfaces/container';
import { CONTEXT, HEADER_OFFSET, TVIEW } from './interfaces/view';
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
 * The index instance of the node.
 * @type {?}
 */
LContext.prototype.nodeIndex;
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
            let nodeIndex;
            /** @type {?} */
            let component = undefined;
            /** @type {?} */
            let directives = undefined;
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
                nodeIndex = findViaNativeElement(lViewData, /** @type {?} */ (target));
                if (nodeIndex == -1) {
                    return null;
                }
            }
            /** @type {?} */
            const lNode = /** @type {?} */ ((getLNodeFromViewData(lViewData, nodeIndex)));
            /** @type {?} */
            const existingCtx = readPatchedData(lNode.native);
            /** @type {?} */
            const context = (existingCtx && !Array.isArray(existingCtx)) ?
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
        nodeIndex: lNodeIndex, native,
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
        lNode = readElementValue(context.lViewData[context.nodeIndex]);
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
    let tNode = lViewData[TVIEW].firstChild;
    while (tNode) {
        /** @type {?} */
        const directiveIndexStart = getDirectiveStartIndex(tNode);
        /** @type {?} */
        const directiveIndexEnd = getDirectiveEndIndex(tNode, directiveIndexStart);
        for (let i = directiveIndexStart; i < directiveIndexEnd; i++) {
            if (lViewData[i] === directiveInstance) {
                return tNode.index;
            }
        }
        tNode = traverseNextElement(tNode);
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
 * Returns a list of directives extracted from the given view based on the
 * provided list of directive index values.
 *
 * @param {?} nodeIndex The node index
 * @param {?} lViewData The target view data
 * @param {?} includeComponents Whether or not to include components in returned directives
 * @return {?}
 */
export function discoverDirectives(nodeIndex, lViewData, includeComponents) {
    /** @type {?} */
    const tNode = /** @type {?} */ (lViewData[TVIEW].data[nodeIndex]);
    /** @type {?} */
    let directiveStartIndex = getDirectiveStartIndex(tNode);
    /** @type {?} */
    const directiveEndIndex = getDirectiveEndIndex(tNode, directiveStartIndex);
    if (!includeComponents && tNode.flags & 4096 /* isComponent */)
        directiveStartIndex++;
    return lViewData.slice(directiveStartIndex, directiveEndIndex);
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
            result[localRefName] = directiveIndex === -1 ? /** @type {?} */ ((getLNodeFromViewData(lViewData, lNodeIndex))).native :
                lViewData[directiveIndex];
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
 * Takes the value of a slot in `LViewData` and returns the element node.
 *
 * Normally, element nodes are stored flat, but if the node has styles/classes on it,
 * it might be wrapped in a styling context. Or if that node has a directive that injects
 * ViewContainerRef, it may be wrapped in an LContainer.
 *
 * @param {?} value The initial value in `LViewData`
 * @return {?}
 */
export function readElementValue(value) {
    if (Array.isArray(value)) {
        if (typeof value[ACTIVE_INDEX] === 'number') {
            // This is an LContainer. It may also have a styling context.
            value = /** @type {?} */ (value[HOST_NATIVE]);
            return Array.isArray(value) ? /** @type {?} */ ((value[0 /* ElementPosition */])) : value;
        }
        else {
            // This is a StylingContext, which stores the element node at 0.
            return /** @type {?} */ (value[0 /* ElementPosition */]);
        }
    }
    else {
        return value; // Regular LNode is stored here
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9kaXNjb3ZlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2NvbnRleHRfZGlzY292ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFPQSxPQUFPLGVBQWUsQ0FBQztBQUV2QixPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JDLE9BQU8sRUFBQyxZQUFZLEVBQUUsV0FBVyxFQUFhLE1BQU0sd0JBQXdCLENBQUM7QUFJN0UsT0FBTyxFQUFDLE9BQU8sRUFBRSxhQUFhLEVBQWEsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7Ozs7QUFLM0UsYUFBYSxxQkFBcUIsR0FBRyxlQUFlLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE4RHJELE1BQU0sVUFBVSxVQUFVLENBQUMsTUFBVzs7SUFDcEMsSUFBSSxPQUFPLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3RDLElBQUksT0FBTyxFQUFFOzs7UUFHWCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7O1lBQzFCLE1BQU0sU0FBUyxzQkFBYyxPQUFPLEdBQUc7O1lBQ3ZDLElBQUksU0FBUyxDQUFTOztZQUN0QixJQUFJLFNBQVMsR0FBUSxTQUFTLENBQUM7O1lBQy9CLElBQUksVUFBVSxHQUF5QixTQUFTLENBQUM7WUFFakQsSUFBSSxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDL0IsU0FBUyxHQUFHLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDaEQsSUFBSSxTQUFTLElBQUksQ0FBQyxDQUFDLEVBQUU7b0JBQ25CLE1BQU0sSUFBSSxLQUFLLENBQUMseURBQXlELENBQUMsQ0FBQztpQkFDNUU7Z0JBQ0QsU0FB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TSxDQUFDLFlBQVksQ0FBQyxHQUFHLGNBQWMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLG9CQUMxQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUM7Z0JBQ3RELFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQztTQUMvQjtRQUNELE9BQU8sTUFBTSxDQUFDO0tBQ2Y7SUFFRCxPQUFPLElBQUksQ0FBQztDQUNiOzs7OztBQUVELFNBQVMsc0JBQXNCLENBQUMsS0FBWTs7OztJQUkxQyxPQUFPLEtBQUssQ0FBQyxLQUFLLHdDQUEwQyxDQUFDO0NBQzlEOzs7Ozs7QUFFRCxTQUFTLG9CQUFvQixDQUFDLEtBQVksRUFBRSxVQUFrQjs7SUFJNUQsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssZ0NBQWdDLENBQUM7SUFDMUQsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUMxQzs7Ozs7Ozs7Ozs7QUFXRCxNQUFNLFVBQVUsZ0JBQWdCLENBQUMsS0FBaUQ7SUFDaEYsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ3hCLElBQUksT0FBTyxLQUFLLENBQUMsWUFBWSxDQUFDLEtBQUssUUFBUSxFQUFFOztZQUUzQyxLQUFLLHFCQUFHLEtBQUssQ0FBQyxXQUFXLENBQWtDLENBQUEsQ0FBQztZQUM1RCxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxvQkFBQyxLQUFLLHlCQUE4QixHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUM7U0FDN0U7YUFBTTs7WUFFTCx5QkFBTyxLQUFLLHlCQUE4QyxFQUFDO1NBQzVEO0tBQ0Y7U0FBTTtRQUNMLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCAnLi9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7YXNzZXJ0RXF1YWx9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7QUNUSVZFX0lOREVYLCBIT1NUX05BVElWRSwgTENvbnRhaW5lcn0gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0xFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge1N0eWxpbmdDb250ZXh0LCBTdHlsaW5nSW5kZXh9IGZyb20gJy4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7Q09OVEVYVCwgSEVBREVSX09GRlNFVCwgTFZpZXdEYXRhLCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuXG4vKipcbiAqIFRoaXMgcHJvcGVydHkgd2lsbCBiZSBtb25rZXktcGF0Y2hlZCBvbiBlbGVtZW50cywgY29tcG9uZW50cyBhbmQgZGlyZWN0aXZlc1xuICovXG5leHBvcnQgY29uc3QgTU9OS0VZX1BBVENIX0tFWV9OQU1FID0gJ19fbmdDb250ZXh0X18nO1xuXG4vKipcbiAqIFRoZSBpbnRlcm5hbCB2aWV3IGNvbnRleHQgd2hpY2ggaXMgc3BlY2lmaWMgdG8gYSBnaXZlbiBET00gZWxlbWVudCwgZGlyZWN0aXZlIG9yXG4gKiBjb21wb25lbnQgaW5zdGFuY2UuIEVhY2ggdmFsdWUgaW4gaGVyZSAoYmVzaWRlcyB0aGUgTFZpZXdEYXRhIGFuZCBlbGVtZW50IG5vZGUgZGV0YWlscylcbiAqIGNhbiBiZSBwcmVzZW50LCBudWxsIG9yIHVuZGVmaW5lZC4gSWYgdW5kZWZpbmVkIHRoZW4gaXQgaW1wbGllcyB0aGUgdmFsdWUgaGFzIG5vdCBiZWVuXG4gKiBsb29rZWQgdXAgeWV0LCBvdGhlcndpc2UsIGlmIG51bGwsIHRoZW4gYSBsb29rdXAgd2FzIGV4ZWN1dGVkIGFuZCBub3RoaW5nIHdhcyBmb3VuZC5cbiAqXG4gKiBFYWNoIHZhbHVlIHdpbGwgZ2V0IGZpbGxlZCB3aGVuIHRoZSByZXNwZWN0aXZlIHZhbHVlIGlzIGV4YW1pbmVkIHdpdGhpbiB0aGUgZ2V0Q29udGV4dFxuICogZnVuY3Rpb24uIFRoZSBjb21wb25lbnQsIGVsZW1lbnQgYW5kIGVhY2ggZGlyZWN0aXZlIGluc3RhbmNlIHdpbGwgc2hhcmUgdGhlIHNhbWUgaW5zdGFuY2VcbiAqIG9mIHRoZSBjb250ZXh0LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIExDb250ZXh0IHtcbiAgLyoqXG4gICAqIFRoZSBjb21wb25lbnQncyBwYXJlbnQgdmlldyBkYXRhLlxuICAgKi9cbiAgbFZpZXdEYXRhOiBMVmlld0RhdGE7XG5cbiAgLyoqXG4gICAqIFRoZSBpbmRleCBpbnN0YW5jZSBvZiB0aGUgbm9kZS5cbiAgICovXG4gIG5vZGVJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgaW5zdGFuY2Ugb2YgdGhlIERPTSBub2RlIHRoYXQgaXMgYXR0YWNoZWQgdG8gdGhlIGxOb2RlLlxuICAgKi9cbiAgbmF0aXZlOiBSRWxlbWVudDtcblxuICAvKipcbiAgICogVGhlIGluc3RhbmNlIG9mIHRoZSBDb21wb25lbnQgbm9kZS5cbiAgICovXG4gIGNvbXBvbmVudDoge318bnVsbHx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFRoZSBsaXN0IG9mIGFjdGl2ZSBkaXJlY3RpdmVzIHRoYXQgZXhpc3Qgb24gdGhpcyBlbGVtZW50LlxuICAgKi9cbiAgZGlyZWN0aXZlczogYW55W118bnVsbHx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFRoZSBtYXAgb2YgbG9jYWwgcmVmZXJlbmNlcyAobG9jYWwgcmVmZXJlbmNlIG5hbWUgPT4gZWxlbWVudCBvciBkaXJlY3RpdmUgaW5zdGFuY2UpIHRoYXQgZXhpc3RcbiAgICogb24gdGhpcyBlbGVtZW50LlxuICAgKi9cbiAgbG9jYWxSZWZzOiB7W2tleTogc3RyaW5nXTogYW55fXxudWxsfHVuZGVmaW5lZDtcbn1cblxuLyoqIFJldHVybnMgdGhlIG1hdGNoaW5nIGBMQ29udGV4dGAgZGF0YSBmb3IgYSBnaXZlbiBET00gbm9kZSwgZGlyZWN0aXZlIG9yIGNvbXBvbmVudCBpbnN0YW5jZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgZXhhbWluZSB0aGUgcHJvdmlkZWQgRE9NIGVsZW1lbnQsIGNvbXBvbmVudCwgb3IgZGlyZWN0aXZlIGluc3RhbmNlXFwnc1xuICogbW9ua2V5LXBhdGNoZWQgcHJvcGVydHkgdG8gZGVyaXZlIHRoZSBgTENvbnRleHRgIGRhdGEuIE9uY2UgY2FsbGVkIHRoZW4gdGhlIG1vbmtleS1wYXRjaGVkXG4gKiB2YWx1ZSB3aWxsIGJlIHRoYXQgb2YgdGhlIG5ld2x5IGNyZWF0ZWQgYExDb250ZXh0YC5cbiAqXG4gKiBJZiB0aGUgbW9ua2V5LXBhdGNoZWQgdmFsdWUgaXMgdGhlIGBMVmlld0RhdGFgIGluc3RhbmNlIHRoZW4gdGhlIGNvbnRleHQgdmFsdWUgZm9yIHRoYXRcbiAqIHRhcmdldCB3aWxsIGJlIGNyZWF0ZWQgYW5kIHRoZSBtb25rZXktcGF0Y2ggcmVmZXJlbmNlIHdpbGwgYmUgdXBkYXRlZC4gVGhlcmVmb3JlIHdoZW4gdGhpc1xuICogZnVuY3Rpb24gaXMgY2FsbGVkIGl0IG1heSBtdXRhdGUgdGhlIHByb3ZpZGVkIGVsZW1lbnRcXCdzLCBjb21wb25lbnRcXCdzIG9yIGFueSBvZiB0aGUgYXNzb2NpYXRlZFxuICogZGlyZWN0aXZlXFwncyBtb25rZXktcGF0Y2ggdmFsdWVzLlxuICpcbiAqIElmIHRoZSBtb25rZXktcGF0Y2ggdmFsdWUgaXMgbm90IGRldGVjdGVkIHRoZW4gdGhlIGNvZGUgd2lsbCB3YWxrIHVwIHRoZSBET00gdW50aWwgYW4gZWxlbWVudFxuICogaXMgZm91bmQgd2hpY2ggY29udGFpbnMgYSBtb25rZXktcGF0Y2ggcmVmZXJlbmNlLiBXaGVuIHRoYXQgb2NjdXJzIHRoZW4gdGhlIHByb3ZpZGVkIGVsZW1lbnRcbiAqIHdpbGwgYmUgdXBkYXRlZCB3aXRoIGEgbmV3IGNvbnRleHQgKHdoaWNoIGlzIHRoZW4gcmV0dXJuZWQpLiBJZiB0aGUgbW9ua2V5LXBhdGNoIHZhbHVlIGlzIG5vdFxuICogZGV0ZWN0ZWQgZm9yIGEgY29tcG9uZW50L2RpcmVjdGl2ZSBpbnN0YW5jZSB0aGVuIGl0IHdpbGwgdGhyb3cgYW4gZXJyb3IgKGFsbCBjb21wb25lbnRzIGFuZFxuICogZGlyZWN0aXZlcyBzaG91bGQgYmUgYXV0b21hdGljYWxseSBtb25rZXktcGF0Y2hlZCBieSBpdnkpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29udGV4dCh0YXJnZXQ6IGFueSk6IExDb250ZXh0fG51bGwge1xuICBsZXQgbXBWYWx1ZSA9IHJlYWRQYXRjaGVkRGF0YSh0YXJnZXQpO1xuICBpZiAobXBWYWx1ZSkge1xuICAgIC8vIG9ubHkgd2hlbiBpdCdzIGFuIGFycmF5IGlzIGl0IGNvbnNpZGVyZWQgYW4gTFZpZXdEYXRhIGluc3RhbmNlXG4gICAgLy8gLi4uIG90aGVyd2lzZSBpdCdzIGFuIGFscmVhZHkgY29uc3RydWN0ZWQgTENvbnRleHQgaW5zdGFuY2VcbiAgICBpZiAoQXJyYXkuaXNBcnJheShtcFZhbHVlKSkge1xuICAgICAgY29uc3QgbFZpZXdEYXRhOiBMVmlld0RhdGEgPSBtcFZhbHVlICE7XG4gICAgICBsZXQgbm9kZUluZGV4OiBudW1iZXI7XG4gICAgICBsZXQgY29tcG9uZW50OiBhbnkgPSB1bmRlZmluZWQ7XG4gICAgICBsZXQgZGlyZWN0aXZlczogYW55W118bnVsbHx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgICAgIGlmIChpc0NvbXBvbmVudEluc3RhbmNlKHRhcmdldCkpIHtcbiAgICAgICAgbm9kZUluZGV4ID0gZmluZFZpYUNvbXBvbmVudChsVmlld0RhdGEsIHRhcmdldCk7XG4gICAgICAgIGlmIChub2RlSW5kZXggPT0gLTEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBwcm92aWRlZCBjb21wb25lbnQgd2FzIG5vdCBmb3VuZCBpbiB0aGUgYXBwbGljYXRpb24nKTtcbiAgICAgICAgfVxuICAgICAgICBjb21wb25lbnQgPSB0YXJnZXQ7XG4gICAgICB9IGVsc2UgaWYgKGlzRGlyZWN0aXZlSW5zdGFuY2UodGFyZ2V0KSkge1xuICAgICAgICBub2RlSW5kZXggPSBmaW5kVmlhRGlyZWN0aXZlKGxWaWV3RGF0YSwgdGFyZ2V0KTtcbiAgICAgICAgaWYgKG5vZGVJbmRleCA9PSAtMSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHByb3ZpZGVkIGRpcmVjdGl2ZSB3YXMgbm90IGZvdW5kIGluIHRoZSBhcHBsaWNhdGlvbicpO1xuICAgICAgICB9XG4gICAgICAgIGRpcmVjdGl2ZXMgPSBkaXNjb3ZlckRpcmVjdGl2ZXMobm9kZUluZGV4LCBsVmlld0RhdGEsIGZhbHNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGVJbmRleCA9IGZpbmRWaWFOYXRpdmVFbGVtZW50KGxWaWV3RGF0YSwgdGFyZ2V0IGFzIFJFbGVtZW50KTtcbiAgICAgICAgaWYgKG5vZGVJbmRleCA9PSAtMSkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIHRoZSBnb2FsIGlzIG5vdCB0byBmaWxsIHRoZSBlbnRpcmUgY29udGV4dCBmdWxsIG9mIGRhdGEgYmVjYXVzZSB0aGUgbG9va3Vwc1xuICAgICAgLy8gYXJlIGV4cGVuc2l2ZS4gSW5zdGVhZCwgb25seSB0aGUgdGFyZ2V0IGRhdGEgKHRoZSBlbGVtZW50LCBjb21wb250ZW50IG9yXG4gICAgICAvLyBkaXJlY3RpdmUgZGV0YWlscykgYXJlIGZpbGxlZCBpbnRvIHRoZSBjb250ZXh0LiBJZiBjYWxsZWQgbXVsdGlwbGUgdGltZXNcbiAgICAgIC8vIHdpdGggZGlmZmVyZW50IHRhcmdldCB2YWx1ZXMgdGhlbiB0aGUgbWlzc2luZyB0YXJnZXQgZGF0YSB3aWxsIGJlIGZpbGxlZCBpbi5cbiAgICAgIGNvbnN0IGxOb2RlID0gZ2V0TE5vZGVGcm9tVmlld0RhdGEobFZpZXdEYXRhLCBub2RlSW5kZXgpICE7XG4gICAgICBjb25zdCBleGlzdGluZ0N0eCA9IHJlYWRQYXRjaGVkRGF0YShsTm9kZS5uYXRpdmUpO1xuICAgICAgY29uc3QgY29udGV4dDogTENvbnRleHQgPSAoZXhpc3RpbmdDdHggJiYgIUFycmF5LmlzQXJyYXkoZXhpc3RpbmdDdHgpKSA/XG4gICAgICAgICAgZXhpc3RpbmdDdHggOlxuICAgICAgICAgIGNyZWF0ZUxDb250ZXh0KGxWaWV3RGF0YSwgbm9kZUluZGV4LCBsTm9kZS5uYXRpdmUpO1xuXG4gICAgICAvLyBvbmx5IHdoZW4gdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBkaXNjb3ZlcmVkIHRoZW4gdXBkYXRlIHRoZSBtb25rZXktcGF0Y2hcbiAgICAgIGlmIChjb21wb25lbnQgJiYgY29udGV4dC5jb21wb25lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb250ZXh0LmNvbXBvbmVudCA9IGNvbXBvbmVudDtcbiAgICAgICAgYXR0YWNoUGF0Y2hEYXRhKGNvbnRleHQuY29tcG9uZW50LCBjb250ZXh0KTtcbiAgICAgIH1cblxuICAgICAgLy8gb25seSB3aGVuIHRoZSBkaXJlY3RpdmVzIGhhdmUgYmVlbiBkaXNjb3ZlcmVkIHRoZW4gdXBkYXRlIHRoZSBtb25rZXktcGF0Y2hcbiAgICAgIGlmIChkaXJlY3RpdmVzICYmIGNvbnRleHQuZGlyZWN0aXZlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRleHQuZGlyZWN0aXZlcyA9IGRpcmVjdGl2ZXM7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGF0dGFjaFBhdGNoRGF0YShkaXJlY3RpdmVzW2ldLCBjb250ZXh0KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBhdHRhY2hQYXRjaERhdGEoY29udGV4dC5uYXRpdmUsIGNvbnRleHQpO1xuICAgICAgbXBWYWx1ZSA9IGNvbnRleHQ7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHJFbGVtZW50ID0gdGFyZ2V0IGFzIFJFbGVtZW50O1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREb21FbGVtZW50KHJFbGVtZW50KTtcblxuICAgIC8vIGlmIHRoZSBjb250ZXh0IGlzIG5vdCBmb3VuZCB0aGVuIHdlIG5lZWQgdG8gdHJhdmVyc2UgdXB3YXJkcyB1cCB0aGUgRE9NXG4gICAgLy8gdG8gZmluZCB0aGUgbmVhcmVzdCBlbGVtZW50IHRoYXQgaGFzIGFscmVhZHkgYmVlbiBtb25rZXkgcGF0Y2hlZCB3aXRoIGRhdGFcbiAgICBsZXQgcGFyZW50ID0gckVsZW1lbnQgYXMgYW55O1xuICAgIHdoaWxlIChwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZSkge1xuICAgICAgY29uc3QgcGFyZW50Q29udGV4dCA9IHJlYWRQYXRjaGVkRGF0YShwYXJlbnQpO1xuICAgICAgaWYgKHBhcmVudENvbnRleHQpIHtcbiAgICAgICAgbGV0IGxWaWV3RGF0YTogTFZpZXdEYXRhfG51bGw7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHBhcmVudENvbnRleHQpKSB7XG4gICAgICAgICAgbFZpZXdEYXRhID0gcGFyZW50Q29udGV4dCBhcyBMVmlld0RhdGE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbFZpZXdEYXRhID0gcGFyZW50Q29udGV4dC5sVmlld0RhdGE7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0aGUgZWRnZSBvZiB0aGUgYXBwIHdhcyBhbHNvIHJlYWNoZWQgaGVyZSB0aHJvdWdoIGFub3RoZXIgbWVhbnNcbiAgICAgICAgLy8gKG1heWJlIGJlY2F1c2UgdGhlIERPTSB3YXMgY2hhbmdlZCBtYW51YWxseSkuXG4gICAgICAgIGlmICghbFZpZXdEYXRhKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpbmRleCA9IGZpbmRWaWFOYXRpdmVFbGVtZW50KGxWaWV3RGF0YSwgckVsZW1lbnQpO1xuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgIGNvbnN0IGxOb2RlID0gZ2V0TE5vZGVGcm9tVmlld0RhdGEobFZpZXdEYXRhLCBpbmRleCkgITtcbiAgICAgICAgICBjb25zdCBjb250ZXh0ID0gY3JlYXRlTENvbnRleHQobFZpZXdEYXRhLCBpbmRleCwgbE5vZGUubmF0aXZlKTtcbiAgICAgICAgICBhdHRhY2hQYXRjaERhdGEobE5vZGUubmF0aXZlLCBjb250ZXh0KTtcbiAgICAgICAgICBtcFZhbHVlID0gY29udGV4dDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gKG1wVmFsdWUgYXMgTENvbnRleHQpIHx8IG51bGw7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlbXB0eSBpbnN0YW5jZSBvZiBhIGBMQ29udGV4dGAgY29udGV4dFxuICovXG5mdW5jdGlvbiBjcmVhdGVMQ29udGV4dChsVmlld0RhdGE6IExWaWV3RGF0YSwgbE5vZGVJbmRleDogbnVtYmVyLCBuYXRpdmU6IFJFbGVtZW50KTogTENvbnRleHQge1xuICByZXR1cm4ge1xuICAgIGxWaWV3RGF0YSxcbiAgICBub2RlSW5kZXg6IGxOb2RlSW5kZXgsIG5hdGl2ZSxcbiAgICBjb21wb25lbnQ6IHVuZGVmaW5lZCxcbiAgICBkaXJlY3RpdmVzOiB1bmRlZmluZWQsXG4gICAgbG9jYWxSZWZzOiB1bmRlZmluZWQsXG4gIH07XG59XG5cbi8qKlxuICogQSBzaW1wbGlmaWVkIGxvb2t1cCBmdW5jdGlvbiBmb3IgZmluZGluZyB0aGUgTEVsZW1lbnROb2RlIGZyb20gYSBjb21wb25lbnQgaW5zdGFuY2UuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBleGlzdHMgZm9yIHRyZWUtc2hha2luZyBwdXJwb3NlcyB0byBhdm9pZCBoYXZpbmcgdG8gcHVsbCBpbiBldmVyeXRoaW5nXG4gKiB0aGF0IGBnZXRDb250ZXh0YCBoYXMgaW4gdGhlIGV2ZW50IHRoYXQgYW4gQW5ndWxhciBhcHBsaWNhdGlvbiBkb2Vzbid0IG5lZWQgdG8gaGF2ZVxuICogYW55IHByb2dyYW1tYXRpYyBhY2Nlc3MgdG8gYW4gZWxlbWVudCdzIGNvbnRleHQgKG9ubHkgY2hhbmdlIGRldGVjdGlvbiB1c2VzIHRoaXMgZnVuY3Rpb24pLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TEVsZW1lbnRGcm9tQ29tcG9uZW50KGNvbXBvbmVudEluc3RhbmNlOiB7fSk6IExFbGVtZW50Tm9kZSB7XG4gIGxldCBsVmlld0RhdGEgPSByZWFkUGF0Y2hlZERhdGEoY29tcG9uZW50SW5zdGFuY2UpO1xuICBsZXQgbE5vZGU6IExFbGVtZW50Tm9kZTtcblxuICBpZiAoQXJyYXkuaXNBcnJheShsVmlld0RhdGEpKSB7XG4gICAgY29uc3QgbE5vZGVJbmRleCA9IGZpbmRWaWFDb21wb25lbnQobFZpZXdEYXRhLCBjb21wb25lbnRJbnN0YW5jZSk7XG4gICAgbE5vZGUgPSByZWFkRWxlbWVudFZhbHVlKGxWaWV3RGF0YVtsTm9kZUluZGV4XSk7XG4gICAgY29uc3QgY29udGV4dCA9IGNyZWF0ZUxDb250ZXh0KGxWaWV3RGF0YSwgbE5vZGVJbmRleCwgbE5vZGUubmF0aXZlKTtcbiAgICBjb250ZXh0LmNvbXBvbmVudCA9IGNvbXBvbmVudEluc3RhbmNlO1xuICAgIGF0dGFjaFBhdGNoRGF0YShjb21wb25lbnRJbnN0YW5jZSwgY29udGV4dCk7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKGNvbnRleHQubmF0aXZlLCBjb250ZXh0KTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBjb250ZXh0ID0gbFZpZXdEYXRhIGFzIGFueSBhcyBMQ29udGV4dDtcbiAgICBsTm9kZSA9IHJlYWRFbGVtZW50VmFsdWUoY29udGV4dC5sVmlld0RhdGFbY29udGV4dC5ub2RlSW5kZXhdKTtcbiAgfVxuXG4gIHJldHVybiBsTm9kZTtcbn1cblxuLyoqXG4gKiBBc3NpZ25zIHRoZSBnaXZlbiBkYXRhIHRvIHRoZSBnaXZlbiB0YXJnZXQgKHdoaWNoIGNvdWxkIGJlIGEgY29tcG9uZW50LFxuICogZGlyZWN0aXZlIG9yIERPTSBub2RlIGluc3RhbmNlKSB1c2luZyBtb25rZXktcGF0Y2hpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hQYXRjaERhdGEodGFyZ2V0OiBhbnksIGRhdGE6IExWaWV3RGF0YSB8IExDb250ZXh0KSB7XG4gIHRhcmdldFtNT05LRVlfUEFUQ0hfS0VZX05BTUVdID0gZGF0YTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBtb25rZXktcGF0Y2ggdmFsdWUgZGF0YSBwcmVzZW50IG9uIHRoZSB0YXJnZXQgKHdoaWNoIGNvdWxkIGJlXG4gKiBhIGNvbXBvbmVudCwgZGlyZWN0aXZlIG9yIGEgRE9NIG5vZGUpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZFBhdGNoZWREYXRhKHRhcmdldDogYW55KTogTFZpZXdEYXRhfExDb250ZXh0fG51bGwge1xuICByZXR1cm4gdGFyZ2V0W01PTktFWV9QQVRDSF9LRVlfTkFNRV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkUGF0Y2hlZExWaWV3RGF0YSh0YXJnZXQ6IGFueSk6IExWaWV3RGF0YXxudWxsIHtcbiAgY29uc3QgdmFsdWUgPSByZWFkUGF0Y2hlZERhdGEodGFyZ2V0KTtcbiAgaWYgKHZhbHVlKSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWUgOiAodmFsdWUgYXMgTENvbnRleHQpLmxWaWV3RGF0YTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29tcG9uZW50SW5zdGFuY2UoaW5zdGFuY2U6IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gaW5zdGFuY2UgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IubmdDb21wb25lbnREZWY7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0RpcmVjdGl2ZUluc3RhbmNlKGluc3RhbmNlOiBhbnkpOiBib29sZWFuIHtcbiAgcmV0dXJuIGluc3RhbmNlICYmIGluc3RhbmNlLmNvbnN0cnVjdG9yICYmIGluc3RhbmNlLmNvbnN0cnVjdG9yLm5nRGlyZWN0aXZlRGVmO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGVsZW1lbnQgd2l0aGluIHRoZSBnaXZlbiBMVmlld0RhdGEgYW5kIHJldHVybnMgdGhlIG1hdGNoaW5nIGluZGV4XG4gKi9cbmZ1bmN0aW9uIGZpbmRWaWFOYXRpdmVFbGVtZW50KGxWaWV3RGF0YTogTFZpZXdEYXRhLCBuYXRpdmU6IFJFbGVtZW50KTogbnVtYmVyIHtcbiAgbGV0IHROb2RlID0gbFZpZXdEYXRhW1RWSUVXXS5maXJzdENoaWxkO1xuICB3aGlsZSAodE5vZGUpIHtcbiAgICBjb25zdCBsTm9kZSA9IGdldExOb2RlRnJvbVZpZXdEYXRhKGxWaWV3RGF0YSwgdE5vZGUuaW5kZXgpICE7XG4gICAgaWYgKGxOb2RlLm5hdGl2ZSA9PT0gbmF0aXZlKSB7XG4gICAgICByZXR1cm4gdE5vZGUuaW5kZXg7XG4gICAgfVxuICAgIHROb2RlID0gdHJhdmVyc2VOZXh0RWxlbWVudCh0Tm9kZSk7XG4gIH1cblxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuICogTG9jYXRlcyB0aGUgbmV4dCB0Tm9kZSAoY2hpbGQsIHNpYmxpbmcgb3IgcGFyZW50KS5cbiAqL1xuZnVuY3Rpb24gdHJhdmVyc2VOZXh0RWxlbWVudCh0Tm9kZTogVE5vZGUpOiBUTm9kZXxudWxsIHtcbiAgaWYgKHROb2RlLmNoaWxkKSB7XG4gICAgcmV0dXJuIHROb2RlLmNoaWxkO1xuICB9IGVsc2UgaWYgKHROb2RlLm5leHQpIHtcbiAgICByZXR1cm4gdE5vZGUubmV4dDtcbiAgfSBlbHNlIGlmICh0Tm9kZS5wYXJlbnQpIHtcbiAgICByZXR1cm4gdE5vZGUucGFyZW50Lm5leHQgfHwgbnVsbDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBjb21wb25lbnQgd2l0aGluIHRoZSBnaXZlbiBMVmlld0RhdGEgYW5kIHJldHVybnMgdGhlIG1hdGNoaW5nIGluZGV4XG4gKi9cbmZ1bmN0aW9uIGZpbmRWaWFDb21wb25lbnQobFZpZXdEYXRhOiBMVmlld0RhdGEsIGNvbXBvbmVudEluc3RhbmNlOiB7fSk6IG51bWJlciB7XG4gIGNvbnN0IGNvbXBvbmVudEluZGljZXMgPSBsVmlld0RhdGFbVFZJRVddLmNvbXBvbmVudHM7XG4gIGlmIChjb21wb25lbnRJbmRpY2VzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wb25lbnRJbmRpY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbGVtZW50Q29tcG9uZW50SW5kZXggPSBjb21wb25lbnRJbmRpY2VzW2ldO1xuICAgICAgY29uc3QgbE5vZGVEYXRhID0gcmVhZEVsZW1lbnRWYWx1ZShsVmlld0RhdGFbZWxlbWVudENvbXBvbmVudEluZGV4XSAhKS5kYXRhICE7XG4gICAgICBpZiAobE5vZGVEYXRhW0NPTlRFWFRdID09PSBjb21wb25lbnRJbnN0YW5jZSkge1xuICAgICAgICByZXR1cm4gZWxlbWVudENvbXBvbmVudEluZGV4O1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCByb290Tm9kZSA9IGxWaWV3RGF0YVtIRUFERVJfT0ZGU0VUXTtcbiAgICBjb25zdCByb290Q29tcG9uZW50ID0gcm9vdE5vZGUuZGF0YVtDT05URVhUXTtcbiAgICBpZiAocm9vdENvbXBvbmVudCA9PT0gY29tcG9uZW50SW5zdGFuY2UpIHtcbiAgICAgIC8vIHdlIGFyZSBkZWFsaW5nIHdpdGggdGhlIHJvb3QgZWxlbWVudCBoZXJlIHRoZXJlZm9yZSB3ZSBrbm93IHRoYXQgdGhlXG4gICAgICAvLyBlbGVtZW50IGlzIHRoZSB2ZXJ5IGZpcnN0IGVsZW1lbnQgYWZ0ZXIgdGhlIEhFQURFUiBkYXRhIGluIHRoZSBsVmlld1xuICAgICAgcmV0dXJuIEhFQURFUl9PRkZTRVQ7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBkaXJlY3RpdmUgd2l0aGluIHRoZSBnaXZlbiBMVmlld0RhdGEgYW5kIHJldHVybnMgdGhlIG1hdGNoaW5nIGluZGV4XG4gKi9cbmZ1bmN0aW9uIGZpbmRWaWFEaXJlY3RpdmUobFZpZXdEYXRhOiBMVmlld0RhdGEsIGRpcmVjdGl2ZUluc3RhbmNlOiB7fSk6IG51bWJlciB7XG4gIC8vIGlmIGEgZGlyZWN0aXZlIGlzIG1vbmtleSBwYXRjaGVkIHRoZW4gaXQgd2lsbCAoYnkgZGVmYXVsdClcbiAgLy8gaGF2ZSBhIHJlZmVyZW5jZSB0byB0aGUgTFZpZXdEYXRhIG9mIHRoZSBjdXJyZW50IHZpZXcuIFRoZVxuICAvLyBlbGVtZW50IGJvdW5kIHRvIHRoZSBkaXJlY3RpdmUgYmVpbmcgc2VhcmNoIGxpdmVzIHNvbWV3aGVyZVxuICAvLyBpbiB0aGUgdmlldyBkYXRhLiBXZSBsb29wIHRocm91Z2ggdGhlIG5vZGVzIGFuZCBjaGVjayB0aGVpclxuICAvLyBsaXN0IG9mIGRpcmVjdGl2ZXMgZm9yIHRoZSBpbnN0YW5jZS5cbiAgbGV0IHROb2RlID0gbFZpZXdEYXRhW1RWSUVXXS5maXJzdENoaWxkO1xuICB3aGlsZSAodE5vZGUpIHtcbiAgICBjb25zdCBkaXJlY3RpdmVJbmRleFN0YXJ0ID0gZ2V0RGlyZWN0aXZlU3RhcnRJbmRleCh0Tm9kZSk7XG4gICAgY29uc3QgZGlyZWN0aXZlSW5kZXhFbmQgPSBnZXREaXJlY3RpdmVFbmRJbmRleCh0Tm9kZSwgZGlyZWN0aXZlSW5kZXhTdGFydCk7XG4gICAgZm9yIChsZXQgaSA9IGRpcmVjdGl2ZUluZGV4U3RhcnQ7IGkgPCBkaXJlY3RpdmVJbmRleEVuZDsgaSsrKSB7XG4gICAgICBpZiAobFZpZXdEYXRhW2ldID09PSBkaXJlY3RpdmVJbnN0YW5jZSkge1xuICAgICAgICByZXR1cm4gdE5vZGUuaW5kZXg7XG4gICAgICB9XG4gICAgfVxuICAgIHROb2RlID0gdHJhdmVyc2VOZXh0RWxlbWVudCh0Tm9kZSk7XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG5mdW5jdGlvbiBhc3NlcnREb21FbGVtZW50KGVsZW1lbnQ6IGFueSkge1xuICBhc3NlcnRFcXVhbChlbGVtZW50Lm5vZGVUeXBlLCAxLCAnVGhlIHByb3ZpZGVkIHZhbHVlIG11c3QgYmUgYW4gaW5zdGFuY2Ugb2YgYW4gSFRNTEVsZW1lbnQnKTtcbn1cblxuLyoqXG4gKiBSZXRydW5zIHRoZSBpbnN0YW5jZSBvZiB0aGUgTEVsZW1lbnROb2RlIGF0IHRoZSBnaXZlbiBpbmRleCBpbiB0aGUgTFZpZXdEYXRhLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBhbHNvIHVud3JhcCB0aGUgaW5uZXIgdmFsdWUgaW5jYXNlIGl0J3Mgc3R1ZmZlZCBpbnRvIGFuXG4gKiBhcnJheSAod2hpY2ggaXMgd2hhdCBoYXBwZW5zIHdoZW4gW3N0eWxlXSBhbmQgW2NsYXNzXSBiaW5kaW5ncyBhcmUgcHJlc2VudFxuICogaW4gdGhlIHZpZXcgaW5zdHJ1Y3Rpb25zIGZvciB0aGUgZWxlbWVudCBiZWluZyByZXR1cm5lZCkuXG4gKi9cbmZ1bmN0aW9uIGdldExOb2RlRnJvbVZpZXdEYXRhKGxWaWV3RGF0YTogTFZpZXdEYXRhLCBsRWxlbWVudEluZGV4OiBudW1iZXIpOiBMRWxlbWVudE5vZGV8bnVsbCB7XG4gIGNvbnN0IHZhbHVlID0gbFZpZXdEYXRhW2xFbGVtZW50SW5kZXhdO1xuICByZXR1cm4gdmFsdWUgPyByZWFkRWxlbWVudFZhbHVlKHZhbHVlKSA6IG51bGw7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIGxpc3Qgb2YgZGlyZWN0aXZlcyBleHRyYWN0ZWQgZnJvbSB0aGUgZ2l2ZW4gdmlldyBiYXNlZCBvbiB0aGVcbiAqIHByb3ZpZGVkIGxpc3Qgb2YgZGlyZWN0aXZlIGluZGV4IHZhbHVlcy5cbiAqXG4gKiBAcGFyYW0gbm9kZUluZGV4IFRoZSBub2RlIGluZGV4XG4gKiBAcGFyYW0gbFZpZXdEYXRhIFRoZSB0YXJnZXQgdmlldyBkYXRhXG4gKiBAcGFyYW0gaW5jbHVkZUNvbXBvbmVudHMgV2hldGhlciBvciBub3QgdG8gaW5jbHVkZSBjb21wb25lbnRzIGluIHJldHVybmVkIGRpcmVjdGl2ZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpc2NvdmVyRGlyZWN0aXZlcyhcbiAgICBub2RlSW5kZXg6IG51bWJlciwgbFZpZXdEYXRhOiBMVmlld0RhdGEsIGluY2x1ZGVDb21wb25lbnRzOiBib29sZWFuKTogYW55W118bnVsbCB7XG4gIGNvbnN0IHROb2RlID0gbFZpZXdEYXRhW1RWSUVXXS5kYXRhW25vZGVJbmRleF0gYXMgVE5vZGU7XG4gIGxldCBkaXJlY3RpdmVTdGFydEluZGV4ID0gZ2V0RGlyZWN0aXZlU3RhcnRJbmRleCh0Tm9kZSk7XG4gIGNvbnN0IGRpcmVjdGl2ZUVuZEluZGV4ID0gZ2V0RGlyZWN0aXZlRW5kSW5kZXgodE5vZGUsIGRpcmVjdGl2ZVN0YXJ0SW5kZXgpO1xuICBpZiAoIWluY2x1ZGVDb21wb25lbnRzICYmIHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCkgZGlyZWN0aXZlU3RhcnRJbmRleCsrO1xuICByZXR1cm4gbFZpZXdEYXRhLnNsaWNlKGRpcmVjdGl2ZVN0YXJ0SW5kZXgsIGRpcmVjdGl2ZUVuZEluZGV4KTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbWFwIG9mIGxvY2FsIHJlZmVyZW5jZXMgKGxvY2FsIHJlZmVyZW5jZSBuYW1lID0+IGVsZW1lbnQgb3IgZGlyZWN0aXZlIGluc3RhbmNlKSB0aGF0XG4gKiBleGlzdCBvbiBhIGdpdmVuIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXNjb3ZlckxvY2FsUmVmcyhsVmlld0RhdGE6IExWaWV3RGF0YSwgbE5vZGVJbmRleDogbnVtYmVyKToge1trZXk6IHN0cmluZ106IGFueX18XG4gICAgbnVsbCB7XG4gIGNvbnN0IHROb2RlID0gbFZpZXdEYXRhW1RWSUVXXS5kYXRhW2xOb2RlSW5kZXhdIGFzIFROb2RlO1xuICBpZiAodE5vZGUgJiYgdE5vZGUubG9jYWxOYW1lcykge1xuICAgIGNvbnN0IHJlc3VsdDoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHROb2RlLmxvY2FsTmFtZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGxvY2FsUmVmTmFtZSA9IHROb2RlLmxvY2FsTmFtZXNbaV07XG4gICAgICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IHROb2RlLmxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIHJlc3VsdFtsb2NhbFJlZk5hbWVdID0gZGlyZWN0aXZlSW5kZXggPT09IC0xID9cbiAgICAgICAgICBnZXRMTm9kZUZyb21WaWV3RGF0YShsVmlld0RhdGEsIGxOb2RlSW5kZXgpICEubmF0aXZlIDpcbiAgICAgICAgICBsVmlld0RhdGFbZGlyZWN0aXZlSW5kZXhdO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGdldERpcmVjdGl2ZVN0YXJ0SW5kZXgodE5vZGU6IFROb2RlKTogbnVtYmVyIHtcbiAgLy8gdGhlIHROb2RlIGluc3RhbmNlcyBzdG9yZSBhIGZsYWcgdmFsdWUgd2hpY2ggdGhlbiBoYXMgYVxuICAvLyBwb2ludGVyIHdoaWNoIHRlbGxzIHRoZSBzdGFydGluZyBpbmRleCBvZiB3aGVyZSBhbGwgdGhlXG4gIC8vIGFjdGl2ZSBkaXJlY3RpdmVzIGFyZSBpbiB0aGUgbWFzdGVyIGRpcmVjdGl2ZSBhcnJheVxuICByZXR1cm4gdE5vZGUuZmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG59XG5cbmZ1bmN0aW9uIGdldERpcmVjdGl2ZUVuZEluZGV4KHROb2RlOiBUTm9kZSwgc3RhcnRJbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgLy8gVGhlIGVuZCB2YWx1ZSBpcyBhbHNvIGEgcGFydCBvZiB0aGUgc2FtZSBmbGFnXG4gIC8vIChzZWUgYFROb2RlRmxhZ3NgIHRvIHNlZSBob3cgdGhlIGZsYWcgYml0IHNoaWZ0aW5nXG4gIC8vIHZhbHVlcyBhcmUgdXNlZCkuXG4gIGNvbnN0IGNvdW50ID0gdE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaztcbiAgcmV0dXJuIGNvdW50ID8gKHN0YXJ0SW5kZXggKyBjb3VudCkgOiAtMTtcbn1cblxuLyoqXG4gKiBUYWtlcyB0aGUgdmFsdWUgb2YgYSBzbG90IGluIGBMVmlld0RhdGFgIGFuZCByZXR1cm5zIHRoZSBlbGVtZW50IG5vZGUuXG4gKlxuICogTm9ybWFsbHksIGVsZW1lbnQgbm9kZXMgYXJlIHN0b3JlZCBmbGF0LCBidXQgaWYgdGhlIG5vZGUgaGFzIHN0eWxlcy9jbGFzc2VzIG9uIGl0LFxuICogaXQgbWlnaHQgYmUgd3JhcHBlZCBpbiBhIHN0eWxpbmcgY29udGV4dC4gT3IgaWYgdGhhdCBub2RlIGhhcyBhIGRpcmVjdGl2ZSB0aGF0IGluamVjdHNcbiAqIFZpZXdDb250YWluZXJSZWYsIGl0IG1heSBiZSB3cmFwcGVkIGluIGFuIExDb250YWluZXIuXG4gKlxuICogQHBhcmFtIHZhbHVlIFRoZSBpbml0aWFsIHZhbHVlIGluIGBMVmlld0RhdGFgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkRWxlbWVudFZhbHVlKHZhbHVlOiBMRWxlbWVudE5vZGUgfCBTdHlsaW5nQ29udGV4dCB8IExDb250YWluZXIpOiBMRWxlbWVudE5vZGUge1xuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlW0FDVElWRV9JTkRFWF0gPT09ICdudW1iZXInKSB7XG4gICAgICAvLyBUaGlzIGlzIGFuIExDb250YWluZXIuIEl0IG1heSBhbHNvIGhhdmUgYSBzdHlsaW5nIGNvbnRleHQuXG4gICAgICB2YWx1ZSA9IHZhbHVlW0hPU1RfTkFUSVZFXSBhcyBMRWxlbWVudE5vZGUgfCBTdHlsaW5nQ29udGV4dDtcbiAgICAgIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlW1N0eWxpbmdJbmRleC5FbGVtZW50UG9zaXRpb25dICEgOiB2YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVGhpcyBpcyBhIFN0eWxpbmdDb250ZXh0LCB3aGljaCBzdG9yZXMgdGhlIGVsZW1lbnQgbm9kZSBhdCAwLlxuICAgICAgcmV0dXJuIHZhbHVlW1N0eWxpbmdJbmRleC5FbGVtZW50UG9zaXRpb25dIGFzIExFbGVtZW50Tm9kZTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHZhbHVlOyAgLy8gUmVndWxhciBMTm9kZSBpcyBzdG9yZWQgaGVyZVxuICB9XG59XG4iXX0=