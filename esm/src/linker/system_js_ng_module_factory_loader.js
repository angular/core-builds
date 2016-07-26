/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable, Optional } from '../di';
import { global } from '../facade/lang';
import { Compiler } from './compiler';
const _SEPARATOR = '#';
const FACTORY_MODULE_SUFFIX = '.ngfactory';
const FACTORY_CLASS_SUFFIX = 'NgFactory';
export class SystemJsNgModuleLoader {
    constructor(_compiler) {
        this._compiler = _compiler;
    }
    load(path) {
        return this._compiler ? this.loadAndCompile(path) : this.loadFactory(path);
    }
    loadAndCompile(path) {
        let [module, exportName] = path.split(_SEPARATOR);
        if (exportName === undefined)
            exportName = 'default';
        return global
            .System.import(module)
            .then((module) => module[exportName])
            .then((type) => checkNotEmpty(type, module, exportName))
            .then((type) => this._compiler.compileModuleAsync(type));
    }
    loadFactory(path) {
        let [module, exportName] = path.split(_SEPARATOR);
        if (exportName === undefined)
            exportName = 'default';
        return global
            .System.import(module + FACTORY_MODULE_SUFFIX)
            .then((module) => module[exportName + FACTORY_CLASS_SUFFIX])
            .then((factory) => checkNotEmpty(factory, module, exportName));
    }
}
/** @nocollapse */
SystemJsNgModuleLoader.decorators = [
    { type: Injectable },
];
/** @nocollapse */
SystemJsNgModuleLoader.ctorParameters = [
    { type: Compiler, decorators: [{ type: Optional },] },
];
function checkNotEmpty(value, modulePath, exportName) {
    if (!value) {
        throw new Error(`Cannot find '${exportName}' in '${modulePath}'`);
    }
    return value;
}
//# sourceMappingURL=system_js_ng_module_factory_loader.js.map