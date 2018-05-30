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
import { ConstantPool, WrappedNodeExpr, compileComponentFromMetadata as compileIvyComponent, compileDirectiveFromMetadata as compileIvyDirective, jitExpression, makeBindingParser, parseTemplate } from '@angular/compiler';
import { angularCoreEnv } from './environment';
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
    Object.defineProperty(type, 'ngComponentDef', {
        get: () => {
            if (def === null) {
                // The ConstantPool is a requirement of the JIT'er.
                const /** @type {?} */ constantPool = new ConstantPool();
                // Parse the template and check for errors.
                const /** @type {?} */ template = parseTemplate(templateStr, `ng://${type.name}/template.html`);
                if (template.errors !== undefined) {
                    const /** @type {?} */ errors = template.errors.map(err => err.toString()).join(', ');
                    throw new Error(`Errors during JIT compilation of template for ${type.name}: ${errors}`);
                }
                // Compile the component metadata, including template, into an expression.
                // TODO(alxhub): implement inputs, outputs, queries, etc.
                const /** @type {?} */ res = compileIvyComponent(Object.assign({}, directiveMetadata(type, metadata), { template, directives: new Map(), pipes: new Map(), viewQueries: [] }), constantPool, makeBindingParser());
                def = jitExpression(res.expression, angularCoreEnv, `ng://${type.name}/ngComponentDef.js`, constantPool);
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
 * @param {?} type
 * @param {?} directive
 * @return {?}
 */
export function compileDirective(type, directive) {
    let /** @type {?} */ def = null;
    Object.defineProperty(type, 'ngDirectiveDef', {
        get: () => {
            if (def === null) {
                const /** @type {?} */ constantPool = new ConstantPool();
                const /** @type {?} */ sourceMapUrl = `ng://${type && type.name}/ngDirectiveDef.js`;
                const /** @type {?} */ res = compileIvyDirective(directiveMetadata(type, directive), constantPool, makeBindingParser());
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
    const /** @type {?} */ props = getReflect().propMetadata(type);
    const /** @type {?} */ inputs = {};
    const /** @type {?} */ outputs = {};
    for (let /** @type {?} */ field in props) {
        props[field].forEach(ann => {
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
        deps: reflectDependencies(type),
        host: {
            attributes: {},
            listeners: {},
            properties: {},
        },
        inputs,
        outputs,
        queries: [],
        lifecycle: {
            usesOnChanges: type.prototype.ngOnChanges !== undefined,
        },
        typeSourceSpan: /** @type {?} */ ((null)),
    };
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFlBQVksRUFBdUIsZUFBZSxFQUFFLDRCQUE0QixJQUFJLG1CQUFtQixFQUFFLDRCQUE0QixJQUFJLG1CQUFtQixFQUFFLGFBQWEsRUFBRSxpQkFBaUIsRUFBRSxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQU1oUCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxVQUFVLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFdkQscUJBQUksZ0JBQWdCLEdBQW9CLEVBQUUsQ0FBQzs7Ozs7Ozs7Ozs7OztBQVczQyxNQUFNLDJCQUEyQixJQUFlLEVBQUUsUUFBbUI7O0lBRW5FLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFO1FBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQUMsK0JBQStCLENBQUMsQ0FBQztLQUNsRDtJQUNELHVCQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDO0lBRXRDLHFCQUFJLEdBQUcsR0FBUSxJQUFJLENBQUM7SUFDcEIsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7UUFDNUMsR0FBRyxFQUFFLEdBQUcsRUFBRTtZQUNSLElBQUksR0FBRyxLQUFLLElBQUksRUFBRTs7Z0JBRWhCLHVCQUFNLFlBQVksR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDOztnQkFHeEMsdUJBQU0sUUFBUSxHQUFHLGFBQWEsQ0FBQyxXQUFXLEVBQUUsUUFBUSxJQUFJLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUMvRSxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssU0FBUyxF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SyxDQUFDLEdBQUcsR0FBRyxDQUFDLG1CQUFtQixJQUFJLEtBQUssQ0FBQzthQUNsRDtpQkFBTSxJQUFJLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDeEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQyxtQkFBbUIsSUFBSSxLQUFLLENBQUM7YUFDbkQ7U0FDRixDQUFDLENBQUM7S0FDSjtJQUVELE9BQU87UUFDTCxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7UUFDZixJQUFJLEVBQUUsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDO1FBQy9CLFFBQVEscUJBQUUsUUFBUSxDQUFDLFFBQVEsRUFBRTtRQUM3QixJQUFJLEVBQUUsbUJBQW1CLENBQUMsSUFBSSxDQUFDO1FBQy9CLElBQUksRUFBRTtZQUNKLFVBQVUsRUFBRSxFQUFFO1lBQ2QsU0FBUyxFQUFFLEVBQUU7WUFDYixVQUFVLEVBQUUsRUFBRTtTQUNmO1FBQ0QsTUFBTTtRQUNOLE9BQU87UUFDUCxPQUFPLEVBQUUsRUFBRTtRQUNYLFNBQVMsRUFBRTtZQUNULGFBQWEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsS0FBSyxTQUFTO1NBQ3hEO1FBQ0QsY0FBYyxxQkFBRSxJQUFJLEVBQUU7S0FDdkIsQ0FBQztDQUNIOzs7OztBQUVELGlCQUFpQixLQUFVO0lBQ3pCLE9BQU8sS0FBSyxDQUFDLGNBQWMsS0FBSyxPQUFPLENBQUM7Q0FDekM7Ozs7O0FBRUQsa0JBQWtCLEtBQVU7SUFDMUIsT0FBTyxLQUFLLENBQUMsY0FBYyxLQUFLLFFBQVEsQ0FBQztDQUMxQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDb25zdGFudFBvb2wsIFIzRGlyZWN0aXZlTWV0YWRhdGEsIFdyYXBwZWROb2RlRXhwciwgY29tcGlsZUNvbXBvbmVudEZyb21NZXRhZGF0YSBhcyBjb21waWxlSXZ5Q29tcG9uZW50LCBjb21waWxlRGlyZWN0aXZlRnJvbU1ldGFkYXRhIGFzIGNvbXBpbGVJdnlEaXJlY3RpdmUsIGppdEV4cHJlc3Npb24sIG1ha2VCaW5kaW5nUGFyc2VyLCBwYXJzZVRlbXBsYXRlfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5cbmltcG9ydCB7Q29tcG9uZW50LCBEaXJlY3RpdmUsIEhvc3RCaW5kaW5nLCBJbnB1dCwgT3V0cHV0fSBmcm9tICcuLi8uLi9tZXRhZGF0YS9kaXJlY3RpdmVzJztcbmltcG9ydCB7UmVmbGVjdGlvbkNhcGFiaWxpdGllc30gZnJvbSAnLi4vLi4vcmVmbGVjdGlvbi9yZWZsZWN0aW9uX2NhcGFiaWxpdGllcyc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL3R5cGUnO1xuXG5pbXBvcnQge2FuZ3VsYXJDb3JlRW52fSBmcm9tICcuL2Vudmlyb25tZW50JztcbmltcG9ydCB7Z2V0UmVmbGVjdCwgcmVmbGVjdERlcGVuZGVuY2llc30gZnJvbSAnLi91dGlsJztcblxubGV0IF9wZW5kaW5nUHJvbWlzZXM6IFByb21pc2U8dm9pZD5bXSA9IFtdO1xuXG4vKipcbiAqIENvbXBpbGUgYW4gQW5ndWxhciBjb21wb25lbnQgYWNjb3JkaW5nIHRvIGl0cyBkZWNvcmF0b3IgbWV0YWRhdGEsIGFuZCBwYXRjaCB0aGUgcmVzdWx0aW5nXG4gKiBuZ0NvbXBvbmVudERlZiBvbnRvIHRoZSBjb21wb25lbnQgdHlwZS5cbiAqXG4gKiBDb21waWxhdGlvbiBtYXkgYmUgYXN5bmNocm9ub3VzIChkdWUgdG8gdGhlIG5lZWQgdG8gcmVzb2x2ZSBVUkxzIGZvciB0aGUgY29tcG9uZW50IHRlbXBsYXRlIG9yXG4gKiBvdGhlciByZXNvdXJjZXMsIGZvciBleGFtcGxlKS4gSW4gdGhlIGV2ZW50IHRoYXQgY29tcGlsYXRpb24gaXMgbm90IGltbWVkaWF0ZSwgYGNvbXBpbGVDb21wb25lbnRgXG4gKiB3aWxsIHJldHVybiBhIGBQcm9taXNlYCB3aGljaCB3aWxsIHJlc29sdmUgd2hlbiBjb21waWxhdGlvbiBjb21wbGV0ZXMgYW5kIHRoZSBjb21wb25lbnQgYmVjb21lc1xuICogdXNhYmxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZUNvbXBvbmVudCh0eXBlOiBUeXBlPGFueT4sIG1ldGFkYXRhOiBDb21wb25lbnQpOiBQcm9taXNlPHZvaWQ+fG51bGwge1xuICAvLyBUT0RPKGFseGh1Yik6IGltcGxlbWVudCBSZXNvdXJjZUxvYWRlciBzdXBwb3J0IGZvciB0ZW1wbGF0ZSBjb21waWxhdGlvbi5cbiAgaWYgKCFtZXRhZGF0YS50ZW1wbGF0ZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigndGVtcGxhdGVVcmwgbm90IHlldCBzdXBwb3J0ZWQnKTtcbiAgfVxuICBjb25zdCB0ZW1wbGF0ZVN0ciA9IG1ldGFkYXRhLnRlbXBsYXRlO1xuXG4gIGxldCBkZWY6IGFueSA9IG51bGw7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCAnbmdDb21wb25lbnREZWYnLCB7XG4gICAgZ2V0OiAoKSA9PiB7XG4gICAgICBpZiAoZGVmID09PSBudWxsKSB7XG4gICAgICAgIC8vIFRoZSBDb25zdGFudFBvb2wgaXMgYSByZXF1aXJlbWVudCBvZiB0aGUgSklUJ2VyLlxuICAgICAgICBjb25zdCBjb25zdGFudFBvb2wgPSBuZXcgQ29uc3RhbnRQb29sKCk7XG5cbiAgICAgICAgLy8gUGFyc2UgdGhlIHRlbXBsYXRlIGFuZCBjaGVjayBmb3IgZXJyb3JzLlxuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IHBhcnNlVGVtcGxhdGUodGVtcGxhdGVTdHIsIGBuZzovLyR7dHlwZS5uYW1lfS90ZW1wbGF0ZS5odG1sYCk7XG4gICAgICAgIGlmICh0ZW1wbGF0ZS5lcnJvcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGNvbnN0IGVycm9ycyA9IHRlbXBsYXRlLmVycm9ycy5tYXAoZXJyID0+IGVyci50b1N0cmluZygpKS5qb2luKCcsICcpO1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3JzIGR1cmluZyBKSVQgY29tcGlsYXRpb24gb2YgdGVtcGxhdGUgZm9yICR7dHlwZS5uYW1lfTogJHtlcnJvcnN9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDb21waWxlIHRoZSBjb21wb25lbnQgbWV0YWRhdGEsIGluY2x1ZGluZyB0ZW1wbGF0ZSwgaW50byBhbiBleHByZXNzaW9uLlxuICAgICAgICAvLyBUT0RPKGFseGh1Yik6IGltcGxlbWVudCBpbnB1dHMsIG91dHB1dHMsIHF1ZXJpZXMsIGV0Yy5cbiAgICAgICAgY29uc3QgcmVzID0gY29tcGlsZUl2eUNvbXBvbmVudChcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgLi4uZGlyZWN0aXZlTWV0YWRhdGEodHlwZSwgbWV0YWRhdGEpLFxuICAgICAgICAgICAgICB0ZW1wbGF0ZSxcbiAgICAgICAgICAgICAgZGlyZWN0aXZlczogbmV3IE1hcCgpLFxuICAgICAgICAgICAgICBwaXBlczogbmV3IE1hcCgpLFxuICAgICAgICAgICAgICB2aWV3UXVlcmllczogW10sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29uc3RhbnRQb29sLCBtYWtlQmluZGluZ1BhcnNlcigpKTtcblxuICAgICAgICBkZWYgPSBqaXRFeHByZXNzaW9uKFxuICAgICAgICAgICAgcmVzLmV4cHJlc3Npb24sIGFuZ3VsYXJDb3JlRW52LCBgbmc6Ly8ke3R5cGUubmFtZX0vbmdDb21wb25lbnREZWYuanNgLCBjb25zdGFudFBvb2wpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRlZjtcbiAgICB9LFxuICB9KTtcblxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBDb21waWxlIGFuIEFuZ3VsYXIgZGlyZWN0aXZlIGFjY29yZGluZyB0byBpdHMgZGVjb3JhdG9yIG1ldGFkYXRhLCBhbmQgcGF0Y2ggdGhlIHJlc3VsdGluZ1xuICogbmdEaXJlY3RpdmVEZWYgb250byB0aGUgY29tcG9uZW50IHR5cGUuXG4gKlxuICogSW4gdGhlIGV2ZW50IHRoYXQgY29tcGlsYXRpb24gaXMgbm90IGltbWVkaWF0ZSwgYGNvbXBpbGVEaXJlY3RpdmVgIHdpbGwgcmV0dXJuIGEgYFByb21pc2VgIHdoaWNoXG4gKiB3aWxsIHJlc29sdmUgd2hlbiBjb21waWxhdGlvbiBjb21wbGV0ZXMgYW5kIHRoZSBkaXJlY3RpdmUgYmVjb21lcyB1c2FibGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlRGlyZWN0aXZlKHR5cGU6IFR5cGU8YW55PiwgZGlyZWN0aXZlOiBEaXJlY3RpdmUpOiBQcm9taXNlPHZvaWQ+fG51bGwge1xuICBsZXQgZGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgJ25nRGlyZWN0aXZlRGVmJywge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKGRlZiA9PT0gbnVsbCkge1xuICAgICAgICBjb25zdCBjb25zdGFudFBvb2wgPSBuZXcgQ29uc3RhbnRQb29sKCk7XG4gICAgICAgIGNvbnN0IHNvdXJjZU1hcFVybCA9IGBuZzovLyR7dHlwZSAmJiB0eXBlLm5hbWV9L25nRGlyZWN0aXZlRGVmLmpzYDtcbiAgICAgICAgY29uc3QgcmVzID0gY29tcGlsZUl2eURpcmVjdGl2ZShcbiAgICAgICAgICAgIGRpcmVjdGl2ZU1ldGFkYXRhKHR5cGUsIGRpcmVjdGl2ZSksIGNvbnN0YW50UG9vbCwgbWFrZUJpbmRpbmdQYXJzZXIoKSk7XG4gICAgICAgIGRlZiA9IGppdEV4cHJlc3Npb24ocmVzLmV4cHJlc3Npb24sIGFuZ3VsYXJDb3JlRW52LCBzb3VyY2VNYXBVcmwsIGNvbnN0YW50UG9vbCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGVmO1xuICAgIH0sXG4gIH0pO1xuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBBIHdyYXBwZXIgYXJvdW5kIGBjb21waWxlQ29tcG9uZW50YCB3aGljaCBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGZvciB0aGUgYEBDb21wb25lbnRgIGRlY29yYXRvci5cbiAqXG4gKiBUaGlzIHdyYXBwZXIga2VlcHMgdHJhY2sgb2YgdGhlIGBQcm9taXNlYCByZXR1cm5lZCBieSBgY29tcGlsZUNvbXBvbmVudGAgYW5kIHdpbGwgY2F1c2VcbiAqIGBhd2FpdEN1cnJlbnRseUNvbXBpbGluZ0NvbXBvbmVudHNgIHRvIHdhaXQgb24gdGhlIGNvbXBpbGF0aW9uIHRvIGJlIGZpbmlzaGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZUNvbXBvbmVudERlY29yYXRvcih0eXBlOiBUeXBlPGFueT4sIG1ldGFkYXRhOiBDb21wb25lbnQpOiB2b2lkIHtcbiAgY29uc3QgcmVzID0gY29tcGlsZUNvbXBvbmVudCh0eXBlLCBtZXRhZGF0YSk7XG4gIGlmIChyZXMgIT09IG51bGwpIHtcbiAgICBfcGVuZGluZ1Byb21pc2VzLnB1c2gocmVzKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgYSBwcm9taXNlIHdoaWNoIHdpbGwgYXdhaXQgdGhlIGNvbXBpbGF0aW9uIG9mIGFueSBgQENvbXBvbmVudGBzIHdoaWNoIGhhdmUgYmVlbiBkZWZpbmVkXG4gKiBzaW5jZSB0aGUgbGFzdCB0aW1lIGBhd2FpdEN1cnJlbnRseUNvbXBpbGluZ0NvbXBvbmVudHNgIHdhcyBjYWxsZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhd2FpdEN1cnJlbnRseUNvbXBpbGluZ0NvbXBvbmVudHMoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHJlcyA9IFByb21pc2UuYWxsKF9wZW5kaW5nUHJvbWlzZXMpLnRoZW4oKCkgPT4gdW5kZWZpbmVkKTtcbiAgX3BlbmRpbmdQcm9taXNlcyA9IFtdO1xuICByZXR1cm4gcmVzO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdGhlIGBSM0RpcmVjdGl2ZU1ldGFkYXRhYCBmb3IgYSBwYXJ0aWN1bGFyIGRpcmVjdGl2ZSAoZWl0aGVyIGEgYERpcmVjdGl2ZWAgb3IgYVxuICogYENvbXBvbmVudGApLlxuICovXG5mdW5jdGlvbiBkaXJlY3RpdmVNZXRhZGF0YSh0eXBlOiBUeXBlPGFueT4sIG1ldGFkYXRhOiBEaXJlY3RpdmUpOiBSM0RpcmVjdGl2ZU1ldGFkYXRhIHtcbiAgLy8gUmVmbGVjdCBpbnB1dHMgYW5kIG91dHB1dHMuXG4gIGNvbnN0IHByb3BzID0gZ2V0UmVmbGVjdCgpLnByb3BNZXRhZGF0YSh0eXBlKTtcbiAgY29uc3QgaW5wdXRzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuICBjb25zdCBvdXRwdXRzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuXG4gIGZvciAobGV0IGZpZWxkIGluIHByb3BzKSB7XG4gICAgcHJvcHNbZmllbGRdLmZvckVhY2goYW5uID0+IHtcbiAgICAgIGlmIChpc0lucHV0KGFubikpIHtcbiAgICAgICAgaW5wdXRzW2ZpZWxkXSA9IGFubi5iaW5kaW5nUHJvcGVydHlOYW1lIHx8IGZpZWxkO1xuICAgICAgfSBlbHNlIGlmIChpc091dHB1dChhbm4pKSB7XG4gICAgICAgIG91dHB1dHNbZmllbGRdID0gYW5uLmJpbmRpbmdQcm9wZXJ0eU5hbWUgfHwgZmllbGQ7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG5hbWU6IHR5cGUubmFtZSxcbiAgICB0eXBlOiBuZXcgV3JhcHBlZE5vZGVFeHByKHR5cGUpLFxuICAgIHNlbGVjdG9yOiBtZXRhZGF0YS5zZWxlY3RvciAhLFxuICAgIGRlcHM6IHJlZmxlY3REZXBlbmRlbmNpZXModHlwZSksXG4gICAgaG9zdDoge1xuICAgICAgYXR0cmlidXRlczoge30sXG4gICAgICBsaXN0ZW5lcnM6IHt9LFxuICAgICAgcHJvcGVydGllczoge30sXG4gICAgfSxcbiAgICBpbnB1dHMsXG4gICAgb3V0cHV0cyxcbiAgICBxdWVyaWVzOiBbXSxcbiAgICBsaWZlY3ljbGU6IHtcbiAgICAgIHVzZXNPbkNoYW5nZXM6IHR5cGUucHJvdG90eXBlLm5nT25DaGFuZ2VzICE9PSB1bmRlZmluZWQsXG4gICAgfSxcbiAgICB0eXBlU291cmNlU3BhbjogbnVsbCAhLFxuICB9O1xufVxuXG5mdW5jdGlvbiBpc0lucHV0KHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBJbnB1dCB7XG4gIHJldHVybiB2YWx1ZS5uZ01ldGFkYXRhTmFtZSA9PT0gJ0lucHV0Jztcbn1cblxuZnVuY3Rpb24gaXNPdXRwdXQodmFsdWU6IGFueSk6IHZhbHVlIGlzIE91dHB1dCB7XG4gIHJldHVybiB2YWx1ZS5uZ01ldGFkYXRhTmFtZSA9PT0gJ091dHB1dCc7XG59XG4iXX0=