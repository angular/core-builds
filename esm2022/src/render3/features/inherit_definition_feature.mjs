/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuntimeError } from '../../errors';
import { EMPTY_ARRAY, EMPTY_OBJ } from '../../util/empty';
import { fillProperties } from '../../util/property';
import { isComponentDef } from '../interfaces/type_checks';
import { mergeHostAttrs } from '../util/attrs_utils';
import { stringifyForError } from '../util/stringify_utils';
export function getSuperType(type) {
    return Object.getPrototypeOf(type.prototype).constructor;
}
/**
 * Merges the definition from a super class to a sub class.
 * @param definition The definition that is a SubClass of another directive of component
 *
 * @codeGenApi
 */
export function ɵɵInheritDefinitionFeature(definition) {
    let superType = getSuperType(definition.type);
    let shouldInheritFields = true;
    const inheritanceChain = [definition];
    while (superType) {
        let superDef = undefined;
        if (isComponentDef(definition)) {
            // Don't use getComponentDef/getDirectiveDef. This logic relies on inheritance.
            superDef = superType.ɵcmp || superType.ɵdir;
        }
        else {
            if (superType.ɵcmp) {
                throw new RuntimeError(903 /* RuntimeErrorCode.INVALID_INHERITANCE */, ngDevMode &&
                    `Directives cannot inherit Components. Directive ${stringifyForError(definition.type)} is attempting to extend component ${stringifyForError(superType)}`);
            }
            // Don't use getComponentDef/getDirectiveDef. This logic relies on inheritance.
            superDef = superType.ɵdir;
        }
        if (superDef) {
            if (shouldInheritFields) {
                inheritanceChain.push(superDef);
                // Some fields in the definition may be empty, if there were no values to put in them that
                // would've justified object creation. Unwrap them if necessary.
                const writeableDef = definition;
                writeableDef.inputs = maybeUnwrapEmpty(definition.inputs);
                writeableDef.inputTransforms = maybeUnwrapEmpty(definition.inputTransforms);
                writeableDef.declaredInputs = maybeUnwrapEmpty(definition.declaredInputs);
                writeableDef.outputs = maybeUnwrapEmpty(definition.outputs);
                // Merge hostBindings
                const superHostBindings = superDef.hostBindings;
                superHostBindings && inheritHostBindings(definition, superHostBindings);
                // Merge queries
                const superViewQuery = superDef.viewQuery;
                const superContentQueries = superDef.contentQueries;
                superViewQuery && inheritViewQuery(definition, superViewQuery);
                superContentQueries && inheritContentQueries(definition, superContentQueries);
                // Merge inputs and outputs
                fillProperties(definition.inputs, superDef.inputs);
                fillProperties(definition.declaredInputs, superDef.declaredInputs);
                fillProperties(definition.outputs, superDef.outputs);
                if (superDef.inputTransforms !== null) {
                    if (writeableDef.inputTransforms === null) {
                        writeableDef.inputTransforms = {};
                    }
                    fillProperties(writeableDef.inputTransforms, superDef.inputTransforms);
                }
                // Merge animations metadata.
                // If `superDef` is a Component, the `data` field is present (defaults to an empty object).
                if (isComponentDef(superDef) && superDef.data.animation) {
                    // If super def is a Component, the `definition` is also a Component, since Directives can
                    // not inherit Components (we throw an error above and cannot reach this code).
                    const defData = definition.data;
                    defData.animation = (defData.animation || []).concat(superDef.data.animation);
                }
            }
            // Run parent features
            const features = superDef.features;
            if (features) {
                for (let i = 0; i < features.length; i++) {
                    const feature = features[i];
                    if (feature && feature.ngInherit) {
                        feature(definition);
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
 * @param inheritanceChain A list of `WritableDefs` starting at the top most type and listing
 * sub-types in order. For each type take the `hostAttrs` and `hostVars` and merge it with the child
 * type.
 */
function mergeHostAttrsAcrossInheritance(inheritanceChain) {
    let hostVars = 0;
    let hostAttrs = null;
    // We process the inheritance order from the base to the leaves here.
    for (let i = inheritanceChain.length - 1; i >= 0; i--) {
        const def = inheritanceChain[i];
        // For each `hostVars`, we need to add the superclass amount.
        def.hostVars = (hostVars += def.hostVars);
        // for each `hostAttrs` we need to merge it with superclass.
        def.hostAttrs =
            mergeHostAttrs(def.hostAttrs, hostAttrs = mergeHostAttrs(hostAttrs, def.hostAttrs));
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
    const prevViewQuery = definition.viewQuery;
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
function inheritContentQueries(definition, superContentQueries) {
    const prevContentQueries = definition.contentQueries;
    if (prevContentQueries) {
        definition.contentQueries = (rf, ctx, directiveIndex) => {
            superContentQueries(rf, ctx, directiveIndex);
            prevContentQueries(rf, ctx, directiveIndex);
        };
    }
    else {
        definition.contentQueries = superContentQueries;
    }
}
function inheritHostBindings(definition, superHostBindings) {
    const prevHostBindings = definition.hostBindings;
    if (prevHostBindings) {
        definition.hostBindings = (rf, ctx) => {
            superHostBindings(rf, ctx);
            prevHostBindings(rf, ctx);
        };
    }
    else {
        definition.hostBindings = superHostBindings;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5oZXJpdF9kZWZpbml0aW9uX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL2luaGVyaXRfZGVmaW5pdGlvbl9mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sY0FBYyxDQUFDO0FBRTVELE9BQU8sRUFBQyxXQUFXLEVBQUUsU0FBUyxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDeEQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBR25ELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUN6RCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDbkQsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFFMUQsTUFBTSxVQUFVLFlBQVksQ0FBQyxJQUFlO0lBRTFDLE9BQU8sTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsV0FBVyxDQUFDO0FBQzNELENBQUM7QUFJRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSwwQkFBMEIsQ0FBQyxVQUErQztJQUN4RixJQUFJLFNBQVMsR0FBRyxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzlDLElBQUksbUJBQW1CLEdBQUcsSUFBSSxDQUFDO0lBQy9CLE1BQU0sZ0JBQWdCLEdBQWtCLENBQUMsVUFBVSxDQUFDLENBQUM7SUFFckQsT0FBTyxTQUFTLEVBQUUsQ0FBQztRQUNqQixJQUFJLFFBQVEsR0FBa0QsU0FBUyxDQUFDO1FBQ3hFLElBQUksY0FBYyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7WUFDL0IsK0VBQStFO1lBQy9FLFFBQVEsR0FBRyxTQUFTLENBQUMsSUFBSSxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUM7UUFDOUMsQ0FBQzthQUFNLENBQUM7WUFDTixJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDbkIsTUFBTSxJQUFJLFlBQVksaURBRWxCLFNBQVM7b0JBQ0wsbURBQ0ksaUJBQWlCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxzQ0FDbEMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzlDLENBQUM7WUFDRCwrRUFBK0U7WUFDL0UsUUFBUSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUM7UUFDNUIsQ0FBQztRQUVELElBQUksUUFBUSxFQUFFLENBQUM7WUFDYixJQUFJLG1CQUFtQixFQUFFLENBQUM7Z0JBQ3hCLGdCQUFnQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDaEMsMEZBQTBGO2dCQUMxRixnRUFBZ0U7Z0JBQ2hFLE1BQU0sWUFBWSxHQUFHLFVBQXlCLENBQUM7Z0JBQy9DLFlBQVksQ0FBQyxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMxRCxZQUFZLENBQUMsZUFBZSxHQUFHLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQztnQkFDNUUsWUFBWSxDQUFDLGNBQWMsR0FBRyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQzFFLFlBQVksQ0FBQyxPQUFPLEdBQUcsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUU1RCxxQkFBcUI7Z0JBQ3JCLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQztnQkFDaEQsaUJBQWlCLElBQUksbUJBQW1CLENBQUMsVUFBVSxFQUFFLGlCQUFpQixDQUFDLENBQUM7Z0JBRXhFLGdCQUFnQjtnQkFDaEIsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQztnQkFDMUMsTUFBTSxtQkFBbUIsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDO2dCQUNwRCxjQUFjLElBQUksZ0JBQWdCLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxDQUFDO2dCQUMvRCxtQkFBbUIsSUFBSSxxQkFBcUIsQ0FBQyxVQUFVLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztnQkFFOUUsMkJBQTJCO2dCQUMzQixjQUFjLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ25ELGNBQWMsQ0FBQyxVQUFVLENBQUMsY0FBYyxFQUFFLFFBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFDbkUsY0FBYyxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUVyRCxJQUFJLFFBQVEsQ0FBQyxlQUFlLEtBQUssSUFBSSxFQUFFLENBQUM7b0JBQ3RDLElBQUksWUFBWSxDQUFDLGVBQWUsS0FBSyxJQUFJLEVBQUUsQ0FBQzt3QkFDMUMsWUFBWSxDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUM7b0JBQ3BDLENBQUM7b0JBQ0QsY0FBYyxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQUUsUUFBUSxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUN6RSxDQUFDO2dCQUVELDZCQUE2QjtnQkFDN0IsMkZBQTJGO2dCQUMzRixJQUFJLGNBQWMsQ0FBQyxRQUFRLENBQUMsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUN4RCwwRkFBMEY7b0JBQzFGLCtFQUErRTtvQkFDL0UsTUFBTSxPQUFPLEdBQUksVUFBZ0MsQ0FBQyxJQUFJLENBQUM7b0JBQ3ZELE9BQU8sQ0FBQyxTQUFTLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNoRixDQUFDO1lBQ0gsQ0FBQztZQUVELHNCQUFzQjtZQUN0QixNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDO1lBQ25DLElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQ2IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDekMsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM1QixJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUM7d0JBQ2hDLE9BQStCLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQy9DLENBQUM7b0JBQ0Qsd0ZBQXdGO29CQUN4RiwwRkFBMEY7b0JBQzFGLHFGQUFxRjtvQkFDckYsZ0ZBQWdGO29CQUNoRixpRkFBaUY7b0JBQ2pGLHVGQUF1RjtvQkFDdkYsOERBQThEO29CQUM5RCxJQUFJLE9BQU8sS0FBSywwQkFBMEIsRUFBRSxDQUFDO3dCQUMzQyxtQkFBbUIsR0FBRyxLQUFLLENBQUM7b0JBQzlCLENBQUM7Z0JBQ0gsQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDO1FBRUQsU0FBUyxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUNELCtCQUErQixDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDcEQsQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILFNBQVMsK0JBQStCLENBQUMsZ0JBQStCO0lBQ3RFLElBQUksUUFBUSxHQUFXLENBQUMsQ0FBQztJQUN6QixJQUFJLFNBQVMsR0FBcUIsSUFBSSxDQUFDO0lBQ3ZDLHFFQUFxRTtJQUNyRSxLQUFLLElBQUksQ0FBQyxHQUFHLGdCQUFnQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ3RELE1BQU0sR0FBRyxHQUFHLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hDLDZEQUE2RDtRQUM3RCxHQUFHLENBQUMsUUFBUSxHQUFHLENBQUMsUUFBUSxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMxQyw0REFBNEQ7UUFDNUQsR0FBRyxDQUFDLFNBQVM7WUFDVCxjQUFjLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxTQUFTLEdBQUcsY0FBYyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUMxRixDQUFDO0FBQ0gsQ0FBQztBQUlELFNBQVMsZ0JBQWdCLENBQUMsS0FBVTtJQUNsQyxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUN4QixPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7U0FBTSxJQUFJLEtBQUssS0FBSyxXQUFXLEVBQUUsQ0FBQztRQUNqQyxPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7U0FBTSxDQUFDO1FBQ04sT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0FBQ0gsQ0FBQztBQUVELFNBQVMsZ0JBQWdCLENBQUMsVUFBdUIsRUFBRSxjQUF3QztJQUN6RixNQUFNLGFBQWEsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDO0lBQzNDLElBQUksYUFBYSxFQUFFLENBQUM7UUFDbEIsVUFBVSxDQUFDLFNBQVMsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUNqQyxjQUFjLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3hCLGFBQWEsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDekIsQ0FBQyxDQUFDO0lBQ0osQ0FBQztTQUFNLENBQUM7UUFDTixVQUFVLENBQUMsU0FBUyxHQUFHLGNBQWMsQ0FBQztJQUN4QyxDQUFDO0FBQ0gsQ0FBQztBQUVELFNBQVMscUJBQXFCLENBQzFCLFVBQXVCLEVBQUUsbUJBQWdEO0lBQzNFLE1BQU0sa0JBQWtCLEdBQUcsVUFBVSxDQUFDLGNBQWMsQ0FBQztJQUNyRCxJQUFJLGtCQUFrQixFQUFFLENBQUM7UUFDdkIsVUFBVSxDQUFDLGNBQWMsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsY0FBYyxFQUFFLEVBQUU7WUFDdEQsbUJBQW1CLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUM3QyxrQkFBa0IsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQzlDLENBQUMsQ0FBQztJQUNKLENBQUM7U0FBTSxDQUFDO1FBQ04sVUFBVSxDQUFDLGNBQWMsR0FBRyxtQkFBbUIsQ0FBQztJQUNsRCxDQUFDO0FBQ0gsQ0FBQztBQUVELFNBQVMsbUJBQW1CLENBQ3hCLFVBQXVCLEVBQUUsaUJBQTRDO0lBQ3ZFLE1BQU0sZ0JBQWdCLEdBQUcsVUFBVSxDQUFDLFlBQVksQ0FBQztJQUNqRCxJQUFJLGdCQUFnQixFQUFFLENBQUM7UUFDckIsVUFBVSxDQUFDLFlBQVksR0FBRyxDQUFDLEVBQWUsRUFBRSxHQUFRLEVBQUUsRUFBRTtZQUN0RCxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDM0IsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzVCLENBQUMsQ0FBQztJQUNKLENBQUM7U0FBTSxDQUFDO1FBQ04sVUFBVSxDQUFDLFlBQVksR0FBRyxpQkFBaUIsQ0FBQztJQUM5QyxDQUFDO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vLi4vZXJyb3JzJztcbmltcG9ydCB7VHlwZSwgV3JpdGFibGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7RU1QVFlfQVJSQVksIEVNUFRZX09CSn0gZnJvbSAnLi4vLi4vdXRpbC9lbXB0eSc7XG5pbXBvcnQge2ZpbGxQcm9wZXJ0aWVzfSBmcm9tICcuLi8uLi91dGlsL3Byb3BlcnR5JztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBDb250ZW50UXVlcmllc0Z1bmN0aW9uLCBEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkZlYXR1cmUsIEhvc3RCaW5kaW5nc0Z1bmN0aW9uLCBSZW5kZXJGbGFncywgVmlld1F1ZXJpZXNGdW5jdGlvbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VEF0dHJpYnV0ZXN9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2lzQ29tcG9uZW50RGVmfSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7bWVyZ2VIb3N0QXR0cnN9IGZyb20gJy4uL3V0aWwvYXR0cnNfdXRpbHMnO1xuaW1wb3J0IHtzdHJpbmdpZnlGb3JFcnJvcn0gZnJvbSAnLi4vdXRpbC9zdHJpbmdpZnlfdXRpbHMnO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3VwZXJUeXBlKHR5cGU6IFR5cGU8YW55Pik6IFR5cGU8YW55PiZcbiAgICB7ybVjbXA/OiBDb21wb25lbnREZWY8YW55PiwgybVkaXI/OiBEaXJlY3RpdmVEZWY8YW55Pn0ge1xuICByZXR1cm4gT2JqZWN0LmdldFByb3RvdHlwZU9mKHR5cGUucHJvdG90eXBlKS5jb25zdHJ1Y3Rvcjtcbn1cblxudHlwZSBXcml0YWJsZURlZiA9IFdyaXRhYmxlPERpcmVjdGl2ZURlZjxhbnk+fENvbXBvbmVudERlZjxhbnk+PjtcblxuLyoqXG4gKiBNZXJnZXMgdGhlIGRlZmluaXRpb24gZnJvbSBhIHN1cGVyIGNsYXNzIHRvIGEgc3ViIGNsYXNzLlxuICogQHBhcmFtIGRlZmluaXRpb24gVGhlIGRlZmluaXRpb24gdGhhdCBpcyBhIFN1YkNsYXNzIG9mIGFub3RoZXIgZGlyZWN0aXZlIG9mIGNvbXBvbmVudFxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1SW5oZXJpdERlZmluaXRpb25GZWF0dXJlKGRlZmluaXRpb246IERpcmVjdGl2ZURlZjxhbnk+fENvbXBvbmVudERlZjxhbnk+KTogdm9pZCB7XG4gIGxldCBzdXBlclR5cGUgPSBnZXRTdXBlclR5cGUoZGVmaW5pdGlvbi50eXBlKTtcbiAgbGV0IHNob3VsZEluaGVyaXRGaWVsZHMgPSB0cnVlO1xuICBjb25zdCBpbmhlcml0YW5jZUNoYWluOiBXcml0YWJsZURlZltdID0gW2RlZmluaXRpb25dO1xuXG4gIHdoaWxlIChzdXBlclR5cGUpIHtcbiAgICBsZXQgc3VwZXJEZWY6IERpcmVjdGl2ZURlZjxhbnk+fENvbXBvbmVudERlZjxhbnk+fHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICBpZiAoaXNDb21wb25lbnREZWYoZGVmaW5pdGlvbikpIHtcbiAgICAgIC8vIERvbid0IHVzZSBnZXRDb21wb25lbnREZWYvZ2V0RGlyZWN0aXZlRGVmLiBUaGlzIGxvZ2ljIHJlbGllcyBvbiBpbmhlcml0YW5jZS5cbiAgICAgIHN1cGVyRGVmID0gc3VwZXJUeXBlLsm1Y21wIHx8IHN1cGVyVHlwZS7JtWRpcjtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHN1cGVyVHlwZS7JtWNtcCkge1xuICAgICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgICAgUnVudGltZUVycm9yQ29kZS5JTlZBTElEX0lOSEVSSVRBTkNFLFxuICAgICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgICAgYERpcmVjdGl2ZXMgY2Fubm90IGluaGVyaXQgQ29tcG9uZW50cy4gRGlyZWN0aXZlICR7XG4gICAgICAgICAgICAgICAgICAgIHN0cmluZ2lmeUZvckVycm9yKGRlZmluaXRpb24udHlwZSl9IGlzIGF0dGVtcHRpbmcgdG8gZXh0ZW5kIGNvbXBvbmVudCAke1xuICAgICAgICAgICAgICAgICAgICBzdHJpbmdpZnlGb3JFcnJvcihzdXBlclR5cGUpfWApO1xuICAgICAgfVxuICAgICAgLy8gRG9uJ3QgdXNlIGdldENvbXBvbmVudERlZi9nZXREaXJlY3RpdmVEZWYuIFRoaXMgbG9naWMgcmVsaWVzIG9uIGluaGVyaXRhbmNlLlxuICAgICAgc3VwZXJEZWYgPSBzdXBlclR5cGUuybVkaXI7XG4gICAgfVxuXG4gICAgaWYgKHN1cGVyRGVmKSB7XG4gICAgICBpZiAoc2hvdWxkSW5oZXJpdEZpZWxkcykge1xuICAgICAgICBpbmhlcml0YW5jZUNoYWluLnB1c2goc3VwZXJEZWYpO1xuICAgICAgICAvLyBTb21lIGZpZWxkcyBpbiB0aGUgZGVmaW5pdGlvbiBtYXkgYmUgZW1wdHksIGlmIHRoZXJlIHdlcmUgbm8gdmFsdWVzIHRvIHB1dCBpbiB0aGVtIHRoYXRcbiAgICAgICAgLy8gd291bGQndmUganVzdGlmaWVkIG9iamVjdCBjcmVhdGlvbi4gVW53cmFwIHRoZW0gaWYgbmVjZXNzYXJ5LlxuICAgICAgICBjb25zdCB3cml0ZWFibGVEZWYgPSBkZWZpbml0aW9uIGFzIFdyaXRhYmxlRGVmO1xuICAgICAgICB3cml0ZWFibGVEZWYuaW5wdXRzID0gbWF5YmVVbndyYXBFbXB0eShkZWZpbml0aW9uLmlucHV0cyk7XG4gICAgICAgIHdyaXRlYWJsZURlZi5pbnB1dFRyYW5zZm9ybXMgPSBtYXliZVVud3JhcEVtcHR5KGRlZmluaXRpb24uaW5wdXRUcmFuc2Zvcm1zKTtcbiAgICAgICAgd3JpdGVhYmxlRGVmLmRlY2xhcmVkSW5wdXRzID0gbWF5YmVVbndyYXBFbXB0eShkZWZpbml0aW9uLmRlY2xhcmVkSW5wdXRzKTtcbiAgICAgICAgd3JpdGVhYmxlRGVmLm91dHB1dHMgPSBtYXliZVVud3JhcEVtcHR5KGRlZmluaXRpb24ub3V0cHV0cyk7XG5cbiAgICAgICAgLy8gTWVyZ2UgaG9zdEJpbmRpbmdzXG4gICAgICAgIGNvbnN0IHN1cGVySG9zdEJpbmRpbmdzID0gc3VwZXJEZWYuaG9zdEJpbmRpbmdzO1xuICAgICAgICBzdXBlckhvc3RCaW5kaW5ncyAmJiBpbmhlcml0SG9zdEJpbmRpbmdzKGRlZmluaXRpb24sIHN1cGVySG9zdEJpbmRpbmdzKTtcblxuICAgICAgICAvLyBNZXJnZSBxdWVyaWVzXG4gICAgICAgIGNvbnN0IHN1cGVyVmlld1F1ZXJ5ID0gc3VwZXJEZWYudmlld1F1ZXJ5O1xuICAgICAgICBjb25zdCBzdXBlckNvbnRlbnRRdWVyaWVzID0gc3VwZXJEZWYuY29udGVudFF1ZXJpZXM7XG4gICAgICAgIHN1cGVyVmlld1F1ZXJ5ICYmIGluaGVyaXRWaWV3UXVlcnkoZGVmaW5pdGlvbiwgc3VwZXJWaWV3UXVlcnkpO1xuICAgICAgICBzdXBlckNvbnRlbnRRdWVyaWVzICYmIGluaGVyaXRDb250ZW50UXVlcmllcyhkZWZpbml0aW9uLCBzdXBlckNvbnRlbnRRdWVyaWVzKTtcblxuICAgICAgICAvLyBNZXJnZSBpbnB1dHMgYW5kIG91dHB1dHNcbiAgICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5pbnB1dHMsIHN1cGVyRGVmLmlucHV0cyk7XG4gICAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24uZGVjbGFyZWRJbnB1dHMsIHN1cGVyRGVmLmRlY2xhcmVkSW5wdXRzKTtcbiAgICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5vdXRwdXRzLCBzdXBlckRlZi5vdXRwdXRzKTtcblxuICAgICAgICBpZiAoc3VwZXJEZWYuaW5wdXRUcmFuc2Zvcm1zICE9PSBudWxsKSB7XG4gICAgICAgICAgaWYgKHdyaXRlYWJsZURlZi5pbnB1dFRyYW5zZm9ybXMgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHdyaXRlYWJsZURlZi5pbnB1dFRyYW5zZm9ybXMgPSB7fTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZmlsbFByb3BlcnRpZXMod3JpdGVhYmxlRGVmLmlucHV0VHJhbnNmb3Jtcywgc3VwZXJEZWYuaW5wdXRUcmFuc2Zvcm1zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE1lcmdlIGFuaW1hdGlvbnMgbWV0YWRhdGEuXG4gICAgICAgIC8vIElmIGBzdXBlckRlZmAgaXMgYSBDb21wb25lbnQsIHRoZSBgZGF0YWAgZmllbGQgaXMgcHJlc2VudCAoZGVmYXVsdHMgdG8gYW4gZW1wdHkgb2JqZWN0KS5cbiAgICAgICAgaWYgKGlzQ29tcG9uZW50RGVmKHN1cGVyRGVmKSAmJiBzdXBlckRlZi5kYXRhLmFuaW1hdGlvbikge1xuICAgICAgICAgIC8vIElmIHN1cGVyIGRlZiBpcyBhIENvbXBvbmVudCwgdGhlIGBkZWZpbml0aW9uYCBpcyBhbHNvIGEgQ29tcG9uZW50LCBzaW5jZSBEaXJlY3RpdmVzIGNhblxuICAgICAgICAgIC8vIG5vdCBpbmhlcml0IENvbXBvbmVudHMgKHdlIHRocm93IGFuIGVycm9yIGFib3ZlIGFuZCBjYW5ub3QgcmVhY2ggdGhpcyBjb2RlKS5cbiAgICAgICAgICBjb25zdCBkZWZEYXRhID0gKGRlZmluaXRpb24gYXMgQ29tcG9uZW50RGVmPGFueT4pLmRhdGE7XG4gICAgICAgICAgZGVmRGF0YS5hbmltYXRpb24gPSAoZGVmRGF0YS5hbmltYXRpb24gfHwgW10pLmNvbmNhdChzdXBlckRlZi5kYXRhLmFuaW1hdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUnVuIHBhcmVudCBmZWF0dXJlc1xuICAgICAgY29uc3QgZmVhdHVyZXMgPSBzdXBlckRlZi5mZWF0dXJlcztcbiAgICAgIGlmIChmZWF0dXJlcykge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZlYXR1cmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgZmVhdHVyZSA9IGZlYXR1cmVzW2ldO1xuICAgICAgICAgIGlmIChmZWF0dXJlICYmIGZlYXR1cmUubmdJbmhlcml0KSB7XG4gICAgICAgICAgICAoZmVhdHVyZSBhcyBEaXJlY3RpdmVEZWZGZWF0dXJlKShkZWZpbml0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gSWYgYEluaGVyaXREZWZpbml0aW9uRmVhdHVyZWAgaXMgYSBwYXJ0IG9mIHRoZSBjdXJyZW50IGBzdXBlckRlZmAsIGl0IG1lYW5zIHRoYXQgdGhpc1xuICAgICAgICAgIC8vIGRlZiBhbHJlYWR5IGhhcyBhbGwgdGhlIG5lY2Vzc2FyeSBpbmZvcm1hdGlvbiBpbmhlcml0ZWQgZnJvbSBpdHMgc3VwZXIgY2xhc3MoZXMpLCBzbyB3ZVxuICAgICAgICAgIC8vIGNhbiBzdG9wIG1lcmdpbmcgZmllbGRzIGZyb20gc3VwZXIgY2xhc3Nlcy4gSG93ZXZlciB3ZSBuZWVkIHRvIGl0ZXJhdGUgdGhyb3VnaCB0aGVcbiAgICAgICAgICAvLyBwcm90b3R5cGUgY2hhaW4gdG8gbG9vayBmb3IgY2xhc3NlcyB0aGF0IG1pZ2h0IGNvbnRhaW4gb3RoZXIgXCJmZWF0dXJlc1wiIChsaWtlXG4gICAgICAgICAgLy8gTmdPbkNoYW5nZXMpLCB3aGljaCB3ZSBzaG91bGQgaW52b2tlIGZvciB0aGUgb3JpZ2luYWwgYGRlZmluaXRpb25gLiBXZSBzZXQgdGhlXG4gICAgICAgICAgLy8gYHNob3VsZEluaGVyaXRGaWVsZHNgIGZsYWcgdG8gaW5kaWNhdGUgdGhhdCwgZXNzZW50aWFsbHkgc2tpcHBpbmcgZmllbGRzIGluaGVyaXRhbmNlXG4gICAgICAgICAgLy8gbG9naWMgYW5kIG9ubHkgaW52b2tpbmcgZnVuY3Rpb25zIGZyb20gdGhlIFwiZmVhdHVyZXNcIiBsaXN0LlxuICAgICAgICAgIGlmIChmZWF0dXJlID09PSDJtcm1SW5oZXJpdERlZmluaXRpb25GZWF0dXJlKSB7XG4gICAgICAgICAgICBzaG91bGRJbmhlcml0RmllbGRzID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgc3VwZXJUeXBlID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHN1cGVyVHlwZSk7XG4gIH1cbiAgbWVyZ2VIb3N0QXR0cnNBY3Jvc3NJbmhlcml0YW5jZShpbmhlcml0YW5jZUNoYWluKTtcbn1cblxuLyoqXG4gKiBNZXJnZSB0aGUgYGhvc3RBdHRyc2AgYW5kIGBob3N0VmFyc2AgZnJvbSB0aGUgaW5oZXJpdGVkIHBhcmVudCB0byB0aGUgYmFzZSBjbGFzcy5cbiAqXG4gKiBAcGFyYW0gaW5oZXJpdGFuY2VDaGFpbiBBIGxpc3Qgb2YgYFdyaXRhYmxlRGVmc2Agc3RhcnRpbmcgYXQgdGhlIHRvcCBtb3N0IHR5cGUgYW5kIGxpc3RpbmdcbiAqIHN1Yi10eXBlcyBpbiBvcmRlci4gRm9yIGVhY2ggdHlwZSB0YWtlIHRoZSBgaG9zdEF0dHJzYCBhbmQgYGhvc3RWYXJzYCBhbmQgbWVyZ2UgaXQgd2l0aCB0aGUgY2hpbGRcbiAqIHR5cGUuXG4gKi9cbmZ1bmN0aW9uIG1lcmdlSG9zdEF0dHJzQWNyb3NzSW5oZXJpdGFuY2UoaW5oZXJpdGFuY2VDaGFpbjogV3JpdGFibGVEZWZbXSkge1xuICBsZXQgaG9zdFZhcnM6IG51bWJlciA9IDA7XG4gIGxldCBob3N0QXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwgPSBudWxsO1xuICAvLyBXZSBwcm9jZXNzIHRoZSBpbmhlcml0YW5jZSBvcmRlciBmcm9tIHRoZSBiYXNlIHRvIHRoZSBsZWF2ZXMgaGVyZS5cbiAgZm9yIChsZXQgaSA9IGluaGVyaXRhbmNlQ2hhaW4ubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBjb25zdCBkZWYgPSBpbmhlcml0YW5jZUNoYWluW2ldO1xuICAgIC8vIEZvciBlYWNoIGBob3N0VmFyc2AsIHdlIG5lZWQgdG8gYWRkIHRoZSBzdXBlcmNsYXNzIGFtb3VudC5cbiAgICBkZWYuaG9zdFZhcnMgPSAoaG9zdFZhcnMgKz0gZGVmLmhvc3RWYXJzKTtcbiAgICAvLyBmb3IgZWFjaCBgaG9zdEF0dHJzYCB3ZSBuZWVkIHRvIG1lcmdlIGl0IHdpdGggc3VwZXJjbGFzcy5cbiAgICBkZWYuaG9zdEF0dHJzID1cbiAgICAgICAgbWVyZ2VIb3N0QXR0cnMoZGVmLmhvc3RBdHRycywgaG9zdEF0dHJzID0gbWVyZ2VIb3N0QXR0cnMoaG9zdEF0dHJzLCBkZWYuaG9zdEF0dHJzKSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWF5YmVVbndyYXBFbXB0eTxUPih2YWx1ZTogVFtdKTogVFtdO1xuZnVuY3Rpb24gbWF5YmVVbndyYXBFbXB0eTxUPih2YWx1ZTogVCk6IFQ7XG5mdW5jdGlvbiBtYXliZVVud3JhcEVtcHR5KHZhbHVlOiBhbnkpOiBhbnkge1xuICBpZiAodmFsdWUgPT09IEVNUFRZX09CSikge1xuICAgIHJldHVybiB7fTtcbiAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gRU1QVFlfQVJSQVkpIHtcbiAgICByZXR1cm4gW107XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGluaGVyaXRWaWV3UXVlcnkoZGVmaW5pdGlvbjogV3JpdGFibGVEZWYsIHN1cGVyVmlld1F1ZXJ5OiBWaWV3UXVlcmllc0Z1bmN0aW9uPGFueT4pIHtcbiAgY29uc3QgcHJldlZpZXdRdWVyeSA9IGRlZmluaXRpb24udmlld1F1ZXJ5O1xuICBpZiAocHJldlZpZXdRdWVyeSkge1xuICAgIGRlZmluaXRpb24udmlld1F1ZXJ5ID0gKHJmLCBjdHgpID0+IHtcbiAgICAgIHN1cGVyVmlld1F1ZXJ5KHJmLCBjdHgpO1xuICAgICAgcHJldlZpZXdRdWVyeShyZiwgY3R4KTtcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIGRlZmluaXRpb24udmlld1F1ZXJ5ID0gc3VwZXJWaWV3UXVlcnk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5oZXJpdENvbnRlbnRRdWVyaWVzKFxuICAgIGRlZmluaXRpb246IFdyaXRhYmxlRGVmLCBzdXBlckNvbnRlbnRRdWVyaWVzOiBDb250ZW50UXVlcmllc0Z1bmN0aW9uPGFueT4pIHtcbiAgY29uc3QgcHJldkNvbnRlbnRRdWVyaWVzID0gZGVmaW5pdGlvbi5jb250ZW50UXVlcmllcztcbiAgaWYgKHByZXZDb250ZW50UXVlcmllcykge1xuICAgIGRlZmluaXRpb24uY29udGVudFF1ZXJpZXMgPSAocmYsIGN0eCwgZGlyZWN0aXZlSW5kZXgpID0+IHtcbiAgICAgIHN1cGVyQ29udGVudFF1ZXJpZXMocmYsIGN0eCwgZGlyZWN0aXZlSW5kZXgpO1xuICAgICAgcHJldkNvbnRlbnRRdWVyaWVzKHJmLCBjdHgsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIGRlZmluaXRpb24uY29udGVudFF1ZXJpZXMgPSBzdXBlckNvbnRlbnRRdWVyaWVzO1xuICB9XG59XG5cbmZ1bmN0aW9uIGluaGVyaXRIb3N0QmluZGluZ3MoXG4gICAgZGVmaW5pdGlvbjogV3JpdGFibGVEZWYsIHN1cGVySG9zdEJpbmRpbmdzOiBIb3N0QmluZGluZ3NGdW5jdGlvbjxhbnk+KSB7XG4gIGNvbnN0IHByZXZIb3N0QmluZGluZ3MgPSBkZWZpbml0aW9uLmhvc3RCaW5kaW5ncztcbiAgaWYgKHByZXZIb3N0QmluZGluZ3MpIHtcbiAgICBkZWZpbml0aW9uLmhvc3RCaW5kaW5ncyA9IChyZjogUmVuZGVyRmxhZ3MsIGN0eDogYW55KSA9PiB7XG4gICAgICBzdXBlckhvc3RCaW5kaW5ncyhyZiwgY3R4KTtcbiAgICAgIHByZXZIb3N0QmluZGluZ3MocmYsIGN0eCk7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBkZWZpbml0aW9uLmhvc3RCaW5kaW5ncyA9IHN1cGVySG9zdEJpbmRpbmdzO1xuICB9XG59XG4iXX0=