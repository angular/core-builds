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
export const getModuleFactory = getModuleFactory__POST_R3__;
/**
 * @param {?} id
 * @return {?}
 */
function noModuleError(id) {
    return new Error(`No module with ID ${id} loaded`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfbW9kdWxlX2ZhY3RvcnlfbG9hZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvbGlua2VyL25nX21vZHVsZV9mYWN0b3J5X2xvYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxlQUFlLElBQUksaUJBQWlCLEVBQWUsTUFBTSwwQkFBMEIsQ0FBQztBQUM1RixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7Ozs7Ozs7QUFVNUMsTUFBTSxPQUFnQixxQkFBcUI7Q0FFMUM7Ozs7Ozs7SUFEQywyREFBMkQ7Ozs7Ozs7O01BUXZELE9BQU8sR0FBRyxJQUFJLEdBQUcsRUFBNkM7Ozs7Ozs7O0FBTXBFLE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxFQUFVLEVBQUUsT0FBNkI7O1VBQ3ZFLFFBQVEsR0FBRyxtQkFBQSxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUF3QjtJQUN4RCx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUsUUFBUSxJQUFJLFFBQVEsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ2pGLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzNCLENBQUM7Ozs7Ozs7QUFFRCxTQUFTLHVCQUF1QixDQUFDLEVBQVUsRUFBRSxJQUFxQixFQUFFLFFBQW1CO0lBQ3JGLElBQUksSUFBSSxJQUFJLElBQUksS0FBSyxRQUFRLEVBQUU7UUFDN0IsTUFBTSxJQUFJLEtBQUssQ0FDWCxtQ0FBbUMsRUFBRSxNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUM5RjtBQUNILENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxFQUFVLEVBQUUsWUFBMEI7O1VBQ25FLFFBQVEsR0FBRyxtQkFBQSxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUF1QjtJQUN2RCx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQ3BELE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQ2hDLENBQUM7Ozs7QUFFRCxNQUFNLFVBQVUsbUJBQW1CO0lBQ2pDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNsQixDQUFDOzs7OztBQUVELE1BQU0sVUFBVSwwQkFBMEIsQ0FBQyxFQUFVOztVQUM3QyxPQUFPLEdBQUcsbUJBQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBOEI7SUFDN0QsSUFBSSxDQUFDLE9BQU87UUFBRSxNQUFNLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN0QyxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDOzs7OztBQUVELE1BQU0sVUFBVSwyQkFBMkIsQ0FBQyxFQUFVOztVQUM5QyxJQUFJLEdBQUcsbUJBQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBdUI7SUFDbkQsSUFBSSxDQUFDLElBQUk7UUFBRSxNQUFNLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNuQyxPQUFPLElBQUksaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDckMsQ0FBQzs7Ozs7Ozs7QUFRRCxNQUFNLE9BQU8sZ0JBQWdCLEdBWmIsMkJBWWdGOzs7OztBQUVoRyxTQUFTLGFBQWEsQ0FBQyxFQUFVO0lBQy9CLE9BQU8sSUFBSSxLQUFLLENBQUMscUJBQXFCLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDckQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge05nTW9kdWxlRmFjdG9yeSBhcyBSM05nTW9kdWxlRmFjdG9yeSwgTmdNb2R1bGVUeXBlfSBmcm9tICcuLi9yZW5kZXIzL25nX21vZHVsZV9yZWYnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvc3RyaW5naWZ5JztcblxuaW1wb3J0IHtOZ01vZHVsZUZhY3Rvcnl9IGZyb20gJy4vbmdfbW9kdWxlX2ZhY3RvcnknO1xuXG5cbi8qKlxuICogVXNlZCB0byBsb2FkIG5nIG1vZHVsZSBmYWN0b3JpZXMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTmdNb2R1bGVGYWN0b3J5TG9hZGVyIHtcbiAgYWJzdHJhY3QgbG9hZChwYXRoOiBzdHJpbmcpOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxhbnk+Pjtcbn1cblxuLyoqXG4gKiBNYXAgb2YgbW9kdWxlLWlkIHRvIHRoZSBjb3JyZXNwb25kaW5nIE5nTW9kdWxlLlxuICogLSBJbiBwcmUgSXZ5IHdlIHRyYWNrIE5nTW9kdWxlRmFjdG9yeSxcbiAqIC0gSW4gcG9zdCBJdnkgd2UgdHJhY2sgdGhlIE5nTW9kdWxlVHlwZVxuICovXG5jb25zdCBtb2R1bGVzID0gbmV3IE1hcDxzdHJpbmcsIE5nTW9kdWxlRmFjdG9yeTxhbnk+fE5nTW9kdWxlVHlwZT4oKTtcblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBsb2FkZWQgbW9kdWxlLiBTaG91bGQgb25seSBiZSBjYWxsZWQgZnJvbSBnZW5lcmF0ZWQgTmdNb2R1bGVGYWN0b3J5IGNvZGUuXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3Rlck1vZHVsZUZhY3RvcnkoaWQ6IHN0cmluZywgZmFjdG9yeTogTmdNb2R1bGVGYWN0b3J5PGFueT4pIHtcbiAgY29uc3QgZXhpc3RpbmcgPSBtb2R1bGVzLmdldChpZCkgYXMgTmdNb2R1bGVGYWN0b3J5PGFueT47XG4gIGFzc2VydFNhbWVPck5vdEV4aXN0aW5nKGlkLCBleGlzdGluZyAmJiBleGlzdGluZy5tb2R1bGVUeXBlLCBmYWN0b3J5Lm1vZHVsZVR5cGUpO1xuICBtb2R1bGVzLnNldChpZCwgZmFjdG9yeSk7XG59XG5cbmZ1bmN0aW9uIGFzc2VydFNhbWVPck5vdEV4aXN0aW5nKGlkOiBzdHJpbmcsIHR5cGU6IFR5cGU8YW55PnwgbnVsbCwgaW5jb21pbmc6IFR5cGU8YW55Pik6IHZvaWQge1xuICBpZiAodHlwZSAmJiB0eXBlICE9PSBpbmNvbWluZykge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYER1cGxpY2F0ZSBtb2R1bGUgcmVnaXN0ZXJlZCBmb3IgJHtpZH0gLSAke3N0cmluZ2lmeSh0eXBlKX0gdnMgJHtzdHJpbmdpZnkodHlwZS5uYW1lKX1gKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJOZ01vZHVsZVR5cGUoaWQ6IHN0cmluZywgbmdNb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGUpIHtcbiAgY29uc3QgZXhpc3RpbmcgPSBtb2R1bGVzLmdldChpZCkgYXMgTmdNb2R1bGVUeXBlIHwgbnVsbDtcbiAgYXNzZXJ0U2FtZU9yTm90RXhpc3RpbmcoaWQsIGV4aXN0aW5nLCBuZ01vZHVsZVR5cGUpO1xuICBtb2R1bGVzLnNldChpZCwgbmdNb2R1bGVUeXBlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyTW9kdWxlc0ZvclRlc3QoKTogdm9pZCB7XG4gIG1vZHVsZXMuY2xlYXIoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1vZHVsZUZhY3RvcnlfX1BSRV9SM19fKGlkOiBzdHJpbmcpOiBOZ01vZHVsZUZhY3Rvcnk8YW55PiB7XG4gIGNvbnN0IGZhY3RvcnkgPSBtb2R1bGVzLmdldChpZCkgYXMgTmdNb2R1bGVGYWN0b3J5PGFueT58IG51bGw7XG4gIGlmICghZmFjdG9yeSkgdGhyb3cgbm9Nb2R1bGVFcnJvcihpZCk7XG4gIHJldHVybiBmYWN0b3J5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW9kdWxlRmFjdG9yeV9fUE9TVF9SM19fKGlkOiBzdHJpbmcpOiBOZ01vZHVsZUZhY3Rvcnk8YW55PiB7XG4gIGNvbnN0IHR5cGUgPSBtb2R1bGVzLmdldChpZCkgYXMgTmdNb2R1bGVUeXBlIHwgbnVsbDtcbiAgaWYgKCF0eXBlKSB0aHJvdyBub01vZHVsZUVycm9yKGlkKTtcbiAgcmV0dXJuIG5ldyBSM05nTW9kdWxlRmFjdG9yeSh0eXBlKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBOZ01vZHVsZUZhY3Rvcnkgd2l0aCB0aGUgZ2l2ZW4gaWQsIGlmIGl0IGV4aXN0cyBhbmQgaGFzIGJlZW4gbG9hZGVkLlxuICogRmFjdG9yaWVzIGZvciBtb2R1bGVzIHRoYXQgZG8gbm90IHNwZWNpZnkgYW4gYGlkYCBjYW5ub3QgYmUgcmV0cmlldmVkLiBUaHJvd3MgaWYgdGhlIG1vZHVsZVxuICogY2Fubm90IGJlIGZvdW5kLlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgZ2V0TW9kdWxlRmFjdG9yeTogKGlkOiBzdHJpbmcpID0+IE5nTW9kdWxlRmFjdG9yeTxhbnk+ID0gZ2V0TW9kdWxlRmFjdG9yeV9fUFJFX1IzX187XG5cbmZ1bmN0aW9uIG5vTW9kdWxlRXJyb3IoaWQ6IHN0cmluZywgKTogRXJyb3Ige1xuICByZXR1cm4gbmV3IEVycm9yKGBObyBtb2R1bGUgd2l0aCBJRCAke2lkfSBsb2FkZWRgKTtcbn1cbiJdfQ==