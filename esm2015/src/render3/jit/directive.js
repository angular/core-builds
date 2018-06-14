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
let _pendingPromises = [];
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
    const templateStr = metadata.template;
    let def = null;
    Object.defineProperty(type, NG_COMPONENT_DEF, {
        get: () => {
            if (def === null) {
                // The ConstantPool is a requirement of the JIT'er.
                const constantPool = new ConstantPool();
                // Parse the template and check for errors.
                const template = parseTemplate(templateStr, `ng://${type.name}/template.html`, {
                    preserveWhitespaces: metadata.preserveWhitespaces || false,
                });
                if (template.errors !== undefined) {
                    const errors = template.errors.map(err => err.toString()).join(', ');
                    throw new Error(`Errors during JIT compilation of template for ${type.name}: ${errors}`);
                }
                // Compile the component metadata, including template, into an expression.
                // TODO(alxhub): implement inputs, outputs, queries, etc.
                const res = compileR3Component(Object.assign({}, directiveMetadata(type, metadata), { template, directives: new Map(), pipes: new Map(), viewQueries: [] }), constantPool, makeBindingParser());
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
    let def = null;
    Object.defineProperty(type, NG_DIRECTIVE_DEF, {
        get: () => {
            if (def === null) {
                const constantPool = new ConstantPool();
                const sourceMapUrl = `ng://${type && type.name}/ngDirectiveDef.js`;
                const res = compileR3Directive(directiveMetadata(type, directive), constantPool, makeBindingParser());
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
    const res = compileComponent(type, metadata);
    if (res !== null) {
        _pendingPromises.push(res);
    }
}
/**
 * Returns a promise which will await the compilation of any `@Component`s which have been defined
 * since the last time `awaitCurrentlyCompilingComponents` was called.
 */
export function awaitCurrentlyCompilingComponents() {
    const res = Promise.all(_pendingPromises).then(() => undefined);
    _pendingPromises = [];
    return res;
}
/**
 * Extract the `R3DirectiveMetadata` for a particular directive (either a `Directive` or a
 * `Component`).
 */
function directiveMetadata(type, metadata) {
    // Reflect inputs and outputs.
    const propMetadata = getReflect().propMetadata(type);
    const inputs = {};
    const outputs = {};
    const host = extractHostBindings(metadata, propMetadata);
    for (let field in propMetadata) {
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
        selector: metadata.selector,
        deps: reflectDependencies(type), host, inputs, outputs,
        queries: [],
        lifecycle: {
            usesOnChanges: type.prototype.ngOnChanges !== undefined,
        },
        typeSourceSpan: null,
    };
}
function extractHostBindings(metadata, propMetadata) {
    // First parse the declarations from the metadata.
    const { attributes, listeners, properties, animations } = parseHostBindings(metadata.host || {});
    if (Object.keys(animations).length > 0) {
        throw new Error(`Animation bindings are as-of-yet unsupported in Ivy`);
    }
    // Next, loop over the properties of the object, looking for @HostBinding and @HostListener.
    for (let field in propMetadata) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQXVCLGVBQWUsRUFBRSw0QkFBNEIsSUFBSSxrQkFBa0IsRUFBRSw0QkFBNEIsSUFBSSxrQkFBa0IsRUFBRSxhQUFhLEVBQUUsaUJBQWlCLEVBQUUsaUJBQWlCLEVBQUUsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFNalEsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM3QyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDNUQsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3BELE9BQU8sRUFBQyxVQUFVLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFdkQsSUFBSSxnQkFBZ0IsR0FBb0IsRUFBRSxDQUFDO0FBTTNDOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSwyQkFBMkIsSUFBZSxFQUFFLFFBQW1CO0lBQ25FLDJFQUEyRTtJQUMzRSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRTtRQUN0QixNQUFNLElBQUksS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUM7S0FDbEQ7SUFDRCxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDO0lBRXRDLElBQUksR0FBRyxHQUFRLElBQUksQ0FBQztJQUNwQixNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtRQUM1QyxHQUFHLEVBQUUsR0FBRyxFQUFFO1lBQ1IsSUFBSSxHQUFHLEtBQUssSUFBSSxFQUFFO2dCQUNoQixtREFBbUQ7Z0JBQ25ELE1BQU0sWUFBWSxHQUFH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QUVELGlCQUFpQixLQUFVO0lBQ3pCLE9BQU8sS0FBSyxDQUFDLGNBQWMsS0FBSyxPQUFPLENBQUM7QUFDMUMsQ0FBQztBQUVELGtCQUFrQixLQUFVO0lBQzFCLE9BQU8sS0FBSyxDQUFDLGNBQWMsS0FBSyxRQUFRLENBQUM7QUFDM0MsQ0FBQztBQUVELHVCQUF1QixLQUFVO0lBQy9CLE9BQU8sS0FBSyxDQUFDLGNBQWMsS0FBSyxhQUFhLENBQUM7QUFDaEQsQ0FBQztBQUVELHdCQUF3QixLQUFVO0lBQ2hDLE9BQU8sS0FBSyxDQUFDLGNBQWMsS0FBSyxjQUFjLENBQUM7QUFDakQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDb25zdGFudFBvb2wsIFIzRGlyZWN0aXZlTWV0YWRhdGEsIFdyYXBwZWROb2RlRXhwciwgY29tcGlsZUNvbXBvbmVudEZyb21NZXRhZGF0YSBhcyBjb21waWxlUjNDb21wb25lbnQsIGNvbXBpbGVEaXJlY3RpdmVGcm9tTWV0YWRhdGEgYXMgY29tcGlsZVIzRGlyZWN0aXZlLCBqaXRFeHByZXNzaW9uLCBtYWtlQmluZGluZ1BhcnNlciwgcGFyc2VIb3N0QmluZGluZ3MsIHBhcnNlVGVtcGxhdGV9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcblxuaW1wb3J0IHtDb21wb25lbnQsIERpcmVjdGl2ZSwgSG9zdEJpbmRpbmcsIEhvc3RMaXN0ZW5lciwgSW5wdXQsIE91dHB1dH0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvZGlyZWN0aXZlcyc7XG5pbXBvcnQge1JlZmxlY3Rpb25DYXBhYmlsaXRpZXN9IGZyb20gJy4uLy4uL3JlZmxlY3Rpb24vcmVmbGVjdGlvbl9jYXBhYmlsaXRpZXMnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi90eXBlJztcblxuaW1wb3J0IHthbmd1bGFyQ29yZUVudn0gZnJvbSAnLi9lbnZpcm9ubWVudCc7XG5pbXBvcnQge05HX0NPTVBPTkVOVF9ERUYsIE5HX0RJUkVDVElWRV9ERUZ9IGZyb20gJy4vZmllbGRzJztcbmltcG9ydCB7cGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGV9IGZyb20gJy4vbW9kdWxlJztcbmltcG9ydCB7Z2V0UmVmbGVjdCwgcmVmbGVjdERlcGVuZGVuY2llc30gZnJvbSAnLi91dGlsJztcblxubGV0IF9wZW5kaW5nUHJvbWlzZXM6IFByb21pc2U8dm9pZD5bXSA9IFtdO1xuXG50eXBlIFN0cmluZ01hcCA9IHtcbiAgW2tleTogc3RyaW5nXTogc3RyaW5nXG59O1xuXG4vKipcbiAqIENvbXBpbGUgYW4gQW5ndWxhciBjb21wb25lbnQgYWNjb3JkaW5nIHRvIGl0cyBkZWNvcmF0b3IgbWV0YWRhdGEsIGFuZCBwYXRjaCB0aGUgcmVzdWx0aW5nXG4gKiBuZ0NvbXBvbmVudERlZiBvbnRvIHRoZSBjb21wb25lbnQgdHlwZS5cbiAqXG4gKiBDb21waWxhdGlvbiBtYXkgYmUgYXN5bmNocm9ub3VzIChkdWUgdG8gdGhlIG5lZWQgdG8gcmVzb2x2ZSBVUkxzIGZvciB0aGUgY29tcG9uZW50IHRlbXBsYXRlIG9yXG4gKiBvdGhlciByZXNvdXJjZXMsIGZvciBleGFtcGxlKS4gSW4gdGhlIGV2ZW50IHRoYXQgY29tcGlsYXRpb24gaXMgbm90IGltbWVkaWF0ZSwgYGNvbXBpbGVDb21wb25lbnRgXG4gKiB3aWxsIHJldHVybiBhIGBQcm9taXNlYCB3aGljaCB3aWxsIHJlc29sdmUgd2hlbiBjb21waWxhdGlvbiBjb21wbGV0ZXMgYW5kIHRoZSBjb21wb25lbnQgYmVjb21lc1xuICogdXNhYmxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZUNvbXBvbmVudCh0eXBlOiBUeXBlPGFueT4sIG1ldGFkYXRhOiBDb21wb25lbnQpOiBQcm9taXNlPHZvaWQ+fG51bGwge1xuICAvLyBUT0RPKGFseGh1Yik6IGltcGxlbWVudCBSZXNvdXJjZUxvYWRlciBzdXBwb3J0IGZvciB0ZW1wbGF0ZSBjb21waWxhdGlvbi5cbiAgaWYgKCFtZXRhZGF0YS50ZW1wbGF0ZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigndGVtcGxhdGVVcmwgbm90IHlldCBzdXBwb3J0ZWQnKTtcbiAgfVxuICBjb25zdCB0ZW1wbGF0ZVN0ciA9IG1ldGFkYXRhLnRlbXBsYXRlO1xuXG4gIGxldCBkZWY6IGFueSA9IG51bGw7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBOR19DT01QT05FTlRfREVGLCB7XG4gICAgZ2V0OiAoKSA9PiB7XG4gICAgICBpZiAoZGVmID09PSBudWxsKSB7XG4gICAgICAgIC8vIFRoZSBDb25zdGFudFBvb2wgaXMgYSByZXF1aXJlbWVudCBvZiB0aGUgSklUJ2VyLlxuICAgICAgICBjb25zdCBjb25zdGFudFBvb2wgPSBuZXcgQ29uc3RhbnRQb29sKCk7XG5cbiAgICAgICAgLy8gUGFyc2UgdGhlIHRlbXBsYXRlIGFuZCBjaGVjayBmb3IgZXJyb3JzLlxuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IHBhcnNlVGVtcGxhdGUodGVtcGxhdGVTdHIsIGBuZzovLyR7dHlwZS5uYW1lfS90ZW1wbGF0ZS5odG1sYCwge1xuICAgICAgICAgIHByZXNlcnZlV2hpdGVzcGFjZXM6IG1ldGFkYXRhLnByZXNlcnZlV2hpdGVzcGFjZXMgfHwgZmFsc2UsXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGVtcGxhdGUuZXJyb3JzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBjb25zdCBlcnJvcnMgPSB0ZW1wbGF0ZS5lcnJvcnMubWFwKGVyciA9PiBlcnIudG9TdHJpbmcoKSkuam9pbignLCAnKTtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9ycyBkdXJpbmcgSklUIGNvbXBpbGF0aW9uIG9mIHRlbXBsYXRlIGZvciAke3R5cGUubmFtZX06ICR7ZXJyb3JzfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ29tcGlsZSB0aGUgY29tcG9uZW50IG1ldGFkYXRhLCBpbmNsdWRpbmcgdGVtcGxhdGUsIGludG8gYW4gZXhwcmVzc2lvbi5cbiAgICAgICAgLy8gVE9ETyhhbHhodWIpOiBpbXBsZW1lbnQgaW5wdXRzLCBvdXRwdXRzLCBxdWVyaWVzLCBldGMuXG4gICAgICAgIGNvbnN0IHJlcyA9IGNvbXBpbGVSM0NvbXBvbmVudChcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgLi4uZGlyZWN0aXZlTWV0YWRhdGEodHlwZSwgbWV0YWRhdGEpLFxuICAgICAgICAgICAgICB0ZW1wbGF0ZSxcbiAgICAgICAgICAgICAgZGlyZWN0aXZlczogbmV3IE1hcCgpLFxuICAgICAgICAgICAgICBwaXBlczogbmV3IE1hcCgpLFxuICAgICAgICAgICAgICB2aWV3UXVlcmllczogW10sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29uc3RhbnRQb29sLCBtYWtlQmluZGluZ1BhcnNlcigpKTtcblxuICAgICAgICBkZWYgPSBqaXRFeHByZXNzaW9uKFxuICAgICAgICAgICAgcmVzLmV4cHJlc3Npb24sIGFuZ3VsYXJDb3JlRW52LCBgbmc6Ly8ke3R5cGUubmFtZX0vbmdDb21wb25lbnREZWYuanNgLCBjb25zdGFudFBvb2wpO1xuXG4gICAgICAgIC8vIElmIGNvbXBvbmVudCBjb21waWxhdGlvbiBpcyBhc3luYywgdGhlbiB0aGUgQE5nTW9kdWxlIGFubm90YXRpb24gd2hpY2ggZGVjbGFyZXMgdGhlXG4gICAgICAgIC8vIGNvbXBvbmVudCBtYXkgZXhlY3V0ZSBhbmQgc2V0IGFuIG5nU2VsZWN0b3JTY29wZSBwcm9wZXJ0eSBvbiB0aGUgY29tcG9uZW50IHR5cGUuIFRoaXNcbiAgICAgICAgLy8gYWxsb3dzIHRoZSBjb21wb25lbnQgdG8gcGF0Y2ggaXRzZWxmIHdpdGggZGlyZWN0aXZlRGVmcyBmcm9tIHRoZSBtb2R1bGUgYWZ0ZXIgaXQgZmluaXNoZXNcbiAgICAgICAgLy8gY29tcGlsaW5nLlxuICAgICAgICBpZiAoaGFzU2VsZWN0b3JTY29wZSh0eXBlKSkge1xuICAgICAgICAgIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlKGRlZiwgdHlwZS5uZ1NlbGVjdG9yU2NvcGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZGVmO1xuICAgIH0sXG4gIH0pO1xuXG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBoYXNTZWxlY3RvclNjb3BlPFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IGNvbXBvbmVudCBpcyBUeXBlPFQ+JlxuICAgIHtuZ1NlbGVjdG9yU2NvcGU6IFR5cGU8YW55Pn0ge1xuICByZXR1cm4gKGNvbXBvbmVudCBhc3tuZ1NlbGVjdG9yU2NvcGU/OiBhbnl9KS5uZ1NlbGVjdG9yU2NvcGUgIT09IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBDb21waWxlIGFuIEFuZ3VsYXIgZGlyZWN0aXZlIGFjY29yZGluZyB0byBpdHMgZGVjb3JhdG9yIG1ldGFkYXRhLCBhbmQgcGF0Y2ggdGhlIHJlc3VsdGluZ1xuICogbmdEaXJlY3RpdmVEZWYgb250byB0aGUgY29tcG9uZW50IHR5cGUuXG4gKlxuICogSW4gdGhlIGV2ZW50IHRoYXQgY29tcGlsYXRpb24gaXMgbm90IGltbWVkaWF0ZSwgYGNvbXBpbGVEaXJlY3RpdmVgIHdpbGwgcmV0dXJuIGEgYFByb21pc2VgIHdoaWNoXG4gKiB3aWxsIHJlc29sdmUgd2hlbiBjb21waWxhdGlvbiBjb21wbGV0ZXMgYW5kIHRoZSBkaXJlY3RpdmUgYmVjb21lcyB1c2FibGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlRGlyZWN0aXZlKHR5cGU6IFR5cGU8YW55PiwgZGlyZWN0aXZlOiBEaXJlY3RpdmUpOiBQcm9taXNlPHZvaWQ+fG51bGwge1xuICBsZXQgZGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgTkdfRElSRUNUSVZFX0RFRiwge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKGRlZiA9PT0gbnVsbCkge1xuICAgICAgICBjb25zdCBjb25zdGFudFBvb2wgPSBuZXcgQ29uc3RhbnRQb29sKCk7XG4gICAgICAgIGNvbnN0IHNvdXJjZU1hcFVybCA9IGBuZzovLyR7dHlwZSAmJiB0eXBlLm5hbWV9L25nRGlyZWN0aXZlRGVmLmpzYDtcbiAgICAgICAgY29uc3QgcmVzID0gY29tcGlsZVIzRGlyZWN0aXZlKFxuICAgICAgICAgICAgZGlyZWN0aXZlTWV0YWRhdGEodHlwZSwgZGlyZWN0aXZlKSwgY29uc3RhbnRQb29sLCBtYWtlQmluZGluZ1BhcnNlcigpKTtcbiAgICAgICAgZGVmID0gaml0RXhwcmVzc2lvbihyZXMuZXhwcmVzc2lvbiwgYW5ndWxhckNvcmVFbnYsIHNvdXJjZU1hcFVybCwgY29uc3RhbnRQb29sKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZWY7XG4gICAgfSxcbiAgfSk7XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEEgd3JhcHBlciBhcm91bmQgYGNvbXBpbGVDb21wb25lbnRgIHdoaWNoIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgZm9yIHRoZSBgQENvbXBvbmVudGAgZGVjb3JhdG9yLlxuICpcbiAqIFRoaXMgd3JhcHBlciBrZWVwcyB0cmFjayBvZiB0aGUgYFByb21pc2VgIHJldHVybmVkIGJ5IGBjb21waWxlQ29tcG9uZW50YCBhbmQgd2lsbCBjYXVzZVxuICogYGF3YWl0Q3VycmVudGx5Q29tcGlsaW5nQ29tcG9uZW50c2AgdG8gd2FpdCBvbiB0aGUgY29tcGlsYXRpb24gdG8gYmUgZmluaXNoZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlQ29tcG9uZW50RGVjb3JhdG9yKHR5cGU6IFR5cGU8YW55PiwgbWV0YWRhdGE6IENvbXBvbmVudCk6IHZvaWQge1xuICBjb25zdCByZXMgPSBjb21waWxlQ29tcG9uZW50KHR5cGUsIG1ldGFkYXRhKTtcbiAgaWYgKHJlcyAhPT0gbnVsbCkge1xuICAgIF9wZW5kaW5nUHJvbWlzZXMucHVzaChyZXMpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhIHByb21pc2Ugd2hpY2ggd2lsbCBhd2FpdCB0aGUgY29tcGlsYXRpb24gb2YgYW55IGBAQ29tcG9uZW50YHMgd2hpY2ggaGF2ZSBiZWVuIGRlZmluZWRcbiAqIHNpbmNlIHRoZSBsYXN0IHRpbWUgYGF3YWl0Q3VycmVudGx5Q29tcGlsaW5nQ29tcG9uZW50c2Agd2FzIGNhbGxlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF3YWl0Q3VycmVudGx5Q29tcGlsaW5nQ29tcG9uZW50cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgcmVzID0gUHJvbWlzZS5hbGwoX3BlbmRpbmdQcm9taXNlcykudGhlbigoKSA9PiB1bmRlZmluZWQpO1xuICBfcGVuZGluZ1Byb21pc2VzID0gW107XG4gIHJldHVybiByZXM7XG59XG5cbi8qKlxuICogRXh0cmFjdCB0aGUgYFIzRGlyZWN0aXZlTWV0YWRhdGFgIGZvciBhIHBhcnRpY3VsYXIgZGlyZWN0aXZlIChlaXRoZXIgYSBgRGlyZWN0aXZlYCBvciBhXG4gKiBgQ29tcG9uZW50YCkuXG4gKi9cbmZ1bmN0aW9uIGRpcmVjdGl2ZU1ldGFkYXRhKHR5cGU6IFR5cGU8YW55PiwgbWV0YWRhdGE6IERpcmVjdGl2ZSk6IFIzRGlyZWN0aXZlTWV0YWRhdGEge1xuICAvLyBSZWZsZWN0IGlucHV0cyBhbmQgb3V0cHV0cy5cbiAgY29uc3QgcHJvcE1ldGFkYXRhID0gZ2V0UmVmbGVjdCgpLnByb3BNZXRhZGF0YSh0eXBlKTtcbiAgY29uc3QgaW5wdXRzOiBTdHJpbmdNYXAgPSB7fTtcbiAgY29uc3Qgb3V0cHV0czogU3RyaW5nTWFwID0ge307XG5cbiAgY29uc3QgaG9zdCA9IGV4dHJhY3RIb3N0QmluZGluZ3MobWV0YWRhdGEsIHByb3BNZXRhZGF0YSk7XG5cbiAgZm9yIChsZXQgZmllbGQgaW4gcHJvcE1ldGFkYXRhKSB7XG4gICAgcHJvcE1ldGFkYXRhW2ZpZWxkXS5mb3JFYWNoKGFubiA9PiB7XG4gICAgICBpZiAoaXNJbnB1dChhbm4pKSB7XG4gICAgICAgIGlucHV0c1tmaWVsZF0gPSBhbm4uYmluZGluZ1Byb3BlcnR5TmFtZSB8fCBmaWVsZDtcbiAgICAgIH0gZWxzZSBpZiAoaXNPdXRwdXQoYW5uKSkge1xuICAgICAgICBvdXRwdXRzW2ZpZWxkXSA9IGFubi5iaW5kaW5nUHJvcGVydHlOYW1lIHx8IGZpZWxkO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiB0eXBlLm5hbWUsXG4gICAgdHlwZTogbmV3IFdyYXBwZWROb2RlRXhwcih0eXBlKSxcbiAgICBzZWxlY3RvcjogbWV0YWRhdGEuc2VsZWN0b3IgISxcbiAgICBkZXBzOiByZWZsZWN0RGVwZW5kZW5jaWVzKHR5cGUpLCBob3N0LCBpbnB1dHMsIG91dHB1dHMsXG4gICAgcXVlcmllczogW10sXG4gICAgbGlmZWN5Y2xlOiB7XG4gICAgICB1c2VzT25DaGFuZ2VzOiB0eXBlLnByb3RvdHlwZS5uZ09uQ2hhbmdlcyAhPT0gdW5kZWZpbmVkLFxuICAgIH0sXG4gICAgdHlwZVNvdXJjZVNwYW46IG51bGwgISxcbiAgfTtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdEhvc3RCaW5kaW5ncyhtZXRhZGF0YTogRGlyZWN0aXZlLCBwcm9wTWV0YWRhdGE6IHtba2V5OiBzdHJpbmddOiBhbnlbXX0pOiB7XG4gIGF0dHJpYnV0ZXM6IFN0cmluZ01hcCxcbiAgbGlzdGVuZXJzOiBTdHJpbmdNYXAsXG4gIHByb3BlcnRpZXM6IFN0cmluZ01hcCxcbn0ge1xuICAvLyBGaXJzdCBwYXJzZSB0aGUgZGVjbGFyYXRpb25zIGZyb20gdGhlIG1ldGFkYXRhLlxuICBjb25zdCB7YXR0cmlidXRlcywgbGlzdGVuZXJzLCBwcm9wZXJ0aWVzLCBhbmltYXRpb25zfSA9IHBhcnNlSG9zdEJpbmRpbmdzKG1ldGFkYXRhLmhvc3QgfHwge30pO1xuXG4gIGlmIChPYmplY3Qua2V5cyhhbmltYXRpb25zKS5sZW5ndGggPiAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBBbmltYXRpb24gYmluZGluZ3MgYXJlIGFzLW9mLXlldCB1bnN1cHBvcnRlZCBpbiBJdnlgKTtcbiAgfVxuXG4gIC8vIE5leHQsIGxvb3Agb3ZlciB0aGUgcHJvcGVydGllcyBvZiB0aGUgb2JqZWN0LCBsb29raW5nIGZvciBASG9zdEJpbmRpbmcgYW5kIEBIb3N0TGlzdGVuZXIuXG4gIGZvciAobGV0IGZpZWxkIGluIHByb3BNZXRhZGF0YSkge1xuICAgIHByb3BNZXRhZGF0YVtmaWVsZF0uZm9yRWFjaChhbm4gPT4ge1xuICAgICAgaWYgKGlzSG9zdEJpbmRpbmcoYW5uKSkge1xuICAgICAgICBwcm9wZXJ0aWVzW2Fubi5ob3N0UHJvcGVydHlOYW1lIHx8IGZpZWxkXSA9IGZpZWxkO1xuICAgICAgfSBlbHNlIGlmIChpc0hvc3RMaXN0ZW5lcihhbm4pKSB7XG4gICAgICAgIGxpc3RlbmVyc1thbm4uZXZlbnROYW1lIHx8IGZpZWxkXSA9IGAke2ZpZWxkfSgkeyhhbm4uYXJncyB8fCBbXSkuam9pbignLCcpfSlgO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHthdHRyaWJ1dGVzLCBsaXN0ZW5lcnMsIHByb3BlcnRpZXN9O1xufVxuXG5mdW5jdGlvbiBpc0lucHV0KHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBJbnB1dCB7XG4gIHJldHVybiB2YWx1ZS5uZ01ldGFkYXRhTmFtZSA9PT0gJ0lucHV0Jztcbn1cblxuZnVuY3Rpb24gaXNPdXRwdXQodmFsdWU6IGFueSk6IHZhbHVlIGlzIE91dHB1dCB7XG4gIHJldHVybiB2YWx1ZS5uZ01ldGFkYXRhTmFtZSA9PT0gJ091dHB1dCc7XG59XG5cbmZ1bmN0aW9uIGlzSG9zdEJpbmRpbmcodmFsdWU6IGFueSk6IHZhbHVlIGlzIEhvc3RCaW5kaW5nIHtcbiAgcmV0dXJuIHZhbHVlLm5nTWV0YWRhdGFOYW1lID09PSAnSG9zdEJpbmRpbmcnO1xufVxuXG5mdW5jdGlvbiBpc0hvc3RMaXN0ZW5lcih2YWx1ZTogYW55KTogdmFsdWUgaXMgSG9zdExpc3RlbmVyIHtcbiAgcmV0dXJuIHZhbHVlLm5nTWV0YWRhdGFOYW1lID09PSAnSG9zdExpc3RlbmVyJztcbn1cbiJdfQ==