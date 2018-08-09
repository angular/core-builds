/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { ConstantPool, WrappedNodeExpr, compileComponentFromMetadata as compileR3Component, compileDirectiveFromMetadata as compileR3Directive, jitExpression, makeBindingParser, parseHostBindings, parseTemplate } from '@angular/compiler';
import { componentNeedsResolution, maybeQueueResolutionOfComponentResources } from '../../metadata/resource_loading';
import { stringify } from '../../util';
import { angularCoreEnv } from './environment';
import { NG_COMPONENT_DEF, NG_DIRECTIVE_DEF } from './fields';
import { patchComponentDefWithScope } from './module';
import { getReflect, reflectDependencies } from './util';
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
    var def = null;
    // Metadata may have resources which need to be resolved.
    maybeQueueResolutionOfComponentResources(metadata);
    Object.defineProperty(type, NG_COMPONENT_DEF, {
        get: function () {
            if (def === null) {
                if (componentNeedsResolution(metadata)) {
                    var error = ["Component '" + stringify(type) + "' is not resolved:"];
                    if (metadata.templateUrl) {
                        error.push(" - templateUrl: " + stringify(metadata.templateUrl));
                    }
                    if (metadata.styleUrls && metadata.styleUrls.length) {
                        error.push(" - styleUrls: " + JSON.stringify(metadata.styleUrls));
                    }
                    error.push("Did you run and wait for 'resolveComponentResources()'?");
                    throw new Error(error.join('\n'));
                }
                // The ConstantPool is a requirement of the JIT'er.
                var constantPool = new ConstantPool();
                // Parse the template and check for errors.
                var template = parseTemplate(metadata.template, "ng://" + stringify(type) + "/template.html", {
                    preserveWhitespaces: metadata.preserveWhitespaces || false,
                });
                if (template.errors !== undefined) {
                    var errors = template.errors.map(function (err) { return err.toString(); }).join(', ');
                    throw new Error("Errors during JIT compilation of template for " + stringify(type) + ": " + errors);
                }
                // Compile the component metadata, including template, into an expression.
                // TODO(alxhub): implement inputs, outputs, queries, etc.
                var res = compileR3Component(tslib_1.__assign({}, directiveMetadata(type, metadata), { template: template, directives: new Map(), pipes: new Map(), viewQueries: [], wrapDirectivesInClosure: false }), constantPool, makeBindingParser());
                var preStatements = tslib_1.__spread(constantPool.statements, res.statements);
                def = jitExpression(res.expression, angularCoreEnv, "ng://" + type.name + "/ngComponentDef.js", preStatements);
                // If component compilation is async, then the @NgModule annotation which declares the
                // component may execute and set an ngSelectorScope property on the component type. This
                // allows the component to patch itself with directiveDefs from the module after it finishes
                // compiling.
                if (hasSelectorScope(type)) {
                    patchComponentDefWithScope(def, type.ngSelectorScope);
                }
            }
            return def;
        },
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
    var def = null;
    Object.defineProperty(type, NG_DIRECTIVE_DEF, {
        get: function () {
            if (def === null) {
                var constantPool = new ConstantPool();
                var sourceMapUrl = "ng://" + (type && type.name) + "/ngDirectiveDef.js";
                var res = compileR3Directive(directiveMetadata(type, directive), constantPool, makeBindingParser());
                var preStatements = tslib_1.__spread(constantPool.statements, res.statements);
                def = jitExpression(res.expression, angularCoreEnv, sourceMapUrl, preStatements);
            }
            return def;
        },
    });
}
export function extendsDirectlyFromObject(type) {
    return Object.getPrototypeOf(type.prototype) === Object.prototype;
}
/**
 * Extract the `R3DirectiveMetadata` for a particular directive (either a `Directive` or a
 * `Component`).
 */
function directiveMetadata(type, metadata) {
    // Reflect inputs and outputs.
    var propMetadata = getReflect().propMetadata(type);
    var host = extractHostBindings(metadata, propMetadata);
    var inputsFromMetadata = parseInputOutputs(metadata.inputs || []);
    var outputsFromMetadata = parseInputOutputs(metadata.outputs || []);
    var inputsFromType = {};
    var outputsFromType = {};
    var _loop_1 = function (field) {
        if (propMetadata.hasOwnProperty(field)) {
            propMetadata[field].forEach(function (ann) {
                if (isInput(ann)) {
                    inputsFromType[field] = ann.bindingPropertyName || field;
                }
                else if (isOutput(ann)) {
                    outputsFromType[field] = ann.bindingPropertyName || field;
                }
            });
        }
    };
    for (var field in propMetadata) {
        _loop_1(field);
    }
    return {
        name: type.name,
        type: new WrappedNodeExpr(type),
        typeArgumentCount: 0,
        selector: metadata.selector,
        deps: reflectDependencies(type), host: host,
        inputs: tslib_1.__assign({}, inputsFromMetadata, inputsFromType),
        outputs: tslib_1.__assign({}, outputsFromMetadata, outputsFromType),
        queries: [],
        lifecycle: {
            usesOnChanges: type.prototype.ngOnChanges !== undefined,
        },
        typeSourceSpan: null,
        usesInheritance: !extendsDirectlyFromObject(type),
        exportAs: metadata.exportAs || null,
    };
}
function extractHostBindings(metadata, propMetadata) {
    // First parse the declarations from the metadata.
    var _a = parseHostBindings(metadata.host || {}), attributes = _a.attributes, listeners = _a.listeners, properties = _a.properties, animations = _a.animations;
    if (Object.keys(animations).length > 0) {
        throw new Error("Animation bindings are as-of-yet unsupported in Ivy");
    }
    var _loop_2 = function (field) {
        if (propMetadata.hasOwnProperty(field)) {
            propMetadata[field].forEach(function (ann) {
                if (isHostBinding(ann)) {
                    properties[ann.hostPropertyName || field] = field;
                }
                else if (isHostListener(ann)) {
                    listeners[ann.eventName || field] = field + "(" + (ann.args || []).join(',') + ")";
                }
            });
        }
    };
    // Next, loop over the properties of the object, looking for @HostBinding and @HostListener.
    for (var field in propMetadata) {
        _loop_2(field);
    }
    return { attributes: attributes, listeners: listeners, properties: properties };
}
function isInput(value) {
    return value.ngMetadataName === 'Input';
}
function isOutput(value) {
    return value.ngMetadataName === 'Output';
}
function isHostBinding(value) {
    return value.ngMetadataName === 'HostBinding';
}
function isHostListener(value) {
    return value.ngMetadataName === 'HostListener';
}
function parseInputOutputs(values) {
    return values.reduce(function (map, value) {
        var _a = tslib_1.__read(value.split(',').map(function (piece) { return piece.trim(); }), 2), field = _a[0], property = _a[1];
        map[field] = property || field;
        return map;
    }, {});
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUF1QixlQUFlLEVBQUUsNEJBQTRCLElBQUksa0JBQWtCLEVBQUUsNEJBQTRCLElBQUksa0JBQWtCLEVBQUUsYUFBYSxFQUFFLGlCQUFpQixFQUFFLGlCQUFpQixFQUFFLGFBQWEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBR2pRLE9BQU8sRUFBQyx3QkFBd0IsRUFBRSx3Q0FBd0MsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBR25ILE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFckMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM3QyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDNUQsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3BELE9BQU8sRUFBQyxVQUFVLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFNdkQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLDJCQUEyQixJQUFlLEVBQUUsUUFBbUI7SUFDbkUsSUFBSSxHQUFHLEdBQVEsSUFBSSxDQUFDO0lBQ3BCLHlEQUF5RDtJQUN6RCx3Q0FBd0MsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNuRCxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtRQUM1QyxHQUFHLEVBQUU7WUFDSCxJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUU7Z0JBQ2hCLElBQUksd0JBQXdCLENBQUMsUUFBUSxDQUFDLEVBQUU7b0JBQ3RDLElBQU0sS0FBSyxHQUFHLENB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LENBQUM7QUFFRCx1QkFBdUIsS0FBVTtJQUMvQixPQUFPLEtBQUssQ0FBQyxjQUFjLEtBQUssYUFBYSxDQUFDO0FBQ2hELENBQUM7QUFFRCx3QkFBd0IsS0FBVTtJQUNoQyxPQUFPLEtBQUssQ0FBQyxjQUFjLEtBQUssY0FBYyxDQUFDO0FBQ2pELENBQUM7QUFFRCwyQkFBMkIsTUFBZ0I7SUFDekMsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUNoQixVQUFDLEdBQUcsRUFBRSxLQUFLO1FBQ0gsSUFBQSx1RkFBK0QsRUFBOUQsYUFBSyxFQUFFLGdCQUFRLENBQWdEO1FBQ3RFLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxRQUFRLElBQUksS0FBSyxDQUFDO1FBQy9CLE9BQU8sR0FBRyxDQUFDO0lBQ2IsQ0FBQyxFQUNELEVBQWUsQ0FBQyxDQUFDO0FBQ3ZCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q29uc3RhbnRQb29sLCBSM0RpcmVjdGl2ZU1ldGFkYXRhLCBXcmFwcGVkTm9kZUV4cHIsIGNvbXBpbGVDb21wb25lbnRGcm9tTWV0YWRhdGEgYXMgY29tcGlsZVIzQ29tcG9uZW50LCBjb21waWxlRGlyZWN0aXZlRnJvbU1ldGFkYXRhIGFzIGNvbXBpbGVSM0RpcmVjdGl2ZSwgaml0RXhwcmVzc2lvbiwgbWFrZUJpbmRpbmdQYXJzZXIsIHBhcnNlSG9zdEJpbmRpbmdzLCBwYXJzZVRlbXBsYXRlfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5cbmltcG9ydCB7Q29tcG9uZW50LCBEaXJlY3RpdmUsIEhvc3RCaW5kaW5nLCBIb3N0TGlzdGVuZXIsIElucHV0LCBPdXRwdXR9IGZyb20gJy4uLy4uL21ldGFkYXRhL2RpcmVjdGl2ZXMnO1xuaW1wb3J0IHtjb21wb25lbnROZWVkc1Jlc29sdXRpb24sIG1heWJlUXVldWVSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXN9IGZyb20gJy4uLy4uL21ldGFkYXRhL3Jlc291cmNlX2xvYWRpbmcnO1xuaW1wb3J0IHtSZWZsZWN0aW9uQ2FwYWJpbGl0aWVzfSBmcm9tICcuLi8uLi9yZWZsZWN0aW9uL3JlZmxlY3Rpb25fY2FwYWJpbGl0aWVzJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vdHlwZSc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vLi4vdXRpbCc7XG5cbmltcG9ydCB7YW5ndWxhckNvcmVFbnZ9IGZyb20gJy4vZW52aXJvbm1lbnQnO1xuaW1wb3J0IHtOR19DT01QT05FTlRfREVGLCBOR19ESVJFQ1RJVkVfREVGfSBmcm9tICcuL2ZpZWxkcyc7XG5pbXBvcnQge3BhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlfSBmcm9tICcuL21vZHVsZSc7XG5pbXBvcnQge2dldFJlZmxlY3QsIHJlZmxlY3REZXBlbmRlbmNpZXN9IGZyb20gJy4vdXRpbCc7XG5cbnR5cGUgU3RyaW5nTWFwID0ge1xuICBba2V5OiBzdHJpbmddOiBzdHJpbmdcbn07XG5cbi8qKlxuICogQ29tcGlsZSBhbiBBbmd1bGFyIGNvbXBvbmVudCBhY2NvcmRpbmcgdG8gaXRzIGRlY29yYXRvciBtZXRhZGF0YSwgYW5kIHBhdGNoIHRoZSByZXN1bHRpbmdcbiAqIG5nQ29tcG9uZW50RGVmIG9udG8gdGhlIGNvbXBvbmVudCB0eXBlLlxuICpcbiAqIENvbXBpbGF0aW9uIG1heSBiZSBhc3luY2hyb25vdXMgKGR1ZSB0byB0aGUgbmVlZCB0byByZXNvbHZlIFVSTHMgZm9yIHRoZSBjb21wb25lbnQgdGVtcGxhdGUgb3JcbiAqIG90aGVyIHJlc291cmNlcywgZm9yIGV4YW1wbGUpLiBJbiB0aGUgZXZlbnQgdGhhdCBjb21waWxhdGlvbiBpcyBub3QgaW1tZWRpYXRlLCBgY29tcGlsZUNvbXBvbmVudGBcbiAqIHdpbGwgZW5xdWV1ZSByZXNvdXJjZSByZXNvbHV0aW9uIGludG8gYSBnbG9iYWwgcXVldWUgYW5kIHdpbGwgZmFpbCB0byByZXR1cm4gdGhlIGBuZ0NvbXBvbmVudERlZmBcbiAqIHVudGlsIHRoZSBnbG9iYWwgcXVldWUgaGFzIGJlZW4gcmVzb2x2ZWQgd2l0aCBhIGNhbGwgdG8gYHJlc29sdmVDb21wb25lbnRSZXNvdXJjZXNgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZUNvbXBvbmVudCh0eXBlOiBUeXBlPGFueT4sIG1ldGFkYXRhOiBDb21wb25lbnQpOiB2b2lkIHtcbiAgbGV0IGRlZjogYW55ID0gbnVsbDtcbiAgLy8gTWV0YWRhdGEgbWF5IGhhdmUgcmVzb3VyY2VzIHdoaWNoIG5lZWQgdG8gYmUgcmVzb2x2ZWQuXG4gIG1heWJlUXVldWVSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXMobWV0YWRhdGEpO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgTkdfQ09NUE9ORU5UX0RFRiwge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKGRlZiA9PT0gbnVsbCkge1xuICAgICAgICBpZiAoY29tcG9uZW50TmVlZHNSZXNvbHV0aW9uKG1ldGFkYXRhKSkge1xuICAgICAgICAgIGNvbnN0IGVycm9yID0gW2BDb21wb25lbnQgJyR7c3RyaW5naWZ5KHR5cGUpfScgaXMgbm90IHJlc29sdmVkOmBdO1xuICAgICAgICAgIGlmIChtZXRhZGF0YS50ZW1wbGF0ZVVybCkge1xuICAgICAgICAgICAgZXJyb3IucHVzaChgIC0gdGVtcGxhdGVVcmw6ICR7c3RyaW5naWZ5KG1ldGFkYXRhLnRlbXBsYXRlVXJsKX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG1ldGFkYXRhLnN0eWxlVXJscyAmJiBtZXRhZGF0YS5zdHlsZVVybHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBlcnJvci5wdXNoKGAgLSBzdHlsZVVybHM6ICR7SlNPTi5zdHJpbmdpZnkobWV0YWRhdGEuc3R5bGVVcmxzKX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZXJyb3IucHVzaChgRGlkIHlvdSBydW4gYW5kIHdhaXQgZm9yICdyZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzKCknP2ApO1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvci5qb2luKCdcXG4nKSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhlIENvbnN0YW50UG9vbCBpcyBhIHJlcXVpcmVtZW50IG9mIHRoZSBKSVQnZXIuXG4gICAgICAgIGNvbnN0IGNvbnN0YW50UG9vbCA9IG5ldyBDb25zdGFudFBvb2woKTtcblxuICAgICAgICAvLyBQYXJzZSB0aGUgdGVtcGxhdGUgYW5kIGNoZWNrIGZvciBlcnJvcnMuXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID1cbiAgICAgICAgICAgIHBhcnNlVGVtcGxhdGUobWV0YWRhdGEudGVtcGxhdGUgISwgYG5nOi8vJHtzdHJpbmdpZnkodHlwZSl9L3RlbXBsYXRlLmh0bWxgLCB7XG4gICAgICAgICAgICAgIHByZXNlcnZlV2hpdGVzcGFjZXM6IG1ldGFkYXRhLnByZXNlcnZlV2hpdGVzcGFjZXMgfHwgZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRlbXBsYXRlLmVycm9ycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgY29uc3QgZXJyb3JzID0gdGVtcGxhdGUuZXJyb3JzLm1hcChlcnIgPT4gZXJyLnRvU3RyaW5nKCkpLmpvaW4oJywgJyk7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICBgRXJyb3JzIGR1cmluZyBKSVQgY29tcGlsYXRpb24gb2YgdGVtcGxhdGUgZm9yICR7c3RyaW5naWZ5KHR5cGUpfTogJHtlcnJvcnN9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDb21waWxlIHRoZSBjb21wb25lbnQgbWV0YWRhdGEsIGluY2x1ZGluZyB0ZW1wbGF0ZSwgaW50byBhbiBleHByZXNzaW9uLlxuICAgICAgICAvLyBUT0RPKGFseGh1Yik6IGltcGxlbWVudCBpbnB1dHMsIG91dHB1dHMsIHF1ZXJpZXMsIGV0Yy5cbiAgICAgICAgY29uc3QgcmVzID0gY29tcGlsZVIzQ29tcG9uZW50KFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAuLi5kaXJlY3RpdmVNZXRhZGF0YSh0eXBlLCBtZXRhZGF0YSksXG4gICAgICAgICAgICAgIHRlbXBsYXRlLFxuICAgICAgICAgICAgICBkaXJlY3RpdmVzOiBuZXcgTWFwKCksXG4gICAgICAgICAgICAgIHBpcGVzOiBuZXcgTWFwKCksXG4gICAgICAgICAgICAgIHZpZXdRdWVyaWVzOiBbXSxcbiAgICAgICAgICAgICAgd3JhcERpcmVjdGl2ZXNJbkNsb3N1cmU6IGZhbHNlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbnN0YW50UG9vbCwgbWFrZUJpbmRpbmdQYXJzZXIoKSk7XG4gICAgICAgIGNvbnN0IHByZVN0YXRlbWVudHMgPSBbLi4uY29uc3RhbnRQb29sLnN0YXRlbWVudHMsIC4uLnJlcy5zdGF0ZW1lbnRzXTtcblxuICAgICAgICBkZWYgPSBqaXRFeHByZXNzaW9uKFxuICAgICAgICAgICAgcmVzLmV4cHJlc3Npb24sIGFuZ3VsYXJDb3JlRW52LCBgbmc6Ly8ke3R5cGUubmFtZX0vbmdDb21wb25lbnREZWYuanNgLCBwcmVTdGF0ZW1lbnRzKTtcblxuICAgICAgICAvLyBJZiBjb21wb25lbnQgY29tcGlsYXRpb24gaXMgYXN5bmMsIHRoZW4gdGhlIEBOZ01vZHVsZSBhbm5vdGF0aW9uIHdoaWNoIGRlY2xhcmVzIHRoZVxuICAgICAgICAvLyBjb21wb25lbnQgbWF5IGV4ZWN1dGUgYW5kIHNldCBhbiBuZ1NlbGVjdG9yU2NvcGUgcHJvcGVydHkgb24gdGhlIGNvbXBvbmVudCB0eXBlLiBUaGlzXG4gICAgICAgIC8vIGFsbG93cyB0aGUgY29tcG9uZW50IHRvIHBhdGNoIGl0c2VsZiB3aXRoIGRpcmVjdGl2ZURlZnMgZnJvbSB0aGUgbW9kdWxlIGFmdGVyIGl0IGZpbmlzaGVzXG4gICAgICAgIC8vIGNvbXBpbGluZy5cbiAgICAgICAgaWYgKGhhc1NlbGVjdG9yU2NvcGUodHlwZSkpIHtcbiAgICAgICAgICBwYXRjaENvbXBvbmVudERlZldpdGhTY29wZShkZWYsIHR5cGUubmdTZWxlY3RvclNjb3BlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGRlZjtcbiAgICB9LFxuICB9KTtcbn1cblxuZnVuY3Rpb24gaGFzU2VsZWN0b3JTY29wZTxUPihjb21wb25lbnQ6IFR5cGU8VD4pOiBjb21wb25lbnQgaXMgVHlwZTxUPiZcbiAgICB7bmdTZWxlY3RvclNjb3BlOiBUeXBlPGFueT59IHtcbiAgcmV0dXJuIChjb21wb25lbnQgYXN7bmdTZWxlY3RvclNjb3BlPzogYW55fSkubmdTZWxlY3RvclNjb3BlICE9PSB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogQ29tcGlsZSBhbiBBbmd1bGFyIGRpcmVjdGl2ZSBhY2NvcmRpbmcgdG8gaXRzIGRlY29yYXRvciBtZXRhZGF0YSwgYW5kIHBhdGNoIHRoZSByZXN1bHRpbmdcbiAqIG5nRGlyZWN0aXZlRGVmIG9udG8gdGhlIGNvbXBvbmVudCB0eXBlLlxuICpcbiAqIEluIHRoZSBldmVudCB0aGF0IGNvbXBpbGF0aW9uIGlzIG5vdCBpbW1lZGlhdGUsIGBjb21waWxlRGlyZWN0aXZlYCB3aWxsIHJldHVybiBhIGBQcm9taXNlYCB3aGljaFxuICogd2lsbCByZXNvbHZlIHdoZW4gY29tcGlsYXRpb24gY29tcGxldGVzIGFuZCB0aGUgZGlyZWN0aXZlIGJlY29tZXMgdXNhYmxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZURpcmVjdGl2ZSh0eXBlOiBUeXBlPGFueT4sIGRpcmVjdGl2ZTogRGlyZWN0aXZlKTogdm9pZCB7XG4gIGxldCBkZWY6IGFueSA9IG51bGw7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBOR19ESVJFQ1RJVkVfREVGLCB7XG4gICAgZ2V0OiAoKSA9PiB7XG4gICAgICBpZiAoZGVmID09PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IGNvbnN0YW50UG9vbCA9IG5ldyBDb25zdGFudFBvb2woKTtcbiAgICAgICAgY29uc3Qgc291cmNlTWFwVXJsID0gYG5nOi8vJHt0eXBlICYmIHR5cGUubmFtZX0vbmdEaXJlY3RpdmVEZWYuanNgO1xuICAgICAgICBjb25zdCByZXMgPSBjb21waWxlUjNEaXJlY3RpdmUoXG4gICAgICAgICAgICBkaXJlY3RpdmVNZXRhZGF0YSh0eXBlLCBkaXJlY3RpdmUpLCBjb25zdGFudFBvb2wsIG1ha2VCaW5kaW5nUGFyc2VyKCkpO1xuICAgICAgICBjb25zdCBwcmVTdGF0ZW1lbnRzID0gWy4uLmNvbnN0YW50UG9vbC5zdGF0ZW1lbnRzLCAuLi5yZXMuc3RhdGVtZW50c107XG4gICAgICAgIGRlZiA9IGppdEV4cHJlc3Npb24ocmVzLmV4cHJlc3Npb24sIGFuZ3VsYXJDb3JlRW52LCBzb3VyY2VNYXBVcmwsIHByZVN0YXRlbWVudHMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRlZjtcbiAgICB9LFxuICB9KTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZXh0ZW5kc0RpcmVjdGx5RnJvbU9iamVjdCh0eXBlOiBUeXBlPGFueT4pOiBib29sZWFuIHtcbiAgcmV0dXJuIE9iamVjdC5nZXRQcm90b3R5cGVPZih0eXBlLnByb3RvdHlwZSkgPT09IE9iamVjdC5wcm90b3R5cGU7XG59XG5cbi8qKlxuICogRXh0cmFjdCB0aGUgYFIzRGlyZWN0aXZlTWV0YWRhdGFgIGZvciBhIHBhcnRpY3VsYXIgZGlyZWN0aXZlIChlaXRoZXIgYSBgRGlyZWN0aXZlYCBvciBhXG4gKiBgQ29tcG9uZW50YCkuXG4gKi9cbmZ1bmN0aW9uIGRpcmVjdGl2ZU1ldGFkYXRhKHR5cGU6IFR5cGU8YW55PiwgbWV0YWRhdGE6IERpcmVjdGl2ZSk6IFIzRGlyZWN0aXZlTWV0YWRhdGEge1xuICAvLyBSZWZsZWN0IGlucHV0cyBhbmQgb3V0cHV0cy5cbiAgY29uc3QgcHJvcE1ldGFkYXRhID0gZ2V0UmVmbGVjdCgpLnByb3BNZXRhZGF0YSh0eXBlKTtcblxuICBjb25zdCBob3N0ID0gZXh0cmFjdEhvc3RCaW5kaW5ncyhtZXRhZGF0YSwgcHJvcE1ldGFkYXRhKTtcblxuICBjb25zdCBpbnB1dHNGcm9tTWV0YWRhdGEgPSBwYXJzZUlucHV0T3V0cHV0cyhtZXRhZGF0YS5pbnB1dHMgfHwgW10pO1xuICBjb25zdCBvdXRwdXRzRnJvbU1ldGFkYXRhID0gcGFyc2VJbnB1dE91dHB1dHMobWV0YWRhdGEub3V0cHV0cyB8fCBbXSk7XG5cbiAgY29uc3QgaW5wdXRzRnJvbVR5cGU6IFN0cmluZ01hcCA9IHt9O1xuICBjb25zdCBvdXRwdXRzRnJvbVR5cGU6IFN0cmluZ01hcCA9IHt9O1xuICBmb3IgKGNvbnN0IGZpZWxkIGluIHByb3BNZXRhZGF0YSkge1xuICAgIGlmIChwcm9wTWV0YWRhdGEuaGFzT3duUHJvcGVydHkoZmllbGQpKSB7XG4gICAgICBwcm9wTWV0YWRhdGFbZmllbGRdLmZvckVhY2goYW5uID0+IHtcbiAgICAgICAgaWYgKGlzSW5wdXQoYW5uKSkge1xuICAgICAgICAgIGlucHV0c0Zyb21UeXBlW2ZpZWxkXSA9IGFubi5iaW5kaW5nUHJvcGVydHlOYW1lIHx8IGZpZWxkO1xuICAgICAgICB9IGVsc2UgaWYgKGlzT3V0cHV0KGFubikpIHtcbiAgICAgICAgICBvdXRwdXRzRnJvbVR5cGVbZmllbGRdID0gYW5uLmJpbmRpbmdQcm9wZXJ0eU5hbWUgfHwgZmllbGQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgbmFtZTogdHlwZS5uYW1lLFxuICAgIHR5cGU6IG5ldyBXcmFwcGVkTm9kZUV4cHIodHlwZSksXG4gICAgdHlwZUFyZ3VtZW50Q291bnQ6IDAsXG4gICAgc2VsZWN0b3I6IG1ldGFkYXRhLnNlbGVjdG9yICEsXG4gICAgZGVwczogcmVmbGVjdERlcGVuZGVuY2llcyh0eXBlKSwgaG9zdCxcbiAgICBpbnB1dHM6IHsuLi5pbnB1dHNGcm9tTWV0YWRhdGEsIC4uLmlucHV0c0Zyb21UeXBlfSxcbiAgICBvdXRwdXRzOiB7Li4ub3V0cHV0c0Zyb21NZXRhZGF0YSwgLi4ub3V0cHV0c0Zyb21UeXBlfSxcbiAgICBxdWVyaWVzOiBbXSxcbiAgICBsaWZlY3ljbGU6IHtcbiAgICAgIHVzZXNPbkNoYW5nZXM6IHR5cGUucHJvdG90eXBlLm5nT25DaGFuZ2VzICE9PSB1bmRlZmluZWQsXG4gICAgfSxcbiAgICB0eXBlU291cmNlU3BhbjogbnVsbCAhLFxuICAgIHVzZXNJbmhlcml0YW5jZTogIWV4dGVuZHNEaXJlY3RseUZyb21PYmplY3QodHlwZSksXG4gICAgZXhwb3J0QXM6IG1ldGFkYXRhLmV4cG9ydEFzIHx8IG51bGwsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RIb3N0QmluZGluZ3MobWV0YWRhdGE6IERpcmVjdGl2ZSwgcHJvcE1ldGFkYXRhOiB7W2tleTogc3RyaW5nXTogYW55W119KToge1xuICBhdHRyaWJ1dGVzOiBTdHJpbmdNYXAsXG4gIGxpc3RlbmVyczogU3RyaW5nTWFwLFxuICBwcm9wZXJ0aWVzOiBTdHJpbmdNYXAsXG59IHtcbiAgLy8gRmlyc3QgcGFyc2UgdGhlIGRlY2xhcmF0aW9ucyBmcm9tIHRoZSBtZXRhZGF0YS5cbiAgY29uc3Qge2F0dHJpYnV0ZXMsIGxpc3RlbmVycywgcHJvcGVydGllcywgYW5pbWF0aW9uc30gPSBwYXJzZUhvc3RCaW5kaW5ncyhtZXRhZGF0YS5ob3N0IHx8IHt9KTtcblxuICBpZiAoT2JqZWN0LmtleXMoYW5pbWF0aW9ucykubGVuZ3RoID4gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQW5pbWF0aW9uIGJpbmRpbmdzIGFyZSBhcy1vZi15ZXQgdW5zdXBwb3J0ZWQgaW4gSXZ5YCk7XG4gIH1cblxuICAvLyBOZXh0LCBsb29wIG92ZXIgdGhlIHByb3BlcnRpZXMgb2YgdGhlIG9iamVjdCwgbG9va2luZyBmb3IgQEhvc3RCaW5kaW5nIGFuZCBASG9zdExpc3RlbmVyLlxuICBmb3IgKGNvbnN0IGZpZWxkIGluIHByb3BNZXRhZGF0YSkge1xuICAgIGlmIChwcm9wTWV0YWRhdGEuaGFzT3duUHJvcGVydHkoZmllbGQpKSB7XG4gICAgICBwcm9wTWV0YWRhdGFbZmllbGRdLmZvckVhY2goYW5uID0+IHtcbiAgICAgICAgaWYgKGlzSG9zdEJpbmRpbmcoYW5uKSkge1xuICAgICAgICAgIHByb3BlcnRpZXNbYW5uLmhvc3RQcm9wZXJ0eU5hbWUgfHwgZmllbGRdID0gZmllbGQ7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNIb3N0TGlzdGVuZXIoYW5uKSkge1xuICAgICAgICAgIGxpc3RlbmVyc1thbm4uZXZlbnROYW1lIHx8IGZpZWxkXSA9IGAke2ZpZWxkfSgkeyhhbm4uYXJncyB8fCBbXSkuam9pbignLCcpfSlgO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge2F0dHJpYnV0ZXMsIGxpc3RlbmVycywgcHJvcGVydGllc307XG59XG5cbmZ1bmN0aW9uIGlzSW5wdXQodmFsdWU6IGFueSk6IHZhbHVlIGlzIElucHV0IHtcbiAgcmV0dXJuIHZhbHVlLm5nTWV0YWRhdGFOYW1lID09PSAnSW5wdXQnO1xufVxuXG5mdW5jdGlvbiBpc091dHB1dCh2YWx1ZTogYW55KTogdmFsdWUgaXMgT3V0cHV0IHtcbiAgcmV0dXJuIHZhbHVlLm5nTWV0YWRhdGFOYW1lID09PSAnT3V0cHV0Jztcbn1cblxuZnVuY3Rpb24gaXNIb3N0QmluZGluZyh2YWx1ZTogYW55KTogdmFsdWUgaXMgSG9zdEJpbmRpbmcge1xuICByZXR1cm4gdmFsdWUubmdNZXRhZGF0YU5hbWUgPT09ICdIb3N0QmluZGluZyc7XG59XG5cbmZ1bmN0aW9uIGlzSG9zdExpc3RlbmVyKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBIb3N0TGlzdGVuZXIge1xuICByZXR1cm4gdmFsdWUubmdNZXRhZGF0YU5hbWUgPT09ICdIb3N0TGlzdGVuZXInO1xufVxuXG5mdW5jdGlvbiBwYXJzZUlucHV0T3V0cHV0cyh2YWx1ZXM6IHN0cmluZ1tdKTogU3RyaW5nTWFwIHtcbiAgcmV0dXJuIHZhbHVlcy5yZWR1Y2UoXG4gICAgICAobWFwLCB2YWx1ZSkgPT4ge1xuICAgICAgICBjb25zdCBbZmllbGQsIHByb3BlcnR5XSA9IHZhbHVlLnNwbGl0KCcsJykubWFwKHBpZWNlID0+IHBpZWNlLnRyaW0oKSk7XG4gICAgICAgIG1hcFtmaWVsZF0gPSBwcm9wZXJ0eSB8fCBmaWVsZDtcbiAgICAgICAgcmV0dXJuIG1hcDtcbiAgICAgIH0sXG4gICAgICB7fSBhcyBTdHJpbmdNYXApO1xufVxuIl19