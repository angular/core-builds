/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { fillProperties } from '../../util/property';
import { EMPTY_ARRAY, EMPTY_OBJ } from '../empty';
import { isComponentDef } from '../interfaces/type_checks';
import { adjustActiveDirectiveSuperClassDepthPosition } from '../state';
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
                for (var i = 0; i < features.length; i++) {
                    var feature = features[i];
                    if (feature && feature.ngInherit) {
                        feature(definition);
                    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5oZXJpdF9kZWZpbml0aW9uX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL2luaGVyaXRfZGVmaW5pdGlvbl9mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNuRCxPQUFPLEVBQUMsV0FBVyxFQUFFLFNBQVMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUVoRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDekQsT0FBTyxFQUFDLDRDQUE0QyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRXRFLE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBRTVELFNBQVMsWUFBWSxDQUFDLElBQWU7SUFFbkMsT0FBTyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxXQUFXLENBQUM7QUFDM0QsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLDBCQUEwQixDQUFDLFVBQWdEO0lBQ3pGLElBQUksU0FBUyxHQUFHLFlBQVksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFOUMsT0FBTyxTQUFTLEVBQUU7UUFDaEIsSUFBSSxRQUFRLEdBQWtELFNBQVMsQ0FBQztRQUN4RSxJQUFJLGNBQWMsQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUM5QiwrRUFBK0U7WUFDL0UsUUFBUSxHQUFHLFNBQVMsQ0FBQyxjQUFjLElBQUksU0FBUyxDQUFDLGNBQWMsQ0FBQztTQUNqRTthQUFNO1lBQ0wsSUFBSSxTQUFTLENBQUMsY0FBYyxFQUFFO2dCQUM1QixNQUFNLElBQUksS0FBSyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7YUFDekQ7WUFD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biAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge2ZpbGxQcm9wZXJ0aWVzfSBmcm9tICcuLi8uLi91dGlsL3Byb3BlcnR5JztcbmltcG9ydCB7RU1QVFlfQVJSQVksIEVNUFRZX09CSn0gZnJvbSAnLi4vZW1wdHknO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbnRlbnRRdWVyaWVzRnVuY3Rpb24sIERpcmVjdGl2ZURlZiwgRGlyZWN0aXZlRGVmRmVhdHVyZSwgSG9zdEJpbmRpbmdzRnVuY3Rpb24sIFJlbmRlckZsYWdzLCBWaWV3UXVlcmllc0Z1bmN0aW9ufSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtpc0NvbXBvbmVudERlZn0gZnJvbSAnLi4vaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge2FkanVzdEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aFBvc2l0aW9ufSBmcm9tICcuLi9zdGF0ZSc7XG5cbmltcG9ydCB7ybXJtU5nT25DaGFuZ2VzRmVhdHVyZX0gZnJvbSAnLi9uZ19vbmNoYW5nZXNfZmVhdHVyZSc7XG5cbmZ1bmN0aW9uIGdldFN1cGVyVHlwZSh0eXBlOiBUeXBlPGFueT4pOiBUeXBlPGFueT4mXG4gICAge25nQ29tcG9uZW50RGVmPzogQ29tcG9uZW50RGVmPGFueT4sIG5nRGlyZWN0aXZlRGVmPzogRGlyZWN0aXZlRGVmPGFueT59IHtcbiAgcmV0dXJuIE9iamVjdC5nZXRQcm90b3R5cGVPZih0eXBlLnByb3RvdHlwZSkuY29uc3RydWN0b3I7XG59XG5cbi8qKlxuICogTWVyZ2VzIHRoZSBkZWZpbml0aW9uIGZyb20gYSBzdXBlciBjbGFzcyB0byBhIHN1YiBjbGFzcy5cbiAqIEBwYXJhbSBkZWZpbml0aW9uIFRoZSBkZWZpbml0aW9uIHRoYXQgaXMgYSBTdWJDbGFzcyBvZiBhbm90aGVyIGRpcmVjdGl2ZSBvZiBjb21wb25lbnRcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtUluaGVyaXREZWZpbml0aW9uRmVhdHVyZShkZWZpbml0aW9uOiBEaXJlY3RpdmVEZWY8YW55PnwgQ29tcG9uZW50RGVmPGFueT4pOiB2b2lkIHtcbiAgbGV0IHN1cGVyVHlwZSA9IGdldFN1cGVyVHlwZShkZWZpbml0aW9uLnR5cGUpO1xuXG4gIHdoaWxlIChzdXBlclR5cGUpIHtcbiAgICBsZXQgc3VwZXJEZWY6IERpcmVjdGl2ZURlZjxhbnk+fENvbXBvbmVudERlZjxhbnk+fHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICBpZiAoaXNDb21wb25lbnREZWYoZGVmaW5pdGlvbikpIHtcbiAgICAgIC8vIERvbid0IHVzZSBnZXRDb21wb25lbnREZWYvZ2V0RGlyZWN0aXZlRGVmLiBUaGlzIGxvZ2ljIHJlbGllcyBvbiBpbmhlcml0YW5jZS5cbiAgICAgIHN1cGVyRGVmID0gc3VwZXJUeXBlLm5nQ29tcG9uZW50RGVmIHx8IHN1cGVyVHlwZS5uZ0RpcmVjdGl2ZURlZjtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHN1cGVyVHlwZS5uZ0NvbXBvbmVudERlZikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RpcmVjdGl2ZXMgY2Fubm90IGluaGVyaXQgQ29tcG9uZW50cycpO1xuICAgICAgfVxuICAgICAgLy8gRG9uJ3QgdXNlIGdldENvbXBvbmVudERlZi9nZXREaXJlY3RpdmVEZWYuIFRoaXMgbG9naWMgcmVsaWVzIG9uIGluaGVyaXRhbmNlLlxuICAgICAgc3VwZXJEZWYgPSBzdXBlclR5cGUubmdEaXJlY3RpdmVEZWY7XG4gICAgfVxuXG4gICAgY29uc3QgYmFzZURlZiA9IChzdXBlclR5cGUgYXMgYW55KS5uZ0Jhc2VEZWY7XG5cbiAgICAvLyBTb21lIGZpZWxkcyBpbiB0aGUgZGVmaW5pdGlvbiBtYXkgYmUgZW1wdHksIGlmIHRoZXJlIHdlcmUgbm8gdmFsdWVzIHRvIHB1dCBpbiB0aGVtIHRoYXRcbiAgICAvLyB3b3VsZCd2ZSBqdXN0aWZpZWQgb2JqZWN0IGNyZWF0aW9uLiBVbndyYXAgdGhlbSBpZiBuZWNlc3NhcnkuXG4gICAgaWYgKGJhc2VEZWYgfHwgc3VwZXJEZWYpIHtcbiAgICAgIGNvbnN0IHdyaXRlYWJsZURlZiA9IGRlZmluaXRpb24gYXMgYW55O1xuICAgICAgd3JpdGVhYmxlRGVmLmlucHV0cyA9IG1heWJlVW53cmFwRW1wdHkoZGVmaW5pdGlvbi5pbnB1dHMpO1xuICAgICAgd3JpdGVhYmxlRGVmLmRlY2xhcmVkSW5wdXRzID0gbWF5YmVVbndyYXBFbXB0eShkZWZpbml0aW9uLmRlY2xhcmVkSW5wdXRzKTtcbiAgICAgIHdyaXRlYWJsZURlZi5vdXRwdXRzID0gbWF5YmVVbndyYXBFbXB0eShkZWZpbml0aW9uLm91dHB1dHMpO1xuICAgIH1cblxuICAgIGlmIChiYXNlRGVmKSB7XG4gICAgICBjb25zdCBiYXNlVmlld1F1ZXJ5ID0gYmFzZURlZi52aWV3UXVlcnk7XG4gICAgICBjb25zdCBiYXNlQ29udGVudFF1ZXJpZXMgPSBiYXNlRGVmLmNvbnRlbnRRdWVyaWVzO1xuICAgICAgY29uc3QgYmFzZUhvc3RCaW5kaW5ncyA9IGJhc2VEZWYuaG9zdEJpbmRpbmdzO1xuICAgICAgYmFzZUhvc3RCaW5kaW5ncyAmJiBpbmhlcml0SG9zdEJpbmRpbmdzKGRlZmluaXRpb24sIGJhc2VIb3N0QmluZGluZ3MpO1xuICAgICAgYmFzZVZpZXdRdWVyeSAmJiBpbmhlcml0Vmlld1F1ZXJ5KGRlZmluaXRpb24sIGJhc2VWaWV3UXVlcnkpO1xuICAgICAgYmFzZUNvbnRlbnRRdWVyaWVzICYmIGluaGVyaXRDb250ZW50UXVlcmllcyhkZWZpbml0aW9uLCBiYXNlQ29udGVudFF1ZXJpZXMpO1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5pbnB1dHMsIGJhc2VEZWYuaW5wdXRzKTtcbiAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24uZGVjbGFyZWRJbnB1dHMsIGJhc2VEZWYuZGVjbGFyZWRJbnB1dHMpO1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5vdXRwdXRzLCBiYXNlRGVmLm91dHB1dHMpO1xuICAgIH1cblxuICAgIGlmIChzdXBlckRlZikge1xuICAgICAgLy8gTWVyZ2UgaG9zdEJpbmRpbmdzXG4gICAgICBjb25zdCBzdXBlckhvc3RCaW5kaW5ncyA9IHN1cGVyRGVmLmhvc3RCaW5kaW5ncztcbiAgICAgIHN1cGVySG9zdEJpbmRpbmdzICYmIGluaGVyaXRIb3N0QmluZGluZ3MoZGVmaW5pdGlvbiwgc3VwZXJIb3N0QmluZGluZ3MpO1xuXG4gICAgICAvLyBNZXJnZSBxdWVyaWVzXG4gICAgICBjb25zdCBzdXBlclZpZXdRdWVyeSA9IHN1cGVyRGVmLnZpZXdRdWVyeTtcbiAgICAgIGNvbnN0IHN1cGVyQ29udGVudFF1ZXJpZXMgPSBzdXBlckRlZi5jb250ZW50UXVlcmllcztcbiAgICAgIHN1cGVyVmlld1F1ZXJ5ICYmIGluaGVyaXRWaWV3UXVlcnkoZGVmaW5pdGlvbiwgc3VwZXJWaWV3UXVlcnkpO1xuICAgICAgc3VwZXJDb250ZW50UXVlcmllcyAmJiBpbmhlcml0Q29udGVudFF1ZXJpZXMoZGVmaW5pdGlvbiwgc3VwZXJDb250ZW50UXVlcmllcyk7XG5cbiAgICAgIC8vIE1lcmdlIGlucHV0cyBhbmQgb3V0cHV0c1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5pbnB1dHMsIHN1cGVyRGVmLmlucHV0cyk7XG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLmRlY2xhcmVkSW5wdXRzLCBzdXBlckRlZi5kZWNsYXJlZElucHV0cyk7XG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLm91dHB1dHMsIHN1cGVyRGVmLm91dHB1dHMpO1xuXG4gICAgICAvLyBJbmhlcml0IGhvb2tzXG4gICAgICAvLyBBc3N1bWUgc3VwZXIgY2xhc3MgaW5oZXJpdGFuY2UgZmVhdHVyZSBoYXMgYWxyZWFkeSBydW4uXG4gICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudENoZWNrZWQgPVxuICAgICAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50Q2hlY2tlZCB8fCBzdXBlckRlZi5hZnRlckNvbnRlbnRDaGVja2VkO1xuICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRJbml0ID0gZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRJbml0IHx8IHN1cGVyRGVmLmFmdGVyQ29udGVudEluaXQ7XG4gICAgICBkZWZpbml0aW9uLmFmdGVyVmlld0NoZWNrZWQgPSBkZWZpbml0aW9uLmFmdGVyVmlld0NoZWNrZWQgfHwgc3VwZXJEZWYuYWZ0ZXJWaWV3Q2hlY2tlZDtcbiAgICAgIGRlZmluaXRpb24uYWZ0ZXJWaWV3SW5pdCA9IGRlZmluaXRpb24uYWZ0ZXJWaWV3SW5pdCB8fCBzdXBlckRlZi5hZnRlclZpZXdJbml0O1xuICAgICAgZGVmaW5pdGlvbi5kb0NoZWNrID0gZGVmaW5pdGlvbi5kb0NoZWNrIHx8IHN1cGVyRGVmLmRvQ2hlY2s7XG4gICAgICBkZWZpbml0aW9uLm9uRGVzdHJveSA9IGRlZmluaXRpb24ub25EZXN0cm95IHx8IHN1cGVyRGVmLm9uRGVzdHJveTtcbiAgICAgIGRlZmluaXRpb24ub25Jbml0ID0gZGVmaW5pdGlvbi5vbkluaXQgfHwgc3VwZXJEZWYub25Jbml0O1xuXG4gICAgICAvLyBSdW4gcGFyZW50IGZlYXR1cmVzXG4gICAgICBjb25zdCBmZWF0dXJlcyA9IHN1cGVyRGVmLmZlYXR1cmVzO1xuICAgICAgaWYgKGZlYXR1cmVzKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmVhdHVyZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBmZWF0dXJlID0gZmVhdHVyZXNbaV07XG4gICAgICAgICAgaWYgKGZlYXR1cmUgJiYgZmVhdHVyZS5uZ0luaGVyaXQpIHtcbiAgICAgICAgICAgIChmZWF0dXJlIGFzIERpcmVjdGl2ZURlZkZlYXR1cmUpKGRlZmluaXRpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBFdmVuIGlmIHdlIGRvbid0IGhhdmUgYSBkZWZpbml0aW9uLCBjaGVjayB0aGUgdHlwZSBmb3IgdGhlIGhvb2tzIGFuZCB1c2UgdGhvc2UgaWYgbmVlZCBiZVxuICAgICAgY29uc3Qgc3VwZXJQcm90b3R5cGUgPSBzdXBlclR5cGUucHJvdG90eXBlO1xuICAgICAgaWYgKHN1cGVyUHJvdG90eXBlKSB7XG4gICAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50Q2hlY2tlZCA9XG4gICAgICAgICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudENoZWNrZWQgfHwgc3VwZXJQcm90b3R5cGUubmdBZnRlckNvbnRlbnRDaGVja2VkO1xuICAgICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudEluaXQgPVxuICAgICAgICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRJbml0IHx8IHN1cGVyUHJvdG90eXBlLm5nQWZ0ZXJDb250ZW50SW5pdDtcbiAgICAgICAgZGVmaW5pdGlvbi5hZnRlclZpZXdDaGVja2VkID1cbiAgICAgICAgICAgIGRlZmluaXRpb24uYWZ0ZXJWaWV3Q2hlY2tlZCB8fCBzdXBlclByb3RvdHlwZS5uZ0FmdGVyVmlld0NoZWNrZWQ7XG4gICAgICAgIGRlZmluaXRpb24uYWZ0ZXJWaWV3SW5pdCA9IGRlZmluaXRpb24uYWZ0ZXJWaWV3SW5pdCB8fCBzdXBlclByb3RvdHlwZS5uZ0FmdGVyVmlld0luaXQ7XG4gICAgICAgIGRlZmluaXRpb24uZG9DaGVjayA9IGRlZmluaXRpb24uZG9DaGVjayB8fCBzdXBlclByb3RvdHlwZS5uZ0RvQ2hlY2s7XG4gICAgICAgIGRlZmluaXRpb24ub25EZXN0cm95ID0gZGVmaW5pdGlvbi5vbkRlc3Ryb3kgfHwgc3VwZXJQcm90b3R5cGUubmdPbkRlc3Ryb3k7XG4gICAgICAgIGRlZmluaXRpb24ub25Jbml0ID0gZGVmaW5pdGlvbi5vbkluaXQgfHwgc3VwZXJQcm90b3R5cGUubmdPbkluaXQ7XG5cbiAgICAgICAgaWYgKHN1cGVyUHJvdG90eXBlLm5nT25DaGFuZ2VzKSB7XG4gICAgICAgICAgybXJtU5nT25DaGFuZ2VzRmVhdHVyZSgpKGRlZmluaXRpb24pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgc3VwZXJUeXBlID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHN1cGVyVHlwZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWF5YmVVbndyYXBFbXB0eTxUPih2YWx1ZTogVFtdKTogVFtdO1xuZnVuY3Rpb24gbWF5YmVVbndyYXBFbXB0eTxUPih2YWx1ZTogVCk6IFQ7XG5mdW5jdGlvbiBtYXliZVVud3JhcEVtcHR5KHZhbHVlOiBhbnkpOiBhbnkge1xuICBpZiAodmFsdWUgPT09IEVNUFRZX09CSikge1xuICAgIHJldHVybiB7fTtcbiAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gRU1QVFlfQVJSQVkpIHtcbiAgICByZXR1cm4gW107XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGluaGVyaXRWaWV3UXVlcnkoXG4gICAgZGVmaW5pdGlvbjogRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+LCBzdXBlclZpZXdRdWVyeTogVmlld1F1ZXJpZXNGdW5jdGlvbjxhbnk+KSB7XG4gIGNvbnN0IHByZXZWaWV3UXVlcnkgPSBkZWZpbml0aW9uLnZpZXdRdWVyeTtcblxuICBpZiAocHJldlZpZXdRdWVyeSkge1xuICAgIGRlZmluaXRpb24udmlld1F1ZXJ5ID0gKHJmLCBjdHgpID0+IHtcbiAgICAgIHN1cGVyVmlld1F1ZXJ5KHJmLCBjdHgpO1xuICAgICAgcHJldlZpZXdRdWVyeShyZiwgY3R4KTtcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIGRlZmluaXRpb24udmlld1F1ZXJ5ID0gc3VwZXJWaWV3UXVlcnk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5oZXJpdENvbnRlbnRRdWVyaWVzKFxuICAgIGRlZmluaXRpb246IERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55PixcbiAgICBzdXBlckNvbnRlbnRRdWVyaWVzOiBDb250ZW50UXVlcmllc0Z1bmN0aW9uPGFueT4pIHtcbiAgY29uc3QgcHJldkNvbnRlbnRRdWVyaWVzID0gZGVmaW5pdGlvbi5jb250ZW50UXVlcmllcztcblxuICBpZiAocHJldkNvbnRlbnRRdWVyaWVzKSB7XG4gICAgZGVmaW5pdGlvbi5jb250ZW50UXVlcmllcyA9IChyZiwgY3R4LCBkaXJlY3RpdmVJbmRleCkgPT4ge1xuICAgICAgc3VwZXJDb250ZW50UXVlcmllcyhyZiwgY3R4LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgICBwcmV2Q29udGVudFF1ZXJpZXMocmYsIGN0eCwgZGlyZWN0aXZlSW5kZXgpO1xuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgZGVmaW5pdGlvbi5jb250ZW50UXVlcmllcyA9IHN1cGVyQ29udGVudFF1ZXJpZXM7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5oZXJpdEhvc3RCaW5kaW5ncyhcbiAgICBkZWZpbml0aW9uOiBEaXJlY3RpdmVEZWY8YW55PnwgQ29tcG9uZW50RGVmPGFueT4sXG4gICAgc3VwZXJIb3N0QmluZGluZ3M6IEhvc3RCaW5kaW5nc0Z1bmN0aW9uPGFueT4pIHtcbiAgY29uc3QgcHJldkhvc3RCaW5kaW5ncyA9IGRlZmluaXRpb24uaG9zdEJpbmRpbmdzO1xuICAvLyBJZiB0aGUgc3ViY2xhc3MgZG9lcyBub3QgaGF2ZSBhIGhvc3QgYmluZGluZ3MgZnVuY3Rpb24sIHdlIHNldCB0aGUgc3ViY2xhc3MgaG9zdCBiaW5kaW5nXG4gIC8vIGZ1bmN0aW9uIHRvIGJlIHRoZSBzdXBlcmNsYXNzJ3MgKGluIHRoaXMgZmVhdHVyZSkuIFdlIHNob3VsZCBjaGVjayBpZiB0aGV5J3JlIHRoZSBzYW1lIGhlcmVcbiAgLy8gdG8gZW5zdXJlIHdlIGRvbid0IGluaGVyaXQgaXQgdHdpY2UuXG4gIGlmIChzdXBlckhvc3RCaW5kaW5ncyAhPT0gcHJldkhvc3RCaW5kaW5ncykge1xuICAgIGlmIChwcmV2SG9zdEJpbmRpbmdzKSB7XG4gICAgICAvLyBiZWNhdXNlIGluaGVyaXRhbmNlIGlzIHVua25vd24gZHVyaW5nIGNvbXBpbGUgdGltZSwgdGhlIHJ1bnRpbWUgY29kZVxuICAgICAgLy8gbmVlZHMgdG8gYmUgaW5mb3JtZWQgb2YgdGhlIHN1cGVyLWNsYXNzIGRlcHRoIHNvIHRoYXQgaW5zdHJ1Y3Rpb24gY29kZVxuICAgICAgLy8gY2FuIGRpc3Rpbmd1aXNoIG9uZSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uIGZyb20gYW5vdGhlci4gVGhlIHJlYXNvbiB3aHlcbiAgICAgIC8vIHJlbHlpbmcgb24gdGhlIGRpcmVjdGl2ZSB1bmlxdWVJZCBleGNsdXNpdmVseSBpcyBub3QgZW5vdWdoIGlzIGJlY2F1c2UgdGhlXG4gICAgICAvLyB1bmlxdWVJZCB2YWx1ZSBhbmQgdGhlIGRpcmVjdGl2ZSBpbnN0YW5jZSBzdGF5IHRoZSBzYW1lIGJldHdlZW4gaG9zdEJpbmRpbmdzXG4gICAgICAvLyBjYWxscyB0aHJvdWdob3V0IHRoZSBkaXJlY3RpdmUgaW5oZXJpdGFuY2UgY2hhaW4uIFRoaXMgbWVhbnMgdGhhdCB3aXRob3V0XG4gICAgICAvLyBhIHN1cGVyLWNsYXNzIGRlcHRoIHZhbHVlLCB0aGVyZSBpcyBubyB3YXkgdG8ga25vdyB3aGV0aGVyIGEgcGFyZW50IG9yXG4gICAgICAvLyBzdWItY2xhc3MgaG9zdCBiaW5kaW5ncyBmdW5jdGlvbiBpcyBjdXJyZW50bHkgYmVpbmcgZXhlY3V0ZWQuXG4gICAgICBkZWZpbml0aW9uLmhvc3RCaW5kaW5ncyA9IChyZjogUmVuZGVyRmxhZ3MsIGN0eDogYW55LCBlbGVtZW50SW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAvLyBUaGUgcmVhc29uIHdoeSB3ZSBpbmNyZW1lbnQgZmlyc3QgYW5kIHRoZW4gZGVjcmVtZW50IGlzIHNvIHRoYXQgcGFyZW50XG4gICAgICAgIC8vIGhvc3RCaW5kaW5ncyBjYWxscyBoYXZlIGEgaGlnaGVyIGlkIHZhbHVlIGNvbXBhcmVkIHRvIHN1Yi1jbGFzcyBob3N0QmluZGluZ3NcbiAgICAgICAgLy8gY2FsbHMgKHRoaXMgd2F5IHRoZSBsZWFmIGRpcmVjdGl2ZSBpcyBhbHdheXMgYXQgYSBzdXBlci1jbGFzcyBkZXB0aCBvZiAwKS5cbiAgICAgICAgYWRqdXN0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoUG9zaXRpb24oMSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgc3VwZXJIb3N0QmluZGluZ3MocmYsIGN0eCwgZWxlbWVudEluZGV4KTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBhZGp1c3RBY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGhQb3NpdGlvbigtMSk7XG4gICAgICAgIH1cbiAgICAgICAgcHJldkhvc3RCaW5kaW5ncyhyZiwgY3R4LCBlbGVtZW50SW5kZXgpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVmaW5pdGlvbi5ob3N0QmluZGluZ3MgPSBzdXBlckhvc3RCaW5kaW5ncztcbiAgICB9XG4gIH1cbn1cbiJdfQ==