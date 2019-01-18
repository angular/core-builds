/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
import { NG_INJECTOR_DEF } from '../../di/interface/defs';
import { reflectDependencies } from '../../di/jit/util';
import { registerNgModuleType } from '../../linker/ng_module_factory_loader';
import { assertDefined } from '../../util/assert';
import { getComponentDef, getDirectiveDef, getNgModuleDef, getPipeDef } from '../definition';
import { NG_COMPONENT_DEF, NG_DIRECTIVE_DEF, NG_MODULE_DEF, NG_PIPE_DEF } from '../fields';
import { renderStringify } from '../util';
import { angularCoreEnv } from './environment';
/** @type {?} */
const EMPTY_ARRAY = [];
/**
 * @record
 */
function ModuleQueueItem() { }
if (false) {
    /** @type {?} */
    ModuleQueueItem.prototype.moduleType;
    /** @type {?} */
    ModuleQueueItem.prototype.ngModule;
}
/** @type {?} */
const moduleQueue = [];
/**
 * Enqueues moduleDef to be checked later to see if scope can be set on its
 * component declarations.
 * @param {?} moduleType
 * @param {?} ngModule
 * @return {?}
 */
function enqueueModuleForDelayedScoping(moduleType, ngModule) {
    moduleQueue.push({ moduleType, ngModule });
}
/** @type {?} */
let flushingModuleQueue = false;
/**
 * Loops over queued module definitions, if a given module definition has all of its
 * declarations resolved, it dequeues that module definition and sets the scope on
 * its declarations.
 * @return {?}
 */
export function flushModuleScopingQueueAsMuchAsPossible() {
    if (!flushingModuleQueue) {
        flushingModuleQueue = true;
        try {
            for (let i = moduleQueue.length - 1; i >= 0; i--) {
                const { moduleType, ngModule } = moduleQueue[i];
                if (ngModule.declarations && ngModule.declarations.every(isResolvedDeclaration)) {
                    // dequeue
                    moduleQueue.splice(i, 1);
                    setScopeOnDeclaredComponents(moduleType, ngModule);
                }
            }
        }
        finally {
            flushingModuleQueue = false;
        }
    }
}
/**
 * Returns truthy if a declaration has resolved. If the declaration happens to be
 * an array of declarations, it will recurse to check each declaration in that array
 * (which may also be arrays).
 * @param {?} declaration
 * @return {?}
 */
function isResolvedDeclaration(declaration) {
    if (Array.isArray(declaration)) {
        return declaration.every(isResolvedDeclaration);
    }
    return !!resolveForwardRef(declaration);
}
/**
 * Compiles a module in JIT mode.
 *
 * This function automatically gets called when a class has a `\@NgModule` decorator.
 * @param {?} moduleType
 * @param {?=} ngModule
 * @return {?}
 */
export function compileNgModule(moduleType, ngModule = {}) {
    compileNgModuleDefs((/** @type {?} */ (moduleType)), ngModule);
    // Because we don't know if all declarations have resolved yet at the moment the
    // NgModule decorator is executing, we're enqueueing the setting of module scope
    // on its declarations to be run at a later time when all declarations for the module,
    // including forward refs, have resolved.
    enqueueModuleForDelayedScoping(moduleType, ngModule);
}
/**
 * Compiles and adds the `ngModuleDef` and `ngInjectorDef` properties to the module class.
 * @param {?} moduleType
 * @param {?} ngModule
 * @return {?}
 */
export function compileNgModuleDefs(moduleType, ngModule) {
    ngDevMode && assertDefined(moduleType, 'Required value moduleType');
    ngDevMode && assertDefined(ngModule, 'Required value ngModule');
    /** @type {?} */
    const declarations = flatten(ngModule.declarations || EMPTY_ARRAY);
    /** @type {?} */
    /** @nocollapse */ let ngModuleDef = null;
    Object.defineProperty(moduleType, NG_MODULE_DEF, {
        configurable: true,
        get: () => {
            if (ngModuleDef === null) {
                ngModuleDef = getCompilerFacade().compileNgModule(angularCoreEnv, `ng://${moduleType.name}/ngModuleDef.js`, {
                    type: moduleType,
                    bootstrap: flatten(ngModule.bootstrap || EMPTY_ARRAY, resolveForwardRef),
                    declarations: declarations.map(resolveForwardRef),
                    imports: flatten(ngModule.imports || EMPTY_ARRAY, resolveForwardRef)
                        .map(expandModuleWithProviders),
                    exports: flatten(ngModule.exports || EMPTY_ARRAY, resolveForwardRef)
                        .map(expandModuleWithProviders),
                    emitInline: true,
                });
            }
            return ngModuleDef;
        }
    });
    if (ngModule.id) {
        registerNgModuleType(ngModule.id, moduleType);
    }
    /** @type {?} */
    /** @nocollapse */ let ngInjectorDef = null;
    Object.defineProperty(moduleType, NG_INJECTOR_DEF, {
        get: () => {
            if (ngInjectorDef === null) {
                ngDevMode && verifySemanticsOfNgModuleDef((/** @type {?} */ ((/** @type {?} */ (moduleType)))));
                /** @type {?} */
                const meta = {
                    name: moduleType.name,
                    type: moduleType,
                    deps: reflectDependencies(moduleType),
                    providers: ngModule.providers || EMPTY_ARRAY,
                    imports: [
                        (ngModule.imports || EMPTY_ARRAY).map(resolveForwardRef),
                        (ngModule.exports || EMPTY_ARRAY).map(resolveForwardRef),
                    ],
                };
                ngInjectorDef = getCompilerFacade().compileInjector(angularCoreEnv, `ng://${moduleType.name}/ngInjectorDef.js`, meta);
            }
            return ngInjectorDef;
        },
        // Make the property configurable in dev mode to allow overriding in tests
        configurable: !!ngDevMode,
    });
}
/**
 * @param {?} moduleType
 * @return {?}
 */
