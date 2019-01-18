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
        var _this = this;
        // We should always return the last match from filter(), or we may return superclass data by
        // mistake.
        return reflection.annotations(type).filter(function (a) { return a instanceof _this.type; }).pop() || null;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy9yZXNvbHZlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQVEsdUJBQXVCLElBQUksc0JBQXNCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFHNUgsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFFdkQsSUFBTSxVQUFVLEdBQUcsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO0FBT2hEOztHQUVHO0FBQ0g7SUFBQTtRQUNVLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBb0MsQ0FBQztRQUN4RCxhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQXFCLENBQUM7SUFzQ2xELENBQUM7SUFsQ0MsdUNBQVksR0FBWixVQUFhLFNBQWtEO1FBQS9ELGlCQU9DO1FBTkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN2QixTQUFTLENBQUMsT0FBTyxDQUFDLFVBQUMsRUFBZ0I7Z0JBQWhCLDBCQUFnQixFQUFmLFlBQUksRUFBRSxnQkFBUTtZQUNoQyxJQUFNLFNBQVMsR0FBRyxLQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDakQsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN6QixLQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDdEMsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsd0NBQWEsR0FBYixVQUFjLElBQWU7UUFBN0IsaUJBSUM7UUFIQyw0RkFBNEY7UUFDNUYsV0FBVztRQUNYLE9BQU8sVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLFlBQVksS0FBSSxDQUFDLElBQUksRUFBdEIsQ0FBc0IsQ0FBQyxDQUFDLEdBQUcsRUFBRSxJQUFJLElBQUksQ0FBQztJQUN4RixDQUFDO0lBRUQsa0NBQU8sR0FBUCxVQUFRLElBQWU7UUFBdkIsaUJBa0JDO1FBakJDLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQztRQUUvQyxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2IsUUFBUSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEMsSUFBSSxRQUFRLEVBQUU7Z0JBQ1osSUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzNDLElBQUksU0FBUyxFQUFFO29CQUNiLElBQU0sV0FBUyxHQUFHLElBQUksaUJBQWlCLEVBQUUsQ0FBQztvQkFDMUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFBLFFBQVE7d0JBQ3hCLFFBQVEsR0FBRyxXQUFTLENBQUMsZ0JBQWdCLENBQUMsS0FBSSxDQUFDLElBQUksRUFBRSxRQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQ3pFLENBQUMsQ0FBQyxDQUFDO2lCQUNKO2FBQ0Y7WUFDRCxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDbkM7UUFFRCxPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBQ0gsdUJBQUM7QUFBRCxDQUFDLEFBeENELElBd0NDO0FBR0Q7SUFBdUMsNkNBQTJCO0lBQWxFOztJQUVBLENBQUM7SUFEQyxzQkFBSSxtQ0FBSTthQUFSLGNBQWEsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUNsQyx3QkFBQztBQUFELENBQUMsQUFGRCxDQUF1QyxnQkFBZ0IsR0FFdEQ7O0FBRUQ7SUFBdUMsNkNBQTJCO0lBQWxFOztJQUVBLENBQUM7SUFEQyxzQkFBSSxtQ0FBSTthQUFSLGNBQWEsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUNsQyx3QkFBQztBQUFELENBQUMsQUFGRCxDQUF1QyxnQkFBZ0IsR0FFdEQ7O0FBRUQ7SUFBa0Msd0NBQXNCO0lBQXhEOztJQUVBLENBQUM7SUFEQyxzQkFBSSw4QkFBSTthQUFSLGNBQWEsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUM3QixtQkFBQztBQUFELENBQUMsQUFGRCxDQUFrQyxnQkFBZ0IsR0FFakQ7O0FBRUQ7SUFBc0MsNENBQTBCO0lBQWhFOztJQUVBLENBQUM7SUFEQyxzQkFBSSxrQ0FBSTthQUFSLGNBQWEsT0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUNqQyx1QkFBQztBQUFELENBQUMsQUFGRCxDQUFzQyxnQkFBZ0IsR0FFckQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q29tcG9uZW50LCBEaXJlY3RpdmUsIE5nTW9kdWxlLCBQaXBlLCBUeXBlLCDJtVJlZmxlY3Rpb25DYXBhYmlsaXRpZXMgYXMgUmVmbGVjdGlvbkNhcGFiaWxpdGllc30gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7TWV0YWRhdGFPdmVycmlkZX0gZnJvbSAnLi9tZXRhZGF0YV9vdmVycmlkZSc7XG5pbXBvcnQge01ldGFkYXRhT3ZlcnJpZGVyfSBmcm9tICcuL21ldGFkYXRhX292ZXJyaWRlcic7XG5cbmNvbnN0IHJlZmxlY3Rpb24gPSBuZXcgUmVmbGVjdGlvbkNhcGFiaWxpdGllcygpO1xuXG4vKipcbiAqIEJhc2UgaW50ZXJmYWNlIHRvIHJlc29sdmUgYEBDb21wb25lbnRgLCBgQERpcmVjdGl2ZWAsIGBAUGlwZWAgYW5kIGBATmdNb2R1bGVgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlc29sdmVyPFQ+IHsgcmVzb2x2ZSh0eXBlOiBUeXBlPGFueT4pOiBUfG51bGw7IH1cblxuLyoqXG4gKiBBbGxvd3MgdG8gb3ZlcnJpZGUgaXZ5IG1ldGFkYXRhIGZvciB0ZXN0cyAodmlhIHRoZSBgVGVzdEJlZGApLlxuICovXG5hYnN0cmFjdCBjbGFzcyBPdmVycmlkZVJlc29sdmVyPFQ+IGltcGxlbWVudHMgUmVzb2x2ZXI8VD4ge1xuICBwcml2YXRlIG92ZXJyaWRlcyA9IG5ldyBNYXA8VHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPFQ+W10+KCk7XG4gIHByaXZhdGUgcmVzb2x2ZWQgPSBuZXcgTWFwPFR5cGU8YW55PiwgVHxudWxsPigpO1xuXG4gIGFic3RyYWN0IGdldCB0eXBlKCk6IGFueTtcblxuICBzZXRPdmVycmlkZXMob3ZlcnJpZGVzOiBBcnJheTxbVHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPFQ+XT4pIHtcbiAgICB0aGlzLm92ZXJyaWRlcy5jbGVhcigpO1xuICAgIG92ZXJyaWRlcy5mb3JFYWNoKChbdHlwZSwgb3ZlcnJpZGVdKSA9PiB7XG4gICAgICBjb25zdCBvdmVycmlkZXMgPSB0aGlzLm92ZXJyaWRlcy5nZXQodHlwZSkgfHwgW107XG4gICAgICBvdmVycmlkZXMucHVzaChvdmVycmlkZSk7XG4gICAgICB0aGlzLm92ZXJyaWRlcy5zZXQodHlwZSwgb3ZlcnJpZGVzKTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldEFubm90YXRpb24odHlwZTogVHlwZTxhbnk+KTogVHxudWxsIHtcbiAgICAvLyBXZSBzaG91bGQgYWx3YXlzIHJldHVybiB0aGUgbGFzdCBtYXRjaCBmcm9tIGZpbHRlcigpLCBvciB3ZSBtYXkgcmV0dXJuIHN1cGVyY2xhc3MgZGF0YSBieVxuICAgIC8vIG1pc3Rha2UuXG4gICAgcmV0dXJuIHJlZmxlY3Rpb24uYW5ub3RhdGlvbnModHlwZSkuZmlsdGVyKGEgPT4gYSBpbnN0YW5jZW9mIHRoaXMudHlwZSkucG9wKCkgfHwgbnVsbDtcbiAgfVxuXG4gIHJlc29sdmUodHlwZTogVHlwZTxhbnk+KTogVHxudWxsIHtcbiAgICBsZXQgcmVzb2x2ZWQgPSB0aGlzLnJlc29sdmVkLmdldCh0eXBlKSB8fCBudWxsO1xuXG4gICAgaWYgKCFyZXNvbHZlZCkge1xuICAgICAgcmVzb2x2ZWQgPSB0aGlzLmdldEFubm90YXRpb24odHlwZSk7XG4gICAgICBpZiAocmVzb2x2ZWQpIHtcbiAgICAgICAgY29uc3Qgb3ZlcnJpZGVzID0gdGhpcy5vdmVycmlkZXMuZ2V0KHR5cGUpO1xuICAgICAgICBpZiAob3ZlcnJpZGVzKSB7XG4gICAgICAgICAgY29uc3Qgb3ZlcnJpZGVyID0gbmV3IE1ldGFkYXRhT3ZlcnJpZGVyKCk7XG4gICAgICAgICAgb3ZlcnJpZGVzLmZvckVhY2gob3ZlcnJpZGUgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZWQgPSBvdmVycmlkZXIub3ZlcnJpZGVNZXRhZGF0YSh0aGlzLnR5cGUsIHJlc29sdmVkICEsIG92ZXJyaWRlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5yZXNvbHZlZC5zZXQodHlwZSwgcmVzb2x2ZWQpO1xuICAgIH1cblxuICAgIHJldHVybiByZXNvbHZlZDtcbiAgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBEaXJlY3RpdmVSZXNvbHZlciBleHRlbmRzIE92ZXJyaWRlUmVzb2x2ZXI8RGlyZWN0aXZlPiB7XG4gIGdldCB0eXBlKCkgeyByZXR1cm4gRGlyZWN0aXZlOyB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRSZXNvbHZlciBleHRlbmRzIE92ZXJyaWRlUmVzb2x2ZXI8Q29tcG9uZW50PiB7XG4gIGdldCB0eXBlKCkgeyByZXR1cm4gQ29tcG9uZW50OyB9XG59XG5cbmV4cG9ydCBjbGFzcyBQaXBlUmVzb2x2ZXIgZXh0ZW5kcyBPdmVycmlkZVJlc29sdmVyPFBpcGU+IHtcbiAgZ2V0IHR5cGUoKSB7IHJldHVybiBQaXBlOyB9XG59XG5cbmV4cG9ydCBjbGFzcyBOZ01vZHVsZVJlc29sdmVyIGV4dGVuZHMgT3ZlcnJpZGVSZXNvbHZlcjxOZ01vZHVsZT4ge1xuICBnZXQgdHlwZSgpIHsgcmV0dXJuIE5nTW9kdWxlOyB9XG59XG4iXX0=