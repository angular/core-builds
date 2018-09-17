/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { LiteralExpr, WrappedNodeExpr, compileInjectable as compileR3Injectable, jitExpression } from '@angular/compiler';
import { getClosureSafeProperty } from '../../util/property';
import { NG_INJECTABLE_DEF } from '../fields';
import { angularCoreEnv } from './environment';
import { convertDependencies, reflectDependencies } from './util';
/**
 * Compile an Angular injectable according to its `Injectable` metadata, and patch the resulting
 * `ngInjectableDef` onto the injectable type.
 */
export function compileInjectable(type, srcMeta) {
    // Allow the compilation of a class with a `@Injectable()` decorator without parameters
    const meta = srcMeta || { providedIn: null };
    let def = null;
    Object.defineProperty(type, NG_INJECTABLE_DEF, {
        get: () => {
            if (def === null) {
                // Check whether the injectable metadata includes a provider specification.
                const hasAProvider = isUseClassProvider(meta) || isUseFactoryProvider(meta) ||
                    isUseValueProvider(meta) || isUseExistingProvider(meta);
                const ctorDeps = reflectDependencies(type);
                let userDeps = undefined;
                if ((isUseClassProvider(meta) || isUseFactoryProvider(meta)) && meta.deps !== undefined) {
                    userDeps = convertDependencies(meta.deps);
                }
                // Decide which flavor of factory to generate, based on the provider specified.
                // Only one of the use* fields should be set.
                let useClass = undefined;
                let useFactory = undefined;
                let useValue = undefined;
                let useExisting = undefined;
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
                    throw new Error(`Unreachable state.`);
                }
                const { expression, statements } = compileR3Injectable({
                    name: type.name,
                    type: new WrappedNodeExpr(type),
                    providedIn: computeProvidedIn(meta.providedIn),
                    useClass,
                    useFactory,
                    useValue,
                    useExisting,
                    ctorDeps,
                    userDeps,
                });
                def = jitExpression(expression, angularCoreEnv, `ng://${type.name}/ngInjectableDef.js`, statements);
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
const USE_VALUE = getClosureSafeProperty({ provide: String, useValue: getClosureSafeProperty });
function isUseValueProvider(meta) {
    return USE_VALUE in meta;
}
function isUseFactoryProvider(meta) {
    return meta.useFactory !== undefined;
}
function isUseExistingProvider(meta) {
    return meta.useExisting !== undefined;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L2luamVjdGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFhLFdBQVcsRUFBOEMsZUFBZSxFQUFFLGlCQUFpQixJQUFJLG1CQUFtQixFQUFFLGFBQWEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBS2hMLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQzNELE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUU1QyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUloRTs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsSUFBZSxFQUFFLE9BQW9CO0lBQ3JFLHVGQUF1RjtJQUN2RixNQUFNLElBQUksR0FBZSxPQUFPLElBQUksRUFBQyxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7SUFFdkQsSUFBSSxHQUFHLEdBQVEsSUFBSSxDQUFDO0lBQ3BCLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1FBQzdDLEdBQUcsRUFBRSxHQUFHLEVBQUU7WUFDUixJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUU7Z0JBQ2hCLDJFQUEyRTtnQkFDM0UsTUFBTSxZQUFZLEdBQUcsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksb0JBQW9CLENBQUMsSUFBSSxDQUFDO29CQUN2RSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFNUQsTUFBTSxRQUFRLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENB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Q0FBQztBQUUvRixTQUFTLGtCQUFrQixDQUFDLElBQWdCO0lBQzFDLE9BQU8sU0FBUyxJQUFJLElBQUksQ0FBQztBQUMzQixDQUFDO0FBRUQsU0FBUyxvQkFBb0IsQ0FBQyxJQUFnQjtJQUM1QyxPQUFRLElBQTRCLENBQUMsVUFBVSxLQUFLLFNBQVMsQ0FBQztBQUNoRSxDQUFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxJQUFnQjtJQUM3QyxPQUFRLElBQTZCLENBQUMsV0FBVyxLQUFLLFNBQVMsQ0FBQztBQUNsRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0V4cHJlc3Npb24sIExpdGVyYWxFeHByLCBSM0RlcGVuZGVuY3lNZXRhZGF0YSwgUjNJbmplY3RhYmxlTWV0YWRhdGEsIFdyYXBwZWROb2RlRXhwciwgY29tcGlsZUluamVjdGFibGUgYXMgY29tcGlsZVIzSW5qZWN0YWJsZSwgaml0RXhwcmVzc2lvbn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuXG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJy4uLy4uL2RpL2luamVjdGFibGUnO1xuaW1wb3J0IHtDbGFzc1NhbnNQcm92aWRlciwgRXhpc3RpbmdTYW5zUHJvdmlkZXIsIEZhY3RvcnlTYW5zUHJvdmlkZXIsIFN0YXRpY0NsYXNzU2Fuc1Byb3ZpZGVyLCBWYWx1ZVByb3ZpZGVyLCBWYWx1ZVNhbnNQcm92aWRlcn0gZnJvbSAnLi4vLi4vZGkvcHJvdmlkZXInO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi90eXBlJztcbmltcG9ydCB7Z2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eX0gZnJvbSAnLi4vLi4vdXRpbC9wcm9wZXJ0eSc7XG5pbXBvcnQge05HX0lOSkVDVEFCTEVfREVGfSBmcm9tICcuLi9maWVsZHMnO1xuXG5pbXBvcnQge2FuZ3VsYXJDb3JlRW52fSBmcm9tICcuL2Vudmlyb25tZW50JztcbmltcG9ydCB7Y29udmVydERlcGVuZGVuY2llcywgcmVmbGVjdERlcGVuZGVuY2llc30gZnJvbSAnLi91dGlsJztcblxuXG5cbi8qKlxuICogQ29tcGlsZSBhbiBBbmd1bGFyIGluamVjdGFibGUgYWNjb3JkaW5nIHRvIGl0cyBgSW5qZWN0YWJsZWAgbWV0YWRhdGEsIGFuZCBwYXRjaCB0aGUgcmVzdWx0aW5nXG4gKiBgbmdJbmplY3RhYmxlRGVmYCBvbnRvIHRoZSBpbmplY3RhYmxlIHR5cGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlSW5qZWN0YWJsZSh0eXBlOiBUeXBlPGFueT4sIHNyY01ldGE/OiBJbmplY3RhYmxlKTogdm9pZCB7XG4gIC8vIEFsbG93IHRoZSBjb21waWxhdGlvbiBvZiBhIGNsYXNzIHdpdGggYSBgQEluamVjdGFibGUoKWAgZGVjb3JhdG9yIHdpdGhvdXQgcGFyYW1ldGVyc1xuICBjb25zdCBtZXRhOiBJbmplY3RhYmxlID0gc3JjTWV0YSB8fCB7cHJvdmlkZWRJbjogbnVsbH07XG5cbiAgbGV0IGRlZjogYW55ID0gbnVsbDtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIE5HX0lOSkVDVEFCTEVfREVGLCB7XG4gICAgZ2V0OiAoKSA9PiB7XG4gICAgICBpZiAoZGVmID09PSBudWxsKSB7XG4gICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlIGluamVjdGFibGUgbWV0YWRhdGEgaW5jbHVkZXMgYSBwcm92aWRlciBzcGVjaWZpY2F0aW9uLlxuICAgICAgICBjb25zdCBoYXNBUHJvdmlkZXIgPSBpc1VzZUNsYXNzUHJvdmlkZXIobWV0YSkgfHwgaXNVc2VGYWN0b3J5UHJvdmlkZXIobWV0YSkgfHxcbiAgICAgICAgICAgIGlzVXNlVmFsdWVQcm92aWRlcihtZXRhKSB8fCBpc1VzZUV4aXN0aW5nUHJvdmlkZXIobWV0YSk7XG5cbiAgICAgICAgY29uc3QgY3RvckRlcHMgPSByZWZsZWN0RGVwZW5kZW5jaWVzKHR5cGUpO1xuXG4gICAgICAgIGxldCB1c2VyRGVwczogUjNEZXBlbmRlbmN5TWV0YWRhdGFbXXx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgIGlmICgoaXNVc2VDbGFzc1Byb3ZpZGVyKG1ldGEpIHx8IGlzVXNlRmFjdG9yeVByb3ZpZGVyKG1ldGEpKSAmJiBtZXRhLmRlcHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHVzZXJEZXBzID0gY29udmVydERlcGVuZGVuY2llcyhtZXRhLmRlcHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGVjaWRlIHdoaWNoIGZsYXZvciBvZiBmYWN0b3J5IHRvIGdlbmVyYXRlLCBiYXNlZCBvbiB0aGUgcHJvdmlkZXIgc3BlY2lmaWVkLlxuICAgICAgICAvLyBPbmx5IG9uZSBvZiB0aGUgdXNlKiBmaWVsZHMgc2hvdWxkIGJlIHNldC5cbiAgICAgICAgbGV0IHVzZUNsYXNzOiBFeHByZXNzaW9ufHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgbGV0IHVzZUZhY3Rvcnk6IEV4cHJlc3Npb258dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICBsZXQgdXNlVmFsdWU6IEV4cHJlc3Npb258dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICBsZXQgdXNlRXhpc3Rpbmc6IEV4cHJlc3Npb258dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIGlmICghaGFzQVByb3ZpZGVyKSB7XG4gICAgICAgICAgLy8gSW4gdGhlIGNhc2UgdGhlIHVzZXIgc3BlY2lmaWVzIGEgdHlwZSBwcm92aWRlciwgdHJlYXQgaXQgYXMge3Byb3ZpZGU6IFgsIHVzZUNsYXNzOiBYfS5cbiAgICAgICAgICAvLyBUaGUgZGVwcyB3aWxsIGhhdmUgYmVlbiByZWZsZWN0ZWQgYWJvdmUsIGNhdXNpbmcgdGhlIGZhY3RvcnkgdG8gY3JlYXRlIHRoZSBjbGFzcyBieVxuICAgICAgICAgIC8vIGNhbGxpbmdcbiAgICAgICAgICAvLyBpdHMgY29uc3RydWN0b3Igd2l0aCBpbmplY3RlZCBkZXBzLlxuICAgICAgICAgIHVzZUNsYXNzID0gbmV3IFdyYXBwZWROb2RlRXhwcih0eXBlKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1VzZUNsYXNzUHJvdmlkZXIobWV0YSkpIHtcbiAgICAgICAgICAvLyBUaGUgdXNlciBleHBsaWNpdGx5IHNwZWNpZmllZCB1c2VDbGFzcywgYW5kIG1heSBvciBtYXkgbm90IGhhdmUgcHJvdmlkZWQgZGVwcy5cbiAgICAgICAgICB1c2VDbGFzcyA9IG5ldyBXcmFwcGVkTm9kZUV4cHIobWV0YS51c2VDbGFzcyk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNVc2VWYWx1ZVByb3ZpZGVyKG1ldGEpKSB7XG4gICAgICAgICAgLy8gVGhlIHVzZXIgZXhwbGljaXRseSBzcGVjaWZpZWQgdXNlVmFsdWUuXG4gICAgICAgICAgdXNlVmFsdWUgPSBuZXcgV3JhcHBlZE5vZGVFeHByKG1ldGEudXNlVmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzVXNlRmFjdG9yeVByb3ZpZGVyKG1ldGEpKSB7XG4gICAgICAgICAgLy8gVGhlIHVzZXIgZXhwbGljaXRseSBzcGVjaWZpZWQgdXNlRmFjdG9yeS5cbiAgICAgICAgICB1c2VGYWN0b3J5ID0gbmV3IFdyYXBwZWROb2RlRXhwcihtZXRhLnVzZUZhY3RvcnkpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzVXNlRXhpc3RpbmdQcm92aWRlcihtZXRhKSkge1xuICAgICAgICAgIC8vIFRoZSB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHVzZUV4aXN0aW5nLlxuICAgICAgICAgIHVzZUV4aXN0aW5nID0gbmV3IFdyYXBwZWROb2RlRXhwcihtZXRhLnVzZUV4aXN0aW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBDYW4ndCBoYXBwZW4gLSBlaXRoZXIgaGFzQVByb3ZpZGVyIHdpbGwgYmUgZmFsc2UsIG9yIG9uZSBvZiB0aGUgcHJvdmlkZXJzIHdpbGwgYmUgc2V0LlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5yZWFjaGFibGUgc3RhdGUuYCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7ZXhwcmVzc2lvbiwgc3RhdGVtZW50c30gPSBjb21waWxlUjNJbmplY3RhYmxlKHtcbiAgICAgICAgICBuYW1lOiB0eXBlLm5hbWUsXG4gICAgICAgICAgdHlwZTogbmV3IFdyYXBwZWROb2RlRXhwcih0eXBlKSxcbiAgICAgICAgICBwcm92aWRlZEluOiBjb21wdXRlUHJvdmlkZWRJbihtZXRhLnByb3ZpZGVkSW4pLFxuICAgICAgICAgIHVzZUNsYXNzLFxuICAgICAgICAgIHVzZUZhY3RvcnksXG4gICAgICAgICAgdXNlVmFsdWUsXG4gICAgICAgICAgdXNlRXhpc3RpbmcsXG4gICAgICAgICAgY3RvckRlcHMsXG4gICAgICAgICAgdXNlckRlcHMsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRlZiA9IGppdEV4cHJlc3Npb24oXG4gICAgICAgICAgICBleHByZXNzaW9uLCBhbmd1bGFyQ29yZUVudiwgYG5nOi8vJHt0eXBlLm5hbWV9L25nSW5qZWN0YWJsZURlZi5qc2AsIHN0YXRlbWVudHMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRlZjtcbiAgICB9LFxuICB9KTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVByb3ZpZGVkSW4ocHJvdmlkZWRJbjogVHlwZTxhbnk+fCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKTogRXhwcmVzc2lvbiB7XG4gIGlmIChwcm92aWRlZEluID09IG51bGwgfHwgdHlwZW9mIHByb3ZpZGVkSW4gPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIG5ldyBMaXRlcmFsRXhwcihwcm92aWRlZEluKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbmV3IFdyYXBwZWROb2RlRXhwcihwcm92aWRlZEluKTtcbiAgfVxufVxuXG50eXBlIFVzZUNsYXNzUHJvdmlkZXIgPSBJbmplY3RhYmxlICYgQ2xhc3NTYW5zUHJvdmlkZXIgJiB7ZGVwcz86IGFueVtdfTtcblxuZnVuY3Rpb24gaXNVc2VDbGFzc1Byb3ZpZGVyKG1ldGE6IEluamVjdGFibGUpOiBtZXRhIGlzIFVzZUNsYXNzUHJvdmlkZXIge1xuICByZXR1cm4gKG1ldGEgYXMgVXNlQ2xhc3NQcm92aWRlcikudXNlQ2xhc3MgIT09IHVuZGVmaW5lZDtcbn1cblxuY29uc3QgVVNFX1ZBTFVFID1cbiAgICBnZXRDbG9zdXJlU2FmZVByb3BlcnR5PFZhbHVlUHJvdmlkZXI+KHtwcm92aWRlOiBTdHJpbmcsIHVzZVZhbHVlOiBnZXRDbG9zdXJlU2FmZVByb3BlcnR5fSk7XG5cbmZ1bmN0aW9uIGlzVXNlVmFsdWVQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBJbmplY3RhYmxlJlZhbHVlU2Fuc1Byb3ZpZGVyIHtcbiAgcmV0dXJuIFVTRV9WQUxVRSBpbiBtZXRhO1xufVxuXG5mdW5jdGlvbiBpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBJbmplY3RhYmxlJkZhY3RvcnlTYW5zUHJvdmlkZXIge1xuICByZXR1cm4gKG1ldGEgYXMgRmFjdG9yeVNhbnNQcm92aWRlcikudXNlRmFjdG9yeSAhPT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBpc1VzZUV4aXN0aW5nUHJvdmlkZXIobWV0YTogSW5qZWN0YWJsZSk6IG1ldGEgaXMgSW5qZWN0YWJsZSZFeGlzdGluZ1NhbnNQcm92aWRlciB7XG4gIHJldHVybiAobWV0YSBhcyBFeGlzdGluZ1NhbnNQcm92aWRlcikudXNlRXhpc3RpbmcgIT09IHVuZGVmaW5lZDtcbn1cbiJdfQ==