/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { getCompilerFacade } from '../../compiler/compiler_facade';
import { resolveForwardRef } from '../../di/forward_ref';
import { NG_INJECTOR_DEF } from '../../di/interface/defs';
import { reflectDependencies } from '../../di/jit/util';
import { registerNgModuleType } from '../../linker/ng_module_factory_loader';
import { assertDefined } from '../../util/assert';
import { getComponentDef, getDirectiveDef, getNgModuleDef, getPipeDef } from '../definition';
import { NG_COMPONENT_DEF, NG_DIRECTIVE_DEF, NG_MODULE_DEF, NG_PIPE_DEF } from '../fields';
import { maybeUnwrapFn, stringifyForError } from '../util/misc_utils';
import { angularCoreEnv } from './environment';
var EMPTY_ARRAY = [];
var moduleQueue = [];
/**
 * Enqueues moduleDef to be checked later to see if scope can be set on its
 * component declarations.
 */
function enqueueModuleForDelayedScoping(moduleType, ngModule) {
    moduleQueue.push({ moduleType: moduleType, ngModule: ngModule });
}
var flushingModuleQueue = false;
/**
 * Loops over queued module definitions, if a given module definition has all of its
 * declarations resolved, it dequeues that module definition and sets the scope on
 * its declarations.
 */
