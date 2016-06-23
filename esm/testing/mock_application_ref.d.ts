/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ApplicationRef, ComponentFactory, ComponentRef, Injector, NgZone, Type } from '../index';
/**
 * A no-op implementation of {@link ApplicationRef}, useful for testing.
 */
export declare class MockApplicationRef extends ApplicationRef {
    registerBootstrapListener(listener: (ref: ComponentRef<any>) => void): void;
    registerDisposeListener(dispose: () => void): void;
    bootstrap<C>(componentFactory: ComponentFactory<C>): ComponentRef<C>;
    readonly injector: Injector;
    readonly zone: NgZone;
    run(callback: Function): any;
    waitForAsyncInitializers(): Promise<any>;
    dispose(): void;
    tick(): void;
    readonly componentTypes: Type[];
}
