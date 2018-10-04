/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { SimpleChange } from '../../change_detection/change_detection_util';
const PRIVATE_PREFIX = '__ngOnChanges_';
/**
 * The NgOnChangesFeature decorates a component with support for the ngOnChanges
 * lifecycle hook, so it should be included in any component that implements
 * that hook.
 *
 * If the component or directive uses inheritance, the NgOnChangesFeature MUST
 * be included as a feature AFTER {@link InheritDefinitionFeature}, otherwise
 * inherited properties will not be propagated to the ngOnChanges lifecycle
 * hook.
 *
 * Example usage:
 *
 * ```
 * static ngComponentDef = defineComponent({
 *   ...
 *   inputs: {name: 'publicName'},
 *   features: [NgOnChangesFeature]
 * });
 * ```
 */
export function NgOnChangesFeature(definition) {
    const declaredToMinifiedInputs = definition.declaredInputs;
    const proto = definition.type.prototype;
    for (const declaredName in declaredToMinifiedInputs) {
        if (declaredToMinifiedInputs.hasOwnProperty(declaredName)) {
            const minifiedKey = declaredToMinifiedInputs[declaredName];
            const privateMinKey = PRIVATE_PREFIX + minifiedKey;
            // Walk the prototype chain to see if we find a property descriptor
            // That way we can honor setters and getters that were inherited.
            let originalProperty = undefined;
            let checkProto = proto;
            while (!originalProperty && checkProto &&
                Object.getPrototypeOf(checkProto) !== Object.getPrototypeOf(Object.prototype)) {
                originalProperty = Object.getOwnPropertyDescriptor(checkProto, minifiedKey);
                checkProto = Object.getPrototypeOf(checkProto);
            }
            const getter = originalProperty && originalProperty.get;
            const setter = originalProperty && originalProperty.set;
            // create a getter and setter for property
            Object.defineProperty(proto, minifiedKey, {
                get: getter ||
                    (setter ? undefined : function () { return this[privateMinKey]; }),
                set(value) {
                    let simpleChanges = this[PRIVATE_PREFIX];
                    if (!simpleChanges) {
                        simpleChanges = {};
                        // Place where we will store SimpleChanges if there is a change
                        Object.defineProperty(this, PRIVATE_PREFIX, { value: simpleChanges, writable: true });
                    }
                    const isFirstChange = !this.hasOwnProperty(privateMinKey);
                    const currentChange = simpleChanges[declaredName];
                    if (currentChange) {
                        currentChange.currentValue = value;
                    }
                    else {
                        simpleChanges[declaredName] =
                            new SimpleChange(this[privateMinKey], value, isFirstChange);
                    }
                    if (isFirstChange) {
                        // Create a place where the actual value will be stored and make it non-enumerable
                        Object.defineProperty(this, privateMinKey, { value, writable: true });
                    }
                    else {
                        this[privateMinKey] = value;
                    }
                    if (setter)
                        setter.call(this, value);
                },
                // Make the property configurable in dev mode to allow overriding in tests
                configurable: !!ngDevMode
            });
        }
    }
    // If an onInit hook is defined, it will need to wrap the ngOnChanges call
    // so the call order is changes-init-check in creation mode. In subsequent
    // change detection runs, only the check wrapper will be called.
    if (definition.onInit != null) {
        definition.onInit = onChangesWrapper(definition.onInit);
    }
    definition.doCheck = onChangesWrapper(definition.doCheck);
}
function onChangesWrapper(delegateHook) {
    return function () {
        const simpleChanges = this[PRIVATE_PREFIX];
        if (simpleChanges != null) {
            this.ngOnChanges(simpleChanges);
            this[PRIVATE_PREFIX] = null;
        }
        if (delegateHook)
            delegateHook.apply(this);
    };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfb25jaGFuZ2VzX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL25nX29uY2hhbmdlc19mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSw4Q0FBOEMsQ0FBQztBQUkxRSxNQUFNLGNBQWMsR0FBRyxnQkFBZ0IsQ0FBQztBQVF4Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW1CRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FBSSxVQUEyQjtJQUMvRCxNQUFNLHdCQUF3QixHQUFHLFVBQVUsQ0FBQyxjQUFjLENBQUM7SUFDM0QsTUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDeEMsS0FBSyxNQUFNLFlBQVksSUFBSSx3QkFBd0IsRUFBRTtRQUNuRCxJQUFJLHdCQUF3QixDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsRUFBRTtZQUN6RCxNQUFNLFdBQVcsR0FBRyx3QkFBd0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMzRCxNQUFNLGFBQWEsR0FBRyxjQUFjLEdBQUcsV0FBVyxDQUFDO1lBRW5ELG1FQUFtRTtZQUNuRSxpRUFBaUU7WUFDakUsSUFBSSxnQkFBZ0IsR0FBaUMsU0FBUyxDQUFDO1lBQy9ELElBQUksVUFBVSxHQUFHLEtBQUssQ0FBQztZQUN2QixPQUFPLENBQUMsZ0JBQWdCLElBQUksVUFBVTtnQkFDL0IsTUFBTSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsS0FBSyxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDcEYsZ0JBQWdCLEdBQUcsTUFBTSxDQUFDLHdCQUF3QixDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFDNUUsVUFBVSxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDaEQ7WUFFRCxNQUFNLE1BQU0sR0FBRyxnQkFBZ0IsSUFBSSxnQkFBZ0IsQ0FBQyxHQUFHLENBQUM7WUFDeEQsTUFBTSxNQUFNLEdBQUcsZ0JBQWdCLElBQUksZ0JBQWdCLENBQUMsR0FBRyxDQUFDO1lBRXhELDBDQUEwQztZQUMxQyxNQUFNLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUU7Z0JBQ3hDLEdBQUcsRUFBRSxNQUFNO29CQUNQLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLGNBQW1DLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMzRixHQUFHLENBQTRCLEtBQVE7b0JBQ3JDLElBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztvQkFDekMsSUFBSSxDQUFDLGFBQWEsRUFBRTt3QkFDbEIsYUFBYSxHQUFHLEVBQUUsQ0FBQzt3QkFDbkIsK0RBQStEO3dCQUMvRCxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUUsRUFBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO3FCQUNyRjtvQkFFRCxNQUFNLGFBQWEsR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLENBQUM7b0JBQzFELE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztvQkFFbEQsSUFBSSxhQUFhLEVBQUU7d0JBQ2pCLGFBQWEsQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO3FCQUNwQzt5QkFBTTt3QkFDTCxhQUFhLENBQUMsWUFBWSxDQUFDOzRCQUN2QixJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDO3FCQUNqRTtvQkFFRCxJQUFJLGFBQWEsRUFBRTt3QkFDakIsa0ZBQWtGO3dCQUNsRixNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUUsRUFBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7cUJBQ3JFO3lCQUFNO3dCQUNMLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxLQUFLLENBQUM7cUJBQzdCO29CQUVELElBQUksTUFBTTt3QkFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDdkMsQ0FBQztnQkFDRCwwRUFBMEU7Z0JBQzFFLFlBQVksRUFBRSxDQUFDLENBQUMsU0FBUzthQUMxQixDQUFDLENBQUM7U0FDSjtLQUNGO0lBRUQsMEVBQTBFO0lBQzFFLDBFQUEwRTtJQUMxRSxnRUFBZ0U7SUFDaEUsSUFBSSxVQUFVLENBQUMsTUFBTSxJQUFJLElBQUksRUFBRTtRQUM3QixVQUFVLENBQUMsTUFBTSxHQUFHLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUN6RDtJQUVELFVBQVUsQ0FBQyxPQUFPLEdBQUcsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFFRCxTQUFTLGdCQUFnQixDQUFDLFlBQWlDO0lBQ3pELE9BQU87UUFDTCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDM0MsSUFBSSxhQUFhLElBQUksSUFBSSxFQUFFO1lBQ3pCLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDaEMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLElBQUksQ0FBQztTQUM3QjtRQUNELElBQUksWUFBWTtZQUFFLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDN0MsQ0FBQyxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTaW1wbGVDaGFuZ2V9IGZyb20gJy4uLy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdGlvbl91dGlsJztcbmltcG9ydCB7T25DaGFuZ2VzLCBTaW1wbGVDaGFuZ2VzfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9saWZlY3ljbGVfaG9va3MnO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWZ9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5cbmNvbnN0IFBSSVZBVEVfUFJFRklYID0gJ19fbmdPbkNoYW5nZXNfJztcblxudHlwZSBPbkNoYW5nZXNFeHBhbmRvID0gT25DaGFuZ2VzICYge1xuICBfX25nT25DaGFuZ2VzXzogU2ltcGxlQ2hhbmdlc3xudWxsfHVuZGVmaW5lZDtcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueSBDYW4gaG9sZCBhbnkgdmFsdWVcbiAgW2tleTogc3RyaW5nXTogYW55O1xufTtcblxuLyoqXG4gKiBUaGUgTmdPbkNoYW5nZXNGZWF0dXJlIGRlY29yYXRlcyBhIGNvbXBvbmVudCB3aXRoIHN1cHBvcnQgZm9yIHRoZSBuZ09uQ2hhbmdlc1xuICogbGlmZWN5Y2xlIGhvb2ssIHNvIGl0IHNob3VsZCBiZSBpbmNsdWRlZCBpbiBhbnkgY29tcG9uZW50IHRoYXQgaW1wbGVtZW50c1xuICogdGhhdCBob29rLlxuICpcbiAqIElmIHRoZSBjb21wb25lbnQgb3IgZGlyZWN0aXZlIHVzZXMgaW5oZXJpdGFuY2UsIHRoZSBOZ09uQ2hhbmdlc0ZlYXR1cmUgTVVTVFxuICogYmUgaW5jbHVkZWQgYXMgYSBmZWF0dXJlIEFGVEVSIHtAbGluayBJbmhlcml0RGVmaW5pdGlvbkZlYXR1cmV9LCBvdGhlcndpc2VcbiAqIGluaGVyaXRlZCBwcm9wZXJ0aWVzIHdpbGwgbm90IGJlIHByb3BhZ2F0ZWQgdG8gdGhlIG5nT25DaGFuZ2VzIGxpZmVjeWNsZVxuICogaG9vay5cbiAqXG4gKiBFeGFtcGxlIHVzYWdlOlxuICpcbiAqIGBgYFxuICogc3RhdGljIG5nQ29tcG9uZW50RGVmID0gZGVmaW5lQ29tcG9uZW50KHtcbiAqICAgLi4uXG4gKiAgIGlucHV0czoge25hbWU6ICdwdWJsaWNOYW1lJ30sXG4gKiAgIGZlYXR1cmVzOiBbTmdPbkNoYW5nZXNGZWF0dXJlXVxuICogfSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIE5nT25DaGFuZ2VzRmVhdHVyZTxUPihkZWZpbml0aW9uOiBEaXJlY3RpdmVEZWY8VD4pOiB2b2lkIHtcbiAgY29uc3QgZGVjbGFyZWRUb01pbmlmaWVkSW5wdXRzID0gZGVmaW5pdGlvbi5kZWNsYXJlZElucHV0cztcbiAgY29uc3QgcHJvdG8gPSBkZWZpbml0aW9uLnR5cGUucHJvdG90eXBlO1xuICBmb3IgKGNvbnN0IGRlY2xhcmVkTmFtZSBpbiBkZWNsYXJlZFRvTWluaWZpZWRJbnB1dHMpIHtcbiAgICBpZiAoZGVjbGFyZWRUb01pbmlmaWVkSW5wdXRzLmhhc093blByb3BlcnR5KGRlY2xhcmVkTmFtZSkpIHtcbiAgICAgIGNvbnN0IG1pbmlmaWVkS2V5ID0gZGVjbGFyZWRUb01pbmlmaWVkSW5wdXRzW2RlY2xhcmVkTmFtZV07XG4gICAgICBjb25zdCBwcml2YXRlTWluS2V5ID0gUFJJVkFURV9QUkVGSVggKyBtaW5pZmllZEtleTtcblxuICAgICAgLy8gV2FsayB0aGUgcHJvdG90eXBlIGNoYWluIHRvIHNlZSBpZiB3ZSBmaW5kIGEgcHJvcGVydHkgZGVzY3JpcHRvclxuICAgICAgLy8gVGhhdCB3YXkgd2UgY2FuIGhvbm9yIHNldHRlcnMgYW5kIGdldHRlcnMgdGhhdCB3ZXJlIGluaGVyaXRlZC5cbiAgICAgIGxldCBvcmlnaW5hbFByb3BlcnR5OiBQcm9wZXJ0eURlc2NyaXB0b3J8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgbGV0IGNoZWNrUHJvdG8gPSBwcm90bztcbiAgICAgIHdoaWxlICghb3JpZ2luYWxQcm9wZXJ0eSAmJiBjaGVja1Byb3RvICYmXG4gICAgICAgICAgICAgT2JqZWN0LmdldFByb3RvdHlwZU9mKGNoZWNrUHJvdG8pICE9PSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoT2JqZWN0LnByb3RvdHlwZSkpIHtcbiAgICAgICAgb3JpZ2luYWxQcm9wZXJ0eSA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoY2hlY2tQcm90bywgbWluaWZpZWRLZXkpO1xuICAgICAgICBjaGVja1Byb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGNoZWNrUHJvdG8pO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBnZXR0ZXIgPSBvcmlnaW5hbFByb3BlcnR5ICYmIG9yaWdpbmFsUHJvcGVydHkuZ2V0O1xuICAgICAgY29uc3Qgc2V0dGVyID0gb3JpZ2luYWxQcm9wZXJ0eSAmJiBvcmlnaW5hbFByb3BlcnR5LnNldDtcblxuICAgICAgLy8gY3JlYXRlIGEgZ2V0dGVyIGFuZCBzZXR0ZXIgZm9yIHByb3BlcnR5XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sIG1pbmlmaWVkS2V5LCB7XG4gICAgICAgIGdldDogZ2V0dGVyIHx8XG4gICAgICAgICAgICAoc2V0dGVyID8gdW5kZWZpbmVkIDogZnVuY3Rpb24odGhpczogT25DaGFuZ2VzRXhwYW5kbykgeyByZXR1cm4gdGhpc1twcml2YXRlTWluS2V5XTsgfSksXG4gICAgICAgIHNldDxUPih0aGlzOiBPbkNoYW5nZXNFeHBhbmRvLCB2YWx1ZTogVCkge1xuICAgICAgICAgIGxldCBzaW1wbGVDaGFuZ2VzID0gdGhpc1tQUklWQVRFX1BSRUZJWF07XG4gICAgICAgICAgaWYgKCFzaW1wbGVDaGFuZ2VzKSB7XG4gICAgICAgICAgICBzaW1wbGVDaGFuZ2VzID0ge307XG4gICAgICAgICAgICAvLyBQbGFjZSB3aGVyZSB3ZSB3aWxsIHN0b3JlIFNpbXBsZUNoYW5nZXMgaWYgdGhlcmUgaXMgYSBjaGFuZ2VcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBQUklWQVRFX1BSRUZJWCwge3ZhbHVlOiBzaW1wbGVDaGFuZ2VzLCB3cml0YWJsZTogdHJ1ZX0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGlzRmlyc3RDaGFuZ2UgPSAhdGhpcy5oYXNPd25Qcm9wZXJ0eShwcml2YXRlTWluS2V5KTtcbiAgICAgICAgICBjb25zdCBjdXJyZW50Q2hhbmdlID0gc2ltcGxlQ2hhbmdlc1tkZWNsYXJlZE5hbWVdO1xuXG4gICAgICAgICAgaWYgKGN1cnJlbnRDaGFuZ2UpIHtcbiAgICAgICAgICAgIGN1cnJlbnRDaGFuZ2UuY3VycmVudFZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNpbXBsZUNoYW5nZXNbZGVjbGFyZWROYW1lXSA9XG4gICAgICAgICAgICAgICAgbmV3IFNpbXBsZUNoYW5nZSh0aGlzW3ByaXZhdGVNaW5LZXldLCB2YWx1ZSwgaXNGaXJzdENoYW5nZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGlzRmlyc3RDaGFuZ2UpIHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBhIHBsYWNlIHdoZXJlIHRoZSBhY3R1YWwgdmFsdWUgd2lsbCBiZSBzdG9yZWQgYW5kIG1ha2UgaXQgbm9uLWVudW1lcmFibGVcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBwcml2YXRlTWluS2V5LCB7dmFsdWUsIHdyaXRhYmxlOiB0cnVlfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXNbcHJpdmF0ZU1pbktleV0gPSB2YWx1ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoc2V0dGVyKSBzZXR0ZXIuY2FsbCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIE1ha2UgdGhlIHByb3BlcnR5IGNvbmZpZ3VyYWJsZSBpbiBkZXYgbW9kZSB0byBhbGxvdyBvdmVycmlkaW5nIGluIHRlc3RzXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGVcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIElmIGFuIG9uSW5pdCBob29rIGlzIGRlZmluZWQsIGl0IHdpbGwgbmVlZCB0byB3cmFwIHRoZSBuZ09uQ2hhbmdlcyBjYWxsXG4gIC8vIHNvIHRoZSBjYWxsIG9yZGVyIGlzIGNoYW5nZXMtaW5pdC1jaGVjayBpbiBjcmVhdGlvbiBtb2RlLiBJbiBzdWJzZXF1ZW50XG4gIC8vIGNoYW5nZSBkZXRlY3Rpb24gcnVucywgb25seSB0aGUgY2hlY2sgd3JhcHBlciB3aWxsIGJlIGNhbGxlZC5cbiAgaWYgKGRlZmluaXRpb24ub25Jbml0ICE9IG51bGwpIHtcbiAgICBkZWZpbml0aW9uLm9uSW5pdCA9IG9uQ2hhbmdlc1dyYXBwZXIoZGVmaW5pdGlvbi5vbkluaXQpO1xuICB9XG5cbiAgZGVmaW5pdGlvbi5kb0NoZWNrID0gb25DaGFuZ2VzV3JhcHBlcihkZWZpbml0aW9uLmRvQ2hlY2spO1xufVxuXG5mdW5jdGlvbiBvbkNoYW5nZXNXcmFwcGVyKGRlbGVnYXRlSG9vazogKCgpID0+IHZvaWQpIHwgbnVsbCkge1xuICByZXR1cm4gZnVuY3Rpb24odGhpczogT25DaGFuZ2VzRXhwYW5kbykge1xuICAgIGNvbnN0IHNpbXBsZUNoYW5nZXMgPSB0aGlzW1BSSVZBVEVfUFJFRklYXTtcbiAgICBpZiAoc2ltcGxlQ2hhbmdlcyAhPSBudWxsKSB7XG4gICAgICB0aGlzLm5nT25DaGFuZ2VzKHNpbXBsZUNoYW5nZXMpO1xuICAgICAgdGhpc1tQUklWQVRFX1BSRUZJWF0gPSBudWxsO1xuICAgIH1cbiAgICBpZiAoZGVsZWdhdGVIb29rKSBkZWxlZ2F0ZUhvb2suYXBwbHkodGhpcyk7XG4gIH07XG59XG4iXX0=