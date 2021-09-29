/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/utils/load_esm", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.loadEsmModule = void 0;
    /**
     * This uses a dynamic import to load a module which may be ESM.
     * CommonJS code can load ESM code via a dynamic import. Unfortunately, TypeScript
     * will currently, unconditionally downlevel dynamic import into a require call.
     * require calls cannot load ESM code and will result in a runtime error. To workaround
     * this, a Function constructor is used to prevent TypeScript from changing the dynamic import.
     * Once TypeScript provides support for keeping the dynamic import this workaround can
     * be dropped.
     * This is only intended to be used with Angular framework packages.
     *
     * @param modulePath The path of the module to load.
     * @returns A Promise that resolves to the dynamically imported module.
     */
    function loadEsmModule(modulePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const namespaceObject = (yield new Function('modulePath', `return import(modulePath);`)(modulePath));
            // If it is not ESM then the values needed will be stored in the `default` property.
            // TODO_ESM: This can be removed once `@angular/*` packages are ESM only.
            if (namespaceObject.default) {
                return namespaceObject.default;
            }
            else {
                return namespaceObject;
            }
        });
    }
    exports.loadEsmModule = loadEsmModule;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZF9lc20uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvdXRpbHMvbG9hZF9lc20udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBSUg7Ozs7Ozs7Ozs7OztPQVlHO0lBQ0gsU0FBc0IsYUFBYSxDQUFJLFVBQXNCOztZQUMzRCxNQUFNLGVBQWUsR0FDakIsQ0FBQyxNQUFNLElBQUksUUFBUSxDQUFDLFlBQVksRUFBRSw0QkFBNEIsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFFakYsb0ZBQW9GO1lBQ3BGLHlFQUF5RTtZQUN6RSxJQUFJLGVBQWUsQ0FBQyxPQUFPLEVBQUU7Z0JBQzNCLE9BQU8sZUFBZSxDQUFDLE9BQU8sQ0FBQzthQUNoQztpQkFBTTtnQkFDTCxPQUFPLGVBQWUsQ0FBQzthQUN4QjtRQUNILENBQUM7S0FBQTtJQVhELHNDQVdDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VVJMfSBmcm9tICd1cmwnO1xuXG4vKipcbiAqIFRoaXMgdXNlcyBhIGR5bmFtaWMgaW1wb3J0IHRvIGxvYWQgYSBtb2R1bGUgd2hpY2ggbWF5IGJlIEVTTS5cbiAqIENvbW1vbkpTIGNvZGUgY2FuIGxvYWQgRVNNIGNvZGUgdmlhIGEgZHluYW1pYyBpbXBvcnQuIFVuZm9ydHVuYXRlbHksIFR5cGVTY3JpcHRcbiAqIHdpbGwgY3VycmVudGx5LCB1bmNvbmRpdGlvbmFsbHkgZG93bmxldmVsIGR5bmFtaWMgaW1wb3J0IGludG8gYSByZXF1aXJlIGNhbGwuXG4gKiByZXF1aXJlIGNhbGxzIGNhbm5vdCBsb2FkIEVTTSBjb2RlIGFuZCB3aWxsIHJlc3VsdCBpbiBhIHJ1bnRpbWUgZXJyb3IuIFRvIHdvcmthcm91bmRcbiAqIHRoaXMsIGEgRnVuY3Rpb24gY29uc3RydWN0b3IgaXMgdXNlZCB0byBwcmV2ZW50IFR5cGVTY3JpcHQgZnJvbSBjaGFuZ2luZyB0aGUgZHluYW1pYyBpbXBvcnQuXG4gKiBPbmNlIFR5cGVTY3JpcHQgcHJvdmlkZXMgc3VwcG9ydCBmb3Iga2VlcGluZyB0aGUgZHluYW1pYyBpbXBvcnQgdGhpcyB3b3JrYXJvdW5kIGNhblxuICogYmUgZHJvcHBlZC5cbiAqIFRoaXMgaXMgb25seSBpbnRlbmRlZCB0byBiZSB1c2VkIHdpdGggQW5ndWxhciBmcmFtZXdvcmsgcGFja2FnZXMuXG4gKlxuICogQHBhcmFtIG1vZHVsZVBhdGggVGhlIHBhdGggb2YgdGhlIG1vZHVsZSB0byBsb2FkLlxuICogQHJldHVybnMgQSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIGR5bmFtaWNhbGx5IGltcG9ydGVkIG1vZHVsZS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRFc21Nb2R1bGU8VD4obW9kdWxlUGF0aDogc3RyaW5nfFVSTCk6IFByb21pc2U8VD4ge1xuICBjb25zdCBuYW1lc3BhY2VPYmplY3QgPVxuICAgICAgKGF3YWl0IG5ldyBGdW5jdGlvbignbW9kdWxlUGF0aCcsIGByZXR1cm4gaW1wb3J0KG1vZHVsZVBhdGgpO2ApKG1vZHVsZVBhdGgpKTtcblxuICAvLyBJZiBpdCBpcyBub3QgRVNNIHRoZW4gdGhlIHZhbHVlcyBuZWVkZWQgd2lsbCBiZSBzdG9yZWQgaW4gdGhlIGBkZWZhdWx0YCBwcm9wZXJ0eS5cbiAgLy8gVE9ET19FU006IFRoaXMgY2FuIGJlIHJlbW92ZWQgb25jZSBgQGFuZ3VsYXIvKmAgcGFja2FnZXMgYXJlIEVTTSBvbmx5LlxuICBpZiAobmFtZXNwYWNlT2JqZWN0LmRlZmF1bHQpIHtcbiAgICByZXR1cm4gbmFtZXNwYWNlT2JqZWN0LmRlZmF1bHQ7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5hbWVzcGFjZU9iamVjdDtcbiAgfVxufVxuIl19