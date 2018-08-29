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
import { NG_INJECTABLE_DEF } from './fields';
import { convertDependencies, reflectDependencies } from './util';
/**
 * Compile an Angular injectable according to its `Injectable` metadata, and patch the resulting
 * `ngInjectableDef` onto the injectable type.
 */
export function compileInjectable(type, srcMeta) {
    // Allow the compilation of a class with a `@Injectable()` decorator without parameters
    var meta = srcMeta || { providedIn: null };
    var def = null;
    Object.defineProperty(type, NG_INJECTABLE_DEF, {
        get: function () {
            if (def === null) {
                // Check whether the injectable metadata includes a provider specification.
                var hasAProvider = isUseClassProvider(meta) || isUseFactoryProvider(meta) ||
                    isUseValueProvider(meta) || isUseExistingProvider(meta);
                var ctorDeps = reflectDependencies(type);
                var userDeps = undefined;
                if ((isUseClassProvider(meta) || isUseFactoryProvider(meta)) && meta.deps !== undefined) {
                    userDeps = convertDependencies(meta.deps);
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
                var _a = compileR3Injectable({
                    name: type.name,
                    type: new WrappedNodeExpr(type),
                    providedIn: computeProvidedIn(meta.providedIn),
                    useClass: useClass,
                    useFactory: useFactory,
                    useValue: useValue,
                    useExisting: useExisting,
                    ctorDeps: ctorDeps,
                    userDeps: userDeps,
                }), expression = _a.expression, statements = _a.statements;
                def = jitExpression(expression, angularCoreEnv, "ng://" + type.name + "/ngInjectableDef.js", statements);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L2luamVjdGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFhLFdBQVcsRUFBOEMsZUFBZSxFQUFFLGlCQUFpQixJQUFJLG1CQUFtQixFQUFFLGFBQWEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBS2hMLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBRTNELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDN0MsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzNDLE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUloRTs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsSUFBZSxFQUFFLE9BQW9CO0lBQ3JFLHVGQUF1RjtJQUN2RixJQUFNLElBQUksR0FBZSxPQUFPLElBQUksRUFBQyxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7SUFFdkQsSUFBSSxHQUFHLEdBQVEsSUFBSSxDQUFDO0lBQ3BCLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1FBQzdDLEdBQUcsRUFBRTtZQUNILElBQUksR0FBRyxLQUFLLElBQUksRUFBRTtnQkFDaEIsMkVBQTJFO2dCQUMzRSxJQUFNLFlBQVksR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLENBQUM7b0JBQ3ZFLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLHFCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUU1RCxJQUFNLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FB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QUM7QUFFRCxTQUFTLHFCQUFxQixDQUFDLElBQWdCO0lBQzdDLE9BQVEsSUFBNkIsQ0FBQyxXQUFXLEtBQUssU0FBUyxDQUFDO0FBQ2xFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RXhwcmVzc2lvbiwgTGl0ZXJhbEV4cHIsIFIzRGVwZW5kZW5jeU1ldGFkYXRhLCBSM0luamVjdGFibGVNZXRhZGF0YSwgV3JhcHBlZE5vZGVFeHByLCBjb21waWxlSW5qZWN0YWJsZSBhcyBjb21waWxlUjNJbmplY3RhYmxlLCBqaXRFeHByZXNzaW9ufSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5cbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0YWJsZSc7XG5pbXBvcnQge0NsYXNzU2Fuc1Byb3ZpZGVyLCBFeGlzdGluZ1NhbnNQcm92aWRlciwgRmFjdG9yeVNhbnNQcm92aWRlciwgU3RhdGljQ2xhc3NTYW5zUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXIsIFZhbHVlU2Fuc1Byb3ZpZGVyfSBmcm9tICcuLi8uLi9kaS9wcm92aWRlcic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL3R5cGUnO1xuaW1wb3J0IHtnZXRDbG9zdXJlU2FmZVByb3BlcnR5fSBmcm9tICcuLi8uLi91dGlsL3Byb3BlcnR5JztcblxuaW1wb3J0IHthbmd1bGFyQ29yZUVudn0gZnJvbSAnLi9lbnZpcm9ubWVudCc7XG5pbXBvcnQge05HX0lOSkVDVEFCTEVfREVGfSBmcm9tICcuL2ZpZWxkcyc7XG5pbXBvcnQge2NvbnZlcnREZXBlbmRlbmNpZXMsIHJlZmxlY3REZXBlbmRlbmNpZXN9IGZyb20gJy4vdXRpbCc7XG5cblxuXG4vKipcbiAqIENvbXBpbGUgYW4gQW5ndWxhciBpbmplY3RhYmxlIGFjY29yZGluZyB0byBpdHMgYEluamVjdGFibGVgIG1ldGFkYXRhLCBhbmQgcGF0Y2ggdGhlIHJlc3VsdGluZ1xuICogYG5nSW5qZWN0YWJsZURlZmAgb250byB0aGUgaW5qZWN0YWJsZSB0eXBlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZUluamVjdGFibGUodHlwZTogVHlwZTxhbnk+LCBzcmNNZXRhPzogSW5qZWN0YWJsZSk6IHZvaWQge1xuICAvLyBBbGxvdyB0aGUgY29tcGlsYXRpb24gb2YgYSBjbGFzcyB3aXRoIGEgYEBJbmplY3RhYmxlKClgIGRlY29yYXRvciB3aXRob3V0IHBhcmFtZXRlcnNcbiAgY29uc3QgbWV0YTogSW5qZWN0YWJsZSA9IHNyY01ldGEgfHwge3Byb3ZpZGVkSW46IG51bGx9O1xuXG4gIGxldCBkZWY6IGFueSA9IG51bGw7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBOR19JTkpFQ1RBQkxFX0RFRiwge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKGRlZiA9PT0gbnVsbCkge1xuICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoZSBpbmplY3RhYmxlIG1ldGFkYXRhIGluY2x1ZGVzIGEgcHJvdmlkZXIgc3BlY2lmaWNhdGlvbi5cbiAgICAgICAgY29uc3QgaGFzQVByb3ZpZGVyID0gaXNVc2VDbGFzc1Byb3ZpZGVyKG1ldGEpIHx8IGlzVXNlRmFjdG9yeVByb3ZpZGVyKG1ldGEpIHx8XG4gICAgICAgICAgICBpc1VzZVZhbHVlUHJvdmlkZXIobWV0YSkgfHwgaXNVc2VFeGlzdGluZ1Byb3ZpZGVyKG1ldGEpO1xuXG4gICAgICAgIGNvbnN0IGN0b3JEZXBzID0gcmVmbGVjdERlcGVuZGVuY2llcyh0eXBlKTtcblxuICAgICAgICBsZXQgdXNlckRlcHM6IFIzRGVwZW5kZW5jeU1ldGFkYXRhW118dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICBpZiAoKGlzVXNlQ2xhc3NQcm92aWRlcihtZXRhKSB8fCBpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhKSkgJiYgbWV0YS5kZXBzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB1c2VyRGVwcyA9IGNvbnZlcnREZXBlbmRlbmNpZXMobWV0YS5kZXBzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERlY2lkZSB3aGljaCBmbGF2b3Igb2YgZmFjdG9yeSB0byBnZW5lcmF0ZSwgYmFzZWQgb24gdGhlIHByb3ZpZGVyIHNwZWNpZmllZC5cbiAgICAgICAgLy8gT25seSBvbmUgb2YgdGhlIHVzZSogZmllbGRzIHNob3VsZCBiZSBzZXQuXG4gICAgICAgIGxldCB1c2VDbGFzczogRXhwcmVzc2lvbnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgIGxldCB1c2VGYWN0b3J5OiBFeHByZXNzaW9ufHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgbGV0IHVzZVZhbHVlOiBFeHByZXNzaW9ufHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgbGV0IHVzZUV4aXN0aW5nOiBFeHByZXNzaW9ufHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAgICAgICBpZiAoIWhhc0FQcm92aWRlcikge1xuICAgICAgICAgIC8vIEluIHRoZSBjYXNlIHRoZSB1c2VyIHNwZWNpZmllcyBhIHR5cGUgcHJvdmlkZXIsIHRyZWF0IGl0IGFzIHtwcm92aWRlOiBYLCB1c2VDbGFzczogWH0uXG4gICAgICAgICAgLy8gVGhlIGRlcHMgd2lsbCBoYXZlIGJlZW4gcmVmbGVjdGVkIGFib3ZlLCBjYXVzaW5nIHRoZSBmYWN0b3J5IHRvIGNyZWF0ZSB0aGUgY2xhc3MgYnlcbiAgICAgICAgICAvLyBjYWxsaW5nXG4gICAgICAgICAgLy8gaXRzIGNvbnN0cnVjdG9yIHdpdGggaW5qZWN0ZWQgZGVwcy5cbiAgICAgICAgICB1c2VDbGFzcyA9IG5ldyBXcmFwcGVkTm9kZUV4cHIodHlwZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNVc2VDbGFzc1Byb3ZpZGVyKG1ldGEpKSB7XG4gICAgICAgICAgLy8gVGhlIHVzZXIgZXhwbGljaXRseSBzcGVjaWZpZWQgdXNlQ2xhc3MsIGFuZCBtYXkgb3IgbWF5IG5vdCBoYXZlIHByb3ZpZGVkIGRlcHMuXG4gICAgICAgICAgdXNlQ2xhc3MgPSBuZXcgV3JhcHBlZE5vZGVFeHByKG1ldGEudXNlQ2xhc3MpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzVXNlVmFsdWVQcm92aWRlcihtZXRhKSkge1xuICAgICAgICAgIC8vIFRoZSB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHVzZVZhbHVlLlxuICAgICAgICAgIHVzZVZhbHVlID0gbmV3IFdyYXBwZWROb2RlRXhwcihtZXRhLnVzZVZhbHVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhKSkge1xuICAgICAgICAgIC8vIFRoZSB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHVzZUZhY3RvcnkuXG4gICAgICAgICAgdXNlRmFjdG9yeSA9IG5ldyBXcmFwcGVkTm9kZUV4cHIobWV0YS51c2VGYWN0b3J5KTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1VzZUV4aXN0aW5nUHJvdmlkZXIobWV0YSkpIHtcbiAgICAgICAgICAvLyBUaGUgdXNlciBleHBsaWNpdGx5IHNwZWNpZmllZCB1c2VFeGlzdGluZy5cbiAgICAgICAgICB1c2VFeGlzdGluZyA9IG5ldyBXcmFwcGVkTm9kZUV4cHIobWV0YS51c2VFeGlzdGluZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQ2FuJ3QgaGFwcGVuIC0gZWl0aGVyIGhhc0FQcm92aWRlciB3aWxsIGJlIGZhbHNlLCBvciBvbmUgb2YgdGhlIHByb3ZpZGVycyB3aWxsIGJlIHNldC5cbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVucmVhY2hhYmxlIHN0YXRlLmApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qge2V4cHJlc3Npb24sIHN0YXRlbWVudHN9ID0gY29tcGlsZVIzSW5qZWN0YWJsZSh7XG4gICAgICAgICAgbmFtZTogdHlwZS5uYW1lLFxuICAgICAgICAgIHR5cGU6IG5ldyBXcmFwcGVkTm9kZUV4cHIodHlwZSksXG4gICAgICAgICAgcHJvdmlkZWRJbjogY29tcHV0ZVByb3ZpZGVkSW4obWV0YS5wcm92aWRlZEluKSxcbiAgICAgICAgICB1c2VDbGFzcyxcbiAgICAgICAgICB1c2VGYWN0b3J5LFxuICAgICAgICAgIHVzZVZhbHVlLFxuICAgICAgICAgIHVzZUV4aXN0aW5nLFxuICAgICAgICAgIGN0b3JEZXBzLFxuICAgICAgICAgIHVzZXJEZXBzLFxuICAgICAgICB9KTtcblxuICAgICAgICBkZWYgPSBqaXRFeHByZXNzaW9uKFxuICAgICAgICAgICAgZXhwcmVzc2lvbiwgYW5ndWxhckNvcmVFbnYsIGBuZzovLyR7dHlwZS5uYW1lfS9uZ0luamVjdGFibGVEZWYuanNgLCBzdGF0ZW1lbnRzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZWY7XG4gICAgfSxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVQcm92aWRlZEluKHByb3ZpZGVkSW46IFR5cGU8YW55Pnwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCk6IEV4cHJlc3Npb24ge1xuICBpZiAocHJvdmlkZWRJbiA9PSBudWxsIHx8IHR5cGVvZiBwcm92aWRlZEluID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBuZXcgTGl0ZXJhbEV4cHIocHJvdmlkZWRJbik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBXcmFwcGVkTm9kZUV4cHIocHJvdmlkZWRJbik7XG4gIH1cbn1cblxudHlwZSBVc2VDbGFzc1Byb3ZpZGVyID0gSW5qZWN0YWJsZSAmIENsYXNzU2Fuc1Byb3ZpZGVyICYge2RlcHM/OiBhbnlbXX07XG5cbmZ1bmN0aW9uIGlzVXNlQ2xhc3NQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBVc2VDbGFzc1Byb3ZpZGVyIHtcbiAgcmV0dXJuIChtZXRhIGFzIFVzZUNsYXNzUHJvdmlkZXIpLnVzZUNsYXNzICE9PSB1bmRlZmluZWQ7XG59XG5cbmNvbnN0IEdFVF9QUk9QRVJUWV9OQU1FID0ge30gYXMgYW55O1xuY29uc3QgVVNFX1ZBTFVFID0gZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eTxWYWx1ZVByb3ZpZGVyPihcbiAgICB7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogR0VUX1BST1BFUlRZX05BTUV9LCBHRVRfUFJPUEVSVFlfTkFNRSk7XG5cbmZ1bmN0aW9uIGlzVXNlVmFsdWVQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBJbmplY3RhYmxlJlZhbHVlU2Fuc1Byb3ZpZGVyIHtcbiAgcmV0dXJuIFVTRV9WQUxVRSBpbiBtZXRhO1xufVxuXG5mdW5jdGlvbiBpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBJbmplY3RhYmxlJkZhY3RvcnlTYW5zUHJvdmlkZXIge1xuICByZXR1cm4gKG1ldGEgYXMgRmFjdG9yeVNhbnNQcm92aWRlcikudXNlRmFjdG9yeSAhPT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBpc1VzZUV4aXN0aW5nUHJvdmlkZXIobWV0YTogSW5qZWN0YWJsZSk6IG1ldGEgaXMgSW5qZWN0YWJsZSZFeGlzdGluZ1NhbnNQcm92aWRlciB7XG4gIHJldHVybiAobWV0YSBhcyBFeGlzdGluZ1NhbnNQcm92aWRlcikudXNlRXhpc3RpbmcgIT09IHVuZGVmaW5lZDtcbn1cbiJdfQ==