/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var END_COMMENT = /-->/g;
var END_COMMENT_ESCAPED = '-\u200B-\u200B>';
/**
 * Escape the content of the strings so that it can be safely inserted into a comment node.
 *
 * The issue is that HTML does not specify any way to escape comment end text inside the comment.
 * `<!-- The way you close a comment is with "-->". -->`. Above the `"-->"` is meant to be text not
 * an end to the comment. This can be created programmatically through DOM APIs.
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
 * it with `-_-_>` where the `_` is a zero width space `\u200B`. The result is that if a comment
 * contains `-->` text it will render normally but it will not cause the HTML parser to close the
 * comment.
 *
 * @param value text to make safe for comment node by escaping the comment close character sequence
 */
export function escapeCommentText(value) {
    return value.replace(END_COMMENT, END_COMMENT_ESCAPED);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvdXRpbC9kb20udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsSUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDO0FBQzNCLElBQU0sbUJBQW1CLEdBQUcsaUJBQWlCLENBQUM7QUFFOUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FzQkc7QUFDSCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsS0FBYTtJQUM3QyxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLG1CQUFtQixDQUFDLENBQUM7QUFDekQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuY29uc3QgRU5EX0NPTU1FTlQgPSAvLS0+L2c7XG5jb25zdCBFTkRfQ09NTUVOVF9FU0NBUEVEID0gJy1cXHUyMDBCLVxcdTIwMEI+JztcblxuLyoqXG4gKiBFc2NhcGUgdGhlIGNvbnRlbnQgb2YgdGhlIHN0cmluZ3Mgc28gdGhhdCBpdCBjYW4gYmUgc2FmZWx5IGluc2VydGVkIGludG8gYSBjb21tZW50IG5vZGUuXG4gKlxuICogVGhlIGlzc3VlIGlzIHRoYXQgSFRNTCBkb2VzIG5vdCBzcGVjaWZ5IGFueSB3YXkgdG8gZXNjYXBlIGNvbW1lbnQgZW5kIHRleHQgaW5zaWRlIHRoZSBjb21tZW50LlxuICogYDwhLS0gVGhlIHdheSB5b3UgY2xvc2UgYSBjb21tZW50IGlzIHdpdGggXCItLT5cIi4gLS0+YC4gQWJvdmUgdGhlIGBcIi0tPlwiYCBpcyBtZWFudCB0byBiZSB0ZXh0IG5vdFxuICogYW4gZW5kIHRvIHRoZSBjb21tZW50LiBUaGlzIGNhbiBiZSBjcmVhdGVkIHByb2dyYW1tYXRpY2FsbHkgdGhyb3VnaCBET00gQVBJcy5cbiAqXG4gKiBgYGBcbiAqIGRpdi5pbm5lckhUTUwgPSBkaXYuaW5uZXJIVE1MXG4gKiBgYGBcbiAqXG4gKiBPbmUgd291bGQgZXhwZWN0IHRoYXQgdGhlIGFib3ZlIGNvZGUgd291bGQgYmUgc2FmZSB0byBkbywgYnV0IGl0IHR1cm5zIG91dCB0aGF0IGJlY2F1c2UgY29tbWVudFxuICogdGV4dCBpcyBub3QgZXNjYXBlZCwgdGhlIGNvbW1lbnQgbWF5IGNvbnRhaW4gdGV4dCB3aGljaCB3aWxsIHByZW1hdHVyZWx5IGNsb3NlIHRoZSBjb21tZW50XG4gKiBvcGVuaW5nIHVwIHRoZSBhcHBsaWNhdGlvbiBmb3IgWFNTIGF0dGFjay4gKEluIFNTUiB3ZSBwcm9ncmFtbWF0aWNhbGx5IGNyZWF0ZSBjb21tZW50IG5vZGVzIHdoaWNoXG4gKiBtYXkgY29udGFpbiBzdWNoIHRleHQgYW5kIGV4cGVjdCB0aGVtIHRvIGJlIHNhZmUuKVxuICpcbiAqIFRoaXMgZnVuY3Rpb24gZXNjYXBlcyB0aGUgY29tbWVudCB0ZXh0IGJ5IGxvb2tpbmcgZm9yIHRoZSBjbG9zaW5nIGNoYXIgc2VxdWVuY2UgYC0tPmAgYW5kIHJlcGxhY2VcbiAqIGl0IHdpdGggYC1fLV8+YCB3aGVyZSB0aGUgYF9gIGlzIGEgemVybyB3aWR0aCBzcGFjZSBgXFx1MjAwQmAuIFRoZSByZXN1bHQgaXMgdGhhdCBpZiBhIGNvbW1lbnRcbiAqIGNvbnRhaW5zIGAtLT5gIHRleHQgaXQgd2lsbCByZW5kZXIgbm9ybWFsbHkgYnV0IGl0IHdpbGwgbm90IGNhdXNlIHRoZSBIVE1MIHBhcnNlciB0byBjbG9zZSB0aGVcbiAqIGNvbW1lbnQuXG4gKlxuICogQHBhcmFtIHZhbHVlIHRleHQgdG8gbWFrZSBzYWZlIGZvciBjb21tZW50IG5vZGUgYnkgZXNjYXBpbmcgdGhlIGNvbW1lbnQgY2xvc2UgY2hhcmFjdGVyIHNlcXVlbmNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlc2NhcGVDb21tZW50VGV4dCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoRU5EX0NPTU1FTlQsIEVORF9DT01NRU5UX0VTQ0FQRUQpO1xufSJdfQ==