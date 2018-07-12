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
 * A dictionary mapping the inputs' minified property names to their public API names, which
 * are their aliases if any, or their original unminified property names
 * (as in `\@Input('alias') propertyName: any;`).
 * @type {?}
 */
DirectiveDef.prototype.inputs;
/**
 * @deprecated This is only here because `NgOnChanges` incorrectly uses declared name instead of
 * public or minified name.
 * @type {?}
 */
DirectiveDef.prototype.declaredInputs;
/**
 * A dictionary mapping the outputs' minified property names to their public API names, which
 * are their aliases if any, or their original unminified property names
 * (as in `\@Output('alias') propertyName: any;`).
 * @type {?}
 */
DirectiveDef.prototype.outputs;
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
 * The View template of the component.
 * @type {?}
 */
ComponentDef.prototype.template;
/**
 * Query-related instructions for a component.
 * @type {?}
 */
ComponentDef.prototype.viewQuery;
/**
 * Renderer type data of the component.
 * @type {?}
 */
ComponentDef.prototype.rendererType;
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
    /** Mode for matching initial style values */
    INITIAL_STYLES: 0,
};
export { InitialStylingFlags };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmaW5pdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9kZWZpbml0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBbUNFLFNBQWE7O0lBR2IsU0FBYTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlc0IsZUFBbUI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFzUHhELGFBQWEsNkJBQTZCLEdBQUcsQ0FBQyxDQUFDOzs7O0lBSzdDLGlCQUFxQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtQcm92aWRlcn0gZnJvbSAnLi4vLi4vY29yZSc7XG5pbXBvcnQge1JlbmRlcmVyVHlwZTJ9IGZyb20gJy4uLy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi90eXBlJztcbmltcG9ydCB7Q3NzU2VsZWN0b3JMaXN0fSBmcm9tICcuL3Byb2plY3Rpb24nO1xuXG4vKipcbiAqIERlZmluaXRpb24gb2Ygd2hhdCBhIHRlbXBsYXRlIHJlbmRlcmluZyBmdW5jdGlvbiBzaG91bGQgbG9vayBsaWtlLlxuICovXG5leHBvcnQgdHlwZSBDb21wb25lbnRUZW1wbGF0ZTxUPiA9IHtcbiAgKHJmOiBSZW5kZXJGbGFncywgY3R4OiBUKTogdm9pZDsgbmdQcml2YXRlRGF0YT86IG5ldmVyO1xufTtcblxuLyoqXG4gKiBEZWZpbml0aW9uIG9mIHdoYXQgYSBxdWVyeSBmdW5jdGlvbiBzaG91bGQgbG9vayBsaWtlLlxuICovXG5leHBvcnQgdHlwZSBDb21wb25lbnRRdWVyeTxUPiA9IENvbXBvbmVudFRlbXBsYXRlPFQ+O1xuXG4vKipcbiAqIEZsYWdzIHBhc3NlZCBpbnRvIHRlbXBsYXRlIGZ1bmN0aW9ucyB0byBkZXRlcm1pbmUgd2hpY2ggYmxvY2tzIChpLmUuIGNyZWF0aW9uLCB1cGRhdGUpXG4gKiBzaG91bGQgYmUgZXhlY3V0ZWQuXG4gKlxuICogVHlwaWNhbGx5LCBhIHRlbXBsYXRlIHJ1bnMgYm90aCB0aGUgY3JlYXRpb24gYmxvY2sgYW5kIHRoZSB1cGRhdGUgYmxvY2sgb24gaW5pdGlhbGl6YXRpb24gYW5kXG4gKiBzdWJzZXF1ZW50IHJ1bnMgb25seSBleGVjdXRlIHRoZSB1cGRhdGUgYmxvY2suIEhvd2V2ZXIsIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MgcmVxdWlyZSB0aGF0XG4gKiB0aGUgY3JlYXRpb24gYmxvY2sgYmUgZXhlY3V0ZWQgc2VwYXJhdGVseSBmcm9tIHRoZSB1cGRhdGUgYmxvY2sgKGZvciBiYWNrd2FyZHMgY29tcGF0KS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gUmVuZGVyRmxhZ3Mge1xuICAvKiBXaGV0aGVyIHRvIHJ1biB0aGUgY3JlYXRpb24gYmxvY2sgKGUuZy4gY3JlYXRlIGVsZW1lbnRzIGFuZCBkaXJlY3RpdmVzKSAqL1xuICBDcmVhdGUgPSAwYjAxLFxuXG4gIC8qIFdoZXRoZXIgdG8gcnVuIHRoZSB1cGRhdGUgYmxvY2sgKGUuZy4gcmVmcmVzaCBiaW5kaW5ncykgKi9cbiAgVXBkYXRlID0gMGIxMFxufVxuXG4vKipcbiAqIEEgc3ViY2xhc3Mgb2YgYFR5cGVgIHdoaWNoIGhhcyBhIHN0YXRpYyBgbmdDb21wb25lbnREZWZgOmBDb21wb25lbnREZWZgIGZpZWxkIG1ha2luZyBpdFxuICogY29uc3VtYWJsZSBmb3IgcmVuZGVyaW5nLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbXBvbmVudFR5cGU8VD4gZXh0ZW5kcyBUeXBlPFQ+IHsgbmdDb21wb25lbnREZWY6IG5ldmVyOyB9XG5cbi8qKlxuICogQSBzdWJjbGFzcyBvZiBgVHlwZWAgd2hpY2ggaGFzIGEgc3RhdGljIGBuZ0RpcmVjdGl2ZURlZmA6YERpcmVjdGl2ZURlZmAgZmllbGQgbWFraW5nIGl0XG4gKiBjb25zdW1hYmxlIGZvciByZW5kZXJpbmcuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGlyZWN0aXZlVHlwZTxUPiBleHRlbmRzIFR5cGU8VD4geyBuZ0RpcmVjdGl2ZURlZjogbmV2ZXI7IH1cblxuZXhwb3J0IGNvbnN0IGVudW0gRGlyZWN0aXZlRGVmRmxhZ3Mge0NvbnRlbnRRdWVyeSA9IDBiMTB9XG5cbi8qKlxuICogQSBzdWJjbGFzcyBvZiBgVHlwZWAgd2hpY2ggaGFzIGEgc3RhdGljIGBuZ1BpcGVEZWZgOmBQaXBlRGVmYCBmaWVsZCBtYWtpbmcgaXRcbiAqIGNvbnN1bWFibGUgZm9yIHJlbmRlcmluZy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQaXBlVHlwZTxUPiBleHRlbmRzIFR5cGU8VD4geyBuZ1BpcGVEZWY6IG5ldmVyOyB9XG5cbi8qKlxuICogQSB2ZXJzaW9uIG9mIHtAbGluayBEaXJlY3RpdmVEZWZ9IHRoYXQgcmVwcmVzZW50cyB0aGUgcnVudGltZSB0eXBlIHNoYXBlIG9ubHksIGFuZCBleGNsdWRlc1xuICogbWV0YWRhdGEgcGFyYW1ldGVycy5cbiAqL1xuZXhwb3J0IHR5cGUgRGlyZWN0aXZlRGVmSW50ZXJuYWw8VD4gPSBEaXJlY3RpdmVEZWY8VCwgc3RyaW5nPjtcblxuLyoqXG4gKiBSdW50aW1lIGxpbmsgaW5mb3JtYXRpb24gZm9yIERpcmVjdGl2ZXMuXG4gKlxuICogVGhpcyBpcyBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZSB1c2VkIGJ5IHRoZSByZW5kZXIgdG8gbGlua1xuICogZGlyZWN0aXZlcyBpbnRvIHRlbXBsYXRlcy5cbiAqXG4gKiBOT1RFOiBBbHdheXMgdXNlIGBkZWZpbmVEaXJlY3RpdmVgIGZ1bmN0aW9uIHRvIGNyZWF0ZSB0aGlzIG9iamVjdCxcbiAqIG5ldmVyIGNyZWF0ZSB0aGUgb2JqZWN0IGRpcmVjdGx5IHNpbmNlIHRoZSBzaGFwZSBvZiB0aGlzIG9iamVjdFxuICogY2FuIGNoYW5nZSBiZXR3ZWVuIHZlcnNpb25zLlxuICpcbiAqIEBwYXJhbSBTZWxlY3RvciB0eXBlIG1ldGFkYXRhIHNwZWNpZnlpbmcgdGhlIHNlbGVjdG9yIG9mIHRoZSBkaXJlY3RpdmUgb3IgY29tcG9uZW50XG4gKlxuICogU2VlOiB7QGxpbmsgZGVmaW5lRGlyZWN0aXZlfVxuICovXG5leHBvcnQgaW50ZXJmYWNlIERpcmVjdGl2ZURlZjxULCBTZWxlY3RvciBleHRlbmRzIHN0cmluZz4ge1xuICAvKiogVG9rZW4gcmVwcmVzZW50aW5nIHRoZSBkaXJlY3RpdmUuIFVzZWQgYnkgREkuICovXG4gIHR5cGU6IFR5cGU8VD47XG5cbiAgLyoqIEZ1bmN0aW9uIHRoYXQgbWFrZXMgYSBkaXJlY3RpdmUgcHVibGljIHRvIHRoZSBESSBzeXN0ZW0uICovXG4gIGRpUHVibGljOiAoKGRlZjogRGlyZWN0aXZlRGVmPFQsIHN0cmluZz4pID0+IHZvaWQpfG51bGw7XG5cbiAgLyoqIFRoZSBzZWxlY3RvcnMgdGhhdCB3aWxsIGJlIHVzZWQgdG8gbWF0Y2ggbm9kZXMgdG8gdGhpcyBkaXJlY3RpdmUuICovXG4gIHNlbGVjdG9yczogQ3NzU2VsZWN0b3JMaXN0O1xuXG4gIC8qKlxuICAgKiBBIGRpY3Rpb25hcnkgbWFwcGluZyB0aGUgaW5wdXRzJyBtaW5pZmllZCBwcm9wZXJ0eSBuYW1lcyB0byB0aGVpciBwdWJsaWMgQVBJIG5hbWVzLCB3aGljaFxuICAgKiBhcmUgdGhlaXIgYWxpYXNlcyBpZiBhbnksIG9yIHRoZWlyIG9yaWdpbmFsIHVubWluaWZpZWQgcHJvcGVydHkgbmFtZXNcbiAgICogKGFzIGluIGBASW5wdXQoJ2FsaWFzJykgcHJvcGVydHlOYW1lOiBhbnk7YCkuXG4gICAqL1xuICByZWFkb25seSBpbnB1dHM6IHtbUCBpbiBrZXlvZiBUXTogc3RyaW5nfTtcblxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgVGhpcyBpcyBvbmx5IGhlcmUgYmVjYXVzZSBgTmdPbkNoYW5nZXNgIGluY29ycmVjdGx5IHVzZXMgZGVjbGFyZWQgbmFtZSBpbnN0ZWFkIG9mXG4gICAqIHB1YmxpYyBvciBtaW5pZmllZCBuYW1lLlxuICAgKi9cbiAgcmVhZG9ubHkgZGVjbGFyZWRJbnB1dHM6IHtbUCBpbiBrZXlvZiBUXTogUH07XG5cbiAgLyoqXG4gICAqIEEgZGljdGlvbmFyeSBtYXBwaW5nIHRoZSBvdXRwdXRzJyBtaW5pZmllZCBwcm9wZXJ0eSBuYW1lcyB0byB0aGVpciBwdWJsaWMgQVBJIG5hbWVzLCB3aGljaFxuICAgKiBhcmUgdGhlaXIgYWxpYXNlcyBpZiBhbnksIG9yIHRoZWlyIG9yaWdpbmFsIHVubWluaWZpZWQgcHJvcGVydHkgbmFtZXNcbiAgICogKGFzIGluIGBAT3V0cHV0KCdhbGlhcycpIHByb3BlcnR5TmFtZTogYW55O2ApLlxuICAgKi9cbiAgcmVhZG9ubHkgb3V0cHV0czoge1tQIGluIGtleW9mIFRdOiBQfTtcblxuICAvKipcbiAgICogTmFtZSB1bmRlciB3aGljaCB0aGUgZGlyZWN0aXZlIGlzIGV4cG9ydGVkIChmb3IgdXNlIHdpdGggbG9jYWwgcmVmZXJlbmNlcyBpbiB0ZW1wbGF0ZSlcbiAgICovXG4gIHJlYWRvbmx5IGV4cG9ydEFzOiBzdHJpbmd8bnVsbDtcblxuICAvKipcbiAgICogRmFjdG9yeSBmdW5jdGlvbiB1c2VkIHRvIGNyZWF0ZSBhIG5ldyBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gICAqXG4gICAqIFVzdWFsbHkgcmV0dXJucyB0aGUgZGlyZWN0aXZlIGluc3RhbmNlLCBidXQgaWYgdGhlIGRpcmVjdGl2ZSBoYXMgYSBjb250ZW50IHF1ZXJ5LFxuICAgKiBpdCBpbnN0ZWFkIHJldHVybnMgYW4gYXJyYXkgdGhhdCBjb250YWlucyB0aGUgaW5zdGFuY2UgYXMgd2VsbCBhcyBjb250ZW50IHF1ZXJ5IGRhdGEuXG4gICAqL1xuICBmYWN0b3J5KCk6IFR8W1RdO1xuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0byBjcmVhdGUgaW5zdGFuY2VzIG9mIGNvbnRlbnQgcXVlcmllcyBhc3NvY2lhdGVkIHdpdGggYSBnaXZlbiBkaXJlY3RpdmUuXG4gICAqL1xuICBjb250ZW50UXVlcmllczogKCgpID0+IHZvaWQpfG51bGw7XG5cbiAgLyoqIFJlZnJlc2hlcyBjb250ZW50IHF1ZXJpZXMgYXNzb2NpYXRlZCB3aXRoIGRpcmVjdGl2ZXMgaW4gYSBnaXZlbiB2aWV3ICovXG4gIGNvbnRlbnRRdWVyaWVzUmVmcmVzaDogKChkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBxdWVyeUluZGV4OiBudW1iZXIpID0+IHZvaWQpfG51bGw7XG5cbiAgLyoqIFJlZnJlc2hlcyBob3N0IGJpbmRpbmdzIG9uIHRoZSBhc3NvY2lhdGVkIGRpcmVjdGl2ZS4gKi9cbiAgaG9zdEJpbmRpbmdzOiAoKGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGVsZW1lbnRJbmRleDogbnVtYmVyKSA9PiB2b2lkKXxudWxsO1xuXG4gIC8qKlxuICAgKiBTdGF0aWMgYXR0cmlidXRlcyB0byBzZXQgb24gaG9zdCBlbGVtZW50LlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IGF0dHJpYnV0ZSBuYW1lXG4gICAqIE9kZCBpbmRpY2VzOiBhdHRyaWJ1dGUgdmFsdWVcbiAgICovXG4gIGF0dHJpYnV0ZXM6IHN0cmluZ1tdfG51bGw7XG5cbiAgLyogVGhlIGZvbGxvd2luZyBhcmUgbGlmZWN5Y2xlIGhvb2tzIGZvciB0aGlzIGNvbXBvbmVudCAqL1xuICBvbkluaXQ6ICgoKSA9PiB2b2lkKXxudWxsO1xuICBkb0NoZWNrOiAoKCkgPT4gdm9pZCl8bnVsbDtcbiAgYWZ0ZXJDb250ZW50SW5pdDogKCgpID0+IHZvaWQpfG51bGw7XG4gIGFmdGVyQ29udGVudENoZWNrZWQ6ICgoKSA9PiB2b2lkKXxudWxsO1xuICBhZnRlclZpZXdJbml0OiAoKCkgPT4gdm9pZCl8bnVsbDtcbiAgYWZ0ZXJWaWV3Q2hlY2tlZDogKCgpID0+IHZvaWQpfG51bGw7XG4gIG9uRGVzdHJveTogKCgpID0+IHZvaWQpfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBmZWF0dXJlcyBhcHBsaWVkIHRvIHRoaXMgZGlyZWN0aXZlXG4gICAqL1xuICBmZWF0dXJlczogRGlyZWN0aXZlRGVmRmVhdHVyZVtdfG51bGw7XG59XG5cbi8qKlxuICogQSB2ZXJzaW9uIG9mIHtAbGluayBDb21wb25lbnREZWZ9IHRoYXQgcmVwcmVzZW50cyB0aGUgcnVudGltZSB0eXBlIHNoYXBlIG9ubHksIGFuZCBleGNsdWRlc1xuICogbWV0YWRhdGEgcGFyYW1ldGVycy5cbiAqL1xuZXhwb3J0IHR5cGUgQ29tcG9uZW50RGVmSW50ZXJuYWw8VD4gPSBDb21wb25lbnREZWY8VCwgc3RyaW5nPjtcblxuLyoqXG4gKiBSdW50aW1lIGxpbmsgaW5mb3JtYXRpb24gZm9yIENvbXBvbmVudHMuXG4gKlxuICogVGhpcyBpcyBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZSB1c2VkIGJ5IHRoZSByZW5kZXIgdG8gbGlua1xuICogY29tcG9uZW50cyBpbnRvIHRlbXBsYXRlcy5cbiAqXG4gKiBOT1RFOiBBbHdheXMgdXNlIGBkZWZpbmVDb21wb25lbnRgIGZ1bmN0aW9uIHRvIGNyZWF0ZSB0aGlzIG9iamVjdCxcbiAqIG5ldmVyIGNyZWF0ZSB0aGUgb2JqZWN0IGRpcmVjdGx5IHNpbmNlIHRoZSBzaGFwZSBvZiB0aGlzIG9iamVjdFxuICogY2FuIGNoYW5nZSBiZXR3ZWVuIHZlcnNpb25zLlxuICpcbiAqIFNlZToge0BsaW5rIGRlZmluZUNvbXBvbmVudH1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnREZWY8VCwgU2VsZWN0b3IgZXh0ZW5kcyBzdHJpbmc+IGV4dGVuZHMgRGlyZWN0aXZlRGVmPFQsIFNlbGVjdG9yPiB7XG4gIC8qKlxuICAgKiBUaGUgVmlldyB0ZW1wbGF0ZSBvZiB0aGUgY29tcG9uZW50LlxuICAgKi9cbiAgcmVhZG9ubHkgdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPFQ+O1xuXG4gIC8qKlxuICAgKiBRdWVyeS1yZWxhdGVkIGluc3RydWN0aW9ucyBmb3IgYSBjb21wb25lbnQuXG4gICAqL1xuICByZWFkb25seSB2aWV3UXVlcnk6IENvbXBvbmVudFF1ZXJ5PFQ+fG51bGw7XG5cbiAgLyoqXG4gICAqIFJlbmRlcmVyIHR5cGUgZGF0YSBvZiB0aGUgY29tcG9uZW50LlxuICAgKi9cbiAgcmVhZG9ubHkgcmVuZGVyZXJUeXBlOiBSZW5kZXJlclR5cGUyfG51bGw7XG5cbiAgLyoqIFdoZXRoZXIgb3Igbm90IHRoaXMgY29tcG9uZW50J3MgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kgaXMgT25QdXNoICovXG4gIHJlYWRvbmx5IG9uUHVzaDogYm9vbGVhbjtcblxuICAvKipcbiAgICogRGVmaW5lcyB0aGUgc2V0IG9mIGluamVjdGFibGUgcHJvdmlkZXJzIHRoYXQgYXJlIHZpc2libGUgdG8gYSBEaXJlY3RpdmUgYW5kIGl0cyBjb250ZW50IERPTVxuICAgKiBjaGlsZHJlbi5cbiAgICovXG4gIHJlYWRvbmx5IHByb3ZpZGVycz86IFByb3ZpZGVyW107XG5cbiAgLyoqXG4gICAqIERlZmluZXMgdGhlIHNldCBvZiBpbmplY3RhYmxlIHByb3ZpZGVycyB0aGF0IGFyZSB2aXNpYmxlIHRvIGEgRGlyZWN0aXZlIGFuZCBpdHMgdmlldyBET01cbiAgICogY2hpbGRyZW4gb25seS5cbiAgICovXG4gIHJlYWRvbmx5IHZpZXdQcm92aWRlcnM/OiBQcm92aWRlcltdO1xuXG4gIC8qKlxuICAgKiBSZWdpc3RyeSBvZiBkaXJlY3RpdmVzIGFuZCBjb21wb25lbnRzIHRoYXQgbWF5IGJlIGZvdW5kIGluIHRoaXMgdmlldy5cbiAgICpcbiAgICogVGhlIHByb3BlcnR5IGlzIGVpdGhlciBhbiBhcnJheSBvZiBgRGlyZWN0aXZlRGVmYHMgb3IgYSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIHRoZSBhcnJheSBvZlxuICAgKiBgRGlyZWN0aXZlRGVmYHMuIFRoZSBmdW5jdGlvbiBpcyBuZWNlc3NhcnkgdG8gYmUgYWJsZSB0byBzdXBwb3J0IGZvcndhcmQgZGVjbGFyYXRpb25zLlxuICAgKi9cbiAgZGlyZWN0aXZlRGVmczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeXxudWxsO1xuXG4gIC8qKlxuICAgKiBSZWdpc3RyeSBvZiBwaXBlcyB0aGF0IG1heSBiZSBmb3VuZCBpbiB0aGlzIHZpZXcuXG4gICAqXG4gICAqIFRoZSBwcm9wZXJ0eSBpcyBlaXRoZXIgYW4gYXJyYXkgb2YgYFBpcGVEZWZzYHMgb3IgYSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIHRoZSBhcnJheSBvZlxuICAgKiBgUGlwZURlZnNgcy4gVGhlIGZ1bmN0aW9uIGlzIG5lY2Vzc2FyeSB0byBiZSBhYmxlIHRvIHN1cHBvcnQgZm9yd2FyZCBkZWNsYXJhdGlvbnMuXG4gICAqL1xuICBwaXBlRGVmczogUGlwZURlZkxpc3RPckZhY3Rvcnl8bnVsbDtcbn1cblxuLyoqXG4gKiBSdW50aW1lIGxpbmsgaW5mb3JtYXRpb24gZm9yIFBpcGVzLlxuICpcbiAqIFRoaXMgaXMgaW50ZXJuYWwgZGF0YSBzdHJ1Y3R1cmUgdXNlZCBieSB0aGUgcmVuZGVyZXIgdG8gbGlua1xuICogcGlwZXMgaW50byB0ZW1wbGF0ZXMuXG4gKlxuICogTk9URTogQWx3YXlzIHVzZSBgZGVmaW5lUGlwZWAgZnVuY3Rpb24gdG8gY3JlYXRlIHRoaXMgb2JqZWN0LFxuICogbmV2ZXIgY3JlYXRlIHRoZSBvYmplY3QgZGlyZWN0bHkgc2luY2UgdGhlIHNoYXBlIG9mIHRoaXMgb2JqZWN0XG4gKiBjYW4gY2hhbmdlIGJldHdlZW4gdmVyc2lvbnMuXG4gKlxuICogU2VlOiB7QGxpbmsgZGVmaW5lUGlwZX1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQaXBlRGVmPFQsIFMgZXh0ZW5kcyBzdHJpbmc+IHtcbiAgLyoqXG4gICAqIFBpcGUgbmFtZS5cbiAgICpcbiAgICogVXNlZCB0byByZXNvbHZlIHBpcGUgaW4gdGVtcGxhdGVzLlxuICAgKi9cbiAgbmFtZTogUztcblxuICAvKipcbiAgICogRmFjdG9yeSBmdW5jdGlvbiB1c2VkIHRvIGNyZWF0ZSBhIG5ldyBwaXBlIGluc3RhbmNlLlxuICAgKi9cbiAgZmFjdG9yeTogKCkgPT4gVDtcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlIHBpcGUgaXMgcHVyZS5cbiAgICpcbiAgICogUHVyZSBwaXBlcyByZXN1bHQgb25seSBkZXBlbmRzIG9uIHRoZSBwaXBlIGlucHV0IGFuZCBub3Qgb24gaW50ZXJuYWxcbiAgICogc3RhdGUgb2YgdGhlIHBpcGUuXG4gICAqL1xuICBwdXJlOiBib29sZWFuO1xuXG4gIC8qIFRoZSBmb2xsb3dpbmcgYXJlIGxpZmVjeWNsZSBob29rcyBmb3IgdGhpcyBwaXBlICovXG4gIG9uRGVzdHJveTogKCgpID0+IHZvaWQpfG51bGw7XG59XG5cbmV4cG9ydCB0eXBlIFBpcGVEZWZJbnRlcm5hbDxUPiA9IFBpcGVEZWY8VCwgc3RyaW5nPjtcblxuZXhwb3J0IHR5cGUgRGlyZWN0aXZlRGVmRmVhdHVyZSA9IDxUPihkaXJlY3RpdmVEZWY6IERpcmVjdGl2ZURlZjxULCBzdHJpbmc+KSA9PiB2b2lkO1xuZXhwb3J0IHR5cGUgQ29tcG9uZW50RGVmRmVhdHVyZSA9IDxUPihjb21wb25lbnREZWY6IENvbXBvbmVudERlZjxULCBzdHJpbmc+KSA9PiB2b2lkO1xuXG4vKipcbiAqIFR5cGUgdXNlZCBmb3IgZGlyZWN0aXZlRGVmcyBvbiBjb21wb25lbnQgZGVmaW5pdGlvbi5cbiAqXG4gKiBUaGUgZnVuY3Rpb24gaXMgbmVjZXNzYXJ5IHRvIGJlIGFibGUgdG8gc3VwcG9ydCBmb3J3YXJkIGRlY2xhcmF0aW9ucy5cbiAqL1xuZXhwb3J0IHR5cGUgRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSA9ICgoKSA9PiBEaXJlY3RpdmVEZWZMaXN0KSB8IERpcmVjdGl2ZURlZkxpc3Q7XG5cbmV4cG9ydCB0eXBlIERpcmVjdGl2ZURlZkxpc3QgPSAoRGlyZWN0aXZlRGVmPGFueSwgc3RyaW5nPnwgQ29tcG9uZW50RGVmPGFueSwgc3RyaW5nPilbXTtcblxuZXhwb3J0IHR5cGUgRGlyZWN0aXZlVHlwZXNPckZhY3RvcnkgPSAoKCkgPT4gRGlyZWN0aXZlVHlwZUxpc3QpIHwgRGlyZWN0aXZlVHlwZUxpc3Q7XG5cbmV4cG9ydCB0eXBlIERpcmVjdGl2ZVR5cGVMaXN0ID1cbiAgICAoRGlyZWN0aXZlRGVmPGFueSwgc3RyaW5nPnwgQ29tcG9uZW50RGVmPGFueSwgc3RyaW5nPnxcbiAgICAgVHlwZTxhbnk+LyogVHlwZSBhcyB3b3JrYXJvdW5kIGZvcjogTWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzQ4ODEgKi8pW107XG5cbi8qKlxuICogVHlwZSB1c2VkIGZvciBQaXBlRGVmcyBvbiBjb21wb25lbnQgZGVmaW5pdGlvbi5cbiAqXG4gKiBUaGUgZnVuY3Rpb24gaXMgbmVjZXNzYXJ5IHRvIGJlIGFibGUgdG8gc3VwcG9ydCBmb3J3YXJkIGRlY2xhcmF0aW9ucy5cbiAqL1xuZXhwb3J0IHR5cGUgUGlwZURlZkxpc3RPckZhY3RvcnkgPSAoKCkgPT4gUGlwZURlZkxpc3QpIHwgUGlwZURlZkxpc3Q7XG5cbmV4cG9ydCB0eXBlIFBpcGVEZWZMaXN0ID0gUGlwZURlZkludGVybmFsPGFueT5bXTtcblxuZXhwb3J0IHR5cGUgUGlwZVR5cGVzT3JGYWN0b3J5ID0gKCgpID0+IERpcmVjdGl2ZVR5cGVMaXN0KSB8IERpcmVjdGl2ZVR5cGVMaXN0O1xuXG5leHBvcnQgdHlwZSBQaXBlVHlwZUxpc3QgPVxuICAgIChQaXBlRGVmSW50ZXJuYWw8YW55PnxcbiAgICAgVHlwZTxhbnk+LyogVHlwZSBhcyB3b3JrYXJvdW5kIGZvcjogTWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzQ4ODEgKi8pW107XG5cblxuLy8gTm90ZTogVGhpcyBoYWNrIGlzIG5lY2Vzc2FyeSBzbyB3ZSBkb24ndCBlcnJvbmVvdXNseSBnZXQgYSBjaXJjdWxhciBkZXBlbmRlbmN5XG4vLyBmYWlsdXJlIGJhc2VkIG9uIHR5cGVzLlxuZXhwb3J0IGNvbnN0IHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkID0gMTtcblxuLy8gTm90ZSB0aGlzIHdpbGwgZXhwYW5kIG9uY2UgYGNsYXNzYCBpcyBpbnRyb2R1Y2VkIHRvIHN0eWxpbmdcbmV4cG9ydCBjb25zdCBlbnVtIEluaXRpYWxTdHlsaW5nRmxhZ3Mge1xuICAvKiogTW9kZSBmb3IgbWF0Y2hpbmcgaW5pdGlhbCBzdHlsZSB2YWx1ZXMgKi9cbiAgSU5JVElBTF9TVFlMRVMgPSAwYjAwLFxufVxuIl19