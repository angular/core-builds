/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NgModuleFactory as R3NgModuleFactory } from '../render3/ng_module_ref';
import { stringify } from '../util/stringify';
/**
 * Used to load ng module factories.
 *
 * \@publicApi
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
/**
 * Map of module-id to the corresponding NgModule.
 * - In pre Ivy we track NgModuleFactory,
 * - In post Ivy we track the NgModuleType
 * @type {?}
 */
const modules = new Map();
/**
 * Registers a loaded module. Should only be called from generated NgModuleFactory code.
 * \@publicApi
 * @param {?} id
 * @param {?} factory
 * @return {?}
 */
export function registerModuleFactory(id, factory) {
    /** @type {?} */
    const existing = (/** @type {?} */ (modules.get(id)));
    assertSameOrNotExisting(id, existing && existing.moduleType, factory.moduleType);
    modules.set(id, factory);
}
/**
 * @param {?} id
 * @param {?} type
 * @param {?} incoming
 * @return {?}
 */
function assertSameOrNotExisting(id, type, incoming) {
    if (type && type !== incoming) {
        throw new Error(`Duplicate module registered for ${id} - ${stringify(type)} vs ${stringify(type.name)}`);
    }
}
/**
 * @param {?} id
 * @param {?} ngModuleType
 * @return {?}
 */
export function registerNgModuleType(id, ngModuleType) {
    /** @type {?} */
    const existing = (/** @type {?} */ (modules.get(id)));
    assertSameOrNotExisting(id, existing, ngModuleType);
    modules.set(id, ngModuleType);
}
/**
 * @return {?}
 */
export function clearModulesForTest() {
    modules.clear();
}
/**
 * @param {?} id
 * @return {?}
 */
export function getModuleFactory__PRE_R3__(id) {
    /** @type {?} */
    const factory = (/** @type {?} */ (modules.get(id)));
    if (!factory)
        throw noModuleError(id);
    return factory;
}
/**
 * @param {?} id
 * @return {?}
 */
export function getModuleFactory__POST_R3__(id) {
    /** @type {?} */
    const type = (/** @type {?} */ (modules.get(id)));
    if (!type)
        throw noModuleError(id);
    return new R3NgModuleFactory(type);
}
/**
 * Returns the NgModuleFactory with the given id, if it exists and has been loaded.
 * Factories for modules that do not specify an `id` cannot be retrieved. Throws if the module
 * cannot be found.
 * \@publicApi
 * @type {?}
 */
export const getModuleFactory = getModuleFactory__PRE_R3__;
/**
 * @param {?} id
 * @return {?}
 */
