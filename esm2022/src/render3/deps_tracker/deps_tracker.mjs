/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * An implementation of DepsTrackerApi which will be used for JIT and local compilation.
 */
class DepsTracker {
    constructor() {
        this.ownerNgModule = new Map();
        this.ngModulesScopeCache = new Map();
        this.standaloneComponentsScopeCache = new Map();
    }
    /** @override */
    getComponentDependencies(cmp) {
        // TODO: implement this.
        return { dependencies: [] };
    }
    /** @override */
    registerNgModule(type, scopeInfo) {
        // TODO: implement this.
    }
    /** @override */
    clearScopeCacheFor(type) {
        // TODO: implement this.
    }
    /** @override */
    getNgModuleScope(type) {
        // TODO: implement this.
        return { exported: { directives: [], pipes: [] }, compilation: { directives: [], pipes: [] } };
    }
    /** @override */
    getStandaloneComponentScope(type, imports) {
        // TODO: implement this.
        return { compilation: { directives: [], pipes: [] } };
    }
}
/** The deps tracker to be used in the current Angular app in dev mode. */
export const depsTracker = new DepsTracker();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwc190cmFja2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9kZXBzX3RyYWNrZXIvZGVwc190cmFja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQVFIOztHQUVHO0FBQ0gsTUFBTSxXQUFXO0lBQWpCO1FBQ1Usa0JBQWEsR0FBRyxJQUFJLEdBQUcsRUFBeUMsQ0FBQztRQUNqRSx3QkFBbUIsR0FBRyxJQUFJLEdBQUcsRUFBb0MsQ0FBQztRQUNsRSxtQ0FBOEIsR0FBRyxJQUFJLEdBQUcsRUFBZ0QsQ0FBQztJQThCbkcsQ0FBQztJQTVCQyxnQkFBZ0I7SUFDaEIsd0JBQXdCLENBQUMsR0FBdUI7UUFDOUMsd0JBQXdCO1FBQ3hCLE9BQU8sRUFBQyxZQUFZLEVBQUUsRUFBRSxFQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVELGdCQUFnQjtJQUNoQixnQkFBZ0IsQ0FBQyxJQUFlLEVBQUUsU0FBeUM7UUFDekUsd0JBQXdCO0lBQzFCLENBQUM7SUFFRCxnQkFBZ0I7SUFDaEIsa0JBQWtCLENBQUMsSUFBcUM7UUFDdEQsd0JBQXdCO0lBQzFCLENBQUM7SUFFRCxnQkFBZ0I7SUFDaEIsZ0JBQWdCLENBQUMsSUFBdUI7UUFDdEMsd0JBQXdCO1FBQ3hCLE9BQU8sRUFBQyxRQUFRLEVBQUUsRUFBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUMsRUFBRSxXQUFXLEVBQUUsRUFBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUMsRUFBQyxDQUFDO0lBQzNGLENBQUM7SUFFRCxnQkFBZ0I7SUFDaEIsMkJBQTJCLENBQUMsSUFBd0IsRUFBRSxPQUFvQjtRQUV4RSx3QkFBd0I7UUFDeEIsT0FBTyxFQUFDLFdBQVcsRUFBRSxFQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBQyxFQUFDLENBQUM7SUFDcEQsQ0FBQztDQUNGO0FBRUQsMEVBQTBFO0FBQzFFLE1BQU0sQ0FBQyxNQUFNLFdBQVcsR0FBRyxJQUFJLFdBQVcsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtOZ01vZHVsZVR5cGV9IGZyb20gJy4uLy4uL21ldGFkYXRhL25nX21vZHVsZV9kZWYnO1xuaW1wb3J0IHtDb21wb25lbnRUeXBlLCBOZ01vZHVsZVNjb3BlSW5mb0Zyb21EZWNvcmF0b3J9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5cbmltcG9ydCB7Q29tcG9uZW50RGVwZW5kZW5jaWVzLCBEZXBzVHJhY2tlckFwaSwgTmdNb2R1bGVTY29wZSwgU3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlfSBmcm9tICcuL2FwaSc7XG5cbi8qKlxuICogQW4gaW1wbGVtZW50YXRpb24gb2YgRGVwc1RyYWNrZXJBcGkgd2hpY2ggd2lsbCBiZSB1c2VkIGZvciBKSVQgYW5kIGxvY2FsIGNvbXBpbGF0aW9uLlxuICovXG5jbGFzcyBEZXBzVHJhY2tlciBpbXBsZW1lbnRzIERlcHNUcmFja2VyQXBpIHtcbiAgcHJpdmF0ZSBvd25lck5nTW9kdWxlID0gbmV3IE1hcDxDb21wb25lbnRUeXBlPGFueT4sIE5nTW9kdWxlVHlwZTxhbnk+PigpO1xuICBwcml2YXRlIG5nTW9kdWxlc1Njb3BlQ2FjaGUgPSBuZXcgTWFwPE5nTW9kdWxlVHlwZTxhbnk+LCBOZ01vZHVsZVNjb3BlPigpO1xuICBwcml2YXRlIHN0YW5kYWxvbmVDb21wb25lbnRzU2NvcGVDYWNoZSA9IG5ldyBNYXA8Q29tcG9uZW50VHlwZTxhbnk+LCBTdGFuZGFsb25lQ29tcG9uZW50U2NvcGU+KCk7XG5cbiAgLyoqIEBvdmVycmlkZSAqL1xuICBnZXRDb21wb25lbnREZXBlbmRlbmNpZXMoY21wOiBDb21wb25lbnRUeXBlPGFueT4pOiBDb21wb25lbnREZXBlbmRlbmNpZXMge1xuICAgIC8vIFRPRE86IGltcGxlbWVudCB0aGlzLlxuICAgIHJldHVybiB7ZGVwZW5kZW5jaWVzOiBbXX07XG4gIH1cblxuICAvKiogQG92ZXJyaWRlICovXG4gIHJlZ2lzdGVyTmdNb2R1bGUodHlwZTogVHlwZTxhbnk+LCBzY29wZUluZm86IE5nTW9kdWxlU2NvcGVJbmZvRnJvbURlY29yYXRvcik6IHZvaWQge1xuICAgIC8vIFRPRE86IGltcGxlbWVudCB0aGlzLlxuICB9XG5cbiAgLyoqIEBvdmVycmlkZSAqL1xuICBjbGVhclNjb3BlQ2FjaGVGb3IodHlwZTogQ29tcG9uZW50VHlwZTxhbnk+fE5nTW9kdWxlVHlwZSk6IHZvaWQge1xuICAgIC8vIFRPRE86IGltcGxlbWVudCB0aGlzLlxuICB9XG5cbiAgLyoqIEBvdmVycmlkZSAqL1xuICBnZXROZ01vZHVsZVNjb3BlKHR5cGU6IE5nTW9kdWxlVHlwZTxhbnk+KTogTmdNb2R1bGVTY29wZSB7XG4gICAgLy8gVE9ETzogaW1wbGVtZW50IHRoaXMuXG4gICAgcmV0dXJuIHtleHBvcnRlZDoge2RpcmVjdGl2ZXM6IFtdLCBwaXBlczogW119LCBjb21waWxhdGlvbjoge2RpcmVjdGl2ZXM6IFtdLCBwaXBlczogW119fTtcbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKi9cbiAgZ2V0U3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlKHR5cGU6IENvbXBvbmVudFR5cGU8YW55PiwgaW1wb3J0czogVHlwZTxhbnk+W10pOlxuICAgICAgU3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlIHtcbiAgICAvLyBUT0RPOiBpbXBsZW1lbnQgdGhpcy5cbiAgICByZXR1cm4ge2NvbXBpbGF0aW9uOiB7ZGlyZWN0aXZlczogW10sIHBpcGVzOiBbXX19O1xuICB9XG59XG5cbi8qKiBUaGUgZGVwcyB0cmFja2VyIHRvIGJlIHVzZWQgaW4gdGhlIGN1cnJlbnQgQW5ndWxhciBhcHAgaW4gZGV2IG1vZGUuICovXG5leHBvcnQgY29uc3QgZGVwc1RyYWNrZXIgPSBuZXcgRGVwc1RyYWNrZXIoKTtcbiJdfQ==