/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
 * @template T
 * @param {?} providers
 * @param {?=} viewProviders
 * @return {?}
 */
export function ProvidersFeature(providers, viewProviders = []) {
    return (definition) => {
        definition.providersResolver = (def) => providersResolver(def, providers, viewProviders);
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXJzX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL3Byb3ZpZGVyc19mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFRQSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxhQUFhLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBK0I5QyxNQUFNLFVBQVUsZ0JBQWdCLENBQUksU0FBcUIsRUFBRSxnQkFBNEIsRUFBRTtJQUN2RixPQUFPLENBQUMsVUFBMkIsRUFBRSxFQUFFO1FBQ3JDLFVBQVUsQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLEdBQW9CLEVBQUUsRUFBRSxDQUNwRCxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBQ3ZELENBQUMsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1Byb3ZpZGVyfSBmcm9tICcuLi8uLi9kaS9pbnRlcmZhY2UvcHJvdmlkZXInO1xuaW1wb3J0IHtwcm92aWRlcnNSZXNvbHZlcn0gZnJvbSAnLi4vZGlfc2V0dXAnO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWZ9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5cbi8qKlxuICogVGhpcyBmZWF0dXJlIHJlc29sdmVzIHRoZSBwcm92aWRlcnMgb2YgYSBkaXJlY3RpdmUgKG9yIGNvbXBvbmVudCksXG4gKiBhbmQgcHVibGlzaCB0aGVtIGludG8gdGhlIERJIHN5c3RlbSwgbWFraW5nIGl0IHZpc2libGUgdG8gb3RoZXJzIGZvciBpbmplY3Rpb24uXG4gKlxuICogRm9yIGV4YW1wbGU6XG4gKiBjbGFzcyBDb21wb25lbnRXaXRoUHJvdmlkZXJzIHtcbiAqICAgY29uc3RydWN0b3IocHJpdmF0ZSBncmVldGVyOiBHcmVldGVyREUpIHt9XG4gKlxuICogICBzdGF0aWMgbmdDb21wb25lbnREZWYgPSBkZWZpbmVDb21wb25lbnQoe1xuICogICAgIHR5cGU6IENvbXBvbmVudFdpdGhQcm92aWRlcnMsXG4gKiAgICAgc2VsZWN0b3JzOiBbWydjb21wb25lbnQtd2l0aC1wcm92aWRlcnMnXV0sXG4gKiAgICBmYWN0b3J5OiAoKSA9PiBuZXcgQ29tcG9uZW50V2l0aFByb3ZpZGVycyhkaXJlY3RpdmVJbmplY3QoR3JlZXRlckRFIGFzIGFueSkpLFxuICogICAgY29uc3RzOiAxLFxuICogICAgdmFyczogMSxcbiAqICAgIHRlbXBsYXRlOiBmdW5jdGlvbihmczogUmVuZGVyRmxhZ3MsIGN0eDogQ29tcG9uZW50V2l0aFByb3ZpZGVycykge1xuICogICAgICBpZiAoZnMgJiBSZW5kZXJGbGFncy5DcmVhdGUpIHtcbiAqICAgICAgICB0ZXh0KDApO1xuICogICAgICB9XG4gKiAgICAgIGlmIChmcyAmIFJlbmRlckZsYWdzLlVwZGF0ZSkge1xuICogICAgICAgIHRleHRCaW5kaW5nKDAsIGJpbmQoY3R4LmdyZWV0ZXIuZ3JlZXQoKSkpO1xuICogICAgICB9XG4gKiAgICB9LFxuICogICAgZmVhdHVyZXM6IFtQcm92aWRlcnNGZWF0dXJlKFtHcmVldGVyREVdKV1cbiAqICB9KTtcbiAqIH1cbiAqXG4gKiBAcGFyYW0gZGVmaW5pdGlvblxuICovXG5leHBvcnQgZnVuY3Rpb24gUHJvdmlkZXJzRmVhdHVyZTxUPihwcm92aWRlcnM6IFByb3ZpZGVyW10sIHZpZXdQcm92aWRlcnM6IFByb3ZpZGVyW10gPSBbXSkge1xuICByZXR1cm4gKGRlZmluaXRpb246IERpcmVjdGl2ZURlZjxUPikgPT4ge1xuICAgIGRlZmluaXRpb24ucHJvdmlkZXJzUmVzb2x2ZXIgPSAoZGVmOiBEaXJlY3RpdmVEZWY8VD4pID0+XG4gICAgICAgIHByb3ZpZGVyc1Jlc29sdmVyKGRlZiwgcHJvdmlkZXJzLCB2aWV3UHJvdmlkZXJzKTtcbiAgfTtcbn1cbiJdfQ==