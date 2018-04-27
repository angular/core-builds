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
//# sourceMappingURL=constants.js.map