export function flushModuleScopingQueueAsMuchAsPossible() {
    if (!flushingModuleQueue) {
        flushingModuleQueue = true;
        try {
            for (var i = moduleQueue.length - 1; i >= 0; i--) {
                var _a = moduleQueue[i], moduleType = _a.moduleType, ngModule = _a.ngModule;
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
 * This function automatically gets called when a class has a `@NgModule` decorator.
 */
export function compileNgModule(moduleType, ngModule) {
    if (ngModule === void 0) { ngModule = {}; }
    compileNgModuleDefs(moduleType, ngModule);
    // Because we don't know if all declarations have resolved yet at the moment the
    // NgModule decorator is executing, we're enqueueing the setting of module scope
    // on its declarations to be run at a later time when all declarations for the module,
    // including forward refs, have resolved.
    enqueueModuleForDelayedScoping(moduleType, ngModule);
}
/**
 * Compiles and adds the `ngModuleDef` and `ngInjectorDef` properties to the module class.
 */
export function compileNgModuleDefs(moduleType, ngModule) {
    ngDevMode && assertDefined(moduleType, 'Required value moduleType');
    ngDevMode && assertDefined(ngModule, 'Required value ngModule');
    var declarations = flatten(ngModule.declarations || EMPTY_ARRAY);
    var ngModuleDef = null;
    Object.defineProperty(moduleType, NG_MODULE_DEF, {
        configurable: true,
        get: function () {
            if (ngModuleDef === null) {
                ngModuleDef = getCompilerFacade().compileNgModule(angularCoreEnv, "ng://" + moduleType.name + "/ngModuleDef.js", {
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
    var ngInjectorDef = null;
    Object.defineProperty(moduleType, NG_INJECTOR_DEF, {
        get: function () {
            if (ngInjectorDef === null) {
                ngDevMode && verifySemanticsOfNgModuleDef(moduleType);
                var meta = {
                    name: moduleType.name,
                    type: moduleType,
                    deps: reflectDependencies(moduleType),
                    providers: ngModule.providers || EMPTY_ARRAY,
                    imports: [
                        (ngModule.imports || EMPTY_ARRAY).map(resolveForwardRef),
                        (ngModule.exports || EMPTY_ARRAY).map(resolveForwardRef),
                    ],
                };
                ngInjectorDef = getCompilerFacade().compileInjector(angularCoreEnv, "ng://" + moduleType.name + "/ngInjectorDef.js", meta);
            }
            return ngInjectorDef;
        },
        // Make the property configurable in dev mode to allow overriding in tests
        configurable: !!ngDevMode,
    });
}
function verifySemanticsOfNgModuleDef(moduleType) {
    if (verifiedNgModule.get(moduleType))
        return;
    verifiedNgModule.set(moduleType, true);
    moduleType = resolveForwardRef(moduleType);
    var ngModuleDef = getNgModuleDef(moduleType, true);
    var errors = [];
    var declarations = maybeUnwrapFn(ngModuleDef.declarations);
    var imports = maybeUnwrapFn(ngModuleDef.imports);
    var exports = maybeUnwrapFn(ngModuleDef.exports);
    declarations.forEach(verifyDeclarationsHaveDefinitions);
    var combinedDeclarations = tslib_1.__spread(declarations.map(resolveForwardRef), flatten(imports.map(computeCombinedExports), resolveForwardRef));
    exports.forEach(verifyExportsAreDeclaredOrReExported);
    declarations.forEach(verifyDeclarationIsUnique);
    declarations.forEach(verifyComponentEntryComponentsIsPartOfNgModule);
    var ngModule = getAnnotation(moduleType, 'NgModule');
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
    function verifyDeclarationsHaveDefinitions(type) {
        type = resolveForwardRef(type);
        var def = getComponentDef(type) || getDirectiveDef(type) || getPipeDef(type);
        if (!def) {
            errors.push("Unexpected value '" + stringifyForError(type) + "' declared by the module '" + stringifyForError(moduleType) + "'. Please add a @Pipe/@Directive/@Component annotation.");
        }
    }
    function verifyExportsAreDeclaredOrReExported(type) {
        type = resolveForwardRef(type);
        var kind = getComponentDef(type) && 'component' || getDirectiveDef(type) && 'directive' ||
            getPipeDef(type) && 'pipe';
        if (kind) {
            // only checked if we are declared as Component, Directive, or Pipe
            // Modules don't need to be declared or imported.
            if (combinedDeclarations.lastIndexOf(type) === -1) {
                // We are exporting something which we don't explicitly declare or import.
                errors.push("Can't export " + kind + " " + stringifyForError(type) + " from " + stringifyForError(moduleType) + " as it was neither declared nor imported!");
            }
        }
    }
    function verifyDeclarationIsUnique(type) {
        type = resolveForwardRef(type);
        var existingModule = ownerNgModule.get(type);
        if (existingModule && existingModule !== moduleType) {
            var modules = [existingModule, moduleType].map(stringifyForError).sort();
            errors.push("Type " + stringifyForError(type) + " is part of the declarations of 2 modules: " + modules[0] + " and " + modules[1] + "! " +
                ("Please consider moving " + stringifyForError(type) + " to a higher module that imports " + modules[0] + " and " + modules[1] + ". ") +
                ("You can also create a new NgModule that exports and includes " + stringifyForError(type) + " then import that NgModule in " + modules[0] + " and " + modules[1] + "."));
        }
        else {
            // Mark type as having owner.
            ownerNgModule.set(type, moduleType);
        }
    }
    function verifyComponentIsPartOfNgModule(type) {
        type = resolveForwardRef(type);
        var existingModule = ownerNgModule.get(type);
        if (!existingModule) {
            errors.push("Component " + stringifyForError(type) + " is not part of any NgModule or the module has not been imported into your module.");
        }
    }
    function verifyCorrectBootstrapType(type) {
        type = resolveForwardRef(type);
        if (!getComponentDef(type)) {
            errors.push(stringifyForError(type) + " cannot be used as an entry component.");
        }
    }
    function verifyComponentEntryComponentsIsPartOfNgModule(type) {
        type = resolveForwardRef(type);
        if (getComponentDef(type)) {
            // We know we are component
            var component = getAnnotation(type, 'Component');
            if (component && component.entryComponents) {
                component.entryComponents.forEach(verifyComponentIsPartOfNgModule);
            }
        }
    }
}
function unwrapModuleWithProvidersImports(typeOrWithProviders) {
    typeOrWithProviders = resolveForwardRef(typeOrWithProviders);
    return typeOrWithProviders.ngModule || typeOrWithProviders;
}
function getAnnotation(type, name) {
    var annotation = null;
    collect(type.__annotations__);
    collect(type.decorators);
    return annotation;
    function collect(annotations) {
        if (annotations) {
            annotations.forEach(readAnnotation);
        }
    }
    function readAnnotation(decorator) {
        if (!annotation) {
            var proto = Object.getPrototypeOf(decorator);
            if (proto.ngMetadataName == name) {
                annotation = decorator;
            }
            else if (decorator.type) {
                var proto_1 = Object.getPrototypeOf(decorator.type);
                if (proto_1.ngMetadataName == name) {
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
 */
var ownerNgModule = new Map();
var verifiedNgModule = new Map();
export function resetCompiledComponents() {
    ownerNgModule = new Map();
    verifiedNgModule = new Map();
    moduleQueue.length = 0;
}
/**
 * Computes the combined declarations of explicit declarations, as well as declarations inherited by
 * traversing the exports of imported modules.
 * @param type
 */
function computeCombinedExports(type) {
    type = resolveForwardRef(type);
    var ngModuleDef = getNgModuleDef(type, true);
    return tslib_1.__spread(flatten(maybeUnwrapFn(ngModuleDef.exports).map(function (type) {
        var ngModuleDef = getNgModuleDef(type);
        if (ngModuleDef) {
            verifySemanticsOfNgModuleDef(type);
            return computeCombinedExports(type);
        }
        else {
            return type;
        }
    })));
}
/**
 * Some declared components may be compiled asynchronously, and thus may not have their
 * ngComponentDef set yet. If this is the case, then a reference to the module is written into
 * the `ngSelectorScope` property of the declared type.
 */
function setScopeOnDeclaredComponents(moduleType, ngModule) {
    var declarations = flatten(ngModule.declarations || EMPTY_ARRAY);
    var transitiveScopes = transitiveScopesFor(moduleType);
    declarations.forEach(function (declaration) {
        if (declaration.hasOwnProperty(NG_COMPONENT_DEF)) {
            // An `ngComponentDef` field exists - go ahead and patch the component directly.
            var component = declaration;
            var componentDef = getComponentDef(component);
            patchComponentDefWithScope(componentDef, transitiveScopes);
        }
        else if (!declaration.hasOwnProperty(NG_DIRECTIVE_DEF) && !declaration.hasOwnProperty(NG_PIPE_DEF)) {
            // Set `ngSelectorScope` for future reference when the component compilation finishes.
            declaration.ngSelectorScope = moduleType;
        }
    });
}
/**
 * Patch the definition of a component with directives and pipes from the compilation scope of
 * a given module.
 */
export function patchComponentDefWithScope(componentDef, transitiveScopes) {
    componentDef.directiveDefs = function () {
        return Array.from(transitiveScopes.compilation.directives)
            .map(function (dir) { return dir.hasOwnProperty(NG_COMPONENT_DEF) ? getComponentDef(dir) :
            getDirectiveDef(dir); })
            .filter(function (def) { return !!def; });
    };
    componentDef.pipeDefs = function () {
        return Array.from(transitiveScopes.compilation.pipes).map(function (pipe) { return getPipeDef(pipe); });
    };
    componentDef.schemas = transitiveScopes.schemas;
    // Since we avoid Components/Directives/Pipes recompiling in case there are no overrides, we
    // may face a problem where previously compiled defs available to a given Component/Directive
    // are cached in TView and may become stale (in case any of these defs gets recompiled). In
    // order to avoid this problem, we force fresh TView to be created.
    componentDef.template.ngPrivateData = undefined;
}
/**
 * Compute the pair of transitive scopes (compilation scope and exported scope) for a given module.
 *
 * This operation is memoized and the result is cached on the module's definition. It can be called
 * on modules with components that have not fully compiled yet, but the result should not be used
 * until they have.
 */
export function transitiveScopesFor(moduleType, processNgModuleFn) {
    if (!isNgModule(moduleType)) {
        throw new Error(moduleType.name + " does not have an ngModuleDef");
    }
    var def = getNgModuleDef(moduleType);
    if (def.transitiveCompileScopes !== null) {
        return def.transitiveCompileScopes;
    }
    var scopes = {
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
    maybeUnwrapFn(def.declarations).forEach(function (declared) {
        var declaredWithDefs = declared;
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
    maybeUnwrapFn(def.imports).forEach(function (imported) {
        var importedType = imported;
        if (!isNgModule(importedType)) {
            throw new Error("Importing " + importedType.name + " which does not have an ngModuleDef");
        }
        if (processNgModuleFn) {
            processNgModuleFn(importedType);
        }
        // When this module imports another, the imported module's exported directives and pipes are
        // added to the compilation scope of this module.
        var importedScope = transitiveScopesFor(importedType, processNgModuleFn);
        importedScope.exported.directives.forEach(function (entry) { return scopes.compilation.directives.add(entry); });
        importedScope.exported.pipes.forEach(function (entry) { return scopes.compilation.pipes.add(entry); });
    });
    maybeUnwrapFn(def.exports).forEach(function (exported) {
        var exportedType = exported;
        // Either the type is a module, a pipe, or a component/directive (which may not have an
        // ngComponentDef as it might be compiled asynchronously).
        if (isNgModule(exportedType)) {
            // When this module exports another, the exported module's exported directives and pipes are
            // added to both the compilation and exported scopes of this module.
            var exportedScope = transitiveScopesFor(exportedType, processNgModuleFn);
            exportedScope.exported.directives.forEach(function (entry) {
                scopes.compilation.directives.add(entry);
                scopes.exported.directives.add(entry);
            });
            exportedScope.exported.pipes.forEach(function (entry) {
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
function flatten(values, mapFn) {
    var out = [];
    values.forEach(function (value) {
        if (Array.isArray(value)) {
            out.push.apply(out, tslib_1.__spread(flatten(value, mapFn)));
        }
        else {
            out.push(mapFn ? mapFn(value) : value);
        }
    });
    return out;
}
function expandModuleWithProviders(value) {
    if (isModuleWithProviders(value)) {
        return value.ngModule;
    }
    return value;
}
function isModuleWithProviders(value) {
    return value.ngModule !== undefined;
}
function isNgModule(value) {
    return !!getNgModuleDef(value);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvbW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQTJCLGlCQUFpQixFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFDM0YsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDdkQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQ3hELE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRXRELE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLHVDQUF1QyxDQUFDO0FBRzNFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNoRCxPQUFPLEVBQUMsZUFBZSxFQUFFLGVBQWUsRUFBRSxjQUFjLEVBQUUsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzNGLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBR3pGLE9BQU8sRUFBQyxhQUFhLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUVwRSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRTdDLElBQU0sV0FBVyxHQUFnQixFQUFFLENBQUM7QUFPcEMsSUFBTSxXQUFXLEdBQXNCLEVBQUUsQ0FBQztBQUUxQzs7O0dBR0c7QUFDSCxTQUFTLDhCQUE4QixDQUFDLFVBQXFCLEVBQUUsUUFBa0I7SUFDL0UsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFDLFVBQVUsWUFBQSxFQUFFLFFBQVEsVUFBQSxFQUFDLENBQUMsQ0FBQztBQUMzQyxDQUFDO0FBRUQsSUFBSSxtQkFBbUIsR0FB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QUFDYixDQUFDO0FBRUQsU0FBUyx5QkFBeUIsQ0FBQyxLQUF5QztJQUMxRSxJQUFJLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ2hDLE9BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBQztLQUN2QjtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVELFNBQVMscUJBQXFCLENBQUMsS0FBVTtJQUN2QyxPQUFRLEtBQXlCLENBQUMsUUFBUSxLQUFLLFNBQVMsQ0FBQztBQUMzRCxDQUFDO0FBRUQsU0FBUyxVQUFVLENBQUksS0FBYztJQUNuQyxPQUFPLENBQUMsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDakMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSM0luamVjdG9yTWV0YWRhdGFGYWNhZGUsIGdldENvbXBpbGVyRmFjYWRlfSBmcm9tICcuLi8uLi9jb21waWxlci9jb21waWxlcl9mYWNhZGUnO1xuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi4vLi4vZGkvZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtOR19JTkpFQ1RPUl9ERUZ9IGZyb20gJy4uLy4uL2RpL2ludGVyZmFjZS9kZWZzJztcbmltcG9ydCB7cmVmbGVjdERlcGVuZGVuY2llc30gZnJvbSAnLi4vLi4vZGkvaml0L3V0aWwnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge3JlZ2lzdGVyTmdNb2R1bGVUeXBlfSBmcm9tICcuLi8uLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnlfbG9hZGVyJztcbmltcG9ydCB7Q29tcG9uZW50fSBmcm9tICcuLi8uLi9tZXRhZGF0YSc7XG5pbXBvcnQge01vZHVsZVdpdGhQcm92aWRlcnMsIE5nTW9kdWxlLCBOZ01vZHVsZURlZiwgTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9uZ19tb2R1bGUnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZiwgZ2V0RGlyZWN0aXZlRGVmLCBnZXROZ01vZHVsZURlZiwgZ2V0UGlwZURlZn0gZnJvbSAnLi4vZGVmaW5pdGlvbic7XG5pbXBvcnQge05HX0NPTVBPTkVOVF9ERUYsIE5HX0RJUkVDVElWRV9ERUYsIE5HX01PRFVMRV9ERUYsIE5HX1BJUEVfREVGfSBmcm9tICcuLi9maWVsZHMnO1xuaW1wb3J0IHtDb21wb25lbnREZWZ9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge05nTW9kdWxlVHlwZX0gZnJvbSAnLi4vbmdfbW9kdWxlX3JlZic7XG5pbXBvcnQge21heWJlVW53cmFwRm4sIHN0cmluZ2lmeUZvckVycm9yfSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuXG5pbXBvcnQge2FuZ3VsYXJDb3JlRW52fSBmcm9tICcuL2Vudmlyb25tZW50JztcblxuY29uc3QgRU1QVFlfQVJSQVk6IFR5cGU8YW55PltdID0gW107XG5cbmludGVyZmFjZSBNb2R1bGVRdWV1ZUl0ZW0ge1xuICBtb2R1bGVUeXBlOiBUeXBlPGFueT47XG4gIG5nTW9kdWxlOiBOZ01vZHVsZTtcbn1cblxuY29uc3QgbW9kdWxlUXVldWU6IE1vZHVsZVF1ZXVlSXRlbVtdID0gW107XG5cbi8qKlxuICogRW5xdWV1ZXMgbW9kdWxlRGVmIHRvIGJlIGNoZWNrZWQgbGF0ZXIgdG8gc2VlIGlmIHNjb3BlIGNhbiBiZSBzZXQgb24gaXRzXG4gKiBjb21wb25lbnQgZGVjbGFyYXRpb25zLlxuICovXG5mdW5jdGlvbiBlbnF1ZXVlTW9kdWxlRm9yRGVsYXllZFNjb3BpbmcobW9kdWxlVHlwZTogVHlwZTxhbnk+LCBuZ01vZHVsZTogTmdNb2R1bGUpIHtcbiAgbW9kdWxlUXVldWUucHVzaCh7bW9kdWxlVHlwZSwgbmdNb2R1bGV9KTtcbn1cblxubGV0IGZsdXNoaW5nTW9kdWxlUXVldWUgPSBmYWxzZTtcbi8qKlxuICogTG9vcHMgb3ZlciBxdWV1ZWQgbW9kdWxlIGRlZmluaXRpb25zLCBpZiBhIGdpdmVuIG1vZHVsZSBkZWZpbml0aW9uIGhhcyBhbGwgb2YgaXRzXG4gKiBkZWNsYXJhdGlvbnMgcmVzb2x2ZWQsIGl0IGRlcXVldWVzIHRoYXQgbW9kdWxlIGRlZmluaXRpb24gYW5kIHNldHMgdGhlIHNjb3BlIG9uXG4gKiBpdHMgZGVjbGFyYXRpb25zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmx1c2hNb2R1bGVTY29waW5nUXVldWVBc011Y2hBc1Bvc3NpYmxlKCkge1xuICBpZiAoIWZsdXNoaW5nTW9kdWxlUXVldWUpIHtcbiAgICBmbHVzaGluZ01vZHVsZVF1ZXVlID0gdHJ1ZTtcbiAgICB0cnkge1xuICAgICAgZm9yIChsZXQgaSA9IG1vZHVsZVF1ZXVlLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIGNvbnN0IHttb2R1bGVUeXBlLCBuZ01vZHVsZX0gPSBtb2R1bGVRdWV1ZVtpXTtcblxuICAgICAgICBpZiAobmdNb2R1bGUuZGVjbGFyYXRpb25zICYmIG5nTW9kdWxlLmRlY2xhcmF0aW9ucy5ldmVyeShpc1Jlc29sdmVkRGVjbGFyYXRpb24pKSB7XG4gICAgICAgICAgLy8gZGVxdWV1ZVxuICAgICAgICAgIG1vZHVsZVF1ZXVlLnNwbGljZShpLCAxKTtcbiAgICAgICAgICBzZXRTY29wZU9uRGVjbGFyZWRDb21wb25lbnRzKG1vZHVsZVR5cGUsIG5nTW9kdWxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICBmbHVzaGluZ01vZHVsZVF1ZXVlID0gZmFsc2U7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0cnV0aHkgaWYgYSBkZWNsYXJhdGlvbiBoYXMgcmVzb2x2ZWQuIElmIHRoZSBkZWNsYXJhdGlvbiBoYXBwZW5zIHRvIGJlXG4gKiBhbiBhcnJheSBvZiBkZWNsYXJhdGlvbnMsIGl0IHdpbGwgcmVjdXJzZSB0byBjaGVjayBlYWNoIGRlY2xhcmF0aW9uIGluIHRoYXQgYXJyYXlcbiAqICh3aGljaCBtYXkgYWxzbyBiZSBhcnJheXMpLlxuICovXG5mdW5jdGlvbiBpc1Jlc29sdmVkRGVjbGFyYXRpb24oZGVjbGFyYXRpb246IGFueVtdIHwgVHlwZTxhbnk+KTogYm9vbGVhbiB7XG4gIGlmIChBcnJheS5pc0FycmF5KGRlY2xhcmF0aW9uKSkge1xuICAgIHJldHVybiBkZWNsYXJhdGlvbi5ldmVyeShpc1Jlc29sdmVkRGVjbGFyYXRpb24pO1xuICB9XG4gIHJldHVybiAhIXJlc29sdmVGb3J3YXJkUmVmKGRlY2xhcmF0aW9uKTtcbn1cblxuLyoqXG4gKiBDb21waWxlcyBhIG1vZHVsZSBpbiBKSVQgbW9kZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGF1dG9tYXRpY2FsbHkgZ2V0cyBjYWxsZWQgd2hlbiBhIGNsYXNzIGhhcyBhIGBATmdNb2R1bGVgIGRlY29yYXRvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVOZ01vZHVsZShtb2R1bGVUeXBlOiBUeXBlPGFueT4sIG5nTW9kdWxlOiBOZ01vZHVsZSA9IHt9KTogdm9pZCB7XG4gIGNvbXBpbGVOZ01vZHVsZURlZnMobW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGUsIG5nTW9kdWxlKTtcblxuICAvLyBCZWNhdXNlIHdlIGRvbid0IGtub3cgaWYgYWxsIGRlY2xhcmF0aW9ucyBoYXZlIHJlc29sdmVkIHlldCBhdCB0aGUgbW9tZW50IHRoZVxuICAvLyBOZ01vZHVsZSBkZWNvcmF0b3IgaXMgZXhlY3V0aW5nLCB3ZSdyZSBlbnF1ZXVlaW5nIHRoZSBzZXR0aW5nIG9mIG1vZHVsZSBzY29wZVxuICAvLyBvbiBpdHMgZGVjbGFyYXRpb25zIHRvIGJlIHJ1biBhdCBhIGxhdGVyIHRpbWUgd2hlbiBhbGwgZGVjbGFyYXRpb25zIGZvciB0aGUgbW9kdWxlLFxuICAvLyBpbmNsdWRpbmcgZm9yd2FyZCByZWZzLCBoYXZlIHJlc29sdmVkLlxuICBlbnF1ZXVlTW9kdWxlRm9yRGVsYXllZFNjb3BpbmcobW9kdWxlVHlwZSwgbmdNb2R1bGUpO1xufVxuXG4vKipcbiAqIENvbXBpbGVzIGFuZCBhZGRzIHRoZSBgbmdNb2R1bGVEZWZgIGFuZCBgbmdJbmplY3RvckRlZmAgcHJvcGVydGllcyB0byB0aGUgbW9kdWxlIGNsYXNzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZU5nTW9kdWxlRGVmcyhtb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGUsIG5nTW9kdWxlOiBOZ01vZHVsZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChtb2R1bGVUeXBlLCAnUmVxdWlyZWQgdmFsdWUgbW9kdWxlVHlwZScpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChuZ01vZHVsZSwgJ1JlcXVpcmVkIHZhbHVlIG5nTW9kdWxlJyk7XG4gIGNvbnN0IGRlY2xhcmF0aW9uczogVHlwZTxhbnk+W10gPSBmbGF0dGVuKG5nTW9kdWxlLmRlY2xhcmF0aW9ucyB8fCBFTVBUWV9BUlJBWSk7XG5cbiAgbGV0IG5nTW9kdWxlRGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkobW9kdWxlVHlwZSwgTkdfTU9EVUxFX0RFRiwge1xuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChuZ01vZHVsZURlZiA9PT0gbnVsbCkge1xuICAgICAgICBuZ01vZHVsZURlZiA9IGdldENvbXBpbGVyRmFjYWRlKCkuY29tcGlsZU5nTW9kdWxlKFxuICAgICAgICAgICAgYW5ndWxhckNvcmVFbnYsIGBuZzovLyR7bW9kdWxlVHlwZS5uYW1lfS9uZ01vZHVsZURlZi5qc2AsIHtcbiAgICAgICAgICAgICAgdHlwZTogbW9kdWxlVHlwZSxcbiAgICAgICAgICAgICAgYm9vdHN0cmFwOiBmbGF0dGVuKG5nTW9kdWxlLmJvb3RzdHJhcCB8fCBFTVBUWV9BUlJBWSwgcmVzb2x2ZUZvcndhcmRSZWYpLFxuICAgICAgICAgICAgICBkZWNsYXJhdGlvbnM6IGRlY2xhcmF0aW9ucy5tYXAocmVzb2x2ZUZvcndhcmRSZWYpLFxuICAgICAgICAgICAgICBpbXBvcnRzOiBmbGF0dGVuKG5nTW9kdWxlLmltcG9ydHMgfHwgRU1QVFlfQVJSQVksIHJlc29sdmVGb3J3YXJkUmVmKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChleHBhbmRNb2R1bGVXaXRoUHJvdmlkZXJzKSxcbiAgICAgICAgICAgICAgZXhwb3J0czogZmxhdHRlbihuZ01vZHVsZS5leHBvcnRzIHx8IEVNUFRZX0FSUkFZLCByZXNvbHZlRm9yd2FyZFJlZilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoZXhwYW5kTW9kdWxlV2l0aFByb3ZpZGVycyksXG4gICAgICAgICAgICAgIGVtaXRJbmxpbmU6IHRydWUsXG4gICAgICAgICAgICAgIHNjaGVtYXM6IG5nTW9kdWxlLnNjaGVtYXMgPyBmbGF0dGVuKG5nTW9kdWxlLnNjaGVtYXMpIDogbnVsbCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5nTW9kdWxlRGVmO1xuICAgIH1cbiAgfSk7XG4gIGlmIChuZ01vZHVsZS5pZCkge1xuICAgIHJlZ2lzdGVyTmdNb2R1bGVUeXBlKG5nTW9kdWxlLmlkLCBtb2R1bGVUeXBlKTtcbiAgfVxuXG4gIGxldCBuZ0luamVjdG9yRGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkobW9kdWxlVHlwZSwgTkdfSU5KRUNUT1JfREVGLCB7XG4gICAgZ2V0OiAoKSA9PiB7XG4gICAgICBpZiAobmdJbmplY3RvckRlZiA9PT0gbnVsbCkge1xuICAgICAgICBuZ0Rldk1vZGUgJiYgdmVyaWZ5U2VtYW50aWNzT2ZOZ01vZHVsZURlZihtb2R1bGVUeXBlIGFzIGFueSBhcyBOZ01vZHVsZVR5cGUpO1xuICAgICAgICBjb25zdCBtZXRhOiBSM0luamVjdG9yTWV0YWRhdGFGYWNhZGUgPSB7XG4gICAgICAgICAgbmFtZTogbW9kdWxlVHlwZS5uYW1lLFxuICAgICAgICAgIHR5cGU6IG1vZHVsZVR5cGUsXG4gICAgICAgICAgZGVwczogcmVmbGVjdERlcGVuZGVuY2llcyhtb2R1bGVUeXBlKSxcbiAgICAgICAgICBwcm92aWRlcnM6IG5nTW9kdWxlLnByb3ZpZGVycyB8fCBFTVBUWV9BUlJBWSxcbiAgICAgICAgICBpbXBvcnRzOiBbXG4gICAgICAgICAgICAobmdNb2R1bGUuaW1wb3J0cyB8fCBFTVBUWV9BUlJBWSkubWFwKHJlc29sdmVGb3J3YXJkUmVmKSxcbiAgICAgICAgICAgIChuZ01vZHVsZS5leHBvcnRzIHx8IEVNUFRZX0FSUkFZKS5tYXAocmVzb2x2ZUZvcndhcmRSZWYpLFxuICAgICAgICAgIF0sXG4gICAgICAgIH07XG4gICAgICAgIG5nSW5qZWN0b3JEZWYgPSBnZXRDb21waWxlckZhY2FkZSgpLmNvbXBpbGVJbmplY3RvcihcbiAgICAgICAgICAgIGFuZ3VsYXJDb3JlRW52LCBgbmc6Ly8ke21vZHVsZVR5cGUubmFtZX0vbmdJbmplY3RvckRlZi5qc2AsIG1ldGEpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5nSW5qZWN0b3JEZWY7XG4gICAgfSxcbiAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGUsXG4gIH0pO1xufVxuXG5mdW5jdGlvbiB2ZXJpZnlTZW1hbnRpY3NPZk5nTW9kdWxlRGVmKG1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZSk6IHZvaWQge1xuICBpZiAodmVyaWZpZWROZ01vZHVsZS5nZXQobW9kdWxlVHlwZSkpIHJldHVybjtcbiAgdmVyaWZpZWROZ01vZHVsZS5zZXQobW9kdWxlVHlwZSwgdHJ1ZSk7XG4gIG1vZHVsZVR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZihtb2R1bGVUeXBlKTtcbiAgY29uc3QgbmdNb2R1bGVEZWYgPSBnZXROZ01vZHVsZURlZihtb2R1bGVUeXBlLCB0cnVlKTtcbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBkZWNsYXJhdGlvbnMgPSBtYXliZVVud3JhcEZuKG5nTW9kdWxlRGVmLmRlY2xhcmF0aW9ucyk7XG4gIGNvbnN0IGltcG9ydHMgPSBtYXliZVVud3JhcEZuKG5nTW9kdWxlRGVmLmltcG9ydHMpO1xuICBjb25zdCBleHBvcnRzID0gbWF5YmVVbndyYXBGbihuZ01vZHVsZURlZi5leHBvcnRzKTtcbiAgZGVjbGFyYXRpb25zLmZvckVhY2godmVyaWZ5RGVjbGFyYXRpb25zSGF2ZURlZmluaXRpb25zKTtcbiAgY29uc3QgY29tYmluZWREZWNsYXJhdGlvbnM6IFR5cGU8YW55PltdID0gW1xuICAgIC4uLmRlY2xhcmF0aW9ucy5tYXAocmVzb2x2ZUZvcndhcmRSZWYpLCAgLy9cbiAgICAuLi5mbGF0dGVuKGltcG9ydHMubWFwKGNvbXB1dGVDb21iaW5lZEV4cG9ydHMpLCByZXNvbHZlRm9yd2FyZFJlZiksXG4gIF07XG4gIGV4cG9ydHMuZm9yRWFjaCh2ZXJpZnlFeHBvcnRzQXJlRGVjbGFyZWRPclJlRXhwb3J0ZWQpO1xuICBkZWNsYXJhdGlvbnMuZm9yRWFjaCh2ZXJpZnlEZWNsYXJhdGlvbklzVW5pcXVlKTtcbiAgZGVjbGFyYXRpb25zLmZvckVhY2godmVyaWZ5Q29tcG9uZW50RW50cnlDb21wb25lbnRzSXNQYXJ0T2ZOZ01vZHVsZSk7XG5cbiAgY29uc3QgbmdNb2R1bGUgPSBnZXRBbm5vdGF0aW9uPE5nTW9kdWxlPihtb2R1bGVUeXBlLCAnTmdNb2R1bGUnKTtcbiAgaWYgKG5nTW9kdWxlKSB7XG4gICAgbmdNb2R1bGUuaW1wb3J0cyAmJlxuICAgICAgICBmbGF0dGVuKG5nTW9kdWxlLmltcG9ydHMsIHVud3JhcE1vZHVsZVdpdGhQcm92aWRlcnNJbXBvcnRzKVxuICAgICAgICAgICAgLmZvckVhY2godmVyaWZ5U2VtYW50aWNzT2ZOZ01vZHVsZURlZik7XG4gICAgbmdNb2R1bGUuYm9vdHN0cmFwICYmIG5nTW9kdWxlLmJvb3RzdHJhcC5mb3JFYWNoKHZlcmlmeUNvcnJlY3RCb290c3RyYXBUeXBlKTtcbiAgICBuZ01vZHVsZS5ib290c3RyYXAgJiYgbmdNb2R1bGUuYm9vdHN0cmFwLmZvckVhY2godmVyaWZ5Q29tcG9uZW50SXNQYXJ0T2ZOZ01vZHVsZSk7XG4gICAgbmdNb2R1bGUuZW50cnlDb21wb25lbnRzICYmIG5nTW9kdWxlLmVudHJ5Q29tcG9uZW50cy5mb3JFYWNoKHZlcmlmeUNvbXBvbmVudElzUGFydE9mTmdNb2R1bGUpO1xuICB9XG5cbiAgLy8gVGhyb3cgRXJyb3IgaWYgYW55IGVycm9ycyB3ZXJlIGRldGVjdGVkLlxuICBpZiAoZXJyb3JzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBFcnJvcihlcnJvcnMuam9pbignXFxuJykpO1xuICB9XG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICBmdW5jdGlvbiB2ZXJpZnlEZWNsYXJhdGlvbnNIYXZlRGVmaW5pdGlvbnModHlwZTogVHlwZTxhbnk+KTogdm9pZCB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICAgIGNvbnN0IGRlZiA9IGdldENvbXBvbmVudERlZih0eXBlKSB8fCBnZXREaXJlY3RpdmVEZWYodHlwZSkgfHwgZ2V0UGlwZURlZih0eXBlKTtcbiAgICBpZiAoIWRlZikge1xuICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgICAgYFVuZXhwZWN0ZWQgdmFsdWUgJyR7c3RyaW5naWZ5Rm9yRXJyb3IodHlwZSl9JyBkZWNsYXJlZCBieSB0aGUgbW9kdWxlICcke3N0cmluZ2lmeUZvckVycm9yKG1vZHVsZVR5cGUpfScuIFBsZWFzZSBhZGQgYSBAUGlwZS9ARGlyZWN0aXZlL0BDb21wb25lbnQgYW5ub3RhdGlvbi5gKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB2ZXJpZnlFeHBvcnRzQXJlRGVjbGFyZWRPclJlRXhwb3J0ZWQodHlwZTogVHlwZTxhbnk+KSB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICAgIGNvbnN0IGtpbmQgPSBnZXRDb21wb25lbnREZWYodHlwZSkgJiYgJ2NvbXBvbmVudCcgfHwgZ2V0RGlyZWN0aXZlRGVmKHR5cGUpICYmICdkaXJlY3RpdmUnIHx8XG4gICAgICAgIGdldFBpcGVEZWYodHlwZSkgJiYgJ3BpcGUnO1xuICAgIGlmIChraW5kKSB7XG4gICAgICAvLyBvbmx5IGNoZWNrZWQgaWYgd2UgYXJlIGRlY2xhcmVkIGFzIENvbXBvbmVudCwgRGlyZWN0aXZlLCBvciBQaXBlXG4gICAgICAvLyBNb2R1bGVzIGRvbid0IG5lZWQgdG8gYmUgZGVjbGFyZWQgb3IgaW1wb3J0ZWQuXG4gICAgICBpZiAoY29tYmluZWREZWNsYXJhdGlvbnMubGFzdEluZGV4T2YodHlwZSkgPT09IC0xKSB7XG4gICAgICAgIC8vIFdlIGFyZSBleHBvcnRpbmcgc29tZXRoaW5nIHdoaWNoIHdlIGRvbid0IGV4cGxpY2l0bHkgZGVjbGFyZSBvciBpbXBvcnQuXG4gICAgICAgIGVycm9ycy5wdXNoKFxuICAgICAgICAgICAgYENhbid0IGV4cG9ydCAke2tpbmR9ICR7c3RyaW5naWZ5Rm9yRXJyb3IodHlwZSl9IGZyb20gJHtzdHJpbmdpZnlGb3JFcnJvcihtb2R1bGVUeXBlKX0gYXMgaXQgd2FzIG5laXRoZXIgZGVjbGFyZWQgbm9yIGltcG9ydGVkIWApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHZlcmlmeURlY2xhcmF0aW9uSXNVbmlxdWUodHlwZTogVHlwZTxhbnk+KSB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICAgIGNvbnN0IGV4aXN0aW5nTW9kdWxlID0gb3duZXJOZ01vZHVsZS5nZXQodHlwZSk7XG4gICAgaWYgKGV4aXN0aW5nTW9kdWxlICYmIGV4aXN0aW5nTW9kdWxlICE9PSBtb2R1bGVUeXBlKSB7XG4gICAgICBjb25zdCBtb2R1bGVzID0gW2V4aXN0aW5nTW9kdWxlLCBtb2R1bGVUeXBlXS5tYXAoc3RyaW5naWZ5Rm9yRXJyb3IpLnNvcnQoKTtcbiAgICAgIGVycm9ycy5wdXNoKFxuICAgICAgICAgIGBUeXBlICR7c3RyaW5naWZ5Rm9yRXJyb3IodHlwZSl9IGlzIHBhcnQgb2YgdGhlIGRlY2xhcmF0aW9ucyBvZiAyIG1vZHVsZXM6ICR7bW9kdWxlc1swXX0gYW5kICR7bW9kdWxlc1sxXX0hIGAgK1xuICAgICAgICAgIGBQbGVhc2UgY29uc2lkZXIgbW92aW5nICR7c3RyaW5naWZ5Rm9yRXJyb3IodHlwZSl9IHRvIGEgaGlnaGVyIG1vZHVsZSB0aGF0IGltcG9ydHMgJHttb2R1bGVzWzBdfSBhbmQgJHttb2R1bGVzWzFdfS4gYCArXG4gICAgICAgICAgYFlvdSBjYW4gYWxzbyBjcmVhdGUgYSBuZXcgTmdNb2R1bGUgdGhhdCBleHBvcnRzIGFuZCBpbmNsdWRlcyAke3N0cmluZ2lmeUZvckVycm9yKHR5cGUpfSB0aGVuIGltcG9ydCB0aGF0IE5nTW9kdWxlIGluICR7bW9kdWxlc1swXX0gYW5kICR7bW9kdWxlc1sxXX0uYCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE1hcmsgdHlwZSBhcyBoYXZpbmcgb3duZXIuXG4gICAgICBvd25lck5nTW9kdWxlLnNldCh0eXBlLCBtb2R1bGVUeXBlKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB2ZXJpZnlDb21wb25lbnRJc1BhcnRPZk5nTW9kdWxlKHR5cGU6IFR5cGU8YW55Pikge1xuICAgIHR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlKTtcbiAgICBjb25zdCBleGlzdGluZ01vZHVsZSA9IG93bmVyTmdNb2R1bGUuZ2V0KHR5cGUpO1xuICAgIGlmICghZXhpc3RpbmdNb2R1bGUpIHtcbiAgICAgIGVycm9ycy5wdXNoKFxuICAgICAgICAgIGBDb21wb25lbnQgJHtzdHJpbmdpZnlGb3JFcnJvcih0eXBlKX0gaXMgbm90IHBhcnQgb2YgYW55IE5nTW9kdWxlIG9yIHRoZSBtb2R1bGUgaGFzIG5vdCBiZWVuIGltcG9ydGVkIGludG8geW91ciBtb2R1bGUuYCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdmVyaWZ5Q29ycmVjdEJvb3RzdHJhcFR5cGUodHlwZTogVHlwZTxhbnk+KSB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICAgIGlmICghZ2V0Q29tcG9uZW50RGVmKHR5cGUpKSB7XG4gICAgICBlcnJvcnMucHVzaChgJHtzdHJpbmdpZnlGb3JFcnJvcih0eXBlKX0gY2Fubm90IGJlIHVzZWQgYXMgYW4gZW50cnkgY29tcG9uZW50LmApO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHZlcmlmeUNvbXBvbmVudEVudHJ5Q29tcG9uZW50c0lzUGFydE9mTmdNb2R1bGUodHlwZTogVHlwZTxhbnk+KSB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICAgIGlmIChnZXRDb21wb25lbnREZWYodHlwZSkpIHtcbiAgICAgIC8vIFdlIGtub3cgd2UgYXJlIGNvbXBvbmVudFxuICAgICAgY29uc3QgY29tcG9uZW50ID0gZ2V0QW5ub3RhdGlvbjxDb21wb25lbnQ+KHR5cGUsICdDb21wb25lbnQnKTtcbiAgICAgIGlmIChjb21wb25lbnQgJiYgY29tcG9uZW50LmVudHJ5Q29tcG9uZW50cykge1xuICAgICAgICBjb21wb25lbnQuZW50cnlDb21wb25lbnRzLmZvckVhY2godmVyaWZ5Q29tcG9uZW50SXNQYXJ0T2ZOZ01vZHVsZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHVud3JhcE1vZHVsZVdpdGhQcm92aWRlcnNJbXBvcnRzKFxuICAgIHR5cGVPcldpdGhQcm92aWRlcnM6IE5nTW9kdWxlVHlwZTxhbnk+fCB7bmdNb2R1bGU6IE5nTW9kdWxlVHlwZTxhbnk+fSk6IE5nTW9kdWxlVHlwZTxhbnk+IHtcbiAgdHlwZU9yV2l0aFByb3ZpZGVycyA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGVPcldpdGhQcm92aWRlcnMpO1xuICByZXR1cm4gKHR5cGVPcldpdGhQcm92aWRlcnMgYXMgYW55KS5uZ01vZHVsZSB8fCB0eXBlT3JXaXRoUHJvdmlkZXJzO1xufVxuXG5mdW5jdGlvbiBnZXRBbm5vdGF0aW9uPFQ+KHR5cGU6IGFueSwgbmFtZTogc3RyaW5nKTogVHxudWxsIHtcbiAgbGV0IGFubm90YXRpb246IFR8bnVsbCA9IG51bGw7XG4gIGNvbGxlY3QodHlwZS5fX2Fubm90YXRpb25zX18pO1xuICBjb2xsZWN0KHR5cGUuZGVjb3JhdG9ycyk7XG4gIHJldHVybiBhbm5vdGF0aW9uO1xuXG4gIGZ1bmN0aW9uIGNvbGxlY3QoYW5ub3RhdGlvbnM6IGFueVtdIHwgbnVsbCkge1xuICAgIGlmIChhbm5vdGF0aW9ucykge1xuICAgICAgYW5ub3RhdGlvbnMuZm9yRWFjaChyZWFkQW5ub3RhdGlvbik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZEFubm90YXRpb24oXG4gICAgICBkZWNvcmF0b3I6IHt0eXBlOiB7cHJvdG90eXBlOiB7bmdNZXRhZGF0YU5hbWU6IHN0cmluZ30sIGFyZ3M6IGFueVtdfSwgYXJnczogYW55fSk6IHZvaWQge1xuICAgIGlmICghYW5ub3RhdGlvbikge1xuICAgICAgY29uc3QgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoZGVjb3JhdG9yKTtcbiAgICAgIGlmIChwcm90by5uZ01ldGFkYXRhTmFtZSA9PSBuYW1lKSB7XG4gICAgICAgIGFubm90YXRpb24gPSBkZWNvcmF0b3IgYXMgYW55O1xuICAgICAgfSBlbHNlIGlmIChkZWNvcmF0b3IudHlwZSkge1xuICAgICAgICBjb25zdCBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihkZWNvcmF0b3IudHlwZSk7XG4gICAgICAgIGlmIChwcm90by5uZ01ldGFkYXRhTmFtZSA9PSBuYW1lKSB7XG4gICAgICAgICAgYW5ub3RhdGlvbiA9IGRlY29yYXRvci5hcmdzWzBdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogS2VlcCB0cmFjayBvZiBjb21waWxlZCBjb21wb25lbnRzLiBUaGlzIGlzIG5lZWRlZCBiZWNhdXNlIGluIHRlc3RzIHdlIG9mdGVuIHdhbnQgdG8gY29tcGlsZSB0aGVcbiAqIHNhbWUgY29tcG9uZW50IHdpdGggbW9yZSB0aGFuIG9uZSBOZ01vZHVsZS4gVGhpcyB3b3VsZCBjYXVzZSBhbiBlcnJvciB1bmxlc3Mgd2UgcmVzZXQgd2hpY2hcbiAqIE5nTW9kdWxlIHRoZSBjb21wb25lbnQgYmVsb25ncyB0by4gV2Uga2VlcCB0aGUgbGlzdCBvZiBjb21waWxlZCBjb21wb25lbnRzIGhlcmUgc28gdGhhdCB0aGVcbiAqIFRlc3RCZWQgY2FuIHJlc2V0IGl0IGxhdGVyLlxuICovXG5sZXQgb3duZXJOZ01vZHVsZSA9IG5ldyBNYXA8VHlwZTxhbnk+LCBOZ01vZHVsZVR5cGU8YW55Pj4oKTtcbmxldCB2ZXJpZmllZE5nTW9kdWxlID0gbmV3IE1hcDxOZ01vZHVsZVR5cGU8YW55PiwgYm9vbGVhbj4oKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0Q29tcGlsZWRDb21wb25lbnRzKCk6IHZvaWQge1xuICBvd25lck5nTW9kdWxlID0gbmV3IE1hcDxUeXBlPGFueT4sIE5nTW9kdWxlVHlwZTxhbnk+PigpO1xuICB2ZXJpZmllZE5nTW9kdWxlID0gbmV3IE1hcDxOZ01vZHVsZVR5cGU8YW55PiwgYm9vbGVhbj4oKTtcbiAgbW9kdWxlUXVldWUubGVuZ3RoID0gMDtcbn1cblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgY29tYmluZWQgZGVjbGFyYXRpb25zIG9mIGV4cGxpY2l0IGRlY2xhcmF0aW9ucywgYXMgd2VsbCBhcyBkZWNsYXJhdGlvbnMgaW5oZXJpdGVkIGJ5XG4gKiB0cmF2ZXJzaW5nIHRoZSBleHBvcnRzIG9mIGltcG9ydGVkIG1vZHVsZXMuXG4gKiBAcGFyYW0gdHlwZVxuICovXG5mdW5jdGlvbiBjb21wdXRlQ29tYmluZWRFeHBvcnRzKHR5cGU6IFR5cGU8YW55Pik6IFR5cGU8YW55PltdIHtcbiAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICBjb25zdCBuZ01vZHVsZURlZiA9IGdldE5nTW9kdWxlRGVmKHR5cGUsIHRydWUpO1xuICByZXR1cm4gWy4uLmZsYXR0ZW4obWF5YmVVbndyYXBGbihuZ01vZHVsZURlZi5leHBvcnRzKS5tYXAoKHR5cGUpID0+IHtcbiAgICBjb25zdCBuZ01vZHVsZURlZiA9IGdldE5nTW9kdWxlRGVmKHR5cGUpO1xuICAgIGlmIChuZ01vZHVsZURlZikge1xuICAgICAgdmVyaWZ5U2VtYW50aWNzT2ZOZ01vZHVsZURlZih0eXBlIGFzIGFueSBhcyBOZ01vZHVsZVR5cGUpO1xuICAgICAgcmV0dXJuIGNvbXB1dGVDb21iaW5lZEV4cG9ydHModHlwZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0eXBlO1xuICAgIH1cbiAgfSkpXTtcbn1cblxuLyoqXG4gKiBTb21lIGRlY2xhcmVkIGNvbXBvbmVudHMgbWF5IGJlIGNvbXBpbGVkIGFzeW5jaHJvbm91c2x5LCBhbmQgdGh1cyBtYXkgbm90IGhhdmUgdGhlaXJcbiAqIG5nQ29tcG9uZW50RGVmIHNldCB5ZXQuIElmIHRoaXMgaXMgdGhlIGNhc2UsIHRoZW4gYSByZWZlcmVuY2UgdG8gdGhlIG1vZHVsZSBpcyB3cml0dGVuIGludG9cbiAqIHRoZSBgbmdTZWxlY3RvclNjb3BlYCBwcm9wZXJ0eSBvZiB0aGUgZGVjbGFyZWQgdHlwZS5cbiAqL1xuZnVuY3Rpb24gc2V0U2NvcGVPbkRlY2xhcmVkQ29tcG9uZW50cyhtb2R1bGVUeXBlOiBUeXBlPGFueT4sIG5nTW9kdWxlOiBOZ01vZHVsZSkge1xuICBjb25zdCBkZWNsYXJhdGlvbnM6IFR5cGU8YW55PltdID0gZmxhdHRlbihuZ01vZHVsZS5kZWNsYXJhdGlvbnMgfHwgRU1QVFlfQVJSQVkpO1xuXG4gIGNvbnN0IHRyYW5zaXRpdmVTY29wZXMgPSB0cmFuc2l0aXZlU2NvcGVzRm9yKG1vZHVsZVR5cGUpO1xuXG4gIGRlY2xhcmF0aW9ucy5mb3JFYWNoKGRlY2xhcmF0aW9uID0+IHtcbiAgICBpZiAoZGVjbGFyYXRpb24uaGFzT3duUHJvcGVydHkoTkdfQ09NUE9ORU5UX0RFRikpIHtcbiAgICAgIC8vIEFuIGBuZ0NvbXBvbmVudERlZmAgZmllbGQgZXhpc3RzIC0gZ28gYWhlYWQgYW5kIHBhdGNoIHRoZSBjb21wb25lbnQgZGlyZWN0bHkuXG4gICAgICBjb25zdCBjb21wb25lbnQgPSBkZWNsYXJhdGlvbiBhcyBUeXBlPGFueT4mIHtuZ0NvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPGFueT59O1xuICAgICAgY29uc3QgY29tcG9uZW50RGVmID0gZ2V0Q29tcG9uZW50RGVmKGNvbXBvbmVudCkgITtcbiAgICAgIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlKGNvbXBvbmVudERlZiwgdHJhbnNpdGl2ZVNjb3Blcyk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICAgIWRlY2xhcmF0aW9uLmhhc093blByb3BlcnR5KE5HX0RJUkVDVElWRV9ERUYpICYmICFkZWNsYXJhdGlvbi5oYXNPd25Qcm9wZXJ0eShOR19QSVBFX0RFRikpIHtcbiAgICAgIC8vIFNldCBgbmdTZWxlY3RvclNjb3BlYCBmb3IgZnV0dXJlIHJlZmVyZW5jZSB3aGVuIHRoZSBjb21wb25lbnQgY29tcGlsYXRpb24gZmluaXNoZXMuXG4gICAgICAoZGVjbGFyYXRpb24gYXMgVHlwZTxhbnk+JiB7bmdTZWxlY3RvclNjb3BlPzogYW55fSkubmdTZWxlY3RvclNjb3BlID0gbW9kdWxlVHlwZTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKipcbiAqIFBhdGNoIHRoZSBkZWZpbml0aW9uIG9mIGEgY29tcG9uZW50IHdpdGggZGlyZWN0aXZlcyBhbmQgcGlwZXMgZnJvbSB0aGUgY29tcGlsYXRpb24gc2NvcGUgb2ZcbiAqIGEgZ2l2ZW4gbW9kdWxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGU8Qz4oXG4gICAgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8Qz4sIHRyYW5zaXRpdmVTY29wZXM6IE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3Blcykge1xuICBjb21wb25lbnREZWYuZGlyZWN0aXZlRGVmcyA9ICgpID0+XG4gICAgICBBcnJheS5mcm9tKHRyYW5zaXRpdmVTY29wZXMuY29tcGlsYXRpb24uZGlyZWN0aXZlcylcbiAgICAgICAgICAubWFwKFxuICAgICAgICAgICAgICBkaXIgPT4gZGlyLmhhc093blByb3BlcnR5KE5HX0NPTVBPTkVOVF9ERUYpID8gZ2V0Q29tcG9uZW50RGVmKGRpcikgISA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXREaXJlY3RpdmVEZWYoZGlyKSAhKVxuICAgICAgICAgIC5maWx0ZXIoZGVmID0+ICEhZGVmKTtcbiAgY29tcG9uZW50RGVmLnBpcGVEZWZzID0gKCkgPT5cbiAgICAgIEFycmF5LmZyb20odHJhbnNpdGl2ZVNjb3Blcy5jb21waWxhdGlvbi5waXBlcykubWFwKHBpcGUgPT4gZ2V0UGlwZURlZihwaXBlKSAhKTtcbiAgY29tcG9uZW50RGVmLnNjaGVtYXMgPSB0cmFuc2l0aXZlU2NvcGVzLnNjaGVtYXM7XG5cbiAgLy8gU2luY2Ugd2UgYXZvaWQgQ29tcG9uZW50cy9EaXJlY3RpdmVzL1BpcGVzIHJlY29tcGlsaW5nIGluIGNhc2UgdGhlcmUgYXJlIG5vIG92ZXJyaWRlcywgd2VcbiAgLy8gbWF5IGZhY2UgYSBwcm9ibGVtIHdoZXJlIHByZXZpb3VzbHkgY29tcGlsZWQgZGVmcyBhdmFpbGFibGUgdG8gYSBnaXZlbiBDb21wb25lbnQvRGlyZWN0aXZlXG4gIC8vIGFyZSBjYWNoZWQgaW4gVFZpZXcgYW5kIG1heSBiZWNvbWUgc3RhbGUgKGluIGNhc2UgYW55IG9mIHRoZXNlIGRlZnMgZ2V0cyByZWNvbXBpbGVkKS4gSW5cbiAgLy8gb3JkZXIgdG8gYXZvaWQgdGhpcyBwcm9ibGVtLCB3ZSBmb3JjZSBmcmVzaCBUVmlldyB0byBiZSBjcmVhdGVkLlxuICBjb21wb25lbnREZWYudGVtcGxhdGUubmdQcml2YXRlRGF0YSA9IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBDb21wdXRlIHRoZSBwYWlyIG9mIHRyYW5zaXRpdmUgc2NvcGVzIChjb21waWxhdGlvbiBzY29wZSBhbmQgZXhwb3J0ZWQgc2NvcGUpIGZvciBhIGdpdmVuIG1vZHVsZS5cbiAqXG4gKiBUaGlzIG9wZXJhdGlvbiBpcyBtZW1vaXplZCBhbmQgdGhlIHJlc3VsdCBpcyBjYWNoZWQgb24gdGhlIG1vZHVsZSdzIGRlZmluaXRpb24uIEl0IGNhbiBiZSBjYWxsZWRcbiAqIG9uIG1vZHVsZXMgd2l0aCBjb21wb25lbnRzIHRoYXQgaGF2ZSBub3QgZnVsbHkgY29tcGlsZWQgeWV0LCBidXQgdGhlIHJlc3VsdCBzaG91bGQgbm90IGJlIHVzZWRcbiAqIHVudGlsIHRoZXkgaGF2ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zaXRpdmVTY29wZXNGb3I8VD4oXG4gICAgbW9kdWxlVHlwZTogVHlwZTxUPixcbiAgICBwcm9jZXNzTmdNb2R1bGVGbj86IChuZ01vZHVsZTogTmdNb2R1bGVUeXBlKSA9PiB2b2lkKTogTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzIHtcbiAgaWYgKCFpc05nTW9kdWxlKG1vZHVsZVR5cGUpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke21vZHVsZVR5cGUubmFtZX0gZG9lcyBub3QgaGF2ZSBhbiBuZ01vZHVsZURlZmApO1xuICB9XG4gIGNvbnN0IGRlZiA9IGdldE5nTW9kdWxlRGVmKG1vZHVsZVR5cGUpICE7XG5cbiAgaWYgKGRlZi50cmFuc2l0aXZlQ29tcGlsZVNjb3BlcyAhPT0gbnVsbCkge1xuICAgIHJldHVybiBkZWYudHJhbnNpdGl2ZUNvbXBpbGVTY29wZXM7XG4gIH1cblxuICBjb25zdCBzY29wZXM6IE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3BlcyA9IHtcbiAgICBzY2hlbWFzOiBkZWYuc2NoZW1hcyB8fCBudWxsLFxuICAgIGNvbXBpbGF0aW9uOiB7XG4gICAgICBkaXJlY3RpdmVzOiBuZXcgU2V0PGFueT4oKSxcbiAgICAgIHBpcGVzOiBuZXcgU2V0PGFueT4oKSxcbiAgICB9LFxuICAgIGV4cG9ydGVkOiB7XG4gICAgICBkaXJlY3RpdmVzOiBuZXcgU2V0PGFueT4oKSxcbiAgICAgIHBpcGVzOiBuZXcgU2V0PGFueT4oKSxcbiAgICB9LFxuICB9O1xuXG4gIG1heWJlVW53cmFwRm4oZGVmLmRlY2xhcmF0aW9ucykuZm9yRWFjaChkZWNsYXJlZCA9PiB7XG4gICAgY29uc3QgZGVjbGFyZWRXaXRoRGVmcyA9IGRlY2xhcmVkIGFzIFR5cGU8YW55PiYgeyBuZ1BpcGVEZWY/OiBhbnk7IH07XG5cbiAgICBpZiAoZ2V0UGlwZURlZihkZWNsYXJlZFdpdGhEZWZzKSkge1xuICAgICAgc2NvcGVzLmNvbXBpbGF0aW9uLnBpcGVzLmFkZChkZWNsYXJlZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEVpdGhlciBkZWNsYXJlZCBoYXMgYW4gbmdDb21wb25lbnREZWYgb3IgbmdEaXJlY3RpdmVEZWYsIG9yIGl0J3MgYSBjb21wb25lbnQgd2hpY2ggaGFzbid0XG4gICAgICAvLyBoYWQgaXRzIHRlbXBsYXRlIGNvbXBpbGVkIHlldC4gSW4gZWl0aGVyIGNhc2UsIGl0IGdldHMgYWRkZWQgdG8gdGhlIGNvbXBpbGF0aW9uJ3NcbiAgICAgIC8vIGRpcmVjdGl2ZXMuXG4gICAgICBzY29wZXMuY29tcGlsYXRpb24uZGlyZWN0aXZlcy5hZGQoZGVjbGFyZWQpO1xuICAgIH1cbiAgfSk7XG5cbiAgbWF5YmVVbndyYXBGbihkZWYuaW1wb3J0cykuZm9yRWFjaCg8ST4oaW1wb3J0ZWQ6IFR5cGU8ST4pID0+IHtcbiAgICBjb25zdCBpbXBvcnRlZFR5cGUgPSBpbXBvcnRlZCBhcyBUeXBlPEk+JiB7XG4gICAgICAvLyBJZiBpbXBvcnRlZCBpcyBhbiBATmdNb2R1bGU6XG4gICAgICBuZ01vZHVsZURlZj86IE5nTW9kdWxlRGVmPEk+O1xuICAgIH07XG5cbiAgICBpZiAoIWlzTmdNb2R1bGU8ST4oaW1wb3J0ZWRUeXBlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbXBvcnRpbmcgJHtpbXBvcnRlZFR5cGUubmFtZX0gd2hpY2ggZG9lcyBub3QgaGF2ZSBhbiBuZ01vZHVsZURlZmApO1xuICAgIH1cblxuICAgIGlmIChwcm9jZXNzTmdNb2R1bGVGbikge1xuICAgICAgcHJvY2Vzc05nTW9kdWxlRm4oaW1wb3J0ZWRUeXBlIGFzIE5nTW9kdWxlVHlwZSk7XG4gICAgfVxuXG4gICAgLy8gV2hlbiB0aGlzIG1vZHVsZSBpbXBvcnRzIGFub3RoZXIsIHRoZSBpbXBvcnRlZCBtb2R1bGUncyBleHBvcnRlZCBkaXJlY3RpdmVzIGFuZCBwaXBlcyBhcmVcbiAgICAvLyBhZGRlZCB0byB0aGUgY29tcGlsYXRpb24gc2NvcGUgb2YgdGhpcyBtb2R1bGUuXG4gICAgY29uc3QgaW1wb3J0ZWRTY29wZSA9IHRyYW5zaXRpdmVTY29wZXNGb3IoaW1wb3J0ZWRUeXBlLCBwcm9jZXNzTmdNb2R1bGVGbik7XG4gICAgaW1wb3J0ZWRTY29wZS5leHBvcnRlZC5kaXJlY3RpdmVzLmZvckVhY2goZW50cnkgPT4gc2NvcGVzLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMuYWRkKGVudHJ5KSk7XG4gICAgaW1wb3J0ZWRTY29wZS5leHBvcnRlZC5waXBlcy5mb3JFYWNoKGVudHJ5ID0+IHNjb3Blcy5jb21waWxhdGlvbi5waXBlcy5hZGQoZW50cnkpKTtcbiAgfSk7XG5cbiAgbWF5YmVVbndyYXBGbihkZWYuZXhwb3J0cykuZm9yRWFjaCg8RT4oZXhwb3J0ZWQ6IFR5cGU8RT4pID0+IHtcbiAgICBjb25zdCBleHBvcnRlZFR5cGUgPSBleHBvcnRlZCBhcyBUeXBlPEU+JiB7XG4gICAgICAvLyBDb21wb25lbnRzLCBEaXJlY3RpdmVzLCBOZ01vZHVsZXMsIGFuZCBQaXBlcyBjYW4gYWxsIGJlIGV4cG9ydGVkLlxuICAgICAgbmdDb21wb25lbnREZWY/OiBhbnk7XG4gICAgICBuZ0RpcmVjdGl2ZURlZj86IGFueTtcbiAgICAgIG5nTW9kdWxlRGVmPzogTmdNb2R1bGVEZWY8RT47XG4gICAgICBuZ1BpcGVEZWY/OiBhbnk7XG4gICAgfTtcblxuICAgIC8vIEVpdGhlciB0aGUgdHlwZSBpcyBhIG1vZHVsZSwgYSBwaXBlLCBvciBhIGNvbXBvbmVudC9kaXJlY3RpdmUgKHdoaWNoIG1heSBub3QgaGF2ZSBhblxuICAgIC8vIG5nQ29tcG9uZW50RGVmIGFzIGl0IG1pZ2h0IGJlIGNvbXBpbGVkIGFzeW5jaHJvbm91c2x5KS5cbiAgICBpZiAoaXNOZ01vZHVsZShleHBvcnRlZFR5cGUpKSB7XG4gICAgICAvLyBXaGVuIHRoaXMgbW9kdWxlIGV4cG9ydHMgYW5vdGhlciwgdGhlIGV4cG9ydGVkIG1vZHVsZSdzIGV4cG9ydGVkIGRpcmVjdGl2ZXMgYW5kIHBpcGVzIGFyZVxuICAgICAgLy8gYWRkZWQgdG8gYm90aCB0aGUgY29tcGlsYXRpb24gYW5kIGV4cG9ydGVkIHNjb3BlcyBvZiB0aGlzIG1vZHVsZS5cbiAgICAgIGNvbnN0IGV4cG9ydGVkU2NvcGUgPSB0cmFuc2l0aXZlU2NvcGVzRm9yKGV4cG9ydGVkVHlwZSwgcHJvY2Vzc05nTW9kdWxlRm4pO1xuICAgICAgZXhwb3J0ZWRTY29wZS5leHBvcnRlZC5kaXJlY3RpdmVzLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgICBzY29wZXMuY29tcGlsYXRpb24uZGlyZWN0aXZlcy5hZGQoZW50cnkpO1xuICAgICAgICBzY29wZXMuZXhwb3J0ZWQuZGlyZWN0aXZlcy5hZGQoZW50cnkpO1xuICAgICAgfSk7XG4gICAgICBleHBvcnRlZFNjb3BlLmV4cG9ydGVkLnBpcGVzLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgICBzY29wZXMuY29tcGlsYXRpb24ucGlwZXMuYWRkKGVudHJ5KTtcbiAgICAgICAgc2NvcGVzLmV4cG9ydGVkLnBpcGVzLmFkZChlbnRyeSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKGdldFBpcGVEZWYoZXhwb3J0ZWRUeXBlKSkge1xuICAgICAgc2NvcGVzLmV4cG9ydGVkLnBpcGVzLmFkZChleHBvcnRlZFR5cGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzY29wZXMuZXhwb3J0ZWQuZGlyZWN0aXZlcy5hZGQoZXhwb3J0ZWRUeXBlKTtcbiAgICB9XG4gIH0pO1xuXG4gIGRlZi50cmFuc2l0aXZlQ29tcGlsZVNjb3BlcyA9IHNjb3BlcztcbiAgcmV0dXJuIHNjb3Blcztcbn1cblxuZnVuY3Rpb24gZmxhdHRlbjxUPih2YWx1ZXM6IGFueVtdLCBtYXBGbj86ICh2YWx1ZTogVCkgPT4gYW55KTogVHlwZTxUPltdIHtcbiAgY29uc3Qgb3V0OiBUeXBlPFQ+W10gPSBbXTtcbiAgdmFsdWVzLmZvckVhY2godmFsdWUgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgb3V0LnB1c2goLi4uZmxhdHRlbjxUPih2YWx1ZSwgbWFwRm4pKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0LnB1c2gobWFwRm4gPyBtYXBGbih2YWx1ZSkgOiB2YWx1ZSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gZXhwYW5kTW9kdWxlV2l0aFByb3ZpZGVycyh2YWx1ZTogVHlwZTxhbnk+fCBNb2R1bGVXaXRoUHJvdmlkZXJzPHt9Pik6IFR5cGU8YW55PiB7XG4gIGlmIChpc01vZHVsZVdpdGhQcm92aWRlcnModmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLm5nTW9kdWxlO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gaXNNb2R1bGVXaXRoUHJvdmlkZXJzKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBNb2R1bGVXaXRoUHJvdmlkZXJzPHt9PiB7XG4gIHJldHVybiAodmFsdWUgYXN7bmdNb2R1bGU/OiBhbnl9KS5uZ01vZHVsZSAhPT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBpc05nTW9kdWxlPFQ+KHZhbHVlOiBUeXBlPFQ+KTogdmFsdWUgaXMgVHlwZTxUPiZ7bmdNb2R1bGVEZWY6IE5nTW9kdWxlRGVmPFQ+fSB7XG4gIHJldHVybiAhIWdldE5nTW9kdWxlRGVmKHZhbHVlKTtcbn1cbiJdfQ==