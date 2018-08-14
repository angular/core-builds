/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken, SchemaMetadata } from '@angular/core';
/**
 * An abstract class for inserting the root test component element in a platform independent way.
 *
 * @experimental
 */
export declare class TestComponentRenderer {
    insertRootElement(rootElementId: string): void;
}
/**
 * @experimental
 */
export declare const ComponentFixtureAutoDetect: InjectionToken<boolean[]>;
/**
 * @experimental
 */
export declare const ComponentFixtureNoNgZone: InjectionToken<boolean[]>;
/**
 * @experimental
 */
export declare type TestModuleMetadata = {
    providers?: any[];
    declarations?: any[];
    imports?: any[];
    schemas?: Array<SchemaMetadata | any[]>;
    aotSummaries?: () => any[];
};
