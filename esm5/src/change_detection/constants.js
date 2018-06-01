/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Describes within the change detector which strategy will be used the next time change
 * detection is triggered.
 *
 */
export var ChangeDetectionStrategy;
(function (ChangeDetectionStrategy) {
    /**
     * `OnPush` means that the change detector's mode will be initially set to `CheckOnce`.
     */
    ChangeDetectionStrategy[ChangeDetectionStrategy["OnPush"] = 0] = "OnPush";
    /**
     * `Default` means that the change detector's mode will be initially set to `CheckAlways`.
     */
    ChangeDetectionStrategy[ChangeDetectionStrategy["Default"] = 1] = "Default";
})(ChangeDetectionStrategy || (ChangeDetectionStrategy = {}));
/**
 * Describes the status of the detector.
 */
export var ChangeDetectorStatus;
(function (ChangeDetectorStatus) {
    /**
     * `CheckOnce` means that after calling detectChanges the mode of the change detector
     * will become `Checked`.
     */
    ChangeDetectorStatus[ChangeDetectorStatus["CheckOnce"] = 0] = "CheckOnce";
    /**
     * `Checked` means that the change detector should be skipped until its mode changes to
     * `CheckOnce`.
     */
    ChangeDetectorStatus[ChangeDetectorStatus["Checked"] = 1] = "Checked";
    /**
     * `CheckAlways` means that after calling detectChanges the mode of the change detector
     * will remain `CheckAlways`.
     */
    ChangeDetectorStatus[ChangeDetectorStatus["CheckAlways"] = 2] = "CheckAlways";
    /**
     * `Detached` means that the change detector sub tree is not a part of the main tree and
     * should be skipped.
     */
    ChangeDetectorStatus[ChangeDetectorStatus["Detached"] = 3] = "Detached";
    /**
     * `Errored` means that the change detector encountered an error checking a binding
     * or calling a directive lifecycle method and is now in an inconsistent state. Change
     * detectors in this state will no longer detect changes.
     */
    ChangeDetectorStatus[ChangeDetectorStatus["Errored"] = 4] = "Errored";
    /**
     * `Destroyed` means that the change detector is destroyed.
     */
    ChangeDetectorStatus[ChangeDetectorStatus["Destroyed"] = 5] = "Destroyed";
})(ChangeDetectorStatus || (ChangeDetectorStatus = {}));
export function isDefaultChangeDetectionStrategy(changeDetectionStrategy) {
    return changeDetectionStrategy == null ||
        changeDetectionStrategy === ChangeDetectionStrategy.Default;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RhbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9jb25zdGFudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBR0g7Ozs7R0FJRztBQUNILE1BQU0sQ0FBTixJQUFZLHVCQVVYO0FBVkQsV0FBWSx1QkFBdUI7SUFDakM7O09BRUc7SUFDSCx5RUFBVSxDQUFBO0lBRVY7O09BRUc7SUFDSCwyRUFBVyxDQUFBO0FBQ2IsQ0FBQyxFQVZXLHVCQUF1QixLQUF2Qix1QkFBdUIsUUFVbEM7QUFFRDs7R0FFRztBQUNILE1BQU0sQ0FBTixJQUFZLG9CQW9DWDtBQXBDRCxXQUFZLG9CQUFvQjtJQUM5Qjs7O09BR0c7SUFDSCx5RUFBUyxDQUFBO0lBRVQ7OztPQUdHO0lBQ0gscUVBQU8sQ0FBQTtJQUVQOzs7T0FHRztJQUNILDZFQUFXLENBQUE7SUFFWDs7O09BR0c7SUFDSCx1RUFBUSxDQUFBO0lBRVI7Ozs7T0FJRztJQUNILHFFQUFPLENBQUE7SUFFUDs7T0FFRztJQUNILHlFQUFTLENBQUE7QUFDWCxDQUFDLEVBcENXLG9CQUFvQixLQUFwQixvQkFBb0IsUUFvQy9CO0FBRUQsTUFBTSwyQ0FBMkMsdUJBQWdEO0lBRS9GLE9BQU8sdUJBQXVCLElBQUksSUFBSTtRQUNsQyx1QkFBdUIsS0FBSyx1QkFBdUIsQ0FBQyxPQUFPLENBQUM7QUFDbEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuXG4vKipcbiAqIERlc2NyaWJlcyB3aXRoaW4gdGhlIGNoYW5nZSBkZXRlY3RvciB3aGljaCBzdHJhdGVneSB3aWxsIGJlIHVzZWQgdGhlIG5leHQgdGltZSBjaGFuZ2VcbiAqIGRldGVjdGlvbiBpcyB0cmlnZ2VyZWQuXG4gKlxuICovXG5leHBvcnQgZW51bSBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSB7XG4gIC8qKlxuICAgKiBgT25QdXNoYCBtZWFucyB0aGF0IHRoZSBjaGFuZ2UgZGV0ZWN0b3IncyBtb2RlIHdpbGwgYmUgaW5pdGlhbGx5IHNldCB0byBgQ2hlY2tPbmNlYC5cbiAgICovXG4gIE9uUHVzaCA9IDAsXG5cbiAgLyoqXG4gICAqIGBEZWZhdWx0YCBtZWFucyB0aGF0IHRoZSBjaGFuZ2UgZGV0ZWN0b3IncyBtb2RlIHdpbGwgYmUgaW5pdGlhbGx5IHNldCB0byBgQ2hlY2tBbHdheXNgLlxuICAgKi9cbiAgRGVmYXVsdCA9IDEsXG59XG5cbi8qKlxuICogRGVzY3JpYmVzIHRoZSBzdGF0dXMgb2YgdGhlIGRldGVjdG9yLlxuICovXG5leHBvcnQgZW51bSBDaGFuZ2VEZXRlY3RvclN0YXR1cyB7XG4gIC8qKlxuICAgKiBgQ2hlY2tPbmNlYCBtZWFucyB0aGF0IGFmdGVyIGNhbGxpbmcgZGV0ZWN0Q2hhbmdlcyB0aGUgbW9kZSBvZiB0aGUgY2hhbmdlIGRldGVjdG9yXG4gICAqIHdpbGwgYmVjb21lIGBDaGVja2VkYC5cbiAgICovXG4gIENoZWNrT25jZSxcblxuICAvKipcbiAgICogYENoZWNrZWRgIG1lYW5zIHRoYXQgdGhlIGNoYW5nZSBkZXRlY3RvciBzaG91bGQgYmUgc2tpcHBlZCB1bnRpbCBpdHMgbW9kZSBjaGFuZ2VzIHRvXG4gICAqIGBDaGVja09uY2VgLlxuICAgKi9cbiAgQ2hlY2tlZCxcblxuICAvKipcbiAgICogYENoZWNrQWx3YXlzYCBtZWFucyB0aGF0IGFmdGVyIGNhbGxpbmcgZGV0ZWN0Q2hhbmdlcyB0aGUgbW9kZSBvZiB0aGUgY2hhbmdlIGRldGVjdG9yXG4gICAqIHdpbGwgcmVtYWluIGBDaGVja0Fsd2F5c2AuXG4gICAqL1xuICBDaGVja0Fsd2F5cyxcblxuICAvKipcbiAgICogYERldGFjaGVkYCBtZWFucyB0aGF0IHRoZSBjaGFuZ2UgZGV0ZWN0b3Igc3ViIHRyZWUgaXMgbm90IGEgcGFydCBvZiB0aGUgbWFpbiB0cmVlIGFuZFxuICAgKiBzaG91bGQgYmUgc2tpcHBlZC5cbiAgICovXG4gIERldGFjaGVkLFxuXG4gIC8qKlxuICAgKiBgRXJyb3JlZGAgbWVhbnMgdGhhdCB0aGUgY2hhbmdlIGRldGVjdG9yIGVuY291bnRlcmVkIGFuIGVycm9yIGNoZWNraW5nIGEgYmluZGluZ1xuICAgKiBvciBjYWxsaW5nIGEgZGlyZWN0aXZlIGxpZmVjeWNsZSBtZXRob2QgYW5kIGlzIG5vdyBpbiBhbiBpbmNvbnNpc3RlbnQgc3RhdGUuIENoYW5nZVxuICAgKiBkZXRlY3RvcnMgaW4gdGhpcyBzdGF0ZSB3aWxsIG5vIGxvbmdlciBkZXRlY3QgY2hhbmdlcy5cbiAgICovXG4gIEVycm9yZWQsXG5cbiAgLyoqXG4gICAqIGBEZXN0cm95ZWRgIG1lYW5zIHRoYXQgdGhlIGNoYW5nZSBkZXRlY3RvciBpcyBkZXN0cm95ZWQuXG4gICAqL1xuICBEZXN0cm95ZWQsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0RlZmF1bHRDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneShjaGFuZ2VEZXRlY3Rpb25TdHJhdGVneTogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kpOlxuICAgIGJvb2xlYW4ge1xuICByZXR1cm4gY2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kgPT0gbnVsbCB8fFxuICAgICAgY2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kgPT09IENoYW5nZURldGVjdGlvblN0cmF0ZWd5LkRlZmF1bHQ7XG59XG4iXX0=