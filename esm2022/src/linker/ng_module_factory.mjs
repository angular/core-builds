/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Represents an instance of an `NgModule` created by an `NgModuleFactory`.
 * Provides access to the `NgModule` instance and related objects.
 *
 * @publicApi
 */
export class NgModuleRef {
}
/**
 * @publicApi
 *
 * @deprecated
 * This class was mostly used as a part of ViewEngine-based JIT API and is no longer needed in Ivy
 * JIT mode. Angular provides APIs that accept NgModule classes directly (such as
 * [PlatformRef.bootstrapModule](api/core/PlatformRef#bootstrapModule) and
 * [createNgModule](api/core/createNgModule)), consider switching to those APIs instead of
 * using factory-based ones.
 */
export class NgModuleFactory {
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfbW9kdWxlX2ZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBUUg7Ozs7O0dBS0c7QUFDSCxNQUFNLE9BQWdCLFdBQVc7Q0FnQ2hDO0FBU0Q7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBTSxPQUFnQixlQUFlO0NBR3BDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7RW52aXJvbm1lbnRJbmplY3RvciwgUjNJbmplY3Rvcn0gZnJvbSAnLi4vZGkvcjNfaW5qZWN0b3InO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5cbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyfSBmcm9tICcuL2NvbXBvbmVudF9mYWN0b3J5X3Jlc29sdmVyJztcblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIGluc3RhbmNlIG9mIGFuIGBOZ01vZHVsZWAgY3JlYXRlZCBieSBhbiBgTmdNb2R1bGVGYWN0b3J5YC5cbiAqIFByb3ZpZGVzIGFjY2VzcyB0byB0aGUgYE5nTW9kdWxlYCBpbnN0YW5jZSBhbmQgcmVsYXRlZCBvYmplY3RzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5nTW9kdWxlUmVmPFQ+IHtcbiAgLyoqXG4gICAqIFRoZSBpbmplY3RvciB0aGF0IGNvbnRhaW5zIGFsbCBvZiB0aGUgcHJvdmlkZXJzIG9mIHRoZSBgTmdNb2R1bGVgLlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0IGluamVjdG9yKCk6IEVudmlyb25tZW50SW5qZWN0b3I7XG5cbiAgLyoqXG4gICAqIFRoZSByZXNvbHZlciB0aGF0IGNhbiByZXRyaWV2ZSBjb21wb25lbnQgZmFjdG9yaWVzIGluIGEgY29udGV4dCBvZiB0aGlzIG1vZHVsZS5cbiAgICpcbiAgICogTm90ZTogc2luY2UgdjEzLCBkeW5hbWljIGNvbXBvbmVudCBjcmVhdGlvbiB2aWFcbiAgICogW2BWaWV3Q29udGFpbmVyUmVmLmNyZWF0ZUNvbXBvbmVudGBdKGFwaS9jb3JlL1ZpZXdDb250YWluZXJSZWYjY3JlYXRlQ29tcG9uZW50KVxuICAgKiBkb2VzICoqbm90KiogcmVxdWlyZSByZXNvbHZpbmcgY29tcG9uZW50IGZhY3Rvcnk6IGNvbXBvbmVudCBjbGFzcyBjYW4gYmUgdXNlZCBkaXJlY3RseS5cbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgQW5ndWxhciBubyBsb25nZXIgcmVxdWlyZXMgQ29tcG9uZW50IGZhY3Rvcmllcy4gUGxlYXNlIHVzZSBvdGhlciBBUElzIHdoZXJlXG4gICAqICAgICBDb21wb25lbnQgY2xhc3MgY2FuIGJlIHVzZWQgZGlyZWN0bHkuXG4gICAqL1xuICBhYnN0cmFjdCBnZXQgY29tcG9uZW50RmFjdG9yeVJlc29sdmVyKCk6IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjtcblxuICAvKipcbiAgICogVGhlIGBOZ01vZHVsZWAgaW5zdGFuY2UuXG4gICAqL1xuICBhYnN0cmFjdCBnZXQgaW5zdGFuY2UoKTogVDtcblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIG1vZHVsZSBpbnN0YW5jZSBhbmQgYWxsIG9mIHRoZSBkYXRhIHN0cnVjdHVyZXMgYXNzb2NpYXRlZCB3aXRoIGl0LlxuICAgKi9cbiAgYWJzdHJhY3QgZGVzdHJveSgpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgYSBjYWxsYmFjayB0byBiZSBleGVjdXRlZCB3aGVuIHRoZSBtb2R1bGUgaXMgZGVzdHJveWVkLlxuICAgKi9cbiAgYWJzdHJhY3Qgb25EZXN0cm95KGNhbGxiYWNrOiAoKSA9PiB2b2lkKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbnRlcm5hbE5nTW9kdWxlUmVmPFQ+IGV4dGVuZHMgTmdNb2R1bGVSZWY8VD4ge1xuICAvLyBOb3RlOiB3ZSBhcmUgdXNpbmcgdGhlIHByZWZpeCBfIGFzIE5nTW9kdWxlRGF0YSBpcyBhbiBOZ01vZHVsZVJlZiBhbmQgdGhlcmVmb3JlIGRpcmVjdGx5XG4gIC8vIGV4cG9zZWQgdG8gdGhlIHVzZXIuXG4gIF9ib290c3RyYXBDb21wb25lbnRzOiBUeXBlPGFueT5bXTtcbiAgcmVzb2x2ZUluamVjdG9ySW5pdGlhbGl6ZXJzKCk6IHZvaWQ7XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICpcbiAqIEBkZXByZWNhdGVkXG4gKiBUaGlzIGNsYXNzIHdhcyBtb3N0bHkgdXNlZCBhcyBhIHBhcnQgb2YgVmlld0VuZ2luZS1iYXNlZCBKSVQgQVBJIGFuZCBpcyBubyBsb25nZXIgbmVlZGVkIGluIEl2eVxuICogSklUIG1vZGUuIEFuZ3VsYXIgcHJvdmlkZXMgQVBJcyB0aGF0IGFjY2VwdCBOZ01vZHVsZSBjbGFzc2VzIGRpcmVjdGx5IChzdWNoIGFzXG4gKiBbUGxhdGZvcm1SZWYuYm9vdHN0cmFwTW9kdWxlXShhcGkvY29yZS9QbGF0Zm9ybVJlZiNib290c3RyYXBNb2R1bGUpIGFuZFxuICogW2NyZWF0ZU5nTW9kdWxlXShhcGkvY29yZS9jcmVhdGVOZ01vZHVsZSkpLCBjb25zaWRlciBzd2l0Y2hpbmcgdG8gdGhvc2UgQVBJcyBpbnN0ZWFkIG9mXG4gKiB1c2luZyBmYWN0b3J5LWJhc2VkIG9uZXMuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBOZ01vZHVsZUZhY3Rvcnk8VD4ge1xuICBhYnN0cmFjdCBnZXQgbW9kdWxlVHlwZSgpOiBUeXBlPFQ+O1xuICBhYnN0cmFjdCBjcmVhdGUocGFyZW50SW5qZWN0b3I6IEluamVjdG9yIHwgbnVsbCk6IE5nTW9kdWxlUmVmPFQ+O1xufVxuIl19