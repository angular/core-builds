/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
 * A subclass of `Type` which has a static `ɵcmp`:`ComponentDef` field making it
 * consumable for rendering.
 * @record
 * @template T
 */
export function ComponentType() { }
if (false) {
    /** @type {?} */
    ComponentType.prototype.ɵcmp;
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
    /** @type {?} */
    DirectiveType.prototype.ngFactoryDef;
}
/** @enum {number} */
const DirectiveDefFlags = {
    ContentQuery: 2,
};
export { DirectiveDefFlags };
DirectiveDefFlags[DirectiveDefFlags.ContentQuery] = 'ContentQuery';
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
export function ɵɵBaseDef() { }
if (false) {
    /**
     * A dictionary mapping the inputs' minified property names to their public API names, which
     * are their aliases if any, or their original unminified property names
     * (as in `\@Input('alias') propertyName: any;`).
     * @type {?}
     */
    ɵɵBaseDef.prototype.inputs;
    /**
     * @deprecated This is only here because `NgOnChanges` incorrectly uses declared name instead of
     * public or minified name.
     * @type {?}
     */
    ɵɵBaseDef.prototype.declaredInputs;
    /**
     * A dictionary mapping the outputs' minified property names to their public API names, which
     * are their aliases if any, or their original unminified property names
     * (as in `\@Output('alias') propertyName: any;`).
     * @type {?}
     */
    ɵɵBaseDef.prototype.outputs;
    /**
     * Function to create and refresh content queries associated with a given directive.
     * @type {?}
     */
    ɵɵBaseDef.prototype.contentQueries;
    /**
     * Query-related instructions for a directive. Note that while directives don't have a
     * view and as such view queries won't necessarily do anything, there might be
     * components that extend the directive.
     * @type {?}
     */
    ɵɵBaseDef.prototype.viewQuery;
    /**
     * Refreshes host bindings on the associated directive.
     * @type {?}
     */
    ɵɵBaseDef.prototype.hostBindings;
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
     * Factory function used to create a new directive instance. Will be null initially.
     * Populated when the factory is first requested by directive instantiation logic.
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
     * Constants associated with the component's view.
     * @type {?}
     */
    ComponentDef.prototype.consts;
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
    ComponentDef.prototype.decls;
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
     * Token representing the pipe.
     * @type {?}
     */
    PipeDef.prototype.type;
    /**
     * Pipe name.
     *
     * Used to resolve pipe in templates.
     * @type {?}
     */
    PipeDef.prototype.name;
    /**
     * Factory function used to create a new pipe instance. Will be null initially.
     * Populated when the factory is first requested by pipe instantiation logic.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmaW5pdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9kZWZpbml0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUErREUsNkVBQTZFO0lBQzdFLFNBQWE7SUFFYiw2REFBNkQ7SUFDN0QsU0FBYTs7Ozs7Ozs7O0FBT2YsbUNBQWtFOzs7SUFBZCw2QkFBWTs7Ozs7Ozs7QUFNaEUsbUNBR0M7OztJQUZDLHVDQUFzQjs7SUFDdEIscUNBQXNCOzs7O0lBSXRCLGVBQW1COzs7Ozs7Ozs7O0FBT3JCLDhCQUFrRTs7O0lBQW5CLDZCQUFpQjs7Ozs7Ozs7Ozs7Ozs7O0FBb0JoRSwrQkFxQ0M7Ozs7Ozs7O0lBL0JDLDJCQUEwQzs7Ozs7O0lBTTFDLG1DQUFrRDs7Ozs7OztJQU9sRCw0QkFBMkM7Ozs7O0lBSzNDLG1DQUErQzs7Ozs7OztJQU8vQyw4QkFBdUM7Ozs7O0lBS3ZDLGlDQUEyQzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUI3QyxrQ0EwQ0M7Ozs7OztJQXhDQyw0QkFBYzs7Ozs7SUFHZCx5Q0FFb0I7Ozs7O0lBR3BCLGlDQUFvQzs7Ozs7SUFLcEMsZ0NBQWlDOzs7Ozs7SUFNakMsK0JBQTJCOztJQUczQixpQ0FBNkI7O0lBQzdCLDhCQUEwQjs7SUFDMUIsK0JBQTJCOztJQUMzQix3Q0FBb0M7O0lBQ3BDLDJDQUF1Qzs7SUFDdkMscUNBQWlDOztJQUNqQyx3Q0FBb0M7O0lBQ3BDLGlDQUE2Qjs7Ozs7SUFLN0IsZ0NBQThDOztJQUU5QyxnQ0FHNEM7Ozs7Ozs7Ozs7Ozs7Ozs7QUEyQjlDLGtDQWtHQzs7Ozs7O0lBOUZDLDBCQUFvQjs7Ozs7SUFLcEIsZ0NBQXdDOzs7OztJQUd4Qyw4QkFBb0M7Ozs7O0lBS3BDLDBDQUF1Qzs7Ozs7SUFLdkMsOEJBQTBCOzs7Ozs7OztJQVMxQiw2QkFBdUI7Ozs7Ozs7O0lBUXZCLDRCQUFzQjs7Ozs7SUFLdEIsaUNBQXVDOzs7Ozs7Ozs7OztJQVd2QyxxQ0FBMEM7Ozs7OztJQU0xQyw0QkFBcUM7Ozs7O0lBR3JDLDhCQUF5Qjs7Ozs7Ozs7SUFRekIscUNBQThDOzs7Ozs7OztJQVE5QyxnQ0FBb0M7Ozs7O0lBS3BDLCtCQUErQjs7Ozs7O0lBTS9CLDZCQUFrQjs7Ozs7O0lBTWxCLHlCQUFtQjs7Ozs7Ozs7Ozs7Ozs7OztBQWVyQiw2QkEyQkM7Ozs7OztJQXpCQyx1QkFBYzs7Ozs7OztJQU9kLHVCQUFzQjs7Ozs7O0lBTXRCLDBCQUEyQjs7Ozs7Ozs7SUFRM0IsdUJBQXVCOztJQUd2Qiw0QkFBNkI7Ozs7O0FBUS9CLHlDQVdDOzs7Ozs7Ozs7OztJQURDLHdDQUFpQjs7Ozs7O0FBR25CLHlDQVdDOzs7Ozs7Ozs7OztJQURDLHdDQUFpQjs7Ozs7O0FBdUNuQixNQUFNLE9BQU8sNkJBQTZCLEdBQUcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTY2hlbWFNZXRhZGF0YSwgVmlld0VuY2Fwc3VsYXRpb259IGZyb20gJy4uLy4uL2NvcmUnO1xuaW1wb3J0IHtQcm9jZXNzUHJvdmlkZXJzRnVuY3Rpb259IGZyb20gJy4uLy4uL2RpL2ludGVyZmFjZS9wcm92aWRlcic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcblxuaW1wb3J0IHtUQXR0cmlidXRlc30gZnJvbSAnLi9ub2RlJztcbmltcG9ydCB7Q3NzU2VsZWN0b3JMaXN0fSBmcm9tICcuL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtUVmlld30gZnJvbSAnLi92aWV3JztcblxuXG4vKipcbiAqIERlZmluaXRpb24gb2Ygd2hhdCBhIHRlbXBsYXRlIHJlbmRlcmluZyBmdW5jdGlvbiBzaG91bGQgbG9vayBsaWtlIGZvciBhIGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IHR5cGUgQ29tcG9uZW50VGVtcGxhdGU8VD4gPSB7XG4gIC8vIE5vdGU6IHRoZSBjdHggcGFyYW1ldGVyIGlzIHR5cGVkIGFzIFR8VSwgYXMgdXNpbmcgb25seSBVIHdvdWxkIHByZXZlbnQgYSB0ZW1wbGF0ZSB3aXRoXG4gIC8vIGUuZy4gY3R4OiB7fSBmcm9tIGJlaW5nIGFzc2lnbmVkIHRvIENvbXBvbmVudFRlbXBsYXRlPGFueT4gYXMgVHlwZVNjcmlwdCB3b24ndCBpbmZlciBVID0gYW55XG4gIC8vIGluIHRoYXQgc2NlbmFyaW8uIEJ5IGluY2x1ZGluZyBUIHRoaXMgaW5jb21wYXRpYmlsaXR5IGlzIHJlc29sdmVkLlxuICA8VSBleHRlbmRzIFQ+KHJmOiBSZW5kZXJGbGFncywgY3R4OiBUIHwgVSk6IHZvaWQ7XG59O1xuXG4vKipcbiAqIERlZmluaXRpb24gb2Ygd2hhdCBhIHZpZXcgcXVlcmllcyBmdW5jdGlvbiBzaG91bGQgbG9vayBsaWtlLlxuICovXG5leHBvcnQgdHlwZSBWaWV3UXVlcmllc0Z1bmN0aW9uPFQ+ID0gPFUgZXh0ZW5kcyBUPihyZjogUmVuZGVyRmxhZ3MsIGN0eDogVSkgPT4gdm9pZDtcblxuLyoqXG4gKiBEZWZpbml0aW9uIG9mIHdoYXQgYSBjb250ZW50IHF1ZXJpZXMgZnVuY3Rpb24gc2hvdWxkIGxvb2sgbGlrZS5cbiAqL1xuZXhwb3J0IHR5cGUgQ29udGVudFF1ZXJpZXNGdW5jdGlvbjxUPiA9XG4gICAgPFUgZXh0ZW5kcyBUPihyZjogUmVuZGVyRmxhZ3MsIGN0eDogVSwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcikgPT4gdm9pZDtcblxuLyoqXG4gKiBEZWZpbml0aW9uIG9mIHdoYXQgYSBmYWN0b3J5IGZ1bmN0aW9uIHNob3VsZCBsb29rIGxpa2UuXG4gKi9cbmV4cG9ydCB0eXBlIEZhY3RvcnlGbjxUPiA9IHtcbiAgLyoqXG4gICAqIFN1YmNsYXNzZXMgd2l0aG91dCBhbiBleHBsaWNpdCBjb25zdHJ1Y3RvciBjYWxsIHRocm91Z2ggdG8gdGhlIGZhY3Rvcnkgb2YgdGhlaXIgYmFzZVxuICAgKiBkZWZpbml0aW9uLCBwcm92aWRpbmcgaXQgd2l0aCB0aGVpciBvd24gY29uc3RydWN0b3IgdG8gaW5zdGFudGlhdGUuXG4gICAqL1xuICA8VSBleHRlbmRzIFQ+KHQ6IFR5cGU8VT4pOiBVO1xuXG4gIC8qKlxuICAgKiBJZiBubyBjb25zdHJ1Y3RvciB0byBpbnN0YW50aWF0ZSBpcyBwcm92aWRlZCwgYW4gaW5zdGFuY2Ugb2YgdHlwZSBUIGl0c2VsZiBpcyBjcmVhdGVkLlxuICAgKi9cbiAgKHQ/OiB1bmRlZmluZWQpOiBUO1xufTtcblxuLyoqXG4gKiBGbGFncyBwYXNzZWQgaW50byB0ZW1wbGF0ZSBmdW5jdGlvbnMgdG8gZGV0ZXJtaW5lIHdoaWNoIGJsb2NrcyAoaS5lLiBjcmVhdGlvbiwgdXBkYXRlKVxuICogc2hvdWxkIGJlIGV4ZWN1dGVkLlxuICpcbiAqIFR5cGljYWxseSwgYSB0ZW1wbGF0ZSBydW5zIGJvdGggdGhlIGNyZWF0aW9uIGJsb2NrIGFuZCB0aGUgdXBkYXRlIGJsb2NrIG9uIGluaXRpYWxpemF0aW9uIGFuZFxuICogc3Vic2VxdWVudCBydW5zIG9ubHkgZXhlY3V0ZSB0aGUgdXBkYXRlIGJsb2NrLiBIb3dldmVyLCBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzIHJlcXVpcmUgdGhhdFxuICogdGhlIGNyZWF0aW9uIGJsb2NrIGJlIGV4ZWN1dGVkIHNlcGFyYXRlbHkgZnJvbSB0aGUgdXBkYXRlIGJsb2NrIChmb3IgYmFja3dhcmRzIGNvbXBhdCkuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFJlbmRlckZsYWdzIHtcbiAgLyogV2hldGhlciB0byBydW4gdGhlIGNyZWF0aW9uIGJsb2NrIChlLmcuIGNyZWF0ZSBlbGVtZW50cyBhbmQgZGlyZWN0aXZlcykgKi9cbiAgQ3JlYXRlID0gMGIwMSxcblxuICAvKiBXaGV0aGVyIHRvIHJ1biB0aGUgdXBkYXRlIGJsb2NrIChlLmcuIHJlZnJlc2ggYmluZGluZ3MpICovXG4gIFVwZGF0ZSA9IDBiMTBcbn1cblxuLyoqXG4gKiBBIHN1YmNsYXNzIG9mIGBUeXBlYCB3aGljaCBoYXMgYSBzdGF0aWMgYMm1Y21wYDpgQ29tcG9uZW50RGVmYCBmaWVsZCBtYWtpbmcgaXRcbiAqIGNvbnN1bWFibGUgZm9yIHJlbmRlcmluZy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnRUeXBlPFQ+IGV4dGVuZHMgVHlwZTxUPiB7IMm1Y21wOiBuZXZlcjsgfVxuXG4vKipcbiAqIEEgc3ViY2xhc3Mgb2YgYFR5cGVgIHdoaWNoIGhhcyBhIHN0YXRpYyBgbmdEaXJlY3RpdmVEZWZgOmBEaXJlY3RpdmVEZWZgIGZpZWxkIG1ha2luZyBpdFxuICogY29uc3VtYWJsZSBmb3IgcmVuZGVyaW5nLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERpcmVjdGl2ZVR5cGU8VD4gZXh0ZW5kcyBUeXBlPFQ+IHtcbiAgbmdEaXJlY3RpdmVEZWY6IG5ldmVyO1xuICBuZ0ZhY3RvcnlEZWY6ICgpID0+IFQ7XG59XG5cbmV4cG9ydCBlbnVtIERpcmVjdGl2ZURlZkZsYWdzIHtcbiAgQ29udGVudFF1ZXJ5ID0gMGIxMFxufVxuXG4vKipcbiAqIEEgc3ViY2xhc3Mgb2YgYFR5cGVgIHdoaWNoIGhhcyBhIHN0YXRpYyBgbmdQaXBlRGVmYDpgUGlwZURlZmAgZmllbGQgbWFraW5nIGl0XG4gKiBjb25zdW1hYmxlIGZvciByZW5kZXJpbmcuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUGlwZVR5cGU8VD4gZXh0ZW5kcyBUeXBlPFQ+IHsgbmdQaXBlRGVmOiBuZXZlcjsgfVxuXG4vKipcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCB0eXBlIMm1ybVEaXJlY3RpdmVEZWZXaXRoTWV0YTxcbiAgICBULCBTZWxlY3RvciBleHRlbmRzIHN0cmluZywgRXhwb3J0QXMgZXh0ZW5kcyBzdHJpbmdbXSwgSW5wdXRNYXAgZXh0ZW5kc3tba2V5OiBzdHJpbmddOiBzdHJpbmd9LFxuICAgIE91dHB1dE1hcCBleHRlbmRze1trZXk6IHN0cmluZ106IHN0cmluZ30sIFF1ZXJ5RmllbGRzIGV4dGVuZHMgc3RyaW5nW10+ID0gRGlyZWN0aXZlRGVmPFQ+O1xuXG4vKipcbiAqIFJ1bnRpbWUgaW5mb3JtYXRpb24gZm9yIGNsYXNzZXMgdGhhdCBhcmUgaW5oZXJpdGVkIGJ5IGNvbXBvbmVudHMgb3IgZGlyZWN0aXZlc1xuICogdGhhdCBhcmVuJ3QgZGVmaW5lZCBhcyBjb21wb25lbnRzIG9yIGRpcmVjdGl2ZXMuXG4gKlxuICogVGhpcyBpcyBhbiBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZSB1c2VkIGJ5IHRoZSByZW5kZXJlciB0byBkZXRlcm1pbmUgd2hhdCBpbnB1dHNcbiAqIGFuZCBvdXRwdXRzIHNob3VsZCBiZSBpbmhlcml0ZWQuXG4gKlxuICogU2VlOiB7QGxpbmsgZGVmaW5lQmFzZX1cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIMm1ybVCYXNlRGVmPFQ+IHtcbiAgLyoqXG4gICAqIEEgZGljdGlvbmFyeSBtYXBwaW5nIHRoZSBpbnB1dHMnIG1pbmlmaWVkIHByb3BlcnR5IG5hbWVzIHRvIHRoZWlyIHB1YmxpYyBBUEkgbmFtZXMsIHdoaWNoXG4gICAqIGFyZSB0aGVpciBhbGlhc2VzIGlmIGFueSwgb3IgdGhlaXIgb3JpZ2luYWwgdW5taW5pZmllZCBwcm9wZXJ0eSBuYW1lc1xuICAgKiAoYXMgaW4gYEBJbnB1dCgnYWxpYXMnKSBwcm9wZXJ0eU5hbWU6IGFueTtgKS5cbiAgICovXG4gIHJlYWRvbmx5IGlucHV0czoge1tQIGluIGtleW9mIFRdOiBzdHJpbmd9O1xuXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBUaGlzIGlzIG9ubHkgaGVyZSBiZWNhdXNlIGBOZ09uQ2hhbmdlc2AgaW5jb3JyZWN0bHkgdXNlcyBkZWNsYXJlZCBuYW1lIGluc3RlYWQgb2ZcbiAgICogcHVibGljIG9yIG1pbmlmaWVkIG5hbWUuXG4gICAqL1xuICByZWFkb25seSBkZWNsYXJlZElucHV0czoge1tQIGluIGtleW9mIFRdOiBzdHJpbmd9O1xuXG4gIC8qKlxuICAgKiBBIGRpY3Rpb25hcnkgbWFwcGluZyB0aGUgb3V0cHV0cycgbWluaWZpZWQgcHJvcGVydHkgbmFtZXMgdG8gdGhlaXIgcHVibGljIEFQSSBuYW1lcywgd2hpY2hcbiAgICogYXJlIHRoZWlyIGFsaWFzZXMgaWYgYW55LCBvciB0aGVpciBvcmlnaW5hbCB1bm1pbmlmaWVkIHByb3BlcnR5IG5hbWVzXG4gICAqIChhcyBpbiBgQE91dHB1dCgnYWxpYXMnKSBwcm9wZXJ0eU5hbWU6IGFueTtgKS5cbiAgICovXG4gIHJlYWRvbmx5IG91dHB1dHM6IHtbUCBpbiBrZXlvZiBUXTogc3RyaW5nfTtcblxuICAvKipcbiAgICogRnVuY3Rpb24gdG8gY3JlYXRlIGFuZCByZWZyZXNoIGNvbnRlbnQgcXVlcmllcyBhc3NvY2lhdGVkIHdpdGggYSBnaXZlbiBkaXJlY3RpdmUuXG4gICAqL1xuICBjb250ZW50UXVlcmllczogQ29udGVudFF1ZXJpZXNGdW5jdGlvbjxUPnxudWxsO1xuXG4gIC8qKlxuICAgKiBRdWVyeS1yZWxhdGVkIGluc3RydWN0aW9ucyBmb3IgYSBkaXJlY3RpdmUuIE5vdGUgdGhhdCB3aGlsZSBkaXJlY3RpdmVzIGRvbid0IGhhdmUgYVxuICAgKiB2aWV3IGFuZCBhcyBzdWNoIHZpZXcgcXVlcmllcyB3b24ndCBuZWNlc3NhcmlseSBkbyBhbnl0aGluZywgdGhlcmUgbWlnaHQgYmVcbiAgICogY29tcG9uZW50cyB0aGF0IGV4dGVuZCB0aGUgZGlyZWN0aXZlLlxuICAgKi9cbiAgdmlld1F1ZXJ5OiBWaWV3UXVlcmllc0Z1bmN0aW9uPFQ+fG51bGw7XG5cbiAgLyoqXG4gICAqIFJlZnJlc2hlcyBob3N0IGJpbmRpbmdzIG9uIHRoZSBhc3NvY2lhdGVkIGRpcmVjdGl2ZS5cbiAgICovXG4gIGhvc3RCaW5kaW5nczogSG9zdEJpbmRpbmdzRnVuY3Rpb248VD58bnVsbDtcbn1cblxuLyoqXG4gKiBSdW50aW1lIGxpbmsgaW5mb3JtYXRpb24gZm9yIERpcmVjdGl2ZXMuXG4gKlxuICogVGhpcyBpcyBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZSB1c2VkIGJ5IHRoZSByZW5kZXIgdG8gbGlua1xuICogZGlyZWN0aXZlcyBpbnRvIHRlbXBsYXRlcy5cbiAqXG4gKiBOT1RFOiBBbHdheXMgdXNlIGBkZWZpbmVEaXJlY3RpdmVgIGZ1bmN0aW9uIHRvIGNyZWF0ZSB0aGlzIG9iamVjdCxcbiAqIG5ldmVyIGNyZWF0ZSB0aGUgb2JqZWN0IGRpcmVjdGx5IHNpbmNlIHRoZSBzaGFwZSBvZiB0aGlzIG9iamVjdFxuICogY2FuIGNoYW5nZSBiZXR3ZWVuIHZlcnNpb25zLlxuICpcbiAqIEBwYXJhbSBTZWxlY3RvciB0eXBlIG1ldGFkYXRhIHNwZWNpZnlpbmcgdGhlIHNlbGVjdG9yIG9mIHRoZSBkaXJlY3RpdmUgb3IgY29tcG9uZW50XG4gKlxuICogU2VlOiB7QGxpbmsgZGVmaW5lRGlyZWN0aXZlfVxuICovXG5leHBvcnQgaW50ZXJmYWNlIERpcmVjdGl2ZURlZjxUPiBleHRlbmRzIMm1ybVCYXNlRGVmPFQ+IHtcbiAgLyoqIFRva2VuIHJlcHJlc2VudGluZyB0aGUgZGlyZWN0aXZlLiBVc2VkIGJ5IERJLiAqL1xuICB0eXBlOiBUeXBlPFQ+O1xuXG4gIC8qKiBGdW5jdGlvbiB0aGF0IHJlc29sdmVzIHByb3ZpZGVycyBhbmQgcHVibGlzaGVzIHRoZW0gaW50byB0aGUgREkgc3lzdGVtLiAqL1xuICBwcm92aWRlcnNSZXNvbHZlcjpcbiAgICAgICg8VSBleHRlbmRzIFQ+KGRlZjogRGlyZWN0aXZlRGVmPFU+LCBwcm9jZXNzUHJvdmlkZXJzRm4/OiBQcm9jZXNzUHJvdmlkZXJzRnVuY3Rpb24pID0+XG4gICAgICAgICAgIHZvaWQpfG51bGw7XG5cbiAgLyoqIFRoZSBzZWxlY3RvcnMgdGhhdCB3aWxsIGJlIHVzZWQgdG8gbWF0Y2ggbm9kZXMgdG8gdGhpcyBkaXJlY3RpdmUuICovXG4gIHJlYWRvbmx5IHNlbGVjdG9yczogQ3NzU2VsZWN0b3JMaXN0O1xuXG4gIC8qKlxuICAgKiBOYW1lIHVuZGVyIHdoaWNoIHRoZSBkaXJlY3RpdmUgaXMgZXhwb3J0ZWQgKGZvciB1c2Ugd2l0aCBsb2NhbCByZWZlcmVuY2VzIGluIHRlbXBsYXRlKVxuICAgKi9cbiAgcmVhZG9ubHkgZXhwb3J0QXM6IHN0cmluZ1tdfG51bGw7XG5cbiAgLyoqXG4gICAqIEZhY3RvcnkgZnVuY3Rpb24gdXNlZCB0byBjcmVhdGUgYSBuZXcgZGlyZWN0aXZlIGluc3RhbmNlLiBXaWxsIGJlIG51bGwgaW5pdGlhbGx5LlxuICAgKiBQb3B1bGF0ZWQgd2hlbiB0aGUgZmFjdG9yeSBpcyBmaXJzdCByZXF1ZXN0ZWQgYnkgZGlyZWN0aXZlIGluc3RhbnRpYXRpb24gbG9naWMuXG4gICAqL1xuICBmYWN0b3J5OiBGYWN0b3J5Rm48VD58bnVsbDtcblxuICAvKiBUaGUgZm9sbG93aW5nIGFyZSBsaWZlY3ljbGUgaG9va3MgZm9yIHRoaXMgY29tcG9uZW50ICovXG4gIG9uQ2hhbmdlczogKCgpID0+IHZvaWQpfG51bGw7XG4gIG9uSW5pdDogKCgpID0+IHZvaWQpfG51bGw7XG4gIGRvQ2hlY2s6ICgoKSA9PiB2b2lkKXxudWxsO1xuICBhZnRlckNvbnRlbnRJbml0OiAoKCkgPT4gdm9pZCl8bnVsbDtcbiAgYWZ0ZXJDb250ZW50Q2hlY2tlZDogKCgpID0+IHZvaWQpfG51bGw7XG4gIGFmdGVyVmlld0luaXQ6ICgoKSA9PiB2b2lkKXxudWxsO1xuICBhZnRlclZpZXdDaGVja2VkOiAoKCkgPT4gdm9pZCl8bnVsbDtcbiAgb25EZXN0cm95OiAoKCkgPT4gdm9pZCl8bnVsbDtcblxuICAvKipcbiAgICogVGhlIGZlYXR1cmVzIGFwcGxpZWQgdG8gdGhpcyBkaXJlY3RpdmVcbiAgICovXG4gIHJlYWRvbmx5IGZlYXR1cmVzOiBEaXJlY3RpdmVEZWZGZWF0dXJlW118bnVsbDtcblxuICBzZXRJbnB1dDpcbiAgICAgICg8VSBleHRlbmRzIFQ+KFxuICAgICAgICAgICB0aGlzOiBEaXJlY3RpdmVEZWY8VT4sIGluc3RhbmNlOiBVLCB2YWx1ZTogYW55LCBwdWJsaWNOYW1lOiBzdHJpbmcsXG4gICAgICAgICAgIHByaXZhdGVOYW1lOiBzdHJpbmcpID0+IHZvaWQpfG51bGw7XG59XG5cbi8qKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IHR5cGUgybXJtUNvbXBvbmVudERlZldpdGhNZXRhPFxuICAgIFQsIFNlbGVjdG9yIGV4dGVuZHMgU3RyaW5nLCBFeHBvcnRBcyBleHRlbmRzIHN0cmluZ1tdLCBJbnB1dE1hcCBleHRlbmRze1trZXk6IHN0cmluZ106IHN0cmluZ30sXG4gICAgT3V0cHV0TWFwIGV4dGVuZHN7W2tleTogc3RyaW5nXTogc3RyaW5nfSwgUXVlcnlGaWVsZHMgZXh0ZW5kcyBzdHJpbmdbXT4gPSBDb21wb25lbnREZWY8VD47XG5cbi8qKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IHR5cGUgybXJtUZhY3RvcnlEZWY8VD4gPSAoKSA9PiBUO1xuXG4vKipcbiAqIFJ1bnRpbWUgbGluayBpbmZvcm1hdGlvbiBmb3IgQ29tcG9uZW50cy5cbiAqXG4gKiBUaGlzIGlzIGludGVybmFsIGRhdGEgc3RydWN0dXJlIHVzZWQgYnkgdGhlIHJlbmRlciB0byBsaW5rXG4gKiBjb21wb25lbnRzIGludG8gdGVtcGxhdGVzLlxuICpcbiAqIE5PVEU6IEFsd2F5cyB1c2UgYGRlZmluZUNvbXBvbmVudGAgZnVuY3Rpb24gdG8gY3JlYXRlIHRoaXMgb2JqZWN0LFxuICogbmV2ZXIgY3JlYXRlIHRoZSBvYmplY3QgZGlyZWN0bHkgc2luY2UgdGhlIHNoYXBlIG9mIHRoaXMgb2JqZWN0XG4gKiBjYW4gY2hhbmdlIGJldHdlZW4gdmVyc2lvbnMuXG4gKlxuICogU2VlOiB7QGxpbmsgZGVmaW5lQ29tcG9uZW50fVxuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbXBvbmVudERlZjxUPiBleHRlbmRzIERpcmVjdGl2ZURlZjxUPiB7XG4gIC8qKlxuICAgKiBSdW50aW1lIHVuaXF1ZSBjb21wb25lbnQgSUQuXG4gICAqL1xuICByZWFkb25seSBpZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgVmlldyB0ZW1wbGF0ZSBvZiB0aGUgY29tcG9uZW50LlxuICAgKi9cbiAgcmVhZG9ubHkgdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPFQ+O1xuXG4gIC8qKiBDb25zdGFudHMgYXNzb2NpYXRlZCB3aXRoIHRoZSBjb21wb25lbnQncyB2aWV3LiAqL1xuICByZWFkb25seSBjb25zdHM6IFRBdHRyaWJ1dGVzW118bnVsbDtcblxuICAvKipcbiAgICogQW4gYXJyYXkgb2YgYG5nQ29udGVudFtzZWxlY3Rvcl1gIHZhbHVlcyB0aGF0IHdlcmUgZm91bmQgaW4gdGhlIHRlbXBsYXRlLlxuICAgKi9cbiAgcmVhZG9ubHkgbmdDb250ZW50U2VsZWN0b3JzPzogc3RyaW5nW107XG5cbiAgLyoqXG4gICAqIEEgc2V0IG9mIHN0eWxlcyB0aGF0IHRoZSBjb21wb25lbnQgbmVlZHMgdG8gYmUgcHJlc2VudCBmb3IgY29tcG9uZW50IHRvIHJlbmRlciBjb3JyZWN0bHkuXG4gICAqL1xuICByZWFkb25seSBzdHlsZXM6IHN0cmluZ1tdO1xuXG4gIC8qKlxuICAgKiBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyBjb21wb25lbnQgdGVtcGxhdGUuXG4gICAqXG4gICAqIFVzZWQgdG8gY2FsY3VsYXRlIHRoZSBsZW5ndGggb2YgdGhlIGNvbXBvbmVudCdzIExWaWV3IGFycmF5LCBzbyB3ZVxuICAgKiBjYW4gcHJlLWZpbGwgdGhlIGFycmF5IGFuZCBzZXQgdGhlIGJpbmRpbmcgc3RhcnQgaW5kZXguXG4gICAqL1xuICAvLyBUT0RPKGthcmEpOiByZW1vdmUgcXVlcmllcyBmcm9tIHRoaXMgY291bnRcbiAgcmVhZG9ubHkgZGVjbHM6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIG51bWJlciBvZiBiaW5kaW5ncyBpbiB0aGlzIGNvbXBvbmVudCB0ZW1wbGF0ZSAoaW5jbHVkaW5nIHB1cmUgZm4gYmluZGluZ3MpLlxuICAgKlxuICAgKiBVc2VkIHRvIGNhbGN1bGF0ZSB0aGUgbGVuZ3RoIG9mIHRoZSBjb21wb25lbnQncyBMVmlldyBhcnJheSwgc28gd2VcbiAgICogY2FuIHByZS1maWxsIHRoZSBhcnJheSBhbmQgc2V0IHRoZSBob3N0IGJpbmRpbmcgc3RhcnQgaW5kZXguXG4gICAqL1xuICByZWFkb25seSB2YXJzOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFF1ZXJ5LXJlbGF0ZWQgaW5zdHJ1Y3Rpb25zIGZvciBhIGNvbXBvbmVudC5cbiAgICovXG4gIHZpZXdRdWVyeTogVmlld1F1ZXJpZXNGdW5jdGlvbjxUPnxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgdmlldyBlbmNhcHN1bGF0aW9uIHR5cGUsIHdoaWNoIGRldGVybWluZXMgaG93IHN0eWxlcyBhcmUgYXBwbGllZCB0b1xuICAgKiBET00gZWxlbWVudHMuIE9uZSBvZlxuICAgKiAtIGBFbXVsYXRlZGAgKGRlZmF1bHQpOiBFbXVsYXRlIG5hdGl2ZSBzY29waW5nIG9mIHN0eWxlcy5cbiAgICogLSBgTmF0aXZlYDogVXNlIHRoZSBuYXRpdmUgZW5jYXBzdWxhdGlvbiBtZWNoYW5pc20gb2YgdGhlIHJlbmRlcmVyLlxuICAgKiAtIGBTaGFkb3dEb21gOiBVc2UgbW9kZXJuIFtTaGFkb3dET01dKGh0dHBzOi8vdzNjLmdpdGh1Yi5pby93ZWJjb21wb25lbnRzL3NwZWMvc2hhZG93LykgYW5kXG4gICAqICAgY3JlYXRlIGEgU2hhZG93Um9vdCBmb3IgY29tcG9uZW50J3MgaG9zdCBlbGVtZW50LlxuICAgKiAtIGBOb25lYDogRG8gbm90IHByb3ZpZGUgYW55IHRlbXBsYXRlIG9yIHN0eWxlIGVuY2Fwc3VsYXRpb24uXG4gICAqL1xuICByZWFkb25seSBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbjtcblxuICAvKipcbiAgICogRGVmaW5lcyBhcmJpdHJhcnkgZGV2ZWxvcGVyLWRlZmluZWQgZGF0YSB0byBiZSBzdG9yZWQgb24gYSByZW5kZXJlciBpbnN0YW5jZS5cbiAgICogVGhpcyBpcyB1c2VmdWwgZm9yIHJlbmRlcmVycyB0aGF0IGRlbGVnYXRlIHRvIG90aGVyIHJlbmRlcmVycy5cbiAgICovXG4gIHJlYWRvbmx5IGRhdGE6IHtba2luZDogc3RyaW5nXTogYW55fTtcblxuICAvKiogV2hldGhlciBvciBub3QgdGhpcyBjb21wb25lbnQncyBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSBpcyBPblB1c2ggKi9cbiAgcmVhZG9ubHkgb25QdXNoOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBSZWdpc3RyeSBvZiBkaXJlY3RpdmVzIGFuZCBjb21wb25lbnRzIHRoYXQgbWF5IGJlIGZvdW5kIGluIHRoaXMgdmlldy5cbiAgICpcbiAgICogVGhlIHByb3BlcnR5IGlzIGVpdGhlciBhbiBhcnJheSBvZiBgRGlyZWN0aXZlRGVmYHMgb3IgYSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIHRoZSBhcnJheSBvZlxuICAgKiBgRGlyZWN0aXZlRGVmYHMuIFRoZSBmdW5jdGlvbiBpcyBuZWNlc3NhcnkgdG8gYmUgYWJsZSB0byBzdXBwb3J0IGZvcndhcmQgZGVjbGFyYXRpb25zLlxuICAgKi9cbiAgZGlyZWN0aXZlRGVmczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeXxudWxsO1xuXG4gIC8qKlxuICAgKiBSZWdpc3RyeSBvZiBwaXBlcyB0aGF0IG1heSBiZSBmb3VuZCBpbiB0aGlzIHZpZXcuXG4gICAqXG4gICAqIFRoZSBwcm9wZXJ0eSBpcyBlaXRoZXIgYW4gYXJyYXkgb2YgYFBpcGVEZWZzYHMgb3IgYSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIHRoZSBhcnJheSBvZlxuICAgKiBgUGlwZURlZnNgcy4gVGhlIGZ1bmN0aW9uIGlzIG5lY2Vzc2FyeSB0byBiZSBhYmxlIHRvIHN1cHBvcnQgZm9yd2FyZCBkZWNsYXJhdGlvbnMuXG4gICAqL1xuICBwaXBlRGVmczogUGlwZURlZkxpc3RPckZhY3Rvcnl8bnVsbDtcblxuICAvKipcbiAgICogVGhlIHNldCBvZiBzY2hlbWFzIHRoYXQgZGVjbGFyZSBlbGVtZW50cyB0byBiZSBhbGxvd2VkIGluIHRoZSBjb21wb25lbnQncyB0ZW1wbGF0ZS5cbiAgICovXG4gIHNjaGVtYXM6IFNjaGVtYU1ldGFkYXRhW118bnVsbDtcblxuICAvKipcbiAgICogSXZ5IHJ1bnRpbWUgdXNlcyB0aGlzIHBsYWNlIHRvIHN0b3JlIHRoZSBjb21wdXRlZCB0VmlldyBmb3IgdGhlIGNvbXBvbmVudC4gVGhpcyBnZXRzIGZpbGxlZCBvblxuICAgKiB0aGUgZmlyc3QgcnVuIG9mIGNvbXBvbmVudC5cbiAgICovXG4gIHRWaWV3OiBUVmlld3xudWxsO1xuXG4gIC8qKlxuICAgKiBVc2VkIHRvIHN0b3JlIHRoZSByZXN1bHQgb2YgYG5vU2lkZUVmZmVjdHNgIGZ1bmN0aW9uIHNvIHRoYXQgaXQgaXMgbm90IHJlbW92ZWQgYnkgY2xvc3VyZVxuICAgKiBjb21waWxlci4gVGhlIHByb3BlcnR5IHNob3VsZCBuZXZlciBiZSByZWFkLlxuICAgKi9cbiAgcmVhZG9ubHkgXz86IG5ldmVyO1xufVxuXG4vKipcbiAqIFJ1bnRpbWUgbGluayBpbmZvcm1hdGlvbiBmb3IgUGlwZXMuXG4gKlxuICogVGhpcyBpcyBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZSB1c2VkIGJ5IHRoZSByZW5kZXJlciB0byBsaW5rXG4gKiBwaXBlcyBpbnRvIHRlbXBsYXRlcy5cbiAqXG4gKiBOT1RFOiBBbHdheXMgdXNlIGBkZWZpbmVQaXBlYCBmdW5jdGlvbiB0byBjcmVhdGUgdGhpcyBvYmplY3QsXG4gKiBuZXZlciBjcmVhdGUgdGhlIG9iamVjdCBkaXJlY3RseSBzaW5jZSB0aGUgc2hhcGUgb2YgdGhpcyBvYmplY3RcbiAqIGNhbiBjaGFuZ2UgYmV0d2VlbiB2ZXJzaW9ucy5cbiAqXG4gKiBTZWU6IHtAbGluayBkZWZpbmVQaXBlfVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFBpcGVEZWY8VD4ge1xuICAvKiogVG9rZW4gcmVwcmVzZW50aW5nIHRoZSBwaXBlLiAqL1xuICB0eXBlOiBUeXBlPFQ+O1xuXG4gIC8qKlxuICAgKiBQaXBlIG5hbWUuXG4gICAqXG4gICAqIFVzZWQgdG8gcmVzb2x2ZSBwaXBlIGluIHRlbXBsYXRlcy5cbiAgICovXG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcblxuICAvKipcbiAgICogRmFjdG9yeSBmdW5jdGlvbiB1c2VkIHRvIGNyZWF0ZSBhIG5ldyBwaXBlIGluc3RhbmNlLiBXaWxsIGJlIG51bGwgaW5pdGlhbGx5LlxuICAgKiBQb3B1bGF0ZWQgd2hlbiB0aGUgZmFjdG9yeSBpcyBmaXJzdCByZXF1ZXN0ZWQgYnkgcGlwZSBpbnN0YW50aWF0aW9uIGxvZ2ljLlxuICAgKi9cbiAgZmFjdG9yeTogRmFjdG9yeUZuPFQ+fG51bGw7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZSBwaXBlIGlzIHB1cmUuXG4gICAqXG4gICAqIFB1cmUgcGlwZXMgcmVzdWx0IG9ubHkgZGVwZW5kcyBvbiB0aGUgcGlwZSBpbnB1dCBhbmQgbm90IG9uIGludGVybmFsXG4gICAqIHN0YXRlIG9mIHRoZSBwaXBlLlxuICAgKi9cbiAgcmVhZG9ubHkgcHVyZTogYm9vbGVhbjtcblxuICAvKiBUaGUgZm9sbG93aW5nIGFyZSBsaWZlY3ljbGUgaG9va3MgZm9yIHRoaXMgcGlwZSAqL1xuICBvbkRlc3Ryb3k6ICgoKSA9PiB2b2lkKXxudWxsO1xufVxuXG4vKipcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCB0eXBlIMm1ybVQaXBlRGVmV2l0aE1ldGE8VCwgTmFtZSBleHRlbmRzIHN0cmluZz4gPSBQaXBlRGVmPFQ+O1xuXG5leHBvcnQgaW50ZXJmYWNlIERpcmVjdGl2ZURlZkZlYXR1cmUge1xuICA8VD4oZGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWY8VD4pOiB2b2lkO1xuICAvKipcbiAgICogTWFya3MgYSBmZWF0dXJlIGFzIHNvbWV0aGluZyB0aGF0IHtAbGluayBJbmhlcml0RGVmaW5pdGlvbkZlYXR1cmV9IHdpbGwgZXhlY3V0ZVxuICAgKiBkdXJpbmcgaW5oZXJpdGFuY2UuXG4gICAqXG4gICAqIE5PVEU6IERPIE5PVCBTRVQgSU4gUk9PVCBPRiBNT0RVTEUhIERvaW5nIHNvIHdpbGwgcmVzdWx0IGluIHRyZWUtc2hha2Vycy9idW5kbGVyc1xuICAgKiBpZGVudGlmeWluZyB0aGUgY2hhbmdlIGFzIGEgc2lkZSBlZmZlY3QsIGFuZCB0aGUgZmVhdHVyZSB3aWxsIGJlIGluY2x1ZGVkIGluXG4gICAqIGV2ZXJ5IGJ1bmRsZS5cbiAgICovXG4gIG5nSW5oZXJpdD86IHRydWU7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcG9uZW50RGVmRmVhdHVyZSB7XG4gIDxUPihjb21wb25lbnREZWY6IENvbXBvbmVudERlZjxUPik6IHZvaWQ7XG4gIC8qKlxuICAgKiBNYXJrcyBhIGZlYXR1cmUgYXMgc29tZXRoaW5nIHRoYXQge0BsaW5rIEluaGVyaXREZWZpbml0aW9uRmVhdHVyZX0gd2lsbCBleGVjdXRlXG4gICAqIGR1cmluZyBpbmhlcml0YW5jZS5cbiAgICpcbiAgICogTk9URTogRE8gTk9UIFNFVCBJTiBST09UIE9GIE1PRFVMRSEgRG9pbmcgc28gd2lsbCByZXN1bHQgaW4gdHJlZS1zaGFrZXJzL2J1bmRsZXJzXG4gICAqIGlkZW50aWZ5aW5nIHRoZSBjaGFuZ2UgYXMgYSBzaWRlIGVmZmVjdCwgYW5kIHRoZSBmZWF0dXJlIHdpbGwgYmUgaW5jbHVkZWQgaW5cbiAgICogZXZlcnkgYnVuZGxlLlxuICAgKi9cbiAgbmdJbmhlcml0PzogdHJ1ZTtcbn1cblxuXG4vKipcbiAqIFR5cGUgdXNlZCBmb3IgZGlyZWN0aXZlRGVmcyBvbiBjb21wb25lbnQgZGVmaW5pdGlvbi5cbiAqXG4gKiBUaGUgZnVuY3Rpb24gaXMgbmVjZXNzYXJ5IHRvIGJlIGFibGUgdG8gc3VwcG9ydCBmb3J3YXJkIGRlY2xhcmF0aW9ucy5cbiAqL1xuZXhwb3J0IHR5cGUgRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSA9ICgoKSA9PiBEaXJlY3RpdmVEZWZMaXN0KSB8IERpcmVjdGl2ZURlZkxpc3Q7XG5cbmV4cG9ydCB0eXBlIERpcmVjdGl2ZURlZkxpc3QgPSAoRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+KVtdO1xuXG5leHBvcnQgdHlwZSBEaXJlY3RpdmVUeXBlc09yRmFjdG9yeSA9ICgoKSA9PiBEaXJlY3RpdmVUeXBlTGlzdCkgfCBEaXJlY3RpdmVUeXBlTGlzdDtcblxuZXhwb3J0IHR5cGUgRGlyZWN0aXZlVHlwZUxpc3QgPVxuICAgIChEaXJlY3RpdmVUeXBlPGFueT58IENvbXBvbmVudFR5cGU8YW55PnxcbiAgICAgVHlwZTxhbnk+LyogVHlwZSBhcyB3b3JrYXJvdW5kIGZvcjogTWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzQ4ODEgKi8pW107XG5cbmV4cG9ydCB0eXBlIEhvc3RCaW5kaW5nc0Z1bmN0aW9uPFQ+ID1cbiAgICA8VSBleHRlbmRzIFQ+KHJmOiBSZW5kZXJGbGFncywgY3R4OiBVLCBlbGVtZW50SW5kZXg6IG51bWJlcikgPT4gdm9pZDtcblxuLyoqXG4gKiBUeXBlIHVzZWQgZm9yIFBpcGVEZWZzIG9uIGNvbXBvbmVudCBkZWZpbml0aW9uLlxuICpcbiAqIFRoZSBmdW5jdGlvbiBpcyBuZWNlc3NhcnkgdG8gYmUgYWJsZSB0byBzdXBwb3J0IGZvcndhcmQgZGVjbGFyYXRpb25zLlxuICovXG5leHBvcnQgdHlwZSBQaXBlRGVmTGlzdE9yRmFjdG9yeSA9ICgoKSA9PiBQaXBlRGVmTGlzdCkgfCBQaXBlRGVmTGlzdDtcblxuZXhwb3J0IHR5cGUgUGlwZURlZkxpc3QgPSBQaXBlRGVmPGFueT5bXTtcblxuZXhwb3J0IHR5cGUgUGlwZVR5cGVzT3JGYWN0b3J5ID0gKCgpID0+IFBpcGVUeXBlTGlzdCkgfCBQaXBlVHlwZUxpc3Q7XG5cbmV4cG9ydCB0eXBlIFBpcGVUeXBlTGlzdCA9XG4gICAgKFBpcGVUeXBlPGFueT58IFR5cGU8YW55Pi8qIFR5cGUgYXMgd29ya2Fyb3VuZCBmb3I6IE1pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy80ODgxICovKVtdO1xuXG5cbi8vIE5vdGU6IFRoaXMgaGFjayBpcyBuZWNlc3Nhcnkgc28gd2UgZG9uJ3QgZXJyb25lb3VzbHkgZ2V0IGEgY2lyY3VsYXIgZGVwZW5kZW5jeVxuLy8gZmFpbHVyZSBiYXNlZCBvbiB0eXBlcy5cbmV4cG9ydCBjb25zdCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCA9IDE7XG4iXX0=