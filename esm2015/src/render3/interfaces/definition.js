/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
 * @record
 * @template T
 */
export function BaseDef() { }
if (false) {
    /**
     * A dictionary mapping the inputs' minified property names to their public API names, which
     * are their aliases if any, or their original unminified property names
     * (as in `\@Input('alias') propertyName: any;`).
     * @type {?}
     */
    BaseDef.prototype.inputs;
    /**
     * @deprecated This is only here because `NgOnChanges` incorrectly uses declared name instead of
     * public or minified name.
     * @type {?}
     */
    BaseDef.prototype.declaredInputs;
    /**
     * A dictionary mapping the outputs' minified property names to their public API names, which
     * are their aliases if any, or their original unminified property names
     * (as in `\@Output('alias') propertyName: any;`).
     * @type {?}
     */
    BaseDef.prototype.outputs;
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
     * Function to create instances of content queries associated with a given directive.
     * @type {?}
     */
    DirectiveDef.prototype.contentQueries;
    /**
     * Refreshes content queries associated with directives in a given view
     * @type {?}
     */
    DirectiveDef.prototype.contentQueriesRefresh;
    /**
     * Refreshes host bindings on the associated directive.
     * @type {?}
     */
    DirectiveDef.prototype.hostBindings;
    /**
     * Static attributes to set on host element.
     *
     * Even indices: attribute name
     * Odd indices: attribute value
     * @type {?}
     */
    DirectiveDef.prototype.attributes;
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
    /** @type {?|undefined} */
    DirectiveDefFeature.prototype.ngInherit;
    /* Skipping unhandled member: <T>(directiveDef: DirectiveDef<T>): void;*/
}
/**
 * @record
 */
