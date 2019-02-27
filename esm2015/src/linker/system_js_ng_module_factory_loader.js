/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { Injectable, Optional } from '../di';
import { Compiler } from './compiler';
import * as i0 from "../r3_symbols";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** @type {?} */
const _SEPARATOR = '#';
/** @type {?} */
const FACTORY_CLASS_SUFFIX = 'NgFactory';
/**
 * Configuration for SystemJsNgModuleLoader.
 * token.
 *
 * \@publicApi
 * @abstract
 */
export class SystemJsNgModuleLoaderConfig {
}
if (false) {
    /**
     * Prefix to add when computing the name of the factory module for a given module name.
     * @type {?}
     */
    SystemJsNgModuleLoaderConfig.prototype.factoryPathPrefix;
    /**
     * Suffix to add when computing the name of the factory module for a given module name.
     * @type {?}
     */
    SystemJsNgModuleLoaderConfig.prototype.factoryPathSuffix;
}
/** @type {?} */
const DEFAULT_CONFIG = {
    factoryPathPrefix: '',
    factoryPathSuffix: '.ngfactory',
};
/**
 * NgModuleFactoryLoader that uses SystemJS to load NgModuleFactory
 * \@publicApi
 */
export class SystemJsNgModuleLoader {
    /**
     * @param {?} _compiler
     * @param {?=} config
     */
    constructor(_compiler, config) {
        this._compiler = _compiler;
        this._config = config || DEFAULT_CONFIG;
    }
    /**
     * @param {?} path
     * @return {?}
     */
    load(path) {
        /** @type {?} */
        const offlineMode = this._compiler instanceof Compiler;
        return offlineMode ? this.loadFactory(path) : this.loadAndCompile(path);
    }
    /**
     * @private
     * @param {?} path
     * @return {?}
     */
    loadAndCompile(path) {
        let [module, exportName] = path.split(_SEPARATOR);
        if (exportName === undefined) {
            exportName = 'default';
        }
        return System.import(module)
            .then((module) => module[exportName])
            .then((type) => checkNotEmpty(type, module, exportName))
            .then((type) => this._compiler.compileModuleAsync(type));
    }
    /**
     * @private
     * @param {?} path
     * @return {?}
     */
    loadFactory(path) {
        let [module, exportName] = path.split(_SEPARATOR);
        /** @type {?} */
        let factoryClassSuffix = FACTORY_CLASS_SUFFIX;
        if (exportName === undefined) {
            exportName = 'default';
            factoryClassSuffix = '';
        }
        return System.import(this._config.factoryPathPrefix + module + this._config.factoryPathSuffix)
            .then((module) => module[exportName + factoryClassSuffix])
            .then((factory) => checkNotEmpty(factory, module, exportName));
    }
}
SystemJsNgModuleLoader.decorators = [
    { type: Injectable },
];
/** @nocollapse */
SystemJsNgModuleLoader.ctorParameters = () => [
    { type: Compiler },
    { type: SystemJsNgModuleLoaderConfig, decorators: [{ type: Optional }] }
];
/** @nocollapse */ SystemJsNgModuleLoader.ngInjectableDef = i0.defineInjectable({ token: SystemJsNgModuleLoader, factory: function SystemJsNgModuleLoader_Factory(t) { return new (t || SystemJsNgModuleLoader)(i0.inject(Compiler), i0.inject(SystemJsNgModuleLoaderConfig, 8)); }, providedIn: null });
/*@__PURE__*/ i0.setClassMetadata(SystemJsNgModuleLoader, [{
        type: Injectable
    }], function () { return [{
        type: Compiler
    }, {
        type: SystemJsNgModuleLoaderConfig,
        decorators: [{
                type: Optional
            }]
    }]; }, null);
if (false) {
    /**
     * @type {?}
     * @private
     */
    SystemJsNgModuleLoader.prototype._config;
    /**
     * @type {?}
     * @private
     */
    SystemJsNgModuleLoader.prototype._compiler;
}
/**
 * @param {?} value
 * @param {?} modulePath
 * @param {?} exportName
 * @return {?}
 */
function checkNotEmpty(value, modulePath, exportName) {
    if (!value) {
        throw new Error(`Cannot find '${exportName}' in '${modulePath}'`);
    }
    return value;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3lzdGVtX2pzX25nX21vZHVsZV9mYWN0b3J5X2xvYWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2xpbmtlci9zeXN0ZW1fanNfbmdfbW9kdWxlX2ZhY3RvcnlfbG9hZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFTQSxPQUFPLEVBQUMsVUFBVSxFQUFFLFFBQVEsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUUzQyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sWUFBWSxDQUFDOzs7Ozs7Ozs7O01BSTlCLFVBQVUsR0FBRyxHQUFHOztNQUVoQixvQkFBb0IsR0FBRyxXQUFXOzs7Ozs7OztBQVN4QyxNQUFNLE9BQWdCLDRCQUE0QjtDQVlqRDs7Ozs7O0lBUEMseURBQTRCOzs7OztJQU01Qix5REFBNEI7OztNQUd4QixjQUFjLEdBQWlDO0lBQ25ELGlCQUFpQixFQUFFLEVBQUU7SUFDckIsaUJBQWlCLEVBQUUsWUFBWTtDQUNoQzs7Ozs7QUFPRCxNQUFNLE9BQU8sc0JBQXNCOzs7OztJQUdqQyxZQUFvQixTQUFtQixFQUFjLE1BQXFDO1FBQXRFLGNBQVMsR0FBVCxTQUFTLENBQVU7UUFDckMsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLElBQUksY0FBYyxDQUFDO0lBQzFDLENBQUM7Ozs7O0lBRUQsSUFBSSxDQUFDLElBQVk7O2NBQ1QsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLFlBQVksUUFBUTtRQUN0RCxPQUFPLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxRSxDQUFDOzs7Ozs7SUFFTyxjQUFjLENBQUMsSUFBWTtZQUM3QixDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQztRQUNqRCxJQUFJLFVBQVUsS0FBSyxTQUFTLEVBQUU7WUFDNUIsVUFBVSxHQUFHLFNBQVMsQ0FBQztTQUN4QjtRQUVELE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7YUFDdkIsSUFBSSxDQUFDLENBQUMsTUFBVyxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDekMsSUFBSSxDQUFDLENBQUMsSUFBUyxFQUFFLEVBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQzthQUM1RCxJQUFJLENBQUMsQ0FBQyxJQUFTLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNwRSxDQUFDOzs7Ozs7SUFFTyxXQUFXLENBQUMsSUFBWTtZQUMxQixDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQzs7WUFDN0Msa0JBQWtCLEdBQUcsb0JBQW9CO1FBQzdDLElBQUksVUFBVSxLQUFLLFNBQVMsRUFBRTtZQUM1QixVQUFVLEdBQUcsU0FBUyxDQUFDO1lBQ3ZCLGtCQUFrQixHQUFHLEVBQUUsQ0FBQztTQUN6QjtRQUVELE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDO2FBQ3pGLElBQUksQ0FBQyxDQUFDLE1BQVcsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsR0FBRyxrQkFBa0IsQ0FBQyxDQUFDO2FBQzlELElBQUksQ0FBQyxDQUFDLE9BQVksRUFBRSxFQUFFLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUMxRSxDQUFDOzs7WUFwQ0YsVUFBVTs7OztZQXRDSCxRQUFRO1lBMENnRCw0QkFBNEIsdUJBQWhELFFBQVE7O3NFQUh2QyxzQkFBc0IseUVBQXRCLHNCQUFzQixZQXZDM0IsUUFBUSxhQTBDZ0QsNEJBQTRCO2tDQUgvRSxzQkFBc0I7Y0FEbEMsVUFBVTs7Y0F0Q0gsUUFBUTs7Y0EwQ2dELDRCQUE0Qjs7c0JBQWhELFFBQVE7Ozs7Ozs7O0lBRmxELHlDQUE4Qzs7Ozs7SUFFbEMsMkNBQTJCOzs7Ozs7OztBQW1DekMsU0FBUyxhQUFhLENBQUMsS0FBVSxFQUFFLFVBQWtCLEVBQUUsVUFBa0I7SUFDdkUsSUFBSSxDQUFDLEtBQUssRUFBRTtRQUNWLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0JBQWdCLFVBQVUsU0FBUyxVQUFVLEdBQUcsQ0FBQyxDQUFDO0tBQ25FO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5cbmltcG9ydCB7SW5qZWN0YWJsZSwgT3B0aW9uYWx9IGZyb20gJy4uL2RpJztcblxuaW1wb3J0IHtDb21waWxlcn0gZnJvbSAnLi9jb21waWxlcic7XG5pbXBvcnQge05nTW9kdWxlRmFjdG9yeX0gZnJvbSAnLi9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge05nTW9kdWxlRmFjdG9yeUxvYWRlcn0gZnJvbSAnLi9uZ19tb2R1bGVfZmFjdG9yeV9sb2FkZXInO1xuXG5jb25zdCBfU0VQQVJBVE9SID0gJyMnO1xuXG5jb25zdCBGQUNUT1JZX0NMQVNTX1NVRkZJWCA9ICdOZ0ZhY3RvcnknO1xuZGVjbGFyZSB2YXIgU3lzdGVtOiBhbnk7XG5cbi8qKlxuICogQ29uZmlndXJhdGlvbiBmb3IgU3lzdGVtSnNOZ01vZHVsZUxvYWRlci5cbiAqIHRva2VuLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFN5c3RlbUpzTmdNb2R1bGVMb2FkZXJDb25maWcge1xuICAvKipcbiAgICogUHJlZml4IHRvIGFkZCB3aGVuIGNvbXB1dGluZyB0aGUgbmFtZSBvZiB0aGUgZmFjdG9yeSBtb2R1bGUgZm9yIGEgZ2l2ZW4gbW9kdWxlIG5hbWUuXG4gICAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgZmFjdG9yeVBhdGhQcmVmaXggITogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBTdWZmaXggdG8gYWRkIHdoZW4gY29tcHV0aW5nIHRoZSBuYW1lIG9mIHRoZSBmYWN0b3J5IG1vZHVsZSBmb3IgYSBnaXZlbiBtb2R1bGUgbmFtZS5cbiAgICovXG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBmYWN0b3J5UGF0aFN1ZmZpeCAhOiBzdHJpbmc7XG59XG5cbmNvbnN0IERFRkFVTFRfQ09ORklHOiBTeXN0ZW1Kc05nTW9kdWxlTG9hZGVyQ29uZmlnID0ge1xuICBmYWN0b3J5UGF0aFByZWZpeDogJycsXG4gIGZhY3RvcnlQYXRoU3VmZml4OiAnLm5nZmFjdG9yeScsXG59O1xuXG4vKipcbiAqIE5nTW9kdWxlRmFjdG9yeUxvYWRlciB0aGF0IHVzZXMgU3lzdGVtSlMgdG8gbG9hZCBOZ01vZHVsZUZhY3RvcnlcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIFN5c3RlbUpzTmdNb2R1bGVMb2FkZXIgaW1wbGVtZW50cyBOZ01vZHVsZUZhY3RvcnlMb2FkZXIge1xuICBwcml2YXRlIF9jb25maWc6IFN5c3RlbUpzTmdNb2R1bGVMb2FkZXJDb25maWc7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfY29tcGlsZXI6IENvbXBpbGVyLCBAT3B0aW9uYWwoKSBjb25maWc/OiBTeXN0ZW1Kc05nTW9kdWxlTG9hZGVyQ29uZmlnKSB7XG4gICAgdGhpcy5fY29uZmlnID0gY29uZmlnIHx8IERFRkFVTFRfQ09ORklHO1xuICB9XG5cbiAgbG9hZChwYXRoOiBzdHJpbmcpOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxhbnk+PiB7XG4gICAgY29uc3Qgb2ZmbGluZU1vZGUgPSB0aGlzLl9jb21waWxlciBpbnN0YW5jZW9mIENvbXBpbGVyO1xuICAgIHJldHVybiBvZmZsaW5lTW9kZSA/IHRoaXMubG9hZEZhY3RvcnkocGF0aCkgOiB0aGlzLmxvYWRBbmRDb21waWxlKHBhdGgpO1xuICB9XG5cbiAgcHJpdmF0ZSBsb2FkQW5kQ29tcGlsZShwYXRoOiBzdHJpbmcpOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxhbnk+PiB7XG4gICAgbGV0IFttb2R1bGUsIGV4cG9ydE5hbWVdID0gcGF0aC5zcGxpdChfU0VQQVJBVE9SKTtcbiAgICBpZiAoZXhwb3J0TmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBleHBvcnROYW1lID0gJ2RlZmF1bHQnO1xuICAgIH1cblxuICAgIHJldHVybiBTeXN0ZW0uaW1wb3J0KG1vZHVsZSlcbiAgICAgICAgLnRoZW4oKG1vZHVsZTogYW55KSA9PiBtb2R1bGVbZXhwb3J0TmFtZV0pXG4gICAgICAgIC50aGVuKCh0eXBlOiBhbnkpID0+IGNoZWNrTm90RW1wdHkodHlwZSwgbW9kdWxlLCBleHBvcnROYW1lKSlcbiAgICAgICAgLnRoZW4oKHR5cGU6IGFueSkgPT4gdGhpcy5fY29tcGlsZXIuY29tcGlsZU1vZHVsZUFzeW5jKHR5cGUpKTtcbiAgfVxuXG4gIHByaXZhdGUgbG9hZEZhY3RvcnkocGF0aDogc3RyaW5nKTogUHJvbWlzZTxOZ01vZHVsZUZhY3Rvcnk8YW55Pj4ge1xuICAgIGxldCBbbW9kdWxlLCBleHBvcnROYW1lXSA9IHBhdGguc3BsaXQoX1NFUEFSQVRPUik7XG4gICAgbGV0IGZhY3RvcnlDbGFzc1N1ZmZpeCA9IEZBQ1RPUllfQ0xBU1NfU1VGRklYO1xuICAgIGlmIChleHBvcnROYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGV4cG9ydE5hbWUgPSAnZGVmYXVsdCc7XG4gICAgICBmYWN0b3J5Q2xhc3NTdWZmaXggPSAnJztcbiAgICB9XG5cbiAgICByZXR1cm4gU3lzdGVtLmltcG9ydCh0aGlzLl9jb25maWcuZmFjdG9yeVBhdGhQcmVmaXggKyBtb2R1bGUgKyB0aGlzLl9jb25maWcuZmFjdG9yeVBhdGhTdWZmaXgpXG4gICAgICAgIC50aGVuKChtb2R1bGU6IGFueSkgPT4gbW9kdWxlW2V4cG9ydE5hbWUgKyBmYWN0b3J5Q2xhc3NTdWZmaXhdKVxuICAgICAgICAudGhlbigoZmFjdG9yeTogYW55KSA9PiBjaGVja05vdEVtcHR5KGZhY3RvcnksIG1vZHVsZSwgZXhwb3J0TmFtZSkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNoZWNrTm90RW1wdHkodmFsdWU6IGFueSwgbW9kdWxlUGF0aDogc3RyaW5nLCBleHBvcnROYW1lOiBzdHJpbmcpOiBhbnkge1xuICBpZiAoIXZhbHVlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgZmluZCAnJHtleHBvcnROYW1lfScgaW4gJyR7bW9kdWxlUGF0aH0nYCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuIl19