/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/jit/module.ts
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
import { NG_INJ_DEF } from '../../di/interface/defs';
import { reflectDependencies } from '../../di/jit/util';
import { deepForEach, flatten } from '../../util/array_utils';
import { assertDefined } from '../../util/assert';
import { getComponentDef, getDirectiveDef, getNgModuleDef, getPipeDef } from '../definition';
import { NG_COMP_DEF, NG_DIR_DEF, NG_MOD_DEF, NG_PIPE_DEF } from '../fields';
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
 * Compiles and adds the `ɵmod` and `ɵinj` properties to the module class.
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
    let ngModuleDef = null;
    Object.defineProperty(moduleType, NG_MOD_DEF, {
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
                ngModuleDef = getCompilerFacade().compileNgModule(angularCoreEnv, `ng:///${moduleType.name}/ɵmod.js`, {
                    type: moduleType,
                    bootstrap: flatten(ngModule.bootstrap || EMPTY_ARRAY).map(resolveForwardRef),
                    declarations: declarations.map(resolveForwardRef),
                    imports: flatten(ngModule.imports || EMPTY_ARRAY)
                        .map(resolveForwardRef)
                        .map(expandModuleWithProviders),
                    exports: flatten(ngModule.exports || EMPTY_ARRAY)
                        .map(resolveForwardRef)
                        .map(expandModuleWithProviders),
                    schemas: ngModule.schemas ? flatten(ngModule.schemas) : null,
                    id: ngModule.id || null,
                });
            }
            return ngModuleDef;
        })
    });
    /** @type {?} */
    let ngInjectorDef = null;
    Object.defineProperty(moduleType, NG_INJ_DEF, {
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
                ngInjectorDef = getCompilerFacade().compileInjector(angularCoreEnv, `ng:///${moduleType.name}/ɵinj.js`, meta);
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
    const ngModuleDef = getNgModuleDef(type, true);
    return [...flatten(maybeUnwrapFn(ngModuleDef.exports).map((/**
         * @param {?} type
         * @return {?}
         */
        (type) => {
            /** @type {?} */
            const ngModuleDef = getNgModuleDef(type);
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
        else if (!declaration.hasOwnProperty(NG_DIR_DEF) && !declaration.hasOwnProperty(NG_PIPE_DEF)) {
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
 * By default this operation is memoized and the result is cached on the module's definition. You
 * can avoid memoization and previously stored results (if available) by providing the second
 * argument with the `true` value (forcing transitive scopes recalculation).
 *
 * This function can be called on modules with components that have not fully compiled yet, but the
 * result should not be used until they have.
 *
 * @template T
 * @param {?} moduleType module that transitive scope should be calculated for.
 * @param {?=} forceRecalc flag that indicates whether previously calculated and memoized values should
 * be ignored and transitive scope to be fully recalculated.
 * @return {?}
 */
export function transitiveScopesFor(moduleType, forceRecalc = false) {
    if (!isNgModule(moduleType)) {
        throw new Error(`${moduleType.name} does not have a module def (ɵmod property)`);
    }
    /** @type {?} */
    const def = (/** @type {?} */ (getNgModuleDef(moduleType)));
    if (!forceRecalc && def.transitiveCompileScopes !== null) {
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
            // Either declared has a ɵcmp or ɵdir, or it's a component which hasn't
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
            throw new Error(`Importing ${importedType.name} which does not have a ɵmod property`);
        }
        // When this module imports another, the imported module's exported directives and pipes are
        // added to the compilation scope of this module.
        /** @type {?} */
        const importedScope = transitiveScopesFor(importedType, forceRecalc);
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
            const exportedScope = transitiveScopesFor(exportedType, forceRecalc);
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
    if (!forceRecalc) {
        def.transitiveCompileScopes = scopes;
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvbW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBMkIsaUJBQWlCLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUMzRixPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUN2RCxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDbkQsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFJdEQsT0FBTyxFQUFDLFdBQVcsRUFBRSxPQUFPLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUM1RCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLGVBQWUsRUFBRSxlQUFlLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMzRixPQUFPLEVBQUMsV0FBVyxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBRzNFLE9BQU8sRUFBQyxhQUFhLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUVwRSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDOztNQUV2QyxXQUFXLEdBQWdCLEVBQUU7Ozs7QUFFbkMsOEJBR0M7OztJQUZDLHFDQUFzQjs7SUFDdEIsbUNBQW1COzs7TUFHZixXQUFXLEdBQXNCLEVBQUU7Ozs7Ozs7O0FBTXpDLFNBQVMsOEJBQThCLENBQUMsVUFBcUIsRUFBRSxRQUFrQjtJQUMvRSxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUMsVUFBVSxFQUFFLFFBQVEsRUFBQyxDQUFDLENBQUM7QUFDM0MsQ0FBQzs7SUFFRyxtQkFBbUIsR0FBRyxL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QUFZLENBQUMsQ0FBQztTQUN6QzthQUFNO1lBQ0wsTUFBTSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQzlDO0lBQ0gsQ0FBQyxFQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsV0FBVyxFQUFFO1FBQ2hCLEdBQUcsQ0FBQyx1QkFBdUIsR0FBRyxNQUFNLENBQUM7S0FDdEM7SUFDRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDOzs7OztBQUVELFNBQVMseUJBQXlCLENBQUMsS0FBeUM7SUFDMUUsSUFBSSxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUNoQyxPQUFPLEtBQUssQ0FBQyxRQUFRLENBQUM7S0FDdkI7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7Ozs7O0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxLQUFVO0lBQ3ZDLE9BQU8sQ0FBQyxtQkFBQSxLQUFLLEVBQW1CLENBQUMsQ0FBQyxRQUFRLEtBQUssU0FBUyxDQUFDO0FBQzNELENBQUM7Ozs7OztBQUVELFNBQVMsVUFBVSxDQUFJLEtBQWM7SUFDbkMsT0FBTyxDQUFDLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2pDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UjNJbmplY3Rvck1ldGFkYXRhRmFjYWRlLCBnZXRDb21waWxlckZhY2FkZX0gZnJvbSAnLi4vLi4vY29tcGlsZXIvY29tcGlsZXJfZmFjYWRlJztcbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4uLy4uL2RpL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7TkdfSU5KX0RFRn0gZnJvbSAnLi4vLi4vZGkvaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtyZWZsZWN0RGVwZW5kZW5jaWVzfSBmcm9tICcuLi8uLi9kaS9qaXQvdXRpbCc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Q29tcG9uZW50fSBmcm9tICcuLi8uLi9tZXRhZGF0YSc7XG5pbXBvcnQge01vZHVsZVdpdGhQcm92aWRlcnMsIE5nTW9kdWxlLCBOZ01vZHVsZURlZiwgTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9uZ19tb2R1bGUnO1xuaW1wb3J0IHtkZWVwRm9yRWFjaCwgZmxhdHRlbn0gZnJvbSAnLi4vLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmLCBnZXREaXJlY3RpdmVEZWYsIGdldE5nTW9kdWxlRGVmLCBnZXRQaXBlRGVmfSBmcm9tICcuLi9kZWZpbml0aW9uJztcbmltcG9ydCB7TkdfQ09NUF9ERUYsIE5HX0RJUl9ERUYsIE5HX01PRF9ERUYsIE5HX1BJUEVfREVGfSBmcm9tICcuLi9maWVsZHMnO1xuaW1wb3J0IHtDb21wb25lbnREZWZ9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge05nTW9kdWxlVHlwZX0gZnJvbSAnLi4vbmdfbW9kdWxlX3JlZic7XG5pbXBvcnQge21heWJlVW53cmFwRm4sIHN0cmluZ2lmeUZvckVycm9yfSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuXG5pbXBvcnQge2FuZ3VsYXJDb3JlRW52fSBmcm9tICcuL2Vudmlyb25tZW50JztcblxuY29uc3QgRU1QVFlfQVJSQVk6IFR5cGU8YW55PltdID0gW107XG5cbmludGVyZmFjZSBNb2R1bGVRdWV1ZUl0ZW0ge1xuICBtb2R1bGVUeXBlOiBUeXBlPGFueT47XG4gIG5nTW9kdWxlOiBOZ01vZHVsZTtcbn1cblxuY29uc3QgbW9kdWxlUXVldWU6IE1vZHVsZVF1ZXVlSXRlbVtdID0gW107XG5cbi8qKlxuICogRW5xdWV1ZXMgbW9kdWxlRGVmIHRvIGJlIGNoZWNrZWQgbGF0ZXIgdG8gc2VlIGlmIHNjb3BlIGNhbiBiZSBzZXQgb24gaXRzXG4gKiBjb21wb25lbnQgZGVjbGFyYXRpb25zLlxuICovXG5mdW5jdGlvbiBlbnF1ZXVlTW9kdWxlRm9yRGVsYXllZFNjb3BpbmcobW9kdWxlVHlwZTogVHlwZTxhbnk+LCBuZ01vZHVsZTogTmdNb2R1bGUpIHtcbiAgbW9kdWxlUXVldWUucHVzaCh7bW9kdWxlVHlwZSwgbmdNb2R1bGV9KTtcbn1cblxubGV0IGZsdXNoaW5nTW9kdWxlUXVldWUgPSBmYWxzZTtcbi8qKlxuICogTG9vcHMgb3ZlciBxdWV1ZWQgbW9kdWxlIGRlZmluaXRpb25zLCBpZiBhIGdpdmVuIG1vZHVsZSBkZWZpbml0aW9uIGhhcyBhbGwgb2YgaXRzXG4gKiBkZWNsYXJhdGlvbnMgcmVzb2x2ZWQsIGl0IGRlcXVldWVzIHRoYXQgbW9kdWxlIGRlZmluaXRpb24gYW5kIHNldHMgdGhlIHNjb3BlIG9uXG4gKiBpdHMgZGVjbGFyYXRpb25zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmx1c2hNb2R1bGVTY29waW5nUXVldWVBc011Y2hBc1Bvc3NpYmxlKCkge1xuICBpZiAoIWZsdXNoaW5nTW9kdWxlUXVldWUpIHtcbiAgICBmbHVzaGluZ01vZHVsZVF1ZXVlID0gdHJ1ZTtcbiAgICB0cnkge1xuICAgICAgZm9yIChsZXQgaSA9IG1vZHVsZVF1ZXVlLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIGNvbnN0IHttb2R1bGVUeXBlLCBuZ01vZHVsZX0gPSBtb2R1bGVRdWV1ZVtpXTtcblxuICAgICAgICBpZiAobmdNb2R1bGUuZGVjbGFyYXRpb25zICYmIG5nTW9kdWxlLmRlY2xhcmF0aW9ucy5ldmVyeShpc1Jlc29sdmVkRGVjbGFyYXRpb24pKSB7XG4gICAgICAgICAgLy8gZGVxdWV1ZVxuICAgICAgICAgIG1vZHVsZVF1ZXVlLnNwbGljZShpLCAxKTtcbiAgICAgICAgICBzZXRTY29wZU9uRGVjbGFyZWRDb21wb25lbnRzKG1vZHVsZVR5cGUsIG5nTW9kdWxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICBmbHVzaGluZ01vZHVsZVF1ZXVlID0gZmFsc2U7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0cnV0aHkgaWYgYSBkZWNsYXJhdGlvbiBoYXMgcmVzb2x2ZWQuIElmIHRoZSBkZWNsYXJhdGlvbiBoYXBwZW5zIHRvIGJlXG4gKiBhbiBhcnJheSBvZiBkZWNsYXJhdGlvbnMsIGl0IHdpbGwgcmVjdXJzZSB0byBjaGVjayBlYWNoIGRlY2xhcmF0aW9uIGluIHRoYXQgYXJyYXlcbiAqICh3aGljaCBtYXkgYWxzbyBiZSBhcnJheXMpLlxuICovXG5mdW5jdGlvbiBpc1Jlc29sdmVkRGVjbGFyYXRpb24oZGVjbGFyYXRpb246IGFueVtdIHwgVHlwZTxhbnk+KTogYm9vbGVhbiB7XG4gIGlmIChBcnJheS5pc0FycmF5KGRlY2xhcmF0aW9uKSkge1xuICAgIHJldHVybiBkZWNsYXJhdGlvbi5ldmVyeShpc1Jlc29sdmVkRGVjbGFyYXRpb24pO1xuICB9XG4gIHJldHVybiAhIXJlc29sdmVGb3J3YXJkUmVmKGRlY2xhcmF0aW9uKTtcbn1cblxuLyoqXG4gKiBDb21waWxlcyBhIG1vZHVsZSBpbiBKSVQgbW9kZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGF1dG9tYXRpY2FsbHkgZ2V0cyBjYWxsZWQgd2hlbiBhIGNsYXNzIGhhcyBhIGBATmdNb2R1bGVgIGRlY29yYXRvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVOZ01vZHVsZShtb2R1bGVUeXBlOiBUeXBlPGFueT4sIG5nTW9kdWxlOiBOZ01vZHVsZSA9IHt9KTogdm9pZCB7XG4gIGNvbXBpbGVOZ01vZHVsZURlZnMobW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGUsIG5nTW9kdWxlKTtcblxuICAvLyBCZWNhdXNlIHdlIGRvbid0IGtub3cgaWYgYWxsIGRlY2xhcmF0aW9ucyBoYXZlIHJlc29sdmVkIHlldCBhdCB0aGUgbW9tZW50IHRoZVxuICAvLyBOZ01vZHVsZSBkZWNvcmF0b3IgaXMgZXhlY3V0aW5nLCB3ZSdyZSBlbnF1ZXVlaW5nIHRoZSBzZXR0aW5nIG9mIG1vZHVsZSBzY29wZVxuICAvLyBvbiBpdHMgZGVjbGFyYXRpb25zIHRvIGJlIHJ1biBhdCBhIGxhdGVyIHRpbWUgd2hlbiBhbGwgZGVjbGFyYXRpb25zIGZvciB0aGUgbW9kdWxlLFxuICAvLyBpbmNsdWRpbmcgZm9yd2FyZCByZWZzLCBoYXZlIHJlc29sdmVkLlxuICBlbnF1ZXVlTW9kdWxlRm9yRGVsYXllZFNjb3BpbmcobW9kdWxlVHlwZSwgbmdNb2R1bGUpO1xufVxuXG4vKipcbiAqIENvbXBpbGVzIGFuZCBhZGRzIHRoZSBgybVtb2RgIGFuZCBgybVpbmpgIHByb3BlcnRpZXMgdG8gdGhlIG1vZHVsZSBjbGFzcy5cbiAqXG4gKiBJdCdzIHBvc3NpYmxlIHRvIGNvbXBpbGUgYSBtb2R1bGUgdmlhIHRoaXMgQVBJIHdoaWNoIHdpbGwgYWxsb3cgZHVwbGljYXRlIGRlY2xhcmF0aW9ucyBpbiBpdHNcbiAqIHJvb3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlTmdNb2R1bGVEZWZzKFxuICAgIG1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZSwgbmdNb2R1bGU6IE5nTW9kdWxlLFxuICAgIGFsbG93RHVwbGljYXRlRGVjbGFyYXRpb25zSW5Sb290OiBib29sZWFuID0gZmFsc2UpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobW9kdWxlVHlwZSwgJ1JlcXVpcmVkIHZhbHVlIG1vZHVsZVR5cGUnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobmdNb2R1bGUsICdSZXF1aXJlZCB2YWx1ZSBuZ01vZHVsZScpO1xuICBjb25zdCBkZWNsYXJhdGlvbnM6IFR5cGU8YW55PltdID0gZmxhdHRlbihuZ01vZHVsZS5kZWNsYXJhdGlvbnMgfHwgRU1QVFlfQVJSQVkpO1xuICBsZXQgbmdNb2R1bGVEZWY6IGFueSA9IG51bGw7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShtb2R1bGVUeXBlLCBOR19NT0RfREVGLCB7XG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKG5nTW9kdWxlRGVmID09PSBudWxsKSB7XG4gICAgICAgIGlmIChuZ0Rldk1vZGUgJiYgbmdNb2R1bGUuaW1wb3J0cyAmJiBuZ01vZHVsZS5pbXBvcnRzLmluZGV4T2YobW9kdWxlVHlwZSkgPiAtMSkge1xuICAgICAgICAgIC8vIFdlIG5lZWQgdG8gYXNzZXJ0IHRoaXMgaW1tZWRpYXRlbHksIGJlY2F1c2UgYWxsb3dpbmcgaXQgdG8gY29udGludWUgd2lsbCBjYXVzZSBpdCB0b1xuICAgICAgICAgIC8vIGdvIGludG8gYW4gaW5maW5pdGUgbG9vcCBiZWZvcmUgd2UndmUgcmVhY2hlZCB0aGUgcG9pbnQgd2hlcmUgd2UgdGhyb3cgYWxsIHRoZSBlcnJvcnMuXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAnJHtzdHJpbmdpZnlGb3JFcnJvcihtb2R1bGVUeXBlKX0nIG1vZHVsZSBjYW4ndCBpbXBvcnQgaXRzZWxmYCk7XG4gICAgICAgIH1cbiAgICAgICAgbmdNb2R1bGVEZWYgPSBnZXRDb21waWxlckZhY2FkZSgpLmNvbXBpbGVOZ01vZHVsZShcbiAgICAgICAgICAgIGFuZ3VsYXJDb3JlRW52LCBgbmc6Ly8vJHttb2R1bGVUeXBlLm5hbWV9L8m1bW9kLmpzYCwge1xuICAgICAgICAgICAgICB0eXBlOiBtb2R1bGVUeXBlLFxuICAgICAgICAgICAgICBib290c3RyYXA6IGZsYXR0ZW4obmdNb2R1bGUuYm9vdHN0cmFwIHx8IEVNUFRZX0FSUkFZKS5tYXAocmVzb2x2ZUZvcndhcmRSZWYpLFxuICAgICAgICAgICAgICBkZWNsYXJhdGlvbnM6IGRlY2xhcmF0aW9ucy5tYXAocmVzb2x2ZUZvcndhcmRSZWYpLFxuICAgICAgICAgICAgICBpbXBvcnRzOiBmbGF0dGVuKG5nTW9kdWxlLmltcG9ydHMgfHwgRU1QVFlfQVJSQVkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKHJlc29sdmVGb3J3YXJkUmVmKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChleHBhbmRNb2R1bGVXaXRoUHJvdmlkZXJzKSxcbiAgICAgICAgICAgICAgZXhwb3J0czogZmxhdHRlbihuZ01vZHVsZS5leHBvcnRzIHx8IEVNUFRZX0FSUkFZKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChyZXNvbHZlRm9yd2FyZFJlZilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoZXhwYW5kTW9kdWxlV2l0aFByb3ZpZGVycyksXG4gICAgICAgICAgICAgIHNjaGVtYXM6IG5nTW9kdWxlLnNjaGVtYXMgPyBmbGF0dGVuKG5nTW9kdWxlLnNjaGVtYXMpIDogbnVsbCxcbiAgICAgICAgICAgICAgaWQ6IG5nTW9kdWxlLmlkIHx8IG51bGwsXG4gICAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZ01vZHVsZURlZjtcbiAgICB9XG4gIH0pO1xuXG4gIGxldCBuZ0luamVjdG9yRGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkobW9kdWxlVHlwZSwgTkdfSU5KX0RFRiwge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKG5nSW5qZWN0b3JEZWYgPT09IG51bGwpIHtcbiAgICAgICAgbmdEZXZNb2RlICYmIHZlcmlmeVNlbWFudGljc09mTmdNb2R1bGVEZWYoXG4gICAgICAgICAgICAgICAgICAgICAgICAgbW9kdWxlVHlwZSBhcyBhbnkgYXMgTmdNb2R1bGVUeXBlLCBhbGxvd0R1cGxpY2F0ZURlY2xhcmF0aW9uc0luUm9vdCk7XG4gICAgICAgIGNvbnN0IG1ldGE6IFIzSW5qZWN0b3JNZXRhZGF0YUZhY2FkZSA9IHtcbiAgICAgICAgICBuYW1lOiBtb2R1bGVUeXBlLm5hbWUsXG4gICAgICAgICAgdHlwZTogbW9kdWxlVHlwZSxcbiAgICAgICAgICBkZXBzOiByZWZsZWN0RGVwZW5kZW5jaWVzKG1vZHVsZVR5cGUpLFxuICAgICAgICAgIHByb3ZpZGVyczogbmdNb2R1bGUucHJvdmlkZXJzIHx8IEVNUFRZX0FSUkFZLFxuICAgICAgICAgIGltcG9ydHM6IFtcbiAgICAgICAgICAgIChuZ01vZHVsZS5pbXBvcnRzIHx8IEVNUFRZX0FSUkFZKS5tYXAocmVzb2x2ZUZvcndhcmRSZWYpLFxuICAgICAgICAgICAgKG5nTW9kdWxlLmV4cG9ydHMgfHwgRU1QVFlfQVJSQVkpLm1hcChyZXNvbHZlRm9yd2FyZFJlZiksXG4gICAgICAgICAgXSxcbiAgICAgICAgfTtcbiAgICAgICAgbmdJbmplY3RvckRlZiA9IGdldENvbXBpbGVyRmFjYWRlKCkuY29tcGlsZUluamVjdG9yKFxuICAgICAgICAgICAgYW5ndWxhckNvcmVFbnYsIGBuZzovLy8ke21vZHVsZVR5cGUubmFtZX0vybVpbmouanNgLCBtZXRhKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZ0luamVjdG9yRGVmO1xuICAgIH0sXG4gICAgLy8gTWFrZSB0aGUgcHJvcGVydHkgY29uZmlndXJhYmxlIGluIGRldiBtb2RlIHRvIGFsbG93IG92ZXJyaWRpbmcgaW4gdGVzdHNcbiAgICBjb25maWd1cmFibGU6ICEhbmdEZXZNb2RlLFxuICB9KTtcbn1cblxuZnVuY3Rpb24gdmVyaWZ5U2VtYW50aWNzT2ZOZ01vZHVsZURlZihcbiAgICBtb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGUsIGFsbG93RHVwbGljYXRlRGVjbGFyYXRpb25zSW5Sb290OiBib29sZWFuLFxuICAgIGltcG9ydGluZ01vZHVsZT86IE5nTW9kdWxlVHlwZSk6IHZvaWQge1xuICBpZiAodmVyaWZpZWROZ01vZHVsZS5nZXQobW9kdWxlVHlwZSkpIHJldHVybjtcbiAgdmVyaWZpZWROZ01vZHVsZS5zZXQobW9kdWxlVHlwZSwgdHJ1ZSk7XG4gIG1vZHVsZVR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZihtb2R1bGVUeXBlKTtcbiAgbGV0IG5nTW9kdWxlRGVmOiBOZ01vZHVsZURlZjxhbnk+O1xuICBpZiAoaW1wb3J0aW5nTW9kdWxlKSB7XG4gICAgbmdNb2R1bGVEZWYgPSBnZXROZ01vZHVsZURlZihtb2R1bGVUeXBlKSAhO1xuICAgIGlmICghbmdNb2R1bGVEZWYpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgVW5leHBlY3RlZCB2YWx1ZSAnJHttb2R1bGVUeXBlLm5hbWV9JyBpbXBvcnRlZCBieSB0aGUgbW9kdWxlICcke2ltcG9ydGluZ01vZHVsZS5uYW1lfScuIFBsZWFzZSBhZGQgYW4gQE5nTW9kdWxlIGFubm90YXRpb24uYCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIG5nTW9kdWxlRGVmID0gZ2V0TmdNb2R1bGVEZWYobW9kdWxlVHlwZSwgdHJ1ZSk7XG4gIH1cbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBkZWNsYXJhdGlvbnMgPSBtYXliZVVud3JhcEZuKG5nTW9kdWxlRGVmLmRlY2xhcmF0aW9ucyk7XG4gIGNvbnN0IGltcG9ydHMgPSBtYXliZVVud3JhcEZuKG5nTW9kdWxlRGVmLmltcG9ydHMpO1xuICBmbGF0dGVuKGltcG9ydHMpLm1hcCh1bndyYXBNb2R1bGVXaXRoUHJvdmlkZXJzSW1wb3J0cykuZm9yRWFjaChtb2QgPT4ge1xuICAgIHZlcmlmeVNlbWFudGljc09mTmdNb2R1bGVJbXBvcnQobW9kLCBtb2R1bGVUeXBlKTtcbiAgICB2ZXJpZnlTZW1hbnRpY3NPZk5nTW9kdWxlRGVmKG1vZCwgZmFsc2UsIG1vZHVsZVR5cGUpO1xuICB9KTtcbiAgY29uc3QgZXhwb3J0cyA9IG1heWJlVW53cmFwRm4obmdNb2R1bGVEZWYuZXhwb3J0cyk7XG4gIGRlY2xhcmF0aW9ucy5mb3JFYWNoKHZlcmlmeURlY2xhcmF0aW9uc0hhdmVEZWZpbml0aW9ucyk7XG4gIGRlY2xhcmF0aW9ucy5mb3JFYWNoKHZlcmlmeURpcmVjdGl2ZXNIYXZlU2VsZWN0b3IpO1xuICBjb25zdCBjb21iaW5lZERlY2xhcmF0aW9uczogVHlwZTxhbnk+W10gPSBbXG4gICAgLi4uZGVjbGFyYXRpb25zLm1hcChyZXNvbHZlRm9yd2FyZFJlZiksXG4gICAgLi4uZmxhdHRlbihpbXBvcnRzLm1hcChjb21wdXRlQ29tYmluZWRFeHBvcnRzKSkubWFwKHJlc29sdmVGb3J3YXJkUmVmKSxcbiAgXTtcbiAgZXhwb3J0cy5mb3JFYWNoKHZlcmlmeUV4cG9ydHNBcmVEZWNsYXJlZE9yUmVFeHBvcnRlZCk7XG4gIGRlY2xhcmF0aW9ucy5mb3JFYWNoKGRlY2wgPT4gdmVyaWZ5RGVjbGFyYXRpb25Jc1VuaXF1ZShkZWNsLCBhbGxvd0R1cGxpY2F0ZURlY2xhcmF0aW9uc0luUm9vdCkpO1xuICBkZWNsYXJhdGlvbnMuZm9yRWFjaCh2ZXJpZnlDb21wb25lbnRFbnRyeUNvbXBvbmVudHNJc1BhcnRPZk5nTW9kdWxlKTtcblxuICBjb25zdCBuZ01vZHVsZSA9IGdldEFubm90YXRpb248TmdNb2R1bGU+KG1vZHVsZVR5cGUsICdOZ01vZHVsZScpO1xuICBpZiAobmdNb2R1bGUpIHtcbiAgICBuZ01vZHVsZS5pbXBvcnRzICYmXG4gICAgICAgIGZsYXR0ZW4obmdNb2R1bGUuaW1wb3J0cykubWFwKHVud3JhcE1vZHVsZVdpdGhQcm92aWRlcnNJbXBvcnRzKS5mb3JFYWNoKG1vZCA9PiB7XG4gICAgICAgICAgdmVyaWZ5U2VtYW50aWNzT2ZOZ01vZHVsZUltcG9ydChtb2QsIG1vZHVsZVR5cGUpO1xuICAgICAgICAgIHZlcmlmeVNlbWFudGljc09mTmdNb2R1bGVEZWYobW9kLCBmYWxzZSwgbW9kdWxlVHlwZSk7XG4gICAgICAgIH0pO1xuICAgIG5nTW9kdWxlLmJvb3RzdHJhcCAmJiBkZWVwRm9yRWFjaChuZ01vZHVsZS5ib290c3RyYXAsIHZlcmlmeUNvcnJlY3RCb290c3RyYXBUeXBlKTtcbiAgICBuZ01vZHVsZS5ib290c3RyYXAgJiYgZGVlcEZvckVhY2gobmdNb2R1bGUuYm9vdHN0cmFwLCB2ZXJpZnlDb21wb25lbnRJc1BhcnRPZk5nTW9kdWxlKTtcbiAgICBuZ01vZHVsZS5lbnRyeUNvbXBvbmVudHMgJiZcbiAgICAgICAgZGVlcEZvckVhY2gobmdNb2R1bGUuZW50cnlDb21wb25lbnRzLCB2ZXJpZnlDb21wb25lbnRJc1BhcnRPZk5nTW9kdWxlKTtcbiAgfVxuXG4gIC8vIFRocm93IEVycm9yIGlmIGFueSBlcnJvcnMgd2VyZSBkZXRlY3RlZC5cbiAgaWYgKGVycm9ycy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3JzLmpvaW4oJ1xcbicpKTtcbiAgfVxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgZnVuY3Rpb24gdmVyaWZ5RGVjbGFyYXRpb25zSGF2ZURlZmluaXRpb25zKHR5cGU6IFR5cGU8YW55Pik6IHZvaWQge1xuICAgIHR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlKTtcbiAgICBjb25zdCBkZWYgPSBnZXRDb21wb25lbnREZWYodHlwZSkgfHwgZ2V0RGlyZWN0aXZlRGVmKHR5cGUpIHx8IGdldFBpcGVEZWYodHlwZSk7XG4gICAgaWYgKCFkZWYpIHtcbiAgICAgIGVycm9ycy5wdXNoKFxuICAgICAgICAgIGBVbmV4cGVjdGVkIHZhbHVlICcke3N0cmluZ2lmeUZvckVycm9yKHR5cGUpfScgZGVjbGFyZWQgYnkgdGhlIG1vZHVsZSAnJHtzdHJpbmdpZnlGb3JFcnJvcihtb2R1bGVUeXBlKX0nLiBQbGVhc2UgYWRkIGEgQFBpcGUvQERpcmVjdGl2ZS9AQ29tcG9uZW50IGFubm90YXRpb24uYCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdmVyaWZ5RGlyZWN0aXZlc0hhdmVTZWxlY3Rvcih0eXBlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgICB0eXBlID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZSk7XG4gICAgY29uc3QgZGVmID0gZ2V0RGlyZWN0aXZlRGVmKHR5cGUpO1xuICAgIGlmICghZ2V0Q29tcG9uZW50RGVmKHR5cGUpICYmIGRlZiAmJiBkZWYuc2VsZWN0b3JzLmxlbmd0aCA9PSAwKSB7XG4gICAgICBlcnJvcnMucHVzaChgRGlyZWN0aXZlICR7c3RyaW5naWZ5Rm9yRXJyb3IodHlwZSl9IGhhcyBubyBzZWxlY3RvciwgcGxlYXNlIGFkZCBpdCFgKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB2ZXJpZnlFeHBvcnRzQXJlRGVjbGFyZWRPclJlRXhwb3J0ZWQodHlwZTogVHlwZTxhbnk+KSB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICAgIGNvbnN0IGtpbmQgPSBnZXRDb21wb25lbnREZWYodHlwZSkgJiYgJ2NvbXBvbmVudCcgfHwgZ2V0RGlyZWN0aXZlRGVmKHR5cGUpICYmICdkaXJlY3RpdmUnIHx8XG4gICAgICAgIGdldFBpcGVEZWYodHlwZSkgJiYgJ3BpcGUnO1xuICAgIGlmIChraW5kKSB7XG4gICAgICAvLyBvbmx5IGNoZWNrZWQgaWYgd2UgYXJlIGRlY2xhcmVkIGFzIENvbXBvbmVudCwgRGlyZWN0aXZlLCBvciBQaXBlXG4gICAgICAvLyBNb2R1bGVzIGRvbid0IG5lZWQgdG8gYmUgZGVjbGFyZWQgb3IgaW1wb3J0ZWQuXG4gICAgICBpZiAoY29tYmluZWREZWNsYXJhdGlvbnMubGFzdEluZGV4T2YodHlwZSkgPT09IC0xKSB7XG4gICAgICAgIC8vIFdlIGFyZSBleHBvcnRpbmcgc29tZXRoaW5nIHdoaWNoIHdlIGRvbid0IGV4cGxpY2l0bHkgZGVjbGFyZSBvciBpbXBvcnQuXG4gICAgICAgIGVycm9ycy5wdXNoKFxuICAgICAgICAgICAgYENhbid0IGV4cG9ydCAke2tpbmR9ICR7c3RyaW5naWZ5Rm9yRXJyb3IodHlwZSl9IGZyb20gJHtzdHJpbmdpZnlGb3JFcnJvcihtb2R1bGVUeXBlKX0gYXMgaXQgd2FzIG5laXRoZXIgZGVjbGFyZWQgbm9yIGltcG9ydGVkIWApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHZlcmlmeURlY2xhcmF0aW9uSXNVbmlxdWUodHlwZTogVHlwZTxhbnk+LCBzdXBwcmVzc0Vycm9yczogYm9vbGVhbikge1xuICAgIHR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlKTtcbiAgICBjb25zdCBleGlzdGluZ01vZHVsZSA9IG93bmVyTmdNb2R1bGUuZ2V0KHR5cGUpO1xuICAgIGlmIChleGlzdGluZ01vZHVsZSAmJiBleGlzdGluZ01vZHVsZSAhPT0gbW9kdWxlVHlwZSkge1xuICAgICAgaWYgKCFzdXBwcmVzc0Vycm9ycykge1xuICAgICAgICBjb25zdCBtb2R1bGVzID0gW2V4aXN0aW5nTW9kdWxlLCBtb2R1bGVUeXBlXS5tYXAoc3RyaW5naWZ5Rm9yRXJyb3IpLnNvcnQoKTtcbiAgICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgICAgICBgVHlwZSAke3N0cmluZ2lmeUZvckVycm9yKHR5cGUpfSBpcyBwYXJ0IG9mIHRoZSBkZWNsYXJhdGlvbnMgb2YgMiBtb2R1bGVzOiAke21vZHVsZXNbMF19IGFuZCAke21vZHVsZXNbMV19ISBgICtcbiAgICAgICAgICAgIGBQbGVhc2UgY29uc2lkZXIgbW92aW5nICR7c3RyaW5naWZ5Rm9yRXJyb3IodHlwZSl9IHRvIGEgaGlnaGVyIG1vZHVsZSB0aGF0IGltcG9ydHMgJHttb2R1bGVzWzBdfSBhbmQgJHttb2R1bGVzWzFdfS4gYCArXG4gICAgICAgICAgICBgWW91IGNhbiBhbHNvIGNyZWF0ZSBhIG5ldyBOZ01vZHVsZSB0aGF0IGV4cG9ydHMgYW5kIGluY2x1ZGVzICR7c3RyaW5naWZ5Rm9yRXJyb3IodHlwZSl9IHRoZW4gaW1wb3J0IHRoYXQgTmdNb2R1bGUgaW4gJHttb2R1bGVzWzBdfSBhbmQgJHttb2R1bGVzWzFdfS5gKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTWFyayB0eXBlIGFzIGhhdmluZyBvd25lci5cbiAgICAgIG93bmVyTmdNb2R1bGUuc2V0KHR5cGUsIG1vZHVsZVR5cGUpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHZlcmlmeUNvbXBvbmVudElzUGFydE9mTmdNb2R1bGUodHlwZTogVHlwZTxhbnk+KSB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICAgIGNvbnN0IGV4aXN0aW5nTW9kdWxlID0gb3duZXJOZ01vZHVsZS5nZXQodHlwZSk7XG4gICAgaWYgKCFleGlzdGluZ01vZHVsZSkge1xuICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgICAgYENvbXBvbmVudCAke3N0cmluZ2lmeUZvckVycm9yKHR5cGUpfSBpcyBub3QgcGFydCBvZiBhbnkgTmdNb2R1bGUgb3IgdGhlIG1vZHVsZSBoYXMgbm90IGJlZW4gaW1wb3J0ZWQgaW50byB5b3VyIG1vZHVsZS5gKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB2ZXJpZnlDb3JyZWN0Qm9vdHN0cmFwVHlwZSh0eXBlOiBUeXBlPGFueT4pIHtcbiAgICB0eXBlID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZSk7XG4gICAgaWYgKCFnZXRDb21wb25lbnREZWYodHlwZSkpIHtcbiAgICAgIGVycm9ycy5wdXNoKGAke3N0cmluZ2lmeUZvckVycm9yKHR5cGUpfSBjYW5ub3QgYmUgdXNlZCBhcyBhbiBlbnRyeSBjb21wb25lbnQuYCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdmVyaWZ5Q29tcG9uZW50RW50cnlDb21wb25lbnRzSXNQYXJ0T2ZOZ01vZHVsZSh0eXBlOiBUeXBlPGFueT4pIHtcbiAgICB0eXBlID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZSk7XG4gICAgaWYgKGdldENvbXBvbmVudERlZih0eXBlKSkge1xuICAgICAgLy8gV2Uga25vdyB3ZSBhcmUgY29tcG9uZW50XG4gICAgICBjb25zdCBjb21wb25lbnQgPSBnZXRBbm5vdGF0aW9uPENvbXBvbmVudD4odHlwZSwgJ0NvbXBvbmVudCcpO1xuICAgICAgaWYgKGNvbXBvbmVudCAmJiBjb21wb25lbnQuZW50cnlDb21wb25lbnRzKSB7XG4gICAgICAgIGRlZXBGb3JFYWNoKGNvbXBvbmVudC5lbnRyeUNvbXBvbmVudHMsIHZlcmlmeUNvbXBvbmVudElzUGFydE9mTmdNb2R1bGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHZlcmlmeVNlbWFudGljc09mTmdNb2R1bGVJbXBvcnQodHlwZTogVHlwZTxhbnk+LCBpbXBvcnRpbmdNb2R1bGU6IFR5cGU8YW55Pikge1xuICAgIHR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlKTtcblxuICAgIGlmIChnZXRDb21wb25lbnREZWYodHlwZSkgfHwgZ2V0RGlyZWN0aXZlRGVmKHR5cGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYFVuZXhwZWN0ZWQgZGlyZWN0aXZlICcke3R5cGUubmFtZX0nIGltcG9ydGVkIGJ5IHRoZSBtb2R1bGUgJyR7aW1wb3J0aW5nTW9kdWxlLm5hbWV9Jy4gUGxlYXNlIGFkZCBhbiBATmdNb2R1bGUgYW5ub3RhdGlvbi5gKTtcbiAgICB9XG5cbiAgICBpZiAoZ2V0UGlwZURlZih0eXBlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBVbmV4cGVjdGVkIHBpcGUgJyR7dHlwZS5uYW1lfScgaW1wb3J0ZWQgYnkgdGhlIG1vZHVsZSAnJHtpbXBvcnRpbmdNb2R1bGUubmFtZX0nLiBQbGVhc2UgYWRkIGFuIEBOZ01vZHVsZSBhbm5vdGF0aW9uLmApO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB1bndyYXBNb2R1bGVXaXRoUHJvdmlkZXJzSW1wb3J0cyhcbiAgICB0eXBlT3JXaXRoUHJvdmlkZXJzOiBOZ01vZHVsZVR5cGU8YW55Pnwge25nTW9kdWxlOiBOZ01vZHVsZVR5cGU8YW55Pn0pOiBOZ01vZHVsZVR5cGU8YW55PiB7XG4gIHR5cGVPcldpdGhQcm92aWRlcnMgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlT3JXaXRoUHJvdmlkZXJzKTtcbiAgcmV0dXJuICh0eXBlT3JXaXRoUHJvdmlkZXJzIGFzIGFueSkubmdNb2R1bGUgfHwgdHlwZU9yV2l0aFByb3ZpZGVycztcbn1cblxuZnVuY3Rpb24gZ2V0QW5ub3RhdGlvbjxUPih0eXBlOiBhbnksIG5hbWU6IHN0cmluZyk6IFR8bnVsbCB7XG4gIGxldCBhbm5vdGF0aW9uOiBUfG51bGwgPSBudWxsO1xuICBjb2xsZWN0KHR5cGUuX19hbm5vdGF0aW9uc19fKTtcbiAgY29sbGVjdCh0eXBlLmRlY29yYXRvcnMpO1xuICByZXR1cm4gYW5ub3RhdGlvbjtcblxuICBmdW5jdGlvbiBjb2xsZWN0KGFubm90YXRpb25zOiBhbnlbXSB8IG51bGwpIHtcbiAgICBpZiAoYW5ub3RhdGlvbnMpIHtcbiAgICAgIGFubm90YXRpb25zLmZvckVhY2gocmVhZEFubm90YXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRBbm5vdGF0aW9uKFxuICAgICAgZGVjb3JhdG9yOiB7dHlwZToge3Byb3RvdHlwZToge25nTWV0YWRhdGFOYW1lOiBzdHJpbmd9LCBhcmdzOiBhbnlbXX0sIGFyZ3M6IGFueX0pOiB2b2lkIHtcbiAgICBpZiAoIWFubm90YXRpb24pIHtcbiAgICAgIGNvbnN0IHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGRlY29yYXRvcik7XG4gICAgICBpZiAocHJvdG8ubmdNZXRhZGF0YU5hbWUgPT0gbmFtZSkge1xuICAgICAgICBhbm5vdGF0aW9uID0gZGVjb3JhdG9yIGFzIGFueTtcbiAgICAgIH0gZWxzZSBpZiAoZGVjb3JhdG9yLnR5cGUpIHtcbiAgICAgICAgY29uc3QgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoZGVjb3JhdG9yLnR5cGUpO1xuICAgICAgICBpZiAocHJvdG8ubmdNZXRhZGF0YU5hbWUgPT0gbmFtZSkge1xuICAgICAgICAgIGFubm90YXRpb24gPSBkZWNvcmF0b3IuYXJnc1swXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEtlZXAgdHJhY2sgb2YgY29tcGlsZWQgY29tcG9uZW50cy4gVGhpcyBpcyBuZWVkZWQgYmVjYXVzZSBpbiB0ZXN0cyB3ZSBvZnRlbiB3YW50IHRvIGNvbXBpbGUgdGhlXG4gKiBzYW1lIGNvbXBvbmVudCB3aXRoIG1vcmUgdGhhbiBvbmUgTmdNb2R1bGUuIFRoaXMgd291bGQgY2F1c2UgYW4gZXJyb3IgdW5sZXNzIHdlIHJlc2V0IHdoaWNoXG4gKiBOZ01vZHVsZSB0aGUgY29tcG9uZW50IGJlbG9uZ3MgdG8uIFdlIGtlZXAgdGhlIGxpc3Qgb2YgY29tcGlsZWQgY29tcG9uZW50cyBoZXJlIHNvIHRoYXQgdGhlXG4gKiBUZXN0QmVkIGNhbiByZXNldCBpdCBsYXRlci5cbiAqL1xubGV0IG93bmVyTmdNb2R1bGUgPSBuZXcgTWFwPFR5cGU8YW55PiwgTmdNb2R1bGVUeXBlPGFueT4+KCk7XG5sZXQgdmVyaWZpZWROZ01vZHVsZSA9IG5ldyBNYXA8TmdNb2R1bGVUeXBlPGFueT4sIGJvb2xlYW4+KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNldENvbXBpbGVkQ29tcG9uZW50cygpOiB2b2lkIHtcbiAgb3duZXJOZ01vZHVsZSA9IG5ldyBNYXA8VHlwZTxhbnk+LCBOZ01vZHVsZVR5cGU8YW55Pj4oKTtcbiAgdmVyaWZpZWROZ01vZHVsZSA9IG5ldyBNYXA8TmdNb2R1bGVUeXBlPGFueT4sIGJvb2xlYW4+KCk7XG4gIG1vZHVsZVF1ZXVlLmxlbmd0aCA9IDA7XG59XG5cbi8qKlxuICogQ29tcHV0ZXMgdGhlIGNvbWJpbmVkIGRlY2xhcmF0aW9ucyBvZiBleHBsaWNpdCBkZWNsYXJhdGlvbnMsIGFzIHdlbGwgYXMgZGVjbGFyYXRpb25zIGluaGVyaXRlZCBieVxuICogdHJhdmVyc2luZyB0aGUgZXhwb3J0cyBvZiBpbXBvcnRlZCBtb2R1bGVzLlxuICogQHBhcmFtIHR5cGVcbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUNvbWJpbmVkRXhwb3J0cyh0eXBlOiBUeXBlPGFueT4pOiBUeXBlPGFueT5bXSB7XG4gIHR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlKTtcbiAgY29uc3QgbmdNb2R1bGVEZWYgPSBnZXROZ01vZHVsZURlZih0eXBlLCB0cnVlKTtcbiAgcmV0dXJuIFsuLi5mbGF0dGVuKG1heWJlVW53cmFwRm4obmdNb2R1bGVEZWYuZXhwb3J0cykubWFwKCh0eXBlKSA9PiB7XG4gICAgY29uc3QgbmdNb2R1bGVEZWYgPSBnZXROZ01vZHVsZURlZih0eXBlKTtcbiAgICBpZiAobmdNb2R1bGVEZWYpIHtcbiAgICAgIHZlcmlmeVNlbWFudGljc09mTmdNb2R1bGVEZWYodHlwZSBhcyBhbnkgYXMgTmdNb2R1bGVUeXBlLCBmYWxzZSk7XG4gICAgICByZXR1cm4gY29tcHV0ZUNvbWJpbmVkRXhwb3J0cyh0eXBlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHR5cGU7XG4gICAgfVxuICB9KSldO1xufVxuXG4vKipcbiAqIFNvbWUgZGVjbGFyZWQgY29tcG9uZW50cyBtYXkgYmUgY29tcGlsZWQgYXN5bmNocm9ub3VzbHksIGFuZCB0aHVzIG1heSBub3QgaGF2ZSB0aGVpclxuICogybVjbXAgc2V0IHlldC4gSWYgdGhpcyBpcyB0aGUgY2FzZSwgdGhlbiBhIHJlZmVyZW5jZSB0byB0aGUgbW9kdWxlIGlzIHdyaXR0ZW4gaW50b1xuICogdGhlIGBuZ1NlbGVjdG9yU2NvcGVgIHByb3BlcnR5IG9mIHRoZSBkZWNsYXJlZCB0eXBlLlxuICovXG5mdW5jdGlvbiBzZXRTY29wZU9uRGVjbGFyZWRDb21wb25lbnRzKG1vZHVsZVR5cGU6IFR5cGU8YW55PiwgbmdNb2R1bGU6IE5nTW9kdWxlKSB7XG4gIGNvbnN0IGRlY2xhcmF0aW9uczogVHlwZTxhbnk+W10gPSBmbGF0dGVuKG5nTW9kdWxlLmRlY2xhcmF0aW9ucyB8fCBFTVBUWV9BUlJBWSk7XG5cbiAgY29uc3QgdHJhbnNpdGl2ZVNjb3BlcyA9IHRyYW5zaXRpdmVTY29wZXNGb3IobW9kdWxlVHlwZSk7XG5cbiAgZGVjbGFyYXRpb25zLmZvckVhY2goZGVjbGFyYXRpb24gPT4ge1xuICAgIGlmIChkZWNsYXJhdGlvbi5oYXNPd25Qcm9wZXJ0eShOR19DT01QX0RFRikpIHtcbiAgICAgIC8vIEEgYMm1Y21wYCBmaWVsZCBleGlzdHMgLSBnbyBhaGVhZCBhbmQgcGF0Y2ggdGhlIGNvbXBvbmVudCBkaXJlY3RseS5cbiAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGRlY2xhcmF0aW9uIGFzIFR5cGU8YW55PiYge8m1Y21wOiBDb21wb25lbnREZWY8YW55Pn07XG4gICAgICBjb25zdCBjb21wb25lbnREZWYgPSBnZXRDb21wb25lbnREZWYoY29tcG9uZW50KSAhO1xuICAgICAgcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUoY29tcG9uZW50RGVmLCB0cmFuc2l0aXZlU2NvcGVzKTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgICAhZGVjbGFyYXRpb24uaGFzT3duUHJvcGVydHkoTkdfRElSX0RFRikgJiYgIWRlY2xhcmF0aW9uLmhhc093blByb3BlcnR5KE5HX1BJUEVfREVGKSkge1xuICAgICAgLy8gU2V0IGBuZ1NlbGVjdG9yU2NvcGVgIGZvciBmdXR1cmUgcmVmZXJlbmNlIHdoZW4gdGhlIGNvbXBvbmVudCBjb21waWxhdGlvbiBmaW5pc2hlcy5cbiAgICAgIChkZWNsYXJhdGlvbiBhcyBUeXBlPGFueT4mIHtuZ1NlbGVjdG9yU2NvcGU/OiBhbnl9KS5uZ1NlbGVjdG9yU2NvcGUgPSBtb2R1bGVUeXBlO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qKlxuICogUGF0Y2ggdGhlIGRlZmluaXRpb24gb2YgYSBjb21wb25lbnQgd2l0aCBkaXJlY3RpdmVzIGFuZCBwaXBlcyBmcm9tIHRoZSBjb21waWxhdGlvbiBzY29wZSBvZlxuICogYSBnaXZlbiBtb2R1bGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXRjaENvbXBvbmVudERlZldpdGhTY29wZTxDPihcbiAgICBjb21wb25lbnREZWY6IENvbXBvbmVudERlZjxDPiwgdHJhbnNpdGl2ZVNjb3BlczogTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzKSB7XG4gIGNvbXBvbmVudERlZi5kaXJlY3RpdmVEZWZzID0gKCkgPT5cbiAgICAgIEFycmF5LmZyb20odHJhbnNpdGl2ZVNjb3Blcy5jb21waWxhdGlvbi5kaXJlY3RpdmVzKVxuICAgICAgICAgIC5tYXAoXG4gICAgICAgICAgICAgIGRpciA9PlxuICAgICAgICAgICAgICAgICAgZGlyLmhhc093blByb3BlcnR5KE5HX0NPTVBfREVGKSA/IGdldENvbXBvbmVudERlZihkaXIpICEgOiBnZXREaXJlY3RpdmVEZWYoZGlyKSAhKVxuICAgICAgICAgIC5maWx0ZXIoZGVmID0+ICEhZGVmKTtcbiAgY29tcG9uZW50RGVmLnBpcGVEZWZzID0gKCkgPT5cbiAgICAgIEFycmF5LmZyb20odHJhbnNpdGl2ZVNjb3Blcy5jb21waWxhdGlvbi5waXBlcykubWFwKHBpcGUgPT4gZ2V0UGlwZURlZihwaXBlKSAhKTtcbiAgY29tcG9uZW50RGVmLnNjaGVtYXMgPSB0cmFuc2l0aXZlU2NvcGVzLnNjaGVtYXM7XG5cbiAgLy8gU2luY2Ugd2UgYXZvaWQgQ29tcG9uZW50cy9EaXJlY3RpdmVzL1BpcGVzIHJlY29tcGlsaW5nIGluIGNhc2UgdGhlcmUgYXJlIG5vIG92ZXJyaWRlcywgd2VcbiAgLy8gbWF5IGZhY2UgYSBwcm9ibGVtIHdoZXJlIHByZXZpb3VzbHkgY29tcGlsZWQgZGVmcyBhdmFpbGFibGUgdG8gYSBnaXZlbiBDb21wb25lbnQvRGlyZWN0aXZlXG4gIC8vIGFyZSBjYWNoZWQgaW4gVFZpZXcgYW5kIG1heSBiZWNvbWUgc3RhbGUgKGluIGNhc2UgYW55IG9mIHRoZXNlIGRlZnMgZ2V0cyByZWNvbXBpbGVkKS4gSW5cbiAgLy8gb3JkZXIgdG8gYXZvaWQgdGhpcyBwcm9ibGVtLCB3ZSBmb3JjZSBmcmVzaCBUVmlldyB0byBiZSBjcmVhdGVkLlxuICBjb21wb25lbnREZWYudFZpZXcgPSBudWxsO1xufVxuXG4vKipcbiAqIENvbXB1dGUgdGhlIHBhaXIgb2YgdHJhbnNpdGl2ZSBzY29wZXMgKGNvbXBpbGF0aW9uIHNjb3BlIGFuZCBleHBvcnRlZCBzY29wZSkgZm9yIGEgZ2l2ZW4gbW9kdWxlLlxuICpcbiAqIEJ5IGRlZmF1bHQgdGhpcyBvcGVyYXRpb24gaXMgbWVtb2l6ZWQgYW5kIHRoZSByZXN1bHQgaXMgY2FjaGVkIG9uIHRoZSBtb2R1bGUncyBkZWZpbml0aW9uLiBZb3VcbiAqIGNhbiBhdm9pZCBtZW1vaXphdGlvbiBhbmQgcHJldmlvdXNseSBzdG9yZWQgcmVzdWx0cyAoaWYgYXZhaWxhYmxlKSBieSBwcm92aWRpbmcgdGhlIHNlY29uZFxuICogYXJndW1lbnQgd2l0aCB0aGUgYHRydWVgIHZhbHVlIChmb3JjaW5nIHRyYW5zaXRpdmUgc2NvcGVzIHJlY2FsY3VsYXRpb24pLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gY2FuIGJlIGNhbGxlZCBvbiBtb2R1bGVzIHdpdGggY29tcG9uZW50cyB0aGF0IGhhdmUgbm90IGZ1bGx5IGNvbXBpbGVkIHlldCwgYnV0IHRoZVxuICogcmVzdWx0IHNob3VsZCBub3QgYmUgdXNlZCB1bnRpbCB0aGV5IGhhdmUuXG4gKlxuICogQHBhcmFtIG1vZHVsZVR5cGUgbW9kdWxlIHRoYXQgdHJhbnNpdGl2ZSBzY29wZSBzaG91bGQgYmUgY2FsY3VsYXRlZCBmb3IuXG4gKiBAcGFyYW0gZm9yY2VSZWNhbGMgZmxhZyB0aGF0IGluZGljYXRlcyB3aGV0aGVyIHByZXZpb3VzbHkgY2FsY3VsYXRlZCBhbmQgbWVtb2l6ZWQgdmFsdWVzIHNob3VsZFxuICogYmUgaWdub3JlZCBhbmQgdHJhbnNpdGl2ZSBzY29wZSB0byBiZSBmdWxseSByZWNhbGN1bGF0ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2l0aXZlU2NvcGVzRm9yPFQ+KFxuICAgIG1vZHVsZVR5cGU6IFR5cGU8VD4sIGZvcmNlUmVjYWxjOiBib29sZWFuID0gZmFsc2UpOiBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMge1xuICBpZiAoIWlzTmdNb2R1bGUobW9kdWxlVHlwZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bW9kdWxlVHlwZS5uYW1lfSBkb2VzIG5vdCBoYXZlIGEgbW9kdWxlIGRlZiAoybVtb2QgcHJvcGVydHkpYCk7XG4gIH1cbiAgY29uc3QgZGVmID0gZ2V0TmdNb2R1bGVEZWYobW9kdWxlVHlwZSkgITtcblxuICBpZiAoIWZvcmNlUmVjYWxjICYmIGRlZi50cmFuc2l0aXZlQ29tcGlsZVNjb3BlcyAhPT0gbnVsbCkge1xuICAgIHJldHVybiBkZWYudHJhbnNpdGl2ZUNvbXBpbGVTY29wZXM7XG4gIH1cblxuICBjb25zdCBzY29wZXM6IE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3BlcyA9IHtcbiAgICBzY2hlbWFzOiBkZWYuc2NoZW1hcyB8fCBudWxsLFxuICAgIGNvbXBpbGF0aW9uOiB7XG4gICAgICBkaXJlY3RpdmVzOiBuZXcgU2V0PGFueT4oKSxcbiAgICAgIHBpcGVzOiBuZXcgU2V0PGFueT4oKSxcbiAgICB9LFxuICAgIGV4cG9ydGVkOiB7XG4gICAgICBkaXJlY3RpdmVzOiBuZXcgU2V0PGFueT4oKSxcbiAgICAgIHBpcGVzOiBuZXcgU2V0PGFueT4oKSxcbiAgICB9LFxuICB9O1xuXG4gIG1heWJlVW53cmFwRm4oZGVmLmRlY2xhcmF0aW9ucykuZm9yRWFjaChkZWNsYXJlZCA9PiB7XG4gICAgY29uc3QgZGVjbGFyZWRXaXRoRGVmcyA9IGRlY2xhcmVkIGFzIFR5cGU8YW55PiYgeyDJtXBpcGU/OiBhbnk7IH07XG5cbiAgICBpZiAoZ2V0UGlwZURlZihkZWNsYXJlZFdpdGhEZWZzKSkge1xuICAgICAgc2NvcGVzLmNvbXBpbGF0aW9uLnBpcGVzLmFkZChkZWNsYXJlZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEVpdGhlciBkZWNsYXJlZCBoYXMgYSDJtWNtcCBvciDJtWRpciwgb3IgaXQncyBhIGNvbXBvbmVudCB3aGljaCBoYXNuJ3RcbiAgICAgIC8vIGhhZCBpdHMgdGVtcGxhdGUgY29tcGlsZWQgeWV0LiBJbiBlaXRoZXIgY2FzZSwgaXQgZ2V0cyBhZGRlZCB0byB0aGUgY29tcGlsYXRpb24nc1xuICAgICAgLy8gZGlyZWN0aXZlcy5cbiAgICAgIHNjb3Blcy5jb21waWxhdGlvbi5kaXJlY3RpdmVzLmFkZChkZWNsYXJlZCk7XG4gICAgfVxuICB9KTtcblxuICBtYXliZVVud3JhcEZuKGRlZi5pbXBvcnRzKS5mb3JFYWNoKDxJPihpbXBvcnRlZDogVHlwZTxJPikgPT4ge1xuICAgIGNvbnN0IGltcG9ydGVkVHlwZSA9IGltcG9ydGVkIGFzIFR5cGU8ST4mIHtcbiAgICAgIC8vIElmIGltcG9ydGVkIGlzIGFuIEBOZ01vZHVsZTpcbiAgICAgIMm1bW9kPzogTmdNb2R1bGVEZWY8ST47XG4gICAgfTtcblxuICAgIGlmICghaXNOZ01vZHVsZTxJPihpbXBvcnRlZFR5cGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEltcG9ydGluZyAke2ltcG9ydGVkVHlwZS5uYW1lfSB3aGljaCBkb2VzIG5vdCBoYXZlIGEgybVtb2QgcHJvcGVydHlgKTtcbiAgICB9XG5cbiAgICAvLyBXaGVuIHRoaXMgbW9kdWxlIGltcG9ydHMgYW5vdGhlciwgdGhlIGltcG9ydGVkIG1vZHVsZSdzIGV4cG9ydGVkIGRpcmVjdGl2ZXMgYW5kIHBpcGVzIGFyZVxuICAgIC8vIGFkZGVkIHRvIHRoZSBjb21waWxhdGlvbiBzY29wZSBvZiB0aGlzIG1vZHVsZS5cbiAgICBjb25zdCBpbXBvcnRlZFNjb3BlID0gdHJhbnNpdGl2ZVNjb3Blc0ZvcihpbXBvcnRlZFR5cGUsIGZvcmNlUmVjYWxjKTtcbiAgICBpbXBvcnRlZFNjb3BlLmV4cG9ydGVkLmRpcmVjdGl2ZXMuZm9yRWFjaChlbnRyeSA9PiBzY29wZXMuY29tcGlsYXRpb24uZGlyZWN0aXZlcy5hZGQoZW50cnkpKTtcbiAgICBpbXBvcnRlZFNjb3BlLmV4cG9ydGVkLnBpcGVzLmZvckVhY2goZW50cnkgPT4gc2NvcGVzLmNvbXBpbGF0aW9uLnBpcGVzLmFkZChlbnRyeSkpO1xuICB9KTtcblxuICBtYXliZVVud3JhcEZuKGRlZi5leHBvcnRzKS5mb3JFYWNoKDxFPihleHBvcnRlZDogVHlwZTxFPikgPT4ge1xuICAgIGNvbnN0IGV4cG9ydGVkVHlwZSA9IGV4cG9ydGVkIGFzIFR5cGU8RT4mIHtcbiAgICAgIC8vIENvbXBvbmVudHMsIERpcmVjdGl2ZXMsIE5nTW9kdWxlcywgYW5kIFBpcGVzIGNhbiBhbGwgYmUgZXhwb3J0ZWQuXG4gICAgICDJtWNtcD86IGFueTtcbiAgICAgIMm1ZGlyPzogYW55O1xuICAgICAgybVtb2Q/OiBOZ01vZHVsZURlZjxFPjtcbiAgICAgIMm1cGlwZT86IGFueTtcbiAgICB9O1xuXG4gICAgLy8gRWl0aGVyIHRoZSB0eXBlIGlzIGEgbW9kdWxlLCBhIHBpcGUsIG9yIGEgY29tcG9uZW50L2RpcmVjdGl2ZSAod2hpY2ggbWF5IG5vdCBoYXZlIGFcbiAgICAvLyDJtWNtcCBhcyBpdCBtaWdodCBiZSBjb21waWxlZCBhc3luY2hyb25vdXNseSkuXG4gICAgaWYgKGlzTmdNb2R1bGUoZXhwb3J0ZWRUeXBlKSkge1xuICAgICAgLy8gV2hlbiB0aGlzIG1vZHVsZSBleHBvcnRzIGFub3RoZXIsIHRoZSBleHBvcnRlZCBtb2R1bGUncyBleHBvcnRlZCBkaXJlY3RpdmVzIGFuZCBwaXBlcyBhcmVcbiAgICAgIC8vIGFkZGVkIHRvIGJvdGggdGhlIGNvbXBpbGF0aW9uIGFuZCBleHBvcnRlZCBzY29wZXMgb2YgdGhpcyBtb2R1bGUuXG4gICAgICBjb25zdCBleHBvcnRlZFNjb3BlID0gdHJhbnNpdGl2ZVNjb3Blc0ZvcihleHBvcnRlZFR5cGUsIGZvcmNlUmVjYWxjKTtcbiAgICAgIGV4cG9ydGVkU2NvcGUuZXhwb3J0ZWQuZGlyZWN0aXZlcy5mb3JFYWNoKGVudHJ5ID0+IHtcbiAgICAgICAgc2NvcGVzLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMuYWRkKGVudHJ5KTtcbiAgICAgICAgc2NvcGVzLmV4cG9ydGVkLmRpcmVjdGl2ZXMuYWRkKGVudHJ5KTtcbiAgICAgIH0pO1xuICAgICAgZXhwb3J0ZWRTY29wZS5leHBvcnRlZC5waXBlcy5mb3JFYWNoKGVudHJ5ID0+IHtcbiAgICAgICAgc2NvcGVzLmNvbXBpbGF0aW9uLnBpcGVzLmFkZChlbnRyeSk7XG4gICAgICAgIHNjb3Blcy5leHBvcnRlZC5waXBlcy5hZGQoZW50cnkpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChnZXRQaXBlRGVmKGV4cG9ydGVkVHlwZSkpIHtcbiAgICAgIHNjb3Blcy5leHBvcnRlZC5waXBlcy5hZGQoZXhwb3J0ZWRUeXBlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2NvcGVzLmV4cG9ydGVkLmRpcmVjdGl2ZXMuYWRkKGV4cG9ydGVkVHlwZSk7XG4gICAgfVxuICB9KTtcblxuICBpZiAoIWZvcmNlUmVjYWxjKSB7XG4gICAgZGVmLnRyYW5zaXRpdmVDb21waWxlU2NvcGVzID0gc2NvcGVzO1xuICB9XG4gIHJldHVybiBzY29wZXM7XG59XG5cbmZ1bmN0aW9uIGV4cGFuZE1vZHVsZVdpdGhQcm92aWRlcnModmFsdWU6IFR5cGU8YW55PnwgTW9kdWxlV2l0aFByb3ZpZGVyczx7fT4pOiBUeXBlPGFueT4ge1xuICBpZiAoaXNNb2R1bGVXaXRoUHJvdmlkZXJzKHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS5uZ01vZHVsZTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGlzTW9kdWxlV2l0aFByb3ZpZGVycyh2YWx1ZTogYW55KTogdmFsdWUgaXMgTW9kdWxlV2l0aFByb3ZpZGVyczx7fT4ge1xuICByZXR1cm4gKHZhbHVlIGFze25nTW9kdWxlPzogYW55fSkubmdNb2R1bGUgIT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaXNOZ01vZHVsZTxUPih2YWx1ZTogVHlwZTxUPik6IHZhbHVlIGlzIFR5cGU8VD4me8m1bW9kOiBOZ01vZHVsZURlZjxUPn0ge1xuICByZXR1cm4gISFnZXROZ01vZHVsZURlZih2YWx1ZSk7XG59XG4iXX0=