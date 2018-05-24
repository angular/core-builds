/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { LiteralExpr, WrappedNodeExpr, compileInjectable as compileIvyInjectable, jitPatchDefinition } from '@angular/compiler';
import { getClosureSafeProperty } from '../../util/property';
import { angularCoreEnv } from './environment';
import { convertDependencies, reflectDependencies } from './util';
/**
 * Compile an Angular injectable according to its `Injectable` metadata, and patch the resulting
 * `ngInjectableDef` onto the injectable type.
 * @param {?} type
 * @param {?=} meta
 * @return {?}
 */
export function compileInjectable(type, meta) {
    // TODO(alxhub): handle JIT of bare @Injectable().
    if (!meta) {
        return;
    }
    // Check whether the injectable metadata includes a provider specification.
    const /** @type {?} */ hasAProvider = isUseClassProvider(meta) || isUseFactoryProvider(meta) ||
        isUseValueProvider(meta) || isUseExistingProvider(meta);
    let /** @type {?} */ deps = undefined;
    if (!hasAProvider || (isUseClassProvider(meta) && type === meta.useClass)) {
        deps = reflectDependencies(type);
    }
    else if (isUseClassProvider(meta)) {
        deps = meta.deps && convertDependencies(meta.deps);
    }
    else if (isUseFactoryProvider(meta)) {
        deps = meta.deps && convertDependencies(meta.deps) || [];
    }
    // Decide which flavor of factory to generate, based on the provider specified.
    // Only one of the use* fields should be set.
    let /** @type {?} */ useClass = undefined;
    let /** @type {?} */ useFactory = undefined;
    let /** @type {?} */ useValue = undefined;
    let /** @type {?} */ useExisting = undefined;
    if (!hasAProvider) {
        // In the case the user specifies a type provider, treat it as {provide: X, useClass: X}.
        // The deps will have been reflected above, causing the factory to create the class by calling
        // its constructor with injected deps.
        useClass = new WrappedNodeExpr(type);
    }
    else if (isUseClassProvider(meta)) {
        // The user explicitly specified useClass, and may or may not have provided deps.
        useClass = new WrappedNodeExpr(meta.useClass);
    }
    else if (isUseValueProvider(meta)) {
        // The user explicitly specified useValue.
        useValue = new WrappedNodeExpr(meta.useValue);
    }
    else if (isUseFactoryProvider(meta)) {
        // The user explicitly specified useFactory.
        useFactory = new WrappedNodeExpr(meta.useFactory);
    }
    else if (isUseExistingProvider(meta)) {
        // The user explicitly specified useExisting.
        useExisting = new WrappedNodeExpr(meta.useExisting);
    }
    else {
        // Can't happen - either hasAProvider will be false, or one of the providers will be set.
        throw new Error(`Unreachable state.`);
    }
    const { expression } = compileIvyInjectable({
        name: type.name,
        type: new WrappedNodeExpr(type),
        providedIn: computeProvidedIn(meta.providedIn),
        useClass,
        useFactory,
        useValue,
        useExisting,
        deps,
    });
    jitPatchDefinition(type, 'ngInjectableDef', expression, angularCoreEnv);
}
/**
 * @param {?} providedIn
 * @return {?}
 */
function computeProvidedIn(providedIn) {
    if (providedIn == null || typeof providedIn === 'string') {
        return new LiteralExpr(providedIn);
    }
    else {
        return new WrappedNodeExpr(providedIn);
    }
}
/**
 * @param {?} meta
 * @return {?}
 */
function isUseClassProvider(meta) {
    return (/** @type {?} */ (meta)).useClass !== undefined;
}
const /** @type {?} */ GET_PROPERTY_NAME = /** @type {?} */ ({});
const ɵ0 = GET_PROPERTY_NAME;
const /** @type {?} */ USE_VALUE = getClosureSafeProperty({ provide: String, useValue: ɵ0 }, GET_PROPERTY_NAME);
/**
 * @param {?} meta
 * @return {?}
 */
function isUseValueProvider(meta) {
    return USE_VALUE in meta;
}
/**
 * @param {?} meta
 * @return {?}
 */
function isUseFactoryProvider(meta) {
    return (/** @type {?} */ (meta)).useFactory !== undefined;
}
/**
 * @param {?} meta
 * @return {?}
 */
