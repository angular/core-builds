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
import { Component, Directive, NgModule, Pipe, ɵReflectionCapabilities as ReflectionCapabilities } from '@angular/core';
import { MetadataOverrider } from './metadata_overrider';
/** @type {?} */
const reflection = new ReflectionCapabilities();
/**
 * Base interface to resolve `\@Component`, `\@Directive`, `\@Pipe` and `\@NgModule`.
 * @record
 * @template T
 */
export function Resolver() { }
/** @type {?} */
Resolver.prototype.resolve;
/**
 * Allows to override ivy metadata for tests (via the `TestBed`).
 * @abstract
 * @template T
 */
class OverrideResolver {
    constructor() {
        this.overrides = new Map();
        this.resolved = new Map();
    }
    /**
     * @param {?} overrides
     * @return {?}
     */
    setOverrides(overrides) {
        this.overrides.clear();
        overrides.forEach(([type, override]) => this.overrides.set(type, override));
    }
    /**
     * @param {?} type
     * @return {?}
     */
    getAnnotation(type) {
        return reflection.annotations(type).find(a => a instanceof this.type) || null;
    }
    /**
     * @param {?} type
     * @return {?}
     */
    resolve(type) {
        /** @type {?} */
        let resolved = this.resolved.get(type) || null;
        if (!resolved) {
            resolved = this.getAnnotation(type);
            if (resolved) {
                /** @type {?} */
                const override = this.overrides.get(type);
                if (override) {
                    /** @type {?} */
                    const overrider = new MetadataOverrider();
                    resolved = overrider.overrideMetadata(this.type, resolved, override);
                }
            }
            this.resolved.set(type, resolved);
        }
        return resolved;
    }
}
if (false) {
    /** @type {?} */
    OverrideResolver.prototype.overrides;
    /** @type {?} */
    OverrideResolver.prototype.resolved;
    /**
     * @abstract
     * @return {?}
     */
    OverrideResolver.prototype.type = function () { };
}
export class DirectiveResolver extends OverrideResolver {
    /**
     * @return {?}
     */
    get type() { return Directive; }
}
export class ComponentResolver extends OverrideResolver {
    /**
     * @return {?}
     */
    get type() { return Component; }
}
export class PipeResolver extends OverrideResolver {
    /**
     * @return {?}
     */
    get type() { return Pipe; }
}
export class NgModuleResolver extends OverrideResolver {
    /**
     * @return {?}
     */
    get type() { return NgModule; }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy9yZXNvbHZlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFRLHVCQUF1QixJQUFJLHNCQUFzQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRzVILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDOztBQUV2RCxNQUFNLFVBQVUsR0FBRyxJQUFJLHNCQUFzQixFQUFFLENBQUM7Ozs7Ozs7Ozs7Ozs7O0FBVWhEOzt5QkFDc0IsSUFBSSxHQUFHLEVBQWtDO3dCQUMxQyxJQUFJLEdBQUcsRUFBcUI7Ozs7OztJQUkvQyxZQUFZLENBQUMsU0FBa0Q7UUFDN0QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN2QixTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO0tBQzdFOzs7OztJQUVELGFBQWEsQ0FBQyxJQUFlO1FBQzNCLE9BQU8sVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFlBQVksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQztLQUMvRTs7Ozs7SUFFRCxPQUFPLENBQUMsSUFBZTs7UUFDckIsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDO1FBRS9DLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDYixRQUFRLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwQyxJQUFJLFFBQVEsRUFBRTs7Z0JBQ1osTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzFDLElBQUksUUFBUSxFQUFFOztvQkFDWixNQUFNLFNBQVMsR0FBRyxJQUFJLGlCQUFpQixFQUFFLENBQUM7b0JBQzFDLFFBQVEsR0FBRyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7aUJBQ3RFO2FBQ0Y7WUFDRCxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDbkM7UUFFRCxPQUFPLFFBQVEsQ0FBQztLQUNqQjtDQUNGOzs7Ozs7Ozs7Ozs7QUFHRCxNQUFNLHdCQUF5QixTQUFRLGdCQUEyQjs7OztJQUNoRSxJQUFJLElBQUksS0FBSyxPQUFPLFNBQVMsQ0FBQyxFQUFFO0NBQ2pDO0FBRUQsTUFBTSx3QkFBeUIsU0FBUSxnQkFBMkI7Ozs7SUFDaEUsSUFBSSxJQUFJLEtBQUssT0FBTyxTQUFTLENBQUMsRUFBRTtDQUNqQztBQUVELE1BQU0sbUJBQW9CLFNBQVEsZ0JBQXNCOzs7O0lBQ3RELElBQUksSUFBSSxLQUFLLE9BQU8sSUFBSSxDQUFDLEVBQUU7Q0FDNUI7QUFFRCxNQUFNLHVCQUF3QixTQUFRLGdCQUEwQjs7OztJQUM5RCxJQUFJLElBQUksS0FBSyxPQUFPLFFBQVEsQ0FBQyxFQUFFO0NBQ2hDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NvbXBvbmVudCwgRGlyZWN0aXZlLCBOZ01vZHVsZSwgUGlwZSwgVHlwZSwgybVSZWZsZWN0aW9uQ2FwYWJpbGl0aWVzIGFzIFJlZmxlY3Rpb25DYXBhYmlsaXRpZXN9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQge01ldGFkYXRhT3ZlcnJpZGV9IGZyb20gJy4vbWV0YWRhdGFfb3ZlcnJpZGUnO1xuaW1wb3J0IHtNZXRhZGF0YU92ZXJyaWRlcn0gZnJvbSAnLi9tZXRhZGF0YV9vdmVycmlkZXInO1xuXG5jb25zdCByZWZsZWN0aW9uID0gbmV3IFJlZmxlY3Rpb25DYXBhYmlsaXRpZXMoKTtcblxuLyoqXG4gKiBCYXNlIGludGVyZmFjZSB0byByZXNvbHZlIGBAQ29tcG9uZW50YCwgYEBEaXJlY3RpdmVgLCBgQFBpcGVgIGFuZCBgQE5nTW9kdWxlYC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZXNvbHZlcjxUPiB7IHJlc29sdmUodHlwZTogVHlwZTxhbnk+KTogVHxudWxsOyB9XG5cbi8qKlxuICogQWxsb3dzIHRvIG92ZXJyaWRlIGl2eSBtZXRhZGF0YSBmb3IgdGVzdHMgKHZpYSB0aGUgYFRlc3RCZWRgKS5cbiAqL1xuYWJzdHJhY3QgY2xhc3MgT3ZlcnJpZGVSZXNvbHZlcjxUPiBpbXBsZW1lbnRzIFJlc29sdmVyPFQ+IHtcbiAgcHJpdmF0ZSBvdmVycmlkZXMgPSBuZXcgTWFwPFR5cGU8YW55PiwgTWV0YWRhdGFPdmVycmlkZTxUPj4oKTtcbiAgcHJpdmF0ZSByZXNvbHZlZCA9IG5ldyBNYXA8VHlwZTxhbnk+LCBUfG51bGw+KCk7XG5cbiAgYWJzdHJhY3QgZ2V0IHR5cGUoKTogYW55O1xuXG4gIHNldE92ZXJyaWRlcyhvdmVycmlkZXM6IEFycmF5PFtUeXBlPGFueT4sIE1ldGFkYXRhT3ZlcnJpZGU8VD5dPikge1xuICAgIHRoaXMub3ZlcnJpZGVzLmNsZWFyKCk7XG4gICAgb3ZlcnJpZGVzLmZvckVhY2goKFt0eXBlLCBvdmVycmlkZV0pID0+IHRoaXMub3ZlcnJpZGVzLnNldCh0eXBlLCBvdmVycmlkZSkpO1xuICB9XG5cbiAgZ2V0QW5ub3RhdGlvbih0eXBlOiBUeXBlPGFueT4pOiBUfG51bGwge1xuICAgIHJldHVybiByZWZsZWN0aW9uLmFubm90YXRpb25zKHR5cGUpLmZpbmQoYSA9PiBhIGluc3RhbmNlb2YgdGhpcy50eXBlKSB8fCBudWxsO1xuICB9XG5cbiAgcmVzb2x2ZSh0eXBlOiBUeXBlPGFueT4pOiBUfG51bGwge1xuICAgIGxldCByZXNvbHZlZCA9IHRoaXMucmVzb2x2ZWQuZ2V0KHR5cGUpIHx8IG51bGw7XG5cbiAgICBpZiAoIXJlc29sdmVkKSB7XG4gICAgICByZXNvbHZlZCA9IHRoaXMuZ2V0QW5ub3RhdGlvbih0eXBlKTtcbiAgICAgIGlmIChyZXNvbHZlZCkge1xuICAgICAgICBjb25zdCBvdmVycmlkZSA9IHRoaXMub3ZlcnJpZGVzLmdldCh0eXBlKTtcbiAgICAgICAgaWYgKG92ZXJyaWRlKSB7XG4gICAgICAgICAgY29uc3Qgb3ZlcnJpZGVyID0gbmV3IE1ldGFkYXRhT3ZlcnJpZGVyKCk7XG4gICAgICAgICAgcmVzb2x2ZWQgPSBvdmVycmlkZXIub3ZlcnJpZGVNZXRhZGF0YSh0aGlzLnR5cGUsIHJlc29sdmVkLCBvdmVycmlkZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMucmVzb2x2ZWQuc2V0KHR5cGUsIHJlc29sdmVkKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzb2x2ZWQ7XG4gIH1cbn1cblxuXG5leHBvcnQgY2xhc3MgRGlyZWN0aXZlUmVzb2x2ZXIgZXh0ZW5kcyBPdmVycmlkZVJlc29sdmVyPERpcmVjdGl2ZT4ge1xuICBnZXQgdHlwZSgpIHsgcmV0dXJuIERpcmVjdGl2ZTsgfVxufVxuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50UmVzb2x2ZXIgZXh0ZW5kcyBPdmVycmlkZVJlc29sdmVyPENvbXBvbmVudD4ge1xuICBnZXQgdHlwZSgpIHsgcmV0dXJuIENvbXBvbmVudDsgfVxufVxuXG5leHBvcnQgY2xhc3MgUGlwZVJlc29sdmVyIGV4dGVuZHMgT3ZlcnJpZGVSZXNvbHZlcjxQaXBlPiB7XG4gIGdldCB0eXBlKCkgeyByZXR1cm4gUGlwZTsgfVxufVxuXG5leHBvcnQgY2xhc3MgTmdNb2R1bGVSZXNvbHZlciBleHRlbmRzIE92ZXJyaWRlUmVzb2x2ZXI8TmdNb2R1bGU+IHtcbiAgZ2V0IHR5cGUoKSB7IHJldHVybiBOZ01vZHVsZTsgfVxufVxuIl19