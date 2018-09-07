/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import './ng_dev_mode';
import { assertEqual } from './assert';
import { CONTEXT, DIRECTIVES, HEADER_OFFSET, TVIEW } from './interfaces/view';
import { readElementValue } from './util';
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
 * The component\'s view data
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
 * @param {?} componentInstance
 * @return {?}
 */
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
 * @param {?} componentInstance
 * @param {?=} expectedLNodeIndex
 * @return {?}
 */
export function getLElementFromComponent(componentInstance, expectedLNodeIndex) {
    /** @type {?} */
    let lViewData = readPatchedData(componentInstance);
    /** @type {?} */
    let lNode;
    if (Array.isArray(lViewData)) {
        expectedLNodeIndex = expectedLNodeIndex || findViaComponent(lViewData, componentInstance);
        lNode = readElementValue(lViewData[expectedLNodeIndex]);
        /** @type {?} */
        const context = createLContext(lViewData, expectedLNodeIndex, lNode.native);
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
            const lNode = /** @type {?} */ ((getLNodeFromViewData(lViewData, tNode.index)));
            /** @type {?} */
            const directiveIndexStart = getDirectiveStartIndex(lNode);
            /** @type {?} */
            const directiveIndexEnd = getDirectiveEndIndex(lNode, directiveIndexStart);
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
 * @return {?}
 */
function discoverDirectiveIndices(lViewData, lNodeIndex) {
    /** @type {?} */
    const directivesAcrossView = lViewData[DIRECTIVES];
    /** @type {?} */
    const lNode = getLNodeFromViewData(lViewData, lNodeIndex);
    if (lNode && directivesAcrossView && directivesAcrossView.length) {
        /** @type {?} */
        const directiveIndexStart = getDirectiveStartIndex(lNode);
        /** @type {?} */
        const directiveIndexEnd = getDirectiveEndIndex(lNode, directiveIndexStart);
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
 * @param {?} lViewData
 * @param {?} directiveIndices
 * @return {?}
 */
function discoverDirectives(lViewData, directiveIndices) {
    /** @type {?} */
    const directives = [];
    /** @type {?} */
    const directiveInstances = lViewData[DIRECTIVES];
    if (directiveInstances) {
        for (let i = 0; i < directiveIndices.length; i++) {
            /** @type {?} */
            const directiveIndex = directiveIndices[i];
            /** @type {?} */
            const directive = directiveInstances[directiveIndex];
            directives.push(directive);
        }
    }
    return directives;
}
/**
 * @param {?} lNode
 * @return {?}
 */
function getDirectiveStartIndex(lNode) {
    // the tNode instances store a flag value which then has a
    // pointer which tells the starting index of where all the
    // active directives are in the master directive array
    return lNode.tNode.flags >> 15 /* DirectiveStartingIndexShift */;
}
/**
 * @param {?} lNode
 * @param {?} startIndex
 * @return {?}
 */
function getDirectiveEndIndex(lNode, startIndex) {
    /** @type {?} */
    const count = lNode.tNode.flags & 4095 /* DirectiveCountMask */;
    return count ? (startIndex + count) : -1;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9kaXNjb3ZlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2NvbnRleHRfZGlzY292ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFPQSxPQUFPLGVBQWUsQ0FBQztBQUV2QixPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBR3JDLE9BQU8sRUFBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLGFBQWEsRUFBYSxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN2RixPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxRQUFRLENBQUM7Ozs7QUFLeEMsYUFBYSxxQkFBcUIsR0FBRyxlQUFlLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlEckQsTUFBTSxVQUFVLFVBQVUsQ0FBQyxNQUFXOztJQUNwQyxJQUFJLE9BQU8sR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdEMsSUFBSSxPQUFPLEVBQUU7OztRQUdYLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRTs7WUFDMUIsTUFBTSxTQUFTLHNCQUFjLE9BQU8sR0FBRzs7WUFDdkMsSUFBSSxVQUFVLENBQVM7O1lBQ3ZCLElBQUksU0FBUyxHQUFRLFNBQVMsQ0FBQzs7WUFDL0IsSUFBSSxnQkFBZ0IsR0FBNEIsU0FBUyxDQUFDOztZQUMxRCxJQUFJLFVBQVUsR0FBeUIsU0FBUyxDQUFDO1lBRWpELElBQUksbUJBQW1CLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQy9CLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ2pELElBQUksVUFBVSxJQUFJLENBQUMsQ0FBQyxFQUFFO29CQUNwQixNQUFNLElBQUksS0FBSyxDQUFD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aEUsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUMxQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCAnLi9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7YXNzZXJ0RXF1YWx9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7TEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Q09OVEVYVCwgRElSRUNUSVZFUywgSEVBREVSX09GRlNFVCwgTFZpZXdEYXRhLCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtyZWFkRWxlbWVudFZhbHVlfSBmcm9tICcuL3V0aWwnO1xuXG4vKipcbiAqIFRoaXMgcHJvcGVydHkgd2lsbCBiZSBtb25rZXktcGF0Y2hlZCBvbiBlbGVtZW50cywgY29tcG9uZW50cyBhbmQgZGlyZWN0aXZlc1xuICovXG5leHBvcnQgY29uc3QgTU9OS0VZX1BBVENIX0tFWV9OQU1FID0gJ19fbmdDb250ZXh0X18nO1xuXG4vKipcbiAqIFRoZSBpbnRlcm5hbCB2aWV3IGNvbnRleHQgd2hpY2ggaXMgc3BlY2lmaWMgdG8gYSBnaXZlbiBET00gZWxlbWVudCwgZGlyZWN0aXZlIG9yXG4gKiBjb21wb25lbnQgaW5zdGFuY2UuIEVhY2ggdmFsdWUgaW4gaGVyZSAoYmVzaWRlcyB0aGUgTFZpZXdEYXRhIGFuZCBlbGVtZW50IG5vZGUgZGV0YWlscylcbiAqIGNhbiBiZSBwcmVzZW50LCBudWxsIG9yIHVuZGVmaW5lZC4gSWYgdW5kZWZpbmVkIHRoZW4gaXQgaW1wbGllcyB0aGUgdmFsdWUgaGFzIG5vdCBiZWVuXG4gKiBsb29rZWQgdXAgeWV0LCBvdGhlcndpc2UsIGlmIG51bGwsIHRoZW4gYSBsb29rdXAgd2FzIGV4ZWN1dGVkIGFuZCBub3RoaW5nIHdhcyBmb3VuZC5cbiAqXG4gKiBFYWNoIHZhbHVlIHdpbGwgZ2V0IGZpbGxlZCB3aGVuIHRoZSByZXNwZWN0aXZlIHZhbHVlIGlzIGV4YW1pbmVkIHdpdGhpbiB0aGUgZ2V0Q29udGV4dFxuICogZnVuY3Rpb24uIFRoZSBjb21wb25lbnQsIGVsZW1lbnQgYW5kIGVhY2ggZGlyZWN0aXZlIGluc3RhbmNlIHdpbGwgc2hhcmUgdGhlIHNhbWUgaW5zdGFuY2VcbiAqIG9mIHRoZSBjb250ZXh0LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIExDb250ZXh0IHtcbiAgLyoqIFRoZSBjb21wb25lbnRcXCdzIHZpZXcgZGF0YSAqL1xuICBsVmlld0RhdGE6IExWaWV3RGF0YTtcblxuICAvKiogVGhlIGluZGV4IGluc3RhbmNlIG9mIHRoZSBMTm9kZSAqL1xuICBsTm9kZUluZGV4OiBudW1iZXI7XG5cbiAgLyoqIFRoZSBpbnN0YW5jZSBvZiB0aGUgRE9NIG5vZGUgdGhhdCBpcyBhdHRhY2hlZCB0byB0aGUgbE5vZGUgKi9cbiAgbmF0aXZlOiBSRWxlbWVudDtcblxuICAvKiogVGhlIGluc3RhbmNlIG9mIHRoZSBDb21wb25lbnQgbm9kZSAqL1xuICBjb21wb25lbnQ6IHt9fG51bGx8dW5kZWZpbmVkO1xuXG4gIC8qKiBUaGUgbGlzdCBvZiBpbmRpY2VzIGZvciB0aGUgYWN0aXZlIGRpcmVjdGl2ZXMgdGhhdCBleGlzdCBvbiB0aGlzIGVsZW1lbnQgKi9cbiAgZGlyZWN0aXZlSW5kaWNlczogbnVtYmVyW118bnVsbHx1bmRlZmluZWQ7XG5cbiAgLyoqIFRoZSBsaXN0IG9mIGFjdGl2ZSBkaXJlY3RpdmVzIHRoYXQgZXhpc3Qgb24gdGhpcyBlbGVtZW50ICovXG4gIGRpcmVjdGl2ZXM6IEFycmF5PHt9PnxudWxsfHVuZGVmaW5lZDtcbn1cblxuLyoqIFJldHVybnMgdGhlIG1hdGNoaW5nIGBMQ29udGV4dGAgZGF0YSBmb3IgYSBnaXZlbiBET00gbm9kZSwgZGlyZWN0aXZlIG9yIGNvbXBvbmVudCBpbnN0YW5jZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgZXhhbWluZSB0aGUgcHJvdmlkZWQgRE9NIGVsZW1lbnQsIGNvbXBvbmVudCwgb3IgZGlyZWN0aXZlIGluc3RhbmNlXFwnc1xuICogbW9ua2V5LXBhdGNoZWQgcHJvcGVydHkgdG8gZGVyaXZlIHRoZSBgTENvbnRleHRgIGRhdGEuIE9uY2UgY2FsbGVkIHRoZW4gdGhlIG1vbmtleS1wYXRjaGVkXG4gKiB2YWx1ZSB3aWxsIGJlIHRoYXQgb2YgdGhlIG5ld2x5IGNyZWF0ZWQgYExDb250ZXh0YC5cbiAqXG4gKiBJZiB0aGUgbW9ua2V5LXBhdGNoZWQgdmFsdWUgaXMgdGhlIGBMVmlld0RhdGFgIGluc3RhbmNlIHRoZW4gdGhlIGNvbnRleHQgdmFsdWUgZm9yIHRoYXRcbiAqIHRhcmdldCB3aWxsIGJlIGNyZWF0ZWQgYW5kIHRoZSBtb25rZXktcGF0Y2ggcmVmZXJlbmNlIHdpbGwgYmUgdXBkYXRlZC4gVGhlcmVmb3JlIHdoZW4gdGhpc1xuICogZnVuY3Rpb24gaXMgY2FsbGVkIGl0IG1heSBtdXRhdGUgdGhlIHByb3ZpZGVkIGVsZW1lbnRcXCdzLCBjb21wb25lbnRcXCdzIG9yIGFueSBvZiB0aGUgYXNzb2NpYXRlZFxuICogZGlyZWN0aXZlXFwncyBtb25rZXktcGF0Y2ggdmFsdWVzLlxuICpcbiAqIElmIHRoZSBtb25rZXktcGF0Y2ggdmFsdWUgaXMgbm90IGRldGVjdGVkIHRoZW4gdGhlIGNvZGUgd2lsbCB3YWxrIHVwIHRoZSBET00gdW50aWwgYW4gZWxlbWVudFxuICogaXMgZm91bmQgd2hpY2ggY29udGFpbnMgYSBtb25rZXktcGF0Y2ggcmVmZXJlbmNlLiBXaGVuIHRoYXQgb2NjdXJzIHRoZW4gdGhlIHByb3ZpZGVkIGVsZW1lbnRcbiAqIHdpbGwgYmUgdXBkYXRlZCB3aXRoIGEgbmV3IGNvbnRleHQgKHdoaWNoIGlzIHRoZW4gcmV0dXJuZWQpLiBJZiB0aGUgbW9ua2V5LXBhdGNoIHZhbHVlIGlzIG5vdFxuICogZGV0ZWN0ZWQgZm9yIGEgY29tcG9uZW50L2RpcmVjdGl2ZSBpbnN0YW5jZSB0aGVuIGl0IHdpbGwgdGhyb3cgYW4gZXJyb3IgKGFsbCBjb21wb25lbnRzIGFuZFxuICogZGlyZWN0aXZlcyBzaG91bGQgYmUgYXV0b21hdGljYWxseSBtb25rZXktcGF0Y2hlZCBieSBpdnkpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29udGV4dCh0YXJnZXQ6IGFueSk6IExDb250ZXh0fG51bGwge1xuICBsZXQgbXBWYWx1ZSA9IHJlYWRQYXRjaGVkRGF0YSh0YXJnZXQpO1xuICBpZiAobXBWYWx1ZSkge1xuICAgIC8vIG9ubHkgd2hlbiBpdCdzIGFuIGFycmF5IGlzIGl0IGNvbnNpZGVyZWQgYW4gTFZpZXdEYXRhIGluc3RhbmNlXG4gICAgLy8gLi4uIG90aGVyd2lzZSBpdCdzIGFuIGFscmVhZHkgY29uc3RydWN0ZWQgTENvbnRleHQgaW5zdGFuY2VcbiAgICBpZiAoQXJyYXkuaXNBcnJheShtcFZhbHVlKSkge1xuICAgICAgY29uc3QgbFZpZXdEYXRhOiBMVmlld0RhdGEgPSBtcFZhbHVlICE7XG4gICAgICBsZXQgbE5vZGVJbmRleDogbnVtYmVyO1xuICAgICAgbGV0IGNvbXBvbmVudDogYW55ID0gdW5kZWZpbmVkO1xuICAgICAgbGV0IGRpcmVjdGl2ZUluZGljZXM6IG51bWJlcltdfG51bGx8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgbGV0IGRpcmVjdGl2ZXM6IGFueVtdfG51bGx8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gICAgICBpZiAoaXNDb21wb25lbnRJbnN0YW5jZSh0YXJnZXQpKSB7XG4gICAgICAgIGxOb2RlSW5kZXggPSBmaW5kVmlhQ29tcG9uZW50KGxWaWV3RGF0YSwgdGFyZ2V0KTtcbiAgICAgICAgaWYgKGxOb2RlSW5kZXggPT0gLTEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBwcm92aWRlZCBjb21wb25lbnQgd2FzIG5vdCBmb3VuZCBpbiB0aGUgYXBwbGljYXRpb24nKTtcbiAgICAgICAgfVxuICAgICAgICBjb21wb25lbnQgPSB0YXJnZXQ7XG4gICAgICB9IGVsc2UgaWYgKGlzRGlyZWN0aXZlSW5zdGFuY2UodGFyZ2V0KSkge1xuICAgICAgICBsTm9kZUluZGV4ID0gZmluZFZpYURpcmVjdGl2ZShsVmlld0RhdGEsIHRhcmdldCk7XG4gICAgICAgIGlmIChsTm9kZUluZGV4ID09IC0xKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgcHJvdmlkZWQgZGlyZWN0aXZlIHdhcyBub3QgZm91bmQgaW4gdGhlIGFwcGxpY2F0aW9uJyk7XG4gICAgICAgIH1cbiAgICAgICAgZGlyZWN0aXZlSW5kaWNlcyA9IGRpc2NvdmVyRGlyZWN0aXZlSW5kaWNlcyhsVmlld0RhdGEsIGxOb2RlSW5kZXgpO1xuICAgICAgICBkaXJlY3RpdmVzID0gZGlyZWN0aXZlSW5kaWNlcyA/IGRpc2NvdmVyRGlyZWN0aXZlcyhsVmlld0RhdGEsIGRpcmVjdGl2ZUluZGljZXMpIDogbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxOb2RlSW5kZXggPSBmaW5kVmlhTmF0aXZlRWxlbWVudChsVmlld0RhdGEsIHRhcmdldCBhcyBSRWxlbWVudCk7XG4gICAgICAgIGlmIChsTm9kZUluZGV4ID09IC0xKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gdGhlIGdvYWwgaXMgbm90IHRvIGZpbGwgdGhlIGVudGlyZSBjb250ZXh0IGZ1bGwgb2YgZGF0YSBiZWNhdXNlIHRoZSBsb29rdXBzXG4gICAgICAvLyBhcmUgZXhwZW5zaXZlLiBJbnN0ZWFkLCBvbmx5IHRoZSB0YXJnZXQgZGF0YSAodGhlIGVsZW1lbnQsIGNvbXBvbnRlbnQgb3JcbiAgICAgIC8vIGRpcmVjdGl2ZSBkZXRhaWxzKSBhcmUgZmlsbGVkIGludG8gdGhlIGNvbnRleHQuIElmIGNhbGxlZCBtdWx0aXBsZSB0aW1lc1xuICAgICAgLy8gd2l0aCBkaWZmZXJlbnQgdGFyZ2V0IHZhbHVlcyB0aGVuIHRoZSBtaXNzaW5nIHRhcmdldCBkYXRhIHdpbGwgYmUgZmlsbGVkIGluLlxuICAgICAgY29uc3QgbE5vZGUgPSBnZXRMTm9kZUZyb21WaWV3RGF0YShsVmlld0RhdGEsIGxOb2RlSW5kZXgpICE7XG4gICAgICBjb25zdCBleGlzdGluZ0N0eCA9IHJlYWRQYXRjaGVkRGF0YShsTm9kZS5uYXRpdmUpO1xuICAgICAgY29uc3QgY29udGV4dDogTENvbnRleHQgPSAoZXhpc3RpbmdDdHggJiYgIUFycmF5LmlzQXJyYXkoZXhpc3RpbmdDdHgpKSA/XG4gICAgICAgICAgZXhpc3RpbmdDdHggOlxuICAgICAgICAgIGNyZWF0ZUxDb250ZXh0KGxWaWV3RGF0YSwgbE5vZGVJbmRleCwgbE5vZGUubmF0aXZlKTtcblxuICAgICAgLy8gb25seSB3aGVuIHRoZSBjb21wb25lbnQgaGFzIGJlZW4gZGlzY292ZXJlZCB0aGVuIHVwZGF0ZSB0aGUgbW9ua2V5LXBhdGNoXG4gICAgICBpZiAoY29tcG9uZW50ICYmIGNvbnRleHQuY29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGV4dC5jb21wb25lbnQgPSBjb21wb25lbnQ7XG4gICAgICAgIGF0dGFjaFBhdGNoRGF0YShjb250ZXh0LmNvbXBvbmVudCwgY29udGV4dCk7XG4gICAgICB9XG5cbiAgICAgIC8vIG9ubHkgd2hlbiB0aGUgZGlyZWN0aXZlcyBoYXZlIGJlZW4gZGlzY292ZXJlZCB0aGVuIHVwZGF0ZSB0aGUgbW9ua2V5LXBhdGNoXG4gICAgICBpZiAoZGlyZWN0aXZlcyAmJiBkaXJlY3RpdmVJbmRpY2VzICYmIGNvbnRleHQuZGlyZWN0aXZlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRleHQuZGlyZWN0aXZlSW5kaWNlcyA9IGRpcmVjdGl2ZUluZGljZXM7XG4gICAgICAgIGNvbnRleHQuZGlyZWN0aXZlcyA9IGRpcmVjdGl2ZXM7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGF0dGFjaFBhdGNoRGF0YShkaXJlY3RpdmVzW2ldLCBjb250ZXh0KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBhdHRhY2hQYXRjaERhdGEoY29udGV4dC5uYXRpdmUsIGNvbnRleHQpO1xuICAgICAgbXBWYWx1ZSA9IGNvbnRleHQ7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHJFbGVtZW50ID0gdGFyZ2V0IGFzIFJFbGVtZW50O1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREb21FbGVtZW50KHJFbGVtZW50KTtcblxuICAgIC8vIGlmIHRoZSBjb250ZXh0IGlzIG5vdCBmb3VuZCB0aGVuIHdlIG5lZWQgdG8gdHJhdmVyc2UgdXB3YXJkcyB1cCB0aGUgRE9NXG4gICAgLy8gdG8gZmluZCB0aGUgbmVhcmVzdCBlbGVtZW50IHRoYXQgaGFzIGFscmVhZHkgYmVlbiBtb25rZXkgcGF0Y2hlZCB3aXRoIGRhdGFcbiAgICBsZXQgcGFyZW50ID0gckVsZW1lbnQgYXMgYW55O1xuICAgIHdoaWxlIChwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZSkge1xuICAgICAgY29uc3QgcGFyZW50Q29udGV4dCA9IHJlYWRQYXRjaGVkRGF0YShwYXJlbnQpO1xuICAgICAgaWYgKHBhcmVudENvbnRleHQpIHtcbiAgICAgICAgbGV0IGxWaWV3RGF0YTogTFZpZXdEYXRhfG51bGw7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHBhcmVudENvbnRleHQpKSB7XG4gICAgICAgICAgbFZpZXdEYXRhID0gcGFyZW50Q29udGV4dCBhcyBMVmlld0RhdGE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbFZpZXdEYXRhID0gcGFyZW50Q29udGV4dC5sVmlld0RhdGE7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0aGUgZWRnZSBvZiB0aGUgYXBwIHdhcyBhbHNvIHJlYWNoZWQgaGVyZSB0aHJvdWdoIGFub3RoZXIgbWVhbnNcbiAgICAgICAgLy8gKG1heWJlIGJlY2F1c2UgdGhlIERPTSB3YXMgY2hhbmdlZCBtYW51YWxseSkuXG4gICAgICAgIGlmICghbFZpZXdEYXRhKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpbmRleCA9IGZpbmRWaWFOYXRpdmVFbGVtZW50KGxWaWV3RGF0YSwgckVsZW1lbnQpO1xuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgIGNvbnN0IGxOb2RlID0gZ2V0TE5vZGVGcm9tVmlld0RhdGEobFZpZXdEYXRhLCBpbmRleCkgITtcbiAgICAgICAgICBjb25zdCBjb250ZXh0ID0gY3JlYXRlTENvbnRleHQobFZpZXdEYXRhLCBpbmRleCwgbE5vZGUubmF0aXZlKTtcbiAgICAgICAgICBhdHRhY2hQYXRjaERhdGEobE5vZGUubmF0aXZlLCBjb250ZXh0KTtcbiAgICAgICAgICBtcFZhbHVlID0gY29udGV4dDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gKG1wVmFsdWUgYXMgTENvbnRleHQpIHx8IG51bGw7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlbXB0eSBpbnN0YW5jZSBvZiBhIGBMQ29udGV4dGAgY29udGV4dFxuICovXG5mdW5jdGlvbiBjcmVhdGVMQ29udGV4dChsVmlld0RhdGE6IExWaWV3RGF0YSwgbE5vZGVJbmRleDogbnVtYmVyLCBuYXRpdmU6IFJFbGVtZW50KTogTENvbnRleHQge1xuICByZXR1cm4ge1xuICAgIGxWaWV3RGF0YSxcbiAgICBsTm9kZUluZGV4LFxuICAgIG5hdGl2ZSxcbiAgICBjb21wb25lbnQ6IHVuZGVmaW5lZCxcbiAgICBkaXJlY3RpdmVJbmRpY2VzOiB1bmRlZmluZWQsXG4gICAgZGlyZWN0aXZlczogdW5kZWZpbmVkLFxuICB9O1xufVxuXG4vKipcbiAqIEEgdXRpbGl0eSBmdW5jdGlvbiBmb3IgcmV0cmlldmluZyB0aGUgbWF0Y2hpbmcgbEVsZW1lbnROb2RlXG4gKiBmcm9tIGEgZ2l2ZW4gRE9NIGVsZW1lbnQsIGNvbXBvbmVudCBvciBkaXJlY3RpdmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMRWxlbWVudE5vZGUodGFyZ2V0OiBhbnkpOiBMRWxlbWVudE5vZGV8bnVsbCB7XG4gIGNvbnN0IGNvbnRleHQgPSBnZXRDb250ZXh0KHRhcmdldCk7XG4gIHJldHVybiBjb250ZXh0ID8gZ2V0TE5vZGVGcm9tVmlld0RhdGEoY29udGV4dC5sVmlld0RhdGEsIGNvbnRleHQubE5vZGVJbmRleCkgOiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TEVsZW1lbnRGcm9tUm9vdENvbXBvbmVudChjb21wb25lbnRJbnN0YW5jZToge30pOiBMRWxlbWVudE5vZGV8bnVsbCB7XG4gIC8vIHRoZSBob3N0IGVsZW1lbnQgZm9yIHRoZSByb290IGNvbXBvbmVudCBpcyBBTFdBWVMgdGhlIGZpcnN0IGVsZW1lbnRcbiAgLy8gaW4gdGhlIGxWaWV3RGF0YSBhcnJheSAod2hpY2ggaXMgd2hlcmUgSEVBREVSX09GRlNFVCBwb2ludHMgdG8pXG4gIHJldHVybiBnZXRMRWxlbWVudEZyb21Db21wb25lbnQoY29tcG9uZW50SW5zdGFuY2UsIEhFQURFUl9PRkZTRVQpO1xufVxuXG4vKipcbiAqIEEgc2ltcGxpZmllZCBsb29rdXAgZnVuY3Rpb24gZm9yIGZpbmRpbmcgdGhlIExFbGVtZW50Tm9kZSBmcm9tIGEgY29tcG9uZW50IGluc3RhbmNlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gZXhpc3RzIGZvciB0cmVlLXNoYWtpbmcgcHVycG9zZXMgdG8gYXZvaWQgaGF2aW5nIHRvIHB1bGwgaW4gZXZlcnl0aGluZ1xuICogdGhhdCBgZ2V0Q29udGV4dGAgaGFzIGluIHRoZSBldmVudCB0aGF0IGFuIEFuZ3VsYXIgYXBwbGljYXRpb24gZG9lc24ndCBuZWVkIHRvIGhhdmVcbiAqIGFueSBwcm9ncmFtbWF0aWMgYWNjZXNzIHRvIGFuIGVsZW1lbnQncyBjb250ZXh0IChvbmx5IGNoYW5nZSBkZXRlY3Rpb24gdXNlcyB0aGlzIGZ1bmN0aW9uKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExFbGVtZW50RnJvbUNvbXBvbmVudChcbiAgICBjb21wb25lbnRJbnN0YW5jZToge30sIGV4cGVjdGVkTE5vZGVJbmRleD86IG51bWJlcik6IExFbGVtZW50Tm9kZXxudWxsIHtcbiAgbGV0IGxWaWV3RGF0YSA9IHJlYWRQYXRjaGVkRGF0YShjb21wb25lbnRJbnN0YW5jZSk7XG4gIGxldCBsTm9kZTogTEVsZW1lbnROb2RlO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KGxWaWV3RGF0YSkpIHtcbiAgICBleHBlY3RlZExOb2RlSW5kZXggPSBleHBlY3RlZExOb2RlSW5kZXggfHwgZmluZFZpYUNvbXBvbmVudChsVmlld0RhdGEsIGNvbXBvbmVudEluc3RhbmNlKTtcbiAgICBsTm9kZSA9IHJlYWRFbGVtZW50VmFsdWUobFZpZXdEYXRhW2V4cGVjdGVkTE5vZGVJbmRleF0pO1xuICAgIGNvbnN0IGNvbnRleHQgPSBjcmVhdGVMQ29udGV4dChsVmlld0RhdGEsIGV4cGVjdGVkTE5vZGVJbmRleCwgbE5vZGUubmF0aXZlKTtcbiAgICBjb250ZXh0LmNvbXBvbmVudCA9IGNvbXBvbmVudEluc3RhbmNlO1xuICAgIGF0dGFjaFBhdGNoRGF0YShjb21wb25lbnRJbnN0YW5jZSwgY29udGV4dCk7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKGNvbnRleHQubmF0aXZlLCBjb250ZXh0KTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBjb250ZXh0ID0gbFZpZXdEYXRhIGFzIGFueSBhcyBMQ29udGV4dDtcbiAgICBsTm9kZSA9IHJlYWRFbGVtZW50VmFsdWUoY29udGV4dC5sVmlld0RhdGFbY29udGV4dC5sTm9kZUluZGV4XSk7XG4gIH1cblxuICByZXR1cm4gbE5vZGU7XG59XG5cbi8qKlxuICogQXNzaWducyB0aGUgZ2l2ZW4gZGF0YSB0byB0aGUgZ2l2ZW4gdGFyZ2V0ICh3aGljaCBjb3VsZCBiZSBhIGNvbXBvbmVudCxcbiAqIGRpcmVjdGl2ZSBvciBET00gbm9kZSBpbnN0YW5jZSkgdXNpbmcgbW9ua2V5LXBhdGNoaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoUGF0Y2hEYXRhKHRhcmdldDogYW55LCBkYXRhOiBMVmlld0RhdGEgfCBMQ29udGV4dCkge1xuICB0YXJnZXRbTU9OS0VZX1BBVENIX0tFWV9OQU1FXSA9IGRhdGE7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbW9ua2V5LXBhdGNoIHZhbHVlIGRhdGEgcHJlc2VudCBvbiB0aGUgdGFyZ2V0ICh3aGljaCBjb3VsZCBiZVxuICogYSBjb21wb25lbnQsIGRpcmVjdGl2ZSBvciBhIERPTSBub2RlKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRQYXRjaGVkRGF0YSh0YXJnZXQ6IGFueSk6IExWaWV3RGF0YXxMQ29udGV4dHxudWxsIHtcbiAgcmV0dXJuIHRhcmdldFtNT05LRVlfUEFUQ0hfS0VZX05BTUVdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb21wb25lbnRJbnN0YW5jZShpbnN0YW5jZTogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiBpbnN0YW5jZSAmJiBpbnN0YW5jZS5jb25zdHJ1Y3RvciAmJiBpbnN0YW5jZS5jb25zdHJ1Y3Rvci5uZ0NvbXBvbmVudERlZjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRGlyZWN0aXZlSW5zdGFuY2UoaW5zdGFuY2U6IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gaW5zdGFuY2UgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IubmdEaXJlY3RpdmVEZWY7XG59XG5cbi8qKlxuICogTG9jYXRlcyB0aGUgZWxlbWVudCB3aXRoaW4gdGhlIGdpdmVuIExWaWV3RGF0YSBhbmQgcmV0dXJucyB0aGUgbWF0Y2hpbmcgaW5kZXhcbiAqL1xuZnVuY3Rpb24gZmluZFZpYU5hdGl2ZUVsZW1lbnQobFZpZXdEYXRhOiBMVmlld0RhdGEsIG5hdGl2ZTogUkVsZW1lbnQpOiBudW1iZXIge1xuICBsZXQgdE5vZGUgPSBsVmlld0RhdGFbVFZJRVddLmZpcnN0Q2hpbGQ7XG4gIHdoaWxlICh0Tm9kZSkge1xuICAgIGNvbnN0IGxOb2RlID0gZ2V0TE5vZGVGcm9tVmlld0RhdGEobFZpZXdEYXRhLCB0Tm9kZS5pbmRleCkgITtcbiAgICBpZiAobE5vZGUubmF0aXZlID09PSBuYXRpdmUpIHtcbiAgICAgIHJldHVybiB0Tm9kZS5pbmRleDtcbiAgICB9XG4gICAgdE5vZGUgPSB0cmF2ZXJzZU5leHRFbGVtZW50KHROb2RlKTtcbiAgfVxuXG4gIHJldHVybiAtMTtcbn1cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBuZXh0IHROb2RlIChjaGlsZCwgc2libGluZyBvciBwYXJlbnQpLlxuICovXG5mdW5jdGlvbiB0cmF2ZXJzZU5leHRFbGVtZW50KHROb2RlOiBUTm9kZSk6IFROb2RlfG51bGwge1xuICBpZiAodE5vZGUuY2hpbGQpIHtcbiAgICByZXR1cm4gdE5vZGUuY2hpbGQ7XG4gIH0gZWxzZSBpZiAodE5vZGUubmV4dCkge1xuICAgIHJldHVybiB0Tm9kZS5uZXh0O1xuICB9IGVsc2UgaWYgKHROb2RlLnBhcmVudCkge1xuICAgIHJldHVybiB0Tm9kZS5wYXJlbnQubmV4dCB8fCBudWxsO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGNvbXBvbmVudCB3aXRoaW4gdGhlIGdpdmVuIExWaWV3RGF0YSBhbmQgcmV0dXJucyB0aGUgbWF0Y2hpbmcgaW5kZXhcbiAqL1xuZnVuY3Rpb24gZmluZFZpYUNvbXBvbmVudChsVmlld0RhdGE6IExWaWV3RGF0YSwgY29tcG9uZW50SW5zdGFuY2U6IHt9KTogbnVtYmVyIHtcbiAgY29uc3QgY29tcG9uZW50SW5kaWNlcyA9IGxWaWV3RGF0YVtUVklFV10uY29tcG9uZW50cztcbiAgaWYgKGNvbXBvbmVudEluZGljZXMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudEluZGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVsZW1lbnRDb21wb25lbnRJbmRleCA9IGNvbXBvbmVudEluZGljZXNbaV07XG4gICAgICBjb25zdCBsTm9kZURhdGEgPSByZWFkRWxlbWVudFZhbHVlKGxWaWV3RGF0YVtlbGVtZW50Q29tcG9uZW50SW5kZXhdICEpLmRhdGEgITtcbiAgICAgIGlmIChsTm9kZURhdGFbQ09OVEVYVF0gPT09IGNvbXBvbmVudEluc3RhbmNlKSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50Q29tcG9uZW50SW5kZXg7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHJvb3ROb2RlID0gbFZpZXdEYXRhW0hFQURFUl9PRkZTRVRdO1xuICAgIGNvbnN0IHJvb3RDb21wb25lbnQgPSByb290Tm9kZS5kYXRhW0NPTlRFWFRdO1xuICAgIGlmIChyb290Q29tcG9uZW50ID09PSBjb21wb25lbnRJbnN0YW5jZSkge1xuICAgICAgLy8gd2UgYXJlIGRlYWxpbmcgd2l0aCB0aGUgcm9vdCBlbGVtZW50IGhlcmUgdGhlcmVmb3JlIHdlIGtub3cgdGhhdCB0aGVcbiAgICAgIC8vIGVsZW1lbnQgaXMgdGhlIHZlcnkgZmlyc3QgZWxlbWVudCBhZnRlciB0aGUgSEVBREVSIGRhdGEgaW4gdGhlIGxWaWV3XG4gICAgICByZXR1cm4gSEVBREVSX09GRlNFVDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGRpcmVjdGl2ZSB3aXRoaW4gdGhlIGdpdmVuIExWaWV3RGF0YSBhbmQgcmV0dXJucyB0aGUgbWF0Y2hpbmcgaW5kZXhcbiAqL1xuZnVuY3Rpb24gZmluZFZpYURpcmVjdGl2ZShsVmlld0RhdGE6IExWaWV3RGF0YSwgZGlyZWN0aXZlSW5zdGFuY2U6IHt9KTogbnVtYmVyIHtcbiAgLy8gaWYgYSBkaXJlY3RpdmUgaXMgbW9ua2V5IHBhdGNoZWQgdGhlbiBpdCB3aWxsIChieSBkZWZhdWx0KVxuICAvLyBoYXZlIGEgcmVmZXJlbmNlIHRvIHRoZSBMVmlld0RhdGEgb2YgdGhlIGN1cnJlbnQgdmlldy4gVGhlXG4gIC8vIGVsZW1lbnQgYm91bmQgdG8gdGhlIGRpcmVjdGl2ZSBiZWluZyBzZWFyY2ggbGl2ZXMgc29tZXdoZXJlXG4gIC8vIGluIHRoZSB2aWV3IGRhdGEuIEJ5IGZpcnN0IGNoZWNraW5nIHRvIHNlZSBpZiB0aGUgaW5zdGFuY2VcbiAgLy8gaXMgYWN0dWFsbHkgcHJlc2VudCB3ZSBjYW4gbmFycm93IGRvd24gdG8gd2hpY2ggbEVsZW1lbnROb2RlXG4gIC8vIGNvbnRhaW5zIHRoZSBpbnN0YW5jZSBvZiB0aGUgZGlyZWN0aXZlIGFuZCB0aGVuIHJldHVybiB0aGUgaW5kZXhcbiAgY29uc3QgZGlyZWN0aXZlc0Fjcm9zc1ZpZXcgPSBsVmlld0RhdGFbRElSRUNUSVZFU107XG4gIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID1cbiAgICAgIGRpcmVjdGl2ZXNBY3Jvc3NWaWV3ID8gZGlyZWN0aXZlc0Fjcm9zc1ZpZXcuaW5kZXhPZihkaXJlY3RpdmVJbnN0YW5jZSkgOiAtMTtcbiAgaWYgKGRpcmVjdGl2ZUluZGV4ID49IDApIHtcbiAgICBsZXQgdE5vZGUgPSBsVmlld0RhdGFbVFZJRVddLmZpcnN0Q2hpbGQ7XG4gICAgd2hpbGUgKHROb2RlKSB7XG4gICAgICBjb25zdCBsTm9kZSA9IGdldExOb2RlRnJvbVZpZXdEYXRhKGxWaWV3RGF0YSwgdE5vZGUuaW5kZXgpICE7XG4gICAgICBjb25zdCBkaXJlY3RpdmVJbmRleFN0YXJ0ID0gZ2V0RGlyZWN0aXZlU3RhcnRJbmRleChsTm9kZSk7XG4gICAgICBjb25zdCBkaXJlY3RpdmVJbmRleEVuZCA9IGdldERpcmVjdGl2ZUVuZEluZGV4KGxOb2RlLCBkaXJlY3RpdmVJbmRleFN0YXJ0KTtcbiAgICAgIGlmIChkaXJlY3RpdmVJbmRleCA+PSBkaXJlY3RpdmVJbmRleFN0YXJ0ICYmIGRpcmVjdGl2ZUluZGV4IDwgZGlyZWN0aXZlSW5kZXhFbmQpIHtcbiAgICAgICAgcmV0dXJuIHROb2RlLmluZGV4O1xuICAgICAgfVxuICAgICAgdE5vZGUgPSB0cmF2ZXJzZU5leHRFbGVtZW50KHROb2RlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gLTE7XG59XG5cbmZ1bmN0aW9uIGFzc2VydERvbUVsZW1lbnQoZWxlbWVudDogYW55KSB7XG4gIGFzc2VydEVxdWFsKGVsZW1lbnQubm9kZVR5cGUsIDEsICdUaGUgcHJvdmlkZWQgdmFsdWUgbXVzdCBiZSBhbiBpbnN0YW5jZSBvZiBhbiBIVE1MRWxlbWVudCcpO1xufVxuXG4vKipcbiAqIFJldHJ1bnMgdGhlIGluc3RhbmNlIG9mIHRoZSBMRWxlbWVudE5vZGUgYXQgdGhlIGdpdmVuIGluZGV4IGluIHRoZSBMVmlld0RhdGEuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGFsc28gdW53cmFwIHRoZSBpbm5lciB2YWx1ZSBpbmNhc2UgaXQncyBzdHVmZmVkIGludG8gYW5cbiAqIGFycmF5ICh3aGljaCBpcyB3aGF0IGhhcHBlbnMgd2hlbiBbc3R5bGVdIGFuZCBbY2xhc3NdIGJpbmRpbmdzIGFyZSBwcmVzZW50XG4gKiBpbiB0aGUgdmlldyBpbnN0cnVjdGlvbnMgZm9yIHRoZSBlbGVtZW50IGJlaW5nIHJldHVybmVkKS5cbiAqL1xuZnVuY3Rpb24gZ2V0TE5vZGVGcm9tVmlld0RhdGEobFZpZXdEYXRhOiBMVmlld0RhdGEsIGxFbGVtZW50SW5kZXg6IG51bWJlcik6IExFbGVtZW50Tm9kZXxudWxsIHtcbiAgY29uc3QgdmFsdWUgPSBsVmlld0RhdGFbbEVsZW1lbnRJbmRleF07XG4gIHJldHVybiB2YWx1ZSA/IHJlYWRFbGVtZW50VmFsdWUodmFsdWUpIDogbnVsbDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgY29sbGVjdGlvbiBvZiBkaXJlY3RpdmUgaW5kZXggdmFsdWVzIHRoYXQgYXJlIHVzZWQgb24gdGhlIGVsZW1lbnRcbiAqICh3aGljaCBpcyByZWZlcmVuY2VkIGJ5IHRoZSBsTm9kZUluZGV4KVxuICovXG5mdW5jdGlvbiBkaXNjb3ZlckRpcmVjdGl2ZUluZGljZXMobFZpZXdEYXRhOiBMVmlld0RhdGEsIGxOb2RlSW5kZXg6IG51bWJlcik6IG51bWJlcltdfG51bGwge1xuICBjb25zdCBkaXJlY3RpdmVzQWNyb3NzVmlldyA9IGxWaWV3RGF0YVtESVJFQ1RJVkVTXTtcbiAgY29uc3QgbE5vZGUgPSBnZXRMTm9kZUZyb21WaWV3RGF0YShsVmlld0RhdGEsIGxOb2RlSW5kZXgpO1xuICBpZiAobE5vZGUgJiYgZGlyZWN0aXZlc0Fjcm9zc1ZpZXcgJiYgZGlyZWN0aXZlc0Fjcm9zc1ZpZXcubGVuZ3RoKSB7XG4gICAgLy8gdGhpcyBjaGVjayBmb3IgdE5vZGUgaXMgdG8gZGV0ZXJtaW5lIGlmIHRoZSBjYWx1ZSBpcyBhIExFbWVtZW50Tm9kZSBpbnN0YW5jZVxuICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4U3RhcnQgPSBnZXREaXJlY3RpdmVTdGFydEluZGV4KGxOb2RlKTtcbiAgICBjb25zdCBkaXJlY3RpdmVJbmRleEVuZCA9IGdldERpcmVjdGl2ZUVuZEluZGV4KGxOb2RlLCBkaXJlY3RpdmVJbmRleFN0YXJ0KTtcbiAgICBjb25zdCBkaXJlY3RpdmVJbmRpY2VzOiBudW1iZXJbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSBkaXJlY3RpdmVJbmRleFN0YXJ0OyBpIDwgZGlyZWN0aXZlSW5kZXhFbmQ7IGkrKykge1xuICAgICAgLy8gc3BlY2lhbCBjYXNlIHNpbmNlIHRoZSBpbnN0YW5jZSBvZiB0aGUgY29tcG9uZW50IChpZiBpdCBleGlzdHMpXG4gICAgICAvLyBpcyBzdG9yZWQgaW4gdGhlIGRpcmVjdGl2ZXMgYXJyYXkuXG4gICAgICBpZiAoaSA+IGRpcmVjdGl2ZUluZGV4U3RhcnQgfHxcbiAgICAgICAgICAhaXNDb21wb25lbnRJbnN0YW5jZShkaXJlY3RpdmVzQWNyb3NzVmlld1tkaXJlY3RpdmVJbmRleFN0YXJ0XSkpIHtcbiAgICAgICAgZGlyZWN0aXZlSW5kaWNlcy5wdXNoKGkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGlyZWN0aXZlSW5kaWNlcy5sZW5ndGggPyBkaXJlY3RpdmVJbmRpY2VzIDogbnVsbDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gZGlzY292ZXJEaXJlY3RpdmVzKGxWaWV3RGF0YTogTFZpZXdEYXRhLCBkaXJlY3RpdmVJbmRpY2VzOiBudW1iZXJbXSk6IG51bWJlcltdfG51bGwge1xuICBjb25zdCBkaXJlY3RpdmVzOiBhbnlbXSA9IFtdO1xuICBjb25zdCBkaXJlY3RpdmVJbnN0YW5jZXMgPSBsVmlld0RhdGFbRElSRUNUSVZFU107XG4gIGlmIChkaXJlY3RpdmVJbnN0YW5jZXMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZUluZGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gZGlyZWN0aXZlSW5kaWNlc1tpXTtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGRpcmVjdGl2ZUluc3RhbmNlc1tkaXJlY3RpdmVJbmRleF07XG4gICAgICBkaXJlY3RpdmVzLnB1c2goZGlyZWN0aXZlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRpcmVjdGl2ZXM7XG59XG5cbmZ1bmN0aW9uIGdldERpcmVjdGl2ZVN0YXJ0SW5kZXgobE5vZGU6IExFbGVtZW50Tm9kZSk6IG51bWJlciB7XG4gIC8vIHRoZSB0Tm9kZSBpbnN0YW5jZXMgc3RvcmUgYSBmbGFnIHZhbHVlIHdoaWNoIHRoZW4gaGFzIGFcbiAgLy8gcG9pbnRlciB3aGljaCB0ZWxscyB0aGUgc3RhcnRpbmcgaW5kZXggb2Ygd2hlcmUgYWxsIHRoZVxuICAvLyBhY3RpdmUgZGlyZWN0aXZlcyBhcmUgaW4gdGhlIG1hc3RlciBkaXJlY3RpdmUgYXJyYXlcbiAgcmV0dXJuIGxOb2RlLnROb2RlLmZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xufVxuXG5mdW5jdGlvbiBnZXREaXJlY3RpdmVFbmRJbmRleChsTm9kZTogTEVsZW1lbnROb2RlLCBzdGFydEluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICAvLyBUaGUgZW5kIHZhbHVlIGlzIGFsc28gYXBhcnQgb2YgdGhlIHNhbWUgZmxhZ1xuICAvLyAoc2VlIGBUTm9kZUZsYWdzYCB0byBzZWUgaG93IHRoZSBmbGFnIGJpdCBzaGlmdGluZ1xuICAvLyB2YWx1ZXMgYXJlIHVzZWQpLlxuICBjb25zdCBjb3VudCA9IGxOb2RlLnROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2s7XG4gIHJldHVybiBjb3VudCA/IChzdGFydEluZGV4ICsgY291bnQpIDogLTE7XG59XG4iXX0=