export function ComponentDefFeature() { }
if (false) {
    /** @type {?|undefined} */
    ComponentDefFeature.prototype.ngInherit;
    /* Skipping unhandled member: <T>(componentDef: ComponentDef<T>): void;*/
}
// Note: This hack is necessary so we don't erroneously get a circular dependency
// failure based on types.
/** @type {?} */
export const unusedValueExportToPlacateAjd = 1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmaW5pdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9kZWZpbml0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUFrQ0UsNkVBQTZFO0lBQzdFLFNBQWE7SUFFYiw2REFBNkQ7SUFDN0QsU0FBYTs7Ozs7Ozs7O0FBT2YsbUNBQTRFOzs7SUFBeEIsdUNBQXNCOzs7Ozs7OztBQU0xRSxtQ0FBNEU7OztJQUF4Qix1Q0FBc0I7Ozs7SUFFckMsZUFBbUI7Ozs7Ozs7OztBQU14RCw4QkFBa0U7OztJQUFuQiw2QkFBaUI7Ozs7Ozs7Ozs7Ozs7QUFlaEUsNkJBb0JDOzs7Ozs7OztJQWRDLHlCQUEwQzs7Ozs7O0lBTTFDLGlDQUE2Qzs7Ozs7OztJQU83QywwQkFBc0M7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlCeEMsa0NBb0RDOzs7Ozs7SUFsREMsNEJBQWM7Ozs7O0lBR2QseUNBQXlEOzs7OztJQUd6RCxpQ0FBb0M7Ozs7O0lBS3BDLGdDQUFpQzs7Ozs7SUFLakMsK0JBQWdDOzs7OztJQUtoQyxzQ0FBd0Q7Ozs7O0lBR3hELDZDQUFtRjs7Ozs7SUFHbkYsb0NBQTJDOzs7Ozs7OztJQVEzQyxrQ0FBbUM7O0lBR25DLDhCQUEwQjs7SUFDMUIsK0JBQTJCOztJQUMzQix3Q0FBb0M7O0lBQ3BDLDJDQUF1Qzs7SUFDdkMscUNBQWlDOztJQUNqQyx3Q0FBb0M7O0lBQ3BDLGlDQUE2Qjs7Ozs7SUFLN0IsZ0NBQThDOzs7Ozs7Ozs7Ozs7Ozs7O0FBbUJoRCxrQ0FxRkM7Ozs7OztJQWpGQywwQkFBb0I7Ozs7O0lBS3BCLGdDQUF3Qzs7Ozs7SUFLeEMsMENBQXVDOzs7OztJQUt2Qyw4QkFBMEI7Ozs7Ozs7O0lBUzFCLDhCQUF3Qjs7Ozs7Ozs7SUFReEIsNEJBQXNCOzs7OztJQUt0QixpQ0FBa0M7Ozs7Ozs7Ozs7O0lBV2xDLHFDQUEwQzs7Ozs7O0lBTTFDLDRCQUFxQzs7Ozs7SUFHckMsOEJBQXlCOzs7Ozs7OztJQVN6QixxQ0FBOEM7Ozs7Ozs7O0lBUTlDLGdDQUFvQzs7Ozs7O0lBTXBDLHlCQUFtQjs7Ozs7Ozs7Ozs7Ozs7OztBQWVyQiw2QkF1QkM7Ozs7Ozs7O0lBakJDLHVCQUFzQjs7Ozs7SUFLdEIsMEJBQWdDOzs7Ozs7OztJQVFoQyx1QkFBdUI7O0lBR3ZCLDRCQUE2Qjs7Ozs7QUFLL0IseUNBR0M7OztJQURDLHdDQUFpQjs7Ozs7O0FBR25CLHlDQUdDOzs7SUFEQyx3Q0FBaUI7Ozs7OztBQXNDbkIsTUFBTSxPQUFPLDZCQUE2QixHQUFHLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Vmlld0VuY2Fwc3VsYXRpb259IGZyb20gJy4uLy4uL2NvcmUnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0Nzc1NlbGVjdG9yTGlzdH0gZnJvbSAnLi9wcm9qZWN0aW9uJztcblxuXG4vKipcbiAqIERlZmluaXRpb24gb2Ygd2hhdCBhIHRlbXBsYXRlIHJlbmRlcmluZyBmdW5jdGlvbiBzaG91bGQgbG9vayBsaWtlIGZvciBhIGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IHR5cGUgQ29tcG9uZW50VGVtcGxhdGU8VD4gPSB7XG4gIChyZjogUmVuZGVyRmxhZ3MsIGN0eDogVCk6IHZvaWQ7IG5nUHJpdmF0ZURhdGE/OiBuZXZlcjtcbn07XG5cbi8qKlxuICogRGVmaW5pdGlvbiBvZiB3aGF0IGEgcXVlcnkgZnVuY3Rpb24gc2hvdWxkIGxvb2sgbGlrZS5cbiAqL1xuZXhwb3J0IHR5cGUgQ29tcG9uZW50UXVlcnk8VD4gPSBDb21wb25lbnRUZW1wbGF0ZTxUPjtcblxuLyoqXG4gKiBGbGFncyBwYXNzZWQgaW50byB0ZW1wbGF0ZSBmdW5jdGlvbnMgdG8gZGV0ZXJtaW5lIHdoaWNoIGJsb2NrcyAoaS5lLiBjcmVhdGlvbiwgdXBkYXRlKVxuICogc2hvdWxkIGJlIGV4ZWN1dGVkLlxuICpcbiAqIFR5cGljYWxseSwgYSB0ZW1wbGF0ZSBydW5zIGJvdGggdGhlIGNyZWF0aW9uIGJsb2NrIGFuZCB0aGUgdXBkYXRlIGJsb2NrIG9uIGluaXRpYWxpemF0aW9uIGFuZFxuICogc3Vic2VxdWVudCBydW5zIG9ubHkgZXhlY3V0ZSB0aGUgdXBkYXRlIGJsb2NrLiBIb3dldmVyLCBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzIHJlcXVpcmUgdGhhdFxuICogdGhlIGNyZWF0aW9uIGJsb2NrIGJlIGV4ZWN1dGVkIHNlcGFyYXRlbHkgZnJvbSB0aGUgdXBkYXRlIGJsb2NrIChmb3IgYmFja3dhcmRzIGNvbXBhdCkuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFJlbmRlckZsYWdzIHtcbiAgLyogV2hldGhlciB0byBydW4gdGhlIGNyZWF0aW9uIGJsb2NrIChlLmcuIGNyZWF0ZSBlbGVtZW50cyBhbmQgZGlyZWN0aXZlcykgKi9cbiAgQ3JlYXRlID0gMGIwMSxcblxuICAvKiBXaGV0aGVyIHRvIHJ1biB0aGUgdXBkYXRlIGJsb2NrIChlLmcuIHJlZnJlc2ggYmluZGluZ3MpICovXG4gIFVwZGF0ZSA9IDBiMTBcbn1cblxuLyoqXG4gKiBBIHN1YmNsYXNzIG9mIGBUeXBlYCB3aGljaCBoYXMgYSBzdGF0aWMgYG5nQ29tcG9uZW50RGVmYDpgQ29tcG9uZW50RGVmYCBmaWVsZCBtYWtpbmcgaXRcbiAqIGNvbnN1bWFibGUgZm9yIHJlbmRlcmluZy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnRUeXBlPFQ+IGV4dGVuZHMgVHlwZTxUPiB7IG5nQ29tcG9uZW50RGVmOiBuZXZlcjsgfVxuXG4vKipcbiAqIEEgc3ViY2xhc3Mgb2YgYFR5cGVgIHdoaWNoIGhhcyBhIHN0YXRpYyBgbmdEaXJlY3RpdmVEZWZgOmBEaXJlY3RpdmVEZWZgIGZpZWxkIG1ha2luZyBpdFxuICogY29uc3VtYWJsZSBmb3IgcmVuZGVyaW5nLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERpcmVjdGl2ZVR5cGU8VD4gZXh0ZW5kcyBUeXBlPFQ+IHsgbmdEaXJlY3RpdmVEZWY6IG5ldmVyOyB9XG5cbmV4cG9ydCBjb25zdCBlbnVtIERpcmVjdGl2ZURlZkZsYWdzIHtDb250ZW50UXVlcnkgPSAwYjEwfVxuXG4vKipcbiAqIEEgc3ViY2xhc3Mgb2YgYFR5cGVgIHdoaWNoIGhhcyBhIHN0YXRpYyBgbmdQaXBlRGVmYDpgUGlwZURlZmAgZmllbGQgbWFraW5nIGl0XG4gKiBjb25zdW1hYmxlIGZvciByZW5kZXJpbmcuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUGlwZVR5cGU8VD4gZXh0ZW5kcyBUeXBlPFQ+IHsgbmdQaXBlRGVmOiBuZXZlcjsgfVxuXG5leHBvcnQgdHlwZSBEaXJlY3RpdmVEZWZXaXRoTWV0YTxcbiAgICBULCBTZWxlY3RvciBleHRlbmRzIHN0cmluZywgRXhwb3J0QXMgZXh0ZW5kcyBzdHJpbmdbXSwgSW5wdXRNYXAgZXh0ZW5kc3tba2V5OiBzdHJpbmddOiBzdHJpbmd9LFxuICAgIE91dHB1dE1hcCBleHRlbmRze1trZXk6IHN0cmluZ106IHN0cmluZ30sIFF1ZXJ5RmllbGRzIGV4dGVuZHMgc3RyaW5nW10+ID0gRGlyZWN0aXZlRGVmPFQ+O1xuXG4vKipcbiAqIFJ1bnRpbWUgaW5mb3JtYXRpb24gZm9yIGNsYXNzZXMgdGhhdCBhcmUgaW5oZXJpdGVkIGJ5IGNvbXBvbmVudHMgb3IgZGlyZWN0aXZlc1xuICogdGhhdCBhcmVuJ3QgZGVmaW5lZCBhcyBjb21wb25lbnRzIG9yIGRpcmVjdGl2ZXMuXG4gKlxuICogVGhpcyBpcyBhbiBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZSB1c2VkIGJ5IHRoZSByZW5kZXIgdG8gZGV0ZXJtaW5lIHdoYXQgaW5wdXRzXG4gKiBhbmQgb3V0cHV0cyBzaG91bGQgYmUgaW5oZXJpdGVkLlxuICpcbiAqIFNlZToge0BsaW5rIGRlZmluZUJhc2V9XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQmFzZURlZjxUPiB7XG4gIC8qKlxuICAgKiBBIGRpY3Rpb25hcnkgbWFwcGluZyB0aGUgaW5wdXRzJyBtaW5pZmllZCBwcm9wZXJ0eSBuYW1lcyB0byB0aGVpciBwdWJsaWMgQVBJIG5hbWVzLCB3aGljaFxuICAgKiBhcmUgdGhlaXIgYWxpYXNlcyBpZiBhbnksIG9yIHRoZWlyIG9yaWdpbmFsIHVubWluaWZpZWQgcHJvcGVydHkgbmFtZXNcbiAgICogKGFzIGluIGBASW5wdXQoJ2FsaWFzJykgcHJvcGVydHlOYW1lOiBhbnk7YCkuXG4gICAqL1xuICByZWFkb25seSBpbnB1dHM6IHtbUCBpbiBrZXlvZiBUXTogc3RyaW5nfTtcblxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgVGhpcyBpcyBvbmx5IGhlcmUgYmVjYXVzZSBgTmdPbkNoYW5nZXNgIGluY29ycmVjdGx5IHVzZXMgZGVjbGFyZWQgbmFtZSBpbnN0ZWFkIG9mXG4gICAqIHB1YmxpYyBvciBtaW5pZmllZCBuYW1lLlxuICAgKi9cbiAgcmVhZG9ubHkgZGVjbGFyZWRJbnB1dHM6IHtbUCBpbiBrZXlvZiBUXTogUH07XG5cbiAgLyoqXG4gICAqIEEgZGljdGlvbmFyeSBtYXBwaW5nIHRoZSBvdXRwdXRzJyBtaW5pZmllZCBwcm9wZXJ0eSBuYW1lcyB0byB0aGVpciBwdWJsaWMgQVBJIG5hbWVzLCB3aGljaFxuICAgKiBhcmUgdGhlaXIgYWxpYXNlcyBpZiBhbnksIG9yIHRoZWlyIG9yaWdpbmFsIHVubWluaWZpZWQgcHJvcGVydHkgbmFtZXNcbiAgICogKGFzIGluIGBAT3V0cHV0KCdhbGlhcycpIHByb3BlcnR5TmFtZTogYW55O2ApLlxuICAgKi9cbiAgcmVhZG9ubHkgb3V0cHV0czoge1tQIGluIGtleW9mIFRdOiBQfTtcbn1cblxuLyoqXG4gKiBSdW50aW1lIGxpbmsgaW5mb3JtYXRpb24gZm9yIERpcmVjdGl2ZXMuXG4gKlxuICogVGhpcyBpcyBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZSB1c2VkIGJ5IHRoZSByZW5kZXIgdG8gbGlua1xuICogZGlyZWN0aXZlcyBpbnRvIHRlbXBsYXRlcy5cbiAqXG4gKiBOT1RFOiBBbHdheXMgdXNlIGBkZWZpbmVEaXJlY3RpdmVgIGZ1bmN0aW9uIHRvIGNyZWF0ZSB0aGlzIG9iamVjdCxcbiAqIG5ldmVyIGNyZWF0ZSB0aGUgb2JqZWN0IGRpcmVjdGx5IHNpbmNlIHRoZSBzaGFwZSBvZiB0aGlzIG9iamVjdFxuICogY2FuIGNoYW5nZSBiZXR3ZWVuIHZlcnNpb25zLlxuICpcbiAqIEBwYXJhbSBTZWxlY3RvciB0eXBlIG1ldGFkYXRhIHNwZWNpZnlpbmcgdGhlIHNlbGVjdG9yIG9mIHRoZSBkaXJlY3RpdmUgb3IgY29tcG9uZW50XG4gKlxuICogU2VlOiB7QGxpbmsgZGVmaW5lRGlyZWN0aXZlfVxuICovXG5leHBvcnQgaW50ZXJmYWNlIERpcmVjdGl2ZURlZjxUPiBleHRlbmRzIEJhc2VEZWY8VD4ge1xuICAvKiogVG9rZW4gcmVwcmVzZW50aW5nIHRoZSBkaXJlY3RpdmUuIFVzZWQgYnkgREkuICovXG4gIHR5cGU6IFR5cGU8VD47XG5cbiAgLyoqIEZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgcHJvdmlkZXJzIGFuZCBwdWJsaXNoZXMgdGhlbSBpbnRvIHRoZSBESSBzeXN0ZW0uICovXG4gIHByb3ZpZGVyc1Jlc29sdmVyOiAoKGRlZjogRGlyZWN0aXZlRGVmPFQ+KSA9PiB2b2lkKXxudWxsO1xuXG4gIC8qKiBUaGUgc2VsZWN0b3JzIHRoYXQgd2lsbCBiZSB1c2VkIHRvIG1hdGNoIG5vZGVzIHRvIHRoaXMgZGlyZWN0aXZlLiAqL1xuICByZWFkb25seSBzZWxlY3RvcnM6IENzc1NlbGVjdG9yTGlzdDtcblxuICAvKipcbiAgICogTmFtZSB1bmRlciB3aGljaCB0aGUgZGlyZWN0aXZlIGlzIGV4cG9ydGVkIChmb3IgdXNlIHdpdGggbG9jYWwgcmVmZXJlbmNlcyBpbiB0ZW1wbGF0ZSlcbiAgICovXG4gIHJlYWRvbmx5IGV4cG9ydEFzOiBzdHJpbmdbXXxudWxsO1xuXG4gIC8qKlxuICAgKiBGYWN0b3J5IGZ1bmN0aW9uIHVzZWQgdG8gY3JlYXRlIGEgbmV3IGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAgICovXG4gIGZhY3Rvcnk6ICh0OiBUeXBlPFQ+fG51bGwpID0+IFQ7XG5cbiAgLyoqXG4gICAqIEZ1bmN0aW9uIHRvIGNyZWF0ZSBpbnN0YW5jZXMgb2YgY29udGVudCBxdWVyaWVzIGFzc29jaWF0ZWQgd2l0aCBhIGdpdmVuIGRpcmVjdGl2ZS5cbiAgICovXG4gIGNvbnRlbnRRdWVyaWVzOiAoKGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpID0+IHZvaWQpfG51bGw7XG5cbiAgLyoqIFJlZnJlc2hlcyBjb250ZW50IHF1ZXJpZXMgYXNzb2NpYXRlZCB3aXRoIGRpcmVjdGl2ZXMgaW4gYSBnaXZlbiB2aWV3ICovXG4gIGNvbnRlbnRRdWVyaWVzUmVmcmVzaDogKChkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBxdWVyeUluZGV4OiBudW1iZXIpID0+IHZvaWQpfG51bGw7XG5cbiAgLyoqIFJlZnJlc2hlcyBob3N0IGJpbmRpbmdzIG9uIHRoZSBhc3NvY2lhdGVkIGRpcmVjdGl2ZS4gKi9cbiAgaG9zdEJpbmRpbmdzOiBIb3N0QmluZGluZ3NGdW5jdGlvbjxUPnxudWxsO1xuXG4gIC8qKlxuICAgKiBTdGF0aWMgYXR0cmlidXRlcyB0byBzZXQgb24gaG9zdCBlbGVtZW50LlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IGF0dHJpYnV0ZSBuYW1lXG4gICAqIE9kZCBpbmRpY2VzOiBhdHRyaWJ1dGUgdmFsdWVcbiAgICovXG4gIHJlYWRvbmx5IGF0dHJpYnV0ZXM6IHN0cmluZ1tdfG51bGw7XG5cbiAgLyogVGhlIGZvbGxvd2luZyBhcmUgbGlmZWN5Y2xlIGhvb2tzIGZvciB0aGlzIGNvbXBvbmVudCAqL1xuICBvbkluaXQ6ICgoKSA9PiB2b2lkKXxudWxsO1xuICBkb0NoZWNrOiAoKCkgPT4gdm9pZCl8bnVsbDtcbiAgYWZ0ZXJDb250ZW50SW5pdDogKCgpID0+IHZvaWQpfG51bGw7XG4gIGFmdGVyQ29udGVudENoZWNrZWQ6ICgoKSA9PiB2b2lkKXxudWxsO1xuICBhZnRlclZpZXdJbml0OiAoKCkgPT4gdm9pZCl8bnVsbDtcbiAgYWZ0ZXJWaWV3Q2hlY2tlZDogKCgpID0+IHZvaWQpfG51bGw7XG4gIG9uRGVzdHJveTogKCgpID0+IHZvaWQpfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBmZWF0dXJlcyBhcHBsaWVkIHRvIHRoaXMgZGlyZWN0aXZlXG4gICAqL1xuICByZWFkb25seSBmZWF0dXJlczogRGlyZWN0aXZlRGVmRmVhdHVyZVtdfG51bGw7XG59XG5cbmV4cG9ydCB0eXBlIENvbXBvbmVudERlZldpdGhNZXRhPFxuICAgIFQsIFNlbGVjdG9yIGV4dGVuZHMgU3RyaW5nLCBFeHBvcnRBcyBleHRlbmRzIHN0cmluZ1tdLCBJbnB1dE1hcCBleHRlbmRze1trZXk6IHN0cmluZ106IHN0cmluZ30sXG4gICAgT3V0cHV0TWFwIGV4dGVuZHN7W2tleTogc3RyaW5nXTogc3RyaW5nfSwgUXVlcnlGaWVsZHMgZXh0ZW5kcyBzdHJpbmdbXT4gPSBDb21wb25lbnREZWY8VD47XG5cbi8qKlxuICogUnVudGltZSBsaW5rIGluZm9ybWF0aW9uIGZvciBDb21wb25lbnRzLlxuICpcbiAqIFRoaXMgaXMgaW50ZXJuYWwgZGF0YSBzdHJ1Y3R1cmUgdXNlZCBieSB0aGUgcmVuZGVyIHRvIGxpbmtcbiAqIGNvbXBvbmVudHMgaW50byB0ZW1wbGF0ZXMuXG4gKlxuICogTk9URTogQWx3YXlzIHVzZSBgZGVmaW5lQ29tcG9uZW50YCBmdW5jdGlvbiB0byBjcmVhdGUgdGhpcyBvYmplY3QsXG4gKiBuZXZlciBjcmVhdGUgdGhlIG9iamVjdCBkaXJlY3RseSBzaW5jZSB0aGUgc2hhcGUgb2YgdGhpcyBvYmplY3RcbiAqIGNhbiBjaGFuZ2UgYmV0d2VlbiB2ZXJzaW9ucy5cbiAqXG4gKiBTZWU6IHtAbGluayBkZWZpbmVDb21wb25lbnR9XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcG9uZW50RGVmPFQ+IGV4dGVuZHMgRGlyZWN0aXZlRGVmPFQ+IHtcbiAgLyoqXG4gICAqIFJ1bnRpbWUgdW5pcXVlIGNvbXBvbmVudCBJRC5cbiAgICovXG4gIHJlYWRvbmx5IGlkOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSBWaWV3IHRlbXBsYXRlIG9mIHRoZSBjb21wb25lbnQuXG4gICAqL1xuICByZWFkb25seSB0ZW1wbGF0ZTogQ29tcG9uZW50VGVtcGxhdGU8VD47XG5cbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIGBuZ0NvbnRlbnRbc2VsZWN0b3JdYCB2YWx1ZXMgdGhhdCB3ZXJlIGZvdW5kIGluIHRoZSB0ZW1wbGF0ZS5cbiAgICovXG4gIHJlYWRvbmx5IG5nQ29udGVudFNlbGVjdG9ycz86IHN0cmluZ1tdO1xuXG4gIC8qKlxuICAgKiBBIHNldCBvZiBzdHlsZXMgdGhhdCB0aGUgY29tcG9uZW50IG5lZWRzIHRvIGJlIHByZXNlbnQgZm9yIGNvbXBvbmVudCB0byByZW5kZXIgY29ycmVjdGx5LlxuICAgKi9cbiAgcmVhZG9ubHkgc3R5bGVzOiBzdHJpbmdbXTtcblxuICAvKipcbiAgICogVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGluIHRoaXMgY29tcG9uZW50IHRlbXBsYXRlLlxuICAgKlxuICAgKiBVc2VkIHRvIGNhbGN1bGF0ZSB0aGUgbGVuZ3RoIG9mIHRoZSBjb21wb25lbnQncyBMVmlldyBhcnJheSwgc28gd2VcbiAgICogY2FuIHByZS1maWxsIHRoZSBhcnJheSBhbmQgc2V0IHRoZSBiaW5kaW5nIHN0YXJ0IGluZGV4LlxuICAgKi9cbiAgLy8gVE9ETyhrYXJhKTogcmVtb3ZlIHF1ZXJpZXMgZnJvbSB0aGlzIGNvdW50XG4gIHJlYWRvbmx5IGNvbnN0czogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgbnVtYmVyIG9mIGJpbmRpbmdzIGluIHRoaXMgY29tcG9uZW50IHRlbXBsYXRlIChpbmNsdWRpbmcgcHVyZSBmbiBiaW5kaW5ncykuXG4gICAqXG4gICAqIFVzZWQgdG8gY2FsY3VsYXRlIHRoZSBsZW5ndGggb2YgdGhlIGNvbXBvbmVudCdzIExWaWV3IGFycmF5LCBzbyB3ZVxuICAgKiBjYW4gcHJlLWZpbGwgdGhlIGFycmF5IGFuZCBzZXQgdGhlIGhvc3QgYmluZGluZyBzdGFydCBpbmRleC5cbiAgICovXG4gIHJlYWRvbmx5IHZhcnM6IG51bWJlcjtcblxuICAvKipcbiAgICogUXVlcnktcmVsYXRlZCBpbnN0cnVjdGlvbnMgZm9yIGEgY29tcG9uZW50LlxuICAgKi9cbiAgdmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTxUPnxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgdmlldyBlbmNhcHN1bGF0aW9uIHR5cGUsIHdoaWNoIGRldGVybWluZXMgaG93IHN0eWxlcyBhcmUgYXBwbGllZCB0b1xuICAgKiBET00gZWxlbWVudHMuIE9uZSBvZlxuICAgKiAtIGBFbXVsYXRlZGAgKGRlZmF1bHQpOiBFbXVsYXRlIG5hdGl2ZSBzY29waW5nIG9mIHN0eWxlcy5cbiAgICogLSBgTmF0aXZlYDogVXNlIHRoZSBuYXRpdmUgZW5jYXBzdWxhdGlvbiBtZWNoYW5pc20gb2YgdGhlIHJlbmRlcmVyLlxuICAgKiAtIGBTaGFkb3dEb21gOiBVc2UgbW9kZXJuIFtTaGFkb3dET01dKGh0dHBzOi8vdzNjLmdpdGh1Yi5pby93ZWJjb21wb25lbnRzL3NwZWMvc2hhZG93LykgYW5kXG4gICAqICAgY3JlYXRlIGEgU2hhZG93Um9vdCBmb3IgY29tcG9uZW50J3MgaG9zdCBlbGVtZW50LlxuICAgKiAtIGBOb25lYDogRG8gbm90IHByb3ZpZGUgYW55IHRlbXBsYXRlIG9yIHN0eWxlIGVuY2Fwc3VsYXRpb24uXG4gICAqL1xuICByZWFkb25seSBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbjtcblxuICAvKipcbiAgICogRGVmaW5lcyBhcmJpdHJhcnkgZGV2ZWxvcGVyLWRlZmluZWQgZGF0YSB0byBiZSBzdG9yZWQgb24gYSByZW5kZXJlciBpbnN0YW5jZS5cbiAgICogVGhpcyBpcyB1c2VmdWwgZm9yIHJlbmRlcmVycyB0aGF0IGRlbGVnYXRlIHRvIG90aGVyIHJlbmRlcmVycy5cbiAgICovXG4gIHJlYWRvbmx5IGRhdGE6IHtba2luZDogc3RyaW5nXTogYW55fTtcblxuICAvKiogV2hldGhlciBvciBub3QgdGhpcyBjb21wb25lbnQncyBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSBpcyBPblB1c2ggKi9cbiAgcmVhZG9ubHkgb25QdXNoOiBib29sZWFuO1xuXG4gIC8qKlxuXG4gICAqIFJlZ2lzdHJ5IG9mIGRpcmVjdGl2ZXMgYW5kIGNvbXBvbmVudHMgdGhhdCBtYXkgYmUgZm91bmQgaW4gdGhpcyB2aWV3LlxuICAgKlxuICAgKiBUaGUgcHJvcGVydHkgaXMgZWl0aGVyIGFuIGFycmF5IG9mIGBEaXJlY3RpdmVEZWZgcyBvciBhIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhlIGFycmF5IG9mXG4gICAqIGBEaXJlY3RpdmVEZWZgcy4gVGhlIGZ1bmN0aW9uIGlzIG5lY2Vzc2FyeSB0byBiZSBhYmxlIHRvIHN1cHBvcnQgZm9yd2FyZCBkZWNsYXJhdGlvbnMuXG4gICAqL1xuICBkaXJlY3RpdmVEZWZzOiBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5fG51bGw7XG5cbiAgLyoqXG4gICAqIFJlZ2lzdHJ5IG9mIHBpcGVzIHRoYXQgbWF5IGJlIGZvdW5kIGluIHRoaXMgdmlldy5cbiAgICpcbiAgICogVGhlIHByb3BlcnR5IGlzIGVpdGhlciBhbiBhcnJheSBvZiBgUGlwZURlZnNgcyBvciBhIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhlIGFycmF5IG9mXG4gICAqIGBQaXBlRGVmc2BzLiBUaGUgZnVuY3Rpb24gaXMgbmVjZXNzYXJ5IHRvIGJlIGFibGUgdG8gc3VwcG9ydCBmb3J3YXJkIGRlY2xhcmF0aW9ucy5cbiAgICovXG4gIHBpcGVEZWZzOiBQaXBlRGVmTGlzdE9yRmFjdG9yeXxudWxsO1xuXG4gIC8qKlxuICAgKiBVc2VkIHRvIHN0b3JlIHRoZSByZXN1bHQgb2YgYG5vU2lkZUVmZmVjdHNgIGZ1bmN0aW9uIHNvIHRoYXQgaXQgaXMgbm90IHJlbW92ZWQgYnkgY2xvc3VyZVxuICAgKiBjb21waWxlci4gVGhlIHByb3BlcnR5IHNob3VsZCBuZXZlciBiZSByZWFkLlxuICAgKi9cbiAgcmVhZG9ubHkgXz86IG5ldmVyO1xufVxuXG4vKipcbiAqIFJ1bnRpbWUgbGluayBpbmZvcm1hdGlvbiBmb3IgUGlwZXMuXG4gKlxuICogVGhpcyBpcyBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZSB1c2VkIGJ5IHRoZSByZW5kZXJlciB0byBsaW5rXG4gKiBwaXBlcyBpbnRvIHRlbXBsYXRlcy5cbiAqXG4gKiBOT1RFOiBBbHdheXMgdXNlIGBkZWZpbmVQaXBlYCBmdW5jdGlvbiB0byBjcmVhdGUgdGhpcyBvYmplY3QsXG4gKiBuZXZlciBjcmVhdGUgdGhlIG9iamVjdCBkaXJlY3RseSBzaW5jZSB0aGUgc2hhcGUgb2YgdGhpcyBvYmplY3RcbiAqIGNhbiBjaGFuZ2UgYmV0d2VlbiB2ZXJzaW9ucy5cbiAqXG4gKiBTZWU6IHtAbGluayBkZWZpbmVQaXBlfVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFBpcGVEZWY8VD4ge1xuICAvKipcbiAgICogUGlwZSBuYW1lLlxuICAgKlxuICAgKiBVc2VkIHRvIHJlc29sdmUgcGlwZSBpbiB0ZW1wbGF0ZXMuXG4gICAqL1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEZhY3RvcnkgZnVuY3Rpb24gdXNlZCB0byBjcmVhdGUgYSBuZXcgcGlwZSBpbnN0YW5jZS5cbiAgICovXG4gIGZhY3Rvcnk6ICh0OiBUeXBlPFQ+fG51bGwpID0+IFQ7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZSBwaXBlIGlzIHB1cmUuXG4gICAqXG4gICAqIFB1cmUgcGlwZXMgcmVzdWx0IG9ubHkgZGVwZW5kcyBvbiB0aGUgcGlwZSBpbnB1dCBhbmQgbm90IG9uIGludGVybmFsXG4gICAqIHN0YXRlIG9mIHRoZSBwaXBlLlxuICAgKi9cbiAgcmVhZG9ubHkgcHVyZTogYm9vbGVhbjtcblxuICAvKiBUaGUgZm9sbG93aW5nIGFyZSBsaWZlY3ljbGUgaG9va3MgZm9yIHRoaXMgcGlwZSAqL1xuICBvbkRlc3Ryb3k6ICgoKSA9PiB2b2lkKXxudWxsO1xufVxuXG5leHBvcnQgdHlwZSBQaXBlRGVmV2l0aE1ldGE8VCwgTmFtZSBleHRlbmRzIHN0cmluZz4gPSBQaXBlRGVmPFQ+O1xuXG5leHBvcnQgaW50ZXJmYWNlIERpcmVjdGl2ZURlZkZlYXR1cmUge1xuICA8VD4oZGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWY8VD4pOiB2b2lkO1xuICBuZ0luaGVyaXQ/OiB0cnVlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbXBvbmVudERlZkZlYXR1cmUge1xuICA8VD4oY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8VD4pOiB2b2lkO1xuICBuZ0luaGVyaXQ/OiB0cnVlO1xufVxuXG5cbi8qKlxuICogVHlwZSB1c2VkIGZvciBkaXJlY3RpdmVEZWZzIG9uIGNvbXBvbmVudCBkZWZpbml0aW9uLlxuICpcbiAqIFRoZSBmdW5jdGlvbiBpcyBuZWNlc3NhcnkgdG8gYmUgYWJsZSB0byBzdXBwb3J0IGZvcndhcmQgZGVjbGFyYXRpb25zLlxuICovXG5leHBvcnQgdHlwZSBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5ID0gKCgpID0+IERpcmVjdGl2ZURlZkxpc3QpIHwgRGlyZWN0aXZlRGVmTGlzdDtcblxuZXhwb3J0IHR5cGUgRGlyZWN0aXZlRGVmTGlzdCA9IChEaXJlY3RpdmVEZWY8YW55PnwgQ29tcG9uZW50RGVmPGFueT4pW107XG5cbmV4cG9ydCB0eXBlIERpcmVjdGl2ZVR5cGVzT3JGYWN0b3J5ID0gKCgpID0+IERpcmVjdGl2ZVR5cGVMaXN0KSB8IERpcmVjdGl2ZVR5cGVMaXN0O1xuXG5leHBvcnQgdHlwZSBEaXJlY3RpdmVUeXBlTGlzdCA9XG4gICAgKERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55PnxcbiAgICAgVHlwZTxhbnk+LyogVHlwZSBhcyB3b3JrYXJvdW5kIGZvcjogTWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzQ4ODEgKi8pW107XG5cbmV4cG9ydCB0eXBlIEhvc3RCaW5kaW5nc0Z1bmN0aW9uPFQ+ID0gKHJmOiBSZW5kZXJGbGFncywgY3R4OiBULCBlbGVtZW50SW5kZXg6IG51bWJlcikgPT4gdm9pZDtcblxuLyoqXG4gKiBUeXBlIHVzZWQgZm9yIFBpcGVEZWZzIG9uIGNvbXBvbmVudCBkZWZpbml0aW9uLlxuICpcbiAqIFRoZSBmdW5jdGlvbiBpcyBuZWNlc3NhcnkgdG8gYmUgYWJsZSB0byBzdXBwb3J0IGZvcndhcmQgZGVjbGFyYXRpb25zLlxuICovXG5leHBvcnQgdHlwZSBQaXBlRGVmTGlzdE9yRmFjdG9yeSA9ICgoKSA9PiBQaXBlRGVmTGlzdCkgfCBQaXBlRGVmTGlzdDtcblxuZXhwb3J0IHR5cGUgUGlwZURlZkxpc3QgPSBQaXBlRGVmPGFueT5bXTtcblxuZXhwb3J0IHR5cGUgUGlwZVR5cGVzT3JGYWN0b3J5ID0gKCgpID0+IERpcmVjdGl2ZVR5cGVMaXN0KSB8IERpcmVjdGl2ZVR5cGVMaXN0O1xuXG5leHBvcnQgdHlwZSBQaXBlVHlwZUxpc3QgPVxuICAgIChQaXBlRGVmPGFueT58IFR5cGU8YW55Pi8qIFR5cGUgYXMgd29ya2Fyb3VuZCBmb3I6IE1pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy80ODgxICovKVtdO1xuXG5cbi8vIE5vdGU6IFRoaXMgaGFjayBpcyBuZWNlc3Nhcnkgc28gd2UgZG9uJ3QgZXJyb25lb3VzbHkgZ2V0IGEgY2lyY3VsYXIgZGVwZW5kZW5jeVxuLy8gZmFpbHVyZSBiYXNlZCBvbiB0eXBlcy5cbmV4cG9ydCBjb25zdCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCA9IDE7XG4iXX0=