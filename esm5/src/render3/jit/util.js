/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { LiteralExpr, R3ResolvedDependencyType, WrappedNodeExpr } from '@angular/compiler';
import { Injector } from '../../di/injector';
import { Host, Inject, Optional, Self, SkipSelf } from '../../di/metadata';
import { ElementRef } from '../../linker/element_ref';
import { TemplateRef } from '../../linker/template_ref';
import { ViewContainerRef } from '../../linker/view_container_ref';
import { Attribute } from '../../metadata/di';
import { ReflectionCapabilities } from '../../reflection/reflection_capabilities';
var _reflect = null;
export function reflectDependencies(type) {
    _reflect = _reflect || new ReflectionCapabilities();
    return convertDependencies(_reflect.parameters(type));
}
export function convertDependencies(deps) {
    return deps.map(function (dep) { return reflectDependency(dep); });
}
function reflectDependency(dep) {
    var meta = {
        token: new LiteralExpr(null),
        host: false,
        optional: false,
        resolved: R3ResolvedDependencyType.Token,
        self: false,
        skipSelf: false,
    };
    function setTokenAndResolvedType(token) {
        if (token === ElementRef) {
            meta.resolved = R3ResolvedDependencyType.ElementRef;
        }
        else if (token === Injector) {
            meta.resolved = R3ResolvedDependencyType.Injector;
        }
        else if (token === TemplateRef) {
            meta.resolved = R3ResolvedDependencyType.TemplateRef;
        }
        else if (token === ViewContainerRef) {
            meta.resolved = R3ResolvedDependencyType.ViewContainerRef;
        }
        else {
            meta.resolved = R3ResolvedDependencyType.Token;
        }
        meta.token = new WrappedNodeExpr(token);
    }
    if (Array.isArray(dep)) {
        if (dep.length === 0) {
            throw new Error('Dependency array must have arguments.');
        }
        for (var j = 0; j < dep.length; j++) {
            var param = dep[j];
            if (param instanceof Optional || param.__proto__.ngMetadataName === 'Optional') {
                meta.optional = true;
            }
            else if (param instanceof SkipSelf || param.__proto__.ngMetadataName === 'SkipSelf') {
                meta.skipSelf = true;
            }
            else if (param instanceof Self || param.__proto__.ngMetadataName === 'Self') {
                meta.self = true;
            }
            else if (param instanceof Host || param.__proto__.ngMetadataName === 'Host') {
                meta.host = true;
            }
            else if (param instanceof Inject) {
                meta.token = new WrappedNodeExpr(param.token);
            }
            else if (param instanceof Attribute) {
                if (param.attributeName === undefined) {
                    throw new Error("Attribute name must be defined.");
                }
                meta.token = new LiteralExpr(param.attributeName);
                meta.resolved = R3ResolvedDependencyType.Attribute;
            }
            else {
                setTokenAndResolvedType(param);
            }
        }
    }
    else {
        setTokenAndResolvedType(dep);
    }
    return meta;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQVFBLE9BQU8sRUFBQyxXQUFXLEVBQXdCLHdCQUF3QixFQUFFLGVBQWUsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRS9HLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUMzQyxPQUFPLEVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3pFLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDdEQsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDakUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzVDLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLDBDQUEwQyxDQUFDO0FBR2hGLElBQUksUUFBUSxHQUFnQyxJQUFJLENBQUM7QUFFakQsTUFBTSw4QkFBOEIsSUFBZTtJQUNqRCxRQUFRLEdBQUcsUUFBUSxJQUFJLElBQUksc0JBQXNCLEVBQUUsQ0FBQztJQUNwRCxPQUFPLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztDQUN2RDtBQUVELE1BQU0sOEJBQThCLElBQVc7SUFDN0MsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQUEsR0FBRyxJQUFJLE9BQUEsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEVBQXRCLENBQXNCLENBQUMsQ0FBQztDQUNoRDtBQUVELDJCQUEyQixHQUFnQjtJQUN6QyxJQUFNLElBQUks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QyxDQUFDO0tBQzlCO0lBQ0QsT0FBTyxJQUFJLENBQUM7Q0FDYiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtMaXRlcmFsRXhwciwgUjNEZXBlbmRlbmN5TWV0YWRhdGEsIFIzUmVzb2x2ZWREZXBlbmRlbmN5VHlwZSwgV3JhcHBlZE5vZGVFeHByfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uLy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7SG9zdCwgSW5qZWN0LCBPcHRpb25hbCwgU2VsZiwgU2tpcFNlbGZ9IGZyb20gJy4uLy4uL2RpL21ldGFkYXRhJztcbmltcG9ydCB7RWxlbWVudFJlZn0gZnJvbSAnLi4vLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7VGVtcGxhdGVSZWZ9IGZyb20gJy4uLy4uL2xpbmtlci90ZW1wbGF0ZV9yZWYnO1xuaW1wb3J0IHtWaWV3Q29udGFpbmVyUmVmfSBmcm9tICcuLi8uLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7QXR0cmlidXRlfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9kaSc7XG5pbXBvcnQge1JlZmxlY3Rpb25DYXBhYmlsaXRpZXN9IGZyb20gJy4uLy4uL3JlZmxlY3Rpb24vcmVmbGVjdGlvbl9jYXBhYmlsaXRpZXMnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi90eXBlJztcblxubGV0IF9yZWZsZWN0OiBSZWZsZWN0aW9uQ2FwYWJpbGl0aWVzfG51bGwgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVmbGVjdERlcGVuZGVuY2llcyh0eXBlOiBUeXBlPGFueT4pOiBSM0RlcGVuZGVuY3lNZXRhZGF0YVtdIHtcbiAgX3JlZmxlY3QgPSBfcmVmbGVjdCB8fCBuZXcgUmVmbGVjdGlvbkNhcGFiaWxpdGllcygpO1xuICByZXR1cm4gY29udmVydERlcGVuZGVuY2llcyhfcmVmbGVjdC5wYXJhbWV0ZXJzKHR5cGUpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnREZXBlbmRlbmNpZXMoZGVwczogYW55W10pOiBSM0RlcGVuZGVuY3lNZXRhZGF0YVtdIHtcbiAgcmV0dXJuIGRlcHMubWFwKGRlcCA9PiByZWZsZWN0RGVwZW5kZW5jeShkZXApKTtcbn1cblxuZnVuY3Rpb24gcmVmbGVjdERlcGVuZGVuY3koZGVwOiBhbnkgfCBhbnlbXSk6IFIzRGVwZW5kZW5jeU1ldGFkYXRhIHtcbiAgY29uc3QgbWV0YTogUjNEZXBlbmRlbmN5TWV0YWRhdGEgPSB7XG4gICAgdG9rZW46IG5ldyBMaXRlcmFsRXhwcihudWxsKSxcbiAgICBob3N0OiBmYWxzZSxcbiAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgcmVzb2x2ZWQ6IFIzUmVzb2x2ZWREZXBlbmRlbmN5VHlwZS5Ub2tlbixcbiAgICBzZWxmOiBmYWxzZSxcbiAgICBza2lwU2VsZjogZmFsc2UsXG4gIH07XG5cbiAgZnVuY3Rpb24gc2V0VG9rZW5BbmRSZXNvbHZlZFR5cGUodG9rZW46IGFueSk6IHZvaWQge1xuICAgIGlmICh0b2tlbiA9PT0gRWxlbWVudFJlZikge1xuICAgICAgbWV0YS5yZXNvbHZlZCA9IFIzUmVzb2x2ZWREZXBlbmRlbmN5VHlwZS5FbGVtZW50UmVmO1xuICAgIH0gZWxzZSBpZiAodG9rZW4gPT09IEluamVjdG9yKSB7XG4gICAgICBtZXRhLnJlc29sdmVkID0gUjNSZXNvbHZlZERlcGVuZGVuY3lUeXBlLkluamVjdG9yO1xuICAgIH0gZWxzZSBpZiAodG9rZW4gPT09IFRlbXBsYXRlUmVmKSB7XG4gICAgICBtZXRhLnJlc29sdmVkID0gUjNSZXNvbHZlZERlcGVuZGVuY3lUeXBlLlRlbXBsYXRlUmVmO1xuICAgIH0gZWxzZSBpZiAodG9rZW4gPT09IFZpZXdDb250YWluZXJSZWYpIHtcbiAgICAgIG1ldGEucmVzb2x2ZWQgPSBSM1Jlc29sdmVkRGVwZW5kZW5jeVR5cGUuVmlld0NvbnRhaW5lclJlZjtcbiAgICB9IGVsc2Uge1xuICAgICAgbWV0YS5yZXNvbHZlZCA9IFIzUmVzb2x2ZWREZXBlbmRlbmN5VHlwZS5Ub2tlbjtcbiAgICB9XG4gICAgbWV0YS50b2tlbiA9IG5ldyBXcmFwcGVkTm9kZUV4cHIodG9rZW4pO1xuICB9XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoZGVwKSkge1xuICAgIGlmIChkZXAubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RlcGVuZGVuY3kgYXJyYXkgbXVzdCBoYXZlIGFyZ3VtZW50cy4nKTtcbiAgICB9XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBkZXAubGVuZ3RoOyBqKyspIHtcbiAgICAgIGNvbnN0IHBhcmFtID0gZGVwW2pdO1xuICAgICAgaWYgKHBhcmFtIGluc3RhbmNlb2YgT3B0aW9uYWwgfHwgcGFyYW0uX19wcm90b19fLm5nTWV0YWRhdGFOYW1lID09PSAnT3B0aW9uYWwnKSB7XG4gICAgICAgIG1ldGEub3B0aW9uYWwgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChwYXJhbSBpbnN0YW5jZW9mIFNraXBTZWxmIHx8IHBhcmFtLl9fcHJvdG9fXy5uZ01ldGFkYXRhTmFtZSA9PT0gJ1NraXBTZWxmJykge1xuICAgICAgICBtZXRhLnNraXBTZWxmID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAocGFyYW0gaW5zdGFuY2VvZiBTZWxmIHx8IHBhcmFtLl9fcHJvdG9fXy5uZ01ldGFkYXRhTmFtZSA9PT0gJ1NlbGYnKSB7XG4gICAgICAgIG1ldGEuc2VsZiA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKHBhcmFtIGluc3RhbmNlb2YgSG9zdCB8fCBwYXJhbS5fX3Byb3RvX18ubmdNZXRhZGF0YU5hbWUgPT09ICdIb3N0Jykge1xuICAgICAgICBtZXRhLmhvc3QgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChwYXJhbSBpbnN0YW5jZW9mIEluamVjdCkge1xuICAgICAgICBtZXRhLnRva2VuID0gbmV3IFdyYXBwZWROb2RlRXhwcihwYXJhbS50b2tlbik7XG4gICAgICB9IGVsc2UgaWYgKHBhcmFtIGluc3RhbmNlb2YgQXR0cmlidXRlKSB7XG4gICAgICAgIGlmIChwYXJhbS5hdHRyaWJ1dGVOYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEF0dHJpYnV0ZSBuYW1lIG11c3QgYmUgZGVmaW5lZC5gKTtcbiAgICAgICAgfVxuICAgICAgICBtZXRhLnRva2VuID0gbmV3IExpdGVyYWxFeHByKHBhcmFtLmF0dHJpYnV0ZU5hbWUpO1xuICAgICAgICBtZXRhLnJlc29sdmVkID0gUjNSZXNvbHZlZERlcGVuZGVuY3lUeXBlLkF0dHJpYnV0ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFRva2VuQW5kUmVzb2x2ZWRUeXBlKHBhcmFtKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgc2V0VG9rZW5BbmRSZXNvbHZlZFR5cGUoZGVwKTtcbiAgfVxuICByZXR1cm4gbWV0YTtcbn1cbiJdfQ==