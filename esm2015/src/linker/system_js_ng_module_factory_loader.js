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
let SystemJsNgModuleLoader = /** @class */ (() => {
    class SystemJsNgModuleLoader {
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
function checkNotEmpty(value, modulePath, exportName) {
    if (!value) {
        throw new Error(`Cannot find '${exportName}' in '${modulePath}'`);
    }
    return value;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3lzdGVtX2pzX25nX21vZHVsZV9mYWN0b3J5X2xvYWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2xpbmtlci9zeXN0ZW1fanNfbmdfbW9kdWxlX2ZhY3RvcnlfbG9hZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxVQUFVLEVBQUUsUUFBUSxFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQzNDLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFekMsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUlwQyxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUM7QUFFdkIsTUFBTSxvQkFBb0IsR0FBRyxXQUFXLENBQUM7QUFHekM7Ozs7Ozs7R0FPRztBQUNILE1BQU0sT0FBZ0IsNEJBQTRCO0NBWWpEO0FBRUQsTUFBTSxjQUFjLEdBQWlDO0lBQ25ELGlCQUFpQixFQUFFLEVBQUU7SUFDckIsaUJBQWlCLEVBQUUsWUFBWTtDQUNoQyxDQUFDO0FBRUY7Ozs7O0dBS0c7QUFDSDtJQUFBLE1BQ2Esc0JBQXNCO1FBR2pDLFlBQW9CLFNBQW1CLEVBQWMsTUFBcUM7WUFBdEUsY0FBUyxHQUFULFNBQVMsQ0FBVTtZQUNyQyxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sSUFBSSxjQUFjLENBQUM7UUFDMUMsQ0FBQztRQUVELElBQUksQ0FBQyxJQUFZO1lBQ2YsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsU0FBUyxZQUFZLFFBQVEsQ0FBQztZQUM1RSxPQUFPLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hGLENBQUM7UUFFTyxjQUFjLENBQUMsSUFBWTtZQUNqQyxJQUFJLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDbEQsSUFBSSxVQUFVLEtBQUssU0FBUyxFQUFFO2dCQUM1QixVQUFVLEdBQUcsU0FBUyxDQUFDO2FBQ3hCO1lBRUQsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztpQkFDdkIsSUFBSSxDQUFDLENBQUMsTUFBVyxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7aUJBQ3pDLElBQUksQ0FBQyxDQUFDLElBQVMsRUFBRSxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7aUJBQzVELElBQUksQ0FBQyxDQUFDLElBQVMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3BFLENBQUM7UUFFTyxXQUFXLENBQUMsSUFBWTtZQUM5QixJQUFJLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDbEQsSUFBSSxrQkFBa0IsR0FBRyxvQkFBb0IsQ0FBQztZQUM5QyxJQUFJLFVBQVUsS0FBSyxTQUFTLEVBQUU7Z0JBQzVCLFVBQVUsR0FBRyxTQUFTLENBQUM7Z0JBQ3ZCLGtCQUFrQixHQUFHLEVBQUUsQ0FBQzthQUN6QjtZQUVELE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDO2lCQUN6RixJQUFJLENBQUMsQ0FBQyxNQUFXLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEdBQUcsa0JBQWtCLENBQUMsQ0FBQztpQkFDOUQsSUFBSSxDQUFDLENBQUMsT0FBWSxFQUFFLEVBQUUsQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQzFFLENBQUM7OztnQkFwQ0YsVUFBVTs7OztnQkExQ0gsUUFBUTtnQkE4Q2dELDRCQUE0Qix1QkFBaEQsUUFBUTs7SUFpQ3BELDZCQUFDO0tBQUE7U0FwQ1ksc0JBQXNCO0FBc0NuQyxTQUFTLGFBQWEsQ0FBQyxLQUFVLEVBQUUsVUFBa0IsRUFBRSxVQUFrQjtJQUN2RSxJQUFJLENBQUMsS0FBSyxFQUFFO1FBQ1YsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsVUFBVSxTQUFTLFVBQVUsR0FBRyxDQUFDLENBQUM7S0FDbkU7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuXG5pbXBvcnQge0luamVjdGFibGUsIE9wdGlvbmFsfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2l2eUVuYWJsZWR9IGZyb20gJy4uL2l2eV9zd2l0Y2gnO1xuXG5pbXBvcnQge0NvbXBpbGVyfSBmcm9tICcuL2NvbXBpbGVyJztcbmltcG9ydCB7TmdNb2R1bGVGYWN0b3J5fSBmcm9tICcuL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7TmdNb2R1bGVGYWN0b3J5TG9hZGVyfSBmcm9tICcuL25nX21vZHVsZV9mYWN0b3J5X2xvYWRlcic7XG5cbmNvbnN0IF9TRVBBUkFUT1IgPSAnIyc7XG5cbmNvbnN0IEZBQ1RPUllfQ0xBU1NfU1VGRklYID0gJ05nRmFjdG9yeSc7XG5kZWNsYXJlIHZhciBTeXN0ZW06IGFueTtcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIGZvciBTeXN0ZW1Kc05nTW9kdWxlTG9hZGVyLlxuICogdG9rZW4uXG4gKlxuICogQHB1YmxpY0FwaVxuICogQGRlcHJlY2F0ZWQgdGhlIGBzdHJpbmdgIGZvcm0gb2YgYGxvYWRDaGlsZHJlbmAgaXMgZGVwcmVjYXRlZCwgYW5kIGBTeXN0ZW1Kc05nTW9kdWxlTG9hZGVyQ29uZmlnYFxuICogaXMgcGFydCBvZiBpdHMgaW1wbGVtZW50YXRpb24uIFNlZSBgTG9hZENoaWxkcmVuYCBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU3lzdGVtSnNOZ01vZHVsZUxvYWRlckNvbmZpZyB7XG4gIC8qKlxuICAgKiBQcmVmaXggdG8gYWRkIHdoZW4gY29tcHV0aW5nIHRoZSBuYW1lIG9mIHRoZSBmYWN0b3J5IG1vZHVsZSBmb3IgYSBnaXZlbiBtb2R1bGUgbmFtZS5cbiAgICovXG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBmYWN0b3J5UGF0aFByZWZpeCE6IHN0cmluZztcblxuICAvKipcbiAgICogU3VmZml4IHRvIGFkZCB3aGVuIGNvbXB1dGluZyB0aGUgbmFtZSBvZiB0aGUgZmFjdG9yeSBtb2R1bGUgZm9yIGEgZ2l2ZW4gbW9kdWxlIG5hbWUuXG4gICAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgZmFjdG9yeVBhdGhTdWZmaXghOiBzdHJpbmc7XG59XG5cbmNvbnN0IERFRkFVTFRfQ09ORklHOiBTeXN0ZW1Kc05nTW9kdWxlTG9hZGVyQ29uZmlnID0ge1xuICBmYWN0b3J5UGF0aFByZWZpeDogJycsXG4gIGZhY3RvcnlQYXRoU3VmZml4OiAnLm5nZmFjdG9yeScsXG59O1xuXG4vKipcbiAqIE5nTW9kdWxlRmFjdG9yeUxvYWRlciB0aGF0IHVzZXMgU3lzdGVtSlMgdG8gbG9hZCBOZ01vZHVsZUZhY3RvcnlcbiAqIEBwdWJsaWNBcGlcbiAqIEBkZXByZWNhdGVkIHRoZSBgc3RyaW5nYCBmb3JtIG9mIGBsb2FkQ2hpbGRyZW5gIGlzIGRlcHJlY2F0ZWQsIGFuZCBgU3lzdGVtSnNOZ01vZHVsZUxvYWRlcmAgaXNcbiAqIHBhcnQgb2YgaXRzIGltcGxlbWVudGF0aW9uLiBTZWUgYExvYWRDaGlsZHJlbmAgZm9yIG1vcmUgZGV0YWlscy5cbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIFN5c3RlbUpzTmdNb2R1bGVMb2FkZXIgaW1wbGVtZW50cyBOZ01vZHVsZUZhY3RvcnlMb2FkZXIge1xuICBwcml2YXRlIF9jb25maWc6IFN5c3RlbUpzTmdNb2R1bGVMb2FkZXJDb25maWc7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfY29tcGlsZXI6IENvbXBpbGVyLCBAT3B0aW9uYWwoKSBjb25maWc/OiBTeXN0ZW1Kc05nTW9kdWxlTG9hZGVyQ29uZmlnKSB7XG4gICAgdGhpcy5fY29uZmlnID0gY29uZmlnIHx8IERFRkFVTFRfQ09ORklHO1xuICB9XG5cbiAgbG9hZChwYXRoOiBzdHJpbmcpOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxhbnk+PiB7XG4gICAgY29uc3QgbGVnYWN5T2ZmbGluZU1vZGUgPSAhaXZ5RW5hYmxlZCAmJiB0aGlzLl9jb21waWxlciBpbnN0YW5jZW9mIENvbXBpbGVyO1xuICAgIHJldHVybiBsZWdhY3lPZmZsaW5lTW9kZSA/IHRoaXMubG9hZEZhY3RvcnkocGF0aCkgOiB0aGlzLmxvYWRBbmRDb21waWxlKHBhdGgpO1xuICB9XG5cbiAgcHJpdmF0ZSBsb2FkQW5kQ29tcGlsZShwYXRoOiBzdHJpbmcpOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxhbnk+PiB7XG4gICAgbGV0IFttb2R1bGUsIGV4cG9ydE5hbWVdID0gcGF0aC5zcGxpdChfU0VQQVJBVE9SKTtcbiAgICBpZiAoZXhwb3J0TmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBleHBvcnROYW1lID0gJ2RlZmF1bHQnO1xuICAgIH1cblxuICAgIHJldHVybiBTeXN0ZW0uaW1wb3J0KG1vZHVsZSlcbiAgICAgICAgLnRoZW4oKG1vZHVsZTogYW55KSA9PiBtb2R1bGVbZXhwb3J0TmFtZV0pXG4gICAgICAgIC50aGVuKCh0eXBlOiBhbnkpID0+IGNoZWNrTm90RW1wdHkodHlwZSwgbW9kdWxlLCBleHBvcnROYW1lKSlcbiAgICAgICAgLnRoZW4oKHR5cGU6IGFueSkgPT4gdGhpcy5fY29tcGlsZXIuY29tcGlsZU1vZHVsZUFzeW5jKHR5cGUpKTtcbiAgfVxuXG4gIHByaXZhdGUgbG9hZEZhY3RvcnkocGF0aDogc3RyaW5nKTogUHJvbWlzZTxOZ01vZHVsZUZhY3Rvcnk8YW55Pj4ge1xuICAgIGxldCBbbW9kdWxlLCBleHBvcnROYW1lXSA9IHBhdGguc3BsaXQoX1NFUEFSQVRPUik7XG4gICAgbGV0IGZhY3RvcnlDbGFzc1N1ZmZpeCA9IEZBQ1RPUllfQ0xBU1NfU1VGRklYO1xuICAgIGlmIChleHBvcnROYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGV4cG9ydE5hbWUgPSAnZGVmYXVsdCc7XG4gICAgICBmYWN0b3J5Q2xhc3NTdWZmaXggPSAnJztcbiAgICB9XG5cbiAgICByZXR1cm4gU3lzdGVtLmltcG9ydCh0aGlzLl9jb25maWcuZmFjdG9yeVBhdGhQcmVmaXggKyBtb2R1bGUgKyB0aGlzLl9jb25maWcuZmFjdG9yeVBhdGhTdWZmaXgpXG4gICAgICAgIC50aGVuKChtb2R1bGU6IGFueSkgPT4gbW9kdWxlW2V4cG9ydE5hbWUgKyBmYWN0b3J5Q2xhc3NTdWZmaXhdKVxuICAgICAgICAudGhlbigoZmFjdG9yeTogYW55KSA9PiBjaGVja05vdEVtcHR5KGZhY3RvcnksIG1vZHVsZSwgZXhwb3J0TmFtZSkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNoZWNrTm90RW1wdHkodmFsdWU6IGFueSwgbW9kdWxlUGF0aDogc3RyaW5nLCBleHBvcnROYW1lOiBzdHJpbmcpOiBhbnkge1xuICBpZiAoIXZhbHVlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgZmluZCAnJHtleHBvcnROYW1lfScgaW4gJyR7bW9kdWxlUGF0aH0nYCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuIl19