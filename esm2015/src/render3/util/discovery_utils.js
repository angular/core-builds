/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectionStrategy } from '../../change_detection/constants';
import { Injector } from '../../di/injector';
import { assertEqual } from '../../util/assert';
import { assertLView } from '../assert';
import { discoverLocalRefs, getComponentAtNodeIndex, getDirectivesAtNodeIndex, getLContext } from '../context_discovery';
import { getComponentDef, getDirectiveDef } from '../definition';
import { NodeInjector } from '../di';
import { buildDebugNode } from '../instructions/lview_debug';
import { isLView } from '../interfaces/type_checks';
import { CLEANUP, CONTEXT, FLAGS, T_HOST, TVIEW } from '../interfaces/view';
import { getLViewParent, getRootContext } from './view_traversal_utils';
import { getTNode, unwrapRNode } from './view_utils';
/**
 * Retrieves the component instance associated with a given DOM element.
 *
 * @usageNotes
 * Given the following DOM structure:
 * ```html
 * <my-app>
 *   <div>
 *     <child-comp></child-comp>
 *   </div>
 * </my-app>
 * ```
 * Calling `getComponent` on `<child-comp>` will return the instance of `ChildComponent`
 * associated with this DOM element.
 *
 * Calling the function on `<my-app>` will return the `MyApp` instance.
 *
 *
 * @param element DOM element from which the component should be retrieved.
 * @returns Component instance associated with the element or `null` if there
 *    is no component associated with it.
 *
 * @publicApi
 * @globalApi ng
 */
export function getComponent(element) {
    assertDomElement(element);
    const context = getLContext(element);
    if (context === null)
        return null;
    if (context.component === undefined) {
        context.component = getComponentAtNodeIndex(context.nodeIndex, context.lView);
    }
    return context.component;
}
/**
 * If inside an embedded view (e.g. `*ngIf` or `*ngFor`), retrieves the context of the embedded
 * view that the element is part of. Otherwise retrieves the instance of the component whose view
 * owns the element (in this case, the result is the same as calling `getOwningComponent`).
 *
 * @param element Element for which to get the surrounding component instance.
 * @returns Instance of the component that is around the element or null if the element isn't
 *    inside any component.
 *
 * @publicApi
 * @globalApi ng
 */
export function getContext(element) {
    assertDomElement(element);
    const context = getLContext(element);
    return context === null ? null : context.lView[CONTEXT];
}
/**
 * Retrieves the component instance whose view contains the DOM element.
 *
 * For example, if `<child-comp>` is used in the template of `<app-comp>`
 * (i.e. a `ViewChild` of `<app-comp>`), calling `getOwningComponent` on `<child-comp>`
 * would return `<app-comp>`.
 *
 * @param elementOrDir DOM element, component or directive instance
 *    for which to retrieve the root components.
 * @returns Component instance whose view owns the DOM element or null if the element is not
 *    part of a component view.
 *
 * @publicApi
 * @globalApi ng
 */
export function getOwningComponent(elementOrDir) {
    const context = getLContext(elementOrDir);
    if (context === null)
        return null;
    let lView = context.lView;
    let parent;
    ngDevMode && assertLView(lView);
    while (lView[TVIEW].type === 2 /* Embedded */ && (parent = getLViewParent(lView))) {
        lView = parent;
    }
    return lView[FLAGS] & 512 /* IsRoot */ ? null : lView[CONTEXT];
}
/**
 * Retrieves all root components associated with a DOM element, directive or component instance.
 * Root components are those which have been bootstrapped by Angular.
 *
 * @param elementOrDir DOM element, component or directive instance
 *    for which to retrieve the root components.
 * @returns Root components associated with the target object.
 *
 * @publicApi
 * @globalApi ng
 */
export function getRootComponents(elementOrDir) {
    return [...getRootContext(elementOrDir).components];
}
/**
 * Retrieves an `Injector` associated with an element, component or directive instance.
 *
 * @param elementOrDir DOM element, component or directive instance for which to
 *    retrieve the injector.
 * @returns Injector associated with the element, component or directive instance.
 *
 * @publicApi
 * @globalApi ng
 */
export function getInjector(elementOrDir) {
    const context = getLContext(elementOrDir);
    if (context === null)
        return Injector.NULL;
    const tNode = context.lView[TVIEW].data[context.nodeIndex];
    return new NodeInjector(tNode, context.lView);
}
/**
 * Retrieve a set of injection tokens at a given DOM node.
 *
 * @param element Element for which the injection tokens should be retrieved.
 */
