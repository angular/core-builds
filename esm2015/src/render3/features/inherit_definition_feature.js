/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
import { adjustActiveDirectiveSuperClassDepthPosition } from '../state';
import { isComponentDef } from '../util/view_utils';
import { ΔNgOnChangesFeature } from './ng_onchanges_feature';
/**
 * @param {?} type
 * @return {?}
 */
function getSuperType(type) {
    return Object.getPrototypeOf(type.prototype).constructor;
}
/**
 * Merges the definition from a super class to a sub class.
 * \@publicApi
 * @param {?} definition The definition that is a SubClass of another directive of component
 *
 * @return {?}
 */
export function ΔInheritDefinitionFeature(definition) {
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
            // Merge inputs and outputs
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
                    // because inheritance is unknown during compile time, the runtime code
                    // needs to be informed of the super-class depth so that instruction code
                    // can distinguish one host bindings function from another. The reason why
                    // relying on the directive uniqueId exclusively is not enough is because the
                    // uniqueId value and the directive instance stay the same between hostBindings
                    // calls throughout the directive inheritance chain. This means that without
                    // a super-class depth value, there is no way to know whether a parent or
                    // sub-class host bindings function is currently being executed.
                    definition.hostBindings = (/**
                     * @param {?} rf
                     * @param {?} ctx
                     * @param {?} elementIndex
                     * @return {?}
                     */
                    (rf, ctx, elementIndex) => {
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
                    });
                }
                else {
                    definition.hostBindings = superHostBindings;
                }
            }
            // Merge View Queries
            /** @type {?} */
            const prevViewQuery = definition.viewQuery;
            /** @type {?} */
            const superViewQuery = superDef.viewQuery;
            if (superViewQuery) {
                if (prevViewQuery) {
                    definition.viewQuery = (/**
                     * @template T
                     * @param {?} rf
                     * @param {?} ctx
                     * @return {?}
                     */
                    (rf, ctx) => {
                        superViewQuery(rf, ctx);
                        prevViewQuery(rf, ctx);
                    });
                }
                else {
                    definition.viewQuery = superViewQuery;
                }
            }
            // Merge Content Queries
            /** @type {?} */
            const prevContentQueries = definition.contentQueries;
            /** @type {?} */
            const superContentQueries = superDef.contentQueries;
            if (superContentQueries) {
                if (prevContentQueries) {
                    definition.contentQueries = (/**
                     * @template T
                     * @param {?} rf
                     * @param {?} ctx
                     * @param {?} directiveIndex
                     * @return {?}
                     */
                    (rf, ctx, directiveIndex) => {
                        superContentQueries(rf, ctx, directiveIndex);
                        prevContentQueries(rf, ctx, directiveIndex);
                    });
                }
                else {
                    definition.contentQueries = superContentQueries;
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
            /** @type {?} */
            const features = superDef.features;
            if (features) {
                for (const feature of features) {
                    if (feature && feature.ngInherit) {
                        ((/** @type {?} */ (feature)))(definition);
                    }
                }
            }
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
                if (superPrototype.ngOnChanges) {
                    ΔNgOnChangesFeature()(definition);
                }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5oZXJpdF9kZWZpbml0aW9uX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL2luaGVyaXRfZGVmaW5pdGlvbl9mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ25ELE9BQU8sRUFBQyxXQUFXLEVBQUUsU0FBUyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRWhELE9BQU8sRUFBQyw0Q0FBNEMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN0RSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFbEQsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7Ozs7O0FBRTNELFNBQVMsWUFBWSxDQUFDLElBQWU7SUFFbkMsT0FBTyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxXQUFXLENBQUM7QUFDM0QsQ0FBQzs7Ozs7Ozs7QUFRRCxNQUFNLFVBQVUseUJBQXlCLENBQUMsVUFBZ0Q7O1FBQ3BGLFNBQVMsR0FBRyxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztJQUU3QyxPQUFPLFNBQVMsRUFBRTs7WUFDWixRQUFRLEdBQWtELFNBQVM7UUFDdkUsSUFBSSxjQUFjLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDOUIsK0VBQStFO1lBQy9FLFFBQVEsR0FBRyxTQUFTLENBQUMsY0FBYyxJQUFJLFNBQVMsQ0FBQyxjQUFjLENBQUM7U0FDakU7YUFBTTtZQUNMLElBQUksU0FBUyxDQUFDLGNBQWMsRUFBRTtnQkFDNUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO2FBQ3pEO1lBQ0QsK0VBQStFO1lBQy9FLFFBQVEsR0FBRyxTQUFTLENBQUMs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LEtBQVU7SUFDbEMsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3ZCLE9BQU8sRUFBRSxDQUFDO0tBQ1g7U0FBTSxJQUFJLEtBQUssS0FBSyxXQUFXLEVBQUU7UUFDaEMsT0FBTyxFQUFFLENBQUM7S0FDWDtTQUFNO1FBQ0wsT0FBTyxLQUFLLENBQUM7S0FDZDtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtmaWxsUHJvcGVydGllc30gZnJvbSAnLi4vLi4vdXRpbC9wcm9wZXJ0eSc7XG5pbXBvcnQge0VNUFRZX0FSUkFZLCBFTVBUWV9PQkp9IGZyb20gJy4uL2VtcHR5JztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkZlYXR1cmUsIFJlbmRlckZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHthZGp1c3RBY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGhQb3NpdGlvbn0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtpc0NvbXBvbmVudERlZn0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHvOlE5nT25DaGFuZ2VzRmVhdHVyZX0gZnJvbSAnLi9uZ19vbmNoYW5nZXNfZmVhdHVyZSc7XG5cbmZ1bmN0aW9uIGdldFN1cGVyVHlwZSh0eXBlOiBUeXBlPGFueT4pOiBUeXBlPGFueT4mXG4gICAge25nQ29tcG9uZW50RGVmPzogQ29tcG9uZW50RGVmPGFueT4sIG5nRGlyZWN0aXZlRGVmPzogRGlyZWN0aXZlRGVmPGFueT59IHtcbiAgcmV0dXJuIE9iamVjdC5nZXRQcm90b3R5cGVPZih0eXBlLnByb3RvdHlwZSkuY29uc3RydWN0b3I7XG59XG5cbi8qKlxuICogTWVyZ2VzIHRoZSBkZWZpbml0aW9uIGZyb20gYSBzdXBlciBjbGFzcyB0byBhIHN1YiBjbGFzcy5cbiAqIEBwYXJhbSBkZWZpbml0aW9uIFRoZSBkZWZpbml0aW9uIHRoYXQgaXMgYSBTdWJDbGFzcyBvZiBhbm90aGVyIGRpcmVjdGl2ZSBvZiBjb21wb25lbnRcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDOlEluaGVyaXREZWZpbml0aW9uRmVhdHVyZShkZWZpbml0aW9uOiBEaXJlY3RpdmVEZWY8YW55PnwgQ29tcG9uZW50RGVmPGFueT4pOiB2b2lkIHtcbiAgbGV0IHN1cGVyVHlwZSA9IGdldFN1cGVyVHlwZShkZWZpbml0aW9uLnR5cGUpO1xuXG4gIHdoaWxlIChzdXBlclR5cGUpIHtcbiAgICBsZXQgc3VwZXJEZWY6IERpcmVjdGl2ZURlZjxhbnk+fENvbXBvbmVudERlZjxhbnk+fHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICBpZiAoaXNDb21wb25lbnREZWYoZGVmaW5pdGlvbikpIHtcbiAgICAgIC8vIERvbid0IHVzZSBnZXRDb21wb25lbnREZWYvZ2V0RGlyZWN0aXZlRGVmLiBUaGlzIGxvZ2ljIHJlbGllcyBvbiBpbmhlcml0YW5jZS5cbiAgICAgIHN1cGVyRGVmID0gc3VwZXJUeXBlLm5nQ29tcG9uZW50RGVmIHx8IHN1cGVyVHlwZS5uZ0RpcmVjdGl2ZURlZjtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHN1cGVyVHlwZS5uZ0NvbXBvbmVudERlZikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RpcmVjdGl2ZXMgY2Fubm90IGluaGVyaXQgQ29tcG9uZW50cycpO1xuICAgICAgfVxuICAgICAgLy8gRG9uJ3QgdXNlIGdldENvbXBvbmVudERlZi9nZXREaXJlY3RpdmVEZWYuIFRoaXMgbG9naWMgcmVsaWVzIG9uIGluaGVyaXRhbmNlLlxuICAgICAgc3VwZXJEZWYgPSBzdXBlclR5cGUubmdEaXJlY3RpdmVEZWY7XG4gICAgfVxuXG4gICAgY29uc3QgYmFzZURlZiA9IChzdXBlclR5cGUgYXMgYW55KS5uZ0Jhc2VEZWY7XG5cbiAgICAvLyBTb21lIGZpZWxkcyBpbiB0aGUgZGVmaW5pdGlvbiBtYXkgYmUgZW1wdHksIGlmIHRoZXJlIHdlcmUgbm8gdmFsdWVzIHRvIHB1dCBpbiB0aGVtIHRoYXRcbiAgICAvLyB3b3VsZCd2ZSBqdXN0aWZpZWQgb2JqZWN0IGNyZWF0aW9uLiBVbndyYXAgdGhlbSBpZiBuZWNlc3NhcnkuXG4gICAgaWYgKGJhc2VEZWYgfHwgc3VwZXJEZWYpIHtcbiAgICAgIGNvbnN0IHdyaXRlYWJsZURlZiA9IGRlZmluaXRpb24gYXMgYW55O1xuICAgICAgd3JpdGVhYmxlRGVmLmlucHV0cyA9IG1heWJlVW53cmFwRW1wdHkoZGVmaW5pdGlvbi5pbnB1dHMpO1xuICAgICAgd3JpdGVhYmxlRGVmLmRlY2xhcmVkSW5wdXRzID0gbWF5YmVVbndyYXBFbXB0eShkZWZpbml0aW9uLmRlY2xhcmVkSW5wdXRzKTtcbiAgICAgIHdyaXRlYWJsZURlZi5vdXRwdXRzID0gbWF5YmVVbndyYXBFbXB0eShkZWZpbml0aW9uLm91dHB1dHMpO1xuICAgIH1cblxuICAgIGlmIChiYXNlRGVmKSB7XG4gICAgICAvLyBNZXJnZSBpbnB1dHMgYW5kIG91dHB1dHNcbiAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24uaW5wdXRzLCBiYXNlRGVmLmlucHV0cyk7XG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLmRlY2xhcmVkSW5wdXRzLCBiYXNlRGVmLmRlY2xhcmVkSW5wdXRzKTtcbiAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24ub3V0cHV0cywgYmFzZURlZi5vdXRwdXRzKTtcbiAgICB9XG5cbiAgICBpZiAoc3VwZXJEZWYpIHtcbiAgICAgIC8vIE1lcmdlIGhvc3RCaW5kaW5nc1xuICAgICAgY29uc3QgcHJldkhvc3RCaW5kaW5ncyA9IGRlZmluaXRpb24uaG9zdEJpbmRpbmdzO1xuICAgICAgY29uc3Qgc3VwZXJIb3N0QmluZGluZ3MgPSBzdXBlckRlZi5ob3N0QmluZGluZ3M7XG4gICAgICBpZiAoc3VwZXJIb3N0QmluZGluZ3MpIHtcbiAgICAgICAgaWYgKHByZXZIb3N0QmluZGluZ3MpIHtcbiAgICAgICAgICAvLyBiZWNhdXNlIGluaGVyaXRhbmNlIGlzIHVua25vd24gZHVyaW5nIGNvbXBpbGUgdGltZSwgdGhlIHJ1bnRpbWUgY29kZVxuICAgICAgICAgIC8vIG5lZWRzIHRvIGJlIGluZm9ybWVkIG9mIHRoZSBzdXBlci1jbGFzcyBkZXB0aCBzbyB0aGF0IGluc3RydWN0aW9uIGNvZGVcbiAgICAgICAgICAvLyBjYW4gZGlzdGluZ3Vpc2ggb25lIGhvc3QgYmluZGluZ3MgZnVuY3Rpb24gZnJvbSBhbm90aGVyLiBUaGUgcmVhc29uIHdoeVxuICAgICAgICAgIC8vIHJlbHlpbmcgb24gdGhlIGRpcmVjdGl2ZSB1bmlxdWVJZCBleGNsdXNpdmVseSBpcyBub3QgZW5vdWdoIGlzIGJlY2F1c2UgdGhlXG4gICAgICAgICAgLy8gdW5pcXVlSWQgdmFsdWUgYW5kIHRoZSBkaXJlY3RpdmUgaW5zdGFuY2Ugc3RheSB0aGUgc2FtZSBiZXR3ZWVuIGhvc3RCaW5kaW5nc1xuICAgICAgICAgIC8vIGNhbGxzIHRocm91Z2hvdXQgdGhlIGRpcmVjdGl2ZSBpbmhlcml0YW5jZSBjaGFpbi4gVGhpcyBtZWFucyB0aGF0IHdpdGhvdXRcbiAgICAgICAgICAvLyBhIHN1cGVyLWNsYXNzIGRlcHRoIHZhbHVlLCB0aGVyZSBpcyBubyB3YXkgdG8ga25vdyB3aGV0aGVyIGEgcGFyZW50IG9yXG4gICAgICAgICAgLy8gc3ViLWNsYXNzIGhvc3QgYmluZGluZ3MgZnVuY3Rpb24gaXMgY3VycmVudGx5IGJlaW5nIGV4ZWN1dGVkLlxuICAgICAgICAgIGRlZmluaXRpb24uaG9zdEJpbmRpbmdzID0gKHJmOiBSZW5kZXJGbGFncywgY3R4OiBhbnksIGVsZW1lbnRJbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAvLyBUaGUgcmVhc29uIHdoeSB3ZSBpbmNyZW1lbnQgZmlyc3QgYW5kIHRoZW4gZGVjcmVtZW50IGlzIHNvIHRoYXQgcGFyZW50XG4gICAgICAgICAgICAvLyBob3N0QmluZGluZ3MgY2FsbHMgaGF2ZSBhIGhpZ2hlciBpZCB2YWx1ZSBjb21wYXJlZCB0byBzdWItY2xhc3MgaG9zdEJpbmRpbmdzXG4gICAgICAgICAgICAvLyBjYWxscyAodGhpcyB3YXkgdGhlIGxlYWYgZGlyZWN0aXZlIGlzIGFsd2F5cyBhdCBhIHN1cGVyLWNsYXNzIGRlcHRoIG9mIDApLlxuICAgICAgICAgICAgYWRqdXN0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoUG9zaXRpb24oMSk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBzdXBlckhvc3RCaW5kaW5ncyhyZiwgY3R4LCBlbGVtZW50SW5kZXgpO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgYWRqdXN0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoUG9zaXRpb24oLTEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHJldkhvc3RCaW5kaW5ncyhyZiwgY3R4LCBlbGVtZW50SW5kZXgpO1xuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVmaW5pdGlvbi5ob3N0QmluZGluZ3MgPSBzdXBlckhvc3RCaW5kaW5ncztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBNZXJnZSBWaWV3IFF1ZXJpZXNcbiAgICAgIGNvbnN0IHByZXZWaWV3UXVlcnkgPSBkZWZpbml0aW9uLnZpZXdRdWVyeTtcbiAgICAgIGNvbnN0IHN1cGVyVmlld1F1ZXJ5ID0gc3VwZXJEZWYudmlld1F1ZXJ5O1xuXG4gICAgICBpZiAoc3VwZXJWaWV3UXVlcnkpIHtcbiAgICAgICAgaWYgKHByZXZWaWV3UXVlcnkpIHtcbiAgICAgICAgICBkZWZpbml0aW9uLnZpZXdRdWVyeSA9IDxUPihyZjogUmVuZGVyRmxhZ3MsIGN0eDogVCk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgc3VwZXJWaWV3UXVlcnkocmYsIGN0eCk7XG4gICAgICAgICAgICBwcmV2Vmlld1F1ZXJ5KHJmLCBjdHgpO1xuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVmaW5pdGlvbi52aWV3UXVlcnkgPSBzdXBlclZpZXdRdWVyeTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBNZXJnZSBDb250ZW50IFF1ZXJpZXNcbiAgICAgIGNvbnN0IHByZXZDb250ZW50UXVlcmllcyA9IGRlZmluaXRpb24uY29udGVudFF1ZXJpZXM7XG4gICAgICBjb25zdCBzdXBlckNvbnRlbnRRdWVyaWVzID0gc3VwZXJEZWYuY29udGVudFF1ZXJpZXM7XG4gICAgICBpZiAoc3VwZXJDb250ZW50UXVlcmllcykge1xuICAgICAgICBpZiAocHJldkNvbnRlbnRRdWVyaWVzKSB7XG4gICAgICAgICAgZGVmaW5pdGlvbi5jb250ZW50UXVlcmllcyA9IDxUPihyZjogUmVuZGVyRmxhZ3MsIGN0eDogVCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgc3VwZXJDb250ZW50UXVlcmllcyhyZiwgY3R4LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgICAgICAgICBwcmV2Q29udGVudFF1ZXJpZXMocmYsIGN0eCwgZGlyZWN0aXZlSW5kZXgpO1xuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVmaW5pdGlvbi5jb250ZW50UXVlcmllcyA9IHN1cGVyQ29udGVudFF1ZXJpZXM7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gTWVyZ2UgaW5wdXRzIGFuZCBvdXRwdXRzXG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLmlucHV0cywgc3VwZXJEZWYuaW5wdXRzKTtcbiAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24uZGVjbGFyZWRJbnB1dHMsIHN1cGVyRGVmLmRlY2xhcmVkSW5wdXRzKTtcbiAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24ub3V0cHV0cywgc3VwZXJEZWYub3V0cHV0cyk7XG5cbiAgICAgIC8vIEluaGVyaXQgaG9va3NcbiAgICAgIC8vIEFzc3VtZSBzdXBlciBjbGFzcyBpbmhlcml0YW5jZSBmZWF0dXJlIGhhcyBhbHJlYWR5IHJ1bi5cbiAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50Q2hlY2tlZCA9XG4gICAgICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRDaGVja2VkIHx8IHN1cGVyRGVmLmFmdGVyQ29udGVudENoZWNrZWQ7XG4gICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudEluaXQgPSBkZWZpbml0aW9uLmFmdGVyQ29udGVudEluaXQgfHwgc3VwZXJEZWYuYWZ0ZXJDb250ZW50SW5pdDtcbiAgICAgIGRlZmluaXRpb24uYWZ0ZXJWaWV3Q2hlY2tlZCA9IGRlZmluaXRpb24uYWZ0ZXJWaWV3Q2hlY2tlZCB8fCBzdXBlckRlZi5hZnRlclZpZXdDaGVja2VkO1xuICAgICAgZGVmaW5pdGlvbi5hZnRlclZpZXdJbml0ID0gZGVmaW5pdGlvbi5hZnRlclZpZXdJbml0IHx8IHN1cGVyRGVmLmFmdGVyVmlld0luaXQ7XG4gICAgICBkZWZpbml0aW9uLmRvQ2hlY2sgPSBkZWZpbml0aW9uLmRvQ2hlY2sgfHwgc3VwZXJEZWYuZG9DaGVjaztcbiAgICAgIGRlZmluaXRpb24ub25EZXN0cm95ID0gZGVmaW5pdGlvbi5vbkRlc3Ryb3kgfHwgc3VwZXJEZWYub25EZXN0cm95O1xuICAgICAgZGVmaW5pdGlvbi5vbkluaXQgPSBkZWZpbml0aW9uLm9uSW5pdCB8fCBzdXBlckRlZi5vbkluaXQ7XG5cbiAgICAgIC8vIFJ1biBwYXJlbnQgZmVhdHVyZXNcbiAgICAgIGNvbnN0IGZlYXR1cmVzID0gc3VwZXJEZWYuZmVhdHVyZXM7XG4gICAgICBpZiAoZmVhdHVyZXMpIHtcbiAgICAgICAgZm9yIChjb25zdCBmZWF0dXJlIG9mIGZlYXR1cmVzKSB7XG4gICAgICAgICAgaWYgKGZlYXR1cmUgJiYgZmVhdHVyZS5uZ0luaGVyaXQpIHtcbiAgICAgICAgICAgIChmZWF0dXJlIGFzIERpcmVjdGl2ZURlZkZlYXR1cmUpKGRlZmluaXRpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBFdmVuIGlmIHdlIGRvbid0IGhhdmUgYSBkZWZpbml0aW9uLCBjaGVjayB0aGUgdHlwZSBmb3IgdGhlIGhvb2tzIGFuZCB1c2UgdGhvc2UgaWYgbmVlZCBiZVxuICAgICAgY29uc3Qgc3VwZXJQcm90b3R5cGUgPSBzdXBlclR5cGUucHJvdG90eXBlO1xuICAgICAgaWYgKHN1cGVyUHJvdG90eXBlKSB7XG4gICAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50Q2hlY2tlZCA9XG4gICAgICAgICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudENoZWNrZWQgfHwgc3VwZXJQcm90b3R5cGUubmdBZnRlckNvbnRlbnRDaGVja2VkO1xuICAgICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudEluaXQgPVxuICAgICAgICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRJbml0IHx8IHN1cGVyUHJvdG90eXBlLm5nQWZ0ZXJDb250ZW50SW5pdDtcbiAgICAgICAgZGVmaW5pdGlvbi5hZnRlclZpZXdDaGVja2VkID1cbiAgICAgICAgICAgIGRlZmluaXRpb24uYWZ0ZXJWaWV3Q2hlY2tlZCB8fCBzdXBlclByb3RvdHlwZS5uZ0FmdGVyVmlld0NoZWNrZWQ7XG4gICAgICAgIGRlZmluaXRpb24uYWZ0ZXJWaWV3SW5pdCA9IGRlZmluaXRpb24uYWZ0ZXJWaWV3SW5pdCB8fCBzdXBlclByb3RvdHlwZS5uZ0FmdGVyVmlld0luaXQ7XG4gICAgICAgIGRlZmluaXRpb24uZG9DaGVjayA9IGRlZmluaXRpb24uZG9DaGVjayB8fCBzdXBlclByb3RvdHlwZS5uZ0RvQ2hlY2s7XG4gICAgICAgIGRlZmluaXRpb24ub25EZXN0cm95ID0gZGVmaW5pdGlvbi5vbkRlc3Ryb3kgfHwgc3VwZXJQcm90b3R5cGUubmdPbkRlc3Ryb3k7XG4gICAgICAgIGRlZmluaXRpb24ub25Jbml0ID0gZGVmaW5pdGlvbi5vbkluaXQgfHwgc3VwZXJQcm90b3R5cGUubmdPbkluaXQ7XG5cbiAgICAgICAgaWYgKHN1cGVyUHJvdG90eXBlLm5nT25DaGFuZ2VzKSB7XG4gICAgICAgICAgzpROZ09uQ2hhbmdlc0ZlYXR1cmUoKShkZWZpbml0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHN1cGVyVHlwZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihzdXBlclR5cGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1heWJlVW53cmFwRW1wdHk8VD4odmFsdWU6IFRbXSk6IFRbXTtcbmZ1bmN0aW9uIG1heWJlVW53cmFwRW1wdHk8VD4odmFsdWU6IFQpOiBUO1xuZnVuY3Rpb24gbWF5YmVVbndyYXBFbXB0eSh2YWx1ZTogYW55KTogYW55IHtcbiAgaWYgKHZhbHVlID09PSBFTVBUWV9PQkopIHtcbiAgICByZXR1cm4ge307XG4gIH0gZWxzZSBpZiAodmFsdWUgPT09IEVNUFRZX0FSUkFZKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxufVxuIl19