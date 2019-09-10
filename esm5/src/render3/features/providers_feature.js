import { providersResolver } from '../di_setup';
/**
 * This feature resolves the providers of a directive (or component),
 * and publish them into the DI system, making it visible to others for injection.
 *
 * For example:
 * ```ts
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
 *        ɵɵtext(0);
 *      }
 *      if (fs & RenderFlags.Update) {
 *        ɵɵtextInterpolate(ctx.greeter.greet());
 *      }
 *    },
 *    features: [ProvidersFeature([GreeterDE])]
 *  });
 * }
 * ```
 *
 * @param definition
 *
 * @codeGenApi
 */
export function ɵɵProvidersFeature(providers, viewProviders) {
    if (viewProviders === void 0) { viewProviders = []; }
    return function (definition) {
        definition.providersResolver =
            function (def, processProvidersFn) {
                return providersResolver(def, //
                processProvidersFn ? processProvidersFn(providers) : providers, //
                viewProviders);
            };
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXJzX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL3Byb3ZpZGVyc19mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVFBLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUc5Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQStCRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FBSSxTQUFxQixFQUFFLGFBQThCO0lBQTlCLDhCQUFBLEVBQUEsa0JBQThCO0lBQ3pGLE9BQU8sVUFBQyxVQUEyQjtRQUNqQyxVQUFVLENBQUMsaUJBQWlCO1lBQ3hCLFVBQUMsR0FBb0IsRUFBRSxrQkFBNkM7Z0JBQ2xFLE9BQU8saUJBQWlCLENBQ3BCLEdBQUcsRUFBOEQsRUFBRTtnQkFDbkUsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUcsRUFBRTtnQkFDbkUsYUFBYSxDQUFDLENBQUM7WUFDckIsQ0FBQyxDQUFDO0lBQ1IsQ0FBQyxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7UHJvY2Vzc1Byb3ZpZGVyc0Z1bmN0aW9uLCBQcm92aWRlcn0gZnJvbSAnLi4vLi4vZGkvaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7cHJvdmlkZXJzUmVzb2x2ZXJ9IGZyb20gJy4uL2RpX3NldHVwJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmfSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuXG4vKipcbiAqIFRoaXMgZmVhdHVyZSByZXNvbHZlcyB0aGUgcHJvdmlkZXJzIG9mIGEgZGlyZWN0aXZlIChvciBjb21wb25lbnQpLFxuICogYW5kIHB1Ymxpc2ggdGhlbSBpbnRvIHRoZSBESSBzeXN0ZW0sIG1ha2luZyBpdCB2aXNpYmxlIHRvIG90aGVycyBmb3IgaW5qZWN0aW9uLlxuICpcbiAqIEZvciBleGFtcGxlOlxuICogYGBgdHNcbiAqIGNsYXNzIENvbXBvbmVudFdpdGhQcm92aWRlcnMge1xuICogICBjb25zdHJ1Y3Rvcihwcml2YXRlIGdyZWV0ZXI6IEdyZWV0ZXJERSkge31cbiAqXG4gKiAgIHN0YXRpYyBuZ0NvbXBvbmVudERlZiA9IGRlZmluZUNvbXBvbmVudCh7XG4gKiAgICAgdHlwZTogQ29tcG9uZW50V2l0aFByb3ZpZGVycyxcbiAqICAgICBzZWxlY3RvcnM6IFtbJ2NvbXBvbmVudC13aXRoLXByb3ZpZGVycyddXSxcbiAqICAgIGZhY3Rvcnk6ICgpID0+IG5ldyBDb21wb25lbnRXaXRoUHJvdmlkZXJzKGRpcmVjdGl2ZUluamVjdChHcmVldGVyREUgYXMgYW55KSksXG4gKiAgICBjb25zdHM6IDEsXG4gKiAgICB2YXJzOiAxLFxuICogICAgdGVtcGxhdGU6IGZ1bmN0aW9uKGZzOiBSZW5kZXJGbGFncywgY3R4OiBDb21wb25lbnRXaXRoUHJvdmlkZXJzKSB7XG4gKiAgICAgIGlmIChmcyAmIFJlbmRlckZsYWdzLkNyZWF0ZSkge1xuICogICAgICAgIMm1ybV0ZXh0KDApO1xuICogICAgICB9XG4gKiAgICAgIGlmIChmcyAmIFJlbmRlckZsYWdzLlVwZGF0ZSkge1xuICogICAgICAgIMm1ybV0ZXh0SW50ZXJwb2xhdGUoY3R4LmdyZWV0ZXIuZ3JlZXQoKSk7XG4gKiAgICAgIH1cbiAqICAgIH0sXG4gKiAgICBmZWF0dXJlczogW1Byb3ZpZGVyc0ZlYXR1cmUoW0dyZWV0ZXJERV0pXVxuICogIH0pO1xuICogfVxuICogYGBgXG4gKlxuICogQHBhcmFtIGRlZmluaXRpb25cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtVByb3ZpZGVyc0ZlYXR1cmU8VD4ocHJvdmlkZXJzOiBQcm92aWRlcltdLCB2aWV3UHJvdmlkZXJzOiBQcm92aWRlcltdID0gW10pIHtcbiAgcmV0dXJuIChkZWZpbml0aW9uOiBEaXJlY3RpdmVEZWY8VD4pID0+IHtcbiAgICBkZWZpbml0aW9uLnByb3ZpZGVyc1Jlc29sdmVyID1cbiAgICAgICAgKGRlZjogRGlyZWN0aXZlRGVmPFQ+LCBwcm9jZXNzUHJvdmlkZXJzRm4/OiBQcm9jZXNzUHJvdmlkZXJzRnVuY3Rpb24pID0+IHtcbiAgICAgICAgICByZXR1cm4gcHJvdmlkZXJzUmVzb2x2ZXIoXG4gICAgICAgICAgICAgIGRlZiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgcHJvY2Vzc1Byb3ZpZGVyc0ZuID8gcHJvY2Vzc1Byb3ZpZGVyc0ZuKHByb3ZpZGVycykgOiBwcm92aWRlcnMsICAvL1xuICAgICAgICAgICAgICB2aWV3UHJvdmlkZXJzKTtcbiAgICAgICAgfTtcbiAgfTtcbn1cbiJdfQ==