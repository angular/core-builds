/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { global } from './global';
/**
 * This file is used to control if the default rendering pipeline should be `ViewEngine` or `Ivy`.
 *
 * For more information on how to run and debug tests with either Ivy or View Engine (legacy),
 * please see [BAZEL.md](./docs/BAZEL.md).
 */
var _devMode = true;
var _runModeLocked = false;
/**
 * Returns whether Angular is in development mode. After called once,
 * the value is locked and won't change any more.
 *
 * By default, this is true, unless a user calls `enableProdMode` before calling this.
 *
 * @publicApi
 */
export function isDevMode() {
    _runModeLocked = true;
    return _devMode;
}
/**
 * Disable Angular's development mode, which turns off assertions and other
 * checks within the framework.
 *
 * One important assertion this disables verifies that a change detection pass
 * does not result in additional changes to any bindings (also known as
 * unidirectional data flow).
 *
 * @publicApi
 */
export function enableProdMode() {
    if (_runModeLocked) {
        throw new Error('Cannot enable prod mode after platform setup.');
    }
    // The below check is there so when ngDevMode is set via terser
    // `global['ngDevMode'] = false;` is also dropped.
    if (typeof ngDevMode === undefined || !!ngDevMode) {
        global['ngDevMode'] = false;
    }
    _devMode = false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNfZGV2X21vZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy91dGlsL2lzX2Rldl9tb2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFaEM7Ozs7O0dBS0c7QUFFSCxJQUFJLFFBQVEsR0FBWSxJQUFJLENBQUM7QUFDN0IsSUFBSSxjQUFjLEdBQVksS0FBSyxDQUFDO0FBR3BDOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLFVBQVUsU0FBUztJQUN2QixjQUFjLEdBQUcsSUFBSSxDQUFDO0lBQ3RCLE9BQU8sUUFBUSxDQUFDO0FBQ2xCLENBQUM7QUFFRDs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFNLFVBQVUsY0FBYztJQUM1QixJQUFJLGNBQWMsRUFBRTtRQUNsQixNQUFNLElBQUksS0FBSyxDQUFDLCtDQUErQyxDQUFDLENBQUM7S0FDbEU7SUFFRCwrREFBK0Q7SUFDL0Qsa0RBQWtEO0lBQ2xELElBQUksT0FBTyxTQUFTLEtBQUssU0FBUyxJQUFJLENBQUMsQ0FBQyxTQUFTLEVBQUU7UUFDakQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEtBQUssQ0FBQztLQUM3QjtJQUVELFFBQVEsR0FBRyxLQUFLLENBQUM7QUFDbkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtnbG9iYWx9IGZyb20gJy4vZ2xvYmFsJztcblxuLyoqXG4gKiBUaGlzIGZpbGUgaXMgdXNlZCB0byBjb250cm9sIGlmIHRoZSBkZWZhdWx0IHJlbmRlcmluZyBwaXBlbGluZSBzaG91bGQgYmUgYFZpZXdFbmdpbmVgIG9yIGBJdnlgLlxuICpcbiAqIEZvciBtb3JlIGluZm9ybWF0aW9uIG9uIGhvdyB0byBydW4gYW5kIGRlYnVnIHRlc3RzIHdpdGggZWl0aGVyIEl2eSBvciBWaWV3IEVuZ2luZSAobGVnYWN5KSxcbiAqIHBsZWFzZSBzZWUgW0JBWkVMLm1kXSguL2RvY3MvQkFaRUwubWQpLlxuICovXG5cbmxldCBfZGV2TW9kZTogYm9vbGVhbiA9IHRydWU7XG5sZXQgX3J1bk1vZGVMb2NrZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBBbmd1bGFyIGlzIGluIGRldmVsb3BtZW50IG1vZGUuIEFmdGVyIGNhbGxlZCBvbmNlLFxuICogdGhlIHZhbHVlIGlzIGxvY2tlZCBhbmQgd29uJ3QgY2hhbmdlIGFueSBtb3JlLlxuICpcbiAqIEJ5IGRlZmF1bHQsIHRoaXMgaXMgdHJ1ZSwgdW5sZXNzIGEgdXNlciBjYWxscyBgZW5hYmxlUHJvZE1vZGVgIGJlZm9yZSBjYWxsaW5nIHRoaXMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNEZXZNb2RlKCk6IGJvb2xlYW4ge1xuICBfcnVuTW9kZUxvY2tlZCA9IHRydWU7XG4gIHJldHVybiBfZGV2TW9kZTtcbn1cblxuLyoqXG4gKiBEaXNhYmxlIEFuZ3VsYXIncyBkZXZlbG9wbWVudCBtb2RlLCB3aGljaCB0dXJucyBvZmYgYXNzZXJ0aW9ucyBhbmQgb3RoZXJcbiAqIGNoZWNrcyB3aXRoaW4gdGhlIGZyYW1ld29yay5cbiAqXG4gKiBPbmUgaW1wb3J0YW50IGFzc2VydGlvbiB0aGlzIGRpc2FibGVzIHZlcmlmaWVzIHRoYXQgYSBjaGFuZ2UgZGV0ZWN0aW9uIHBhc3NcbiAqIGRvZXMgbm90IHJlc3VsdCBpbiBhZGRpdGlvbmFsIGNoYW5nZXMgdG8gYW55IGJpbmRpbmdzIChhbHNvIGtub3duIGFzXG4gKiB1bmlkaXJlY3Rpb25hbCBkYXRhIGZsb3cpLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuYWJsZVByb2RNb2RlKCk6IHZvaWQge1xuICBpZiAoX3J1bk1vZGVMb2NrZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBlbmFibGUgcHJvZCBtb2RlIGFmdGVyIHBsYXRmb3JtIHNldHVwLicpO1xuICB9XG5cbiAgLy8gVGhlIGJlbG93IGNoZWNrIGlzIHRoZXJlIHNvIHdoZW4gbmdEZXZNb2RlIGlzIHNldCB2aWEgdGVyc2VyXG4gIC8vIGBnbG9iYWxbJ25nRGV2TW9kZSddID0gZmFsc2U7YCBpcyBhbHNvIGRyb3BwZWQuXG4gIGlmICh0eXBlb2YgbmdEZXZNb2RlID09PSB1bmRlZmluZWQgfHwgISFuZ0Rldk1vZGUpIHtcbiAgICBnbG9iYWxbJ25nRGV2TW9kZSddID0gZmFsc2U7XG4gIH1cblxuICBfZGV2TW9kZSA9IGZhbHNlO1xufSJdfQ==