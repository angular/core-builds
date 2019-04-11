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
/** @enum {number} */
const RenderFlags = {
    /* Whether to run the creation block (e.g. create elements and directives) */
    Create: 1,
    /* Whether to run the update block (e.g. refresh bindings) */
    Update: 2,
};
export { RenderFlags };
/**
 * A subclass of `Type` which has a static `ngComponentDef`:`ComponentDef` field making it
 * consumable for rendering.
 * @record
 * @template T
 */
export function ComponentType() { }
if (false) {
    /** @type {?} */
    ComponentType.prototype.ngComponentDef;
}
/**
 * A subclass of `Type` which has a static `ngDirectiveDef`:`DirectiveDef` field making it
 * consumable for rendering.
 * @record
 * @template T
 */
export function DirectiveType() { }
if (false) {
    /** @type {?} */
    DirectiveType.prototype.ngDirectiveDef;
}
/** @enum {number} */
const DirectiveDefFlags = {
    ContentQuery: 2,
};
export { DirectiveDefFlags };
/**
 * A subclass of `Type` which has a static `ngPipeDef`:`PipeDef` field making it
 * consumable for rendering.
 * @record
 * @template T
 */
export function PipeType() { }
if (false) {
    /** @type {?} */
    PipeType.prototype.ngPipeDef;
}
/**
 * Runtime information for classes that are inherited by components or directives
 * that aren't defined as components or directives.
 *
 * This is an internal data structure used by the render to determine what inputs
 * and outputs should be inherited.
 *
 * See: {\@link defineBase}
 *
 * \@codeGenApi
 * @record
 * @template T
 */
export function ΔBaseDef() { }
if (false) {
    /**
     * A dictionary mapping the inputs' minified property names to their public API names, which
     * are their aliases if any, or their original unminified property names
     * (as in `\@Input('alias') propertyName: any;`).
     * @type {?}
     */
    ΔBaseDef.prototype.inputs;
    /**
     * @deprecated This is only here because `NgOnChanges` incorrectly uses declared name instead of
     * public or minified name.
     * @type {?}
     */
    ΔBaseDef.prototype.declaredInputs;
    /**
     * A dictionary mapping the outputs' minified property names to their public API names, which
     * are their aliases if any, or their original unminified property names
     * (as in `\@Output('alias') propertyName: any;`).
     * @type {?}
     */
    ΔBaseDef.prototype.outputs;
}
/**
 * Runtime link information for Directives.
 *
 * This is internal data structure used by the render to link
 * directives into templates.
 *
 * NOTE: Always use `defineDirective` function to create this object,
 * never create the object directly since the shape of this object
 * can change between versions.
 *
 * @param Selector type metadata specifying the selector of the directive or component
 *
 * See: {\@link defineDirective}
 * @record
 * @template T
 */
export function DirectiveDef() { }
if (false) {
    /**
     * Token representing the directive. Used by DI.
     * @type {?}
     */
    DirectiveDef.prototype.type;
    /**
     * Function that resolves providers and publishes them into the DI system.
     * @type {?}
     */
    DirectiveDef.prototype.providersResolver;
    /**
     * The selectors that will be used to match nodes to this directive.
     * @type {?}
     */
    DirectiveDef.prototype.selectors;
    /**
     * Name under which the directive is exported (for use with local references in template)
     * @type {?}
     */
    DirectiveDef.prototype.exportAs;
    /**
     * Factory function used to create a new directive instance.
     * @type {?}
     */
    DirectiveDef.prototype.factory;
    /**
     * Function to create and refresh content queries associated with a given directive.
     * @type {?}
     */
    DirectiveDef.prototype.contentQueries;
    /**
     * Query-related instructions for a directive. Note that while directives don't have a
     * view and as such view queries won't necessarily do anything, there might be
     * components that extend the directive.
     * @type {?}
     */
    DirectiveDef.prototype.viewQuery;
    /**
     * Refreshes host bindings on the associated directive.
     * @type {?}
     */
    DirectiveDef.prototype.hostBindings;
    /** @type {?} */
    DirectiveDef.prototype.onChanges;
    /** @type {?} */
    DirectiveDef.prototype.onInit;
    /** @type {?} */
    DirectiveDef.prototype.doCheck;
    /** @type {?} */
    DirectiveDef.prototype.afterContentInit;
    /** @type {?} */
    DirectiveDef.prototype.afterContentChecked;
    /** @type {?} */
    DirectiveDef.prototype.afterViewInit;
    /** @type {?} */
    DirectiveDef.prototype.afterViewChecked;
    /** @type {?} */
    DirectiveDef.prototype.onDestroy;
    /**
     * The features applied to this directive
     * @type {?}
     */
    DirectiveDef.prototype.features;
    /** @type {?} */
    DirectiveDef.prototype.setInput;
}
/**
 * Runtime link information for Components.
 *
 * This is internal data structure used by the render to link
 * components into templates.
 *
 * NOTE: Always use `defineComponent` function to create this object,
 * never create the object directly since the shape of this object
 * can change between versions.
 *
 * See: {\@link defineComponent}
 * @record
 * @template T
 */
