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
/**
 * @module
 * @description
 * Entry point for all public APIs of the core/testing package.
 */
export { async } from './async';
export { ComponentFixture } from './component_fixture';
export { resetFakeAsyncZone, fakeAsync, tick, flush, discardPeriodicTasks, flushMicrotasks } from './fake_async';
export { inject, withModule, TestBedViewEngine, TestBed, getTestBed, InjectSetupWrapper } from './test_bed';
export { TestComponentRenderer, ComponentFixtureAutoDetect, ComponentFixtureNoNgZone } from './test_bed_common';
export { _getTestBedRender3, TestBedRender3 } from './r3_test_bed';
export { __core_private_testing_placeholder__ } from './before_each';
export { MetadataOverrider } from './metadata_overrider';
export { ɵTestingCompiler, ɵTestingCompilerFactory } from './private_export_testing';

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvdGVzdGluZy9zcmMvdGVzdGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBY0Esc0JBQWMsU0FBUyxDQUFDO0FBQ3hCLGlDQUFjLHFCQUFxQixDQUFDO0FBQ3BDLGtHQUFjLGNBQWMsQ0FBQztBQUM3QiwrRkFBYyxZQUFZLENBQUM7QUFDM0IsNEZBQWMsbUJBQW1CLENBQUM7QUFDbEMsbURBQWMsZUFBZSxDQUFDO0FBQzlCLHFEQUFjLGVBQWUsQ0FBQztBQUU5QixrQ0FBYyxzQkFBc0IsQ0FBQztBQUNyQywwREFBYywwQkFBMEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqXG4gKiBAbW9kdWxlXG4gKiBAZGVzY3JpcHRpb25cbiAqIEVudHJ5IHBvaW50IGZvciBhbGwgcHVibGljIEFQSXMgb2YgdGhlIGNvcmUvdGVzdGluZyBwYWNrYWdlLlxuICovXG5cbmV4cG9ydCAqIGZyb20gJy4vYXN5bmMnO1xuZXhwb3J0ICogZnJvbSAnLi9jb21wb25lbnRfZml4dHVyZSc7XG5leHBvcnQgKiBmcm9tICcuL2Zha2VfYXN5bmMnO1xuZXhwb3J0ICogZnJvbSAnLi90ZXN0X2JlZCc7XG5leHBvcnQgKiBmcm9tICcuL3Rlc3RfYmVkX2NvbW1vbic7XG5leHBvcnQgKiBmcm9tICcuL3IzX3Rlc3RfYmVkJztcbmV4cG9ydCAqIGZyb20gJy4vYmVmb3JlX2VhY2gnO1xuZXhwb3J0ICogZnJvbSAnLi9tZXRhZGF0YV9vdmVycmlkZSc7XG5leHBvcnQgKiBmcm9tICcuL21ldGFkYXRhX292ZXJyaWRlcic7XG5leHBvcnQgKiBmcm9tICcuL3ByaXZhdGVfZXhwb3J0X3Rlc3RpbmcnO1xuIl19