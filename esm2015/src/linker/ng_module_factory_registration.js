/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { autoRegisterModuleById } from '../render3/definition';
import { stringify } from '../util/stringify';
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
 * @param {?} ngModuleType
 * @return {?}
 */
export function registerNgModuleType(ngModuleType) {
    if (ngModuleType.ɵmod.id !== null) {
        /** @type {?} */
        const id = ngModuleType.ɵmod.id;
        /** @type {?} */
        const existing = (/** @type {?} */ (modules.get(id)));
        assertSameOrNotExisting(id, existing, ngModuleType);
        modules.set(id, ngModuleType);
    }
    /** @type {?} */
    let imports = ngModuleType.ɵmod.imports;
    if (imports instanceof Function) {
        imports = imports();
    }
    if (imports) {
        imports.forEach((/**
         * @param {?} i
         * @return {?}
         */
        i => registerNgModuleType((/** @type {?} */ (i)))));
    }
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
export function getRegisteredNgModuleType(id) {
    return modules.get(id) || autoRegisterModuleById[id];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfbW9kdWxlX2ZhY3RvcnlfcmVnaXN0cmF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvbGlua2VyL25nX21vZHVsZV9mYWN0b3J5X3JlZ2lzdHJhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVVBLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRTdELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQzs7Ozs7OztNQVV0QyxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQTZDOzs7Ozs7OztBQU1wRSxNQUFNLFVBQVUscUJBQXFCLENBQUMsRUFBVSxFQUFFLE9BQTZCOztVQUN2RSxRQUFRLEdBQUcsbUJBQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBd0I7SUFDeEQsdUJBQXVCLENBQUMsRUFBRSxFQUFFLFFBQVEsSUFBSSxRQUFRLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNqRixPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUMzQixDQUFDOzs7Ozs7O0FBRUQsU0FBUyx1QkFBdUIsQ0FBQyxFQUFVLEVBQUUsSUFBcUIsRUFBRSxRQUFtQjtJQUNyRixJQUFJLElBQUksSUFBSSxJQUFJLEtBQUssUUFBUSxFQUFFO1FBQzdCLE1BQU0sSUFBSSxLQUFLLENBQ1gsbUNBQW1DLEVBQUUsTUFBTSxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7S0FDOUY7QUFDSCxDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxZQUEwQjtJQUM3RCxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLElBQUksRUFBRTs7Y0FDM0IsRUFBRSxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRTs7Y0FDekIsUUFBUSxHQUFHLG1CQUFBLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQXVCO1FBQ3ZELHVCQUF1QixDQUFDLEVBQUUsRUFBRSxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDcEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsWUFBWSxDQUFDLENBQUM7S0FDL0I7O1FBRUcsT0FBTyxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTztJQUN2QyxJQUFJLE9BQU8sWUFBWSxRQUFRLEVBQUU7UUFDL0IsT0FBTyxHQUFHLE9BQU8sRUFBRSxDQUFDO0tBQ3JCO0lBQ0QsSUFBSSxPQUFPLEVBQUU7UUFDWCxPQUFPLENBQUMsT0FBTzs7OztRQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsb0JBQW9CLENBQUMsbUJBQUEsQ0FBQyxFQUFnQixDQUFDLEVBQUMsQ0FBQztLQUMvRDtBQUNILENBQUM7Ozs7QUFFRCxNQUFNLFVBQVUsbUJBQW1CO0lBQ2pDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNsQixDQUFDOzs7OztBQUVELE1BQU0sVUFBVSx5QkFBeUIsQ0FBQyxFQUFVO0lBQ2xELE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxzQkFBc0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUN2RCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHthdXRvUmVnaXN0ZXJNb2R1bGVCeUlkfSBmcm9tICcuLi9yZW5kZXIzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOZ01vZHVsZVR5cGV9IGZyb20gJy4uL3JlbmRlcjMvbmdfbW9kdWxlX3JlZic7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9zdHJpbmdpZnknO1xuXG5pbXBvcnQge05nTW9kdWxlRmFjdG9yeX0gZnJvbSAnLi9uZ19tb2R1bGVfZmFjdG9yeSc7XG5cblxuLyoqXG4gKiBNYXAgb2YgbW9kdWxlLWlkIHRvIHRoZSBjb3JyZXNwb25kaW5nIE5nTW9kdWxlLlxuICogLSBJbiBwcmUgSXZ5IHdlIHRyYWNrIE5nTW9kdWxlRmFjdG9yeSxcbiAqIC0gSW4gcG9zdCBJdnkgd2UgdHJhY2sgdGhlIE5nTW9kdWxlVHlwZVxuICovXG5jb25zdCBtb2R1bGVzID0gbmV3IE1hcDxzdHJpbmcsIE5nTW9kdWxlRmFjdG9yeTxhbnk+fE5nTW9kdWxlVHlwZT4oKTtcblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBsb2FkZWQgbW9kdWxlLiBTaG91bGQgb25seSBiZSBjYWxsZWQgZnJvbSBnZW5lcmF0ZWQgTmdNb2R1bGVGYWN0b3J5IGNvZGUuXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3Rlck1vZHVsZUZhY3RvcnkoaWQ6IHN0cmluZywgZmFjdG9yeTogTmdNb2R1bGVGYWN0b3J5PGFueT4pIHtcbiAgY29uc3QgZXhpc3RpbmcgPSBtb2R1bGVzLmdldChpZCkgYXMgTmdNb2R1bGVGYWN0b3J5PGFueT47XG4gIGFzc2VydFNhbWVPck5vdEV4aXN0aW5nKGlkLCBleGlzdGluZyAmJiBleGlzdGluZy5tb2R1bGVUeXBlLCBmYWN0b3J5Lm1vZHVsZVR5cGUpO1xuICBtb2R1bGVzLnNldChpZCwgZmFjdG9yeSk7XG59XG5cbmZ1bmN0aW9uIGFzc2VydFNhbWVPck5vdEV4aXN0aW5nKGlkOiBzdHJpbmcsIHR5cGU6IFR5cGU8YW55PnwgbnVsbCwgaW5jb21pbmc6IFR5cGU8YW55Pik6IHZvaWQge1xuICBpZiAodHlwZSAmJiB0eXBlICE9PSBpbmNvbWluZykge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYER1cGxpY2F0ZSBtb2R1bGUgcmVnaXN0ZXJlZCBmb3IgJHtpZH0gLSAke3N0cmluZ2lmeSh0eXBlKX0gdnMgJHtzdHJpbmdpZnkodHlwZS5uYW1lKX1gKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJOZ01vZHVsZVR5cGUobmdNb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGUpIHtcbiAgaWYgKG5nTW9kdWxlVHlwZS7JtW1vZC5pZCAhPT0gbnVsbCkge1xuICAgIGNvbnN0IGlkID0gbmdNb2R1bGVUeXBlLsm1bW9kLmlkO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gbW9kdWxlcy5nZXQoaWQpIGFzIE5nTW9kdWxlVHlwZSB8IG51bGw7XG4gICAgYXNzZXJ0U2FtZU9yTm90RXhpc3RpbmcoaWQsIGV4aXN0aW5nLCBuZ01vZHVsZVR5cGUpO1xuICAgIG1vZHVsZXMuc2V0KGlkLCBuZ01vZHVsZVR5cGUpO1xuICB9XG5cbiAgbGV0IGltcG9ydHMgPSBuZ01vZHVsZVR5cGUuybVtb2QuaW1wb3J0cztcbiAgaWYgKGltcG9ydHMgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgIGltcG9ydHMgPSBpbXBvcnRzKCk7XG4gIH1cbiAgaWYgKGltcG9ydHMpIHtcbiAgICBpbXBvcnRzLmZvckVhY2goaSA9PiByZWdpc3Rlck5nTW9kdWxlVHlwZShpIGFzIE5nTW9kdWxlVHlwZSkpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbGVhck1vZHVsZXNGb3JUZXN0KCk6IHZvaWQge1xuICBtb2R1bGVzLmNsZWFyKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZWdpc3RlcmVkTmdNb2R1bGVUeXBlKGlkOiBzdHJpbmcpIHtcbiAgcmV0dXJuIG1vZHVsZXMuZ2V0KGlkKSB8fCBhdXRvUmVnaXN0ZXJNb2R1bGVCeUlkW2lkXTtcbn1cbiJdfQ==