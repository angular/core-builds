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
import { flatten } from '../../util/array_utils';
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
 *
 * It's possible to compile a module via this API which will allow duplicate declarations in its
 * root.
 */
export function compileNgModuleDefs(moduleType, ngModule, allowDuplicateDeclarationsInRoot) {
    if (allowDuplicateDeclarationsInRoot === void 0) { allowDuplicateDeclarationsInRoot = false; }
    ngDevMode && assertDefined(moduleType, 'Required value moduleType');
    ngDevMode && assertDefined(ngModule, 'Required value ngModule');
    var declarations = flatten(ngModule.declarations || EMPTY_ARRAY);
    var ngModuleDef = null;
    Object.defineProperty(moduleType, NG_MODULE_DEF, {
        configurable: true,
        get: function () {
            if (ngModuleDef === null) {
                ngModuleDef = getCompilerFacade().compileNgModule(angularCoreEnv, "ng:///" + moduleType.name + "/ngModuleDef.js", {
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
        }
    });
    var ngInjectorDef = null;
    Object.defineProperty(moduleType, NG_INJECTOR_DEF, {
        get: function () {
            if (ngInjectorDef === null) {
                ngDevMode && verifySemanticsOfNgModuleDef(moduleType, allowDuplicateDeclarationsInRoot);
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
                ngInjectorDef = getCompilerFacade().compileInjector(angularCoreEnv, "ng:///" + moduleType.name + "/ngInjectorDef.js", meta);
            }
            return ngInjectorDef;
        },
        // Make the property configurable in dev mode to allow overriding in tests
        configurable: !!ngDevMode,
    });
}
function verifySemanticsOfNgModuleDef(moduleType, allowDuplicateDeclarationsInRoot) {
    if (verifiedNgModule.get(moduleType))
        return;
    verifiedNgModule.set(moduleType, true);
    moduleType = resolveForwardRef(moduleType);
    var ngModuleDef = getNgModuleDef(moduleType, true);
    var errors = [];
    var declarations = maybeUnwrapFn(ngModuleDef.declarations);
    var imports = maybeUnwrapFn(ngModuleDef.imports);
    flatten(imports)
        .map(unwrapModuleWithProvidersImports)
        .forEach(function (mod) { return verifySemanticsOfNgModuleDef(mod, false); });
    var exports = maybeUnwrapFn(ngModuleDef.exports);
    declarations.forEach(verifyDeclarationsHaveDefinitions);
    var combinedDeclarations = tslib_1.__spread(declarations.map(resolveForwardRef), flatten(imports.map(computeCombinedExports)).map(resolveForwardRef));
    exports.forEach(verifyExportsAreDeclaredOrReExported);
    declarations.forEach(function (decl) { return verifyDeclarationIsUnique(decl, allowDuplicateDeclarationsInRoot); });
    declarations.forEach(verifyComponentEntryComponentsIsPartOfNgModule);
    var ngModule = getAnnotation(moduleType, 'NgModule');
    if (ngModule) {
        ngModule.imports &&
            flatten(ngModule.imports)
                .map(unwrapModuleWithProvidersImports)
                .forEach(function (mod) { return verifySemanticsOfNgModuleDef(mod, false); });
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
    function verifyDeclarationIsUnique(type, suppressErrors) {
        type = resolveForwardRef(type);
        var existingModule = ownerNgModule.get(type);
        if (existingModule && existingModule !== moduleType) {
            if (!suppressErrors) {
                var modules = [existingModule, moduleType].map(stringifyForError).sort();
                errors.push("Type " + stringifyForError(type) + " is part of the declarations of 2 modules: " + modules[0] + " and " + modules[1] + "! " +
                    ("Please consider moving " + stringifyForError(type) + " to a higher module that imports " + modules[0] + " and " + modules[1] + ". ") +
                    ("You can also create a new NgModule that exports and includes " + stringifyForError(type) + " then import that NgModule in " + modules[0] + " and " + modules[1] + "."));
            }
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
            verifySemanticsOfNgModuleDef(type, false);
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
    componentDef.tView = null;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvbW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQTJCLGlCQUFpQixFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFDM0YsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDdkQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQ3hELE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBSXRELE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUMvQyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLGVBQWUsRUFBRSxlQUFlLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMzRixPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUd6RixPQUFPLEVBQUMsYUFBYSxFQUFFLGlCQUFpQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFcEUsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUU3QyxJQUFNLFdBQVcsR0FBZ0IsRUFBRSxDQUFDO0FBT3BDLElBQU0sV0FBVyxHQUFzQixFQUFFLENBQUM7QUFFMUM7OztHQUdHO0FBQ0gsU0FBUyw4QkFBOEIsQ0FBQyxVQUFxQixFQUFFLFFBQWtCO0lBQy9FLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBQyxVQUFVLFlBQUEsRUFBRSxRQUFRLFVBQUEsRUFBQyxDQUFDLENBQUM7QUFDM0MsQ0FBQztBQUVELElBQUksbUJBQW1CLEdBQUcs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Q3JDLE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFFRCxTQUFTLHlCQUF5QixDQUFDLEtBQXlDO0lBQzFFLElBQUkscUJBQXFCLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDaEMsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDO0tBQ3ZCO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxLQUFVO0lBQ3ZDLE9BQVEsS0FBeUIsQ0FBQyxRQUFRLEtBQUssU0FBUyxDQUFDO0FBQzNELENBQUM7QUFFRCxTQUFTLFVBQVUsQ0FBSSxLQUFjO0lBQ25DLE9BQU8sQ0FBQyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1IzSW5qZWN0b3JNZXRhZGF0YUZhY2FkZSwgZ2V0Q29tcGlsZXJGYWNhZGV9IGZyb20gJy4uLy4uL2NvbXBpbGVyL2NvbXBpbGVyX2ZhY2FkZSc7XG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuLi8uLi9kaS9mb3J3YXJkX3JlZic7XG5pbXBvcnQge05HX0lOSkVDVE9SX0RFRn0gZnJvbSAnLi4vLi4vZGkvaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtyZWZsZWN0RGVwZW5kZW5jaWVzfSBmcm9tICcuLi8uLi9kaS9qaXQvdXRpbCc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Q29tcG9uZW50fSBmcm9tICcuLi8uLi9tZXRhZGF0YSc7XG5pbXBvcnQge01vZHVsZVdpdGhQcm92aWRlcnMsIE5nTW9kdWxlLCBOZ01vZHVsZURlZiwgTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9uZ19tb2R1bGUnO1xuaW1wb3J0IHtmbGF0dGVufSBmcm9tICcuLi8uLi91dGlsL2FycmF5X3V0aWxzJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZH0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWYsIGdldERpcmVjdGl2ZURlZiwgZ2V0TmdNb2R1bGVEZWYsIGdldFBpcGVEZWZ9IGZyb20gJy4uL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOR19DT01QT05FTlRfREVGLCBOR19ESVJFQ1RJVkVfREVGLCBOR19NT0RVTEVfREVGLCBOR19QSVBFX0RFRn0gZnJvbSAnLi4vZmllbGRzJztcbmltcG9ydCB7Q29tcG9uZW50RGVmfSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOZ01vZHVsZVR5cGV9IGZyb20gJy4uL25nX21vZHVsZV9yZWYnO1xuaW1wb3J0IHttYXliZVVud3JhcEZuLCBzdHJpbmdpZnlGb3JFcnJvcn0gZnJvbSAnLi4vdXRpbC9taXNjX3V0aWxzJztcblxuaW1wb3J0IHthbmd1bGFyQ29yZUVudn0gZnJvbSAnLi9lbnZpcm9ubWVudCc7XG5cbmNvbnN0IEVNUFRZX0FSUkFZOiBUeXBlPGFueT5bXSA9IFtdO1xuXG5pbnRlcmZhY2UgTW9kdWxlUXVldWVJdGVtIHtcbiAgbW9kdWxlVHlwZTogVHlwZTxhbnk+O1xuICBuZ01vZHVsZTogTmdNb2R1bGU7XG59XG5cbmNvbnN0IG1vZHVsZVF1ZXVlOiBNb2R1bGVRdWV1ZUl0ZW1bXSA9IFtdO1xuXG4vKipcbiAqIEVucXVldWVzIG1vZHVsZURlZiB0byBiZSBjaGVja2VkIGxhdGVyIHRvIHNlZSBpZiBzY29wZSBjYW4gYmUgc2V0IG9uIGl0c1xuICogY29tcG9uZW50IGRlY2xhcmF0aW9ucy5cbiAqL1xuZnVuY3Rpb24gZW5xdWV1ZU1vZHVsZUZvckRlbGF5ZWRTY29waW5nKG1vZHVsZVR5cGU6IFR5cGU8YW55PiwgbmdNb2R1bGU6IE5nTW9kdWxlKSB7XG4gIG1vZHVsZVF1ZXVlLnB1c2goe21vZHVsZVR5cGUsIG5nTW9kdWxlfSk7XG59XG5cbmxldCBmbHVzaGluZ01vZHVsZVF1ZXVlID0gZmFsc2U7XG4vKipcbiAqIExvb3BzIG92ZXIgcXVldWVkIG1vZHVsZSBkZWZpbml0aW9ucywgaWYgYSBnaXZlbiBtb2R1bGUgZGVmaW5pdGlvbiBoYXMgYWxsIG9mIGl0c1xuICogZGVjbGFyYXRpb25zIHJlc29sdmVkLCBpdCBkZXF1ZXVlcyB0aGF0IG1vZHVsZSBkZWZpbml0aW9uIGFuZCBzZXRzIHRoZSBzY29wZSBvblxuICogaXRzIGRlY2xhcmF0aW9ucy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZsdXNoTW9kdWxlU2NvcGluZ1F1ZXVlQXNNdWNoQXNQb3NzaWJsZSgpIHtcbiAgaWYgKCFmbHVzaGluZ01vZHVsZVF1ZXVlKSB7XG4gICAgZmx1c2hpbmdNb2R1bGVRdWV1ZSA9IHRydWU7XG4gICAgdHJ5IHtcbiAgICAgIGZvciAobGV0IGkgPSBtb2R1bGVRdWV1ZS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBjb25zdCB7bW9kdWxlVHlwZSwgbmdNb2R1bGV9ID0gbW9kdWxlUXVldWVbaV07XG5cbiAgICAgICAgaWYgKG5nTW9kdWxlLmRlY2xhcmF0aW9ucyAmJiBuZ01vZHVsZS5kZWNsYXJhdGlvbnMuZXZlcnkoaXNSZXNvbHZlZERlY2xhcmF0aW9uKSkge1xuICAgICAgICAgIC8vIGRlcXVldWVcbiAgICAgICAgICBtb2R1bGVRdWV1ZS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgc2V0U2NvcGVPbkRlY2xhcmVkQ29tcG9uZW50cyhtb2R1bGVUeXBlLCBuZ01vZHVsZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgZmx1c2hpbmdNb2R1bGVRdWV1ZSA9IGZhbHNlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1dGh5IGlmIGEgZGVjbGFyYXRpb24gaGFzIHJlc29sdmVkLiBJZiB0aGUgZGVjbGFyYXRpb24gaGFwcGVucyB0byBiZVxuICogYW4gYXJyYXkgb2YgZGVjbGFyYXRpb25zLCBpdCB3aWxsIHJlY3Vyc2UgdG8gY2hlY2sgZWFjaCBkZWNsYXJhdGlvbiBpbiB0aGF0IGFycmF5XG4gKiAod2hpY2ggbWF5IGFsc28gYmUgYXJyYXlzKS5cbiAqL1xuZnVuY3Rpb24gaXNSZXNvbHZlZERlY2xhcmF0aW9uKGRlY2xhcmF0aW9uOiBhbnlbXSB8IFR5cGU8YW55Pik6IGJvb2xlYW4ge1xuICBpZiAoQXJyYXkuaXNBcnJheShkZWNsYXJhdGlvbikpIHtcbiAgICByZXR1cm4gZGVjbGFyYXRpb24uZXZlcnkoaXNSZXNvbHZlZERlY2xhcmF0aW9uKTtcbiAgfVxuICByZXR1cm4gISFyZXNvbHZlRm9yd2FyZFJlZihkZWNsYXJhdGlvbik7XG59XG5cbi8qKlxuICogQ29tcGlsZXMgYSBtb2R1bGUgaW4gSklUIG1vZGUuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBhdXRvbWF0aWNhbGx5IGdldHMgY2FsbGVkIHdoZW4gYSBjbGFzcyBoYXMgYSBgQE5nTW9kdWxlYCBkZWNvcmF0b3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlTmdNb2R1bGUobW9kdWxlVHlwZTogVHlwZTxhbnk+LCBuZ01vZHVsZTogTmdNb2R1bGUgPSB7fSk6IHZvaWQge1xuICBjb21waWxlTmdNb2R1bGVEZWZzKG1vZHVsZVR5cGUgYXMgTmdNb2R1bGVUeXBlLCBuZ01vZHVsZSk7XG5cbiAgLy8gQmVjYXVzZSB3ZSBkb24ndCBrbm93IGlmIGFsbCBkZWNsYXJhdGlvbnMgaGF2ZSByZXNvbHZlZCB5ZXQgYXQgdGhlIG1vbWVudCB0aGVcbiAgLy8gTmdNb2R1bGUgZGVjb3JhdG9yIGlzIGV4ZWN1dGluZywgd2UncmUgZW5xdWV1ZWluZyB0aGUgc2V0dGluZyBvZiBtb2R1bGUgc2NvcGVcbiAgLy8gb24gaXRzIGRlY2xhcmF0aW9ucyB0byBiZSBydW4gYXQgYSBsYXRlciB0aW1lIHdoZW4gYWxsIGRlY2xhcmF0aW9ucyBmb3IgdGhlIG1vZHVsZSxcbiAgLy8gaW5jbHVkaW5nIGZvcndhcmQgcmVmcywgaGF2ZSByZXNvbHZlZC5cbiAgZW5xdWV1ZU1vZHVsZUZvckRlbGF5ZWRTY29waW5nKG1vZHVsZVR5cGUsIG5nTW9kdWxlKTtcbn1cblxuLyoqXG4gKiBDb21waWxlcyBhbmQgYWRkcyB0aGUgYG5nTW9kdWxlRGVmYCBhbmQgYG5nSW5qZWN0b3JEZWZgIHByb3BlcnRpZXMgdG8gdGhlIG1vZHVsZSBjbGFzcy5cbiAqXG4gKiBJdCdzIHBvc3NpYmxlIHRvIGNvbXBpbGUgYSBtb2R1bGUgdmlhIHRoaXMgQVBJIHdoaWNoIHdpbGwgYWxsb3cgZHVwbGljYXRlIGRlY2xhcmF0aW9ucyBpbiBpdHNcbiAqIHJvb3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlTmdNb2R1bGVEZWZzKFxuICAgIG1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZSwgbmdNb2R1bGU6IE5nTW9kdWxlLFxuICAgIGFsbG93RHVwbGljYXRlRGVjbGFyYXRpb25zSW5Sb290OiBib29sZWFuID0gZmFsc2UpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobW9kdWxlVHlwZSwgJ1JlcXVpcmVkIHZhbHVlIG1vZHVsZVR5cGUnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobmdNb2R1bGUsICdSZXF1aXJlZCB2YWx1ZSBuZ01vZHVsZScpO1xuICBjb25zdCBkZWNsYXJhdGlvbnM6IFR5cGU8YW55PltdID0gZmxhdHRlbihuZ01vZHVsZS5kZWNsYXJhdGlvbnMgfHwgRU1QVFlfQVJSQVkpO1xuICBsZXQgbmdNb2R1bGVEZWY6IGFueSA9IG51bGw7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShtb2R1bGVUeXBlLCBOR19NT0RVTEVfREVGLCB7XG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKG5nTW9kdWxlRGVmID09PSBudWxsKSB7XG4gICAgICAgIG5nTW9kdWxlRGVmID0gZ2V0Q29tcGlsZXJGYWNhZGUoKS5jb21waWxlTmdNb2R1bGUoXG4gICAgICAgICAgICBhbmd1bGFyQ29yZUVudiwgYG5nOi8vLyR7bW9kdWxlVHlwZS5uYW1lfS9uZ01vZHVsZURlZi5qc2AsIHtcbiAgICAgICAgICAgICAgdHlwZTogbW9kdWxlVHlwZSxcbiAgICAgICAgICAgICAgYm9vdHN0cmFwOiBmbGF0dGVuKG5nTW9kdWxlLmJvb3RzdHJhcCB8fCBFTVBUWV9BUlJBWSkubWFwKHJlc29sdmVGb3J3YXJkUmVmKSxcbiAgICAgICAgICAgICAgZGVjbGFyYXRpb25zOiBkZWNsYXJhdGlvbnMubWFwKHJlc29sdmVGb3J3YXJkUmVmKSxcbiAgICAgICAgICAgICAgaW1wb3J0czogZmxhdHRlbihuZ01vZHVsZS5pbXBvcnRzIHx8IEVNUFRZX0FSUkFZKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChyZXNvbHZlRm9yd2FyZFJlZilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoZXhwYW5kTW9kdWxlV2l0aFByb3ZpZGVycyksXG4gICAgICAgICAgICAgIGV4cG9ydHM6IGZsYXR0ZW4obmdNb2R1bGUuZXhwb3J0cyB8fCBFTVBUWV9BUlJBWSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAocmVzb2x2ZUZvcndhcmRSZWYpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKGV4cGFuZE1vZHVsZVdpdGhQcm92aWRlcnMpLFxuICAgICAgICAgICAgICBlbWl0SW5saW5lOiB0cnVlLFxuICAgICAgICAgICAgICBzY2hlbWFzOiBuZ01vZHVsZS5zY2hlbWFzID8gZmxhdHRlbihuZ01vZHVsZS5zY2hlbWFzKSA6IG51bGwsXG4gICAgICAgICAgICAgIGlkOiBuZ01vZHVsZS5pZCB8fCBudWxsLFxuICAgICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmdNb2R1bGVEZWY7XG4gICAgfVxuICB9KTtcblxuICBsZXQgbmdJbmplY3RvckRlZjogYW55ID0gbnVsbDtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG1vZHVsZVR5cGUsIE5HX0lOSkVDVE9SX0RFRiwge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKG5nSW5qZWN0b3JEZWYgPT09IG51bGwpIHtcbiAgICAgICAgbmdEZXZNb2RlICYmIHZlcmlmeVNlbWFudGljc09mTmdNb2R1bGVEZWYoXG4gICAgICAgICAgICAgICAgICAgICAgICAgbW9kdWxlVHlwZSBhcyBhbnkgYXMgTmdNb2R1bGVUeXBlLCBhbGxvd0R1cGxpY2F0ZURlY2xhcmF0aW9uc0luUm9vdCk7XG4gICAgICAgIGNvbnN0IG1ldGE6IFIzSW5qZWN0b3JNZXRhZGF0YUZhY2FkZSA9IHtcbiAgICAgICAgICBuYW1lOiBtb2R1bGVUeXBlLm5hbWUsXG4gICAgICAgICAgdHlwZTogbW9kdWxlVHlwZSxcbiAgICAgICAgICBkZXBzOiByZWZsZWN0RGVwZW5kZW5jaWVzKG1vZHVsZVR5cGUpLFxuICAgICAgICAgIHByb3ZpZGVyczogbmdNb2R1bGUucHJvdmlkZXJzIHx8IEVNUFRZX0FSUkFZLFxuICAgICAgICAgIGltcG9ydHM6IFtcbiAgICAgICAgICAgIChuZ01vZHVsZS5pbXBvcnRzIHx8IEVNUFRZX0FSUkFZKS5tYXAocmVzb2x2ZUZvcndhcmRSZWYpLFxuICAgICAgICAgICAgKG5nTW9kdWxlLmV4cG9ydHMgfHwgRU1QVFlfQVJSQVkpLm1hcChyZXNvbHZlRm9yd2FyZFJlZiksXG4gICAgICAgICAgXSxcbiAgICAgICAgfTtcbiAgICAgICAgbmdJbmplY3RvckRlZiA9IGdldENvbXBpbGVyRmFjYWRlKCkuY29tcGlsZUluamVjdG9yKFxuICAgICAgICAgICAgYW5ndWxhckNvcmVFbnYsIGBuZzovLy8ke21vZHVsZVR5cGUubmFtZX0vbmdJbmplY3RvckRlZi5qc2AsIG1ldGEpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5nSW5qZWN0b3JEZWY7XG4gICAgfSxcbiAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGUsXG4gIH0pO1xufVxuXG5mdW5jdGlvbiB2ZXJpZnlTZW1hbnRpY3NPZk5nTW9kdWxlRGVmKFxuICAgIG1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZSwgYWxsb3dEdXBsaWNhdGVEZWNsYXJhdGlvbnNJblJvb3Q6IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKHZlcmlmaWVkTmdNb2R1bGUuZ2V0KG1vZHVsZVR5cGUpKSByZXR1cm47XG4gIHZlcmlmaWVkTmdNb2R1bGUuc2V0KG1vZHVsZVR5cGUsIHRydWUpO1xuICBtb2R1bGVUeXBlID0gcmVzb2x2ZUZvcndhcmRSZWYobW9kdWxlVHlwZSk7XG4gIGNvbnN0IG5nTW9kdWxlRGVmID0gZ2V0TmdNb2R1bGVEZWYobW9kdWxlVHlwZSwgdHJ1ZSk7XG4gIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgZGVjbGFyYXRpb25zID0gbWF5YmVVbndyYXBGbihuZ01vZHVsZURlZi5kZWNsYXJhdGlvbnMpO1xuICBjb25zdCBpbXBvcnRzID0gbWF5YmVVbndyYXBGbihuZ01vZHVsZURlZi5pbXBvcnRzKTtcbiAgZmxhdHRlbihpbXBvcnRzKVxuICAgICAgLm1hcCh1bndyYXBNb2R1bGVXaXRoUHJvdmlkZXJzSW1wb3J0cylcbiAgICAgIC5mb3JFYWNoKG1vZCA9PiB2ZXJpZnlTZW1hbnRpY3NPZk5nTW9kdWxlRGVmKG1vZCwgZmFsc2UpKTtcbiAgY29uc3QgZXhwb3J0cyA9IG1heWJlVW53cmFwRm4obmdNb2R1bGVEZWYuZXhwb3J0cyk7XG4gIGRlY2xhcmF0aW9ucy5mb3JFYWNoKHZlcmlmeURlY2xhcmF0aW9uc0hhdmVEZWZpbml0aW9ucyk7XG4gIGNvbnN0IGNvbWJpbmVkRGVjbGFyYXRpb25zOiBUeXBlPGFueT5bXSA9IFtcbiAgICAuLi5kZWNsYXJhdGlvbnMubWFwKHJlc29sdmVGb3J3YXJkUmVmKSwgIC8vXG4gICAgLi4uZmxhdHRlbihpbXBvcnRzLm1hcChjb21wdXRlQ29tYmluZWRFeHBvcnRzKSkubWFwKHJlc29sdmVGb3J3YXJkUmVmKSxcbiAgXTtcbiAgZXhwb3J0cy5mb3JFYWNoKHZlcmlmeUV4cG9ydHNBcmVEZWNsYXJlZE9yUmVFeHBvcnRlZCk7XG4gIGRlY2xhcmF0aW9ucy5mb3JFYWNoKGRlY2wgPT4gdmVyaWZ5RGVjbGFyYXRpb25Jc1VuaXF1ZShkZWNsLCBhbGxvd0R1cGxpY2F0ZURlY2xhcmF0aW9uc0luUm9vdCkpO1xuICBkZWNsYXJhdGlvbnMuZm9yRWFjaCh2ZXJpZnlDb21wb25lbnRFbnRyeUNvbXBvbmVudHNJc1BhcnRPZk5nTW9kdWxlKTtcblxuICBjb25zdCBuZ01vZHVsZSA9IGdldEFubm90YXRpb248TmdNb2R1bGU+KG1vZHVsZVR5cGUsICdOZ01vZHVsZScpO1xuICBpZiAobmdNb2R1bGUpIHtcbiAgICBuZ01vZHVsZS5pbXBvcnRzICYmXG4gICAgICAgIGZsYXR0ZW4obmdNb2R1bGUuaW1wb3J0cylcbiAgICAgICAgICAgIC5tYXAodW53cmFwTW9kdWxlV2l0aFByb3ZpZGVyc0ltcG9ydHMpXG4gICAgICAgICAgICAuZm9yRWFjaChtb2QgPT4gdmVyaWZ5U2VtYW50aWNzT2ZOZ01vZHVsZURlZihtb2QsIGZhbHNlKSk7XG4gICAgbmdNb2R1bGUuYm9vdHN0cmFwICYmIG5nTW9kdWxlLmJvb3RzdHJhcC5mb3JFYWNoKHZlcmlmeUNvcnJlY3RCb290c3RyYXBUeXBlKTtcbiAgICBuZ01vZHVsZS5ib290c3RyYXAgJiYgbmdNb2R1bGUuYm9vdHN0cmFwLmZvckVhY2godmVyaWZ5Q29tcG9uZW50SXNQYXJ0T2ZOZ01vZHVsZSk7XG4gICAgbmdNb2R1bGUuZW50cnlDb21wb25lbnRzICYmIG5nTW9kdWxlLmVudHJ5Q29tcG9uZW50cy5mb3JFYWNoKHZlcmlmeUNvbXBvbmVudElzUGFydE9mTmdNb2R1bGUpO1xuICB9XG5cbiAgLy8gVGhyb3cgRXJyb3IgaWYgYW55IGVycm9ycyB3ZXJlIGRldGVjdGVkLlxuICBpZiAoZXJyb3JzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBFcnJvcihlcnJvcnMuam9pbignXFxuJykpO1xuICB9XG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICBmdW5jdGlvbiB2ZXJpZnlEZWNsYXJhdGlvbnNIYXZlRGVmaW5pdGlvbnModHlwZTogVHlwZTxhbnk+KTogdm9pZCB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICAgIGNvbnN0IGRlZiA9IGdldENvbXBvbmVudERlZih0eXBlKSB8fCBnZXREaXJlY3RpdmVEZWYodHlwZSkgfHwgZ2V0UGlwZURlZih0eXBlKTtcbiAgICBpZiAoIWRlZikge1xuICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgICAgYFVuZXhwZWN0ZWQgdmFsdWUgJyR7c3RyaW5naWZ5Rm9yRXJyb3IodHlwZSl9JyBkZWNsYXJlZCBieSB0aGUgbW9kdWxlICcke3N0cmluZ2lmeUZvckVycm9yKG1vZHVsZVR5cGUpfScuIFBsZWFzZSBhZGQgYSBAUGlwZS9ARGlyZWN0aXZlL0BDb21wb25lbnQgYW5ub3RhdGlvbi5gKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB2ZXJpZnlFeHBvcnRzQXJlRGVjbGFyZWRPclJlRXhwb3J0ZWQodHlwZTogVHlwZTxhbnk+KSB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICAgIGNvbnN0IGtpbmQgPSBnZXRDb21wb25lbnREZWYodHlwZSkgJiYgJ2NvbXBvbmVudCcgfHwgZ2V0RGlyZWN0aXZlRGVmKHR5cGUpICYmICdkaXJlY3RpdmUnIHx8XG4gICAgICAgIGdldFBpcGVEZWYodHlwZSkgJiYgJ3BpcGUnO1xuICAgIGlmIChraW5kKSB7XG4gICAgICAvLyBvbmx5IGNoZWNrZWQgaWYgd2UgYXJlIGRlY2xhcmVkIGFzIENvbXBvbmVudCwgRGlyZWN0aXZlLCBvciBQaXBlXG4gICAgICAvLyBNb2R1bGVzIGRvbid0IG5lZWQgdG8gYmUgZGVjbGFyZWQgb3IgaW1wb3J0ZWQuXG4gICAgICBpZiAoY29tYmluZWREZWNsYXJhdGlvbnMubGFzdEluZGV4T2YodHlwZSkgPT09IC0xKSB7XG4gICAgICAgIC8vIFdlIGFyZSBleHBvcnRpbmcgc29tZXRoaW5nIHdoaWNoIHdlIGRvbid0IGV4cGxpY2l0bHkgZGVjbGFyZSBvciBpbXBvcnQuXG4gICAgICAgIGVycm9ycy5wdXNoKFxuICAgICAgICAgICAgYENhbid0IGV4cG9ydCAke2tpbmR9ICR7c3RyaW5naWZ5Rm9yRXJyb3IodHlwZSl9IGZyb20gJHtzdHJpbmdpZnlGb3JFcnJvcihtb2R1bGVUeXBlKX0gYXMgaXQgd2FzIG5laXRoZXIgZGVjbGFyZWQgbm9yIGltcG9ydGVkIWApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHZlcmlmeURlY2xhcmF0aW9uSXNVbmlxdWUodHlwZTogVHlwZTxhbnk+LCBzdXBwcmVzc0Vycm9yczogYm9vbGVhbikge1xuICAgIHR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlKTtcbiAgICBjb25zdCBleGlzdGluZ01vZHVsZSA9IG93bmVyTmdNb2R1bGUuZ2V0KHR5cGUpO1xuICAgIGlmIChleGlzdGluZ01vZHVsZSAmJiBleGlzdGluZ01vZHVsZSAhPT0gbW9kdWxlVHlwZSkge1xuICAgICAgaWYgKCFzdXBwcmVzc0Vycm9ycykge1xuICAgICAgICBjb25zdCBtb2R1bGVzID0gW2V4aXN0aW5nTW9kdWxlLCBtb2R1bGVUeXBlXS5tYXAoc3RyaW5naWZ5Rm9yRXJyb3IpLnNvcnQoKTtcbiAgICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgICAgICBgVHlwZSAke3N0cmluZ2lmeUZvckVycm9yKHR5cGUpfSBpcyBwYXJ0IG9mIHRoZSBkZWNsYXJhdGlvbnMgb2YgMiBtb2R1bGVzOiAke21vZHVsZXNbMF19IGFuZCAke21vZHVsZXNbMV19ISBgICtcbiAgICAgICAgICAgIGBQbGVhc2UgY29uc2lkZXIgbW92aW5nICR7c3RyaW5naWZ5Rm9yRXJyb3IodHlwZSl9IHRvIGEgaGlnaGVyIG1vZHVsZSB0aGF0IGltcG9ydHMgJHttb2R1bGVzWzBdfSBhbmQgJHttb2R1bGVzWzFdfS4gYCArXG4gICAgICAgICAgICBgWW91IGNhbiBhbHNvIGNyZWF0ZSBhIG5ldyBOZ01vZHVsZSB0aGF0IGV4cG9ydHMgYW5kIGluY2x1ZGVzICR7c3RyaW5naWZ5Rm9yRXJyb3IodHlwZSl9IHRoZW4gaW1wb3J0IHRoYXQgTmdNb2R1bGUgaW4gJHttb2R1bGVzWzBdfSBhbmQgJHttb2R1bGVzWzFdfS5gKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTWFyayB0eXBlIGFzIGhhdmluZyBvd25lci5cbiAgICAgIG93bmVyTmdNb2R1bGUuc2V0KHR5cGUsIG1vZHVsZVR5cGUpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHZlcmlmeUNvbXBvbmVudElzUGFydE9mTmdNb2R1bGUodHlwZTogVHlwZTxhbnk+KSB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICAgIGNvbnN0IGV4aXN0aW5nTW9kdWxlID0gb3duZXJOZ01vZHVsZS5nZXQodHlwZSk7XG4gICAgaWYgKCFleGlzdGluZ01vZHVsZSkge1xuICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgICAgYENvbXBvbmVudCAke3N0cmluZ2lmeUZvckVycm9yKHR5cGUpfSBpcyBub3QgcGFydCBvZiBhbnkgTmdNb2R1bGUgb3IgdGhlIG1vZHVsZSBoYXMgbm90IGJlZW4gaW1wb3J0ZWQgaW50byB5b3VyIG1vZHVsZS5gKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB2ZXJpZnlDb3JyZWN0Qm9vdHN0cmFwVHlwZSh0eXBlOiBUeXBlPGFueT4pIHtcbiAgICB0eXBlID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZSk7XG4gICAgaWYgKCFnZXRDb21wb25lbnREZWYodHlwZSkpIHtcbiAgICAgIGVycm9ycy5wdXNoKGAke3N0cmluZ2lmeUZvckVycm9yKHR5cGUpfSBjYW5ub3QgYmUgdXNlZCBhcyBhbiBlbnRyeSBjb21wb25lbnQuYCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdmVyaWZ5Q29tcG9uZW50RW50cnlDb21wb25lbnRzSXNQYXJ0T2ZOZ01vZHVsZSh0eXBlOiBUeXBlPGFueT4pIHtcbiAgICB0eXBlID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZSk7XG4gICAgaWYgKGdldENvbXBvbmVudERlZih0eXBlKSkge1xuICAgICAgLy8gV2Uga25vdyB3ZSBhcmUgY29tcG9uZW50XG4gICAgICBjb25zdCBjb21wb25lbnQgPSBnZXRBbm5vdGF0aW9uPENvbXBvbmVudD4odHlwZSwgJ0NvbXBvbmVudCcpO1xuICAgICAgaWYgKGNvbXBvbmVudCAmJiBjb21wb25lbnQuZW50cnlDb21wb25lbnRzKSB7XG4gICAgICAgIGNvbXBvbmVudC5lbnRyeUNvbXBvbmVudHMuZm9yRWFjaCh2ZXJpZnlDb21wb25lbnRJc1BhcnRPZk5nTW9kdWxlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdW53cmFwTW9kdWxlV2l0aFByb3ZpZGVyc0ltcG9ydHMoXG4gICAgdHlwZU9yV2l0aFByb3ZpZGVyczogTmdNb2R1bGVUeXBlPGFueT58IHtuZ01vZHVsZTogTmdNb2R1bGVUeXBlPGFueT59KTogTmdNb2R1bGVUeXBlPGFueT4ge1xuICB0eXBlT3JXaXRoUHJvdmlkZXJzID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZU9yV2l0aFByb3ZpZGVycyk7XG4gIHJldHVybiAodHlwZU9yV2l0aFByb3ZpZGVycyBhcyBhbnkpLm5nTW9kdWxlIHx8IHR5cGVPcldpdGhQcm92aWRlcnM7XG59XG5cbmZ1bmN0aW9uIGdldEFubm90YXRpb248VD4odHlwZTogYW55LCBuYW1lOiBzdHJpbmcpOiBUfG51bGwge1xuICBsZXQgYW5ub3RhdGlvbjogVHxudWxsID0gbnVsbDtcbiAgY29sbGVjdCh0eXBlLl9fYW5ub3RhdGlvbnNfXyk7XG4gIGNvbGxlY3QodHlwZS5kZWNvcmF0b3JzKTtcbiAgcmV0dXJuIGFubm90YXRpb247XG5cbiAgZnVuY3Rpb24gY29sbGVjdChhbm5vdGF0aW9uczogYW55W10gfCBudWxsKSB7XG4gICAgaWYgKGFubm90YXRpb25zKSB7XG4gICAgICBhbm5vdGF0aW9ucy5mb3JFYWNoKHJlYWRBbm5vdGF0aW9uKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZWFkQW5ub3RhdGlvbihcbiAgICAgIGRlY29yYXRvcjoge3R5cGU6IHtwcm90b3R5cGU6IHtuZ01ldGFkYXRhTmFtZTogc3RyaW5nfSwgYXJnczogYW55W119LCBhcmdzOiBhbnl9KTogdm9pZCB7XG4gICAgaWYgKCFhbm5vdGF0aW9uKSB7XG4gICAgICBjb25zdCBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihkZWNvcmF0b3IpO1xuICAgICAgaWYgKHByb3RvLm5nTWV0YWRhdGFOYW1lID09IG5hbWUpIHtcbiAgICAgICAgYW5ub3RhdGlvbiA9IGRlY29yYXRvciBhcyBhbnk7XG4gICAgICB9IGVsc2UgaWYgKGRlY29yYXRvci50eXBlKSB7XG4gICAgICAgIGNvbnN0IHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGRlY29yYXRvci50eXBlKTtcbiAgICAgICAgaWYgKHByb3RvLm5nTWV0YWRhdGFOYW1lID09IG5hbWUpIHtcbiAgICAgICAgICBhbm5vdGF0aW9uID0gZGVjb3JhdG9yLmFyZ3NbMF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBLZWVwIHRyYWNrIG9mIGNvbXBpbGVkIGNvbXBvbmVudHMuIFRoaXMgaXMgbmVlZGVkIGJlY2F1c2UgaW4gdGVzdHMgd2Ugb2Z0ZW4gd2FudCB0byBjb21waWxlIHRoZVxuICogc2FtZSBjb21wb25lbnQgd2l0aCBtb3JlIHRoYW4gb25lIE5nTW9kdWxlLiBUaGlzIHdvdWxkIGNhdXNlIGFuIGVycm9yIHVubGVzcyB3ZSByZXNldCB3aGljaFxuICogTmdNb2R1bGUgdGhlIGNvbXBvbmVudCBiZWxvbmdzIHRvLiBXZSBrZWVwIHRoZSBsaXN0IG9mIGNvbXBpbGVkIGNvbXBvbmVudHMgaGVyZSBzbyB0aGF0IHRoZVxuICogVGVzdEJlZCBjYW4gcmVzZXQgaXQgbGF0ZXIuXG4gKi9cbmxldCBvd25lck5nTW9kdWxlID0gbmV3IE1hcDxUeXBlPGFueT4sIE5nTW9kdWxlVHlwZTxhbnk+PigpO1xubGV0IHZlcmlmaWVkTmdNb2R1bGUgPSBuZXcgTWFwPE5nTW9kdWxlVHlwZTxhbnk+LCBib29sZWFuPigpO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRDb21waWxlZENvbXBvbmVudHMoKTogdm9pZCB7XG4gIG93bmVyTmdNb2R1bGUgPSBuZXcgTWFwPFR5cGU8YW55PiwgTmdNb2R1bGVUeXBlPGFueT4+KCk7XG4gIHZlcmlmaWVkTmdNb2R1bGUgPSBuZXcgTWFwPE5nTW9kdWxlVHlwZTxhbnk+LCBib29sZWFuPigpO1xuICBtb2R1bGVRdWV1ZS5sZW5ndGggPSAwO1xufVxuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBjb21iaW5lZCBkZWNsYXJhdGlvbnMgb2YgZXhwbGljaXQgZGVjbGFyYXRpb25zLCBhcyB3ZWxsIGFzIGRlY2xhcmF0aW9ucyBpbmhlcml0ZWQgYnlcbiAqIHRyYXZlcnNpbmcgdGhlIGV4cG9ydHMgb2YgaW1wb3J0ZWQgbW9kdWxlcy5cbiAqIEBwYXJhbSB0eXBlXG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVDb21iaW5lZEV4cG9ydHModHlwZTogVHlwZTxhbnk+KTogVHlwZTxhbnk+W10ge1xuICB0eXBlID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZSk7XG4gIGNvbnN0IG5nTW9kdWxlRGVmID0gZ2V0TmdNb2R1bGVEZWYodHlwZSwgdHJ1ZSk7XG4gIHJldHVybiBbLi4uZmxhdHRlbihtYXliZVVud3JhcEZuKG5nTW9kdWxlRGVmLmV4cG9ydHMpLm1hcCgodHlwZSkgPT4ge1xuICAgIGNvbnN0IG5nTW9kdWxlRGVmID0gZ2V0TmdNb2R1bGVEZWYodHlwZSk7XG4gICAgaWYgKG5nTW9kdWxlRGVmKSB7XG4gICAgICB2ZXJpZnlTZW1hbnRpY3NPZk5nTW9kdWxlRGVmKHR5cGUgYXMgYW55IGFzIE5nTW9kdWxlVHlwZSwgZmFsc2UpO1xuICAgICAgcmV0dXJuIGNvbXB1dGVDb21iaW5lZEV4cG9ydHModHlwZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0eXBlO1xuICAgIH1cbiAgfSkpXTtcbn1cblxuLyoqXG4gKiBTb21lIGRlY2xhcmVkIGNvbXBvbmVudHMgbWF5IGJlIGNvbXBpbGVkIGFzeW5jaHJvbm91c2x5LCBhbmQgdGh1cyBtYXkgbm90IGhhdmUgdGhlaXJcbiAqIG5nQ29tcG9uZW50RGVmIHNldCB5ZXQuIElmIHRoaXMgaXMgdGhlIGNhc2UsIHRoZW4gYSByZWZlcmVuY2UgdG8gdGhlIG1vZHVsZSBpcyB3cml0dGVuIGludG9cbiAqIHRoZSBgbmdTZWxlY3RvclNjb3BlYCBwcm9wZXJ0eSBvZiB0aGUgZGVjbGFyZWQgdHlwZS5cbiAqL1xuZnVuY3Rpb24gc2V0U2NvcGVPbkRlY2xhcmVkQ29tcG9uZW50cyhtb2R1bGVUeXBlOiBUeXBlPGFueT4sIG5nTW9kdWxlOiBOZ01vZHVsZSkge1xuICBjb25zdCBkZWNsYXJhdGlvbnM6IFR5cGU8YW55PltdID0gZmxhdHRlbihuZ01vZHVsZS5kZWNsYXJhdGlvbnMgfHwgRU1QVFlfQVJSQVkpO1xuXG4gIGNvbnN0IHRyYW5zaXRpdmVTY29wZXMgPSB0cmFuc2l0aXZlU2NvcGVzRm9yKG1vZHVsZVR5cGUpO1xuXG4gIGRlY2xhcmF0aW9ucy5mb3JFYWNoKGRlY2xhcmF0aW9uID0+IHtcbiAgICBpZiAoZGVjbGFyYXRpb24uaGFzT3duUHJvcGVydHkoTkdfQ09NUE9ORU5UX0RFRikpIHtcbiAgICAgIC8vIEFuIGBuZ0NvbXBvbmVudERlZmAgZmllbGQgZXhpc3RzIC0gZ28gYWhlYWQgYW5kIHBhdGNoIHRoZSBjb21wb25lbnQgZGlyZWN0bHkuXG4gICAgICBjb25zdCBjb21wb25lbnQgPSBkZWNsYXJhdGlvbiBhcyBUeXBlPGFueT4mIHtuZ0NvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPGFueT59O1xuICAgICAgY29uc3QgY29tcG9uZW50RGVmID0gZ2V0Q29tcG9uZW50RGVmKGNvbXBvbmVudCkgITtcbiAgICAgIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlKGNvbXBvbmVudERlZiwgdHJhbnNpdGl2ZVNjb3Blcyk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICAgIWRlY2xhcmF0aW9uLmhhc093blByb3BlcnR5KE5HX0RJUkVDVElWRV9ERUYpICYmICFkZWNsYXJhdGlvbi5oYXNPd25Qcm9wZXJ0eShOR19QSVBFX0RFRikpIHtcbiAgICAgIC8vIFNldCBgbmdTZWxlY3RvclNjb3BlYCBmb3IgZnV0dXJlIHJlZmVyZW5jZSB3aGVuIHRoZSBjb21wb25lbnQgY29tcGlsYXRpb24gZmluaXNoZXMuXG4gICAgICAoZGVjbGFyYXRpb24gYXMgVHlwZTxhbnk+JiB7bmdTZWxlY3RvclNjb3BlPzogYW55fSkubmdTZWxlY3RvclNjb3BlID0gbW9kdWxlVHlwZTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKipcbiAqIFBhdGNoIHRoZSBkZWZpbml0aW9uIG9mIGEgY29tcG9uZW50IHdpdGggZGlyZWN0aXZlcyBhbmQgcGlwZXMgZnJvbSB0aGUgY29tcGlsYXRpb24gc2NvcGUgb2ZcbiAqIGEgZ2l2ZW4gbW9kdWxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGU8Qz4oXG4gICAgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8Qz4sIHRyYW5zaXRpdmVTY29wZXM6IE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3Blcykge1xuICBjb21wb25lbnREZWYuZGlyZWN0aXZlRGVmcyA9ICgpID0+XG4gICAgICBBcnJheS5mcm9tKHRyYW5zaXRpdmVTY29wZXMuY29tcGlsYXRpb24uZGlyZWN0aXZlcylcbiAgICAgICAgICAubWFwKFxuICAgICAgICAgICAgICBkaXIgPT4gZGlyLmhhc093blByb3BlcnR5KE5HX0NPTVBPTkVOVF9ERUYpID8gZ2V0Q29tcG9uZW50RGVmKGRpcikgISA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXREaXJlY3RpdmVEZWYoZGlyKSAhKVxuICAgICAgICAgIC5maWx0ZXIoZGVmID0+ICEhZGVmKTtcbiAgY29tcG9uZW50RGVmLnBpcGVEZWZzID0gKCkgPT5cbiAgICAgIEFycmF5LmZyb20odHJhbnNpdGl2ZVNjb3Blcy5jb21waWxhdGlvbi5waXBlcykubWFwKHBpcGUgPT4gZ2V0UGlwZURlZihwaXBlKSAhKTtcbiAgY29tcG9uZW50RGVmLnNjaGVtYXMgPSB0cmFuc2l0aXZlU2NvcGVzLnNjaGVtYXM7XG5cbiAgLy8gU2luY2Ugd2UgYXZvaWQgQ29tcG9uZW50cy9EaXJlY3RpdmVzL1BpcGVzIHJlY29tcGlsaW5nIGluIGNhc2UgdGhlcmUgYXJlIG5vIG92ZXJyaWRlcywgd2VcbiAgLy8gbWF5IGZhY2UgYSBwcm9ibGVtIHdoZXJlIHByZXZpb3VzbHkgY29tcGlsZWQgZGVmcyBhdmFpbGFibGUgdG8gYSBnaXZlbiBDb21wb25lbnQvRGlyZWN0aXZlXG4gIC8vIGFyZSBjYWNoZWQgaW4gVFZpZXcgYW5kIG1heSBiZWNvbWUgc3RhbGUgKGluIGNhc2UgYW55IG9mIHRoZXNlIGRlZnMgZ2V0cyByZWNvbXBpbGVkKS4gSW5cbiAgLy8gb3JkZXIgdG8gYXZvaWQgdGhpcyBwcm9ibGVtLCB3ZSBmb3JjZSBmcmVzaCBUVmlldyB0byBiZSBjcmVhdGVkLlxuICBjb21wb25lbnREZWYudFZpZXcgPSBudWxsO1xufVxuXG4vKipcbiAqIENvbXB1dGUgdGhlIHBhaXIgb2YgdHJhbnNpdGl2ZSBzY29wZXMgKGNvbXBpbGF0aW9uIHNjb3BlIGFuZCBleHBvcnRlZCBzY29wZSkgZm9yIGEgZ2l2ZW4gbW9kdWxlLlxuICpcbiAqIFRoaXMgb3BlcmF0aW9uIGlzIG1lbW9pemVkIGFuZCB0aGUgcmVzdWx0IGlzIGNhY2hlZCBvbiB0aGUgbW9kdWxlJ3MgZGVmaW5pdGlvbi4gSXQgY2FuIGJlIGNhbGxlZFxuICogb24gbW9kdWxlcyB3aXRoIGNvbXBvbmVudHMgdGhhdCBoYXZlIG5vdCBmdWxseSBjb21waWxlZCB5ZXQsIGJ1dCB0aGUgcmVzdWx0IHNob3VsZCBub3QgYmUgdXNlZFxuICogdW50aWwgdGhleSBoYXZlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNpdGl2ZVNjb3Blc0ZvcjxUPihcbiAgICBtb2R1bGVUeXBlOiBUeXBlPFQ+LFxuICAgIHByb2Nlc3NOZ01vZHVsZUZuPzogKG5nTW9kdWxlOiBOZ01vZHVsZVR5cGUpID0+IHZvaWQpOiBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMge1xuICBpZiAoIWlzTmdNb2R1bGUobW9kdWxlVHlwZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bW9kdWxlVHlwZS5uYW1lfSBkb2VzIG5vdCBoYXZlIGFuIG5nTW9kdWxlRGVmYCk7XG4gIH1cbiAgY29uc3QgZGVmID0gZ2V0TmdNb2R1bGVEZWYobW9kdWxlVHlwZSkgITtcblxuICBpZiAoZGVmLnRyYW5zaXRpdmVDb21waWxlU2NvcGVzICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIGRlZi50cmFuc2l0aXZlQ29tcGlsZVNjb3BlcztcbiAgfVxuXG4gIGNvbnN0IHNjb3BlczogTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzID0ge1xuICAgIHNjaGVtYXM6IGRlZi5zY2hlbWFzIHx8IG51bGwsXG4gICAgY29tcGlsYXRpb246IHtcbiAgICAgIGRpcmVjdGl2ZXM6IG5ldyBTZXQ8YW55PigpLFxuICAgICAgcGlwZXM6IG5ldyBTZXQ8YW55PigpLFxuICAgIH0sXG4gICAgZXhwb3J0ZWQ6IHtcbiAgICAgIGRpcmVjdGl2ZXM6IG5ldyBTZXQ8YW55PigpLFxuICAgICAgcGlwZXM6IG5ldyBTZXQ8YW55PigpLFxuICAgIH0sXG4gIH07XG5cbiAgbWF5YmVVbndyYXBGbihkZWYuZGVjbGFyYXRpb25zKS5mb3JFYWNoKGRlY2xhcmVkID0+IHtcbiAgICBjb25zdCBkZWNsYXJlZFdpdGhEZWZzID0gZGVjbGFyZWQgYXMgVHlwZTxhbnk+JiB7IG5nUGlwZURlZj86IGFueTsgfTtcblxuICAgIGlmIChnZXRQaXBlRGVmKGRlY2xhcmVkV2l0aERlZnMpKSB7XG4gICAgICBzY29wZXMuY29tcGlsYXRpb24ucGlwZXMuYWRkKGRlY2xhcmVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRWl0aGVyIGRlY2xhcmVkIGhhcyBhbiBuZ0NvbXBvbmVudERlZiBvciBuZ0RpcmVjdGl2ZURlZiwgb3IgaXQncyBhIGNvbXBvbmVudCB3aGljaCBoYXNuJ3RcbiAgICAgIC8vIGhhZCBpdHMgdGVtcGxhdGUgY29tcGlsZWQgeWV0LiBJbiBlaXRoZXIgY2FzZSwgaXQgZ2V0cyBhZGRlZCB0byB0aGUgY29tcGlsYXRpb24nc1xuICAgICAgLy8gZGlyZWN0aXZlcy5cbiAgICAgIHNjb3Blcy5jb21waWxhdGlvbi5kaXJlY3RpdmVzLmFkZChkZWNsYXJlZCk7XG4gICAgfVxuICB9KTtcblxuICBtYXliZVVud3JhcEZuKGRlZi5pbXBvcnRzKS5mb3JFYWNoKDxJPihpbXBvcnRlZDogVHlwZTxJPikgPT4ge1xuICAgIGNvbnN0IGltcG9ydGVkVHlwZSA9IGltcG9ydGVkIGFzIFR5cGU8ST4mIHtcbiAgICAgIC8vIElmIGltcG9ydGVkIGlzIGFuIEBOZ01vZHVsZTpcbiAgICAgIG5nTW9kdWxlRGVmPzogTmdNb2R1bGVEZWY8ST47XG4gICAgfTtcblxuICAgIGlmICghaXNOZ01vZHVsZTxJPihpbXBvcnRlZFR5cGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEltcG9ydGluZyAke2ltcG9ydGVkVHlwZS5uYW1lfSB3aGljaCBkb2VzIG5vdCBoYXZlIGFuIG5nTW9kdWxlRGVmYCk7XG4gICAgfVxuXG4gICAgaWYgKHByb2Nlc3NOZ01vZHVsZUZuKSB7XG4gICAgICBwcm9jZXNzTmdNb2R1bGVGbihpbXBvcnRlZFR5cGUgYXMgTmdNb2R1bGVUeXBlKTtcbiAgICB9XG5cbiAgICAvLyBXaGVuIHRoaXMgbW9kdWxlIGltcG9ydHMgYW5vdGhlciwgdGhlIGltcG9ydGVkIG1vZHVsZSdzIGV4cG9ydGVkIGRpcmVjdGl2ZXMgYW5kIHBpcGVzIGFyZVxuICAgIC8vIGFkZGVkIHRvIHRoZSBjb21waWxhdGlvbiBzY29wZSBvZiB0aGlzIG1vZHVsZS5cbiAgICBjb25zdCBpbXBvcnRlZFNjb3BlID0gdHJhbnNpdGl2ZVNjb3Blc0ZvcihpbXBvcnRlZFR5cGUsIHByb2Nlc3NOZ01vZHVsZUZuKTtcbiAgICBpbXBvcnRlZFNjb3BlLmV4cG9ydGVkLmRpcmVjdGl2ZXMuZm9yRWFjaChlbnRyeSA9PiBzY29wZXMuY29tcGlsYXRpb24uZGlyZWN0aXZlcy5hZGQoZW50cnkpKTtcbiAgICBpbXBvcnRlZFNjb3BlLmV4cG9ydGVkLnBpcGVzLmZvckVhY2goZW50cnkgPT4gc2NvcGVzLmNvbXBpbGF0aW9uLnBpcGVzLmFkZChlbnRyeSkpO1xuICB9KTtcblxuICBtYXliZVVud3JhcEZuKGRlZi5leHBvcnRzKS5mb3JFYWNoKDxFPihleHBvcnRlZDogVHlwZTxFPikgPT4ge1xuICAgIGNvbnN0IGV4cG9ydGVkVHlwZSA9IGV4cG9ydGVkIGFzIFR5cGU8RT4mIHtcbiAgICAgIC8vIENvbXBvbmVudHMsIERpcmVjdGl2ZXMsIE5nTW9kdWxlcywgYW5kIFBpcGVzIGNhbiBhbGwgYmUgZXhwb3J0ZWQuXG4gICAgICBuZ0NvbXBvbmVudERlZj86IGFueTtcbiAgICAgIG5nRGlyZWN0aXZlRGVmPzogYW55O1xuICAgICAgbmdNb2R1bGVEZWY/OiBOZ01vZHVsZURlZjxFPjtcbiAgICAgIG5nUGlwZURlZj86IGFueTtcbiAgICB9O1xuXG4gICAgLy8gRWl0aGVyIHRoZSB0eXBlIGlzIGEgbW9kdWxlLCBhIHBpcGUsIG9yIGEgY29tcG9uZW50L2RpcmVjdGl2ZSAod2hpY2ggbWF5IG5vdCBoYXZlIGFuXG4gICAgLy8gbmdDb21wb25lbnREZWYgYXMgaXQgbWlnaHQgYmUgY29tcGlsZWQgYXN5bmNocm9ub3VzbHkpLlxuICAgIGlmIChpc05nTW9kdWxlKGV4cG9ydGVkVHlwZSkpIHtcbiAgICAgIC8vIFdoZW4gdGhpcyBtb2R1bGUgZXhwb3J0cyBhbm90aGVyLCB0aGUgZXhwb3J0ZWQgbW9kdWxlJ3MgZXhwb3J0ZWQgZGlyZWN0aXZlcyBhbmQgcGlwZXMgYXJlXG4gICAgICAvLyBhZGRlZCB0byBib3RoIHRoZSBjb21waWxhdGlvbiBhbmQgZXhwb3J0ZWQgc2NvcGVzIG9mIHRoaXMgbW9kdWxlLlxuICAgICAgY29uc3QgZXhwb3J0ZWRTY29wZSA9IHRyYW5zaXRpdmVTY29wZXNGb3IoZXhwb3J0ZWRUeXBlLCBwcm9jZXNzTmdNb2R1bGVGbik7XG4gICAgICBleHBvcnRlZFNjb3BlLmV4cG9ydGVkLmRpcmVjdGl2ZXMuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgICAgIHNjb3Blcy5jb21waWxhdGlvbi5kaXJlY3RpdmVzLmFkZChlbnRyeSk7XG4gICAgICAgIHNjb3Blcy5leHBvcnRlZC5kaXJlY3RpdmVzLmFkZChlbnRyeSk7XG4gICAgICB9KTtcbiAgICAgIGV4cG9ydGVkU2NvcGUuZXhwb3J0ZWQucGlwZXMuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgICAgIHNjb3Blcy5jb21waWxhdGlvbi5waXBlcy5hZGQoZW50cnkpO1xuICAgICAgICBzY29wZXMuZXhwb3J0ZWQucGlwZXMuYWRkKGVudHJ5KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoZ2V0UGlwZURlZihleHBvcnRlZFR5cGUpKSB7XG4gICAgICBzY29wZXMuZXhwb3J0ZWQucGlwZXMuYWRkKGV4cG9ydGVkVHlwZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNjb3Blcy5leHBvcnRlZC5kaXJlY3RpdmVzLmFkZChleHBvcnRlZFR5cGUpO1xuICAgIH1cbiAgfSk7XG5cbiAgZGVmLnRyYW5zaXRpdmVDb21waWxlU2NvcGVzID0gc2NvcGVzO1xuICByZXR1cm4gc2NvcGVzO1xufVxuXG5mdW5jdGlvbiBleHBhbmRNb2R1bGVXaXRoUHJvdmlkZXJzKHZhbHVlOiBUeXBlPGFueT58IE1vZHVsZVdpdGhQcm92aWRlcnM8e30+KTogVHlwZTxhbnk+IHtcbiAgaWYgKGlzTW9kdWxlV2l0aFByb3ZpZGVycyh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUubmdNb2R1bGU7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBpc01vZHVsZVdpdGhQcm92aWRlcnModmFsdWU6IGFueSk6IHZhbHVlIGlzIE1vZHVsZVdpdGhQcm92aWRlcnM8e30+IHtcbiAgcmV0dXJuICh2YWx1ZSBhc3tuZ01vZHVsZT86IGFueX0pLm5nTW9kdWxlICE9PSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGlzTmdNb2R1bGU8VD4odmFsdWU6IFR5cGU8VD4pOiB2YWx1ZSBpcyBUeXBlPFQ+JntuZ01vZHVsZURlZjogTmdNb2R1bGVEZWY8VD59IHtcbiAgcmV0dXJuICEhZ2V0TmdNb2R1bGVEZWYodmFsdWUpO1xufVxuIl19