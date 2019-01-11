/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NG_INJECTABLE_DEF } from '../../di/interface/defs';
import { getClosureSafeProperty } from '../../util/property';
import { getCompilerFacade } from './compiler_facade';
import { angularCoreEnv } from './environment';
import { convertDependencies, reflectDependencies } from './util';
/**
 * Compile an Angular injectable according to its `Injectable` metadata, and patch the resulting
 * `ngInjectableDef` onto the injectable type.
 */
export function compileInjectable(type, srcMeta) {
    var def = null;
    // if NG_INJECTABLE_DEF is already defined on this class then don't overwrite it
    if (type.hasOwnProperty(NG_INJECTABLE_DEF))
        return;
    Object.defineProperty(type, NG_INJECTABLE_DEF, {
        get: function () {
            if (def === null) {
                // Allow the compilation of a class with a `@Injectable()` decorator without parameters
                var meta = srcMeta || { providedIn: null };
                var hasAProvider = isUseClassProvider(meta) || isUseFactoryProvider(meta) ||
                    isUseValueProvider(meta) || isUseExistingProvider(meta);
                var compilerMeta = {
                    name: type.name,
                    type: type,
                    typeArgumentCount: 0,
                    providedIn: meta.providedIn,
                    ctorDeps: reflectDependencies(type),
                    userDeps: undefined
                };
                if ((isUseClassProvider(meta) || isUseFactoryProvider(meta)) && meta.deps !== undefined) {
                    compilerMeta.userDeps = convertDependencies(meta.deps);
                }
                if (!hasAProvider) {
                    // In the case the user specifies a type provider, treat it as {provide: X, useClass: X}.
                    // The deps will have been reflected above, causing the factory to create the class by
                    // calling
                    // its constructor with injected deps.
                    compilerMeta.useClass = type;
                }
                else if (isUseClassProvider(meta)) {
                    // The user explicitly specified useClass, and may or may not have provided deps.
                    compilerMeta.useClass = meta.useClass;
                }
                else if (isUseValueProvider(meta)) {
                    // The user explicitly specified useValue.
                    compilerMeta.useValue = meta.useValue;
                }
                else if (isUseFactoryProvider(meta)) {
                    // The user explicitly specified useFactory.
                    compilerMeta.useFactory = meta.useFactory;
                }
                else if (isUseExistingProvider(meta)) {
                    // The user explicitly specified useExisting.
                    compilerMeta.useExisting = meta.useExisting;
                }
                else {
                    // Can't happen - either hasAProvider will be false, or one of the providers will be set.
                    throw new Error("Unreachable state.");
                }
                def = getCompilerFacade().compileInjectable(angularCoreEnv, "ng://" + type.name + "/ngInjectableDef.js", compilerMeta);
            }
            return def;
        },
    });
}
var ɵ0 = getClosureSafeProperty;
var USE_VALUE = getClosureSafeProperty({ provide: String, useValue: ɵ0 });
function isUseClassProvider(meta) {
    return meta.useClass !== undefined;
}
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L2luamVjdGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBR0gsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFHMUQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFM0QsT0FBTyxFQUE2QixpQkFBaUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2hGLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDN0MsT0FBTyxFQUFDLG1CQUFtQixFQUFFLG1CQUFtQixFQUFDLE1BQU0sUUFBUSxDQUFDO0FBSWhFOzs7R0FHRztBQUNILE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxJQUFlLEVBQUUsT0FBb0I7SUFDckUsSUFBSSxHQUFHLEdBQVEsSUFBSSxDQUFDO0lBRXBCLGdGQUFnRjtJQUNoRixJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUM7UUFBRSxPQUFPO0lBRW5ELE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1FBQzdDLEdBQUcsRUFBRTtZQUNILElBQUksR0FBRyxLQUFLLElBQUksRUFBRTtnQkFDaEIsdUZBQXVGO2dCQUN2RixJQUFNLElBQUksR0FBZSxPQUFPLElBQUksRUFBQyxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7Z0JBQ3ZELElBQU0sWUFBWSxHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLG9CQUFvQixDQUFDLElBQUksQ0FBQztvQkFDdkUsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRzVELElBQU0sWUFBWSxHQUErQjtvQkFDL0MsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO29CQUNmLElBQUksRUFBRSxJQUFJO29CQUNWLGlCQUFpQixFQUFFLENBQUM7b0JBQ3BCLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtvQkFDM0IsUUFBUSxFQUFFLG1CQUFtQixDQUFDLElBQUksQ0FBQztvQkFDbkMsUUFBUSxFQUFFLFNBQVM7aUJBQ3BCLENBQUM7Z0JBQ0YsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUU7b0JBQ3ZGLFlBQVksQ0FBQyxRQUFRLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUN4RDtnQkFDRCxJQUFJLENBQUMsWUFBWSxFQUFFO29CQUNqQix5RkFBeUY7b0JBQ3pGLHNGQUFzRjtvQkFDdEYsVUFBVTtvQkFDVixzQ0FBc0M7b0JBQ3RDLFlBQVksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO2lCQUM5QjtxQkFBTSxJQUFJLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNuQyxpRkFBaUY7b0JBQ2pGLFlBQVksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztpQkFDdkM7cUJBQU0sSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDbkMsMENBQTBDO29CQUMxQyxZQUFZLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7aUJBQ3ZDO3FCQUFNLElBQUksb0JBQW9CLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ3JDLDRDQUE0QztvQkFDNUMsWUFBWSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO2lCQUMzQztxQkFBTSxJQUFJLHFCQUFxQixDQUFDLElBQUksQ0FBQyxFQUFFO29CQUN0Qyw2Q0FBNkM7b0JBQzdDLFlBQVksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztpQkFDN0M7cUJBQU07b0JBQ0wseUZBQXlGO29CQUN6RixNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFvQixDQUFDLENBQUM7aUJBQ3ZDO2dCQUNELEdBQUcsR0FBRyxpQkFBaUIsRUFBRSxDQUFDLGlCQUFpQixDQUN2QyxjQUFjLEVBQUUsVUFBUSxJQUFJLENBQUMsSUFBSSx3QkFBcUIsRUFBRSxZQUFZLENBQUMsQ0FBQzthQUMzRTtZQUNELE9BQU8sR0FBRyxDQUFDO1FBQ2IsQ0FBQztLQUNGLENBQUMsQ0FBQztBQUNMLENBQUM7U0FLcUUsc0JBQXNCO0FBRDVGLElBQU0sU0FBUyxHQUNYLHNCQUFzQixDQUFnQixFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxJQUF3QixFQUFDLENBQUMsQ0FBQztBQUUvRixTQUFTLGtCQUFrQixDQUFDLElBQWdCO0lBQzFDLE9BQVEsSUFBeUIsQ0FBQyxRQUFRLEtBQUssU0FBUyxDQUFDO0FBQzNELENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUFDLElBQWdCO0lBQzFDLE9BQU8sU0FBUyxJQUFJLElBQUksQ0FBQztBQUMzQixDQUFDO0FBRUQsU0FBUyxvQkFBb0IsQ0FBQyxJQUFnQjtJQUM1QyxPQUFRLElBQTRCLENBQUMsVUFBVSxLQUFLLFNBQVMsQ0FBQztBQUNoRSxDQUFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxJQUFnQjtJQUM3QyxPQUFRLElBQTZCLENBQUMsV0FBVyxLQUFLLFNBQVMsQ0FBQztBQUNsRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJy4uLy4uL2RpL2luamVjdGFibGUnO1xuaW1wb3J0IHtOR19JTkpFQ1RBQkxFX0RFRn0gZnJvbSAnLi4vLi4vZGkvaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtDbGFzc1NhbnNQcm92aWRlciwgRXhpc3RpbmdTYW5zUHJvdmlkZXIsIEZhY3RvcnlTYW5zUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXIsIFZhbHVlU2Fuc1Byb3ZpZGVyfSBmcm9tICcuLi8uLi9kaS9pbnRlcmZhY2UvcHJvdmlkZXInO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge2dldENsb3N1cmVTYWZlUHJvcGVydHl9IGZyb20gJy4uLy4uL3V0aWwvcHJvcGVydHknO1xuXG5pbXBvcnQge1IzSW5qZWN0YWJsZU1ldGFkYXRhRmFjYWRlLCBnZXRDb21waWxlckZhY2FkZX0gZnJvbSAnLi9jb21waWxlcl9mYWNhZGUnO1xuaW1wb3J0IHthbmd1bGFyQ29yZUVudn0gZnJvbSAnLi9lbnZpcm9ubWVudCc7XG5pbXBvcnQge2NvbnZlcnREZXBlbmRlbmNpZXMsIHJlZmxlY3REZXBlbmRlbmNpZXN9IGZyb20gJy4vdXRpbCc7XG5cblxuXG4vKipcbiAqIENvbXBpbGUgYW4gQW5ndWxhciBpbmplY3RhYmxlIGFjY29yZGluZyB0byBpdHMgYEluamVjdGFibGVgIG1ldGFkYXRhLCBhbmQgcGF0Y2ggdGhlIHJlc3VsdGluZ1xuICogYG5nSW5qZWN0YWJsZURlZmAgb250byB0aGUgaW5qZWN0YWJsZSB0eXBlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZUluamVjdGFibGUodHlwZTogVHlwZTxhbnk+LCBzcmNNZXRhPzogSW5qZWN0YWJsZSk6IHZvaWQge1xuICBsZXQgZGVmOiBhbnkgPSBudWxsO1xuXG4gIC8vIGlmIE5HX0lOSkVDVEFCTEVfREVGIGlzIGFscmVhZHkgZGVmaW5lZCBvbiB0aGlzIGNsYXNzIHRoZW4gZG9uJ3Qgb3ZlcndyaXRlIGl0XG4gIGlmICh0eXBlLmhhc093blByb3BlcnR5KE5HX0lOSkVDVEFCTEVfREVGKSkgcmV0dXJuO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBOR19JTkpFQ1RBQkxFX0RFRiwge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKGRlZiA9PT0gbnVsbCkge1xuICAgICAgICAvLyBBbGxvdyB0aGUgY29tcGlsYXRpb24gb2YgYSBjbGFzcyB3aXRoIGEgYEBJbmplY3RhYmxlKClgIGRlY29yYXRvciB3aXRob3V0IHBhcmFtZXRlcnNcbiAgICAgICAgY29uc3QgbWV0YTogSW5qZWN0YWJsZSA9IHNyY01ldGEgfHwge3Byb3ZpZGVkSW46IG51bGx9O1xuICAgICAgICBjb25zdCBoYXNBUHJvdmlkZXIgPSBpc1VzZUNsYXNzUHJvdmlkZXIobWV0YSkgfHwgaXNVc2VGYWN0b3J5UHJvdmlkZXIobWV0YSkgfHxcbiAgICAgICAgICAgIGlzVXNlVmFsdWVQcm92aWRlcihtZXRhKSB8fCBpc1VzZUV4aXN0aW5nUHJvdmlkZXIobWV0YSk7XG5cblxuICAgICAgICBjb25zdCBjb21waWxlck1ldGE6IFIzSW5qZWN0YWJsZU1ldGFkYXRhRmFjYWRlID0ge1xuICAgICAgICAgIG5hbWU6IHR5cGUubmFtZSxcbiAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgIHR5cGVBcmd1bWVudENvdW50OiAwLFxuICAgICAgICAgIHByb3ZpZGVkSW46IG1ldGEucHJvdmlkZWRJbixcbiAgICAgICAgICBjdG9yRGVwczogcmVmbGVjdERlcGVuZGVuY2llcyh0eXBlKSxcbiAgICAgICAgICB1c2VyRGVwczogdW5kZWZpbmVkXG4gICAgICAgIH07XG4gICAgICAgIGlmICgoaXNVc2VDbGFzc1Byb3ZpZGVyKG1ldGEpIHx8IGlzVXNlRmFjdG9yeVByb3ZpZGVyKG1ldGEpKSAmJiBtZXRhLmRlcHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGNvbXBpbGVyTWV0YS51c2VyRGVwcyA9IGNvbnZlcnREZXBlbmRlbmNpZXMobWV0YS5kZXBzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWhhc0FQcm92aWRlcikge1xuICAgICAgICAgIC8vIEluIHRoZSBjYXNlIHRoZSB1c2VyIHNwZWNpZmllcyBhIHR5cGUgcHJvdmlkZXIsIHRyZWF0IGl0IGFzIHtwcm92aWRlOiBYLCB1c2VDbGFzczogWH0uXG4gICAgICAgICAgLy8gVGhlIGRlcHMgd2lsbCBoYXZlIGJlZW4gcmVmbGVjdGVkIGFib3ZlLCBjYXVzaW5nIHRoZSBmYWN0b3J5IHRvIGNyZWF0ZSB0aGUgY2xhc3MgYnlcbiAgICAgICAgICAvLyBjYWxsaW5nXG4gICAgICAgICAgLy8gaXRzIGNvbnN0cnVjdG9yIHdpdGggaW5qZWN0ZWQgZGVwcy5cbiAgICAgICAgICBjb21waWxlck1ldGEudXNlQ2xhc3MgPSB0eXBlO1xuICAgICAgICB9IGVsc2UgaWYgKGlzVXNlQ2xhc3NQcm92aWRlcihtZXRhKSkge1xuICAgICAgICAgIC8vIFRoZSB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHVzZUNsYXNzLCBhbmQgbWF5IG9yIG1heSBub3QgaGF2ZSBwcm92aWRlZCBkZXBzLlxuICAgICAgICAgIGNvbXBpbGVyTWV0YS51c2VDbGFzcyA9IG1ldGEudXNlQ2xhc3M7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNVc2VWYWx1ZVByb3ZpZGVyKG1ldGEpKSB7XG4gICAgICAgICAgLy8gVGhlIHVzZXIgZXhwbGljaXRseSBzcGVjaWZpZWQgdXNlVmFsdWUuXG4gICAgICAgICAgY29tcGlsZXJNZXRhLnVzZVZhbHVlID0gbWV0YS51c2VWYWx1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhKSkge1xuICAgICAgICAgIC8vIFRoZSB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHVzZUZhY3RvcnkuXG4gICAgICAgICAgY29tcGlsZXJNZXRhLnVzZUZhY3RvcnkgPSBtZXRhLnVzZUZhY3Rvcnk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNVc2VFeGlzdGluZ1Byb3ZpZGVyKG1ldGEpKSB7XG4gICAgICAgICAgLy8gVGhlIHVzZXIgZXhwbGljaXRseSBzcGVjaWZpZWQgdXNlRXhpc3RpbmcuXG4gICAgICAgICAgY29tcGlsZXJNZXRhLnVzZUV4aXN0aW5nID0gbWV0YS51c2VFeGlzdGluZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBDYW4ndCBoYXBwZW4gLSBlaXRoZXIgaGFzQVByb3ZpZGVyIHdpbGwgYmUgZmFsc2UsIG9yIG9uZSBvZiB0aGUgcHJvdmlkZXJzIHdpbGwgYmUgc2V0LlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5yZWFjaGFibGUgc3RhdGUuYCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVmID0gZ2V0Q29tcGlsZXJGYWNhZGUoKS5jb21waWxlSW5qZWN0YWJsZShcbiAgICAgICAgICAgIGFuZ3VsYXJDb3JlRW52LCBgbmc6Ly8ke3R5cGUubmFtZX0vbmdJbmplY3RhYmxlRGVmLmpzYCwgY29tcGlsZXJNZXRhKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZWY7XG4gICAgfSxcbiAgfSk7XG59XG5cbnR5cGUgVXNlQ2xhc3NQcm92aWRlciA9IEluamVjdGFibGUgJiBDbGFzc1NhbnNQcm92aWRlciAmIHtkZXBzPzogYW55W119O1xuXG5jb25zdCBVU0VfVkFMVUUgPVxuICAgIGdldENsb3N1cmVTYWZlUHJvcGVydHk8VmFsdWVQcm92aWRlcj4oe3Byb3ZpZGU6IFN0cmluZywgdXNlVmFsdWU6IGdldENsb3N1cmVTYWZlUHJvcGVydHl9KTtcblxuZnVuY3Rpb24gaXNVc2VDbGFzc1Byb3ZpZGVyKG1ldGE6IEluamVjdGFibGUpOiBtZXRhIGlzIFVzZUNsYXNzUHJvdmlkZXIge1xuICByZXR1cm4gKG1ldGEgYXMgVXNlQ2xhc3NQcm92aWRlcikudXNlQ2xhc3MgIT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaXNVc2VWYWx1ZVByb3ZpZGVyKG1ldGE6IEluamVjdGFibGUpOiBtZXRhIGlzIEluamVjdGFibGUmVmFsdWVTYW5zUHJvdmlkZXIge1xuICByZXR1cm4gVVNFX1ZBTFVFIGluIG1ldGE7XG59XG5cbmZ1bmN0aW9uIGlzVXNlRmFjdG9yeVByb3ZpZGVyKG1ldGE6IEluamVjdGFibGUpOiBtZXRhIGlzIEluamVjdGFibGUmRmFjdG9yeVNhbnNQcm92aWRlciB7XG4gIHJldHVybiAobWV0YSBhcyBGYWN0b3J5U2Fuc1Byb3ZpZGVyKS51c2VGYWN0b3J5ICE9PSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGlzVXNlRXhpc3RpbmdQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBJbmplY3RhYmxlJkV4aXN0aW5nU2Fuc1Byb3ZpZGVyIHtcbiAgcmV0dXJuIChtZXRhIGFzIEV4aXN0aW5nU2Fuc1Byb3ZpZGVyKS51c2VFeGlzdGluZyAhPT0gdW5kZWZpbmVkO1xufVxuIl19