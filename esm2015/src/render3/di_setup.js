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
 * @template T
 * @param {?} def the directive definition
 * @param {?} providers
 * @param {?} viewProviders
 * @return {?}
 */
export function providersResolver(def, providers, viewProviders) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    if (tView.firstTemplatePass) {
        /** @type {?} */
        const isComponent = isComponentDef(def);
        // The list of view providers is processed first, and the flags are updated
        resolveProvider(viewProviders, tView.data, tView.blueprint, isComponent, true);
        // Then, the list of providers is processed, and the flags are updated
        resolveProvider(providers, tView.data, tView.blueprint, isComponent, false);
    }
}
/**
 * Resolves a provider and publishes it to the DI system.
 * @param {?} provider
 * @param {?} tInjectables
 * @param {?} lInjectablesBlueprint
 * @param {?} isComponent
 * @param {?} isViewProvider
 * @return {?}
 */
function resolveProvider(provider, tInjectables, lInjectablesBlueprint, isComponent, isViewProvider) {
    provider = resolveForwardRef(provider);
    if (Array.isArray(provider)) {
        // Recursively call `resolveProvider`
        // Recursion is OK in this case because this code will not be in hot-path once we implement
        // cloning of the initial state.
        for (let i = 0; i < provider.length; i++) {
            resolveProvider(provider[i], tInjectables, lInjectablesBlueprint, isComponent, isViewProvider);
        }
    }
    else {
        /** @type {?} */
        const lView = getLView();
        /** @type {?} */
        let token = isTypeProvider(provider) ? provider : resolveForwardRef(provider.provide);
        /** @type {?} */
        let providerFactory = providerToFactory(provider);
        /** @type {?} */
        const previousOrParentTNode = getPreviousOrParentTNode();
        /** @type {?} */
        const beginIndex = previousOrParentTNode.providerIndexes & 65535 /* ProvidersStartIndexMask */;
        /** @type {?} */
        const endIndex = previousOrParentTNode.flags >> 16 /* DirectiveStartingIndexShift */;
        /** @type {?} */
        const cptViewProvidersCount = previousOrParentTNode.providerIndexes >> 16 /* CptViewProvidersCountShift */;
        if (isTypeProvider(provider) || !provider.multi) {
            /** @type {?} */
            const factory = new NodeInjectorFactory(providerFactory, isViewProvider, directiveInject);
            /** @type {?} */
            const existingFactoryIndex = indexOf(token, tInjectables, isViewProvider ? beginIndex : beginIndex + cptViewProvidersCount, endIndex);
            if (existingFactoryIndex == -1) {
                diPublicInInjector(getOrCreateNodeInjectorForNode(/** @type {?} */ (previousOrParentTNode), lView), lView, token);
                tInjectables.push(token);
                previousOrParentTNode.flags += 1 << 16 /* DirectiveStartingIndexShift */;
                if (isViewProvider) {
                    previousOrParentTNode.providerIndexes +=
                        65536 /* CptViewProvidersCountShifter */;
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
            /** @type {?} */
            const existingProvidersFactoryIndex = indexOf(token, tInjectables, beginIndex + cptViewProvidersCount, endIndex);
            /** @type {?} */
            const existingViewProvidersFactoryIndex = indexOf(token, tInjectables, beginIndex, beginIndex + cptViewProvidersCount);
            /** @type {?} */
            const doesProvidersFactoryExist = existingProvidersFactoryIndex >= 0 &&
                lInjectablesBlueprint[existingProvidersFactoryIndex];
            /** @type {?} */
            const doesViewProvidersFactoryExist = existingViewProvidersFactoryIndex >= 0 &&
                lInjectablesBlueprint[existingViewProvidersFactoryIndex];
            if (isViewProvider && !doesViewProvidersFactoryExist ||
                !isViewProvider && !doesProvidersFactoryExist) {
                // Cases 1.a and 2.a
                diPublicInInjector(getOrCreateNodeInjectorForNode(/** @type {?} */ (previousOrParentTNode), lView), lView, token);
                /** @type {?} */
                const factory = multiFactory(isViewProvider ? multiViewProvidersFactoryResolver : multiProvidersFactoryResolver, lInjectablesBlueprint.length, isViewProvider, isComponent, providerFactory);
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
                lView.push(factory);
            }
            else {
                // Cases 1.b and 2.b
                multiFactoryAdd(/** @type {?} */ ((lInjectablesBlueprint))[isViewProvider ? existingViewProvidersFactoryIndex : existingProvidersFactoryIndex], providerFactory, !isViewProvider && isComponent);
            }
            if (!isViewProvider && isComponent && doesViewProvidersFactoryExist) {
                /** @type {?} */ ((lInjectablesBlueprint[existingViewProvidersFactoryIndex].componentProviders))++;
            }
        }
    }
}
/**
 * Add a factory in a multi factory.
 * @param {?} multiFactory
 * @param {?} factory
 * @param {?} isComponentProvider
 * @return {?}
 */
function multiFactoryAdd(multiFactory, factory, isComponentProvider) {
    /** @type {?} */ ((multiFactory.multi)).push(factory);
    if (isComponentProvider) {
        /** @type {?} */ ((multiFactory.componentProviders))++;
    }
}
/**
 * Returns the index of item in the array, but only in the begin to end range.
 * @param {?} item
 * @param {?} arr
 * @param {?} begin
 * @param {?} end
 * @return {?}
 */
function indexOf(item, arr, begin, end) {
    for (let i = begin; i < end; i++) {
        if (arr[i] === item)
            return i;
    }
    return -1;
}
/**
 * Use this with `multi` `providers`.
 * @this {?}
 * @param {?} _
 * @param {?} tData
 * @param {?} lData
 * @param {?} tNode
 * @return {?}
 */
function multiProvidersFactoryResolver(_, tData, lData, tNode) {
    return multiResolve(/** @type {?} */ ((this.multi)), []);
}
/**
 * Use this with `multi` `viewProviders`.
 *
 * This factory knows how to concatenate itself with the existing `multi` `providers`.
 * @this {?}
 * @param {?} _
 * @param {?} tData
 * @param {?} lData
 * @param {?} tNode
 * @return {?}
 */
function multiViewProvidersFactoryResolver(_, tData, lData, tNode) {
    /** @type {?} */
    const factories = /** @type {?} */ ((this.multi));
    /** @type {?} */
    let result;
    if (this.providerFactory) {
        /** @type {?} */
        const componentCount = /** @type {?} */ ((this.providerFactory.componentProviders));
        /** @type {?} */
        const multiProviders = getNodeInjectable(tData, lData, /** @type {?} */ ((/** @type {?} */ ((this.providerFactory)).index)), tNode);
        // Copy the section of the array which contains `multi` `providers` from the component
        result = multiProviders.slice(0, componentCount);
        // Insert the `viewProvider` instances.
        multiResolve(factories, result);
        // Copy the section of the array which contains `multi` `providers` from other directives
        for (let i = componentCount; i < multiProviders.length; i++) {
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
 * @param {?} factories
 * @param {?} result
 * @return {?}
 */
function multiResolve(factories, result) {
    for (let i = 0; i < factories.length; i++) {
        /** @type {?} */
        const factory = /** @type {?} */ (((factories[i])));
        result.push(factory());
    }
    return result;
}
/**
 * Creates a multi factory.
 * @param {?} factoryFn
 * @param {?} index
 * @param {?} isViewProvider
 * @param {?} isComponent
 * @param {?} f
 * @return {?}
 */
function multiFactory(factoryFn, index, isViewProvider, isComponent, f) {
    /** @type {?} */
    const factory = new NodeInjectorFactory(factoryFn, isViewProvider, directiveInject);
    factory.multi = [];
    factory.index = index;
    factory.componentProviders = 0;
    multiFactoryAdd(factory, f, isComponent && !isViewProvider);
    return factory;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlfc2V0dXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpX3NldHVwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFcEQsT0FBTyxFQUFDLGNBQWMsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBR3BFLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRSw4QkFBOEIsRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUMzRixPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDL0MsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFMUQsT0FBTyxFQUFlLEtBQUssRUFBUSxNQUFNLG1CQUFtQixDQUFDO0FBQzdELE9BQU8sRUFBQyxRQUFRLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDM0QsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBc0J0QyxNQUFNLFVBQVUsaUJBQWlCLENBQzdCLEdBQW9CLEVBQUUsU0FBcUIsRUFBRSxhQUF5Qjs7SUFDeEUsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7O0lBQ3pCLE1BQU0sS0FBSyxHQUFVLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsQyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsRUFBRTs7UUFDM0IsTUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDOztRQUd4QyxlQUFlLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7O1FBRy9FLGVBQWUsQ0FBQyxT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QUFDLGtCQUFrQixHQUFHLENBQUMsQ0FBQztJQUMvQixlQUFlLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxXQUFXLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUM1RCxPQUFPLE9BQU8sQ0FBQztDQUNoQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuXG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuLi9kaS9mb3J3YXJkX3JlZic7XG5pbXBvcnQge1Byb3ZpZGVyfSBmcm9tICcuLi9kaS9wcm92aWRlcic7XG5pbXBvcnQge2lzVHlwZVByb3ZpZGVyLCBwcm92aWRlclRvRmFjdG9yeX0gZnJvbSAnLi4vZGkvcjNfaW5qZWN0b3InO1xuXG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLic7XG5pbXBvcnQge2RpUHVibGljSW5JbmplY3RvciwgZ2V0Tm9kZUluamVjdGFibGUsIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZX0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge2RpcmVjdGl2ZUluamVjdH0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtOb2RlSW5qZWN0b3JGYWN0b3J5fSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlUHJvdmlkZXJJbmRleGVzfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0xWaWV3LCBURGF0YSwgVFZJRVcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldExWaWV3LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGV9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtpc0NvbXBvbmVudERlZn0gZnJvbSAnLi91dGlsJztcblxuXG5cbi8qKlxuICogUmVzb2x2ZXMgdGhlIHByb3ZpZGVycyB3aGljaCBhcmUgZGVmaW5lZCBpbiB0aGUgRGlyZWN0aXZlRGVmLlxuICpcbiAqIFdoZW4gaW5zZXJ0aW5nIHRoZSB0b2tlbnMgYW5kIHRoZSBmYWN0b3JpZXMgaW4gdGhlaXIgcmVzcGVjdGl2ZSBhcnJheXMsIHdlIGNhbiBhc3N1bWUgdGhhdFxuICogdGhpcyBtZXRob2QgaXMgY2FsbGVkIGZpcnN0IGZvciB0aGUgY29tcG9uZW50IChpZiBhbnkpLCBhbmQgdGhlbiBmb3Igb3RoZXIgZGlyZWN0aXZlcyBvbiB0aGUgc2FtZVxuICogbm9kZS5cbiAqIEFzIGEgY29uc2VxdWVuY2UsdGhlIHByb3ZpZGVycyBhcmUgYWx3YXlzIHByb2Nlc3NlZCBpbiB0aGF0IG9yZGVyOlxuICogMSkgVGhlIHZpZXcgcHJvdmlkZXJzIG9mIHRoZSBjb21wb25lbnRcbiAqIDIpIFRoZSBwcm92aWRlcnMgb2YgdGhlIGNvbXBvbmVudFxuICogMykgVGhlIHByb3ZpZGVycyBvZiB0aGUgb3RoZXIgZGlyZWN0aXZlc1xuICogVGhpcyBtYXRjaGVzIHRoZSBzdHJ1Y3R1cmUgb2YgdGhlIGluamVjdGFibGVzIGFycmF5cyBvZiBhIHZpZXcgKGZvciBlYWNoIG5vZGUpLlxuICogU28gdGhlIHRva2VucyBhbmQgdGhlIGZhY3RvcmllcyBjYW4gYmUgcHVzaGVkIGF0IHRoZSBlbmQgb2YgdGhlIGFycmF5cywgZXhjZXB0XG4gKiBpbiBvbmUgY2FzZSBmb3IgbXVsdGkgcHJvdmlkZXJzLlxuICpcbiAqIEBwYXJhbSBkZWYgdGhlIGRpcmVjdGl2ZSBkZWZpbml0aW9uXG4gKiBAcGFyYW0gcHJvdmlkZXJzOiBBcnJheSBvZiBgcHJvdmlkZXJzYC5cbiAqIEBwYXJhbSB2aWV3UHJvdmlkZXJzOiBBcnJheSBvZiBgdmlld1Byb3ZpZGVyc2AuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlcnNSZXNvbHZlcjxUPihcbiAgICBkZWY6IERpcmVjdGl2ZURlZjxUPiwgcHJvdmlkZXJzOiBQcm92aWRlcltdLCB2aWV3UHJvdmlkZXJzOiBQcm92aWRlcltdKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXc6IFRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBjb25zdCBpc0NvbXBvbmVudCA9IGlzQ29tcG9uZW50RGVmKGRlZik7XG5cbiAgICAvLyBUaGUgbGlzdCBvZiB2aWV3IHByb3ZpZGVycyBpcyBwcm9jZXNzZWQgZmlyc3QsIGFuZCB0aGUgZmxhZ3MgYXJlIHVwZGF0ZWRcbiAgICByZXNvbHZlUHJvdmlkZXIodmlld1Byb3ZpZGVycywgdFZpZXcuZGF0YSwgdFZpZXcuYmx1ZXByaW50LCBpc0NvbXBvbmVudCwgdHJ1ZSk7XG5cbiAgICAvLyBUaGVuLCB0aGUgbGlzdCBvZiBwcm92aWRlcnMgaXMgcHJvY2Vzc2VkLCBhbmQgdGhlIGZsYWdzIGFyZSB1cGRhdGVkXG4gICAgcmVzb2x2ZVByb3ZpZGVyKHByb3ZpZGVycywgdFZpZXcuZGF0YSwgdFZpZXcuYmx1ZXByaW50LCBpc0NvbXBvbmVudCwgZmFsc2UpO1xuICB9XG59XG5cbi8qKlxuICogUmVzb2x2ZXMgYSBwcm92aWRlciBhbmQgcHVibGlzaGVzIGl0IHRvIHRoZSBESSBzeXN0ZW0uXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmVQcm92aWRlcihcbiAgICBwcm92aWRlcjogUHJvdmlkZXIsIHRJbmplY3RhYmxlczogVERhdGEsIGxJbmplY3RhYmxlc0JsdWVwcmludDogTm9kZUluamVjdG9yRmFjdG9yeVtdLFxuICAgIGlzQ29tcG9uZW50OiBib29sZWFuLCBpc1ZpZXdQcm92aWRlcjogYm9vbGVhbik6IHZvaWQge1xuICBwcm92aWRlciA9IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyKTtcbiAgaWYgKEFycmF5LmlzQXJyYXkocHJvdmlkZXIpKSB7XG4gICAgLy8gUmVjdXJzaXZlbHkgY2FsbCBgcmVzb2x2ZVByb3ZpZGVyYFxuICAgIC8vIFJlY3Vyc2lvbiBpcyBPSyBpbiB0aGlzIGNhc2UgYmVjYXVzZSB0aGlzIGNvZGUgd2lsbCBub3QgYmUgaW4gaG90LXBhdGggb25jZSB3ZSBpbXBsZW1lbnRcbiAgICAvLyBjbG9uaW5nIG9mIHRoZSBpbml0aWFsIHN0YXRlLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvdmlkZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlc29sdmVQcm92aWRlcihcbiAgICAgICAgICBwcm92aWRlcltpXSwgdEluamVjdGFibGVzLCBsSW5qZWN0YWJsZXNCbHVlcHJpbnQsIGlzQ29tcG9uZW50LCBpc1ZpZXdQcm92aWRlcik7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgICBsZXQgdG9rZW46IGFueSA9IGlzVHlwZVByb3ZpZGVyKHByb3ZpZGVyKSA/IHByb3ZpZGVyIDogcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIucHJvdmlkZSk7XG4gICAgbGV0IHByb3ZpZGVyRmFjdG9yeTogKCkgPT4gYW55ID0gcHJvdmlkZXJUb0ZhY3RvcnkocHJvdmlkZXIpO1xuXG4gICAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gICAgY29uc3QgYmVnaW5JbmRleCA9XG4gICAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wcm92aWRlckluZGV4ZXMgJiBUTm9kZVByb3ZpZGVySW5kZXhlcy5Qcm92aWRlcnNTdGFydEluZGV4TWFzaztcbiAgICBjb25zdCBlbmRJbmRleCA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZS5mbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICBjb25zdCBjcHRWaWV3UHJvdmlkZXJzQ291bnQgPVxuICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUucHJvdmlkZXJJbmRleGVzID4+IFROb2RlUHJvdmlkZXJJbmRleGVzLkNwdFZpZXdQcm92aWRlcnNDb3VudFNoaWZ0O1xuXG4gICAgaWYgKGlzVHlwZVByb3ZpZGVyKHByb3ZpZGVyKSB8fCAhcHJvdmlkZXIubXVsdGkpIHtcbiAgICAgIC8vIFNpbmdsZSBwcm92aWRlciBjYXNlOiB0aGUgZmFjdG9yeSBpcyBjcmVhdGVkIGFuZCBwdXNoZWQgaW1tZWRpYXRlbHlcbiAgICAgIGNvbnN0IGZhY3RvcnkgPSBuZXcgTm9kZUluamVjdG9yRmFjdG9yeShwcm92aWRlckZhY3RvcnksIGlzVmlld1Byb3ZpZGVyLCBkaXJlY3RpdmVJbmplY3QpO1xuICAgICAgY29uc3QgZXhpc3RpbmdGYWN0b3J5SW5kZXggPSBpbmRleE9mKFxuICAgICAgICAgIHRva2VuLCB0SW5qZWN0YWJsZXMsIGlzVmlld1Byb3ZpZGVyID8gYmVnaW5JbmRleCA6IGJlZ2luSW5kZXggKyBjcHRWaWV3UHJvdmlkZXJzQ291bnQsXG4gICAgICAgICAgZW5kSW5kZXgpO1xuICAgICAgaWYgKGV4aXN0aW5nRmFjdG9yeUluZGV4ID09IC0xKSB7XG4gICAgICAgIGRpUHVibGljSW5JbmplY3RvcihcbiAgICAgICAgICAgIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShcbiAgICAgICAgICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgICAgICAgICAgICAgbFZpZXcpLFxuICAgICAgICAgICAgbFZpZXcsIHRva2VuKTtcbiAgICAgICAgdEluamVjdGFibGVzLnB1c2godG9rZW4pO1xuICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUuZmxhZ3MgKz0gMSA8PCBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICAgICAgaWYgKGlzVmlld1Byb3ZpZGVyKSB7XG4gICAgICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLnByb3ZpZGVySW5kZXhlcyArPVxuICAgICAgICAgICAgICBUTm9kZVByb3ZpZGVySW5kZXhlcy5DcHRWaWV3UHJvdmlkZXJzQ291bnRTaGlmdGVyO1xuICAgICAgICB9XG4gICAgICAgIGxJbmplY3RhYmxlc0JsdWVwcmludC5wdXNoKGZhY3RvcnkpO1xuICAgICAgICBsVmlldy5wdXNoKGZhY3RvcnkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbEluamVjdGFibGVzQmx1ZXByaW50W2V4aXN0aW5nRmFjdG9yeUluZGV4XSA9IGZhY3Rvcnk7XG4gICAgICAgIGxWaWV3W2V4aXN0aW5nRmFjdG9yeUluZGV4XSA9IGZhY3Rvcnk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE11bHRpIHByb3ZpZGVyIGNhc2U6XG4gICAgICAvLyBXZSBjcmVhdGUgYSBtdWx0aSBmYWN0b3J5IHdoaWNoIGlzIGdvaW5nIHRvIGFnZ3JlZ2F0ZSBhbGwgdGhlIHZhbHVlcy5cbiAgICAgIC8vIFNpbmNlIHRoZSBvdXRwdXQgb2Ygc3VjaCBhIGZhY3RvcnkgZGVwZW5kcyBvbiBjb250ZW50IG9yIHZpZXcgaW5qZWN0aW9uLFxuICAgICAgLy8gd2UgY3JlYXRlIHR3byBvZiB0aGVtLCB3aGljaCBhcmUgbGlua2VkIHRvZ2V0aGVyLlxuICAgICAgLy9cbiAgICAgIC8vIFRoZSBmaXJzdCBvbmUgKGZvciB2aWV3IHByb3ZpZGVycykgaXMgYWx3YXlzIGluIHRoZSBmaXJzdCBibG9jayBvZiB0aGUgaW5qZWN0YWJsZXMgYXJyYXksXG4gICAgICAvLyBhbmQgdGhlIHNlY29uZCBvbmUgKGZvciBwcm92aWRlcnMpIGlzIGFsd2F5cyBpbiB0aGUgc2Vjb25kIGJsb2NrLlxuICAgICAgLy8gVGhpcyBpcyBpbXBvcnRhbnQgYmVjYXVzZSB2aWV3IHByb3ZpZGVycyBoYXZlIGhpZ2hlciBwcmlvcml0eS4gV2hlbiBhIG11bHRpIHRva2VuXG4gICAgICAvLyBpcyBiZWluZyBsb29rZWQgdXAsIHRoZSB2aWV3IHByb3ZpZGVycyBzaG91bGQgYmUgZm91bmQgZmlyc3QuXG4gICAgICAvLyBOb3RlIHRoYXQgaXQgaXMgbm90IHBvc3NpYmxlIHRvIGhhdmUgYSBtdWx0aSBmYWN0b3J5IGluIHRoZSB0aGlyZCBibG9jayAoZGlyZWN0aXZlIGJsb2NrKS5cbiAgICAgIC8vXG4gICAgICAvLyBUaGUgYWxnb3JpdGhtIHRvIHByb2Nlc3MgbXVsdGkgcHJvdmlkZXJzIGlzIGFzIGZvbGxvd3M6XG4gICAgICAvLyAxKSBJZiB0aGUgbXVsdGkgcHJvdmlkZXIgY29tZXMgZnJvbSB0aGUgYHZpZXdQcm92aWRlcnNgIG9mIHRoZSBjb21wb25lbnQ6XG4gICAgICAvLyAgIGEpIElmIHRoZSBzcGVjaWFsIHZpZXcgcHJvdmlkZXJzIGZhY3RvcnkgZG9lc24ndCBleGlzdCwgaXQgaXMgY3JlYXRlZCBhbmQgcHVzaGVkLlxuICAgICAgLy8gICBiKSBFbHNlLCB0aGUgbXVsdGkgcHJvdmlkZXIgaXMgYWRkZWQgdG8gdGhlIGV4aXN0aW5nIG11bHRpIGZhY3RvcnkuXG4gICAgICAvLyAyKSBJZiB0aGUgbXVsdGkgcHJvdmlkZXIgY29tZXMgZnJvbSB0aGUgYHByb3ZpZGVyc2Agb2YgdGhlIGNvbXBvbmVudCBvciBvZiBhbm90aGVyXG4gICAgICAvLyBkaXJlY3RpdmU6XG4gICAgICAvLyAgIGEpIElmIHRoZSBtdWx0aSBmYWN0b3J5IGRvZXNuJ3QgZXhpc3QsIGl0IGlzIGNyZWF0ZWQgYW5kIHByb3ZpZGVyIHB1c2hlZCBpbnRvIGl0LlxuICAgICAgLy8gICAgICBJdCBpcyBhbHNvIGxpbmtlZCB0byB0aGUgbXVsdGkgZmFjdG9yeSBmb3IgdmlldyBwcm92aWRlcnMsIGlmIGl0IGV4aXN0cy5cbiAgICAgIC8vICAgYikgRWxzZSwgdGhlIG11bHRpIHByb3ZpZGVyIGlzIGFkZGVkIHRvIHRoZSBleGlzdGluZyBtdWx0aSBmYWN0b3J5LlxuXG4gICAgICBjb25zdCBleGlzdGluZ1Byb3ZpZGVyc0ZhY3RvcnlJbmRleCA9XG4gICAgICAgICAgaW5kZXhPZih0b2tlbiwgdEluamVjdGFibGVzLCBiZWdpbkluZGV4ICsgY3B0Vmlld1Byb3ZpZGVyc0NvdW50LCBlbmRJbmRleCk7XG4gICAgICBjb25zdCBleGlzdGluZ1ZpZXdQcm92aWRlcnNGYWN0b3J5SW5kZXggPVxuICAgICAgICAgIGluZGV4T2YodG9rZW4sIHRJbmplY3RhYmxlcywgYmVnaW5JbmRleCwgYmVnaW5JbmRleCArIGNwdFZpZXdQcm92aWRlcnNDb3VudCk7XG4gICAgICBjb25zdCBkb2VzUHJvdmlkZXJzRmFjdG9yeUV4aXN0ID0gZXhpc3RpbmdQcm92aWRlcnNGYWN0b3J5SW5kZXggPj0gMCAmJlxuICAgICAgICAgIGxJbmplY3RhYmxlc0JsdWVwcmludFtleGlzdGluZ1Byb3ZpZGVyc0ZhY3RvcnlJbmRleF07XG4gICAgICBjb25zdCBkb2VzVmlld1Byb3ZpZGVyc0ZhY3RvcnlFeGlzdCA9IGV4aXN0aW5nVmlld1Byb3ZpZGVyc0ZhY3RvcnlJbmRleCA+PSAwICYmXG4gICAgICAgICAgbEluamVjdGFibGVzQmx1ZXByaW50W2V4aXN0aW5nVmlld1Byb3ZpZGVyc0ZhY3RvcnlJbmRleF07XG5cbiAgICAgIGlmIChpc1ZpZXdQcm92aWRlciAmJiAhZG9lc1ZpZXdQcm92aWRlcnNGYWN0b3J5RXhpc3QgfHxcbiAgICAgICAgICAhaXNWaWV3UHJvdmlkZXIgJiYgIWRvZXNQcm92aWRlcnNGYWN0b3J5RXhpc3QpIHtcbiAgICAgICAgLy8gQ2FzZXMgMS5hIGFuZCAyLmFcbiAgICAgICAgZGlQdWJsaWNJbkluamVjdG9yKFxuICAgICAgICAgICAgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKFxuICAgICAgICAgICAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICAgICAgICAgICAgICBsVmlldyksXG4gICAgICAgICAgICBsVmlldywgdG9rZW4pO1xuICAgICAgICBjb25zdCBmYWN0b3J5ID0gbXVsdGlGYWN0b3J5KFxuICAgICAgICAgICAgaXNWaWV3UHJvdmlkZXIgPyBtdWx0aVZpZXdQcm92aWRlcnNGYWN0b3J5UmVzb2x2ZXIgOiBtdWx0aVByb3ZpZGVyc0ZhY3RvcnlSZXNvbHZlcixcbiAgICAgICAgICAgIGxJbmplY3RhYmxlc0JsdWVwcmludC5sZW5ndGgsIGlzVmlld1Byb3ZpZGVyLCBpc0NvbXBvbmVudCwgcHJvdmlkZXJGYWN0b3J5KTtcbiAgICAgICAgaWYgKCFpc1ZpZXdQcm92aWRlciAmJiBkb2VzVmlld1Byb3ZpZGVyc0ZhY3RvcnlFeGlzdCkge1xuICAgICAgICAgIGxJbmplY3RhYmxlc0JsdWVwcmludFtleGlzdGluZ1ZpZXdQcm92aWRlcnNGYWN0b3J5SW5kZXhdLnByb3ZpZGVyRmFjdG9yeSA9IGZhY3Rvcnk7XG4gICAgICAgIH1cbiAgICAgICAgdEluamVjdGFibGVzLnB1c2godG9rZW4pO1xuICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUuZmxhZ3MgKz0gMSA8PCBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICAgICAgaWYgKGlzVmlld1Byb3ZpZGVyKSB7XG4gICAgICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLnByb3ZpZGVySW5kZXhlcyArPVxuICAgICAgICAgICAgICBUTm9kZVByb3ZpZGVySW5kZXhlcy5DcHRWaWV3UHJvdmlkZXJzQ291bnRTaGlmdGVyO1xuICAgICAgICB9XG4gICAgICAgIGxJbmplY3RhYmxlc0JsdWVwcmludC5wdXNoKGZhY3RvcnkpO1xuICAgICAgICBsVmlldy5wdXNoKGZhY3RvcnkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQ2FzZXMgMS5iIGFuZCAyLmJcbiAgICAgICAgbXVsdGlGYWN0b3J5QWRkKFxuICAgICAgICAgICAgbEluamVjdGFibGVzQmx1ZXByaW50ICFbaXNWaWV3UHJvdmlkZXIgPyBleGlzdGluZ1ZpZXdQcm92aWRlcnNGYWN0b3J5SW5kZXggOiBleGlzdGluZ1Byb3ZpZGVyc0ZhY3RvcnlJbmRleF0sXG4gICAgICAgICAgICBwcm92aWRlckZhY3RvcnksICFpc1ZpZXdQcm92aWRlciAmJiBpc0NvbXBvbmVudCk7XG4gICAgICB9XG4gICAgICBpZiAoIWlzVmlld1Byb3ZpZGVyICYmIGlzQ29tcG9uZW50ICYmIGRvZXNWaWV3UHJvdmlkZXJzRmFjdG9yeUV4aXN0KSB7XG4gICAgICAgIGxJbmplY3RhYmxlc0JsdWVwcmludFtleGlzdGluZ1ZpZXdQcm92aWRlcnNGYWN0b3J5SW5kZXhdLmNvbXBvbmVudFByb3ZpZGVycyAhKys7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQWRkIGEgZmFjdG9yeSBpbiBhIG11bHRpIGZhY3RvcnkuXG4gKi9cbmZ1bmN0aW9uIG11bHRpRmFjdG9yeUFkZChcbiAgICBtdWx0aUZhY3Rvcnk6IE5vZGVJbmplY3RvckZhY3RvcnksIGZhY3Rvcnk6ICgpID0+IGFueSwgaXNDb21wb25lbnRQcm92aWRlcjogYm9vbGVhbik6IHZvaWQge1xuICBtdWx0aUZhY3RvcnkubXVsdGkgIS5wdXNoKGZhY3RvcnkpO1xuICBpZiAoaXNDb21wb25lbnRQcm92aWRlcikge1xuICAgIG11bHRpRmFjdG9yeS5jb21wb25lbnRQcm92aWRlcnMgISsrO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgaW5kZXggb2YgaXRlbSBpbiB0aGUgYXJyYXksIGJ1dCBvbmx5IGluIHRoZSBiZWdpbiB0byBlbmQgcmFuZ2UuXG4gKi9cbmZ1bmN0aW9uIGluZGV4T2YoaXRlbTogYW55LCBhcnI6IGFueVtdLCBiZWdpbjogbnVtYmVyLCBlbmQ6IG51bWJlcikge1xuICBmb3IgKGxldCBpID0gYmVnaW47IGkgPCBlbmQ7IGkrKykge1xuICAgIGlmIChhcnJbaV0gPT09IGl0ZW0pIHJldHVybiBpO1xuICB9XG4gIHJldHVybiAtMTtcbn1cblxuLyoqXG4gKiBVc2UgdGhpcyB3aXRoIGBtdWx0aWAgYHByb3ZpZGVyc2AuXG4gKi9cbmZ1bmN0aW9uIG11bHRpUHJvdmlkZXJzRmFjdG9yeVJlc29sdmVyKFxuICAgIHRoaXM6IE5vZGVJbmplY3RvckZhY3RvcnksIF86IG51bGwsIHREYXRhOiBURGF0YSwgbERhdGE6IExWaWV3LCB0Tm9kZTogVEVsZW1lbnROb2RlKTogYW55W10ge1xuICByZXR1cm4gbXVsdGlSZXNvbHZlKHRoaXMubXVsdGkgISwgW10pO1xufVxuXG4vKipcbiAqIFVzZSB0aGlzIHdpdGggYG11bHRpYCBgdmlld1Byb3ZpZGVyc2AuXG4gKlxuICogVGhpcyBmYWN0b3J5IGtub3dzIGhvdyB0byBjb25jYXRlbmF0ZSBpdHNlbGYgd2l0aCB0aGUgZXhpc3RpbmcgYG11bHRpYCBgcHJvdmlkZXJzYC5cbiAqL1xuZnVuY3Rpb24gbXVsdGlWaWV3UHJvdmlkZXJzRmFjdG9yeVJlc29sdmVyKFxuICAgIHRoaXM6IE5vZGVJbmplY3RvckZhY3RvcnksIF86IG51bGwsIHREYXRhOiBURGF0YSwgbERhdGE6IExWaWV3LCB0Tm9kZTogVEVsZW1lbnROb2RlKTogYW55W10ge1xuICBjb25zdCBmYWN0b3JpZXMgPSB0aGlzLm11bHRpICE7XG4gIGxldCByZXN1bHQ6IGFueVtdO1xuICBpZiAodGhpcy5wcm92aWRlckZhY3RvcnkpIHtcbiAgICBjb25zdCBjb21wb25lbnRDb3VudCA9IHRoaXMucHJvdmlkZXJGYWN0b3J5LmNvbXBvbmVudFByb3ZpZGVycyAhO1xuICAgIGNvbnN0IG11bHRpUHJvdmlkZXJzID0gZ2V0Tm9kZUluamVjdGFibGUodERhdGEsIGxEYXRhLCB0aGlzLnByb3ZpZGVyRmFjdG9yeSAhLmluZGV4ICEsIHROb2RlKTtcbiAgICAvLyBDb3B5IHRoZSBzZWN0aW9uIG9mIHRoZSBhcnJheSB3aGljaCBjb250YWlucyBgbXVsdGlgIGBwcm92aWRlcnNgIGZyb20gdGhlIGNvbXBvbmVudFxuICAgIHJlc3VsdCA9IG11bHRpUHJvdmlkZXJzLnNsaWNlKDAsIGNvbXBvbmVudENvdW50KTtcbiAgICAvLyBJbnNlcnQgdGhlIGB2aWV3UHJvdmlkZXJgIGluc3RhbmNlcy5cbiAgICBtdWx0aVJlc29sdmUoZmFjdG9yaWVzLCByZXN1bHQpO1xuICAgIC8vIENvcHkgdGhlIHNlY3Rpb24gb2YgdGhlIGFycmF5IHdoaWNoIGNvbnRhaW5zIGBtdWx0aWAgYHByb3ZpZGVyc2AgZnJvbSBvdGhlciBkaXJlY3RpdmVzXG4gICAgZm9yIChsZXQgaSA9IGNvbXBvbmVudENvdW50OyBpIDwgbXVsdGlQcm92aWRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlc3VsdC5wdXNoKG11bHRpUHJvdmlkZXJzW2ldKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmVzdWx0ID0gW107XG4gICAgLy8gSW5zZXJ0IHRoZSBgdmlld1Byb3ZpZGVyYCBpbnN0YW5jZXMuXG4gICAgbXVsdGlSZXNvbHZlKGZhY3RvcmllcywgcmVzdWx0KTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIE1hcHMgYW4gYXJyYXkgb2YgZmFjdG9yaWVzIGludG8gYW4gYXJyYXkgb2YgdmFsdWVzLlxuICovXG5mdW5jdGlvbiBtdWx0aVJlc29sdmUoZmFjdG9yaWVzOiBBcnJheTwoKSA9PiBhbnk+LCByZXN1bHQ6IGFueVtdKTogYW55W10ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGZhY3Rvcmllcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGZhY3RvcnkgPSBmYWN0b3JpZXNbaV0gIWFzKCkgPT4gbnVsbDtcbiAgICByZXN1bHQucHVzaChmYWN0b3J5KCkpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG11bHRpIGZhY3RvcnkuXG4gKi9cbmZ1bmN0aW9uIG11bHRpRmFjdG9yeShcbiAgICBmYWN0b3J5Rm46IChcbiAgICAgICAgdGhpczogTm9kZUluamVjdG9yRmFjdG9yeSwgXzogbnVsbCwgdERhdGE6IFREYXRhLCBsRGF0YTogTFZpZXcsIHROb2RlOiBURWxlbWVudE5vZGUpID0+IGFueSxcbiAgICBpbmRleDogbnVtYmVyLCBpc1ZpZXdQcm92aWRlcjogYm9vbGVhbiwgaXNDb21wb25lbnQ6IGJvb2xlYW4sXG4gICAgZjogKCkgPT4gYW55KTogTm9kZUluamVjdG9yRmFjdG9yeSB7XG4gIGNvbnN0IGZhY3RvcnkgPSBuZXcgTm9kZUluamVjdG9yRmFjdG9yeShmYWN0b3J5Rm4sIGlzVmlld1Byb3ZpZGVyLCBkaXJlY3RpdmVJbmplY3QpO1xuICBmYWN0b3J5Lm11bHRpID0gW107XG4gIGZhY3RvcnkuaW5kZXggPSBpbmRleDtcbiAgZmFjdG9yeS5jb21wb25lbnRQcm92aWRlcnMgPSAwO1xuICBtdWx0aUZhY3RvcnlBZGQoZmFjdG9yeSwgZiwgaXNDb21wb25lbnQgJiYgIWlzVmlld1Byb3ZpZGVyKTtcbiAgcmV0dXJuIGZhY3Rvcnk7XG59XG4iXX0=