import { InjectionToken } from './di';
import * as i0 from "./r3_symbols";
/**
 * An injection token that allows you to provide one or more initialization functions.
 * These function are injected at application startup and executed during
 * app initialization. If any of these functions returns a Promise, initialization
 * does not complete until the Promise is resolved.
 *
 * You can, for example, create a factory function that loads language data
 * or an external configuration, and provide that function to the `APP_INITIALIZER` token.
 * That way, the function is executed during the application bootstrap process,
 * and the needed data is available on startup.
 *
 * @publicApi
 */
export declare const APP_INITIALIZER: InjectionToken<(() => void)[]>;
/**
 * A class that reflects the state of running {@link APP_INITIALIZER}s.
 *
 * @publicApi
 */
export declare class ApplicationInitStatus {
    private appInits;
    private resolve;
    private reject;
    private initialized;
    readonly donePromise: Promise<any>;
    readonly done = false;
    constructor(appInits: (() => any)[]);
    static ɵfac: i0.ɵɵFactoryDef<ApplicationInitStatus, [{ optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDef<ApplicationInitStatus>;
}
