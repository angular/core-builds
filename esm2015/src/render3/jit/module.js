/**
 * @fileoverview added by tsickle
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
import { NG_INJECTOR_DEF } from '../../di/interface/defs';
import { reflectDependencies } from '../../di/jit/util';
import { deepForEach, flatten } from '../../util/array_utils';
import { assertDefined } from '../../util/assert';
import { getComponentDef, getDirectiveDef, getNgModuleDef, getPipeDef } from '../definition';
import { NG_COMP_DEF, NG_DIRECTIVE_DEF, NG_MODULE_DEF, NG_PIPE_DEF } from '../fields';
import { maybeUnwrapFn, stringifyForError } from '../util/misc_utils';
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
 *
 * It's possible to compile a module via this API which will allow duplicate declarations in its
 * root.
 * @param {?} moduleType
 * @param {?} ngModule
 * @param {?=} allowDuplicateDeclarationsInRoot
 * @return {?}
 */
export function compileNgModuleDefs(moduleType, ngModule, allowDuplicateDeclarationsInRoot = false) {
    ngDevMode && assertDefined(moduleType, 'Required value moduleType');
    ngDevMode && assertDefined(ngModule, 'Required value ngModule');
    /** @type {?} */
    const declarations = flatten(ngModule.declarations || EMPTY_ARRAY);
    /** @type {?} */
    /** @nocollapse */ let ngModuleDef = null;
    Object.defineProperty(moduleType, NG_MODULE_DEF, {
        configurable: true,
        get: (/**
         * @return {?}
         */
        () => {
            if (ngModuleDef === null) {
                if (ngDevMode && ngModule.imports && ngModule.imports.indexOf(moduleType) > -1) {
                    // We need to assert this immediately, because allowing it to continue will cause it to
                    // go into an infinite loop before we've reached the point where we throw all the errors.
                    throw new Error(`'${stringifyForError(moduleType)}' module can't import itself`);
                }
                ngModuleDef = getCompilerFacade().compileNgModule(angularCoreEnv, `ng:///${moduleType.name}/ngModuleDef.js`, {
                    type: moduleType,
                    bootstrap: flatten(ngModule.bootstrap || EMPTY_ARRAY).map(resolveForwardRef),
                    declarations: declarations.map(resolveForwardRef),
                    imports: flatten(ngModule.imports || EMPTY_ARRAY)
                        .map(resolveForwardRef)
                        .map(expandModuleWithProviders),
                    exports: flatten(ngModule.exports || EMPTY_ARRAY)
                        .map(resolveForwardRef)
                        .map(expandModuleWithProviders),
                    emitInline: true,
                    schemas: ngModule.schemas ? flatten(ngModule.schemas) : null,
                    id: ngModule.id || null,
                });
            }
            return ngModuleDef;
        })
    });
    /** @type {?} */
    /** @nocollapse */ let ngInjectorDef = null;
    Object.defineProperty(moduleType, NG_INJECTOR_DEF, {
        get: (/**
         * @return {?}
         */
        () => {
            if (ngInjectorDef === null) {
                ngDevMode && verifySemanticsOfNgModuleDef((/** @type {?} */ ((/** @type {?} */ (moduleType)))), allowDuplicateDeclarationsInRoot);
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
                ngInjectorDef = getCompilerFacade().compileInjector(angularCoreEnv, `ng:///${moduleType.name}/ngInjectorDef.js`, meta);
            }
            return ngInjectorDef;
        }),
        // Make the property configurable in dev mode to allow overriding in tests
        configurable: !!ngDevMode,
    });
}
/**
 * @param {?} moduleType
 * @param {?} allowDuplicateDeclarationsInRoot
 * @param {?=} importingModule
 * @return {?}
 */
