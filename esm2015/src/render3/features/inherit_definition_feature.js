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
import { fillProperties } from '../../util/property';
/**
 * Determines if a definition is a {\@link ComponentDefInternal} or a {\@link DirectiveDefInternal}
 * @template T
 * @param {?} definition The definition to examine
 * @return {?}
 */
function isComponentDef(definition) {
    /** @type {?} */
    const def = /** @type {?} */ (definition);
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
    /** @type {?} */
    let superType = getSuperType(definition.type);
    while (superType) {
        /** @type {?} */
        let superDef = undefined;
        if (isComponentDef(definition)) {
            superDef = superType.ngComponentDef || superType.ngDirectiveDef;
        }
        else {
            if (superType.ngComponentDef) {
                throw new Error('Directives cannot inherit Components');
            }
            superDef = superType.ngDirectiveDef;
        }
        /** @type {?} */
        const baseDef = (/** @type {?} */ (superType)).ngBaseDef;
        if (baseDef) {
            // Merge inputs and outputs
            fillProperties(definition.inputs, baseDef.inputs);
            fillProperties(definition.declaredInputs, baseDef.declaredInputs);
            fillProperties(definition.outputs, baseDef.outputs);
        }
        if (superDef) {
            /** @type {?} */
            const prevHostBindings = definition.hostBindings;
            /** @type {?} */
            const superHostBindings = superDef.hostBindings;
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
            // Merge inputs and outputs
            fillProperties(definition.inputs, superDef.inputs);
            fillProperties(definition.declaredInputs, superDef.declaredInputs);
            fillProperties(definition.outputs, superDef.outputs);
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
            /** @type {?} */
            const features = superDef.features;
            if (features) {
                for (const feature of features) {
                    if (feature && feature !== InheritDefinitionFeature) {
                        (/** @type {?} */ (feature))(definition);
                    }
                }
            }
            break;
        }
        else {
            /** @type {?} */
            const superPrototype = superType.prototype;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5oZXJpdF9kZWZpbml0aW9uX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL2luaGVyaXRfZGVmaW5pdGlvbl9mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHFCQUFxQixDQUFDOzs7Ozs7O0FBUW5ELHdCQUEyQixVQUE0RDs7SUFFckYsTUFBTSxHQUFHLHFCQUFHLFVBQXFDLEVBQUM7SUFDbEQsT0FBTyxPQUFPLEdBQUcsQ0FBQyxRQUFRLEtBQUssVUFBVSxDQUFDO0NBQzNDOzs7OztBQUVELHNCQUFzQixJQUFlO0lBRW5DLE9BQU8sTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsV0FBVyxDQUFDO0NBQzFEOzs7Ozs7QUFNRCxNQUFNLG1DQUNGLFVBQWdFOztJQUNsRSxJQUFJLFNBQVMsR0FBRyxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRTlDLE9BQU8sU0FBUyxFQUFFOztRQUNoQixJQUFJLFFBQVEsR0FBa0UsU0FBUyxDQUFDO1FBQ3hGLElBQUksY0FBYyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQzlCLFFBQVEsR0FBRyxTQUFTLENBQUMsY0FBYyxJQUFJLFNBQVMsQ0FBQyxjQUFjLENBQUM7U0FDakU7YUFBTTtZQUNMLElBQUksU0FBUyxDQUFDLGNBQWMsRUFBRTtnQkFDNUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO2FBQ3pEO1lBQ0QsUUFBUSxHQUFHLFNBQVMsQ0FBQyxjQUFjLENBQUM7U0FDckM7O1FBRUQsTUFBTSxPQUFPLEdBQUcsbUJBQUMsU0FBZ0IsRUFBQyxDQUFDLFNBQVMsQ0FBQztRQUM3QyxJQUFJLE9BQU8sRUFBRTs7WUFFWCxjQUFjLENB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Q3BGLFVBQVUsQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sSUFBSSxjQUFjLENBQUMsT0FBTyxDQUFDO2dCQUNsRSxVQUFVLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQyxTQUFTLElBQUksY0FBYyxDQUFDLFNBQVMsQ0FBQztnQkFDeEUsVUFBVSxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTSxJQUFJLGNBQWMsQ0FBQyxNQUFNLENBQUM7YUFDaEU7U0FDRjtRQUVELFNBQVMsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBQzlDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vdHlwZSc7XG5pbXBvcnQge2ZpbGxQcm9wZXJ0aWVzfSBmcm9tICcuLi8uLi91dGlsL3Byb3BlcnR5JztcbmltcG9ydCB7Q29tcG9uZW50RGVmSW50ZXJuYWwsIERpcmVjdGl2ZURlZkZlYXR1cmUsIERpcmVjdGl2ZURlZkludGVybmFsfSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuXG5cbi8qKlxuICogRGV0ZXJtaW5lcyBpZiBhIGRlZmluaXRpb24gaXMgYSB7QGxpbmsgQ29tcG9uZW50RGVmSW50ZXJuYWx9IG9yIGEge0BsaW5rIERpcmVjdGl2ZURlZkludGVybmFsfVxuICogQHBhcmFtIGRlZmluaXRpb24gVGhlIGRlZmluaXRpb24gdG8gZXhhbWluZVxuICovXG5mdW5jdGlvbiBpc0NvbXBvbmVudERlZjxUPihkZWZpbml0aW9uOiBDb21wb25lbnREZWZJbnRlcm5hbDxUPnwgRGlyZWN0aXZlRGVmSW50ZXJuYWw8VD4pOlxuICAgIGRlZmluaXRpb24gaXMgQ29tcG9uZW50RGVmSW50ZXJuYWw8VD4ge1xuICBjb25zdCBkZWYgPSBkZWZpbml0aW9uIGFzIENvbXBvbmVudERlZkludGVybmFsPFQ+O1xuICByZXR1cm4gdHlwZW9mIGRlZi50ZW1wbGF0ZSA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gZ2V0U3VwZXJUeXBlKHR5cGU6IFR5cGU8YW55Pik6IFR5cGU8YW55PiZcbiAgICB7bmdDb21wb25lbnREZWY/OiBDb21wb25lbnREZWZJbnRlcm5hbDxhbnk+LCBuZ0RpcmVjdGl2ZURlZj86IERpcmVjdGl2ZURlZkludGVybmFsPGFueT59IHtcbiAgcmV0dXJuIE9iamVjdC5nZXRQcm90b3R5cGVPZih0eXBlLnByb3RvdHlwZSkuY29uc3RydWN0b3I7XG59XG5cbi8qKlxuICogTWVyZ2VzIHRoZSBkZWZpbml0aW9uIGZyb20gYSBzdXBlciBjbGFzcyB0byBhIHN1YiBjbGFzcy5cbiAqIEBwYXJhbSBkZWZpbml0aW9uIFRoZSBkZWZpbml0aW9uIHRoYXQgaXMgYSBTdWJDbGFzcyBvZiBhbm90aGVyIGRpcmVjdGl2ZSBvZiBjb21wb25lbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEluaGVyaXREZWZpbml0aW9uRmVhdHVyZShcbiAgICBkZWZpbml0aW9uOiBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+fCBDb21wb25lbnREZWZJbnRlcm5hbDxhbnk+KTogdm9pZCB7XG4gIGxldCBzdXBlclR5cGUgPSBnZXRTdXBlclR5cGUoZGVmaW5pdGlvbi50eXBlKTtcblxuICB3aGlsZSAoc3VwZXJUeXBlKSB7XG4gICAgbGV0IHN1cGVyRGVmOiBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+fENvbXBvbmVudERlZkludGVybmFsPGFueT58dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgIGlmIChpc0NvbXBvbmVudERlZihkZWZpbml0aW9uKSkge1xuICAgICAgc3VwZXJEZWYgPSBzdXBlclR5cGUubmdDb21wb25lbnREZWYgfHwgc3VwZXJUeXBlLm5nRGlyZWN0aXZlRGVmO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoc3VwZXJUeXBlLm5nQ29tcG9uZW50RGVmKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRGlyZWN0aXZlcyBjYW5ub3QgaW5oZXJpdCBDb21wb25lbnRzJyk7XG4gICAgICB9XG4gICAgICBzdXBlckRlZiA9IHN1cGVyVHlwZS5uZ0RpcmVjdGl2ZURlZjtcbiAgICB9XG5cbiAgICBjb25zdCBiYXNlRGVmID0gKHN1cGVyVHlwZSBhcyBhbnkpLm5nQmFzZURlZjtcbiAgICBpZiAoYmFzZURlZikge1xuICAgICAgLy8gTWVyZ2UgaW5wdXRzIGFuZCBvdXRwdXRzXG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLmlucHV0cywgYmFzZURlZi5pbnB1dHMpO1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5kZWNsYXJlZElucHV0cywgYmFzZURlZi5kZWNsYXJlZElucHV0cyk7XG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLm91dHB1dHMsIGJhc2VEZWYub3V0cHV0cyk7XG4gICAgfVxuXG4gICAgaWYgKHN1cGVyRGVmKSB7XG4gICAgICAvLyBNZXJnZSBob3N0QmluZGluZ3NcbiAgICAgIGNvbnN0IHByZXZIb3N0QmluZGluZ3MgPSBkZWZpbml0aW9uLmhvc3RCaW5kaW5ncztcbiAgICAgIGNvbnN0IHN1cGVySG9zdEJpbmRpbmdzID0gc3VwZXJEZWYuaG9zdEJpbmRpbmdzO1xuICAgICAgaWYgKHN1cGVySG9zdEJpbmRpbmdzKSB7XG4gICAgICAgIGlmIChwcmV2SG9zdEJpbmRpbmdzKSB7XG4gICAgICAgICAgZGVmaW5pdGlvbi5ob3N0QmluZGluZ3MgPSAoZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgZWxlbWVudEluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIHN1cGVySG9zdEJpbmRpbmdzKGRpcmVjdGl2ZUluZGV4LCBlbGVtZW50SW5kZXgpO1xuICAgICAgICAgICAgcHJldkhvc3RCaW5kaW5ncyhkaXJlY3RpdmVJbmRleCwgZWxlbWVudEluZGV4KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlZmluaXRpb24uaG9zdEJpbmRpbmdzID0gc3VwZXJIb3N0QmluZGluZ3M7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gTWVyZ2UgaW5wdXRzIGFuZCBvdXRwdXRzXG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLmlucHV0cywgc3VwZXJEZWYuaW5wdXRzKTtcbiAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24uZGVjbGFyZWRJbnB1dHMsIHN1cGVyRGVmLmRlY2xhcmVkSW5wdXRzKTtcbiAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24ub3V0cHV0cywgc3VwZXJEZWYub3V0cHV0cyk7XG5cbiAgICAgIC8vIEluaGVyaXQgaG9va3NcbiAgICAgIC8vIEFzc3VtZSBzdXBlciBjbGFzcyBpbmhlcml0YW5jZSBmZWF0dXJlIGhhcyBhbHJlYWR5IHJ1bi5cbiAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50Q2hlY2tlZCA9XG4gICAgICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRDaGVja2VkIHx8IHN1cGVyRGVmLmFmdGVyQ29udGVudENoZWNrZWQ7XG4gICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudEluaXQgPSBkZWZpbml0aW9uLmFmdGVyQ29udGVudEluaXQgfHwgc3VwZXJEZWYuYWZ0ZXJDb250ZW50SW5pdDtcbiAgICAgIGRlZmluaXRpb24uYWZ0ZXJWaWV3Q2hlY2tlZCA9IGRlZmluaXRpb24uYWZ0ZXJWaWV3Q2hlY2tlZCB8fCBzdXBlckRlZi5hZnRlclZpZXdDaGVja2VkO1xuICAgICAgZGVmaW5pdGlvbi5hZnRlclZpZXdJbml0ID0gZGVmaW5pdGlvbi5hZnRlclZpZXdJbml0IHx8IHN1cGVyRGVmLmFmdGVyVmlld0luaXQ7XG4gICAgICBkZWZpbml0aW9uLmRvQ2hlY2sgPSBkZWZpbml0aW9uLmRvQ2hlY2sgfHwgc3VwZXJEZWYuZG9DaGVjaztcbiAgICAgIGRlZmluaXRpb24ub25EZXN0cm95ID0gZGVmaW5pdGlvbi5vbkRlc3Ryb3kgfHwgc3VwZXJEZWYub25EZXN0cm95O1xuICAgICAgZGVmaW5pdGlvbi5vbkluaXQgPSBkZWZpbml0aW9uLm9uSW5pdCB8fCBzdXBlckRlZi5vbkluaXQ7XG5cbiAgICAgIC8vIFJ1biBwYXJlbnQgZmVhdHVyZXNcbiAgICAgIGNvbnN0IGZlYXR1cmVzID0gc3VwZXJEZWYuZmVhdHVyZXM7XG4gICAgICBpZiAoZmVhdHVyZXMpIHtcbiAgICAgICAgZm9yIChjb25zdCBmZWF0dXJlIG9mIGZlYXR1cmVzKSB7XG4gICAgICAgICAgaWYgKGZlYXR1cmUgJiYgZmVhdHVyZSAhPT0gSW5oZXJpdERlZmluaXRpb25GZWF0dXJlKSB7XG4gICAgICAgICAgICAoZmVhdHVyZSBhcyBEaXJlY3RpdmVEZWZGZWF0dXJlKShkZWZpbml0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEV2ZW4gaWYgd2UgZG9uJ3QgaGF2ZSBhIGRlZmluaXRpb24sIGNoZWNrIHRoZSB0eXBlIGZvciB0aGUgaG9va3MgYW5kIHVzZSB0aG9zZSBpZiBuZWVkIGJlXG4gICAgICBjb25zdCBzdXBlclByb3RvdHlwZSA9IHN1cGVyVHlwZS5wcm90b3R5cGU7XG5cbiAgICAgIGlmIChzdXBlclByb3RvdHlwZSkge1xuICAgICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudENoZWNrZWQgPVxuICAgICAgICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRDaGVja2VkIHx8IHN1cGVyUHJvdG90eXBlLmFmdGVyQ29udGVudENoZWNrZWQ7XG4gICAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50SW5pdCA9XG4gICAgICAgICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudEluaXQgfHwgc3VwZXJQcm90b3R5cGUuYWZ0ZXJDb250ZW50SW5pdDtcbiAgICAgICAgZGVmaW5pdGlvbi5hZnRlclZpZXdDaGVja2VkID1cbiAgICAgICAgICAgIGRlZmluaXRpb24uYWZ0ZXJWaWV3Q2hlY2tlZCB8fCBzdXBlclByb3RvdHlwZS5hZnRlclZpZXdDaGVja2VkO1xuICAgICAgICBkZWZpbml0aW9uLmFmdGVyVmlld0luaXQgPSBkZWZpbml0aW9uLmFmdGVyVmlld0luaXQgfHwgc3VwZXJQcm90b3R5cGUuYWZ0ZXJWaWV3SW5pdDtcbiAgICAgICAgZGVmaW5pdGlvbi5kb0NoZWNrID0gZGVmaW5pdGlvbi5kb0NoZWNrIHx8IHN1cGVyUHJvdG90eXBlLmRvQ2hlY2s7XG4gICAgICAgIGRlZmluaXRpb24ub25EZXN0cm95ID0gZGVmaW5pdGlvbi5vbkRlc3Ryb3kgfHwgc3VwZXJQcm90b3R5cGUub25EZXN0cm95O1xuICAgICAgICBkZWZpbml0aW9uLm9uSW5pdCA9IGRlZmluaXRpb24ub25Jbml0IHx8IHN1cGVyUHJvdG90eXBlLm9uSW5pdDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzdXBlclR5cGUgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yoc3VwZXJUeXBlKTtcbiAgfVxufVxuIl19