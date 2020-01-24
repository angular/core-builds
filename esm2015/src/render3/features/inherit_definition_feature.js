/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/features/inherit_definition_feature.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
import { isComponentDef } from '../interfaces/type_checks';
import { mergeHostAttrs } from '../util/attrs_utils';
/**
 * @param {?} type
 * @return {?}
 */
export function getSuperType(type) {
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
    /** @type {?} */
    let shouldInheritFields = true;
    /** @type {?} */
    const inheritanceChain = [definition];
    while (superType) {
        /** @type {?} */
        let superDef = undefined;
        if (isComponentDef(definition)) {
            // Don't use getComponentDef/getDirectiveDef. This logic relies on inheritance.
            superDef = superType.ɵcmp || superType.ɵdir;
        }
        else {
            if (superType.ɵcmp) {
                throw new Error('Directives cannot inherit Components');
            }
            // Don't use getComponentDef/getDirectiveDef. This logic relies on inheritance.
            superDef = superType.ɵdir;
        }
        if (superDef) {
            if (shouldInheritFields) {
                inheritanceChain.push(superDef);
                // Some fields in the definition may be empty, if there were no values to put in them that
                // would've justified object creation. Unwrap them if necessary.
                /** @type {?} */
                const writeableDef = (/** @type {?} */ (definition));
                writeableDef.inputs = maybeUnwrapEmpty(definition.inputs);
                writeableDef.declaredInputs = maybeUnwrapEmpty(definition.declaredInputs);
                writeableDef.outputs = maybeUnwrapEmpty(definition.outputs);
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
                writeableDef.afterContentChecked =
                    writeableDef.afterContentChecked || superDef.afterContentChecked;
                writeableDef.afterContentInit = definition.afterContentInit || superDef.afterContentInit;
                writeableDef.afterViewChecked = definition.afterViewChecked || superDef.afterViewChecked;
                writeableDef.afterViewInit = definition.afterViewInit || superDef.afterViewInit;
                writeableDef.doCheck = definition.doCheck || superDef.doCheck;
                writeableDef.onDestroy = definition.onDestroy || superDef.onDestroy;
                writeableDef.onInit = definition.onInit || superDef.onInit;
            }
            // Run parent features
            /** @type {?} */
            const features = superDef.features;
            if (features) {
                for (let i = 0; i < features.length; i++) {
                    /** @type {?} */
                    const feature = features[i];
                    if (feature && feature.ngInherit) {
                        ((/** @type {?} */ (feature)))(definition);
                    }
                    // If `InheritDefinitionFeature` is a part of the current `superDef`, it means that this
                    // def already has all the necessary information inherited from its super class(es), so we
                    // can stop merging fields from super classes. However we need to iterate through the
                    // prototype chain to look for classes that might contain other "features" (like
                    // NgOnChanges), which we should invoke for the original `definition`. We set the
                    // `shouldInheritFields` flag to indicate that, essentially skipping fields inheritance
                    // logic and only invoking functions from the "features" list.
                    if (feature === ɵɵInheritDefinitionFeature) {
                        shouldInheritFields = false;
                    }
                }
            }
        }
        superType = Object.getPrototypeOf(superType);
    }
    mergeHostAttrsAcrossInheritance(inheritanceChain);
}
/**
 * Merge the `hostAttrs` and `hostVars` from the inherited parent to the base class.
 *
 * @param {?} inheritanceChain A list of `WritableDefs` starting at the top most type and listing
 * sub-types in order. For each type take the `hostAttrs` and `hostVars` and merge it with the child
 * type.
 * @return {?}
 */
