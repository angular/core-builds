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
/** @enum {number} */
const ChangeDetectionStrategy = {
    /**
       * `OnPush` means that the change detector's mode will be initially set to `CheckOnce`.
       */
    OnPush: 0,
    /**
       * `Default` means that the change detector's mode will be initially set to `CheckAlways`.
       */
    Default: 1,
};
export { ChangeDetectionStrategy };
ChangeDetectionStrategy[ChangeDetectionStrategy.OnPush] = "OnPush";
ChangeDetectionStrategy[ChangeDetectionStrategy.Default] = "Default";
/** @enum {number} */
const ChangeDetectorStatus = {
    /**
       * `CheckOnce` means that after calling detectChanges the mode of the change detector
       * will become `Checked`.
       */
    CheckOnce: 0,
    /**
       * `Checked` means that the change detector should be skipped until its mode changes to
       * `CheckOnce`.
       */
    Checked: 1,
    /**
       * `CheckAlways` means that after calling detectChanges the mode of the change detector
       * will remain `CheckAlways`.
       */
    CheckAlways: 2,
    /**
       * `Detached` means that the change detector sub tree is not a part of the main tree and
       * should be skipped.
       */
    Detached: 3,
    /**
       * `Errored` means that the change detector encountered an error checking a binding
       * or calling a directive lifecycle method and is now in an inconsistent state. Change
       * detectors in this state will no longer detect changes.
       */
    Errored: 4,
    /**
       * `Destroyed` means that the change detector is destroyed.
       */
    Destroyed: 5,
};
export { ChangeDetectorStatus };
ChangeDetectorStatus[ChangeDetectorStatus.CheckOnce] = "CheckOnce";
ChangeDetectorStatus[ChangeDetectorStatus.Checked] = "Checked";
ChangeDetectorStatus[ChangeDetectorStatus.CheckAlways] = "CheckAlways";
ChangeDetectorStatus[ChangeDetectorStatus.Detached] = "Detached";
ChangeDetectorStatus[ChangeDetectorStatus.Errored] = "Errored";
ChangeDetectorStatus[ChangeDetectorStatus.Destroyed] = "Destroyed";
/**
 * @param {?} changeDetectionStrategy
 * @return {?}
 */
