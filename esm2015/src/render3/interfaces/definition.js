/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * A subclass of `Type` which has a static `ngComponentDef`:`ComponentDef` field making it
 * consumable for rendering.
 * @record
 * @template T
 */
export function ComponentType() { }
function ComponentType_tsickle_Closure_declarations() {
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
function DirectiveType_tsickle_Closure_declarations() {
    /** @type {?} */
    DirectiveType.prototype.ngDirectiveDef;
}
/** @enum {number} */
const DirectiveDefFlags = { ContentQuery: 2, };
export { DirectiveDefFlags };
/**
 * A subclass of `Type` which has a static `ngPipeDef`:`PipeDef` field making it
 * consumable for rendering.
 * @record
 * @template T
 */
export function PipeType() { }
function PipeType_tsickle_Closure_declarations() {
    /** @type {?} */
    PipeType.prototype.ngPipeDef;
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
 * See: {\@link defineDirective}
 * @record
 * @template T
 */
export function DirectiveDef() { }
function DirectiveDef_tsickle_Closure_declarations() {
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
     * A dictionary mapping the inputs' minified property names to their public API names, which
     * are their aliases if any, or their original unminified property names
     * (as in `\@Input('alias') propertyName: any;`).
     * @type {?}
     */
    DirectiveDef.prototype.inputs;
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
function ComponentDef_tsickle_Closure_declarations() {
    /**
     * The tag name which should be used by the component.
     *
     * NOTE: only used with component directives.
     * @type {?}
     */
    ComponentDef.prototype.tag;
    /**
     * The View template of the component.
     *
     * NOTE: only used with component directives.
     * @type {?}
     */
    ComponentDef.prototype.template;
    /**
     * Renderer type data of the component.
     *
     * NOTE: only used with component directives.
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
function PipeDef_tsickle_Closure_declarations() {
    /**
     * factory function used to create a new directive instance.
     *
     * NOTE: this property is short (1 char) because it is used in
     * component templates which is sensitive to size.
     * @type {?}
     */
    PipeDef.prototype.n;
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
 * Arguments for `defineDirective`
 * @record
 * @template T
 */
export function DirectiveDefArgs() { }
function DirectiveDefArgs_tsickle_Closure_declarations() {
    /**
     * Directive type, needed to configure the injector.
     * @type {?}
     */
    DirectiveDefArgs.prototype.type;
    /**
     * Factory method used to create an instance of directive.
     * @type {?}
     */
    DirectiveDefArgs.prototype.factory;
    /**
     * Static attributes to set on host element.
     *
     * Even indices: attribute name
     * Odd indices: attribute value
     * @type {?|undefined}
     */
    DirectiveDefArgs.prototype.attributes;
    /**
     * A map of input names.
     *
     * The format is in: `{[actualPropertyName: string]:string}`.
     *
     * Which the minifier may translate to: `{[minifiedPropertyName: string]:string}`.
     *
     * This allows the render to re-construct the minified and non-minified names
     * of properties.
     * @type {?|undefined}
     */
    DirectiveDefArgs.prototype.inputs;
    /**
     * A map of output names.
     *
     * The format is in: `{[actualPropertyName: string]:string}`.
     *
     * Which the minifier may translate to: `{[minifiedPropertyName: string]:string}`.
     *
     * This allows the render to re-construct the minified and non-minified names
     * of properties.
     * @type {?|undefined}
     */
    DirectiveDefArgs.prototype.outputs;
    /**
     * A list of optional features to apply.
     *
     * See: {\@link NgOnChangesFeature}, {\@link PublicFeature}
     * @type {?|undefined}
     */
    DirectiveDefArgs.prototype.features;
    /**
     * Function executed by the parent template to allow child directive to apply host bindings.
     * @type {?|undefined}
     */
    DirectiveDefArgs.prototype.hostBindings;
    /**
     * Defines the name that can be used in the template to assign this directive to a variable.
     *
     * See: {\@link Directive.exportAs}
     * @type {?|undefined}
     */
    DirectiveDefArgs.prototype.exportAs;
}
/**
 * Arguments for `defineComponent`.
 * @record
 * @template T
 */
export function ComponentDefArgs() { }
function ComponentDefArgs_tsickle_Closure_declarations() {
    /**
     * HTML tag name to use in place where this component should be instantiated.
     * @type {?}
     */
    ComponentDefArgs.prototype.tag;
    /**
     * Template function use for rendering DOM.
     *
     * This function has following structure.
     *
     * ```
     * function Template<T>(ctx:T, creationMode: boolean) {
     *   if (creationMode) {
     *     // Contains creation mode instructions.
     *   }
     *   // Contains binding update instructions
     * }
     * ```
     *
     * Common instructions are:
     * Creation mode instructions:
     *  - `elementStart`, `elementEnd`
     *  - `text`
     *  - `container`
     *  - `listener`
     *
     * Binding update instructions:
     * - `bind`
     * - `elementAttribute`
     * - `elementProperty`
     * - `elementClass`
     * - `elementStyle`
     *
     * @type {?}
     */
    ComponentDefArgs.prototype.template;
    /**
     * A list of optional features to apply.
     *
     * See: {\@link NgOnChancesFeature}, {\@link PublicFeature}
     * @type {?|undefined}
     */
    ComponentDefArgs.prototype.features;
    /** @type {?|undefined} */
    ComponentDefArgs.prototype.rendererType;
    /** @type {?|undefined} */
    ComponentDefArgs.prototype.changeDetection;
    /**
     * Defines the set of injectable objects that are visible to a Directive and its light DOM
     * children.
     * @type {?|undefined}
     */
    ComponentDefArgs.prototype.providers;
    /**
     * Defines the set of injectable objects that are visible to its view DOM children.
     * @type {?|undefined}
     */
    ComponentDefArgs.prototype.viewProviders;
}
// Note: This hack is necessary so we don't erroneously get a circular dependency
// failure based on types.
export const /** @type {?} */ unusedValueExportToPlacateAjd = 1;
//# sourceMappingURL=definition.js.map