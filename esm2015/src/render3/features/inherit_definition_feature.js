/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { fillProperties } from '../../util/property';
import { EMPTY_ARRAY, EMPTY_OBJ } from '../empty';
/**
 * Determines if a definition is a {\@link ComponentDef} or a {\@link DirectiveDef}
 * @template T
 * @param {?} definition The definition to examine
 * @return {?}
 */
function isComponentDef(definition) {
    /** @type {?} */
    const def = (/** @type {?} */ (definition));
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
        const baseDef = ((/** @type {?} */ (superType))).ngBaseDef;
        // Some fields in the definition may be empty, if there were no values to put in them that
        // would've justified object creation. Unwrap them if necessary.
        if (baseDef || superDef) {
            /** @type {?} */
            const writeableDef = (/** @type {?} */ (definition));
            writeableDef.inputs = maybeUnwrapEmpty(definition.inputs);
            writeableDef.declaredInputs = maybeUnwrapEmpty(definition.declaredInputs);
            writeableDef.outputs = maybeUnwrapEmpty(definition.outputs);
        }
        if (baseDef) {
            fillProperties(definition.inputs, baseDef.inputs);
            fillProperties(definition.declaredInputs, baseDef.declaredInputs);
            fillProperties(definition.outputs, baseDef.outputs);
        }
        if (superDef) {
            // Merge hostBindings
            /** @type {?} */
            const prevHostBindings = definition.hostBindings;
            /** @type {?} */
            const superHostBindings = superDef.hostBindings;
            if (superHostBindings) {
                if (prevHostBindings) {
                    definition.hostBindings = (rf, ctx, elementIndex) => {
                        superHostBindings(rf, ctx, elementIndex);
                        prevHostBindings(rf, ctx, elementIndex);
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
            // Merge Content Queries
            /** @type {?} */
            const prevContentQueries = definition.contentQueries;
            /** @type {?} */
            const superContentQueries = superDef.contentQueries;
            if (superContentQueries) {
                if (prevContentQueries) {
                    definition.contentQueries = (dirIndex) => {
                        superContentQueries(dirIndex);
                        prevContentQueries(dirIndex);
                    };
                }
                else {
                    definition.contentQueries = superContentQueries;
                }
            }
            // Merge Content Queries Refresh
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
            definition.onChanges = definition.onChanges || superDef.onChanges;
            // Run parent features
            /** @type {?} */
            const features = superDef.features;
            if (features) {
                for (const feature of features) {
                    if (feature && feature.ngInherit) {
                        ((/** @type {?} */ (feature)))(definition);
                    }
                }
            }
            break;
        }
        else {
            // Even if we don't have a definition, check the type for the hooks and use those if need be
            /** @type {?} */
            const superPrototype = superType.prototype;
            if (superPrototype) {
                definition.afterContentChecked =
                    definition.afterContentChecked || superPrototype.ngAfterContentChecked;
                definition.afterContentInit =
                    definition.afterContentInit || superPrototype.ngAfterContentInit;
                definition.afterViewChecked =
                    definition.afterViewChecked || superPrototype.ngAfterViewChecked;
                definition.afterViewInit = definition.afterViewInit || superPrototype.ngAfterViewInit;
                definition.doCheck = definition.doCheck || superPrototype.ngDoCheck;
                definition.onDestroy = definition.onDestroy || superPrototype.ngOnDestroy;
                definition.onInit = definition.onInit || superPrototype.ngOnInit;
                definition.onChanges = definition.onChanges || superPrototype.ngOnChanges;
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
    if (value === EMPTY_OBJ) {
        return {};
    }
    else if (value === EMPTY_ARRAY) {
        return [];
    }
    else {
        return value;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5oZXJpdF9kZWZpbml0aW9uX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL2luaGVyaXRfZGVmaW5pdGlvbl9mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ25ELE9BQU8sRUFBQyxXQUFXLEVBQUUsU0FBUyxFQUFDLE1BQU0sVUFBVSxDQUFDOzs7Ozs7O0FBU2hELFNBQVMsY0FBYyxDQUFJLFVBQTRDOztVQUUvRCxHQUFHLEdBQUcsbUJBQUEsVUFBVSxFQUFtQjtJQUN6QyxPQUFPLE9BQU8sR0FBRyxDQUFDLFFBQVEsS0FBSyxVQUFVLENBQUM7QUFDNUMsQ0FBQzs7Ozs7QUFFRCxTQUFTLFlBQVksQ0FBQyxJQUFlO0lBRW5DLE9BQU8sTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsV0FBVyxDQUFDO0FBQzNELENBQUM7Ozs7OztBQU1ELE1BQU0sVUFBVSx3QkFBd0IsQ0FBQyxVQUFnRDs7UUFDbkYsU0FBUyxHQUFHLFlBQVksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO0lBRTdDLE9BQU8sU0FBUyxFQUFFOztZQUNaLFFBQVEsR0FBa0QsU0FBUztRQUN2RSxJQUFJLGNBQWMsQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUM5QiwrRUFBK0U7WUFDL0UsUUFBUSxHQUFHLFNBQVMsQ0FBQyxjQUFjLElBQUksU0FBUyxDQUFDLGNBQWMsQ0FBQztTQUNqRTthQUFNO1lBQ0wsSUFBSSxTQUFTLENBQUMsY0FBYyxFQUFFO2dCQUM1QixNQUFNLElBQUksS0FBSyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7YUFDekQ7WUFDRCwrRUFBK0U7WUFDL0UsUUFBUSxHQUFHLFNBQVMsQ0FBQyxjQUFjLENBQUM7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SSxjQUFjLENBQUMsV0FBVyxDQUFDO2FBQzNFO1NBQ0Y7UUFFRCxTQUFTLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztLQUM5QztBQUNILENBQUM7Ozs7O0FBSUQsU0FBUyxnQkFBZ0IsQ0FBQyxLQUFVO0lBQ2xDLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtRQUN2QixPQUFPLEVBQUUsQ0FBQztLQUNYO1NBQU0sSUFBSSxLQUFLLEtBQUssV0FBVyxFQUFFO1FBQ2hDLE9BQU8sRUFBRSxDQUFDO0tBQ1g7U0FBTTtRQUNMLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7ZmlsbFByb3BlcnRpZXN9IGZyb20gJy4uLy4uL3V0aWwvcHJvcGVydHknO1xuaW1wb3J0IHtFTVBUWV9BUlJBWSwgRU1QVFlfT0JKfSBmcm9tICcuLi9lbXB0eSc7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgRGlyZWN0aXZlRGVmLCBEaXJlY3RpdmVEZWZGZWF0dXJlLCBSZW5kZXJGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcblxuXG5cbi8qKlxuICogRGV0ZXJtaW5lcyBpZiBhIGRlZmluaXRpb24gaXMgYSB7QGxpbmsgQ29tcG9uZW50RGVmfSBvciBhIHtAbGluayBEaXJlY3RpdmVEZWZ9XG4gKiBAcGFyYW0gZGVmaW5pdGlvbiBUaGUgZGVmaW5pdGlvbiB0byBleGFtaW5lXG4gKi9cbmZ1bmN0aW9uIGlzQ29tcG9uZW50RGVmPFQ+KGRlZmluaXRpb246IENvbXBvbmVudERlZjxUPnwgRGlyZWN0aXZlRGVmPFQ+KTpcbiAgICBkZWZpbml0aW9uIGlzIENvbXBvbmVudERlZjxUPiB7XG4gIGNvbnN0IGRlZiA9IGRlZmluaXRpb24gYXMgQ29tcG9uZW50RGVmPFQ+O1xuICByZXR1cm4gdHlwZW9mIGRlZi50ZW1wbGF0ZSA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gZ2V0U3VwZXJUeXBlKHR5cGU6IFR5cGU8YW55Pik6IFR5cGU8YW55PiZcbiAgICB7bmdDb21wb25lbnREZWY/OiBDb21wb25lbnREZWY8YW55PiwgbmdEaXJlY3RpdmVEZWY/OiBEaXJlY3RpdmVEZWY8YW55Pn0ge1xuICByZXR1cm4gT2JqZWN0LmdldFByb3RvdHlwZU9mKHR5cGUucHJvdG90eXBlKS5jb25zdHJ1Y3Rvcjtcbn1cblxuLyoqXG4gKiBNZXJnZXMgdGhlIGRlZmluaXRpb24gZnJvbSBhIHN1cGVyIGNsYXNzIHRvIGEgc3ViIGNsYXNzLlxuICogQHBhcmFtIGRlZmluaXRpb24gVGhlIGRlZmluaXRpb24gdGhhdCBpcyBhIFN1YkNsYXNzIG9mIGFub3RoZXIgZGlyZWN0aXZlIG9mIGNvbXBvbmVudFxuICovXG5leHBvcnQgZnVuY3Rpb24gSW5oZXJpdERlZmluaXRpb25GZWF0dXJlKGRlZmluaXRpb246IERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55Pik6IHZvaWQge1xuICBsZXQgc3VwZXJUeXBlID0gZ2V0U3VwZXJUeXBlKGRlZmluaXRpb24udHlwZSk7XG5cbiAgd2hpbGUgKHN1cGVyVHlwZSkge1xuICAgIGxldCBzdXBlckRlZjogRGlyZWN0aXZlRGVmPGFueT58Q29tcG9uZW50RGVmPGFueT58dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgIGlmIChpc0NvbXBvbmVudERlZihkZWZpbml0aW9uKSkge1xuICAgICAgLy8gRG9uJ3QgdXNlIGdldENvbXBvbmVudERlZi9nZXREaXJlY3RpdmVEZWYuIFRoaXMgbG9naWMgcmVsaWVzIG9uIGluaGVyaXRhbmNlLlxuICAgICAgc3VwZXJEZWYgPSBzdXBlclR5cGUubmdDb21wb25lbnREZWYgfHwgc3VwZXJUeXBlLm5nRGlyZWN0aXZlRGVmO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoc3VwZXJUeXBlLm5nQ29tcG9uZW50RGVmKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRGlyZWN0aXZlcyBjYW5ub3QgaW5oZXJpdCBDb21wb25lbnRzJyk7XG4gICAgICB9XG4gICAgICAvLyBEb24ndCB1c2UgZ2V0Q29tcG9uZW50RGVmL2dldERpcmVjdGl2ZURlZi4gVGhpcyBsb2dpYyByZWxpZXMgb24gaW5oZXJpdGFuY2UuXG4gICAgICBzdXBlckRlZiA9IHN1cGVyVHlwZS5uZ0RpcmVjdGl2ZURlZjtcbiAgICB9XG5cbiAgICBjb25zdCBiYXNlRGVmID0gKHN1cGVyVHlwZSBhcyBhbnkpLm5nQmFzZURlZjtcblxuICAgIC8vIFNvbWUgZmllbGRzIGluIHRoZSBkZWZpbml0aW9uIG1heSBiZSBlbXB0eSwgaWYgdGhlcmUgd2VyZSBubyB2YWx1ZXMgdG8gcHV0IGluIHRoZW0gdGhhdFxuICAgIC8vIHdvdWxkJ3ZlIGp1c3RpZmllZCBvYmplY3QgY3JlYXRpb24uIFVud3JhcCB0aGVtIGlmIG5lY2Vzc2FyeS5cbiAgICBpZiAoYmFzZURlZiB8fCBzdXBlckRlZikge1xuICAgICAgY29uc3Qgd3JpdGVhYmxlRGVmID0gZGVmaW5pdGlvbiBhcyBhbnk7XG4gICAgICB3cml0ZWFibGVEZWYuaW5wdXRzID0gbWF5YmVVbndyYXBFbXB0eShkZWZpbml0aW9uLmlucHV0cyk7XG4gICAgICB3cml0ZWFibGVEZWYuZGVjbGFyZWRJbnB1dHMgPSBtYXliZVVud3JhcEVtcHR5KGRlZmluaXRpb24uZGVjbGFyZWRJbnB1dHMpO1xuICAgICAgd3JpdGVhYmxlRGVmLm91dHB1dHMgPSBtYXliZVVud3JhcEVtcHR5KGRlZmluaXRpb24ub3V0cHV0cyk7XG4gICAgfVxuXG4gICAgaWYgKGJhc2VEZWYpIHtcbiAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24uaW5wdXRzLCBiYXNlRGVmLmlucHV0cyk7XG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLmRlY2xhcmVkSW5wdXRzLCBiYXNlRGVmLmRlY2xhcmVkSW5wdXRzKTtcbiAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24ub3V0cHV0cywgYmFzZURlZi5vdXRwdXRzKTtcbiAgICB9XG5cbiAgICBpZiAoc3VwZXJEZWYpIHtcbiAgICAgIC8vIE1lcmdlIGhvc3RCaW5kaW5nc1xuICAgICAgY29uc3QgcHJldkhvc3RCaW5kaW5ncyA9IGRlZmluaXRpb24uaG9zdEJpbmRpbmdzO1xuICAgICAgY29uc3Qgc3VwZXJIb3N0QmluZGluZ3MgPSBzdXBlckRlZi5ob3N0QmluZGluZ3M7XG4gICAgICBpZiAoc3VwZXJIb3N0QmluZGluZ3MpIHtcbiAgICAgICAgaWYgKHByZXZIb3N0QmluZGluZ3MpIHtcbiAgICAgICAgICBkZWZpbml0aW9uLmhvc3RCaW5kaW5ncyA9IChyZjogUmVuZGVyRmxhZ3MsIGN0eDogYW55LCBlbGVtZW50SW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgc3VwZXJIb3N0QmluZGluZ3MocmYsIGN0eCwgZWxlbWVudEluZGV4KTtcbiAgICAgICAgICAgIHByZXZIb3N0QmluZGluZ3MocmYsIGN0eCwgZWxlbWVudEluZGV4KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlZmluaXRpb24uaG9zdEJpbmRpbmdzID0gc3VwZXJIb3N0QmluZGluZ3M7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gTWVyZ2UgVmlldyBRdWVyaWVzXG4gICAgICBpZiAoaXNDb21wb25lbnREZWYoZGVmaW5pdGlvbikgJiYgaXNDb21wb25lbnREZWYoc3VwZXJEZWYpKSB7XG4gICAgICAgIGNvbnN0IHByZXZWaWV3UXVlcnkgPSBkZWZpbml0aW9uLnZpZXdRdWVyeTtcbiAgICAgICAgY29uc3Qgc3VwZXJWaWV3UXVlcnkgPSBzdXBlckRlZi52aWV3UXVlcnk7XG4gICAgICAgIGlmIChzdXBlclZpZXdRdWVyeSkge1xuICAgICAgICAgIGlmIChwcmV2Vmlld1F1ZXJ5KSB7XG4gICAgICAgICAgICBkZWZpbml0aW9uLnZpZXdRdWVyeSA9IDxUPihyZjogUmVuZGVyRmxhZ3MsIGN0eDogVCk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgICBzdXBlclZpZXdRdWVyeShyZiwgY3R4KTtcbiAgICAgICAgICAgICAgcHJldlZpZXdRdWVyeShyZiwgY3R4KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlZmluaXRpb24udmlld1F1ZXJ5ID0gc3VwZXJWaWV3UXVlcnk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIE1lcmdlIENvbnRlbnQgUXVlcmllc1xuICAgICAgY29uc3QgcHJldkNvbnRlbnRRdWVyaWVzID0gZGVmaW5pdGlvbi5jb250ZW50UXVlcmllcztcbiAgICAgIGNvbnN0IHN1cGVyQ29udGVudFF1ZXJpZXMgPSBzdXBlckRlZi5jb250ZW50UXVlcmllcztcbiAgICAgIGlmIChzdXBlckNvbnRlbnRRdWVyaWVzKSB7XG4gICAgICAgIGlmIChwcmV2Q29udGVudFF1ZXJpZXMpIHtcbiAgICAgICAgICBkZWZpbml0aW9uLmNvbnRlbnRRdWVyaWVzID0gKGRpckluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIHN1cGVyQ29udGVudFF1ZXJpZXMoZGlySW5kZXgpO1xuICAgICAgICAgICAgcHJldkNvbnRlbnRRdWVyaWVzKGRpckluZGV4KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlZmluaXRpb24uY29udGVudFF1ZXJpZXMgPSBzdXBlckNvbnRlbnRRdWVyaWVzO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIE1lcmdlIENvbnRlbnQgUXVlcmllcyBSZWZyZXNoXG4gICAgICBjb25zdCBwcmV2Q29udGVudFF1ZXJpZXNSZWZyZXNoID0gZGVmaW5pdGlvbi5jb250ZW50UXVlcmllc1JlZnJlc2g7XG4gICAgICBjb25zdCBzdXBlckNvbnRlbnRRdWVyaWVzUmVmcmVzaCA9IHN1cGVyRGVmLmNvbnRlbnRRdWVyaWVzUmVmcmVzaDtcbiAgICAgIGlmIChzdXBlckNvbnRlbnRRdWVyaWVzUmVmcmVzaCkge1xuICAgICAgICBpZiAocHJldkNvbnRlbnRRdWVyaWVzUmVmcmVzaCkge1xuICAgICAgICAgIGRlZmluaXRpb24uY29udGVudFF1ZXJpZXNSZWZyZXNoID0gKGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHF1ZXJ5SW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgc3VwZXJDb250ZW50UXVlcmllc1JlZnJlc2goZGlyZWN0aXZlSW5kZXgsIHF1ZXJ5SW5kZXgpO1xuICAgICAgICAgICAgcHJldkNvbnRlbnRRdWVyaWVzUmVmcmVzaChkaXJlY3RpdmVJbmRleCwgcXVlcnlJbmRleCk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWZpbml0aW9uLmNvbnRlbnRRdWVyaWVzUmVmcmVzaCA9IHN1cGVyQ29udGVudFF1ZXJpZXNSZWZyZXNoO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIE1lcmdlIGlucHV0cyBhbmQgb3V0cHV0c1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5pbnB1dHMsIHN1cGVyRGVmLmlucHV0cyk7XG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLmRlY2xhcmVkSW5wdXRzLCBzdXBlckRlZi5kZWNsYXJlZElucHV0cyk7XG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLm91dHB1dHMsIHN1cGVyRGVmLm91dHB1dHMpO1xuXG4gICAgICAvLyBJbmhlcml0IGhvb2tzXG4gICAgICAvLyBBc3N1bWUgc3VwZXIgY2xhc3MgaW5oZXJpdGFuY2UgZmVhdHVyZSBoYXMgYWxyZWFkeSBydW4uXG4gICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudENoZWNrZWQgPVxuICAgICAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50Q2hlY2tlZCB8fCBzdXBlckRlZi5hZnRlckNvbnRlbnRDaGVja2VkO1xuICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRJbml0ID0gZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRJbml0IHx8IHN1cGVyRGVmLmFmdGVyQ29udGVudEluaXQ7XG4gICAgICBkZWZpbml0aW9uLmFmdGVyVmlld0NoZWNrZWQgPSBkZWZpbml0aW9uLmFmdGVyVmlld0NoZWNrZWQgfHwgc3VwZXJEZWYuYWZ0ZXJWaWV3Q2hlY2tlZDtcbiAgICAgIGRlZmluaXRpb24uYWZ0ZXJWaWV3SW5pdCA9IGRlZmluaXRpb24uYWZ0ZXJWaWV3SW5pdCB8fCBzdXBlckRlZi5hZnRlclZpZXdJbml0O1xuICAgICAgZGVmaW5pdGlvbi5kb0NoZWNrID0gZGVmaW5pdGlvbi5kb0NoZWNrIHx8IHN1cGVyRGVmLmRvQ2hlY2s7XG4gICAgICBkZWZpbml0aW9uLm9uRGVzdHJveSA9IGRlZmluaXRpb24ub25EZXN0cm95IHx8IHN1cGVyRGVmLm9uRGVzdHJveTtcbiAgICAgIGRlZmluaXRpb24ub25Jbml0ID0gZGVmaW5pdGlvbi5vbkluaXQgfHwgc3VwZXJEZWYub25Jbml0O1xuICAgICAgZGVmaW5pdGlvbi5vbkNoYW5nZXMgPSBkZWZpbml0aW9uLm9uQ2hhbmdlcyB8fCBzdXBlckRlZi5vbkNoYW5nZXM7XG5cbiAgICAgIC8vIFJ1biBwYXJlbnQgZmVhdHVyZXNcbiAgICAgIGNvbnN0IGZlYXR1cmVzID0gc3VwZXJEZWYuZmVhdHVyZXM7XG4gICAgICBpZiAoZmVhdHVyZXMpIHtcbiAgICAgICAgZm9yIChjb25zdCBmZWF0dXJlIG9mIGZlYXR1cmVzKSB7XG4gICAgICAgICAgaWYgKGZlYXR1cmUgJiYgZmVhdHVyZS5uZ0luaGVyaXQpIHtcbiAgICAgICAgICAgIChmZWF0dXJlIGFzIERpcmVjdGl2ZURlZkZlYXR1cmUpKGRlZmluaXRpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRXZlbiBpZiB3ZSBkb24ndCBoYXZlIGEgZGVmaW5pdGlvbiwgY2hlY2sgdGhlIHR5cGUgZm9yIHRoZSBob29rcyBhbmQgdXNlIHRob3NlIGlmIG5lZWQgYmVcbiAgICAgIGNvbnN0IHN1cGVyUHJvdG90eXBlID0gc3VwZXJUeXBlLnByb3RvdHlwZTtcbiAgICAgIGlmIChzdXBlclByb3RvdHlwZSkge1xuICAgICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudENoZWNrZWQgPVxuICAgICAgICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRDaGVja2VkIHx8IHN1cGVyUHJvdG90eXBlLm5nQWZ0ZXJDb250ZW50Q2hlY2tlZDtcbiAgICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRJbml0ID1cbiAgICAgICAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50SW5pdCB8fCBzdXBlclByb3RvdHlwZS5uZ0FmdGVyQ29udGVudEluaXQ7XG4gICAgICAgIGRlZmluaXRpb24uYWZ0ZXJWaWV3Q2hlY2tlZCA9XG4gICAgICAgICAgICBkZWZpbml0aW9uLmFmdGVyVmlld0NoZWNrZWQgfHwgc3VwZXJQcm90b3R5cGUubmdBZnRlclZpZXdDaGVja2VkO1xuICAgICAgICBkZWZpbml0aW9uLmFmdGVyVmlld0luaXQgPSBkZWZpbml0aW9uLmFmdGVyVmlld0luaXQgfHwgc3VwZXJQcm90b3R5cGUubmdBZnRlclZpZXdJbml0O1xuICAgICAgICBkZWZpbml0aW9uLmRvQ2hlY2sgPSBkZWZpbml0aW9uLmRvQ2hlY2sgfHwgc3VwZXJQcm90b3R5cGUubmdEb0NoZWNrO1xuICAgICAgICBkZWZpbml0aW9uLm9uRGVzdHJveSA9IGRlZmluaXRpb24ub25EZXN0cm95IHx8IHN1cGVyUHJvdG90eXBlLm5nT25EZXN0cm95O1xuICAgICAgICBkZWZpbml0aW9uLm9uSW5pdCA9IGRlZmluaXRpb24ub25Jbml0IHx8IHN1cGVyUHJvdG90eXBlLm5nT25Jbml0O1xuICAgICAgICBkZWZpbml0aW9uLm9uQ2hhbmdlcyA9IGRlZmluaXRpb24ub25DaGFuZ2VzIHx8IHN1cGVyUHJvdG90eXBlLm5nT25DaGFuZ2VzO1xuICAgICAgfVxuICAgIH1cblxuICAgIHN1cGVyVHlwZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihzdXBlclR5cGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1heWJlVW53cmFwRW1wdHk8VD4odmFsdWU6IFRbXSk6IFRbXTtcbmZ1bmN0aW9uIG1heWJlVW53cmFwRW1wdHk8VD4odmFsdWU6IFQpOiBUO1xuZnVuY3Rpb24gbWF5YmVVbndyYXBFbXB0eSh2YWx1ZTogYW55KTogYW55IHtcbiAgaWYgKHZhbHVlID09PSBFTVBUWV9PQkopIHtcbiAgICByZXR1cm4ge307XG4gIH0gZWxzZSBpZiAodmFsdWUgPT09IEVNUFRZX0FSUkFZKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxufVxuIl19