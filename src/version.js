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
    }
    /**
     * @return {?}
     */
    get major() { return this.full.split('.')[0]; }
    /**
     * @return {?}
     */
    get minor() { return this.full.split('.')[1]; }
    /**
     * @return {?}
     */
    get patch() { return this.full.split('.').slice(2).join('.'); }
}
function Version_tsickle_Closure_declarations() {
    /** @type {?} */
    Version.prototype.full;
}
/**
 * @stable
 */
export const /** @type {?} */ VERSION = new Version('0.0.0-PLACEHOLDER');
//# sourceMappingURL=version.js.map