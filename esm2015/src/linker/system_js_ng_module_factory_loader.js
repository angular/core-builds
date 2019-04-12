/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { Injectable, Optional } from '../di';
import { ivyEnabled } from '../ivy_switch';
import { Compiler } from './compiler';
import * as i0 from "../r3_symbols";
import * as i1 from "./compiler";
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
    { type: Injectable },
];
/** @nocollapse */
SystemJsNgModuleLoader.ctorParameters = () => [
    { type: Compiler },
    { type: SystemJsNgModuleLoaderConfig, decorators: [{ type: Optional }] }
];
/** @nocollapse */ SystemJsNgModuleLoader.ngInjectableDef = i0.ɵɵdefineInjectable({ token: SystemJsNgModuleLoader, factory: function SystemJsNgModuleLoader_Factory(t) { return new (t || SystemJsNgModuleLoader)(i0.ɵɵinject(i1.Compiler), i0.ɵɵinject(SystemJsNgModuleLoaderConfig, 8)); }, providedIn: null });
/*@__PURE__*/ i0.setClassMetadata(SystemJsNgModuleLoader, [{
        type: Injectable
    }], function () { return [{ type: i1.Compiler }, { type: SystemJsNgModuleLoaderConfig, decorators: [{
                type: Optional
            }] }]; }, null);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3lzdGVtX2pzX25nX21vZHVsZV9mYWN0b3J5X2xvYWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2xpbmtlci9zeXN0ZW1fanNfbmdfbW9kdWxlX2ZhY3RvcnlfbG9hZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFTQSxPQUFPLEVBQUMsVUFBVSxFQUFFLFFBQVEsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUMzQyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRXpDLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxZQUFZLENBQUM7Ozs7Ozs7Ozs7O01BSTlCLFVBQVUsR0FBRyxHQUFHOztNQUVoQixvQkFBb0IsR0FBRyxXQUFXOzs7Ozs7OztBQVN4QyxNQUFNLE9BQWdCLDRCQUE0QjtDQVlqRDs7Ozs7O0lBUEMseURBQTRCOzs7OztJQU01Qix5REFBNEI7OztNQUd4QixjQUFjLEdBQWlDO0lBQ25ELGlCQUFpQixFQUFFLEVBQUU7SUFDckIsaUJBQWlCLEVBQUUsWUFBWTtDQUNoQzs7Ozs7QUFPRCxNQUFNLE9BQU8sc0JBQXNCOzs7OztJQUdqQyxZQUFvQixTQUFtQixFQUFjLE1BQXFDO1FBQXRFLGNBQVMsR0FBVCxTQUFTLENBQVU7UUFDckMsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLElBQUksY0FBYyxDQUFDO0lBQzFDLENBQUM7Ozs7O0lBRUQsSUFBSSxDQUFDLElBQVk7O2NBQ1QsaUJBQWlCLEdBQUcsQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLFNBQVMsWUFBWSxRQUFRO1FBQzNFLE9BQU8saUJBQWlCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEYsQ0FBQzs7Ozs7O0lBRU8sY0FBYyxDQUFDLElBQVk7WUFDN0IsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUM7UUFDakQsSUFBSSxVQUFVLEtBQUssU0FBUyxFQUFFO1lBQzVCLFVBQVUsR0FBRyxTQUFTLENBQUM7U0FDeEI7UUFFRCxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO2FBQ3ZCLElBQUk7Ozs7UUFBQyxDQUFDLE1BQVcsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFDO2FBQ3pDLElBQUk7Ozs7UUFBQyxDQUFDLElBQVMsRUFBRSxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLEVBQUM7YUFDNUQsSUFBSTs7OztRQUFDLENBQUMsSUFBUyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFDLENBQUM7SUFDcEUsQ0FBQzs7Ozs7O0lBRU8sV0FBVyxDQUFDLElBQVk7WUFDMUIsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUM7O1lBQzdDLGtCQUFrQixHQUFHLG9CQUFvQjtRQUM3QyxJQUFJLFVBQVUsS0FBSyxTQUFTLEVBQUU7WUFDNUIsVUFBVSxHQUFHLFNBQVMsQ0FBQztZQUN2QixrQkFBa0IsR0FBRyxFQUFFLENBQUM7U0FDekI7UUFFRCxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsR0FBRyxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQzthQUN6RixJQUFJOzs7O1FBQUMsQ0FBQyxNQUFXLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEdBQUcsa0JBQWtCLENBQUMsRUFBQzthQUM5RCxJQUFJOzs7O1FBQUMsQ0FBQyxPQUFZLEVBQUUsRUFBRSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBQyxFQUFDLENBQUM7SUFDMUUsQ0FBQzs7O1lBcENGLFVBQVU7Ozs7WUF0Q0gsUUFBUTtZQTBDZ0QsNEJBQTRCLHVCQUFoRCxRQUFROzt3RUFIdkMsc0JBQXNCLHlFQUF0QixzQkFBc0Isd0NBRzZCLDRCQUE0QjtrQ0FIL0Usc0JBQXNCO2NBRGxDLFVBQVU7NkRBSXFELDRCQUE0QjtzQkFBaEQsUUFBUTs7Ozs7OztJQUZsRCx5Q0FBOEM7Ozs7O0lBRWxDLDJDQUEyQjs7Ozs7Ozs7QUFtQ3pDLFNBQVMsYUFBYSxDQUFDLEtBQVUsRUFBRSxVQUFrQixFQUFFLFVBQWtCO0lBQ3ZFLElBQUksQ0FBQyxLQUFLLEVBQUU7UUFDVixNQUFNLElBQUksS0FBSyxDQUFDLGdCQUFnQixVQUFVLFNBQVMsVUFBVSxHQUFHLENBQUMsQ0FBQztLQUNuRTtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuXG5pbXBvcnQge0luamVjdGFibGUsIE9wdGlvbmFsfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2l2eUVuYWJsZWR9IGZyb20gJy4uL2l2eV9zd2l0Y2gnO1xuXG5pbXBvcnQge0NvbXBpbGVyfSBmcm9tICcuL2NvbXBpbGVyJztcbmltcG9ydCB7TmdNb2R1bGVGYWN0b3J5fSBmcm9tICcuL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7TmdNb2R1bGVGYWN0b3J5TG9hZGVyfSBmcm9tICcuL25nX21vZHVsZV9mYWN0b3J5X2xvYWRlcic7XG5cbmNvbnN0IF9TRVBBUkFUT1IgPSAnIyc7XG5cbmNvbnN0IEZBQ1RPUllfQ0xBU1NfU1VGRklYID0gJ05nRmFjdG9yeSc7XG5kZWNsYXJlIHZhciBTeXN0ZW06IGFueTtcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIGZvciBTeXN0ZW1Kc05nTW9kdWxlTG9hZGVyLlxuICogdG9rZW4uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU3lzdGVtSnNOZ01vZHVsZUxvYWRlckNvbmZpZyB7XG4gIC8qKlxuICAgKiBQcmVmaXggdG8gYWRkIHdoZW4gY29tcHV0aW5nIHRoZSBuYW1lIG9mIHRoZSBmYWN0b3J5IG1vZHVsZSBmb3IgYSBnaXZlbiBtb2R1bGUgbmFtZS5cbiAgICovXG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBmYWN0b3J5UGF0aFByZWZpeCAhOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFN1ZmZpeCB0byBhZGQgd2hlbiBjb21wdXRpbmcgdGhlIG5hbWUgb2YgdGhlIGZhY3RvcnkgbW9kdWxlIGZvciBhIGdpdmVuIG1vZHVsZSBuYW1lLlxuICAgKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIGZhY3RvcnlQYXRoU3VmZml4ICE6IHN0cmluZztcbn1cblxuY29uc3QgREVGQVVMVF9DT05GSUc6IFN5c3RlbUpzTmdNb2R1bGVMb2FkZXJDb25maWcgPSB7XG4gIGZhY3RvcnlQYXRoUHJlZml4OiAnJyxcbiAgZmFjdG9yeVBhdGhTdWZmaXg6ICcubmdmYWN0b3J5Jyxcbn07XG5cbi8qKlxuICogTmdNb2R1bGVGYWN0b3J5TG9hZGVyIHRoYXQgdXNlcyBTeXN0ZW1KUyB0byBsb2FkIE5nTW9kdWxlRmFjdG9yeVxuICogQHB1YmxpY0FwaVxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgU3lzdGVtSnNOZ01vZHVsZUxvYWRlciBpbXBsZW1lbnRzIE5nTW9kdWxlRmFjdG9yeUxvYWRlciB7XG4gIHByaXZhdGUgX2NvbmZpZzogU3lzdGVtSnNOZ01vZHVsZUxvYWRlckNvbmZpZztcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9jb21waWxlcjogQ29tcGlsZXIsIEBPcHRpb25hbCgpIGNvbmZpZz86IFN5c3RlbUpzTmdNb2R1bGVMb2FkZXJDb25maWcpIHtcbiAgICB0aGlzLl9jb25maWcgPSBjb25maWcgfHwgREVGQVVMVF9DT05GSUc7XG4gIH1cblxuICBsb2FkKHBhdGg6IHN0cmluZyk6IFByb21pc2U8TmdNb2R1bGVGYWN0b3J5PGFueT4+IHtcbiAgICBjb25zdCBsZWdhY3lPZmZsaW5lTW9kZSA9ICFpdnlFbmFibGVkICYmIHRoaXMuX2NvbXBpbGVyIGluc3RhbmNlb2YgQ29tcGlsZXI7XG4gICAgcmV0dXJuIGxlZ2FjeU9mZmxpbmVNb2RlID8gdGhpcy5sb2FkRmFjdG9yeShwYXRoKSA6IHRoaXMubG9hZEFuZENvbXBpbGUocGF0aCk7XG4gIH1cblxuICBwcml2YXRlIGxvYWRBbmRDb21waWxlKHBhdGg6IHN0cmluZyk6IFByb21pc2U8TmdNb2R1bGVGYWN0b3J5PGFueT4+IHtcbiAgICBsZXQgW21vZHVsZSwgZXhwb3J0TmFtZV0gPSBwYXRoLnNwbGl0KF9TRVBBUkFUT1IpO1xuICAgIGlmIChleHBvcnROYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGV4cG9ydE5hbWUgPSAnZGVmYXVsdCc7XG4gICAgfVxuXG4gICAgcmV0dXJuIFN5c3RlbS5pbXBvcnQobW9kdWxlKVxuICAgICAgICAudGhlbigobW9kdWxlOiBhbnkpID0+IG1vZHVsZVtleHBvcnROYW1lXSlcbiAgICAgICAgLnRoZW4oKHR5cGU6IGFueSkgPT4gY2hlY2tOb3RFbXB0eSh0eXBlLCBtb2R1bGUsIGV4cG9ydE5hbWUpKVxuICAgICAgICAudGhlbigodHlwZTogYW55KSA9PiB0aGlzLl9jb21waWxlci5jb21waWxlTW9kdWxlQXN5bmModHlwZSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBsb2FkRmFjdG9yeShwYXRoOiBzdHJpbmcpOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxhbnk+PiB7XG4gICAgbGV0IFttb2R1bGUsIGV4cG9ydE5hbWVdID0gcGF0aC5zcGxpdChfU0VQQVJBVE9SKTtcbiAgICBsZXQgZmFjdG9yeUNsYXNzU3VmZml4ID0gRkFDVE9SWV9DTEFTU19TVUZGSVg7XG4gICAgaWYgKGV4cG9ydE5hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgZXhwb3J0TmFtZSA9ICdkZWZhdWx0JztcbiAgICAgIGZhY3RvcnlDbGFzc1N1ZmZpeCA9ICcnO1xuICAgIH1cblxuICAgIHJldHVybiBTeXN0ZW0uaW1wb3J0KHRoaXMuX2NvbmZpZy5mYWN0b3J5UGF0aFByZWZpeCArIG1vZHVsZSArIHRoaXMuX2NvbmZpZy5mYWN0b3J5UGF0aFN1ZmZpeClcbiAgICAgICAgLnRoZW4oKG1vZHVsZTogYW55KSA9PiBtb2R1bGVbZXhwb3J0TmFtZSArIGZhY3RvcnlDbGFzc1N1ZmZpeF0pXG4gICAgICAgIC50aGVuKChmYWN0b3J5OiBhbnkpID0+IGNoZWNrTm90RW1wdHkoZmFjdG9yeSwgbW9kdWxlLCBleHBvcnROYW1lKSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2hlY2tOb3RFbXB0eSh2YWx1ZTogYW55LCBtb2R1bGVQYXRoOiBzdHJpbmcsIGV4cG9ydE5hbWU6IHN0cmluZyk6IGFueSB7XG4gIGlmICghdmFsdWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBmaW5kICcke2V4cG9ydE5hbWV9JyBpbiAnJHttb2R1bGVQYXRofSdgKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG4iXX0=