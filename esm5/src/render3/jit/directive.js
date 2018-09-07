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
import { ViewEncapsulation } from '../../metadata/view';
import { stringify } from '../../util';
import { angularCoreEnv } from './environment';
import { NG_COMPONENT_DEF, NG_DIRECTIVE_DEF } from './fields';
import { patchComponentDefWithScope, transitiveScopesFor } from './module';
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
    var ngComponentDef = null;
    // Metadata may have resources which need to be resolved.
    maybeQueueResolutionOfComponentResources(metadata);
    Object.defineProperty(type, NG_COMPONENT_DEF, {
        get: function () {
            if (ngComponentDef === null) {
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
                }, '');
                if (template.errors !== undefined) {
                    var errors = template.errors.map(function (err) { return err.toString(); }).join(', ');
                    throw new Error("Errors during JIT compilation of template for " + stringify(type) + ": " + errors);
                }
                // Compile the component metadata, including template, into an expression.
                // TODO(alxhub): implement inputs, outputs, queries, etc.
                var res = compileR3Component(tslib_1.__assign({}, directiveMetadata(type, metadata), { template: template, directives: new Map(), pipes: new Map(), viewQueries: [], wrapDirectivesInClosure: false, styles: metadata.styles || [], encapsulation: metadata.encapsulation || ViewEncapsulation.Emulated, animations: metadata.animations || null }), constantPool, makeBindingParser());
                var preStatements = tslib_1.__spread(constantPool.statements, res.statements);
                ngComponentDef = jitExpression(res.expression, angularCoreEnv, "ng://" + type.name + "/ngComponentDef.js", preStatements);
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
    Object.defineProperty(type, NG_DIRECTIVE_DEF, {
        get: function () {
            if (ngDirectiveDef === null) {
                var constantPool = new ConstantPool();
                var sourceMapUrl = "ng://" + (type && type.name) + "/ngDirectiveDef.js";
                var res = compileR3Directive(directiveMetadata(type, directive), constantPool, makeBindingParser());
                var preStatements = tslib_1.__spread(constantPool.statements, res.statements);
                ngDirectiveDef = jitExpression(res.expression, angularCoreEnv, sourceMapUrl, preStatements);
            }
            return ngDirectiveDef;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUF1QixlQUFlLEVBQUUsNEJBQTRCLElBQUksa0JBQWtCLEVBQUUsNEJBQTRCLElBQUksa0JBQWtCLEVBQUUsYUFBYSxFQUFFLGlCQUFpQixFQUFFLGlCQUFpQixFQUFFLGFBQWEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBR2pRLE9BQU8sRUFBQyx3QkFBd0IsRUFBRSx3Q0FBd0MsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ25ILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBRXRELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFckMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM3QyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDNUQsT0FBTyxFQUFDLDBCQUEwQixFQUFFLG1CQUFtQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3pFLE9BQU8sRUFBQyxVQUFVLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFNdkQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLFVBQVUsZ0JBQWdCLENBQUMsSUFBZSxFQUFFLFFBQW1CO0lBQ25FLElBQUksY0FBYyxHQUFRLElBQUksQ0FBQztJQUMvQix5REFBeUQ7SUFDekQsd0NBQXdDLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbkQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7UUFDNUMsR0FBRyxFQUFFO1lBQ0gsSUFBSSxjQUFjLEtBQUssSUFBSSxF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LEtBQUssQ0FBQyxHQUFNLEtBQUssU0FBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFHLENBQUM7aUJBQy9FO1lBQ0gsQ0FBQyxDQUFDLENBQUM7U0FDSjtJQUNILENBQUM7SUFYRCw0RkFBNEY7SUFDNUYsS0FBSyxJQUFNLEtBQUssSUFBSSxZQUFZO2dCQUFyQixLQUFLO0tBVWY7SUFFRCxPQUFPLEVBQUMsVUFBVSxZQUFBLEVBQUUsU0FBUyxXQUFBLEVBQUUsVUFBVSxZQUFBLEVBQUMsQ0FBQztBQUM3QyxDQUFDO0FBRUQsU0FBUyxPQUFPLENBQUMsS0FBVTtJQUN6QixPQUFPLEtBQUssQ0FBQyxjQUFjLEtBQUssT0FBTyxDQUFDO0FBQzFDLENBQUM7QUFFRCxTQUFTLFFBQVEsQ0FBQyxLQUFVO0lBQzFCLE9BQU8sS0FBSyxDQUFDLGNBQWMsS0FBSyxRQUFRLENBQUM7QUFDM0MsQ0FBQztBQUVELFNBQVMsYUFBYSxDQUFDLEtBQVU7SUFDL0IsT0FBTyxLQUFLLENBQUMsY0FBYyxLQUFLLGFBQWEsQ0FBQztBQUNoRCxDQUFDO0FBRUQsU0FBUyxjQUFjLENBQUMsS0FBVTtJQUNoQyxPQUFPLEtBQUssQ0FBQyxjQUFjLEtBQUssY0FBYyxDQUFDO0FBQ2pELENBQUM7QUFFRCxTQUFTLGlCQUFpQixDQUFDLE1BQWdCO0lBQ3pDLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FDaEIsVUFBQyxHQUFHLEVBQUUsS0FBSztRQUNILElBQUEsdUZBQStELEVBQTlELGFBQUssRUFBRSxnQkFBUSxDQUFnRDtRQUN0RSxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsUUFBUSxJQUFJLEtBQUssQ0FBQztRQUMvQixPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUMsRUFDRCxFQUFlLENBQUMsQ0FBQztBQUN2QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NvbnN0YW50UG9vbCwgUjNEaXJlY3RpdmVNZXRhZGF0YSwgV3JhcHBlZE5vZGVFeHByLCBjb21waWxlQ29tcG9uZW50RnJvbU1ldGFkYXRhIGFzIGNvbXBpbGVSM0NvbXBvbmVudCwgY29tcGlsZURpcmVjdGl2ZUZyb21NZXRhZGF0YSBhcyBjb21waWxlUjNEaXJlY3RpdmUsIGppdEV4cHJlc3Npb24sIG1ha2VCaW5kaW5nUGFyc2VyLCBwYXJzZUhvc3RCaW5kaW5ncywgcGFyc2VUZW1wbGF0ZX0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuXG5pbXBvcnQge0NvbXBvbmVudCwgRGlyZWN0aXZlLCBIb3N0QmluZGluZywgSG9zdExpc3RlbmVyLCBJbnB1dCwgT3V0cHV0fSBmcm9tICcuLi8uLi9tZXRhZGF0YS9kaXJlY3RpdmVzJztcbmltcG9ydCB7Y29tcG9uZW50TmVlZHNSZXNvbHV0aW9uLCBtYXliZVF1ZXVlUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9yZXNvdXJjZV9sb2FkaW5nJztcbmltcG9ydCB7Vmlld0VuY2Fwc3VsYXRpb259IGZyb20gJy4uLy4uL21ldGFkYXRhL3ZpZXcnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi90eXBlJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi8uLi91dGlsJztcblxuaW1wb3J0IHthbmd1bGFyQ29yZUVudn0gZnJvbSAnLi9lbnZpcm9ubWVudCc7XG5pbXBvcnQge05HX0NPTVBPTkVOVF9ERUYsIE5HX0RJUkVDVElWRV9ERUZ9IGZyb20gJy4vZmllbGRzJztcbmltcG9ydCB7cGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUsIHRyYW5zaXRpdmVTY29wZXNGb3J9IGZyb20gJy4vbW9kdWxlJztcbmltcG9ydCB7Z2V0UmVmbGVjdCwgcmVmbGVjdERlcGVuZGVuY2llc30gZnJvbSAnLi91dGlsJztcblxudHlwZSBTdHJpbmdNYXAgPSB7XG4gIFtrZXk6IHN0cmluZ106IHN0cmluZ1xufTtcblxuLyoqXG4gKiBDb21waWxlIGFuIEFuZ3VsYXIgY29tcG9uZW50IGFjY29yZGluZyB0byBpdHMgZGVjb3JhdG9yIG1ldGFkYXRhLCBhbmQgcGF0Y2ggdGhlIHJlc3VsdGluZ1xuICogbmdDb21wb25lbnREZWYgb250byB0aGUgY29tcG9uZW50IHR5cGUuXG4gKlxuICogQ29tcGlsYXRpb24gbWF5IGJlIGFzeW5jaHJvbm91cyAoZHVlIHRvIHRoZSBuZWVkIHRvIHJlc29sdmUgVVJMcyBmb3IgdGhlIGNvbXBvbmVudCB0ZW1wbGF0ZSBvclxuICogb3RoZXIgcmVzb3VyY2VzLCBmb3IgZXhhbXBsZSkuIEluIHRoZSBldmVudCB0aGF0IGNvbXBpbGF0aW9uIGlzIG5vdCBpbW1lZGlhdGUsIGBjb21waWxlQ29tcG9uZW50YFxuICogd2lsbCBlbnF1ZXVlIHJlc291cmNlIHJlc29sdXRpb24gaW50byBhIGdsb2JhbCBxdWV1ZSBhbmQgd2lsbCBmYWlsIHRvIHJldHVybiB0aGUgYG5nQ29tcG9uZW50RGVmYFxuICogdW50aWwgdGhlIGdsb2JhbCBxdWV1ZSBoYXMgYmVlbiByZXNvbHZlZCB3aXRoIGEgY2FsbCB0byBgcmVzb2x2ZUNvbXBvbmVudFJlc291cmNlc2AuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlQ29tcG9uZW50KHR5cGU6IFR5cGU8YW55PiwgbWV0YWRhdGE6IENvbXBvbmVudCk6IHZvaWQge1xuICBsZXQgbmdDb21wb25lbnREZWY6IGFueSA9IG51bGw7XG4gIC8vIE1ldGFkYXRhIG1heSBoYXZlIHJlc291cmNlcyB3aGljaCBuZWVkIHRvIGJlIHJlc29sdmVkLlxuICBtYXliZVF1ZXVlUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzKG1ldGFkYXRhKTtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIE5HX0NPTVBPTkVOVF9ERUYsIHtcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChuZ0NvbXBvbmVudERlZiA9PT0gbnVsbCkge1xuICAgICAgICBpZiAoY29tcG9uZW50TmVlZHNSZXNvbHV0aW9uKG1ldGFkYXRhKSkge1xuICAgICAgICAgIGNvbnN0IGVycm9yID0gW2BDb21wb25lbnQgJyR7c3RyaW5naWZ5KHR5cGUpfScgaXMgbm90IHJlc29sdmVkOmBdO1xuICAgICAgICAgIGlmIChtZXRhZGF0YS50ZW1wbGF0ZVVybCkge1xuICAgICAgICAgICAgZXJyb3IucHVzaChgIC0gdGVtcGxhdGVVcmw6ICR7c3RyaW5naWZ5KG1ldGFkYXRhLnRlbXBsYXRlVXJsKX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG1ldGFkYXRhLnN0eWxlVXJscyAmJiBtZXRhZGF0YS5zdHlsZVVybHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBlcnJvci5wdXNoKGAgLSBzdHlsZVVybHM6ICR7SlNPTi5zdHJpbmdpZnkobWV0YWRhdGEuc3R5bGVVcmxzKX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZXJyb3IucHVzaChgRGlkIHlvdSBydW4gYW5kIHdhaXQgZm9yICdyZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzKCknP2ApO1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvci5qb2luKCdcXG4nKSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhlIENvbnN0YW50UG9vbCBpcyBhIHJlcXVpcmVtZW50IG9mIHRoZSBKSVQnZXIuXG4gICAgICAgIGNvbnN0IGNvbnN0YW50UG9vbCA9IG5ldyBDb25zdGFudFBvb2woKTtcblxuICAgICAgICAvLyBQYXJzZSB0aGUgdGVtcGxhdGUgYW5kIGNoZWNrIGZvciBlcnJvcnMuXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gcGFyc2VUZW1wbGF0ZShcbiAgICAgICAgICAgIG1ldGFkYXRhLnRlbXBsYXRlICEsIGBuZzovLyR7c3RyaW5naWZ5KHR5cGUpfS90ZW1wbGF0ZS5odG1sYCwge1xuICAgICAgICAgICAgICBwcmVzZXJ2ZVdoaXRlc3BhY2VzOiBtZXRhZGF0YS5wcmVzZXJ2ZVdoaXRlc3BhY2VzIHx8IGZhbHNlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICcnKTtcbiAgICAgICAgaWYgKHRlbXBsYXRlLmVycm9ycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgY29uc3QgZXJyb3JzID0gdGVtcGxhdGUuZXJyb3JzLm1hcChlcnIgPT4gZXJyLnRvU3RyaW5nKCkpLmpvaW4oJywgJyk7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICBgRXJyb3JzIGR1cmluZyBKSVQgY29tcGlsYXRpb24gb2YgdGVtcGxhdGUgZm9yICR7c3RyaW5naWZ5KHR5cGUpfTogJHtlcnJvcnN9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDb21waWxlIHRoZSBjb21wb25lbnQgbWV0YWRhdGEsIGluY2x1ZGluZyB0ZW1wbGF0ZSwgaW50byBhbiBleHByZXNzaW9uLlxuICAgICAgICAvLyBUT0RPKGFseGh1Yik6IGltcGxlbWVudCBpbnB1dHMsIG91dHB1dHMsIHF1ZXJpZXMsIGV0Yy5cbiAgICAgICAgY29uc3QgcmVzID0gY29tcGlsZVIzQ29tcG9uZW50KFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAuLi5kaXJlY3RpdmVNZXRhZGF0YSh0eXBlLCBtZXRhZGF0YSksXG4gICAgICAgICAgICAgIHRlbXBsYXRlLFxuICAgICAgICAgICAgICBkaXJlY3RpdmVzOiBuZXcgTWFwKCksXG4gICAgICAgICAgICAgIHBpcGVzOiBuZXcgTWFwKCksXG4gICAgICAgICAgICAgIHZpZXdRdWVyaWVzOiBbXSxcbiAgICAgICAgICAgICAgd3JhcERpcmVjdGl2ZXNJbkNsb3N1cmU6IGZhbHNlLFxuICAgICAgICAgICAgICBzdHlsZXM6IG1ldGFkYXRhLnN0eWxlcyB8fCBbXSxcbiAgICAgICAgICAgICAgZW5jYXBzdWxhdGlvbjogbWV0YWRhdGEuZW5jYXBzdWxhdGlvbiB8fCBWaWV3RW5jYXBzdWxhdGlvbi5FbXVsYXRlZCxcbiAgICAgICAgICAgICAgYW5pbWF0aW9uczogbWV0YWRhdGEuYW5pbWF0aW9ucyB8fCBudWxsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29uc3RhbnRQb29sLCBtYWtlQmluZGluZ1BhcnNlcigpKTtcbiAgICAgICAgY29uc3QgcHJlU3RhdGVtZW50cyA9IFsuLi5jb25zdGFudFBvb2wuc3RhdGVtZW50cywgLi4ucmVzLnN0YXRlbWVudHNdO1xuXG4gICAgICAgIG5nQ29tcG9uZW50RGVmID0gaml0RXhwcmVzc2lvbihcbiAgICAgICAgICAgIHJlcy5leHByZXNzaW9uLCBhbmd1bGFyQ29yZUVudiwgYG5nOi8vJHt0eXBlLm5hbWV9L25nQ29tcG9uZW50RGVmLmpzYCwgcHJlU3RhdGVtZW50cyk7XG5cbiAgICAgICAgLy8gSWYgY29tcG9uZW50IGNvbXBpbGF0aW9uIGlzIGFzeW5jLCB0aGVuIHRoZSBATmdNb2R1bGUgYW5ub3RhdGlvbiB3aGljaCBkZWNsYXJlcyB0aGVcbiAgICAgICAgLy8gY29tcG9uZW50IG1heSBleGVjdXRlIGFuZCBzZXQgYW4gbmdTZWxlY3RvclNjb3BlIHByb3BlcnR5IG9uIHRoZSBjb21wb25lbnQgdHlwZS4gVGhpc1xuICAgICAgICAvLyBhbGxvd3MgdGhlIGNvbXBvbmVudCB0byBwYXRjaCBpdHNlbGYgd2l0aCBkaXJlY3RpdmVEZWZzIGZyb20gdGhlIG1vZHVsZSBhZnRlciBpdFxuICAgICAgICAvLyBmaW5pc2hlcyBjb21waWxpbmcuXG4gICAgICAgIGlmIChoYXNTZWxlY3RvclNjb3BlKHR5cGUpKSB7XG4gICAgICAgICAgY29uc3Qgc2NvcGVzID0gdHJhbnNpdGl2ZVNjb3Blc0Zvcih0eXBlLm5nU2VsZWN0b3JTY29wZSk7XG4gICAgICAgICAgcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUobmdDb21wb25lbnREZWYsIHNjb3Blcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBuZ0NvbXBvbmVudERlZjtcbiAgICB9LFxuICAgIC8vIE1ha2UgdGhlIHByb3BlcnR5IGNvbmZpZ3VyYWJsZSBpbiBkZXYgbW9kZSB0byBhbGxvdyBvdmVycmlkaW5nIGluIHRlc3RzXG4gICAgY29uZmlndXJhYmxlOiAhIW5nRGV2TW9kZSxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGhhc1NlbGVjdG9yU2NvcGU8VD4oY29tcG9uZW50OiBUeXBlPFQ+KTogY29tcG9uZW50IGlzIFR5cGU8VD4mXG4gICAge25nU2VsZWN0b3JTY29wZTogVHlwZTxhbnk+fSB7XG4gIHJldHVybiAoY29tcG9uZW50IGFze25nU2VsZWN0b3JTY29wZT86IGFueX0pLm5nU2VsZWN0b3JTY29wZSAhPT0gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIENvbXBpbGUgYW4gQW5ndWxhciBkaXJlY3RpdmUgYWNjb3JkaW5nIHRvIGl0cyBkZWNvcmF0b3IgbWV0YWRhdGEsIGFuZCBwYXRjaCB0aGUgcmVzdWx0aW5nXG4gKiBuZ0RpcmVjdGl2ZURlZiBvbnRvIHRoZSBjb21wb25lbnQgdHlwZS5cbiAqXG4gKiBJbiB0aGUgZXZlbnQgdGhhdCBjb21waWxhdGlvbiBpcyBub3QgaW1tZWRpYXRlLCBgY29tcGlsZURpcmVjdGl2ZWAgd2lsbCByZXR1cm4gYSBgUHJvbWlzZWAgd2hpY2hcbiAqIHdpbGwgcmVzb2x2ZSB3aGVuIGNvbXBpbGF0aW9uIGNvbXBsZXRlcyBhbmQgdGhlIGRpcmVjdGl2ZSBiZWNvbWVzIHVzYWJsZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVEaXJlY3RpdmUodHlwZTogVHlwZTxhbnk+LCBkaXJlY3RpdmU6IERpcmVjdGl2ZSk6IHZvaWQge1xuICBsZXQgbmdEaXJlY3RpdmVEZWY6IGFueSA9IG51bGw7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBOR19ESVJFQ1RJVkVfREVGLCB7XG4gICAgZ2V0OiAoKSA9PiB7XG4gICAgICBpZiAobmdEaXJlY3RpdmVEZWYgPT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgY29uc3RhbnRQb29sID0gbmV3IENvbnN0YW50UG9vbCgpO1xuICAgICAgICBjb25zdCBzb3VyY2VNYXBVcmwgPSBgbmc6Ly8ke3R5cGUgJiYgdHlwZS5uYW1lfS9uZ0RpcmVjdGl2ZURlZi5qc2A7XG4gICAgICAgIGNvbnN0IHJlcyA9IGNvbXBpbGVSM0RpcmVjdGl2ZShcbiAgICAgICAgICAgIGRpcmVjdGl2ZU1ldGFkYXRhKHR5cGUsIGRpcmVjdGl2ZSksIGNvbnN0YW50UG9vbCwgbWFrZUJpbmRpbmdQYXJzZXIoKSk7XG4gICAgICAgIGNvbnN0IHByZVN0YXRlbWVudHMgPSBbLi4uY29uc3RhbnRQb29sLnN0YXRlbWVudHMsIC4uLnJlcy5zdGF0ZW1lbnRzXTtcbiAgICAgICAgbmdEaXJlY3RpdmVEZWYgPSBqaXRFeHByZXNzaW9uKHJlcy5leHByZXNzaW9uLCBhbmd1bGFyQ29yZUVudiwgc291cmNlTWFwVXJsLCBwcmVTdGF0ZW1lbnRzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZ0RpcmVjdGl2ZURlZjtcbiAgICB9LFxuICAgIC8vIE1ha2UgdGhlIHByb3BlcnR5IGNvbmZpZ3VyYWJsZSBpbiBkZXYgbW9kZSB0byBhbGxvdyBvdmVycmlkaW5nIGluIHRlc3RzXG4gICAgY29uZmlndXJhYmxlOiAhIW5nRGV2TW9kZSxcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHRlbmRzRGlyZWN0bHlGcm9tT2JqZWN0KHR5cGU6IFR5cGU8YW55Pik6IGJvb2xlYW4ge1xuICByZXR1cm4gT2JqZWN0LmdldFByb3RvdHlwZU9mKHR5cGUucHJvdG90eXBlKSA9PT0gT2JqZWN0LnByb3RvdHlwZTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHRoZSBgUjNEaXJlY3RpdmVNZXRhZGF0YWAgZm9yIGEgcGFydGljdWxhciBkaXJlY3RpdmUgKGVpdGhlciBhIGBEaXJlY3RpdmVgIG9yIGFcbiAqIGBDb21wb25lbnRgKS5cbiAqL1xuZnVuY3Rpb24gZGlyZWN0aXZlTWV0YWRhdGEodHlwZTogVHlwZTxhbnk+LCBtZXRhZGF0YTogRGlyZWN0aXZlKTogUjNEaXJlY3RpdmVNZXRhZGF0YSB7XG4gIC8vIFJlZmxlY3QgaW5wdXRzIGFuZCBvdXRwdXRzLlxuICBjb25zdCBwcm9wTWV0YWRhdGEgPSBnZXRSZWZsZWN0KCkucHJvcE1ldGFkYXRhKHR5cGUpO1xuXG4gIGNvbnN0IGhvc3QgPSBleHRyYWN0SG9zdEJpbmRpbmdzKG1ldGFkYXRhLCBwcm9wTWV0YWRhdGEpO1xuXG4gIGNvbnN0IGlucHV0c0Zyb21NZXRhZGF0YSA9IHBhcnNlSW5wdXRPdXRwdXRzKG1ldGFkYXRhLmlucHV0cyB8fCBbXSk7XG4gIGNvbnN0IG91dHB1dHNGcm9tTWV0YWRhdGEgPSBwYXJzZUlucHV0T3V0cHV0cyhtZXRhZGF0YS5vdXRwdXRzIHx8IFtdKTtcblxuICBjb25zdCBpbnB1dHNGcm9tVHlwZTogU3RyaW5nTWFwID0ge307XG4gIGNvbnN0IG91dHB1dHNGcm9tVHlwZTogU3RyaW5nTWFwID0ge307XG4gIGZvciAoY29uc3QgZmllbGQgaW4gcHJvcE1ldGFkYXRhKSB7XG4gICAgaWYgKHByb3BNZXRhZGF0YS5oYXNPd25Qcm9wZXJ0eShmaWVsZCkpIHtcbiAgICAgIHByb3BNZXRhZGF0YVtmaWVsZF0uZm9yRWFjaChhbm4gPT4ge1xuICAgICAgICBpZiAoaXNJbnB1dChhbm4pKSB7XG4gICAgICAgICAgaW5wdXRzRnJvbVR5cGVbZmllbGRdID0gYW5uLmJpbmRpbmdQcm9wZXJ0eU5hbWUgfHwgZmllbGQ7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNPdXRwdXQoYW5uKSkge1xuICAgICAgICAgIG91dHB1dHNGcm9tVHlwZVtmaWVsZF0gPSBhbm4uYmluZGluZ1Byb3BlcnR5TmFtZSB8fCBmaWVsZDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiB0eXBlLm5hbWUsXG4gICAgdHlwZTogbmV3IFdyYXBwZWROb2RlRXhwcih0eXBlKSxcbiAgICB0eXBlQXJndW1lbnRDb3VudDogMCxcbiAgICBzZWxlY3RvcjogbWV0YWRhdGEuc2VsZWN0b3IgISxcbiAgICBkZXBzOiByZWZsZWN0RGVwZW5kZW5jaWVzKHR5cGUpLCBob3N0LFxuICAgIGlucHV0czogey4uLmlucHV0c0Zyb21NZXRhZGF0YSwgLi4uaW5wdXRzRnJvbVR5cGV9LFxuICAgIG91dHB1dHM6IHsuLi5vdXRwdXRzRnJvbU1ldGFkYXRhLCAuLi5vdXRwdXRzRnJvbVR5cGV9LFxuICAgIHF1ZXJpZXM6IFtdLFxuICAgIGxpZmVjeWNsZToge1xuICAgICAgdXNlc09uQ2hhbmdlczogdHlwZS5wcm90b3R5cGUubmdPbkNoYW5nZXMgIT09IHVuZGVmaW5lZCxcbiAgICB9LFxuICAgIHR5cGVTb3VyY2VTcGFuOiBudWxsICEsXG4gICAgdXNlc0luaGVyaXRhbmNlOiAhZXh0ZW5kc0RpcmVjdGx5RnJvbU9iamVjdCh0eXBlKSxcbiAgICBleHBvcnRBczogbWV0YWRhdGEuZXhwb3J0QXMgfHwgbnVsbCxcbiAgfTtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdEhvc3RCaW5kaW5ncyhtZXRhZGF0YTogRGlyZWN0aXZlLCBwcm9wTWV0YWRhdGE6IHtba2V5OiBzdHJpbmddOiBhbnlbXX0pOiB7XG4gIGF0dHJpYnV0ZXM6IFN0cmluZ01hcCxcbiAgbGlzdGVuZXJzOiBTdHJpbmdNYXAsXG4gIHByb3BlcnRpZXM6IFN0cmluZ01hcCxcbn0ge1xuICAvLyBGaXJzdCBwYXJzZSB0aGUgZGVjbGFyYXRpb25zIGZyb20gdGhlIG1ldGFkYXRhLlxuICBjb25zdCB7YXR0cmlidXRlcywgbGlzdGVuZXJzLCBwcm9wZXJ0aWVzLCBhbmltYXRpb25zfSA9IHBhcnNlSG9zdEJpbmRpbmdzKG1ldGFkYXRhLmhvc3QgfHwge30pO1xuXG4gIGlmIChPYmplY3Qua2V5cyhhbmltYXRpb25zKS5sZW5ndGggPiAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBBbmltYXRpb24gYmluZGluZ3MgYXJlIGFzLW9mLXlldCB1bnN1cHBvcnRlZCBpbiBJdnlgKTtcbiAgfVxuXG4gIC8vIE5leHQsIGxvb3Agb3ZlciB0aGUgcHJvcGVydGllcyBvZiB0aGUgb2JqZWN0LCBsb29raW5nIGZvciBASG9zdEJpbmRpbmcgYW5kIEBIb3N0TGlzdGVuZXIuXG4gIGZvciAoY29uc3QgZmllbGQgaW4gcHJvcE1ldGFkYXRhKSB7XG4gICAgaWYgKHByb3BNZXRhZGF0YS5oYXNPd25Qcm9wZXJ0eShmaWVsZCkpIHtcbiAgICAgIHByb3BNZXRhZGF0YVtmaWVsZF0uZm9yRWFjaChhbm4gPT4ge1xuICAgICAgICBpZiAoaXNIb3N0QmluZGluZyhhbm4pKSB7XG4gICAgICAgICAgcHJvcGVydGllc1thbm4uaG9zdFByb3BlcnR5TmFtZSB8fCBmaWVsZF0gPSBmaWVsZDtcbiAgICAgICAgfSBlbHNlIGlmIChpc0hvc3RMaXN0ZW5lcihhbm4pKSB7XG4gICAgICAgICAgbGlzdGVuZXJzW2Fubi5ldmVudE5hbWUgfHwgZmllbGRdID0gYCR7ZmllbGR9KCR7KGFubi5hcmdzIHx8IFtdKS5qb2luKCcsJyl9KWA7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7YXR0cmlidXRlcywgbGlzdGVuZXJzLCBwcm9wZXJ0aWVzfTtcbn1cblxuZnVuY3Rpb24gaXNJbnB1dCh2YWx1ZTogYW55KTogdmFsdWUgaXMgSW5wdXQge1xuICByZXR1cm4gdmFsdWUubmdNZXRhZGF0YU5hbWUgPT09ICdJbnB1dCc7XG59XG5cbmZ1bmN0aW9uIGlzT3V0cHV0KHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBPdXRwdXQge1xuICByZXR1cm4gdmFsdWUubmdNZXRhZGF0YU5hbWUgPT09ICdPdXRwdXQnO1xufVxuXG5mdW5jdGlvbiBpc0hvc3RCaW5kaW5nKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBIb3N0QmluZGluZyB7XG4gIHJldHVybiB2YWx1ZS5uZ01ldGFkYXRhTmFtZSA9PT0gJ0hvc3RCaW5kaW5nJztcbn1cblxuZnVuY3Rpb24gaXNIb3N0TGlzdGVuZXIodmFsdWU6IGFueSk6IHZhbHVlIGlzIEhvc3RMaXN0ZW5lciB7XG4gIHJldHVybiB2YWx1ZS5uZ01ldGFkYXRhTmFtZSA9PT0gJ0hvc3RMaXN0ZW5lcic7XG59XG5cbmZ1bmN0aW9uIHBhcnNlSW5wdXRPdXRwdXRzKHZhbHVlczogc3RyaW5nW10pOiBTdHJpbmdNYXAge1xuICByZXR1cm4gdmFsdWVzLnJlZHVjZShcbiAgICAgIChtYXAsIHZhbHVlKSA9PiB7XG4gICAgICAgIGNvbnN0IFtmaWVsZCwgcHJvcGVydHldID0gdmFsdWUuc3BsaXQoJywnKS5tYXAocGllY2UgPT4gcGllY2UudHJpbSgpKTtcbiAgICAgICAgbWFwW2ZpZWxkXSA9IHByb3BlcnR5IHx8IGZpZWxkO1xuICAgICAgICByZXR1cm4gbWFwO1xuICAgICAgfSxcbiAgICAgIHt9IGFzIFN0cmluZ01hcCk7XG59XG4iXX0=