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
 * Sets properties on a target object from a source object, but only if
 * the property doesn't already exist on the target object.
 * @param {?} target The target to set properties on
 * @param {?} source The source of the property keys and values to set
 * @return {?}
 */
function fillProperties(target, source) {
    for (const /** @type {?} */ key in source) {
        if (source.hasOwnProperty(key) && !target.hasOwnProperty(key)) {
            target[key] = source[key];
        }
    }
}
/**
 * Determines if a definition is a {\@link ComponentDefInternal} or a {\@link DirectiveDefInternal}
 * @template T
 * @param {?} definition The definition to examine
 * @return {?}
 */
function isComponentDef(definition) {
    const /** @type {?} */ def = /** @type {?} */ (definition);
    return typeof def.template === 'function';
}
/**
 * @param {?} type
 * @return {?}
 */
function getSuperType(type) {
    return Object.getPrototypeOf(type.prototype).constructor;
}
/**
 * Merges the definition from a super class to a sub class.
 * @param {?} definition The definition that is a SubClass of another directive of component
 * @return {?}
 */
export function InheritDefinitionFeature(definition) {
    let /** @type {?} */ superType = getSuperType(definition.type);
    let /** @type {?} */ superDef = undefined;
    while (superType && !superDef) {
        if (isComponentDef(definition)) {
            superDef = superType.ngComponentDef || superType.ngDirectiveDef;
        }
        else {
            if (superType.ngComponentDef) {
                throw new Error('Directives cannot inherit Components');
            }
            superDef = superType.ngDirectiveDef;
        }
        if (superDef) {
            // Merge inputs and outputs
            fillProperties(definition.inputs, superDef.inputs);
            fillProperties(definition.declaredInputs, superDef.declaredInputs);
            fillProperties(definition.outputs, superDef.outputs);
            // Merge hostBindings
            const /** @type {?} */ prevHostBindings = definition.hostBindings;
            const /** @type {?} */ superHostBindings = superDef.hostBindings;
            if (superHostBindings) {
                if (prevHostBindings) {
                    definition.hostBindings = (directiveIndex, elementIndex) => {
                        superHostBindings(directiveIndex, elementIndex);
                        prevHostBindings(directiveIndex, elementIndex);
                    };
                }
                else {
                    definition.hostBindings = superHostBindings;
                }
            }
            // Inherit hooks
            // Assume super class inheritance feature has already run.
            definition.afterContentChecked =
                definition.afterContentChecked || superDef.afterContentChecked;
            definition.afterContentInit = definition.afterContentInit || superDef.afterContentInit;
            definition.afterViewChecked = definition.afterViewChecked || superDef.afterViewChecked;
            definition.afterViewInit = definition.afterViewInit || superDef.afterViewInit;
            definition.doCheck = definition.doCheck || superDef.doCheck;
            definition.onDestroy = definition.onDestroy || superDef.onDestroy;
            definition.onInit = definition.onInit || superDef.onInit;
            // Run parent features
            const /** @type {?} */ features = superDef.features;
            if (features) {
                for (const /** @type {?} */ feature of features) {
                    if (feature && feature !== InheritDefinitionFeature) {
                        (/** @type {?} */ (feature))(definition);
                    }
                }
            }
        }
        else {
            // Even if we don't have a definition, check the type for the hooks and use those if need be
            const /** @type {?} */ superPrototype = superType.prototype;
            if (superPrototype) {
                definition.afterContentChecked =
                    definition.afterContentChecked || superPrototype.afterContentChecked;
                definition.afterContentInit =
                    definition.afterContentInit || superPrototype.afterContentInit;
                definition.afterViewChecked =
                    definition.afterViewChecked || superPrototype.afterViewChecked;
                definition.afterViewInit = definition.afterViewInit || superPrototype.afterViewInit;
                definition.doCheck = definition.doCheck || superPrototype.doCheck;
                definition.onDestroy = definition.onDestroy || superPrototype.onDestroy;
                definition.onInit = definition.onInit || superPrototype.onInit;
            }
        }
        superType = Object.getPrototypeOf(superType);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5oZXJpdF9kZWZpbml0aW9uX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL2luaGVyaXRfZGVmaW5pdGlvbl9mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQSx3QkFBd0IsTUFBK0IsRUFBRSxNQUErQjtJQUN0RixLQUFLLHVCQUFNLEdBQUcsSUFBSSxNQUFNLEVBQUU7UUFDeEIsSUFBSSxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUM3RCxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzNCO0tBQ0Y7Q0FDRjs7Ozs7OztBQUtELHdCQUEyQixVQUE0RDtJQUVyRix1QkFBTSxHQUFHLHFCQUFHLFVBQXFDLENBQUEsQ0FBQztJQUNsRCxPQUFPLE9BQU8sR0FBRyxDQUFDLFFBQVEsS0FBSyxVQUFVLENBQUM7Q0FDM0M7Ozs7O0FBRUQsc0JBQXNCLElBQWU7SUFFbkMsT0FBTyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxXQUFXLENBQUM7Q0FDMUQ7Ozs7OztBQU1ELE1BQU0sbUNBQ0YsVUFBZ0U7SUFDbEUscUJBQUksU0FBUyxHQUFHLFlBQVksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUMscUJBQUksUUFBUSxHQUFrRSxTQUFTLENBQUM7SUFFeEYsT0FBTyxTQUFTLElBQUksQ0FBQyxRQUFRLEVBQUU7UUFDN0IsSUFBSSxjQUFjLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDOUIsUUFBUSxHQUFHLFNBQVMsQ0FBQyxjQUFjLElBQUksU0FBUyxDQUFDLGNBQWMsQ0FBQztTQUNqRTthQUFN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QUFDO2dCQUNsRSxVQUFVLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQyxTQUFTLElBQUksY0FBYyxDQUFDLFNBQVMsQ0FBQztnQkFDeEUsVUFBVSxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTSxJQUFJLGNBQWMsQ0FBQyxNQUFNLENBQUM7YUFDaEU7U0FDRjtRQUVELFNBQVMsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBQzlDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vdHlwZSc7XG5pbXBvcnQge0NvbXBvbmVudERlZkludGVybmFsLCBDb21wb25lbnRUeXBlLCBEaXJlY3RpdmVEZWZGZWF0dXJlLCBEaXJlY3RpdmVEZWZJbnRlcm5hbH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcblxuXG4vKipcbiAqIFNldHMgcHJvcGVydGllcyBvbiBhIHRhcmdldCBvYmplY3QgZnJvbSBhIHNvdXJjZSBvYmplY3QsIGJ1dCBvbmx5IGlmXG4gKiB0aGUgcHJvcGVydHkgZG9lc24ndCBhbHJlYWR5IGV4aXN0IG9uIHRoZSB0YXJnZXQgb2JqZWN0LlxuICogQHBhcmFtIHRhcmdldCBUaGUgdGFyZ2V0IHRvIHNldCBwcm9wZXJ0aWVzIG9uXG4gKiBAcGFyYW0gc291cmNlIFRoZSBzb3VyY2Ugb2YgdGhlIHByb3BlcnR5IGtleXMgYW5kIHZhbHVlcyB0byBzZXRcbiAqL1xuZnVuY3Rpb24gZmlsbFByb3BlcnRpZXModGFyZ2V0OiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSwgc291cmNlOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSkge1xuICBmb3IgKGNvbnN0IGtleSBpbiBzb3VyY2UpIHtcbiAgICBpZiAoc291cmNlLmhhc093blByb3BlcnR5KGtleSkgJiYgIXRhcmdldC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldO1xuICAgIH1cbiAgfVxufVxuLyoqXG4gKiBEZXRlcm1pbmVzIGlmIGEgZGVmaW5pdGlvbiBpcyBhIHtAbGluayBDb21wb25lbnREZWZJbnRlcm5hbH0gb3IgYSB7QGxpbmsgRGlyZWN0aXZlRGVmSW50ZXJuYWx9XG4gKiBAcGFyYW0gZGVmaW5pdGlvbiBUaGUgZGVmaW5pdGlvbiB0byBleGFtaW5lXG4gKi9cbmZ1bmN0aW9uIGlzQ29tcG9uZW50RGVmPFQ+KGRlZmluaXRpb246IENvbXBvbmVudERlZkludGVybmFsPFQ+fCBEaXJlY3RpdmVEZWZJbnRlcm5hbDxUPik6XG4gICAgZGVmaW5pdGlvbiBpcyBDb21wb25lbnREZWZJbnRlcm5hbDxUPiB7XG4gIGNvbnN0IGRlZiA9IGRlZmluaXRpb24gYXMgQ29tcG9uZW50RGVmSW50ZXJuYWw8VD47XG4gIHJldHVybiB0eXBlb2YgZGVmLnRlbXBsYXRlID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBnZXRTdXBlclR5cGUodHlwZTogVHlwZTxhbnk+KTogVHlwZTxhbnk+JlxuICAgIHtuZ0NvbXBvbmVudERlZj86IENvbXBvbmVudERlZkludGVybmFsPGFueT4sIG5nRGlyZWN0aXZlRGVmPzogRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55Pn0ge1xuICByZXR1cm4gT2JqZWN0LmdldFByb3RvdHlwZU9mKHR5cGUucHJvdG90eXBlKS5jb25zdHJ1Y3Rvcjtcbn1cblxuLyoqXG4gKiBNZXJnZXMgdGhlIGRlZmluaXRpb24gZnJvbSBhIHN1cGVyIGNsYXNzIHRvIGEgc3ViIGNsYXNzLlxuICogQHBhcmFtIGRlZmluaXRpb24gVGhlIGRlZmluaXRpb24gdGhhdCBpcyBhIFN1YkNsYXNzIG9mIGFub3RoZXIgZGlyZWN0aXZlIG9mIGNvbXBvbmVudFxuICovXG5leHBvcnQgZnVuY3Rpb24gSW5oZXJpdERlZmluaXRpb25GZWF0dXJlKFxuICAgIGRlZmluaXRpb246IERpcmVjdGl2ZURlZkludGVybmFsPGFueT58IENvbXBvbmVudERlZkludGVybmFsPGFueT4pOiB2b2lkIHtcbiAgbGV0IHN1cGVyVHlwZSA9IGdldFN1cGVyVHlwZShkZWZpbml0aW9uLnR5cGUpO1xuICBsZXQgc3VwZXJEZWY6IERpcmVjdGl2ZURlZkludGVybmFsPGFueT58Q29tcG9uZW50RGVmSW50ZXJuYWw8YW55Pnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgd2hpbGUgKHN1cGVyVHlwZSAmJiAhc3VwZXJEZWYpIHtcbiAgICBpZiAoaXNDb21wb25lbnREZWYoZGVmaW5pdGlvbikpIHtcbiAgICAgIHN1cGVyRGVmID0gc3VwZXJUeXBlLm5nQ29tcG9uZW50RGVmIHx8IHN1cGVyVHlwZS5uZ0RpcmVjdGl2ZURlZjtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHN1cGVyVHlwZS5uZ0NvbXBvbmVudERlZikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RpcmVjdGl2ZXMgY2Fubm90IGluaGVyaXQgQ29tcG9uZW50cycpO1xuICAgICAgfVxuICAgICAgc3VwZXJEZWYgPSBzdXBlclR5cGUubmdEaXJlY3RpdmVEZWY7XG4gICAgfVxuXG4gICAgaWYgKHN1cGVyRGVmKSB7XG4gICAgICAvLyBNZXJnZSBpbnB1dHMgYW5kIG91dHB1dHNcbiAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24uaW5wdXRzLCBzdXBlckRlZi5pbnB1dHMpO1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5kZWNsYXJlZElucHV0cywgc3VwZXJEZWYuZGVjbGFyZWRJbnB1dHMpO1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5vdXRwdXRzLCBzdXBlckRlZi5vdXRwdXRzKTtcblxuICAgICAgLy8gTWVyZ2UgaG9zdEJpbmRpbmdzXG4gICAgICBjb25zdCBwcmV2SG9zdEJpbmRpbmdzID0gZGVmaW5pdGlvbi5ob3N0QmluZGluZ3M7XG4gICAgICBjb25zdCBzdXBlckhvc3RCaW5kaW5ncyA9IHN1cGVyRGVmLmhvc3RCaW5kaW5ncztcbiAgICAgIGlmIChzdXBlckhvc3RCaW5kaW5ncykge1xuICAgICAgICBpZiAocHJldkhvc3RCaW5kaW5ncykge1xuICAgICAgICAgIGRlZmluaXRpb24uaG9zdEJpbmRpbmdzID0gKGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGVsZW1lbnRJbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICBzdXBlckhvc3RCaW5kaW5ncyhkaXJlY3RpdmVJbmRleCwgZWxlbWVudEluZGV4KTtcbiAgICAgICAgICAgIHByZXZIb3N0QmluZGluZ3MoZGlyZWN0aXZlSW5kZXgsIGVsZW1lbnRJbmRleCk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWZpbml0aW9uLmhvc3RCaW5kaW5ncyA9IHN1cGVySG9zdEJpbmRpbmdzO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEluaGVyaXQgaG9va3NcbiAgICAgIC8vIEFzc3VtZSBzdXBlciBjbGFzcyBpbmhlcml0YW5jZSBmZWF0dXJlIGhhcyBhbHJlYWR5IHJ1bi5cbiAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50Q2hlY2tlZCA9XG4gICAgICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRDaGVja2VkIHx8IHN1cGVyRGVmLmFmdGVyQ29udGVudENoZWNrZWQ7XG4gICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudEluaXQgPSBkZWZpbml0aW9uLmFmdGVyQ29udGVudEluaXQgfHwgc3VwZXJEZWYuYWZ0ZXJDb250ZW50SW5pdDtcbiAgICAgIGRlZmluaXRpb24uYWZ0ZXJWaWV3Q2hlY2tlZCA9IGRlZmluaXRpb24uYWZ0ZXJWaWV3Q2hlY2tlZCB8fCBzdXBlckRlZi5hZnRlclZpZXdDaGVja2VkO1xuICAgICAgZGVmaW5pdGlvbi5hZnRlclZpZXdJbml0ID0gZGVmaW5pdGlvbi5hZnRlclZpZXdJbml0IHx8IHN1cGVyRGVmLmFmdGVyVmlld0luaXQ7XG4gICAgICBkZWZpbml0aW9uLmRvQ2hlY2sgPSBkZWZpbml0aW9uLmRvQ2hlY2sgfHwgc3VwZXJEZWYuZG9DaGVjaztcbiAgICAgIGRlZmluaXRpb24ub25EZXN0cm95ID0gZGVmaW5pdGlvbi5vbkRlc3Ryb3kgfHwgc3VwZXJEZWYub25EZXN0cm95O1xuICAgICAgZGVmaW5pdGlvbi5vbkluaXQgPSBkZWZpbml0aW9uLm9uSW5pdCB8fCBzdXBlckRlZi5vbkluaXQ7XG5cbiAgICAgIC8vIFJ1biBwYXJlbnQgZmVhdHVyZXNcbiAgICAgIGNvbnN0IGZlYXR1cmVzID0gc3VwZXJEZWYuZmVhdHVyZXM7XG4gICAgICBpZiAoZmVhdHVyZXMpIHtcbiAgICAgICAgZm9yIChjb25zdCBmZWF0dXJlIG9mIGZlYXR1cmVzKSB7XG4gICAgICAgICAgaWYgKGZlYXR1cmUgJiYgZmVhdHVyZSAhPT0gSW5oZXJpdERlZmluaXRpb25GZWF0dXJlKSB7XG4gICAgICAgICAgICAoZmVhdHVyZSBhcyBEaXJlY3RpdmVEZWZGZWF0dXJlKShkZWZpbml0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRXZlbiBpZiB3ZSBkb24ndCBoYXZlIGEgZGVmaW5pdGlvbiwgY2hlY2sgdGhlIHR5cGUgZm9yIHRoZSBob29rcyBhbmQgdXNlIHRob3NlIGlmIG5lZWQgYmVcbiAgICAgIGNvbnN0IHN1cGVyUHJvdG90eXBlID0gc3VwZXJUeXBlLnByb3RvdHlwZTtcblxuICAgICAgaWYgKHN1cGVyUHJvdG90eXBlKSB7XG4gICAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50Q2hlY2tlZCA9XG4gICAgICAgICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudENoZWNrZWQgfHwgc3VwZXJQcm90b3R5cGUuYWZ0ZXJDb250ZW50Q2hlY2tlZDtcbiAgICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRJbml0ID1cbiAgICAgICAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50SW5pdCB8fCBzdXBlclByb3RvdHlwZS5hZnRlckNvbnRlbnRJbml0O1xuICAgICAgICBkZWZpbml0aW9uLmFmdGVyVmlld0NoZWNrZWQgPVxuICAgICAgICAgICAgZGVmaW5pdGlvbi5hZnRlclZpZXdDaGVja2VkIHx8IHN1cGVyUHJvdG90eXBlLmFmdGVyVmlld0NoZWNrZWQ7XG4gICAgICAgIGRlZmluaXRpb24uYWZ0ZXJWaWV3SW5pdCA9IGRlZmluaXRpb24uYWZ0ZXJWaWV3SW5pdCB8fCBzdXBlclByb3RvdHlwZS5hZnRlclZpZXdJbml0O1xuICAgICAgICBkZWZpbml0aW9uLmRvQ2hlY2sgPSBkZWZpbml0aW9uLmRvQ2hlY2sgfHwgc3VwZXJQcm90b3R5cGUuZG9DaGVjaztcbiAgICAgICAgZGVmaW5pdGlvbi5vbkRlc3Ryb3kgPSBkZWZpbml0aW9uLm9uRGVzdHJveSB8fCBzdXBlclByb3RvdHlwZS5vbkRlc3Ryb3k7XG4gICAgICAgIGRlZmluaXRpb24ub25Jbml0ID0gZGVmaW5pdGlvbi5vbkluaXQgfHwgc3VwZXJQcm90b3R5cGUub25Jbml0O1xuICAgICAgfVxuICAgIH1cblxuICAgIHN1cGVyVHlwZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihzdXBlclR5cGUpO1xuICB9XG59XG4iXX0=