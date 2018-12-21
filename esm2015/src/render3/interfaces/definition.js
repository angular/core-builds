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
/** @enum {number} */
const InitialStylingFlags = {
    VALUES_MODE: 1,
};
export { InitialStylingFlags };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmaW5pdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9kZWZpbml0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUFrQ0UsNkVBQTZFO0lBQzdFLFNBQWE7SUFFYiw2REFBNkQ7SUFDN0QsU0FBYTs7Ozs7Ozs7O0FBT2YsbUNBQTRFOzs7SUFBeEIsdUNBQXNCOzs7Ozs7OztBQU0xRSxtQ0FBNEU7OztJQUF4Qix1Q0FBc0I7Ozs7SUFFckMsZUFBbUI7Ozs7Ozs7OztBQU14RCw4QkFBa0U7OztJQUFuQiw2QkFBaUI7Ozs7Ozs7Ozs7Ozs7QUFlaEUsNkJBb0JDOzs7Ozs7OztJQWRDLHlCQUEwQzs7Ozs7O0lBTTFDLGlDQUE2Qzs7Ozs7OztJQU83QywwQkFBc0M7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlCeEMsa0NBb0RDOzs7Ozs7SUFsREMsNEJBQWM7Ozs7O0lBR2QseUNBQXlEOzs7OztJQUd6RCxpQ0FBb0M7Ozs7O0lBS3BDLGdDQUErQjs7Ozs7SUFLL0IsK0JBQWdDOzs7OztJQUtoQyxzQ0FBd0Q7Ozs7O0lBR3hELDZDQUFtRjs7Ozs7SUFHbkYsb0NBQTJDOzs7Ozs7OztJQVEzQyxrQ0FBbUM7O0lBR25DLDhCQUEwQjs7SUFDMUIsK0JBQTJCOztJQUMzQix3Q0FBb0M7O0lBQ3BDLDJDQUF1Qzs7SUFDdkMscUNBQWlDOztJQUNqQyx3Q0FBb0M7O0lBQ3BDLGlDQUE2Qjs7Ozs7SUFLN0IsZ0NBQThDOzs7Ozs7Ozs7Ozs7Ozs7O0FBbUJoRCxrQ0FnRkM7Ozs7OztJQTVFQywwQkFBb0I7Ozs7O0lBS3BCLGdDQUF3Qzs7Ozs7SUFLeEMsOEJBQTBCOzs7Ozs7OztJQVMxQiw4QkFBd0I7Ozs7Ozs7O0lBUXhCLDRCQUFzQjs7Ozs7SUFLdEIsaUNBQWtDOzs7Ozs7Ozs7OztJQVdsQyxxQ0FBMEM7Ozs7OztJQU0xQyw0QkFBcUM7Ozs7O0lBR3JDLDhCQUF5Qjs7Ozs7Ozs7SUFTekIscUNBQThDOzs7Ozs7OztJQVE5QyxnQ0FBb0M7Ozs7OztJQU1wQyx5QkFBbUI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFlckIsNkJBdUJDOzs7Ozs7OztJQWpCQyx1QkFBc0I7Ozs7O0lBS3RCLDBCQUFnQzs7Ozs7Ozs7SUFRaEMsdUJBQXVCOztJQUd2Qiw0QkFBNkI7Ozs7O0FBSy9CLHlDQUdDOzs7SUFEQyx3Q0FBaUI7Ozs7OztBQUduQix5Q0FHQzs7O0lBREMsd0NBQWlCOzs7Ozs7QUFzQ25CLE1BQU0sT0FBTyw2QkFBNkIsR0FBRyxDQUFDOzs7SUFHNUMsY0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Vmlld0VuY2Fwc3VsYXRpb259IGZyb20gJy4uLy4uL2NvcmUnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi90eXBlJztcbmltcG9ydCB7Q3NzU2VsZWN0b3JMaXN0fSBmcm9tICcuL3Byb2plY3Rpb24nO1xuXG5cbi8qKlxuICogRGVmaW5pdGlvbiBvZiB3aGF0IGEgdGVtcGxhdGUgcmVuZGVyaW5nIGZ1bmN0aW9uIHNob3VsZCBsb29rIGxpa2UgZm9yIGEgY29tcG9uZW50LlxuICovXG5leHBvcnQgdHlwZSBDb21wb25lbnRUZW1wbGF0ZTxUPiA9IHtcbiAgKHJmOiBSZW5kZXJGbGFncywgY3R4OiBUKTogdm9pZDsgbmdQcml2YXRlRGF0YT86IG5ldmVyO1xufTtcblxuLyoqXG4gKiBEZWZpbml0aW9uIG9mIHdoYXQgYSBxdWVyeSBmdW5jdGlvbiBzaG91bGQgbG9vayBsaWtlLlxuICovXG5leHBvcnQgdHlwZSBDb21wb25lbnRRdWVyeTxUPiA9IENvbXBvbmVudFRlbXBsYXRlPFQ+O1xuXG4vKipcbiAqIEZsYWdzIHBhc3NlZCBpbnRvIHRlbXBsYXRlIGZ1bmN0aW9ucyB0byBkZXRlcm1pbmUgd2hpY2ggYmxvY2tzIChpLmUuIGNyZWF0aW9uLCB1cGRhdGUpXG4gKiBzaG91bGQgYmUgZXhlY3V0ZWQuXG4gKlxuICogVHlwaWNhbGx5LCBhIHRlbXBsYXRlIHJ1bnMgYm90aCB0aGUgY3JlYXRpb24gYmxvY2sgYW5kIHRoZSB1cGRhdGUgYmxvY2sgb24gaW5pdGlhbGl6YXRpb24gYW5kXG4gKiBzdWJzZXF1ZW50IHJ1bnMgb25seSBleGVjdXRlIHRoZSB1cGRhdGUgYmxvY2suIEhvd2V2ZXIsIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MgcmVxdWlyZSB0aGF0XG4gKiB0aGUgY3JlYXRpb24gYmxvY2sgYmUgZXhlY3V0ZWQgc2VwYXJhdGVseSBmcm9tIHRoZSB1cGRhdGUgYmxvY2sgKGZvciBiYWNrd2FyZHMgY29tcGF0KS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gUmVuZGVyRmxhZ3Mge1xuICAvKiBXaGV0aGVyIHRvIHJ1biB0aGUgY3JlYXRpb24gYmxvY2sgKGUuZy4gY3JlYXRlIGVsZW1lbnRzIGFuZCBkaXJlY3RpdmVzKSAqL1xuICBDcmVhdGUgPSAwYjAxLFxuXG4gIC8qIFdoZXRoZXIgdG8gcnVuIHRoZSB1cGRhdGUgYmxvY2sgKGUuZy4gcmVmcmVzaCBiaW5kaW5ncykgKi9cbiAgVXBkYXRlID0gMGIxMFxufVxuXG4vKipcbiAqIEEgc3ViY2xhc3Mgb2YgYFR5cGVgIHdoaWNoIGhhcyBhIHN0YXRpYyBgbmdDb21wb25lbnREZWZgOmBDb21wb25lbnREZWZgIGZpZWxkIG1ha2luZyBpdFxuICogY29uc3VtYWJsZSBmb3IgcmVuZGVyaW5nLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbXBvbmVudFR5cGU8VD4gZXh0ZW5kcyBUeXBlPFQ+IHsgbmdDb21wb25lbnREZWY6IG5ldmVyOyB9XG5cbi8qKlxuICogQSBzdWJjbGFzcyBvZiBgVHlwZWAgd2hpY2ggaGFzIGEgc3RhdGljIGBuZ0RpcmVjdGl2ZURlZmA6YERpcmVjdGl2ZURlZmAgZmllbGQgbWFraW5nIGl0XG4gKiBjb25zdW1hYmxlIGZvciByZW5kZXJpbmcuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGlyZWN0aXZlVHlwZTxUPiBleHRlbmRzIFR5cGU8VD4geyBuZ0RpcmVjdGl2ZURlZjogbmV2ZXI7IH1cblxuZXhwb3J0IGNvbnN0IGVudW0gRGlyZWN0aXZlRGVmRmxhZ3Mge0NvbnRlbnRRdWVyeSA9IDBiMTB9XG5cbi8qKlxuICogQSBzdWJjbGFzcyBvZiBgVHlwZWAgd2hpY2ggaGFzIGEgc3RhdGljIGBuZ1BpcGVEZWZgOmBQaXBlRGVmYCBmaWVsZCBtYWtpbmcgaXRcbiAqIGNvbnN1bWFibGUgZm9yIHJlbmRlcmluZy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQaXBlVHlwZTxUPiBleHRlbmRzIFR5cGU8VD4geyBuZ1BpcGVEZWY6IG5ldmVyOyB9XG5cbmV4cG9ydCB0eXBlIERpcmVjdGl2ZURlZldpdGhNZXRhPFxuICAgIFQsIFNlbGVjdG9yIGV4dGVuZHMgc3RyaW5nLCBFeHBvcnRBcyBleHRlbmRzIHN0cmluZywgSW5wdXRNYXAgZXh0ZW5kc3tba2V5OiBzdHJpbmddOiBzdHJpbmd9LFxuICAgIE91dHB1dE1hcCBleHRlbmRze1trZXk6IHN0cmluZ106IHN0cmluZ30sIFF1ZXJ5RmllbGRzIGV4dGVuZHMgc3RyaW5nW10+ID0gRGlyZWN0aXZlRGVmPFQ+O1xuXG4vKipcbiAqIFJ1bnRpbWUgaW5mb3JtYXRpb24gZm9yIGNsYXNzZXMgdGhhdCBhcmUgaW5oZXJpdGVkIGJ5IGNvbXBvbmVudHMgb3IgZGlyZWN0aXZlc1xuICogdGhhdCBhcmVuJ3QgZGVmaW5lZCBhcyBjb21wb25lbnRzIG9yIGRpcmVjdGl2ZXMuXG4gKlxuICogVGhpcyBpcyBhbiBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZSB1c2VkIGJ5IHRoZSByZW5kZXIgdG8gZGV0ZXJtaW5lIHdoYXQgaW5wdXRzXG4gKiBhbmQgb3V0cHV0cyBzaG91bGQgYmUgaW5oZXJpdGVkLlxuICpcbiAqIFNlZToge0BsaW5rIGRlZmluZUJhc2V9XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQmFzZURlZjxUPiB7XG4gIC8qKlxuICAgKiBBIGRpY3Rpb25hcnkgbWFwcGluZyB0aGUgaW5wdXRzJyBtaW5pZmllZCBwcm9wZXJ0eSBuYW1lcyB0byB0aGVpciBwdWJsaWMgQVBJIG5hbWVzLCB3aGljaFxuICAgKiBhcmUgdGhlaXIgYWxpYXNlcyBpZiBhbnksIG9yIHRoZWlyIG9yaWdpbmFsIHVubWluaWZpZWQgcHJvcGVydHkgbmFtZXNcbiAgICogKGFzIGluIGBASW5wdXQoJ2FsaWFzJykgcHJvcGVydHlOYW1lOiBhbnk7YCkuXG4gICAqL1xuICByZWFkb25seSBpbnB1dHM6IHtbUCBpbiBrZXlvZiBUXTogc3RyaW5nfTtcblxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgVGhpcyBpcyBvbmx5IGhlcmUgYmVjYXVzZSBgTmdPbkNoYW5nZXNgIGluY29ycmVjdGx5IHVzZXMgZGVjbGFyZWQgbmFtZSBpbnN0ZWFkIG9mXG4gICAqIHB1YmxpYyBvciBtaW5pZmllZCBuYW1lLlxuICAgKi9cbiAgcmVhZG9ubHkgZGVjbGFyZWRJbnB1dHM6IHtbUCBpbiBrZXlvZiBUXTogUH07XG5cbiAgLyoqXG4gICAqIEEgZGljdGlvbmFyeSBtYXBwaW5nIHRoZSBvdXRwdXRzJyBtaW5pZmllZCBwcm9wZXJ0eSBuYW1lcyB0byB0aGVpciBwdWJsaWMgQVBJIG5hbWVzLCB3aGljaFxuICAgKiBhcmUgdGhlaXIgYWxpYXNlcyBpZiBhbnksIG9yIHRoZWlyIG9yaWdpbmFsIHVubWluaWZpZWQgcHJvcGVydHkgbmFtZXNcbiAgICogKGFzIGluIGBAT3V0cHV0KCdhbGlhcycpIHByb3BlcnR5TmFtZTogYW55O2ApLlxuICAgKi9cbiAgcmVhZG9ubHkgb3V0cHV0czoge1tQIGluIGtleW9mIFRdOiBQfTtcbn1cblxuLyoqXG4gKiBSdW50aW1lIGxpbmsgaW5mb3JtYXRpb24gZm9yIERpcmVjdGl2ZXMuXG4gKlxuICogVGhpcyBpcyBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZSB1c2VkIGJ5IHRoZSByZW5kZXIgdG8gbGlua1xuICogZGlyZWN0aXZlcyBpbnRvIHRlbXBsYXRlcy5cbiAqXG4gKiBOT1RFOiBBbHdheXMgdXNlIGBkZWZpbmVEaXJlY3RpdmVgIGZ1bmN0aW9uIHRvIGNyZWF0ZSB0aGlzIG9iamVjdCxcbiAqIG5ldmVyIGNyZWF0ZSB0aGUgb2JqZWN0IGRpcmVjdGx5IHNpbmNlIHRoZSBzaGFwZSBvZiB0aGlzIG9iamVjdFxuICogY2FuIGNoYW5nZSBiZXR3ZWVuIHZlcnNpb25zLlxuICpcbiAqIEBwYXJhbSBTZWxlY3RvciB0eXBlIG1ldGFkYXRhIHNwZWNpZnlpbmcgdGhlIHNlbGVjdG9yIG9mIHRoZSBkaXJlY3RpdmUgb3IgY29tcG9uZW50XG4gKlxuICogU2VlOiB7QGxpbmsgZGVmaW5lRGlyZWN0aXZlfVxuICovXG5leHBvcnQgaW50ZXJmYWNlIERpcmVjdGl2ZURlZjxUPiBleHRlbmRzIEJhc2VEZWY8VD4ge1xuICAvKiogVG9rZW4gcmVwcmVzZW50aW5nIHRoZSBkaXJlY3RpdmUuIFVzZWQgYnkgREkuICovXG4gIHR5cGU6IFR5cGU8VD47XG5cbiAgLyoqIEZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgcHJvdmlkZXJzIGFuZCBwdWJsaXNoZXMgdGhlbSBpbnRvIHRoZSBESSBzeXN0ZW0uICovXG4gIHByb3ZpZGVyc1Jlc29sdmVyOiAoKGRlZjogRGlyZWN0aXZlRGVmPFQ+KSA9PiB2b2lkKXxudWxsO1xuXG4gIC8qKiBUaGUgc2VsZWN0b3JzIHRoYXQgd2lsbCBiZSB1c2VkIHRvIG1hdGNoIG5vZGVzIHRvIHRoaXMgZGlyZWN0aXZlLiAqL1xuICByZWFkb25seSBzZWxlY3RvcnM6IENzc1NlbGVjdG9yTGlzdDtcblxuICAvKipcbiAgICogTmFtZSB1bmRlciB3aGljaCB0aGUgZGlyZWN0aXZlIGlzIGV4cG9ydGVkIChmb3IgdXNlIHdpdGggbG9jYWwgcmVmZXJlbmNlcyBpbiB0ZW1wbGF0ZSlcbiAgICovXG4gIHJlYWRvbmx5IGV4cG9ydEFzOiBzdHJpbmd8bnVsbDtcblxuICAvKipcbiAgICogRmFjdG9yeSBmdW5jdGlvbiB1c2VkIHRvIGNyZWF0ZSBhIG5ldyBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gICAqL1xuICBmYWN0b3J5OiAodDogVHlwZTxUPnxudWxsKSA9PiBUO1xuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0byBjcmVhdGUgaW5zdGFuY2VzIG9mIGNvbnRlbnQgcXVlcmllcyBhc3NvY2lhdGVkIHdpdGggYSBnaXZlbiBkaXJlY3RpdmUuXG4gICAqL1xuICBjb250ZW50UXVlcmllczogKChkaXJlY3RpdmVJbmRleDogbnVtYmVyKSA9PiB2b2lkKXxudWxsO1xuXG4gIC8qKiBSZWZyZXNoZXMgY29udGVudCBxdWVyaWVzIGFzc29jaWF0ZWQgd2l0aCBkaXJlY3RpdmVzIGluIGEgZ2l2ZW4gdmlldyAqL1xuICBjb250ZW50UXVlcmllc1JlZnJlc2g6ICgoZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgcXVlcnlJbmRleDogbnVtYmVyKSA9PiB2b2lkKXxudWxsO1xuXG4gIC8qKiBSZWZyZXNoZXMgaG9zdCBiaW5kaW5ncyBvbiB0aGUgYXNzb2NpYXRlZCBkaXJlY3RpdmUuICovXG4gIGhvc3RCaW5kaW5nczogSG9zdEJpbmRpbmdzRnVuY3Rpb248VD58bnVsbDtcblxuICAvKipcbiAgICogU3RhdGljIGF0dHJpYnV0ZXMgdG8gc2V0IG9uIGhvc3QgZWxlbWVudC5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBhdHRyaWJ1dGUgbmFtZVxuICAgKiBPZGQgaW5kaWNlczogYXR0cmlidXRlIHZhbHVlXG4gICAqL1xuICByZWFkb25seSBhdHRyaWJ1dGVzOiBzdHJpbmdbXXxudWxsO1xuXG4gIC8qIFRoZSBmb2xsb3dpbmcgYXJlIGxpZmVjeWNsZSBob29rcyBmb3IgdGhpcyBjb21wb25lbnQgKi9cbiAgb25Jbml0OiAoKCkgPT4gdm9pZCl8bnVsbDtcbiAgZG9DaGVjazogKCgpID0+IHZvaWQpfG51bGw7XG4gIGFmdGVyQ29udGVudEluaXQ6ICgoKSA9PiB2b2lkKXxudWxsO1xuICBhZnRlckNvbnRlbnRDaGVja2VkOiAoKCkgPT4gdm9pZCl8bnVsbDtcbiAgYWZ0ZXJWaWV3SW5pdDogKCgpID0+IHZvaWQpfG51bGw7XG4gIGFmdGVyVmlld0NoZWNrZWQ6ICgoKSA9PiB2b2lkKXxudWxsO1xuICBvbkRlc3Ryb3k6ICgoKSA9PiB2b2lkKXxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgZmVhdHVyZXMgYXBwbGllZCB0byB0aGlzIGRpcmVjdGl2ZVxuICAgKi9cbiAgcmVhZG9ubHkgZmVhdHVyZXM6IERpcmVjdGl2ZURlZkZlYXR1cmVbXXxudWxsO1xufVxuXG5leHBvcnQgdHlwZSBDb21wb25lbnREZWZXaXRoTWV0YTxcbiAgICBULCBTZWxlY3RvciBleHRlbmRzIFN0cmluZywgRXhwb3J0QXMgZXh0ZW5kcyBzdHJpbmcsIElucHV0TWFwIGV4dGVuZHN7W2tleTogc3RyaW5nXTogc3RyaW5nfSxcbiAgICBPdXRwdXRNYXAgZXh0ZW5kc3tba2V5OiBzdHJpbmddOiBzdHJpbmd9LCBRdWVyeUZpZWxkcyBleHRlbmRzIHN0cmluZ1tdPiA9IENvbXBvbmVudERlZjxUPjtcblxuLyoqXG4gKiBSdW50aW1lIGxpbmsgaW5mb3JtYXRpb24gZm9yIENvbXBvbmVudHMuXG4gKlxuICogVGhpcyBpcyBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZSB1c2VkIGJ5IHRoZSByZW5kZXIgdG8gbGlua1xuICogY29tcG9uZW50cyBpbnRvIHRlbXBsYXRlcy5cbiAqXG4gKiBOT1RFOiBBbHdheXMgdXNlIGBkZWZpbmVDb21wb25lbnRgIGZ1bmN0aW9uIHRvIGNyZWF0ZSB0aGlzIG9iamVjdCxcbiAqIG5ldmVyIGNyZWF0ZSB0aGUgb2JqZWN0IGRpcmVjdGx5IHNpbmNlIHRoZSBzaGFwZSBvZiB0aGlzIG9iamVjdFxuICogY2FuIGNoYW5nZSBiZXR3ZWVuIHZlcnNpb25zLlxuICpcbiAqIFNlZToge0BsaW5rIGRlZmluZUNvbXBvbmVudH1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnREZWY8VD4gZXh0ZW5kcyBEaXJlY3RpdmVEZWY8VD4ge1xuICAvKipcbiAgICogUnVudGltZSB1bmlxdWUgY29tcG9uZW50IElELlxuICAgKi9cbiAgcmVhZG9ubHkgaWQ6IHN0cmluZztcblxuICAvKipcbiAgICogVGhlIFZpZXcgdGVtcGxhdGUgb2YgdGhlIGNvbXBvbmVudC5cbiAgICovXG4gIHJlYWRvbmx5IHRlbXBsYXRlOiBDb21wb25lbnRUZW1wbGF0ZTxUPjtcblxuICAvKipcbiAgICogQSBzZXQgb2Ygc3R5bGVzIHRoYXQgdGhlIGNvbXBvbmVudCBuZWVkcyB0byBiZSBwcmVzZW50IGZvciBjb21wb25lbnQgdG8gcmVuZGVyIGNvcnJlY3RseS5cbiAgICovXG4gIHJlYWRvbmx5IHN0eWxlczogc3RyaW5nW107XG5cbiAgLyoqXG4gICAqIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIGNvbXBvbmVudCB0ZW1wbGF0ZS5cbiAgICpcbiAgICogVXNlZCB0byBjYWxjdWxhdGUgdGhlIGxlbmd0aCBvZiB0aGUgY29tcG9uZW50J3MgTFZpZXcgYXJyYXksIHNvIHdlXG4gICAqIGNhbiBwcmUtZmlsbCB0aGUgYXJyYXkgYW5kIHNldCB0aGUgYmluZGluZyBzdGFydCBpbmRleC5cbiAgICovXG4gIC8vIFRPRE8oa2FyYSk6IHJlbW92ZSBxdWVyaWVzIGZyb20gdGhpcyBjb3VudFxuICByZWFkb25seSBjb25zdHM6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIG51bWJlciBvZiBiaW5kaW5ncyBpbiB0aGlzIGNvbXBvbmVudCB0ZW1wbGF0ZSAoaW5jbHVkaW5nIHB1cmUgZm4gYmluZGluZ3MpLlxuICAgKlxuICAgKiBVc2VkIHRvIGNhbGN1bGF0ZSB0aGUgbGVuZ3RoIG9mIHRoZSBjb21wb25lbnQncyBMVmlldyBhcnJheSwgc28gd2VcbiAgICogY2FuIHByZS1maWxsIHRoZSBhcnJheSBhbmQgc2V0IHRoZSBob3N0IGJpbmRpbmcgc3RhcnQgaW5kZXguXG4gICAqL1xuICByZWFkb25seSB2YXJzOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFF1ZXJ5LXJlbGF0ZWQgaW5zdHJ1Y3Rpb25zIGZvciBhIGNvbXBvbmVudC5cbiAgICovXG4gIHZpZXdRdWVyeTogQ29tcG9uZW50UXVlcnk8VD58bnVsbDtcblxuICAvKipcbiAgICogVGhlIHZpZXcgZW5jYXBzdWxhdGlvbiB0eXBlLCB3aGljaCBkZXRlcm1pbmVzIGhvdyBzdHlsZXMgYXJlIGFwcGxpZWQgdG9cbiAgICogRE9NIGVsZW1lbnRzLiBPbmUgb2ZcbiAgICogLSBgRW11bGF0ZWRgIChkZWZhdWx0KTogRW11bGF0ZSBuYXRpdmUgc2NvcGluZyBvZiBzdHlsZXMuXG4gICAqIC0gYE5hdGl2ZWA6IFVzZSB0aGUgbmF0aXZlIGVuY2Fwc3VsYXRpb24gbWVjaGFuaXNtIG9mIHRoZSByZW5kZXJlci5cbiAgICogLSBgU2hhZG93RG9tYDogVXNlIG1vZGVybiBbU2hhZG93RE9NXShodHRwczovL3czYy5naXRodWIuaW8vd2ViY29tcG9uZW50cy9zcGVjL3NoYWRvdy8pIGFuZFxuICAgKiAgIGNyZWF0ZSBhIFNoYWRvd1Jvb3QgZm9yIGNvbXBvbmVudCdzIGhvc3QgZWxlbWVudC5cbiAgICogLSBgTm9uZWA6IERvIG5vdCBwcm92aWRlIGFueSB0ZW1wbGF0ZSBvciBzdHlsZSBlbmNhcHN1bGF0aW9uLlxuICAgKi9cbiAgcmVhZG9ubHkgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb247XG5cbiAgLyoqXG4gICAqIERlZmluZXMgYXJiaXRyYXJ5IGRldmVsb3Blci1kZWZpbmVkIGRhdGEgdG8gYmUgc3RvcmVkIG9uIGEgcmVuZGVyZXIgaW5zdGFuY2UuXG4gICAqIFRoaXMgaXMgdXNlZnVsIGZvciByZW5kZXJlcnMgdGhhdCBkZWxlZ2F0ZSB0byBvdGhlciByZW5kZXJlcnMuXG4gICAqL1xuICByZWFkb25seSBkYXRhOiB7W2tpbmQ6IHN0cmluZ106IGFueX07XG5cbiAgLyoqIFdoZXRoZXIgb3Igbm90IHRoaXMgY29tcG9uZW50J3MgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kgaXMgT25QdXNoICovXG4gIHJlYWRvbmx5IG9uUHVzaDogYm9vbGVhbjtcblxuICAvKipcblxuICAgKiBSZWdpc3RyeSBvZiBkaXJlY3RpdmVzIGFuZCBjb21wb25lbnRzIHRoYXQgbWF5IGJlIGZvdW5kIGluIHRoaXMgdmlldy5cbiAgICpcbiAgICogVGhlIHByb3BlcnR5IGlzIGVpdGhlciBhbiBhcnJheSBvZiBgRGlyZWN0aXZlRGVmYHMgb3IgYSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIHRoZSBhcnJheSBvZlxuICAgKiBgRGlyZWN0aXZlRGVmYHMuIFRoZSBmdW5jdGlvbiBpcyBuZWNlc3NhcnkgdG8gYmUgYWJsZSB0byBzdXBwb3J0IGZvcndhcmQgZGVjbGFyYXRpb25zLlxuICAgKi9cbiAgZGlyZWN0aXZlRGVmczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeXxudWxsO1xuXG4gIC8qKlxuICAgKiBSZWdpc3RyeSBvZiBwaXBlcyB0aGF0IG1heSBiZSBmb3VuZCBpbiB0aGlzIHZpZXcuXG4gICAqXG4gICAqIFRoZSBwcm9wZXJ0eSBpcyBlaXRoZXIgYW4gYXJyYXkgb2YgYFBpcGVEZWZzYHMgb3IgYSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIHRoZSBhcnJheSBvZlxuICAgKiBgUGlwZURlZnNgcy4gVGhlIGZ1bmN0aW9uIGlzIG5lY2Vzc2FyeSB0byBiZSBhYmxlIHRvIHN1cHBvcnQgZm9yd2FyZCBkZWNsYXJhdGlvbnMuXG4gICAqL1xuICBwaXBlRGVmczogUGlwZURlZkxpc3RPckZhY3Rvcnl8bnVsbDtcblxuICAvKipcbiAgICogVXNlZCB0byBzdG9yZSB0aGUgcmVzdWx0IG9mIGBub1NpZGVFZmZlY3RzYCBmdW5jdGlvbiBzbyB0aGF0IGl0IGlzIG5vdCByZW1vdmVkIGJ5IGNsb3N1cmVcbiAgICogY29tcGlsZXIuIFRoZSBwcm9wZXJ0eSBzaG91bGQgbmV2ZXIgYmUgcmVhZC5cbiAgICovXG4gIHJlYWRvbmx5IF8/OiBuZXZlcjtcbn1cblxuLyoqXG4gKiBSdW50aW1lIGxpbmsgaW5mb3JtYXRpb24gZm9yIFBpcGVzLlxuICpcbiAqIFRoaXMgaXMgaW50ZXJuYWwgZGF0YSBzdHJ1Y3R1cmUgdXNlZCBieSB0aGUgcmVuZGVyZXIgdG8gbGlua1xuICogcGlwZXMgaW50byB0ZW1wbGF0ZXMuXG4gKlxuICogTk9URTogQWx3YXlzIHVzZSBgZGVmaW5lUGlwZWAgZnVuY3Rpb24gdG8gY3JlYXRlIHRoaXMgb2JqZWN0LFxuICogbmV2ZXIgY3JlYXRlIHRoZSBvYmplY3QgZGlyZWN0bHkgc2luY2UgdGhlIHNoYXBlIG9mIHRoaXMgb2JqZWN0XG4gKiBjYW4gY2hhbmdlIGJldHdlZW4gdmVyc2lvbnMuXG4gKlxuICogU2VlOiB7QGxpbmsgZGVmaW5lUGlwZX1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQaXBlRGVmPFQ+IHtcbiAgLyoqXG4gICAqIFBpcGUgbmFtZS5cbiAgICpcbiAgICogVXNlZCB0byByZXNvbHZlIHBpcGUgaW4gdGVtcGxhdGVzLlxuICAgKi9cbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBGYWN0b3J5IGZ1bmN0aW9uIHVzZWQgdG8gY3JlYXRlIGEgbmV3IHBpcGUgaW5zdGFuY2UuXG4gICAqL1xuICBmYWN0b3J5OiAodDogVHlwZTxUPnxudWxsKSA9PiBUO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGUgcGlwZSBpcyBwdXJlLlxuICAgKlxuICAgKiBQdXJlIHBpcGVzIHJlc3VsdCBvbmx5IGRlcGVuZHMgb24gdGhlIHBpcGUgaW5wdXQgYW5kIG5vdCBvbiBpbnRlcm5hbFxuICAgKiBzdGF0ZSBvZiB0aGUgcGlwZS5cbiAgICovXG4gIHJlYWRvbmx5IHB1cmU6IGJvb2xlYW47XG5cbiAgLyogVGhlIGZvbGxvd2luZyBhcmUgbGlmZWN5Y2xlIGhvb2tzIGZvciB0aGlzIHBpcGUgKi9cbiAgb25EZXN0cm95OiAoKCkgPT4gdm9pZCl8bnVsbDtcbn1cblxuZXhwb3J0IHR5cGUgUGlwZURlZldpdGhNZXRhPFQsIE5hbWUgZXh0ZW5kcyBzdHJpbmc+ID0gUGlwZURlZjxUPjtcblxuZXhwb3J0IGludGVyZmFjZSBEaXJlY3RpdmVEZWZGZWF0dXJlIHtcbiAgPFQ+KGRpcmVjdGl2ZURlZjogRGlyZWN0aXZlRGVmPFQ+KTogdm9pZDtcbiAgbmdJbmhlcml0PzogdHJ1ZTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnREZWZGZWF0dXJlIHtcbiAgPFQ+KGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPFQ+KTogdm9pZDtcbiAgbmdJbmhlcml0PzogdHJ1ZTtcbn1cblxuXG4vKipcbiAqIFR5cGUgdXNlZCBmb3IgZGlyZWN0aXZlRGVmcyBvbiBjb21wb25lbnQgZGVmaW5pdGlvbi5cbiAqXG4gKiBUaGUgZnVuY3Rpb24gaXMgbmVjZXNzYXJ5IHRvIGJlIGFibGUgdG8gc3VwcG9ydCBmb3J3YXJkIGRlY2xhcmF0aW9ucy5cbiAqL1xuZXhwb3J0IHR5cGUgRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSA9ICgoKSA9PiBEaXJlY3RpdmVEZWZMaXN0KSB8IERpcmVjdGl2ZURlZkxpc3Q7XG5cbmV4cG9ydCB0eXBlIERpcmVjdGl2ZURlZkxpc3QgPSAoRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+KVtdO1xuXG5leHBvcnQgdHlwZSBEaXJlY3RpdmVUeXBlc09yRmFjdG9yeSA9ICgoKSA9PiBEaXJlY3RpdmVUeXBlTGlzdCkgfCBEaXJlY3RpdmVUeXBlTGlzdDtcblxuZXhwb3J0IHR5cGUgRGlyZWN0aXZlVHlwZUxpc3QgPVxuICAgIChEaXJlY3RpdmVEZWY8YW55PnwgQ29tcG9uZW50RGVmPGFueT58XG4gICAgIFR5cGU8YW55Pi8qIFR5cGUgYXMgd29ya2Fyb3VuZCBmb3I6IE1pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy80ODgxICovKVtdO1xuXG5leHBvcnQgdHlwZSBIb3N0QmluZGluZ3NGdW5jdGlvbjxUPiA9IChyZjogUmVuZGVyRmxhZ3MsIGN0eDogVCwgZWxlbWVudEluZGV4OiBudW1iZXIpID0+IHZvaWQ7XG5cbi8qKlxuICogVHlwZSB1c2VkIGZvciBQaXBlRGVmcyBvbiBjb21wb25lbnQgZGVmaW5pdGlvbi5cbiAqXG4gKiBUaGUgZnVuY3Rpb24gaXMgbmVjZXNzYXJ5IHRvIGJlIGFibGUgdG8gc3VwcG9ydCBmb3J3YXJkIGRlY2xhcmF0aW9ucy5cbiAqL1xuZXhwb3J0IHR5cGUgUGlwZURlZkxpc3RPckZhY3RvcnkgPSAoKCkgPT4gUGlwZURlZkxpc3QpIHwgUGlwZURlZkxpc3Q7XG5cbmV4cG9ydCB0eXBlIFBpcGVEZWZMaXN0ID0gUGlwZURlZjxhbnk+W107XG5cbmV4cG9ydCB0eXBlIFBpcGVUeXBlc09yRmFjdG9yeSA9ICgoKSA9PiBEaXJlY3RpdmVUeXBlTGlzdCkgfCBEaXJlY3RpdmVUeXBlTGlzdDtcblxuZXhwb3J0IHR5cGUgUGlwZVR5cGVMaXN0ID1cbiAgICAoUGlwZURlZjxhbnk+fCBUeXBlPGFueT4vKiBUeXBlIGFzIHdvcmthcm91bmQgZm9yOiBNaWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvNDg4MSAqLylbXTtcblxuXG4vLyBOb3RlOiBUaGlzIGhhY2sgaXMgbmVjZXNzYXJ5IHNvIHdlIGRvbid0IGVycm9uZW91c2x5IGdldCBhIGNpcmN1bGFyIGRlcGVuZGVuY3lcbi8vIGZhaWx1cmUgYmFzZWQgb24gdHlwZXMuXG5leHBvcnQgY29uc3QgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgPSAxO1xuXG5leHBvcnQgY29uc3QgZW51bSBJbml0aWFsU3R5bGluZ0ZsYWdzIHtcbiAgVkFMVUVTX01PREUgPSAwYjEsXG59XG4iXX0=