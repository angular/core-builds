import * as tslib_1 from "tslib";
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
import * as i0 from "../r3_symbols";
import * as i1 from "./compiler";
var _SEPARATOR = '#';
var FACTORY_CLASS_SUFFIX = 'NgFactory';
/**
 * Configuration for SystemJsNgModuleLoader.
 * token.
 *
 * @publicApi
 * @deprecated the `string` form of `loadChildren` is deprecated, and `SystemJsNgModuleLoaderConfig`
 * is part of its implementation. See `LoadChildren` for more details.
 */
var SystemJsNgModuleLoaderConfig = /** @class */ (function () {
    function SystemJsNgModuleLoaderConfig() {
    }
    return SystemJsNgModuleLoaderConfig;
}());
export { SystemJsNgModuleLoaderConfig };
var DEFAULT_CONFIG = {
    factoryPathPrefix: '',
    factoryPathSuffix: '.ngfactory',
};
/**
 * NgModuleFactoryLoader that uses SystemJS to load NgModuleFactory
 * @publicApi
 * @deprecated the `string` form of `loadChildren` is deprecated, and `SystemJsNgModuleLoader` is
 * part of its implementation. See `LoadChildren` for more details.
 */
var SystemJsNgModuleLoader = /** @class */ (function () {
    function SystemJsNgModuleLoader(_compiler, config) {
        this._compiler = _compiler;
        this._config = config || DEFAULT_CONFIG;
    }
    SystemJsNgModuleLoader.prototype.load = function (path) {
        var legacyOfflineMode = !ivyEnabled && this._compiler instanceof Compiler;
        return legacyOfflineMode ? this.loadFactory(path) : this.loadAndCompile(path);
    };
    SystemJsNgModuleLoader.prototype.loadAndCompile = function (path) {
        var _this = this;
        var _a = tslib_1.__read(path.split(_SEPARATOR), 2), module = _a[0], exportName = _a[1];
        if (exportName === undefined) {
            exportName = 'default';
        }
        return System.import(module)
            .then(function (module) { return module[exportName]; })
            .then(function (type) { return checkNotEmpty(type, module, exportName); })
            .then(function (type) { return _this._compiler.compileModuleAsync(type); });
    };
    SystemJsNgModuleLoader.prototype.loadFactory = function (path) {
        var _a = tslib_1.__read(path.split(_SEPARATOR), 2), module = _a[0], exportName = _a[1];
        var factoryClassSuffix = FACTORY_CLASS_SUFFIX;
        if (exportName === undefined) {
            exportName = 'default';
            factoryClassSuffix = '';
        }
        return System.import(this._config.factoryPathPrefix + module + this._config.factoryPathSuffix)
            .then(function (module) { return module[exportName + factoryClassSuffix]; })
            .then(function (factory) { return checkNotEmpty(factory, module, exportName); });
    };
    SystemJsNgModuleLoader.ɵfac = function SystemJsNgModuleLoader_Factory(t) { return new (t || SystemJsNgModuleLoader)(i0.ɵɵinject(i1.Compiler), i0.ɵɵinject(SystemJsNgModuleLoaderConfig, 8)); };
    SystemJsNgModuleLoader.ngInjectableDef = i0.ɵɵdefineInjectable({ token: SystemJsNgModuleLoader, factory: function (t) { return SystemJsNgModuleLoader.ɵfac(t); }, providedIn: null });
    return SystemJsNgModuleLoader;
}());
export { SystemJsNgModuleLoader };
/*@__PURE__*/ i0.setClassMetadata(SystemJsNgModuleLoader, [{
        type: Injectable
    }], function () { return [{ type: i1.Compiler }, { type: SystemJsNgModuleLoaderConfig, decorators: [{
                type: Optional
            }] }]; }, null);
