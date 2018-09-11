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
import { fillProperties } from '../../util/property';
import { EMPTY, EMPTY_ARRAY } from '../definition';
/**
 * Determines if a definition is a {\@link ComponentDefInternal} or a {\@link DirectiveDefInternal}
 * @template T
 * @param {?} definition The definition to examine
 * @return {?}
 */
function isComponentDef(definition) {
    /** @type {?} */
    const def = /** @type {?} */ (definition);
    return typeof def.template === 'function';
}
/**
 * @param {?} type
 * @return {?}
 */
function getSuperType(type) {
    return Object.getPrototypeOf(type.prototype).constructor;
}
/**
 * Merges the definition from a super class to a sub class.
 * @param {?} definition The definition that is a SubClass of another directive of component
 * @return {?}
 */
export function InheritDefinitionFeature(definition) {
    /** @type {?} */
    let superType = getSuperType(definition.type);
    while (superType) {
        /** @type {?} */
        let superDef = undefined;
        if (isComponentDef(definition)) {
            // Don't use getComponentDef/getDirectiveDef. This logic relies on inheritance.
            superDef = superType.ngComponentDef || superType.ngDirectiveDef;
        }
        else {
            if (superType.ngComponentDef) {
                throw new Error('Directives cannot inherit Components');
            }
            // Don't use getComponentDef/getDirectiveDef. This logic relies on inheritance.
            superDef = superType.ngDirectiveDef;
        }
        /** @nocollapse @type {?} */
        const baseDef = (/** @type {?} */ (superType)).ngBaseDef;
        // Some fields in the definition may be empty, if there were no values to put in them that
        // would've justified object creation. Unwrap them if necessary.
        if (baseDef || superDef) {
            /** @type {?} */
            const writeableDef = /** @type {?} */ (definition);
            writeableDef.inputs = maybeUnwrapEmpty(definition.inputs);
            writeableDef.declaredInputs = maybeUnwrapEmpty(definition.declaredInputs);
            writeableDef.outputs = maybeUnwrapEmpty(definition.outputs);
        }
        if (baseDef) {
            // Merge inputs and outputs
            fillProperties(definition.inputs, baseDef.inputs);
            fillProperties(definition.declaredInputs, baseDef.declaredInputs);
            fillProperties(definition.outputs, baseDef.outputs);
        }
        if (superDef) {
            /** @type {?} */
            const prevHostBindings = definition.hostBindings;
            /** @type {?} */
            const superHostBindings = superDef.hostBindings;
            if (superHostBindings) {
                if (prevHostBindings) {
                    definition.hostBindings = (directiveIndex, elementIndex) => {
                        superHostBindings(directiveIndex, elementIndex);
                        prevHostBindings(directiveIndex, elementIndex);
                    };
                }
                else {
                    definition.hostBindings = superHostBindings;
                }
            }
            // Merge View Queries
            if (isComponentDef(definition) && isComponentDef(superDef)) {
                /** @type {?} */
                const prevViewQuery = definition.viewQuery;
                /** @type {?} */
                const superViewQuery = superDef.viewQuery;
                if (superViewQuery) {
                    if (prevViewQuery) {
                        definition.viewQuery = (rf, ctx) => {
                            superViewQuery(rf, ctx);
                            prevViewQuery(rf, ctx);
                        };
                    }
                    else {
                        definition.viewQuery = superViewQuery;
                    }
                }
            }
            /** @type {?} */
            const prevContentQueries = definition.contentQueries;
            /** @type {?} */
            const superContentQueries = superDef.contentQueries;
            if (superContentQueries) {
                if (prevContentQueries) {
                    definition.contentQueries = () => {
                        superContentQueries();
                        prevContentQueries();
                    };
                }
                else {
                    definition.contentQueries = superContentQueries;
                }
            }
            /** @type {?} */
            const prevContentQueriesRefresh = definition.contentQueriesRefresh;
            /** @type {?} */
            const superContentQueriesRefresh = superDef.contentQueriesRefresh;
            if (superContentQueriesRefresh) {
                if (prevContentQueriesRefresh) {
                    definition.contentQueriesRefresh = (directiveIndex, queryIndex) => {
                        superContentQueriesRefresh(directiveIndex, queryIndex);
                        prevContentQueriesRefresh(directiveIndex, queryIndex);
                    };
                }
                else {
                    definition.contentQueriesRefresh = superContentQueriesRefresh;
                }
            }
            // Merge inputs and outputs
            fillProperties(definition.inputs, superDef.inputs);
            fillProperties(definition.declaredInputs, superDef.declaredInputs);
            fillProperties(definition.outputs, superDef.outputs);
            // Inherit hooks
            // Assume super class inheritance feature has already run.
            definition.afterContentChecked =
                definition.afterContentChecked || superDef.afterContentChecked;
            definition.afterContentInit = definition.afterContentInit || superDef.afterContentInit;
            definition.afterViewChecked = definition.afterViewChecked || superDef.afterViewChecked;
            definition.afterViewInit = definition.afterViewInit || superDef.afterViewInit;
            definition.doCheck = definition.doCheck || superDef.doCheck;
            definition.onDestroy = definition.onDestroy || superDef.onDestroy;
            definition.onInit = definition.onInit || superDef.onInit;
            /** @type {?} */
            const features = superDef.features;
            if (features) {
                for (const feature of features) {
                    if (feature && feature !== InheritDefinitionFeature) {
                        (/** @type {?} */ (feature))(definition);
                    }
                }
            }
            break;
        }
        else {
            /** @type {?} */
            const superPrototype = superType.prototype;
            if (superPrototype) {
                definition.afterContentChecked =
                    definition.afterContentChecked || superPrototype.afterContentChecked;
                definition.afterContentInit =
                    definition.afterContentInit || superPrototype.afterContentInit;
                definition.afterViewChecked =
                    definition.afterViewChecked || superPrototype.afterViewChecked;
                definition.afterViewInit = definition.afterViewInit || superPrototype.afterViewInit;
                definition.doCheck = definition.doCheck || superPrototype.doCheck;
                definition.onDestroy = definition.onDestroy || superPrototype.onDestroy;
                definition.onInit = definition.onInit || superPrototype.onInit;
            }
        }
        superType = Object.getPrototypeOf(superType);
    }
}
/**
 * @param {?} value
 * @return {?}
 */