function mergeHostAttrsAcrossInheritance(inheritanceChain) {
    /** @type {?} */
    let hostVars = 0;
    /** @type {?} */
    let hostAttrs = null;
    // We process the inheritance order from the base to the leaves here.
    for (let i = inheritanceChain.length - 1; i >= 0; i--) {
        /** @type {?} */
        const def = inheritanceChain[i];
        // For each `hostVars`, we need to add the superclass amount.
        def.hostVars = (hostVars += def.hostVars);
        // for each `hostAttrs` we need to merge it with superclass.
        def.hostAttrs =
            mergeHostAttrs(def.hostAttrs, hostAttrs = mergeHostAttrs(hostAttrs, def.hostAttrs));
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
    if (prevHostBindings) {
        definition.hostBindings = (/**
         * @param {?} rf
         * @param {?} ctx
         * @param {?} elementIndex
         * @return {?}
         */
        (rf, ctx, elementIndex) => {
            superHostBindings(rf, ctx, elementIndex);
            prevHostBindings(rf, ctx, elementIndex);
        });
    }
    else {
        definition.hostBindings = superHostBindings;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5oZXJpdF9kZWZpbml0aW9uX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL2luaGVyaXRfZGVmaW5pdGlvbl9mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVVBLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNuRCxPQUFPLEVBQUMsV0FBVyxFQUFFLFNBQVMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUdoRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDekQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHFCQUFxQixDQUFDOzs7OztBQUVuRCxNQUFNLFVBQVUsWUFBWSxDQUFDLElBQWU7SUFFMUMsT0FBTyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxXQUFXLENBQUM7QUFDM0QsQ0FBQzs7Ozs7Ozs7QUFVRCxNQUFNLFVBQVUsMEJBQTBCLENBQUMsVUFBZ0Q7O1FBQ3JGLFNBQVMsR0FBRyxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQzs7UUFDekMsbUJBQW1CLEdBQUcsSUFBSTs7VUFDeEIsZ0JBQWdCLEdBQWtCLENBQUMsVUFBVSxDQUFDO0lBRXBELE9BQU8sU0FBUyxFQUFFOztZQUNaLFFBQVEsR0FBa0QsU0FBUztRQUN2RSxJQUFJLGNBQWMsQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUM5QiwrRUFBK0U7WUFDL0UsUUFBUSxHQUFHLFNBQVMsQ0FBQyxJQUFJLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQztTQUM3QzthQUFNO1lBQ0wsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFO2dCQUNsQixNQUFNLElBQUksS0FBSyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7YUFDekQ7WUFDRCwrRUFBK0U7WUFDL0Us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ZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUeXBlLCBXcml0YWJsZX0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHthc3NlcnRFcXVhbH0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtmaWxsUHJvcGVydGllc30gZnJvbSAnLi4vLi4vdXRpbC9wcm9wZXJ0eSc7XG5pbXBvcnQge0VNUFRZX0FSUkFZLCBFTVBUWV9PQkp9IGZyb20gJy4uL2VtcHR5JztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBDb250ZW50UXVlcmllc0Z1bmN0aW9uLCBEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkZlYXR1cmUsIEhvc3RCaW5kaW5nc0Z1bmN0aW9uLCBSZW5kZXJGbGFncywgVmlld1F1ZXJpZXNGdW5jdGlvbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQXR0cmlidXRlc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7aXNDb21wb25lbnREZWZ9IGZyb20gJy4uL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHttZXJnZUhvc3RBdHRyc30gZnJvbSAnLi4vdXRpbC9hdHRyc191dGlscyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTdXBlclR5cGUodHlwZTogVHlwZTxhbnk+KTogVHlwZTxhbnk+JlxuICAgIHvJtWNtcD86IENvbXBvbmVudERlZjxhbnk+LCDJtWRpcj86IERpcmVjdGl2ZURlZjxhbnk+fSB7XG4gIHJldHVybiBPYmplY3QuZ2V0UHJvdG90eXBlT2YodHlwZS5wcm90b3R5cGUpLmNvbnN0cnVjdG9yO1xufVxuXG50eXBlIFdyaXRhYmxlRGVmID0gV3JpdGFibGU8RGlyZWN0aXZlRGVmPGFueT58Q29tcG9uZW50RGVmPGFueT4+O1xuXG4vKipcbiAqIE1lcmdlcyB0aGUgZGVmaW5pdGlvbiBmcm9tIGEgc3VwZXIgY2xhc3MgdG8gYSBzdWIgY2xhc3MuXG4gKiBAcGFyYW0gZGVmaW5pdGlvbiBUaGUgZGVmaW5pdGlvbiB0aGF0IGlzIGEgU3ViQ2xhc3Mgb2YgYW5vdGhlciBkaXJlY3RpdmUgb2YgY29tcG9uZW50XG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVJbmhlcml0RGVmaW5pdGlvbkZlYXR1cmUoZGVmaW5pdGlvbjogRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+KTogdm9pZCB7XG4gIGxldCBzdXBlclR5cGUgPSBnZXRTdXBlclR5cGUoZGVmaW5pdGlvbi50eXBlKTtcbiAgbGV0IHNob3VsZEluaGVyaXRGaWVsZHMgPSB0cnVlO1xuICBjb25zdCBpbmhlcml0YW5jZUNoYWluOiBXcml0YWJsZURlZltdID0gW2RlZmluaXRpb25dO1xuXG4gIHdoaWxlIChzdXBlclR5cGUpIHtcbiAgICBsZXQgc3VwZXJEZWY6IERpcmVjdGl2ZURlZjxhbnk+fENvbXBvbmVudERlZjxhbnk+fHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICBpZiAoaXNDb21wb25lbnREZWYoZGVmaW5pdGlvbikpIHtcbiAgICAgIC8vIERvbid0IHVzZSBnZXRDb21wb25lbnREZWYvZ2V0RGlyZWN0aXZlRGVmLiBUaGlzIGxvZ2ljIHJlbGllcyBvbiBpbmhlcml0YW5jZS5cbiAgICAgIHN1cGVyRGVmID0gc3VwZXJUeXBlLsm1Y21wIHx8IHN1cGVyVHlwZS7JtWRpcjtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHN1cGVyVHlwZS7JtWNtcCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RpcmVjdGl2ZXMgY2Fubm90IGluaGVyaXQgQ29tcG9uZW50cycpO1xuICAgICAgfVxuICAgICAgLy8gRG9uJ3QgdXNlIGdldENvbXBvbmVudERlZi9nZXREaXJlY3RpdmVEZWYuIFRoaXMgbG9naWMgcmVsaWVzIG9uIGluaGVyaXRhbmNlLlxuICAgICAgc3VwZXJEZWYgPSBzdXBlclR5cGUuybVkaXI7XG4gICAgfVxuXG4gICAgaWYgKHN1cGVyRGVmKSB7XG4gICAgICBpZiAoc2hvdWxkSW5oZXJpdEZpZWxkcykge1xuICAgICAgICBpbmhlcml0YW5jZUNoYWluLnB1c2goc3VwZXJEZWYpO1xuICAgICAgICAvLyBTb21lIGZpZWxkcyBpbiB0aGUgZGVmaW5pdGlvbiBtYXkgYmUgZW1wdHksIGlmIHRoZXJlIHdlcmUgbm8gdmFsdWVzIHRvIHB1dCBpbiB0aGVtIHRoYXRcbiAgICAgICAgLy8gd291bGQndmUganVzdGlmaWVkIG9iamVjdCBjcmVhdGlvbi4gVW53cmFwIHRoZW0gaWYgbmVjZXNzYXJ5LlxuICAgICAgICBjb25zdCB3cml0ZWFibGVEZWYgPSBkZWZpbml0aW9uIGFzIFdyaXRhYmxlRGVmO1xuICAgICAgICB3cml0ZWFibGVEZWYuaW5wdXRzID0gbWF5YmVVbndyYXBFbXB0eShkZWZpbml0aW9uLmlucHV0cyk7XG4gICAgICAgIHdyaXRlYWJsZURlZi5kZWNsYXJlZElucHV0cyA9IG1heWJlVW53cmFwRW1wdHkoZGVmaW5pdGlvbi5kZWNsYXJlZElucHV0cyk7XG4gICAgICAgIHdyaXRlYWJsZURlZi5vdXRwdXRzID0gbWF5YmVVbndyYXBFbXB0eShkZWZpbml0aW9uLm91dHB1dHMpO1xuXG4gICAgICAgIC8vIE1lcmdlIGhvc3RCaW5kaW5nc1xuICAgICAgICBjb25zdCBzdXBlckhvc3RCaW5kaW5ncyA9IHN1cGVyRGVmLmhvc3RCaW5kaW5ncztcbiAgICAgICAgc3VwZXJIb3N0QmluZGluZ3MgJiYgaW5oZXJpdEhvc3RCaW5kaW5ncyhkZWZpbml0aW9uLCBzdXBlckhvc3RCaW5kaW5ncyk7XG5cbiAgICAgICAgLy8gTWVyZ2UgcXVlcmllc1xuICAgICAgICBjb25zdCBzdXBlclZpZXdRdWVyeSA9IHN1cGVyRGVmLnZpZXdRdWVyeTtcbiAgICAgICAgY29uc3Qgc3VwZXJDb250ZW50UXVlcmllcyA9IHN1cGVyRGVmLmNvbnRlbnRRdWVyaWVzO1xuICAgICAgICBzdXBlclZpZXdRdWVyeSAmJiBpbmhlcml0Vmlld1F1ZXJ5KGRlZmluaXRpb24sIHN1cGVyVmlld1F1ZXJ5KTtcbiAgICAgICAgc3VwZXJDb250ZW50UXVlcmllcyAmJiBpbmhlcml0Q29udGVudFF1ZXJpZXMoZGVmaW5pdGlvbiwgc3VwZXJDb250ZW50UXVlcmllcyk7XG5cbiAgICAgICAgLy8gTWVyZ2UgaW5wdXRzIGFuZCBvdXRwdXRzXG4gICAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24uaW5wdXRzLCBzdXBlckRlZi5pbnB1dHMpO1xuICAgICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLmRlY2xhcmVkSW5wdXRzLCBzdXBlckRlZi5kZWNsYXJlZElucHV0cyk7XG4gICAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24ub3V0cHV0cywgc3VwZXJEZWYub3V0cHV0cyk7XG5cbiAgICAgICAgLy8gSW5oZXJpdCBob29rc1xuICAgICAgICAvLyBBc3N1bWUgc3VwZXIgY2xhc3MgaW5oZXJpdGFuY2UgZmVhdHVyZSBoYXMgYWxyZWFkeSBydW4uXG4gICAgICAgIHdyaXRlYWJsZURlZi5hZnRlckNvbnRlbnRDaGVja2VkID1cbiAgICAgICAgICAgIHdyaXRlYWJsZURlZi5hZnRlckNvbnRlbnRDaGVja2VkIHx8IHN1cGVyRGVmLmFmdGVyQ29udGVudENoZWNrZWQ7XG4gICAgICAgIHdyaXRlYWJsZURlZi5hZnRlckNvbnRlbnRJbml0ID0gZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRJbml0IHx8IHN1cGVyRGVmLmFmdGVyQ29udGVudEluaXQ7XG4gICAgICAgIHdyaXRlYWJsZURlZi5hZnRlclZpZXdDaGVja2VkID0gZGVmaW5pdGlvbi5hZnRlclZpZXdDaGVja2VkIHx8IHN1cGVyRGVmLmFmdGVyVmlld0NoZWNrZWQ7XG4gICAgICAgIHdyaXRlYWJsZURlZi5hZnRlclZpZXdJbml0ID0gZGVmaW5pdGlvbi5hZnRlclZpZXdJbml0IHx8IHN1cGVyRGVmLmFmdGVyVmlld0luaXQ7XG4gICAgICAgIHdyaXRlYWJsZURlZi5kb0NoZWNrID0gZGVmaW5pdGlvbi5kb0NoZWNrIHx8IHN1cGVyRGVmLmRvQ2hlY2s7XG4gICAgICAgIHdyaXRlYWJsZURlZi5vbkRlc3Ryb3kgPSBkZWZpbml0aW9uLm9uRGVzdHJveSB8fCBzdXBlckRlZi5vbkRlc3Ryb3k7XG4gICAgICAgIHdyaXRlYWJsZURlZi5vbkluaXQgPSBkZWZpbml0aW9uLm9uSW5pdCB8fCBzdXBlckRlZi5vbkluaXQ7XG4gICAgICB9XG5cbiAgICAgIC8vIFJ1biBwYXJlbnQgZmVhdHVyZXNcbiAgICAgIGNvbnN0IGZlYXR1cmVzID0gc3VwZXJEZWYuZmVhdHVyZXM7XG4gICAgICBpZiAoZmVhdHVyZXMpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmZWF0dXJlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IGZlYXR1cmUgPSBmZWF0dXJlc1tpXTtcbiAgICAgICAgICBpZiAoZmVhdHVyZSAmJiBmZWF0dXJlLm5nSW5oZXJpdCkge1xuICAgICAgICAgICAgKGZlYXR1cmUgYXMgRGlyZWN0aXZlRGVmRmVhdHVyZSkoZGVmaW5pdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIElmIGBJbmhlcml0RGVmaW5pdGlvbkZlYXR1cmVgIGlzIGEgcGFydCBvZiB0aGUgY3VycmVudCBgc3VwZXJEZWZgLCBpdCBtZWFucyB0aGF0IHRoaXNcbiAgICAgICAgICAvLyBkZWYgYWxyZWFkeSBoYXMgYWxsIHRoZSBuZWNlc3NhcnkgaW5mb3JtYXRpb24gaW5oZXJpdGVkIGZyb20gaXRzIHN1cGVyIGNsYXNzKGVzKSwgc28gd2VcbiAgICAgICAgICAvLyBjYW4gc3RvcCBtZXJnaW5nIGZpZWxkcyBmcm9tIHN1cGVyIGNsYXNzZXMuIEhvd2V2ZXIgd2UgbmVlZCB0byBpdGVyYXRlIHRocm91Z2ggdGhlXG4gICAgICAgICAgLy8gcHJvdG90eXBlIGNoYWluIHRvIGxvb2sgZm9yIGNsYXNzZXMgdGhhdCBtaWdodCBjb250YWluIG90aGVyIFwiZmVhdHVyZXNcIiAobGlrZVxuICAgICAgICAgIC8vIE5nT25DaGFuZ2VzKSwgd2hpY2ggd2Ugc2hvdWxkIGludm9rZSBmb3IgdGhlIG9yaWdpbmFsIGBkZWZpbml0aW9uYC4gV2Ugc2V0IHRoZVxuICAgICAgICAgIC8vIGBzaG91bGRJbmhlcml0RmllbGRzYCBmbGFnIHRvIGluZGljYXRlIHRoYXQsIGVzc2VudGlhbGx5IHNraXBwaW5nIGZpZWxkcyBpbmhlcml0YW5jZVxuICAgICAgICAgIC8vIGxvZ2ljIGFuZCBvbmx5IGludm9raW5nIGZ1bmN0aW9ucyBmcm9tIHRoZSBcImZlYXR1cmVzXCIgbGlzdC5cbiAgICAgICAgICBpZiAoZmVhdHVyZSA9PT0gybXJtUluaGVyaXREZWZpbml0aW9uRmVhdHVyZSkge1xuICAgICAgICAgICAgc2hvdWxkSW5oZXJpdEZpZWxkcyA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHN1cGVyVHlwZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihzdXBlclR5cGUpO1xuICB9XG4gIG1lcmdlSG9zdEF0dHJzQWNyb3NzSW5oZXJpdGFuY2UoaW5oZXJpdGFuY2VDaGFpbik7XG59XG5cbi8qKlxuICogTWVyZ2UgdGhlIGBob3N0QXR0cnNgIGFuZCBgaG9zdFZhcnNgIGZyb20gdGhlIGluaGVyaXRlZCBwYXJlbnQgdG8gdGhlIGJhc2UgY2xhc3MuXG4gKlxuICogQHBhcmFtIGluaGVyaXRhbmNlQ2hhaW4gQSBsaXN0IG9mIGBXcml0YWJsZURlZnNgIHN0YXJ0aW5nIGF0IHRoZSB0b3AgbW9zdCB0eXBlIGFuZCBsaXN0aW5nXG4gKiBzdWItdHlwZXMgaW4gb3JkZXIuIEZvciBlYWNoIHR5cGUgdGFrZSB0aGUgYGhvc3RBdHRyc2AgYW5kIGBob3N0VmFyc2AgYW5kIG1lcmdlIGl0IHdpdGggdGhlIGNoaWxkXG4gKiB0eXBlLlxuICovXG5mdW5jdGlvbiBtZXJnZUhvc3RBdHRyc0Fjcm9zc0luaGVyaXRhbmNlKGluaGVyaXRhbmNlQ2hhaW46IFdyaXRhYmxlRGVmW10pIHtcbiAgbGV0IGhvc3RWYXJzOiBudW1iZXIgPSAwO1xuICBsZXQgaG9zdEF0dHJzOiBUQXR0cmlidXRlc3xudWxsID0gbnVsbDtcbiAgLy8gV2UgcHJvY2VzcyB0aGUgaW5oZXJpdGFuY2Ugb3JkZXIgZnJvbSB0aGUgYmFzZSB0byB0aGUgbGVhdmVzIGhlcmUuXG4gIGZvciAobGV0IGkgPSBpbmhlcml0YW5jZUNoYWluLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgY29uc3QgZGVmID0gaW5oZXJpdGFuY2VDaGFpbltpXTtcbiAgICAvLyBGb3IgZWFjaCBgaG9zdFZhcnNgLCB3ZSBuZWVkIHRvIGFkZCB0aGUgc3VwZXJjbGFzcyBhbW91bnQuXG4gICAgZGVmLmhvc3RWYXJzID0gKGhvc3RWYXJzICs9IGRlZi5ob3N0VmFycyk7XG4gICAgLy8gZm9yIGVhY2ggYGhvc3RBdHRyc2Agd2UgbmVlZCB0byBtZXJnZSBpdCB3aXRoIHN1cGVyY2xhc3MuXG4gICAgZGVmLmhvc3RBdHRycyA9XG4gICAgICAgIG1lcmdlSG9zdEF0dHJzKGRlZi5ob3N0QXR0cnMsIGhvc3RBdHRycyA9IG1lcmdlSG9zdEF0dHJzKGhvc3RBdHRycywgZGVmLmhvc3RBdHRycykpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1heWJlVW53cmFwRW1wdHk8VD4odmFsdWU6IFRbXSk6IFRbXTtcbmZ1bmN0aW9uIG1heWJlVW53cmFwRW1wdHk8VD4odmFsdWU6IFQpOiBUO1xuZnVuY3Rpb24gbWF5YmVVbndyYXBFbXB0eSh2YWx1ZTogYW55KTogYW55IHtcbiAgaWYgKHZhbHVlID09PSBFTVBUWV9PQkopIHtcbiAgICByZXR1cm4ge307XG4gIH0gZWxzZSBpZiAodmFsdWUgPT09IEVNUFRZX0FSUkFZKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbmhlcml0Vmlld1F1ZXJ5KGRlZmluaXRpb246IFdyaXRhYmxlRGVmLCBzdXBlclZpZXdRdWVyeTogVmlld1F1ZXJpZXNGdW5jdGlvbjxhbnk+KSB7XG4gIGNvbnN0IHByZXZWaWV3UXVlcnkgPSBkZWZpbml0aW9uLnZpZXdRdWVyeTtcbiAgaWYgKHByZXZWaWV3UXVlcnkpIHtcbiAgICBkZWZpbml0aW9uLnZpZXdRdWVyeSA9IChyZiwgY3R4KSA9PiB7XG4gICAgICBzdXBlclZpZXdRdWVyeShyZiwgY3R4KTtcbiAgICAgIHByZXZWaWV3UXVlcnkocmYsIGN0eCk7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBkZWZpbml0aW9uLnZpZXdRdWVyeSA9IHN1cGVyVmlld1F1ZXJ5O1xuICB9XG59XG5cbmZ1bmN0aW9uIGluaGVyaXRDb250ZW50UXVlcmllcyhcbiAgICBkZWZpbml0aW9uOiBXcml0YWJsZURlZiwgc3VwZXJDb250ZW50UXVlcmllczogQ29udGVudFF1ZXJpZXNGdW5jdGlvbjxhbnk+KSB7XG4gIGNvbnN0IHByZXZDb250ZW50UXVlcmllcyA9IGRlZmluaXRpb24uY29udGVudFF1ZXJpZXM7XG4gIGlmIChwcmV2Q29udGVudFF1ZXJpZXMpIHtcbiAgICBkZWZpbml0aW9uLmNvbnRlbnRRdWVyaWVzID0gKHJmLCBjdHgsIGRpcmVjdGl2ZUluZGV4KSA9PiB7XG4gICAgICBzdXBlckNvbnRlbnRRdWVyaWVzKHJmLCBjdHgsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICAgIHByZXZDb250ZW50UXVlcmllcyhyZiwgY3R4LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBkZWZpbml0aW9uLmNvbnRlbnRRdWVyaWVzID0gc3VwZXJDb250ZW50UXVlcmllcztcbiAgfVxufVxuXG5mdW5jdGlvbiBpbmhlcml0SG9zdEJpbmRpbmdzKFxuICAgIGRlZmluaXRpb246IFdyaXRhYmxlRGVmLCBzdXBlckhvc3RCaW5kaW5nczogSG9zdEJpbmRpbmdzRnVuY3Rpb248YW55Pikge1xuICBjb25zdCBwcmV2SG9zdEJpbmRpbmdzID0gZGVmaW5pdGlvbi5ob3N0QmluZGluZ3M7XG4gIGlmIChwcmV2SG9zdEJpbmRpbmdzKSB7XG4gICAgZGVmaW5pdGlvbi5ob3N0QmluZGluZ3MgPSAocmY6IFJlbmRlckZsYWdzLCBjdHg6IGFueSwgZWxlbWVudEluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgIHN1cGVySG9zdEJpbmRpbmdzKHJmLCBjdHgsIGVsZW1lbnRJbmRleCk7XG4gICAgICBwcmV2SG9zdEJpbmRpbmdzKHJmLCBjdHgsIGVsZW1lbnRJbmRleCk7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBkZWZpbml0aW9uLmhvc3RCaW5kaW5ncyA9IHN1cGVySG9zdEJpbmRpbmdzO1xuICB9XG59XG4iXX0=