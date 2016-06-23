/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
"use strict";
function getTypeOf(instance /** TODO #9100 */) {
    return instance.constructor;
}
exports.getTypeOf = getTypeOf;
function instantiateType(type, params) {
    if (params === void 0) { params = []; }
    var instance = Object.create(type.prototype);
    instance.constructor.apply(instance, params);
    return instance;
}
exports.instantiateType = instantiateType;
//# sourceMappingURL=lang_utils.js.map