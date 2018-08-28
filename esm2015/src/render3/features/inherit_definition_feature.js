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
            // Merge View Queries
            if (isComponentDef(definition) && isComponentDef(superDef)) {
                /** @type {?} */
                const prevViewQuery = definition.viewQuery;
                /** @type {?} */
                const superViewQuery = superDef.viewQuery;
                if (superViewQuery) {
                    if (prevViewQuery) {
                        definition.viewQuery = (rf, ctx) => {
                            superViewQuery(rf, ctx);
                            prevViewQuery(rf, ctx);
                        };
                    }
                    else {
                        definition.viewQuery = superViewQuery;
                    }
                }
            }
            /** @type {?} */
            const prevContentQueries = definition.contentQueries;
            /** @type {?} */
            const superContentQueries = superDef.contentQueries;
            if (superContentQueries) {
                if (prevContentQueries) {
                    definition.contentQueries = () => {
                        superContentQueries();
                        prevContentQueries();
                    };
                }
                else {
                    definition.contentQueries = superContentQueries;
                }
            }
            /** @type {?} */
            const prevContentQueriesRefresh = definition.contentQueriesRefresh;
            /** @type {?} */
            const superContentQueriesRefresh = superDef.contentQueriesRefresh;
            if (superContentQueriesRefresh) {
                if (prevContentQueriesRefresh) {
                    definition.contentQueriesRefresh = (directiveIndex, queryIndex) => {
                        superContentQueriesRefresh(directiveIndex, queryIndex);
                        prevContentQueriesRefresh(directiveIndex, queryIndex);
                    };
                }
                else {
                    definition.contentQueriesRefresh = superContentQueriesRefresh;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5oZXJpdF9kZWZpbml0aW9uX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL2luaGVyaXRfZGVmaW5pdGlvbl9mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHFCQUFxQixDQUFDOzs7Ozs7O0FBU25ELFNBQVMsY0FBYyxDQUFJLFVBQTREOztJQUVyRixNQUFNLEdBQUcscUJBQUcsVUFBcUMsRUFBQztJQUNsRCxPQUFPLE9BQU8sR0FBRyxDQUFDLFFBQVEsS0FBSyxVQUFVLENBQUM7Q0FDM0M7Ozs7O0FBRUQsU0FBUyxZQUFZLENBQUMsSUFBZTtJQUVuQyxPQUFPLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztDQUMxRDs7Ozs7O0FBTUQsTUFBTSxVQUFVLHdCQUF3QixDQUNwQyxVQUFnRTs7SUFDbEUsSUFBSSxTQUFTLEdBQUcsWUFBWSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUU5QyxPQUFPLFNBQVMsRUFBRTs7UUFDaEIsSUFBSSxRQUFRLEdBQWtFLFNBQVMsQ0FBQztRQUN4RixJQUFJLGNBQWMsQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUM5QixRQUFRLEdBQUcsU0FBUyxDQUFDLGNBQWMsSUFBSSxTQUFTLENBQUMsY0FBYyxDQUFDO1NBQ2pFO2FBQU07WUFDTCxJQUFJLFNBQVMsQ0FBQyxjQUFjLEVBQUU7Z0JBQzVCLE1BQU0sSUFBSSxLQUFLLENBQUMsc0NBQXNDLENBQUMsQ0FBQzthQUN6RDtZQUNELFFBQVEsR0FBRyxTQUFTLENBQUMsY0FBYyxDQUFDO1NBQ3JDOztRQUVELE1BQU0sT0FBTyxHQUFHLG1CQUFDLFNBQWdCLEVBQUMsQ0FBQyxTQUFTLENBQUM7UUFDN0MsSUFBSSxPQUFPLEVBQUU7O1lBRVgsY0FBYyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2xELGNBQWMsQ0FBQyxVQUFVLENBQUMsY0FBYyxFQUFFLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNsRSxjQUFjLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDckQ7UUFFRCxJQUFJLFFBQVEsRUFBRTs7WUFFWixNQUFNLGdCQUFnQixHQUFHLFVBQVUsQ0FBQyxZQUFZLENBQUM7O1lBQ2pELE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQztZQUNoRCxJQUFJLGlCQUFpQixFQUFFO2dCQUNyQixJQUFJLGdCQUFnQixFQUFFO29CQUNwQixVQUFVLENBQUMsWUFBWSxHQUFHLENBQUMsY0FBc0IsRUFBRSxZQUFvQixFQUFFLEVBQUU7d0JBQ3pFLGlCQUFpQixDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQzt3QkFDaEQsZ0JBQWdCLENBQUMsY0FBYyxFQUFFLFlBQVksQ0FBQyxDQUFDO3FCQUNoRCxDQUFDO2lCQUNIO3FCQUFNO29CQUNMLFVBQVUsQ0FBQyxZQUFZLEdBQUcsaUJBQWlCLENBQUM7aUJBQzdDO2FBQ0Y7O1lBR0QsSUFBSSxjQUFjLENBQUMsVUFBVSxDQUFDLElBQUksY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFOztnQkFDMUQsTUFBTSxhQUFhLEdBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBQzs7Z0JBQzNDLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUM7Z0JBQzFDLElBQUksY0FBYyxFQUFFO29CQUNsQixJQUFJLGFBQWEsRUFBRTt3QkFDakIsVUFBVSxDQUFDLFNBQVMsR0FBRyxDQUFJLEVBQWUsRUFBRSxHQUFNLEVBQVEsRUFBRTs0QkFDMUQsY0FBYyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQzs0QkFDeEIsYUFBYSxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQzt5QkFDeEIsQ0FBQztxQkFDSDt5QkFBTTt3QkFDTCxVQUFVLENBQUMsU0FBUyxHQUFHLGNBQWMsQ0FBQztxQkFDdkM7aUJBQ0Y7YUFDRjs7WUFHRCxNQUFNLGtCQUFrQixHQUFHLFVBQVUsQ0FBQyxjQUFjLENBQUM7O1lBQ3JELE1BQU0sbUJBQW1CLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQztZQUNwRCxJQUFJLG1CQUFtQixFQUFFO2dCQUN2QixJQUFJLGtCQUFrQixFQUFFO29CQUN0QixVQUFVLENBQUMsY0FBYyxHQUFHLEdBQUcsRUFBRTt3QkFDL0IsbUJBQW1CLEVBQUUsQ0FBQzt3QkFDdEIsa0JBQWtCLEVBQUUsQ0FBQztxQkFDdEIsQ0FBQztpQkFDSDtxQkFBTTtvQkFDTCxVQUFVLENBQUMsY0FBYyxHQUFHLG1CQUFtQixDQUFDO2lCQUNqRDthQUNGOztZQUdELE1BQU0seUJBQXlCLEdBQUcsVUFBVSxDQUFDLHFCQUFxQixDQUFDOztZQUNuRSxNQUFNLDBCQUEwQixHQUFHLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQztZQUNsRSxJQUFJLDBCQUEwQixFQUFFO2dCQUM5QixJQUFJLHlCQUF5QixFQUFFO29CQUM3QixVQUFVLENBQUMscUJBQXFCLEdBQUcsQ0FBQyxjQUFzQixFQUFFLFVBQWtCLEVBQUUsRUFBRTt3QkFDaEYsMEJBQTBCLENBQUMsY0FBYyxFQUFFLFVBQVUsQ0FBQyxDQUFDO3dCQUN2RCx5QkFBeUIsQ0FBQyxjQUFjLEVBQUUsVUFBVSxDQUFDLENBQUM7cUJBQ3ZELENBQUM7aUJBQ0g7cUJBQU07b0JBQ0wsVUFBVSxDQUFDLHFCQUFxQixHQUFHLDBCQUEwQixDQUFDO2lCQUMvRDthQUNGOztZQUlELGNBQWMsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuRCxjQUFjLENBQUMsVUFBVSxDQUFDLGNBQWMsRUFBRSxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDbkUsY0FBYyxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDOzs7WUFJckQsVUFBVSxDQUFDLG1CQUFtQjtnQkFDMUIsVUFBVSxDQUFDLG1CQUFtQixJQUFJLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQztZQUNuRSxVQUFVLENBQUMsZ0JBQWdCLEdBQUcsVUFBVSxDQUFDLGdCQUFnQixJQUFJLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQztZQUN2RixVQUFVLENBQUMsZ0JBQWdCLEdBQUcsVUFBVSxDQUFDLGdCQUFnQixJQUFJLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQztZQUN2RixVQUFVLENBQUMsYUFBYSxHQUFHLFVBQVUsQ0FBQyxhQUFhLElBQUksUUFBUSxDQUFDLGFBQWEsQ0FBQztZQUM5RSxVQUFVLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQyxPQUFPLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQztZQUM1RCxVQUFVLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQyxTQUFTLElBQUksUUFBUSxDQUFDLFNBQVMsQ0FBQztZQUNsRSxVQUFVLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQzs7WUFHekQsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQztZQUNuQyxJQUFJLFFBQVEsRUFBRTtnQkFDWixLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRTtvQkFDOUIsSUFBSSxPQUFPLElBQUksT0FBTyxLQUFLLHdCQUF3QixFQUFFO3dCQUNuRCxtQkFBQyxPQUE4QixFQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7cUJBQzlDO2lCQUNGO2FBQ0Y7WUFFRCxNQUFNO1NBQ1A7YUFBTTs7WUFFTCxNQUFNLGNBQWMsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDO1lBRTNDLElBQUksY0FBYyxFQUFFO2dCQUNsQixVQUFVLENBQUMsbUJBQW1CO29CQUMxQixVQUFVLENBQUMsbUJBQW1CLElBQUksY0FBYyxDQUFDLG1CQUFtQixDQUFDO2dCQUN6RSxVQUFVLENBQUMsZ0JBQWdCO29CQUN2QixVQUFVLENBQUMsZ0JBQWdCLElBQUksY0FBYyxDQUFDLGdCQUFnQixDQUFDO2dCQUNuRSxVQUFVLENBQUMsZ0JBQWdCO29CQUN2QixVQUFVLENBQUMsZ0JBQWdCLElBQUksY0FBYyxDQUFDLGdCQUFnQixDQUFDO2dCQUNuRSxVQUFVLENBQUMsYUFBYSxHQUFHLFVBQVUsQ0FBQyxhQUFhLElBQUksY0FBYyxDQUFDLGFBQWEsQ0FBQztnQkFDcEYsVUFBVSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUMsT0FBTyxJQUFJLGNBQWMsQ0FBQyxPQUFPLENBQUM7Z0JBQ2xFLFVBQVUsQ0FBQyxTQUFTLEdBQUcsVUFBVSxDQUFDLFNBQVMsSUFBSSxjQUFjLENBQUMsU0FBUyxDQUFDO2dCQUN4RSxVQUFVLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLElBQUksY0FBYyxDQUFDLE1BQU0sQ0FBQzthQUNoRTtTQUNGO1FBRUQsU0FBUyxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDOUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi90eXBlJztcbmltcG9ydCB7ZmlsbFByb3BlcnRpZXN9IGZyb20gJy4uLy4uL3V0aWwvcHJvcGVydHknO1xuaW1wb3J0IHtDb21wb25lbnREZWZJbnRlcm5hbCwgQ29tcG9uZW50VGVtcGxhdGUsIERpcmVjdGl2ZURlZkZlYXR1cmUsIERpcmVjdGl2ZURlZkludGVybmFsLCBSZW5kZXJGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcblxuXG5cbi8qKlxuICogRGV0ZXJtaW5lcyBpZiBhIGRlZmluaXRpb24gaXMgYSB7QGxpbmsgQ29tcG9uZW50RGVmSW50ZXJuYWx9IG9yIGEge0BsaW5rIERpcmVjdGl2ZURlZkludGVybmFsfVxuICogQHBhcmFtIGRlZmluaXRpb24gVGhlIGRlZmluaXRpb24gdG8gZXhhbWluZVxuICovXG5mdW5jdGlvbiBpc0NvbXBvbmVudERlZjxUPihkZWZpbml0aW9uOiBDb21wb25lbnREZWZJbnRlcm5hbDxUPnwgRGlyZWN0aXZlRGVmSW50ZXJuYWw8VD4pOlxuICAgIGRlZmluaXRpb24gaXMgQ29tcG9uZW50RGVmSW50ZXJuYWw8VD4ge1xuICBjb25zdCBkZWYgPSBkZWZpbml0aW9uIGFzIENvbXBvbmVudERlZkludGVybmFsPFQ+O1xuICByZXR1cm4gdHlwZW9mIGRlZi50ZW1wbGF0ZSA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gZ2V0U3VwZXJUeXBlKHR5cGU6IFR5cGU8YW55Pik6IFR5cGU8YW55PiZcbiAgICB7bmdDb21wb25lbnREZWY/OiBDb21wb25lbnREZWZJbnRlcm5hbDxhbnk+LCBuZ0RpcmVjdGl2ZURlZj86IERpcmVjdGl2ZURlZkludGVybmFsPGFueT59IHtcbiAgcmV0dXJuIE9iamVjdC5nZXRQcm90b3R5cGVPZih0eXBlLnByb3RvdHlwZSkuY29uc3RydWN0b3I7XG59XG5cbi8qKlxuICogTWVyZ2VzIHRoZSBkZWZpbml0aW9uIGZyb20gYSBzdXBlciBjbGFzcyB0byBhIHN1YiBjbGFzcy5cbiAqIEBwYXJhbSBkZWZpbml0aW9uIFRoZSBkZWZpbml0aW9uIHRoYXQgaXMgYSBTdWJDbGFzcyBvZiBhbm90aGVyIGRpcmVjdGl2ZSBvZiBjb21wb25lbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEluaGVyaXREZWZpbml0aW9uRmVhdHVyZShcbiAgICBkZWZpbml0aW9uOiBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+fCBDb21wb25lbnREZWZJbnRlcm5hbDxhbnk+KTogdm9pZCB7XG4gIGxldCBzdXBlclR5cGUgPSBnZXRTdXBlclR5cGUoZGVmaW5pdGlvbi50eXBlKTtcblxuICB3aGlsZSAoc3VwZXJUeXBlKSB7XG4gICAgbGV0IHN1cGVyRGVmOiBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+fENvbXBvbmVudERlZkludGVybmFsPGFueT58dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgIGlmIChpc0NvbXBvbmVudERlZihkZWZpbml0aW9uKSkge1xuICAgICAgc3VwZXJEZWYgPSBzdXBlclR5cGUubmdDb21wb25lbnREZWYgfHwgc3VwZXJUeXBlLm5nRGlyZWN0aXZlRGVmO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoc3VwZXJUeXBlLm5nQ29tcG9uZW50RGVmKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRGlyZWN0aXZlcyBjYW5ub3QgaW5oZXJpdCBDb21wb25lbnRzJyk7XG4gICAgICB9XG4gICAgICBzdXBlckRlZiA9IHN1cGVyVHlwZS5uZ0RpcmVjdGl2ZURlZjtcbiAgICB9XG5cbiAgICBjb25zdCBiYXNlRGVmID0gKHN1cGVyVHlwZSBhcyBhbnkpLm5nQmFzZURlZjtcbiAgICBpZiAoYmFzZURlZikge1xuICAgICAgLy8gTWVyZ2UgaW5wdXRzIGFuZCBvdXRwdXRzXG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLmlucHV0cywgYmFzZURlZi5pbnB1dHMpO1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5kZWNsYXJlZElucHV0cywgYmFzZURlZi5kZWNsYXJlZElucHV0cyk7XG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLm91dHB1dHMsIGJhc2VEZWYub3V0cHV0cyk7XG4gICAgfVxuXG4gICAgaWYgKHN1cGVyRGVmKSB7XG4gICAgICAvLyBNZXJnZSBob3N0QmluZGluZ3NcbiAgICAgIGNvbnN0IHByZXZIb3N0QmluZGluZ3MgPSBkZWZpbml0aW9uLmhvc3RCaW5kaW5ncztcbiAgICAgIGNvbnN0IHN1cGVySG9zdEJpbmRpbmdzID0gc3VwZXJEZWYuaG9zdEJpbmRpbmdzO1xuICAgICAgaWYgKHN1cGVySG9zdEJpbmRpbmdzKSB7XG4gICAgICAgIGlmIChwcmV2SG9zdEJpbmRpbmdzKSB7XG4gICAgICAgICAgZGVmaW5pdGlvbi5ob3N0QmluZGluZ3MgPSAoZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgZWxlbWVudEluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIHN1cGVySG9zdEJpbmRpbmdzKGRpcmVjdGl2ZUluZGV4LCBlbGVtZW50SW5kZXgpO1xuICAgICAgICAgICAgcHJldkhvc3RCaW5kaW5ncyhkaXJlY3RpdmVJbmRleCwgZWxlbWVudEluZGV4KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlZmluaXRpb24uaG9zdEJpbmRpbmdzID0gc3VwZXJIb3N0QmluZGluZ3M7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gTWVyZ2UgVmlldyBRdWVyaWVzXG4gICAgICBpZiAoaXNDb21wb25lbnREZWYoZGVmaW5pdGlvbikgJiYgaXNDb21wb25lbnREZWYoc3VwZXJEZWYpKSB7XG4gICAgICAgIGNvbnN0IHByZXZWaWV3UXVlcnkgPSBkZWZpbml0aW9uLnZpZXdRdWVyeTtcbiAgICAgICAgY29uc3Qgc3VwZXJWaWV3UXVlcnkgPSBzdXBlckRlZi52aWV3UXVlcnk7XG4gICAgICAgIGlmIChzdXBlclZpZXdRdWVyeSkge1xuICAgICAgICAgIGlmIChwcmV2Vmlld1F1ZXJ5KSB7XG4gICAgICAgICAgICBkZWZpbml0aW9uLnZpZXdRdWVyeSA9IDxUPihyZjogUmVuZGVyRmxhZ3MsIGN0eDogVCk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgICBzdXBlclZpZXdRdWVyeShyZiwgY3R4KTtcbiAgICAgICAgICAgICAgcHJldlZpZXdRdWVyeShyZiwgY3R4KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlZmluaXRpb24udmlld1F1ZXJ5ID0gc3VwZXJWaWV3UXVlcnk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIE1lcmdlIENvbnRlbnQgUXVlcmllc1xuICAgICAgY29uc3QgcHJldkNvbnRlbnRRdWVyaWVzID0gZGVmaW5pdGlvbi5jb250ZW50UXVlcmllcztcbiAgICAgIGNvbnN0IHN1cGVyQ29udGVudFF1ZXJpZXMgPSBzdXBlckRlZi5jb250ZW50UXVlcmllcztcbiAgICAgIGlmIChzdXBlckNvbnRlbnRRdWVyaWVzKSB7XG4gICAgICAgIGlmIChwcmV2Q29udGVudFF1ZXJpZXMpIHtcbiAgICAgICAgICBkZWZpbml0aW9uLmNvbnRlbnRRdWVyaWVzID0gKCkgPT4ge1xuICAgICAgICAgICAgc3VwZXJDb250ZW50UXVlcmllcygpO1xuICAgICAgICAgICAgcHJldkNvbnRlbnRRdWVyaWVzKCk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWZpbml0aW9uLmNvbnRlbnRRdWVyaWVzID0gc3VwZXJDb250ZW50UXVlcmllcztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBNZXJnZSBDb250ZW50IFF1ZXJpZXMgUmVmcmVzaFxuICAgICAgY29uc3QgcHJldkNvbnRlbnRRdWVyaWVzUmVmcmVzaCA9IGRlZmluaXRpb24uY29udGVudFF1ZXJpZXNSZWZyZXNoO1xuICAgICAgY29uc3Qgc3VwZXJDb250ZW50UXVlcmllc1JlZnJlc2ggPSBzdXBlckRlZi5jb250ZW50UXVlcmllc1JlZnJlc2g7XG4gICAgICBpZiAoc3VwZXJDb250ZW50UXVlcmllc1JlZnJlc2gpIHtcbiAgICAgICAgaWYgKHByZXZDb250ZW50UXVlcmllc1JlZnJlc2gpIHtcbiAgICAgICAgICBkZWZpbml0aW9uLmNvbnRlbnRRdWVyaWVzUmVmcmVzaCA9IChkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBxdWVyeUluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIHN1cGVyQ29udGVudFF1ZXJpZXNSZWZyZXNoKGRpcmVjdGl2ZUluZGV4LCBxdWVyeUluZGV4KTtcbiAgICAgICAgICAgIHByZXZDb250ZW50UXVlcmllc1JlZnJlc2goZGlyZWN0aXZlSW5kZXgsIHF1ZXJ5SW5kZXgpO1xuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVmaW5pdGlvbi5jb250ZW50UXVlcmllc1JlZnJlc2ggPSBzdXBlckNvbnRlbnRRdWVyaWVzUmVmcmVzaDtcbiAgICAgICAgfVxuICAgICAgfVxuXG5cbiAgICAgIC8vIE1lcmdlIGlucHV0cyBhbmQgb3V0cHV0c1xuICAgICAgZmlsbFByb3BlcnRpZXMoZGVmaW5pdGlvbi5pbnB1dHMsIHN1cGVyRGVmLmlucHV0cyk7XG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLmRlY2xhcmVkSW5wdXRzLCBzdXBlckRlZi5kZWNsYXJlZElucHV0cyk7XG4gICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLm91dHB1dHMsIHN1cGVyRGVmLm91dHB1dHMpO1xuXG4gICAgICAvLyBJbmhlcml0IGhvb2tzXG4gICAgICAvLyBBc3N1bWUgc3VwZXIgY2xhc3MgaW5oZXJpdGFuY2UgZmVhdHVyZSBoYXMgYWxyZWFkeSBydW4uXG4gICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudENoZWNrZWQgPVxuICAgICAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50Q2hlY2tlZCB8fCBzdXBlckRlZi5hZnRlckNvbnRlbnRDaGVja2VkO1xuICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRJbml0ID0gZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRJbml0IHx8IHN1cGVyRGVmLmFmdGVyQ29udGVudEluaXQ7XG4gICAgICBkZWZpbml0aW9uLmFmdGVyVmlld0NoZWNrZWQgPSBkZWZpbml0aW9uLmFmdGVyVmlld0NoZWNrZWQgfHwgc3VwZXJEZWYuYWZ0ZXJWaWV3Q2hlY2tlZDtcbiAgICAgIGRlZmluaXRpb24uYWZ0ZXJWaWV3SW5pdCA9IGRlZmluaXRpb24uYWZ0ZXJWaWV3SW5pdCB8fCBzdXBlckRlZi5hZnRlclZpZXdJbml0O1xuICAgICAgZGVmaW5pdGlvbi5kb0NoZWNrID0gZGVmaW5pdGlvbi5kb0NoZWNrIHx8IHN1cGVyRGVmLmRvQ2hlY2s7XG4gICAgICBkZWZpbml0aW9uLm9uRGVzdHJveSA9IGRlZmluaXRpb24ub25EZXN0cm95IHx8IHN1cGVyRGVmLm9uRGVzdHJveTtcbiAgICAgIGRlZmluaXRpb24ub25Jbml0ID0gZGVmaW5pdGlvbi5vbkluaXQgfHwgc3VwZXJEZWYub25Jbml0O1xuXG4gICAgICAvLyBSdW4gcGFyZW50IGZlYXR1cmVzXG4gICAgICBjb25zdCBmZWF0dXJlcyA9IHN1cGVyRGVmLmZlYXR1cmVzO1xuICAgICAgaWYgKGZlYXR1cmVzKSB7XG4gICAgICAgIGZvciAoY29uc3QgZmVhdHVyZSBvZiBmZWF0dXJlcykge1xuICAgICAgICAgIGlmIChmZWF0dXJlICYmIGZlYXR1cmUgIT09IEluaGVyaXREZWZpbml0aW9uRmVhdHVyZSkge1xuICAgICAgICAgICAgKGZlYXR1cmUgYXMgRGlyZWN0aXZlRGVmRmVhdHVyZSkoZGVmaW5pdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBFdmVuIGlmIHdlIGRvbid0IGhhdmUgYSBkZWZpbml0aW9uLCBjaGVjayB0aGUgdHlwZSBmb3IgdGhlIGhvb2tzIGFuZCB1c2UgdGhvc2UgaWYgbmVlZCBiZVxuICAgICAgY29uc3Qgc3VwZXJQcm90b3R5cGUgPSBzdXBlclR5cGUucHJvdG90eXBlO1xuXG4gICAgICBpZiAoc3VwZXJQcm90b3R5cGUpIHtcbiAgICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRDaGVja2VkID1cbiAgICAgICAgICAgIGRlZmluaXRpb24uYWZ0ZXJDb250ZW50Q2hlY2tlZCB8fCBzdXBlclByb3RvdHlwZS5hZnRlckNvbnRlbnRDaGVja2VkO1xuICAgICAgICBkZWZpbml0aW9uLmFmdGVyQ29udGVudEluaXQgPVxuICAgICAgICAgICAgZGVmaW5pdGlvbi5hZnRlckNvbnRlbnRJbml0IHx8IHN1cGVyUHJvdG90eXBlLmFmdGVyQ29udGVudEluaXQ7XG4gICAgICAgIGRlZmluaXRpb24uYWZ0ZXJWaWV3Q2hlY2tlZCA9XG4gICAgICAgICAgICBkZWZpbml0aW9uLmFmdGVyVmlld0NoZWNrZWQgfHwgc3VwZXJQcm90b3R5cGUuYWZ0ZXJWaWV3Q2hlY2tlZDtcbiAgICAgICAgZGVmaW5pdGlvbi5hZnRlclZpZXdJbml0ID0gZGVmaW5pdGlvbi5hZnRlclZpZXdJbml0IHx8IHN1cGVyUHJvdG90eXBlLmFmdGVyVmlld0luaXQ7XG4gICAgICAgIGRlZmluaXRpb24uZG9DaGVjayA9IGRlZmluaXRpb24uZG9DaGVjayB8fCBzdXBlclByb3RvdHlwZS5kb0NoZWNrO1xuICAgICAgICBkZWZpbml0aW9uLm9uRGVzdHJveSA9IGRlZmluaXRpb24ub25EZXN0cm95IHx8IHN1cGVyUHJvdG90eXBlLm9uRGVzdHJveTtcbiAgICAgICAgZGVmaW5pdGlvbi5vbkluaXQgPSBkZWZpbml0aW9uLm9uSW5pdCB8fCBzdXBlclByb3RvdHlwZS5vbkluaXQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc3VwZXJUeXBlID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHN1cGVyVHlwZSk7XG4gIH1cbn1cbiJdfQ==