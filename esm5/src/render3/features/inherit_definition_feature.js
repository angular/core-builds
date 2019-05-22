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
import { ɵɵNgOnChangesFeature } from './ng_onchanges_feature';
function getSuperType(type) {
    return Object.getPrototypeOf(type.prototype).constructor;
}
/**
 * Merges the definition from a super class to a sub class.
 * @param definition The definition that is a SubClass of another directive of component
 *
 * @codeGenApi
 */
export function ɵɵInheritDefinitionFeature(definition) {
    var e_1, _a;
    var superType = getSuperType(definition.type);
    while (superType) {
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
            var baseViewQuery = baseDef.viewQuery;
            var baseContentQueries = baseDef.contentQueries;
            var baseHostBindings = baseDef.hostBindings;
            baseHostBindings && inheritHostBindings(definition, baseHostBindings);
            baseViewQuery && inheritViewQuery(definition, baseViewQuery);
            baseContentQueries && inheritContentQueries(definition, baseContentQueries);
            fillProperties(definition.inputs, baseDef.inputs);
            fillProperties(definition.declaredInputs, baseDef.declaredInputs);
            fillProperties(definition.outputs, baseDef.outputs);
        }
        if (superDef) {
            // Merge hostBindings
            var superHostBindings = superDef.hostBindings;
            superHostBindings && inheritHostBindings(definition, superHostBindings);
            // Merge queries
            var superViewQuery = superDef.viewQuery;
            var superContentQueries = superDef.contentQueries;
            superViewQuery && inheritViewQuery(definition, superViewQuery);
            superContentQueries && inheritContentQueries(definition, superContentQueries);
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
                    ɵɵNgOnChangesFeature()(definition);
                }
            }
        }
        superType = Object.getPrototypeOf(superType);
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
function inheritViewQuery(definition, superViewQuery) {
    var prevViewQuery = definition.viewQuery;
    if (prevViewQuery) {
        definition.viewQuery = function (rf, ctx) {
            superViewQuery(rf, ctx);
            prevViewQuery(rf, ctx);
        };
    }
    else {
        definition.viewQuery = superViewQuery;
    }
}
function inheritContentQueries(definition, superContentQueries) {
    var prevContentQueries = definition.contentQueries;
    if (prevContentQueries) {
        definition.contentQueries = function (rf, ctx, directiveIndex) {
            superContentQueries(rf, ctx, directiveIndex);
            prevContentQueries(rf, ctx, directiveIndex);
        };
    }
    else {
        definition.contentQueries = superContentQueries;
    }
}
function inheritHostBindings(definition, superHostBindings) {
    var prevHostBindings = definition.hostBindings;
    // If the subclass does not have a host bindings function, we set the subclass host binding
    // function to be the superclass's (in this feature). We should check if they're the same here
    // to ensure we don't inherit it twice.
    if (superHostBindings !== prevHostBindings) {
        if (prevHostBindings) {
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
                    superHostBindings(rf, ctx, elementIndex);
                }
                finally {
                    adjustActiveDirectiveSuperClassDepthPosition(-1);
                }
                prevHostBindings(rf, ctx, elementIndex);
            };
        }
        else {
            definition.hostBindings = superHostBindings;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5oZXJpdF9kZWZpbml0aW9uX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL2luaGVyaXRfZGVmaW5pdGlvbl9mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFHSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDbkQsT0FBTyxFQUFDLFdBQVcsRUFBRSxTQUFTLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFaEQsT0FBTyxFQUFDLDRDQUE0QyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3RFLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUVsRCxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUU1RCxTQUFTLFlBQVksQ0FBQyxJQUFlO0lBRW5DLE9BQU8sTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsV0FBVyxDQUFDO0FBQzNELENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSwwQkFBMEIsQ0FBQyxVQUFnRDs7SUFDekYsSUFBSSxTQUFTLEdBQUcsWUFBWSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUU5QyxPQUFPLFNBQVMsRUFBRTtRQUNoQixJQUFJLFFBQVEsR0FBa0QsU0FBUyxDQUFDO1FBQ3hFLElBQUksY0FBYyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQzlCLCtFQUErRTtZQUMvRSxRQUFRLEdBQUcsU0FBUyxDQUFDLGNBQWMsSUFBSSxTQUFTLENBQUMsY0FBYyxDQUFDO1NBQ2pFO2FBQU07WUFDTCxJQUFJLFNBQVMsQ0FBQyxjQUFjLEVBQUU7Z0JBQzVCLE1BQU0sSUFBSSxLQUFLLENBQUMsc0NBQXNDLENBQUMsQ0FBQzthQUN6RDtZ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QUMsQ0FBQztZQUM3QyxrQkFBa0IsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQzlDLENBQUMsQ0FBQztLQUNIO1NBQU07UUFDTCxVQUFVLENBQUMsY0FBYyxHQUFHLG1CQUFtQixDQUFDO0tBQ2pEO0FBQ0gsQ0FBQztBQUVELFNBQVMsbUJBQW1CLENBQ3hCLFVBQWdELEVBQ2hELGlCQUE0QztJQUM5QyxJQUFNLGdCQUFnQixHQUFHLFVBQVUsQ0FBQyxZQUFZLENBQUM7SUFDakQsMkZBQTJGO0lBQzNGLDhGQUE4RjtJQUM5Rix1Q0FBdUM7SUFDdkMsSUFBSSxpQkFBaUIsS0FBSyxnQkFBZ0IsRUFBRTtRQUMxQyxJQUFJLGdCQUFnQixFQUFFO1lBQ3BCLHVFQUF1RTtZQUN2RSx5RUFBeUU7WUFDekUsMEVBQTBFO1lBQzFFLDZFQUE2RTtZQUM3RSwrRUFBK0U7WUFDL0UsNEVBQTRFO1lBQzVFLHlFQUF5RTtZQUN6RSxnRUFBZ0U7WUFDaEUsVUFBVSxDQUFDLFlBQVksR0FBRyxVQUFDLEVBQWUsRUFBRSxHQUFRLEVBQUUsWUFBb0I7Z0JBQ3hFLHlFQUF5RTtnQkFDekUsK0VBQStFO2dCQUMvRSw2RUFBNkU7Z0JBQzdFLDRDQUE0QyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoRCxJQUFJO29CQUNGLGlCQUFpQixDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsWUFBWSxDQUFDLENBQUM7aUJBQzFDO3dCQUFTO29CQUNSLDRDQUE0QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ2xEO2dCQUNELGdCQUFnQixDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDMUMsQ0FBQyxDQUFDO1NBQ0g7YUFBTTtZQUNMLFVBQVUsQ0FBQyxZQUFZLEdBQUcsaUJBQWlCLENBQUM7U0FDN0M7S0FDRjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtmaWxsUHJvcGVydGllc30gZnJvbSAnLi4vLi4vdXRpbC9wcm9wZXJ0eSc7XG5pbXBvcnQge0VNUFRZX0FSUkFZLCBFTVBUWV9PQkp9IGZyb20gJy4uL2VtcHR5JztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBDb250ZW50UXVlcmllc0Z1bmN0aW9uLCBEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkZlYXR1cmUsIEhvc3RCaW5kaW5nc0Z1bmN0aW9uLCBSZW5kZXJGbGFncywgVmlld1F1ZXJpZXNGdW5jdGlvbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7YWRqdXN0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoUG9zaXRpb259IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7aXNDb21wb25lbnREZWZ9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmltcG9ydCB7ybXJtU5nT25DaGFuZ2VzRmVhdHVyZX0gZnJvbSAnLi9uZ19vbmNoYW5nZXNfZmVhdHVyZSc7XG5cbmZ1bmN0aW9uIGdldFN1cGVyVHlwZSh0eXBlOiBUeXBlPGFueT4pOiBUeXBlPGFueT4mXG4gICAge25nQ29tcG9uZW50RGVmPzogQ29tcG9uZW50RGVmPGFueT4sIG5nRGlyZWN0aXZlRGVmPzogRGlyZWN0aXZlRGVmPGFueT59IHtcbiAgcmV0dXJuIE9iamVjdC5nZXRQcm90b3R5cGVPZih0eXBlLnByb3RvdHlwZSkuY29uc3RydWN0b3I7XG59XG5cbi8qKlxuICogTWVyZ2VzIHRoZSBkZWZpbml0aW9uIGZyb20gYSBzdXBlciBjbGFzcyB0byBhIHN1YiBjbGFzcy5cbiAqIEBwYXJhbSBkZWZpbml0aW9uIFRoZSBkZWZpbml0aW9uIHRoYXQgaXMgYSBTdWJDbGFzcyBvZiBhbm90aGVyIGRpcmVjdGl2ZSBvZiBjb21wb25lbnRcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtUluaGVyaXREZWZpbml0aW9uRmVhdHVyZShkZWZpbml0aW9uOiBEaXJlY3RpdmVEZWY8YW55PnwgQ29tcG9uZW50RGVmPGFueT4pOiB2b2lkIHtcbiAgbGV0IHN1cGVyVHlwZSA9IGdldFN1cGVyVHlwZShkZWZpbml0aW9uLnR5cGUpO1xuXG4gIHdoaWxlIChzdXBlclR5cGUpIHtcbiAgICBsZXQgc3VwZXJEZWY6IERpcmVjdGl2ZURlZjxhbnk+fENvbXBvbmVudERlZjxhbnk+fHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICBpZiAoaXNDb21wb25lbnREZWYoZGVmaW5pdGlvbikpIHtcbiAgICAgIC8vIERvbid0IHVzZSBnZXRDb21wb25lbnREZWYvZ2V0RGlyZWN0aXZlRGVmLiBUaGlzIGxvZ2ljIHJlbGllcyBvbiBpbmhlcml0YW5jZS5cbiAgICAgIHN1cGVyRGVmID0gc3VwZXJUeXBlLm5nQ29tcG9uZW50RGVmIHx8IHN1cGVyVHlwZS5uZ0RpcmVjdGl2ZURlZjtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHN1cGVyVHlwZS5uZ0NvbXBvbmVudERlZikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RpcmVjdGl2ZXMgY2Fubm90IGluaGVyaXQgQ29tcG9uZW50cycpO1xuICAgICAgfVxuICAgICAgLy8gRG9uJ3QgdXNlIGdldENvbXBvbmVudERlZi9nZXREaXJlY3RpdmVEZWYuIFRoaXMgbG9naWMgcmVsaWVzIG9uIGluaGVyaXRhbmNlLlxuICAgICAgc3VwZXJEZWYgPSBzdXBlclR5cGUubmdEaXJlY3RpdmVEZWY7XG4gICAgfVxuXG4gICAgY29uc3QgYmFzZURlZiA9IChzdXBlclR5cGUgYXMgYW55KS5uZ0Jhc2VEZWY7XG5cbiAgICAvLyBTb21lIGZpZWxkcyBpbiB0aGUgZGVmaW5pdGlvbiBtYXkgYmUgZW1wdHksIGlmIHRoZXJlIHdlcmUgbm8gdmFsdWVzIHRvIHB1dCBpbiB0aGVtIHRoYXRcbiAgICAvLyB3b3VsZCd2ZSBqdXN0aWZpZWQgb2JqZWN0IGNyZWF0aW9uLiBVbndyYXAgdGhlbSBpZiBuZWNlc3NhcnkuXG4gICAgaWYgKGJhc2VEZWYgfHwgc3VwZXJEZWYpIHtcbiAgICAgIGNvbnN0IHdyaXRlYWJsZURlZiA9IGRlZmluaXRpb24gYXMgYW55O1xuICAgICAgd3JpdGVhYmxlRGVmLmlucHV0cyA9IG1heWJlVW53cmFwRW1wdHkoZGVmaW5pdGlvbi5pbnB1dHMpO1xuICAgICAgd3JpdGVhYmxlRGVmLmRlY2xhcmVkSW5wdXRzID0gbWF5YmVVbndyYXBFbXB0eShkZWZpbml0aW9uLmRlY2xhcmVkSW5wdXRzKTtcbiAgICAgIHdyaXRlYWJsZURlZi5vdXRwdXRzID0gbWF5YmVVbndyYXBFbXB0eShkZWZpbml0aW9uLm91dHB1dHMpO1xuICAgIH1cblxuICAgIGlmIChiYXNlRGVmKSB7XG4gICAgICBjb25zdCBiYXNlVmlld1F1ZXJ5ID0gYmFzZURlZi52aWV3UXVlcnk7XG4gICAgICBjb25zdCBiYXNlQ29udGVudFF1ZXJpZXMgPSBiYXNlRGVmLmNvbnRlbnRRdWVyaWVzO1xuICAgICAgY29uc3QgYmFzZUhvc3RCaW5kaW5ncyA9IGJhc2VEZWYuaG9zdEJpbmRpbmdzO1xuICAgICAgYmFzZUhvc3RCaW5kaW5ncyAmJiBpbmhlcml0SG9zdEJpbmRpbmdzKGRlZmluaXRpb24sIGJhc2VIb3N0QmluZGluZ3MpO1xuICAgICAgYmFzZVZpZXdRdWVyeSAmJiBpbmhlcml0Vmlld1F1ZXJ5KGRlZmluaXRpb24sIGJhc2VWaWV3UXVlcnkpO1xuICAgICAgYmFzZUNvbnRlbnRRdWVyaWVzICYmIGluaGVyaXRDb250ZW50UXVlcmllcyhkZWZpbml0aW9uLCBiYXNlQ29udGVudFF1ZXJpZXMpO1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5pbnB1dHMsIGJhc2VEZWYuaW5wdXRzKTtcbiAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24uZGVjbGFyZWRJbnB1dHMsIGJhc2VEZWYuZGVjbGFyZWRJbnB1dHMpO1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5vdXRwdXRzLCBiYXNlRGVmLm91dHB1dHMpO1xuICAgIH1cblxuICAgIGlmIChzdXBlckRlZikge1xuICAgICAgLy8gTWVyZ2UgaG9zdEJpbmRpbmdzXG4gICAgICBjb25zdCBzdXBlckhvc3RCaW5kaW5ncyA9IHN1cGVyRGVmLmhvc3RCaW5kaW5ncztcbiAgICAgIHN1cGVySG9zdEJpbmRpbmdzICYmIGluaGVyaXRIb3N0QmluZGluZ3MoZGVmaW5pdGlvbiwgc3VwZXJIb3N0QmluZGluZ3MpO1xuXG4gICAgICAvLyBNZXJnZSBxdWVyaWVzXG4gICAgICBjb25zdCBzdXBlclZpZXdRdWVyeSA9IHN1cGVyRGVmLnZpZXdRdWVyeTtcbiAgICAgIGNvbnN0IHN1cGVyQ29udGVudFF1ZXJpZXMgPSBzdXBlckRlZi5jb250ZW50UXVlcmllcztcbiAgICAgIHN1cGVyVmlld1F1ZXJ5ICYmIGluaGVyaXRWaWV3UXVlcnkoZGVmaW5pdGlvbiwgc3VwZXJWaWV3UXVlcnkpO1xuICAgICAgc3VwZXJDb250ZW50UXVlcmllcyAmJiBpbmhlcml0Q29udGVudFF1ZXJpZXMoZGVmaW5pdGlvbiwgc3VwZXJDb250ZW50UXVlcmllcyk7XG5cbiAgICAgIC8vIE1lcmdlIGlucHV0cyBhbmQgb3V0cHV0c1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5pbnB1dHMsIHN1cGVyRGVmLmlucHV0cyk7XG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLmRlY2xhcmVkSW5wdXRzLCBzdXBlckRlZi5kZWNsYXJlZElucHV0cyk7XG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLm91dHB1dHMsIHN1cGVyRGVmLm91dHB1dHMpO1xuXG4gICAgICAvLyBJbmhlcml0IGhvb2tzXG4gICAgICAvLyBBc3N1bWUgc3VwZXIgY2xhc3MgaW5oZXJpdGFuY2UgZmVhdHVyZSBoYXMgYWxyZWFkeSBydW4uXG4gICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudENoZWNrZWQgPVxuICAgICAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50Q2hlY2tlZCB8fCBzdXBlckRlZi5hZnRlckNvbnRlbnRDaGVja2VkO1xuICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRJbml0ID0gZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRJbml0IHx8IHN1cGVyRGVmLmFmdGVyQ29udGVudEluaXQ7XG4gICAgICBkZWZpbml0aW9uLmFmdGVyVmlld0NoZWNrZWQgPSBkZWZpbml0aW9uLmFmdGVyVmlld0NoZWNrZWQgfHwgc3VwZXJEZWYuYWZ0ZXJWaWV3Q2hlY2tlZDtcbiAgICAgIGRlZmluaXRpb24uYWZ0ZXJWaWV3SW5pdCA9IGRlZmluaXRpb24uYWZ0ZXJWaWV3SW5pdCB8fCBzdXBlckRlZi5hZnRlclZpZXdJbml0O1xuICAgICAgZGVmaW5pdGlvbi5kb0NoZWNrID0gZGVmaW5pdGlvbi5kb0NoZWNrIHx8IHN1cGVyRGVmLmRvQ2hlY2s7XG4gICAgICBkZWZpbml0aW9uLm9uRGVzdHJveSA9IGRlZmluaXRpb24ub25EZXN0cm95IHx8IHN1cGVyRGVmLm9uRGVzdHJveTtcbiAgICAgIGRlZmluaXRpb24ub25Jbml0ID0gZGVmaW5pdGlvbi5vbkluaXQgfHwgc3VwZXJEZWYub25Jbml0O1xuXG4gICAgICAvLyBSdW4gcGFyZW50IGZlYXR1cmVzXG4gICAgICBjb25zdCBmZWF0dXJlcyA9IHN1cGVyRGVmLmZlYXR1cmVzO1xuICAgICAgaWYgKGZlYXR1cmVzKSB7XG4gICAgICAgIGZvciAoY29uc3QgZmVhdHVyZSBvZiBmZWF0dXJlcykge1xuICAgICAgICAgIGlmIChmZWF0dXJlICYmIGZlYXR1cmUubmdJbmhlcml0KSB7XG4gICAgICAgICAgICAoZmVhdHVyZSBhcyBEaXJlY3RpdmVEZWZGZWF0dXJlKShkZWZpbml0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRXZlbiBpZiB3ZSBkb24ndCBoYXZlIGEgZGVmaW5pdGlvbiwgY2hlY2sgdGhlIHR5cGUgZm9yIHRoZSBob29rcyBhbmQgdXNlIHRob3NlIGlmIG5lZWQgYmVcbiAgICAgIGNvbnN0IHN1cGVyUHJvdG90eXBlID0gc3VwZXJUeXBlLnByb3RvdHlwZTtcbiAgICAgIGlmIChzdXBlclByb3RvdHlwZSkge1xuICAgICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudENoZWNrZWQgPVxuICAgICAgICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRDaGVja2VkIHx8IHN1cGVyUHJvdG90eXBlLm5nQWZ0ZXJDb250ZW50Q2hlY2tlZDtcbiAgICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRJbml0ID1cbiAgICAgICAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50SW5pdCB8fCBzdXBlclByb3RvdHlwZS5uZ0FmdGVyQ29udGVudEluaXQ7XG4gICAgICAgIGRlZmluaXRpb24uYWZ0ZXJWaWV3Q2hlY2tlZCA9XG4gICAgICAgICAgICBkZWZpbml0aW9uLmFmdGVyVmlld0NoZWNrZWQgfHwgc3VwZXJQcm90b3R5cGUubmdBZnRlclZpZXdDaGVja2VkO1xuICAgICAgICBkZWZpbml0aW9uLmFmdGVyVmlld0luaXQgPSBkZWZpbml0aW9uLmFmdGVyVmlld0luaXQgfHwgc3VwZXJQcm90b3R5cGUubmdBZnRlclZpZXdJbml0O1xuICAgICAgICBkZWZpbml0aW9uLmRvQ2hlY2sgPSBkZWZpbml0aW9uLmRvQ2hlY2sgfHwgc3VwZXJQcm90b3R5cGUubmdEb0NoZWNrO1xuICAgICAgICBkZWZpbml0aW9uLm9uRGVzdHJveSA9IGRlZmluaXRpb24ub25EZXN0cm95IHx8IHN1cGVyUHJvdG90eXBlLm5nT25EZXN0cm95O1xuICAgICAgICBkZWZpbml0aW9uLm9uSW5pdCA9IGRlZmluaXRpb24ub25Jbml0IHx8IHN1cGVyUHJvdG90eXBlLm5nT25Jbml0O1xuXG4gICAgICAgIGlmIChzdXBlclByb3RvdHlwZS5uZ09uQ2hhbmdlcykge1xuICAgICAgICAgIMm1ybVOZ09uQ2hhbmdlc0ZlYXR1cmUoKShkZWZpbml0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHN1cGVyVHlwZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihzdXBlclR5cGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1heWJlVW53cmFwRW1wdHk8VD4odmFsdWU6IFRbXSk6IFRbXTtcbmZ1bmN0aW9uIG1heWJlVW53cmFwRW1wdHk8VD4odmFsdWU6IFQpOiBUO1xuZnVuY3Rpb24gbWF5YmVVbndyYXBFbXB0eSh2YWx1ZTogYW55KTogYW55IHtcbiAgaWYgKHZhbHVlID09PSBFTVBUWV9PQkopIHtcbiAgICByZXR1cm4ge307XG4gIH0gZWxzZSBpZiAodmFsdWUgPT09IEVNUFRZX0FSUkFZKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbmhlcml0Vmlld1F1ZXJ5KFxuICAgIGRlZmluaXRpb246IERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55Piwgc3VwZXJWaWV3UXVlcnk6IFZpZXdRdWVyaWVzRnVuY3Rpb248YW55Pikge1xuICBjb25zdCBwcmV2Vmlld1F1ZXJ5ID0gZGVmaW5pdGlvbi52aWV3UXVlcnk7XG5cbiAgaWYgKHByZXZWaWV3UXVlcnkpIHtcbiAgICBkZWZpbml0aW9uLnZpZXdRdWVyeSA9IChyZiwgY3R4KSA9PiB7XG4gICAgICBzdXBlclZpZXdRdWVyeShyZiwgY3R4KTtcbiAgICAgIHByZXZWaWV3UXVlcnkocmYsIGN0eCk7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBkZWZpbml0aW9uLnZpZXdRdWVyeSA9IHN1cGVyVmlld1F1ZXJ5O1xuICB9XG59XG5cbmZ1bmN0aW9uIGluaGVyaXRDb250ZW50UXVlcmllcyhcbiAgICBkZWZpbml0aW9uOiBEaXJlY3RpdmVEZWY8YW55PnwgQ29tcG9uZW50RGVmPGFueT4sXG4gICAgc3VwZXJDb250ZW50UXVlcmllczogQ29udGVudFF1ZXJpZXNGdW5jdGlvbjxhbnk+KSB7XG4gIGNvbnN0IHByZXZDb250ZW50UXVlcmllcyA9IGRlZmluaXRpb24uY29udGVudFF1ZXJpZXM7XG5cbiAgaWYgKHByZXZDb250ZW50UXVlcmllcykge1xuICAgIGRlZmluaXRpb24uY29udGVudFF1ZXJpZXMgPSAocmYsIGN0eCwgZGlyZWN0aXZlSW5kZXgpID0+IHtcbiAgICAgIHN1cGVyQ29udGVudFF1ZXJpZXMocmYsIGN0eCwgZGlyZWN0aXZlSW5kZXgpO1xuICAgICAgcHJldkNvbnRlbnRRdWVyaWVzKHJmLCBjdHgsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIGRlZmluaXRpb24uY29udGVudFF1ZXJpZXMgPSBzdXBlckNvbnRlbnRRdWVyaWVzO1xuICB9XG59XG5cbmZ1bmN0aW9uIGluaGVyaXRIb3N0QmluZGluZ3MoXG4gICAgZGVmaW5pdGlvbjogRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+LFxuICAgIHN1cGVySG9zdEJpbmRpbmdzOiBIb3N0QmluZGluZ3NGdW5jdGlvbjxhbnk+KSB7XG4gIGNvbnN0IHByZXZIb3N0QmluZGluZ3MgPSBkZWZpbml0aW9uLmhvc3RCaW5kaW5ncztcbiAgLy8gSWYgdGhlIHN1YmNsYXNzIGRvZXMgbm90IGhhdmUgYSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uLCB3ZSBzZXQgdGhlIHN1YmNsYXNzIGhvc3QgYmluZGluZ1xuICAvLyBmdW5jdGlvbiB0byBiZSB0aGUgc3VwZXJjbGFzcydzIChpbiB0aGlzIGZlYXR1cmUpLiBXZSBzaG91bGQgY2hlY2sgaWYgdGhleSdyZSB0aGUgc2FtZSBoZXJlXG4gIC8vIHRvIGVuc3VyZSB3ZSBkb24ndCBpbmhlcml0IGl0IHR3aWNlLlxuICBpZiAoc3VwZXJIb3N0QmluZGluZ3MgIT09IHByZXZIb3N0QmluZGluZ3MpIHtcbiAgICBpZiAocHJldkhvc3RCaW5kaW5ncykge1xuICAgICAgLy8gYmVjYXVzZSBpbmhlcml0YW5jZSBpcyB1bmtub3duIGR1cmluZyBjb21waWxlIHRpbWUsIHRoZSBydW50aW1lIGNvZGVcbiAgICAgIC8vIG5lZWRzIHRvIGJlIGluZm9ybWVkIG9mIHRoZSBzdXBlci1jbGFzcyBkZXB0aCBzbyB0aGF0IGluc3RydWN0aW9uIGNvZGVcbiAgICAgIC8vIGNhbiBkaXN0aW5ndWlzaCBvbmUgaG9zdCBiaW5kaW5ncyBmdW5jdGlvbiBmcm9tIGFub3RoZXIuIFRoZSByZWFzb24gd2h5XG4gICAgICAvLyByZWx5aW5nIG9uIHRoZSBkaXJlY3RpdmUgdW5pcXVlSWQgZXhjbHVzaXZlbHkgaXMgbm90IGVub3VnaCBpcyBiZWNhdXNlIHRoZVxuICAgICAgLy8gdW5pcXVlSWQgdmFsdWUgYW5kIHRoZSBkaXJlY3RpdmUgaW5zdGFuY2Ugc3RheSB0aGUgc2FtZSBiZXR3ZWVuIGhvc3RCaW5kaW5nc1xuICAgICAgLy8gY2FsbHMgdGhyb3VnaG91dCB0aGUgZGlyZWN0aXZlIGluaGVyaXRhbmNlIGNoYWluLiBUaGlzIG1lYW5zIHRoYXQgd2l0aG91dFxuICAgICAgLy8gYSBzdXBlci1jbGFzcyBkZXB0aCB2YWx1ZSwgdGhlcmUgaXMgbm8gd2F5IHRvIGtub3cgd2hldGhlciBhIHBhcmVudCBvclxuICAgICAgLy8gc3ViLWNsYXNzIGhvc3QgYmluZGluZ3MgZnVuY3Rpb24gaXMgY3VycmVudGx5IGJlaW5nIGV4ZWN1dGVkLlxuICAgICAgZGVmaW5pdGlvbi5ob3N0QmluZGluZ3MgPSAocmY6IFJlbmRlckZsYWdzLCBjdHg6IGFueSwgZWxlbWVudEluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgLy8gVGhlIHJlYXNvbiB3aHkgd2UgaW5jcmVtZW50IGZpcnN0IGFuZCB0aGVuIGRlY3JlbWVudCBpcyBzbyB0aGF0IHBhcmVudFxuICAgICAgICAvLyBob3N0QmluZGluZ3MgY2FsbHMgaGF2ZSBhIGhpZ2hlciBpZCB2YWx1ZSBjb21wYXJlZCB0byBzdWItY2xhc3MgaG9zdEJpbmRpbmdzXG4gICAgICAgIC8vIGNhbGxzICh0aGlzIHdheSB0aGUgbGVhZiBkaXJlY3RpdmUgaXMgYWx3YXlzIGF0IGEgc3VwZXItY2xhc3MgZGVwdGggb2YgMCkuXG4gICAgICAgIGFkanVzdEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aFBvc2l0aW9uKDEpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHN1cGVySG9zdEJpbmRpbmdzKHJmLCBjdHgsIGVsZW1lbnRJbmRleCk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgYWRqdXN0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoUG9zaXRpb24oLTEpO1xuICAgICAgICB9XG4gICAgICAgIHByZXZIb3N0QmluZGluZ3MocmYsIGN0eCwgZWxlbWVudEluZGV4KTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlZmluaXRpb24uaG9zdEJpbmRpbmdzID0gc3VwZXJIb3N0QmluZGluZ3M7XG4gICAgfVxuICB9XG59XG4iXX0=