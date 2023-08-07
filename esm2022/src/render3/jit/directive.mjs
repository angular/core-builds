/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getCompilerFacade } from '../../compiler/compiler_facade';
import { resolveForwardRef } from '../../di/forward_ref';
import { getReflect, reflectDependencies } from '../../di/jit/util';
import { componentNeedsResolution, maybeQueueResolutionOfComponentResources } from '../../metadata/resource_loading';
import { ViewEncapsulation } from '../../metadata/view';
import { flatten } from '../../util/array_utils';
import { EMPTY_ARRAY, EMPTY_OBJ } from '../../util/empty';
import { initNgDevMode } from '../../util/ng_dev_mode';
import { getComponentDef, getDirectiveDef, getNgModuleDef, getPipeDef } from '../definition';
import { depsTracker, USE_RUNTIME_DEPS_TRACKER_FOR_JIT } from '../deps_tracker/deps_tracker';
import { NG_COMP_DEF, NG_DIR_DEF, NG_FACTORY_DEF } from '../fields';
import { stringifyForError } from '../util/stringify_utils';
import { angularCoreEnv } from './environment';
import { getJitOptions } from './jit_options';
import { flushModuleScopingQueueAsMuchAsPossible, patchComponentDefWithScope, transitiveScopesFor } from './module';
import { isComponent, verifyStandaloneImport } from './util';
/**
 * Keep track of the compilation depth to avoid reentrancy issues during JIT compilation. This
 * matters in the following scenario:
 *
 * Consider a component 'A' that extends component 'B', both declared in module 'M'. During
 * the compilation of 'A' the definition of 'B' is requested to capture the inheritance chain,
 * potentially triggering compilation of 'B'. If this nested compilation were to trigger
 * `flushModuleScopingQueueAsMuchAsPossible` it may happen that module 'M' is still pending in the
 * queue, resulting in 'A' and 'B' to be patched with the NgModule scope. As the compilation of
 * 'A' is still in progress, this would introduce a circular dependency on its compilation. To avoid
 * this issue, the module scope queue is only flushed for compilations at the depth 0, to ensure
 * all compilations have finished.
 */
let compilationDepth = 0;
/**
 * Compile an Angular component according to its decorator metadata, and patch the resulting
 * component def (ɵcmp) onto the component type.
 *
 * Compilation may be asynchronous (due to the need to resolve URLs for the component template or
 * other resources, for example). In the event that compilation is not immediate, `compileComponent`
 * will enqueue resource resolution into a global queue and will fail to return the `ɵcmp`
 * until the global queue has been resolved with a call to `resolveComponentResources`.
 */