export function getInjectionTokens(element) {
    const context = getLContext(element);
    if (context === null)
        return [];
    const lView = context.lView;
    const tView = lView[TVIEW];
    const tNode = tView.data[context.nodeIndex];
    const providerTokens = [];
    const startIndex = tNode.providerIndexes & 1048575 /* ProvidersStartIndexMask */;
    const endIndex = tNode.directiveEnd;
    for (let i = startIndex; i < endIndex; i++) {
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
 * Retrieves directive instances associated with a given DOM node. Does not include
 * component instances.
 *
 * @usageNotes
 * Given the following DOM structure:
 * ```
 * <my-app>
 *   <button my-button></button>
 *   <my-comp></my-comp>
 * </my-app>
 * ```
 * Calling `getDirectives` on `<button>` will return an array with an instance of the `MyButton`
 * directive that is associated with the DOM node.
 *
 * Calling `getDirectives` on `<my-comp>` will return an empty array.
 *
 * @param node DOM node for which to get the directives.
 * @returns Array of directives associated with the node.
 *
 * @publicApi
 * @globalApi ng
 */
export function getDirectives(node) {
    // Skip text nodes because we can't have directives associated with them.
    if (node instanceof Text) {
        return [];
    }
    const context = getLContext(node);
    if (context === null) {
        return [];
    }
    const lView = context.lView;
    const tView = lView[TVIEW];
    const nodeIndex = context.nodeIndex;
    if (!(tView === null || tView === void 0 ? void 0 : tView.data[nodeIndex])) {
        return [];
    }
    if (context.directives === undefined) {
        context.directives = getDirectivesAtNodeIndex(nodeIndex, lView, false);
    }
    // The `directives` in this case are a named array called `LComponentView`. Clone the
    // result so we don't expose an internal data structure in the user's console.
    return context.directives === null ? [] : [...context.directives];
}
/**
 * Returns the debug (partial) metadata for a particular directive or component instance.
 * The function accepts an instance of a directive or component and returns the corresponding
 * metadata.
 *
 * @param directiveOrComponentInstance Instance of a directive or component
 * @returns metadata of the passed directive or component
 *
 * @publicApi
 * @globalApi ng
 */
export function getDirectiveMetadata(directiveOrComponentInstance) {
    const { constructor } = directiveOrComponentInstance;
    if (!constructor) {
        throw new Error('Unable to find the instance constructor');
    }
    // In case a component inherits from a directive, we may have component and directive metadata
    // To ensure we don't get the metadata of the directive, we want to call `getComponentDef` first.
    const componentDef = getComponentDef(constructor);
    if (componentDef) {
        return {
            inputs: componentDef.inputs,
            outputs: componentDef.outputs,
            encapsulation: componentDef.encapsulation,
            changeDetection: componentDef.onPush ? ChangeDetectionStrategy.OnPush :
                ChangeDetectionStrategy.Default
        };
    }
    const directiveDef = getDirectiveDef(constructor);
    if (directiveDef) {
        return { inputs: directiveDef.inputs, outputs: directiveDef.outputs };
    }
    return null;
}
/**
 * Retrieve map of local references.
 *
 * The references are retrieved as a map of local reference name to element or directive instance.
 *
 * @param target DOM element, component or directive instance for which to retrieve
 *    the local references.
 */
export function getLocalRefs(target) {
    const context = getLContext(target);
    if (context === null)
        return {};
    if (context.localRefs === undefined) {
        context.localRefs = discoverLocalRefs(context.lView, context.nodeIndex);
    }
    return context.localRefs || {};
}
/**
 * Retrieves the host element of a component or directive instance.
 * The host element is the DOM element that matched the selector of the directive.
 *
 * @param componentOrDirective Component or directive instance for which the host
 *     element should be retrieved.
 * @returns Host element of the target.
 *
 * @publicApi
 * @globalApi ng
 */
export function getHostElement(componentOrDirective) {
    return getLContext(componentOrDirective).native;
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
    const hostElement = getHostElement(component);
    return hostElement.textContent || '';
}
/**
 * Retrieves a list of event listeners associated with a DOM element. The list does include host
 * listeners, but it does not include event listeners defined outside of the Angular context
 * (e.g. through `addEventListener`).
 *
 * @usageNotes
 * Given the following DOM structure:
 * ```
 * <my-app>
 *   <div (click)="doSomething()"></div>
 * </my-app>
 *
 * ```
 * Calling `getListeners` on `<div>` will return an object that looks as follows:
 * ```
 * {
 *   name: 'click',
 *   element: <div>,
 *   callback: () => doSomething(),
 *   useCapture: false
 * }
 * ```
 *
 * @param element Element for which the DOM listeners should be retrieved.
 * @returns Array of event listeners on the DOM element.
 *
 * @publicApi
 * @globalApi ng
 */
export function getListeners(element) {
    assertDomElement(element);
    const lContext = getLContext(element);
    if (lContext === null)
        return [];
    const lView = lContext.lView;
    const tView = lView[TVIEW];
    const lCleanup = lView[CLEANUP];
    const tCleanup = tView.cleanup;
    const listeners = [];
    if (tCleanup && lCleanup) {
        for (let i = 0; i < tCleanup.length;) {
            const firstParam = tCleanup[i++];
            const secondParam = tCleanup[i++];
            if (typeof firstParam === 'string') {
                const name = firstParam;
                const listenerElement = unwrapRNode(lView[secondParam]);
                const callback = lCleanup[tCleanup[i++]];
                const useCaptureOrIndx = tCleanup[i++];
                // if useCaptureOrIndx is boolean then report it as is.
                // if useCaptureOrIndx is positive number then it in unsubscribe method
                // if useCaptureOrIndx is negative number then it is a Subscription
                const type = (typeof useCaptureOrIndx === 'boolean' || useCaptureOrIndx >= 0) ? 'dom' : 'output';
                const useCapture = typeof useCaptureOrIndx === 'boolean' ? useCaptureOrIndx : false;
                if (element == listenerElement) {
                    listeners.push({ element, name, callback, useCapture, type });
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
/**
 * Returns the attached `DebugNode` instance for an element in the DOM.
 *
 * @param element DOM element which is owned by an existing component's view.
 */
export function getDebugNode(element) {
    if (ngDevMode && !(element instanceof Node)) {
        throw new Error('Expecting instance of DOM Element');
    }
    const lContext = getLContext(element);
    if (lContext === null) {
        return null;
    }
    const lView = lContext.lView;
    const nodeIndex = lContext.nodeIndex;
    if (nodeIndex !== -1) {
        const valueInLView = lView[nodeIndex];
        // this means that value in the lView is a component with its own
        // data. In this situation the TNode is not accessed at the same spot.
        const tNode = isLView(valueInLView) ? valueInLView[T_HOST] : getTNode(lView[TVIEW], nodeIndex);
        ngDevMode &&
            assertEqual(tNode.index, nodeIndex, 'Expecting that TNode at index is same as index');
        return buildDebugNode(tNode, lView);
    }
    return null;
}
/**
 * Retrieve the component `LView` from component/element.
 *
 * NOTE: `LView` is a private and should not be leaked outside.
 *       Don't export this method to `ng.*` on window.
 *
 * @param target DOM element or component instance for which to retrieve the LView.
 */
export function getComponentLView(target) {
    const lContext = getLContext(target);
    const nodeIndx = lContext.nodeIndex;
    const lView = lContext.lView;
    const componentLView = lView[nodeIndx];
    ngDevMode && assertLView(componentLView);
    return componentLView;
}
/** Asserts that a value is a DOM Element. */
function assertDomElement(value) {
    if (typeof Element !== 'undefined' && !(value instanceof Element)) {
        throw new Error('Expecting instance of DOM Element');
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzY292ZXJ5X3V0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy91dGlsL2Rpc2NvdmVyeV91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsdUJBQXVCLEVBQUMsTUFBTSxrQ0FBa0MsQ0FBQztBQUN6RSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFM0MsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDdEMsT0FBTyxFQUFDLGlCQUFpQixFQUFFLHVCQUF1QixFQUFFLHdCQUF3QixFQUFFLFdBQVcsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3ZILE9BQU8sRUFBQyxlQUFlLEVBQUUsZUFBZSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQy9ELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDbkMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBSTNELE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUNsRCxPQUFPLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBYSxLQUFLLEVBQXFCLE1BQU0sRUFBRSxLQUFLLEVBQVksTUFBTSxvQkFBb0IsQ0FBQztBQUVuSCxPQUFPLEVBQUMsY0FBYyxFQUFFLGNBQWMsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3RFLE9BQU8sRUFBQyxRQUFRLEVBQUUsV0FBVyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBSW5EOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F3Qkc7QUFDSCxNQUFNLFVBQVUsWUFBWSxDQUFJLE9BQWdCO0lBQzlDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lB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QVksQ0FBQyxDQUFDLENBQUMsQ0FBRSxZQUFZLENBQUMsTUFBTSxDQUFXLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDaEcsU0FBUztZQUNMLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxnREFBZ0QsQ0FBQyxDQUFDO1FBQzFGLE9BQU8sY0FBYyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztLQUNyQztJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsTUFBVztJQUMzQyxNQUFNLFFBQVEsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFFLENBQUM7SUFDdEMsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQztJQUNwQyxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO0lBQzdCLE1BQU0sY0FBYyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN2QyxTQUFTLElBQUksV0FBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQ3pDLE9BQU8sY0FBYyxDQUFDO0FBQ3hCLENBQUM7QUFFRCw2Q0FBNkM7QUFDN0MsU0FBUyxnQkFBZ0IsQ0FBQyxLQUFVO0lBQ2xDLElBQUksT0FBTyxPQUFPLEtBQUssV0FBVyxJQUFJLENBQUMsQ0FBQyxLQUFLLFlBQVksT0FBTyxDQUFDLEVBQUU7UUFDakUsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO0tBQ3REO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NoYW5nZURldGVjdGlvblN0cmF0ZWd5fSBmcm9tICcuLi8uLi9jaGFuZ2VfZGV0ZWN0aW9uL2NvbnN0YW50cyc7XG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi8uLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge1ZpZXdFbmNhcHN1bGF0aW9ufSBmcm9tICcuLi8uLi9tZXRhZGF0YS92aWV3JztcbmltcG9ydCB7YXNzZXJ0RXF1YWx9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7YXNzZXJ0TFZpZXd9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2Rpc2NvdmVyTG9jYWxSZWZzLCBnZXRDb21wb25lbnRBdE5vZGVJbmRleCwgZ2V0RGlyZWN0aXZlc0F0Tm9kZUluZGV4LCBnZXRMQ29udGV4dH0gZnJvbSAnLi4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWYsIGdldERpcmVjdGl2ZURlZn0gZnJvbSAnLi4vZGVmaW5pdGlvbic7XG5pbXBvcnQge05vZGVJbmplY3Rvcn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtidWlsZERlYnVnTm9kZX0gZnJvbSAnLi4vaW5zdHJ1Y3Rpb25zL2x2aWV3X2RlYnVnJztcbmltcG9ydCB7TENvbnRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGV4dCc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVQcm92aWRlckluZGV4ZXN9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2lzTFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtDTEVBTlVQLCBDT05URVhULCBEZWJ1Z05vZGUsIEZMQUdTLCBMVmlldywgTFZpZXdGbGFncywgVF9IT1NULCBUVklFVywgVFZpZXdUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtzdHJpbmdpZnlGb3JFcnJvcn0gZnJvbSAnLi9zdHJpbmdpZnlfdXRpbHMnO1xuaW1wb3J0IHtnZXRMVmlld1BhcmVudCwgZ2V0Um9vdENvbnRleHR9IGZyb20gJy4vdmlld190cmF2ZXJzYWxfdXRpbHMnO1xuaW1wb3J0IHtnZXRUTm9kZSwgdW53cmFwUk5vZGV9IGZyb20gJy4vdmlld191dGlscyc7XG5cblxuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgY29tcG9uZW50IGluc3RhbmNlIGFzc29jaWF0ZWQgd2l0aCBhIGdpdmVuIERPTSBlbGVtZW50LlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiBHaXZlbiB0aGUgZm9sbG93aW5nIERPTSBzdHJ1Y3R1cmU6XG4gKiBgYGBodG1sXG4gKiA8bXktYXBwPlxuICogICA8ZGl2PlxuICogICAgIDxjaGlsZC1jb21wPjwvY2hpbGQtY29tcD5cbiAqICAgPC9kaXY+XG4gKiA8L215LWFwcD5cbiAqIGBgYFxuICogQ2FsbGluZyBgZ2V0Q29tcG9uZW50YCBvbiBgPGNoaWxkLWNvbXA+YCB3aWxsIHJldHVybiB0aGUgaW5zdGFuY2Ugb2YgYENoaWxkQ29tcG9uZW50YFxuICogYXNzb2NpYXRlZCB3aXRoIHRoaXMgRE9NIGVsZW1lbnQuXG4gKlxuICogQ2FsbGluZyB0aGUgZnVuY3Rpb24gb24gYDxteS1hcHA+YCB3aWxsIHJldHVybiB0aGUgYE15QXBwYCBpbnN0YW5jZS5cbiAqXG4gKlxuICogQHBhcmFtIGVsZW1lbnQgRE9NIGVsZW1lbnQgZnJvbSB3aGljaCB0aGUgY29tcG9uZW50IHNob3VsZCBiZSByZXRyaWV2ZWQuXG4gKiBAcmV0dXJucyBDb21wb25lbnQgaW5zdGFuY2UgYXNzb2NpYXRlZCB3aXRoIHRoZSBlbGVtZW50IG9yIGBudWxsYCBpZiB0aGVyZVxuICogICAgaXMgbm8gY29tcG9uZW50IGFzc29jaWF0ZWQgd2l0aCBpdC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKiBAZ2xvYmFsQXBpIG5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21wb25lbnQ8VD4oZWxlbWVudDogRWxlbWVudCk6IFR8bnVsbCB7XG4gIGFzc2VydERvbUVsZW1lbnQoZWxlbWVudCk7XG4gIGNvbnN0IGNvbnRleHQgPSBnZXRMQ29udGV4dChlbGVtZW50KTtcbiAgaWYgKGNvbnRleHQgPT09IG51bGwpIHJldHVybiBudWxsO1xuXG4gIGlmIChjb250ZXh0LmNvbXBvbmVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgY29udGV4dC5jb21wb25lbnQgPSBnZXRDb21wb25lbnRBdE5vZGVJbmRleChjb250ZXh0Lm5vZGVJbmRleCwgY29udGV4dC5sVmlldyk7XG4gIH1cblxuICByZXR1cm4gY29udGV4dC5jb21wb25lbnQgYXMgVDtcbn1cblxuXG4vKipcbiAqIElmIGluc2lkZSBhbiBlbWJlZGRlZCB2aWV3IChlLmcuIGAqbmdJZmAgb3IgYCpuZ0ZvcmApLCByZXRyaWV2ZXMgdGhlIGNvbnRleHQgb2YgdGhlIGVtYmVkZGVkXG4gKiB2aWV3IHRoYXQgdGhlIGVsZW1lbnQgaXMgcGFydCBvZi4gT3RoZXJ3aXNlIHJldHJpZXZlcyB0aGUgaW5zdGFuY2Ugb2YgdGhlIGNvbXBvbmVudCB3aG9zZSB2aWV3XG4gKiBvd25zIHRoZSBlbGVtZW50IChpbiB0aGlzIGNhc2UsIHRoZSByZXN1bHQgaXMgdGhlIHNhbWUgYXMgY2FsbGluZyBgZ2V0T3duaW5nQ29tcG9uZW50YCkuXG4gKlxuICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCBmb3Igd2hpY2ggdG8gZ2V0IHRoZSBzdXJyb3VuZGluZyBjb21wb25lbnQgaW5zdGFuY2UuXG4gKiBAcmV0dXJucyBJbnN0YW5jZSBvZiB0aGUgY29tcG9uZW50IHRoYXQgaXMgYXJvdW5kIHRoZSBlbGVtZW50IG9yIG51bGwgaWYgdGhlIGVsZW1lbnQgaXNuJ3RcbiAqICAgIGluc2lkZSBhbnkgY29tcG9uZW50LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqIEBnbG9iYWxBcGkgbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbnRleHQ8VD4oZWxlbWVudDogRWxlbWVudCk6IFR8bnVsbCB7XG4gIGFzc2VydERvbUVsZW1lbnQoZWxlbWVudCk7XG4gIGNvbnN0IGNvbnRleHQgPSBnZXRMQ29udGV4dChlbGVtZW50KTtcbiAgcmV0dXJuIGNvbnRleHQgPT09IG51bGwgPyBudWxsIDogY29udGV4dC5sVmlld1tDT05URVhUXSBhcyBUO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgY29tcG9uZW50IGluc3RhbmNlIHdob3NlIHZpZXcgY29udGFpbnMgdGhlIERPTSBlbGVtZW50LlxuICpcbiAqIEZvciBleGFtcGxlLCBpZiBgPGNoaWxkLWNvbXA+YCBpcyB1c2VkIGluIHRoZSB0ZW1wbGF0ZSBvZiBgPGFwcC1jb21wPmBcbiAqIChpLmUuIGEgYFZpZXdDaGlsZGAgb2YgYDxhcHAtY29tcD5gKSwgY2FsbGluZyBgZ2V0T3duaW5nQ29tcG9uZW50YCBvbiBgPGNoaWxkLWNvbXA+YFxuICogd291bGQgcmV0dXJuIGA8YXBwLWNvbXA+YC5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudE9yRGlyIERPTSBlbGVtZW50LCBjb21wb25lbnQgb3IgZGlyZWN0aXZlIGluc3RhbmNlXG4gKiAgICBmb3Igd2hpY2ggdG8gcmV0cmlldmUgdGhlIHJvb3QgY29tcG9uZW50cy5cbiAqIEByZXR1cm5zIENvbXBvbmVudCBpbnN0YW5jZSB3aG9zZSB2aWV3IG93bnMgdGhlIERPTSBlbGVtZW50IG9yIG51bGwgaWYgdGhlIGVsZW1lbnQgaXMgbm90XG4gKiAgICBwYXJ0IG9mIGEgY29tcG9uZW50IHZpZXcuXG4gKlxuICogQHB1YmxpY0FwaVxuICogQGdsb2JhbEFwaSBuZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3duaW5nQ29tcG9uZW50PFQ+KGVsZW1lbnRPckRpcjogRWxlbWVudHx7fSk6IFR8bnVsbCB7XG4gIGNvbnN0IGNvbnRleHQgPSBnZXRMQ29udGV4dChlbGVtZW50T3JEaXIpO1xuICBpZiAoY29udGV4dCA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG5cbiAgbGV0IGxWaWV3ID0gY29udGV4dC5sVmlldztcbiAgbGV0IHBhcmVudDogTFZpZXd8bnVsbDtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGxWaWV3KTtcbiAgd2hpbGUgKGxWaWV3W1RWSUVXXS50eXBlID09PSBUVmlld1R5cGUuRW1iZWRkZWQgJiYgKHBhcmVudCA9IGdldExWaWV3UGFyZW50KGxWaWV3KSEpKSB7XG4gICAgbFZpZXcgPSBwYXJlbnQ7XG4gIH1cbiAgcmV0dXJuIGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuSXNSb290ID8gbnVsbCA6IGxWaWV3W0NPTlRFWFRdIGFzIFQ7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIGFsbCByb290IGNvbXBvbmVudHMgYXNzb2NpYXRlZCB3aXRoIGEgRE9NIGVsZW1lbnQsIGRpcmVjdGl2ZSBvciBjb21wb25lbnQgaW5zdGFuY2UuXG4gKiBSb290IGNvbXBvbmVudHMgYXJlIHRob3NlIHdoaWNoIGhhdmUgYmVlbiBib290c3RyYXBwZWQgYnkgQW5ndWxhci5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudE9yRGlyIERPTSBlbGVtZW50LCBjb21wb25lbnQgb3IgZGlyZWN0aXZlIGluc3RhbmNlXG4gKiAgICBmb3Igd2hpY2ggdG8gcmV0cmlldmUgdGhlIHJvb3QgY29tcG9uZW50cy5cbiAqIEByZXR1cm5zIFJvb3QgY29tcG9uZW50cyBhc3NvY2lhdGVkIHdpdGggdGhlIHRhcmdldCBvYmplY3QuXG4gKlxuICogQHB1YmxpY0FwaVxuICogQGdsb2JhbEFwaSBuZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Um9vdENvbXBvbmVudHMoZWxlbWVudE9yRGlyOiBFbGVtZW50fHt9KToge31bXSB7XG4gIHJldHVybiBbLi4uZ2V0Um9vdENvbnRleHQoZWxlbWVudE9yRGlyKS5jb21wb25lbnRzXTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgYW4gYEluamVjdG9yYCBhc3NvY2lhdGVkIHdpdGggYW4gZWxlbWVudCwgY29tcG9uZW50IG9yIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudE9yRGlyIERPTSBlbGVtZW50LCBjb21wb25lbnQgb3IgZGlyZWN0aXZlIGluc3RhbmNlIGZvciB3aGljaCB0b1xuICogICAgcmV0cmlldmUgdGhlIGluamVjdG9yLlxuICogQHJldHVybnMgSW5qZWN0b3IgYXNzb2NpYXRlZCB3aXRoIHRoZSBlbGVtZW50LCBjb21wb25lbnQgb3IgZGlyZWN0aXZlIGluc3RhbmNlLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqIEBnbG9iYWxBcGkgbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEluamVjdG9yKGVsZW1lbnRPckRpcjogRWxlbWVudHx7fSk6IEluamVjdG9yIHtcbiAgY29uc3QgY29udGV4dCA9IGdldExDb250ZXh0KGVsZW1lbnRPckRpcik7XG4gIGlmIChjb250ZXh0ID09PSBudWxsKSByZXR1cm4gSW5qZWN0b3IuTlVMTDtcblxuICBjb25zdCB0Tm9kZSA9IGNvbnRleHQubFZpZXdbVFZJRVddLmRhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFRFbGVtZW50Tm9kZTtcbiAgcmV0dXJuIG5ldyBOb2RlSW5qZWN0b3IodE5vZGUsIGNvbnRleHQubFZpZXcpO1xufVxuXG4vKipcbiAqIFJldHJpZXZlIGEgc2V0IG9mIGluamVjdGlvbiB0b2tlbnMgYXQgYSBnaXZlbiBET00gbm9kZS5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IGZvciB3aGljaCB0aGUgaW5qZWN0aW9uIHRva2VucyBzaG91bGQgYmUgcmV0cmlldmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5qZWN0aW9uVG9rZW5zKGVsZW1lbnQ6IEVsZW1lbnQpOiBhbnlbXSB7XG4gIGNvbnN0IGNvbnRleHQgPSBnZXRMQ29udGV4dChlbGVtZW50KTtcbiAgaWYgKGNvbnRleHQgPT09IG51bGwpIHJldHVybiBbXTtcbiAgY29uc3QgbFZpZXcgPSBjb250ZXh0LmxWaWV3O1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdE5vZGUgPSB0Vmlldy5kYXRhW2NvbnRleHQubm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgY29uc3QgcHJvdmlkZXJUb2tlbnM6IGFueVtdID0gW107XG4gIGNvbnN0IHN0YXJ0SW5kZXggPSB0Tm9kZS5wcm92aWRlckluZGV4ZXMgJiBUTm9kZVByb3ZpZGVySW5kZXhlcy5Qcm92aWRlcnNTdGFydEluZGV4TWFzaztcbiAgY29uc3QgZW5kSW5kZXggPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGZvciAobGV0IGkgPSBzdGFydEluZGV4OyBpIDwgZW5kSW5kZXg7IGkrKykge1xuICAgIGxldCB2YWx1ZSA9IHRWaWV3LmRhdGFbaV07XG4gICAgaWYgKGlzRGlyZWN0aXZlRGVmSGFjayh2YWx1ZSkpIHtcbiAgICAgIC8vIFRoZSBmYWN0IHRoYXQgd2Ugc29tZXRpbWVzIHN0b3JlIFR5cGUgYW5kIHNvbWV0aW1lcyBEaXJlY3RpdmVEZWYgaW4gdGhpcyBsb2NhdGlvbiBpcyBhXG4gICAgICAvLyBkZXNpZ24gZmxhdy4gIFdlIHNob3VsZCBhbHdheXMgc3RvcmUgc2FtZSB0eXBlIHNvIHRoYXQgd2UgY2FuIGJlIG1vbm9tb3JwaGljLiBUaGUgaXNzdWVcbiAgICAgIC8vIGlzIHRoYXQgZm9yIENvbXBvbmVudHMvRGlyZWN0aXZlcyB3ZSBzdG9yZSB0aGUgZGVmIGluc3RlYWQgdGhlIHR5cGUuIFRoZSBjb3JyZWN0IGJlaGF2aW9yXG4gICAgICAvLyBpcyB0aGF0IHdlIHNob3VsZCBhbHdheXMgYmUgc3RvcmluZyBpbmplY3RhYmxlIHR5cGUgaW4gdGhpcyBsb2NhdGlvbi5cbiAgICAgIHZhbHVlID0gdmFsdWUudHlwZTtcbiAgICB9XG4gICAgcHJvdmlkZXJUb2tlbnMucHVzaCh2YWx1ZSk7XG4gIH1cbiAgcmV0dXJuIHByb3ZpZGVyVG9rZW5zO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyBkaXJlY3RpdmUgaW5zdGFuY2VzIGFzc29jaWF0ZWQgd2l0aCBhIGdpdmVuIERPTSBub2RlLiBEb2VzIG5vdCBpbmNsdWRlXG4gKiBjb21wb25lbnQgaW5zdGFuY2VzLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiBHaXZlbiB0aGUgZm9sbG93aW5nIERPTSBzdHJ1Y3R1cmU6XG4gKiBgYGBcbiAqIDxteS1hcHA+XG4gKiAgIDxidXR0b24gbXktYnV0dG9uPjwvYnV0dG9uPlxuICogICA8bXktY29tcD48L215LWNvbXA+XG4gKiA8L215LWFwcD5cbiAqIGBgYFxuICogQ2FsbGluZyBgZ2V0RGlyZWN0aXZlc2Agb24gYDxidXR0b24+YCB3aWxsIHJldHVybiBhbiBhcnJheSB3aXRoIGFuIGluc3RhbmNlIG9mIHRoZSBgTXlCdXR0b25gXG4gKiBkaXJlY3RpdmUgdGhhdCBpcyBhc3NvY2lhdGVkIHdpdGggdGhlIERPTSBub2RlLlxuICpcbiAqIENhbGxpbmcgYGdldERpcmVjdGl2ZXNgIG9uIGA8bXktY29tcD5gIHdpbGwgcmV0dXJuIGFuIGVtcHR5IGFycmF5LlxuICpcbiAqIEBwYXJhbSBub2RlIERPTSBub2RlIGZvciB3aGljaCB0byBnZXQgdGhlIGRpcmVjdGl2ZXMuXG4gKiBAcmV0dXJucyBBcnJheSBvZiBkaXJlY3RpdmVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgbm9kZS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKiBAZ2xvYmFsQXBpIG5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXREaXJlY3RpdmVzKG5vZGU6IE5vZGUpOiB7fVtdIHtcbiAgLy8gU2tpcCB0ZXh0IG5vZGVzIGJlY2F1c2Ugd2UgY2FuJ3QgaGF2ZSBkaXJlY3RpdmVzIGFzc29jaWF0ZWQgd2l0aCB0aGVtLlxuICBpZiAobm9kZSBpbnN0YW5jZW9mIFRleHQpIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBjb25zdCBjb250ZXh0ID0gZ2V0TENvbnRleHQobm9kZSk7XG4gIGlmIChjb250ZXh0ID09PSBudWxsKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgY29uc3QgbFZpZXcgPSBjb250ZXh0LmxWaWV3O1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3Qgbm9kZUluZGV4ID0gY29udGV4dC5ub2RlSW5kZXg7XG4gIGlmICghdFZpZXc/LmRhdGFbbm9kZUluZGV4XSkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBpZiAoY29udGV4dC5kaXJlY3RpdmVzID09PSB1bmRlZmluZWQpIHtcbiAgICBjb250ZXh0LmRpcmVjdGl2ZXMgPSBnZXREaXJlY3RpdmVzQXROb2RlSW5kZXgobm9kZUluZGV4LCBsVmlldywgZmFsc2UpO1xuICB9XG5cbiAgLy8gVGhlIGBkaXJlY3RpdmVzYCBpbiB0aGlzIGNhc2UgYXJlIGEgbmFtZWQgYXJyYXkgY2FsbGVkIGBMQ29tcG9uZW50Vmlld2AuIENsb25lIHRoZVxuICAvLyByZXN1bHQgc28gd2UgZG9uJ3QgZXhwb3NlIGFuIGludGVybmFsIGRhdGEgc3RydWN0dXJlIGluIHRoZSB1c2VyJ3MgY29uc29sZS5cbiAgcmV0dXJuIGNvbnRleHQuZGlyZWN0aXZlcyA9PT0gbnVsbCA/IFtdIDogWy4uLmNvbnRleHQuZGlyZWN0aXZlc107XG59XG5cbi8qKlxuICogUGFydGlhbCBtZXRhZGF0YSBmb3IgYSBnaXZlbiBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gKiBUaGlzIGluZm9ybWF0aW9uIG1pZ2h0IGJlIHVzZWZ1bCBmb3IgZGVidWdnaW5nIHB1cnBvc2VzIG9yIHRvb2xpbmcuXG4gKiBDdXJyZW50bHkgb25seSBgaW5wdXRzYCBhbmQgYG91dHB1dHNgIG1ldGFkYXRhIGlzIGF2YWlsYWJsZS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGlyZWN0aXZlRGVidWdNZXRhZGF0YSB7XG4gIGlucHV0czogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgb3V0cHV0czogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuLyoqXG4gKiBQYXJ0aWFsIG1ldGFkYXRhIGZvciBhIGdpdmVuIGNvbXBvbmVudCBpbnN0YW5jZS5cbiAqIFRoaXMgaW5mb3JtYXRpb24gbWlnaHQgYmUgdXNlZnVsIGZvciBkZWJ1Z2dpbmcgcHVycG9zZXMgb3IgdG9vbGluZy5cbiAqIEN1cnJlbnRseSB0aGUgZm9sbG93aW5nIGZpZWxkcyBhcmUgYXZhaWxhYmxlOlxuICogIC0gaW5wdXRzXG4gKiAgLSBvdXRwdXRzXG4gKiAgLSBlbmNhcHN1bGF0aW9uXG4gKiAgLSBjaGFuZ2VEZXRlY3Rpb25cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcG9uZW50RGVidWdNZXRhZGF0YSBleHRlbmRzIERpcmVjdGl2ZURlYnVnTWV0YWRhdGEge1xuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbjtcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBkZWJ1ZyAocGFydGlhbCkgbWV0YWRhdGEgZm9yIGEgcGFydGljdWxhciBkaXJlY3RpdmUgb3IgY29tcG9uZW50IGluc3RhbmNlLlxuICogVGhlIGZ1bmN0aW9uIGFjY2VwdHMgYW4gaW5zdGFuY2Ugb2YgYSBkaXJlY3RpdmUgb3IgY29tcG9uZW50IGFuZCByZXR1cm5zIHRoZSBjb3JyZXNwb25kaW5nXG4gKiBtZXRhZGF0YS5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlT3JDb21wb25lbnRJbnN0YW5jZSBJbnN0YW5jZSBvZiBhIGRpcmVjdGl2ZSBvciBjb21wb25lbnRcbiAqIEByZXR1cm5zIG1ldGFkYXRhIG9mIHRoZSBwYXNzZWQgZGlyZWN0aXZlIG9yIGNvbXBvbmVudFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqIEBnbG9iYWxBcGkgbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldERpcmVjdGl2ZU1ldGFkYXRhKGRpcmVjdGl2ZU9yQ29tcG9uZW50SW5zdGFuY2U6IGFueSk6IENvbXBvbmVudERlYnVnTWV0YWRhdGF8XG4gICAgRGlyZWN0aXZlRGVidWdNZXRhZGF0YXxudWxsIHtcbiAgY29uc3Qge2NvbnN0cnVjdG9yfSA9IGRpcmVjdGl2ZU9yQ29tcG9uZW50SW5zdGFuY2U7XG4gIGlmICghY29uc3RydWN0b3IpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBmaW5kIHRoZSBpbnN0YW5jZSBjb25zdHJ1Y3RvcicpO1xuICB9XG4gIC8vIEluIGNhc2UgYSBjb21wb25lbnQgaW5oZXJpdHMgZnJvbSBhIGRpcmVjdGl2ZSwgd2UgbWF5IGhhdmUgY29tcG9uZW50IGFuZCBkaXJlY3RpdmUgbWV0YWRhdGFcbiAgLy8gVG8gZW5zdXJlIHdlIGRvbid0IGdldCB0aGUgbWV0YWRhdGEgb2YgdGhlIGRpcmVjdGl2ZSwgd2Ugd2FudCB0byBjYWxsIGBnZXRDb21wb25lbnREZWZgIGZpcnN0LlxuICBjb25zdCBjb21wb25lbnREZWYgPSBnZXRDb21wb25lbnREZWYoY29uc3RydWN0b3IpO1xuICBpZiAoY29tcG9uZW50RGVmKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlucHV0czogY29tcG9uZW50RGVmLmlucHV0cyxcbiAgICAgIG91dHB1dHM6IGNvbXBvbmVudERlZi5vdXRwdXRzLFxuICAgICAgZW5jYXBzdWxhdGlvbjogY29tcG9uZW50RGVmLmVuY2Fwc3VsYXRpb24sXG4gICAgICBjaGFuZ2VEZXRlY3Rpb246IGNvbXBvbmVudERlZi5vblB1c2ggPyBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2ggOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuRGVmYXVsdFxuICAgIH07XG4gIH1cbiAgY29uc3QgZGlyZWN0aXZlRGVmID0gZ2V0RGlyZWN0aXZlRGVmKGNvbnN0cnVjdG9yKTtcbiAgaWYgKGRpcmVjdGl2ZURlZikge1xuICAgIHJldHVybiB7aW5wdXRzOiBkaXJlY3RpdmVEZWYuaW5wdXRzLCBvdXRwdXRzOiBkaXJlY3RpdmVEZWYub3V0cHV0c307XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogUmV0cmlldmUgbWFwIG9mIGxvY2FsIHJlZmVyZW5jZXMuXG4gKlxuICogVGhlIHJlZmVyZW5jZXMgYXJlIHJldHJpZXZlZCBhcyBhIG1hcCBvZiBsb2NhbCByZWZlcmVuY2UgbmFtZSB0byBlbGVtZW50IG9yIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0gdGFyZ2V0IERPTSBlbGVtZW50LCBjb21wb25lbnQgb3IgZGlyZWN0aXZlIGluc3RhbmNlIGZvciB3aGljaCB0byByZXRyaWV2ZVxuICogICAgdGhlIGxvY2FsIHJlZmVyZW5jZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2NhbFJlZnModGFyZ2V0OiB7fSk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgY29uc3QgY29udGV4dCA9IGdldExDb250ZXh0KHRhcmdldCk7XG4gIGlmIChjb250ZXh0ID09PSBudWxsKSByZXR1cm4ge307XG5cbiAgaWYgKGNvbnRleHQubG9jYWxSZWZzID09PSB1bmRlZmluZWQpIHtcbiAgICBjb250ZXh0LmxvY2FsUmVmcyA9IGRpc2NvdmVyTG9jYWxSZWZzKGNvbnRleHQubFZpZXcsIGNvbnRleHQubm9kZUluZGV4KTtcbiAgfVxuXG4gIHJldHVybiBjb250ZXh0LmxvY2FsUmVmcyB8fCB7fTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIGhvc3QgZWxlbWVudCBvZiBhIGNvbXBvbmVudCBvciBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gKiBUaGUgaG9zdCBlbGVtZW50IGlzIHRoZSBET00gZWxlbWVudCB0aGF0IG1hdGNoZWQgdGhlIHNlbGVjdG9yIG9mIHRoZSBkaXJlY3RpdmUuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudE9yRGlyZWN0aXZlIENvbXBvbmVudCBvciBkaXJlY3RpdmUgaW5zdGFuY2UgZm9yIHdoaWNoIHRoZSBob3N0XG4gKiAgICAgZWxlbWVudCBzaG91bGQgYmUgcmV0cmlldmVkLlxuICogQHJldHVybnMgSG9zdCBlbGVtZW50IG9mIHRoZSB0YXJnZXQuXG4gKlxuICogQHB1YmxpY0FwaVxuICogQGdsb2JhbEFwaSBuZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SG9zdEVsZW1lbnQoY29tcG9uZW50T3JEaXJlY3RpdmU6IHt9KTogRWxlbWVudCB7XG4gIHJldHVybiBnZXRMQ29udGV4dChjb21wb25lbnRPckRpcmVjdGl2ZSkhLm5hdGl2ZSBhcyB1bmtub3duIGFzIEVsZW1lbnQ7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSByZW5kZXJlZCB0ZXh0IGZvciBhIGdpdmVuIGNvbXBvbmVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHJldHJpZXZlcyB0aGUgaG9zdCBlbGVtZW50IG9mIGEgY29tcG9uZW50IGFuZFxuICogYW5kIHRoZW4gcmV0dXJucyB0aGUgYHRleHRDb250ZW50YCBmb3IgdGhhdCBlbGVtZW50LiBUaGlzIGltcGxpZXNcbiAqIHRoYXQgdGhlIHRleHQgcmV0dXJuZWQgd2lsbCBpbmNsdWRlIHJlLXByb2plY3RlZCBjb250ZW50IG9mXG4gKiB0aGUgY29tcG9uZW50IGFzIHdlbGwuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBUaGUgY29tcG9uZW50IHRvIHJldHVybiB0aGUgY29udGVudCB0ZXh0IGZvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJlbmRlcmVkVGV4dChjb21wb25lbnQ6IGFueSk6IHN0cmluZyB7XG4gIGNvbnN0IGhvc3RFbGVtZW50ID0gZ2V0SG9zdEVsZW1lbnQoY29tcG9uZW50KTtcbiAgcmV0dXJuIGhvc3RFbGVtZW50LnRleHRDb250ZW50IHx8ICcnO1xufVxuXG4vKipcbiAqIEV2ZW50IGxpc3RlbmVyIGNvbmZpZ3VyYXRpb24gcmV0dXJuZWQgZnJvbSBgZ2V0TGlzdGVuZXJzYC5cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBMaXN0ZW5lciB7XG4gIC8qKiBOYW1lIG9mIHRoZSBldmVudCBsaXN0ZW5lci4gKi9cbiAgbmFtZTogc3RyaW5nO1xuICAvKiogRWxlbWVudCB0aGF0IHRoZSBsaXN0ZW5lciBpcyBib3VuZCB0by4gKi9cbiAgZWxlbWVudDogRWxlbWVudDtcbiAgLyoqIENhbGxiYWNrIHRoYXQgaXMgaW52b2tlZCB3aGVuIHRoZSBldmVudCBpcyB0cmlnZ2VyZWQuICovXG4gIGNhbGxiYWNrOiAodmFsdWU6IGFueSkgPT4gYW55O1xuICAvKiogV2hldGhlciB0aGUgbGlzdGVuZXIgaXMgdXNpbmcgZXZlbnQgY2FwdHVyaW5nLiAqL1xuICB1c2VDYXB0dXJlOiBib29sZWFuO1xuICAvKipcbiAgICogVHlwZSBvZiB0aGUgbGlzdGVuZXIgKGUuZy4gYSBuYXRpdmUgRE9NIGV2ZW50IG9yIGEgY3VzdG9tIEBPdXRwdXQpLlxuICAgKi9cbiAgdHlwZTogJ2RvbSd8J291dHB1dCc7XG59XG5cblxuLyoqXG4gKiBSZXRyaWV2ZXMgYSBsaXN0IG9mIGV2ZW50IGxpc3RlbmVycyBhc3NvY2lhdGVkIHdpdGggYSBET00gZWxlbWVudC4gVGhlIGxpc3QgZG9lcyBpbmNsdWRlIGhvc3RcbiAqIGxpc3RlbmVycywgYnV0IGl0IGRvZXMgbm90IGluY2x1ZGUgZXZlbnQgbGlzdGVuZXJzIGRlZmluZWQgb3V0c2lkZSBvZiB0aGUgQW5ndWxhciBjb250ZXh0XG4gKiAoZS5nLiB0aHJvdWdoIGBhZGRFdmVudExpc3RlbmVyYCkuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqIEdpdmVuIHRoZSBmb2xsb3dpbmcgRE9NIHN0cnVjdHVyZTpcbiAqIGBgYFxuICogPG15LWFwcD5cbiAqICAgPGRpdiAoY2xpY2spPVwiZG9Tb21ldGhpbmcoKVwiPjwvZGl2PlxuICogPC9teS1hcHA+XG4gKlxuICogYGBgXG4gKiBDYWxsaW5nIGBnZXRMaXN0ZW5lcnNgIG9uIGA8ZGl2PmAgd2lsbCByZXR1cm4gYW4gb2JqZWN0IHRoYXQgbG9va3MgYXMgZm9sbG93czpcbiAqIGBgYFxuICoge1xuICogICBuYW1lOiAnY2xpY2snLFxuICogICBlbGVtZW50OiA8ZGl2PixcbiAqICAgY2FsbGJhY2s6ICgpID0+IGRvU29tZXRoaW5nKCksXG4gKiAgIHVzZUNhcHR1cmU6IGZhbHNlXG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IGZvciB3aGljaCB0aGUgRE9NIGxpc3RlbmVycyBzaG91bGQgYmUgcmV0cmlldmVkLlxuICogQHJldHVybnMgQXJyYXkgb2YgZXZlbnQgbGlzdGVuZXJzIG9uIHRoZSBET00gZWxlbWVudC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKiBAZ2xvYmFsQXBpIG5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMaXN0ZW5lcnMoZWxlbWVudDogRWxlbWVudCk6IExpc3RlbmVyW10ge1xuICBhc3NlcnREb21FbGVtZW50KGVsZW1lbnQpO1xuICBjb25zdCBsQ29udGV4dCA9IGdldExDb250ZXh0KGVsZW1lbnQpO1xuICBpZiAobENvbnRleHQgPT09IG51bGwpIHJldHVybiBbXTtcblxuICBjb25zdCBsVmlldyA9IGxDb250ZXh0LmxWaWV3O1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgbENsZWFudXAgPSBsVmlld1tDTEVBTlVQXTtcbiAgY29uc3QgdENsZWFudXAgPSB0Vmlldy5jbGVhbnVwO1xuICBjb25zdCBsaXN0ZW5lcnM6IExpc3RlbmVyW10gPSBbXTtcbiAgaWYgKHRDbGVhbnVwICYmIGxDbGVhbnVwKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0Q2xlYW51cC5sZW5ndGg7KSB7XG4gICAgICBjb25zdCBmaXJzdFBhcmFtID0gdENsZWFudXBbaSsrXTtcbiAgICAgIGNvbnN0IHNlY29uZFBhcmFtID0gdENsZWFudXBbaSsrXTtcbiAgICAgIGlmICh0eXBlb2YgZmlyc3RQYXJhbSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29uc3QgbmFtZTogc3RyaW5nID0gZmlyc3RQYXJhbTtcbiAgICAgICAgY29uc3QgbGlzdGVuZXJFbGVtZW50ID0gdW53cmFwUk5vZGUobFZpZXdbc2Vjb25kUGFyYW1dKSBhcyBhbnkgYXMgRWxlbWVudDtcbiAgICAgICAgY29uc3QgY2FsbGJhY2s6ICh2YWx1ZTogYW55KSA9PiBhbnkgPSBsQ2xlYW51cFt0Q2xlYW51cFtpKytdXTtcbiAgICAgICAgY29uc3QgdXNlQ2FwdHVyZU9ySW5keCA9IHRDbGVhbnVwW2krK107XG4gICAgICAgIC8vIGlmIHVzZUNhcHR1cmVPckluZHggaXMgYm9vbGVhbiB0aGVuIHJlcG9ydCBpdCBhcyBpcy5cbiAgICAgICAgLy8gaWYgdXNlQ2FwdHVyZU9ySW5keCBpcyBwb3NpdGl2ZSBudW1iZXIgdGhlbiBpdCBpbiB1bnN1YnNjcmliZSBtZXRob2RcbiAgICAgICAgLy8gaWYgdXNlQ2FwdHVyZU9ySW5keCBpcyBuZWdhdGl2ZSBudW1iZXIgdGhlbiBpdCBpcyBhIFN1YnNjcmlwdGlvblxuICAgICAgICBjb25zdCB0eXBlID1cbiAgICAgICAgICAgICh0eXBlb2YgdXNlQ2FwdHVyZU9ySW5keCA9PT0gJ2Jvb2xlYW4nIHx8IHVzZUNhcHR1cmVPckluZHggPj0gMCkgPyAnZG9tJyA6ICdvdXRwdXQnO1xuICAgICAgICBjb25zdCB1c2VDYXB0dXJlID0gdHlwZW9mIHVzZUNhcHR1cmVPckluZHggPT09ICdib29sZWFuJyA/IHVzZUNhcHR1cmVPckluZHggOiBmYWxzZTtcbiAgICAgICAgaWYgKGVsZW1lbnQgPT0gbGlzdGVuZXJFbGVtZW50KSB7XG4gICAgICAgICAgbGlzdGVuZXJzLnB1c2goe2VsZW1lbnQsIG5hbWUsIGNhbGxiYWNrLCB1c2VDYXB0dXJlLCB0eXBlfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgbGlzdGVuZXJzLnNvcnQoc29ydExpc3RlbmVycyk7XG4gIHJldHVybiBsaXN0ZW5lcnM7XG59XG5cbmZ1bmN0aW9uIHNvcnRMaXN0ZW5lcnMoYTogTGlzdGVuZXIsIGI6IExpc3RlbmVyKSB7XG4gIGlmIChhLm5hbWUgPT0gYi5uYW1lKSByZXR1cm4gMDtcbiAgcmV0dXJuIGEubmFtZSA8IGIubmFtZSA/IC0xIDogMTtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIHNob3VsZCBub3QgZXhpc3QgYmVjYXVzZSBpdCBpcyBtZWdhbW9ycGhpYyBhbmQgb25seSBtb3N0bHkgY29ycmVjdC5cbiAqXG4gKiBTZWUgY2FsbCBzaXRlIGZvciBtb3JlIGluZm8uXG4gKi9cbmZ1bmN0aW9uIGlzRGlyZWN0aXZlRGVmSGFjayhvYmo6IGFueSk6IG9iaiBpcyBEaXJlY3RpdmVEZWY8YW55PiB7XG4gIHJldHVybiBvYmoudHlwZSAhPT0gdW5kZWZpbmVkICYmIG9iai50ZW1wbGF0ZSAhPT0gdW5kZWZpbmVkICYmIG9iai5kZWNsYXJlZElucHV0cyAhPT0gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGF0dGFjaGVkIGBEZWJ1Z05vZGVgIGluc3RhbmNlIGZvciBhbiBlbGVtZW50IGluIHRoZSBET00uXG4gKlxuICogQHBhcmFtIGVsZW1lbnQgRE9NIGVsZW1lbnQgd2hpY2ggaXMgb3duZWQgYnkgYW4gZXhpc3RpbmcgY29tcG9uZW50J3Mgdmlldy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnTm9kZShlbGVtZW50OiBFbGVtZW50KTogRGVidWdOb2RlfG51bGwge1xuICBpZiAobmdEZXZNb2RlICYmICEoZWxlbWVudCBpbnN0YW5jZW9mIE5vZGUpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RpbmcgaW5zdGFuY2Ugb2YgRE9NIEVsZW1lbnQnKTtcbiAgfVxuXG4gIGNvbnN0IGxDb250ZXh0ID0gZ2V0TENvbnRleHQoZWxlbWVudCk7XG4gIGlmIChsQ29udGV4dCA9PT0gbnVsbCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgbFZpZXcgPSBsQ29udGV4dC5sVmlldztcbiAgY29uc3Qgbm9kZUluZGV4ID0gbENvbnRleHQubm9kZUluZGV4O1xuICBpZiAobm9kZUluZGV4ICE9PSAtMSkge1xuICAgIGNvbnN0IHZhbHVlSW5MVmlldyA9IGxWaWV3W25vZGVJbmRleF07XG4gICAgLy8gdGhpcyBtZWFucyB0aGF0IHZhbHVlIGluIHRoZSBsVmlldyBpcyBhIGNvbXBvbmVudCB3aXRoIGl0cyBvd25cbiAgICAvLyBkYXRhLiBJbiB0aGlzIHNpdHVhdGlvbiB0aGUgVE5vZGUgaXMgbm90IGFjY2Vzc2VkIGF0IHRoZSBzYW1lIHNwb3QuXG4gICAgY29uc3QgdE5vZGUgPVxuICAgICAgICBpc0xWaWV3KHZhbHVlSW5MVmlldykgPyAodmFsdWVJbkxWaWV3W1RfSE9TVF0gYXMgVE5vZGUpIDogZ2V0VE5vZGUobFZpZXdbVFZJRVddLCBub2RlSW5kZXgpO1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBhc3NlcnRFcXVhbCh0Tm9kZS5pbmRleCwgbm9kZUluZGV4LCAnRXhwZWN0aW5nIHRoYXQgVE5vZGUgYXQgaW5kZXggaXMgc2FtZSBhcyBpbmRleCcpO1xuICAgIHJldHVybiBidWlsZERlYnVnTm9kZSh0Tm9kZSwgbFZpZXcpO1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIGNvbXBvbmVudCBgTFZpZXdgIGZyb20gY29tcG9uZW50L2VsZW1lbnQuXG4gKlxuICogTk9URTogYExWaWV3YCBpcyBhIHByaXZhdGUgYW5kIHNob3VsZCBub3QgYmUgbGVha2VkIG91dHNpZGUuXG4gKiAgICAgICBEb24ndCBleHBvcnQgdGhpcyBtZXRob2QgdG8gYG5nLipgIG9uIHdpbmRvdy5cbiAqXG4gKiBAcGFyYW0gdGFyZ2V0IERPTSBlbGVtZW50IG9yIGNvbXBvbmVudCBpbnN0YW5jZSBmb3Igd2hpY2ggdG8gcmV0cmlldmUgdGhlIExWaWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tcG9uZW50TFZpZXcodGFyZ2V0OiBhbnkpOiBMVmlldyB7XG4gIGNvbnN0IGxDb250ZXh0ID0gZ2V0TENvbnRleHQodGFyZ2V0KSE7XG4gIGNvbnN0IG5vZGVJbmR4ID0gbENvbnRleHQubm9kZUluZGV4O1xuICBjb25zdCBsVmlldyA9IGxDb250ZXh0LmxWaWV3O1xuICBjb25zdCBjb21wb25lbnRMVmlldyA9IGxWaWV3W25vZGVJbmR4XTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGNvbXBvbmVudExWaWV3KTtcbiAgcmV0dXJuIGNvbXBvbmVudExWaWV3O1xufVxuXG4vKiogQXNzZXJ0cyB0aGF0IGEgdmFsdWUgaXMgYSBET00gRWxlbWVudC4gKi9cbmZ1bmN0aW9uIGFzc2VydERvbUVsZW1lbnQodmFsdWU6IGFueSkge1xuICBpZiAodHlwZW9mIEVsZW1lbnQgIT09ICd1bmRlZmluZWQnICYmICEodmFsdWUgaW5zdGFuY2VvZiBFbGVtZW50KSkge1xuICAgIHRocm93IG5ldyBFcnJvcignRXhwZWN0aW5nIGluc3RhbmNlIG9mIERPTSBFbGVtZW50Jyk7XG4gIH1cbn1cbiJdfQ==