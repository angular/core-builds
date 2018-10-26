/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
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
import { NG_COMPONENT_DEF, NG_DIRECTIVE_DEF } from '../fields';
import { angularCoreEnv } from './environment';
import { patchComponentDefWithScope, transitiveScopesFor } from './module';
import { getReflect, reflectDependencies } from './util';
/** @typedef {?} */
var StringMap;
/**
 * Compile an Angular component according to its decorator metadata, and patch the resulting
 * ngComponentDef onto the component type.
 *
 * Compilation may be asynchronous (due to the need to resolve URLs for the component template or
 * other resources, for example). In the event that compilation is not immediate, `compileComponent`
 * will enqueue resource resolution into a global queue and will fail to return the `ngComponentDef`
 * until the global queue has been resolved with a call to `resolveComponentResources`.
 * @param {?} type
 * @param {?} metadata
 * @return {?}
 */
export function compileComponent(type, metadata) {
    /** @type {?} */
    /** @nocollapse */ let ngComponentDef = null;
    // Metadata may have resources which need to be resolved.
    maybeQueueResolutionOfComponentResources(metadata);
    Object.defineProperty(type, NG_COMPONENT_DEF, {
        get: () => {
            if (ngComponentDef === null) {
                if (componentNeedsResolution(metadata)) {
                    /** @type {?} */
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
                /** @type {?} */
                const constantPool = new ConstantPool();
                /** @type {?} */
                const template = parseTemplate(/** @type {?} */ ((metadata.template)), `ng://${stringify(type)}/template.html`, {
                    preserveWhitespaces: metadata.preserveWhitespaces || false,
                }, '');
                if (template.errors !== undefined) {
                    /** @type {?} */
                    const errors = template.errors.map(err => err.toString()).join(', ');
                    throw new Error(`Errors during JIT compilation of template for ${stringify(type)}: ${errors}`);
                }
                /** @type {?} */
                const animations = metadata.animations !== null ? new WrappedNodeExpr(metadata.animations) : null;
                /** @type {?} */
                const res = compileR3Component(Object.assign({}, directiveMetadata(type, metadata), { template, directives: new Map(), pipes: new Map(), viewQueries: [], wrapDirectivesAndPipesInClosure: false, styles: metadata.styles || [], encapsulation: metadata.encapsulation || ViewEncapsulation.Emulated, animations, viewProviders: metadata.viewProviders ? new WrappedNodeExpr(metadata.viewProviders) :
                        null }), constantPool, makeBindingParser());
                /** @type {?} */
                const preStatements = [...constantPool.statements, ...res.statements];
                ngComponentDef = jitExpression(res.expression, angularCoreEnv, `ng://${type.name}/ngComponentDef.js`, preStatements);
                // If component compilation is async, then the @NgModule annotation which declares the
                // component may execute and set an ngSelectorScope property on the component type. This
                // allows the component to patch itself with directiveDefs from the module after it
                // finishes compiling.
                if (hasSelectorScope(type)) {
                    /** @type {?} */
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
    /** @type {?} */
    /** @nocollapse */ let ngDirectiveDef = null;
    Object.defineProperty(type, NG_DIRECTIVE_DEF, {
        get: () => {
            if (ngDirectiveDef === null) {
                /** @type {?} */
                const constantPool = new ConstantPool();
                /** @type {?} */
                const sourceMapUrl = `ng://${type && type.name}/ngDirectiveDef.js`;
                /** @type {?} */
                const res = compileR3Directive(directiveMetadata(type, directive), constantPool, makeBindingParser());
                /** @type {?} */
                const preStatements = [...constantPool.statements, ...res.statements];
                ngDirectiveDef = jitExpression(res.expression, angularCoreEnv, sourceMapUrl, preStatements);
            }
            return ngDirectiveDef;
        },
        // Make the property configurable in dev mode to allow overriding in tests
        configurable: !!ngDevMode,
    });
}
/**
 * @param {?} type
 * @return {?}
 */
export function extendsDirectlyFromObject(type) {
    return Object.getPrototypeOf(type.prototype) === Object.prototype;
}
/**
 * Extract the `R3DirectiveMetadata` for a particular directive (either a `Directive` or a
 * `Component`).
 * @param {?} type
 * @param {?} metadata
 * @return {?}
 */
function directiveMetadata(type, metadata) {
    /** @type {?} */
    const propMetadata = getReflect().propMetadata(type);
    /** @type {?} */
    const host = extractHostBindings(metadata, propMetadata);
    /** @type {?} */
    const inputsFromMetadata = parseInputOutputs(metadata.inputs || []);
    /** @type {?} */
    const outputsFromMetadata = parseInputOutputs(metadata.outputs || []);
    /** @type {?} */
    const inputsFromType = {};
    /** @type {?} */
    const outputsFromType = {};
    for (const field in propMetadata) {
        if (propMetadata.hasOwnProperty(field)) {
            propMetadata[field].forEach(ann => {
                if (isInput(ann)) {
                    inputsFromType[field] =
                        ann.bindingPropertyName ? [ann.bindingPropertyName, field] : field;
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
        selector: /** @type {?} */ ((metadata.selector)),
        deps: reflectDependencies(type), host,
        inputs: Object.assign({}, inputsFromMetadata, inputsFromType),
        outputs: Object.assign({}, outputsFromMetadata, outputsFromType),
        queries: [],
        lifecycle: {
            usesOnChanges: type.prototype.ngOnChanges !== undefined,
        },
        typeSourceSpan: /** @type {?} */ ((null)),
        usesInheritance: !extendsDirectlyFromObject(type),
        exportAs: metadata.exportAs || null,
        providers: metadata.providers ? new WrappedNodeExpr(metadata.providers) : null
    };
}
/**
 * @param {?} metadata
 * @param {?} propMetadata
 * @return {?}
 */
function extractHostBindings(metadata, propMetadata) {
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
/**
 * @param {?} values
 * @return {?}
 */
function parseInputOutputs(values) {
    return values.reduce((map, value) => {
        const [field, property] = value.split(',').map(piece => piece.trim());
        map[field] = property || field;
        return map;
    }, /** @type {?} */ ({}));
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFlBQVksRUFBdUIsZUFBZSxFQUFFLDRCQUE0QixJQUFJLGtCQUFrQixFQUFFLDRCQUE0QixJQUFJLGtCQUFrQixFQUFFLGFBQWEsRUFBRSxpQkFBaUIsRUFBRSxpQkFBaUIsRUFBRSxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUdqUSxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsd0NBQXdDLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUNuSCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUV0RCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ3JDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUU3RCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sRUFBQywwQkFBMEIsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN6RSxPQUFPLEVBQUMsVUFBVSxFQUFFLG1CQUFtQixFQUFDLE1BQU0sUUFBUSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7QUFldkQsTUFBTSxVQUFVLGdCQUFnQixDQUFDLElBQWUsRUFBRSxRQUFtQjs7SUFDbkUsSUFBSSxjQUFjLEdBQVEsSUFBSSxDQUFDOztJQUUvQix3Q0FBd0MsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNuRCxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtRQUM1QyxHQUFHLEVBQUUsR0FBRyxFQUFFO1lBQ1IsSUFBSSxjQUFjLEtBQUssSUFBSSxFQUFFO2dCQUMzQixJQUFJLHdC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QUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDdEUsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLFFBQVEsSUFBSSxLQUFLLENBQUM7UUFDL0IsT0FBTyxHQUFHLENBQUM7S0FDWixvQkFDRCxFQUFlLEVBQUMsQ0FBQztDQUN0QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDb25zdGFudFBvb2wsIFIzRGlyZWN0aXZlTWV0YWRhdGEsIFdyYXBwZWROb2RlRXhwciwgY29tcGlsZUNvbXBvbmVudEZyb21NZXRhZGF0YSBhcyBjb21waWxlUjNDb21wb25lbnQsIGNvbXBpbGVEaXJlY3RpdmVGcm9tTWV0YWRhdGEgYXMgY29tcGlsZVIzRGlyZWN0aXZlLCBqaXRFeHByZXNzaW9uLCBtYWtlQmluZGluZ1BhcnNlciwgcGFyc2VIb3N0QmluZGluZ3MsIHBhcnNlVGVtcGxhdGV9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcblxuaW1wb3J0IHtDb21wb25lbnQsIERpcmVjdGl2ZSwgSG9zdEJpbmRpbmcsIEhvc3RMaXN0ZW5lciwgSW5wdXQsIE91dHB1dH0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvZGlyZWN0aXZlcyc7XG5pbXBvcnQge2NvbXBvbmVudE5lZWRzUmVzb2x1dGlvbiwgbWF5YmVRdWV1ZVJlc29sdXRpb25PZkNvbXBvbmVudFJlc291cmNlc30gZnJvbSAnLi4vLi4vbWV0YWRhdGEvcmVzb3VyY2VfbG9hZGluZyc7XG5pbXBvcnQge1ZpZXdFbmNhcHN1bGF0aW9ufSBmcm9tICcuLi8uLi9tZXRhZGF0YS92aWV3JztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vdHlwZSc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vLi4vdXRpbCc7XG5pbXBvcnQge05HX0NPTVBPTkVOVF9ERUYsIE5HX0RJUkVDVElWRV9ERUZ9IGZyb20gJy4uL2ZpZWxkcyc7XG5cbmltcG9ydCB7YW5ndWxhckNvcmVFbnZ9IGZyb20gJy4vZW52aXJvbm1lbnQnO1xuaW1wb3J0IHtwYXRjaENvbXBvbmVudERlZldpdGhTY29wZSwgdHJhbnNpdGl2ZVNjb3Blc0Zvcn0gZnJvbSAnLi9tb2R1bGUnO1xuaW1wb3J0IHtnZXRSZWZsZWN0LCByZWZsZWN0RGVwZW5kZW5jaWVzfSBmcm9tICcuL3V0aWwnO1xuXG50eXBlIFN0cmluZ01hcCA9IHtcbiAgW2tleTogc3RyaW5nXTogc3RyaW5nXG59O1xuXG4vKipcbiAqIENvbXBpbGUgYW4gQW5ndWxhciBjb21wb25lbnQgYWNjb3JkaW5nIHRvIGl0cyBkZWNvcmF0b3IgbWV0YWRhdGEsIGFuZCBwYXRjaCB0aGUgcmVzdWx0aW5nXG4gKiBuZ0NvbXBvbmVudERlZiBvbnRvIHRoZSBjb21wb25lbnQgdHlwZS5cbiAqXG4gKiBDb21waWxhdGlvbiBtYXkgYmUgYXN5bmNocm9ub3VzIChkdWUgdG8gdGhlIG5lZWQgdG8gcmVzb2x2ZSBVUkxzIGZvciB0aGUgY29tcG9uZW50IHRlbXBsYXRlIG9yXG4gKiBvdGhlciByZXNvdXJjZXMsIGZvciBleGFtcGxlKS4gSW4gdGhlIGV2ZW50IHRoYXQgY29tcGlsYXRpb24gaXMgbm90IGltbWVkaWF0ZSwgYGNvbXBpbGVDb21wb25lbnRgXG4gKiB3aWxsIGVucXVldWUgcmVzb3VyY2UgcmVzb2x1dGlvbiBpbnRvIGEgZ2xvYmFsIHF1ZXVlIGFuZCB3aWxsIGZhaWwgdG8gcmV0dXJuIHRoZSBgbmdDb21wb25lbnREZWZgXG4gKiB1bnRpbCB0aGUgZ2xvYmFsIHF1ZXVlIGhhcyBiZWVuIHJlc29sdmVkIHdpdGggYSBjYWxsIHRvIGByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVDb21wb25lbnQodHlwZTogVHlwZTxhbnk+LCBtZXRhZGF0YTogQ29tcG9uZW50KTogdm9pZCB7XG4gIGxldCBuZ0NvbXBvbmVudERlZjogYW55ID0gbnVsbDtcbiAgLy8gTWV0YWRhdGEgbWF5IGhhdmUgcmVzb3VyY2VzIHdoaWNoIG5lZWQgdG8gYmUgcmVzb2x2ZWQuXG4gIG1heWJlUXVldWVSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXMobWV0YWRhdGEpO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgTkdfQ09NUE9ORU5UX0RFRiwge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKG5nQ29tcG9uZW50RGVmID09PSBudWxsKSB7XG4gICAgICAgIGlmIChjb21wb25lbnROZWVkc1Jlc29sdXRpb24obWV0YWRhdGEpKSB7XG4gICAgICAgICAgY29uc3QgZXJyb3IgPSBbYENvbXBvbmVudCAnJHtzdHJpbmdpZnkodHlwZSl9JyBpcyBub3QgcmVzb2x2ZWQ6YF07XG4gICAgICAgICAgaWYgKG1ldGFkYXRhLnRlbXBsYXRlVXJsKSB7XG4gICAgICAgICAgICBlcnJvci5wdXNoKGAgLSB0ZW1wbGF0ZVVybDogJHtzdHJpbmdpZnkobWV0YWRhdGEudGVtcGxhdGVVcmwpfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobWV0YWRhdGEuc3R5bGVVcmxzICYmIG1ldGFkYXRhLnN0eWxlVXJscy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVycm9yLnB1c2goYCAtIHN0eWxlVXJsczogJHtKU09OLnN0cmluZ2lmeShtZXRhZGF0YS5zdHlsZVVybHMpfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlcnJvci5wdXNoKGBEaWQgeW91IHJ1biBhbmQgd2FpdCBmb3IgJ3Jlc29sdmVDb21wb25lbnRSZXNvdXJjZXMoKSc/YCk7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yLmpvaW4oJ1xcbicpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGUgQ29uc3RhbnRQb29sIGlzIGEgcmVxdWlyZW1lbnQgb2YgdGhlIEpJVCdlci5cbiAgICAgICAgY29uc3QgY29uc3RhbnRQb29sID0gbmV3IENvbnN0YW50UG9vbCgpO1xuXG4gICAgICAgIC8vIFBhcnNlIHRoZSB0ZW1wbGF0ZSBhbmQgY2hlY2sgZm9yIGVycm9ycy5cbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBwYXJzZVRlbXBsYXRlKFxuICAgICAgICAgICAgbWV0YWRhdGEudGVtcGxhdGUgISwgYG5nOi8vJHtzdHJpbmdpZnkodHlwZSl9L3RlbXBsYXRlLmh0bWxgLCB7XG4gICAgICAgICAgICAgIHByZXNlcnZlV2hpdGVzcGFjZXM6IG1ldGFkYXRhLnByZXNlcnZlV2hpdGVzcGFjZXMgfHwgZmFsc2UsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJycpO1xuICAgICAgICBpZiAodGVtcGxhdGUuZXJyb3JzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBjb25zdCBlcnJvcnMgPSB0ZW1wbGF0ZS5lcnJvcnMubWFwKGVyciA9PiBlcnIudG9TdHJpbmcoKSkuam9pbignLCAnKTtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgIGBFcnJvcnMgZHVyaW5nIEpJVCBjb21waWxhdGlvbiBvZiB0ZW1wbGF0ZSBmb3IgJHtzdHJpbmdpZnkodHlwZSl9OiAke2Vycm9yc31gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFuaW1hdGlvbnMgPVxuICAgICAgICAgICAgbWV0YWRhdGEuYW5pbWF0aW9ucyAhPT0gbnVsbCA/IG5ldyBXcmFwcGVkTm9kZUV4cHIobWV0YWRhdGEuYW5pbWF0aW9ucykgOiBudWxsO1xuXG4gICAgICAgIC8vIENvbXBpbGUgdGhlIGNvbXBvbmVudCBtZXRhZGF0YSwgaW5jbHVkaW5nIHRlbXBsYXRlLCBpbnRvIGFuIGV4cHJlc3Npb24uXG4gICAgICAgIC8vIFRPRE8oYWx4aHViKTogaW1wbGVtZW50IGlucHV0cywgb3V0cHV0cywgcXVlcmllcywgZXRjLlxuICAgICAgICBjb25zdCByZXMgPSBjb21waWxlUjNDb21wb25lbnQoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIC4uLmRpcmVjdGl2ZU1ldGFkYXRhKHR5cGUsIG1ldGFkYXRhKSxcbiAgICAgICAgICAgICAgdGVtcGxhdGUsXG4gICAgICAgICAgICAgIGRpcmVjdGl2ZXM6IG5ldyBNYXAoKSxcbiAgICAgICAgICAgICAgcGlwZXM6IG5ldyBNYXAoKSxcbiAgICAgICAgICAgICAgdmlld1F1ZXJpZXM6IFtdLFxuICAgICAgICAgICAgICB3cmFwRGlyZWN0aXZlc0FuZFBpcGVzSW5DbG9zdXJlOiBmYWxzZSxcbiAgICAgICAgICAgICAgc3R5bGVzOiBtZXRhZGF0YS5zdHlsZXMgfHwgW10sXG4gICAgICAgICAgICAgIGVuY2Fwc3VsYXRpb246IG1ldGFkYXRhLmVuY2Fwc3VsYXRpb24gfHwgVmlld0VuY2Fwc3VsYXRpb24uRW11bGF0ZWQsIGFuaW1hdGlvbnMsXG4gICAgICAgICAgICAgIHZpZXdQcm92aWRlcnM6IG1ldGFkYXRhLnZpZXdQcm92aWRlcnMgPyBuZXcgV3JhcHBlZE5vZGVFeHByKG1ldGFkYXRhLnZpZXdQcm92aWRlcnMpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bGxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb25zdGFudFBvb2wsIG1ha2VCaW5kaW5nUGFyc2VyKCkpO1xuICAgICAgICBjb25zdCBwcmVTdGF0ZW1lbnRzID0gWy4uLmNvbnN0YW50UG9vbC5zdGF0ZW1lbnRzLCAuLi5yZXMuc3RhdGVtZW50c107XG5cbiAgICAgICAgbmdDb21wb25lbnREZWYgPSBqaXRFeHByZXNzaW9uKFxuICAgICAgICAgICAgcmVzLmV4cHJlc3Npb24sIGFuZ3VsYXJDb3JlRW52LCBgbmc6Ly8ke3R5cGUubmFtZX0vbmdDb21wb25lbnREZWYuanNgLCBwcmVTdGF0ZW1lbnRzKTtcblxuICAgICAgICAvLyBJZiBjb21wb25lbnQgY29tcGlsYXRpb24gaXMgYXN5bmMsIHRoZW4gdGhlIEBOZ01vZHVsZSBhbm5vdGF0aW9uIHdoaWNoIGRlY2xhcmVzIHRoZVxuICAgICAgICAvLyBjb21wb25lbnQgbWF5IGV4ZWN1dGUgYW5kIHNldCBhbiBuZ1NlbGVjdG9yU2NvcGUgcHJvcGVydHkgb24gdGhlIGNvbXBvbmVudCB0eXBlLiBUaGlzXG4gICAgICAgIC8vIGFsbG93cyB0aGUgY29tcG9uZW50IHRvIHBhdGNoIGl0c2VsZiB3aXRoIGRpcmVjdGl2ZURlZnMgZnJvbSB0aGUgbW9kdWxlIGFmdGVyIGl0XG4gICAgICAgIC8vIGZpbmlzaGVzIGNvbXBpbGluZy5cbiAgICAgICAgaWYgKGhhc1NlbGVjdG9yU2NvcGUodHlwZSkpIHtcbiAgICAgICAgICBjb25zdCBzY29wZXMgPSB0cmFuc2l0aXZlU2NvcGVzRm9yKHR5cGUubmdTZWxlY3RvclNjb3BlKTtcbiAgICAgICAgICBwYXRjaENvbXBvbmVudERlZldpdGhTY29wZShuZ0NvbXBvbmVudERlZiwgc2NvcGVzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG5nQ29tcG9uZW50RGVmO1xuICAgIH0sXG4gICAgLy8gTWFrZSB0aGUgcHJvcGVydHkgY29uZmlndXJhYmxlIGluIGRldiBtb2RlIHRvIGFsbG93IG92ZXJyaWRpbmcgaW4gdGVzdHNcbiAgICBjb25maWd1cmFibGU6ICEhbmdEZXZNb2RlLFxuICB9KTtcbn1cblxuZnVuY3Rpb24gaGFzU2VsZWN0b3JTY29wZTxUPihjb21wb25lbnQ6IFR5cGU8VD4pOiBjb21wb25lbnQgaXMgVHlwZTxUPiZcbiAgICB7bmdTZWxlY3RvclNjb3BlOiBUeXBlPGFueT59IHtcbiAgcmV0dXJuIChjb21wb25lbnQgYXN7bmdTZWxlY3RvclNjb3BlPzogYW55fSkubmdTZWxlY3RvclNjb3BlICE9PSB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogQ29tcGlsZSBhbiBBbmd1bGFyIGRpcmVjdGl2ZSBhY2NvcmRpbmcgdG8gaXRzIGRlY29yYXRvciBtZXRhZGF0YSwgYW5kIHBhdGNoIHRoZSByZXN1bHRpbmdcbiAqIG5nRGlyZWN0aXZlRGVmIG9udG8gdGhlIGNvbXBvbmVudCB0eXBlLlxuICpcbiAqIEluIHRoZSBldmVudCB0aGF0IGNvbXBpbGF0aW9uIGlzIG5vdCBpbW1lZGlhdGUsIGBjb21waWxlRGlyZWN0aXZlYCB3aWxsIHJldHVybiBhIGBQcm9taXNlYCB3aGljaFxuICogd2lsbCByZXNvbHZlIHdoZW4gY29tcGlsYXRpb24gY29tcGxldGVzIGFuZCB0aGUgZGlyZWN0aXZlIGJlY29tZXMgdXNhYmxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZURpcmVjdGl2ZSh0eXBlOiBUeXBlPGFueT4sIGRpcmVjdGl2ZTogRGlyZWN0aXZlKTogdm9pZCB7XG4gIGxldCBuZ0RpcmVjdGl2ZURlZjogYW55ID0gbnVsbDtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIE5HX0RJUkVDVElWRV9ERUYsIHtcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChuZ0RpcmVjdGl2ZURlZiA9PT0gbnVsbCkge1xuICAgICAgICBjb25zdCBjb25zdGFudFBvb2wgPSBuZXcgQ29uc3RhbnRQb29sKCk7XG4gICAgICAgIGNvbnN0IHNvdXJjZU1hcFVybCA9IGBuZzovLyR7dHlwZSAmJiB0eXBlLm5hbWV9L25nRGlyZWN0aXZlRGVmLmpzYDtcbiAgICAgICAgY29uc3QgcmVzID0gY29tcGlsZVIzRGlyZWN0aXZlKFxuICAgICAgICAgICAgZGlyZWN0aXZlTWV0YWRhdGEodHlwZSwgZGlyZWN0aXZlKSwgY29uc3RhbnRQb29sLCBtYWtlQmluZGluZ1BhcnNlcigpKTtcbiAgICAgICAgY29uc3QgcHJlU3RhdGVtZW50cyA9IFsuLi5jb25zdGFudFBvb2wuc3RhdGVtZW50cywgLi4ucmVzLnN0YXRlbWVudHNdO1xuICAgICAgICBuZ0RpcmVjdGl2ZURlZiA9IGppdEV4cHJlc3Npb24ocmVzLmV4cHJlc3Npb24sIGFuZ3VsYXJDb3JlRW52LCBzb3VyY2VNYXBVcmwsIHByZVN0YXRlbWVudHMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5nRGlyZWN0aXZlRGVmO1xuICAgIH0sXG4gICAgLy8gTWFrZSB0aGUgcHJvcGVydHkgY29uZmlndXJhYmxlIGluIGRldiBtb2RlIHRvIGFsbG93IG92ZXJyaWRpbmcgaW4gdGVzdHNcbiAgICBjb25maWd1cmFibGU6ICEhbmdEZXZNb2RlLFxuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dGVuZHNEaXJlY3RseUZyb21PYmplY3QodHlwZTogVHlwZTxhbnk+KTogYm9vbGVhbiB7XG4gIHJldHVybiBPYmplY3QuZ2V0UHJvdG90eXBlT2YodHlwZS5wcm90b3R5cGUpID09PSBPYmplY3QucHJvdG90eXBlO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdGhlIGBSM0RpcmVjdGl2ZU1ldGFkYXRhYCBmb3IgYSBwYXJ0aWN1bGFyIGRpcmVjdGl2ZSAoZWl0aGVyIGEgYERpcmVjdGl2ZWAgb3IgYVxuICogYENvbXBvbmVudGApLlxuICovXG5mdW5jdGlvbiBkaXJlY3RpdmVNZXRhZGF0YSh0eXBlOiBUeXBlPGFueT4sIG1ldGFkYXRhOiBEaXJlY3RpdmUpOiBSM0RpcmVjdGl2ZU1ldGFkYXRhIHtcbiAgLy8gUmVmbGVjdCBpbnB1dHMgYW5kIG91dHB1dHMuXG4gIGNvbnN0IHByb3BNZXRhZGF0YSA9IGdldFJlZmxlY3QoKS5wcm9wTWV0YWRhdGEodHlwZSk7XG5cbiAgY29uc3QgaG9zdCA9IGV4dHJhY3RIb3N0QmluZGluZ3MobWV0YWRhdGEsIHByb3BNZXRhZGF0YSk7XG5cbiAgY29uc3QgaW5wdXRzRnJvbU1ldGFkYXRhID0gcGFyc2VJbnB1dE91dHB1dHMobWV0YWRhdGEuaW5wdXRzIHx8IFtdKTtcbiAgY29uc3Qgb3V0cHV0c0Zyb21NZXRhZGF0YSA9IHBhcnNlSW5wdXRPdXRwdXRzKG1ldGFkYXRhLm91dHB1dHMgfHwgW10pO1xuXG4gIGNvbnN0IGlucHV0c0Zyb21UeXBlOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgc3RyaW5nW119ID0ge307XG4gIGNvbnN0IG91dHB1dHNGcm9tVHlwZTogU3RyaW5nTWFwID0ge307XG4gIGZvciAoY29uc3QgZmllbGQgaW4gcHJvcE1ldGFkYXRhKSB7XG4gICAgaWYgKHByb3BNZXRhZGF0YS5oYXNPd25Qcm9wZXJ0eShmaWVsZCkpIHtcbiAgICAgIHByb3BNZXRhZGF0YVtmaWVsZF0uZm9yRWFjaChhbm4gPT4ge1xuICAgICAgICBpZiAoaXNJbnB1dChhbm4pKSB7XG4gICAgICAgICAgaW5wdXRzRnJvbVR5cGVbZmllbGRdID1cbiAgICAgICAgICAgICAgYW5uLmJpbmRpbmdQcm9wZXJ0eU5hbWUgPyBbYW5uLmJpbmRpbmdQcm9wZXJ0eU5hbWUsIGZpZWxkXSA6IGZpZWxkO1xuICAgICAgICB9IGVsc2UgaWYgKGlzT3V0cHV0KGFubikpIHtcbiAgICAgICAgICBvdXRwdXRzRnJvbVR5cGVbZmllbGRdID0gYW5uLmJpbmRpbmdQcm9wZXJ0eU5hbWUgfHwgZmllbGQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgbmFtZTogdHlwZS5uYW1lLFxuICAgIHR5cGU6IG5ldyBXcmFwcGVkTm9kZUV4cHIodHlwZSksXG4gICAgdHlwZUFyZ3VtZW50Q291bnQ6IDAsXG4gICAgc2VsZWN0b3I6IG1ldGFkYXRhLnNlbGVjdG9yICEsXG4gICAgZGVwczogcmVmbGVjdERlcGVuZGVuY2llcyh0eXBlKSwgaG9zdCxcbiAgICBpbnB1dHM6IHsuLi5pbnB1dHNGcm9tTWV0YWRhdGEsIC4uLmlucHV0c0Zyb21UeXBlfSxcbiAgICBvdXRwdXRzOiB7Li4ub3V0cHV0c0Zyb21NZXRhZGF0YSwgLi4ub3V0cHV0c0Zyb21UeXBlfSxcbiAgICBxdWVyaWVzOiBbXSxcbiAgICBsaWZlY3ljbGU6IHtcbiAgICAgIHVzZXNPbkNoYW5nZXM6IHR5cGUucHJvdG90eXBlLm5nT25DaGFuZ2VzICE9PSB1bmRlZmluZWQsXG4gICAgfSxcbiAgICB0eXBlU291cmNlU3BhbjogbnVsbCAhLFxuICAgIHVzZXNJbmhlcml0YW5jZTogIWV4dGVuZHNEaXJlY3RseUZyb21PYmplY3QodHlwZSksXG4gICAgZXhwb3J0QXM6IG1ldGFkYXRhLmV4cG9ydEFzIHx8IG51bGwsXG4gICAgcHJvdmlkZXJzOiBtZXRhZGF0YS5wcm92aWRlcnMgPyBuZXcgV3JhcHBlZE5vZGVFeHByKG1ldGFkYXRhLnByb3ZpZGVycykgOiBudWxsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RIb3N0QmluZGluZ3MobWV0YWRhdGE6IERpcmVjdGl2ZSwgcHJvcE1ldGFkYXRhOiB7W2tleTogc3RyaW5nXTogYW55W119KToge1xuICBhdHRyaWJ1dGVzOiBTdHJpbmdNYXAsXG4gIGxpc3RlbmVyczogU3RyaW5nTWFwLFxuICBwcm9wZXJ0aWVzOiBTdHJpbmdNYXAsXG59IHtcbiAgLy8gRmlyc3QgcGFyc2UgdGhlIGRlY2xhcmF0aW9ucyBmcm9tIHRoZSBtZXRhZGF0YS5cbiAgY29uc3Qge2F0dHJpYnV0ZXMsIGxpc3RlbmVycywgcHJvcGVydGllcywgYW5pbWF0aW9uc30gPSBwYXJzZUhvc3RCaW5kaW5ncyhtZXRhZGF0YS5ob3N0IHx8IHt9KTtcblxuICBpZiAoT2JqZWN0LmtleXMoYW5pbWF0aW9ucykubGVuZ3RoID4gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQW5pbWF0aW9uIGJpbmRpbmdzIGFyZSBhcy1vZi15ZXQgdW5zdXBwb3J0ZWQgaW4gSXZ5YCk7XG4gIH1cblxuICAvLyBOZXh0LCBsb29wIG92ZXIgdGhlIHByb3BlcnRpZXMgb2YgdGhlIG9iamVjdCwgbG9va2luZyBmb3IgQEhvc3RCaW5kaW5nIGFuZCBASG9zdExpc3RlbmVyLlxuICBmb3IgKGNvbnN0IGZpZWxkIGluIHByb3BNZXRhZGF0YSkge1xuICAgIGlmIChwcm9wTWV0YWRhdGEuaGFzT3duUHJvcGVydHkoZmllbGQpKSB7XG4gICAgICBwcm9wTWV0YWRhdGFbZmllbGRdLmZvckVhY2goYW5uID0+IHtcbiAgICAgICAgaWYgKGlzSG9zdEJpbmRpbmcoYW5uKSkge1xuICAgICAgICAgIHByb3BlcnRpZXNbYW5uLmhvc3RQcm9wZXJ0eU5hbWUgfHwgZmllbGRdID0gZmllbGQ7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNIb3N0TGlzdGVuZXIoYW5uKSkge1xuICAgICAgICAgIGxpc3RlbmVyc1thbm4uZXZlbnROYW1lIHx8IGZpZWxkXSA9IGAke2ZpZWxkfSgkeyhhbm4uYXJncyB8fCBbXSkuam9pbignLCcpfSlgO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge2F0dHJpYnV0ZXMsIGxpc3RlbmVycywgcHJvcGVydGllc307XG59XG5cbmZ1bmN0aW9uIGlzSW5wdXQodmFsdWU6IGFueSk6IHZhbHVlIGlzIElucHV0IHtcbiAgcmV0dXJuIHZhbHVlLm5nTWV0YWRhdGFOYW1lID09PSAnSW5wdXQnO1xufVxuXG5mdW5jdGlvbiBpc091dHB1dCh2YWx1ZTogYW55KTogdmFsdWUgaXMgT3V0cHV0IHtcbiAgcmV0dXJuIHZhbHVlLm5nTWV0YWRhdGFOYW1lID09PSAnT3V0cHV0Jztcbn1cblxuZnVuY3Rpb24gaXNIb3N0QmluZGluZyh2YWx1ZTogYW55KTogdmFsdWUgaXMgSG9zdEJpbmRpbmcge1xuICByZXR1cm4gdmFsdWUubmdNZXRhZGF0YU5hbWUgPT09ICdIb3N0QmluZGluZyc7XG59XG5cbmZ1bmN0aW9uIGlzSG9zdExpc3RlbmVyKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBIb3N0TGlzdGVuZXIge1xuICByZXR1cm4gdmFsdWUubmdNZXRhZGF0YU5hbWUgPT09ICdIb3N0TGlzdGVuZXInO1xufVxuXG5mdW5jdGlvbiBwYXJzZUlucHV0T3V0cHV0cyh2YWx1ZXM6IHN0cmluZ1tdKTogU3RyaW5nTWFwIHtcbiAgcmV0dXJuIHZhbHVlcy5yZWR1Y2UoXG4gICAgICAobWFwLCB2YWx1ZSkgPT4ge1xuICAgICAgICBjb25zdCBbZmllbGQsIHByb3BlcnR5XSA9IHZhbHVlLnNwbGl0KCcsJykubWFwKHBpZWNlID0+IHBpZWNlLnRyaW0oKSk7XG4gICAgICAgIG1hcFtmaWVsZF0gPSBwcm9wZXJ0eSB8fCBmaWVsZDtcbiAgICAgICAgcmV0dXJuIG1hcDtcbiAgICAgIH0sXG4gICAgICB7fSBhcyBTdHJpbmdNYXApO1xufVxuIl19