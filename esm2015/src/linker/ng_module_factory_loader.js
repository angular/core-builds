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
import { stringify } from '../util';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfbW9kdWxlX2ZhY3RvcnlfbG9hZGVyLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsicGFja2FnZXMvY29yZS9zcmMvbGlua2VyL25nX21vZHVsZV9mYWN0b3J5X2xvYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxlQUFlLElBQUksaUJBQWlCLEVBQWUsTUFBTSwwQkFBMEIsQ0FBQztBQUU1RixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sU0FBUyxDQUFDOzs7Ozs7O0FBUWxDLE1BQU0sT0FBZ0IscUJBQXFCO0NBRTFDOzs7Ozs7O0lBREMsMkRBQTJEOzs7Ozs7OztNQVF2RCxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQTZDOzs7Ozs7OztBQU1wRSxNQUFNLFVBQVUscUJBQXFCLENBQUMsRUFBVSxFQUFFLE9BQTZCOztVQUN2RSxRQUFRLEdBQUcsbUJBQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBd0I7SUFDeEQsaUJBQWlCLENBQUMsRUFBRSxFQUFFLFFBQVEsSUFBSSxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDdkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDM0IsQ0FBQzs7Ozs7O0FBRUQsU0FBUyxpQkFBaUIsQ0FBQyxFQUFVLEVBQUUsSUFBcUI7SUFDMUQsSUFBSSxJQUFJLEVBQUU7UUFDUixNQUFNLElBQUksS0FBSyxDQUNYLG1DQUFtQyxFQUFFLE1BQU0sU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0tBQzlGO0FBQ0gsQ0FBQzs7Ozs7O0FBRUQsTUFBTSxVQUFVLG9CQUFvQixDQUFDLEVBQVUsRUFBRSxZQUEwQjs7VUFDbkUsUUFBUSxHQUFHLG1CQUFBLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQXVCO0lBQ3ZELGlCQUFpQixDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNoQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxZQUFZLENBQUMsQ0FBQztBQUNoQyxDQUFDOzs7O0FBRUQsTUFBTSxVQUFVLG1CQUFtQjtJQUNqQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDbEIsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsMEJBQTBCLENBQUMsRUFBVTs7VUFDN0MsT0FBTyxHQUFHLG1CQUFBLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQThCO0lBQzdELElBQUksQ0FBQyxPQUFPO1FBQUUsTUFBTSxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDdEMsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsMkJBQTJCLENBQUMsRUFBVTs7VUFDOUMsSUFBSSxHQUFHLG1CQUFBLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQXVCO0lBQ25ELElBQUksQ0FBQyxJQUFJO1FBQUUsTUFBTSxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDbkMsT0FBTyxJQUFJLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3JDLENBQUM7Ozs7Ozs7O0FBUUQsTUFBTSxPQUFPLGdCQUFnQixHQVpiLDJCQVlnRjs7Ozs7QUFFaEcsU0FBUyxhQUFhLENBQUMsRUFBVTtJQUMvQixPQUFPLElBQUksS0FBSyxDQUFDLHFCQUFxQixFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ3JELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7TmdNb2R1bGVGYWN0b3J5IGFzIFIzTmdNb2R1bGVGYWN0b3J5LCBOZ01vZHVsZVR5cGV9IGZyb20gJy4uL3JlbmRlcjMvbmdfbW9kdWxlX3JlZic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwnO1xuaW1wb3J0IHtOZ01vZHVsZUZhY3Rvcnl9IGZyb20gJy4vbmdfbW9kdWxlX2ZhY3RvcnknO1xuXG4vKipcbiAqIFVzZWQgdG8gbG9hZCBuZyBtb2R1bGUgZmFjdG9yaWVzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5nTW9kdWxlRmFjdG9yeUxvYWRlciB7XG4gIGFic3RyYWN0IGxvYWQocGF0aDogc3RyaW5nKTogUHJvbWlzZTxOZ01vZHVsZUZhY3Rvcnk8YW55Pj47XG59XG5cbi8qKlxuICogTWFwIG9mIG1vZHVsZS1pZCB0byB0aGUgY29ycmVzcG9uZGluZyBOZ01vZHVsZS5cbiAqIC0gSW4gcHJlIEl2eSB3ZSB0cmFjayBOZ01vZHVsZUZhY3RvcnksXG4gKiAtIEluIHBvc3QgSXZ5IHdlIHRyYWNrIHRoZSBOZ01vZHVsZVR5cGVcbiAqL1xuY29uc3QgbW9kdWxlcyA9IG5ldyBNYXA8c3RyaW5nLCBOZ01vZHVsZUZhY3Rvcnk8YW55PnxOZ01vZHVsZVR5cGU+KCk7XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgbG9hZGVkIG1vZHVsZS4gU2hvdWxkIG9ubHkgYmUgY2FsbGVkIGZyb20gZ2VuZXJhdGVkIE5nTW9kdWxlRmFjdG9yeSBjb2RlLlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJNb2R1bGVGYWN0b3J5KGlkOiBzdHJpbmcsIGZhY3Rvcnk6IE5nTW9kdWxlRmFjdG9yeTxhbnk+KSB7XG4gIGNvbnN0IGV4aXN0aW5nID0gbW9kdWxlcy5nZXQoaWQpIGFzIE5nTW9kdWxlRmFjdG9yeTxhbnk+O1xuICBhc3NlcnROb3RFeGlzdGluZyhpZCwgZXhpc3RpbmcgJiYgZXhpc3RpbmcubW9kdWxlVHlwZSk7XG4gIG1vZHVsZXMuc2V0KGlkLCBmYWN0b3J5KTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0Tm90RXhpc3RpbmcoaWQ6IHN0cmluZywgdHlwZTogVHlwZTxhbnk+fCBudWxsKTogdm9pZCB7XG4gIGlmICh0eXBlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgRHVwbGljYXRlIG1vZHVsZSByZWdpc3RlcmVkIGZvciAke2lkfSAtICR7c3RyaW5naWZ5KHR5cGUpfSB2cyAke3N0cmluZ2lmeSh0eXBlLm5hbWUpfWApO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3Rlck5nTW9kdWxlVHlwZShpZDogc3RyaW5nLCBuZ01vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZSkge1xuICBjb25zdCBleGlzdGluZyA9IG1vZHVsZXMuZ2V0KGlkKSBhcyBOZ01vZHVsZVR5cGUgfCBudWxsO1xuICBhc3NlcnROb3RFeGlzdGluZyhpZCwgZXhpc3RpbmcpO1xuICBtb2R1bGVzLnNldChpZCwgbmdNb2R1bGVUeXBlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyTW9kdWxlc0ZvclRlc3QoKTogdm9pZCB7XG4gIG1vZHVsZXMuY2xlYXIoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1vZHVsZUZhY3RvcnlfX1BSRV9SM19fKGlkOiBzdHJpbmcpOiBOZ01vZHVsZUZhY3Rvcnk8YW55PiB7XG4gIGNvbnN0IGZhY3RvcnkgPSBtb2R1bGVzLmdldChpZCkgYXMgTmdNb2R1bGVGYWN0b3J5PGFueT58IG51bGw7XG4gIGlmICghZmFjdG9yeSkgdGhyb3cgbm9Nb2R1bGVFcnJvcihpZCk7XG4gIHJldHVybiBmYWN0b3J5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW9kdWxlRmFjdG9yeV9fUE9TVF9SM19fKGlkOiBzdHJpbmcpOiBOZ01vZHVsZUZhY3Rvcnk8YW55PiB7XG4gIGNvbnN0IHR5cGUgPSBtb2R1bGVzLmdldChpZCkgYXMgTmdNb2R1bGVUeXBlIHwgbnVsbDtcbiAgaWYgKCF0eXBlKSB0aHJvdyBub01vZHVsZUVycm9yKGlkKTtcbiAgcmV0dXJuIG5ldyBSM05nTW9kdWxlRmFjdG9yeSh0eXBlKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBOZ01vZHVsZUZhY3Rvcnkgd2l0aCB0aGUgZ2l2ZW4gaWQsIGlmIGl0IGV4aXN0cyBhbmQgaGFzIGJlZW4gbG9hZGVkLlxuICogRmFjdG9yaWVzIGZvciBtb2R1bGVzIHRoYXQgZG8gbm90IHNwZWNpZnkgYW4gYGlkYCBjYW5ub3QgYmUgcmV0cmlldmVkLiBUaHJvd3MgaWYgdGhlIG1vZHVsZVxuICogY2Fubm90IGJlIGZvdW5kLlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgZ2V0TW9kdWxlRmFjdG9yeTogKGlkOiBzdHJpbmcpID0+IE5nTW9kdWxlRmFjdG9yeTxhbnk+ID0gZ2V0TW9kdWxlRmFjdG9yeV9fUFJFX1IzX187XG5cbmZ1bmN0aW9uIG5vTW9kdWxlRXJyb3IoaWQ6IHN0cmluZywgKTogRXJyb3Ige1xuICByZXR1cm4gbmV3IEVycm9yKGBObyBtb2R1bGUgd2l0aCBJRCAke2lkfSBsb2FkZWRgKTtcbn1cbiJdfQ==