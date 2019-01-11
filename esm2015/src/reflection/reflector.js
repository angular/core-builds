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
 * Provides access to reflection data about symbols. Used internally by Angular
 * to power dependency injection and compilation.
 */
export class Reflector {
    /**
     * @param {?} reflectionCapabilities
     */
    constructor(reflectionCapabilities) {
        this.reflectionCapabilities = reflectionCapabilities;
    }
    /**
     * @param {?} caps
     * @return {?}
     */
    updateCapabilities(caps) { this.reflectionCapabilities = caps; }
    /**
     * @param {?} type
     * @return {?}
     */
    factory(type) { return this.reflectionCapabilities.factory(type); }
    /**
     * @param {?} typeOrFunc
     * @return {?}
     */
    parameters(typeOrFunc) {
        return this.reflectionCapabilities.parameters(typeOrFunc);
    }
    /**
     * @param {?} typeOrFunc
     * @return {?}
     */
    annotations(typeOrFunc) {
        return this.reflectionCapabilities.annotations(typeOrFunc);
    }
    /**
     * @param {?} typeOrFunc
     * @return {?}
     */
    propMetadata(typeOrFunc) {
        return this.reflectionCapabilities.propMetadata(typeOrFunc);
    }
    /**
     * @param {?} type
     * @param {?} lcProperty
     * @return {?}
     */
    hasLifecycleHook(type, lcProperty) {
        return this.reflectionCapabilities.hasLifecycleHook(type, lcProperty);
    }
    /**
     * @param {?} name
     * @return {?}
     */
    getter(name) { return this.reflectionCapabilities.getter(name); }
    /**
     * @param {?} name
     * @return {?}
     */
    setter(name) { return this.reflectionCapabilities.setter(name); }
    /**
     * @param {?} name
     * @return {?}
     */
    method(name) { return this.reflectionCapabilities.method(name); }
    /**
     * @param {?} type
     * @return {?}
     */
    importUri(type) { return this.reflectionCapabilities.importUri(type); }
    /**
     * @param {?} type
     * @return {?}
     */
    resourceUri(type) { return this.reflectionCapabilities.resourceUri(type); }
    /**
     * @param {?} name
     * @param {?} moduleUrl
     * @param {?} members
     * @param {?} runtime
     * @return {?}
     */
    resolveIdentifier(name, moduleUrl, members, runtime) {
        return this.reflectionCapabilities.resolveIdentifier(name, moduleUrl, members, runtime);
    }
    /**
     * @param {?} identifier
     * @param {?} name
     * @return {?}
     */
    resolveEnum(identifier, name) {
        return this.reflectionCapabilities.resolveEnum(identifier, name);
    }
}
if (false) {
    /** @type {?} */
    Reflector.prototype.reflectionCapabilities;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVmbGVjdGlvbi9yZWZsZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLE1BQU0sT0FBTyxTQUFTOzs7O0lBQ3BCLFlBQW1CLHNCQUFzRDtRQUF0RCwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQWdDO0lBQUcsQ0FBQzs7Ozs7SUFFN0Usa0JBQWtCLENBQUMsSUFBb0MsSUFBSSxJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQzs7Ozs7SUFFaEcsT0FBTyxDQUFDLElBQWUsSUFBYyxPQUFPLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7OztJQUV4RixVQUFVLENBQUMsVUFBcUI7UUFDOUIsT0FBTyxJQUFJLENBQUMsc0JBQXNCLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzVELENBQUM7Ozs7O0lBRUQsV0FBVyxDQUFDLFVBQXFCO1FBQy9CLE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUM3RCxDQUFDOzs7OztJQUVELFlBQVksQ0FBQyxVQUFxQjtRQUNoQyxPQUFPLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDOUQsQ0FBQzs7Ozs7O0lBRUQsZ0JBQWdCLENBQUMsSUFBUyxFQUFFLFVBQWtCO1FBQzVDLE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztJQUN4RSxDQUFDOzs7OztJQUVELE1BQU0sQ0FBQyxJQUFZLElBQWMsT0FBTyxJQUFJLENBQUMsc0JBQXNCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Ozs7SUFFbkYsTUFBTSxDQUFDLElBQVksSUFBYyxPQUFPLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7OztJQUVuRixNQUFNLENBQUMsSUFBWSxJQUFjLE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Ozs7O0lBRW5GLFNBQVMsQ0FBQyxJQUFTLElBQVksT0FBTyxJQUFJLENBQUMsc0JBQXNCLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Ozs7SUFFcEYsV0FBVyxDQUFDLElBQVMsSUFBWSxPQUFPLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7Ozs7OztJQUV4RixpQkFBaUIsQ0FBQyxJQUFZLEVBQUUsU0FBaUIsRUFBRSxPQUFpQixFQUFFLE9BQVk7UUFDaEYsT0FBTyxJQUFJLENBQUMsc0JBQXNCLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDMUYsQ0FBQzs7Ozs7O0lBRUQsV0FBVyxDQUFDLFVBQWUsRUFBRSxJQUFZO1FBQ3ZDLE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDbkUsQ0FBQztDQUNGOzs7SUF2Q2EsMkNBQTZEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7UGxhdGZvcm1SZWZsZWN0aW9uQ2FwYWJpbGl0aWVzfSBmcm9tICcuL3BsYXRmb3JtX3JlZmxlY3Rpb25fY2FwYWJpbGl0aWVzJztcbmltcG9ydCB7R2V0dGVyRm4sIE1ldGhvZEZuLCBTZXR0ZXJGbn0gZnJvbSAnLi90eXBlcyc7XG5cbmV4cG9ydCB7UGxhdGZvcm1SZWZsZWN0aW9uQ2FwYWJpbGl0aWVzfTtcbmV4cG9ydCB7R2V0dGVyRm4sIE1ldGhvZEZuLCBTZXR0ZXJGbn07XG5cbi8qKlxuICogUHJvdmlkZXMgYWNjZXNzIHRvIHJlZmxlY3Rpb24gZGF0YSBhYm91dCBzeW1ib2xzLiBVc2VkIGludGVybmFsbHkgYnkgQW5ndWxhclxuICogdG8gcG93ZXIgZGVwZW5kZW5jeSBpbmplY3Rpb24gYW5kIGNvbXBpbGF0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgUmVmbGVjdG9yIHtcbiAgY29uc3RydWN0b3IocHVibGljIHJlZmxlY3Rpb25DYXBhYmlsaXRpZXM6IFBsYXRmb3JtUmVmbGVjdGlvbkNhcGFiaWxpdGllcykge31cblxuICB1cGRhdGVDYXBhYmlsaXRpZXMoY2FwczogUGxhdGZvcm1SZWZsZWN0aW9uQ2FwYWJpbGl0aWVzKSB7IHRoaXMucmVmbGVjdGlvbkNhcGFiaWxpdGllcyA9IGNhcHM7IH1cblxuICBmYWN0b3J5KHR5cGU6IFR5cGU8YW55Pik6IEZ1bmN0aW9uIHsgcmV0dXJuIHRoaXMucmVmbGVjdGlvbkNhcGFiaWxpdGllcy5mYWN0b3J5KHR5cGUpOyB9XG5cbiAgcGFyYW1ldGVycyh0eXBlT3JGdW5jOiBUeXBlPGFueT4pOiBhbnlbXVtdIHtcbiAgICByZXR1cm4gdGhpcy5yZWZsZWN0aW9uQ2FwYWJpbGl0aWVzLnBhcmFtZXRlcnModHlwZU9yRnVuYyk7XG4gIH1cblxuICBhbm5vdGF0aW9ucyh0eXBlT3JGdW5jOiBUeXBlPGFueT4pOiBhbnlbXSB7XG4gICAgcmV0dXJuIHRoaXMucmVmbGVjdGlvbkNhcGFiaWxpdGllcy5hbm5vdGF0aW9ucyh0eXBlT3JGdW5jKTtcbiAgfVxuXG4gIHByb3BNZXRhZGF0YSh0eXBlT3JGdW5jOiBUeXBlPGFueT4pOiB7W2tleTogc3RyaW5nXTogYW55W119IHtcbiAgICByZXR1cm4gdGhpcy5yZWZsZWN0aW9uQ2FwYWJpbGl0aWVzLnByb3BNZXRhZGF0YSh0eXBlT3JGdW5jKTtcbiAgfVxuXG4gIGhhc0xpZmVjeWNsZUhvb2sodHlwZTogYW55LCBsY1Byb3BlcnR5OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5yZWZsZWN0aW9uQ2FwYWJpbGl0aWVzLmhhc0xpZmVjeWNsZUhvb2sodHlwZSwgbGNQcm9wZXJ0eSk7XG4gIH1cblxuICBnZXR0ZXIobmFtZTogc3RyaW5nKTogR2V0dGVyRm4geyByZXR1cm4gdGhpcy5yZWZsZWN0aW9uQ2FwYWJpbGl0aWVzLmdldHRlcihuYW1lKTsgfVxuXG4gIHNldHRlcihuYW1lOiBzdHJpbmcpOiBTZXR0ZXJGbiB7IHJldHVybiB0aGlzLnJlZmxlY3Rpb25DYXBhYmlsaXRpZXMuc2V0dGVyKG5hbWUpOyB9XG5cbiAgbWV0aG9kKG5hbWU6IHN0cmluZyk6IE1ldGhvZEZuIHsgcmV0dXJuIHRoaXMucmVmbGVjdGlvbkNhcGFiaWxpdGllcy5tZXRob2QobmFtZSk7IH1cblxuICBpbXBvcnRVcmkodHlwZTogYW55KTogc3RyaW5nIHsgcmV0dXJuIHRoaXMucmVmbGVjdGlvbkNhcGFiaWxpdGllcy5pbXBvcnRVcmkodHlwZSk7IH1cblxuICByZXNvdXJjZVVyaSh0eXBlOiBhbnkpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5yZWZsZWN0aW9uQ2FwYWJpbGl0aWVzLnJlc291cmNlVXJpKHR5cGUpOyB9XG5cbiAgcmVzb2x2ZUlkZW50aWZpZXIobmFtZTogc3RyaW5nLCBtb2R1bGVVcmw6IHN0cmluZywgbWVtYmVyczogc3RyaW5nW10sIHJ1bnRpbWU6IGFueSk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMucmVmbGVjdGlvbkNhcGFiaWxpdGllcy5yZXNvbHZlSWRlbnRpZmllcihuYW1lLCBtb2R1bGVVcmwsIG1lbWJlcnMsIHJ1bnRpbWUpO1xuICB9XG5cbiAgcmVzb2x2ZUVudW0oaWRlbnRpZmllcjogYW55LCBuYW1lOiBzdHJpbmcpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLnJlZmxlY3Rpb25DYXBhYmlsaXRpZXMucmVzb2x2ZUVudW0oaWRlbnRpZmllciwgbmFtZSk7XG4gIH1cbn1cbiJdfQ==