export function ComponentDef() { }
if (false) {
    /**
     * Runtime unique component ID.
     * @type {?}
     */
    ComponentDef.prototype.id;
    /**
     * The View template of the component.
     * @type {?}
     */
    ComponentDef.prototype.template;
    /**
     * An array of `ngContent[selector]` values that were found in the template.
     * @type {?|undefined}
     */
    ComponentDef.prototype.ngContentSelectors;
    /**
     * A set of styles that the component needs to be present for component to render correctly.
     * @type {?}
     */
    ComponentDef.prototype.styles;
    /**
     * The number of nodes, local refs, and pipes in this component template.
     *
     * Used to calculate the length of the component's LView array, so we
     * can pre-fill the array and set the binding start index.
     * @type {?}
     */
    ComponentDef.prototype.consts;
    /**
     * The number of bindings in this component template (including pure fn bindings).
     *
     * Used to calculate the length of the component's LView array, so we
     * can pre-fill the array and set the host binding start index.
     * @type {?}
     */
    ComponentDef.prototype.vars;
    /**
     * Query-related instructions for a component.
     * @type {?}
     */
    ComponentDef.prototype.viewQuery;
    /**
     * The view encapsulation type, which determines how styles are applied to
     * DOM elements. One of
     * - `Emulated` (default): Emulate native scoping of styles.
     * - `Native`: Use the native encapsulation mechanism of the renderer.
     * - `ShadowDom`: Use modern [ShadowDOM](https://w3c.github.io/webcomponents/spec/shadow/) and
     *   create a ShadowRoot for component's host element.
     * - `None`: Do not provide any template or style encapsulation.
     * @type {?}
     */
    ComponentDef.prototype.encapsulation;
    /**
     * Defines arbitrary developer-defined data to be stored on a renderer instance.
     * This is useful for renderers that delegate to other renderers.
     * @type {?}
     */
    ComponentDef.prototype.data;
    /**
     * Whether or not this component's ChangeDetectionStrategy is OnPush
     * @type {?}
     */
    ComponentDef.prototype.onPush;
    /**
     * Registry of directives and components that may be found in this view.
     *
     * The property is either an array of `DirectiveDef`s or a function which returns the array of
     * `DirectiveDef`s. The function is necessary to be able to support forward declarations.
     * @type {?}
     */
    ComponentDef.prototype.directiveDefs;
    /**
     * Registry of pipes that may be found in this view.
     *
     * The property is either an array of `PipeDefs`s or a function which returns the array of
     * `PipeDefs`s. The function is necessary to be able to support forward declarations.
     * @type {?}
     */
    ComponentDef.prototype.pipeDefs;
    /**
     * The set of schemas that declare elements to be allowed in the component's template.
     * @type {?}
     */
    ComponentDef.prototype.schemas;
    /**
     * Used to store the result of `noSideEffects` function so that it is not removed by closure
     * compiler. The property should never be read.
     * @type {?|undefined}
     */
    ComponentDef.prototype._;
}
/**
 * Runtime link information for Pipes.
 *
 * This is internal data structure used by the renderer to link
 * pipes into templates.
 *
 * NOTE: Always use `definePipe` function to create this object,
 * never create the object directly since the shape of this object
 * can change between versions.
 *
 * See: {\@link definePipe}
 * @record
 * @template T
 */
export function PipeDef() { }
if (false) {
    /**
     * Pipe name.
     *
     * Used to resolve pipe in templates.
     * @type {?}
     */
    PipeDef.prototype.name;
    /**
     * Factory function used to create a new pipe instance.
     * @type {?}
     */
    PipeDef.prototype.factory;
    /**
     * Whether or not the pipe is pure.
     *
     * Pure pipes result only depends on the pipe input and not on internal
     * state of the pipe.
     * @type {?}
     */
    PipeDef.prototype.pure;
    /** @type {?} */
    PipeDef.prototype.onDestroy;
}
/**
 * @record
 */
export function DirectiveDefFeature() { }
if (false) {
    /**
     * Marks a feature as something that {\@link InheritDefinitionFeature} will execute
     * during inheritance.
     *
     * NOTE: DO NOT SET IN ROOT OF MODULE! Doing so will result in tree-shakers/bundlers
     * identifying the change as a side effect, and the feature will be included in
     * every bundle.
     * @type {?|undefined}
     */
    DirectiveDefFeature.prototype.ngInherit;
    /* Skipping unhandled member: <T>(directiveDef: DirectiveDef<T>): void;*/
}
/**
 * @record
 */
