/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * To create a Pipe, you must implement this interface.
 *
 * Angular invokes the `transform` method with the value of a binding
 * as the first argument, and any parameters as the second argument in list form.
 *
 * ## Syntax
 *
 * `value | pipeName[:arg0[:arg1...]]`
 *
 * ### Example
 *
 * The `RepeatPipe` below repeats the value as many times as indicated by the first argument:
 *
 * ```
 * import {Pipe, PipeTransform} from '\@angular/core';
 *
 * \@Pipe({name: 'repeat'})
 * export class RepeatPipe implements PipeTransform {
 *   transform(value: any, times: number) {
 *     return value.repeat(times);
 *   }
 * }
 * ```
 *
 * Invoking `{{ 'ok' | repeat:3 }}` in a template produces `okokok`.
 *
 *
 * @record
 */
export function PipeTransform() { }
function PipeTransform_tsickle_Closure_declarations() {
    /** @type {?} */
    PipeTransform.prototype.transform;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZV90cmFuc2Zvcm0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9jaGFuZ2VfZGV0ZWN0aW9uL3BpcGVfdHJhbnNmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogVG8gY3JlYXRlIGEgUGlwZSwgeW91IG11c3QgaW1wbGVtZW50IHRoaXMgaW50ZXJmYWNlLlxuICpcbiAqIEFuZ3VsYXIgaW52b2tlcyB0aGUgYHRyYW5zZm9ybWAgbWV0aG9kIHdpdGggdGhlIHZhbHVlIG9mIGEgYmluZGluZ1xuICogYXMgdGhlIGZpcnN0IGFyZ3VtZW50LCBhbmQgYW55IHBhcmFtZXRlcnMgYXMgdGhlIHNlY29uZCBhcmd1bWVudCBpbiBsaXN0IGZvcm0uXG4gKlxuICogIyMgU3ludGF4XG4gKlxuICogYHZhbHVlIHwgcGlwZU5hbWVbOmFyZzBbOmFyZzEuLi5dXWBcbiAqXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIFRoZSBgUmVwZWF0UGlwZWAgYmVsb3cgcmVwZWF0cyB0aGUgdmFsdWUgYXMgbWFueSB0aW1lcyBhcyBpbmRpY2F0ZWQgYnkgdGhlIGZpcnN0IGFyZ3VtZW50OlxuICpcbiAqIGBgYFxuICogaW1wb3J0IHtQaXBlLCBQaXBlVHJhbnNmb3JtfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbiAqXG4gKiBAUGlwZSh7bmFtZTogJ3JlcGVhdCd9KVxuICogZXhwb3J0IGNsYXNzIFJlcGVhdFBpcGUgaW1wbGVtZW50cyBQaXBlVHJhbnNmb3JtIHtcbiAqICAgdHJhbnNmb3JtKHZhbHVlOiBhbnksIHRpbWVzOiBudW1iZXIpIHtcbiAqICAgICByZXR1cm4gdmFsdWUucmVwZWF0KHRpbWVzKTtcbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogSW52b2tpbmcgYHt7ICdvaycgfCByZXBlYXQ6MyB9fWAgaW4gYSB0ZW1wbGF0ZSBwcm9kdWNlcyBgb2tva29rYC5cbiAqXG4gKlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFBpcGVUcmFuc2Zvcm0geyB0cmFuc2Zvcm0odmFsdWU6IGFueSwgLi4uYXJnczogYW55W10pOiBhbnk7IH1cbiJdfQ==