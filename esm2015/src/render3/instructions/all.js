/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/*
 * This file re-exports all symbols contained in this directory.
 *
 * Why is this file not `index.ts`?
 *
 * There seems to be an inconsistent path resolution of an `index.ts` file
 * when only the parent directory is referenced. This could be due to the
 * node module resolution configuration differing from rollup and/or typescript.
 *
 * With commit
 * https://github.com/angular/angular/commit/d5e3f2c64bd13ce83e7c70788b7fc514ca4a9918
 * the `instructions.ts` file was moved to `instructions/instructions.ts` and an
 * `index.ts` file was used to re-export everything. Having had file names that were
 * importing from `instructions' directly (not the from the sub file or the `index.ts`
 * file) caused strange CI issues. `index.ts` had to be renamed to `all.ts` for this
 * to work.
 *
 * Jira Issue = FW-1184
 */
export { refreshDescendantViews, setHostBindings, createLView, createNodeAtIndex, assignTViewNodeToLView, allocExpando, renderTemplate, createEmbeddedViewAndNode, renderEmbeddedTemplate, nextContext, namespaceSVG, namespaceMathML, namespaceHTML, element, elementContainerStart, elementContainerEnd, elementStart, elementCreate, getOrCreateTView, createTView, createError, locateHostElement, listener, componentHostSyntheticListener, storeCleanupWithContext, storeCleanupFn, elementEnd, select, elementAttribute, property, elementProperty, componentHostSyntheticProperty, createTNode, elementHostAttrs, text, textBinding, instantiateRootComponent, invokeHostBindingsInCreationMode, generateExpandoInstructionBlock, queueComponentIndexForCheck, initNodeFlags, createLContainer, template, container, containerRefreshStart, containerRefreshEnd, embeddedViewStart, embeddedViewEnd, componentRefresh, projectionDef, projection, addToViewTree, markViewDirty, tick, scheduleTick, detectChanges, detectChangesInternal, detectChangesInRootView, checkNoChanges, checkNoChangesInternal, checkNoChangesInRootView, checkView, markDirty, bind, allocHostVars, interpolationV, interpolation1, interpolation2, interpolation3, interpolation4, interpolation5, interpolation6, interpolation7, interpolation8, store, reference, load, directiveInject, injectAttribute, getCurrentView, CLEAN_PROMISE } from './instructions';
export { elementStyling, elementHostStyling, elementStyleProp, elementHostStyleProp, elementClassProp, elementHostClassProp, elementStylingMap, elementHostStylingMap, elementStylingApply, elementHostStylingApply, elementStylingApplyInternal } from './styling_instructions';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvYWxsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTJCQSx1MkNBQWMsZ0JBQWdCLENBQUM7QUFDL0Isd1BBQWMsd0JBQXdCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qXG4gKiBUaGlzIGZpbGUgcmUtZXhwb3J0cyBhbGwgc3ltYm9scyBjb250YWluZWQgaW4gdGhpcyBkaXJlY3RvcnkuXG4gKlxuICogV2h5IGlzIHRoaXMgZmlsZSBub3QgYGluZGV4LnRzYD9cbiAqXG4gKiBUaGVyZSBzZWVtcyB0byBiZSBhbiBpbmNvbnNpc3RlbnQgcGF0aCByZXNvbHV0aW9uIG9mIGFuIGBpbmRleC50c2AgZmlsZVxuICogd2hlbiBvbmx5IHRoZSBwYXJlbnQgZGlyZWN0b3J5IGlzIHJlZmVyZW5jZWQuIFRoaXMgY291bGQgYmUgZHVlIHRvIHRoZVxuICogbm9kZSBtb2R1bGUgcmVzb2x1dGlvbiBjb25maWd1cmF0aW9uIGRpZmZlcmluZyBmcm9tIHJvbGx1cCBhbmQvb3IgdHlwZXNjcmlwdC5cbiAqXG4gKiBXaXRoIGNvbW1pdFxuICogaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9jb21taXQvZDVlM2YyYzY0YmQxM2NlODNlN2M3MDc4OGI3ZmM1MTRjYTRhOTkxOFxuICogdGhlIGBpbnN0cnVjdGlvbnMudHNgIGZpbGUgd2FzIG1vdmVkIHRvIGBpbnN0cnVjdGlvbnMvaW5zdHJ1Y3Rpb25zLnRzYCBhbmQgYW5cbiAqIGBpbmRleC50c2AgZmlsZSB3YXMgdXNlZCB0byByZS1leHBvcnQgZXZlcnl0aGluZy4gSGF2aW5nIGhhZCBmaWxlIG5hbWVzIHRoYXQgd2VyZVxuICogaW1wb3J0aW5nIGZyb20gYGluc3RydWN0aW9ucycgZGlyZWN0bHkgKG5vdCB0aGUgZnJvbSB0aGUgc3ViIGZpbGUgb3IgdGhlIGBpbmRleC50c2BcbiAqIGZpbGUpIGNhdXNlZCBzdHJhbmdlIENJIGlzc3Vlcy4gYGluZGV4LnRzYCBoYWQgdG8gYmUgcmVuYW1lZCB0byBgYWxsLnRzYCBmb3IgdGhpc1xuICogdG8gd29yay5cbiAqXG4gKiBKaXJhIElzc3VlID0gRlctMTE4NFxuICovXG5leHBvcnQgKiBmcm9tICcuL2luc3RydWN0aW9ucyc7XG5leHBvcnQgKiBmcm9tICcuL3N0eWxpbmdfaW5zdHJ1Y3Rpb25zJztcbiJdfQ==