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
import { getCompilerFacade } from '../../compiler/compiler_facade';
import { resolveForwardRef } from '../../di/forward_ref';
import { getReflect, reflectDependencies } from '../../di/jit/util';
import { componentNeedsResolution, maybeQueueResolutionOfComponentResources } from '../../metadata/resource_loading';
import { ViewEncapsulation } from '../../metadata/view';
import { EMPTY_ARRAY, EMPTY_OBJ } from '../empty';
import { NG_COMPONENT_DEF, NG_DIRECTIVE_DEF } from '../fields';
import { renderStringify } from '../util/misc_utils';
import { angularCoreEnv } from './environment';
import { flushModuleScopingQueueAsMuchAsPossible, patchComponentDefWithScope, transitiveScopesFor } from './module';
/**
 * Compile an Angular component according to its decorator metadata, and patch the resulting
 * ngComponentDef onto the component type.
 *
 * Compilation may be asynchronous (due to the need to resolve URLs for the component template or
 * other resources, for example). In the event that compilation is not immediate, `compileComponent`
 * will enqueue resource resolution into a global queue and will fail to return the `ngComponentDef`
 * until the global queue has been resolved with a call to `resolveComponentResources`.
 * @param {?} type
 * @param {?} metadata
 * @return {?}
 */
export function compileComponent(type, metadata) {
    /** @type {?} */
    /** @nocollapse */ let ngComponentDef = null;
    // Metadata may have resources which need to be resolved.
    maybeQueueResolutionOfComponentResources(metadata);
    Object.defineProperty(type, NG_COMPONENT_DEF, {
        get: (/**
         * @return {?}
         */
        () => {
            /** @type {?} */
            const compiler = getCompilerFacade();
            if (ngComponentDef === null) {
                if (componentNeedsResolution(metadata)) {
                    /** @type {?} */
                    const error = [`Component '${renderStringify(type)}' is not resolved:`];
                    if (metadata.templateUrl) {
                        error.push(` - templateUrl: ${renderStringify(metadata.templateUrl)}`);
                    }
                    if (metadata.styleUrls && metadata.styleUrls.length) {
                        error.push(` - styleUrls: ${JSON.stringify(metadata.styleUrls)}`);
                    }
                    error.push(`Did you run and wait for 'resolveComponentResources()'?`);
                    throw new Error(error.join('\n'));
                }
                /** @type {?} */
                const templateUrl = metadata.templateUrl || `ng:///${renderStringify(type)}/template.html`;
                /** @type {?} */
                const meta = Object.assign({}, directiveMetadata(type, metadata), { typeSourceSpan: compiler.createParseSourceSpan('Component', renderStringify(type), templateUrl), template: metadata.template || '', preserveWhitespaces: metadata.preserveWhitespaces || false, styles: metadata.styles || EMPTY_ARRAY, animations: metadata.animations, viewQueries: extractQueriesMetadata(type, getReflect().ownPropMetadata(type), isViewQuery), directives: [], changeDetection: metadata.changeDetection, pipes: new Map(), encapsulation: metadata.encapsulation || ViewEncapsulation.Emulated, interpolation: metadata.interpolation, viewProviders: metadata.viewProviders || null });
                ngComponentDef = compiler.compileComponent(angularCoreEnv, templateUrl, meta);
                // When NgModule decorator executed, we enqueued the module definition such that
                // it would only dequeue and add itself as module scope to all of its declarations,
                // but only if  if all of its declarations had resolved. This call runs the check
                // to see if any modules that are in the queue can be dequeued and add scope to
                // their declarations.
                flushModuleScopingQueueAsMuchAsPossible();
                // If component compilation is async, then the @NgModule annotation which declares the
                // component may execute and set an ngSelectorScope property on the component type. This
                // allows the component to patch itself with directiveDefs from the module after it
                // finishes compiling.
                if (hasSelectorScope(type)) {
                    /** @type {?} */
                    const scopes = transitiveScopesFor(type.ngSelectorScope);
                    patchComponentDefWithScope(ngComponentDef, scopes);
                }
            }
            return ngComponentDef;
        }),
        // Make the property configurable in dev mode to allow overriding in tests
        configurable: !!ngDevMode,
    });
}
/**
 * @template T
 * @param {?} component
 * @return {?}
 */
function hasSelectorScope(component) {
    return ((/** @type {?} */ (component))).ngSelectorScope !== undefined;
}
/**
 * Compile an Angular directive according to its decorator metadata, and patch the resulting
 * ngDirectiveDef onto the component type.
 *
 * In the event that compilation is not immediate, `compileDirective` will return a `Promise` which
 * will resolve when compilation completes and the directive becomes usable.
 * @param {?} type
 * @param {?} directive
 * @return {?}
 */
