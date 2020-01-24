/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/util/discovery_utils.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '../../di/injector';
import { assertLView } from '../assert';
import { discoverLocalRefs, getComponentAtNodeIndex, getDirectivesAtNodeIndex, getLContext } from '../context_discovery';
import { NodeInjector } from '../di';
import { buildDebugNode } from '../instructions/lview_debug';
import { isLView } from '../interfaces/type_checks';
import { CLEANUP, CONTEXT, FLAGS, HEADER_OFFSET, HOST, TVIEW, T_HOST } from '../interfaces/view';
import { stringifyForError } from './misc_utils';
import { getLViewParent, getRootContext } from './view_traversal_utils';
import { getTNode, unwrapRNode } from './view_utils';
/**
 * Returns the component instance associated with a given DOM host element.
 * Elements which don't represent components return `null`.
 *
 * \@publicApi
 * @template T
 * @param {?} element Host DOM element from which the component should be retrieved.
 *
 * ```
 * <my-app>
 *   #VIEW
 *     <div>
 *       <child-comp></child-comp>
 *     </div>
 * </mp-app>
 *
 * expect(getComponent(<child-comp>) instanceof ChildComponent).toBeTruthy();
 * expect(getComponent(<my-app>) instanceof MyApp).toBeTruthy();
 * ```
 *
 * @return {?}
 */
export function getComponent(element) {
    if (!(element instanceof Node))
        throw new Error('Expecting instance of DOM Node');
    /** @type {?} */
    const context = loadLContext(element, false);
    if (context === null)
        return null;
    if (context.component === undefined) {
        context.component = getComponentAtNodeIndex(context.nodeIndex, context.lView);
    }
    return (/** @type {?} */ (context.component));
}
/**
 * Returns the component instance associated with a given DOM host element.
 * Elements which don't represent components return `null`.
 *
 * \@publicApi
 * @template T
 * @param {?} element Host DOM element from which the component should be retrieved.
 *
 * ```
 * <my-app>
 *   #VIEW
 *     <div>
 *       <child-comp></child-comp>
 *     </div>
 * </mp-app>
 *
 * expect(getComponent(<child-comp>) instanceof ChildComponent).toBeTruthy();
 * expect(getComponent(<my-app>) instanceof MyApp).toBeTruthy();
 * ```
 *
 * @return {?}
 */
export function getContext(element) {
    if (!(element instanceof Node))
        throw new Error('Expecting instance of DOM Node');
    /** @type {?} */
    const context = loadLContext(element, false);
    if (context === null)
        return null;
    return (/** @type {?} */ (context.lView[CONTEXT]));
}
/**
 * Returns the component instance associated with view which owns the DOM element (`null`
 * otherwise).
 *
 * \@publicApi
 * @template T
 * @param {?} element DOM element which is owned by an existing component's view.
 *
 * ```
 * <my-app>
 *   #VIEW
 *     <div>
 *       <child-comp></child-comp>
 *     </div>
 * </mp-app>
 *
 * expect(getViewComponent(<child-comp>) instanceof MyApp).toBeTruthy();
 * expect(getViewComponent(<my-app>)).toEqual(null);
 * ```
 *
 * @return {?}
 */
export function getViewComponent(element) {
    /** @type {?} */
    const context = loadLContext(element, false);
    if (context === null)
        return null;
    /** @type {?} */
    let lView = context.lView;
    /** @type {?} */
    let parent;
    ngDevMode && assertLView(lView);
    while (lView[HOST] === null && (parent = (/** @type {?} */ (getLViewParent(lView))))) {
        // As long as lView[HOST] is null we know we are part of sub-template such as `*ngIf`
        lView = parent;
    }
    return lView[FLAGS] & 512 /* IsRoot */ ? null : (/** @type {?} */ (lView[CONTEXT]));
}
/**
 * Retrieve all root components.
 *
 * Root components are those which have been bootstrapped by Angular.
 *
 * \@publicApi
 * @param {?} target A DOM element, component or directive instance.
 *
 * @return {?}
 */
export function getRootComponents(target) {
    return [...getRootContext(target).components];
}
/**
 * Retrieves an `Injector` associated with the element, component or directive.
 *
 * \@publicApi
 * @param {?} target A DOM element, component or directive instance.
 *
 * @return {?}
 */
export function getInjector(target) {
    /** @type {?} */
    const context = loadLContext(target, false);
    if (context === null)
        return Injector.NULL;
    /** @type {?} */
    const tNode = (/** @type {?} */ (context.lView[TVIEW].data[context.nodeIndex]));
    return new NodeInjector(tNode, context.lView);
}
/**
 * Retrieve a set of injection tokens at a given DOM node.
 *
 * \@publicApi
 * @param {?} element Element for which the injection tokens should be retrieved.
 * @return {?}
 */
export function getInjectionTokens(element) {
    /** @type {?} */
    const context = loadLContext(element, false);
    if (context === null)
        return [];
    /** @type {?} */
    const lView = context.lView;
    /** @type {?} */
    const tView = lView[TVIEW];
    /** @type {?} */
    const tNode = (/** @type {?} */ (tView.data[context.nodeIndex]));
    /** @type {?} */
    const providerTokens = [];
    /** @type {?} */
    const startIndex = tNode.providerIndexes & 65535 /* ProvidersStartIndexMask */;
    /** @type {?} */
    const endIndex = tNode.directiveEnd;
    for (let i = startIndex; i < endIndex; i++) {
        /** @type {?} */
        let value = tView.data[i];
        if (isDirectiveDefHack(value)) {
            // The fact that we sometimes store Type and sometimes DirectiveDef in this location is a
            // design flaw.  We should always store same type so that we can be monomorphic. The issue
            // is that for Components/Directives we store the def instead the type. The correct behavior
            // is that we should always be storing injectable type in this location.
            value = value.type;
        }
        providerTokens.push(value);
    }
    return providerTokens;
}
/**
 * Retrieves directives associated with a given DOM host element.
 *
 * \@publicApi
 * @param {?} target A DOM element, component or directive instance.
 *
 * @return {?}
 */
