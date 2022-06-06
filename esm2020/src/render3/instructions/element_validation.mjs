/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { formatRuntimeError, RuntimeError } from '../../errors';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '../../metadata/schema';
import { throwError } from '../../util/assert';
import { getComponentDef } from '../definition';
import { CONTEXT, DECLARATION_COMPONENT_VIEW } from '../interfaces/view';
import { isAnimationProp } from '../util/attrs_utils';
let shouldThrowErrorOnUnknownElement = false;
/**
 * Sets a strict mode for JIT-compiled components to throw an error on unknown elements,
 * instead of just logging the error.
 * (for AOT-compiled ones this check happens at build time).
 */
export function ɵsetUnknownElementStrictMode(shouldThrow) {
    shouldThrowErrorOnUnknownElement = shouldThrow;
}
/**
 * Gets the current value of the strict mode.
 */
export function ɵgetUnknownElementStrictMode() {
    return shouldThrowErrorOnUnknownElement;
}
let shouldThrowErrorOnUnknownProperty = false;
/**
 * Sets a strict mode for JIT-compiled components to throw an error on unknown properties,
 * instead of just logging the error.
 * (for AOT-compiled ones this check happens at build time).
 */
export function ɵsetUnknownPropertyStrictMode(shouldThrow) {
    shouldThrowErrorOnUnknownProperty = shouldThrow;
}
/**
 * Gets the current value of the strict mode.
 */
export function ɵgetUnknownPropertyStrictMode() {
    return shouldThrowErrorOnUnknownProperty;
}
/**
 * Validates that the element is known at runtime and produces
 * an error if it's not the case.
 * This check is relevant for JIT-compiled components (for AOT-compiled
 * ones this check happens at build time).
 *
 * The element is considered known if either:
 * - it's a known HTML element
 * - it's a known custom element
 * - the element matches any directive
 * - the element is allowed by one of the schemas
 *
 * @param element Element to validate
 * @param lView An `LView` that represents a current component that is being rendered
 * @param tagName Name of the tag to check
 * @param schemas Array of schemas
 * @param hasDirectives Boolean indicating that the element matches any directive
 */
export function validateElementIsKnown(element, lView, tagName, schemas, hasDirectives) {
    // If `schemas` is set to `null`, that's an indication that this Component was compiled in AOT
    // mode where this check happens at compile time. In JIT mode, `schemas` is always present and
    // defined as an array (as an empty array in case `schemas` field is not defined) and we should
    // execute the check below.
    if (schemas === null)
        return;
    // If the element matches any directive, it's considered as valid.
    if (!hasDirectives && tagName !== null) {
        // The element is unknown if it's an instance of HTMLUnknownElement, or it isn't registered
        // as a custom element. Note that unknown elements with a dash in their name won't be instances
        // of HTMLUnknownElement in browsers that support web components.
        const isUnknown = 
        // Note that we can't check for `typeof HTMLUnknownElement === 'function'`,
        // because while most browsers return 'function', IE returns 'object'.
        (typeof HTMLUnknownElement !== 'undefined' && HTMLUnknownElement &&
            element instanceof HTMLUnknownElement) ||
            (typeof customElements !== 'undefined' && tagName.indexOf('-') > -1 &&
                !customElements.get(tagName));
        if (isUnknown && !matchingSchemas(schemas, tagName)) {
            const isHostStandalone = isHostComponentStandalone(lView);
            const templateLocation = getTemplateLocationDetails(lView);
            const schemas = `'${isHostStandalone ? '@Component' : '@NgModule'}.schemas'`;
            let message = `'${tagName}' is not a known element${templateLocation}:\n`;
            message += `1. If '${tagName}' is an Angular component, then verify that it is ${isHostStandalone ? 'included in the \'@Component.imports\' of this component' :
                'a part of an @NgModule where this component is declared'}.\n`;
            if (tagName && tagName.indexOf('-') > -1) {
                message +=
                    `2. If '${tagName}' is a Web Component then add 'CUSTOM_ELEMENTS_SCHEMA' to the ${schemas} of this component to suppress this message.`;
            }
            else {
                message +=
                    `2. To allow any element add 'NO_ERRORS_SCHEMA' to the ${schemas} of this component.`;
            }
            if (shouldThrowErrorOnUnknownElement) {
                throw new RuntimeError(304 /* RuntimeErrorCode.UNKNOWN_ELEMENT */, message);
            }
            else {
                console.error(formatRuntimeError(304 /* RuntimeErrorCode.UNKNOWN_ELEMENT */, message));
            }
        }
    }
}
/**
 * Validates that the property of the element is known at runtime and returns
 * false if it's not the case.
 * This check is relevant for JIT-compiled components (for AOT-compiled
 * ones this check happens at build time).
 *
 * The property is considered known if either:
 * - it's a known property of the element
 * - the element is allowed by one of the schemas
 * - the property is used for animations
 *
 * @param element Element to validate
 * @param propName Name of the property to check
 * @param tagName Name of the tag hosting the property
 * @param schemas Array of schemas
 */
export function isPropertyValid(element, propName, tagName, schemas) {
    // If `schemas` is set to `null`, that's an indication that this Component was compiled in AOT
    // mode where this check happens at compile time. In JIT mode, `schemas` is always present and
    // defined as an array (as an empty array in case `schemas` field is not defined) and we should
    // execute the check below.
    if (schemas === null)
        return true;
    // The property is considered valid if the element matches the schema, it exists on the element,
    // or it is synthetic, and we are in a browser context (web worker nodes should be skipped).
    if (matchingSchemas(schemas, tagName) || propName in element || isAnimationProp(propName)) {
        return true;
    }
    // Note: `typeof Node` returns 'function' in most browsers, but on IE it is 'object' so we
    // need to account for both here, while being careful with `typeof null` also returning 'object'.
    return typeof Node === 'undefined' || Node === null || !(element instanceof Node);
}
/**
 * Logs or throws an error that a property is not supported on an element.
 *
 * @param propName Name of the invalid property
 * @param tagName Name of the tag hosting the property
 * @param nodeType Type of the node hosting the property
 * @param lView An `LView` that represents a current component
 */
export function handleUnknownPropertyError(propName, tagName, nodeType, lView) {
    // Special-case a situation when a structural directive is applied to
    // an `<ng-template>` element, for example: `<ng-template *ngIf="true">`.
    // In this case the compiler generates the `ɵɵtemplate` instruction with
    // the `null` as the tagName. The directive matching logic at runtime relies
    // on this effect (see `isInlineTemplate`), thus using the 'ng-template' as
    // a default value of the `tNode.value` is not feasible at this moment.
    if (!tagName && nodeType === 4 /* TNodeType.Container */) {
        tagName = 'ng-template';
    }
    const isHostStandalone = isHostComponentStandalone(lView);
    const templateLocation = getTemplateLocationDetails(lView);
    let message = `Can't bind to '${propName}' since it isn't a known property of '${tagName}'${templateLocation}.`;
    const schemas = `'${isHostStandalone ? '@Component' : '@NgModule'}.schemas'`;
    const importLocation = isHostStandalone ?
        'included in the \'@Component.imports\' of this component' :
        'a part of an @NgModule where this component is declared';
    if (KNOWN_CONTROL_FLOW_DIRECTIVES.has(propName)) {
        // Most likely this is a control flow directive (such as `*ngIf`) used in
        // a template, but the `CommonModule` is not imported.
        message += `\nIf the '${propName}' is an Angular control flow directive, ` +
            `please make sure that the 'CommonModule' is ${importLocation}.`;
    }
    else {
        // May be an Angular component, which is not imported/declared?
        message += `\n1. If '${tagName}' is an Angular component and it has the ` +
            `'${propName}' input, then verify that it is ${importLocation}.`;
        // May be a Web Component?
        if (tagName && tagName.indexOf('-') > -1) {
            message += `\n2. If '${tagName}' is a Web Component then add 'CUSTOM_ELEMENTS_SCHEMA' ` +
                `to the ${schemas} of this component to suppress this message.`;
            message += `\n3. To allow any property add 'NO_ERRORS_SCHEMA' to ` +
                `the ${schemas} of this component.`;
        }
        else {
            // If it's expected, the error can be suppressed by the `NO_ERRORS_SCHEMA` schema.
            message += `\n2. To allow any property add 'NO_ERRORS_SCHEMA' to ` +
                `the ${schemas} of this component.`;
        }
    }
    if (shouldThrowErrorOnUnknownProperty) {
        throw new RuntimeError(303 /* RuntimeErrorCode.UNKNOWN_BINDING */, message);
    }
    else {
        console.error(formatRuntimeError(303 /* RuntimeErrorCode.UNKNOWN_BINDING */, message));
    }
}
/**
 * WARNING: this is a **dev-mode only** function (thus should always be guarded by the `ngDevMode`)
 * and must **not** be used in production bundles. The function makes megamorphic reads, which might
 * be too slow for production mode and also it relies on the constructor function being available.
 *
 * Gets a reference to the host component def (where a current component is declared).
 *
 * @param lView An `LView` that represents a current component that is being rendered.
 */
function getDeclarationComponentDef(lView) {
    !ngDevMode && throwError('Must never be called in production mode');
    const declarationLView = lView[DECLARATION_COMPONENT_VIEW];
    const context = declarationLView[CONTEXT];
    // Unable to obtain a context.
    if (!context)
        return null;
    return context.constructor ? getComponentDef(context.constructor) : null;
}
/**
 * WARNING: this is a **dev-mode only** function (thus should always be guarded by the `ngDevMode`)
 * and must **not** be used in production bundles. The function makes megamorphic reads, which might
 * be too slow for production mode.
 *
 * Checks if the current component is declared inside of a standalone component template.
 *
 * @param lView An `LView` that represents a current component that is being rendered.
 */
export function isHostComponentStandalone(lView) {
    !ngDevMode && throwError('Must never be called in production mode');
    const componentDef = getDeclarationComponentDef(lView);
    // Treat host component as non-standalone if we can't obtain the def.
    return !!componentDef?.standalone;
}
/**
 * WARNING: this is a **dev-mode only** function (thus should always be guarded by the `ngDevMode`)
 * and must **not** be used in production bundles. The function makes megamorphic reads, which might
 * be too slow for production mode.
 *
 * Constructs a string describing the location of the host component template. The function is used
 * in dev mode to produce error messages.
 *
 * @param lView An `LView` that represents a current component that is being rendered.
 */
function getTemplateLocationDetails(lView) {
    !ngDevMode && throwError('Must never be called in production mode');
    const hostComponentDef = getDeclarationComponentDef(lView);
    const componentClassName = hostComponentDef?.type?.name;
    return componentClassName ? ` (used in the '${componentClassName}' component template)` : '';
}
/**
 * The set of known control flow directives.
 * We use this set to produce a more precises error message with a note
 * that the `CommonModule` should also be included.
 */
export const KNOWN_CONTROL_FLOW_DIRECTIVES = new Set(['ngIf', 'ngFor', 'ngSwitch', 'ngSwitchCase', 'ngSwitchDefault']);
/**
 * Returns true if the tag name is allowed by specified schemas.
 * @param schemas Array of schemas
 * @param tagName Name of the tag
 */
