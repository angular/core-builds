/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable, Optional } from '../di';
import { ivyEnabled } from '../ivy_switch';
import { Compiler } from './compiler';
import * as i0 from "../r3_symbols";
import * as i1 from "./compiler";
const _SEPARATOR = '#';
const FACTORY_CLASS_SUFFIX = 'NgFactory';
/**
 * Configuration for SystemJsNgModuleLoader.
 * token.
 *
 * @publicApi
 * @deprecated the `string` form of `loadChildren` is deprecated, and `SystemJsNgModuleLoaderConfig`
 * is part of its implementation. See `LoadChildren` for more details.
 */
export class SystemJsNgModuleLoaderConfig {
}
const DEFAULT_CONFIG = {
    factoryPathPrefix: '',
    factoryPathSuffix: '.ngfactory',
};
/**
 * NgModuleFactoryLoader that uses SystemJS to load NgModuleFactory
 * @publicApi
 * @deprecated the `string` form of `loadChildren` is deprecated, and `SystemJsNgModuleLoader` is
 * part of its implementation. See `LoadChildren` for more details.
 */
export class SystemJsNgModuleLoader {
    constructor(_compiler, config) {
        this._compiler = _compiler;
        this._config = config || DEFAULT_CONFIG;
    }
    load(path) {
        const legacyOfflineMode = !ivyEnabled && this._compiler instanceof Compiler;
        return legacyOfflineMode ? this.loadFactory(path) : this.loadAndCompile(path);
    }
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
    loadFactory(path) {
        let [module, exportName] = path.split(_SEPARATOR);
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
SystemJsNgModuleLoader.ɵfac = function SystemJsNgModuleLoader_Factory(t) { return new (t || SystemJsNgModuleLoader)(i0.ɵɵinject(i1.Compiler), i0.ɵɵinject(SystemJsNgModuleLoaderConfig, 8)); };
SystemJsNgModuleLoader.ɵprov = i0.ɵɵdefineInjectable({ token: SystemJsNgModuleLoader, factory: SystemJsNgModuleLoader.ɵfac });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.setClassMetadata(SystemJsNgModuleLoader, [{
        type: Injectable
    }], function () { return [{ type: i1.Compiler }, { type: SystemJsNgModuleLoaderConfig, decorators: [{
                type: Optional
            }] }]; }, null); })();
function checkNotEmpty(value, modulePath, exportName) {
    if (!value) {
        throw new Error(`Cannot find '${exportName}' in '${modulePath}'`);
    }
    return value;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3lzdGVtX2pzX25nX21vZHVsZV9mYWN0b3J5X2xvYWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2xpbmtlci9zeXN0ZW1fanNfbmdfbW9kdWxlX2ZhY3RvcnlfbG9hZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxVQUFVLEVBQUUsUUFBUSxFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQzNDLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFekMsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLFlBQVksQ0FBQzs7O0FBSXBDLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQztBQUV2QixNQUFNLG9CQUFvQixHQUFHLFdBQVcsQ0FBQztBQUd6Qzs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxPQUFnQiw0QkFBNEI7Q0FZakQ7QUFFRCxNQUFNLGNBQWMsR0FBaUM7SUFDbkQsaUJBQWlCLEVBQUUsRUFBRTtJQUNyQixpQkFBaUIsRUFBRSxZQUFZO0NBQ2hDLENBQUM7QUFFRjs7Ozs7R0FLRztBQUVILE1BQU0sT0FBTyxzQkFBc0I7SUFHakMsWUFBb0IsU0FBbUIsRUFBYyxNQUFxQztRQUF0RSxjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQ3JDLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxJQUFJLGNBQWMsQ0FBQztJQUMxQyxDQUFDO0lBRUQsSUFBSSxDQUFDLElBQVk7UUFDZixNQUFNLGlCQUFpQixHQUFHLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxTQUFTLFlBQVksUUFBUSxDQUFDO1FBQzVFLE9BQU8saUJBQWlCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEYsQ0FBQztJQUVPLGNBQWMsQ0FBQyxJQUFZO1FBQ2pDLElBQUksQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNsRCxJQUFJLFVBQVUsS0FBSyxTQUFTLEVBQUU7WUFDNUIsVUFBVSxHQUFHLFNBQVMsQ0FBQztTQUN4QjtRQUVELE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7YUFDdkIsSUFBSSxDQUFDLENBQUMsTUFBVyxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDekMsSUFBSSxDQUFDLENBQUMsSUFBUyxFQUFFLEVBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQzthQUM1RCxJQUFJLENBQUMsQ0FBQyxJQUFTLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNwRSxDQUFDO0lBRU8sV0FBVyxDQUFDLElBQVk7UUFDOUIsSUFBSSxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2xELElBQUksa0JBQWtCLEdBQUcsb0JBQW9CLENBQUM7UUFDOUMsSUFBSSxVQUFVLEtBQUssU0FBUyxFQUFFO1lBQzVCLFVBQVUsR0FBRyxTQUFTLENBQUM7WUFDdkIsa0JBQWtCLEdBQUcsRUFBRSxDQUFDO1NBQ3pCO1FBRUQsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUM7YUFDekYsSUFBSSxDQUFDLENBQUMsTUFBVyxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUFHLGtCQUFrQixDQUFDLENBQUM7YUFDOUQsSUFBSSxDQUFDLENBQUMsT0FBWSxFQUFFLEVBQUUsQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQzFFLENBQUM7OzRGQW5DVSxzQkFBc0Isd0NBRzZCLDRCQUE0Qjs4REFIL0Usc0JBQXNCLFdBQXRCLHNCQUFzQjtzRkFBdEIsc0JBQXNCO2NBRGxDLFVBQVU7NkRBSXFELDRCQUE0QjtzQkFBaEQsUUFBUTs7QUFtQ3BELFNBQVMsYUFBYSxDQUFDLEtBQVUsRUFBRSxVQUFrQixFQUFFLFVBQWtCO0lBQ3ZFLElBQUksQ0FBQyxLQUFLLEVBQUU7UUFDVixNQUFNLElBQUksS0FBSyxDQUFDLGdCQUFnQixVQUFVLFNBQVMsVUFBVSxHQUFHLENBQUMsQ0FBQztLQUNuRTtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5cbmltcG9ydCB7SW5qZWN0YWJsZSwgT3B0aW9uYWx9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7aXZ5RW5hYmxlZH0gZnJvbSAnLi4vaXZ5X3N3aXRjaCc7XG5cbmltcG9ydCB7Q29tcGlsZXJ9IGZyb20gJy4vY29tcGlsZXInO1xuaW1wb3J0IHtOZ01vZHVsZUZhY3Rvcnl9IGZyb20gJy4vbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtOZ01vZHVsZUZhY3RvcnlMb2FkZXJ9IGZyb20gJy4vbmdfbW9kdWxlX2ZhY3RvcnlfbG9hZGVyJztcblxuY29uc3QgX1NFUEFSQVRPUiA9ICcjJztcblxuY29uc3QgRkFDVE9SWV9DTEFTU19TVUZGSVggPSAnTmdGYWN0b3J5JztcbmRlY2xhcmUgdmFyIFN5c3RlbTogYW55O1xuXG4vKipcbiAqIENvbmZpZ3VyYXRpb24gZm9yIFN5c3RlbUpzTmdNb2R1bGVMb2FkZXIuXG4gKiB0b2tlbi5cbiAqXG4gKiBAcHVibGljQXBpXG4gKiBAZGVwcmVjYXRlZCB0aGUgYHN0cmluZ2AgZm9ybSBvZiBgbG9hZENoaWxkcmVuYCBpcyBkZXByZWNhdGVkLCBhbmQgYFN5c3RlbUpzTmdNb2R1bGVMb2FkZXJDb25maWdgXG4gKiBpcyBwYXJ0IG9mIGl0cyBpbXBsZW1lbnRhdGlvbi4gU2VlIGBMb2FkQ2hpbGRyZW5gIGZvciBtb3JlIGRldGFpbHMuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTeXN0ZW1Kc05nTW9kdWxlTG9hZGVyQ29uZmlnIHtcbiAgLyoqXG4gICAqIFByZWZpeCB0byBhZGQgd2hlbiBjb21wdXRpbmcgdGhlIG5hbWUgb2YgdGhlIGZhY3RvcnkgbW9kdWxlIGZvciBhIGdpdmVuIG1vZHVsZSBuYW1lLlxuICAgKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIGZhY3RvcnlQYXRoUHJlZml4ITogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBTdWZmaXggdG8gYWRkIHdoZW4gY29tcHV0aW5nIHRoZSBuYW1lIG9mIHRoZSBmYWN0b3J5IG1vZHVsZSBmb3IgYSBnaXZlbiBtb2R1bGUgbmFtZS5cbiAgICovXG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBmYWN0b3J5UGF0aFN1ZmZpeCE6IHN0cmluZztcbn1cblxuY29uc3QgREVGQVVMVF9DT05GSUc6IFN5c3RlbUpzTmdNb2R1bGVMb2FkZXJDb25maWcgPSB7XG4gIGZhY3RvcnlQYXRoUHJlZml4OiAnJyxcbiAgZmFjdG9yeVBhdGhTdWZmaXg6ICcubmdmYWN0b3J5Jyxcbn07XG5cbi8qKlxuICogTmdNb2R1bGVGYWN0b3J5TG9hZGVyIHRoYXQgdXNlcyBTeXN0ZW1KUyB0byBsb2FkIE5nTW9kdWxlRmFjdG9yeVxuICogQHB1YmxpY0FwaVxuICogQGRlcHJlY2F0ZWQgdGhlIGBzdHJpbmdgIGZvcm0gb2YgYGxvYWRDaGlsZHJlbmAgaXMgZGVwcmVjYXRlZCwgYW5kIGBTeXN0ZW1Kc05nTW9kdWxlTG9hZGVyYCBpc1xuICogcGFydCBvZiBpdHMgaW1wbGVtZW50YXRpb24uIFNlZSBgTG9hZENoaWxkcmVuYCBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgU3lzdGVtSnNOZ01vZHVsZUxvYWRlciBpbXBsZW1lbnRzIE5nTW9kdWxlRmFjdG9yeUxvYWRlciB7XG4gIHByaXZhdGUgX2NvbmZpZzogU3lzdGVtSnNOZ01vZHVsZUxvYWRlckNvbmZpZztcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9jb21waWxlcjogQ29tcGlsZXIsIEBPcHRpb25hbCgpIGNvbmZpZz86IFN5c3RlbUpzTmdNb2R1bGVMb2FkZXJDb25maWcpIHtcbiAgICB0aGlzLl9jb25maWcgPSBjb25maWcgfHwgREVGQVVMVF9DT05GSUc7XG4gIH1cblxuICBsb2FkKHBhdGg6IHN0cmluZyk6IFByb21pc2U8TmdNb2R1bGVGYWN0b3J5PGFueT4+IHtcbiAgICBjb25zdCBsZWdhY3lPZmZsaW5lTW9kZSA9ICFpdnlFbmFibGVkICYmIHRoaXMuX2NvbXBpbGVyIGluc3RhbmNlb2YgQ29tcGlsZXI7XG4gICAgcmV0dXJuIGxlZ2FjeU9mZmxpbmVNb2RlID8gdGhpcy5sb2FkRmFjdG9yeShwYXRoKSA6IHRoaXMubG9hZEFuZENvbXBpbGUocGF0aCk7XG4gIH1cblxuICBwcml2YXRlIGxvYWRBbmRDb21waWxlKHBhdGg6IHN0cmluZyk6IFByb21pc2U8TmdNb2R1bGVGYWN0b3J5PGFueT4+IHtcbiAgICBsZXQgW21vZHVsZSwgZXhwb3J0TmFtZV0gPSBwYXRoLnNwbGl0KF9TRVBBUkFUT1IpO1xuICAgIGlmIChleHBvcnROYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGV4cG9ydE5hbWUgPSAnZGVmYXVsdCc7XG4gICAgfVxuXG4gICAgcmV0dXJuIFN5c3RlbS5pbXBvcnQobW9kdWxlKVxuICAgICAgICAudGhlbigobW9kdWxlOiBhbnkpID0+IG1vZHVsZVtleHBvcnROYW1lXSlcbiAgICAgICAgLnRoZW4oKHR5cGU6IGFueSkgPT4gY2hlY2tOb3RFbXB0eSh0eXBlLCBtb2R1bGUsIGV4cG9ydE5hbWUpKVxuICAgICAgICAudGhlbigodHlwZTogYW55KSA9PiB0aGlzLl9jb21waWxlci5jb21waWxlTW9kdWxlQXN5bmModHlwZSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBsb2FkRmFjdG9yeShwYXRoOiBzdHJpbmcpOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxhbnk+PiB7XG4gICAgbGV0IFttb2R1bGUsIGV4cG9ydE5hbWVdID0gcGF0aC5zcGxpdChfU0VQQVJBVE9SKTtcbiAgICBsZXQgZmFjdG9yeUNsYXNzU3VmZml4ID0gRkFDVE9SWV9DTEFTU19TVUZGSVg7XG4gICAgaWYgKGV4cG9ydE5hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgZXhwb3J0TmFtZSA9ICdkZWZhdWx0JztcbiAgICAgIGZhY3RvcnlDbGFzc1N1ZmZpeCA9ICcnO1xuICAgIH1cblxuICAgIHJldHVybiBTeXN0ZW0uaW1wb3J0KHRoaXMuX2NvbmZpZy5mYWN0b3J5UGF0aFByZWZpeCArIG1vZHVsZSArIHRoaXMuX2NvbmZpZy5mYWN0b3J5UGF0aFN1ZmZpeClcbiAgICAgICAgLnRoZW4oKG1vZHVsZTogYW55KSA9PiBtb2R1bGVbZXhwb3J0TmFtZSArIGZhY3RvcnlDbGFzc1N1ZmZpeF0pXG4gICAgICAgIC50aGVuKChmYWN0b3J5OiBhbnkpID0+IGNoZWNrTm90RW1wdHkoZmFjdG9yeSwgbW9kdWxlLCBleHBvcnROYW1lKSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2hlY2tOb3RFbXB0eSh2YWx1ZTogYW55LCBtb2R1bGVQYXRoOiBzdHJpbmcsIGV4cG9ydE5hbWU6IHN0cmluZyk6IGFueSB7XG4gIGlmICghdmFsdWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBmaW5kICcke2V4cG9ydE5hbWV9JyBpbiAnJHttb2R1bGVQYXRofSdgKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG4iXX0=