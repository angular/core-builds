/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/jit/directive.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
import { initNgDevMode } from '../../util/ng_dev_mode';
import { getComponentDef, getDirectiveDef } from '../definition';
import { EMPTY_ARRAY, EMPTY_OBJ } from '../empty';
import { NG_COMP_DEF, NG_DIR_DEF, NG_FACTORY_DEF } from '../fields';
import { stringifyForError } from '../util/misc_utils';
import { angularCoreEnv } from './environment';
import { getJitOptions } from './jit_options';
import { flushModuleScopingQueueAsMuchAsPossible, patchComponentDefWithScope, transitiveScopesFor } from './module';
/**
 * Compile an Angular component according to its decorator metadata, and patch the resulting
 * component def (ɵcmp) onto the component type.
 *
 * Compilation may be asynchronous (due to the need to resolve URLs for the component template or
 * other resources, for example). In the event that compilation is not immediate, `compileComponent`
 * will enqueue resource resolution into a global queue and will fail to return the `ɵcmp`
 * until the global queue has been resolved with a call to `resolveComponentResources`.
 * @param {?} type
 * @param {?} metadata
 * @return {?}
 */
export function compileComponent(type, metadata) {
    // Initialize ngDevMode. This must be the first statement in compileComponent.
    // See the `initNgDevMode` docstring for more information.
    (typeof ngDevMode === 'undefined' || ngDevMode) && initNgDevMode();
    /** @type {?} */
    let ngComponentDef = null;
    // Metadata may have resources which need to be resolved.
    maybeQueueResolutionOfComponentResources(type, metadata);
    // Note that we're using the same function as `Directive`, because that's only subset of metadata
    // that we need to create the ngFactoryDef. We're avoiding using the component metadata
    // because we'd have to resolve the asynchronous templates.
    addDirectiveFactoryDef(type, metadata);
    Object.defineProperty(type, NG_COMP_DEF, {
        get: (/**
         * @return {?}
         */
        () => {
            if (ngComponentDef === null) {
                /** @type {?} */
                const compiler = getCompilerFacade();
                if (componentNeedsResolution(metadata)) {
                    /** @type {?} */
                    const error = [`Component '${type.name}' is not resolved:`];
                    if (metadata.templateUrl) {
                        error.push(` - templateUrl: ${metadata.templateUrl}`);
                    }
                    if (metadata.styleUrls && metadata.styleUrls.length) {
                        error.push(` - styleUrls: ${JSON.stringify(metadata.styleUrls)}`);
                    }
                    error.push(`Did you run and wait for 'resolveComponentResources()'?`);
                    throw new Error(error.join('\n'));
                }
                // This const was called `jitOptions` previously but had to be renamed to `options` because
                // of a bug with Terser that caused optimized JIT builds to throw a `ReferenceError`.
                // This bug was investigated in https://github.com/angular/angular-cli/issues/17264.
                // We should not rename it back until https://github.com/terser/terser/issues/615 is fixed.
                /** @type {?} */
                const options = getJitOptions();
                /** @type {?} */
                let preserveWhitespaces = metadata.preserveWhitespaces;
                if (preserveWhitespaces === undefined) {
                    if (options !== null && options.preserveWhitespaces !== undefined) {
                        preserveWhitespaces = options.preserveWhitespaces;
                    }
                    else {
                        preserveWhitespaces = false;
                    }
                }
                /** @type {?} */
                let encapsulation = metadata.encapsulation;
                if (encapsulation === undefined) {
                    if (options !== null && options.defaultEncapsulation !== undefined) {
                        encapsulation = options.defaultEncapsulation;
                    }
                    else {
                        encapsulation = ViewEncapsulation.Emulated;
                    }
                }
                /** @type {?} */
                const templateUrl = metadata.templateUrl || `ng:///${type.name}/template.html`;
                /** @type {?} */
                const meta = Object.assign(Object.assign({}, directiveMetadata(type, metadata)), { typeSourceSpan: compiler.createParseSourceSpan('Component', type.name, templateUrl), template: metadata.template || '', preserveWhitespaces, styles: metadata.styles || EMPTY_ARRAY, animations: metadata.animations, directives: [], changeDetection: metadata.changeDetection, pipes: new Map(), encapsulation, interpolation: metadata.interpolation, viewProviders: metadata.viewProviders || null });
                if (meta.usesInheritance) {
                    addDirectiveDefToUndecoratedParents(type);
                }
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
 * directive def onto the component type.
 *
 * In the event that compilation is not immediate, `compileDirective` will return a `Promise` which
 * will resolve when compilation completes and the directive becomes usable.
 * @param {?} type
 * @param {?} directive
 * @return {?}
 */
export function compileDirective(type, directive) {
    /** @type {?} */
    let ngDirectiveDef = null;
    addDirectiveFactoryDef(type, directive || {});
    Object.defineProperty(type, NG_DIR_DEF, {
        get: (/**
         * @return {?}
         */
        () => {
            if (ngDirectiveDef === null) {
                // `directive` can be null in the case of abstract directives as a base class
                // that use `@Directive()` with no selector. In that case, pass empty object to the
                // `directiveMetadata` function instead of null.
                /** @type {?} */
                const meta = getDirectiveMetadata(type, directive || {});
                ngDirectiveDef =
                    getCompilerFacade().compileDirective(angularCoreEnv, meta.sourceMapUrl, meta.metadata);
            }
            return ngDirectiveDef;
        }),
        // Make the property configurable in dev mode to allow overriding in tests
        configurable: !!ngDevMode,
    });
}
/**
 * @param {?} type
 * @param {?} metadata
 * @return {?}
 */
function getDirectiveMetadata(type, metadata) {
    /** @type {?} */
    const name = type && type.name;
    /** @type {?} */
    const sourceMapUrl = `ng:///${name}/ɵdir.js`;
    /** @type {?} */
    const compiler = getCompilerFacade();
    /** @type {?} */
    const facade = directiveMetadata((/** @type {?} */ (type)), metadata);
    facade.typeSourceSpan = compiler.createParseSourceSpan('Directive', name, sourceMapUrl);
    if (facade.usesInheritance) {
        addDirectiveDefToUndecoratedParents(type);
    }
    return { metadata: facade, sourceMapUrl };
}
/**
 * @param {?} type
 * @param {?} metadata
 * @return {?}
 */
function addDirectiveFactoryDef(type, metadata) {
    /** @type {?} */
    let ngFactoryDef = null;
    Object.defineProperty(type, NG_FACTORY_DEF, {
        get: (/**
         * @return {?}
         */
        () => {
            if (ngFactoryDef === null) {
                /** @type {?} */
                const meta = getDirectiveMetadata(type, metadata);
                /** @type {?} */
                const compiler = getCompilerFacade();
                ngFactoryDef = compiler.compileFactory(angularCoreEnv, `ng:///${type.name}/ɵfac.js`, Object.assign(Object.assign({}, meta.metadata), { injectFn: 'directiveInject', target: compiler.R3FactoryTarget.Directive }));
            }
            return ngFactoryDef;
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
    const reflect = getReflect();
    /** @type {?} */
    const propMetadata = reflect.ownPropMetadata(type);
    return {
        name: type.name,
        type: type,
        typeArgumentCount: 0,
        selector: metadata.selector !== undefined ? metadata.selector : null,
        deps: reflectDependencies(type),
        host: metadata.host || EMPTY_OBJ,
        propMetadata: propMetadata,
        inputs: metadata.inputs || EMPTY_ARRAY,
        outputs: metadata.outputs || EMPTY_ARRAY,
        queries: extractQueriesMetadata(type, propMetadata, isContentQuery),
        lifecycle: { usesOnChanges: reflect.hasLifecycleHook(type, 'ngOnChanges') },
        typeSourceSpan: (/** @type {?} */ (null)),
        usesInheritance: !extendsDirectlyFromObject(type),
        exportAs: extractExportAs(metadata.exportAs),
        providers: metadata.providers || null,
        viewQueries: extractQueriesMetadata(type, propMetadata, isViewQuery)
    };
}
/**
 * Adds a directive definition to all parent classes of a type that don't have an Angular decorator.
 * @param {?} type
 * @return {?}
 */
function addDirectiveDefToUndecoratedParents(type) {
    /** @type {?} */
    const objPrototype = Object.prototype;
    /** @type {?} */
    let parent = Object.getPrototypeOf(type.prototype).constructor;
    // Go up the prototype until we hit `Object`.
    while (parent && parent !== objPrototype) {
        // Since inheritance works if the class was annotated already, we only need to add
        // the def if there are no annotations and the def hasn't been created already.
        if (!getDirectiveDef(parent) && !getComponentDef(parent) &&
            shouldAddAbstractDirective(parent)) {
            compileDirective(parent, null);
        }
        parent = Object.getPrototypeOf(parent);
    }
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
                            `"${stringifyForError(type)}" since the query selector wasn't defined.`);
                    }
                    if (annotations.some(isInputAnnotation)) {
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
    return exportAs === undefined ? null : splitByComma(exportAs);
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
function isInputAnnotation(value) {
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
/** @type {?} */
const LIFECYCLE_HOOKS = [
    'ngOnChanges', 'ngOnInit', 'ngOnDestroy', 'ngDoCheck', 'ngAfterViewInit', 'ngAfterViewChecked',
    'ngAfterContentInit', 'ngAfterContentChecked'
];
/**
 * @param {?} type
 * @return {?}
 */
function shouldAddAbstractDirective(type) {
    /** @type {?} */
    const reflect = getReflect();
    if (LIFECYCLE_HOOKS.some((/**
     * @param {?} hookName
     * @return {?}
     */
    hookName => reflect.hasLifecycleHook(type, hookName)))) {
        return true;
    }
    /** @type {?} */
    const propMetadata = reflect.propMetadata(type);
    for (const field in propMetadata) {
        /** @type {?} */
        const annotations = propMetadata[field];
        for (let i = 0; i < annotations.length; i++) {
            /** @type {?} */
            const current = annotations[i];
            /** @type {?} */
            const metadataName = current.ngMetadataName;
            if (isInputAnnotation(current) || isContentQuery(current) || isViewQuery(current) ||
                metadataName === 'Output' || metadataName === 'HostBinding' ||
                metadataName === 'HostListener') {
                return true;
            }
        }
    }
    return false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBNEIsaUJBQWlCLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUU1RixPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUN2RCxPQUFPLEVBQUMsVUFBVSxFQUFFLG1CQUFtQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFJbEUsT0FBTyxFQUFDLHdCQUF3QixFQUFFLHdDQUF3QyxFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDbkgsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEQsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3JELE9BQU8sRUFBQyxlQUFlLEVBQUUsZUFBZSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQy9ELE9BQU8sRUFBQyxXQUFXLEVBQUUsU0FBUyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2hELE9BQU8sRUFBQyxXQUFXLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUVsRSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUVyRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDNUMsT0FBTyxFQUFDLHVDQUF1QyxFQUFFLDBCQUEwQixFQUFFLG1CQUFtQixFQUFDLE1BQU0sVUFBVSxDQUFDOzs7Ozs7Ozs7Ozs7O0FBYWxILE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxJQUFlLEVBQUUsUUFBbUI7SUFDbkUsOEVBQThFO0lBQzlFLDBEQUEwRDtJQUMx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SUFFNUIsSUFBSSxlQUFlLENBQUMsSUFBSTs7OztJQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsRUFBQyxFQUFFO1FBQzlFLE9BQU8sSUFBSSxDQUFDO0tBQ2I7O1VBRUssWUFBWSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDO0lBRS9DLEtBQUssTUFBTSxLQUFLLElBQUksWUFBWSxFQUFFOztjQUMxQixXQUFXLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQztRQUV2QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTs7a0JBQ3JDLE9BQU8sR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDOztrQkFDeEIsWUFBWSxHQUFHLE9BQU8sQ0FBQyxjQUFjO1lBRTNDLElBQUksaUJBQWlCLENBQUMsT0FBTyxDQUFDLElBQUksY0FBYyxDQUFDLE9BQU8sQ0FBQyxJQUFJLFdBQVcsQ0FBQyxPQUFPLENBQUM7Z0JBQzdFLFlBQVksS0FBSyxRQUFRLElBQUksWUFBWSxLQUFLLGFBQWE7Z0JBQzNELFlBQVksS0FBSyxjQUFjLEVBQUU7Z0JBQ25DLE9BQU8sSUFBSSxDQUFDO2FBQ2I7U0FDRjtLQUNGO0lBRUQsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1IzRGlyZWN0aXZlTWV0YWRhdGFGYWNhZGUsIGdldENvbXBpbGVyRmFjYWRlfSBmcm9tICcuLi8uLi9jb21waWxlci9jb21waWxlcl9mYWNhZGUnO1xuaW1wb3J0IHtSM0NvbXBvbmVudE1ldGFkYXRhRmFjYWRlLCBSM1F1ZXJ5TWV0YWRhdGFGYWNhZGV9IGZyb20gJy4uLy4uL2NvbXBpbGVyL2NvbXBpbGVyX2ZhY2FkZV9pbnRlcmZhY2UnO1xuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi4vLi4vZGkvZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtnZXRSZWZsZWN0LCByZWZsZWN0RGVwZW5kZW5jaWVzfSBmcm9tICcuLi8uLi9kaS9qaXQvdXRpbCc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7UXVlcnl9IGZyb20gJy4uLy4uL21ldGFkYXRhL2RpJztcbmltcG9ydCB7Q29tcG9uZW50LCBEaXJlY3RpdmUsIElucHV0fSBmcm9tICcuLi8uLi9tZXRhZGF0YS9kaXJlY3RpdmVzJztcbmltcG9ydCB7Y29tcG9uZW50TmVlZHNSZXNvbHV0aW9uLCBtYXliZVF1ZXVlUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9yZXNvdXJjZV9sb2FkaW5nJztcbmltcG9ydCB7Vmlld0VuY2Fwc3VsYXRpb259IGZyb20gJy4uLy4uL21ldGFkYXRhL3ZpZXcnO1xuaW1wb3J0IHtpbml0TmdEZXZNb2RlfSBmcm9tICcuLi8uLi91dGlsL25nX2Rldl9tb2RlJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmLCBnZXREaXJlY3RpdmVEZWZ9IGZyb20gJy4uL2RlZmluaXRpb24nO1xuaW1wb3J0IHtFTVBUWV9BUlJBWSwgRU1QVFlfT0JKfSBmcm9tICcuLi9lbXB0eSc7XG5pbXBvcnQge05HX0NPTVBfREVGLCBOR19ESVJfREVGLCBOR19GQUNUT1JZX0RFRn0gZnJvbSAnLi4vZmllbGRzJztcbmltcG9ydCB7Q29tcG9uZW50VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7c3RyaW5naWZ5Rm9yRXJyb3J9IGZyb20gJy4uL3V0aWwvbWlzY191dGlscyc7XG5cbmltcG9ydCB7YW5ndWxhckNvcmVFbnZ9IGZyb20gJy4vZW52aXJvbm1lbnQnO1xuaW1wb3J0IHtnZXRKaXRPcHRpb25zfSBmcm9tICcuL2ppdF9vcHRpb25zJztcbmltcG9ydCB7Zmx1c2hNb2R1bGVTY29waW5nUXVldWVBc011Y2hBc1Bvc3NpYmxlLCBwYXRjaENvbXBvbmVudERlZldpdGhTY29wZSwgdHJhbnNpdGl2ZVNjb3Blc0Zvcn0gZnJvbSAnLi9tb2R1bGUnO1xuXG5cblxuLyoqXG4gKiBDb21waWxlIGFuIEFuZ3VsYXIgY29tcG9uZW50IGFjY29yZGluZyB0byBpdHMgZGVjb3JhdG9yIG1ldGFkYXRhLCBhbmQgcGF0Y2ggdGhlIHJlc3VsdGluZ1xuICogY29tcG9uZW50IGRlZiAoybVjbXApIG9udG8gdGhlIGNvbXBvbmVudCB0eXBlLlxuICpcbiAqIENvbXBpbGF0aW9uIG1heSBiZSBhc3luY2hyb25vdXMgKGR1ZSB0byB0aGUgbmVlZCB0byByZXNvbHZlIFVSTHMgZm9yIHRoZSBjb21wb25lbnQgdGVtcGxhdGUgb3JcbiAqIG90aGVyIHJlc291cmNlcywgZm9yIGV4YW1wbGUpLiBJbiB0aGUgZXZlbnQgdGhhdCBjb21waWxhdGlvbiBpcyBub3QgaW1tZWRpYXRlLCBgY29tcGlsZUNvbXBvbmVudGBcbiAqIHdpbGwgZW5xdWV1ZSByZXNvdXJjZSByZXNvbHV0aW9uIGludG8gYSBnbG9iYWwgcXVldWUgYW5kIHdpbGwgZmFpbCB0byByZXR1cm4gdGhlIGDJtWNtcGBcbiAqIHVudGlsIHRoZSBnbG9iYWwgcXVldWUgaGFzIGJlZW4gcmVzb2x2ZWQgd2l0aCBhIGNhbGwgdG8gYHJlc29sdmVDb21wb25lbnRSZXNvdXJjZXNgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZUNvbXBvbmVudCh0eXBlOiBUeXBlPGFueT4sIG1ldGFkYXRhOiBDb21wb25lbnQpOiB2b2lkIHtcbiAgLy8gSW5pdGlhbGl6ZSBuZ0Rldk1vZGUuIFRoaXMgbXVzdCBiZSB0aGUgZmlyc3Qgc3RhdGVtZW50IGluIGNvbXBpbGVDb21wb25lbnQuXG4gIC8vIFNlZSB0aGUgYGluaXROZ0Rldk1vZGVgIGRvY3N0cmluZyBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgaW5pdE5nRGV2TW9kZSgpO1xuXG4gIGxldCBuZ0NvbXBvbmVudERlZjogYW55ID0gbnVsbDtcblxuICAvLyBNZXRhZGF0YSBtYXkgaGF2ZSByZXNvdXJjZXMgd2hpY2ggbmVlZCB0byBiZSByZXNvbHZlZC5cbiAgbWF5YmVRdWV1ZVJlc29sdXRpb25PZkNvbXBvbmVudFJlc291cmNlcyh0eXBlLCBtZXRhZGF0YSk7XG5cbiAgLy8gTm90ZSB0aGF0IHdlJ3JlIHVzaW5nIHRoZSBzYW1lIGZ1bmN0aW9uIGFzIGBEaXJlY3RpdmVgLCBiZWNhdXNlIHRoYXQncyBvbmx5IHN1YnNldCBvZiBtZXRhZGF0YVxuICAvLyB0aGF0IHdlIG5lZWQgdG8gY3JlYXRlIHRoZSBuZ0ZhY3RvcnlEZWYuIFdlJ3JlIGF2b2lkaW5nIHVzaW5nIHRoZSBjb21wb25lbnQgbWV0YWRhdGFcbiAgLy8gYmVjYXVzZSB3ZSdkIGhhdmUgdG8gcmVzb2x2ZSB0aGUgYXN5bmNocm9ub3VzIHRlbXBsYXRlcy5cbiAgYWRkRGlyZWN0aXZlRmFjdG9yeURlZih0eXBlLCBtZXRhZGF0YSk7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIE5HX0NPTVBfREVGLCB7XG4gICAgZ2V0OiAoKSA9PiB7XG4gICAgICBpZiAobmdDb21wb25lbnREZWYgPT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgY29tcGlsZXIgPSBnZXRDb21waWxlckZhY2FkZSgpO1xuXG4gICAgICAgIGlmIChjb21wb25lbnROZWVkc1Jlc29sdXRpb24obWV0YWRhdGEpKSB7XG4gICAgICAgICAgY29uc3QgZXJyb3IgPSBbYENvbXBvbmVudCAnJHt0eXBlLm5hbWV9JyBpcyBub3QgcmVzb2x2ZWQ6YF07XG4gICAgICAgICAgaWYgKG1ldGFkYXRhLnRlbXBsYXRlVXJsKSB7XG4gICAgICAgICAgICBlcnJvci5wdXNoKGAgLSB0ZW1wbGF0ZVVybDogJHttZXRhZGF0YS50ZW1wbGF0ZVVybH1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG1ldGFkYXRhLnN0eWxlVXJscyAmJiBtZXRhZGF0YS5zdHlsZVVybHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBlcnJvci5wdXNoKGAgLSBzdHlsZVVybHM6ICR7SlNPTi5zdHJpbmdpZnkobWV0YWRhdGEuc3R5bGVVcmxzKX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZXJyb3IucHVzaChgRGlkIHlvdSBydW4gYW5kIHdhaXQgZm9yICdyZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzKCknP2ApO1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvci5qb2luKCdcXG4nKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGlzIGNvbnN0IHdhcyBjYWxsZWQgYGppdE9wdGlvbnNgIHByZXZpb3VzbHkgYnV0IGhhZCB0byBiZSByZW5hbWVkIHRvIGBvcHRpb25zYCBiZWNhdXNlXG4gICAgICAgIC8vIG9mIGEgYnVnIHdpdGggVGVyc2VyIHRoYXQgY2F1c2VkIG9wdGltaXplZCBKSVQgYnVpbGRzIHRvIHRocm93IGEgYFJlZmVyZW5jZUVycm9yYC5cbiAgICAgICAgLy8gVGhpcyBidWcgd2FzIGludmVzdGlnYXRlZCBpbiBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyLWNsaS9pc3N1ZXMvMTcyNjQuXG4gICAgICAgIC8vIFdlIHNob3VsZCBub3QgcmVuYW1lIGl0IGJhY2sgdW50aWwgaHR0cHM6Ly9naXRodWIuY29tL3RlcnNlci90ZXJzZXIvaXNzdWVzLzYxNSBpcyBmaXhlZC5cbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGdldEppdE9wdGlvbnMoKTtcbiAgICAgICAgbGV0IHByZXNlcnZlV2hpdGVzcGFjZXMgPSBtZXRhZGF0YS5wcmVzZXJ2ZVdoaXRlc3BhY2VzO1xuICAgICAgICBpZiAocHJlc2VydmVXaGl0ZXNwYWNlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgaWYgKG9wdGlvbnMgIT09IG51bGwgJiYgb3B0aW9ucy5wcmVzZXJ2ZVdoaXRlc3BhY2VzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHByZXNlcnZlV2hpdGVzcGFjZXMgPSBvcHRpb25zLnByZXNlcnZlV2hpdGVzcGFjZXM7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByZXNlcnZlV2hpdGVzcGFjZXMgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGVuY2Fwc3VsYXRpb24gPSBtZXRhZGF0YS5lbmNhcHN1bGF0aW9uO1xuICAgICAgICBpZiAoZW5jYXBzdWxhdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgaWYgKG9wdGlvbnMgIT09IG51bGwgJiYgb3B0aW9ucy5kZWZhdWx0RW5jYXBzdWxhdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBlbmNhcHN1bGF0aW9uID0gb3B0aW9ucy5kZWZhdWx0RW5jYXBzdWxhdGlvbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZW5jYXBzdWxhdGlvbiA9IFZpZXdFbmNhcHN1bGF0aW9uLkVtdWxhdGVkO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlVXJsID0gbWV0YWRhdGEudGVtcGxhdGVVcmwgfHwgYG5nOi8vLyR7dHlwZS5uYW1lfS90ZW1wbGF0ZS5odG1sYDtcbiAgICAgICAgY29uc3QgbWV0YTogUjNDb21wb25lbnRNZXRhZGF0YUZhY2FkZSA9IHtcbiAgICAgICAgICAuLi5kaXJlY3RpdmVNZXRhZGF0YSh0eXBlLCBtZXRhZGF0YSksXG4gICAgICAgICAgdHlwZVNvdXJjZVNwYW46IGNvbXBpbGVyLmNyZWF0ZVBhcnNlU291cmNlU3BhbignQ29tcG9uZW50JywgdHlwZS5uYW1lLCB0ZW1wbGF0ZVVybCksXG4gICAgICAgICAgdGVtcGxhdGU6IG1ldGFkYXRhLnRlbXBsYXRlIHx8ICcnLCBwcmVzZXJ2ZVdoaXRlc3BhY2VzLFxuICAgICAgICAgIHN0eWxlczogbWV0YWRhdGEuc3R5bGVzIHx8IEVNUFRZX0FSUkFZLFxuICAgICAgICAgIGFuaW1hdGlvbnM6IG1ldGFkYXRhLmFuaW1hdGlvbnMsXG4gICAgICAgICAgZGlyZWN0aXZlczogW10sXG4gICAgICAgICAgY2hhbmdlRGV0ZWN0aW9uOiBtZXRhZGF0YS5jaGFuZ2VEZXRlY3Rpb24sXG4gICAgICAgICAgcGlwZXM6IG5ldyBNYXAoKSwgZW5jYXBzdWxhdGlvbixcbiAgICAgICAgICBpbnRlcnBvbGF0aW9uOiBtZXRhZGF0YS5pbnRlcnBvbGF0aW9uLFxuICAgICAgICAgIHZpZXdQcm92aWRlcnM6IG1ldGFkYXRhLnZpZXdQcm92aWRlcnMgfHwgbnVsbCxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKG1ldGEudXNlc0luaGVyaXRhbmNlKSB7XG4gICAgICAgICAgYWRkRGlyZWN0aXZlRGVmVG9VbmRlY29yYXRlZFBhcmVudHModHlwZSk7XG4gICAgICAgIH1cblxuICAgICAgICBuZ0NvbXBvbmVudERlZiA9IGNvbXBpbGVyLmNvbXBpbGVDb21wb25lbnQoYW5ndWxhckNvcmVFbnYsIHRlbXBsYXRlVXJsLCBtZXRhKTtcblxuICAgICAgICAvLyBXaGVuIE5nTW9kdWxlIGRlY29yYXRvciBleGVjdXRlZCwgd2UgZW5xdWV1ZWQgdGhlIG1vZHVsZSBkZWZpbml0aW9uIHN1Y2ggdGhhdFxuICAgICAgICAvLyBpdCB3b3VsZCBvbmx5IGRlcXVldWUgYW5kIGFkZCBpdHNlbGYgYXMgbW9kdWxlIHNjb3BlIHRvIGFsbCBvZiBpdHMgZGVjbGFyYXRpb25zLFxuICAgICAgICAvLyBidXQgb25seSBpZiAgaWYgYWxsIG9mIGl0cyBkZWNsYXJhdGlvbnMgaGFkIHJlc29sdmVkLiBUaGlzIGNhbGwgcnVucyB0aGUgY2hlY2tcbiAgICAgICAgLy8gdG8gc2VlIGlmIGFueSBtb2R1bGVzIHRoYXQgYXJlIGluIHRoZSBxdWV1ZSBjYW4gYmUgZGVxdWV1ZWQgYW5kIGFkZCBzY29wZSB0b1xuICAgICAgICAvLyB0aGVpciBkZWNsYXJhdGlvbnMuXG4gICAgICAgIGZsdXNoTW9kdWxlU2NvcGluZ1F1ZXVlQXNNdWNoQXNQb3NzaWJsZSgpO1xuXG4gICAgICAgIC8vIElmIGNvbXBvbmVudCBjb21waWxhdGlvbiBpcyBhc3luYywgdGhlbiB0aGUgQE5nTW9kdWxlIGFubm90YXRpb24gd2hpY2ggZGVjbGFyZXMgdGhlXG4gICAgICAgIC8vIGNvbXBvbmVudCBtYXkgZXhlY3V0ZSBhbmQgc2V0IGFuIG5nU2VsZWN0b3JTY29wZSBwcm9wZXJ0eSBvbiB0aGUgY29tcG9uZW50IHR5cGUuIFRoaXNcbiAgICAgICAgLy8gYWxsb3dzIHRoZSBjb21wb25lbnQgdG8gcGF0Y2ggaXRzZWxmIHdpdGggZGlyZWN0aXZlRGVmcyBmcm9tIHRoZSBtb2R1bGUgYWZ0ZXIgaXRcbiAgICAgICAgLy8gZmluaXNoZXMgY29tcGlsaW5nLlxuICAgICAgICBpZiAoaGFzU2VsZWN0b3JTY29wZSh0eXBlKSkge1xuICAgICAgICAgIGNvbnN0IHNjb3BlcyA9IHRyYW5zaXRpdmVTY29wZXNGb3IodHlwZS5uZ1NlbGVjdG9yU2NvcGUpO1xuICAgICAgICAgIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlKG5nQ29tcG9uZW50RGVmLCBzY29wZXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbmdDb21wb25lbnREZWY7XG4gICAgfSxcbiAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGUsXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBoYXNTZWxlY3RvclNjb3BlPFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IGNvbXBvbmVudCBpcyBUeXBlPFQ+JlxuICAgIHtuZ1NlbGVjdG9yU2NvcGU6IFR5cGU8YW55Pn0ge1xuICByZXR1cm4gKGNvbXBvbmVudCBhc3tuZ1NlbGVjdG9yU2NvcGU/OiBhbnl9KS5uZ1NlbGVjdG9yU2NvcGUgIT09IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBDb21waWxlIGFuIEFuZ3VsYXIgZGlyZWN0aXZlIGFjY29yZGluZyB0byBpdHMgZGVjb3JhdG9yIG1ldGFkYXRhLCBhbmQgcGF0Y2ggdGhlIHJlc3VsdGluZ1xuICogZGlyZWN0aXZlIGRlZiBvbnRvIHRoZSBjb21wb25lbnQgdHlwZS5cbiAqXG4gKiBJbiB0aGUgZXZlbnQgdGhhdCBjb21waWxhdGlvbiBpcyBub3QgaW1tZWRpYXRlLCBgY29tcGlsZURpcmVjdGl2ZWAgd2lsbCByZXR1cm4gYSBgUHJvbWlzZWAgd2hpY2hcbiAqIHdpbGwgcmVzb2x2ZSB3aGVuIGNvbXBpbGF0aW9uIGNvbXBsZXRlcyBhbmQgdGhlIGRpcmVjdGl2ZSBiZWNvbWVzIHVzYWJsZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVEaXJlY3RpdmUodHlwZTogVHlwZTxhbnk+LCBkaXJlY3RpdmU6IERpcmVjdGl2ZSB8IG51bGwpOiB2b2lkIHtcbiAgbGV0IG5nRGlyZWN0aXZlRGVmOiBhbnkgPSBudWxsO1xuXG4gIGFkZERpcmVjdGl2ZUZhY3RvcnlEZWYodHlwZSwgZGlyZWN0aXZlIHx8IHt9KTtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgTkdfRElSX0RFRiwge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKG5nRGlyZWN0aXZlRGVmID09PSBudWxsKSB7XG4gICAgICAgIC8vIGBkaXJlY3RpdmVgIGNhbiBiZSBudWxsIGluIHRoZSBjYXNlIG9mIGFic3RyYWN0IGRpcmVjdGl2ZXMgYXMgYSBiYXNlIGNsYXNzXG4gICAgICAgIC8vIHRoYXQgdXNlIGBARGlyZWN0aXZlKClgIHdpdGggbm8gc2VsZWN0b3IuIEluIHRoYXQgY2FzZSwgcGFzcyBlbXB0eSBvYmplY3QgdG8gdGhlXG4gICAgICAgIC8vIGBkaXJlY3RpdmVNZXRhZGF0YWAgZnVuY3Rpb24gaW5zdGVhZCBvZiBudWxsLlxuICAgICAgICBjb25zdCBtZXRhID0gZ2V0RGlyZWN0aXZlTWV0YWRhdGEodHlwZSwgZGlyZWN0aXZlIHx8IHt9KTtcbiAgICAgICAgbmdEaXJlY3RpdmVEZWYgPVxuICAgICAgICAgICAgZ2V0Q29tcGlsZXJGYWNhZGUoKS5jb21waWxlRGlyZWN0aXZlKGFuZ3VsYXJDb3JlRW52LCBtZXRhLnNvdXJjZU1hcFVybCwgbWV0YS5tZXRhZGF0YSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmdEaXJlY3RpdmVEZWY7XG4gICAgfSxcbiAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGUsXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXREaXJlY3RpdmVNZXRhZGF0YSh0eXBlOiBUeXBlPGFueT4sIG1ldGFkYXRhOiBEaXJlY3RpdmUpIHtcbiAgY29uc3QgbmFtZSA9IHR5cGUgJiYgdHlwZS5uYW1lO1xuICBjb25zdCBzb3VyY2VNYXBVcmwgPSBgbmc6Ly8vJHtuYW1lfS/JtWRpci5qc2A7XG4gIGNvbnN0IGNvbXBpbGVyID0gZ2V0Q29tcGlsZXJGYWNhZGUoKTtcbiAgY29uc3QgZmFjYWRlID0gZGlyZWN0aXZlTWV0YWRhdGEodHlwZSBhcyBDb21wb25lbnRUeXBlPGFueT4sIG1ldGFkYXRhKTtcbiAgZmFjYWRlLnR5cGVTb3VyY2VTcGFuID0gY29tcGlsZXIuY3JlYXRlUGFyc2VTb3VyY2VTcGFuKCdEaXJlY3RpdmUnLCBuYW1lLCBzb3VyY2VNYXBVcmwpO1xuICBpZiAoZmFjYWRlLnVzZXNJbmhlcml0YW5jZSkge1xuICAgIGFkZERpcmVjdGl2ZURlZlRvVW5kZWNvcmF0ZWRQYXJlbnRzKHR5cGUpO1xuICB9XG4gIHJldHVybiB7bWV0YWRhdGE6IGZhY2FkZSwgc291cmNlTWFwVXJsfTtcbn1cblxuZnVuY3Rpb24gYWRkRGlyZWN0aXZlRmFjdG9yeURlZih0eXBlOiBUeXBlPGFueT4sIG1ldGFkYXRhOiBEaXJlY3RpdmUgfCBDb21wb25lbnQpIHtcbiAgbGV0IG5nRmFjdG9yeURlZjogYW55ID0gbnVsbDtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgTkdfRkFDVE9SWV9ERUYsIHtcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChuZ0ZhY3RvcnlEZWYgPT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgbWV0YSA9IGdldERpcmVjdGl2ZU1ldGFkYXRhKHR5cGUsIG1ldGFkYXRhKTtcbiAgICAgICAgY29uc3QgY29tcGlsZXIgPSBnZXRDb21waWxlckZhY2FkZSgpO1xuICAgICAgICBuZ0ZhY3RvcnlEZWYgPSBjb21waWxlci5jb21waWxlRmFjdG9yeShhbmd1bGFyQ29yZUVudiwgYG5nOi8vLyR7dHlwZS5uYW1lfS/JtWZhYy5qc2AsIHtcbiAgICAgICAgICAuLi5tZXRhLm1ldGFkYXRhLFxuICAgICAgICAgIGluamVjdEZuOiAnZGlyZWN0aXZlSW5qZWN0JyxcbiAgICAgICAgICB0YXJnZXQ6IGNvbXBpbGVyLlIzRmFjdG9yeVRhcmdldC5EaXJlY3RpdmVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmdGYWN0b3J5RGVmO1xuICAgIH0sXG4gICAgLy8gTWFrZSB0aGUgcHJvcGVydHkgY29uZmlndXJhYmxlIGluIGRldiBtb2RlIHRvIGFsbG93IG92ZXJyaWRpbmcgaW4gdGVzdHNcbiAgICBjb25maWd1cmFibGU6ICEhbmdEZXZNb2RlLFxuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dGVuZHNEaXJlY3RseUZyb21PYmplY3QodHlwZTogVHlwZTxhbnk+KTogYm9vbGVhbiB7XG4gIHJldHVybiBPYmplY3QuZ2V0UHJvdG90eXBlT2YodHlwZS5wcm90b3R5cGUpID09PSBPYmplY3QucHJvdG90eXBlO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdGhlIGBSM0RpcmVjdGl2ZU1ldGFkYXRhYCBmb3IgYSBwYXJ0aWN1bGFyIGRpcmVjdGl2ZSAoZWl0aGVyIGEgYERpcmVjdGl2ZWAgb3IgYVxuICogYENvbXBvbmVudGApLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlTWV0YWRhdGEodHlwZTogVHlwZTxhbnk+LCBtZXRhZGF0YTogRGlyZWN0aXZlKTogUjNEaXJlY3RpdmVNZXRhZGF0YUZhY2FkZSB7XG4gIC8vIFJlZmxlY3QgaW5wdXRzIGFuZCBvdXRwdXRzLlxuICBjb25zdCByZWZsZWN0ID0gZ2V0UmVmbGVjdCgpO1xuICBjb25zdCBwcm9wTWV0YWRhdGEgPSByZWZsZWN0Lm93blByb3BNZXRhZGF0YSh0eXBlKTtcblxuICByZXR1cm4ge1xuICAgIG5hbWU6IHR5cGUubmFtZSxcbiAgICB0eXBlOiB0eXBlLFxuICAgIHR5cGVBcmd1bWVudENvdW50OiAwLFxuICAgIHNlbGVjdG9yOiBtZXRhZGF0YS5zZWxlY3RvciAhPT0gdW5kZWZpbmVkID8gbWV0YWRhdGEuc2VsZWN0b3IgOiBudWxsLFxuICAgIGRlcHM6IHJlZmxlY3REZXBlbmRlbmNpZXModHlwZSksXG4gICAgaG9zdDogbWV0YWRhdGEuaG9zdCB8fCBFTVBUWV9PQkosXG4gICAgcHJvcE1ldGFkYXRhOiBwcm9wTWV0YWRhdGEsXG4gICAgaW5wdXRzOiBtZXRhZGF0YS5pbnB1dHMgfHwgRU1QVFlfQVJSQVksXG4gICAgb3V0cHV0czogbWV0YWRhdGEub3V0cHV0cyB8fCBFTVBUWV9BUlJBWSxcbiAgICBxdWVyaWVzOiBleHRyYWN0UXVlcmllc01ldGFkYXRhKHR5cGUsIHByb3BNZXRhZGF0YSwgaXNDb250ZW50UXVlcnkpLFxuICAgIGxpZmVjeWNsZToge3VzZXNPbkNoYW5nZXM6IHJlZmxlY3QuaGFzTGlmZWN5Y2xlSG9vayh0eXBlLCAnbmdPbkNoYW5nZXMnKX0sXG4gICAgdHlwZVNvdXJjZVNwYW46IG51bGwgISxcbiAgICB1c2VzSW5oZXJpdGFuY2U6ICFleHRlbmRzRGlyZWN0bHlGcm9tT2JqZWN0KHR5cGUpLFxuICAgIGV4cG9ydEFzOiBleHRyYWN0RXhwb3J0QXMobWV0YWRhdGEuZXhwb3J0QXMpLFxuICAgIHByb3ZpZGVyczogbWV0YWRhdGEucHJvdmlkZXJzIHx8IG51bGwsXG4gICAgdmlld1F1ZXJpZXM6IGV4dHJhY3RRdWVyaWVzTWV0YWRhdGEodHlwZSwgcHJvcE1ldGFkYXRhLCBpc1ZpZXdRdWVyeSlcbiAgfTtcbn1cblxuLyoqXG4gKiBBZGRzIGEgZGlyZWN0aXZlIGRlZmluaXRpb24gdG8gYWxsIHBhcmVudCBjbGFzc2VzIG9mIGEgdHlwZSB0aGF0IGRvbid0IGhhdmUgYW4gQW5ndWxhciBkZWNvcmF0b3IuXG4gKi9cbmZ1bmN0aW9uIGFkZERpcmVjdGl2ZURlZlRvVW5kZWNvcmF0ZWRQYXJlbnRzKHR5cGU6IFR5cGU8YW55Pikge1xuICBjb25zdCBvYmpQcm90b3R5cGUgPSBPYmplY3QucHJvdG90eXBlO1xuICBsZXQgcGFyZW50ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHR5cGUucHJvdG90eXBlKS5jb25zdHJ1Y3RvcjtcblxuICAvLyBHbyB1cCB0aGUgcHJvdG90eXBlIHVudGlsIHdlIGhpdCBgT2JqZWN0YC5cbiAgd2hpbGUgKHBhcmVudCAmJiBwYXJlbnQgIT09IG9ialByb3RvdHlwZSkge1xuICAgIC8vIFNpbmNlIGluaGVyaXRhbmNlIHdvcmtzIGlmIHRoZSBjbGFzcyB3YXMgYW5ub3RhdGVkIGFscmVhZHksIHdlIG9ubHkgbmVlZCB0byBhZGRcbiAgICAvLyB0aGUgZGVmIGlmIHRoZXJlIGFyZSBubyBhbm5vdGF0aW9ucyBhbmQgdGhlIGRlZiBoYXNuJ3QgYmVlbiBjcmVhdGVkIGFscmVhZHkuXG4gICAgaWYgKCFnZXREaXJlY3RpdmVEZWYocGFyZW50KSAmJiAhZ2V0Q29tcG9uZW50RGVmKHBhcmVudCkgJiZcbiAgICAgICAgc2hvdWxkQWRkQWJzdHJhY3REaXJlY3RpdmUocGFyZW50KSkge1xuICAgICAgY29tcGlsZURpcmVjdGl2ZShwYXJlbnQsIG51bGwpO1xuICAgIH1cbiAgICBwYXJlbnQgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YocGFyZW50KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjb252ZXJ0VG9SM1F1ZXJ5UHJlZGljYXRlKHNlbGVjdG9yOiBhbnkpOiBhbnl8c3RyaW5nW10ge1xuICByZXR1cm4gdHlwZW9mIHNlbGVjdG9yID09PSAnc3RyaW5nJyA/IHNwbGl0QnlDb21tYShzZWxlY3RvcikgOiByZXNvbHZlRm9yd2FyZFJlZihzZWxlY3Rvcik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0VG9SM1F1ZXJ5TWV0YWRhdGEocHJvcGVydHlOYW1lOiBzdHJpbmcsIGFubjogUXVlcnkpOiBSM1F1ZXJ5TWV0YWRhdGFGYWNhZGUge1xuICByZXR1cm4ge1xuICAgIHByb3BlcnR5TmFtZTogcHJvcGVydHlOYW1lLFxuICAgIHByZWRpY2F0ZTogY29udmVydFRvUjNRdWVyeVByZWRpY2F0ZShhbm4uc2VsZWN0b3IpLFxuICAgIGRlc2NlbmRhbnRzOiBhbm4uZGVzY2VuZGFudHMsXG4gICAgZmlyc3Q6IGFubi5maXJzdCxcbiAgICByZWFkOiBhbm4ucmVhZCA/IGFubi5yZWFkIDogbnVsbCxcbiAgICBzdGF0aWM6ICEhYW5uLnN0YXRpY1xuICB9O1xufVxuZnVuY3Rpb24gZXh0cmFjdFF1ZXJpZXNNZXRhZGF0YShcbiAgICB0eXBlOiBUeXBlPGFueT4sIHByb3BNZXRhZGF0YToge1trZXk6IHN0cmluZ106IGFueVtdfSxcbiAgICBpc1F1ZXJ5QW5uOiAoYW5uOiBhbnkpID0+IGFubiBpcyBRdWVyeSk6IFIzUXVlcnlNZXRhZGF0YUZhY2FkZVtdIHtcbiAgY29uc3QgcXVlcmllc01ldGE6IFIzUXVlcnlNZXRhZGF0YUZhY2FkZVtdID0gW107XG4gIGZvciAoY29uc3QgZmllbGQgaW4gcHJvcE1ldGFkYXRhKSB7XG4gICAgaWYgKHByb3BNZXRhZGF0YS5oYXNPd25Qcm9wZXJ0eShmaWVsZCkpIHtcbiAgICAgIGNvbnN0IGFubm90YXRpb25zID0gcHJvcE1ldGFkYXRhW2ZpZWxkXTtcbiAgICAgIGFubm90YXRpb25zLmZvckVhY2goYW5uID0+IHtcbiAgICAgICAgaWYgKGlzUXVlcnlBbm4oYW5uKSkge1xuICAgICAgICAgIGlmICghYW5uLnNlbGVjdG9yKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgYENhbid0IGNvbnN0cnVjdCBhIHF1ZXJ5IGZvciB0aGUgcHJvcGVydHkgXCIke2ZpZWxkfVwiIG9mIGAgK1xuICAgICAgICAgICAgICAgIGBcIiR7c3RyaW5naWZ5Rm9yRXJyb3IodHlwZSl9XCIgc2luY2UgdGhlIHF1ZXJ5IHNlbGVjdG9yIHdhc24ndCBkZWZpbmVkLmApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoYW5ub3RhdGlvbnMuc29tZShpc0lucHV0QW5ub3RhdGlvbikpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGNvbWJpbmUgQElucHV0IGRlY29yYXRvcnMgd2l0aCBxdWVyeSBkZWNvcmF0b3JzYCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHF1ZXJpZXNNZXRhLnB1c2goY29udmVydFRvUjNRdWVyeU1ldGFkYXRhKGZpZWxkLCBhbm4pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBxdWVyaWVzTWV0YTtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdEV4cG9ydEFzKGV4cG9ydEFzOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmdbXXxudWxsIHtcbiAgcmV0dXJuIGV4cG9ydEFzID09PSB1bmRlZmluZWQgPyBudWxsIDogc3BsaXRCeUNvbW1hKGV4cG9ydEFzKTtcbn1cblxuZnVuY3Rpb24gaXNDb250ZW50UXVlcnkodmFsdWU6IGFueSk6IHZhbHVlIGlzIFF1ZXJ5IHtcbiAgY29uc3QgbmFtZSA9IHZhbHVlLm5nTWV0YWRhdGFOYW1lO1xuICByZXR1cm4gbmFtZSA9PT0gJ0NvbnRlbnRDaGlsZCcgfHwgbmFtZSA9PT0gJ0NvbnRlbnRDaGlsZHJlbic7XG59XG5cbmZ1bmN0aW9uIGlzVmlld1F1ZXJ5KHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBRdWVyeSB7XG4gIGNvbnN0IG5hbWUgPSB2YWx1ZS5uZ01ldGFkYXRhTmFtZTtcbiAgcmV0dXJuIG5hbWUgPT09ICdWaWV3Q2hpbGQnIHx8IG5hbWUgPT09ICdWaWV3Q2hpbGRyZW4nO1xufVxuXG5mdW5jdGlvbiBpc0lucHV0QW5ub3RhdGlvbih2YWx1ZTogYW55KTogdmFsdWUgaXMgSW5wdXQge1xuICByZXR1cm4gdmFsdWUubmdNZXRhZGF0YU5hbWUgPT09ICdJbnB1dCc7XG59XG5cbmZ1bmN0aW9uIHNwbGl0QnlDb21tYSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nW10ge1xuICByZXR1cm4gdmFsdWUuc3BsaXQoJywnKS5tYXAocGllY2UgPT4gcGllY2UudHJpbSgpKTtcbn1cblxuY29uc3QgTElGRUNZQ0xFX0hPT0tTID0gW1xuICAnbmdPbkNoYW5nZXMnLCAnbmdPbkluaXQnLCAnbmdPbkRlc3Ryb3knLCAnbmdEb0NoZWNrJywgJ25nQWZ0ZXJWaWV3SW5pdCcsICduZ0FmdGVyVmlld0NoZWNrZWQnLFxuICAnbmdBZnRlckNvbnRlbnRJbml0JywgJ25nQWZ0ZXJDb250ZW50Q2hlY2tlZCdcbl07XG5cbmZ1bmN0aW9uIHNob3VsZEFkZEFic3RyYWN0RGlyZWN0aXZlKHR5cGU6IFR5cGU8YW55Pik6IGJvb2xlYW4ge1xuICBjb25zdCByZWZsZWN0ID0gZ2V0UmVmbGVjdCgpO1xuXG4gIGlmIChMSUZFQ1lDTEVfSE9PS1Muc29tZShob29rTmFtZSA9PiByZWZsZWN0Lmhhc0xpZmVjeWNsZUhvb2sodHlwZSwgaG9va05hbWUpKSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgY29uc3QgcHJvcE1ldGFkYXRhID0gcmVmbGVjdC5wcm9wTWV0YWRhdGEodHlwZSk7XG5cbiAgZm9yIChjb25zdCBmaWVsZCBpbiBwcm9wTWV0YWRhdGEpIHtcbiAgICBjb25zdCBhbm5vdGF0aW9ucyA9IHByb3BNZXRhZGF0YVtmaWVsZF07XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFubm90YXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjdXJyZW50ID0gYW5ub3RhdGlvbnNbaV07XG4gICAgICBjb25zdCBtZXRhZGF0YU5hbWUgPSBjdXJyZW50Lm5nTWV0YWRhdGFOYW1lO1xuXG4gICAgICBpZiAoaXNJbnB1dEFubm90YXRpb24oY3VycmVudCkgfHwgaXNDb250ZW50UXVlcnkoY3VycmVudCkgfHwgaXNWaWV3UXVlcnkoY3VycmVudCkgfHxcbiAgICAgICAgICBtZXRhZGF0YU5hbWUgPT09ICdPdXRwdXQnIHx8IG1ldGFkYXRhTmFtZSA9PT0gJ0hvc3RCaW5kaW5nJyB8fFxuICAgICAgICAgIG1ldGFkYXRhTmFtZSA9PT0gJ0hvc3RMaXN0ZW5lcicpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuIl19