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
export { jasmineAwait } from './jasmine_await';
export { ComponentFixture } from './component_fixture';
export { resetFakeAsyncZone, fakeAsync, tick, flush, discardPeriodicTasks, flushMicrotasks } from './fake_async';
export { getTestBed, inject, withModule, TestComponentRenderer, ComponentFixtureAutoDetect, ComponentFixtureNoNgZone, TestBed, InjectSetupWrapper } from './test_bed';
export { __core_private_testing_placeholder__ } from './before_each';
export { ɵTestingCompiler, ɵTestingCompilerFactory } from './private_export_testing';
export { withBody, ensureDocument, cleanupDocument } from './render3';

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvdGVzdGluZy9zcmMvdGVzdGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBY0Esc0JBQWMsU0FBUyxDQUFDO0FBQ3hCLDZCQUFjLGlCQUFpQixDQUFDO0FBQ2hDLGlDQUFjLHFCQUFxQixDQUFDO0FBQ3BDLGtHQUFjLGNBQWMsQ0FBQztBQUM3Qix5SkFBYyxZQUFZLENBQUM7QUFDM0IscURBQWMsZUFBZSxDQUFDO0FBRTlCLDBEQUFjLDBCQUEwQixDQUFDO0FBQ3pDLDBEQUFjLFdBQVcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqXG4gKiBAbW9kdWxlXG4gKiBAZGVzY3JpcHRpb25cbiAqIEVudHJ5IHBvaW50IGZvciBhbGwgcHVibGljIEFQSXMgb2YgdGhlIGNvcmUvdGVzdGluZyBwYWNrYWdlLlxuICovXG5cbmV4cG9ydCAqIGZyb20gJy4vYXN5bmMnO1xuZXhwb3J0ICogZnJvbSAnLi9qYXNtaW5lX2F3YWl0JztcbmV4cG9ydCAqIGZyb20gJy4vY29tcG9uZW50X2ZpeHR1cmUnO1xuZXhwb3J0ICogZnJvbSAnLi9mYWtlX2FzeW5jJztcbmV4cG9ydCAqIGZyb20gJy4vdGVzdF9iZWQnO1xuZXhwb3J0ICogZnJvbSAnLi9iZWZvcmVfZWFjaCc7XG5leHBvcnQgKiBmcm9tICcuL21ldGFkYXRhX292ZXJyaWRlJztcbmV4cG9ydCAqIGZyb20gJy4vcHJpdmF0ZV9leHBvcnRfdGVzdGluZyc7XG5leHBvcnQgKiBmcm9tICcuL3JlbmRlcjMnO1xuIl19