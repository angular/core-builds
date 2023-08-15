/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { noSideEffects } from '../util/closure';
/**
 * The name of a field that Angular monkey-patches onto a class
 * to keep track of the Promise that represents dependency loading
 * state.
 */
const ASYNC_COMPONENT_METADATA = '__ngAsyncComponentMetadata__';
/**
 * If a given component has unresolved async metadata - this function returns a reference to
 * a Promise that represents dependency loading. Otherwise - this function returns `null`.
 */
export function getAsyncClassMetadata(type) {
    const componentClass = type; // cast to `any`, so that we can monkey-patch it
    return componentClass[ASYNC_COMPONENT_METADATA] ?? null;
}
/**
 * Handles the process of applying metadata info to a component class in case
 * component template had `{#defer}` blocks (thus some dependencies became deferrable).
 *
 * @param type Component class where metadata should be added
 * @param dependencyLoaderFn Function that loads dependencies
 * @param metadataSetterFn Function that forms a scope in which the `setClassMetadata` is invoked
 */
export function setClassMetadataAsync(type, dependencyLoaderFn, metadataSetterFn) {
    const componentClass = type; // cast to `any`, so that we can monkey-patch it
    componentClass[ASYNC_COMPONENT_METADATA] =
        Promise.all(dependencyLoaderFn()).then(dependencies => {
            metadataSetterFn(...dependencies);
            // Metadata is now set, reset field value to indicate that this component
            // can by used/compiled synchronously.
            componentClass[ASYNC_COMPONENT_METADATA] = null;
            return dependencies;
        });
    return componentClass[ASYNC_COMPONENT_METADATA];
}
/**
 * Adds decorator, constructor, and property metadata to a given type via static metadata fields
 * on the type.
 *
 * These metadata fields can later be read with Angular's `ReflectionCapabilities` API.
 *
 * Calls to `setClassMetadata` can be guarded by ngDevMode, resulting in the metadata assignments
 * being tree-shaken away during production builds.
 */
