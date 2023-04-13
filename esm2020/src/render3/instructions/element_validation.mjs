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
        // Note that we can't check for `typeof HTMLUnknownElement === 'function'` because
        // Domino doesn't expose HTMLUnknownElement globally.
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
    // Note: `typeof Node` returns 'function' in most browsers, but is undefined with domino.
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
        // a template, but the directive or the `CommonModule` is not imported.
        const correspondingImport = KNOWN_CONTROL_FLOW_DIRECTIVES.get(propName);
        message += `\nIf the '${propName}' is an Angular control flow directive, ` +
            `please make sure that either the '${correspondingImport}' directive or the 'CommonModule' is ${importLocation}.`;
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
    reportUnknownPropertyError(message);
}
export function reportUnknownPropertyError(message) {
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
export function getTemplateLocationDetails(lView) {
    !ngDevMode && throwError('Must never be called in production mode');
    const hostComponentDef = getDeclarationComponentDef(lView);
    const componentClassName = hostComponentDef?.type?.name;
    return componentClassName ? ` (used in the '${componentClassName}' component template)` : '';
}
/**
 * The set of known control flow directives and their corresponding imports.
 * We use this set to produce a more precises error message with a note
 * that the `CommonModule` should also be included.
 */
export const KNOWN_CONTROL_FLOW_DIRECTIVES = new Map([
    ['ngIf', 'NgIf'], ['ngFor', 'NgFor'], ['ngSwitchCase', 'NgSwitchCase'],
    ['ngSwitchDefault', 'NgSwitchDefault']
]);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudF92YWxpZGF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvZWxlbWVudF92YWxpZGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxZQUFZLEVBQW1CLE1BQU0sY0FBYyxDQUFDO0FBRWhGLE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxnQkFBZ0IsRUFBaUIsTUFBTSx1QkFBdUIsQ0FBQztBQUMvRixPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDN0MsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUk5QyxPQUFPLEVBQUMsT0FBTyxFQUFFLDBCQUEwQixFQUFRLE1BQU0sb0JBQW9CLENBQUM7QUFDOUUsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBRXBELElBQUksZ0NBQWdDLEdBQUcsS0FBSyxDQUFDO0FBRTdDOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsNEJBQTRCLENBQUMsV0FBb0I7SUFDL0QsZ0NBQWdDLEdBQUcsV0FBVyxDQUFDO0FBQ2pELENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sVUFBVSw0QkFBNEI7SUFDMUMsT0FBTyxnQ0FBZ0MsQ0FBQztBQUMxQyxDQUFDO0FBRUQsSUFBSSxpQ0FBaUMsR0FBRyxLQUFLLENBQUM7QUFFOUM7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSw2QkFBNkIsQ0FBQyxXQUFvQjtJQUNoRSxpQ0FBaUMsR0FBRyxXQUFXLENBQUM7QUFDbEQsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBTSxVQUFVLDZCQUE2QjtJQUMzQyxPQUFPLGlDQUFpQyxDQUFDO0FBQzNDLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFDSCxNQUFNLFVB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Q0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtmb3JtYXRSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vLi4vZXJyb3JzJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtDVVNUT01fRUxFTUVOVFNfU0NIRU1BLCBOT19FUlJPUlNfU0NIRU1BLCBTY2hlbWFNZXRhZGF0YX0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvc2NoZW1hJztcbmltcG9ydCB7dGhyb3dFcnJvcn0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWZ9IGZyb20gJy4uL2RlZmluaXRpb24nO1xuaW1wb3J0IHtDb21wb25lbnREZWZ9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1ROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkNvbW1lbnQsIFJFbGVtZW50fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge0NPTlRFWFQsIERFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXLCBMVmlld30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7aXNBbmltYXRpb25Qcm9wfSBmcm9tICcuLi91dGlsL2F0dHJzX3V0aWxzJztcblxubGV0IHNob3VsZFRocm93RXJyb3JPblVua25vd25FbGVtZW50ID0gZmFsc2U7XG5cbi8qKlxuICogU2V0cyBhIHN0cmljdCBtb2RlIGZvciBKSVQtY29tcGlsZWQgY29tcG9uZW50cyB0byB0aHJvdyBhbiBlcnJvciBvbiB1bmtub3duIGVsZW1lbnRzLFxuICogaW5zdGVhZCBvZiBqdXN0IGxvZ2dpbmcgdGhlIGVycm9yLlxuICogKGZvciBBT1QtY29tcGlsZWQgb25lcyB0aGlzIGNoZWNrIGhhcHBlbnMgYXQgYnVpbGQgdGltZSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtXNldFVua25vd25FbGVtZW50U3RyaWN0TW9kZShzaG91bGRUaHJvdzogYm9vbGVhbikge1xuICBzaG91bGRUaHJvd0Vycm9yT25Vbmtub3duRWxlbWVudCA9IHNob3VsZFRocm93O1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGN1cnJlbnQgdmFsdWUgb2YgdGhlIHN0cmljdCBtb2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gybVnZXRVbmtub3duRWxlbWVudFN0cmljdE1vZGUoKSB7XG4gIHJldHVybiBzaG91bGRUaHJvd0Vycm9yT25Vbmtub3duRWxlbWVudDtcbn1cblxubGV0IHNob3VsZFRocm93RXJyb3JPblVua25vd25Qcm9wZXJ0eSA9IGZhbHNlO1xuXG4vKipcbiAqIFNldHMgYSBzdHJpY3QgbW9kZSBmb3IgSklULWNvbXBpbGVkIGNvbXBvbmVudHMgdG8gdGhyb3cgYW4gZXJyb3Igb24gdW5rbm93biBwcm9wZXJ0aWVzLFxuICogaW5zdGVhZCBvZiBqdXN0IGxvZ2dpbmcgdGhlIGVycm9yLlxuICogKGZvciBBT1QtY29tcGlsZWQgb25lcyB0aGlzIGNoZWNrIGhhcHBlbnMgYXQgYnVpbGQgdGltZSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtXNldFVua25vd25Qcm9wZXJ0eVN0cmljdE1vZGUoc2hvdWxkVGhyb3c6IGJvb2xlYW4pIHtcbiAgc2hvdWxkVGhyb3dFcnJvck9uVW5rbm93blByb3BlcnR5ID0gc2hvdWxkVGhyb3c7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgY3VycmVudCB2YWx1ZSBvZiB0aGUgc3RyaWN0IG1vZGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtWdldFVua25vd25Qcm9wZXJ0eVN0cmljdE1vZGUoKSB7XG4gIHJldHVybiBzaG91bGRUaHJvd0Vycm9yT25Vbmtub3duUHJvcGVydHk7XG59XG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgdGhlIGVsZW1lbnQgaXMga25vd24gYXQgcnVudGltZSBhbmQgcHJvZHVjZXNcbiAqIGFuIGVycm9yIGlmIGl0J3Mgbm90IHRoZSBjYXNlLlxuICogVGhpcyBjaGVjayBpcyByZWxldmFudCBmb3IgSklULWNvbXBpbGVkIGNvbXBvbmVudHMgKGZvciBBT1QtY29tcGlsZWRcbiAqIG9uZXMgdGhpcyBjaGVjayBoYXBwZW5zIGF0IGJ1aWxkIHRpbWUpLlxuICpcbiAqIFRoZSBlbGVtZW50IGlzIGNvbnNpZGVyZWQga25vd24gaWYgZWl0aGVyOlxuICogLSBpdCdzIGEga25vd24gSFRNTCBlbGVtZW50XG4gKiAtIGl0J3MgYSBrbm93biBjdXN0b20gZWxlbWVudFxuICogLSB0aGUgZWxlbWVudCBtYXRjaGVzIGFueSBkaXJlY3RpdmVcbiAqIC0gdGhlIGVsZW1lbnQgaXMgYWxsb3dlZCBieSBvbmUgb2YgdGhlIHNjaGVtYXNcbiAqXG4gKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IHRvIHZhbGlkYXRlXG4gKiBAcGFyYW0gbFZpZXcgQW4gYExWaWV3YCB0aGF0IHJlcHJlc2VudHMgYSBjdXJyZW50IGNvbXBvbmVudCB0aGF0IGlzIGJlaW5nIHJlbmRlcmVkXG4gKiBAcGFyYW0gdGFnTmFtZSBOYW1lIG9mIHRoZSB0YWcgdG8gY2hlY2tcbiAqIEBwYXJhbSBzY2hlbWFzIEFycmF5IG9mIHNjaGVtYXNcbiAqIEBwYXJhbSBoYXNEaXJlY3RpdmVzIEJvb2xlYW4gaW5kaWNhdGluZyB0aGF0IHRoZSBlbGVtZW50IG1hdGNoZXMgYW55IGRpcmVjdGl2ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVFbGVtZW50SXNLbm93bihcbiAgICBlbGVtZW50OiBSRWxlbWVudCwgbFZpZXc6IExWaWV3LCB0YWdOYW1lOiBzdHJpbmd8bnVsbCwgc2NoZW1hczogU2NoZW1hTWV0YWRhdGFbXXxudWxsLFxuICAgIGhhc0RpcmVjdGl2ZXM6IGJvb2xlYW4pOiB2b2lkIHtcbiAgLy8gSWYgYHNjaGVtYXNgIGlzIHNldCB0byBgbnVsbGAsIHRoYXQncyBhbiBpbmRpY2F0aW9uIHRoYXQgdGhpcyBDb21wb25lbnQgd2FzIGNvbXBpbGVkIGluIEFPVFxuICAvLyBtb2RlIHdoZXJlIHRoaXMgY2hlY2sgaGFwcGVucyBhdCBjb21waWxlIHRpbWUuIEluIEpJVCBtb2RlLCBgc2NoZW1hc2AgaXMgYWx3YXlzIHByZXNlbnQgYW5kXG4gIC8vIGRlZmluZWQgYXMgYW4gYXJyYXkgKGFzIGFuIGVtcHR5IGFycmF5IGluIGNhc2UgYHNjaGVtYXNgIGZpZWxkIGlzIG5vdCBkZWZpbmVkKSBhbmQgd2Ugc2hvdWxkXG4gIC8vIGV4ZWN1dGUgdGhlIGNoZWNrIGJlbG93LlxuICBpZiAoc2NoZW1hcyA9PT0gbnVsbCkgcmV0dXJuO1xuXG4gIC8vIElmIHRoZSBlbGVtZW50IG1hdGNoZXMgYW55IGRpcmVjdGl2ZSwgaXQncyBjb25zaWRlcmVkIGFzIHZhbGlkLlxuICBpZiAoIWhhc0RpcmVjdGl2ZXMgJiYgdGFnTmFtZSAhPT0gbnVsbCkge1xuICAgIC8vIFRoZSBlbGVtZW50IGlzIHVua25vd24gaWYgaXQncyBhbiBpbnN0YW5jZSBvZiBIVE1MVW5rbm93bkVsZW1lbnQsIG9yIGl0IGlzbid0IHJlZ2lzdGVyZWRcbiAgICAvLyBhcyBhIGN1c3RvbSBlbGVtZW50LiBOb3RlIHRoYXQgdW5rbm93biBlbGVtZW50cyB3aXRoIGEgZGFzaCBpbiB0aGVpciBuYW1lIHdvbid0IGJlIGluc3RhbmNlc1xuICAgIC8vIG9mIEhUTUxVbmtub3duRWxlbWVudCBpbiBicm93c2VycyB0aGF0IHN1cHBvcnQgd2ViIGNvbXBvbmVudHMuXG4gICAgY29uc3QgaXNVbmtub3duID1cbiAgICAgICAgLy8gTm90ZSB0aGF0IHdlIGNhbid0IGNoZWNrIGZvciBgdHlwZW9mIEhUTUxVbmtub3duRWxlbWVudCA9PT0gJ2Z1bmN0aW9uJ2AgYmVjYXVzZVxuICAgICAgICAvLyBEb21pbm8gZG9lc24ndCBleHBvc2UgSFRNTFVua25vd25FbGVtZW50IGdsb2JhbGx5LlxuICAgICAgICAodHlwZW9mIEhUTUxVbmtub3duRWxlbWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgSFRNTFVua25vd25FbGVtZW50ICYmXG4gICAgICAgICBlbGVtZW50IGluc3RhbmNlb2YgSFRNTFVua25vd25FbGVtZW50KSB8fFxuICAgICAgICAodHlwZW9mIGN1c3RvbUVsZW1lbnRzICE9PSAndW5kZWZpbmVkJyAmJiB0YWdOYW1lLmluZGV4T2YoJy0nKSA+IC0xICYmXG4gICAgICAgICAhY3VzdG9tRWxlbWVudHMuZ2V0KHRhZ05hbWUpKTtcblxuICAgIGlmIChpc1Vua25vd24gJiYgIW1hdGNoaW5nU2NoZW1hcyhzY2hlbWFzLCB0YWdOYW1lKSkge1xuICAgICAgY29uc3QgaXNIb3N0U3RhbmRhbG9uZSA9IGlzSG9zdENvbXBvbmVudFN0YW5kYWxvbmUobFZpZXcpO1xuICAgICAgY29uc3QgdGVtcGxhdGVMb2NhdGlvbiA9IGdldFRlbXBsYXRlTG9jYXRpb25EZXRhaWxzKGxWaWV3KTtcbiAgICAgIGNvbnN0IHNjaGVtYXMgPSBgJyR7aXNIb3N0U3RhbmRhbG9uZSA/ICdAQ29tcG9uZW50JyA6ICdATmdNb2R1bGUnfS5zY2hlbWFzJ2A7XG5cbiAgICAgIGxldCBtZXNzYWdlID0gYCcke3RhZ05hbWV9JyBpcyBub3QgYSBrbm93biBlbGVtZW50JHt0ZW1wbGF0ZUxvY2F0aW9ufTpcXG5gO1xuICAgICAgbWVzc2FnZSArPSBgMS4gSWYgJyR7dGFnTmFtZX0nIGlzIGFuIEFuZ3VsYXIgY29tcG9uZW50LCB0aGVuIHZlcmlmeSB0aGF0IGl0IGlzICR7XG4gICAgICAgICAgaXNIb3N0U3RhbmRhbG9uZSA/ICdpbmNsdWRlZCBpbiB0aGUgXFwnQENvbXBvbmVudC5pbXBvcnRzXFwnIG9mIHRoaXMgY29tcG9uZW50JyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICdhIHBhcnQgb2YgYW4gQE5nTW9kdWxlIHdoZXJlIHRoaXMgY29tcG9uZW50IGlzIGRlY2xhcmVkJ30uXFxuYDtcbiAgICAgIGlmICh0YWdOYW1lICYmIHRhZ05hbWUuaW5kZXhPZignLScpID4gLTEpIHtcbiAgICAgICAgbWVzc2FnZSArPVxuICAgICAgICAgICAgYDIuIElmICcke3RhZ05hbWV9JyBpcyBhIFdlYiBDb21wb25lbnQgdGhlbiBhZGQgJ0NVU1RPTV9FTEVNRU5UU19TQ0hFTUEnIHRvIHRoZSAke1xuICAgICAgICAgICAgICAgIHNjaGVtYXN9IG9mIHRoaXMgY29tcG9uZW50IHRvIHN1cHByZXNzIHRoaXMgbWVzc2FnZS5gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZSArPVxuICAgICAgICAgICAgYDIuIFRvIGFsbG93IGFueSBlbGVtZW50IGFkZCAnTk9fRVJST1JTX1NDSEVNQScgdG8gdGhlICR7c2NoZW1hc30gb2YgdGhpcyBjb21wb25lbnQuYDtcbiAgICAgIH1cbiAgICAgIGlmIChzaG91bGRUaHJvd0Vycm9yT25Vbmtub3duRWxlbWVudCkge1xuICAgICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFJ1bnRpbWVFcnJvckNvZGUuVU5LTk9XTl9FTEVNRU5ULCBtZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZm9ybWF0UnVudGltZUVycm9yKFJ1bnRpbWVFcnJvckNvZGUuVU5LTk9XTl9FTEVNRU5ULCBtZXNzYWdlKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgdGhlIHByb3BlcnR5IG9mIHRoZSBlbGVtZW50IGlzIGtub3duIGF0IHJ1bnRpbWUgYW5kIHJldHVybnNcbiAqIGZhbHNlIGlmIGl0J3Mgbm90IHRoZSBjYXNlLlxuICogVGhpcyBjaGVjayBpcyByZWxldmFudCBmb3IgSklULWNvbXBpbGVkIGNvbXBvbmVudHMgKGZvciBBT1QtY29tcGlsZWRcbiAqIG9uZXMgdGhpcyBjaGVjayBoYXBwZW5zIGF0IGJ1aWxkIHRpbWUpLlxuICpcbiAqIFRoZSBwcm9wZXJ0eSBpcyBjb25zaWRlcmVkIGtub3duIGlmIGVpdGhlcjpcbiAqIC0gaXQncyBhIGtub3duIHByb3BlcnR5IG9mIHRoZSBlbGVtZW50XG4gKiAtIHRoZSBlbGVtZW50IGlzIGFsbG93ZWQgYnkgb25lIG9mIHRoZSBzY2hlbWFzXG4gKiAtIHRoZSBwcm9wZXJ0eSBpcyB1c2VkIGZvciBhbmltYXRpb25zXG4gKlxuICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB0byB2YWxpZGF0ZVxuICogQHBhcmFtIHByb3BOYW1lIE5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIGNoZWNrXG4gKiBAcGFyYW0gdGFnTmFtZSBOYW1lIG9mIHRoZSB0YWcgaG9zdGluZyB0aGUgcHJvcGVydHlcbiAqIEBwYXJhbSBzY2hlbWFzIEFycmF5IG9mIHNjaGVtYXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUHJvcGVydHlWYWxpZChcbiAgICBlbGVtZW50OiBSRWxlbWVudHxSQ29tbWVudCwgcHJvcE5hbWU6IHN0cmluZywgdGFnTmFtZTogc3RyaW5nfG51bGwsXG4gICAgc2NoZW1hczogU2NoZW1hTWV0YWRhdGFbXXxudWxsKTogYm9vbGVhbiB7XG4gIC8vIElmIGBzY2hlbWFzYCBpcyBzZXQgdG8gYG51bGxgLCB0aGF0J3MgYW4gaW5kaWNhdGlvbiB0aGF0IHRoaXMgQ29tcG9uZW50IHdhcyBjb21waWxlZCBpbiBBT1RcbiAgLy8gbW9kZSB3aGVyZSB0aGlzIGNoZWNrIGhhcHBlbnMgYXQgY29tcGlsZSB0aW1lLiBJbiBKSVQgbW9kZSwgYHNjaGVtYXNgIGlzIGFsd2F5cyBwcmVzZW50IGFuZFxuICAvLyBkZWZpbmVkIGFzIGFuIGFycmF5IChhcyBhbiBlbXB0eSBhcnJheSBpbiBjYXNlIGBzY2hlbWFzYCBmaWVsZCBpcyBub3QgZGVmaW5lZCkgYW5kIHdlIHNob3VsZFxuICAvLyBleGVjdXRlIHRoZSBjaGVjayBiZWxvdy5cbiAgaWYgKHNjaGVtYXMgPT09IG51bGwpIHJldHVybiB0cnVlO1xuXG4gIC8vIFRoZSBwcm9wZXJ0eSBpcyBjb25zaWRlcmVkIHZhbGlkIGlmIHRoZSBlbGVtZW50IG1hdGNoZXMgdGhlIHNjaGVtYSwgaXQgZXhpc3RzIG9uIHRoZSBlbGVtZW50LFxuICAvLyBvciBpdCBpcyBzeW50aGV0aWMsIGFuZCB3ZSBhcmUgaW4gYSBicm93c2VyIGNvbnRleHQgKHdlYiB3b3JrZXIgbm9kZXMgc2hvdWxkIGJlIHNraXBwZWQpLlxuICBpZiAobWF0Y2hpbmdTY2hlbWFzKHNjaGVtYXMsIHRhZ05hbWUpIHx8IHByb3BOYW1lIGluIGVsZW1lbnQgfHwgaXNBbmltYXRpb25Qcm9wKHByb3BOYW1lKSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gTm90ZTogYHR5cGVvZiBOb2RlYCByZXR1cm5zICdmdW5jdGlvbicgaW4gbW9zdCBicm93c2VycywgYnV0IGlzIHVuZGVmaW5lZCB3aXRoIGRvbWluby5cbiAgcmV0dXJuIHR5cGVvZiBOb2RlID09PSAndW5kZWZpbmVkJyB8fCBOb2RlID09PSBudWxsIHx8ICEoZWxlbWVudCBpbnN0YW5jZW9mIE5vZGUpO1xufVxuXG4vKipcbiAqIExvZ3Mgb3IgdGhyb3dzIGFuIGVycm9yIHRoYXQgYSBwcm9wZXJ0eSBpcyBub3Qgc3VwcG9ydGVkIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogQHBhcmFtIHByb3BOYW1lIE5hbWUgb2YgdGhlIGludmFsaWQgcHJvcGVydHlcbiAqIEBwYXJhbSB0YWdOYW1lIE5hbWUgb2YgdGhlIHRhZyBob3N0aW5nIHRoZSBwcm9wZXJ0eVxuICogQHBhcmFtIG5vZGVUeXBlIFR5cGUgb2YgdGhlIG5vZGUgaG9zdGluZyB0aGUgcHJvcGVydHlcbiAqIEBwYXJhbSBsVmlldyBBbiBgTFZpZXdgIHRoYXQgcmVwcmVzZW50cyBhIGN1cnJlbnQgY29tcG9uZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVVbmtub3duUHJvcGVydHlFcnJvcihcbiAgICBwcm9wTmFtZTogc3RyaW5nLCB0YWdOYW1lOiBzdHJpbmd8bnVsbCwgbm9kZVR5cGU6IFROb2RlVHlwZSwgbFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIC8vIFNwZWNpYWwtY2FzZSBhIHNpdHVhdGlvbiB3aGVuIGEgc3RydWN0dXJhbCBkaXJlY3RpdmUgaXMgYXBwbGllZCB0b1xuICAvLyBhbiBgPG5nLXRlbXBsYXRlPmAgZWxlbWVudCwgZm9yIGV4YW1wbGU6IGA8bmctdGVtcGxhdGUgKm5nSWY9XCJ0cnVlXCI+YC5cbiAgLy8gSW4gdGhpcyBjYXNlIHRoZSBjb21waWxlciBnZW5lcmF0ZXMgdGhlIGDJtcm1dGVtcGxhdGVgIGluc3RydWN0aW9uIHdpdGhcbiAgLy8gdGhlIGBudWxsYCBhcyB0aGUgdGFnTmFtZS4gVGhlIGRpcmVjdGl2ZSBtYXRjaGluZyBsb2dpYyBhdCBydW50aW1lIHJlbGllc1xuICAvLyBvbiB0aGlzIGVmZmVjdCAoc2VlIGBpc0lubGluZVRlbXBsYXRlYCksIHRodXMgdXNpbmcgdGhlICduZy10ZW1wbGF0ZScgYXNcbiAgLy8gYSBkZWZhdWx0IHZhbHVlIG9mIHRoZSBgdE5vZGUudmFsdWVgIGlzIG5vdCBmZWFzaWJsZSBhdCB0aGlzIG1vbWVudC5cbiAgaWYgKCF0YWdOYW1lICYmIG5vZGVUeXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgdGFnTmFtZSA9ICduZy10ZW1wbGF0ZSc7XG4gIH1cblxuICBjb25zdCBpc0hvc3RTdGFuZGFsb25lID0gaXNIb3N0Q29tcG9uZW50U3RhbmRhbG9uZShsVmlldyk7XG4gIGNvbnN0IHRlbXBsYXRlTG9jYXRpb24gPSBnZXRUZW1wbGF0ZUxvY2F0aW9uRGV0YWlscyhsVmlldyk7XG5cbiAgbGV0IG1lc3NhZ2UgPSBgQ2FuJ3QgYmluZCB0byAnJHtwcm9wTmFtZX0nIHNpbmNlIGl0IGlzbid0IGEga25vd24gcHJvcGVydHkgb2YgJyR7dGFnTmFtZX0nJHtcbiAgICAgIHRlbXBsYXRlTG9jYXRpb259LmA7XG5cbiAgY29uc3Qgc2NoZW1hcyA9IGAnJHtpc0hvc3RTdGFuZGFsb25lID8gJ0BDb21wb25lbnQnIDogJ0BOZ01vZHVsZSd9LnNjaGVtYXMnYDtcbiAgY29uc3QgaW1wb3J0TG9jYXRpb24gPSBpc0hvc3RTdGFuZGFsb25lID9cbiAgICAgICdpbmNsdWRlZCBpbiB0aGUgXFwnQENvbXBvbmVudC5pbXBvcnRzXFwnIG9mIHRoaXMgY29tcG9uZW50JyA6XG4gICAgICAnYSBwYXJ0IG9mIGFuIEBOZ01vZHVsZSB3aGVyZSB0aGlzIGNvbXBvbmVudCBpcyBkZWNsYXJlZCc7XG4gIGlmIChLTk9XTl9DT05UUk9MX0ZMT1dfRElSRUNUSVZFUy5oYXMocHJvcE5hbWUpKSB7XG4gICAgLy8gTW9zdCBsaWtlbHkgdGhpcyBpcyBhIGNvbnRyb2wgZmxvdyBkaXJlY3RpdmUgKHN1Y2ggYXMgYCpuZ0lmYCkgdXNlZCBpblxuICAgIC8vIGEgdGVtcGxhdGUsIGJ1dCB0aGUgZGlyZWN0aXZlIG9yIHRoZSBgQ29tbW9uTW9kdWxlYCBpcyBub3QgaW1wb3J0ZWQuXG4gICAgY29uc3QgY29ycmVzcG9uZGluZ0ltcG9ydCA9IEtOT1dOX0NPTlRST0xfRkxPV19ESVJFQ1RJVkVTLmdldChwcm9wTmFtZSk7XG4gICAgbWVzc2FnZSArPSBgXFxuSWYgdGhlICcke3Byb3BOYW1lfScgaXMgYW4gQW5ndWxhciBjb250cm9sIGZsb3cgZGlyZWN0aXZlLCBgICtcbiAgICAgICAgYHBsZWFzZSBtYWtlIHN1cmUgdGhhdCBlaXRoZXIgdGhlICcke1xuICAgICAgICAgICAgICAgICAgIGNvcnJlc3BvbmRpbmdJbXBvcnR9JyBkaXJlY3RpdmUgb3IgdGhlICdDb21tb25Nb2R1bGUnIGlzICR7aW1wb3J0TG9jYXRpb259LmA7XG4gIH0gZWxzZSB7XG4gICAgLy8gTWF5IGJlIGFuIEFuZ3VsYXIgY29tcG9uZW50LCB3aGljaCBpcyBub3QgaW1wb3J0ZWQvZGVjbGFyZWQ/XG4gICAgbWVzc2FnZSArPSBgXFxuMS4gSWYgJyR7dGFnTmFtZX0nIGlzIGFuIEFuZ3VsYXIgY29tcG9uZW50IGFuZCBpdCBoYXMgdGhlIGAgK1xuICAgICAgICBgJyR7cHJvcE5hbWV9JyBpbnB1dCwgdGhlbiB2ZXJpZnkgdGhhdCBpdCBpcyAke2ltcG9ydExvY2F0aW9ufS5gO1xuICAgIC8vIE1heSBiZSBhIFdlYiBDb21wb25lbnQ/XG4gICAgaWYgKHRhZ05hbWUgJiYgdGFnTmFtZS5pbmRleE9mKCctJykgPiAtMSkge1xuICAgICAgbWVzc2FnZSArPSBgXFxuMi4gSWYgJyR7dGFnTmFtZX0nIGlzIGEgV2ViIENvbXBvbmVudCB0aGVuIGFkZCAnQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQScgYCArXG4gICAgICAgICAgYHRvIHRoZSAke3NjaGVtYXN9IG9mIHRoaXMgY29tcG9uZW50IHRvIHN1cHByZXNzIHRoaXMgbWVzc2FnZS5gO1xuICAgICAgbWVzc2FnZSArPSBgXFxuMy4gVG8gYWxsb3cgYW55IHByb3BlcnR5IGFkZCAnTk9fRVJST1JTX1NDSEVNQScgdG8gYCArXG4gICAgICAgICAgYHRoZSAke3NjaGVtYXN9IG9mIHRoaXMgY29tcG9uZW50LmA7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIGl0J3MgZXhwZWN0ZWQsIHRoZSBlcnJvciBjYW4gYmUgc3VwcHJlc3NlZCBieSB0aGUgYE5PX0VSUk9SU19TQ0hFTUFgIHNjaGVtYS5cbiAgICAgIG1lc3NhZ2UgKz0gYFxcbjIuIFRvIGFsbG93IGFueSBwcm9wZXJ0eSBhZGQgJ05PX0VSUk9SU19TQ0hFTUEnIHRvIGAgK1xuICAgICAgICAgIGB0aGUgJHtzY2hlbWFzfSBvZiB0aGlzIGNvbXBvbmVudC5gO1xuICAgIH1cbiAgfVxuXG4gIHJlcG9ydFVua25vd25Qcm9wZXJ0eUVycm9yKG1lc3NhZ2UpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVwb3J0VW5rbm93blByb3BlcnR5RXJyb3IobWVzc2FnZTogc3RyaW5nKSB7XG4gIGlmIChzaG91bGRUaHJvd0Vycm9yT25Vbmtub3duUHJvcGVydHkpIHtcbiAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFJ1bnRpbWVFcnJvckNvZGUuVU5LTk9XTl9CSU5ESU5HLCBtZXNzYWdlKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmVycm9yKGZvcm1hdFJ1bnRpbWVFcnJvcihSdW50aW1lRXJyb3JDb2RlLlVOS05PV05fQklORElORywgbWVzc2FnZSkpO1xuICB9XG59XG5cbi8qKlxuICogV0FSTklORzogdGhpcyBpcyBhICoqZGV2LW1vZGUgb25seSoqIGZ1bmN0aW9uICh0aHVzIHNob3VsZCBhbHdheXMgYmUgZ3VhcmRlZCBieSB0aGUgYG5nRGV2TW9kZWApXG4gKiBhbmQgbXVzdCAqKm5vdCoqIGJlIHVzZWQgaW4gcHJvZHVjdGlvbiBidW5kbGVzLiBUaGUgZnVuY3Rpb24gbWFrZXMgbWVnYW1vcnBoaWMgcmVhZHMsIHdoaWNoIG1pZ2h0XG4gKiBiZSB0b28gc2xvdyBmb3IgcHJvZHVjdGlvbiBtb2RlIGFuZCBhbHNvIGl0IHJlbGllcyBvbiB0aGUgY29uc3RydWN0b3IgZnVuY3Rpb24gYmVpbmcgYXZhaWxhYmxlLlxuICpcbiAqIEdldHMgYSByZWZlcmVuY2UgdG8gdGhlIGhvc3QgY29tcG9uZW50IGRlZiAod2hlcmUgYSBjdXJyZW50IGNvbXBvbmVudCBpcyBkZWNsYXJlZCkuXG4gKlxuICogQHBhcmFtIGxWaWV3IEFuIGBMVmlld2AgdGhhdCByZXByZXNlbnRzIGEgY3VycmVudCBjb21wb25lbnQgdGhhdCBpcyBiZWluZyByZW5kZXJlZC5cbiAqL1xuZnVuY3Rpb24gZ2V0RGVjbGFyYXRpb25Db21wb25lbnREZWYobFZpZXc6IExWaWV3KTogQ29tcG9uZW50RGVmPHVua25vd24+fG51bGwge1xuICAhbmdEZXZNb2RlICYmIHRocm93RXJyb3IoJ011c3QgbmV2ZXIgYmUgY2FsbGVkIGluIHByb2R1Y3Rpb24gbW9kZScpO1xuXG4gIGNvbnN0IGRlY2xhcmF0aW9uTFZpZXcgPSBsVmlld1tERUNMQVJBVElPTl9DT01QT05FTlRfVklFV10gYXMgTFZpZXc8VHlwZTx1bmtub3duPj47XG4gIGNvbnN0IGNvbnRleHQgPSBkZWNsYXJhdGlvbkxWaWV3W0NPTlRFWFRdO1xuXG4gIC8vIFVuYWJsZSB0byBvYnRhaW4gYSBjb250ZXh0LlxuICBpZiAoIWNvbnRleHQpIHJldHVybiBudWxsO1xuXG4gIHJldHVybiBjb250ZXh0LmNvbnN0cnVjdG9yID8gZ2V0Q29tcG9uZW50RGVmKGNvbnRleHQuY29uc3RydWN0b3IpIDogbnVsbDtcbn1cblxuLyoqXG4gKiBXQVJOSU5HOiB0aGlzIGlzIGEgKipkZXYtbW9kZSBvbmx5KiogZnVuY3Rpb24gKHRodXMgc2hvdWxkIGFsd2F5cyBiZSBndWFyZGVkIGJ5IHRoZSBgbmdEZXZNb2RlYClcbiAqIGFuZCBtdXN0ICoqbm90KiogYmUgdXNlZCBpbiBwcm9kdWN0aW9uIGJ1bmRsZXMuIFRoZSBmdW5jdGlvbiBtYWtlcyBtZWdhbW9ycGhpYyByZWFkcywgd2hpY2ggbWlnaHRcbiAqIGJlIHRvbyBzbG93IGZvciBwcm9kdWN0aW9uIG1vZGUuXG4gKlxuICogQ2hlY2tzIGlmIHRoZSBjdXJyZW50IGNvbXBvbmVudCBpcyBkZWNsYXJlZCBpbnNpZGUgb2YgYSBzdGFuZGFsb25lIGNvbXBvbmVudCB0ZW1wbGF0ZS5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgQW4gYExWaWV3YCB0aGF0IHJlcHJlc2VudHMgYSBjdXJyZW50IGNvbXBvbmVudCB0aGF0IGlzIGJlaW5nIHJlbmRlcmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNIb3N0Q29tcG9uZW50U3RhbmRhbG9uZShsVmlldzogTFZpZXcpOiBib29sZWFuIHtcbiAgIW5nRGV2TW9kZSAmJiB0aHJvd0Vycm9yKCdNdXN0IG5ldmVyIGJlIGNhbGxlZCBpbiBwcm9kdWN0aW9uIG1vZGUnKTtcblxuICBjb25zdCBjb21wb25lbnREZWYgPSBnZXREZWNsYXJhdGlvbkNvbXBvbmVudERlZihsVmlldyk7XG4gIC8vIFRyZWF0IGhvc3QgY29tcG9uZW50IGFzIG5vbi1zdGFuZGFsb25lIGlmIHdlIGNhbid0IG9idGFpbiB0aGUgZGVmLlxuICByZXR1cm4gISFjb21wb25lbnREZWY/LnN0YW5kYWxvbmU7XG59XG5cbi8qKlxuICogV0FSTklORzogdGhpcyBpcyBhICoqZGV2LW1vZGUgb25seSoqIGZ1bmN0aW9uICh0aHVzIHNob3VsZCBhbHdheXMgYmUgZ3VhcmRlZCBieSB0aGUgYG5nRGV2TW9kZWApXG4gKiBhbmQgbXVzdCAqKm5vdCoqIGJlIHVzZWQgaW4gcHJvZHVjdGlvbiBidW5kbGVzLiBUaGUgZnVuY3Rpb24gbWFrZXMgbWVnYW1vcnBoaWMgcmVhZHMsIHdoaWNoIG1pZ2h0XG4gKiBiZSB0b28gc2xvdyBmb3IgcHJvZHVjdGlvbiBtb2RlLlxuICpcbiAqIENvbnN0cnVjdHMgYSBzdHJpbmcgZGVzY3JpYmluZyB0aGUgbG9jYXRpb24gb2YgdGhlIGhvc3QgY29tcG9uZW50IHRlbXBsYXRlLiBUaGUgZnVuY3Rpb24gaXMgdXNlZFxuICogaW4gZGV2IG1vZGUgdG8gcHJvZHVjZSBlcnJvciBtZXNzYWdlcy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgQW4gYExWaWV3YCB0aGF0IHJlcHJlc2VudHMgYSBjdXJyZW50IGNvbXBvbmVudCB0aGF0IGlzIGJlaW5nIHJlbmRlcmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGVtcGxhdGVMb2NhdGlvbkRldGFpbHMobFZpZXc6IExWaWV3KTogc3RyaW5nIHtcbiAgIW5nRGV2TW9kZSAmJiB0aHJvd0Vycm9yKCdNdXN0IG5ldmVyIGJlIGNhbGxlZCBpbiBwcm9kdWN0aW9uIG1vZGUnKTtcblxuICBjb25zdCBob3N0Q29tcG9uZW50RGVmID0gZ2V0RGVjbGFyYXRpb25Db21wb25lbnREZWYobFZpZXcpO1xuICBjb25zdCBjb21wb25lbnRDbGFzc05hbWUgPSBob3N0Q29tcG9uZW50RGVmPy50eXBlPy5uYW1lO1xuICByZXR1cm4gY29tcG9uZW50Q2xhc3NOYW1lID8gYCAodXNlZCBpbiB0aGUgJyR7Y29tcG9uZW50Q2xhc3NOYW1lfScgY29tcG9uZW50IHRlbXBsYXRlKWAgOiAnJztcbn1cblxuLyoqXG4gKiBUaGUgc2V0IG9mIGtub3duIGNvbnRyb2wgZmxvdyBkaXJlY3RpdmVzIGFuZCB0aGVpciBjb3JyZXNwb25kaW5nIGltcG9ydHMuXG4gKiBXZSB1c2UgdGhpcyBzZXQgdG8gcHJvZHVjZSBhIG1vcmUgcHJlY2lzZXMgZXJyb3IgbWVzc2FnZSB3aXRoIGEgbm90ZVxuICogdGhhdCB0aGUgYENvbW1vbk1vZHVsZWAgc2hvdWxkIGFsc28gYmUgaW5jbHVkZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBLTk9XTl9DT05UUk9MX0ZMT1dfRElSRUNUSVZFUyA9IG5ldyBNYXAoW1xuICBbJ25nSWYnLCAnTmdJZiddLCBbJ25nRm9yJywgJ05nRm9yJ10sIFsnbmdTd2l0Y2hDYXNlJywgJ05nU3dpdGNoQ2FzZSddLFxuICBbJ25nU3dpdGNoRGVmYXVsdCcsICdOZ1N3aXRjaERlZmF1bHQnXVxuXSk7XG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgdGFnIG5hbWUgaXMgYWxsb3dlZCBieSBzcGVjaWZpZWQgc2NoZW1hcy5cbiAqIEBwYXJhbSBzY2hlbWFzIEFycmF5IG9mIHNjaGVtYXNcbiAqIEBwYXJhbSB0YWdOYW1lIE5hbWUgb2YgdGhlIHRhZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hpbmdTY2hlbWFzKHNjaGVtYXM6IFNjaGVtYU1ldGFkYXRhW118bnVsbCwgdGFnTmFtZTogc3RyaW5nfG51bGwpOiBib29sZWFuIHtcbiAgaWYgKHNjaGVtYXMgIT09IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNjaGVtYXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHNjaGVtYSA9IHNjaGVtYXNbaV07XG4gICAgICBpZiAoc2NoZW1hID09PSBOT19FUlJPUlNfU0NIRU1BIHx8XG4gICAgICAgICAgc2NoZW1hID09PSBDVVNUT01fRUxFTUVOVFNfU0NIRU1BICYmIHRhZ05hbWUgJiYgdGFnTmFtZS5pbmRleE9mKCctJykgPiAtMSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG4iXX0=