function maybeUnwrapEmpty(value) {
    if (value === EMPTY) {
        return {};
    }
    else if (value === EMPTY_ARRAY) {
        return [];
    }
    else {
        return value;
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5oZXJpdF9kZWZpbml0aW9uX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL2luaGVyaXRfZGVmaW5pdGlvbl9mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ25ELE9BQU8sRUFBQyxLQUFLLEVBQUUsV0FBVyxFQUFDLE1BQU0sZUFBZSxDQUFDOzs7Ozs7O0FBU2pELFNBQVMsY0FBYyxDQUFJLFVBQTREOztJQUVyRixNQUFNLEdBQUcscUJBQUcsVUFBcUMsRUFBQztJQUNsRCxPQUFPLE9BQU8sR0FBRyxDQUFDLFFBQVEsS0FBSyxVQUFVLENBQUM7Q0FDM0M7Ozs7O0FBRUQsU0FBUyxZQUFZLENBQUMsSUFBZTtJQUVuQyxPQUFPLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztDQUMxRDs7Ozs7O0FBTUQsTUFBTSxVQUFVLHdCQUF3QixDQUNwQyxVQUFnRTs7SUFDbEUsSUFBSSxTQUFTLEdBQUcsWUFBWSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUU5QyxPQUFPLFNBQVMsRUFBRTs7UUFDaEIsSUFBSSxRQUFRLEdBQWtFLFNBQVMsQ0FBQztRQUN4RixJQUFJLGNBQWMsQ0FBQyxVQUFVLENBQUMsRUFBRTs7WUFFOUIsUUFBUSxHQUFHLFNBQVMsQ0FBQyxjQUFjLElBQUksU0FBUyxDQUFDLGNBQWMsQ0FBQztTQUNqRTthQUFNO1lBQ0wsSUFBSSxTQUFTLENBQUMsY0FBYyxFQUFFO2dCQUM1QixNQUFNLElBQUksS0FBSyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7YUFDekQ7O1lBRUQsUUFBUSxHQUFHLFNBQVMsQ0FBQyxjQUFjLENBQUM7U0FDckM7O1FBRUQs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QyxPQUFPLEVBQUUsQ0FBQztLQUNYO1NBQU07UUFDTCxPQUFPLEtBQUssQ0FBQztLQUNkO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vdHlwZSc7XG5pbXBvcnQge2ZpbGxQcm9wZXJ0aWVzfSBmcm9tICcuLi8uLi91dGlsL3Byb3BlcnR5JztcbmltcG9ydCB7RU1QVFksIEVNUFRZX0FSUkFZfSBmcm9tICcuLi9kZWZpbml0aW9uJztcbmltcG9ydCB7Q29tcG9uZW50RGVmSW50ZXJuYWwsIENvbXBvbmVudFRlbXBsYXRlLCBEaXJlY3RpdmVEZWZGZWF0dXJlLCBEaXJlY3RpdmVEZWZJbnRlcm5hbCwgUmVuZGVyRmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5cblxuXG4vKipcbiAqIERldGVybWluZXMgaWYgYSBkZWZpbml0aW9uIGlzIGEge0BsaW5rIENvbXBvbmVudERlZkludGVybmFsfSBvciBhIHtAbGluayBEaXJlY3RpdmVEZWZJbnRlcm5hbH1cbiAqIEBwYXJhbSBkZWZpbml0aW9uIFRoZSBkZWZpbml0aW9uIHRvIGV4YW1pbmVcbiAqL1xuZnVuY3Rpb24gaXNDb21wb25lbnREZWY8VD4oZGVmaW5pdGlvbjogQ29tcG9uZW50RGVmSW50ZXJuYWw8VD58IERpcmVjdGl2ZURlZkludGVybmFsPFQ+KTpcbiAgICBkZWZpbml0aW9uIGlzIENvbXBvbmVudERlZkludGVybmFsPFQ+IHtcbiAgY29uc3QgZGVmID0gZGVmaW5pdGlvbiBhcyBDb21wb25lbnREZWZJbnRlcm5hbDxUPjtcbiAgcmV0dXJuIHR5cGVvZiBkZWYudGVtcGxhdGUgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGdldFN1cGVyVHlwZSh0eXBlOiBUeXBlPGFueT4pOiBUeXBlPGFueT4mXG4gICAge25nQ29tcG9uZW50RGVmPzogQ29tcG9uZW50RGVmSW50ZXJuYWw8YW55PiwgbmdEaXJlY3RpdmVEZWY/OiBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+fSB7XG4gIHJldHVybiBPYmplY3QuZ2V0UHJvdG90eXBlT2YodHlwZS5wcm90b3R5cGUpLmNvbnN0cnVjdG9yO1xufVxuXG4vKipcbiAqIE1lcmdlcyB0aGUgZGVmaW5pdGlvbiBmcm9tIGEgc3VwZXIgY2xhc3MgdG8gYSBzdWIgY2xhc3MuXG4gKiBAcGFyYW0gZGVmaW5pdGlvbiBUaGUgZGVmaW5pdGlvbiB0aGF0IGlzIGEgU3ViQ2xhc3Mgb2YgYW5vdGhlciBkaXJlY3RpdmUgb2YgY29tcG9uZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBJbmhlcml0RGVmaW5pdGlvbkZlYXR1cmUoXG4gICAgZGVmaW5pdGlvbjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PnwgQ29tcG9uZW50RGVmSW50ZXJuYWw8YW55Pik6IHZvaWQge1xuICBsZXQgc3VwZXJUeXBlID0gZ2V0U3VwZXJUeXBlKGRlZmluaXRpb24udHlwZSk7XG5cbiAgd2hpbGUgKHN1cGVyVHlwZSkge1xuICAgIGxldCBzdXBlckRlZjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PnxDb21wb25lbnREZWZJbnRlcm5hbDxhbnk+fHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICBpZiAoaXNDb21wb25lbnREZWYoZGVmaW5pdGlvbikpIHtcbiAgICAgIC8vIERvbid0IHVzZSBnZXRDb21wb25lbnREZWYvZ2V0RGlyZWN0aXZlRGVmLiBUaGlzIGxvZ2ljIHJlbGllcyBvbiBpbmhlcml0YW5jZS5cbiAgICAgIHN1cGVyRGVmID0gc3VwZXJUeXBlLm5nQ29tcG9uZW50RGVmIHx8IHN1cGVyVHlwZS5uZ0RpcmVjdGl2ZURlZjtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHN1cGVyVHlwZS5uZ0NvbXBvbmVudERlZikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RpcmVjdGl2ZXMgY2Fubm90IGluaGVyaXQgQ29tcG9uZW50cycpO1xuICAgICAgfVxuICAgICAgLy8gRG9uJ3QgdXNlIGdldENvbXBvbmVudERlZi9nZXREaXJlY3RpdmVEZWYuIFRoaXMgbG9naWMgcmVsaWVzIG9uIGluaGVyaXRhbmNlLlxuICAgICAgc3VwZXJEZWYgPSBzdXBlclR5cGUubmdEaXJlY3RpdmVEZWY7XG4gICAgfVxuXG4gICAgY29uc3QgYmFzZURlZiA9IChzdXBlclR5cGUgYXMgYW55KS5uZ0Jhc2VEZWY7XG5cbiAgICAvLyBTb21lIGZpZWxkcyBpbiB0aGUgZGVmaW5pdGlvbiBtYXkgYmUgZW1wdHksIGlmIHRoZXJlIHdlcmUgbm8gdmFsdWVzIHRvIHB1dCBpbiB0aGVtIHRoYXRcbiAgICAvLyB3b3VsZCd2ZSBqdXN0aWZpZWQgb2JqZWN0IGNyZWF0aW9uLiBVbndyYXAgdGhlbSBpZiBuZWNlc3NhcnkuXG4gICAgaWYgKGJhc2VEZWYgfHwgc3VwZXJEZWYpIHtcbiAgICAgIGNvbnN0IHdyaXRlYWJsZURlZiA9IGRlZmluaXRpb24gYXMgYW55O1xuICAgICAgd3JpdGVhYmxlRGVmLmlucHV0cyA9IG1heWJlVW53cmFwRW1wdHkoZGVmaW5pdGlvbi5pbnB1dHMpO1xuICAgICAgd3JpdGVhYmxlRGVmLmRlY2xhcmVkSW5wdXRzID0gbWF5YmVVbndyYXBFbXB0eShkZWZpbml0aW9uLmRlY2xhcmVkSW5wdXRzKTtcbiAgICAgIHdyaXRlYWJsZURlZi5vdXRwdXRzID0gbWF5YmVVbndyYXBFbXB0eShkZWZpbml0aW9uLm91dHB1dHMpO1xuICAgIH1cblxuICAgIGlmIChiYXNlRGVmKSB7XG4gICAgICAvLyBNZXJnZSBpbnB1dHMgYW5kIG91dHB1dHNcbiAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24uaW5wdXRzLCBiYXNlRGVmLmlucHV0cyk7XG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLmRlY2xhcmVkSW5wdXRzLCBiYXNlRGVmLmRlY2xhcmVkSW5wdXRzKTtcbiAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24ub3V0cHV0cywgYmFzZURlZi5vdXRwdXRzKTtcbiAgICB9XG5cbiAgICBpZiAoc3VwZXJEZWYpIHtcbiAgICAgIC8vIE1lcmdlIGhvc3RCaW5kaW5nc1xuICAgICAgY29uc3QgcHJldkhvc3RCaW5kaW5ncyA9IGRlZmluaXRpb24uaG9zdEJpbmRpbmdzO1xuICAgICAgY29uc3Qgc3VwZXJIb3N0QmluZGluZ3MgPSBzdXBlckRlZi5ob3N0QmluZGluZ3M7XG4gICAgICBpZiAoc3VwZXJIb3N0QmluZGluZ3MpIHtcbiAgICAgICAgaWYgKHByZXZIb3N0QmluZGluZ3MpIHtcbiAgICAgICAgICBkZWZpbml0aW9uLmhvc3RCaW5kaW5ncyA9IChkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBlbGVtZW50SW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgc3VwZXJIb3N0QmluZGluZ3MoZGlyZWN0aXZlSW5kZXgsIGVsZW1lbnRJbmRleCk7XG4gICAgICAgICAgICBwcmV2SG9zdEJpbmRpbmdzKGRpcmVjdGl2ZUluZGV4LCBlbGVtZW50SW5kZXgpO1xuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVmaW5pdGlvbi5ob3N0QmluZGluZ3MgPSBzdXBlckhvc3RCaW5kaW5ncztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBNZXJnZSBWaWV3IFF1ZXJpZXNcbiAgICAgIGlmIChpc0NvbXBvbmVudERlZihkZWZpbml0aW9uKSAmJiBpc0NvbXBvbmVudERlZihzdXBlckRlZikpIHtcbiAgICAgICAgY29uc3QgcHJldlZpZXdRdWVyeSA9IGRlZmluaXRpb24udmlld1F1ZXJ5O1xuICAgICAgICBjb25zdCBzdXBlclZpZXdRdWVyeSA9IHN1cGVyRGVmLnZpZXdRdWVyeTtcbiAgICAgICAgaWYgKHN1cGVyVmlld1F1ZXJ5KSB7XG4gICAgICAgICAgaWYgKHByZXZWaWV3UXVlcnkpIHtcbiAgICAgICAgICAgIGRlZmluaXRpb24udmlld1F1ZXJ5ID0gPFQ+KHJmOiBSZW5kZXJGbGFncywgY3R4OiBUKTogdm9pZCA9PiB7XG4gICAgICAgICAgICAgIHN1cGVyVmlld1F1ZXJ5KHJmLCBjdHgpO1xuICAgICAgICAgICAgICBwcmV2Vmlld1F1ZXJ5KHJmLCBjdHgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVmaW5pdGlvbi52aWV3UXVlcnkgPSBzdXBlclZpZXdRdWVyeTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gTWVyZ2UgQ29udGVudCBRdWVyaWVzXG4gICAgICBjb25zdCBwcmV2Q29udGVudFF1ZXJpZXMgPSBkZWZpbml0aW9uLmNvbnRlbnRRdWVyaWVzO1xuICAgICAgY29uc3Qgc3VwZXJDb250ZW50UXVlcmllcyA9IHN1cGVyRGVmLmNvbnRlbnRRdWVyaWVzO1xuICAgICAgaWYgKHN1cGVyQ29udGVudFF1ZXJpZXMpIHtcbiAgICAgICAgaWYgKHByZXZDb250ZW50UXVlcmllcykge1xuICAgICAgICAgIGRlZmluaXRpb24uY29udGVudFF1ZXJpZXMgPSAoKSA9PiB7XG4gICAgICAgICAgICBzdXBlckNvbnRlbnRRdWVyaWVzKCk7XG4gICAgICAgICAgICBwcmV2Q29udGVudFF1ZXJpZXMoKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlZmluaXRpb24uY29udGVudFF1ZXJpZXMgPSBzdXBlckNvbnRlbnRRdWVyaWVzO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIE1lcmdlIENvbnRlbnQgUXVlcmllcyBSZWZyZXNoXG4gICAgICBjb25zdCBwcmV2Q29udGVudFF1ZXJpZXNSZWZyZXNoID0gZGVmaW5pdGlvbi5jb250ZW50UXVlcmllc1JlZnJlc2g7XG4gICAgICBjb25zdCBzdXBlckNvbnRlbnRRdWVyaWVzUmVmcmVzaCA9IHN1cGVyRGVmLmNvbnRlbnRRdWVyaWVzUmVmcmVzaDtcbiAgICAgIGlmIChzdXBlckNvbnRlbnRRdWVyaWVzUmVmcmVzaCkge1xuICAgICAgICBpZiAocHJldkNvbnRlbnRRdWVyaWVzUmVmcmVzaCkge1xuICAgICAgICAgIGRlZmluaXRpb24uY29udGVudFF1ZXJpZXNSZWZyZXNoID0gKGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHF1ZXJ5SW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgc3VwZXJDb250ZW50UXVlcmllc1JlZnJlc2goZGlyZWN0aXZlSW5kZXgsIHF1ZXJ5SW5kZXgpO1xuICAgICAgICAgICAgcHJldkNvbnRlbnRRdWVyaWVzUmVmcmVzaChkaXJlY3RpdmVJbmRleCwgcXVlcnlJbmRleCk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWZpbml0aW9uLmNvbnRlbnRRdWVyaWVzUmVmcmVzaCA9IHN1cGVyQ29udGVudFF1ZXJpZXNSZWZyZXNoO1xuICAgICAgICB9XG4gICAgICB9XG5cblxuICAgICAgLy8gTWVyZ2UgaW5wdXRzIGFuZCBvdXRwdXRzXG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLmlucHV0cywgc3VwZXJEZWYuaW5wdXRzKTtcbiAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24uZGVjbGFyZWRJbnB1dHMsIHN1cGVyRGVmLmRlY2xhcmVkSW5wdXRzKTtcbiAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24ub3V0cHV0cywgc3VwZXJEZWYub3V0cHV0cyk7XG5cbiAgICAgIC8vIEluaGVyaXQgaG9va3NcbiAgICAgIC8vIEFzc3VtZSBzdXBlciBjbGFzcyBpbmhlcml0YW5jZSBmZWF0dXJlIGhhcyBhbHJlYWR5IHJ1bi5cbiAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50Q2hlY2tlZCA9XG4gICAgICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRDaGVja2VkIHx8IHN1cGVyRGVmLmFmdGVyQ29udGVudENoZWNrZWQ7XG4gICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudEluaXQgPSBkZWZpbml0aW9uLmFmdGVyQ29udGVudEluaXQgfHwgc3VwZXJEZWYuYWZ0ZXJDb250ZW50SW5pdDtcbiAgICAgIGRlZmluaXRpb24uYWZ0ZXJWaWV3Q2hlY2tlZCA9IGRlZmluaXRpb24uYWZ0ZXJWaWV3Q2hlY2tlZCB8fCBzdXBlckRlZi5hZnRlclZpZXdDaGVja2VkO1xuICAgICAgZGVmaW5pdGlvbi5hZnRlclZpZXdJbml0ID0gZGVmaW5pdGlvbi5hZnRlclZpZXdJbml0IHx8IHN1cGVyRGVmLmFmdGVyVmlld0luaXQ7XG4gICAgICBkZWZpbml0aW9uLmRvQ2hlY2sgPSBkZWZpbml0aW9uLmRvQ2hlY2sgfHwgc3VwZXJEZWYuZG9DaGVjaztcbiAgICAgIGRlZmluaXRpb24ub25EZXN0cm95ID0gZGVmaW5pdGlvbi5vbkRlc3Ryb3kgfHwgc3VwZXJEZWYub25EZXN0cm95O1xuICAgICAgZGVmaW5pdGlvbi5vbkluaXQgPSBkZWZpbml0aW9uLm9uSW5pdCB8fCBzdXBlckRlZi5vbkluaXQ7XG5cbiAgICAgIC8vIFJ1biBwYXJlbnQgZmVhdHVyZXNcbiAgICAgIGNvbnN0IGZlYXR1cmVzID0gc3VwZXJEZWYuZmVhdHVyZXM7XG4gICAgICBpZiAoZmVhdHVyZXMpIHtcbiAgICAgICAgZm9yIChjb25zdCBmZWF0dXJlIG9mIGZlYXR1cmVzKSB7XG4gICAgICAgICAgaWYgKGZlYXR1cmUgJiYgZmVhdHVyZSAhPT0gSW5oZXJpdERlZmluaXRpb25GZWF0dXJlKSB7XG4gICAgICAgICAgICAoZmVhdHVyZSBhcyBEaXJlY3RpdmVEZWZGZWF0dXJlKShkZWZpbml0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEV2ZW4gaWYgd2UgZG9uJ3QgaGF2ZSBhIGRlZmluaXRpb24sIGNoZWNrIHRoZSB0eXBlIGZvciB0aGUgaG9va3MgYW5kIHVzZSB0aG9zZSBpZiBuZWVkIGJlXG4gICAgICBjb25zdCBzdXBlclByb3RvdHlwZSA9IHN1cGVyVHlwZS5wcm90b3R5cGU7XG5cbiAgICAgIGlmIChzdXBlclByb3RvdHlwZSkge1xuICAgICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudENoZWNrZWQgPVxuICAgICAgICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRDaGVja2VkIHx8IHN1cGVyUHJvdG90eXBlLmFmdGVyQ29udGVudENoZWNrZWQ7XG4gICAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50SW5pdCA9XG4gICAgICAgICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudEluaXQgfHwgc3VwZXJQcm90b3R5cGUuYWZ0ZXJDb250ZW50SW5pdDtcbiAgICAgICAgZGVmaW5pdGlvbi5hZnRlclZpZXdDaGVja2VkID1cbiAgICAgICAgICAgIGRlZmluaXRpb24uYWZ0ZXJWaWV3Q2hlY2tlZCB8fCBzdXBlclByb3RvdHlwZS5hZnRlclZpZXdDaGVja2VkO1xuICAgICAgICBkZWZpbml0aW9uLmFmdGVyVmlld0luaXQgPSBkZWZpbml0aW9uLmFmdGVyVmlld0luaXQgfHwgc3VwZXJQcm90b3R5cGUuYWZ0ZXJWaWV3SW5pdDtcbiAgICAgICAgZGVmaW5pdGlvbi5kb0NoZWNrID0gZGVmaW5pdGlvbi5kb0NoZWNrIHx8IHN1cGVyUHJvdG90eXBlLmRvQ2hlY2s7XG4gICAgICAgIGRlZmluaXRpb24ub25EZXN0cm95ID0gZGVmaW5pdGlvbi5vbkRlc3Ryb3kgfHwgc3VwZXJQcm90b3R5cGUub25EZXN0cm95O1xuICAgICAgICBkZWZpbml0aW9uLm9uSW5pdCA9IGRlZmluaXRpb24ub25Jbml0IHx8IHN1cGVyUHJvdG90eXBlLm9uSW5pdDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzdXBlclR5cGUgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yoc3VwZXJUeXBlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYXliZVVud3JhcEVtcHR5PFQ+KHZhbHVlOiBUW10pOiBUW107XG5mdW5jdGlvbiBtYXliZVVud3JhcEVtcHR5PFQ+KHZhbHVlOiBUKTogVDtcbmZ1bmN0aW9uIG1heWJlVW53cmFwRW1wdHkodmFsdWU6IGFueSk6IGFueSB7XG4gIGlmICh2YWx1ZSA9PT0gRU1QVFkpIHtcbiAgICByZXR1cm4ge307XG4gIH0gZWxzZSBpZiAodmFsdWUgPT09IEVNUFRZX0FSUkFZKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxufVxuIl19