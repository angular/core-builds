/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { resolveForwardRef } from '../../di';
import { EMPTY_OBJ } from '../../util/empty';
import { getDirectiveDef } from '../definition';
/**
 * This feature add the host directives behavior to a directive definition by patching a
 * function onto it. The expectation is that the runtime will invoke the function during
 * directive matching.
 *
 * For example:
 * ```ts
 * class ComponentWithHostDirective {
 *   static ɵcmp = defineComponent({
 *    type: ComponentWithHostDirective,
 *    features: [ɵɵHostDirectivesFeature([
 *      SimpleHostDirective,
 *      {directive: AdvancedHostDirective, inputs: ['foo: alias'], outputs: ['bar']},
 *    ])]
 *  });
 * }
 * ```
 *
 * @codeGenApi
 */
export function ɵɵHostDirectivesFeature(rawHostDirectives) {
    return (definition) => {
        definition.findHostDirectiveDefs = findHostDirectiveDefs;
        definition.hostDirectives =
            (Array.isArray(rawHostDirectives) ? rawHostDirectives : rawHostDirectives()).map(dir => {
                return typeof dir === 'function' ?
                    { directive: resolveForwardRef(dir), inputs: EMPTY_OBJ, outputs: EMPTY_OBJ } :
                    {
                        directive: resolveForwardRef(dir.directive),
                        inputs: bindingArrayToMap(dir.inputs),
                        outputs: bindingArrayToMap(dir.outputs)
                    };
            });
    };
}
function findHostDirectiveDefs(matches, def, tView, lView, tNode) {
    if (def.hostDirectives !== null) {
        for (const hostDirectiveConfig of def.hostDirectives) {
            const hostDirectiveDef = getDirectiveDef(hostDirectiveConfig.directive);
            // TODO(crisbeto): assert that the def exists.
            // Host directives execute before the host so that its host bindings can be overwritten.
            findHostDirectiveDefs(matches, hostDirectiveDef, tView, lView, tNode);
        }
    }
    // Push the def itself at the end since it needs to execute after the host directives.
    matches.push(def);
}
/**
 * Converts an array in the form of `['publicName', 'alias', 'otherPublicName', 'otherAlias']` into
 * a map in the form of `{publicName: 'alias', otherPublicName: 'otherAlias'}`.
 */
function bindingArrayToMap(bindings) {
    if (bindings === undefined || bindings.length === 0) {
        return EMPTY_OBJ;
    }
    const result = {};
    for (let i = 0; i < bindings.length; i += 2) {
        result[bindings[i]] = bindings[i + 1];
    }
    return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9zdF9kaXJlY3RpdmVzX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL2hvc3RfZGlyZWN0aXZlc19mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUUzQyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDM0MsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQVk5Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW1CRztBQUNILE1BQU0sVUFBVSx1QkFBdUIsQ0FBQyxpQkFDNkI7SUFDbkUsT0FBTyxDQUFDLFVBQWlDLEVBQUUsRUFBRTtRQUMzQyxVQUFVLENBQUMscUJBQXFCLEdBQUcscUJBQXFCLENBQUM7UUFDekQsVUFBVSxDQUFDLGNBQWM7WUFDckIsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNyRixPQUFPLE9BQU8sR0FBRyxLQUFLLFVBQVUsQ0FBQyxDQUFDO29CQUM5QixFQUFDLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUMsQ0FBQyxDQUFDO29CQUM1RTt3QkFDRSxTQUFTLEVBQUUsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQzt3QkFDM0MsTUFBTSxFQUFFLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7d0JBQ3JDLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDO3FCQUN4QyxDQUFDO1lBQ1IsQ0FBQyxDQUFDLENBQUM7SUFDVCxDQUFDLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FDMUIsT0FBZ0MsRUFBRSxHQUEwQixFQUFFLEtBQVksRUFBRSxLQUFZLEVBQ3hGLEtBQXdEO0lBQzFELElBQUksR0FBRyxDQUFDLGNBQWMsS0FBSyxJQUFJLEVBQUU7UUFDL0IsS0FBSyxNQUFNLG1CQUFtQixJQUFJLEdBQUcsQ0FBQyxjQUFjLEVBQUU7WUFDcEQsTUFBTSxnQkFBZ0IsR0FBRyxlQUFlLENBQUMsbUJBQW1CLENBQUMsU0FBUyxDQUFFLENBQUM7WUFFekUsOENBQThDO1lBRTlDLHdGQUF3RjtZQUN4RixxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztTQUN2RTtLQUNGO0lBRUQsc0ZBQXNGO0lBQ3RGLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDcEIsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsaUJBQWlCLENBQUMsUUFBNEI7SUFDckQsSUFBSSxRQUFRLEtBQUssU0FBUyxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ25ELE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0lBRUQsTUFBTSxNQUFNLEdBQW1DLEVBQUUsQ0FBQztJQUVsRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQzNDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0tBQ3ZDO0lBRUQsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi4vLi4vZGknO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0VNUFRZX09CSn0gZnJvbSAnLi4vLi4vdXRpbC9lbXB0eSc7XG5pbXBvcnQge2dldERpcmVjdGl2ZURlZn0gZnJvbSAnLi4vZGVmaW5pdGlvbic7XG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtMVmlldywgVFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5cbi8qKiBWYWx1ZXMgdGhhdCBjYW4gYmUgdXNlZCB0byBkZWZpbmUgYSBob3N0IGRpcmVjdGl2ZSB0aHJvdWdoIHRoZSBgSG9zdERpcmVjdGl2ZXNGZWF0dXJlYC4gKi9cbnR5cGUgSG9zdERpcmVjdGl2ZUNvbmZpZyA9IFR5cGU8dW5rbm93bj58e1xuICBkaXJlY3RpdmU6IFR5cGU8dW5rbm93bj47XG4gIGlucHV0cz86IHN0cmluZ1tdO1xuICBvdXRwdXRzPzogc3RyaW5nW107XG59O1xuXG4vKipcbiAqIFRoaXMgZmVhdHVyZSBhZGQgdGhlIGhvc3QgZGlyZWN0aXZlcyBiZWhhdmlvciB0byBhIGRpcmVjdGl2ZSBkZWZpbml0aW9uIGJ5IHBhdGNoaW5nIGFcbiAqIGZ1bmN0aW9uIG9udG8gaXQuIFRoZSBleHBlY3RhdGlvbiBpcyB0aGF0IHRoZSBydW50aW1lIHdpbGwgaW52b2tlIHRoZSBmdW5jdGlvbiBkdXJpbmdcbiAqIGRpcmVjdGl2ZSBtYXRjaGluZy5cbiAqXG4gKiBGb3IgZXhhbXBsZTpcbiAqIGBgYHRzXG4gKiBjbGFzcyBDb21wb25lbnRXaXRoSG9zdERpcmVjdGl2ZSB7XG4gKiAgIHN0YXRpYyDJtWNtcCA9IGRlZmluZUNvbXBvbmVudCh7XG4gKiAgICB0eXBlOiBDb21wb25lbnRXaXRoSG9zdERpcmVjdGl2ZSxcbiAqICAgIGZlYXR1cmVzOiBbybXJtUhvc3REaXJlY3RpdmVzRmVhdHVyZShbXG4gKiAgICAgIFNpbXBsZUhvc3REaXJlY3RpdmUsXG4gKiAgICAgIHtkaXJlY3RpdmU6IEFkdmFuY2VkSG9zdERpcmVjdGl2ZSwgaW5wdXRzOiBbJ2ZvbzogYWxpYXMnXSwgb3V0cHV0czogWydiYXInXX0sXG4gKiAgICBdKV1cbiAqICB9KTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1SG9zdERpcmVjdGl2ZXNGZWF0dXJlKHJhd0hvc3REaXJlY3RpdmVzOiBIb3N0RGlyZWN0aXZlQ29uZmlnW118XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCgpID0+IEhvc3REaXJlY3RpdmVDb25maWdbXSkpIHtcbiAgcmV0dXJuIChkZWZpbml0aW9uOiBEaXJlY3RpdmVEZWY8dW5rbm93bj4pID0+IHtcbiAgICBkZWZpbml0aW9uLmZpbmRIb3N0RGlyZWN0aXZlRGVmcyA9IGZpbmRIb3N0RGlyZWN0aXZlRGVmcztcbiAgICBkZWZpbml0aW9uLmhvc3REaXJlY3RpdmVzID1cbiAgICAgICAgKEFycmF5LmlzQXJyYXkocmF3SG9zdERpcmVjdGl2ZXMpID8gcmF3SG9zdERpcmVjdGl2ZXMgOiByYXdIb3N0RGlyZWN0aXZlcygpKS5tYXAoZGlyID0+IHtcbiAgICAgICAgICByZXR1cm4gdHlwZW9mIGRpciA9PT0gJ2Z1bmN0aW9uJyA/XG4gICAgICAgICAgICAgIHtkaXJlY3RpdmU6IHJlc29sdmVGb3J3YXJkUmVmKGRpciksIGlucHV0czogRU1QVFlfT0JKLCBvdXRwdXRzOiBFTVBUWV9PQkp9IDpcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGRpcmVjdGl2ZTogcmVzb2x2ZUZvcndhcmRSZWYoZGlyLmRpcmVjdGl2ZSksXG4gICAgICAgICAgICAgICAgaW5wdXRzOiBiaW5kaW5nQXJyYXlUb01hcChkaXIuaW5wdXRzKSxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiBiaW5kaW5nQXJyYXlUb01hcChkaXIub3V0cHV0cylcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGZpbmRIb3N0RGlyZWN0aXZlRGVmcyhcbiAgICBtYXRjaGVzOiBEaXJlY3RpdmVEZWY8dW5rbm93bj5bXSwgZGVmOiBEaXJlY3RpdmVEZWY8dW5rbm93bj4sIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LFxuICAgIHROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlKTogdm9pZCB7XG4gIGlmIChkZWYuaG9zdERpcmVjdGl2ZXMgIT09IG51bGwpIHtcbiAgICBmb3IgKGNvbnN0IGhvc3REaXJlY3RpdmVDb25maWcgb2YgZGVmLmhvc3REaXJlY3RpdmVzKSB7XG4gICAgICBjb25zdCBob3N0RGlyZWN0aXZlRGVmID0gZ2V0RGlyZWN0aXZlRGVmKGhvc3REaXJlY3RpdmVDb25maWcuZGlyZWN0aXZlKSE7XG5cbiAgICAgIC8vIFRPRE8oY3Jpc2JldG8pOiBhc3NlcnQgdGhhdCB0aGUgZGVmIGV4aXN0cy5cblxuICAgICAgLy8gSG9zdCBkaXJlY3RpdmVzIGV4ZWN1dGUgYmVmb3JlIHRoZSBob3N0IHNvIHRoYXQgaXRzIGhvc3QgYmluZGluZ3MgY2FuIGJlIG92ZXJ3cml0dGVuLlxuICAgICAgZmluZEhvc3REaXJlY3RpdmVEZWZzKG1hdGNoZXMsIGhvc3REaXJlY3RpdmVEZWYsIHRWaWV3LCBsVmlldywgdE5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFB1c2ggdGhlIGRlZiBpdHNlbGYgYXQgdGhlIGVuZCBzaW5jZSBpdCBuZWVkcyB0byBleGVjdXRlIGFmdGVyIHRoZSBob3N0IGRpcmVjdGl2ZXMuXG4gIG1hdGNoZXMucHVzaChkZWYpO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGFuIGFycmF5IGluIHRoZSBmb3JtIG9mIGBbJ3B1YmxpY05hbWUnLCAnYWxpYXMnLCAnb3RoZXJQdWJsaWNOYW1lJywgJ290aGVyQWxpYXMnXWAgaW50b1xuICogYSBtYXAgaW4gdGhlIGZvcm0gb2YgYHtwdWJsaWNOYW1lOiAnYWxpYXMnLCBvdGhlclB1YmxpY05hbWU6ICdvdGhlckFsaWFzJ31gLlxuICovXG5mdW5jdGlvbiBiaW5kaW5nQXJyYXlUb01hcChiaW5kaW5nczogc3RyaW5nW118dW5kZWZpbmVkKSB7XG4gIGlmIChiaW5kaW5ncyA9PT0gdW5kZWZpbmVkIHx8IGJpbmRpbmdzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBFTVBUWV9PQko7XG4gIH1cblxuICBjb25zdCByZXN1bHQ6IHtbcHVibGljTmFtZTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYmluZGluZ3MubGVuZ3RoOyBpICs9IDIpIHtcbiAgICByZXN1bHRbYmluZGluZ3NbaV1dID0gYmluZGluZ3NbaSArIDFdO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cbiJdfQ==