function verifySemanticsOfNgModuleDef(moduleType, allowDuplicateDeclarationsInRoot, importingModule) {
    if (verifiedNgModule.get(moduleType))
        return;
    verifiedNgModule.set(moduleType, true);
    moduleType = resolveForwardRef(moduleType);
    /** @type {?} */
    let ngModuleDef;
    if (importingModule) {
        ngModuleDef = (/** @type {?} */ (getNgModuleDef(moduleType)));
        if (!ngModuleDef) {
            throw new Error(`Unexpected value '${moduleType.name}' imported by the module '${importingModule.name}'. Please add an @NgModule annotation.`);
        }
    }
    else {
        ngModuleDef = getNgModuleDef(moduleType, true);
    }
    /** @type {?} */
    const errors = [];
    /** @type {?} */
    const declarations = maybeUnwrapFn(ngModuleDef.declarations);
    /** @type {?} */
    const imports = maybeUnwrapFn(ngModuleDef.imports);
    flatten(imports).map(unwrapModuleWithProvidersImports).forEach((/**
     * @param {?} mod
     * @return {?}
     */
    mod => {
        verifySemanticsOfNgModuleImport(mod, moduleType);
        verifySemanticsOfNgModuleDef(mod, false, moduleType);
    }));
    /** @type {?} */
    const exports = maybeUnwrapFn(ngModuleDef.exports);
    declarations.forEach(verifyDeclarationsHaveDefinitions);
    declarations.forEach(verifyDirectivesHaveSelector);
    /** @type {?} */
    const combinedDeclarations = [
        ...declarations.map(resolveForwardRef),
        ...flatten(imports.map(computeCombinedExports)).map(resolveForwardRef),
    ];
    exports.forEach(verifyExportsAreDeclaredOrReExported);
    declarations.forEach((/**
     * @param {?} decl
     * @return {?}
     */
    decl => verifyDeclarationIsUnique(decl, allowDuplicateDeclarationsInRoot)));
    declarations.forEach(verifyComponentEntryComponentsIsPartOfNgModule);
    /** @type {?} */
    const ngModule = getAnnotation(moduleType, 'NgModule');
    if (ngModule) {
        ngModule.imports &&
            flatten(ngModule.imports).map(unwrapModuleWithProvidersImports).forEach((/**
             * @param {?} mod
             * @return {?}
             */
            mod => {
                verifySemanticsOfNgModuleImport(mod, moduleType);
                verifySemanticsOfNgModuleDef(mod, false, moduleType);
            }));
        ngModule.bootstrap && deepForEach(ngModule.bootstrap, verifyCorrectBootstrapType);
        ngModule.bootstrap && deepForEach(ngModule.bootstrap, verifyComponentIsPartOfNgModule);
        ngModule.entryComponents &&
            deepForEach(ngModule.entryComponents, verifyComponentIsPartOfNgModule);
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
            errors.push(`Unexpected value '${stringifyForError(type)}' declared by the module '${stringifyForError(moduleType)}'. Please add a @Pipe/@Directive/@Component annotation.`);
        }
    }
    /**
     * @param {?} type
     * @return {?}
     */
    function verifyDirectivesHaveSelector(type) {
        type = resolveForwardRef(type);
        /** @type {?} */
        const def = getDirectiveDef(type);
        if (!getComponentDef(type) && def && def.selectors.length == 0) {
            errors.push(`Directive ${stringifyForError(type)} has no selector, please add it!`);
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
                errors.push(`Can't export ${kind} ${stringifyForError(type)} from ${stringifyForError(moduleType)} as it was neither declared nor imported!`);
            }
        }
    }
    /**
     * @param {?} type
     * @param {?} suppressErrors
     * @return {?}
     */
    function verifyDeclarationIsUnique(type, suppressErrors) {
        type = resolveForwardRef(type);
        /** @type {?} */
        const existingModule = ownerNgModule.get(type);
        if (existingModule && existingModule !== moduleType) {
            if (!suppressErrors) {
                /** @type {?} */
                const modules = [existingModule, moduleType].map(stringifyForError).sort();
                errors.push(`Type ${stringifyForError(type)} is part of the declarations of 2 modules: ${modules[0]} and ${modules[1]}! ` +
                    `Please consider moving ${stringifyForError(type)} to a higher module that imports ${modules[0]} and ${modules[1]}. ` +
                    `You can also create a new NgModule that exports and includes ${stringifyForError(type)} then import that NgModule in ${modules[0]} and ${modules[1]}.`);
            }
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
            errors.push(`Component ${stringifyForError(type)} is not part of any NgModule or the module has not been imported into your module.`);
        }
    }
    /**
     * @param {?} type
     * @return {?}
     */
    function verifyCorrectBootstrapType(type) {
        type = resolveForwardRef(type);
        if (!getComponentDef(type)) {
            errors.push(`${stringifyForError(type)} cannot be used as an entry component.`);
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
                deepForEach(component.entryComponents, verifyComponentIsPartOfNgModule);
            }
        }
    }
    /**
     * @param {?} type
     * @param {?} importingModule
     * @return {?}
     */
    function verifySemanticsOfNgModuleImport(type, importingModule) {
        type = resolveForwardRef(type);
        if (getComponentDef(type) || getDirectiveDef(type)) {
            throw new Error(`Unexpected directive '${type.name}' imported by the module '${importingModule.name}'. Please add an @NgModule annotation.`);
        }
        if (getPipeDef(type)) {
            throw new Error(`Unexpected pipe '${type.name}' imported by the module '${importingModule.name}'. Please add an @NgModule annotation.`);
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
 * Computes the combined declarations of explicit declarations, as well as declarations inherited by
 * traversing the exports of imported modules.
 * @param {?} type
 * @return {?}
 */
function computeCombinedExports(type) {
    type = resolveForwardRef(type);
    /** @type {?} */
    /** @nocollapse */ const ngModuleDef = getNgModuleDef(type, true);
    return [...flatten(maybeUnwrapFn(ngModuleDef.exports).map((/**
         * @param {?} type
         * @return {?}
         */
        (type) => {
            /** @type {?} */
            /** @nocollapse */ const ngModuleDef = getNgModuleDef(type);
            if (ngModuleDef) {
                verifySemanticsOfNgModuleDef((/** @type {?} */ ((/** @type {?} */ (type)))), false);
                return computeCombinedExports(type);
            }
            else {
                return type;
            }
        })))];
}
/**
 * Some declared components may be compiled asynchronously, and thus may not have their
 * ɵcmp set yet. If this is the case, then a reference to the module is written into
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
    declarations.forEach((/**
     * @param {?} declaration
     * @return {?}
     */
    declaration => {
        if (declaration.hasOwnProperty(NG_COMP_DEF)) {
            // A `ɵcmp` field exists - go ahead and patch the component directly.
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
    }));
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
    componentDef.directiveDefs = (/**
     * @return {?}
     */
    () => Array.from(transitiveScopes.compilation.directives)
        .map((/**
     * @param {?} dir
     * @return {?}
     */
    dir => dir.hasOwnProperty(NG_COMP_DEF) ? (/** @type {?} */ (getComponentDef(dir))) : (/** @type {?} */ (getDirectiveDef(dir)))))
        .filter((/**
     * @param {?} def
     * @return {?}
     */
    def => !!def)));
    componentDef.pipeDefs = (/**
     * @return {?}
     */
    () => Array.from(transitiveScopes.compilation.pipes).map((/**
     * @param {?} pipe
     * @return {?}
     */
    pipe => (/** @type {?} */ (getPipeDef(pipe))))));
    componentDef.schemas = transitiveScopes.schemas;
    // Since we avoid Components/Directives/Pipes recompiling in case there are no overrides, we
    // may face a problem where previously compiled defs available to a given Component/Directive
    // are cached in TView and may become stale (in case any of these defs gets recompiled). In
    // order to avoid this problem, we force fresh TView to be created.
    componentDef.tView = null;
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
        schemas: def.schemas || null,
        compilation: {
            directives: new Set(),
            pipes: new Set(),
        },
        exported: {
            directives: new Set(),
            pipes: new Set(),
        },
    };
    maybeUnwrapFn(def.declarations).forEach((/**
     * @param {?} declared
     * @return {?}
     */
    declared => {
        /** @type {?} */
        const declaredWithDefs = (/** @type {?} */ (declared));
        if (getPipeDef(declaredWithDefs)) {
            scopes.compilation.pipes.add(declared);
        }
        else {
            // Either declared has a ɵcmp or ngDirectiveDef, or it's a component which hasn't
            // had its template compiled yet. In either case, it gets added to the compilation's
            // directives.
            scopes.compilation.directives.add(declared);
        }
    }));
    maybeUnwrapFn(def.imports).forEach((/**
     * @template I
     * @param {?} imported
     * @return {?}
     */
    (imported) => {
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
        importedScope.exported.directives.forEach((/**
         * @param {?} entry
         * @return {?}
         */
        entry => scopes.compilation.directives.add(entry)));
        importedScope.exported.pipes.forEach((/**
         * @param {?} entry
         * @return {?}
         */
        entry => scopes.compilation.pipes.add(entry)));
    }));
    maybeUnwrapFn(def.exports).forEach((/**
     * @template E
     * @param {?} exported
     * @return {?}
     */
    (exported) => {
        /** @type {?} */
        const exportedType = (/** @type {?} */ (exported));
        // Either the type is a module, a pipe, or a component/directive (which may not have a
        // ɵcmp as it might be compiled asynchronously).
        if (isNgModule(exportedType)) {
            // When this module exports another, the exported module's exported directives and pipes are
            // added to both the compilation and exported scopes of this module.
            /** @type {?} */
            const exportedScope = transitiveScopesFor(exportedType, processNgModuleFn);
            exportedScope.exported.directives.forEach((/**
             * @param {?} entry
             * @return {?}
             */
            entry => {
                scopes.compilation.directives.add(entry);
                scopes.exported.directives.add(entry);
            }));
            exportedScope.exported.pipes.forEach((/**
             * @param {?} entry
             * @return {?}
             */
            entry => {
                scopes.compilation.pipes.add(entry);
                scopes.exported.pipes.add(entry);
            }));
        }
        else if (getPipeDef(exportedType)) {
            scopes.exported.pipes.add(exportedType);
        }
        else {
            scopes.exported.directives.add(exportedType);
        }
    }));
    def.transitiveCompileScopes = scopes;
    return scopes;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvbW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUEyQixpQkFBaUIsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQzNGLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3ZELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUN4RCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUl0RCxPQUFPLEVBQUMsV0FBVyxFQUFFLE9BQU8sRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzVELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNoRCxPQUFPLEVBQUMsZUFBZSxFQUFFLGVBQWUsRUFBRSxjQUFjLEVBQUUsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzNGLE9BQU8sRUFBQyxXQUFXLEVBQUUsZ0JBQWdCLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUdwRixPQUFPLEVBQUMsYUFBYSxFQUFFLGlCQUFpQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFcEUsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7TUFFdkMsV0FBVyxHQUFnQixFQUFFOzs7O0FBRW5DLDhCQUdDOzs7SUFGQyxxQ0FBc0I7O0lBQ3RCLG1DQUFtQjs7O01BR2YsV0FBVyxHQUFzQixFQUFFOzs7Ozs7OztBQU16QyxTQUFTLDhCQUE4QixDQUFDLFVBQXFCLEVBQUUsUUFBa0I7SUFDL0UsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUMsQ0FBQyxDQUFDO0FBQzNDLENBQUM7O0lBRUcsbUJBQW1CLEdBQUcs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YUFBTSxJQUFJLFVBQVUsQ0FBQyxZQUFZLENBQUMsRUFBRTtZQUNuQyxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDekM7YUFBTTtZQUNMLE1BQU0sQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUM5QztJQUNILENBQUMsRUFBQyxDQUFDO0lBRUgsR0FBRyxDQUFDLHVCQUF1QixHQUFHLE1BQU0sQ0FBQztJQUNyQyxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDOzs7OztBQUVELFNBQVMseUJBQXlCLENBQUMsS0FBeUM7SUFDMUUsSUFBSSxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUNoQyxPQUFPLEtBQUssQ0FBQyxRQUFRLENBQUM7S0FDdkI7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7Ozs7O0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxLQUFVO0lBQ3ZDLE9BQU8sQ0FBQyxtQkFBQSxLQUFLLEVBQW1CLENBQUMsQ0FBQyxRQUFRLEtBQUssU0FBUyxDQUFDO0FBQzNELENBQUM7Ozs7OztBQUVELFNBQVMsVUFBVSxDQUFJLEtBQWM7SUFDbkMsT0FBTyxDQUFDLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2pDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UjNJbmplY3Rvck1ldGFkYXRhRmFjYWRlLCBnZXRDb21waWxlckZhY2FkZX0gZnJvbSAnLi4vLi4vY29tcGlsZXIvY29tcGlsZXJfZmFjYWRlJztcbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4uLy4uL2RpL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7TkdfSU5KRUNUT1JfREVGfSBmcm9tICcuLi8uLi9kaS9pbnRlcmZhY2UvZGVmcyc7XG5pbXBvcnQge3JlZmxlY3REZXBlbmRlbmNpZXN9IGZyb20gJy4uLy4uL2RpL2ppdC91dGlsJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtDb21wb25lbnR9IGZyb20gJy4uLy4uL21ldGFkYXRhJztcbmltcG9ydCB7TW9kdWxlV2l0aFByb3ZpZGVycywgTmdNb2R1bGUsIE5nTW9kdWxlRGVmLCBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXN9IGZyb20gJy4uLy4uL21ldGFkYXRhL25nX21vZHVsZSc7XG5pbXBvcnQge2RlZXBGb3JFYWNoLCBmbGF0dGVufSBmcm9tICcuLi8uLi91dGlsL2FycmF5X3V0aWxzJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZH0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWYsIGdldERpcmVjdGl2ZURlZiwgZ2V0TmdNb2R1bGVEZWYsIGdldFBpcGVEZWZ9IGZyb20gJy4uL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOR19DT01QX0RFRiwgTkdfRElSRUNUSVZFX0RFRiwgTkdfTU9EVUxFX0RFRiwgTkdfUElQRV9ERUZ9IGZyb20gJy4uL2ZpZWxkcyc7XG5pbXBvcnQge0NvbXBvbmVudERlZn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7TmdNb2R1bGVUeXBlfSBmcm9tICcuLi9uZ19tb2R1bGVfcmVmJztcbmltcG9ydCB7bWF5YmVVbndyYXBGbiwgc3RyaW5naWZ5Rm9yRXJyb3J9IGZyb20gJy4uL3V0aWwvbWlzY191dGlscyc7XG5cbmltcG9ydCB7YW5ndWxhckNvcmVFbnZ9IGZyb20gJy4vZW52aXJvbm1lbnQnO1xuXG5jb25zdCBFTVBUWV9BUlJBWTogVHlwZTxhbnk+W10gPSBbXTtcblxuaW50ZXJmYWNlIE1vZHVsZVF1ZXVlSXRlbSB7XG4gIG1vZHVsZVR5cGU6IFR5cGU8YW55PjtcbiAgbmdNb2R1bGU6IE5nTW9kdWxlO1xufVxuXG5jb25zdCBtb2R1bGVRdWV1ZTogTW9kdWxlUXVldWVJdGVtW10gPSBbXTtcblxuLyoqXG4gKiBFbnF1ZXVlcyBtb2R1bGVEZWYgdG8gYmUgY2hlY2tlZCBsYXRlciB0byBzZWUgaWYgc2NvcGUgY2FuIGJlIHNldCBvbiBpdHNcbiAqIGNvbXBvbmVudCBkZWNsYXJhdGlvbnMuXG4gKi9cbmZ1bmN0aW9uIGVucXVldWVNb2R1bGVGb3JEZWxheWVkU2NvcGluZyhtb2R1bGVUeXBlOiBUeXBlPGFueT4sIG5nTW9kdWxlOiBOZ01vZHVsZSkge1xuICBtb2R1bGVRdWV1ZS5wdXNoKHttb2R1bGVUeXBlLCBuZ01vZHVsZX0pO1xufVxuXG5sZXQgZmx1c2hpbmdNb2R1bGVRdWV1ZSA9IGZhbHNlO1xuLyoqXG4gKiBMb29wcyBvdmVyIHF1ZXVlZCBtb2R1bGUgZGVmaW5pdGlvbnMsIGlmIGEgZ2l2ZW4gbW9kdWxlIGRlZmluaXRpb24gaGFzIGFsbCBvZiBpdHNcbiAqIGRlY2xhcmF0aW9ucyByZXNvbHZlZCwgaXQgZGVxdWV1ZXMgdGhhdCBtb2R1bGUgZGVmaW5pdGlvbiBhbmQgc2V0cyB0aGUgc2NvcGUgb25cbiAqIGl0cyBkZWNsYXJhdGlvbnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmbHVzaE1vZHVsZVNjb3BpbmdRdWV1ZUFzTXVjaEFzUG9zc2libGUoKSB7XG4gIGlmICghZmx1c2hpbmdNb2R1bGVRdWV1ZSkge1xuICAgIGZsdXNoaW5nTW9kdWxlUXVldWUgPSB0cnVlO1xuICAgIHRyeSB7XG4gICAgICBmb3IgKGxldCBpID0gbW9kdWxlUXVldWUubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgY29uc3Qge21vZHVsZVR5cGUsIG5nTW9kdWxlfSA9IG1vZHVsZVF1ZXVlW2ldO1xuXG4gICAgICAgIGlmIChuZ01vZHVsZS5kZWNsYXJhdGlvbnMgJiYgbmdNb2R1bGUuZGVjbGFyYXRpb25zLmV2ZXJ5KGlzUmVzb2x2ZWREZWNsYXJhdGlvbikpIHtcbiAgICAgICAgICAvLyBkZXF1ZXVlXG4gICAgICAgICAgbW9kdWxlUXVldWUuc3BsaWNlKGksIDEpO1xuICAgICAgICAgIHNldFNjb3BlT25EZWNsYXJlZENvbXBvbmVudHMobW9kdWxlVHlwZSwgbmdNb2R1bGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGZsdXNoaW5nTW9kdWxlUXVldWUgPSBmYWxzZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydXRoeSBpZiBhIGRlY2xhcmF0aW9uIGhhcyByZXNvbHZlZC4gSWYgdGhlIGRlY2xhcmF0aW9uIGhhcHBlbnMgdG8gYmVcbiAqIGFuIGFycmF5IG9mIGRlY2xhcmF0aW9ucywgaXQgd2lsbCByZWN1cnNlIHRvIGNoZWNrIGVhY2ggZGVjbGFyYXRpb24gaW4gdGhhdCBhcnJheVxuICogKHdoaWNoIG1heSBhbHNvIGJlIGFycmF5cykuXG4gKi9cbmZ1bmN0aW9uIGlzUmVzb2x2ZWREZWNsYXJhdGlvbihkZWNsYXJhdGlvbjogYW55W10gfCBUeXBlPGFueT4pOiBib29sZWFuIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkoZGVjbGFyYXRpb24pKSB7XG4gICAgcmV0dXJuIGRlY2xhcmF0aW9uLmV2ZXJ5KGlzUmVzb2x2ZWREZWNsYXJhdGlvbik7XG4gIH1cbiAgcmV0dXJuICEhcmVzb2x2ZUZvcndhcmRSZWYoZGVjbGFyYXRpb24pO1xufVxuXG4vKipcbiAqIENvbXBpbGVzIGEgbW9kdWxlIGluIEpJVCBtb2RlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gYXV0b21hdGljYWxseSBnZXRzIGNhbGxlZCB3aGVuIGEgY2xhc3MgaGFzIGEgYEBOZ01vZHVsZWAgZGVjb3JhdG9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZU5nTW9kdWxlKG1vZHVsZVR5cGU6IFR5cGU8YW55PiwgbmdNb2R1bGU6IE5nTW9kdWxlID0ge30pOiB2b2lkIHtcbiAgY29tcGlsZU5nTW9kdWxlRGVmcyhtb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZSwgbmdNb2R1bGUpO1xuXG4gIC8vIEJlY2F1c2Ugd2UgZG9uJ3Qga25vdyBpZiBhbGwgZGVjbGFyYXRpb25zIGhhdmUgcmVzb2x2ZWQgeWV0IGF0IHRoZSBtb21lbnQgdGhlXG4gIC8vIE5nTW9kdWxlIGRlY29yYXRvciBpcyBleGVjdXRpbmcsIHdlJ3JlIGVucXVldWVpbmcgdGhlIHNldHRpbmcgb2YgbW9kdWxlIHNjb3BlXG4gIC8vIG9uIGl0cyBkZWNsYXJhdGlvbnMgdG8gYmUgcnVuIGF0IGEgbGF0ZXIgdGltZSB3aGVuIGFsbCBkZWNsYXJhdGlvbnMgZm9yIHRoZSBtb2R1bGUsXG4gIC8vIGluY2x1ZGluZyBmb3J3YXJkIHJlZnMsIGhhdmUgcmVzb2x2ZWQuXG4gIGVucXVldWVNb2R1bGVGb3JEZWxheWVkU2NvcGluZyhtb2R1bGVUeXBlLCBuZ01vZHVsZSk7XG59XG5cbi8qKlxuICogQ29tcGlsZXMgYW5kIGFkZHMgdGhlIGBuZ01vZHVsZURlZmAgYW5kIGBuZ0luamVjdG9yRGVmYCBwcm9wZXJ0aWVzIHRvIHRoZSBtb2R1bGUgY2xhc3MuXG4gKlxuICogSXQncyBwb3NzaWJsZSB0byBjb21waWxlIGEgbW9kdWxlIHZpYSB0aGlzIEFQSSB3aGljaCB3aWxsIGFsbG93IGR1cGxpY2F0ZSBkZWNsYXJhdGlvbnMgaW4gaXRzXG4gKiByb290LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZU5nTW9kdWxlRGVmcyhcbiAgICBtb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGUsIG5nTW9kdWxlOiBOZ01vZHVsZSxcbiAgICBhbGxvd0R1cGxpY2F0ZURlY2xhcmF0aW9uc0luUm9vdDogYm9vbGVhbiA9IGZhbHNlKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKG1vZHVsZVR5cGUsICdSZXF1aXJlZCB2YWx1ZSBtb2R1bGVUeXBlJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKG5nTW9kdWxlLCAnUmVxdWlyZWQgdmFsdWUgbmdNb2R1bGUnKTtcbiAgY29uc3QgZGVjbGFyYXRpb25zOiBUeXBlPGFueT5bXSA9IGZsYXR0ZW4obmdNb2R1bGUuZGVjbGFyYXRpb25zIHx8IEVNUFRZX0FSUkFZKTtcbiAgbGV0IG5nTW9kdWxlRGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkobW9kdWxlVHlwZSwgTkdfTU9EVUxFX0RFRiwge1xuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChuZ01vZHVsZURlZiA9PT0gbnVsbCkge1xuICAgICAgICBpZiAobmdEZXZNb2RlICYmIG5nTW9kdWxlLmltcG9ydHMgJiYgbmdNb2R1bGUuaW1wb3J0cy5pbmRleE9mKG1vZHVsZVR5cGUpID4gLTEpIHtcbiAgICAgICAgICAvLyBXZSBuZWVkIHRvIGFzc2VydCB0aGlzIGltbWVkaWF0ZWx5LCBiZWNhdXNlIGFsbG93aW5nIGl0IHRvIGNvbnRpbnVlIHdpbGwgY2F1c2UgaXQgdG9cbiAgICAgICAgICAvLyBnbyBpbnRvIGFuIGluZmluaXRlIGxvb3AgYmVmb3JlIHdlJ3ZlIHJlYWNoZWQgdGhlIHBvaW50IHdoZXJlIHdlIHRocm93IGFsbCB0aGUgZXJyb3JzLlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJyR7c3RyaW5naWZ5Rm9yRXJyb3IobW9kdWxlVHlwZSl9JyBtb2R1bGUgY2FuJ3QgaW1wb3J0IGl0c2VsZmApO1xuICAgICAgICB9XG4gICAgICAgIG5nTW9kdWxlRGVmID0gZ2V0Q29tcGlsZXJGYWNhZGUoKS5jb21waWxlTmdNb2R1bGUoXG4gICAgICAgICAgICBhbmd1bGFyQ29yZUVudiwgYG5nOi8vLyR7bW9kdWxlVHlwZS5uYW1lfS9uZ01vZHVsZURlZi5qc2AsIHtcbiAgICAgICAgICAgICAgdHlwZTogbW9kdWxlVHlwZSxcbiAgICAgICAgICAgICAgYm9vdHN0cmFwOiBmbGF0dGVuKG5nTW9kdWxlLmJvb3RzdHJhcCB8fCBFTVBUWV9BUlJBWSkubWFwKHJlc29sdmVGb3J3YXJkUmVmKSxcbiAgICAgICAgICAgICAgZGVjbGFyYXRpb25zOiBkZWNsYXJhdGlvbnMubWFwKHJlc29sdmVGb3J3YXJkUmVmKSxcbiAgICAgICAgICAgICAgaW1wb3J0czogZmxhdHRlbihuZ01vZHVsZS5pbXBvcnRzIHx8IEVNUFRZX0FSUkFZKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChyZXNvbHZlRm9yd2FyZFJlZilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoZXhwYW5kTW9kdWxlV2l0aFByb3ZpZGVycyksXG4gICAgICAgICAgICAgIGV4cG9ydHM6IGZsYXR0ZW4obmdNb2R1bGUuZXhwb3J0cyB8fCBFTVBUWV9BUlJBWSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAocmVzb2x2ZUZvcndhcmRSZWYpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKGV4cGFuZE1vZHVsZVdpdGhQcm92aWRlcnMpLFxuICAgICAgICAgICAgICBlbWl0SW5saW5lOiB0cnVlLFxuICAgICAgICAgICAgICBzY2hlbWFzOiBuZ01vZHVsZS5zY2hlbWFzID8gZmxhdHRlbihuZ01vZHVsZS5zY2hlbWFzKSA6IG51bGwsXG4gICAgICAgICAgICAgIGlkOiBuZ01vZHVsZS5pZCB8fCBudWxsLFxuICAgICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmdNb2R1bGVEZWY7XG4gICAgfVxuICB9KTtcblxuICBsZXQgbmdJbmplY3RvckRlZjogYW55ID0gbnVsbDtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG1vZHVsZVR5cGUsIE5HX0lOSkVDVE9SX0RFRiwge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKG5nSW5qZWN0b3JEZWYgPT09IG51bGwpIHtcbiAgICAgICAgbmdEZXZNb2RlICYmIHZlcmlmeVNlbWFudGljc09mTmdNb2R1bGVEZWYoXG4gICAgICAgICAgICAgICAgICAgICAgICAgbW9kdWxlVHlwZSBhcyBhbnkgYXMgTmdNb2R1bGVUeXBlLCBhbGxvd0R1cGxpY2F0ZURlY2xhcmF0aW9uc0luUm9vdCk7XG4gICAgICAgIGNvbnN0IG1ldGE6IFIzSW5qZWN0b3JNZXRhZGF0YUZhY2FkZSA9IHtcbiAgICAgICAgICBuYW1lOiBtb2R1bGVUeXBlLm5hbWUsXG4gICAgICAgICAgdHlwZTogbW9kdWxlVHlwZSxcbiAgICAgICAgICBkZXBzOiByZWZsZWN0RGVwZW5kZW5jaWVzKG1vZHVsZVR5cGUpLFxuICAgICAgICAgIHByb3ZpZGVyczogbmdNb2R1bGUucHJvdmlkZXJzIHx8IEVNUFRZX0FSUkFZLFxuICAgICAgICAgIGltcG9ydHM6IFtcbiAgICAgICAgICAgIChuZ01vZHVsZS5pbXBvcnRzIHx8IEVNUFRZX0FSUkFZKS5tYXAocmVzb2x2ZUZvcndhcmRSZWYpLFxuICAgICAgICAgICAgKG5nTW9kdWxlLmV4cG9ydHMgfHwgRU1QVFlfQVJSQVkpLm1hcChyZXNvbHZlRm9yd2FyZFJlZiksXG4gICAgICAgICAgXSxcbiAgICAgICAgfTtcbiAgICAgICAgbmdJbmplY3RvckRlZiA9IGdldENvbXBpbGVyRmFjYWRlKCkuY29tcGlsZUluamVjdG9yKFxuICAgICAgICAgICAgYW5ndWxhckNvcmVFbnYsIGBuZzovLy8ke21vZHVsZVR5cGUubmFtZX0vbmdJbmplY3RvckRlZi5qc2AsIG1ldGEpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5nSW5qZWN0b3JEZWY7XG4gICAgfSxcbiAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGUsXG4gIH0pO1xufVxuXG5mdW5jdGlvbiB2ZXJpZnlTZW1hbnRpY3NPZk5nTW9kdWxlRGVmKFxuICAgIG1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZSwgYWxsb3dEdXBsaWNhdGVEZWNsYXJhdGlvbnNJblJvb3Q6IGJvb2xlYW4sXG4gICAgaW1wb3J0aW5nTW9kdWxlPzogTmdNb2R1bGVUeXBlKTogdm9pZCB7XG4gIGlmICh2ZXJpZmllZE5nTW9kdWxlLmdldChtb2R1bGVUeXBlKSkgcmV0dXJuO1xuICB2ZXJpZmllZE5nTW9kdWxlLnNldChtb2R1bGVUeXBlLCB0cnVlKTtcbiAgbW9kdWxlVHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKG1vZHVsZVR5cGUpO1xuICBsZXQgbmdNb2R1bGVEZWY6IE5nTW9kdWxlRGVmPGFueT47XG4gIGlmIChpbXBvcnRpbmdNb2R1bGUpIHtcbiAgICBuZ01vZHVsZURlZiA9IGdldE5nTW9kdWxlRGVmKG1vZHVsZVR5cGUpICE7XG4gICAgaWYgKCFuZ01vZHVsZURlZikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBVbmV4cGVjdGVkIHZhbHVlICcke21vZHVsZVR5cGUubmFtZX0nIGltcG9ydGVkIGJ5IHRoZSBtb2R1bGUgJyR7aW1wb3J0aW5nTW9kdWxlLm5hbWV9Jy4gUGxlYXNlIGFkZCBhbiBATmdNb2R1bGUgYW5ub3RhdGlvbi5gKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgbmdNb2R1bGVEZWYgPSBnZXROZ01vZHVsZURlZihtb2R1bGVUeXBlLCB0cnVlKTtcbiAgfVxuICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGRlY2xhcmF0aW9ucyA9IG1heWJlVW53cmFwRm4obmdNb2R1bGVEZWYuZGVjbGFyYXRpb25zKTtcbiAgY29uc3QgaW1wb3J0cyA9IG1heWJlVW53cmFwRm4obmdNb2R1bGVEZWYuaW1wb3J0cyk7XG4gIGZsYXR0ZW4oaW1wb3J0cykubWFwKHVud3JhcE1vZHVsZVdpdGhQcm92aWRlcnNJbXBvcnRzKS5mb3JFYWNoKG1vZCA9PiB7XG4gICAgdmVyaWZ5U2VtYW50aWNzT2ZOZ01vZHVsZUltcG9ydChtb2QsIG1vZHVsZVR5cGUpO1xuICAgIHZlcmlmeVNlbWFudGljc09mTmdNb2R1bGVEZWYobW9kLCBmYWxzZSwgbW9kdWxlVHlwZSk7XG4gIH0pO1xuICBjb25zdCBleHBvcnRzID0gbWF5YmVVbndyYXBGbihuZ01vZHVsZURlZi5leHBvcnRzKTtcbiAgZGVjbGFyYXRpb25zLmZvckVhY2godmVyaWZ5RGVjbGFyYXRpb25zSGF2ZURlZmluaXRpb25zKTtcbiAgZGVjbGFyYXRpb25zLmZvckVhY2godmVyaWZ5RGlyZWN0aXZlc0hhdmVTZWxlY3Rvcik7XG4gIGNvbnN0IGNvbWJpbmVkRGVjbGFyYXRpb25zOiBUeXBlPGFueT5bXSA9IFtcbiAgICAuLi5kZWNsYXJhdGlvbnMubWFwKHJlc29sdmVGb3J3YXJkUmVmKSxcbiAgICAuLi5mbGF0dGVuKGltcG9ydHMubWFwKGNvbXB1dGVDb21iaW5lZEV4cG9ydHMpKS5tYXAocmVzb2x2ZUZvcndhcmRSZWYpLFxuICBdO1xuICBleHBvcnRzLmZvckVhY2godmVyaWZ5RXhwb3J0c0FyZURlY2xhcmVkT3JSZUV4cG9ydGVkKTtcbiAgZGVjbGFyYXRpb25zLmZvckVhY2goZGVjbCA9PiB2ZXJpZnlEZWNsYXJhdGlvbklzVW5pcXVlKGRlY2wsIGFsbG93RHVwbGljYXRlRGVjbGFyYXRpb25zSW5Sb290KSk7XG4gIGRlY2xhcmF0aW9ucy5mb3JFYWNoKHZlcmlmeUNvbXBvbmVudEVudHJ5Q29tcG9uZW50c0lzUGFydE9mTmdNb2R1bGUpO1xuXG4gIGNvbnN0IG5nTW9kdWxlID0gZ2V0QW5ub3RhdGlvbjxOZ01vZHVsZT4obW9kdWxlVHlwZSwgJ05nTW9kdWxlJyk7XG4gIGlmIChuZ01vZHVsZSkge1xuICAgIG5nTW9kdWxlLmltcG9ydHMgJiZcbiAgICAgICAgZmxhdHRlbihuZ01vZHVsZS5pbXBvcnRzKS5tYXAodW53cmFwTW9kdWxlV2l0aFByb3ZpZGVyc0ltcG9ydHMpLmZvckVhY2gobW9kID0+IHtcbiAgICAgICAgICB2ZXJpZnlTZW1hbnRpY3NPZk5nTW9kdWxlSW1wb3J0KG1vZCwgbW9kdWxlVHlwZSk7XG4gICAgICAgICAgdmVyaWZ5U2VtYW50aWNzT2ZOZ01vZHVsZURlZihtb2QsIGZhbHNlLCBtb2R1bGVUeXBlKTtcbiAgICAgICAgfSk7XG4gICAgbmdNb2R1bGUuYm9vdHN0cmFwICYmIGRlZXBGb3JFYWNoKG5nTW9kdWxlLmJvb3RzdHJhcCwgdmVyaWZ5Q29ycmVjdEJvb3RzdHJhcFR5cGUpO1xuICAgIG5nTW9kdWxlLmJvb3RzdHJhcCAmJiBkZWVwRm9yRWFjaChuZ01vZHVsZS5ib290c3RyYXAsIHZlcmlmeUNvbXBvbmVudElzUGFydE9mTmdNb2R1bGUpO1xuICAgIG5nTW9kdWxlLmVudHJ5Q29tcG9uZW50cyAmJlxuICAgICAgICBkZWVwRm9yRWFjaChuZ01vZHVsZS5lbnRyeUNvbXBvbmVudHMsIHZlcmlmeUNvbXBvbmVudElzUGFydE9mTmdNb2R1bGUpO1xuICB9XG5cbiAgLy8gVGhyb3cgRXJyb3IgaWYgYW55IGVycm9ycyB3ZXJlIGRldGVjdGVkLlxuICBpZiAoZXJyb3JzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBFcnJvcihlcnJvcnMuam9pbignXFxuJykpO1xuICB9XG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICBmdW5jdGlvbiB2ZXJpZnlEZWNsYXJhdGlvbnNIYXZlRGVmaW5pdGlvbnModHlwZTogVHlwZTxhbnk+KTogdm9pZCB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICAgIGNvbnN0IGRlZiA9IGdldENvbXBvbmVudERlZih0eXBlKSB8fCBnZXREaXJlY3RpdmVEZWYodHlwZSkgfHwgZ2V0UGlwZURlZih0eXBlKTtcbiAgICBpZiAoIWRlZikge1xuICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgICAgYFVuZXhwZWN0ZWQgdmFsdWUgJyR7c3RyaW5naWZ5Rm9yRXJyb3IodHlwZSl9JyBkZWNsYXJlZCBieSB0aGUgbW9kdWxlICcke3N0cmluZ2lmeUZvckVycm9yKG1vZHVsZVR5cGUpfScuIFBsZWFzZSBhZGQgYSBAUGlwZS9ARGlyZWN0aXZlL0BDb21wb25lbnQgYW5ub3RhdGlvbi5gKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB2ZXJpZnlEaXJlY3RpdmVzSGF2ZVNlbGVjdG9yKHR5cGU6IFR5cGU8YW55Pik6IHZvaWQge1xuICAgIHR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlKTtcbiAgICBjb25zdCBkZWYgPSBnZXREaXJlY3RpdmVEZWYodHlwZSk7XG4gICAgaWYgKCFnZXRDb21wb25lbnREZWYodHlwZSkgJiYgZGVmICYmIGRlZi5zZWxlY3RvcnMubGVuZ3RoID09IDApIHtcbiAgICAgIGVycm9ycy5wdXNoKGBEaXJlY3RpdmUgJHtzdHJpbmdpZnlGb3JFcnJvcih0eXBlKX0gaGFzIG5vIHNlbGVjdG9yLCBwbGVhc2UgYWRkIGl0IWApO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHZlcmlmeUV4cG9ydHNBcmVEZWNsYXJlZE9yUmVFeHBvcnRlZCh0eXBlOiBUeXBlPGFueT4pIHtcbiAgICB0eXBlID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZSk7XG4gICAgY29uc3Qga2luZCA9IGdldENvbXBvbmVudERlZih0eXBlKSAmJiAnY29tcG9uZW50JyB8fCBnZXREaXJlY3RpdmVEZWYodHlwZSkgJiYgJ2RpcmVjdGl2ZScgfHxcbiAgICAgICAgZ2V0UGlwZURlZih0eXBlKSAmJiAncGlwZSc7XG4gICAgaWYgKGtpbmQpIHtcbiAgICAgIC8vIG9ubHkgY2hlY2tlZCBpZiB3ZSBhcmUgZGVjbGFyZWQgYXMgQ29tcG9uZW50LCBEaXJlY3RpdmUsIG9yIFBpcGVcbiAgICAgIC8vIE1vZHVsZXMgZG9uJ3QgbmVlZCB0byBiZSBkZWNsYXJlZCBvciBpbXBvcnRlZC5cbiAgICAgIGlmIChjb21iaW5lZERlY2xhcmF0aW9ucy5sYXN0SW5kZXhPZih0eXBlKSA9PT0gLTEpIHtcbiAgICAgICAgLy8gV2UgYXJlIGV4cG9ydGluZyBzb21ldGhpbmcgd2hpY2ggd2UgZG9uJ3QgZXhwbGljaXRseSBkZWNsYXJlIG9yIGltcG9ydC5cbiAgICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgICAgICBgQ2FuJ3QgZXhwb3J0ICR7a2luZH0gJHtzdHJpbmdpZnlGb3JFcnJvcih0eXBlKX0gZnJvbSAke3N0cmluZ2lmeUZvckVycm9yKG1vZHVsZVR5cGUpfSBhcyBpdCB3YXMgbmVpdGhlciBkZWNsYXJlZCBub3IgaW1wb3J0ZWQhYCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdmVyaWZ5RGVjbGFyYXRpb25Jc1VuaXF1ZSh0eXBlOiBUeXBlPGFueT4sIHN1cHByZXNzRXJyb3JzOiBib29sZWFuKSB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICAgIGNvbnN0IGV4aXN0aW5nTW9kdWxlID0gb3duZXJOZ01vZHVsZS5nZXQodHlwZSk7XG4gICAgaWYgKGV4aXN0aW5nTW9kdWxlICYmIGV4aXN0aW5nTW9kdWxlICE9PSBtb2R1bGVUeXBlKSB7XG4gICAgICBpZiAoIXN1cHByZXNzRXJyb3JzKSB7XG4gICAgICAgIGNvbnN0IG1vZHVsZXMgPSBbZXhpc3RpbmdNb2R1bGUsIG1vZHVsZVR5cGVdLm1hcChzdHJpbmdpZnlGb3JFcnJvcikuc29ydCgpO1xuICAgICAgICBlcnJvcnMucHVzaChcbiAgICAgICAgICAgIGBUeXBlICR7c3RyaW5naWZ5Rm9yRXJyb3IodHlwZSl9IGlzIHBhcnQgb2YgdGhlIGRlY2xhcmF0aW9ucyBvZiAyIG1vZHVsZXM6ICR7bW9kdWxlc1swXX0gYW5kICR7bW9kdWxlc1sxXX0hIGAgK1xuICAgICAgICAgICAgYFBsZWFzZSBjb25zaWRlciBtb3ZpbmcgJHtzdHJpbmdpZnlGb3JFcnJvcih0eXBlKX0gdG8gYSBoaWdoZXIgbW9kdWxlIHRoYXQgaW1wb3J0cyAke21vZHVsZXNbMF19IGFuZCAke21vZHVsZXNbMV19LiBgICtcbiAgICAgICAgICAgIGBZb3UgY2FuIGFsc28gY3JlYXRlIGEgbmV3IE5nTW9kdWxlIHRoYXQgZXhwb3J0cyBhbmQgaW5jbHVkZXMgJHtzdHJpbmdpZnlGb3JFcnJvcih0eXBlKX0gdGhlbiBpbXBvcnQgdGhhdCBOZ01vZHVsZSBpbiAke21vZHVsZXNbMF19IGFuZCAke21vZHVsZXNbMV19LmApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBNYXJrIHR5cGUgYXMgaGF2aW5nIG93bmVyLlxuICAgICAgb3duZXJOZ01vZHVsZS5zZXQodHlwZSwgbW9kdWxlVHlwZSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdmVyaWZ5Q29tcG9uZW50SXNQYXJ0T2ZOZ01vZHVsZSh0eXBlOiBUeXBlPGFueT4pIHtcbiAgICB0eXBlID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZSk7XG4gICAgY29uc3QgZXhpc3RpbmdNb2R1bGUgPSBvd25lck5nTW9kdWxlLmdldCh0eXBlKTtcbiAgICBpZiAoIWV4aXN0aW5nTW9kdWxlKSB7XG4gICAgICBlcnJvcnMucHVzaChcbiAgICAgICAgICBgQ29tcG9uZW50ICR7c3RyaW5naWZ5Rm9yRXJyb3IodHlwZSl9IGlzIG5vdCBwYXJ0IG9mIGFueSBOZ01vZHVsZSBvciB0aGUgbW9kdWxlIGhhcyBub3QgYmVlbiBpbXBvcnRlZCBpbnRvIHlvdXIgbW9kdWxlLmApO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHZlcmlmeUNvcnJlY3RCb290c3RyYXBUeXBlKHR5cGU6IFR5cGU8YW55Pikge1xuICAgIHR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlKTtcbiAgICBpZiAoIWdldENvbXBvbmVudERlZih0eXBlKSkge1xuICAgICAgZXJyb3JzLnB1c2goYCR7c3RyaW5naWZ5Rm9yRXJyb3IodHlwZSl9IGNhbm5vdCBiZSB1c2VkIGFzIGFuIGVudHJ5IGNvbXBvbmVudC5gKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB2ZXJpZnlDb21wb25lbnRFbnRyeUNvbXBvbmVudHNJc1BhcnRPZk5nTW9kdWxlKHR5cGU6IFR5cGU8YW55Pikge1xuICAgIHR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlKTtcbiAgICBpZiAoZ2V0Q29tcG9uZW50RGVmKHR5cGUpKSB7XG4gICAgICAvLyBXZSBrbm93IHdlIGFyZSBjb21wb25lbnRcbiAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGdldEFubm90YXRpb248Q29tcG9uZW50Pih0eXBlLCAnQ29tcG9uZW50Jyk7XG4gICAgICBpZiAoY29tcG9uZW50ICYmIGNvbXBvbmVudC5lbnRyeUNvbXBvbmVudHMpIHtcbiAgICAgICAgZGVlcEZvckVhY2goY29tcG9uZW50LmVudHJ5Q29tcG9uZW50cywgdmVyaWZ5Q29tcG9uZW50SXNQYXJ0T2ZOZ01vZHVsZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdmVyaWZ5U2VtYW50aWNzT2ZOZ01vZHVsZUltcG9ydCh0eXBlOiBUeXBlPGFueT4sIGltcG9ydGluZ01vZHVsZTogVHlwZTxhbnk+KSB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuXG4gICAgaWYgKGdldENvbXBvbmVudERlZih0eXBlKSB8fCBnZXREaXJlY3RpdmVEZWYodHlwZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgVW5leHBlY3RlZCBkaXJlY3RpdmUgJyR7dHlwZS5uYW1lfScgaW1wb3J0ZWQgYnkgdGhlIG1vZHVsZSAnJHtpbXBvcnRpbmdNb2R1bGUubmFtZX0nLiBQbGVhc2UgYWRkIGFuIEBOZ01vZHVsZSBhbm5vdGF0aW9uLmApO1xuICAgIH1cblxuICAgIGlmIChnZXRQaXBlRGVmKHR5cGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYFVuZXhwZWN0ZWQgcGlwZSAnJHt0eXBlLm5hbWV9JyBpbXBvcnRlZCBieSB0aGUgbW9kdWxlICcke2ltcG9ydGluZ01vZHVsZS5uYW1lfScuIFBsZWFzZSBhZGQgYW4gQE5nTW9kdWxlIGFubm90YXRpb24uYCk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHVud3JhcE1vZHVsZVdpdGhQcm92aWRlcnNJbXBvcnRzKFxuICAgIHR5cGVPcldpdGhQcm92aWRlcnM6IE5nTW9kdWxlVHlwZTxhbnk+fCB7bmdNb2R1bGU6IE5nTW9kdWxlVHlwZTxhbnk+fSk6IE5nTW9kdWxlVHlwZTxhbnk+IHtcbiAgdHlwZU9yV2l0aFByb3ZpZGVycyA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGVPcldpdGhQcm92aWRlcnMpO1xuICByZXR1cm4gKHR5cGVPcldpdGhQcm92aWRlcnMgYXMgYW55KS5uZ01vZHVsZSB8fCB0eXBlT3JXaXRoUHJvdmlkZXJzO1xufVxuXG5mdW5jdGlvbiBnZXRBbm5vdGF0aW9uPFQ+KHR5cGU6IGFueSwgbmFtZTogc3RyaW5nKTogVHxudWxsIHtcbiAgbGV0IGFubm90YXRpb246IFR8bnVsbCA9IG51bGw7XG4gIGNvbGxlY3QodHlwZS5fX2Fubm90YXRpb25zX18pO1xuICBjb2xsZWN0KHR5cGUuZGVjb3JhdG9ycyk7XG4gIHJldHVybiBhbm5vdGF0aW9uO1xuXG4gIGZ1bmN0aW9uIGNvbGxlY3QoYW5ub3RhdGlvbnM6IGFueVtdIHwgbnVsbCkge1xuICAgIGlmIChhbm5vdGF0aW9ucykge1xuICAgICAgYW5ub3RhdGlvbnMuZm9yRWFjaChyZWFkQW5ub3RhdGlvbik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZEFubm90YXRpb24oXG4gICAgICBkZWNvcmF0b3I6IHt0eXBlOiB7cHJvdG90eXBlOiB7bmdNZXRhZGF0YU5hbWU6IHN0cmluZ30sIGFyZ3M6IGFueVtdfSwgYXJnczogYW55fSk6IHZvaWQge1xuICAgIGlmICghYW5ub3RhdGlvbikge1xuICAgICAgY29uc3QgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoZGVjb3JhdG9yKTtcbiAgICAgIGlmIChwcm90by5uZ01ldGFkYXRhTmFtZSA9PSBuYW1lKSB7XG4gICAgICAgIGFubm90YXRpb24gPSBkZWNvcmF0b3IgYXMgYW55O1xuICAgICAgfSBlbHNlIGlmIChkZWNvcmF0b3IudHlwZSkge1xuICAgICAgICBjb25zdCBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihkZWNvcmF0b3IudHlwZSk7XG4gICAgICAgIGlmIChwcm90by5uZ01ldGFkYXRhTmFtZSA9PSBuYW1lKSB7XG4gICAgICAgICAgYW5ub3RhdGlvbiA9IGRlY29yYXRvci5hcmdzWzBdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogS2VlcCB0cmFjayBvZiBjb21waWxlZCBjb21wb25lbnRzLiBUaGlzIGlzIG5lZWRlZCBiZWNhdXNlIGluIHRlc3RzIHdlIG9mdGVuIHdhbnQgdG8gY29tcGlsZSB0aGVcbiAqIHNhbWUgY29tcG9uZW50IHdpdGggbW9yZSB0aGFuIG9uZSBOZ01vZHVsZS4gVGhpcyB3b3VsZCBjYXVzZSBhbiBlcnJvciB1bmxlc3Mgd2UgcmVzZXQgd2hpY2hcbiAqIE5nTW9kdWxlIHRoZSBjb21wb25lbnQgYmVsb25ncyB0by4gV2Uga2VlcCB0aGUgbGlzdCBvZiBjb21waWxlZCBjb21wb25lbnRzIGhlcmUgc28gdGhhdCB0aGVcbiAqIFRlc3RCZWQgY2FuIHJlc2V0IGl0IGxhdGVyLlxuICovXG5sZXQgb3duZXJOZ01vZHVsZSA9IG5ldyBNYXA8VHlwZTxhbnk+LCBOZ01vZHVsZVR5cGU8YW55Pj4oKTtcbmxldCB2ZXJpZmllZE5nTW9kdWxlID0gbmV3IE1hcDxOZ01vZHVsZVR5cGU8YW55PiwgYm9vbGVhbj4oKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0Q29tcGlsZWRDb21wb25lbnRzKCk6IHZvaWQge1xuICBvd25lck5nTW9kdWxlID0gbmV3IE1hcDxUeXBlPGFueT4sIE5nTW9kdWxlVHlwZTxhbnk+PigpO1xuICB2ZXJpZmllZE5nTW9kdWxlID0gbmV3IE1hcDxOZ01vZHVsZVR5cGU8YW55PiwgYm9vbGVhbj4oKTtcbiAgbW9kdWxlUXVldWUubGVuZ3RoID0gMDtcbn1cblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgY29tYmluZWQgZGVjbGFyYXRpb25zIG9mIGV4cGxpY2l0IGRlY2xhcmF0aW9ucywgYXMgd2VsbCBhcyBkZWNsYXJhdGlvbnMgaW5oZXJpdGVkIGJ5XG4gKiB0cmF2ZXJzaW5nIHRoZSBleHBvcnRzIG9mIGltcG9ydGVkIG1vZHVsZXMuXG4gKiBAcGFyYW0gdHlwZVxuICovXG5mdW5jdGlvbiBjb21wdXRlQ29tYmluZWRFeHBvcnRzKHR5cGU6IFR5cGU8YW55Pik6IFR5cGU8YW55PltdIHtcbiAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICBjb25zdCBuZ01vZHVsZURlZiA9IGdldE5nTW9kdWxlRGVmKHR5cGUsIHRydWUpO1xuICByZXR1cm4gWy4uLmZsYXR0ZW4obWF5YmVVbndyYXBGbihuZ01vZHVsZURlZi5leHBvcnRzKS5tYXAoKHR5cGUpID0+IHtcbiAgICBjb25zdCBuZ01vZHVsZURlZiA9IGdldE5nTW9kdWxlRGVmKHR5cGUpO1xuICAgIGlmIChuZ01vZHVsZURlZikge1xuICAgICAgdmVyaWZ5U2VtYW50aWNzT2ZOZ01vZHVsZURlZih0eXBlIGFzIGFueSBhcyBOZ01vZHVsZVR5cGUsIGZhbHNlKTtcbiAgICAgIHJldHVybiBjb21wdXRlQ29tYmluZWRFeHBvcnRzKHR5cGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdHlwZTtcbiAgICB9XG4gIH0pKV07XG59XG5cbi8qKlxuICogU29tZSBkZWNsYXJlZCBjb21wb25lbnRzIG1heSBiZSBjb21waWxlZCBhc3luY2hyb25vdXNseSwgYW5kIHRodXMgbWF5IG5vdCBoYXZlIHRoZWlyXG4gKiDJtWNtcCBzZXQgeWV0LiBJZiB0aGlzIGlzIHRoZSBjYXNlLCB0aGVuIGEgcmVmZXJlbmNlIHRvIHRoZSBtb2R1bGUgaXMgd3JpdHRlbiBpbnRvXG4gKiB0aGUgYG5nU2VsZWN0b3JTY29wZWAgcHJvcGVydHkgb2YgdGhlIGRlY2xhcmVkIHR5cGUuXG4gKi9cbmZ1bmN0aW9uIHNldFNjb3BlT25EZWNsYXJlZENvbXBvbmVudHMobW9kdWxlVHlwZTogVHlwZTxhbnk+LCBuZ01vZHVsZTogTmdNb2R1bGUpIHtcbiAgY29uc3QgZGVjbGFyYXRpb25zOiBUeXBlPGFueT5bXSA9IGZsYXR0ZW4obmdNb2R1bGUuZGVjbGFyYXRpb25zIHx8IEVNUFRZX0FSUkFZKTtcblxuICBjb25zdCB0cmFuc2l0aXZlU2NvcGVzID0gdHJhbnNpdGl2ZVNjb3Blc0Zvcihtb2R1bGVUeXBlKTtcblxuICBkZWNsYXJhdGlvbnMuZm9yRWFjaChkZWNsYXJhdGlvbiA9PiB7XG4gICAgaWYgKGRlY2xhcmF0aW9uLmhhc093blByb3BlcnR5KE5HX0NPTVBfREVGKSkge1xuICAgICAgLy8gQSBgybVjbXBgIGZpZWxkIGV4aXN0cyAtIGdvIGFoZWFkIGFuZCBwYXRjaCB0aGUgY29tcG9uZW50IGRpcmVjdGx5LlxuICAgICAgY29uc3QgY29tcG9uZW50ID0gZGVjbGFyYXRpb24gYXMgVHlwZTxhbnk+JiB7ybVjbXA6IENvbXBvbmVudERlZjxhbnk+fTtcbiAgICAgIGNvbnN0IGNvbXBvbmVudERlZiA9IGdldENvbXBvbmVudERlZihjb21wb25lbnQpICE7XG4gICAgICBwYXRjaENvbXBvbmVudERlZldpdGhTY29wZShjb21wb25lbnREZWYsIHRyYW5zaXRpdmVTY29wZXMpO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICFkZWNsYXJhdGlvbi5oYXNPd25Qcm9wZXJ0eShOR19ESVJFQ1RJVkVfREVGKSAmJiAhZGVjbGFyYXRpb24uaGFzT3duUHJvcGVydHkoTkdfUElQRV9ERUYpKSB7XG4gICAgICAvLyBTZXQgYG5nU2VsZWN0b3JTY29wZWAgZm9yIGZ1dHVyZSByZWZlcmVuY2Ugd2hlbiB0aGUgY29tcG9uZW50IGNvbXBpbGF0aW9uIGZpbmlzaGVzLlxuICAgICAgKGRlY2xhcmF0aW9uIGFzIFR5cGU8YW55PiYge25nU2VsZWN0b3JTY29wZT86IGFueX0pLm5nU2VsZWN0b3JTY29wZSA9IG1vZHVsZVR5cGU7XG4gICAgfVxuICB9KTtcbn1cblxuLyoqXG4gKiBQYXRjaCB0aGUgZGVmaW5pdGlvbiBvZiBhIGNvbXBvbmVudCB3aXRoIGRpcmVjdGl2ZXMgYW5kIHBpcGVzIGZyb20gdGhlIGNvbXBpbGF0aW9uIHNjb3BlIG9mXG4gKiBhIGdpdmVuIG1vZHVsZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlPEM+KFxuICAgIGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPEM+LCB0cmFuc2l0aXZlU2NvcGVzOiBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMpIHtcbiAgY29tcG9uZW50RGVmLmRpcmVjdGl2ZURlZnMgPSAoKSA9PlxuICAgICAgQXJyYXkuZnJvbSh0cmFuc2l0aXZlU2NvcGVzLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMpXG4gICAgICAgICAgLm1hcChcbiAgICAgICAgICAgICAgZGlyID0+XG4gICAgICAgICAgICAgICAgICBkaXIuaGFzT3duUHJvcGVydHkoTkdfQ09NUF9ERUYpID8gZ2V0Q29tcG9uZW50RGVmKGRpcikgISA6IGdldERpcmVjdGl2ZURlZihkaXIpICEpXG4gICAgICAgICAgLmZpbHRlcihkZWYgPT4gISFkZWYpO1xuICBjb21wb25lbnREZWYucGlwZURlZnMgPSAoKSA9PlxuICAgICAgQXJyYXkuZnJvbSh0cmFuc2l0aXZlU2NvcGVzLmNvbXBpbGF0aW9uLnBpcGVzKS5tYXAocGlwZSA9PiBnZXRQaXBlRGVmKHBpcGUpICEpO1xuICBjb21wb25lbnREZWYuc2NoZW1hcyA9IHRyYW5zaXRpdmVTY29wZXMuc2NoZW1hcztcblxuICAvLyBTaW5jZSB3ZSBhdm9pZCBDb21wb25lbnRzL0RpcmVjdGl2ZXMvUGlwZXMgcmVjb21waWxpbmcgaW4gY2FzZSB0aGVyZSBhcmUgbm8gb3ZlcnJpZGVzLCB3ZVxuICAvLyBtYXkgZmFjZSBhIHByb2JsZW0gd2hlcmUgcHJldmlvdXNseSBjb21waWxlZCBkZWZzIGF2YWlsYWJsZSB0byBhIGdpdmVuIENvbXBvbmVudC9EaXJlY3RpdmVcbiAgLy8gYXJlIGNhY2hlZCBpbiBUVmlldyBhbmQgbWF5IGJlY29tZSBzdGFsZSAoaW4gY2FzZSBhbnkgb2YgdGhlc2UgZGVmcyBnZXRzIHJlY29tcGlsZWQpLiBJblxuICAvLyBvcmRlciB0byBhdm9pZCB0aGlzIHByb2JsZW0sIHdlIGZvcmNlIGZyZXNoIFRWaWV3IHRvIGJlIGNyZWF0ZWQuXG4gIGNvbXBvbmVudERlZi50VmlldyA9IG51bGw7XG59XG5cbi8qKlxuICogQ29tcHV0ZSB0aGUgcGFpciBvZiB0cmFuc2l0aXZlIHNjb3BlcyAoY29tcGlsYXRpb24gc2NvcGUgYW5kIGV4cG9ydGVkIHNjb3BlKSBmb3IgYSBnaXZlbiBtb2R1bGUuXG4gKlxuICogVGhpcyBvcGVyYXRpb24gaXMgbWVtb2l6ZWQgYW5kIHRoZSByZXN1bHQgaXMgY2FjaGVkIG9uIHRoZSBtb2R1bGUncyBkZWZpbml0aW9uLiBJdCBjYW4gYmUgY2FsbGVkXG4gKiBvbiBtb2R1bGVzIHdpdGggY29tcG9uZW50cyB0aGF0IGhhdmUgbm90IGZ1bGx5IGNvbXBpbGVkIHlldCwgYnV0IHRoZSByZXN1bHQgc2hvdWxkIG5vdCBiZSB1c2VkXG4gKiB1bnRpbCB0aGV5IGhhdmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2l0aXZlU2NvcGVzRm9yPFQ+KFxuICAgIG1vZHVsZVR5cGU6IFR5cGU8VD4sXG4gICAgcHJvY2Vzc05nTW9kdWxlRm4/OiAobmdNb2R1bGU6IE5nTW9kdWxlVHlwZSkgPT4gdm9pZCk6IE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3BlcyB7XG4gIGlmICghaXNOZ01vZHVsZShtb2R1bGVUeXBlKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHttb2R1bGVUeXBlLm5hbWV9IGRvZXMgbm90IGhhdmUgYW4gbmdNb2R1bGVEZWZgKTtcbiAgfVxuICBjb25zdCBkZWYgPSBnZXROZ01vZHVsZURlZihtb2R1bGVUeXBlKSAhO1xuXG4gIGlmIChkZWYudHJhbnNpdGl2ZUNvbXBpbGVTY29wZXMgIT09IG51bGwpIHtcbiAgICByZXR1cm4gZGVmLnRyYW5zaXRpdmVDb21waWxlU2NvcGVzO1xuICB9XG5cbiAgY29uc3Qgc2NvcGVzOiBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMgPSB7XG4gICAgc2NoZW1hczogZGVmLnNjaGVtYXMgfHwgbnVsbCxcbiAgICBjb21waWxhdGlvbjoge1xuICAgICAgZGlyZWN0aXZlczogbmV3IFNldDxhbnk+KCksXG4gICAgICBwaXBlczogbmV3IFNldDxhbnk+KCksXG4gICAgfSxcbiAgICBleHBvcnRlZDoge1xuICAgICAgZGlyZWN0aXZlczogbmV3IFNldDxhbnk+KCksXG4gICAgICBwaXBlczogbmV3IFNldDxhbnk+KCksXG4gICAgfSxcbiAgfTtcblxuICBtYXliZVVud3JhcEZuKGRlZi5kZWNsYXJhdGlvbnMpLmZvckVhY2goZGVjbGFyZWQgPT4ge1xuICAgIGNvbnN0IGRlY2xhcmVkV2l0aERlZnMgPSBkZWNsYXJlZCBhcyBUeXBlPGFueT4mIHsgbmdQaXBlRGVmPzogYW55OyB9O1xuXG4gICAgaWYgKGdldFBpcGVEZWYoZGVjbGFyZWRXaXRoRGVmcykpIHtcbiAgICAgIHNjb3Blcy5jb21waWxhdGlvbi5waXBlcy5hZGQoZGVjbGFyZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBFaXRoZXIgZGVjbGFyZWQgaGFzIGEgybVjbXAgb3IgbmdEaXJlY3RpdmVEZWYsIG9yIGl0J3MgYSBjb21wb25lbnQgd2hpY2ggaGFzbid0XG4gICAgICAvLyBoYWQgaXRzIHRlbXBsYXRlIGNvbXBpbGVkIHlldC4gSW4gZWl0aGVyIGNhc2UsIGl0IGdldHMgYWRkZWQgdG8gdGhlIGNvbXBpbGF0aW9uJ3NcbiAgICAgIC8vIGRpcmVjdGl2ZXMuXG4gICAgICBzY29wZXMuY29tcGlsYXRpb24uZGlyZWN0aXZlcy5hZGQoZGVjbGFyZWQpO1xuICAgIH1cbiAgfSk7XG5cbiAgbWF5YmVVbndyYXBGbihkZWYuaW1wb3J0cykuZm9yRWFjaCg8ST4oaW1wb3J0ZWQ6IFR5cGU8ST4pID0+IHtcbiAgICBjb25zdCBpbXBvcnRlZFR5cGUgPSBpbXBvcnRlZCBhcyBUeXBlPEk+JiB7XG4gICAgICAvLyBJZiBpbXBvcnRlZCBpcyBhbiBATmdNb2R1bGU6XG4gICAgICBuZ01vZHVsZURlZj86IE5nTW9kdWxlRGVmPEk+O1xuICAgIH07XG5cbiAgICBpZiAoIWlzTmdNb2R1bGU8ST4oaW1wb3J0ZWRUeXBlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbXBvcnRpbmcgJHtpbXBvcnRlZFR5cGUubmFtZX0gd2hpY2ggZG9lcyBub3QgaGF2ZSBhbiBuZ01vZHVsZURlZmApO1xuICAgIH1cblxuICAgIGlmIChwcm9jZXNzTmdNb2R1bGVGbikge1xuICAgICAgcHJvY2Vzc05nTW9kdWxlRm4oaW1wb3J0ZWRUeXBlIGFzIE5nTW9kdWxlVHlwZSk7XG4gICAgfVxuXG4gICAgLy8gV2hlbiB0aGlzIG1vZHVsZSBpbXBvcnRzIGFub3RoZXIsIHRoZSBpbXBvcnRlZCBtb2R1bGUncyBleHBvcnRlZCBkaXJlY3RpdmVzIGFuZCBwaXBlcyBhcmVcbiAgICAvLyBhZGRlZCB0byB0aGUgY29tcGlsYXRpb24gc2NvcGUgb2YgdGhpcyBtb2R1bGUuXG4gICAgY29uc3QgaW1wb3J0ZWRTY29wZSA9IHRyYW5zaXRpdmVTY29wZXNGb3IoaW1wb3J0ZWRUeXBlLCBwcm9jZXNzTmdNb2R1bGVGbik7XG4gICAgaW1wb3J0ZWRTY29wZS5leHBvcnRlZC5kaXJlY3RpdmVzLmZvckVhY2goZW50cnkgPT4gc2NvcGVzLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMuYWRkKGVudHJ5KSk7XG4gICAgaW1wb3J0ZWRTY29wZS5leHBvcnRlZC5waXBlcy5mb3JFYWNoKGVudHJ5ID0+IHNjb3Blcy5jb21waWxhdGlvbi5waXBlcy5hZGQoZW50cnkpKTtcbiAgfSk7XG5cbiAgbWF5YmVVbndyYXBGbihkZWYuZXhwb3J0cykuZm9yRWFjaCg8RT4oZXhwb3J0ZWQ6IFR5cGU8RT4pID0+IHtcbiAgICBjb25zdCBleHBvcnRlZFR5cGUgPSBleHBvcnRlZCBhcyBUeXBlPEU+JiB7XG4gICAgICAvLyBDb21wb25lbnRzLCBEaXJlY3RpdmVzLCBOZ01vZHVsZXMsIGFuZCBQaXBlcyBjYW4gYWxsIGJlIGV4cG9ydGVkLlxuICAgICAgybVjbXA/OiBhbnk7XG4gICAgICBuZ0RpcmVjdGl2ZURlZj86IGFueTtcbiAgICAgIG5nTW9kdWxlRGVmPzogTmdNb2R1bGVEZWY8RT47XG4gICAgICBuZ1BpcGVEZWY/OiBhbnk7XG4gICAgfTtcblxuICAgIC8vIEVpdGhlciB0aGUgdHlwZSBpcyBhIG1vZHVsZSwgYSBwaXBlLCBvciBhIGNvbXBvbmVudC9kaXJlY3RpdmUgKHdoaWNoIG1heSBub3QgaGF2ZSBhXG4gICAgLy8gybVjbXAgYXMgaXQgbWlnaHQgYmUgY29tcGlsZWQgYXN5bmNocm9ub3VzbHkpLlxuICAgIGlmIChpc05nTW9kdWxlKGV4cG9ydGVkVHlwZSkpIHtcbiAgICAgIC8vIFdoZW4gdGhpcyBtb2R1bGUgZXhwb3J0cyBhbm90aGVyLCB0aGUgZXhwb3J0ZWQgbW9kdWxlJ3MgZXhwb3J0ZWQgZGlyZWN0aXZlcyBhbmQgcGlwZXMgYXJlXG4gICAgICAvLyBhZGRlZCB0byBib3RoIHRoZSBjb21waWxhdGlvbiBhbmQgZXhwb3J0ZWQgc2NvcGVzIG9mIHRoaXMgbW9kdWxlLlxuICAgICAgY29uc3QgZXhwb3J0ZWRTY29wZSA9IHRyYW5zaXRpdmVTY29wZXNGb3IoZXhwb3J0ZWRUeXBlLCBwcm9jZXNzTmdNb2R1bGVGbik7XG4gICAgICBleHBvcnRlZFNjb3BlLmV4cG9ydGVkLmRpcmVjdGl2ZXMuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgICAgIHNjb3Blcy5jb21waWxhdGlvbi5kaXJlY3RpdmVzLmFkZChlbnRyeSk7XG4gICAgICAgIHNjb3Blcy5leHBvcnRlZC5kaXJlY3RpdmVzLmFkZChlbnRyeSk7XG4gICAgICB9KTtcbiAgICAgIGV4cG9ydGVkU2NvcGUuZXhwb3J0ZWQucGlwZXMuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgICAgIHNjb3Blcy5jb21waWxhdGlvbi5waXBlcy5hZGQoZW50cnkpO1xuICAgICAgICBzY29wZXMuZXhwb3J0ZWQucGlwZXMuYWRkKGVudHJ5KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoZ2V0UGlwZURlZihleHBvcnRlZFR5cGUpKSB7XG4gICAgICBzY29wZXMuZXhwb3J0ZWQucGlwZXMuYWRkKGV4cG9ydGVkVHlwZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNjb3Blcy5leHBvcnRlZC5kaXJlY3RpdmVzLmFkZChleHBvcnRlZFR5cGUpO1xuICAgIH1cbiAgfSk7XG5cbiAgZGVmLnRyYW5zaXRpdmVDb21waWxlU2NvcGVzID0gc2NvcGVzO1xuICByZXR1cm4gc2NvcGVzO1xufVxuXG5mdW5jdGlvbiBleHBhbmRNb2R1bGVXaXRoUHJvdmlkZXJzKHZhbHVlOiBUeXBlPGFueT58IE1vZHVsZVdpdGhQcm92aWRlcnM8e30+KTogVHlwZTxhbnk+IHtcbiAgaWYgKGlzTW9kdWxlV2l0aFByb3ZpZGVycyh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUubmdNb2R1bGU7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBpc01vZHVsZVdpdGhQcm92aWRlcnModmFsdWU6IGFueSk6IHZhbHVlIGlzIE1vZHVsZVdpdGhQcm92aWRlcnM8e30+IHtcbiAgcmV0dXJuICh2YWx1ZSBhc3tuZ01vZHVsZT86IGFueX0pLm5nTW9kdWxlICE9PSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGlzTmdNb2R1bGU8VD4odmFsdWU6IFR5cGU8VD4pOiB2YWx1ZSBpcyBUeXBlPFQ+JntuZ01vZHVsZURlZjogTmdNb2R1bGVEZWY8VD59IHtcbiAgcmV0dXJuICEhZ2V0TmdNb2R1bGVEZWYodmFsdWUpO1xufVxuIl19