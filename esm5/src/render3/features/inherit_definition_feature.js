/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { fillProperties } from '../../util/property';
import { EMPTY_ARRAY, EMPTY_OBJ } from '../empty';
import { adjustActiveDirectiveSuperClassDepthPosition } from '../state';
import { isComponentDef } from '../util/view_utils';
import { NgOnChangesFeature } from './ng_onchanges_feature';
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
                    // because inheritance is unknown during compile time, the runtime code
                    // needs to be informed of the super-class depth so that instruction code
                    // can distinguish one host bindings function from another. The reason why
                    // relying on the directive uniqueId exclusively is not enough is because the
                    // uniqueId value and the directive instance stay the same between hostBindings
                    // calls throughout the directive inheritance chain. This means that without
                    // a super-class depth value, there is no way to know whether a parent or
                    // sub-class host bindings function is currently being executed.
                    definition.hostBindings = function (rf, ctx, elementIndex) {
                        // The reason why we increment first and then decrement is so that parent
                        // hostBindings calls have a higher id value compared to sub-class hostBindings
                        // calls (this way the leaf directive is always at a super-class depth of 0).
                        adjustActiveDirectiveSuperClassDepthPosition(1);
                        try {
                            superHostBindings_1(rf, ctx, elementIndex);
                        }
                        finally {
                            adjustActiveDirectiveSuperClassDepthPosition(-1);
                        }
                        prevHostBindings_1(rf, ctx, elementIndex);
                    };
                }
                else {
                    definition.hostBindings = superHostBindings_1;
                }
            }
            // Merge View Queries
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
            // Merge Content Queries
            var prevContentQueries_1 = definition.contentQueries;
            var superContentQueries_1 = superDef.contentQueries;
            if (superContentQueries_1) {
                if (prevContentQueries_1) {
                    definition.contentQueries = function (rf, ctx, directiveIndex) {
                        superContentQueries_1(rf, ctx, directiveIndex);
                        prevContentQueries_1(rf, ctx, directiveIndex);
                    };
                }
                else {
                    definition.contentQueries = superContentQueries_1;
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
                        if (feature && feature.ngInherit) {
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
        }
        else {
            // Even if we don't have a definition, check the type for the hooks and use those if need be
            var superPrototype = superType.prototype;
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
                if (superPrototype.ngOnChanges) {
                    NgOnChangesFeature()(definition);
                }
            }
        }
        superType = Object.getPrototypeOf(superType);
    };
    while (superType) {
        _loop_1();
    }
}
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5oZXJpdF9kZWZpbml0aW9uX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL2luaGVyaXRfZGVmaW5pdGlvbl9mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFHSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDbkQsT0FBTyxFQUFDLFdBQVcsRUFBRSxTQUFTLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFaEQsT0FBTyxFQUFDLDRDQUE0QyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3RFLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUVsRCxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUUxRCxTQUFTLFlBQVksQ0FBQyxJQUFlO0lBRW5DLE9BQU8sTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsV0FBVyxDQUFDO0FBQzNELENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsVUFBZ0Q7SUFDdkYsSUFBSSxTQUFTLEdBQUcsWUFBWSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7O1FBRzVDLElBQUksUUFBUSxHQUFrRCxTQUFTLENBQUM7UUFDeEUsSUFBSSxjQUFjLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDOUIsK0VBQStFO1lBQy9FLFFBQVEsR0FBRyxTQUFTLENBQUMsY0FBYyxJQUFJLFNBQVMsQ0FBQyxjQUFjLENBQUM7U0FDakU7YUFBTTtZQUNMLElBQUksU0FBUyxDQUFDLGNBQWMsRUFBRTtnQkFDNUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO2FBQ3pEO1lBQ0QsK0VBQStFO1lBQy9FLFFBQVEs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UUFFRCxTQUFTLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQzs7SUF6SS9DLE9BQU8sU0FBUzs7S0EwSWY7QUFDSCxDQUFDO0FBSUQsU0FBUyxnQkFBZ0IsQ0FBQyxLQUFVO0lBQ2xDLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtRQUN2QixPQUFPLEVBQUUsQ0FBQztLQUNYO1NBQU0sSUFBSSxLQUFLLEtBQUssV0FBVyxFQUFFO1FBQ2hDLE9BQU8sRUFBRSxDQUFDO0tBQ1g7U0FBTTtRQUNMLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7ZmlsbFByb3BlcnRpZXN9IGZyb20gJy4uLy4uL3V0aWwvcHJvcGVydHknO1xuaW1wb3J0IHtFTVBUWV9BUlJBWSwgRU1QVFlfT0JKfSBmcm9tICcuLi9lbXB0eSc7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgRGlyZWN0aXZlRGVmLCBEaXJlY3RpdmVEZWZGZWF0dXJlLCBSZW5kZXJGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7YWRqdXN0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoUG9zaXRpb259IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7aXNDb21wb25lbnREZWZ9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmltcG9ydCB7TmdPbkNoYW5nZXNGZWF0dXJlfSBmcm9tICcuL25nX29uY2hhbmdlc19mZWF0dXJlJztcblxuZnVuY3Rpb24gZ2V0U3VwZXJUeXBlKHR5cGU6IFR5cGU8YW55Pik6IFR5cGU8YW55PiZcbiAgICB7bmdDb21wb25lbnREZWY/OiBDb21wb25lbnREZWY8YW55PiwgbmdEaXJlY3RpdmVEZWY/OiBEaXJlY3RpdmVEZWY8YW55Pn0ge1xuICByZXR1cm4gT2JqZWN0LmdldFByb3RvdHlwZU9mKHR5cGUucHJvdG90eXBlKS5jb25zdHJ1Y3Rvcjtcbn1cblxuLyoqXG4gKiBNZXJnZXMgdGhlIGRlZmluaXRpb24gZnJvbSBhIHN1cGVyIGNsYXNzIHRvIGEgc3ViIGNsYXNzLlxuICogQHBhcmFtIGRlZmluaXRpb24gVGhlIGRlZmluaXRpb24gdGhhdCBpcyBhIFN1YkNsYXNzIG9mIGFub3RoZXIgZGlyZWN0aXZlIG9mIGNvbXBvbmVudFxuICovXG5leHBvcnQgZnVuY3Rpb24gSW5oZXJpdERlZmluaXRpb25GZWF0dXJlKGRlZmluaXRpb246IERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55Pik6IHZvaWQge1xuICBsZXQgc3VwZXJUeXBlID0gZ2V0U3VwZXJUeXBlKGRlZmluaXRpb24udHlwZSk7XG5cbiAgd2hpbGUgKHN1cGVyVHlwZSkge1xuICAgIGxldCBzdXBlckRlZjogRGlyZWN0aXZlRGVmPGFueT58Q29tcG9uZW50RGVmPGFueT58dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgIGlmIChpc0NvbXBvbmVudERlZihkZWZpbml0aW9uKSkge1xuICAgICAgLy8gRG9uJ3QgdXNlIGdldENvbXBvbmVudERlZi9nZXREaXJlY3RpdmVEZWYuIFRoaXMgbG9naWMgcmVsaWVzIG9uIGluaGVyaXRhbmNlLlxuICAgICAgc3VwZXJEZWYgPSBzdXBlclR5cGUubmdDb21wb25lbnREZWYgfHwgc3VwZXJUeXBlLm5nRGlyZWN0aXZlRGVmO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoc3VwZXJUeXBlLm5nQ29tcG9uZW50RGVmKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRGlyZWN0aXZlcyBjYW5ub3QgaW5oZXJpdCBDb21wb25lbnRzJyk7XG4gICAgICB9XG4gICAgICAvLyBEb24ndCB1c2UgZ2V0Q29tcG9uZW50RGVmL2dldERpcmVjdGl2ZURlZi4gVGhpcyBsb2dpYyByZWxpZXMgb24gaW5oZXJpdGFuY2UuXG4gICAgICBzdXBlckRlZiA9IHN1cGVyVHlwZS5uZ0RpcmVjdGl2ZURlZjtcbiAgICB9XG5cbiAgICBjb25zdCBiYXNlRGVmID0gKHN1cGVyVHlwZSBhcyBhbnkpLm5nQmFzZURlZjtcblxuICAgIC8vIFNvbWUgZmllbGRzIGluIHRoZSBkZWZpbml0aW9uIG1heSBiZSBlbXB0eSwgaWYgdGhlcmUgd2VyZSBubyB2YWx1ZXMgdG8gcHV0IGluIHRoZW0gdGhhdFxuICAgIC8vIHdvdWxkJ3ZlIGp1c3RpZmllZCBvYmplY3QgY3JlYXRpb24uIFVud3JhcCB0aGVtIGlmIG5lY2Vzc2FyeS5cbiAgICBpZiAoYmFzZURlZiB8fCBzdXBlckRlZikge1xuICAgICAgY29uc3Qgd3JpdGVhYmxlRGVmID0gZGVmaW5pdGlvbiBhcyBhbnk7XG4gICAgICB3cml0ZWFibGVEZWYuaW5wdXRzID0gbWF5YmVVbndyYXBFbXB0eShkZWZpbml0aW9uLmlucHV0cyk7XG4gICAgICB3cml0ZWFibGVEZWYuZGVjbGFyZWRJbnB1dHMgPSBtYXliZVVud3JhcEVtcHR5KGRlZmluaXRpb24uZGVjbGFyZWRJbnB1dHMpO1xuICAgICAgd3JpdGVhYmxlRGVmLm91dHB1dHMgPSBtYXliZVVud3JhcEVtcHR5KGRlZmluaXRpb24ub3V0cHV0cyk7XG4gICAgfVxuXG4gICAgaWYgKGJhc2VEZWYpIHtcbiAgICAgIC8vIE1lcmdlIGlucHV0cyBhbmQgb3V0cHV0c1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5pbnB1dHMsIGJhc2VEZWYuaW5wdXRzKTtcbiAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24uZGVjbGFyZWRJbnB1dHMsIGJhc2VEZWYuZGVjbGFyZWRJbnB1dHMpO1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5vdXRwdXRzLCBiYXNlRGVmLm91dHB1dHMpO1xuICAgIH1cblxuICAgIGlmIChzdXBlckRlZikge1xuICAgICAgLy8gTWVyZ2UgaG9zdEJpbmRpbmdzXG4gICAgICBjb25zdCBwcmV2SG9zdEJpbmRpbmdzID0gZGVmaW5pdGlvbi5ob3N0QmluZGluZ3M7XG4gICAgICBjb25zdCBzdXBlckhvc3RCaW5kaW5ncyA9IHN1cGVyRGVmLmhvc3RCaW5kaW5ncztcbiAgICAgIGlmIChzdXBlckhvc3RCaW5kaW5ncykge1xuICAgICAgICBpZiAocHJldkhvc3RCaW5kaW5ncykge1xuICAgICAgICAgIC8vIGJlY2F1c2UgaW5oZXJpdGFuY2UgaXMgdW5rbm93biBkdXJpbmcgY29tcGlsZSB0aW1lLCB0aGUgcnVudGltZSBjb2RlXG4gICAgICAgICAgLy8gbmVlZHMgdG8gYmUgaW5mb3JtZWQgb2YgdGhlIHN1cGVyLWNsYXNzIGRlcHRoIHNvIHRoYXQgaW5zdHJ1Y3Rpb24gY29kZVxuICAgICAgICAgIC8vIGNhbiBkaXN0aW5ndWlzaCBvbmUgaG9zdCBiaW5kaW5ncyBmdW5jdGlvbiBmcm9tIGFub3RoZXIuIFRoZSByZWFzb24gd2h5XG4gICAgICAgICAgLy8gcmVseWluZyBvbiB0aGUgZGlyZWN0aXZlIHVuaXF1ZUlkIGV4Y2x1c2l2ZWx5IGlzIG5vdCBlbm91Z2ggaXMgYmVjYXVzZSB0aGVcbiAgICAgICAgICAvLyB1bmlxdWVJZCB2YWx1ZSBhbmQgdGhlIGRpcmVjdGl2ZSBpbnN0YW5jZSBzdGF5IHRoZSBzYW1lIGJldHdlZW4gaG9zdEJpbmRpbmdzXG4gICAgICAgICAgLy8gY2FsbHMgdGhyb3VnaG91dCB0aGUgZGlyZWN0aXZlIGluaGVyaXRhbmNlIGNoYWluLiBUaGlzIG1lYW5zIHRoYXQgd2l0aG91dFxuICAgICAgICAgIC8vIGEgc3VwZXItY2xhc3MgZGVwdGggdmFsdWUsIHRoZXJlIGlzIG5vIHdheSB0byBrbm93IHdoZXRoZXIgYSBwYXJlbnQgb3JcbiAgICAgICAgICAvLyBzdWItY2xhc3MgaG9zdCBiaW5kaW5ncyBmdW5jdGlvbiBpcyBjdXJyZW50bHkgYmVpbmcgZXhlY3V0ZWQuXG4gICAgICAgICAgZGVmaW5pdGlvbi5ob3N0QmluZGluZ3MgPSAocmY6IFJlbmRlckZsYWdzLCBjdHg6IGFueSwgZWxlbWVudEluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIC8vIFRoZSByZWFzb24gd2h5IHdlIGluY3JlbWVudCBmaXJzdCBhbmQgdGhlbiBkZWNyZW1lbnQgaXMgc28gdGhhdCBwYXJlbnRcbiAgICAgICAgICAgIC8vIGhvc3RCaW5kaW5ncyBjYWxscyBoYXZlIGEgaGlnaGVyIGlkIHZhbHVlIGNvbXBhcmVkIHRvIHN1Yi1jbGFzcyBob3N0QmluZGluZ3NcbiAgICAgICAgICAgIC8vIGNhbGxzICh0aGlzIHdheSB0aGUgbGVhZiBkaXJlY3RpdmUgaXMgYWx3YXlzIGF0IGEgc3VwZXItY2xhc3MgZGVwdGggb2YgMCkuXG4gICAgICAgICAgICBhZGp1c3RBY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGhQb3NpdGlvbigxKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHN1cGVySG9zdEJpbmRpbmdzKHJmLCBjdHgsIGVsZW1lbnRJbmRleCk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICBhZGp1c3RBY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGhQb3NpdGlvbigtMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcmV2SG9zdEJpbmRpbmdzKHJmLCBjdHgsIGVsZW1lbnRJbmRleCk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWZpbml0aW9uLmhvc3RCaW5kaW5ncyA9IHN1cGVySG9zdEJpbmRpbmdzO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIE1lcmdlIFZpZXcgUXVlcmllc1xuICAgICAgY29uc3QgcHJldlZpZXdRdWVyeSA9IGRlZmluaXRpb24udmlld1F1ZXJ5O1xuICAgICAgY29uc3Qgc3VwZXJWaWV3UXVlcnkgPSBzdXBlckRlZi52aWV3UXVlcnk7XG5cbiAgICAgIGlmIChzdXBlclZpZXdRdWVyeSkge1xuICAgICAgICBpZiAocHJldlZpZXdRdWVyeSkge1xuICAgICAgICAgIGRlZmluaXRpb24udmlld1F1ZXJ5ID0gPFQ+KHJmOiBSZW5kZXJGbGFncywgY3R4OiBUKTogdm9pZCA9PiB7XG4gICAgICAgICAgICBzdXBlclZpZXdRdWVyeShyZiwgY3R4KTtcbiAgICAgICAgICAgIHByZXZWaWV3UXVlcnkocmYsIGN0eCk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWZpbml0aW9uLnZpZXdRdWVyeSA9IHN1cGVyVmlld1F1ZXJ5O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIE1lcmdlIENvbnRlbnQgUXVlcmllc1xuICAgICAgY29uc3QgcHJldkNvbnRlbnRRdWVyaWVzID0gZGVmaW5pdGlvbi5jb250ZW50UXVlcmllcztcbiAgICAgIGNvbnN0IHN1cGVyQ29udGVudFF1ZXJpZXMgPSBzdXBlckRlZi5jb250ZW50UXVlcmllcztcbiAgICAgIGlmIChzdXBlckNvbnRlbnRRdWVyaWVzKSB7XG4gICAgICAgIGlmIChwcmV2Q29udGVudFF1ZXJpZXMpIHtcbiAgICAgICAgICBkZWZpbml0aW9uLmNvbnRlbnRRdWVyaWVzID0gPFQ+KHJmOiBSZW5kZXJGbGFncywgY3R4OiBULCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICBzdXBlckNvbnRlbnRRdWVyaWVzKHJmLCBjdHgsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICAgICAgICAgIHByZXZDb250ZW50UXVlcmllcyhyZiwgY3R4LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWZpbml0aW9uLmNvbnRlbnRRdWVyaWVzID0gc3VwZXJDb250ZW50UXVlcmllcztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBNZXJnZSBpbnB1dHMgYW5kIG91dHB1dHNcbiAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24uaW5wdXRzLCBzdXBlckRlZi5pbnB1dHMpO1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5kZWNsYXJlZElucHV0cywgc3VwZXJEZWYuZGVjbGFyZWRJbnB1dHMpO1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5vdXRwdXRzLCBzdXBlckRlZi5vdXRwdXRzKTtcblxuICAgICAgLy8gSW5oZXJpdCBob29rc1xuICAgICAgLy8gQXNzdW1lIHN1cGVyIGNsYXNzIGluaGVyaXRhbmNlIGZlYXR1cmUgaGFzIGFscmVhZHkgcnVuLlxuICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRDaGVja2VkID1cbiAgICAgICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudENoZWNrZWQgfHwgc3VwZXJEZWYuYWZ0ZXJDb250ZW50Q2hlY2tlZDtcbiAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50SW5pdCA9IGRlZmluaXRpb24uYWZ0ZXJDb250ZW50SW5pdCB8fCBzdXBlckRlZi5hZnRlckNvbnRlbnRJbml0O1xuICAgICAgZGVmaW5pdGlvbi5hZnRlclZpZXdDaGVja2VkID0gZGVmaW5pdGlvbi5hZnRlclZpZXdDaGVja2VkIHx8IHN1cGVyRGVmLmFmdGVyVmlld0NoZWNrZWQ7XG4gICAgICBkZWZpbml0aW9uLmFmdGVyVmlld0luaXQgPSBkZWZpbml0aW9uLmFmdGVyVmlld0luaXQgfHwgc3VwZXJEZWYuYWZ0ZXJWaWV3SW5pdDtcbiAgICAgIGRlZmluaXRpb24uZG9DaGVjayA9IGRlZmluaXRpb24uZG9DaGVjayB8fCBzdXBlckRlZi5kb0NoZWNrO1xuICAgICAgZGVmaW5pdGlvbi5vbkRlc3Ryb3kgPSBkZWZpbml0aW9uLm9uRGVzdHJveSB8fCBzdXBlckRlZi5vbkRlc3Ryb3k7XG4gICAgICBkZWZpbml0aW9uLm9uSW5pdCA9IGRlZmluaXRpb24ub25Jbml0IHx8IHN1cGVyRGVmLm9uSW5pdDtcblxuICAgICAgLy8gUnVuIHBhcmVudCBmZWF0dXJlc1xuICAgICAgY29uc3QgZmVhdHVyZXMgPSBzdXBlckRlZi5mZWF0dXJlcztcbiAgICAgIGlmIChmZWF0dXJlcykge1xuICAgICAgICBmb3IgKGNvbnN0IGZlYXR1cmUgb2YgZmVhdHVyZXMpIHtcbiAgICAgICAgICBpZiAoZmVhdHVyZSAmJiBmZWF0dXJlLm5nSW5oZXJpdCkge1xuICAgICAgICAgICAgKGZlYXR1cmUgYXMgRGlyZWN0aXZlRGVmRmVhdHVyZSkoZGVmaW5pdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEV2ZW4gaWYgd2UgZG9uJ3QgaGF2ZSBhIGRlZmluaXRpb24sIGNoZWNrIHRoZSB0eXBlIGZvciB0aGUgaG9va3MgYW5kIHVzZSB0aG9zZSBpZiBuZWVkIGJlXG4gICAgICBjb25zdCBzdXBlclByb3RvdHlwZSA9IHN1cGVyVHlwZS5wcm90b3R5cGU7XG4gICAgICBpZiAoc3VwZXJQcm90b3R5cGUpIHtcbiAgICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRDaGVja2VkID1cbiAgICAgICAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50Q2hlY2tlZCB8fCBzdXBlclByb3RvdHlwZS5uZ0FmdGVyQ29udGVudENoZWNrZWQ7XG4gICAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50SW5pdCA9XG4gICAgICAgICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudEluaXQgfHwgc3VwZXJQcm90b3R5cGUubmdBZnRlckNvbnRlbnRJbml0O1xuICAgICAgICBkZWZpbml0aW9uLmFmdGVyVmlld0NoZWNrZWQgPVxuICAgICAgICAgICAgZGVmaW5pdGlvbi5hZnRlclZpZXdDaGVja2VkIHx8IHN1cGVyUHJvdG90eXBlLm5nQWZ0ZXJWaWV3Q2hlY2tlZDtcbiAgICAgICAgZGVmaW5pdGlvbi5hZnRlclZpZXdJbml0ID0gZGVmaW5pdGlvbi5hZnRlclZpZXdJbml0IHx8IHN1cGVyUHJvdG90eXBlLm5nQWZ0ZXJWaWV3SW5pdDtcbiAgICAgICAgZGVmaW5pdGlvbi5kb0NoZWNrID0gZGVmaW5pdGlvbi5kb0NoZWNrIHx8IHN1cGVyUHJvdG90eXBlLm5nRG9DaGVjaztcbiAgICAgICAgZGVmaW5pdGlvbi5vbkRlc3Ryb3kgPSBkZWZpbml0aW9uLm9uRGVzdHJveSB8fCBzdXBlclByb3RvdHlwZS5uZ09uRGVzdHJveTtcbiAgICAgICAgZGVmaW5pdGlvbi5vbkluaXQgPSBkZWZpbml0aW9uLm9uSW5pdCB8fCBzdXBlclByb3RvdHlwZS5uZ09uSW5pdDtcblxuICAgICAgICBpZiAoc3VwZXJQcm90b3R5cGUubmdPbkNoYW5nZXMpIHtcbiAgICAgICAgICBOZ09uQ2hhbmdlc0ZlYXR1cmUoKShkZWZpbml0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHN1cGVyVHlwZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihzdXBlclR5cGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1heWJlVW53cmFwRW1wdHk8VD4odmFsdWU6IFRbXSk6IFRbXTtcbmZ1bmN0aW9uIG1heWJlVW53cmFwRW1wdHk8VD4odmFsdWU6IFQpOiBUO1xuZnVuY3Rpb24gbWF5YmVVbndyYXBFbXB0eSh2YWx1ZTogYW55KTogYW55IHtcbiAgaWYgKHZhbHVlID09PSBFTVBUWV9PQkopIHtcbiAgICByZXR1cm4ge307XG4gIH0gZWxzZSBpZiAodmFsdWUgPT09IEVNUFRZX0FSUkFZKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxufVxuIl19