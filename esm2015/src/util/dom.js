/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const END_COMMENT = /(<|>)/g;
const END_COMMENT_ESCAPED = '\u200B$1\u200B';
/**
 * Escape the content of the strings so that it can be safely inserted into a comment node.
 *
 * The issue is that HTML does not specify any way to escape comment end text inside the comment.
 * Consider: `<!-- The way you close a comment is with ">", and "->" at the beginning or by "-->" or
 * "--!>" at the end. -->`. Above the `"-->"` is meant to be text not an end to the comment. This
 * can be created programmatically through DOM APIs. (`<!--` are also disallowed.)
 *
 * see: https://html.spec.whatwg.org/multipage/syntax.html#comments
 *
 * ```
 * div.innerHTML = div.innerHTML
 * ```
 *
 * One would expect that the above code would be safe to do, but it turns out that because comment
 * text is not escaped, the comment may contain text which will prematurely close the comment
 * opening up the application for XSS attack. (In SSR we programmatically create comment nodes which
 * may contain such text and expect them to be safe.)
 *
 * This function escapes the comment text by looking for the closing char sequence `-->` and replace
 * it with `--_>_` where the `_` is a zero width space `\u200B`. The result is that if a comment
 * contains `-->` text it will render normally but it will not cause the HTML parser to close the
 * comment.
 *
 * @param value text to make safe for comment node by escaping the comment close character sequence
 */
export function escapeCommentText(value) {
    return value.replace(END_COMMENT, END_COMMENT_ESCAPED);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvdXRpbC9kb20udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDO0FBQzdCLE1BQU0sbUJBQW1CLEdBQUcsZ0JBQWdCLENBQUM7QUFFN0M7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F5Qkc7QUFDSCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsS0FBYTtJQUM3QyxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLG1CQUFtQixDQUFDLENBQUM7QUFDekQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5jb25zdCBFTkRfQ09NTUVOVCA9IC8oPHw+KS9nO1xuY29uc3QgRU5EX0NPTU1FTlRfRVNDQVBFRCA9ICdcXHUyMDBCJDFcXHUyMDBCJztcblxuLyoqXG4gKiBFc2NhcGUgdGhlIGNvbnRlbnQgb2YgdGhlIHN0cmluZ3Mgc28gdGhhdCBpdCBjYW4gYmUgc2FmZWx5IGluc2VydGVkIGludG8gYSBjb21tZW50IG5vZGUuXG4gKlxuICogVGhlIGlzc3VlIGlzIHRoYXQgSFRNTCBkb2VzIG5vdCBzcGVjaWZ5IGFueSB3YXkgdG8gZXNjYXBlIGNvbW1lbnQgZW5kIHRleHQgaW5zaWRlIHRoZSBjb21tZW50LlxuICogQ29uc2lkZXI6IGA8IS0tIFRoZSB3YXkgeW91IGNsb3NlIGEgY29tbWVudCBpcyB3aXRoIFwiPlwiLCBhbmQgXCItPlwiIGF0IHRoZSBiZWdpbm5pbmcgb3IgYnkgXCItLT5cIiBvclxuICogXCItLSE+XCIgYXQgdGhlIGVuZC4gLS0+YC4gQWJvdmUgdGhlIGBcIi0tPlwiYCBpcyBtZWFudCB0byBiZSB0ZXh0IG5vdCBhbiBlbmQgdG8gdGhlIGNvbW1lbnQuIFRoaXNcbiAqIGNhbiBiZSBjcmVhdGVkIHByb2dyYW1tYXRpY2FsbHkgdGhyb3VnaCBET00gQVBJcy4gKGA8IS0tYCBhcmUgYWxzbyBkaXNhbGxvd2VkLilcbiAqXG4gKiBzZWU6IGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL3N5bnRheC5odG1sI2NvbW1lbnRzXG4gKlxuICogYGBgXG4gKiBkaXYuaW5uZXJIVE1MID0gZGl2LmlubmVySFRNTFxuICogYGBgXG4gKlxuICogT25lIHdvdWxkIGV4cGVjdCB0aGF0IHRoZSBhYm92ZSBjb2RlIHdvdWxkIGJlIHNhZmUgdG8gZG8sIGJ1dCBpdCB0dXJucyBvdXQgdGhhdCBiZWNhdXNlIGNvbW1lbnRcbiAqIHRleHQgaXMgbm90IGVzY2FwZWQsIHRoZSBjb21tZW50IG1heSBjb250YWluIHRleHQgd2hpY2ggd2lsbCBwcmVtYXR1cmVseSBjbG9zZSB0aGUgY29tbWVudFxuICogb3BlbmluZyB1cCB0aGUgYXBwbGljYXRpb24gZm9yIFhTUyBhdHRhY2suIChJbiBTU1Igd2UgcHJvZ3JhbW1hdGljYWxseSBjcmVhdGUgY29tbWVudCBub2RlcyB3aGljaFxuICogbWF5IGNvbnRhaW4gc3VjaCB0ZXh0IGFuZCBleHBlY3QgdGhlbSB0byBiZSBzYWZlLilcbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGVzY2FwZXMgdGhlIGNvbW1lbnQgdGV4dCBieSBsb29raW5nIGZvciB0aGUgY2xvc2luZyBjaGFyIHNlcXVlbmNlIGAtLT5gIGFuZCByZXBsYWNlXG4gKiBpdCB3aXRoIGAtLV8+X2Agd2hlcmUgdGhlIGBfYCBpcyBhIHplcm8gd2lkdGggc3BhY2UgYFxcdTIwMEJgLiBUaGUgcmVzdWx0IGlzIHRoYXQgaWYgYSBjb21tZW50XG4gKiBjb250YWlucyBgLS0+YCB0ZXh0IGl0IHdpbGwgcmVuZGVyIG5vcm1hbGx5IGJ1dCBpdCB3aWxsIG5vdCBjYXVzZSB0aGUgSFRNTCBwYXJzZXIgdG8gY2xvc2UgdGhlXG4gKiBjb21tZW50LlxuICpcbiAqIEBwYXJhbSB2YWx1ZSB0ZXh0IHRvIG1ha2Ugc2FmZSBmb3IgY29tbWVudCBub2RlIGJ5IGVzY2FwaW5nIHRoZSBjb21tZW50IGNsb3NlIGNoYXJhY3RlciBzZXF1ZW5jZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXNjYXBlQ29tbWVudFRleHQodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB2YWx1ZS5yZXBsYWNlKEVORF9DT01NRU5ULCBFTkRfQ09NTUVOVF9FU0NBUEVEKTtcbn0iXX0=