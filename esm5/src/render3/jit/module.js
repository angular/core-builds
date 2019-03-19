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
import { maybeUnwrapFn, renderStringify } from '../util/misc_utils';
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
            errors.push("Unexpected value '" + renderStringify(type) + "' declared by the module '" + renderStringify(moduleType) + "'. Please add a @Pipe/@Directive/@Component annotation.");
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
                errors.push("Can't export " + kind + " " + renderStringify(type) + " from " + renderStringify(moduleType) + " as it was neither declared nor imported!");
            }
        }
    }
    function verifyDeclarationIsUnique(type) {
        type = resolveForwardRef(type);
        var existingModule = ownerNgModule.get(type);
        if (existingModule && existingModule !== moduleType) {
            var modules = [existingModule, moduleType].map(renderStringify).sort();
            errors.push("Type " + renderStringify(type) + " is part of the declarations of 2 modules: " + modules[0] + " and " + modules[1] + "! " +
                ("Please consider moving " + renderStringify(type) + " to a higher module that imports " + modules[0] + " and " + modules[1] + ". ") +
                ("You can also create a new NgModule that exports and includes " + renderStringify(type) + " then import that NgModule in " + modules[0] + " and " + modules[1] + "."));
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
            errors.push("Component " + renderStringify(type) + " is not part of any NgModule or the module has not been imported into your module.");
        }
    }
    function verifyCorrectBootstrapType(type) {
        type = resolveForwardRef(type);
        if (!getComponentDef(type)) {
            errors.push(renderStringify(type) + " cannot be used as an entry component.");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvbW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQTJCLGlCQUFpQixFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFDM0YsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDdkQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQ3hELE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRXRELE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLHVDQUF1QyxDQUFDO0FBRzNFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNoRCxPQUFPLEVBQUMsZUFBZSxFQUFFLGVBQWUsRUFBRSxjQUFjLEVBQUUsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzNGLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBR3pGLE9BQU8sRUFBQyxhQUFhLEVBQUUsZUFBZSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFbEUsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUU3QyxJQUFNLFdBQVcsR0FBZ0IsRUFBRSxDQUFDO0FBT3BDLElBQU0sV0FBVyxHQUFzQixFQUFFLENBQUM7QUFFMUM7OztHQUdHO0FBQ0gsU0FBUyw4QkFBOEIsQ0FBQyxVQUFxQixFQUFFLFFBQWtCO0lBQy9FLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBQyxVQUFVLFlBQUEsRUFBRSxRQUFRLFVBQUEsRUFBQyxDQUFDLENBQUM7QUFDM0MsQ0FBQztBQUVELElBQUksbUJBQW1CLEdBQUcs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QUF5QixDQUFDLEtBQXlDO0lBQzFFLElBQUkscUJBQXFCLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDaEMsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDO0tBQ3ZCO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxLQUFVO0lBQ3ZDLE9BQVEsS0FBeUIsQ0FBQyxRQUFRLEtBQUssU0FBUyxDQUFDO0FBQzNELENBQUM7QUFFRCxTQUFTLFVBQVUsQ0FBSSxLQUFjO0lBQ25DLE9BQU8sQ0FBQyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1IzSW5qZWN0b3JNZXRhZGF0YUZhY2FkZSwgZ2V0Q29tcGlsZXJGYWNhZGV9IGZyb20gJy4uLy4uL2NvbXBpbGVyL2NvbXBpbGVyX2ZhY2FkZSc7XG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuLi8uLi9kaS9mb3J3YXJkX3JlZic7XG5pbXBvcnQge05HX0lOSkVDVE9SX0RFRn0gZnJvbSAnLi4vLi4vZGkvaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtyZWZsZWN0RGVwZW5kZW5jaWVzfSBmcm9tICcuLi8uLi9kaS9qaXQvdXRpbCc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7cmVnaXN0ZXJOZ01vZHVsZVR5cGV9IGZyb20gJy4uLy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeV9sb2FkZXInO1xuaW1wb3J0IHtDb21wb25lbnR9IGZyb20gJy4uLy4uL21ldGFkYXRhJztcbmltcG9ydCB7TW9kdWxlV2l0aFByb3ZpZGVycywgTmdNb2R1bGUsIE5nTW9kdWxlRGVmLCBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXN9IGZyb20gJy4uLy4uL21ldGFkYXRhL25nX21vZHVsZSc7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmLCBnZXREaXJlY3RpdmVEZWYsIGdldE5nTW9kdWxlRGVmLCBnZXRQaXBlRGVmfSBmcm9tICcuLi9kZWZpbml0aW9uJztcbmltcG9ydCB7TkdfQ09NUE9ORU5UX0RFRiwgTkdfRElSRUNUSVZFX0RFRiwgTkdfTU9EVUxFX0RFRiwgTkdfUElQRV9ERUZ9IGZyb20gJy4uL2ZpZWxkcyc7XG5pbXBvcnQge0NvbXBvbmVudERlZn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7TmdNb2R1bGVUeXBlfSBmcm9tICcuLi9uZ19tb2R1bGVfcmVmJztcbmltcG9ydCB7bWF5YmVVbndyYXBGbiwgcmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuXG5pbXBvcnQge2FuZ3VsYXJDb3JlRW52fSBmcm9tICcuL2Vudmlyb25tZW50JztcblxuY29uc3QgRU1QVFlfQVJSQVk6IFR5cGU8YW55PltdID0gW107XG5cbmludGVyZmFjZSBNb2R1bGVRdWV1ZUl0ZW0ge1xuICBtb2R1bGVUeXBlOiBUeXBlPGFueT47XG4gIG5nTW9kdWxlOiBOZ01vZHVsZTtcbn1cblxuY29uc3QgbW9kdWxlUXVldWU6IE1vZHVsZVF1ZXVlSXRlbVtdID0gW107XG5cbi8qKlxuICogRW5xdWV1ZXMgbW9kdWxlRGVmIHRvIGJlIGNoZWNrZWQgbGF0ZXIgdG8gc2VlIGlmIHNjb3BlIGNhbiBiZSBzZXQgb24gaXRzXG4gKiBjb21wb25lbnQgZGVjbGFyYXRpb25zLlxuICovXG5mdW5jdGlvbiBlbnF1ZXVlTW9kdWxlRm9yRGVsYXllZFNjb3BpbmcobW9kdWxlVHlwZTogVHlwZTxhbnk+LCBuZ01vZHVsZTogTmdNb2R1bGUpIHtcbiAgbW9kdWxlUXVldWUucHVzaCh7bW9kdWxlVHlwZSwgbmdNb2R1bGV9KTtcbn1cblxubGV0IGZsdXNoaW5nTW9kdWxlUXVldWUgPSBmYWxzZTtcbi8qKlxuICogTG9vcHMgb3ZlciBxdWV1ZWQgbW9kdWxlIGRlZmluaXRpb25zLCBpZiBhIGdpdmVuIG1vZHVsZSBkZWZpbml0aW9uIGhhcyBhbGwgb2YgaXRzXG4gKiBkZWNsYXJhdGlvbnMgcmVzb2x2ZWQsIGl0IGRlcXVldWVzIHRoYXQgbW9kdWxlIGRlZmluaXRpb24gYW5kIHNldHMgdGhlIHNjb3BlIG9uXG4gKiBpdHMgZGVjbGFyYXRpb25zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmx1c2hNb2R1bGVTY29waW5nUXVldWVBc011Y2hBc1Bvc3NpYmxlKCkge1xuICBpZiAoIWZsdXNoaW5nTW9kdWxlUXVldWUpIHtcbiAgICBmbHVzaGluZ01vZHVsZVF1ZXVlID0gdHJ1ZTtcbiAgICB0cnkge1xuICAgICAgZm9yIChsZXQgaSA9IG1vZHVsZVF1ZXVlLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIGNvbnN0IHttb2R1bGVUeXBlLCBuZ01vZHVsZX0gPSBtb2R1bGVRdWV1ZVtpXTtcblxuICAgICAgICBpZiAobmdNb2R1bGUuZGVjbGFyYXRpb25zICYmIG5nTW9kdWxlLmRlY2xhcmF0aW9ucy5ldmVyeShpc1Jlc29sdmVkRGVjbGFyYXRpb24pKSB7XG4gICAgICAgICAgLy8gZGVxdWV1ZVxuICAgICAgICAgIG1vZHVsZVF1ZXVlLnNwbGljZShpLCAxKTtcbiAgICAgICAgICBzZXRTY29wZU9uRGVjbGFyZWRDb21wb25lbnRzKG1vZHVsZVR5cGUsIG5nTW9kdWxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICBmbHVzaGluZ01vZHVsZVF1ZXVlID0gZmFsc2U7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0cnV0aHkgaWYgYSBkZWNsYXJhdGlvbiBoYXMgcmVzb2x2ZWQuIElmIHRoZSBkZWNsYXJhdGlvbiBoYXBwZW5zIHRvIGJlXG4gKiBhbiBhcnJheSBvZiBkZWNsYXJhdGlvbnMsIGl0IHdpbGwgcmVjdXJzZSB0byBjaGVjayBlYWNoIGRlY2xhcmF0aW9uIGluIHRoYXQgYXJyYXlcbiAqICh3aGljaCBtYXkgYWxzbyBiZSBhcnJheXMpLlxuICovXG5mdW5jdGlvbiBpc1Jlc29sdmVkRGVjbGFyYXRpb24oZGVjbGFyYXRpb246IGFueVtdIHwgVHlwZTxhbnk+KTogYm9vbGVhbiB7XG4gIGlmIChBcnJheS5pc0FycmF5KGRlY2xhcmF0aW9uKSkge1xuICAgIHJldHVybiBkZWNsYXJhdGlvbi5ldmVyeShpc1Jlc29sdmVkRGVjbGFyYXRpb24pO1xuICB9XG4gIHJldHVybiAhIXJlc29sdmVGb3J3YXJkUmVmKGRlY2xhcmF0aW9uKTtcbn1cblxuLyoqXG4gKiBDb21waWxlcyBhIG1vZHVsZSBpbiBKSVQgbW9kZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGF1dG9tYXRpY2FsbHkgZ2V0cyBjYWxsZWQgd2hlbiBhIGNsYXNzIGhhcyBhIGBATmdNb2R1bGVgIGRlY29yYXRvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVOZ01vZHVsZShtb2R1bGVUeXBlOiBUeXBlPGFueT4sIG5nTW9kdWxlOiBOZ01vZHVsZSA9IHt9KTogdm9pZCB7XG4gIGNvbXBpbGVOZ01vZHVsZURlZnMobW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGUsIG5nTW9kdWxlKTtcblxuICAvLyBCZWNhdXNlIHdlIGRvbid0IGtub3cgaWYgYWxsIGRlY2xhcmF0aW9ucyBoYXZlIHJlc29sdmVkIHlldCBhdCB0aGUgbW9tZW50IHRoZVxuICAvLyBOZ01vZHVsZSBkZWNvcmF0b3IgaXMgZXhlY3V0aW5nLCB3ZSdyZSBlbnF1ZXVlaW5nIHRoZSBzZXR0aW5nIG9mIG1vZHVsZSBzY29wZVxuICAvLyBvbiBpdHMgZGVjbGFyYXRpb25zIHRvIGJlIHJ1biBhdCBhIGxhdGVyIHRpbWUgd2hlbiBhbGwgZGVjbGFyYXRpb25zIGZvciB0aGUgbW9kdWxlLFxuICAvLyBpbmNsdWRpbmcgZm9yd2FyZCByZWZzLCBoYXZlIHJlc29sdmVkLlxuICBlbnF1ZXVlTW9kdWxlRm9yRGVsYXllZFNjb3BpbmcobW9kdWxlVHlwZSwgbmdNb2R1bGUpO1xufVxuXG4vKipcbiAqIENvbXBpbGVzIGFuZCBhZGRzIHRoZSBgbmdNb2R1bGVEZWZgIGFuZCBgbmdJbmplY3RvckRlZmAgcHJvcGVydGllcyB0byB0aGUgbW9kdWxlIGNsYXNzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZU5nTW9kdWxlRGVmcyhtb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGUsIG5nTW9kdWxlOiBOZ01vZHVsZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChtb2R1bGVUeXBlLCAnUmVxdWlyZWQgdmFsdWUgbW9kdWxlVHlwZScpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChuZ01vZHVsZSwgJ1JlcXVpcmVkIHZhbHVlIG5nTW9kdWxlJyk7XG4gIGNvbnN0IGRlY2xhcmF0aW9uczogVHlwZTxhbnk+W10gPSBmbGF0dGVuKG5nTW9kdWxlLmRlY2xhcmF0aW9ucyB8fCBFTVBUWV9BUlJBWSk7XG5cbiAgbGV0IG5nTW9kdWxlRGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkobW9kdWxlVHlwZSwgTkdfTU9EVUxFX0RFRiwge1xuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChuZ01vZHVsZURlZiA9PT0gbnVsbCkge1xuICAgICAgICBuZ01vZHVsZURlZiA9IGdldENvbXBpbGVyRmFjYWRlKCkuY29tcGlsZU5nTW9kdWxlKFxuICAgICAgICAgICAgYW5ndWxhckNvcmVFbnYsIGBuZzovLyR7bW9kdWxlVHlwZS5uYW1lfS9uZ01vZHVsZURlZi5qc2AsIHtcbiAgICAgICAgICAgICAgdHlwZTogbW9kdWxlVHlwZSxcbiAgICAgICAgICAgICAgYm9vdHN0cmFwOiBmbGF0dGVuKG5nTW9kdWxlLmJvb3RzdHJhcCB8fCBFTVBUWV9BUlJBWSwgcmVzb2x2ZUZvcndhcmRSZWYpLFxuICAgICAgICAgICAgICBkZWNsYXJhdGlvbnM6IGRlY2xhcmF0aW9ucy5tYXAocmVzb2x2ZUZvcndhcmRSZWYpLFxuICAgICAgICAgICAgICBpbXBvcnRzOiBmbGF0dGVuKG5nTW9kdWxlLmltcG9ydHMgfHwgRU1QVFlfQVJSQVksIHJlc29sdmVGb3J3YXJkUmVmKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChleHBhbmRNb2R1bGVXaXRoUHJvdmlkZXJzKSxcbiAgICAgICAgICAgICAgZXhwb3J0czogZmxhdHRlbihuZ01vZHVsZS5leHBvcnRzIHx8IEVNUFRZX0FSUkFZLCByZXNvbHZlRm9yd2FyZFJlZilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoZXhwYW5kTW9kdWxlV2l0aFByb3ZpZGVycyksXG4gICAgICAgICAgICAgIGVtaXRJbmxpbmU6IHRydWUsXG4gICAgICAgICAgICAgIHNjaGVtYXM6IG5nTW9kdWxlLnNjaGVtYXMgPyBmbGF0dGVuKG5nTW9kdWxlLnNjaGVtYXMpIDogbnVsbCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5nTW9kdWxlRGVmO1xuICAgIH1cbiAgfSk7XG4gIGlmIChuZ01vZHVsZS5pZCkge1xuICAgIHJlZ2lzdGVyTmdNb2R1bGVUeXBlKG5nTW9kdWxlLmlkLCBtb2R1bGVUeXBlKTtcbiAgfVxuXG4gIGxldCBuZ0luamVjdG9yRGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkobW9kdWxlVHlwZSwgTkdfSU5KRUNUT1JfREVGLCB7XG4gICAgZ2V0OiAoKSA9PiB7XG4gICAgICBpZiAobmdJbmplY3RvckRlZiA9PT0gbnVsbCkge1xuICAgICAgICBuZ0Rldk1vZGUgJiYgdmVyaWZ5U2VtYW50aWNzT2ZOZ01vZHVsZURlZihtb2R1bGVUeXBlIGFzIGFueSBhcyBOZ01vZHVsZVR5cGUpO1xuICAgICAgICBjb25zdCBtZXRhOiBSM0luamVjdG9yTWV0YWRhdGFGYWNhZGUgPSB7XG4gICAgICAgICAgbmFtZTogbW9kdWxlVHlwZS5uYW1lLFxuICAgICAgICAgIHR5cGU6IG1vZHVsZVR5cGUsXG4gICAgICAgICAgZGVwczogcmVmbGVjdERlcGVuZGVuY2llcyhtb2R1bGVUeXBlKSxcbiAgICAgICAgICBwcm92aWRlcnM6IG5nTW9kdWxlLnByb3ZpZGVycyB8fCBFTVBUWV9BUlJBWSxcbiAgICAgICAgICBpbXBvcnRzOiBbXG4gICAgICAgICAgICAobmdNb2R1bGUuaW1wb3J0cyB8fCBFTVBUWV9BUlJBWSkubWFwKHJlc29sdmVGb3J3YXJkUmVmKSxcbiAgICAgICAgICAgIChuZ01vZHVsZS5leHBvcnRzIHx8IEVNUFRZX0FSUkFZKS5tYXAocmVzb2x2ZUZvcndhcmRSZWYpLFxuICAgICAgICAgIF0sXG4gICAgICAgIH07XG4gICAgICAgIG5nSW5qZWN0b3JEZWYgPSBnZXRDb21waWxlckZhY2FkZSgpLmNvbXBpbGVJbmplY3RvcihcbiAgICAgICAgICAgIGFuZ3VsYXJDb3JlRW52LCBgbmc6Ly8ke21vZHVsZVR5cGUubmFtZX0vbmdJbmplY3RvckRlZi5qc2AsIG1ldGEpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5nSW5qZWN0b3JEZWY7XG4gICAgfSxcbiAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGUsXG4gIH0pO1xufVxuXG5mdW5jdGlvbiB2ZXJpZnlTZW1hbnRpY3NPZk5nTW9kdWxlRGVmKG1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZSk6IHZvaWQge1xuICBpZiAodmVyaWZpZWROZ01vZHVsZS5nZXQobW9kdWxlVHlwZSkpIHJldHVybjtcbiAgdmVyaWZpZWROZ01vZHVsZS5zZXQobW9kdWxlVHlwZSwgdHJ1ZSk7XG4gIG1vZHVsZVR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZihtb2R1bGVUeXBlKTtcbiAgY29uc3QgbmdNb2R1bGVEZWYgPSBnZXROZ01vZHVsZURlZihtb2R1bGVUeXBlLCB0cnVlKTtcbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBkZWNsYXJhdGlvbnMgPSBtYXliZVVud3JhcEZuKG5nTW9kdWxlRGVmLmRlY2xhcmF0aW9ucyk7XG4gIGNvbnN0IGltcG9ydHMgPSBtYXliZVVud3JhcEZuKG5nTW9kdWxlRGVmLmltcG9ydHMpO1xuICBjb25zdCBleHBvcnRzID0gbWF5YmVVbndyYXBGbihuZ01vZHVsZURlZi5leHBvcnRzKTtcbiAgZGVjbGFyYXRpb25zLmZvckVhY2godmVyaWZ5RGVjbGFyYXRpb25zSGF2ZURlZmluaXRpb25zKTtcbiAgY29uc3QgY29tYmluZWREZWNsYXJhdGlvbnM6IFR5cGU8YW55PltdID0gW1xuICAgIC4uLmRlY2xhcmF0aW9ucy5tYXAocmVzb2x2ZUZvcndhcmRSZWYpLCAgLy9cbiAgICAuLi5mbGF0dGVuKGltcG9ydHMubWFwKGNvbXB1dGVDb21iaW5lZEV4cG9ydHMpLCByZXNvbHZlRm9yd2FyZFJlZiksXG4gIF07XG4gIGV4cG9ydHMuZm9yRWFjaCh2ZXJpZnlFeHBvcnRzQXJlRGVjbGFyZWRPclJlRXhwb3J0ZWQpO1xuICBkZWNsYXJhdGlvbnMuZm9yRWFjaCh2ZXJpZnlEZWNsYXJhdGlvbklzVW5pcXVlKTtcbiAgZGVjbGFyYXRpb25zLmZvckVhY2godmVyaWZ5Q29tcG9uZW50RW50cnlDb21wb25lbnRzSXNQYXJ0T2ZOZ01vZHVsZSk7XG5cbiAgY29uc3QgbmdNb2R1bGUgPSBnZXRBbm5vdGF0aW9uPE5nTW9kdWxlPihtb2R1bGVUeXBlLCAnTmdNb2R1bGUnKTtcbiAgaWYgKG5nTW9kdWxlKSB7XG4gICAgbmdNb2R1bGUuaW1wb3J0cyAmJlxuICAgICAgICBmbGF0dGVuKG5nTW9kdWxlLmltcG9ydHMsIHVud3JhcE1vZHVsZVdpdGhQcm92aWRlcnNJbXBvcnRzKVxuICAgICAgICAgICAgLmZvckVhY2godmVyaWZ5U2VtYW50aWNzT2ZOZ01vZHVsZURlZik7XG4gICAgbmdNb2R1bGUuYm9vdHN0cmFwICYmIG5nTW9kdWxlLmJvb3RzdHJhcC5mb3JFYWNoKHZlcmlmeUNvcnJlY3RCb290c3RyYXBUeXBlKTtcbiAgICBuZ01vZHVsZS5ib290c3RyYXAgJiYgbmdNb2R1bGUuYm9vdHN0cmFwLmZvckVhY2godmVyaWZ5Q29tcG9uZW50SXNQYXJ0T2ZOZ01vZHVsZSk7XG4gICAgbmdNb2R1bGUuZW50cnlDb21wb25lbnRzICYmIG5nTW9kdWxlLmVudHJ5Q29tcG9uZW50cy5mb3JFYWNoKHZlcmlmeUNvbXBvbmVudElzUGFydE9mTmdNb2R1bGUpO1xuICB9XG5cbiAgLy8gVGhyb3cgRXJyb3IgaWYgYW55IGVycm9ycyB3ZXJlIGRldGVjdGVkLlxuICBpZiAoZXJyb3JzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBFcnJvcihlcnJvcnMuam9pbignXFxuJykpO1xuICB9XG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICBmdW5jdGlvbiB2ZXJpZnlEZWNsYXJhdGlvbnNIYXZlRGVmaW5pdGlvbnModHlwZTogVHlwZTxhbnk+KTogdm9pZCB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICAgIGNvbnN0IGRlZiA9IGdldENvbXBvbmVudERlZih0eXBlKSB8fCBnZXREaXJlY3RpdmVEZWYodHlwZSkgfHwgZ2V0UGlwZURlZih0eXBlKTtcbiAgICBpZiAoIWRlZikge1xuICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgICAgYFVuZXhwZWN0ZWQgdmFsdWUgJyR7cmVuZGVyU3RyaW5naWZ5KHR5cGUpfScgZGVjbGFyZWQgYnkgdGhlIG1vZHVsZSAnJHtyZW5kZXJTdHJpbmdpZnkobW9kdWxlVHlwZSl9Jy4gUGxlYXNlIGFkZCBhIEBQaXBlL0BEaXJlY3RpdmUvQENvbXBvbmVudCBhbm5vdGF0aW9uLmApO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHZlcmlmeUV4cG9ydHNBcmVEZWNsYXJlZE9yUmVFeHBvcnRlZCh0eXBlOiBUeXBlPGFueT4pIHtcbiAgICB0eXBlID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZSk7XG4gICAgY29uc3Qga2luZCA9IGdldENvbXBvbmVudERlZih0eXBlKSAmJiAnY29tcG9uZW50JyB8fCBnZXREaXJlY3RpdmVEZWYodHlwZSkgJiYgJ2RpcmVjdGl2ZScgfHxcbiAgICAgICAgZ2V0UGlwZURlZih0eXBlKSAmJiAncGlwZSc7XG4gICAgaWYgKGtpbmQpIHtcbiAgICAgIC8vIG9ubHkgY2hlY2tlZCBpZiB3ZSBhcmUgZGVjbGFyZWQgYXMgQ29tcG9uZW50LCBEaXJlY3RpdmUsIG9yIFBpcGVcbiAgICAgIC8vIE1vZHVsZXMgZG9uJ3QgbmVlZCB0byBiZSBkZWNsYXJlZCBvciBpbXBvcnRlZC5cbiAgICAgIGlmIChjb21iaW5lZERlY2xhcmF0aW9ucy5sYXN0SW5kZXhPZih0eXBlKSA9PT0gLTEpIHtcbiAgICAgICAgLy8gV2UgYXJlIGV4cG9ydGluZyBzb21ldGhpbmcgd2hpY2ggd2UgZG9uJ3QgZXhwbGljaXRseSBkZWNsYXJlIG9yIGltcG9ydC5cbiAgICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgICAgICBgQ2FuJ3QgZXhwb3J0ICR7a2luZH0gJHtyZW5kZXJTdHJpbmdpZnkodHlwZSl9IGZyb20gJHtyZW5kZXJTdHJpbmdpZnkobW9kdWxlVHlwZSl9IGFzIGl0IHdhcyBuZWl0aGVyIGRlY2xhcmVkIG5vciBpbXBvcnRlZCFgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB2ZXJpZnlEZWNsYXJhdGlvbklzVW5pcXVlKHR5cGU6IFR5cGU8YW55Pikge1xuICAgIHR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlKTtcbiAgICBjb25zdCBleGlzdGluZ01vZHVsZSA9IG93bmVyTmdNb2R1bGUuZ2V0KHR5cGUpO1xuICAgIGlmIChleGlzdGluZ01vZHVsZSAmJiBleGlzdGluZ01vZHVsZSAhPT0gbW9kdWxlVHlwZSkge1xuICAgICAgY29uc3QgbW9kdWxlcyA9IFtleGlzdGluZ01vZHVsZSwgbW9kdWxlVHlwZV0ubWFwKHJlbmRlclN0cmluZ2lmeSkuc29ydCgpO1xuICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgICAgYFR5cGUgJHtyZW5kZXJTdHJpbmdpZnkodHlwZSl9IGlzIHBhcnQgb2YgdGhlIGRlY2xhcmF0aW9ucyBvZiAyIG1vZHVsZXM6ICR7bW9kdWxlc1swXX0gYW5kICR7bW9kdWxlc1sxXX0hIGAgK1xuICAgICAgICAgIGBQbGVhc2UgY29uc2lkZXIgbW92aW5nICR7cmVuZGVyU3RyaW5naWZ5KHR5cGUpfSB0byBhIGhpZ2hlciBtb2R1bGUgdGhhdCBpbXBvcnRzICR7bW9kdWxlc1swXX0gYW5kICR7bW9kdWxlc1sxXX0uIGAgK1xuICAgICAgICAgIGBZb3UgY2FuIGFsc28gY3JlYXRlIGEgbmV3IE5nTW9kdWxlIHRoYXQgZXhwb3J0cyBhbmQgaW5jbHVkZXMgJHtyZW5kZXJTdHJpbmdpZnkodHlwZSl9IHRoZW4gaW1wb3J0IHRoYXQgTmdNb2R1bGUgaW4gJHttb2R1bGVzWzBdfSBhbmQgJHttb2R1bGVzWzFdfS5gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTWFyayB0eXBlIGFzIGhhdmluZyBvd25lci5cbiAgICAgIG93bmVyTmdNb2R1bGUuc2V0KHR5cGUsIG1vZHVsZVR5cGUpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHZlcmlmeUNvbXBvbmVudElzUGFydE9mTmdNb2R1bGUodHlwZTogVHlwZTxhbnk+KSB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICAgIGNvbnN0IGV4aXN0aW5nTW9kdWxlID0gb3duZXJOZ01vZHVsZS5nZXQodHlwZSk7XG4gICAgaWYgKCFleGlzdGluZ01vZHVsZSkge1xuICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgICAgYENvbXBvbmVudCAke3JlbmRlclN0cmluZ2lmeSh0eXBlKX0gaXMgbm90IHBhcnQgb2YgYW55IE5nTW9kdWxlIG9yIHRoZSBtb2R1bGUgaGFzIG5vdCBiZWVuIGltcG9ydGVkIGludG8geW91ciBtb2R1bGUuYCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdmVyaWZ5Q29ycmVjdEJvb3RzdHJhcFR5cGUodHlwZTogVHlwZTxhbnk+KSB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICAgIGlmICghZ2V0Q29tcG9uZW50RGVmKHR5cGUpKSB7XG4gICAgICBlcnJvcnMucHVzaChgJHtyZW5kZXJTdHJpbmdpZnkodHlwZSl9IGNhbm5vdCBiZSB1c2VkIGFzIGFuIGVudHJ5IGNvbXBvbmVudC5gKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB2ZXJpZnlDb21wb25lbnRFbnRyeUNvbXBvbmVudHNJc1BhcnRPZk5nTW9kdWxlKHR5cGU6IFR5cGU8YW55Pikge1xuICAgIHR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlKTtcbiAgICBpZiAoZ2V0Q29tcG9uZW50RGVmKHR5cGUpKSB7XG4gICAgICAvLyBXZSBrbm93IHdlIGFyZSBjb21wb25lbnRcbiAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGdldEFubm90YXRpb248Q29tcG9uZW50Pih0eXBlLCAnQ29tcG9uZW50Jyk7XG4gICAgICBpZiAoY29tcG9uZW50ICYmIGNvbXBvbmVudC5lbnRyeUNvbXBvbmVudHMpIHtcbiAgICAgICAgY29tcG9uZW50LmVudHJ5Q29tcG9uZW50cy5mb3JFYWNoKHZlcmlmeUNvbXBvbmVudElzUGFydE9mTmdNb2R1bGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB1bndyYXBNb2R1bGVXaXRoUHJvdmlkZXJzSW1wb3J0cyhcbiAgICB0eXBlT3JXaXRoUHJvdmlkZXJzOiBOZ01vZHVsZVR5cGU8YW55Pnwge25nTW9kdWxlOiBOZ01vZHVsZVR5cGU8YW55Pn0pOiBOZ01vZHVsZVR5cGU8YW55PiB7XG4gIHR5cGVPcldpdGhQcm92aWRlcnMgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlT3JXaXRoUHJvdmlkZXJzKTtcbiAgcmV0dXJuICh0eXBlT3JXaXRoUHJvdmlkZXJzIGFzIGFueSkubmdNb2R1bGUgfHwgdHlwZU9yV2l0aFByb3ZpZGVycztcbn1cblxuZnVuY3Rpb24gZ2V0QW5ub3RhdGlvbjxUPih0eXBlOiBhbnksIG5hbWU6IHN0cmluZyk6IFR8bnVsbCB7XG4gIGxldCBhbm5vdGF0aW9uOiBUfG51bGwgPSBudWxsO1xuICBjb2xsZWN0KHR5cGUuX19hbm5vdGF0aW9uc19fKTtcbiAgY29sbGVjdCh0eXBlLmRlY29yYXRvcnMpO1xuICByZXR1cm4gYW5ub3RhdGlvbjtcblxuICBmdW5jdGlvbiBjb2xsZWN0KGFubm90YXRpb25zOiBhbnlbXSB8IG51bGwpIHtcbiAgICBpZiAoYW5ub3RhdGlvbnMpIHtcbiAgICAgIGFubm90YXRpb25zLmZvckVhY2gocmVhZEFubm90YXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRBbm5vdGF0aW9uKFxuICAgICAgZGVjb3JhdG9yOiB7dHlwZToge3Byb3RvdHlwZToge25nTWV0YWRhdGFOYW1lOiBzdHJpbmd9LCBhcmdzOiBhbnlbXX0sIGFyZ3M6IGFueX0pOiB2b2lkIHtcbiAgICBpZiAoIWFubm90YXRpb24pIHtcbiAgICAgIGNvbnN0IHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGRlY29yYXRvcik7XG4gICAgICBpZiAocHJvdG8ubmdNZXRhZGF0YU5hbWUgPT0gbmFtZSkge1xuICAgICAgICBhbm5vdGF0aW9uID0gZGVjb3JhdG9yIGFzIGFueTtcbiAgICAgIH0gZWxzZSBpZiAoZGVjb3JhdG9yLnR5cGUpIHtcbiAgICAgICAgY29uc3QgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoZGVjb3JhdG9yLnR5cGUpO1xuICAgICAgICBpZiAocHJvdG8ubmdNZXRhZGF0YU5hbWUgPT0gbmFtZSkge1xuICAgICAgICAgIGFubm90YXRpb24gPSBkZWNvcmF0b3IuYXJnc1swXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEtlZXAgdHJhY2sgb2YgY29tcGlsZWQgY29tcG9uZW50cy4gVGhpcyBpcyBuZWVkZWQgYmVjYXVzZSBpbiB0ZXN0cyB3ZSBvZnRlbiB3YW50IHRvIGNvbXBpbGUgdGhlXG4gKiBzYW1lIGNvbXBvbmVudCB3aXRoIG1vcmUgdGhhbiBvbmUgTmdNb2R1bGUuIFRoaXMgd291bGQgY2F1c2UgYW4gZXJyb3IgdW5sZXNzIHdlIHJlc2V0IHdoaWNoXG4gKiBOZ01vZHVsZSB0aGUgY29tcG9uZW50IGJlbG9uZ3MgdG8uIFdlIGtlZXAgdGhlIGxpc3Qgb2YgY29tcGlsZWQgY29tcG9uZW50cyBoZXJlIHNvIHRoYXQgdGhlXG4gKiBUZXN0QmVkIGNhbiByZXNldCBpdCBsYXRlci5cbiAqL1xubGV0IG93bmVyTmdNb2R1bGUgPSBuZXcgTWFwPFR5cGU8YW55PiwgTmdNb2R1bGVUeXBlPGFueT4+KCk7XG5sZXQgdmVyaWZpZWROZ01vZHVsZSA9IG5ldyBNYXA8TmdNb2R1bGVUeXBlPGFueT4sIGJvb2xlYW4+KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNldENvbXBpbGVkQ29tcG9uZW50cygpOiB2b2lkIHtcbiAgb3duZXJOZ01vZHVsZSA9IG5ldyBNYXA8VHlwZTxhbnk+LCBOZ01vZHVsZVR5cGU8YW55Pj4oKTtcbiAgdmVyaWZpZWROZ01vZHVsZSA9IG5ldyBNYXA8TmdNb2R1bGVUeXBlPGFueT4sIGJvb2xlYW4+KCk7XG4gIG1vZHVsZVF1ZXVlLmxlbmd0aCA9IDA7XG59XG5cbi8qKlxuICogQ29tcHV0ZXMgdGhlIGNvbWJpbmVkIGRlY2xhcmF0aW9ucyBvZiBleHBsaWNpdCBkZWNsYXJhdGlvbnMsIGFzIHdlbGwgYXMgZGVjbGFyYXRpb25zIGluaGVyaXRlZCBieVxuICogdHJhdmVyc2luZyB0aGUgZXhwb3J0cyBvZiBpbXBvcnRlZCBtb2R1bGVzLlxuICogQHBhcmFtIHR5cGVcbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUNvbWJpbmVkRXhwb3J0cyh0eXBlOiBUeXBlPGFueT4pOiBUeXBlPGFueT5bXSB7XG4gIHR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlKTtcbiAgY29uc3QgbmdNb2R1bGVEZWYgPSBnZXROZ01vZHVsZURlZih0eXBlLCB0cnVlKTtcbiAgcmV0dXJuIFsuLi5mbGF0dGVuKG1heWJlVW53cmFwRm4obmdNb2R1bGVEZWYuZXhwb3J0cykubWFwKCh0eXBlKSA9PiB7XG4gICAgY29uc3QgbmdNb2R1bGVEZWYgPSBnZXROZ01vZHVsZURlZih0eXBlKTtcbiAgICBpZiAobmdNb2R1bGVEZWYpIHtcbiAgICAgIHZlcmlmeVNlbWFudGljc09mTmdNb2R1bGVEZWYodHlwZSBhcyBhbnkgYXMgTmdNb2R1bGVUeXBlKTtcbiAgICAgIHJldHVybiBjb21wdXRlQ29tYmluZWRFeHBvcnRzKHR5cGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdHlwZTtcbiAgICB9XG4gIH0pKV07XG59XG5cbi8qKlxuICogU29tZSBkZWNsYXJlZCBjb21wb25lbnRzIG1heSBiZSBjb21waWxlZCBhc3luY2hyb25vdXNseSwgYW5kIHRodXMgbWF5IG5vdCBoYXZlIHRoZWlyXG4gKiBuZ0NvbXBvbmVudERlZiBzZXQgeWV0LiBJZiB0aGlzIGlzIHRoZSBjYXNlLCB0aGVuIGEgcmVmZXJlbmNlIHRvIHRoZSBtb2R1bGUgaXMgd3JpdHRlbiBpbnRvXG4gKiB0aGUgYG5nU2VsZWN0b3JTY29wZWAgcHJvcGVydHkgb2YgdGhlIGRlY2xhcmVkIHR5cGUuXG4gKi9cbmZ1bmN0aW9uIHNldFNjb3BlT25EZWNsYXJlZENvbXBvbmVudHMobW9kdWxlVHlwZTogVHlwZTxhbnk+LCBuZ01vZHVsZTogTmdNb2R1bGUpIHtcbiAgY29uc3QgZGVjbGFyYXRpb25zOiBUeXBlPGFueT5bXSA9IGZsYXR0ZW4obmdNb2R1bGUuZGVjbGFyYXRpb25zIHx8IEVNUFRZX0FSUkFZKTtcblxuICBjb25zdCB0cmFuc2l0aXZlU2NvcGVzID0gdHJhbnNpdGl2ZVNjb3Blc0Zvcihtb2R1bGVUeXBlKTtcblxuICBkZWNsYXJhdGlvbnMuZm9yRWFjaChkZWNsYXJhdGlvbiA9PiB7XG4gICAgaWYgKGRlY2xhcmF0aW9uLmhhc093blByb3BlcnR5KE5HX0NPTVBPTkVOVF9ERUYpKSB7XG4gICAgICAvLyBBbiBgbmdDb21wb25lbnREZWZgIGZpZWxkIGV4aXN0cyAtIGdvIGFoZWFkIGFuZCBwYXRjaCB0aGUgY29tcG9uZW50IGRpcmVjdGx5LlxuICAgICAgY29uc3QgY29tcG9uZW50ID0gZGVjbGFyYXRpb24gYXMgVHlwZTxhbnk+JiB7bmdDb21wb25lbnREZWY6IENvbXBvbmVudERlZjxhbnk+fTtcbiAgICAgIGNvbnN0IGNvbXBvbmVudERlZiA9IGdldENvbXBvbmVudERlZihjb21wb25lbnQpICE7XG4gICAgICBwYXRjaENvbXBvbmVudERlZldpdGhTY29wZShjb21wb25lbnREZWYsIHRyYW5zaXRpdmVTY29wZXMpO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICFkZWNsYXJhdGlvbi5oYXNPd25Qcm9wZXJ0eShOR19ESVJFQ1RJVkVfREVGKSAmJiAhZGVjbGFyYXRpb24uaGFzT3duUHJvcGVydHkoTkdfUElQRV9ERUYpKSB7XG4gICAgICAvLyBTZXQgYG5nU2VsZWN0b3JTY29wZWAgZm9yIGZ1dHVyZSByZWZlcmVuY2Ugd2hlbiB0aGUgY29tcG9uZW50IGNvbXBpbGF0aW9uIGZpbmlzaGVzLlxuICAgICAgKGRlY2xhcmF0aW9uIGFzIFR5cGU8YW55PiYge25nU2VsZWN0b3JTY29wZT86IGFueX0pLm5nU2VsZWN0b3JTY29wZSA9IG1vZHVsZVR5cGU7XG4gICAgfVxuICB9KTtcbn1cblxuLyoqXG4gKiBQYXRjaCB0aGUgZGVmaW5pdGlvbiBvZiBhIGNvbXBvbmVudCB3aXRoIGRpcmVjdGl2ZXMgYW5kIHBpcGVzIGZyb20gdGhlIGNvbXBpbGF0aW9uIHNjb3BlIG9mXG4gKiBhIGdpdmVuIG1vZHVsZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlPEM+KFxuICAgIGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPEM+LCB0cmFuc2l0aXZlU2NvcGVzOiBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMpIHtcbiAgY29tcG9uZW50RGVmLmRpcmVjdGl2ZURlZnMgPSAoKSA9PlxuICAgICAgQXJyYXkuZnJvbSh0cmFuc2l0aXZlU2NvcGVzLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMpXG4gICAgICAgICAgLm1hcChcbiAgICAgICAgICAgICAgZGlyID0+IGRpci5oYXNPd25Qcm9wZXJ0eShOR19DT01QT05FTlRfREVGKSA/IGdldENvbXBvbmVudERlZihkaXIpICEgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0RGlyZWN0aXZlRGVmKGRpcikgISlcbiAgICAgICAgICAuZmlsdGVyKGRlZiA9PiAhIWRlZik7XG4gIGNvbXBvbmVudERlZi5waXBlRGVmcyA9ICgpID0+XG4gICAgICBBcnJheS5mcm9tKHRyYW5zaXRpdmVTY29wZXMuY29tcGlsYXRpb24ucGlwZXMpLm1hcChwaXBlID0+IGdldFBpcGVEZWYocGlwZSkgISk7XG4gIGNvbXBvbmVudERlZi5zY2hlbWFzID0gdHJhbnNpdGl2ZVNjb3Blcy5zY2hlbWFzO1xuXG4gIC8vIFNpbmNlIHdlIGF2b2lkIENvbXBvbmVudHMvRGlyZWN0aXZlcy9QaXBlcyByZWNvbXBpbGluZyBpbiBjYXNlIHRoZXJlIGFyZSBubyBvdmVycmlkZXMsIHdlXG4gIC8vIG1heSBmYWNlIGEgcHJvYmxlbSB3aGVyZSBwcmV2aW91c2x5IGNvbXBpbGVkIGRlZnMgYXZhaWxhYmxlIHRvIGEgZ2l2ZW4gQ29tcG9uZW50L0RpcmVjdGl2ZVxuICAvLyBhcmUgY2FjaGVkIGluIFRWaWV3IGFuZCBtYXkgYmVjb21lIHN0YWxlIChpbiBjYXNlIGFueSBvZiB0aGVzZSBkZWZzIGdldHMgcmVjb21waWxlZCkuIEluXG4gIC8vIG9yZGVyIHRvIGF2b2lkIHRoaXMgcHJvYmxlbSwgd2UgZm9yY2UgZnJlc2ggVFZpZXcgdG8gYmUgY3JlYXRlZC5cbiAgY29tcG9uZW50RGVmLnRlbXBsYXRlLm5nUHJpdmF0ZURhdGEgPSB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogQ29tcHV0ZSB0aGUgcGFpciBvZiB0cmFuc2l0aXZlIHNjb3BlcyAoY29tcGlsYXRpb24gc2NvcGUgYW5kIGV4cG9ydGVkIHNjb3BlKSBmb3IgYSBnaXZlbiBtb2R1bGUuXG4gKlxuICogVGhpcyBvcGVyYXRpb24gaXMgbWVtb2l6ZWQgYW5kIHRoZSByZXN1bHQgaXMgY2FjaGVkIG9uIHRoZSBtb2R1bGUncyBkZWZpbml0aW9uLiBJdCBjYW4gYmUgY2FsbGVkXG4gKiBvbiBtb2R1bGVzIHdpdGggY29tcG9uZW50cyB0aGF0IGhhdmUgbm90IGZ1bGx5IGNvbXBpbGVkIHlldCwgYnV0IHRoZSByZXN1bHQgc2hvdWxkIG5vdCBiZSB1c2VkXG4gKiB1bnRpbCB0aGV5IGhhdmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2l0aXZlU2NvcGVzRm9yPFQ+KFxuICAgIG1vZHVsZVR5cGU6IFR5cGU8VD4sXG4gICAgcHJvY2Vzc05nTW9kdWxlRm4/OiAobmdNb2R1bGU6IE5nTW9kdWxlVHlwZSkgPT4gdm9pZCk6IE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3BlcyB7XG4gIGlmICghaXNOZ01vZHVsZShtb2R1bGVUeXBlKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHttb2R1bGVUeXBlLm5hbWV9IGRvZXMgbm90IGhhdmUgYW4gbmdNb2R1bGVEZWZgKTtcbiAgfVxuICBjb25zdCBkZWYgPSBnZXROZ01vZHVsZURlZihtb2R1bGVUeXBlKSAhO1xuXG4gIGlmIChkZWYudHJhbnNpdGl2ZUNvbXBpbGVTY29wZXMgIT09IG51bGwpIHtcbiAgICByZXR1cm4gZGVmLnRyYW5zaXRpdmVDb21waWxlU2NvcGVzO1xuICB9XG5cbiAgY29uc3Qgc2NvcGVzOiBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMgPSB7XG4gICAgc2NoZW1hczogZGVmLnNjaGVtYXMgfHwgbnVsbCxcbiAgICBjb21waWxhdGlvbjoge1xuICAgICAgZGlyZWN0aXZlczogbmV3IFNldDxhbnk+KCksXG4gICAgICBwaXBlczogbmV3IFNldDxhbnk+KCksXG4gICAgfSxcbiAgICBleHBvcnRlZDoge1xuICAgICAgZGlyZWN0aXZlczogbmV3IFNldDxhbnk+KCksXG4gICAgICBwaXBlczogbmV3IFNldDxhbnk+KCksXG4gICAgfSxcbiAgfTtcblxuICBtYXliZVVud3JhcEZuKGRlZi5kZWNsYXJhdGlvbnMpLmZvckVhY2goZGVjbGFyZWQgPT4ge1xuICAgIGNvbnN0IGRlY2xhcmVkV2l0aERlZnMgPSBkZWNsYXJlZCBhcyBUeXBlPGFueT4mIHsgbmdQaXBlRGVmPzogYW55OyB9O1xuXG4gICAgaWYgKGdldFBpcGVEZWYoZGVjbGFyZWRXaXRoRGVmcykpIHtcbiAgICAgIHNjb3Blcy5jb21waWxhdGlvbi5waXBlcy5hZGQoZGVjbGFyZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBFaXRoZXIgZGVjbGFyZWQgaGFzIGFuIG5nQ29tcG9uZW50RGVmIG9yIG5nRGlyZWN0aXZlRGVmLCBvciBpdCdzIGEgY29tcG9uZW50IHdoaWNoIGhhc24ndFxuICAgICAgLy8gaGFkIGl0cyB0ZW1wbGF0ZSBjb21waWxlZCB5ZXQuIEluIGVpdGhlciBjYXNlLCBpdCBnZXRzIGFkZGVkIHRvIHRoZSBjb21waWxhdGlvbidzXG4gICAgICAvLyBkaXJlY3RpdmVzLlxuICAgICAgc2NvcGVzLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMuYWRkKGRlY2xhcmVkKTtcbiAgICB9XG4gIH0pO1xuXG4gIG1heWJlVW53cmFwRm4oZGVmLmltcG9ydHMpLmZvckVhY2goPEk+KGltcG9ydGVkOiBUeXBlPEk+KSA9PiB7XG4gICAgY29uc3QgaW1wb3J0ZWRUeXBlID0gaW1wb3J0ZWQgYXMgVHlwZTxJPiYge1xuICAgICAgLy8gSWYgaW1wb3J0ZWQgaXMgYW4gQE5nTW9kdWxlOlxuICAgICAgbmdNb2R1bGVEZWY/OiBOZ01vZHVsZURlZjxJPjtcbiAgICB9O1xuXG4gICAgaWYgKCFpc05nTW9kdWxlPEk+KGltcG9ydGVkVHlwZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW1wb3J0aW5nICR7aW1wb3J0ZWRUeXBlLm5hbWV9IHdoaWNoIGRvZXMgbm90IGhhdmUgYW4gbmdNb2R1bGVEZWZgKTtcbiAgICB9XG5cbiAgICBpZiAocHJvY2Vzc05nTW9kdWxlRm4pIHtcbiAgICAgIHByb2Nlc3NOZ01vZHVsZUZuKGltcG9ydGVkVHlwZSBhcyBOZ01vZHVsZVR5cGUpO1xuICAgIH1cblxuICAgIC8vIFdoZW4gdGhpcyBtb2R1bGUgaW1wb3J0cyBhbm90aGVyLCB0aGUgaW1wb3J0ZWQgbW9kdWxlJ3MgZXhwb3J0ZWQgZGlyZWN0aXZlcyBhbmQgcGlwZXMgYXJlXG4gICAgLy8gYWRkZWQgdG8gdGhlIGNvbXBpbGF0aW9uIHNjb3BlIG9mIHRoaXMgbW9kdWxlLlxuICAgIGNvbnN0IGltcG9ydGVkU2NvcGUgPSB0cmFuc2l0aXZlU2NvcGVzRm9yKGltcG9ydGVkVHlwZSwgcHJvY2Vzc05nTW9kdWxlRm4pO1xuICAgIGltcG9ydGVkU2NvcGUuZXhwb3J0ZWQuZGlyZWN0aXZlcy5mb3JFYWNoKGVudHJ5ID0+IHNjb3Blcy5jb21waWxhdGlvbi5kaXJlY3RpdmVzLmFkZChlbnRyeSkpO1xuICAgIGltcG9ydGVkU2NvcGUuZXhwb3J0ZWQucGlwZXMuZm9yRWFjaChlbnRyeSA9PiBzY29wZXMuY29tcGlsYXRpb24ucGlwZXMuYWRkKGVudHJ5KSk7XG4gIH0pO1xuXG4gIG1heWJlVW53cmFwRm4oZGVmLmV4cG9ydHMpLmZvckVhY2goPEU+KGV4cG9ydGVkOiBUeXBlPEU+KSA9PiB7XG4gICAgY29uc3QgZXhwb3J0ZWRUeXBlID0gZXhwb3J0ZWQgYXMgVHlwZTxFPiYge1xuICAgICAgLy8gQ29tcG9uZW50cywgRGlyZWN0aXZlcywgTmdNb2R1bGVzLCBhbmQgUGlwZXMgY2FuIGFsbCBiZSBleHBvcnRlZC5cbiAgICAgIG5nQ29tcG9uZW50RGVmPzogYW55O1xuICAgICAgbmdEaXJlY3RpdmVEZWY/OiBhbnk7XG4gICAgICBuZ01vZHVsZURlZj86IE5nTW9kdWxlRGVmPEU+O1xuICAgICAgbmdQaXBlRGVmPzogYW55O1xuICAgIH07XG5cbiAgICAvLyBFaXRoZXIgdGhlIHR5cGUgaXMgYSBtb2R1bGUsIGEgcGlwZSwgb3IgYSBjb21wb25lbnQvZGlyZWN0aXZlICh3aGljaCBtYXkgbm90IGhhdmUgYW5cbiAgICAvLyBuZ0NvbXBvbmVudERlZiBhcyBpdCBtaWdodCBiZSBjb21waWxlZCBhc3luY2hyb25vdXNseSkuXG4gICAgaWYgKGlzTmdNb2R1bGUoZXhwb3J0ZWRUeXBlKSkge1xuICAgICAgLy8gV2hlbiB0aGlzIG1vZHVsZSBleHBvcnRzIGFub3RoZXIsIHRoZSBleHBvcnRlZCBtb2R1bGUncyBleHBvcnRlZCBkaXJlY3RpdmVzIGFuZCBwaXBlcyBhcmVcbiAgICAgIC8vIGFkZGVkIHRvIGJvdGggdGhlIGNvbXBpbGF0aW9uIGFuZCBleHBvcnRlZCBzY29wZXMgb2YgdGhpcyBtb2R1bGUuXG4gICAgICBjb25zdCBleHBvcnRlZFNjb3BlID0gdHJhbnNpdGl2ZVNjb3Blc0ZvcihleHBvcnRlZFR5cGUsIHByb2Nlc3NOZ01vZHVsZUZuKTtcbiAgICAgIGV4cG9ydGVkU2NvcGUuZXhwb3J0ZWQuZGlyZWN0aXZlcy5mb3JFYWNoKGVudHJ5ID0+IHtcbiAgICAgICAgc2NvcGVzLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMuYWRkKGVudHJ5KTtcbiAgICAgICAgc2NvcGVzLmV4cG9ydGVkLmRpcmVjdGl2ZXMuYWRkKGVudHJ5KTtcbiAgICAgIH0pO1xuICAgICAgZXhwb3J0ZWRTY29wZS5leHBvcnRlZC5waXBlcy5mb3JFYWNoKGVudHJ5ID0+IHtcbiAgICAgICAgc2NvcGVzLmNvbXBpbGF0aW9uLnBpcGVzLmFkZChlbnRyeSk7XG4gICAgICAgIHNjb3Blcy5leHBvcnRlZC5waXBlcy5hZGQoZW50cnkpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChnZXRQaXBlRGVmKGV4cG9ydGVkVHlwZSkpIHtcbiAgICAgIHNjb3Blcy5leHBvcnRlZC5waXBlcy5hZGQoZXhwb3J0ZWRUeXBlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2NvcGVzLmV4cG9ydGVkLmRpcmVjdGl2ZXMuYWRkKGV4cG9ydGVkVHlwZSk7XG4gICAgfVxuICB9KTtcblxuICBkZWYudHJhbnNpdGl2ZUNvbXBpbGVTY29wZXMgPSBzY29wZXM7XG4gIHJldHVybiBzY29wZXM7XG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW48VD4odmFsdWVzOiBhbnlbXSwgbWFwRm4/OiAodmFsdWU6IFQpID0+IGFueSk6IFR5cGU8VD5bXSB7XG4gIGNvbnN0IG91dDogVHlwZTxUPltdID0gW107XG4gIHZhbHVlcy5mb3JFYWNoKHZhbHVlID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIG91dC5wdXNoKC4uLmZsYXR0ZW48VD4odmFsdWUsIG1hcEZuKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dC5wdXNoKG1hcEZuID8gbWFwRm4odmFsdWUpIDogdmFsdWUpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIGV4cGFuZE1vZHVsZVdpdGhQcm92aWRlcnModmFsdWU6IFR5cGU8YW55PnwgTW9kdWxlV2l0aFByb3ZpZGVyczx7fT4pOiBUeXBlPGFueT4ge1xuICBpZiAoaXNNb2R1bGVXaXRoUHJvdmlkZXJzKHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS5uZ01vZHVsZTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGlzTW9kdWxlV2l0aFByb3ZpZGVycyh2YWx1ZTogYW55KTogdmFsdWUgaXMgTW9kdWxlV2l0aFByb3ZpZGVyczx7fT4ge1xuICByZXR1cm4gKHZhbHVlIGFze25nTW9kdWxlPzogYW55fSkubmdNb2R1bGUgIT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaXNOZ01vZHVsZTxUPih2YWx1ZTogVHlwZTxUPik6IHZhbHVlIGlzIFR5cGU8VD4me25nTW9kdWxlRGVmOiBOZ01vZHVsZURlZjxUPn0ge1xuICByZXR1cm4gISFnZXROZ01vZHVsZURlZih2YWx1ZSk7XG59XG4iXX0=