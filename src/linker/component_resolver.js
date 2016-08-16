/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var console_1 = require('../console');
var decorators_1 = require('../di/decorators');
var async_1 = require('../facade/async');
var exceptions_1 = require('../facade/exceptions');
var lang_1 = require('../facade/lang');
var reflection_1 = require('../reflection/reflection');
var component_factory_1 = require('./component_factory');
/**
 * Low-level service for loading {@link ComponentFactory}s, which
 * can later be used to create and render a Component instance.
 *
 * @deprecated Use {@link ComponentFactoryResolver} together with {@link
 * AppModule}.precompile}/{@link Component}.precompile or
 * {@link ANALYZE_FOR_PRECOMPILE} provider for dynamic component creation.
 * Use {@link AppModuleFactoryLoader} for lazy loading.
 */
var ComponentResolver = (function () {
    function ComponentResolver() {
    }
    ComponentResolver.DynamicCompilationDeprecationMsg = 'ComponentResolver is deprecated for dynamic compilation. Use ComponentFactoryResolver together with @AppModule/@Component.precompile or ANALYZE_FOR_PRECOMPILE provider instead.';
    ComponentResolver.LazyLoadingDeprecationMsg = 'ComponentResolver is deprecated for lazy loading. Use AppModuleFactoryLoader instead.';
    return ComponentResolver;
}());
exports.ComponentResolver = ComponentResolver;
function _isComponentFactory(type) {
    return type instanceof component_factory_1.ComponentFactory;
}
var ReflectorComponentResolver = (function (_super) {
    __extends(ReflectorComponentResolver, _super);
    function ReflectorComponentResolver(_console) {
        _super.call(this);
        this._console = _console;
    }
    ReflectorComponentResolver.prototype.resolveComponent = function (component) {
        if (lang_1.isString(component)) {
            return async_1.PromiseWrapper.reject(new exceptions_1.BaseException("Cannot resolve component using '" + component + "'."), null);
        }
        this._console.warn(ComponentResolver.DynamicCompilationDeprecationMsg);
        var metadatas = reflection_1.reflector.annotations(component);
        var componentFactory = metadatas.find(_isComponentFactory);
        if (lang_1.isBlank(componentFactory)) {
            throw new exceptions_1.BaseException("No precompiled component " + lang_1.stringify(component) + " found");
        }
        return async_1.PromiseWrapper.resolve(componentFactory);
    };
    ReflectorComponentResolver.prototype.clearCache = function () { };
    /** @nocollapse */
    ReflectorComponentResolver.decorators = [
        { type: decorators_1.Injectable },
    ];
    /** @nocollapse */
    ReflectorComponentResolver.ctorParameters = [
        { type: console_1.Console, },
    ];
    return ReflectorComponentResolver;
}(ComponentResolver));
exports.ReflectorComponentResolver = ReflectorComponentResolver;
//# sourceMappingURL=component_resolver.js.map