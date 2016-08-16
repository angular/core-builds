/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Type } from '../src/facade/lang';
import { IterableDiffers, KeyValueDiffers } from './change_detection/change_detection';
import { ComponentFactoryResolver } from './linker/component_factory_resolver';
export declare function _componentFactoryResolverFactory(): ComponentFactoryResolver;
export declare function _iterableDiffersFactory(): IterableDiffers;
export declare function _keyValueDiffersFactory(): KeyValueDiffers;
/**
 * A default set of providers which should be included in any Angular
 * application, regardless of the platform it runs onto.
 * @stable
 */
export declare const APPLICATION_COMMON_PROVIDERS: Array<Type | {
    [k: string]: any;
} | any[]>;
