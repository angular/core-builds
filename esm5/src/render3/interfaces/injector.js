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
 * @record
 */
export function LInjector() { }
function LInjector_tsickle_Closure_declarations() {
    /**
     * We need to store a reference to the injector's parent so DI can keep looking up
     * the injector tree until it finds the dependency it's looking for.
     * @type {?}
     */
    LInjector.prototype.parent;
    /**
     * Allows access to the directives array in that node's static data and to
     * the node's flags (for starting directive index and directive size). Necessary
     * for DI to retrieve a directive from the data array if injector indicates
     * it is there.
     * @type {?}
     */
    LInjector.prototype.node;
    /**
     * The following bloom filter determines whether a directive is available
     * on the associated node or not. This prevents us from searching the directives
     * array at this level unless it's probable the directive is in it.
     *
     * - bf0: Check directive IDs 0-31  (IDs are % 128)
     * - bf1: Check directive IDs 32-63
     * - bf2: Check directive IDs 64-95
     * - bf3: Check directive IDs 96-127
     * - bf4: Check directive IDs 128-159
     * - bf5: Check directive IDs 160 - 191
     * - bf6: Check directive IDs 192 - 223
     * - bf7: Check directive IDs 224 - 255
     *
     * See: https://en.wikipedia.org/wiki/Bloom_filter for more about bloom filters.
     * @type {?}
     */
    LInjector.prototype.bf0;
    /** @type {?} */
    LInjector.prototype.bf1;
    /** @type {?} */
    LInjector.prototype.bf2;
    /** @type {?} */
    LInjector.prototype.bf3;
    /** @type {?} */
    LInjector.prototype.bf4;
    /** @type {?} */
    LInjector.prototype.bf5;
    /** @type {?} */
    LInjector.prototype.bf6;
    /** @type {?} */
    LInjector.prototype.bf7;
    /**
     * cbf0 - cbf7 properties determine whether a directive is available through a
     * parent injector. They refer to the merged values of parent bloom filters. This
     * allows us to skip looking up the chain unless it's probable that directive exists
     * up the chain.
     * @type {?}
     */
    LInjector.prototype.cbf0;
    /** @type {?} */
    LInjector.prototype.cbf1;
    /** @type {?} */
    LInjector.prototype.cbf2;
    /** @type {?} */
    LInjector.prototype.cbf3;
    /** @type {?} */
    LInjector.prototype.cbf4;
    /** @type {?} */
    LInjector.prototype.cbf5;
    /** @type {?} */
    LInjector.prototype.cbf6;
    /** @type {?} */
    LInjector.prototype.cbf7;
    /**
     * Stores the TemplateRef so subsequent injections of the TemplateRef get the same instance.
     * @type {?}
     */
    LInjector.prototype.templateRef;
    /**
     * Stores the ViewContainerRef so subsequent injections of the ViewContainerRef get the same
     * instance.
     * @type {?}
     */
    LInjector.prototype.viewContainerRef;
    /**
     * Stores the ElementRef so subsequent injections of the ElementRef get the same instance.
     * @type {?}
     */
    LInjector.prototype.elementRef;
    /**
     * Stores the ChangeDetectorRef so subsequent injections of the ChangeDetectorRef get the
     * same instance.
     * @type {?}
     */
    LInjector.prototype.changeDetectorRef;
}
// Note: This hack is necessary so we don't erroneously get a circular dependency
// failure based on types.
export var /** @type {?} */ unusedValueExportToPlacateAjd = 1;
//# sourceMappingURL=injector.js.map