export function isDefaultChangeDetectionStrategy(changeDetectionStrategy) {
    return changeDetectionStrategy == null ||
        changeDetectionStrategy === ChangeDetectionStrategy.Default;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RhbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9jb25zdGFudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUVBLE1BQU0sMkNBQTJDLHVCQUFnRDtJQUUvRixPQUFPLHVCQUF1QixJQUFJLElBQUk7UUFDbEMsdUJBQXVCLEtBQUssdUJBQXVCLENBQUMsT0FBTyxDQUFDO0NBQ2pFIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5cbi8qKlxuICogRGVzY3JpYmVzIHdpdGhpbiB0aGUgY2hhbmdlIGRldGVjdG9yIHdoaWNoIHN0cmF0ZWd5IHdpbGwgYmUgdXNlZCB0aGUgbmV4dCB0aW1lIGNoYW5nZVxuICogZGV0ZWN0aW9uIGlzIHRyaWdnZXJlZC5cbiAqXG4gKi9cbmV4cG9ydCBlbnVtIENoYW5nZURldGVjdGlvblN0cmF0ZWd5IHtcbiAgLyoqXG4gICAqIGBPblB1c2hgIG1lYW5zIHRoYXQgdGhlIGNoYW5nZSBkZXRlY3RvcidzIG1vZGUgd2lsbCBiZSBpbml0aWFsbHkgc2V0IHRvIGBDaGVja09uY2VgLlxuICAgKi9cbiAgT25QdXNoID0gMCxcblxuICAvKipcbiAgICogYERlZmF1bHRgIG1lYW5zIHRoYXQgdGhlIGNoYW5nZSBkZXRlY3RvcidzIG1vZGUgd2lsbCBiZSBpbml0aWFsbHkgc2V0IHRvIGBDaGVja0Fsd2F5c2AuXG4gICAqL1xuICBEZWZhdWx0ID0gMSxcbn1cblxuLyoqXG4gKiBEZXNjcmliZXMgdGhlIHN0YXR1cyBvZiB0aGUgZGV0ZWN0b3IuXG4gKi9cbmV4cG9ydCBlbnVtIENoYW5nZURldGVjdG9yU3RhdHVzIHtcbiAgLyoqXG4gICAqIGBDaGVja09uY2VgIG1lYW5zIHRoYXQgYWZ0ZXIgY2FsbGluZyBkZXRlY3RDaGFuZ2VzIHRoZSBtb2RlIG9mIHRoZSBjaGFuZ2UgZGV0ZWN0b3JcbiAgICogd2lsbCBiZWNvbWUgYENoZWNrZWRgLlxuICAgKi9cbiAgQ2hlY2tPbmNlLFxuXG4gIC8qKlxuICAgKiBgQ2hlY2tlZGAgbWVhbnMgdGhhdCB0aGUgY2hhbmdlIGRldGVjdG9yIHNob3VsZCBiZSBza2lwcGVkIHVudGlsIGl0cyBtb2RlIGNoYW5nZXMgdG9cbiAgICogYENoZWNrT25jZWAuXG4gICAqL1xuICBDaGVja2VkLFxuXG4gIC8qKlxuICAgKiBgQ2hlY2tBbHdheXNgIG1lYW5zIHRoYXQgYWZ0ZXIgY2FsbGluZyBkZXRlY3RDaGFuZ2VzIHRoZSBtb2RlIG9mIHRoZSBjaGFuZ2UgZGV0ZWN0b3JcbiAgICogd2lsbCByZW1haW4gYENoZWNrQWx3YXlzYC5cbiAgICovXG4gIENoZWNrQWx3YXlzLFxuXG4gIC8qKlxuICAgKiBgRGV0YWNoZWRgIG1lYW5zIHRoYXQgdGhlIGNoYW5nZSBkZXRlY3RvciBzdWIgdHJlZSBpcyBub3QgYSBwYXJ0IG9mIHRoZSBtYWluIHRyZWUgYW5kXG4gICAqIHNob3VsZCBiZSBza2lwcGVkLlxuICAgKi9cbiAgRGV0YWNoZWQsXG5cbiAgLyoqXG4gICAqIGBFcnJvcmVkYCBtZWFucyB0aGF0IHRoZSBjaGFuZ2UgZGV0ZWN0b3IgZW5jb3VudGVyZWQgYW4gZXJyb3IgY2hlY2tpbmcgYSBiaW5kaW5nXG4gICAqIG9yIGNhbGxpbmcgYSBkaXJlY3RpdmUgbGlmZWN5Y2xlIG1ldGhvZCBhbmQgaXMgbm93IGluIGFuIGluY29uc2lzdGVudCBzdGF0ZS4gQ2hhbmdlXG4gICAqIGRldGVjdG9ycyBpbiB0aGlzIHN0YXRlIHdpbGwgbm8gbG9uZ2VyIGRldGVjdCBjaGFuZ2VzLlxuICAgKi9cbiAgRXJyb3JlZCxcblxuICAvKipcbiAgICogYERlc3Ryb3llZGAgbWVhbnMgdGhhdCB0aGUgY2hhbmdlIGRldGVjdG9yIGlzIGRlc3Ryb3llZC5cbiAgICovXG4gIERlc3Ryb3llZCxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRGVmYXVsdENoYW5nZURldGVjdGlvblN0cmF0ZWd5KGNoYW5nZURldGVjdGlvblN0cmF0ZWd5OiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSk6XG4gICAgYm9vbGVhbiB7XG4gIHJldHVybiBjaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSA9PSBudWxsIHx8XG4gICAgICBjaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSA9PT0gQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuRGVmYXVsdDtcbn1cbiJdfQ==