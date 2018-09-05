/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { fillProperties } from '../../util/property';
import { EMPTY, EMPTY_ARRAY } from '../definition';
/**
 * Determines if a definition is a {@link ComponentDefInternal} or a {@link DirectiveDefInternal}
 * @param definition The definition to examine
 */
function isComponentDef(definition) {
    var def = definition;
    return typeof def.template === 'function';
}
function getSuperType(type) {
    return Object.getPrototypeOf(type.prototype).constructor;
}
/**
 * Merges the definition from a super class to a sub class.
 * @param definition The definition that is a SubClass of another directive of component
 */
export function InheritDefinitionFeature(definition) {
    var superType = getSuperType(definition.type);
    var _loop_1 = function () {
        var e_1, _a;
        var superDef = undefined;
        if (isComponentDef(definition)) {
            superDef = superType.ngComponentDef || superType.ngDirectiveDef;
        }
        else {
            if (superType.ngComponentDef) {
                throw new Error('Directives cannot inherit Components');
            }
            superDef = superType.ngDirectiveDef;
        }
        var baseDef = superType.ngBaseDef;
        // Some fields in the definition may be empty, if there were no values to put in them that
        // would've justified object creation. Unwrap them if necessary.
        if (baseDef || superDef) {
            var writeableDef = definition;
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
            // Merge hostBindings
            var prevHostBindings_1 = definition.hostBindings;
            var superHostBindings_1 = superDef.hostBindings;
            if (superHostBindings_1) {
                if (prevHostBindings_1) {
                    definition.hostBindings = function (directiveIndex, elementIndex) {
                        superHostBindings_1(directiveIndex, elementIndex);
                        prevHostBindings_1(directiveIndex, elementIndex);
                    };
                }
                else {
                    definition.hostBindings = superHostBindings_1;
                }
            }
            // Merge View Queries
            if (isComponentDef(definition) && isComponentDef(superDef)) {
                var prevViewQuery_1 = definition.viewQuery;
                var superViewQuery_1 = superDef.viewQuery;
                if (superViewQuery_1) {
                    if (prevViewQuery_1) {
                        definition.viewQuery = function (rf, ctx) {
                            superViewQuery_1(rf, ctx);
                            prevViewQuery_1(rf, ctx);
                        };
                    }
                    else {
                        definition.viewQuery = superViewQuery_1;
                    }
                }
            }
            // Merge Content Queries
            var prevContentQueries_1 = definition.contentQueries;
            var superContentQueries_1 = superDef.contentQueries;
            if (superContentQueries_1) {
                if (prevContentQueries_1) {
                    definition.contentQueries = function () {
                        superContentQueries_1();
                        prevContentQueries_1();
                    };
                }
                else {
                    definition.contentQueries = superContentQueries_1;
                }
            }
            // Merge Content Queries Refresh
            var prevContentQueriesRefresh_1 = definition.contentQueriesRefresh;
            var superContentQueriesRefresh_1 = superDef.contentQueriesRefresh;
            if (superContentQueriesRefresh_1) {
                if (prevContentQueriesRefresh_1) {
                    definition.contentQueriesRefresh = function (directiveIndex, queryIndex) {
                        superContentQueriesRefresh_1(directiveIndex, queryIndex);
                        prevContentQueriesRefresh_1(directiveIndex, queryIndex);
                    };
                }
                else {
                    definition.contentQueriesRefresh = superContentQueriesRefresh_1;
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
            // Run parent features
            var features = superDef.features;
            if (features) {
                try {
                    for (var features_1 = tslib_1.__values(features), features_1_1 = features_1.next(); !features_1_1.done; features_1_1 = features_1.next()) {
                        var feature = features_1_1.value;
                        if (feature && feature !== InheritDefinitionFeature) {
                            feature(definition);
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (features_1_1 && !features_1_1.done && (_a = features_1.return)) _a.call(features_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            return "break";
        }
        else {
            // Even if we don't have a definition, check the type for the hooks and use those if need be
            var superPrototype = superType.prototype;
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
    };
    while (superType) {
        var state_1 = _loop_1();
        if (state_1 === "break")
            break;
    }
}
function maybeUnwrapEmpty(value) {
    if (value === EMPTY) {
        return {};
    }
    else if (Array.isArray(value) && value === EMPTY_ARRAY) {
        return [];
    }
    else {
        return value;
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5oZXJpdF9kZWZpbml0aW9uX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL2luaGVyaXRfZGVmaW5pdGlvbl9mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFHSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDbkQsT0FBTyxFQUFDLEtBQUssRUFBRSxXQUFXLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFLakQ7OztHQUdHO0FBQ0gsU0FBUyxjQUFjLENBQUksVUFBNEQ7SUFFckYsSUFBTSxHQUFHLEdBQUcsVUFBcUMsQ0FBQztJQUNsRCxPQUFPLE9BQU8sR0FBRyxDQUFDLFFBQVEsS0FBSyxVQUFVLENBQUM7QUFDNUMsQ0FBQztBQUVELFNBQVMsWUFBWSxDQUFDLElBQWU7SUFFbkMsT0FBTyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxXQUFXLENBQUM7QUFDM0QsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSx3QkFBd0IsQ0FDcEMsVUFBZ0U7SUFDbEUsSUFBSSxTQUFTLEdBQUcsWUFBWSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7O1FBRzVDLElBQUksUUFBUSxHQUFrRSxTQUFTLENBQUM7UUFDeEYsSUFBSSxjQUFjLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDOUIsUUFBUSxHQUFHLFNBQVMsQ0FBQyxjQUFjLElBQUksU0FBUyxDQUFDLGNBQWMsQ0FBQztTQUNqRTthQUFNO1lBQ0wsSUFBSSxTQUFTLENBQUMsY0FBYyxFQUFFO2dCQUM1QixNQUFNLElBQUksS0FBSyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7YUFDekQ7WUFDRCxRQUFRLEdBQUcsU0FBUyxDQUFDLGNBQWMsQ0FBQztTQUNy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Q0FBQyxDQUFDOztJQXRJL0MsT0FBTyxTQUFTOzs7O0tBdUlmO0FBQ0gsQ0FBQztBQUlELFNBQVMsZ0JBQWdCLENBQUMsS0FBVTtJQUNsQyxJQUFJLEtBQUssS0FBSyxLQUFLLEVBQUU7UUFDbkIsT0FBTyxFQUFFLENBQUM7S0FDWDtTQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLEtBQUssV0FBVyxFQUFFO1FBQ3hELE9BQU8sRUFBRSxDQUFDO0tBQ1g7U0FBTTtRQUNMLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL3R5cGUnO1xuaW1wb3J0IHtmaWxsUHJvcGVydGllc30gZnJvbSAnLi4vLi4vdXRpbC9wcm9wZXJ0eSc7XG5pbXBvcnQge0VNUFRZLCBFTVBUWV9BUlJBWX0gZnJvbSAnLi4vZGVmaW5pdGlvbic7XG5pbXBvcnQge0NvbXBvbmVudERlZkludGVybmFsLCBDb21wb25lbnRUZW1wbGF0ZSwgRGlyZWN0aXZlRGVmRmVhdHVyZSwgRGlyZWN0aXZlRGVmSW50ZXJuYWwsIFJlbmRlckZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuXG5cblxuLyoqXG4gKiBEZXRlcm1pbmVzIGlmIGEgZGVmaW5pdGlvbiBpcyBhIHtAbGluayBDb21wb25lbnREZWZJbnRlcm5hbH0gb3IgYSB7QGxpbmsgRGlyZWN0aXZlRGVmSW50ZXJuYWx9XG4gKiBAcGFyYW0gZGVmaW5pdGlvbiBUaGUgZGVmaW5pdGlvbiB0byBleGFtaW5lXG4gKi9cbmZ1bmN0aW9uIGlzQ29tcG9uZW50RGVmPFQ+KGRlZmluaXRpb246IENvbXBvbmVudERlZkludGVybmFsPFQ+fCBEaXJlY3RpdmVEZWZJbnRlcm5hbDxUPik6XG4gICAgZGVmaW5pdGlvbiBpcyBDb21wb25lbnREZWZJbnRlcm5hbDxUPiB7XG4gIGNvbnN0IGRlZiA9IGRlZmluaXRpb24gYXMgQ29tcG9uZW50RGVmSW50ZXJuYWw8VD47XG4gIHJldHVybiB0eXBlb2YgZGVmLnRlbXBsYXRlID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBnZXRTdXBlclR5cGUodHlwZTogVHlwZTxhbnk+KTogVHlwZTxhbnk+JlxuICAgIHtuZ0NvbXBvbmVudERlZj86IENvbXBvbmVudERlZkludGVybmFsPGFueT4sIG5nRGlyZWN0aXZlRGVmPzogRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55Pn0ge1xuICByZXR1cm4gT2JqZWN0LmdldFByb3RvdHlwZU9mKHR5cGUucHJvdG90eXBlKS5jb25zdHJ1Y3Rvcjtcbn1cblxuLyoqXG4gKiBNZXJnZXMgdGhlIGRlZmluaXRpb24gZnJvbSBhIHN1cGVyIGNsYXNzIHRvIGEgc3ViIGNsYXNzLlxuICogQHBhcmFtIGRlZmluaXRpb24gVGhlIGRlZmluaXRpb24gdGhhdCBpcyBhIFN1YkNsYXNzIG9mIGFub3RoZXIgZGlyZWN0aXZlIG9mIGNvbXBvbmVudFxuICovXG5leHBvcnQgZnVuY3Rpb24gSW5oZXJpdERlZmluaXRpb25GZWF0dXJlKFxuICAgIGRlZmluaXRpb246IERpcmVjdGl2ZURlZkludGVybmFsPGFueT58IENvbXBvbmVudERlZkludGVybmFsPGFueT4pOiB2b2lkIHtcbiAgbGV0IHN1cGVyVHlwZSA9IGdldFN1cGVyVHlwZShkZWZpbml0aW9uLnR5cGUpO1xuXG4gIHdoaWxlIChzdXBlclR5cGUpIHtcbiAgICBsZXQgc3VwZXJEZWY6IERpcmVjdGl2ZURlZkludGVybmFsPGFueT58Q29tcG9uZW50RGVmSW50ZXJuYWw8YW55Pnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKGlzQ29tcG9uZW50RGVmKGRlZmluaXRpb24pKSB7XG4gICAgICBzdXBlckRlZiA9IHN1cGVyVHlwZS5uZ0NvbXBvbmVudERlZiB8fCBzdXBlclR5cGUubmdEaXJlY3RpdmVEZWY7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzdXBlclR5cGUubmdDb21wb25lbnREZWYpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEaXJlY3RpdmVzIGNhbm5vdCBpbmhlcml0IENvbXBvbmVudHMnKTtcbiAgICAgIH1cbiAgICAgIHN1cGVyRGVmID0gc3VwZXJUeXBlLm5nRGlyZWN0aXZlRGVmO1xuICAgIH1cblxuICAgIGNvbnN0IGJhc2VEZWYgPSAoc3VwZXJUeXBlIGFzIGFueSkubmdCYXNlRGVmO1xuXG4gICAgLy8gU29tZSBmaWVsZHMgaW4gdGhlIGRlZmluaXRpb24gbWF5IGJlIGVtcHR5LCBpZiB0aGVyZSB3ZXJlIG5vIHZhbHVlcyB0byBwdXQgaW4gdGhlbSB0aGF0XG4gICAgLy8gd291bGQndmUganVzdGlmaWVkIG9iamVjdCBjcmVhdGlvbi4gVW53cmFwIHRoZW0gaWYgbmVjZXNzYXJ5LlxuICAgIGlmIChiYXNlRGVmIHx8IHN1cGVyRGVmKSB7XG4gICAgICBjb25zdCB3cml0ZWFibGVEZWYgPSBkZWZpbml0aW9uIGFzIGFueTtcbiAgICAgIHdyaXRlYWJsZURlZi5pbnB1dHMgPSBtYXliZVVud3JhcEVtcHR5KGRlZmluaXRpb24uaW5wdXRzKTtcbiAgICAgIHdyaXRlYWJsZURlZi5kZWNsYXJlZElucHV0cyA9IG1heWJlVW53cmFwRW1wdHkoZGVmaW5pdGlvbi5kZWNsYXJlZElucHV0cyk7XG4gICAgICB3cml0ZWFibGVEZWYub3V0cHV0cyA9IG1heWJlVW53cmFwRW1wdHkoZGVmaW5pdGlvbi5vdXRwdXRzKTtcbiAgICB9XG5cbiAgICBpZiAoYmFzZURlZikge1xuICAgICAgLy8gTWVyZ2UgaW5wdXRzIGFuZCBvdXRwdXRzXG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLmlucHV0cywgYmFzZURlZi5pbnB1dHMpO1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5kZWNsYXJlZElucHV0cywgYmFzZURlZi5kZWNsYXJlZElucHV0cyk7XG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLm91dHB1dHMsIGJhc2VEZWYub3V0cHV0cyk7XG4gICAgfVxuXG4gICAgaWYgKHN1cGVyRGVmKSB7XG4gICAgICAvLyBNZXJnZSBob3N0QmluZGluZ3NcbiAgICAgIGNvbnN0IHByZXZIb3N0QmluZGluZ3MgPSBkZWZpbml0aW9uLmhvc3RCaW5kaW5ncztcbiAgICAgIGNvbnN0IHN1cGVySG9zdEJpbmRpbmdzID0gc3VwZXJEZWYuaG9zdEJpbmRpbmdzO1xuICAgICAgaWYgKHN1cGVySG9zdEJpbmRpbmdzKSB7XG4gICAgICAgIGlmIChwcmV2SG9zdEJpbmRpbmdzKSB7XG4gICAgICAgICAgZGVmaW5pdGlvbi5ob3N0QmluZGluZ3MgPSAoZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgZWxlbWVudEluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIHN1cGVySG9zdEJpbmRpbmdzKGRpcmVjdGl2ZUluZGV4LCBlbGVtZW50SW5kZXgpO1xuICAgICAgICAgICAgcHJldkhvc3RCaW5kaW5ncyhkaXJlY3RpdmVJbmRleCwgZWxlbWVudEluZGV4KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlZmluaXRpb24uaG9zdEJpbmRpbmdzID0gc3VwZXJIb3N0QmluZGluZ3M7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gTWVyZ2UgVmlldyBRdWVyaWVzXG4gICAgICBpZiAoaXNDb21wb25lbnREZWYoZGVmaW5pdGlvbikgJiYgaXNDb21wb25lbnREZWYoc3VwZXJEZWYpKSB7XG4gICAgICAgIGNvbnN0IHByZXZWaWV3UXVlcnkgPSBkZWZpbml0aW9uLnZpZXdRdWVyeTtcbiAgICAgICAgY29uc3Qgc3VwZXJWaWV3UXVlcnkgPSBzdXBlckRlZi52aWV3UXVlcnk7XG4gICAgICAgIGlmIChzdXBlclZpZXdRdWVyeSkge1xuICAgICAgICAgIGlmIChwcmV2Vmlld1F1ZXJ5KSB7XG4gICAgICAgICAgICBkZWZpbml0aW9uLnZpZXdRdWVyeSA9IDxUPihyZjogUmVuZGVyRmxhZ3MsIGN0eDogVCk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgICBzdXBlclZpZXdRdWVyeShyZiwgY3R4KTtcbiAgICAgICAgICAgICAgcHJldlZpZXdRdWVyeShyZiwgY3R4KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlZmluaXRpb24udmlld1F1ZXJ5ID0gc3VwZXJWaWV3UXVlcnk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIE1lcmdlIENvbnRlbnQgUXVlcmllc1xuICAgICAgY29uc3QgcHJldkNvbnRlbnRRdWVyaWVzID0gZGVmaW5pdGlvbi5jb250ZW50UXVlcmllcztcbiAgICAgIGNvbnN0IHN1cGVyQ29udGVudFF1ZXJpZXMgPSBzdXBlckRlZi5jb250ZW50UXVlcmllcztcbiAgICAgIGlmIChzdXBlckNvbnRlbnRRdWVyaWVzKSB7XG4gICAgICAgIGlmIChwcmV2Q29udGVudFF1ZXJpZXMpIHtcbiAgICAgICAgICBkZWZpbml0aW9uLmNvbnRlbnRRdWVyaWVzID0gKCkgPT4ge1xuICAgICAgICAgICAgc3VwZXJDb250ZW50UXVlcmllcygpO1xuICAgICAgICAgICAgcHJldkNvbnRlbnRRdWVyaWVzKCk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWZpbml0aW9uLmNvbnRlbnRRdWVyaWVzID0gc3VwZXJDb250ZW50UXVlcmllcztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBNZXJnZSBDb250ZW50IFF1ZXJpZXMgUmVmcmVzaFxuICAgICAgY29uc3QgcHJldkNvbnRlbnRRdWVyaWVzUmVmcmVzaCA9IGRlZmluaXRpb24uY29udGVudFF1ZXJpZXNSZWZyZXNoO1xuICAgICAgY29uc3Qgc3VwZXJDb250ZW50UXVlcmllc1JlZnJlc2ggPSBzdXBlckRlZi5jb250ZW50UXVlcmllc1JlZnJlc2g7XG4gICAgICBpZiAoc3VwZXJDb250ZW50UXVlcmllc1JlZnJlc2gpIHtcbiAgICAgICAgaWYgKHByZXZDb250ZW50UXVlcmllc1JlZnJlc2gpIHtcbiAgICAgICAgICBkZWZpbml0aW9uLmNvbnRlbnRRdWVyaWVzUmVmcmVzaCA9IChkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBxdWVyeUluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIHN1cGVyQ29udGVudFF1ZXJpZXNSZWZyZXNoKGRpcmVjdGl2ZUluZGV4LCBxdWVyeUluZGV4KTtcbiAgICAgICAgICAgIHByZXZDb250ZW50UXVlcmllc1JlZnJlc2goZGlyZWN0aXZlSW5kZXgsIHF1ZXJ5SW5kZXgpO1xuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVmaW5pdGlvbi5jb250ZW50UXVlcmllc1JlZnJlc2ggPSBzdXBlckNvbnRlbnRRdWVyaWVzUmVmcmVzaDtcbiAgICAgICAgfVxuICAgICAgfVxuXG5cbiAgICAgIC8vIE1lcmdlIGlucHV0cyBhbmQgb3V0cHV0c1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5pbnB1dHMsIHN1cGVyRGVmLmlucHV0cyk7XG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLmRlY2xhcmVkSW5wdXRzLCBzdXBlckRlZi5kZWNsYXJlZElucHV0cyk7XG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLm91dHB1dHMsIHN1cGVyRGVmLm91dHB1dHMpO1xuXG4gICAgICAvLyBJbmhlcml0IGhvb2tzXG4gICAgICAvLyBBc3N1bWUgc3VwZXIgY2xhc3MgaW5oZXJpdGFuY2UgZmVhdHVyZSBoYXMgYWxyZWFkeSBydW4uXG4gICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudENoZWNrZWQgPVxuICAgICAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50Q2hlY2tlZCB8fCBzdXBlckRlZi5hZnRlckNvbnRlbnRDaGVja2VkO1xuICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRJbml0ID0gZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRJbml0IHx8IHN1cGVyRGVmLmFmdGVyQ29udGVudEluaXQ7XG4gICAgICBkZWZpbml0aW9uLmFmdGVyVmlld0NoZWNrZWQgPSBkZWZpbml0aW9uLmFmdGVyVmlld0NoZWNrZWQgfHwgc3VwZXJEZWYuYWZ0ZXJWaWV3Q2hlY2tlZDtcbiAgICAgIGRlZmluaXRpb24uYWZ0ZXJWaWV3SW5pdCA9IGRlZmluaXRpb24uYWZ0ZXJWaWV3SW5pdCB8fCBzdXBlckRlZi5hZnRlclZpZXdJbml0O1xuICAgICAgZGVmaW5pdGlvbi5kb0NoZWNrID0gZGVmaW5pdGlvbi5kb0NoZWNrIHx8IHN1cGVyRGVmLmRvQ2hlY2s7XG4gICAgICBkZWZpbml0aW9uLm9uRGVzdHJveSA9IGRlZmluaXRpb24ub25EZXN0cm95IHx8IHN1cGVyRGVmLm9uRGVzdHJveTtcbiAgICAgIGRlZmluaXRpb24ub25Jbml0ID0gZGVmaW5pdGlvbi5vbkluaXQgfHwgc3VwZXJEZWYub25Jbml0O1xuXG4gICAgICAvLyBSdW4gcGFyZW50IGZlYXR1cmVzXG4gICAgICBjb25zdCBmZWF0dXJlcyA9IHN1cGVyRGVmLmZlYXR1cmVzO1xuICAgICAgaWYgKGZlYXR1cmVzKSB7XG4gICAgICAgIGZvciAoY29uc3QgZmVhdHVyZSBvZiBmZWF0dXJlcykge1xuICAgICAgICAgIGlmIChmZWF0dXJlICYmIGZlYXR1cmUgIT09IEluaGVyaXREZWZpbml0aW9uRmVhdHVyZSkge1xuICAgICAgICAgICAgKGZlYXR1cmUgYXMgRGlyZWN0aXZlRGVmRmVhdHVyZSkoZGVmaW5pdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBFdmVuIGlmIHdlIGRvbid0IGhhdmUgYSBkZWZpbml0aW9uLCBjaGVjayB0aGUgdHlwZSBmb3IgdGhlIGhvb2tzIGFuZCB1c2UgdGhvc2UgaWYgbmVlZCBiZVxuICAgICAgY29uc3Qgc3VwZXJQcm90b3R5cGUgPSBzdXBlclR5cGUucHJvdG90eXBlO1xuXG4gICAgICBpZiAoc3VwZXJQcm90b3R5cGUpIHtcbiAgICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRDaGVja2VkID1cbiAgICAgICAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50Q2hlY2tlZCB8fCBzdXBlclByb3RvdHlwZS5hZnRlckNvbnRlbnRDaGVja2VkO1xuICAgICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudEluaXQgPVxuICAgICAgICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRJbml0IHx8IHN1cGVyUHJvdG90eXBlLmFmdGVyQ29udGVudEluaXQ7XG4gICAgICAgIGRlZmluaXRpb24uYWZ0ZXJWaWV3Q2hlY2tlZCA9XG4gICAgICAgICAgICBkZWZpbml0aW9uLmFmdGVyVmlld0NoZWNrZWQgfHwgc3VwZXJQcm90b3R5cGUuYWZ0ZXJWaWV3Q2hlY2tlZDtcbiAgICAgICAgZGVmaW5pdGlvbi5hZnRlclZpZXdJbml0ID0gZGVmaW5pdGlvbi5hZnRlclZpZXdJbml0IHx8IHN1cGVyUHJvdG90eXBlLmFmdGVyVmlld0luaXQ7XG4gICAgICAgIGRlZmluaXRpb24uZG9DaGVjayA9IGRlZmluaXRpb24uZG9DaGVjayB8fCBzdXBlclByb3RvdHlwZS5kb0NoZWNrO1xuICAgICAgICBkZWZpbml0aW9uLm9uRGVzdHJveSA9IGRlZmluaXRpb24ub25EZXN0cm95IHx8IHN1cGVyUHJvdG90eXBlLm9uRGVzdHJveTtcbiAgICAgICAgZGVmaW5pdGlvbi5vbkluaXQgPSBkZWZpbml0aW9uLm9uSW5pdCB8fCBzdXBlclByb3RvdHlwZS5vbkluaXQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc3VwZXJUeXBlID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHN1cGVyVHlwZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWF5YmVVbndyYXBFbXB0eTxUPih2YWx1ZTogVFtdKTogVFtdO1xuZnVuY3Rpb24gbWF5YmVVbndyYXBFbXB0eTxUPih2YWx1ZTogVCk6IFQ7XG5mdW5jdGlvbiBtYXliZVVud3JhcEVtcHR5KHZhbHVlOiBhbnkpOiBhbnkge1xuICBpZiAodmFsdWUgPT09IEVNUFRZKSB7XG4gICAgcmV0dXJuIHt9O1xuICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpICYmIHZhbHVlID09PSBFTVBUWV9BUlJBWSkge1xuICAgIHJldHVybiBbXTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbn1cbiJdfQ==