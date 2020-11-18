/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '.';
export declare class NullInjector implements Injector {
    get(token: any, notFoundValue?: any): any;
}
