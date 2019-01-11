/**
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
import { getLView, getPreviousOrParentTNode } from './state';
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
    var lView = getLView();
    var tView = lView[TVIEW];
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
        var lView = getLView();
        var token = isTypeProvider(provider) ? provider : resolveForwardRef(provider.provide);
        var providerFactory = providerToFactory(provider);
        var tNode = getPreviousOrParentTNode();
        var beginIndex = tNode.providerIndexes & 65535 /* ProvidersStartIndexMask */;
        var endIndex = tNode.directiveStart;
        var cptViewProvidersCount = tNode.providerIndexes >> 16 /* CptViewProvidersCountShift */;
        if (isTypeProvider(provider) || !provider.multi) {
            // Single provider case: the factory is created and pushed immediately
            var factory = new NodeInjectorFactory(providerFactory, isViewProvider, true, directiveInject);
            var existingFactoryIndex = indexOf(token, tInjectables, isViewProvider ? beginIndex : beginIndex + cptViewProvidersCount, endIndex);
            if (existingFactoryIndex == -1) {
                diPublicInInjector(getOrCreateNodeInjectorForNode(tNode, lView), lView, token);
                tInjectables.push(token);
                tNode.directiveStart++;
                tNode.directiveEnd++;
                if (isViewProvider) {
                    tNode.providerIndexes += 65536 /* CptViewProvidersCountShifter */;
                }
                lInjectablesBlueprint.push(factory);
                lView.push(factory);
            }
            else {
                lInjectablesBlueprint[existingFactoryIndex] = factory;
                lView[existingFactoryIndex] = factory;
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
                diPublicInInjector(getOrCreateNodeInjectorForNode(tNode, lView), lView, token);
                var factory = multiFactory(isViewProvider ? multiViewProvidersFactoryResolver : multiProvidersFactoryResolver, lInjectablesBlueprint.length, isViewProvider, isComponent, providerFactory);
                if (!isViewProvider && doesViewProvidersFactoryExist) {
                    lInjectablesBlueprint[existingViewProvidersFactoryIndex].providerFactory = factory;
                }
                tInjectables.push(token);
                tNode.directiveStart++;
                tNode.directiveEnd++;
                if (isViewProvider) {
                    tNode.providerIndexes += 65536 /* CptViewProvidersCountShifter */;
                }
                lInjectablesBlueprint.push(factory);
                lView.push(factory);
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
    var factory = new NodeInjectorFactory(factoryFn, isViewProvider, true, directiveInject);
    factory.multi = [];
    factory.index = index;
    factory.componentProviders = 0;
    multiFactoryAdd(factory, f, isComponent && !isViewProvider);
    return factory;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlfc2V0dXAuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpX3NldHVwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRXBELE9BQU8sRUFBQyxjQUFjLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUdwRSxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsaUJBQWlCLEVBQUUsOEJBQThCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDM0YsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRTFELE9BQU8sRUFBZSxLQUFLLEVBQVEsTUFBTSxtQkFBbUIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsUUFBUSxFQUFFLHdCQUF3QixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQzNELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFJdEM7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUM3QixHQUFvQixFQUFFLFNBQXFCLEVBQUUsYUFBeUI7SUFDeEUsSUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsSUFBTSxLQUFLLEdBQVUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2xDLElBQUksS0FBSyxDQUFDLGlCQUFpQixFQUFFO1FBQzNCLElBQU0sV0FBVyxHQUFHLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUV4QywyRUFBMkU7UUFDM0UsZUFBZSxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRS9FLHNFQUFzRTtR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QVMsWUFBWSxDQUFDLFNBQTJCLEVBQUUsTUFBYTtJQUM5RCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUN6QyxJQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFlLENBQUM7UUFDM0MsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO0tBQ3hCO0lBQ0QsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQUVEOztHQUVHO0FBQ0gsU0FBUyxZQUFZLENBQ2pCLFNBQytGLEVBQy9GLEtBQWEsRUFBRSxjQUF1QixFQUFFLFdBQW9CLEVBQzVELENBQVk7SUFDZCxJQUFNLE9BQU8sR0FBRyxJQUFJLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBQzFGLE9BQU8sQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ25CLE9BQU8sQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ3RCLE9BQU8sQ0FBQyxrQkFBa0IsR0FBRyxDQUFDLENBQUM7SUFDL0IsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsV0FBVyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDNUQsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuXG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuLi9kaS9mb3J3YXJkX3JlZic7XG5pbXBvcnQge1Byb3ZpZGVyfSBmcm9tICcuLi9kaS9wcm92aWRlcic7XG5pbXBvcnQge2lzVHlwZVByb3ZpZGVyLCBwcm92aWRlclRvRmFjdG9yeX0gZnJvbSAnLi4vZGkvcjNfaW5qZWN0b3InO1xuXG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLic7XG5pbXBvcnQge2RpUHVibGljSW5JbmplY3RvciwgZ2V0Tm9kZUluamVjdGFibGUsIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZX0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge2RpcmVjdGl2ZUluamVjdH0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtOb2RlSW5qZWN0b3JGYWN0b3J5fSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlUHJvdmlkZXJJbmRleGVzfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0xWaWV3LCBURGF0YSwgVFZJRVcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldExWaWV3LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGV9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtpc0NvbXBvbmVudERlZn0gZnJvbSAnLi91dGlsJztcblxuXG5cbi8qKlxuICogUmVzb2x2ZXMgdGhlIHByb3ZpZGVycyB3aGljaCBhcmUgZGVmaW5lZCBpbiB0aGUgRGlyZWN0aXZlRGVmLlxuICpcbiAqIFdoZW4gaW5zZXJ0aW5nIHRoZSB0b2tlbnMgYW5kIHRoZSBmYWN0b3JpZXMgaW4gdGhlaXIgcmVzcGVjdGl2ZSBhcnJheXMsIHdlIGNhbiBhc3N1bWUgdGhhdFxuICogdGhpcyBtZXRob2QgaXMgY2FsbGVkIGZpcnN0IGZvciB0aGUgY29tcG9uZW50IChpZiBhbnkpLCBhbmQgdGhlbiBmb3Igb3RoZXIgZGlyZWN0aXZlcyBvbiB0aGUgc2FtZVxuICogbm9kZS5cbiAqIEFzIGEgY29uc2VxdWVuY2UsdGhlIHByb3ZpZGVycyBhcmUgYWx3YXlzIHByb2Nlc3NlZCBpbiB0aGF0IG9yZGVyOlxuICogMSkgVGhlIHZpZXcgcHJvdmlkZXJzIG9mIHRoZSBjb21wb25lbnRcbiAqIDIpIFRoZSBwcm92aWRlcnMgb2YgdGhlIGNvbXBvbmVudFxuICogMykgVGhlIHByb3ZpZGVycyBvZiB0aGUgb3RoZXIgZGlyZWN0aXZlc1xuICogVGhpcyBtYXRjaGVzIHRoZSBzdHJ1Y3R1cmUgb2YgdGhlIGluamVjdGFibGVzIGFycmF5cyBvZiBhIHZpZXcgKGZvciBlYWNoIG5vZGUpLlxuICogU28gdGhlIHRva2VucyBhbmQgdGhlIGZhY3RvcmllcyBjYW4gYmUgcHVzaGVkIGF0IHRoZSBlbmQgb2YgdGhlIGFycmF5cywgZXhjZXB0XG4gKiBpbiBvbmUgY2FzZSBmb3IgbXVsdGkgcHJvdmlkZXJzLlxuICpcbiAqIEBwYXJhbSBkZWYgdGhlIGRpcmVjdGl2ZSBkZWZpbml0aW9uXG4gKiBAcGFyYW0gcHJvdmlkZXJzOiBBcnJheSBvZiBgcHJvdmlkZXJzYC5cbiAqIEBwYXJhbSB2aWV3UHJvdmlkZXJzOiBBcnJheSBvZiBgdmlld1Byb3ZpZGVyc2AuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlcnNSZXNvbHZlcjxUPihcbiAgICBkZWY6IERpcmVjdGl2ZURlZjxUPiwgcHJvdmlkZXJzOiBQcm92aWRlcltdLCB2aWV3UHJvdmlkZXJzOiBQcm92aWRlcltdKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXc6IFRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBjb25zdCBpc0NvbXBvbmVudCA9IGlzQ29tcG9uZW50RGVmKGRlZik7XG5cbiAgICAvLyBUaGUgbGlzdCBvZiB2aWV3IHByb3ZpZGVycyBpcyBwcm9jZXNzZWQgZmlyc3QsIGFuZCB0aGUgZmxhZ3MgYXJlIHVwZGF0ZWRcbiAgICByZXNvbHZlUHJvdmlkZXIodmlld1Byb3ZpZGVycywgdFZpZXcuZGF0YSwgdFZpZXcuYmx1ZXByaW50LCBpc0NvbXBvbmVudCwgdHJ1ZSk7XG5cbiAgICAvLyBUaGVuLCB0aGUgbGlzdCBvZiBwcm92aWRlcnMgaXMgcHJvY2Vzc2VkLCBhbmQgdGhlIGZsYWdzIGFyZSB1cGRhdGVkXG4gICAgcmVzb2x2ZVByb3ZpZGVyKHByb3ZpZGVycywgdFZpZXcuZGF0YSwgdFZpZXcuYmx1ZXByaW50LCBpc0NvbXBvbmVudCwgZmFsc2UpO1xuICB9XG59XG5cbi8qKlxuICogUmVzb2x2ZXMgYSBwcm92aWRlciBhbmQgcHVibGlzaGVzIGl0IHRvIHRoZSBESSBzeXN0ZW0uXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmVQcm92aWRlcihcbiAgICBwcm92aWRlcjogUHJvdmlkZXIsIHRJbmplY3RhYmxlczogVERhdGEsIGxJbmplY3RhYmxlc0JsdWVwcmludDogTm9kZUluamVjdG9yRmFjdG9yeVtdLFxuICAgIGlzQ29tcG9uZW50OiBib29sZWFuLCBpc1ZpZXdQcm92aWRlcjogYm9vbGVhbik6IHZvaWQge1xuICBwcm92aWRlciA9IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyKTtcbiAgaWYgKEFycmF5LmlzQXJyYXkocHJvdmlkZXIpKSB7XG4gICAgLy8gUmVjdXJzaXZlbHkgY2FsbCBgcmVzb2x2ZVByb3ZpZGVyYFxuICAgIC8vIFJlY3Vyc2lvbiBpcyBPSyBpbiB0aGlzIGNhc2UgYmVjYXVzZSB0aGlzIGNvZGUgd2lsbCBub3QgYmUgaW4gaG90LXBhdGggb25jZSB3ZSBpbXBsZW1lbnRcbiAgICAvLyBjbG9uaW5nIG9mIHRoZSBpbml0aWFsIHN0YXRlLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvdmlkZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlc29sdmVQcm92aWRlcihcbiAgICAgICAgICBwcm92aWRlcltpXSwgdEluamVjdGFibGVzLCBsSW5qZWN0YWJsZXNCbHVlcHJpbnQsIGlzQ29tcG9uZW50LCBpc1ZpZXdQcm92aWRlcik7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgICBsZXQgdG9rZW46IGFueSA9IGlzVHlwZVByb3ZpZGVyKHByb3ZpZGVyKSA/IHByb3ZpZGVyIDogcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIucHJvdmlkZSk7XG4gICAgbGV0IHByb3ZpZGVyRmFjdG9yeTogKCkgPT4gYW55ID0gcHJvdmlkZXJUb0ZhY3RvcnkocHJvdmlkZXIpO1xuXG4gICAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgICBjb25zdCBiZWdpbkluZGV4ID0gdE5vZGUucHJvdmlkZXJJbmRleGVzICYgVE5vZGVQcm92aWRlckluZGV4ZXMuUHJvdmlkZXJzU3RhcnRJbmRleE1hc2s7XG4gICAgY29uc3QgZW5kSW5kZXggPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgICBjb25zdCBjcHRWaWV3UHJvdmlkZXJzQ291bnQgPVxuICAgICAgICB0Tm9kZS5wcm92aWRlckluZGV4ZXMgPj4gVE5vZGVQcm92aWRlckluZGV4ZXMuQ3B0Vmlld1Byb3ZpZGVyc0NvdW50U2hpZnQ7XG5cbiAgICBpZiAoaXNUeXBlUHJvdmlkZXIocHJvdmlkZXIpIHx8ICFwcm92aWRlci5tdWx0aSkge1xuICAgICAgLy8gU2luZ2xlIHByb3ZpZGVyIGNhc2U6IHRoZSBmYWN0b3J5IGlzIGNyZWF0ZWQgYW5kIHB1c2hlZCBpbW1lZGlhdGVseVxuICAgICAgY29uc3QgZmFjdG9yeSA9XG4gICAgICAgICAgbmV3IE5vZGVJbmplY3RvckZhY3RvcnkocHJvdmlkZXJGYWN0b3J5LCBpc1ZpZXdQcm92aWRlciwgdHJ1ZSwgZGlyZWN0aXZlSW5qZWN0KTtcbiAgICAgIGNvbnN0IGV4aXN0aW5nRmFjdG9yeUluZGV4ID0gaW5kZXhPZihcbiAgICAgICAgICB0b2tlbiwgdEluamVjdGFibGVzLCBpc1ZpZXdQcm92aWRlciA/IGJlZ2luSW5kZXggOiBiZWdpbkluZGV4ICsgY3B0Vmlld1Byb3ZpZGVyc0NvdW50LFxuICAgICAgICAgIGVuZEluZGV4KTtcbiAgICAgIGlmIChleGlzdGluZ0ZhY3RvcnlJbmRleCA9PSAtMSkge1xuICAgICAgICBkaVB1YmxpY0luSW5qZWN0b3IoXG4gICAgICAgICAgICBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoXG4gICAgICAgICAgICAgICAgdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIGxWaWV3KSxcbiAgICAgICAgICAgIGxWaWV3LCB0b2tlbik7XG4gICAgICAgIHRJbmplY3RhYmxlcy5wdXNoKHRva2VuKTtcbiAgICAgICAgdE5vZGUuZGlyZWN0aXZlU3RhcnQrKztcbiAgICAgICAgdE5vZGUuZGlyZWN0aXZlRW5kKys7XG4gICAgICAgIGlmIChpc1ZpZXdQcm92aWRlcikge1xuICAgICAgICAgIHROb2RlLnByb3ZpZGVySW5kZXhlcyArPSBUTm9kZVByb3ZpZGVySW5kZXhlcy5DcHRWaWV3UHJvdmlkZXJzQ291bnRTaGlmdGVyO1xuICAgICAgICB9XG4gICAgICAgIGxJbmplY3RhYmxlc0JsdWVwcmludC5wdXNoKGZhY3RvcnkpO1xuICAgICAgICBsVmlldy5wdXNoKGZhY3RvcnkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbEluamVjdGFibGVzQmx1ZXByaW50W2V4aXN0aW5nRmFjdG9yeUluZGV4XSA9IGZhY3Rvcnk7XG4gICAgICAgIGxWaWV3W2V4aXN0aW5nRmFjdG9yeUluZGV4XSA9IGZhY3Rvcnk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE11bHRpIHByb3ZpZGVyIGNhc2U6XG4gICAgICAvLyBXZSBjcmVhdGUgYSBtdWx0aSBmYWN0b3J5IHdoaWNoIGlzIGdvaW5nIHRvIGFnZ3JlZ2F0ZSBhbGwgdGhlIHZhbHVlcy5cbiAgICAgIC8vIFNpbmNlIHRoZSBvdXRwdXQgb2Ygc3VjaCBhIGZhY3RvcnkgZGVwZW5kcyBvbiBjb250ZW50IG9yIHZpZXcgaW5qZWN0aW9uLFxuICAgICAgLy8gd2UgY3JlYXRlIHR3byBvZiB0aGVtLCB3aGljaCBhcmUgbGlua2VkIHRvZ2V0aGVyLlxuICAgICAgLy9cbiAgICAgIC8vIFRoZSBmaXJzdCBvbmUgKGZvciB2aWV3IHByb3ZpZGVycykgaXMgYWx3YXlzIGluIHRoZSBmaXJzdCBibG9jayBvZiB0aGUgaW5qZWN0YWJsZXMgYXJyYXksXG4gICAgICAvLyBhbmQgdGhlIHNlY29uZCBvbmUgKGZvciBwcm92aWRlcnMpIGlzIGFsd2F5cyBpbiB0aGUgc2Vjb25kIGJsb2NrLlxuICAgICAgLy8gVGhpcyBpcyBpbXBvcnRhbnQgYmVjYXVzZSB2aWV3IHByb3ZpZGVycyBoYXZlIGhpZ2hlciBwcmlvcml0eS4gV2hlbiBhIG11bHRpIHRva2VuXG4gICAgICAvLyBpcyBiZWluZyBsb29rZWQgdXAsIHRoZSB2aWV3IHByb3ZpZGVycyBzaG91bGQgYmUgZm91bmQgZmlyc3QuXG4gICAgICAvLyBOb3RlIHRoYXQgaXQgaXMgbm90IHBvc3NpYmxlIHRvIGhhdmUgYSBtdWx0aSBmYWN0b3J5IGluIHRoZSB0aGlyZCBibG9jayAoZGlyZWN0aXZlIGJsb2NrKS5cbiAgICAgIC8vXG4gICAgICAvLyBUaGUgYWxnb3JpdGhtIHRvIHByb2Nlc3MgbXVsdGkgcHJvdmlkZXJzIGlzIGFzIGZvbGxvd3M6XG4gICAgICAvLyAxKSBJZiB0aGUgbXVsdGkgcHJvdmlkZXIgY29tZXMgZnJvbSB0aGUgYHZpZXdQcm92aWRlcnNgIG9mIHRoZSBjb21wb25lbnQ6XG4gICAgICAvLyAgIGEpIElmIHRoZSBzcGVjaWFsIHZpZXcgcHJvdmlkZXJzIGZhY3RvcnkgZG9lc24ndCBleGlzdCwgaXQgaXMgY3JlYXRlZCBhbmQgcHVzaGVkLlxuICAgICAgLy8gICBiKSBFbHNlLCB0aGUgbXVsdGkgcHJvdmlkZXIgaXMgYWRkZWQgdG8gdGhlIGV4aXN0aW5nIG11bHRpIGZhY3RvcnkuXG4gICAgICAvLyAyKSBJZiB0aGUgbXVsdGkgcHJvdmlkZXIgY29tZXMgZnJvbSB0aGUgYHByb3ZpZGVyc2Agb2YgdGhlIGNvbXBvbmVudCBvciBvZiBhbm90aGVyXG4gICAgICAvLyBkaXJlY3RpdmU6XG4gICAgICAvLyAgIGEpIElmIHRoZSBtdWx0aSBmYWN0b3J5IGRvZXNuJ3QgZXhpc3QsIGl0IGlzIGNyZWF0ZWQgYW5kIHByb3ZpZGVyIHB1c2hlZCBpbnRvIGl0LlxuICAgICAgLy8gICAgICBJdCBpcyBhbHNvIGxpbmtlZCB0byB0aGUgbXVsdGkgZmFjdG9yeSBmb3IgdmlldyBwcm92aWRlcnMsIGlmIGl0IGV4aXN0cy5cbiAgICAgIC8vICAgYikgRWxzZSwgdGhlIG11bHRpIHByb3ZpZGVyIGlzIGFkZGVkIHRvIHRoZSBleGlzdGluZyBtdWx0aSBmYWN0b3J5LlxuXG4gICAgICBjb25zdCBleGlzdGluZ1Byb3ZpZGVyc0ZhY3RvcnlJbmRleCA9XG4gICAgICAgICAgaW5kZXhPZih0b2tlbiwgdEluamVjdGFibGVzLCBiZWdpbkluZGV4ICsgY3B0Vmlld1Byb3ZpZGVyc0NvdW50LCBlbmRJbmRleCk7XG4gICAgICBjb25zdCBleGlzdGluZ1ZpZXdQcm92aWRlcnNGYWN0b3J5SW5kZXggPVxuICAgICAgICAgIGluZGV4T2YodG9rZW4sIHRJbmplY3RhYmxlcywgYmVnaW5JbmRleCwgYmVnaW5JbmRleCArIGNwdFZpZXdQcm92aWRlcnNDb3VudCk7XG4gICAgICBjb25zdCBkb2VzUHJvdmlkZXJzRmFjdG9yeUV4aXN0ID0gZXhpc3RpbmdQcm92aWRlcnNGYWN0b3J5SW5kZXggPj0gMCAmJlxuICAgICAgICAgIGxJbmplY3RhYmxlc0JsdWVwcmludFtleGlzdGluZ1Byb3ZpZGVyc0ZhY3RvcnlJbmRleF07XG4gICAgICBjb25zdCBkb2VzVmlld1Byb3ZpZGVyc0ZhY3RvcnlFeGlzdCA9IGV4aXN0aW5nVmlld1Byb3ZpZGVyc0ZhY3RvcnlJbmRleCA+PSAwICYmXG4gICAgICAgICAgbEluamVjdGFibGVzQmx1ZXByaW50W2V4aXN0aW5nVmlld1Byb3ZpZGVyc0ZhY3RvcnlJbmRleF07XG5cbiAgICAgIGlmIChpc1ZpZXdQcm92aWRlciAmJiAhZG9lc1ZpZXdQcm92aWRlcnNGYWN0b3J5RXhpc3QgfHxcbiAgICAgICAgICAhaXNWaWV3UHJvdmlkZXIgJiYgIWRvZXNQcm92aWRlcnNGYWN0b3J5RXhpc3QpIHtcbiAgICAgICAgLy8gQ2FzZXMgMS5hIGFuZCAyLmFcbiAgICAgICAgZGlQdWJsaWNJbkluamVjdG9yKFxuICAgICAgICAgICAgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKFxuICAgICAgICAgICAgICAgIHROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBsVmlldyksXG4gICAgICAgICAgICBsVmlldywgdG9rZW4pO1xuICAgICAgICBjb25zdCBmYWN0b3J5ID0gbXVsdGlGYWN0b3J5KFxuICAgICAgICAgICAgaXNWaWV3UHJvdmlkZXIgPyBtdWx0aVZpZXdQcm92aWRlcnNGYWN0b3J5UmVzb2x2ZXIgOiBtdWx0aVByb3ZpZGVyc0ZhY3RvcnlSZXNvbHZlcixcbiAgICAgICAgICAgIGxJbmplY3RhYmxlc0JsdWVwcmludC5sZW5ndGgsIGlzVmlld1Byb3ZpZGVyLCBpc0NvbXBvbmVudCwgcHJvdmlkZXJGYWN0b3J5KTtcbiAgICAgICAgaWYgKCFpc1ZpZXdQcm92aWRlciAmJiBkb2VzVmlld1Byb3ZpZGVyc0ZhY3RvcnlFeGlzdCkge1xuICAgICAgICAgIGxJbmplY3RhYmxlc0JsdWVwcmludFtleGlzdGluZ1ZpZXdQcm92aWRlcnNGYWN0b3J5SW5kZXhdLnByb3ZpZGVyRmFjdG9yeSA9IGZhY3Rvcnk7XG4gICAgICAgIH1cbiAgICAgICAgdEluamVjdGFibGVzLnB1c2godG9rZW4pO1xuICAgICAgICB0Tm9kZS5kaXJlY3RpdmVTdGFydCsrO1xuICAgICAgICB0Tm9kZS5kaXJlY3RpdmVFbmQrKztcbiAgICAgICAgaWYgKGlzVmlld1Byb3ZpZGVyKSB7XG4gICAgICAgICAgdE5vZGUucHJvdmlkZXJJbmRleGVzICs9IFROb2RlUHJvdmlkZXJJbmRleGVzLkNwdFZpZXdQcm92aWRlcnNDb3VudFNoaWZ0ZXI7XG4gICAgICAgIH1cbiAgICAgICAgbEluamVjdGFibGVzQmx1ZXByaW50LnB1c2goZmFjdG9yeSk7XG4gICAgICAgIGxWaWV3LnB1c2goZmFjdG9yeSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBDYXNlcyAxLmIgYW5kIDIuYlxuICAgICAgICBtdWx0aUZhY3RvcnlBZGQoXG4gICAgICAgICAgICBsSW5qZWN0YWJsZXNCbHVlcHJpbnQgIVtpc1ZpZXdQcm92aWRlciA/IGV4aXN0aW5nVmlld1Byb3ZpZGVyc0ZhY3RvcnlJbmRleCA6IGV4aXN0aW5nUHJvdmlkZXJzRmFjdG9yeUluZGV4XSxcbiAgICAgICAgICAgIHByb3ZpZGVyRmFjdG9yeSwgIWlzVmlld1Byb3ZpZGVyICYmIGlzQ29tcG9uZW50KTtcbiAgICAgIH1cbiAgICAgIGlmICghaXNWaWV3UHJvdmlkZXIgJiYgaXNDb21wb25lbnQgJiYgZG9lc1ZpZXdQcm92aWRlcnNGYWN0b3J5RXhpc3QpIHtcbiAgICAgICAgbEluamVjdGFibGVzQmx1ZXByaW50W2V4aXN0aW5nVmlld1Byb3ZpZGVyc0ZhY3RvcnlJbmRleF0uY29tcG9uZW50UHJvdmlkZXJzICErKztcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBZGQgYSBmYWN0b3J5IGluIGEgbXVsdGkgZmFjdG9yeS5cbiAqL1xuZnVuY3Rpb24gbXVsdGlGYWN0b3J5QWRkKFxuICAgIG11bHRpRmFjdG9yeTogTm9kZUluamVjdG9yRmFjdG9yeSwgZmFjdG9yeTogKCkgPT4gYW55LCBpc0NvbXBvbmVudFByb3ZpZGVyOiBib29sZWFuKTogdm9pZCB7XG4gIG11bHRpRmFjdG9yeS5tdWx0aSAhLnB1c2goZmFjdG9yeSk7XG4gIGlmIChpc0NvbXBvbmVudFByb3ZpZGVyKSB7XG4gICAgbXVsdGlGYWN0b3J5LmNvbXBvbmVudFByb3ZpZGVycyAhKys7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBpbmRleCBvZiBpdGVtIGluIHRoZSBhcnJheSwgYnV0IG9ubHkgaW4gdGhlIGJlZ2luIHRvIGVuZCByYW5nZS5cbiAqL1xuZnVuY3Rpb24gaW5kZXhPZihpdGVtOiBhbnksIGFycjogYW55W10sIGJlZ2luOiBudW1iZXIsIGVuZDogbnVtYmVyKSB7XG4gIGZvciAobGV0IGkgPSBiZWdpbjsgaSA8IGVuZDsgaSsrKSB7XG4gICAgaWYgKGFycltpXSA9PT0gaXRlbSkgcmV0dXJuIGk7XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIFVzZSB0aGlzIHdpdGggYG11bHRpYCBgcHJvdmlkZXJzYC5cbiAqL1xuZnVuY3Rpb24gbXVsdGlQcm92aWRlcnNGYWN0b3J5UmVzb2x2ZXIoXG4gICAgdGhpczogTm9kZUluamVjdG9yRmFjdG9yeSwgXzogbnVsbCwgdERhdGE6IFREYXRhLCBsRGF0YTogTFZpZXcsIHROb2RlOiBURWxlbWVudE5vZGUpOiBhbnlbXSB7XG4gIHJldHVybiBtdWx0aVJlc29sdmUodGhpcy5tdWx0aSAhLCBbXSk7XG59XG5cbi8qKlxuICogVXNlIHRoaXMgd2l0aCBgbXVsdGlgIGB2aWV3UHJvdmlkZXJzYC5cbiAqXG4gKiBUaGlzIGZhY3Rvcnkga25vd3MgaG93IHRvIGNvbmNhdGVuYXRlIGl0c2VsZiB3aXRoIHRoZSBleGlzdGluZyBgbXVsdGlgIGBwcm92aWRlcnNgLlxuICovXG5mdW5jdGlvbiBtdWx0aVZpZXdQcm92aWRlcnNGYWN0b3J5UmVzb2x2ZXIoXG4gICAgdGhpczogTm9kZUluamVjdG9yRmFjdG9yeSwgXzogbnVsbCwgdERhdGE6IFREYXRhLCBsRGF0YTogTFZpZXcsIHROb2RlOiBURWxlbWVudE5vZGUpOiBhbnlbXSB7XG4gIGNvbnN0IGZhY3RvcmllcyA9IHRoaXMubXVsdGkgITtcbiAgbGV0IHJlc3VsdDogYW55W107XG4gIGlmICh0aGlzLnByb3ZpZGVyRmFjdG9yeSkge1xuICAgIGNvbnN0IGNvbXBvbmVudENvdW50ID0gdGhpcy5wcm92aWRlckZhY3RvcnkuY29tcG9uZW50UHJvdmlkZXJzICE7XG4gICAgY29uc3QgbXVsdGlQcm92aWRlcnMgPSBnZXROb2RlSW5qZWN0YWJsZSh0RGF0YSwgbERhdGEsIHRoaXMucHJvdmlkZXJGYWN0b3J5ICEuaW5kZXggISwgdE5vZGUpO1xuICAgIC8vIENvcHkgdGhlIHNlY3Rpb24gb2YgdGhlIGFycmF5IHdoaWNoIGNvbnRhaW5zIGBtdWx0aWAgYHByb3ZpZGVyc2AgZnJvbSB0aGUgY29tcG9uZW50XG4gICAgcmVzdWx0ID0gbXVsdGlQcm92aWRlcnMuc2xpY2UoMCwgY29tcG9uZW50Q291bnQpO1xuICAgIC8vIEluc2VydCB0aGUgYHZpZXdQcm92aWRlcmAgaW5zdGFuY2VzLlxuICAgIG11bHRpUmVzb2x2ZShmYWN0b3JpZXMsIHJlc3VsdCk7XG4gICAgLy8gQ29weSB0aGUgc2VjdGlvbiBvZiB0aGUgYXJyYXkgd2hpY2ggY29udGFpbnMgYG11bHRpYCBgcHJvdmlkZXJzYCBmcm9tIG90aGVyIGRpcmVjdGl2ZXNcbiAgICBmb3IgKGxldCBpID0gY29tcG9uZW50Q291bnQ7IGkgPCBtdWx0aVByb3ZpZGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgcmVzdWx0LnB1c2gobXVsdGlQcm92aWRlcnNbaV0pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXN1bHQgPSBbXTtcbiAgICAvLyBJbnNlcnQgdGhlIGB2aWV3UHJvdmlkZXJgIGluc3RhbmNlcy5cbiAgICBtdWx0aVJlc29sdmUoZmFjdG9yaWVzLCByZXN1bHQpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogTWFwcyBhbiBhcnJheSBvZiBmYWN0b3JpZXMgaW50byBhbiBhcnJheSBvZiB2YWx1ZXMuXG4gKi9cbmZ1bmN0aW9uIG11bHRpUmVzb2x2ZShmYWN0b3JpZXM6IEFycmF5PCgpID0+IGFueT4sIHJlc3VsdDogYW55W10pOiBhbnlbXSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZmFjdG9yaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgZmFjdG9yeSA9IGZhY3Rvcmllc1tpXSAhYXMoKSA9PiBudWxsO1xuICAgIHJlc3VsdC5wdXNoKGZhY3RvcnkoKSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbXVsdGkgZmFjdG9yeS5cbiAqL1xuZnVuY3Rpb24gbXVsdGlGYWN0b3J5KFxuICAgIGZhY3RvcnlGbjogKFxuICAgICAgICB0aGlzOiBOb2RlSW5qZWN0b3JGYWN0b3J5LCBfOiBudWxsLCB0RGF0YTogVERhdGEsIGxEYXRhOiBMVmlldywgdE5vZGU6IFRFbGVtZW50Tm9kZSkgPT4gYW55LFxuICAgIGluZGV4OiBudW1iZXIsIGlzVmlld1Byb3ZpZGVyOiBib29sZWFuLCBpc0NvbXBvbmVudDogYm9vbGVhbixcbiAgICBmOiAoKSA9PiBhbnkpOiBOb2RlSW5qZWN0b3JGYWN0b3J5IHtcbiAgY29uc3QgZmFjdG9yeSA9IG5ldyBOb2RlSW5qZWN0b3JGYWN0b3J5KGZhY3RvcnlGbiwgaXNWaWV3UHJvdmlkZXIsIHRydWUsIGRpcmVjdGl2ZUluamVjdCk7XG4gIGZhY3RvcnkubXVsdGkgPSBbXTtcbiAgZmFjdG9yeS5pbmRleCA9IGluZGV4O1xuICBmYWN0b3J5LmNvbXBvbmVudFByb3ZpZGVycyA9IDA7XG4gIG11bHRpRmFjdG9yeUFkZChmYWN0b3J5LCBmLCBpc0NvbXBvbmVudCAmJiAhaXNWaWV3UHJvdmlkZXIpO1xuICByZXR1cm4gZmFjdG9yeTtcbn1cbiJdfQ==