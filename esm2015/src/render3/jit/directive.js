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
import { ConstantPool, WrappedNodeExpr, compileComponentFromMetadata as compileR3Component, compileDirectiveFromMetadata as compileR3Directive, jitExpression, makeBindingParser, parseTemplate } from '@angular/compiler';
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
                const /** @type {?} */ res = compileR3Component(Object.assign({}, directiveMetadata(type, metadata), { template, directives: new Map(), pipes: new Map(), viewQueries: [] }), constantPool, makeBindingParser());
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFlBQVksRUFBdUIsZUFBZSxFQUFFLDRCQUE0QixJQUFJLGtCQUFrQixFQUFFLDRCQUE0QixJQUFJLGtCQUFrQixFQUFFLGFBQWEsRUFBRSxpQkFBaUIsRUFBRSxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQU05TyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxVQUFVLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFdkQscUJBQUksZ0JBQWdCLEdBQW9CLEVBQUUsQ0FBQzs7Ozs7Ozs7Ozs7OztBQVczQyxNQUFNLDJCQUEyQixJQUFlLEVBQUUsUUFBbUI7O0lBRW5FLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFO1FBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQUMsK0JBQStCLENBQUMsQ0FBQztLQUNsRDtJQUNELHVCQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDO0lBRXRDLHFCQUFJLEdBQUcsR0FBUSxJQUFJLENBQUM7SUFDcEIsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7UUFDNUMsR0FBRyxFQUFFLEdBQUcsRUFBRTtZQUNSLElBQUksR0FBRyxLQUFLLElBQUksRUFBRTs7Z0JBRWhCLHVCQUFNLFlBQVksR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDOztnQkFHeEMsdUJBQU0sUUFBUSxHQUFHLGFBQWEsQ0FBQyxXQUFXLEVBQUUsUUFBUSxJQUFJLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUMvRSxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssU0FBUyxFQUFFO29CQUNqQyx1QkFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3JFLE1BQU0sSUFBSSxLQUFLLENBQUMsaURBQWlELElBQUksQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFLENBQUMsQ0FBQztpQkFDMUY7OztnQkFJRCx1QkFBTSxHQUFHLEdBQUcsa0JBQWtCLG1CQUVyQixpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQ3BDLFFBQVEsRUFDUixVQUFVLEVBQUUsSUFBSSxHQUFHLEVBQUUsRUFDckIsS0FBSyxFQUFFLElBQUksR0FBRyxFQUFFLEVBQ2hCLFdBQVcsRUFBRSxFQUFFLEtBRWpCLFlBQVksRUFBRSxpQkFBaUIsRUFBRSxDQUFDLENBQUM7Z0JBRXZDLEdBQUcsR0FBRyxhQUFhLENBQ2YsR0FBRyxDQUFDLFVBQVUsRUFBRSxjQUFjLEVBQUUsUUFBUSxJQUFJLENBQUMsSUFBSSxvQkFBb0IsRUFBRSxZQUFZLENBQUMsQ0FBQzthQUMxRjtZQUNELE9BQU8sR0FBRyxDQUFDO1NBQ1o7S0FDRixDQUFDLENBQUM7SUFFSCxPQUFPLElBQUksQ0FBQztDQUNiOzs7Ozs7Ozs7OztBQVNELE1BQU0sMkJBQTJCLElBQWUsRUFBRSxTQUFvQjtJQUNwRSxxQkFBSSxHQUFHLEdBQVEsSUFBSSxDQUFDO0lBQ3BCLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1FBQzVDLEdBQUcsRUFBRSxHQUFHLEVBQUU7WUFDUixJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUU7Z0JBQ2hCLHVCQUFNLFlBQVksR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO2dCQUN4Qyx1QkFBTSxZQUFZLEdBQUcsUUFBUSxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksb0JBQW9CLENBQUM7Z0JBQ25FLHVCQUFNLEdBQUcsR0FBRyxrQkFBa0IsQ0FDMUIsaUJBQWlCLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxFQUFFLFlBQVksRUFBRSxpQkFBaUIsRUFBRSxDQUFDLENBQUM7Z0JBQzNFLEdBQUcsR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxjQUFjLEVBQUUsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO2FBQ2pGO1lBQ0QsT0FBTyxHQUFHLENBQUM7U0FDWjtLQUNGLENBQUMsQ0FBQztJQUNILE9BQU8sSUFBSSxDQUFDO0NBQ2I7Ozs7Ozs7Ozs7QUFRRCxNQUFNLG9DQUFvQyxJQUFlLEVBQUUsUUFBbUI7SUFDNUUsdUJBQU0sR0FBRyxHQUFHLGdCQUFnQixDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztJQUM3QyxJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUU7UUFDaEIsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQzVCO0NBQ0Y7Ozs7OztBQU1ELE1BQU07SUFDSix1QkFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNoRSxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7SUFDdEIsT0FBTyxHQUFHLENBQUM7Q0FDWjs7Ozs7Ozs7QUFNRCwyQkFBMkIsSUFBZSxFQUFFLFFBQW1COztJQUU3RCx1QkFBTSxLQUFLLEdBQUcsVUFBVSxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzlDLHVCQUFNLE1BQU0sR0FBNEIsRUFBRSxDQUFDO0lBQzNDLHVCQUFNLE9BQU8sR0FBNEIsRUFBRSxDQUFDO0lBRTVDLEtBQUsscUJBQUksS0FBSyxJQUFJLEtBQUssRUFBRTtRQUN2QixLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ3pCLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNoQixNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLG1CQUFtQixJQUFJLEtBQUssQ0FBQzthQUNsRDtpQkFBTSxJQUFJLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDeEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQyxtQkFBbUIsSUFBSSxLQUFLLENBQUM7YUFDbkQ7U0FDRixDQUFDLENBQUM7S0FDSjtJQUVELE9BQU87UUFDTCxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7UUFDZixJQUFJLEVBQUUsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDO1FBQy9CLFFBQVEscUJBQUUsUUFBUSxDQUFDLFFBQVEsRUFBRTtRQUM3QixJQUFJLEVBQUUsbUJBQW1CLENBQUMsSUFBSSxDQUFDO1FBQy9CLElBQUksRUFBRTtZQUNKLFVBQVUsRUFBRSxFQUFFO1lBQ2QsU0FBUyxFQUFFLEVBQUU7WUFDYixVQUFVLEVBQUUsRUFBRTtTQUNmO1FBQ0QsTUFBTTtRQUNOLE9BQU87UUFDUCxPQUFPLEVBQUUsRUFBRTtRQUNYLFNBQVMsRUFBRTtZQUNULGFBQWEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsS0FBSyxTQUFTO1NBQ3hEO1FBQ0QsY0FBYyxxQkFBRSxJQUFJLEVBQUU7S0FDdkIsQ0FBQztDQUNIOzs7OztBQUVELGlCQUFpQixLQUFVO0lBQ3pCLE9BQU8sS0FBSyxDQUFDLGNBQWMsS0FBSyxPQUFPLENBQUM7Q0FDekM7Ozs7O0FBRUQsa0JBQWtCLEtBQVU7SUFDMUIsT0FBTyxLQUFLLENBQUMsY0FBYyxLQUFLLFFBQVEsQ0FBQztDQUMxQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDb25zdGFudFBvb2wsIFIzRGlyZWN0aXZlTWV0YWRhdGEsIFdyYXBwZWROb2RlRXhwciwgY29tcGlsZUNvbXBvbmVudEZyb21NZXRhZGF0YSBhcyBjb21waWxlUjNDb21wb25lbnQsIGNvbXBpbGVEaXJlY3RpdmVGcm9tTWV0YWRhdGEgYXMgY29tcGlsZVIzRGlyZWN0aXZlLCBqaXRFeHByZXNzaW9uLCBtYWtlQmluZGluZ1BhcnNlciwgcGFyc2VUZW1wbGF0ZX0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuXG5pbXBvcnQge0NvbXBvbmVudCwgRGlyZWN0aXZlLCBIb3N0QmluZGluZywgSW5wdXQsIE91dHB1dH0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvZGlyZWN0aXZlcyc7XG5pbXBvcnQge1JlZmxlY3Rpb25DYXBhYmlsaXRpZXN9IGZyb20gJy4uLy4uL3JlZmxlY3Rpb24vcmVmbGVjdGlvbl9jYXBhYmlsaXRpZXMnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi90eXBlJztcblxuaW1wb3J0IHthbmd1bGFyQ29yZUVudn0gZnJvbSAnLi9lbnZpcm9ubWVudCc7XG5pbXBvcnQge2dldFJlZmxlY3QsIHJlZmxlY3REZXBlbmRlbmNpZXN9IGZyb20gJy4vdXRpbCc7XG5cbmxldCBfcGVuZGluZ1Byb21pc2VzOiBQcm9taXNlPHZvaWQ+W10gPSBbXTtcblxuLyoqXG4gKiBDb21waWxlIGFuIEFuZ3VsYXIgY29tcG9uZW50IGFjY29yZGluZyB0byBpdHMgZGVjb3JhdG9yIG1ldGFkYXRhLCBhbmQgcGF0Y2ggdGhlIHJlc3VsdGluZ1xuICogbmdDb21wb25lbnREZWYgb250byB0aGUgY29tcG9uZW50IHR5cGUuXG4gKlxuICogQ29tcGlsYXRpb24gbWF5IGJlIGFzeW5jaHJvbm91cyAoZHVlIHRvIHRoZSBuZWVkIHRvIHJlc29sdmUgVVJMcyBmb3IgdGhlIGNvbXBvbmVudCB0ZW1wbGF0ZSBvclxuICogb3RoZXIgcmVzb3VyY2VzLCBmb3IgZXhhbXBsZSkuIEluIHRoZSBldmVudCB0aGF0IGNvbXBpbGF0aW9uIGlzIG5vdCBpbW1lZGlhdGUsIGBjb21waWxlQ29tcG9uZW50YFxuICogd2lsbCByZXR1cm4gYSBgUHJvbWlzZWAgd2hpY2ggd2lsbCByZXNvbHZlIHdoZW4gY29tcGlsYXRpb24gY29tcGxldGVzIGFuZCB0aGUgY29tcG9uZW50IGJlY29tZXNcbiAqIHVzYWJsZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVDb21wb25lbnQodHlwZTogVHlwZTxhbnk+LCBtZXRhZGF0YTogQ29tcG9uZW50KTogUHJvbWlzZTx2b2lkPnxudWxsIHtcbiAgLy8gVE9ETyhhbHhodWIpOiBpbXBsZW1lbnQgUmVzb3VyY2VMb2FkZXIgc3VwcG9ydCBmb3IgdGVtcGxhdGUgY29tcGlsYXRpb24uXG4gIGlmICghbWV0YWRhdGEudGVtcGxhdGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3RlbXBsYXRlVXJsIG5vdCB5ZXQgc3VwcG9ydGVkJyk7XG4gIH1cbiAgY29uc3QgdGVtcGxhdGVTdHIgPSBtZXRhZGF0YS50ZW1wbGF0ZTtcblxuICBsZXQgZGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgJ25nQ29tcG9uZW50RGVmJywge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKGRlZiA9PT0gbnVsbCkge1xuICAgICAgICAvLyBUaGUgQ29uc3RhbnRQb29sIGlzIGEgcmVxdWlyZW1lbnQgb2YgdGhlIEpJVCdlci5cbiAgICAgICAgY29uc3QgY29uc3RhbnRQb29sID0gbmV3IENvbnN0YW50UG9vbCgpO1xuXG4gICAgICAgIC8vIFBhcnNlIHRoZSB0ZW1wbGF0ZSBhbmQgY2hlY2sgZm9yIGVycm9ycy5cbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBwYXJzZVRlbXBsYXRlKHRlbXBsYXRlU3RyLCBgbmc6Ly8ke3R5cGUubmFtZX0vdGVtcGxhdGUuaHRtbGApO1xuICAgICAgICBpZiAodGVtcGxhdGUuZXJyb3JzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBjb25zdCBlcnJvcnMgPSB0ZW1wbGF0ZS5lcnJvcnMubWFwKGVyciA9PiBlcnIudG9TdHJpbmcoKSkuam9pbignLCAnKTtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9ycyBkdXJpbmcgSklUIGNvbXBpbGF0aW9uIG9mIHRlbXBsYXRlIGZvciAke3R5cGUubmFtZX06ICR7ZXJyb3JzfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ29tcGlsZSB0aGUgY29tcG9uZW50IG1ldGFkYXRhLCBpbmNsdWRpbmcgdGVtcGxhdGUsIGludG8gYW4gZXhwcmVzc2lvbi5cbiAgICAgICAgLy8gVE9ETyhhbHhodWIpOiBpbXBsZW1lbnQgaW5wdXRzLCBvdXRwdXRzLCBxdWVyaWVzLCBldGMuXG4gICAgICAgIGNvbnN0IHJlcyA9IGNvbXBpbGVSM0NvbXBvbmVudChcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgLi4uZGlyZWN0aXZlTWV0YWRhdGEodHlwZSwgbWV0YWRhdGEpLFxuICAgICAgICAgICAgICB0ZW1wbGF0ZSxcbiAgICAgICAgICAgICAgZGlyZWN0aXZlczogbmV3IE1hcCgpLFxuICAgICAgICAgICAgICBwaXBlczogbmV3IE1hcCgpLFxuICAgICAgICAgICAgICB2aWV3UXVlcmllczogW10sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29uc3RhbnRQb29sLCBtYWtlQmluZGluZ1BhcnNlcigpKTtcblxuICAgICAgICBkZWYgPSBqaXRFeHByZXNzaW9uKFxuICAgICAgICAgICAgcmVzLmV4cHJlc3Npb24sIGFuZ3VsYXJDb3JlRW52LCBgbmc6Ly8ke3R5cGUubmFtZX0vbmdDb21wb25lbnREZWYuanNgLCBjb25zdGFudFBvb2wpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRlZjtcbiAgICB9LFxuICB9KTtcblxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBDb21waWxlIGFuIEFuZ3VsYXIgZGlyZWN0aXZlIGFjY29yZGluZyB0byBpdHMgZGVjb3JhdG9yIG1ldGFkYXRhLCBhbmQgcGF0Y2ggdGhlIHJlc3VsdGluZ1xuICogbmdEaXJlY3RpdmVEZWYgb250byB0aGUgY29tcG9uZW50IHR5cGUuXG4gKlxuICogSW4gdGhlIGV2ZW50IHRoYXQgY29tcGlsYXRpb24gaXMgbm90IGltbWVkaWF0ZSwgYGNvbXBpbGVEaXJlY3RpdmVgIHdpbGwgcmV0dXJuIGEgYFByb21pc2VgIHdoaWNoXG4gKiB3aWxsIHJlc29sdmUgd2hlbiBjb21waWxhdGlvbiBjb21wbGV0ZXMgYW5kIHRoZSBkaXJlY3RpdmUgYmVjb21lcyB1c2FibGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlRGlyZWN0aXZlKHR5cGU6IFR5cGU8YW55PiwgZGlyZWN0aXZlOiBEaXJlY3RpdmUpOiBQcm9taXNlPHZvaWQ+fG51bGwge1xuICBsZXQgZGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgJ25nRGlyZWN0aXZlRGVmJywge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKGRlZiA9PT0gbnVsbCkge1xuICAgICAgICBjb25zdCBjb25zdGFudFBvb2wgPSBuZXcgQ29uc3RhbnRQb29sKCk7XG4gICAgICAgIGNvbnN0IHNvdXJjZU1hcFVybCA9IGBuZzovLyR7dHlwZSAmJiB0eXBlLm5hbWV9L25nRGlyZWN0aXZlRGVmLmpzYDtcbiAgICAgICAgY29uc3QgcmVzID0gY29tcGlsZVIzRGlyZWN0aXZlKFxuICAgICAgICAgICAgZGlyZWN0aXZlTWV0YWRhdGEodHlwZSwgZGlyZWN0aXZlKSwgY29uc3RhbnRQb29sLCBtYWtlQmluZGluZ1BhcnNlcigpKTtcbiAgICAgICAgZGVmID0gaml0RXhwcmVzc2lvbihyZXMuZXhwcmVzc2lvbiwgYW5ndWxhckNvcmVFbnYsIHNvdXJjZU1hcFVybCwgY29uc3RhbnRQb29sKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZWY7XG4gICAgfSxcbiAgfSk7XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEEgd3JhcHBlciBhcm91bmQgYGNvbXBpbGVDb21wb25lbnRgIHdoaWNoIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgZm9yIHRoZSBgQENvbXBvbmVudGAgZGVjb3JhdG9yLlxuICpcbiAqIFRoaXMgd3JhcHBlciBrZWVwcyB0cmFjayBvZiB0aGUgYFByb21pc2VgIHJldHVybmVkIGJ5IGBjb21waWxlQ29tcG9uZW50YCBhbmQgd2lsbCBjYXVzZVxuICogYGF3YWl0Q3VycmVudGx5Q29tcGlsaW5nQ29tcG9uZW50c2AgdG8gd2FpdCBvbiB0aGUgY29tcGlsYXRpb24gdG8gYmUgZmluaXNoZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlQ29tcG9uZW50RGVjb3JhdG9yKHR5cGU6IFR5cGU8YW55PiwgbWV0YWRhdGE6IENvbXBvbmVudCk6IHZvaWQge1xuICBjb25zdCByZXMgPSBjb21waWxlQ29tcG9uZW50KHR5cGUsIG1ldGFkYXRhKTtcbiAgaWYgKHJlcyAhPT0gbnVsbCkge1xuICAgIF9wZW5kaW5nUHJvbWlzZXMucHVzaChyZXMpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhIHByb21pc2Ugd2hpY2ggd2lsbCBhd2FpdCB0aGUgY29tcGlsYXRpb24gb2YgYW55IGBAQ29tcG9uZW50YHMgd2hpY2ggaGF2ZSBiZWVuIGRlZmluZWRcbiAqIHNpbmNlIHRoZSBsYXN0IHRpbWUgYGF3YWl0Q3VycmVudGx5Q29tcGlsaW5nQ29tcG9uZW50c2Agd2FzIGNhbGxlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF3YWl0Q3VycmVudGx5Q29tcGlsaW5nQ29tcG9uZW50cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgcmVzID0gUHJvbWlzZS5hbGwoX3BlbmRpbmdQcm9taXNlcykudGhlbigoKSA9PiB1bmRlZmluZWQpO1xuICBfcGVuZGluZ1Byb21pc2VzID0gW107XG4gIHJldHVybiByZXM7XG59XG5cbi8qKlxuICogRXh0cmFjdCB0aGUgYFIzRGlyZWN0aXZlTWV0YWRhdGFgIGZvciBhIHBhcnRpY3VsYXIgZGlyZWN0aXZlIChlaXRoZXIgYSBgRGlyZWN0aXZlYCBvciBhXG4gKiBgQ29tcG9uZW50YCkuXG4gKi9cbmZ1bmN0aW9uIGRpcmVjdGl2ZU1ldGFkYXRhKHR5cGU6IFR5cGU8YW55PiwgbWV0YWRhdGE6IERpcmVjdGl2ZSk6IFIzRGlyZWN0aXZlTWV0YWRhdGEge1xuICAvLyBSZWZsZWN0IGlucHV0cyBhbmQgb3V0cHV0cy5cbiAgY29uc3QgcHJvcHMgPSBnZXRSZWZsZWN0KCkucHJvcE1ldGFkYXRhKHR5cGUpO1xuICBjb25zdCBpbnB1dHM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG4gIGNvbnN0IG91dHB1dHM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG5cbiAgZm9yIChsZXQgZmllbGQgaW4gcHJvcHMpIHtcbiAgICBwcm9wc1tmaWVsZF0uZm9yRWFjaChhbm4gPT4ge1xuICAgICAgaWYgKGlzSW5wdXQoYW5uKSkge1xuICAgICAgICBpbnB1dHNbZmllbGRdID0gYW5uLmJpbmRpbmdQcm9wZXJ0eU5hbWUgfHwgZmllbGQ7XG4gICAgICB9IGVsc2UgaWYgKGlzT3V0cHV0KGFubikpIHtcbiAgICAgICAgb3V0cHV0c1tmaWVsZF0gPSBhbm4uYmluZGluZ1Byb3BlcnR5TmFtZSB8fCBmaWVsZDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgbmFtZTogdHlwZS5uYW1lLFxuICAgIHR5cGU6IG5ldyBXcmFwcGVkTm9kZUV4cHIodHlwZSksXG4gICAgc2VsZWN0b3I6IG1ldGFkYXRhLnNlbGVjdG9yICEsXG4gICAgZGVwczogcmVmbGVjdERlcGVuZGVuY2llcyh0eXBlKSxcbiAgICBob3N0OiB7XG4gICAgICBhdHRyaWJ1dGVzOiB7fSxcbiAgICAgIGxpc3RlbmVyczoge30sXG4gICAgICBwcm9wZXJ0aWVzOiB7fSxcbiAgICB9LFxuICAgIGlucHV0cyxcbiAgICBvdXRwdXRzLFxuICAgIHF1ZXJpZXM6IFtdLFxuICAgIGxpZmVjeWNsZToge1xuICAgICAgdXNlc09uQ2hhbmdlczogdHlwZS5wcm90b3R5cGUubmdPbkNoYW5nZXMgIT09IHVuZGVmaW5lZCxcbiAgICB9LFxuICAgIHR5cGVTb3VyY2VTcGFuOiBudWxsICEsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGlzSW5wdXQodmFsdWU6IGFueSk6IHZhbHVlIGlzIElucHV0IHtcbiAgcmV0dXJuIHZhbHVlLm5nTWV0YWRhdGFOYW1lID09PSAnSW5wdXQnO1xufVxuXG5mdW5jdGlvbiBpc091dHB1dCh2YWx1ZTogYW55KTogdmFsdWUgaXMgT3V0cHV0IHtcbiAgcmV0dXJuIHZhbHVlLm5nTWV0YWRhdGFOYW1lID09PSAnT3V0cHV0Jztcbn1cbiJdfQ==