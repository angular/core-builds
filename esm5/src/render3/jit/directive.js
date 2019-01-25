/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { getCompilerFacade } from '../../compiler/compiler_facade';
import { resolveForwardRef } from '../../di/forward_ref';
import { getReflect, reflectDependencies } from '../../di/jit/util';
import { componentNeedsResolution, maybeQueueResolutionOfComponentResources } from '../../metadata/resource_loading';
import { ViewEncapsulation } from '../../metadata/view';
import { EMPTY_ARRAY, EMPTY_OBJ } from '../empty';
import { NG_COMPONENT_DEF, NG_DIRECTIVE_DEF } from '../fields';
import { renderStringify } from '../util';
import { angularCoreEnv } from './environment';
import { flushModuleScopingQueueAsMuchAsPossible, patchComponentDefWithScope, transitiveScopesFor } from './module';
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
            var compiler = getCompilerFacade();
            if (ngComponentDef === null) {
                if (componentNeedsResolution(metadata)) {
                    var error = ["Component '" + renderStringify(type) + "' is not resolved:"];
                    if (metadata.templateUrl) {
                        error.push(" - templateUrl: " + renderStringify(metadata.templateUrl));
                    }
                    if (metadata.styleUrls && metadata.styleUrls.length) {
                        error.push(" - styleUrls: " + JSON.stringify(metadata.styleUrls));
                    }
                    error.push("Did you run and wait for 'resolveComponentResources()'?");
                    throw new Error(error.join('\n'));
                }
                var meta = tslib_1.__assign({}, directiveMetadata(type, metadata), { template: metadata.template || '', preserveWhitespaces: metadata.preserveWhitespaces || false, styles: metadata.styles || EMPTY_ARRAY, animations: metadata.animations, viewQueries: extractQueriesMetadata(type, getReflect().propMetadata(type), isViewQuery), directives: [], changeDetection: metadata.changeDetection, pipes: new Map(), encapsulation: metadata.encapsulation || ViewEncapsulation.Emulated, interpolation: metadata.interpolation, viewProviders: metadata.viewProviders || null });
                ngComponentDef = compiler.compileComponent(angularCoreEnv, "ng://" + renderStringify(type) + "/template.html", meta);
                // When NgModule decorator executed, we enqueued the module definition such that
                // it would only dequeue and add itself as module scope to all of its declarations,
                // but only if  if all of its declarations had resolved. This call runs the check
                // to see if any modules that are in the queue can be dequeued and add scope to
                // their declarations.
                flushModuleScopingQueueAsMuchAsPossible();
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
                var facade = directiveMetadata(type, directive);
                ngDirectiveDef = getCompilerFacade().compileDirective(angularCoreEnv, "ng://" + (type && type.name) + "/ngDirectiveDef.js", facade);
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
    return {
        name: type.name,
        type: type,
        typeArgumentCount: 0,
        selector: metadata.selector,
        deps: reflectDependencies(type),
        host: metadata.host || EMPTY_OBJ,
        propMetadata: propMetadata,
        inputs: metadata.inputs || EMPTY_ARRAY,
        outputs: metadata.outputs || EMPTY_ARRAY,
        queries: extractQueriesMetadata(type, propMetadata, isContentQuery),
        lifecycle: {
            usesOnChanges: type.prototype.ngOnChanges !== undefined,
        },
        typeSourceSpan: null,
        usesInheritance: !extendsDirectlyFromObject(type),
        exportAs: extractExportAs(metadata.exportAs),
        providers: metadata.providers || null,
    };
}
function convertToR3QueryPredicate(selector) {
    return typeof selector === 'string' ? splitByComma(selector) : resolveForwardRef(selector);
}
export function convertToR3QueryMetadata(propertyName, ann) {
    return {
        propertyName: propertyName,
        predicate: convertToR3QueryPredicate(ann.selector),
        descendants: ann.descendants,
        first: ann.first,
        read: ann.read ? ann.read : null
    };
}
function extractQueriesMetadata(type, propMetadata, isQueryAnn) {
    var queriesMeta = [];
    var _loop_1 = function (field) {
        if (propMetadata.hasOwnProperty(field)) {
            propMetadata[field].forEach(function (ann) {
                if (isQueryAnn(ann)) {
                    if (!ann.selector) {
                        throw new Error("Can't construct a query for the property \"" + field + "\" of " +
                            ("\"" + renderStringify(type) + "\" since the query selector wasn't defined."));
                    }
                    queriesMeta.push(convertToR3QueryMetadata(field, ann));
                }
            });
        }
    };
    for (var field in propMetadata) {
        _loop_1(field);
    }
    return queriesMeta;
}
function extractExportAs(exportAs) {
    if (exportAs === undefined) {
        return null;
    }
    return exportAs.split(',').map(function (part) { return part.trim(); });
}
function isContentQuery(value) {
    var name = value.ngMetadataName;
    return name === 'ContentChild' || name === 'ContentChildren';
}
function isViewQuery(value) {
    var name = value.ngMetadataName;
    return name === 'ViewChild' || name === 'ViewChildren';
}
function splitByComma(value) {
    return value.split(',').map(function (piece) { return piece.trim(); });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFHSCxPQUFPLEVBQTRCLGlCQUFpQixFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFFNUYsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDdkQsT0FBTyxFQUFDLFVBQVUsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBSWxFLE9BQU8sRUFBQyx3QkFBd0IsRUFBRSx3Q0FBd0MsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ25ILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3RELE9BQU8sRUFBQyxXQUFXLEVBQUUsU0FBUyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2hELE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUM3RCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRXhDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDN0MsT0FBTyxFQUFDLHVDQUF1QyxFQUFFLDBCQUEwQixFQUFFLG1CQUFtQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBSWxIOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxVQUFVLGdCQUFnQixDQUFDLElBQWUsRUFBRSxRQUFtQjtJQUNuRSxJQUFJLGNBQWMsR0FBUSxJQUFJLENBQUM7SUFDL0IseURBQXlEO0lBQ3pELHdDQUF3QyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ25ELE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1FBQzVDLEdBQUcsRUFBRTtZQUNILElBQU0sUUFBUSxH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QUFLLENBQUMsSUFBSSxFQUFFLEVBQVosQ0FBWSxDQUFDLENBQUM7QUFDckQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDb21wb25lbnRUeXBlfSBmcm9tICcuLic7XG5pbXBvcnQge1IzRGlyZWN0aXZlTWV0YWRhdGFGYWNhZGUsIGdldENvbXBpbGVyRmFjYWRlfSBmcm9tICcuLi8uLi9jb21waWxlci9jb21waWxlcl9mYWNhZGUnO1xuaW1wb3J0IHtSM0NvbXBvbmVudE1ldGFkYXRhRmFjYWRlLCBSM1F1ZXJ5TWV0YWRhdGFGYWNhZGV9IGZyb20gJy4uLy4uL2NvbXBpbGVyL2NvbXBpbGVyX2ZhY2FkZV9pbnRlcmZhY2UnO1xuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi4vLi4vZGkvZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtnZXRSZWZsZWN0LCByZWZsZWN0RGVwZW5kZW5jaWVzfSBmcm9tICcuLi8uLi9kaS9qaXQvdXRpbCc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7UXVlcnl9IGZyb20gJy4uLy4uL21ldGFkYXRhL2RpJztcbmltcG9ydCB7Q29tcG9uZW50LCBEaXJlY3RpdmV9IGZyb20gJy4uLy4uL21ldGFkYXRhL2RpcmVjdGl2ZXMnO1xuaW1wb3J0IHtjb21wb25lbnROZWVkc1Jlc29sdXRpb24sIG1heWJlUXVldWVSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXN9IGZyb20gJy4uLy4uL21ldGFkYXRhL3Jlc291cmNlX2xvYWRpbmcnO1xuaW1wb3J0IHtWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvdmlldyc7XG5pbXBvcnQge0VNUFRZX0FSUkFZLCBFTVBUWV9PQkp9IGZyb20gJy4uL2VtcHR5JztcbmltcG9ydCB7TkdfQ09NUE9ORU5UX0RFRiwgTkdfRElSRUNUSVZFX0RFRn0gZnJvbSAnLi4vZmllbGRzJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi91dGlsJztcblxuaW1wb3J0IHthbmd1bGFyQ29yZUVudn0gZnJvbSAnLi9lbnZpcm9ubWVudCc7XG5pbXBvcnQge2ZsdXNoTW9kdWxlU2NvcGluZ1F1ZXVlQXNNdWNoQXNQb3NzaWJsZSwgcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUsIHRyYW5zaXRpdmVTY29wZXNGb3J9IGZyb20gJy4vbW9kdWxlJztcblxuXG5cbi8qKlxuICogQ29tcGlsZSBhbiBBbmd1bGFyIGNvbXBvbmVudCBhY2NvcmRpbmcgdG8gaXRzIGRlY29yYXRvciBtZXRhZGF0YSwgYW5kIHBhdGNoIHRoZSByZXN1bHRpbmdcbiAqIG5nQ29tcG9uZW50RGVmIG9udG8gdGhlIGNvbXBvbmVudCB0eXBlLlxuICpcbiAqIENvbXBpbGF0aW9uIG1heSBiZSBhc3luY2hyb25vdXMgKGR1ZSB0byB0aGUgbmVlZCB0byByZXNvbHZlIFVSTHMgZm9yIHRoZSBjb21wb25lbnQgdGVtcGxhdGUgb3JcbiAqIG90aGVyIHJlc291cmNlcywgZm9yIGV4YW1wbGUpLiBJbiB0aGUgZXZlbnQgdGhhdCBjb21waWxhdGlvbiBpcyBub3QgaW1tZWRpYXRlLCBgY29tcGlsZUNvbXBvbmVudGBcbiAqIHdpbGwgZW5xdWV1ZSByZXNvdXJjZSByZXNvbHV0aW9uIGludG8gYSBnbG9iYWwgcXVldWUgYW5kIHdpbGwgZmFpbCB0byByZXR1cm4gdGhlIGBuZ0NvbXBvbmVudERlZmBcbiAqIHVudGlsIHRoZSBnbG9iYWwgcXVldWUgaGFzIGJlZW4gcmVzb2x2ZWQgd2l0aCBhIGNhbGwgdG8gYHJlc29sdmVDb21wb25lbnRSZXNvdXJjZXNgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZUNvbXBvbmVudCh0eXBlOiBUeXBlPGFueT4sIG1ldGFkYXRhOiBDb21wb25lbnQpOiB2b2lkIHtcbiAgbGV0IG5nQ29tcG9uZW50RGVmOiBhbnkgPSBudWxsO1xuICAvLyBNZXRhZGF0YSBtYXkgaGF2ZSByZXNvdXJjZXMgd2hpY2ggbmVlZCB0byBiZSByZXNvbHZlZC5cbiAgbWF5YmVRdWV1ZVJlc29sdXRpb25PZkNvbXBvbmVudFJlc291cmNlcyhtZXRhZGF0YSk7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBOR19DT01QT05FTlRfREVGLCB7XG4gICAgZ2V0OiAoKSA9PiB7XG4gICAgICBjb25zdCBjb21waWxlciA9IGdldENvbXBpbGVyRmFjYWRlKCk7XG4gICAgICBpZiAobmdDb21wb25lbnREZWYgPT09IG51bGwpIHtcbiAgICAgICAgaWYgKGNvbXBvbmVudE5lZWRzUmVzb2x1dGlvbihtZXRhZGF0YSkpIHtcbiAgICAgICAgICBjb25zdCBlcnJvciA9IFtgQ29tcG9uZW50ICcke3JlbmRlclN0cmluZ2lmeSh0eXBlKX0nIGlzIG5vdCByZXNvbHZlZDpgXTtcbiAgICAgICAgICBpZiAobWV0YWRhdGEudGVtcGxhdGVVcmwpIHtcbiAgICAgICAgICAgIGVycm9yLnB1c2goYCAtIHRlbXBsYXRlVXJsOiAke3JlbmRlclN0cmluZ2lmeShtZXRhZGF0YS50ZW1wbGF0ZVVybCl9YCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChtZXRhZGF0YS5zdHlsZVVybHMgJiYgbWV0YWRhdGEuc3R5bGVVcmxzLmxlbmd0aCkge1xuICAgICAgICAgICAgZXJyb3IucHVzaChgIC0gc3R5bGVVcmxzOiAke0pTT04uc3RyaW5naWZ5KG1ldGFkYXRhLnN0eWxlVXJscyl9YCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVycm9yLnB1c2goYERpZCB5b3UgcnVuIGFuZCB3YWl0IGZvciAncmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcygpJz9gKTtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3Iuam9pbignXFxuJykpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWV0YTogUjNDb21wb25lbnRNZXRhZGF0YUZhY2FkZSA9IHtcbiAgICAgICAgICAuLi5kaXJlY3RpdmVNZXRhZGF0YSh0eXBlLCBtZXRhZGF0YSksXG4gICAgICAgICAgdGVtcGxhdGU6IG1ldGFkYXRhLnRlbXBsYXRlIHx8ICcnLFxuICAgICAgICAgIHByZXNlcnZlV2hpdGVzcGFjZXM6IG1ldGFkYXRhLnByZXNlcnZlV2hpdGVzcGFjZXMgfHwgZmFsc2UsXG4gICAgICAgICAgc3R5bGVzOiBtZXRhZGF0YS5zdHlsZXMgfHwgRU1QVFlfQVJSQVksXG4gICAgICAgICAgYW5pbWF0aW9uczogbWV0YWRhdGEuYW5pbWF0aW9ucyxcbiAgICAgICAgICB2aWV3UXVlcmllczogZXh0cmFjdFF1ZXJpZXNNZXRhZGF0YSh0eXBlLCBnZXRSZWZsZWN0KCkucHJvcE1ldGFkYXRhKHR5cGUpLCBpc1ZpZXdRdWVyeSksXG4gICAgICAgICAgZGlyZWN0aXZlczogW10sXG4gICAgICAgICAgY2hhbmdlRGV0ZWN0aW9uOiBtZXRhZGF0YS5jaGFuZ2VEZXRlY3Rpb24sXG4gICAgICAgICAgcGlwZXM6IG5ldyBNYXAoKSxcbiAgICAgICAgICBlbmNhcHN1bGF0aW9uOiBtZXRhZGF0YS5lbmNhcHN1bGF0aW9uIHx8IFZpZXdFbmNhcHN1bGF0aW9uLkVtdWxhdGVkLFxuICAgICAgICAgIGludGVycG9sYXRpb246IG1ldGFkYXRhLmludGVycG9sYXRpb24sXG4gICAgICAgICAgdmlld1Byb3ZpZGVyczogbWV0YWRhdGEudmlld1Byb3ZpZGVycyB8fCBudWxsLFxuICAgICAgICB9O1xuICAgICAgICBuZ0NvbXBvbmVudERlZiA9IGNvbXBpbGVyLmNvbXBpbGVDb21wb25lbnQoXG4gICAgICAgICAgICBhbmd1bGFyQ29yZUVudiwgYG5nOi8vJHtyZW5kZXJTdHJpbmdpZnkodHlwZSl9L3RlbXBsYXRlLmh0bWxgLCBtZXRhKTtcblxuICAgICAgICAvLyBXaGVuIE5nTW9kdWxlIGRlY29yYXRvciBleGVjdXRlZCwgd2UgZW5xdWV1ZWQgdGhlIG1vZHVsZSBkZWZpbml0aW9uIHN1Y2ggdGhhdFxuICAgICAgICAvLyBpdCB3b3VsZCBvbmx5IGRlcXVldWUgYW5kIGFkZCBpdHNlbGYgYXMgbW9kdWxlIHNjb3BlIHRvIGFsbCBvZiBpdHMgZGVjbGFyYXRpb25zLFxuICAgICAgICAvLyBidXQgb25seSBpZiAgaWYgYWxsIG9mIGl0cyBkZWNsYXJhdGlvbnMgaGFkIHJlc29sdmVkLiBUaGlzIGNhbGwgcnVucyB0aGUgY2hlY2tcbiAgICAgICAgLy8gdG8gc2VlIGlmIGFueSBtb2R1bGVzIHRoYXQgYXJlIGluIHRoZSBxdWV1ZSBjYW4gYmUgZGVxdWV1ZWQgYW5kIGFkZCBzY29wZSB0b1xuICAgICAgICAvLyB0aGVpciBkZWNsYXJhdGlvbnMuXG4gICAgICAgIGZsdXNoTW9kdWxlU2NvcGluZ1F1ZXVlQXNNdWNoQXNQb3NzaWJsZSgpO1xuXG4gICAgICAgIC8vIElmIGNvbXBvbmVudCBjb21waWxhdGlvbiBpcyBhc3luYywgdGhlbiB0aGUgQE5nTW9kdWxlIGFubm90YXRpb24gd2hpY2ggZGVjbGFyZXMgdGhlXG4gICAgICAgIC8vIGNvbXBvbmVudCBtYXkgZXhlY3V0ZSBhbmQgc2V0IGFuIG5nU2VsZWN0b3JTY29wZSBwcm9wZXJ0eSBvbiB0aGUgY29tcG9uZW50IHR5cGUuIFRoaXNcbiAgICAgICAgLy8gYWxsb3dzIHRoZSBjb21wb25lbnQgdG8gcGF0Y2ggaXRzZWxmIHdpdGggZGlyZWN0aXZlRGVmcyBmcm9tIHRoZSBtb2R1bGUgYWZ0ZXIgaXRcbiAgICAgICAgLy8gZmluaXNoZXMgY29tcGlsaW5nLlxuICAgICAgICBpZiAoaGFzU2VsZWN0b3JTY29wZSh0eXBlKSkge1xuICAgICAgICAgIGNvbnN0IHNjb3BlcyA9IHRyYW5zaXRpdmVTY29wZXNGb3IodHlwZS5uZ1NlbGVjdG9yU2NvcGUpO1xuICAgICAgICAgIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlKG5nQ29tcG9uZW50RGVmLCBzY29wZXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbmdDb21wb25lbnREZWY7XG4gICAgfSxcbiAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGUsXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBoYXNTZWxlY3RvclNjb3BlPFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IGNvbXBvbmVudCBpcyBUeXBlPFQ+JlxuICAgIHtuZ1NlbGVjdG9yU2NvcGU6IFR5cGU8YW55Pn0ge1xuICByZXR1cm4gKGNvbXBvbmVudCBhc3tuZ1NlbGVjdG9yU2NvcGU/OiBhbnl9KS5uZ1NlbGVjdG9yU2NvcGUgIT09IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBDb21waWxlIGFuIEFuZ3VsYXIgZGlyZWN0aXZlIGFjY29yZGluZyB0byBpdHMgZGVjb3JhdG9yIG1ldGFkYXRhLCBhbmQgcGF0Y2ggdGhlIHJlc3VsdGluZ1xuICogbmdEaXJlY3RpdmVEZWYgb250byB0aGUgY29tcG9uZW50IHR5cGUuXG4gKlxuICogSW4gdGhlIGV2ZW50IHRoYXQgY29tcGlsYXRpb24gaXMgbm90IGltbWVkaWF0ZSwgYGNvbXBpbGVEaXJlY3RpdmVgIHdpbGwgcmV0dXJuIGEgYFByb21pc2VgIHdoaWNoXG4gKiB3aWxsIHJlc29sdmUgd2hlbiBjb21waWxhdGlvbiBjb21wbGV0ZXMgYW5kIHRoZSBkaXJlY3RpdmUgYmVjb21lcyB1c2FibGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlRGlyZWN0aXZlKHR5cGU6IFR5cGU8YW55PiwgZGlyZWN0aXZlOiBEaXJlY3RpdmUpOiB2b2lkIHtcbiAgbGV0IG5nRGlyZWN0aXZlRGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgTkdfRElSRUNUSVZFX0RFRiwge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKG5nRGlyZWN0aXZlRGVmID09PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IGZhY2FkZSA9IGRpcmVjdGl2ZU1ldGFkYXRhKHR5cGUgYXMgQ29tcG9uZW50VHlwZTxhbnk+LCBkaXJlY3RpdmUpO1xuICAgICAgICBuZ0RpcmVjdGl2ZURlZiA9IGdldENvbXBpbGVyRmFjYWRlKCkuY29tcGlsZURpcmVjdGl2ZShcbiAgICAgICAgICAgIGFuZ3VsYXJDb3JlRW52LCBgbmc6Ly8ke3R5cGUgJiYgdHlwZS5uYW1lfS9uZ0RpcmVjdGl2ZURlZi5qc2AsIGZhY2FkZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmdEaXJlY3RpdmVEZWY7XG4gICAgfSxcbiAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGUsXG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXh0ZW5kc0RpcmVjdGx5RnJvbU9iamVjdCh0eXBlOiBUeXBlPGFueT4pOiBib29sZWFuIHtcbiAgcmV0dXJuIE9iamVjdC5nZXRQcm90b3R5cGVPZih0eXBlLnByb3RvdHlwZSkgPT09IE9iamVjdC5wcm90b3R5cGU7XG59XG5cbi8qKlxuICogRXh0cmFjdCB0aGUgYFIzRGlyZWN0aXZlTWV0YWRhdGFgIGZvciBhIHBhcnRpY3VsYXIgZGlyZWN0aXZlIChlaXRoZXIgYSBgRGlyZWN0aXZlYCBvciBhXG4gKiBgQ29tcG9uZW50YCkuXG4gKi9cbmZ1bmN0aW9uIGRpcmVjdGl2ZU1ldGFkYXRhKHR5cGU6IFR5cGU8YW55PiwgbWV0YWRhdGE6IERpcmVjdGl2ZSk6IFIzRGlyZWN0aXZlTWV0YWRhdGFGYWNhZGUge1xuICAvLyBSZWZsZWN0IGlucHV0cyBhbmQgb3V0cHV0cy5cbiAgY29uc3QgcHJvcE1ldGFkYXRhID0gZ2V0UmVmbGVjdCgpLnByb3BNZXRhZGF0YSh0eXBlKTtcblxuICByZXR1cm4ge1xuICAgIG5hbWU6IHR5cGUubmFtZSxcbiAgICB0eXBlOiB0eXBlLFxuICAgIHR5cGVBcmd1bWVudENvdW50OiAwLFxuICAgIHNlbGVjdG9yOiBtZXRhZGF0YS5zZWxlY3RvciAhLFxuICAgIGRlcHM6IHJlZmxlY3REZXBlbmRlbmNpZXModHlwZSksXG4gICAgaG9zdDogbWV0YWRhdGEuaG9zdCB8fCBFTVBUWV9PQkosXG4gICAgcHJvcE1ldGFkYXRhOiBwcm9wTWV0YWRhdGEsXG4gICAgaW5wdXRzOiBtZXRhZGF0YS5pbnB1dHMgfHwgRU1QVFlfQVJSQVksXG4gICAgb3V0cHV0czogbWV0YWRhdGEub3V0cHV0cyB8fCBFTVBUWV9BUlJBWSxcbiAgICBxdWVyaWVzOiBleHRyYWN0UXVlcmllc01ldGFkYXRhKHR5cGUsIHByb3BNZXRhZGF0YSwgaXNDb250ZW50UXVlcnkpLFxuICAgIGxpZmVjeWNsZToge1xuICAgICAgdXNlc09uQ2hhbmdlczogdHlwZS5wcm90b3R5cGUubmdPbkNoYW5nZXMgIT09IHVuZGVmaW5lZCxcbiAgICB9LFxuICAgIHR5cGVTb3VyY2VTcGFuOiBudWxsICEsXG4gICAgdXNlc0luaGVyaXRhbmNlOiAhZXh0ZW5kc0RpcmVjdGx5RnJvbU9iamVjdCh0eXBlKSxcbiAgICBleHBvcnRBczogZXh0cmFjdEV4cG9ydEFzKG1ldGFkYXRhLmV4cG9ydEFzKSxcbiAgICBwcm92aWRlcnM6IG1ldGFkYXRhLnByb3ZpZGVycyB8fCBudWxsLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0VG9SM1F1ZXJ5UHJlZGljYXRlKHNlbGVjdG9yOiBhbnkpOiBhbnl8c3RyaW5nW10ge1xuICByZXR1cm4gdHlwZW9mIHNlbGVjdG9yID09PSAnc3RyaW5nJyA/IHNwbGl0QnlDb21tYShzZWxlY3RvcikgOiByZXNvbHZlRm9yd2FyZFJlZihzZWxlY3Rvcik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0VG9SM1F1ZXJ5TWV0YWRhdGEocHJvcGVydHlOYW1lOiBzdHJpbmcsIGFubjogUXVlcnkpOiBSM1F1ZXJ5TWV0YWRhdGFGYWNhZGUge1xuICByZXR1cm4ge1xuICAgIHByb3BlcnR5TmFtZTogcHJvcGVydHlOYW1lLFxuICAgIHByZWRpY2F0ZTogY29udmVydFRvUjNRdWVyeVByZWRpY2F0ZShhbm4uc2VsZWN0b3IpLFxuICAgIGRlc2NlbmRhbnRzOiBhbm4uZGVzY2VuZGFudHMsXG4gICAgZmlyc3Q6IGFubi5maXJzdCxcbiAgICByZWFkOiBhbm4ucmVhZCA/IGFubi5yZWFkIDogbnVsbFxuICB9O1xufVxuZnVuY3Rpb24gZXh0cmFjdFF1ZXJpZXNNZXRhZGF0YShcbiAgICB0eXBlOiBUeXBlPGFueT4sIHByb3BNZXRhZGF0YToge1trZXk6IHN0cmluZ106IGFueVtdfSxcbiAgICBpc1F1ZXJ5QW5uOiAoYW5uOiBhbnkpID0+IGFubiBpcyBRdWVyeSk6IFIzUXVlcnlNZXRhZGF0YUZhY2FkZVtdIHtcbiAgY29uc3QgcXVlcmllc01ldGE6IFIzUXVlcnlNZXRhZGF0YUZhY2FkZVtdID0gW107XG4gIGZvciAoY29uc3QgZmllbGQgaW4gcHJvcE1ldGFkYXRhKSB7XG4gICAgaWYgKHByb3BNZXRhZGF0YS5oYXNPd25Qcm9wZXJ0eShmaWVsZCkpIHtcbiAgICAgIHByb3BNZXRhZGF0YVtmaWVsZF0uZm9yRWFjaChhbm4gPT4ge1xuICAgICAgICBpZiAoaXNRdWVyeUFubihhbm4pKSB7XG4gICAgICAgICAgaWYgKCFhbm4uc2VsZWN0b3IpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBgQ2FuJ3QgY29uc3RydWN0IGEgcXVlcnkgZm9yIHRoZSBwcm9wZXJ0eSBcIiR7ZmllbGR9XCIgb2YgYCArXG4gICAgICAgICAgICAgICAgYFwiJHtyZW5kZXJTdHJpbmdpZnkodHlwZSl9XCIgc2luY2UgdGhlIHF1ZXJ5IHNlbGVjdG9yIHdhc24ndCBkZWZpbmVkLmApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBxdWVyaWVzTWV0YS5wdXNoKGNvbnZlcnRUb1IzUXVlcnlNZXRhZGF0YShmaWVsZCwgYW5uKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcXVlcmllc01ldGE7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RFeHBvcnRBcyhleHBvcnRBczogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nW118bnVsbCB7XG4gIGlmIChleHBvcnRBcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gZXhwb3J0QXMuc3BsaXQoJywnKS5tYXAocGFydCA9PiBwYXJ0LnRyaW0oKSk7XG59XG5cbmZ1bmN0aW9uIGlzQ29udGVudFF1ZXJ5KHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBRdWVyeSB7XG4gIGNvbnN0IG5hbWUgPSB2YWx1ZS5uZ01ldGFkYXRhTmFtZTtcbiAgcmV0dXJuIG5hbWUgPT09ICdDb250ZW50Q2hpbGQnIHx8IG5hbWUgPT09ICdDb250ZW50Q2hpbGRyZW4nO1xufVxuXG5mdW5jdGlvbiBpc1ZpZXdRdWVyeSh2YWx1ZTogYW55KTogdmFsdWUgaXMgUXVlcnkge1xuICBjb25zdCBuYW1lID0gdmFsdWUubmdNZXRhZGF0YU5hbWU7XG4gIHJldHVybiBuYW1lID09PSAnVmlld0NoaWxkJyB8fCBuYW1lID09PSAnVmlld0NoaWxkcmVuJztcbn1cblxuZnVuY3Rpb24gc3BsaXRCeUNvbW1hKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIHJldHVybiB2YWx1ZS5zcGxpdCgnLCcpLm1hcChwaWVjZSA9PiBwaWVjZS50cmltKCkpO1xufVxuIl19