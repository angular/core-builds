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
 *        ɵɵselect(0);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXJzX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL3Byb3ZpZGVyc19mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVFBLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUc5Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FnQ0c7QUFDSCxNQUFNLFVBQVUsa0JBQWtCLENBQUksU0FBcUIsRUFBRSxhQUE4QjtJQUE5Qiw4QkFBQSxFQUFBLGtCQUE4QjtJQUN6RixPQUFPLFVBQUMsVUFBMkI7UUFDakMsVUFBVSxDQUFDLGlCQUFpQjtZQUN4QixVQUFDLEdBQW9CLEVBQUUsa0JBQTZDO2dCQUNsRSxPQUFPLGlCQUFpQixDQUNwQixHQUFHLEVBQThELEVBQUU7Z0JBQ25FLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFHLEVBQUU7Z0JBQ25FLGFBQWEsQ0FBQyxDQUFDO1lBQ3JCLENBQUMsQ0FBQztJQUNSLENBQUMsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1Byb2Nlc3NQcm92aWRlcnNGdW5jdGlvbiwgUHJvdmlkZXJ9IGZyb20gJy4uLy4uL2RpL2ludGVyZmFjZS9wcm92aWRlcic7XG5pbXBvcnQge3Byb3ZpZGVyc1Jlc29sdmVyfSBmcm9tICcuLi9kaV9zZXR1cCc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcblxuLyoqXG4gKiBUaGlzIGZlYXR1cmUgcmVzb2x2ZXMgdGhlIHByb3ZpZGVycyBvZiBhIGRpcmVjdGl2ZSAob3IgY29tcG9uZW50KSxcbiAqIGFuZCBwdWJsaXNoIHRoZW0gaW50byB0aGUgREkgc3lzdGVtLCBtYWtpbmcgaXQgdmlzaWJsZSB0byBvdGhlcnMgZm9yIGluamVjdGlvbi5cbiAqXG4gKiBGb3IgZXhhbXBsZTpcbiAqIGBgYHRzXG4gKiBjbGFzcyBDb21wb25lbnRXaXRoUHJvdmlkZXJzIHtcbiAqICAgY29uc3RydWN0b3IocHJpdmF0ZSBncmVldGVyOiBHcmVldGVyREUpIHt9XG4gKlxuICogICBzdGF0aWMgbmdDb21wb25lbnREZWYgPSBkZWZpbmVDb21wb25lbnQoe1xuICogICAgIHR5cGU6IENvbXBvbmVudFdpdGhQcm92aWRlcnMsXG4gKiAgICAgc2VsZWN0b3JzOiBbWydjb21wb25lbnQtd2l0aC1wcm92aWRlcnMnXV0sXG4gKiAgICBmYWN0b3J5OiAoKSA9PiBuZXcgQ29tcG9uZW50V2l0aFByb3ZpZGVycyhkaXJlY3RpdmVJbmplY3QoR3JlZXRlckRFIGFzIGFueSkpLFxuICogICAgY29uc3RzOiAxLFxuICogICAgdmFyczogMSxcbiAqICAgIHRlbXBsYXRlOiBmdW5jdGlvbihmczogUmVuZGVyRmxhZ3MsIGN0eDogQ29tcG9uZW50V2l0aFByb3ZpZGVycykge1xuICogICAgICBpZiAoZnMgJiBSZW5kZXJGbGFncy5DcmVhdGUpIHtcbiAqICAgICAgICDJtcm1dGV4dCgwKTtcbiAqICAgICAgfVxuICogICAgICBpZiAoZnMgJiBSZW5kZXJGbGFncy5VcGRhdGUpIHtcbiAqICAgICAgICDJtcm1c2VsZWN0KDApO1xuICogICAgICAgIMm1ybV0ZXh0SW50ZXJwb2xhdGUoY3R4LmdyZWV0ZXIuZ3JlZXQoKSk7XG4gKiAgICAgIH1cbiAqICAgIH0sXG4gKiAgICBmZWF0dXJlczogW1Byb3ZpZGVyc0ZlYXR1cmUoW0dyZWV0ZXJERV0pXVxuICogIH0pO1xuICogfVxuICogYGBgXG4gKlxuICogQHBhcmFtIGRlZmluaXRpb25cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtVByb3ZpZGVyc0ZlYXR1cmU8VD4ocHJvdmlkZXJzOiBQcm92aWRlcltdLCB2aWV3UHJvdmlkZXJzOiBQcm92aWRlcltdID0gW10pIHtcbiAgcmV0dXJuIChkZWZpbml0aW9uOiBEaXJlY3RpdmVEZWY8VD4pID0+IHtcbiAgICBkZWZpbml0aW9uLnByb3ZpZGVyc1Jlc29sdmVyID1cbiAgICAgICAgKGRlZjogRGlyZWN0aXZlRGVmPFQ+LCBwcm9jZXNzUHJvdmlkZXJzRm4/OiBQcm9jZXNzUHJvdmlkZXJzRnVuY3Rpb24pID0+IHtcbiAgICAgICAgICByZXR1cm4gcHJvdmlkZXJzUmVzb2x2ZXIoXG4gICAgICAgICAgICAgIGRlZiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgcHJvY2Vzc1Byb3ZpZGVyc0ZuID8gcHJvY2Vzc1Byb3ZpZGVyc0ZuKHByb3ZpZGVycykgOiBwcm92aWRlcnMsICAvL1xuICAgICAgICAgICAgICB2aWV3UHJvdmlkZXJzKTtcbiAgICAgICAgfTtcbiAgfTtcbn1cbiJdfQ==