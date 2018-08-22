/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** @typedef {?} */
var ComponentTemplate;
export { ComponentTemplate };
/** @typedef {?} */
var ComponentQuery;
export { ComponentQuery };
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
/** @type {?} */
ComponentType.prototype.ngComponentDef;
/**
 * A subclass of `Type` which has a static `ngDirectiveDef`:`DirectiveDef` field making it
 * consumable for rendering.
 * @record
 * @template T
 */
export function DirectiveType() { }
/** @type {?} */
DirectiveType.prototype.ngDirectiveDef;
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
/** @type {?} */
PipeType.prototype.ngPipeDef;
/** @typedef {?} */
var DirectiveDefInternal;
export { DirectiveDefInternal };
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
// unsupported: template constraints.
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
 * @template T, Selector
 */
export function DirectiveDef() { }
/**
 * Token representing the directive. Used by DI.
 * @type {?}
 */
DirectiveDef.prototype.type;
/**
 * Function that makes a directive public to the DI system.
 * @type {?}
 */
DirectiveDef.prototype.diPublic;
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
 *
 * Usually returns the directive instance, but if the directive has a content query,
 * it instead returns an array that contains the instance as well as content query data.
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
 * The number of host bindings (including pure fn bindings) in this directive/component.
 *
 * Used to calculate the length of the LViewData array for the *parent* component
 * of this directive/component.
 * @type {?}
 */
DirectiveDef.prototype.hostVars;
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
/** @typedef {?} */
var ComponentDefInternal;
export { ComponentDefInternal };
// unsupported: template constraints.
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
 * @template T, Selector
 */
export function ComponentDef() { }
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
 * Used to calculate the length of the component's LViewData array, so we
 * can pre-fill the array and set the binding start index.
 * @type {?}
 */
ComponentDef.prototype.consts;
/**
 * The number of bindings in this component template (including pure fn bindings).
 *
 * Used to calculate the length of the component's LViewData array, so we
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
 * Defines the set of injectable providers that are visible to a Directive and its content DOM
 * children.
 * @type {?|undefined}
 */
ComponentDef.prototype.providers;
/**
 * Defines the set of injectable providers that are visible to a Directive and its view DOM
 * children only.
 * @type {?|undefined}
 */
ComponentDef.prototype.viewProviders;
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
// unsupported: template constraints.
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
 * @template T, S
 */
