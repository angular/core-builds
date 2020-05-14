/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/utils/schematics_prompt", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getInquirer = exports.supportsPrompt = void 0;
    let resolvedInquirerModule;
    try {
        // "inquirer" is the prompt module also used by the devkit schematics CLI
        // in order to show prompts for schematics. We transitively depend on this
        // module, but don't want to throw an exception if the module is not
        // installed for some reason. In that case prompts are just not supported.
        resolvedInquirerModule = require('inquirer');
    }
    catch (e) {
        resolvedInquirerModule = null;
    }
    /** Whether prompts are currently supported. */
    function supportsPrompt() {
        return !!resolvedInquirerModule && !!process.stdin.isTTY;
    }
    exports.supportsPrompt = supportsPrompt;
    /**
     * Gets the resolved instance of "inquirer" which can be used to programmatically
     * create prompts.
     */
    function getInquirer() {
        return resolvedInquirerModule;
    }
    exports.getInquirer = getInquirer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hdGljc19wcm9tcHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvdXRpbHMvc2NoZW1hdGljc19wcm9tcHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBSUgsSUFBSSxzQkFBcUMsQ0FBQztJQUUxQyxJQUFJO1FBQ0YseUVBQXlFO1FBQ3pFLDBFQUEwRTtRQUMxRSxvRUFBb0U7UUFDcEUsMEVBQTBFO1FBQzFFLHNCQUFzQixHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUM5QztJQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ1Ysc0JBQXNCLEdBQUcsSUFBSSxDQUFDO0tBQy9CO0lBRUQsK0NBQStDO0lBQy9DLFNBQWdCLGNBQWM7UUFDNUIsT0FBTyxDQUFDLENBQUMsc0JBQXNCLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO0lBQzNELENBQUM7SUFGRCx3Q0FFQztJQUVEOzs7T0FHRztJQUNILFNBQWdCLFdBQVc7UUFDekIsT0FBTyxzQkFBdUIsQ0FBQztJQUNqQyxDQUFDO0lBRkQsa0NBRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbnR5cGUgSW5xdWlyZXIgPSB0eXBlb2YgaW1wb3J0KCdpbnF1aXJlcicpO1xuXG5sZXQgcmVzb2x2ZWRJbnF1aXJlck1vZHVsZTogSW5xdWlyZXJ8bnVsbDtcblxudHJ5IHtcbiAgLy8gXCJpbnF1aXJlclwiIGlzIHRoZSBwcm9tcHQgbW9kdWxlIGFsc28gdXNlZCBieSB0aGUgZGV2a2l0IHNjaGVtYXRpY3MgQ0xJXG4gIC8vIGluIG9yZGVyIHRvIHNob3cgcHJvbXB0cyBmb3Igc2NoZW1hdGljcy4gV2UgdHJhbnNpdGl2ZWx5IGRlcGVuZCBvbiB0aGlzXG4gIC8vIG1vZHVsZSwgYnV0IGRvbid0IHdhbnQgdG8gdGhyb3cgYW4gZXhjZXB0aW9uIGlmIHRoZSBtb2R1bGUgaXMgbm90XG4gIC8vIGluc3RhbGxlZCBmb3Igc29tZSByZWFzb24uIEluIHRoYXQgY2FzZSBwcm9tcHRzIGFyZSBqdXN0IG5vdCBzdXBwb3J0ZWQuXG4gIHJlc29sdmVkSW5xdWlyZXJNb2R1bGUgPSByZXF1aXJlKCdpbnF1aXJlcicpO1xufSBjYXRjaCAoZSkge1xuICByZXNvbHZlZElucXVpcmVyTW9kdWxlID0gbnVsbDtcbn1cblxuLyoqIFdoZXRoZXIgcHJvbXB0cyBhcmUgY3VycmVudGx5IHN1cHBvcnRlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdXBwb3J0c1Byb21wdCgpOiBib29sZWFuIHtcbiAgcmV0dXJuICEhcmVzb2x2ZWRJbnF1aXJlck1vZHVsZSAmJiAhIXByb2Nlc3Muc3RkaW4uaXNUVFk7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgcmVzb2x2ZWQgaW5zdGFuY2Ugb2YgXCJpbnF1aXJlclwiIHdoaWNoIGNhbiBiZSB1c2VkIHRvIHByb2dyYW1tYXRpY2FsbHlcbiAqIGNyZWF0ZSBwcm9tcHRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5xdWlyZXIoKTogSW5xdWlyZXIge1xuICByZXR1cm4gcmVzb2x2ZWRJbnF1aXJlck1vZHVsZSE7XG59XG4iXX0=