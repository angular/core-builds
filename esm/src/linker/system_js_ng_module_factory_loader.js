/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable, Optional } from '../di';
import { Compiler } from './compiler';
const _SEPARATOR = '#';
const FACTORY_CLASS_SUFFIX = 'NgFactory';
/**
 * Configuration for SystemJsNgModuleLoader.
 * token.
 *
 * @experimental
 */
export class SystemJsNgModuleLoaderConfig {
}
const DEFAULT_CONFIG = {
    factoryPathPrefix: '',
    factoryPathSuffix: '.ngfactory',
};
export class SystemJsNgModuleLoader {
    constructor(_compiler, config) {
        this._compiler = _compiler;
        this._system = () => System;
        this._config = config || DEFAULT_CONFIG;
    }
    load(path) {
        const offlineMode = this._compiler instanceof Compiler;
        return offlineMode ? this.loadFactory(path) : this.loadAndCompile(path);
    }
    loadAndCompile(path) {
        let [module, exportName] = path.split(_SEPARATOR);
        if (exportName === undefined)
            exportName = 'default';
        return this._system()
            .import(module)
            .then((module) => module[exportName])
            .then((type) => checkNotEmpty(type, module, exportName))
            .then((type) => this._compiler.compileModuleAsync(type));
    }
    loadFactory(path) {
        let [module, exportName] = path.split(_SEPARATOR);
        let factoryClassSuffix = FACTORY_CLASS_SUFFIX;
        if (exportName === undefined) {
            exportName = 'default';
            factoryClassSuffix = '';
        }
        return this._system()
            .import(this._config.factoryPathPrefix + module + this._config.factoryPathSuffix)
            .then((module) => module[exportName + factoryClassSuffix])
            .then((factory) => checkNotEmpty(factory, module, exportName));
    }
}
/** @nocollapse */
SystemJsNgModuleLoader.decorators = [
    { type: Injectable },
];
/** @nocollapse */
SystemJsNgModuleLoader.ctorParameters = [
    { type: Compiler, },
    { type: SystemJsNgModuleLoaderConfig, decorators: [{ type: Optional },] },
];
function checkNotEmpty(value, modulePath, exportName) {
    if (!value) {
        throw new Error(`Cannot find '${exportName}' in '${modulePath}'`);
    }
    return value;
}
//# sourceMappingURL=system_js_ng_module_factory_loader.js.map