function verifySemanticsOfNgModuleDef(moduleType) {
    if (verifiedNgModule.get(moduleType))
        return;
    verifiedNgModule.set(moduleType, true);
    moduleType = resolveForwardRef(moduleType);
    /** @type {?} */
    /** @nocollapse */ const ngModuleDef = getNgModuleDef(moduleType, true);
    /** @type {?} */
    const errors = [];
    ngModuleDef.declarations.forEach(verifyDeclarationsHaveDefinitions);
    /** @type {?} */
    const combinedDeclarations = [
        ...ngModuleDef.declarations.map(resolveForwardRef),
        ...flatten(ngModuleDef.imports.map(computeCombinedExports), resolveForwardRef),
    ];
    ngModuleDef.exports.forEach(verifyExportsAreDeclaredOrReExported);
    ngModuleDef.declarations.forEach(verifyDeclarationIsUnique);
    ngModuleDef.declarations.forEach(verifyComponentEntryComponentsIsPartOfNgModule);
    /** @type {?} */
    const ngModule = getAnnotation(moduleType, 'NgModule');
    if (ngModule) {
        ngModule.imports &&
            flatten(ngModule.imports, unwrapModuleWithProvidersImports)
                .forEach(verifySemanticsOfNgModuleDef);
        ngModule.bootstrap && ngModule.bootstrap.forEach(verifyComponentIsPartOfNgModule);
        ngModule.entryComponents && ngModule.entryComponents.forEach(verifyComponentIsPartOfNgModule);
    }
    // Throw Error if any errors were detected.
    if (errors.length) {
        throw new Error(errors.join('\n'));
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////
    /**
     * @param {?} type
     * @return {?}
     */
    function verifyDeclarationsHaveDefinitions(type) {
        type = resolveForwardRef(type);
        /** @type {?} */
        const def = getComponentDef(type) || getDirectiveDef(type) || getPipeDef(type);
        if (!def) {
            errors.push(`Unexpected value '${renderStringify(type)}' declared by the module '${renderStringify(moduleType)}'. Please add a @Pipe/@Directive/@Component annotation.`);
        }
    }
    /**
     * @param {?} type
     * @return {?}
     */
    function verifyExportsAreDeclaredOrReExported(type) {
        type = resolveForwardRef(type);
        /** @type {?} */
        const kind = getComponentDef(type) && 'component' || getDirectiveDef(type) && 'directive' ||
            getPipeDef(type) && 'pipe';
        if (kind) {
            // only checked if we are declared as Component, Directive, or Pipe
            // Modules don't need to be declared or imported.
            if (combinedDeclarations.lastIndexOf(type) === -1) {
                // We are exporting something which we don't explicitly declare or import.
                errors.push(`Can't export ${kind} ${renderStringify(type)} from ${renderStringify(moduleType)} as it was neither declared nor imported!`);
            }
        }
    }
    /**
     * @param {?} type
     * @return {?}
     */
    function verifyDeclarationIsUnique(type) {
        type = resolveForwardRef(type);
        /** @type {?} */
        const existingModule = ownerNgModule.get(type);
        if (existingModule && existingModule !== moduleType) {
            /** @type {?} */
            const modules = [existingModule, moduleType].map(renderStringify).sort();
            errors.push(`Type ${renderStringify(type)} is part of the declarations of 2 modules: ${modules[0]} and ${modules[1]}! ` +
                `Please consider moving ${renderStringify(type)} to a higher module that imports ${modules[0]} and ${modules[1]}. ` +
                `You can also create a new NgModule that exports and includes ${renderStringify(type)} then import that NgModule in ${modules[0]} and ${modules[1]}.`);
        }
        else {
            // Mark type as having owner.
            ownerNgModule.set(type, moduleType);
        }
    }
    /**
     * @param {?} type
     * @return {?}
     */
    function verifyComponentIsPartOfNgModule(type) {
        type = resolveForwardRef(type);
        /** @type {?} */
        const existingModule = ownerNgModule.get(type);
        if (!existingModule) {
            errors.push(`Component ${renderStringify(type)} is not part of any NgModule or the module has not been imported into your module.`);
        }
    }
    /**
     * @param {?} type
     * @return {?}
     */
    function verifyComponentEntryComponentsIsPartOfNgModule(type) {
        type = resolveForwardRef(type);
        if (getComponentDef(type)) {
            // We know we are component
            /** @type {?} */
            const component = getAnnotation(type, 'Component');
            if (component && component.entryComponents) {
                component.entryComponents.forEach(verifyComponentIsPartOfNgModule);
            }
        }
    }
}
/**
 * @param {?} typeOrWithProviders
 * @return {?}
 */
function unwrapModuleWithProvidersImports(typeOrWithProviders) {
    typeOrWithProviders = resolveForwardRef(typeOrWithProviders);
    return ((/** @type {?} */ (typeOrWithProviders))).ngModule || typeOrWithProviders;
}
/**
 * @template T
 * @param {?} type
 * @param {?} name
 * @return {?}
 */
function getAnnotation(type, name) {
    /** @type {?} */
    let annotation = null;
    collect(type.__annotations__);
    collect(type.decorators);
    return annotation;
    /**
     * @param {?} annotations
     * @return {?}
     */
    function collect(annotations) {
        if (annotations) {
            annotations.forEach(readAnnotation);
        }
    }
    /**
     * @param {?} decorator
     * @return {?}
     */
    function readAnnotation(decorator) {
        if (!annotation) {
            /** @type {?} */
            const proto = Object.getPrototypeOf(decorator);
            if (proto.ngMetadataName == name) {
                annotation = (/** @type {?} */ (decorator));
            }
            else if (decorator.type) {
                /** @type {?} */
                const proto = Object.getPrototypeOf(decorator.type);
                if (proto.ngMetadataName == name) {
                    annotation = decorator.args[0];
                }
            }
        }
    }
}
/**
 * Keep track of compiled components. This is needed because in tests we often want to compile the
 * same component with more than one NgModule. This would cause an error unless we reset which
 * NgModule the component belongs to. We keep the list of compiled components here so that the
 * TestBed can reset it later.
 * @type {?}
 */
let ownerNgModule = new Map();
/** @type {?} */
let verifiedNgModule = new Map();
/**
 * @return {?}
 */
export function resetCompiledComponents() {
    ownerNgModule = new Map();
    verifiedNgModule = new Map();
    moduleQueue.length = 0;
}
/**
 * Computes the combined declarations of explicit declarations, as well as declarations inherited
 * by
 * traversing the exports of imported modules.
 * @param {?} type
 * @return {?}
 */
function computeCombinedExports(type) {
    type = resolveForwardRef(type);
    /** @type {?} */
    /** @nocollapse */ const ngModuleDef = getNgModuleDef(type, true);
    return [...flatten(ngModuleDef.exports.map((type) => {
            /** @type {?} */
            /** @nocollapse */ const ngModuleDef = getNgModuleDef(type);
            if (ngModuleDef) {
                verifySemanticsOfNgModuleDef((/** @type {?} */ ((/** @type {?} */ (type)))));
                return computeCombinedExports(type);
            }
            else {
                return type;
            }
        }))];
}
/**
 * Some declared components may be compiled asynchronously, and thus may not have their
 * ngComponentDef set yet. If this is the case, then a reference to the module is written into
 * the `ngSelectorScope` property of the declared type.
 * @param {?} moduleType
 * @param {?} ngModule
 * @return {?}
 */
function setScopeOnDeclaredComponents(moduleType, ngModule) {
    /** @type {?} */
    const declarations = flatten(ngModule.declarations || EMPTY_ARRAY);
    /** @type {?} */
    const transitiveScopes = transitiveScopesFor(moduleType);
    declarations.forEach(declaration => {
        if (declaration.hasOwnProperty(NG_COMPONENT_DEF)) {
            // An `ngComponentDef` field exists - go ahead and patch the component directly.
            /** @type {?} */
            const component = (/** @type {?} */ (declaration));
            /** @type {?} */
            const componentDef = (/** @type {?} */ (getComponentDef(component)));
            patchComponentDefWithScope(componentDef, transitiveScopes);
        }
        else if (!declaration.hasOwnProperty(NG_DIRECTIVE_DEF) && !declaration.hasOwnProperty(NG_PIPE_DEF)) {
            // Set `ngSelectorScope` for future reference when the component compilation finishes.
            ((/** @type {?} */ (declaration))).ngSelectorScope = moduleType;
        }
    });
}
/**
 * Patch the definition of a component with directives and pipes from the compilation scope of
 * a given module.
 * @template C
 * @param {?} componentDef
 * @param {?} transitiveScopes
 * @return {?}
 */
export function patchComponentDefWithScope(componentDef, transitiveScopes) {
    componentDef.directiveDefs = () => Array.from(transitiveScopes.compilation.directives)
        .map(dir => getDirectiveDef(dir) || (/** @type {?} */ (getComponentDef(dir))))
        .filter(def => !!def);
    componentDef.pipeDefs = () => Array.from(transitiveScopes.compilation.pipes).map(pipe => (/** @type {?} */ (getPipeDef(pipe))));
}
/**
 * Compute the pair of transitive scopes (compilation scope and exported scope) for a given module.
 *
 * This operation is memoized and the result is cached on the module's definition. It can be called
 * on modules with components that have not fully compiled yet, but the result should not be used
 * until they have.
 * @template T
 * @param {?} moduleType
 * @param {?=} processNgModuleFn
 * @return {?}
 */
export function transitiveScopesFor(moduleType, processNgModuleFn) {
    if (!isNgModule(moduleType)) {
        throw new Error(`${moduleType.name} does not have an ngModuleDef`);
    }
    /** @type {?} */
    const def = (/** @type {?} */ (getNgModuleDef(moduleType)));
    if (def.transitiveCompileScopes !== null) {
        return def.transitiveCompileScopes;
    }
    /** @type {?} */
    const scopes = {
        compilation: {
            directives: new Set(),
            pipes: new Set(),
        },
        exported: {
            directives: new Set(),
            pipes: new Set(),
        },
    };
    def.declarations.forEach(declared => {
        /** @type {?} */
        const declaredWithDefs = (/** @type {?} */ (declared));
        if (getPipeDef(declaredWithDefs)) {
            scopes.compilation.pipes.add(declared);
        }
        else {
            // Either declared has an ngComponentDef or ngDirectiveDef, or it's a component which hasn't
            // had its template compiled yet. In either case, it gets added to the compilation's
            // directives.
            scopes.compilation.directives.add(declared);
        }
    });
    def.imports.forEach((imported) => {
        /** @type {?} */
        const importedType = (/** @type {?} */ (imported));
        if (!isNgModule(importedType)) {
            throw new Error(`Importing ${importedType.name} which does not have an ngModuleDef`);
        }
        if (processNgModuleFn) {
            processNgModuleFn((/** @type {?} */ (importedType)));
        }
        // When this module imports another, the imported module's exported directives and pipes are
        // added to the compilation scope of this module.
        /** @type {?} */
        const importedScope = transitiveScopesFor(importedType, processNgModuleFn);
        importedScope.exported.directives.forEach(entry => scopes.compilation.directives.add(entry));
        importedScope.exported.pipes.forEach(entry => scopes.compilation.pipes.add(entry));
    });
    def.exports.forEach((exported) => {
        /** @type {?} */
        const exportedType = (/** @type {?} */ (exported));
        // Either the type is a module, a pipe, or a component/directive (which may not have an
        // ngComponentDef as it might be compiled asynchronously).
        if (isNgModule(exportedType)) {
            // When this module exports another, the exported module's exported directives and pipes are
            // added to both the compilation and exported scopes of this module.
            /** @type {?} */
            const exportedScope = transitiveScopesFor(exportedType, processNgModuleFn);
            exportedScope.exported.directives.forEach(entry => {
                scopes.compilation.directives.add(entry);
                scopes.exported.directives.add(entry);
            });
            exportedScope.exported.pipes.forEach(entry => {
                scopes.compilation.pipes.add(entry);
                scopes.exported.pipes.add(entry);
            });
        }
        else if (getPipeDef(exportedType)) {
            scopes.exported.pipes.add(exportedType);
        }
        else {
            scopes.exported.directives.add(exportedType);
        }
    });
    def.transitiveCompileScopes = scopes;
    return scopes;
}
/**
 * @template T
 * @param {?} values
 * @param {?=} mapFn
 * @return {?}
 */
function flatten(values, mapFn) {
    /** @type {?} */
    const out = [];
    values.forEach(value => {
        if (Array.isArray(value)) {
            out.push(...flatten(value, mapFn));
        }
        else {
            out.push(mapFn ? mapFn(value) : value);
        }
    });
    return out;
}
/**
 * @param {?} value
 * @return {?}
 */
function expandModuleWithProviders(value) {
    if (isModuleWithProviders(value)) {
        return value.ngModule;
    }
    return value;
}
/**
 * @param {?} value
 * @return {?}
 */
function isModuleWithProviders(value) {
    return ((/** @type {?} */ (value))).ngModule !== undefined;
}
/**
 * @template T
 * @param {?} value
 * @return {?}
 */
function isNgModule(value) {
    return !!getNgModuleDef(value);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvbW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUEyQixpQkFBaUIsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQzNGLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3ZELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUN4RCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUV0RCxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSx1Q0FBdUMsQ0FBQztBQUczRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLGVBQWUsRUFBRSxlQUFlLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMzRixPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUd6RixPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRXhDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7O01BRXZDLFdBQVcsR0FBZ0IsRUFBRTs7OztBQUVuQyw4QkFHQzs7O0lBRkMscUNBQXNCOztJQUN0QixtQ0FBbUI7OztNQUdmLFdBQVcsR0FBc0IsRUFBRTs7Ozs7Ozs7QUFNekMsU0FBUyw4QkFBOEIsQ0FBQyxVQUFxQixFQUFFLFFBQWtCO0lBQy9FLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBQyxVQUFVLEVBQUUsUUFBUSxFQUFDLENBQUMsQ0FBQztBQUMzQyxDQUFDOztJQUVHLG1CQUFtQixHQUFHLEtBQUs7Ozs7Ozs7QUFNL0IsTUFB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O1FBQ2hDLE9BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBQztLQUN2QjtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQzs7Ozs7QUFFRCxTQUFTLHFCQUFxQixDQUFDLEtBQVU7SUFDdkMsT0FBTyxDQUFDLG1CQUFBLEtBQUssRUFBbUIsQ0FBQyxDQUFDLFFBQVEsS0FBSyxTQUFTLENBQUM7QUFDM0QsQ0FBQzs7Ozs7O0FBRUQsU0FBUyxVQUFVLENBQUksS0FBYztJQUNuQyxPQUFPLENBQUMsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDakMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSM0luamVjdG9yTWV0YWRhdGFGYWNhZGUsIGdldENvbXBpbGVyRmFjYWRlfSBmcm9tICcuLi8uLi9jb21waWxlci9jb21waWxlcl9mYWNhZGUnO1xuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi4vLi4vZGkvZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtOR19JTkpFQ1RPUl9ERUZ9IGZyb20gJy4uLy4uL2RpL2ludGVyZmFjZS9kZWZzJztcbmltcG9ydCB7cmVmbGVjdERlcGVuZGVuY2llc30gZnJvbSAnLi4vLi4vZGkvaml0L3V0aWwnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge3JlZ2lzdGVyTmdNb2R1bGVUeXBlfSBmcm9tICcuLi8uLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnlfbG9hZGVyJztcbmltcG9ydCB7Q29tcG9uZW50fSBmcm9tICcuLi8uLi9tZXRhZGF0YSc7XG5pbXBvcnQge01vZHVsZVdpdGhQcm92aWRlcnMsIE5nTW9kdWxlLCBOZ01vZHVsZURlZiwgTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9uZ19tb2R1bGUnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZiwgZ2V0RGlyZWN0aXZlRGVmLCBnZXROZ01vZHVsZURlZiwgZ2V0UGlwZURlZn0gZnJvbSAnLi4vZGVmaW5pdGlvbic7XG5pbXBvcnQge05HX0NPTVBPTkVOVF9ERUYsIE5HX0RJUkVDVElWRV9ERUYsIE5HX01PRFVMRV9ERUYsIE5HX1BJUEVfREVGfSBmcm9tICcuLi9maWVsZHMnO1xuaW1wb3J0IHtDb21wb25lbnREZWZ9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge05nTW9kdWxlVHlwZX0gZnJvbSAnLi4vbmdfbW9kdWxlX3JlZic7XG5pbXBvcnQge3JlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbCc7XG5cbmltcG9ydCB7YW5ndWxhckNvcmVFbnZ9IGZyb20gJy4vZW52aXJvbm1lbnQnO1xuXG5jb25zdCBFTVBUWV9BUlJBWTogVHlwZTxhbnk+W10gPSBbXTtcblxuaW50ZXJmYWNlIE1vZHVsZVF1ZXVlSXRlbSB7XG4gIG1vZHVsZVR5cGU6IFR5cGU8YW55PjtcbiAgbmdNb2R1bGU6IE5nTW9kdWxlO1xufVxuXG5jb25zdCBtb2R1bGVRdWV1ZTogTW9kdWxlUXVldWVJdGVtW10gPSBbXTtcblxuLyoqXG4gKiBFbnF1ZXVlcyBtb2R1bGVEZWYgdG8gYmUgY2hlY2tlZCBsYXRlciB0byBzZWUgaWYgc2NvcGUgY2FuIGJlIHNldCBvbiBpdHNcbiAqIGNvbXBvbmVudCBkZWNsYXJhdGlvbnMuXG4gKi9cbmZ1bmN0aW9uIGVucXVldWVNb2R1bGVGb3JEZWxheWVkU2NvcGluZyhtb2R1bGVUeXBlOiBUeXBlPGFueT4sIG5nTW9kdWxlOiBOZ01vZHVsZSkge1xuICBtb2R1bGVRdWV1ZS5wdXNoKHttb2R1bGVUeXBlLCBuZ01vZHVsZX0pO1xufVxuXG5sZXQgZmx1c2hpbmdNb2R1bGVRdWV1ZSA9IGZhbHNlO1xuLyoqXG4gKiBMb29wcyBvdmVyIHF1ZXVlZCBtb2R1bGUgZGVmaW5pdGlvbnMsIGlmIGEgZ2l2ZW4gbW9kdWxlIGRlZmluaXRpb24gaGFzIGFsbCBvZiBpdHNcbiAqIGRlY2xhcmF0aW9ucyByZXNvbHZlZCwgaXQgZGVxdWV1ZXMgdGhhdCBtb2R1bGUgZGVmaW5pdGlvbiBhbmQgc2V0cyB0aGUgc2NvcGUgb25cbiAqIGl0cyBkZWNsYXJhdGlvbnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmbHVzaE1vZHVsZVNjb3BpbmdRdWV1ZUFzTXVjaEFzUG9zc2libGUoKSB7XG4gIGlmICghZmx1c2hpbmdNb2R1bGVRdWV1ZSkge1xuICAgIGZsdXNoaW5nTW9kdWxlUXVldWUgPSB0cnVlO1xuICAgIHRyeSB7XG4gICAgICBmb3IgKGxldCBpID0gbW9kdWxlUXVldWUubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgY29uc3Qge21vZHVsZVR5cGUsIG5nTW9kdWxlfSA9IG1vZHVsZVF1ZXVlW2ldO1xuXG4gICAgICAgIGlmIChuZ01vZHVsZS5kZWNsYXJhdGlvbnMgJiYgbmdNb2R1bGUuZGVjbGFyYXRpb25zLmV2ZXJ5KGlzUmVzb2x2ZWREZWNsYXJhdGlvbikpIHtcbiAgICAgICAgICAvLyBkZXF1ZXVlXG4gICAgICAgICAgbW9kdWxlUXVldWUuc3BsaWNlKGksIDEpO1xuICAgICAgICAgIHNldFNjb3BlT25EZWNsYXJlZENvbXBvbmVudHMobW9kdWxlVHlwZSwgbmdNb2R1bGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGZsdXNoaW5nTW9kdWxlUXVldWUgPSBmYWxzZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydXRoeSBpZiBhIGRlY2xhcmF0aW9uIGhhcyByZXNvbHZlZC4gSWYgdGhlIGRlY2xhcmF0aW9uIGhhcHBlbnMgdG8gYmVcbiAqIGFuIGFycmF5IG9mIGRlY2xhcmF0aW9ucywgaXQgd2lsbCByZWN1cnNlIHRvIGNoZWNrIGVhY2ggZGVjbGFyYXRpb24gaW4gdGhhdCBhcnJheVxuICogKHdoaWNoIG1heSBhbHNvIGJlIGFycmF5cykuXG4gKi9cbmZ1bmN0aW9uIGlzUmVzb2x2ZWREZWNsYXJhdGlvbihkZWNsYXJhdGlvbjogYW55W10gfCBUeXBlPGFueT4pOiBib29sZWFuIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkoZGVjbGFyYXRpb24pKSB7XG4gICAgcmV0dXJuIGRlY2xhcmF0aW9uLmV2ZXJ5KGlzUmVzb2x2ZWREZWNsYXJhdGlvbik7XG4gIH1cbiAgcmV0dXJuICEhcmVzb2x2ZUZvcndhcmRSZWYoZGVjbGFyYXRpb24pO1xufVxuXG4vKipcbiAqIENvbXBpbGVzIGEgbW9kdWxlIGluIEpJVCBtb2RlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gYXV0b21hdGljYWxseSBnZXRzIGNhbGxlZCB3aGVuIGEgY2xhc3MgaGFzIGEgYEBOZ01vZHVsZWAgZGVjb3JhdG9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZU5nTW9kdWxlKG1vZHVsZVR5cGU6IFR5cGU8YW55PiwgbmdNb2R1bGU6IE5nTW9kdWxlID0ge30pOiB2b2lkIHtcbiAgY29tcGlsZU5nTW9kdWxlRGVmcyhtb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZSwgbmdNb2R1bGUpO1xuXG4gIC8vIEJlY2F1c2Ugd2UgZG9uJ3Qga25vdyBpZiBhbGwgZGVjbGFyYXRpb25zIGhhdmUgcmVzb2x2ZWQgeWV0IGF0IHRoZSBtb21lbnQgdGhlXG4gIC8vIE5nTW9kdWxlIGRlY29yYXRvciBpcyBleGVjdXRpbmcsIHdlJ3JlIGVucXVldWVpbmcgdGhlIHNldHRpbmcgb2YgbW9kdWxlIHNjb3BlXG4gIC8vIG9uIGl0cyBkZWNsYXJhdGlvbnMgdG8gYmUgcnVuIGF0IGEgbGF0ZXIgdGltZSB3aGVuIGFsbCBkZWNsYXJhdGlvbnMgZm9yIHRoZSBtb2R1bGUsXG4gIC8vIGluY2x1ZGluZyBmb3J3YXJkIHJlZnMsIGhhdmUgcmVzb2x2ZWQuXG4gIGVucXVldWVNb2R1bGVGb3JEZWxheWVkU2NvcGluZyhtb2R1bGVUeXBlLCBuZ01vZHVsZSk7XG59XG5cbi8qKlxuICogQ29tcGlsZXMgYW5kIGFkZHMgdGhlIGBuZ01vZHVsZURlZmAgYW5kIGBuZ0luamVjdG9yRGVmYCBwcm9wZXJ0aWVzIHRvIHRoZSBtb2R1bGUgY2xhc3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlTmdNb2R1bGVEZWZzKG1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZSwgbmdNb2R1bGU6IE5nTW9kdWxlKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKG1vZHVsZVR5cGUsICdSZXF1aXJlZCB2YWx1ZSBtb2R1bGVUeXBlJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKG5nTW9kdWxlLCAnUmVxdWlyZWQgdmFsdWUgbmdNb2R1bGUnKTtcbiAgY29uc3QgZGVjbGFyYXRpb25zOiBUeXBlPGFueT5bXSA9IGZsYXR0ZW4obmdNb2R1bGUuZGVjbGFyYXRpb25zIHx8IEVNUFRZX0FSUkFZKTtcblxuICBsZXQgbmdNb2R1bGVEZWY6IGFueSA9IG51bGw7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShtb2R1bGVUeXBlLCBOR19NT0RVTEVfREVGLCB7XG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKG5nTW9kdWxlRGVmID09PSBudWxsKSB7XG4gICAgICAgIG5nTW9kdWxlRGVmID0gZ2V0Q29tcGlsZXJGYWNhZGUoKS5jb21waWxlTmdNb2R1bGUoXG4gICAgICAgICAgICBhbmd1bGFyQ29yZUVudiwgYG5nOi8vJHttb2R1bGVUeXBlLm5hbWV9L25nTW9kdWxlRGVmLmpzYCwge1xuICAgICAgICAgICAgICB0eXBlOiBtb2R1bGVUeXBlLFxuICAgICAgICAgICAgICBib290c3RyYXA6IGZsYXR0ZW4obmdNb2R1bGUuYm9vdHN0cmFwIHx8IEVNUFRZX0FSUkFZLCByZXNvbHZlRm9yd2FyZFJlZiksXG4gICAgICAgICAgICAgIGRlY2xhcmF0aW9uczogZGVjbGFyYXRpb25zLm1hcChyZXNvbHZlRm9yd2FyZFJlZiksXG4gICAgICAgICAgICAgIGltcG9ydHM6IGZsYXR0ZW4obmdNb2R1bGUuaW1wb3J0cyB8fCBFTVBUWV9BUlJBWSwgcmVzb2x2ZUZvcndhcmRSZWYpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKGV4cGFuZE1vZHVsZVdpdGhQcm92aWRlcnMpLFxuICAgICAgICAgICAgICBleHBvcnRzOiBmbGF0dGVuKG5nTW9kdWxlLmV4cG9ydHMgfHwgRU1QVFlfQVJSQVksIHJlc29sdmVGb3J3YXJkUmVmKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChleHBhbmRNb2R1bGVXaXRoUHJvdmlkZXJzKSxcbiAgICAgICAgICAgICAgZW1pdElubGluZTogdHJ1ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5nTW9kdWxlRGVmO1xuICAgIH1cbiAgfSk7XG4gIGlmIChuZ01vZHVsZS5pZCkge1xuICAgIHJlZ2lzdGVyTmdNb2R1bGVUeXBlKG5nTW9kdWxlLmlkLCBtb2R1bGVUeXBlKTtcbiAgfVxuXG4gIGxldCBuZ0luamVjdG9yRGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkobW9kdWxlVHlwZSwgTkdfSU5KRUNUT1JfREVGLCB7XG4gICAgZ2V0OiAoKSA9PiB7XG4gICAgICBpZiAobmdJbmplY3RvckRlZiA9PT0gbnVsbCkge1xuICAgICAgICBuZ0Rldk1vZGUgJiYgdmVyaWZ5U2VtYW50aWNzT2ZOZ01vZHVsZURlZihtb2R1bGVUeXBlIGFzIGFueSBhcyBOZ01vZHVsZVR5cGUpO1xuICAgICAgICBjb25zdCBtZXRhOiBSM0luamVjdG9yTWV0YWRhdGFGYWNhZGUgPSB7XG4gICAgICAgICAgbmFtZTogbW9kdWxlVHlwZS5uYW1lLFxuICAgICAgICAgIHR5cGU6IG1vZHVsZVR5cGUsXG4gICAgICAgICAgZGVwczogcmVmbGVjdERlcGVuZGVuY2llcyhtb2R1bGVUeXBlKSxcbiAgICAgICAgICBwcm92aWRlcnM6IG5nTW9kdWxlLnByb3ZpZGVycyB8fCBFTVBUWV9BUlJBWSxcbiAgICAgICAgICBpbXBvcnRzOiBbXG4gICAgICAgICAgICAobmdNb2R1bGUuaW1wb3J0cyB8fCBFTVBUWV9BUlJBWSkubWFwKHJlc29sdmVGb3J3YXJkUmVmKSxcbiAgICAgICAgICAgIChuZ01vZHVsZS5leHBvcnRzIHx8IEVNUFRZX0FSUkFZKS5tYXAocmVzb2x2ZUZvcndhcmRSZWYpLFxuICAgICAgICAgIF0sXG4gICAgICAgIH07XG4gICAgICAgIG5nSW5qZWN0b3JEZWYgPSBnZXRDb21waWxlckZhY2FkZSgpLmNvbXBpbGVJbmplY3RvcihcbiAgICAgICAgICAgIGFuZ3VsYXJDb3JlRW52LCBgbmc6Ly8ke21vZHVsZVR5cGUubmFtZX0vbmdJbmplY3RvckRlZi5qc2AsIG1ldGEpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5nSW5qZWN0b3JEZWY7XG4gICAgfSxcbiAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGUsXG4gIH0pO1xufVxuXG5mdW5jdGlvbiB2ZXJpZnlTZW1hbnRpY3NPZk5nTW9kdWxlRGVmKG1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZSk6IHZvaWQge1xuICBpZiAodmVyaWZpZWROZ01vZHVsZS5nZXQobW9kdWxlVHlwZSkpIHJldHVybjtcbiAgdmVyaWZpZWROZ01vZHVsZS5zZXQobW9kdWxlVHlwZSwgdHJ1ZSk7XG4gIG1vZHVsZVR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZihtb2R1bGVUeXBlKTtcbiAgY29uc3QgbmdNb2R1bGVEZWYgPSBnZXROZ01vZHVsZURlZihtb2R1bGVUeXBlLCB0cnVlKTtcbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuICBuZ01vZHVsZURlZi5kZWNsYXJhdGlvbnMuZm9yRWFjaCh2ZXJpZnlEZWNsYXJhdGlvbnNIYXZlRGVmaW5pdGlvbnMpO1xuICBjb25zdCBjb21iaW5lZERlY2xhcmF0aW9uczogVHlwZTxhbnk+W10gPSBbXG4gICAgLi4ubmdNb2R1bGVEZWYuZGVjbGFyYXRpb25zLm1hcChyZXNvbHZlRm9yd2FyZFJlZiksICAvL1xuICAgIC4uLmZsYXR0ZW4obmdNb2R1bGVEZWYuaW1wb3J0cy5tYXAoY29tcHV0ZUNvbWJpbmVkRXhwb3J0cyksIHJlc29sdmVGb3J3YXJkUmVmKSxcbiAgXTtcbiAgbmdNb2R1bGVEZWYuZXhwb3J0cy5mb3JFYWNoKHZlcmlmeUV4cG9ydHNBcmVEZWNsYXJlZE9yUmVFeHBvcnRlZCk7XG4gIG5nTW9kdWxlRGVmLmRlY2xhcmF0aW9ucy5mb3JFYWNoKHZlcmlmeURlY2xhcmF0aW9uSXNVbmlxdWUpO1xuICBuZ01vZHVsZURlZi5kZWNsYXJhdGlvbnMuZm9yRWFjaCh2ZXJpZnlDb21wb25lbnRFbnRyeUNvbXBvbmVudHNJc1BhcnRPZk5nTW9kdWxlKTtcblxuICBjb25zdCBuZ01vZHVsZSA9IGdldEFubm90YXRpb248TmdNb2R1bGU+KG1vZHVsZVR5cGUsICdOZ01vZHVsZScpO1xuICBpZiAobmdNb2R1bGUpIHtcbiAgICBuZ01vZHVsZS5pbXBvcnRzICYmXG4gICAgICAgIGZsYXR0ZW4obmdNb2R1bGUuaW1wb3J0cywgdW53cmFwTW9kdWxlV2l0aFByb3ZpZGVyc0ltcG9ydHMpXG4gICAgICAgICAgICAuZm9yRWFjaCh2ZXJpZnlTZW1hbnRpY3NPZk5nTW9kdWxlRGVmKTtcbiAgICBuZ01vZHVsZS5ib290c3RyYXAgJiYgbmdNb2R1bGUuYm9vdHN0cmFwLmZvckVhY2godmVyaWZ5Q29tcG9uZW50SXNQYXJ0T2ZOZ01vZHVsZSk7XG4gICAgbmdNb2R1bGUuZW50cnlDb21wb25lbnRzICYmIG5nTW9kdWxlLmVudHJ5Q29tcG9uZW50cy5mb3JFYWNoKHZlcmlmeUNvbXBvbmVudElzUGFydE9mTmdNb2R1bGUpO1xuICB9XG5cbiAgLy8gVGhyb3cgRXJyb3IgaWYgYW55IGVycm9ycyB3ZXJlIGRldGVjdGVkLlxuICBpZiAoZXJyb3JzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBFcnJvcihlcnJvcnMuam9pbignXFxuJykpO1xuICB9XG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICBmdW5jdGlvbiB2ZXJpZnlEZWNsYXJhdGlvbnNIYXZlRGVmaW5pdGlvbnModHlwZTogVHlwZTxhbnk+KTogdm9pZCB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICAgIGNvbnN0IGRlZiA9IGdldENvbXBvbmVudERlZih0eXBlKSB8fCBnZXREaXJlY3RpdmVEZWYodHlwZSkgfHwgZ2V0UGlwZURlZih0eXBlKTtcbiAgICBpZiAoIWRlZikge1xuICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgICAgYFVuZXhwZWN0ZWQgdmFsdWUgJyR7cmVuZGVyU3RyaW5naWZ5KHR5cGUpfScgZGVjbGFyZWQgYnkgdGhlIG1vZHVsZSAnJHtyZW5kZXJTdHJpbmdpZnkobW9kdWxlVHlwZSl9Jy4gUGxlYXNlIGFkZCBhIEBQaXBlL0BEaXJlY3RpdmUvQENvbXBvbmVudCBhbm5vdGF0aW9uLmApO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHZlcmlmeUV4cG9ydHNBcmVEZWNsYXJlZE9yUmVFeHBvcnRlZCh0eXBlOiBUeXBlPGFueT4pIHtcbiAgICB0eXBlID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZSk7XG4gICAgY29uc3Qga2luZCA9IGdldENvbXBvbmVudERlZih0eXBlKSAmJiAnY29tcG9uZW50JyB8fCBnZXREaXJlY3RpdmVEZWYodHlwZSkgJiYgJ2RpcmVjdGl2ZScgfHxcbiAgICAgICAgZ2V0UGlwZURlZih0eXBlKSAmJiAncGlwZSc7XG4gICAgaWYgKGtpbmQpIHtcbiAgICAgIC8vIG9ubHkgY2hlY2tlZCBpZiB3ZSBhcmUgZGVjbGFyZWQgYXMgQ29tcG9uZW50LCBEaXJlY3RpdmUsIG9yIFBpcGVcbiAgICAgIC8vIE1vZHVsZXMgZG9uJ3QgbmVlZCB0byBiZSBkZWNsYXJlZCBvciBpbXBvcnRlZC5cbiAgICAgIGlmIChjb21iaW5lZERlY2xhcmF0aW9ucy5sYXN0SW5kZXhPZih0eXBlKSA9PT0gLTEpIHtcbiAgICAgICAgLy8gV2UgYXJlIGV4cG9ydGluZyBzb21ldGhpbmcgd2hpY2ggd2UgZG9uJ3QgZXhwbGljaXRseSBkZWNsYXJlIG9yIGltcG9ydC5cbiAgICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgICAgICBgQ2FuJ3QgZXhwb3J0ICR7a2luZH0gJHtyZW5kZXJTdHJpbmdpZnkodHlwZSl9IGZyb20gJHtyZW5kZXJTdHJpbmdpZnkobW9kdWxlVHlwZSl9IGFzIGl0IHdhcyBuZWl0aGVyIGRlY2xhcmVkIG5vciBpbXBvcnRlZCFgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB2ZXJpZnlEZWNsYXJhdGlvbklzVW5pcXVlKHR5cGU6IFR5cGU8YW55Pikge1xuICAgIHR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlKTtcbiAgICBjb25zdCBleGlzdGluZ01vZHVsZSA9IG93bmVyTmdNb2R1bGUuZ2V0KHR5cGUpO1xuICAgIGlmIChleGlzdGluZ01vZHVsZSAmJiBleGlzdGluZ01vZHVsZSAhPT0gbW9kdWxlVHlwZSkge1xuICAgICAgY29uc3QgbW9kdWxlcyA9IFtleGlzdGluZ01vZHVsZSwgbW9kdWxlVHlwZV0ubWFwKHJlbmRlclN0cmluZ2lmeSkuc29ydCgpO1xuICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgICAgYFR5cGUgJHtyZW5kZXJTdHJpbmdpZnkodHlwZSl9IGlzIHBhcnQgb2YgdGhlIGRlY2xhcmF0aW9ucyBvZiAyIG1vZHVsZXM6ICR7bW9kdWxlc1swXX0gYW5kICR7bW9kdWxlc1sxXX0hIGAgK1xuICAgICAgICAgIGBQbGVhc2UgY29uc2lkZXIgbW92aW5nICR7cmVuZGVyU3RyaW5naWZ5KHR5cGUpfSB0byBhIGhpZ2hlciBtb2R1bGUgdGhhdCBpbXBvcnRzICR7bW9kdWxlc1swXX0gYW5kICR7bW9kdWxlc1sxXX0uIGAgK1xuICAgICAgICAgIGBZb3UgY2FuIGFsc28gY3JlYXRlIGEgbmV3IE5nTW9kdWxlIHRoYXQgZXhwb3J0cyBhbmQgaW5jbHVkZXMgJHtyZW5kZXJTdHJpbmdpZnkodHlwZSl9IHRoZW4gaW1wb3J0IHRoYXQgTmdNb2R1bGUgaW4gJHttb2R1bGVzWzBdfSBhbmQgJHttb2R1bGVzWzFdfS5gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTWFyayB0eXBlIGFzIGhhdmluZyBvd25lci5cbiAgICAgIG93bmVyTmdNb2R1bGUuc2V0KHR5cGUsIG1vZHVsZVR5cGUpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHZlcmlmeUNvbXBvbmVudElzUGFydE9mTmdNb2R1bGUodHlwZTogVHlwZTxhbnk+KSB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICAgIGNvbnN0IGV4aXN0aW5nTW9kdWxlID0gb3duZXJOZ01vZHVsZS5nZXQodHlwZSk7XG4gICAgaWYgKCFleGlzdGluZ01vZHVsZSkge1xuICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgICAgYENvbXBvbmVudCAke3JlbmRlclN0cmluZ2lmeSh0eXBlKX0gaXMgbm90IHBhcnQgb2YgYW55IE5nTW9kdWxlIG9yIHRoZSBtb2R1bGUgaGFzIG5vdCBiZWVuIGltcG9ydGVkIGludG8geW91ciBtb2R1bGUuYCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdmVyaWZ5Q29tcG9uZW50RW50cnlDb21wb25lbnRzSXNQYXJ0T2ZOZ01vZHVsZSh0eXBlOiBUeXBlPGFueT4pIHtcbiAgICB0eXBlID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZSk7XG4gICAgaWYgKGdldENvbXBvbmVudERlZih0eXBlKSkge1xuICAgICAgLy8gV2Uga25vdyB3ZSBhcmUgY29tcG9uZW50XG4gICAgICBjb25zdCBjb21wb25lbnQgPSBnZXRBbm5vdGF0aW9uPENvbXBvbmVudD4odHlwZSwgJ0NvbXBvbmVudCcpO1xuICAgICAgaWYgKGNvbXBvbmVudCAmJiBjb21wb25lbnQuZW50cnlDb21wb25lbnRzKSB7XG4gICAgICAgIGNvbXBvbmVudC5lbnRyeUNvbXBvbmVudHMuZm9yRWFjaCh2ZXJpZnlDb21wb25lbnRJc1BhcnRPZk5nTW9kdWxlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdW53cmFwTW9kdWxlV2l0aFByb3ZpZGVyc0ltcG9ydHMoXG4gICAgdHlwZU9yV2l0aFByb3ZpZGVyczogTmdNb2R1bGVUeXBlPGFueT58IHtuZ01vZHVsZTogTmdNb2R1bGVUeXBlPGFueT59KTogTmdNb2R1bGVUeXBlPGFueT4ge1xuICB0eXBlT3JXaXRoUHJvdmlkZXJzID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZU9yV2l0aFByb3ZpZGVycyk7XG4gIHJldHVybiAodHlwZU9yV2l0aFByb3ZpZGVycyBhcyBhbnkpLm5nTW9kdWxlIHx8IHR5cGVPcldpdGhQcm92aWRlcnM7XG59XG5cbmZ1bmN0aW9uIGdldEFubm90YXRpb248VD4odHlwZTogYW55LCBuYW1lOiBzdHJpbmcpOiBUfG51bGwge1xuICBsZXQgYW5ub3RhdGlvbjogVHxudWxsID0gbnVsbDtcbiAgY29sbGVjdCh0eXBlLl9fYW5ub3RhdGlvbnNfXyk7XG4gIGNvbGxlY3QodHlwZS5kZWNvcmF0b3JzKTtcbiAgcmV0dXJuIGFubm90YXRpb247XG5cbiAgZnVuY3Rpb24gY29sbGVjdChhbm5vdGF0aW9uczogYW55W10gfCBudWxsKSB7XG4gICAgaWYgKGFubm90YXRpb25zKSB7XG4gICAgICBhbm5vdGF0aW9ucy5mb3JFYWNoKHJlYWRBbm5vdGF0aW9uKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZWFkQW5ub3RhdGlvbihcbiAgICAgIGRlY29yYXRvcjoge3R5cGU6IHtwcm90b3R5cGU6IHtuZ01ldGFkYXRhTmFtZTogc3RyaW5nfSwgYXJnczogYW55W119LCBhcmdzOiBhbnl9KTogdm9pZCB7XG4gICAgaWYgKCFhbm5vdGF0aW9uKSB7XG4gICAgICBjb25zdCBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihkZWNvcmF0b3IpO1xuICAgICAgaWYgKHByb3RvLm5nTWV0YWRhdGFOYW1lID09IG5hbWUpIHtcbiAgICAgICAgYW5ub3RhdGlvbiA9IGRlY29yYXRvciBhcyBhbnk7XG4gICAgICB9IGVsc2UgaWYgKGRlY29yYXRvci50eXBlKSB7XG4gICAgICAgIGNvbnN0IHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGRlY29yYXRvci50eXBlKTtcbiAgICAgICAgaWYgKHByb3RvLm5nTWV0YWRhdGFOYW1lID09IG5hbWUpIHtcbiAgICAgICAgICBhbm5vdGF0aW9uID0gZGVjb3JhdG9yLmFyZ3NbMF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBLZWVwIHRyYWNrIG9mIGNvbXBpbGVkIGNvbXBvbmVudHMuIFRoaXMgaXMgbmVlZGVkIGJlY2F1c2UgaW4gdGVzdHMgd2Ugb2Z0ZW4gd2FudCB0byBjb21waWxlIHRoZVxuICogc2FtZSBjb21wb25lbnQgd2l0aCBtb3JlIHRoYW4gb25lIE5nTW9kdWxlLiBUaGlzIHdvdWxkIGNhdXNlIGFuIGVycm9yIHVubGVzcyB3ZSByZXNldCB3aGljaFxuICogTmdNb2R1bGUgdGhlIGNvbXBvbmVudCBiZWxvbmdzIHRvLiBXZSBrZWVwIHRoZSBsaXN0IG9mIGNvbXBpbGVkIGNvbXBvbmVudHMgaGVyZSBzbyB0aGF0IHRoZVxuICogVGVzdEJlZCBjYW4gcmVzZXQgaXQgbGF0ZXIuXG4gKi9cbmxldCBvd25lck5nTW9kdWxlID0gbmV3IE1hcDxUeXBlPGFueT4sIE5nTW9kdWxlVHlwZTxhbnk+PigpO1xubGV0IHZlcmlmaWVkTmdNb2R1bGUgPSBuZXcgTWFwPE5nTW9kdWxlVHlwZTxhbnk+LCBib29sZWFuPigpO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRDb21waWxlZENvbXBvbmVudHMoKTogdm9pZCB7XG4gIG93bmVyTmdNb2R1bGUgPSBuZXcgTWFwPFR5cGU8YW55PiwgTmdNb2R1bGVUeXBlPGFueT4+KCk7XG4gIHZlcmlmaWVkTmdNb2R1bGUgPSBuZXcgTWFwPE5nTW9kdWxlVHlwZTxhbnk+LCBib29sZWFuPigpO1xuICBtb2R1bGVRdWV1ZS5sZW5ndGggPSAwO1xufVxuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBjb21iaW5lZCBkZWNsYXJhdGlvbnMgb2YgZXhwbGljaXQgZGVjbGFyYXRpb25zLCBhcyB3ZWxsIGFzIGRlY2xhcmF0aW9ucyBpbmhlcml0ZWRcbiAqIGJ5XG4gKiB0cmF2ZXJzaW5nIHRoZSBleHBvcnRzIG9mIGltcG9ydGVkIG1vZHVsZXMuXG4gKiBAcGFyYW0gdHlwZVxuICovXG5mdW5jdGlvbiBjb21wdXRlQ29tYmluZWRFeHBvcnRzKHR5cGU6IFR5cGU8YW55Pik6IFR5cGU8YW55PltdIHtcbiAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICBjb25zdCBuZ01vZHVsZURlZiA9IGdldE5nTW9kdWxlRGVmKHR5cGUsIHRydWUpO1xuICByZXR1cm4gWy4uLmZsYXR0ZW4obmdNb2R1bGVEZWYuZXhwb3J0cy5tYXAoKHR5cGUpID0+IHtcbiAgICBjb25zdCBuZ01vZHVsZURlZiA9IGdldE5nTW9kdWxlRGVmKHR5cGUpO1xuICAgIGlmIChuZ01vZHVsZURlZikge1xuICAgICAgdmVyaWZ5U2VtYW50aWNzT2ZOZ01vZHVsZURlZih0eXBlIGFzIGFueSBhcyBOZ01vZHVsZVR5cGUpO1xuICAgICAgcmV0dXJuIGNvbXB1dGVDb21iaW5lZEV4cG9ydHModHlwZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0eXBlO1xuICAgIH1cbiAgfSkpXTtcbn1cblxuLyoqXG4gKiBTb21lIGRlY2xhcmVkIGNvbXBvbmVudHMgbWF5IGJlIGNvbXBpbGVkIGFzeW5jaHJvbm91c2x5LCBhbmQgdGh1cyBtYXkgbm90IGhhdmUgdGhlaXJcbiAqIG5nQ29tcG9uZW50RGVmIHNldCB5ZXQuIElmIHRoaXMgaXMgdGhlIGNhc2UsIHRoZW4gYSByZWZlcmVuY2UgdG8gdGhlIG1vZHVsZSBpcyB3cml0dGVuIGludG9cbiAqIHRoZSBgbmdTZWxlY3RvclNjb3BlYCBwcm9wZXJ0eSBvZiB0aGUgZGVjbGFyZWQgdHlwZS5cbiAqL1xuZnVuY3Rpb24gc2V0U2NvcGVPbkRlY2xhcmVkQ29tcG9uZW50cyhtb2R1bGVUeXBlOiBUeXBlPGFueT4sIG5nTW9kdWxlOiBOZ01vZHVsZSkge1xuICBjb25zdCBkZWNsYXJhdGlvbnM6IFR5cGU8YW55PltdID0gZmxhdHRlbihuZ01vZHVsZS5kZWNsYXJhdGlvbnMgfHwgRU1QVFlfQVJSQVkpO1xuXG4gIGNvbnN0IHRyYW5zaXRpdmVTY29wZXMgPSB0cmFuc2l0aXZlU2NvcGVzRm9yKG1vZHVsZVR5cGUpO1xuXG4gIGRlY2xhcmF0aW9ucy5mb3JFYWNoKGRlY2xhcmF0aW9uID0+IHtcbiAgICBpZiAoZGVjbGFyYXRpb24uaGFzT3duUHJvcGVydHkoTkdfQ09NUE9ORU5UX0RFRikpIHtcbiAgICAgIC8vIEFuIGBuZ0NvbXBvbmVudERlZmAgZmllbGQgZXhpc3RzIC0gZ28gYWhlYWQgYW5kIHBhdGNoIHRoZSBjb21wb25lbnQgZGlyZWN0bHkuXG4gICAgICBjb25zdCBjb21wb25lbnQgPSBkZWNsYXJhdGlvbiBhcyBUeXBlPGFueT4mIHtuZ0NvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPGFueT59O1xuICAgICAgY29uc3QgY29tcG9uZW50RGVmID0gZ2V0Q29tcG9uZW50RGVmKGNvbXBvbmVudCkgITtcbiAgICAgIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlKGNvbXBvbmVudERlZiwgdHJhbnNpdGl2ZVNjb3Blcyk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICAgIWRlY2xhcmF0aW9uLmhhc093blByb3BlcnR5KE5HX0RJUkVDVElWRV9ERUYpICYmICFkZWNsYXJhdGlvbi5oYXNPd25Qcm9wZXJ0eShOR19QSVBFX0RFRikpIHtcbiAgICAgIC8vIFNldCBgbmdTZWxlY3RvclNjb3BlYCBmb3IgZnV0dXJlIHJlZmVyZW5jZSB3aGVuIHRoZSBjb21wb25lbnQgY29tcGlsYXRpb24gZmluaXNoZXMuXG4gICAgICAoZGVjbGFyYXRpb24gYXMgVHlwZTxhbnk+JiB7bmdTZWxlY3RvclNjb3BlPzogYW55fSkubmdTZWxlY3RvclNjb3BlID0gbW9kdWxlVHlwZTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKipcbiAqIFBhdGNoIHRoZSBkZWZpbml0aW9uIG9mIGEgY29tcG9uZW50IHdpdGggZGlyZWN0aXZlcyBhbmQgcGlwZXMgZnJvbSB0aGUgY29tcGlsYXRpb24gc2NvcGUgb2ZcbiAqIGEgZ2l2ZW4gbW9kdWxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGU8Qz4oXG4gICAgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8Qz4sIHRyYW5zaXRpdmVTY29wZXM6IE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3Blcykge1xuICBjb21wb25lbnREZWYuZGlyZWN0aXZlRGVmcyA9ICgpID0+IEFycmF5LmZyb20odHJhbnNpdGl2ZVNjb3Blcy5jb21waWxhdGlvbi5kaXJlY3RpdmVzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKGRpciA9PiBnZXREaXJlY3RpdmVEZWYoZGlyKSB8fCBnZXRDb21wb25lbnREZWYoZGlyKSAhKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKGRlZiA9PiAhIWRlZik7XG4gIGNvbXBvbmVudERlZi5waXBlRGVmcyA9ICgpID0+XG4gICAgICBBcnJheS5mcm9tKHRyYW5zaXRpdmVTY29wZXMuY29tcGlsYXRpb24ucGlwZXMpLm1hcChwaXBlID0+IGdldFBpcGVEZWYocGlwZSkgISk7XG59XG5cbi8qKlxuICogQ29tcHV0ZSB0aGUgcGFpciBvZiB0cmFuc2l0aXZlIHNjb3BlcyAoY29tcGlsYXRpb24gc2NvcGUgYW5kIGV4cG9ydGVkIHNjb3BlKSBmb3IgYSBnaXZlbiBtb2R1bGUuXG4gKlxuICogVGhpcyBvcGVyYXRpb24gaXMgbWVtb2l6ZWQgYW5kIHRoZSByZXN1bHQgaXMgY2FjaGVkIG9uIHRoZSBtb2R1bGUncyBkZWZpbml0aW9uLiBJdCBjYW4gYmUgY2FsbGVkXG4gKiBvbiBtb2R1bGVzIHdpdGggY29tcG9uZW50cyB0aGF0IGhhdmUgbm90IGZ1bGx5IGNvbXBpbGVkIHlldCwgYnV0IHRoZSByZXN1bHQgc2hvdWxkIG5vdCBiZSB1c2VkXG4gKiB1bnRpbCB0aGV5IGhhdmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2l0aXZlU2NvcGVzRm9yPFQ+KFxuICAgIG1vZHVsZVR5cGU6IFR5cGU8VD4sXG4gICAgcHJvY2Vzc05nTW9kdWxlRm4/OiAobmdNb2R1bGU6IE5nTW9kdWxlVHlwZSkgPT4gdm9pZCk6IE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3BlcyB7XG4gIGlmICghaXNOZ01vZHVsZShtb2R1bGVUeXBlKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHttb2R1bGVUeXBlLm5hbWV9IGRvZXMgbm90IGhhdmUgYW4gbmdNb2R1bGVEZWZgKTtcbiAgfVxuICBjb25zdCBkZWYgPSBnZXROZ01vZHVsZURlZihtb2R1bGVUeXBlKSAhO1xuXG4gIGlmIChkZWYudHJhbnNpdGl2ZUNvbXBpbGVTY29wZXMgIT09IG51bGwpIHtcbiAgICByZXR1cm4gZGVmLnRyYW5zaXRpdmVDb21waWxlU2NvcGVzO1xuICB9XG5cbiAgY29uc3Qgc2NvcGVzOiBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMgPSB7XG4gICAgY29tcGlsYXRpb246IHtcbiAgICAgIGRpcmVjdGl2ZXM6IG5ldyBTZXQ8YW55PigpLFxuICAgICAgcGlwZXM6IG5ldyBTZXQ8YW55PigpLFxuICAgIH0sXG4gICAgZXhwb3J0ZWQ6IHtcbiAgICAgIGRpcmVjdGl2ZXM6IG5ldyBTZXQ8YW55PigpLFxuICAgICAgcGlwZXM6IG5ldyBTZXQ8YW55PigpLFxuICAgIH0sXG4gIH07XG5cbiAgZGVmLmRlY2xhcmF0aW9ucy5mb3JFYWNoKGRlY2xhcmVkID0+IHtcbiAgICBjb25zdCBkZWNsYXJlZFdpdGhEZWZzID0gZGVjbGFyZWQgYXMgVHlwZTxhbnk+JiB7IG5nUGlwZURlZj86IGFueTsgfTtcblxuICAgIGlmIChnZXRQaXBlRGVmKGRlY2xhcmVkV2l0aERlZnMpKSB7XG4gICAgICBzY29wZXMuY29tcGlsYXRpb24ucGlwZXMuYWRkKGRlY2xhcmVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRWl0aGVyIGRlY2xhcmVkIGhhcyBhbiBuZ0NvbXBvbmVudERlZiBvciBuZ0RpcmVjdGl2ZURlZiwgb3IgaXQncyBhIGNvbXBvbmVudCB3aGljaCBoYXNuJ3RcbiAgICAgIC8vIGhhZCBpdHMgdGVtcGxhdGUgY29tcGlsZWQgeWV0LiBJbiBlaXRoZXIgY2FzZSwgaXQgZ2V0cyBhZGRlZCB0byB0aGUgY29tcGlsYXRpb24nc1xuICAgICAgLy8gZGlyZWN0aXZlcy5cbiAgICAgIHNjb3Blcy5jb21waWxhdGlvbi5kaXJlY3RpdmVzLmFkZChkZWNsYXJlZCk7XG4gICAgfVxuICB9KTtcblxuICBkZWYuaW1wb3J0cy5mb3JFYWNoKDxJPihpbXBvcnRlZDogVHlwZTxJPikgPT4ge1xuICAgIGNvbnN0IGltcG9ydGVkVHlwZSA9IGltcG9ydGVkIGFzIFR5cGU8ST4mIHtcbiAgICAgIC8vIElmIGltcG9ydGVkIGlzIGFuIEBOZ01vZHVsZTpcbiAgICAgIG5nTW9kdWxlRGVmPzogTmdNb2R1bGVEZWY8ST47XG4gICAgfTtcblxuICAgIGlmICghaXNOZ01vZHVsZTxJPihpbXBvcnRlZFR5cGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEltcG9ydGluZyAke2ltcG9ydGVkVHlwZS5uYW1lfSB3aGljaCBkb2VzIG5vdCBoYXZlIGFuIG5nTW9kdWxlRGVmYCk7XG4gICAgfVxuXG4gICAgaWYgKHByb2Nlc3NOZ01vZHVsZUZuKSB7XG4gICAgICBwcm9jZXNzTmdNb2R1bGVGbihpbXBvcnRlZFR5cGUgYXMgTmdNb2R1bGVUeXBlKTtcbiAgICB9XG5cbiAgICAvLyBXaGVuIHRoaXMgbW9kdWxlIGltcG9ydHMgYW5vdGhlciwgdGhlIGltcG9ydGVkIG1vZHVsZSdzIGV4cG9ydGVkIGRpcmVjdGl2ZXMgYW5kIHBpcGVzIGFyZVxuICAgIC8vIGFkZGVkIHRvIHRoZSBjb21waWxhdGlvbiBzY29wZSBvZiB0aGlzIG1vZHVsZS5cbiAgICBjb25zdCBpbXBvcnRlZFNjb3BlID0gdHJhbnNpdGl2ZVNjb3Blc0ZvcihpbXBvcnRlZFR5cGUsIHByb2Nlc3NOZ01vZHVsZUZuKTtcbiAgICBpbXBvcnRlZFNjb3BlLmV4cG9ydGVkLmRpcmVjdGl2ZXMuZm9yRWFjaChlbnRyeSA9PiBzY29wZXMuY29tcGlsYXRpb24uZGlyZWN0aXZlcy5hZGQoZW50cnkpKTtcbiAgICBpbXBvcnRlZFNjb3BlLmV4cG9ydGVkLnBpcGVzLmZvckVhY2goZW50cnkgPT4gc2NvcGVzLmNvbXBpbGF0aW9uLnBpcGVzLmFkZChlbnRyeSkpO1xuICB9KTtcblxuICBkZWYuZXhwb3J0cy5mb3JFYWNoKDxFPihleHBvcnRlZDogVHlwZTxFPikgPT4ge1xuICAgIGNvbnN0IGV4cG9ydGVkVHlwZSA9IGV4cG9ydGVkIGFzIFR5cGU8RT4mIHtcbiAgICAgIC8vIENvbXBvbmVudHMsIERpcmVjdGl2ZXMsIE5nTW9kdWxlcywgYW5kIFBpcGVzIGNhbiBhbGwgYmUgZXhwb3J0ZWQuXG4gICAgICBuZ0NvbXBvbmVudERlZj86IGFueTtcbiAgICAgIG5nRGlyZWN0aXZlRGVmPzogYW55O1xuICAgICAgbmdNb2R1bGVEZWY/OiBOZ01vZHVsZURlZjxFPjtcbiAgICAgIG5nUGlwZURlZj86IGFueTtcbiAgICB9O1xuXG4gICAgLy8gRWl0aGVyIHRoZSB0eXBlIGlzIGEgbW9kdWxlLCBhIHBpcGUsIG9yIGEgY29tcG9uZW50L2RpcmVjdGl2ZSAod2hpY2ggbWF5IG5vdCBoYXZlIGFuXG4gICAgLy8gbmdDb21wb25lbnREZWYgYXMgaXQgbWlnaHQgYmUgY29tcGlsZWQgYXN5bmNocm9ub3VzbHkpLlxuICAgIGlmIChpc05nTW9kdWxlKGV4cG9ydGVkVHlwZSkpIHtcbiAgICAgIC8vIFdoZW4gdGhpcyBtb2R1bGUgZXhwb3J0cyBhbm90aGVyLCB0aGUgZXhwb3J0ZWQgbW9kdWxlJ3MgZXhwb3J0ZWQgZGlyZWN0aXZlcyBhbmQgcGlwZXMgYXJlXG4gICAgICAvLyBhZGRlZCB0byBib3RoIHRoZSBjb21waWxhdGlvbiBhbmQgZXhwb3J0ZWQgc2NvcGVzIG9mIHRoaXMgbW9kdWxlLlxuICAgICAgY29uc3QgZXhwb3J0ZWRTY29wZSA9IHRyYW5zaXRpdmVTY29wZXNGb3IoZXhwb3J0ZWRUeXBlLCBwcm9jZXNzTmdNb2R1bGVGbik7XG4gICAgICBleHBvcnRlZFNjb3BlLmV4cG9ydGVkLmRpcmVjdGl2ZXMuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgICAgIHNjb3Blcy5jb21waWxhdGlvbi5kaXJlY3RpdmVzLmFkZChlbnRyeSk7XG4gICAgICAgIHNjb3Blcy5leHBvcnRlZC5kaXJlY3RpdmVzLmFkZChlbnRyeSk7XG4gICAgICB9KTtcbiAgICAgIGV4cG9ydGVkU2NvcGUuZXhwb3J0ZWQucGlwZXMuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgICAgIHNjb3Blcy5jb21waWxhdGlvbi5waXBlcy5hZGQoZW50cnkpO1xuICAgICAgICBzY29wZXMuZXhwb3J0ZWQucGlwZXMuYWRkKGVudHJ5KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoZ2V0UGlwZURlZihleHBvcnRlZFR5cGUpKSB7XG4gICAgICBzY29wZXMuZXhwb3J0ZWQucGlwZXMuYWRkKGV4cG9ydGVkVHlwZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNjb3Blcy5leHBvcnRlZC5kaXJlY3RpdmVzLmFkZChleHBvcnRlZFR5cGUpO1xuICAgIH1cbiAgfSk7XG5cbiAgZGVmLnRyYW5zaXRpdmVDb21waWxlU2NvcGVzID0gc2NvcGVzO1xuICByZXR1cm4gc2NvcGVzO1xufVxuXG5mdW5jdGlvbiBmbGF0dGVuPFQ+KHZhbHVlczogYW55W10sIG1hcEZuPzogKHZhbHVlOiBUKSA9PiBhbnkpOiBUeXBlPFQ+W10ge1xuICBjb25zdCBvdXQ6IFR5cGU8VD5bXSA9IFtdO1xuICB2YWx1ZXMuZm9yRWFjaCh2YWx1ZSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICBvdXQucHVzaCguLi5mbGF0dGVuPFQ+KHZhbHVlLCBtYXBGbikpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXQucHVzaChtYXBGbiA/IG1hcEZuKHZhbHVlKSA6IHZhbHVlKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBleHBhbmRNb2R1bGVXaXRoUHJvdmlkZXJzKHZhbHVlOiBUeXBlPGFueT58IE1vZHVsZVdpdGhQcm92aWRlcnM8e30+KTogVHlwZTxhbnk+IHtcbiAgaWYgKGlzTW9kdWxlV2l0aFByb3ZpZGVycyh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUubmdNb2R1bGU7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBpc01vZHVsZVdpdGhQcm92aWRlcnModmFsdWU6IGFueSk6IHZhbHVlIGlzIE1vZHVsZVdpdGhQcm92aWRlcnM8e30+IHtcbiAgcmV0dXJuICh2YWx1ZSBhc3tuZ01vZHVsZT86IGFueX0pLm5nTW9kdWxlICE9PSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGlzTmdNb2R1bGU8VD4odmFsdWU6IFR5cGU8VD4pOiB2YWx1ZSBpcyBUeXBlPFQ+JntuZ01vZHVsZURlZjogTmdNb2R1bGVEZWY8VD59IHtcbiAgcmV0dXJuICEhZ2V0TmdNb2R1bGVEZWYodmFsdWUpO1xufVxuIl19