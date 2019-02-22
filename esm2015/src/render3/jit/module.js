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
import { renderStringify } from '../util/misc_utils';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvbW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUEyQixpQkFBaUIsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQzNGLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3ZELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUN4RCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUV0RCxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSx1Q0FBdUMsQ0FBQztBQUczRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLGVBQWUsRUFBRSxlQUFlLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMzRixPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUd6RixPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFbkQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7TUFFdkMsV0FBVyxHQUFnQixFQUFFOzs7O0FBRW5DLDhCQUdDOzs7SUFGQyxxQ0FBc0I7O0lBQ3RCLG1DQUFtQjs7O01BR2YsV0FBVyxHQUFzQixFQUFFOzs7Ozs7OztBQU16QyxTQUFTLDhCQUE4QixDQUFDLFVBQXFCLEVBQUUsUUFBa0I7SUFDL0UsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUMsQ0FBQyxDQUFDO0FBQzNDLENBQUM7O0lBRUcsbUJBQW1CLEdBQUcsS0FBSzs7Ozs7OztBQU0vQixN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QUMsQ0FBQztJQUVILEdBQUcsQ0FBQyx1QkFBdUIsR0FBRyxNQUFNLENBQUM7SUFDckMsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQzs7Ozs7OztBQUVELFNBQVMsT0FBTyxDQUFJLE1BQWEsRUFBRSxLQUF5Qjs7VUFDcEQsR0FBRyxHQUFjLEVBQUU7SUFDekIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUNyQixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDeEIsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBSSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUN2QzthQUFNO1lBQ0wsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDeEM7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUNILE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQzs7Ozs7QUFFRCxTQUFTLHlCQUF5QixDQUFDLEtBQXlDO0lBQzFFLElBQUkscUJBQXFCLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDaEMsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDO0tBQ3ZCO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDOzs7OztBQUVELFNBQVMscUJBQXFCLENBQUMsS0FBVTtJQUN2QyxPQUFPLENBQUMsbUJBQUEsS0FBSyxFQUFtQixDQUFDLENBQUMsUUFBUSxLQUFLLFNBQVMsQ0FBQztBQUMzRCxDQUFDOzs7Ozs7QUFFRCxTQUFTLFVBQVUsQ0FBSSxLQUFjO0lBQ25DLE9BQU8sQ0FBQyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1IzSW5qZWN0b3JNZXRhZGF0YUZhY2FkZSwgZ2V0Q29tcGlsZXJGYWNhZGV9IGZyb20gJy4uLy4uL2NvbXBpbGVyL2NvbXBpbGVyX2ZhY2FkZSc7XG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuLi8uLi9kaS9mb3J3YXJkX3JlZic7XG5pbXBvcnQge05HX0lOSkVDVE9SX0RFRn0gZnJvbSAnLi4vLi4vZGkvaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtyZWZsZWN0RGVwZW5kZW5jaWVzfSBmcm9tICcuLi8uLi9kaS9qaXQvdXRpbCc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7cmVnaXN0ZXJOZ01vZHVsZVR5cGV9IGZyb20gJy4uLy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeV9sb2FkZXInO1xuaW1wb3J0IHtDb21wb25lbnR9IGZyb20gJy4uLy4uL21ldGFkYXRhJztcbmltcG9ydCB7TW9kdWxlV2l0aFByb3ZpZGVycywgTmdNb2R1bGUsIE5nTW9kdWxlRGVmLCBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXN9IGZyb20gJy4uLy4uL21ldGFkYXRhL25nX21vZHVsZSc7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmLCBnZXREaXJlY3RpdmVEZWYsIGdldE5nTW9kdWxlRGVmLCBnZXRQaXBlRGVmfSBmcm9tICcuLi9kZWZpbml0aW9uJztcbmltcG9ydCB7TkdfQ09NUE9ORU5UX0RFRiwgTkdfRElSRUNUSVZFX0RFRiwgTkdfTU9EVUxFX0RFRiwgTkdfUElQRV9ERUZ9IGZyb20gJy4uL2ZpZWxkcyc7XG5pbXBvcnQge0NvbXBvbmVudERlZn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7TmdNb2R1bGVUeXBlfSBmcm9tICcuLi9uZ19tb2R1bGVfcmVmJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuXG5pbXBvcnQge2FuZ3VsYXJDb3JlRW52fSBmcm9tICcuL2Vudmlyb25tZW50JztcblxuY29uc3QgRU1QVFlfQVJSQVk6IFR5cGU8YW55PltdID0gW107XG5cbmludGVyZmFjZSBNb2R1bGVRdWV1ZUl0ZW0ge1xuICBtb2R1bGVUeXBlOiBUeXBlPGFueT47XG4gIG5nTW9kdWxlOiBOZ01vZHVsZTtcbn1cblxuY29uc3QgbW9kdWxlUXVldWU6IE1vZHVsZVF1ZXVlSXRlbVtdID0gW107XG5cbi8qKlxuICogRW5xdWV1ZXMgbW9kdWxlRGVmIHRvIGJlIGNoZWNrZWQgbGF0ZXIgdG8gc2VlIGlmIHNjb3BlIGNhbiBiZSBzZXQgb24gaXRzXG4gKiBjb21wb25lbnQgZGVjbGFyYXRpb25zLlxuICovXG5mdW5jdGlvbiBlbnF1ZXVlTW9kdWxlRm9yRGVsYXllZFNjb3BpbmcobW9kdWxlVHlwZTogVHlwZTxhbnk+LCBuZ01vZHVsZTogTmdNb2R1bGUpIHtcbiAgbW9kdWxlUXVldWUucHVzaCh7bW9kdWxlVHlwZSwgbmdNb2R1bGV9KTtcbn1cblxubGV0IGZsdXNoaW5nTW9kdWxlUXVldWUgPSBmYWxzZTtcbi8qKlxuICogTG9vcHMgb3ZlciBxdWV1ZWQgbW9kdWxlIGRlZmluaXRpb25zLCBpZiBhIGdpdmVuIG1vZHVsZSBkZWZpbml0aW9uIGhhcyBhbGwgb2YgaXRzXG4gKiBkZWNsYXJhdGlvbnMgcmVzb2x2ZWQsIGl0IGRlcXVldWVzIHRoYXQgbW9kdWxlIGRlZmluaXRpb24gYW5kIHNldHMgdGhlIHNjb3BlIG9uXG4gKiBpdHMgZGVjbGFyYXRpb25zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmx1c2hNb2R1bGVTY29waW5nUXVldWVBc011Y2hBc1Bvc3NpYmxlKCkge1xuICBpZiAoIWZsdXNoaW5nTW9kdWxlUXVldWUpIHtcbiAgICBmbHVzaGluZ01vZHVsZVF1ZXVlID0gdHJ1ZTtcbiAgICB0cnkge1xuICAgICAgZm9yIChsZXQgaSA9IG1vZHVsZVF1ZXVlLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIGNvbnN0IHttb2R1bGVUeXBlLCBuZ01vZHVsZX0gPSBtb2R1bGVRdWV1ZVtpXTtcblxuICAgICAgICBpZiAobmdNb2R1bGUuZGVjbGFyYXRpb25zICYmIG5nTW9kdWxlLmRlY2xhcmF0aW9ucy5ldmVyeShpc1Jlc29sdmVkRGVjbGFyYXRpb24pKSB7XG4gICAgICAgICAgLy8gZGVxdWV1ZVxuICAgICAgICAgIG1vZHVsZVF1ZXVlLnNwbGljZShpLCAxKTtcbiAgICAgICAgICBzZXRTY29wZU9uRGVjbGFyZWRDb21wb25lbnRzKG1vZHVsZVR5cGUsIG5nTW9kdWxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICBmbHVzaGluZ01vZHVsZVF1ZXVlID0gZmFsc2U7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0cnV0aHkgaWYgYSBkZWNsYXJhdGlvbiBoYXMgcmVzb2x2ZWQuIElmIHRoZSBkZWNsYXJhdGlvbiBoYXBwZW5zIHRvIGJlXG4gKiBhbiBhcnJheSBvZiBkZWNsYXJhdGlvbnMsIGl0IHdpbGwgcmVjdXJzZSB0byBjaGVjayBlYWNoIGRlY2xhcmF0aW9uIGluIHRoYXQgYXJyYXlcbiAqICh3aGljaCBtYXkgYWxzbyBiZSBhcnJheXMpLlxuICovXG5mdW5jdGlvbiBpc1Jlc29sdmVkRGVjbGFyYXRpb24oZGVjbGFyYXRpb246IGFueVtdIHwgVHlwZTxhbnk+KTogYm9vbGVhbiB7XG4gIGlmIChBcnJheS5pc0FycmF5KGRlY2xhcmF0aW9uKSkge1xuICAgIHJldHVybiBkZWNsYXJhdGlvbi5ldmVyeShpc1Jlc29sdmVkRGVjbGFyYXRpb24pO1xuICB9XG4gIHJldHVybiAhIXJlc29sdmVGb3J3YXJkUmVmKGRlY2xhcmF0aW9uKTtcbn1cblxuLyoqXG4gKiBDb21waWxlcyBhIG1vZHVsZSBpbiBKSVQgbW9kZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGF1dG9tYXRpY2FsbHkgZ2V0cyBjYWxsZWQgd2hlbiBhIGNsYXNzIGhhcyBhIGBATmdNb2R1bGVgIGRlY29yYXRvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVOZ01vZHVsZShtb2R1bGVUeXBlOiBUeXBlPGFueT4sIG5nTW9kdWxlOiBOZ01vZHVsZSA9IHt9KTogdm9pZCB7XG4gIGNvbXBpbGVOZ01vZHVsZURlZnMobW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGUsIG5nTW9kdWxlKTtcblxuICAvLyBCZWNhdXNlIHdlIGRvbid0IGtub3cgaWYgYWxsIGRlY2xhcmF0aW9ucyBoYXZlIHJlc29sdmVkIHlldCBhdCB0aGUgbW9tZW50IHRoZVxuICAvLyBOZ01vZHVsZSBkZWNvcmF0b3IgaXMgZXhlY3V0aW5nLCB3ZSdyZSBlbnF1ZXVlaW5nIHRoZSBzZXR0aW5nIG9mIG1vZHVsZSBzY29wZVxuICAvLyBvbiBpdHMgZGVjbGFyYXRpb25zIHRvIGJlIHJ1biBhdCBhIGxhdGVyIHRpbWUgd2hlbiBhbGwgZGVjbGFyYXRpb25zIGZvciB0aGUgbW9kdWxlLFxuICAvLyBpbmNsdWRpbmcgZm9yd2FyZCByZWZzLCBoYXZlIHJlc29sdmVkLlxuICBlbnF1ZXVlTW9kdWxlRm9yRGVsYXllZFNjb3BpbmcobW9kdWxlVHlwZSwgbmdNb2R1bGUpO1xufVxuXG4vKipcbiAqIENvbXBpbGVzIGFuZCBhZGRzIHRoZSBgbmdNb2R1bGVEZWZgIGFuZCBgbmdJbmplY3RvckRlZmAgcHJvcGVydGllcyB0byB0aGUgbW9kdWxlIGNsYXNzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZU5nTW9kdWxlRGVmcyhtb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGUsIG5nTW9kdWxlOiBOZ01vZHVsZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChtb2R1bGVUeXBlLCAnUmVxdWlyZWQgdmFsdWUgbW9kdWxlVHlwZScpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChuZ01vZHVsZSwgJ1JlcXVpcmVkIHZhbHVlIG5nTW9kdWxlJyk7XG4gIGNvbnN0IGRlY2xhcmF0aW9uczogVHlwZTxhbnk+W10gPSBmbGF0dGVuKG5nTW9kdWxlLmRlY2xhcmF0aW9ucyB8fCBFTVBUWV9BUlJBWSk7XG5cbiAgbGV0IG5nTW9kdWxlRGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkobW9kdWxlVHlwZSwgTkdfTU9EVUxFX0RFRiwge1xuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChuZ01vZHVsZURlZiA9PT0gbnVsbCkge1xuICAgICAgICBuZ01vZHVsZURlZiA9IGdldENvbXBpbGVyRmFjYWRlKCkuY29tcGlsZU5nTW9kdWxlKFxuICAgICAgICAgICAgYW5ndWxhckNvcmVFbnYsIGBuZzovLyR7bW9kdWxlVHlwZS5uYW1lfS9uZ01vZHVsZURlZi5qc2AsIHtcbiAgICAgICAgICAgICAgdHlwZTogbW9kdWxlVHlwZSxcbiAgICAgICAgICAgICAgYm9vdHN0cmFwOiBmbGF0dGVuKG5nTW9kdWxlLmJvb3RzdHJhcCB8fCBFTVBUWV9BUlJBWSwgcmVzb2x2ZUZvcndhcmRSZWYpLFxuICAgICAgICAgICAgICBkZWNsYXJhdGlvbnM6IGRlY2xhcmF0aW9ucy5tYXAocmVzb2x2ZUZvcndhcmRSZWYpLFxuICAgICAgICAgICAgICBpbXBvcnRzOiBmbGF0dGVuKG5nTW9kdWxlLmltcG9ydHMgfHwgRU1QVFlfQVJSQVksIHJlc29sdmVGb3J3YXJkUmVmKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChleHBhbmRNb2R1bGVXaXRoUHJvdmlkZXJzKSxcbiAgICAgICAgICAgICAgZXhwb3J0czogZmxhdHRlbihuZ01vZHVsZS5leHBvcnRzIHx8IEVNUFRZX0FSUkFZLCByZXNvbHZlRm9yd2FyZFJlZilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoZXhwYW5kTW9kdWxlV2l0aFByb3ZpZGVycyksXG4gICAgICAgICAgICAgIGVtaXRJbmxpbmU6IHRydWUsXG4gICAgICAgICAgICAgIHNjaGVtYXM6IG5nTW9kdWxlLnNjaGVtYXMgPyBmbGF0dGVuKG5nTW9kdWxlLnNjaGVtYXMpIDogbnVsbCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5nTW9kdWxlRGVmO1xuICAgIH1cbiAgfSk7XG4gIGlmIChuZ01vZHVsZS5pZCkge1xuICAgIHJlZ2lzdGVyTmdNb2R1bGVUeXBlKG5nTW9kdWxlLmlkLCBtb2R1bGVUeXBlKTtcbiAgfVxuXG4gIGxldCBuZ0luamVjdG9yRGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkobW9kdWxlVHlwZSwgTkdfSU5KRUNUT1JfREVGLCB7XG4gICAgZ2V0OiAoKSA9PiB7XG4gICAgICBpZiAobmdJbmplY3RvckRlZiA9PT0gbnVsbCkge1xuICAgICAgICBuZ0Rldk1vZGUgJiYgdmVyaWZ5U2VtYW50aWNzT2ZOZ01vZHVsZURlZihtb2R1bGVUeXBlIGFzIGFueSBhcyBOZ01vZHVsZVR5cGUpO1xuICAgICAgICBjb25zdCBtZXRhOiBSM0luamVjdG9yTWV0YWRhdGFGYWNhZGUgPSB7XG4gICAgICAgICAgbmFtZTogbW9kdWxlVHlwZS5uYW1lLFxuICAgICAgICAgIHR5cGU6IG1vZHVsZVR5cGUsXG4gICAgICAgICAgZGVwczogcmVmbGVjdERlcGVuZGVuY2llcyhtb2R1bGVUeXBlKSxcbiAgICAgICAgICBwcm92aWRlcnM6IG5nTW9kdWxlLnByb3ZpZGVycyB8fCBFTVBUWV9BUlJBWSxcbiAgICAgICAgICBpbXBvcnRzOiBbXG4gICAgICAgICAgICAobmdNb2R1bGUuaW1wb3J0cyB8fCBFTVBUWV9BUlJBWSkubWFwKHJlc29sdmVGb3J3YXJkUmVmKSxcbiAgICAgICAgICAgIChuZ01vZHVsZS5leHBvcnRzIHx8IEVNUFRZX0FSUkFZKS5tYXAocmVzb2x2ZUZvcndhcmRSZWYpLFxuICAgICAgICAgIF0sXG4gICAgICAgIH07XG4gICAgICAgIG5nSW5qZWN0b3JEZWYgPSBnZXRDb21waWxlckZhY2FkZSgpLmNvbXBpbGVJbmplY3RvcihcbiAgICAgICAgICAgIGFuZ3VsYXJDb3JlRW52LCBgbmc6Ly8ke21vZHVsZVR5cGUubmFtZX0vbmdJbmplY3RvckRlZi5qc2AsIG1ldGEpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5nSW5qZWN0b3JEZWY7XG4gICAgfSxcbiAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGUsXG4gIH0pO1xufVxuXG5mdW5jdGlvbiB2ZXJpZnlTZW1hbnRpY3NPZk5nTW9kdWxlRGVmKG1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZSk6IHZvaWQge1xuICBpZiAodmVyaWZpZWROZ01vZHVsZS5nZXQobW9kdWxlVHlwZSkpIHJldHVybjtcbiAgdmVyaWZpZWROZ01vZHVsZS5zZXQobW9kdWxlVHlwZSwgdHJ1ZSk7XG4gIG1vZHVsZVR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZihtb2R1bGVUeXBlKTtcbiAgY29uc3QgbmdNb2R1bGVEZWYgPSBnZXROZ01vZHVsZURlZihtb2R1bGVUeXBlLCB0cnVlKTtcbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuICBuZ01vZHVsZURlZi5kZWNsYXJhdGlvbnMuZm9yRWFjaCh2ZXJpZnlEZWNsYXJhdGlvbnNIYXZlRGVmaW5pdGlvbnMpO1xuICBjb25zdCBjb21iaW5lZERlY2xhcmF0aW9uczogVHlwZTxhbnk+W10gPSBbXG4gICAgLi4ubmdNb2R1bGVEZWYuZGVjbGFyYXRpb25zLm1hcChyZXNvbHZlRm9yd2FyZFJlZiksICAvL1xuICAgIC4uLmZsYXR0ZW4obmdNb2R1bGVEZWYuaW1wb3J0cy5tYXAoY29tcHV0ZUNvbWJpbmVkRXhwb3J0cyksIHJlc29sdmVGb3J3YXJkUmVmKSxcbiAgXTtcbiAgbmdNb2R1bGVEZWYuZXhwb3J0cy5mb3JFYWNoKHZlcmlmeUV4cG9ydHNBcmVEZWNsYXJlZE9yUmVFeHBvcnRlZCk7XG4gIG5nTW9kdWxlRGVmLmRlY2xhcmF0aW9ucy5mb3JFYWNoKHZlcmlmeURlY2xhcmF0aW9uSXNVbmlxdWUpO1xuICBuZ01vZHVsZURlZi5kZWNsYXJhdGlvbnMuZm9yRWFjaCh2ZXJpZnlDb21wb25lbnRFbnRyeUNvbXBvbmVudHNJc1BhcnRPZk5nTW9kdWxlKTtcblxuICBjb25zdCBuZ01vZHVsZSA9IGdldEFubm90YXRpb248TmdNb2R1bGU+KG1vZHVsZVR5cGUsICdOZ01vZHVsZScpO1xuICBpZiAobmdNb2R1bGUpIHtcbiAgICBuZ01vZHVsZS5pbXBvcnRzICYmXG4gICAgICAgIGZsYXR0ZW4obmdNb2R1bGUuaW1wb3J0cywgdW53cmFwTW9kdWxlV2l0aFByb3ZpZGVyc0ltcG9ydHMpXG4gICAgICAgICAgICAuZm9yRWFjaCh2ZXJpZnlTZW1hbnRpY3NPZk5nTW9kdWxlRGVmKTtcbiAgICBuZ01vZHVsZS5ib290c3RyYXAgJiYgbmdNb2R1bGUuYm9vdHN0cmFwLmZvckVhY2godmVyaWZ5Q29ycmVjdEJvb3RzdHJhcFR5cGUpO1xuICAgIG5nTW9kdWxlLmJvb3RzdHJhcCAmJiBuZ01vZHVsZS5ib290c3RyYXAuZm9yRWFjaCh2ZXJpZnlDb21wb25lbnRJc1BhcnRPZk5nTW9kdWxlKTtcbiAgICBuZ01vZHVsZS5lbnRyeUNvbXBvbmVudHMgJiYgbmdNb2R1bGUuZW50cnlDb21wb25lbnRzLmZvckVhY2godmVyaWZ5Q29tcG9uZW50SXNQYXJ0T2ZOZ01vZHVsZSk7XG4gIH1cblxuICAvLyBUaHJvdyBFcnJvciBpZiBhbnkgZXJyb3JzIHdlcmUgZGV0ZWN0ZWQuXG4gIGlmIChlcnJvcnMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGVycm9ycy5qb2luKCdcXG4nKSk7XG4gIH1cbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gIGZ1bmN0aW9uIHZlcmlmeURlY2xhcmF0aW9uc0hhdmVEZWZpbml0aW9ucyh0eXBlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgICB0eXBlID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZSk7XG4gICAgY29uc3QgZGVmID0gZ2V0Q29tcG9uZW50RGVmKHR5cGUpIHx8IGdldERpcmVjdGl2ZURlZih0eXBlKSB8fCBnZXRQaXBlRGVmKHR5cGUpO1xuICAgIGlmICghZGVmKSB7XG4gICAgICBlcnJvcnMucHVzaChcbiAgICAgICAgICBgVW5leHBlY3RlZCB2YWx1ZSAnJHtyZW5kZXJTdHJpbmdpZnkodHlwZSl9JyBkZWNsYXJlZCBieSB0aGUgbW9kdWxlICcke3JlbmRlclN0cmluZ2lmeShtb2R1bGVUeXBlKX0nLiBQbGVhc2UgYWRkIGEgQFBpcGUvQERpcmVjdGl2ZS9AQ29tcG9uZW50IGFubm90YXRpb24uYCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdmVyaWZ5RXhwb3J0c0FyZURlY2xhcmVkT3JSZUV4cG9ydGVkKHR5cGU6IFR5cGU8YW55Pikge1xuICAgIHR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlKTtcbiAgICBjb25zdCBraW5kID0gZ2V0Q29tcG9uZW50RGVmKHR5cGUpICYmICdjb21wb25lbnQnIHx8IGdldERpcmVjdGl2ZURlZih0eXBlKSAmJiAnZGlyZWN0aXZlJyB8fFxuICAgICAgICBnZXRQaXBlRGVmKHR5cGUpICYmICdwaXBlJztcbiAgICBpZiAoa2luZCkge1xuICAgICAgLy8gb25seSBjaGVja2VkIGlmIHdlIGFyZSBkZWNsYXJlZCBhcyBDb21wb25lbnQsIERpcmVjdGl2ZSwgb3IgUGlwZVxuICAgICAgLy8gTW9kdWxlcyBkb24ndCBuZWVkIHRvIGJlIGRlY2xhcmVkIG9yIGltcG9ydGVkLlxuICAgICAgaWYgKGNvbWJpbmVkRGVjbGFyYXRpb25zLmxhc3RJbmRleE9mKHR5cGUpID09PSAtMSkge1xuICAgICAgICAvLyBXZSBhcmUgZXhwb3J0aW5nIHNvbWV0aGluZyB3aGljaCB3ZSBkb24ndCBleHBsaWNpdGx5IGRlY2xhcmUgb3IgaW1wb3J0LlxuICAgICAgICBlcnJvcnMucHVzaChcbiAgICAgICAgICAgIGBDYW4ndCBleHBvcnQgJHtraW5kfSAke3JlbmRlclN0cmluZ2lmeSh0eXBlKX0gZnJvbSAke3JlbmRlclN0cmluZ2lmeShtb2R1bGVUeXBlKX0gYXMgaXQgd2FzIG5laXRoZXIgZGVjbGFyZWQgbm9yIGltcG9ydGVkIWApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHZlcmlmeURlY2xhcmF0aW9uSXNVbmlxdWUodHlwZTogVHlwZTxhbnk+KSB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICAgIGNvbnN0IGV4aXN0aW5nTW9kdWxlID0gb3duZXJOZ01vZHVsZS5nZXQodHlwZSk7XG4gICAgaWYgKGV4aXN0aW5nTW9kdWxlICYmIGV4aXN0aW5nTW9kdWxlICE9PSBtb2R1bGVUeXBlKSB7XG4gICAgICBjb25zdCBtb2R1bGVzID0gW2V4aXN0aW5nTW9kdWxlLCBtb2R1bGVUeXBlXS5tYXAocmVuZGVyU3RyaW5naWZ5KS5zb3J0KCk7XG4gICAgICBlcnJvcnMucHVzaChcbiAgICAgICAgICBgVHlwZSAke3JlbmRlclN0cmluZ2lmeSh0eXBlKX0gaXMgcGFydCBvZiB0aGUgZGVjbGFyYXRpb25zIG9mIDIgbW9kdWxlczogJHttb2R1bGVzWzBdfSBhbmQgJHttb2R1bGVzWzFdfSEgYCArXG4gICAgICAgICAgYFBsZWFzZSBjb25zaWRlciBtb3ZpbmcgJHtyZW5kZXJTdHJpbmdpZnkodHlwZSl9IHRvIGEgaGlnaGVyIG1vZHVsZSB0aGF0IGltcG9ydHMgJHttb2R1bGVzWzBdfSBhbmQgJHttb2R1bGVzWzFdfS4gYCArXG4gICAgICAgICAgYFlvdSBjYW4gYWxzbyBjcmVhdGUgYSBuZXcgTmdNb2R1bGUgdGhhdCBleHBvcnRzIGFuZCBpbmNsdWRlcyAke3JlbmRlclN0cmluZ2lmeSh0eXBlKX0gdGhlbiBpbXBvcnQgdGhhdCBOZ01vZHVsZSBpbiAke21vZHVsZXNbMF19IGFuZCAke21vZHVsZXNbMV19LmApO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBNYXJrIHR5cGUgYXMgaGF2aW5nIG93bmVyLlxuICAgICAgb3duZXJOZ01vZHVsZS5zZXQodHlwZSwgbW9kdWxlVHlwZSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdmVyaWZ5Q29tcG9uZW50SXNQYXJ0T2ZOZ01vZHVsZSh0eXBlOiBUeXBlPGFueT4pIHtcbiAgICB0eXBlID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZSk7XG4gICAgY29uc3QgZXhpc3RpbmdNb2R1bGUgPSBvd25lck5nTW9kdWxlLmdldCh0eXBlKTtcbiAgICBpZiAoIWV4aXN0aW5nTW9kdWxlKSB7XG4gICAgICBlcnJvcnMucHVzaChcbiAgICAgICAgICBgQ29tcG9uZW50ICR7cmVuZGVyU3RyaW5naWZ5KHR5cGUpfSBpcyBub3QgcGFydCBvZiBhbnkgTmdNb2R1bGUgb3IgdGhlIG1vZHVsZSBoYXMgbm90IGJlZW4gaW1wb3J0ZWQgaW50byB5b3VyIG1vZHVsZS5gKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB2ZXJpZnlDb3JyZWN0Qm9vdHN0cmFwVHlwZSh0eXBlOiBUeXBlPGFueT4pIHtcbiAgICB0eXBlID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZSk7XG4gICAgaWYgKCFnZXRDb21wb25lbnREZWYodHlwZSkpIHtcbiAgICAgIGVycm9ycy5wdXNoKGAke3JlbmRlclN0cmluZ2lmeSh0eXBlKX0gY2Fubm90IGJlIHVzZWQgYXMgYW4gZW50cnkgY29tcG9uZW50LmApO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHZlcmlmeUNvbXBvbmVudEVudHJ5Q29tcG9uZW50c0lzUGFydE9mTmdNb2R1bGUodHlwZTogVHlwZTxhbnk+KSB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICAgIGlmIChnZXRDb21wb25lbnREZWYodHlwZSkpIHtcbiAgICAgIC8vIFdlIGtub3cgd2UgYXJlIGNvbXBvbmVudFxuICAgICAgY29uc3QgY29tcG9uZW50ID0gZ2V0QW5ub3RhdGlvbjxDb21wb25lbnQ+KHR5cGUsICdDb21wb25lbnQnKTtcbiAgICAgIGlmIChjb21wb25lbnQgJiYgY29tcG9uZW50LmVudHJ5Q29tcG9uZW50cykge1xuICAgICAgICBjb21wb25lbnQuZW50cnlDb21wb25lbnRzLmZvckVhY2godmVyaWZ5Q29tcG9uZW50SXNQYXJ0T2ZOZ01vZHVsZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHVud3JhcE1vZHVsZVdpdGhQcm92aWRlcnNJbXBvcnRzKFxuICAgIHR5cGVPcldpdGhQcm92aWRlcnM6IE5nTW9kdWxlVHlwZTxhbnk+fCB7bmdNb2R1bGU6IE5nTW9kdWxlVHlwZTxhbnk+fSk6IE5nTW9kdWxlVHlwZTxhbnk+IHtcbiAgdHlwZU9yV2l0aFByb3ZpZGVycyA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGVPcldpdGhQcm92aWRlcnMpO1xuICByZXR1cm4gKHR5cGVPcldpdGhQcm92aWRlcnMgYXMgYW55KS5uZ01vZHVsZSB8fCB0eXBlT3JXaXRoUHJvdmlkZXJzO1xufVxuXG5mdW5jdGlvbiBnZXRBbm5vdGF0aW9uPFQ+KHR5cGU6IGFueSwgbmFtZTogc3RyaW5nKTogVHxudWxsIHtcbiAgbGV0IGFubm90YXRpb246IFR8bnVsbCA9IG51bGw7XG4gIGNvbGxlY3QodHlwZS5fX2Fubm90YXRpb25zX18pO1xuICBjb2xsZWN0KHR5cGUuZGVjb3JhdG9ycyk7XG4gIHJldHVybiBhbm5vdGF0aW9uO1xuXG4gIGZ1bmN0aW9uIGNvbGxlY3QoYW5ub3RhdGlvbnM6IGFueVtdIHwgbnVsbCkge1xuICAgIGlmIChhbm5vdGF0aW9ucykge1xuICAgICAgYW5ub3RhdGlvbnMuZm9yRWFjaChyZWFkQW5ub3RhdGlvbik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZEFubm90YXRpb24oXG4gICAgICBkZWNvcmF0b3I6IHt0eXBlOiB7cHJvdG90eXBlOiB7bmdNZXRhZGF0YU5hbWU6IHN0cmluZ30sIGFyZ3M6IGFueVtdfSwgYXJnczogYW55fSk6IHZvaWQge1xuICAgIGlmICghYW5ub3RhdGlvbikge1xuICAgICAgY29uc3QgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoZGVjb3JhdG9yKTtcbiAgICAgIGlmIChwcm90by5uZ01ldGFkYXRhTmFtZSA9PSBuYW1lKSB7XG4gICAgICAgIGFubm90YXRpb24gPSBkZWNvcmF0b3IgYXMgYW55O1xuICAgICAgfSBlbHNlIGlmIChkZWNvcmF0b3IudHlwZSkge1xuICAgICAgICBjb25zdCBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihkZWNvcmF0b3IudHlwZSk7XG4gICAgICAgIGlmIChwcm90by5uZ01ldGFkYXRhTmFtZSA9PSBuYW1lKSB7XG4gICAgICAgICAgYW5ub3RhdGlvbiA9IGRlY29yYXRvci5hcmdzWzBdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogS2VlcCB0cmFjayBvZiBjb21waWxlZCBjb21wb25lbnRzLiBUaGlzIGlzIG5lZWRlZCBiZWNhdXNlIGluIHRlc3RzIHdlIG9mdGVuIHdhbnQgdG8gY29tcGlsZSB0aGVcbiAqIHNhbWUgY29tcG9uZW50IHdpdGggbW9yZSB0aGFuIG9uZSBOZ01vZHVsZS4gVGhpcyB3b3VsZCBjYXVzZSBhbiBlcnJvciB1bmxlc3Mgd2UgcmVzZXQgd2hpY2hcbiAqIE5nTW9kdWxlIHRoZSBjb21wb25lbnQgYmVsb25ncyB0by4gV2Uga2VlcCB0aGUgbGlzdCBvZiBjb21waWxlZCBjb21wb25lbnRzIGhlcmUgc28gdGhhdCB0aGVcbiAqIFRlc3RCZWQgY2FuIHJlc2V0IGl0IGxhdGVyLlxuICovXG5sZXQgb3duZXJOZ01vZHVsZSA9IG5ldyBNYXA8VHlwZTxhbnk+LCBOZ01vZHVsZVR5cGU8YW55Pj4oKTtcbmxldCB2ZXJpZmllZE5nTW9kdWxlID0gbmV3IE1hcDxOZ01vZHVsZVR5cGU8YW55PiwgYm9vbGVhbj4oKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0Q29tcGlsZWRDb21wb25lbnRzKCk6IHZvaWQge1xuICBvd25lck5nTW9kdWxlID0gbmV3IE1hcDxUeXBlPGFueT4sIE5nTW9kdWxlVHlwZTxhbnk+PigpO1xuICB2ZXJpZmllZE5nTW9kdWxlID0gbmV3IE1hcDxOZ01vZHVsZVR5cGU8YW55PiwgYm9vbGVhbj4oKTtcbiAgbW9kdWxlUXVldWUubGVuZ3RoID0gMDtcbn1cblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgY29tYmluZWQgZGVjbGFyYXRpb25zIG9mIGV4cGxpY2l0IGRlY2xhcmF0aW9ucywgYXMgd2VsbCBhcyBkZWNsYXJhdGlvbnMgaW5oZXJpdGVkXG4gKiBieVxuICogdHJhdmVyc2luZyB0aGUgZXhwb3J0cyBvZiBpbXBvcnRlZCBtb2R1bGVzLlxuICogQHBhcmFtIHR5cGVcbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUNvbWJpbmVkRXhwb3J0cyh0eXBlOiBUeXBlPGFueT4pOiBUeXBlPGFueT5bXSB7XG4gIHR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlKTtcbiAgY29uc3QgbmdNb2R1bGVEZWYgPSBnZXROZ01vZHVsZURlZih0eXBlLCB0cnVlKTtcbiAgcmV0dXJuIFsuLi5mbGF0dGVuKG5nTW9kdWxlRGVmLmV4cG9ydHMubWFwKCh0eXBlKSA9PiB7XG4gICAgY29uc3QgbmdNb2R1bGVEZWYgPSBnZXROZ01vZHVsZURlZih0eXBlKTtcbiAgICBpZiAobmdNb2R1bGVEZWYpIHtcbiAgICAgIHZlcmlmeVNlbWFudGljc09mTmdNb2R1bGVEZWYodHlwZSBhcyBhbnkgYXMgTmdNb2R1bGVUeXBlKTtcbiAgICAgIHJldHVybiBjb21wdXRlQ29tYmluZWRFeHBvcnRzKHR5cGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdHlwZTtcbiAgICB9XG4gIH0pKV07XG59XG5cbi8qKlxuICogU29tZSBkZWNsYXJlZCBjb21wb25lbnRzIG1heSBiZSBjb21waWxlZCBhc3luY2hyb25vdXNseSwgYW5kIHRodXMgbWF5IG5vdCBoYXZlIHRoZWlyXG4gKiBuZ0NvbXBvbmVudERlZiBzZXQgeWV0LiBJZiB0aGlzIGlzIHRoZSBjYXNlLCB0aGVuIGEgcmVmZXJlbmNlIHRvIHRoZSBtb2R1bGUgaXMgd3JpdHRlbiBpbnRvXG4gKiB0aGUgYG5nU2VsZWN0b3JTY29wZWAgcHJvcGVydHkgb2YgdGhlIGRlY2xhcmVkIHR5cGUuXG4gKi9cbmZ1bmN0aW9uIHNldFNjb3BlT25EZWNsYXJlZENvbXBvbmVudHMobW9kdWxlVHlwZTogVHlwZTxhbnk+LCBuZ01vZHVsZTogTmdNb2R1bGUpIHtcbiAgY29uc3QgZGVjbGFyYXRpb25zOiBUeXBlPGFueT5bXSA9IGZsYXR0ZW4obmdNb2R1bGUuZGVjbGFyYXRpb25zIHx8IEVNUFRZX0FSUkFZKTtcblxuICBjb25zdCB0cmFuc2l0aXZlU2NvcGVzID0gdHJhbnNpdGl2ZVNjb3Blc0Zvcihtb2R1bGVUeXBlKTtcblxuICBkZWNsYXJhdGlvbnMuZm9yRWFjaChkZWNsYXJhdGlvbiA9PiB7XG4gICAgaWYgKGRlY2xhcmF0aW9uLmhhc093blByb3BlcnR5KE5HX0NPTVBPTkVOVF9ERUYpKSB7XG4gICAgICAvLyBBbiBgbmdDb21wb25lbnREZWZgIGZpZWxkIGV4aXN0cyAtIGdvIGFoZWFkIGFuZCBwYXRjaCB0aGUgY29tcG9uZW50IGRpcmVjdGx5LlxuICAgICAgY29uc3QgY29tcG9uZW50ID0gZGVjbGFyYXRpb24gYXMgVHlwZTxhbnk+JiB7bmdDb21wb25lbnREZWY6IENvbXBvbmVudERlZjxhbnk+fTtcbiAgICAgIGNvbnN0IGNvbXBvbmVudERlZiA9IGdldENvbXBvbmVudERlZihjb21wb25lbnQpICE7XG4gICAgICBwYXRjaENvbXBvbmVudERlZldpdGhTY29wZShjb21wb25lbnREZWYsIHRyYW5zaXRpdmVTY29wZXMpO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICFkZWNsYXJhdGlvbi5oYXNPd25Qcm9wZXJ0eShOR19ESVJFQ1RJVkVfREVGKSAmJiAhZGVjbGFyYXRpb24uaGFzT3duUHJvcGVydHkoTkdfUElQRV9ERUYpKSB7XG4gICAgICAvLyBTZXQgYG5nU2VsZWN0b3JTY29wZWAgZm9yIGZ1dHVyZSByZWZlcmVuY2Ugd2hlbiB0aGUgY29tcG9uZW50IGNvbXBpbGF0aW9uIGZpbmlzaGVzLlxuICAgICAgKGRlY2xhcmF0aW9uIGFzIFR5cGU8YW55PiYge25nU2VsZWN0b3JTY29wZT86IGFueX0pLm5nU2VsZWN0b3JTY29wZSA9IG1vZHVsZVR5cGU7XG4gICAgfVxuICB9KTtcbn1cblxuLyoqXG4gKiBQYXRjaCB0aGUgZGVmaW5pdGlvbiBvZiBhIGNvbXBvbmVudCB3aXRoIGRpcmVjdGl2ZXMgYW5kIHBpcGVzIGZyb20gdGhlIGNvbXBpbGF0aW9uIHNjb3BlIG9mXG4gKiBhIGdpdmVuIG1vZHVsZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlPEM+KFxuICAgIGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPEM+LCB0cmFuc2l0aXZlU2NvcGVzOiBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMpIHtcbiAgY29tcG9uZW50RGVmLmRpcmVjdGl2ZURlZnMgPSAoKSA9PlxuICAgICAgQXJyYXkuZnJvbSh0cmFuc2l0aXZlU2NvcGVzLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMpXG4gICAgICAgICAgLm1hcChcbiAgICAgICAgICAgICAgZGlyID0+IGRpci5oYXNPd25Qcm9wZXJ0eShOR19DT01QT05FTlRfREVGKSA/IGdldENvbXBvbmVudERlZihkaXIpICEgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0RGlyZWN0aXZlRGVmKGRpcikgISlcbiAgICAgICAgICAuZmlsdGVyKGRlZiA9PiAhIWRlZik7XG4gIGNvbXBvbmVudERlZi5waXBlRGVmcyA9ICgpID0+XG4gICAgICBBcnJheS5mcm9tKHRyYW5zaXRpdmVTY29wZXMuY29tcGlsYXRpb24ucGlwZXMpLm1hcChwaXBlID0+IGdldFBpcGVEZWYocGlwZSkgISk7XG4gIGNvbXBvbmVudERlZi5zY2hlbWFzID0gdHJhbnNpdGl2ZVNjb3Blcy5zY2hlbWFzO1xufVxuXG4vKipcbiAqIENvbXB1dGUgdGhlIHBhaXIgb2YgdHJhbnNpdGl2ZSBzY29wZXMgKGNvbXBpbGF0aW9uIHNjb3BlIGFuZCBleHBvcnRlZCBzY29wZSkgZm9yIGEgZ2l2ZW4gbW9kdWxlLlxuICpcbiAqIFRoaXMgb3BlcmF0aW9uIGlzIG1lbW9pemVkIGFuZCB0aGUgcmVzdWx0IGlzIGNhY2hlZCBvbiB0aGUgbW9kdWxlJ3MgZGVmaW5pdGlvbi4gSXQgY2FuIGJlIGNhbGxlZFxuICogb24gbW9kdWxlcyB3aXRoIGNvbXBvbmVudHMgdGhhdCBoYXZlIG5vdCBmdWxseSBjb21waWxlZCB5ZXQsIGJ1dCB0aGUgcmVzdWx0IHNob3VsZCBub3QgYmUgdXNlZFxuICogdW50aWwgdGhleSBoYXZlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNpdGl2ZVNjb3Blc0ZvcjxUPihcbiAgICBtb2R1bGVUeXBlOiBUeXBlPFQ+LFxuICAgIHByb2Nlc3NOZ01vZHVsZUZuPzogKG5nTW9kdWxlOiBOZ01vZHVsZVR5cGUpID0+IHZvaWQpOiBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMge1xuICBpZiAoIWlzTmdNb2R1bGUobW9kdWxlVHlwZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bW9kdWxlVHlwZS5uYW1lfSBkb2VzIG5vdCBoYXZlIGFuIG5nTW9kdWxlRGVmYCk7XG4gIH1cbiAgY29uc3QgZGVmID0gZ2V0TmdNb2R1bGVEZWYobW9kdWxlVHlwZSkgITtcblxuICBpZiAoZGVmLnRyYW5zaXRpdmVDb21waWxlU2NvcGVzICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIGRlZi50cmFuc2l0aXZlQ29tcGlsZVNjb3BlcztcbiAgfVxuXG4gIGNvbnN0IHNjb3BlczogTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzID0ge1xuICAgIHNjaGVtYXM6IGRlZi5zY2hlbWFzIHx8IG51bGwsXG4gICAgY29tcGlsYXRpb246IHtcbiAgICAgIGRpcmVjdGl2ZXM6IG5ldyBTZXQ8YW55PigpLFxuICAgICAgcGlwZXM6IG5ldyBTZXQ8YW55PigpLFxuICAgIH0sXG4gICAgZXhwb3J0ZWQ6IHtcbiAgICAgIGRpcmVjdGl2ZXM6IG5ldyBTZXQ8YW55PigpLFxuICAgICAgcGlwZXM6IG5ldyBTZXQ8YW55PigpLFxuICAgIH0sXG4gIH07XG5cbiAgZGVmLmRlY2xhcmF0aW9ucy5mb3JFYWNoKGRlY2xhcmVkID0+IHtcbiAgICBjb25zdCBkZWNsYXJlZFdpdGhEZWZzID0gZGVjbGFyZWQgYXMgVHlwZTxhbnk+JiB7IG5nUGlwZURlZj86IGFueTsgfTtcblxuICAgIGlmIChnZXRQaXBlRGVmKGRlY2xhcmVkV2l0aERlZnMpKSB7XG4gICAgICBzY29wZXMuY29tcGlsYXRpb24ucGlwZXMuYWRkKGRlY2xhcmVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRWl0aGVyIGRlY2xhcmVkIGhhcyBhbiBuZ0NvbXBvbmVudERlZiBvciBuZ0RpcmVjdGl2ZURlZiwgb3IgaXQncyBhIGNvbXBvbmVudCB3aGljaCBoYXNuJ3RcbiAgICAgIC8vIGhhZCBpdHMgdGVtcGxhdGUgY29tcGlsZWQgeWV0LiBJbiBlaXRoZXIgY2FzZSwgaXQgZ2V0cyBhZGRlZCB0byB0aGUgY29tcGlsYXRpb24nc1xuICAgICAgLy8gZGlyZWN0aXZlcy5cbiAgICAgIHNjb3Blcy5jb21waWxhdGlvbi5kaXJlY3RpdmVzLmFkZChkZWNsYXJlZCk7XG4gICAgfVxuICB9KTtcblxuICBkZWYuaW1wb3J0cy5mb3JFYWNoKDxJPihpbXBvcnRlZDogVHlwZTxJPikgPT4ge1xuICAgIGNvbnN0IGltcG9ydGVkVHlwZSA9IGltcG9ydGVkIGFzIFR5cGU8ST4mIHtcbiAgICAgIC8vIElmIGltcG9ydGVkIGlzIGFuIEBOZ01vZHVsZTpcbiAgICAgIG5nTW9kdWxlRGVmPzogTmdNb2R1bGVEZWY8ST47XG4gICAgfTtcblxuICAgIGlmICghaXNOZ01vZHVsZTxJPihpbXBvcnRlZFR5cGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEltcG9ydGluZyAke2ltcG9ydGVkVHlwZS5uYW1lfSB3aGljaCBkb2VzIG5vdCBoYXZlIGFuIG5nTW9kdWxlRGVmYCk7XG4gICAgfVxuXG4gICAgaWYgKHByb2Nlc3NOZ01vZHVsZUZuKSB7XG4gICAgICBwcm9jZXNzTmdNb2R1bGVGbihpbXBvcnRlZFR5cGUgYXMgTmdNb2R1bGVUeXBlKTtcbiAgICB9XG5cbiAgICAvLyBXaGVuIHRoaXMgbW9kdWxlIGltcG9ydHMgYW5vdGhlciwgdGhlIGltcG9ydGVkIG1vZHVsZSdzIGV4cG9ydGVkIGRpcmVjdGl2ZXMgYW5kIHBpcGVzIGFyZVxuICAgIC8vIGFkZGVkIHRvIHRoZSBjb21waWxhdGlvbiBzY29wZSBvZiB0aGlzIG1vZHVsZS5cbiAgICBjb25zdCBpbXBvcnRlZFNjb3BlID0gdHJhbnNpdGl2ZVNjb3Blc0ZvcihpbXBvcnRlZFR5cGUsIHByb2Nlc3NOZ01vZHVsZUZuKTtcbiAgICBpbXBvcnRlZFNjb3BlLmV4cG9ydGVkLmRpcmVjdGl2ZXMuZm9yRWFjaChlbnRyeSA9PiBzY29wZXMuY29tcGlsYXRpb24uZGlyZWN0aXZlcy5hZGQoZW50cnkpKTtcbiAgICBpbXBvcnRlZFNjb3BlLmV4cG9ydGVkLnBpcGVzLmZvckVhY2goZW50cnkgPT4gc2NvcGVzLmNvbXBpbGF0aW9uLnBpcGVzLmFkZChlbnRyeSkpO1xuICB9KTtcblxuICBkZWYuZXhwb3J0cy5mb3JFYWNoKDxFPihleHBvcnRlZDogVHlwZTxFPikgPT4ge1xuICAgIGNvbnN0IGV4cG9ydGVkVHlwZSA9IGV4cG9ydGVkIGFzIFR5cGU8RT4mIHtcbiAgICAgIC8vIENvbXBvbmVudHMsIERpcmVjdGl2ZXMsIE5nTW9kdWxlcywgYW5kIFBpcGVzIGNhbiBhbGwgYmUgZXhwb3J0ZWQuXG4gICAgICBuZ0NvbXBvbmVudERlZj86IGFueTtcbiAgICAgIG5nRGlyZWN0aXZlRGVmPzogYW55O1xuICAgICAgbmdNb2R1bGVEZWY/OiBOZ01vZHVsZURlZjxFPjtcbiAgICAgIG5nUGlwZURlZj86IGFueTtcbiAgICB9O1xuXG4gICAgLy8gRWl0aGVyIHRoZSB0eXBlIGlzIGEgbW9kdWxlLCBhIHBpcGUsIG9yIGEgY29tcG9uZW50L2RpcmVjdGl2ZSAod2hpY2ggbWF5IG5vdCBoYXZlIGFuXG4gICAgLy8gbmdDb21wb25lbnREZWYgYXMgaXQgbWlnaHQgYmUgY29tcGlsZWQgYXN5bmNocm9ub3VzbHkpLlxuICAgIGlmIChpc05nTW9kdWxlKGV4cG9ydGVkVHlwZSkpIHtcbiAgICAgIC8vIFdoZW4gdGhpcyBtb2R1bGUgZXhwb3J0cyBhbm90aGVyLCB0aGUgZXhwb3J0ZWQgbW9kdWxlJ3MgZXhwb3J0ZWQgZGlyZWN0aXZlcyBhbmQgcGlwZXMgYXJlXG4gICAgICAvLyBhZGRlZCB0byBib3RoIHRoZSBjb21waWxhdGlvbiBhbmQgZXhwb3J0ZWQgc2NvcGVzIG9mIHRoaXMgbW9kdWxlLlxuICAgICAgY29uc3QgZXhwb3J0ZWRTY29wZSA9IHRyYW5zaXRpdmVTY29wZXNGb3IoZXhwb3J0ZWRUeXBlLCBwcm9jZXNzTmdNb2R1bGVGbik7XG4gICAgICBleHBvcnRlZFNjb3BlLmV4cG9ydGVkLmRpcmVjdGl2ZXMuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgICAgIHNjb3Blcy5jb21waWxhdGlvbi5kaXJlY3RpdmVzLmFkZChlbnRyeSk7XG4gICAgICAgIHNjb3Blcy5leHBvcnRlZC5kaXJlY3RpdmVzLmFkZChlbnRyeSk7XG4gICAgICB9KTtcbiAgICAgIGV4cG9ydGVkU2NvcGUuZXhwb3J0ZWQucGlwZXMuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgICAgIHNjb3Blcy5jb21waWxhdGlvbi5waXBlcy5hZGQoZW50cnkpO1xuICAgICAgICBzY29wZXMuZXhwb3J0ZWQucGlwZXMuYWRkKGVudHJ5KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoZ2V0UGlwZURlZihleHBvcnRlZFR5cGUpKSB7XG4gICAgICBzY29wZXMuZXhwb3J0ZWQucGlwZXMuYWRkKGV4cG9ydGVkVHlwZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNjb3Blcy5leHBvcnRlZC5kaXJlY3RpdmVzLmFkZChleHBvcnRlZFR5cGUpO1xuICAgIH1cbiAgfSk7XG5cbiAgZGVmLnRyYW5zaXRpdmVDb21waWxlU2NvcGVzID0gc2NvcGVzO1xuICByZXR1cm4gc2NvcGVzO1xufVxuXG5mdW5jdGlvbiBmbGF0dGVuPFQ+KHZhbHVlczogYW55W10sIG1hcEZuPzogKHZhbHVlOiBUKSA9PiBhbnkpOiBUeXBlPFQ+W10ge1xuICBjb25zdCBvdXQ6IFR5cGU8VD5bXSA9IFtdO1xuICB2YWx1ZXMuZm9yRWFjaCh2YWx1ZSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICBvdXQucHVzaCguLi5mbGF0dGVuPFQ+KHZhbHVlLCBtYXBGbikpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXQucHVzaChtYXBGbiA/IG1hcEZuKHZhbHVlKSA6IHZhbHVlKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBleHBhbmRNb2R1bGVXaXRoUHJvdmlkZXJzKHZhbHVlOiBUeXBlPGFueT58IE1vZHVsZVdpdGhQcm92aWRlcnM8e30+KTogVHlwZTxhbnk+IHtcbiAgaWYgKGlzTW9kdWxlV2l0aFByb3ZpZGVycyh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUubmdNb2R1bGU7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBpc01vZHVsZVdpdGhQcm92aWRlcnModmFsdWU6IGFueSk6IHZhbHVlIGlzIE1vZHVsZVdpdGhQcm92aWRlcnM8e30+IHtcbiAgcmV0dXJuICh2YWx1ZSBhc3tuZ01vZHVsZT86IGFueX0pLm5nTW9kdWxlICE9PSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGlzTmdNb2R1bGU8VD4odmFsdWU6IFR5cGU8VD4pOiB2YWx1ZSBpcyBUeXBlPFQ+JntuZ01vZHVsZURlZjogTmdNb2R1bGVEZWY8VD59IHtcbiAgcmV0dXJuICEhZ2V0TmdNb2R1bGVEZWYodmFsdWUpO1xufVxuIl19