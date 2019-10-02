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
import { getReflect, reflectDependencies } from '../../di/jit/util';
import { componentNeedsResolution, maybeQueueResolutionOfComponentResources } from '../../metadata/resource_loading';
import { ViewEncapsulation } from '../../metadata/view';
import { initNgDevMode } from '../../util/ng_dev_mode';
import { getBaseDef, getComponentDef, getDirectiveDef } from '../definition';
import { EMPTY_ARRAY, EMPTY_OBJ } from '../empty';
import { NG_BASE_DEF, NG_COMPONENT_DEF, NG_DIRECTIVE_DEF, NG_FACTORY_DEF } from '../fields';
import { stringifyForError } from '../util/misc_utils';
import { angularCoreEnv } from './environment';
import { flushModuleScopingQueueAsMuchAsPossible, patchComponentDefWithScope, transitiveScopesFor } from './module';
/**
 * Compile an Angular component according to its decorator metadata, and patch the resulting
 * ngComponentDef onto the component type.
 *
 * Compilation may be asynchronous (due to the need to resolve URLs for the component template or
 * other resources, for example). In the event that compilation is not immediate, `compileComponent`
 * will enqueue resource resolution into a global queue and will fail to return the `ngComponentDef`
 * until the global queue has been resolved with a call to `resolveComponentResources`.
 */
export function compileComponent(type, metadata) {
    // Initialize ngDevMode. This must be the first statement in compileComponent.
    // See the `initNgDevMode` docstring for more information.
    (typeof ngDevMode === 'undefined' || ngDevMode) && initNgDevMode();
    var ngComponentDef = null;
    // Metadata may have resources which need to be resolved.
    maybeQueueResolutionOfComponentResources(type, metadata);
    // Note that we're using the same function as `Directive`, because that's only subset of metadata
    // that we need to create the ngFactoryDef. We're avoiding using the component metadata
    // because we'd have to resolve the asynchronous templates.
    addDirectiveFactoryDef(type, metadata);
    Object.defineProperty(type, NG_COMPONENT_DEF, {
        get: function () {
            if (ngComponentDef === null) {
                var compiler = getCompilerFacade();
                if (componentNeedsResolution(metadata)) {
                    var error_1 = ["Component '" + type.name + "' is not resolved:"];
                    if (metadata.templateUrl) {
                        error_1.push(" - templateUrl: " + metadata.templateUrl);
                    }
                    if (metadata.styleUrls && metadata.styleUrls.length) {
                        error_1.push(" - styleUrls: " + JSON.stringify(metadata.styleUrls));
                    }
                    error_1.push("Did you run and wait for 'resolveComponentResources()'?");
                    throw new Error(error_1.join('\n'));
                }
                var templateUrl = metadata.templateUrl || "ng:///" + type.name + "/template.html";
                var meta = tslib_1.__assign({}, directiveMetadata(type, metadata), { typeSourceSpan: compiler.createParseSourceSpan('Component', type.name, templateUrl), template: metadata.template || '', preserveWhitespaces: metadata.preserveWhitespaces || false, styles: metadata.styles || EMPTY_ARRAY, animations: metadata.animations, directives: [], changeDetection: metadata.changeDetection, pipes: new Map(), encapsulation: metadata.encapsulation || ViewEncapsulation.Emulated, interpolation: metadata.interpolation, viewProviders: metadata.viewProviders || null });
                if (meta.usesInheritance) {
                    addBaseDefToUndecoratedParents(type);
                }
                ngComponentDef = compiler.compileComponent(angularCoreEnv, templateUrl, meta);
                // When NgModule decorator executed, we enqueued the module definition such that
                // it would only dequeue and add itself as module scope to all of its declarations,
                // but only if  if all of its declarations had resolved. This call runs the check
                // to see if any modules that are in the queue can be dequeued and add scope to
                // their declarations.
                flushModuleScopingQueueAsMuchAsPossible();
                // If component compilation is async, then the @NgModule annotation which declares the
                // component may execute and set an ngSelectorScope property on the component type. This
                // allows the component to patch itself with directiveDefs from the module after it
                // finishes compiling.
                if (hasSelectorScope(type)) {
                    var scopes = transitiveScopesFor(type.ngSelectorScope);
                    patchComponentDefWithScope(ngComponentDef, scopes);
                }
            }
            return ngComponentDef;
        },
        // Make the property configurable in dev mode to allow overriding in tests
        configurable: !!ngDevMode,
    });
}
function hasSelectorScope(component) {
    return component.ngSelectorScope !== undefined;
}
/**
 * Compile an Angular directive according to its decorator metadata, and patch the resulting
 * ngDirectiveDef onto the component type.
 *
 * In the event that compilation is not immediate, `compileDirective` will return a `Promise` which
 * will resolve when compilation completes and the directive becomes usable.
 */
