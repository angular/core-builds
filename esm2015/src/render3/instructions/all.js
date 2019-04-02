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
export { allocHostVars } from './alloc_host_vars';
export { detectChanges, markDirty, tick } from './change_detection';
export { container, template, containerRefreshStart, containerRefreshEnd } from './container';
export { store, reference, load } from './storage';
export { directiveInject, injectAttribute } from './di';
export { elementStart, elementEnd, element, elementAttribute, elementHostAttrs } from './element';
export { elementContainerStart, elementContainerEnd } from './element_container';
export { embeddedViewStart, embeddedViewEnd } from './embedded_view';
export { getCurrentView } from './get_current_view';
export { listener, componentHostSyntheticListener } from './listener';
export { namespaceHTML, namespaceMathML, namespaceSVG } from './namespace';
export { nextContext } from './next_context';
export { projectionDef, projection } from './projection';
export { property, bind, elementProperty, componentHostSyntheticProperty } from './property';
export { interpolationV, interpolation1, interpolation2, interpolation3, interpolation4, interpolation5, interpolation6, interpolation7, interpolation8 } from './property_interpolation';
export { select } from './select';
export { elementStyling, elementHostStyling, elementStyleProp, elementHostStyleProp, elementClassProp, elementHostClassProp, elementStylingMap, elementHostStylingMap, elementStylingApply, elementHostStylingApply, elementStylingApplyInternal } from './styling_instructions';
export { text, textBinding } from './text';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvYWxsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTJCQSw4QkFBYyxtQkFBbUIsQ0FBQztBQUNsQywrQ0FBYyxvQkFBb0IsQ0FBQztBQUNuQyxnRkFBYyxhQUFhLENBQUM7QUFDNUIsdUNBQWMsV0FBVyxDQUFDO0FBQzFCLGlEQUFjLE1BQU0sQ0FBQztBQUNyQixzRkFBYyxXQUFXLENBQUM7QUFDMUIsMkRBQWMscUJBQXFCLENBQUM7QUFDcEMsbURBQWMsaUJBQWlCLENBQUM7QUFDaEMsK0JBQWMsb0JBQW9CLENBQUM7QUFDbkMseURBQWMsWUFBWSxDQUFDO0FBQzNCLDZEQUFjLGFBQWEsQ0FBQztBQUM1Qiw0QkFBYyxnQkFBZ0IsQ0FBQztBQUMvQiwwQ0FBYyxjQUFjLENBQUM7QUFDN0IsZ0ZBQWMsWUFBWSxDQUFDO0FBQzNCLCtKQUFjLDBCQUEwQixDQUFDO0FBQ3pDLHVCQUFjLFVBQVUsQ0FBQztBQUN6Qix3UEFBYyx3QkFBd0IsQ0FBQztBQUN2QyxrQ0FBYyxRQUFRLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qXG4gKiBUaGlzIGZpbGUgcmUtZXhwb3J0cyBhbGwgc3ltYm9scyBjb250YWluZWQgaW4gdGhpcyBkaXJlY3RvcnkuXG4gKlxuICogV2h5IGlzIHRoaXMgZmlsZSBub3QgYGluZGV4LnRzYD9cbiAqXG4gKiBUaGVyZSBzZWVtcyB0byBiZSBhbiBpbmNvbnNpc3RlbnQgcGF0aCByZXNvbHV0aW9uIG9mIGFuIGBpbmRleC50c2AgZmlsZVxuICogd2hlbiBvbmx5IHRoZSBwYXJlbnQgZGlyZWN0b3J5IGlzIHJlZmVyZW5jZWQuIFRoaXMgY291bGQgYmUgZHVlIHRvIHRoZVxuICogbm9kZSBtb2R1bGUgcmVzb2x1dGlvbiBjb25maWd1cmF0aW9uIGRpZmZlcmluZyBmcm9tIHJvbGx1cCBhbmQvb3IgdHlwZXNjcmlwdC5cbiAqXG4gKiBXaXRoIGNvbW1pdFxuICogaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9jb21taXQvZDVlM2YyYzY0YmQxM2NlODNlN2M3MDc4OGI3ZmM1MTRjYTRhOTkxOFxuICogdGhlIGBpbnN0cnVjdGlvbnMudHNgIGZpbGUgd2FzIG1vdmVkIHRvIGBpbnN0cnVjdGlvbnMvaW5zdHJ1Y3Rpb25zLnRzYCBhbmQgYW5cbiAqIGBpbmRleC50c2AgZmlsZSB3YXMgdXNlZCB0byByZS1leHBvcnQgZXZlcnl0aGluZy4gSGF2aW5nIGhhZCBmaWxlIG5hbWVzIHRoYXQgd2VyZVxuICogaW1wb3J0aW5nIGZyb20gYGluc3RydWN0aW9ucycgZGlyZWN0bHkgKG5vdCB0aGUgZnJvbSB0aGUgc3ViIGZpbGUgb3IgdGhlIGBpbmRleC50c2BcbiAqIGZpbGUpIGNhdXNlZCBzdHJhbmdlIENJIGlzc3Vlcy4gYGluZGV4LnRzYCBoYWQgdG8gYmUgcmVuYW1lZCB0byBgYWxsLnRzYCBmb3IgdGhpc1xuICogdG8gd29yay5cbiAqXG4gKiBKaXJhIElzc3VlID0gRlctMTE4NFxuICovXG5leHBvcnQgKiBmcm9tICcuL2FsbG9jX2hvc3RfdmFycyc7XG5leHBvcnQgKiBmcm9tICcuL2NoYW5nZV9kZXRlY3Rpb24nO1xuZXhwb3J0ICogZnJvbSAnLi9jb250YWluZXInO1xuZXhwb3J0ICogZnJvbSAnLi9zdG9yYWdlJztcbmV4cG9ydCAqIGZyb20gJy4vZGknO1xuZXhwb3J0ICogZnJvbSAnLi9lbGVtZW50JztcbmV4cG9ydCAqIGZyb20gJy4vZWxlbWVudF9jb250YWluZXInO1xuZXhwb3J0ICogZnJvbSAnLi9lbWJlZGRlZF92aWV3JztcbmV4cG9ydCAqIGZyb20gJy4vZ2V0X2N1cnJlbnRfdmlldyc7XG5leHBvcnQgKiBmcm9tICcuL2xpc3RlbmVyJztcbmV4cG9ydCAqIGZyb20gJy4vbmFtZXNwYWNlJztcbmV4cG9ydCAqIGZyb20gJy4vbmV4dF9jb250ZXh0JztcbmV4cG9ydCAqIGZyb20gJy4vcHJvamVjdGlvbic7XG5leHBvcnQgKiBmcm9tICcuL3Byb3BlcnR5JztcbmV4cG9ydCAqIGZyb20gJy4vcHJvcGVydHlfaW50ZXJwb2xhdGlvbic7XG5leHBvcnQgKiBmcm9tICcuL3NlbGVjdCc7XG5leHBvcnQgKiBmcm9tICcuL3N0eWxpbmdfaW5zdHJ1Y3Rpb25zJztcbmV4cG9ydCAqIGZyb20gJy4vdGV4dCc7XG4iXX0=