/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
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
    let ngComponentDef = null;
    // Metadata may have resources which need to be resolved.
    maybeQueueResolutionOfComponentResources(metadata);
    Object.defineProperty(type, NG_COMPONENT_DEF, {
        get: () => {
            if (ngComponentDef === null) {
                if (componentNeedsResolution(metadata)) {
                    const error = [`Component '${stringify(type)}' is not resolved:`];
                    if (metadata.templateUrl) {
                        error.push(` - templateUrl: ${stringify(metadata.templateUrl)}`);
                    }
                    if (metadata.styleUrls && metadata.styleUrls.length) {
                        error.push(` - styleUrls: ${JSON.stringify(metadata.styleUrls)}`);
                    }
                    error.push(`Did you run and wait for 'resolveComponentResources()'?`);
                    throw new Error(error.join('\n'));
                }
                // The ConstantPool is a requirement of the JIT'er.
                const constantPool = new ConstantPool();
                // Parse the template and check for errors.
                const template = parseTemplate(metadata.template, `ng://${stringify(type)}/template.html`, {
                    preserveWhitespaces: metadata.preserveWhitespaces || false,
                }, '');
                if (template.errors !== undefined) {
                    const errors = template.errors.map(err => err.toString()).join(', ');
                    throw new Error(`Errors during JIT compilation of template for ${stringify(type)}: ${errors}`);
                }
                // Compile the component metadata, including template, into an expression.
                // TODO(alxhub): implement inputs, outputs, queries, etc.
                const res = compileR3Component(Object.assign({}, directiveMetadata(type, metadata), { template, directives: new Map(), pipes: new Map(), viewQueries: [], wrapDirectivesInClosure: false, styles: metadata.styles || [], encapsulation: metadata.encapsulation || ViewEncapsulation.Emulated }), constantPool, makeBindingParser());
                const preStatements = [...constantPool.statements, ...res.statements];
                ngComponentDef = jitExpression(res.expression, angularCoreEnv, `ng://${type.name}/ngComponentDef.js`, preStatements);
                // If component compilation is async, then the @NgModule annotation which declares the
                // component may execute and set an ngSelectorScope property on the component type. This
                // allows the component to patch itself with directiveDefs from the module after it
                // finishes compiling.
                if (hasSelectorScope(type)) {
                    const scopes = transitiveScopesFor(type.ngSelectorScope);
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
    let ngDirectiveDef = null;
    Object.defineProperty(type, NG_DIRECTIVE_DEF, {
        get: () => {
            if (ngDirectiveDef === null) {
                const constantPool = new ConstantPool();
                const sourceMapUrl = `ng://${type && type.name}/ngDirectiveDef.js`;
                const res = compileR3Directive(directiveMetadata(type, directive), constantPool, makeBindingParser());
                const preStatements = [...constantPool.statements, ...res.statements];
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
    const propMetadata = getReflect().propMetadata(type);
    const host = extractHostBindings(metadata, propMetadata);
    const inputsFromMetadata = parseInputOutputs(metadata.inputs || []);
    const outputsFromMetadata = parseInputOutputs(metadata.outputs || []);
    const inputsFromType = {};
    const outputsFromType = {};
    for (const field in propMetadata) {
        if (propMetadata.hasOwnProperty(field)) {
            propMetadata[field].forEach(ann => {
                if (isInput(ann)) {
                    inputsFromType[field] = ann.bindingPropertyName || field;
                }
                else if (isOutput(ann)) {
                    outputsFromType[field] = ann.bindingPropertyName || field;
                }
            });
        }
    }
    return {
        name: type.name,
        type: new WrappedNodeExpr(type),
        typeArgumentCount: 0,
        selector: metadata.selector,
        deps: reflectDependencies(type), host,
        inputs: Object.assign({}, inputsFromMetadata, inputsFromType),
        outputs: Object.assign({}, outputsFromMetadata, outputsFromType),
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
    const { attributes, listeners, properties, animations } = parseHostBindings(metadata.host || {});
    if (Object.keys(animations).length > 0) {
        throw new Error(`Animation bindings are as-of-yet unsupported in Ivy`);
    }
    // Next, loop over the properties of the object, looking for @HostBinding and @HostListener.
    for (const field in propMetadata) {
        if (propMetadata.hasOwnProperty(field)) {
            propMetadata[field].forEach(ann => {
                if (isHostBinding(ann)) {
                    properties[ann.hostPropertyName || field] = field;
                }
                else if (isHostListener(ann)) {
                    listeners[ann.eventName || field] = `${field}(${(ann.args || []).join(',')})`;
                }
            });
        }
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
function parseInputOutputs(values) {
    return values.reduce((map, value) => {
        const [field, property] = value.split(',').map(piece => piece.trim());
        map[field] = property || field;
        return map;
    }, {});
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQXVCLGVBQWUsRUFBRSw0QkFBNEIsSUFBSSxrQkFBa0IsRUFBRSw0QkFBNEIsSUFBSSxrQkFBa0IsRUFBRSxhQUFhLEVBQUUsaUJBQWlCLEVBQUUsaUJBQWlCLEVBQUUsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFHalEsT0FBTyxFQUFDLHdCQUF3QixFQUFFLHdDQUF3QyxFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDbkgsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFdEQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUVyQyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM1RCxPQUFPLEVBQUMsMEJBQTBCLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDekUsT0FBTyxFQUFDLFVBQVUsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQU12RDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxJQUFlLEVBQUUsUUFBbUI7SUFDbkUsSUFBSSxjQUFjLEdBQVEsSUFBSSxDQUFDO0lBQy9CLHlEQUF5RDtJQUN6RCx3Q0FBd0MsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNuRCxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtRQUM1QyxHQUFHLEVBQUUsR0FBRyxFQUFFO1lBQ1IsSUFBSSxjQUFjLEtBQUssSUFBSSxF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dXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDb25zdGFudFBvb2wsIFIzRGlyZWN0aXZlTWV0YWRhdGEsIFdyYXBwZWROb2RlRXhwciwgY29tcGlsZUNvbXBvbmVudEZyb21NZXRhZGF0YSBhcyBjb21waWxlUjNDb21wb25lbnQsIGNvbXBpbGVEaXJlY3RpdmVGcm9tTWV0YWRhdGEgYXMgY29tcGlsZVIzRGlyZWN0aXZlLCBqaXRFeHByZXNzaW9uLCBtYWtlQmluZGluZ1BhcnNlciwgcGFyc2VIb3N0QmluZGluZ3MsIHBhcnNlVGVtcGxhdGV9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcblxuaW1wb3J0IHtDb21wb25lbnQsIERpcmVjdGl2ZSwgSG9zdEJpbmRpbmcsIEhvc3RMaXN0ZW5lciwgSW5wdXQsIE91dHB1dH0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvZGlyZWN0aXZlcyc7XG5pbXBvcnQge2NvbXBvbmVudE5lZWRzUmVzb2x1dGlvbiwgbWF5YmVRdWV1ZVJlc29sdXRpb25PZkNvbXBvbmVudFJlc291cmNlc30gZnJvbSAnLi4vLi4vbWV0YWRhdGEvcmVzb3VyY2VfbG9hZGluZyc7XG5pbXBvcnQge1ZpZXdFbmNhcHN1bGF0aW9ufSBmcm9tICcuLi8uLi9tZXRhZGF0YS92aWV3JztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vdHlwZSc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vLi4vdXRpbCc7XG5cbmltcG9ydCB7YW5ndWxhckNvcmVFbnZ9IGZyb20gJy4vZW52aXJvbm1lbnQnO1xuaW1wb3J0IHtOR19DT01QT05FTlRfREVGLCBOR19ESVJFQ1RJVkVfREVGfSBmcm9tICcuL2ZpZWxkcyc7XG5pbXBvcnQge3BhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlLCB0cmFuc2l0aXZlU2NvcGVzRm9yfSBmcm9tICcuL21vZHVsZSc7XG5pbXBvcnQge2dldFJlZmxlY3QsIHJlZmxlY3REZXBlbmRlbmNpZXN9IGZyb20gJy4vdXRpbCc7XG5cbnR5cGUgU3RyaW5nTWFwID0ge1xuICBba2V5OiBzdHJpbmddOiBzdHJpbmdcbn07XG5cbi8qKlxuICogQ29tcGlsZSBhbiBBbmd1bGFyIGNvbXBvbmVudCBhY2NvcmRpbmcgdG8gaXRzIGRlY29yYXRvciBtZXRhZGF0YSwgYW5kIHBhdGNoIHRoZSByZXN1bHRpbmdcbiAqIG5nQ29tcG9uZW50RGVmIG9udG8gdGhlIGNvbXBvbmVudCB0eXBlLlxuICpcbiAqIENvbXBpbGF0aW9uIG1heSBiZSBhc3luY2hyb25vdXMgKGR1ZSB0byB0aGUgbmVlZCB0byByZXNvbHZlIFVSTHMgZm9yIHRoZSBjb21wb25lbnQgdGVtcGxhdGUgb3JcbiAqIG90aGVyIHJlc291cmNlcywgZm9yIGV4YW1wbGUpLiBJbiB0aGUgZXZlbnQgdGhhdCBjb21waWxhdGlvbiBpcyBub3QgaW1tZWRpYXRlLCBgY29tcGlsZUNvbXBvbmVudGBcbiAqIHdpbGwgZW5xdWV1ZSByZXNvdXJjZSByZXNvbHV0aW9uIGludG8gYSBnbG9iYWwgcXVldWUgYW5kIHdpbGwgZmFpbCB0byByZXR1cm4gdGhlIGBuZ0NvbXBvbmVudERlZmBcbiAqIHVudGlsIHRoZSBnbG9iYWwgcXVldWUgaGFzIGJlZW4gcmVzb2x2ZWQgd2l0aCBhIGNhbGwgdG8gYHJlc29sdmVDb21wb25lbnRSZXNvdXJjZXNgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZUNvbXBvbmVudCh0eXBlOiBUeXBlPGFueT4sIG1ldGFkYXRhOiBDb21wb25lbnQpOiB2b2lkIHtcbiAgbGV0IG5nQ29tcG9uZW50RGVmOiBhbnkgPSBudWxsO1xuICAvLyBNZXRhZGF0YSBtYXkgaGF2ZSByZXNvdXJjZXMgd2hpY2ggbmVlZCB0byBiZSByZXNvbHZlZC5cbiAgbWF5YmVRdWV1ZVJlc29sdXRpb25PZkNvbXBvbmVudFJlc291cmNlcyhtZXRhZGF0YSk7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBOR19DT01QT05FTlRfREVGLCB7XG4gICAgZ2V0OiAoKSA9PiB7XG4gICAgICBpZiAobmdDb21wb25lbnREZWYgPT09IG51bGwpIHtcbiAgICAgICAgaWYgKGNvbXBvbmVudE5lZWRzUmVzb2x1dGlvbihtZXRhZGF0YSkpIHtcbiAgICAgICAgICBjb25zdCBlcnJvciA9IFtgQ29tcG9uZW50ICcke3N0cmluZ2lmeSh0eXBlKX0nIGlzIG5vdCByZXNvbHZlZDpgXTtcbiAgICAgICAgICBpZiAobWV0YWRhdGEudGVtcGxhdGVVcmwpIHtcbiAgICAgICAgICAgIGVycm9yLnB1c2goYCAtIHRlbXBsYXRlVXJsOiAke3N0cmluZ2lmeShtZXRhZGF0YS50ZW1wbGF0ZVVybCl9YCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChtZXRhZGF0YS5zdHlsZVVybHMgJiYgbWV0YWRhdGEuc3R5bGVVcmxzLmxlbmd0aCkge1xuICAgICAgICAgICAgZXJyb3IucHVzaChgIC0gc3R5bGVVcmxzOiAke0pTT04uc3RyaW5naWZ5KG1ldGFkYXRhLnN0eWxlVXJscyl9YCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVycm9yLnB1c2goYERpZCB5b3UgcnVuIGFuZCB3YWl0IGZvciAncmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcygpJz9gKTtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3Iuam9pbignXFxuJykpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoZSBDb25zdGFudFBvb2wgaXMgYSByZXF1aXJlbWVudCBvZiB0aGUgSklUJ2VyLlxuICAgICAgICBjb25zdCBjb25zdGFudFBvb2wgPSBuZXcgQ29uc3RhbnRQb29sKCk7XG5cbiAgICAgICAgLy8gUGFyc2UgdGhlIHRlbXBsYXRlIGFuZCBjaGVjayBmb3IgZXJyb3JzLlxuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IHBhcnNlVGVtcGxhdGUoXG4gICAgICAgICAgICBtZXRhZGF0YS50ZW1wbGF0ZSAhLCBgbmc6Ly8ke3N0cmluZ2lmeSh0eXBlKX0vdGVtcGxhdGUuaHRtbGAsIHtcbiAgICAgICAgICAgICAgcHJlc2VydmVXaGl0ZXNwYWNlczogbWV0YWRhdGEucHJlc2VydmVXaGl0ZXNwYWNlcyB8fCBmYWxzZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnJyk7XG4gICAgICAgIGlmICh0ZW1wbGF0ZS5lcnJvcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGNvbnN0IGVycm9ycyA9IHRlbXBsYXRlLmVycm9ycy5tYXAoZXJyID0+IGVyci50b1N0cmluZygpKS5qb2luKCcsICcpO1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgYEVycm9ycyBkdXJpbmcgSklUIGNvbXBpbGF0aW9uIG9mIHRlbXBsYXRlIGZvciAke3N0cmluZ2lmeSh0eXBlKX06ICR7ZXJyb3JzfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ29tcGlsZSB0aGUgY29tcG9uZW50IG1ldGFkYXRhLCBpbmNsdWRpbmcgdGVtcGxhdGUsIGludG8gYW4gZXhwcmVzc2lvbi5cbiAgICAgICAgLy8gVE9ETyhhbHhodWIpOiBpbXBsZW1lbnQgaW5wdXRzLCBvdXRwdXRzLCBxdWVyaWVzLCBldGMuXG4gICAgICAgIGNvbnN0IHJlcyA9IGNvbXBpbGVSM0NvbXBvbmVudChcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgLi4uZGlyZWN0aXZlTWV0YWRhdGEodHlwZSwgbWV0YWRhdGEpLFxuICAgICAgICAgICAgICB0ZW1wbGF0ZSxcbiAgICAgICAgICAgICAgZGlyZWN0aXZlczogbmV3IE1hcCgpLFxuICAgICAgICAgICAgICBwaXBlczogbmV3IE1hcCgpLFxuICAgICAgICAgICAgICB2aWV3UXVlcmllczogW10sXG4gICAgICAgICAgICAgIHdyYXBEaXJlY3RpdmVzSW5DbG9zdXJlOiBmYWxzZSxcbiAgICAgICAgICAgICAgc3R5bGVzOiBtZXRhZGF0YS5zdHlsZXMgfHwgW10sXG4gICAgICAgICAgICAgIGVuY2Fwc3VsYXRpb246IG1ldGFkYXRhLmVuY2Fwc3VsYXRpb24gfHwgVmlld0VuY2Fwc3VsYXRpb24uRW11bGF0ZWRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb25zdGFudFBvb2wsIG1ha2VCaW5kaW5nUGFyc2VyKCkpO1xuICAgICAgICBjb25zdCBwcmVTdGF0ZW1lbnRzID0gWy4uLmNvbnN0YW50UG9vbC5zdGF0ZW1lbnRzLCAuLi5yZXMuc3RhdGVtZW50c107XG5cbiAgICAgICAgbmdDb21wb25lbnREZWYgPSBqaXRFeHByZXNzaW9uKFxuICAgICAgICAgICAgcmVzLmV4cHJlc3Npb24sIGFuZ3VsYXJDb3JlRW52LCBgbmc6Ly8ke3R5cGUubmFtZX0vbmdDb21wb25lbnREZWYuanNgLCBwcmVTdGF0ZW1lbnRzKTtcblxuICAgICAgICAvLyBJZiBjb21wb25lbnQgY29tcGlsYXRpb24gaXMgYXN5bmMsIHRoZW4gdGhlIEBOZ01vZHVsZSBhbm5vdGF0aW9uIHdoaWNoIGRlY2xhcmVzIHRoZVxuICAgICAgICAvLyBjb21wb25lbnQgbWF5IGV4ZWN1dGUgYW5kIHNldCBhbiBuZ1NlbGVjdG9yU2NvcGUgcHJvcGVydHkgb24gdGhlIGNvbXBvbmVudCB0eXBlLiBUaGlzXG4gICAgICAgIC8vIGFsbG93cyB0aGUgY29tcG9uZW50IHRvIHBhdGNoIGl0c2VsZiB3aXRoIGRpcmVjdGl2ZURlZnMgZnJvbSB0aGUgbW9kdWxlIGFmdGVyIGl0XG4gICAgICAgIC8vIGZpbmlzaGVzIGNvbXBpbGluZy5cbiAgICAgICAgaWYgKGhhc1NlbGVjdG9yU2NvcGUodHlwZSkpIHtcbiAgICAgICAgICBjb25zdCBzY29wZXMgPSB0cmFuc2l0aXZlU2NvcGVzRm9yKHR5cGUubmdTZWxlY3RvclNjb3BlKTtcbiAgICAgICAgICBwYXRjaENvbXBvbmVudERlZldpdGhTY29wZShuZ0NvbXBvbmVudERlZiwgc2NvcGVzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG5nQ29tcG9uZW50RGVmO1xuICAgIH0sXG4gICAgLy8gTWFrZSB0aGUgcHJvcGVydHkgY29uZmlndXJhYmxlIGluIGRldiBtb2RlIHRvIGFsbG93IG92ZXJyaWRpbmcgaW4gdGVzdHNcbiAgICBjb25maWd1cmFibGU6ICEhbmdEZXZNb2RlLFxuICB9KTtcbn1cblxuZnVuY3Rpb24gaGFzU2VsZWN0b3JTY29wZTxUPihjb21wb25lbnQ6IFR5cGU8VD4pOiBjb21wb25lbnQgaXMgVHlwZTxUPiZcbiAgICB7bmdTZWxlY3RvclNjb3BlOiBUeXBlPGFueT59IHtcbiAgcmV0dXJuIChjb21wb25lbnQgYXN7bmdTZWxlY3RvclNjb3BlPzogYW55fSkubmdTZWxlY3RvclNjb3BlICE9PSB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogQ29tcGlsZSBhbiBBbmd1bGFyIGRpcmVjdGl2ZSBhY2NvcmRpbmcgdG8gaXRzIGRlY29yYXRvciBtZXRhZGF0YSwgYW5kIHBhdGNoIHRoZSByZXN1bHRpbmdcbiAqIG5nRGlyZWN0aXZlRGVmIG9udG8gdGhlIGNvbXBvbmVudCB0eXBlLlxuICpcbiAqIEluIHRoZSBldmVudCB0aGF0IGNvbXBpbGF0aW9uIGlzIG5vdCBpbW1lZGlhdGUsIGBjb21waWxlRGlyZWN0aXZlYCB3aWxsIHJldHVybiBhIGBQcm9taXNlYCB3aGljaFxuICogd2lsbCByZXNvbHZlIHdoZW4gY29tcGlsYXRpb24gY29tcGxldGVzIGFuZCB0aGUgZGlyZWN0aXZlIGJlY29tZXMgdXNhYmxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZURpcmVjdGl2ZSh0eXBlOiBUeXBlPGFueT4sIGRpcmVjdGl2ZTogRGlyZWN0aXZlKTogdm9pZCB7XG4gIGxldCBuZ0RpcmVjdGl2ZURlZjogYW55ID0gbnVsbDtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIE5HX0RJUkVDVElWRV9ERUYsIHtcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChuZ0RpcmVjdGl2ZURlZiA9PT0gbnVsbCkge1xuICAgICAgICBjb25zdCBjb25zdGFudFBvb2wgPSBuZXcgQ29uc3RhbnRQb29sKCk7XG4gICAgICAgIGNvbnN0IHNvdXJjZU1hcFVybCA9IGBuZzovLyR7dHlwZSAmJiB0eXBlLm5hbWV9L25nRGlyZWN0aXZlRGVmLmpzYDtcbiAgICAgICAgY29uc3QgcmVzID0gY29tcGlsZVIzRGlyZWN0aXZlKFxuICAgICAgICAgICAgZGlyZWN0aXZlTWV0YWRhdGEodHlwZSwgZGlyZWN0aXZlKSwgY29uc3RhbnRQb29sLCBtYWtlQmluZGluZ1BhcnNlcigpKTtcbiAgICAgICAgY29uc3QgcHJlU3RhdGVtZW50cyA9IFsuLi5jb25zdGFudFBvb2wuc3RhdGVtZW50cywgLi4ucmVzLnN0YXRlbWVudHNdO1xuICAgICAgICBuZ0RpcmVjdGl2ZURlZiA9IGppdEV4cHJlc3Npb24ocmVzLmV4cHJlc3Npb24sIGFuZ3VsYXJDb3JlRW52LCBzb3VyY2VNYXBVcmwsIHByZVN0YXRlbWVudHMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5nRGlyZWN0aXZlRGVmO1xuICAgIH0sXG4gICAgLy8gTWFrZSB0aGUgcHJvcGVydHkgY29uZmlndXJhYmxlIGluIGRldiBtb2RlIHRvIGFsbG93IG92ZXJyaWRpbmcgaW4gdGVzdHNcbiAgICBjb25maWd1cmFibGU6ICEhbmdEZXZNb2RlLFxuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dGVuZHNEaXJlY3RseUZyb21PYmplY3QodHlwZTogVHlwZTxhbnk+KTogYm9vbGVhbiB7XG4gIHJldHVybiBPYmplY3QuZ2V0UHJvdG90eXBlT2YodHlwZS5wcm90b3R5cGUpID09PSBPYmplY3QucHJvdG90eXBlO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdGhlIGBSM0RpcmVjdGl2ZU1ldGFkYXRhYCBmb3IgYSBwYXJ0aWN1bGFyIGRpcmVjdGl2ZSAoZWl0aGVyIGEgYERpcmVjdGl2ZWAgb3IgYVxuICogYENvbXBvbmVudGApLlxuICovXG5mdW5jdGlvbiBkaXJlY3RpdmVNZXRhZGF0YSh0eXBlOiBUeXBlPGFueT4sIG1ldGFkYXRhOiBEaXJlY3RpdmUpOiBSM0RpcmVjdGl2ZU1ldGFkYXRhIHtcbiAgLy8gUmVmbGVjdCBpbnB1dHMgYW5kIG91dHB1dHMuXG4gIGNvbnN0IHByb3BNZXRhZGF0YSA9IGdldFJlZmxlY3QoKS5wcm9wTWV0YWRhdGEodHlwZSk7XG5cbiAgY29uc3QgaG9zdCA9IGV4dHJhY3RIb3N0QmluZGluZ3MobWV0YWRhdGEsIHByb3BNZXRhZGF0YSk7XG5cbiAgY29uc3QgaW5wdXRzRnJvbU1ldGFkYXRhID0gcGFyc2VJbnB1dE91dHB1dHMobWV0YWRhdGEuaW5wdXRzIHx8IFtdKTtcbiAgY29uc3Qgb3V0cHV0c0Zyb21NZXRhZGF0YSA9IHBhcnNlSW5wdXRPdXRwdXRzKG1ldGFkYXRhLm91dHB1dHMgfHwgW10pO1xuXG4gIGNvbnN0IGlucHV0c0Zyb21UeXBlOiBTdHJpbmdNYXAgPSB7fTtcbiAgY29uc3Qgb3V0cHV0c0Zyb21UeXBlOiBTdHJpbmdNYXAgPSB7fTtcbiAgZm9yIChjb25zdCBmaWVsZCBpbiBwcm9wTWV0YWRhdGEpIHtcbiAgICBpZiAocHJvcE1ldGFkYXRhLmhhc093blByb3BlcnR5KGZpZWxkKSkge1xuICAgICAgcHJvcE1ldGFkYXRhW2ZpZWxkXS5mb3JFYWNoKGFubiA9PiB7XG4gICAgICAgIGlmIChpc0lucHV0KGFubikpIHtcbiAgICAgICAgICBpbnB1dHNGcm9tVHlwZVtmaWVsZF0gPSBhbm4uYmluZGluZ1Byb3BlcnR5TmFtZSB8fCBmaWVsZDtcbiAgICAgICAgfSBlbHNlIGlmIChpc091dHB1dChhbm4pKSB7XG4gICAgICAgICAgb3V0cHV0c0Zyb21UeXBlW2ZpZWxkXSA9IGFubi5iaW5kaW5nUHJvcGVydHlOYW1lIHx8IGZpZWxkO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG5hbWU6IHR5cGUubmFtZSxcbiAgICB0eXBlOiBuZXcgV3JhcHBlZE5vZGVFeHByKHR5cGUpLFxuICAgIHR5cGVBcmd1bWVudENvdW50OiAwLFxuICAgIHNlbGVjdG9yOiBtZXRhZGF0YS5zZWxlY3RvciAhLFxuICAgIGRlcHM6IHJlZmxlY3REZXBlbmRlbmNpZXModHlwZSksIGhvc3QsXG4gICAgaW5wdXRzOiB7Li4uaW5wdXRzRnJvbU1ldGFkYXRhLCAuLi5pbnB1dHNGcm9tVHlwZX0sXG4gICAgb3V0cHV0czogey4uLm91dHB1dHNGcm9tTWV0YWRhdGEsIC4uLm91dHB1dHNGcm9tVHlwZX0sXG4gICAgcXVlcmllczogW10sXG4gICAgbGlmZWN5Y2xlOiB7XG4gICAgICB1c2VzT25DaGFuZ2VzOiB0eXBlLnByb3RvdHlwZS5uZ09uQ2hhbmdlcyAhPT0gdW5kZWZpbmVkLFxuICAgIH0sXG4gICAgdHlwZVNvdXJjZVNwYW46IG51bGwgISxcbiAgICB1c2VzSW5oZXJpdGFuY2U6ICFleHRlbmRzRGlyZWN0bHlGcm9tT2JqZWN0KHR5cGUpLFxuICAgIGV4cG9ydEFzOiBtZXRhZGF0YS5leHBvcnRBcyB8fCBudWxsLFxuICB9O1xufVxuXG5mdW5jdGlvbiBleHRyYWN0SG9zdEJpbmRpbmdzKG1ldGFkYXRhOiBEaXJlY3RpdmUsIHByb3BNZXRhZGF0YToge1trZXk6IHN0cmluZ106IGFueVtdfSk6IHtcbiAgYXR0cmlidXRlczogU3RyaW5nTWFwLFxuICBsaXN0ZW5lcnM6IFN0cmluZ01hcCxcbiAgcHJvcGVydGllczogU3RyaW5nTWFwLFxufSB7XG4gIC8vIEZpcnN0IHBhcnNlIHRoZSBkZWNsYXJhdGlvbnMgZnJvbSB0aGUgbWV0YWRhdGEuXG4gIGNvbnN0IHthdHRyaWJ1dGVzLCBsaXN0ZW5lcnMsIHByb3BlcnRpZXMsIGFuaW1hdGlvbnN9ID0gcGFyc2VIb3N0QmluZGluZ3MobWV0YWRhdGEuaG9zdCB8fCB7fSk7XG5cbiAgaWYgKE9iamVjdC5rZXlzKGFuaW1hdGlvbnMpLmxlbmd0aCA+IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEFuaW1hdGlvbiBiaW5kaW5ncyBhcmUgYXMtb2YteWV0IHVuc3VwcG9ydGVkIGluIEl2eWApO1xuICB9XG5cbiAgLy8gTmV4dCwgbG9vcCBvdmVyIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBvYmplY3QsIGxvb2tpbmcgZm9yIEBIb3N0QmluZGluZyBhbmQgQEhvc3RMaXN0ZW5lci5cbiAgZm9yIChjb25zdCBmaWVsZCBpbiBwcm9wTWV0YWRhdGEpIHtcbiAgICBpZiAocHJvcE1ldGFkYXRhLmhhc093blByb3BlcnR5KGZpZWxkKSkge1xuICAgICAgcHJvcE1ldGFkYXRhW2ZpZWxkXS5mb3JFYWNoKGFubiA9PiB7XG4gICAgICAgIGlmIChpc0hvc3RCaW5kaW5nKGFubikpIHtcbiAgICAgICAgICBwcm9wZXJ0aWVzW2Fubi5ob3N0UHJvcGVydHlOYW1lIHx8IGZpZWxkXSA9IGZpZWxkO1xuICAgICAgICB9IGVsc2UgaWYgKGlzSG9zdExpc3RlbmVyKGFubikpIHtcbiAgICAgICAgICBsaXN0ZW5lcnNbYW5uLmV2ZW50TmFtZSB8fCBmaWVsZF0gPSBgJHtmaWVsZH0oJHsoYW5uLmFyZ3MgfHwgW10pLmpvaW4oJywnKX0pYDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHthdHRyaWJ1dGVzLCBsaXN0ZW5lcnMsIHByb3BlcnRpZXN9O1xufVxuXG5mdW5jdGlvbiBpc0lucHV0KHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBJbnB1dCB7XG4gIHJldHVybiB2YWx1ZS5uZ01ldGFkYXRhTmFtZSA9PT0gJ0lucHV0Jztcbn1cblxuZnVuY3Rpb24gaXNPdXRwdXQodmFsdWU6IGFueSk6IHZhbHVlIGlzIE91dHB1dCB7XG4gIHJldHVybiB2YWx1ZS5uZ01ldGFkYXRhTmFtZSA9PT0gJ091dHB1dCc7XG59XG5cbmZ1bmN0aW9uIGlzSG9zdEJpbmRpbmcodmFsdWU6IGFueSk6IHZhbHVlIGlzIEhvc3RCaW5kaW5nIHtcbiAgcmV0dXJuIHZhbHVlLm5nTWV0YWRhdGFOYW1lID09PSAnSG9zdEJpbmRpbmcnO1xufVxuXG5mdW5jdGlvbiBpc0hvc3RMaXN0ZW5lcih2YWx1ZTogYW55KTogdmFsdWUgaXMgSG9zdExpc3RlbmVyIHtcbiAgcmV0dXJuIHZhbHVlLm5nTWV0YWRhdGFOYW1lID09PSAnSG9zdExpc3RlbmVyJztcbn1cblxuZnVuY3Rpb24gcGFyc2VJbnB1dE91dHB1dHModmFsdWVzOiBzdHJpbmdbXSk6IFN0cmluZ01hcCB7XG4gIHJldHVybiB2YWx1ZXMucmVkdWNlKFxuICAgICAgKG1hcCwgdmFsdWUpID0+IHtcbiAgICAgICAgY29uc3QgW2ZpZWxkLCBwcm9wZXJ0eV0gPSB2YWx1ZS5zcGxpdCgnLCcpLm1hcChwaWVjZSA9PiBwaWVjZS50cmltKCkpO1xuICAgICAgICBtYXBbZmllbGRdID0gcHJvcGVydHkgfHwgZmllbGQ7XG4gICAgICAgIHJldHVybiBtYXA7XG4gICAgICB9LFxuICAgICAge30gYXMgU3RyaW5nTWFwKTtcbn1cbiJdfQ==