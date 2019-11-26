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
import { isComponentDef } from './interfaces/type_checks';
import { TVIEW } from './interfaces/view';
import { getLView, getPreviousOrParentTNode } from './state';
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
    if (tView.firstCreatePass) {
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
function multiViewProvidersFactoryResolver(_, tData, lView, tNode) {
    var factories = this.multi;
    var result;
    if (this.providerFactory) {
        var componentCount = this.providerFactory.componentProviders;
        var multiProviders = getNodeInjectable(lView, lView[TVIEW], this.providerFactory.index, tNode);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlfc2V0dXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpX3NldHVwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRXBELE9BQU8sRUFBQyxlQUFlLEVBQUUsY0FBYyxFQUFFLGlCQUFpQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFckYsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLDhCQUE4QixFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQzNGLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRXJELE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRTFELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUN4RCxPQUFPLEVBQWUsS0FBSyxFQUFRLE1BQU0sbUJBQW1CLENBQUM7QUFDN0QsT0FBTyxFQUFDLFFBQVEsRUFBRSx3QkFBd0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUkzRDs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFDSCxNQUFNLFVBQVUsaUJBQWlCLENBQzdCLEdBQW9CLEVBQUUsU0FBcUIsRUFBRSxhQUF5QjtJQUN4RSxJQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixJQUFNLEtBQUssR0FBVSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEMsSUFBSSxLQUFLLENBQUMsZUFBZSxFQUFFO1FBQ3pCLElBQU0sV0FBVyxHQUFHLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUV4QywyRUFBMkU7UUFDM0UsZUFBZSxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsV0FB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LGtCQUFrQixHQUFHLENBQUMsQ0FBQztJQUMvQixlQUFlLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxXQUFXLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUM1RCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5cbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4uL2RpL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7Q2xhc3NQcm92aWRlciwgUHJvdmlkZXJ9IGZyb20gJy4uL2RpL2ludGVyZmFjZS9wcm92aWRlcic7XG5pbXBvcnQge2lzQ2xhc3NQcm92aWRlciwgaXNUeXBlUHJvdmlkZXIsIHByb3ZpZGVyVG9GYWN0b3J5fSBmcm9tICcuLi9kaS9yM19pbmplY3Rvcic7XG5cbmltcG9ydCB7ZGlQdWJsaWNJbkluamVjdG9yLCBnZXROb2RlSW5qZWN0YWJsZSwgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlfSBmcm9tICcuL2RpJztcbmltcG9ydCB7ybXJtWRpcmVjdGl2ZUluamVjdH0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvYWxsJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge05vZGVJbmplY3RvckZhY3Rvcnl9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBURGlyZWN0aXZlSG9zdE5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZVByb3ZpZGVySW5kZXhlc30gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtpc0NvbXBvbmVudERlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7TFZpZXcsIFREYXRhLCBUVklFVywgVFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZX0gZnJvbSAnLi9zdGF0ZSc7XG5cblxuXG4vKipcbiAqIFJlc29sdmVzIHRoZSBwcm92aWRlcnMgd2hpY2ggYXJlIGRlZmluZWQgaW4gdGhlIERpcmVjdGl2ZURlZi5cbiAqXG4gKiBXaGVuIGluc2VydGluZyB0aGUgdG9rZW5zIGFuZCB0aGUgZmFjdG9yaWVzIGluIHRoZWlyIHJlc3BlY3RpdmUgYXJyYXlzLCB3ZSBjYW4gYXNzdW1lIHRoYXRcbiAqIHRoaXMgbWV0aG9kIGlzIGNhbGxlZCBmaXJzdCBmb3IgdGhlIGNvbXBvbmVudCAoaWYgYW55KSwgYW5kIHRoZW4gZm9yIG90aGVyIGRpcmVjdGl2ZXMgb24gdGhlIHNhbWVcbiAqIG5vZGUuXG4gKiBBcyBhIGNvbnNlcXVlbmNlLHRoZSBwcm92aWRlcnMgYXJlIGFsd2F5cyBwcm9jZXNzZWQgaW4gdGhhdCBvcmRlcjpcbiAqIDEpIFRoZSB2aWV3IHByb3ZpZGVycyBvZiB0aGUgY29tcG9uZW50XG4gKiAyKSBUaGUgcHJvdmlkZXJzIG9mIHRoZSBjb21wb25lbnRcbiAqIDMpIFRoZSBwcm92aWRlcnMgb2YgdGhlIG90aGVyIGRpcmVjdGl2ZXNcbiAqIFRoaXMgbWF0Y2hlcyB0aGUgc3RydWN0dXJlIG9mIHRoZSBpbmplY3RhYmxlcyBhcnJheXMgb2YgYSB2aWV3IChmb3IgZWFjaCBub2RlKS5cbiAqIFNvIHRoZSB0b2tlbnMgYW5kIHRoZSBmYWN0b3JpZXMgY2FuIGJlIHB1c2hlZCBhdCB0aGUgZW5kIG9mIHRoZSBhcnJheXMsIGV4Y2VwdFxuICogaW4gb25lIGNhc2UgZm9yIG11bHRpIHByb3ZpZGVycy5cbiAqXG4gKiBAcGFyYW0gZGVmIHRoZSBkaXJlY3RpdmUgZGVmaW5pdGlvblxuICogQHBhcmFtIHByb3ZpZGVyczogQXJyYXkgb2YgYHByb3ZpZGVyc2AuXG4gKiBAcGFyYW0gdmlld1Byb3ZpZGVyczogQXJyYXkgb2YgYHZpZXdQcm92aWRlcnNgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZXJzUmVzb2x2ZXI8VD4oXG4gICAgZGVmOiBEaXJlY3RpdmVEZWY8VD4sIHByb3ZpZGVyczogUHJvdmlkZXJbXSwgdmlld1Byb3ZpZGVyczogUHJvdmlkZXJbXSk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3OiBUVmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIGNvbnN0IGlzQ29tcG9uZW50ID0gaXNDb21wb25lbnREZWYoZGVmKTtcblxuICAgIC8vIFRoZSBsaXN0IG9mIHZpZXcgcHJvdmlkZXJzIGlzIHByb2Nlc3NlZCBmaXJzdCwgYW5kIHRoZSBmbGFncyBhcmUgdXBkYXRlZFxuICAgIHJlc29sdmVQcm92aWRlcih2aWV3UHJvdmlkZXJzLCB0Vmlldy5kYXRhLCB0Vmlldy5ibHVlcHJpbnQsIGlzQ29tcG9uZW50LCB0cnVlKTtcblxuICAgIC8vIFRoZW4sIHRoZSBsaXN0IG9mIHByb3ZpZGVycyBpcyBwcm9jZXNzZWQsIGFuZCB0aGUgZmxhZ3MgYXJlIHVwZGF0ZWRcbiAgICByZXNvbHZlUHJvdmlkZXIocHJvdmlkZXJzLCB0Vmlldy5kYXRhLCB0Vmlldy5ibHVlcHJpbnQsIGlzQ29tcG9uZW50LCBmYWxzZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXNvbHZlcyBhIHByb3ZpZGVyIGFuZCBwdWJsaXNoZXMgaXQgdG8gdGhlIERJIHN5c3RlbS5cbiAqL1xuZnVuY3Rpb24gcmVzb2x2ZVByb3ZpZGVyKFxuICAgIHByb3ZpZGVyOiBQcm92aWRlciwgdEluamVjdGFibGVzOiBURGF0YSwgbEluamVjdGFibGVzQmx1ZXByaW50OiBOb2RlSW5qZWN0b3JGYWN0b3J5W10sXG4gICAgaXNDb21wb25lbnQ6IGJvb2xlYW4sIGlzVmlld1Byb3ZpZGVyOiBib29sZWFuKTogdm9pZCB7XG4gIHByb3ZpZGVyID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIpO1xuICBpZiAoQXJyYXkuaXNBcnJheShwcm92aWRlcikpIHtcbiAgICAvLyBSZWN1cnNpdmVseSBjYWxsIGByZXNvbHZlUHJvdmlkZXJgXG4gICAgLy8gUmVjdXJzaW9uIGlzIE9LIGluIHRoaXMgY2FzZSBiZWNhdXNlIHRoaXMgY29kZSB3aWxsIG5vdCBiZSBpbiBob3QtcGF0aCBvbmNlIHdlIGltcGxlbWVudFxuICAgIC8vIGNsb25pbmcgb2YgdGhlIGluaXRpYWwgc3RhdGUuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm92aWRlci5sZW5ndGg7IGkrKykge1xuICAgICAgcmVzb2x2ZVByb3ZpZGVyKFxuICAgICAgICAgIHByb3ZpZGVyW2ldLCB0SW5qZWN0YWJsZXMsIGxJbmplY3RhYmxlc0JsdWVwcmludCwgaXNDb21wb25lbnQsIGlzVmlld1Byb3ZpZGVyKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgIGxldCB0b2tlbjogYW55ID0gaXNUeXBlUHJvdmlkZXIocHJvdmlkZXIpID8gcHJvdmlkZXIgOiByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlci5wcm92aWRlKTtcbiAgICBsZXQgcHJvdmlkZXJGYWN0b3J5OiAoKSA9PiBhbnkgPSBwcm92aWRlclRvRmFjdG9yeShwcm92aWRlcik7XG5cbiAgICBjb25zdCB0Tm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICAgIGNvbnN0IGJlZ2luSW5kZXggPSB0Tm9kZS5wcm92aWRlckluZGV4ZXMgJiBUTm9kZVByb3ZpZGVySW5kZXhlcy5Qcm92aWRlcnNTdGFydEluZGV4TWFzaztcbiAgICBjb25zdCBlbmRJbmRleCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICAgIGNvbnN0IGNwdFZpZXdQcm92aWRlcnNDb3VudCA9XG4gICAgICAgIHROb2RlLnByb3ZpZGVySW5kZXhlcyA+PiBUTm9kZVByb3ZpZGVySW5kZXhlcy5DcHRWaWV3UHJvdmlkZXJzQ291bnRTaGlmdDtcblxuICAgIGlmIChpc0NsYXNzUHJvdmlkZXIocHJvdmlkZXIpIHx8IGlzVHlwZVByb3ZpZGVyKHByb3ZpZGVyKSkge1xuICAgICAgY29uc3QgcHJvdG90eXBlID0gKChwcm92aWRlciBhcyBDbGFzc1Byb3ZpZGVyKS51c2VDbGFzcyB8fCBwcm92aWRlcikucHJvdG90eXBlO1xuICAgICAgY29uc3QgbmdPbkRlc3Ryb3kgPSBwcm90b3R5cGUubmdPbkRlc3Ryb3k7XG5cbiAgICAgIGlmIChuZ09uRGVzdHJveSkge1xuICAgICAgICAodFZpZXcuZGVzdHJveUhvb2tzIHx8ICh0Vmlldy5kZXN0cm95SG9va3MgPSBbXSkpLnB1c2godEluamVjdGFibGVzLmxlbmd0aCwgbmdPbkRlc3Ryb3kpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpc1R5cGVQcm92aWRlcihwcm92aWRlcikgfHwgIXByb3ZpZGVyLm11bHRpKSB7XG4gICAgICAvLyBTaW5nbGUgcHJvdmlkZXIgY2FzZTogdGhlIGZhY3RvcnkgaXMgY3JlYXRlZCBhbmQgcHVzaGVkIGltbWVkaWF0ZWx5XG4gICAgICBjb25zdCBmYWN0b3J5ID0gbmV3IE5vZGVJbmplY3RvckZhY3RvcnkocHJvdmlkZXJGYWN0b3J5LCBpc1ZpZXdQcm92aWRlciwgybXJtWRpcmVjdGl2ZUluamVjdCk7XG4gICAgICBjb25zdCBleGlzdGluZ0ZhY3RvcnlJbmRleCA9IGluZGV4T2YoXG4gICAgICAgICAgdG9rZW4sIHRJbmplY3RhYmxlcywgaXNWaWV3UHJvdmlkZXIgPyBiZWdpbkluZGV4IDogYmVnaW5JbmRleCArIGNwdFZpZXdQcm92aWRlcnNDb3VudCxcbiAgICAgICAgICBlbmRJbmRleCk7XG4gICAgICBpZiAoZXhpc3RpbmdGYWN0b3J5SW5kZXggPT0gLTEpIHtcbiAgICAgICAgZGlQdWJsaWNJbkluamVjdG9yKFxuICAgICAgICAgICAgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKFxuICAgICAgICAgICAgICAgIHROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBsVmlldyksXG4gICAgICAgICAgICB0VmlldywgdG9rZW4pO1xuICAgICAgICB0SW5qZWN0YWJsZXMucHVzaCh0b2tlbik7XG4gICAgICAgIHROb2RlLmRpcmVjdGl2ZVN0YXJ0Kys7XG4gICAgICAgIHROb2RlLmRpcmVjdGl2ZUVuZCsrO1xuICAgICAgICBpZiAoaXNWaWV3UHJvdmlkZXIpIHtcbiAgICAgICAgICB0Tm9kZS5wcm92aWRlckluZGV4ZXMgKz0gVE5vZGVQcm92aWRlckluZGV4ZXMuQ3B0Vmlld1Byb3ZpZGVyc0NvdW50U2hpZnRlcjtcbiAgICAgICAgfVxuICAgICAgICBsSW5qZWN0YWJsZXNCbHVlcHJpbnQucHVzaChmYWN0b3J5KTtcbiAgICAgICAgbFZpZXcucHVzaChmYWN0b3J5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxJbmplY3RhYmxlc0JsdWVwcmludFtleGlzdGluZ0ZhY3RvcnlJbmRleF0gPSBmYWN0b3J5O1xuICAgICAgICBsVmlld1tleGlzdGluZ0ZhY3RvcnlJbmRleF0gPSBmYWN0b3J5O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBNdWx0aSBwcm92aWRlciBjYXNlOlxuICAgICAgLy8gV2UgY3JlYXRlIGEgbXVsdGkgZmFjdG9yeSB3aGljaCBpcyBnb2luZyB0byBhZ2dyZWdhdGUgYWxsIHRoZSB2YWx1ZXMuXG4gICAgICAvLyBTaW5jZSB0aGUgb3V0cHV0IG9mIHN1Y2ggYSBmYWN0b3J5IGRlcGVuZHMgb24gY29udGVudCBvciB2aWV3IGluamVjdGlvbixcbiAgICAgIC8vIHdlIGNyZWF0ZSB0d28gb2YgdGhlbSwgd2hpY2ggYXJlIGxpbmtlZCB0b2dldGhlci5cbiAgICAgIC8vXG4gICAgICAvLyBUaGUgZmlyc3Qgb25lIChmb3IgdmlldyBwcm92aWRlcnMpIGlzIGFsd2F5cyBpbiB0aGUgZmlyc3QgYmxvY2sgb2YgdGhlIGluamVjdGFibGVzIGFycmF5LFxuICAgICAgLy8gYW5kIHRoZSBzZWNvbmQgb25lIChmb3IgcHJvdmlkZXJzKSBpcyBhbHdheXMgaW4gdGhlIHNlY29uZCBibG9jay5cbiAgICAgIC8vIFRoaXMgaXMgaW1wb3J0YW50IGJlY2F1c2UgdmlldyBwcm92aWRlcnMgaGF2ZSBoaWdoZXIgcHJpb3JpdHkuIFdoZW4gYSBtdWx0aSB0b2tlblxuICAgICAgLy8gaXMgYmVpbmcgbG9va2VkIHVwLCB0aGUgdmlldyBwcm92aWRlcnMgc2hvdWxkIGJlIGZvdW5kIGZpcnN0LlxuICAgICAgLy8gTm90ZSB0aGF0IGl0IGlzIG5vdCBwb3NzaWJsZSB0byBoYXZlIGEgbXVsdGkgZmFjdG9yeSBpbiB0aGUgdGhpcmQgYmxvY2sgKGRpcmVjdGl2ZSBibG9jaykuXG4gICAgICAvL1xuICAgICAgLy8gVGhlIGFsZ29yaXRobSB0byBwcm9jZXNzIG11bHRpIHByb3ZpZGVycyBpcyBhcyBmb2xsb3dzOlxuICAgICAgLy8gMSkgSWYgdGhlIG11bHRpIHByb3ZpZGVyIGNvbWVzIGZyb20gdGhlIGB2aWV3UHJvdmlkZXJzYCBvZiB0aGUgY29tcG9uZW50OlxuICAgICAgLy8gICBhKSBJZiB0aGUgc3BlY2lhbCB2aWV3IHByb3ZpZGVycyBmYWN0b3J5IGRvZXNuJ3QgZXhpc3QsIGl0IGlzIGNyZWF0ZWQgYW5kIHB1c2hlZC5cbiAgICAgIC8vICAgYikgRWxzZSwgdGhlIG11bHRpIHByb3ZpZGVyIGlzIGFkZGVkIHRvIHRoZSBleGlzdGluZyBtdWx0aSBmYWN0b3J5LlxuICAgICAgLy8gMikgSWYgdGhlIG11bHRpIHByb3ZpZGVyIGNvbWVzIGZyb20gdGhlIGBwcm92aWRlcnNgIG9mIHRoZSBjb21wb25lbnQgb3Igb2YgYW5vdGhlclxuICAgICAgLy8gZGlyZWN0aXZlOlxuICAgICAgLy8gICBhKSBJZiB0aGUgbXVsdGkgZmFjdG9yeSBkb2Vzbid0IGV4aXN0LCBpdCBpcyBjcmVhdGVkIGFuZCBwcm92aWRlciBwdXNoZWQgaW50byBpdC5cbiAgICAgIC8vICAgICAgSXQgaXMgYWxzbyBsaW5rZWQgdG8gdGhlIG11bHRpIGZhY3RvcnkgZm9yIHZpZXcgcHJvdmlkZXJzLCBpZiBpdCBleGlzdHMuXG4gICAgICAvLyAgIGIpIEVsc2UsIHRoZSBtdWx0aSBwcm92aWRlciBpcyBhZGRlZCB0byB0aGUgZXhpc3RpbmcgbXVsdGkgZmFjdG9yeS5cblxuICAgICAgY29uc3QgZXhpc3RpbmdQcm92aWRlcnNGYWN0b3J5SW5kZXggPVxuICAgICAgICAgIGluZGV4T2YodG9rZW4sIHRJbmplY3RhYmxlcywgYmVnaW5JbmRleCArIGNwdFZpZXdQcm92aWRlcnNDb3VudCwgZW5kSW5kZXgpO1xuICAgICAgY29uc3QgZXhpc3RpbmdWaWV3UHJvdmlkZXJzRmFjdG9yeUluZGV4ID1cbiAgICAgICAgICBpbmRleE9mKHRva2VuLCB0SW5qZWN0YWJsZXMsIGJlZ2luSW5kZXgsIGJlZ2luSW5kZXggKyBjcHRWaWV3UHJvdmlkZXJzQ291bnQpO1xuICAgICAgY29uc3QgZG9lc1Byb3ZpZGVyc0ZhY3RvcnlFeGlzdCA9IGV4aXN0aW5nUHJvdmlkZXJzRmFjdG9yeUluZGV4ID49IDAgJiZcbiAgICAgICAgICBsSW5qZWN0YWJsZXNCbHVlcHJpbnRbZXhpc3RpbmdQcm92aWRlcnNGYWN0b3J5SW5kZXhdO1xuICAgICAgY29uc3QgZG9lc1ZpZXdQcm92aWRlcnNGYWN0b3J5RXhpc3QgPSBleGlzdGluZ1ZpZXdQcm92aWRlcnNGYWN0b3J5SW5kZXggPj0gMCAmJlxuICAgICAgICAgIGxJbmplY3RhYmxlc0JsdWVwcmludFtleGlzdGluZ1ZpZXdQcm92aWRlcnNGYWN0b3J5SW5kZXhdO1xuXG4gICAgICBpZiAoaXNWaWV3UHJvdmlkZXIgJiYgIWRvZXNWaWV3UHJvdmlkZXJzRmFjdG9yeUV4aXN0IHx8XG4gICAgICAgICAgIWlzVmlld1Byb3ZpZGVyICYmICFkb2VzUHJvdmlkZXJzRmFjdG9yeUV4aXN0KSB7XG4gICAgICAgIC8vIENhc2VzIDEuYSBhbmQgMi5hXG4gICAgICAgIGRpUHVibGljSW5JbmplY3RvcihcbiAgICAgICAgICAgIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShcbiAgICAgICAgICAgICAgICB0Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgbFZpZXcpLFxuICAgICAgICAgICAgdFZpZXcsIHRva2VuKTtcbiAgICAgICAgY29uc3QgZmFjdG9yeSA9IG11bHRpRmFjdG9yeShcbiAgICAgICAgICAgIGlzVmlld1Byb3ZpZGVyID8gbXVsdGlWaWV3UHJvdmlkZXJzRmFjdG9yeVJlc29sdmVyIDogbXVsdGlQcm92aWRlcnNGYWN0b3J5UmVzb2x2ZXIsXG4gICAgICAgICAgICBsSW5qZWN0YWJsZXNCbHVlcHJpbnQubGVuZ3RoLCBpc1ZpZXdQcm92aWRlciwgaXNDb21wb25lbnQsIHByb3ZpZGVyRmFjdG9yeSk7XG4gICAgICAgIGlmICghaXNWaWV3UHJvdmlkZXIgJiYgZG9lc1ZpZXdQcm92aWRlcnNGYWN0b3J5RXhpc3QpIHtcbiAgICAgICAgICBsSW5qZWN0YWJsZXNCbHVlcHJpbnRbZXhpc3RpbmdWaWV3UHJvdmlkZXJzRmFjdG9yeUluZGV4XS5wcm92aWRlckZhY3RvcnkgPSBmYWN0b3J5O1xuICAgICAgICB9XG4gICAgICAgIHRJbmplY3RhYmxlcy5wdXNoKHRva2VuKTtcbiAgICAgICAgdE5vZGUuZGlyZWN0aXZlU3RhcnQrKztcbiAgICAgICAgdE5vZGUuZGlyZWN0aXZlRW5kKys7XG4gICAgICAgIGlmIChpc1ZpZXdQcm92aWRlcikge1xuICAgICAgICAgIHROb2RlLnByb3ZpZGVySW5kZXhlcyArPSBUTm9kZVByb3ZpZGVySW5kZXhlcy5DcHRWaWV3UHJvdmlkZXJzQ291bnRTaGlmdGVyO1xuICAgICAgICB9XG4gICAgICAgIGxJbmplY3RhYmxlc0JsdWVwcmludC5wdXNoKGZhY3RvcnkpO1xuICAgICAgICBsVmlldy5wdXNoKGZhY3RvcnkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQ2FzZXMgMS5iIGFuZCAyLmJcbiAgICAgICAgbXVsdGlGYWN0b3J5QWRkKFxuICAgICAgICAgICAgbEluamVjdGFibGVzQmx1ZXByaW50ICFbaXNWaWV3UHJvdmlkZXIgPyBleGlzdGluZ1ZpZXdQcm92aWRlcnNGYWN0b3J5SW5kZXggOiBleGlzdGluZ1Byb3ZpZGVyc0ZhY3RvcnlJbmRleF0sXG4gICAgICAgICAgICBwcm92aWRlckZhY3RvcnksICFpc1ZpZXdQcm92aWRlciAmJiBpc0NvbXBvbmVudCk7XG4gICAgICB9XG4gICAgICBpZiAoIWlzVmlld1Byb3ZpZGVyICYmIGlzQ29tcG9uZW50ICYmIGRvZXNWaWV3UHJvdmlkZXJzRmFjdG9yeUV4aXN0KSB7XG4gICAgICAgIGxJbmplY3RhYmxlc0JsdWVwcmludFtleGlzdGluZ1ZpZXdQcm92aWRlcnNGYWN0b3J5SW5kZXhdLmNvbXBvbmVudFByb3ZpZGVycyAhKys7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQWRkIGEgZmFjdG9yeSBpbiBhIG11bHRpIGZhY3RvcnkuXG4gKi9cbmZ1bmN0aW9uIG11bHRpRmFjdG9yeUFkZChcbiAgICBtdWx0aUZhY3Rvcnk6IE5vZGVJbmplY3RvckZhY3RvcnksIGZhY3Rvcnk6ICgpID0+IGFueSwgaXNDb21wb25lbnRQcm92aWRlcjogYm9vbGVhbik6IHZvaWQge1xuICBtdWx0aUZhY3RvcnkubXVsdGkgIS5wdXNoKGZhY3RvcnkpO1xuICBpZiAoaXNDb21wb25lbnRQcm92aWRlcikge1xuICAgIG11bHRpRmFjdG9yeS5jb21wb25lbnRQcm92aWRlcnMgISsrO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgaW5kZXggb2YgaXRlbSBpbiB0aGUgYXJyYXksIGJ1dCBvbmx5IGluIHRoZSBiZWdpbiB0byBlbmQgcmFuZ2UuXG4gKi9cbmZ1bmN0aW9uIGluZGV4T2YoaXRlbTogYW55LCBhcnI6IGFueVtdLCBiZWdpbjogbnVtYmVyLCBlbmQ6IG51bWJlcikge1xuICBmb3IgKGxldCBpID0gYmVnaW47IGkgPCBlbmQ7IGkrKykge1xuICAgIGlmIChhcnJbaV0gPT09IGl0ZW0pIHJldHVybiBpO1xuICB9XG4gIHJldHVybiAtMTtcbn1cblxuLyoqXG4gKiBVc2UgdGhpcyB3aXRoIGBtdWx0aWAgYHByb3ZpZGVyc2AuXG4gKi9cbmZ1bmN0aW9uIG11bHRpUHJvdmlkZXJzRmFjdG9yeVJlc29sdmVyKFxuICAgIHRoaXM6IE5vZGVJbmplY3RvckZhY3RvcnksIF86IHVuZGVmaW5lZCwgdERhdGE6IFREYXRhLCBsRGF0YTogTFZpZXcsXG4gICAgdE5vZGU6IFREaXJlY3RpdmVIb3N0Tm9kZSk6IGFueVtdIHtcbiAgcmV0dXJuIG11bHRpUmVzb2x2ZSh0aGlzLm11bHRpICEsIFtdKTtcbn1cblxuLyoqXG4gKiBVc2UgdGhpcyB3aXRoIGBtdWx0aWAgYHZpZXdQcm92aWRlcnNgLlxuICpcbiAqIFRoaXMgZmFjdG9yeSBrbm93cyBob3cgdG8gY29uY2F0ZW5hdGUgaXRzZWxmIHdpdGggdGhlIGV4aXN0aW5nIGBtdWx0aWAgYHByb3ZpZGVyc2AuXG4gKi9cbmZ1bmN0aW9uIG11bHRpVmlld1Byb3ZpZGVyc0ZhY3RvcnlSZXNvbHZlcihcbiAgICB0aGlzOiBOb2RlSW5qZWN0b3JGYWN0b3J5LCBfOiB1bmRlZmluZWQsIHREYXRhOiBURGF0YSwgbFZpZXc6IExWaWV3LFxuICAgIHROb2RlOiBURGlyZWN0aXZlSG9zdE5vZGUpOiBhbnlbXSB7XG4gIGNvbnN0IGZhY3RvcmllcyA9IHRoaXMubXVsdGkgITtcbiAgbGV0IHJlc3VsdDogYW55W107XG4gIGlmICh0aGlzLnByb3ZpZGVyRmFjdG9yeSkge1xuICAgIGNvbnN0IGNvbXBvbmVudENvdW50ID0gdGhpcy5wcm92aWRlckZhY3RvcnkuY29tcG9uZW50UHJvdmlkZXJzICE7XG4gICAgY29uc3QgbXVsdGlQcm92aWRlcnMgPVxuICAgICAgICBnZXROb2RlSW5qZWN0YWJsZShsVmlldywgbFZpZXdbVFZJRVddLCB0aGlzLnByb3ZpZGVyRmFjdG9yeSAhLmluZGV4ICEsIHROb2RlKTtcbiAgICAvLyBDb3B5IHRoZSBzZWN0aW9uIG9mIHRoZSBhcnJheSB3aGljaCBjb250YWlucyBgbXVsdGlgIGBwcm92aWRlcnNgIGZyb20gdGhlIGNvbXBvbmVudFxuICAgIHJlc3VsdCA9IG11bHRpUHJvdmlkZXJzLnNsaWNlKDAsIGNvbXBvbmVudENvdW50KTtcbiAgICAvLyBJbnNlcnQgdGhlIGB2aWV3UHJvdmlkZXJgIGluc3RhbmNlcy5cbiAgICBtdWx0aVJlc29sdmUoZmFjdG9yaWVzLCByZXN1bHQpO1xuICAgIC8vIENvcHkgdGhlIHNlY3Rpb24gb2YgdGhlIGFycmF5IHdoaWNoIGNvbnRhaW5zIGBtdWx0aWAgYHByb3ZpZGVyc2AgZnJvbSBvdGhlciBkaXJlY3RpdmVzXG4gICAgZm9yIChsZXQgaSA9IGNvbXBvbmVudENvdW50OyBpIDwgbXVsdGlQcm92aWRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlc3VsdC5wdXNoKG11bHRpUHJvdmlkZXJzW2ldKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmVzdWx0ID0gW107XG4gICAgLy8gSW5zZXJ0IHRoZSBgdmlld1Byb3ZpZGVyYCBpbnN0YW5jZXMuXG4gICAgbXVsdGlSZXNvbHZlKGZhY3RvcmllcywgcmVzdWx0KTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIE1hcHMgYW4gYXJyYXkgb2YgZmFjdG9yaWVzIGludG8gYW4gYXJyYXkgb2YgdmFsdWVzLlxuICovXG5mdW5jdGlvbiBtdWx0aVJlc29sdmUoZmFjdG9yaWVzOiBBcnJheTwoKSA9PiBhbnk+LCByZXN1bHQ6IGFueVtdKTogYW55W10ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGZhY3Rvcmllcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGZhY3RvcnkgPSBmYWN0b3JpZXNbaV0gIWFzKCkgPT4gbnVsbDtcbiAgICByZXN1bHQucHVzaChmYWN0b3J5KCkpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG11bHRpIGZhY3RvcnkuXG4gKi9cbmZ1bmN0aW9uIG11bHRpRmFjdG9yeShcbiAgICBmYWN0b3J5Rm46IChcbiAgICAgICAgdGhpczogTm9kZUluamVjdG9yRmFjdG9yeSwgXzogdW5kZWZpbmVkLCB0RGF0YTogVERhdGEsIGxEYXRhOiBMVmlldyxcbiAgICAgICAgdE5vZGU6IFREaXJlY3RpdmVIb3N0Tm9kZSkgPT4gYW55LFxuICAgIGluZGV4OiBudW1iZXIsIGlzVmlld1Byb3ZpZGVyOiBib29sZWFuLCBpc0NvbXBvbmVudDogYm9vbGVhbixcbiAgICBmOiAoKSA9PiBhbnkpOiBOb2RlSW5qZWN0b3JGYWN0b3J5IHtcbiAgY29uc3QgZmFjdG9yeSA9IG5ldyBOb2RlSW5qZWN0b3JGYWN0b3J5KGZhY3RvcnlGbiwgaXNWaWV3UHJvdmlkZXIsIMm1ybVkaXJlY3RpdmVJbmplY3QpO1xuICBmYWN0b3J5Lm11bHRpID0gW107XG4gIGZhY3RvcnkuaW5kZXggPSBpbmRleDtcbiAgZmFjdG9yeS5jb21wb25lbnRQcm92aWRlcnMgPSAwO1xuICBtdWx0aUZhY3RvcnlBZGQoZmFjdG9yeSwgZiwgaXNDb21wb25lbnQgJiYgIWlzVmlld1Byb3ZpZGVyKTtcbiAgcmV0dXJuIGZhY3Rvcnk7XG59XG4iXX0=