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
                    schemas: ngModule.schemas ? flatten(ngModule.schemas) : null,
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
        ngModule.bootstrap && ngModule.bootstrap.forEach(verifyCorrectBootstrapType);
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
    function verifyCorrectBootstrapType(type) {
        type = resolveForwardRef(type);
        if (!getComponentDef(type)) {
            errors.push(`${renderStringify(type)} cannot be used as an entry component.`);
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
        .map(dir => dir.hasOwnProperty(NG_COMPONENT_DEF) ? (/** @type {?} */ (getComponentDef(dir))) :
        (/** @type {?} */ (getDirectiveDef(dir))))
        .filter(def => !!def);
    componentDef.pipeDefs = () => Array.from(transitiveScopes.compilation.pipes).map(pipe => (/** @type {?} */ (getPipeDef(pipe))));
    componentDef.schemas = transitiveScopes.schemas;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvbW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUEyQixpQkFBaUIsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQzNGLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3ZELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUN4RCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUV0RCxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSx1Q0FBdUMsQ0FBQztBQUczRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLGVBQWUsRUFBRSxlQUFlLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMzRixPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUd6RixPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRXhDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7O01BRXZDLFdBQVcsR0FBZ0IsRUFBRTs7OztBQUVuQyw4QkFHQzs7O0lBRkMscUNBQXNCOztJQUN0QixtQ0FBbUI7OztNQUdmLFdBQVcsR0FBc0IsRUFBRTs7Ozs7Ozs7QUFNekMsU0FBUyw4QkFBOEIsQ0FBQyxVQUFxQixFQUFFLFFBQWtCO0lBQy9FLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBQyxVQUFVLEVBQUUsUUFBUSxFQUFDLENBQUMsQ0FBQztBQUMzQyxDQUFDOztJQUVHLG1CQUFtQixHQUFHLEtBQUs7Ozs7Ozs7QUFNL0IsTUFB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LENBQUM7SUFFSCxHQUFHLENBQUMsdUJBQXVCLEdBQUcsTUFBTSxDQUFDO0lBQ3JDLE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7Ozs7Ozs7QUFFRCxTQUFTLE9BQU8sQ0FBSSxNQUFhLEVBQUUsS0FBeUI7O1VBQ3BELEdBQUcsR0FBYyxFQUFFO0lBQ3pCLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDckIsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ3hCLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUksS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDdkM7YUFBTTtZQUNMLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3hDO0lBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDSCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7Ozs7O0FBRUQsU0FBUyx5QkFBeUIsQ0FBQyxLQUF5QztJQUMxRSxJQUFJLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ2hDLE9BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBQztLQUN2QjtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQzs7Ozs7QUFFRCxTQUFTLHFCQUFxQixDQUFDLEtBQVU7SUFDdkMsT0FBTyxDQUFDLG1CQUFBLEtBQUssRUFBbUIsQ0FBQyxDQUFDLFFBQVEsS0FBSyxTQUFTLENBQUM7QUFDM0QsQ0FBQzs7Ozs7O0FBRUQsU0FBUyxVQUFVLENBQUksS0FBYztJQUNuQyxPQUFPLENBQUMsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDakMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSM0luamVjdG9yTWV0YWRhdGFGYWNhZGUsIGdldENvbXBpbGVyRmFjYWRlfSBmcm9tICcuLi8uLi9jb21waWxlci9jb21waWxlcl9mYWNhZGUnO1xuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi4vLi4vZGkvZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtOR19JTkpFQ1RPUl9ERUZ9IGZyb20gJy4uLy4uL2RpL2ludGVyZmFjZS9kZWZzJztcbmltcG9ydCB7cmVmbGVjdERlcGVuZGVuY2llc30gZnJvbSAnLi4vLi4vZGkvaml0L3V0aWwnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge3JlZ2lzdGVyTmdNb2R1bGVUeXBlfSBmcm9tICcuLi8uLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnlfbG9hZGVyJztcbmltcG9ydCB7Q29tcG9uZW50fSBmcm9tICcuLi8uLi9tZXRhZGF0YSc7XG5pbXBvcnQge01vZHVsZVdpdGhQcm92aWRlcnMsIE5nTW9kdWxlLCBOZ01vZHVsZURlZiwgTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9uZ19tb2R1bGUnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZiwgZ2V0RGlyZWN0aXZlRGVmLCBnZXROZ01vZHVsZURlZiwgZ2V0UGlwZURlZn0gZnJvbSAnLi4vZGVmaW5pdGlvbic7XG5pbXBvcnQge05HX0NPTVBPTkVOVF9ERUYsIE5HX0RJUkVDVElWRV9ERUYsIE5HX01PRFVMRV9ERUYsIE5HX1BJUEVfREVGfSBmcm9tICcuLi9maWVsZHMnO1xuaW1wb3J0IHtDb21wb25lbnREZWZ9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge05nTW9kdWxlVHlwZX0gZnJvbSAnLi4vbmdfbW9kdWxlX3JlZic7XG5pbXBvcnQge3JlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbCc7XG5cbmltcG9ydCB7YW5ndWxhckNvcmVFbnZ9IGZyb20gJy4vZW52aXJvbm1lbnQnO1xuXG5jb25zdCBFTVBUWV9BUlJBWTogVHlwZTxhbnk+W10gPSBbXTtcblxuaW50ZXJmYWNlIE1vZHVsZVF1ZXVlSXRlbSB7XG4gIG1vZHVsZVR5cGU6IFR5cGU8YW55PjtcbiAgbmdNb2R1bGU6IE5nTW9kdWxlO1xufVxuXG5jb25zdCBtb2R1bGVRdWV1ZTogTW9kdWxlUXVldWVJdGVtW10gPSBbXTtcblxuLyoqXG4gKiBFbnF1ZXVlcyBtb2R1bGVEZWYgdG8gYmUgY2hlY2tlZCBsYXRlciB0byBzZWUgaWYgc2NvcGUgY2FuIGJlIHNldCBvbiBpdHNcbiAqIGNvbXBvbmVudCBkZWNsYXJhdGlvbnMuXG4gKi9cbmZ1bmN0aW9uIGVucXVldWVNb2R1bGVGb3JEZWxheWVkU2NvcGluZyhtb2R1bGVUeXBlOiBUeXBlPGFueT4sIG5nTW9kdWxlOiBOZ01vZHVsZSkge1xuICBtb2R1bGVRdWV1ZS5wdXNoKHttb2R1bGVUeXBlLCBuZ01vZHVsZX0pO1xufVxuXG5sZXQgZmx1c2hpbmdNb2R1bGVRdWV1ZSA9IGZhbHNlO1xuLyoqXG4gKiBMb29wcyBvdmVyIHF1ZXVlZCBtb2R1bGUgZGVmaW5pdGlvbnMsIGlmIGEgZ2l2ZW4gbW9kdWxlIGRlZmluaXRpb24gaGFzIGFsbCBvZiBpdHNcbiAqIGRlY2xhcmF0aW9ucyByZXNvbHZlZCwgaXQgZGVxdWV1ZXMgdGhhdCBtb2R1bGUgZGVmaW5pdGlvbiBhbmQgc2V0cyB0aGUgc2NvcGUgb25cbiAqIGl0cyBkZWNsYXJhdGlvbnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmbHVzaE1vZHVsZVNjb3BpbmdRdWV1ZUFzTXVjaEFzUG9zc2libGUoKSB7XG4gIGlmICghZmx1c2hpbmdNb2R1bGVRdWV1ZSkge1xuICAgIGZsdXNoaW5nTW9kdWxlUXVldWUgPSB0cnVlO1xuICAgIHRyeSB7XG4gICAgICBmb3IgKGxldCBpID0gbW9kdWxlUXVldWUubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgY29uc3Qge21vZHVsZVR5cGUsIG5nTW9kdWxlfSA9IG1vZHVsZVF1ZXVlW2ldO1xuXG4gICAgICAgIGlmIChuZ01vZHVsZS5kZWNsYXJhdGlvbnMgJiYgbmdNb2R1bGUuZGVjbGFyYXRpb25zLmV2ZXJ5KGlzUmVzb2x2ZWREZWNsYXJhdGlvbikpIHtcbiAgICAgICAgICAvLyBkZXF1ZXVlXG4gICAgICAgICAgbW9kdWxlUXVldWUuc3BsaWNlKGksIDEpO1xuICAgICAgICAgIHNldFNjb3BlT25EZWNsYXJlZENvbXBvbmVudHMobW9kdWxlVHlwZSwgbmdNb2R1bGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGZsdXNoaW5nTW9kdWxlUXVldWUgPSBmYWxzZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydXRoeSBpZiBhIGRlY2xhcmF0aW9uIGhhcyByZXNvbHZlZC4gSWYgdGhlIGRlY2xhcmF0aW9uIGhhcHBlbnMgdG8gYmVcbiAqIGFuIGFycmF5IG9mIGRlY2xhcmF0aW9ucywgaXQgd2lsbCByZWN1cnNlIHRvIGNoZWNrIGVhY2ggZGVjbGFyYXRpb24gaW4gdGhhdCBhcnJheVxuICogKHdoaWNoIG1heSBhbHNvIGJlIGFycmF5cykuXG4gKi9cbmZ1bmN0aW9uIGlzUmVzb2x2ZWREZWNsYXJhdGlvbihkZWNsYXJhdGlvbjogYW55W10gfCBUeXBlPGFueT4pOiBib29sZWFuIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkoZGVjbGFyYXRpb24pKSB7XG4gICAgcmV0dXJuIGRlY2xhcmF0aW9uLmV2ZXJ5KGlzUmVzb2x2ZWREZWNsYXJhdGlvbik7XG4gIH1cbiAgcmV0dXJuICEhcmVzb2x2ZUZvcndhcmRSZWYoZGVjbGFyYXRpb24pO1xufVxuXG4vKipcbiAqIENvbXBpbGVzIGEgbW9kdWxlIGluIEpJVCBtb2RlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gYXV0b21hdGljYWxseSBnZXRzIGNhbGxlZCB3aGVuIGEgY2xhc3MgaGFzIGEgYEBOZ01vZHVsZWAgZGVjb3JhdG9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZU5nTW9kdWxlKG1vZHVsZVR5cGU6IFR5cGU8YW55PiwgbmdNb2R1bGU6IE5nTW9kdWxlID0ge30pOiB2b2lkIHtcbiAgY29tcGlsZU5nTW9kdWxlRGVmcyhtb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZSwgbmdNb2R1bGUpO1xuXG4gIC8vIEJlY2F1c2Ugd2UgZG9uJ3Qga25vdyBpZiBhbGwgZGVjbGFyYXRpb25zIGhhdmUgcmVzb2x2ZWQgeWV0IGF0IHRoZSBtb21lbnQgdGhlXG4gIC8vIE5nTW9kdWxlIGRlY29yYXRvciBpcyBleGVjdXRpbmcsIHdlJ3JlIGVucXVldWVpbmcgdGhlIHNldHRpbmcgb2YgbW9kdWxlIHNjb3BlXG4gIC8vIG9uIGl0cyBkZWNsYXJhdGlvbnMgdG8gYmUgcnVuIGF0IGEgbGF0ZXIgdGltZSB3aGVuIGFsbCBkZWNsYXJhdGlvbnMgZm9yIHRoZSBtb2R1bGUsXG4gIC8vIGluY2x1ZGluZyBmb3J3YXJkIHJlZnMsIGhhdmUgcmVzb2x2ZWQuXG4gIGVucXVldWVNb2R1bGVGb3JEZWxheWVkU2NvcGluZyhtb2R1bGVUeXBlLCBuZ01vZHVsZSk7XG59XG5cbi8qKlxuICogQ29tcGlsZXMgYW5kIGFkZHMgdGhlIGBuZ01vZHVsZURlZmAgYW5kIGBuZ0luamVjdG9yRGVmYCBwcm9wZXJ0aWVzIHRvIHRoZSBtb2R1bGUgY2xhc3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlTmdNb2R1bGVEZWZzKG1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZSwgbmdNb2R1bGU6IE5nTW9kdWxlKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKG1vZHVsZVR5cGUsICdSZXF1aXJlZCB2YWx1ZSBtb2R1bGVUeXBlJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKG5nTW9kdWxlLCAnUmVxdWlyZWQgdmFsdWUgbmdNb2R1bGUnKTtcbiAgY29uc3QgZGVjbGFyYXRpb25zOiBUeXBlPGFueT5bXSA9IGZsYXR0ZW4obmdNb2R1bGUuZGVjbGFyYXRpb25zIHx8IEVNUFRZX0FSUkFZKTtcblxuICBsZXQgbmdNb2R1bGVEZWY6IGFueSA9IG51bGw7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShtb2R1bGVUeXBlLCBOR19NT0RVTEVfREVGLCB7XG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKG5nTW9kdWxlRGVmID09PSBudWxsKSB7XG4gICAgICAgIG5nTW9kdWxlRGVmID0gZ2V0Q29tcGlsZXJGYWNhZGUoKS5jb21waWxlTmdNb2R1bGUoXG4gICAgICAgICAgICBhbmd1bGFyQ29yZUVudiwgYG5nOi8vJHttb2R1bGVUeXBlLm5hbWV9L25nTW9kdWxlRGVmLmpzYCwge1xuICAgICAgICAgICAgICB0eXBlOiBtb2R1bGVUeXBlLFxuICAgICAgICAgICAgICBib290c3RyYXA6IGZsYXR0ZW4obmdNb2R1bGUuYm9vdHN0cmFwIHx8IEVNUFRZX0FSUkFZLCByZXNvbHZlRm9yd2FyZFJlZiksXG4gICAgICAgICAgICAgIGRlY2xhcmF0aW9uczogZGVjbGFyYXRpb25zLm1hcChyZXNvbHZlRm9yd2FyZFJlZiksXG4gICAgICAgICAgICAgIGltcG9ydHM6IGZsYXR0ZW4obmdNb2R1bGUuaW1wb3J0cyB8fCBFTVBUWV9BUlJBWSwgcmVzb2x2ZUZvcndhcmRSZWYpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKGV4cGFuZE1vZHVsZVdpdGhQcm92aWRlcnMpLFxuICAgICAgICAgICAgICBleHBvcnRzOiBmbGF0dGVuKG5nTW9kdWxlLmV4cG9ydHMgfHwgRU1QVFlfQVJSQVksIHJlc29sdmVGb3J3YXJkUmVmKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChleHBhbmRNb2R1bGVXaXRoUHJvdmlkZXJzKSxcbiAgICAgICAgICAgICAgZW1pdElubGluZTogdHJ1ZSxcbiAgICAgICAgICAgICAgc2NoZW1hczogbmdNb2R1bGUuc2NoZW1hcyA/IGZsYXR0ZW4obmdNb2R1bGUuc2NoZW1hcykgOiBudWxsLFxuICAgICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmdNb2R1bGVEZWY7XG4gICAgfVxuICB9KTtcbiAgaWYgKG5nTW9kdWxlLmlkKSB7XG4gICAgcmVnaXN0ZXJOZ01vZHVsZVR5cGUobmdNb2R1bGUuaWQsIG1vZHVsZVR5cGUpO1xuICB9XG5cbiAgbGV0IG5nSW5qZWN0b3JEZWY6IGFueSA9IG51bGw7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShtb2R1bGVUeXBlLCBOR19JTkpFQ1RPUl9ERUYsIHtcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChuZ0luamVjdG9yRGVmID09PSBudWxsKSB7XG4gICAgICAgIG5nRGV2TW9kZSAmJiB2ZXJpZnlTZW1hbnRpY3NPZk5nTW9kdWxlRGVmKG1vZHVsZVR5cGUgYXMgYW55IGFzIE5nTW9kdWxlVHlwZSk7XG4gICAgICAgIGNvbnN0IG1ldGE6IFIzSW5qZWN0b3JNZXRhZGF0YUZhY2FkZSA9IHtcbiAgICAgICAgICBuYW1lOiBtb2R1bGVUeXBlLm5hbWUsXG4gICAgICAgICAgdHlwZTogbW9kdWxlVHlwZSxcbiAgICAgICAgICBkZXBzOiByZWZsZWN0RGVwZW5kZW5jaWVzKG1vZHVsZVR5cGUpLFxuICAgICAgICAgIHByb3ZpZGVyczogbmdNb2R1bGUucHJvdmlkZXJzIHx8IEVNUFRZX0FSUkFZLFxuICAgICAgICAgIGltcG9ydHM6IFtcbiAgICAgICAgICAgIChuZ01vZHVsZS5pbXBvcnRzIHx8IEVNUFRZX0FSUkFZKS5tYXAocmVzb2x2ZUZvcndhcmRSZWYpLFxuICAgICAgICAgICAgKG5nTW9kdWxlLmV4cG9ydHMgfHwgRU1QVFlfQVJSQVkpLm1hcChyZXNvbHZlRm9yd2FyZFJlZiksXG4gICAgICAgICAgXSxcbiAgICAgICAgfTtcbiAgICAgICAgbmdJbmplY3RvckRlZiA9IGdldENvbXBpbGVyRmFjYWRlKCkuY29tcGlsZUluamVjdG9yKFxuICAgICAgICAgICAgYW5ndWxhckNvcmVFbnYsIGBuZzovLyR7bW9kdWxlVHlwZS5uYW1lfS9uZ0luamVjdG9yRGVmLmpzYCwgbWV0YSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmdJbmplY3RvckRlZjtcbiAgICB9LFxuICAgIC8vIE1ha2UgdGhlIHByb3BlcnR5IGNvbmZpZ3VyYWJsZSBpbiBkZXYgbW9kZSB0byBhbGxvdyBvdmVycmlkaW5nIGluIHRlc3RzXG4gICAgY29uZmlndXJhYmxlOiAhIW5nRGV2TW9kZSxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHZlcmlmeVNlbWFudGljc09mTmdNb2R1bGVEZWYobW9kdWxlVHlwZTogTmdNb2R1bGVUeXBlKTogdm9pZCB7XG4gIGlmICh2ZXJpZmllZE5nTW9kdWxlLmdldChtb2R1bGVUeXBlKSkgcmV0dXJuO1xuICB2ZXJpZmllZE5nTW9kdWxlLnNldChtb2R1bGVUeXBlLCB0cnVlKTtcbiAgbW9kdWxlVHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKG1vZHVsZVR5cGUpO1xuICBjb25zdCBuZ01vZHVsZURlZiA9IGdldE5nTW9kdWxlRGVmKG1vZHVsZVR5cGUsIHRydWUpO1xuICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG4gIG5nTW9kdWxlRGVmLmRlY2xhcmF0aW9ucy5mb3JFYWNoKHZlcmlmeURlY2xhcmF0aW9uc0hhdmVEZWZpbml0aW9ucyk7XG4gIGNvbnN0IGNvbWJpbmVkRGVjbGFyYXRpb25zOiBUeXBlPGFueT5bXSA9IFtcbiAgICAuLi5uZ01vZHVsZURlZi5kZWNsYXJhdGlvbnMubWFwKHJlc29sdmVGb3J3YXJkUmVmKSwgIC8vXG4gICAgLi4uZmxhdHRlbihuZ01vZHVsZURlZi5pbXBvcnRzLm1hcChjb21wdXRlQ29tYmluZWRFeHBvcnRzKSwgcmVzb2x2ZUZvcndhcmRSZWYpLFxuICBdO1xuICBuZ01vZHVsZURlZi5leHBvcnRzLmZvckVhY2godmVyaWZ5RXhwb3J0c0FyZURlY2xhcmVkT3JSZUV4cG9ydGVkKTtcbiAgbmdNb2R1bGVEZWYuZGVjbGFyYXRpb25zLmZvckVhY2godmVyaWZ5RGVjbGFyYXRpb25Jc1VuaXF1ZSk7XG4gIG5nTW9kdWxlRGVmLmRlY2xhcmF0aW9ucy5mb3JFYWNoKHZlcmlmeUNvbXBvbmVudEVudHJ5Q29tcG9uZW50c0lzUGFydE9mTmdNb2R1bGUpO1xuXG4gIGNvbnN0IG5nTW9kdWxlID0gZ2V0QW5ub3RhdGlvbjxOZ01vZHVsZT4obW9kdWxlVHlwZSwgJ05nTW9kdWxlJyk7XG4gIGlmIChuZ01vZHVsZSkge1xuICAgIG5nTW9kdWxlLmltcG9ydHMgJiZcbiAgICAgICAgZmxhdHRlbihuZ01vZHVsZS5pbXBvcnRzLCB1bndyYXBNb2R1bGVXaXRoUHJvdmlkZXJzSW1wb3J0cylcbiAgICAgICAgICAgIC5mb3JFYWNoKHZlcmlmeVNlbWFudGljc09mTmdNb2R1bGVEZWYpO1xuICAgIG5nTW9kdWxlLmJvb3RzdHJhcCAmJiBuZ01vZHVsZS5ib290c3RyYXAuZm9yRWFjaCh2ZXJpZnlDb3JyZWN0Qm9vdHN0cmFwVHlwZSk7XG4gICAgbmdNb2R1bGUuYm9vdHN0cmFwICYmIG5nTW9kdWxlLmJvb3RzdHJhcC5mb3JFYWNoKHZlcmlmeUNvbXBvbmVudElzUGFydE9mTmdNb2R1bGUpO1xuICAgIG5nTW9kdWxlLmVudHJ5Q29tcG9uZW50cyAmJiBuZ01vZHVsZS5lbnRyeUNvbXBvbmVudHMuZm9yRWFjaCh2ZXJpZnlDb21wb25lbnRJc1BhcnRPZk5nTW9kdWxlKTtcbiAgfVxuXG4gIC8vIFRocm93IEVycm9yIGlmIGFueSBlcnJvcnMgd2VyZSBkZXRlY3RlZC5cbiAgaWYgKGVycm9ycy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3JzLmpvaW4oJ1xcbicpKTtcbiAgfVxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgZnVuY3Rpb24gdmVyaWZ5RGVjbGFyYXRpb25zSGF2ZURlZmluaXRpb25zKHR5cGU6IFR5cGU8YW55Pik6IHZvaWQge1xuICAgIHR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlKTtcbiAgICBjb25zdCBkZWYgPSBnZXRDb21wb25lbnREZWYodHlwZSkgfHwgZ2V0RGlyZWN0aXZlRGVmKHR5cGUpIHx8IGdldFBpcGVEZWYodHlwZSk7XG4gICAgaWYgKCFkZWYpIHtcbiAgICAgIGVycm9ycy5wdXNoKFxuICAgICAgICAgIGBVbmV4cGVjdGVkIHZhbHVlICcke3JlbmRlclN0cmluZ2lmeSh0eXBlKX0nIGRlY2xhcmVkIGJ5IHRoZSBtb2R1bGUgJyR7cmVuZGVyU3RyaW5naWZ5KG1vZHVsZVR5cGUpfScuIFBsZWFzZSBhZGQgYSBAUGlwZS9ARGlyZWN0aXZlL0BDb21wb25lbnQgYW5ub3RhdGlvbi5gKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB2ZXJpZnlFeHBvcnRzQXJlRGVjbGFyZWRPclJlRXhwb3J0ZWQodHlwZTogVHlwZTxhbnk+KSB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICAgIGNvbnN0IGtpbmQgPSBnZXRDb21wb25lbnREZWYodHlwZSkgJiYgJ2NvbXBvbmVudCcgfHwgZ2V0RGlyZWN0aXZlRGVmKHR5cGUpICYmICdkaXJlY3RpdmUnIHx8XG4gICAgICAgIGdldFBpcGVEZWYodHlwZSkgJiYgJ3BpcGUnO1xuICAgIGlmIChraW5kKSB7XG4gICAgICAvLyBvbmx5IGNoZWNrZWQgaWYgd2UgYXJlIGRlY2xhcmVkIGFzIENvbXBvbmVudCwgRGlyZWN0aXZlLCBvciBQaXBlXG4gICAgICAvLyBNb2R1bGVzIGRvbid0IG5lZWQgdG8gYmUgZGVjbGFyZWQgb3IgaW1wb3J0ZWQuXG4gICAgICBpZiAoY29tYmluZWREZWNsYXJhdGlvbnMubGFzdEluZGV4T2YodHlwZSkgPT09IC0xKSB7XG4gICAgICAgIC8vIFdlIGFyZSBleHBvcnRpbmcgc29tZXRoaW5nIHdoaWNoIHdlIGRvbid0IGV4cGxpY2l0bHkgZGVjbGFyZSBvciBpbXBvcnQuXG4gICAgICAgIGVycm9ycy5wdXNoKFxuICAgICAgICAgICAgYENhbid0IGV4cG9ydCAke2tpbmR9ICR7cmVuZGVyU3RyaW5naWZ5KHR5cGUpfSBmcm9tICR7cmVuZGVyU3RyaW5naWZ5KG1vZHVsZVR5cGUpfSBhcyBpdCB3YXMgbmVpdGhlciBkZWNsYXJlZCBub3IgaW1wb3J0ZWQhYCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdmVyaWZ5RGVjbGFyYXRpb25Jc1VuaXF1ZSh0eXBlOiBUeXBlPGFueT4pIHtcbiAgICB0eXBlID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZSk7XG4gICAgY29uc3QgZXhpc3RpbmdNb2R1bGUgPSBvd25lck5nTW9kdWxlLmdldCh0eXBlKTtcbiAgICBpZiAoZXhpc3RpbmdNb2R1bGUgJiYgZXhpc3RpbmdNb2R1bGUgIT09IG1vZHVsZVR5cGUpIHtcbiAgICAgIGNvbnN0IG1vZHVsZXMgPSBbZXhpc3RpbmdNb2R1bGUsIG1vZHVsZVR5cGVdLm1hcChyZW5kZXJTdHJpbmdpZnkpLnNvcnQoKTtcbiAgICAgIGVycm9ycy5wdXNoKFxuICAgICAgICAgIGBUeXBlICR7cmVuZGVyU3RyaW5naWZ5KHR5cGUpfSBpcyBwYXJ0IG9mIHRoZSBkZWNsYXJhdGlvbnMgb2YgMiBtb2R1bGVzOiAke21vZHVsZXNbMF19IGFuZCAke21vZHVsZXNbMV19ISBgICtcbiAgICAgICAgICBgUGxlYXNlIGNvbnNpZGVyIG1vdmluZyAke3JlbmRlclN0cmluZ2lmeSh0eXBlKX0gdG8gYSBoaWdoZXIgbW9kdWxlIHRoYXQgaW1wb3J0cyAke21vZHVsZXNbMF19IGFuZCAke21vZHVsZXNbMV19LiBgICtcbiAgICAgICAgICBgWW91IGNhbiBhbHNvIGNyZWF0ZSBhIG5ldyBOZ01vZHVsZSB0aGF0IGV4cG9ydHMgYW5kIGluY2x1ZGVzICR7cmVuZGVyU3RyaW5naWZ5KHR5cGUpfSB0aGVuIGltcG9ydCB0aGF0IE5nTW9kdWxlIGluICR7bW9kdWxlc1swXX0gYW5kICR7bW9kdWxlc1sxXX0uYCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE1hcmsgdHlwZSBhcyBoYXZpbmcgb3duZXIuXG4gICAgICBvd25lck5nTW9kdWxlLnNldCh0eXBlLCBtb2R1bGVUeXBlKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB2ZXJpZnlDb21wb25lbnRJc1BhcnRPZk5nTW9kdWxlKHR5cGU6IFR5cGU8YW55Pikge1xuICAgIHR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlKTtcbiAgICBjb25zdCBleGlzdGluZ01vZHVsZSA9IG93bmVyTmdNb2R1bGUuZ2V0KHR5cGUpO1xuICAgIGlmICghZXhpc3RpbmdNb2R1bGUpIHtcbiAgICAgIGVycm9ycy5wdXNoKFxuICAgICAgICAgIGBDb21wb25lbnQgJHtyZW5kZXJTdHJpbmdpZnkodHlwZSl9IGlzIG5vdCBwYXJ0IG9mIGFueSBOZ01vZHVsZSBvciB0aGUgbW9kdWxlIGhhcyBub3QgYmVlbiBpbXBvcnRlZCBpbnRvIHlvdXIgbW9kdWxlLmApO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHZlcmlmeUNvcnJlY3RCb290c3RyYXBUeXBlKHR5cGU6IFR5cGU8YW55Pikge1xuICAgIHR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlKTtcbiAgICBpZiAoIWdldENvbXBvbmVudERlZih0eXBlKSkge1xuICAgICAgZXJyb3JzLnB1c2goYCR7cmVuZGVyU3RyaW5naWZ5KHR5cGUpfSBjYW5ub3QgYmUgdXNlZCBhcyBhbiBlbnRyeSBjb21wb25lbnQuYCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdmVyaWZ5Q29tcG9uZW50RW50cnlDb21wb25lbnRzSXNQYXJ0T2ZOZ01vZHVsZSh0eXBlOiBUeXBlPGFueT4pIHtcbiAgICB0eXBlID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZSk7XG4gICAgaWYgKGdldENvbXBvbmVudERlZih0eXBlKSkge1xuICAgICAgLy8gV2Uga25vdyB3ZSBhcmUgY29tcG9uZW50XG4gICAgICBjb25zdCBjb21wb25lbnQgPSBnZXRBbm5vdGF0aW9uPENvbXBvbmVudD4odHlwZSwgJ0NvbXBvbmVudCcpO1xuICAgICAgaWYgKGNvbXBvbmVudCAmJiBjb21wb25lbnQuZW50cnlDb21wb25lbnRzKSB7XG4gICAgICAgIGNvbXBvbmVudC5lbnRyeUNvbXBvbmVudHMuZm9yRWFjaCh2ZXJpZnlDb21wb25lbnRJc1BhcnRPZk5nTW9kdWxlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdW53cmFwTW9kdWxlV2l0aFByb3ZpZGVyc0ltcG9ydHMoXG4gICAgdHlwZU9yV2l0aFByb3ZpZGVyczogTmdNb2R1bGVUeXBlPGFueT58IHtuZ01vZHVsZTogTmdNb2R1bGVUeXBlPGFueT59KTogTmdNb2R1bGVUeXBlPGFueT4ge1xuICB0eXBlT3JXaXRoUHJvdmlkZXJzID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZU9yV2l0aFByb3ZpZGVycyk7XG4gIHJldHVybiAodHlwZU9yV2l0aFByb3ZpZGVycyBhcyBhbnkpLm5nTW9kdWxlIHx8IHR5cGVPcldpdGhQcm92aWRlcnM7XG59XG5cbmZ1bmN0aW9uIGdldEFubm90YXRpb248VD4odHlwZTogYW55LCBuYW1lOiBzdHJpbmcpOiBUfG51bGwge1xuICBsZXQgYW5ub3RhdGlvbjogVHxudWxsID0gbnVsbDtcbiAgY29sbGVjdCh0eXBlLl9fYW5ub3RhdGlvbnNfXyk7XG4gIGNvbGxlY3QodHlwZS5kZWNvcmF0b3JzKTtcbiAgcmV0dXJuIGFubm90YXRpb247XG5cbiAgZnVuY3Rpb24gY29sbGVjdChhbm5vdGF0aW9uczogYW55W10gfCBudWxsKSB7XG4gICAgaWYgKGFubm90YXRpb25zKSB7XG4gICAgICBhbm5vdGF0aW9ucy5mb3JFYWNoKHJlYWRBbm5vdGF0aW9uKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZWFkQW5ub3RhdGlvbihcbiAgICAgIGRlY29yYXRvcjoge3R5cGU6IHtwcm90b3R5cGU6IHtuZ01ldGFkYXRhTmFtZTogc3RyaW5nfSwgYXJnczogYW55W119LCBhcmdzOiBhbnl9KTogdm9pZCB7XG4gICAgaWYgKCFhbm5vdGF0aW9uKSB7XG4gICAgICBjb25zdCBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihkZWNvcmF0b3IpO1xuICAgICAgaWYgKHByb3RvLm5nTWV0YWRhdGFOYW1lID09IG5hbWUpIHtcbiAgICAgICAgYW5ub3RhdGlvbiA9IGRlY29yYXRvciBhcyBhbnk7XG4gICAgICB9IGVsc2UgaWYgKGRlY29yYXRvci50eXBlKSB7XG4gICAgICAgIGNvbnN0IHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGRlY29yYXRvci50eXBlKTtcbiAgICAgICAgaWYgKHByb3RvLm5nTWV0YWRhdGFOYW1lID09IG5hbWUpIHtcbiAgICAgICAgICBhbm5vdGF0aW9uID0gZGVjb3JhdG9yLmFyZ3NbMF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBLZWVwIHRyYWNrIG9mIGNvbXBpbGVkIGNvbXBvbmVudHMuIFRoaXMgaXMgbmVlZGVkIGJlY2F1c2UgaW4gdGVzdHMgd2Ugb2Z0ZW4gd2FudCB0byBjb21waWxlIHRoZVxuICogc2FtZSBjb21wb25lbnQgd2l0aCBtb3JlIHRoYW4gb25lIE5nTW9kdWxlLiBUaGlzIHdvdWxkIGNhdXNlIGFuIGVycm9yIHVubGVzcyB3ZSByZXNldCB3aGljaFxuICogTmdNb2R1bGUgdGhlIGNvbXBvbmVudCBiZWxvbmdzIHRvLiBXZSBrZWVwIHRoZSBsaXN0IG9mIGNvbXBpbGVkIGNvbXBvbmVudHMgaGVyZSBzbyB0aGF0IHRoZVxuICogVGVzdEJlZCBjYW4gcmVzZXQgaXQgbGF0ZXIuXG4gKi9cbmxldCBvd25lck5nTW9kdWxlID0gbmV3IE1hcDxUeXBlPGFueT4sIE5nTW9kdWxlVHlwZTxhbnk+PigpO1xubGV0IHZlcmlmaWVkTmdNb2R1bGUgPSBuZXcgTWFwPE5nTW9kdWxlVHlwZTxhbnk+LCBib29sZWFuPigpO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRDb21waWxlZENvbXBvbmVudHMoKTogdm9pZCB7XG4gIG93bmVyTmdNb2R1bGUgPSBuZXcgTWFwPFR5cGU8YW55PiwgTmdNb2R1bGVUeXBlPGFueT4+KCk7XG4gIHZlcmlmaWVkTmdNb2R1bGUgPSBuZXcgTWFwPE5nTW9kdWxlVHlwZTxhbnk+LCBib29sZWFuPigpO1xuICBtb2R1bGVRdWV1ZS5sZW5ndGggPSAwO1xufVxuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBjb21iaW5lZCBkZWNsYXJhdGlvbnMgb2YgZXhwbGljaXQgZGVjbGFyYXRpb25zLCBhcyB3ZWxsIGFzIGRlY2xhcmF0aW9ucyBpbmhlcml0ZWRcbiAqIGJ5XG4gKiB0cmF2ZXJzaW5nIHRoZSBleHBvcnRzIG9mIGltcG9ydGVkIG1vZHVsZXMuXG4gKiBAcGFyYW0gdHlwZVxuICovXG5mdW5jdGlvbiBjb21wdXRlQ29tYmluZWRFeHBvcnRzKHR5cGU6IFR5cGU8YW55Pik6IFR5cGU8YW55PltdIHtcbiAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICBjb25zdCBuZ01vZHVsZURlZiA9IGdldE5nTW9kdWxlRGVmKHR5cGUsIHRydWUpO1xuICByZXR1cm4gWy4uLmZsYXR0ZW4obmdNb2R1bGVEZWYuZXhwb3J0cy5tYXAoKHR5cGUpID0+IHtcbiAgICBjb25zdCBuZ01vZHVsZURlZiA9IGdldE5nTW9kdWxlRGVmKHR5cGUpO1xuICAgIGlmIChuZ01vZHVsZURlZikge1xuICAgICAgdmVyaWZ5U2VtYW50aWNzT2ZOZ01vZHVsZURlZih0eXBlIGFzIGFueSBhcyBOZ01vZHVsZVR5cGUpO1xuICAgICAgcmV0dXJuIGNvbXB1dGVDb21iaW5lZEV4cG9ydHModHlwZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0eXBlO1xuICAgIH1cbiAgfSkpXTtcbn1cblxuLyoqXG4gKiBTb21lIGRlY2xhcmVkIGNvbXBvbmVudHMgbWF5IGJlIGNvbXBpbGVkIGFzeW5jaHJvbm91c2x5LCBhbmQgdGh1cyBtYXkgbm90IGhhdmUgdGhlaXJcbiAqIG5nQ29tcG9uZW50RGVmIHNldCB5ZXQuIElmIHRoaXMgaXMgdGhlIGNhc2UsIHRoZW4gYSByZWZlcmVuY2UgdG8gdGhlIG1vZHVsZSBpcyB3cml0dGVuIGludG9cbiAqIHRoZSBgbmdTZWxlY3RvclNjb3BlYCBwcm9wZXJ0eSBvZiB0aGUgZGVjbGFyZWQgdHlwZS5cbiAqL1xuZnVuY3Rpb24gc2V0U2NvcGVPbkRlY2xhcmVkQ29tcG9uZW50cyhtb2R1bGVUeXBlOiBUeXBlPGFueT4sIG5nTW9kdWxlOiBOZ01vZHVsZSkge1xuICBjb25zdCBkZWNsYXJhdGlvbnM6IFR5cGU8YW55PltdID0gZmxhdHRlbihuZ01vZHVsZS5kZWNsYXJhdGlvbnMgfHwgRU1QVFlfQVJSQVkpO1xuXG4gIGNvbnN0IHRyYW5zaXRpdmVTY29wZXMgPSB0cmFuc2l0aXZlU2NvcGVzRm9yKG1vZHVsZVR5cGUpO1xuXG4gIGRlY2xhcmF0aW9ucy5mb3JFYWNoKGRlY2xhcmF0aW9uID0+IHtcbiAgICBpZiAoZGVjbGFyYXRpb24uaGFzT3duUHJvcGVydHkoTkdfQ09NUE9ORU5UX0RFRikpIHtcbiAgICAgIC8vIEFuIGBuZ0NvbXBvbmVudERlZmAgZmllbGQgZXhpc3RzIC0gZ28gYWhlYWQgYW5kIHBhdGNoIHRoZSBjb21wb25lbnQgZGlyZWN0bHkuXG4gICAgICBjb25zdCBjb21wb25lbnQgPSBkZWNsYXJhdGlvbiBhcyBUeXBlPGFueT4mIHtuZ0NvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPGFueT59O1xuICAgICAgY29uc3QgY29tcG9uZW50RGVmID0gZ2V0Q29tcG9uZW50RGVmKGNvbXBvbmVudCkgITtcbiAgICAgIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlKGNvbXBvbmVudERlZiwgdHJhbnNpdGl2ZVNjb3Blcyk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICAgIWRlY2xhcmF0aW9uLmhhc093blByb3BlcnR5KE5HX0RJUkVDVElWRV9ERUYpICYmICFkZWNsYXJhdGlvbi5oYXNPd25Qcm9wZXJ0eShOR19QSVBFX0RFRikpIHtcbiAgICAgIC8vIFNldCBgbmdTZWxlY3RvclNjb3BlYCBmb3IgZnV0dXJlIHJlZmVyZW5jZSB3aGVuIHRoZSBjb21wb25lbnQgY29tcGlsYXRpb24gZmluaXNoZXMuXG4gICAgICAoZGVjbGFyYXRpb24gYXMgVHlwZTxhbnk+JiB7bmdTZWxlY3RvclNjb3BlPzogYW55fSkubmdTZWxlY3RvclNjb3BlID0gbW9kdWxlVHlwZTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKipcbiAqIFBhdGNoIHRoZSBkZWZpbml0aW9uIG9mIGEgY29tcG9uZW50IHdpdGggZGlyZWN0aXZlcyBhbmQgcGlwZXMgZnJvbSB0aGUgY29tcGlsYXRpb24gc2NvcGUgb2ZcbiAqIGEgZ2l2ZW4gbW9kdWxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGU8Qz4oXG4gICAgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8Qz4sIHRyYW5zaXRpdmVTY29wZXM6IE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3Blcykge1xuICBjb21wb25lbnREZWYuZGlyZWN0aXZlRGVmcyA9ICgpID0+XG4gICAgICBBcnJheS5mcm9tKHRyYW5zaXRpdmVTY29wZXMuY29tcGlsYXRpb24uZGlyZWN0aXZlcylcbiAgICAgICAgICAubWFwKFxuICAgICAgICAgICAgICBkaXIgPT4gZGlyLmhhc093blByb3BlcnR5KE5HX0NPTVBPTkVOVF9ERUYpID8gZ2V0Q29tcG9uZW50RGVmKGRpcikgISA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXREaXJlY3RpdmVEZWYoZGlyKSAhKVxuICAgICAgICAgIC5maWx0ZXIoZGVmID0+ICEhZGVmKTtcbiAgY29tcG9uZW50RGVmLnBpcGVEZWZzID0gKCkgPT5cbiAgICAgIEFycmF5LmZyb20odHJhbnNpdGl2ZVNjb3Blcy5jb21waWxhdGlvbi5waXBlcykubWFwKHBpcGUgPT4gZ2V0UGlwZURlZihwaXBlKSAhKTtcbiAgY29tcG9uZW50RGVmLnNjaGVtYXMgPSB0cmFuc2l0aXZlU2NvcGVzLnNjaGVtYXM7XG59XG5cbi8qKlxuICogQ29tcHV0ZSB0aGUgcGFpciBvZiB0cmFuc2l0aXZlIHNjb3BlcyAoY29tcGlsYXRpb24gc2NvcGUgYW5kIGV4cG9ydGVkIHNjb3BlKSBmb3IgYSBnaXZlbiBtb2R1bGUuXG4gKlxuICogVGhpcyBvcGVyYXRpb24gaXMgbWVtb2l6ZWQgYW5kIHRoZSByZXN1bHQgaXMgY2FjaGVkIG9uIHRoZSBtb2R1bGUncyBkZWZpbml0aW9uLiBJdCBjYW4gYmUgY2FsbGVkXG4gKiBvbiBtb2R1bGVzIHdpdGggY29tcG9uZW50cyB0aGF0IGhhdmUgbm90IGZ1bGx5IGNvbXBpbGVkIHlldCwgYnV0IHRoZSByZXN1bHQgc2hvdWxkIG5vdCBiZSB1c2VkXG4gKiB1bnRpbCB0aGV5IGhhdmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2l0aXZlU2NvcGVzRm9yPFQ+KFxuICAgIG1vZHVsZVR5cGU6IFR5cGU8VD4sXG4gICAgcHJvY2Vzc05nTW9kdWxlRm4/OiAobmdNb2R1bGU6IE5nTW9kdWxlVHlwZSkgPT4gdm9pZCk6IE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3BlcyB7XG4gIGlmICghaXNOZ01vZHVsZShtb2R1bGVUeXBlKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHttb2R1bGVUeXBlLm5hbWV9IGRvZXMgbm90IGhhdmUgYW4gbmdNb2R1bGVEZWZgKTtcbiAgfVxuICBjb25zdCBkZWYgPSBnZXROZ01vZHVsZURlZihtb2R1bGVUeXBlKSAhO1xuXG4gIGlmIChkZWYudHJhbnNpdGl2ZUNvbXBpbGVTY29wZXMgIT09IG51bGwpIHtcbiAgICByZXR1cm4gZGVmLnRyYW5zaXRpdmVDb21waWxlU2NvcGVzO1xuICB9XG5cbiAgY29uc3Qgc2NvcGVzOiBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMgPSB7XG4gICAgc2NoZW1hczogZGVmLnNjaGVtYXMgfHwgbnVsbCxcbiAgICBjb21waWxhdGlvbjoge1xuICAgICAgZGlyZWN0aXZlczogbmV3IFNldDxhbnk+KCksXG4gICAgICBwaXBlczogbmV3IFNldDxhbnk+KCksXG4gICAgfSxcbiAgICBleHBvcnRlZDoge1xuICAgICAgZGlyZWN0aXZlczogbmV3IFNldDxhbnk+KCksXG4gICAgICBwaXBlczogbmV3IFNldDxhbnk+KCksXG4gICAgfSxcbiAgfTtcblxuICBkZWYuZGVjbGFyYXRpb25zLmZvckVhY2goZGVjbGFyZWQgPT4ge1xuICAgIGNvbnN0IGRlY2xhcmVkV2l0aERlZnMgPSBkZWNsYXJlZCBhcyBUeXBlPGFueT4mIHsgbmdQaXBlRGVmPzogYW55OyB9O1xuXG4gICAgaWYgKGdldFBpcGVEZWYoZGVjbGFyZWRXaXRoRGVmcykpIHtcbiAgICAgIHNjb3Blcy5jb21waWxhdGlvbi5waXBlcy5hZGQoZGVjbGFyZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBFaXRoZXIgZGVjbGFyZWQgaGFzIGFuIG5nQ29tcG9uZW50RGVmIG9yIG5nRGlyZWN0aXZlRGVmLCBvciBpdCdzIGEgY29tcG9uZW50IHdoaWNoIGhhc24ndFxuICAgICAgLy8gaGFkIGl0cyB0ZW1wbGF0ZSBjb21waWxlZCB5ZXQuIEluIGVpdGhlciBjYXNlLCBpdCBnZXRzIGFkZGVkIHRvIHRoZSBjb21waWxhdGlvbidzXG4gICAgICAvLyBkaXJlY3RpdmVzLlxuICAgICAgc2NvcGVzLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMuYWRkKGRlY2xhcmVkKTtcbiAgICB9XG4gIH0pO1xuXG4gIGRlZi5pbXBvcnRzLmZvckVhY2goPEk+KGltcG9ydGVkOiBUeXBlPEk+KSA9PiB7XG4gICAgY29uc3QgaW1wb3J0ZWRUeXBlID0gaW1wb3J0ZWQgYXMgVHlwZTxJPiYge1xuICAgICAgLy8gSWYgaW1wb3J0ZWQgaXMgYW4gQE5nTW9kdWxlOlxuICAgICAgbmdNb2R1bGVEZWY/OiBOZ01vZHVsZURlZjxJPjtcbiAgICB9O1xuXG4gICAgaWYgKCFpc05nTW9kdWxlPEk+KGltcG9ydGVkVHlwZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW1wb3J0aW5nICR7aW1wb3J0ZWRUeXBlLm5hbWV9IHdoaWNoIGRvZXMgbm90IGhhdmUgYW4gbmdNb2R1bGVEZWZgKTtcbiAgICB9XG5cbiAgICBpZiAocHJvY2Vzc05nTW9kdWxlRm4pIHtcbiAgICAgIHByb2Nlc3NOZ01vZHVsZUZuKGltcG9ydGVkVHlwZSBhcyBOZ01vZHVsZVR5cGUpO1xuICAgIH1cblxuICAgIC8vIFdoZW4gdGhpcyBtb2R1bGUgaW1wb3J0cyBhbm90aGVyLCB0aGUgaW1wb3J0ZWQgbW9kdWxlJ3MgZXhwb3J0ZWQgZGlyZWN0aXZlcyBhbmQgcGlwZXMgYXJlXG4gICAgLy8gYWRkZWQgdG8gdGhlIGNvbXBpbGF0aW9uIHNjb3BlIG9mIHRoaXMgbW9kdWxlLlxuICAgIGNvbnN0IGltcG9ydGVkU2NvcGUgPSB0cmFuc2l0aXZlU2NvcGVzRm9yKGltcG9ydGVkVHlwZSwgcHJvY2Vzc05nTW9kdWxlRm4pO1xuICAgIGltcG9ydGVkU2NvcGUuZXhwb3J0ZWQuZGlyZWN0aXZlcy5mb3JFYWNoKGVudHJ5ID0+IHNjb3Blcy5jb21waWxhdGlvbi5kaXJlY3RpdmVzLmFkZChlbnRyeSkpO1xuICAgIGltcG9ydGVkU2NvcGUuZXhwb3J0ZWQucGlwZXMuZm9yRWFjaChlbnRyeSA9PiBzY29wZXMuY29tcGlsYXRpb24ucGlwZXMuYWRkKGVudHJ5KSk7XG4gIH0pO1xuXG4gIGRlZi5leHBvcnRzLmZvckVhY2goPEU+KGV4cG9ydGVkOiBUeXBlPEU+KSA9PiB7XG4gICAgY29uc3QgZXhwb3J0ZWRUeXBlID0gZXhwb3J0ZWQgYXMgVHlwZTxFPiYge1xuICAgICAgLy8gQ29tcG9uZW50cywgRGlyZWN0aXZlcywgTmdNb2R1bGVzLCBhbmQgUGlwZXMgY2FuIGFsbCBiZSBleHBvcnRlZC5cbiAgICAgIG5nQ29tcG9uZW50RGVmPzogYW55O1xuICAgICAgbmdEaXJlY3RpdmVEZWY/OiBhbnk7XG4gICAgICBuZ01vZHVsZURlZj86IE5nTW9kdWxlRGVmPEU+O1xuICAgICAgbmdQaXBlRGVmPzogYW55O1xuICAgIH07XG5cbiAgICAvLyBFaXRoZXIgdGhlIHR5cGUgaXMgYSBtb2R1bGUsIGEgcGlwZSwgb3IgYSBjb21wb25lbnQvZGlyZWN0aXZlICh3aGljaCBtYXkgbm90IGhhdmUgYW5cbiAgICAvLyBuZ0NvbXBvbmVudERlZiBhcyBpdCBtaWdodCBiZSBjb21waWxlZCBhc3luY2hyb25vdXNseSkuXG4gICAgaWYgKGlzTmdNb2R1bGUoZXhwb3J0ZWRUeXBlKSkge1xuICAgICAgLy8gV2hlbiB0aGlzIG1vZHVsZSBleHBvcnRzIGFub3RoZXIsIHRoZSBleHBvcnRlZCBtb2R1bGUncyBleHBvcnRlZCBkaXJlY3RpdmVzIGFuZCBwaXBlcyBhcmVcbiAgICAgIC8vIGFkZGVkIHRvIGJvdGggdGhlIGNvbXBpbGF0aW9uIGFuZCBleHBvcnRlZCBzY29wZXMgb2YgdGhpcyBtb2R1bGUuXG4gICAgICBjb25zdCBleHBvcnRlZFNjb3BlID0gdHJhbnNpdGl2ZVNjb3Blc0ZvcihleHBvcnRlZFR5cGUsIHByb2Nlc3NOZ01vZHVsZUZuKTtcbiAgICAgIGV4cG9ydGVkU2NvcGUuZXhwb3J0ZWQuZGlyZWN0aXZlcy5mb3JFYWNoKGVudHJ5ID0+IHtcbiAgICAgICAgc2NvcGVzLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMuYWRkKGVudHJ5KTtcbiAgICAgICAgc2NvcGVzLmV4cG9ydGVkLmRpcmVjdGl2ZXMuYWRkKGVudHJ5KTtcbiAgICAgIH0pO1xuICAgICAgZXhwb3J0ZWRTY29wZS5leHBvcnRlZC5waXBlcy5mb3JFYWNoKGVudHJ5ID0+IHtcbiAgICAgICAgc2NvcGVzLmNvbXBpbGF0aW9uLnBpcGVzLmFkZChlbnRyeSk7XG4gICAgICAgIHNjb3Blcy5leHBvcnRlZC5waXBlcy5hZGQoZW50cnkpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChnZXRQaXBlRGVmKGV4cG9ydGVkVHlwZSkpIHtcbiAgICAgIHNjb3Blcy5leHBvcnRlZC5waXBlcy5hZGQoZXhwb3J0ZWRUeXBlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2NvcGVzLmV4cG9ydGVkLmRpcmVjdGl2ZXMuYWRkKGV4cG9ydGVkVHlwZSk7XG4gICAgfVxuICB9KTtcblxuICBkZWYudHJhbnNpdGl2ZUNvbXBpbGVTY29wZXMgPSBzY29wZXM7XG4gIHJldHVybiBzY29wZXM7XG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW48VD4odmFsdWVzOiBhbnlbXSwgbWFwRm4/OiAodmFsdWU6IFQpID0+IGFueSk6IFR5cGU8VD5bXSB7XG4gIGNvbnN0IG91dDogVHlwZTxUPltdID0gW107XG4gIHZhbHVlcy5mb3JFYWNoKHZhbHVlID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIG91dC5wdXNoKC4uLmZsYXR0ZW48VD4odmFsdWUsIG1hcEZuKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dC5wdXNoKG1hcEZuID8gbWFwRm4odmFsdWUpIDogdmFsdWUpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIGV4cGFuZE1vZHVsZVdpdGhQcm92aWRlcnModmFsdWU6IFR5cGU8YW55PnwgTW9kdWxlV2l0aFByb3ZpZGVyczx7fT4pOiBUeXBlPGFueT4ge1xuICBpZiAoaXNNb2R1bGVXaXRoUHJvdmlkZXJzKHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS5uZ01vZHVsZTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGlzTW9kdWxlV2l0aFByb3ZpZGVycyh2YWx1ZTogYW55KTogdmFsdWUgaXMgTW9kdWxlV2l0aFByb3ZpZGVyczx7fT4ge1xuICByZXR1cm4gKHZhbHVlIGFze25nTW9kdWxlPzogYW55fSkubmdNb2R1bGUgIT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaXNOZ01vZHVsZTxUPih2YWx1ZTogVHlwZTxUPik6IHZhbHVlIGlzIFR5cGU8VD4me25nTW9kdWxlRGVmOiBOZ01vZHVsZURlZjxUPn0ge1xuICByZXR1cm4gISFnZXROZ01vZHVsZURlZih2YWx1ZSk7XG59XG4iXX0=