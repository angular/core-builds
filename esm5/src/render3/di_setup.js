/*
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { resolveForwardRef } from '../di/forward_ref';
import { isTypeProvider, providerToFactory } from '../di/r3_injector';
import { diPublicInInjector, getNodeInjectable, getOrCreateNodeInjectorForNode } from './di';
import { directiveInject } from './instructions';
import { NodeInjectorFactory } from './interfaces/injector';
import { TVIEW } from './interfaces/view';
import { getPreviousOrParentTNode, getViewData } from './state';
import { isComponentDef } from './util';
/**
 * Resolves the providers which are defined in the DirectiveDef.
 *
 * When inserting the tokens and the factories in their respective arrays, we can assume that
 * this method is called first for the component (if any), and then for other directives on the same
 * node.
 * As a consequence,the providers are always processed in that order:
 * 1) The view providers of the component
 * 2) The providers of the component
 * 3) The providers of the other directives
 * This matches the structure of the injectables arrays of a view (for each node).
 * So the tokens and the factories can be pushed at the end of the arrays, except
 * in one case for multi providers.
 *
 * @param def the directive definition
 * @param providers: Array of `providers`.
 * @param viewProviders: Array of `viewProviders`.
 */
export function providersResolver(def, providers, viewProviders) {
    var viewData = getViewData();
    var tView = viewData[TVIEW];
    if (tView.firstTemplatePass) {
        var isComponent = isComponentDef(def);
        // The list of view providers is processed first, and the flags are updated
        resolveProvider(viewProviders, tView.data, tView.blueprint, isComponent, true);
        // Then, the list of providers is processed, and the flags are updated
        resolveProvider(providers, tView.data, tView.blueprint, isComponent, false);
    }
}
/**
* Resolves a provider and publishes it to the DI system.
*/
function resolveProvider(provider, tInjectables, lInjectablesBlueprint, isComponent, isViewProvider) {
    provider = resolveForwardRef(provider);
    if (Array.isArray(provider)) {
        // Recursively call `resolveProvider`
        // Recursion is OK in this case because this code will not be in hot-path once we implement
        // cloning of the initial state.
        for (var i = 0; i < provider.length; i++) {
            resolveProvider(provider[i], tInjectables, lInjectablesBlueprint, isComponent, isViewProvider);
        }
    }
    else {
        var viewData = getViewData();
        var token = isTypeProvider(provider) ? provider : resolveForwardRef(provider.provide);
        var providerFactory = providerToFactory(provider);
        var previousOrParentTNode = getPreviousOrParentTNode();
        var beginIndex = previousOrParentTNode.providerIndexes & 65535 /* ProvidersStartIndexMask */;
        var endIndex = previousOrParentTNode.flags >> 16 /* DirectiveStartingIndexShift */;
        var cptViewProvidersCount = previousOrParentTNode.providerIndexes >> 16 /* CptViewProvidersCountShift */;
        if (isTypeProvider(provider) || !provider.multi) {
            // Single provider case: the factory is created and pushed immediately
            var factory = new NodeInjectorFactory(providerFactory, isViewProvider, directiveInject);
            var existingFactoryIndex = indexOf(token, tInjectables, isViewProvider ? beginIndex : beginIndex + cptViewProvidersCount, endIndex);
            if (existingFactoryIndex == -1) {
                diPublicInInjector(getOrCreateNodeInjectorForNode(previousOrParentTNode, viewData), viewData, token);
                tInjectables.push(token);
                previousOrParentTNode.flags += 1 << 16 /* DirectiveStartingIndexShift */;
                if (isViewProvider) {
                    previousOrParentTNode.providerIndexes +=
                        65536 /* CptViewProvidersCountShifter */;
                }
                lInjectablesBlueprint.push(factory);
                viewData.push(factory);
            }
            else {
                lInjectablesBlueprint[existingFactoryIndex] = factory;
                viewData[existingFactoryIndex] = factory;
            }
        }
        else {
            // Multi provider case:
            // We create a multi factory which is going to aggregate all the values.
            // Since the output of such a factory depends on content or view injection,
            // we create two of them, which are linked together.
            //
            // The first one (for view providers) is always in the first block of the injectables array,
            // and the second one (for providers) is always in the second block.
            // This is important because view providers have higher priority. When a multi token
            // is being looked up, the view providers should be found first.
            // Note that it is not possible to have a multi factory in the third block (directive block).
            //
            // The algorithm to process multi providers is as follows:
            // 1) If the multi provider comes from the `viewProviders` of the component:
            //   a) If the special view providers factory doesn't exist, it is created and pushed.
            //   b) Else, the multi provider is added to the existing multi factory.
            // 2) If the multi provider comes from the `providers` of the component or of another
            // directive:
            //   a) If the multi factory doesn't exist, it is created and provider pushed into it.
            //      It is also linked to the multi factory for view providers, if it exists.
            //   b) Else, the multi provider is added to the existing multi factory.
            var existingProvidersFactoryIndex = indexOf(token, tInjectables, beginIndex + cptViewProvidersCount, endIndex);
            var existingViewProvidersFactoryIndex = indexOf(token, tInjectables, beginIndex, beginIndex + cptViewProvidersCount);
            var doesProvidersFactoryExist = existingProvidersFactoryIndex >= 0 &&
                lInjectablesBlueprint[existingProvidersFactoryIndex];
            var doesViewProvidersFactoryExist = existingViewProvidersFactoryIndex >= 0 &&
                lInjectablesBlueprint[existingViewProvidersFactoryIndex];
            if (isViewProvider && !doesViewProvidersFactoryExist ||
                !isViewProvider && !doesProvidersFactoryExist) {
                // Cases 1.a and 2.a
                diPublicInInjector(getOrCreateNodeInjectorForNode(previousOrParentTNode, viewData), viewData, token);
                var factory = multiFactory(isViewProvider ? multiViewProvidersFactoryResolver : multiProvidersFactoryResolver, lInjectablesBlueprint.length, isViewProvider, isComponent, providerFactory);
                if (!isViewProvider && doesViewProvidersFactoryExist) {
                    lInjectablesBlueprint[existingViewProvidersFactoryIndex].providerFactory = factory;
                }
                tInjectables.push(token);
                previousOrParentTNode.flags += 1 << 16 /* DirectiveStartingIndexShift */;
                if (isViewProvider) {
                    previousOrParentTNode.providerIndexes +=
                        65536 /* CptViewProvidersCountShifter */;
                }
                lInjectablesBlueprint.push(factory);
                viewData.push(factory);
            }
            else {
                // Cases 1.b and 2.b
                multiFactoryAdd(lInjectablesBlueprint[isViewProvider ? existingViewProvidersFactoryIndex : existingProvidersFactoryIndex], providerFactory, !isViewProvider && isComponent);
            }
            if (!isViewProvider && isComponent && doesViewProvidersFactoryExist) {
                lInjectablesBlueprint[existingViewProvidersFactoryIndex].componentProviders++;
            }
        }
    }
}
/**
* Add a factory in a multi factory.
*/
function multiFactoryAdd(multiFactory, factory, isComponentProvider) {
    multiFactory.multi.push(factory);
    if (isComponentProvider) {
        multiFactory.componentProviders++;
    }
}
/**
* Returns the index of item in the array, but only in the begin to end range.
*/
function indexOf(item, arr, begin, end) {
    for (var i = begin; i < end; i++) {
        if (arr[i] === item)
            return i;
    }
    return -1;
}
/**
* Use this with `multi` `providers`.
*/
function multiProvidersFactoryResolver(_, tData, lData, tNode) {
    return multiResolve(this.multi, []);
}
/**
* Use this with `multi` `viewProviders`.
*
* This factory knows how to concatenate itself with the existing `multi` `providers`.
*/
function multiViewProvidersFactoryResolver(_, tData, lData, tNode) {
    var factories = this.multi;
    var result;
    if (this.providerFactory) {
        var componentCount = this.providerFactory.componentProviders;
        var multiProviders = getNodeInjectable(tData, lData, this.providerFactory.index, tNode);
        // Copy the section of the array which contains `multi` `providers` from the component
        result = multiProviders.slice(0, componentCount);
        // Insert the `viewProvider` instances.
        multiResolve(factories, result);
        // Copy the section of the array which contains `multi` `providers` from other directives
        for (var i = componentCount; i < multiProviders.length; i++) {
            result.push(multiProviders[i]);
        }
    }
    else {
        result = [];
        // Insert the `viewProvider` instances.
        multiResolve(factories, result);
    }
    return result;
}
/**
* Maps an array of factories into an array of values.
*/
function multiResolve(factories, result) {
    for (var i = 0; i < factories.length; i++) {
        var factory = factories[i];
        result.push(factory());
    }
    return result;
}
/**
* Creates a multi factory.
*/
function multiFactory(factoryFn, index, isViewProvider, isComponent, f) {
    var factory = new NodeInjectorFactory(factoryFn, isViewProvider, directiveInject);
    factory.multi = [];
    factory.index = index;
    factory.componentProviders = 0;
    multiFactoryAdd(factory, f, isComponent && !isViewProvider);
    return factory;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlfc2V0dXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpX3NldHVwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRXBELE9BQU8sRUFBQyxjQUFjLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUdwRSxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsaUJBQWlCLEVBQUUsOEJBQThCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDM0YsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRTFELE9BQU8sRUFBbUIsS0FBSyxFQUFRLE1BQU0sbUJBQW1CLENBQUM7QUFDakUsT0FBTyxFQUFDLHdCQUF3QixFQUFFLFdBQVcsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUM5RCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBSXRDOzs7Ozs7Ozs7Ozs7Ozs7OztHQWlCRztBQUNILE1BQU0sVUFBVSxpQkFBaUIsQ0FDN0IsR0FBb0IsRUFBRSxTQUFxQixFQUFFLGFBQXlCO0lBQ3hFLElBQU0sUUFBUSxHQUFHLFdBQVcsRUFBRSxDQUFDO0lBQy9CLElBQU0sS0FBSyxHQUFVLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNyQyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsRUFBRTtRQUMzQixJQUFNLFdBQVcsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFeEMsMkVBQTJFO1FBQzNFLGVBQWUsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsU0FBUyxFQUFFLFdBQVcsRUFBRSxJQUFJ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RixTQUFTLFlBQVksQ0FBQyxTQUEyQixFQUFFLE1BQWE7SUFDOUQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDekMsSUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBZSxDQUFDO1FBQzNDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztLQUN4QjtJQUNELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFFRDs7RUFFRTtBQUNGLFNBQVMsWUFBWSxDQUNqQixTQUVXLEVBQ1gsS0FBYSxFQUFFLGNBQXVCLEVBQUUsV0FBb0IsRUFDNUQsQ0FBWTtJQUNkLElBQU0sT0FBTyxHQUFHLElBQUksbUJBQW1CLENBQUMsU0FBUyxFQUFFLGNBQWMsRUFBRSxlQUFlLENBQUMsQ0FBQztJQUNwRixPQUFPLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztJQUNuQixPQUFPLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUN0QixPQUFPLENBQUMsa0JBQWtCLEdBQUcsQ0FBQyxDQUFDO0lBQy9CLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLFdBQVcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQzVELE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuXG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuLi9kaS9mb3J3YXJkX3JlZic7XG5pbXBvcnQge1Byb3ZpZGVyfSBmcm9tICcuLi9kaS9wcm92aWRlcic7XG5pbXBvcnQge2lzVHlwZVByb3ZpZGVyLCBwcm92aWRlclRvRmFjdG9yeX0gZnJvbSAnLi4vZGkvcjNfaW5qZWN0b3InO1xuXG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLic7XG5pbXBvcnQge2RpUHVibGljSW5JbmplY3RvciwgZ2V0Tm9kZUluamVjdGFibGUsIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZX0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge2RpcmVjdGl2ZUluamVjdH0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtOb2RlSW5qZWN0b3JGYWN0b3J5fSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlUHJvdmlkZXJJbmRleGVzfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0xWaWV3RGF0YSwgVERhdGEsIFRWSUVXLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIGdldFZpZXdEYXRhfSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7aXNDb21wb25lbnREZWZ9IGZyb20gJy4vdXRpbCc7XG5cblxuXG4vKipcbiAqIFJlc29sdmVzIHRoZSBwcm92aWRlcnMgd2hpY2ggYXJlIGRlZmluZWQgaW4gdGhlIERpcmVjdGl2ZURlZi5cbiAqXG4gKiBXaGVuIGluc2VydGluZyB0aGUgdG9rZW5zIGFuZCB0aGUgZmFjdG9yaWVzIGluIHRoZWlyIHJlc3BlY3RpdmUgYXJyYXlzLCB3ZSBjYW4gYXNzdW1lIHRoYXRcbiAqIHRoaXMgbWV0aG9kIGlzIGNhbGxlZCBmaXJzdCBmb3IgdGhlIGNvbXBvbmVudCAoaWYgYW55KSwgYW5kIHRoZW4gZm9yIG90aGVyIGRpcmVjdGl2ZXMgb24gdGhlIHNhbWVcbiAqIG5vZGUuXG4gKiBBcyBhIGNvbnNlcXVlbmNlLHRoZSBwcm92aWRlcnMgYXJlIGFsd2F5cyBwcm9jZXNzZWQgaW4gdGhhdCBvcmRlcjpcbiAqIDEpIFRoZSB2aWV3IHByb3ZpZGVycyBvZiB0aGUgY29tcG9uZW50XG4gKiAyKSBUaGUgcHJvdmlkZXJzIG9mIHRoZSBjb21wb25lbnRcbiAqIDMpIFRoZSBwcm92aWRlcnMgb2YgdGhlIG90aGVyIGRpcmVjdGl2ZXNcbiAqIFRoaXMgbWF0Y2hlcyB0aGUgc3RydWN0dXJlIG9mIHRoZSBpbmplY3RhYmxlcyBhcnJheXMgb2YgYSB2aWV3IChmb3IgZWFjaCBub2RlKS5cbiAqIFNvIHRoZSB0b2tlbnMgYW5kIHRoZSBmYWN0b3JpZXMgY2FuIGJlIHB1c2hlZCBhdCB0aGUgZW5kIG9mIHRoZSBhcnJheXMsIGV4Y2VwdFxuICogaW4gb25lIGNhc2UgZm9yIG11bHRpIHByb3ZpZGVycy5cbiAqXG4gKiBAcGFyYW0gZGVmIHRoZSBkaXJlY3RpdmUgZGVmaW5pdGlvblxuICogQHBhcmFtIHByb3ZpZGVyczogQXJyYXkgb2YgYHByb3ZpZGVyc2AuXG4gKiBAcGFyYW0gdmlld1Byb3ZpZGVyczogQXJyYXkgb2YgYHZpZXdQcm92aWRlcnNgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZXJzUmVzb2x2ZXI8VD4oXG4gICAgZGVmOiBEaXJlY3RpdmVEZWY8VD4sIHByb3ZpZGVyczogUHJvdmlkZXJbXSwgdmlld1Byb3ZpZGVyczogUHJvdmlkZXJbXSk6IHZvaWQge1xuICBjb25zdCB2aWV3RGF0YSA9IGdldFZpZXdEYXRhKCk7XG4gIGNvbnN0IHRWaWV3OiBUVmlldyA9IHZpZXdEYXRhW1RWSUVXXTtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgY29uc3QgaXNDb21wb25lbnQgPSBpc0NvbXBvbmVudERlZihkZWYpO1xuXG4gICAgLy8gVGhlIGxpc3Qgb2YgdmlldyBwcm92aWRlcnMgaXMgcHJvY2Vzc2VkIGZpcnN0LCBhbmQgdGhlIGZsYWdzIGFyZSB1cGRhdGVkXG4gICAgcmVzb2x2ZVByb3ZpZGVyKHZpZXdQcm92aWRlcnMsIHRWaWV3LmRhdGEsIHRWaWV3LmJsdWVwcmludCwgaXNDb21wb25lbnQsIHRydWUpO1xuXG4gICAgLy8gVGhlbiwgdGhlIGxpc3Qgb2YgcHJvdmlkZXJzIGlzIHByb2Nlc3NlZCwgYW5kIHRoZSBmbGFncyBhcmUgdXBkYXRlZFxuICAgIHJlc29sdmVQcm92aWRlcihwcm92aWRlcnMsIHRWaWV3LmRhdGEsIHRWaWV3LmJsdWVwcmludCwgaXNDb21wb25lbnQsIGZhbHNlKTtcbiAgfVxufVxuXG4vKipcbiogUmVzb2x2ZXMgYSBwcm92aWRlciBhbmQgcHVibGlzaGVzIGl0IHRvIHRoZSBESSBzeXN0ZW0uXG4qL1xuZnVuY3Rpb24gcmVzb2x2ZVByb3ZpZGVyKFxuICAgIHByb3ZpZGVyOiBQcm92aWRlciwgdEluamVjdGFibGVzOiBURGF0YSwgbEluamVjdGFibGVzQmx1ZXByaW50OiBOb2RlSW5qZWN0b3JGYWN0b3J5W10sXG4gICAgaXNDb21wb25lbnQ6IGJvb2xlYW4sIGlzVmlld1Byb3ZpZGVyOiBib29sZWFuKTogdm9pZCB7XG4gIHByb3ZpZGVyID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIpO1xuICBpZiAoQXJyYXkuaXNBcnJheShwcm92aWRlcikpIHtcbiAgICAvLyBSZWN1cnNpdmVseSBjYWxsIGByZXNvbHZlUHJvdmlkZXJgXG4gICAgLy8gUmVjdXJzaW9uIGlzIE9LIGluIHRoaXMgY2FzZSBiZWNhdXNlIHRoaXMgY29kZSB3aWxsIG5vdCBiZSBpbiBob3QtcGF0aCBvbmNlIHdlIGltcGxlbWVudFxuICAgIC8vIGNsb25pbmcgb2YgdGhlIGluaXRpYWwgc3RhdGUuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm92aWRlci5sZW5ndGg7IGkrKykge1xuICAgICAgcmVzb2x2ZVByb3ZpZGVyKFxuICAgICAgICAgIHByb3ZpZGVyW2ldLCB0SW5qZWN0YWJsZXMsIGxJbmplY3RhYmxlc0JsdWVwcmludCwgaXNDb21wb25lbnQsIGlzVmlld1Byb3ZpZGVyKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qgdmlld0RhdGEgPSBnZXRWaWV3RGF0YSgpO1xuICAgIGxldCB0b2tlbjogYW55ID0gaXNUeXBlUHJvdmlkZXIocHJvdmlkZXIpID8gcHJvdmlkZXIgOiByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlci5wcm92aWRlKTtcbiAgICBsZXQgcHJvdmlkZXJGYWN0b3J5OiAoKSA9PiBhbnkgPSBwcm92aWRlclRvRmFjdG9yeShwcm92aWRlcik7XG5cbiAgICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgICBjb25zdCBiZWdpbkluZGV4ID1cbiAgICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLnByb3ZpZGVySW5kZXhlcyAmIFROb2RlUHJvdmlkZXJJbmRleGVzLlByb3ZpZGVyc1N0YXJ0SW5kZXhNYXNrO1xuICAgIGNvbnN0IGVuZEluZGV4ID0gcHJldmlvdXNPclBhcmVudFROb2RlLmZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xuICAgIGNvbnN0IGNwdFZpZXdQcm92aWRlcnNDb3VudCA9XG4gICAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wcm92aWRlckluZGV4ZXMgPj4gVE5vZGVQcm92aWRlckluZGV4ZXMuQ3B0Vmlld1Byb3ZpZGVyc0NvdW50U2hpZnQ7XG5cbiAgICBpZiAoaXNUeXBlUHJvdmlkZXIocHJvdmlkZXIpIHx8ICFwcm92aWRlci5tdWx0aSkge1xuICAgICAgLy8gU2luZ2xlIHByb3ZpZGVyIGNhc2U6IHRoZSBmYWN0b3J5IGlzIGNyZWF0ZWQgYW5kIHB1c2hlZCBpbW1lZGlhdGVseVxuICAgICAgY29uc3QgZmFjdG9yeSA9IG5ldyBOb2RlSW5qZWN0b3JGYWN0b3J5KHByb3ZpZGVyRmFjdG9yeSwgaXNWaWV3UHJvdmlkZXIsIGRpcmVjdGl2ZUluamVjdCk7XG4gICAgICBjb25zdCBleGlzdGluZ0ZhY3RvcnlJbmRleCA9IGluZGV4T2YoXG4gICAgICAgICAgdG9rZW4sIHRJbmplY3RhYmxlcywgaXNWaWV3UHJvdmlkZXIgPyBiZWdpbkluZGV4IDogYmVnaW5JbmRleCArIGNwdFZpZXdQcm92aWRlcnNDb3VudCxcbiAgICAgICAgICBlbmRJbmRleCk7XG4gICAgICBpZiAoZXhpc3RpbmdGYWN0b3J5SW5kZXggPT0gLTEpIHtcbiAgICAgICAgZGlQdWJsaWNJbkluamVjdG9yKFxuICAgICAgICAgICAgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKFxuICAgICAgICAgICAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICAgICAgICAgICAgICB2aWV3RGF0YSksXG4gICAgICAgICAgICB2aWV3RGF0YSwgdG9rZW4pO1xuICAgICAgICB0SW5qZWN0YWJsZXMucHVzaCh0b2tlbik7XG4gICAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5mbGFncyArPSAxIDw8IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xuICAgICAgICBpZiAoaXNWaWV3UHJvdmlkZXIpIHtcbiAgICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUucHJvdmlkZXJJbmRleGVzICs9XG4gICAgICAgICAgICAgIFROb2RlUHJvdmlkZXJJbmRleGVzLkNwdFZpZXdQcm92aWRlcnNDb3VudFNoaWZ0ZXI7XG4gICAgICAgIH1cbiAgICAgICAgbEluamVjdGFibGVzQmx1ZXByaW50LnB1c2goZmFjdG9yeSk7XG4gICAgICAgIHZpZXdEYXRhLnB1c2goZmFjdG9yeSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsSW5qZWN0YWJsZXNCbHVlcHJpbnRbZXhpc3RpbmdGYWN0b3J5SW5kZXhdID0gZmFjdG9yeTtcbiAgICAgICAgdmlld0RhdGFbZXhpc3RpbmdGYWN0b3J5SW5kZXhdID0gZmFjdG9yeTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTXVsdGkgcHJvdmlkZXIgY2FzZTpcbiAgICAgIC8vIFdlIGNyZWF0ZSBhIG11bHRpIGZhY3Rvcnkgd2hpY2ggaXMgZ29pbmcgdG8gYWdncmVnYXRlIGFsbCB0aGUgdmFsdWVzLlxuICAgICAgLy8gU2luY2UgdGhlIG91dHB1dCBvZiBzdWNoIGEgZmFjdG9yeSBkZXBlbmRzIG9uIGNvbnRlbnQgb3IgdmlldyBpbmplY3Rpb24sXG4gICAgICAvLyB3ZSBjcmVhdGUgdHdvIG9mIHRoZW0sIHdoaWNoIGFyZSBsaW5rZWQgdG9nZXRoZXIuXG4gICAgICAvL1xuICAgICAgLy8gVGhlIGZpcnN0IG9uZSAoZm9yIHZpZXcgcHJvdmlkZXJzKSBpcyBhbHdheXMgaW4gdGhlIGZpcnN0IGJsb2NrIG9mIHRoZSBpbmplY3RhYmxlcyBhcnJheSxcbiAgICAgIC8vIGFuZCB0aGUgc2Vjb25kIG9uZSAoZm9yIHByb3ZpZGVycykgaXMgYWx3YXlzIGluIHRoZSBzZWNvbmQgYmxvY2suXG4gICAgICAvLyBUaGlzIGlzIGltcG9ydGFudCBiZWNhdXNlIHZpZXcgcHJvdmlkZXJzIGhhdmUgaGlnaGVyIHByaW9yaXR5LiBXaGVuIGEgbXVsdGkgdG9rZW5cbiAgICAgIC8vIGlzIGJlaW5nIGxvb2tlZCB1cCwgdGhlIHZpZXcgcHJvdmlkZXJzIHNob3VsZCBiZSBmb3VuZCBmaXJzdC5cbiAgICAgIC8vIE5vdGUgdGhhdCBpdCBpcyBub3QgcG9zc2libGUgdG8gaGF2ZSBhIG11bHRpIGZhY3RvcnkgaW4gdGhlIHRoaXJkIGJsb2NrIChkaXJlY3RpdmUgYmxvY2spLlxuICAgICAgLy9cbiAgICAgIC8vIFRoZSBhbGdvcml0aG0gdG8gcHJvY2VzcyBtdWx0aSBwcm92aWRlcnMgaXMgYXMgZm9sbG93czpcbiAgICAgIC8vIDEpIElmIHRoZSBtdWx0aSBwcm92aWRlciBjb21lcyBmcm9tIHRoZSBgdmlld1Byb3ZpZGVyc2Agb2YgdGhlIGNvbXBvbmVudDpcbiAgICAgIC8vICAgYSkgSWYgdGhlIHNwZWNpYWwgdmlldyBwcm92aWRlcnMgZmFjdG9yeSBkb2Vzbid0IGV4aXN0LCBpdCBpcyBjcmVhdGVkIGFuZCBwdXNoZWQuXG4gICAgICAvLyAgIGIpIEVsc2UsIHRoZSBtdWx0aSBwcm92aWRlciBpcyBhZGRlZCB0byB0aGUgZXhpc3RpbmcgbXVsdGkgZmFjdG9yeS5cbiAgICAgIC8vIDIpIElmIHRoZSBtdWx0aSBwcm92aWRlciBjb21lcyBmcm9tIHRoZSBgcHJvdmlkZXJzYCBvZiB0aGUgY29tcG9uZW50IG9yIG9mIGFub3RoZXJcbiAgICAgIC8vIGRpcmVjdGl2ZTpcbiAgICAgIC8vICAgYSkgSWYgdGhlIG11bHRpIGZhY3RvcnkgZG9lc24ndCBleGlzdCwgaXQgaXMgY3JlYXRlZCBhbmQgcHJvdmlkZXIgcHVzaGVkIGludG8gaXQuXG4gICAgICAvLyAgICAgIEl0IGlzIGFsc28gbGlua2VkIHRvIHRoZSBtdWx0aSBmYWN0b3J5IGZvciB2aWV3IHByb3ZpZGVycywgaWYgaXQgZXhpc3RzLlxuICAgICAgLy8gICBiKSBFbHNlLCB0aGUgbXVsdGkgcHJvdmlkZXIgaXMgYWRkZWQgdG8gdGhlIGV4aXN0aW5nIG11bHRpIGZhY3RvcnkuXG5cbiAgICAgIGNvbnN0IGV4aXN0aW5nUHJvdmlkZXJzRmFjdG9yeUluZGV4ID1cbiAgICAgICAgICBpbmRleE9mKHRva2VuLCB0SW5qZWN0YWJsZXMsIGJlZ2luSW5kZXggKyBjcHRWaWV3UHJvdmlkZXJzQ291bnQsIGVuZEluZGV4KTtcbiAgICAgIGNvbnN0IGV4aXN0aW5nVmlld1Byb3ZpZGVyc0ZhY3RvcnlJbmRleCA9XG4gICAgICAgICAgaW5kZXhPZih0b2tlbiwgdEluamVjdGFibGVzLCBiZWdpbkluZGV4LCBiZWdpbkluZGV4ICsgY3B0Vmlld1Byb3ZpZGVyc0NvdW50KTtcbiAgICAgIGNvbnN0IGRvZXNQcm92aWRlcnNGYWN0b3J5RXhpc3QgPSBleGlzdGluZ1Byb3ZpZGVyc0ZhY3RvcnlJbmRleCA+PSAwICYmXG4gICAgICAgICAgbEluamVjdGFibGVzQmx1ZXByaW50W2V4aXN0aW5nUHJvdmlkZXJzRmFjdG9yeUluZGV4XTtcbiAgICAgIGNvbnN0IGRvZXNWaWV3UHJvdmlkZXJzRmFjdG9yeUV4aXN0ID0gZXhpc3RpbmdWaWV3UHJvdmlkZXJzRmFjdG9yeUluZGV4ID49IDAgJiZcbiAgICAgICAgICBsSW5qZWN0YWJsZXNCbHVlcHJpbnRbZXhpc3RpbmdWaWV3UHJvdmlkZXJzRmFjdG9yeUluZGV4XTtcblxuICAgICAgaWYgKGlzVmlld1Byb3ZpZGVyICYmICFkb2VzVmlld1Byb3ZpZGVyc0ZhY3RvcnlFeGlzdCB8fFxuICAgICAgICAgICFpc1ZpZXdQcm92aWRlciAmJiAhZG9lc1Byb3ZpZGVyc0ZhY3RvcnlFeGlzdCkge1xuICAgICAgICAvLyBDYXNlcyAxLmEgYW5kIDIuYVxuICAgICAgICBkaVB1YmxpY0luSW5qZWN0b3IoXG4gICAgICAgICAgICBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoXG4gICAgICAgICAgICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgICAgICAgICAgICAgIHZpZXdEYXRhKSxcbiAgICAgICAgICAgIHZpZXdEYXRhLCB0b2tlbik7XG4gICAgICAgIGNvbnN0IGZhY3RvcnkgPSBtdWx0aUZhY3RvcnkoXG4gICAgICAgICAgICBpc1ZpZXdQcm92aWRlciA/IG11bHRpVmlld1Byb3ZpZGVyc0ZhY3RvcnlSZXNvbHZlciA6IG11bHRpUHJvdmlkZXJzRmFjdG9yeVJlc29sdmVyLFxuICAgICAgICAgICAgbEluamVjdGFibGVzQmx1ZXByaW50Lmxlbmd0aCwgaXNWaWV3UHJvdmlkZXIsIGlzQ29tcG9uZW50LCBwcm92aWRlckZhY3RvcnkpO1xuICAgICAgICBpZiAoIWlzVmlld1Byb3ZpZGVyICYmIGRvZXNWaWV3UHJvdmlkZXJzRmFjdG9yeUV4aXN0KSB7XG4gICAgICAgICAgbEluamVjdGFibGVzQmx1ZXByaW50W2V4aXN0aW5nVmlld1Byb3ZpZGVyc0ZhY3RvcnlJbmRleF0ucHJvdmlkZXJGYWN0b3J5ID0gZmFjdG9yeTtcbiAgICAgICAgfVxuICAgICAgICB0SW5qZWN0YWJsZXMucHVzaCh0b2tlbik7XG4gICAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5mbGFncyArPSAxIDw8IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xuICAgICAgICBpZiAoaXNWaWV3UHJvdmlkZXIpIHtcbiAgICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUucHJvdmlkZXJJbmRleGVzICs9XG4gICAgICAgICAgICAgIFROb2RlUHJvdmlkZXJJbmRleGVzLkNwdFZpZXdQcm92aWRlcnNDb3VudFNoaWZ0ZXI7XG4gICAgICAgIH1cbiAgICAgICAgbEluamVjdGFibGVzQmx1ZXByaW50LnB1c2goZmFjdG9yeSk7XG4gICAgICAgIHZpZXdEYXRhLnB1c2goZmFjdG9yeSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBDYXNlcyAxLmIgYW5kIDIuYlxuICAgICAgICBtdWx0aUZhY3RvcnlBZGQoXG4gICAgICAgICAgICBsSW5qZWN0YWJsZXNCbHVlcHJpbnQgIVtpc1ZpZXdQcm92aWRlciA/IGV4aXN0aW5nVmlld1Byb3ZpZGVyc0ZhY3RvcnlJbmRleCA6IGV4aXN0aW5nUHJvdmlkZXJzRmFjdG9yeUluZGV4XSxcbiAgICAgICAgICAgIHByb3ZpZGVyRmFjdG9yeSwgIWlzVmlld1Byb3ZpZGVyICYmIGlzQ29tcG9uZW50KTtcbiAgICAgIH1cbiAgICAgIGlmICghaXNWaWV3UHJvdmlkZXIgJiYgaXNDb21wb25lbnQgJiYgZG9lc1ZpZXdQcm92aWRlcnNGYWN0b3J5RXhpc3QpIHtcbiAgICAgICAgbEluamVjdGFibGVzQmx1ZXByaW50W2V4aXN0aW5nVmlld1Byb3ZpZGVyc0ZhY3RvcnlJbmRleF0uY29tcG9uZW50UHJvdmlkZXJzICErKztcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4qIEFkZCBhIGZhY3RvcnkgaW4gYSBtdWx0aSBmYWN0b3J5LlxuKi9cbmZ1bmN0aW9uIG11bHRpRmFjdG9yeUFkZChcbiAgICBtdWx0aUZhY3Rvcnk6IE5vZGVJbmplY3RvckZhY3RvcnksIGZhY3Rvcnk6ICgpID0+IGFueSwgaXNDb21wb25lbnRQcm92aWRlcjogYm9vbGVhbik6IHZvaWQge1xuICBtdWx0aUZhY3RvcnkubXVsdGkgIS5wdXNoKGZhY3RvcnkpO1xuICBpZiAoaXNDb21wb25lbnRQcm92aWRlcikge1xuICAgIG11bHRpRmFjdG9yeS5jb21wb25lbnRQcm92aWRlcnMgISsrO1xuICB9XG59XG5cbi8qKlxuKiBSZXR1cm5zIHRoZSBpbmRleCBvZiBpdGVtIGluIHRoZSBhcnJheSwgYnV0IG9ubHkgaW4gdGhlIGJlZ2luIHRvIGVuZCByYW5nZS5cbiovXG5mdW5jdGlvbiBpbmRleE9mKGl0ZW06IGFueSwgYXJyOiBhbnlbXSwgYmVnaW46IG51bWJlciwgZW5kOiBudW1iZXIpIHtcbiAgZm9yIChsZXQgaSA9IGJlZ2luOyBpIDwgZW5kOyBpKyspIHtcbiAgICBpZiAoYXJyW2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuKiBVc2UgdGhpcyB3aXRoIGBtdWx0aWAgYHByb3ZpZGVyc2AuXG4qL1xuZnVuY3Rpb24gbXVsdGlQcm92aWRlcnNGYWN0b3J5UmVzb2x2ZXIoXG4gICAgdGhpczogTm9kZUluamVjdG9yRmFjdG9yeSwgXzogbnVsbCwgdERhdGE6IFREYXRhLCBsRGF0YTogTFZpZXdEYXRhLFxuICAgIHROb2RlOiBURWxlbWVudE5vZGUpOiBhbnlbXSB7XG4gIHJldHVybiBtdWx0aVJlc29sdmUodGhpcy5tdWx0aSAhLCBbXSk7XG59XG5cbi8qKlxuKiBVc2UgdGhpcyB3aXRoIGBtdWx0aWAgYHZpZXdQcm92aWRlcnNgLlxuKlxuKiBUaGlzIGZhY3Rvcnkga25vd3MgaG93IHRvIGNvbmNhdGVuYXRlIGl0c2VsZiB3aXRoIHRoZSBleGlzdGluZyBgbXVsdGlgIGBwcm92aWRlcnNgLlxuKi9cbmZ1bmN0aW9uIG11bHRpVmlld1Byb3ZpZGVyc0ZhY3RvcnlSZXNvbHZlcihcbiAgICB0aGlzOiBOb2RlSW5qZWN0b3JGYWN0b3J5LCBfOiBudWxsLCB0RGF0YTogVERhdGEsIGxEYXRhOiBMVmlld0RhdGEsXG4gICAgdE5vZGU6IFRFbGVtZW50Tm9kZSk6IGFueVtdIHtcbiAgY29uc3QgZmFjdG9yaWVzID0gdGhpcy5tdWx0aSAhO1xuICBsZXQgcmVzdWx0OiBhbnlbXTtcbiAgaWYgKHRoaXMucHJvdmlkZXJGYWN0b3J5KSB7XG4gICAgY29uc3QgY29tcG9uZW50Q291bnQgPSB0aGlzLnByb3ZpZGVyRmFjdG9yeS5jb21wb25lbnRQcm92aWRlcnMgITtcbiAgICBjb25zdCBtdWx0aVByb3ZpZGVycyA9IGdldE5vZGVJbmplY3RhYmxlKHREYXRhLCBsRGF0YSwgdGhpcy5wcm92aWRlckZhY3RvcnkgIS5pbmRleCAhLCB0Tm9kZSk7XG4gICAgLy8gQ29weSB0aGUgc2VjdGlvbiBvZiB0aGUgYXJyYXkgd2hpY2ggY29udGFpbnMgYG11bHRpYCBgcHJvdmlkZXJzYCBmcm9tIHRoZSBjb21wb25lbnRcbiAgICByZXN1bHQgPSBtdWx0aVByb3ZpZGVycy5zbGljZSgwLCBjb21wb25lbnRDb3VudCk7XG4gICAgLy8gSW5zZXJ0IHRoZSBgdmlld1Byb3ZpZGVyYCBpbnN0YW5jZXMuXG4gICAgbXVsdGlSZXNvbHZlKGZhY3RvcmllcywgcmVzdWx0KTtcbiAgICAvLyBDb3B5IHRoZSBzZWN0aW9uIG9mIHRoZSBhcnJheSB3aGljaCBjb250YWlucyBgbXVsdGlgIGBwcm92aWRlcnNgIGZyb20gb3RoZXIgZGlyZWN0aXZlc1xuICAgIGZvciAobGV0IGkgPSBjb21wb25lbnRDb3VudDsgaSA8IG11bHRpUHJvdmlkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICByZXN1bHQucHVzaChtdWx0aVByb3ZpZGVyc1tpXSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJlc3VsdCA9IFtdO1xuICAgIC8vIEluc2VydCB0aGUgYHZpZXdQcm92aWRlcmAgaW5zdGFuY2VzLlxuICAgIG11bHRpUmVzb2x2ZShmYWN0b3JpZXMsIHJlc3VsdCk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4qIE1hcHMgYW4gYXJyYXkgb2YgZmFjdG9yaWVzIGludG8gYW4gYXJyYXkgb2YgdmFsdWVzLlxuKi9cbmZ1bmN0aW9uIG11bHRpUmVzb2x2ZShmYWN0b3JpZXM6IEFycmF5PCgpID0+IGFueT4sIHJlc3VsdDogYW55W10pOiBhbnlbXSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZmFjdG9yaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgZmFjdG9yeSA9IGZhY3Rvcmllc1tpXSAhYXMoKSA9PiBudWxsO1xuICAgIHJlc3VsdC5wdXNoKGZhY3RvcnkoKSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4qIENyZWF0ZXMgYSBtdWx0aSBmYWN0b3J5LlxuKi9cbmZ1bmN0aW9uIG11bHRpRmFjdG9yeShcbiAgICBmYWN0b3J5Rm46XG4gICAgICAgICh0aGlzOiBOb2RlSW5qZWN0b3JGYWN0b3J5LCBfOiBudWxsLCB0RGF0YTogVERhdGEsIGxEYXRhOiBMVmlld0RhdGEsIHROb2RlOiBURWxlbWVudE5vZGUpID0+XG4gICAgICAgICAgICBhbnksXG4gICAgaW5kZXg6IG51bWJlciwgaXNWaWV3UHJvdmlkZXI6IGJvb2xlYW4sIGlzQ29tcG9uZW50OiBib29sZWFuLFxuICAgIGY6ICgpID0+IGFueSk6IE5vZGVJbmplY3RvckZhY3Rvcnkge1xuICBjb25zdCBmYWN0b3J5ID0gbmV3IE5vZGVJbmplY3RvckZhY3RvcnkoZmFjdG9yeUZuLCBpc1ZpZXdQcm92aWRlciwgZGlyZWN0aXZlSW5qZWN0KTtcbiAgZmFjdG9yeS5tdWx0aSA9IFtdO1xuICBmYWN0b3J5LmluZGV4ID0gaW5kZXg7XG4gIGZhY3RvcnkuY29tcG9uZW50UHJvdmlkZXJzID0gMDtcbiAgbXVsdGlGYWN0b3J5QWRkKGZhY3RvcnksIGYsIGlzQ29tcG9uZW50ICYmICFpc1ZpZXdQcm92aWRlcik7XG4gIHJldHVybiBmYWN0b3J5O1xufVxuIl19