/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ApplicationRef, ApplicationRef_, isDevMode } from './application_ref';
import { APP_ID_RANDOM_PROVIDER } from './application_tokens';
import { IterableDiffers, KeyValueDiffers, defaultIterableDiffers, defaultKeyValueDiffers } from './change_detection/change_detection';
import { OptionalMetadata, SkipSelfMetadata } from './di';
import { Compiler } from './linker/compiler';
import { ComponentResolver } from './linker/component_resolver';
import { DynamicComponentLoader, DynamicComponentLoader_ } from './linker/dynamic_component_loader';
import { ViewUtils } from './linker/view_utils';
import { NgModule } from './metadata';
import { NgZone } from './zone/ng_zone';
let __unused; // avoid unused import when Type union types are erased
export function _iterableDiffersFactory() {
    return defaultIterableDiffers;
}
export function _keyValueDiffersFactory() {
    return defaultKeyValueDiffers;
}
export function createNgZone(parent) {
    // If an NgZone is already present in the parent injector,
    // use that one. Creating the NgZone in the same injector as the
    // application is dangerous as some services might get created before
    // the NgZone has been created.
    // We keep the NgZone factory in the application providers for
    // backwards compatibility for now though.
    if (parent) {
        return parent;
    }
    return new NgZone({ enableLongStackTrace: isDevMode() });
}
/**
 * A default set of providers which should be included in any Angular
 * application, regardless of the platform it runs onto.
 *
 * @deprecated Include `ApplicationModule` instead.
 */
export const APPLICATION_COMMON_PROVIDERS = [];
export class ApplicationModule {
}
/** @nocollapse */
ApplicationModule.decorators = [
    { type: NgModule, args: [{
                providers: [
                    {
                        provide: NgZone,
                        useFactory: createNgZone,
                        deps: [[new SkipSelfMetadata(), new OptionalMetadata(), NgZone]]
                    },
                    ApplicationRef_,
                    { provide: ApplicationRef, useExisting: ApplicationRef_ },
                    Compiler,
                    { provide: ComponentResolver, useExisting: Compiler },
                    APP_ID_RANDOM_PROVIDER,
                    ViewUtils,
                    { provide: IterableDiffers, useFactory: _iterableDiffersFactory },
                    { provide: KeyValueDiffers, useFactory: _keyValueDiffersFactory },
                    { provide: DynamicComponentLoader, useClass: DynamicComponentLoader_ },
                ]
            },] },
];
//# sourceMappingURL=application_module.js.map