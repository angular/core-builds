/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { Component, Directive, NgModule, Pipe, ɵReflectionCapabilities as ReflectionCapabilities } from '@angular/core';
import { MetadataOverrider } from './metadata_overrider';
var reflection = new ReflectionCapabilities();
/**
 * Allows to override ivy metadata for tests (via the `TestBed`).
 */
var OverrideResolver = /** @class */ (function () {
    function OverrideResolver() {
        this.overrides = new Map();
        this.resolved = new Map();
    }
    OverrideResolver.prototype.setOverrides = function (overrides) {
        var _this = this;
        this.overrides.clear();
        overrides.forEach(function (_a) {
            var _b = tslib_1.__read(_a, 2), type = _b[0], override = _b[1];
            var overrides = _this.overrides.get(type) || [];
            overrides.push(override);
            _this.overrides.set(type, overrides);
        });
    };
    OverrideResolver.prototype.getAnnotation = function (type) {
        var annotations = reflection.annotations(type);
        // Try to find the nearest known Type annotation and make sure that this annotation is an
        // instance of the type we are looking for, so we can use it for resolution. Note: there might
        // be multiple known annotations found due to the fact that Components can extend Directives (so
        // both Directive and Component annotations would be present), so we always check if the known
        // annotation has the right type.
        for (var i = annotations.length - 1; i >= 0; i--) {
            var annotation = annotations[i];
            var isKnownType = annotation instanceof Directive || annotation instanceof Component ||
                annotation instanceof Pipe || annotation instanceof NgModule;
            if (isKnownType) {
                return annotation instanceof this.type ? annotation : null;
            }
        }
        return null;
    };
    OverrideResolver.prototype.resolve = function (type) {
        var _this = this;
        var resolved = this.resolved.get(type) || null;
        if (!resolved) {
            resolved = this.getAnnotation(type);
            if (resolved) {
                var overrides = this.overrides.get(type);
                if (overrides) {
                    var overrider_1 = new MetadataOverrider();
                    overrides.forEach(function (override) {
                        resolved = overrider_1.overrideMetadata(_this.type, resolved, override);
                    });
                }
            }
            this.resolved.set(type, resolved);
        }
        return resolved;
    };
    return OverrideResolver;
}());
var DirectiveResolver = /** @class */ (function (_super) {
    tslib_1.__extends(DirectiveResolver, _super);
    function DirectiveResolver() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(DirectiveResolver.prototype, "type", {
        get: function () { return Directive; },
        enumerable: true,
        configurable: true
    });
    return DirectiveResolver;
}(OverrideResolver));
export { DirectiveResolver };
var ComponentResolver = /** @class */ (function (_super) {
    tslib_1.__extends(ComponentResolver, _super);
    function ComponentResolver() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ComponentResolver.prototype, "type", {
        get: function () { return Component; },
        enumerable: true,
        configurable: true
    });
    return ComponentResolver;
}(OverrideResolver));
export { ComponentResolver };
var PipeResolver = /** @class */ (function (_super) {
    tslib_1.__extends(PipeResolver, _super);
    function PipeResolver() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(PipeResolver.prototype, "type", {
        get: function () { return Pipe; },
        enumerable: true,
        configurable: true
    });
    return PipeResolver;
}(OverrideResolver));
export { PipeResolver };
var NgModuleResolver = /** @class */ (function (_super) {
    tslib_1.__extends(NgModuleResolver, _super);
    function NgModuleResolver() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(NgModuleResolver.prototype, "type", {
        get: function () { return NgModule; },
        enumerable: true,
        configurable: true
    });
    return NgModuleResolver;
}(OverrideResolver));
export { NgModuleResolver };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy9yZXNvbHZlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQVEsdUJBQXVCLElBQUksc0JBQXNCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFHNUgsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFFdkQsSUFBTSxVQUFVLEdBQUcsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO0FBT2hEOztHQUVHO0FBQ0g7SUFBQTtRQUNVLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBb0MsQ0FBQztRQUN4RCxhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQXFCLENBQUM7SUFrRGxELENBQUM7SUE5Q0MsdUNBQVksR0FBWixVQUFhLFNBQWtEO1FBQS9ELGlCQU9DO1FBTkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN2QixTQUFTLENBQUMsT0FBTyxDQUFDLFVBQUMsRUFBZ0I7Z0JBQWhCLDBCQUFnQixFQUFmLFlBQUksRUFBRSxnQkFBUTtZQUNoQyxJQUFNLFNBQVMsR0FBRyxLQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDakQsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN6QixLQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDdEMsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsd0NBQWEsR0FBYixVQUFjLElBQWU7UUFDM0IsSUFBTSxXQUFXLEdBQUcsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqRCx5RkFBeUY7UUFDekYsOEZBQThGO1FBQzlGLGdHQUFnRztRQUNoRyw4RkFBOEY7UUFDOUYsaUNBQWlDO1FBQ2pDLEtBQUssSUFBSSxDQUFDLEdBQUcsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNoRCxJQUFNLFVBQVUsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEMsSUFBTSxXQUFXLEdBQUcsVUFBVSxZQUFZLFNBQVMsSUFBSSxVQUFVLFlBQVksU0FBUztnQkFDbEYsVUFBVSxZQUFZLElBQUksSUFBSSxVQUFVLFlBQVksUUFBUSxDQUFDO1lBQ2pFLElBQUksV0FBVyxFQUFFO2dCQUNmLE9BQU8sVUFBVSxZQUFZLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2FBQzVEO1NBQ0Y7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxrQ0FBTyxHQUFQLFVBQVEsSUFBZTtRQUF2QixpQkFrQkM7UUFqQkMsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDO1FBRS9DLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDYixRQUFRLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwQyxJQUFJLFFBQVEsRUFBRTtnQkFDWixJQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDM0MsSUFBSSxTQUFTLEVBQUU7b0JBQ2IsSUFBTSxXQUFTLEdBQUcsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO29CQUMxQyxTQUFTLENBQUMsT0FBTyxDQUFDLFVBQUEsUUFBUTt3QkFDeEIsUUFBUSxHQUFHLFdBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFJLENBQUMsSUFBSSxFQUFFLFFBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDekUsQ0FBQyxDQUFDLENBQUM7aUJBQ0o7YUFDRjtZQUNELElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztTQUNuQztRQUVELE9BQU8sUUFBUSxDQUFDO0lBQ2xCLENBQUM7SUFDSCx1QkFBQztBQUFELENBQUMsQUFwREQsSUFvREM7QUFHRDtJQUF1Qyw2Q0FBMkI7SUFBbEU7O0lBRUEsQ0FBQztJQURDLHNCQUFJLG1DQUFJO2FBQVIsY0FBYSxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBQ2xDLHdCQUFDO0FBQUQsQ0FBQyxBQUZELENBQXVDLGdCQUFnQixHQUV0RDs7QUFFRDtJQUF1Qyw2Q0FBMkI7SUFBbEU7O0lBRUEsQ0FBQztJQURDLHNCQUFJLG1DQUFJO2FBQVIsY0FBYSxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBQ2xDLHdCQUFDO0FBQUQsQ0FBQyxBQUZELENBQXVDLGdCQUFnQixHQUV0RDs7QUFFRDtJQUFrQyx3Q0FBc0I7SUFBeEQ7O0lBRUEsQ0FBQztJQURDLHNCQUFJLDhCQUFJO2FBQVIsY0FBYSxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBQzdCLG1CQUFDO0FBQUQsQ0FBQyxBQUZELENBQWtDLGdCQUFnQixHQUVqRDs7QUFFRDtJQUFzQyw0Q0FBMEI7SUFBaEU7O0lBRUEsQ0FBQztJQURDLHNCQUFJLGtDQUFJO2FBQVIsY0FBYSxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBQ2pDLHVCQUFDO0FBQUQsQ0FBQyxBQUZELENBQXNDLGdCQUFnQixHQUVyRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDb21wb25lbnQsIERpcmVjdGl2ZSwgTmdNb2R1bGUsIFBpcGUsIFR5cGUsIMm1UmVmbGVjdGlvbkNhcGFiaWxpdGllcyBhcyBSZWZsZWN0aW9uQ2FwYWJpbGl0aWVzfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtNZXRhZGF0YU92ZXJyaWRlfSBmcm9tICcuL21ldGFkYXRhX292ZXJyaWRlJztcbmltcG9ydCB7TWV0YWRhdGFPdmVycmlkZXJ9IGZyb20gJy4vbWV0YWRhdGFfb3ZlcnJpZGVyJztcblxuY29uc3QgcmVmbGVjdGlvbiA9IG5ldyBSZWZsZWN0aW9uQ2FwYWJpbGl0aWVzKCk7XG5cbi8qKlxuICogQmFzZSBpbnRlcmZhY2UgdG8gcmVzb2x2ZSBgQENvbXBvbmVudGAsIGBARGlyZWN0aXZlYCwgYEBQaXBlYCBhbmQgYEBOZ01vZHVsZWAuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUmVzb2x2ZXI8VD4geyByZXNvbHZlKHR5cGU6IFR5cGU8YW55Pik6IFR8bnVsbDsgfVxuXG4vKipcbiAqIEFsbG93cyB0byBvdmVycmlkZSBpdnkgbWV0YWRhdGEgZm9yIHRlc3RzICh2aWEgdGhlIGBUZXN0QmVkYCkuXG4gKi9cbmFic3RyYWN0IGNsYXNzIE92ZXJyaWRlUmVzb2x2ZXI8VD4gaW1wbGVtZW50cyBSZXNvbHZlcjxUPiB7XG4gIHByaXZhdGUgb3ZlcnJpZGVzID0gbmV3IE1hcDxUeXBlPGFueT4sIE1ldGFkYXRhT3ZlcnJpZGU8VD5bXT4oKTtcbiAgcHJpdmF0ZSByZXNvbHZlZCA9IG5ldyBNYXA8VHlwZTxhbnk+LCBUfG51bGw+KCk7XG5cbiAgYWJzdHJhY3QgZ2V0IHR5cGUoKTogYW55O1xuXG4gIHNldE92ZXJyaWRlcyhvdmVycmlkZXM6IEFycmF5PFtUeXBlPGFueT4sIE1ldGFkYXRhT3ZlcnJpZGU8VD5dPikge1xuICAgIHRoaXMub3ZlcnJpZGVzLmNsZWFyKCk7XG4gICAgb3ZlcnJpZGVzLmZvckVhY2goKFt0eXBlLCBvdmVycmlkZV0pID0+IHtcbiAgICAgIGNvbnN0IG92ZXJyaWRlcyA9IHRoaXMub3ZlcnJpZGVzLmdldCh0eXBlKSB8fCBbXTtcbiAgICAgIG92ZXJyaWRlcy5wdXNoKG92ZXJyaWRlKTtcbiAgICAgIHRoaXMub3ZlcnJpZGVzLnNldCh0eXBlLCBvdmVycmlkZXMpO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0QW5ub3RhdGlvbih0eXBlOiBUeXBlPGFueT4pOiBUfG51bGwge1xuICAgIGNvbnN0IGFubm90YXRpb25zID0gcmVmbGVjdGlvbi5hbm5vdGF0aW9ucyh0eXBlKTtcbiAgICAvLyBUcnkgdG8gZmluZCB0aGUgbmVhcmVzdCBrbm93biBUeXBlIGFubm90YXRpb24gYW5kIG1ha2Ugc3VyZSB0aGF0IHRoaXMgYW5ub3RhdGlvbiBpcyBhblxuICAgIC8vIGluc3RhbmNlIG9mIHRoZSB0eXBlIHdlIGFyZSBsb29raW5nIGZvciwgc28gd2UgY2FuIHVzZSBpdCBmb3IgcmVzb2x1dGlvbi4gTm90ZTogdGhlcmUgbWlnaHRcbiAgICAvLyBiZSBtdWx0aXBsZSBrbm93biBhbm5vdGF0aW9ucyBmb3VuZCBkdWUgdG8gdGhlIGZhY3QgdGhhdCBDb21wb25lbnRzIGNhbiBleHRlbmQgRGlyZWN0aXZlcyAoc29cbiAgICAvLyBib3RoIERpcmVjdGl2ZSBhbmQgQ29tcG9uZW50IGFubm90YXRpb25zIHdvdWxkIGJlIHByZXNlbnQpLCBzbyB3ZSBhbHdheXMgY2hlY2sgaWYgdGhlIGtub3duXG4gICAgLy8gYW5ub3RhdGlvbiBoYXMgdGhlIHJpZ2h0IHR5cGUuXG4gICAgZm9yIChsZXQgaSA9IGFubm90YXRpb25zLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBjb25zdCBhbm5vdGF0aW9uID0gYW5ub3RhdGlvbnNbaV07XG4gICAgICBjb25zdCBpc0tub3duVHlwZSA9IGFubm90YXRpb24gaW5zdGFuY2VvZiBEaXJlY3RpdmUgfHwgYW5ub3RhdGlvbiBpbnN0YW5jZW9mIENvbXBvbmVudCB8fFxuICAgICAgICAgIGFubm90YXRpb24gaW5zdGFuY2VvZiBQaXBlIHx8IGFubm90YXRpb24gaW5zdGFuY2VvZiBOZ01vZHVsZTtcbiAgICAgIGlmIChpc0tub3duVHlwZSkge1xuICAgICAgICByZXR1cm4gYW5ub3RhdGlvbiBpbnN0YW5jZW9mIHRoaXMudHlwZSA/IGFubm90YXRpb24gOiBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJlc29sdmUodHlwZTogVHlwZTxhbnk+KTogVHxudWxsIHtcbiAgICBsZXQgcmVzb2x2ZWQgPSB0aGlzLnJlc29sdmVkLmdldCh0eXBlKSB8fCBudWxsO1xuXG4gICAgaWYgKCFyZXNvbHZlZCkge1xuICAgICAgcmVzb2x2ZWQgPSB0aGlzLmdldEFubm90YXRpb24odHlwZSk7XG4gICAgICBpZiAocmVzb2x2ZWQpIHtcbiAgICAgICAgY29uc3Qgb3ZlcnJpZGVzID0gdGhpcy5vdmVycmlkZXMuZ2V0KHR5cGUpO1xuICAgICAgICBpZiAob3ZlcnJpZGVzKSB7XG4gICAgICAgICAgY29uc3Qgb3ZlcnJpZGVyID0gbmV3IE1ldGFkYXRhT3ZlcnJpZGVyKCk7XG4gICAgICAgICAgb3ZlcnJpZGVzLmZvckVhY2gob3ZlcnJpZGUgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZWQgPSBvdmVycmlkZXIub3ZlcnJpZGVNZXRhZGF0YSh0aGlzLnR5cGUsIHJlc29sdmVkICEsIG92ZXJyaWRlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5yZXNvbHZlZC5zZXQodHlwZSwgcmVzb2x2ZWQpO1xuICAgIH1cblxuICAgIHJldHVybiByZXNvbHZlZDtcbiAgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBEaXJlY3RpdmVSZXNvbHZlciBleHRlbmRzIE92ZXJyaWRlUmVzb2x2ZXI8RGlyZWN0aXZlPiB7XG4gIGdldCB0eXBlKCkgeyByZXR1cm4gRGlyZWN0aXZlOyB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRSZXNvbHZlciBleHRlbmRzIE92ZXJyaWRlUmVzb2x2ZXI8Q29tcG9uZW50PiB7XG4gIGdldCB0eXBlKCkgeyByZXR1cm4gQ29tcG9uZW50OyB9XG59XG5cbmV4cG9ydCBjbGFzcyBQaXBlUmVzb2x2ZXIgZXh0ZW5kcyBPdmVycmlkZVJlc29sdmVyPFBpcGU+IHtcbiAgZ2V0IHR5cGUoKSB7IHJldHVybiBQaXBlOyB9XG59XG5cbmV4cG9ydCBjbGFzcyBOZ01vZHVsZVJlc29sdmVyIGV4dGVuZHMgT3ZlcnJpZGVSZXNvbHZlcjxOZ01vZHVsZT4ge1xuICBnZXQgdHlwZSgpIHsgcmV0dXJuIE5nTW9kdWxlOyB9XG59XG4iXX0=