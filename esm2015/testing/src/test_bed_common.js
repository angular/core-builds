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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdF9iZWRfY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy90ZXN0X2JlZF9jb21tb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsY0FBYyxFQUFpQixNQUFNLGVBQWUsQ0FBQzs7Ozs7O0FBTzdELE1BQU07Ozs7O0lBQ0osaUJBQWlCLENBQUMsYUFBcUIsS0FBSTtDQUM1Qzs7OztBQUtELGFBQWEsMEJBQTBCLEdBQ25DLElBQUksY0FBYyxDQUFZLDRCQUE0QixDQUFDLENBQUM7Ozs7QUFLaEUsYUFBYSx3QkFBd0IsR0FBRyxJQUFJLGNBQWMsQ0FBWSwwQkFBMEIsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGlvblRva2VuLCBTY2hlbWFNZXRhZGF0YX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbi8qKlxuICogQW4gYWJzdHJhY3QgY2xhc3MgZm9yIGluc2VydGluZyB0aGUgcm9vdCB0ZXN0IGNvbXBvbmVudCBlbGVtZW50IGluIGEgcGxhdGZvcm0gaW5kZXBlbmRlbnQgd2F5LlxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGNsYXNzIFRlc3RDb21wb25lbnRSZW5kZXJlciB7XG4gIGluc2VydFJvb3RFbGVtZW50KHJvb3RFbGVtZW50SWQ6IHN0cmluZykge31cbn1cblxuLyoqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBjb25zdCBDb21wb25lbnRGaXh0dXJlQXV0b0RldGVjdCA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPGJvb2xlYW5bXT4oJ0NvbXBvbmVudEZpeHR1cmVBdXRvRGV0ZWN0Jyk7XG5cbi8qKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgY29uc3QgQ29tcG9uZW50Rml4dHVyZU5vTmdab25lID0gbmV3IEluamVjdGlvblRva2VuPGJvb2xlYW5bXT4oJ0NvbXBvbmVudEZpeHR1cmVOb05nWm9uZScpO1xuXG4vKipcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IHR5cGUgVGVzdE1vZHVsZU1ldGFkYXRhID0ge1xuICBwcm92aWRlcnM/OiBhbnlbXSxcbiAgZGVjbGFyYXRpb25zPzogYW55W10sXG4gIGltcG9ydHM/OiBhbnlbXSxcbiAgc2NoZW1hcz86IEFycmF5PFNjaGVtYU1ldGFkYXRhfGFueVtdPixcbiAgYW90U3VtbWFyaWVzPzogKCkgPT4gYW55W10sXG59O1xuIl19