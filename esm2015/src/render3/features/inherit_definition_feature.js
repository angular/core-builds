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
import { ɵɵNgOnChangesFeature } from './ng_onchanges_feature';
/**
 * @param {?} type
 * @return {?}
 */
function getSuperType(type) {
    return Object.getPrototypeOf(type.prototype).constructor;
}
/**
 * Merges the definition from a super class to a sub class.
 * \@codeGenApi
 * @param {?} definition The definition that is a SubClass of another directive of component
 *
 * @return {?}
 */
export function ɵɵInheritDefinitionFeature(definition) {
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
            /** @type {?} */
            const baseViewQuery = baseDef.viewQuery;
            /** @type {?} */
            const baseContentQueries = baseDef.contentQueries;
            /** @type {?} */
            const baseHostBindings = baseDef.hostBindings;
            baseHostBindings && inheritHostBindings(definition, baseHostBindings);
            baseViewQuery && inheritViewQuery(definition, baseViewQuery);
            baseContentQueries && inheritContentQueries(definition, baseContentQueries);
            fillProperties(definition.inputs, baseDef.inputs);
            fillProperties(definition.declaredInputs, baseDef.declaredInputs);
            fillProperties(definition.outputs, baseDef.outputs);
        }
        if (superDef) {
            // Merge hostBindings
            /** @type {?} */
            const superHostBindings = superDef.hostBindings;
            superHostBindings && inheritHostBindings(definition, superHostBindings);
            // Merge queries
            /** @type {?} */
            const superViewQuery = superDef.viewQuery;
            /** @type {?} */
            const superContentQueries = superDef.contentQueries;
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
                    ɵɵNgOnChangesFeature()(definition);
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
/**
 * @param {?} definition
 * @param {?} superViewQuery
 * @return {?}
 */
function inheritViewQuery(definition, superViewQuery) {
    /** @type {?} */
    const prevViewQuery = definition.viewQuery;
    if (prevViewQuery) {
        definition.viewQuery = (/**
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
/**
 * @param {?} definition
 * @param {?} superContentQueries
 * @return {?}
 */
function inheritContentQueries(definition, superContentQueries) {
    /** @type {?} */
    const prevContentQueries = definition.contentQueries;
    if (prevContentQueries) {
        definition.contentQueries = (/**
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
/**
 * @param {?} definition
 * @param {?} superHostBindings
 * @return {?}
 */
function inheritHostBindings(definition, superHostBindings) {
    /** @type {?} */
    const prevHostBindings = definition.hostBindings;
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
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5oZXJpdF9kZWZpbml0aW9uX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL2luaGVyaXRfZGVmaW5pdGlvbl9mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ25ELE9BQU8sRUFBQyxXQUFXLEVBQUUsU0FBUyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRWhELE9BQU8sRUFBQyw0Q0FBNEMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN0RSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFbEQsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7Ozs7O0FBRTVELFNBQVMsWUFBWSxDQUFDLElBQWU7SUFFbkMsT0FBTyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxXQUFXLENBQUM7QUFDM0QsQ0FBQzs7Ozs7Ozs7QUFRRCxNQUFNLFVBQVUsMEJBQTBCLENBQUMsVUFBZ0Q7O1FBQ3JGLFNBQVMsR0FBRyxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztJQUU3QyxPQUFPLFNBQVMsRUFBRTs7WUFDWixRQUFRLEdBQWtELFNBQVM7UUFDdkUsSUFBSSxjQUFjLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDOUIsK0VBQStFO1lBQy9FLFFBQVEsR0FBRyxTQUFTLENBQUMsY0FBYyxJQUFJLFNBQVMsQ0FBQyxjQUFjLENBQUM7U0FDakU7YUFBTTtZQUNMLElBQUksU0FBUyxDQUFDLGNBQWMsRUFBRTtnQkFDNUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO2FBQ3pEO1lBQ0QsK0VBQStFO1lBQy9FLFFBQVEsR0FBRyxTQUFTLENBQUMs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Q2pEO0FBQ0gsQ0FBQzs7Ozs7O0FBRUQsU0FBUyxtQkFBbUIsQ0FDeEIsVUFBZ0QsRUFDaEQsaUJBQTRDOztVQUN4QyxnQkFBZ0IsR0FBRyxVQUFVLENBQUMsWUFBWTtJQUNoRCwyRkFBMkY7SUFDM0YsOEZBQThGO0lBQzlGLHVDQUF1QztJQUN2QyxJQUFJLGlCQUFpQixLQUFLLGdCQUFnQixFQUFFO1FBQzFDLElBQUksZ0JBQWdCLEVBQUU7WUFDcEIsdUVBQXVFO1lBQ3ZFLHlFQUF5RTtZQUN6RSwwRUFBMEU7WUFDMUUsNkVBQTZFO1lBQzdFLCtFQUErRTtZQUMvRSw0RUFBNEU7WUFDNUUseUVBQXlFO1lBQ3pFLGdFQUFnRTtZQUNoRSxVQUFVLENBQUMsWUFBWTs7Ozs7O1lBQUcsQ0FBQyxFQUFlLEVBQUUsR0FBUSxFQUFFLFlBQW9CLEVBQUUsRUFBRTtnQkFDNUUseUVBQXlFO2dCQUN6RSwrRUFBK0U7Z0JBQy9FLDZFQUE2RTtnQkFDN0UsNENBQTRDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hELElBQUk7b0JBQ0YsaUJBQWlCLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQztpQkFDMUM7d0JBQVM7b0JBQ1IsNENBQTRDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDbEQ7Z0JBQ0QsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUMxQyxDQUFDLENBQUEsQ0FBQztTQUNIO2FBQU07WUFDTCxVQUFVLENBQUMsWUFBWSxHQUFHLGlCQUFpQixDQUFDO1NBQzdDO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7ZmlsbFByb3BlcnRpZXN9IGZyb20gJy4uLy4uL3V0aWwvcHJvcGVydHknO1xuaW1wb3J0IHtFTVBUWV9BUlJBWSwgRU1QVFlfT0JKfSBmcm9tICcuLi9lbXB0eSc7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgQ29udGVudFF1ZXJpZXNGdW5jdGlvbiwgRGlyZWN0aXZlRGVmLCBEaXJlY3RpdmVEZWZGZWF0dXJlLCBIb3N0QmluZGluZ3NGdW5jdGlvbiwgUmVuZGVyRmxhZ3MsIFZpZXdRdWVyaWVzRnVuY3Rpb259IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge2FkanVzdEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aFBvc2l0aW9ufSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2lzQ29tcG9uZW50RGVmfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge8m1ybVOZ09uQ2hhbmdlc0ZlYXR1cmV9IGZyb20gJy4vbmdfb25jaGFuZ2VzX2ZlYXR1cmUnO1xuXG5mdW5jdGlvbiBnZXRTdXBlclR5cGUodHlwZTogVHlwZTxhbnk+KTogVHlwZTxhbnk+JlxuICAgIHtuZ0NvbXBvbmVudERlZj86IENvbXBvbmVudERlZjxhbnk+LCBuZ0RpcmVjdGl2ZURlZj86IERpcmVjdGl2ZURlZjxhbnk+fSB7XG4gIHJldHVybiBPYmplY3QuZ2V0UHJvdG90eXBlT2YodHlwZS5wcm90b3R5cGUpLmNvbnN0cnVjdG9yO1xufVxuXG4vKipcbiAqIE1lcmdlcyB0aGUgZGVmaW5pdGlvbiBmcm9tIGEgc3VwZXIgY2xhc3MgdG8gYSBzdWIgY2xhc3MuXG4gKiBAcGFyYW0gZGVmaW5pdGlvbiBUaGUgZGVmaW5pdGlvbiB0aGF0IGlzIGEgU3ViQ2xhc3Mgb2YgYW5vdGhlciBkaXJlY3RpdmUgb2YgY29tcG9uZW50XG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVJbmhlcml0RGVmaW5pdGlvbkZlYXR1cmUoZGVmaW5pdGlvbjogRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+KTogdm9pZCB7XG4gIGxldCBzdXBlclR5cGUgPSBnZXRTdXBlclR5cGUoZGVmaW5pdGlvbi50eXBlKTtcblxuICB3aGlsZSAoc3VwZXJUeXBlKSB7XG4gICAgbGV0IHN1cGVyRGVmOiBEaXJlY3RpdmVEZWY8YW55PnxDb21wb25lbnREZWY8YW55Pnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKGlzQ29tcG9uZW50RGVmKGRlZmluaXRpb24pKSB7XG4gICAgICAvLyBEb24ndCB1c2UgZ2V0Q29tcG9uZW50RGVmL2dldERpcmVjdGl2ZURlZi4gVGhpcyBsb2dpYyByZWxpZXMgb24gaW5oZXJpdGFuY2UuXG4gICAgICBzdXBlckRlZiA9IHN1cGVyVHlwZS5uZ0NvbXBvbmVudERlZiB8fCBzdXBlclR5cGUubmdEaXJlY3RpdmVEZWY7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzdXBlclR5cGUubmdDb21wb25lbnREZWYpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEaXJlY3RpdmVzIGNhbm5vdCBpbmhlcml0IENvbXBvbmVudHMnKTtcbiAgICAgIH1cbiAgICAgIC8vIERvbid0IHVzZSBnZXRDb21wb25lbnREZWYvZ2V0RGlyZWN0aXZlRGVmLiBUaGlzIGxvZ2ljIHJlbGllcyBvbiBpbmhlcml0YW5jZS5cbiAgICAgIHN1cGVyRGVmID0gc3VwZXJUeXBlLm5nRGlyZWN0aXZlRGVmO1xuICAgIH1cblxuICAgIGNvbnN0IGJhc2VEZWYgPSAoc3VwZXJUeXBlIGFzIGFueSkubmdCYXNlRGVmO1xuXG4gICAgLy8gU29tZSBmaWVsZHMgaW4gdGhlIGRlZmluaXRpb24gbWF5IGJlIGVtcHR5LCBpZiB0aGVyZSB3ZXJlIG5vIHZhbHVlcyB0byBwdXQgaW4gdGhlbSB0aGF0XG4gICAgLy8gd291bGQndmUganVzdGlmaWVkIG9iamVjdCBjcmVhdGlvbi4gVW53cmFwIHRoZW0gaWYgbmVjZXNzYXJ5LlxuICAgIGlmIChiYXNlRGVmIHx8IHN1cGVyRGVmKSB7XG4gICAgICBjb25zdCB3cml0ZWFibGVEZWYgPSBkZWZpbml0aW9uIGFzIGFueTtcbiAgICAgIHdyaXRlYWJsZURlZi5pbnB1dHMgPSBtYXliZVVud3JhcEVtcHR5KGRlZmluaXRpb24uaW5wdXRzKTtcbiAgICAgIHdyaXRlYWJsZURlZi5kZWNsYXJlZElucHV0cyA9IG1heWJlVW53cmFwRW1wdHkoZGVmaW5pdGlvbi5kZWNsYXJlZElucHV0cyk7XG4gICAgICB3cml0ZWFibGVEZWYub3V0cHV0cyA9IG1heWJlVW53cmFwRW1wdHkoZGVmaW5pdGlvbi5vdXRwdXRzKTtcbiAgICB9XG5cbiAgICBpZiAoYmFzZURlZikge1xuICAgICAgY29uc3QgYmFzZVZpZXdRdWVyeSA9IGJhc2VEZWYudmlld1F1ZXJ5O1xuICAgICAgY29uc3QgYmFzZUNvbnRlbnRRdWVyaWVzID0gYmFzZURlZi5jb250ZW50UXVlcmllcztcbiAgICAgIGNvbnN0IGJhc2VIb3N0QmluZGluZ3MgPSBiYXNlRGVmLmhvc3RCaW5kaW5ncztcbiAgICAgIGJhc2VIb3N0QmluZGluZ3MgJiYgaW5oZXJpdEhvc3RCaW5kaW5ncyhkZWZpbml0aW9uLCBiYXNlSG9zdEJpbmRpbmdzKTtcbiAgICAgIGJhc2VWaWV3UXVlcnkgJiYgaW5oZXJpdFZpZXdRdWVyeShkZWZpbml0aW9uLCBiYXNlVmlld1F1ZXJ5KTtcbiAgICAgIGJhc2VDb250ZW50UXVlcmllcyAmJiBpbmhlcml0Q29udGVudFF1ZXJpZXMoZGVmaW5pdGlvbiwgYmFzZUNvbnRlbnRRdWVyaWVzKTtcbiAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24uaW5wdXRzLCBiYXNlRGVmLmlucHV0cyk7XG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLmRlY2xhcmVkSW5wdXRzLCBiYXNlRGVmLmRlY2xhcmVkSW5wdXRzKTtcbiAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24ub3V0cHV0cywgYmFzZURlZi5vdXRwdXRzKTtcbiAgICB9XG5cbiAgICBpZiAoc3VwZXJEZWYpIHtcbiAgICAgIC8vIE1lcmdlIGhvc3RCaW5kaW5nc1xuICAgICAgY29uc3Qgc3VwZXJIb3N0QmluZGluZ3MgPSBzdXBlckRlZi5ob3N0QmluZGluZ3M7XG4gICAgICBzdXBlckhvc3RCaW5kaW5ncyAmJiBpbmhlcml0SG9zdEJpbmRpbmdzKGRlZmluaXRpb24sIHN1cGVySG9zdEJpbmRpbmdzKTtcblxuICAgICAgLy8gTWVyZ2UgcXVlcmllc1xuICAgICAgY29uc3Qgc3VwZXJWaWV3UXVlcnkgPSBzdXBlckRlZi52aWV3UXVlcnk7XG4gICAgICBjb25zdCBzdXBlckNvbnRlbnRRdWVyaWVzID0gc3VwZXJEZWYuY29udGVudFF1ZXJpZXM7XG4gICAgICBzdXBlclZpZXdRdWVyeSAmJiBpbmhlcml0Vmlld1F1ZXJ5KGRlZmluaXRpb24sIHN1cGVyVmlld1F1ZXJ5KTtcbiAgICAgIHN1cGVyQ29udGVudFF1ZXJpZXMgJiYgaW5oZXJpdENvbnRlbnRRdWVyaWVzKGRlZmluaXRpb24sIHN1cGVyQ29udGVudFF1ZXJpZXMpO1xuXG4gICAgICAvLyBNZXJnZSBpbnB1dHMgYW5kIG91dHB1dHNcbiAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24uaW5wdXRzLCBzdXBlckRlZi5pbnB1dHMpO1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5kZWNsYXJlZElucHV0cywgc3VwZXJEZWYuZGVjbGFyZWRJbnB1dHMpO1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5vdXRwdXRzLCBzdXBlckRlZi5vdXRwdXRzKTtcblxuICAgICAgLy8gSW5oZXJpdCBob29rc1xuICAgICAgLy8gQXNzdW1lIHN1cGVyIGNsYXNzIGluaGVyaXRhbmNlIGZlYXR1cmUgaGFzIGFscmVhZHkgcnVuLlxuICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRDaGVja2VkID1cbiAgICAgICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudENoZWNrZWQgfHwgc3VwZXJEZWYuYWZ0ZXJDb250ZW50Q2hlY2tlZDtcbiAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50SW5pdCA9IGRlZmluaXRpb24uYWZ0ZXJDb250ZW50SW5pdCB8fCBzdXBlckRlZi5hZnRlckNvbnRlbnRJbml0O1xuICAgICAgZGVmaW5pdGlvbi5hZnRlclZpZXdDaGVja2VkID0gZGVmaW5pdGlvbi5hZnRlclZpZXdDaGVja2VkIHx8IHN1cGVyRGVmLmFmdGVyVmlld0NoZWNrZWQ7XG4gICAgICBkZWZpbml0aW9uLmFmdGVyVmlld0luaXQgPSBkZWZpbml0aW9uLmFmdGVyVmlld0luaXQgfHwgc3VwZXJEZWYuYWZ0ZXJWaWV3SW5pdDtcbiAgICAgIGRlZmluaXRpb24uZG9DaGVjayA9IGRlZmluaXRpb24uZG9DaGVjayB8fCBzdXBlckRlZi5kb0NoZWNrO1xuICAgICAgZGVmaW5pdGlvbi5vbkRlc3Ryb3kgPSBkZWZpbml0aW9uLm9uRGVzdHJveSB8fCBzdXBlckRlZi5vbkRlc3Ryb3k7XG4gICAgICBkZWZpbml0aW9uLm9uSW5pdCA9IGRlZmluaXRpb24ub25Jbml0IHx8IHN1cGVyRGVmLm9uSW5pdDtcblxuICAgICAgLy8gUnVuIHBhcmVudCBmZWF0dXJlc1xuICAgICAgY29uc3QgZmVhdHVyZXMgPSBzdXBlckRlZi5mZWF0dXJlcztcbiAgICAgIGlmIChmZWF0dXJlcykge1xuICAgICAgICBmb3IgKGNvbnN0IGZlYXR1cmUgb2YgZmVhdHVyZXMpIHtcbiAgICAgICAgICBpZiAoZmVhdHVyZSAmJiBmZWF0dXJlLm5nSW5oZXJpdCkge1xuICAgICAgICAgICAgKGZlYXR1cmUgYXMgRGlyZWN0aXZlRGVmRmVhdHVyZSkoZGVmaW5pdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEV2ZW4gaWYgd2UgZG9uJ3QgaGF2ZSBhIGRlZmluaXRpb24sIGNoZWNrIHRoZSB0eXBlIGZvciB0aGUgaG9va3MgYW5kIHVzZSB0aG9zZSBpZiBuZWVkIGJlXG4gICAgICBjb25zdCBzdXBlclByb3RvdHlwZSA9IHN1cGVyVHlwZS5wcm90b3R5cGU7XG4gICAgICBpZiAoc3VwZXJQcm90b3R5cGUpIHtcbiAgICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRDaGVja2VkID1cbiAgICAgICAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50Q2hlY2tlZCB8fCBzdXBlclByb3RvdHlwZS5uZ0FmdGVyQ29udGVudENoZWNrZWQ7XG4gICAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50SW5pdCA9XG4gICAgICAgICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudEluaXQgfHwgc3VwZXJQcm90b3R5cGUubmdBZnRlckNvbnRlbnRJbml0O1xuICAgICAgICBkZWZpbml0aW9uLmFmdGVyVmlld0NoZWNrZWQgPVxuICAgICAgICAgICAgZGVmaW5pdGlvbi5hZnRlclZpZXdDaGVja2VkIHx8IHN1cGVyUHJvdG90eXBlLm5nQWZ0ZXJWaWV3Q2hlY2tlZDtcbiAgICAgICAgZGVmaW5pdGlvbi5hZnRlclZpZXdJbml0ID0gZGVmaW5pdGlvbi5hZnRlclZpZXdJbml0IHx8IHN1cGVyUHJvdG90eXBlLm5nQWZ0ZXJWaWV3SW5pdDtcbiAgICAgICAgZGVmaW5pdGlvbi5kb0NoZWNrID0gZGVmaW5pdGlvbi5kb0NoZWNrIHx8IHN1cGVyUHJvdG90eXBlLm5nRG9DaGVjaztcbiAgICAgICAgZGVmaW5pdGlvbi5vbkRlc3Ryb3kgPSBkZWZpbml0aW9uLm9uRGVzdHJveSB8fCBzdXBlclByb3RvdHlwZS5uZ09uRGVzdHJveTtcbiAgICAgICAgZGVmaW5pdGlvbi5vbkluaXQgPSBkZWZpbml0aW9uLm9uSW5pdCB8fCBzdXBlclByb3RvdHlwZS5uZ09uSW5pdDtcblxuICAgICAgICBpZiAoc3VwZXJQcm90b3R5cGUubmdPbkNoYW5nZXMpIHtcbiAgICAgICAgICDJtcm1TmdPbkNoYW5nZXNGZWF0dXJlKCkoZGVmaW5pdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBzdXBlclR5cGUgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yoc3VwZXJUeXBlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYXliZVVud3JhcEVtcHR5PFQ+KHZhbHVlOiBUW10pOiBUW107XG5mdW5jdGlvbiBtYXliZVVud3JhcEVtcHR5PFQ+KHZhbHVlOiBUKTogVDtcbmZ1bmN0aW9uIG1heWJlVW53cmFwRW1wdHkodmFsdWU6IGFueSk6IGFueSB7XG4gIGlmICh2YWx1ZSA9PT0gRU1QVFlfT0JKKSB7XG4gICAgcmV0dXJuIHt9O1xuICB9IGVsc2UgaWYgKHZhbHVlID09PSBFTVBUWV9BUlJBWSkge1xuICAgIHJldHVybiBbXTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5oZXJpdFZpZXdRdWVyeShcbiAgICBkZWZpbml0aW9uOiBEaXJlY3RpdmVEZWY8YW55PnwgQ29tcG9uZW50RGVmPGFueT4sIHN1cGVyVmlld1F1ZXJ5OiBWaWV3UXVlcmllc0Z1bmN0aW9uPGFueT4pIHtcbiAgY29uc3QgcHJldlZpZXdRdWVyeSA9IGRlZmluaXRpb24udmlld1F1ZXJ5O1xuXG4gIGlmIChwcmV2Vmlld1F1ZXJ5KSB7XG4gICAgZGVmaW5pdGlvbi52aWV3UXVlcnkgPSAocmYsIGN0eCkgPT4ge1xuICAgICAgc3VwZXJWaWV3UXVlcnkocmYsIGN0eCk7XG4gICAgICBwcmV2Vmlld1F1ZXJ5KHJmLCBjdHgpO1xuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgZGVmaW5pdGlvbi52aWV3UXVlcnkgPSBzdXBlclZpZXdRdWVyeTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbmhlcml0Q29udGVudFF1ZXJpZXMoXG4gICAgZGVmaW5pdGlvbjogRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+LFxuICAgIHN1cGVyQ29udGVudFF1ZXJpZXM6IENvbnRlbnRRdWVyaWVzRnVuY3Rpb248YW55Pikge1xuICBjb25zdCBwcmV2Q29udGVudFF1ZXJpZXMgPSBkZWZpbml0aW9uLmNvbnRlbnRRdWVyaWVzO1xuXG4gIGlmIChwcmV2Q29udGVudFF1ZXJpZXMpIHtcbiAgICBkZWZpbml0aW9uLmNvbnRlbnRRdWVyaWVzID0gKHJmLCBjdHgsIGRpcmVjdGl2ZUluZGV4KSA9PiB7XG4gICAgICBzdXBlckNvbnRlbnRRdWVyaWVzKHJmLCBjdHgsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICAgIHByZXZDb250ZW50UXVlcmllcyhyZiwgY3R4LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBkZWZpbml0aW9uLmNvbnRlbnRRdWVyaWVzID0gc3VwZXJDb250ZW50UXVlcmllcztcbiAgfVxufVxuXG5mdW5jdGlvbiBpbmhlcml0SG9zdEJpbmRpbmdzKFxuICAgIGRlZmluaXRpb246IERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55PixcbiAgICBzdXBlckhvc3RCaW5kaW5nczogSG9zdEJpbmRpbmdzRnVuY3Rpb248YW55Pikge1xuICBjb25zdCBwcmV2SG9zdEJpbmRpbmdzID0gZGVmaW5pdGlvbi5ob3N0QmluZGluZ3M7XG4gIC8vIElmIHRoZSBzdWJjbGFzcyBkb2VzIG5vdCBoYXZlIGEgaG9zdCBiaW5kaW5ncyBmdW5jdGlvbiwgd2Ugc2V0IHRoZSBzdWJjbGFzcyBob3N0IGJpbmRpbmdcbiAgLy8gZnVuY3Rpb24gdG8gYmUgdGhlIHN1cGVyY2xhc3MncyAoaW4gdGhpcyBmZWF0dXJlKS4gV2Ugc2hvdWxkIGNoZWNrIGlmIHRoZXkncmUgdGhlIHNhbWUgaGVyZVxuICAvLyB0byBlbnN1cmUgd2UgZG9uJ3QgaW5oZXJpdCBpdCB0d2ljZS5cbiAgaWYgKHN1cGVySG9zdEJpbmRpbmdzICE9PSBwcmV2SG9zdEJpbmRpbmdzKSB7XG4gICAgaWYgKHByZXZIb3N0QmluZGluZ3MpIHtcbiAgICAgIC8vIGJlY2F1c2UgaW5oZXJpdGFuY2UgaXMgdW5rbm93biBkdXJpbmcgY29tcGlsZSB0aW1lLCB0aGUgcnVudGltZSBjb2RlXG4gICAgICAvLyBuZWVkcyB0byBiZSBpbmZvcm1lZCBvZiB0aGUgc3VwZXItY2xhc3MgZGVwdGggc28gdGhhdCBpbnN0cnVjdGlvbiBjb2RlXG4gICAgICAvLyBjYW4gZGlzdGluZ3Vpc2ggb25lIGhvc3QgYmluZGluZ3MgZnVuY3Rpb24gZnJvbSBhbm90aGVyLiBUaGUgcmVhc29uIHdoeVxuICAgICAgLy8gcmVseWluZyBvbiB0aGUgZGlyZWN0aXZlIHVuaXF1ZUlkIGV4Y2x1c2l2ZWx5IGlzIG5vdCBlbm91Z2ggaXMgYmVjYXVzZSB0aGVcbiAgICAgIC8vIHVuaXF1ZUlkIHZhbHVlIGFuZCB0aGUgZGlyZWN0aXZlIGluc3RhbmNlIHN0YXkgdGhlIHNhbWUgYmV0d2VlbiBob3N0QmluZGluZ3NcbiAgICAgIC8vIGNhbGxzIHRocm91Z2hvdXQgdGhlIGRpcmVjdGl2ZSBpbmhlcml0YW5jZSBjaGFpbi4gVGhpcyBtZWFucyB0aGF0IHdpdGhvdXRcbiAgICAgIC8vIGEgc3VwZXItY2xhc3MgZGVwdGggdmFsdWUsIHRoZXJlIGlzIG5vIHdheSB0byBrbm93IHdoZXRoZXIgYSBwYXJlbnQgb3JcbiAgICAgIC8vIHN1Yi1jbGFzcyBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uIGlzIGN1cnJlbnRseSBiZWluZyBleGVjdXRlZC5cbiAgICAgIGRlZmluaXRpb24uaG9zdEJpbmRpbmdzID0gKHJmOiBSZW5kZXJGbGFncywgY3R4OiBhbnksIGVsZW1lbnRJbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgIC8vIFRoZSByZWFzb24gd2h5IHdlIGluY3JlbWVudCBmaXJzdCBhbmQgdGhlbiBkZWNyZW1lbnQgaXMgc28gdGhhdCBwYXJlbnRcbiAgICAgICAgLy8gaG9zdEJpbmRpbmdzIGNhbGxzIGhhdmUgYSBoaWdoZXIgaWQgdmFsdWUgY29tcGFyZWQgdG8gc3ViLWNsYXNzIGhvc3RCaW5kaW5nc1xuICAgICAgICAvLyBjYWxscyAodGhpcyB3YXkgdGhlIGxlYWYgZGlyZWN0aXZlIGlzIGFsd2F5cyBhdCBhIHN1cGVyLWNsYXNzIGRlcHRoIG9mIDApLlxuICAgICAgICBhZGp1c3RBY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGhQb3NpdGlvbigxKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBzdXBlckhvc3RCaW5kaW5ncyhyZiwgY3R4LCBlbGVtZW50SW5kZXgpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIGFkanVzdEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aFBvc2l0aW9uKC0xKTtcbiAgICAgICAgfVxuICAgICAgICBwcmV2SG9zdEJpbmRpbmdzKHJmLCBjdHgsIGVsZW1lbnRJbmRleCk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWZpbml0aW9uLmhvc3RCaW5kaW5ncyA9IHN1cGVySG9zdEJpbmRpbmdzO1xuICAgIH1cbiAgfVxufVxuIl19