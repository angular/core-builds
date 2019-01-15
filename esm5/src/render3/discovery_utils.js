/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { assertDefined } from '../util/assert';
import { discoverLocalRefs, getComponentAtNodeIndex, getDirectivesAtNodeIndex, getLContext } from './context_discovery';
import { NodeInjector } from './di';
import { CLEANUP, CONTEXT, FLAGS, HOST, PARENT, TVIEW } from './interfaces/view';
import { readElementValue, readPatchedLView, renderStringify } from './util';
/**
 * Returns the component instance associated with a given DOM host element.
 * Elements which don't represent components return `null`.
 *
 * @param element Host DOM element from which the component should be retrieved.
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
 * @publicApi
 */
export function getComponent(element) {
    var context = loadLContextFromNode(element);
    if (context.component === undefined) {
        context.component = getComponentAtNodeIndex(context.nodeIndex, context.lView);
    }
    return context.component;
}
/**
 * Returns the component instance associated with a given DOM host element.
 * Elements which don't represent components return `null`.
 *
 * @param element Host DOM element from which the component should be retrieved.
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
 * @publicApi
 */
export function getContext(element) {
    var context = loadLContextFromNode(element);
    return context.lView[CONTEXT];
}
/**
 * Returns the component instance associated with view which owns the DOM element (`null`
 * otherwise).
 *
 * @param element DOM element which is owned by an existing component's view.
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
 * @publicApi
 */
export function getViewComponent(element) {
    var context = loadLContext(element);
    var lView = context.lView;
    while (lView[PARENT] && lView[HOST] === null) {
        // As long as lView[HOST] is null we know we are part of sub-template such as `*ngIf`
        lView = lView[PARENT];
    }
    return lView[FLAGS] & 128 /* IsRoot */ ? null : lView[CONTEXT];
}
/**
 * Returns the `RootContext` instance that is associated with
 * the application where the target is situated.
 *
 */
export function getRootContext(target) {
    var lViewData = Array.isArray(target) ? target : loadLContext(target).lView;
    var rootLView = getRootView(lViewData);
    return rootLView[CONTEXT];
}
/**
 * Retrieve all root components.
 *
 * Root components are those which have been bootstrapped by Angular.
 *
 * @param target A DOM element, component or directive instance.
 *
 * @publicApi
 */
export function getRootComponents(target) {
    return tslib_1.__spread(getRootContext(target).components);
}
/**
 * Retrieves an `Injector` associated with the element, component or directive.
 *
 * @param target A DOM element, component or directive instance.
 *
 * @publicApi
 */
export function getInjector(target) {
    var context = loadLContext(target);
    var tNode = context.lView[TVIEW].data[context.nodeIndex];
    return new NodeInjector(tNode, context.lView);
}
/**
 * Retrieve a set of injection tokens at a given DOM node.
 *
 * @param element Element for which the injection tokens should be retrieved.
 * @publicApi
 */
