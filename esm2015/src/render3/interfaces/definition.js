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
 * This is an internal data structure used by the renderer to determine what inputs
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
    /**
     * Function to create and refresh content queries associated with a given directive.
     * @type {?}
     */
    ΔBaseDef.prototype.contentQueries;
    /**
     * Query-related instructions for a directive. Note that while directives don't have a
     * view and as such view queries won't necessarily do anything, there might be
     * components that extend the directive.
     * @type {?}
     */
    ΔBaseDef.prototype.viewQuery;
    /**
     * Refreshes host bindings on the associated directive.
     * @type {?}
     */
    ΔBaseDef.prototype.hostBindings;
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
     * Ivy runtime uses this place to store the computed tView for the component. This gets filled on
     * the first run of component.
     * @type {?}
     */
    ComponentDef.prototype.tView;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmaW5pdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9kZWZpbml0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUE2REUsNkVBQTZFO0lBQzdFLFNBQWE7SUFFYiw2REFBNkQ7SUFDN0QsU0FBYTs7Ozs7Ozs7O0FBT2YsbUNBQTRFOzs7SUFBeEIsdUNBQXNCOzs7Ozs7OztBQU0xRSxtQ0FBNEU7OztJQUF4Qix1Q0FBc0I7Ozs7SUFFckMsZUFBbUI7Ozs7Ozs7OztBQU14RCw4QkFBa0U7OztJQUFuQiw2QkFBaUI7Ozs7Ozs7Ozs7Ozs7OztBQW9CaEUsOEJBcUNDOzs7Ozs7OztJQS9CQywwQkFBMEM7Ozs7OztJQU0xQyxrQ0FBa0Q7Ozs7Ozs7SUFPbEQsMkJBQTJDOzs7OztJQUszQyxrQ0FBK0M7Ozs7Ozs7SUFPL0MsNkJBQXVDOzs7OztJQUt2QyxnQ0FBMkM7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlCN0Msa0NBeUNDOzs7Ozs7SUF2Q0MsNEJBQWM7Ozs7O0lBR2QseUNBRW9COzs7OztJQUdwQixpQ0FBb0M7Ozs7O0lBS3BDLGdDQUFpQzs7Ozs7SUFLakMsK0JBQXNCOztJQUd0QixpQ0FBNkI7O0lBQzdCLDhCQUEwQjs7SUFDMUIsK0JBQTJCOztJQUMzQix3Q0FBb0M7O0lBQ3BDLDJDQUF1Qzs7SUFDdkMscUNBQWlDOztJQUNqQyx3Q0FBb0M7O0lBQ3BDLGlDQUE2Qjs7Ozs7SUFLN0IsZ0NBQThDOztJQUU5QyxnQ0FHNEM7Ozs7Ozs7Ozs7Ozs7Ozs7QUFzQjlDLGtDQStGQzs7Ozs7O0lBM0ZDLDBCQUFvQjs7Ozs7SUFLcEIsZ0NBQXdDOzs7OztJQUt4QywwQ0FBdUM7Ozs7O0lBS3ZDLDhCQUEwQjs7Ozs7Ozs7SUFTMUIsOEJBQXdCOzs7Ozs7OztJQVF4Qiw0QkFBc0I7Ozs7O0lBS3RCLGlDQUF1Qzs7Ozs7Ozs7Ozs7SUFXdkMscUNBQTBDOzs7Ozs7SUFNMUMsNEJBQXFDOzs7OztJQUdyQyw4QkFBeUI7Ozs7Ozs7O0lBUXpCLHFDQUE4Qzs7Ozs7Ozs7SUFROUMsZ0NBQW9DOzs7OztJQUtwQywrQkFBK0I7Ozs7OztJQU0vQiw2QkFBa0I7Ozs7OztJQU1sQix5QkFBbUI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFlckIsNkJBdUJDOzs7Ozs7OztJQWpCQyx1QkFBc0I7Ozs7O0lBS3RCLDBCQUFzQjs7Ozs7Ozs7SUFRdEIsdUJBQXVCOztJQUd2Qiw0QkFBNkI7Ozs7O0FBUS9CLHlDQVdDOzs7Ozs7Ozs7OztJQURDLHdDQUFpQjs7Ozs7O0FBR25CLHlDQVdDOzs7Ozs7Ozs7OztJQURDLHdDQUFpQjs7Ozs7O0FBdUNuQixNQUFNLE9BQU8sNkJBQTZCLEdBQUcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTY2hlbWFNZXRhZGF0YSwgVmlld0VuY2Fwc3VsYXRpb259IGZyb20gJy4uLy4uL2NvcmUnO1xuaW1wb3J0IHtQcm9jZXNzUHJvdmlkZXJzRnVuY3Rpb259IGZyb20gJy4uLy4uL2RpL2ludGVyZmFjZS9wcm92aWRlcic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Q3NzU2VsZWN0b3JMaXN0fSBmcm9tICcuL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtUVmlld30gZnJvbSAnLi92aWV3JztcblxuXG4vKipcbiAqIERlZmluaXRpb24gb2Ygd2hhdCBhIHRlbXBsYXRlIHJlbmRlcmluZyBmdW5jdGlvbiBzaG91bGQgbG9vayBsaWtlIGZvciBhIGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IHR5cGUgQ29tcG9uZW50VGVtcGxhdGU8VD4gPSB7XG4gIC8vIE5vdGU6IHRoZSBjdHggcGFyYW1ldGVyIGlzIHR5cGVkIGFzIFR8VSwgYXMgdXNpbmcgb25seSBVIHdvdWxkIHByZXZlbnQgYSB0ZW1wbGF0ZSB3aXRoXG4gIC8vIGUuZy4gY3R4OiB7fSBmcm9tIGJlaW5nIGFzc2lnbmVkIHRvIENvbXBvbmVudFRlbXBsYXRlPGFueT4gYXMgVHlwZVNjcmlwdCB3b24ndCBpbmZlciBVID0gYW55XG4gIC8vIGluIHRoYXQgc2NlbmFyaW8uIEJ5IGluY2x1ZGluZyBUIHRoaXMgaW5jb21wYXRpYmlsaXR5IGlzIHJlc29sdmVkLlxuICA8VSBleHRlbmRzIFQ+KHJmOiBSZW5kZXJGbGFncywgY3R4OiBUIHwgVSk6IHZvaWQ7XG59O1xuXG4vKipcbiAqIERlZmluaXRpb24gb2Ygd2hhdCBhIHZpZXcgcXVlcmllcyBmdW5jdGlvbiBzaG91bGQgbG9vayBsaWtlLlxuICovXG5leHBvcnQgdHlwZSBWaWV3UXVlcmllc0Z1bmN0aW9uPFQ+ID0gPFUgZXh0ZW5kcyBUPihyZjogUmVuZGVyRmxhZ3MsIGN0eDogVSkgPT4gdm9pZDtcblxuLyoqXG4gKiBEZWZpbml0aW9uIG9mIHdoYXQgYSBjb250ZW50IHF1ZXJpZXMgZnVuY3Rpb24gc2hvdWxkIGxvb2sgbGlrZS5cbiAqL1xuZXhwb3J0IHR5cGUgQ29udGVudFF1ZXJpZXNGdW5jdGlvbjxUPiA9XG4gICAgPFUgZXh0ZW5kcyBUPihyZjogUmVuZGVyRmxhZ3MsIGN0eDogVSwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcikgPT4gdm9pZDtcblxuLyoqXG4gKiBEZWZpbml0aW9uIG9mIHdoYXQgYSBmYWN0b3J5IGZ1bmN0aW9uIHNob3VsZCBsb29rIGxpa2UuXG4gKi9cbmV4cG9ydCB0eXBlIEZhY3RvcnlGbjxUPiA9IHtcbiAgLyoqXG4gICAqIFN1YmNsYXNzZXMgd2l0aG91dCBhbiBleHBsaWNpdCBjb25zdHJ1Y3RvciBjYWxsIHRocm91Z2ggdG8gdGhlIGZhY3Rvcnkgb2YgdGhlaXIgYmFzZVxuICAgKiBkZWZpbml0aW9uLCBwcm92aWRpbmcgaXQgd2l0aCB0aGVpciBvd24gY29uc3RydWN0b3IgdG8gaW5zdGFudGlhdGUuXG4gICAqL1xuICA8VSBleHRlbmRzIFQ+KHQ6IFR5cGU8VT4pOiBVO1xuXG4gIC8qKlxuICAgKiBJZiBubyBjb25zdHJ1Y3RvciB0byBpbnN0YW50aWF0ZSBpcyBwcm92aWRlZCwgYW4gaW5zdGFuY2Ugb2YgdHlwZSBUIGl0c2VsZiBpcyBjcmVhdGVkLlxuICAgKi9cbiAgKHQ6IG51bGwpOiBUO1xufTtcblxuLyoqXG4gKiBGbGFncyBwYXNzZWQgaW50byB0ZW1wbGF0ZSBmdW5jdGlvbnMgdG8gZGV0ZXJtaW5lIHdoaWNoIGJsb2NrcyAoaS5lLiBjcmVhdGlvbiwgdXBkYXRlKVxuICogc2hvdWxkIGJlIGV4ZWN1dGVkLlxuICpcbiAqIFR5cGljYWxseSwgYSB0ZW1wbGF0ZSBydW5zIGJvdGggdGhlIGNyZWF0aW9uIGJsb2NrIGFuZCB0aGUgdXBkYXRlIGJsb2NrIG9uIGluaXRpYWxpemF0aW9uIGFuZFxuICogc3Vic2VxdWVudCBydW5zIG9ubHkgZXhlY3V0ZSB0aGUgdXBkYXRlIGJsb2NrLiBIb3dldmVyLCBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzIHJlcXVpcmUgdGhhdFxuICogdGhlIGNyZWF0aW9uIGJsb2NrIGJlIGV4ZWN1dGVkIHNlcGFyYXRlbHkgZnJvbSB0aGUgdXBkYXRlIGJsb2NrIChmb3IgYmFja3dhcmRzIGNvbXBhdCkuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFJlbmRlckZsYWdzIHtcbiAgLyogV2hldGhlciB0byBydW4gdGhlIGNyZWF0aW9uIGJsb2NrIChlLmcuIGNyZWF0ZSBlbGVtZW50cyBhbmQgZGlyZWN0aXZlcykgKi9cbiAgQ3JlYXRlID0gMGIwMSxcblxuICAvKiBXaGV0aGVyIHRvIHJ1biB0aGUgdXBkYXRlIGJsb2NrIChlLmcuIHJlZnJlc2ggYmluZGluZ3MpICovXG4gIFVwZGF0ZSA9IDBiMTBcbn1cblxuLyoqXG4gKiBBIHN1YmNsYXNzIG9mIGBUeXBlYCB3aGljaCBoYXMgYSBzdGF0aWMgYG5nQ29tcG9uZW50RGVmYDpgQ29tcG9uZW50RGVmYCBmaWVsZCBtYWtpbmcgaXRcbiAqIGNvbnN1bWFibGUgZm9yIHJlbmRlcmluZy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnRUeXBlPFQ+IGV4dGVuZHMgVHlwZTxUPiB7IG5nQ29tcG9uZW50RGVmOiBuZXZlcjsgfVxuXG4vKipcbiAqIEEgc3ViY2xhc3Mgb2YgYFR5cGVgIHdoaWNoIGhhcyBhIHN0YXRpYyBgbmdEaXJlY3RpdmVEZWZgOmBEaXJlY3RpdmVEZWZgIGZpZWxkIG1ha2luZyBpdFxuICogY29uc3VtYWJsZSBmb3IgcmVuZGVyaW5nLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERpcmVjdGl2ZVR5cGU8VD4gZXh0ZW5kcyBUeXBlPFQ+IHsgbmdEaXJlY3RpdmVEZWY6IG5ldmVyOyB9XG5cbmV4cG9ydCBjb25zdCBlbnVtIERpcmVjdGl2ZURlZkZsYWdzIHtDb250ZW50UXVlcnkgPSAwYjEwfVxuXG4vKipcbiAqIEEgc3ViY2xhc3Mgb2YgYFR5cGVgIHdoaWNoIGhhcyBhIHN0YXRpYyBgbmdQaXBlRGVmYDpgUGlwZURlZmAgZmllbGQgbWFraW5nIGl0XG4gKiBjb25zdW1hYmxlIGZvciByZW5kZXJpbmcuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUGlwZVR5cGU8VD4gZXh0ZW5kcyBUeXBlPFQ+IHsgbmdQaXBlRGVmOiBuZXZlcjsgfVxuXG4vKipcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCB0eXBlIM6URGlyZWN0aXZlRGVmV2l0aE1ldGE8XG4gICAgVCwgU2VsZWN0b3IgZXh0ZW5kcyBzdHJpbmcsIEV4cG9ydEFzIGV4dGVuZHMgc3RyaW5nW10sIElucHV0TWFwIGV4dGVuZHN7W2tleTogc3RyaW5nXTogc3RyaW5nfSxcbiAgICBPdXRwdXRNYXAgZXh0ZW5kc3tba2V5OiBzdHJpbmddOiBzdHJpbmd9LCBRdWVyeUZpZWxkcyBleHRlbmRzIHN0cmluZ1tdPiA9IERpcmVjdGl2ZURlZjxUPjtcblxuLyoqXG4gKiBSdW50aW1lIGluZm9ybWF0aW9uIGZvciBjbGFzc2VzIHRoYXQgYXJlIGluaGVyaXRlZCBieSBjb21wb25lbnRzIG9yIGRpcmVjdGl2ZXNcbiAqIHRoYXQgYXJlbid0IGRlZmluZWQgYXMgY29tcG9uZW50cyBvciBkaXJlY3RpdmVzLlxuICpcbiAqIFRoaXMgaXMgYW4gaW50ZXJuYWwgZGF0YSBzdHJ1Y3R1cmUgdXNlZCBieSB0aGUgcmVuZGVyZXIgdG8gZGV0ZXJtaW5lIHdoYXQgaW5wdXRzXG4gKiBhbmQgb3V0cHV0cyBzaG91bGQgYmUgaW5oZXJpdGVkLlxuICpcbiAqIFNlZToge0BsaW5rIGRlZmluZUJhc2V9XG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSDOlEJhc2VEZWY8VD4ge1xuICAvKipcbiAgICogQSBkaWN0aW9uYXJ5IG1hcHBpbmcgdGhlIGlucHV0cycgbWluaWZpZWQgcHJvcGVydHkgbmFtZXMgdG8gdGhlaXIgcHVibGljIEFQSSBuYW1lcywgd2hpY2hcbiAgICogYXJlIHRoZWlyIGFsaWFzZXMgaWYgYW55LCBvciB0aGVpciBvcmlnaW5hbCB1bm1pbmlmaWVkIHByb3BlcnR5IG5hbWVzXG4gICAqIChhcyBpbiBgQElucHV0KCdhbGlhcycpIHByb3BlcnR5TmFtZTogYW55O2ApLlxuICAgKi9cbiAgcmVhZG9ubHkgaW5wdXRzOiB7W1AgaW4ga2V5b2YgVF06IHN0cmluZ307XG5cbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIFRoaXMgaXMgb25seSBoZXJlIGJlY2F1c2UgYE5nT25DaGFuZ2VzYCBpbmNvcnJlY3RseSB1c2VzIGRlY2xhcmVkIG5hbWUgaW5zdGVhZCBvZlxuICAgKiBwdWJsaWMgb3IgbWluaWZpZWQgbmFtZS5cbiAgICovXG4gIHJlYWRvbmx5IGRlY2xhcmVkSW5wdXRzOiB7W1AgaW4ga2V5b2YgVF06IHN0cmluZ307XG5cbiAgLyoqXG4gICAqIEEgZGljdGlvbmFyeSBtYXBwaW5nIHRoZSBvdXRwdXRzJyBtaW5pZmllZCBwcm9wZXJ0eSBuYW1lcyB0byB0aGVpciBwdWJsaWMgQVBJIG5hbWVzLCB3aGljaFxuICAgKiBhcmUgdGhlaXIgYWxpYXNlcyBpZiBhbnksIG9yIHRoZWlyIG9yaWdpbmFsIHVubWluaWZpZWQgcHJvcGVydHkgbmFtZXNcbiAgICogKGFzIGluIGBAT3V0cHV0KCdhbGlhcycpIHByb3BlcnR5TmFtZTogYW55O2ApLlxuICAgKi9cbiAgcmVhZG9ubHkgb3V0cHV0czoge1tQIGluIGtleW9mIFRdOiBzdHJpbmd9O1xuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0byBjcmVhdGUgYW5kIHJlZnJlc2ggY29udGVudCBxdWVyaWVzIGFzc29jaWF0ZWQgd2l0aCBhIGdpdmVuIGRpcmVjdGl2ZS5cbiAgICovXG4gIGNvbnRlbnRRdWVyaWVzOiBDb250ZW50UXVlcmllc0Z1bmN0aW9uPFQ+fG51bGw7XG5cbiAgLyoqXG4gICAqIFF1ZXJ5LXJlbGF0ZWQgaW5zdHJ1Y3Rpb25zIGZvciBhIGRpcmVjdGl2ZS4gTm90ZSB0aGF0IHdoaWxlIGRpcmVjdGl2ZXMgZG9uJ3QgaGF2ZSBhXG4gICAqIHZpZXcgYW5kIGFzIHN1Y2ggdmlldyBxdWVyaWVzIHdvbid0IG5lY2Vzc2FyaWx5IGRvIGFueXRoaW5nLCB0aGVyZSBtaWdodCBiZVxuICAgKiBjb21wb25lbnRzIHRoYXQgZXh0ZW5kIHRoZSBkaXJlY3RpdmUuXG4gICAqL1xuICB2aWV3UXVlcnk6IFZpZXdRdWVyaWVzRnVuY3Rpb248VD58bnVsbDtcblxuICAvKipcbiAgICogUmVmcmVzaGVzIGhvc3QgYmluZGluZ3Mgb24gdGhlIGFzc29jaWF0ZWQgZGlyZWN0aXZlLlxuICAgKi9cbiAgaG9zdEJpbmRpbmdzOiBIb3N0QmluZGluZ3NGdW5jdGlvbjxUPnxudWxsO1xufVxuXG4vKipcbiAqIFJ1bnRpbWUgbGluayBpbmZvcm1hdGlvbiBmb3IgRGlyZWN0aXZlcy5cbiAqXG4gKiBUaGlzIGlzIGludGVybmFsIGRhdGEgc3RydWN0dXJlIHVzZWQgYnkgdGhlIHJlbmRlciB0byBsaW5rXG4gKiBkaXJlY3RpdmVzIGludG8gdGVtcGxhdGVzLlxuICpcbiAqIE5PVEU6IEFsd2F5cyB1c2UgYGRlZmluZURpcmVjdGl2ZWAgZnVuY3Rpb24gdG8gY3JlYXRlIHRoaXMgb2JqZWN0LFxuICogbmV2ZXIgY3JlYXRlIHRoZSBvYmplY3QgZGlyZWN0bHkgc2luY2UgdGhlIHNoYXBlIG9mIHRoaXMgb2JqZWN0XG4gKiBjYW4gY2hhbmdlIGJldHdlZW4gdmVyc2lvbnMuXG4gKlxuICogQHBhcmFtIFNlbGVjdG9yIHR5cGUgbWV0YWRhdGEgc3BlY2lmeWluZyB0aGUgc2VsZWN0b3Igb2YgdGhlIGRpcmVjdGl2ZSBvciBjb21wb25lbnRcbiAqXG4gKiBTZWU6IHtAbGluayBkZWZpbmVEaXJlY3RpdmV9XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGlyZWN0aXZlRGVmPFQ+IGV4dGVuZHMgzpRCYXNlRGVmPFQ+IHtcbiAgLyoqIFRva2VuIHJlcHJlc2VudGluZyB0aGUgZGlyZWN0aXZlLiBVc2VkIGJ5IERJLiAqL1xuICB0eXBlOiBUeXBlPFQ+O1xuXG4gIC8qKiBGdW5jdGlvbiB0aGF0IHJlc29sdmVzIHByb3ZpZGVycyBhbmQgcHVibGlzaGVzIHRoZW0gaW50byB0aGUgREkgc3lzdGVtLiAqL1xuICBwcm92aWRlcnNSZXNvbHZlcjpcbiAgICAgICg8VSBleHRlbmRzIFQ+KGRlZjogRGlyZWN0aXZlRGVmPFU+LCBwcm9jZXNzUHJvdmlkZXJzRm4/OiBQcm9jZXNzUHJvdmlkZXJzRnVuY3Rpb24pID0+XG4gICAgICAgICAgIHZvaWQpfG51bGw7XG5cbiAgLyoqIFRoZSBzZWxlY3RvcnMgdGhhdCB3aWxsIGJlIHVzZWQgdG8gbWF0Y2ggbm9kZXMgdG8gdGhpcyBkaXJlY3RpdmUuICovXG4gIHJlYWRvbmx5IHNlbGVjdG9yczogQ3NzU2VsZWN0b3JMaXN0O1xuXG4gIC8qKlxuICAgKiBOYW1lIHVuZGVyIHdoaWNoIHRoZSBkaXJlY3RpdmUgaXMgZXhwb3J0ZWQgKGZvciB1c2Ugd2l0aCBsb2NhbCByZWZlcmVuY2VzIGluIHRlbXBsYXRlKVxuICAgKi9cbiAgcmVhZG9ubHkgZXhwb3J0QXM6IHN0cmluZ1tdfG51bGw7XG5cbiAgLyoqXG4gICAqIEZhY3RvcnkgZnVuY3Rpb24gdXNlZCB0byBjcmVhdGUgYSBuZXcgZGlyZWN0aXZlIGluc3RhbmNlLlxuICAgKi9cbiAgZmFjdG9yeTogRmFjdG9yeUZuPFQ+O1xuXG4gIC8qIFRoZSBmb2xsb3dpbmcgYXJlIGxpZmVjeWNsZSBob29rcyBmb3IgdGhpcyBjb21wb25lbnQgKi9cbiAgb25DaGFuZ2VzOiAoKCkgPT4gdm9pZCl8bnVsbDtcbiAgb25Jbml0OiAoKCkgPT4gdm9pZCl8bnVsbDtcbiAgZG9DaGVjazogKCgpID0+IHZvaWQpfG51bGw7XG4gIGFmdGVyQ29udGVudEluaXQ6ICgoKSA9PiB2b2lkKXxudWxsO1xuICBhZnRlckNvbnRlbnRDaGVja2VkOiAoKCkgPT4gdm9pZCl8bnVsbDtcbiAgYWZ0ZXJWaWV3SW5pdDogKCgpID0+IHZvaWQpfG51bGw7XG4gIGFmdGVyVmlld0NoZWNrZWQ6ICgoKSA9PiB2b2lkKXxudWxsO1xuICBvbkRlc3Ryb3k6ICgoKSA9PiB2b2lkKXxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgZmVhdHVyZXMgYXBwbGllZCB0byB0aGlzIGRpcmVjdGl2ZVxuICAgKi9cbiAgcmVhZG9ubHkgZmVhdHVyZXM6IERpcmVjdGl2ZURlZkZlYXR1cmVbXXxudWxsO1xuXG4gIHNldElucHV0OlxuICAgICAgKDxVIGV4dGVuZHMgVD4oXG4gICAgICAgICAgIHRoaXM6IERpcmVjdGl2ZURlZjxVPiwgaW5zdGFuY2U6IFUsIHZhbHVlOiBhbnksIHB1YmxpY05hbWU6IHN0cmluZyxcbiAgICAgICAgICAgcHJpdmF0ZU5hbWU6IHN0cmluZykgPT4gdm9pZCl8bnVsbDtcbn1cblxuLyoqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgdHlwZSDOlENvbXBvbmVudERlZldpdGhNZXRhPFxuICAgIFQsIFNlbGVjdG9yIGV4dGVuZHMgU3RyaW5nLCBFeHBvcnRBcyBleHRlbmRzIHN0cmluZ1tdLCBJbnB1dE1hcCBleHRlbmRze1trZXk6IHN0cmluZ106IHN0cmluZ30sXG4gICAgT3V0cHV0TWFwIGV4dGVuZHN7W2tleTogc3RyaW5nXTogc3RyaW5nfSwgUXVlcnlGaWVsZHMgZXh0ZW5kcyBzdHJpbmdbXT4gPSBDb21wb25lbnREZWY8VD47XG5cbi8qKlxuICogUnVudGltZSBsaW5rIGluZm9ybWF0aW9uIGZvciBDb21wb25lbnRzLlxuICpcbiAqIFRoaXMgaXMgaW50ZXJuYWwgZGF0YSBzdHJ1Y3R1cmUgdXNlZCBieSB0aGUgcmVuZGVyIHRvIGxpbmtcbiAqIGNvbXBvbmVudHMgaW50byB0ZW1wbGF0ZXMuXG4gKlxuICogTk9URTogQWx3YXlzIHVzZSBgZGVmaW5lQ29tcG9uZW50YCBmdW5jdGlvbiB0byBjcmVhdGUgdGhpcyBvYmplY3QsXG4gKiBuZXZlciBjcmVhdGUgdGhlIG9iamVjdCBkaXJlY3RseSBzaW5jZSB0aGUgc2hhcGUgb2YgdGhpcyBvYmplY3RcbiAqIGNhbiBjaGFuZ2UgYmV0d2VlbiB2ZXJzaW9ucy5cbiAqXG4gKiBTZWU6IHtAbGluayBkZWZpbmVDb21wb25lbnR9XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcG9uZW50RGVmPFQ+IGV4dGVuZHMgRGlyZWN0aXZlRGVmPFQ+IHtcbiAgLyoqXG4gICAqIFJ1bnRpbWUgdW5pcXVlIGNvbXBvbmVudCBJRC5cbiAgICovXG4gIHJlYWRvbmx5IGlkOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSBWaWV3IHRlbXBsYXRlIG9mIHRoZSBjb21wb25lbnQuXG4gICAqL1xuICByZWFkb25seSB0ZW1wbGF0ZTogQ29tcG9uZW50VGVtcGxhdGU8VD47XG5cbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIGBuZ0NvbnRlbnRbc2VsZWN0b3JdYCB2YWx1ZXMgdGhhdCB3ZXJlIGZvdW5kIGluIHRoZSB0ZW1wbGF0ZS5cbiAgICovXG4gIHJlYWRvbmx5IG5nQ29udGVudFNlbGVjdG9ycz86IHN0cmluZ1tdO1xuXG4gIC8qKlxuICAgKiBBIHNldCBvZiBzdHlsZXMgdGhhdCB0aGUgY29tcG9uZW50IG5lZWRzIHRvIGJlIHByZXNlbnQgZm9yIGNvbXBvbmVudCB0byByZW5kZXIgY29ycmVjdGx5LlxuICAgKi9cbiAgcmVhZG9ubHkgc3R5bGVzOiBzdHJpbmdbXTtcblxuICAvKipcbiAgICogVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGluIHRoaXMgY29tcG9uZW50IHRlbXBsYXRlLlxuICAgKlxuICAgKiBVc2VkIHRvIGNhbGN1bGF0ZSB0aGUgbGVuZ3RoIG9mIHRoZSBjb21wb25lbnQncyBMVmlldyBhcnJheSwgc28gd2VcbiAgICogY2FuIHByZS1maWxsIHRoZSBhcnJheSBhbmQgc2V0IHRoZSBiaW5kaW5nIHN0YXJ0IGluZGV4LlxuICAgKi9cbiAgLy8gVE9ETyhrYXJhKTogcmVtb3ZlIHF1ZXJpZXMgZnJvbSB0aGlzIGNvdW50XG4gIHJlYWRvbmx5IGNvbnN0czogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgbnVtYmVyIG9mIGJpbmRpbmdzIGluIHRoaXMgY29tcG9uZW50IHRlbXBsYXRlIChpbmNsdWRpbmcgcHVyZSBmbiBiaW5kaW5ncykuXG4gICAqXG4gICAqIFVzZWQgdG8gY2FsY3VsYXRlIHRoZSBsZW5ndGggb2YgdGhlIGNvbXBvbmVudCdzIExWaWV3IGFycmF5LCBzbyB3ZVxuICAgKiBjYW4gcHJlLWZpbGwgdGhlIGFycmF5IGFuZCBzZXQgdGhlIGhvc3QgYmluZGluZyBzdGFydCBpbmRleC5cbiAgICovXG4gIHJlYWRvbmx5IHZhcnM6IG51bWJlcjtcblxuICAvKipcbiAgICogUXVlcnktcmVsYXRlZCBpbnN0cnVjdGlvbnMgZm9yIGEgY29tcG9uZW50LlxuICAgKi9cbiAgdmlld1F1ZXJ5OiBWaWV3UXVlcmllc0Z1bmN0aW9uPFQ+fG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSB2aWV3IGVuY2Fwc3VsYXRpb24gdHlwZSwgd2hpY2ggZGV0ZXJtaW5lcyBob3cgc3R5bGVzIGFyZSBhcHBsaWVkIHRvXG4gICAqIERPTSBlbGVtZW50cy4gT25lIG9mXG4gICAqIC0gYEVtdWxhdGVkYCAoZGVmYXVsdCk6IEVtdWxhdGUgbmF0aXZlIHNjb3Bpbmcgb2Ygc3R5bGVzLlxuICAgKiAtIGBOYXRpdmVgOiBVc2UgdGhlIG5hdGl2ZSBlbmNhcHN1bGF0aW9uIG1lY2hhbmlzbSBvZiB0aGUgcmVuZGVyZXIuXG4gICAqIC0gYFNoYWRvd0RvbWA6IFVzZSBtb2Rlcm4gW1NoYWRvd0RPTV0oaHR0cHM6Ly93M2MuZ2l0aHViLmlvL3dlYmNvbXBvbmVudHMvc3BlYy9zaGFkb3cvKSBhbmRcbiAgICogICBjcmVhdGUgYSBTaGFkb3dSb290IGZvciBjb21wb25lbnQncyBob3N0IGVsZW1lbnQuXG4gICAqIC0gYE5vbmVgOiBEbyBub3QgcHJvdmlkZSBhbnkgdGVtcGxhdGUgb3Igc3R5bGUgZW5jYXBzdWxhdGlvbi5cbiAgICovXG4gIHJlYWRvbmx5IGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uO1xuXG4gIC8qKlxuICAgKiBEZWZpbmVzIGFyYml0cmFyeSBkZXZlbG9wZXItZGVmaW5lZCBkYXRhIHRvIGJlIHN0b3JlZCBvbiBhIHJlbmRlcmVyIGluc3RhbmNlLlxuICAgKiBUaGlzIGlzIHVzZWZ1bCBmb3IgcmVuZGVyZXJzIHRoYXQgZGVsZWdhdGUgdG8gb3RoZXIgcmVuZGVyZXJzLlxuICAgKi9cbiAgcmVhZG9ubHkgZGF0YToge1traW5kOiBzdHJpbmddOiBhbnl9O1xuXG4gIC8qKiBXaGV0aGVyIG9yIG5vdCB0aGlzIGNvbXBvbmVudCdzIENoYW5nZURldGVjdGlvblN0cmF0ZWd5IGlzIE9uUHVzaCAqL1xuICByZWFkb25seSBvblB1c2g6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFJlZ2lzdHJ5IG9mIGRpcmVjdGl2ZXMgYW5kIGNvbXBvbmVudHMgdGhhdCBtYXkgYmUgZm91bmQgaW4gdGhpcyB2aWV3LlxuICAgKlxuICAgKiBUaGUgcHJvcGVydHkgaXMgZWl0aGVyIGFuIGFycmF5IG9mIGBEaXJlY3RpdmVEZWZgcyBvciBhIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhlIGFycmF5IG9mXG4gICAqIGBEaXJlY3RpdmVEZWZgcy4gVGhlIGZ1bmN0aW9uIGlzIG5lY2Vzc2FyeSB0byBiZSBhYmxlIHRvIHN1cHBvcnQgZm9yd2FyZCBkZWNsYXJhdGlvbnMuXG4gICAqL1xuICBkaXJlY3RpdmVEZWZzOiBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5fG51bGw7XG5cbiAgLyoqXG4gICAqIFJlZ2lzdHJ5IG9mIHBpcGVzIHRoYXQgbWF5IGJlIGZvdW5kIGluIHRoaXMgdmlldy5cbiAgICpcbiAgICogVGhlIHByb3BlcnR5IGlzIGVpdGhlciBhbiBhcnJheSBvZiBgUGlwZURlZnNgcyBvciBhIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhlIGFycmF5IG9mXG4gICAqIGBQaXBlRGVmc2BzLiBUaGUgZnVuY3Rpb24gaXMgbmVjZXNzYXJ5IHRvIGJlIGFibGUgdG8gc3VwcG9ydCBmb3J3YXJkIGRlY2xhcmF0aW9ucy5cbiAgICovXG4gIHBpcGVEZWZzOiBQaXBlRGVmTGlzdE9yRmFjdG9yeXxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgc2V0IG9mIHNjaGVtYXMgdGhhdCBkZWNsYXJlIGVsZW1lbnRzIHRvIGJlIGFsbG93ZWQgaW4gdGhlIGNvbXBvbmVudCdzIHRlbXBsYXRlLlxuICAgKi9cbiAgc2NoZW1hczogU2NoZW1hTWV0YWRhdGFbXXxudWxsO1xuXG4gIC8qKlxuICAgKiBJdnkgcnVudGltZSB1c2VzIHRoaXMgcGxhY2UgdG8gc3RvcmUgdGhlIGNvbXB1dGVkIHRWaWV3IGZvciB0aGUgY29tcG9uZW50LiBUaGlzIGdldHMgZmlsbGVkIG9uXG4gICAqIHRoZSBmaXJzdCBydW4gb2YgY29tcG9uZW50LlxuICAgKi9cbiAgdFZpZXc6IFRWaWV3fG51bGw7XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gc3RvcmUgdGhlIHJlc3VsdCBvZiBgbm9TaWRlRWZmZWN0c2AgZnVuY3Rpb24gc28gdGhhdCBpdCBpcyBub3QgcmVtb3ZlZCBieSBjbG9zdXJlXG4gICAqIGNvbXBpbGVyLiBUaGUgcHJvcGVydHkgc2hvdWxkIG5ldmVyIGJlIHJlYWQuXG4gICAqL1xuICByZWFkb25seSBfPzogbmV2ZXI7XG59XG5cbi8qKlxuICogUnVudGltZSBsaW5rIGluZm9ybWF0aW9uIGZvciBQaXBlcy5cbiAqXG4gKiBUaGlzIGlzIGludGVybmFsIGRhdGEgc3RydWN0dXJlIHVzZWQgYnkgdGhlIHJlbmRlcmVyIHRvIGxpbmtcbiAqIHBpcGVzIGludG8gdGVtcGxhdGVzLlxuICpcbiAqIE5PVEU6IEFsd2F5cyB1c2UgYGRlZmluZVBpcGVgIGZ1bmN0aW9uIHRvIGNyZWF0ZSB0aGlzIG9iamVjdCxcbiAqIG5ldmVyIGNyZWF0ZSB0aGUgb2JqZWN0IGRpcmVjdGx5IHNpbmNlIHRoZSBzaGFwZSBvZiB0aGlzIG9iamVjdFxuICogY2FuIGNoYW5nZSBiZXR3ZWVuIHZlcnNpb25zLlxuICpcbiAqIFNlZToge0BsaW5rIGRlZmluZVBpcGV9XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUGlwZURlZjxUPiB7XG4gIC8qKlxuICAgKiBQaXBlIG5hbWUuXG4gICAqXG4gICAqIFVzZWQgdG8gcmVzb2x2ZSBwaXBlIGluIHRlbXBsYXRlcy5cbiAgICovXG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcblxuICAvKipcbiAgICogRmFjdG9yeSBmdW5jdGlvbiB1c2VkIHRvIGNyZWF0ZSBhIG5ldyBwaXBlIGluc3RhbmNlLlxuICAgKi9cbiAgZmFjdG9yeTogRmFjdG9yeUZuPFQ+O1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGUgcGlwZSBpcyBwdXJlLlxuICAgKlxuICAgKiBQdXJlIHBpcGVzIHJlc3VsdCBvbmx5IGRlcGVuZHMgb24gdGhlIHBpcGUgaW5wdXQgYW5kIG5vdCBvbiBpbnRlcm5hbFxuICAgKiBzdGF0ZSBvZiB0aGUgcGlwZS5cbiAgICovXG4gIHJlYWRvbmx5IHB1cmU6IGJvb2xlYW47XG5cbiAgLyogVGhlIGZvbGxvd2luZyBhcmUgbGlmZWN5Y2xlIGhvb2tzIGZvciB0aGlzIHBpcGUgKi9cbiAgb25EZXN0cm95OiAoKCkgPT4gdm9pZCl8bnVsbDtcbn1cblxuLyoqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgdHlwZSDOlFBpcGVEZWZXaXRoTWV0YTxULCBOYW1lIGV4dGVuZHMgc3RyaW5nPiA9IFBpcGVEZWY8VD47XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGlyZWN0aXZlRGVmRmVhdHVyZSB7XG4gIDxUPihkaXJlY3RpdmVEZWY6IERpcmVjdGl2ZURlZjxUPik6IHZvaWQ7XG4gIC8qKlxuICAgKiBNYXJrcyBhIGZlYXR1cmUgYXMgc29tZXRoaW5nIHRoYXQge0BsaW5rIEluaGVyaXREZWZpbml0aW9uRmVhdHVyZX0gd2lsbCBleGVjdXRlXG4gICAqIGR1cmluZyBpbmhlcml0YW5jZS5cbiAgICpcbiAgICogTk9URTogRE8gTk9UIFNFVCBJTiBST09UIE9GIE1PRFVMRSEgRG9pbmcgc28gd2lsbCByZXN1bHQgaW4gdHJlZS1zaGFrZXJzL2J1bmRsZXJzXG4gICAqIGlkZW50aWZ5aW5nIHRoZSBjaGFuZ2UgYXMgYSBzaWRlIGVmZmVjdCwgYW5kIHRoZSBmZWF0dXJlIHdpbGwgYmUgaW5jbHVkZWQgaW5cbiAgICogZXZlcnkgYnVuZGxlLlxuICAgKi9cbiAgbmdJbmhlcml0PzogdHJ1ZTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnREZWZGZWF0dXJlIHtcbiAgPFQ+KGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPFQ+KTogdm9pZDtcbiAgLyoqXG4gICAqIE1hcmtzIGEgZmVhdHVyZSBhcyBzb21ldGhpbmcgdGhhdCB7QGxpbmsgSW5oZXJpdERlZmluaXRpb25GZWF0dXJlfSB3aWxsIGV4ZWN1dGVcbiAgICogZHVyaW5nIGluaGVyaXRhbmNlLlxuICAgKlxuICAgKiBOT1RFOiBETyBOT1QgU0VUIElOIFJPT1QgT0YgTU9EVUxFISBEb2luZyBzbyB3aWxsIHJlc3VsdCBpbiB0cmVlLXNoYWtlcnMvYnVuZGxlcnNcbiAgICogaWRlbnRpZnlpbmcgdGhlIGNoYW5nZSBhcyBhIHNpZGUgZWZmZWN0LCBhbmQgdGhlIGZlYXR1cmUgd2lsbCBiZSBpbmNsdWRlZCBpblxuICAgKiBldmVyeSBidW5kbGUuXG4gICAqL1xuICBuZ0luaGVyaXQ/OiB0cnVlO1xufVxuXG5cbi8qKlxuICogVHlwZSB1c2VkIGZvciBkaXJlY3RpdmVEZWZzIG9uIGNvbXBvbmVudCBkZWZpbml0aW9uLlxuICpcbiAqIFRoZSBmdW5jdGlvbiBpcyBuZWNlc3NhcnkgdG8gYmUgYWJsZSB0byBzdXBwb3J0IGZvcndhcmQgZGVjbGFyYXRpb25zLlxuICovXG5leHBvcnQgdHlwZSBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5ID0gKCgpID0+IERpcmVjdGl2ZURlZkxpc3QpIHwgRGlyZWN0aXZlRGVmTGlzdDtcblxuZXhwb3J0IHR5cGUgRGlyZWN0aXZlRGVmTGlzdCA9IChEaXJlY3RpdmVEZWY8YW55PnwgQ29tcG9uZW50RGVmPGFueT4pW107XG5cbmV4cG9ydCB0eXBlIERpcmVjdGl2ZVR5cGVzT3JGYWN0b3J5ID0gKCgpID0+IERpcmVjdGl2ZVR5cGVMaXN0KSB8IERpcmVjdGl2ZVR5cGVMaXN0O1xuXG5leHBvcnQgdHlwZSBEaXJlY3RpdmVUeXBlTGlzdCA9XG4gICAgKERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55PnxcbiAgICAgVHlwZTxhbnk+LyogVHlwZSBhcyB3b3JrYXJvdW5kIGZvcjogTWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzQ4ODEgKi8pW107XG5cbmV4cG9ydCB0eXBlIEhvc3RCaW5kaW5nc0Z1bmN0aW9uPFQ+ID1cbiAgICA8VSBleHRlbmRzIFQ+KHJmOiBSZW5kZXJGbGFncywgY3R4OiBVLCBlbGVtZW50SW5kZXg6IG51bWJlcikgPT4gdm9pZDtcblxuLyoqXG4gKiBUeXBlIHVzZWQgZm9yIFBpcGVEZWZzIG9uIGNvbXBvbmVudCBkZWZpbml0aW9uLlxuICpcbiAqIFRoZSBmdW5jdGlvbiBpcyBuZWNlc3NhcnkgdG8gYmUgYWJsZSB0byBzdXBwb3J0IGZvcndhcmQgZGVjbGFyYXRpb25zLlxuICovXG5leHBvcnQgdHlwZSBQaXBlRGVmTGlzdE9yRmFjdG9yeSA9ICgoKSA9PiBQaXBlRGVmTGlzdCkgfCBQaXBlRGVmTGlzdDtcblxuZXhwb3J0IHR5cGUgUGlwZURlZkxpc3QgPSBQaXBlRGVmPGFueT5bXTtcblxuZXhwb3J0IHR5cGUgUGlwZVR5cGVzT3JGYWN0b3J5ID0gKCgpID0+IERpcmVjdGl2ZVR5cGVMaXN0KSB8IERpcmVjdGl2ZVR5cGVMaXN0O1xuXG5leHBvcnQgdHlwZSBQaXBlVHlwZUxpc3QgPVxuICAgIChQaXBlRGVmPGFueT58IFR5cGU8YW55Pi8qIFR5cGUgYXMgd29ya2Fyb3VuZCBmb3I6IE1pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy80ODgxICovKVtdO1xuXG5cbi8vIE5vdGU6IFRoaXMgaGFjayBpcyBuZWNlc3Nhcnkgc28gd2UgZG9uJ3QgZXJyb25lb3VzbHkgZ2V0IGEgY2lyY3VsYXIgZGVwZW5kZW5jeVxuLy8gZmFpbHVyZSBiYXNlZCBvbiB0eXBlcy5cbmV4cG9ydCBjb25zdCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCA9IDE7XG4iXX0=