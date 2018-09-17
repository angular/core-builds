/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { Injectable } from './di';
let Console = class Console {
    log(message) {
        // tslint:disable-next-line:no-console
        console.log(message);
    }
    // Note: for reporting errors use `DOM.logError()` as it is platform specific
    warn(message) {
        // tslint:disable-next-line:no-console
        console.warn(message);
    }
};
Console = tslib_1.__decorate([
    Injectable()
], Console);
export { Console };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc29sZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2NvbnNvbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFHaEMsSUFBYSxPQUFPLEdBQXBCLE1BQWEsT0FBTztJQUNsQixHQUFHLENBQUMsT0FBZTtRQUNqQixzQ0FBc0M7UUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN2QixDQUFDO0lBQ0QsNkVBQTZFO0lBQzdFLElBQUksQ0FBQyxPQUFlO1FBQ2xCLHNDQUFzQztRQUN0QyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3hCLENBQUM7Q0FDRixDQUFBO0FBVlksT0FBTztJQURuQixVQUFVLEVBQUU7R0FDQSxPQUFPLENBVW5CO1NBVlksT0FBTyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tICcuL2RpJztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIENvbnNvbGUge1xuICBsb2cobWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWNvbnNvbGVcbiAgICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbiAgfVxuICAvLyBOb3RlOiBmb3IgcmVwb3J0aW5nIGVycm9ycyB1c2UgYERPTS5sb2dFcnJvcigpYCBhcyBpdCBpcyBwbGF0Zm9ybSBzcGVjaWZpY1xuICB3YXJuKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1jb25zb2xlXG4gICAgY29uc29sZS53YXJuKG1lc3NhZ2UpO1xuICB9XG59XG4iXX0=