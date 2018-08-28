/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from '@angular/core';
/**
 * An abstract class for inserting the root test component element in a platform independent way.
 *
 * \@experimental
 */
export class TestComponentRenderer {
    /**
     * @param {?} rootElementId
     * @return {?}
     */
    insertRootElement(rootElementId) { }
}
/** *
 * \@experimental
  @type {?} */
export const ComponentFixtureAutoDetect = new InjectionToken('ComponentFixtureAutoDetect');
/** *
 * \@experimental
  @type {?} */
export const ComponentFixtureNoNgZone = new InjectionToken('ComponentFixtureNoNgZone');
/** @typedef {?} */
var TestModuleMetadata;
export { TestModuleMetadata };
/**
 * Static methods implemented by the `TestBedViewEngine` and `TestBedRender3`
 * @record
 */
export function TestBedStatic() { }
/* TODO: handle strange member:
new (...args: any[]): TestBed;
*/
/** @type {?} */
TestBedStatic.prototype.initTestEnvironment;
/**
 * Reset the providers for the test injector.
 *
 * \@experimental
 * @type {?}
 */
TestBedStatic.prototype.resetTestEnvironment;
/** @type {?} */
TestBedStatic.prototype.resetTestingModule;
/**
 * Allows overriding default compiler providers and settings
 * which are defined in test_injector.js
 * @type {?}
 */
TestBedStatic.prototype.configureCompiler;
/**
 * Allows overriding default providers, directives, pipes, modules of the test injector,
 * which are defined in test_injector.js
 * @type {?}
 */
TestBedStatic.prototype.configureTestingModule;
/**
 * Compile components with a `templateUrl` for the test's NgModule.
 * It is necessary to call this function
 * as fetching urls is asynchronous.
 * @type {?}
 */
TestBedStatic.prototype.compileComponents;
/** @type {?} */
TestBedStatic.prototype.overrideModule;
/** @type {?} */
TestBedStatic.prototype.overrideComponent;
/** @type {?} */
TestBedStatic.prototype.overrideDirective;
/** @type {?} */
TestBedStatic.prototype.overridePipe;
/** @type {?} */
TestBedStatic.prototype.overrideTemplate;
/**
 * Overrides the template of the given component, compiling the template
 * in the context of the TestingModule.
 *
 * Note: This works for JIT and AOTed components as well.
 * @type {?}
 */
TestBedStatic.prototype.overrideTemplateUsingTestingModule;
/**
 * Overwrites all providers for the given token with the given provider definition.
 *
 * Note: This works for JIT and AOTed components as well.
 * @type {?}
 */
TestBedStatic.prototype.overrideProvider;
/** @type {?} */
TestBedStatic.prototype.overrideProvider;
/** @type {?} */
TestBedStatic.prototype.overrideProvider;
/**
 * Overwrites all providers for the given token with the given provider definition.
 *
 * @deprecated as it makes all NgModules lazy. Introduced only for migrating off of it.
 * @type {?}
 */
TestBedStatic.prototype.deprecatedOverrideProvider;
/** @type {?} */
TestBedStatic.prototype.deprecatedOverrideProvider;
/** @type {?} */
TestBedStatic.prototype.deprecatedOverrideProvider;
/** @type {?} */
TestBedStatic.prototype.get;
/** @type {?} */
TestBedStatic.prototype.createComponent;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdF9iZWRfY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy90ZXN0X2JlZF9jb21tb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQXVCLGNBQWMsRUFBb0QsTUFBTSxlQUFlLENBQUM7Ozs7OztBQVd0SCxNQUFNLE9BQU8scUJBQXFCOzs7OztJQUNoQyxpQkFBaUIsQ0FBQyxhQUFxQixLQUFJO0NBQzVDOzs7O0FBS0QsYUFBYSwwQkFBMEIsR0FDbkMsSUFBSSxjQUFjLENBQVksNEJBQTRCLENBQUMsQ0FBQzs7OztBQUtoRSxhQUFhLHdCQUF3QixHQUFHLElBQUksY0FBYyxDQUFZLDBCQUEwQixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q29tcG9uZW50LCBEaXJlY3RpdmUsIEluamVjdGlvblRva2VuLCBOZ01vZHVsZSwgUGlwZSwgUGxhdGZvcm1SZWYsIFNjaGVtYU1ldGFkYXRhLCBUeXBlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtDb21wb25lbnRGaXh0dXJlfSBmcm9tICcuL2NvbXBvbmVudF9maXh0dXJlJztcbmltcG9ydCB7TWV0YWRhdGFPdmVycmlkZX0gZnJvbSAnLi9tZXRhZGF0YV9vdmVycmlkZSc7XG5pbXBvcnQge1Rlc3RCZWR9IGZyb20gJy4vdGVzdF9iZWQnO1xuXG4vKipcbiAqIEFuIGFic3RyYWN0IGNsYXNzIGZvciBpbnNlcnRpbmcgdGhlIHJvb3QgdGVzdCBjb21wb25lbnQgZWxlbWVudCBpbiBhIHBsYXRmb3JtIGluZGVwZW5kZW50IHdheS5cbiAqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBjbGFzcyBUZXN0Q29tcG9uZW50UmVuZGVyZXIge1xuICBpbnNlcnRSb290RWxlbWVudChyb290RWxlbWVudElkOiBzdHJpbmcpIHt9XG59XG5cbi8qKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgY29uc3QgQ29tcG9uZW50Rml4dHVyZUF1dG9EZXRlY3QgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjxib29sZWFuW10+KCdDb21wb25lbnRGaXh0dXJlQXV0b0RldGVjdCcpO1xuXG4vKipcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGNvbnN0IENvbXBvbmVudEZpeHR1cmVOb05nWm9uZSA9IG5ldyBJbmplY3Rpb25Ub2tlbjxib29sZWFuW10+KCdDb21wb25lbnRGaXh0dXJlTm9OZ1pvbmUnKTtcblxuLyoqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCB0eXBlIFRlc3RNb2R1bGVNZXRhZGF0YSA9IHtcbiAgcHJvdmlkZXJzPzogYW55W10sXG4gIGRlY2xhcmF0aW9ucz86IGFueVtdLFxuICBpbXBvcnRzPzogYW55W10sXG4gIHNjaGVtYXM/OiBBcnJheTxTY2hlbWFNZXRhZGF0YXxhbnlbXT4sXG4gIGFvdFN1bW1hcmllcz86ICgpID0+IGFueVtdLFxufTtcblxuLyoqXG4gKiBTdGF0aWMgbWV0aG9kcyBpbXBsZW1lbnRlZCBieSB0aGUgYFRlc3RCZWRWaWV3RW5naW5lYCBhbmQgYFRlc3RCZWRSZW5kZXIzYFxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRlc3RCZWRTdGF0aWMge1xuICBuZXcgKC4uLmFyZ3M6IGFueVtdKTogVGVzdEJlZDtcblxuICBpbml0VGVzdEVudmlyb25tZW50KFxuICAgICAgbmdNb2R1bGU6IFR5cGU8YW55PnxUeXBlPGFueT5bXSwgcGxhdGZvcm06IFBsYXRmb3JtUmVmLCBhb3RTdW1tYXJpZXM/OiAoKSA9PiBhbnlbXSk6IFRlc3RCZWQ7XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSBwcm92aWRlcnMgZm9yIHRoZSB0ZXN0IGluamVjdG9yLlxuICAgKlxuICAgKiBAZXhwZXJpbWVudGFsXG4gICAqL1xuICByZXNldFRlc3RFbnZpcm9ubWVudCgpOiB2b2lkO1xuXG4gIHJlc2V0VGVzdGluZ01vZHVsZSgpOiBUZXN0QmVkU3RhdGljO1xuXG4gIC8qKlxuICAgKiBBbGxvd3Mgb3ZlcnJpZGluZyBkZWZhdWx0IGNvbXBpbGVyIHByb3ZpZGVycyBhbmQgc2V0dGluZ3NcbiAgICogd2hpY2ggYXJlIGRlZmluZWQgaW4gdGVzdF9pbmplY3Rvci5qc1xuICAgKi9cbiAgY29uZmlndXJlQ29tcGlsZXIoY29uZmlnOiB7cHJvdmlkZXJzPzogYW55W107IHVzZUppdD86IGJvb2xlYW47fSk6IFRlc3RCZWRTdGF0aWM7XG5cbiAgLyoqXG4gICAqIEFsbG93cyBvdmVycmlkaW5nIGRlZmF1bHQgcHJvdmlkZXJzLCBkaXJlY3RpdmVzLCBwaXBlcywgbW9kdWxlcyBvZiB0aGUgdGVzdCBpbmplY3RvcixcbiAgICogd2hpY2ggYXJlIGRlZmluZWQgaW4gdGVzdF9pbmplY3Rvci5qc1xuICAgKi9cbiAgY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSk6IFRlc3RCZWRTdGF0aWM7XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgY29tcG9uZW50cyB3aXRoIGEgYHRlbXBsYXRlVXJsYCBmb3IgdGhlIHRlc3QncyBOZ01vZHVsZS5cbiAgICogSXQgaXMgbmVjZXNzYXJ5IHRvIGNhbGwgdGhpcyBmdW5jdGlvblxuICAgKiBhcyBmZXRjaGluZyB1cmxzIGlzIGFzeW5jaHJvbm91cy5cbiAgICovXG4gIGNvbXBpbGVDb21wb25lbnRzKCk6IFByb21pc2U8YW55PjtcblxuICBvdmVycmlkZU1vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT4pOiBUZXN0QmVkU3RhdGljO1xuXG4gIG92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudDogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxDb21wb25lbnQ+KTogVGVzdEJlZFN0YXRpYztcblxuICBvdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8RGlyZWN0aXZlPik6IFRlc3RCZWRTdGF0aWM7XG5cbiAgb3ZlcnJpZGVQaXBlKHBpcGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8UGlwZT4pOiBUZXN0QmVkU3RhdGljO1xuXG4gIG92ZXJyaWRlVGVtcGxhdGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiBUZXN0QmVkU3RhdGljO1xuXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgdGhlIHRlbXBsYXRlIG9mIHRoZSBnaXZlbiBjb21wb25lbnQsIGNvbXBpbGluZyB0aGUgdGVtcGxhdGVcbiAgICogaW4gdGhlIGNvbnRleHQgb2YgdGhlIFRlc3RpbmdNb2R1bGUuXG4gICAqXG4gICAqIE5vdGU6IFRoaXMgd29ya3MgZm9yIEpJVCBhbmQgQU9UZWQgY29tcG9uZW50cyBhcyB3ZWxsLlxuICAgKi9cbiAgb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IFRlc3RCZWRTdGF0aWM7XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZXMgYWxsIHByb3ZpZGVycyBmb3IgdGhlIGdpdmVuIHRva2VuIHdpdGggdGhlIGdpdmVuIHByb3ZpZGVyIGRlZmluaXRpb24uXG4gICAqXG4gICAqIE5vdGU6IFRoaXMgd29ya3MgZm9yIEpJVCBhbmQgQU9UZWQgY29tcG9uZW50cyBhcyB3ZWxsLlxuICAgKi9cbiAgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk6IEZ1bmN0aW9uLFxuICAgIGRlcHM6IGFueVtdLFxuICB9KTogVGVzdEJlZFN0YXRpYztcbiAgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZVZhbHVlOiBhbnk7fSk6IFRlc3RCZWRTdGF0aWM7XG4gIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5PzogRnVuY3Rpb24sXG4gICAgdXNlVmFsdWU/OiBhbnksXG4gICAgZGVwcz86IGFueVtdLFxuICB9KTogVGVzdEJlZFN0YXRpYztcblxuICAvKipcbiAgICogT3ZlcndyaXRlcyBhbGwgcHJvdmlkZXJzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gd2l0aCB0aGUgZ2l2ZW4gcHJvdmlkZXIgZGVmaW5pdGlvbi5cbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgYXMgaXQgbWFrZXMgYWxsIE5nTW9kdWxlcyBsYXp5LiBJbnRyb2R1Y2VkIG9ubHkgZm9yIG1pZ3JhdGluZyBvZmYgb2YgaXQuXG4gICAqL1xuICBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk6IEZ1bmN0aW9uLFxuICAgIGRlcHM6IGFueVtdLFxuICB9KTogdm9pZDtcbiAgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VWYWx1ZTogYW55O30pOiB2b2lkO1xuICBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk/OiBGdW5jdGlvbixcbiAgICB1c2VWYWx1ZT86IGFueSxcbiAgICBkZXBzPzogYW55W10sXG4gIH0pOiBUZXN0QmVkU3RhdGljO1xuXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuXG4gIGNyZWF0ZUNvbXBvbmVudDxUPihjb21wb25lbnQ6IFR5cGU8VD4pOiBDb21wb25lbnRGaXh0dXJlPFQ+O1xufVxuIl19