export function getDirectives(target) {
    /** @type {?} */
    const context = (/** @type {?} */ (loadLContext(target)));
    if (context.directives === undefined) {
        context.directives = getDirectivesAtNodeIndex(context.nodeIndex, context.lView, false);
    }
    return context.directives || [];
}
/**
 * @param {?} target
 * @param {?=} throwOnNotFound
 * @return {?}
 */
export function loadLContext(target, throwOnNotFound = true) {
    /** @type {?} */
    const context = getLContext(target);
    if (!context && throwOnNotFound) {
        throw new Error(ngDevMode ? `Unable to find context associated with ${stringifyForError(target)}` :
            'Invalid ng target');
    }
    return context;
}
/**
 * Retrieve map of local references.
 *
 * The references are retrieved as a map of local reference name to element or directive instance.
 *
 * \@publicApi
 * @param {?} target A DOM element, component or directive instance.
 *
 * @return {?}
 */
export function getLocalRefs(target) {
    /** @type {?} */
    const context = loadLContext(target, false);
    if (context === null)
        return {};
    if (context.localRefs === undefined) {
        context.localRefs = discoverLocalRefs(context.lView, context.nodeIndex);
    }
    return context.localRefs || {};
}
/**
 * Retrieve the host element of the component.
 *
 * Use this function to retrieve the host element of the component. The host
 * element is the element which the component is associated with.
 *
 * \@publicApi
 * @template T
 * @param {?} directive Component or Directive for which the host element should be retrieved.
 *
 * @return {?}
 */
export function getHostElement(directive) {
    return (/** @type {?} */ ((/** @type {?} */ ((/** @type {?} */ (getLContext(directive))).native))));
}
/**
 * Retrieves the rendered text for a given component.
 *
 * This function retrieves the host element of a component and
 * and then returns the `textContent` for that element. This implies
 * that the text returned will include re-projected content of
 * the component as well.
 *
 * @param {?} component The component to return the content text for.
 * @return {?}
 */
export function getRenderedText(component) {
    /** @type {?} */
    const hostElement = getHostElement(component);
    return hostElement.textContent || '';
}
/**
 * @param {?} node
 * @return {?}
 */
export function loadLContextFromNode(node) {
    if (!(node instanceof Node))
        throw new Error('Expecting instance of DOM Node');
    return (/** @type {?} */ (loadLContext(node)));
}
/**
 * @record
 */
export function Listener() { }
if (false) {
    /** @type {?} */
    Listener.prototype.name;
    /** @type {?} */
    Listener.prototype.element;
    /** @type {?} */
    Listener.prototype.callback;
    /** @type {?} */
    Listener.prototype.useCapture;
}
/**
 * @param {?} listener
 * @return {?}
 */
export function isBrowserEvents(listener) {
    // Browser events are those which don't have `useCapture` as boolean.
    return typeof listener.useCapture === 'boolean';
}
/**
 * Retrieves a list of DOM listeners.
 *
 * ```
 * <my-app>
 *   #VIEW
 *     <div (click)="doSomething()">
 *     </div>
 * </mp-app>
 *
 * expect(getListeners(<div>)).toEqual({
 *   name: 'click',
 *   element: <div>,
 *   callback: () => doSomething(),
 *   useCapture: false
 * });
 * ```
 *
 * \@publicApi
 * @param {?} element Element for which the DOM listeners should be retrieved.
 * @return {?}
 */
export function getListeners(element) {
    if (!(element instanceof Node))
        throw new Error('Expecting instance of DOM Node');
    /** @type {?} */
    const lContext = loadLContext(element, false);
    if (lContext === null)
        return [];
    /** @type {?} */
    const lView = lContext.lView;
    /** @type {?} */
    const tView = lView[TVIEW];
    /** @type {?} */
    const lCleanup = lView[CLEANUP];
    /** @type {?} */
    const tCleanup = tView.cleanup;
    /** @type {?} */
    const listeners = [];
    if (tCleanup && lCleanup) {
        for (let i = 0; i < tCleanup.length;) {
            /** @type {?} */
            const firstParam = tCleanup[i++];
            /** @type {?} */
            const secondParam = tCleanup[i++];
            if (typeof firstParam === 'string') {
                /** @type {?} */
                const name = firstParam;
                /** @type {?} */
                const listenerElement = (/** @type {?} */ ((/** @type {?} */ (unwrapRNode(lView[secondParam])))));
                /** @type {?} */
                const callback = lCleanup[tCleanup[i++]];
                /** @type {?} */
                const useCaptureOrIndx = tCleanup[i++];
                // if useCaptureOrIndx is boolean then report it as is.
                // if useCaptureOrIndx is positive number then it in unsubscribe method
                // if useCaptureOrIndx is negative number then it is a Subscription
                /** @type {?} */
                const useCapture = typeof useCaptureOrIndx === 'boolean' ?
                    useCaptureOrIndx :
                    (useCaptureOrIndx >= 0 ? false : null);
                if (element == listenerElement) {
                    listeners.push({ element, name, callback, useCapture });
                }
            }
        }
    }
    listeners.sort(sortListeners);
    return listeners;
}
/**
 * @param {?} a
 * @param {?} b
 * @return {?}
 */
function sortListeners(a, b) {
    if (a.name == b.name)
        return 0;
    return a.name < b.name ? -1 : 1;
}
/**
 * This function should not exist because it is megamorphic and only mostly correct.
 *
 * See call site for more info.
 * @param {?} obj
 * @return {?}
 */
function isDirectiveDefHack(obj) {
    return obj.type !== undefined && obj.template !== undefined && obj.declaredInputs !== undefined;
}
/**
 * Returns the attached `DebugNode` instance for an element in the DOM.
 *
 * \@publicApi
 * @param {?} element DOM element which is owned by an existing component's view.
 *
 * @return {?}
 */
