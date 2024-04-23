/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** All properties that are used by jsaction. */
export var Property;
(function (Property) {
    /**
     * The parsed value of the jsaction attribute is stored in this
     * property on the DOM node. The parsed value is an Object. The
     * property names of the object are the events; the values are the
     * names of the actions. This property is attached even on nodes
     * that don't have a jsaction attribute as an optimization, because
     * property lookup is faster than attribute access.
     */
    Property["JSACTION"] = "__jsaction";
    /**
     * The parsed value of the jsnamespace attribute is stored in this
     * property on the DOM node.
     */
    Property["JSNAMESPACE"] = "__jsnamespace";
    /** The value of the oi attribute as a property, for faster access. */
    Property["OI"] = "__oi";
    /**
     * The owner property references an a logical owner for a DOM node. JSAction
     * will follow this reference instead of parentNode when traversing the DOM
     * to find jsaction attributes. This allows overlaying a logical structure
     * over a document where the DOM structure can't reflect that structure.
     */
    Property["OWNER"] = "__owner";
})(Property || (Property = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3ByaW1pdGl2ZXMvZXZlbnQtZGlzcGF0Y2gvc3JjL3Byb3BlcnR5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILGdEQUFnRDtBQUNoRCxNQUFNLENBQU4sSUFBWSxRQTJCWDtBQTNCRCxXQUFZLFFBQVE7SUFDbEI7Ozs7Ozs7T0FPRztJQUNILG1DQUF1QixDQUFBO0lBRXZCOzs7T0FHRztJQUNILHlDQUE2QixDQUFBO0lBRTdCLHNFQUFzRTtJQUN0RSx1QkFBVyxDQUFBO0lBRVg7Ozs7O09BS0c7SUFDSCw2QkFBaUIsQ0FBQTtBQUNuQixDQUFDLEVBM0JXLFFBQVEsS0FBUixRQUFRLFFBMkJuQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKiogQWxsIHByb3BlcnRpZXMgdGhhdCBhcmUgdXNlZCBieSBqc2FjdGlvbi4gKi9cbmV4cG9ydCBlbnVtIFByb3BlcnR5IHtcbiAgLyoqXG4gICAqIFRoZSBwYXJzZWQgdmFsdWUgb2YgdGhlIGpzYWN0aW9uIGF0dHJpYnV0ZSBpcyBzdG9yZWQgaW4gdGhpc1xuICAgKiBwcm9wZXJ0eSBvbiB0aGUgRE9NIG5vZGUuIFRoZSBwYXJzZWQgdmFsdWUgaXMgYW4gT2JqZWN0LiBUaGVcbiAgICogcHJvcGVydHkgbmFtZXMgb2YgdGhlIG9iamVjdCBhcmUgdGhlIGV2ZW50czsgdGhlIHZhbHVlcyBhcmUgdGhlXG4gICAqIG5hbWVzIG9mIHRoZSBhY3Rpb25zLiBUaGlzIHByb3BlcnR5IGlzIGF0dGFjaGVkIGV2ZW4gb24gbm9kZXNcbiAgICogdGhhdCBkb24ndCBoYXZlIGEganNhY3Rpb24gYXR0cmlidXRlIGFzIGFuIG9wdGltaXphdGlvbiwgYmVjYXVzZVxuICAgKiBwcm9wZXJ0eSBsb29rdXAgaXMgZmFzdGVyIHRoYW4gYXR0cmlidXRlIGFjY2Vzcy5cbiAgICovXG4gIEpTQUNUSU9OID0gJ19fanNhY3Rpb24nLFxuXG4gIC8qKlxuICAgKiBUaGUgcGFyc2VkIHZhbHVlIG9mIHRoZSBqc25hbWVzcGFjZSBhdHRyaWJ1dGUgaXMgc3RvcmVkIGluIHRoaXNcbiAgICogcHJvcGVydHkgb24gdGhlIERPTSBub2RlLlxuICAgKi9cbiAgSlNOQU1FU1BBQ0UgPSAnX19qc25hbWVzcGFjZScsXG5cbiAgLyoqIFRoZSB2YWx1ZSBvZiB0aGUgb2kgYXR0cmlidXRlIGFzIGEgcHJvcGVydHksIGZvciBmYXN0ZXIgYWNjZXNzLiAqL1xuICBPSSA9ICdfX29pJyxcblxuICAvKipcbiAgICogVGhlIG93bmVyIHByb3BlcnR5IHJlZmVyZW5jZXMgYW4gYSBsb2dpY2FsIG93bmVyIGZvciBhIERPTSBub2RlLiBKU0FjdGlvblxuICAgKiB3aWxsIGZvbGxvdyB0aGlzIHJlZmVyZW5jZSBpbnN0ZWFkIG9mIHBhcmVudE5vZGUgd2hlbiB0cmF2ZXJzaW5nIHRoZSBET01cbiAgICogdG8gZmluZCBqc2FjdGlvbiBhdHRyaWJ1dGVzLiBUaGlzIGFsbG93cyBvdmVybGF5aW5nIGEgbG9naWNhbCBzdHJ1Y3R1cmVcbiAgICogb3ZlciBhIGRvY3VtZW50IHdoZXJlIHRoZSBET00gc3RydWN0dXJlIGNhbid0IHJlZmxlY3QgdGhhdCBzdHJ1Y3R1cmUuXG4gICAqL1xuICBPV05FUiA9ICdfX293bmVyJyxcbn1cblxuZGVjbGFyZSBnbG9iYWwge1xuICBpbnRlcmZhY2UgTm9kZSB7XG4gICAgW1Byb3BlcnR5LkpTQUNUSU9OXT86IHN0cmluZztcbiAgICBbUHJvcGVydHkuSlNOQU1FU1BBQ0VdPzogc3RyaW5nO1xuICAgIFtQcm9wZXJ0eS5PSV0/OiBzdHJpbmc7XG4gICAgW1Byb3BlcnR5Lk9XTkVSXT86IFBhcmVudE5vZGU7XG4gIH1cbn1cbiJdfQ==