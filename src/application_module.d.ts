/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ApplicationRef } from './application_ref';
import { IterableDiffers, KeyValueDiffers } from './change_detection/change_detection';
import { StaticProvider } from './di';
import { NgZone } from './zone';
export declare function _iterableDiffersFactory(): IterableDiffers;
export declare function _keyValueDiffersFactory(): KeyValueDiffers;
export declare function _localeFactory(locale?: string): string;
/**
 * A built-in [dependency injection token](guide/glossary#di-token)
 * that is used to configure the root injector for bootstrapping.
 */
export declare const APPLICATION_MODULE_PROVIDERS: StaticProvider[];
/**
 * Schedule work at next available slot.
 *
 * In Ivy this is just `requestAnimationFrame`. For compatibility reasons when bootstrapped
 * using `platformRef.bootstrap` we need to use `NgZone.onStable` as the scheduling mechanism.
 * This overrides the scheduling mechanism in Ivy to `NgZone.onStable`.
 *
 * @param ngZone NgZone to use for scheduling.
 */
export declare function zoneSchedulerFactory(ngZone: NgZone): (fn: () => void) => void;
/**
 * Configures the root injector for an app with
 * providers of `@angular/core` dependencies that `ApplicationRef` needs
 * to bootstrap components.
 *
 * Re-exported by `BrowserModule`, which is included automatically in the root
 * `AppModule` when you create a new app with the CLI `new` command.
 *
 * @publicApi
 */
export declare class ApplicationModule {
    constructor(appRef: ApplicationRef);
}