export function setClassMetadata(type, decorators, ctorParameters, propDecorators) {
    return noSideEffects(() => {
        const clazz = type;
        if (decorators !== null) {
            if (clazz.hasOwnProperty('decorators') && clazz.decorators !== undefined) {
                clazz.decorators.push(...decorators);
            }
            else {
                clazz.decorators = decorators;
            }
        }
        if (ctorParameters !== null) {
            // Rather than merging, clobber the existing parameters. If other projects exist which
            // use tsickle-style annotations and reflect over them in the same way, this could
            // cause issues, but that is vanishingly unlikely.
            clazz.ctorParameters = ctorParameters;
        }
        if (propDecorators !== null) {
            // The property decorator objects are merged as it is possible different fields have
            // different decorator types. Decorators on individual fields are not merged, as it's
            // also incredibly unlikely that a field will be decorated both with an Angular
            // decorator and a non-Angular decorator that's also been downleveled.
            if (clazz.hasOwnProperty('propDecorators') && clazz.propDecorators !== undefined) {
                clazz.propDecorators = { ...clazz.propDecorators, ...propDecorators };
            }
            else {
                clazz.propDecorators = propDecorators;
            }
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YWRhdGEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL21ldGFkYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQVE5Qzs7OztHQUlHO0FBQ0gsTUFBTSx3QkFBd0IsR0FBRyw4QkFBOEIsQ0FBQztBQUVoRTs7O0dBR0c7QUFDSCxNQUFNLFVBQVUscUJBQXFCLENBQUMsSUFBbUI7SUFDdkQsTUFBTSxjQUFjLEdBQUcsSUFBVyxDQUFDLENBQUUsZ0RBQWdEO0lBQ3JGLE9BQU8sY0FBYyxDQUFDLHdCQUF3QixDQUFDLElBQUksSUFBSSxDQUFDO0FBQzFELENBQUM7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxVQUFVLHFCQUFxQixDQUNqQyxJQUFlLEVBQUUsa0JBQXVELEVBQ3hFLGdCQUFxRDtJQUN2RCxNQUFNLGNBQWMsR0FBRyxJQUFXLENBQUMsQ0FBRSxnREFBZ0Q7SUFDckYsY0FBYyxDQUFDLHdCQUF3QixDQUFDO1FBQ3BDLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRTtZQUNwRCxnQkFBZ0IsQ0FBQyxHQUFHLFlBQVksQ0FBQyxDQUFDO1lBQ2xDLHlFQUF5RTtZQUN6RSxzQ0FBc0M7WUFDdEMsY0FBYyxDQUFDLHdCQUF3QixDQUFDLEdBQUcsSUFBSSxDQUFDO1lBRWhELE9BQU8sWUFBWSxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxDQUFDO0lBRVAsT0FBTyxjQUFjLENBQUMsd0JBQXdCLENBQUMsQ0FBQztBQUNsRCxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLFVBQVUsZ0JBQWdCLENBQzVCLElBQWUsRUFBRSxVQUFzQixFQUFFLGNBQWtDLEVBQzNFLGNBQTJDO0lBQzdDLE9BQU8sYUFBYSxDQUFDLEdBQUcsRUFBRTtRQUNqQixNQUFNLEtBQUssR0FBRyxJQUF3QixDQUFDO1FBRXZDLElBQUksVUFBVSxLQUFLLElBQUksRUFBRTtZQUN2QixJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLFVBQVUsS0FBSyxTQUFTLEVBQUU7Z0JBQ3hFLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUM7YUFDdEM7aUJBQU07Z0JBQ0wsS0FBSyxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7YUFDL0I7U0FDRjtRQUNELElBQUksY0FBYyxLQUFLLElBQUksRUFBRTtZQUMzQixzRkFBc0Y7WUFDdEYsa0ZBQWtGO1lBQ2xGLGtEQUFrRDtZQUNsRCxLQUFLLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQztTQUN2QztRQUNELElBQUksY0FBYyxLQUFLLElBQUksRUFBRTtZQUMzQixvRkFBb0Y7WUFDcEYscUZBQXFGO1lBQ3JGLCtFQUErRTtZQUMvRSxzRUFBc0U7WUFDdEUsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLElBQUksS0FBSyxDQUFDLGNBQWMsS0FBSyxTQUFTLEVBQUU7Z0JBQ2hGLEtBQUssQ0FBQyxjQUFjLEdBQUcsRUFBQyxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsR0FBRyxjQUFjLEVBQUMsQ0FBQzthQUNyRTtpQkFBTTtnQkFDTCxLQUFLLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQzthQUN2QztTQUNGO0lBQ0gsQ0FBQyxDQUFVLENBQUM7QUFDckIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7bm9TaWRlRWZmZWN0c30gZnJvbSAnLi4vdXRpbC9jbG9zdXJlJztcblxuaW50ZXJmYWNlIFR5cGVXaXRoTWV0YWRhdGEgZXh0ZW5kcyBUeXBlPGFueT4ge1xuICBkZWNvcmF0b3JzPzogYW55W107XG4gIGN0b3JQYXJhbWV0ZXJzPzogKCkgPT4gYW55W107XG4gIHByb3BEZWNvcmF0b3JzPzoge1tmaWVsZDogc3RyaW5nXTogYW55fTtcbn1cblxuLyoqXG4gKiBUaGUgbmFtZSBvZiBhIGZpZWxkIHRoYXQgQW5ndWxhciBtb25rZXktcGF0Y2hlcyBvbnRvIGEgY2xhc3NcbiAqIHRvIGtlZXAgdHJhY2sgb2YgdGhlIFByb21pc2UgdGhhdCByZXByZXNlbnRzIGRlcGVuZGVuY3kgbG9hZGluZ1xuICogc3RhdGUuXG4gKi9cbmNvbnN0IEFTWU5DX0NPTVBPTkVOVF9NRVRBREFUQSA9ICdfX25nQXN5bmNDb21wb25lbnRNZXRhZGF0YV9fJztcblxuLyoqXG4gKiBJZiBhIGdpdmVuIGNvbXBvbmVudCBoYXMgdW5yZXNvbHZlZCBhc3luYyBtZXRhZGF0YSAtIHRoaXMgZnVuY3Rpb24gcmV0dXJucyBhIHJlZmVyZW5jZSB0b1xuICogYSBQcm9taXNlIHRoYXQgcmVwcmVzZW50cyBkZXBlbmRlbmN5IGxvYWRpbmcuIE90aGVyd2lzZSAtIHRoaXMgZnVuY3Rpb24gcmV0dXJucyBgbnVsbGAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRBc3luY0NsYXNzTWV0YWRhdGEodHlwZTogVHlwZTx1bmtub3duPik6IFByb21pc2U8QXJyYXk8VHlwZTx1bmtub3duPj4+fG51bGwge1xuICBjb25zdCBjb21wb25lbnRDbGFzcyA9IHR5cGUgYXMgYW55OyAgLy8gY2FzdCB0byBgYW55YCwgc28gdGhhdCB3ZSBjYW4gbW9ua2V5LXBhdGNoIGl0XG4gIHJldHVybiBjb21wb25lbnRDbGFzc1tBU1lOQ19DT01QT05FTlRfTUVUQURBVEFdID8/IG51bGw7XG59XG5cbi8qKlxuICogSGFuZGxlcyB0aGUgcHJvY2VzcyBvZiBhcHBseWluZyBtZXRhZGF0YSBpbmZvIHRvIGEgY29tcG9uZW50IGNsYXNzIGluIGNhc2VcbiAqIGNvbXBvbmVudCB0ZW1wbGF0ZSBoYWQgYHsjZGVmZXJ9YCBibG9ja3MgKHRodXMgc29tZSBkZXBlbmRlbmNpZXMgYmVjYW1lIGRlZmVycmFibGUpLlxuICpcbiAqIEBwYXJhbSB0eXBlIENvbXBvbmVudCBjbGFzcyB3aGVyZSBtZXRhZGF0YSBzaG91bGQgYmUgYWRkZWRcbiAqIEBwYXJhbSBkZXBlbmRlbmN5TG9hZGVyRm4gRnVuY3Rpb24gdGhhdCBsb2FkcyBkZXBlbmRlbmNpZXNcbiAqIEBwYXJhbSBtZXRhZGF0YVNldHRlckZuIEZ1bmN0aW9uIHRoYXQgZm9ybXMgYSBzY29wZSBpbiB3aGljaCB0aGUgYHNldENsYXNzTWV0YWRhdGFgIGlzIGludm9rZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldENsYXNzTWV0YWRhdGFBc3luYyhcbiAgICB0eXBlOiBUeXBlPGFueT4sIGRlcGVuZGVuY3lMb2FkZXJGbjogKCkgPT4gQXJyYXk8UHJvbWlzZTxUeXBlPHVua25vd24+Pj4sXG4gICAgbWV0YWRhdGFTZXR0ZXJGbjogKC4uLnR5cGVzOiBUeXBlPHVua25vd24+W10pID0+IHZvaWQpOiBQcm9taXNlPEFycmF5PFR5cGU8dW5rbm93bj4+PiB7XG4gIGNvbnN0IGNvbXBvbmVudENsYXNzID0gdHlwZSBhcyBhbnk7ICAvLyBjYXN0IHRvIGBhbnlgLCBzbyB0aGF0IHdlIGNhbiBtb25rZXktcGF0Y2ggaXRcbiAgY29tcG9uZW50Q2xhc3NbQVNZTkNfQ09NUE9ORU5UX01FVEFEQVRBXSA9XG4gICAgICBQcm9taXNlLmFsbChkZXBlbmRlbmN5TG9hZGVyRm4oKSkudGhlbihkZXBlbmRlbmNpZXMgPT4ge1xuICAgICAgICBtZXRhZGF0YVNldHRlckZuKC4uLmRlcGVuZGVuY2llcyk7XG4gICAgICAgIC8vIE1ldGFkYXRhIGlzIG5vdyBzZXQsIHJlc2V0IGZpZWxkIHZhbHVlIHRvIGluZGljYXRlIHRoYXQgdGhpcyBjb21wb25lbnRcbiAgICAgICAgLy8gY2FuIGJ5IHVzZWQvY29tcGlsZWQgc3luY2hyb25vdXNseS5cbiAgICAgICAgY29tcG9uZW50Q2xhc3NbQVNZTkNfQ09NUE9ORU5UX01FVEFEQVRBXSA9IG51bGw7XG5cbiAgICAgICAgcmV0dXJuIGRlcGVuZGVuY2llcztcbiAgICAgIH0pO1xuXG4gIHJldHVybiBjb21wb25lbnRDbGFzc1tBU1lOQ19DT01QT05FTlRfTUVUQURBVEFdO1xufVxuXG4vKipcbiAqIEFkZHMgZGVjb3JhdG9yLCBjb25zdHJ1Y3RvciwgYW5kIHByb3BlcnR5IG1ldGFkYXRhIHRvIGEgZ2l2ZW4gdHlwZSB2aWEgc3RhdGljIG1ldGFkYXRhIGZpZWxkc1xuICogb24gdGhlIHR5cGUuXG4gKlxuICogVGhlc2UgbWV0YWRhdGEgZmllbGRzIGNhbiBsYXRlciBiZSByZWFkIHdpdGggQW5ndWxhcidzIGBSZWZsZWN0aW9uQ2FwYWJpbGl0aWVzYCBBUEkuXG4gKlxuICogQ2FsbHMgdG8gYHNldENsYXNzTWV0YWRhdGFgIGNhbiBiZSBndWFyZGVkIGJ5IG5nRGV2TW9kZSwgcmVzdWx0aW5nIGluIHRoZSBtZXRhZGF0YSBhc3NpZ25tZW50c1xuICogYmVpbmcgdHJlZS1zaGFrZW4gYXdheSBkdXJpbmcgcHJvZHVjdGlvbiBidWlsZHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRDbGFzc01ldGFkYXRhKFxuICAgIHR5cGU6IFR5cGU8YW55PiwgZGVjb3JhdG9yczogYW55W118bnVsbCwgY3RvclBhcmFtZXRlcnM6ICgoKSA9PiBhbnlbXSl8bnVsbCxcbiAgICBwcm9wRGVjb3JhdG9yczoge1tmaWVsZDogc3RyaW5nXTogYW55fXxudWxsKTogdm9pZCB7XG4gIHJldHVybiBub1NpZGVFZmZlY3RzKCgpID0+IHtcbiAgICAgICAgICAgY29uc3QgY2xhenogPSB0eXBlIGFzIFR5cGVXaXRoTWV0YWRhdGE7XG5cbiAgICAgICAgICAgaWYgKGRlY29yYXRvcnMgIT09IG51bGwpIHtcbiAgICAgICAgICAgICBpZiAoY2xhenouaGFzT3duUHJvcGVydHkoJ2RlY29yYXRvcnMnKSAmJiBjbGF6ei5kZWNvcmF0b3JzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgIGNsYXp6LmRlY29yYXRvcnMucHVzaCguLi5kZWNvcmF0b3JzKTtcbiAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgY2xhenouZGVjb3JhdG9ycyA9IGRlY29yYXRvcnM7XG4gICAgICAgICAgICAgfVxuICAgICAgICAgICB9XG4gICAgICAgICAgIGlmIChjdG9yUGFyYW1ldGVycyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgIC8vIFJhdGhlciB0aGFuIG1lcmdpbmcsIGNsb2JiZXIgdGhlIGV4aXN0aW5nIHBhcmFtZXRlcnMuIElmIG90aGVyIHByb2plY3RzIGV4aXN0IHdoaWNoXG4gICAgICAgICAgICAgLy8gdXNlIHRzaWNrbGUtc3R5bGUgYW5ub3RhdGlvbnMgYW5kIHJlZmxlY3Qgb3ZlciB0aGVtIGluIHRoZSBzYW1lIHdheSwgdGhpcyBjb3VsZFxuICAgICAgICAgICAgIC8vIGNhdXNlIGlzc3VlcywgYnV0IHRoYXQgaXMgdmFuaXNoaW5nbHkgdW5saWtlbHkuXG4gICAgICAgICAgICAgY2xhenouY3RvclBhcmFtZXRlcnMgPSBjdG9yUGFyYW1ldGVycztcbiAgICAgICAgICAgfVxuICAgICAgICAgICBpZiAocHJvcERlY29yYXRvcnMgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAvLyBUaGUgcHJvcGVydHkgZGVjb3JhdG9yIG9iamVjdHMgYXJlIG1lcmdlZCBhcyBpdCBpcyBwb3NzaWJsZSBkaWZmZXJlbnQgZmllbGRzIGhhdmVcbiAgICAgICAgICAgICAvLyBkaWZmZXJlbnQgZGVjb3JhdG9yIHR5cGVzLiBEZWNvcmF0b3JzIG9uIGluZGl2aWR1YWwgZmllbGRzIGFyZSBub3QgbWVyZ2VkLCBhcyBpdCdzXG4gICAgICAgICAgICAgLy8gYWxzbyBpbmNyZWRpYmx5IHVubGlrZWx5IHRoYXQgYSBmaWVsZCB3aWxsIGJlIGRlY29yYXRlZCBib3RoIHdpdGggYW4gQW5ndWxhclxuICAgICAgICAgICAgIC8vIGRlY29yYXRvciBhbmQgYSBub24tQW5ndWxhciBkZWNvcmF0b3IgdGhhdCdzIGFsc28gYmVlbiBkb3dubGV2ZWxlZC5cbiAgICAgICAgICAgICBpZiAoY2xhenouaGFzT3duUHJvcGVydHkoJ3Byb3BEZWNvcmF0b3JzJykgJiYgY2xhenoucHJvcERlY29yYXRvcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgY2xhenoucHJvcERlY29yYXRvcnMgPSB7Li4uY2xhenoucHJvcERlY29yYXRvcnMsIC4uLnByb3BEZWNvcmF0b3JzfTtcbiAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgY2xhenoucHJvcERlY29yYXRvcnMgPSBwcm9wRGVjb3JhdG9ycztcbiAgICAgICAgICAgICB9XG4gICAgICAgICAgIH1cbiAgICAgICAgIH0pIGFzIG5ldmVyO1xufVxuIl19