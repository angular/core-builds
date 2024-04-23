/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Defines special EventInfo and Event properties used when
 * A11Y_SUPPORT_IN_DISPATCHER is enabled.
 */
export var Attribute;
(function (Attribute) {
    /**
     * An event-type set when the event contract detects a KEYDOWN event but
     * doesn't know if the key press can be treated like a click. The dispatcher
     * will use this event-type to parse the keypress and handle it accordingly.
     */
    Attribute["MAYBE_CLICK_EVENT_TYPE"] = "maybe_click";
    /**
     * A property added to a dispatched event that had the MAYBE_CLICK_EVENTTYPE
     * event-type but could not be used as a click. The dispatcher sets this
     * property for non-global dispatches before it retriggers the event and it
     * signifies that the event contract should not dispatch this event globally.
     */
    Attribute["SKIP_GLOBAL_DISPATCH"] = "a11ysgd";
    /**
     * A property added to a dispatched event that had the MAYBE_CLICK_EVENTTYPE
     * event-type but could not be used as a click. The dispatcher sets this
     * property before it retriggers the event and it signifies that the event
     * contract should not look at CLICK actions for KEYDOWN events.
     */
    Attribute["SKIP_A11Y_CHECK"] = "a11ysc";
})(Attribute || (Attribute = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvcHJpbWl0aXZlcy9ldmVudC1kaXNwYXRjaC9zcmMvYWNjZXNzaWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSDs7O0dBR0c7QUFDSCxNQUFNLENBQU4sSUFBWSxTQXVCWDtBQXZCRCxXQUFZLFNBQVM7SUFDbkI7Ozs7T0FJRztJQUNILG1EQUFzQyxDQUFBO0lBRXRDOzs7OztPQUtHO0lBQ0gsNkNBQWdDLENBQUE7SUFFaEM7Ozs7O09BS0c7SUFDSCx1Q0FBMEIsQ0FBQTtBQUM1QixDQUFDLEVBdkJXLFNBQVMsS0FBVCxTQUFTLFFBdUJwQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIERlZmluZXMgc3BlY2lhbCBFdmVudEluZm8gYW5kIEV2ZW50IHByb3BlcnRpZXMgdXNlZCB3aGVuXG4gKiBBMTFZX1NVUFBPUlRfSU5fRElTUEFUQ0hFUiBpcyBlbmFibGVkLlxuICovXG5leHBvcnQgZW51bSBBdHRyaWJ1dGUge1xuICAvKipcbiAgICogQW4gZXZlbnQtdHlwZSBzZXQgd2hlbiB0aGUgZXZlbnQgY29udHJhY3QgZGV0ZWN0cyBhIEtFWURPV04gZXZlbnQgYnV0XG4gICAqIGRvZXNuJ3Qga25vdyBpZiB0aGUga2V5IHByZXNzIGNhbiBiZSB0cmVhdGVkIGxpa2UgYSBjbGljay4gVGhlIGRpc3BhdGNoZXJcbiAgICogd2lsbCB1c2UgdGhpcyBldmVudC10eXBlIHRvIHBhcnNlIHRoZSBrZXlwcmVzcyBhbmQgaGFuZGxlIGl0IGFjY29yZGluZ2x5LlxuICAgKi9cbiAgTUFZQkVfQ0xJQ0tfRVZFTlRfVFlQRSA9ICdtYXliZV9jbGljaycsXG5cbiAgLyoqXG4gICAqIEEgcHJvcGVydHkgYWRkZWQgdG8gYSBkaXNwYXRjaGVkIGV2ZW50IHRoYXQgaGFkIHRoZSBNQVlCRV9DTElDS19FVkVOVFRZUEVcbiAgICogZXZlbnQtdHlwZSBidXQgY291bGQgbm90IGJlIHVzZWQgYXMgYSBjbGljay4gVGhlIGRpc3BhdGNoZXIgc2V0cyB0aGlzXG4gICAqIHByb3BlcnR5IGZvciBub24tZ2xvYmFsIGRpc3BhdGNoZXMgYmVmb3JlIGl0IHJldHJpZ2dlcnMgdGhlIGV2ZW50IGFuZCBpdFxuICAgKiBzaWduaWZpZXMgdGhhdCB0aGUgZXZlbnQgY29udHJhY3Qgc2hvdWxkIG5vdCBkaXNwYXRjaCB0aGlzIGV2ZW50IGdsb2JhbGx5LlxuICAgKi9cbiAgU0tJUF9HTE9CQUxfRElTUEFUQ0ggPSAnYTExeXNnZCcsXG5cbiAgLyoqXG4gICAqIEEgcHJvcGVydHkgYWRkZWQgdG8gYSBkaXNwYXRjaGVkIGV2ZW50IHRoYXQgaGFkIHRoZSBNQVlCRV9DTElDS19FVkVOVFRZUEVcbiAgICogZXZlbnQtdHlwZSBidXQgY291bGQgbm90IGJlIHVzZWQgYXMgYSBjbGljay4gVGhlIGRpc3BhdGNoZXIgc2V0cyB0aGlzXG4gICAqIHByb3BlcnR5IGJlZm9yZSBpdCByZXRyaWdnZXJzIHRoZSBldmVudCBhbmQgaXQgc2lnbmlmaWVzIHRoYXQgdGhlIGV2ZW50XG4gICAqIGNvbnRyYWN0IHNob3VsZCBub3QgbG9vayBhdCBDTElDSyBhY3Rpb25zIGZvciBLRVlET1dOIGV2ZW50cy5cbiAgICovXG4gIFNLSVBfQTExWV9DSEVDSyA9ICdhMTF5c2MnLFxufVxuXG5kZWNsYXJlIGdsb2JhbCB7XG4gIGludGVyZmFjZSBFdmVudCB7XG4gICAgW0F0dHJpYnV0ZS5NQVlCRV9DTElDS19FVkVOVF9UWVBFXT86IGJvb2xlYW47XG4gICAgW0F0dHJpYnV0ZS5TS0lQX0dMT0JBTF9ESVNQQVRDSF0/OiBib29sZWFuO1xuICAgIFtBdHRyaWJ1dGUuU0tJUF9BMTFZX0NIRUNLXT86IGJvb2xlYW47XG4gIH1cbn1cbiJdfQ==