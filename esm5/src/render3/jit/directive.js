/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { ConstantPool, WrappedNodeExpr, compileComponentFromMetadata as compileR3Component, compileDirectiveFromMetadata as compileR3Directive, jitExpression, makeBindingParser, parseTemplate } from '@angular/compiler';
import { angularCoreEnv } from './environment';
import { getReflect, reflectDependencies } from './util';
var _pendingPromises = [];
/**
 * Compile an Angular component according to its decorator metadata, and patch the resulting
 * ngComponentDef onto the component type.
 *
 * Compilation may be asynchronous (due to the need to resolve URLs for the component template or
 * other resources, for example). In the event that compilation is not immediate, `compileComponent`
 * will return a `Promise` which will resolve when compilation completes and the component becomes
 * usable.
 */
export function compileComponent(type, metadata) {
    // TODO(alxhub): implement ResourceLoader support for template compilation.
    if (!metadata.template) {
        throw new Error('templateUrl not yet supported');
    }
    var templateStr = metadata.template;
    var def = null;
    Object.defineProperty(type, 'ngComponentDef', {
        get: function () {
            if (def === null) {
                // The ConstantPool is a requirement of the JIT'er.
                var constantPool = new ConstantPool();
                // Parse the template and check for errors.
                var template = parseTemplate(templateStr, "ng://" + type.name + "/template.html");
                if (template.errors !== undefined) {
                    var errors = template.errors.map(function (err) { return err.toString(); }).join(', ');
                    throw new Error("Errors during JIT compilation of template for " + type.name + ": " + errors);
                }
                // Compile the component metadata, including template, into an expression.
                // TODO(alxhub): implement inputs, outputs, queries, etc.
                var res = compileR3Component(tslib_1.__assign({}, directiveMetadata(type, metadata), { template: template, directives: new Map(), pipes: new Map(), viewQueries: [] }), constantPool, makeBindingParser());
                def = jitExpression(res.expression, angularCoreEnv, "ng://" + type.name + "/ngComponentDef.js", constantPool);
            }
            return def;
        },
    });
    return null;
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
    Object.defineProperty(type, 'ngDirectiveDef', {
        get: function () {
            if (def === null) {
                var constantPool = new ConstantPool();
                var sourceMapUrl = "ng://" + (type && type.name) + "/ngDirectiveDef.js";
                var res = compileR3Directive(directiveMetadata(type, directive), constantPool, makeBindingParser());
                def = jitExpression(res.expression, angularCoreEnv, sourceMapUrl, constantPool);
            }
            return def;
        },
    });
    return null;
}
/**
 * A wrapper around `compileComponent` which is intended to be used for the `@Component` decorator.
 *
 * This wrapper keeps track of the `Promise` returned by `compileComponent` and will cause
 * `awaitCurrentlyCompilingComponents` to wait on the compilation to be finished.
 */
export function compileComponentDecorator(type, metadata) {
    var res = compileComponent(type, metadata);
    if (res !== null) {
        _pendingPromises.push(res);
    }
}
/**
 * Returns a promise which will await the compilation of any `@Component`s which have been defined
 * since the last time `awaitCurrentlyCompilingComponents` was called.
 */
export function awaitCurrentlyCompilingComponents() {
    var res = Promise.all(_pendingPromises).then(function () { return undefined; });
    _pendingPromises = [];
    return res;
}
/**
 * Extract the `R3DirectiveMetadata` for a particular directive (either a `Directive` or a
 * `Component`).
 */
