import { IterableDiffers, KeyValueDiffers } from './change_detection/change_detection';
import { Type } from './type';
export declare function _iterableDiffersFactory(): IterableDiffers;
export declare function _keyValueDiffersFactory(): KeyValueDiffers;
/**
 * A default set of providers which should be included in any Angular
 * application, regardless of the platform it runs onto.
 *
 * @deprecated Include `ApplicationModule` instead.
 */
export declare const APPLICATION_COMMON_PROVIDERS: Array<Type<any> | {
    [k: string]: any;
} | any[]>;
/**
 * This module includes the providers of @angular/core that are needed
 * to bootstrap components via `ApplicationRef`.
 *
 * @experimental
 */
export declare class ApplicationModule {
}
