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
import { NG_COMPONENT_DEF, NG_DIRECTIVE_DEF } from './fields';
import { patchComponentDefWithScope } from './module';
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
    Object.defineProperty(type, NG_COMPONENT_DEF, {
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
    return null;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUF1QixlQUFlLEVBQUUsNEJBQTRCLElBQUksa0JBQWtCLEVBQUUsNEJBQTRCLElBQUksa0JBQWtCLEVBQUUsYUFBYSxFQUFFLGlCQUFpQixFQUFFLGFBQWEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBTTlPLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDN0MsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVELE9BQU8sRUFBQywwQkFBMEIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNwRCxPQUFPLEVBQUMsVUFBVSxFQUFFLG1CQUFtQixFQUFDLE1BQU0sUUFBUSxDQUFDO0FBRXZELElBQUksZ0JBQWdCLEdBQW9CLEVBQUUsQ0FBQztBQUUzQzs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sMkJBQTJCLElBQWUsRUFBRSxRQUFtQjtJQUNuRSwyRUFBMkU7SUFDM0UsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUN2QixNQUFNLElBQUksS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUNELElBQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUM7SUFFdEMsSUFBSSxHQUFHLEdBQVEsSUFBSSxDQUFDO0lBQ3BCLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1FBQzVDLEdBQUcsRUFBRTtZQUNILEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dC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YjtJQUVELE1BQU0sQ0FBQztRQUNMLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtRQUNmLElBQUksRUFBRSxJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUM7UUFDL0IsUUFBUSxFQUFFLFFBQVEsQ0FBQyxRQUFVO1FBQzdCLElBQUksRUFBRSxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7UUFDL0IsSUFBSSxFQUFFO1lBQ0osVUFBVSxFQUFFLEVBQUU7WUFDZCxTQUFTLEVBQUUsRUFBRTtZQUNiLFVBQVUsRUFBRSxFQUFFO1NBQ2Y7UUFDRCxNQUFNLFFBQUE7UUFDTixPQUFPLFNBQUE7UUFDUCxPQUFPLEVBQUUsRUFBRTtRQUNYLFNBQVMsRUFBRTtZQUNULGFBQWEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsS0FBSyxTQUFTO1NBQ3hEO1FBQ0QsY0FBYyxFQUFFLElBQU07S0FDdkIsQ0FBQztBQUNKLENBQUM7QUFFRCxpQkFBaUIsS0FBVTtJQUN6QixNQUFNLENBQUMsS0FBSyxDQUFDLGNBQWMsS0FBSyxPQUFPLENBQUM7QUFDMUMsQ0FBQztBQUVELGtCQUFrQixLQUFVO0lBQzFCLE1BQU0sQ0FBQyxLQUFLLENBQUMsY0FBYyxLQUFLLFFBQVEsQ0FBQztBQUMzQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NvbnN0YW50UG9vbCwgUjNEaXJlY3RpdmVNZXRhZGF0YSwgV3JhcHBlZE5vZGVFeHByLCBjb21waWxlQ29tcG9uZW50RnJvbU1ldGFkYXRhIGFzIGNvbXBpbGVSM0NvbXBvbmVudCwgY29tcGlsZURpcmVjdGl2ZUZyb21NZXRhZGF0YSBhcyBjb21waWxlUjNEaXJlY3RpdmUsIGppdEV4cHJlc3Npb24sIG1ha2VCaW5kaW5nUGFyc2VyLCBwYXJzZVRlbXBsYXRlfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5cbmltcG9ydCB7Q29tcG9uZW50LCBEaXJlY3RpdmUsIEhvc3RCaW5kaW5nLCBJbnB1dCwgT3V0cHV0fSBmcm9tICcuLi8uLi9tZXRhZGF0YS9kaXJlY3RpdmVzJztcbmltcG9ydCB7UmVmbGVjdGlvbkNhcGFiaWxpdGllc30gZnJvbSAnLi4vLi4vcmVmbGVjdGlvbi9yZWZsZWN0aW9uX2NhcGFiaWxpdGllcyc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL3R5cGUnO1xuXG5pbXBvcnQge2FuZ3VsYXJDb3JlRW52fSBmcm9tICcuL2Vudmlyb25tZW50JztcbmltcG9ydCB7TkdfQ09NUE9ORU5UX0RFRiwgTkdfRElSRUNUSVZFX0RFRn0gZnJvbSAnLi9maWVsZHMnO1xuaW1wb3J0IHtwYXRjaENvbXBvbmVudERlZldpdGhTY29wZX0gZnJvbSAnLi9tb2R1bGUnO1xuaW1wb3J0IHtnZXRSZWZsZWN0LCByZWZsZWN0RGVwZW5kZW5jaWVzfSBmcm9tICcuL3V0aWwnO1xuXG5sZXQgX3BlbmRpbmdQcm9taXNlczogUHJvbWlzZTx2b2lkPltdID0gW107XG5cbi8qKlxuICogQ29tcGlsZSBhbiBBbmd1bGFyIGNvbXBvbmVudCBhY2NvcmRpbmcgdG8gaXRzIGRlY29yYXRvciBtZXRhZGF0YSwgYW5kIHBhdGNoIHRoZSByZXN1bHRpbmdcbiAqIG5nQ29tcG9uZW50RGVmIG9udG8gdGhlIGNvbXBvbmVudCB0eXBlLlxuICpcbiAqIENvbXBpbGF0aW9uIG1heSBiZSBhc3luY2hyb25vdXMgKGR1ZSB0byB0aGUgbmVlZCB0byByZXNvbHZlIFVSTHMgZm9yIHRoZSBjb21wb25lbnQgdGVtcGxhdGUgb3JcbiAqIG90aGVyIHJlc291cmNlcywgZm9yIGV4YW1wbGUpLiBJbiB0aGUgZXZlbnQgdGhhdCBjb21waWxhdGlvbiBpcyBub3QgaW1tZWRpYXRlLCBgY29tcGlsZUNvbXBvbmVudGBcbiAqIHdpbGwgcmV0dXJuIGEgYFByb21pc2VgIHdoaWNoIHdpbGwgcmVzb2x2ZSB3aGVuIGNvbXBpbGF0aW9uIGNvbXBsZXRlcyBhbmQgdGhlIGNvbXBvbmVudCBiZWNvbWVzXG4gKiB1c2FibGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlQ29tcG9uZW50KHR5cGU6IFR5cGU8YW55PiwgbWV0YWRhdGE6IENvbXBvbmVudCk6IFByb21pc2U8dm9pZD58bnVsbCB7XG4gIC8vIFRPRE8oYWx4aHViKTogaW1wbGVtZW50IFJlc291cmNlTG9hZGVyIHN1cHBvcnQgZm9yIHRlbXBsYXRlIGNvbXBpbGF0aW9uLlxuICBpZiAoIW1ldGFkYXRhLnRlbXBsYXRlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd0ZW1wbGF0ZVVybCBub3QgeWV0IHN1cHBvcnRlZCcpO1xuICB9XG4gIGNvbnN0IHRlbXBsYXRlU3RyID0gbWV0YWRhdGEudGVtcGxhdGU7XG5cbiAgbGV0IGRlZjogYW55ID0gbnVsbDtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIE5HX0NPTVBPTkVOVF9ERUYsIHtcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChkZWYgPT09IG51bGwpIHtcbiAgICAgICAgLy8gVGhlIENvbnN0YW50UG9vbCBpcyBhIHJlcXVpcmVtZW50IG9mIHRoZSBKSVQnZXIuXG4gICAgICAgIGNvbnN0IGNvbnN0YW50UG9vbCA9IG5ldyBDb25zdGFudFBvb2woKTtcblxuICAgICAgICAvLyBQYXJzZSB0aGUgdGVtcGxhdGUgYW5kIGNoZWNrIGZvciBlcnJvcnMuXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gcGFyc2VUZW1wbGF0ZSh0ZW1wbGF0ZVN0ciwgYG5nOi8vJHt0eXBlLm5hbWV9L3RlbXBsYXRlLmh0bWxgKTtcbiAgICAgICAgaWYgKHRlbXBsYXRlLmVycm9ycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgY29uc3QgZXJyb3JzID0gdGVtcGxhdGUuZXJyb3JzLm1hcChlcnIgPT4gZXJyLnRvU3RyaW5nKCkpLmpvaW4oJywgJyk7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvcnMgZHVyaW5nIEpJVCBjb21waWxhdGlvbiBvZiB0ZW1wbGF0ZSBmb3IgJHt0eXBlLm5hbWV9OiAke2Vycm9yc31gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENvbXBpbGUgdGhlIGNvbXBvbmVudCBtZXRhZGF0YSwgaW5jbHVkaW5nIHRlbXBsYXRlLCBpbnRvIGFuIGV4cHJlc3Npb24uXG4gICAgICAgIC8vIFRPRE8oYWx4aHViKTogaW1wbGVtZW50IGlucHV0cywgb3V0cHV0cywgcXVlcmllcywgZXRjLlxuICAgICAgICBjb25zdCByZXMgPSBjb21waWxlUjNDb21wb25lbnQoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIC4uLmRpcmVjdGl2ZU1ldGFkYXRhKHR5cGUsIG1ldGFkYXRhKSxcbiAgICAgICAgICAgICAgdGVtcGxhdGUsXG4gICAgICAgICAgICAgIGRpcmVjdGl2ZXM6IG5ldyBNYXAoKSxcbiAgICAgICAgICAgICAgcGlwZXM6IG5ldyBNYXAoKSxcbiAgICAgICAgICAgICAgdmlld1F1ZXJpZXM6IFtdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbnN0YW50UG9vbCwgbWFrZUJpbmRpbmdQYXJzZXIoKSk7XG5cbiAgICAgICAgZGVmID0gaml0RXhwcmVzc2lvbihcbiAgICAgICAgICAgIHJlcy5leHByZXNzaW9uLCBhbmd1bGFyQ29yZUVudiwgYG5nOi8vJHt0eXBlLm5hbWV9L25nQ29tcG9uZW50RGVmLmpzYCwgY29uc3RhbnRQb29sKTtcblxuICAgICAgICAvLyBJZiBjb21wb25lbnQgY29tcGlsYXRpb24gaXMgYXN5bmMsIHRoZW4gdGhlIEBOZ01vZHVsZSBhbm5vdGF0aW9uIHdoaWNoIGRlY2xhcmVzIHRoZVxuICAgICAgICAvLyBjb21wb25lbnQgbWF5IGV4ZWN1dGUgYW5kIHNldCBhbiBuZ1NlbGVjdG9yU2NvcGUgcHJvcGVydHkgb24gdGhlIGNvbXBvbmVudCB0eXBlLiBUaGlzXG4gICAgICAgIC8vIGFsbG93cyB0aGUgY29tcG9uZW50IHRvIHBhdGNoIGl0c2VsZiB3aXRoIGRpcmVjdGl2ZURlZnMgZnJvbSB0aGUgbW9kdWxlIGFmdGVyIGl0IGZpbmlzaGVzXG4gICAgICAgIC8vIGNvbXBpbGluZy5cbiAgICAgICAgaWYgKGhhc1NlbGVjdG9yU2NvcGUodHlwZSkpIHtcbiAgICAgICAgICBwYXRjaENvbXBvbmVudERlZldpdGhTY29wZShkZWYsIHR5cGUubmdTZWxlY3RvclNjb3BlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGRlZjtcbiAgICB9LFxuICB9KTtcblxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gaGFzU2VsZWN0b3JTY29wZTxUPihjb21wb25lbnQ6IFR5cGU8VD4pOiBjb21wb25lbnQgaXMgVHlwZTxUPiZcbiAgICB7bmdTZWxlY3RvclNjb3BlOiBUeXBlPGFueT59IHtcbiAgcmV0dXJuIChjb21wb25lbnQgYXN7bmdTZWxlY3RvclNjb3BlPzogYW55fSkubmdTZWxlY3RvclNjb3BlICE9PSB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogQ29tcGlsZSBhbiBBbmd1bGFyIGRpcmVjdGl2ZSBhY2NvcmRpbmcgdG8gaXRzIGRlY29yYXRvciBtZXRhZGF0YSwgYW5kIHBhdGNoIHRoZSByZXN1bHRpbmdcbiAqIG5nRGlyZWN0aXZlRGVmIG9udG8gdGhlIGNvbXBvbmVudCB0eXBlLlxuICpcbiAqIEluIHRoZSBldmVudCB0aGF0IGNvbXBpbGF0aW9uIGlzIG5vdCBpbW1lZGlhdGUsIGBjb21waWxlRGlyZWN0aXZlYCB3aWxsIHJldHVybiBhIGBQcm9taXNlYCB3aGljaFxuICogd2lsbCByZXNvbHZlIHdoZW4gY29tcGlsYXRpb24gY29tcGxldGVzIGFuZCB0aGUgZGlyZWN0aXZlIGJlY29tZXMgdXNhYmxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZURpcmVjdGl2ZSh0eXBlOiBUeXBlPGFueT4sIGRpcmVjdGl2ZTogRGlyZWN0aXZlKTogUHJvbWlzZTx2b2lkPnxudWxsIHtcbiAgbGV0IGRlZjogYW55ID0gbnVsbDtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIE5HX0RJUkVDVElWRV9ERUYsIHtcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChkZWYgPT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgY29uc3RhbnRQb29sID0gbmV3IENvbnN0YW50UG9vbCgpO1xuICAgICAgICBjb25zdCBzb3VyY2VNYXBVcmwgPSBgbmc6Ly8ke3R5cGUgJiYgdHlwZS5uYW1lfS9uZ0RpcmVjdGl2ZURlZi5qc2A7XG4gICAgICAgIGNvbnN0IHJlcyA9IGNvbXBpbGVSM0RpcmVjdGl2ZShcbiAgICAgICAgICAgIGRpcmVjdGl2ZU1ldGFkYXRhKHR5cGUsIGRpcmVjdGl2ZSksIGNvbnN0YW50UG9vbCwgbWFrZUJpbmRpbmdQYXJzZXIoKSk7XG4gICAgICAgIGRlZiA9IGppdEV4cHJlc3Npb24ocmVzLmV4cHJlc3Npb24sIGFuZ3VsYXJDb3JlRW52LCBzb3VyY2VNYXBVcmwsIGNvbnN0YW50UG9vbCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGVmO1xuICAgIH0sXG4gIH0pO1xuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBBIHdyYXBwZXIgYXJvdW5kIGBjb21waWxlQ29tcG9uZW50YCB3aGljaCBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGZvciB0aGUgYEBDb21wb25lbnRgIGRlY29yYXRvci5cbiAqXG4gKiBUaGlzIHdyYXBwZXIga2VlcHMgdHJhY2sgb2YgdGhlIGBQcm9taXNlYCByZXR1cm5lZCBieSBgY29tcGlsZUNvbXBvbmVudGAgYW5kIHdpbGwgY2F1c2VcbiAqIGBhd2FpdEN1cnJlbnRseUNvbXBpbGluZ0NvbXBvbmVudHNgIHRvIHdhaXQgb24gdGhlIGNvbXBpbGF0aW9uIHRvIGJlIGZpbmlzaGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZUNvbXBvbmVudERlY29yYXRvcih0eXBlOiBUeXBlPGFueT4sIG1ldGFkYXRhOiBDb21wb25lbnQpOiB2b2lkIHtcbiAgY29uc3QgcmVzID0gY29tcGlsZUNvbXBvbmVudCh0eXBlLCBtZXRhZGF0YSk7XG4gIGlmIChyZXMgIT09IG51bGwpIHtcbiAgICBfcGVuZGluZ1Byb21pc2VzLnB1c2gocmVzKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgYSBwcm9taXNlIHdoaWNoIHdpbGwgYXdhaXQgdGhlIGNvbXBpbGF0aW9uIG9mIGFueSBgQENvbXBvbmVudGBzIHdoaWNoIGhhdmUgYmVlbiBkZWZpbmVkXG4gKiBzaW5jZSB0aGUgbGFzdCB0aW1lIGBhd2FpdEN1cnJlbnRseUNvbXBpbGluZ0NvbXBvbmVudHNgIHdhcyBjYWxsZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhd2FpdEN1cnJlbnRseUNvbXBpbGluZ0NvbXBvbmVudHMoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHJlcyA9IFByb21pc2UuYWxsKF9wZW5kaW5nUHJvbWlzZXMpLnRoZW4oKCkgPT4gdW5kZWZpbmVkKTtcbiAgX3BlbmRpbmdQcm9taXNlcyA9IFtdO1xuICByZXR1cm4gcmVzO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdGhlIGBSM0RpcmVjdGl2ZU1ldGFkYXRhYCBmb3IgYSBwYXJ0aWN1bGFyIGRpcmVjdGl2ZSAoZWl0aGVyIGEgYERpcmVjdGl2ZWAgb3IgYVxuICogYENvbXBvbmVudGApLlxuICovXG5mdW5jdGlvbiBkaXJlY3RpdmVNZXRhZGF0YSh0eXBlOiBUeXBlPGFueT4sIG1ldGFkYXRhOiBEaXJlY3RpdmUpOiBSM0RpcmVjdGl2ZU1ldGFkYXRhIHtcbiAgLy8gUmVmbGVjdCBpbnB1dHMgYW5kIG91dHB1dHMuXG4gIGNvbnN0IHByb3BzID0gZ2V0UmVmbGVjdCgpLnByb3BNZXRhZGF0YSh0eXBlKTtcbiAgY29uc3QgaW5wdXRzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuICBjb25zdCBvdXRwdXRzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuXG4gIGZvciAobGV0IGZpZWxkIGluIHByb3BzKSB7XG4gICAgcHJvcHNbZmllbGRdLmZvckVhY2goYW5uID0+IHtcbiAgICAgIGlmIChpc0lucHV0KGFubikpIHtcbiAgICAgICAgaW5wdXRzW2ZpZWxkXSA9IGFubi5iaW5kaW5nUHJvcGVydHlOYW1lIHx8IGZpZWxkO1xuICAgICAgfSBlbHNlIGlmIChpc091dHB1dChhbm4pKSB7XG4gICAgICAgIG91dHB1dHNbZmllbGRdID0gYW5uLmJpbmRpbmdQcm9wZXJ0eU5hbWUgfHwgZmllbGQ7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG5hbWU6IHR5cGUubmFtZSxcbiAgICB0eXBlOiBuZXcgV3JhcHBlZE5vZGVFeHByKHR5cGUpLFxuICAgIHNlbGVjdG9yOiBtZXRhZGF0YS5zZWxlY3RvciAhLFxuICAgIGRlcHM6IHJlZmxlY3REZXBlbmRlbmNpZXModHlwZSksXG4gICAgaG9zdDoge1xuICAgICAgYXR0cmlidXRlczoge30sXG4gICAgICBsaXN0ZW5lcnM6IHt9LFxuICAgICAgcHJvcGVydGllczoge30sXG4gICAgfSxcbiAgICBpbnB1dHMsXG4gICAgb3V0cHV0cyxcbiAgICBxdWVyaWVzOiBbXSxcbiAgICBsaWZlY3ljbGU6IHtcbiAgICAgIHVzZXNPbkNoYW5nZXM6IHR5cGUucHJvdG90eXBlLm5nT25DaGFuZ2VzICE9PSB1bmRlZmluZWQsXG4gICAgfSxcbiAgICB0eXBlU291cmNlU3BhbjogbnVsbCAhLFxuICB9O1xufVxuXG5mdW5jdGlvbiBpc0lucHV0KHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBJbnB1dCB7XG4gIHJldHVybiB2YWx1ZS5uZ01ldGFkYXRhTmFtZSA9PT0gJ0lucHV0Jztcbn1cblxuZnVuY3Rpb24gaXNPdXRwdXQodmFsdWU6IGFueSk6IHZhbHVlIGlzIE91dHB1dCB7XG4gIHJldHVybiB2YWx1ZS5uZ01ldGFkYXRhTmFtZSA9PT0gJ091dHB1dCc7XG59XG4iXX0=