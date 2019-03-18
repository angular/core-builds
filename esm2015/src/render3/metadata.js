/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
if (false) {
    /** @type {?|undefined} */
    TypeWithMetadata.prototype.decorators;
    /** @type {?|undefined} */
    TypeWithMetadata.prototype.ctorParameters;
    /** @type {?|undefined} */
    TypeWithMetadata.prototype.propDecorators;
}
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
    const clazz = (/** @type {?} */ (type));
    // We determine whether a class has its own metadata by taking the metadata from the parent
    // constructor and checking whether it's the same as the subclass metadata below. We can't use
    // `hasOwnProperty` here because it doesn't work correctly in IE10 for static fields that are
    // defined by TS. See https://github.com/angular/angular/pull/28439#issuecomment-459349218.
    /** @type {?} */
    const parentPrototype = clazz.prototype ? Object.getPrototypeOf(clazz.prototype) : null;
    /** @type {?} */
    const parentConstructor = parentPrototype && parentPrototype.constructor;
    if (decorators !== null) {
        if (clazz.decorators !== undefined &&
            (!parentConstructor || parentConstructor.decorators !== clazz.decorators)) {
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
        if (clazz.propDecorators !== undefined &&
            (!parentConstructor || parentConstructor.propDecorators !== clazz.propDecorators)) {
            clazz.propDecorators = Object.assign({}, clazz.propDecorators, propDecorators);
        }
        else {
            clazz.propDecorators = propDecorators;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YWRhdGEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL21ldGFkYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBVUEsK0JBSUM7OztJQUhDLHNDQUFtQjs7SUFDbkIsMENBQTZCOztJQUM3QiwwQ0FBd0M7Ozs7Ozs7Ozs7Ozs7Ozs7QUFZMUMsTUFBTSxVQUFVLGdCQUFnQixDQUM1QixJQUFlLEVBQUUsVUFBd0IsRUFBRSxjQUFvQyxFQUMvRSxjQUE2Qzs7VUFDekMsS0FBSyxHQUFHLG1CQUFBLElBQUksRUFBb0I7Ozs7OztVQU1oQyxlQUFlLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7O1VBQ2pGLGlCQUFpQixHQUEwQixlQUFlLElBQUksZUFBZSxDQUFDLFdBQVc7SUFFL0YsSUFBSSxVQUFVLEtBQUssSUFBSSxFQUFFO1FBQ3ZCLElBQUksS0FBSyxDQUFDLFVBQVUsS0FBSyxTQUFTO1lBQzlCLENBQUMsQ0FBQyxpQkFBaUIsSUFBSSxpQkFBaUIsQ0FBQyxVQUFVLEtBQUssS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQzdFLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUM7U0FDdEM7YUFBTTtZQUNMLEtBQUssQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1NBQy9CO0tBQ0Y7SUFDRCxJQUFJLGNBQWMsS0FBSyxJQUFJLEVBQUU7UUFDM0IsMEZBQTBGO1FBQzFGLDRGQUE0RjtRQUM1RixvQ0FBb0M7UUFDcEMsS0FBSyxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7S0FDdkM7SUFDRCxJQUFJLGNBQWMsS0FBSyxJQUFJLEVBQUU7UUFDM0IsOEZBQThGO1FBQzlGLDJGQUEyRjtRQUMzRiwyRkFBMkY7UUFDM0YsMENBQTBDO1FBQzFDLElBQUksS0FBSyxDQUFDLGNBQWMsS0FBSyxTQUFTO1lBQ2xDLENBQUMsQ0FBQyxpQkFBaUIsSUFBSSxpQkFBaUIsQ0FBQyxjQUFjLEtBQUssS0FBSyxDQUFDLGNBQWMsQ0FBQyxFQUFFO1lBQ3JGLEtBQUssQ0FBQyxjQUFjLHFCQUFPLEtBQUssQ0FBQyxjQUFjLEVBQUssY0FBYyxDQUFDLENBQUM7U0FDckU7YUFBTTtZQUNMLEtBQUssQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO1NBQ3ZDO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcblxuaW50ZXJmYWNlIFR5cGVXaXRoTWV0YWRhdGEgZXh0ZW5kcyBUeXBlPGFueT4ge1xuICBkZWNvcmF0b3JzPzogYW55W107XG4gIGN0b3JQYXJhbWV0ZXJzPzogKCkgPT4gYW55W107XG4gIHByb3BEZWNvcmF0b3JzPzoge1tmaWVsZDogc3RyaW5nXTogYW55fTtcbn1cblxuLyoqXG4gKiBBZGRzIGRlY29yYXRvciwgY29uc3RydWN0b3IsIGFuZCBwcm9wZXJ0eSBtZXRhZGF0YSB0byBhIGdpdmVuIHR5cGUgdmlhIHN0YXRpYyBtZXRhZGF0YSBmaWVsZHNcbiAqIG9uIHRoZSB0eXBlLlxuICpcbiAqIFRoZXNlIG1ldGFkYXRhIGZpZWxkcyBjYW4gbGF0ZXIgYmUgcmVhZCB3aXRoIEFuZ3VsYXIncyBgUmVmbGVjdGlvbkNhcGFiaWxpdGllc2AgQVBJLlxuICpcbiAqIENhbGxzIHRvIGBzZXRDbGFzc01ldGFkYXRhYCBjYW4gYmUgbWFya2VkIGFzIHB1cmUsIHJlc3VsdGluZyBpbiB0aGUgbWV0YWRhdGEgYXNzaWdubWVudHMgYmVpbmdcbiAqIHRyZWUtc2hha2VuIGF3YXkgZHVyaW5nIHByb2R1Y3Rpb24gYnVpbGRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0Q2xhc3NNZXRhZGF0YShcbiAgICB0eXBlOiBUeXBlPGFueT4sIGRlY29yYXRvcnM6IGFueVtdIHwgbnVsbCwgY3RvclBhcmFtZXRlcnM6ICgoKSA9PiBhbnlbXSkgfCBudWxsLFxuICAgIHByb3BEZWNvcmF0b3JzOiB7W2ZpZWxkOiBzdHJpbmddOiBhbnl9IHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBjbGF6eiA9IHR5cGUgYXMgVHlwZVdpdGhNZXRhZGF0YTtcblxuICAvLyBXZSBkZXRlcm1pbmUgd2hldGhlciBhIGNsYXNzIGhhcyBpdHMgb3duIG1ldGFkYXRhIGJ5IHRha2luZyB0aGUgbWV0YWRhdGEgZnJvbSB0aGUgcGFyZW50XG4gIC8vIGNvbnN0cnVjdG9yIGFuZCBjaGVja2luZyB3aGV0aGVyIGl0J3MgdGhlIHNhbWUgYXMgdGhlIHN1YmNsYXNzIG1ldGFkYXRhIGJlbG93LiBXZSBjYW4ndCB1c2VcbiAgLy8gYGhhc093blByb3BlcnR5YCBoZXJlIGJlY2F1c2UgaXQgZG9lc24ndCB3b3JrIGNvcnJlY3RseSBpbiBJRTEwIGZvciBzdGF0aWMgZmllbGRzIHRoYXQgYXJlXG4gIC8vIGRlZmluZWQgYnkgVFMuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL3B1bGwvMjg0MzkjaXNzdWVjb21tZW50LTQ1OTM0OTIxOC5cbiAgY29uc3QgcGFyZW50UHJvdG90eXBlID0gY2xhenoucHJvdG90eXBlID8gT2JqZWN0LmdldFByb3RvdHlwZU9mKGNsYXp6LnByb3RvdHlwZSkgOiBudWxsO1xuICBjb25zdCBwYXJlbnRDb25zdHJ1Y3RvcjogVHlwZVdpdGhNZXRhZGF0YXxudWxsID0gcGFyZW50UHJvdG90eXBlICYmIHBhcmVudFByb3RvdHlwZS5jb25zdHJ1Y3RvcjtcblxuICBpZiAoZGVjb3JhdG9ycyAhPT0gbnVsbCkge1xuICAgIGlmIChjbGF6ei5kZWNvcmF0b3JzICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgKCFwYXJlbnRDb25zdHJ1Y3RvciB8fCBwYXJlbnRDb25zdHJ1Y3Rvci5kZWNvcmF0b3JzICE9PSBjbGF6ei5kZWNvcmF0b3JzKSkge1xuICAgICAgY2xhenouZGVjb3JhdG9ycy5wdXNoKC4uLmRlY29yYXRvcnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjbGF6ei5kZWNvcmF0b3JzID0gZGVjb3JhdG9ycztcbiAgICB9XG4gIH1cbiAgaWYgKGN0b3JQYXJhbWV0ZXJzICE9PSBudWxsKSB7XG4gICAgLy8gUmF0aGVyIHRoYW4gbWVyZ2luZywgY2xvYmJlciB0aGUgZXhpc3RpbmcgcGFyYW1ldGVycy4gSWYgb3RoZXIgcHJvamVjdHMgZXhpc3Qgd2hpY2ggdXNlXG4gICAgLy8gdHNpY2tsZS1zdHlsZSBhbm5vdGF0aW9ucyBhbmQgcmVmbGVjdCBvdmVyIHRoZW0gaW4gdGhlIHNhbWUgd2F5LCB0aGlzIGNvdWxkIGNhdXNlIGlzc3VlcyxcbiAgICAvLyBidXQgdGhhdCBpcyB2YW5pc2hpbmdseSB1bmxpa2VseS5cbiAgICBjbGF6ei5jdG9yUGFyYW1ldGVycyA9IGN0b3JQYXJhbWV0ZXJzO1xuICB9XG4gIGlmIChwcm9wRGVjb3JhdG9ycyAhPT0gbnVsbCkge1xuICAgIC8vIFRoZSBwcm9wZXJ0eSBkZWNvcmF0b3Igb2JqZWN0cyBhcmUgbWVyZ2VkIGFzIGl0IGlzIHBvc3NpYmxlIGRpZmZlcmVudCBmaWVsZHMgaGF2ZSBkaWZmZXJlbnRcbiAgICAvLyBkZWNvcmF0b3IgdHlwZXMuIERlY29yYXRvcnMgb24gaW5kaXZpZHVhbCBmaWVsZHMgYXJlIG5vdCBtZXJnZWQsIGFzIGl0J3MgYWxzbyBpbmNyZWRpYmx5XG4gICAgLy8gdW5saWtlbHkgdGhhdCBhIGZpZWxkIHdpbGwgYmUgZGVjb3JhdGVkIGJvdGggd2l0aCBhbiBBbmd1bGFyIGRlY29yYXRvciBhbmQgYSBub24tQW5ndWxhclxuICAgIC8vIGRlY29yYXRvciB0aGF0J3MgYWxzbyBiZWVuIGRvd25sZXZlbGVkLlxuICAgIGlmIChjbGF6ei5wcm9wRGVjb3JhdG9ycyAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICghcGFyZW50Q29uc3RydWN0b3IgfHwgcGFyZW50Q29uc3RydWN0b3IucHJvcERlY29yYXRvcnMgIT09IGNsYXp6LnByb3BEZWNvcmF0b3JzKSkge1xuICAgICAgY2xhenoucHJvcERlY29yYXRvcnMgPSB7Li4uY2xhenoucHJvcERlY29yYXRvcnMsIC4uLnByb3BEZWNvcmF0b3JzfTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2xhenoucHJvcERlY29yYXRvcnMgPSBwcm9wRGVjb3JhdG9ycztcbiAgICB9XG4gIH1cbn1cbiJdfQ==