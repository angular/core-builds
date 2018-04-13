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
/** @enum {number} */
const RenderFlags = {
    /* Whether to run the creation block (e.g. create elements and directives) */
    Create: 1,
    /* Whether to run the update block (e.g. refresh bindings) */
    Update: 2,
};
export { RenderFlags };
/**
 * A subclass of `Type` which has a static `ngComponentDef`:`ɵComponentDef` field making it
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
 * A subclass of `Type` which has a static `ngDirectiveDef`:`ɵDirectiveDef` field making it
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
 * A subclass of `Type` which has a static `ngPipeDef`:`ɵPipeDef` field making it
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
 *
 * NOTE: This is a semi public API, and there are no guaranties that the shape of this API will
 * remain consistent between version. Use with caution.
 *
 * \@experimental
 * @record
 * @template T
 */
export function ɵDirectiveDef() { }
function ɵDirectiveDef_tsickle_Closure_declarations() {
    /**
     * Token representing the directive. Used by DI.
     * @type {?}
     */
    ɵDirectiveDef.prototype.type;
    /**
     * Function that makes a directive public to the DI system.
     * @type {?}
     */
    ɵDirectiveDef.prototype.diPublic;
    /**
     * The selectors that will be used to match nodes to this directive.
     * @type {?}
     */
    ɵDirectiveDef.prototype.selectors;
    /**
     * A dictionary mapping the inputs' minified property names to their public API names, which
     * are their aliases if any, or their original unminified property names
     * (as in `\@Input('alias') propertyName: any;`).
     * @type {?}
     */
    ɵDirectiveDef.prototype.inputs;
    /**
     * A dictionary mapping the outputs' minified property names to their public API names, which
     * are their aliases if any, or their original unminified property names
     * (as in `\@Output('alias') propertyName: any;`).
     * @type {?}
     */
    ɵDirectiveDef.prototype.outputs;
    /**
     * Name under which the directive is exported (for use with local references in template)
     * @type {?}
     */
    ɵDirectiveDef.prototype.exportAs;
    /**
     * Factory function used to create a new directive instance.
     *
     * Usually returns the directive instance, but if the directive has a content query,
     * it instead returns an array that contains the instance as well as content query data.
     * @type {?}
     */
    ɵDirectiveDef.prototype.factory;
    /**
     * Refreshes host bindings on the associated directive.
     * @type {?}
     */
    ɵDirectiveDef.prototype.hostBindings;
    /**
     * Static attributes to set on host element.
     *
     * Even indices: attribute name
     * Odd indices: attribute value
     * @type {?}
     */
    ɵDirectiveDef.prototype.attributes;
    /** @type {?} */
    ɵDirectiveDef.prototype.onInit;
    /** @type {?} */
    ɵDirectiveDef.prototype.doCheck;
    /** @type {?} */
    ɵDirectiveDef.prototype.afterContentInit;
    /** @type {?} */
    ɵDirectiveDef.prototype.afterContentChecked;
    /** @type {?} */
    ɵDirectiveDef.prototype.afterViewInit;
    /** @type {?} */
    ɵDirectiveDef.prototype.afterViewChecked;
    /** @type {?} */
    ɵDirectiveDef.prototype.onDestroy;
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
 *
 * NOTE: This is a semi public API, and there are no guaranties that the shape of this API will
 * remain consistent between version. Use with caution.
 *
 * \@experimental
 * @record
 * @template T
 */
export function ɵComponentDef() { }
function ɵComponentDef_tsickle_Closure_declarations() {
    /**
     * The View template of the component.
     *
     * NOTE: only used with component directives.
     * @type {?}
     */
    ɵComponentDef.prototype.template;
    /**
     * Renderer type data of the component.
     *
     * NOTE: only used with component directives.
     * @type {?}
     */
    ɵComponentDef.prototype.rendererType;
    /**
     * Whether or not this component's ChangeDetectionStrategy is OnPush
     * @type {?}
     */
    ɵComponentDef.prototype.onPush;
    /**
     * Defines the set of injectable providers that are visible to a Directive and its content DOM
     * children.
     * @type {?|undefined}
     */
    ɵComponentDef.prototype.providers;
    /**
     * Defines the set of injectable providers that are visible to a Directive and its view DOM
     * children only.
     * @type {?|undefined}
     */
    ɵComponentDef.prototype.viewProviders;
    /**
     * Registry of directives and components that may be found in this view.
     *
     * The property is either an array of `ɵDirectiveDef`s or a function which returns the array of
     * `ɵDirectiveDef`s. The function is necessary to be able to support forward declarations.
     * @type {?}
     */
    ɵComponentDef.prototype.directiveDefs;
    /**
     * Registry of pipes that may be found in this view.
     *
     * The property is either an array of `PipeDefs`s or a function which returns the array of
     * `PipeDefs`s. The function is necessary to be able to support forward declarations.
     * @type {?}
     */
    ɵComponentDef.prototype.pipeDefs;
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
 *
 * NOTE: This is a semi public API, and there are no guaranties that the shape of this API will
 * remain consistent between version. Use with caution.
 *
 * \@experimental
 * @record
 * @template T
 */
export function ɵPipeDef() { }
function ɵPipeDef_tsickle_Closure_declarations() {
    /**
     * Pipe name.
     *
     * Used to resolve pipe in templates.
     * @type {?}
     */
    ɵPipeDef.prototype.name;
    /**
     * factory function used to create a new directive instance.
     *
     * NOTE: this property is short (1 char) because it is used in
     * component templates which is sensitive to size.
     * @type {?}
     */
    ɵPipeDef.prototype.n;
    /**
     * Whether or not the pipe is pure.
     *
     * Pure pipes result only depends on the pipe input and not on internal
     * state of the pipe.
     * @type {?}
     */
    ɵPipeDef.prototype.pure;
    /** @type {?} */
    ɵPipeDef.prototype.onDestroy;
}
// Note: This hack is necessary so we don't erroneously get a circular dependency
// failure based on types.
export const /** @type {?} */ unusedValueExportToPlacateAjd = 1;
//# sourceMappingURL=definition.js.map