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
    assertNotExisting(id, existing && existing.moduleType);
    modules.set(id, factory);
}
/**
 * @param {?} id
 * @param {?} type
 * @return {?}
 */
function assertNotExisting(id, type) {
    if (type) {
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
    assertNotExisting(id, existing);
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
export const getModuleFactory = getModuleFactory__POST_R3__;
/**
 * @param {?} id
 * @return {?}
 */
function noModuleError(id) {
    return new Error(`No module with ID ${id} loaded`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfbW9kdWxlX2ZhY3RvcnlfbG9hZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvbGlua2VyL25nX21vZHVsZV9mYWN0b3J5X2xvYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxlQUFlLElBQUksaUJBQWlCLEVBQWUsTUFBTSwwQkFBMEIsQ0FBQztBQUM1RixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7Ozs7Ozs7QUFVNUMsTUFBTSxPQUFnQixxQkFBcUI7Q0FFMUM7Ozs7Ozs7SUFEQywyREFBMkQ7Ozs7Ozs7O01BUXZELE9BQU8sR0FBRyxJQUFJLEdBQUcsRUFBNkM7Ozs7Ozs7O0FBTXBFLE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxFQUFVLEVBQUUsT0FBNkI7O1VBQ3ZFLFFBQVEsR0FBRyxtQkFBQSxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUF3QjtJQUN4RCxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsUUFBUSxJQUFJLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUN2RCxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUMzQixDQUFDOzs7Ozs7QUFFRCxTQUFTLGlCQUFpQixDQUFDLEVBQVUsRUFBRSxJQUFxQjtJQUMxRCxJQUFJLElBQUksRUFBRTtRQUNSLE1BQU0sSUFBSSxLQUFLLENBQ1gsbUNBQW1DLEVBQUUsTUFBTSxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7S0FDOUY7QUFDSCxDQUFDOzs7Ozs7QUFFRCxNQUFNLFVBQVUsb0JBQW9CLENBQUMsRUFBVSxFQUFFLFlBQTBCOztVQUNuRSxRQUFRLEdBQUcsbUJBQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBdUI7SUFDdkQsaUJBQWlCLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ2hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQ2hDLENBQUM7Ozs7QUFFRCxNQUFNLFVBQVUsbUJBQW1CO0lBQ2pDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNsQixDQUFDOzs7OztBQUVELE1BQU0sVUFBVSwwQkFBMEIsQ0FBQyxFQUFVOztVQUM3QyxPQUFPLEdBQUcsbUJBQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBOEI7SUFDN0QsSUFBSSxDQUFDLE9BQU87UUFBRSxNQUFNLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN0QyxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDOzs7OztBQUVELE1BQU0sVUFBVSwyQkFBMkIsQ0FBQyxFQUFVOztVQUM5QyxJQUFJLEdBQUcsbUJBQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBdUI7SUFDbkQsSUFBSSxDQUFDLElBQUk7UUFBRSxNQUFNLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNuQyxPQUFPLElBQUksaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDckMsQ0FBQzs7Ozs7Ozs7QUFRRCxNQUFNLE9BQU8sZ0JBQWdCLEdBWmIsMkJBWWdGOzs7OztBQUVoRyxTQUFTLGFBQWEsQ0FBQyxFQUFVO0lBQy9CLE9BQU8sSUFBSSxLQUFLLENBQUMscUJBQXFCLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDckQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge05nTW9kdWxlRmFjdG9yeSBhcyBSM05nTW9kdWxlRmFjdG9yeSwgTmdNb2R1bGVUeXBlfSBmcm9tICcuLi9yZW5kZXIzL25nX21vZHVsZV9yZWYnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvc3RyaW5naWZ5JztcblxuaW1wb3J0IHtOZ01vZHVsZUZhY3Rvcnl9IGZyb20gJy4vbmdfbW9kdWxlX2ZhY3RvcnknO1xuXG5cbi8qKlxuICogVXNlZCB0byBsb2FkIG5nIG1vZHVsZSBmYWN0b3JpZXMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTmdNb2R1bGVGYWN0b3J5TG9hZGVyIHtcbiAgYWJzdHJhY3QgbG9hZChwYXRoOiBzdHJpbmcpOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxhbnk+Pjtcbn1cblxuLyoqXG4gKiBNYXAgb2YgbW9kdWxlLWlkIHRvIHRoZSBjb3JyZXNwb25kaW5nIE5nTW9kdWxlLlxuICogLSBJbiBwcmUgSXZ5IHdlIHRyYWNrIE5nTW9kdWxlRmFjdG9yeSxcbiAqIC0gSW4gcG9zdCBJdnkgd2UgdHJhY2sgdGhlIE5nTW9kdWxlVHlwZVxuICovXG5jb25zdCBtb2R1bGVzID0gbmV3IE1hcDxzdHJpbmcsIE5nTW9kdWxlRmFjdG9yeTxhbnk+fE5nTW9kdWxlVHlwZT4oKTtcblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBsb2FkZWQgbW9kdWxlLiBTaG91bGQgb25seSBiZSBjYWxsZWQgZnJvbSBnZW5lcmF0ZWQgTmdNb2R1bGVGYWN0b3J5IGNvZGUuXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3Rlck1vZHVsZUZhY3RvcnkoaWQ6IHN0cmluZywgZmFjdG9yeTogTmdNb2R1bGVGYWN0b3J5PGFueT4pIHtcbiAgY29uc3QgZXhpc3RpbmcgPSBtb2R1bGVzLmdldChpZCkgYXMgTmdNb2R1bGVGYWN0b3J5PGFueT47XG4gIGFzc2VydE5vdEV4aXN0aW5nKGlkLCBleGlzdGluZyAmJiBleGlzdGluZy5tb2R1bGVUeXBlKTtcbiAgbW9kdWxlcy5zZXQoaWQsIGZhY3RvcnkpO1xufVxuXG5mdW5jdGlvbiBhc3NlcnROb3RFeGlzdGluZyhpZDogc3RyaW5nLCB0eXBlOiBUeXBlPGFueT58IG51bGwpOiB2b2lkIHtcbiAgaWYgKHR5cGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBEdXBsaWNhdGUgbW9kdWxlIHJlZ2lzdGVyZWQgZm9yICR7aWR9IC0gJHtzdHJpbmdpZnkodHlwZSl9IHZzICR7c3RyaW5naWZ5KHR5cGUubmFtZSl9YCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyTmdNb2R1bGVUeXBlKGlkOiBzdHJpbmcsIG5nTW9kdWxlVHlwZTogTmdNb2R1bGVUeXBlKSB7XG4gIGNvbnN0IGV4aXN0aW5nID0gbW9kdWxlcy5nZXQoaWQpIGFzIE5nTW9kdWxlVHlwZSB8IG51bGw7XG4gIGFzc2VydE5vdEV4aXN0aW5nKGlkLCBleGlzdGluZyk7XG4gIG1vZHVsZXMuc2V0KGlkLCBuZ01vZHVsZVR5cGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2xlYXJNb2R1bGVzRm9yVGVzdCgpOiB2b2lkIHtcbiAgbW9kdWxlcy5jbGVhcigpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW9kdWxlRmFjdG9yeV9fUFJFX1IzX18oaWQ6IHN0cmluZyk6IE5nTW9kdWxlRmFjdG9yeTxhbnk+IHtcbiAgY29uc3QgZmFjdG9yeSA9IG1vZHVsZXMuZ2V0KGlkKSBhcyBOZ01vZHVsZUZhY3Rvcnk8YW55PnwgbnVsbDtcbiAgaWYgKCFmYWN0b3J5KSB0aHJvdyBub01vZHVsZUVycm9yKGlkKTtcbiAgcmV0dXJuIGZhY3Rvcnk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNb2R1bGVGYWN0b3J5X19QT1NUX1IzX18oaWQ6IHN0cmluZyk6IE5nTW9kdWxlRmFjdG9yeTxhbnk+IHtcbiAgY29uc3QgdHlwZSA9IG1vZHVsZXMuZ2V0KGlkKSBhcyBOZ01vZHVsZVR5cGUgfCBudWxsO1xuICBpZiAoIXR5cGUpIHRocm93IG5vTW9kdWxlRXJyb3IoaWQpO1xuICByZXR1cm4gbmV3IFIzTmdNb2R1bGVGYWN0b3J5KHR5cGUpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIE5nTW9kdWxlRmFjdG9yeSB3aXRoIHRoZSBnaXZlbiBpZCwgaWYgaXQgZXhpc3RzIGFuZCBoYXMgYmVlbiBsb2FkZWQuXG4gKiBGYWN0b3JpZXMgZm9yIG1vZHVsZXMgdGhhdCBkbyBub3Qgc3BlY2lmeSBhbiBgaWRgIGNhbm5vdCBiZSByZXRyaWV2ZWQuIFRocm93cyBpZiB0aGUgbW9kdWxlXG4gKiBjYW5ub3QgYmUgZm91bmQuXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBnZXRNb2R1bGVGYWN0b3J5OiAoaWQ6IHN0cmluZykgPT4gTmdNb2R1bGVGYWN0b3J5PGFueT4gPSBnZXRNb2R1bGVGYWN0b3J5X19QUkVfUjNfXztcblxuZnVuY3Rpb24gbm9Nb2R1bGVFcnJvcihpZDogc3RyaW5nLCApOiBFcnJvciB7XG4gIHJldHVybiBuZXcgRXJyb3IoYE5vIG1vZHVsZSB3aXRoIElEICR7aWR9IGxvYWRlZGApO1xufVxuIl19