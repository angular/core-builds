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
 * \@whatItDoes Represents the version of Angular
 *
 * \@stable
 */
export class Version {
    /**
     * @param {?} full
     */
    constructor(full) {
        this.full = full;
        this.major = full.split('.')[0];
        this.minor = full.split('.')[1];
        this.patch = full.split('.').slice(2).join('.');
    }
}
function Version_tsickle_Closure_declarations() {
    /** @type {?} */
    Version.prototype.major;
    /** @type {?} */
    Version.prototype.minor;
    /** @type {?} */
    Version.prototype.patch;
    /** @type {?} */
    Version.prototype.full;
}
/**
 * \@stable
 */
export const /** @type {?} */ VERSION = new Version('6.0.0-rc.1-d6bf71a');
//# sourceMappingURL=version.js.map