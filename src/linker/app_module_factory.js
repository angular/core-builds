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
var injector_1 = require('../di/injector');
var exceptions_1 = require('../facade/exceptions');
var component_factory_resolver_1 = require('./component_factory_resolver');
/**
 * Represents an instance of an AppModule created via a {@link AppModuleFactory}.
 *
 * `AppModuleRef` provides access to the AppModule Instance as well other objects related to this
 * AppModule Instance.
 * @stable
 */
var AppModuleRef = (function () {
    function AppModuleRef() {
    }
    Object.defineProperty(AppModuleRef.prototype, "injector", {
        /**
         * The injector that contains all of the providers of the AppModule.
         */
        get: function () { return exceptions_1.unimplemented(); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleRef.prototype, "componentFactoryResolver", {
        /**
         * The ComponentFactoryResolver to get hold of the ComponentFactories
         * delcared in the `precompile` property of the module.
         */
        get: function () { return exceptions_1.unimplemented(); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleRef.prototype, "instance", {
        /**
         * The AppModule instance.
         */
        get: function () { return exceptions_1.unimplemented(); },
        enumerable: true,
        configurable: true
    });
    return AppModuleRef;
}());
exports.AppModuleRef = AppModuleRef;
/**
 * @stable
 */
var AppModuleFactory = (function () {
    function AppModuleFactory(_injectorClass, _moduleype) {
        this._injectorClass = _injectorClass;
        this._moduleype = _moduleype;
    }
    Object.defineProperty(AppModuleFactory.prototype, "moduleType", {
        get: function () { return this._moduleype; },
        enumerable: true,
        configurable: true
    });
    AppModuleFactory.prototype.create = function (parentInjector) {
        if (parentInjector === void 0) { parentInjector = null; }
        if (!parentInjector) {
            parentInjector = injector_1.Injector.NULL;
        }
        var instance = new this._injectorClass(parentInjector);
        instance.create();
        return instance;
    };
    return AppModuleFactory;
}());
exports.AppModuleFactory = AppModuleFactory;
var _UNDEFINED = new Object();
var AppModuleInjector = (function (_super) {
    __extends(AppModuleInjector, _super);
    function AppModuleInjector(parent, factories) {
        _super.call(this, factories, parent.get(component_factory_resolver_1.ComponentFactoryResolver, component_factory_resolver_1.ComponentFactoryResolver.NULL));
        this.parent = parent;
    }
    AppModuleInjector.prototype.create = function () { this.instance = this.createInternal(); };
    AppModuleInjector.prototype.get = function (token, notFoundValue) {
        if (notFoundValue === void 0) { notFoundValue = injector_1.THROW_IF_NOT_FOUND; }
        if (token === injector_1.Injector || token === component_factory_resolver_1.ComponentFactoryResolver) {
            return this;
        }
        var result = this.getInternal(token, _UNDEFINED);
        return result === _UNDEFINED ? this.parent.get(token, notFoundValue) : result;
    };
    Object.defineProperty(AppModuleInjector.prototype, "injector", {
        get: function () { return this; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "componentFactoryResolver", {
        get: function () { return this; },
        enumerable: true,
        configurable: true
    });
    return AppModuleInjector;
}(component_factory_resolver_1.CodegenComponentFactoryResolver));
exports.AppModuleInjector = AppModuleInjector;
//# sourceMappingURL=app_module_factory.js.map