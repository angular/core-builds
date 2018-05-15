/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '../di/injector';
import { NgModuleFactory } from '../linker/ng_module_factory';
import { initServicesIfNeeded } from './services';
import { Services } from './types';
import { resolveDefinition } from './util';
/**
 * @param {?} override
 * @return {?}
 */
export function overrideProvider(override) {
    initServicesIfNeeded();
    return Services.overrideProvider(override);
}
/**
 * @param {?} comp
 * @param {?} componentFactory
 * @return {?}
 */
export function overrideComponentView(comp, componentFactory) {
    initServicesIfNeeded();
    return Services.overrideComponentView(comp, componentFactory);
}
/**
 * @return {?}
 */
export function clearOverrides() {
    initServicesIfNeeded();
    return Services.clearOverrides();
}
/**
 * @param {?} ngModuleType
 * @param {?} bootstrapComponents
 * @param {?} defFactory
 * @return {?}
 */
export function createNgModuleFactory(ngModuleType, bootstrapComponents, defFactory) {
    return new NgModuleFactory_(ngModuleType, bootstrapComponents, defFactory);
}
class NgModuleFactory_ extends NgModuleFactory {
    /**
     * @param {?} moduleType
     * @param {?} _bootstrapComponents
     * @param {?} _ngModuleDefFactory
     */
    constructor(moduleType, _bootstrapComponents, _ngModuleDefFactory) {
        // Attention: this ctor is called as top level function.
        // Putting any logic in here will destroy closure tree shaking!
        super();
        this.moduleType = moduleType;
        this._bootstrapComponents = _bootstrapComponents;
        this._ngModuleDefFactory = _ngModuleDefFactory;
    }
    /**
     * @param {?} parentInjector
     * @return {?}
     */
    create(parentInjector) {
        initServicesIfNeeded();
        const /** @type {?} */ def = resolveDefinition(this._ngModuleDefFactory);
        return Services.createNgModuleRef(this.moduleType, parentInjector || Injector.NULL, this._bootstrapComponents, def);
    }
}
function NgModuleFactory__tsickle_Closure_declarations() {
    /** @type {?} */
    NgModuleFactory_.prototype.moduleType;
    /** @type {?} */
    NgModuleFactory_.prototype._bootstrapComponents;
    /** @type {?} */
    NgModuleFactory_.prototype._ngModuleDefFactory;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW50cnlwb2ludC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3ZpZXcvZW50cnlwb2ludC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUV4QyxPQUFPLEVBQUMsZUFBZSxFQUFjLE1BQU0sNkJBQTZCLENBQUM7QUFHekUsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ2hELE9BQU8sRUFBOEMsUUFBUSxFQUFpQixNQUFNLFNBQVMsQ0FBQztBQUM5RixPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxRQUFRLENBQUM7Ozs7O0FBRXpDLE1BQU0sMkJBQTJCLFFBQTBCO0lBQ3pELG9CQUFvQixFQUFFLENBQUM7SUFDdkIsT0FBTyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7Q0FDNUM7Ozs7OztBQUVELE1BQU0sZ0NBQWdDLElBQWUsRUFBRSxnQkFBdUM7SUFDNUYsb0JBQW9CLEVBQUUsQ0FBQztJQUN2QixPQUFPLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztDQUMvRDs7OztBQUVELE1BQU07SUFDSixvQkFBb0IsRUFBRSxDQUFDO0lBQ3ZCLE9BQU8sUUFBUSxDQUFDLGNBQWMsRUFBRSxDQUFDO0NBQ2xDOzs7Ozs7O0FBSUQsTUFBTSxnQ0FDRixZQUF1QixFQUFFLG1CQUFnQyxFQUN6RCxVQUFxQztJQUN2QyxPQUFPLElBQUksZ0JBQWdCLENBQUMsWUFBWSxFQUFFLG1CQUFtQixFQUFFLFVBQVUsQ0FBQyxDQUFDO0NBQzVFO0FBRUQsc0JBQXVCLFNBQVEsZUFBb0I7Ozs7OztJQUNqRCxZQUNvQixZQUErQixvQkFBaUMsRUFDeEU7OztRQUdWLEtBQUssRUFBRSxDQUFDO1FBSlUsZUFBVSxHQUFWLFVBQVU7UUFBcUIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFhO1FBQ3hFLHdCQUFtQixHQUFuQixtQkFBbUI7S0FJOUI7Ozs7O0lBRUQsTUFBTSxDQUFDLGNBQTZCO1FBQ2xDLG9CQUFvQixFQUFFLENBQUM7UUFDdkIsdUJBQU0sR0FBRyxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3hELE9BQU8sUUFBUSxDQUFDLGlCQUFpQixDQUM3QixJQUFJLENBQUMsVUFBVSxFQUFFLGNBQWMsSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLENBQUMsQ0FBQztLQUN2RjtDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0NvbXBvbmVudEZhY3Rvcnl9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge05nTW9kdWxlRmFjdG9yeSwgTmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuXG5pbXBvcnQge2luaXRTZXJ2aWNlc0lmTmVlZGVkfSBmcm9tICcuL3NlcnZpY2VzJztcbmltcG9ydCB7TmdNb2R1bGVEZWZpbml0aW9uRmFjdG9yeSwgUHJvdmlkZXJPdmVycmlkZSwgU2VydmljZXMsIFZpZXdEZWZpbml0aW9ufSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7cmVzb2x2ZURlZmluaXRpb259IGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBvdmVycmlkZVByb3ZpZGVyKG92ZXJyaWRlOiBQcm92aWRlck92ZXJyaWRlKSB7XG4gIGluaXRTZXJ2aWNlc0lmTmVlZGVkKCk7XG4gIHJldHVybiBTZXJ2aWNlcy5vdmVycmlkZVByb3ZpZGVyKG92ZXJyaWRlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG92ZXJyaWRlQ29tcG9uZW50Vmlldyhjb21wOiBUeXBlPGFueT4sIGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8YW55Pikge1xuICBpbml0U2VydmljZXNJZk5lZWRlZCgpO1xuICByZXR1cm4gU2VydmljZXMub3ZlcnJpZGVDb21wb25lbnRWaWV3KGNvbXAsIGNvbXBvbmVudEZhY3RvcnkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2xlYXJPdmVycmlkZXMoKSB7XG4gIGluaXRTZXJ2aWNlc0lmTmVlZGVkKCk7XG4gIHJldHVybiBTZXJ2aWNlcy5jbGVhck92ZXJyaWRlcygpO1xufVxuXG4vLyBBdHRlbnRpb246IHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGFzIHRvcCBsZXZlbCBmdW5jdGlvbi5cbi8vIFB1dHRpbmcgYW55IGxvZ2ljIGluIGhlcmUgd2lsbCBkZXN0cm95IGNsb3N1cmUgdHJlZSBzaGFraW5nIVxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5nTW9kdWxlRmFjdG9yeShcbiAgICBuZ01vZHVsZVR5cGU6IFR5cGU8YW55PiwgYm9vdHN0cmFwQ29tcG9uZW50czogVHlwZTxhbnk+W10sXG4gICAgZGVmRmFjdG9yeTogTmdNb2R1bGVEZWZpbml0aW9uRmFjdG9yeSk6IE5nTW9kdWxlRmFjdG9yeTxhbnk+IHtcbiAgcmV0dXJuIG5ldyBOZ01vZHVsZUZhY3RvcnlfKG5nTW9kdWxlVHlwZSwgYm9vdHN0cmFwQ29tcG9uZW50cywgZGVmRmFjdG9yeSk7XG59XG5cbmNsYXNzIE5nTW9kdWxlRmFjdG9yeV8gZXh0ZW5kcyBOZ01vZHVsZUZhY3Rvcnk8YW55PiB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIHJlYWRvbmx5IG1vZHVsZVR5cGU6IFR5cGU8YW55PiwgcHJpdmF0ZSBfYm9vdHN0cmFwQ29tcG9uZW50czogVHlwZTxhbnk+W10sXG4gICAgICBwcml2YXRlIF9uZ01vZHVsZURlZkZhY3Rvcnk6IE5nTW9kdWxlRGVmaW5pdGlvbkZhY3RvcnkpIHtcbiAgICAvLyBBdHRlbnRpb246IHRoaXMgY3RvciBpcyBjYWxsZWQgYXMgdG9wIGxldmVsIGZ1bmN0aW9uLlxuICAgIC8vIFB1dHRpbmcgYW55IGxvZ2ljIGluIGhlcmUgd2lsbCBkZXN0cm95IGNsb3N1cmUgdHJlZSBzaGFraW5nIVxuICAgIHN1cGVyKCk7XG4gIH1cblxuICBjcmVhdGUocGFyZW50SW5qZWN0b3I6IEluamVjdG9yfG51bGwpOiBOZ01vZHVsZVJlZjxhbnk+IHtcbiAgICBpbml0U2VydmljZXNJZk5lZWRlZCgpO1xuICAgIGNvbnN0IGRlZiA9IHJlc29sdmVEZWZpbml0aW9uKHRoaXMuX25nTW9kdWxlRGVmRmFjdG9yeSk7XG4gICAgcmV0dXJuIFNlcnZpY2VzLmNyZWF0ZU5nTW9kdWxlUmVmKFxuICAgICAgICB0aGlzLm1vZHVsZVR5cGUsIHBhcmVudEluamVjdG9yIHx8IEluamVjdG9yLk5VTEwsIHRoaXMuX2Jvb3RzdHJhcENvbXBvbmVudHMsIGRlZik7XG4gIH1cbn1cbiJdfQ==