export function getInjectionTokens(element) {
    var context = loadLContext(element, false);
    if (!context)
        return [];
    var lView = context.lView;
    var tView = lView[TVIEW];
    var tNode = tView.data[context.nodeIndex];
    var providerTokens = [];
    var startIndex = tNode.providerIndexes & 65535 /* ProvidersStartIndexMask */;
    var endIndex = tNode.directiveEnd;
    for (var i = startIndex; i < endIndex; i++) {
        var value = tView.data[i];
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
 * @param target A DOM element, component or directive instance.
 *
 * @publicApi
 */
export function getDirectives(target) {
    var context = loadLContext(target);
    if (context.directives === undefined) {
        context.directives = getDirectivesAtNodeIndex(context.nodeIndex, context.lView, false);
    }
    return context.directives || [];
}
export function loadLContext(target, throwOnNotFound) {
    if (throwOnNotFound === void 0) { throwOnNotFound = true; }
    var context = getLContext(target);
    if (!context && throwOnNotFound) {
        throw new Error(ngDevMode ? "Unable to find context associated with " + renderStringify(target) :
            'Invalid ng target');
    }
    return context;
}
/**
 * Retrieve the root view from any component by walking the parent `LView` until
 * reaching the root `LView`.
 *
 * @param componentOrView any component or view
 *
 */
export function getRootView(componentOrView) {
    var lView;
    if (Array.isArray(componentOrView)) {
        ngDevMode && assertDefined(componentOrView, 'lView');
        lView = componentOrView;
    }
    else {
        ngDevMode && assertDefined(componentOrView, 'component');
        lView = readPatchedLView(componentOrView);
    }
    while (lView && !(lView[FLAGS] & 128 /* IsRoot */)) {
        lView = lView[PARENT];
    }
    return lView;
}
/**
 * Retrieve map of local references.
 *
 * The references are retrieved as a map of local reference name to element or directive instance.
 *
 * @param target A DOM element, component or directive instance.
 *
 * @publicApi
 */
export function getLocalRefs(target) {
    var context = loadLContext(target);
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
 * @param directive Component or Directive for which the host element should be retrieved.
 *
 * @publicApi
 */
export function getHostElement(directive) {
    return getLContext(directive).native;
}
/**
 * Retrieves the rendered text for a given component.
 *
 * This function retrieves the host element of a component and
 * and then returns the `textContent` for that element. This implies
 * that the text returned will include re-projected content of
 * the component as well.
 *
 * @param component The component to return the content text for.
 */
export function getRenderedText(component) {
    var hostElement = getHostElement(component);
    return hostElement.textContent || '';
}
export function loadLContextFromNode(node) {
    if (!(node instanceof Node))
        throw new Error('Expecting instance of DOM Node');
    return loadLContext(node);
}
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
 * @param element Element for which the DOM listeners should be retrieved.
 * @publicApi
 */
export function getListeners(element) {
    var lContext = loadLContextFromNode(element);
    var lView = lContext.lView;
    var tView = lView[TVIEW];
    var lCleanup = lView[CLEANUP];
    var tCleanup = tView.cleanup;
    var listeners = [];
    if (tCleanup && lCleanup) {
        for (var i = 0; i < tCleanup.length;) {
            var firstParam = tCleanup[i++];
            var secondParam = tCleanup[i++];
            if (typeof firstParam === 'string') {
                var name_1 = firstParam;
                var listenerElement = readElementValue(lView[secondParam]);
                var callback = lCleanup[tCleanup[i++]];
                var useCaptureOrIndx = tCleanup[i++];
                // if useCaptureOrIndx is boolean then report it as is.
                // if useCaptureOrIndx is positive number then it in unsubscribe method
                // if useCaptureOrIndx is negative number then it is a Subscription
                var useCapture = typeof useCaptureOrIndx === 'boolean' ?
                    useCaptureOrIndx :
                    (useCaptureOrIndx >= 0 ? false : null);
                if (element == listenerElement) {
                    listeners.push({ element: element, name: name_1, callback: callback, useCapture: useCapture });
                }
            }
        }
    }
    listeners.sort(sortListeners);
    return listeners;
}
function sortListeners(a, b) {
    if (a.name == b.name)
        return 0;
    return a.name < b.name ? -1 : 1;
}
/**
 * This function should not exist because it is megamorphic and only mostly correct.
 *
 * See call site for more info.
 */
function isDirectiveDefHack(obj) {
    return obj.type !== undefined && obj.template !== undefined && obj.declaredInputs !== undefined;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzY292ZXJ5X3V0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9kaXNjb3ZlcnlfdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUlILE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM3QyxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsdUJBQXVCLEVBQUUsd0JBQXdCLEVBQUUsV0FBVyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEgsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUlsQyxPQUFPLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFxQixNQUFNLEVBQWUsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDL0csT0FBTyxFQUFDLGdCQUFnQixFQUFFLGdCQUFnQixFQUFFLGVBQWUsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUkzRTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW1CRztBQUNILE1BQU0sVUFBVSxZQUFZLENBQVMsT0FBZ0I7SUFDbkQsSUFBTSxPQUFPLEdBQUcsb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFOUMsSUFBSSxPQUFPLENBQUMsU0FBUyxLQUFLLFNBQVMsRUFBRTtRQUNuQyxPQUFPLENBQUMsU0FBUyxHQUFHLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQy9FO0lBRUQsT0FBTyxPQUFPLENBQUMsU0FBYyxDQUFDO0FBQ2hDLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW1CRztBQUNILE1BQU0sVUFBVSxVQUFVLENBQVMsT0FBZ0I7SUFDakQsSUFBTSxPQUFPLEdBQUcsb0JBQW9CLENBQUMsT0FBTyxDQUFHLENBQUM7SUFDaEQs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QyxDQUFDO29CQUNsQixDQUFDLGdCQUFnQixJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDM0MsSUFBSSxPQUFPLElBQUksZUFBZSxFQUFFO29CQUM5QixTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUMsT0FBTyxTQUFBLEVBQUUsSUFBSSxRQUFBLEVBQUUsUUFBUSxVQUFBLEVBQUUsVUFBVSxZQUFBLEVBQUMsQ0FBQyxDQUFDO2lCQUN2RDthQUNGO1NBQ0Y7S0FDRjtJQUNELFNBQVMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDOUIsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQztBQUVELFNBQVMsYUFBYSxDQUFDLENBQVcsRUFBRSxDQUFXO0lBQzdDLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSTtRQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQy9CLE9BQU8sQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xDLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUyxrQkFBa0IsQ0FBQyxHQUFRO0lBQ2xDLE9BQU8sR0FBRyxDQUFDLElBQUksS0FBSyxTQUFTLElBQUksR0FBRyxDQUFDLFFBQVEsS0FBSyxTQUFTLElBQUksR0FBRyxDQUFDLGNBQWMsS0FBSyxTQUFTLENBQUM7QUFDbEcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7ZGlzY292ZXJMb2NhbFJlZnMsIGdldENvbXBvbmVudEF0Tm9kZUluZGV4LCBnZXREaXJlY3RpdmVzQXROb2RlSW5kZXgsIGdldExDb250ZXh0fSBmcm9tICcuL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7Tm9kZUluamVjdG9yfSBmcm9tICcuL2RpJztcbmltcG9ydCB7TENvbnRleHR9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250ZXh0JztcbmltcG9ydCB7RGlyZWN0aXZlRGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1RFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlUHJvdmlkZXJJbmRleGVzfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0NMRUFOVVAsIENPTlRFWFQsIEZMQUdTLCBIT1NULCBMVmlldywgTFZpZXdGbGFncywgUEFSRU5ULCBSb290Q29udGV4dCwgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7cmVhZEVsZW1lbnRWYWx1ZSwgcmVhZFBhdGNoZWRMVmlldywgcmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuXG5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjb21wb25lbnQgaW5zdGFuY2UgYXNzb2NpYXRlZCB3aXRoIGEgZ2l2ZW4gRE9NIGhvc3QgZWxlbWVudC5cbiAqIEVsZW1lbnRzIHdoaWNoIGRvbid0IHJlcHJlc2VudCBjb21wb25lbnRzIHJldHVybiBgbnVsbGAuXG4gKlxuICogQHBhcmFtIGVsZW1lbnQgSG9zdCBET00gZWxlbWVudCBmcm9tIHdoaWNoIHRoZSBjb21wb25lbnQgc2hvdWxkIGJlIHJldHJpZXZlZC5cbiAqXG4gKiBgYGBcbiAqIDxteS1hcHA+XG4gKiAgICNWSUVXXG4gKiAgICAgPGRpdj5cbiAqICAgICAgIDxjaGlsZC1jb21wPjwvY2hpbGQtY29tcD5cbiAqICAgICA8L2Rpdj5cbiAqIDwvbXAtYXBwPlxuICpcbiAqIGV4cGVjdChnZXRDb21wb25lbnQoPGNoaWxkLWNvbXA+KSBpbnN0YW5jZW9mIENoaWxkQ29tcG9uZW50KS50b0JlVHJ1dGh5KCk7XG4gKiBleHBlY3QoZ2V0Q29tcG9uZW50KDxteS1hcHA+KSBpbnN0YW5jZW9mIE15QXBwKS50b0JlVHJ1dGh5KCk7XG4gKiBgYGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21wb25lbnQ8VCA9IHt9PihlbGVtZW50OiBFbGVtZW50KTogVHxudWxsIHtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRMQ29udGV4dEZyb21Ob2RlKGVsZW1lbnQpO1xuXG4gIGlmIChjb250ZXh0LmNvbXBvbmVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgY29udGV4dC5jb21wb25lbnQgPSBnZXRDb21wb25lbnRBdE5vZGVJbmRleChjb250ZXh0Lm5vZGVJbmRleCwgY29udGV4dC5sVmlldyk7XG4gIH1cblxuICByZXR1cm4gY29udGV4dC5jb21wb25lbnQgYXMgVDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjb21wb25lbnQgaW5zdGFuY2UgYXNzb2NpYXRlZCB3aXRoIGEgZ2l2ZW4gRE9NIGhvc3QgZWxlbWVudC5cbiAqIEVsZW1lbnRzIHdoaWNoIGRvbid0IHJlcHJlc2VudCBjb21wb25lbnRzIHJldHVybiBgbnVsbGAuXG4gKlxuICogQHBhcmFtIGVsZW1lbnQgSG9zdCBET00gZWxlbWVudCBmcm9tIHdoaWNoIHRoZSBjb21wb25lbnQgc2hvdWxkIGJlIHJldHJpZXZlZC5cbiAqXG4gKiBgYGBcbiAqIDxteS1hcHA+XG4gKiAgICNWSUVXXG4gKiAgICAgPGRpdj5cbiAqICAgICAgIDxjaGlsZC1jb21wPjwvY2hpbGQtY29tcD5cbiAqICAgICA8L2Rpdj5cbiAqIDwvbXAtYXBwPlxuICpcbiAqIGV4cGVjdChnZXRDb21wb25lbnQoPGNoaWxkLWNvbXA+KSBpbnN0YW5jZW9mIENoaWxkQ29tcG9uZW50KS50b0JlVHJ1dGh5KCk7XG4gKiBleHBlY3QoZ2V0Q29tcG9uZW50KDxteS1hcHA+KSBpbnN0YW5jZW9mIE15QXBwKS50b0JlVHJ1dGh5KCk7XG4gKiBgYGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb250ZXh0PFQgPSB7fT4oZWxlbWVudDogRWxlbWVudCk6IFR8bnVsbCB7XG4gIGNvbnN0IGNvbnRleHQgPSBsb2FkTENvbnRleHRGcm9tTm9kZShlbGVtZW50KSAhO1xuICByZXR1cm4gY29udGV4dC5sVmlld1tDT05URVhUXSBhcyBUO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGNvbXBvbmVudCBpbnN0YW5jZSBhc3NvY2lhdGVkIHdpdGggdmlldyB3aGljaCBvd25zIHRoZSBET00gZWxlbWVudCAoYG51bGxgXG4gKiBvdGhlcndpc2UpLlxuICpcbiAqIEBwYXJhbSBlbGVtZW50IERPTSBlbGVtZW50IHdoaWNoIGlzIG93bmVkIGJ5IGFuIGV4aXN0aW5nIGNvbXBvbmVudCdzIHZpZXcuXG4gKlxuICogYGBgXG4gKiA8bXktYXBwPlxuICogICAjVklFV1xuICogICAgIDxkaXY+XG4gKiAgICAgICA8Y2hpbGQtY29tcD48L2NoaWxkLWNvbXA+XG4gKiAgICAgPC9kaXY+XG4gKiA8L21wLWFwcD5cbiAqXG4gKiBleHBlY3QoZ2V0Vmlld0NvbXBvbmVudCg8Y2hpbGQtY29tcD4pIGluc3RhbmNlb2YgTXlBcHApLnRvQmVUcnV0aHkoKTtcbiAqIGV4cGVjdChnZXRWaWV3Q29tcG9uZW50KDxteS1hcHA+KSkudG9FcXVhbChudWxsKTtcbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFZpZXdDb21wb25lbnQ8VCA9IHt9PihlbGVtZW50OiBFbGVtZW50IHwge30pOiBUfG51bGwge1xuICBjb25zdCBjb250ZXh0ID0gbG9hZExDb250ZXh0KGVsZW1lbnQpICE7XG4gIGxldCBsVmlldzogTFZpZXcgPSBjb250ZXh0LmxWaWV3O1xuICB3aGlsZSAobFZpZXdbUEFSRU5UXSAmJiBsVmlld1tIT1NUXSA9PT0gbnVsbCkge1xuICAgIC8vIEFzIGxvbmcgYXMgbFZpZXdbSE9TVF0gaXMgbnVsbCB3ZSBrbm93IHdlIGFyZSBwYXJ0IG9mIHN1Yi10ZW1wbGF0ZSBzdWNoIGFzIGAqbmdJZmBcbiAgICBsVmlldyA9IGxWaWV3W1BBUkVOVF0gITtcbiAgfVxuXG4gIHJldHVybiBsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLklzUm9vdCA/IG51bGwgOiBsVmlld1tDT05URVhUXSBhcyBUO1xufVxuXG5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBgUm9vdENvbnRleHRgIGluc3RhbmNlIHRoYXQgaXMgYXNzb2NpYXRlZCB3aXRoXG4gKiB0aGUgYXBwbGljYXRpb24gd2hlcmUgdGhlIHRhcmdldCBpcyBzaXR1YXRlZC5cbiAqXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSb290Q29udGV4dCh0YXJnZXQ6IExWaWV3IHwge30pOiBSb290Q29udGV4dCB7XG4gIGNvbnN0IGxWaWV3RGF0YSA9IEFycmF5LmlzQXJyYXkodGFyZ2V0KSA/IHRhcmdldCA6IGxvYWRMQ29udGV4dCh0YXJnZXQpICEubFZpZXc7XG4gIGNvbnN0IHJvb3RMVmlldyA9IGdldFJvb3RWaWV3KGxWaWV3RGF0YSk7XG4gIHJldHVybiByb290TFZpZXdbQ09OVEVYVF0gYXMgUm9vdENvbnRleHQ7XG59XG5cbi8qKlxuICogUmV0cmlldmUgYWxsIHJvb3QgY29tcG9uZW50cy5cbiAqXG4gKiBSb290IGNvbXBvbmVudHMgYXJlIHRob3NlIHdoaWNoIGhhdmUgYmVlbiBib290c3RyYXBwZWQgYnkgQW5ndWxhci5cbiAqXG4gKiBAcGFyYW0gdGFyZ2V0IEEgRE9NIGVsZW1lbnQsIGNvbXBvbmVudCBvciBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Um9vdENvbXBvbmVudHModGFyZ2V0OiB7fSk6IGFueVtdIHtcbiAgcmV0dXJuIFsuLi5nZXRSb290Q29udGV4dCh0YXJnZXQpLmNvbXBvbmVudHNdO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyBhbiBgSW5qZWN0b3JgIGFzc29jaWF0ZWQgd2l0aCB0aGUgZWxlbWVudCwgY29tcG9uZW50IG9yIGRpcmVjdGl2ZS5cbiAqXG4gKiBAcGFyYW0gdGFyZ2V0IEEgRE9NIGVsZW1lbnQsIGNvbXBvbmVudCBvciBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5qZWN0b3IodGFyZ2V0OiB7fSk6IEluamVjdG9yIHtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRMQ29udGV4dCh0YXJnZXQpO1xuICBjb25zdCB0Tm9kZSA9IGNvbnRleHQubFZpZXdbVFZJRVddLmRhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFRFbGVtZW50Tm9kZTtcbiAgcmV0dXJuIG5ldyBOb2RlSW5qZWN0b3IodE5vZGUsIGNvbnRleHQubFZpZXcpO1xufVxuXG4vKipcbiAqIFJldHJpZXZlIGEgc2V0IG9mIGluamVjdGlvbiB0b2tlbnMgYXQgYSBnaXZlbiBET00gbm9kZS5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IGZvciB3aGljaCB0aGUgaW5qZWN0aW9uIHRva2VucyBzaG91bGQgYmUgcmV0cmlldmVkLlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5qZWN0aW9uVG9rZW5zKGVsZW1lbnQ6IEVsZW1lbnQpOiBhbnlbXSB7XG4gIGNvbnN0IGNvbnRleHQgPSBsb2FkTENvbnRleHQoZWxlbWVudCwgZmFsc2UpO1xuICBpZiAoIWNvbnRleHQpIHJldHVybiBbXTtcbiAgY29uc3QgbFZpZXcgPSBjb250ZXh0LmxWaWV3O1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdE5vZGUgPSB0Vmlldy5kYXRhW2NvbnRleHQubm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgY29uc3QgcHJvdmlkZXJUb2tlbnM6IGFueVtdID0gW107XG4gIGNvbnN0IHN0YXJ0SW5kZXggPSB0Tm9kZS5wcm92aWRlckluZGV4ZXMgJiBUTm9kZVByb3ZpZGVySW5kZXhlcy5Qcm92aWRlcnNTdGFydEluZGV4TWFzaztcbiAgY29uc3QgZW5kSW5kZXggPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGZvciAobGV0IGkgPSBzdGFydEluZGV4OyBpIDwgZW5kSW5kZXg7IGkrKykge1xuICAgIGxldCB2YWx1ZSA9IHRWaWV3LmRhdGFbaV07XG4gICAgaWYgKGlzRGlyZWN0aXZlRGVmSGFjayh2YWx1ZSkpIHtcbiAgICAgIC8vIFRoZSBmYWN0IHRoYXQgd2Ugc29tZXRpbWVzIHN0b3JlIFR5cGUgYW5kIHNvbWV0aW1lcyBEaXJlY3RpdmVEZWYgaW4gdGhpcyBsb2NhdGlvbiBpcyBhXG4gICAgICAvLyBkZXNpZ24gZmxhdy4gIFdlIHNob3VsZCBhbHdheXMgc3RvcmUgc2FtZSB0eXBlIHNvIHRoYXQgd2UgY2FuIGJlIG1vbm9tb3JwaGljLiBUaGUgaXNzdWVcbiAgICAgIC8vIGlzIHRoYXQgZm9yIENvbXBvbmVudHMvRGlyZWN0aXZlcyB3ZSBzdG9yZSB0aGUgZGVmIGluc3RlYWQgdGhlIHR5cGUuIFRoZSBjb3JyZWN0IGJlaGF2aW9yXG4gICAgICAvLyBpcyB0aGF0IHdlIHNob3VsZCBhbHdheXMgYmUgc3RvcmluZyBpbmplY3RhYmxlIHR5cGUgaW4gdGhpcyBsb2NhdGlvbi5cbiAgICAgIHZhbHVlID0gdmFsdWUudHlwZTtcbiAgICB9XG4gICAgcHJvdmlkZXJUb2tlbnMucHVzaCh2YWx1ZSk7XG4gIH1cbiAgcmV0dXJuIHByb3ZpZGVyVG9rZW5zO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyBkaXJlY3RpdmVzIGFzc29jaWF0ZWQgd2l0aCBhIGdpdmVuIERPTSBob3N0IGVsZW1lbnQuXG4gKlxuICogQHBhcmFtIHRhcmdldCBBIERPTSBlbGVtZW50LCBjb21wb25lbnQgb3IgZGlyZWN0aXZlIGluc3RhbmNlLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldERpcmVjdGl2ZXModGFyZ2V0OiB7fSk6IEFycmF5PHt9PiB7XG4gIGNvbnN0IGNvbnRleHQgPSBsb2FkTENvbnRleHQodGFyZ2V0KSAhO1xuXG4gIGlmIChjb250ZXh0LmRpcmVjdGl2ZXMgPT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnRleHQuZGlyZWN0aXZlcyA9IGdldERpcmVjdGl2ZXNBdE5vZGVJbmRleChjb250ZXh0Lm5vZGVJbmRleCwgY29udGV4dC5sVmlldywgZmFsc2UpO1xuICB9XG5cbiAgcmV0dXJuIGNvbnRleHQuZGlyZWN0aXZlcyB8fCBbXTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIExDb250ZXh0IGFzc29jaWF0ZWQgd2l0aCBhIHRhcmdldCBwYXNzZWQgYXMgYW4gYXJndW1lbnQuXG4gKiBUaHJvd3MgaWYgYSBnaXZlbiB0YXJnZXQgZG9lc24ndCBoYXZlIGFzc29jaWF0ZWQgTENvbnRleHQuXG4gKlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZExDb250ZXh0KHRhcmdldDoge30pOiBMQ29udGV4dDtcbmV4cG9ydCBmdW5jdGlvbiBsb2FkTENvbnRleHQodGFyZ2V0OiB7fSwgdGhyb3dPbk5vdEZvdW5kOiBmYWxzZSk6IExDb250ZXh0fG51bGw7XG5leHBvcnQgZnVuY3Rpb24gbG9hZExDb250ZXh0KHRhcmdldDoge30sIHRocm93T25Ob3RGb3VuZDogYm9vbGVhbiA9IHRydWUpOiBMQ29udGV4dHxudWxsIHtcbiAgY29uc3QgY29udGV4dCA9IGdldExDb250ZXh0KHRhcmdldCk7XG4gIGlmICghY29udGV4dCAmJiB0aHJvd09uTm90Rm91bmQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIG5nRGV2TW9kZSA/IGBVbmFibGUgdG8gZmluZCBjb250ZXh0IGFzc29jaWF0ZWQgd2l0aCAke3JlbmRlclN0cmluZ2lmeSh0YXJnZXQpfWAgOlxuICAgICAgICAgICAgICAgICAgICAnSW52YWxpZCBuZyB0YXJnZXQnKTtcbiAgfVxuICByZXR1cm4gY29udGV4dDtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgcm9vdCB2aWV3IGZyb20gYW55IGNvbXBvbmVudCBieSB3YWxraW5nIHRoZSBwYXJlbnQgYExWaWV3YCB1bnRpbFxuICogcmVhY2hpbmcgdGhlIHJvb3QgYExWaWV3YC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50T3JWaWV3IGFueSBjb21wb25lbnQgb3Igdmlld1xuICpcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJvb3RWaWV3KGNvbXBvbmVudE9yVmlldzogTFZpZXcgfCB7fSk6IExWaWV3IHtcbiAgbGV0IGxWaWV3OiBMVmlldztcbiAgaWYgKEFycmF5LmlzQXJyYXkoY29tcG9uZW50T3JWaWV3KSkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGNvbXBvbmVudE9yVmlldywgJ2xWaWV3Jyk7XG4gICAgbFZpZXcgPSBjb21wb25lbnRPclZpZXcgYXMgTFZpZXc7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY29tcG9uZW50T3JWaWV3LCAnY29tcG9uZW50Jyk7XG4gICAgbFZpZXcgPSByZWFkUGF0Y2hlZExWaWV3KGNvbXBvbmVudE9yVmlldykgITtcbiAgfVxuICB3aGlsZSAobFZpZXcgJiYgIShsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLklzUm9vdCkpIHtcbiAgICBsVmlldyA9IGxWaWV3W1BBUkVOVF0gITtcbiAgfVxuICByZXR1cm4gbFZpZXc7XG59XG5cbi8qKlxuICogUmV0cmlldmUgbWFwIG9mIGxvY2FsIHJlZmVyZW5jZXMuXG4gKlxuICogVGhlIHJlZmVyZW5jZXMgYXJlIHJldHJpZXZlZCBhcyBhIG1hcCBvZiBsb2NhbCByZWZlcmVuY2UgbmFtZSB0byBlbGVtZW50IG9yIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0gdGFyZ2V0IEEgRE9NIGVsZW1lbnQsIGNvbXBvbmVudCBvciBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9jYWxSZWZzKHRhcmdldDoge30pOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gIGNvbnN0IGNvbnRleHQgPSBsb2FkTENvbnRleHQodGFyZ2V0KSAhO1xuXG4gIGlmIChjb250ZXh0LmxvY2FsUmVmcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgY29udGV4dC5sb2NhbFJlZnMgPSBkaXNjb3ZlckxvY2FsUmVmcyhjb250ZXh0LmxWaWV3LCBjb250ZXh0Lm5vZGVJbmRleCk7XG4gIH1cblxuICByZXR1cm4gY29udGV4dC5sb2NhbFJlZnMgfHwge307XG59XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIGhvc3QgZWxlbWVudCBvZiB0aGUgY29tcG9uZW50LlxuICpcbiAqIFVzZSB0aGlzIGZ1bmN0aW9uIHRvIHJldHJpZXZlIHRoZSBob3N0IGVsZW1lbnQgb2YgdGhlIGNvbXBvbmVudC4gVGhlIGhvc3RcbiAqIGVsZW1lbnQgaXMgdGhlIGVsZW1lbnQgd2hpY2ggdGhlIGNvbXBvbmVudCBpcyBhc3NvY2lhdGVkIHdpdGguXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZSBDb21wb25lbnQgb3IgRGlyZWN0aXZlIGZvciB3aGljaCB0aGUgaG9zdCBlbGVtZW50IHNob3VsZCBiZSByZXRyaWV2ZWQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SG9zdEVsZW1lbnQ8VD4oZGlyZWN0aXZlOiBUKTogRWxlbWVudCB7XG4gIHJldHVybiBnZXRMQ29udGV4dChkaXJlY3RpdmUpICEubmF0aXZlIGFzIG5ldmVyIGFzIEVsZW1lbnQ7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSByZW5kZXJlZCB0ZXh0IGZvciBhIGdpdmVuIGNvbXBvbmVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHJldHJpZXZlcyB0aGUgaG9zdCBlbGVtZW50IG9mIGEgY29tcG9uZW50IGFuZFxuICogYW5kIHRoZW4gcmV0dXJucyB0aGUgYHRleHRDb250ZW50YCBmb3IgdGhhdCBlbGVtZW50LiBUaGlzIGltcGxpZXNcbiAqIHRoYXQgdGhlIHRleHQgcmV0dXJuZWQgd2lsbCBpbmNsdWRlIHJlLXByb2plY3RlZCBjb250ZW50IG9mXG4gKiB0aGUgY29tcG9uZW50IGFzIHdlbGwuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBUaGUgY29tcG9uZW50IHRvIHJldHVybiB0aGUgY29udGVudCB0ZXh0IGZvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJlbmRlcmVkVGV4dChjb21wb25lbnQ6IGFueSk6IHN0cmluZyB7XG4gIGNvbnN0IGhvc3RFbGVtZW50ID0gZ2V0SG9zdEVsZW1lbnQoY29tcG9uZW50KTtcbiAgcmV0dXJuIGhvc3RFbGVtZW50LnRleHRDb250ZW50IHx8ICcnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9hZExDb250ZXh0RnJvbU5vZGUobm9kZTogTm9kZSk6IExDb250ZXh0IHtcbiAgaWYgKCEobm9kZSBpbnN0YW5jZW9mIE5vZGUpKSB0aHJvdyBuZXcgRXJyb3IoJ0V4cGVjdGluZyBpbnN0YW5jZSBvZiBET00gTm9kZScpO1xuICByZXR1cm4gbG9hZExDb250ZXh0KG5vZGUpICE7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTGlzdGVuZXIge1xuICBuYW1lOiBzdHJpbmc7XG4gIGVsZW1lbnQ6IEVsZW1lbnQ7XG4gIGNhbGxiYWNrOiAodmFsdWU6IGFueSkgPT4gYW55O1xuICB1c2VDYXB0dXJlOiBib29sZWFufG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0Jyb3dzZXJFdmVudHMobGlzdGVuZXI6IExpc3RlbmVyKTogYm9vbGVhbiB7XG4gIC8vIEJyb3dzZXIgZXZlbnRzIGFyZSB0aG9zZSB3aGljaCBkb24ndCBoYXZlIGB1c2VDYXB0dXJlYCBhcyBib29sZWFuLlxuICByZXR1cm4gdHlwZW9mIGxpc3RlbmVyLnVzZUNhcHR1cmUgPT09ICdib29sZWFuJztcbn1cblxuXG4vKipcbiAqIFJldHJpZXZlcyBhIGxpc3Qgb2YgRE9NIGxpc3RlbmVycy5cbiAqXG4gKiBgYGBcbiAqIDxteS1hcHA+XG4gKiAgICNWSUVXXG4gKiAgICAgPGRpdiAoY2xpY2spPVwiZG9Tb21ldGhpbmcoKVwiPlxuICogICAgIDwvZGl2PlxuICogPC9tcC1hcHA+XG4gKlxuICogZXhwZWN0KGdldExpc3RlbmVycyg8ZGl2PikpLnRvRXF1YWwoe1xuICogICBuYW1lOiAnY2xpY2snLFxuICogICBlbGVtZW50OiA8ZGl2PixcbiAqICAgY2FsbGJhY2s6ICgpID0+IGRvU29tZXRoaW5nKCksXG4gKiAgIHVzZUNhcHR1cmU6IGZhbHNlXG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgZm9yIHdoaWNoIHRoZSBET00gbGlzdGVuZXJzIHNob3VsZCBiZSByZXRyaWV2ZWQuXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMaXN0ZW5lcnMoZWxlbWVudDogRWxlbWVudCk6IExpc3RlbmVyW10ge1xuICBjb25zdCBsQ29udGV4dCA9IGxvYWRMQ29udGV4dEZyb21Ob2RlKGVsZW1lbnQpO1xuICBjb25zdCBsVmlldyA9IGxDb250ZXh0LmxWaWV3O1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgbENsZWFudXAgPSBsVmlld1tDTEVBTlVQXTtcbiAgY29uc3QgdENsZWFudXAgPSB0Vmlldy5jbGVhbnVwO1xuICBjb25zdCBsaXN0ZW5lcnM6IExpc3RlbmVyW10gPSBbXTtcbiAgaWYgKHRDbGVhbnVwICYmIGxDbGVhbnVwKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0Q2xlYW51cC5sZW5ndGg7KSB7XG4gICAgICBjb25zdCBmaXJzdFBhcmFtID0gdENsZWFudXBbaSsrXTtcbiAgICAgIGNvbnN0IHNlY29uZFBhcmFtID0gdENsZWFudXBbaSsrXTtcbiAgICAgIGlmICh0eXBlb2YgZmlyc3RQYXJhbSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29uc3QgbmFtZTogc3RyaW5nID0gZmlyc3RQYXJhbTtcbiAgICAgICAgY29uc3QgbGlzdGVuZXJFbGVtZW50ID0gcmVhZEVsZW1lbnRWYWx1ZShsVmlld1tzZWNvbmRQYXJhbV0pIGFzIGFueSBhcyBFbGVtZW50O1xuICAgICAgICBjb25zdCBjYWxsYmFjazogKHZhbHVlOiBhbnkpID0+IGFueSA9IGxDbGVhbnVwW3RDbGVhbnVwW2krK11dO1xuICAgICAgICBjb25zdCB1c2VDYXB0dXJlT3JJbmR4ID0gdENsZWFudXBbaSsrXTtcbiAgICAgICAgLy8gaWYgdXNlQ2FwdHVyZU9ySW5keCBpcyBib29sZWFuIHRoZW4gcmVwb3J0IGl0IGFzIGlzLlxuICAgICAgICAvLyBpZiB1c2VDYXB0dXJlT3JJbmR4IGlzIHBvc2l0aXZlIG51bWJlciB0aGVuIGl0IGluIHVuc3Vic2NyaWJlIG1ldGhvZFxuICAgICAgICAvLyBpZiB1c2VDYXB0dXJlT3JJbmR4IGlzIG5lZ2F0aXZlIG51bWJlciB0aGVuIGl0IGlzIGEgU3Vic2NyaXB0aW9uXG4gICAgICAgIGNvbnN0IHVzZUNhcHR1cmUgPSB0eXBlb2YgdXNlQ2FwdHVyZU9ySW5keCA9PT0gJ2Jvb2xlYW4nID9cbiAgICAgICAgICAgIHVzZUNhcHR1cmVPckluZHggOlxuICAgICAgICAgICAgKHVzZUNhcHR1cmVPckluZHggPj0gMCA/IGZhbHNlIDogbnVsbCk7XG4gICAgICAgIGlmIChlbGVtZW50ID09IGxpc3RlbmVyRWxlbWVudCkge1xuICAgICAgICAgIGxpc3RlbmVycy5wdXNoKHtlbGVtZW50LCBuYW1lLCBjYWxsYmFjaywgdXNlQ2FwdHVyZX0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGxpc3RlbmVycy5zb3J0KHNvcnRMaXN0ZW5lcnMpO1xuICByZXR1cm4gbGlzdGVuZXJzO1xufVxuXG5mdW5jdGlvbiBzb3J0TGlzdGVuZXJzKGE6IExpc3RlbmVyLCBiOiBMaXN0ZW5lcikge1xuICBpZiAoYS5uYW1lID09IGIubmFtZSkgcmV0dXJuIDA7XG4gIHJldHVybiBhLm5hbWUgPCBiLm5hbWUgPyAtMSA6IDE7XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBzaG91bGQgbm90IGV4aXN0IGJlY2F1c2UgaXQgaXMgbWVnYW1vcnBoaWMgYW5kIG9ubHkgbW9zdGx5IGNvcnJlY3QuXG4gKlxuICogU2VlIGNhbGwgc2l0ZSBmb3IgbW9yZSBpbmZvLlxuICovXG5mdW5jdGlvbiBpc0RpcmVjdGl2ZURlZkhhY2sob2JqOiBhbnkpOiBvYmogaXMgRGlyZWN0aXZlRGVmPGFueT4ge1xuICByZXR1cm4gb2JqLnR5cGUgIT09IHVuZGVmaW5lZCAmJiBvYmoudGVtcGxhdGUgIT09IHVuZGVmaW5lZCAmJiBvYmouZGVjbGFyZWRJbnB1dHMgIT09IHVuZGVmaW5lZDtcbn1cbiJdfQ==