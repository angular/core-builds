/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { LiteralExpr, WrappedNodeExpr, compileInjectable as compileR3Injectable, jitExpression } from '@angular/compiler';
import { getClosureSafeProperty } from '../../util/property';
import { angularCoreEnv } from './environment';
import { convertDependencies, reflectDependencies } from './util';
/**
 * Compile an Angular injectable according to its `Injectable` metadata, and patch the resulting
 * `ngInjectableDef` onto the injectable type.
 */
export function compileInjectable(type, meta) {
    // TODO(alxhub): handle JIT of bare @Injectable().
    if (!meta) {
        return;
    }
    var def = null;
    Object.defineProperty(type, 'ngInjectableDef', {
        get: function () {
            if (def === null) {
                // Check whether the injectable metadata includes a provider specification.
                var hasAProvider = isUseClassProvider(meta) || isUseFactoryProvider(meta) ||
                    isUseValueProvider(meta) || isUseExistingProvider(meta);
                var deps = undefined;
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
                var useClass = undefined;
                var useFactory = undefined;
                var useValue = undefined;
                var useExisting = undefined;
                if (!hasAProvider) {
                    // In the case the user specifies a type provider, treat it as {provide: X, useClass: X}.
                    // The deps will have been reflected above, causing the factory to create the class by
                    // calling
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
                    throw new Error("Unreachable state.");
                }
                var expression = compileR3Injectable({
                    name: type.name,
                    type: new WrappedNodeExpr(type),
                    providedIn: computeProvidedIn(meta.providedIn),
                    useClass: useClass,
                    useFactory: useFactory,
                    useValue: useValue,
                    useExisting: useExisting,
                    deps: deps,
                }).expression;
                def = jitExpression(expression, angularCoreEnv, "ng://" + type.name + "/ngInjectableDef.js");
            }
            return def;
        },
    });
}
function computeProvidedIn(providedIn) {
    if (providedIn == null || typeof providedIn === 'string') {
        return new LiteralExpr(providedIn);
    }
    else {
        return new WrappedNodeExpr(providedIn);
    }
}
function isUseClassProvider(meta) {
    return meta.useClass !== undefined;
}
var GET_PROPERTY_NAME = {};
var ɵ0 = GET_PROPERTY_NAME;
var USE_VALUE = getClosureSafeProperty({ provide: String, useValue: ɵ0 }, GET_PROPERTY_NAME);
function isUseValueProvider(meta) {
    return USE_VALUE in meta;
}
function isUseFactoryProvider(meta) {
    return meta.useFactory !== undefined;
}
function isUseExistingProvider(meta) {
    return meta.useExisting !== undefined;
}
export { ɵ0 };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L2luamVjdGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFhLFdBQVcsRUFBd0IsZUFBZSxFQUFFLGlCQUFpQixJQUFJLG1CQUFtQixFQUFFLGFBQWEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBSzFKLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBRTNELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDN0MsT0FBTyxFQUFDLG1CQUFtQixFQUFFLG1CQUFtQixFQUFDLE1BQU0sUUFBUSxDQUFDO0FBR2hFOzs7R0FHRztBQUNILE1BQU0sNEJBQTRCLElBQWUsRUFBRSxJQUFpQjtJQUNsRSxrREFBa0Q7SUFDbEQsSUFBSSxDQUFDLElBQUksRUFBRTtRQUNULE9BQU87S0FDUjtJQUVELElBQUksR0FBRyxHQUFRLElBQUksQ0FBQztJQUNwQixNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtRQUM3QyxHQUFHLEVBQUU7WUFDSCxJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUU7Z0JBQ2hCLDJFQUEyRTtnQkFDM0UsSUFBTSxZQUFZLEdBQUcsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksb0JBQW9CLENBQUMsSUFBSSxDQUFDO29CQUN2RSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFNUQsSUFBSSxJQUFJLEdBQXFDLFNBQVMsQ0FBQztnQkFDdkQsSUFBSSxDQUFDLFlBQVksSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksS0FBSyxJQUFJLENBQUMsUUFBUSxDQUFD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LFVBQVUsS0FBSyxTQUFTLENBQUM7QUFDaEUsQ0FBQztBQUVELCtCQUErQixJQUFnQjtJQUM3QyxPQUFRLElBQTZCLENBQUMsV0FBVyxLQUFLLFNBQVMsQ0FBQztBQUNsRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0V4cHJlc3Npb24sIExpdGVyYWxFeHByLCBSM0RlcGVuZGVuY3lNZXRhZGF0YSwgV3JhcHBlZE5vZGVFeHByLCBjb21waWxlSW5qZWN0YWJsZSBhcyBjb21waWxlUjNJbmplY3RhYmxlLCBqaXRFeHByZXNzaW9ufSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5cbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0YWJsZSc7XG5pbXBvcnQge0NsYXNzU2Fuc1Byb3ZpZGVyLCBFeGlzdGluZ1NhbnNQcm92aWRlciwgRmFjdG9yeVNhbnNQcm92aWRlciwgU3RhdGljQ2xhc3NTYW5zUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXIsIFZhbHVlU2Fuc1Byb3ZpZGVyfSBmcm9tICcuLi8uLi9kaS9wcm92aWRlcic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL3R5cGUnO1xuaW1wb3J0IHtnZXRDbG9zdXJlU2FmZVByb3BlcnR5fSBmcm9tICcuLi8uLi91dGlsL3Byb3BlcnR5JztcblxuaW1wb3J0IHthbmd1bGFyQ29yZUVudn0gZnJvbSAnLi9lbnZpcm9ubWVudCc7XG5pbXBvcnQge2NvbnZlcnREZXBlbmRlbmNpZXMsIHJlZmxlY3REZXBlbmRlbmNpZXN9IGZyb20gJy4vdXRpbCc7XG5cblxuLyoqXG4gKiBDb21waWxlIGFuIEFuZ3VsYXIgaW5qZWN0YWJsZSBhY2NvcmRpbmcgdG8gaXRzIGBJbmplY3RhYmxlYCBtZXRhZGF0YSwgYW5kIHBhdGNoIHRoZSByZXN1bHRpbmdcbiAqIGBuZ0luamVjdGFibGVEZWZgIG9udG8gdGhlIGluamVjdGFibGUgdHlwZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVJbmplY3RhYmxlKHR5cGU6IFR5cGU8YW55PiwgbWV0YT86IEluamVjdGFibGUpOiB2b2lkIHtcbiAgLy8gVE9ETyhhbHhodWIpOiBoYW5kbGUgSklUIG9mIGJhcmUgQEluamVjdGFibGUoKS5cbiAgaWYgKCFtZXRhKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgbGV0IGRlZjogYW55ID0gbnVsbDtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsICduZ0luamVjdGFibGVEZWYnLCB7XG4gICAgZ2V0OiAoKSA9PiB7XG4gICAgICBpZiAoZGVmID09PSBudWxsKSB7XG4gICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlIGluamVjdGFibGUgbWV0YWRhdGEgaW5jbHVkZXMgYSBwcm92aWRlciBzcGVjaWZpY2F0aW9uLlxuICAgICAgICBjb25zdCBoYXNBUHJvdmlkZXIgPSBpc1VzZUNsYXNzUHJvdmlkZXIobWV0YSkgfHwgaXNVc2VGYWN0b3J5UHJvdmlkZXIobWV0YSkgfHxcbiAgICAgICAgICAgIGlzVXNlVmFsdWVQcm92aWRlcihtZXRhKSB8fCBpc1VzZUV4aXN0aW5nUHJvdmlkZXIobWV0YSk7XG5cbiAgICAgICAgbGV0IGRlcHM6IFIzRGVwZW5kZW5jeU1ldGFkYXRhW118dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICBpZiAoIWhhc0FQcm92aWRlciB8fCAoaXNVc2VDbGFzc1Byb3ZpZGVyKG1ldGEpICYmIHR5cGUgPT09IG1ldGEudXNlQ2xhc3MpKSB7XG4gICAgICAgICAgZGVwcyA9IHJlZmxlY3REZXBlbmRlbmNpZXModHlwZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNVc2VDbGFzc1Byb3ZpZGVyKG1ldGEpKSB7XG4gICAgICAgICAgZGVwcyA9IG1ldGEuZGVwcyAmJiBjb252ZXJ0RGVwZW5kZW5jaWVzKG1ldGEuZGVwcyk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNVc2VGYWN0b3J5UHJvdmlkZXIobWV0YSkpIHtcbiAgICAgICAgICBkZXBzID0gbWV0YS5kZXBzICYmIGNvbnZlcnREZXBlbmRlbmNpZXMobWV0YS5kZXBzKSB8fCBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERlY2lkZSB3aGljaCBmbGF2b3Igb2YgZmFjdG9yeSB0byBnZW5lcmF0ZSwgYmFzZWQgb24gdGhlIHByb3ZpZGVyIHNwZWNpZmllZC5cbiAgICAgICAgLy8gT25seSBvbmUgb2YgdGhlIHVzZSogZmllbGRzIHNob3VsZCBiZSBzZXQuXG4gICAgICAgIGxldCB1c2VDbGFzczogRXhwcmVzc2lvbnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgIGxldCB1c2VGYWN0b3J5OiBFeHByZXNzaW9ufHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgbGV0IHVzZVZhbHVlOiBFeHByZXNzaW9ufHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgbGV0IHVzZUV4aXN0aW5nOiBFeHByZXNzaW9ufHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAgICAgICBpZiAoIWhhc0FQcm92aWRlcikge1xuICAgICAgICAgIC8vIEluIHRoZSBjYXNlIHRoZSB1c2VyIHNwZWNpZmllcyBhIHR5cGUgcHJvdmlkZXIsIHRyZWF0IGl0IGFzIHtwcm92aWRlOiBYLCB1c2VDbGFzczogWH0uXG4gICAgICAgICAgLy8gVGhlIGRlcHMgd2lsbCBoYXZlIGJlZW4gcmVmbGVjdGVkIGFib3ZlLCBjYXVzaW5nIHRoZSBmYWN0b3J5IHRvIGNyZWF0ZSB0aGUgY2xhc3MgYnlcbiAgICAgICAgICAvLyBjYWxsaW5nXG4gICAgICAgICAgLy8gaXRzIGNvbnN0cnVjdG9yIHdpdGggaW5qZWN0ZWQgZGVwcy5cbiAgICAgICAgICB1c2VDbGFzcyA9IG5ldyBXcmFwcGVkTm9kZUV4cHIodHlwZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNVc2VDbGFzc1Byb3ZpZGVyKG1ldGEpKSB7XG4gICAgICAgICAgLy8gVGhlIHVzZXIgZXhwbGljaXRseSBzcGVjaWZpZWQgdXNlQ2xhc3MsIGFuZCBtYXkgb3IgbWF5IG5vdCBoYXZlIHByb3ZpZGVkIGRlcHMuXG4gICAgICAgICAgdXNlQ2xhc3MgPSBuZXcgV3JhcHBlZE5vZGVFeHByKG1ldGEudXNlQ2xhc3MpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzVXNlVmFsdWVQcm92aWRlcihtZXRhKSkge1xuICAgICAgICAgIC8vIFRoZSB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHVzZVZhbHVlLlxuICAgICAgICAgIHVzZVZhbHVlID0gbmV3IFdyYXBwZWROb2RlRXhwcihtZXRhLnVzZVZhbHVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhKSkge1xuICAgICAgICAgIC8vIFRoZSB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHVzZUZhY3RvcnkuXG4gICAgICAgICAgdXNlRmFjdG9yeSA9IG5ldyBXcmFwcGVkTm9kZUV4cHIobWV0YS51c2VGYWN0b3J5KTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1VzZUV4aXN0aW5nUHJvdmlkZXIobWV0YSkpIHtcbiAgICAgICAgICAvLyBUaGUgdXNlciBleHBsaWNpdGx5IHNwZWNpZmllZCB1c2VFeGlzdGluZy5cbiAgICAgICAgICB1c2VFeGlzdGluZyA9IG5ldyBXcmFwcGVkTm9kZUV4cHIobWV0YS51c2VFeGlzdGluZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQ2FuJ3QgaGFwcGVuIC0gZWl0aGVyIGhhc0FQcm92aWRlciB3aWxsIGJlIGZhbHNlLCBvciBvbmUgb2YgdGhlIHByb3ZpZGVycyB3aWxsIGJlIHNldC5cbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVucmVhY2hhYmxlIHN0YXRlLmApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qge2V4cHJlc3Npb259ID0gY29tcGlsZVIzSW5qZWN0YWJsZSh7XG4gICAgICAgICAgbmFtZTogdHlwZS5uYW1lLFxuICAgICAgICAgIHR5cGU6IG5ldyBXcmFwcGVkTm9kZUV4cHIodHlwZSksXG4gICAgICAgICAgcHJvdmlkZWRJbjogY29tcHV0ZVByb3ZpZGVkSW4obWV0YS5wcm92aWRlZEluKSxcbiAgICAgICAgICB1c2VDbGFzcyxcbiAgICAgICAgICB1c2VGYWN0b3J5LFxuICAgICAgICAgIHVzZVZhbHVlLFxuICAgICAgICAgIHVzZUV4aXN0aW5nLFxuICAgICAgICAgIGRlcHMsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRlZiA9IGppdEV4cHJlc3Npb24oZXhwcmVzc2lvbiwgYW5ndWxhckNvcmVFbnYsIGBuZzovLyR7dHlwZS5uYW1lfS9uZ0luamVjdGFibGVEZWYuanNgKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZWY7XG4gICAgfSxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVQcm92aWRlZEluKHByb3ZpZGVkSW46IFR5cGU8YW55Pnwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCk6IEV4cHJlc3Npb24ge1xuICBpZiAocHJvdmlkZWRJbiA9PSBudWxsIHx8IHR5cGVvZiBwcm92aWRlZEluID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBuZXcgTGl0ZXJhbEV4cHIocHJvdmlkZWRJbik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBXcmFwcGVkTm9kZUV4cHIocHJvdmlkZWRJbik7XG4gIH1cbn1cblxudHlwZSBVc2VDbGFzc1Byb3ZpZGVyID0gSW5qZWN0YWJsZSAmIENsYXNzU2Fuc1Byb3ZpZGVyICYge2RlcHM/OiBhbnlbXX07XG5cbmZ1bmN0aW9uIGlzVXNlQ2xhc3NQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBVc2VDbGFzc1Byb3ZpZGVyIHtcbiAgcmV0dXJuIChtZXRhIGFzIFVzZUNsYXNzUHJvdmlkZXIpLnVzZUNsYXNzICE9PSB1bmRlZmluZWQ7XG59XG5cbmNvbnN0IEdFVF9QUk9QRVJUWV9OQU1FID0ge30gYXMgYW55O1xuY29uc3QgVVNFX1ZBTFVFID0gZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eTxWYWx1ZVByb3ZpZGVyPihcbiAgICB7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogR0VUX1BST1BFUlRZX05BTUV9LCBHRVRfUFJPUEVSVFlfTkFNRSk7XG5cbmZ1bmN0aW9uIGlzVXNlVmFsdWVQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBJbmplY3RhYmxlJlZhbHVlU2Fuc1Byb3ZpZGVyIHtcbiAgcmV0dXJuIFVTRV9WQUxVRSBpbiBtZXRhO1xufVxuXG5mdW5jdGlvbiBpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBJbmplY3RhYmxlJkZhY3RvcnlTYW5zUHJvdmlkZXIge1xuICByZXR1cm4gKG1ldGEgYXMgRmFjdG9yeVNhbnNQcm92aWRlcikudXNlRmFjdG9yeSAhPT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBpc1VzZUV4aXN0aW5nUHJvdmlkZXIobWV0YTogSW5qZWN0YWJsZSk6IG1ldGEgaXMgSW5qZWN0YWJsZSZFeGlzdGluZ1NhbnNQcm92aWRlciB7XG4gIHJldHVybiAobWV0YSBhcyBFeGlzdGluZ1NhbnNQcm92aWRlcikudXNlRXhpc3RpbmcgIT09IHVuZGVmaW5lZDtcbn1cbiJdfQ==