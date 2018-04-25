/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { APP_ID_RANDOM_PROVIDER } from './application_tokens';
import { IterableDiffers, KeyValueDiffers, defaultIterableDiffers, defaultKeyValueDiffers } from './change_detection/change_detection';
import { Inject, Optional, SkipSelf } from './di/metadata';
import { APP_ROOT } from './di/scope';
import { LOCALE_ID } from './i18n/tokens';
import { NgModule } from './metadata';
export function _iterableDiffersFactory() {
    return defaultIterableDiffers;
}
export function _keyValueDiffersFactory() {
    return defaultKeyValueDiffers;
}
export function _localeFactory(locale) {
    return locale || 'en-US';
}
/**
 * @experimental
 */
var ApplicationModule = /** @class */ (function () {
    function ApplicationModule() {
    }
    ApplicationModule.decorators = [
        { type: NgModule, args: [{
                    providers: [
                        APP_ID_RANDOM_PROVIDER,
                        // wen-workers need this value to be here since WorkerApp is defined
                        // ontop of this application
                        { provide: APP_ROOT, useValue: true },
                        { provide: IterableDiffers, useFactory: _iterableDiffersFactory },
                        { provide: KeyValueDiffers, useFactory: _keyValueDiffersFactory },
                        {
                            provide: LOCALE_ID,
                            useFactory: _localeFactory,
                            deps: [[new Inject(LOCALE_ID), new Optional(), new SkipSelf()]]
                        },
                    ]
                },] }
    ];
    /** @nocollapse */
    ApplicationModule.ctorParameters = function () { return []; };
    return ApplicationModule;
}());
export { ApplicationModule };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fbW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb25fbW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUM1RCxPQUFPLEVBQUMsZUFBZSxFQUFFLGVBQWUsRUFBRSxzQkFBc0IsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLHFDQUFxQyxDQUFDO0FBQ3JJLE9BQU8sRUFBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN6RCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDeEMsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUVwQyxNQUFNO0lBQ0osTUFBTSxDQUFDLHNCQUFzQixDQUFDO0NBQy9CO0FBRUQsTUFBTTtJQUNKLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQztDQUMvQjtBQUVELE1BQU0seUJBQXlCLE1BQWU7SUFDNUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUM7Q0FDMUI7Ozs7Ozs7O2dCQUtBLFFBQVEsU0FBQztvQkFDUixTQUFTLEVBQUU7d0JBQ1Qsc0JBQXNCOzs7d0JBR3RCLEVBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFDO3dCQUNuQyxFQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLHVCQUF1QixFQUFDO3dCQUMvRCxFQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLHVCQUF1QixFQUFDO3dCQUMvRDs0QkFDRSxPQUFPLEVBQUUsU0FBUzs0QkFDbEIsVUFBVSxFQUFFLGNBQWM7NEJBQzFCLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsSUFBSSxRQUFRLEVBQUUsRUFBRSxJQUFJLFFBQVEsRUFBRSxDQUFDLENBQUM7eUJBQ2hFO3FCQUNGO2lCQUNGOzs7OzRCQTVDRDs7U0E2Q2EsaUJBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FQUF9JRF9SQU5ET01fUFJPVklERVJ9IGZyb20gJy4vYXBwbGljYXRpb25fdG9rZW5zJztcbmltcG9ydCB7SXRlcmFibGVEaWZmZXJzLCBLZXlWYWx1ZURpZmZlcnMsIGRlZmF1bHRJdGVyYWJsZURpZmZlcnMsIGRlZmF1bHRLZXlWYWx1ZURpZmZlcnN9IGZyb20gJy4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0aW9uJztcbmltcG9ydCB7SW5qZWN0LCBPcHRpb25hbCwgU2tpcFNlbGZ9IGZyb20gJy4vZGkvbWV0YWRhdGEnO1xuaW1wb3J0IHtBUFBfUk9PVH0gZnJvbSAnLi9kaS9zY29wZSc7XG5pbXBvcnQge0xPQ0FMRV9JRH0gZnJvbSAnLi9pMThuL3Rva2Vucyc7XG5pbXBvcnQge05nTW9kdWxlfSBmcm9tICcuL21ldGFkYXRhJztcblxuZXhwb3J0IGZ1bmN0aW9uIF9pdGVyYWJsZURpZmZlcnNGYWN0b3J5KCkge1xuICByZXR1cm4gZGVmYXVsdEl0ZXJhYmxlRGlmZmVycztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9rZXlWYWx1ZURpZmZlcnNGYWN0b3J5KCkge1xuICByZXR1cm4gZGVmYXVsdEtleVZhbHVlRGlmZmVycztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9sb2NhbGVGYWN0b3J5KGxvY2FsZT86IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBsb2NhbGUgfHwgJ2VuLVVTJztcbn1cblxuLyoqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbkBOZ01vZHVsZSh7XG4gIHByb3ZpZGVyczogW1xuICAgIEFQUF9JRF9SQU5ET01fUFJPVklERVIsXG4gICAgLy8gd2VuLXdvcmtlcnMgbmVlZCB0aGlzIHZhbHVlIHRvIGJlIGhlcmUgc2luY2UgV29ya2VyQXBwIGlzIGRlZmluZWRcbiAgICAvLyBvbnRvcCBvZiB0aGlzIGFwcGxpY2F0aW9uXG4gICAge3Byb3ZpZGU6IEFQUF9ST09ULCB1c2VWYWx1ZTogdHJ1ZX0sXG4gICAge3Byb3ZpZGU6IEl0ZXJhYmxlRGlmZmVycywgdXNlRmFjdG9yeTogX2l0ZXJhYmxlRGlmZmVyc0ZhY3Rvcnl9LFxuICAgIHtwcm92aWRlOiBLZXlWYWx1ZURpZmZlcnMsIHVzZUZhY3Rvcnk6IF9rZXlWYWx1ZURpZmZlcnNGYWN0b3J5fSxcbiAgICB7XG4gICAgICBwcm92aWRlOiBMT0NBTEVfSUQsXG4gICAgICB1c2VGYWN0b3J5OiBfbG9jYWxlRmFjdG9yeSxcbiAgICAgIGRlcHM6IFtbbmV3IEluamVjdChMT0NBTEVfSUQpLCBuZXcgT3B0aW9uYWwoKSwgbmV3IFNraXBTZWxmKCldXVxuICAgIH0sXG4gIF1cbn0pXG5leHBvcnQgY2xhc3MgQXBwbGljYXRpb25Nb2R1bGUge1xufVxuIl19