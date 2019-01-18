import { providersResolver } from '../di_setup';
/**
 * This feature resolves the providers of a directive (or component),
 * and publish them into the DI system, making it visible to others for injection.
 *
 * For example:
 * class ComponentWithProviders {
 *   constructor(private greeter: GreeterDE) {}
 *
 *   static ngComponentDef = defineComponent({
 *     type: ComponentWithProviders,
 *     selectors: [['component-with-providers']],
 *    factory: () => new ComponentWithProviders(directiveInject(GreeterDE as any)),
 *    consts: 1,
 *    vars: 1,
 *    template: function(fs: RenderFlags, ctx: ComponentWithProviders) {
 *      if (fs & RenderFlags.Create) {
 *        text(0);
 *      }
 *      if (fs & RenderFlags.Update) {
 *        textBinding(0, bind(ctx.greeter.greet()));
 *      }
 *    },
 *    features: [ProvidersFeature([GreeterDE])]
 *  });
 * }
 *
 * @param definition
 */
export function ProvidersFeature(providers, viewProviders) {
    if (viewProviders === void 0) { viewProviders = []; }
    return function (definition) {
        definition.providersResolver = function (def) {
            return providersResolver(def, providers, viewProviders);
        };
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXJzX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL3Byb3ZpZGVyc19mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVFBLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUc5Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBMkJHO0FBQ0gsTUFBTSxVQUFVLGdCQUFnQixDQUFJLFNBQXFCLEVBQUUsYUFBOEI7SUFBOUIsOEJBQUEsRUFBQSxrQkFBOEI7SUFDdkYsT0FBTyxVQUFDLFVBQTJCO1FBQ2pDLFVBQVUsQ0FBQyxpQkFBaUIsR0FBRyxVQUFDLEdBQW9CO1lBQ2hELE9BQUEsaUJBQWlCLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRSxhQUFhLENBQUM7UUFBaEQsQ0FBZ0QsQ0FBQztJQUN2RCxDQUFDLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtQcm92aWRlcn0gZnJvbSAnLi4vLi4vZGkvaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7cHJvdmlkZXJzUmVzb2x2ZXJ9IGZyb20gJy4uL2RpX3NldHVwJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmfSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuXG4vKipcbiAqIFRoaXMgZmVhdHVyZSByZXNvbHZlcyB0aGUgcHJvdmlkZXJzIG9mIGEgZGlyZWN0aXZlIChvciBjb21wb25lbnQpLFxuICogYW5kIHB1Ymxpc2ggdGhlbSBpbnRvIHRoZSBESSBzeXN0ZW0sIG1ha2luZyBpdCB2aXNpYmxlIHRvIG90aGVycyBmb3IgaW5qZWN0aW9uLlxuICpcbiAqIEZvciBleGFtcGxlOlxuICogY2xhc3MgQ29tcG9uZW50V2l0aFByb3ZpZGVycyB7XG4gKiAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZ3JlZXRlcjogR3JlZXRlckRFKSB7fVxuICpcbiAqICAgc3RhdGljIG5nQ29tcG9uZW50RGVmID0gZGVmaW5lQ29tcG9uZW50KHtcbiAqICAgICB0eXBlOiBDb21wb25lbnRXaXRoUHJvdmlkZXJzLFxuICogICAgIHNlbGVjdG9yczogW1snY29tcG9uZW50LXdpdGgtcHJvdmlkZXJzJ11dLFxuICogICAgZmFjdG9yeTogKCkgPT4gbmV3IENvbXBvbmVudFdpdGhQcm92aWRlcnMoZGlyZWN0aXZlSW5qZWN0KEdyZWV0ZXJERSBhcyBhbnkpKSxcbiAqICAgIGNvbnN0czogMSxcbiAqICAgIHZhcnM6IDEsXG4gKiAgICB0ZW1wbGF0ZTogZnVuY3Rpb24oZnM6IFJlbmRlckZsYWdzLCBjdHg6IENvbXBvbmVudFdpdGhQcm92aWRlcnMpIHtcbiAqICAgICAgaWYgKGZzICYgUmVuZGVyRmxhZ3MuQ3JlYXRlKSB7XG4gKiAgICAgICAgdGV4dCgwKTtcbiAqICAgICAgfVxuICogICAgICBpZiAoZnMgJiBSZW5kZXJGbGFncy5VcGRhdGUpIHtcbiAqICAgICAgICB0ZXh0QmluZGluZygwLCBiaW5kKGN0eC5ncmVldGVyLmdyZWV0KCkpKTtcbiAqICAgICAgfVxuICogICAgfSxcbiAqICAgIGZlYXR1cmVzOiBbUHJvdmlkZXJzRmVhdHVyZShbR3JlZXRlckRFXSldXG4gKiAgfSk7XG4gKiB9XG4gKlxuICogQHBhcmFtIGRlZmluaXRpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIFByb3ZpZGVyc0ZlYXR1cmU8VD4ocHJvdmlkZXJzOiBQcm92aWRlcltdLCB2aWV3UHJvdmlkZXJzOiBQcm92aWRlcltdID0gW10pIHtcbiAgcmV0dXJuIChkZWZpbml0aW9uOiBEaXJlY3RpdmVEZWY8VD4pID0+IHtcbiAgICBkZWZpbml0aW9uLnByb3ZpZGVyc1Jlc29sdmVyID0gKGRlZjogRGlyZWN0aXZlRGVmPFQ+KSA9PlxuICAgICAgICBwcm92aWRlcnNSZXNvbHZlcihkZWYsIHByb3ZpZGVycywgdmlld1Byb3ZpZGVycyk7XG4gIH07XG59XG4iXX0=