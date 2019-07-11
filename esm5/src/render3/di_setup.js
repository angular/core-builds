/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { resolveForwardRef } from '../di/forward_ref';
import { isClassProvider, isTypeProvider, providerToFactory } from '../di/r3_injector';
import { diPublicInInjector, getNodeInjectable, getOrCreateNodeInjectorForNode } from './di';
import { ɵɵdirectiveInject } from './instructions/all';
import { NodeInjectorFactory } from './interfaces/injector';
import { TVIEW } from './interfaces/view';
import { getLView, getPreviousOrParentTNode } from './state';
import { isComponentDef } from './util/view_utils';
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
        var tView = lView[TVIEW];
        var token = isTypeProvider(provider) ? provider : resolveForwardRef(provider.provide);
        var providerFactory = providerToFactory(provider);
        var tNode = getPreviousOrParentTNode();
        var beginIndex = tNode.providerIndexes & 65535 /* ProvidersStartIndexMask */;
        var endIndex = tNode.directiveStart;
        var cptViewProvidersCount = tNode.providerIndexes >> 16 /* CptViewProvidersCountShift */;
        if (isClassProvider(provider) || isTypeProvider(provider)) {
            var prototype = (provider.useClass || provider).prototype;
            var ngOnDestroy = prototype.ngOnDestroy;
            if (ngOnDestroy) {
                (tView.destroyHooks || (tView.destroyHooks = [])).push(tInjectables.length, ngOnDestroy);
            }
        }
        if (isTypeProvider(provider) || !provider.multi) {
            // Single provider case: the factory is created and pushed immediately
            var factory = new NodeInjectorFactory(providerFactory, isViewProvider, ɵɵdirectiveInject);
            var existingFactoryIndex = indexOf(token, tInjectables, isViewProvider ? beginIndex : beginIndex + cptViewProvidersCount, endIndex);
            if (existingFactoryIndex == -1) {
                diPublicInInjector(getOrCreateNodeInjectorForNode(tNode, lView), tView, token);
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
                diPublicInInjector(getOrCreateNodeInjectorForNode(tNode, lView), tView, token);
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
    var factory = new NodeInjectorFactory(factoryFn, isViewProvider, ɵɵdirectiveInject);
    factory.multi = [];
    factory.index = index;
    factory.componentProviders = 0;
    multiFactoryAdd(factory, f, isComponent && !isViewProvider);
    return factory;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlfc2V0dXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpX3NldHVwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRXBELE9BQU8sRUFBQyxlQUFlLEVBQUUsY0FBYyxFQUFFLGlCQUFpQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFckYsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLDhCQUE4QixFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQzNGLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRXJELE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRTFELE9BQU8sRUFBZSxLQUFLLEVBQVEsTUFBTSxtQkFBbUIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsUUFBUSxFQUFFLHdCQUF3QixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQzNELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUlqRDs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFDSCxNQUFNLFVBQVUsaUJBQWlCLENBQzdCLEdBQW9CLEVBQUUsU0FBcUIsRUFBRSxhQUF5QjtJQUN4RSxJQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixJQUFNLEtBQUssR0FBVSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEMsSUFBSSxLQUFLLENBQUMsaUJBQWlCLEVBQUU7UUFDM0IsSUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXhDLDJFQUEyRTtRQUMzRSxlQUFlLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxX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QyxDQUFDO0lBQy9CLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLFdBQVcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQzVELE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cblxuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi4vZGkvZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtDbGFzc1Byb3ZpZGVyLCBQcm92aWRlcn0gZnJvbSAnLi4vZGkvaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7aXNDbGFzc1Byb3ZpZGVyLCBpc1R5cGVQcm92aWRlciwgcHJvdmlkZXJUb0ZhY3Rvcnl9IGZyb20gJy4uL2RpL3IzX2luamVjdG9yJztcblxuaW1wb3J0IHtkaVB1YmxpY0luSW5qZWN0b3IsIGdldE5vZGVJbmplY3RhYmxlLCBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGV9IGZyb20gJy4vZGknO1xuaW1wb3J0IHvJtcm1ZGlyZWN0aXZlSW5qZWN0fSBmcm9tICcuL2luc3RydWN0aW9ucy9hbGwnO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWZ9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7Tm9kZUluamVjdG9yRmFjdG9yeX0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZVByb3ZpZGVySW5kZXhlc30gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtMVmlldywgVERhdGEsIFRWSUVXLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRMVmlldywgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlfSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7aXNDb21wb25lbnREZWZ9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcblxuXG5cbi8qKlxuICogUmVzb2x2ZXMgdGhlIHByb3ZpZGVycyB3aGljaCBhcmUgZGVmaW5lZCBpbiB0aGUgRGlyZWN0aXZlRGVmLlxuICpcbiAqIFdoZW4gaW5zZXJ0aW5nIHRoZSB0b2tlbnMgYW5kIHRoZSBmYWN0b3JpZXMgaW4gdGhlaXIgcmVzcGVjdGl2ZSBhcnJheXMsIHdlIGNhbiBhc3N1bWUgdGhhdFxuICogdGhpcyBtZXRob2QgaXMgY2FsbGVkIGZpcnN0IGZvciB0aGUgY29tcG9uZW50IChpZiBhbnkpLCBhbmQgdGhlbiBmb3Igb3RoZXIgZGlyZWN0aXZlcyBvbiB0aGUgc2FtZVxuICogbm9kZS5cbiAqIEFzIGEgY29uc2VxdWVuY2UsdGhlIHByb3ZpZGVycyBhcmUgYWx3YXlzIHByb2Nlc3NlZCBpbiB0aGF0IG9yZGVyOlxuICogMSkgVGhlIHZpZXcgcHJvdmlkZXJzIG9mIHRoZSBjb21wb25lbnRcbiAqIDIpIFRoZSBwcm92aWRlcnMgb2YgdGhlIGNvbXBvbmVudFxuICogMykgVGhlIHByb3ZpZGVycyBvZiB0aGUgb3RoZXIgZGlyZWN0aXZlc1xuICogVGhpcyBtYXRjaGVzIHRoZSBzdHJ1Y3R1cmUgb2YgdGhlIGluamVjdGFibGVzIGFycmF5cyBvZiBhIHZpZXcgKGZvciBlYWNoIG5vZGUpLlxuICogU28gdGhlIHRva2VucyBhbmQgdGhlIGZhY3RvcmllcyBjYW4gYmUgcHVzaGVkIGF0IHRoZSBlbmQgb2YgdGhlIGFycmF5cywgZXhjZXB0XG4gKiBpbiBvbmUgY2FzZSBmb3IgbXVsdGkgcHJvdmlkZXJzLlxuICpcbiAqIEBwYXJhbSBkZWYgdGhlIGRpcmVjdGl2ZSBkZWZpbml0aW9uXG4gKiBAcGFyYW0gcHJvdmlkZXJzOiBBcnJheSBvZiBgcHJvdmlkZXJzYC5cbiAqIEBwYXJhbSB2aWV3UHJvdmlkZXJzOiBBcnJheSBvZiBgdmlld1Byb3ZpZGVyc2AuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlcnNSZXNvbHZlcjxUPihcbiAgICBkZWY6IERpcmVjdGl2ZURlZjxUPiwgcHJvdmlkZXJzOiBQcm92aWRlcltdLCB2aWV3UHJvdmlkZXJzOiBQcm92aWRlcltdKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXc6IFRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBjb25zdCBpc0NvbXBvbmVudCA9IGlzQ29tcG9uZW50RGVmKGRlZik7XG5cbiAgICAvLyBUaGUgbGlzdCBvZiB2aWV3IHByb3ZpZGVycyBpcyBwcm9jZXNzZWQgZmlyc3QsIGFuZCB0aGUgZmxhZ3MgYXJlIHVwZGF0ZWRcbiAgICByZXNvbHZlUHJvdmlkZXIodmlld1Byb3ZpZGVycywgdFZpZXcuZGF0YSwgdFZpZXcuYmx1ZXByaW50LCBpc0NvbXBvbmVudCwgdHJ1ZSk7XG5cbiAgICAvLyBUaGVuLCB0aGUgbGlzdCBvZiBwcm92aWRlcnMgaXMgcHJvY2Vzc2VkLCBhbmQgdGhlIGZsYWdzIGFyZSB1cGRhdGVkXG4gICAgcmVzb2x2ZVByb3ZpZGVyKHByb3ZpZGVycywgdFZpZXcuZGF0YSwgdFZpZXcuYmx1ZXByaW50LCBpc0NvbXBvbmVudCwgZmFsc2UpO1xuICB9XG59XG5cbi8qKlxuICogUmVzb2x2ZXMgYSBwcm92aWRlciBhbmQgcHVibGlzaGVzIGl0IHRvIHRoZSBESSBzeXN0ZW0uXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmVQcm92aWRlcihcbiAgICBwcm92aWRlcjogUHJvdmlkZXIsIHRJbmplY3RhYmxlczogVERhdGEsIGxJbmplY3RhYmxlc0JsdWVwcmludDogTm9kZUluamVjdG9yRmFjdG9yeVtdLFxuICAgIGlzQ29tcG9uZW50OiBib29sZWFuLCBpc1ZpZXdQcm92aWRlcjogYm9vbGVhbik6IHZvaWQge1xuICBwcm92aWRlciA9IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyKTtcbiAgaWYgKEFycmF5LmlzQXJyYXkocHJvdmlkZXIpKSB7XG4gICAgLy8gUmVjdXJzaXZlbHkgY2FsbCBgcmVzb2x2ZVByb3ZpZGVyYFxuICAgIC8vIFJlY3Vyc2lvbiBpcyBPSyBpbiB0aGlzIGNhc2UgYmVjYXVzZSB0aGlzIGNvZGUgd2lsbCBub3QgYmUgaW4gaG90LXBhdGggb25jZSB3ZSBpbXBsZW1lbnRcbiAgICAvLyBjbG9uaW5nIG9mIHRoZSBpbml0aWFsIHN0YXRlLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvdmlkZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlc29sdmVQcm92aWRlcihcbiAgICAgICAgICBwcm92aWRlcltpXSwgdEluamVjdGFibGVzLCBsSW5qZWN0YWJsZXNCbHVlcHJpbnQsIGlzQ29tcG9uZW50LCBpc1ZpZXdQcm92aWRlcik7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgICBsZXQgdG9rZW46IGFueSA9IGlzVHlwZVByb3ZpZGVyKHByb3ZpZGVyKSA/IHByb3ZpZGVyIDogcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIucHJvdmlkZSk7XG4gICAgbGV0IHByb3ZpZGVyRmFjdG9yeTogKCkgPT4gYW55ID0gcHJvdmlkZXJUb0ZhY3RvcnkocHJvdmlkZXIpO1xuXG4gICAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgICBjb25zdCBiZWdpbkluZGV4ID0gdE5vZGUucHJvdmlkZXJJbmRleGVzICYgVE5vZGVQcm92aWRlckluZGV4ZXMuUHJvdmlkZXJzU3RhcnRJbmRleE1hc2s7XG4gICAgY29uc3QgZW5kSW5kZXggPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgICBjb25zdCBjcHRWaWV3UHJvdmlkZXJzQ291bnQgPVxuICAgICAgICB0Tm9kZS5wcm92aWRlckluZGV4ZXMgPj4gVE5vZGVQcm92aWRlckluZGV4ZXMuQ3B0Vmlld1Byb3ZpZGVyc0NvdW50U2hpZnQ7XG5cbiAgICBpZiAoaXNDbGFzc1Byb3ZpZGVyKHByb3ZpZGVyKSB8fCBpc1R5cGVQcm92aWRlcihwcm92aWRlcikpIHtcbiAgICAgIGNvbnN0IHByb3RvdHlwZSA9ICgocHJvdmlkZXIgYXMgQ2xhc3NQcm92aWRlcikudXNlQ2xhc3MgfHwgcHJvdmlkZXIpLnByb3RvdHlwZTtcbiAgICAgIGNvbnN0IG5nT25EZXN0cm95ID0gcHJvdG90eXBlLm5nT25EZXN0cm95O1xuXG4gICAgICBpZiAobmdPbkRlc3Ryb3kpIHtcbiAgICAgICAgKHRWaWV3LmRlc3Ryb3lIb29rcyB8fCAodFZpZXcuZGVzdHJveUhvb2tzID0gW10pKS5wdXNoKHRJbmplY3RhYmxlcy5sZW5ndGgsIG5nT25EZXN0cm95KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaXNUeXBlUHJvdmlkZXIocHJvdmlkZXIpIHx8ICFwcm92aWRlci5tdWx0aSkge1xuICAgICAgLy8gU2luZ2xlIHByb3ZpZGVyIGNhc2U6IHRoZSBmYWN0b3J5IGlzIGNyZWF0ZWQgYW5kIHB1c2hlZCBpbW1lZGlhdGVseVxuICAgICAgY29uc3QgZmFjdG9yeSA9IG5ldyBOb2RlSW5qZWN0b3JGYWN0b3J5KHByb3ZpZGVyRmFjdG9yeSwgaXNWaWV3UHJvdmlkZXIsIMm1ybVkaXJlY3RpdmVJbmplY3QpO1xuICAgICAgY29uc3QgZXhpc3RpbmdGYWN0b3J5SW5kZXggPSBpbmRleE9mKFxuICAgICAgICAgIHRva2VuLCB0SW5qZWN0YWJsZXMsIGlzVmlld1Byb3ZpZGVyID8gYmVnaW5JbmRleCA6IGJlZ2luSW5kZXggKyBjcHRWaWV3UHJvdmlkZXJzQ291bnQsXG4gICAgICAgICAgZW5kSW5kZXgpO1xuICAgICAgaWYgKGV4aXN0aW5nRmFjdG9yeUluZGV4ID09IC0xKSB7XG4gICAgICAgIGRpUHVibGljSW5JbmplY3RvcihcbiAgICAgICAgICAgIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShcbiAgICAgICAgICAgICAgICB0Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgbFZpZXcpLFxuICAgICAgICAgICAgdFZpZXcsIHRva2VuKTtcbiAgICAgICAgdEluamVjdGFibGVzLnB1c2godG9rZW4pO1xuICAgICAgICB0Tm9kZS5kaXJlY3RpdmVTdGFydCsrO1xuICAgICAgICB0Tm9kZS5kaXJlY3RpdmVFbmQrKztcbiAgICAgICAgaWYgKGlzVmlld1Byb3ZpZGVyKSB7XG4gICAgICAgICAgdE5vZGUucHJvdmlkZXJJbmRleGVzICs9IFROb2RlUHJvdmlkZXJJbmRleGVzLkNwdFZpZXdQcm92aWRlcnNDb3VudFNoaWZ0ZXI7XG4gICAgICAgIH1cbiAgICAgICAgbEluamVjdGFibGVzQmx1ZXByaW50LnB1c2goZmFjdG9yeSk7XG4gICAgICAgIGxWaWV3LnB1c2goZmFjdG9yeSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsSW5qZWN0YWJsZXNCbHVlcHJpbnRbZXhpc3RpbmdGYWN0b3J5SW5kZXhdID0gZmFjdG9yeTtcbiAgICAgICAgbFZpZXdbZXhpc3RpbmdGYWN0b3J5SW5kZXhdID0gZmFjdG9yeTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTXVsdGkgcHJvdmlkZXIgY2FzZTpcbiAgICAgIC8vIFdlIGNyZWF0ZSBhIG11bHRpIGZhY3Rvcnkgd2hpY2ggaXMgZ29pbmcgdG8gYWdncmVnYXRlIGFsbCB0aGUgdmFsdWVzLlxuICAgICAgLy8gU2luY2UgdGhlIG91dHB1dCBvZiBzdWNoIGEgZmFjdG9yeSBkZXBlbmRzIG9uIGNvbnRlbnQgb3IgdmlldyBpbmplY3Rpb24sXG4gICAgICAvLyB3ZSBjcmVhdGUgdHdvIG9mIHRoZW0sIHdoaWNoIGFyZSBsaW5rZWQgdG9nZXRoZXIuXG4gICAgICAvL1xuICAgICAgLy8gVGhlIGZpcnN0IG9uZSAoZm9yIHZpZXcgcHJvdmlkZXJzKSBpcyBhbHdheXMgaW4gdGhlIGZpcnN0IGJsb2NrIG9mIHRoZSBpbmplY3RhYmxlcyBhcnJheSxcbiAgICAgIC8vIGFuZCB0aGUgc2Vjb25kIG9uZSAoZm9yIHByb3ZpZGVycykgaXMgYWx3YXlzIGluIHRoZSBzZWNvbmQgYmxvY2suXG4gICAgICAvLyBUaGlzIGlzIGltcG9ydGFudCBiZWNhdXNlIHZpZXcgcHJvdmlkZXJzIGhhdmUgaGlnaGVyIHByaW9yaXR5LiBXaGVuIGEgbXVsdGkgdG9rZW5cbiAgICAgIC8vIGlzIGJlaW5nIGxvb2tlZCB1cCwgdGhlIHZpZXcgcHJvdmlkZXJzIHNob3VsZCBiZSBmb3VuZCBmaXJzdC5cbiAgICAgIC8vIE5vdGUgdGhhdCBpdCBpcyBub3QgcG9zc2libGUgdG8gaGF2ZSBhIG11bHRpIGZhY3RvcnkgaW4gdGhlIHRoaXJkIGJsb2NrIChkaXJlY3RpdmUgYmxvY2spLlxuICAgICAgLy9cbiAgICAgIC8vIFRoZSBhbGdvcml0aG0gdG8gcHJvY2VzcyBtdWx0aSBwcm92aWRlcnMgaXMgYXMgZm9sbG93czpcbiAgICAgIC8vIDEpIElmIHRoZSBtdWx0aSBwcm92aWRlciBjb21lcyBmcm9tIHRoZSBgdmlld1Byb3ZpZGVyc2Agb2YgdGhlIGNvbXBvbmVudDpcbiAgICAgIC8vICAgYSkgSWYgdGhlIHNwZWNpYWwgdmlldyBwcm92aWRlcnMgZmFjdG9yeSBkb2Vzbid0IGV4aXN0LCBpdCBpcyBjcmVhdGVkIGFuZCBwdXNoZWQuXG4gICAgICAvLyAgIGIpIEVsc2UsIHRoZSBtdWx0aSBwcm92aWRlciBpcyBhZGRlZCB0byB0aGUgZXhpc3RpbmcgbXVsdGkgZmFjdG9yeS5cbiAgICAgIC8vIDIpIElmIHRoZSBtdWx0aSBwcm92aWRlciBjb21lcyBmcm9tIHRoZSBgcHJvdmlkZXJzYCBvZiB0aGUgY29tcG9uZW50IG9yIG9mIGFub3RoZXJcbiAgICAgIC8vIGRpcmVjdGl2ZTpcbiAgICAgIC8vICAgYSkgSWYgdGhlIG11bHRpIGZhY3RvcnkgZG9lc24ndCBleGlzdCwgaXQgaXMgY3JlYXRlZCBhbmQgcHJvdmlkZXIgcHVzaGVkIGludG8gaXQuXG4gICAgICAvLyAgICAgIEl0IGlzIGFsc28gbGlua2VkIHRvIHRoZSBtdWx0aSBmYWN0b3J5IGZvciB2aWV3IHByb3ZpZGVycywgaWYgaXQgZXhpc3RzLlxuICAgICAgLy8gICBiKSBFbHNlLCB0aGUgbXVsdGkgcHJvdmlkZXIgaXMgYWRkZWQgdG8gdGhlIGV4aXN0aW5nIG11bHRpIGZhY3RvcnkuXG5cbiAgICAgIGNvbnN0IGV4aXN0aW5nUHJvdmlkZXJzRmFjdG9yeUluZGV4ID1cbiAgICAgICAgICBpbmRleE9mKHRva2VuLCB0SW5qZWN0YWJsZXMsIGJlZ2luSW5kZXggKyBjcHRWaWV3UHJvdmlkZXJzQ291bnQsIGVuZEluZGV4KTtcbiAgICAgIGNvbnN0IGV4aXN0aW5nVmlld1Byb3ZpZGVyc0ZhY3RvcnlJbmRleCA9XG4gICAgICAgICAgaW5kZXhPZih0b2tlbiwgdEluamVjdGFibGVzLCBiZWdpbkluZGV4LCBiZWdpbkluZGV4ICsgY3B0Vmlld1Byb3ZpZGVyc0NvdW50KTtcbiAgICAgIGNvbnN0IGRvZXNQcm92aWRlcnNGYWN0b3J5RXhpc3QgPSBleGlzdGluZ1Byb3ZpZGVyc0ZhY3RvcnlJbmRleCA+PSAwICYmXG4gICAgICAgICAgbEluamVjdGFibGVzQmx1ZXByaW50W2V4aXN0aW5nUHJvdmlkZXJzRmFjdG9yeUluZGV4XTtcbiAgICAgIGNvbnN0IGRvZXNWaWV3UHJvdmlkZXJzRmFjdG9yeUV4aXN0ID0gZXhpc3RpbmdWaWV3UHJvdmlkZXJzRmFjdG9yeUluZGV4ID49IDAgJiZcbiAgICAgICAgICBsSW5qZWN0YWJsZXNCbHVlcHJpbnRbZXhpc3RpbmdWaWV3UHJvdmlkZXJzRmFjdG9yeUluZGV4XTtcblxuICAgICAgaWYgKGlzVmlld1Byb3ZpZGVyICYmICFkb2VzVmlld1Byb3ZpZGVyc0ZhY3RvcnlFeGlzdCB8fFxuICAgICAgICAgICFpc1ZpZXdQcm92aWRlciAmJiAhZG9lc1Byb3ZpZGVyc0ZhY3RvcnlFeGlzdCkge1xuICAgICAgICAvLyBDYXNlcyAxLmEgYW5kIDIuYVxuICAgICAgICBkaVB1YmxpY0luSW5qZWN0b3IoXG4gICAgICAgICAgICBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoXG4gICAgICAgICAgICAgICAgdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIGxWaWV3KSxcbiAgICAgICAgICAgIHRWaWV3LCB0b2tlbik7XG4gICAgICAgIGNvbnN0IGZhY3RvcnkgPSBtdWx0aUZhY3RvcnkoXG4gICAgICAgICAgICBpc1ZpZXdQcm92aWRlciA/IG11bHRpVmlld1Byb3ZpZGVyc0ZhY3RvcnlSZXNvbHZlciA6IG11bHRpUHJvdmlkZXJzRmFjdG9yeVJlc29sdmVyLFxuICAgICAgICAgICAgbEluamVjdGFibGVzQmx1ZXByaW50Lmxlbmd0aCwgaXNWaWV3UHJvdmlkZXIsIGlzQ29tcG9uZW50LCBwcm92aWRlckZhY3RvcnkpO1xuICAgICAgICBpZiAoIWlzVmlld1Byb3ZpZGVyICYmIGRvZXNWaWV3UHJvdmlkZXJzRmFjdG9yeUV4aXN0KSB7XG4gICAgICAgICAgbEluamVjdGFibGVzQmx1ZXByaW50W2V4aXN0aW5nVmlld1Byb3ZpZGVyc0ZhY3RvcnlJbmRleF0ucHJvdmlkZXJGYWN0b3J5ID0gZmFjdG9yeTtcbiAgICAgICAgfVxuICAgICAgICB0SW5qZWN0YWJsZXMucHVzaCh0b2tlbik7XG4gICAgICAgIHROb2RlLmRpcmVjdGl2ZVN0YXJ0Kys7XG4gICAgICAgIHROb2RlLmRpcmVjdGl2ZUVuZCsrO1xuICAgICAgICBpZiAoaXNWaWV3UHJvdmlkZXIpIHtcbiAgICAgICAgICB0Tm9kZS5wcm92aWRlckluZGV4ZXMgKz0gVE5vZGVQcm92aWRlckluZGV4ZXMuQ3B0Vmlld1Byb3ZpZGVyc0NvdW50U2hpZnRlcjtcbiAgICAgICAgfVxuICAgICAgICBsSW5qZWN0YWJsZXNCbHVlcHJpbnQucHVzaChmYWN0b3J5KTtcbiAgICAgICAgbFZpZXcucHVzaChmYWN0b3J5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIENhc2VzIDEuYiBhbmQgMi5iXG4gICAgICAgIG11bHRpRmFjdG9yeUFkZChcbiAgICAgICAgICAgIGxJbmplY3RhYmxlc0JsdWVwcmludCAhW2lzVmlld1Byb3ZpZGVyID8gZXhpc3RpbmdWaWV3UHJvdmlkZXJzRmFjdG9yeUluZGV4IDogZXhpc3RpbmdQcm92aWRlcnNGYWN0b3J5SW5kZXhdLFxuICAgICAgICAgICAgcHJvdmlkZXJGYWN0b3J5LCAhaXNWaWV3UHJvdmlkZXIgJiYgaXNDb21wb25lbnQpO1xuICAgICAgfVxuICAgICAgaWYgKCFpc1ZpZXdQcm92aWRlciAmJiBpc0NvbXBvbmVudCAmJiBkb2VzVmlld1Byb3ZpZGVyc0ZhY3RvcnlFeGlzdCkge1xuICAgICAgICBsSW5qZWN0YWJsZXNCbHVlcHJpbnRbZXhpc3RpbmdWaWV3UHJvdmlkZXJzRmFjdG9yeUluZGV4XS5jb21wb25lbnRQcm92aWRlcnMgISsrO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFkZCBhIGZhY3RvcnkgaW4gYSBtdWx0aSBmYWN0b3J5LlxuICovXG5mdW5jdGlvbiBtdWx0aUZhY3RvcnlBZGQoXG4gICAgbXVsdGlGYWN0b3J5OiBOb2RlSW5qZWN0b3JGYWN0b3J5LCBmYWN0b3J5OiAoKSA9PiBhbnksIGlzQ29tcG9uZW50UHJvdmlkZXI6IGJvb2xlYW4pOiB2b2lkIHtcbiAgbXVsdGlGYWN0b3J5Lm11bHRpICEucHVzaChmYWN0b3J5KTtcbiAgaWYgKGlzQ29tcG9uZW50UHJvdmlkZXIpIHtcbiAgICBtdWx0aUZhY3RvcnkuY29tcG9uZW50UHJvdmlkZXJzICErKztcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGluZGV4IG9mIGl0ZW0gaW4gdGhlIGFycmF5LCBidXQgb25seSBpbiB0aGUgYmVnaW4gdG8gZW5kIHJhbmdlLlxuICovXG5mdW5jdGlvbiBpbmRleE9mKGl0ZW06IGFueSwgYXJyOiBhbnlbXSwgYmVnaW46IG51bWJlciwgZW5kOiBudW1iZXIpIHtcbiAgZm9yIChsZXQgaSA9IGJlZ2luOyBpIDwgZW5kOyBpKyspIHtcbiAgICBpZiAoYXJyW2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuICogVXNlIHRoaXMgd2l0aCBgbXVsdGlgIGBwcm92aWRlcnNgLlxuICovXG5mdW5jdGlvbiBtdWx0aVByb3ZpZGVyc0ZhY3RvcnlSZXNvbHZlcihcbiAgICB0aGlzOiBOb2RlSW5qZWN0b3JGYWN0b3J5LCBfOiBudWxsLCB0RGF0YTogVERhdGEsIGxEYXRhOiBMVmlldywgdE5vZGU6IFRFbGVtZW50Tm9kZSk6IGFueVtdIHtcbiAgcmV0dXJuIG11bHRpUmVzb2x2ZSh0aGlzLm11bHRpICEsIFtdKTtcbn1cblxuLyoqXG4gKiBVc2UgdGhpcyB3aXRoIGBtdWx0aWAgYHZpZXdQcm92aWRlcnNgLlxuICpcbiAqIFRoaXMgZmFjdG9yeSBrbm93cyBob3cgdG8gY29uY2F0ZW5hdGUgaXRzZWxmIHdpdGggdGhlIGV4aXN0aW5nIGBtdWx0aWAgYHByb3ZpZGVyc2AuXG4gKi9cbmZ1bmN0aW9uIG11bHRpVmlld1Byb3ZpZGVyc0ZhY3RvcnlSZXNvbHZlcihcbiAgICB0aGlzOiBOb2RlSW5qZWN0b3JGYWN0b3J5LCBfOiBudWxsLCB0RGF0YTogVERhdGEsIGxEYXRhOiBMVmlldywgdE5vZGU6IFRFbGVtZW50Tm9kZSk6IGFueVtdIHtcbiAgY29uc3QgZmFjdG9yaWVzID0gdGhpcy5tdWx0aSAhO1xuICBsZXQgcmVzdWx0OiBhbnlbXTtcbiAgaWYgKHRoaXMucHJvdmlkZXJGYWN0b3J5KSB7XG4gICAgY29uc3QgY29tcG9uZW50Q291bnQgPSB0aGlzLnByb3ZpZGVyRmFjdG9yeS5jb21wb25lbnRQcm92aWRlcnMgITtcbiAgICBjb25zdCBtdWx0aVByb3ZpZGVycyA9IGdldE5vZGVJbmplY3RhYmxlKHREYXRhLCBsRGF0YSwgdGhpcy5wcm92aWRlckZhY3RvcnkgIS5pbmRleCAhLCB0Tm9kZSk7XG4gICAgLy8gQ29weSB0aGUgc2VjdGlvbiBvZiB0aGUgYXJyYXkgd2hpY2ggY29udGFpbnMgYG11bHRpYCBgcHJvdmlkZXJzYCBmcm9tIHRoZSBjb21wb25lbnRcbiAgICByZXN1bHQgPSBtdWx0aVByb3ZpZGVycy5zbGljZSgwLCBjb21wb25lbnRDb3VudCk7XG4gICAgLy8gSW5zZXJ0IHRoZSBgdmlld1Byb3ZpZGVyYCBpbnN0YW5jZXMuXG4gICAgbXVsdGlSZXNvbHZlKGZhY3RvcmllcywgcmVzdWx0KTtcbiAgICAvLyBDb3B5IHRoZSBzZWN0aW9uIG9mIHRoZSBhcnJheSB3aGljaCBjb250YWlucyBgbXVsdGlgIGBwcm92aWRlcnNgIGZyb20gb3RoZXIgZGlyZWN0aXZlc1xuICAgIGZvciAobGV0IGkgPSBjb21wb25lbnRDb3VudDsgaSA8IG11bHRpUHJvdmlkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICByZXN1bHQucHVzaChtdWx0aVByb3ZpZGVyc1tpXSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJlc3VsdCA9IFtdO1xuICAgIC8vIEluc2VydCB0aGUgYHZpZXdQcm92aWRlcmAgaW5zdGFuY2VzLlxuICAgIG11bHRpUmVzb2x2ZShmYWN0b3JpZXMsIHJlc3VsdCk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBNYXBzIGFuIGFycmF5IG9mIGZhY3RvcmllcyBpbnRvIGFuIGFycmF5IG9mIHZhbHVlcy5cbiAqL1xuZnVuY3Rpb24gbXVsdGlSZXNvbHZlKGZhY3RvcmllczogQXJyYXk8KCkgPT4gYW55PiwgcmVzdWx0OiBhbnlbXSk6IGFueVtdIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBmYWN0b3JpZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBmYWN0b3J5ID0gZmFjdG9yaWVzW2ldICFhcygpID0+IG51bGw7XG4gICAgcmVzdWx0LnB1c2goZmFjdG9yeSgpKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBtdWx0aSBmYWN0b3J5LlxuICovXG5mdW5jdGlvbiBtdWx0aUZhY3RvcnkoXG4gICAgZmFjdG9yeUZuOiAoXG4gICAgICAgIHRoaXM6IE5vZGVJbmplY3RvckZhY3RvcnksIF86IG51bGwsIHREYXRhOiBURGF0YSwgbERhdGE6IExWaWV3LCB0Tm9kZTogVEVsZW1lbnROb2RlKSA9PiBhbnksXG4gICAgaW5kZXg6IG51bWJlciwgaXNWaWV3UHJvdmlkZXI6IGJvb2xlYW4sIGlzQ29tcG9uZW50OiBib29sZWFuLFxuICAgIGY6ICgpID0+IGFueSk6IE5vZGVJbmplY3RvckZhY3Rvcnkge1xuICBjb25zdCBmYWN0b3J5ID0gbmV3IE5vZGVJbmplY3RvckZhY3RvcnkoZmFjdG9yeUZuLCBpc1ZpZXdQcm92aWRlciwgybXJtWRpcmVjdGl2ZUluamVjdCk7XG4gIGZhY3RvcnkubXVsdGkgPSBbXTtcbiAgZmFjdG9yeS5pbmRleCA9IGluZGV4O1xuICBmYWN0b3J5LmNvbXBvbmVudFByb3ZpZGVycyA9IDA7XG4gIG11bHRpRmFjdG9yeUFkZChmYWN0b3J5LCBmLCBpc0NvbXBvbmVudCAmJiAhaXNWaWV3UHJvdmlkZXIpO1xuICByZXR1cm4gZmFjdG9yeTtcbn1cbiJdfQ==