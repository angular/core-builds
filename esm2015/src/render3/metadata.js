/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
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
function TypeWithMetadata() { }
/** @type {?|undefined} */
TypeWithMetadata.prototype.decorators;
/** @type {?|undefined} */
TypeWithMetadata.prototype.ctorParameters;
/** @type {?|undefined} */
TypeWithMetadata.prototype.propDecorators;
/**
 * Adds decorator, constructor, and property metadata to a given type via static metadata fields
 * on the type.
 *
 * These metadata fields can later be read with Angular's `ReflectionCapabilities` API.
 *
 * Calls to `setClassMetadata` can be marked as pure, resulting in the metadata assignments being
 * tree-shaken away during production builds.
 * @param {?} type
 * @param {?} decorators
 * @param {?} ctorParameters
 * @param {?} propDecorators
 * @return {?}
 */
export function setClassMetadata(type, decorators, ctorParameters, propDecorators) {
    /** @type {?} */
    const clazz = /** @type {?} */ (type);
    if (decorators !== null) {
        if (clazz.decorators !== undefined) {
            clazz.decorators.push(...decorators);
        }
        else {
            clazz.decorators = decorators;
        }
    }
    if (ctorParameters !== null) {
        // Rather than merging, clobber the existing parameters. If other projects exist which use
        // tsickle-style annotations and reflect over them in the same way, this could cause issues,
        // but that is vanishingly unlikely.
        clazz.ctorParameters = ctorParameters;
    }
    if (propDecorators !== null) {
        // The property decorator objects are merged as it is possible different fields have different
        // decorator types. Decorators on individual fields are not merged, as it's also incredibly
        // unlikely that a field will be decorated both with an Angular decorator and a non-Angular
        // decorator that's also been downleveled.
        if (clazz.propDecorators !== undefined) {
            clazz.propDecorators = Object.assign({}, clazz.propDecorators, propDecorators);
        }
        else {
            clazz.propDecorators = propDecorators;
        }
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YWRhdGEuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL21ldGFkYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeUJBLE1BQU0sVUFBVSxnQkFBZ0IsQ0FDNUIsSUFBZSxFQUFFLFVBQXdCLEVBQUUsY0FBNEIsRUFDdkUsY0FBNkM7O0lBQy9DLE1BQU0sS0FBSyxxQkFBRyxJQUF3QixFQUFDO0lBQ3ZDLElBQUksVUFBVSxLQUFLLElBQUksRUFBRTtRQUN2QixJQUFJLEtBQUssQ0FBQyxVQUFVLEtBQUssU0FBUyxFQUFFO1lBQ2xDLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUM7U0FDdEM7YUFBTTtZQUNMLEtBQUssQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1NBQy9CO0tBQ0Y7SUFDRCxJQUFJLGNBQWMsS0FBSyxJQUFJLEVBQUU7Ozs7UUFJM0IsS0FBSyxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7S0FDdkM7SUFDRCxJQUFJLGNBQWMsS0FBSyxJQUFJLEVBQUU7Ozs7O1FBSzNCLElBQUksS0FBSyxDQUFDLGNBQWMsS0FBSyxTQUFTLEVBQUU7WUFDdEMsS0FBSyxDQUFDLGNBQWMscUJBQU8sS0FBSyxDQUFDLGNBQWMsRUFBSyxjQUFjLENBQUMsQ0FBQztTQUNyRTthQUFNO1lBQ0wsS0FBSyxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7U0FDdkM7S0FDRjtDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuXG5pbnRlcmZhY2UgVHlwZVdpdGhNZXRhZGF0YSBleHRlbmRzIFR5cGU8YW55PiB7XG4gIGRlY29yYXRvcnM/OiBhbnlbXTtcbiAgY3RvclBhcmFtZXRlcnM/OiBhbnlbXTtcbiAgcHJvcERlY29yYXRvcnM/OiB7W2ZpZWxkOiBzdHJpbmddOiBhbnl9O1xufVxuXG4vKipcbiAqIEFkZHMgZGVjb3JhdG9yLCBjb25zdHJ1Y3RvciwgYW5kIHByb3BlcnR5IG1ldGFkYXRhIHRvIGEgZ2l2ZW4gdHlwZSB2aWEgc3RhdGljIG1ldGFkYXRhIGZpZWxkc1xuICogb24gdGhlIHR5cGUuXG4gKlxuICogVGhlc2UgbWV0YWRhdGEgZmllbGRzIGNhbiBsYXRlciBiZSByZWFkIHdpdGggQW5ndWxhcidzIGBSZWZsZWN0aW9uQ2FwYWJpbGl0aWVzYCBBUEkuXG4gKlxuICogQ2FsbHMgdG8gYHNldENsYXNzTWV0YWRhdGFgIGNhbiBiZSBtYXJrZWQgYXMgcHVyZSwgcmVzdWx0aW5nIGluIHRoZSBtZXRhZGF0YSBhc3NpZ25tZW50cyBiZWluZ1xuICogdHJlZS1zaGFrZW4gYXdheSBkdXJpbmcgcHJvZHVjdGlvbiBidWlsZHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRDbGFzc01ldGFkYXRhKFxuICAgIHR5cGU6IFR5cGU8YW55PiwgZGVjb3JhdG9yczogYW55W10gfCBudWxsLCBjdG9yUGFyYW1ldGVyczogYW55W10gfCBudWxsLFxuICAgIHByb3BEZWNvcmF0b3JzOiB7W2ZpZWxkOiBzdHJpbmddOiBhbnl9IHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBjbGF6eiA9IHR5cGUgYXMgVHlwZVdpdGhNZXRhZGF0YTtcbiAgaWYgKGRlY29yYXRvcnMgIT09IG51bGwpIHtcbiAgICBpZiAoY2xhenouZGVjb3JhdG9ycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjbGF6ei5kZWNvcmF0b3JzLnB1c2goLi4uZGVjb3JhdG9ycyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNsYXp6LmRlY29yYXRvcnMgPSBkZWNvcmF0b3JzO1xuICAgIH1cbiAgfVxuICBpZiAoY3RvclBhcmFtZXRlcnMgIT09IG51bGwpIHtcbiAgICAvLyBSYXRoZXIgdGhhbiBtZXJnaW5nLCBjbG9iYmVyIHRoZSBleGlzdGluZyBwYXJhbWV0ZXJzLiBJZiBvdGhlciBwcm9qZWN0cyBleGlzdCB3aGljaCB1c2VcbiAgICAvLyB0c2lja2xlLXN0eWxlIGFubm90YXRpb25zIGFuZCByZWZsZWN0IG92ZXIgdGhlbSBpbiB0aGUgc2FtZSB3YXksIHRoaXMgY291bGQgY2F1c2UgaXNzdWVzLFxuICAgIC8vIGJ1dCB0aGF0IGlzIHZhbmlzaGluZ2x5IHVubGlrZWx5LlxuICAgIGNsYXp6LmN0b3JQYXJhbWV0ZXJzID0gY3RvclBhcmFtZXRlcnM7XG4gIH1cbiAgaWYgKHByb3BEZWNvcmF0b3JzICE9PSBudWxsKSB7XG4gICAgLy8gVGhlIHByb3BlcnR5IGRlY29yYXRvciBvYmplY3RzIGFyZSBtZXJnZWQgYXMgaXQgaXMgcG9zc2libGUgZGlmZmVyZW50IGZpZWxkcyBoYXZlIGRpZmZlcmVudFxuICAgIC8vIGRlY29yYXRvciB0eXBlcy4gRGVjb3JhdG9ycyBvbiBpbmRpdmlkdWFsIGZpZWxkcyBhcmUgbm90IG1lcmdlZCwgYXMgaXQncyBhbHNvIGluY3JlZGlibHlcbiAgICAvLyB1bmxpa2VseSB0aGF0IGEgZmllbGQgd2lsbCBiZSBkZWNvcmF0ZWQgYm90aCB3aXRoIGFuIEFuZ3VsYXIgZGVjb3JhdG9yIGFuZCBhIG5vbi1Bbmd1bGFyXG4gICAgLy8gZGVjb3JhdG9yIHRoYXQncyBhbHNvIGJlZW4gZG93bmxldmVsZWQuXG4gICAgaWYgKGNsYXp6LnByb3BEZWNvcmF0b3JzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNsYXp6LnByb3BEZWNvcmF0b3JzID0gey4uLmNsYXp6LnByb3BEZWNvcmF0b3JzLCAuLi5wcm9wRGVjb3JhdG9yc307XG4gICAgfSBlbHNlIHtcbiAgICAgIGNsYXp6LnByb3BEZWNvcmF0b3JzID0gcHJvcERlY29yYXRvcnM7XG4gICAgfVxuICB9XG59XG4iXX0=