function isUseExistingProvider(meta) {
    return (/** @type {?} */ (meta)).useExisting !== undefined;
}
export { ɵ0 };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L2luamVjdGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQWEsV0FBVyxFQUF3QixlQUFlLEVBQUUsaUJBQWlCLElBQUksb0JBQW9CLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUtoSyxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUUzRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7Ozs7QUFPaEUsTUFBTSw0QkFBNEIsSUFBZSxFQUFFLElBQWlCOztJQUVsRSxJQUFJLENBQUMsSUFBSSxFQUFFO1FBQ1QsT0FBTztLQUNSOztJQUdELHVCQUFNLFlBQVksR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLENBQUM7UUFDdkUsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFNUQscUJBQUksSUFBSSxHQUFxQyxTQUFTLENBQUM7SUFDdkQsSUFBSSxDQUFDLFlBQVksSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksS0FBSyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDekUsSUFBSSxHQUFHLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ2xDO1NBQU0sSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUNuQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDcEQ7U0FBTSxJQUFJLG9CQUFvQixDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ3JDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLG1CQUFtQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7S0FDMUQ7OztJQUlELHFCQUFJLFFBQVEsR0FBeUIsU0FBUyxDQUFDO0lBQy9DLHFCQUFJLFVBQVUsR0FBeUIsU0FBUyxDQUFDO0lBQ2pELHFCQUFJLFFBQVEsR0FBeUIsU0FBUyxDQUFDO0lBQy9DLHFCQUFJLFdBQVcsR0FBeUIsU0FBUyxDQUFDO0lBRWxELElBQUksQ0FBQyxZQUFZLEVBQUU7Ozs7UUFJakIsUUFBUSxHQUFHLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3RDO1NBQU0sSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRTs7UUFFbkMsUUFBUSxHQUFHLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUMvQztTQUFNLElBQUksa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUU7O1FBRW5DLFFBQVEsR0FBRyxJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDL0M7U0FBTSxJQUFJLG9CQUFvQixDQUFDLElBQUksQ0FBQyxFQUFFOztRQUVyQyxVQUFVLEdBQUcsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQ25EO1NBQU0sSUFBSSxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsRUFBRTs7UUFFdEMsV0FBVyxHQUFHLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztLQUNyRDtTQUFNOztRQUVMLE1BQU0sSUFBSSxLQUFLLENBQUMsb0JBQW9CLENBQUMsQ0FBQztLQUN2QztJQUVELE1BQU0sRUFBQyxVQUFVLEVBQUMsR0FBRyxvQkFBb0IsQ0FBQztRQUN4QyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7UUFDZixJQUFJLEVBQUUsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDO1FBQy9CLFVBQVUsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQzlDLFFBQVE7UUFDUixVQUFVO1FBQ1YsUUFBUTtRQUNSLFdBQVc7UUFDWCxJQUFJO0tBQ0wsQ0FBQyxDQUFDO0lBRUgsa0JBQWtCLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFLFVBQVUsRUFBRSxjQUFjLENBQUMsQ0FBQztDQUN6RTs7Ozs7QUFFRCwyQkFBMkIsVUFBZ0Q7SUFDekUsSUFBSSxVQUFVLElBQUksSUFBSSxJQUFJLE9BQU8sVUFBVSxLQUFLLFFBQVEsRUFBRTtRQUN4RCxPQUFPLElBQUksV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQ3BDO1NBQU07UUFDTCxPQUFPLElBQUksZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQ3hDO0NBQ0Y7Ozs7O0FBSUQsNEJBQTRCLElBQWdCO0lBQzFDLE9BQU8sbUJBQUMsSUFBd0IsRUFBQyxDQUFDLFFBQVEsS0FBSyxTQUFTLENBQUM7Q0FDMUQ7QUFFRCx1QkFBTSxpQkFBaUIscUJBQUcsRUFBUyxDQUFBLENBQUM7V0FFSixpQkFBaUI7QUFEakQsdUJBQU0sU0FBUyxHQUFHLHNCQUFzQixDQUNwQyxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxJQUFtQixFQUFDLEVBQUUsaUJBQWlCLENBQUMsQ0FBQzs7Ozs7QUFFdkUsNEJBQTRCLElBQWdCO0lBQzFDLE9BQU8sU0FBUyxJQUFJLElBQUksQ0FBQztDQUMxQjs7Ozs7QUFFRCw4QkFBOEIsSUFBZ0I7SUFDNUMsT0FBTyxtQkFBQyxJQUEyQixFQUFDLENBQUMsVUFBVSxLQUFLLFNBQVMsQ0FBQztDQUMvRDs7Ozs7QUFFRCwrQkFBK0IsSUFBZ0I7SUFDN0MsT0FBTyxtQkFBQyxJQUE0QixFQUFDLENBQUMsV0FBVyxLQUFLLFNBQVMsQ0FBQztDQUNqRSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFeHByZXNzaW9uLCBMaXRlcmFsRXhwciwgUjNEZXBlbmRlbmN5TWV0YWRhdGEsIFdyYXBwZWROb2RlRXhwciwgY29tcGlsZUluamVjdGFibGUgYXMgY29tcGlsZUl2eUluamVjdGFibGUsIGppdFBhdGNoRGVmaW5pdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuXG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJy4uLy4uL2RpL2luamVjdGFibGUnO1xuaW1wb3J0IHtDbGFzc1NhbnNQcm92aWRlciwgRXhpc3RpbmdTYW5zUHJvdmlkZXIsIEZhY3RvcnlTYW5zUHJvdmlkZXIsIFN0YXRpY0NsYXNzU2Fuc1Byb3ZpZGVyLCBWYWx1ZVByb3ZpZGVyLCBWYWx1ZVNhbnNQcm92aWRlcn0gZnJvbSAnLi4vLi4vZGkvcHJvdmlkZXInO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi90eXBlJztcbmltcG9ydCB7Z2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eX0gZnJvbSAnLi4vLi4vdXRpbC9wcm9wZXJ0eSc7XG5cbmltcG9ydCB7YW5ndWxhckNvcmVFbnZ9IGZyb20gJy4vZW52aXJvbm1lbnQnO1xuaW1wb3J0IHtjb252ZXJ0RGVwZW5kZW5jaWVzLCByZWZsZWN0RGVwZW5kZW5jaWVzfSBmcm9tICcuL3V0aWwnO1xuXG5cbi8qKlxuICogQ29tcGlsZSBhbiBBbmd1bGFyIGluamVjdGFibGUgYWNjb3JkaW5nIHRvIGl0cyBgSW5qZWN0YWJsZWAgbWV0YWRhdGEsIGFuZCBwYXRjaCB0aGUgcmVzdWx0aW5nXG4gKiBgbmdJbmplY3RhYmxlRGVmYCBvbnRvIHRoZSBpbmplY3RhYmxlIHR5cGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlSW5qZWN0YWJsZSh0eXBlOiBUeXBlPGFueT4sIG1ldGE/OiBJbmplY3RhYmxlKTogdm9pZCB7XG4gIC8vIFRPRE8oYWx4aHViKTogaGFuZGxlIEpJVCBvZiBiYXJlIEBJbmplY3RhYmxlKCkuXG4gIGlmICghbWV0YSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIENoZWNrIHdoZXRoZXIgdGhlIGluamVjdGFibGUgbWV0YWRhdGEgaW5jbHVkZXMgYSBwcm92aWRlciBzcGVjaWZpY2F0aW9uLlxuICBjb25zdCBoYXNBUHJvdmlkZXIgPSBpc1VzZUNsYXNzUHJvdmlkZXIobWV0YSkgfHwgaXNVc2VGYWN0b3J5UHJvdmlkZXIobWV0YSkgfHxcbiAgICAgIGlzVXNlVmFsdWVQcm92aWRlcihtZXRhKSB8fCBpc1VzZUV4aXN0aW5nUHJvdmlkZXIobWV0YSk7XG5cbiAgbGV0IGRlcHM6IFIzRGVwZW5kZW5jeU1ldGFkYXRhW118dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBpZiAoIWhhc0FQcm92aWRlciB8fCAoaXNVc2VDbGFzc1Byb3ZpZGVyKG1ldGEpICYmIHR5cGUgPT09IG1ldGEudXNlQ2xhc3MpKSB7XG4gICAgZGVwcyA9IHJlZmxlY3REZXBlbmRlbmNpZXModHlwZSk7XG4gIH0gZWxzZSBpZiAoaXNVc2VDbGFzc1Byb3ZpZGVyKG1ldGEpKSB7XG4gICAgZGVwcyA9IG1ldGEuZGVwcyAmJiBjb252ZXJ0RGVwZW5kZW5jaWVzKG1ldGEuZGVwcyk7XG4gIH0gZWxzZSBpZiAoaXNVc2VGYWN0b3J5UHJvdmlkZXIobWV0YSkpIHtcbiAgICBkZXBzID0gbWV0YS5kZXBzICYmIGNvbnZlcnREZXBlbmRlbmNpZXMobWV0YS5kZXBzKSB8fCBbXTtcbiAgfVxuXG4gIC8vIERlY2lkZSB3aGljaCBmbGF2b3Igb2YgZmFjdG9yeSB0byBnZW5lcmF0ZSwgYmFzZWQgb24gdGhlIHByb3ZpZGVyIHNwZWNpZmllZC5cbiAgLy8gT25seSBvbmUgb2YgdGhlIHVzZSogZmllbGRzIHNob3VsZCBiZSBzZXQuXG4gIGxldCB1c2VDbGFzczogRXhwcmVzc2lvbnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIGxldCB1c2VGYWN0b3J5OiBFeHByZXNzaW9ufHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgbGV0IHVzZVZhbHVlOiBFeHByZXNzaW9ufHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgbGV0IHVzZUV4aXN0aW5nOiBFeHByZXNzaW9ufHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICBpZiAoIWhhc0FQcm92aWRlcikge1xuICAgIC8vIEluIHRoZSBjYXNlIHRoZSB1c2VyIHNwZWNpZmllcyBhIHR5cGUgcHJvdmlkZXIsIHRyZWF0IGl0IGFzIHtwcm92aWRlOiBYLCB1c2VDbGFzczogWH0uXG4gICAgLy8gVGhlIGRlcHMgd2lsbCBoYXZlIGJlZW4gcmVmbGVjdGVkIGFib3ZlLCBjYXVzaW5nIHRoZSBmYWN0b3J5IHRvIGNyZWF0ZSB0aGUgY2xhc3MgYnkgY2FsbGluZ1xuICAgIC8vIGl0cyBjb25zdHJ1Y3RvciB3aXRoIGluamVjdGVkIGRlcHMuXG4gICAgdXNlQ2xhc3MgPSBuZXcgV3JhcHBlZE5vZGVFeHByKHR5cGUpO1xuICB9IGVsc2UgaWYgKGlzVXNlQ2xhc3NQcm92aWRlcihtZXRhKSkge1xuICAgIC8vIFRoZSB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHVzZUNsYXNzLCBhbmQgbWF5IG9yIG1heSBub3QgaGF2ZSBwcm92aWRlZCBkZXBzLlxuICAgIHVzZUNsYXNzID0gbmV3IFdyYXBwZWROb2RlRXhwcihtZXRhLnVzZUNsYXNzKTtcbiAgfSBlbHNlIGlmIChpc1VzZVZhbHVlUHJvdmlkZXIobWV0YSkpIHtcbiAgICAvLyBUaGUgdXNlciBleHBsaWNpdGx5IHNwZWNpZmllZCB1c2VWYWx1ZS5cbiAgICB1c2VWYWx1ZSA9IG5ldyBXcmFwcGVkTm9kZUV4cHIobWV0YS51c2VWYWx1ZSk7XG4gIH0gZWxzZSBpZiAoaXNVc2VGYWN0b3J5UHJvdmlkZXIobWV0YSkpIHtcbiAgICAvLyBUaGUgdXNlciBleHBsaWNpdGx5IHNwZWNpZmllZCB1c2VGYWN0b3J5LlxuICAgIHVzZUZhY3RvcnkgPSBuZXcgV3JhcHBlZE5vZGVFeHByKG1ldGEudXNlRmFjdG9yeSk7XG4gIH0gZWxzZSBpZiAoaXNVc2VFeGlzdGluZ1Byb3ZpZGVyKG1ldGEpKSB7XG4gICAgLy8gVGhlIHVzZXIgZXhwbGljaXRseSBzcGVjaWZpZWQgdXNlRXhpc3RpbmcuXG4gICAgdXNlRXhpc3RpbmcgPSBuZXcgV3JhcHBlZE5vZGVFeHByKG1ldGEudXNlRXhpc3RpbmcpO1xuICB9IGVsc2Uge1xuICAgIC8vIENhbid0IGhhcHBlbiAtIGVpdGhlciBoYXNBUHJvdmlkZXIgd2lsbCBiZSBmYWxzZSwgb3Igb25lIG9mIHRoZSBwcm92aWRlcnMgd2lsbCBiZSBzZXQuXG4gICAgdGhyb3cgbmV3IEVycm9yKGBVbnJlYWNoYWJsZSBzdGF0ZS5gKTtcbiAgfVxuXG4gIGNvbnN0IHtleHByZXNzaW9ufSA9IGNvbXBpbGVJdnlJbmplY3RhYmxlKHtcbiAgICBuYW1lOiB0eXBlLm5hbWUsXG4gICAgdHlwZTogbmV3IFdyYXBwZWROb2RlRXhwcih0eXBlKSxcbiAgICBwcm92aWRlZEluOiBjb21wdXRlUHJvdmlkZWRJbihtZXRhLnByb3ZpZGVkSW4pLFxuICAgIHVzZUNsYXNzLFxuICAgIHVzZUZhY3RvcnksXG4gICAgdXNlVmFsdWUsXG4gICAgdXNlRXhpc3RpbmcsXG4gICAgZGVwcyxcbiAgfSk7XG5cbiAgaml0UGF0Y2hEZWZpbml0aW9uKHR5cGUsICduZ0luamVjdGFibGVEZWYnLCBleHByZXNzaW9uLCBhbmd1bGFyQ29yZUVudik7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVQcm92aWRlZEluKHByb3ZpZGVkSW46IFR5cGU8YW55Pnwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCk6IEV4cHJlc3Npb24ge1xuICBpZiAocHJvdmlkZWRJbiA9PSBudWxsIHx8IHR5cGVvZiBwcm92aWRlZEluID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBuZXcgTGl0ZXJhbEV4cHIocHJvdmlkZWRJbik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBXcmFwcGVkTm9kZUV4cHIocHJvdmlkZWRJbik7XG4gIH1cbn1cblxudHlwZSBVc2VDbGFzc1Byb3ZpZGVyID0gSW5qZWN0YWJsZSAmIENsYXNzU2Fuc1Byb3ZpZGVyICYge2RlcHM/OiBhbnlbXX07XG5cbmZ1bmN0aW9uIGlzVXNlQ2xhc3NQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBVc2VDbGFzc1Byb3ZpZGVyIHtcbiAgcmV0dXJuIChtZXRhIGFzIFVzZUNsYXNzUHJvdmlkZXIpLnVzZUNsYXNzICE9PSB1bmRlZmluZWQ7XG59XG5cbmNvbnN0IEdFVF9QUk9QRVJUWV9OQU1FID0ge30gYXMgYW55O1xuY29uc3QgVVNFX1ZBTFVFID0gZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eTxWYWx1ZVByb3ZpZGVyPihcbiAgICB7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogR0VUX1BST1BFUlRZX05BTUV9LCBHRVRfUFJPUEVSVFlfTkFNRSk7XG5cbmZ1bmN0aW9uIGlzVXNlVmFsdWVQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBJbmplY3RhYmxlJlZhbHVlU2Fuc1Byb3ZpZGVyIHtcbiAgcmV0dXJuIFVTRV9WQUxVRSBpbiBtZXRhO1xufVxuXG5mdW5jdGlvbiBpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBJbmplY3RhYmxlJkZhY3RvcnlTYW5zUHJvdmlkZXIge1xuICByZXR1cm4gKG1ldGEgYXMgRmFjdG9yeVNhbnNQcm92aWRlcikudXNlRmFjdG9yeSAhPT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBpc1VzZUV4aXN0aW5nUHJvdmlkZXIobWV0YTogSW5qZWN0YWJsZSk6IG1ldGEgaXMgSW5qZWN0YWJsZSZFeGlzdGluZ1NhbnNQcm92aWRlciB7XG4gIHJldHVybiAobWV0YSBhcyBFeGlzdGluZ1NhbnNQcm92aWRlcikudXNlRXhpc3RpbmcgIT09IHVuZGVmaW5lZDtcbn1cbiJdfQ==