export function PipeDef() { }
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
/** @typedef {?} */
var PipeDefInternal;
export { PipeDefInternal };
/** @typedef {?} */
var DirectiveDefFeature;
export { DirectiveDefFeature };
/** @typedef {?} */
var ComponentDefFeature;
export { ComponentDefFeature };
/** @typedef {?} */
var DirectiveDefListOrFactory;
export { DirectiveDefListOrFactory };
/** @typedef {?} */
var DirectiveDefList;
export { DirectiveDefList };
/** @typedef {?} */
var DirectiveTypesOrFactory;
export { DirectiveTypesOrFactory };
/** @typedef {?} */
var DirectiveTypeList;
export { DirectiveTypeList };
/** @typedef {?} */
var PipeDefListOrFactory;
export { PipeDefListOrFactory };
/** @typedef {?} */
var PipeDefList;
export { PipeDefList };
/** @typedef {?} */
var PipeTypesOrFactory;
export { PipeTypesOrFactory };
/** @typedef {?} */
var PipeTypeList;
export { PipeTypeList };
/** @type {?} */
export const unusedValueExportToPlacateAjd = 1;
/** @enum {number} */
const InitialStylingFlags = {
    VALUES_MODE: 1,
};
export { InitialStylingFlags };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmaW5pdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9kZWZpbml0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBbUNFLFNBQWE7O0lBR2IsU0FBYTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlc0IsZUFBbUI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZ1R4RCxhQUFhLDZCQUE2QixHQUFHLENBQUMsQ0FBQzs7O0lBRzdDLGNBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1Byb3ZpZGVyLCBWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnLi4vLi4vY29yZSc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL3R5cGUnO1xuaW1wb3J0IHtDc3NTZWxlY3Rvckxpc3R9IGZyb20gJy4vcHJvamVjdGlvbic7XG5cblxuLyoqXG4gKiBEZWZpbml0aW9uIG9mIHdoYXQgYSB0ZW1wbGF0ZSByZW5kZXJpbmcgZnVuY3Rpb24gc2hvdWxkIGxvb2sgbGlrZSBmb3IgYSBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCB0eXBlIENvbXBvbmVudFRlbXBsYXRlPFQ+ID0ge1xuICAocmY6IFJlbmRlckZsYWdzLCBjdHg6IFQpOiB2b2lkOyBuZ1ByaXZhdGVEYXRhPzogbmV2ZXI7XG59O1xuXG4vKipcbiAqIERlZmluaXRpb24gb2Ygd2hhdCBhIHF1ZXJ5IGZ1bmN0aW9uIHNob3VsZCBsb29rIGxpa2UuXG4gKi9cbmV4cG9ydCB0eXBlIENvbXBvbmVudFF1ZXJ5PFQ+ID0gQ29tcG9uZW50VGVtcGxhdGU8VD47XG5cbi8qKlxuICogRmxhZ3MgcGFzc2VkIGludG8gdGVtcGxhdGUgZnVuY3Rpb25zIHRvIGRldGVybWluZSB3aGljaCBibG9ja3MgKGkuZS4gY3JlYXRpb24sIHVwZGF0ZSlcbiAqIHNob3VsZCBiZSBleGVjdXRlZC5cbiAqXG4gKiBUeXBpY2FsbHksIGEgdGVtcGxhdGUgcnVucyBib3RoIHRoZSBjcmVhdGlvbiBibG9jayBhbmQgdGhlIHVwZGF0ZSBibG9jayBvbiBpbml0aWFsaXphdGlvbiBhbmRcbiAqIHN1YnNlcXVlbnQgcnVucyBvbmx5IGV4ZWN1dGUgdGhlIHVwZGF0ZSBibG9jay4gSG93ZXZlciwgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyByZXF1aXJlIHRoYXRcbiAqIHRoZSBjcmVhdGlvbiBibG9jayBiZSBleGVjdXRlZCBzZXBhcmF0ZWx5IGZyb20gdGhlIHVwZGF0ZSBibG9jayAoZm9yIGJhY2t3YXJkcyBjb21wYXQpLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBSZW5kZXJGbGFncyB7XG4gIC8qIFdoZXRoZXIgdG8gcnVuIHRoZSBjcmVhdGlvbiBibG9jayAoZS5nLiBjcmVhdGUgZWxlbWVudHMgYW5kIGRpcmVjdGl2ZXMpICovXG4gIENyZWF0ZSA9IDBiMDEsXG5cbiAgLyogV2hldGhlciB0byBydW4gdGhlIHVwZGF0ZSBibG9jayAoZS5nLiByZWZyZXNoIGJpbmRpbmdzKSAqL1xuICBVcGRhdGUgPSAwYjEwXG59XG5cbi8qKlxuICogQSBzdWJjbGFzcyBvZiBgVHlwZWAgd2hpY2ggaGFzIGEgc3RhdGljIGBuZ0NvbXBvbmVudERlZmA6YENvbXBvbmVudERlZmAgZmllbGQgbWFraW5nIGl0XG4gKiBjb25zdW1hYmxlIGZvciByZW5kZXJpbmcuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcG9uZW50VHlwZTxUPiBleHRlbmRzIFR5cGU8VD4geyBuZ0NvbXBvbmVudERlZjogbmV2ZXI7IH1cblxuLyoqXG4gKiBBIHN1YmNsYXNzIG9mIGBUeXBlYCB3aGljaCBoYXMgYSBzdGF0aWMgYG5nRGlyZWN0aXZlRGVmYDpgRGlyZWN0aXZlRGVmYCBmaWVsZCBtYWtpbmcgaXRcbiAqIGNvbnN1bWFibGUgZm9yIHJlbmRlcmluZy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEaXJlY3RpdmVUeXBlPFQ+IGV4dGVuZHMgVHlwZTxUPiB7IG5nRGlyZWN0aXZlRGVmOiBuZXZlcjsgfVxuXG5leHBvcnQgY29uc3QgZW51bSBEaXJlY3RpdmVEZWZGbGFncyB7Q29udGVudFF1ZXJ5ID0gMGIxMH1cblxuLyoqXG4gKiBBIHN1YmNsYXNzIG9mIGBUeXBlYCB3aGljaCBoYXMgYSBzdGF0aWMgYG5nUGlwZURlZmA6YFBpcGVEZWZgIGZpZWxkIG1ha2luZyBpdFxuICogY29uc3VtYWJsZSBmb3IgcmVuZGVyaW5nLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFBpcGVUeXBlPFQ+IGV4dGVuZHMgVHlwZTxUPiB7IG5nUGlwZURlZjogbmV2ZXI7IH1cblxuLyoqXG4gKiBBIHZlcnNpb24gb2Yge0BsaW5rIERpcmVjdGl2ZURlZn0gdGhhdCByZXByZXNlbnRzIHRoZSBydW50aW1lIHR5cGUgc2hhcGUgb25seSwgYW5kIGV4Y2x1ZGVzXG4gKiBtZXRhZGF0YSBwYXJhbWV0ZXJzLlxuICovXG5leHBvcnQgdHlwZSBEaXJlY3RpdmVEZWZJbnRlcm5hbDxUPiA9IERpcmVjdGl2ZURlZjxULCBzdHJpbmc+O1xuXG4vKipcbiAqIFJ1bnRpbWUgaW5mb3JtYXRpb24gZm9yIGNsYXNzZXMgdGhhdCBhcmUgaW5oZXJpdGVkIGJ5IGNvbXBvbmVudHMgb3IgZGlyZWN0aXZlc1xuICogdGhhdCBhcmVuJ3QgZGVmaW5lZCBhcyBjb21wb25lbnRzIG9yIGRpcmVjdGl2ZXMuXG4gKlxuICogVGhpcyBpcyBhbiBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZSB1c2VkIGJ5IHRoZSByZW5kZXIgdG8gZGV0ZXJtaW5lIHdoYXQgaW5wdXRzXG4gKiBhbmQgb3V0cHV0cyBzaG91bGQgYmUgaW5oZXJpdGVkLlxuICpcbiAqIFNlZToge0BsaW5rIGRlZmluZUJhc2V9XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQmFzZURlZjxUPiB7XG4gIC8qKlxuICAgKiBBIGRpY3Rpb25hcnkgbWFwcGluZyB0aGUgaW5wdXRzJyBtaW5pZmllZCBwcm9wZXJ0eSBuYW1lcyB0byB0aGVpciBwdWJsaWMgQVBJIG5hbWVzLCB3aGljaFxuICAgKiBhcmUgdGhlaXIgYWxpYXNlcyBpZiBhbnksIG9yIHRoZWlyIG9yaWdpbmFsIHVubWluaWZpZWQgcHJvcGVydHkgbmFtZXNcbiAgICogKGFzIGluIGBASW5wdXQoJ2FsaWFzJykgcHJvcGVydHlOYW1lOiBhbnk7YCkuXG4gICAqL1xuICByZWFkb25seSBpbnB1dHM6IHtbUCBpbiBrZXlvZiBUXTogc3RyaW5nfTtcblxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgVGhpcyBpcyBvbmx5IGhlcmUgYmVjYXVzZSBgTmdPbkNoYW5nZXNgIGluY29ycmVjdGx5IHVzZXMgZGVjbGFyZWQgbmFtZSBpbnN0ZWFkIG9mXG4gICAqIHB1YmxpYyBvciBtaW5pZmllZCBuYW1lLlxuICAgKi9cbiAgcmVhZG9ubHkgZGVjbGFyZWRJbnB1dHM6IHtbUCBpbiBrZXlvZiBUXTogUH07XG5cbiAgLyoqXG4gICAqIEEgZGljdGlvbmFyeSBtYXBwaW5nIHRoZSBvdXRwdXRzJyBtaW5pZmllZCBwcm9wZXJ0eSBuYW1lcyB0byB0aGVpciBwdWJsaWMgQVBJIG5hbWVzLCB3aGljaFxuICAgKiBhcmUgdGhlaXIgYWxpYXNlcyBpZiBhbnksIG9yIHRoZWlyIG9yaWdpbmFsIHVubWluaWZpZWQgcHJvcGVydHkgbmFtZXNcbiAgICogKGFzIGluIGBAT3V0cHV0KCdhbGlhcycpIHByb3BlcnR5TmFtZTogYW55O2ApLlxuICAgKi9cbiAgcmVhZG9ubHkgb3V0cHV0czoge1tQIGluIGtleW9mIFRdOiBQfTtcbn1cblxuLyoqXG4gKiBSdW50aW1lIGxpbmsgaW5mb3JtYXRpb24gZm9yIERpcmVjdGl2ZXMuXG4gKlxuICogVGhpcyBpcyBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZSB1c2VkIGJ5IHRoZSByZW5kZXIgdG8gbGlua1xuICogZGlyZWN0aXZlcyBpbnRvIHRlbXBsYXRlcy5cbiAqXG4gKiBOT1RFOiBBbHdheXMgdXNlIGBkZWZpbmVEaXJlY3RpdmVgIGZ1bmN0aW9uIHRvIGNyZWF0ZSB0aGlzIG9iamVjdCxcbiAqIG5ldmVyIGNyZWF0ZSB0aGUgb2JqZWN0IGRpcmVjdGx5IHNpbmNlIHRoZSBzaGFwZSBvZiB0aGlzIG9iamVjdFxuICogY2FuIGNoYW5nZSBiZXR3ZWVuIHZlcnNpb25zLlxuICpcbiAqIEBwYXJhbSBTZWxlY3RvciB0eXBlIG1ldGFkYXRhIHNwZWNpZnlpbmcgdGhlIHNlbGVjdG9yIG9mIHRoZSBkaXJlY3RpdmUgb3IgY29tcG9uZW50XG4gKlxuICogU2VlOiB7QGxpbmsgZGVmaW5lRGlyZWN0aXZlfVxuICovXG5leHBvcnQgaW50ZXJmYWNlIERpcmVjdGl2ZURlZjxULCBTZWxlY3RvciBleHRlbmRzIHN0cmluZz4gZXh0ZW5kcyBCYXNlRGVmPFQ+IHtcbiAgLyoqIFRva2VuIHJlcHJlc2VudGluZyB0aGUgZGlyZWN0aXZlLiBVc2VkIGJ5IERJLiAqL1xuICB0eXBlOiBUeXBlPFQ+O1xuXG4gIC8qKiBGdW5jdGlvbiB0aGF0IG1ha2VzIGEgZGlyZWN0aXZlIHB1YmxpYyB0byB0aGUgREkgc3lzdGVtLiAqL1xuICBkaVB1YmxpYzogKChkZWY6IERpcmVjdGl2ZURlZjxULCBzdHJpbmc+KSA9PiB2b2lkKXxudWxsO1xuXG4gIC8qKiBUaGUgc2VsZWN0b3JzIHRoYXQgd2lsbCBiZSB1c2VkIHRvIG1hdGNoIG5vZGVzIHRvIHRoaXMgZGlyZWN0aXZlLiAqL1xuICBzZWxlY3RvcnM6IENzc1NlbGVjdG9yTGlzdDtcblxuICAvKipcbiAgICogTmFtZSB1bmRlciB3aGljaCB0aGUgZGlyZWN0aXZlIGlzIGV4cG9ydGVkIChmb3IgdXNlIHdpdGggbG9jYWwgcmVmZXJlbmNlcyBpbiB0ZW1wbGF0ZSlcbiAgICovXG4gIHJlYWRvbmx5IGV4cG9ydEFzOiBzdHJpbmd8bnVsbDtcblxuICAvKipcbiAgICogRmFjdG9yeSBmdW5jdGlvbiB1c2VkIHRvIGNyZWF0ZSBhIG5ldyBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gICAqXG4gICAqIFVzdWFsbHkgcmV0dXJucyB0aGUgZGlyZWN0aXZlIGluc3RhbmNlLCBidXQgaWYgdGhlIGRpcmVjdGl2ZSBoYXMgYSBjb250ZW50IHF1ZXJ5LFxuICAgKiBpdCBpbnN0ZWFkIHJldHVybnMgYW4gYXJyYXkgdGhhdCBjb250YWlucyB0aGUgaW5zdGFuY2UgYXMgd2VsbCBhcyBjb250ZW50IHF1ZXJ5IGRhdGEuXG4gICAqL1xuICBmYWN0b3J5KCk6IFR8W1RdO1xuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0byBjcmVhdGUgaW5zdGFuY2VzIG9mIGNvbnRlbnQgcXVlcmllcyBhc3NvY2lhdGVkIHdpdGggYSBnaXZlbiBkaXJlY3RpdmUuXG4gICAqL1xuICBjb250ZW50UXVlcmllczogKCgpID0+IHZvaWQpfG51bGw7XG5cbiAgLyoqIFJlZnJlc2hlcyBjb250ZW50IHF1ZXJpZXMgYXNzb2NpYXRlZCB3aXRoIGRpcmVjdGl2ZXMgaW4gYSBnaXZlbiB2aWV3ICovXG4gIGNvbnRlbnRRdWVyaWVzUmVmcmVzaDogKChkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBxdWVyeUluZGV4OiBudW1iZXIpID0+IHZvaWQpfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBudW1iZXIgb2YgaG9zdCBiaW5kaW5ncyAoaW5jbHVkaW5nIHB1cmUgZm4gYmluZGluZ3MpIGluIHRoaXMgZGlyZWN0aXZlL2NvbXBvbmVudC5cbiAgICpcbiAgICogVXNlZCB0byBjYWxjdWxhdGUgdGhlIGxlbmd0aCBvZiB0aGUgTFZpZXdEYXRhIGFycmF5IGZvciB0aGUgKnBhcmVudCogY29tcG9uZW50XG4gICAqIG9mIHRoaXMgZGlyZWN0aXZlL2NvbXBvbmVudC5cbiAgICovXG4gIGhvc3RWYXJzOiBudW1iZXI7XG5cbiAgLyoqIFJlZnJlc2hlcyBob3N0IGJpbmRpbmdzIG9uIHRoZSBhc3NvY2lhdGVkIGRpcmVjdGl2ZS4gKi9cbiAgaG9zdEJpbmRpbmdzOiAoKGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGVsZW1lbnRJbmRleDogbnVtYmVyKSA9PiB2b2lkKXxudWxsO1xuXG4gIC8qKlxuICAgKiBTdGF0aWMgYXR0cmlidXRlcyB0byBzZXQgb24gaG9zdCBlbGVtZW50LlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IGF0dHJpYnV0ZSBuYW1lXG4gICAqIE9kZCBpbmRpY2VzOiBhdHRyaWJ1dGUgdmFsdWVcbiAgICovXG4gIGF0dHJpYnV0ZXM6IHN0cmluZ1tdfG51bGw7XG5cbiAgLyogVGhlIGZvbGxvd2luZyBhcmUgbGlmZWN5Y2xlIGhvb2tzIGZvciB0aGlzIGNvbXBvbmVudCAqL1xuICBvbkluaXQ6ICgoKSA9PiB2b2lkKXxudWxsO1xuICBkb0NoZWNrOiAoKCkgPT4gdm9pZCl8bnVsbDtcbiAgYWZ0ZXJDb250ZW50SW5pdDogKCgpID0+IHZvaWQpfG51bGw7XG4gIGFmdGVyQ29udGVudENoZWNrZWQ6ICgoKSA9PiB2b2lkKXxudWxsO1xuICBhZnRlclZpZXdJbml0OiAoKCkgPT4gdm9pZCl8bnVsbDtcbiAgYWZ0ZXJWaWV3Q2hlY2tlZDogKCgpID0+IHZvaWQpfG51bGw7XG4gIG9uRGVzdHJveTogKCgpID0+IHZvaWQpfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBmZWF0dXJlcyBhcHBsaWVkIHRvIHRoaXMgZGlyZWN0aXZlXG4gICAqL1xuICBmZWF0dXJlczogRGlyZWN0aXZlRGVmRmVhdHVyZVtdfG51bGw7XG59XG5cbi8qKlxuICogQSB2ZXJzaW9uIG9mIHtAbGluayBDb21wb25lbnREZWZ9IHRoYXQgcmVwcmVzZW50cyB0aGUgcnVudGltZSB0eXBlIHNoYXBlIG9ubHksIGFuZCBleGNsdWRlc1xuICogbWV0YWRhdGEgcGFyYW1ldGVycy5cbiAqL1xuZXhwb3J0IHR5cGUgQ29tcG9uZW50RGVmSW50ZXJuYWw8VD4gPSBDb21wb25lbnREZWY8VCwgc3RyaW5nPjtcblxuLyoqXG4gKiBSdW50aW1lIGxpbmsgaW5mb3JtYXRpb24gZm9yIENvbXBvbmVudHMuXG4gKlxuICogVGhpcyBpcyBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZSB1c2VkIGJ5IHRoZSByZW5kZXIgdG8gbGlua1xuICogY29tcG9uZW50cyBpbnRvIHRlbXBsYXRlcy5cbiAqXG4gKiBOT1RFOiBBbHdheXMgdXNlIGBkZWZpbmVDb21wb25lbnRgIGZ1bmN0aW9uIHRvIGNyZWF0ZSB0aGlzIG9iamVjdCxcbiAqIG5ldmVyIGNyZWF0ZSB0aGUgb2JqZWN0IGRpcmVjdGx5IHNpbmNlIHRoZSBzaGFwZSBvZiB0aGlzIG9iamVjdFxuICogY2FuIGNoYW5nZSBiZXR3ZWVuIHZlcnNpb25zLlxuICpcbiAqIFNlZToge0BsaW5rIGRlZmluZUNvbXBvbmVudH1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnREZWY8VCwgU2VsZWN0b3IgZXh0ZW5kcyBzdHJpbmc+IGV4dGVuZHMgRGlyZWN0aXZlRGVmPFQsIFNlbGVjdG9yPiB7XG4gIC8qKlxuICAgKiBSdW50aW1lIHVuaXF1ZSBjb21wb25lbnQgSUQuXG4gICAqL1xuICBpZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgVmlldyB0ZW1wbGF0ZSBvZiB0aGUgY29tcG9uZW50LlxuICAgKi9cbiAgcmVhZG9ubHkgdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPFQ+O1xuXG4gIC8qKlxuICAgKiBBIHNldCBvZiBzdHlsZXMgdGhhdCB0aGUgY29tcG9uZW50IG5lZWRzIHRvIGJlIHByZXNlbnQgZm9yIGNvbXBvbmVudCB0byByZW5kZXIgY29ycmVjdGx5LlxuICAgKi9cbiAgcmVhZG9ubHkgc3R5bGVzOiBzdHJpbmdbXTtcblxuICAvKipcbiAgICogVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGluIHRoaXMgY29tcG9uZW50IHRlbXBsYXRlLlxuICAgKlxuICAgKiBVc2VkIHRvIGNhbGN1bGF0ZSB0aGUgbGVuZ3RoIG9mIHRoZSBjb21wb25lbnQncyBMVmlld0RhdGEgYXJyYXksIHNvIHdlXG4gICAqIGNhbiBwcmUtZmlsbCB0aGUgYXJyYXkgYW5kIHNldCB0aGUgYmluZGluZyBzdGFydCBpbmRleC5cbiAgICovXG4gIC8vIFRPRE8oa2FyYSk6IHJlbW92ZSBxdWVyaWVzIGZyb20gdGhpcyBjb3VudFxuICBjb25zdHM6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIG51bWJlciBvZiBiaW5kaW5ncyBpbiB0aGlzIGNvbXBvbmVudCB0ZW1wbGF0ZSAoaW5jbHVkaW5nIHB1cmUgZm4gYmluZGluZ3MpLlxuICAgKlxuICAgKiBVc2VkIHRvIGNhbGN1bGF0ZSB0aGUgbGVuZ3RoIG9mIHRoZSBjb21wb25lbnQncyBMVmlld0RhdGEgYXJyYXksIHNvIHdlXG4gICAqIGNhbiBwcmUtZmlsbCB0aGUgYXJyYXkgYW5kIHNldCB0aGUgaG9zdCBiaW5kaW5nIHN0YXJ0IGluZGV4LlxuICAgKi9cbiAgdmFyczogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBRdWVyeS1yZWxhdGVkIGluc3RydWN0aW9ucyBmb3IgYSBjb21wb25lbnQuXG4gICAqL1xuICB2aWV3UXVlcnk6IENvbXBvbmVudFF1ZXJ5PFQ+fG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSB2aWV3IGVuY2Fwc3VsYXRpb24gdHlwZSwgd2hpY2ggZGV0ZXJtaW5lcyBob3cgc3R5bGVzIGFyZSBhcHBsaWVkIHRvXG4gICAqIERPTSBlbGVtZW50cy4gT25lIG9mXG4gICAqIC0gYEVtdWxhdGVkYCAoZGVmYXVsdCk6IEVtdWxhdGUgbmF0aXZlIHNjb3Bpbmcgb2Ygc3R5bGVzLlxuICAgKiAtIGBOYXRpdmVgOiBVc2UgdGhlIG5hdGl2ZSBlbmNhcHN1bGF0aW9uIG1lY2hhbmlzbSBvZiB0aGUgcmVuZGVyZXIuXG4gICAqIC0gYFNoYWRvd0RvbWA6IFVzZSBtb2Rlcm4gW1NoYWRvd0RPTV0oaHR0cHM6Ly93M2MuZ2l0aHViLmlvL3dlYmNvbXBvbmVudHMvc3BlYy9zaGFkb3cvKSBhbmRcbiAgICogICBjcmVhdGUgYSBTaGFkb3dSb290IGZvciBjb21wb25lbnQncyBob3N0IGVsZW1lbnQuXG4gICAqIC0gYE5vbmVgOiBEbyBub3QgcHJvdmlkZSBhbnkgdGVtcGxhdGUgb3Igc3R5bGUgZW5jYXBzdWxhdGlvbi5cbiAgICovXG4gIHJlYWRvbmx5IGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uO1xuXG4gIC8qKlxuICAgKiBEZWZpbmVzIGFyYml0cmFyeSBkZXZlbG9wZXItZGVmaW5lZCBkYXRhIHRvIGJlIHN0b3JlZCBvbiBhIHJlbmRlcmVyIGluc3RhbmNlLlxuICAgKiBUaGlzIGlzIHVzZWZ1bCBmb3IgcmVuZGVyZXJzIHRoYXQgZGVsZWdhdGUgdG8gb3RoZXIgcmVuZGVyZXJzLlxuICAgKi9cbiAgcmVhZG9ubHkgZGF0YToge1traW5kOiBzdHJpbmddOiBhbnl9O1xuXG4gIC8qKiBXaGV0aGVyIG9yIG5vdCB0aGlzIGNvbXBvbmVudCdzIENoYW5nZURldGVjdGlvblN0cmF0ZWd5IGlzIE9uUHVzaCAqL1xuICByZWFkb25seSBvblB1c2g6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIERlZmluZXMgdGhlIHNldCBvZiBpbmplY3RhYmxlIHByb3ZpZGVycyB0aGF0IGFyZSB2aXNpYmxlIHRvIGEgRGlyZWN0aXZlIGFuZCBpdHMgY29udGVudCBET01cbiAgICogY2hpbGRyZW4uXG4gICAqL1xuICByZWFkb25seSBwcm92aWRlcnM/OiBQcm92aWRlcltdO1xuXG4gIC8qKlxuICAgKiBEZWZpbmVzIHRoZSBzZXQgb2YgaW5qZWN0YWJsZSBwcm92aWRlcnMgdGhhdCBhcmUgdmlzaWJsZSB0byBhIERpcmVjdGl2ZSBhbmQgaXRzIHZpZXcgRE9NXG4gICAqIGNoaWxkcmVuIG9ubHkuXG4gICAqL1xuICByZWFkb25seSB2aWV3UHJvdmlkZXJzPzogUHJvdmlkZXJbXTtcblxuICAvKipcbiAgICogUmVnaXN0cnkgb2YgZGlyZWN0aXZlcyBhbmQgY29tcG9uZW50cyB0aGF0IG1heSBiZSBmb3VuZCBpbiB0aGlzIHZpZXcuXG4gICAqXG4gICAqIFRoZSBwcm9wZXJ0eSBpcyBlaXRoZXIgYW4gYXJyYXkgb2YgYERpcmVjdGl2ZURlZmBzIG9yIGEgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0aGUgYXJyYXkgb2ZcbiAgICogYERpcmVjdGl2ZURlZmBzLiBUaGUgZnVuY3Rpb24gaXMgbmVjZXNzYXJ5IHRvIGJlIGFibGUgdG8gc3VwcG9ydCBmb3J3YXJkIGRlY2xhcmF0aW9ucy5cbiAgICovXG4gIGRpcmVjdGl2ZURlZnM6IERpcmVjdGl2ZURlZkxpc3RPckZhY3Rvcnl8bnVsbDtcblxuICAvKipcbiAgICogUmVnaXN0cnkgb2YgcGlwZXMgdGhhdCBtYXkgYmUgZm91bmQgaW4gdGhpcyB2aWV3LlxuICAgKlxuICAgKiBUaGUgcHJvcGVydHkgaXMgZWl0aGVyIGFuIGFycmF5IG9mIGBQaXBlRGVmc2BzIG9yIGEgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0aGUgYXJyYXkgb2ZcbiAgICogYFBpcGVEZWZzYHMuIFRoZSBmdW5jdGlvbiBpcyBuZWNlc3NhcnkgdG8gYmUgYWJsZSB0byBzdXBwb3J0IGZvcndhcmQgZGVjbGFyYXRpb25zLlxuICAgKi9cbiAgcGlwZURlZnM6IFBpcGVEZWZMaXN0T3JGYWN0b3J5fG51bGw7XG59XG5cbi8qKlxuICogUnVudGltZSBsaW5rIGluZm9ybWF0aW9uIGZvciBQaXBlcy5cbiAqXG4gKiBUaGlzIGlzIGludGVybmFsIGRhdGEgc3RydWN0dXJlIHVzZWQgYnkgdGhlIHJlbmRlcmVyIHRvIGxpbmtcbiAqIHBpcGVzIGludG8gdGVtcGxhdGVzLlxuICpcbiAqIE5PVEU6IEFsd2F5cyB1c2UgYGRlZmluZVBpcGVgIGZ1bmN0aW9uIHRvIGNyZWF0ZSB0aGlzIG9iamVjdCxcbiAqIG5ldmVyIGNyZWF0ZSB0aGUgb2JqZWN0IGRpcmVjdGx5IHNpbmNlIHRoZSBzaGFwZSBvZiB0aGlzIG9iamVjdFxuICogY2FuIGNoYW5nZSBiZXR3ZWVuIHZlcnNpb25zLlxuICpcbiAqIFNlZToge0BsaW5rIGRlZmluZVBpcGV9XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUGlwZURlZjxULCBTIGV4dGVuZHMgc3RyaW5nPiB7XG4gIC8qKlxuICAgKiBQaXBlIG5hbWUuXG4gICAqXG4gICAqIFVzZWQgdG8gcmVzb2x2ZSBwaXBlIGluIHRlbXBsYXRlcy5cbiAgICovXG4gIG5hbWU6IFM7XG5cbiAgLyoqXG4gICAqIEZhY3RvcnkgZnVuY3Rpb24gdXNlZCB0byBjcmVhdGUgYSBuZXcgcGlwZSBpbnN0YW5jZS5cbiAgICovXG4gIGZhY3Rvcnk6ICgpID0+IFQ7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZSBwaXBlIGlzIHB1cmUuXG4gICAqXG4gICAqIFB1cmUgcGlwZXMgcmVzdWx0IG9ubHkgZGVwZW5kcyBvbiB0aGUgcGlwZSBpbnB1dCBhbmQgbm90IG9uIGludGVybmFsXG4gICAqIHN0YXRlIG9mIHRoZSBwaXBlLlxuICAgKi9cbiAgcHVyZTogYm9vbGVhbjtcblxuICAvKiBUaGUgZm9sbG93aW5nIGFyZSBsaWZlY3ljbGUgaG9va3MgZm9yIHRoaXMgcGlwZSAqL1xuICBvbkRlc3Ryb3k6ICgoKSA9PiB2b2lkKXxudWxsO1xufVxuXG5leHBvcnQgdHlwZSBQaXBlRGVmSW50ZXJuYWw8VD4gPSBQaXBlRGVmPFQsIHN0cmluZz47XG5cbmV4cG9ydCB0eXBlIERpcmVjdGl2ZURlZkZlYXR1cmUgPSA8VD4oZGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWY8VCwgc3RyaW5nPikgPT4gdm9pZDtcbmV4cG9ydCB0eXBlIENvbXBvbmVudERlZkZlYXR1cmUgPSA8VD4oY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8VCwgc3RyaW5nPikgPT4gdm9pZDtcblxuLyoqXG4gKiBUeXBlIHVzZWQgZm9yIGRpcmVjdGl2ZURlZnMgb24gY29tcG9uZW50IGRlZmluaXRpb24uXG4gKlxuICogVGhlIGZ1bmN0aW9uIGlzIG5lY2Vzc2FyeSB0byBiZSBhYmxlIHRvIHN1cHBvcnQgZm9yd2FyZCBkZWNsYXJhdGlvbnMuXG4gKi9cbmV4cG9ydCB0eXBlIERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnkgPSAoKCkgPT4gRGlyZWN0aXZlRGVmTGlzdCkgfCBEaXJlY3RpdmVEZWZMaXN0O1xuXG5leHBvcnQgdHlwZSBEaXJlY3RpdmVEZWZMaXN0ID0gKERpcmVjdGl2ZURlZjxhbnksIHN0cmluZz58IENvbXBvbmVudERlZjxhbnksIHN0cmluZz4pW107XG5cbmV4cG9ydCB0eXBlIERpcmVjdGl2ZVR5cGVzT3JGYWN0b3J5ID0gKCgpID0+IERpcmVjdGl2ZVR5cGVMaXN0KSB8IERpcmVjdGl2ZVR5cGVMaXN0O1xuXG5leHBvcnQgdHlwZSBEaXJlY3RpdmVUeXBlTGlzdCA9XG4gICAgKERpcmVjdGl2ZURlZjxhbnksIHN0cmluZz58IENvbXBvbmVudERlZjxhbnksIHN0cmluZz58XG4gICAgIFR5cGU8YW55Pi8qIFR5cGUgYXMgd29ya2Fyb3VuZCBmb3I6IE1pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy80ODgxICovKVtdO1xuXG4vKipcbiAqIFR5cGUgdXNlZCBmb3IgUGlwZURlZnMgb24gY29tcG9uZW50IGRlZmluaXRpb24uXG4gKlxuICogVGhlIGZ1bmN0aW9uIGlzIG5lY2Vzc2FyeSB0byBiZSBhYmxlIHRvIHN1cHBvcnQgZm9yd2FyZCBkZWNsYXJhdGlvbnMuXG4gKi9cbmV4cG9ydCB0eXBlIFBpcGVEZWZMaXN0T3JGYWN0b3J5ID0gKCgpID0+IFBpcGVEZWZMaXN0KSB8IFBpcGVEZWZMaXN0O1xuXG5leHBvcnQgdHlwZSBQaXBlRGVmTGlzdCA9IFBpcGVEZWZJbnRlcm5hbDxhbnk+W107XG5cbmV4cG9ydCB0eXBlIFBpcGVUeXBlc09yRmFjdG9yeSA9ICgoKSA9PiBEaXJlY3RpdmVUeXBlTGlzdCkgfCBEaXJlY3RpdmVUeXBlTGlzdDtcblxuZXhwb3J0IHR5cGUgUGlwZVR5cGVMaXN0ID1cbiAgICAoUGlwZURlZkludGVybmFsPGFueT58XG4gICAgIFR5cGU8YW55Pi8qIFR5cGUgYXMgd29ya2Fyb3VuZCBmb3I6IE1pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy80ODgxICovKVtdO1xuXG5cbi8vIE5vdGU6IFRoaXMgaGFjayBpcyBuZWNlc3Nhcnkgc28gd2UgZG9uJ3QgZXJyb25lb3VzbHkgZ2V0IGEgY2lyY3VsYXIgZGVwZW5kZW5jeVxuLy8gZmFpbHVyZSBiYXNlZCBvbiB0eXBlcy5cbmV4cG9ydCBjb25zdCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCA9IDE7XG5cbmV4cG9ydCBjb25zdCBlbnVtIEluaXRpYWxTdHlsaW5nRmxhZ3Mge1xuICBWQUxVRVNfTU9ERSA9IDBiMSxcbn1cbiJdfQ==