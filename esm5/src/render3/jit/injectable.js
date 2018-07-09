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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L2luamVjdGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQVFBLE9BQU8sRUFBYSxXQUFXLEVBQXdCLGVBQWUsRUFBRSxpQkFBaUIsSUFBSSxtQkFBbUIsRUFBRSxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUsxSixPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUUzRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7QUFPaEUsTUFBTSw0QkFBNEIsSUFBZSxFQUFFLElBQWlCOztJQUVsRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDVixNQUFNLENBQUM7S0FDUjtJQUVELElBQUksR0FBRyxHQUFRLElBQUksQ0FBQztJQUNwQixNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtRQUM3QyxHQUFHLEVBQUU7WUFDSCxFQUFFLENBQUMsQ0FBQyxHQUFHLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQzs7Z0JBRWpCLElBQU0sWUFBWSxHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLG9CQUFvQixDQUFDLElBQUksQ0FBQztvQkFDdkUsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRTVELElBQUksSUFBSSxHQUFxQyxTQUFTLENBQUM7Z0JBQ3ZELEVBQUUsQ0FBQyxDQUFDLENBQUMsWUFBWSxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLLElBQUks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LElBQW1CLEVBQUMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBRXZFLDRCQUE0QixJQUFnQjtJQUMxQyxNQUFNLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQztDQUMxQjtBQUVELDhCQUE4QixJQUFnQjtJQUM1QyxNQUFNLENBQUUsSUFBNEIsQ0FBQyxVQUFVLEtBQUssU0FBUyxDQUFDO0NBQy9EO0FBRUQsK0JBQStCLElBQWdCO0lBQzdDLE1BQU0sQ0FBRSxJQUE2QixDQUFDLFdBQVcsS0FBSyxTQUFTLENBQUM7Q0FDakUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RXhwcmVzc2lvbiwgTGl0ZXJhbEV4cHIsIFIzRGVwZW5kZW5jeU1ldGFkYXRhLCBXcmFwcGVkTm9kZUV4cHIsIGNvbXBpbGVJbmplY3RhYmxlIGFzIGNvbXBpbGVSM0luamVjdGFibGUsIGppdEV4cHJlc3Npb259IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcblxuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tICcuLi8uLi9kaS9pbmplY3RhYmxlJztcbmltcG9ydCB7Q2xhc3NTYW5zUHJvdmlkZXIsIEV4aXN0aW5nU2Fuc1Byb3ZpZGVyLCBGYWN0b3J5U2Fuc1Byb3ZpZGVyLCBTdGF0aWNDbGFzc1NhbnNQcm92aWRlciwgVmFsdWVQcm92aWRlciwgVmFsdWVTYW5zUHJvdmlkZXJ9IGZyb20gJy4uLy4uL2RpL3Byb3ZpZGVyJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vdHlwZSc7XG5pbXBvcnQge2dldENsb3N1cmVTYWZlUHJvcGVydHl9IGZyb20gJy4uLy4uL3V0aWwvcHJvcGVydHknO1xuXG5pbXBvcnQge2FuZ3VsYXJDb3JlRW52fSBmcm9tICcuL2Vudmlyb25tZW50JztcbmltcG9ydCB7Y29udmVydERlcGVuZGVuY2llcywgcmVmbGVjdERlcGVuZGVuY2llc30gZnJvbSAnLi91dGlsJztcblxuXG4vKipcbiAqIENvbXBpbGUgYW4gQW5ndWxhciBpbmplY3RhYmxlIGFjY29yZGluZyB0byBpdHMgYEluamVjdGFibGVgIG1ldGFkYXRhLCBhbmQgcGF0Y2ggdGhlIHJlc3VsdGluZ1xuICogYG5nSW5qZWN0YWJsZURlZmAgb250byB0aGUgaW5qZWN0YWJsZSB0eXBlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZUluamVjdGFibGUodHlwZTogVHlwZTxhbnk+LCBtZXRhPzogSW5qZWN0YWJsZSk6IHZvaWQge1xuICAvLyBUT0RPKGFseGh1Yik6IGhhbmRsZSBKSVQgb2YgYmFyZSBASW5qZWN0YWJsZSgpLlxuICBpZiAoIW1ldGEpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBsZXQgZGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgJ25nSW5qZWN0YWJsZURlZicsIHtcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChkZWYgPT09IG51bGwpIHtcbiAgICAgICAgLy8gQ2hlY2sgd2hldGhlciB0aGUgaW5qZWN0YWJsZSBtZXRhZGF0YSBpbmNsdWRlcyBhIHByb3ZpZGVyIHNwZWNpZmljYXRpb24uXG4gICAgICAgIGNvbnN0IGhhc0FQcm92aWRlciA9IGlzVXNlQ2xhc3NQcm92aWRlcihtZXRhKSB8fCBpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhKSB8fFxuICAgICAgICAgICAgaXNVc2VWYWx1ZVByb3ZpZGVyKG1ldGEpIHx8IGlzVXNlRXhpc3RpbmdQcm92aWRlcihtZXRhKTtcblxuICAgICAgICBsZXQgZGVwczogUjNEZXBlbmRlbmN5TWV0YWRhdGFbXXx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgIGlmICghaGFzQVByb3ZpZGVyIHx8IChpc1VzZUNsYXNzUHJvdmlkZXIobWV0YSkgJiYgdHlwZSA9PT0gbWV0YS51c2VDbGFzcykpIHtcbiAgICAgICAgICBkZXBzID0gcmVmbGVjdERlcGVuZGVuY2llcyh0eXBlKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1VzZUNsYXNzUHJvdmlkZXIobWV0YSkpIHtcbiAgICAgICAgICBkZXBzID0gbWV0YS5kZXBzICYmIGNvbnZlcnREZXBlbmRlbmNpZXMobWV0YS5kZXBzKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhKSkge1xuICAgICAgICAgIGRlcHMgPSBtZXRhLmRlcHMgJiYgY29udmVydERlcGVuZGVuY2llcyhtZXRhLmRlcHMpIHx8IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGVjaWRlIHdoaWNoIGZsYXZvciBvZiBmYWN0b3J5IHRvIGdlbmVyYXRlLCBiYXNlZCBvbiB0aGUgcHJvdmlkZXIgc3BlY2lmaWVkLlxuICAgICAgICAvLyBPbmx5IG9uZSBvZiB0aGUgdXNlKiBmaWVsZHMgc2hvdWxkIGJlIHNldC5cbiAgICAgICAgbGV0IHVzZUNsYXNzOiBFeHByZXNzaW9ufHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgbGV0IHVzZUZhY3Rvcnk6IEV4cHJlc3Npb258dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICBsZXQgdXNlVmFsdWU6IEV4cHJlc3Npb258dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICBsZXQgdXNlRXhpc3Rpbmc6IEV4cHJlc3Npb258dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIGlmICghaGFzQVByb3ZpZGVyKSB7XG4gICAgICAgICAgLy8gSW4gdGhlIGNhc2UgdGhlIHVzZXIgc3BlY2lmaWVzIGEgdHlwZSBwcm92aWRlciwgdHJlYXQgaXQgYXMge3Byb3ZpZGU6IFgsIHVzZUNsYXNzOiBYfS5cbiAgICAgICAgICAvLyBUaGUgZGVwcyB3aWxsIGhhdmUgYmVlbiByZWZsZWN0ZWQgYWJvdmUsIGNhdXNpbmcgdGhlIGZhY3RvcnkgdG8gY3JlYXRlIHRoZSBjbGFzcyBieVxuICAgICAgICAgIC8vIGNhbGxpbmdcbiAgICAgICAgICAvLyBpdHMgY29uc3RydWN0b3Igd2l0aCBpbmplY3RlZCBkZXBzLlxuICAgICAgICAgIHVzZUNsYXNzID0gbmV3IFdyYXBwZWROb2RlRXhwcih0eXBlKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1VzZUNsYXNzUHJvdmlkZXIobWV0YSkpIHtcbiAgICAgICAgICAvLyBUaGUgdXNlciBleHBsaWNpdGx5IHNwZWNpZmllZCB1c2VDbGFzcywgYW5kIG1heSBvciBtYXkgbm90IGhhdmUgcHJvdmlkZWQgZGVwcy5cbiAgICAgICAgICB1c2VDbGFzcyA9IG5ldyBXcmFwcGVkTm9kZUV4cHIobWV0YS51c2VDbGFzcyk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNVc2VWYWx1ZVByb3ZpZGVyKG1ldGEpKSB7XG4gICAgICAgICAgLy8gVGhlIHVzZXIgZXhwbGljaXRseSBzcGVjaWZpZWQgdXNlVmFsdWUuXG4gICAgICAgICAgdXNlVmFsdWUgPSBuZXcgV3JhcHBlZE5vZGVFeHByKG1ldGEudXNlVmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzVXNlRmFjdG9yeVByb3ZpZGVyKG1ldGEpKSB7XG4gICAgICAgICAgLy8gVGhlIHVzZXIgZXhwbGljaXRseSBzcGVjaWZpZWQgdXNlRmFjdG9yeS5cbiAgICAgICAgICB1c2VGYWN0b3J5ID0gbmV3IFdyYXBwZWROb2RlRXhwcihtZXRhLnVzZUZhY3RvcnkpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzVXNlRXhpc3RpbmdQcm92aWRlcihtZXRhKSkge1xuICAgICAgICAgIC8vIFRoZSB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHVzZUV4aXN0aW5nLlxuICAgICAgICAgIHVzZUV4aXN0aW5nID0gbmV3IFdyYXBwZWROb2RlRXhwcihtZXRhLnVzZUV4aXN0aW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBDYW4ndCBoYXBwZW4gLSBlaXRoZXIgaGFzQVByb3ZpZGVyIHdpbGwgYmUgZmFsc2UsIG9yIG9uZSBvZiB0aGUgcHJvdmlkZXJzIHdpbGwgYmUgc2V0LlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5yZWFjaGFibGUgc3RhdGUuYCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7ZXhwcmVzc2lvbn0gPSBjb21waWxlUjNJbmplY3RhYmxlKHtcbiAgICAgICAgICBuYW1lOiB0eXBlLm5hbWUsXG4gICAgICAgICAgdHlwZTogbmV3IFdyYXBwZWROb2RlRXhwcih0eXBlKSxcbiAgICAgICAgICBwcm92aWRlZEluOiBjb21wdXRlUHJvdmlkZWRJbihtZXRhLnByb3ZpZGVkSW4pLFxuICAgICAgICAgIHVzZUNsYXNzLFxuICAgICAgICAgIHVzZUZhY3RvcnksXG4gICAgICAgICAgdXNlVmFsdWUsXG4gICAgICAgICAgdXNlRXhpc3RpbmcsXG4gICAgICAgICAgZGVwcyxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZGVmID0gaml0RXhwcmVzc2lvbihleHByZXNzaW9uLCBhbmd1bGFyQ29yZUVudiwgYG5nOi8vJHt0eXBlLm5hbWV9L25nSW5qZWN0YWJsZURlZi5qc2ApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRlZjtcbiAgICB9LFxuICB9KTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVByb3ZpZGVkSW4ocHJvdmlkZWRJbjogVHlwZTxhbnk+fCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKTogRXhwcmVzc2lvbiB7XG4gIGlmIChwcm92aWRlZEluID09IG51bGwgfHwgdHlwZW9mIHByb3ZpZGVkSW4gPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIG5ldyBMaXRlcmFsRXhwcihwcm92aWRlZEluKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbmV3IFdyYXBwZWROb2RlRXhwcihwcm92aWRlZEluKTtcbiAgfVxufVxuXG50eXBlIFVzZUNsYXNzUHJvdmlkZXIgPSBJbmplY3RhYmxlICYgQ2xhc3NTYW5zUHJvdmlkZXIgJiB7ZGVwcz86IGFueVtdfTtcblxuZnVuY3Rpb24gaXNVc2VDbGFzc1Byb3ZpZGVyKG1ldGE6IEluamVjdGFibGUpOiBtZXRhIGlzIFVzZUNsYXNzUHJvdmlkZXIge1xuICByZXR1cm4gKG1ldGEgYXMgVXNlQ2xhc3NQcm92aWRlcikudXNlQ2xhc3MgIT09IHVuZGVmaW5lZDtcbn1cblxuY29uc3QgR0VUX1BST1BFUlRZX05BTUUgPSB7fSBhcyBhbnk7XG5jb25zdCBVU0VfVkFMVUUgPSBnZXRDbG9zdXJlU2FmZVByb3BlcnR5PFZhbHVlUHJvdmlkZXI+KFxuICAgIHtwcm92aWRlOiBTdHJpbmcsIHVzZVZhbHVlOiBHRVRfUFJPUEVSVFlfTkFNRX0sIEdFVF9QUk9QRVJUWV9OQU1FKTtcblxuZnVuY3Rpb24gaXNVc2VWYWx1ZVByb3ZpZGVyKG1ldGE6IEluamVjdGFibGUpOiBtZXRhIGlzIEluamVjdGFibGUmVmFsdWVTYW5zUHJvdmlkZXIge1xuICByZXR1cm4gVVNFX1ZBTFVFIGluIG1ldGE7XG59XG5cbmZ1bmN0aW9uIGlzVXNlRmFjdG9yeVByb3ZpZGVyKG1ldGE6IEluamVjdGFibGUpOiBtZXRhIGlzIEluamVjdGFibGUmRmFjdG9yeVNhbnNQcm92aWRlciB7XG4gIHJldHVybiAobWV0YSBhcyBGYWN0b3J5U2Fuc1Byb3ZpZGVyKS51c2VGYWN0b3J5ICE9PSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGlzVXNlRXhpc3RpbmdQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBJbmplY3RhYmxlJkV4aXN0aW5nU2Fuc1Byb3ZpZGVyIHtcbiAgcmV0dXJuIChtZXRhIGFzIEV4aXN0aW5nU2Fuc1Byb3ZpZGVyKS51c2VFeGlzdGluZyAhPT0gdW5kZWZpbmVkO1xufVxuIl19