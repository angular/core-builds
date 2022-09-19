/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getCompilerFacade } from '../../compiler/compiler_facade';
import { isForwardRef, resolveForwardRef } from '../../di/forward_ref';
import { getReflect, reflectDependencies } from '../../di/jit/util';
import { componentNeedsResolution, maybeQueueResolutionOfComponentResources } from '../../metadata/resource_loading';
import { ViewEncapsulation } from '../../metadata/view';
import { flatten } from '../../util/array_utils';
import { EMPTY_ARRAY, EMPTY_OBJ } from '../../util/empty';
import { initNgDevMode } from '../../util/ng_dev_mode';
import { getComponentDef, getDirectiveDef, getNgModuleDef, getPipeDef } from '../definition';
import { NG_COMP_DEF, NG_DIR_DEF, NG_FACTORY_DEF } from '../fields';
import { stringifyForError } from '../util/stringify_utils';
import { angularCoreEnv } from './environment';
import { getJitOptions } from './jit_options';
import { flushModuleScopingQueueAsMuchAsPossible, patchComponentDefWithScope, transitiveScopesFor } from './module';
import { isModuleWithProviders } from './util';
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
                    isStandalone: !!metadata.standalone,
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
function getDependencyTypeForError(type) {
    if (getComponentDef(type))
        return 'component';
    if (getDirectiveDef(type))
        return 'directive';
    if (getPipeDef(type))
        return 'pipe';
    return 'type';
}
function verifyStandaloneImport(depType, importingType) {
    if (isForwardRef(depType)) {
        depType = resolveForwardRef(depType);
        if (!depType) {
            throw new Error(`Expected forwardRef function, imported from "${stringifyForError(importingType)}", to return a standalone entity or NgModule but got "${stringifyForError(depType) || depType}".`);
        }
    }
    if (getNgModuleDef(depType) == null) {
        const def = getComponentDef(depType) || getDirectiveDef(depType) || getPipeDef(depType);
        if (def != null) {
            // if a component, directive or pipe is imported make sure that it is standalone
            if (!def.standalone) {
                throw new Error(`The "${stringifyForError(depType)}" ${getDependencyTypeForError(depType)}, imported from "${stringifyForError(importingType)}", is not standalone. Did you forget to add the standalone: true flag?`);
            }
        }
        else {
            // it can be either a module with provider or an unknown (not annotated) type
            if (isModuleWithProviders(depType)) {
                throw new Error(`A module with providers was imported from "${stringifyForError(importingType)}". Modules with providers are not supported in standalone components imports.`);
            }
            else {
                throw new Error(`The "${stringifyForError(depType)}" type, imported from "${stringifyForError(importingType)}", must be a standalone component / directive / pipe or an NgModule. Did you forget to add the required @Component / @Directive / @Pipe or @NgModule annotation?`);
            }
        }
    }
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
        if (cachedDirectiveDefs === null) {
            // Standalone components are always able to self-reference, so include the component's own
            // definition in its `directiveDefs`.
            cachedDirectiveDefs = [getComponentDef(type)];
            const seen = new Set();
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
    };
    const pipeDefs = () => {
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
        hostDirectives: 
        // TODO(crisbeto): remove the `as any` usage here and down in the `map` call once
        // host directives are exposed in the public API.
        metadata
            .hostDirectives?.map((directive) => typeof directive === 'function' ? { directive } : directive) ||
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBOEMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUU5RyxPQUFPLEVBQUMsWUFBWSxFQUFFLGlCQUFpQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDckUsT0FBTyxFQUFDLFVBQVUsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBSWxFLE9BQU8sRUFBQyx3QkFBd0IsRUFBRSx3Q0FBd0MsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ25ILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3RELE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUMvQyxPQUFPLEVBQUMsV0FBVyxFQUFFLFNBQVMsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ3hELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNyRCxPQUFPLEVBQUMsZUFBZSxFQUFFLGVBQWUsRUFBRSxjQUFjLEVBQUUsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzNGLE9BQU8sRUFBQyxXQUFXLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUVsRSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUUxRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDNUMsT0FBTyxFQUFDLHVDQUF1QyxFQUFFLDBCQUEwQixFQUFFLG1CQUFtQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2xILE9B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Q0FBQyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDM0MsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9CLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUM7WUFFNUMsSUFBSSxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsSUFBSSxjQUFjLENBQUMsT0FBTyxDQUFDLElBQUksV0FBVyxDQUFDLE9BQU8sQ0FBQztnQkFDN0UsWUFBWSxLQUFLLFFBQVEsSUFBSSxZQUFZLEtBQUssYUFBYTtnQkFDM0QsWUFBWSxLQUFLLGNBQWMsRUFBRTtnQkFDbkMsT0FBTyxJQUFJLENBQUM7YUFDYjtTQUNGO0tBQ0Y7SUFFRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtnZXRDb21waWxlckZhY2FkZSwgSml0Q29tcGlsZXJVc2FnZSwgUjNEaXJlY3RpdmVNZXRhZGF0YUZhY2FkZX0gZnJvbSAnLi4vLi4vY29tcGlsZXIvY29tcGlsZXJfZmFjYWRlJztcbmltcG9ydCB7UjNDb21wb25lbnRNZXRhZGF0YUZhY2FkZSwgUjNRdWVyeU1ldGFkYXRhRmFjYWRlfSBmcm9tICcuLi8uLi9jb21waWxlci9jb21waWxlcl9mYWNhZGVfaW50ZXJmYWNlJztcbmltcG9ydCB7aXNGb3J3YXJkUmVmLCByZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi4vLi4vZGkvZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtnZXRSZWZsZWN0LCByZWZsZWN0RGVwZW5kZW5jaWVzfSBmcm9tICcuLi8uLi9kaS9qaXQvdXRpbCc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7UXVlcnl9IGZyb20gJy4uLy4uL21ldGFkYXRhL2RpJztcbmltcG9ydCB7Q29tcG9uZW50LCBEaXJlY3RpdmUsIElucHV0fSBmcm9tICcuLi8uLi9tZXRhZGF0YS9kaXJlY3RpdmVzJztcbmltcG9ydCB7Y29tcG9uZW50TmVlZHNSZXNvbHV0aW9uLCBtYXliZVF1ZXVlUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9yZXNvdXJjZV9sb2FkaW5nJztcbmltcG9ydCB7Vmlld0VuY2Fwc3VsYXRpb259IGZyb20gJy4uLy4uL21ldGFkYXRhL3ZpZXcnO1xuaW1wb3J0IHtmbGF0dGVufSBmcm9tICcuLi8uLi91dGlsL2FycmF5X3V0aWxzJztcbmltcG9ydCB7RU1QVFlfQVJSQVksIEVNUFRZX09CSn0gZnJvbSAnLi4vLi4vdXRpbC9lbXB0eSc7XG5pbXBvcnQge2luaXROZ0Rldk1vZGV9IGZyb20gJy4uLy4uL3V0aWwvbmdfZGV2X21vZGUnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWYsIGdldERpcmVjdGl2ZURlZiwgZ2V0TmdNb2R1bGVEZWYsIGdldFBpcGVEZWZ9IGZyb20gJy4uL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOR19DT01QX0RFRiwgTkdfRElSX0RFRiwgTkdfRkFDVE9SWV9ERUZ9IGZyb20gJy4uL2ZpZWxkcyc7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgQ29tcG9uZW50VHlwZSwgRGlyZWN0aXZlRGVmTGlzdCwgUGlwZURlZkxpc3R9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge3N0cmluZ2lmeUZvckVycm9yfSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeV91dGlscyc7XG5cbmltcG9ydCB7YW5ndWxhckNvcmVFbnZ9IGZyb20gJy4vZW52aXJvbm1lbnQnO1xuaW1wb3J0IHtnZXRKaXRPcHRpb25zfSBmcm9tICcuL2ppdF9vcHRpb25zJztcbmltcG9ydCB7Zmx1c2hNb2R1bGVTY29waW5nUXVldWVBc011Y2hBc1Bvc3NpYmxlLCBwYXRjaENvbXBvbmVudERlZldpdGhTY29wZSwgdHJhbnNpdGl2ZVNjb3Blc0Zvcn0gZnJvbSAnLi9tb2R1bGUnO1xuaW1wb3J0IHtpc01vZHVsZVdpdGhQcm92aWRlcnN9IGZyb20gJy4vdXRpbCc7XG5cbi8qKlxuICogS2VlcCB0cmFjayBvZiB0aGUgY29tcGlsYXRpb24gZGVwdGggdG8gYXZvaWQgcmVlbnRyYW5jeSBpc3N1ZXMgZHVyaW5nIEpJVCBjb21waWxhdGlvbi4gVGhpc1xuICogbWF0dGVycyBpbiB0aGUgZm9sbG93aW5nIHNjZW5hcmlvOlxuICpcbiAqIENvbnNpZGVyIGEgY29tcG9uZW50ICdBJyB0aGF0IGV4dGVuZHMgY29tcG9uZW50ICdCJywgYm90aCBkZWNsYXJlZCBpbiBtb2R1bGUgJ00nLiBEdXJpbmdcbiAqIHRoZSBjb21waWxhdGlvbiBvZiAnQScgdGhlIGRlZmluaXRpb24gb2YgJ0InIGlzIHJlcXVlc3RlZCB0byBjYXB0dXJlIHRoZSBpbmhlcml0YW5jZSBjaGFpbixcbiAqIHBvdGVudGlhbGx5IHRyaWdnZXJpbmcgY29tcGlsYXRpb24gb2YgJ0InLiBJZiB0aGlzIG5lc3RlZCBjb21waWxhdGlvbiB3ZXJlIHRvIHRyaWdnZXJcbiAqIGBmbHVzaE1vZHVsZVNjb3BpbmdRdWV1ZUFzTXVjaEFzUG9zc2libGVgIGl0IG1heSBoYXBwZW4gdGhhdCBtb2R1bGUgJ00nIGlzIHN0aWxsIHBlbmRpbmcgaW4gdGhlXG4gKiBxdWV1ZSwgcmVzdWx0aW5nIGluICdBJyBhbmQgJ0InIHRvIGJlIHBhdGNoZWQgd2l0aCB0aGUgTmdNb2R1bGUgc2NvcGUuIEFzIHRoZSBjb21waWxhdGlvbiBvZlxuICogJ0EnIGlzIHN0aWxsIGluIHByb2dyZXNzLCB0aGlzIHdvdWxkIGludHJvZHVjZSBhIGNpcmN1bGFyIGRlcGVuZGVuY3kgb24gaXRzIGNvbXBpbGF0aW9uLiBUbyBhdm9pZFxuICogdGhpcyBpc3N1ZSwgdGhlIG1vZHVsZSBzY29wZSBxdWV1ZSBpcyBvbmx5IGZsdXNoZWQgZm9yIGNvbXBpbGF0aW9ucyBhdCB0aGUgZGVwdGggMCwgdG8gZW5zdXJlXG4gKiBhbGwgY29tcGlsYXRpb25zIGhhdmUgZmluaXNoZWQuXG4gKi9cbmxldCBjb21waWxhdGlvbkRlcHRoID0gMDtcblxuLyoqXG4gKiBDb21waWxlIGFuIEFuZ3VsYXIgY29tcG9uZW50IGFjY29yZGluZyB0byBpdHMgZGVjb3JhdG9yIG1ldGFkYXRhLCBhbmQgcGF0Y2ggdGhlIHJlc3VsdGluZ1xuICogY29tcG9uZW50IGRlZiAoybVjbXApIG9udG8gdGhlIGNvbXBvbmVudCB0eXBlLlxuICpcbiAqIENvbXBpbGF0aW9uIG1heSBiZSBhc3luY2hyb25vdXMgKGR1ZSB0byB0aGUgbmVlZCB0byByZXNvbHZlIFVSTHMgZm9yIHRoZSBjb21wb25lbnQgdGVtcGxhdGUgb3JcbiAqIG90aGVyIHJlc291cmNlcywgZm9yIGV4YW1wbGUpLiBJbiB0aGUgZXZlbnQgdGhhdCBjb21waWxhdGlvbiBpcyBub3QgaW1tZWRpYXRlLCBgY29tcGlsZUNvbXBvbmVudGBcbiAqIHdpbGwgZW5xdWV1ZSByZXNvdXJjZSByZXNvbHV0aW9uIGludG8gYSBnbG9iYWwgcXVldWUgYW5kIHdpbGwgZmFpbCB0byByZXR1cm4gdGhlIGDJtWNtcGBcbiAqIHVudGlsIHRoZSBnbG9iYWwgcXVldWUgaGFzIGJlZW4gcmVzb2x2ZWQgd2l0aCBhIGNhbGwgdG8gYHJlc29sdmVDb21wb25lbnRSZXNvdXJjZXNgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZUNvbXBvbmVudCh0eXBlOiBUeXBlPGFueT4sIG1ldGFkYXRhOiBDb21wb25lbnQpOiB2b2lkIHtcbiAgLy8gSW5pdGlhbGl6ZSBuZ0Rldk1vZGUuIFRoaXMgbXVzdCBiZSB0aGUgZmlyc3Qgc3RhdGVtZW50IGluIGNvbXBpbGVDb21wb25lbnQuXG4gIC8vIFNlZSB0aGUgYGluaXROZ0Rldk1vZGVgIGRvY3N0cmluZyBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgaW5pdE5nRGV2TW9kZSgpO1xuXG4gIGxldCBuZ0NvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPHVua25vd24+fG51bGwgPSBudWxsO1xuXG4gIC8vIE1ldGFkYXRhIG1heSBoYXZlIHJlc291cmNlcyB3aGljaCBuZWVkIHRvIGJlIHJlc29sdmVkLlxuICBtYXliZVF1ZXVlUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzKHR5cGUsIG1ldGFkYXRhKTtcblxuICAvLyBOb3RlIHRoYXQgd2UncmUgdXNpbmcgdGhlIHNhbWUgZnVuY3Rpb24gYXMgYERpcmVjdGl2ZWAsIGJlY2F1c2UgdGhhdCdzIG9ubHkgc3Vic2V0IG9mIG1ldGFkYXRhXG4gIC8vIHRoYXQgd2UgbmVlZCB0byBjcmVhdGUgdGhlIG5nRmFjdG9yeURlZi4gV2UncmUgYXZvaWRpbmcgdXNpbmcgdGhlIGNvbXBvbmVudCBtZXRhZGF0YVxuICAvLyBiZWNhdXNlIHdlJ2QgaGF2ZSB0byByZXNvbHZlIHRoZSBhc3luY2hyb25vdXMgdGVtcGxhdGVzLlxuICBhZGREaXJlY3RpdmVGYWN0b3J5RGVmKHR5cGUsIG1ldGFkYXRhKTtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgTkdfQ09NUF9ERUYsIHtcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChuZ0NvbXBvbmVudERlZiA9PT0gbnVsbCkge1xuICAgICAgICBjb25zdCBjb21waWxlciA9XG4gICAgICAgICAgICBnZXRDb21waWxlckZhY2FkZSh7dXNhZ2U6IEppdENvbXBpbGVyVXNhZ2UuRGVjb3JhdG9yLCBraW5kOiAnY29tcG9uZW50JywgdHlwZTogdHlwZX0pO1xuXG4gICAgICAgIGlmIChjb21wb25lbnROZWVkc1Jlc29sdXRpb24obWV0YWRhdGEpKSB7XG4gICAgICAgICAgY29uc3QgZXJyb3IgPSBbYENvbXBvbmVudCAnJHt0eXBlLm5hbWV9JyBpcyBub3QgcmVzb2x2ZWQ6YF07XG4gICAgICAgICAgaWYgKG1ldGFkYXRhLnRlbXBsYXRlVXJsKSB7XG4gICAgICAgICAgICBlcnJvci5wdXNoKGAgLSB0ZW1wbGF0ZVVybDogJHttZXRhZGF0YS50ZW1wbGF0ZVVybH1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG1ldGFkYXRhLnN0eWxlVXJscyAmJiBtZXRhZGF0YS5zdHlsZVVybHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBlcnJvci5wdXNoKGAgLSBzdHlsZVVybHM6ICR7SlNPTi5zdHJpbmdpZnkobWV0YWRhdGEuc3R5bGVVcmxzKX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZXJyb3IucHVzaChgRGlkIHlvdSBydW4gYW5kIHdhaXQgZm9yICdyZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzKCknP2ApO1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvci5qb2luKCdcXG4nKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGlzIGNvbnN0IHdhcyBjYWxsZWQgYGppdE9wdGlvbnNgIHByZXZpb3VzbHkgYnV0IGhhZCB0byBiZSByZW5hbWVkIHRvIGBvcHRpb25zYCBiZWNhdXNlXG4gICAgICAgIC8vIG9mIGEgYnVnIHdpdGggVGVyc2VyIHRoYXQgY2F1c2VkIG9wdGltaXplZCBKSVQgYnVpbGRzIHRvIHRocm93IGEgYFJlZmVyZW5jZUVycm9yYC5cbiAgICAgICAgLy8gVGhpcyBidWcgd2FzIGludmVzdGlnYXRlZCBpbiBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyLWNsaS9pc3N1ZXMvMTcyNjQuXG4gICAgICAgIC8vIFdlIHNob3VsZCBub3QgcmVuYW1lIGl0IGJhY2sgdW50aWwgaHR0cHM6Ly9naXRodWIuY29tL3RlcnNlci90ZXJzZXIvaXNzdWVzLzYxNSBpcyBmaXhlZC5cbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGdldEppdE9wdGlvbnMoKTtcbiAgICAgICAgbGV0IHByZXNlcnZlV2hpdGVzcGFjZXMgPSBtZXRhZGF0YS5wcmVzZXJ2ZVdoaXRlc3BhY2VzO1xuICAgICAgICBpZiAocHJlc2VydmVXaGl0ZXNwYWNlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgaWYgKG9wdGlvbnMgIT09IG51bGwgJiYgb3B0aW9ucy5wcmVzZXJ2ZVdoaXRlc3BhY2VzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHByZXNlcnZlV2hpdGVzcGFjZXMgPSBvcHRpb25zLnByZXNlcnZlV2hpdGVzcGFjZXM7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByZXNlcnZlV2hpdGVzcGFjZXMgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGVuY2Fwc3VsYXRpb24gPSBtZXRhZGF0YS5lbmNhcHN1bGF0aW9uO1xuICAgICAgICBpZiAoZW5jYXBzdWxhdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgaWYgKG9wdGlvbnMgIT09IG51bGwgJiYgb3B0aW9ucy5kZWZhdWx0RW5jYXBzdWxhdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBlbmNhcHN1bGF0aW9uID0gb3B0aW9ucy5kZWZhdWx0RW5jYXBzdWxhdGlvbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZW5jYXBzdWxhdGlvbiA9IFZpZXdFbmNhcHN1bGF0aW9uLkVtdWxhdGVkO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlVXJsID0gbWV0YWRhdGEudGVtcGxhdGVVcmwgfHwgYG5nOi8vLyR7dHlwZS5uYW1lfS90ZW1wbGF0ZS5odG1sYDtcbiAgICAgICAgY29uc3QgbWV0YTogUjNDb21wb25lbnRNZXRhZGF0YUZhY2FkZSA9IHtcbiAgICAgICAgICAuLi5kaXJlY3RpdmVNZXRhZGF0YSh0eXBlLCBtZXRhZGF0YSksXG4gICAgICAgICAgdHlwZVNvdXJjZVNwYW46IGNvbXBpbGVyLmNyZWF0ZVBhcnNlU291cmNlU3BhbignQ29tcG9uZW50JywgdHlwZS5uYW1lLCB0ZW1wbGF0ZVVybCksXG4gICAgICAgICAgdGVtcGxhdGU6IG1ldGFkYXRhLnRlbXBsYXRlIHx8ICcnLFxuICAgICAgICAgIHByZXNlcnZlV2hpdGVzcGFjZXMsXG4gICAgICAgICAgc3R5bGVzOiBtZXRhZGF0YS5zdHlsZXMgfHwgRU1QVFlfQVJSQVksXG4gICAgICAgICAgYW5pbWF0aW9uczogbWV0YWRhdGEuYW5pbWF0aW9ucyxcbiAgICAgICAgICAvLyBKSVQgY29tcG9uZW50cyBhcmUgYWx3YXlzIGNvbXBpbGVkIGFnYWluc3QgYW4gZW1wdHkgc2V0IG9mIGBkZWNsYXJhdGlvbnNgLiBJbnN0ZWFkLCB0aGVcbiAgICAgICAgICAvLyBgZGlyZWN0aXZlRGVmc2AgYW5kIGBwaXBlRGVmc2AgYXJlIHVwZGF0ZWQgYXQgYSBsYXRlciBwb2ludDpcbiAgICAgICAgICAvLyAgKiBmb3IgTmdNb2R1bGUtYmFzZWQgY29tcG9uZW50cywgdGhleSdyZSBzZXQgd2hlbiB0aGUgTmdNb2R1bGUgd2hpY2ggZGVjbGFyZXMgdGhlXG4gICAgICAgICAgLy8gICAgY29tcG9uZW50IHJlc29sdmVzIGluIHRoZSBtb2R1bGUgc2NvcGluZyBxdWV1ZVxuICAgICAgICAgIC8vICAqIGZvciBzdGFuZGFsb25lIGNvbXBvbmVudHMsIHRoZXkncmUgc2V0IGp1c3QgYmVsb3csIGFmdGVyIGBjb21waWxlQ29tcG9uZW50YC5cbiAgICAgICAgICBkZWNsYXJhdGlvbnM6IFtdLFxuICAgICAgICAgIGNoYW5nZURldGVjdGlvbjogbWV0YWRhdGEuY2hhbmdlRGV0ZWN0aW9uLFxuICAgICAgICAgIGVuY2Fwc3VsYXRpb24sXG4gICAgICAgICAgaW50ZXJwb2xhdGlvbjogbWV0YWRhdGEuaW50ZXJwb2xhdGlvbixcbiAgICAgICAgICB2aWV3UHJvdmlkZXJzOiBtZXRhZGF0YS52aWV3UHJvdmlkZXJzIHx8IG51bGwsXG4gICAgICAgICAgaXNTdGFuZGFsb25lOiAhIW1ldGFkYXRhLnN0YW5kYWxvbmUsXG4gICAgICAgIH07XG5cbiAgICAgICAgY29tcGlsYXRpb25EZXB0aCsrO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChtZXRhLnVzZXNJbmhlcml0YW5jZSkge1xuICAgICAgICAgICAgYWRkRGlyZWN0aXZlRGVmVG9VbmRlY29yYXRlZFBhcmVudHModHlwZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5nQ29tcG9uZW50RGVmID1cbiAgICAgICAgICAgICAgY29tcGlsZXIuY29tcGlsZUNvbXBvbmVudChhbmd1bGFyQ29yZUVudiwgdGVtcGxhdGVVcmwsIG1ldGEpIGFzIENvbXBvbmVudERlZjx1bmtub3duPjtcblxuICAgICAgICAgIGlmIChtZXRhZGF0YS5zdGFuZGFsb25lKSB7XG4gICAgICAgICAgICAvLyBQYXRjaCB0aGUgY29tcG9uZW50IGRlZmluaXRpb24gZm9yIHN0YW5kYWxvbmUgY29tcG9uZW50cyB3aXRoIGBkaXJlY3RpdmVEZWZzYCBhbmRcbiAgICAgICAgICAgIC8vIGBwaXBlRGVmc2AgZnVuY3Rpb25zIHdoaWNoIGxhemlseSBjb21wdXRlIHRoZSBkaXJlY3RpdmVzL3BpcGVzIGF2YWlsYWJsZSBpbiB0aGVcbiAgICAgICAgICAgIC8vIHN0YW5kYWxvbmUgY29tcG9uZW50LiBBbHNvIHNldCBgZGVwZW5kZW5jaWVzYCB0byB0aGUgbGF6aWx5IHJlc29sdmVkIGxpc3Qgb2YgaW1wb3J0cy5cbiAgICAgICAgICAgIGNvbnN0IGltcG9ydHM6IFR5cGU8YW55PltdID0gZmxhdHRlbihtZXRhZGF0YS5pbXBvcnRzIHx8IEVNUFRZX0FSUkFZKTtcbiAgICAgICAgICAgIGNvbnN0IHtkaXJlY3RpdmVEZWZzLCBwaXBlRGVmc30gPSBnZXRTdGFuZGFsb25lRGVmRnVuY3Rpb25zKHR5cGUsIGltcG9ydHMpO1xuICAgICAgICAgICAgbmdDb21wb25lbnREZWYuZGlyZWN0aXZlRGVmcyA9IGRpcmVjdGl2ZURlZnM7XG4gICAgICAgICAgICBuZ0NvbXBvbmVudERlZi5waXBlRGVmcyA9IHBpcGVEZWZzO1xuICAgICAgICAgICAgbmdDb21wb25lbnREZWYuZGVwZW5kZW5jaWVzID0gKCkgPT4gaW1wb3J0cy5tYXAocmVzb2x2ZUZvcndhcmRSZWYpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAvLyBFbnN1cmUgdGhhdCB0aGUgY29tcGlsYXRpb24gZGVwdGggaXMgZGVjcmVtZW50ZWQgZXZlbiB3aGVuIHRoZSBjb21waWxhdGlvbiBmYWlsZWQuXG4gICAgICAgICAgY29tcGlsYXRpb25EZXB0aC0tO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbXBpbGF0aW9uRGVwdGggPT09IDApIHtcbiAgICAgICAgICAvLyBXaGVuIE5nTW9kdWxlIGRlY29yYXRvciBleGVjdXRlZCwgd2UgZW5xdWV1ZWQgdGhlIG1vZHVsZSBkZWZpbml0aW9uIHN1Y2ggdGhhdFxuICAgICAgICAgIC8vIGl0IHdvdWxkIG9ubHkgZGVxdWV1ZSBhbmQgYWRkIGl0c2VsZiBhcyBtb2R1bGUgc2NvcGUgdG8gYWxsIG9mIGl0cyBkZWNsYXJhdGlvbnMsXG4gICAgICAgICAgLy8gYnV0IG9ubHkgaWYgIGlmIGFsbCBvZiBpdHMgZGVjbGFyYXRpb25zIGhhZCByZXNvbHZlZC4gVGhpcyBjYWxsIHJ1bnMgdGhlIGNoZWNrXG4gICAgICAgICAgLy8gdG8gc2VlIGlmIGFueSBtb2R1bGVzIHRoYXQgYXJlIGluIHRoZSBxdWV1ZSBjYW4gYmUgZGVxdWV1ZWQgYW5kIGFkZCBzY29wZSB0b1xuICAgICAgICAgIC8vIHRoZWlyIGRlY2xhcmF0aW9ucy5cbiAgICAgICAgICBmbHVzaE1vZHVsZVNjb3BpbmdRdWV1ZUFzTXVjaEFzUG9zc2libGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGNvbXBvbmVudCBjb21waWxhdGlvbiBpcyBhc3luYywgdGhlbiB0aGUgQE5nTW9kdWxlIGFubm90YXRpb24gd2hpY2ggZGVjbGFyZXMgdGhlXG4gICAgICAgIC8vIGNvbXBvbmVudCBtYXkgZXhlY3V0ZSBhbmQgc2V0IGFuIG5nU2VsZWN0b3JTY29wZSBwcm9wZXJ0eSBvbiB0aGUgY29tcG9uZW50IHR5cGUuIFRoaXNcbiAgICAgICAgLy8gYWxsb3dzIHRoZSBjb21wb25lbnQgdG8gcGF0Y2ggaXRzZWxmIHdpdGggZGlyZWN0aXZlRGVmcyBmcm9tIHRoZSBtb2R1bGUgYWZ0ZXIgaXRcbiAgICAgICAgLy8gZmluaXNoZXMgY29tcGlsaW5nLlxuICAgICAgICBpZiAoaGFzU2VsZWN0b3JTY29wZSh0eXBlKSkge1xuICAgICAgICAgIGNvbnN0IHNjb3BlcyA9IHRyYW5zaXRpdmVTY29wZXNGb3IodHlwZS5uZ1NlbGVjdG9yU2NvcGUpO1xuICAgICAgICAgIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlKG5nQ29tcG9uZW50RGVmLCBzY29wZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1ldGFkYXRhLnNjaGVtYXMpIHtcbiAgICAgICAgICBpZiAobWV0YWRhdGEuc3RhbmRhbG9uZSkge1xuICAgICAgICAgICAgbmdDb21wb25lbnREZWYuc2NoZW1hcyA9IG1ldGFkYXRhLnNjaGVtYXM7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVGhlICdzY2hlbWFzJyB3YXMgc3BlY2lmaWVkIGZvciB0aGUgJHtcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnlGb3JFcnJvcih0eXBlKX0gYnV0IGlzIG9ubHkgdmFsaWQgb24gYSBjb21wb25lbnQgdGhhdCBpcyBzdGFuZGFsb25lLmApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChtZXRhZGF0YS5zdGFuZGFsb25lKSB7XG4gICAgICAgICAgbmdDb21wb25lbnREZWYuc2NoZW1hcyA9IFtdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbmdDb21wb25lbnREZWY7XG4gICAgfSxcbiAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGUsXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXREZXBlbmRlbmN5VHlwZUZvckVycm9yKHR5cGU6IFR5cGU8YW55Pikge1xuICBpZiAoZ2V0Q29tcG9uZW50RGVmKHR5cGUpKSByZXR1cm4gJ2NvbXBvbmVudCc7XG4gIGlmIChnZXREaXJlY3RpdmVEZWYodHlwZSkpIHJldHVybiAnZGlyZWN0aXZlJztcbiAgaWYgKGdldFBpcGVEZWYodHlwZSkpIHJldHVybiAncGlwZSc7XG4gIHJldHVybiAndHlwZSc7XG59XG5cbmZ1bmN0aW9uIHZlcmlmeVN0YW5kYWxvbmVJbXBvcnQoZGVwVHlwZTogVHlwZTx1bmtub3duPiwgaW1wb3J0aW5nVHlwZTogVHlwZTx1bmtub3duPikge1xuICBpZiAoaXNGb3J3YXJkUmVmKGRlcFR5cGUpKSB7XG4gICAgZGVwVHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKGRlcFR5cGUpO1xuICAgIGlmICghZGVwVHlwZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBmb3J3YXJkUmVmIGZ1bmN0aW9uLCBpbXBvcnRlZCBmcm9tIFwiJHtcbiAgICAgICAgICBzdHJpbmdpZnlGb3JFcnJvcihpbXBvcnRpbmdUeXBlKX1cIiwgdG8gcmV0dXJuIGEgc3RhbmRhbG9uZSBlbnRpdHkgb3IgTmdNb2R1bGUgYnV0IGdvdCBcIiR7XG4gICAgICAgICAgc3RyaW5naWZ5Rm9yRXJyb3IoZGVwVHlwZSkgfHwgZGVwVHlwZX1cIi5gKTtcbiAgICB9XG4gIH1cblxuICBpZiAoZ2V0TmdNb2R1bGVEZWYoZGVwVHlwZSkgPT0gbnVsbCkge1xuICAgIGNvbnN0IGRlZiA9IGdldENvbXBvbmVudERlZihkZXBUeXBlKSB8fCBnZXREaXJlY3RpdmVEZWYoZGVwVHlwZSkgfHwgZ2V0UGlwZURlZihkZXBUeXBlKTtcbiAgICBpZiAoZGVmICE9IG51bGwpIHtcbiAgICAgIC8vIGlmIGEgY29tcG9uZW50LCBkaXJlY3RpdmUgb3IgcGlwZSBpcyBpbXBvcnRlZCBtYWtlIHN1cmUgdGhhdCBpdCBpcyBzdGFuZGFsb25lXG4gICAgICBpZiAoIWRlZi5zdGFuZGFsb25lKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVGhlIFwiJHtzdHJpbmdpZnlGb3JFcnJvcihkZXBUeXBlKX1cIiAke1xuICAgICAgICAgICAgZ2V0RGVwZW5kZW5jeVR5cGVGb3JFcnJvcihkZXBUeXBlKX0sIGltcG9ydGVkIGZyb20gXCIke1xuICAgICAgICAgICAgc3RyaW5naWZ5Rm9yRXJyb3IoXG4gICAgICAgICAgICAgICAgaW1wb3J0aW5nVHlwZSl9XCIsIGlzIG5vdCBzdGFuZGFsb25lLiBEaWQgeW91IGZvcmdldCB0byBhZGQgdGhlIHN0YW5kYWxvbmU6IHRydWUgZmxhZz9gKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaXQgY2FuIGJlIGVpdGhlciBhIG1vZHVsZSB3aXRoIHByb3ZpZGVyIG9yIGFuIHVua25vd24gKG5vdCBhbm5vdGF0ZWQpIHR5cGVcbiAgICAgIGlmIChpc01vZHVsZVdpdGhQcm92aWRlcnMoZGVwVHlwZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBIG1vZHVsZSB3aXRoIHByb3ZpZGVycyB3YXMgaW1wb3J0ZWQgZnJvbSBcIiR7XG4gICAgICAgICAgICBzdHJpbmdpZnlGb3JFcnJvcihcbiAgICAgICAgICAgICAgICBpbXBvcnRpbmdUeXBlKX1cIi4gTW9kdWxlcyB3aXRoIHByb3ZpZGVycyBhcmUgbm90IHN1cHBvcnRlZCBpbiBzdGFuZGFsb25lIGNvbXBvbmVudHMgaW1wb3J0cy5gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVGhlIFwiJHtzdHJpbmdpZnlGb3JFcnJvcihkZXBUeXBlKX1cIiB0eXBlLCBpbXBvcnRlZCBmcm9tIFwiJHtcbiAgICAgICAgICAgIHN0cmluZ2lmeUZvckVycm9yKFxuICAgICAgICAgICAgICAgIGltcG9ydGluZ1R5cGUpfVwiLCBtdXN0IGJlIGEgc3RhbmRhbG9uZSBjb21wb25lbnQgLyBkaXJlY3RpdmUgLyBwaXBlIG9yIGFuIE5nTW9kdWxlLiBEaWQgeW91IGZvcmdldCB0byBhZGQgdGhlIHJlcXVpcmVkIEBDb21wb25lbnQgLyBARGlyZWN0aXZlIC8gQFBpcGUgb3IgQE5nTW9kdWxlIGFubm90YXRpb24/YCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQnVpbGQgbWVtb2l6ZWQgYGRpcmVjdGl2ZURlZnNgIGFuZCBgcGlwZURlZnNgIGZ1bmN0aW9ucyBmb3IgdGhlIGNvbXBvbmVudCBkZWZpbml0aW9uIG9mIGFcbiAqIHN0YW5kYWxvbmUgY29tcG9uZW50LCB3aGljaCBwcm9jZXNzIGBpbXBvcnRzYCBhbmQgZmlsdGVyIG91dCBkaXJlY3RpdmVzIGFuZCBwaXBlcy4gVGhlIHVzZSBvZlxuICogbWVtb2l6ZWQgZnVuY3Rpb25zIGhlcmUgYWxsb3dzIGZvciB0aGUgZGVsYXllZCByZXNvbHV0aW9uIG9mIGFueSBgZm9yd2FyZFJlZmBzIHByZXNlbnQgaW4gdGhlXG4gKiBjb21wb25lbnQncyBgaW1wb3J0c2AuXG4gKi9cbmZ1bmN0aW9uIGdldFN0YW5kYWxvbmVEZWZGdW5jdGlvbnModHlwZTogVHlwZTxhbnk+LCBpbXBvcnRzOiBUeXBlPGFueT5bXSk6IHtcbiAgZGlyZWN0aXZlRGVmczogKCkgPT4gRGlyZWN0aXZlRGVmTGlzdCxcbiAgcGlwZURlZnM6ICgpID0+IFBpcGVEZWZMaXN0LFxufSB7XG4gIGxldCBjYWNoZWREaXJlY3RpdmVEZWZzOiBEaXJlY3RpdmVEZWZMaXN0fG51bGwgPSBudWxsO1xuICBsZXQgY2FjaGVkUGlwZURlZnM6IFBpcGVEZWZMaXN0fG51bGwgPSBudWxsO1xuICBjb25zdCBkaXJlY3RpdmVEZWZzID0gKCkgPT4ge1xuICAgIGlmIChjYWNoZWREaXJlY3RpdmVEZWZzID09PSBudWxsKSB7XG4gICAgICAvLyBTdGFuZGFsb25lIGNvbXBvbmVudHMgYXJlIGFsd2F5cyBhYmxlIHRvIHNlbGYtcmVmZXJlbmNlLCBzbyBpbmNsdWRlIHRoZSBjb21wb25lbnQncyBvd25cbiAgICAgIC8vIGRlZmluaXRpb24gaW4gaXRzIGBkaXJlY3RpdmVEZWZzYC5cbiAgICAgIGNhY2hlZERpcmVjdGl2ZURlZnMgPSBbZ2V0Q29tcG9uZW50RGVmKHR5cGUpIV07XG4gICAgICBjb25zdCBzZWVuID0gbmV3IFNldDxUeXBlPHVua25vd24+PigpO1xuXG4gICAgICBmb3IgKGNvbnN0IHJhd0RlcCBvZiBpbXBvcnRzKSB7XG4gICAgICAgIG5nRGV2TW9kZSAmJiB2ZXJpZnlTdGFuZGFsb25lSW1wb3J0KHJhd0RlcCwgdHlwZSk7XG5cbiAgICAgICAgY29uc3QgZGVwID0gcmVzb2x2ZUZvcndhcmRSZWYocmF3RGVwKTtcbiAgICAgICAgaWYgKHNlZW4uaGFzKGRlcCkpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBzZWVuLmFkZChkZXApO1xuXG4gICAgICAgIGlmICghIWdldE5nTW9kdWxlRGVmKGRlcCkpIHtcbiAgICAgICAgICBjb25zdCBzY29wZSA9IHRyYW5zaXRpdmVTY29wZXNGb3IoZGVwKTtcbiAgICAgICAgICBmb3IgKGNvbnN0IGRpciBvZiBzY29wZS5leHBvcnRlZC5kaXJlY3RpdmVzKSB7XG4gICAgICAgICAgICBjb25zdCBkZWYgPSBnZXRDb21wb25lbnREZWYoZGlyKSB8fCBnZXREaXJlY3RpdmVEZWYoZGlyKTtcbiAgICAgICAgICAgIGlmIChkZWYgJiYgIXNlZW4uaGFzKGRpcikpIHtcbiAgICAgICAgICAgICAgc2Vlbi5hZGQoZGlyKTtcbiAgICAgICAgICAgICAgY2FjaGVkRGlyZWN0aXZlRGVmcy5wdXNoKGRlZik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGRlZiA9IGdldENvbXBvbmVudERlZihkZXApIHx8IGdldERpcmVjdGl2ZURlZihkZXApO1xuICAgICAgICAgIGlmIChkZWYpIHtcbiAgICAgICAgICAgIGNhY2hlZERpcmVjdGl2ZURlZnMucHVzaChkZWYpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2FjaGVkRGlyZWN0aXZlRGVmcztcbiAgfTtcblxuICBjb25zdCBwaXBlRGVmcyA9ICgpID0+IHtcbiAgICBpZiAoY2FjaGVkUGlwZURlZnMgPT09IG51bGwpIHtcbiAgICAgIGNhY2hlZFBpcGVEZWZzID0gW107XG4gICAgICBjb25zdCBzZWVuID0gbmV3IFNldDxUeXBlPHVua25vd24+PigpO1xuXG4gICAgICBmb3IgKGNvbnN0IHJhd0RlcCBvZiBpbXBvcnRzKSB7XG4gICAgICAgIGNvbnN0IGRlcCA9IHJlc29sdmVGb3J3YXJkUmVmKHJhd0RlcCk7XG4gICAgICAgIGlmIChzZWVuLmhhcyhkZXApKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgc2Vlbi5hZGQoZGVwKTtcblxuICAgICAgICBpZiAoISFnZXROZ01vZHVsZURlZihkZXApKSB7XG4gICAgICAgICAgY29uc3Qgc2NvcGUgPSB0cmFuc2l0aXZlU2NvcGVzRm9yKGRlcCk7XG4gICAgICAgICAgZm9yIChjb25zdCBwaXBlIG9mIHNjb3BlLmV4cG9ydGVkLnBpcGVzKSB7XG4gICAgICAgICAgICBjb25zdCBkZWYgPSBnZXRQaXBlRGVmKHBpcGUpO1xuICAgICAgICAgICAgaWYgKGRlZiAmJiAhc2Vlbi5oYXMocGlwZSkpIHtcbiAgICAgICAgICAgICAgc2Vlbi5hZGQocGlwZSk7XG4gICAgICAgICAgICAgIGNhY2hlZFBpcGVEZWZzLnB1c2goZGVmKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgZGVmID0gZ2V0UGlwZURlZihkZXApO1xuICAgICAgICAgIGlmIChkZWYpIHtcbiAgICAgICAgICAgIGNhY2hlZFBpcGVEZWZzLnB1c2goZGVmKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNhY2hlZFBpcGVEZWZzO1xuICB9O1xuXG4gIHJldHVybiB7XG4gICAgZGlyZWN0aXZlRGVmcyxcbiAgICBwaXBlRGVmcyxcbiAgfTtcbn1cblxuZnVuY3Rpb24gaGFzU2VsZWN0b3JTY29wZTxUPihjb21wb25lbnQ6IFR5cGU8VD4pOiBjb21wb25lbnQgaXMgVHlwZTxUPiZcbiAgICB7bmdTZWxlY3RvclNjb3BlOiBUeXBlPGFueT59IHtcbiAgcmV0dXJuIChjb21wb25lbnQgYXMge25nU2VsZWN0b3JTY29wZT86IGFueX0pLm5nU2VsZWN0b3JTY29wZSAhPT0gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIENvbXBpbGUgYW4gQW5ndWxhciBkaXJlY3RpdmUgYWNjb3JkaW5nIHRvIGl0cyBkZWNvcmF0b3IgbWV0YWRhdGEsIGFuZCBwYXRjaCB0aGUgcmVzdWx0aW5nXG4gKiBkaXJlY3RpdmUgZGVmIG9udG8gdGhlIGNvbXBvbmVudCB0eXBlLlxuICpcbiAqIEluIHRoZSBldmVudCB0aGF0IGNvbXBpbGF0aW9uIGlzIG5vdCBpbW1lZGlhdGUsIGBjb21waWxlRGlyZWN0aXZlYCB3aWxsIHJldHVybiBhIGBQcm9taXNlYCB3aGljaFxuICogd2lsbCByZXNvbHZlIHdoZW4gY29tcGlsYXRpb24gY29tcGxldGVzIGFuZCB0aGUgZGlyZWN0aXZlIGJlY29tZXMgdXNhYmxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZURpcmVjdGl2ZSh0eXBlOiBUeXBlPGFueT4sIGRpcmVjdGl2ZTogRGlyZWN0aXZlfG51bGwpOiB2b2lkIHtcbiAgbGV0IG5nRGlyZWN0aXZlRGVmOiBhbnkgPSBudWxsO1xuXG4gIGFkZERpcmVjdGl2ZUZhY3RvcnlEZWYodHlwZSwgZGlyZWN0aXZlIHx8IHt9KTtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgTkdfRElSX0RFRiwge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKG5nRGlyZWN0aXZlRGVmID09PSBudWxsKSB7XG4gICAgICAgIC8vIGBkaXJlY3RpdmVgIGNhbiBiZSBudWxsIGluIHRoZSBjYXNlIG9mIGFic3RyYWN0IGRpcmVjdGl2ZXMgYXMgYSBiYXNlIGNsYXNzXG4gICAgICAgIC8vIHRoYXQgdXNlIGBARGlyZWN0aXZlKClgIHdpdGggbm8gc2VsZWN0b3IuIEluIHRoYXQgY2FzZSwgcGFzcyBlbXB0eSBvYmplY3QgdG8gdGhlXG4gICAgICAgIC8vIGBkaXJlY3RpdmVNZXRhZGF0YWAgZnVuY3Rpb24gaW5zdGVhZCBvZiBudWxsLlxuICAgICAgICBjb25zdCBtZXRhID0gZ2V0RGlyZWN0aXZlTWV0YWRhdGEodHlwZSwgZGlyZWN0aXZlIHx8IHt9KTtcbiAgICAgICAgY29uc3QgY29tcGlsZXIgPVxuICAgICAgICAgICAgZ2V0Q29tcGlsZXJGYWNhZGUoe3VzYWdlOiBKaXRDb21waWxlclVzYWdlLkRlY29yYXRvciwga2luZDogJ2RpcmVjdGl2ZScsIHR5cGV9KTtcbiAgICAgICAgbmdEaXJlY3RpdmVEZWYgPVxuICAgICAgICAgICAgY29tcGlsZXIuY29tcGlsZURpcmVjdGl2ZShhbmd1bGFyQ29yZUVudiwgbWV0YS5zb3VyY2VNYXBVcmwsIG1ldGEubWV0YWRhdGEpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5nRGlyZWN0aXZlRGVmO1xuICAgIH0sXG4gICAgLy8gTWFrZSB0aGUgcHJvcGVydHkgY29uZmlndXJhYmxlIGluIGRldiBtb2RlIHRvIGFsbG93IG92ZXJyaWRpbmcgaW4gdGVzdHNcbiAgICBjb25maWd1cmFibGU6ICEhbmdEZXZNb2RlLFxuICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0RGlyZWN0aXZlTWV0YWRhdGEodHlwZTogVHlwZTxhbnk+LCBtZXRhZGF0YTogRGlyZWN0aXZlKSB7XG4gIGNvbnN0IG5hbWUgPSB0eXBlICYmIHR5cGUubmFtZTtcbiAgY29uc3Qgc291cmNlTWFwVXJsID0gYG5nOi8vLyR7bmFtZX0vybVkaXIuanNgO1xuICBjb25zdCBjb21waWxlciA9IGdldENvbXBpbGVyRmFjYWRlKHt1c2FnZTogSml0Q29tcGlsZXJVc2FnZS5EZWNvcmF0b3IsIGtpbmQ6ICdkaXJlY3RpdmUnLCB0eXBlfSk7XG4gIGNvbnN0IGZhY2FkZSA9IGRpcmVjdGl2ZU1ldGFkYXRhKHR5cGUgYXMgQ29tcG9uZW50VHlwZTxhbnk+LCBtZXRhZGF0YSk7XG4gIGZhY2FkZS50eXBlU291cmNlU3BhbiA9IGNvbXBpbGVyLmNyZWF0ZVBhcnNlU291cmNlU3BhbignRGlyZWN0aXZlJywgbmFtZSwgc291cmNlTWFwVXJsKTtcbiAgaWYgKGZhY2FkZS51c2VzSW5oZXJpdGFuY2UpIHtcbiAgICBhZGREaXJlY3RpdmVEZWZUb1VuZGVjb3JhdGVkUGFyZW50cyh0eXBlKTtcbiAgfVxuICByZXR1cm4ge21ldGFkYXRhOiBmYWNhZGUsIHNvdXJjZU1hcFVybH07XG59XG5cbmZ1bmN0aW9uIGFkZERpcmVjdGl2ZUZhY3RvcnlEZWYodHlwZTogVHlwZTxhbnk+LCBtZXRhZGF0YTogRGlyZWN0aXZlfENvbXBvbmVudCkge1xuICBsZXQgbmdGYWN0b3J5RGVmOiBhbnkgPSBudWxsO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBOR19GQUNUT1JZX0RFRiwge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKG5nRmFjdG9yeURlZiA9PT0gbnVsbCkge1xuICAgICAgICBjb25zdCBtZXRhID0gZ2V0RGlyZWN0aXZlTWV0YWRhdGEodHlwZSwgbWV0YWRhdGEpO1xuICAgICAgICBjb25zdCBjb21waWxlciA9XG4gICAgICAgICAgICBnZXRDb21waWxlckZhY2FkZSh7dXNhZ2U6IEppdENvbXBpbGVyVXNhZ2UuRGVjb3JhdG9yLCBraW5kOiAnZGlyZWN0aXZlJywgdHlwZX0pO1xuICAgICAgICBuZ0ZhY3RvcnlEZWYgPSBjb21waWxlci5jb21waWxlRmFjdG9yeShhbmd1bGFyQ29yZUVudiwgYG5nOi8vLyR7dHlwZS5uYW1lfS/JtWZhYy5qc2AsIHtcbiAgICAgICAgICBuYW1lOiBtZXRhLm1ldGFkYXRhLm5hbWUsXG4gICAgICAgICAgdHlwZTogbWV0YS5tZXRhZGF0YS50eXBlLFxuICAgICAgICAgIHR5cGVBcmd1bWVudENvdW50OiAwLFxuICAgICAgICAgIGRlcHM6IHJlZmxlY3REZXBlbmRlbmNpZXModHlwZSksXG4gICAgICAgICAgdGFyZ2V0OiBjb21waWxlci5GYWN0b3J5VGFyZ2V0LkRpcmVjdGl2ZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZ0ZhY3RvcnlEZWY7XG4gICAgfSxcbiAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGUsXG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXh0ZW5kc0RpcmVjdGx5RnJvbU9iamVjdCh0eXBlOiBUeXBlPGFueT4pOiBib29sZWFuIHtcbiAgcmV0dXJuIE9iamVjdC5nZXRQcm90b3R5cGVPZih0eXBlLnByb3RvdHlwZSkgPT09IE9iamVjdC5wcm90b3R5cGU7XG59XG5cbi8qKlxuICogRXh0cmFjdCB0aGUgYFIzRGlyZWN0aXZlTWV0YWRhdGFgIGZvciBhIHBhcnRpY3VsYXIgZGlyZWN0aXZlIChlaXRoZXIgYSBgRGlyZWN0aXZlYCBvciBhXG4gKiBgQ29tcG9uZW50YCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVNZXRhZGF0YSh0eXBlOiBUeXBlPGFueT4sIG1ldGFkYXRhOiBEaXJlY3RpdmUpOiBSM0RpcmVjdGl2ZU1ldGFkYXRhRmFjYWRlIHtcbiAgLy8gUmVmbGVjdCBpbnB1dHMgYW5kIG91dHB1dHMuXG4gIGNvbnN0IHJlZmxlY3QgPSBnZXRSZWZsZWN0KCk7XG4gIGNvbnN0IHByb3BNZXRhZGF0YSA9IHJlZmxlY3Qub3duUHJvcE1ldGFkYXRhKHR5cGUpO1xuXG4gIHJldHVybiB7XG4gICAgbmFtZTogdHlwZS5uYW1lLFxuICAgIHR5cGU6IHR5cGUsXG4gICAgc2VsZWN0b3I6IG1ldGFkYXRhLnNlbGVjdG9yICE9PSB1bmRlZmluZWQgPyBtZXRhZGF0YS5zZWxlY3RvciA6IG51bGwsXG4gICAgaG9zdDogbWV0YWRhdGEuaG9zdCB8fCBFTVBUWV9PQkosXG4gICAgcHJvcE1ldGFkYXRhOiBwcm9wTWV0YWRhdGEsXG4gICAgaW5wdXRzOiBtZXRhZGF0YS5pbnB1dHMgfHwgRU1QVFlfQVJSQVksXG4gICAgb3V0cHV0czogbWV0YWRhdGEub3V0cHV0cyB8fCBFTVBUWV9BUlJBWSxcbiAgICBxdWVyaWVzOiBleHRyYWN0UXVlcmllc01ldGFkYXRhKHR5cGUsIHByb3BNZXRhZGF0YSwgaXNDb250ZW50UXVlcnkpLFxuICAgIGxpZmVjeWNsZToge3VzZXNPbkNoYW5nZXM6IHJlZmxlY3QuaGFzTGlmZWN5Y2xlSG9vayh0eXBlLCAnbmdPbkNoYW5nZXMnKX0sXG4gICAgdHlwZVNvdXJjZVNwYW46IG51bGwhLFxuICAgIHVzZXNJbmhlcml0YW5jZTogIWV4dGVuZHNEaXJlY3RseUZyb21PYmplY3QodHlwZSksXG4gICAgZXhwb3J0QXM6IGV4dHJhY3RFeHBvcnRBcyhtZXRhZGF0YS5leHBvcnRBcyksXG4gICAgcHJvdmlkZXJzOiBtZXRhZGF0YS5wcm92aWRlcnMgfHwgbnVsbCxcbiAgICB2aWV3UXVlcmllczogZXh0cmFjdFF1ZXJpZXNNZXRhZGF0YSh0eXBlLCBwcm9wTWV0YWRhdGEsIGlzVmlld1F1ZXJ5KSxcbiAgICBpc1N0YW5kYWxvbmU6ICEhbWV0YWRhdGEuc3RhbmRhbG9uZSxcbiAgICBob3N0RGlyZWN0aXZlczpcbiAgICAgICAgLy8gVE9ETyhjcmlzYmV0byk6IHJlbW92ZSB0aGUgYGFzIGFueWAgdXNhZ2UgaGVyZSBhbmQgZG93biBpbiB0aGUgYG1hcGAgY2FsbCBvbmNlXG4gICAgICAgIC8vIGhvc3QgZGlyZWN0aXZlcyBhcmUgZXhwb3NlZCBpbiB0aGUgcHVibGljIEFQSS5cbiAgICAgICAgKG1ldGFkYXRhIGFzIGFueSlcbiAgICAgICAgICAgIC5ob3N0RGlyZWN0aXZlcz8ubWFwKFxuICAgICAgICAgICAgICAgIChkaXJlY3RpdmU6IGFueSkgPT4gdHlwZW9mIGRpcmVjdGl2ZSA9PT0gJ2Z1bmN0aW9uJyA/IHtkaXJlY3RpdmV9IDogZGlyZWN0aXZlKSB8fFxuICAgICAgICBudWxsXG4gIH07XG59XG5cbi8qKlxuICogQWRkcyBhIGRpcmVjdGl2ZSBkZWZpbml0aW9uIHRvIGFsbCBwYXJlbnQgY2xhc3NlcyBvZiBhIHR5cGUgdGhhdCBkb24ndCBoYXZlIGFuIEFuZ3VsYXIgZGVjb3JhdG9yLlxuICovXG5mdW5jdGlvbiBhZGREaXJlY3RpdmVEZWZUb1VuZGVjb3JhdGVkUGFyZW50cyh0eXBlOiBUeXBlPGFueT4pIHtcbiAgY29uc3Qgb2JqUHJvdG90eXBlID0gT2JqZWN0LnByb3RvdHlwZTtcbiAgbGV0IHBhcmVudCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZih0eXBlLnByb3RvdHlwZSkuY29uc3RydWN0b3I7XG5cbiAgLy8gR28gdXAgdGhlIHByb3RvdHlwZSB1bnRpbCB3ZSBoaXQgYE9iamVjdGAuXG4gIHdoaWxlIChwYXJlbnQgJiYgcGFyZW50ICE9PSBvYmpQcm90b3R5cGUpIHtcbiAgICAvLyBTaW5jZSBpbmhlcml0YW5jZSB3b3JrcyBpZiB0aGUgY2xhc3Mgd2FzIGFubm90YXRlZCBhbHJlYWR5LCB3ZSBvbmx5IG5lZWQgdG8gYWRkXG4gICAgLy8gdGhlIGRlZiBpZiB0aGVyZSBhcmUgbm8gYW5ub3RhdGlvbnMgYW5kIHRoZSBkZWYgaGFzbid0IGJlZW4gY3JlYXRlZCBhbHJlYWR5LlxuICAgIGlmICghZ2V0RGlyZWN0aXZlRGVmKHBhcmVudCkgJiYgIWdldENvbXBvbmVudERlZihwYXJlbnQpICYmXG4gICAgICAgIHNob3VsZEFkZEFic3RyYWN0RGlyZWN0aXZlKHBhcmVudCkpIHtcbiAgICAgIGNvbXBpbGVEaXJlY3RpdmUocGFyZW50LCBudWxsKTtcbiAgICB9XG4gICAgcGFyZW50ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHBhcmVudCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY29udmVydFRvUjNRdWVyeVByZWRpY2F0ZShzZWxlY3RvcjogYW55KTogYW55fHN0cmluZ1tdIHtcbiAgcmV0dXJuIHR5cGVvZiBzZWxlY3RvciA9PT0gJ3N0cmluZycgPyBzcGxpdEJ5Q29tbWEoc2VsZWN0b3IpIDogcmVzb2x2ZUZvcndhcmRSZWYoc2VsZWN0b3IpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29udmVydFRvUjNRdWVyeU1ldGFkYXRhKHByb3BlcnR5TmFtZTogc3RyaW5nLCBhbm46IFF1ZXJ5KTogUjNRdWVyeU1ldGFkYXRhRmFjYWRlIHtcbiAgcmV0dXJuIHtcbiAgICBwcm9wZXJ0eU5hbWU6IHByb3BlcnR5TmFtZSxcbiAgICBwcmVkaWNhdGU6IGNvbnZlcnRUb1IzUXVlcnlQcmVkaWNhdGUoYW5uLnNlbGVjdG9yKSxcbiAgICBkZXNjZW5kYW50czogYW5uLmRlc2NlbmRhbnRzLFxuICAgIGZpcnN0OiBhbm4uZmlyc3QsXG4gICAgcmVhZDogYW5uLnJlYWQgPyBhbm4ucmVhZCA6IG51bGwsXG4gICAgc3RhdGljOiAhIWFubi5zdGF0aWMsXG4gICAgZW1pdERpc3RpbmN0Q2hhbmdlc09ubHk6ICEhYW5uLmVtaXREaXN0aW5jdENoYW5nZXNPbmx5LFxuICB9O1xufVxuZnVuY3Rpb24gZXh0cmFjdFF1ZXJpZXNNZXRhZGF0YShcbiAgICB0eXBlOiBUeXBlPGFueT4sIHByb3BNZXRhZGF0YToge1trZXk6IHN0cmluZ106IGFueVtdfSxcbiAgICBpc1F1ZXJ5QW5uOiAoYW5uOiBhbnkpID0+IGFubiBpcyBRdWVyeSk6IFIzUXVlcnlNZXRhZGF0YUZhY2FkZVtdIHtcbiAgY29uc3QgcXVlcmllc01ldGE6IFIzUXVlcnlNZXRhZGF0YUZhY2FkZVtdID0gW107XG4gIGZvciAoY29uc3QgZmllbGQgaW4gcHJvcE1ldGFkYXRhKSB7XG4gICAgaWYgKHByb3BNZXRhZGF0YS5oYXNPd25Qcm9wZXJ0eShmaWVsZCkpIHtcbiAgICAgIGNvbnN0IGFubm90YXRpb25zID0gcHJvcE1ldGFkYXRhW2ZpZWxkXTtcbiAgICAgIGFubm90YXRpb25zLmZvckVhY2goYW5uID0+IHtcbiAgICAgICAgaWYgKGlzUXVlcnlBbm4oYW5uKSkge1xuICAgICAgICAgIGlmICghYW5uLnNlbGVjdG9yKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgYENhbid0IGNvbnN0cnVjdCBhIHF1ZXJ5IGZvciB0aGUgcHJvcGVydHkgXCIke2ZpZWxkfVwiIG9mIGAgK1xuICAgICAgICAgICAgICAgIGBcIiR7c3RyaW5naWZ5Rm9yRXJyb3IodHlwZSl9XCIgc2luY2UgdGhlIHF1ZXJ5IHNlbGVjdG9yIHdhc24ndCBkZWZpbmVkLmApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoYW5ub3RhdGlvbnMuc29tZShpc0lucHV0QW5ub3RhdGlvbikpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGNvbWJpbmUgQElucHV0IGRlY29yYXRvcnMgd2l0aCBxdWVyeSBkZWNvcmF0b3JzYCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHF1ZXJpZXNNZXRhLnB1c2goY29udmVydFRvUjNRdWVyeU1ldGFkYXRhKGZpZWxkLCBhbm4pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBxdWVyaWVzTWV0YTtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdEV4cG9ydEFzKGV4cG9ydEFzOiBzdHJpbmd8dW5kZWZpbmVkKTogc3RyaW5nW118bnVsbCB7XG4gIHJldHVybiBleHBvcnRBcyA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IHNwbGl0QnlDb21tYShleHBvcnRBcyk7XG59XG5cbmZ1bmN0aW9uIGlzQ29udGVudFF1ZXJ5KHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBRdWVyeSB7XG4gIGNvbnN0IG5hbWUgPSB2YWx1ZS5uZ01ldGFkYXRhTmFtZTtcbiAgcmV0dXJuIG5hbWUgPT09ICdDb250ZW50Q2hpbGQnIHx8IG5hbWUgPT09ICdDb250ZW50Q2hpbGRyZW4nO1xufVxuXG5mdW5jdGlvbiBpc1ZpZXdRdWVyeSh2YWx1ZTogYW55KTogdmFsdWUgaXMgUXVlcnkge1xuICBjb25zdCBuYW1lID0gdmFsdWUubmdNZXRhZGF0YU5hbWU7XG4gIHJldHVybiBuYW1lID09PSAnVmlld0NoaWxkJyB8fCBuYW1lID09PSAnVmlld0NoaWxkcmVuJztcbn1cblxuZnVuY3Rpb24gaXNJbnB1dEFubm90YXRpb24odmFsdWU6IGFueSk6IHZhbHVlIGlzIElucHV0IHtcbiAgcmV0dXJuIHZhbHVlLm5nTWV0YWRhdGFOYW1lID09PSAnSW5wdXQnO1xufVxuXG5mdW5jdGlvbiBzcGxpdEJ5Q29tbWEodmFsdWU6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgcmV0dXJuIHZhbHVlLnNwbGl0KCcsJykubWFwKHBpZWNlID0+IHBpZWNlLnRyaW0oKSk7XG59XG5cbmNvbnN0IExJRkVDWUNMRV9IT09LUyA9IFtcbiAgJ25nT25DaGFuZ2VzJywgJ25nT25Jbml0JywgJ25nT25EZXN0cm95JywgJ25nRG9DaGVjaycsICduZ0FmdGVyVmlld0luaXQnLCAnbmdBZnRlclZpZXdDaGVja2VkJyxcbiAgJ25nQWZ0ZXJDb250ZW50SW5pdCcsICduZ0FmdGVyQ29udGVudENoZWNrZWQnXG5dO1xuXG5mdW5jdGlvbiBzaG91bGRBZGRBYnN0cmFjdERpcmVjdGl2ZSh0eXBlOiBUeXBlPGFueT4pOiBib29sZWFuIHtcbiAgY29uc3QgcmVmbGVjdCA9IGdldFJlZmxlY3QoKTtcblxuICBpZiAoTElGRUNZQ0xFX0hPT0tTLnNvbWUoaG9va05hbWUgPT4gcmVmbGVjdC5oYXNMaWZlY3ljbGVIb29rKHR5cGUsIGhvb2tOYW1lKSkpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGNvbnN0IHByb3BNZXRhZGF0YSA9IHJlZmxlY3QucHJvcE1ldGFkYXRhKHR5cGUpO1xuXG4gIGZvciAoY29uc3QgZmllbGQgaW4gcHJvcE1ldGFkYXRhKSB7XG4gICAgY29uc3QgYW5ub3RhdGlvbnMgPSBwcm9wTWV0YWRhdGFbZmllbGRdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhbm5vdGF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgY3VycmVudCA9IGFubm90YXRpb25zW2ldO1xuICAgICAgY29uc3QgbWV0YWRhdGFOYW1lID0gY3VycmVudC5uZ01ldGFkYXRhTmFtZTtcblxuICAgICAgaWYgKGlzSW5wdXRBbm5vdGF0aW9uKGN1cnJlbnQpIHx8IGlzQ29udGVudFF1ZXJ5KGN1cnJlbnQpIHx8IGlzVmlld1F1ZXJ5KGN1cnJlbnQpIHx8XG4gICAgICAgICAgbWV0YWRhdGFOYW1lID09PSAnT3V0cHV0JyB8fCBtZXRhZGF0YU5hbWUgPT09ICdIb3N0QmluZGluZycgfHxcbiAgICAgICAgICBtZXRhZGF0YU5hbWUgPT09ICdIb3N0TGlzdGVuZXInKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cbiJdfQ==