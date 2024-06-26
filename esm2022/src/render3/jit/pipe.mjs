/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getCompilerFacade, } from '../../compiler/compiler_facade';
import { reflectDependencies } from '../../di/jit/util';
import { NG_FACTORY_DEF, NG_PIPE_DEF } from '../fields';
import { angularCoreEnv } from './environment';
export function compilePipe(type, meta) {
    let ngPipeDef = null;
    let ngFactoryDef = null;
    Object.defineProperty(type, NG_FACTORY_DEF, {
        get: () => {
            if (ngFactoryDef === null) {
                const metadata = getPipeMetadata(type, meta);
                const compiler = getCompilerFacade({
                    usage: 0 /* JitCompilerUsage.Decorator */,
                    kind: 'pipe',
                    type: metadata.type,
                });
                ngFactoryDef = compiler.compileFactory(angularCoreEnv, `ng:///${metadata.name}/ɵfac.js`, {
                    name: metadata.name,
                    type: metadata.type,
                    typeArgumentCount: 0,
                    deps: reflectDependencies(type),
                    target: compiler.FactoryTarget.Pipe,
                });
            }
            return ngFactoryDef;
        },
        // Make the property configurable in dev mode to allow overriding in tests
        configurable: !!ngDevMode,
    });
    Object.defineProperty(type, NG_PIPE_DEF, {
        get: () => {
            if (ngPipeDef === null) {
                const metadata = getPipeMetadata(type, meta);
                const compiler = getCompilerFacade({
                    usage: 0 /* JitCompilerUsage.Decorator */,
                    kind: 'pipe',
                    type: metadata.type,
                });
                ngPipeDef = compiler.compilePipe(angularCoreEnv, `ng:///${metadata.name}/ɵpipe.js`, metadata);
            }
            return ngPipeDef;
        },
        // Make the property configurable in dev mode to allow overriding in tests
        configurable: !!ngDevMode,
    });
}
function getPipeMetadata(type, meta) {
    return {
        type: type,
        name: type.name,
        pipeName: meta.name,
        pure: meta.pure !== undefined ? meta.pure : true,
        isStandalone: !!meta.standalone,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L3BpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUNMLGlCQUFpQixHQUdsQixNQUFNLGdDQUFnQyxDQUFDO0FBQ3hDLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBR3RELE9BQU8sRUFBQyxjQUFjLEVBQUUsV0FBVyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBRXRELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFN0MsTUFBTSxVQUFVLFdBQVcsQ0FBQyxJQUFlLEVBQUUsSUFBVTtJQUNyRCxJQUFJLFNBQVMsR0FBUSxJQUFJLENBQUM7SUFDMUIsSUFBSSxZQUFZLEdBQVEsSUFBSSxDQUFDO0lBRTdCLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtRQUMxQyxHQUFHLEVBQUUsR0FBRyxFQUFFO1lBQ1IsSUFBSSxZQUFZLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQzFCLE1BQU0sUUFBUSxHQUFHLGVBQWUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzdDLE1BQU0sUUFBUSxHQUFHLGlCQUFpQixDQUFDO29CQUNqQyxLQUFLLG9DQUE0QjtvQkFDakMsSUFBSSxFQUFFLE1BQU07b0JBQ1osSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJO2lCQUNwQixDQUFDLENBQUM7Z0JBQ0gsWUFBWSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsY0FBYyxFQUFFLFNBQVMsUUFBUSxDQUFDLElBQUksVUFBVSxFQUFFO29CQUN2RixJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUk7b0JBQ25CLElBQUksRUFBRSxRQUFRLENBQUMsSUFBSTtvQkFDbkIsaUJBQWlCLEVBQUUsQ0FBQztvQkFDcEIsSUFBSSxFQUFFLG1CQUFtQixDQUFDLElBQUksQ0FBQztvQkFDL0IsTUFBTSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSTtpQkFDcEMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztZQUNELE9BQU8sWUFBWSxDQUFDO1FBQ3RCLENBQUM7UUFDRCwwRUFBMEU7UUFDMUUsWUFBWSxFQUFFLENBQUMsQ0FBQyxTQUFTO0tBQzFCLENBQUMsQ0FBQztJQUVILE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtRQUN2QyxHQUFHLEVBQUUsR0FBRyxFQUFFO1lBQ1IsSUFBSSxTQUFTLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ3ZCLE1BQU0sUUFBUSxHQUFHLGVBQWUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzdDLE1BQU0sUUFBUSxHQUFHLGlCQUFpQixDQUFDO29CQUNqQyxLQUFLLG9DQUE0QjtvQkFDakMsSUFBSSxFQUFFLE1BQU07b0JBQ1osSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJO2lCQUNwQixDQUFDLENBQUM7Z0JBQ0gsU0FBUyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQzlCLGNBQWMsRUFDZCxTQUFTLFFBQVEsQ0FBQyxJQUFJLFdBQVcsRUFDakMsUUFBUSxDQUNULENBQUM7WUFDSixDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbkIsQ0FBQztRQUNELDBFQUEwRTtRQUMxRSxZQUFZLEVBQUUsQ0FBQyxDQUFDLFNBQVM7S0FDMUIsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLElBQWUsRUFBRSxJQUFVO0lBQ2xELE9BQU87UUFDTCxJQUFJLEVBQUUsSUFBSTtRQUNWLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtRQUNmLFFBQVEsRUFBRSxJQUFJLENBQUMsSUFBSTtRQUNuQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUk7UUFDaEQsWUFBWSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVTtLQUNoQyxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBnZXRDb21waWxlckZhY2FkZSxcbiAgSml0Q29tcGlsZXJVc2FnZSxcbiAgUjNQaXBlTWV0YWRhdGFGYWNhZGUsXG59IGZyb20gJy4uLy4uL2NvbXBpbGVyL2NvbXBpbGVyX2ZhY2FkZSc7XG5pbXBvcnQge3JlZmxlY3REZXBlbmRlbmNpZXN9IGZyb20gJy4uLy4uL2RpL2ppdC91dGlsJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtQaXBlfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9kaXJlY3RpdmVzJztcbmltcG9ydCB7TkdfRkFDVE9SWV9ERUYsIE5HX1BJUEVfREVGfSBmcm9tICcuLi9maWVsZHMnO1xuXG5pbXBvcnQge2FuZ3VsYXJDb3JlRW52fSBmcm9tICcuL2Vudmlyb25tZW50JztcblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVQaXBlKHR5cGU6IFR5cGU8YW55PiwgbWV0YTogUGlwZSk6IHZvaWQge1xuICBsZXQgbmdQaXBlRGVmOiBhbnkgPSBudWxsO1xuICBsZXQgbmdGYWN0b3J5RGVmOiBhbnkgPSBudWxsO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBOR19GQUNUT1JZX0RFRiwge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKG5nRmFjdG9yeURlZiA9PT0gbnVsbCkge1xuICAgICAgICBjb25zdCBtZXRhZGF0YSA9IGdldFBpcGVNZXRhZGF0YSh0eXBlLCBtZXRhKTtcbiAgICAgICAgY29uc3QgY29tcGlsZXIgPSBnZXRDb21waWxlckZhY2FkZSh7XG4gICAgICAgICAgdXNhZ2U6IEppdENvbXBpbGVyVXNhZ2UuRGVjb3JhdG9yLFxuICAgICAgICAgIGtpbmQ6ICdwaXBlJyxcbiAgICAgICAgICB0eXBlOiBtZXRhZGF0YS50eXBlLFxuICAgICAgICB9KTtcbiAgICAgICAgbmdGYWN0b3J5RGVmID0gY29tcGlsZXIuY29tcGlsZUZhY3RvcnkoYW5ndWxhckNvcmVFbnYsIGBuZzovLy8ke21ldGFkYXRhLm5hbWV9L8m1ZmFjLmpzYCwge1xuICAgICAgICAgIG5hbWU6IG1ldGFkYXRhLm5hbWUsXG4gICAgICAgICAgdHlwZTogbWV0YWRhdGEudHlwZSxcbiAgICAgICAgICB0eXBlQXJndW1lbnRDb3VudDogMCxcbiAgICAgICAgICBkZXBzOiByZWZsZWN0RGVwZW5kZW5jaWVzKHR5cGUpLFxuICAgICAgICAgIHRhcmdldDogY29tcGlsZXIuRmFjdG9yeVRhcmdldC5QaXBlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZ0ZhY3RvcnlEZWY7XG4gICAgfSxcbiAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGUsXG4gIH0pO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBOR19QSVBFX0RFRiwge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKG5nUGlwZURlZiA9PT0gbnVsbCkge1xuICAgICAgICBjb25zdCBtZXRhZGF0YSA9IGdldFBpcGVNZXRhZGF0YSh0eXBlLCBtZXRhKTtcbiAgICAgICAgY29uc3QgY29tcGlsZXIgPSBnZXRDb21waWxlckZhY2FkZSh7XG4gICAgICAgICAgdXNhZ2U6IEppdENvbXBpbGVyVXNhZ2UuRGVjb3JhdG9yLFxuICAgICAgICAgIGtpbmQ6ICdwaXBlJyxcbiAgICAgICAgICB0eXBlOiBtZXRhZGF0YS50eXBlLFxuICAgICAgICB9KTtcbiAgICAgICAgbmdQaXBlRGVmID0gY29tcGlsZXIuY29tcGlsZVBpcGUoXG4gICAgICAgICAgYW5ndWxhckNvcmVFbnYsXG4gICAgICAgICAgYG5nOi8vLyR7bWV0YWRhdGEubmFtZX0vybVwaXBlLmpzYCxcbiAgICAgICAgICBtZXRhZGF0YSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZ1BpcGVEZWY7XG4gICAgfSxcbiAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGUsXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRQaXBlTWV0YWRhdGEodHlwZTogVHlwZTxhbnk+LCBtZXRhOiBQaXBlKTogUjNQaXBlTWV0YWRhdGFGYWNhZGUge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IHR5cGUsXG4gICAgbmFtZTogdHlwZS5uYW1lLFxuICAgIHBpcGVOYW1lOiBtZXRhLm5hbWUsXG4gICAgcHVyZTogbWV0YS5wdXJlICE9PSB1bmRlZmluZWQgPyBtZXRhLnB1cmUgOiB0cnVlLFxuICAgIGlzU3RhbmRhbG9uZTogISFtZXRhLnN0YW5kYWxvbmUsXG4gIH07XG59XG4iXX0=