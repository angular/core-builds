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
import { compileComponent as compileIvyComponent, parseTemplate, ConstantPool, makeBindingParser, WrappedNodeExpr, jitPatchDefinition, } from '@angular/compiler';
import { angularCoreEnv } from './environment';
import { reflectDependencies } from './util';
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
    // Parse the template and check for errors.
    const /** @type {?} */ template = parseTemplate(/** @type {?} */ ((metadata.template)), `ng://${type.name}/template.html`);
    if (template.errors !== undefined) {
        const /** @type {?} */ errors = template.errors.map(err => err.toString()).join(', ');
        throw new Error(`Errors during JIT compilation of template for ${type.name}: ${errors}`);
    }
    // The ConstantPool is a requirement of the JIT'er.
    const /** @type {?} */ constantPool = new ConstantPool();
    // Compile the component metadata, including template, into an expression.
    // TODO(alxhub): implement inputs, outputs, queries, etc.
    const /** @type {?} */ res = compileIvyComponent({
        name: type.name,
        type: new WrappedNodeExpr(type),
        selector: /** @type {?} */ ((metadata.selector)), template,
        deps: reflectDependencies(type),
        directives: new Map(),
        pipes: new Map(),
        host: {
            attributes: {},
            listeners: {},
            properties: {},
        },
        inputs: {},
        outputs: {},
        lifecycle: {
            usesOnChanges: false,
        },
        queries: [],
        typeSourceSpan: /** @type {?} */ ((null)),
        viewQueries: [],
    }, constantPool, makeBindingParser());
    // Patch the generated expression as ngComponentDef on the type.
    jitPatchDefinition(type, 'ngComponentDef', res.expression, angularCoreEnv, constantPool);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGdCQUFnQixJQUFJLG1CQUFtQixFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsaUJBQWlCLEVBQUUsZUFBZSxFQUFFLGtCQUFrQixHQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFNaEssT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM3QyxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFM0MscUJBQUksZ0JBQWdCLEdBQW9CLEVBQUUsQ0FBQzs7Ozs7Ozs7Ozs7OztBQVczQyxNQUFNLDJCQUEyQixJQUFlLEVBQUUsUUFBbUI7O0lBRW5FLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFO1FBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQUMsK0JBQStCLENBQUMsQ0FBQztLQUNsRDs7SUFHRCx1QkFBTSxRQUFRLEdBQUcsYUFBYSxvQkFBQyxRQUFRLENBQUMsUUFBUSxJQUFJLFFBQVEsSUFBSSxDQUFDLElBQUksZ0JBQWdCLENBQUMsQ0FBQztJQUN2RixJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssU0FBUyxFQUFFO1FBQ2pDLHVCQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyRSxNQUFNLElBQUksS0FBSyxDQUFDLGlEQUFpRCxJQUFJLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRSxDQUFDLENBQUM7S0FDMUY7O0lBR0QsdUJBQU0sWUFBWSxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7OztJQUl4Qyx1QkFBTSxHQUFHLEdBQUcsbUJBQW1CLENBQzNCO1FBQ0UsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1FBQ2YsSUFBSSxFQUFFLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQztRQUMvQixRQUFRLHFCQUFFLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxRQUFRO1FBQ3ZDLElBQUksRUFBRSxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7UUFDL0IsVUFBVSxFQUFFLElBQUksR0FBRyxFQUFFO1FBQ3JCLEtBQUssRUFBRSxJQUFJLEdBQUcsRUFBRTtRQUNoQixJQUFJLEVBQUU7WUFDSixVQUFVLEVBQUUsRUFBRTtZQUNkLFNBQVMsRUFBRSxFQUFFO1lBQ2IsVUFBVSxFQUFFLEVBQUU7U0FDZjtRQUNELE1BQU0sRUFBRSxFQUFFO1FBQ1YsT0FBTyxFQUFFLEVBQUU7UUFDWCxTQUFTLEVBQUU7WUFDVCxhQUFhLEVBQUUsS0FBSztTQUNyQjtRQUNELE9BQU8sRUFBRSxFQUFFO1FBQ1gsY0FBYyxxQkFBRSxJQUFJLEVBQUU7UUFDdEIsV0FBVyxFQUFFLEVBQUU7S0FDaEIsRUFDRCxZQUFZLEVBQUUsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDOztJQUd2QyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsR0FBRyxDQUFDLFVBQVUsRUFBRSxjQUFjLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDekYsT0FBTyxJQUFJLENBQUM7Q0FDYjs7Ozs7Ozs7OztBQVFELE1BQU0sb0NBQW9DLElBQWUsRUFBRSxRQUFtQjtJQUM1RSx1QkFBTSxHQUFHLEdBQUcsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzdDLElBQUksR0FBRyxLQUFLLElBQUksRUFBRTtRQUNoQixnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDNUI7Q0FDRjs7Ozs7O0FBTUQsTUFBTTtJQUNKLHVCQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2hFLGdCQUFnQixHQUFHLEVBQUUsQ0FBQztJQUN0QixPQUFPLEdBQUcsQ0FBQztDQUNaIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2NvbXBpbGVDb21wb25lbnQgYXMgY29tcGlsZUl2eUNvbXBvbmVudCwgcGFyc2VUZW1wbGF0ZSwgQ29uc3RhbnRQb29sLCBtYWtlQmluZGluZ1BhcnNlciwgV3JhcHBlZE5vZGVFeHByLCBqaXRQYXRjaERlZmluaXRpb24sfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5cbmltcG9ydCB7Q29tcG9uZW50fSBmcm9tICcuLi8uLi9tZXRhZGF0YS9kaXJlY3RpdmVzJztcbmltcG9ydCB7UmVmbGVjdGlvbkNhcGFiaWxpdGllc30gZnJvbSAnLi4vLi4vcmVmbGVjdGlvbi9yZWZsZWN0aW9uX2NhcGFiaWxpdGllcyc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL3R5cGUnO1xuXG5pbXBvcnQge2FuZ3VsYXJDb3JlRW52fSBmcm9tICcuL2Vudmlyb25tZW50JztcbmltcG9ydCB7cmVmbGVjdERlcGVuZGVuY2llc30gZnJvbSAnLi91dGlsJztcblxubGV0IF9wZW5kaW5nUHJvbWlzZXM6IFByb21pc2U8dm9pZD5bXSA9IFtdO1xuXG4vKipcbiAqIENvbXBpbGUgYW4gQW5ndWxhciBjb21wb25lbnQgYWNjb3JkaW5nIHRvIGl0cyBkZWNvcmF0b3IgbWV0YWRhdGEsIGFuZCBwYXRjaCB0aGUgcmVzdWx0aW5nXG4gKiBuZ0NvbXBvbmVudERlZiBvbnRvIHRoZSBjb21wb25lbnQgdHlwZS5cbiAqXG4gKiBDb21waWxhdGlvbiBtYXkgYmUgYXN5bmNocm9ub3VzIChkdWUgdG8gdGhlIG5lZWQgdG8gcmVzb2x2ZSBVUkxzIGZvciB0aGUgY29tcG9uZW50IHRlbXBsYXRlIG9yXG4gKiBvdGhlciByZXNvdXJjZXMsIGZvciBleGFtcGxlKS4gSW4gdGhlIGV2ZW50IHRoYXQgY29tcGlsYXRpb24gaXMgbm90IGltbWVkaWF0ZSwgYGNvbXBpbGVDb21wb25lbnRgXG4gKiB3aWxsIHJldHVybiBhIGBQcm9taXNlYCB3aGljaCB3aWxsIHJlc29sdmUgd2hlbiBjb21waWxhdGlvbiBjb21wbGV0ZXMgYW5kIHRoZSBjb21wb25lbnQgYmVjb21lc1xuICogdXNhYmxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZUNvbXBvbmVudCh0eXBlOiBUeXBlPGFueT4sIG1ldGFkYXRhOiBDb21wb25lbnQpOiBQcm9taXNlPHZvaWQ+fG51bGwge1xuICAvLyBUT0RPKGFseGh1Yik6IGltcGxlbWVudCBSZXNvdXJjZUxvYWRlciBzdXBwb3J0IGZvciB0ZW1wbGF0ZSBjb21waWxhdGlvbi5cbiAgaWYgKCFtZXRhZGF0YS50ZW1wbGF0ZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigndGVtcGxhdGVVcmwgbm90IHlldCBzdXBwb3J0ZWQnKTtcbiAgfVxuXG4gIC8vIFBhcnNlIHRoZSB0ZW1wbGF0ZSBhbmQgY2hlY2sgZm9yIGVycm9ycy5cbiAgY29uc3QgdGVtcGxhdGUgPSBwYXJzZVRlbXBsYXRlKG1ldGFkYXRhLnRlbXBsYXRlICEsIGBuZzovLyR7dHlwZS5uYW1lfS90ZW1wbGF0ZS5odG1sYCk7XG4gIGlmICh0ZW1wbGF0ZS5lcnJvcnMgIT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IGVycm9ycyA9IHRlbXBsYXRlLmVycm9ycy5tYXAoZXJyID0+IGVyci50b1N0cmluZygpKS5qb2luKCcsICcpO1xuICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3JzIGR1cmluZyBKSVQgY29tcGlsYXRpb24gb2YgdGVtcGxhdGUgZm9yICR7dHlwZS5uYW1lfTogJHtlcnJvcnN9YCk7XG4gIH1cblxuICAvLyBUaGUgQ29uc3RhbnRQb29sIGlzIGEgcmVxdWlyZW1lbnQgb2YgdGhlIEpJVCdlci5cbiAgY29uc3QgY29uc3RhbnRQb29sID0gbmV3IENvbnN0YW50UG9vbCgpO1xuXG4gIC8vIENvbXBpbGUgdGhlIGNvbXBvbmVudCBtZXRhZGF0YSwgaW5jbHVkaW5nIHRlbXBsYXRlLCBpbnRvIGFuIGV4cHJlc3Npb24uXG4gIC8vIFRPRE8oYWx4aHViKTogaW1wbGVtZW50IGlucHV0cywgb3V0cHV0cywgcXVlcmllcywgZXRjLlxuICBjb25zdCByZXMgPSBjb21waWxlSXZ5Q29tcG9uZW50KFxuICAgICAge1xuICAgICAgICBuYW1lOiB0eXBlLm5hbWUsXG4gICAgICAgIHR5cGU6IG5ldyBXcmFwcGVkTm9kZUV4cHIodHlwZSksXG4gICAgICAgIHNlbGVjdG9yOiBtZXRhZGF0YS5zZWxlY3RvciAhLCB0ZW1wbGF0ZSxcbiAgICAgICAgZGVwczogcmVmbGVjdERlcGVuZGVuY2llcyh0eXBlKSxcbiAgICAgICAgZGlyZWN0aXZlczogbmV3IE1hcCgpLFxuICAgICAgICBwaXBlczogbmV3IE1hcCgpLFxuICAgICAgICBob3N0OiB7XG4gICAgICAgICAgYXR0cmlidXRlczoge30sXG4gICAgICAgICAgbGlzdGVuZXJzOiB7fSxcbiAgICAgICAgICBwcm9wZXJ0aWVzOiB7fSxcbiAgICAgICAgfSxcbiAgICAgICAgaW5wdXRzOiB7fSxcbiAgICAgICAgb3V0cHV0czoge30sXG4gICAgICAgIGxpZmVjeWNsZToge1xuICAgICAgICAgIHVzZXNPbkNoYW5nZXM6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICBxdWVyaWVzOiBbXSxcbiAgICAgICAgdHlwZVNvdXJjZVNwYW46IG51bGwgISxcbiAgICAgICAgdmlld1F1ZXJpZXM6IFtdLFxuICAgICAgfSxcbiAgICAgIGNvbnN0YW50UG9vbCwgbWFrZUJpbmRpbmdQYXJzZXIoKSk7XG5cbiAgLy8gUGF0Y2ggdGhlIGdlbmVyYXRlZCBleHByZXNzaW9uIGFzIG5nQ29tcG9uZW50RGVmIG9uIHRoZSB0eXBlLlxuICBqaXRQYXRjaERlZmluaXRpb24odHlwZSwgJ25nQ29tcG9uZW50RGVmJywgcmVzLmV4cHJlc3Npb24sIGFuZ3VsYXJDb3JlRW52LCBjb25zdGFudFBvb2wpO1xuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBBIHdyYXBwZXIgYXJvdW5kIGBjb21waWxlQ29tcG9uZW50YCB3aGljaCBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGZvciB0aGUgYEBDb21wb25lbnRgIGRlY29yYXRvci5cbiAqXG4gKiBUaGlzIHdyYXBwZXIga2VlcHMgdHJhY2sgb2YgdGhlIGBQcm9taXNlYCByZXR1cm5lZCBieSBgY29tcGlsZUNvbXBvbmVudGAgYW5kIHdpbGwgY2F1c2VcbiAqIGBhd2FpdEN1cnJlbnRseUNvbXBpbGluZ0NvbXBvbmVudHNgIHRvIHdhaXQgb24gdGhlIGNvbXBpbGF0aW9uIHRvIGJlIGZpbmlzaGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZUNvbXBvbmVudERlY29yYXRvcih0eXBlOiBUeXBlPGFueT4sIG1ldGFkYXRhOiBDb21wb25lbnQpOiB2b2lkIHtcbiAgY29uc3QgcmVzID0gY29tcGlsZUNvbXBvbmVudCh0eXBlLCBtZXRhZGF0YSk7XG4gIGlmIChyZXMgIT09IG51bGwpIHtcbiAgICBfcGVuZGluZ1Byb21pc2VzLnB1c2gocmVzKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgYSBwcm9taXNlIHdoaWNoIHdpbGwgYXdhaXQgdGhlIGNvbXBpbGF0aW9uIG9mIGFueSBgQENvbXBvbmVudGBzIHdoaWNoIGhhdmUgYmVlbiBkZWZpbmVkXG4gKiBzaW5jZSB0aGUgbGFzdCB0aW1lIGBhd2FpdEN1cnJlbnRseUNvbXBpbGluZ0NvbXBvbmVudHNgIHdhcyBjYWxsZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhd2FpdEN1cnJlbnRseUNvbXBpbGluZ0NvbXBvbmVudHMoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHJlcyA9IFByb21pc2UuYWxsKF9wZW5kaW5nUHJvbWlzZXMpLnRoZW4oKCkgPT4gdW5kZWZpbmVkKTtcbiAgX3BlbmRpbmdQcm9taXNlcyA9IFtdO1xuICByZXR1cm4gcmVzO1xufVxuIl19