export function getDebugNode(element) {
    /** @type {?} */
    let debugNode = null;
    /** @type {?} */
    const lContext = loadLContextFromNode(element);
    /** @type {?} */
    const lView = lContext.lView;
    /** @type {?} */
    const nodeIndex = lContext.nodeIndex;
    if (nodeIndex !== -1) {
        /** @type {?} */
        const valueInLView = lView[nodeIndex];
        // this means that value in the lView is a component with its own
        // data. In this situation the TNode is not accessed at the same spot.
        /** @type {?} */
        const tNode = isLView(valueInLView) ? ((/** @type {?} */ (valueInLView[T_HOST]))) :
            getTNode(nodeIndex - HEADER_OFFSET, lView);
        debugNode = buildDebugNode(tNode, lView, nodeIndex);
    }
    return debugNode;
}
/**
 * Retrieve the component `LView` from component/element.
 *
 * NOTE: `LView` is a private and should not be leaked outside.
 *       Don't export this method to `ng.*` on window.
 *
 * @param {?} target Component or Element instance.
 * @return {?}
 */
export function getComponentLView(target) {
    /** @type {?} */
    const lContext = loadLContext(target);
    /** @type {?} */
    const nodeIndx = lContext.nodeIndex;
    /** @type {?} */
    const lView = lContext.lView;
    /** @type {?} */
    const componentLView = lView[nodeIndx];
    ngDevMode && assertLView(componentLView);
    return componentLView;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzY292ZXJ5X3V0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy91dGlsL2Rpc2NvdmVyeV91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDM0MsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUN0QyxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsdUJBQXVCLEVBQUUsd0JBQXdCLEVBQUUsV0FBVyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDdkgsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUNuQyxPQUFPLEVBQVksY0FBYyxFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFJdEUsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQ2xELE9BQU8sRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFxQixLQUFLLEVBQUUsTUFBTSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFbEgsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQy9DLE9BQU8sRUFBQyxjQUFjLEVBQUUsY0FBYyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDdEUsT0FBTyxFQUFDLFFBQVEsRUFBRSxXQUFXLEVBQUMsTUFBTSxjQUFjLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBd0JuRCxNQUFNLFVBQVUsWUFBWSxDQUFTLE9BQWdCO0lBQ25ELElBQUksQ0FBQyxDQUFDLE9BQU8sWUFBWSxJQUFJLENBQUM7UUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7O1VBQzVFLE9BQU8sR0FBRyxZQUFZLENBQUMsT0FBTyxFQUFFLEtBQUss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SyxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBQSxZQUFZLENBQUMsTUFBTSxDQUFDLEVBQVMsQ0FBQyxDQUFDLENBQUM7WUFDakMsUUFBUSxDQUFDLFNBQVMsR0FBRyxhQUFhLEVBQUUsS0FBSyxDQUFDO1FBQ2hGLFNBQVMsR0FBRyxjQUFjLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztLQUNyRDtJQUVELE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7Ozs7Ozs7Ozs7QUFVRCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsTUFBVzs7VUFDckMsUUFBUSxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUM7O1VBQy9CLFFBQVEsR0FBRyxRQUFRLENBQUMsU0FBUzs7VUFDN0IsS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLOztVQUN0QixjQUFjLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQztJQUN0QyxTQUFTLElBQUksV0FBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQ3pDLE9BQU8sY0FBYyxDQUFDO0FBQ3hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uLy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7YXNzZXJ0TFZpZXd9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2Rpc2NvdmVyTG9jYWxSZWZzLCBnZXRDb21wb25lbnRBdE5vZGVJbmRleCwgZ2V0RGlyZWN0aXZlc0F0Tm9kZUluZGV4LCBnZXRMQ29udGV4dH0gZnJvbSAnLi4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtOb2RlSW5qZWN0b3J9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7RGVidWdOb2RlLCBidWlsZERlYnVnTm9kZX0gZnJvbSAnLi4vaW5zdHJ1Y3Rpb25zL2x2aWV3X2RlYnVnJztcbmltcG9ydCB7TENvbnRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGV4dCc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVQcm92aWRlckluZGV4ZXN9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2lzTFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtDTEVBTlVQLCBDT05URVhULCBGTEFHUywgSEVBREVSX09GRlNFVCwgSE9TVCwgTFZpZXcsIExWaWV3RmxhZ3MsIFRWSUVXLCBUX0hPU1R9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5cbmltcG9ydCB7c3RyaW5naWZ5Rm9yRXJyb3J9IGZyb20gJy4vbWlzY191dGlscyc7XG5pbXBvcnQge2dldExWaWV3UGFyZW50LCBnZXRSb290Q29udGV4dH0gZnJvbSAnLi92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldFROb2RlLCB1bndyYXBSTm9kZX0gZnJvbSAnLi92aWV3X3V0aWxzJztcblxuXG5cbi8qKlxuICogUmV0dXJucyB0aGUgY29tcG9uZW50IGluc3RhbmNlIGFzc29jaWF0ZWQgd2l0aCBhIGdpdmVuIERPTSBob3N0IGVsZW1lbnQuXG4gKiBFbGVtZW50cyB3aGljaCBkb24ndCByZXByZXNlbnQgY29tcG9uZW50cyByZXR1cm4gYG51bGxgLlxuICpcbiAqIEBwYXJhbSBlbGVtZW50IEhvc3QgRE9NIGVsZW1lbnQgZnJvbSB3aGljaCB0aGUgY29tcG9uZW50IHNob3VsZCBiZSByZXRyaWV2ZWQuXG4gKlxuICogYGBgXG4gKiA8bXktYXBwPlxuICogICAjVklFV1xuICogICAgIDxkaXY+XG4gKiAgICAgICA8Y2hpbGQtY29tcD48L2NoaWxkLWNvbXA+XG4gKiAgICAgPC9kaXY+XG4gKiA8L21wLWFwcD5cbiAqXG4gKiBleHBlY3QoZ2V0Q29tcG9uZW50KDxjaGlsZC1jb21wPikgaW5zdGFuY2VvZiBDaGlsZENvbXBvbmVudCkudG9CZVRydXRoeSgpO1xuICogZXhwZWN0KGdldENvbXBvbmVudCg8bXktYXBwPikgaW5zdGFuY2VvZiBNeUFwcCkudG9CZVRydXRoeSgpO1xuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tcG9uZW50PFQgPSB7fT4oZWxlbWVudDogRWxlbWVudCk6IFR8bnVsbCB7XG4gIGlmICghKGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlKSkgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RpbmcgaW5zdGFuY2Ugb2YgRE9NIE5vZGUnKTtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRMQ29udGV4dChlbGVtZW50LCBmYWxzZSk7XG4gIGlmIChjb250ZXh0ID09PSBudWxsKSByZXR1cm4gbnVsbDtcblxuXG4gIGlmIChjb250ZXh0LmNvbXBvbmVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgY29udGV4dC5jb21wb25lbnQgPSBnZXRDb21wb25lbnRBdE5vZGVJbmRleChjb250ZXh0Lm5vZGVJbmRleCwgY29udGV4dC5sVmlldyk7XG4gIH1cblxuICByZXR1cm4gY29udGV4dC5jb21wb25lbnQgYXMgVDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjb21wb25lbnQgaW5zdGFuY2UgYXNzb2NpYXRlZCB3aXRoIGEgZ2l2ZW4gRE9NIGhvc3QgZWxlbWVudC5cbiAqIEVsZW1lbnRzIHdoaWNoIGRvbid0IHJlcHJlc2VudCBjb21wb25lbnRzIHJldHVybiBgbnVsbGAuXG4gKlxuICogQHBhcmFtIGVsZW1lbnQgSG9zdCBET00gZWxlbWVudCBmcm9tIHdoaWNoIHRoZSBjb21wb25lbnQgc2hvdWxkIGJlIHJldHJpZXZlZC5cbiAqXG4gKiBgYGBcbiAqIDxteS1hcHA+XG4gKiAgICNWSUVXXG4gKiAgICAgPGRpdj5cbiAqICAgICAgIDxjaGlsZC1jb21wPjwvY2hpbGQtY29tcD5cbiAqICAgICA8L2Rpdj5cbiAqIDwvbXAtYXBwPlxuICpcbiAqIGV4cGVjdChnZXRDb21wb25lbnQoPGNoaWxkLWNvbXA+KSBpbnN0YW5jZW9mIENoaWxkQ29tcG9uZW50KS50b0JlVHJ1dGh5KCk7XG4gKiBleHBlY3QoZ2V0Q29tcG9uZW50KDxteS1hcHA+KSBpbnN0YW5jZW9mIE15QXBwKS50b0JlVHJ1dGh5KCk7XG4gKiBgYGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb250ZXh0PFQgPSB7fT4oZWxlbWVudDogRWxlbWVudCk6IFR8bnVsbCB7XG4gIGlmICghKGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlKSkgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RpbmcgaW5zdGFuY2Ugb2YgRE9NIE5vZGUnKTtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRMQ29udGV4dChlbGVtZW50LCBmYWxzZSk7XG4gIGlmIChjb250ZXh0ID09PSBudWxsKSByZXR1cm4gbnVsbDtcblxuICByZXR1cm4gY29udGV4dC5sVmlld1tDT05URVhUXSBhcyBUO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGNvbXBvbmVudCBpbnN0YW5jZSBhc3NvY2lhdGVkIHdpdGggdmlldyB3aGljaCBvd25zIHRoZSBET00gZWxlbWVudCAoYG51bGxgXG4gKiBvdGhlcndpc2UpLlxuICpcbiAqIEBwYXJhbSBlbGVtZW50IERPTSBlbGVtZW50IHdoaWNoIGlzIG93bmVkIGJ5IGFuIGV4aXN0aW5nIGNvbXBvbmVudCdzIHZpZXcuXG4gKlxuICogYGBgXG4gKiA8bXktYXBwPlxuICogICAjVklFV1xuICogICAgIDxkaXY+XG4gKiAgICAgICA8Y2hpbGQtY29tcD48L2NoaWxkLWNvbXA+XG4gKiAgICAgPC9kaXY+XG4gKiA8L21wLWFwcD5cbiAqXG4gKiBleHBlY3QoZ2V0Vmlld0NvbXBvbmVudCg8Y2hpbGQtY29tcD4pIGluc3RhbmNlb2YgTXlBcHApLnRvQmVUcnV0aHkoKTtcbiAqIGV4cGVjdChnZXRWaWV3Q29tcG9uZW50KDxteS1hcHA+KSkudG9FcXVhbChudWxsKTtcbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFZpZXdDb21wb25lbnQ8VCA9IHt9PihlbGVtZW50OiBFbGVtZW50IHwge30pOiBUfG51bGwge1xuICBjb25zdCBjb250ZXh0ID0gbG9hZExDb250ZXh0KGVsZW1lbnQsIGZhbHNlKTtcbiAgaWYgKGNvbnRleHQgPT09IG51bGwpIHJldHVybiBudWxsO1xuXG4gIGxldCBsVmlldyA9IGNvbnRleHQubFZpZXc7XG4gIGxldCBwYXJlbnQ6IExWaWV3fG51bGw7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhsVmlldyk7XG4gIHdoaWxlIChsVmlld1tIT1NUXSA9PT0gbnVsbCAmJiAocGFyZW50ID0gZ2V0TFZpZXdQYXJlbnQobFZpZXcpICEpKSB7XG4gICAgLy8gQXMgbG9uZyBhcyBsVmlld1tIT1NUXSBpcyBudWxsIHdlIGtub3cgd2UgYXJlIHBhcnQgb2Ygc3ViLXRlbXBsYXRlIHN1Y2ggYXMgYCpuZ0lmYFxuICAgIGxWaWV3ID0gcGFyZW50O1xuICB9XG4gIHJldHVybiBsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLklzUm9vdCA/IG51bGwgOiBsVmlld1tDT05URVhUXSBhcyBUO1xufVxuXG4vKipcbiAqIFJldHJpZXZlIGFsbCByb290IGNvbXBvbmVudHMuXG4gKlxuICogUm9vdCBjb21wb25lbnRzIGFyZSB0aG9zZSB3aGljaCBoYXZlIGJlZW4gYm9vdHN0cmFwcGVkIGJ5IEFuZ3VsYXIuXG4gKlxuICogQHBhcmFtIHRhcmdldCBBIERPTSBlbGVtZW50LCBjb21wb25lbnQgb3IgZGlyZWN0aXZlIGluc3RhbmNlLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJvb3RDb21wb25lbnRzKHRhcmdldDoge30pOiBhbnlbXSB7XG4gIHJldHVybiBbLi4uZ2V0Um9vdENvbnRleHQodGFyZ2V0KS5jb21wb25lbnRzXTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgYW4gYEluamVjdG9yYCBhc3NvY2lhdGVkIHdpdGggdGhlIGVsZW1lbnQsIGNvbXBvbmVudCBvciBkaXJlY3RpdmUuXG4gKlxuICogQHBhcmFtIHRhcmdldCBBIERPTSBlbGVtZW50LCBjb21wb25lbnQgb3IgZGlyZWN0aXZlIGluc3RhbmNlLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEluamVjdG9yKHRhcmdldDoge30pOiBJbmplY3RvciB7XG4gIGNvbnN0IGNvbnRleHQgPSBsb2FkTENvbnRleHQodGFyZ2V0LCBmYWxzZSk7XG4gIGlmIChjb250ZXh0ID09PSBudWxsKSByZXR1cm4gSW5qZWN0b3IuTlVMTDtcblxuICBjb25zdCB0Tm9kZSA9IGNvbnRleHQubFZpZXdbVFZJRVddLmRhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFRFbGVtZW50Tm9kZTtcbiAgcmV0dXJuIG5ldyBOb2RlSW5qZWN0b3IodE5vZGUsIGNvbnRleHQubFZpZXcpO1xufVxuXG4vKipcbiAqIFJldHJpZXZlIGEgc2V0IG9mIGluamVjdGlvbiB0b2tlbnMgYXQgYSBnaXZlbiBET00gbm9kZS5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IGZvciB3aGljaCB0aGUgaW5qZWN0aW9uIHRva2VucyBzaG91bGQgYmUgcmV0cmlldmVkLlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5qZWN0aW9uVG9rZW5zKGVsZW1lbnQ6IEVsZW1lbnQpOiBhbnlbXSB7XG4gIGNvbnN0IGNvbnRleHQgPSBsb2FkTENvbnRleHQoZWxlbWVudCwgZmFsc2UpO1xuICBpZiAoY29udGV4dCA9PT0gbnVsbCkgcmV0dXJuIFtdO1xuICBjb25zdCBsVmlldyA9IGNvbnRleHQubFZpZXc7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFROb2RlO1xuICBjb25zdCBwcm92aWRlclRva2VuczogYW55W10gPSBbXTtcbiAgY29uc3Qgc3RhcnRJbmRleCA9IHROb2RlLnByb3ZpZGVySW5kZXhlcyAmIFROb2RlUHJvdmlkZXJJbmRleGVzLlByb3ZpZGVyc1N0YXJ0SW5kZXhNYXNrO1xuICBjb25zdCBlbmRJbmRleCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXg7IGkgPCBlbmRJbmRleDsgaSsrKSB7XG4gICAgbGV0IHZhbHVlID0gdFZpZXcuZGF0YVtpXTtcbiAgICBpZiAoaXNEaXJlY3RpdmVEZWZIYWNrKHZhbHVlKSkge1xuICAgICAgLy8gVGhlIGZhY3QgdGhhdCB3ZSBzb21ldGltZXMgc3RvcmUgVHlwZSBhbmQgc29tZXRpbWVzIERpcmVjdGl2ZURlZiBpbiB0aGlzIGxvY2F0aW9uIGlzIGFcbiAgICAgIC8vIGRlc2lnbiBmbGF3LiAgV2Ugc2hvdWxkIGFsd2F5cyBzdG9yZSBzYW1lIHR5cGUgc28gdGhhdCB3ZSBjYW4gYmUgbW9ub21vcnBoaWMuIFRoZSBpc3N1ZVxuICAgICAgLy8gaXMgdGhhdCBmb3IgQ29tcG9uZW50cy9EaXJlY3RpdmVzIHdlIHN0b3JlIHRoZSBkZWYgaW5zdGVhZCB0aGUgdHlwZS4gVGhlIGNvcnJlY3QgYmVoYXZpb3JcbiAgICAgIC8vIGlzIHRoYXQgd2Ugc2hvdWxkIGFsd2F5cyBiZSBzdG9yaW5nIGluamVjdGFibGUgdHlwZSBpbiB0aGlzIGxvY2F0aW9uLlxuICAgICAgdmFsdWUgPSB2YWx1ZS50eXBlO1xuICAgIH1cbiAgICBwcm92aWRlclRva2Vucy5wdXNoKHZhbHVlKTtcbiAgfVxuICByZXR1cm4gcHJvdmlkZXJUb2tlbnM7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIGRpcmVjdGl2ZXMgYXNzb2NpYXRlZCB3aXRoIGEgZ2l2ZW4gRE9NIGhvc3QgZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gdGFyZ2V0IEEgRE9NIGVsZW1lbnQsIGNvbXBvbmVudCBvciBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGlyZWN0aXZlcyh0YXJnZXQ6IHt9KTogQXJyYXk8e30+IHtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRMQ29udGV4dCh0YXJnZXQpICE7XG5cbiAgaWYgKGNvbnRleHQuZGlyZWN0aXZlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgY29udGV4dC5kaXJlY3RpdmVzID0gZ2V0RGlyZWN0aXZlc0F0Tm9kZUluZGV4KGNvbnRleHQubm9kZUluZGV4LCBjb250ZXh0LmxWaWV3LCBmYWxzZSk7XG4gIH1cblxuICByZXR1cm4gY29udGV4dC5kaXJlY3RpdmVzIHx8IFtdO1xufVxuXG4vKipcbiAqIFJldHVybnMgTENvbnRleHQgYXNzb2NpYXRlZCB3aXRoIGEgdGFyZ2V0IHBhc3NlZCBhcyBhbiBhcmd1bWVudC5cbiAqIFRocm93cyBpZiBhIGdpdmVuIHRhcmdldCBkb2Vzbid0IGhhdmUgYXNzb2NpYXRlZCBMQ29udGV4dC5cbiAqXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkTENvbnRleHQodGFyZ2V0OiB7fSk6IExDb250ZXh0O1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWRMQ29udGV4dCh0YXJnZXQ6IHt9LCB0aHJvd09uTm90Rm91bmQ6IGZhbHNlKTogTENvbnRleHR8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBsb2FkTENvbnRleHQodGFyZ2V0OiB7fSwgdGhyb3dPbk5vdEZvdW5kOiBib29sZWFuID0gdHJ1ZSk6IExDb250ZXh0fG51bGwge1xuICBjb25zdCBjb250ZXh0ID0gZ2V0TENvbnRleHQodGFyZ2V0KTtcbiAgaWYgKCFjb250ZXh0ICYmIHRocm93T25Ob3RGb3VuZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgbmdEZXZNb2RlID8gYFVuYWJsZSB0byBmaW5kIGNvbnRleHQgYXNzb2NpYXRlZCB3aXRoICR7c3RyaW5naWZ5Rm9yRXJyb3IodGFyZ2V0KX1gIDpcbiAgICAgICAgICAgICAgICAgICAgJ0ludmFsaWQgbmcgdGFyZ2V0Jyk7XG4gIH1cbiAgcmV0dXJuIGNvbnRleHQ7XG59XG5cbi8qKlxuICogUmV0cmlldmUgbWFwIG9mIGxvY2FsIHJlZmVyZW5jZXMuXG4gKlxuICogVGhlIHJlZmVyZW5jZXMgYXJlIHJldHJpZXZlZCBhcyBhIG1hcCBvZiBsb2NhbCByZWZlcmVuY2UgbmFtZSB0byBlbGVtZW50IG9yIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0gdGFyZ2V0IEEgRE9NIGVsZW1lbnQsIGNvbXBvbmVudCBvciBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9jYWxSZWZzKHRhcmdldDoge30pOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gIGNvbnN0IGNvbnRleHQgPSBsb2FkTENvbnRleHQodGFyZ2V0LCBmYWxzZSk7XG4gIGlmIChjb250ZXh0ID09PSBudWxsKSByZXR1cm4ge307XG5cbiAgaWYgKGNvbnRleHQubG9jYWxSZWZzID09PSB1bmRlZmluZWQpIHtcbiAgICBjb250ZXh0LmxvY2FsUmVmcyA9IGRpc2NvdmVyTG9jYWxSZWZzKGNvbnRleHQubFZpZXcsIGNvbnRleHQubm9kZUluZGV4KTtcbiAgfVxuXG4gIHJldHVybiBjb250ZXh0LmxvY2FsUmVmcyB8fCB7fTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgaG9zdCBlbGVtZW50IG9mIHRoZSBjb21wb25lbnQuXG4gKlxuICogVXNlIHRoaXMgZnVuY3Rpb24gdG8gcmV0cmlldmUgdGhlIGhvc3QgZWxlbWVudCBvZiB0aGUgY29tcG9uZW50LiBUaGUgaG9zdFxuICogZWxlbWVudCBpcyB0aGUgZWxlbWVudCB3aGljaCB0aGUgY29tcG9uZW50IGlzIGFzc29jaWF0ZWQgd2l0aC5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlIENvbXBvbmVudCBvciBEaXJlY3RpdmUgZm9yIHdoaWNoIHRoZSBob3N0IGVsZW1lbnQgc2hvdWxkIGJlIHJldHJpZXZlZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRIb3N0RWxlbWVudDxUPihkaXJlY3RpdmU6IFQpOiBFbGVtZW50IHtcbiAgcmV0dXJuIGdldExDb250ZXh0KGRpcmVjdGl2ZSkgIS5uYXRpdmUgYXMgbmV2ZXIgYXMgRWxlbWVudDtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIHJlbmRlcmVkIHRleHQgZm9yIGEgZ2l2ZW4gY29tcG9uZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gcmV0cmlldmVzIHRoZSBob3N0IGVsZW1lbnQgb2YgYSBjb21wb25lbnQgYW5kXG4gKiBhbmQgdGhlbiByZXR1cm5zIHRoZSBgdGV4dENvbnRlbnRgIGZvciB0aGF0IGVsZW1lbnQuIFRoaXMgaW1wbGllc1xuICogdGhhdCB0aGUgdGV4dCByZXR1cm5lZCB3aWxsIGluY2x1ZGUgcmUtcHJvamVjdGVkIGNvbnRlbnQgb2ZcbiAqIHRoZSBjb21wb25lbnQgYXMgd2VsbC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IFRoZSBjb21wb25lbnQgdG8gcmV0dXJuIHRoZSBjb250ZW50IHRleHQgZm9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVuZGVyZWRUZXh0KGNvbXBvbmVudDogYW55KTogc3RyaW5nIHtcbiAgY29uc3QgaG9zdEVsZW1lbnQgPSBnZXRIb3N0RWxlbWVudChjb21wb25lbnQpO1xuICByZXR1cm4gaG9zdEVsZW1lbnQudGV4dENvbnRlbnQgfHwgJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2FkTENvbnRleHRGcm9tTm9kZShub2RlOiBOb2RlKTogTENvbnRleHQge1xuICBpZiAoIShub2RlIGluc3RhbmNlb2YgTm9kZSkpIHRocm93IG5ldyBFcnJvcignRXhwZWN0aW5nIGluc3RhbmNlIG9mIERPTSBOb2RlJyk7XG4gIHJldHVybiBsb2FkTENvbnRleHQobm9kZSkgITtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMaXN0ZW5lciB7XG4gIG5hbWU6IHN0cmluZztcbiAgZWxlbWVudDogRWxlbWVudDtcbiAgY2FsbGJhY2s6ICh2YWx1ZTogYW55KSA9PiBhbnk7XG4gIHVzZUNhcHR1cmU6IGJvb2xlYW58bnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQnJvd3NlckV2ZW50cyhsaXN0ZW5lcjogTGlzdGVuZXIpOiBib29sZWFuIHtcbiAgLy8gQnJvd3NlciBldmVudHMgYXJlIHRob3NlIHdoaWNoIGRvbid0IGhhdmUgYHVzZUNhcHR1cmVgIGFzIGJvb2xlYW4uXG4gIHJldHVybiB0eXBlb2YgbGlzdGVuZXIudXNlQ2FwdHVyZSA9PT0gJ2Jvb2xlYW4nO1xufVxuXG5cbi8qKlxuICogUmV0cmlldmVzIGEgbGlzdCBvZiBET00gbGlzdGVuZXJzLlxuICpcbiAqIGBgYFxuICogPG15LWFwcD5cbiAqICAgI1ZJRVdcbiAqICAgICA8ZGl2IChjbGljayk9XCJkb1NvbWV0aGluZygpXCI+XG4gKiAgICAgPC9kaXY+XG4gKiA8L21wLWFwcD5cbiAqXG4gKiBleHBlY3QoZ2V0TGlzdGVuZXJzKDxkaXY+KSkudG9FcXVhbCh7XG4gKiAgIG5hbWU6ICdjbGljaycsXG4gKiAgIGVsZW1lbnQ6IDxkaXY+LFxuICogICBjYWxsYmFjazogKCkgPT4gZG9Tb21ldGhpbmcoKSxcbiAqICAgdXNlQ2FwdHVyZTogZmFsc2VcbiAqIH0pO1xuICogYGBgXG4gKlxuICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCBmb3Igd2hpY2ggdGhlIERPTSBsaXN0ZW5lcnMgc2hvdWxkIGJlIHJldHJpZXZlZC5cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExpc3RlbmVycyhlbGVtZW50OiBFbGVtZW50KTogTGlzdGVuZXJbXSB7XG4gIGlmICghKGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlKSkgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RpbmcgaW5zdGFuY2Ugb2YgRE9NIE5vZGUnKTtcbiAgY29uc3QgbENvbnRleHQgPSBsb2FkTENvbnRleHQoZWxlbWVudCwgZmFsc2UpO1xuICBpZiAobENvbnRleHQgPT09IG51bGwpIHJldHVybiBbXTtcblxuICBjb25zdCBsVmlldyA9IGxDb250ZXh0LmxWaWV3O1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgbENsZWFudXAgPSBsVmlld1tDTEVBTlVQXTtcbiAgY29uc3QgdENsZWFudXAgPSB0Vmlldy5jbGVhbnVwO1xuICBjb25zdCBsaXN0ZW5lcnM6IExpc3RlbmVyW10gPSBbXTtcbiAgaWYgKHRDbGVhbnVwICYmIGxDbGVhbnVwKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0Q2xlYW51cC5sZW5ndGg7KSB7XG4gICAgICBjb25zdCBmaXJzdFBhcmFtID0gdENsZWFudXBbaSsrXTtcbiAgICAgIGNvbnN0IHNlY29uZFBhcmFtID0gdENsZWFudXBbaSsrXTtcbiAgICAgIGlmICh0eXBlb2YgZmlyc3RQYXJhbSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29uc3QgbmFtZTogc3RyaW5nID0gZmlyc3RQYXJhbTtcbiAgICAgICAgY29uc3QgbGlzdGVuZXJFbGVtZW50ID0gdW53cmFwUk5vZGUobFZpZXdbc2Vjb25kUGFyYW1dKSBhcyBhbnkgYXMgRWxlbWVudDtcbiAgICAgICAgY29uc3QgY2FsbGJhY2s6ICh2YWx1ZTogYW55KSA9PiBhbnkgPSBsQ2xlYW51cFt0Q2xlYW51cFtpKytdXTtcbiAgICAgICAgY29uc3QgdXNlQ2FwdHVyZU9ySW5keCA9IHRDbGVhbnVwW2krK107XG4gICAgICAgIC8vIGlmIHVzZUNhcHR1cmVPckluZHggaXMgYm9vbGVhbiB0aGVuIHJlcG9ydCBpdCBhcyBpcy5cbiAgICAgICAgLy8gaWYgdXNlQ2FwdHVyZU9ySW5keCBpcyBwb3NpdGl2ZSBudW1iZXIgdGhlbiBpdCBpbiB1bnN1YnNjcmliZSBtZXRob2RcbiAgICAgICAgLy8gaWYgdXNlQ2FwdHVyZU9ySW5keCBpcyBuZWdhdGl2ZSBudW1iZXIgdGhlbiBpdCBpcyBhIFN1YnNjcmlwdGlvblxuICAgICAgICBjb25zdCB1c2VDYXB0dXJlID0gdHlwZW9mIHVzZUNhcHR1cmVPckluZHggPT09ICdib29sZWFuJyA/XG4gICAgICAgICAgICB1c2VDYXB0dXJlT3JJbmR4IDpcbiAgICAgICAgICAgICh1c2VDYXB0dXJlT3JJbmR4ID49IDAgPyBmYWxzZSA6IG51bGwpO1xuICAgICAgICBpZiAoZWxlbWVudCA9PSBsaXN0ZW5lckVsZW1lbnQpIHtcbiAgICAgICAgICBsaXN0ZW5lcnMucHVzaCh7ZWxlbWVudCwgbmFtZSwgY2FsbGJhY2ssIHVzZUNhcHR1cmV9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBsaXN0ZW5lcnMuc29ydChzb3J0TGlzdGVuZXJzKTtcbiAgcmV0dXJuIGxpc3RlbmVycztcbn1cblxuZnVuY3Rpb24gc29ydExpc3RlbmVycyhhOiBMaXN0ZW5lciwgYjogTGlzdGVuZXIpIHtcbiAgaWYgKGEubmFtZSA9PSBiLm5hbWUpIHJldHVybiAwO1xuICByZXR1cm4gYS5uYW1lIDwgYi5uYW1lID8gLTEgOiAxO1xufVxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gc2hvdWxkIG5vdCBleGlzdCBiZWNhdXNlIGl0IGlzIG1lZ2Ftb3JwaGljIGFuZCBvbmx5IG1vc3RseSBjb3JyZWN0LlxuICpcbiAqIFNlZSBjYWxsIHNpdGUgZm9yIG1vcmUgaW5mby5cbiAqL1xuZnVuY3Rpb24gaXNEaXJlY3RpdmVEZWZIYWNrKG9iajogYW55KTogb2JqIGlzIERpcmVjdGl2ZURlZjxhbnk+IHtcbiAgcmV0dXJuIG9iai50eXBlICE9PSB1bmRlZmluZWQgJiYgb2JqLnRlbXBsYXRlICE9PSB1bmRlZmluZWQgJiYgb2JqLmRlY2xhcmVkSW5wdXRzICE9PSB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgYXR0YWNoZWQgYERlYnVnTm9kZWAgaW5zdGFuY2UgZm9yIGFuIGVsZW1lbnQgaW4gdGhlIERPTS5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudCBET00gZWxlbWVudCB3aGljaCBpcyBvd25lZCBieSBhbiBleGlzdGluZyBjb21wb25lbnQncyB2aWV3LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnTm9kZShlbGVtZW50OiBOb2RlKTogRGVidWdOb2RlfG51bGwge1xuICBsZXQgZGVidWdOb2RlOiBEZWJ1Z05vZGV8bnVsbCA9IG51bGw7XG5cbiAgY29uc3QgbENvbnRleHQgPSBsb2FkTENvbnRleHRGcm9tTm9kZShlbGVtZW50KTtcbiAgY29uc3QgbFZpZXcgPSBsQ29udGV4dC5sVmlldztcbiAgY29uc3Qgbm9kZUluZGV4ID0gbENvbnRleHQubm9kZUluZGV4O1xuICBpZiAobm9kZUluZGV4ICE9PSAtMSkge1xuICAgIGNvbnN0IHZhbHVlSW5MVmlldyA9IGxWaWV3W25vZGVJbmRleF07XG4gICAgLy8gdGhpcyBtZWFucyB0aGF0IHZhbHVlIGluIHRoZSBsVmlldyBpcyBhIGNvbXBvbmVudCB3aXRoIGl0cyBvd25cbiAgICAvLyBkYXRhLiBJbiB0aGlzIHNpdHVhdGlvbiB0aGUgVE5vZGUgaXMgbm90IGFjY2Vzc2VkIGF0IHRoZSBzYW1lIHNwb3QuXG4gICAgY29uc3QgdE5vZGUgPSBpc0xWaWV3KHZhbHVlSW5MVmlldykgPyAodmFsdWVJbkxWaWV3W1RfSE9TVF0gYXMgVE5vZGUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldFROb2RlKG5vZGVJbmRleCAtIEhFQURFUl9PRkZTRVQsIGxWaWV3KTtcbiAgICBkZWJ1Z05vZGUgPSBidWlsZERlYnVnTm9kZSh0Tm9kZSwgbFZpZXcsIG5vZGVJbmRleCk7XG4gIH1cblxuICByZXR1cm4gZGVidWdOb2RlO1xufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSBjb21wb25lbnQgYExWaWV3YCBmcm9tIGNvbXBvbmVudC9lbGVtZW50LlxuICpcbiAqIE5PVEU6IGBMVmlld2AgaXMgYSBwcml2YXRlIGFuZCBzaG91bGQgbm90IGJlIGxlYWtlZCBvdXRzaWRlLlxuICogICAgICAgRG9uJ3QgZXhwb3J0IHRoaXMgbWV0aG9kIHRvIGBuZy4qYCBvbiB3aW5kb3cuXG4gKlxuICogQHBhcmFtIHRhcmdldCBDb21wb25lbnQgb3IgRWxlbWVudCBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbXBvbmVudExWaWV3KHRhcmdldDogYW55KTogTFZpZXcge1xuICBjb25zdCBsQ29udGV4dCA9IGxvYWRMQ29udGV4dCh0YXJnZXQpO1xuICBjb25zdCBub2RlSW5keCA9IGxDb250ZXh0Lm5vZGVJbmRleDtcbiAgY29uc3QgbFZpZXcgPSBsQ29udGV4dC5sVmlldztcbiAgY29uc3QgY29tcG9uZW50TFZpZXcgPSBsVmlld1tub2RlSW5keF07XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhjb21wb25lbnRMVmlldyk7XG4gIHJldHVybiBjb21wb25lbnRMVmlldztcbn1cbiJdfQ==