function directiveMetadata(type, metadata) {
    // Reflect inputs and outputs.
    var props = getReflect().propMetadata(type);
    var inputs = {};
    var outputs = {};
    var _loop_1 = function (field) {
        props[field].forEach(function (ann) {
            if (isInput(ann)) {
                inputs[field] = ann.bindingPropertyName || field;
            }
            else if (isOutput(ann)) {
                outputs[field] = ann.bindingPropertyName || field;
            }
        });
    };
    for (var field in props) {
        _loop_1(field);
    }
    return {
        name: type.name,
        type: new WrappedNodeExpr(type),
        selector: metadata.selector,
        deps: reflectDependencies(type),
        host: {
            attributes: {},
            listeners: {},
            properties: {},
        },
        inputs: inputs,
        outputs: outputs,
        queries: [],
        lifecycle: {
            usesOnChanges: type.prototype.ngOnChanges !== undefined,
        },
        typeSourceSpan: null,
    };
}
function isInput(value) {
    return value.ngMetadataName === 'Input';
}
function isOutput(value) {
    return value.ngMetadataName === 'Output';
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUF1QixlQUFlLEVBQUUsNEJBQTRCLElBQUksa0JBQWtCLEVBQUUsNEJBQTRCLElBQUksa0JBQWtCLEVBQUUsYUFBYSxFQUFFLGlCQUFpQixFQUFFLGFBQWEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBTTlPLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDN0MsT0FBTyxFQUFDLFVBQVUsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUV2RCxJQUFJLGdCQUFnQixHQUFvQixFQUFFLENBQUM7QUFFM0M7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLDJCQUEyQixJQUFlLEVBQUUsUUFBbUI7SUFDbkUsMkVBQTJFO0lBQzNFLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFO1FBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQUMsK0JBQStCLENBQUMsQ0FBQztLQUNsRDtJQUNELElBQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUM7SUFFdEMsSUFBSSxHQUFHLEdBQVEsSUFBSSxDQUFDO0lBQ3BCLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1FBQzVDLEdBQUcsRUFBRTtZQUNILElBQUksR0FBRyxLQUFLLElBQUksRUFBRTtnQkFDaEIsbURBQW1EO2dCQUNuRCxJQUFNLFlBQVksR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO2dCQUV4QywyQ0FBMkM7Z0JBQzNDLElBQU0sUUFBUSxHQUFHLGFBQWEsQ0FBQyxXQUFXLEVBQUUsVUFBUSxJQUFJLENBQUMsSUFBSSxtQkFBZ0IsQ0FBQyxD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cHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDb25zdGFudFBvb2wsIFIzRGlyZWN0aXZlTWV0YWRhdGEsIFdyYXBwZWROb2RlRXhwciwgY29tcGlsZUNvbXBvbmVudEZyb21NZXRhZGF0YSBhcyBjb21waWxlUjNDb21wb25lbnQsIGNvbXBpbGVEaXJlY3RpdmVGcm9tTWV0YWRhdGEgYXMgY29tcGlsZVIzRGlyZWN0aXZlLCBqaXRFeHByZXNzaW9uLCBtYWtlQmluZGluZ1BhcnNlciwgcGFyc2VUZW1wbGF0ZX0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuXG5pbXBvcnQge0NvbXBvbmVudCwgRGlyZWN0aXZlLCBIb3N0QmluZGluZywgSW5wdXQsIE91dHB1dH0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvZGlyZWN0aXZlcyc7XG5pbXBvcnQge1JlZmxlY3Rpb25DYXBhYmlsaXRpZXN9IGZyb20gJy4uLy4uL3JlZmxlY3Rpb24vcmVmbGVjdGlvbl9jYXBhYmlsaXRpZXMnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi90eXBlJztcblxuaW1wb3J0IHthbmd1bGFyQ29yZUVudn0gZnJvbSAnLi9lbnZpcm9ubWVudCc7XG5pbXBvcnQge2dldFJlZmxlY3QsIHJlZmxlY3REZXBlbmRlbmNpZXN9IGZyb20gJy4vdXRpbCc7XG5cbmxldCBfcGVuZGluZ1Byb21pc2VzOiBQcm9taXNlPHZvaWQ+W10gPSBbXTtcblxuLyoqXG4gKiBDb21waWxlIGFuIEFuZ3VsYXIgY29tcG9uZW50IGFjY29yZGluZyB0byBpdHMgZGVjb3JhdG9yIG1ldGFkYXRhLCBhbmQgcGF0Y2ggdGhlIHJlc3VsdGluZ1xuICogbmdDb21wb25lbnREZWYgb250byB0aGUgY29tcG9uZW50IHR5cGUuXG4gKlxuICogQ29tcGlsYXRpb24gbWF5IGJlIGFzeW5jaHJvbm91cyAoZHVlIHRvIHRoZSBuZWVkIHRvIHJlc29sdmUgVVJMcyBmb3IgdGhlIGNvbXBvbmVudCB0ZW1wbGF0ZSBvclxuICogb3RoZXIgcmVzb3VyY2VzLCBmb3IgZXhhbXBsZSkuIEluIHRoZSBldmVudCB0aGF0IGNvbXBpbGF0aW9uIGlzIG5vdCBpbW1lZGlhdGUsIGBjb21waWxlQ29tcG9uZW50YFxuICogd2lsbCByZXR1cm4gYSBgUHJvbWlzZWAgd2hpY2ggd2lsbCByZXNvbHZlIHdoZW4gY29tcGlsYXRpb24gY29tcGxldGVzIGFuZCB0aGUgY29tcG9uZW50IGJlY29tZXNcbiAqIHVzYWJsZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVDb21wb25lbnQodHlwZTogVHlwZTxhbnk+LCBtZXRhZGF0YTogQ29tcG9uZW50KTogUHJvbWlzZTx2b2lkPnxudWxsIHtcbiAgLy8gVE9ETyhhbHhodWIpOiBpbXBsZW1lbnQgUmVzb3VyY2VMb2FkZXIgc3VwcG9ydCBmb3IgdGVtcGxhdGUgY29tcGlsYXRpb24uXG4gIGlmICghbWV0YWRhdGEudGVtcGxhdGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3RlbXBsYXRlVXJsIG5vdCB5ZXQgc3VwcG9ydGVkJyk7XG4gIH1cbiAgY29uc3QgdGVtcGxhdGVTdHIgPSBtZXRhZGF0YS50ZW1wbGF0ZTtcblxuICBsZXQgZGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgJ25nQ29tcG9uZW50RGVmJywge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKGRlZiA9PT0gbnVsbCkge1xuICAgICAgICAvLyBUaGUgQ29uc3RhbnRQb29sIGlzIGEgcmVxdWlyZW1lbnQgb2YgdGhlIEpJVCdlci5cbiAgICAgICAgY29uc3QgY29uc3RhbnRQb29sID0gbmV3IENvbnN0YW50UG9vbCgpO1xuXG4gICAgICAgIC8vIFBhcnNlIHRoZSB0ZW1wbGF0ZSBhbmQgY2hlY2sgZm9yIGVycm9ycy5cbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBwYXJzZVRlbXBsYXRlKHRlbXBsYXRlU3RyLCBgbmc6Ly8ke3R5cGUubmFtZX0vdGVtcGxhdGUuaHRtbGApO1xuICAgICAgICBpZiAodGVtcGxhdGUuZXJyb3JzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBjb25zdCBlcnJvcnMgPSB0ZW1wbGF0ZS5lcnJvcnMubWFwKGVyciA9PiBlcnIudG9TdHJpbmcoKSkuam9pbignLCAnKTtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9ycyBkdXJpbmcgSklUIGNvbXBpbGF0aW9uIG9mIHRlbXBsYXRlIGZvciAke3R5cGUubmFtZX06ICR7ZXJyb3JzfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ29tcGlsZSB0aGUgY29tcG9uZW50IG1ldGFkYXRhLCBpbmNsdWRpbmcgdGVtcGxhdGUsIGludG8gYW4gZXhwcmVzc2lvbi5cbiAgICAgICAgLy8gVE9ETyhhbHhodWIpOiBpbXBsZW1lbnQgaW5wdXRzLCBvdXRwdXRzLCBxdWVyaWVzLCBldGMuXG4gICAgICAgIGNvbnN0IHJlcyA9IGNvbXBpbGVSM0NvbXBvbmVudChcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgLi4uZGlyZWN0aXZlTWV0YWRhdGEodHlwZSwgbWV0YWRhdGEpLFxuICAgICAgICAgICAgICB0ZW1wbGF0ZSxcbiAgICAgICAgICAgICAgZGlyZWN0aXZlczogbmV3IE1hcCgpLFxuICAgICAgICAgICAgICBwaXBlczogbmV3IE1hcCgpLFxuICAgICAgICAgICAgICB2aWV3UXVlcmllczogW10sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29uc3RhbnRQb29sLCBtYWtlQmluZGluZ1BhcnNlcigpKTtcblxuICAgICAgICBkZWYgPSBqaXRFeHByZXNzaW9uKFxuICAgICAgICAgICAgcmVzLmV4cHJlc3Npb24sIGFuZ3VsYXJDb3JlRW52LCBgbmc6Ly8ke3R5cGUubmFtZX0vbmdDb21wb25lbnREZWYuanNgLCBjb25zdGFudFBvb2wpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRlZjtcbiAgICB9LFxuICB9KTtcblxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBDb21waWxlIGFuIEFuZ3VsYXIgZGlyZWN0aXZlIGFjY29yZGluZyB0byBpdHMgZGVjb3JhdG9yIG1ldGFkYXRhLCBhbmQgcGF0Y2ggdGhlIHJlc3VsdGluZ1xuICogbmdEaXJlY3RpdmVEZWYgb250byB0aGUgY29tcG9uZW50IHR5cGUuXG4gKlxuICogSW4gdGhlIGV2ZW50IHRoYXQgY29tcGlsYXRpb24gaXMgbm90IGltbWVkaWF0ZSwgYGNvbXBpbGVEaXJlY3RpdmVgIHdpbGwgcmV0dXJuIGEgYFByb21pc2VgIHdoaWNoXG4gKiB3aWxsIHJlc29sdmUgd2hlbiBjb21waWxhdGlvbiBjb21wbGV0ZXMgYW5kIHRoZSBkaXJlY3RpdmUgYmVjb21lcyB1c2FibGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlRGlyZWN0aXZlKHR5cGU6IFR5cGU8YW55PiwgZGlyZWN0aXZlOiBEaXJlY3RpdmUpOiBQcm9taXNlPHZvaWQ+fG51bGwge1xuICBsZXQgZGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgJ25nRGlyZWN0aXZlRGVmJywge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKGRlZiA9PT0gbnVsbCkge1xuICAgICAgICBjb25zdCBjb25zdGFudFBvb2wgPSBuZXcgQ29uc3RhbnRQb29sKCk7XG4gICAgICAgIGNvbnN0IHNvdXJjZU1hcFVybCA9IGBuZzovLyR7dHlwZSAmJiB0eXBlLm5hbWV9L25nRGlyZWN0aXZlRGVmLmpzYDtcbiAgICAgICAgY29uc3QgcmVzID0gY29tcGlsZVIzRGlyZWN0aXZlKFxuICAgICAgICAgICAgZGlyZWN0aXZlTWV0YWRhdGEodHlwZSwgZGlyZWN0aXZlKSwgY29uc3RhbnRQb29sLCBtYWtlQmluZGluZ1BhcnNlcigpKTtcbiAgICAgICAgZGVmID0gaml0RXhwcmVzc2lvbihyZXMuZXhwcmVzc2lvbiwgYW5ndWxhckNvcmVFbnYsIHNvdXJjZU1hcFVybCwgY29uc3RhbnRQb29sKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZWY7XG4gICAgfSxcbiAgfSk7XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEEgd3JhcHBlciBhcm91bmQgYGNvbXBpbGVDb21wb25lbnRgIHdoaWNoIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgZm9yIHRoZSBgQENvbXBvbmVudGAgZGVjb3JhdG9yLlxuICpcbiAqIFRoaXMgd3JhcHBlciBrZWVwcyB0cmFjayBvZiB0aGUgYFByb21pc2VgIHJldHVybmVkIGJ5IGBjb21waWxlQ29tcG9uZW50YCBhbmQgd2lsbCBjYXVzZVxuICogYGF3YWl0Q3VycmVudGx5Q29tcGlsaW5nQ29tcG9uZW50c2AgdG8gd2FpdCBvbiB0aGUgY29tcGlsYXRpb24gdG8gYmUgZmluaXNoZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlQ29tcG9uZW50RGVjb3JhdG9yKHR5cGU6IFR5cGU8YW55PiwgbWV0YWRhdGE6IENvbXBvbmVudCk6IHZvaWQge1xuICBjb25zdCByZXMgPSBjb21waWxlQ29tcG9uZW50KHR5cGUsIG1ldGFkYXRhKTtcbiAgaWYgKHJlcyAhPT0gbnVsbCkge1xuICAgIF9wZW5kaW5nUHJvbWlzZXMucHVzaChyZXMpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhIHByb21pc2Ugd2hpY2ggd2lsbCBhd2FpdCB0aGUgY29tcGlsYXRpb24gb2YgYW55IGBAQ29tcG9uZW50YHMgd2hpY2ggaGF2ZSBiZWVuIGRlZmluZWRcbiAqIHNpbmNlIHRoZSBsYXN0IHRpbWUgYGF3YWl0Q3VycmVudGx5Q29tcGlsaW5nQ29tcG9uZW50c2Agd2FzIGNhbGxlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF3YWl0Q3VycmVudGx5Q29tcGlsaW5nQ29tcG9uZW50cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgcmVzID0gUHJvbWlzZS5hbGwoX3BlbmRpbmdQcm9taXNlcykudGhlbigoKSA9PiB1bmRlZmluZWQpO1xuICBfcGVuZGluZ1Byb21pc2VzID0gW107XG4gIHJldHVybiByZXM7XG59XG5cbi8qKlxuICogRXh0cmFjdCB0aGUgYFIzRGlyZWN0aXZlTWV0YWRhdGFgIGZvciBhIHBhcnRpY3VsYXIgZGlyZWN0aXZlIChlaXRoZXIgYSBgRGlyZWN0aXZlYCBvciBhXG4gKiBgQ29tcG9uZW50YCkuXG4gKi9cbmZ1bmN0aW9uIGRpcmVjdGl2ZU1ldGFkYXRhKHR5cGU6IFR5cGU8YW55PiwgbWV0YWRhdGE6IERpcmVjdGl2ZSk6IFIzRGlyZWN0aXZlTWV0YWRhdGEge1xuICAvLyBSZWZsZWN0IGlucHV0cyBhbmQgb3V0cHV0cy5cbiAgY29uc3QgcHJvcHMgPSBnZXRSZWZsZWN0KCkucHJvcE1ldGFkYXRhKHR5cGUpO1xuICBjb25zdCBpbnB1dHM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG4gIGNvbnN0IG91dHB1dHM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG5cbiAgZm9yIChsZXQgZmllbGQgaW4gcHJvcHMpIHtcbiAgICBwcm9wc1tmaWVsZF0uZm9yRWFjaChhbm4gPT4ge1xuICAgICAgaWYgKGlzSW5wdXQoYW5uKSkge1xuICAgICAgICBpbnB1dHNbZmllbGRdID0gYW5uLmJpbmRpbmdQcm9wZXJ0eU5hbWUgfHwgZmllbGQ7XG4gICAgICB9IGVsc2UgaWYgKGlzT3V0cHV0KGFubikpIHtcbiAgICAgICAgb3V0cHV0c1tmaWVsZF0gPSBhbm4uYmluZGluZ1Byb3BlcnR5TmFtZSB8fCBmaWVsZDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgbmFtZTogdHlwZS5uYW1lLFxuICAgIHR5cGU6IG5ldyBXcmFwcGVkTm9kZUV4cHIodHlwZSksXG4gICAgc2VsZWN0b3I6IG1ldGFkYXRhLnNlbGVjdG9yICEsXG4gICAgZGVwczogcmVmbGVjdERlcGVuZGVuY2llcyh0eXBlKSxcbiAgICBob3N0OiB7XG4gICAgICBhdHRyaWJ1dGVzOiB7fSxcbiAgICAgIGxpc3RlbmVyczoge30sXG4gICAgICBwcm9wZXJ0aWVzOiB7fSxcbiAgICB9LFxuICAgIGlucHV0cyxcbiAgICBvdXRwdXRzLFxuICAgIHF1ZXJpZXM6IFtdLFxuICAgIGxpZmVjeWNsZToge1xuICAgICAgdXNlc09uQ2hhbmdlczogdHlwZS5wcm90b3R5cGUubmdPbkNoYW5nZXMgIT09IHVuZGVmaW5lZCxcbiAgICB9LFxuICAgIHR5cGVTb3VyY2VTcGFuOiBudWxsICEsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGlzSW5wdXQodmFsdWU6IGFueSk6IHZhbHVlIGlzIElucHV0IHtcbiAgcmV0dXJuIHZhbHVlLm5nTWV0YWRhdGFOYW1lID09PSAnSW5wdXQnO1xufVxuXG5mdW5jdGlvbiBpc091dHB1dCh2YWx1ZTogYW55KTogdmFsdWUgaXMgT3V0cHV0IHtcbiAgcmV0dXJuIHZhbHVlLm5nTWV0YWRhdGFOYW1lID09PSAnT3V0cHV0Jztcbn1cbiJdfQ==