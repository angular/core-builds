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
            matches.push(hostDirectiveDef);
        }
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9zdF9kaXJlY3RpdmVzX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL2hvc3RfZGlyZWN0aXZlc19mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUUzQyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDM0MsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQVk5Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW1CRztBQUNILE1BQU0sVUFBVSx1QkFBdUIsQ0FBQyxpQkFDNkI7SUFDbkUsT0FBTyxDQUFDLFVBQWlDLEVBQUUsRUFBRTtRQUMzQyxVQUFVLENBQUMscUJBQXFCLEdBQUcscUJBQXFCLENBQUM7UUFDekQsVUFBVSxDQUFDLGNBQWM7WUFDckIsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNyRixPQUFPLE9BQU8sR0FBRyxLQUFLLFVBQVUsQ0FBQyxDQUFDO29CQUM5QixFQUFDLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUMsQ0FBQyxDQUFDO29CQUM1RTt3QkFDRSxTQUFTLEVBQUUsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQzt3QkFDM0MsTUFBTSxFQUFFLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7d0JBQ3JDLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDO3FCQUN4QyxDQUFDO1lBQ1IsQ0FBQyxDQUFDLENBQUM7SUFDVCxDQUFDLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FDMUIsT0FBZ0MsRUFBRSxHQUEwQixFQUFFLEtBQVksRUFBRSxLQUFZLEVBQ3hGLEtBQXdEO0lBQzFELElBQUksR0FBRyxDQUFDLGNBQWMsS0FBSyxJQUFJLEVBQUU7UUFDL0IsS0FBSyxNQUFNLG1CQUFtQixJQUFJLEdBQUcsQ0FBQyxjQUFjLEVBQUU7WUFDcEQsTUFBTSxnQkFBZ0IsR0FBRyxlQUFlLENBQUMsbUJBQW1CLENBQUMsU0FBUyxDQUFFLENBQUM7WUFFekUsOENBQThDO1lBRTlDLHdGQUF3RjtZQUN4RixxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN0RSxPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7U0FDaEM7S0FDRjtBQUNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLGlCQUFpQixDQUFDLFFBQTRCO0lBQ3JELElBQUksUUFBUSxLQUFLLFNBQVMsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUNuRCxPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUVELE1BQU0sTUFBTSxHQUFtQyxFQUFFLENBQUM7SUFFbEQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUMzQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztLQUN2QztJQUVELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4uLy4uL2RpJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtFTVBUWV9PQkp9IGZyb20gJy4uLy4uL3V0aWwvZW1wdHknO1xuaW1wb3J0IHtnZXREaXJlY3RpdmVEZWZ9IGZyb20gJy4uL2RlZmluaXRpb24nO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWZ9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFZpZXcsIFRWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuXG4vKiogVmFsdWVzIHRoYXQgY2FuIGJlIHVzZWQgdG8gZGVmaW5lIGEgaG9zdCBkaXJlY3RpdmUgdGhyb3VnaCB0aGUgYEhvc3REaXJlY3RpdmVzRmVhdHVyZWAuICovXG50eXBlIEhvc3REaXJlY3RpdmVDb25maWcgPSBUeXBlPHVua25vd24+fHtcbiAgZGlyZWN0aXZlOiBUeXBlPHVua25vd24+O1xuICBpbnB1dHM/OiBzdHJpbmdbXTtcbiAgb3V0cHV0cz86IHN0cmluZ1tdO1xufTtcblxuLyoqXG4gKiBUaGlzIGZlYXR1cmUgYWRkIHRoZSBob3N0IGRpcmVjdGl2ZXMgYmVoYXZpb3IgdG8gYSBkaXJlY3RpdmUgZGVmaW5pdGlvbiBieSBwYXRjaGluZyBhXG4gKiBmdW5jdGlvbiBvbnRvIGl0LiBUaGUgZXhwZWN0YXRpb24gaXMgdGhhdCB0aGUgcnVudGltZSB3aWxsIGludm9rZSB0aGUgZnVuY3Rpb24gZHVyaW5nXG4gKiBkaXJlY3RpdmUgbWF0Y2hpbmcuXG4gKlxuICogRm9yIGV4YW1wbGU6XG4gKiBgYGB0c1xuICogY2xhc3MgQ29tcG9uZW50V2l0aEhvc3REaXJlY3RpdmUge1xuICogICBzdGF0aWMgybVjbXAgPSBkZWZpbmVDb21wb25lbnQoe1xuICogICAgdHlwZTogQ29tcG9uZW50V2l0aEhvc3REaXJlY3RpdmUsXG4gKiAgICBmZWF0dXJlczogW8m1ybVIb3N0RGlyZWN0aXZlc0ZlYXR1cmUoW1xuICogICAgICBTaW1wbGVIb3N0RGlyZWN0aXZlLFxuICogICAgICB7ZGlyZWN0aXZlOiBBZHZhbmNlZEhvc3REaXJlY3RpdmUsIGlucHV0czogWydmb286IGFsaWFzJ10sIG91dHB1dHM6IFsnYmFyJ119LFxuICogICAgXSldXG4gKiAgfSk7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtUhvc3REaXJlY3RpdmVzRmVhdHVyZShyYXdIb3N0RGlyZWN0aXZlczogSG9zdERpcmVjdGl2ZUNvbmZpZ1tdfFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICgoKSA9PiBIb3N0RGlyZWN0aXZlQ29uZmlnW10pKSB7XG4gIHJldHVybiAoZGVmaW5pdGlvbjogRGlyZWN0aXZlRGVmPHVua25vd24+KSA9PiB7XG4gICAgZGVmaW5pdGlvbi5maW5kSG9zdERpcmVjdGl2ZURlZnMgPSBmaW5kSG9zdERpcmVjdGl2ZURlZnM7XG4gICAgZGVmaW5pdGlvbi5ob3N0RGlyZWN0aXZlcyA9XG4gICAgICAgIChBcnJheS5pc0FycmF5KHJhd0hvc3REaXJlY3RpdmVzKSA/IHJhd0hvc3REaXJlY3RpdmVzIDogcmF3SG9zdERpcmVjdGl2ZXMoKSkubWFwKGRpciA9PiB7XG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBkaXIgPT09ICdmdW5jdGlvbicgP1xuICAgICAgICAgICAgICB7ZGlyZWN0aXZlOiByZXNvbHZlRm9yd2FyZFJlZihkaXIpLCBpbnB1dHM6IEVNUFRZX09CSiwgb3V0cHV0czogRU1QVFlfT0JKfSA6XG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBkaXJlY3RpdmU6IHJlc29sdmVGb3J3YXJkUmVmKGRpci5kaXJlY3RpdmUpLFxuICAgICAgICAgICAgICAgIGlucHV0czogYmluZGluZ0FycmF5VG9NYXAoZGlyLmlucHV0cyksXG4gICAgICAgICAgICAgICAgb3V0cHV0czogYmluZGluZ0FycmF5VG9NYXAoZGlyLm91dHB1dHMpXG4gICAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICB9O1xufVxuXG5mdW5jdGlvbiBmaW5kSG9zdERpcmVjdGl2ZURlZnMoXG4gICAgbWF0Y2hlczogRGlyZWN0aXZlRGVmPHVua25vd24+W10sIGRlZjogRGlyZWN0aXZlRGVmPHVua25vd24+LCB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldyxcbiAgICB0Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSk6IHZvaWQge1xuICBpZiAoZGVmLmhvc3REaXJlY3RpdmVzICE9PSBudWxsKSB7XG4gICAgZm9yIChjb25zdCBob3N0RGlyZWN0aXZlQ29uZmlnIG9mIGRlZi5ob3N0RGlyZWN0aXZlcykge1xuICAgICAgY29uc3QgaG9zdERpcmVjdGl2ZURlZiA9IGdldERpcmVjdGl2ZURlZihob3N0RGlyZWN0aXZlQ29uZmlnLmRpcmVjdGl2ZSkhO1xuXG4gICAgICAvLyBUT0RPKGNyaXNiZXRvKTogYXNzZXJ0IHRoYXQgdGhlIGRlZiBleGlzdHMuXG5cbiAgICAgIC8vIEhvc3QgZGlyZWN0aXZlcyBleGVjdXRlIGJlZm9yZSB0aGUgaG9zdCBzbyB0aGF0IGl0cyBob3N0IGJpbmRpbmdzIGNhbiBiZSBvdmVyd3JpdHRlbi5cbiAgICAgIGZpbmRIb3N0RGlyZWN0aXZlRGVmcyhtYXRjaGVzLCBob3N0RGlyZWN0aXZlRGVmLCB0VmlldywgbFZpZXcsIHROb2RlKTtcbiAgICAgIG1hdGNoZXMucHVzaChob3N0RGlyZWN0aXZlRGVmKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBhbiBhcnJheSBpbiB0aGUgZm9ybSBvZiBgWydwdWJsaWNOYW1lJywgJ2FsaWFzJywgJ290aGVyUHVibGljTmFtZScsICdvdGhlckFsaWFzJ11gIGludG9cbiAqIGEgbWFwIGluIHRoZSBmb3JtIG9mIGB7cHVibGljTmFtZTogJ2FsaWFzJywgb3RoZXJQdWJsaWNOYW1lOiAnb3RoZXJBbGlhcyd9YC5cbiAqL1xuZnVuY3Rpb24gYmluZGluZ0FycmF5VG9NYXAoYmluZGluZ3M6IHN0cmluZ1tdfHVuZGVmaW5lZCkge1xuICBpZiAoYmluZGluZ3MgPT09IHVuZGVmaW5lZCB8fCBiaW5kaW5ncy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gRU1QVFlfT0JKO1xuICB9XG5cbiAgY29uc3QgcmVzdWx0OiB7W3B1YmxpY05hbWU6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGJpbmRpbmdzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzdWx0W2JpbmRpbmdzW2ldXSA9IGJpbmRpbmdzW2kgKyAxXTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG4iXX0=