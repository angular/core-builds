import { InjectionToken } from './di';
import * as i0 from "./r3_symbols";
/**
 * A function that will be executed when an application is initialized.
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
    static ngInjectableDef: i0.InjectableDef<ApplicationInitStatus>;
}