function checkNotEmpty(value, modulePath, exportName) {
    if (!value) {
        throw new Error("Cannot find '" + exportName + "' in '" + modulePath + "'");
    }
    return value;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3lzdGVtX2pzX25nX21vZHVsZV9mYWN0b3J5X2xvYWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2xpbmtlci9zeXN0ZW1fanNfbmdfbW9kdWxlX2ZhY3RvcnlfbG9hZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsVUFBVSxFQUFFLFFBQVEsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUMzQyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRXpDLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxZQUFZLENBQUM7OztBQUlwQyxJQUFNLFVBQVUsR0FBRyxHQUFHLENBQUM7QUFFdkIsSUFBTSxvQkFBb0IsR0FBRyxXQUFXLENBQUM7QUFHekM7Ozs7Ozs7R0FPRztBQUNIO0lBQUE7SUFZQSxDQUFDO0lBQUQsbUNBQUM7QUFBRCxDQUFDLEFBWkQsSUFZQzs7QUFFRCxJQUFNLGNBQWMsR0FBaUM7SUFDbkQsaUJBQWlCLEVBQUUsRUFBRTtJQUNyQixpQkFBaUIsRUFBRSxZQUFZO0NBQ2hDLENBQUM7QUFFRjs7Ozs7R0FLRztBQUNIO0lBSUUsZ0NBQW9CLFNBQW1CLEVBQWMsTUFBcUM7UUFBdEUsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQUNyQyxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sSUFBSSxjQUFjLENBQUM7SUFDMUMsQ0FBQztJQUVELHFDQUFJLEdBQUosVUFBSyxJQUFZO1FBQ2YsSUFBTSxpQkFBaUIsR0FBRyxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsU0FBUyxZQUFZLFFBQVEsQ0FBQztRQUM1RSxPQUFPLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2hGLENBQUM7SUFFTywrQ0FBYyxHQUF0QixVQUF1QixJQUFZO1FBQW5DLGlCQVVDO1FBVEssSUFBQSw4Q0FBNkMsRUFBNUMsY0FBTSxFQUFFLGtCQUFvQyxDQUFDO1FBQ2xELElBQUksVUFBVSxLQUFLLFNBQVMsRUFBRTtZQUM1QixVQUFVLEdBQUcsU0FBUyxDQUFDO1NBQ3hCO1FBRUQsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQzthQUN2QixJQUFJLENBQUMsVUFBQyxNQUFXLElBQUssT0FBQSxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQWxCLENBQWtCLENBQUM7YUFDekMsSUFBSSxDQUFDLFVBQUMsSUFBUyxJQUFLLE9BQUEsYUFBYSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLEVBQXZDLENBQXVDLENBQUM7YUFDNUQsSUFBSSxDQUFDLFVBQUMsSUFBUyxJQUFLLE9BQUEsS0FBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBdkMsQ0FBdUMsQ0FBQyxDQUFDO0lBQ3BFLENBQUM7SUFFTyw0Q0FBVyxHQUFuQixVQUFvQixJQUFZO1FBQzFCLElBQUEsOENBQTZDLEVBQTVDLGNBQU0sRUFBRSxrQkFBb0MsQ0FBQztRQUNsRCxJQUFJLGtCQUFrQixHQUFHLG9CQUFvQixDQUFDO1FBQzlDLElBQUksVUFBVSxLQUFLLFNBQVMsRUFBRTtZQUM1QixVQUFVLEdBQUcsU0FBUyxDQUFDO1lBQ3ZCLGtCQUFrQixHQUFHLEVBQUUsQ0FBQztTQUN6QjtRQUVELE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDO2FBQ3pGLElBQUksQ0FBQyxVQUFDLE1BQVcsSUFBSyxPQUFBLE1BQU0sQ0FBQyxVQUFVLEdBQUcsa0JBQWtCLENBQUMsRUFBdkMsQ0FBdUMsQ0FBQzthQUM5RCxJQUFJLENBQUMsVUFBQyxPQUFZLElBQUssT0FBQSxhQUFhLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUMsRUFBMUMsQ0FBMEMsQ0FBQyxDQUFDO0lBQzFFLENBQUM7Z0dBbkNVLHNCQUFzQix3Q0FHNkIsNEJBQTRCOzRFQUgvRSxzQkFBc0IsaUNBQXRCLHNCQUFzQjtpQ0F2RG5DO0NBMkZDLEFBckNELElBcUNDO1NBcENZLHNCQUFzQjtrQ0FBdEIsc0JBQXNCO2NBRGxDLFVBQVU7NkRBSXFELDRCQUE0QjtzQkFBaEQsUUFBUTs7QUFtQ3BELFNBQVMsYUFBYSxDQUFDLEtBQVUsRUFBRSxVQUFrQixFQUFFLFVBQWtCO0lBQ3ZFLElBQUksQ0FBQyxLQUFLLEVBQUU7UUFDVixNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFnQixVQUFVLGNBQVMsVUFBVSxNQUFHLENBQUMsQ0FBQztLQUNuRTtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuXG5pbXBvcnQge0luamVjdGFibGUsIE9wdGlvbmFsfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2l2eUVuYWJsZWR9IGZyb20gJy4uL2l2eV9zd2l0Y2gnO1xuXG5pbXBvcnQge0NvbXBpbGVyfSBmcm9tICcuL2NvbXBpbGVyJztcbmltcG9ydCB7TmdNb2R1bGVGYWN0b3J5fSBmcm9tICcuL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7TmdNb2R1bGVGYWN0b3J5TG9hZGVyfSBmcm9tICcuL25nX21vZHVsZV9mYWN0b3J5X2xvYWRlcic7XG5cbmNvbnN0IF9TRVBBUkFUT1IgPSAnIyc7XG5cbmNvbnN0IEZBQ1RPUllfQ0xBU1NfU1VGRklYID0gJ05nRmFjdG9yeSc7XG5kZWNsYXJlIHZhciBTeXN0ZW06IGFueTtcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIGZvciBTeXN0ZW1Kc05nTW9kdWxlTG9hZGVyLlxuICogdG9rZW4uXG4gKlxuICogQHB1YmxpY0FwaVxuICogQGRlcHJlY2F0ZWQgdGhlIGBzdHJpbmdgIGZvcm0gb2YgYGxvYWRDaGlsZHJlbmAgaXMgZGVwcmVjYXRlZCwgYW5kIGBTeXN0ZW1Kc05nTW9kdWxlTG9hZGVyQ29uZmlnYFxuICogaXMgcGFydCBvZiBpdHMgaW1wbGVtZW50YXRpb24uIFNlZSBgTG9hZENoaWxkcmVuYCBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU3lzdGVtSnNOZ01vZHVsZUxvYWRlckNvbmZpZyB7XG4gIC8qKlxuICAgKiBQcmVmaXggdG8gYWRkIHdoZW4gY29tcHV0aW5nIHRoZSBuYW1lIG9mIHRoZSBmYWN0b3J5IG1vZHVsZSBmb3IgYSBnaXZlbiBtb2R1bGUgbmFtZS5cbiAgICovXG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBmYWN0b3J5UGF0aFByZWZpeCAhOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFN1ZmZpeCB0byBhZGQgd2hlbiBjb21wdXRpbmcgdGhlIG5hbWUgb2YgdGhlIGZhY3RvcnkgbW9kdWxlIGZvciBhIGdpdmVuIG1vZHVsZSBuYW1lLlxuICAgKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIGZhY3RvcnlQYXRoU3VmZml4ICE6IHN0cmluZztcbn1cblxuY29uc3QgREVGQVVMVF9DT05GSUc6IFN5c3RlbUpzTmdNb2R1bGVMb2FkZXJDb25maWcgPSB7XG4gIGZhY3RvcnlQYXRoUHJlZml4OiAnJyxcbiAgZmFjdG9yeVBhdGhTdWZmaXg6ICcubmdmYWN0b3J5Jyxcbn07XG5cbi8qKlxuICogTmdNb2R1bGVGYWN0b3J5TG9hZGVyIHRoYXQgdXNlcyBTeXN0ZW1KUyB0byBsb2FkIE5nTW9kdWxlRmFjdG9yeVxuICogQHB1YmxpY0FwaVxuICogQGRlcHJlY2F0ZWQgdGhlIGBzdHJpbmdgIGZvcm0gb2YgYGxvYWRDaGlsZHJlbmAgaXMgZGVwcmVjYXRlZCwgYW5kIGBTeXN0ZW1Kc05nTW9kdWxlTG9hZGVyYCBpc1xuICogcGFydCBvZiBpdHMgaW1wbGVtZW50YXRpb24uIFNlZSBgTG9hZENoaWxkcmVuYCBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgU3lzdGVtSnNOZ01vZHVsZUxvYWRlciBpbXBsZW1lbnRzIE5nTW9kdWxlRmFjdG9yeUxvYWRlciB7XG4gIHByaXZhdGUgX2NvbmZpZzogU3lzdGVtSnNOZ01vZHVsZUxvYWRlckNvbmZpZztcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9jb21waWxlcjogQ29tcGlsZXIsIEBPcHRpb25hbCgpIGNvbmZpZz86IFN5c3RlbUpzTmdNb2R1bGVMb2FkZXJDb25maWcpIHtcbiAgICB0aGlzLl9jb25maWcgPSBjb25maWcgfHwgREVGQVVMVF9DT05GSUc7XG4gIH1cblxuICBsb2FkKHBhdGg6IHN0cmluZyk6IFByb21pc2U8TmdNb2R1bGVGYWN0b3J5PGFueT4+IHtcbiAgICBjb25zdCBsZWdhY3lPZmZsaW5lTW9kZSA9ICFpdnlFbmFibGVkICYmIHRoaXMuX2NvbXBpbGVyIGluc3RhbmNlb2YgQ29tcGlsZXI7XG4gICAgcmV0dXJuIGxlZ2FjeU9mZmxpbmVNb2RlID8gdGhpcy5sb2FkRmFjdG9yeShwYXRoKSA6IHRoaXMubG9hZEFuZENvbXBpbGUocGF0aCk7XG4gIH1cblxuICBwcml2YXRlIGxvYWRBbmRDb21waWxlKHBhdGg6IHN0cmluZyk6IFByb21pc2U8TmdNb2R1bGVGYWN0b3J5PGFueT4+IHtcbiAgICBsZXQgW21vZHVsZSwgZXhwb3J0TmFtZV0gPSBwYXRoLnNwbGl0KF9TRVBBUkFUT1IpO1xuICAgIGlmIChleHBvcnROYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGV4cG9ydE5hbWUgPSAnZGVmYXVsdCc7XG4gICAgfVxuXG4gICAgcmV0dXJuIFN5c3RlbS5pbXBvcnQobW9kdWxlKVxuICAgICAgICAudGhlbigobW9kdWxlOiBhbnkpID0+IG1vZHVsZVtleHBvcnROYW1lXSlcbiAgICAgICAgLnRoZW4oKHR5cGU6IGFueSkgPT4gY2hlY2tOb3RFbXB0eSh0eXBlLCBtb2R1bGUsIGV4cG9ydE5hbWUpKVxuICAgICAgICAudGhlbigodHlwZTogYW55KSA9PiB0aGlzLl9jb21waWxlci5jb21waWxlTW9kdWxlQXN5bmModHlwZSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBsb2FkRmFjdG9yeShwYXRoOiBzdHJpbmcpOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxhbnk+PiB7XG4gICAgbGV0IFttb2R1bGUsIGV4cG9ydE5hbWVdID0gcGF0aC5zcGxpdChfU0VQQVJBVE9SKTtcbiAgICBsZXQgZmFjdG9yeUNsYXNzU3VmZml4ID0gRkFDVE9SWV9DTEFTU19TVUZGSVg7XG4gICAgaWYgKGV4cG9ydE5hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgZXhwb3J0TmFtZSA9ICdkZWZhdWx0JztcbiAgICAgIGZhY3RvcnlDbGFzc1N1ZmZpeCA9ICcnO1xuICAgIH1cblxuICAgIHJldHVybiBTeXN0ZW0uaW1wb3J0KHRoaXMuX2NvbmZpZy5mYWN0b3J5UGF0aFByZWZpeCArIG1vZHVsZSArIHRoaXMuX2NvbmZpZy5mYWN0b3J5UGF0aFN1ZmZpeClcbiAgICAgICAgLnRoZW4oKG1vZHVsZTogYW55KSA9PiBtb2R1bGVbZXhwb3J0TmFtZSArIGZhY3RvcnlDbGFzc1N1ZmZpeF0pXG4gICAgICAgIC50aGVuKChmYWN0b3J5OiBhbnkpID0+IGNoZWNrTm90RW1wdHkoZmFjdG9yeSwgbW9kdWxlLCBleHBvcnROYW1lKSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2hlY2tOb3RFbXB0eSh2YWx1ZTogYW55LCBtb2R1bGVQYXRoOiBzdHJpbmcsIGV4cG9ydE5hbWU6IHN0cmluZyk6IGFueSB7XG4gIGlmICghdmFsdWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBmaW5kICcke2V4cG9ydE5hbWV9JyBpbiAnJHttb2R1bGVQYXRofSdgKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG4iXX0=