export function matchingSchemas(schemas, tagName) {
    if (schemas !== null) {
        for (let i = 0; i < schemas.length; i++) {
            const schema = schemas[i];
            if (schema === NO_ERRORS_SCHEMA ||
                schema === CUSTOM_ELEMENTS_SCHEMA && tagName && tagName.indexOf('-') > -1) {
                return true;
            }
        }
    }
    return false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudF92YWxpZGF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvZWxlbWVudF92YWxpZGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxZQUFZLEVBQW1CLE1BQU0sY0FBYyxDQUFDO0FBRWhGLE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxnQkFBZ0IsRUFBaUIsTUFBTSx1QkFBdUIsQ0FBQztBQUMvRixPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDN0MsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUk5QyxPQUFPLEVBQUMsT0FBTyxFQUFFLDBCQUEwQixFQUFRLE1BQU0sb0JBQW9CLENBQUM7QUFDOUUsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBRXBELElBQUksZ0NBQWdDLEdBQUcsS0FBSyxDQUFDO0FBRTdDOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsNEJBQTRCLENBQUMsV0FBb0I7SUFDL0QsZ0NBQWdDLEdBQUcsV0FBVyxDQUFDO0FBQ2pELENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sVUFBVSw0QkFBNEI7SUFDMUMsT0FBTyxnQ0FBZ0MsQ0FBQztBQUMxQyxDQUFDO0FBRUQsSUFBSSxpQ0FBaUMsR0FBRyxLQUFLLENBQUM7QUFFOUM7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSw2QkFBNkIsQ0FBQyxXQUFvQjtJQUNoRSxpQ0FBaUMsR0FBRyxXQUFXLENBQUM7QUFDbEQsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBTSxVQUFVLDZCQUE2QjtJQUMzQyxPQUFPLGlDQUFpQyxDQUFDO0FBQzNDLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFDSCxNQUFNLFVBQVUsc0JBQXNCLENBQ2xDLE9BQWlCLEVBQUUsS0FBWSxFQUFFLE9BQW9CLEVBQUUsT0FBOEIsRUFDckYsYUFBc0I7SUFDeEIsOEZBQThGO0lBQzlGLDhGQUE4RjtJQUM5RiwrRkFBK0Y7SUFDL0YsMkJBQTJCO0lBQzNCLElBQUksT0FBTyxLQUFLLElBQUk7UUFBRSxPQUFPO0lBRTdCLGtFQUFrRTtJQUNsRSxJQUFJLENBQUMsYUFBYSxJQUFJLE9BQU8sS0FBSyxJQUFJLEVBQUU7UUFDdEMsMkZBQTJGO1FBQzNGLCtGQUErRjtRQUMvRixpRUFBaUU7UUFDakUsTUFBTSxTQUFTO1FBQ1gsMkVBQTJFO1FBQzNFLHNFQUFzRTtRQUN0RSxDQUFDLE9BQU8sa0JBQWtCLEtBQUssV0FBVyxJQUFJLGtCQUFrQjtZQUMvRCxPQUFPLFlBQVksa0JBQWtCLENBQUM7WUFDdkMsQ0FBQyxPQUFPLGNBQWMsS0FBSyxXQUFXLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2xFLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBRW5DLElBQUksU0FBUyxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBRTtZQUNuRCxNQUFNLGdCQUFnQixHQUFHLHlCQUF5QixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzFELE1BQU0sZ0JBQWdCLEdBQUcsMEJBQTBCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0QsTUFBTSxPQUFPLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxXQUFXLFdBQVcsQ0FBQztZQUU3RSxJQUFJLE9BQU8sR0FBRyxJQUFJLE9BQU8sMkJBQTJCLGdCQUFnQixLQUFLLENBQUM7WUFDMUUsT0FBTyxJQUFJLFVBQVUsT0FBTyxxREFDeEIsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLDBEQUEwRCxDQUFDLENBQUM7Z0JBQzVELHlEQUF5RCxLQUFLLENBQUM7WUFDdEYsSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRTtnQkFDeEMsT0FBTztvQkFDSCxVQUFVLE9BQU8saUVBQ2IsT0FBTyw4Q0FBOEMsQ0FBQzthQUMvRDtpQkFBTTtnQkFDTCxPQUFPO29CQUNILHlEQUF5RCxPQUFPLHFCQUFxQixDQUFDO2FBQzNGO1lBQ0QsSUFBSSxnQ0FBZ0MsRUFBRTtnQkFDcEMsTUFBTSxJQUFJLFlBQVksNkNBQW1DLE9BQU8sQ0FBQyxDQUFDO2FBQ25FO2lCQUFNO2dCQUNMLE9BQU8sQ0FBQyxLQUFLLENBQUMsa0JBQWtCLDZDQUFtQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2FBQzlFO1NBQ0Y7S0FDRjtBQUNILENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7QUFDSCxNQUFNLFVBQVUsZUFBZSxDQUMzQixPQUEwQixFQUFFLFFBQWdCLEVBQUUsT0FBb0IsRUFDbEUsT0FBOEI7SUFDaEMsOEZBQThGO0lBQzlGLDhGQUE4RjtJQUM5RiwrRkFBK0Y7SUFDL0YsMkJBQTJCO0lBQzNCLElBQUksT0FBTyxLQUFLLElBQUk7UUFBRSxPQUFPLElBQUksQ0FBQztJQUVsQyxnR0FBZ0c7SUFDaEcsNEZBQTRGO0lBQzVGLElBQUksZUFBZSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsSUFBSSxRQUFRLElBQUksT0FBTyxJQUFJLGVBQWUsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUN6RixPQUFPLElBQUksQ0FBQztLQUNiO0lBRUQsMEZBQTBGO0lBQzFGLGlHQUFpRztJQUNqRyxPQUFPLE9BQU8sSUFBSSxLQUFLLFdBQVcsSUFBSSxJQUFJLEtBQUssSUFBSSxJQUFJLENBQUMsQ0FBQyxPQUFPLFlBQVksSUFBSSxDQUFDLENBQUM7QUFDcEYsQ0FBQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLFVBQVUsMEJBQTBCLENBQ3RDLFFBQWdCLEVBQUUsT0FBb0IsRUFBRSxRQUFtQixFQUFFLEtBQVk7SUFDM0UscUVBQXFFO0lBQ3JFLHlFQUF5RTtJQUN6RSx3RUFBd0U7SUFDeEUsNEVBQTRFO0lBQzVFLDJFQUEyRTtJQUMzRSx1RUFBdUU7SUFDdkUsSUFBSSxDQUFDLE9BQU8sSUFBSSxRQUFRLGdDQUF3QixFQUFFO1FBQ2hELE9BQU8sR0FBRyxhQUFhLENBQUM7S0FDekI7SUFFRCxNQUFNLGdCQUFnQixHQUFHLHlCQUF5QixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFELE1BQU0sZ0JBQWdCLEdBQUcsMEJBQTBCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFM0QsSUFBSSxPQUFPLEdBQUcsa0JBQWtCLFFBQVEseUNBQXlDLE9BQU8sSUFDcEYsZ0JBQWdCLEdBQUcsQ0FBQztJQUV4QixNQUFNLE9BQU8sR0FBRyxJQUFJLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLFdBQVcsV0FBVyxDQUFDO0lBQzdFLE1BQU0sY0FBYyxHQUFHLGdCQUFnQixDQUFDLENBQUM7UUFDckMsMERBQTBELENBQUMsQ0FBQztRQUM1RCx5REFBeUQsQ0FBQztJQUM5RCxJQUFJLDZCQUE2QixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUMvQyx5RUFBeUU7UUFDekUsc0RBQXNEO1FBQ3RELE9BQU8sSUFBSSxhQUFhLFFBQVEsMENBQTBDO1lBQ3RFLCtDQUErQyxjQUFjLEdBQUcsQ0FBQztLQUN0RTtTQUFNO1FBQ0wsK0RBQStEO1FBQy9ELE9BQU8sSUFBSSxZQUFZLE9BQU8sMkNBQTJDO1lBQ3JFLElBQUksUUFBUSxtQ0FBbUMsY0FBYyxHQUFHLENBQUM7UUFDckUsMEJBQTBCO1FBQzFCLElBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7WUFDeEMsT0FBTyxJQUFJLFlBQVksT0FBTyx5REFBeUQ7Z0JBQ25GLFVBQVUsT0FBTyw4Q0FBOEMsQ0FBQztZQUNwRSxPQUFPLElBQUksdURBQXVEO2dCQUM5RCxPQUFPLE9BQU8scUJBQXFCLENBQUM7U0FDekM7YUFBTTtZQUNMLGtGQUFrRjtZQUNsRixPQUFPLElBQUksdURBQXVEO2dCQUM5RCxPQUFPLE9BQU8scUJBQXFCLENBQUM7U0FDekM7S0FDRjtJQUVELElBQUksaUNBQWlDLEVBQUU7UUFDckMsTUFBTSxJQUFJLFlBQVksNkNBQW1DLE9BQU8sQ0FBQyxDQUFDO0tBQ25FO1NBQU07UUFDTCxPQUFPLENBQUMsS0FBSyxDQUFDLGtCQUFrQiw2Q0FBbUMsT0FBTyxDQUFDLENBQUMsQ0FBQztLQUM5RTtBQUNILENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILFNBQVMsMEJBQTBCLENBQUMsS0FBWTtJQUM5QyxDQUFDLFNBQVMsSUFBSSxVQUFVLENBQUMseUNBQXlDLENBQUMsQ0FBQztJQUVwRSxNQUFNLGdCQUFnQixHQUFHLEtBQUssQ0FBQywwQkFBMEIsQ0FBeUIsQ0FBQztJQUNuRixNQUFNLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUUxQyw4QkFBOEI7SUFDOUIsSUFBSSxDQUFDLE9BQU87UUFBRSxPQUFPLElBQUksQ0FBQztJQUUxQixPQUFPLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUMzRSxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLFVBQVUseUJBQXlCLENBQUMsS0FBWTtJQUNwRCxDQUFDLFNBQVMsSUFBSSxVQUFVLENBQUMseUNBQXlDLENBQUMsQ0FBQztJQUVwRSxNQUFNLFlBQVksR0FBRywwQkFBMEIsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN2RCxxRUFBcUU7SUFDckUsT0FBTyxDQUFDLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQztBQUNwQyxDQUFDO0FBRUQ7Ozs7Ozs7OztHQVNHO0FBQ0gsU0FBUywwQkFBMEIsQ0FBQyxLQUFZO0lBQzlDLENBQUMsU0FBUyxJQUFJLFVBQVUsQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO0lBRXBFLE1BQU0sZ0JBQWdCLEdBQUcsMEJBQTBCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0QsTUFBTSxrQkFBa0IsR0FBRyxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDO0lBQ3hELE9BQU8sa0JBQWtCLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixrQkFBa0IsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUMvRixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILE1BQU0sQ0FBQyxNQUFNLDZCQUE2QixHQUN0QyxJQUFJLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7QUFFOUU7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxlQUFlLENBQUMsT0FBOEIsRUFBRSxPQUFvQjtJQUNsRixJQUFJLE9BQU8sS0FBSyxJQUFJLEVBQUU7UUFDcEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDdkMsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFCLElBQUksTUFBTSxLQUFLLGdCQUFnQjtnQkFDM0IsTUFBTSxLQUFLLHNCQUFzQixJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO2dCQUM3RSxPQUFPLElBQUksQ0FBQzthQUNiO1NBQ0Y7S0FDRjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Zvcm1hdFJ1bnRpbWVFcnJvciwgUnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi8uLi9lcnJvcnMnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0NVU1RPTV9FTEVNRU5UU19TQ0hFTUEsIE5PX0VSUk9SU19TQ0hFTUEsIFNjaGVtYU1ldGFkYXRhfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9zY2hlbWEnO1xuaW1wb3J0IHt0aHJvd0Vycm9yfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZn0gZnJvbSAnLi4vZGVmaW5pdGlvbic7XG5pbXBvcnQge0NvbXBvbmVudERlZn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7Q09OVEVYVCwgREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVcsIExWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtpc0FuaW1hdGlvblByb3B9IGZyb20gJy4uL3V0aWwvYXR0cnNfdXRpbHMnO1xuXG5sZXQgc2hvdWxkVGhyb3dFcnJvck9uVW5rbm93bkVsZW1lbnQgPSBmYWxzZTtcblxuLyoqXG4gKiBTZXRzIGEgc3RyaWN0IG1vZGUgZm9yIEpJVC1jb21waWxlZCBjb21wb25lbnRzIHRvIHRocm93IGFuIGVycm9yIG9uIHVua25vd24gZWxlbWVudHMsXG4gKiBpbnN0ZWFkIG9mIGp1c3QgbG9nZ2luZyB0aGUgZXJyb3IuXG4gKiAoZm9yIEFPVC1jb21waWxlZCBvbmVzIHRoaXMgY2hlY2sgaGFwcGVucyBhdCBidWlsZCB0aW1lKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1c2V0VW5rbm93bkVsZW1lbnRTdHJpY3RNb2RlKHNob3VsZFRocm93OiBib29sZWFuKSB7XG4gIHNob3VsZFRocm93RXJyb3JPblVua25vd25FbGVtZW50ID0gc2hvdWxkVGhyb3c7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgY3VycmVudCB2YWx1ZSBvZiB0aGUgc3RyaWN0IG1vZGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtWdldFVua25vd25FbGVtZW50U3RyaWN0TW9kZSgpIHtcbiAgcmV0dXJuIHNob3VsZFRocm93RXJyb3JPblVua25vd25FbGVtZW50O1xufVxuXG5sZXQgc2hvdWxkVGhyb3dFcnJvck9uVW5rbm93blByb3BlcnR5ID0gZmFsc2U7XG5cbi8qKlxuICogU2V0cyBhIHN0cmljdCBtb2RlIGZvciBKSVQtY29tcGlsZWQgY29tcG9uZW50cyB0byB0aHJvdyBhbiBlcnJvciBvbiB1bmtub3duIHByb3BlcnRpZXMsXG4gKiBpbnN0ZWFkIG9mIGp1c3QgbG9nZ2luZyB0aGUgZXJyb3IuXG4gKiAoZm9yIEFPVC1jb21waWxlZCBvbmVzIHRoaXMgY2hlY2sgaGFwcGVucyBhdCBidWlsZCB0aW1lKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1c2V0VW5rbm93blByb3BlcnR5U3RyaWN0TW9kZShzaG91bGRUaHJvdzogYm9vbGVhbikge1xuICBzaG91bGRUaHJvd0Vycm9yT25Vbmtub3duUHJvcGVydHkgPSBzaG91bGRUaHJvdztcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBjdXJyZW50IHZhbHVlIG9mIHRoZSBzdHJpY3QgbW9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1Z2V0VW5rbm93blByb3BlcnR5U3RyaWN0TW9kZSgpIHtcbiAgcmV0dXJuIHNob3VsZFRocm93RXJyb3JPblVua25vd25Qcm9wZXJ0eTtcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCB0aGUgZWxlbWVudCBpcyBrbm93biBhdCBydW50aW1lIGFuZCBwcm9kdWNlc1xuICogYW4gZXJyb3IgaWYgaXQncyBub3QgdGhlIGNhc2UuXG4gKiBUaGlzIGNoZWNrIGlzIHJlbGV2YW50IGZvciBKSVQtY29tcGlsZWQgY29tcG9uZW50cyAoZm9yIEFPVC1jb21waWxlZFxuICogb25lcyB0aGlzIGNoZWNrIGhhcHBlbnMgYXQgYnVpbGQgdGltZSkuXG4gKlxuICogVGhlIGVsZW1lbnQgaXMgY29uc2lkZXJlZCBrbm93biBpZiBlaXRoZXI6XG4gKiAtIGl0J3MgYSBrbm93biBIVE1MIGVsZW1lbnRcbiAqIC0gaXQncyBhIGtub3duIGN1c3RvbSBlbGVtZW50XG4gKiAtIHRoZSBlbGVtZW50IG1hdGNoZXMgYW55IGRpcmVjdGl2ZVxuICogLSB0aGUgZWxlbWVudCBpcyBhbGxvd2VkIGJ5IG9uZSBvZiB0aGUgc2NoZW1hc1xuICpcbiAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgdG8gdmFsaWRhdGVcbiAqIEBwYXJhbSBsVmlldyBBbiBgTFZpZXdgIHRoYXQgcmVwcmVzZW50cyBhIGN1cnJlbnQgY29tcG9uZW50IHRoYXQgaXMgYmVpbmcgcmVuZGVyZWRcbiAqIEBwYXJhbSB0YWdOYW1lIE5hbWUgb2YgdGhlIHRhZyB0byBjaGVja1xuICogQHBhcmFtIHNjaGVtYXMgQXJyYXkgb2Ygc2NoZW1hc1xuICogQHBhcmFtIGhhc0RpcmVjdGl2ZXMgQm9vbGVhbiBpbmRpY2F0aW5nIHRoYXQgdGhlIGVsZW1lbnQgbWF0Y2hlcyBhbnkgZGlyZWN0aXZlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUVsZW1lbnRJc0tub3duKFxuICAgIGVsZW1lbnQ6IFJFbGVtZW50LCBsVmlldzogTFZpZXcsIHRhZ05hbWU6IHN0cmluZ3xudWxsLCBzY2hlbWFzOiBTY2hlbWFNZXRhZGF0YVtdfG51bGwsXG4gICAgaGFzRGlyZWN0aXZlczogYm9vbGVhbik6IHZvaWQge1xuICAvLyBJZiBgc2NoZW1hc2AgaXMgc2V0IHRvIGBudWxsYCwgdGhhdCdzIGFuIGluZGljYXRpb24gdGhhdCB0aGlzIENvbXBvbmVudCB3YXMgY29tcGlsZWQgaW4gQU9UXG4gIC8vIG1vZGUgd2hlcmUgdGhpcyBjaGVjayBoYXBwZW5zIGF0IGNvbXBpbGUgdGltZS4gSW4gSklUIG1vZGUsIGBzY2hlbWFzYCBpcyBhbHdheXMgcHJlc2VudCBhbmRcbiAgLy8gZGVmaW5lZCBhcyBhbiBhcnJheSAoYXMgYW4gZW1wdHkgYXJyYXkgaW4gY2FzZSBgc2NoZW1hc2AgZmllbGQgaXMgbm90IGRlZmluZWQpIGFuZCB3ZSBzaG91bGRcbiAgLy8gZXhlY3V0ZSB0aGUgY2hlY2sgYmVsb3cuXG4gIGlmIChzY2hlbWFzID09PSBudWxsKSByZXR1cm47XG5cbiAgLy8gSWYgdGhlIGVsZW1lbnQgbWF0Y2hlcyBhbnkgZGlyZWN0aXZlLCBpdCdzIGNvbnNpZGVyZWQgYXMgdmFsaWQuXG4gIGlmICghaGFzRGlyZWN0aXZlcyAmJiB0YWdOYW1lICE9PSBudWxsKSB7XG4gICAgLy8gVGhlIGVsZW1lbnQgaXMgdW5rbm93biBpZiBpdCdzIGFuIGluc3RhbmNlIG9mIEhUTUxVbmtub3duRWxlbWVudCwgb3IgaXQgaXNuJ3QgcmVnaXN0ZXJlZFxuICAgIC8vIGFzIGEgY3VzdG9tIGVsZW1lbnQuIE5vdGUgdGhhdCB1bmtub3duIGVsZW1lbnRzIHdpdGggYSBkYXNoIGluIHRoZWlyIG5hbWUgd29uJ3QgYmUgaW5zdGFuY2VzXG4gICAgLy8gb2YgSFRNTFVua25vd25FbGVtZW50IGluIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCB3ZWIgY29tcG9uZW50cy5cbiAgICBjb25zdCBpc1Vua25vd24gPVxuICAgICAgICAvLyBOb3RlIHRoYXQgd2UgY2FuJ3QgY2hlY2sgZm9yIGB0eXBlb2YgSFRNTFVua25vd25FbGVtZW50ID09PSAnZnVuY3Rpb24nYCxcbiAgICAgICAgLy8gYmVjYXVzZSB3aGlsZSBtb3N0IGJyb3dzZXJzIHJldHVybiAnZnVuY3Rpb24nLCBJRSByZXR1cm5zICdvYmplY3QnLlxuICAgICAgICAodHlwZW9mIEhUTUxVbmtub3duRWxlbWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgSFRNTFVua25vd25FbGVtZW50ICYmXG4gICAgICAgICBlbGVtZW50IGluc3RhbmNlb2YgSFRNTFVua25vd25FbGVtZW50KSB8fFxuICAgICAgICAodHlwZW9mIGN1c3RvbUVsZW1lbnRzICE9PSAndW5kZWZpbmVkJyAmJiB0YWdOYW1lLmluZGV4T2YoJy0nKSA+IC0xICYmXG4gICAgICAgICAhY3VzdG9tRWxlbWVudHMuZ2V0KHRhZ05hbWUpKTtcblxuICAgIGlmIChpc1Vua25vd24gJiYgIW1hdGNoaW5nU2NoZW1hcyhzY2hlbWFzLCB0YWdOYW1lKSkge1xuICAgICAgY29uc3QgaXNIb3N0U3RhbmRhbG9uZSA9IGlzSG9zdENvbXBvbmVudFN0YW5kYWxvbmUobFZpZXcpO1xuICAgICAgY29uc3QgdGVtcGxhdGVMb2NhdGlvbiA9IGdldFRlbXBsYXRlTG9jYXRpb25EZXRhaWxzKGxWaWV3KTtcbiAgICAgIGNvbnN0IHNjaGVtYXMgPSBgJyR7aXNIb3N0U3RhbmRhbG9uZSA/ICdAQ29tcG9uZW50JyA6ICdATmdNb2R1bGUnfS5zY2hlbWFzJ2A7XG5cbiAgICAgIGxldCBtZXNzYWdlID0gYCcke3RhZ05hbWV9JyBpcyBub3QgYSBrbm93biBlbGVtZW50JHt0ZW1wbGF0ZUxvY2F0aW9ufTpcXG5gO1xuICAgICAgbWVzc2FnZSArPSBgMS4gSWYgJyR7dGFnTmFtZX0nIGlzIGFuIEFuZ3VsYXIgY29tcG9uZW50LCB0aGVuIHZlcmlmeSB0aGF0IGl0IGlzICR7XG4gICAgICAgICAgaXNIb3N0U3RhbmRhbG9uZSA/ICdpbmNsdWRlZCBpbiB0aGUgXFwnQENvbXBvbmVudC5pbXBvcnRzXFwnIG9mIHRoaXMgY29tcG9uZW50JyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICdhIHBhcnQgb2YgYW4gQE5nTW9kdWxlIHdoZXJlIHRoaXMgY29tcG9uZW50IGlzIGRlY2xhcmVkJ30uXFxuYDtcbiAgICAgIGlmICh0YWdOYW1lICYmIHRhZ05hbWUuaW5kZXhPZignLScpID4gLTEpIHtcbiAgICAgICAgbWVzc2FnZSArPVxuICAgICAgICAgICAgYDIuIElmICcke3RhZ05hbWV9JyBpcyBhIFdlYiBDb21wb25lbnQgdGhlbiBhZGQgJ0NVU1RPTV9FTEVNRU5UU19TQ0hFTUEnIHRvIHRoZSAke1xuICAgICAgICAgICAgICAgIHNjaGVtYXN9IG9mIHRoaXMgY29tcG9uZW50IHRvIHN1cHByZXNzIHRoaXMgbWVzc2FnZS5gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZSArPVxuICAgICAgICAgICAgYDIuIFRvIGFsbG93IGFueSBlbGVtZW50IGFkZCAnTk9fRVJST1JTX1NDSEVNQScgdG8gdGhlICR7c2NoZW1hc30gb2YgdGhpcyBjb21wb25lbnQuYDtcbiAgICAgIH1cbiAgICAgIGlmIChzaG91bGRUaHJvd0Vycm9yT25Vbmtub3duRWxlbWVudCkge1xuICAgICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFJ1bnRpbWVFcnJvckNvZGUuVU5LTk9XTl9FTEVNRU5ULCBtZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZm9ybWF0UnVudGltZUVycm9yKFJ1bnRpbWVFcnJvckNvZGUuVU5LTk9XTl9FTEVNRU5ULCBtZXNzYWdlKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgdGhlIHByb3BlcnR5IG9mIHRoZSBlbGVtZW50IGlzIGtub3duIGF0IHJ1bnRpbWUgYW5kIHJldHVybnNcbiAqIGZhbHNlIGlmIGl0J3Mgbm90IHRoZSBjYXNlLlxuICogVGhpcyBjaGVjayBpcyByZWxldmFudCBmb3IgSklULWNvbXBpbGVkIGNvbXBvbmVudHMgKGZvciBBT1QtY29tcGlsZWRcbiAqIG9uZXMgdGhpcyBjaGVjayBoYXBwZW5zIGF0IGJ1aWxkIHRpbWUpLlxuICpcbiAqIFRoZSBwcm9wZXJ0eSBpcyBjb25zaWRlcmVkIGtub3duIGlmIGVpdGhlcjpcbiAqIC0gaXQncyBhIGtub3duIHByb3BlcnR5IG9mIHRoZSBlbGVtZW50XG4gKiAtIHRoZSBlbGVtZW50IGlzIGFsbG93ZWQgYnkgb25lIG9mIHRoZSBzY2hlbWFzXG4gKiAtIHRoZSBwcm9wZXJ0eSBpcyB1c2VkIGZvciBhbmltYXRpb25zXG4gKlxuICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB0byB2YWxpZGF0ZVxuICogQHBhcmFtIHByb3BOYW1lIE5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIGNoZWNrXG4gKiBAcGFyYW0gdGFnTmFtZSBOYW1lIG9mIHRoZSB0YWcgaG9zdGluZyB0aGUgcHJvcGVydHlcbiAqIEBwYXJhbSBzY2hlbWFzIEFycmF5IG9mIHNjaGVtYXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUHJvcGVydHlWYWxpZChcbiAgICBlbGVtZW50OiBSRWxlbWVudHxSQ29tbWVudCwgcHJvcE5hbWU6IHN0cmluZywgdGFnTmFtZTogc3RyaW5nfG51bGwsXG4gICAgc2NoZW1hczogU2NoZW1hTWV0YWRhdGFbXXxudWxsKTogYm9vbGVhbiB7XG4gIC8vIElmIGBzY2hlbWFzYCBpcyBzZXQgdG8gYG51bGxgLCB0aGF0J3MgYW4gaW5kaWNhdGlvbiB0aGF0IHRoaXMgQ29tcG9uZW50IHdhcyBjb21waWxlZCBpbiBBT1RcbiAgLy8gbW9kZSB3aGVyZSB0aGlzIGNoZWNrIGhhcHBlbnMgYXQgY29tcGlsZSB0aW1lLiBJbiBKSVQgbW9kZSwgYHNjaGVtYXNgIGlzIGFsd2F5cyBwcmVzZW50IGFuZFxuICAvLyBkZWZpbmVkIGFzIGFuIGFycmF5IChhcyBhbiBlbXB0eSBhcnJheSBpbiBjYXNlIGBzY2hlbWFzYCBmaWVsZCBpcyBub3QgZGVmaW5lZCkgYW5kIHdlIHNob3VsZFxuICAvLyBleGVjdXRlIHRoZSBjaGVjayBiZWxvdy5cbiAgaWYgKHNjaGVtYXMgPT09IG51bGwpIHJldHVybiB0cnVlO1xuXG4gIC8vIFRoZSBwcm9wZXJ0eSBpcyBjb25zaWRlcmVkIHZhbGlkIGlmIHRoZSBlbGVtZW50IG1hdGNoZXMgdGhlIHNjaGVtYSwgaXQgZXhpc3RzIG9uIHRoZSBlbGVtZW50LFxuICAvLyBvciBpdCBpcyBzeW50aGV0aWMsIGFuZCB3ZSBhcmUgaW4gYSBicm93c2VyIGNvbnRleHQgKHdlYiB3b3JrZXIgbm9kZXMgc2hvdWxkIGJlIHNraXBwZWQpLlxuICBpZiAobWF0Y2hpbmdTY2hlbWFzKHNjaGVtYXMsIHRhZ05hbWUpIHx8IHByb3BOYW1lIGluIGVsZW1lbnQgfHwgaXNBbmltYXRpb25Qcm9wKHByb3BOYW1lKSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gTm90ZTogYHR5cGVvZiBOb2RlYCByZXR1cm5zICdmdW5jdGlvbicgaW4gbW9zdCBicm93c2VycywgYnV0IG9uIElFIGl0IGlzICdvYmplY3QnIHNvIHdlXG4gIC8vIG5lZWQgdG8gYWNjb3VudCBmb3IgYm90aCBoZXJlLCB3aGlsZSBiZWluZyBjYXJlZnVsIHdpdGggYHR5cGVvZiBudWxsYCBhbHNvIHJldHVybmluZyAnb2JqZWN0Jy5cbiAgcmV0dXJuIHR5cGVvZiBOb2RlID09PSAndW5kZWZpbmVkJyB8fCBOb2RlID09PSBudWxsIHx8ICEoZWxlbWVudCBpbnN0YW5jZW9mIE5vZGUpO1xufVxuXG4vKipcbiAqIExvZ3Mgb3IgdGhyb3dzIGFuIGVycm9yIHRoYXQgYSBwcm9wZXJ0eSBpcyBub3Qgc3VwcG9ydGVkIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogQHBhcmFtIHByb3BOYW1lIE5hbWUgb2YgdGhlIGludmFsaWQgcHJvcGVydHlcbiAqIEBwYXJhbSB0YWdOYW1lIE5hbWUgb2YgdGhlIHRhZyBob3N0aW5nIHRoZSBwcm9wZXJ0eVxuICogQHBhcmFtIG5vZGVUeXBlIFR5cGUgb2YgdGhlIG5vZGUgaG9zdGluZyB0aGUgcHJvcGVydHlcbiAqIEBwYXJhbSBsVmlldyBBbiBgTFZpZXdgIHRoYXQgcmVwcmVzZW50cyBhIGN1cnJlbnQgY29tcG9uZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVVbmtub3duUHJvcGVydHlFcnJvcihcbiAgICBwcm9wTmFtZTogc3RyaW5nLCB0YWdOYW1lOiBzdHJpbmd8bnVsbCwgbm9kZVR5cGU6IFROb2RlVHlwZSwgbFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIC8vIFNwZWNpYWwtY2FzZSBhIHNpdHVhdGlvbiB3aGVuIGEgc3RydWN0dXJhbCBkaXJlY3RpdmUgaXMgYXBwbGllZCB0b1xuICAvLyBhbiBgPG5nLXRlbXBsYXRlPmAgZWxlbWVudCwgZm9yIGV4YW1wbGU6IGA8bmctdGVtcGxhdGUgKm5nSWY9XCJ0cnVlXCI+YC5cbiAgLy8gSW4gdGhpcyBjYXNlIHRoZSBjb21waWxlciBnZW5lcmF0ZXMgdGhlIGDJtcm1dGVtcGxhdGVgIGluc3RydWN0aW9uIHdpdGhcbiAgLy8gdGhlIGBudWxsYCBhcyB0aGUgdGFnTmFtZS4gVGhlIGRpcmVjdGl2ZSBtYXRjaGluZyBsb2dpYyBhdCBydW50aW1lIHJlbGllc1xuICAvLyBvbiB0aGlzIGVmZmVjdCAoc2VlIGBpc0lubGluZVRlbXBsYXRlYCksIHRodXMgdXNpbmcgdGhlICduZy10ZW1wbGF0ZScgYXNcbiAgLy8gYSBkZWZhdWx0IHZhbHVlIG9mIHRoZSBgdE5vZGUudmFsdWVgIGlzIG5vdCBmZWFzaWJsZSBhdCB0aGlzIG1vbWVudC5cbiAgaWYgKCF0YWdOYW1lICYmIG5vZGVUeXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgdGFnTmFtZSA9ICduZy10ZW1wbGF0ZSc7XG4gIH1cblxuICBjb25zdCBpc0hvc3RTdGFuZGFsb25lID0gaXNIb3N0Q29tcG9uZW50U3RhbmRhbG9uZShsVmlldyk7XG4gIGNvbnN0IHRlbXBsYXRlTG9jYXRpb24gPSBnZXRUZW1wbGF0ZUxvY2F0aW9uRGV0YWlscyhsVmlldyk7XG5cbiAgbGV0IG1lc3NhZ2UgPSBgQ2FuJ3QgYmluZCB0byAnJHtwcm9wTmFtZX0nIHNpbmNlIGl0IGlzbid0IGEga25vd24gcHJvcGVydHkgb2YgJyR7dGFnTmFtZX0nJHtcbiAgICAgIHRlbXBsYXRlTG9jYXRpb259LmA7XG5cbiAgY29uc3Qgc2NoZW1hcyA9IGAnJHtpc0hvc3RTdGFuZGFsb25lID8gJ0BDb21wb25lbnQnIDogJ0BOZ01vZHVsZSd9LnNjaGVtYXMnYDtcbiAgY29uc3QgaW1wb3J0TG9jYXRpb24gPSBpc0hvc3RTdGFuZGFsb25lID9cbiAgICAgICdpbmNsdWRlZCBpbiB0aGUgXFwnQENvbXBvbmVudC5pbXBvcnRzXFwnIG9mIHRoaXMgY29tcG9uZW50JyA6XG4gICAgICAnYSBwYXJ0IG9mIGFuIEBOZ01vZHVsZSB3aGVyZSB0aGlzIGNvbXBvbmVudCBpcyBkZWNsYXJlZCc7XG4gIGlmIChLTk9XTl9DT05UUk9MX0ZMT1dfRElSRUNUSVZFUy5oYXMocHJvcE5hbWUpKSB7XG4gICAgLy8gTW9zdCBsaWtlbHkgdGhpcyBpcyBhIGNvbnRyb2wgZmxvdyBkaXJlY3RpdmUgKHN1Y2ggYXMgYCpuZ0lmYCkgdXNlZCBpblxuICAgIC8vIGEgdGVtcGxhdGUsIGJ1dCB0aGUgYENvbW1vbk1vZHVsZWAgaXMgbm90IGltcG9ydGVkLlxuICAgIG1lc3NhZ2UgKz0gYFxcbklmIHRoZSAnJHtwcm9wTmFtZX0nIGlzIGFuIEFuZ3VsYXIgY29udHJvbCBmbG93IGRpcmVjdGl2ZSwgYCArXG4gICAgICAgIGBwbGVhc2UgbWFrZSBzdXJlIHRoYXQgdGhlICdDb21tb25Nb2R1bGUnIGlzICR7aW1wb3J0TG9jYXRpb259LmA7XG4gIH0gZWxzZSB7XG4gICAgLy8gTWF5IGJlIGFuIEFuZ3VsYXIgY29tcG9uZW50LCB3aGljaCBpcyBub3QgaW1wb3J0ZWQvZGVjbGFyZWQ/XG4gICAgbWVzc2FnZSArPSBgXFxuMS4gSWYgJyR7dGFnTmFtZX0nIGlzIGFuIEFuZ3VsYXIgY29tcG9uZW50IGFuZCBpdCBoYXMgdGhlIGAgK1xuICAgICAgICBgJyR7cHJvcE5hbWV9JyBpbnB1dCwgdGhlbiB2ZXJpZnkgdGhhdCBpdCBpcyAke2ltcG9ydExvY2F0aW9ufS5gO1xuICAgIC8vIE1heSBiZSBhIFdlYiBDb21wb25lbnQ/XG4gICAgaWYgKHRhZ05hbWUgJiYgdGFnTmFtZS5pbmRleE9mKCctJykgPiAtMSkge1xuICAgICAgbWVzc2FnZSArPSBgXFxuMi4gSWYgJyR7dGFnTmFtZX0nIGlzIGEgV2ViIENvbXBvbmVudCB0aGVuIGFkZCAnQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQScgYCArXG4gICAgICAgICAgYHRvIHRoZSAke3NjaGVtYXN9IG9mIHRoaXMgY29tcG9uZW50IHRvIHN1cHByZXNzIHRoaXMgbWVzc2FnZS5gO1xuICAgICAgbWVzc2FnZSArPSBgXFxuMy4gVG8gYWxsb3cgYW55IHByb3BlcnR5IGFkZCAnTk9fRVJST1JTX1NDSEVNQScgdG8gYCArXG4gICAgICAgICAgYHRoZSAke3NjaGVtYXN9IG9mIHRoaXMgY29tcG9uZW50LmA7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIGl0J3MgZXhwZWN0ZWQsIHRoZSBlcnJvciBjYW4gYmUgc3VwcHJlc3NlZCBieSB0aGUgYE5PX0VSUk9SU19TQ0hFTUFgIHNjaGVtYS5cbiAgICAgIG1lc3NhZ2UgKz0gYFxcbjIuIFRvIGFsbG93IGFueSBwcm9wZXJ0eSBhZGQgJ05PX0VSUk9SU19TQ0hFTUEnIHRvIGAgK1xuICAgICAgICAgIGB0aGUgJHtzY2hlbWFzfSBvZiB0aGlzIGNvbXBvbmVudC5gO1xuICAgIH1cbiAgfVxuXG4gIGlmIChzaG91bGRUaHJvd0Vycm9yT25Vbmtub3duUHJvcGVydHkpIHtcbiAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFJ1bnRpbWVFcnJvckNvZGUuVU5LTk9XTl9CSU5ESU5HLCBtZXNzYWdlKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmVycm9yKGZvcm1hdFJ1bnRpbWVFcnJvcihSdW50aW1lRXJyb3JDb2RlLlVOS05PV05fQklORElORywgbWVzc2FnZSkpO1xuICB9XG59XG5cbi8qKlxuICogV0FSTklORzogdGhpcyBpcyBhICoqZGV2LW1vZGUgb25seSoqIGZ1bmN0aW9uICh0aHVzIHNob3VsZCBhbHdheXMgYmUgZ3VhcmRlZCBieSB0aGUgYG5nRGV2TW9kZWApXG4gKiBhbmQgbXVzdCAqKm5vdCoqIGJlIHVzZWQgaW4gcHJvZHVjdGlvbiBidW5kbGVzLiBUaGUgZnVuY3Rpb24gbWFrZXMgbWVnYW1vcnBoaWMgcmVhZHMsIHdoaWNoIG1pZ2h0XG4gKiBiZSB0b28gc2xvdyBmb3IgcHJvZHVjdGlvbiBtb2RlIGFuZCBhbHNvIGl0IHJlbGllcyBvbiB0aGUgY29uc3RydWN0b3IgZnVuY3Rpb24gYmVpbmcgYXZhaWxhYmxlLlxuICpcbiAqIEdldHMgYSByZWZlcmVuY2UgdG8gdGhlIGhvc3QgY29tcG9uZW50IGRlZiAod2hlcmUgYSBjdXJyZW50IGNvbXBvbmVudCBpcyBkZWNsYXJlZCkuXG4gKlxuICogQHBhcmFtIGxWaWV3IEFuIGBMVmlld2AgdGhhdCByZXByZXNlbnRzIGEgY3VycmVudCBjb21wb25lbnQgdGhhdCBpcyBiZWluZyByZW5kZXJlZC5cbiAqL1xuZnVuY3Rpb24gZ2V0RGVjbGFyYXRpb25Db21wb25lbnREZWYobFZpZXc6IExWaWV3KTogQ29tcG9uZW50RGVmPHVua25vd24+fG51bGwge1xuICAhbmdEZXZNb2RlICYmIHRocm93RXJyb3IoJ011c3QgbmV2ZXIgYmUgY2FsbGVkIGluIHByb2R1Y3Rpb24gbW9kZScpO1xuXG4gIGNvbnN0IGRlY2xhcmF0aW9uTFZpZXcgPSBsVmlld1tERUNMQVJBVElPTl9DT01QT05FTlRfVklFV10gYXMgTFZpZXc8VHlwZTx1bmtub3duPj47XG4gIGNvbnN0IGNvbnRleHQgPSBkZWNsYXJhdGlvbkxWaWV3W0NPTlRFWFRdO1xuXG4gIC8vIFVuYWJsZSB0byBvYnRhaW4gYSBjb250ZXh0LlxuICBpZiAoIWNvbnRleHQpIHJldHVybiBudWxsO1xuXG4gIHJldHVybiBjb250ZXh0LmNvbnN0cnVjdG9yID8gZ2V0Q29tcG9uZW50RGVmKGNvbnRleHQuY29uc3RydWN0b3IpIDogbnVsbDtcbn1cblxuLyoqXG4gKiBXQVJOSU5HOiB0aGlzIGlzIGEgKipkZXYtbW9kZSBvbmx5KiogZnVuY3Rpb24gKHRodXMgc2hvdWxkIGFsd2F5cyBiZSBndWFyZGVkIGJ5IHRoZSBgbmdEZXZNb2RlYClcbiAqIGFuZCBtdXN0ICoqbm90KiogYmUgdXNlZCBpbiBwcm9kdWN0aW9uIGJ1bmRsZXMuIFRoZSBmdW5jdGlvbiBtYWtlcyBtZWdhbW9ycGhpYyByZWFkcywgd2hpY2ggbWlnaHRcbiAqIGJlIHRvbyBzbG93IGZvciBwcm9kdWN0aW9uIG1vZGUuXG4gKlxuICogQ2hlY2tzIGlmIHRoZSBjdXJyZW50IGNvbXBvbmVudCBpcyBkZWNsYXJlZCBpbnNpZGUgb2YgYSBzdGFuZGFsb25lIGNvbXBvbmVudCB0ZW1wbGF0ZS5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgQW4gYExWaWV3YCB0aGF0IHJlcHJlc2VudHMgYSBjdXJyZW50IGNvbXBvbmVudCB0aGF0IGlzIGJlaW5nIHJlbmRlcmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNIb3N0Q29tcG9uZW50U3RhbmRhbG9uZShsVmlldzogTFZpZXcpOiBib29sZWFuIHtcbiAgIW5nRGV2TW9kZSAmJiB0aHJvd0Vycm9yKCdNdXN0IG5ldmVyIGJlIGNhbGxlZCBpbiBwcm9kdWN0aW9uIG1vZGUnKTtcblxuICBjb25zdCBjb21wb25lbnREZWYgPSBnZXREZWNsYXJhdGlvbkNvbXBvbmVudERlZihsVmlldyk7XG4gIC8vIFRyZWF0IGhvc3QgY29tcG9uZW50IGFzIG5vbi1zdGFuZGFsb25lIGlmIHdlIGNhbid0IG9idGFpbiB0aGUgZGVmLlxuICByZXR1cm4gISFjb21wb25lbnREZWY/LnN0YW5kYWxvbmU7XG59XG5cbi8qKlxuICogV0FSTklORzogdGhpcyBpcyBhICoqZGV2LW1vZGUgb25seSoqIGZ1bmN0aW9uICh0aHVzIHNob3VsZCBhbHdheXMgYmUgZ3VhcmRlZCBieSB0aGUgYG5nRGV2TW9kZWApXG4gKiBhbmQgbXVzdCAqKm5vdCoqIGJlIHVzZWQgaW4gcHJvZHVjdGlvbiBidW5kbGVzLiBUaGUgZnVuY3Rpb24gbWFrZXMgbWVnYW1vcnBoaWMgcmVhZHMsIHdoaWNoIG1pZ2h0XG4gKiBiZSB0b28gc2xvdyBmb3IgcHJvZHVjdGlvbiBtb2RlLlxuICpcbiAqIENvbnN0cnVjdHMgYSBzdHJpbmcgZGVzY3JpYmluZyB0aGUgbG9jYXRpb24gb2YgdGhlIGhvc3QgY29tcG9uZW50IHRlbXBsYXRlLiBUaGUgZnVuY3Rpb24gaXMgdXNlZFxuICogaW4gZGV2IG1vZGUgdG8gcHJvZHVjZSBlcnJvciBtZXNzYWdlcy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgQW4gYExWaWV3YCB0aGF0IHJlcHJlc2VudHMgYSBjdXJyZW50IGNvbXBvbmVudCB0aGF0IGlzIGJlaW5nIHJlbmRlcmVkLlxuICovXG5mdW5jdGlvbiBnZXRUZW1wbGF0ZUxvY2F0aW9uRGV0YWlscyhsVmlldzogTFZpZXcpOiBzdHJpbmcge1xuICAhbmdEZXZNb2RlICYmIHRocm93RXJyb3IoJ011c3QgbmV2ZXIgYmUgY2FsbGVkIGluIHByb2R1Y3Rpb24gbW9kZScpO1xuXG4gIGNvbnN0IGhvc3RDb21wb25lbnREZWYgPSBnZXREZWNsYXJhdGlvbkNvbXBvbmVudERlZihsVmlldyk7XG4gIGNvbnN0IGNvbXBvbmVudENsYXNzTmFtZSA9IGhvc3RDb21wb25lbnREZWY/LnR5cGU/Lm5hbWU7XG4gIHJldHVybiBjb21wb25lbnRDbGFzc05hbWUgPyBgICh1c2VkIGluIHRoZSAnJHtjb21wb25lbnRDbGFzc05hbWV9JyBjb21wb25lbnQgdGVtcGxhdGUpYCA6ICcnO1xufVxuXG4vKipcbiAqIFRoZSBzZXQgb2Yga25vd24gY29udHJvbCBmbG93IGRpcmVjdGl2ZXMuXG4gKiBXZSB1c2UgdGhpcyBzZXQgdG8gcHJvZHVjZSBhIG1vcmUgcHJlY2lzZXMgZXJyb3IgbWVzc2FnZSB3aXRoIGEgbm90ZVxuICogdGhhdCB0aGUgYENvbW1vbk1vZHVsZWAgc2hvdWxkIGFsc28gYmUgaW5jbHVkZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBLTk9XTl9DT05UUk9MX0ZMT1dfRElSRUNUSVZFUyA9XG4gICAgbmV3IFNldChbJ25nSWYnLCAnbmdGb3InLCAnbmdTd2l0Y2gnLCAnbmdTd2l0Y2hDYXNlJywgJ25nU3dpdGNoRGVmYXVsdCddKTtcblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIHRhZyBuYW1lIGlzIGFsbG93ZWQgYnkgc3BlY2lmaWVkIHNjaGVtYXMuXG4gKiBAcGFyYW0gc2NoZW1hcyBBcnJheSBvZiBzY2hlbWFzXG4gKiBAcGFyYW0gdGFnTmFtZSBOYW1lIG9mIHRoZSB0YWdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoaW5nU2NoZW1hcyhzY2hlbWFzOiBTY2hlbWFNZXRhZGF0YVtdfG51bGwsIHRhZ05hbWU6IHN0cmluZ3xudWxsKTogYm9vbGVhbiB7XG4gIGlmIChzY2hlbWFzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzY2hlbWFzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBzY2hlbWEgPSBzY2hlbWFzW2ldO1xuICAgICAgaWYgKHNjaGVtYSA9PT0gTk9fRVJST1JTX1NDSEVNQSB8fFxuICAgICAgICAgIHNjaGVtYSA9PT0gQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQSAmJiB0YWdOYW1lICYmIHRhZ05hbWUuaW5kZXhPZignLScpID4gLTEpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuIl19