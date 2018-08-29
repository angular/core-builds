/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Used to load ng module factories.
 *
 * @abstract
 */
export class NgModuleFactoryLoader {
}
if (false) {
    /**
     * @abstract
     * @param {?} path
     * @return {?}
     */
    NgModuleFactoryLoader.prototype.load = function (path) { };
}
/** @type {?} */
let moduleFactories = new Map();
/**
 * Registers a loaded module. Should only be called from generated NgModuleFactory code.
 * \@experimental
 * @param {?} id
 * @param {?} factory
 * @return {?}
 */
export function registerModuleFactory(id, factory) {
    /** @type {?} */
    const existing = moduleFactories.get(id);
    if (existing) {
        throw new Error(`Duplicate module registered for ${id} - ${existing.moduleType.name} vs ${factory.moduleType.name}`);
    }
    moduleFactories.set(id, factory);
}
/**
 * @return {?}
 */
export function clearModulesForTest() {
    moduleFactories = new Map();
}
/**
 * Returns the NgModuleFactory with the given id, if it exists and has been loaded.
 * Factories for modules that do not specify an `id` cannot be retrieved. Throws if the module
 * cannot be found.
 * \@experimental
 * @param {?} id
 * @return {?}
 */
export function getModuleFactory(id) {
    /** @type {?} */
    const factory = moduleFactories.get(id);
    if (!factory)
        throw new Error(`No module with ID ${id} loaded`);
    return factory;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfbW9kdWxlX2ZhY3RvcnlfbG9hZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvbGlua2VyL25nX21vZHVsZV9mYWN0b3J5X2xvYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBY0EsTUFBTSxPQUFnQixxQkFBcUI7Q0FFMUM7Ozs7Ozs7Ozs7QUFFRCxJQUFJLGVBQWUsR0FBRyxJQUFJLEdBQUcsRUFBZ0MsQ0FBQzs7Ozs7Ozs7QUFNOUQsTUFBTSxVQUFVLHFCQUFxQixDQUFDLEVBQVUsRUFBRSxPQUE2Qjs7SUFDN0UsTUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN6QyxJQUFJLFFBQVEsRUFBRTtRQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsbUNBQW1DLEVBQ25DLE1BQU0sUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLE9BQU8sT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0tBQ2pGO0lBQ0QsZUFBZSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7Q0FDbEM7Ozs7QUFFRCxNQUFNLFVBQVUsbUJBQW1CO0lBQ2pDLGVBQWUsR0FBRyxJQUFJLEdBQUcsRUFBZ0MsQ0FBQztDQUMzRDs7Ozs7Ozs7O0FBUUQsTUFBTSxVQUFVLGdCQUFnQixDQUFDLEVBQVU7O0lBQ3pDLE1BQU0sT0FBTyxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDeEMsSUFBSSxDQUFDLE9BQU87UUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHFCQUFxQixFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ2hFLE9BQU8sT0FBTyxDQUFDO0NBQ2hCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge05nTW9kdWxlRmFjdG9yeX0gZnJvbSAnLi9uZ19tb2R1bGVfZmFjdG9yeSc7XG5cbi8qKlxuICogVXNlZCB0byBsb2FkIG5nIG1vZHVsZSBmYWN0b3JpZXMuXG4gKlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTmdNb2R1bGVGYWN0b3J5TG9hZGVyIHtcbiAgYWJzdHJhY3QgbG9hZChwYXRoOiBzdHJpbmcpOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxhbnk+Pjtcbn1cblxubGV0IG1vZHVsZUZhY3RvcmllcyA9IG5ldyBNYXA8c3RyaW5nLCBOZ01vZHVsZUZhY3Rvcnk8YW55Pj4oKTtcblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBsb2FkZWQgbW9kdWxlLiBTaG91bGQgb25seSBiZSBjYWxsZWQgZnJvbSBnZW5lcmF0ZWQgTmdNb2R1bGVGYWN0b3J5IGNvZGUuXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3Rlck1vZHVsZUZhY3RvcnkoaWQ6IHN0cmluZywgZmFjdG9yeTogTmdNb2R1bGVGYWN0b3J5PGFueT4pIHtcbiAgY29uc3QgZXhpc3RpbmcgPSBtb2R1bGVGYWN0b3JpZXMuZ2V0KGlkKTtcbiAgaWYgKGV4aXN0aW5nKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBEdXBsaWNhdGUgbW9kdWxlIHJlZ2lzdGVyZWQgZm9yICR7aWRcbiAgICAgICAgICAgICAgICAgICAgfSAtICR7ZXhpc3RpbmcubW9kdWxlVHlwZS5uYW1lfSB2cyAke2ZhY3RvcnkubW9kdWxlVHlwZS5uYW1lfWApO1xuICB9XG4gIG1vZHVsZUZhY3Rvcmllcy5zZXQoaWQsIGZhY3RvcnkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2xlYXJNb2R1bGVzRm9yVGVzdCgpIHtcbiAgbW9kdWxlRmFjdG9yaWVzID0gbmV3IE1hcDxzdHJpbmcsIE5nTW9kdWxlRmFjdG9yeTxhbnk+PigpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIE5nTW9kdWxlRmFjdG9yeSB3aXRoIHRoZSBnaXZlbiBpZCwgaWYgaXQgZXhpc3RzIGFuZCBoYXMgYmVlbiBsb2FkZWQuXG4gKiBGYWN0b3JpZXMgZm9yIG1vZHVsZXMgdGhhdCBkbyBub3Qgc3BlY2lmeSBhbiBgaWRgIGNhbm5vdCBiZSByZXRyaWV2ZWQuIFRocm93cyBpZiB0aGUgbW9kdWxlXG4gKiBjYW5ub3QgYmUgZm91bmQuXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRNb2R1bGVGYWN0b3J5KGlkOiBzdHJpbmcpOiBOZ01vZHVsZUZhY3Rvcnk8YW55PiB7XG4gIGNvbnN0IGZhY3RvcnkgPSBtb2R1bGVGYWN0b3JpZXMuZ2V0KGlkKTtcbiAgaWYgKCFmYWN0b3J5KSB0aHJvdyBuZXcgRXJyb3IoYE5vIG1vZHVsZSB3aXRoIElEICR7aWR9IGxvYWRlZGApO1xuICByZXR1cm4gZmFjdG9yeTtcbn1cbiJdfQ==