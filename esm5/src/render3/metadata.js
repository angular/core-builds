/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
/**
 * Adds decorator, constructor, and property metadata to a given type via static metadata fields
 * on the type.
 *
 * These metadata fields can later be read with Angular's `ReflectionCapabilities` API.
 *
 * Calls to `setClassMetadata` can be marked as pure, resulting in the metadata assignments being
 * tree-shaken away during production builds.
 */
export function setClassMetadata(type, decorators, ctorParameters, propDecorators) {
    var _a;
    var clazz = type;
    if (decorators !== null) {
        if (clazz.hasOwnProperty('decorators') && clazz.decorators !== undefined) {
            (_a = clazz.decorators).push.apply(_a, tslib_1.__spread(decorators));
        }
        else {
            clazz.decorators = decorators;
        }
    }
    if (ctorParameters !== null) {
        // Rather than merging, clobber the existing parameters. If other projects exist which use
        // tsickle-style annotations and reflect over them in the same way, this could cause issues,
        // but that is vanishingly unlikely.
        clazz.ctorParameters = ctorParameters;
    }
    if (propDecorators !== null) {
        // The property decorator objects are merged as it is possible different fields have different
        // decorator types. Decorators on individual fields are not merged, as it's also incredibly
        // unlikely that a field will be decorated both with an Angular decorator and a non-Angular
        // decorator that's also been downleveled.
        if (clazz.propDecorators !== undefined) {
            clazz.propDecorators = tslib_1.__assign({}, clazz.propDecorators, propDecorators);
        }
        else {
            clazz.propDecorators = propDecorators;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YWRhdGEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL21ldGFkYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFVSDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FDNUIsSUFBZSxFQUFFLFVBQXdCLEVBQUUsY0FBb0MsRUFDL0UsY0FBNkM7O0lBQy9DLElBQU0sS0FBSyxHQUFHLElBQXdCLENBQUM7SUFDdkMsSUFBSSxVQUFVLEtBQUssSUFBSSxFQUFFO1FBQ3ZCLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRTtZQUN4RSxDQUFBLEtBQUEsS0FBSyxDQUFDLFVBQVUsQ0FBQSxDQUFDLElBQUksNEJBQUksVUFBVSxHQUFFO1NBQ3RDO2FBQU07WUFDTCxLQUFLLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztTQUMvQjtLQUNGO0lBQ0QsSUFBSSxjQUFjLEtBQUssSUFBSSxFQUFFO1FBQzNCLDBGQUEwRjtRQUMxRiw0RkFBNEY7UUFDNUYsb0NBQW9DO1FBQ3BDLEtBQUssQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO0tBQ3ZDO0lBQ0QsSUFBSSxjQUFjLEtBQUssSUFBSSxFQUFFO1FBQzNCLDhGQUE4RjtRQUM5RiwyRkFBMkY7UUFDM0YsMkZBQTJGO1FBQzNGLDBDQUEwQztRQUMxQyxJQUFJLEtBQUssQ0FBQyxjQUFjLEtBQUssU0FBUyxFQUFFO1lBQ3RDLEtBQUssQ0FBQyxjQUFjLHdCQUFPLEtBQUssQ0FBQyxjQUFjLEVBQUssY0FBYyxDQUFDLENBQUM7U0FDckU7YUFBTTtZQUNMLEtBQUssQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO1NBQ3ZDO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcblxuaW50ZXJmYWNlIFR5cGVXaXRoTWV0YWRhdGEgZXh0ZW5kcyBUeXBlPGFueT4ge1xuICBkZWNvcmF0b3JzPzogYW55W107XG4gIGN0b3JQYXJhbWV0ZXJzPzogKCkgPT4gYW55W107XG4gIHByb3BEZWNvcmF0b3JzPzoge1tmaWVsZDogc3RyaW5nXTogYW55fTtcbn1cblxuLyoqXG4gKiBBZGRzIGRlY29yYXRvciwgY29uc3RydWN0b3IsIGFuZCBwcm9wZXJ0eSBtZXRhZGF0YSB0byBhIGdpdmVuIHR5cGUgdmlhIHN0YXRpYyBtZXRhZGF0YSBmaWVsZHNcbiAqIG9uIHRoZSB0eXBlLlxuICpcbiAqIFRoZXNlIG1ldGFkYXRhIGZpZWxkcyBjYW4gbGF0ZXIgYmUgcmVhZCB3aXRoIEFuZ3VsYXIncyBgUmVmbGVjdGlvbkNhcGFiaWxpdGllc2AgQVBJLlxuICpcbiAqIENhbGxzIHRvIGBzZXRDbGFzc01ldGFkYXRhYCBjYW4gYmUgbWFya2VkIGFzIHB1cmUsIHJlc3VsdGluZyBpbiB0aGUgbWV0YWRhdGEgYXNzaWdubWVudHMgYmVpbmdcbiAqIHRyZWUtc2hha2VuIGF3YXkgZHVyaW5nIHByb2R1Y3Rpb24gYnVpbGRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0Q2xhc3NNZXRhZGF0YShcbiAgICB0eXBlOiBUeXBlPGFueT4sIGRlY29yYXRvcnM6IGFueVtdIHwgbnVsbCwgY3RvclBhcmFtZXRlcnM6ICgoKSA9PiBhbnlbXSkgfCBudWxsLFxuICAgIHByb3BEZWNvcmF0b3JzOiB7W2ZpZWxkOiBzdHJpbmddOiBhbnl9IHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBjbGF6eiA9IHR5cGUgYXMgVHlwZVdpdGhNZXRhZGF0YTtcbiAgaWYgKGRlY29yYXRvcnMgIT09IG51bGwpIHtcbiAgICBpZiAoY2xhenouaGFzT3duUHJvcGVydHkoJ2RlY29yYXRvcnMnKSAmJiBjbGF6ei5kZWNvcmF0b3JzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNsYXp6LmRlY29yYXRvcnMucHVzaCguLi5kZWNvcmF0b3JzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2xhenouZGVjb3JhdG9ycyA9IGRlY29yYXRvcnM7XG4gICAgfVxuICB9XG4gIGlmIChjdG9yUGFyYW1ldGVycyAhPT0gbnVsbCkge1xuICAgIC8vIFJhdGhlciB0aGFuIG1lcmdpbmcsIGNsb2JiZXIgdGhlIGV4aXN0aW5nIHBhcmFtZXRlcnMuIElmIG90aGVyIHByb2plY3RzIGV4aXN0IHdoaWNoIHVzZVxuICAgIC8vIHRzaWNrbGUtc3R5bGUgYW5ub3RhdGlvbnMgYW5kIHJlZmxlY3Qgb3ZlciB0aGVtIGluIHRoZSBzYW1lIHdheSwgdGhpcyBjb3VsZCBjYXVzZSBpc3N1ZXMsXG4gICAgLy8gYnV0IHRoYXQgaXMgdmFuaXNoaW5nbHkgdW5saWtlbHkuXG4gICAgY2xhenouY3RvclBhcmFtZXRlcnMgPSBjdG9yUGFyYW1ldGVycztcbiAgfVxuICBpZiAocHJvcERlY29yYXRvcnMgIT09IG51bGwpIHtcbiAgICAvLyBUaGUgcHJvcGVydHkgZGVjb3JhdG9yIG9iamVjdHMgYXJlIG1lcmdlZCBhcyBpdCBpcyBwb3NzaWJsZSBkaWZmZXJlbnQgZmllbGRzIGhhdmUgZGlmZmVyZW50XG4gICAgLy8gZGVjb3JhdG9yIHR5cGVzLiBEZWNvcmF0b3JzIG9uIGluZGl2aWR1YWwgZmllbGRzIGFyZSBub3QgbWVyZ2VkLCBhcyBpdCdzIGFsc28gaW5jcmVkaWJseVxuICAgIC8vIHVubGlrZWx5IHRoYXQgYSBmaWVsZCB3aWxsIGJlIGRlY29yYXRlZCBib3RoIHdpdGggYW4gQW5ndWxhciBkZWNvcmF0b3IgYW5kIGEgbm9uLUFuZ3VsYXJcbiAgICAvLyBkZWNvcmF0b3IgdGhhdCdzIGFsc28gYmVlbiBkb3dubGV2ZWxlZC5cbiAgICBpZiAoY2xhenoucHJvcERlY29yYXRvcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY2xhenoucHJvcERlY29yYXRvcnMgPSB7Li4uY2xhenoucHJvcERlY29yYXRvcnMsIC4uLnByb3BEZWNvcmF0b3JzfTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2xhenoucHJvcERlY29yYXRvcnMgPSBwcm9wRGVjb3JhdG9ycztcbiAgICB9XG4gIH1cbn1cbiJdfQ==