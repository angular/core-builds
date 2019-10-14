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
import { deepForEach, flatten } from '../../util/array_utils';
import { assertDefined } from '../../util/assert';
import { getComponentDef, getDirectiveDef, getNgModuleDef, getPipeDef } from '../definition';
import { NG_COMP_DEF, NG_DIR_DEF, NG_MOD_DEF, NG_PIPE_DEF } from '../fields';
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
 * Compiles and adds the `ɵmod` and `ngInjectorDef` properties to the module class.
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
    Object.defineProperty(moduleType, NG_MOD_DEF, {
        configurable: true,
        get: function () {
            if (ngModuleDef === null) {
                if (ngDevMode && ngModule.imports && ngModule.imports.indexOf(moduleType) > -1) {
                    // We need to assert this immediately, because allowing it to continue will cause it to
                    // go into an infinite loop before we've reached the point where we throw all the errors.
                    throw new Error("'" + stringifyForError(moduleType) + "' module can't import itself");
                }
                ngModuleDef = getCompilerFacade().compileNgModule(angularCoreEnv, "ng:///" + moduleType.name + "/\u0275mod.js", {
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
function verifySemanticsOfNgModuleDef(moduleType, allowDuplicateDeclarationsInRoot, importingModule) {
    if (verifiedNgModule.get(moduleType))
        return;
    verifiedNgModule.set(moduleType, true);
    moduleType = resolveForwardRef(moduleType);
    var ngModuleDef;
    if (importingModule) {
        ngModuleDef = getNgModuleDef(moduleType);
        if (!ngModuleDef) {
            throw new Error("Unexpected value '" + moduleType.name + "' imported by the module '" + importingModule.name + "'. Please add an @NgModule annotation.");
        }
    }
    else {
        ngModuleDef = getNgModuleDef(moduleType, true);
    }
    var errors = [];
    var declarations = maybeUnwrapFn(ngModuleDef.declarations);
    var imports = maybeUnwrapFn(ngModuleDef.imports);
    flatten(imports).map(unwrapModuleWithProvidersImports).forEach(function (mod) {
        verifySemanticsOfNgModuleImport(mod, moduleType);
        verifySemanticsOfNgModuleDef(mod, false, moduleType);
    });
    var exports = maybeUnwrapFn(ngModuleDef.exports);
    declarations.forEach(verifyDeclarationsHaveDefinitions);
    declarations.forEach(verifyDirectivesHaveSelector);
    var combinedDeclarations = tslib_1.__spread(declarations.map(resolveForwardRef), flatten(imports.map(computeCombinedExports)).map(resolveForwardRef));
    exports.forEach(verifyExportsAreDeclaredOrReExported);
    declarations.forEach(function (decl) { return verifyDeclarationIsUnique(decl, allowDuplicateDeclarationsInRoot); });
    declarations.forEach(verifyComponentEntryComponentsIsPartOfNgModule);
    var ngModule = getAnnotation(moduleType, 'NgModule');
    if (ngModule) {
        ngModule.imports &&
            flatten(ngModule.imports).map(unwrapModuleWithProvidersImports).forEach(function (mod) {
                verifySemanticsOfNgModuleImport(mod, moduleType);
                verifySemanticsOfNgModuleDef(mod, false, moduleType);
            });
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
    function verifyDeclarationsHaveDefinitions(type) {
        type = resolveForwardRef(type);
        var def = getComponentDef(type) || getDirectiveDef(type) || getPipeDef(type);
        if (!def) {
            errors.push("Unexpected value '" + stringifyForError(type) + "' declared by the module '" + stringifyForError(moduleType) + "'. Please add a @Pipe/@Directive/@Component annotation.");
        }
    }
    function verifyDirectivesHaveSelector(type) {
        type = resolveForwardRef(type);
        var def = getDirectiveDef(type);
        if (!getComponentDef(type) && def && def.selectors.length == 0) {
            errors.push("Directive " + stringifyForError(type) + " has no selector, please add it!");
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
                deepForEach(component.entryComponents, verifyComponentIsPartOfNgModule);
            }
        }
    }
    function verifySemanticsOfNgModuleImport(type, importingModule) {
        type = resolveForwardRef(type);
        if (getComponentDef(type) || getDirectiveDef(type)) {
            throw new Error("Unexpected directive '" + type.name + "' imported by the module '" + importingModule.name + "'. Please add an @NgModule annotation.");
        }
        if (getPipeDef(type)) {
            throw new Error("Unexpected pipe '" + type.name + "' imported by the module '" + importingModule.name + "'. Please add an @NgModule annotation.");
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
 * ɵcmp set yet. If this is the case, then a reference to the module is written into
 * the `ngSelectorScope` property of the declared type.
 */
function setScopeOnDeclaredComponents(moduleType, ngModule) {
    var declarations = flatten(ngModule.declarations || EMPTY_ARRAY);
    var transitiveScopes = transitiveScopesFor(moduleType);
    declarations.forEach(function (declaration) {
        if (declaration.hasOwnProperty(NG_COMP_DEF)) {
            // A `ɵcmp` field exists - go ahead and patch the component directly.
            var component = declaration;
            var componentDef = getComponentDef(component);
            patchComponentDefWithScope(componentDef, transitiveScopes);
        }
        else if (!declaration.hasOwnProperty(NG_DIR_DEF) && !declaration.hasOwnProperty(NG_PIPE_DEF)) {
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
            .map(function (dir) {
            return dir.hasOwnProperty(NG_COMP_DEF) ? getComponentDef(dir) : getDirectiveDef(dir);
        })
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
        throw new Error(moduleType.name + " does not have a module def (\u0275mod property)");
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
            // Either declared has a ɵcmp or ɵdir, or it's a component which hasn't
            // had its template compiled yet. In either case, it gets added to the compilation's
            // directives.
            scopes.compilation.directives.add(declared);
        }
    });
    maybeUnwrapFn(def.imports).forEach(function (imported) {
        var importedType = imported;
        if (!isNgModule(importedType)) {
            throw new Error("Importing " + importedType.name + " which does not have a \u0275mod property");
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
        // Either the type is a module, a pipe, or a component/directive (which may not have a
        // ɵcmp as it might be compiled asynchronously).
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvbW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQTJCLGlCQUFpQixFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFDM0YsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDdkQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQ3hELE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBSXRELE9BQU8sRUFBQyxXQUFXLEVBQUUsT0FBTyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDNUQsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2hELE9BQU8sRUFBQyxlQUFlLEVBQUUsZUFBZSxFQUFFLGNBQWMsRUFBRSxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDM0YsT0FBTyxFQUFDLFdBQVcsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUczRSxPQUFPLEVBQUMsYUFBYSxFQUFFLGlCQUFpQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFcEUsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUU3QyxJQUFNLFdBQVcsR0FBZ0IsRUFBRSxDQUFDO0FBT3BDLElBQU0sV0FBVyxHQUFzQixFQUFFLENBQUM7QUFFMUM7OztHQUdHO0FBQ0gsU0FBUyw4QkFBOEIsQ0FBQyxVQUFxQixFQUFFLFFBQWtCO0lBQy9FLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBQyxVQUFVLFlBQUEsRUFBRSxRQUFRLFVBQUEsRUFBQyxDQUFDLENBQUM7QUFDM0MsQ0FBQztBQUVELElBQUksbUJBQW1CLEdBQUcsS0FBSyxDQUFDO0FBQ2hDOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsdUNBQXVDO0lBQ3JELElBQUksQ0FBQyxtQkFBbUIsRUFBRTtRQUN4QixtQkFBbUIsR0FBRyxJQUFJLENBQUM7UUFDM0IsSUFBSTtZQUNGLEtBQUssSUFBSSxDQUFDLEdBQUcsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDMUMsSUFBQSxtQkFBdUMsRUFBdEMsMEJBQVUsRUFBRSxzQkFBMEIsQ0FBQztnQkFFOUMsSUFBSSxRQUFRLENBQUMsWUFBWSxJQUFJLFFBQVEsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFDLEVBQUU7b0JBQy9FLFVBQVU7b0JBQ1YsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ3pCLDRCQUE0QixDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztpQkFDcEQ7YUFDRjtTQUNGO2dCQUFTO1lBQ1IsbUJBQW1CLEdBQUcsS0FBSyxDQUFDO1NBQzdCO0tBQ0Y7QUFDSCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQVMscUJBQXFCLENBQUMsV0FBOEI7SUFDM0QsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFO1FBQzlCLE9BQU8sV0FBVyxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0tBQ2pEO0lBQ0QsT0FBTyxDQUFDLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDMUMsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsZUFBZSxDQUFDLFVBQXFCLEVBQUUsUUFBdUI7SUFBdkIseUJBQUEsRUFBQSxhQUF1QjtJQUM1RSxtQkFBbUIsQ0FBQyxVQUEwQixFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBRTFELGdGQUFnRjtJQUNoRixnRkFBZ0Y7SUFDaEYsc0ZBQXNGO0lBQ3RGLHlDQUF5QztJQUN6Qyw4QkFBOEIsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDdkQsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLG1CQUFtQixDQUMvQixVQUF3QixFQUFFLFFBQWtCLEVBQzVDLGdDQUFpRDtJQUFqRCxpREFBQSxFQUFBLHdDQUFpRDtJQUNuRCxTQUFTLElBQUksYUFBYSxDQUFDLFVBQVUsRUFBRSwyQkFBMkIsQ0FBQyxDQUFDO0lBQ3BFLFNBQVMsSUFBSSxhQUFhLENBQUMsUUFBUSxFQUFFLHlCQUF5QixDQUFDLENBQUM7SUFDaEUsSUFBTSxZQUFZLEdBQWdCLE9BQU8sQ0FBQyxRQUFRLENBQUMsWUFBWSxJQUFJLFdBQVcsQ0FBQyxDQUFDO0lBQ2hGLElBQUksV0FBVyxHQUFRLElBQUksQ0FBQztJQUM1QixNQUFNLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUU7UUFDNUMsWUFBWSxFQUFFLElBQUk7UUFDbEIsR0FBRyxFQUFFO1lBQ0gsSUFBSSxXQUFXLEtBQUssSUFBSSxFQUFFO2dCQUN4QixJQUFJLFNBQVMsSUFBSSxRQUFRLENBQUMsT0FBTyxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO29CQUM5RSx1RkFBdUY7b0JBQ3ZGLHlGQUF5RjtvQkFDekYsTUFBTSxJQUFJLEtBQUssQ0FBQyxNQUFJLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxpQ0FBOEIsQ0FBQyxDQUFDO2lCQUNsRjtnQkFDRCxXQUFXLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQyxlQUFlLENBQzdDLGNBQWMsRUFBRSxXQUFTLFVBQVUsQ0FBQyxJQUFJLGtCQUFVLEVBQUU7b0JBQ2xELElBQUksRUFBRSxVQUFVO29CQUNoQixTQUFTLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxTQUFTLElBQUksV0FBVyxDQUFDLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDO29CQUM1RSxZQUFZLEVBQUUsWUFBWSxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQztvQkFDakQsT0FBTyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxJQUFJLFdBQVcsQ0FBQzt5QkFDbkMsR0FBRyxDQUFDLGlCQUFpQixDQUFDO3lCQUN0QixHQUFHLENBQUMseUJBQXlCLENBQUM7b0JBQzVDLE9BQU8sRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLE9BQU8sSUFBSSxXQUFXLENBQUM7eUJBQ25DLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQzt5QkFDdEIsR0FBRyxDQUFDLHlCQUF5QixDQUFDO29CQUM1QyxVQUFVLEVBQUUsSUFBSTtvQkFDaEIsT0FBTyxFQUFFLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7b0JBQzVELEVBQUUsRUFBRSxRQUFRLENBQUMsRUFBRSxJQUFJLElBQUk7aUJBQ3hCLENBQUMsQ0FBQzthQUNSO1lBQ0QsT0FBTyxXQUFXLENBQUM7UUFDckIsQ0FBQztLQUNGLENBQUMsQ0FBQztJQUVILElBQUksYUFBYSxHQUFRLElBQUksQ0FBQztJQUM5QixNQUFNLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxlQUFlLEVBQUU7UUFDakQsR0FBRyxFQUFFO1lBQ0gsSUFBSSxhQUFhLEtBQUssSUFBSSxFQUFFO2dCQUMxQixTQUFTLElBQUksNEJBQTRCLENBQ3hCLFVBQWlDLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQztnQkFDdEYsSUFBTSxJQUFJLEdBQTZCO29CQUNyQyxJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUk7b0JBQ3JCLElBQUksRUFBRSxVQUFVO29CQUNoQixJQUFJLEVBQUUsbUJBQW1CLENBQUMsVUFBVSxDQUFDO29CQUNyQyxTQUFTLEVBQUUsUUFBUSxDQUFDLFNBQVMsSUFBSSxXQUFXO29CQUM1QyxPQUFPLEVBQUU7d0JBQ1AsQ0FBQyxRQUFRLENBQUMsT0FBTyxJQUFJLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQzt3QkFDeEQsQ0FBQyxRQUFRLENBQUMsT0FBTyxJQUFJLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQztxQkFDekQ7aUJBQ0YsQ0FBQztnQkFDRixhQUFhLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQyxlQUFlLENBQy9DLGNBQWMsRUFBRSxXQUFTLFVBQVUsQ0FBQyxJQUFJLHNCQUFtQixFQUFFLElBQUksQ0FBQyxDQUFDO2FBQ3hFO1lBQ0QsT0FBTyxhQUFhLENBQUM7UUFDdkIsQ0FBQztRQUNELDBFQUEwRTtRQUMxRSxZQUFZLEVBQUUsQ0FBQyxDQUFDLFNBQVM7S0FDMUIsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELFNBQVMsNEJBQTRCLENBQ2pDLFVBQXdCLEVBQUUsZ0NBQXlDLEVBQ25FLGVBQThCO0lBQ2hDLElBQUksZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQztRQUFFLE9BQU87SUFDN0MsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN2QyxVQUFVLEdBQUcsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDM0MsSUFBSSxXQUE2QixDQUFDO0lBQ2xDLElBQUksZUFBZSxFQUFFO1FBQ25CLFdBQVcsR0FBRyxjQUFjLENBQUMsVUFBVSxDQUFHLENBQUM7UUFDM0MsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNoQixNQUFNLElBQUksS0FBSyxDQUNYLHVCQUFxQixVQUFVLENBQUMsSUFBSSxrQ0FBNkIsZUFBZSxDQUFDLElBQUksMkNBQXdDLENBQUMsQ0FBQztTQUNwSTtLQUNGO1NBQU07UUFDTCxXQUFXLEdBQUcsY0FBYyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUNoRDtJQUNELElBQU0sTUFBTSxHQUFhLEVBQUUsQ0FBQztJQUM1QixJQUFNLFlBQVksR0FBRyxhQUFhLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQzdELElBQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbkQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFBLEdBQUc7UUFDaEUsK0JBQStCLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ2pELDRCQUE0QixDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDdkQsQ0FBQyxDQUFDLENBQUM7SUFDSCxJQUFNLE9BQU8sR0FBRyxhQUFhLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ25ELFlBQVksQ0FBQyxPQUFPLENBQUMsaUNBQWlDLENBQUMsQ0FBQztJQUN4RCxZQUFZLENBQUMsT0FBTyxDQUFDLDRCQUE0QixDQUFDLENBQUM7SUFDbkQsSUFBTSxvQkFBb0Isb0JBQ3JCLFlBQVksQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsRUFDbkMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUN2RSxDQUFDO0lBQ0YsT0FBTyxDQUFDLE9BQU8sQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO0lBQ3RELFlBQVksQ0FBQyxPQUFPLENBQUMsVUFBQSxJQUFJLElBQUksT0FBQSx5QkFBeUIsQ0FBQyxJQUFJLEVBQUUsZ0NBQWdDLENBQUMsRUFBakUsQ0FBaUUsQ0FBQyxDQUFDO0lBQ2hHLFlBQVksQ0FBQyxPQUFPLENBQUMsOENBQThDLENBQUMsQ0FBQztJQUVyRSxJQUFNLFFBQVEsR0FBRyxhQUFhLENBQVcsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ2pFLElBQUksUUFBUSxFQUFFO1FBQ1osUUFBUSxDQUFDLE9BQU87WUFDWixPQUFPLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFBLEdBQUc7Z0JBQ3pFLCtCQUErQixDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakQsNEJBQTRCLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztZQUN2RCxDQUFDLENBQUMsQ0FBQztRQUNQLFFBQVEsQ0FBQyxTQUFTLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztRQUNsRixRQUFRLENBQUMsU0FBUyxJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLCtCQUErQixDQUFDLENBQUM7UUFDdkYsUUFBUSxDQUFDLGVBQWU7WUFDcEIsV0FBVyxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsK0JBQStCLENBQUMsQ0FBQztLQUM1RTtJQUVELDJDQUEyQztJQUMzQyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUU7UUFDakIsTUFBTSxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7S0FDcEM7SUFDRCxnR0FBZ0c7SUFDaEcsU0FBUyxpQ0FBaUMsQ0FBQyxJQUFlO1FBQ3hELElBQUksR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQixJQUFNLEdBQUcsR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvRSxJQUFJLENBQUMsR0FBRyxFQUFFO1lBQ1IsTUFBTSxDQUFDLElBQUksQ0FDUCx1QkFBcUIsaUJBQWlCLENBQUMsSUFBSSxDQUFDLGtDQUE2QixpQkFBaUIsQ0FBQyxVQUFVLENBQUMsNERBQXlELENBQUMsQ0FBQztTQUN0SztJQUNILENBQUM7SUFFRCxTQUFTLDRCQUE0QixDQUFDLElBQWU7UUFDbkQsSUFBSSxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLElBQU0sR0FBRyxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7WUFDOUQsTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFhLGlCQUFpQixDQUFDLElBQUksQ0FBQyxxQ0FBa0MsQ0FBQyxDQUFDO1NBQ3JGO0lBQ0gsQ0FBQztJQUVELFNBQVMsb0NBQW9DLENBQUMsSUFBZTtRQUMzRCxJQUFJLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0IsSUFBTSxJQUFJLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLFdBQVcsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksV0FBVztZQUNyRixVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksTUFBTSxDQUFDO1FBQy9CLElBQUksSUFBSSxFQUFFO1lBQ1IsbUVBQW1FO1lBQ25FLGlEQUFpRDtZQUNqRCxJQUFJLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtnQkFDakQsMEVBQTBFO2dCQUMxRSxNQUFNLENBQUMsSUFBSSxDQUNQLGtCQUFnQixJQUFJLFNBQUksaUJBQWlCLENBQUMsSUFBSSxDQUFDLGNBQVMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLDhDQUEyQyxDQUFDLENBQUM7YUFDdkk7U0FDRjtJQUNILENBQUM7SUFFRCxTQUFTLHlCQUF5QixDQUFDLElBQWUsRUFBRSxjQUF1QjtRQUN6RSxJQUFJLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0IsSUFBTSxjQUFjLEdBQUcsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQyxJQUFJLGNBQWMsSUFBSSxjQUFjLEtBQUssVUFBVSxFQUFFO1lBQ25ELElBQUksQ0FBQyxjQUFjLEVBQUU7Z0JBQ25CLElBQU0sT0FBTyxHQUFHLENBQUMsY0FBYyxFQUFFLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUMzRSxNQUFNLENBQUMsSUFBSSxDQUNQLFVBQVEsaUJBQWlCLENBQUMsSUFBSSxDQUFDLG1EQUE4QyxPQUFPLENBQUMsQ0FBQyxDQUFDLGFBQVEsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFJO3FCQUM3Ryw0QkFBMEIsaUJBQWlCLENBQUMsSUFBSSxDQUFDLHlDQUFvQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGFBQVEsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFJLENBQUE7cUJBQ3JILGtFQUFnRSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsc0NBQWlDLE9BQU8sQ0FBQyxDQUFDLENBQUMsYUFBUSxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQUcsQ0FBQSxDQUFDLENBQUM7YUFDOUo7U0FDRjthQUFNO1lBQ0wsNkJBQTZCO1lBQzdCLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQ3JDO0lBQ0gsQ0FBQztJQUVELFNBQVMsK0JBQStCLENBQUMsSUFBZTtRQUN0RCxJQUFJLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0IsSUFBTSxjQUFjLEdBQUcsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQyxJQUFJLENBQUMsY0FBYyxFQUFFO1lBQ25CLE1BQU0sQ0FBQyxJQUFJLENBQ1AsZUFBYSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsdUZBQW9GLENBQUMsQ0FBQztTQUMvSDtJQUNILENBQUM7SUFFRCxTQUFTLDBCQUEwQixDQUFDLElBQWU7UUFDakQsSUFBSSxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDMUIsTUFBTSxDQUFDLElBQUksQ0FBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsMkNBQXdDLENBQUMsQ0FBQztTQUNqRjtJQUNILENBQUM7SUFFRCxTQUFTLDhDQUE4QyxDQUFDLElBQWU7UUFDckUsSUFBSSxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3pCLDJCQUEyQjtZQUMzQixJQUFNLFNBQVMsR0FBRyxhQUFhLENBQVksSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQzlELElBQUksU0FBUyxJQUFJLFNBQVMsQ0FBQyxlQUFlLEVBQUU7Z0JBQzFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsZUFBZSxFQUFFLCtCQUErQixDQUFDLENBQUM7YUFDekU7U0FDRjtJQUNILENBQUM7SUFFRCxTQUFTLCtCQUErQixDQUFDLElBQWUsRUFBRSxlQUEwQjtRQUNsRixJQUFJLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFL0IsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ2xELE1BQU0sSUFBSSxLQUFLLENBQ1gsMkJBQXlCLElBQUksQ0FBQyxJQUFJLGtDQUE2QixlQUFlLENBQUMsSUFBSSwyQ0FBd0MsQ0FBQyxDQUFDO1NBQ2xJO1FBRUQsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDcEIsTUFBTSxJQUFJLEtBQUssQ0FDWCxzQkFBb0IsSUFBSSxDQUFDLElBQUksa0NBQTZCLGVBQWUsQ0FBQyxJQUFJLDJDQUF3QyxDQUFDLENBQUM7U0FDN0g7SUFDSCxDQUFDO0FBQ0gsQ0FBQztBQUVELFNBQVMsZ0NBQWdDLENBQ3JDLG1CQUFxRTtJQUN2RSxtQkFBbUIsR0FBRyxpQkFBaUIsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0lBQzdELE9BQVEsbUJBQTJCLENBQUMsUUFBUSxJQUFJLG1CQUFtQixDQUFDO0FBQ3RFLENBQUM7QUFFRCxTQUFTLGFBQWEsQ0FBSSxJQUFTLEVBQUUsSUFBWTtJQUMvQyxJQUFJLFVBQVUsR0FBVyxJQUFJLENBQUM7SUFDOUIsT0FBTyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUM5QixPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3pCLE9BQU8sVUFBVSxDQUFDO0lBRWxCLFNBQVMsT0FBTyxDQUFDLFdBQXlCO1FBQ3hDLElBQUksV0FBVyxFQUFFO1lBQ2YsV0FBVyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztTQUNyQztJQUNILENBQUM7SUFFRCxTQUFTLGNBQWMsQ0FDbkIsU0FBZ0Y7UUFDbEYsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNmLElBQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDL0MsSUFBSSxLQUFLLENBQUMsY0FBYyxJQUFJLElBQUksRUFBRTtnQkFDaEMsVUFBVSxHQUFHLFNBQWdCLENBQUM7YUFDL0I7aUJBQU0sSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFO2dCQUN6QixJQUFNLE9BQUssR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEQsSUFBSSxPQUFLLENBQUMsY0FBYyxJQUFJLElBQUksRUFBRTtvQkFDaEMsVUFBVSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ2hDO2FBQ0Y7U0FDRjtJQUNILENBQUM7QUFDSCxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxJQUFJLGFBQWEsR0FBRyxJQUFJLEdBQUcsRUFBZ0MsQ0FBQztBQUM1RCxJQUFJLGdCQUFnQixHQUFHLElBQUksR0FBRyxFQUE4QixDQUFDO0FBRTdELE1BQU0sVUFBVSx1QkFBdUI7SUFDckMsYUFBYSxHQUFHLElBQUksR0FBRyxFQUFnQyxDQUFDO0lBQ3hELGdCQUFnQixHQUFHLElBQUksR0FBRyxFQUE4QixDQUFDO0lBQ3pELFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ3pCLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUyxzQkFBc0IsQ0FBQyxJQUFlO0lBQzdDLElBQUksR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQixJQUFNLFdBQVcsR0FBRyxjQUFjLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQy9DLHdCQUFXLE9BQU8sQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFDLElBQUk7UUFDN0QsSUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pDLElBQUksV0FBVyxFQUFFO1lBQ2YsNEJBQTRCLENBQUMsSUFBMkIsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNqRSxPQUFPLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3JDO2FBQU07WUFDTCxPQUFPLElBQUksQ0FBQztTQUNiO0lBQ0gsQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUNQLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUyw0QkFBNEIsQ0FBQyxVQUFxQixFQUFFLFFBQWtCO0lBQzdFLElBQU0sWUFBWSxHQUFnQixPQUFPLENBQUMsUUFBUSxDQUFDLFlBQVksSUFBSSxXQUFXLENBQUMsQ0FBQztJQUVoRixJQUFNLGdCQUFnQixHQUFHLG1CQUFtQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBRXpELFlBQVksQ0FBQyxPQUFPLENBQUMsVUFBQSxXQUFXO1FBQzlCLElBQUksV0FBVyxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUMzQyxxRUFBcUU7WUFDckUsSUFBTSxTQUFTLEdBQUcsV0FBbUQsQ0FBQztZQUN0RSxJQUFNLFlBQVksR0FBRyxlQUFlLENBQUMsU0FBUyxDQUFHLENBQUM7WUFDbEQsMEJBQTBCLENBQUMsWUFBWSxFQUFFLGdCQUFnQixDQUFDLENBQUM7U0FDNUQ7YUFBTSxJQUNILENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFDdkYsc0ZBQXNGO1lBQ3JGLFdBQWtELENBQUMsZUFBZSxHQUFHLFVBQVUsQ0FBQztTQUNsRjtJQUNILENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSwwQkFBMEIsQ0FDdEMsWUFBNkIsRUFBRSxnQkFBMEM7SUFDM0UsWUFBWSxDQUFDLGFBQWEsR0FBRztRQUN6QixPQUFBLEtBQUssQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQzthQUM5QyxHQUFHLENBQ0EsVUFBQSxHQUFHO1lBQ0MsT0FBQSxHQUFHLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFHLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUc7UUFBakYsQ0FBaUYsQ0FBQzthQUN6RixNQUFNLENBQUMsVUFBQSxHQUFHLElBQUksT0FBQSxDQUFDLENBQUMsR0FBRyxFQUFMLENBQUssQ0FBQztJQUp6QixDQUl5QixDQUFDO0lBQzlCLFlBQVksQ0FBQyxRQUFRLEdBQUc7UUFDcEIsT0FBQSxLQUFLLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQSxJQUFJLElBQUksT0FBQSxVQUFVLENBQUMsSUFBSSxDQUFHLEVBQWxCLENBQWtCLENBQUM7SUFBOUUsQ0FBOEUsQ0FBQztJQUNuRixZQUFZLENBQUMsT0FBTyxHQUFHLGdCQUFnQixDQUFDLE9BQU8sQ0FBQztJQUVoRCw0RkFBNEY7SUFDNUYsNkZBQTZGO0lBQzdGLDJGQUEyRjtJQUMzRixtRUFBbUU7SUFDbkUsWUFBWSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7QUFDNUIsQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILE1BQU0sVUFBVSxtQkFBbUIsQ0FDL0IsVUFBbUIsRUFDbkIsaUJBQW9EO0lBQ3RELElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEVBQUU7UUFDM0IsTUFBTSxJQUFJLEtBQUssQ0FBSSxVQUFVLENBQUMsSUFBSSxxREFBNkMsQ0FBQyxDQUFDO0tBQ2xGO0lBQ0QsSUFBTSxHQUFHLEdBQUcsY0FBYyxDQUFDLFVBQVUsQ0FBRyxDQUFDO0lBRXpDLElBQUksR0FBRyxDQUFDLHVCQUF1QixLQUFLLElBQUksRUFBRTtRQUN4QyxPQUFPLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQztLQUNwQztJQUVELElBQU0sTUFBTSxHQUE2QjtRQUN2QyxPQUFPLEVBQUUsR0FBRyxDQUFDLE9BQU8sSUFBSSxJQUFJO1FBQzVCLFdBQVcsRUFBRTtZQUNYLFVBQVUsRUFBRSxJQUFJLEdBQUcsRUFBTztZQUMxQixLQUFLLEVBQUUsSUFBSSxHQUFHLEVBQU87U0FDdEI7UUFDRCxRQUFRLEVBQUU7WUFDUixVQUFVLEVBQUUsSUFBSSxHQUFHLEVBQU87WUFDMUIsS0FBSyxFQUFFLElBQUksR0FBRyxFQUFPO1NBQ3RCO0tBQ0YsQ0FBQztJQUVGLGFBQWEsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUEsUUFBUTtRQUM5QyxJQUFNLGdCQUFnQixHQUFHLFFBQXVDLENBQUM7UUFFakUsSUFBSSxVQUFVLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtZQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDeEM7YUFBTTtZQUNMLHVFQUF1RTtZQUN2RSxvRkFBb0Y7WUFDcEYsY0FBYztZQUNkLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUM3QztJQUNILENBQUMsQ0FBQyxDQUFDO0lBRUgsYUFBYSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBSSxRQUFpQjtRQUN0RCxJQUFNLFlBQVksR0FBRyxRQUdwQixDQUFDO1FBRUYsSUFBSSxDQUFDLFVBQVUsQ0FBSSxZQUFZLENBQUMsRUFBRTtZQUNoQyxNQUFNLElBQUksS0FBSyxDQUFDLGVBQWEsWUFBWSxDQUFDLElBQUksOENBQXNDLENBQUMsQ0FBQztTQUN2RjtRQUVELElBQUksaUJBQWlCLEVBQUU7WUFDckIsaUJBQWlCLENBQUMsWUFBNEIsQ0FBQyxDQUFDO1NBQ2pEO1FBRUQsNEZBQTRGO1FBQzVGLGlEQUFpRDtRQUNqRCxJQUFNLGFBQWEsR0FBRyxtQkFBbUIsQ0FBQyxZQUFZLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUMzRSxhQUFhLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBQSxLQUFLLElBQUksT0FBQSxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQXhDLENBQXdDLENBQUMsQ0FBQztRQUM3RixhQUFhLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBQSxLQUFLLElBQUksT0FBQSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQW5DLENBQW1DLENBQUMsQ0FBQztJQUNyRixDQUFDLENBQUMsQ0FBQztJQUVILGFBQWEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUksUUFBaUI7UUFDdEQsSUFBTSxZQUFZLEdBQUcsUUFNcEIsQ0FBQztRQUVGLHNGQUFzRjtRQUN0RixnREFBZ0Q7UUFDaEQsSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDLEVBQUU7WUFDNUIsNEZBQTRGO1lBQzVGLG9FQUFvRTtZQUNwRSxJQUFNLGFBQWEsR0FBRyxtQkFBbUIsQ0FBQyxZQUFZLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUMzRSxhQUFhLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBQSxLQUFLO2dCQUM3QyxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3pDLE1BQU0sQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN4QyxDQUFDLENBQUMsQ0FBQztZQUNILGFBQWEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFBLEtBQUs7Z0JBQ3hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDcEMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ25DLENBQUMsQ0FBQyxDQUFDO1NBQ0o7YUFBTSxJQUFJLFVBQVUsQ0FBQyxZQUFZLENBQUMsRUFBRTtZQUNuQyxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDekM7YUFBTTtZQUNMLE1BQU0sQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUM5QztJQUNILENBQUMsQ0FBQyxDQUFDO0lBRUgsR0FBRyxDQUFDLHVCQUF1QixHQUFHLE1BQU0sQ0FBQztJQUNyQyxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBRUQsU0FBUyx5QkFBeUIsQ0FBQyxLQUF5QztJQUMxRSxJQUFJLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ2hDLE9BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBQztLQUN2QjtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVELFNBQVMscUJBQXFCLENBQUMsS0FBVTtJQUN2QyxPQUFRLEtBQXlCLENBQUMsUUFBUSxLQUFLLFNBQVMsQ0FBQztBQUMzRCxDQUFDO0FBRUQsU0FBUyxVQUFVLENBQUksS0FBYztJQUNuQyxPQUFPLENBQUMsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDakMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSM0luamVjdG9yTWV0YWRhdGFGYWNhZGUsIGdldENvbXBpbGVyRmFjYWRlfSBmcm9tICcuLi8uLi9jb21waWxlci9jb21waWxlcl9mYWNhZGUnO1xuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi4vLi4vZGkvZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtOR19JTkpFQ1RPUl9ERUZ9IGZyb20gJy4uLy4uL2RpL2ludGVyZmFjZS9kZWZzJztcbmltcG9ydCB7cmVmbGVjdERlcGVuZGVuY2llc30gZnJvbSAnLi4vLi4vZGkvaml0L3V0aWwnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0NvbXBvbmVudH0gZnJvbSAnLi4vLi4vbWV0YWRhdGEnO1xuaW1wb3J0IHtNb2R1bGVXaXRoUHJvdmlkZXJzLCBOZ01vZHVsZSwgTmdNb2R1bGVEZWYsIE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3Blc30gZnJvbSAnLi4vLi4vbWV0YWRhdGEvbmdfbW9kdWxlJztcbmltcG9ydCB7ZGVlcEZvckVhY2gsIGZsYXR0ZW59IGZyb20gJy4uLy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZiwgZ2V0RGlyZWN0aXZlRGVmLCBnZXROZ01vZHVsZURlZiwgZ2V0UGlwZURlZn0gZnJvbSAnLi4vZGVmaW5pdGlvbic7XG5pbXBvcnQge05HX0NPTVBfREVGLCBOR19ESVJfREVGLCBOR19NT0RfREVGLCBOR19QSVBFX0RFRn0gZnJvbSAnLi4vZmllbGRzJztcbmltcG9ydCB7Q29tcG9uZW50RGVmfSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOZ01vZHVsZVR5cGV9IGZyb20gJy4uL25nX21vZHVsZV9yZWYnO1xuaW1wb3J0IHttYXliZVVud3JhcEZuLCBzdHJpbmdpZnlGb3JFcnJvcn0gZnJvbSAnLi4vdXRpbC9taXNjX3V0aWxzJztcblxuaW1wb3J0IHthbmd1bGFyQ29yZUVudn0gZnJvbSAnLi9lbnZpcm9ubWVudCc7XG5cbmNvbnN0IEVNUFRZX0FSUkFZOiBUeXBlPGFueT5bXSA9IFtdO1xuXG5pbnRlcmZhY2UgTW9kdWxlUXVldWVJdGVtIHtcbiAgbW9kdWxlVHlwZTogVHlwZTxhbnk+O1xuICBuZ01vZHVsZTogTmdNb2R1bGU7XG59XG5cbmNvbnN0IG1vZHVsZVF1ZXVlOiBNb2R1bGVRdWV1ZUl0ZW1bXSA9IFtdO1xuXG4vKipcbiAqIEVucXVldWVzIG1vZHVsZURlZiB0byBiZSBjaGVja2VkIGxhdGVyIHRvIHNlZSBpZiBzY29wZSBjYW4gYmUgc2V0IG9uIGl0c1xuICogY29tcG9uZW50IGRlY2xhcmF0aW9ucy5cbiAqL1xuZnVuY3Rpb24gZW5xdWV1ZU1vZHVsZUZvckRlbGF5ZWRTY29waW5nKG1vZHVsZVR5cGU6IFR5cGU8YW55PiwgbmdNb2R1bGU6IE5nTW9kdWxlKSB7XG4gIG1vZHVsZVF1ZXVlLnB1c2goe21vZHVsZVR5cGUsIG5nTW9kdWxlfSk7XG59XG5cbmxldCBmbHVzaGluZ01vZHVsZVF1ZXVlID0gZmFsc2U7XG4vKipcbiAqIExvb3BzIG92ZXIgcXVldWVkIG1vZHVsZSBkZWZpbml0aW9ucywgaWYgYSBnaXZlbiBtb2R1bGUgZGVmaW5pdGlvbiBoYXMgYWxsIG9mIGl0c1xuICogZGVjbGFyYXRpb25zIHJlc29sdmVkLCBpdCBkZXF1ZXVlcyB0aGF0IG1vZHVsZSBkZWZpbml0aW9uIGFuZCBzZXRzIHRoZSBzY29wZSBvblxuICogaXRzIGRlY2xhcmF0aW9ucy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZsdXNoTW9kdWxlU2NvcGluZ1F1ZXVlQXNNdWNoQXNQb3NzaWJsZSgpIHtcbiAgaWYgKCFmbHVzaGluZ01vZHVsZVF1ZXVlKSB7XG4gICAgZmx1c2hpbmdNb2R1bGVRdWV1ZSA9IHRydWU7XG4gICAgdHJ5IHtcbiAgICAgIGZvciAobGV0IGkgPSBtb2R1bGVRdWV1ZS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBjb25zdCB7bW9kdWxlVHlwZSwgbmdNb2R1bGV9ID0gbW9kdWxlUXVldWVbaV07XG5cbiAgICAgICAgaWYgKG5nTW9kdWxlLmRlY2xhcmF0aW9ucyAmJiBuZ01vZHVsZS5kZWNsYXJhdGlvbnMuZXZlcnkoaXNSZXNvbHZlZERlY2xhcmF0aW9uKSkge1xuICAgICAgICAgIC8vIGRlcXVldWVcbiAgICAgICAgICBtb2R1bGVRdWV1ZS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgc2V0U2NvcGVPbkRlY2xhcmVkQ29tcG9uZW50cyhtb2R1bGVUeXBlLCBuZ01vZHVsZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgZmx1c2hpbmdNb2R1bGVRdWV1ZSA9IGZhbHNlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1dGh5IGlmIGEgZGVjbGFyYXRpb24gaGFzIHJlc29sdmVkLiBJZiB0aGUgZGVjbGFyYXRpb24gaGFwcGVucyB0byBiZVxuICogYW4gYXJyYXkgb2YgZGVjbGFyYXRpb25zLCBpdCB3aWxsIHJlY3Vyc2UgdG8gY2hlY2sgZWFjaCBkZWNsYXJhdGlvbiBpbiB0aGF0IGFycmF5XG4gKiAod2hpY2ggbWF5IGFsc28gYmUgYXJyYXlzKS5cbiAqL1xuZnVuY3Rpb24gaXNSZXNvbHZlZERlY2xhcmF0aW9uKGRlY2xhcmF0aW9uOiBhbnlbXSB8IFR5cGU8YW55Pik6IGJvb2xlYW4ge1xuICBpZiAoQXJyYXkuaXNBcnJheShkZWNsYXJhdGlvbikpIHtcbiAgICByZXR1cm4gZGVjbGFyYXRpb24uZXZlcnkoaXNSZXNvbHZlZERlY2xhcmF0aW9uKTtcbiAgfVxuICByZXR1cm4gISFyZXNvbHZlRm9yd2FyZFJlZihkZWNsYXJhdGlvbik7XG59XG5cbi8qKlxuICogQ29tcGlsZXMgYSBtb2R1bGUgaW4gSklUIG1vZGUuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBhdXRvbWF0aWNhbGx5IGdldHMgY2FsbGVkIHdoZW4gYSBjbGFzcyBoYXMgYSBgQE5nTW9kdWxlYCBkZWNvcmF0b3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlTmdNb2R1bGUobW9kdWxlVHlwZTogVHlwZTxhbnk+LCBuZ01vZHVsZTogTmdNb2R1bGUgPSB7fSk6IHZvaWQge1xuICBjb21waWxlTmdNb2R1bGVEZWZzKG1vZHVsZVR5cGUgYXMgTmdNb2R1bGVUeXBlLCBuZ01vZHVsZSk7XG5cbiAgLy8gQmVjYXVzZSB3ZSBkb24ndCBrbm93IGlmIGFsbCBkZWNsYXJhdGlvbnMgaGF2ZSByZXNvbHZlZCB5ZXQgYXQgdGhlIG1vbWVudCB0aGVcbiAgLy8gTmdNb2R1bGUgZGVjb3JhdG9yIGlzIGV4ZWN1dGluZywgd2UncmUgZW5xdWV1ZWluZyB0aGUgc2V0dGluZyBvZiBtb2R1bGUgc2NvcGVcbiAgLy8gb24gaXRzIGRlY2xhcmF0aW9ucyB0byBiZSBydW4gYXQgYSBsYXRlciB0aW1lIHdoZW4gYWxsIGRlY2xhcmF0aW9ucyBmb3IgdGhlIG1vZHVsZSxcbiAgLy8gaW5jbHVkaW5nIGZvcndhcmQgcmVmcywgaGF2ZSByZXNvbHZlZC5cbiAgZW5xdWV1ZU1vZHVsZUZvckRlbGF5ZWRTY29waW5nKG1vZHVsZVR5cGUsIG5nTW9kdWxlKTtcbn1cblxuLyoqXG4gKiBDb21waWxlcyBhbmQgYWRkcyB0aGUgYMm1bW9kYCBhbmQgYG5nSW5qZWN0b3JEZWZgIHByb3BlcnRpZXMgdG8gdGhlIG1vZHVsZSBjbGFzcy5cbiAqXG4gKiBJdCdzIHBvc3NpYmxlIHRvIGNvbXBpbGUgYSBtb2R1bGUgdmlhIHRoaXMgQVBJIHdoaWNoIHdpbGwgYWxsb3cgZHVwbGljYXRlIGRlY2xhcmF0aW9ucyBpbiBpdHNcbiAqIHJvb3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlTmdNb2R1bGVEZWZzKFxuICAgIG1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZSwgbmdNb2R1bGU6IE5nTW9kdWxlLFxuICAgIGFsbG93RHVwbGljYXRlRGVjbGFyYXRpb25zSW5Sb290OiBib29sZWFuID0gZmFsc2UpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobW9kdWxlVHlwZSwgJ1JlcXVpcmVkIHZhbHVlIG1vZHVsZVR5cGUnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobmdNb2R1bGUsICdSZXF1aXJlZCB2YWx1ZSBuZ01vZHVsZScpO1xuICBjb25zdCBkZWNsYXJhdGlvbnM6IFR5cGU8YW55PltdID0gZmxhdHRlbihuZ01vZHVsZS5kZWNsYXJhdGlvbnMgfHwgRU1QVFlfQVJSQVkpO1xuICBsZXQgbmdNb2R1bGVEZWY6IGFueSA9IG51bGw7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShtb2R1bGVUeXBlLCBOR19NT0RfREVGLCB7XG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKG5nTW9kdWxlRGVmID09PSBudWxsKSB7XG4gICAgICAgIGlmIChuZ0Rldk1vZGUgJiYgbmdNb2R1bGUuaW1wb3J0cyAmJiBuZ01vZHVsZS5pbXBvcnRzLmluZGV4T2YobW9kdWxlVHlwZSkgPiAtMSkge1xuICAgICAgICAgIC8vIFdlIG5lZWQgdG8gYXNzZXJ0IHRoaXMgaW1tZWRpYXRlbHksIGJlY2F1c2UgYWxsb3dpbmcgaXQgdG8gY29udGludWUgd2lsbCBjYXVzZSBpdCB0b1xuICAgICAgICAgIC8vIGdvIGludG8gYW4gaW5maW5pdGUgbG9vcCBiZWZvcmUgd2UndmUgcmVhY2hlZCB0aGUgcG9pbnQgd2hlcmUgd2UgdGhyb3cgYWxsIHRoZSBlcnJvcnMuXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAnJHtzdHJpbmdpZnlGb3JFcnJvcihtb2R1bGVUeXBlKX0nIG1vZHVsZSBjYW4ndCBpbXBvcnQgaXRzZWxmYCk7XG4gICAgICAgIH1cbiAgICAgICAgbmdNb2R1bGVEZWYgPSBnZXRDb21waWxlckZhY2FkZSgpLmNvbXBpbGVOZ01vZHVsZShcbiAgICAgICAgICAgIGFuZ3VsYXJDb3JlRW52LCBgbmc6Ly8vJHttb2R1bGVUeXBlLm5hbWV9L8m1bW9kLmpzYCwge1xuICAgICAgICAgICAgICB0eXBlOiBtb2R1bGVUeXBlLFxuICAgICAgICAgICAgICBib290c3RyYXA6IGZsYXR0ZW4obmdNb2R1bGUuYm9vdHN0cmFwIHx8IEVNUFRZX0FSUkFZKS5tYXAocmVzb2x2ZUZvcndhcmRSZWYpLFxuICAgICAgICAgICAgICBkZWNsYXJhdGlvbnM6IGRlY2xhcmF0aW9ucy5tYXAocmVzb2x2ZUZvcndhcmRSZWYpLFxuICAgICAgICAgICAgICBpbXBvcnRzOiBmbGF0dGVuKG5nTW9kdWxlLmltcG9ydHMgfHwgRU1QVFlfQVJSQVkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKHJlc29sdmVGb3J3YXJkUmVmKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChleHBhbmRNb2R1bGVXaXRoUHJvdmlkZXJzKSxcbiAgICAgICAgICAgICAgZXhwb3J0czogZmxhdHRlbihuZ01vZHVsZS5leHBvcnRzIHx8IEVNUFRZX0FSUkFZKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChyZXNvbHZlRm9yd2FyZFJlZilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoZXhwYW5kTW9kdWxlV2l0aFByb3ZpZGVycyksXG4gICAgICAgICAgICAgIGVtaXRJbmxpbmU6IHRydWUsXG4gICAgICAgICAgICAgIHNjaGVtYXM6IG5nTW9kdWxlLnNjaGVtYXMgPyBmbGF0dGVuKG5nTW9kdWxlLnNjaGVtYXMpIDogbnVsbCxcbiAgICAgICAgICAgICAgaWQ6IG5nTW9kdWxlLmlkIHx8IG51bGwsXG4gICAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZ01vZHVsZURlZjtcbiAgICB9XG4gIH0pO1xuXG4gIGxldCBuZ0luamVjdG9yRGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkobW9kdWxlVHlwZSwgTkdfSU5KRUNUT1JfREVGLCB7XG4gICAgZ2V0OiAoKSA9PiB7XG4gICAgICBpZiAobmdJbmplY3RvckRlZiA9PT0gbnVsbCkge1xuICAgICAgICBuZ0Rldk1vZGUgJiYgdmVyaWZ5U2VtYW50aWNzT2ZOZ01vZHVsZURlZihcbiAgICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGVUeXBlIGFzIGFueSBhcyBOZ01vZHVsZVR5cGUsIGFsbG93RHVwbGljYXRlRGVjbGFyYXRpb25zSW5Sb290KTtcbiAgICAgICAgY29uc3QgbWV0YTogUjNJbmplY3Rvck1ldGFkYXRhRmFjYWRlID0ge1xuICAgICAgICAgIG5hbWU6IG1vZHVsZVR5cGUubmFtZSxcbiAgICAgICAgICB0eXBlOiBtb2R1bGVUeXBlLFxuICAgICAgICAgIGRlcHM6IHJlZmxlY3REZXBlbmRlbmNpZXMobW9kdWxlVHlwZSksXG4gICAgICAgICAgcHJvdmlkZXJzOiBuZ01vZHVsZS5wcm92aWRlcnMgfHwgRU1QVFlfQVJSQVksXG4gICAgICAgICAgaW1wb3J0czogW1xuICAgICAgICAgICAgKG5nTW9kdWxlLmltcG9ydHMgfHwgRU1QVFlfQVJSQVkpLm1hcChyZXNvbHZlRm9yd2FyZFJlZiksXG4gICAgICAgICAgICAobmdNb2R1bGUuZXhwb3J0cyB8fCBFTVBUWV9BUlJBWSkubWFwKHJlc29sdmVGb3J3YXJkUmVmKSxcbiAgICAgICAgICBdLFxuICAgICAgICB9O1xuICAgICAgICBuZ0luamVjdG9yRGVmID0gZ2V0Q29tcGlsZXJGYWNhZGUoKS5jb21waWxlSW5qZWN0b3IoXG4gICAgICAgICAgICBhbmd1bGFyQ29yZUVudiwgYG5nOi8vLyR7bW9kdWxlVHlwZS5uYW1lfS9uZ0luamVjdG9yRGVmLmpzYCwgbWV0YSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmdJbmplY3RvckRlZjtcbiAgICB9LFxuICAgIC8vIE1ha2UgdGhlIHByb3BlcnR5IGNvbmZpZ3VyYWJsZSBpbiBkZXYgbW9kZSB0byBhbGxvdyBvdmVycmlkaW5nIGluIHRlc3RzXG4gICAgY29uZmlndXJhYmxlOiAhIW5nRGV2TW9kZSxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHZlcmlmeVNlbWFudGljc09mTmdNb2R1bGVEZWYoXG4gICAgbW9kdWxlVHlwZTogTmdNb2R1bGVUeXBlLCBhbGxvd0R1cGxpY2F0ZURlY2xhcmF0aW9uc0luUm9vdDogYm9vbGVhbixcbiAgICBpbXBvcnRpbmdNb2R1bGU/OiBOZ01vZHVsZVR5cGUpOiB2b2lkIHtcbiAgaWYgKHZlcmlmaWVkTmdNb2R1bGUuZ2V0KG1vZHVsZVR5cGUpKSByZXR1cm47XG4gIHZlcmlmaWVkTmdNb2R1bGUuc2V0KG1vZHVsZVR5cGUsIHRydWUpO1xuICBtb2R1bGVUeXBlID0gcmVzb2x2ZUZvcndhcmRSZWYobW9kdWxlVHlwZSk7XG4gIGxldCBuZ01vZHVsZURlZjogTmdNb2R1bGVEZWY8YW55PjtcbiAgaWYgKGltcG9ydGluZ01vZHVsZSkge1xuICAgIG5nTW9kdWxlRGVmID0gZ2V0TmdNb2R1bGVEZWYobW9kdWxlVHlwZSkgITtcbiAgICBpZiAoIW5nTW9kdWxlRGVmKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYFVuZXhwZWN0ZWQgdmFsdWUgJyR7bW9kdWxlVHlwZS5uYW1lfScgaW1wb3J0ZWQgYnkgdGhlIG1vZHVsZSAnJHtpbXBvcnRpbmdNb2R1bGUubmFtZX0nLiBQbGVhc2UgYWRkIGFuIEBOZ01vZHVsZSBhbm5vdGF0aW9uLmApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBuZ01vZHVsZURlZiA9IGdldE5nTW9kdWxlRGVmKG1vZHVsZVR5cGUsIHRydWUpO1xuICB9XG4gIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgZGVjbGFyYXRpb25zID0gbWF5YmVVbndyYXBGbihuZ01vZHVsZURlZi5kZWNsYXJhdGlvbnMpO1xuICBjb25zdCBpbXBvcnRzID0gbWF5YmVVbndyYXBGbihuZ01vZHVsZURlZi5pbXBvcnRzKTtcbiAgZmxhdHRlbihpbXBvcnRzKS5tYXAodW53cmFwTW9kdWxlV2l0aFByb3ZpZGVyc0ltcG9ydHMpLmZvckVhY2gobW9kID0+IHtcbiAgICB2ZXJpZnlTZW1hbnRpY3NPZk5nTW9kdWxlSW1wb3J0KG1vZCwgbW9kdWxlVHlwZSk7XG4gICAgdmVyaWZ5U2VtYW50aWNzT2ZOZ01vZHVsZURlZihtb2QsIGZhbHNlLCBtb2R1bGVUeXBlKTtcbiAgfSk7XG4gIGNvbnN0IGV4cG9ydHMgPSBtYXliZVVud3JhcEZuKG5nTW9kdWxlRGVmLmV4cG9ydHMpO1xuICBkZWNsYXJhdGlvbnMuZm9yRWFjaCh2ZXJpZnlEZWNsYXJhdGlvbnNIYXZlRGVmaW5pdGlvbnMpO1xuICBkZWNsYXJhdGlvbnMuZm9yRWFjaCh2ZXJpZnlEaXJlY3RpdmVzSGF2ZVNlbGVjdG9yKTtcbiAgY29uc3QgY29tYmluZWREZWNsYXJhdGlvbnM6IFR5cGU8YW55PltdID0gW1xuICAgIC4uLmRlY2xhcmF0aW9ucy5tYXAocmVzb2x2ZUZvcndhcmRSZWYpLFxuICAgIC4uLmZsYXR0ZW4oaW1wb3J0cy5tYXAoY29tcHV0ZUNvbWJpbmVkRXhwb3J0cykpLm1hcChyZXNvbHZlRm9yd2FyZFJlZiksXG4gIF07XG4gIGV4cG9ydHMuZm9yRWFjaCh2ZXJpZnlFeHBvcnRzQXJlRGVjbGFyZWRPclJlRXhwb3J0ZWQpO1xuICBkZWNsYXJhdGlvbnMuZm9yRWFjaChkZWNsID0+IHZlcmlmeURlY2xhcmF0aW9uSXNVbmlxdWUoZGVjbCwgYWxsb3dEdXBsaWNhdGVEZWNsYXJhdGlvbnNJblJvb3QpKTtcbiAgZGVjbGFyYXRpb25zLmZvckVhY2godmVyaWZ5Q29tcG9uZW50RW50cnlDb21wb25lbnRzSXNQYXJ0T2ZOZ01vZHVsZSk7XG5cbiAgY29uc3QgbmdNb2R1bGUgPSBnZXRBbm5vdGF0aW9uPE5nTW9kdWxlPihtb2R1bGVUeXBlLCAnTmdNb2R1bGUnKTtcbiAgaWYgKG5nTW9kdWxlKSB7XG4gICAgbmdNb2R1bGUuaW1wb3J0cyAmJlxuICAgICAgICBmbGF0dGVuKG5nTW9kdWxlLmltcG9ydHMpLm1hcCh1bndyYXBNb2R1bGVXaXRoUHJvdmlkZXJzSW1wb3J0cykuZm9yRWFjaChtb2QgPT4ge1xuICAgICAgICAgIHZlcmlmeVNlbWFudGljc09mTmdNb2R1bGVJbXBvcnQobW9kLCBtb2R1bGVUeXBlKTtcbiAgICAgICAgICB2ZXJpZnlTZW1hbnRpY3NPZk5nTW9kdWxlRGVmKG1vZCwgZmFsc2UsIG1vZHVsZVR5cGUpO1xuICAgICAgICB9KTtcbiAgICBuZ01vZHVsZS5ib290c3RyYXAgJiYgZGVlcEZvckVhY2gobmdNb2R1bGUuYm9vdHN0cmFwLCB2ZXJpZnlDb3JyZWN0Qm9vdHN0cmFwVHlwZSk7XG4gICAgbmdNb2R1bGUuYm9vdHN0cmFwICYmIGRlZXBGb3JFYWNoKG5nTW9kdWxlLmJvb3RzdHJhcCwgdmVyaWZ5Q29tcG9uZW50SXNQYXJ0T2ZOZ01vZHVsZSk7XG4gICAgbmdNb2R1bGUuZW50cnlDb21wb25lbnRzICYmXG4gICAgICAgIGRlZXBGb3JFYWNoKG5nTW9kdWxlLmVudHJ5Q29tcG9uZW50cywgdmVyaWZ5Q29tcG9uZW50SXNQYXJ0T2ZOZ01vZHVsZSk7XG4gIH1cblxuICAvLyBUaHJvdyBFcnJvciBpZiBhbnkgZXJyb3JzIHdlcmUgZGV0ZWN0ZWQuXG4gIGlmIChlcnJvcnMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGVycm9ycy5qb2luKCdcXG4nKSk7XG4gIH1cbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gIGZ1bmN0aW9uIHZlcmlmeURlY2xhcmF0aW9uc0hhdmVEZWZpbml0aW9ucyh0eXBlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgICB0eXBlID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZSk7XG4gICAgY29uc3QgZGVmID0gZ2V0Q29tcG9uZW50RGVmKHR5cGUpIHx8IGdldERpcmVjdGl2ZURlZih0eXBlKSB8fCBnZXRQaXBlRGVmKHR5cGUpO1xuICAgIGlmICghZGVmKSB7XG4gICAgICBlcnJvcnMucHVzaChcbiAgICAgICAgICBgVW5leHBlY3RlZCB2YWx1ZSAnJHtzdHJpbmdpZnlGb3JFcnJvcih0eXBlKX0nIGRlY2xhcmVkIGJ5IHRoZSBtb2R1bGUgJyR7c3RyaW5naWZ5Rm9yRXJyb3IobW9kdWxlVHlwZSl9Jy4gUGxlYXNlIGFkZCBhIEBQaXBlL0BEaXJlY3RpdmUvQENvbXBvbmVudCBhbm5vdGF0aW9uLmApO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHZlcmlmeURpcmVjdGl2ZXNIYXZlU2VsZWN0b3IodHlwZTogVHlwZTxhbnk+KTogdm9pZCB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICAgIGNvbnN0IGRlZiA9IGdldERpcmVjdGl2ZURlZih0eXBlKTtcbiAgICBpZiAoIWdldENvbXBvbmVudERlZih0eXBlKSAmJiBkZWYgJiYgZGVmLnNlbGVjdG9ycy5sZW5ndGggPT0gMCkge1xuICAgICAgZXJyb3JzLnB1c2goYERpcmVjdGl2ZSAke3N0cmluZ2lmeUZvckVycm9yKHR5cGUpfSBoYXMgbm8gc2VsZWN0b3IsIHBsZWFzZSBhZGQgaXQhYCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdmVyaWZ5RXhwb3J0c0FyZURlY2xhcmVkT3JSZUV4cG9ydGVkKHR5cGU6IFR5cGU8YW55Pikge1xuICAgIHR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlKTtcbiAgICBjb25zdCBraW5kID0gZ2V0Q29tcG9uZW50RGVmKHR5cGUpICYmICdjb21wb25lbnQnIHx8IGdldERpcmVjdGl2ZURlZih0eXBlKSAmJiAnZGlyZWN0aXZlJyB8fFxuICAgICAgICBnZXRQaXBlRGVmKHR5cGUpICYmICdwaXBlJztcbiAgICBpZiAoa2luZCkge1xuICAgICAgLy8gb25seSBjaGVja2VkIGlmIHdlIGFyZSBkZWNsYXJlZCBhcyBDb21wb25lbnQsIERpcmVjdGl2ZSwgb3IgUGlwZVxuICAgICAgLy8gTW9kdWxlcyBkb24ndCBuZWVkIHRvIGJlIGRlY2xhcmVkIG9yIGltcG9ydGVkLlxuICAgICAgaWYgKGNvbWJpbmVkRGVjbGFyYXRpb25zLmxhc3RJbmRleE9mKHR5cGUpID09PSAtMSkge1xuICAgICAgICAvLyBXZSBhcmUgZXhwb3J0aW5nIHNvbWV0aGluZyB3aGljaCB3ZSBkb24ndCBleHBsaWNpdGx5IGRlY2xhcmUgb3IgaW1wb3J0LlxuICAgICAgICBlcnJvcnMucHVzaChcbiAgICAgICAgICAgIGBDYW4ndCBleHBvcnQgJHtraW5kfSAke3N0cmluZ2lmeUZvckVycm9yKHR5cGUpfSBmcm9tICR7c3RyaW5naWZ5Rm9yRXJyb3IobW9kdWxlVHlwZSl9IGFzIGl0IHdhcyBuZWl0aGVyIGRlY2xhcmVkIG5vciBpbXBvcnRlZCFgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB2ZXJpZnlEZWNsYXJhdGlvbklzVW5pcXVlKHR5cGU6IFR5cGU8YW55Piwgc3VwcHJlc3NFcnJvcnM6IGJvb2xlYW4pIHtcbiAgICB0eXBlID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZSk7XG4gICAgY29uc3QgZXhpc3RpbmdNb2R1bGUgPSBvd25lck5nTW9kdWxlLmdldCh0eXBlKTtcbiAgICBpZiAoZXhpc3RpbmdNb2R1bGUgJiYgZXhpc3RpbmdNb2R1bGUgIT09IG1vZHVsZVR5cGUpIHtcbiAgICAgIGlmICghc3VwcHJlc3NFcnJvcnMpIHtcbiAgICAgICAgY29uc3QgbW9kdWxlcyA9IFtleGlzdGluZ01vZHVsZSwgbW9kdWxlVHlwZV0ubWFwKHN0cmluZ2lmeUZvckVycm9yKS5zb3J0KCk7XG4gICAgICAgIGVycm9ycy5wdXNoKFxuICAgICAgICAgICAgYFR5cGUgJHtzdHJpbmdpZnlGb3JFcnJvcih0eXBlKX0gaXMgcGFydCBvZiB0aGUgZGVjbGFyYXRpb25zIG9mIDIgbW9kdWxlczogJHttb2R1bGVzWzBdfSBhbmQgJHttb2R1bGVzWzFdfSEgYCArXG4gICAgICAgICAgICBgUGxlYXNlIGNvbnNpZGVyIG1vdmluZyAke3N0cmluZ2lmeUZvckVycm9yKHR5cGUpfSB0byBhIGhpZ2hlciBtb2R1bGUgdGhhdCBpbXBvcnRzICR7bW9kdWxlc1swXX0gYW5kICR7bW9kdWxlc1sxXX0uIGAgK1xuICAgICAgICAgICAgYFlvdSBjYW4gYWxzbyBjcmVhdGUgYSBuZXcgTmdNb2R1bGUgdGhhdCBleHBvcnRzIGFuZCBpbmNsdWRlcyAke3N0cmluZ2lmeUZvckVycm9yKHR5cGUpfSB0aGVuIGltcG9ydCB0aGF0IE5nTW9kdWxlIGluICR7bW9kdWxlc1swXX0gYW5kICR7bW9kdWxlc1sxXX0uYCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE1hcmsgdHlwZSBhcyBoYXZpbmcgb3duZXIuXG4gICAgICBvd25lck5nTW9kdWxlLnNldCh0eXBlLCBtb2R1bGVUeXBlKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB2ZXJpZnlDb21wb25lbnRJc1BhcnRPZk5nTW9kdWxlKHR5cGU6IFR5cGU8YW55Pikge1xuICAgIHR5cGUgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlKTtcbiAgICBjb25zdCBleGlzdGluZ01vZHVsZSA9IG93bmVyTmdNb2R1bGUuZ2V0KHR5cGUpO1xuICAgIGlmICghZXhpc3RpbmdNb2R1bGUpIHtcbiAgICAgIGVycm9ycy5wdXNoKFxuICAgICAgICAgIGBDb21wb25lbnQgJHtzdHJpbmdpZnlGb3JFcnJvcih0eXBlKX0gaXMgbm90IHBhcnQgb2YgYW55IE5nTW9kdWxlIG9yIHRoZSBtb2R1bGUgaGFzIG5vdCBiZWVuIGltcG9ydGVkIGludG8geW91ciBtb2R1bGUuYCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdmVyaWZ5Q29ycmVjdEJvb3RzdHJhcFR5cGUodHlwZTogVHlwZTxhbnk+KSB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICAgIGlmICghZ2V0Q29tcG9uZW50RGVmKHR5cGUpKSB7XG4gICAgICBlcnJvcnMucHVzaChgJHtzdHJpbmdpZnlGb3JFcnJvcih0eXBlKX0gY2Fubm90IGJlIHVzZWQgYXMgYW4gZW50cnkgY29tcG9uZW50LmApO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHZlcmlmeUNvbXBvbmVudEVudHJ5Q29tcG9uZW50c0lzUGFydE9mTmdNb2R1bGUodHlwZTogVHlwZTxhbnk+KSB7XG4gICAgdHlwZSA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGUpO1xuICAgIGlmIChnZXRDb21wb25lbnREZWYodHlwZSkpIHtcbiAgICAgIC8vIFdlIGtub3cgd2UgYXJlIGNvbXBvbmVudFxuICAgICAgY29uc3QgY29tcG9uZW50ID0gZ2V0QW5ub3RhdGlvbjxDb21wb25lbnQ+KHR5cGUsICdDb21wb25lbnQnKTtcbiAgICAgIGlmIChjb21wb25lbnQgJiYgY29tcG9uZW50LmVudHJ5Q29tcG9uZW50cykge1xuICAgICAgICBkZWVwRm9yRWFjaChjb21wb25lbnQuZW50cnlDb21wb25lbnRzLCB2ZXJpZnlDb21wb25lbnRJc1BhcnRPZk5nTW9kdWxlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB2ZXJpZnlTZW1hbnRpY3NPZk5nTW9kdWxlSW1wb3J0KHR5cGU6IFR5cGU8YW55PiwgaW1wb3J0aW5nTW9kdWxlOiBUeXBlPGFueT4pIHtcbiAgICB0eXBlID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZSk7XG5cbiAgICBpZiAoZ2V0Q29tcG9uZW50RGVmKHR5cGUpIHx8IGdldERpcmVjdGl2ZURlZih0eXBlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBVbmV4cGVjdGVkIGRpcmVjdGl2ZSAnJHt0eXBlLm5hbWV9JyBpbXBvcnRlZCBieSB0aGUgbW9kdWxlICcke2ltcG9ydGluZ01vZHVsZS5uYW1lfScuIFBsZWFzZSBhZGQgYW4gQE5nTW9kdWxlIGFubm90YXRpb24uYCk7XG4gICAgfVxuXG4gICAgaWYgKGdldFBpcGVEZWYodHlwZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgVW5leHBlY3RlZCBwaXBlICcke3R5cGUubmFtZX0nIGltcG9ydGVkIGJ5IHRoZSBtb2R1bGUgJyR7aW1wb3J0aW5nTW9kdWxlLm5hbWV9Jy4gUGxlYXNlIGFkZCBhbiBATmdNb2R1bGUgYW5ub3RhdGlvbi5gKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdW53cmFwTW9kdWxlV2l0aFByb3ZpZGVyc0ltcG9ydHMoXG4gICAgdHlwZU9yV2l0aFByb3ZpZGVyczogTmdNb2R1bGVUeXBlPGFueT58IHtuZ01vZHVsZTogTmdNb2R1bGVUeXBlPGFueT59KTogTmdNb2R1bGVUeXBlPGFueT4ge1xuICB0eXBlT3JXaXRoUHJvdmlkZXJzID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZU9yV2l0aFByb3ZpZGVycyk7XG4gIHJldHVybiAodHlwZU9yV2l0aFByb3ZpZGVycyBhcyBhbnkpLm5nTW9kdWxlIHx8IHR5cGVPcldpdGhQcm92aWRlcnM7XG59XG5cbmZ1bmN0aW9uIGdldEFubm90YXRpb248VD4odHlwZTogYW55LCBuYW1lOiBzdHJpbmcpOiBUfG51bGwge1xuICBsZXQgYW5ub3RhdGlvbjogVHxudWxsID0gbnVsbDtcbiAgY29sbGVjdCh0eXBlLl9fYW5ub3RhdGlvbnNfXyk7XG4gIGNvbGxlY3QodHlwZS5kZWNvcmF0b3JzKTtcbiAgcmV0dXJuIGFubm90YXRpb247XG5cbiAgZnVuY3Rpb24gY29sbGVjdChhbm5vdGF0aW9uczogYW55W10gfCBudWxsKSB7XG4gICAgaWYgKGFubm90YXRpb25zKSB7XG4gICAgICBhbm5vdGF0aW9ucy5mb3JFYWNoKHJlYWRBbm5vdGF0aW9uKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZWFkQW5ub3RhdGlvbihcbiAgICAgIGRlY29yYXRvcjoge3R5cGU6IHtwcm90b3R5cGU6IHtuZ01ldGFkYXRhTmFtZTogc3RyaW5nfSwgYXJnczogYW55W119LCBhcmdzOiBhbnl9KTogdm9pZCB7XG4gICAgaWYgKCFhbm5vdGF0aW9uKSB7XG4gICAgICBjb25zdCBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihkZWNvcmF0b3IpO1xuICAgICAgaWYgKHByb3RvLm5nTWV0YWRhdGFOYW1lID09IG5hbWUpIHtcbiAgICAgICAgYW5ub3RhdGlvbiA9IGRlY29yYXRvciBhcyBhbnk7XG4gICAgICB9IGVsc2UgaWYgKGRlY29yYXRvci50eXBlKSB7XG4gICAgICAgIGNvbnN0IHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGRlY29yYXRvci50eXBlKTtcbiAgICAgICAgaWYgKHByb3RvLm5nTWV0YWRhdGFOYW1lID09IG5hbWUpIHtcbiAgICAgICAgICBhbm5vdGF0aW9uID0gZGVjb3JhdG9yLmFyZ3NbMF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBLZWVwIHRyYWNrIG9mIGNvbXBpbGVkIGNvbXBvbmVudHMuIFRoaXMgaXMgbmVlZGVkIGJlY2F1c2UgaW4gdGVzdHMgd2Ugb2Z0ZW4gd2FudCB0byBjb21waWxlIHRoZVxuICogc2FtZSBjb21wb25lbnQgd2l0aCBtb3JlIHRoYW4gb25lIE5nTW9kdWxlLiBUaGlzIHdvdWxkIGNhdXNlIGFuIGVycm9yIHVubGVzcyB3ZSByZXNldCB3aGljaFxuICogTmdNb2R1bGUgdGhlIGNvbXBvbmVudCBiZWxvbmdzIHRvLiBXZSBrZWVwIHRoZSBsaXN0IG9mIGNvbXBpbGVkIGNvbXBvbmVudHMgaGVyZSBzbyB0aGF0IHRoZVxuICogVGVzdEJlZCBjYW4gcmVzZXQgaXQgbGF0ZXIuXG4gKi9cbmxldCBvd25lck5nTW9kdWxlID0gbmV3IE1hcDxUeXBlPGFueT4sIE5nTW9kdWxlVHlwZTxhbnk+PigpO1xubGV0IHZlcmlmaWVkTmdNb2R1bGUgPSBuZXcgTWFwPE5nTW9kdWxlVHlwZTxhbnk+LCBib29sZWFuPigpO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRDb21waWxlZENvbXBvbmVudHMoKTogdm9pZCB7XG4gIG93bmVyTmdNb2R1bGUgPSBuZXcgTWFwPFR5cGU8YW55PiwgTmdNb2R1bGVUeXBlPGFueT4+KCk7XG4gIHZlcmlmaWVkTmdNb2R1bGUgPSBuZXcgTWFwPE5nTW9kdWxlVHlwZTxhbnk+LCBib29sZWFuPigpO1xuICBtb2R1bGVRdWV1ZS5sZW5ndGggPSAwO1xufVxuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBjb21iaW5lZCBkZWNsYXJhdGlvbnMgb2YgZXhwbGljaXQgZGVjbGFyYXRpb25zLCBhcyB3ZWxsIGFzIGRlY2xhcmF0aW9ucyBpbmhlcml0ZWQgYnlcbiAqIHRyYXZlcnNpbmcgdGhlIGV4cG9ydHMgb2YgaW1wb3J0ZWQgbW9kdWxlcy5cbiAqIEBwYXJhbSB0eXBlXG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVDb21iaW5lZEV4cG9ydHModHlwZTogVHlwZTxhbnk+KTogVHlwZTxhbnk+W10ge1xuICB0eXBlID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZSk7XG4gIGNvbnN0IG5nTW9kdWxlRGVmID0gZ2V0TmdNb2R1bGVEZWYodHlwZSwgdHJ1ZSk7XG4gIHJldHVybiBbLi4uZmxhdHRlbihtYXliZVVud3JhcEZuKG5nTW9kdWxlRGVmLmV4cG9ydHMpLm1hcCgodHlwZSkgPT4ge1xuICAgIGNvbnN0IG5nTW9kdWxlRGVmID0gZ2V0TmdNb2R1bGVEZWYodHlwZSk7XG4gICAgaWYgKG5nTW9kdWxlRGVmKSB7XG4gICAgICB2ZXJpZnlTZW1hbnRpY3NPZk5nTW9kdWxlRGVmKHR5cGUgYXMgYW55IGFzIE5nTW9kdWxlVHlwZSwgZmFsc2UpO1xuICAgICAgcmV0dXJuIGNvbXB1dGVDb21iaW5lZEV4cG9ydHModHlwZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0eXBlO1xuICAgIH1cbiAgfSkpXTtcbn1cblxuLyoqXG4gKiBTb21lIGRlY2xhcmVkIGNvbXBvbmVudHMgbWF5IGJlIGNvbXBpbGVkIGFzeW5jaHJvbm91c2x5LCBhbmQgdGh1cyBtYXkgbm90IGhhdmUgdGhlaXJcbiAqIMm1Y21wIHNldCB5ZXQuIElmIHRoaXMgaXMgdGhlIGNhc2UsIHRoZW4gYSByZWZlcmVuY2UgdG8gdGhlIG1vZHVsZSBpcyB3cml0dGVuIGludG9cbiAqIHRoZSBgbmdTZWxlY3RvclNjb3BlYCBwcm9wZXJ0eSBvZiB0aGUgZGVjbGFyZWQgdHlwZS5cbiAqL1xuZnVuY3Rpb24gc2V0U2NvcGVPbkRlY2xhcmVkQ29tcG9uZW50cyhtb2R1bGVUeXBlOiBUeXBlPGFueT4sIG5nTW9kdWxlOiBOZ01vZHVsZSkge1xuICBjb25zdCBkZWNsYXJhdGlvbnM6IFR5cGU8YW55PltdID0gZmxhdHRlbihuZ01vZHVsZS5kZWNsYXJhdGlvbnMgfHwgRU1QVFlfQVJSQVkpO1xuXG4gIGNvbnN0IHRyYW5zaXRpdmVTY29wZXMgPSB0cmFuc2l0aXZlU2NvcGVzRm9yKG1vZHVsZVR5cGUpO1xuXG4gIGRlY2xhcmF0aW9ucy5mb3JFYWNoKGRlY2xhcmF0aW9uID0+IHtcbiAgICBpZiAoZGVjbGFyYXRpb24uaGFzT3duUHJvcGVydHkoTkdfQ09NUF9ERUYpKSB7XG4gICAgICAvLyBBIGDJtWNtcGAgZmllbGQgZXhpc3RzIC0gZ28gYWhlYWQgYW5kIHBhdGNoIHRoZSBjb21wb25lbnQgZGlyZWN0bHkuXG4gICAgICBjb25zdCBjb21wb25lbnQgPSBkZWNsYXJhdGlvbiBhcyBUeXBlPGFueT4mIHvJtWNtcDogQ29tcG9uZW50RGVmPGFueT59O1xuICAgICAgY29uc3QgY29tcG9uZW50RGVmID0gZ2V0Q29tcG9uZW50RGVmKGNvbXBvbmVudCkgITtcbiAgICAgIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlKGNvbXBvbmVudERlZiwgdHJhbnNpdGl2ZVNjb3Blcyk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICAgIWRlY2xhcmF0aW9uLmhhc093blByb3BlcnR5KE5HX0RJUl9ERUYpICYmICFkZWNsYXJhdGlvbi5oYXNPd25Qcm9wZXJ0eShOR19QSVBFX0RFRikpIHtcbiAgICAgIC8vIFNldCBgbmdTZWxlY3RvclNjb3BlYCBmb3IgZnV0dXJlIHJlZmVyZW5jZSB3aGVuIHRoZSBjb21wb25lbnQgY29tcGlsYXRpb24gZmluaXNoZXMuXG4gICAgICAoZGVjbGFyYXRpb24gYXMgVHlwZTxhbnk+JiB7bmdTZWxlY3RvclNjb3BlPzogYW55fSkubmdTZWxlY3RvclNjb3BlID0gbW9kdWxlVHlwZTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKipcbiAqIFBhdGNoIHRoZSBkZWZpbml0aW9uIG9mIGEgY29tcG9uZW50IHdpdGggZGlyZWN0aXZlcyBhbmQgcGlwZXMgZnJvbSB0aGUgY29tcGlsYXRpb24gc2NvcGUgb2ZcbiAqIGEgZ2l2ZW4gbW9kdWxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGU8Qz4oXG4gICAgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8Qz4sIHRyYW5zaXRpdmVTY29wZXM6IE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3Blcykge1xuICBjb21wb25lbnREZWYuZGlyZWN0aXZlRGVmcyA9ICgpID0+XG4gICAgICBBcnJheS5mcm9tKHRyYW5zaXRpdmVTY29wZXMuY29tcGlsYXRpb24uZGlyZWN0aXZlcylcbiAgICAgICAgICAubWFwKFxuICAgICAgICAgICAgICBkaXIgPT5cbiAgICAgICAgICAgICAgICAgIGRpci5oYXNPd25Qcm9wZXJ0eShOR19DT01QX0RFRikgPyBnZXRDb21wb25lbnREZWYoZGlyKSAhIDogZ2V0RGlyZWN0aXZlRGVmKGRpcikgISlcbiAgICAgICAgICAuZmlsdGVyKGRlZiA9PiAhIWRlZik7XG4gIGNvbXBvbmVudERlZi5waXBlRGVmcyA9ICgpID0+XG4gICAgICBBcnJheS5mcm9tKHRyYW5zaXRpdmVTY29wZXMuY29tcGlsYXRpb24ucGlwZXMpLm1hcChwaXBlID0+IGdldFBpcGVEZWYocGlwZSkgISk7XG4gIGNvbXBvbmVudERlZi5zY2hlbWFzID0gdHJhbnNpdGl2ZVNjb3Blcy5zY2hlbWFzO1xuXG4gIC8vIFNpbmNlIHdlIGF2b2lkIENvbXBvbmVudHMvRGlyZWN0aXZlcy9QaXBlcyByZWNvbXBpbGluZyBpbiBjYXNlIHRoZXJlIGFyZSBubyBvdmVycmlkZXMsIHdlXG4gIC8vIG1heSBmYWNlIGEgcHJvYmxlbSB3aGVyZSBwcmV2aW91c2x5IGNvbXBpbGVkIGRlZnMgYXZhaWxhYmxlIHRvIGEgZ2l2ZW4gQ29tcG9uZW50L0RpcmVjdGl2ZVxuICAvLyBhcmUgY2FjaGVkIGluIFRWaWV3IGFuZCBtYXkgYmVjb21lIHN0YWxlIChpbiBjYXNlIGFueSBvZiB0aGVzZSBkZWZzIGdldHMgcmVjb21waWxlZCkuIEluXG4gIC8vIG9yZGVyIHRvIGF2b2lkIHRoaXMgcHJvYmxlbSwgd2UgZm9yY2UgZnJlc2ggVFZpZXcgdG8gYmUgY3JlYXRlZC5cbiAgY29tcG9uZW50RGVmLnRWaWV3ID0gbnVsbDtcbn1cblxuLyoqXG4gKiBDb21wdXRlIHRoZSBwYWlyIG9mIHRyYW5zaXRpdmUgc2NvcGVzIChjb21waWxhdGlvbiBzY29wZSBhbmQgZXhwb3J0ZWQgc2NvcGUpIGZvciBhIGdpdmVuIG1vZHVsZS5cbiAqXG4gKiBUaGlzIG9wZXJhdGlvbiBpcyBtZW1vaXplZCBhbmQgdGhlIHJlc3VsdCBpcyBjYWNoZWQgb24gdGhlIG1vZHVsZSdzIGRlZmluaXRpb24uIEl0IGNhbiBiZSBjYWxsZWRcbiAqIG9uIG1vZHVsZXMgd2l0aCBjb21wb25lbnRzIHRoYXQgaGF2ZSBub3QgZnVsbHkgY29tcGlsZWQgeWV0LCBidXQgdGhlIHJlc3VsdCBzaG91bGQgbm90IGJlIHVzZWRcbiAqIHVudGlsIHRoZXkgaGF2ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zaXRpdmVTY29wZXNGb3I8VD4oXG4gICAgbW9kdWxlVHlwZTogVHlwZTxUPixcbiAgICBwcm9jZXNzTmdNb2R1bGVGbj86IChuZ01vZHVsZTogTmdNb2R1bGVUeXBlKSA9PiB2b2lkKTogTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzIHtcbiAgaWYgKCFpc05nTW9kdWxlKG1vZHVsZVR5cGUpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke21vZHVsZVR5cGUubmFtZX0gZG9lcyBub3QgaGF2ZSBhIG1vZHVsZSBkZWYgKMm1bW9kIHByb3BlcnR5KWApO1xuICB9XG4gIGNvbnN0IGRlZiA9IGdldE5nTW9kdWxlRGVmKG1vZHVsZVR5cGUpICE7XG5cbiAgaWYgKGRlZi50cmFuc2l0aXZlQ29tcGlsZVNjb3BlcyAhPT0gbnVsbCkge1xuICAgIHJldHVybiBkZWYudHJhbnNpdGl2ZUNvbXBpbGVTY29wZXM7XG4gIH1cblxuICBjb25zdCBzY29wZXM6IE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3BlcyA9IHtcbiAgICBzY2hlbWFzOiBkZWYuc2NoZW1hcyB8fCBudWxsLFxuICAgIGNvbXBpbGF0aW9uOiB7XG4gICAgICBkaXJlY3RpdmVzOiBuZXcgU2V0PGFueT4oKSxcbiAgICAgIHBpcGVzOiBuZXcgU2V0PGFueT4oKSxcbiAgICB9LFxuICAgIGV4cG9ydGVkOiB7XG4gICAgICBkaXJlY3RpdmVzOiBuZXcgU2V0PGFueT4oKSxcbiAgICAgIHBpcGVzOiBuZXcgU2V0PGFueT4oKSxcbiAgICB9LFxuICB9O1xuXG4gIG1heWJlVW53cmFwRm4oZGVmLmRlY2xhcmF0aW9ucykuZm9yRWFjaChkZWNsYXJlZCA9PiB7XG4gICAgY29uc3QgZGVjbGFyZWRXaXRoRGVmcyA9IGRlY2xhcmVkIGFzIFR5cGU8YW55PiYgeyDJtXBpcGU/OiBhbnk7IH07XG5cbiAgICBpZiAoZ2V0UGlwZURlZihkZWNsYXJlZFdpdGhEZWZzKSkge1xuICAgICAgc2NvcGVzLmNvbXBpbGF0aW9uLnBpcGVzLmFkZChkZWNsYXJlZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEVpdGhlciBkZWNsYXJlZCBoYXMgYSDJtWNtcCBvciDJtWRpciwgb3IgaXQncyBhIGNvbXBvbmVudCB3aGljaCBoYXNuJ3RcbiAgICAgIC8vIGhhZCBpdHMgdGVtcGxhdGUgY29tcGlsZWQgeWV0LiBJbiBlaXRoZXIgY2FzZSwgaXQgZ2V0cyBhZGRlZCB0byB0aGUgY29tcGlsYXRpb24nc1xuICAgICAgLy8gZGlyZWN0aXZlcy5cbiAgICAgIHNjb3Blcy5jb21waWxhdGlvbi5kaXJlY3RpdmVzLmFkZChkZWNsYXJlZCk7XG4gICAgfVxuICB9KTtcblxuICBtYXliZVVud3JhcEZuKGRlZi5pbXBvcnRzKS5mb3JFYWNoKDxJPihpbXBvcnRlZDogVHlwZTxJPikgPT4ge1xuICAgIGNvbnN0IGltcG9ydGVkVHlwZSA9IGltcG9ydGVkIGFzIFR5cGU8ST4mIHtcbiAgICAgIC8vIElmIGltcG9ydGVkIGlzIGFuIEBOZ01vZHVsZTpcbiAgICAgIMm1bW9kPzogTmdNb2R1bGVEZWY8ST47XG4gICAgfTtcblxuICAgIGlmICghaXNOZ01vZHVsZTxJPihpbXBvcnRlZFR5cGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEltcG9ydGluZyAke2ltcG9ydGVkVHlwZS5uYW1lfSB3aGljaCBkb2VzIG5vdCBoYXZlIGEgybVtb2QgcHJvcGVydHlgKTtcbiAgICB9XG5cbiAgICBpZiAocHJvY2Vzc05nTW9kdWxlRm4pIHtcbiAgICAgIHByb2Nlc3NOZ01vZHVsZUZuKGltcG9ydGVkVHlwZSBhcyBOZ01vZHVsZVR5cGUpO1xuICAgIH1cblxuICAgIC8vIFdoZW4gdGhpcyBtb2R1bGUgaW1wb3J0cyBhbm90aGVyLCB0aGUgaW1wb3J0ZWQgbW9kdWxlJ3MgZXhwb3J0ZWQgZGlyZWN0aXZlcyBhbmQgcGlwZXMgYXJlXG4gICAgLy8gYWRkZWQgdG8gdGhlIGNvbXBpbGF0aW9uIHNjb3BlIG9mIHRoaXMgbW9kdWxlLlxuICAgIGNvbnN0IGltcG9ydGVkU2NvcGUgPSB0cmFuc2l0aXZlU2NvcGVzRm9yKGltcG9ydGVkVHlwZSwgcHJvY2Vzc05nTW9kdWxlRm4pO1xuICAgIGltcG9ydGVkU2NvcGUuZXhwb3J0ZWQuZGlyZWN0aXZlcy5mb3JFYWNoKGVudHJ5ID0+IHNjb3Blcy5jb21waWxhdGlvbi5kaXJlY3RpdmVzLmFkZChlbnRyeSkpO1xuICAgIGltcG9ydGVkU2NvcGUuZXhwb3J0ZWQucGlwZXMuZm9yRWFjaChlbnRyeSA9PiBzY29wZXMuY29tcGlsYXRpb24ucGlwZXMuYWRkKGVudHJ5KSk7XG4gIH0pO1xuXG4gIG1heWJlVW53cmFwRm4oZGVmLmV4cG9ydHMpLmZvckVhY2goPEU+KGV4cG9ydGVkOiBUeXBlPEU+KSA9PiB7XG4gICAgY29uc3QgZXhwb3J0ZWRUeXBlID0gZXhwb3J0ZWQgYXMgVHlwZTxFPiYge1xuICAgICAgLy8gQ29tcG9uZW50cywgRGlyZWN0aXZlcywgTmdNb2R1bGVzLCBhbmQgUGlwZXMgY2FuIGFsbCBiZSBleHBvcnRlZC5cbiAgICAgIMm1Y21wPzogYW55O1xuICAgICAgybVkaXI/OiBhbnk7XG4gICAgICDJtW1vZD86IE5nTW9kdWxlRGVmPEU+O1xuICAgICAgybVwaXBlPzogYW55O1xuICAgIH07XG5cbiAgICAvLyBFaXRoZXIgdGhlIHR5cGUgaXMgYSBtb2R1bGUsIGEgcGlwZSwgb3IgYSBjb21wb25lbnQvZGlyZWN0aXZlICh3aGljaCBtYXkgbm90IGhhdmUgYVxuICAgIC8vIMm1Y21wIGFzIGl0IG1pZ2h0IGJlIGNvbXBpbGVkIGFzeW5jaHJvbm91c2x5KS5cbiAgICBpZiAoaXNOZ01vZHVsZShleHBvcnRlZFR5cGUpKSB7XG4gICAgICAvLyBXaGVuIHRoaXMgbW9kdWxlIGV4cG9ydHMgYW5vdGhlciwgdGhlIGV4cG9ydGVkIG1vZHVsZSdzIGV4cG9ydGVkIGRpcmVjdGl2ZXMgYW5kIHBpcGVzIGFyZVxuICAgICAgLy8gYWRkZWQgdG8gYm90aCB0aGUgY29tcGlsYXRpb24gYW5kIGV4cG9ydGVkIHNjb3BlcyBvZiB0aGlzIG1vZHVsZS5cbiAgICAgIGNvbnN0IGV4cG9ydGVkU2NvcGUgPSB0cmFuc2l0aXZlU2NvcGVzRm9yKGV4cG9ydGVkVHlwZSwgcHJvY2Vzc05nTW9kdWxlRm4pO1xuICAgICAgZXhwb3J0ZWRTY29wZS5leHBvcnRlZC5kaXJlY3RpdmVzLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgICBzY29wZXMuY29tcGlsYXRpb24uZGlyZWN0aXZlcy5hZGQoZW50cnkpO1xuICAgICAgICBzY29wZXMuZXhwb3J0ZWQuZGlyZWN0aXZlcy5hZGQoZW50cnkpO1xuICAgICAgfSk7XG4gICAgICBleHBvcnRlZFNjb3BlLmV4cG9ydGVkLnBpcGVzLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgICBzY29wZXMuY29tcGlsYXRpb24ucGlwZXMuYWRkKGVudHJ5KTtcbiAgICAgICAgc2NvcGVzLmV4cG9ydGVkLnBpcGVzLmFkZChlbnRyeSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKGdldFBpcGVEZWYoZXhwb3J0ZWRUeXBlKSkge1xuICAgICAgc2NvcGVzLmV4cG9ydGVkLnBpcGVzLmFkZChleHBvcnRlZFR5cGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzY29wZXMuZXhwb3J0ZWQuZGlyZWN0aXZlcy5hZGQoZXhwb3J0ZWRUeXBlKTtcbiAgICB9XG4gIH0pO1xuXG4gIGRlZi50cmFuc2l0aXZlQ29tcGlsZVNjb3BlcyA9IHNjb3BlcztcbiAgcmV0dXJuIHNjb3Blcztcbn1cblxuZnVuY3Rpb24gZXhwYW5kTW9kdWxlV2l0aFByb3ZpZGVycyh2YWx1ZTogVHlwZTxhbnk+fCBNb2R1bGVXaXRoUHJvdmlkZXJzPHt9Pik6IFR5cGU8YW55PiB7XG4gIGlmIChpc01vZHVsZVdpdGhQcm92aWRlcnModmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLm5nTW9kdWxlO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gaXNNb2R1bGVXaXRoUHJvdmlkZXJzKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBNb2R1bGVXaXRoUHJvdmlkZXJzPHt9PiB7XG4gIHJldHVybiAodmFsdWUgYXN7bmdNb2R1bGU/OiBhbnl9KS5uZ01vZHVsZSAhPT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBpc05nTW9kdWxlPFQ+KHZhbHVlOiBUeXBlPFQ+KTogdmFsdWUgaXMgVHlwZTxUPiZ7ybVtb2Q6IE5nTW9kdWxlRGVmPFQ+fSB7XG4gIHJldHVybiAhIWdldE5nTW9kdWxlRGVmKHZhbHVlKTtcbn1cbiJdfQ==