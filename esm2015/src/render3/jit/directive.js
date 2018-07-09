/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ConstantPool, WrappedNodeExpr, compileComponentFromMetadata as compileR3Component, compileDirectiveFromMetadata as compileR3Directive, jitExpression, makeBindingParser, parseHostBindings, parseTemplate } from '@angular/compiler';
import { angularCoreEnv } from './environment';
import { NG_COMPONENT_DEF, NG_DIRECTIVE_DEF } from './fields';
import { patchComponentDefWithScope } from './module';
import { getReflect, reflectDependencies } from './util';
let /** @type {?} */ _pendingPromises = [];
/**
 * Compile an Angular component according to its decorator metadata, and patch the resulting
 * ngComponentDef onto the component type.
 *
 * Compilation may be asynchronous (due to the need to resolve URLs for the component template or
 * other resources, for example). In the event that compilation is not immediate, `compileComponent`
 * will return a `Promise` which will resolve when compilation completes and the component becomes
 * usable.
 * @param {?} type
 * @param {?} metadata
 * @return {?}
 */
export function compileComponent(type, metadata) {
    // TODO(alxhub): implement ResourceLoader support for template compilation.
    if (!metadata.template) {
        throw new Error('templateUrl not yet supported');
    }
    const /** @type {?} */ templateStr = metadata.template;
    let /** @type {?} */ def = null;
    Object.defineProperty(type, NG_COMPONENT_DEF, {
        get: () => {
            if (def === null) {
                // The ConstantPool is a requirement of the JIT'er.
                const /** @type {?} */ constantPool = new ConstantPool();
                // Parse the template and check for errors.
                const /** @type {?} */ template = parseTemplate(templateStr, `ng://${type.name}/template.html`, {
                    preserveWhitespaces: metadata.preserveWhitespaces || false,
                });
                if (template.errors !== undefined) {
                    const /** @type {?} */ errors = template.errors.map(err => err.toString()).join(', ');
                    throw new Error(`Errors during JIT compilation of template for ${type.name}: ${errors}`);
                }
                // Compile the component metadata, including template, into an expression.
                // TODO(alxhub): implement inputs, outputs, queries, etc.
                const /** @type {?} */ res = compileR3Component(Object.assign({}, directiveMetadata(type, metadata), { template, directives: new Map(), pipes: new Map(), viewQueries: [] }), constantPool, makeBindingParser());
                def = jitExpression(res.expression, angularCoreEnv, `ng://${type.name}/ngComponentDef.js`, constantPool);
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
/**
 * @template T
 * @param {?} component
 * @return {?}
 */
function hasSelectorScope(component) {
    return (/** @type {?} */ (component)).ngSelectorScope !== undefined;
}
/**
 * Compile an Angular directive according to its decorator metadata, and patch the resulting
 * ngDirectiveDef onto the component type.
 *
 * In the event that compilation is not immediate, `compileDirective` will return a `Promise` which
 * will resolve when compilation completes and the directive becomes usable.
 * @param {?} type
 * @param {?} directive
 * @return {?}
 */
export function compileDirective(type, directive) {
    let /** @type {?} */ def = null;
    Object.defineProperty(type, NG_DIRECTIVE_DEF, {
        get: () => {
            if (def === null) {
                const /** @type {?} */ constantPool = new ConstantPool();
                const /** @type {?} */ sourceMapUrl = `ng://${type && type.name}/ngDirectiveDef.js`;
                const /** @type {?} */ res = compileR3Directive(directiveMetadata(type, directive), constantPool, makeBindingParser());
                def = jitExpression(res.expression, angularCoreEnv, sourceMapUrl, constantPool);
            }
            return def;
        },
    });
    return null;
}
/**
 * A wrapper around `compileComponent` which is intended to be used for the `\@Component` decorator.
 *
 * This wrapper keeps track of the `Promise` returned by `compileComponent` and will cause
 * `awaitCurrentlyCompilingComponents` to wait on the compilation to be finished.
 * @param {?} type
 * @param {?} metadata
 * @return {?}
 */
export function compileComponentDecorator(type, metadata) {
    const /** @type {?} */ res = compileComponent(type, metadata);
    if (res !== null) {
        _pendingPromises.push(res);
    }
}
/**
 * Returns a promise which will await the compilation of any `\@Component`s which have been defined
 * since the last time `awaitCurrentlyCompilingComponents` was called.
 * @return {?}
 */
export function awaitCurrentlyCompilingComponents() {
    const /** @type {?} */ res = Promise.all(_pendingPromises).then(() => undefined);
    _pendingPromises = [];
    return res;
}
/**
 * Extract the `R3DirectiveMetadata` for a particular directive (either a `Directive` or a
 * `Component`).
 * @param {?} type
 * @param {?} metadata
 * @return {?}
 */
function directiveMetadata(type, metadata) {
    // Reflect inputs and outputs.
    const /** @type {?} */ propMetadata = getReflect().propMetadata(type);
    const /** @type {?} */ inputs = {};
    const /** @type {?} */ outputs = {};
    const /** @type {?} */ host = extractHostBindings(metadata, propMetadata);
    for (let /** @type {?} */ field in propMetadata) {
        propMetadata[field].forEach(ann => {
            if (isInput(ann)) {
                inputs[field] = ann.bindingPropertyName || field;
            }
            else if (isOutput(ann)) {
                outputs[field] = ann.bindingPropertyName || field;
            }
        });
    }
    return {
        name: type.name,
        type: new WrappedNodeExpr(type),
        selector: /** @type {?} */ ((metadata.selector)),
        deps: reflectDependencies(type), host, inputs, outputs,
        queries: [],
        lifecycle: {
            usesOnChanges: type.prototype.ngOnChanges !== undefined,
        },
        typeSourceSpan: /** @type {?} */ ((null)),
    };
}
/**
 * @param {?} metadata
 * @param {?} propMetadata
 * @return {?}
 */
function extractHostBindings(metadata, propMetadata) {
    // First parse the declarations from the metadata.
    const { attributes, listeners, properties, animations } = parseHostBindings(metadata.host || {});
    if (Object.keys(animations).length > 0) {
        throw new Error(`Animation bindings are as-of-yet unsupported in Ivy`);
    }
    // Next, loop over the properties of the object, looking for @HostBinding and @HostListener.
    for (let /** @type {?} */ field in propMetadata) {
        propMetadata[field].forEach(ann => {
            if (isHostBinding(ann)) {
                properties[ann.hostPropertyName || field] = field;
            }
            else if (isHostListener(ann)) {
                listeners[ann.eventName || field] = `${field}(${(ann.args || []).join(',')})`;
            }
        });
    }
    return { attributes, listeners, properties };
}
/**
 * @param {?} value
 * @return {?}
 */
function isInput(value) {
    return value.ngMetadataName === 'Input';
}
/**
 * @param {?} value
 * @return {?}
 */
function isOutput(value) {
    return value.ngMetadataName === 'Output';
}
/**
 * @param {?} value
 * @return {?}
 */
function isHostBinding(value) {
    return value.ngMetadataName === 'HostBinding';
}
/**
 * @param {?} value
 * @return {?}
 */
function isHostListener(value) {
    return value.ngMetadataName === 'HostListener';
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFlBQVksRUFBdUIsZUFBZSxFQUFFLDRCQUE0QixJQUFJLGtCQUFrQixFQUFFLDRCQUE0QixJQUFJLGtCQUFrQixFQUFFLGFBQWEsRUFBRSxpQkFBaUIsRUFBRSxpQkFBaUIsRUFBRSxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQU1qUSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM1RCxPQUFPLEVBQUMsMEJBQTBCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDcEQsT0FBTyxFQUFDLFVBQVUsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUV2RCxxQkFBSSxnQkFBZ0IsR0FBb0IsRUFBRSxDQUFDOzs7Ozs7Ozs7Ozs7O0FBZTNDLE1BQU0sMkJBQTJCLElBQWUsRUFBRSxRQUFtQjs7SUFFbkUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUU7UUFDdEIsTUFBTSxJQUFJLEtBQUssQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO0tBQ2xEO0lBQ0QsdUJBQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUM7SUFFdEMscUJBQUksR0FBRyxHQUFRLElBQUksQ0FBQztJQUNwQixNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtRQUM1QyxHQUFHLEVBQUUsR0FBRyxFQUFFO1lBQ1IsSUFBSSxHQUFHLEtBQUssSUFBSSxFQUFFOztnQkFFaEIsdUJBQU0sWUFBWSxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7O2dCQUd4Qyx1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QUFLLGFBQWEsQ0FBQztDQUMvQzs7Ozs7QUFFRCx3QkFBd0IsS0FBVTtJQUNoQyxPQUFPLEtBQUssQ0FBQyxjQUFjLEtBQUssY0FBYyxDQUFDO0NBQ2hEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NvbnN0YW50UG9vbCwgUjNEaXJlY3RpdmVNZXRhZGF0YSwgV3JhcHBlZE5vZGVFeHByLCBjb21waWxlQ29tcG9uZW50RnJvbU1ldGFkYXRhIGFzIGNvbXBpbGVSM0NvbXBvbmVudCwgY29tcGlsZURpcmVjdGl2ZUZyb21NZXRhZGF0YSBhcyBjb21waWxlUjNEaXJlY3RpdmUsIGppdEV4cHJlc3Npb24sIG1ha2VCaW5kaW5nUGFyc2VyLCBwYXJzZUhvc3RCaW5kaW5ncywgcGFyc2VUZW1wbGF0ZX0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuXG5pbXBvcnQge0NvbXBvbmVudCwgRGlyZWN0aXZlLCBIb3N0QmluZGluZywgSG9zdExpc3RlbmVyLCBJbnB1dCwgT3V0cHV0fSBmcm9tICcuLi8uLi9tZXRhZGF0YS9kaXJlY3RpdmVzJztcbmltcG9ydCB7UmVmbGVjdGlvbkNhcGFiaWxpdGllc30gZnJvbSAnLi4vLi4vcmVmbGVjdGlvbi9yZWZsZWN0aW9uX2NhcGFiaWxpdGllcyc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL3R5cGUnO1xuXG5pbXBvcnQge2FuZ3VsYXJDb3JlRW52fSBmcm9tICcuL2Vudmlyb25tZW50JztcbmltcG9ydCB7TkdfQ09NUE9ORU5UX0RFRiwgTkdfRElSRUNUSVZFX0RFRn0gZnJvbSAnLi9maWVsZHMnO1xuaW1wb3J0IHtwYXRjaENvbXBvbmVudERlZldpdGhTY29wZX0gZnJvbSAnLi9tb2R1bGUnO1xuaW1wb3J0IHtnZXRSZWZsZWN0LCByZWZsZWN0RGVwZW5kZW5jaWVzfSBmcm9tICcuL3V0aWwnO1xuXG5sZXQgX3BlbmRpbmdQcm9taXNlczogUHJvbWlzZTx2b2lkPltdID0gW107XG5cbnR5cGUgU3RyaW5nTWFwID0ge1xuICBba2V5OiBzdHJpbmddOiBzdHJpbmdcbn07XG5cbi8qKlxuICogQ29tcGlsZSBhbiBBbmd1bGFyIGNvbXBvbmVudCBhY2NvcmRpbmcgdG8gaXRzIGRlY29yYXRvciBtZXRhZGF0YSwgYW5kIHBhdGNoIHRoZSByZXN1bHRpbmdcbiAqIG5nQ29tcG9uZW50RGVmIG9udG8gdGhlIGNvbXBvbmVudCB0eXBlLlxuICpcbiAqIENvbXBpbGF0aW9uIG1heSBiZSBhc3luY2hyb25vdXMgKGR1ZSB0byB0aGUgbmVlZCB0byByZXNvbHZlIFVSTHMgZm9yIHRoZSBjb21wb25lbnQgdGVtcGxhdGUgb3JcbiAqIG90aGVyIHJlc291cmNlcywgZm9yIGV4YW1wbGUpLiBJbiB0aGUgZXZlbnQgdGhhdCBjb21waWxhdGlvbiBpcyBub3QgaW1tZWRpYXRlLCBgY29tcGlsZUNvbXBvbmVudGBcbiAqIHdpbGwgcmV0dXJuIGEgYFByb21pc2VgIHdoaWNoIHdpbGwgcmVzb2x2ZSB3aGVuIGNvbXBpbGF0aW9uIGNvbXBsZXRlcyBhbmQgdGhlIGNvbXBvbmVudCBiZWNvbWVzXG4gKiB1c2FibGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlQ29tcG9uZW50KHR5cGU6IFR5cGU8YW55PiwgbWV0YWRhdGE6IENvbXBvbmVudCk6IFByb21pc2U8dm9pZD58bnVsbCB7XG4gIC8vIFRPRE8oYWx4aHViKTogaW1wbGVtZW50IFJlc291cmNlTG9hZGVyIHN1cHBvcnQgZm9yIHRlbXBsYXRlIGNvbXBpbGF0aW9uLlxuICBpZiAoIW1ldGFkYXRhLnRlbXBsYXRlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd0ZW1wbGF0ZVVybCBub3QgeWV0IHN1cHBvcnRlZCcpO1xuICB9XG4gIGNvbnN0IHRlbXBsYXRlU3RyID0gbWV0YWRhdGEudGVtcGxhdGU7XG5cbiAgbGV0IGRlZjogYW55ID0gbnVsbDtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIE5HX0NPTVBPTkVOVF9ERUYsIHtcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChkZWYgPT09IG51bGwpIHtcbiAgICAgICAgLy8gVGhlIENvbnN0YW50UG9vbCBpcyBhIHJlcXVpcmVtZW50IG9mIHRoZSBKSVQnZXIuXG4gICAgICAgIGNvbnN0IGNvbnN0YW50UG9vbCA9IG5ldyBDb25zdGFudFBvb2woKTtcblxuICAgICAgICAvLyBQYXJzZSB0aGUgdGVtcGxhdGUgYW5kIGNoZWNrIGZvciBlcnJvcnMuXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gcGFyc2VUZW1wbGF0ZSh0ZW1wbGF0ZVN0ciwgYG5nOi8vJHt0eXBlLm5hbWV9L3RlbXBsYXRlLmh0bWxgLCB7XG4gICAgICAgICAgcHJlc2VydmVXaGl0ZXNwYWNlczogbWV0YWRhdGEucHJlc2VydmVXaGl0ZXNwYWNlcyB8fCBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh0ZW1wbGF0ZS5lcnJvcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGNvbnN0IGVycm9ycyA9IHRlbXBsYXRlLmVycm9ycy5tYXAoZXJyID0+IGVyci50b1N0cmluZygpKS5qb2luKCcsICcpO1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3JzIGR1cmluZyBKSVQgY29tcGlsYXRpb24gb2YgdGVtcGxhdGUgZm9yICR7dHlwZS5uYW1lfTogJHtlcnJvcnN9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDb21waWxlIHRoZSBjb21wb25lbnQgbWV0YWRhdGEsIGluY2x1ZGluZyB0ZW1wbGF0ZSwgaW50byBhbiBleHByZXNzaW9uLlxuICAgICAgICAvLyBUT0RPKGFseGh1Yik6IGltcGxlbWVudCBpbnB1dHMsIG91dHB1dHMsIHF1ZXJpZXMsIGV0Yy5cbiAgICAgICAgY29uc3QgcmVzID0gY29tcGlsZVIzQ29tcG9uZW50KFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAuLi5kaXJlY3RpdmVNZXRhZGF0YSh0eXBlLCBtZXRhZGF0YSksXG4gICAgICAgICAgICAgIHRlbXBsYXRlLFxuICAgICAgICAgICAgICBkaXJlY3RpdmVzOiBuZXcgTWFwKCksXG4gICAgICAgICAgICAgIHBpcGVzOiBuZXcgTWFwKCksXG4gICAgICAgICAgICAgIHZpZXdRdWVyaWVzOiBbXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb25zdGFudFBvb2wsIG1ha2VCaW5kaW5nUGFyc2VyKCkpO1xuXG4gICAgICAgIGRlZiA9IGppdEV4cHJlc3Npb24oXG4gICAgICAgICAgICByZXMuZXhwcmVzc2lvbiwgYW5ndWxhckNvcmVFbnYsIGBuZzovLyR7dHlwZS5uYW1lfS9uZ0NvbXBvbmVudERlZi5qc2AsIGNvbnN0YW50UG9vbCk7XG5cbiAgICAgICAgLy8gSWYgY29tcG9uZW50IGNvbXBpbGF0aW9uIGlzIGFzeW5jLCB0aGVuIHRoZSBATmdNb2R1bGUgYW5ub3RhdGlvbiB3aGljaCBkZWNsYXJlcyB0aGVcbiAgICAgICAgLy8gY29tcG9uZW50IG1heSBleGVjdXRlIGFuZCBzZXQgYW4gbmdTZWxlY3RvclNjb3BlIHByb3BlcnR5IG9uIHRoZSBjb21wb25lbnQgdHlwZS4gVGhpc1xuICAgICAgICAvLyBhbGxvd3MgdGhlIGNvbXBvbmVudCB0byBwYXRjaCBpdHNlbGYgd2l0aCBkaXJlY3RpdmVEZWZzIGZyb20gdGhlIG1vZHVsZSBhZnRlciBpdCBmaW5pc2hlc1xuICAgICAgICAvLyBjb21waWxpbmcuXG4gICAgICAgIGlmIChoYXNTZWxlY3RvclNjb3BlKHR5cGUpKSB7XG4gICAgICAgICAgcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUoZGVmLCB0eXBlLm5nU2VsZWN0b3JTY29wZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBkZWY7XG4gICAgfSxcbiAgfSk7XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGhhc1NlbGVjdG9yU2NvcGU8VD4oY29tcG9uZW50OiBUeXBlPFQ+KTogY29tcG9uZW50IGlzIFR5cGU8VD4mXG4gICAge25nU2VsZWN0b3JTY29wZTogVHlwZTxhbnk+fSB7XG4gIHJldHVybiAoY29tcG9uZW50IGFze25nU2VsZWN0b3JTY29wZT86IGFueX0pLm5nU2VsZWN0b3JTY29wZSAhPT0gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIENvbXBpbGUgYW4gQW5ndWxhciBkaXJlY3RpdmUgYWNjb3JkaW5nIHRvIGl0cyBkZWNvcmF0b3IgbWV0YWRhdGEsIGFuZCBwYXRjaCB0aGUgcmVzdWx0aW5nXG4gKiBuZ0RpcmVjdGl2ZURlZiBvbnRvIHRoZSBjb21wb25lbnQgdHlwZS5cbiAqXG4gKiBJbiB0aGUgZXZlbnQgdGhhdCBjb21waWxhdGlvbiBpcyBub3QgaW1tZWRpYXRlLCBgY29tcGlsZURpcmVjdGl2ZWAgd2lsbCByZXR1cm4gYSBgUHJvbWlzZWAgd2hpY2hcbiAqIHdpbGwgcmVzb2x2ZSB3aGVuIGNvbXBpbGF0aW9uIGNvbXBsZXRlcyBhbmQgdGhlIGRpcmVjdGl2ZSBiZWNvbWVzIHVzYWJsZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVEaXJlY3RpdmUodHlwZTogVHlwZTxhbnk+LCBkaXJlY3RpdmU6IERpcmVjdGl2ZSk6IFByb21pc2U8dm9pZD58bnVsbCB7XG4gIGxldCBkZWY6IGFueSA9IG51bGw7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBOR19ESVJFQ1RJVkVfREVGLCB7XG4gICAgZ2V0OiAoKSA9PiB7XG4gICAgICBpZiAoZGVmID09PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IGNvbnN0YW50UG9vbCA9IG5ldyBDb25zdGFudFBvb2woKTtcbiAgICAgICAgY29uc3Qgc291cmNlTWFwVXJsID0gYG5nOi8vJHt0eXBlICYmIHR5cGUubmFtZX0vbmdEaXJlY3RpdmVEZWYuanNgO1xuICAgICAgICBjb25zdCByZXMgPSBjb21waWxlUjNEaXJlY3RpdmUoXG4gICAgICAgICAgICBkaXJlY3RpdmVNZXRhZGF0YSh0eXBlLCBkaXJlY3RpdmUpLCBjb25zdGFudFBvb2wsIG1ha2VCaW5kaW5nUGFyc2VyKCkpO1xuICAgICAgICBkZWYgPSBqaXRFeHByZXNzaW9uKHJlcy5leHByZXNzaW9uLCBhbmd1bGFyQ29yZUVudiwgc291cmNlTWFwVXJsLCBjb25zdGFudFBvb2wpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRlZjtcbiAgICB9LFxuICB9KTtcbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQSB3cmFwcGVyIGFyb3VuZCBgY29tcGlsZUNvbXBvbmVudGAgd2hpY2ggaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgdGhlIGBAQ29tcG9uZW50YCBkZWNvcmF0b3IuXG4gKlxuICogVGhpcyB3cmFwcGVyIGtlZXBzIHRyYWNrIG9mIHRoZSBgUHJvbWlzZWAgcmV0dXJuZWQgYnkgYGNvbXBpbGVDb21wb25lbnRgIGFuZCB3aWxsIGNhdXNlXG4gKiBgYXdhaXRDdXJyZW50bHlDb21waWxpbmdDb21wb25lbnRzYCB0byB3YWl0IG9uIHRoZSBjb21waWxhdGlvbiB0byBiZSBmaW5pc2hlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVDb21wb25lbnREZWNvcmF0b3IodHlwZTogVHlwZTxhbnk+LCBtZXRhZGF0YTogQ29tcG9uZW50KTogdm9pZCB7XG4gIGNvbnN0IHJlcyA9IGNvbXBpbGVDb21wb25lbnQodHlwZSwgbWV0YWRhdGEpO1xuICBpZiAocmVzICE9PSBudWxsKSB7XG4gICAgX3BlbmRpbmdQcm9taXNlcy5wdXNoKHJlcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgcHJvbWlzZSB3aGljaCB3aWxsIGF3YWl0IHRoZSBjb21waWxhdGlvbiBvZiBhbnkgYEBDb21wb25lbnRgcyB3aGljaCBoYXZlIGJlZW4gZGVmaW5lZFxuICogc2luY2UgdGhlIGxhc3QgdGltZSBgYXdhaXRDdXJyZW50bHlDb21waWxpbmdDb21wb25lbnRzYCB3YXMgY2FsbGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXdhaXRDdXJyZW50bHlDb21waWxpbmdDb21wb25lbnRzKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCByZXMgPSBQcm9taXNlLmFsbChfcGVuZGluZ1Byb21pc2VzKS50aGVuKCgpID0+IHVuZGVmaW5lZCk7XG4gIF9wZW5kaW5nUHJvbWlzZXMgPSBbXTtcbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHRoZSBgUjNEaXJlY3RpdmVNZXRhZGF0YWAgZm9yIGEgcGFydGljdWxhciBkaXJlY3RpdmUgKGVpdGhlciBhIGBEaXJlY3RpdmVgIG9yIGFcbiAqIGBDb21wb25lbnRgKS5cbiAqL1xuZnVuY3Rpb24gZGlyZWN0aXZlTWV0YWRhdGEodHlwZTogVHlwZTxhbnk+LCBtZXRhZGF0YTogRGlyZWN0aXZlKTogUjNEaXJlY3RpdmVNZXRhZGF0YSB7XG4gIC8vIFJlZmxlY3QgaW5wdXRzIGFuZCBvdXRwdXRzLlxuICBjb25zdCBwcm9wTWV0YWRhdGEgPSBnZXRSZWZsZWN0KCkucHJvcE1ldGFkYXRhKHR5cGUpO1xuICBjb25zdCBpbnB1dHM6IFN0cmluZ01hcCA9IHt9O1xuICBjb25zdCBvdXRwdXRzOiBTdHJpbmdNYXAgPSB7fTtcblxuICBjb25zdCBob3N0ID0gZXh0cmFjdEhvc3RCaW5kaW5ncyhtZXRhZGF0YSwgcHJvcE1ldGFkYXRhKTtcblxuICBmb3IgKGxldCBmaWVsZCBpbiBwcm9wTWV0YWRhdGEpIHtcbiAgICBwcm9wTWV0YWRhdGFbZmllbGRdLmZvckVhY2goYW5uID0+IHtcbiAgICAgIGlmIChpc0lucHV0KGFubikpIHtcbiAgICAgICAgaW5wdXRzW2ZpZWxkXSA9IGFubi5iaW5kaW5nUHJvcGVydHlOYW1lIHx8IGZpZWxkO1xuICAgICAgfSBlbHNlIGlmIChpc091dHB1dChhbm4pKSB7XG4gICAgICAgIG91dHB1dHNbZmllbGRdID0gYW5uLmJpbmRpbmdQcm9wZXJ0eU5hbWUgfHwgZmllbGQ7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG5hbWU6IHR5cGUubmFtZSxcbiAgICB0eXBlOiBuZXcgV3JhcHBlZE5vZGVFeHByKHR5cGUpLFxuICAgIHNlbGVjdG9yOiBtZXRhZGF0YS5zZWxlY3RvciAhLFxuICAgIGRlcHM6IHJlZmxlY3REZXBlbmRlbmNpZXModHlwZSksIGhvc3QsIGlucHV0cywgb3V0cHV0cyxcbiAgICBxdWVyaWVzOiBbXSxcbiAgICBsaWZlY3ljbGU6IHtcbiAgICAgIHVzZXNPbkNoYW5nZXM6IHR5cGUucHJvdG90eXBlLm5nT25DaGFuZ2VzICE9PSB1bmRlZmluZWQsXG4gICAgfSxcbiAgICB0eXBlU291cmNlU3BhbjogbnVsbCAhLFxuICB9O1xufVxuXG5mdW5jdGlvbiBleHRyYWN0SG9zdEJpbmRpbmdzKG1ldGFkYXRhOiBEaXJlY3RpdmUsIHByb3BNZXRhZGF0YToge1trZXk6IHN0cmluZ106IGFueVtdfSk6IHtcbiAgYXR0cmlidXRlczogU3RyaW5nTWFwLFxuICBsaXN0ZW5lcnM6IFN0cmluZ01hcCxcbiAgcHJvcGVydGllczogU3RyaW5nTWFwLFxufSB7XG4gIC8vIEZpcnN0IHBhcnNlIHRoZSBkZWNsYXJhdGlvbnMgZnJvbSB0aGUgbWV0YWRhdGEuXG4gIGNvbnN0IHthdHRyaWJ1dGVzLCBsaXN0ZW5lcnMsIHByb3BlcnRpZXMsIGFuaW1hdGlvbnN9ID0gcGFyc2VIb3N0QmluZGluZ3MobWV0YWRhdGEuaG9zdCB8fCB7fSk7XG5cbiAgaWYgKE9iamVjdC5rZXlzKGFuaW1hdGlvbnMpLmxlbmd0aCA+IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEFuaW1hdGlvbiBiaW5kaW5ncyBhcmUgYXMtb2YteWV0IHVuc3VwcG9ydGVkIGluIEl2eWApO1xuICB9XG5cbiAgLy8gTmV4dCwgbG9vcCBvdmVyIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBvYmplY3QsIGxvb2tpbmcgZm9yIEBIb3N0QmluZGluZyBhbmQgQEhvc3RMaXN0ZW5lci5cbiAgZm9yIChsZXQgZmllbGQgaW4gcHJvcE1ldGFkYXRhKSB7XG4gICAgcHJvcE1ldGFkYXRhW2ZpZWxkXS5mb3JFYWNoKGFubiA9PiB7XG4gICAgICBpZiAoaXNIb3N0QmluZGluZyhhbm4pKSB7XG4gICAgICAgIHByb3BlcnRpZXNbYW5uLmhvc3RQcm9wZXJ0eU5hbWUgfHwgZmllbGRdID0gZmllbGQ7XG4gICAgICB9IGVsc2UgaWYgKGlzSG9zdExpc3RlbmVyKGFubikpIHtcbiAgICAgICAgbGlzdGVuZXJzW2Fubi5ldmVudE5hbWUgfHwgZmllbGRdID0gYCR7ZmllbGR9KCR7KGFubi5hcmdzIHx8IFtdKS5qb2luKCcsJyl9KWA7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4ge2F0dHJpYnV0ZXMsIGxpc3RlbmVycywgcHJvcGVydGllc307XG59XG5cbmZ1bmN0aW9uIGlzSW5wdXQodmFsdWU6IGFueSk6IHZhbHVlIGlzIElucHV0IHtcbiAgcmV0dXJuIHZhbHVlLm5nTWV0YWRhdGFOYW1lID09PSAnSW5wdXQnO1xufVxuXG5mdW5jdGlvbiBpc091dHB1dCh2YWx1ZTogYW55KTogdmFsdWUgaXMgT3V0cHV0IHtcbiAgcmV0dXJuIHZhbHVlLm5nTWV0YWRhdGFOYW1lID09PSAnT3V0cHV0Jztcbn1cblxuZnVuY3Rpb24gaXNIb3N0QmluZGluZyh2YWx1ZTogYW55KTogdmFsdWUgaXMgSG9zdEJpbmRpbmcge1xuICByZXR1cm4gdmFsdWUubmdNZXRhZGF0YU5hbWUgPT09ICdIb3N0QmluZGluZyc7XG59XG5cbmZ1bmN0aW9uIGlzSG9zdExpc3RlbmVyKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBIb3N0TGlzdGVuZXIge1xuICByZXR1cm4gdmFsdWUubmdNZXRhZGF0YU5hbWUgPT09ICdIb3N0TGlzdGVuZXInO1xufVxuIl19