/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
export function PlatformReflectionCapabilities() { }
if (false) {
    /**
     * @return {?}
     */
    PlatformReflectionCapabilities.prototype.isReflectionEnabled = function () { };
    /**
     * @param {?} type
     * @return {?}
     */
    PlatformReflectionCapabilities.prototype.factory = function (type) { };
    /**
     * @param {?} type
     * @param {?} lcProperty
     * @return {?}
     */
    PlatformReflectionCapabilities.prototype.hasLifecycleHook = function (type, lcProperty) { };
    /**
     * @param {?} type
     * @return {?}
     */
    PlatformReflectionCapabilities.prototype.guards = function (type) { };
    /**
     * Return a list of annotations/types for constructor parameters
     * @param {?} type
     * @return {?}
     */
    PlatformReflectionCapabilities.prototype.parameters = function (type) { };
    /**
     * Return a list of annotations declared on the class
     * @param {?} type
     * @return {?}
     */
    PlatformReflectionCapabilities.prototype.annotations = function (type) { };
    /**
     * Return a object literal which describes the annotations on Class fields/properties.
     * @param {?} typeOrFunc
     * @return {?}
     */
    PlatformReflectionCapabilities.prototype.propMetadata = function (typeOrFunc) { };
    /**
     * @param {?} name
     * @return {?}
     */
    PlatformReflectionCapabilities.prototype.getter = function (name) { };
    /**
     * @param {?} name
     * @return {?}
     */
    PlatformReflectionCapabilities.prototype.setter = function (name) { };
    /**
     * @param {?} name
     * @return {?}
     */
    PlatformReflectionCapabilities.prototype.method = function (name) { };
    /**
     * @param {?} type
     * @return {?}
     */
    PlatformReflectionCapabilities.prototype.importUri = function (type) { };
    /**
     * @param {?} type
     * @return {?}
     */
    PlatformReflectionCapabilities.prototype.resourceUri = function (type) { };
    /**
     * @param {?} name
     * @param {?} moduleUrl
     * @param {?} members
     * @param {?} runtime
     * @return {?}
     */
    PlatformReflectionCapabilities.prototype.resolveIdentifier = function (name, moduleUrl, members, runtime) { };
    /**
     * @param {?} enumIdentifier
     * @param {?} name
     * @return {?}
     */
    PlatformReflectionCapabilities.prototype.resolveEnum = function (enumIdentifier, name) { };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhdGZvcm1fcmVmbGVjdGlvbl9jYXBhYmlsaXRpZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZWZsZWN0aW9uL3BsYXRmb3JtX3JlZmxlY3Rpb25fY2FwYWJpbGl0aWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBV0Esb0RBMkJDOzs7OztJQTFCQywrRUFBK0I7Ozs7O0lBQy9CLHVFQUFtQzs7Ozs7O0lBQ25DLDRGQUF5RDs7Ozs7SUFDekQsc0VBQXdDOzs7Ozs7SUFLeEMsMEVBQXFDOzs7Ozs7SUFLckMsMkVBQW9DOzs7Ozs7SUFLcEMsa0ZBQTREOzs7OztJQUM1RCxzRUFBK0I7Ozs7O0lBQy9CLHNFQUErQjs7Ozs7SUFDL0Isc0VBQStCOzs7OztJQUMvQix5RUFBbUM7Ozs7O0lBQ25DLDJFQUFxQzs7Ozs7Ozs7SUFDckMsOEdBQXlGOzs7Ozs7SUFDekYsMkZBQW9EIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7R2V0dGVyRm4sIE1ldGhvZEZuLCBTZXR0ZXJGbn0gZnJvbSAnLi90eXBlcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGxhdGZvcm1SZWZsZWN0aW9uQ2FwYWJpbGl0aWVzIHtcbiAgaXNSZWZsZWN0aW9uRW5hYmxlZCgpOiBib29sZWFuO1xuICBmYWN0b3J5KHR5cGU6IFR5cGU8YW55Pik6IEZ1bmN0aW9uO1xuICBoYXNMaWZlY3ljbGVIb29rKHR5cGU6IGFueSwgbGNQcm9wZXJ0eTogc3RyaW5nKTogYm9vbGVhbjtcbiAgZ3VhcmRzKHR5cGU6IGFueSk6IHtba2V5OiBzdHJpbmddOiBhbnl9O1xuXG4gIC8qKlxuICAgKiBSZXR1cm4gYSBsaXN0IG9mIGFubm90YXRpb25zL3R5cGVzIGZvciBjb25zdHJ1Y3RvciBwYXJhbWV0ZXJzXG4gICAqL1xuICBwYXJhbWV0ZXJzKHR5cGU6IFR5cGU8YW55Pik6IGFueVtdW107XG5cbiAgLyoqXG4gICAqIFJldHVybiBhIGxpc3Qgb2YgYW5ub3RhdGlvbnMgZGVjbGFyZWQgb24gdGhlIGNsYXNzXG4gICAqL1xuICBhbm5vdGF0aW9ucyh0eXBlOiBUeXBlPGFueT4pOiBhbnlbXTtcblxuICAvKipcbiAgICogUmV0dXJuIGEgb2JqZWN0IGxpdGVyYWwgd2hpY2ggZGVzY3JpYmVzIHRoZSBhbm5vdGF0aW9ucyBvbiBDbGFzcyBmaWVsZHMvcHJvcGVydGllcy5cbiAgICovXG4gIHByb3BNZXRhZGF0YSh0eXBlT3JGdW5jOiBUeXBlPGFueT4pOiB7W2tleTogc3RyaW5nXTogYW55W119O1xuICBnZXR0ZXIobmFtZTogc3RyaW5nKTogR2V0dGVyRm47XG4gIHNldHRlcihuYW1lOiBzdHJpbmcpOiBTZXR0ZXJGbjtcbiAgbWV0aG9kKG5hbWU6IHN0cmluZyk6IE1ldGhvZEZuO1xuICBpbXBvcnRVcmkodHlwZTogVHlwZTxhbnk+KTogc3RyaW5nO1xuICByZXNvdXJjZVVyaSh0eXBlOiBUeXBlPGFueT4pOiBzdHJpbmc7XG4gIHJlc29sdmVJZGVudGlmaWVyKG5hbWU6IHN0cmluZywgbW9kdWxlVXJsOiBzdHJpbmcsIG1lbWJlcnM6IHN0cmluZ1tdLCBydW50aW1lOiBhbnkpOiBhbnk7XG4gIHJlc29sdmVFbnVtKGVudW1JZGVudGlmaWVyOiBhbnksIG5hbWU6IHN0cmluZyk6IGFueTtcbn1cbiJdfQ==