export function compileDirective(type, directive) {
    /** @type {?} */
    /** @nocollapse */ let ngDirectiveDef = null;
    Object.defineProperty(type, NG_DIRECTIVE_DEF, {
        get: (/**
         * @return {?}
         */
        () => {
            if (ngDirectiveDef === null) {
                /** @type {?} */
                const name = type && type.name;
                /** @type {?} */
                const sourceMapUrl = `ng://${name}/ngDirectiveDef.js`;
                /** @type {?} */
                const compiler = getCompilerFacade();
                /** @type {?} */
                const facade = directiveMetadata((/** @type {?} */ (type)), directive);
                facade.typeSourceSpan =
                    compiler.createParseSourceSpan('Directive', renderStringify(type), sourceMapUrl);
                ngDirectiveDef = compiler.compileDirective(angularCoreEnv, sourceMapUrl, facade);
            }
            return ngDirectiveDef;
        }),
        // Make the property configurable in dev mode to allow overriding in tests
        configurable: !!ngDevMode,
    });
}
/**
 * @param {?} type
 * @return {?}
 */
export function extendsDirectlyFromObject(type) {
    return Object.getPrototypeOf(type.prototype) === Object.prototype;
}
/**
 * Extract the `R3DirectiveMetadata` for a particular directive (either a `Directive` or a
 * `Component`).
 * @param {?} type
 * @param {?} metadata
 * @return {?}
 */
export function directiveMetadata(type, metadata) {
    // Reflect inputs and outputs.
    /** @type {?} */
    const propMetadata = getReflect().ownPropMetadata(type);
    return {
        name: type.name,
        type: type,
        typeArgumentCount: 0,
        selector: (/** @type {?} */ (metadata.selector)),
        deps: reflectDependencies(type),
        host: metadata.host || EMPTY_OBJ,
        propMetadata: propMetadata,
        inputs: metadata.inputs || EMPTY_ARRAY,
        outputs: metadata.outputs || EMPTY_ARRAY,
        queries: extractQueriesMetadata(type, propMetadata, isContentQuery),
        lifecycle: { usesOnChanges: type.prototype.hasOwnProperty('ngOnChanges') },
        typeSourceSpan: (/** @type {?} */ (null)),
        usesInheritance: !extendsDirectlyFromObject(type),
        exportAs: extractExportAs(metadata.exportAs),
        providers: metadata.providers || null,
    };
}
/**
 * @param {?} selector
 * @return {?}
 */
function convertToR3QueryPredicate(selector) {
    return typeof selector === 'string' ? splitByComma(selector) : resolveForwardRef(selector);
}
/**
 * @param {?} propertyName
 * @param {?} ann
 * @return {?}
 */
export function convertToR3QueryMetadata(propertyName, ann) {
    return {
        propertyName: propertyName,
        predicate: convertToR3QueryPredicate(ann.selector),
        descendants: ann.descendants,
        first: ann.first,
        read: ann.read ? ann.read : null,
        static: !!ann.static
    };
}
/**
 * @param {?} type
 * @param {?} propMetadata
 * @param {?} isQueryAnn
 * @return {?}
 */
function extractQueriesMetadata(type, propMetadata, isQueryAnn) {
    /** @type {?} */
    const queriesMeta = [];
    for (const field in propMetadata) {
        if (propMetadata.hasOwnProperty(field)) {
            /** @type {?} */
            const annotations = propMetadata[field];
            annotations.forEach((/**
             * @param {?} ann
             * @return {?}
             */
            ann => {
                if (isQueryAnn(ann)) {
                    if (!ann.selector) {
                        throw new Error(`Can't construct a query for the property "${field}" of ` +
                            `"${renderStringify(type)}" since the query selector wasn't defined.`);
                    }
                    if (annotations.some(isInputAnn)) {
                        throw new Error(`Cannot combine @Input decorators with query decorators`);
                    }
                    queriesMeta.push(convertToR3QueryMetadata(field, ann));
                }
            }));
        }
    }
    return queriesMeta;
}
/**
 * @param {?} exportAs
 * @return {?}
 */
function extractExportAs(exportAs) {
    if (exportAs === undefined) {
        return null;
    }
    return exportAs.split(',').map((/**
     * @param {?} part
     * @return {?}
     */
    part => part.trim()));
}
/**
 * @param {?} value
 * @return {?}
 */
function isContentQuery(value) {
    /** @type {?} */
    const name = value.ngMetadataName;
    return name === 'ContentChild' || name === 'ContentChildren';
}
/**
 * @param {?} value
 * @return {?}
 */
function isViewQuery(value) {
    /** @type {?} */
    const name = value.ngMetadataName;
    return name === 'ViewChild' || name === 'ViewChildren';
}
/**
 * @param {?} value
 * @return {?}
 */
function isInputAnn(value) {
    return value.ngMetadataName === 'Input';
}
/**
 * @param {?} value
 * @return {?}
 */
function splitByComma(value) {
    return value.split(',').map((/**
     * @param {?} piece
     * @return {?}
     */
    piece => piece.trim()));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUE0QixpQkFBaUIsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBRTVGLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3ZELE9BQU8sRUFBQyxVQUFVLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUlsRSxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsd0NBQXdDLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUNuSCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsV0FBVyxFQUFFLFNBQVMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNoRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDN0QsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRW5ELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDN0MsT0FBTyxFQUFDLHVDQUF1QyxFQUFFLDBCQUEwQixFQUFFLG1CQUFtQixFQUFDLE1BQU0sVUFBVSxDQUFDOzs7Ozs7Ozs7Ozs7O0FBYWxILE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxJQUFlLEVBQUUsUUFBbUI7O1FBQy9ELGNBQWMsR0FBUSxJQUFJO0lBQzlCLHlEQUF5RDtJQUN6RCx3Q0FBd0MsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNuRCxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtRQUM1QyxHQUFHOzs7UUFBRSxHQUFHLEVBQUU7O2tCQUNGLFFBQVEsR0FBRyxpQkFBaUIsRUFBRTtZ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QUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFDLENBQUM7QUFDdEQsQ0FBQzs7Ozs7QUFFRCxTQUFTLGNBQWMsQ0FBQyxLQUFVOztVQUMxQixJQUFJLEdBQUcsS0FBSyxDQUFDLGNBQWM7SUFDakMsT0FBTyxJQUFJLEtBQUssY0FBYyxJQUFJLElBQUksS0FBSyxpQkFBaUIsQ0FBQztBQUMvRCxDQUFDOzs7OztBQUVELFNBQVMsV0FBVyxDQUFDLEtBQVU7O1VBQ3ZCLElBQUksR0FBRyxLQUFLLENBQUMsY0FBYztJQUNqQyxPQUFPLElBQUksS0FBSyxXQUFXLElBQUksSUFBSSxLQUFLLGNBQWMsQ0FBQztBQUN6RCxDQUFDOzs7OztBQUVELFNBQVMsVUFBVSxDQUFDLEtBQVU7SUFDNUIsT0FBTyxLQUFLLENBQUMsY0FBYyxLQUFLLE9BQU8sQ0FBQztBQUMxQyxDQUFDOzs7OztBQUVELFNBQVMsWUFBWSxDQUFDLEtBQWE7SUFDakMsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUc7Ozs7SUFBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBQyxDQUFDO0FBQ3JELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q29tcG9uZW50VHlwZX0gZnJvbSAnLi4nO1xuaW1wb3J0IHtSM0RpcmVjdGl2ZU1ldGFkYXRhRmFjYWRlLCBnZXRDb21waWxlckZhY2FkZX0gZnJvbSAnLi4vLi4vY29tcGlsZXIvY29tcGlsZXJfZmFjYWRlJztcbmltcG9ydCB7UjNDb21wb25lbnRNZXRhZGF0YUZhY2FkZSwgUjNRdWVyeU1ldGFkYXRhRmFjYWRlfSBmcm9tICcuLi8uLi9jb21waWxlci9jb21waWxlcl9mYWNhZGVfaW50ZXJmYWNlJztcbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4uLy4uL2RpL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7Z2V0UmVmbGVjdCwgcmVmbGVjdERlcGVuZGVuY2llc30gZnJvbSAnLi4vLi4vZGkvaml0L3V0aWwnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge1F1ZXJ5fSBmcm9tICcuLi8uLi9tZXRhZGF0YS9kaSc7XG5pbXBvcnQge0NvbXBvbmVudCwgRGlyZWN0aXZlLCBJbnB1dH0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvZGlyZWN0aXZlcyc7XG5pbXBvcnQge2NvbXBvbmVudE5lZWRzUmVzb2x1dGlvbiwgbWF5YmVRdWV1ZVJlc29sdXRpb25PZkNvbXBvbmVudFJlc291cmNlc30gZnJvbSAnLi4vLi4vbWV0YWRhdGEvcmVzb3VyY2VfbG9hZGluZyc7XG5pbXBvcnQge1ZpZXdFbmNhcHN1bGF0aW9ufSBmcm9tICcuLi8uLi9tZXRhZGF0YS92aWV3JztcbmltcG9ydCB7RU1QVFlfQVJSQVksIEVNUFRZX09CSn0gZnJvbSAnLi4vZW1wdHknO1xuaW1wb3J0IHtOR19DT01QT05FTlRfREVGLCBOR19ESVJFQ1RJVkVfREVGfSBmcm9tICcuLi9maWVsZHMnO1xuaW1wb3J0IHtyZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvbWlzY191dGlscyc7XG5cbmltcG9ydCB7YW5ndWxhckNvcmVFbnZ9IGZyb20gJy4vZW52aXJvbm1lbnQnO1xuaW1wb3J0IHtmbHVzaE1vZHVsZVNjb3BpbmdRdWV1ZUFzTXVjaEFzUG9zc2libGUsIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlLCB0cmFuc2l0aXZlU2NvcGVzRm9yfSBmcm9tICcuL21vZHVsZSc7XG5cblxuXG4vKipcbiAqIENvbXBpbGUgYW4gQW5ndWxhciBjb21wb25lbnQgYWNjb3JkaW5nIHRvIGl0cyBkZWNvcmF0b3IgbWV0YWRhdGEsIGFuZCBwYXRjaCB0aGUgcmVzdWx0aW5nXG4gKiBuZ0NvbXBvbmVudERlZiBvbnRvIHRoZSBjb21wb25lbnQgdHlwZS5cbiAqXG4gKiBDb21waWxhdGlvbiBtYXkgYmUgYXN5bmNocm9ub3VzIChkdWUgdG8gdGhlIG5lZWQgdG8gcmVzb2x2ZSBVUkxzIGZvciB0aGUgY29tcG9uZW50IHRlbXBsYXRlIG9yXG4gKiBvdGhlciByZXNvdXJjZXMsIGZvciBleGFtcGxlKS4gSW4gdGhlIGV2ZW50IHRoYXQgY29tcGlsYXRpb24gaXMgbm90IGltbWVkaWF0ZSwgYGNvbXBpbGVDb21wb25lbnRgXG4gKiB3aWxsIGVucXVldWUgcmVzb3VyY2UgcmVzb2x1dGlvbiBpbnRvIGEgZ2xvYmFsIHF1ZXVlIGFuZCB3aWxsIGZhaWwgdG8gcmV0dXJuIHRoZSBgbmdDb21wb25lbnREZWZgXG4gKiB1bnRpbCB0aGUgZ2xvYmFsIHF1ZXVlIGhhcyBiZWVuIHJlc29sdmVkIHdpdGggYSBjYWxsIHRvIGByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVDb21wb25lbnQodHlwZTogVHlwZTxhbnk+LCBtZXRhZGF0YTogQ29tcG9uZW50KTogdm9pZCB7XG4gIGxldCBuZ0NvbXBvbmVudERlZjogYW55ID0gbnVsbDtcbiAgLy8gTWV0YWRhdGEgbWF5IGhhdmUgcmVzb3VyY2VzIHdoaWNoIG5lZWQgdG8gYmUgcmVzb2x2ZWQuXG4gIG1heWJlUXVldWVSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXMobWV0YWRhdGEpO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgTkdfQ09NUE9ORU5UX0RFRiwge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgY29uc3QgY29tcGlsZXIgPSBnZXRDb21waWxlckZhY2FkZSgpO1xuICAgICAgaWYgKG5nQ29tcG9uZW50RGVmID09PSBudWxsKSB7XG4gICAgICAgIGlmIChjb21wb25lbnROZWVkc1Jlc29sdXRpb24obWV0YWRhdGEpKSB7XG4gICAgICAgICAgY29uc3QgZXJyb3IgPSBbYENvbXBvbmVudCAnJHtyZW5kZXJTdHJpbmdpZnkodHlwZSl9JyBpcyBub3QgcmVzb2x2ZWQ6YF07XG4gICAgICAgICAgaWYgKG1ldGFkYXRhLnRlbXBsYXRlVXJsKSB7XG4gICAgICAgICAgICBlcnJvci5wdXNoKGAgLSB0ZW1wbGF0ZVVybDogJHtyZW5kZXJTdHJpbmdpZnkobWV0YWRhdGEudGVtcGxhdGVVcmwpfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobWV0YWRhdGEuc3R5bGVVcmxzICYmIG1ldGFkYXRhLnN0eWxlVXJscy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVycm9yLnB1c2goYCAtIHN0eWxlVXJsczogJHtKU09OLnN0cmluZ2lmeShtZXRhZGF0YS5zdHlsZVVybHMpfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlcnJvci5wdXNoKGBEaWQgeW91IHJ1biBhbmQgd2FpdCBmb3IgJ3Jlc29sdmVDb21wb25lbnRSZXNvdXJjZXMoKSc/YCk7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yLmpvaW4oJ1xcbicpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlVXJsID0gbWV0YWRhdGEudGVtcGxhdGVVcmwgfHwgYG5nOi8vLyR7cmVuZGVyU3RyaW5naWZ5KHR5cGUpfS90ZW1wbGF0ZS5odG1sYDtcbiAgICAgICAgY29uc3QgbWV0YTogUjNDb21wb25lbnRNZXRhZGF0YUZhY2FkZSA9IHtcbiAgICAgICAgICAuLi5kaXJlY3RpdmVNZXRhZGF0YSh0eXBlLCBtZXRhZGF0YSksXG4gICAgICAgICAgdHlwZVNvdXJjZVNwYW46XG4gICAgICAgICAgICAgIGNvbXBpbGVyLmNyZWF0ZVBhcnNlU291cmNlU3BhbignQ29tcG9uZW50JywgcmVuZGVyU3RyaW5naWZ5KHR5cGUpLCB0ZW1wbGF0ZVVybCksXG4gICAgICAgICAgdGVtcGxhdGU6IG1ldGFkYXRhLnRlbXBsYXRlIHx8ICcnLFxuICAgICAgICAgIHByZXNlcnZlV2hpdGVzcGFjZXM6IG1ldGFkYXRhLnByZXNlcnZlV2hpdGVzcGFjZXMgfHwgZmFsc2UsXG4gICAgICAgICAgc3R5bGVzOiBtZXRhZGF0YS5zdHlsZXMgfHwgRU1QVFlfQVJSQVksXG4gICAgICAgICAgYW5pbWF0aW9uczogbWV0YWRhdGEuYW5pbWF0aW9ucyxcbiAgICAgICAgICB2aWV3UXVlcmllczpcbiAgICAgICAgICAgICAgZXh0cmFjdFF1ZXJpZXNNZXRhZGF0YSh0eXBlLCBnZXRSZWZsZWN0KCkub3duUHJvcE1ldGFkYXRhKHR5cGUpLCBpc1ZpZXdRdWVyeSksXG4gICAgICAgICAgZGlyZWN0aXZlczogW10sXG4gICAgICAgICAgY2hhbmdlRGV0ZWN0aW9uOiBtZXRhZGF0YS5jaGFuZ2VEZXRlY3Rpb24sXG4gICAgICAgICAgcGlwZXM6IG5ldyBNYXAoKSxcbiAgICAgICAgICBlbmNhcHN1bGF0aW9uOiBtZXRhZGF0YS5lbmNhcHN1bGF0aW9uIHx8IFZpZXdFbmNhcHN1bGF0aW9uLkVtdWxhdGVkLFxuICAgICAgICAgIGludGVycG9sYXRpb246IG1ldGFkYXRhLmludGVycG9sYXRpb24sXG4gICAgICAgICAgdmlld1Byb3ZpZGVyczogbWV0YWRhdGEudmlld1Byb3ZpZGVycyB8fCBudWxsLFxuICAgICAgICB9O1xuICAgICAgICBuZ0NvbXBvbmVudERlZiA9IGNvbXBpbGVyLmNvbXBpbGVDb21wb25lbnQoYW5ndWxhckNvcmVFbnYsIHRlbXBsYXRlVXJsLCBtZXRhKTtcblxuICAgICAgICAvLyBXaGVuIE5nTW9kdWxlIGRlY29yYXRvciBleGVjdXRlZCwgd2UgZW5xdWV1ZWQgdGhlIG1vZHVsZSBkZWZpbml0aW9uIHN1Y2ggdGhhdFxuICAgICAgICAvLyBpdCB3b3VsZCBvbmx5IGRlcXVldWUgYW5kIGFkZCBpdHNlbGYgYXMgbW9kdWxlIHNjb3BlIHRvIGFsbCBvZiBpdHMgZGVjbGFyYXRpb25zLFxuICAgICAgICAvLyBidXQgb25seSBpZiAgaWYgYWxsIG9mIGl0cyBkZWNsYXJhdGlvbnMgaGFkIHJlc29sdmVkLiBUaGlzIGNhbGwgcnVucyB0aGUgY2hlY2tcbiAgICAgICAgLy8gdG8gc2VlIGlmIGFueSBtb2R1bGVzIHRoYXQgYXJlIGluIHRoZSBxdWV1ZSBjYW4gYmUgZGVxdWV1ZWQgYW5kIGFkZCBzY29wZSB0b1xuICAgICAgICAvLyB0aGVpciBkZWNsYXJhdGlvbnMuXG4gICAgICAgIGZsdXNoTW9kdWxlU2NvcGluZ1F1ZXVlQXNNdWNoQXNQb3NzaWJsZSgpO1xuXG4gICAgICAgIC8vIElmIGNvbXBvbmVudCBjb21waWxhdGlvbiBpcyBhc3luYywgdGhlbiB0aGUgQE5nTW9kdWxlIGFubm90YXRpb24gd2hpY2ggZGVjbGFyZXMgdGhlXG4gICAgICAgIC8vIGNvbXBvbmVudCBtYXkgZXhlY3V0ZSBhbmQgc2V0IGFuIG5nU2VsZWN0b3JTY29wZSBwcm9wZXJ0eSBvbiB0aGUgY29tcG9uZW50IHR5cGUuIFRoaXNcbiAgICAgICAgLy8gYWxsb3dzIHRoZSBjb21wb25lbnQgdG8gcGF0Y2ggaXRzZWxmIHdpdGggZGlyZWN0aXZlRGVmcyBmcm9tIHRoZSBtb2R1bGUgYWZ0ZXIgaXRcbiAgICAgICAgLy8gZmluaXNoZXMgY29tcGlsaW5nLlxuICAgICAgICBpZiAoaGFzU2VsZWN0b3JTY29wZSh0eXBlKSkge1xuICAgICAgICAgIGNvbnN0IHNjb3BlcyA9IHRyYW5zaXRpdmVTY29wZXNGb3IodHlwZS5uZ1NlbGVjdG9yU2NvcGUpO1xuICAgICAgICAgIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlKG5nQ29tcG9uZW50RGVmLCBzY29wZXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbmdDb21wb25lbnREZWY7XG4gICAgfSxcbiAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGUsXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBoYXNTZWxlY3RvclNjb3BlPFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IGNvbXBvbmVudCBpcyBUeXBlPFQ+JlxuICAgIHtuZ1NlbGVjdG9yU2NvcGU6IFR5cGU8YW55Pn0ge1xuICByZXR1cm4gKGNvbXBvbmVudCBhc3tuZ1NlbGVjdG9yU2NvcGU/OiBhbnl9KS5uZ1NlbGVjdG9yU2NvcGUgIT09IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBDb21waWxlIGFuIEFuZ3VsYXIgZGlyZWN0aXZlIGFjY29yZGluZyB0byBpdHMgZGVjb3JhdG9yIG1ldGFkYXRhLCBhbmQgcGF0Y2ggdGhlIHJlc3VsdGluZ1xuICogbmdEaXJlY3RpdmVEZWYgb250byB0aGUgY29tcG9uZW50IHR5cGUuXG4gKlxuICogSW4gdGhlIGV2ZW50IHRoYXQgY29tcGlsYXRpb24gaXMgbm90IGltbWVkaWF0ZSwgYGNvbXBpbGVEaXJlY3RpdmVgIHdpbGwgcmV0dXJuIGEgYFByb21pc2VgIHdoaWNoXG4gKiB3aWxsIHJlc29sdmUgd2hlbiBjb21waWxhdGlvbiBjb21wbGV0ZXMgYW5kIHRoZSBkaXJlY3RpdmUgYmVjb21lcyB1c2FibGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlRGlyZWN0aXZlKHR5cGU6IFR5cGU8YW55PiwgZGlyZWN0aXZlOiBEaXJlY3RpdmUpOiB2b2lkIHtcbiAgbGV0IG5nRGlyZWN0aXZlRGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgTkdfRElSRUNUSVZFX0RFRiwge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKG5nRGlyZWN0aXZlRGVmID09PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSB0eXBlICYmIHR5cGUubmFtZTtcbiAgICAgICAgY29uc3Qgc291cmNlTWFwVXJsID0gYG5nOi8vJHtuYW1lfS9uZ0RpcmVjdGl2ZURlZi5qc2A7XG4gICAgICAgIGNvbnN0IGNvbXBpbGVyID0gZ2V0Q29tcGlsZXJGYWNhZGUoKTtcbiAgICAgICAgY29uc3QgZmFjYWRlID0gZGlyZWN0aXZlTWV0YWRhdGEodHlwZSBhcyBDb21wb25lbnRUeXBlPGFueT4sIGRpcmVjdGl2ZSk7XG4gICAgICAgIGZhY2FkZS50eXBlU291cmNlU3BhbiA9XG4gICAgICAgICAgICBjb21waWxlci5jcmVhdGVQYXJzZVNvdXJjZVNwYW4oJ0RpcmVjdGl2ZScsIHJlbmRlclN0cmluZ2lmeSh0eXBlKSwgc291cmNlTWFwVXJsKTtcbiAgICAgICAgbmdEaXJlY3RpdmVEZWYgPSBjb21waWxlci5jb21waWxlRGlyZWN0aXZlKGFuZ3VsYXJDb3JlRW52LCBzb3VyY2VNYXBVcmwsIGZhY2FkZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmdEaXJlY3RpdmVEZWY7XG4gICAgfSxcbiAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGUsXG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXh0ZW5kc0RpcmVjdGx5RnJvbU9iamVjdCh0eXBlOiBUeXBlPGFueT4pOiBib29sZWFuIHtcbiAgcmV0dXJuIE9iamVjdC5nZXRQcm90b3R5cGVPZih0eXBlLnByb3RvdHlwZSkgPT09IE9iamVjdC5wcm90b3R5cGU7XG59XG5cbi8qKlxuICogRXh0cmFjdCB0aGUgYFIzRGlyZWN0aXZlTWV0YWRhdGFgIGZvciBhIHBhcnRpY3VsYXIgZGlyZWN0aXZlIChlaXRoZXIgYSBgRGlyZWN0aXZlYCBvciBhXG4gKiBgQ29tcG9uZW50YCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVNZXRhZGF0YSh0eXBlOiBUeXBlPGFueT4sIG1ldGFkYXRhOiBEaXJlY3RpdmUpOiBSM0RpcmVjdGl2ZU1ldGFkYXRhRmFjYWRlIHtcbiAgLy8gUmVmbGVjdCBpbnB1dHMgYW5kIG91dHB1dHMuXG4gIGNvbnN0IHByb3BNZXRhZGF0YSA9IGdldFJlZmxlY3QoKS5vd25Qcm9wTWV0YWRhdGEodHlwZSk7XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiB0eXBlLm5hbWUsXG4gICAgdHlwZTogdHlwZSxcbiAgICB0eXBlQXJndW1lbnRDb3VudDogMCxcbiAgICBzZWxlY3RvcjogbWV0YWRhdGEuc2VsZWN0b3IgISxcbiAgICBkZXBzOiByZWZsZWN0RGVwZW5kZW5jaWVzKHR5cGUpLFxuICAgIGhvc3Q6IG1ldGFkYXRhLmhvc3QgfHwgRU1QVFlfT0JKLFxuICAgIHByb3BNZXRhZGF0YTogcHJvcE1ldGFkYXRhLFxuICAgIGlucHV0czogbWV0YWRhdGEuaW5wdXRzIHx8IEVNUFRZX0FSUkFZLFxuICAgIG91dHB1dHM6IG1ldGFkYXRhLm91dHB1dHMgfHwgRU1QVFlfQVJSQVksXG4gICAgcXVlcmllczogZXh0cmFjdFF1ZXJpZXNNZXRhZGF0YSh0eXBlLCBwcm9wTWV0YWRhdGEsIGlzQ29udGVudFF1ZXJ5KSxcbiAgICBsaWZlY3ljbGU6IHt1c2VzT25DaGFuZ2VzOiB0eXBlLnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSgnbmdPbkNoYW5nZXMnKX0sXG4gICAgdHlwZVNvdXJjZVNwYW46IG51bGwgISxcbiAgICB1c2VzSW5oZXJpdGFuY2U6ICFleHRlbmRzRGlyZWN0bHlGcm9tT2JqZWN0KHR5cGUpLFxuICAgIGV4cG9ydEFzOiBleHRyYWN0RXhwb3J0QXMobWV0YWRhdGEuZXhwb3J0QXMpLFxuICAgIHByb3ZpZGVyczogbWV0YWRhdGEucHJvdmlkZXJzIHx8IG51bGwsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRUb1IzUXVlcnlQcmVkaWNhdGUoc2VsZWN0b3I6IGFueSk6IGFueXxzdHJpbmdbXSB7XG4gIHJldHVybiB0eXBlb2Ygc2VsZWN0b3IgPT09ICdzdHJpbmcnID8gc3BsaXRCeUNvbW1hKHNlbGVjdG9yKSA6IHJlc29sdmVGb3J3YXJkUmVmKHNlbGVjdG9yKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRUb1IzUXVlcnlNZXRhZGF0YShwcm9wZXJ0eU5hbWU6IHN0cmluZywgYW5uOiBRdWVyeSk6IFIzUXVlcnlNZXRhZGF0YUZhY2FkZSB7XG4gIHJldHVybiB7XG4gICAgcHJvcGVydHlOYW1lOiBwcm9wZXJ0eU5hbWUsXG4gICAgcHJlZGljYXRlOiBjb252ZXJ0VG9SM1F1ZXJ5UHJlZGljYXRlKGFubi5zZWxlY3RvciksXG4gICAgZGVzY2VuZGFudHM6IGFubi5kZXNjZW5kYW50cyxcbiAgICBmaXJzdDogYW5uLmZpcnN0LFxuICAgIHJlYWQ6IGFubi5yZWFkID8gYW5uLnJlYWQgOiBudWxsLFxuICAgIHN0YXRpYzogISFhbm4uc3RhdGljXG4gIH07XG59XG5mdW5jdGlvbiBleHRyYWN0UXVlcmllc01ldGFkYXRhKFxuICAgIHR5cGU6IFR5cGU8YW55PiwgcHJvcE1ldGFkYXRhOiB7W2tleTogc3RyaW5nXTogYW55W119LFxuICAgIGlzUXVlcnlBbm46IChhbm46IGFueSkgPT4gYW5uIGlzIFF1ZXJ5KTogUjNRdWVyeU1ldGFkYXRhRmFjYWRlW10ge1xuICBjb25zdCBxdWVyaWVzTWV0YTogUjNRdWVyeU1ldGFkYXRhRmFjYWRlW10gPSBbXTtcbiAgZm9yIChjb25zdCBmaWVsZCBpbiBwcm9wTWV0YWRhdGEpIHtcbiAgICBpZiAocHJvcE1ldGFkYXRhLmhhc093blByb3BlcnR5KGZpZWxkKSkge1xuICAgICAgY29uc3QgYW5ub3RhdGlvbnMgPSBwcm9wTWV0YWRhdGFbZmllbGRdO1xuICAgICAgYW5ub3RhdGlvbnMuZm9yRWFjaChhbm4gPT4ge1xuICAgICAgICBpZiAoaXNRdWVyeUFubihhbm4pKSB7XG4gICAgICAgICAgaWYgKCFhbm4uc2VsZWN0b3IpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBgQ2FuJ3QgY29uc3RydWN0IGEgcXVlcnkgZm9yIHRoZSBwcm9wZXJ0eSBcIiR7ZmllbGR9XCIgb2YgYCArXG4gICAgICAgICAgICAgICAgYFwiJHtyZW5kZXJTdHJpbmdpZnkodHlwZSl9XCIgc2luY2UgdGhlIHF1ZXJ5IHNlbGVjdG9yIHdhc24ndCBkZWZpbmVkLmApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoYW5ub3RhdGlvbnMuc29tZShpc0lucHV0QW5uKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgY29tYmluZSBASW5wdXQgZGVjb3JhdG9ycyB3aXRoIHF1ZXJ5IGRlY29yYXRvcnNgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcXVlcmllc01ldGEucHVzaChjb252ZXJ0VG9SM1F1ZXJ5TWV0YWRhdGEoZmllbGQsIGFubikpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHF1ZXJpZXNNZXRhO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0RXhwb3J0QXMoZXhwb3J0QXM6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZ1tdfG51bGwge1xuICBpZiAoZXhwb3J0QXMgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIGV4cG9ydEFzLnNwbGl0KCcsJykubWFwKHBhcnQgPT4gcGFydC50cmltKCkpO1xufVxuXG5mdW5jdGlvbiBpc0NvbnRlbnRRdWVyeSh2YWx1ZTogYW55KTogdmFsdWUgaXMgUXVlcnkge1xuICBjb25zdCBuYW1lID0gdmFsdWUubmdNZXRhZGF0YU5hbWU7XG4gIHJldHVybiBuYW1lID09PSAnQ29udGVudENoaWxkJyB8fCBuYW1lID09PSAnQ29udGVudENoaWxkcmVuJztcbn1cblxuZnVuY3Rpb24gaXNWaWV3UXVlcnkodmFsdWU6IGFueSk6IHZhbHVlIGlzIFF1ZXJ5IHtcbiAgY29uc3QgbmFtZSA9IHZhbHVlLm5nTWV0YWRhdGFOYW1lO1xuICByZXR1cm4gbmFtZSA9PT0gJ1ZpZXdDaGlsZCcgfHwgbmFtZSA9PT0gJ1ZpZXdDaGlsZHJlbic7XG59XG5cbmZ1bmN0aW9uIGlzSW5wdXRBbm4odmFsdWU6IGFueSk6IHZhbHVlIGlzIElucHV0IHtcbiAgcmV0dXJuIHZhbHVlLm5nTWV0YWRhdGFOYW1lID09PSAnSW5wdXQnO1xufVxuXG5mdW5jdGlvbiBzcGxpdEJ5Q29tbWEodmFsdWU6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgcmV0dXJuIHZhbHVlLnNwbGl0KCcsJykubWFwKHBpZWNlID0+IHBpZWNlLnRyaW0oKSk7XG59XG4iXX0=