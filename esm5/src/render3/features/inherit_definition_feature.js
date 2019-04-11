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
import { ΔNgOnChangesFeature } from './ng_onchanges_feature';
function getSuperType(type) {
    return Object.getPrototypeOf(type.prototype).constructor;
}
/**
 * Merges the definition from a super class to a sub class.
 * @param definition The definition that is a SubClass of another directive of component
 *
 * @codeGenApi
 */
export function ΔInheritDefinitionFeature(definition) {
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
                    ΔNgOnChangesFeature()(definition);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5oZXJpdF9kZWZpbml0aW9uX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL2luaGVyaXRfZGVmaW5pdGlvbl9mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFHSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDbkQsT0FBTyxFQUFDLFdBQVcsRUFBRSxTQUFTLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFaEQsT0FBTyxFQUFDLDRDQUE0QyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3RFLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUVsRCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUUzRCxTQUFTLFlBQVksQ0FBQyxJQUFlO0lBRW5DLE9BQU8sTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsV0FBVyxDQUFDO0FBQzNELENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSx5QkFBeUIsQ0FBQyxVQUFnRDtJQUN4RixJQUFJLFNBQVMsR0FBRyxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDOzs7UUFHNUMsSUFBSSxRQUFRLEdBQWtELFNBQVMsQ0FBQztRQUN4RSxJQUFJLGNBQWMsQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUM5QiwrRUFBK0U7WUFDL0UsUUFBUSxHQUFHLFNBQVMsQ0FBQyxjQUFjLElBQUksU0FBUyxDQUFDLGNBQWMsQ0FBQztTQUNqRTthQUFNO1lBQ0wsSUFBSSxTQUFTLENBQUMsY0FBYyxFQUFFO2dCQUM1QixNQUFNLElBQUksS0FBSyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7YUFDekQ7WUFDRCwrRUFBK0U7WUFDL0UsUUFB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RjtRQUVELFNBQVMsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDOztJQXpJL0MsT0FBTyxTQUFTOztLQTBJZjtBQUNILENBQUM7QUFJRCxTQUFTLGdCQUFnQixDQUFDLEtBQVU7SUFDbEMsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3ZCLE9BQU8sRUFBRSxDQUFDO0tBQ1g7U0FBTSxJQUFJLEtBQUssS0FBSyxXQUFXLEVBQUU7UUFDaEMsT0FBTyxFQUFFLENBQUM7S0FDWDtTQUFNO1FBQ0wsT0FBTyxLQUFLLENBQUM7S0FDZDtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtmaWxsUHJvcGVydGllc30gZnJvbSAnLi4vLi4vdXRpbC9wcm9wZXJ0eSc7XG5pbXBvcnQge0VNUFRZX0FSUkFZLCBFTVBUWV9PQkp9IGZyb20gJy4uL2VtcHR5JztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkZlYXR1cmUsIFJlbmRlckZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHthZGp1c3RBY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGhQb3NpdGlvbn0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtpc0NvbXBvbmVudERlZn0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHvOlE5nT25DaGFuZ2VzRmVhdHVyZX0gZnJvbSAnLi9uZ19vbmNoYW5nZXNfZmVhdHVyZSc7XG5cbmZ1bmN0aW9uIGdldFN1cGVyVHlwZSh0eXBlOiBUeXBlPGFueT4pOiBUeXBlPGFueT4mXG4gICAge25nQ29tcG9uZW50RGVmPzogQ29tcG9uZW50RGVmPGFueT4sIG5nRGlyZWN0aXZlRGVmPzogRGlyZWN0aXZlRGVmPGFueT59IHtcbiAgcmV0dXJuIE9iamVjdC5nZXRQcm90b3R5cGVPZih0eXBlLnByb3RvdHlwZSkuY29uc3RydWN0b3I7XG59XG5cbi8qKlxuICogTWVyZ2VzIHRoZSBkZWZpbml0aW9uIGZyb20gYSBzdXBlciBjbGFzcyB0byBhIHN1YiBjbGFzcy5cbiAqIEBwYXJhbSBkZWZpbml0aW9uIFRoZSBkZWZpbml0aW9uIHRoYXQgaXMgYSBTdWJDbGFzcyBvZiBhbm90aGVyIGRpcmVjdGl2ZSBvZiBjb21wb25lbnRcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gzpRJbmhlcml0RGVmaW5pdGlvbkZlYXR1cmUoZGVmaW5pdGlvbjogRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+KTogdm9pZCB7XG4gIGxldCBzdXBlclR5cGUgPSBnZXRTdXBlclR5cGUoZGVmaW5pdGlvbi50eXBlKTtcblxuICB3aGlsZSAoc3VwZXJUeXBlKSB7XG4gICAgbGV0IHN1cGVyRGVmOiBEaXJlY3RpdmVEZWY8YW55PnxDb21wb25lbnREZWY8YW55Pnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKGlzQ29tcG9uZW50RGVmKGRlZmluaXRpb24pKSB7XG4gICAgICAvLyBEb24ndCB1c2UgZ2V0Q29tcG9uZW50RGVmL2dldERpcmVjdGl2ZURlZi4gVGhpcyBsb2dpYyByZWxpZXMgb24gaW5oZXJpdGFuY2UuXG4gICAgICBzdXBlckRlZiA9IHN1cGVyVHlwZS5uZ0NvbXBvbmVudERlZiB8fCBzdXBlclR5cGUubmdEaXJlY3RpdmVEZWY7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzdXBlclR5cGUubmdDb21wb25lbnREZWYpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEaXJlY3RpdmVzIGNhbm5vdCBpbmhlcml0IENvbXBvbmVudHMnKTtcbiAgICAgIH1cbiAgICAgIC8vIERvbid0IHVzZSBnZXRDb21wb25lbnREZWYvZ2V0RGlyZWN0aXZlRGVmLiBUaGlzIGxvZ2ljIHJlbGllcyBvbiBpbmhlcml0YW5jZS5cbiAgICAgIHN1cGVyRGVmID0gc3VwZXJUeXBlLm5nRGlyZWN0aXZlRGVmO1xuICAgIH1cblxuICAgIGNvbnN0IGJhc2VEZWYgPSAoc3VwZXJUeXBlIGFzIGFueSkubmdCYXNlRGVmO1xuXG4gICAgLy8gU29tZSBmaWVsZHMgaW4gdGhlIGRlZmluaXRpb24gbWF5IGJlIGVtcHR5LCBpZiB0aGVyZSB3ZXJlIG5vIHZhbHVlcyB0byBwdXQgaW4gdGhlbSB0aGF0XG4gICAgLy8gd291bGQndmUganVzdGlmaWVkIG9iamVjdCBjcmVhdGlvbi4gVW53cmFwIHRoZW0gaWYgbmVjZXNzYXJ5LlxuICAgIGlmIChiYXNlRGVmIHx8IHN1cGVyRGVmKSB7XG4gICAgICBjb25zdCB3cml0ZWFibGVEZWYgPSBkZWZpbml0aW9uIGFzIGFueTtcbiAgICAgIHdyaXRlYWJsZURlZi5pbnB1dHMgPSBtYXliZVVud3JhcEVtcHR5KGRlZmluaXRpb24uaW5wdXRzKTtcbiAgICAgIHdyaXRlYWJsZURlZi5kZWNsYXJlZElucHV0cyA9IG1heWJlVW53cmFwRW1wdHkoZGVmaW5pdGlvbi5kZWNsYXJlZElucHV0cyk7XG4gICAgICB3cml0ZWFibGVEZWYub3V0cHV0cyA9IG1heWJlVW53cmFwRW1wdHkoZGVmaW5pdGlvbi5vdXRwdXRzKTtcbiAgICB9XG5cbiAgICBpZiAoYmFzZURlZikge1xuICAgICAgLy8gTWVyZ2UgaW5wdXRzIGFuZCBvdXRwdXRzXG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLmlucHV0cywgYmFzZURlZi5pbnB1dHMpO1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5kZWNsYXJlZElucHV0cywgYmFzZURlZi5kZWNsYXJlZElucHV0cyk7XG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLm91dHB1dHMsIGJhc2VEZWYub3V0cHV0cyk7XG4gICAgfVxuXG4gICAgaWYgKHN1cGVyRGVmKSB7XG4gICAgICAvLyBNZXJnZSBob3N0QmluZGluZ3NcbiAgICAgIGNvbnN0IHByZXZIb3N0QmluZGluZ3MgPSBkZWZpbml0aW9uLmhvc3RCaW5kaW5ncztcbiAgICAgIGNvbnN0IHN1cGVySG9zdEJpbmRpbmdzID0gc3VwZXJEZWYuaG9zdEJpbmRpbmdzO1xuICAgICAgaWYgKHN1cGVySG9zdEJpbmRpbmdzKSB7XG4gICAgICAgIGlmIChwcmV2SG9zdEJpbmRpbmdzKSB7XG4gICAgICAgICAgLy8gYmVjYXVzZSBpbmhlcml0YW5jZSBpcyB1bmtub3duIGR1cmluZyBjb21waWxlIHRpbWUsIHRoZSBydW50aW1lIGNvZGVcbiAgICAgICAgICAvLyBuZWVkcyB0byBiZSBpbmZvcm1lZCBvZiB0aGUgc3VwZXItY2xhc3MgZGVwdGggc28gdGhhdCBpbnN0cnVjdGlvbiBjb2RlXG4gICAgICAgICAgLy8gY2FuIGRpc3Rpbmd1aXNoIG9uZSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uIGZyb20gYW5vdGhlci4gVGhlIHJlYXNvbiB3aHlcbiAgICAgICAgICAvLyByZWx5aW5nIG9uIHRoZSBkaXJlY3RpdmUgdW5pcXVlSWQgZXhjbHVzaXZlbHkgaXMgbm90IGVub3VnaCBpcyBiZWNhdXNlIHRoZVxuICAgICAgICAgIC8vIHVuaXF1ZUlkIHZhbHVlIGFuZCB0aGUgZGlyZWN0aXZlIGluc3RhbmNlIHN0YXkgdGhlIHNhbWUgYmV0d2VlbiBob3N0QmluZGluZ3NcbiAgICAgICAgICAvLyBjYWxscyB0aHJvdWdob3V0IHRoZSBkaXJlY3RpdmUgaW5oZXJpdGFuY2UgY2hhaW4uIFRoaXMgbWVhbnMgdGhhdCB3aXRob3V0XG4gICAgICAgICAgLy8gYSBzdXBlci1jbGFzcyBkZXB0aCB2YWx1ZSwgdGhlcmUgaXMgbm8gd2F5IHRvIGtub3cgd2hldGhlciBhIHBhcmVudCBvclxuICAgICAgICAgIC8vIHN1Yi1jbGFzcyBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uIGlzIGN1cnJlbnRseSBiZWluZyBleGVjdXRlZC5cbiAgICAgICAgICBkZWZpbml0aW9uLmhvc3RCaW5kaW5ncyA9IChyZjogUmVuZGVyRmxhZ3MsIGN0eDogYW55LCBlbGVtZW50SW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgLy8gVGhlIHJlYXNvbiB3aHkgd2UgaW5jcmVtZW50IGZpcnN0IGFuZCB0aGVuIGRlY3JlbWVudCBpcyBzbyB0aGF0IHBhcmVudFxuICAgICAgICAgICAgLy8gaG9zdEJpbmRpbmdzIGNhbGxzIGhhdmUgYSBoaWdoZXIgaWQgdmFsdWUgY29tcGFyZWQgdG8gc3ViLWNsYXNzIGhvc3RCaW5kaW5nc1xuICAgICAgICAgICAgLy8gY2FsbHMgKHRoaXMgd2F5IHRoZSBsZWFmIGRpcmVjdGl2ZSBpcyBhbHdheXMgYXQgYSBzdXBlci1jbGFzcyBkZXB0aCBvZiAwKS5cbiAgICAgICAgICAgIGFkanVzdEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aFBvc2l0aW9uKDEpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgc3VwZXJIb3N0QmluZGluZ3MocmYsIGN0eCwgZWxlbWVudEluZGV4KTtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgIGFkanVzdEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aFBvc2l0aW9uKC0xKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHByZXZIb3N0QmluZGluZ3MocmYsIGN0eCwgZWxlbWVudEluZGV4KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlZmluaXRpb24uaG9zdEJpbmRpbmdzID0gc3VwZXJIb3N0QmluZGluZ3M7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gTWVyZ2UgVmlldyBRdWVyaWVzXG4gICAgICBjb25zdCBwcmV2Vmlld1F1ZXJ5ID0gZGVmaW5pdGlvbi52aWV3UXVlcnk7XG4gICAgICBjb25zdCBzdXBlclZpZXdRdWVyeSA9IHN1cGVyRGVmLnZpZXdRdWVyeTtcblxuICAgICAgaWYgKHN1cGVyVmlld1F1ZXJ5KSB7XG4gICAgICAgIGlmIChwcmV2Vmlld1F1ZXJ5KSB7XG4gICAgICAgICAgZGVmaW5pdGlvbi52aWV3UXVlcnkgPSA8VD4ocmY6IFJlbmRlckZsYWdzLCBjdHg6IFQpOiB2b2lkID0+IHtcbiAgICAgICAgICAgIHN1cGVyVmlld1F1ZXJ5KHJmLCBjdHgpO1xuICAgICAgICAgICAgcHJldlZpZXdRdWVyeShyZiwgY3R4KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlZmluaXRpb24udmlld1F1ZXJ5ID0gc3VwZXJWaWV3UXVlcnk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gTWVyZ2UgQ29udGVudCBRdWVyaWVzXG4gICAgICBjb25zdCBwcmV2Q29udGVudFF1ZXJpZXMgPSBkZWZpbml0aW9uLmNvbnRlbnRRdWVyaWVzO1xuICAgICAgY29uc3Qgc3VwZXJDb250ZW50UXVlcmllcyA9IHN1cGVyRGVmLmNvbnRlbnRRdWVyaWVzO1xuICAgICAgaWYgKHN1cGVyQ29udGVudFF1ZXJpZXMpIHtcbiAgICAgICAgaWYgKHByZXZDb250ZW50UXVlcmllcykge1xuICAgICAgICAgIGRlZmluaXRpb24uY29udGVudFF1ZXJpZXMgPSA8VD4ocmY6IFJlbmRlckZsYWdzLCBjdHg6IFQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIHN1cGVyQ29udGVudFF1ZXJpZXMocmYsIGN0eCwgZGlyZWN0aXZlSW5kZXgpO1xuICAgICAgICAgICAgcHJldkNvbnRlbnRRdWVyaWVzKHJmLCBjdHgsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlZmluaXRpb24uY29udGVudFF1ZXJpZXMgPSBzdXBlckNvbnRlbnRRdWVyaWVzO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIE1lcmdlIGlucHV0cyBhbmQgb3V0cHV0c1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5pbnB1dHMsIHN1cGVyRGVmLmlucHV0cyk7XG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLmRlY2xhcmVkSW5wdXRzLCBzdXBlckRlZi5kZWNsYXJlZElucHV0cyk7XG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLm91dHB1dHMsIHN1cGVyRGVmLm91dHB1dHMpO1xuXG4gICAgICAvLyBJbmhlcml0IGhvb2tzXG4gICAgICAvLyBBc3N1bWUgc3VwZXIgY2xhc3MgaW5oZXJpdGFuY2UgZmVhdHVyZSBoYXMgYWxyZWFkeSBydW4uXG4gICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudENoZWNrZWQgPVxuICAgICAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50Q2hlY2tlZCB8fCBzdXBlckRlZi5hZnRlckNvbnRlbnRDaGVja2VkO1xuICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRJbml0ID0gZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRJbml0IHx8IHN1cGVyRGVmLmFmdGVyQ29udGVudEluaXQ7XG4gICAgICBkZWZpbml0aW9uLmFmdGVyVmlld0NoZWNrZWQgPSBkZWZpbml0aW9uLmFmdGVyVmlld0NoZWNrZWQgfHwgc3VwZXJEZWYuYWZ0ZXJWaWV3Q2hlY2tlZDtcbiAgICAgIGRlZmluaXRpb24uYWZ0ZXJWaWV3SW5pdCA9IGRlZmluaXRpb24uYWZ0ZXJWaWV3SW5pdCB8fCBzdXBlckRlZi5hZnRlclZpZXdJbml0O1xuICAgICAgZGVmaW5pdGlvbi5kb0NoZWNrID0gZGVmaW5pdGlvbi5kb0NoZWNrIHx8IHN1cGVyRGVmLmRvQ2hlY2s7XG4gICAgICBkZWZpbml0aW9uLm9uRGVzdHJveSA9IGRlZmluaXRpb24ub25EZXN0cm95IHx8IHN1cGVyRGVmLm9uRGVzdHJveTtcbiAgICAgIGRlZmluaXRpb24ub25Jbml0ID0gZGVmaW5pdGlvbi5vbkluaXQgfHwgc3VwZXJEZWYub25Jbml0O1xuXG4gICAgICAvLyBSdW4gcGFyZW50IGZlYXR1cmVzXG4gICAgICBjb25zdCBmZWF0dXJlcyA9IHN1cGVyRGVmLmZlYXR1cmVzO1xuICAgICAgaWYgKGZlYXR1cmVzKSB7XG4gICAgICAgIGZvciAoY29uc3QgZmVhdHVyZSBvZiBmZWF0dXJlcykge1xuICAgICAgICAgIGlmIChmZWF0dXJlICYmIGZlYXR1cmUubmdJbmhlcml0KSB7XG4gICAgICAgICAgICAoZmVhdHVyZSBhcyBEaXJlY3RpdmVEZWZGZWF0dXJlKShkZWZpbml0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRXZlbiBpZiB3ZSBkb24ndCBoYXZlIGEgZGVmaW5pdGlvbiwgY2hlY2sgdGhlIHR5cGUgZm9yIHRoZSBob29rcyBhbmQgdXNlIHRob3NlIGlmIG5lZWQgYmVcbiAgICAgIGNvbnN0IHN1cGVyUHJvdG90eXBlID0gc3VwZXJUeXBlLnByb3RvdHlwZTtcbiAgICAgIGlmIChzdXBlclByb3RvdHlwZSkge1xuICAgICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudENoZWNrZWQgPVxuICAgICAgICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRDaGVja2VkIHx8IHN1cGVyUHJvdG90eXBlLm5nQWZ0ZXJDb250ZW50Q2hlY2tlZDtcbiAgICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRJbml0ID1cbiAgICAgICAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50SW5pdCB8fCBzdXBlclByb3RvdHlwZS5uZ0FmdGVyQ29udGVudEluaXQ7XG4gICAgICAgIGRlZmluaXRpb24uYWZ0ZXJWaWV3Q2hlY2tlZCA9XG4gICAgICAgICAgICBkZWZpbml0aW9uLmFmdGVyVmlld0NoZWNrZWQgfHwgc3VwZXJQcm90b3R5cGUubmdBZnRlclZpZXdDaGVja2VkO1xuICAgICAgICBkZWZpbml0aW9uLmFmdGVyVmlld0luaXQgPSBkZWZpbml0aW9uLmFmdGVyVmlld0luaXQgfHwgc3VwZXJQcm90b3R5cGUubmdBZnRlclZpZXdJbml0O1xuICAgICAgICBkZWZpbml0aW9uLmRvQ2hlY2sgPSBkZWZpbml0aW9uLmRvQ2hlY2sgfHwgc3VwZXJQcm90b3R5cGUubmdEb0NoZWNrO1xuICAgICAgICBkZWZpbml0aW9uLm9uRGVzdHJveSA9IGRlZmluaXRpb24ub25EZXN0cm95IHx8IHN1cGVyUHJvdG90eXBlLm5nT25EZXN0cm95O1xuICAgICAgICBkZWZpbml0aW9uLm9uSW5pdCA9IGRlZmluaXRpb24ub25Jbml0IHx8IHN1cGVyUHJvdG90eXBlLm5nT25Jbml0O1xuXG4gICAgICAgIGlmIChzdXBlclByb3RvdHlwZS5uZ09uQ2hhbmdlcykge1xuICAgICAgICAgIM6UTmdPbkNoYW5nZXNGZWF0dXJlKCkoZGVmaW5pdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBzdXBlclR5cGUgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yoc3VwZXJUeXBlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYXliZVVud3JhcEVtcHR5PFQ+KHZhbHVlOiBUW10pOiBUW107XG5mdW5jdGlvbiBtYXliZVVud3JhcEVtcHR5PFQ+KHZhbHVlOiBUKTogVDtcbmZ1bmN0aW9uIG1heWJlVW53cmFwRW1wdHkodmFsdWU6IGFueSk6IGFueSB7XG4gIGlmICh2YWx1ZSA9PT0gRU1QVFlfT0JKKSB7XG4gICAgcmV0dXJuIHt9O1xuICB9IGVsc2UgaWYgKHZhbHVlID09PSBFTVBUWV9BUlJBWSkge1xuICAgIHJldHVybiBbXTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbn1cbiJdfQ==