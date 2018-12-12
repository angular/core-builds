/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDefined } from './assert';
import { discoverLocalRefs, getComponentAtNodeIndex, getDirectivesAtNodeIndex, getLContext } from './context_discovery';
import { NodeInjector } from './di';
import { CLEANUP, CONTEXT, FLAGS, HOST, PARENT, TVIEW } from './interfaces/view';
import { readPatchedLView, stringify } from './util';
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
    /** @type {?} */
    const context = loadLContextFromNode(element);
    if (context.component === undefined) {
        context.component = getComponentAtNodeIndex(context.nodeIndex, context.lView);
    }
    return /** @type {?} */ (context.component);
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
    /** @type {?} */
    const context = /** @type {?} */ ((loadLContextFromNode(element)));
    return /** @type {?} */ (context.lView[CONTEXT]);
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
    const context = /** @type {?} */ ((loadLContext(element)));
    /** @type {?} */
    let lView = context.lView;
    while (lView[PARENT] && lView[HOST] === null) {
        // As long as lView[HOST] is null we know we are part of sub-template such as `*ngIf`
        lView = /** @type {?} */ ((lView[PARENT]));
    }
    return lView[FLAGS] & 64 /* IsRoot */ ? null : /** @type {?} */ (lView[CONTEXT]);
}
/**
 * Returns the `RootContext` instance that is associated with
 * the application where the target is situated.
 *
 * @param {?} target
 * @return {?}
 */
export function getRootContext(target) {
    /** @type {?} */
    const lViewData = Array.isArray(target) ? target : /** @type {?} */ ((loadLContext(target))).lView;
    /** @type {?} */
    const rootLView = getRootView(lViewData);
    return /** @type {?} */ (rootLView[CONTEXT]);
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
    const context = loadLContext(target);
    /** @type {?} */
    const tNode = /** @type {?} */ (context.lView[TVIEW].data[context.nodeIndex]);
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
    if (!context)
        return [];
    /** @type {?} */
    const lView = context.lView;
    /** @type {?} */
    const tView = lView[TVIEW];
    /** @type {?} */
    const tNode = /** @type {?} */ (tView.data[context.nodeIndex]);
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
    const context = /** @type {?} */ ((loadLContext(target)));
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
        throw new Error(ngDevMode ? `Unable to find context associated with ${stringify(target)}` :
            'Invalid ng target');
    }
    return context;
}
/**
 * Retrieve the root view from any component by walking the parent `LView` until
 * reaching the root `LView`.
 *
 * @param {?} componentOrView any component or view
 *
 * @return {?}
 */
export function getRootView(componentOrView) {
    /** @type {?} */
    let lView;
    if (Array.isArray(componentOrView)) {
        ngDevMode && assertDefined(componentOrView, 'lView');
        lView = /** @type {?} */ (componentOrView);
    }
    else {
        ngDevMode && assertDefined(componentOrView, 'component');
        lView = /** @type {?} */ ((readPatchedLView(componentOrView)));
    }
    while (lView && !(lView[FLAGS] & 64 /* IsRoot */)) {
        lView = /** @type {?} */ ((lView[PARENT]));
    }
    return lView;
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
    const context = /** @type {?} */ ((loadLContext(target)));
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
    return /** @type {?} */ ((((getLContext(directive))).native));
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
    return /** @type {?} */ ((loadLContext(node)));
}
/**
 * @record
 */
export function Listener() { }
/** @type {?} */
Listener.prototype.name;
/** @type {?} */
Listener.prototype.element;
/** @type {?} */
Listener.prototype.callback;
/** @type {?} */
Listener.prototype.useCapture;
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
    /** @type {?} */
    const lContext = loadLContextFromNode(element);
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
                const listenerElement = lView[secondParam];
                /** @type {?} */
                const callback = lCleanup[tCleanup[i++]];
                /** @type {?} */
                const useCaptureOrIndx = tCleanup[i++];
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzY292ZXJ5X3V0aWxzLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsicGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9kaXNjb3ZlcnlfdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3ZDLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSx1QkFBdUIsRUFBRSx3QkFBd0IsRUFBRSxXQUFXLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUN0SCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBSWxDLE9BQU8sRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQXFCLE1BQU0sRUFBZSxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUMvRyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXVCbkQsTUFBTSxVQUFVLFlBQVksQ0FBUyxPQUFnQjs7SUFDbkQsTUFBTSxPQUFPLEdBQUcsb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFOUMsSUFBSSxPQUFPLENBQUMsU0FBUyxLQUFLLFNBQVMsRUFBRTtRQUNuQyxPQUFPLENBQUMsU0FBUyxHQUFHLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQy9FO0lBRUQseUJBQU8sT0FBTyxDQUFDLFNBQWMsRUFBQztDQUMvQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFzQkQsTUFBTSxVQUFVLFVBQVUsQ0FBUyxPQUFnQjs7SUFDakQsTUFBTSxPQUFPLHNCQUFHLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxHQUFHO0lBQ2hELHlCQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFNLEVBQUM7Q0FDcEM7Ozs7Ozs7Ozs7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QUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQzlCLE9BQU8sU0FBUyxDQUFDO0NBQ2xCOzs7Ozs7QUFFRCxTQUFTLGFBQWEsQ0FBQyxDQUFXLEVBQUUsQ0FBVztJQUM3QyxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLElBQUk7UUFBRSxPQUFPLENBQUMsQ0FBQztJQUMvQixPQUFPLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNqQzs7Ozs7Ozs7QUFPRCxTQUFTLGtCQUFrQixDQUFDLEdBQVE7SUFDbEMsT0FBTyxHQUFHLENBQUMsSUFBSSxLQUFLLFNBQVMsSUFBSSxHQUFHLENBQUMsUUFBUSxLQUFLLFNBQVMsSUFBSSxHQUFHLENBQUMsY0FBYyxLQUFLLFNBQVMsQ0FBQztDQUNqRyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2Rpc2NvdmVyTG9jYWxSZWZzLCBnZXRDb21wb25lbnRBdE5vZGVJbmRleCwgZ2V0RGlyZWN0aXZlc0F0Tm9kZUluZGV4LCBnZXRMQ29udGV4dH0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge05vZGVJbmplY3Rvcn0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge0xDb250ZXh0fSBmcm9tICcuL2ludGVyZmFjZXMvY29udGV4dCc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZVByb3ZpZGVySW5kZXhlc30gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtDTEVBTlVQLCBDT05URVhULCBGTEFHUywgSE9TVCwgTFZpZXcsIExWaWV3RmxhZ3MsIFBBUkVOVCwgUm9vdENvbnRleHQsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge3JlYWRQYXRjaGVkTFZpZXcsIHN0cmluZ2lmeX0gZnJvbSAnLi91dGlsJztcblxuXG4vKipcbiAqIFJldHVybnMgdGhlIGNvbXBvbmVudCBpbnN0YW5jZSBhc3NvY2lhdGVkIHdpdGggYSBnaXZlbiBET00gaG9zdCBlbGVtZW50LlxuICogRWxlbWVudHMgd2hpY2ggZG9uJ3QgcmVwcmVzZW50IGNvbXBvbmVudHMgcmV0dXJuIGBudWxsYC5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudCBIb3N0IERPTSBlbGVtZW50IGZyb20gd2hpY2ggdGhlIGNvbXBvbmVudCBzaG91bGQgYmUgcmV0cmlldmVkLlxuICpcbiAqIGBgYFxuICogPG15LWFwcD5cbiAqICAgI1ZJRVdcbiAqICAgICA8ZGl2PlxuICogICAgICAgPGNoaWxkLWNvbXA+PC9jaGlsZC1jb21wPlxuICogICAgIDwvZGl2PlxuICogPC9tcC1hcHA+XG4gKlxuICogZXhwZWN0KGdldENvbXBvbmVudCg8Y2hpbGQtY29tcD4pIGluc3RhbmNlb2YgQ2hpbGRDb21wb25lbnQpLnRvQmVUcnV0aHkoKTtcbiAqIGV4cGVjdChnZXRDb21wb25lbnQoPG15LWFwcD4pIGluc3RhbmNlb2YgTXlBcHApLnRvQmVUcnV0aHkoKTtcbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbXBvbmVudDxUID0ge30+KGVsZW1lbnQ6IEVsZW1lbnQpOiBUfG51bGwge1xuICBjb25zdCBjb250ZXh0ID0gbG9hZExDb250ZXh0RnJvbU5vZGUoZWxlbWVudCk7XG5cbiAgaWYgKGNvbnRleHQuY29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICBjb250ZXh0LmNvbXBvbmVudCA9IGdldENvbXBvbmVudEF0Tm9kZUluZGV4KGNvbnRleHQubm9kZUluZGV4LCBjb250ZXh0LmxWaWV3KTtcbiAgfVxuXG4gIHJldHVybiBjb250ZXh0LmNvbXBvbmVudCBhcyBUO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGNvbXBvbmVudCBpbnN0YW5jZSBhc3NvY2lhdGVkIHdpdGggYSBnaXZlbiBET00gaG9zdCBlbGVtZW50LlxuICogRWxlbWVudHMgd2hpY2ggZG9uJ3QgcmVwcmVzZW50IGNvbXBvbmVudHMgcmV0dXJuIGBudWxsYC5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudCBIb3N0IERPTSBlbGVtZW50IGZyb20gd2hpY2ggdGhlIGNvbXBvbmVudCBzaG91bGQgYmUgcmV0cmlldmVkLlxuICpcbiAqIGBgYFxuICogPG15LWFwcD5cbiAqICAgI1ZJRVdcbiAqICAgICA8ZGl2PlxuICogICAgICAgPGNoaWxkLWNvbXA+PC9jaGlsZC1jb21wPlxuICogICAgIDwvZGl2PlxuICogPC9tcC1hcHA+XG4gKlxuICogZXhwZWN0KGdldENvbXBvbmVudCg8Y2hpbGQtY29tcD4pIGluc3RhbmNlb2YgQ2hpbGRDb21wb25lbnQpLnRvQmVUcnV0aHkoKTtcbiAqIGV4cGVjdChnZXRDb21wb25lbnQoPG15LWFwcD4pIGluc3RhbmNlb2YgTXlBcHApLnRvQmVUcnV0aHkoKTtcbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbnRleHQ8VCA9IHt9PihlbGVtZW50OiBFbGVtZW50KTogVHxudWxsIHtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRMQ29udGV4dEZyb21Ob2RlKGVsZW1lbnQpICE7XG4gIHJldHVybiBjb250ZXh0LmxWaWV3W0NPTlRFWFRdIGFzIFQ7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY29tcG9uZW50IGluc3RhbmNlIGFzc29jaWF0ZWQgd2l0aCB2aWV3IHdoaWNoIG93bnMgdGhlIERPTSBlbGVtZW50IChgbnVsbGBcbiAqIG90aGVyd2lzZSkuXG4gKlxuICogQHBhcmFtIGVsZW1lbnQgRE9NIGVsZW1lbnQgd2hpY2ggaXMgb3duZWQgYnkgYW4gZXhpc3RpbmcgY29tcG9uZW50J3Mgdmlldy5cbiAqXG4gKiBgYGBcbiAqIDxteS1hcHA+XG4gKiAgICNWSUVXXG4gKiAgICAgPGRpdj5cbiAqICAgICAgIDxjaGlsZC1jb21wPjwvY2hpbGQtY29tcD5cbiAqICAgICA8L2Rpdj5cbiAqIDwvbXAtYXBwPlxuICpcbiAqIGV4cGVjdChnZXRWaWV3Q29tcG9uZW50KDxjaGlsZC1jb21wPikgaW5zdGFuY2VvZiBNeUFwcCkudG9CZVRydXRoeSgpO1xuICogZXhwZWN0KGdldFZpZXdDb21wb25lbnQoPG15LWFwcD4pKS50b0VxdWFsKG51bGwpO1xuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Vmlld0NvbXBvbmVudDxUID0ge30+KGVsZW1lbnQ6IEVsZW1lbnQgfCB7fSk6IFR8bnVsbCB7XG4gIGNvbnN0IGNvbnRleHQgPSBsb2FkTENvbnRleHQoZWxlbWVudCkgITtcbiAgbGV0IGxWaWV3OiBMVmlldyA9IGNvbnRleHQubFZpZXc7XG4gIHdoaWxlIChsVmlld1tQQVJFTlRdICYmIGxWaWV3W0hPU1RdID09PSBudWxsKSB7XG4gICAgLy8gQXMgbG9uZyBhcyBsVmlld1tIT1NUXSBpcyBudWxsIHdlIGtub3cgd2UgYXJlIHBhcnQgb2Ygc3ViLXRlbXBsYXRlIHN1Y2ggYXMgYCpuZ0lmYFxuICAgIGxWaWV3ID0gbFZpZXdbUEFSRU5UXSAhO1xuICB9XG5cbiAgcmV0dXJuIGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuSXNSb290ID8gbnVsbCA6IGxWaWV3W0NPTlRFWFRdIGFzIFQ7XG59XG5cblxuXG4vKipcbiAqIFJldHVybnMgdGhlIGBSb290Q29udGV4dGAgaW5zdGFuY2UgdGhhdCBpcyBhc3NvY2lhdGVkIHdpdGhcbiAqIHRoZSBhcHBsaWNhdGlvbiB3aGVyZSB0aGUgdGFyZ2V0IGlzIHNpdHVhdGVkLlxuICpcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJvb3RDb250ZXh0KHRhcmdldDogTFZpZXcgfCB7fSk6IFJvb3RDb250ZXh0IHtcbiAgY29uc3QgbFZpZXdEYXRhID0gQXJyYXkuaXNBcnJheSh0YXJnZXQpID8gdGFyZ2V0IDogbG9hZExDb250ZXh0KHRhcmdldCkgIS5sVmlldztcbiAgY29uc3Qgcm9vdExWaWV3ID0gZ2V0Um9vdFZpZXcobFZpZXdEYXRhKTtcbiAgcmV0dXJuIHJvb3RMVmlld1tDT05URVhUXSBhcyBSb290Q29udGV4dDtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSBhbGwgcm9vdCBjb21wb25lbnRzLlxuICpcbiAqIFJvb3QgY29tcG9uZW50cyBhcmUgdGhvc2Ugd2hpY2ggaGF2ZSBiZWVuIGJvb3RzdHJhcHBlZCBieSBBbmd1bGFyLlxuICpcbiAqIEBwYXJhbSB0YXJnZXQgQSBET00gZWxlbWVudCwgY29tcG9uZW50IG9yIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSb290Q29tcG9uZW50cyh0YXJnZXQ6IHt9KTogYW55W10ge1xuICByZXR1cm4gWy4uLmdldFJvb3RDb250ZXh0KHRhcmdldCkuY29tcG9uZW50c107XG59XG5cbi8qKlxuICogUmV0cmlldmVzIGFuIGBJbmplY3RvcmAgYXNzb2NpYXRlZCB3aXRoIHRoZSBlbGVtZW50LCBjb21wb25lbnQgb3IgZGlyZWN0aXZlLlxuICpcbiAqIEBwYXJhbSB0YXJnZXQgQSBET00gZWxlbWVudCwgY29tcG9uZW50IG9yIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbmplY3Rvcih0YXJnZXQ6IHt9KTogSW5qZWN0b3Ige1xuICBjb25zdCBjb250ZXh0ID0gbG9hZExDb250ZXh0KHRhcmdldCk7XG4gIGNvbnN0IHROb2RlID0gY29udGV4dC5sVmlld1tUVklFV10uZGF0YVtjb250ZXh0Lm5vZGVJbmRleF0gYXMgVEVsZW1lbnROb2RlO1xuICByZXR1cm4gbmV3IE5vZGVJbmplY3Rvcih0Tm9kZSwgY29udGV4dC5sVmlldyk7XG59XG5cbi8qKlxuICogUmV0cmlldmUgYSBzZXQgb2YgaW5qZWN0aW9uIHRva2VucyBhdCBhIGdpdmVuIERPTSBub2RlLlxuICpcbiAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgZm9yIHdoaWNoIHRoZSBpbmplY3Rpb24gdG9rZW5zIHNob3VsZCBiZSByZXRyaWV2ZWQuXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbmplY3Rpb25Ub2tlbnMoZWxlbWVudDogRWxlbWVudCk6IGFueVtdIHtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRMQ29udGV4dChlbGVtZW50LCBmYWxzZSk7XG4gIGlmICghY29udGV4dCkgcmV0dXJuIFtdO1xuICBjb25zdCBsVmlldyA9IGNvbnRleHQubFZpZXc7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFROb2RlO1xuICBjb25zdCBwcm92aWRlclRva2VuczogYW55W10gPSBbXTtcbiAgY29uc3Qgc3RhcnRJbmRleCA9IHROb2RlLnByb3ZpZGVySW5kZXhlcyAmIFROb2RlUHJvdmlkZXJJbmRleGVzLlByb3ZpZGVyc1N0YXJ0SW5kZXhNYXNrO1xuICBjb25zdCBlbmRJbmRleCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXg7IGkgPCBlbmRJbmRleDsgaSsrKSB7XG4gICAgbGV0IHZhbHVlID0gdFZpZXcuZGF0YVtpXTtcbiAgICBpZiAoaXNEaXJlY3RpdmVEZWZIYWNrKHZhbHVlKSkge1xuICAgICAgLy8gVGhlIGZhY3QgdGhhdCB3ZSBzb21ldGltZXMgc3RvcmUgVHlwZSBhbmQgc29tZXRpbWVzIERpcmVjdGl2ZURlZiBpbiB0aGlzIGxvY2F0aW9uIGlzIGFcbiAgICAgIC8vIGRlc2lnbiBmbGF3LiAgV2Ugc2hvdWxkIGFsd2F5cyBzdG9yZSBzYW1lIHR5cGUgc28gdGhhdCB3ZSBjYW4gYmUgbW9ub21vcnBoaWMuIFRoZSBpc3N1ZVxuICAgICAgLy8gaXMgdGhhdCBmb3IgQ29tcG9uZW50cy9EaXJlY3RpdmVzIHdlIHN0b3JlIHRoZSBkZWYgaW5zdGVhZCB0aGUgdHlwZS4gVGhlIGNvcnJlY3QgYmVoYXZpb3JcbiAgICAgIC8vIGlzIHRoYXQgd2Ugc2hvdWxkIGFsd2F5cyBiZSBzdG9yaW5nIGluamVjdGFibGUgdHlwZSBpbiB0aGlzIGxvY2F0aW9uLlxuICAgICAgdmFsdWUgPSB2YWx1ZS50eXBlO1xuICAgIH1cbiAgICBwcm92aWRlclRva2Vucy5wdXNoKHZhbHVlKTtcbiAgfVxuICByZXR1cm4gcHJvdmlkZXJUb2tlbnM7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIGRpcmVjdGl2ZXMgYXNzb2NpYXRlZCB3aXRoIGEgZ2l2ZW4gRE9NIGhvc3QgZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gdGFyZ2V0IEEgRE9NIGVsZW1lbnQsIGNvbXBvbmVudCBvciBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGlyZWN0aXZlcyh0YXJnZXQ6IHt9KTogQXJyYXk8e30+IHtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRMQ29udGV4dCh0YXJnZXQpICE7XG5cbiAgaWYgKGNvbnRleHQuZGlyZWN0aXZlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgY29udGV4dC5kaXJlY3RpdmVzID0gZ2V0RGlyZWN0aXZlc0F0Tm9kZUluZGV4KGNvbnRleHQubm9kZUluZGV4LCBjb250ZXh0LmxWaWV3LCBmYWxzZSk7XG4gIH1cblxuICByZXR1cm4gY29udGV4dC5kaXJlY3RpdmVzIHx8IFtdO1xufVxuXG4vKipcbiAqIFJldHVybnMgTENvbnRleHQgYXNzb2NpYXRlZCB3aXRoIGEgdGFyZ2V0IHBhc3NlZCBhcyBhbiBhcmd1bWVudC5cbiAqIFRocm93cyBpZiBhIGdpdmVuIHRhcmdldCBkb2Vzbid0IGhhdmUgYXNzb2NpYXRlZCBMQ29udGV4dC5cbiAqXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkTENvbnRleHQodGFyZ2V0OiB7fSk6IExDb250ZXh0O1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWRMQ29udGV4dCh0YXJnZXQ6IHt9LCB0aHJvd09uTm90Rm91bmQ6IGZhbHNlKTogTENvbnRleHR8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBsb2FkTENvbnRleHQodGFyZ2V0OiB7fSwgdGhyb3dPbk5vdEZvdW5kOiBib29sZWFuID0gdHJ1ZSk6IExDb250ZXh0fG51bGwge1xuICBjb25zdCBjb250ZXh0ID0gZ2V0TENvbnRleHQodGFyZ2V0KTtcbiAgaWYgKCFjb250ZXh0ICYmIHRocm93T25Ob3RGb3VuZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgbmdEZXZNb2RlID8gYFVuYWJsZSB0byBmaW5kIGNvbnRleHQgYXNzb2NpYXRlZCB3aXRoICR7c3RyaW5naWZ5KHRhcmdldCl9YCA6XG4gICAgICAgICAgICAgICAgICAgICdJbnZhbGlkIG5nIHRhcmdldCcpO1xuICB9XG4gIHJldHVybiBjb250ZXh0O1xufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSByb290IHZpZXcgZnJvbSBhbnkgY29tcG9uZW50IGJ5IHdhbGtpbmcgdGhlIHBhcmVudCBgTFZpZXdgIHVudGlsXG4gKiByZWFjaGluZyB0aGUgcm9vdCBgTFZpZXdgLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnRPclZpZXcgYW55IGNvbXBvbmVudCBvciB2aWV3XG4gKlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Um9vdFZpZXcoY29tcG9uZW50T3JWaWV3OiBMVmlldyB8IHt9KTogTFZpZXcge1xuICBsZXQgbFZpZXc6IExWaWV3O1xuICBpZiAoQXJyYXkuaXNBcnJheShjb21wb25lbnRPclZpZXcpKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY29tcG9uZW50T3JWaWV3LCAnbFZpZXcnKTtcbiAgICBsVmlldyA9IGNvbXBvbmVudE9yVmlldyBhcyBMVmlldztcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb21wb25lbnRPclZpZXcsICdjb21wb25lbnQnKTtcbiAgICBsVmlldyA9IHJlYWRQYXRjaGVkTFZpZXcoY29tcG9uZW50T3JWaWV3KSAhO1xuICB9XG4gIHdoaWxlIChsVmlldyAmJiAhKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuSXNSb290KSkge1xuICAgIGxWaWV3ID0gbFZpZXdbUEFSRU5UXSAhO1xuICB9XG4gIHJldHVybiBsVmlldztcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSBtYXAgb2YgbG9jYWwgcmVmZXJlbmNlcy5cbiAqXG4gKiBUaGUgcmVmZXJlbmNlcyBhcmUgcmV0cmlldmVkIGFzIGEgbWFwIG9mIGxvY2FsIHJlZmVyZW5jZSBuYW1lIHRvIGVsZW1lbnQgb3IgZGlyZWN0aXZlIGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB0YXJnZXQgQSBET00gZWxlbWVudCwgY29tcG9uZW50IG9yIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2NhbFJlZnModGFyZ2V0OiB7fSk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRMQ29udGV4dCh0YXJnZXQpICE7XG5cbiAgaWYgKGNvbnRleHQubG9jYWxSZWZzID09PSB1bmRlZmluZWQpIHtcbiAgICBjb250ZXh0LmxvY2FsUmVmcyA9IGRpc2NvdmVyTG9jYWxSZWZzKGNvbnRleHQubFZpZXcsIGNvbnRleHQubm9kZUluZGV4KTtcbiAgfVxuXG4gIHJldHVybiBjb250ZXh0LmxvY2FsUmVmcyB8fCB7fTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgaG9zdCBlbGVtZW50IG9mIHRoZSBjb21wb25lbnQuXG4gKlxuICogVXNlIHRoaXMgZnVuY3Rpb24gdG8gcmV0cmlldmUgdGhlIGhvc3QgZWxlbWVudCBvZiB0aGUgY29tcG9uZW50LiBUaGUgaG9zdFxuICogZWxlbWVudCBpcyB0aGUgZWxlbWVudCB3aGljaCB0aGUgY29tcG9uZW50IGlzIGFzc29jaWF0ZWQgd2l0aC5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlIENvbXBvbmVudCBvciBEaXJlY3RpdmUgZm9yIHdoaWNoIHRoZSBob3N0IGVsZW1lbnQgc2hvdWxkIGJlIHJldHJpZXZlZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRIb3N0RWxlbWVudDxUPihkaXJlY3RpdmU6IFQpOiBFbGVtZW50IHtcbiAgcmV0dXJuIGdldExDb250ZXh0KGRpcmVjdGl2ZSkgIS5uYXRpdmUgYXMgbmV2ZXIgYXMgRWxlbWVudDtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIHJlbmRlcmVkIHRleHQgZm9yIGEgZ2l2ZW4gY29tcG9uZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gcmV0cmlldmVzIHRoZSBob3N0IGVsZW1lbnQgb2YgYSBjb21wb25lbnQgYW5kXG4gKiBhbmQgdGhlbiByZXR1cm5zIHRoZSBgdGV4dENvbnRlbnRgIGZvciB0aGF0IGVsZW1lbnQuIFRoaXMgaW1wbGllc1xuICogdGhhdCB0aGUgdGV4dCByZXR1cm5lZCB3aWxsIGluY2x1ZGUgcmUtcHJvamVjdGVkIGNvbnRlbnQgb2ZcbiAqIHRoZSBjb21wb25lbnQgYXMgd2VsbC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IFRoZSBjb21wb25lbnQgdG8gcmV0dXJuIHRoZSBjb250ZW50IHRleHQgZm9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVuZGVyZWRUZXh0KGNvbXBvbmVudDogYW55KTogc3RyaW5nIHtcbiAgY29uc3QgaG9zdEVsZW1lbnQgPSBnZXRIb3N0RWxlbWVudChjb21wb25lbnQpO1xuICByZXR1cm4gaG9zdEVsZW1lbnQudGV4dENvbnRlbnQgfHwgJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2FkTENvbnRleHRGcm9tTm9kZShub2RlOiBOb2RlKTogTENvbnRleHQge1xuICBpZiAoIShub2RlIGluc3RhbmNlb2YgTm9kZSkpIHRocm93IG5ldyBFcnJvcignRXhwZWN0aW5nIGluc3RhbmNlIG9mIERPTSBOb2RlJyk7XG4gIHJldHVybiBsb2FkTENvbnRleHQobm9kZSkgITtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMaXN0ZW5lciB7XG4gIG5hbWU6IHN0cmluZztcbiAgZWxlbWVudDogRWxlbWVudDtcbiAgY2FsbGJhY2s6ICh2YWx1ZTogYW55KSA9PiBhbnk7XG4gIHVzZUNhcHR1cmU6IGJvb2xlYW58bnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQnJvd3NlckV2ZW50cyhsaXN0ZW5lcjogTGlzdGVuZXIpOiBib29sZWFuIHtcbiAgLy8gQnJvd3NlciBldmVudHMgYXJlIHRob3NlIHdoaWNoIGRvbid0IGhhdmUgYHVzZUNhcHR1cmVgIGFzIGJvb2xlYW4uXG4gIHJldHVybiB0eXBlb2YgbGlzdGVuZXIudXNlQ2FwdHVyZSA9PT0gJ2Jvb2xlYW4nO1xufVxuXG5cbi8qKlxuICogUmV0cmlldmVzIGEgbGlzdCBvZiBET00gbGlzdGVuZXJzLlxuICpcbiAqIGBgYFxuICogPG15LWFwcD5cbiAqICAgI1ZJRVdcbiAqICAgICA8ZGl2IChjbGljayk9XCJkb1NvbWV0aGluZygpXCI+XG4gKiAgICAgPC9kaXY+XG4gKiA8L21wLWFwcD5cbiAqXG4gKiBleHBlY3QoZ2V0TGlzdGVuZXJzKDxkaXY+KSkudG9FcXVhbCh7XG4gKiAgIG5hbWU6ICdjbGljaycsXG4gKiAgIGVsZW1lbnQ6IDxkaXY+LFxuICogICBjYWxsYmFjazogKCkgPT4gZG9Tb21ldGhpbmcoKSxcbiAqICAgdXNlQ2FwdHVyZTogZmFsc2VcbiAqIH0pO1xuICogYGBgXG4gKlxuICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCBmb3Igd2hpY2ggdGhlIERPTSBsaXN0ZW5lcnMgc2hvdWxkIGJlIHJldHJpZXZlZC5cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExpc3RlbmVycyhlbGVtZW50OiBFbGVtZW50KTogTGlzdGVuZXJbXSB7XG4gIGNvbnN0IGxDb250ZXh0ID0gbG9hZExDb250ZXh0RnJvbU5vZGUoZWxlbWVudCk7XG4gIGNvbnN0IGxWaWV3ID0gbENvbnRleHQubFZpZXc7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBsQ2xlYW51cCA9IGxWaWV3W0NMRUFOVVBdO1xuICBjb25zdCB0Q2xlYW51cCA9IHRWaWV3LmNsZWFudXA7XG4gIGNvbnN0IGxpc3RlbmVyczogTGlzdGVuZXJbXSA9IFtdO1xuICBpZiAodENsZWFudXAgJiYgbENsZWFudXApIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRDbGVhbnVwLmxlbmd0aDspIHtcbiAgICAgIGNvbnN0IGZpcnN0UGFyYW0gPSB0Q2xlYW51cFtpKytdO1xuICAgICAgY29uc3Qgc2Vjb25kUGFyYW0gPSB0Q2xlYW51cFtpKytdO1xuICAgICAgaWYgKHR5cGVvZiBmaXJzdFBhcmFtID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb25zdCBuYW1lOiBzdHJpbmcgPSBmaXJzdFBhcmFtO1xuICAgICAgICBjb25zdCBsaXN0ZW5lckVsZW1lbnQ6IEVsZW1lbnQgPSBsVmlld1tzZWNvbmRQYXJhbV07XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrOiAodmFsdWU6IGFueSkgPT4gYW55ID0gbENsZWFudXBbdENsZWFudXBbaSsrXV07XG4gICAgICAgIGNvbnN0IHVzZUNhcHR1cmVPckluZHggPSB0Q2xlYW51cFtpKytdO1xuICAgICAgICAvLyBpZiB1c2VDYXB0dXJlT3JJbmR4IGlzIGJvb2xlYW4gdGhlbiByZXBvcnQgaXQgYXMgaXMuXG4gICAgICAgIC8vIGlmIHVzZUNhcHR1cmVPckluZHggaXMgcG9zaXRpdmUgbnVtYmVyIHRoZW4gaXQgaW4gdW5zdWJzY3JpYmUgbWV0aG9kXG4gICAgICAgIC8vIGlmIHVzZUNhcHR1cmVPckluZHggaXMgbmVnYXRpdmUgbnVtYmVyIHRoZW4gaXQgaXMgYSBTdWJzY3JpcHRpb25cbiAgICAgICAgY29uc3QgdXNlQ2FwdHVyZSA9IHR5cGVvZiB1c2VDYXB0dXJlT3JJbmR4ID09PSAnYm9vbGVhbicgP1xuICAgICAgICAgICAgdXNlQ2FwdHVyZU9ySW5keCA6XG4gICAgICAgICAgICAodXNlQ2FwdHVyZU9ySW5keCA+PSAwID8gZmFsc2UgOiBudWxsKTtcbiAgICAgICAgaWYgKGVsZW1lbnQgPT0gbGlzdGVuZXJFbGVtZW50KSB7XG4gICAgICAgICAgbGlzdGVuZXJzLnB1c2goe2VsZW1lbnQsIG5hbWUsIGNhbGxiYWNrLCB1c2VDYXB0dXJlfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgbGlzdGVuZXJzLnNvcnQoc29ydExpc3RlbmVycyk7XG4gIHJldHVybiBsaXN0ZW5lcnM7XG59XG5cbmZ1bmN0aW9uIHNvcnRMaXN0ZW5lcnMoYTogTGlzdGVuZXIsIGI6IExpc3RlbmVyKSB7XG4gIGlmIChhLm5hbWUgPT0gYi5uYW1lKSByZXR1cm4gMDtcbiAgcmV0dXJuIGEubmFtZSA8IGIubmFtZSA/IC0xIDogMTtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIHNob3VsZCBub3QgZXhpc3QgYmVjYXVzZSBpdCBpcyBtZWdhbW9ycGhpYyBhbmQgb25seSBtb3N0bHkgY29ycmVjdC5cbiAqXG4gKiBTZWUgY2FsbCBzaXRlIGZvciBtb3JlIGluZm8uXG4gKi9cbmZ1bmN0aW9uIGlzRGlyZWN0aXZlRGVmSGFjayhvYmo6IGFueSk6IG9iaiBpcyBEaXJlY3RpdmVEZWY8YW55PiB7XG4gIHJldHVybiBvYmoudHlwZSAhPT0gdW5kZWZpbmVkICYmIG9iai50ZW1wbGF0ZSAhPT0gdW5kZWZpbmVkICYmIG9iai5kZWNsYXJlZElucHV0cyAhPT0gdW5kZWZpbmVkO1xufVxuIl19