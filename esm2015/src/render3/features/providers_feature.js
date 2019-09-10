/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
 * \@codeGenApi
 * @template T
 * @param {?} providers
 * @param {?=} viewProviders
 * @return {?}
 */
export function ɵɵProvidersFeature(providers, viewProviders = []) {
    return (/**
     * @param {?} definition
     * @return {?}
     */
    (definition) => {
        definition.providersResolver =
            (/**
             * @param {?} def
             * @param {?=} processProvidersFn
             * @return {?}
             */
            (def, processProvidersFn) => {
                return providersResolver(def, //
                processProvidersFn ? processProvidersFn(providers) : providers, //
                viewProviders);
            });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXJzX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL3Byb3ZpZGVyc19mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFRQSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxhQUFhLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUM5QyxNQUFNLFVBQVUsa0JBQWtCLENBQUksU0FBcUIsRUFBRSxnQkFBNEIsRUFBRTtJQUN6Rjs7OztJQUFPLENBQUMsVUFBMkIsRUFBRSxFQUFFO1FBQ3JDLFVBQVUsQ0FBQyxpQkFBaUI7Ozs7OztZQUN4QixDQUFDLEdBQW9CLEVBQUUsa0JBQTZDLEVBQUUsRUFBRTtnQkFDdEUsT0FBTyxpQkFBaUIsQ0FDcEIsR0FBRyxFQUE4RCxFQUFFO2dCQUNuRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRyxFQUFFO2dCQUNuRSxhQUFhLENBQUMsQ0FBQztZQUNyQixDQUFDLENBQUEsQ0FBQztJQUNSLENBQUMsRUFBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1Byb2Nlc3NQcm92aWRlcnNGdW5jdGlvbiwgUHJvdmlkZXJ9IGZyb20gJy4uLy4uL2RpL2ludGVyZmFjZS9wcm92aWRlcic7XG5pbXBvcnQge3Byb3ZpZGVyc1Jlc29sdmVyfSBmcm9tICcuLi9kaV9zZXR1cCc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcblxuLyoqXG4gKiBUaGlzIGZlYXR1cmUgcmVzb2x2ZXMgdGhlIHByb3ZpZGVycyBvZiBhIGRpcmVjdGl2ZSAob3IgY29tcG9uZW50KSxcbiAqIGFuZCBwdWJsaXNoIHRoZW0gaW50byB0aGUgREkgc3lzdGVtLCBtYWtpbmcgaXQgdmlzaWJsZSB0byBvdGhlcnMgZm9yIGluamVjdGlvbi5cbiAqXG4gKiBGb3IgZXhhbXBsZTpcbiAqIGBgYHRzXG4gKiBjbGFzcyBDb21wb25lbnRXaXRoUHJvdmlkZXJzIHtcbiAqICAgY29uc3RydWN0b3IocHJpdmF0ZSBncmVldGVyOiBHcmVldGVyREUpIHt9XG4gKlxuICogICBzdGF0aWMgbmdDb21wb25lbnREZWYgPSBkZWZpbmVDb21wb25lbnQoe1xuICogICAgIHR5cGU6IENvbXBvbmVudFdpdGhQcm92aWRlcnMsXG4gKiAgICAgc2VsZWN0b3JzOiBbWydjb21wb25lbnQtd2l0aC1wcm92aWRlcnMnXV0sXG4gKiAgICBmYWN0b3J5OiAoKSA9PiBuZXcgQ29tcG9uZW50V2l0aFByb3ZpZGVycyhkaXJlY3RpdmVJbmplY3QoR3JlZXRlckRFIGFzIGFueSkpLFxuICogICAgY29uc3RzOiAxLFxuICogICAgdmFyczogMSxcbiAqICAgIHRlbXBsYXRlOiBmdW5jdGlvbihmczogUmVuZGVyRmxhZ3MsIGN0eDogQ29tcG9uZW50V2l0aFByb3ZpZGVycykge1xuICogICAgICBpZiAoZnMgJiBSZW5kZXJGbGFncy5DcmVhdGUpIHtcbiAqICAgICAgICDJtcm1dGV4dCgwKTtcbiAqICAgICAgfVxuICogICAgICBpZiAoZnMgJiBSZW5kZXJGbGFncy5VcGRhdGUpIHtcbiAqICAgICAgICDJtcm1dGV4dEludGVycG9sYXRlKGN0eC5ncmVldGVyLmdyZWV0KCkpO1xuICogICAgICB9XG4gKiAgICB9LFxuICogICAgZmVhdHVyZXM6IFtQcm92aWRlcnNGZWF0dXJlKFtHcmVldGVyREVdKV1cbiAqICB9KTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBkZWZpbml0aW9uXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVQcm92aWRlcnNGZWF0dXJlPFQ+KHByb3ZpZGVyczogUHJvdmlkZXJbXSwgdmlld1Byb3ZpZGVyczogUHJvdmlkZXJbXSA9IFtdKSB7XG4gIHJldHVybiAoZGVmaW5pdGlvbjogRGlyZWN0aXZlRGVmPFQ+KSA9PiB7XG4gICAgZGVmaW5pdGlvbi5wcm92aWRlcnNSZXNvbHZlciA9XG4gICAgICAgIChkZWY6IERpcmVjdGl2ZURlZjxUPiwgcHJvY2Vzc1Byb3ZpZGVyc0ZuPzogUHJvY2Vzc1Byb3ZpZGVyc0Z1bmN0aW9uKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHByb3ZpZGVyc1Jlc29sdmVyKFxuICAgICAgICAgICAgICBkZWYsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgIHByb2Nlc3NQcm92aWRlcnNGbiA/IHByb2Nlc3NQcm92aWRlcnNGbihwcm92aWRlcnMpIDogcHJvdmlkZXJzLCAgLy9cbiAgICAgICAgICAgICAgdmlld1Byb3ZpZGVycyk7XG4gICAgICAgIH07XG4gIH07XG59XG4iXX0=