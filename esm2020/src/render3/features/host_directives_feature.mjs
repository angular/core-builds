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
function findHostDirectiveDefs(currentDef, matchedDefs, hostDirectiveDefs) {
    if (currentDef.hostDirectives !== null) {
        for (const hostDirectiveConfig of currentDef.hostDirectives) {
            const hostDirectiveDef = getDirectiveDef(hostDirectiveConfig.directive);
            // TODO(crisbeto): assert that the def exists.
            // Host directives execute before the host so that its host bindings can be overwritten.
            findHostDirectiveDefs(hostDirectiveDef, matchedDefs, hostDirectiveDefs);
            hostDirectiveDefs.set(hostDirectiveDef, hostDirectiveConfig);
            matchedDefs.push(hostDirectiveDef);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9zdF9kaXJlY3RpdmVzX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL2hvc3RfZGlyZWN0aXZlc19mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUUzQyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDM0MsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQVU5Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW1CRztBQUNILE1BQU0sVUFBVSx1QkFBdUIsQ0FBQyxpQkFDNkI7SUFDbkUsT0FBTyxDQUFDLFVBQWlDLEVBQUUsRUFBRTtRQUMzQyxVQUFVLENBQUMscUJBQXFCLEdBQUcscUJBQXFCLENBQUM7UUFDekQsVUFBVSxDQUFDLGNBQWM7WUFDckIsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNyRixPQUFPLE9BQU8sR0FBRyxLQUFLLFVBQVUsQ0FBQyxDQUFDO29CQUM5QixFQUFDLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUMsQ0FBQyxDQUFDO29CQUM1RTt3QkFDRSxTQUFTLEVBQUUsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQzt3QkFDM0MsTUFBTSxFQUFFLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7d0JBQ3JDLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDO3FCQUN4QyxDQUFDO1lBQ1IsQ0FBQyxDQUFDLENBQUM7SUFDVCxDQUFDLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FDMUIsVUFBaUMsRUFBRSxXQUFvQyxFQUN2RSxpQkFBb0M7SUFDdEMsSUFBSSxVQUFVLENBQUMsY0FBYyxLQUFLLElBQUksRUFBRTtRQUN0QyxLQUFLLE1BQU0sbUJBQW1CLElBQUksVUFBVSxDQUFDLGNBQWMsRUFBRTtZQUMzRCxNQUFNLGdCQUFnQixHQUFHLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLENBQUUsQ0FBQztZQUV6RSw4Q0FBOEM7WUFFOUMsd0ZBQXdGO1lBQ3hGLHFCQUFxQixDQUFDLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBQ3hFLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBQzdELFdBQVcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztTQUNwQztLQUNGO0FBQ0gsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsaUJBQWlCLENBQUMsUUFBNEI7SUFDckQsSUFBSSxRQUFRLEtBQUssU0FBUyxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ25ELE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0lBRUQsTUFBTSxNQUFNLEdBQTRCLEVBQUUsQ0FBQztJQUUzQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQzNDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0tBQ3ZDO0lBRUQsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi4vLi4vZGknO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0VNUFRZX09CSn0gZnJvbSAnLi4vLi4vdXRpbC9lbXB0eSc7XG5pbXBvcnQge2dldERpcmVjdGl2ZURlZn0gZnJvbSAnLi4vZGVmaW5pdGlvbic7XG5pbXBvcnQge0RpcmVjdGl2ZURlZiwgSG9zdERpcmVjdGl2ZUJpbmRpbmdNYXAsIEhvc3REaXJlY3RpdmVEZWZzfSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuXG4vKiogVmFsdWVzIHRoYXQgY2FuIGJlIHVzZWQgdG8gZGVmaW5lIGEgaG9zdCBkaXJlY3RpdmUgdGhyb3VnaCB0aGUgYEhvc3REaXJlY3RpdmVzRmVhdHVyZWAuICovXG50eXBlIEhvc3REaXJlY3RpdmVDb25maWcgPSBUeXBlPHVua25vd24+fHtcbiAgZGlyZWN0aXZlOiBUeXBlPHVua25vd24+O1xuICBpbnB1dHM/OiBzdHJpbmdbXTtcbiAgb3V0cHV0cz86IHN0cmluZ1tdO1xufTtcblxuLyoqXG4gKiBUaGlzIGZlYXR1cmUgYWRkIHRoZSBob3N0IGRpcmVjdGl2ZXMgYmVoYXZpb3IgdG8gYSBkaXJlY3RpdmUgZGVmaW5pdGlvbiBieSBwYXRjaGluZyBhXG4gKiBmdW5jdGlvbiBvbnRvIGl0LiBUaGUgZXhwZWN0YXRpb24gaXMgdGhhdCB0aGUgcnVudGltZSB3aWxsIGludm9rZSB0aGUgZnVuY3Rpb24gZHVyaW5nXG4gKiBkaXJlY3RpdmUgbWF0Y2hpbmcuXG4gKlxuICogRm9yIGV4YW1wbGU6XG4gKiBgYGB0c1xuICogY2xhc3MgQ29tcG9uZW50V2l0aEhvc3REaXJlY3RpdmUge1xuICogICBzdGF0aWMgybVjbXAgPSBkZWZpbmVDb21wb25lbnQoe1xuICogICAgdHlwZTogQ29tcG9uZW50V2l0aEhvc3REaXJlY3RpdmUsXG4gKiAgICBmZWF0dXJlczogW8m1ybVIb3N0RGlyZWN0aXZlc0ZlYXR1cmUoW1xuICogICAgICBTaW1wbGVIb3N0RGlyZWN0aXZlLFxuICogICAgICB7ZGlyZWN0aXZlOiBBZHZhbmNlZEhvc3REaXJlY3RpdmUsIGlucHV0czogWydmb286IGFsaWFzJ10sIG91dHB1dHM6IFsnYmFyJ119LFxuICogICAgXSldXG4gKiAgfSk7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtUhvc3REaXJlY3RpdmVzRmVhdHVyZShyYXdIb3N0RGlyZWN0aXZlczogSG9zdERpcmVjdGl2ZUNvbmZpZ1tdfFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICgoKSA9PiBIb3N0RGlyZWN0aXZlQ29uZmlnW10pKSB7XG4gIHJldHVybiAoZGVmaW5pdGlvbjogRGlyZWN0aXZlRGVmPHVua25vd24+KSA9PiB7XG4gICAgZGVmaW5pdGlvbi5maW5kSG9zdERpcmVjdGl2ZURlZnMgPSBmaW5kSG9zdERpcmVjdGl2ZURlZnM7XG4gICAgZGVmaW5pdGlvbi5ob3N0RGlyZWN0aXZlcyA9XG4gICAgICAgIChBcnJheS5pc0FycmF5KHJhd0hvc3REaXJlY3RpdmVzKSA/IHJhd0hvc3REaXJlY3RpdmVzIDogcmF3SG9zdERpcmVjdGl2ZXMoKSkubWFwKGRpciA9PiB7XG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBkaXIgPT09ICdmdW5jdGlvbicgP1xuICAgICAgICAgICAgICB7ZGlyZWN0aXZlOiByZXNvbHZlRm9yd2FyZFJlZihkaXIpLCBpbnB1dHM6IEVNUFRZX09CSiwgb3V0cHV0czogRU1QVFlfT0JKfSA6XG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBkaXJlY3RpdmU6IHJlc29sdmVGb3J3YXJkUmVmKGRpci5kaXJlY3RpdmUpLFxuICAgICAgICAgICAgICAgIGlucHV0czogYmluZGluZ0FycmF5VG9NYXAoZGlyLmlucHV0cyksXG4gICAgICAgICAgICAgICAgb3V0cHV0czogYmluZGluZ0FycmF5VG9NYXAoZGlyLm91dHB1dHMpXG4gICAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICB9O1xufVxuXG5mdW5jdGlvbiBmaW5kSG9zdERpcmVjdGl2ZURlZnMoXG4gICAgY3VycmVudERlZjogRGlyZWN0aXZlRGVmPHVua25vd24+LCBtYXRjaGVkRGVmczogRGlyZWN0aXZlRGVmPHVua25vd24+W10sXG4gICAgaG9zdERpcmVjdGl2ZURlZnM6IEhvc3REaXJlY3RpdmVEZWZzKTogdm9pZCB7XG4gIGlmIChjdXJyZW50RGVmLmhvc3REaXJlY3RpdmVzICE9PSBudWxsKSB7XG4gICAgZm9yIChjb25zdCBob3N0RGlyZWN0aXZlQ29uZmlnIG9mIGN1cnJlbnREZWYuaG9zdERpcmVjdGl2ZXMpIHtcbiAgICAgIGNvbnN0IGhvc3REaXJlY3RpdmVEZWYgPSBnZXREaXJlY3RpdmVEZWYoaG9zdERpcmVjdGl2ZUNvbmZpZy5kaXJlY3RpdmUpITtcblxuICAgICAgLy8gVE9ETyhjcmlzYmV0byk6IGFzc2VydCB0aGF0IHRoZSBkZWYgZXhpc3RzLlxuXG4gICAgICAvLyBIb3N0IGRpcmVjdGl2ZXMgZXhlY3V0ZSBiZWZvcmUgdGhlIGhvc3Qgc28gdGhhdCBpdHMgaG9zdCBiaW5kaW5ncyBjYW4gYmUgb3ZlcndyaXR0ZW4uXG4gICAgICBmaW5kSG9zdERpcmVjdGl2ZURlZnMoaG9zdERpcmVjdGl2ZURlZiwgbWF0Y2hlZERlZnMsIGhvc3REaXJlY3RpdmVEZWZzKTtcbiAgICAgIGhvc3REaXJlY3RpdmVEZWZzLnNldChob3N0RGlyZWN0aXZlRGVmLCBob3N0RGlyZWN0aXZlQ29uZmlnKTtcbiAgICAgIG1hdGNoZWREZWZzLnB1c2goaG9zdERpcmVjdGl2ZURlZik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ29udmVydHMgYW4gYXJyYXkgaW4gdGhlIGZvcm0gb2YgYFsncHVibGljTmFtZScsICdhbGlhcycsICdvdGhlclB1YmxpY05hbWUnLCAnb3RoZXJBbGlhcyddYCBpbnRvXG4gKiBhIG1hcCBpbiB0aGUgZm9ybSBvZiBge3B1YmxpY05hbWU6ICdhbGlhcycsIG90aGVyUHVibGljTmFtZTogJ290aGVyQWxpYXMnfWAuXG4gKi9cbmZ1bmN0aW9uIGJpbmRpbmdBcnJheVRvTWFwKGJpbmRpbmdzOiBzdHJpbmdbXXx1bmRlZmluZWQpOiBIb3N0RGlyZWN0aXZlQmluZGluZ01hcCB7XG4gIGlmIChiaW5kaW5ncyA9PT0gdW5kZWZpbmVkIHx8IGJpbmRpbmdzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBFTVBUWV9PQko7XG4gIH1cblxuICBjb25zdCByZXN1bHQ6IEhvc3REaXJlY3RpdmVCaW5kaW5nTWFwID0ge307XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBiaW5kaW5ncy5sZW5ndGg7IGkgKz0gMikge1xuICAgIHJlc3VsdFtiaW5kaW5nc1tpXV0gPSBiaW5kaW5nc1tpICsgMV07XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuIl19