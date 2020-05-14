/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/linker/system_js_ng_module_factory_loader.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable, Optional } from '../di';
import { ivyEnabled } from '../ivy_switch';
import { Compiler } from './compiler';
/** @type {?} */
const _SEPARATOR = '#';
/** @type {?} */
const FACTORY_CLASS_SUFFIX = 'NgFactory';
/**
 * Configuration for SystemJsNgModuleLoader.
 * token.
 *
 * \@publicApi
 * @deprecated the `string` form of `loadChildren` is deprecated, and `SystemJsNgModuleLoaderConfig`
 * is part of its implementation. See `LoadChildren` for more details.
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
 * @deprecated the `string` form of `loadChildren` is deprecated, and `SystemJsNgModuleLoader` is
 * part of its implementation. See `LoadChildren` for more details.
 */
let SystemJsNgModuleLoader = /** @class */ (() => {
    /**
     * NgModuleFactoryLoader that uses SystemJS to load NgModuleFactory
     * \@publicApi
     * @deprecated the `string` form of `loadChildren` is deprecated, and `SystemJsNgModuleLoader` is
     * part of its implementation. See `LoadChildren` for more details.
     */
    class SystemJsNgModuleLoader {
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
            const legacyOfflineMode = !ivyEnabled && this._compiler instanceof Compiler;
            return legacyOfflineMode ? this.loadFactory(path) : this.loadAndCompile(path);
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
                .then((/**
             * @param {?} module
             * @return {?}
             */
            (module) => module[exportName]))
                .then((/**
             * @param {?} type
             * @return {?}
             */
            (type) => checkNotEmpty(type, module, exportName)))
                .then((/**
             * @param {?} type
             * @return {?}
             */
            (type) => this._compiler.compileModuleAsync(type)));
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
                .then((/**
             * @param {?} module
             * @return {?}
             */
            (module) => module[exportName + factoryClassSuffix]))
                .then((/**
             * @param {?} factory
             * @return {?}
             */
            (factory) => checkNotEmpty(factory, module, exportName)));
        }
    }
    SystemJsNgModuleLoader.decorators = [
        { type: Injectable }
    ];
    /** @nocollapse */
    SystemJsNgModuleLoader.ctorParameters = () => [
        { type: Compiler },
        { type: SystemJsNgModuleLoaderConfig, decorators: [{ type: Optional }] }
    ];
    return SystemJsNgModuleLoader;
})();
export { SystemJsNgModuleLoader };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3lzdGVtX2pzX25nX21vZHVsZV9mYWN0b3J5X2xvYWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2xpbmtlci9zeXN0ZW1fanNfbmdfbW9kdWxlX2ZhY3RvcnlfbG9hZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxVQUFVLEVBQUUsUUFBUSxFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQzNDLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFekMsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLFlBQVksQ0FBQzs7TUFJOUIsVUFBVSxHQUFHLEdBQUc7O01BRWhCLG9CQUFvQixHQUFHLFdBQVc7Ozs7Ozs7Ozs7QUFXeEMsTUFBTSxPQUFnQiw0QkFBNEI7Q0FZakQ7Ozs7OztJQVBDLHlEQUEyQjs7Ozs7SUFNM0IseURBQTJCOzs7TUFHdkIsY0FBYyxHQUFpQztJQUNuRCxpQkFBaUIsRUFBRSxFQUFFO0lBQ3JCLGlCQUFpQixFQUFFLFlBQVk7Q0FDaEM7Ozs7Ozs7QUFRRDs7Ozs7OztJQUFBLE1BQ2Esc0JBQXNCOzs7OztRQUdqQyxZQUFvQixTQUFtQixFQUFjLE1BQXFDO1lBQXRFLGNBQVMsR0FBVCxTQUFTLENBQVU7WUFDckMsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLElBQUksY0FBYyxDQUFDO1FBQzFDLENBQUM7Ozs7O1FBRUQsSUFBSSxDQUFDLElBQVk7O2tCQUNULGlCQUFpQixHQUFHLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxTQUFTLFlBQVksUUFBUTtZQUMzRSxPQUFPLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hGLENBQUM7Ozs7OztRQUVPLGNBQWMsQ0FBQyxJQUFZO2dCQUM3QixDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQztZQUNqRCxJQUFJLFVBQVUsS0FBSyxTQUFTLEVBQUU7Z0JBQzVCLFVBQVUsR0FBRyxTQUFTLENBQUM7YUFDeEI7WUFFRCxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO2lCQUN2QixJQUFJOzs7O1lBQUMsQ0FBQyxNQUFXLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFBQztpQkFDekMsSUFBSTs7OztZQUFDLENBQUMsSUFBUyxFQUFFLEVBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUMsRUFBQztpQkFDNUQsSUFBSTs7OztZQUFDLENBQUMsSUFBUyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFDLENBQUM7UUFDcEUsQ0FBQzs7Ozs7O1FBRU8sV0FBVyxDQUFDLElBQVk7Z0JBQzFCLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDOztnQkFDN0Msa0JBQWtCLEdBQUcsb0JBQW9CO1lBQzdDLElBQUksVUFBVSxLQUFLLFNBQVMsRUFBRTtnQkFDNUIsVUFBVSxHQUFHLFNBQVMsQ0FBQztnQkFDdkIsa0JBQWtCLEdBQUcsRUFBRSxDQUFDO2FBQ3pCO1lBRUQsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUM7aUJBQ3pGLElBQUk7Ozs7WUFBQyxDQUFDLE1BQVcsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsR0FBRyxrQkFBa0IsQ0FBQyxFQUFDO2lCQUM5RCxJQUFJOzs7O1lBQUMsQ0FBQyxPQUFZLEVBQUUsRUFBRSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBQyxFQUFDLENBQUM7UUFDMUUsQ0FBQzs7O2dCQXBDRixVQUFVOzs7O2dCQTFDSCxRQUFRO2dCQThDZ0QsNEJBQTRCLHVCQUFoRCxRQUFROztJQWlDcEQsNkJBQUM7S0FBQTtTQXBDWSxzQkFBc0I7Ozs7OztJQUNqQyx5Q0FBOEM7Ozs7O0lBRWxDLDJDQUEyQjs7Ozs7Ozs7QUFtQ3pDLFNBQVMsYUFBYSxDQUFDLEtBQVUsRUFBRSxVQUFrQixFQUFFLFVBQWtCO0lBQ3ZFLElBQUksQ0FBQyxLQUFLLEVBQUU7UUFDVixNQUFNLElBQUksS0FBSyxDQUFDLGdCQUFnQixVQUFVLFNBQVMsVUFBVSxHQUFHLENBQUMsQ0FBQztLQUNuRTtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuXG5pbXBvcnQge0luamVjdGFibGUsIE9wdGlvbmFsfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2l2eUVuYWJsZWR9IGZyb20gJy4uL2l2eV9zd2l0Y2gnO1xuXG5pbXBvcnQge0NvbXBpbGVyfSBmcm9tICcuL2NvbXBpbGVyJztcbmltcG9ydCB7TmdNb2R1bGVGYWN0b3J5fSBmcm9tICcuL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7TmdNb2R1bGVGYWN0b3J5TG9hZGVyfSBmcm9tICcuL25nX21vZHVsZV9mYWN0b3J5X2xvYWRlcic7XG5cbmNvbnN0IF9TRVBBUkFUT1IgPSAnIyc7XG5cbmNvbnN0IEZBQ1RPUllfQ0xBU1NfU1VGRklYID0gJ05nRmFjdG9yeSc7XG5kZWNsYXJlIHZhciBTeXN0ZW06IGFueTtcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIGZvciBTeXN0ZW1Kc05nTW9kdWxlTG9hZGVyLlxuICogdG9rZW4uXG4gKlxuICogQHB1YmxpY0FwaVxuICogQGRlcHJlY2F0ZWQgdGhlIGBzdHJpbmdgIGZvcm0gb2YgYGxvYWRDaGlsZHJlbmAgaXMgZGVwcmVjYXRlZCwgYW5kIGBTeXN0ZW1Kc05nTW9kdWxlTG9hZGVyQ29uZmlnYFxuICogaXMgcGFydCBvZiBpdHMgaW1wbGVtZW50YXRpb24uIFNlZSBgTG9hZENoaWxkcmVuYCBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU3lzdGVtSnNOZ01vZHVsZUxvYWRlckNvbmZpZyB7XG4gIC8qKlxuICAgKiBQcmVmaXggdG8gYWRkIHdoZW4gY29tcHV0aW5nIHRoZSBuYW1lIG9mIHRoZSBmYWN0b3J5IG1vZHVsZSBmb3IgYSBnaXZlbiBtb2R1bGUgbmFtZS5cbiAgICovXG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBmYWN0b3J5UGF0aFByZWZpeCE6IHN0cmluZztcblxuICAvKipcbiAgICogU3VmZml4IHRvIGFkZCB3aGVuIGNvbXB1dGluZyB0aGUgbmFtZSBvZiB0aGUgZmFjdG9yeSBtb2R1bGUgZm9yIGEgZ2l2ZW4gbW9kdWxlIG5hbWUuXG4gICAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgZmFjdG9yeVBhdGhTdWZmaXghOiBzdHJpbmc7XG59XG5cbmNvbnN0IERFRkFVTFRfQ09ORklHOiBTeXN0ZW1Kc05nTW9kdWxlTG9hZGVyQ29uZmlnID0ge1xuICBmYWN0b3J5UGF0aFByZWZpeDogJycsXG4gIGZhY3RvcnlQYXRoU3VmZml4OiAnLm5nZmFjdG9yeScsXG59O1xuXG4vKipcbiAqIE5nTW9kdWxlRmFjdG9yeUxvYWRlciB0aGF0IHVzZXMgU3lzdGVtSlMgdG8gbG9hZCBOZ01vZHVsZUZhY3RvcnlcbiAqIEBwdWJsaWNBcGlcbiAqIEBkZXByZWNhdGVkIHRoZSBgc3RyaW5nYCBmb3JtIG9mIGBsb2FkQ2hpbGRyZW5gIGlzIGRlcHJlY2F0ZWQsIGFuZCBgU3lzdGVtSnNOZ01vZHVsZUxvYWRlcmAgaXNcbiAqIHBhcnQgb2YgaXRzIGltcGxlbWVudGF0aW9uLiBTZWUgYExvYWRDaGlsZHJlbmAgZm9yIG1vcmUgZGV0YWlscy5cbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIFN5c3RlbUpzTmdNb2R1bGVMb2FkZXIgaW1wbGVtZW50cyBOZ01vZHVsZUZhY3RvcnlMb2FkZXIge1xuICBwcml2YXRlIF9jb25maWc6IFN5c3RlbUpzTmdNb2R1bGVMb2FkZXJDb25maWc7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfY29tcGlsZXI6IENvbXBpbGVyLCBAT3B0aW9uYWwoKSBjb25maWc/OiBTeXN0ZW1Kc05nTW9kdWxlTG9hZGVyQ29uZmlnKSB7XG4gICAgdGhpcy5fY29uZmlnID0gY29uZmlnIHx8IERFRkFVTFRfQ09ORklHO1xuICB9XG5cbiAgbG9hZChwYXRoOiBzdHJpbmcpOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxhbnk+PiB7XG4gICAgY29uc3QgbGVnYWN5T2ZmbGluZU1vZGUgPSAhaXZ5RW5hYmxlZCAmJiB0aGlzLl9jb21waWxlciBpbnN0YW5jZW9mIENvbXBpbGVyO1xuICAgIHJldHVybiBsZWdhY3lPZmZsaW5lTW9kZSA/IHRoaXMubG9hZEZhY3RvcnkocGF0aCkgOiB0aGlzLmxvYWRBbmRDb21waWxlKHBhdGgpO1xuICB9XG5cbiAgcHJpdmF0ZSBsb2FkQW5kQ29tcGlsZShwYXRoOiBzdHJpbmcpOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxhbnk+PiB7XG4gICAgbGV0IFttb2R1bGUsIGV4cG9ydE5hbWVdID0gcGF0aC5zcGxpdChfU0VQQVJBVE9SKTtcbiAgICBpZiAoZXhwb3J0TmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBleHBvcnROYW1lID0gJ2RlZmF1bHQnO1xuICAgIH1cblxuICAgIHJldHVybiBTeXN0ZW0uaW1wb3J0KG1vZHVsZSlcbiAgICAgICAgLnRoZW4oKG1vZHVsZTogYW55KSA9PiBtb2R1bGVbZXhwb3J0TmFtZV0pXG4gICAgICAgIC50aGVuKCh0eXBlOiBhbnkpID0+IGNoZWNrTm90RW1wdHkodHlwZSwgbW9kdWxlLCBleHBvcnROYW1lKSlcbiAgICAgICAgLnRoZW4oKHR5cGU6IGFueSkgPT4gdGhpcy5fY29tcGlsZXIuY29tcGlsZU1vZHVsZUFzeW5jKHR5cGUpKTtcbiAgfVxuXG4gIHByaXZhdGUgbG9hZEZhY3RvcnkocGF0aDogc3RyaW5nKTogUHJvbWlzZTxOZ01vZHVsZUZhY3Rvcnk8YW55Pj4ge1xuICAgIGxldCBbbW9kdWxlLCBleHBvcnROYW1lXSA9IHBhdGguc3BsaXQoX1NFUEFSQVRPUik7XG4gICAgbGV0IGZhY3RvcnlDbGFzc1N1ZmZpeCA9IEZBQ1RPUllfQ0xBU1NfU1VGRklYO1xuICAgIGlmIChleHBvcnROYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGV4cG9ydE5hbWUgPSAnZGVmYXVsdCc7XG4gICAgICBmYWN0b3J5Q2xhc3NTdWZmaXggPSAnJztcbiAgICB9XG5cbiAgICByZXR1cm4gU3lzdGVtLmltcG9ydCh0aGlzLl9jb25maWcuZmFjdG9yeVBhdGhQcmVmaXggKyBtb2R1bGUgKyB0aGlzLl9jb25maWcuZmFjdG9yeVBhdGhTdWZmaXgpXG4gICAgICAgIC50aGVuKChtb2R1bGU6IGFueSkgPT4gbW9kdWxlW2V4cG9ydE5hbWUgKyBmYWN0b3J5Q2xhc3NTdWZmaXhdKVxuICAgICAgICAudGhlbigoZmFjdG9yeTogYW55KSA9PiBjaGVja05vdEVtcHR5KGZhY3RvcnksIG1vZHVsZSwgZXhwb3J0TmFtZSkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNoZWNrTm90RW1wdHkodmFsdWU6IGFueSwgbW9kdWxlUGF0aDogc3RyaW5nLCBleHBvcnROYW1lOiBzdHJpbmcpOiBhbnkge1xuICBpZiAoIXZhbHVlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgZmluZCAnJHtleHBvcnROYW1lfScgaW4gJyR7bW9kdWxlUGF0aH0nYCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuIl19