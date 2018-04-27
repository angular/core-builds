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
import { defineInjector } from '../di/defs';
import { convertInjectableProviderToFactory } from '../di/injectable';
import { makeDecorator } from '../util/decorators';
/**
 * A wrapper around a module that also includes the providers.
 *
 *
 * @record
 */
export function ModuleWithProviders() { }
function ModuleWithProviders_tsickle_Closure_declarations() {
    /** @type {?} */
    ModuleWithProviders.prototype.ngModule;
    /** @type {?|undefined} */
    ModuleWithProviders.prototype.providers;
}
/**
 * Interface for schema definitions in \@NgModules.
 *
 * \@experimental
 * @record
 */
export function SchemaMetadata() { }
function SchemaMetadata_tsickle_Closure_declarations() {
    /** @type {?} */
    SchemaMetadata.prototype.name;
}
/**
 * Defines a schema that will allow:
 * - any non-Angular elements with a `-` in their name,
 * - any properties on elements with a `-` in their name which is the common rule for custom
 * elements.
 *
 *
 */
export var /** @type {?} */ CUSTOM_ELEMENTS_SCHEMA = {
    name: 'custom-elements'
};
/**
 * Defines a schema that will allow any property on any element.
 *
 * \@experimental
 */
export var /** @type {?} */ NO_ERRORS_SCHEMA = {
    name: 'no-errors-schema'
};
/**
 * Type of the NgModule decorator / constructor function.
 *
 *
 * @record
 */
export function NgModuleDecorator() { }
function NgModuleDecorator_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (obj?: NgModule): TypeDecorator;
    */
    /* TODO: handle strange member:
    new (obj?: NgModule): NgModule;
    */
}
/**
 * NgModule decorator and metadata.
 *
 *
 * \@Annotation
 */
export var /** @type {?} */ NgModule = makeDecorator('NgModule', function (ngModule) { return ngModule; }, undefined, undefined, function (moduleType, metadata) {
    var /** @type {?} */ imports = (metadata && metadata.imports) || [];
    if (metadata && metadata.exports) {
        imports = imports.concat([metadata.exports]);
    }
    moduleType.ngInjectorDef = defineInjector({
        factory: convertInjectableProviderToFactory(moduleType, { useClass: moduleType }),
        providers: metadata && metadata.providers,
        imports: imports,
    });
});
//# sourceMappingURL=ng_module.js.map