function noModuleError(id) {
    return new Error(`No module with ID ${id} loaded`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfbW9kdWxlX2ZhY3RvcnlfbG9hZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvbGlua2VyL25nX21vZHVsZV9mYWN0b3J5X2xvYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxlQUFlLElBQUksaUJBQWlCLEVBQWUsTUFBTSwwQkFBMEIsQ0FBQztBQUM1RixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7Ozs7Ozs7QUFVNUMsTUFBTSxPQUFnQixxQkFBcUI7Q0FFMUM7Ozs7Ozs7SUFEQywyREFBMkQ7Ozs7Ozs7O01BUXZELE9BQU8sR0FBRyxJQUFJLEdBQUcsRUFBNkM7Ozs7Ozs7O0FBTXBFLE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxFQUFVLEVBQUUsT0FBNkI7O1VBQ3ZFLFFBQVEsR0FBRyxtQkFBQSxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUF3QjtJQUN4RCx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUsUUFBUSxJQUFJLFFBQVEsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ2pGLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzNCLENBQUM7Ozs7Ozs7QUFFRCxTQUFTLHVCQUF1QixDQUFDLEVBQVUsRUFBRSxJQUFxQixFQUFFLFFBQW1CO0lBQ3JGLElBQUksSUFBSSxJQUFJLElBQUksS0FBSyxRQUFRLEVBQUU7UUFDN0IsTUFBTSxJQUFJLEtBQUssQ0FDWCxtQ0FBbUMsRUFBRSxNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUM5RjtBQUNILENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxFQUFVLEVBQUUsWUFBMEI7O1VBQ25FLFFBQVEsR0FBRyxtQkFBQSxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUF1QjtJQUN2RCx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQ3BELE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQ2hDLENBQUM7Ozs7QUFFRCxNQUFNLFVBQVUsbUJBQW1CO0lBQ2pDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNsQixDQUFDOzs7OztBQUVELE1BQU0sVUFBVSwwQkFBMEIsQ0FBQyxFQUFVOztVQUM3QyxPQUFPLEdBQUcsbUJBQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBOEI7SUFDN0QsSUFBSSxDQUFDLE9BQU87UUFBRSxNQUFNLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN0QyxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDOzs7OztBQUVELE1BQU0sVUFBVSwyQkFBMkIsQ0FBQyxFQUFVOztVQUM5QyxJQUFJLEdBQUcsbUJBQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBdUI7SUFDbkQsSUFBSSxDQUFDLElBQUk7UUFBRSxNQUFNLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNuQyxPQUFPLElBQUksaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDckMsQ0FBQzs7Ozs7Ozs7QUFRRCxNQUFNLE9BQU8sZ0JBQWdCLEdBQXlDLDBCQUEwQjs7Ozs7QUFFaEcsU0FBUyxhQUFhLENBQUMsRUFBVTtJQUMvQixPQUFPLElBQUksS0FBSyxDQUFDLHFCQUFxQixFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ3JELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtOZ01vZHVsZUZhY3RvcnkgYXMgUjNOZ01vZHVsZUZhY3RvcnksIE5nTW9kdWxlVHlwZX0gZnJvbSAnLi4vcmVuZGVyMy9uZ19tb2R1bGVfcmVmJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5cbmltcG9ydCB7TmdNb2R1bGVGYWN0b3J5fSBmcm9tICcuL25nX21vZHVsZV9mYWN0b3J5JztcblxuXG4vKipcbiAqIFVzZWQgdG8gbG9hZCBuZyBtb2R1bGUgZmFjdG9yaWVzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5nTW9kdWxlRmFjdG9yeUxvYWRlciB7XG4gIGFic3RyYWN0IGxvYWQocGF0aDogc3RyaW5nKTogUHJvbWlzZTxOZ01vZHVsZUZhY3Rvcnk8YW55Pj47XG59XG5cbi8qKlxuICogTWFwIG9mIG1vZHVsZS1pZCB0byB0aGUgY29ycmVzcG9uZGluZyBOZ01vZHVsZS5cbiAqIC0gSW4gcHJlIEl2eSB3ZSB0cmFjayBOZ01vZHVsZUZhY3RvcnksXG4gKiAtIEluIHBvc3QgSXZ5IHdlIHRyYWNrIHRoZSBOZ01vZHVsZVR5cGVcbiAqL1xuY29uc3QgbW9kdWxlcyA9IG5ldyBNYXA8c3RyaW5nLCBOZ01vZHVsZUZhY3Rvcnk8YW55PnxOZ01vZHVsZVR5cGU+KCk7XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgbG9hZGVkIG1vZHVsZS4gU2hvdWxkIG9ubHkgYmUgY2FsbGVkIGZyb20gZ2VuZXJhdGVkIE5nTW9kdWxlRmFjdG9yeSBjb2RlLlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJNb2R1bGVGYWN0b3J5KGlkOiBzdHJpbmcsIGZhY3Rvcnk6IE5nTW9kdWxlRmFjdG9yeTxhbnk+KSB7XG4gIGNvbnN0IGV4aXN0aW5nID0gbW9kdWxlcy5nZXQoaWQpIGFzIE5nTW9kdWxlRmFjdG9yeTxhbnk+O1xuICBhc3NlcnRTYW1lT3JOb3RFeGlzdGluZyhpZCwgZXhpc3RpbmcgJiYgZXhpc3RpbmcubW9kdWxlVHlwZSwgZmFjdG9yeS5tb2R1bGVUeXBlKTtcbiAgbW9kdWxlcy5zZXQoaWQsIGZhY3RvcnkpO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRTYW1lT3JOb3RFeGlzdGluZyhpZDogc3RyaW5nLCB0eXBlOiBUeXBlPGFueT58IG51bGwsIGluY29taW5nOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgaWYgKHR5cGUgJiYgdHlwZSAhPT0gaW5jb21pbmcpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBEdXBsaWNhdGUgbW9kdWxlIHJlZ2lzdGVyZWQgZm9yICR7aWR9IC0gJHtzdHJpbmdpZnkodHlwZSl9IHZzICR7c3RyaW5naWZ5KHR5cGUubmFtZSl9YCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyTmdNb2R1bGVUeXBlKGlkOiBzdHJpbmcsIG5nTW9kdWxlVHlwZTogTmdNb2R1bGVUeXBlKSB7XG4gIGNvbnN0IGV4aXN0aW5nID0gbW9kdWxlcy5nZXQoaWQpIGFzIE5nTW9kdWxlVHlwZSB8IG51bGw7XG4gIGFzc2VydFNhbWVPck5vdEV4aXN0aW5nKGlkLCBleGlzdGluZywgbmdNb2R1bGVUeXBlKTtcbiAgbW9kdWxlcy5zZXQoaWQsIG5nTW9kdWxlVHlwZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbGVhck1vZHVsZXNGb3JUZXN0KCk6IHZvaWQge1xuICBtb2R1bGVzLmNsZWFyKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNb2R1bGVGYWN0b3J5X19QUkVfUjNfXyhpZDogc3RyaW5nKTogTmdNb2R1bGVGYWN0b3J5PGFueT4ge1xuICBjb25zdCBmYWN0b3J5ID0gbW9kdWxlcy5nZXQoaWQpIGFzIE5nTW9kdWxlRmFjdG9yeTxhbnk+fCBudWxsO1xuICBpZiAoIWZhY3RvcnkpIHRocm93IG5vTW9kdWxlRXJyb3IoaWQpO1xuICByZXR1cm4gZmFjdG9yeTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1vZHVsZUZhY3RvcnlfX1BPU1RfUjNfXyhpZDogc3RyaW5nKTogTmdNb2R1bGVGYWN0b3J5PGFueT4ge1xuICBjb25zdCB0eXBlID0gbW9kdWxlcy5nZXQoaWQpIGFzIE5nTW9kdWxlVHlwZSB8IG51bGw7XG4gIGlmICghdHlwZSkgdGhyb3cgbm9Nb2R1bGVFcnJvcihpZCk7XG4gIHJldHVybiBuZXcgUjNOZ01vZHVsZUZhY3RvcnkodHlwZSk7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgTmdNb2R1bGVGYWN0b3J5IHdpdGggdGhlIGdpdmVuIGlkLCBpZiBpdCBleGlzdHMgYW5kIGhhcyBiZWVuIGxvYWRlZC5cbiAqIEZhY3RvcmllcyBmb3IgbW9kdWxlcyB0aGF0IGRvIG5vdCBzcGVjaWZ5IGFuIGBpZGAgY2Fubm90IGJlIHJldHJpZXZlZC4gVGhyb3dzIGlmIHRoZSBtb2R1bGVcbiAqIGNhbm5vdCBiZSBmb3VuZC5cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IGdldE1vZHVsZUZhY3Rvcnk6IChpZDogc3RyaW5nKSA9PiBOZ01vZHVsZUZhY3Rvcnk8YW55PiA9IGdldE1vZHVsZUZhY3RvcnlfX1BSRV9SM19fO1xuXG5mdW5jdGlvbiBub01vZHVsZUVycm9yKGlkOiBzdHJpbmcsICk6IEVycm9yIHtcbiAgcmV0dXJuIG5ldyBFcnJvcihgTm8gbW9kdWxlIHdpdGggSUQgJHtpZH0gbG9hZGVkYCk7XG59XG4iXX0=