export function compileComponent(type, metadata) {
    // Initialize ngDevMode. This must be the first statement in compileComponent.
    // See the `initNgDevMode` docstring for more information.
    (typeof ngDevMode === 'undefined' || ngDevMode) && initNgDevMode();
    let ngComponentDef = null;
    // Metadata may have resources which need to be resolved.
    maybeQueueResolutionOfComponentResources(type, metadata);
    // Note that we're using the same function as `Directive`, because that's only subset of metadata
    // that we need to create the ngFactoryDef. We're avoiding using the component metadata
    // because we'd have to resolve the asynchronous templates.
    addDirectiveFactoryDef(type, metadata);
    Object.defineProperty(type, NG_COMP_DEF, {
        get: () => {
            if (ngComponentDef === null) {
                const compiler = getCompilerFacade({ usage: 0 /* JitCompilerUsage.Decorator */, kind: 'component', type: type });
                if (componentNeedsResolution(metadata)) {
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
                const options = getJitOptions();
                let preserveWhitespaces = metadata.preserveWhitespaces;
                if (preserveWhitespaces === undefined) {
                    if (options !== null && options.preserveWhitespaces !== undefined) {
                        preserveWhitespaces = options.preserveWhitespaces;
                    }
                    else {
                        preserveWhitespaces = false;
                    }
                }
                let encapsulation = metadata.encapsulation;
                if (encapsulation === undefined) {
                    if (options !== null && options.defaultEncapsulation !== undefined) {
                        encapsulation = options.defaultEncapsulation;
                    }
                    else {
                        encapsulation = ViewEncapsulation.Emulated;
                    }
                }
                const templateUrl = metadata.templateUrl || `ng:///${type.name}/template.html`;
                const meta = {
                    ...directiveMetadata(type, metadata),
                    typeSourceSpan: compiler.createParseSourceSpan('Component', type.name, templateUrl),
                    template: metadata.template || '',
                    preserveWhitespaces,
                    styles: metadata.styles || EMPTY_ARRAY,
                    animations: metadata.animations,
                    // JIT components are always compiled against an empty set of `declarations`. Instead, the
                    // `directiveDefs` and `pipeDefs` are updated at a later point:
                    //  * for NgModule-based components, they're set when the NgModule which declares the
                    //    component resolves in the module scoping queue
                    //  * for standalone components, they're set just below, after `compileComponent`.
                    declarations: [],
                    changeDetection: metadata.changeDetection,
                    encapsulation,
                    interpolation: metadata.interpolation,
                    viewProviders: metadata.viewProviders || null,
                };
                compilationDepth++;
                try {
                    if (meta.usesInheritance) {
                        addDirectiveDefToUndecoratedParents(type);
                    }
                    ngComponentDef =
                        compiler.compileComponent(angularCoreEnv, templateUrl, meta);
                    if (metadata.standalone) {
                        // Patch the component definition for standalone components with `directiveDefs` and
                        // `pipeDefs` functions which lazily compute the directives/pipes available in the
                        // standalone component. Also set `dependencies` to the lazily resolved list of imports.
                        const imports = flatten(metadata.imports || EMPTY_ARRAY);
                        const { directiveDefs, pipeDefs } = getStandaloneDefFunctions(type, imports);
                        ngComponentDef.directiveDefs = directiveDefs;
                        ngComponentDef.pipeDefs = pipeDefs;
                        ngComponentDef.dependencies = () => imports.map(resolveForwardRef);
                    }
                }
                finally {
                    // Ensure that the compilation depth is decremented even when the compilation failed.
                    compilationDepth--;
                }
                if (compilationDepth === 0) {
                    // When NgModule decorator executed, we enqueued the module definition such that
                    // it would only dequeue and add itself as module scope to all of its declarations,
                    // but only if  if all of its declarations had resolved. This call runs the check
                    // to see if any modules that are in the queue can be dequeued and add scope to
                    // their declarations.
                    flushModuleScopingQueueAsMuchAsPossible();
                }
                // If component compilation is async, then the @NgModule annotation which declares the
                // component may execute and set an ngSelectorScope property on the component type. This
                // allows the component to patch itself with directiveDefs from the module after it
                // finishes compiling.
                if (hasSelectorScope(type)) {
                    const scopes = transitiveScopesFor(type.ngSelectorScope);
                    patchComponentDefWithScope(ngComponentDef, scopes);
                }
                if (metadata.schemas) {
                    if (metadata.standalone) {
                        ngComponentDef.schemas = metadata.schemas;
                    }
                    else {
                        throw new Error(`The 'schemas' was specified for the ${stringifyForError(type)} but is only valid on a component that is standalone.`);
                    }
                }
                else if (metadata.standalone) {
                    ngComponentDef.schemas = [];
                }
            }
            return ngComponentDef;
        },
        // Make the property configurable in dev mode to allow overriding in tests
        configurable: !!ngDevMode,
    });
}
/**
 * Build memoized `directiveDefs` and `pipeDefs` functions for the component definition of a
 * standalone component, which process `imports` and filter out directives and pipes. The use of
 * memoized functions here allows for the delayed resolution of any `forwardRef`s present in the
 * component's `imports`.
 */
function getStandaloneDefFunctions(type, imports) {
    let cachedDirectiveDefs = null;
    let cachedPipeDefs = null;
    const directiveDefs = () => {
        if (!USE_RUNTIME_DEPS_TRACKER_FOR_JIT) {
            if (cachedDirectiveDefs === null) {
                // Standalone components are always able to self-reference, so include the component's own
                // definition in its `directiveDefs`.
                cachedDirectiveDefs = [getComponentDef(type)];
                const seen = new Set([type]);
                for (const rawDep of imports) {
                    ngDevMode && verifyStandaloneImport(rawDep, type);
                    const dep = resolveForwardRef(rawDep);
                    if (seen.has(dep)) {
                        continue;
                    }
                    seen.add(dep);
                    if (!!getNgModuleDef(dep)) {
                        const scope = transitiveScopesFor(dep);
                        for (const dir of scope.exported.directives) {
                            const def = getComponentDef(dir) || getDirectiveDef(dir);
                            if (def && !seen.has(dir)) {
                                seen.add(dir);
                                cachedDirectiveDefs.push(def);
                            }
                        }
                    }
                    else {
                        const def = getComponentDef(dep) || getDirectiveDef(dep);
                        if (def) {
                            cachedDirectiveDefs.push(def);
                        }
                    }
                }
            }
            return cachedDirectiveDefs;
        }
        else {
            if (ngDevMode) {
                for (const rawDep of imports) {
                    verifyStandaloneImport(rawDep, type);
                }
            }
            if (!isComponent(type)) {
                return [];
            }
            const scope = depsTracker.getStandaloneComponentScope(type, imports);
            return [...scope.compilation.directives]
                .map(p => (getComponentDef(p) || getDirectiveDef(p)))
                .filter(d => d !== null);
        }
    };
    const pipeDefs = () => {
        if (!USE_RUNTIME_DEPS_TRACKER_FOR_JIT) {
            if (cachedPipeDefs === null) {
                cachedPipeDefs = [];
                const seen = new Set();
                for (const rawDep of imports) {
                    const dep = resolveForwardRef(rawDep);
                    if (seen.has(dep)) {
                        continue;
                    }
                    seen.add(dep);
                    if (!!getNgModuleDef(dep)) {
                        const scope = transitiveScopesFor(dep);
                        for (const pipe of scope.exported.pipes) {
                            const def = getPipeDef(pipe);
                            if (def && !seen.has(pipe)) {
                                seen.add(pipe);
                                cachedPipeDefs.push(def);
                            }
                        }
                    }
                    else {
                        const def = getPipeDef(dep);
                        if (def) {
                            cachedPipeDefs.push(def);
                        }
                    }
                }
            }
            return cachedPipeDefs;
        }
        else {
            if (ngDevMode) {
                for (const rawDep of imports) {
                    verifyStandaloneImport(rawDep, type);
                }
            }
            if (!isComponent(type)) {
                return [];
            }
            const scope = depsTracker.getStandaloneComponentScope(type, imports);
            return [...scope.compilation.pipes].map(p => getPipeDef(p)).filter(d => d !== null);
        }
    };
    return {
        directiveDefs,
        pipeDefs,
    };
}
function hasSelectorScope(component) {
    return component.ngSelectorScope !== undefined;
}
/**
 * Compile an Angular directive according to its decorator metadata, and patch the resulting
 * directive def onto the component type.
 *
 * In the event that compilation is not immediate, `compileDirective` will return a `Promise` which
 * will resolve when compilation completes and the directive becomes usable.
 */
export function compileDirective(type, directive) {
    let ngDirectiveDef = null;
    addDirectiveFactoryDef(type, directive || {});
    Object.defineProperty(type, NG_DIR_DEF, {
        get: () => {
            if (ngDirectiveDef === null) {
                // `directive` can be null in the case of abstract directives as a base class
                // that use `@Directive()` with no selector. In that case, pass empty object to the
                // `directiveMetadata` function instead of null.
                const meta = getDirectiveMetadata(type, directive || {});
                const compiler = getCompilerFacade({ usage: 0 /* JitCompilerUsage.Decorator */, kind: 'directive', type });
                ngDirectiveDef =
                    compiler.compileDirective(angularCoreEnv, meta.sourceMapUrl, meta.metadata);
            }
            return ngDirectiveDef;
        },
        // Make the property configurable in dev mode to allow overriding in tests
        configurable: !!ngDevMode,
    });
}
function getDirectiveMetadata(type, metadata) {
    const name = type && type.name;
    const sourceMapUrl = `ng:///${name}/ɵdir.js`;
    const compiler = getCompilerFacade({ usage: 0 /* JitCompilerUsage.Decorator */, kind: 'directive', type });
    const facade = directiveMetadata(type, metadata);
    facade.typeSourceSpan = compiler.createParseSourceSpan('Directive', name, sourceMapUrl);
    if (facade.usesInheritance) {
        addDirectiveDefToUndecoratedParents(type);
    }
    return { metadata: facade, sourceMapUrl };
}
function addDirectiveFactoryDef(type, metadata) {
    let ngFactoryDef = null;
    Object.defineProperty(type, NG_FACTORY_DEF, {
        get: () => {
            if (ngFactoryDef === null) {
                const meta = getDirectiveMetadata(type, metadata);
                const compiler = getCompilerFacade({ usage: 0 /* JitCompilerUsage.Decorator */, kind: 'directive', type });
                ngFactoryDef = compiler.compileFactory(angularCoreEnv, `ng:///${type.name}/ɵfac.js`, {
                    name: meta.metadata.name,
                    type: meta.metadata.type,
                    typeArgumentCount: 0,
                    deps: reflectDependencies(type),
                    target: compiler.FactoryTarget.Directive
                });
            }
            return ngFactoryDef;
        },
        // Make the property configurable in dev mode to allow overriding in tests
        configurable: !!ngDevMode,
    });
}
export function extendsDirectlyFromObject(type) {
    return Object.getPrototypeOf(type.prototype) === Object.prototype;
}
/**
 * Extract the `R3DirectiveMetadata` for a particular directive (either a `Directive` or a
 * `Component`).
 */
export function directiveMetadata(type, metadata) {
    // Reflect inputs and outputs.
    const reflect = getReflect();
    const propMetadata = reflect.ownPropMetadata(type);
    return {
        name: type.name,
        type: type,
        selector: metadata.selector !== undefined ? metadata.selector : null,
        host: metadata.host || EMPTY_OBJ,
        propMetadata: propMetadata,
        inputs: metadata.inputs || EMPTY_ARRAY,
        outputs: metadata.outputs || EMPTY_ARRAY,
        queries: extractQueriesMetadata(type, propMetadata, isContentQuery),
        lifecycle: { usesOnChanges: reflect.hasLifecycleHook(type, 'ngOnChanges') },
        typeSourceSpan: null,
        usesInheritance: !extendsDirectlyFromObject(type),
        exportAs: extractExportAs(metadata.exportAs),
        providers: metadata.providers || null,
        viewQueries: extractQueriesMetadata(type, propMetadata, isViewQuery),
        isStandalone: !!metadata.standalone,
        isSignal: !!metadata.signals,
        hostDirectives: metadata.hostDirectives?.map(directive => typeof directive === 'function' ? { directive } : directive) ||
            null
    };
}
/**
 * Adds a directive definition to all parent classes of a type that don't have an Angular decorator.
 */
function addDirectiveDefToUndecoratedParents(type) {
    const objPrototype = Object.prototype;
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
function convertToR3QueryPredicate(selector) {
    return typeof selector === 'string' ? splitByComma(selector) : resolveForwardRef(selector);
}
export function convertToR3QueryMetadata(propertyName, ann) {
    return {
        propertyName: propertyName,
        predicate: convertToR3QueryPredicate(ann.selector),
        descendants: ann.descendants,
        first: ann.first,
        read: ann.read ? ann.read : null,
        static: !!ann.static,
        emitDistinctChangesOnly: !!ann.emitDistinctChangesOnly,
    };
}
function extractQueriesMetadata(type, propMetadata, isQueryAnn) {
    const queriesMeta = [];
    for (const field in propMetadata) {
        if (propMetadata.hasOwnProperty(field)) {
            const annotations = propMetadata[field];
            annotations.forEach(ann => {
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
            });
        }
    }
    return queriesMeta;
}
function extractExportAs(exportAs) {
    return exportAs === undefined ? null : splitByComma(exportAs);
}
function isContentQuery(value) {
    const name = value.ngMetadataName;
    return name === 'ContentChild' || name === 'ContentChildren';
}
function isViewQuery(value) {
    const name = value.ngMetadataName;
    return name === 'ViewChild' || name === 'ViewChildren';
}
function isInputAnnotation(value) {
    return value.ngMetadataName === 'Input';
}
function splitByComma(value) {
    return value.split(',').map(piece => piece.trim());
}
const LIFECYCLE_HOOKS = [
    'ngOnChanges', 'ngOnInit', 'ngOnDestroy', 'ngDoCheck', 'ngAfterViewInit', 'ngAfterViewChecked',
    'ngAfterContentInit', 'ngAfterContentChecked'
];
function shouldAddAbstractDirective(type) {
    const reflect = getReflect();
    if (LIFECYCLE_HOOKS.some(hookName => reflect.hasLifecycleHook(type, hookName))) {
        return true;
    }
    const propMetadata = reflect.propMetadata(type);
    for (const field in propMetadata) {
        const annotations = propMetadata[field];
        for (let i = 0; i < annotations.length; i++) {
            const current = annotations[i];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBOEMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUU5RyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUN2RCxPQUFPLEVBQUMsVUFBVSxFQUFFLG1CQUFtQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFJbEUsT0FBTyxFQUFDLHdCQUF3QixFQUFFLHdDQUF3QyxFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDbkgsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEQsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQy9DLE9BQU8sRUFBQyxXQUFXLEVBQUUsU0FBUyxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDeEQsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3JELE9BQU8sRUFBQyxlQUFlLEVBQUUsZUFBZSxFQUFFLGNBQWMsRUFBRSxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDM0YsT0FBTyxFQUFDLFdBQVcsRUFBRSxnQ0FBZ0MsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQzNGLE9BQU8sRUFBQyxXQUFXLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUVsRSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUUxRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDNUMsT0FBTyxFQUFDLHVDQUF1QyxFQUFFLDBC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QyxDQUFDO1lBQy9CLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUM7WUFFNUMsSUFBSSxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsSUFBSSxjQUFjLENBQUMsT0FBTyxDQUFDLElBQUksV0FBVyxDQUFDLE9BQU8sQ0FBQztnQkFDN0UsWUFBWSxLQUFLLFFBQVEsSUFBSSxZQUFZLEtBQUssYUFBYTtnQkFDM0QsWUFBWSxLQUFLLGNBQWMsRUFBRTtnQkFDbkMsT0FBTyxJQUFJLENBQUM7YUFDYjtTQUNGO0tBQ0Y7SUFFRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtnZXRDb21waWxlckZhY2FkZSwgSml0Q29tcGlsZXJVc2FnZSwgUjNEaXJlY3RpdmVNZXRhZGF0YUZhY2FkZX0gZnJvbSAnLi4vLi4vY29tcGlsZXIvY29tcGlsZXJfZmFjYWRlJztcbmltcG9ydCB7UjNDb21wb25lbnRNZXRhZGF0YUZhY2FkZSwgUjNRdWVyeU1ldGFkYXRhRmFjYWRlfSBmcm9tICcuLi8uLi9jb21waWxlci9jb21waWxlcl9mYWNhZGVfaW50ZXJmYWNlJztcbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4uLy4uL2RpL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7Z2V0UmVmbGVjdCwgcmVmbGVjdERlcGVuZGVuY2llc30gZnJvbSAnLi4vLi4vZGkvaml0L3V0aWwnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge1F1ZXJ5fSBmcm9tICcuLi8uLi9tZXRhZGF0YS9kaSc7XG5pbXBvcnQge0NvbXBvbmVudCwgRGlyZWN0aXZlLCBJbnB1dH0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvZGlyZWN0aXZlcyc7XG5pbXBvcnQge2NvbXBvbmVudE5lZWRzUmVzb2x1dGlvbiwgbWF5YmVRdWV1ZVJlc29sdXRpb25PZkNvbXBvbmVudFJlc291cmNlc30gZnJvbSAnLi4vLi4vbWV0YWRhdGEvcmVzb3VyY2VfbG9hZGluZyc7XG5pbXBvcnQge1ZpZXdFbmNhcHN1bGF0aW9ufSBmcm9tICcuLi8uLi9tZXRhZGF0YS92aWV3JztcbmltcG9ydCB7ZmxhdHRlbn0gZnJvbSAnLi4vLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge0VNUFRZX0FSUkFZLCBFTVBUWV9PQkp9IGZyb20gJy4uLy4uL3V0aWwvZW1wdHknO1xuaW1wb3J0IHtpbml0TmdEZXZNb2RlfSBmcm9tICcuLi8uLi91dGlsL25nX2Rldl9tb2RlJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmLCBnZXREaXJlY3RpdmVEZWYsIGdldE5nTW9kdWxlRGVmLCBnZXRQaXBlRGVmfSBmcm9tICcuLi9kZWZpbml0aW9uJztcbmltcG9ydCB7ZGVwc1RyYWNrZXIsIFVTRV9SVU5USU1FX0RFUFNfVFJBQ0tFUl9GT1JfSklUfSBmcm9tICcuLi9kZXBzX3RyYWNrZXIvZGVwc190cmFja2VyJztcbmltcG9ydCB7TkdfQ09NUF9ERUYsIE5HX0RJUl9ERUYsIE5HX0ZBQ1RPUllfREVGfSBmcm9tICcuLi9maWVsZHMnO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbXBvbmVudFR5cGUsIERpcmVjdGl2ZURlZkxpc3QsIFBpcGVEZWZMaXN0fSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtzdHJpbmdpZnlGb3JFcnJvcn0gZnJvbSAnLi4vdXRpbC9zdHJpbmdpZnlfdXRpbHMnO1xuXG5pbXBvcnQge2FuZ3VsYXJDb3JlRW52fSBmcm9tICcuL2Vudmlyb25tZW50JztcbmltcG9ydCB7Z2V0Sml0T3B0aW9uc30gZnJvbSAnLi9qaXRfb3B0aW9ucyc7XG5pbXBvcnQge2ZsdXNoTW9kdWxlU2NvcGluZ1F1ZXVlQXNNdWNoQXNQb3NzaWJsZSwgcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUsIHRyYW5zaXRpdmVTY29wZXNGb3J9IGZyb20gJy4vbW9kdWxlJztcbmltcG9ydCB7aXNDb21wb25lbnQsIHZlcmlmeVN0YW5kYWxvbmVJbXBvcnR9IGZyb20gJy4vdXRpbCc7XG5cbi8qKlxuICogS2VlcCB0cmFjayBvZiB0aGUgY29tcGlsYXRpb24gZGVwdGggdG8gYXZvaWQgcmVlbnRyYW5jeSBpc3N1ZXMgZHVyaW5nIEpJVCBjb21waWxhdGlvbi4gVGhpc1xuICogbWF0dGVycyBpbiB0aGUgZm9sbG93aW5nIHNjZW5hcmlvOlxuICpcbiAqIENvbnNpZGVyIGEgY29tcG9uZW50ICdBJyB0aGF0IGV4dGVuZHMgY29tcG9uZW50ICdCJywgYm90aCBkZWNsYXJlZCBpbiBtb2R1bGUgJ00nLiBEdXJpbmdcbiAqIHRoZSBjb21waWxhdGlvbiBvZiAnQScgdGhlIGRlZmluaXRpb24gb2YgJ0InIGlzIHJlcXVlc3RlZCB0byBjYXB0dXJlIHRoZSBpbmhlcml0YW5jZSBjaGFpbixcbiAqIHBvdGVudGlhbGx5IHRyaWdnZXJpbmcgY29tcGlsYXRpb24gb2YgJ0InLiBJZiB0aGlzIG5lc3RlZCBjb21waWxhdGlvbiB3ZXJlIHRvIHRyaWdnZXJcbiAqIGBmbHVzaE1vZHVsZVNjb3BpbmdRdWV1ZUFzTXVjaEFzUG9zc2libGVgIGl0IG1heSBoYXBwZW4gdGhhdCBtb2R1bGUgJ00nIGlzIHN0aWxsIHBlbmRpbmcgaW4gdGhlXG4gKiBxdWV1ZSwgcmVzdWx0aW5nIGluICdBJyBhbmQgJ0InIHRvIGJlIHBhdGNoZWQgd2l0aCB0aGUgTmdNb2R1bGUgc2NvcGUuIEFzIHRoZSBjb21waWxhdGlvbiBvZlxuICogJ0EnIGlzIHN0aWxsIGluIHByb2dyZXNzLCB0aGlzIHdvdWxkIGludHJvZHVjZSBhIGNpcmN1bGFyIGRlcGVuZGVuY3kgb24gaXRzIGNvbXBpbGF0aW9uLiBUbyBhdm9pZFxuICogdGhpcyBpc3N1ZSwgdGhlIG1vZHVsZSBzY29wZSBxdWV1ZSBpcyBvbmx5IGZsdXNoZWQgZm9yIGNvbXBpbGF0aW9ucyBhdCB0aGUgZGVwdGggMCwgdG8gZW5zdXJlXG4gKiBhbGwgY29tcGlsYXRpb25zIGhhdmUgZmluaXNoZWQuXG4gKi9cbmxldCBjb21waWxhdGlvbkRlcHRoID0gMDtcblxuLyoqXG4gKiBDb21waWxlIGFuIEFuZ3VsYXIgY29tcG9uZW50IGFjY29yZGluZyB0byBpdHMgZGVjb3JhdG9yIG1ldGFkYXRhLCBhbmQgcGF0Y2ggdGhlIHJlc3VsdGluZ1xuICogY29tcG9uZW50IGRlZiAoybVjbXApIG9udG8gdGhlIGNvbXBvbmVudCB0eXBlLlxuICpcbiAqIENvbXBpbGF0aW9uIG1heSBiZSBhc3luY2hyb25vdXMgKGR1ZSB0byB0aGUgbmVlZCB0byByZXNvbHZlIFVSTHMgZm9yIHRoZSBjb21wb25lbnQgdGVtcGxhdGUgb3JcbiAqIG90aGVyIHJlc291cmNlcywgZm9yIGV4YW1wbGUpLiBJbiB0aGUgZXZlbnQgdGhhdCBjb21waWxhdGlvbiBpcyBub3QgaW1tZWRpYXRlLCBgY29tcGlsZUNvbXBvbmVudGBcbiAqIHdpbGwgZW5xdWV1ZSByZXNvdXJjZSByZXNvbHV0aW9uIGludG8gYSBnbG9iYWwgcXVldWUgYW5kIHdpbGwgZmFpbCB0byByZXR1cm4gdGhlIGDJtWNtcGBcbiAqIHVudGlsIHRoZSBnbG9iYWwgcXVldWUgaGFzIGJlZW4gcmVzb2x2ZWQgd2l0aCBhIGNhbGwgdG8gYHJlc29sdmVDb21wb25lbnRSZXNvdXJjZXNgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZUNvbXBvbmVudCh0eXBlOiBUeXBlPGFueT4sIG1ldGFkYXRhOiBDb21wb25lbnQpOiB2b2lkIHtcbiAgLy8gSW5pdGlhbGl6ZSBuZ0Rldk1vZGUuIFRoaXMgbXVzdCBiZSB0aGUgZmlyc3Qgc3RhdGVtZW50IGluIGNvbXBpbGVDb21wb25lbnQuXG4gIC8vIFNlZSB0aGUgYGluaXROZ0Rldk1vZGVgIGRvY3N0cmluZyBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgaW5pdE5nRGV2TW9kZSgpO1xuXG4gIGxldCBuZ0NvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPHVua25vd24+fG51bGwgPSBudWxsO1xuXG4gIC8vIE1ldGFkYXRhIG1heSBoYXZlIHJlc291cmNlcyB3aGljaCBuZWVkIHRvIGJlIHJlc29sdmVkLlxuICBtYXliZVF1ZXVlUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzKHR5cGUsIG1ldGFkYXRhKTtcblxuICAvLyBOb3RlIHRoYXQgd2UncmUgdXNpbmcgdGhlIHNhbWUgZnVuY3Rpb24gYXMgYERpcmVjdGl2ZWAsIGJlY2F1c2UgdGhhdCdzIG9ubHkgc3Vic2V0IG9mIG1ldGFkYXRhXG4gIC8vIHRoYXQgd2UgbmVlZCB0byBjcmVhdGUgdGhlIG5nRmFjdG9yeURlZi4gV2UncmUgYXZvaWRpbmcgdXNpbmcgdGhlIGNvbXBvbmVudCBtZXRhZGF0YVxuICAvLyBiZWNhdXNlIHdlJ2QgaGF2ZSB0byByZXNvbHZlIHRoZSBhc3luY2hyb25vdXMgdGVtcGxhdGVzLlxuICBhZGREaXJlY3RpdmVGYWN0b3J5RGVmKHR5cGUsIG1ldGFkYXRhKTtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgTkdfQ09NUF9ERUYsIHtcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChuZ0NvbXBvbmVudERlZiA9PT0gbnVsbCkge1xuICAgICAgICBjb25zdCBjb21waWxlciA9XG4gICAgICAgICAgICBnZXRDb21waWxlckZhY2FkZSh7dXNhZ2U6IEppdENvbXBpbGVyVXNhZ2UuRGVjb3JhdG9yLCBraW5kOiAnY29tcG9uZW50JywgdHlwZTogdHlwZX0pO1xuXG4gICAgICAgIGlmIChjb21wb25lbnROZWVkc1Jlc29sdXRpb24obWV0YWRhdGEpKSB7XG4gICAgICAgICAgY29uc3QgZXJyb3IgPSBbYENvbXBvbmVudCAnJHt0eXBlLm5hbWV9JyBpcyBub3QgcmVzb2x2ZWQ6YF07XG4gICAgICAgICAgaWYgKG1ldGFkYXRhLnRlbXBsYXRlVXJsKSB7XG4gICAgICAgICAgICBlcnJvci5wdXNoKGAgLSB0ZW1wbGF0ZVVybDogJHttZXRhZGF0YS50ZW1wbGF0ZVVybH1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG1ldGFkYXRhLnN0eWxlVXJscyAmJiBtZXRhZGF0YS5zdHlsZVVybHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBlcnJvci5wdXNoKGAgLSBzdHlsZVVybHM6ICR7SlNPTi5zdHJpbmdpZnkobWV0YWRhdGEuc3R5bGVVcmxzKX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZXJyb3IucHVzaChgRGlkIHlvdSBydW4gYW5kIHdhaXQgZm9yICdyZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzKCknP2ApO1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvci5qb2luKCdcXG4nKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGlzIGNvbnN0IHdhcyBjYWxsZWQgYGppdE9wdGlvbnNgIHByZXZpb3VzbHkgYnV0IGhhZCB0byBiZSByZW5hbWVkIHRvIGBvcHRpb25zYCBiZWNhdXNlXG4gICAgICAgIC8vIG9mIGEgYnVnIHdpdGggVGVyc2VyIHRoYXQgY2F1c2VkIG9wdGltaXplZCBKSVQgYnVpbGRzIHRvIHRocm93IGEgYFJlZmVyZW5jZUVycm9yYC5cbiAgICAgICAgLy8gVGhpcyBidWcgd2FzIGludmVzdGlnYXRlZCBpbiBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyLWNsaS9pc3N1ZXMvMTcyNjQuXG4gICAgICAgIC8vIFdlIHNob3VsZCBub3QgcmVuYW1lIGl0IGJhY2sgdW50aWwgaHR0cHM6Ly9naXRodWIuY29tL3RlcnNlci90ZXJzZXIvaXNzdWVzLzYxNSBpcyBmaXhlZC5cbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGdldEppdE9wdGlvbnMoKTtcbiAgICAgICAgbGV0IHByZXNlcnZlV2hpdGVzcGFjZXMgPSBtZXRhZGF0YS5wcmVzZXJ2ZVdoaXRlc3BhY2VzO1xuICAgICAgICBpZiAocHJlc2VydmVXaGl0ZXNwYWNlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgaWYgKG9wdGlvbnMgIT09IG51bGwgJiYgb3B0aW9ucy5wcmVzZXJ2ZVdoaXRlc3BhY2VzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHByZXNlcnZlV2hpdGVzcGFjZXMgPSBvcHRpb25zLnByZXNlcnZlV2hpdGVzcGFjZXM7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByZXNlcnZlV2hpdGVzcGFjZXMgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGVuY2Fwc3VsYXRpb24gPSBtZXRhZGF0YS5lbmNhcHN1bGF0aW9uO1xuICAgICAgICBpZiAoZW5jYXBzdWxhdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgaWYgKG9wdGlvbnMgIT09IG51bGwgJiYgb3B0aW9ucy5kZWZhdWx0RW5jYXBzdWxhdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBlbmNhcHN1bGF0aW9uID0gb3B0aW9ucy5kZWZhdWx0RW5jYXBzdWxhdGlvbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZW5jYXBzdWxhdGlvbiA9IFZpZXdFbmNhcHN1bGF0aW9uLkVtdWxhdGVkO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlVXJsID0gbWV0YWRhdGEudGVtcGxhdGVVcmwgfHwgYG5nOi8vLyR7dHlwZS5uYW1lfS90ZW1wbGF0ZS5odG1sYDtcbiAgICAgICAgY29uc3QgbWV0YTogUjNDb21wb25lbnRNZXRhZGF0YUZhY2FkZSA9IHtcbiAgICAgICAgICAuLi5kaXJlY3RpdmVNZXRhZGF0YSh0eXBlLCBtZXRhZGF0YSksXG4gICAgICAgICAgdHlwZVNvdXJjZVNwYW46IGNvbXBpbGVyLmNyZWF0ZVBhcnNlU291cmNlU3BhbignQ29tcG9uZW50JywgdHlwZS5uYW1lLCB0ZW1wbGF0ZVVybCksXG4gICAgICAgICAgdGVtcGxhdGU6IG1ldGFkYXRhLnRlbXBsYXRlIHx8ICcnLFxuICAgICAgICAgIHByZXNlcnZlV2hpdGVzcGFjZXMsXG4gICAgICAgICAgc3R5bGVzOiBtZXRhZGF0YS5zdHlsZXMgfHwgRU1QVFlfQVJSQVksXG4gICAgICAgICAgYW5pbWF0aW9uczogbWV0YWRhdGEuYW5pbWF0aW9ucyxcbiAgICAgICAgICAvLyBKSVQgY29tcG9uZW50cyBhcmUgYWx3YXlzIGNvbXBpbGVkIGFnYWluc3QgYW4gZW1wdHkgc2V0IG9mIGBkZWNsYXJhdGlvbnNgLiBJbnN0ZWFkLCB0aGVcbiAgICAgICAgICAvLyBgZGlyZWN0aXZlRGVmc2AgYW5kIGBwaXBlRGVmc2AgYXJlIHVwZGF0ZWQgYXQgYSBsYXRlciBwb2ludDpcbiAgICAgICAgICAvLyAgKiBmb3IgTmdNb2R1bGUtYmFzZWQgY29tcG9uZW50cywgdGhleSdyZSBzZXQgd2hlbiB0aGUgTmdNb2R1bGUgd2hpY2ggZGVjbGFyZXMgdGhlXG4gICAgICAgICAgLy8gICAgY29tcG9uZW50IHJlc29sdmVzIGluIHRoZSBtb2R1bGUgc2NvcGluZyBxdWV1ZVxuICAgICAgICAgIC8vICAqIGZvciBzdGFuZGFsb25lIGNvbXBvbmVudHMsIHRoZXkncmUgc2V0IGp1c3QgYmVsb3csIGFmdGVyIGBjb21waWxlQ29tcG9uZW50YC5cbiAgICAgICAgICBkZWNsYXJhdGlvbnM6IFtdLFxuICAgICAgICAgIGNoYW5nZURldGVjdGlvbjogbWV0YWRhdGEuY2hhbmdlRGV0ZWN0aW9uLFxuICAgICAgICAgIGVuY2Fwc3VsYXRpb24sXG4gICAgICAgICAgaW50ZXJwb2xhdGlvbjogbWV0YWRhdGEuaW50ZXJwb2xhdGlvbixcbiAgICAgICAgICB2aWV3UHJvdmlkZXJzOiBtZXRhZGF0YS52aWV3UHJvdmlkZXJzIHx8IG51bGwsXG4gICAgICAgIH07XG5cbiAgICAgICAgY29tcGlsYXRpb25EZXB0aCsrO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChtZXRhLnVzZXNJbmhlcml0YW5jZSkge1xuICAgICAgICAgICAgYWRkRGlyZWN0aXZlRGVmVG9VbmRlY29yYXRlZFBhcmVudHModHlwZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5nQ29tcG9uZW50RGVmID1cbiAgICAgICAgICAgICAgY29tcGlsZXIuY29tcGlsZUNvbXBvbmVudChhbmd1bGFyQ29yZUVudiwgdGVtcGxhdGVVcmwsIG1ldGEpIGFzIENvbXBvbmVudERlZjx1bmtub3duPjtcblxuICAgICAgICAgIGlmIChtZXRhZGF0YS5zdGFuZGFsb25lKSB7XG4gICAgICAgICAgICAvLyBQYXRjaCB0aGUgY29tcG9uZW50IGRlZmluaXRpb24gZm9yIHN0YW5kYWxvbmUgY29tcG9uZW50cyB3aXRoIGBkaXJlY3RpdmVEZWZzYCBhbmRcbiAgICAgICAgICAgIC8vIGBwaXBlRGVmc2AgZnVuY3Rpb25zIHdoaWNoIGxhemlseSBjb21wdXRlIHRoZSBkaXJlY3RpdmVzL3BpcGVzIGF2YWlsYWJsZSBpbiB0aGVcbiAgICAgICAgICAgIC8vIHN0YW5kYWxvbmUgY29tcG9uZW50LiBBbHNvIHNldCBgZGVwZW5kZW5jaWVzYCB0byB0aGUgbGF6aWx5IHJlc29sdmVkIGxpc3Qgb2YgaW1wb3J0cy5cbiAgICAgICAgICAgIGNvbnN0IGltcG9ydHM6IFR5cGU8YW55PltdID0gZmxhdHRlbihtZXRhZGF0YS5pbXBvcnRzIHx8IEVNUFRZX0FSUkFZKTtcbiAgICAgICAgICAgIGNvbnN0IHtkaXJlY3RpdmVEZWZzLCBwaXBlRGVmc30gPSBnZXRTdGFuZGFsb25lRGVmRnVuY3Rpb25zKHR5cGUsIGltcG9ydHMpO1xuICAgICAgICAgICAgbmdDb21wb25lbnREZWYuZGlyZWN0aXZlRGVmcyA9IGRpcmVjdGl2ZURlZnM7XG4gICAgICAgICAgICBuZ0NvbXBvbmVudERlZi5waXBlRGVmcyA9IHBpcGVEZWZzO1xuICAgICAgICAgICAgbmdDb21wb25lbnREZWYuZGVwZW5kZW5jaWVzID0gKCkgPT4gaW1wb3J0cy5tYXAocmVzb2x2ZUZvcndhcmRSZWYpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAvLyBFbnN1cmUgdGhhdCB0aGUgY29tcGlsYXRpb24gZGVwdGggaXMgZGVjcmVtZW50ZWQgZXZlbiB3aGVuIHRoZSBjb21waWxhdGlvbiBmYWlsZWQuXG4gICAgICAgICAgY29tcGlsYXRpb25EZXB0aC0tO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbXBpbGF0aW9uRGVwdGggPT09IDApIHtcbiAgICAgICAgICAvLyBXaGVuIE5nTW9kdWxlIGRlY29yYXRvciBleGVjdXRlZCwgd2UgZW5xdWV1ZWQgdGhlIG1vZHVsZSBkZWZpbml0aW9uIHN1Y2ggdGhhdFxuICAgICAgICAgIC8vIGl0IHdvdWxkIG9ubHkgZGVxdWV1ZSBhbmQgYWRkIGl0c2VsZiBhcyBtb2R1bGUgc2NvcGUgdG8gYWxsIG9mIGl0cyBkZWNsYXJhdGlvbnMsXG4gICAgICAgICAgLy8gYnV0IG9ubHkgaWYgIGlmIGFsbCBvZiBpdHMgZGVjbGFyYXRpb25zIGhhZCByZXNvbHZlZC4gVGhpcyBjYWxsIHJ1bnMgdGhlIGNoZWNrXG4gICAgICAgICAgLy8gdG8gc2VlIGlmIGFueSBtb2R1bGVzIHRoYXQgYXJlIGluIHRoZSBxdWV1ZSBjYW4gYmUgZGVxdWV1ZWQgYW5kIGFkZCBzY29wZSB0b1xuICAgICAgICAgIC8vIHRoZWlyIGRlY2xhcmF0aW9ucy5cbiAgICAgICAgICBmbHVzaE1vZHVsZVNjb3BpbmdRdWV1ZUFzTXVjaEFzUG9zc2libGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGNvbXBvbmVudCBjb21waWxhdGlvbiBpcyBhc3luYywgdGhlbiB0aGUgQE5nTW9kdWxlIGFubm90YXRpb24gd2hpY2ggZGVjbGFyZXMgdGhlXG4gICAgICAgIC8vIGNvbXBvbmVudCBtYXkgZXhlY3V0ZSBhbmQgc2V0IGFuIG5nU2VsZWN0b3JTY29wZSBwcm9wZXJ0eSBvbiB0aGUgY29tcG9uZW50IHR5cGUuIFRoaXNcbiAgICAgICAgLy8gYWxsb3dzIHRoZSBjb21wb25lbnQgdG8gcGF0Y2ggaXRzZWxmIHdpdGggZGlyZWN0aXZlRGVmcyBmcm9tIHRoZSBtb2R1bGUgYWZ0ZXIgaXRcbiAgICAgICAgLy8gZmluaXNoZXMgY29tcGlsaW5nLlxuICAgICAgICBpZiAoaGFzU2VsZWN0b3JTY29wZSh0eXBlKSkge1xuICAgICAgICAgIGNvbnN0IHNjb3BlcyA9IHRyYW5zaXRpdmVTY29wZXNGb3IodHlwZS5uZ1NlbGVjdG9yU2NvcGUpO1xuICAgICAgICAgIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlKG5nQ29tcG9uZW50RGVmLCBzY29wZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1ldGFkYXRhLnNjaGVtYXMpIHtcbiAgICAgICAgICBpZiAobWV0YWRhdGEuc3RhbmRhbG9uZSkge1xuICAgICAgICAgICAgbmdDb21wb25lbnREZWYuc2NoZW1hcyA9IG1ldGFkYXRhLnNjaGVtYXM7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVGhlICdzY2hlbWFzJyB3YXMgc3BlY2lmaWVkIGZvciB0aGUgJHtcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnlGb3JFcnJvcih0eXBlKX0gYnV0IGlzIG9ubHkgdmFsaWQgb24gYSBjb21wb25lbnQgdGhhdCBpcyBzdGFuZGFsb25lLmApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChtZXRhZGF0YS5zdGFuZGFsb25lKSB7XG4gICAgICAgICAgbmdDb21wb25lbnREZWYuc2NoZW1hcyA9IFtdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbmdDb21wb25lbnREZWY7XG4gICAgfSxcbiAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGUsXG4gIH0pO1xufVxuXG4vKipcbiAqIEJ1aWxkIG1lbW9pemVkIGBkaXJlY3RpdmVEZWZzYCBhbmQgYHBpcGVEZWZzYCBmdW5jdGlvbnMgZm9yIHRoZSBjb21wb25lbnQgZGVmaW5pdGlvbiBvZiBhXG4gKiBzdGFuZGFsb25lIGNvbXBvbmVudCwgd2hpY2ggcHJvY2VzcyBgaW1wb3J0c2AgYW5kIGZpbHRlciBvdXQgZGlyZWN0aXZlcyBhbmQgcGlwZXMuIFRoZSB1c2Ugb2ZcbiAqIG1lbW9pemVkIGZ1bmN0aW9ucyBoZXJlIGFsbG93cyBmb3IgdGhlIGRlbGF5ZWQgcmVzb2x1dGlvbiBvZiBhbnkgYGZvcndhcmRSZWZgcyBwcmVzZW50IGluIHRoZVxuICogY29tcG9uZW50J3MgYGltcG9ydHNgLlxuICovXG5mdW5jdGlvbiBnZXRTdGFuZGFsb25lRGVmRnVuY3Rpb25zKHR5cGU6IFR5cGU8YW55PiwgaW1wb3J0czogVHlwZTxhbnk+W10pOiB7XG4gIGRpcmVjdGl2ZURlZnM6ICgpID0+IERpcmVjdGl2ZURlZkxpc3QsXG4gIHBpcGVEZWZzOiAoKSA9PiBQaXBlRGVmTGlzdCxcbn0ge1xuICBsZXQgY2FjaGVkRGlyZWN0aXZlRGVmczogRGlyZWN0aXZlRGVmTGlzdHxudWxsID0gbnVsbDtcbiAgbGV0IGNhY2hlZFBpcGVEZWZzOiBQaXBlRGVmTGlzdHxudWxsID0gbnVsbDtcbiAgY29uc3QgZGlyZWN0aXZlRGVmcyA9ICgpID0+IHtcbiAgICBpZiAoIVVTRV9SVU5USU1FX0RFUFNfVFJBQ0tFUl9GT1JfSklUKSB7XG4gICAgICBpZiAoY2FjaGVkRGlyZWN0aXZlRGVmcyA9PT0gbnVsbCkge1xuICAgICAgICAvLyBTdGFuZGFsb25lIGNvbXBvbmVudHMgYXJlIGFsd2F5cyBhYmxlIHRvIHNlbGYtcmVmZXJlbmNlLCBzbyBpbmNsdWRlIHRoZSBjb21wb25lbnQncyBvd25cbiAgICAgICAgLy8gZGVmaW5pdGlvbiBpbiBpdHMgYGRpcmVjdGl2ZURlZnNgLlxuICAgICAgICBjYWNoZWREaXJlY3RpdmVEZWZzID0gW2dldENvbXBvbmVudERlZih0eXBlKSFdO1xuICAgICAgICBjb25zdCBzZWVuID0gbmV3IFNldDxUeXBlPHVua25vd24+PihbdHlwZV0pO1xuXG4gICAgICAgIGZvciAoY29uc3QgcmF3RGVwIG9mIGltcG9ydHMpIHtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgdmVyaWZ5U3RhbmRhbG9uZUltcG9ydChyYXdEZXAsIHR5cGUpO1xuXG4gICAgICAgICAgY29uc3QgZGVwID0gcmVzb2x2ZUZvcndhcmRSZWYocmF3RGVwKTtcbiAgICAgICAgICBpZiAoc2Vlbi5oYXMoZGVwKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHNlZW4uYWRkKGRlcCk7XG5cbiAgICAgICAgICBpZiAoISFnZXROZ01vZHVsZURlZihkZXApKSB7XG4gICAgICAgICAgICBjb25zdCBzY29wZSA9IHRyYW5zaXRpdmVTY29wZXNGb3IoZGVwKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgZGlyIG9mIHNjb3BlLmV4cG9ydGVkLmRpcmVjdGl2ZXMpIHtcbiAgICAgICAgICAgICAgY29uc3QgZGVmID0gZ2V0Q29tcG9uZW50RGVmKGRpcikgfHwgZ2V0RGlyZWN0aXZlRGVmKGRpcik7XG4gICAgICAgICAgICAgIGlmIChkZWYgJiYgIXNlZW4uaGFzKGRpcikpIHtcbiAgICAgICAgICAgICAgICBzZWVuLmFkZChkaXIpO1xuICAgICAgICAgICAgICAgIGNhY2hlZERpcmVjdGl2ZURlZnMucHVzaChkZWYpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGRlZiA9IGdldENvbXBvbmVudERlZihkZXApIHx8IGdldERpcmVjdGl2ZURlZihkZXApO1xuICAgICAgICAgICAgaWYgKGRlZikge1xuICAgICAgICAgICAgICBjYWNoZWREaXJlY3RpdmVEZWZzLnB1c2goZGVmKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBjYWNoZWREaXJlY3RpdmVEZWZzO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgIGZvciAoY29uc3QgcmF3RGVwIG9mIGltcG9ydHMpIHtcbiAgICAgICAgICB2ZXJpZnlTdGFuZGFsb25lSW1wb3J0KHJhd0RlcCwgdHlwZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFpc0NvbXBvbmVudCh0eXBlKSkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNjb3BlID0gZGVwc1RyYWNrZXIuZ2V0U3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlKHR5cGUsIGltcG9ydHMpO1xuXG4gICAgICByZXR1cm4gWy4uLnNjb3BlLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXNdXG4gICAgICAgICAgLm1hcChwID0+IChnZXRDb21wb25lbnREZWYocCkgfHwgZ2V0RGlyZWN0aXZlRGVmKHApKSEpXG4gICAgICAgICAgLmZpbHRlcihkID0+IGQgIT09IG51bGwpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBwaXBlRGVmcyA9ICgpID0+IHtcbiAgICBpZiAoIVVTRV9SVU5USU1FX0RFUFNfVFJBQ0tFUl9GT1JfSklUKSB7XG4gICAgICBpZiAoY2FjaGVkUGlwZURlZnMgPT09IG51bGwpIHtcbiAgICAgICAgY2FjaGVkUGlwZURlZnMgPSBbXTtcbiAgICAgICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8VHlwZTx1bmtub3duPj4oKTtcblxuICAgICAgICBmb3IgKGNvbnN0IHJhd0RlcCBvZiBpbXBvcnRzKSB7XG4gICAgICAgICAgY29uc3QgZGVwID0gcmVzb2x2ZUZvcndhcmRSZWYocmF3RGVwKTtcbiAgICAgICAgICBpZiAoc2Vlbi5oYXMoZGVwKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHNlZW4uYWRkKGRlcCk7XG5cbiAgICAgICAgICBpZiAoISFnZXROZ01vZHVsZURlZihkZXApKSB7XG4gICAgICAgICAgICBjb25zdCBzY29wZSA9IHRyYW5zaXRpdmVTY29wZXNGb3IoZGVwKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcGlwZSBvZiBzY29wZS5leHBvcnRlZC5waXBlcykge1xuICAgICAgICAgICAgICBjb25zdCBkZWYgPSBnZXRQaXBlRGVmKHBpcGUpO1xuICAgICAgICAgICAgICBpZiAoZGVmICYmICFzZWVuLmhhcyhwaXBlKSkge1xuICAgICAgICAgICAgICAgIHNlZW4uYWRkKHBpcGUpO1xuICAgICAgICAgICAgICAgIGNhY2hlZFBpcGVEZWZzLnB1c2goZGVmKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBkZWYgPSBnZXRQaXBlRGVmKGRlcCk7XG4gICAgICAgICAgICBpZiAoZGVmKSB7XG4gICAgICAgICAgICAgIGNhY2hlZFBpcGVEZWZzLnB1c2goZGVmKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBjYWNoZWRQaXBlRGVmcztcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICBmb3IgKGNvbnN0IHJhd0RlcCBvZiBpbXBvcnRzKSB7XG4gICAgICAgICAgdmVyaWZ5U3RhbmRhbG9uZUltcG9ydChyYXdEZXAsIHR5cGUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghaXNDb21wb25lbnQodHlwZSkpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzY29wZSA9IGRlcHNUcmFja2VyLmdldFN0YW5kYWxvbmVDb21wb25lbnRTY29wZSh0eXBlLCBpbXBvcnRzKTtcblxuICAgICAgcmV0dXJuIFsuLi5zY29wZS5jb21waWxhdGlvbi5waXBlc10ubWFwKHAgPT4gZ2V0UGlwZURlZihwKSEpLmZpbHRlcihkID0+IGQgIT09IG51bGwpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4ge1xuICAgIGRpcmVjdGl2ZURlZnMsXG4gICAgcGlwZURlZnMsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGhhc1NlbGVjdG9yU2NvcGU8VD4oY29tcG9uZW50OiBUeXBlPFQ+KTogY29tcG9uZW50IGlzIFR5cGU8VD4mXG4gICAge25nU2VsZWN0b3JTY29wZTogVHlwZTxhbnk+fSB7XG4gIHJldHVybiAoY29tcG9uZW50IGFzIHtuZ1NlbGVjdG9yU2NvcGU/OiBhbnl9KS5uZ1NlbGVjdG9yU2NvcGUgIT09IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBDb21waWxlIGFuIEFuZ3VsYXIgZGlyZWN0aXZlIGFjY29yZGluZyB0byBpdHMgZGVjb3JhdG9yIG1ldGFkYXRhLCBhbmQgcGF0Y2ggdGhlIHJlc3VsdGluZ1xuICogZGlyZWN0aXZlIGRlZiBvbnRvIHRoZSBjb21wb25lbnQgdHlwZS5cbiAqXG4gKiBJbiB0aGUgZXZlbnQgdGhhdCBjb21waWxhdGlvbiBpcyBub3QgaW1tZWRpYXRlLCBgY29tcGlsZURpcmVjdGl2ZWAgd2lsbCByZXR1cm4gYSBgUHJvbWlzZWAgd2hpY2hcbiAqIHdpbGwgcmVzb2x2ZSB3aGVuIGNvbXBpbGF0aW9uIGNvbXBsZXRlcyBhbmQgdGhlIGRpcmVjdGl2ZSBiZWNvbWVzIHVzYWJsZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVEaXJlY3RpdmUodHlwZTogVHlwZTxhbnk+LCBkaXJlY3RpdmU6IERpcmVjdGl2ZXxudWxsKTogdm9pZCB7XG4gIGxldCBuZ0RpcmVjdGl2ZURlZjogYW55ID0gbnVsbDtcblxuICBhZGREaXJlY3RpdmVGYWN0b3J5RGVmKHR5cGUsIGRpcmVjdGl2ZSB8fCB7fSk7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIE5HX0RJUl9ERUYsIHtcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChuZ0RpcmVjdGl2ZURlZiA9PT0gbnVsbCkge1xuICAgICAgICAvLyBgZGlyZWN0aXZlYCBjYW4gYmUgbnVsbCBpbiB0aGUgY2FzZSBvZiBhYnN0cmFjdCBkaXJlY3RpdmVzIGFzIGEgYmFzZSBjbGFzc1xuICAgICAgICAvLyB0aGF0IHVzZSBgQERpcmVjdGl2ZSgpYCB3aXRoIG5vIHNlbGVjdG9yLiBJbiB0aGF0IGNhc2UsIHBhc3MgZW1wdHkgb2JqZWN0IHRvIHRoZVxuICAgICAgICAvLyBgZGlyZWN0aXZlTWV0YWRhdGFgIGZ1bmN0aW9uIGluc3RlYWQgb2YgbnVsbC5cbiAgICAgICAgY29uc3QgbWV0YSA9IGdldERpcmVjdGl2ZU1ldGFkYXRhKHR5cGUsIGRpcmVjdGl2ZSB8fCB7fSk7XG4gICAgICAgIGNvbnN0IGNvbXBpbGVyID1cbiAgICAgICAgICAgIGdldENvbXBpbGVyRmFjYWRlKHt1c2FnZTogSml0Q29tcGlsZXJVc2FnZS5EZWNvcmF0b3IsIGtpbmQ6ICdkaXJlY3RpdmUnLCB0eXBlfSk7XG4gICAgICAgIG5nRGlyZWN0aXZlRGVmID1cbiAgICAgICAgICAgIGNvbXBpbGVyLmNvbXBpbGVEaXJlY3RpdmUoYW5ndWxhckNvcmVFbnYsIG1ldGEuc291cmNlTWFwVXJsLCBtZXRhLm1ldGFkYXRhKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZ0RpcmVjdGl2ZURlZjtcbiAgICB9LFxuICAgIC8vIE1ha2UgdGhlIHByb3BlcnR5IGNvbmZpZ3VyYWJsZSBpbiBkZXYgbW9kZSB0byBhbGxvdyBvdmVycmlkaW5nIGluIHRlc3RzXG4gICAgY29uZmlndXJhYmxlOiAhIW5nRGV2TW9kZSxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldERpcmVjdGl2ZU1ldGFkYXRhKHR5cGU6IFR5cGU8YW55PiwgbWV0YWRhdGE6IERpcmVjdGl2ZSkge1xuICBjb25zdCBuYW1lID0gdHlwZSAmJiB0eXBlLm5hbWU7XG4gIGNvbnN0IHNvdXJjZU1hcFVybCA9IGBuZzovLy8ke25hbWV9L8m1ZGlyLmpzYDtcbiAgY29uc3QgY29tcGlsZXIgPSBnZXRDb21waWxlckZhY2FkZSh7dXNhZ2U6IEppdENvbXBpbGVyVXNhZ2UuRGVjb3JhdG9yLCBraW5kOiAnZGlyZWN0aXZlJywgdHlwZX0pO1xuICBjb25zdCBmYWNhZGUgPSBkaXJlY3RpdmVNZXRhZGF0YSh0eXBlIGFzIENvbXBvbmVudFR5cGU8YW55PiwgbWV0YWRhdGEpO1xuICBmYWNhZGUudHlwZVNvdXJjZVNwYW4gPSBjb21waWxlci5jcmVhdGVQYXJzZVNvdXJjZVNwYW4oJ0RpcmVjdGl2ZScsIG5hbWUsIHNvdXJjZU1hcFVybCk7XG4gIGlmIChmYWNhZGUudXNlc0luaGVyaXRhbmNlKSB7XG4gICAgYWRkRGlyZWN0aXZlRGVmVG9VbmRlY29yYXRlZFBhcmVudHModHlwZSk7XG4gIH1cbiAgcmV0dXJuIHttZXRhZGF0YTogZmFjYWRlLCBzb3VyY2VNYXBVcmx9O1xufVxuXG5mdW5jdGlvbiBhZGREaXJlY3RpdmVGYWN0b3J5RGVmKHR5cGU6IFR5cGU8YW55PiwgbWV0YWRhdGE6IERpcmVjdGl2ZXxDb21wb25lbnQpIHtcbiAgbGV0IG5nRmFjdG9yeURlZjogYW55ID0gbnVsbDtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgTkdfRkFDVE9SWV9ERUYsIHtcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChuZ0ZhY3RvcnlEZWYgPT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgbWV0YSA9IGdldERpcmVjdGl2ZU1ldGFkYXRhKHR5cGUsIG1ldGFkYXRhKTtcbiAgICAgICAgY29uc3QgY29tcGlsZXIgPVxuICAgICAgICAgICAgZ2V0Q29tcGlsZXJGYWNhZGUoe3VzYWdlOiBKaXRDb21waWxlclVzYWdlLkRlY29yYXRvciwga2luZDogJ2RpcmVjdGl2ZScsIHR5cGV9KTtcbiAgICAgICAgbmdGYWN0b3J5RGVmID0gY29tcGlsZXIuY29tcGlsZUZhY3RvcnkoYW5ndWxhckNvcmVFbnYsIGBuZzovLy8ke3R5cGUubmFtZX0vybVmYWMuanNgLCB7XG4gICAgICAgICAgbmFtZTogbWV0YS5tZXRhZGF0YS5uYW1lLFxuICAgICAgICAgIHR5cGU6IG1ldGEubWV0YWRhdGEudHlwZSxcbiAgICAgICAgICB0eXBlQXJndW1lbnRDb3VudDogMCxcbiAgICAgICAgICBkZXBzOiByZWZsZWN0RGVwZW5kZW5jaWVzKHR5cGUpLFxuICAgICAgICAgIHRhcmdldDogY29tcGlsZXIuRmFjdG9yeVRhcmdldC5EaXJlY3RpdmVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmdGYWN0b3J5RGVmO1xuICAgIH0sXG4gICAgLy8gTWFrZSB0aGUgcHJvcGVydHkgY29uZmlndXJhYmxlIGluIGRldiBtb2RlIHRvIGFsbG93IG92ZXJyaWRpbmcgaW4gdGVzdHNcbiAgICBjb25maWd1cmFibGU6ICEhbmdEZXZNb2RlLFxuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dGVuZHNEaXJlY3RseUZyb21PYmplY3QodHlwZTogVHlwZTxhbnk+KTogYm9vbGVhbiB7XG4gIHJldHVybiBPYmplY3QuZ2V0UHJvdG90eXBlT2YodHlwZS5wcm90b3R5cGUpID09PSBPYmplY3QucHJvdG90eXBlO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdGhlIGBSM0RpcmVjdGl2ZU1ldGFkYXRhYCBmb3IgYSBwYXJ0aWN1bGFyIGRpcmVjdGl2ZSAoZWl0aGVyIGEgYERpcmVjdGl2ZWAgb3IgYVxuICogYENvbXBvbmVudGApLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlTWV0YWRhdGEodHlwZTogVHlwZTxhbnk+LCBtZXRhZGF0YTogRGlyZWN0aXZlKTogUjNEaXJlY3RpdmVNZXRhZGF0YUZhY2FkZSB7XG4gIC8vIFJlZmxlY3QgaW5wdXRzIGFuZCBvdXRwdXRzLlxuICBjb25zdCByZWZsZWN0ID0gZ2V0UmVmbGVjdCgpO1xuICBjb25zdCBwcm9wTWV0YWRhdGEgPSByZWZsZWN0Lm93blByb3BNZXRhZGF0YSh0eXBlKTtcblxuICByZXR1cm4ge1xuICAgIG5hbWU6IHR5cGUubmFtZSxcbiAgICB0eXBlOiB0eXBlLFxuICAgIHNlbGVjdG9yOiBtZXRhZGF0YS5zZWxlY3RvciAhPT0gdW5kZWZpbmVkID8gbWV0YWRhdGEuc2VsZWN0b3IgOiBudWxsLFxuICAgIGhvc3Q6IG1ldGFkYXRhLmhvc3QgfHwgRU1QVFlfT0JKLFxuICAgIHByb3BNZXRhZGF0YTogcHJvcE1ldGFkYXRhLFxuICAgIGlucHV0czogbWV0YWRhdGEuaW5wdXRzIHx8IEVNUFRZX0FSUkFZLFxuICAgIG91dHB1dHM6IG1ldGFkYXRhLm91dHB1dHMgfHwgRU1QVFlfQVJSQVksXG4gICAgcXVlcmllczogZXh0cmFjdFF1ZXJpZXNNZXRhZGF0YSh0eXBlLCBwcm9wTWV0YWRhdGEsIGlzQ29udGVudFF1ZXJ5KSxcbiAgICBsaWZlY3ljbGU6IHt1c2VzT25DaGFuZ2VzOiByZWZsZWN0Lmhhc0xpZmVjeWNsZUhvb2sodHlwZSwgJ25nT25DaGFuZ2VzJyl9LFxuICAgIHR5cGVTb3VyY2VTcGFuOiBudWxsISxcbiAgICB1c2VzSW5oZXJpdGFuY2U6ICFleHRlbmRzRGlyZWN0bHlGcm9tT2JqZWN0KHR5cGUpLFxuICAgIGV4cG9ydEFzOiBleHRyYWN0RXhwb3J0QXMobWV0YWRhdGEuZXhwb3J0QXMpLFxuICAgIHByb3ZpZGVyczogbWV0YWRhdGEucHJvdmlkZXJzIHx8IG51bGwsXG4gICAgdmlld1F1ZXJpZXM6IGV4dHJhY3RRdWVyaWVzTWV0YWRhdGEodHlwZSwgcHJvcE1ldGFkYXRhLCBpc1ZpZXdRdWVyeSksXG4gICAgaXNTdGFuZGFsb25lOiAhIW1ldGFkYXRhLnN0YW5kYWxvbmUsXG4gICAgaXNTaWduYWw6ICEhbWV0YWRhdGEuc2lnbmFscyxcbiAgICBob3N0RGlyZWN0aXZlczogbWV0YWRhdGEuaG9zdERpcmVjdGl2ZXM/Lm1hcChcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGl2ZSA9PiB0eXBlb2YgZGlyZWN0aXZlID09PSAnZnVuY3Rpb24nID8ge2RpcmVjdGl2ZX0gOiBkaXJlY3RpdmUpIHx8XG4gICAgICAgIG51bGxcbiAgfTtcbn1cblxuLyoqXG4gKiBBZGRzIGEgZGlyZWN0aXZlIGRlZmluaXRpb24gdG8gYWxsIHBhcmVudCBjbGFzc2VzIG9mIGEgdHlwZSB0aGF0IGRvbid0IGhhdmUgYW4gQW5ndWxhciBkZWNvcmF0b3IuXG4gKi9cbmZ1bmN0aW9uIGFkZERpcmVjdGl2ZURlZlRvVW5kZWNvcmF0ZWRQYXJlbnRzKHR5cGU6IFR5cGU8YW55Pikge1xuICBjb25zdCBvYmpQcm90b3R5cGUgPSBPYmplY3QucHJvdG90eXBlO1xuICBsZXQgcGFyZW50ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHR5cGUucHJvdG90eXBlKS5jb25zdHJ1Y3RvcjtcblxuICAvLyBHbyB1cCB0aGUgcHJvdG90eXBlIHVudGlsIHdlIGhpdCBgT2JqZWN0YC5cbiAgd2hpbGUgKHBhcmVudCAmJiBwYXJlbnQgIT09IG9ialByb3RvdHlwZSkge1xuICAgIC8vIFNpbmNlIGluaGVyaXRhbmNlIHdvcmtzIGlmIHRoZSBjbGFzcyB3YXMgYW5ub3RhdGVkIGFscmVhZHksIHdlIG9ubHkgbmVlZCB0byBhZGRcbiAgICAvLyB0aGUgZGVmIGlmIHRoZXJlIGFyZSBubyBhbm5vdGF0aW9ucyBhbmQgdGhlIGRlZiBoYXNuJ3QgYmVlbiBjcmVhdGVkIGFscmVhZHkuXG4gICAgaWYgKCFnZXREaXJlY3RpdmVEZWYocGFyZW50KSAmJiAhZ2V0Q29tcG9uZW50RGVmKHBhcmVudCkgJiZcbiAgICAgICAgc2hvdWxkQWRkQWJzdHJhY3REaXJlY3RpdmUocGFyZW50KSkge1xuICAgICAgY29tcGlsZURpcmVjdGl2ZShwYXJlbnQsIG51bGwpO1xuICAgIH1cbiAgICBwYXJlbnQgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YocGFyZW50KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjb252ZXJ0VG9SM1F1ZXJ5UHJlZGljYXRlKHNlbGVjdG9yOiBhbnkpOiBhbnl8c3RyaW5nW10ge1xuICByZXR1cm4gdHlwZW9mIHNlbGVjdG9yID09PSAnc3RyaW5nJyA/IHNwbGl0QnlDb21tYShzZWxlY3RvcikgOiByZXNvbHZlRm9yd2FyZFJlZihzZWxlY3Rvcik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0VG9SM1F1ZXJ5TWV0YWRhdGEocHJvcGVydHlOYW1lOiBzdHJpbmcsIGFubjogUXVlcnkpOiBSM1F1ZXJ5TWV0YWRhdGFGYWNhZGUge1xuICByZXR1cm4ge1xuICAgIHByb3BlcnR5TmFtZTogcHJvcGVydHlOYW1lLFxuICAgIHByZWRpY2F0ZTogY29udmVydFRvUjNRdWVyeVByZWRpY2F0ZShhbm4uc2VsZWN0b3IpLFxuICAgIGRlc2NlbmRhbnRzOiBhbm4uZGVzY2VuZGFudHMsXG4gICAgZmlyc3Q6IGFubi5maXJzdCxcbiAgICByZWFkOiBhbm4ucmVhZCA/IGFubi5yZWFkIDogbnVsbCxcbiAgICBzdGF0aWM6ICEhYW5uLnN0YXRpYyxcbiAgICBlbWl0RGlzdGluY3RDaGFuZ2VzT25seTogISFhbm4uZW1pdERpc3RpbmN0Q2hhbmdlc09ubHksXG4gIH07XG59XG5mdW5jdGlvbiBleHRyYWN0UXVlcmllc01ldGFkYXRhKFxuICAgIHR5cGU6IFR5cGU8YW55PiwgcHJvcE1ldGFkYXRhOiB7W2tleTogc3RyaW5nXTogYW55W119LFxuICAgIGlzUXVlcnlBbm46IChhbm46IGFueSkgPT4gYW5uIGlzIFF1ZXJ5KTogUjNRdWVyeU1ldGFkYXRhRmFjYWRlW10ge1xuICBjb25zdCBxdWVyaWVzTWV0YTogUjNRdWVyeU1ldGFkYXRhRmFjYWRlW10gPSBbXTtcbiAgZm9yIChjb25zdCBmaWVsZCBpbiBwcm9wTWV0YWRhdGEpIHtcbiAgICBpZiAocHJvcE1ldGFkYXRhLmhhc093blByb3BlcnR5KGZpZWxkKSkge1xuICAgICAgY29uc3QgYW5ub3RhdGlvbnMgPSBwcm9wTWV0YWRhdGFbZmllbGRdO1xuICAgICAgYW5ub3RhdGlvbnMuZm9yRWFjaChhbm4gPT4ge1xuICAgICAgICBpZiAoaXNRdWVyeUFubihhbm4pKSB7XG4gICAgICAgICAgaWYgKCFhbm4uc2VsZWN0b3IpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBgQ2FuJ3QgY29uc3RydWN0IGEgcXVlcnkgZm9yIHRoZSBwcm9wZXJ0eSBcIiR7ZmllbGR9XCIgb2YgYCArXG4gICAgICAgICAgICAgICAgYFwiJHtzdHJpbmdpZnlGb3JFcnJvcih0eXBlKX1cIiBzaW5jZSB0aGUgcXVlcnkgc2VsZWN0b3Igd2Fzbid0IGRlZmluZWQuYCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChhbm5vdGF0aW9ucy5zb21lKGlzSW5wdXRBbm5vdGF0aW9uKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgY29tYmluZSBASW5wdXQgZGVjb3JhdG9ycyB3aXRoIHF1ZXJ5IGRlY29yYXRvcnNgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcXVlcmllc01ldGEucHVzaChjb252ZXJ0VG9SM1F1ZXJ5TWV0YWRhdGEoZmllbGQsIGFubikpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHF1ZXJpZXNNZXRhO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0RXhwb3J0QXMoZXhwb3J0QXM6IHN0cmluZ3x1bmRlZmluZWQpOiBzdHJpbmdbXXxudWxsIHtcbiAgcmV0dXJuIGV4cG9ydEFzID09PSB1bmRlZmluZWQgPyBudWxsIDogc3BsaXRCeUNvbW1hKGV4cG9ydEFzKTtcbn1cblxuZnVuY3Rpb24gaXNDb250ZW50UXVlcnkodmFsdWU6IGFueSk6IHZhbHVlIGlzIFF1ZXJ5IHtcbiAgY29uc3QgbmFtZSA9IHZhbHVlLm5nTWV0YWRhdGFOYW1lO1xuICByZXR1cm4gbmFtZSA9PT0gJ0NvbnRlbnRDaGlsZCcgfHwgbmFtZSA9PT0gJ0NvbnRlbnRDaGlsZHJlbic7XG59XG5cbmZ1bmN0aW9uIGlzVmlld1F1ZXJ5KHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBRdWVyeSB7XG4gIGNvbnN0IG5hbWUgPSB2YWx1ZS5uZ01ldGFkYXRhTmFtZTtcbiAgcmV0dXJuIG5hbWUgPT09ICdWaWV3Q2hpbGQnIHx8IG5hbWUgPT09ICdWaWV3Q2hpbGRyZW4nO1xufVxuXG5mdW5jdGlvbiBpc0lucHV0QW5ub3RhdGlvbih2YWx1ZTogYW55KTogdmFsdWUgaXMgSW5wdXQge1xuICByZXR1cm4gdmFsdWUubmdNZXRhZGF0YU5hbWUgPT09ICdJbnB1dCc7XG59XG5cbmZ1bmN0aW9uIHNwbGl0QnlDb21tYSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nW10ge1xuICByZXR1cm4gdmFsdWUuc3BsaXQoJywnKS5tYXAocGllY2UgPT4gcGllY2UudHJpbSgpKTtcbn1cblxuY29uc3QgTElGRUNZQ0xFX0hPT0tTID0gW1xuICAnbmdPbkNoYW5nZXMnLCAnbmdPbkluaXQnLCAnbmdPbkRlc3Ryb3knLCAnbmdEb0NoZWNrJywgJ25nQWZ0ZXJWaWV3SW5pdCcsICduZ0FmdGVyVmlld0NoZWNrZWQnLFxuICAnbmdBZnRlckNvbnRlbnRJbml0JywgJ25nQWZ0ZXJDb250ZW50Q2hlY2tlZCdcbl07XG5cbmZ1bmN0aW9uIHNob3VsZEFkZEFic3RyYWN0RGlyZWN0aXZlKHR5cGU6IFR5cGU8YW55Pik6IGJvb2xlYW4ge1xuICBjb25zdCByZWZsZWN0ID0gZ2V0UmVmbGVjdCgpO1xuXG4gIGlmIChMSUZFQ1lDTEVfSE9PS1Muc29tZShob29rTmFtZSA9PiByZWZsZWN0Lmhhc0xpZmVjeWNsZUhvb2sodHlwZSwgaG9va05hbWUpKSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgY29uc3QgcHJvcE1ldGFkYXRhID0gcmVmbGVjdC5wcm9wTWV0YWRhdGEodHlwZSk7XG5cbiAgZm9yIChjb25zdCBmaWVsZCBpbiBwcm9wTWV0YWRhdGEpIHtcbiAgICBjb25zdCBhbm5vdGF0aW9ucyA9IHByb3BNZXRhZGF0YVtmaWVsZF07XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFubm90YXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjdXJyZW50ID0gYW5ub3RhdGlvbnNbaV07XG4gICAgICBjb25zdCBtZXRhZGF0YU5hbWUgPSBjdXJyZW50Lm5nTWV0YWRhdGFOYW1lO1xuXG4gICAgICBpZiAoaXNJbnB1dEFubm90YXRpb24oY3VycmVudCkgfHwgaXNDb250ZW50UXVlcnkoY3VycmVudCkgfHwgaXNWaWV3UXVlcnkoY3VycmVudCkgfHxcbiAgICAgICAgICBtZXRhZGF0YU5hbWUgPT09ICdPdXRwdXQnIHx8IG1ldGFkYXRhTmFtZSA9PT0gJ0hvc3RCaW5kaW5nJyB8fFxuICAgICAgICAgIG1ldGFkYXRhTmFtZSA9PT0gJ0hvc3RMaXN0ZW5lcicpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuIl19