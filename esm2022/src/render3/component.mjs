/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getNullInjector } from '../di/r3_injector';
import { ComponentFactory } from './component_ref';
import { getComponentDef } from './definition';
import { assertComponentDef } from './errors';
/**
 * Creates a `ComponentRef` instance based on provided component type and a set of options.
 *
 * @usageNotes
 *
 * The example below demonstrates how the `createComponent` function can be used
 * to create an instance of a ComponentRef dynamically and attach it to an ApplicationRef,
 * so that it gets included into change detection cycles.
 *
 * Note: the example uses standalone components, but the function can also be used for
 * non-standalone components (declared in an NgModule) as well.
 *
 * ```typescript
 * @Component({
 *   standalone: true,
 *   template: `Hello {{ name }}!`
 * })
 * class HelloComponent {
 *   name = 'Angular';
 * }
 *
 * @Component({
 *   standalone: true,
 *   template: `<div id="hello-component-host"></div>`
 * })
 * class RootComponent {}
 *
 * // Bootstrap an application.
 * const applicationRef = await bootstrapApplication(RootComponent);
 *
 * // Locate a DOM node that would be used as a host.
 * const host = document.getElementById('hello-component-host');
 *
 * // Get an `EnvironmentInjector` instance from the `ApplicationRef`.
 * const environmentInjector = applicationRef.injector;
 *
 * // We can now create a `ComponentRef` instance.
 * const componentRef = createComponent(HelloComponent, {host, environmentInjector});
 *
 * // Last step is to register the newly created ref using the `ApplicationRef` instance
 * // to include the component view into change detection cycles.
 * applicationRef.attachView(componentRef.hostView);
 * ```
 *
 * @param component Component class reference.
 * @param options Set of options to use:
 *  * `environmentInjector`: An `EnvironmentInjector` instance to be used for the component, see
 * additional info about it at https://angular.io/guide/standalone-components#environment-injectors.
 *  * `hostElement` (optional): A DOM node that should act as a host node for the component. If not
 * provided, Angular creates one based on the tag name used in the component selector (and falls
 * back to using `div` if selector doesn't have tag name info).
 *  * `elementInjector` (optional): An `ElementInjector` instance, see additional info about it at
 * https://angular.io/guide/hierarchical-dependency-injection#elementinjector.
 *  * `projectableNodes` (optional): A list of DOM nodes that should be projected through
 *                      [`<ng-content>`](api/core/ng-content) of the new component instance.
 * @returns ComponentRef instance that represents a given Component.
 *
 * @publicApi
 */
export function createComponent(component, options) {
    ngDevMode && assertComponentDef(component);
    const componentDef = getComponentDef(component);
    const elementInjector = options.elementInjector || getNullInjector();
    const factory = new ComponentFactory(componentDef);
    return factory.create(elementInjector, options.projectableNodes, options.hostElement, options.environmentInjector);
}
/**
 * Creates an object that allows to retrieve component metadata.
 *
 * @usageNotes
 *
 * The example below demonstrates how to use the function and how the fields
 * of the returned object map to the component metadata.
 *
 * ```typescript
 * @Component({
 *   standalone: true,
 *   selector: 'foo-component',
 *   template: `
 *     <ng-content></ng-content>
 *     <ng-content select="content-selector-a"></ng-content>
 *   `,
 * })
 * class FooComponent {
 *   @Input('inputName') inputPropName: string;
 *   @Output('outputName') outputPropName = new EventEmitter<void>();
 * }
 *
 * const mirror = reflectComponentType(FooComponent);
 * expect(mirror.type).toBe(FooComponent);
 * expect(mirror.selector).toBe('foo-component');
 * expect(mirror.isStandalone).toBe(true);
 * expect(mirror.inputs).toEqual([{propName: 'inputName', templateName: 'inputPropName'}]);
 * expect(mirror.outputs).toEqual([{propName: 'outputName', templateName: 'outputPropName'}]);
 * expect(mirror.ngContentSelectors).toEqual([
 *   '*',                 // first `<ng-content>` in a template, the selector defaults to `*`
 *   'content-selector-a' // second `<ng-content>` in a template
 * ]);
 * ```
 *
 * @param component Component class reference.
 * @returns An object that allows to retrieve component metadata.
 *
 * @publicApi
 */
export function reflectComponentType(component) {
    const componentDef = getComponentDef(component);
    if (!componentDef)
        return null;
    const factory = new ComponentFactory(componentDef);
    return {
        get selector() {
            return factory.selector;
        },
        get type() {
            return factory.componentType;
        },
        get inputs() {
            return factory.inputs;
        },
        get outputs() {
            return factory.outputs;
        },
        get ngContentSelectors() {
            return factory.ngContentSelectors;
        },
        get isStandalone() {
            return componentDef.standalone;
        },
        get isSignal() {
            return componentDef.signals;
        },
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBR0gsT0FBTyxFQUFzQixlQUFlLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUl2RSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzdDLE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUU1Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQTBERztBQUNILE1BQU0sVUFBVSxlQUFlLENBQUksU0FBa0IsRUFBRSxPQUt0RDtJQUNDLFNBQVMsSUFBSSxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUMzQyxNQUFNLFlBQVksR0FBRyxlQUFlLENBQUMsU0FBUyxDQUFFLENBQUM7SUFDakQsTUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLGVBQWUsSUFBSSxlQUFlLEVBQUUsQ0FBQztJQUNyRSxNQUFNLE9BQU8sR0FBRyxJQUFJLGdCQUFnQixDQUFJLFlBQVksQ0FBQyxDQUFDO0lBQ3RELE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FDakIsZUFBZSxFQUFFLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQ25HLENBQUM7QUF5Q0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBc0NHO0FBQ0gsTUFBTSxVQUFVLG9CQUFvQixDQUFJLFNBQWtCO0lBQ3hELE1BQU0sWUFBWSxHQUFHLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNoRCxJQUFJLENBQUMsWUFBWTtRQUFFLE9BQU8sSUFBSSxDQUFDO0lBRS9CLE1BQU0sT0FBTyxHQUFHLElBQUksZ0JBQWdCLENBQUksWUFBWSxDQUFDLENBQUM7SUFDdEQsT0FBTztRQUNMLElBQUksUUFBUTtZQUNWLE9BQU8sT0FBTyxDQUFDLFFBQVEsQ0FBQztRQUMxQixDQUFDO1FBQ0QsSUFBSSxJQUFJO1lBQ04sT0FBTyxPQUFPLENBQUMsYUFBYSxDQUFDO1FBQy9CLENBQUM7UUFDRCxJQUFJLE1BQU07WUFDUixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFDeEIsQ0FBQztRQUNELElBQUksT0FBTztZQUNULE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUN6QixDQUFDO1FBQ0QsSUFBSSxrQkFBa0I7WUFDcEIsT0FBTyxPQUFPLENBQUMsa0JBQWtCLENBQUM7UUFDcEMsQ0FBQztRQUNELElBQUksWUFBWTtZQUNkLE9BQU8sWUFBWSxDQUFDLFVBQVUsQ0FBQztRQUNqQyxDQUFDO1FBQ0QsSUFBSSxRQUFRO1lBQ1YsT0FBTyxZQUFZLENBQUMsT0FBTyxDQUFDO1FBQzlCLENBQUM7S0FDRixDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0Vudmlyb25tZW50SW5qZWN0b3IsIGdldE51bGxJbmplY3Rvcn0gZnJvbSAnLi4vZGkvcjNfaW5qZWN0b3InO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0NvbXBvbmVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5JztcblxuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5fSBmcm9tICcuL2NvbXBvbmVudF9yZWYnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWZ9IGZyb20gJy4vZGVmaW5pdGlvbic7XG5pbXBvcnQge2Fzc2VydENvbXBvbmVudERlZn0gZnJvbSAnLi9lcnJvcnMnO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBgQ29tcG9uZW50UmVmYCBpbnN0YW5jZSBiYXNlZCBvbiBwcm92aWRlZCBjb21wb25lbnQgdHlwZSBhbmQgYSBzZXQgb2Ygb3B0aW9ucy5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIFRoZSBleGFtcGxlIGJlbG93IGRlbW9uc3RyYXRlcyBob3cgdGhlIGBjcmVhdGVDb21wb25lbnRgIGZ1bmN0aW9uIGNhbiBiZSB1c2VkXG4gKiB0byBjcmVhdGUgYW4gaW5zdGFuY2Ugb2YgYSBDb21wb25lbnRSZWYgZHluYW1pY2FsbHkgYW5kIGF0dGFjaCBpdCB0byBhbiBBcHBsaWNhdGlvblJlZixcbiAqIHNvIHRoYXQgaXQgZ2V0cyBpbmNsdWRlZCBpbnRvIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGVzLlxuICpcbiAqIE5vdGU6IHRoZSBleGFtcGxlIHVzZXMgc3RhbmRhbG9uZSBjb21wb25lbnRzLCBidXQgdGhlIGZ1bmN0aW9uIGNhbiBhbHNvIGJlIHVzZWQgZm9yXG4gKiBub24tc3RhbmRhbG9uZSBjb21wb25lbnRzIChkZWNsYXJlZCBpbiBhbiBOZ01vZHVsZSkgYXMgd2VsbC5cbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAqICAgdGVtcGxhdGU6IGBIZWxsbyB7eyBuYW1lIH19IWBcbiAqIH0pXG4gKiBjbGFzcyBIZWxsb0NvbXBvbmVudCB7XG4gKiAgIG5hbWUgPSAnQW5ndWxhcic7XG4gKiB9XG4gKlxuICogQENvbXBvbmVudCh7XG4gKiAgIHN0YW5kYWxvbmU6IHRydWUsXG4gKiAgIHRlbXBsYXRlOiBgPGRpdiBpZD1cImhlbGxvLWNvbXBvbmVudC1ob3N0XCI+PC9kaXY+YFxuICogfSlcbiAqIGNsYXNzIFJvb3RDb21wb25lbnQge31cbiAqXG4gKiAvLyBCb290c3RyYXAgYW4gYXBwbGljYXRpb24uXG4gKiBjb25zdCBhcHBsaWNhdGlvblJlZiA9IGF3YWl0IGJvb3RzdHJhcEFwcGxpY2F0aW9uKFJvb3RDb21wb25lbnQpO1xuICpcbiAqIC8vIExvY2F0ZSBhIERPTSBub2RlIHRoYXQgd291bGQgYmUgdXNlZCBhcyBhIGhvc3QuXG4gKiBjb25zdCBob3N0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2hlbGxvLWNvbXBvbmVudC1ob3N0Jyk7XG4gKlxuICogLy8gR2V0IGFuIGBFbnZpcm9ubWVudEluamVjdG9yYCBpbnN0YW5jZSBmcm9tIHRoZSBgQXBwbGljYXRpb25SZWZgLlxuICogY29uc3QgZW52aXJvbm1lbnRJbmplY3RvciA9IGFwcGxpY2F0aW9uUmVmLmluamVjdG9yO1xuICpcbiAqIC8vIFdlIGNhbiBub3cgY3JlYXRlIGEgYENvbXBvbmVudFJlZmAgaW5zdGFuY2UuXG4gKiBjb25zdCBjb21wb25lbnRSZWYgPSBjcmVhdGVDb21wb25lbnQoSGVsbG9Db21wb25lbnQsIHtob3N0LCBlbnZpcm9ubWVudEluamVjdG9yfSk7XG4gKlxuICogLy8gTGFzdCBzdGVwIGlzIHRvIHJlZ2lzdGVyIHRoZSBuZXdseSBjcmVhdGVkIHJlZiB1c2luZyB0aGUgYEFwcGxpY2F0aW9uUmVmYCBpbnN0YW5jZVxuICogLy8gdG8gaW5jbHVkZSB0aGUgY29tcG9uZW50IHZpZXcgaW50byBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlcy5cbiAqIGFwcGxpY2F0aW9uUmVmLmF0dGFjaFZpZXcoY29tcG9uZW50UmVmLmhvc3RWaWV3KTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgQ29tcG9uZW50IGNsYXNzIHJlZmVyZW5jZS5cbiAqIEBwYXJhbSBvcHRpb25zIFNldCBvZiBvcHRpb25zIHRvIHVzZTpcbiAqICAqIGBlbnZpcm9ubWVudEluamVjdG9yYDogQW4gYEVudmlyb25tZW50SW5qZWN0b3JgIGluc3RhbmNlIHRvIGJlIHVzZWQgZm9yIHRoZSBjb21wb25lbnQsIHNlZVxuICogYWRkaXRpb25hbCBpbmZvIGFib3V0IGl0IGF0IGh0dHBzOi8vYW5ndWxhci5pby9ndWlkZS9zdGFuZGFsb25lLWNvbXBvbmVudHMjZW52aXJvbm1lbnQtaW5qZWN0b3JzLlxuICogICogYGhvc3RFbGVtZW50YCAob3B0aW9uYWwpOiBBIERPTSBub2RlIHRoYXQgc2hvdWxkIGFjdCBhcyBhIGhvc3Qgbm9kZSBmb3IgdGhlIGNvbXBvbmVudC4gSWYgbm90XG4gKiBwcm92aWRlZCwgQW5ndWxhciBjcmVhdGVzIG9uZSBiYXNlZCBvbiB0aGUgdGFnIG5hbWUgdXNlZCBpbiB0aGUgY29tcG9uZW50IHNlbGVjdG9yIChhbmQgZmFsbHNcbiAqIGJhY2sgdG8gdXNpbmcgYGRpdmAgaWYgc2VsZWN0b3IgZG9lc24ndCBoYXZlIHRhZyBuYW1lIGluZm8pLlxuICogICogYGVsZW1lbnRJbmplY3RvcmAgKG9wdGlvbmFsKTogQW4gYEVsZW1lbnRJbmplY3RvcmAgaW5zdGFuY2UsIHNlZSBhZGRpdGlvbmFsIGluZm8gYWJvdXQgaXQgYXRcbiAqIGh0dHBzOi8vYW5ndWxhci5pby9ndWlkZS9oaWVyYXJjaGljYWwtZGVwZW5kZW5jeS1pbmplY3Rpb24jZWxlbWVudGluamVjdG9yLlxuICogICogYHByb2plY3RhYmxlTm9kZXNgIChvcHRpb25hbCk6IEEgbGlzdCBvZiBET00gbm9kZXMgdGhhdCBzaG91bGQgYmUgcHJvamVjdGVkIHRocm91Z2hcbiAqICAgICAgICAgICAgICAgICAgICAgIFtgPG5nLWNvbnRlbnQ+YF0oYXBpL2NvcmUvbmctY29udGVudCkgb2YgdGhlIG5ldyBjb21wb25lbnQgaW5zdGFuY2UuXG4gKiBAcmV0dXJucyBDb21wb25lbnRSZWYgaW5zdGFuY2UgdGhhdCByZXByZXNlbnRzIGEgZ2l2ZW4gQ29tcG9uZW50LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvbXBvbmVudDxDPihjb21wb25lbnQ6IFR5cGU8Qz4sIG9wdGlvbnM6IHtcbiAgZW52aXJvbm1lbnRJbmplY3RvcjogRW52aXJvbm1lbnRJbmplY3RvcixcbiAgaG9zdEVsZW1lbnQ/OiBFbGVtZW50LFxuICBlbGVtZW50SW5qZWN0b3I/OiBJbmplY3RvcixcbiAgcHJvamVjdGFibGVOb2Rlcz86IE5vZGVbXVtdLFxufSk6IENvbXBvbmVudFJlZjxDPiB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRDb21wb25lbnREZWYoY29tcG9uZW50KTtcbiAgY29uc3QgY29tcG9uZW50RGVmID0gZ2V0Q29tcG9uZW50RGVmKGNvbXBvbmVudCkhO1xuICBjb25zdCBlbGVtZW50SW5qZWN0b3IgPSBvcHRpb25zLmVsZW1lbnRJbmplY3RvciB8fCBnZXROdWxsSW5qZWN0b3IoKTtcbiAgY29uc3QgZmFjdG9yeSA9IG5ldyBDb21wb25lbnRGYWN0b3J5PEM+KGNvbXBvbmVudERlZik7XG4gIHJldHVybiBmYWN0b3J5LmNyZWF0ZShcbiAgICAgIGVsZW1lbnRJbmplY3Rvciwgb3B0aW9ucy5wcm9qZWN0YWJsZU5vZGVzLCBvcHRpb25zLmhvc3RFbGVtZW50LCBvcHRpb25zLmVudmlyb25tZW50SW5qZWN0b3IpO1xufVxuXG4vKipcbiAqIEFuIGludGVyZmFjZSB0aGF0IGRlc2NyaWJlcyB0aGUgc3Vic2V0IG9mIGNvbXBvbmVudCBtZXRhZGF0YVxuICogdGhhdCBjYW4gYmUgcmV0cmlldmVkIHVzaW5nIHRoZSBgcmVmbGVjdENvbXBvbmVudFR5cGVgIGZ1bmN0aW9uLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnRNaXJyb3I8Qz4ge1xuICAvKipcbiAgICogVGhlIGNvbXBvbmVudCdzIEhUTUwgc2VsZWN0b3IuXG4gICAqL1xuICBnZXQgc2VsZWN0b3IoKTogc3RyaW5nO1xuICAvKipcbiAgICogVGhlIHR5cGUgb2YgY29tcG9uZW50IHRoZSBmYWN0b3J5IHdpbGwgY3JlYXRlLlxuICAgKi9cbiAgZ2V0IHR5cGUoKTogVHlwZTxDPjtcbiAgLyoqXG4gICAqIFRoZSBpbnB1dHMgb2YgdGhlIGNvbXBvbmVudC5cbiAgICovXG4gIGdldCBpbnB1dHMoKTogUmVhZG9ubHlBcnJheTx7cmVhZG9ubHkgcHJvcE5hbWU6IHN0cmluZywgcmVhZG9ubHkgdGVtcGxhdGVOYW1lOiBzdHJpbmd9PjtcbiAgLyoqXG4gICAqIFRoZSBvdXRwdXRzIG9mIHRoZSBjb21wb25lbnQuXG4gICAqL1xuICBnZXQgb3V0cHV0cygpOiBSZWFkb25seUFycmF5PHtyZWFkb25seSBwcm9wTmFtZTogc3RyaW5nLCByZWFkb25seSB0ZW1wbGF0ZU5hbWU6IHN0cmluZ30+O1xuICAvKipcbiAgICogU2VsZWN0b3IgZm9yIGFsbCA8bmctY29udGVudD4gZWxlbWVudHMgaW4gdGhlIGNvbXBvbmVudC5cbiAgICovXG4gIGdldCBuZ0NvbnRlbnRTZWxlY3RvcnMoKTogUmVhZG9ubHlBcnJheTxzdHJpbmc+O1xuICAvKipcbiAgICogV2hldGhlciB0aGlzIGNvbXBvbmVudCBpcyBtYXJrZWQgYXMgc3RhbmRhbG9uZS5cbiAgICogTm90ZTogYW4gZXh0cmEgZmxhZywgbm90IHByZXNlbnQgaW4gYENvbXBvbmVudEZhY3RvcnlgLlxuICAgKi9cbiAgZ2V0IGlzU3RhbmRhbG9uZSgpOiBib29sZWFuO1xuICAvKipcbiAgICogLy8gVE9ETyhzaWduYWxzKTogUmVtb3ZlIGludGVybmFsIGFuZCBhZGQgcHVibGljIGRvY3VtZW50YXRpb25cbiAgICogQGludGVybmFsXG4gICAqL1xuICBnZXQgaXNTaWduYWwoKTogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIG9iamVjdCB0aGF0IGFsbG93cyB0byByZXRyaWV2ZSBjb21wb25lbnQgbWV0YWRhdGEuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiBUaGUgZXhhbXBsZSBiZWxvdyBkZW1vbnN0cmF0ZXMgaG93IHRvIHVzZSB0aGUgZnVuY3Rpb24gYW5kIGhvdyB0aGUgZmllbGRzXG4gKiBvZiB0aGUgcmV0dXJuZWQgb2JqZWN0IG1hcCB0byB0aGUgY29tcG9uZW50IG1ldGFkYXRhLlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIEBDb21wb25lbnQoe1xuICogICBzdGFuZGFsb25lOiB0cnVlLFxuICogICBzZWxlY3RvcjogJ2Zvby1jb21wb25lbnQnLFxuICogICB0ZW1wbGF0ZTogYFxuICogICAgIDxuZy1jb250ZW50PjwvbmctY29udGVudD5cbiAqICAgICA8bmctY29udGVudCBzZWxlY3Q9XCJjb250ZW50LXNlbGVjdG9yLWFcIj48L25nLWNvbnRlbnQ+XG4gKiAgIGAsXG4gKiB9KVxuICogY2xhc3MgRm9vQ29tcG9uZW50IHtcbiAqICAgQElucHV0KCdpbnB1dE5hbWUnKSBpbnB1dFByb3BOYW1lOiBzdHJpbmc7XG4gKiAgIEBPdXRwdXQoJ291dHB1dE5hbWUnKSBvdXRwdXRQcm9wTmFtZSA9IG5ldyBFdmVudEVtaXR0ZXI8dm9pZD4oKTtcbiAqIH1cbiAqXG4gKiBjb25zdCBtaXJyb3IgPSByZWZsZWN0Q29tcG9uZW50VHlwZShGb29Db21wb25lbnQpO1xuICogZXhwZWN0KG1pcnJvci50eXBlKS50b0JlKEZvb0NvbXBvbmVudCk7XG4gKiBleHBlY3QobWlycm9yLnNlbGVjdG9yKS50b0JlKCdmb28tY29tcG9uZW50Jyk7XG4gKiBleHBlY3QobWlycm9yLmlzU3RhbmRhbG9uZSkudG9CZSh0cnVlKTtcbiAqIGV4cGVjdChtaXJyb3IuaW5wdXRzKS50b0VxdWFsKFt7cHJvcE5hbWU6ICdpbnB1dE5hbWUnLCB0ZW1wbGF0ZU5hbWU6ICdpbnB1dFByb3BOYW1lJ31dKTtcbiAqIGV4cGVjdChtaXJyb3Iub3V0cHV0cykudG9FcXVhbChbe3Byb3BOYW1lOiAnb3V0cHV0TmFtZScsIHRlbXBsYXRlTmFtZTogJ291dHB1dFByb3BOYW1lJ31dKTtcbiAqIGV4cGVjdChtaXJyb3IubmdDb250ZW50U2VsZWN0b3JzKS50b0VxdWFsKFtcbiAqICAgJyonLCAgICAgICAgICAgICAgICAgLy8gZmlyc3QgYDxuZy1jb250ZW50PmAgaW4gYSB0ZW1wbGF0ZSwgdGhlIHNlbGVjdG9yIGRlZmF1bHRzIHRvIGAqYFxuICogICAnY29udGVudC1zZWxlY3Rvci1hJyAvLyBzZWNvbmQgYDxuZy1jb250ZW50PmAgaW4gYSB0ZW1wbGF0ZVxuICogXSk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IENvbXBvbmVudCBjbGFzcyByZWZlcmVuY2UuXG4gKiBAcmV0dXJucyBBbiBvYmplY3QgdGhhdCBhbGxvd3MgdG8gcmV0cmlldmUgY29tcG9uZW50IG1ldGFkYXRhLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZmxlY3RDb21wb25lbnRUeXBlPEM+KGNvbXBvbmVudDogVHlwZTxDPik6IENvbXBvbmVudE1pcnJvcjxDPnxudWxsIHtcbiAgY29uc3QgY29tcG9uZW50RGVmID0gZ2V0Q29tcG9uZW50RGVmKGNvbXBvbmVudCk7XG4gIGlmICghY29tcG9uZW50RGVmKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCBmYWN0b3J5ID0gbmV3IENvbXBvbmVudEZhY3Rvcnk8Qz4oY29tcG9uZW50RGVmKTtcbiAgcmV0dXJuIHtcbiAgICBnZXQgc2VsZWN0b3IoKTogc3RyaW5nIHtcbiAgICAgIHJldHVybiBmYWN0b3J5LnNlbGVjdG9yO1xuICAgIH0sXG4gICAgZ2V0IHR5cGUoKTogVHlwZTxDPiB7XG4gICAgICByZXR1cm4gZmFjdG9yeS5jb21wb25lbnRUeXBlO1xuICAgIH0sXG4gICAgZ2V0IGlucHV0cygpOiBSZWFkb25seUFycmF5PHtwcm9wTmFtZTogc3RyaW5nLCB0ZW1wbGF0ZU5hbWU6IHN0cmluZ30+IHtcbiAgICAgIHJldHVybiBmYWN0b3J5LmlucHV0cztcbiAgICB9LFxuICAgIGdldCBvdXRwdXRzKCk6IFJlYWRvbmx5QXJyYXk8e3Byb3BOYW1lOiBzdHJpbmcsIHRlbXBsYXRlTmFtZTogc3RyaW5nfT4ge1xuICAgICAgcmV0dXJuIGZhY3Rvcnkub3V0cHV0cztcbiAgICB9LFxuICAgIGdldCBuZ0NvbnRlbnRTZWxlY3RvcnMoKTogUmVhZG9ubHlBcnJheTxzdHJpbmc+IHtcbiAgICAgIHJldHVybiBmYWN0b3J5Lm5nQ29udGVudFNlbGVjdG9ycztcbiAgICB9LFxuICAgIGdldCBpc1N0YW5kYWxvbmUoKTogYm9vbGVhbiB7XG4gICAgICByZXR1cm4gY29tcG9uZW50RGVmLnN0YW5kYWxvbmU7XG4gICAgfSxcbiAgICBnZXQgaXNTaWduYWwoKTogYm9vbGVhbiB7XG4gICAgICByZXR1cm4gY29tcG9uZW50RGVmLnNpZ25hbHM7XG4gICAgfSxcbiAgfTtcbn1cbiJdfQ==