export function ComponentDefFeature() { }
if (false) {
    /**
     * Marks a feature as something that {\@link InheritDefinitionFeature} will execute
     * during inheritance.
     *
     * NOTE: DO NOT SET IN ROOT OF MODULE! Doing so will result in tree-shakers/bundlers
     * identifying the change as a side effect, and the feature will be included in
     * every bundle.
     * @type {?|undefined}
     */
    ComponentDefFeature.prototype.ngInherit;
    /* Skipping unhandled member: <T>(componentDef: ComponentDef<T>): void;*/
}
// Note: This hack is necessary so we don't erroneously get a circular dependency
// failure based on types.
/** @type {?} */
export const unusedValueExportToPlacateAjd = 1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmaW5pdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9kZWZpbml0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUE0REUsNkVBQTZFO0lBQzdFLFNBQWE7SUFFYiw2REFBNkQ7SUFDN0QsU0FBYTs7Ozs7Ozs7O0FBT2YsbUNBQTRFOzs7SUFBeEIsdUNBQXNCOzs7Ozs7OztBQU0xRSxtQ0FBNEU7OztJQUF4Qix1Q0FBc0I7Ozs7SUFFckMsZUFBbUI7Ozs7Ozs7OztBQU14RCw4QkFBa0U7OztJQUFuQiw2QkFBaUI7Ozs7Ozs7Ozs7Ozs7OztBQW9CaEUsOEJBb0JDOzs7Ozs7OztJQWRDLDBCQUEwQzs7Ozs7O0lBTTFDLGtDQUFrRDs7Ozs7OztJQU9sRCwyQkFBMkM7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlCN0Msa0NBMERDOzs7Ozs7SUF4REMsNEJBQWM7Ozs7O0lBR2QseUNBRW9COzs7OztJQUdwQixpQ0FBb0M7Ozs7O0lBS3BDLGdDQUFpQzs7Ozs7SUFLakMsK0JBQXNCOzs7OztJQUt0QixzQ0FBK0M7Ozs7Ozs7SUFPL0MsaUNBQXVDOzs7OztJQUt2QyxvQ0FBMkM7O0lBRzNDLGlDQUE2Qjs7SUFDN0IsOEJBQTBCOztJQUMxQiwrQkFBMkI7O0lBQzNCLHdDQUFvQzs7SUFDcEMsMkNBQXVDOztJQUN2QyxxQ0FBaUM7O0lBQ2pDLHdDQUFvQzs7SUFDcEMsaUNBQTZCOzs7OztJQUs3QixnQ0FBOEM7O0lBRTlDLGdDQUc0Qzs7Ozs7Ozs7Ozs7Ozs7OztBQXNCOUMsa0NBeUZDOzs7Ozs7SUFyRkMsMEJBQW9COzs7OztJQUtwQixnQ0FBd0M7Ozs7O0lBS3hDLDBDQUF1Qzs7Ozs7SUFLdkMsOEJBQTBCOzs7Ozs7OztJQVMxQiw4QkFBd0I7Ozs7Ozs7O0lBUXhCLDRCQUFzQjs7Ozs7SUFLdEIsaUNBQXVDOzs7Ozs7Ozs7OztJQVd2QyxxQ0FBMEM7Ozs7OztJQU0xQyw0QkFBcUM7Ozs7O0lBR3JDLDhCQUF5Qjs7Ozs7Ozs7SUFRekIscUNBQThDOzs7Ozs7OztJQVE5QyxnQ0FBb0M7Ozs7O0lBS3BDLCtCQUErQjs7Ozs7O0lBTS9CLHlCQUFtQjs7Ozs7Ozs7Ozs7Ozs7OztBQWVyQiw2QkF1QkM7Ozs7Ozs7O0lBakJDLHVCQUFzQjs7Ozs7SUFLdEIsMEJBQXNCOzs7Ozs7OztJQVF0Qix1QkFBdUI7O0lBR3ZCLDRCQUE2Qjs7Ozs7QUFRL0IseUNBV0M7Ozs7Ozs7Ozs7O0lBREMsd0NBQWlCOzs7Ozs7QUFHbkIseUNBV0M7Ozs7Ozs7Ozs7O0lBREMsd0NBQWlCOzs7Ozs7QUF1Q25CLE1BQU0sT0FBTyw2QkFBNkIsR0FBRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1NjaGVtYU1ldGFkYXRhLCBWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnLi4vLi4vY29yZSc7XG5pbXBvcnQge1Byb2Nlc3NQcm92aWRlcnNGdW5jdGlvbn0gZnJvbSAnLi4vLi4vZGkvaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtDc3NTZWxlY3Rvckxpc3R9IGZyb20gJy4vcHJvamVjdGlvbic7XG5cblxuLyoqXG4gKiBEZWZpbml0aW9uIG9mIHdoYXQgYSB0ZW1wbGF0ZSByZW5kZXJpbmcgZnVuY3Rpb24gc2hvdWxkIGxvb2sgbGlrZSBmb3IgYSBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCB0eXBlIENvbXBvbmVudFRlbXBsYXRlPFQ+ID0ge1xuICAvLyBOb3RlOiB0aGUgY3R4IHBhcmFtZXRlciBpcyB0eXBlZCBhcyBUfFUsIGFzIHVzaW5nIG9ubHkgVSB3b3VsZCBwcmV2ZW50IGEgdGVtcGxhdGUgd2l0aFxuICAvLyBlLmcuIGN0eDoge30gZnJvbSBiZWluZyBhc3NpZ25lZCB0byBDb21wb25lbnRUZW1wbGF0ZTxhbnk+IGFzIFR5cGVTY3JpcHQgd29uJ3QgaW5mZXIgVSA9IGFueVxuICAvLyBpbiB0aGF0IHNjZW5hcmlvLiBCeSBpbmNsdWRpbmcgVCB0aGlzIGluY29tcGF0aWJpbGl0eSBpcyByZXNvbHZlZC5cbiAgPFUgZXh0ZW5kcyBUPihyZjogUmVuZGVyRmxhZ3MsIGN0eDogVCB8IFUpOiB2b2lkOyBuZ1ByaXZhdGVEYXRhPzogbmV2ZXI7XG59O1xuXG4vKipcbiAqIERlZmluaXRpb24gb2Ygd2hhdCBhIHZpZXcgcXVlcmllcyBmdW5jdGlvbiBzaG91bGQgbG9vayBsaWtlLlxuICovXG5leHBvcnQgdHlwZSBWaWV3UXVlcmllc0Z1bmN0aW9uPFQ+ID0gPFUgZXh0ZW5kcyBUPihyZjogUmVuZGVyRmxhZ3MsIGN0eDogVSkgPT4gdm9pZDtcblxuLyoqXG4gKiBEZWZpbml0aW9uIG9mIHdoYXQgYSBjb250ZW50IHF1ZXJpZXMgZnVuY3Rpb24gc2hvdWxkIGxvb2sgbGlrZS5cbiAqL1xuZXhwb3J0IHR5cGUgQ29udGVudFF1ZXJpZXNGdW5jdGlvbjxUPiA9XG4gICAgPFUgZXh0ZW5kcyBUPihyZjogUmVuZGVyRmxhZ3MsIGN0eDogVSwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcikgPT4gdm9pZDtcblxuLyoqXG4gKiBEZWZpbml0aW9uIG9mIHdoYXQgYSBmYWN0b3J5IGZ1bmN0aW9uIHNob3VsZCBsb29rIGxpa2UuXG4gKi9cbmV4cG9ydCB0eXBlIEZhY3RvcnlGbjxUPiA9IHtcbiAgLyoqXG4gICAqIFN1YmNsYXNzZXMgd2l0aG91dCBhbiBleHBsaWNpdCBjb25zdHJ1Y3RvciBjYWxsIHRocm91Z2ggdG8gdGhlIGZhY3Rvcnkgb2YgdGhlaXIgYmFzZVxuICAgKiBkZWZpbml0aW9uLCBwcm92aWRpbmcgaXQgd2l0aCB0aGVpciBvd24gY29uc3RydWN0b3IgdG8gaW5zdGFudGlhdGUuXG4gICAqL1xuICA8VSBleHRlbmRzIFQ+KHQ6IFR5cGU8VT4pOiBVO1xuXG4gIC8qKlxuICAgKiBJZiBubyBjb25zdHJ1Y3RvciB0byBpbnN0YW50aWF0ZSBpcyBwcm92aWRlZCwgYW4gaW5zdGFuY2Ugb2YgdHlwZSBUIGl0c2VsZiBpcyBjcmVhdGVkLlxuICAgKi9cbiAgKHQ6IG51bGwpOiBUO1xufTtcblxuLyoqXG4gKiBGbGFncyBwYXNzZWQgaW50byB0ZW1wbGF0ZSBmdW5jdGlvbnMgdG8gZGV0ZXJtaW5lIHdoaWNoIGJsb2NrcyAoaS5lLiBjcmVhdGlvbiwgdXBkYXRlKVxuICogc2hvdWxkIGJlIGV4ZWN1dGVkLlxuICpcbiAqIFR5cGljYWxseSwgYSB0ZW1wbGF0ZSBydW5zIGJvdGggdGhlIGNyZWF0aW9uIGJsb2NrIGFuZCB0aGUgdXBkYXRlIGJsb2NrIG9uIGluaXRpYWxpemF0aW9uIGFuZFxuICogc3Vic2VxdWVudCBydW5zIG9ubHkgZXhlY3V0ZSB0aGUgdXBkYXRlIGJsb2NrLiBIb3dldmVyLCBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzIHJlcXVpcmUgdGhhdFxuICogdGhlIGNyZWF0aW9uIGJsb2NrIGJlIGV4ZWN1dGVkIHNlcGFyYXRlbHkgZnJvbSB0aGUgdXBkYXRlIGJsb2NrIChmb3IgYmFja3dhcmRzIGNvbXBhdCkuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFJlbmRlckZsYWdzIHtcbiAgLyogV2hldGhlciB0byBydW4gdGhlIGNyZWF0aW9uIGJsb2NrIChlLmcuIGNyZWF0ZSBlbGVtZW50cyBhbmQgZGlyZWN0aXZlcykgKi9cbiAgQ3JlYXRlID0gMGIwMSxcblxuICAvKiBXaGV0aGVyIHRvIHJ1biB0aGUgdXBkYXRlIGJsb2NrIChlLmcuIHJlZnJlc2ggYmluZGluZ3MpICovXG4gIFVwZGF0ZSA9IDBiMTBcbn1cblxuLyoqXG4gKiBBIHN1YmNsYXNzIG9mIGBUeXBlYCB3aGljaCBoYXMgYSBzdGF0aWMgYG5nQ29tcG9uZW50RGVmYDpgQ29tcG9uZW50RGVmYCBmaWVsZCBtYWtpbmcgaXRcbiAqIGNvbnN1bWFibGUgZm9yIHJlbmRlcmluZy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnRUeXBlPFQ+IGV4dGVuZHMgVHlwZTxUPiB7IG5nQ29tcG9uZW50RGVmOiBuZXZlcjsgfVxuXG4vKipcbiAqIEEgc3ViY2xhc3Mgb2YgYFR5cGVgIHdoaWNoIGhhcyBhIHN0YXRpYyBgbmdEaXJlY3RpdmVEZWZgOmBEaXJlY3RpdmVEZWZgIGZpZWxkIG1ha2luZyBpdFxuICogY29uc3VtYWJsZSBmb3IgcmVuZGVyaW5nLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERpcmVjdGl2ZVR5cGU8VD4gZXh0ZW5kcyBUeXBlPFQ+IHsgbmdEaXJlY3RpdmVEZWY6IG5ldmVyOyB9XG5cbmV4cG9ydCBjb25zdCBlbnVtIERpcmVjdGl2ZURlZkZsYWdzIHtDb250ZW50UXVlcnkgPSAwYjEwfVxuXG4vKipcbiAqIEEgc3ViY2xhc3Mgb2YgYFR5cGVgIHdoaWNoIGhhcyBhIHN0YXRpYyBgbmdQaXBlRGVmYDpgUGlwZURlZmAgZmllbGQgbWFraW5nIGl0XG4gKiBjb25zdW1hYmxlIGZvciByZW5kZXJpbmcuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUGlwZVR5cGU8VD4gZXh0ZW5kcyBUeXBlPFQ+IHsgbmdQaXBlRGVmOiBuZXZlcjsgfVxuXG4vKipcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCB0eXBlIM6URGlyZWN0aXZlRGVmV2l0aE1ldGE8XG4gICAgVCwgU2VsZWN0b3IgZXh0ZW5kcyBzdHJpbmcsIEV4cG9ydEFzIGV4dGVuZHMgc3RyaW5nW10sIElucHV0TWFwIGV4dGVuZHN7W2tleTogc3RyaW5nXTogc3RyaW5nfSxcbiAgICBPdXRwdXRNYXAgZXh0ZW5kc3tba2V5OiBzdHJpbmddOiBzdHJpbmd9LCBRdWVyeUZpZWxkcyBleHRlbmRzIHN0cmluZ1tdPiA9IERpcmVjdGl2ZURlZjxUPjtcblxuLyoqXG4gKiBSdW50aW1lIGluZm9ybWF0aW9uIGZvciBjbGFzc2VzIHRoYXQgYXJlIGluaGVyaXRlZCBieSBjb21wb25lbnRzIG9yIGRpcmVjdGl2ZXNcbiAqIHRoYXQgYXJlbid0IGRlZmluZWQgYXMgY29tcG9uZW50cyBvciBkaXJlY3RpdmVzLlxuICpcbiAqIFRoaXMgaXMgYW4gaW50ZXJuYWwgZGF0YSBzdHJ1Y3R1cmUgdXNlZCBieSB0aGUgcmVuZGVyIHRvIGRldGVybWluZSB3aGF0IGlucHV0c1xuICogYW5kIG91dHB1dHMgc2hvdWxkIGJlIGluaGVyaXRlZC5cbiAqXG4gKiBTZWU6IHtAbGluayBkZWZpbmVCYXNlfVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgzpRCYXNlRGVmPFQ+IHtcbiAgLyoqXG4gICAqIEEgZGljdGlvbmFyeSBtYXBwaW5nIHRoZSBpbnB1dHMnIG1pbmlmaWVkIHByb3BlcnR5IG5hbWVzIHRvIHRoZWlyIHB1YmxpYyBBUEkgbmFtZXMsIHdoaWNoXG4gICAqIGFyZSB0aGVpciBhbGlhc2VzIGlmIGFueSwgb3IgdGhlaXIgb3JpZ2luYWwgdW5taW5pZmllZCBwcm9wZXJ0eSBuYW1lc1xuICAgKiAoYXMgaW4gYEBJbnB1dCgnYWxpYXMnKSBwcm9wZXJ0eU5hbWU6IGFueTtgKS5cbiAgICovXG4gIHJlYWRvbmx5IGlucHV0czoge1tQIGluIGtleW9mIFRdOiBzdHJpbmd9O1xuXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBUaGlzIGlzIG9ubHkgaGVyZSBiZWNhdXNlIGBOZ09uQ2hhbmdlc2AgaW5jb3JyZWN0bHkgdXNlcyBkZWNsYXJlZCBuYW1lIGluc3RlYWQgb2ZcbiAgICogcHVibGljIG9yIG1pbmlmaWVkIG5hbWUuXG4gICAqL1xuICByZWFkb25seSBkZWNsYXJlZElucHV0czoge1tQIGluIGtleW9mIFRdOiBzdHJpbmd9O1xuXG4gIC8qKlxuICAgKiBBIGRpY3Rpb25hcnkgbWFwcGluZyB0aGUgb3V0cHV0cycgbWluaWZpZWQgcHJvcGVydHkgbmFtZXMgdG8gdGhlaXIgcHVibGljIEFQSSBuYW1lcywgd2hpY2hcbiAgICogYXJlIHRoZWlyIGFsaWFzZXMgaWYgYW55LCBvciB0aGVpciBvcmlnaW5hbCB1bm1pbmlmaWVkIHByb3BlcnR5IG5hbWVzXG4gICAqIChhcyBpbiBgQE91dHB1dCgnYWxpYXMnKSBwcm9wZXJ0eU5hbWU6IGFueTtgKS5cbiAgICovXG4gIHJlYWRvbmx5IG91dHB1dHM6IHtbUCBpbiBrZXlvZiBUXTogc3RyaW5nfTtcbn1cblxuLyoqXG4gKiBSdW50aW1lIGxpbmsgaW5mb3JtYXRpb24gZm9yIERpcmVjdGl2ZXMuXG4gKlxuICogVGhpcyBpcyBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZSB1c2VkIGJ5IHRoZSByZW5kZXIgdG8gbGlua1xuICogZGlyZWN0aXZlcyBpbnRvIHRlbXBsYXRlcy5cbiAqXG4gKiBOT1RFOiBBbHdheXMgdXNlIGBkZWZpbmVEaXJlY3RpdmVgIGZ1bmN0aW9uIHRvIGNyZWF0ZSB0aGlzIG9iamVjdCxcbiAqIG5ldmVyIGNyZWF0ZSB0aGUgb2JqZWN0IGRpcmVjdGx5IHNpbmNlIHRoZSBzaGFwZSBvZiB0aGlzIG9iamVjdFxuICogY2FuIGNoYW5nZSBiZXR3ZWVuIHZlcnNpb25zLlxuICpcbiAqIEBwYXJhbSBTZWxlY3RvciB0eXBlIG1ldGFkYXRhIHNwZWNpZnlpbmcgdGhlIHNlbGVjdG9yIG9mIHRoZSBkaXJlY3RpdmUgb3IgY29tcG9uZW50XG4gKlxuICogU2VlOiB7QGxpbmsgZGVmaW5lRGlyZWN0aXZlfVxuICovXG5leHBvcnQgaW50ZXJmYWNlIERpcmVjdGl2ZURlZjxUPiBleHRlbmRzIM6UQmFzZURlZjxUPiB7XG4gIC8qKiBUb2tlbiByZXByZXNlbnRpbmcgdGhlIGRpcmVjdGl2ZS4gVXNlZCBieSBESS4gKi9cbiAgdHlwZTogVHlwZTxUPjtcblxuICAvKiogRnVuY3Rpb24gdGhhdCByZXNvbHZlcyBwcm92aWRlcnMgYW5kIHB1Ymxpc2hlcyB0aGVtIGludG8gdGhlIERJIHN5c3RlbS4gKi9cbiAgcHJvdmlkZXJzUmVzb2x2ZXI6XG4gICAgICAoPFUgZXh0ZW5kcyBUPihkZWY6IERpcmVjdGl2ZURlZjxVPiwgcHJvY2Vzc1Byb3ZpZGVyc0ZuPzogUHJvY2Vzc1Byb3ZpZGVyc0Z1bmN0aW9uKSA9PlxuICAgICAgICAgICB2b2lkKXxudWxsO1xuXG4gIC8qKiBUaGUgc2VsZWN0b3JzIHRoYXQgd2lsbCBiZSB1c2VkIHRvIG1hdGNoIG5vZGVzIHRvIHRoaXMgZGlyZWN0aXZlLiAqL1xuICByZWFkb25seSBzZWxlY3RvcnM6IENzc1NlbGVjdG9yTGlzdDtcblxuICAvKipcbiAgICogTmFtZSB1bmRlciB3aGljaCB0aGUgZGlyZWN0aXZlIGlzIGV4cG9ydGVkIChmb3IgdXNlIHdpdGggbG9jYWwgcmVmZXJlbmNlcyBpbiB0ZW1wbGF0ZSlcbiAgICovXG4gIHJlYWRvbmx5IGV4cG9ydEFzOiBzdHJpbmdbXXxudWxsO1xuXG4gIC8qKlxuICAgKiBGYWN0b3J5IGZ1bmN0aW9uIHVzZWQgdG8gY3JlYXRlIGEgbmV3IGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAgICovXG4gIGZhY3Rvcnk6IEZhY3RvcnlGbjxUPjtcblxuICAvKipcbiAgICogRnVuY3Rpb24gdG8gY3JlYXRlIGFuZCByZWZyZXNoIGNvbnRlbnQgcXVlcmllcyBhc3NvY2lhdGVkIHdpdGggYSBnaXZlbiBkaXJlY3RpdmUuXG4gICAqL1xuICBjb250ZW50UXVlcmllczogQ29udGVudFF1ZXJpZXNGdW5jdGlvbjxUPnxudWxsO1xuXG4gIC8qKlxuICAgKiBRdWVyeS1yZWxhdGVkIGluc3RydWN0aW9ucyBmb3IgYSBkaXJlY3RpdmUuIE5vdGUgdGhhdCB3aGlsZSBkaXJlY3RpdmVzIGRvbid0IGhhdmUgYVxuICAgKiB2aWV3IGFuZCBhcyBzdWNoIHZpZXcgcXVlcmllcyB3b24ndCBuZWNlc3NhcmlseSBkbyBhbnl0aGluZywgdGhlcmUgbWlnaHQgYmVcbiAgICogY29tcG9uZW50cyB0aGF0IGV4dGVuZCB0aGUgZGlyZWN0aXZlLlxuICAgKi9cbiAgdmlld1F1ZXJ5OiBWaWV3UXVlcmllc0Z1bmN0aW9uPFQ+fG51bGw7XG5cbiAgLyoqXG4gICAqIFJlZnJlc2hlcyBob3N0IGJpbmRpbmdzIG9uIHRoZSBhc3NvY2lhdGVkIGRpcmVjdGl2ZS5cbiAgICovXG4gIGhvc3RCaW5kaW5nczogSG9zdEJpbmRpbmdzRnVuY3Rpb248VD58bnVsbDtcblxuICAvKiBUaGUgZm9sbG93aW5nIGFyZSBsaWZlY3ljbGUgaG9va3MgZm9yIHRoaXMgY29tcG9uZW50ICovXG4gIG9uQ2hhbmdlczogKCgpID0+IHZvaWQpfG51bGw7XG4gIG9uSW5pdDogKCgpID0+IHZvaWQpfG51bGw7XG4gIGRvQ2hlY2s6ICgoKSA9PiB2b2lkKXxudWxsO1xuICBhZnRlckNvbnRlbnRJbml0OiAoKCkgPT4gdm9pZCl8bnVsbDtcbiAgYWZ0ZXJDb250ZW50Q2hlY2tlZDogKCgpID0+IHZvaWQpfG51bGw7XG4gIGFmdGVyVmlld0luaXQ6ICgoKSA9PiB2b2lkKXxudWxsO1xuICBhZnRlclZpZXdDaGVja2VkOiAoKCkgPT4gdm9pZCl8bnVsbDtcbiAgb25EZXN0cm95OiAoKCkgPT4gdm9pZCl8bnVsbDtcblxuICAvKipcbiAgICogVGhlIGZlYXR1cmVzIGFwcGxpZWQgdG8gdGhpcyBkaXJlY3RpdmVcbiAgICovXG4gIHJlYWRvbmx5IGZlYXR1cmVzOiBEaXJlY3RpdmVEZWZGZWF0dXJlW118bnVsbDtcblxuICBzZXRJbnB1dDpcbiAgICAgICg8VSBleHRlbmRzIFQ+KFxuICAgICAgICAgICB0aGlzOiBEaXJlY3RpdmVEZWY8VT4sIGluc3RhbmNlOiBVLCB2YWx1ZTogYW55LCBwdWJsaWNOYW1lOiBzdHJpbmcsXG4gICAgICAgICAgIHByaXZhdGVOYW1lOiBzdHJpbmcpID0+IHZvaWQpfG51bGw7XG59XG5cbi8qKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IHR5cGUgzpRDb21wb25lbnREZWZXaXRoTWV0YTxcbiAgICBULCBTZWxlY3RvciBleHRlbmRzIFN0cmluZywgRXhwb3J0QXMgZXh0ZW5kcyBzdHJpbmdbXSwgSW5wdXRNYXAgZXh0ZW5kc3tba2V5OiBzdHJpbmddOiBzdHJpbmd9LFxuICAgIE91dHB1dE1hcCBleHRlbmRze1trZXk6IHN0cmluZ106IHN0cmluZ30sIFF1ZXJ5RmllbGRzIGV4dGVuZHMgc3RyaW5nW10+ID0gQ29tcG9uZW50RGVmPFQ+O1xuXG4vKipcbiAqIFJ1bnRpbWUgbGluayBpbmZvcm1hdGlvbiBmb3IgQ29tcG9uZW50cy5cbiAqXG4gKiBUaGlzIGlzIGludGVybmFsIGRhdGEgc3RydWN0dXJlIHVzZWQgYnkgdGhlIHJlbmRlciB0byBsaW5rXG4gKiBjb21wb25lbnRzIGludG8gdGVtcGxhdGVzLlxuICpcbiAqIE5PVEU6IEFsd2F5cyB1c2UgYGRlZmluZUNvbXBvbmVudGAgZnVuY3Rpb24gdG8gY3JlYXRlIHRoaXMgb2JqZWN0LFxuICogbmV2ZXIgY3JlYXRlIHRoZSBvYmplY3QgZGlyZWN0bHkgc2luY2UgdGhlIHNoYXBlIG9mIHRoaXMgb2JqZWN0XG4gKiBjYW4gY2hhbmdlIGJldHdlZW4gdmVyc2lvbnMuXG4gKlxuICogU2VlOiB7QGxpbmsgZGVmaW5lQ29tcG9uZW50fVxuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbXBvbmVudERlZjxUPiBleHRlbmRzIERpcmVjdGl2ZURlZjxUPiB7XG4gIC8qKlxuICAgKiBSdW50aW1lIHVuaXF1ZSBjb21wb25lbnQgSUQuXG4gICAqL1xuICByZWFkb25seSBpZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgVmlldyB0ZW1wbGF0ZSBvZiB0aGUgY29tcG9uZW50LlxuICAgKi9cbiAgcmVhZG9ubHkgdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPFQ+O1xuXG4gIC8qKlxuICAgKiBBbiBhcnJheSBvZiBgbmdDb250ZW50W3NlbGVjdG9yXWAgdmFsdWVzIHRoYXQgd2VyZSBmb3VuZCBpbiB0aGUgdGVtcGxhdGUuXG4gICAqL1xuICByZWFkb25seSBuZ0NvbnRlbnRTZWxlY3RvcnM/OiBzdHJpbmdbXTtcblxuICAvKipcbiAgICogQSBzZXQgb2Ygc3R5bGVzIHRoYXQgdGhlIGNvbXBvbmVudCBuZWVkcyB0byBiZSBwcmVzZW50IGZvciBjb21wb25lbnQgdG8gcmVuZGVyIGNvcnJlY3RseS5cbiAgICovXG4gIHJlYWRvbmx5IHN0eWxlczogc3RyaW5nW107XG5cbiAgLyoqXG4gICAqIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIGNvbXBvbmVudCB0ZW1wbGF0ZS5cbiAgICpcbiAgICogVXNlZCB0byBjYWxjdWxhdGUgdGhlIGxlbmd0aCBvZiB0aGUgY29tcG9uZW50J3MgTFZpZXcgYXJyYXksIHNvIHdlXG4gICAqIGNhbiBwcmUtZmlsbCB0aGUgYXJyYXkgYW5kIHNldCB0aGUgYmluZGluZyBzdGFydCBpbmRleC5cbiAgICovXG4gIC8vIFRPRE8oa2FyYSk6IHJlbW92ZSBxdWVyaWVzIGZyb20gdGhpcyBjb3VudFxuICByZWFkb25seSBjb25zdHM6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIG51bWJlciBvZiBiaW5kaW5ncyBpbiB0aGlzIGNvbXBvbmVudCB0ZW1wbGF0ZSAoaW5jbHVkaW5nIHB1cmUgZm4gYmluZGluZ3MpLlxuICAgKlxuICAgKiBVc2VkIHRvIGNhbGN1bGF0ZSB0aGUgbGVuZ3RoIG9mIHRoZSBjb21wb25lbnQncyBMVmlldyBhcnJheSwgc28gd2VcbiAgICogY2FuIHByZS1maWxsIHRoZSBhcnJheSBhbmQgc2V0IHRoZSBob3N0IGJpbmRpbmcgc3RhcnQgaW5kZXguXG4gICAqL1xuICByZWFkb25seSB2YXJzOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFF1ZXJ5LXJlbGF0ZWQgaW5zdHJ1Y3Rpb25zIGZvciBhIGNvbXBvbmVudC5cbiAgICovXG4gIHZpZXdRdWVyeTogVmlld1F1ZXJpZXNGdW5jdGlvbjxUPnxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgdmlldyBlbmNhcHN1bGF0aW9uIHR5cGUsIHdoaWNoIGRldGVybWluZXMgaG93IHN0eWxlcyBhcmUgYXBwbGllZCB0b1xuICAgKiBET00gZWxlbWVudHMuIE9uZSBvZlxuICAgKiAtIGBFbXVsYXRlZGAgKGRlZmF1bHQpOiBFbXVsYXRlIG5hdGl2ZSBzY29waW5nIG9mIHN0eWxlcy5cbiAgICogLSBgTmF0aXZlYDogVXNlIHRoZSBuYXRpdmUgZW5jYXBzdWxhdGlvbiBtZWNoYW5pc20gb2YgdGhlIHJlbmRlcmVyLlxuICAgKiAtIGBTaGFkb3dEb21gOiBVc2UgbW9kZXJuIFtTaGFkb3dET01dKGh0dHBzOi8vdzNjLmdpdGh1Yi5pby93ZWJjb21wb25lbnRzL3NwZWMvc2hhZG93LykgYW5kXG4gICAqICAgY3JlYXRlIGEgU2hhZG93Um9vdCBmb3IgY29tcG9uZW50J3MgaG9zdCBlbGVtZW50LlxuICAgKiAtIGBOb25lYDogRG8gbm90IHByb3ZpZGUgYW55IHRlbXBsYXRlIG9yIHN0eWxlIGVuY2Fwc3VsYXRpb24uXG4gICAqL1xuICByZWFkb25seSBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbjtcblxuICAvKipcbiAgICogRGVmaW5lcyBhcmJpdHJhcnkgZGV2ZWxvcGVyLWRlZmluZWQgZGF0YSB0byBiZSBzdG9yZWQgb24gYSByZW5kZXJlciBpbnN0YW5jZS5cbiAgICogVGhpcyBpcyB1c2VmdWwgZm9yIHJlbmRlcmVycyB0aGF0IGRlbGVnYXRlIHRvIG90aGVyIHJlbmRlcmVycy5cbiAgICovXG4gIHJlYWRvbmx5IGRhdGE6IHtba2luZDogc3RyaW5nXTogYW55fTtcblxuICAvKiogV2hldGhlciBvciBub3QgdGhpcyBjb21wb25lbnQncyBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSBpcyBPblB1c2ggKi9cbiAgcmVhZG9ubHkgb25QdXNoOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBSZWdpc3RyeSBvZiBkaXJlY3RpdmVzIGFuZCBjb21wb25lbnRzIHRoYXQgbWF5IGJlIGZvdW5kIGluIHRoaXMgdmlldy5cbiAgICpcbiAgICogVGhlIHByb3BlcnR5IGlzIGVpdGhlciBhbiBhcnJheSBvZiBgRGlyZWN0aXZlRGVmYHMgb3IgYSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIHRoZSBhcnJheSBvZlxuICAgKiBgRGlyZWN0aXZlRGVmYHMuIFRoZSBmdW5jdGlvbiBpcyBuZWNlc3NhcnkgdG8gYmUgYWJsZSB0byBzdXBwb3J0IGZvcndhcmQgZGVjbGFyYXRpb25zLlxuICAgKi9cbiAgZGlyZWN0aXZlRGVmczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeXxudWxsO1xuXG4gIC8qKlxuICAgKiBSZWdpc3RyeSBvZiBwaXBlcyB0aGF0IG1heSBiZSBmb3VuZCBpbiB0aGlzIHZpZXcuXG4gICAqXG4gICAqIFRoZSBwcm9wZXJ0eSBpcyBlaXRoZXIgYW4gYXJyYXkgb2YgYFBpcGVEZWZzYHMgb3IgYSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIHRoZSBhcnJheSBvZlxuICAgKiBgUGlwZURlZnNgcy4gVGhlIGZ1bmN0aW9uIGlzIG5lY2Vzc2FyeSB0byBiZSBhYmxlIHRvIHN1cHBvcnQgZm9yd2FyZCBkZWNsYXJhdGlvbnMuXG4gICAqL1xuICBwaXBlRGVmczogUGlwZURlZkxpc3RPckZhY3Rvcnl8bnVsbDtcblxuICAvKipcbiAgICogVGhlIHNldCBvZiBzY2hlbWFzIHRoYXQgZGVjbGFyZSBlbGVtZW50cyB0byBiZSBhbGxvd2VkIGluIHRoZSBjb21wb25lbnQncyB0ZW1wbGF0ZS5cbiAgICovXG4gIHNjaGVtYXM6IFNjaGVtYU1ldGFkYXRhW118bnVsbDtcblxuICAvKipcbiAgICogVXNlZCB0byBzdG9yZSB0aGUgcmVzdWx0IG9mIGBub1NpZGVFZmZlY3RzYCBmdW5jdGlvbiBzbyB0aGF0IGl0IGlzIG5vdCByZW1vdmVkIGJ5IGNsb3N1cmVcbiAgICogY29tcGlsZXIuIFRoZSBwcm9wZXJ0eSBzaG91bGQgbmV2ZXIgYmUgcmVhZC5cbiAgICovXG4gIHJlYWRvbmx5IF8/OiBuZXZlcjtcbn1cblxuLyoqXG4gKiBSdW50aW1lIGxpbmsgaW5mb3JtYXRpb24gZm9yIFBpcGVzLlxuICpcbiAqIFRoaXMgaXMgaW50ZXJuYWwgZGF0YSBzdHJ1Y3R1cmUgdXNlZCBieSB0aGUgcmVuZGVyZXIgdG8gbGlua1xuICogcGlwZXMgaW50byB0ZW1wbGF0ZXMuXG4gKlxuICogTk9URTogQWx3YXlzIHVzZSBgZGVmaW5lUGlwZWAgZnVuY3Rpb24gdG8gY3JlYXRlIHRoaXMgb2JqZWN0LFxuICogbmV2ZXIgY3JlYXRlIHRoZSBvYmplY3QgZGlyZWN0bHkgc2luY2UgdGhlIHNoYXBlIG9mIHRoaXMgb2JqZWN0XG4gKiBjYW4gY2hhbmdlIGJldHdlZW4gdmVyc2lvbnMuXG4gKlxuICogU2VlOiB7QGxpbmsgZGVmaW5lUGlwZX1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQaXBlRGVmPFQ+IHtcbiAgLyoqXG4gICAqIFBpcGUgbmFtZS5cbiAgICpcbiAgICogVXNlZCB0byByZXNvbHZlIHBpcGUgaW4gdGVtcGxhdGVzLlxuICAgKi9cbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBGYWN0b3J5IGZ1bmN0aW9uIHVzZWQgdG8gY3JlYXRlIGEgbmV3IHBpcGUgaW5zdGFuY2UuXG4gICAqL1xuICBmYWN0b3J5OiBGYWN0b3J5Rm48VD47XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZSBwaXBlIGlzIHB1cmUuXG4gICAqXG4gICAqIFB1cmUgcGlwZXMgcmVzdWx0IG9ubHkgZGVwZW5kcyBvbiB0aGUgcGlwZSBpbnB1dCBhbmQgbm90IG9uIGludGVybmFsXG4gICAqIHN0YXRlIG9mIHRoZSBwaXBlLlxuICAgKi9cbiAgcmVhZG9ubHkgcHVyZTogYm9vbGVhbjtcblxuICAvKiBUaGUgZm9sbG93aW5nIGFyZSBsaWZlY3ljbGUgaG9va3MgZm9yIHRoaXMgcGlwZSAqL1xuICBvbkRlc3Ryb3k6ICgoKSA9PiB2b2lkKXxudWxsO1xufVxuXG4vKipcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCB0eXBlIM6UUGlwZURlZldpdGhNZXRhPFQsIE5hbWUgZXh0ZW5kcyBzdHJpbmc+ID0gUGlwZURlZjxUPjtcblxuZXhwb3J0IGludGVyZmFjZSBEaXJlY3RpdmVEZWZGZWF0dXJlIHtcbiAgPFQ+KGRpcmVjdGl2ZURlZjogRGlyZWN0aXZlRGVmPFQ+KTogdm9pZDtcbiAgLyoqXG4gICAqIE1hcmtzIGEgZmVhdHVyZSBhcyBzb21ldGhpbmcgdGhhdCB7QGxpbmsgSW5oZXJpdERlZmluaXRpb25GZWF0dXJlfSB3aWxsIGV4ZWN1dGVcbiAgICogZHVyaW5nIGluaGVyaXRhbmNlLlxuICAgKlxuICAgKiBOT1RFOiBETyBOT1QgU0VUIElOIFJPT1QgT0YgTU9EVUxFISBEb2luZyBzbyB3aWxsIHJlc3VsdCBpbiB0cmVlLXNoYWtlcnMvYnVuZGxlcnNcbiAgICogaWRlbnRpZnlpbmcgdGhlIGNoYW5nZSBhcyBhIHNpZGUgZWZmZWN0LCBhbmQgdGhlIGZlYXR1cmUgd2lsbCBiZSBpbmNsdWRlZCBpblxuICAgKiBldmVyeSBidW5kbGUuXG4gICAqL1xuICBuZ0luaGVyaXQ/OiB0cnVlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbXBvbmVudERlZkZlYXR1cmUge1xuICA8VD4oY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8VD4pOiB2b2lkO1xuICAvKipcbiAgICogTWFya3MgYSBmZWF0dXJlIGFzIHNvbWV0aGluZyB0aGF0IHtAbGluayBJbmhlcml0RGVmaW5pdGlvbkZlYXR1cmV9IHdpbGwgZXhlY3V0ZVxuICAgKiBkdXJpbmcgaW5oZXJpdGFuY2UuXG4gICAqXG4gICAqIE5PVEU6IERPIE5PVCBTRVQgSU4gUk9PVCBPRiBNT0RVTEUhIERvaW5nIHNvIHdpbGwgcmVzdWx0IGluIHRyZWUtc2hha2Vycy9idW5kbGVyc1xuICAgKiBpZGVudGlmeWluZyB0aGUgY2hhbmdlIGFzIGEgc2lkZSBlZmZlY3QsIGFuZCB0aGUgZmVhdHVyZSB3aWxsIGJlIGluY2x1ZGVkIGluXG4gICAqIGV2ZXJ5IGJ1bmRsZS5cbiAgICovXG4gIG5nSW5oZXJpdD86IHRydWU7XG59XG5cblxuLyoqXG4gKiBUeXBlIHVzZWQgZm9yIGRpcmVjdGl2ZURlZnMgb24gY29tcG9uZW50IGRlZmluaXRpb24uXG4gKlxuICogVGhlIGZ1bmN0aW9uIGlzIG5lY2Vzc2FyeSB0byBiZSBhYmxlIHRvIHN1cHBvcnQgZm9yd2FyZCBkZWNsYXJhdGlvbnMuXG4gKi9cbmV4cG9ydCB0eXBlIERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnkgPSAoKCkgPT4gRGlyZWN0aXZlRGVmTGlzdCkgfCBEaXJlY3RpdmVEZWZMaXN0O1xuXG5leHBvcnQgdHlwZSBEaXJlY3RpdmVEZWZMaXN0ID0gKERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55PilbXTtcblxuZXhwb3J0IHR5cGUgRGlyZWN0aXZlVHlwZXNPckZhY3RvcnkgPSAoKCkgPT4gRGlyZWN0aXZlVHlwZUxpc3QpIHwgRGlyZWN0aXZlVHlwZUxpc3Q7XG5cbmV4cG9ydCB0eXBlIERpcmVjdGl2ZVR5cGVMaXN0ID1cbiAgICAoRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+fFxuICAgICBUeXBlPGFueT4vKiBUeXBlIGFzIHdvcmthcm91bmQgZm9yOiBNaWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvNDg4MSAqLylbXTtcblxuZXhwb3J0IHR5cGUgSG9zdEJpbmRpbmdzRnVuY3Rpb248VD4gPVxuICAgIDxVIGV4dGVuZHMgVD4ocmY6IFJlbmRlckZsYWdzLCBjdHg6IFUsIGVsZW1lbnRJbmRleDogbnVtYmVyKSA9PiB2b2lkO1xuXG4vKipcbiAqIFR5cGUgdXNlZCBmb3IgUGlwZURlZnMgb24gY29tcG9uZW50IGRlZmluaXRpb24uXG4gKlxuICogVGhlIGZ1bmN0aW9uIGlzIG5lY2Vzc2FyeSB0byBiZSBhYmxlIHRvIHN1cHBvcnQgZm9yd2FyZCBkZWNsYXJhdGlvbnMuXG4gKi9cbmV4cG9ydCB0eXBlIFBpcGVEZWZMaXN0T3JGYWN0b3J5ID0gKCgpID0+IFBpcGVEZWZMaXN0KSB8IFBpcGVEZWZMaXN0O1xuXG5leHBvcnQgdHlwZSBQaXBlRGVmTGlzdCA9IFBpcGVEZWY8YW55PltdO1xuXG5leHBvcnQgdHlwZSBQaXBlVHlwZXNPckZhY3RvcnkgPSAoKCkgPT4gRGlyZWN0aXZlVHlwZUxpc3QpIHwgRGlyZWN0aXZlVHlwZUxpc3Q7XG5cbmV4cG9ydCB0eXBlIFBpcGVUeXBlTGlzdCA9XG4gICAgKFBpcGVEZWY8YW55PnwgVHlwZTxhbnk+LyogVHlwZSBhcyB3b3JrYXJvdW5kIGZvcjogTWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzQ4ODEgKi8pW107XG5cblxuLy8gTm90ZTogVGhpcyBoYWNrIGlzIG5lY2Vzc2FyeSBzbyB3ZSBkb24ndCBlcnJvbmVvdXNseSBnZXQgYSBjaXJjdWxhciBkZXBlbmRlbmN5XG4vLyBmYWlsdXJlIGJhc2VkIG9uIHR5cGVzLlxuZXhwb3J0IGNvbnN0IHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkID0gMTtcbiJdfQ==