export function compileDirective(type, directive) {
    var ngDirectiveDef = null;
    addDirectiveFactoryDef(type, directive || {});
    Object.defineProperty(type, NG_DIRECTIVE_DEF, {
        get: function () {
            if (ngDirectiveDef === null) {
                // `directive` can be null in the case of abstract directives as a base class
                // that use `@Directive()` with no selector. In that case, pass empty object to the
                // `directiveMetadata` function instead of null.
                var meta = getDirectiveMetadata(type, directive || {});
                ngDirectiveDef =
                    getCompilerFacade().compileDirective(angularCoreEnv, meta.sourceMapUrl, meta.metadata);
            }
            return ngDirectiveDef;
        },
        // Make the property configurable in dev mode to allow overriding in tests
        configurable: !!ngDevMode,
    });
}
function getDirectiveMetadata(type, metadata) {
    var name = type && type.name;
    var sourceMapUrl = "ng:///" + name + "/ngDirectiveDef.js";
    var compiler = getCompilerFacade();
    var facade = directiveMetadata(type, metadata);
    facade.typeSourceSpan = compiler.createParseSourceSpan('Directive', name, sourceMapUrl);
    if (facade.usesInheritance) {
        addBaseDefToUndecoratedParents(type);
    }
    return { metadata: facade, sourceMapUrl: sourceMapUrl };
}
function addDirectiveFactoryDef(type, metadata) {
    var ngFactoryDef = null;
    Object.defineProperty(type, NG_FACTORY_DEF, {
        get: function () {
            if (ngFactoryDef === null) {
                var meta = getDirectiveMetadata(type, metadata);
                ngFactoryDef = getCompilerFacade().compileFactory(angularCoreEnv, "ng:///" + type.name + "/ngFactoryDef.js", tslib_1.__assign({}, meta.metadata, { injectFn: 'directiveInject', isPipe: false }));
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
    var propMetadata = getReflect().ownPropMetadata(type);
    return {
        name: type.name,
        type: type,
        typeArgumentCount: 0,
        selector: metadata.selector,
        deps: reflectDependencies(type),
        host: metadata.host || EMPTY_OBJ,
        propMetadata: propMetadata,
        inputs: metadata.inputs || EMPTY_ARRAY,
        outputs: metadata.outputs || EMPTY_ARRAY,
        queries: extractQueriesMetadata(type, propMetadata, isContentQuery),
        lifecycle: { usesOnChanges: type.prototype.hasOwnProperty('ngOnChanges') },
        typeSourceSpan: null,
        usesInheritance: !extendsDirectlyFromObject(type),
        exportAs: extractExportAs(metadata.exportAs),
        providers: metadata.providers || null,
        viewQueries: extractQueriesMetadata(type, propMetadata, isViewQuery)
    };
}
/**
 * Adds an `ngBaseDef` to all parent classes of a type that don't have an Angular decorator.
 */
function addBaseDefToUndecoratedParents(type) {
    var objPrototype = Object.prototype;
    var parent = Object.getPrototypeOf(type);
    // Go up the prototype until we hit `Object`.
    while (parent && parent !== objPrototype) {
        // Since inheritance works if the class was annotated already, we only need to add
        // the base def if there are no annotations and the base def hasn't been created already.
        if (!getDirectiveDef(parent) && !getComponentDef(parent) && !getBaseDef(parent)) {
            var facade = extractBaseDefMetadata(parent);
            facade && compileBase(parent, facade);
        }
        parent = Object.getPrototypeOf(parent);
    }
}
/** Compiles the base metadata into a base definition. */
function compileBase(type, facade) {
    var ngBaseDef = null;
    Object.defineProperty(type, NG_BASE_DEF, {
        get: function () {
            if (ngBaseDef === null) {
                var name_1 = type && type.name;
                var sourceMapUrl = "ng://" + name_1 + "/ngBaseDef.js";
                var compiler = getCompilerFacade();
                ngBaseDef = compiler.compileBase(angularCoreEnv, sourceMapUrl, facade);
            }
            return ngBaseDef;
        },
        // Make the property configurable in dev mode to allow overriding in tests
        configurable: !!ngDevMode,
    });
}
/** Extracts the metadata necessary to construct an `ngBaseDef` from a class. */
function extractBaseDefMetadata(type) {
    var propMetadata = getReflect().ownPropMetadata(type);
    var viewQueries = extractQueriesMetadata(type, propMetadata, isViewQuery);
    var queries = extractQueriesMetadata(type, propMetadata, isContentQuery);
    var inputs;
    var outputs;
    // We only need to know whether there are any HostListener or HostBinding
    // decorators present, the parsing logic is in the compiler already.
    var hasHostDecorators = false;
    var _loop_1 = function (field) {
        propMetadata[field].forEach(function (ann) {
            var metadataName = ann.ngMetadataName;
            if (metadataName === 'Input') {
                inputs = inputs || {};
                inputs[field] = ann.bindingPropertyName ? [ann.bindingPropertyName, field] : field;
            }
            else if (metadataName === 'Output') {
                outputs = outputs || {};
                outputs[field] = ann.bindingPropertyName || field;
            }
            else if (metadataName === 'HostBinding' || metadataName === 'HostListener') {
                hasHostDecorators = true;
            }
        });
    };
    for (var field in propMetadata) {
        _loop_1(field);
    }
    // Only generate the base def if there's any info inside it.
    if (inputs || outputs || viewQueries.length || queries.length || hasHostDecorators) {
        return { name: type.name, type: type, inputs: inputs, outputs: outputs, viewQueries: viewQueries, queries: queries, propMetadata: propMetadata };
    }
    return null;
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
        static: !!ann.static
    };
}
function extractQueriesMetadata(type, propMetadata, isQueryAnn) {
    var queriesMeta = [];
    var _loop_2 = function (field) {
        if (propMetadata.hasOwnProperty(field)) {
            var annotations_1 = propMetadata[field];
            annotations_1.forEach(function (ann) {
                if (isQueryAnn(ann)) {
                    if (!ann.selector) {
                        throw new Error("Can't construct a query for the property \"" + field + "\" of " +
                            ("\"" + stringifyForError(type) + "\" since the query selector wasn't defined."));
                    }
                    if (annotations_1.some(isInputAnn)) {
                        throw new Error("Cannot combine @Input decorators with query decorators");
                    }
                    queriesMeta.push(convertToR3QueryMetadata(field, ann));
                }
            });
        }
    };
    for (var field in propMetadata) {
        _loop_2(field);
    }
    return queriesMeta;
}
function extractExportAs(exportAs) {
    if (exportAs === undefined) {
        return null;
    }
    return exportAs.split(',').map(function (part) { return part.trim(); });
}
function isContentQuery(value) {
    var name = value.ngMetadataName;
    return name === 'ContentChild' || name === 'ContentChildren';
}
function isViewQuery(value) {
    var name = value.ngMetadataName;
    return name === 'ViewChild' || name === 'ViewChildren';
}
function isInputAnn(value) {
    return value.ngMetadataName === 'Input';
}
function splitByComma(value) {
    return value.split(',').map(function (piece) { return piece.trim(); });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQTRCLGlCQUFpQixFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFFNUYsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDdkQsT0FBTyxFQUFDLFVBQVUsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBSWxFLE9BQU8sRUFBQyx3QkFBd0IsRUFBRSx3Q0FBd0MsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ25ILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3RELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNyRCxPQUFPLEVBQUMsVUFBVSxFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDM0UsT0FBTyxFQUFDLFdBQVcsRUFBRSxTQUFTLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDaEQsT0FBTyxFQUFDLFdBQVcsRUFBRSxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxjQUFjLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFMUYsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFckQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM3QyxPQUFPLEVBQUMsdUNBQXVDLEVBQUUsMEJBQTBCLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFJbEg7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLFVBQVUsZ0JBQWdCLENBQUMsSUFBZSxFQUFFLFFBQW1CO0lBQ25FLDhFQUE4RTtJQUM5RSwwREFBMEQ7SUFDMUQsQ0FBQyxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDLElBQUksYUFBYSxFQUFFLENBQUM7SUFFbkUsSUFBSSxjQUFjLEdBQVEsSUFBSSxDQUFDO0lBRS9CLHlEQUF5RDtJQUN6RCx3Q0FBd0MsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFekQsaUdBQWlHO0lBQ2pHLHVGQUF1RjtJQUN2RiwyREFBMkQ7SUFDM0Qsc0JBQXNCLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBRXZDLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1FBQzVDLEdBQUcsRUFBRTtZQUNILElBQUksY0FBYyxLQUFLLElBQUksRUFBRTtnQkFDM0IsSUFBTSxRQUFRLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQztnQkFFckMsSUFBSSx3QkFBd0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtvQkFDdEMsSUFBTSxPQUFLLEdBQUcsQ0FBQyxnQkFBYyxJQUFJLENBQUMsSUFBSSx1QkFBb0IsQ0FBQyxDQUFDO29CQUM1RCxJQUFJLFFBQVEsQ0FBQyxXQUFXLEVBQUU7d0JBQ3hCLE9BQUssQ0FBQyxJQUFJLENBQUMscUJBQW1CLFFBQVEsQ0FBQyxXQUFhLENBQUMsQ0FBQztxQkFDdkQ7b0JBQ0QsSUFBSSxRQUFRLENBQUMsU0FBUyxJQUFJLFFBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFO3dCQUNuRCxPQUFLLENBQUMsSUFBSSxDQUFDLG1CQUFpQixJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUcsQ0FBQyxDQUFDO3FCQUNuRTtvQkFDRCxPQUFLLENBQUMsSUFBSSxDQUFDLHlEQUF5RCxDQUFDLENBQUM7b0JBQ3RFLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2lCQUNuQztnQkFFRCxJQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsV0FBVyxJQUFJLFdBQVMsSUFBSSxDQUFDLElBQUksbUJBQWdCLENBQUM7Z0JBQy9FLElBQU0sSUFBSSx3QkFDTCxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQ3BDLGNBQWMsRUFBRSxRQUFRLENBQUMscUJBQXFCLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLEVBQ25GLFFBQVEsRUFBRSxRQUFRLENBQUMsUUFBUSxJQUFJLEVBQUUsRUFDakMsbUJBQW1CLEVBQUUsUUFBUSxDQUFDLG1CQUFtQixJQUFJLEtBQUssRUFDMUQsTUFBTSxFQUFFLFFBQVEsQ0FBQyxNQUFNLElBQUksV0FBVyxFQUN0QyxVQUFVLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFDL0IsVUFBVSxFQUFFLEVBQUUsRUFDZCxlQUFlLEVBQUUsUUFBUSxDQUFDLGVBQWUsRUFDekMsS0FBSyxFQUFFLElBQUksR0FBRyxFQUFFLEVBQ2hCLGFBQWEsRUFBRSxRQUFRLENBQUMsYUFBYSxJQUFJLGlCQUFpQixDQUFDLFFBQVEsRUFDbkUsYUFBYSxFQUFFLFFBQVEsQ0FBQyxhQUFhLEVBQ3JDLGFBQWEsRUFBRSxRQUFRLENBQUMsYUFBYSxJQUFJLElBQUksR0FDOUMsQ0FBQztnQkFDRixJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUU7b0JBQ3hCLDhCQUE4QixDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUN0QztnQkFFRCxjQUFjLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGNBQWMsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBRTlFLGdGQUFnRjtnQkFDaEYsbUZBQW1GO2dCQUNuRixpRkFBaUY7Z0JBQ2pGLCtFQUErRTtnQkFDL0Usc0JBQXNCO2dCQUN0Qix1Q0FBdUMsRUFBRSxDQUFDO2dCQUUxQyxzRkFBc0Y7Z0JBQ3RGLHdGQUF3RjtnQkFDeEYsbUZBQW1GO2dCQUNuRixzQkFBc0I7Z0JBQ3RCLElBQUksZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQzFCLElBQU0sTUFBTSxHQUFHLG1CQUFtQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztvQkFDekQsMEJBQTBCLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2lCQUNwRDthQUNGO1lBQ0QsT0FBTyxjQUFjLENBQUM7UUFDeEIsQ0FBQztRQUNELDBFQUEwRTtRQUMxRSxZQUFZLEVBQUUsQ0FBQyxDQUFDLFNBQVM7S0FDMUIsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELFNBQVMsZ0JBQWdCLENBQUksU0FBa0I7SUFFN0MsT0FBUSxTQUFvQyxDQUFDLGVBQWUsS0FBSyxTQUFTLENBQUM7QUFDN0UsQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxJQUFlLEVBQUUsU0FBMkI7SUFDM0UsSUFBSSxjQUFjLEdBQVEsSUFBSSxDQUFDO0lBRS9CLHNCQUFzQixDQUFDLElBQUksRUFBRSxTQUFTLElBQUksRUFBRSxDQUFDLENBQUM7SUFFOUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7UUFDNUMsR0FBRyxFQUFFO1lBQ0gsSUFBSSxjQUFjLEtBQUssSUFBSSxFQUFFO2dCQUMzQiw2RUFBNkU7Z0JBQzdFLG1GQUFtRjtnQkFDbkYsZ0RBQWdEO2dCQUNoRCxJQUFNLElBQUksR0FBRyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsU0FBUyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUN6RCxjQUFjO29CQUNWLGlCQUFpQixFQUFFLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQzVGO1lBQ0QsT0FBTyxjQUFjLENBQUM7UUFDeEIsQ0FBQztRQUNELDBFQUEwRTtRQUMxRSxZQUFZLEVBQUUsQ0FBQyxDQUFDLFNBQVM7S0FDMUIsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELFNBQVMsb0JBQW9CLENBQUMsSUFBZSxFQUFFLFFBQW1CO0lBQ2hFLElBQU0sSUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQy9CLElBQU0sWUFBWSxHQUFHLFdBQVMsSUFBSSx1QkFBb0IsQ0FBQztJQUN2RCxJQUFNLFFBQVEsR0FBRyxpQkFBaUIsRUFBRSxDQUFDO0lBQ3JDLElBQU0sTUFBTSxHQUFHLGlCQUFpQixDQUFDLElBQTBCLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDdkUsTUFBTSxDQUFDLGNBQWMsR0FBRyxRQUFRLENBQUMscUJBQXFCLENBQUMsV0FBVyxFQUFFLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQztJQUN4RixJQUFJLE1BQU0sQ0FBQyxlQUFlLEVBQUU7UUFDMUIsOEJBQThCLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDdEM7SUFDRCxPQUFPLEVBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxZQUFZLGNBQUEsRUFBQyxDQUFDO0FBQzFDLENBQUM7QUFFRCxTQUFTLHNCQUFzQixDQUFDLElBQWUsRUFBRSxRQUErQjtJQUM5RSxJQUFJLFlBQVksR0FBUSxJQUFJLENBQUM7SUFFN0IsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1FBQzFDLEdBQUcsRUFBRTtZQUNILElBQUksWUFBWSxLQUFLLElBQUksRUFBRTtnQkFDekIsSUFBTSxJQUFJLEdBQUcsb0JBQW9CLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNsRCxZQUFZLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQyxjQUFjLENBQzdDLGNBQWMsRUFBRSxXQUFTLElBQUksQ0FBQyxJQUFJLHFCQUFrQix1QkFDaEQsSUFBSSxDQUFDLFFBQVEsSUFBRSxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxFQUFFLEtBQUssSUFBRSxDQUFDO2FBQ3JFO1lBQ0QsT0FBTyxZQUFZLENBQUM7UUFDdEIsQ0FBQztRQUNELDBFQUEwRTtRQUMxRSxZQUFZLEVBQUUsQ0FBQyxDQUFDLFNBQVM7S0FDMUIsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELE1BQU0sVUFBVSx5QkFBeUIsQ0FBQyxJQUFlO0lBQ3ZELE9BQU8sTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssTUFBTSxDQUFDLFNBQVMsQ0FBQztBQUNwRSxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUFDLElBQWUsRUFBRSxRQUFtQjtJQUNwRSw4QkFBOEI7SUFDOUIsSUFBTSxZQUFZLEdBQUcsVUFBVSxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRXhELE9BQU87UUFDTCxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7UUFDZixJQUFJLEVBQUUsSUFBSTtRQUNWLGlCQUFpQixFQUFFLENBQUM7UUFDcEIsUUFBUSxFQUFFLFFBQVEsQ0FBQyxRQUFVO1FBQzdCLElBQUksRUFBRSxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7UUFDL0IsSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJLElBQUksU0FBUztRQUNoQyxZQUFZLEVBQUUsWUFBWTtRQUMxQixNQUFNLEVBQUUsUUFBUSxDQUFDLE1BQU0sSUFBSSxXQUFXO1FBQ3RDLE9BQU8sRUFBRSxRQUFRLENBQUMsT0FBTyxJQUFJLFdBQVc7UUFDeEMsT0FBTyxFQUFFLHNCQUFzQixDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsY0FBYyxDQUFDO1FBQ25FLFNBQVMsRUFBRSxFQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsRUFBQztRQUN4RSxjQUFjLEVBQUUsSUFBTTtRQUN0QixlQUFlLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7UUFDakQsUUFBUSxFQUFFLGVBQWUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO1FBQzVDLFNBQVMsRUFBRSxRQUFRLENBQUMsU0FBUyxJQUFJLElBQUk7UUFDckMsV0FBVyxFQUFFLHNCQUFzQixDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsV0FBVyxDQUFDO0tBQ3JFLENBQUM7QUFDSixDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLDhCQUE4QixDQUFDLElBQWU7SUFDckQsSUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztJQUN0QyxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRXpDLDZDQUE2QztJQUM3QyxPQUFPLE1BQU0sSUFBSSxNQUFNLEtBQUssWUFBWSxFQUFFO1FBQ3hDLGtGQUFrRjtRQUNsRix5RkFBeUY7UUFDekYsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUMvRSxJQUFNLE1BQU0sR0FBRyxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM5QyxNQUFNLElBQUksV0FBVyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztTQUN2QztRQUNELE1BQU0sR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQ3hDO0FBQ0gsQ0FBQztBQUVELHlEQUF5RDtBQUN6RCxTQUFTLFdBQVcsQ0FBQyxJQUFlLEVBQUUsTUFBNEI7SUFDaEUsSUFBSSxTQUFTLEdBQVEsSUFBSSxDQUFDO0lBQzFCLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtRQUN2QyxHQUFHLEVBQUU7WUFDSCxJQUFJLFNBQVMsS0FBSyxJQUFJLEVBQUU7Z0JBQ3RCLElBQU0sTUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDO2dCQUMvQixJQUFNLFlBQVksR0FBRyxVQUFRLE1BQUksa0JBQWUsQ0FBQztnQkFDakQsSUFBTSxRQUFRLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQztnQkFDckMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsY0FBYyxFQUFFLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQzthQUN4RTtZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ25CLENBQUM7UUFDRCwwRUFBMEU7UUFDMUUsWUFBWSxFQUFFLENBQUMsQ0FBQyxTQUFTO0tBQzFCLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxnRkFBZ0Y7QUFDaEYsU0FBUyxzQkFBc0IsQ0FBQyxJQUFlO0lBQzdDLElBQU0sWUFBWSxHQUFHLFVBQVUsRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN4RCxJQUFNLFdBQVcsR0FBRyxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQzVFLElBQU0sT0FBTyxHQUFHLHNCQUFzQixDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFDM0UsSUFBSSxNQUE0RCxDQUFDO0lBQ2pFLElBQUksT0FBMEMsQ0FBQztJQUMvQyx5RUFBeUU7SUFDekUsb0VBQW9FO0lBQ3BFLElBQUksaUJBQWlCLEdBQUcsS0FBSyxDQUFDOzRCQUVuQixLQUFLO1FBQ2QsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFBLEdBQUc7WUFDN0IsSUFBTSxZQUFZLEdBQUcsR0FBRyxDQUFDLGNBQWMsQ0FBQztZQUN4QyxJQUFJLFlBQVksS0FBSyxPQUFPLEVBQUU7Z0JBQzVCLE1BQU0sR0FBRyxNQUFNLElBQUksRUFBRSxDQUFDO2dCQUN0QixNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO2FBQ3BGO2lCQUFNLElBQUksWUFBWSxLQUFLLFFBQVEsRUFBRTtnQkFDcEMsT0FBTyxHQUFHLE9BQU8sSUFBSSxFQUFFLENBQUM7Z0JBQ3hCLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLENBQUMsbUJBQW1CLElBQUksS0FBSyxDQUFDO2FBQ25EO2lCQUFNLElBQUksWUFBWSxLQUFLLGFBQWEsSUFBSSxZQUFZLEtBQUssY0FBYyxFQUFFO2dCQUM1RSxpQkFBaUIsR0FBRyxJQUFJLENBQUM7YUFDMUI7UUFDSCxDQUFDLENBQUMsQ0FBQzs7SUFaTCxLQUFLLElBQU0sS0FBSyxJQUFJLFlBQVk7Z0JBQXJCLEtBQUs7S0FhZjtJQUVELDREQUE0RDtJQUM1RCxJQUFJLE1BQU0sSUFBSSxPQUFPLElBQUksV0FBVyxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLGlCQUFpQixFQUFFO1FBQ2xGLE9BQU8sRUFBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLE1BQUEsRUFBRSxNQUFNLFFBQUEsRUFBRSxPQUFPLFNBQUEsRUFBRSxXQUFXLGFBQUEsRUFBRSxPQUFPLFNBQUEsRUFBRSxZQUFZLGNBQUEsRUFBQyxDQUFDO0tBQ3JGO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsU0FBUyx5QkFBeUIsQ0FBQyxRQUFhO0lBQzlDLE9BQU8sT0FBTyxRQUFRLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzdGLENBQUM7QUFFRCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsWUFBb0IsRUFBRSxHQUFVO0lBQ3ZFLE9BQU87UUFDTCxZQUFZLEVBQUUsWUFBWTtRQUMxQixTQUFTLEVBQUUseUJBQXlCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQztRQUNsRCxXQUFXLEVBQUUsR0FBRyxDQUFDLFdBQVc7UUFDNUIsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLO1FBQ2hCLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJO1FBQ2hDLE1BQU0sRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU07S0FDckIsQ0FBQztBQUNKLENBQUM7QUFDRCxTQUFTLHNCQUFzQixDQUMzQixJQUFlLEVBQUUsWUFBb0MsRUFDckQsVUFBc0M7SUFDeEMsSUFBTSxXQUFXLEdBQTRCLEVBQUUsQ0FBQzs0QkFDckMsS0FBSztRQUNkLElBQUksWUFBWSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUN0QyxJQUFNLGFBQVcsR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDeEMsYUFBVyxDQUFDLE9BQU8sQ0FBQyxVQUFBLEdBQUc7Z0JBQ3JCLElBQUksVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUNuQixJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRTt3QkFDakIsTUFBTSxJQUFJLEtBQUssQ0FDWCxnREFBNkMsS0FBSyxXQUFPOzZCQUN6RCxPQUFJLGlCQUFpQixDQUFDLElBQUksQ0FBQyxnREFBNEMsQ0FBQSxDQUFDLENBQUM7cUJBQzlFO29CQUNELElBQUksYUFBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTt3QkFDaEMsTUFBTSxJQUFJLEtBQUssQ0FBQyx3REFBd0QsQ0FBQyxDQUFDO3FCQUMzRTtvQkFDRCxXQUFXLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO2lCQUN4RDtZQUNILENBQUMsQ0FBQyxDQUFDO1NBQ0o7O0lBaEJILEtBQUssSUFBTSxLQUFLLElBQUksWUFBWTtnQkFBckIsS0FBSztLQWlCZjtJQUNELE9BQU8sV0FBVyxDQUFDO0FBQ3JCLENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBQyxRQUE0QjtJQUNuRCxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7UUFDMUIsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUVELE9BQU8sUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQSxJQUFJLElBQUksT0FBQSxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQVgsQ0FBVyxDQUFDLENBQUM7QUFDdEQsQ0FBQztBQUVELFNBQVMsY0FBYyxDQUFDLEtBQVU7SUFDaEMsSUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQztJQUNsQyxPQUFPLElBQUksS0FBSyxjQUFjLElBQUksSUFBSSxLQUFLLGlCQUFpQixDQUFDO0FBQy9ELENBQUM7QUFFRCxTQUFTLFdBQVcsQ0FBQyxLQUFVO0lBQzdCLElBQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUM7SUFDbEMsT0FBTyxJQUFJLEtBQUssV0FBVyxJQUFJLElBQUksS0FBSyxjQUFjLENBQUM7QUFDekQsQ0FBQztBQUVELFNBQVMsVUFBVSxDQUFDLEtBQVU7SUFDNUIsT0FBTyxLQUFLLENBQUMsY0FBYyxLQUFLLE9BQU8sQ0FBQztBQUMxQyxDQUFDO0FBRUQsU0FBUyxZQUFZLENBQUMsS0FBYTtJQUNqQyxPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUEsS0FBSyxJQUFJLE9BQUEsS0FBSyxDQUFDLElBQUksRUFBRSxFQUFaLENBQVksQ0FBQyxDQUFDO0FBQ3JELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UjNEaXJlY3RpdmVNZXRhZGF0YUZhY2FkZSwgZ2V0Q29tcGlsZXJGYWNhZGV9IGZyb20gJy4uLy4uL2NvbXBpbGVyL2NvbXBpbGVyX2ZhY2FkZSc7XG5pbXBvcnQge1IzQmFzZU1ldGFkYXRhRmFjYWRlLCBSM0NvbXBvbmVudE1ldGFkYXRhRmFjYWRlLCBSM1F1ZXJ5TWV0YWRhdGFGYWNhZGV9IGZyb20gJy4uLy4uL2NvbXBpbGVyL2NvbXBpbGVyX2ZhY2FkZV9pbnRlcmZhY2UnO1xuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi4vLi4vZGkvZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtnZXRSZWZsZWN0LCByZWZsZWN0RGVwZW5kZW5jaWVzfSBmcm9tICcuLi8uLi9kaS9qaXQvdXRpbCc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7UXVlcnl9IGZyb20gJy4uLy4uL21ldGFkYXRhL2RpJztcbmltcG9ydCB7Q29tcG9uZW50LCBEaXJlY3RpdmUsIElucHV0fSBmcm9tICcuLi8uLi9tZXRhZGF0YS9kaXJlY3RpdmVzJztcbmltcG9ydCB7Y29tcG9uZW50TmVlZHNSZXNvbHV0aW9uLCBtYXliZVF1ZXVlUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9yZXNvdXJjZV9sb2FkaW5nJztcbmltcG9ydCB7Vmlld0VuY2Fwc3VsYXRpb259IGZyb20gJy4uLy4uL21ldGFkYXRhL3ZpZXcnO1xuaW1wb3J0IHtpbml0TmdEZXZNb2RlfSBmcm9tICcuLi8uLi91dGlsL25nX2Rldl9tb2RlJztcbmltcG9ydCB7Z2V0QmFzZURlZiwgZ2V0Q29tcG9uZW50RGVmLCBnZXREaXJlY3RpdmVEZWZ9IGZyb20gJy4uL2RlZmluaXRpb24nO1xuaW1wb3J0IHtFTVBUWV9BUlJBWSwgRU1QVFlfT0JKfSBmcm9tICcuLi9lbXB0eSc7XG5pbXBvcnQge05HX0JBU0VfREVGLCBOR19DT01QT05FTlRfREVGLCBOR19ESVJFQ1RJVkVfREVGLCBOR19GQUNUT1JZX0RFRn0gZnJvbSAnLi4vZmllbGRzJztcbmltcG9ydCB7Q29tcG9uZW50VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7c3RyaW5naWZ5Rm9yRXJyb3J9IGZyb20gJy4uL3V0aWwvbWlzY191dGlscyc7XG5cbmltcG9ydCB7YW5ndWxhckNvcmVFbnZ9IGZyb20gJy4vZW52aXJvbm1lbnQnO1xuaW1wb3J0IHtmbHVzaE1vZHVsZVNjb3BpbmdRdWV1ZUFzTXVjaEFzUG9zc2libGUsIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlLCB0cmFuc2l0aXZlU2NvcGVzRm9yfSBmcm9tICcuL21vZHVsZSc7XG5cblxuXG4vKipcbiAqIENvbXBpbGUgYW4gQW5ndWxhciBjb21wb25lbnQgYWNjb3JkaW5nIHRvIGl0cyBkZWNvcmF0b3IgbWV0YWRhdGEsIGFuZCBwYXRjaCB0aGUgcmVzdWx0aW5nXG4gKiBuZ0NvbXBvbmVudERlZiBvbnRvIHRoZSBjb21wb25lbnQgdHlwZS5cbiAqXG4gKiBDb21waWxhdGlvbiBtYXkgYmUgYXN5bmNocm9ub3VzIChkdWUgdG8gdGhlIG5lZWQgdG8gcmVzb2x2ZSBVUkxzIGZvciB0aGUgY29tcG9uZW50IHRlbXBsYXRlIG9yXG4gKiBvdGhlciByZXNvdXJjZXMsIGZvciBleGFtcGxlKS4gSW4gdGhlIGV2ZW50IHRoYXQgY29tcGlsYXRpb24gaXMgbm90IGltbWVkaWF0ZSwgYGNvbXBpbGVDb21wb25lbnRgXG4gKiB3aWxsIGVucXVldWUgcmVzb3VyY2UgcmVzb2x1dGlvbiBpbnRvIGEgZ2xvYmFsIHF1ZXVlIGFuZCB3aWxsIGZhaWwgdG8gcmV0dXJuIHRoZSBgbmdDb21wb25lbnREZWZgXG4gKiB1bnRpbCB0aGUgZ2xvYmFsIHF1ZXVlIGhhcyBiZWVuIHJlc29sdmVkIHdpdGggYSBjYWxsIHRvIGByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVDb21wb25lbnQodHlwZTogVHlwZTxhbnk+LCBtZXRhZGF0YTogQ29tcG9uZW50KTogdm9pZCB7XG4gIC8vIEluaXRpYWxpemUgbmdEZXZNb2RlLiBUaGlzIG11c3QgYmUgdGhlIGZpcnN0IHN0YXRlbWVudCBpbiBjb21waWxlQ29tcG9uZW50LlxuICAvLyBTZWUgdGhlIGBpbml0TmdEZXZNb2RlYCBkb2NzdHJpbmcgZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmIGluaXROZ0Rldk1vZGUoKTtcblxuICBsZXQgbmdDb21wb25lbnREZWY6IGFueSA9IG51bGw7XG5cbiAgLy8gTWV0YWRhdGEgbWF5IGhhdmUgcmVzb3VyY2VzIHdoaWNoIG5lZWQgdG8gYmUgcmVzb2x2ZWQuXG4gIG1heWJlUXVldWVSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXModHlwZSwgbWV0YWRhdGEpO1xuXG4gIC8vIE5vdGUgdGhhdCB3ZSdyZSB1c2luZyB0aGUgc2FtZSBmdW5jdGlvbiBhcyBgRGlyZWN0aXZlYCwgYmVjYXVzZSB0aGF0J3Mgb25seSBzdWJzZXQgb2YgbWV0YWRhdGFcbiAgLy8gdGhhdCB3ZSBuZWVkIHRvIGNyZWF0ZSB0aGUgbmdGYWN0b3J5RGVmLiBXZSdyZSBhdm9pZGluZyB1c2luZyB0aGUgY29tcG9uZW50IG1ldGFkYXRhXG4gIC8vIGJlY2F1c2Ugd2UnZCBoYXZlIHRvIHJlc29sdmUgdGhlIGFzeW5jaHJvbm91cyB0ZW1wbGF0ZXMuXG4gIGFkZERpcmVjdGl2ZUZhY3RvcnlEZWYodHlwZSwgbWV0YWRhdGEpO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBOR19DT01QT05FTlRfREVGLCB7XG4gICAgZ2V0OiAoKSA9PiB7XG4gICAgICBpZiAobmdDb21wb25lbnREZWYgPT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgY29tcGlsZXIgPSBnZXRDb21waWxlckZhY2FkZSgpO1xuXG4gICAgICAgIGlmIChjb21wb25lbnROZWVkc1Jlc29sdXRpb24obWV0YWRhdGEpKSB7XG4gICAgICAgICAgY29uc3QgZXJyb3IgPSBbYENvbXBvbmVudCAnJHt0eXBlLm5hbWV9JyBpcyBub3QgcmVzb2x2ZWQ6YF07XG4gICAgICAgICAgaWYgKG1ldGFkYXRhLnRlbXBsYXRlVXJsKSB7XG4gICAgICAgICAgICBlcnJvci5wdXNoKGAgLSB0ZW1wbGF0ZVVybDogJHttZXRhZGF0YS50ZW1wbGF0ZVVybH1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG1ldGFkYXRhLnN0eWxlVXJscyAmJiBtZXRhZGF0YS5zdHlsZVVybHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBlcnJvci5wdXNoKGAgLSBzdHlsZVVybHM6ICR7SlNPTi5zdHJpbmdpZnkobWV0YWRhdGEuc3R5bGVVcmxzKX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZXJyb3IucHVzaChgRGlkIHlvdSBydW4gYW5kIHdhaXQgZm9yICdyZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzKCknP2ApO1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvci5qb2luKCdcXG4nKSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0ZW1wbGF0ZVVybCA9IG1ldGFkYXRhLnRlbXBsYXRlVXJsIHx8IGBuZzovLy8ke3R5cGUubmFtZX0vdGVtcGxhdGUuaHRtbGA7XG4gICAgICAgIGNvbnN0IG1ldGE6IFIzQ29tcG9uZW50TWV0YWRhdGFGYWNhZGUgPSB7XG4gICAgICAgICAgLi4uZGlyZWN0aXZlTWV0YWRhdGEodHlwZSwgbWV0YWRhdGEpLFxuICAgICAgICAgIHR5cGVTb3VyY2VTcGFuOiBjb21waWxlci5jcmVhdGVQYXJzZVNvdXJjZVNwYW4oJ0NvbXBvbmVudCcsIHR5cGUubmFtZSwgdGVtcGxhdGVVcmwpLFxuICAgICAgICAgIHRlbXBsYXRlOiBtZXRhZGF0YS50ZW1wbGF0ZSB8fCAnJyxcbiAgICAgICAgICBwcmVzZXJ2ZVdoaXRlc3BhY2VzOiBtZXRhZGF0YS5wcmVzZXJ2ZVdoaXRlc3BhY2VzIHx8IGZhbHNlLFxuICAgICAgICAgIHN0eWxlczogbWV0YWRhdGEuc3R5bGVzIHx8IEVNUFRZX0FSUkFZLFxuICAgICAgICAgIGFuaW1hdGlvbnM6IG1ldGFkYXRhLmFuaW1hdGlvbnMsXG4gICAgICAgICAgZGlyZWN0aXZlczogW10sXG4gICAgICAgICAgY2hhbmdlRGV0ZWN0aW9uOiBtZXRhZGF0YS5jaGFuZ2VEZXRlY3Rpb24sXG4gICAgICAgICAgcGlwZXM6IG5ldyBNYXAoKSxcbiAgICAgICAgICBlbmNhcHN1bGF0aW9uOiBtZXRhZGF0YS5lbmNhcHN1bGF0aW9uIHx8IFZpZXdFbmNhcHN1bGF0aW9uLkVtdWxhdGVkLFxuICAgICAgICAgIGludGVycG9sYXRpb246IG1ldGFkYXRhLmludGVycG9sYXRpb24sXG4gICAgICAgICAgdmlld1Byb3ZpZGVyczogbWV0YWRhdGEudmlld1Byb3ZpZGVycyB8fCBudWxsLFxuICAgICAgICB9O1xuICAgICAgICBpZiAobWV0YS51c2VzSW5oZXJpdGFuY2UpIHtcbiAgICAgICAgICBhZGRCYXNlRGVmVG9VbmRlY29yYXRlZFBhcmVudHModHlwZSk7XG4gICAgICAgIH1cblxuICAgICAgICBuZ0NvbXBvbmVudERlZiA9IGNvbXBpbGVyLmNvbXBpbGVDb21wb25lbnQoYW5ndWxhckNvcmVFbnYsIHRlbXBsYXRlVXJsLCBtZXRhKTtcblxuICAgICAgICAvLyBXaGVuIE5nTW9kdWxlIGRlY29yYXRvciBleGVjdXRlZCwgd2UgZW5xdWV1ZWQgdGhlIG1vZHVsZSBkZWZpbml0aW9uIHN1Y2ggdGhhdFxuICAgICAgICAvLyBpdCB3b3VsZCBvbmx5IGRlcXVldWUgYW5kIGFkZCBpdHNlbGYgYXMgbW9kdWxlIHNjb3BlIHRvIGFsbCBvZiBpdHMgZGVjbGFyYXRpb25zLFxuICAgICAgICAvLyBidXQgb25seSBpZiAgaWYgYWxsIG9mIGl0cyBkZWNsYXJhdGlvbnMgaGFkIHJlc29sdmVkLiBUaGlzIGNhbGwgcnVucyB0aGUgY2hlY2tcbiAgICAgICAgLy8gdG8gc2VlIGlmIGFueSBtb2R1bGVzIHRoYXQgYXJlIGluIHRoZSBxdWV1ZSBjYW4gYmUgZGVxdWV1ZWQgYW5kIGFkZCBzY29wZSB0b1xuICAgICAgICAvLyB0aGVpciBkZWNsYXJhdGlvbnMuXG4gICAgICAgIGZsdXNoTW9kdWxlU2NvcGluZ1F1ZXVlQXNNdWNoQXNQb3NzaWJsZSgpO1xuXG4gICAgICAgIC8vIElmIGNvbXBvbmVudCBjb21waWxhdGlvbiBpcyBhc3luYywgdGhlbiB0aGUgQE5nTW9kdWxlIGFubm90YXRpb24gd2hpY2ggZGVjbGFyZXMgdGhlXG4gICAgICAgIC8vIGNvbXBvbmVudCBtYXkgZXhlY3V0ZSBhbmQgc2V0IGFuIG5nU2VsZWN0b3JTY29wZSBwcm9wZXJ0eSBvbiB0aGUgY29tcG9uZW50IHR5cGUuIFRoaXNcbiAgICAgICAgLy8gYWxsb3dzIHRoZSBjb21wb25lbnQgdG8gcGF0Y2ggaXRzZWxmIHdpdGggZGlyZWN0aXZlRGVmcyBmcm9tIHRoZSBtb2R1bGUgYWZ0ZXIgaXRcbiAgICAgICAgLy8gZmluaXNoZXMgY29tcGlsaW5nLlxuICAgICAgICBpZiAoaGFzU2VsZWN0b3JTY29wZSh0eXBlKSkge1xuICAgICAgICAgIGNvbnN0IHNjb3BlcyA9IHRyYW5zaXRpdmVTY29wZXNGb3IodHlwZS5uZ1NlbGVjdG9yU2NvcGUpO1xuICAgICAgICAgIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlKG5nQ29tcG9uZW50RGVmLCBzY29wZXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbmdDb21wb25lbnREZWY7XG4gICAgfSxcbiAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGUsXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBoYXNTZWxlY3RvclNjb3BlPFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IGNvbXBvbmVudCBpcyBUeXBlPFQ+JlxuICAgIHtuZ1NlbGVjdG9yU2NvcGU6IFR5cGU8YW55Pn0ge1xuICByZXR1cm4gKGNvbXBvbmVudCBhc3tuZ1NlbGVjdG9yU2NvcGU/OiBhbnl9KS5uZ1NlbGVjdG9yU2NvcGUgIT09IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBDb21waWxlIGFuIEFuZ3VsYXIgZGlyZWN0aXZlIGFjY29yZGluZyB0byBpdHMgZGVjb3JhdG9yIG1ldGFkYXRhLCBhbmQgcGF0Y2ggdGhlIHJlc3VsdGluZ1xuICogbmdEaXJlY3RpdmVEZWYgb250byB0aGUgY29tcG9uZW50IHR5cGUuXG4gKlxuICogSW4gdGhlIGV2ZW50IHRoYXQgY29tcGlsYXRpb24gaXMgbm90IGltbWVkaWF0ZSwgYGNvbXBpbGVEaXJlY3RpdmVgIHdpbGwgcmV0dXJuIGEgYFByb21pc2VgIHdoaWNoXG4gKiB3aWxsIHJlc29sdmUgd2hlbiBjb21waWxhdGlvbiBjb21wbGV0ZXMgYW5kIHRoZSBkaXJlY3RpdmUgYmVjb21lcyB1c2FibGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlRGlyZWN0aXZlKHR5cGU6IFR5cGU8YW55PiwgZGlyZWN0aXZlOiBEaXJlY3RpdmUgfCBudWxsKTogdm9pZCB7XG4gIGxldCBuZ0RpcmVjdGl2ZURlZjogYW55ID0gbnVsbDtcblxuICBhZGREaXJlY3RpdmVGYWN0b3J5RGVmKHR5cGUsIGRpcmVjdGl2ZSB8fCB7fSk7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIE5HX0RJUkVDVElWRV9ERUYsIHtcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChuZ0RpcmVjdGl2ZURlZiA9PT0gbnVsbCkge1xuICAgICAgICAvLyBgZGlyZWN0aXZlYCBjYW4gYmUgbnVsbCBpbiB0aGUgY2FzZSBvZiBhYnN0cmFjdCBkaXJlY3RpdmVzIGFzIGEgYmFzZSBjbGFzc1xuICAgICAgICAvLyB0aGF0IHVzZSBgQERpcmVjdGl2ZSgpYCB3aXRoIG5vIHNlbGVjdG9yLiBJbiB0aGF0IGNhc2UsIHBhc3MgZW1wdHkgb2JqZWN0IHRvIHRoZVxuICAgICAgICAvLyBgZGlyZWN0aXZlTWV0YWRhdGFgIGZ1bmN0aW9uIGluc3RlYWQgb2YgbnVsbC5cbiAgICAgICAgY29uc3QgbWV0YSA9IGdldERpcmVjdGl2ZU1ldGFkYXRhKHR5cGUsIGRpcmVjdGl2ZSB8fCB7fSk7XG4gICAgICAgIG5nRGlyZWN0aXZlRGVmID1cbiAgICAgICAgICAgIGdldENvbXBpbGVyRmFjYWRlKCkuY29tcGlsZURpcmVjdGl2ZShhbmd1bGFyQ29yZUVudiwgbWV0YS5zb3VyY2VNYXBVcmwsIG1ldGEubWV0YWRhdGEpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5nRGlyZWN0aXZlRGVmO1xuICAgIH0sXG4gICAgLy8gTWFrZSB0aGUgcHJvcGVydHkgY29uZmlndXJhYmxlIGluIGRldiBtb2RlIHRvIGFsbG93IG92ZXJyaWRpbmcgaW4gdGVzdHNcbiAgICBjb25maWd1cmFibGU6ICEhbmdEZXZNb2RlLFxuICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0RGlyZWN0aXZlTWV0YWRhdGEodHlwZTogVHlwZTxhbnk+LCBtZXRhZGF0YTogRGlyZWN0aXZlKSB7XG4gIGNvbnN0IG5hbWUgPSB0eXBlICYmIHR5cGUubmFtZTtcbiAgY29uc3Qgc291cmNlTWFwVXJsID0gYG5nOi8vLyR7bmFtZX0vbmdEaXJlY3RpdmVEZWYuanNgO1xuICBjb25zdCBjb21waWxlciA9IGdldENvbXBpbGVyRmFjYWRlKCk7XG4gIGNvbnN0IGZhY2FkZSA9IGRpcmVjdGl2ZU1ldGFkYXRhKHR5cGUgYXMgQ29tcG9uZW50VHlwZTxhbnk+LCBtZXRhZGF0YSk7XG4gIGZhY2FkZS50eXBlU291cmNlU3BhbiA9IGNvbXBpbGVyLmNyZWF0ZVBhcnNlU291cmNlU3BhbignRGlyZWN0aXZlJywgbmFtZSwgc291cmNlTWFwVXJsKTtcbiAgaWYgKGZhY2FkZS51c2VzSW5oZXJpdGFuY2UpIHtcbiAgICBhZGRCYXNlRGVmVG9VbmRlY29yYXRlZFBhcmVudHModHlwZSk7XG4gIH1cbiAgcmV0dXJuIHttZXRhZGF0YTogZmFjYWRlLCBzb3VyY2VNYXBVcmx9O1xufVxuXG5mdW5jdGlvbiBhZGREaXJlY3RpdmVGYWN0b3J5RGVmKHR5cGU6IFR5cGU8YW55PiwgbWV0YWRhdGE6IERpcmVjdGl2ZSB8IENvbXBvbmVudCkge1xuICBsZXQgbmdGYWN0b3J5RGVmOiBhbnkgPSBudWxsO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBOR19GQUNUT1JZX0RFRiwge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKG5nRmFjdG9yeURlZiA9PT0gbnVsbCkge1xuICAgICAgICBjb25zdCBtZXRhID0gZ2V0RGlyZWN0aXZlTWV0YWRhdGEodHlwZSwgbWV0YWRhdGEpO1xuICAgICAgICBuZ0ZhY3RvcnlEZWYgPSBnZXRDb21waWxlckZhY2FkZSgpLmNvbXBpbGVGYWN0b3J5KFxuICAgICAgICAgICAgYW5ndWxhckNvcmVFbnYsIGBuZzovLy8ke3R5cGUubmFtZX0vbmdGYWN0b3J5RGVmLmpzYCxcbiAgICAgICAgICAgIHsuLi5tZXRhLm1ldGFkYXRhLCBpbmplY3RGbjogJ2RpcmVjdGl2ZUluamVjdCcsIGlzUGlwZTogZmFsc2V9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZ0ZhY3RvcnlEZWY7XG4gICAgfSxcbiAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGUsXG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXh0ZW5kc0RpcmVjdGx5RnJvbU9iamVjdCh0eXBlOiBUeXBlPGFueT4pOiBib29sZWFuIHtcbiAgcmV0dXJuIE9iamVjdC5nZXRQcm90b3R5cGVPZih0eXBlLnByb3RvdHlwZSkgPT09IE9iamVjdC5wcm90b3R5cGU7XG59XG5cbi8qKlxuICogRXh0cmFjdCB0aGUgYFIzRGlyZWN0aXZlTWV0YWRhdGFgIGZvciBhIHBhcnRpY3VsYXIgZGlyZWN0aXZlIChlaXRoZXIgYSBgRGlyZWN0aXZlYCBvciBhXG4gKiBgQ29tcG9uZW50YCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVNZXRhZGF0YSh0eXBlOiBUeXBlPGFueT4sIG1ldGFkYXRhOiBEaXJlY3RpdmUpOiBSM0RpcmVjdGl2ZU1ldGFkYXRhRmFjYWRlIHtcbiAgLy8gUmVmbGVjdCBpbnB1dHMgYW5kIG91dHB1dHMuXG4gIGNvbnN0IHByb3BNZXRhZGF0YSA9IGdldFJlZmxlY3QoKS5vd25Qcm9wTWV0YWRhdGEodHlwZSk7XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiB0eXBlLm5hbWUsXG4gICAgdHlwZTogdHlwZSxcbiAgICB0eXBlQXJndW1lbnRDb3VudDogMCxcbiAgICBzZWxlY3RvcjogbWV0YWRhdGEuc2VsZWN0b3IgISxcbiAgICBkZXBzOiByZWZsZWN0RGVwZW5kZW5jaWVzKHR5cGUpLFxuICAgIGhvc3Q6IG1ldGFkYXRhLmhvc3QgfHwgRU1QVFlfT0JKLFxuICAgIHByb3BNZXRhZGF0YTogcHJvcE1ldGFkYXRhLFxuICAgIGlucHV0czogbWV0YWRhdGEuaW5wdXRzIHx8IEVNUFRZX0FSUkFZLFxuICAgIG91dHB1dHM6IG1ldGFkYXRhLm91dHB1dHMgfHwgRU1QVFlfQVJSQVksXG4gICAgcXVlcmllczogZXh0cmFjdFF1ZXJpZXNNZXRhZGF0YSh0eXBlLCBwcm9wTWV0YWRhdGEsIGlzQ29udGVudFF1ZXJ5KSxcbiAgICBsaWZlY3ljbGU6IHt1c2VzT25DaGFuZ2VzOiB0eXBlLnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSgnbmdPbkNoYW5nZXMnKX0sXG4gICAgdHlwZVNvdXJjZVNwYW46IG51bGwgISxcbiAgICB1c2VzSW5oZXJpdGFuY2U6ICFleHRlbmRzRGlyZWN0bHlGcm9tT2JqZWN0KHR5cGUpLFxuICAgIGV4cG9ydEFzOiBleHRyYWN0RXhwb3J0QXMobWV0YWRhdGEuZXhwb3J0QXMpLFxuICAgIHByb3ZpZGVyczogbWV0YWRhdGEucHJvdmlkZXJzIHx8IG51bGwsXG4gICAgdmlld1F1ZXJpZXM6IGV4dHJhY3RRdWVyaWVzTWV0YWRhdGEodHlwZSwgcHJvcE1ldGFkYXRhLCBpc1ZpZXdRdWVyeSlcbiAgfTtcbn1cblxuLyoqXG4gKiBBZGRzIGFuIGBuZ0Jhc2VEZWZgIHRvIGFsbCBwYXJlbnQgY2xhc3NlcyBvZiBhIHR5cGUgdGhhdCBkb24ndCBoYXZlIGFuIEFuZ3VsYXIgZGVjb3JhdG9yLlxuICovXG5mdW5jdGlvbiBhZGRCYXNlRGVmVG9VbmRlY29yYXRlZFBhcmVudHModHlwZTogVHlwZTxhbnk+KSB7XG4gIGNvbnN0IG9ialByb3RvdHlwZSA9IE9iamVjdC5wcm90b3R5cGU7XG4gIGxldCBwYXJlbnQgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YodHlwZSk7XG5cbiAgLy8gR28gdXAgdGhlIHByb3RvdHlwZSB1bnRpbCB3ZSBoaXQgYE9iamVjdGAuXG4gIHdoaWxlIChwYXJlbnQgJiYgcGFyZW50ICE9PSBvYmpQcm90b3R5cGUpIHtcbiAgICAvLyBTaW5jZSBpbmhlcml0YW5jZSB3b3JrcyBpZiB0aGUgY2xhc3Mgd2FzIGFubm90YXRlZCBhbHJlYWR5LCB3ZSBvbmx5IG5lZWQgdG8gYWRkXG4gICAgLy8gdGhlIGJhc2UgZGVmIGlmIHRoZXJlIGFyZSBubyBhbm5vdGF0aW9ucyBhbmQgdGhlIGJhc2UgZGVmIGhhc24ndCBiZWVuIGNyZWF0ZWQgYWxyZWFkeS5cbiAgICBpZiAoIWdldERpcmVjdGl2ZURlZihwYXJlbnQpICYmICFnZXRDb21wb25lbnREZWYocGFyZW50KSAmJiAhZ2V0QmFzZURlZihwYXJlbnQpKSB7XG4gICAgICBjb25zdCBmYWNhZGUgPSBleHRyYWN0QmFzZURlZk1ldGFkYXRhKHBhcmVudCk7XG4gICAgICBmYWNhZGUgJiYgY29tcGlsZUJhc2UocGFyZW50LCBmYWNhZGUpO1xuICAgIH1cbiAgICBwYXJlbnQgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YocGFyZW50KTtcbiAgfVxufVxuXG4vKiogQ29tcGlsZXMgdGhlIGJhc2UgbWV0YWRhdGEgaW50byBhIGJhc2UgZGVmaW5pdGlvbi4gKi9cbmZ1bmN0aW9uIGNvbXBpbGVCYXNlKHR5cGU6IFR5cGU8YW55PiwgZmFjYWRlOiBSM0Jhc2VNZXRhZGF0YUZhY2FkZSk6IHZvaWQge1xuICBsZXQgbmdCYXNlRGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgTkdfQkFTRV9ERUYsIHtcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChuZ0Jhc2VEZWYgPT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgbmFtZSA9IHR5cGUgJiYgdHlwZS5uYW1lO1xuICAgICAgICBjb25zdCBzb3VyY2VNYXBVcmwgPSBgbmc6Ly8ke25hbWV9L25nQmFzZURlZi5qc2A7XG4gICAgICAgIGNvbnN0IGNvbXBpbGVyID0gZ2V0Q29tcGlsZXJGYWNhZGUoKTtcbiAgICAgICAgbmdCYXNlRGVmID0gY29tcGlsZXIuY29tcGlsZUJhc2UoYW5ndWxhckNvcmVFbnYsIHNvdXJjZU1hcFVybCwgZmFjYWRlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZ0Jhc2VEZWY7XG4gICAgfSxcbiAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGUsXG4gIH0pO1xufVxuXG4vKiogRXh0cmFjdHMgdGhlIG1ldGFkYXRhIG5lY2Vzc2FyeSB0byBjb25zdHJ1Y3QgYW4gYG5nQmFzZURlZmAgZnJvbSBhIGNsYXNzLiAqL1xuZnVuY3Rpb24gZXh0cmFjdEJhc2VEZWZNZXRhZGF0YSh0eXBlOiBUeXBlPGFueT4pOiBSM0Jhc2VNZXRhZGF0YUZhY2FkZXxudWxsIHtcbiAgY29uc3QgcHJvcE1ldGFkYXRhID0gZ2V0UmVmbGVjdCgpLm93blByb3BNZXRhZGF0YSh0eXBlKTtcbiAgY29uc3Qgdmlld1F1ZXJpZXMgPSBleHRyYWN0UXVlcmllc01ldGFkYXRhKHR5cGUsIHByb3BNZXRhZGF0YSwgaXNWaWV3UXVlcnkpO1xuICBjb25zdCBxdWVyaWVzID0gZXh0cmFjdFF1ZXJpZXNNZXRhZGF0YSh0eXBlLCBwcm9wTWV0YWRhdGEsIGlzQ29udGVudFF1ZXJ5KTtcbiAgbGV0IGlucHV0czoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IFtzdHJpbmcsIHN0cmluZ119fHVuZGVmaW5lZDtcbiAgbGV0IG91dHB1dHM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9fHVuZGVmaW5lZDtcbiAgLy8gV2Ugb25seSBuZWVkIHRvIGtub3cgd2hldGhlciB0aGVyZSBhcmUgYW55IEhvc3RMaXN0ZW5lciBvciBIb3N0QmluZGluZ1xuICAvLyBkZWNvcmF0b3JzIHByZXNlbnQsIHRoZSBwYXJzaW5nIGxvZ2ljIGlzIGluIHRoZSBjb21waWxlciBhbHJlYWR5LlxuICBsZXQgaGFzSG9zdERlY29yYXRvcnMgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IGZpZWxkIGluIHByb3BNZXRhZGF0YSkge1xuICAgIHByb3BNZXRhZGF0YVtmaWVsZF0uZm9yRWFjaChhbm4gPT4ge1xuICAgICAgY29uc3QgbWV0YWRhdGFOYW1lID0gYW5uLm5nTWV0YWRhdGFOYW1lO1xuICAgICAgaWYgKG1ldGFkYXRhTmFtZSA9PT0gJ0lucHV0Jykge1xuICAgICAgICBpbnB1dHMgPSBpbnB1dHMgfHwge307XG4gICAgICAgIGlucHV0c1tmaWVsZF0gPSBhbm4uYmluZGluZ1Byb3BlcnR5TmFtZSA/IFthbm4uYmluZGluZ1Byb3BlcnR5TmFtZSwgZmllbGRdIDogZmllbGQ7XG4gICAgICB9IGVsc2UgaWYgKG1ldGFkYXRhTmFtZSA9PT0gJ091dHB1dCcpIHtcbiAgICAgICAgb3V0cHV0cyA9IG91dHB1dHMgfHwge307XG4gICAgICAgIG91dHB1dHNbZmllbGRdID0gYW5uLmJpbmRpbmdQcm9wZXJ0eU5hbWUgfHwgZmllbGQ7XG4gICAgICB9IGVsc2UgaWYgKG1ldGFkYXRhTmFtZSA9PT0gJ0hvc3RCaW5kaW5nJyB8fCBtZXRhZGF0YU5hbWUgPT09ICdIb3N0TGlzdGVuZXInKSB7XG4gICAgICAgIGhhc0hvc3REZWNvcmF0b3JzID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIE9ubHkgZ2VuZXJhdGUgdGhlIGJhc2UgZGVmIGlmIHRoZXJlJ3MgYW55IGluZm8gaW5zaWRlIGl0LlxuICBpZiAoaW5wdXRzIHx8IG91dHB1dHMgfHwgdmlld1F1ZXJpZXMubGVuZ3RoIHx8IHF1ZXJpZXMubGVuZ3RoIHx8IGhhc0hvc3REZWNvcmF0b3JzKSB7XG4gICAgcmV0dXJuIHtuYW1lOiB0eXBlLm5hbWUsIHR5cGUsIGlucHV0cywgb3V0cHV0cywgdmlld1F1ZXJpZXMsIHF1ZXJpZXMsIHByb3BNZXRhZGF0YX07XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gY29udmVydFRvUjNRdWVyeVByZWRpY2F0ZShzZWxlY3RvcjogYW55KTogYW55fHN0cmluZ1tdIHtcbiAgcmV0dXJuIHR5cGVvZiBzZWxlY3RvciA9PT0gJ3N0cmluZycgPyBzcGxpdEJ5Q29tbWEoc2VsZWN0b3IpIDogcmVzb2x2ZUZvcndhcmRSZWYoc2VsZWN0b3IpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29udmVydFRvUjNRdWVyeU1ldGFkYXRhKHByb3BlcnR5TmFtZTogc3RyaW5nLCBhbm46IFF1ZXJ5KTogUjNRdWVyeU1ldGFkYXRhRmFjYWRlIHtcbiAgcmV0dXJuIHtcbiAgICBwcm9wZXJ0eU5hbWU6IHByb3BlcnR5TmFtZSxcbiAgICBwcmVkaWNhdGU6IGNvbnZlcnRUb1IzUXVlcnlQcmVkaWNhdGUoYW5uLnNlbGVjdG9yKSxcbiAgICBkZXNjZW5kYW50czogYW5uLmRlc2NlbmRhbnRzLFxuICAgIGZpcnN0OiBhbm4uZmlyc3QsXG4gICAgcmVhZDogYW5uLnJlYWQgPyBhbm4ucmVhZCA6IG51bGwsXG4gICAgc3RhdGljOiAhIWFubi5zdGF0aWNcbiAgfTtcbn1cbmZ1bmN0aW9uIGV4dHJhY3RRdWVyaWVzTWV0YWRhdGEoXG4gICAgdHlwZTogVHlwZTxhbnk+LCBwcm9wTWV0YWRhdGE6IHtba2V5OiBzdHJpbmddOiBhbnlbXX0sXG4gICAgaXNRdWVyeUFubjogKGFubjogYW55KSA9PiBhbm4gaXMgUXVlcnkpOiBSM1F1ZXJ5TWV0YWRhdGFGYWNhZGVbXSB7XG4gIGNvbnN0IHF1ZXJpZXNNZXRhOiBSM1F1ZXJ5TWV0YWRhdGFGYWNhZGVbXSA9IFtdO1xuICBmb3IgKGNvbnN0IGZpZWxkIGluIHByb3BNZXRhZGF0YSkge1xuICAgIGlmIChwcm9wTWV0YWRhdGEuaGFzT3duUHJvcGVydHkoZmllbGQpKSB7XG4gICAgICBjb25zdCBhbm5vdGF0aW9ucyA9IHByb3BNZXRhZGF0YVtmaWVsZF07XG4gICAgICBhbm5vdGF0aW9ucy5mb3JFYWNoKGFubiA9PiB7XG4gICAgICAgIGlmIChpc1F1ZXJ5QW5uKGFubikpIHtcbiAgICAgICAgICBpZiAoIWFubi5zZWxlY3Rvcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgIGBDYW4ndCBjb25zdHJ1Y3QgYSBxdWVyeSBmb3IgdGhlIHByb3BlcnR5IFwiJHtmaWVsZH1cIiBvZiBgICtcbiAgICAgICAgICAgICAgICBgXCIke3N0cmluZ2lmeUZvckVycm9yKHR5cGUpfVwiIHNpbmNlIHRoZSBxdWVyeSBzZWxlY3RvciB3YXNuJ3QgZGVmaW5lZC5gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGFubm90YXRpb25zLnNvbWUoaXNJbnB1dEFubikpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGNvbWJpbmUgQElucHV0IGRlY29yYXRvcnMgd2l0aCBxdWVyeSBkZWNvcmF0b3JzYCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHF1ZXJpZXNNZXRhLnB1c2goY29udmVydFRvUjNRdWVyeU1ldGFkYXRhKGZpZWxkLCBhbm4pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBxdWVyaWVzTWV0YTtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdEV4cG9ydEFzKGV4cG9ydEFzOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmdbXXxudWxsIHtcbiAgaWYgKGV4cG9ydEFzID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiBleHBvcnRBcy5zcGxpdCgnLCcpLm1hcChwYXJ0ID0+IHBhcnQudHJpbSgpKTtcbn1cblxuZnVuY3Rpb24gaXNDb250ZW50UXVlcnkodmFsdWU6IGFueSk6IHZhbHVlIGlzIFF1ZXJ5IHtcbiAgY29uc3QgbmFtZSA9IHZhbHVlLm5nTWV0YWRhdGFOYW1lO1xuICByZXR1cm4gbmFtZSA9PT0gJ0NvbnRlbnRDaGlsZCcgfHwgbmFtZSA9PT0gJ0NvbnRlbnRDaGlsZHJlbic7XG59XG5cbmZ1bmN0aW9uIGlzVmlld1F1ZXJ5KHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBRdWVyeSB7XG4gIGNvbnN0IG5hbWUgPSB2YWx1ZS5uZ01ldGFkYXRhTmFtZTtcbiAgcmV0dXJuIG5hbWUgPT09ICdWaWV3Q2hpbGQnIHx8IG5hbWUgPT09ICdWaWV3Q2hpbGRyZW4nO1xufVxuXG5mdW5jdGlvbiBpc0lucHV0QW5uKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBJbnB1dCB7XG4gIHJldHVybiB2YWx1ZS5uZ01ldGFkYXRhTmFtZSA9PT0gJ0lucHV0Jztcbn1cblxuZnVuY3Rpb24gc3BsaXRCeUNvbW1hKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIHJldHVybiB2YWx1ZS5zcGxpdCgnLCcpLm1hcChwaWVjZSA9PiBwaWVjZS50cmltKCkpO1xufVxuIl19