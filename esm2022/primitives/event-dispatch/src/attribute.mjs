/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export var Attribute;
(function (Attribute) {
    /**
     * The jsaction attribute defines a mapping of a DOM event to a
     * generic event (aka jsaction), to which the actual event handlers
     * that implement the behavior of the application are bound. The
     * value is a semicolon separated list of colon separated pairs of
     * an optional DOM event name and a jsaction name. If the optional
     * DOM event name is omitted, 'click' is assumed. The jsaction names
     * are dot separated pairs of a namespace and a simple jsaction
     * name. If the namespace is absent, it is taken from the closest
     * ancestor element with a jsnamespace attribute, if there is
     * any. If there is no ancestor with a jsnamespace attribute, the
     * simple name is assumed to be the jsaction name.
     *
     * Used by EventContract.
     */
    Attribute["JSACTION"] = "jsaction";
    /**
     * The jsnamespace attribute provides the namespace part of the
     * jaction names occurring in the jsaction attribute where it's
     * missing.
     *
     * Used by EventContract.
     */
    Attribute["JSNAMESPACE"] = "jsnamespace";
    /**
     * The oi attribute is a log impression tag for impression logging
     * and action tracking. For an element that carries a jsaction
     * attribute, the element is identified for the purpose of
     * impression logging and click tracking by the dot separated path
     * of all oi attributes in the chain of ancestors of the element.
     *
     * Used by ActionFlow.
     */
    Attribute["OI"] = "oi";
    /**
     * The ved attribute is an encoded ClickTrackingCGI proto to track
     * visual elements.
     *
     * Used by ActionFlow.
     */
    Attribute["VED"] = "ved";
    /**
     * The vet attribute is the visual element type used to identify tracked
     * visual elements.
     */
    Attribute["VET"] = "vet";
    /**
     * Support for iteration on reprocessing.
     *
     * Used by ActionFlow.
     */
    Attribute["JSINSTANCE"] = "jsinstance";
    /**
     * All click jsactions that happen on the element that carries this
     * attribute or its descendants are automatically logged.
     * Impressions of jsactions on these elements are tracked too, if
     * requested by the impression() method of ActionFlow.
     *
     * Used by ActionFlow.
     */
    Attribute["JSTRACK"] = "jstrack";
})(Attribute || (Attribute = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXR0cmlidXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9wcmltaXRpdmVzL2V2ZW50LWRpc3BhdGNoL3NyYy9hdHRyaWJ1dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsTUFBTSxDQUFOLElBQVksU0FvRVg7QUFwRUQsV0FBWSxTQUFTO0lBQ25COzs7Ozs7Ozs7Ozs7OztPQWNHO0lBQ0gsa0NBQXFCLENBQUE7SUFFckI7Ozs7OztPQU1HO0lBQ0gsd0NBQTJCLENBQUE7SUFFM0I7Ozs7Ozs7O09BUUc7SUFDSCxzQkFBUyxDQUFBO0lBRVQ7Ozs7O09BS0c7SUFDSCx3QkFBVyxDQUFBO0lBRVg7OztPQUdHO0lBQ0gsd0JBQVcsQ0FBQTtJQUVYOzs7O09BSUc7SUFDSCxzQ0FBeUIsQ0FBQTtJQUV6Qjs7Ozs7OztPQU9HO0lBQ0gsZ0NBQW1CLENBQUE7QUFDckIsQ0FBQyxFQXBFVyxTQUFTLEtBQVQsU0FBUyxRQW9FcEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuZXhwb3J0IGVudW0gQXR0cmlidXRlIHtcbiAgLyoqXG4gICAqIFRoZSBqc2FjdGlvbiBhdHRyaWJ1dGUgZGVmaW5lcyBhIG1hcHBpbmcgb2YgYSBET00gZXZlbnQgdG8gYVxuICAgKiBnZW5lcmljIGV2ZW50IChha2EganNhY3Rpb24pLCB0byB3aGljaCB0aGUgYWN0dWFsIGV2ZW50IGhhbmRsZXJzXG4gICAqIHRoYXQgaW1wbGVtZW50IHRoZSBiZWhhdmlvciBvZiB0aGUgYXBwbGljYXRpb24gYXJlIGJvdW5kLiBUaGVcbiAgICogdmFsdWUgaXMgYSBzZW1pY29sb24gc2VwYXJhdGVkIGxpc3Qgb2YgY29sb24gc2VwYXJhdGVkIHBhaXJzIG9mXG4gICAqIGFuIG9wdGlvbmFsIERPTSBldmVudCBuYW1lIGFuZCBhIGpzYWN0aW9uIG5hbWUuIElmIHRoZSBvcHRpb25hbFxuICAgKiBET00gZXZlbnQgbmFtZSBpcyBvbWl0dGVkLCAnY2xpY2snIGlzIGFzc3VtZWQuIFRoZSBqc2FjdGlvbiBuYW1lc1xuICAgKiBhcmUgZG90IHNlcGFyYXRlZCBwYWlycyBvZiBhIG5hbWVzcGFjZSBhbmQgYSBzaW1wbGUganNhY3Rpb25cbiAgICogbmFtZS4gSWYgdGhlIG5hbWVzcGFjZSBpcyBhYnNlbnQsIGl0IGlzIHRha2VuIGZyb20gdGhlIGNsb3Nlc3RcbiAgICogYW5jZXN0b3IgZWxlbWVudCB3aXRoIGEganNuYW1lc3BhY2UgYXR0cmlidXRlLCBpZiB0aGVyZSBpc1xuICAgKiBhbnkuIElmIHRoZXJlIGlzIG5vIGFuY2VzdG9yIHdpdGggYSBqc25hbWVzcGFjZSBhdHRyaWJ1dGUsIHRoZVxuICAgKiBzaW1wbGUgbmFtZSBpcyBhc3N1bWVkIHRvIGJlIHRoZSBqc2FjdGlvbiBuYW1lLlxuICAgKlxuICAgKiBVc2VkIGJ5IEV2ZW50Q29udHJhY3QuXG4gICAqL1xuICBKU0FDVElPTiA9ICdqc2FjdGlvbicsXG5cbiAgLyoqXG4gICAqIFRoZSBqc25hbWVzcGFjZSBhdHRyaWJ1dGUgcHJvdmlkZXMgdGhlIG5hbWVzcGFjZSBwYXJ0IG9mIHRoZVxuICAgKiBqYWN0aW9uIG5hbWVzIG9jY3VycmluZyBpbiB0aGUganNhY3Rpb24gYXR0cmlidXRlIHdoZXJlIGl0J3NcbiAgICogbWlzc2luZy5cbiAgICpcbiAgICogVXNlZCBieSBFdmVudENvbnRyYWN0LlxuICAgKi9cbiAgSlNOQU1FU1BBQ0UgPSAnanNuYW1lc3BhY2UnLFxuXG4gIC8qKlxuICAgKiBUaGUgb2kgYXR0cmlidXRlIGlzIGEgbG9nIGltcHJlc3Npb24gdGFnIGZvciBpbXByZXNzaW9uIGxvZ2dpbmdcbiAgICogYW5kIGFjdGlvbiB0cmFja2luZy4gRm9yIGFuIGVsZW1lbnQgdGhhdCBjYXJyaWVzIGEganNhY3Rpb25cbiAgICogYXR0cmlidXRlLCB0aGUgZWxlbWVudCBpcyBpZGVudGlmaWVkIGZvciB0aGUgcHVycG9zZSBvZlxuICAgKiBpbXByZXNzaW9uIGxvZ2dpbmcgYW5kIGNsaWNrIHRyYWNraW5nIGJ5IHRoZSBkb3Qgc2VwYXJhdGVkIHBhdGhcbiAgICogb2YgYWxsIG9pIGF0dHJpYnV0ZXMgaW4gdGhlIGNoYWluIG9mIGFuY2VzdG9ycyBvZiB0aGUgZWxlbWVudC5cbiAgICpcbiAgICogVXNlZCBieSBBY3Rpb25GbG93LlxuICAgKi9cbiAgT0kgPSAnb2knLFxuXG4gIC8qKlxuICAgKiBUaGUgdmVkIGF0dHJpYnV0ZSBpcyBhbiBlbmNvZGVkIENsaWNrVHJhY2tpbmdDR0kgcHJvdG8gdG8gdHJhY2tcbiAgICogdmlzdWFsIGVsZW1lbnRzLlxuICAgKlxuICAgKiBVc2VkIGJ5IEFjdGlvbkZsb3cuXG4gICAqL1xuICBWRUQgPSAndmVkJyxcblxuICAvKipcbiAgICogVGhlIHZldCBhdHRyaWJ1dGUgaXMgdGhlIHZpc3VhbCBlbGVtZW50IHR5cGUgdXNlZCB0byBpZGVudGlmeSB0cmFja2VkXG4gICAqIHZpc3VhbCBlbGVtZW50cy5cbiAgICovXG4gIFZFVCA9ICd2ZXQnLFxuXG4gIC8qKlxuICAgKiBTdXBwb3J0IGZvciBpdGVyYXRpb24gb24gcmVwcm9jZXNzaW5nLlxuICAgKlxuICAgKiBVc2VkIGJ5IEFjdGlvbkZsb3cuXG4gICAqL1xuICBKU0lOU1RBTkNFID0gJ2pzaW5zdGFuY2UnLFxuXG4gIC8qKlxuICAgKiBBbGwgY2xpY2sganNhY3Rpb25zIHRoYXQgaGFwcGVuIG9uIHRoZSBlbGVtZW50IHRoYXQgY2FycmllcyB0aGlzXG4gICAqIGF0dHJpYnV0ZSBvciBpdHMgZGVzY2VuZGFudHMgYXJlIGF1dG9tYXRpY2FsbHkgbG9nZ2VkLlxuICAgKiBJbXByZXNzaW9ucyBvZiBqc2FjdGlvbnMgb24gdGhlc2UgZWxlbWVudHMgYXJlIHRyYWNrZWQgdG9vLCBpZlxuICAgKiByZXF1ZXN0ZWQgYnkgdGhlIGltcHJlc3Npb24oKSBtZXRob2Qgb2YgQWN0aW9uRmxvdy5cbiAgICpcbiAgICogVXNlZCBieSBBY3Rpb25GbG93LlxuICAgKi9cbiAgSlNUUkFDSyA9ICdqc3RyYWNrJyxcbn1cbiJdfQ==