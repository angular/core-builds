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
const GET_PROPERTY_NAME = {};
const USE_VALUE = getClosureSafeProperty({ provide: String, useValue: GET_PROPERTY_NAME }, GET_PROPERTY_NAME);
function isUseValueProvider(meta) {
    return USE_VALUE in meta;
}
function isUseFactoryProvider(meta) {
    return meta.useFactory !== undefined;
}
function isUseExistingProvider(meta) {
    return meta.useExisting !== undefined;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L2luamVjdGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFhLFdBQVcsRUFBOEMsZUFBZSxFQUFFLGlCQUFpQixJQUFJLG1CQUFtQixFQUFFLGFBQWEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBS2hMLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBRTNELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDN0MsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzNDLE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUloRTs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsSUFBZSxFQUFFLE9BQW9CO0lBQ3JFLHVGQUF1RjtJQUN2RixNQUFNLElBQUksR0FBZSxPQUFPLElBQUksRUFBQyxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7SUFFdkQsSUFBSSxHQUFHLEdBQVEsSUFBSSxDQUFDO0lBQ3BCLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1FBQzdDLEdBQUcsRUFBRSxHQUFHLEVBQUU7WUFDUixJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUU7Z0JBQ2hCLDJFQUEyRTtnQkFDM0UsTUFBTSxZQUFZLEdBQUcsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksb0JBQW9CLENBQUMsSUFBSSxDQUFDO29CQUN2RSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFNUQsTUFBTSxRQUFRLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRTNDLElBQUksUUFBUSxHQUFxQyxTQUFTLENBQUM7Z0JBQzNELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFO29CQUN2RixRQUFRLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUMzQztnQkFFRCwrRUFBK0U7Z0JBQy9FLDZDQUE2QztnQkFDN0MsSUFBSSxRQUFRLEdBQXlCLFNBQVMsQ0FBQztnQkFDL0MsSUFBSSxVQUFVLEdBQXlCLFNBQVMsQ0FBQztnQkFDakQsSUFBSSxRQUFRLEdBQXlCLFNBQVMsQ0FBQztnQkFDL0MsSUFBSSxXQUFXLEdBQXlCLFNBQVMsQ0FBQztnQkFFbEQsSUFBSSxDQUFDLFlBQVksRUFBRTtvQkFDakIseUZBQXlGO29CQUN6RixzRkFBc0Y7b0JBQ3RGLFVBQVU7b0JBQ1Ysc0NBQXNDO29CQUN0QyxRQUFRLEdBQUcsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQ3RDO3FCQUFNLElBQUksa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ25DLGlGQUFpRjtvQkFDakYsUUFBUSxHQUFHLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztpQkFDL0M7cUJBQU0sSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDbkMsMENBQTBDO29CQUMxQyxRQUFRLEdBQUcsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2lCQUMvQztxQkFBTSxJQUFJLG9CQUFvQixDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNyQyw0Q0FBNEM7b0JBQzVDLFVBQVUsR0FBRyxJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7aUJBQ25EO3FCQUFNLElBQUkscUJBQXFCLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ3RDLDZDQUE2QztvQkFDN0MsV0FBVyxHQUFHLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztpQkFDckQ7cUJBQU07b0JBQ0wseUZBQXlGO29CQUN6RixNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFvQixDQUFDLENBQUM7aUJBQ3ZDO2dCQUVELE1BQU0sRUFBQyxVQUFVLEVBQUUsVUFBVSxFQUFDLEdBQUcsbUJBQW1CLENBQUM7b0JBQ25ELElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtvQkFDZixJQUFJLEVBQUUsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDO29CQUMvQixVQUFVLEVBQUUsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztvQkFDOUMsUUFBUTtvQkFDUixVQUFVO29CQUNWLFFBQVE7b0JBQ1IsV0FBVztvQkFDWCxRQUFRO29CQUNSLFFBQVE7aUJBQ1QsQ0FBQyxDQUFDO2dCQUVILEdBQUcsR0FBRyxhQUFhLENBQ2YsVUFBVSxFQUFFLGNBQWMsRUFBRSxRQUFRLElBQUksQ0FBQyxJQUFJLHFCQUFxQixFQUFFLFVBQVUsQ0FBQyxDQUFDO2FBQ3JGO1lBQ0QsT0FBTyxHQUFHLENBQUM7UUFDYixDQUFDO0tBQ0YsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQUMsVUFBZ0Q7SUFDekUsSUFBSSxVQUFVLElBQUksSUFBSSxJQUFJLE9BQU8sVUFBVSxLQUFLLFFBQVEsRUFBRTtRQUN4RCxPQUFPLElBQUksV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQ3BDO1NBQU07UUFDTCxPQUFPLElBQUksZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQ3hDO0FBQ0gsQ0FBQztBQUlELFNBQVMsa0JBQWtCLENBQUMsSUFBZ0I7SUFDMUMsT0FBUSxJQUF5QixDQUFDLFFBQVEsS0FBSyxTQUFTLENBQUM7QUFDM0QsQ0FBQztBQUVELE1BQU0saUJBQWlCLEdBQUcsRUFBUyxDQUFDO0FBQ3BDLE1BQU0sU0FBUyxHQUFHLHNCQUFzQixDQUNwQyxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLGlCQUFpQixFQUFDLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztBQUV2RSxTQUFTLGtCQUFrQixDQUFDLElBQWdCO0lBQzFDLE9BQU8sU0FBUyxJQUFJLElBQUksQ0FBQztBQUMzQixDQUFDO0FBRUQsU0FBUyxvQkFBb0IsQ0FBQyxJQUFnQjtJQUM1QyxPQUFRLElBQTRCLENBQUMsVUFBVSxLQUFLLFNBQVMsQ0FBQztBQUNoRSxDQUFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxJQUFnQjtJQUM3QyxPQUFRLElBQTZCLENBQUMsV0FBVyxLQUFLLFNBQVMsQ0FBQztBQUNsRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0V4cHJlc3Npb24sIExpdGVyYWxFeHByLCBSM0RlcGVuZGVuY3lNZXRhZGF0YSwgUjNJbmplY3RhYmxlTWV0YWRhdGEsIFdyYXBwZWROb2RlRXhwciwgY29tcGlsZUluamVjdGFibGUgYXMgY29tcGlsZVIzSW5qZWN0YWJsZSwgaml0RXhwcmVzc2lvbn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuXG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJy4uLy4uL2RpL2luamVjdGFibGUnO1xuaW1wb3J0IHtDbGFzc1NhbnNQcm92aWRlciwgRXhpc3RpbmdTYW5zUHJvdmlkZXIsIEZhY3RvcnlTYW5zUHJvdmlkZXIsIFN0YXRpY0NsYXNzU2Fuc1Byb3ZpZGVyLCBWYWx1ZVByb3ZpZGVyLCBWYWx1ZVNhbnNQcm92aWRlcn0gZnJvbSAnLi4vLi4vZGkvcHJvdmlkZXInO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi90eXBlJztcbmltcG9ydCB7Z2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eX0gZnJvbSAnLi4vLi4vdXRpbC9wcm9wZXJ0eSc7XG5cbmltcG9ydCB7YW5ndWxhckNvcmVFbnZ9IGZyb20gJy4vZW52aXJvbm1lbnQnO1xuaW1wb3J0IHtOR19JTkpFQ1RBQkxFX0RFRn0gZnJvbSAnLi9maWVsZHMnO1xuaW1wb3J0IHtjb252ZXJ0RGVwZW5kZW5jaWVzLCByZWZsZWN0RGVwZW5kZW5jaWVzfSBmcm9tICcuL3V0aWwnO1xuXG5cblxuLyoqXG4gKiBDb21waWxlIGFuIEFuZ3VsYXIgaW5qZWN0YWJsZSBhY2NvcmRpbmcgdG8gaXRzIGBJbmplY3RhYmxlYCBtZXRhZGF0YSwgYW5kIHBhdGNoIHRoZSByZXN1bHRpbmdcbiAqIGBuZ0luamVjdGFibGVEZWZgIG9udG8gdGhlIGluamVjdGFibGUgdHlwZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVJbmplY3RhYmxlKHR5cGU6IFR5cGU8YW55Piwgc3JjTWV0YT86IEluamVjdGFibGUpOiB2b2lkIHtcbiAgLy8gQWxsb3cgdGhlIGNvbXBpbGF0aW9uIG9mIGEgY2xhc3Mgd2l0aCBhIGBASW5qZWN0YWJsZSgpYCBkZWNvcmF0b3Igd2l0aG91dCBwYXJhbWV0ZXJzXG4gIGNvbnN0IG1ldGE6IEluamVjdGFibGUgPSBzcmNNZXRhIHx8IHtwcm92aWRlZEluOiBudWxsfTtcblxuICBsZXQgZGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgTkdfSU5KRUNUQUJMRV9ERUYsIHtcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChkZWYgPT09IG51bGwpIHtcbiAgICAgICAgLy8gQ2hlY2sgd2hldGhlciB0aGUgaW5qZWN0YWJsZSBtZXRhZGF0YSBpbmNsdWRlcyBhIHByb3ZpZGVyIHNwZWNpZmljYXRpb24uXG4gICAgICAgIGNvbnN0IGhhc0FQcm92aWRlciA9IGlzVXNlQ2xhc3NQcm92aWRlcihtZXRhKSB8fCBpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhKSB8fFxuICAgICAgICAgICAgaXNVc2VWYWx1ZVByb3ZpZGVyKG1ldGEpIHx8IGlzVXNlRXhpc3RpbmdQcm92aWRlcihtZXRhKTtcblxuICAgICAgICBjb25zdCBjdG9yRGVwcyA9IHJlZmxlY3REZXBlbmRlbmNpZXModHlwZSk7XG5cbiAgICAgICAgbGV0IHVzZXJEZXBzOiBSM0RlcGVuZGVuY3lNZXRhZGF0YVtdfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKChpc1VzZUNsYXNzUHJvdmlkZXIobWV0YSkgfHwgaXNVc2VGYWN0b3J5UHJvdmlkZXIobWV0YSkpICYmIG1ldGEuZGVwcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdXNlckRlcHMgPSBjb252ZXJ0RGVwZW5kZW5jaWVzKG1ldGEuZGVwcyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEZWNpZGUgd2hpY2ggZmxhdm9yIG9mIGZhY3RvcnkgdG8gZ2VuZXJhdGUsIGJhc2VkIG9uIHRoZSBwcm92aWRlciBzcGVjaWZpZWQuXG4gICAgICAgIC8vIE9ubHkgb25lIG9mIHRoZSB1c2UqIGZpZWxkcyBzaG91bGQgYmUgc2V0LlxuICAgICAgICBsZXQgdXNlQ2xhc3M6IEV4cHJlc3Npb258dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICBsZXQgdXNlRmFjdG9yeTogRXhwcmVzc2lvbnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgIGxldCB1c2VWYWx1ZTogRXhwcmVzc2lvbnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgIGxldCB1c2VFeGlzdGluZzogRXhwcmVzc2lvbnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgaWYgKCFoYXNBUHJvdmlkZXIpIHtcbiAgICAgICAgICAvLyBJbiB0aGUgY2FzZSB0aGUgdXNlciBzcGVjaWZpZXMgYSB0eXBlIHByb3ZpZGVyLCB0cmVhdCBpdCBhcyB7cHJvdmlkZTogWCwgdXNlQ2xhc3M6IFh9LlxuICAgICAgICAgIC8vIFRoZSBkZXBzIHdpbGwgaGF2ZSBiZWVuIHJlZmxlY3RlZCBhYm92ZSwgY2F1c2luZyB0aGUgZmFjdG9yeSB0byBjcmVhdGUgdGhlIGNsYXNzIGJ5XG4gICAgICAgICAgLy8gY2FsbGluZ1xuICAgICAgICAgIC8vIGl0cyBjb25zdHJ1Y3RvciB3aXRoIGluamVjdGVkIGRlcHMuXG4gICAgICAgICAgdXNlQ2xhc3MgPSBuZXcgV3JhcHBlZE5vZGVFeHByKHR5cGUpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzVXNlQ2xhc3NQcm92aWRlcihtZXRhKSkge1xuICAgICAgICAgIC8vIFRoZSB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHVzZUNsYXNzLCBhbmQgbWF5IG9yIG1heSBub3QgaGF2ZSBwcm92aWRlZCBkZXBzLlxuICAgICAgICAgIHVzZUNsYXNzID0gbmV3IFdyYXBwZWROb2RlRXhwcihtZXRhLnVzZUNsYXNzKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1VzZVZhbHVlUHJvdmlkZXIobWV0YSkpIHtcbiAgICAgICAgICAvLyBUaGUgdXNlciBleHBsaWNpdGx5IHNwZWNpZmllZCB1c2VWYWx1ZS5cbiAgICAgICAgICB1c2VWYWx1ZSA9IG5ldyBXcmFwcGVkTm9kZUV4cHIobWV0YS51c2VWYWx1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNVc2VGYWN0b3J5UHJvdmlkZXIobWV0YSkpIHtcbiAgICAgICAgICAvLyBUaGUgdXNlciBleHBsaWNpdGx5IHNwZWNpZmllZCB1c2VGYWN0b3J5LlxuICAgICAgICAgIHVzZUZhY3RvcnkgPSBuZXcgV3JhcHBlZE5vZGVFeHByKG1ldGEudXNlRmFjdG9yeSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNVc2VFeGlzdGluZ1Byb3ZpZGVyKG1ldGEpKSB7XG4gICAgICAgICAgLy8gVGhlIHVzZXIgZXhwbGljaXRseSBzcGVjaWZpZWQgdXNlRXhpc3RpbmcuXG4gICAgICAgICAgdXNlRXhpc3RpbmcgPSBuZXcgV3JhcHBlZE5vZGVFeHByKG1ldGEudXNlRXhpc3RpbmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIENhbid0IGhhcHBlbiAtIGVpdGhlciBoYXNBUHJvdmlkZXIgd2lsbCBiZSBmYWxzZSwgb3Igb25lIG9mIHRoZSBwcm92aWRlcnMgd2lsbCBiZSBzZXQuXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnJlYWNoYWJsZSBzdGF0ZS5gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHtleHByZXNzaW9uLCBzdGF0ZW1lbnRzfSA9IGNvbXBpbGVSM0luamVjdGFibGUoe1xuICAgICAgICAgIG5hbWU6IHR5cGUubmFtZSxcbiAgICAgICAgICB0eXBlOiBuZXcgV3JhcHBlZE5vZGVFeHByKHR5cGUpLFxuICAgICAgICAgIHByb3ZpZGVkSW46IGNvbXB1dGVQcm92aWRlZEluKG1ldGEucHJvdmlkZWRJbiksXG4gICAgICAgICAgdXNlQ2xhc3MsXG4gICAgICAgICAgdXNlRmFjdG9yeSxcbiAgICAgICAgICB1c2VWYWx1ZSxcbiAgICAgICAgICB1c2VFeGlzdGluZyxcbiAgICAgICAgICBjdG9yRGVwcyxcbiAgICAgICAgICB1c2VyRGVwcyxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZGVmID0gaml0RXhwcmVzc2lvbihcbiAgICAgICAgICAgIGV4cHJlc3Npb24sIGFuZ3VsYXJDb3JlRW52LCBgbmc6Ly8ke3R5cGUubmFtZX0vbmdJbmplY3RhYmxlRGVmLmpzYCwgc3RhdGVtZW50cyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGVmO1xuICAgIH0sXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUHJvdmlkZWRJbihwcm92aWRlZEluOiBUeXBlPGFueT58IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpOiBFeHByZXNzaW9uIHtcbiAgaWYgKHByb3ZpZGVkSW4gPT0gbnVsbCB8fCB0eXBlb2YgcHJvdmlkZWRJbiA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gbmV3IExpdGVyYWxFeHByKHByb3ZpZGVkSW4pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBuZXcgV3JhcHBlZE5vZGVFeHByKHByb3ZpZGVkSW4pO1xuICB9XG59XG5cbnR5cGUgVXNlQ2xhc3NQcm92aWRlciA9IEluamVjdGFibGUgJiBDbGFzc1NhbnNQcm92aWRlciAmIHtkZXBzPzogYW55W119O1xuXG5mdW5jdGlvbiBpc1VzZUNsYXNzUHJvdmlkZXIobWV0YTogSW5qZWN0YWJsZSk6IG1ldGEgaXMgVXNlQ2xhc3NQcm92aWRlciB7XG4gIHJldHVybiAobWV0YSBhcyBVc2VDbGFzc1Byb3ZpZGVyKS51c2VDbGFzcyAhPT0gdW5kZWZpbmVkO1xufVxuXG5jb25zdCBHRVRfUFJPUEVSVFlfTkFNRSA9IHt9IGFzIGFueTtcbmNvbnN0IFVTRV9WQUxVRSA9IGdldENsb3N1cmVTYWZlUHJvcGVydHk8VmFsdWVQcm92aWRlcj4oXG4gICAge3Byb3ZpZGU6IFN0cmluZywgdXNlVmFsdWU6IEdFVF9QUk9QRVJUWV9OQU1FfSwgR0VUX1BST1BFUlRZX05BTUUpO1xuXG5mdW5jdGlvbiBpc1VzZVZhbHVlUHJvdmlkZXIobWV0YTogSW5qZWN0YWJsZSk6IG1ldGEgaXMgSW5qZWN0YWJsZSZWYWx1ZVNhbnNQcm92aWRlciB7XG4gIHJldHVybiBVU0VfVkFMVUUgaW4gbWV0YTtcbn1cblxuZnVuY3Rpb24gaXNVc2VGYWN0b3J5UHJvdmlkZXIobWV0YTogSW5qZWN0YWJsZSk6IG1ldGEgaXMgSW5qZWN0YWJsZSZGYWN0b3J5U2Fuc1Byb3ZpZGVyIHtcbiAgcmV0dXJuIChtZXRhIGFzIEZhY3RvcnlTYW5zUHJvdmlkZXIpLnVzZUZhY3RvcnkgIT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaXNVc2VFeGlzdGluZ1Byb3ZpZGVyKG1ldGE6IEluamVjdGFibGUpOiBtZXRhIGlzIEluamVjdGFibGUmRXhpc3RpbmdTYW5zUHJvdmlkZXIge1xuICByZXR1cm4gKG1ldGEgYXMgRXhpc3RpbmdTYW5zUHJvdmlkZXIpLnVzZUV4aXN0aW5nICE9PSB1bmRlZmluZWQ7XG59XG4iXX0=