/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { defineInjectable } from '../../di/defs';
import { inject } from '../../di/injector';
import { defineNgModule } from '../../metadata/ng_module';
import * as r3 from '../index';
/**
 * A mapping of the @angular/core API surface used in generated expressions to the actual symbols.
 *
 * This should be kept up to date with the public exports of @angular/core.
 */
export declare const angularCoreEnv: {
    'ɵdefineComponent': typeof r3.defineComponent;
    'defineInjectable': typeof defineInjectable;
    'ɵdefineNgModule': typeof defineNgModule;
    'ɵdirectiveInject': typeof r3.directiveInject;
    'inject': typeof inject;
    'ɵC': typeof r3.C;
    'ɵE': typeof r3.E;
    'ɵe': typeof r3.e;
    'ɵi1': typeof r3.i1;
    'ɵi2': typeof r3.i2;
    'ɵi3': typeof r3.i3;
    'ɵi4': typeof r3.i4;
    'ɵi5': typeof r3.i5;
    'ɵi6': typeof r3.i6;
    'ɵi7': typeof r3.i7;
    'ɵi8': typeof r3.i8;
    'ɵT': typeof r3.T;
    'ɵt': typeof r3.t;
};
