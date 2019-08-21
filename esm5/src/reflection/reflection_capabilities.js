/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { Type, isType } from '../interface/type';
import { newArray } from '../util/array_utils';
import { ANNOTATIONS, PARAMETERS, PROP_METADATA } from '../util/decorators';
import { global } from '../util/global';
import { stringify } from '../util/stringify';
/**
 * Attention: These regex has to hold even if the code is minified!
 */
export var DELEGATE_CTOR = /^function\s+\S+\(\)\s*{[\s\S]+\.apply\(this,\s*arguments\)/;
export var INHERITED_CLASS = /^class\s+[A-Za-z\d$_]*\s*extends\s+[^{]+{/;
export var INHERITED_CLASS_WITH_CTOR = /^class\s+[A-Za-z\d$_]*\s*extends\s+[^{]+{[\s\S]*constructor\s*\(/;
export var INHERITED_CLASS_WITH_DELEGATE_CTOR = /^class\s+[A-Za-z\d$_]*\s*extends\s+[^{]+{[\s\S]*constructor\s*\(\)\s*{\s+super\(\.\.\.arguments\)/;
/**
 * Determine whether a stringified type is a class which delegates its constructor
 * to its parent.
 *
 * This is not trivial since compiled code can actually contain a constructor function
 * even if the original source code did not. For instance, when the child class contains
 * an initialized instance property.
 */
export function isDelegateCtor(typeStr) {
    return DELEGATE_CTOR.test(typeStr) || INHERITED_CLASS_WITH_DELEGATE_CTOR.test(typeStr) ||
        (INHERITED_CLASS.test(typeStr) && !INHERITED_CLASS_WITH_CTOR.test(typeStr));
}
var ReflectionCapabilities = /** @class */ (function () {
    function ReflectionCapabilities(reflect) {
        this._reflect = reflect || global['Reflect'];
    }
    ReflectionCapabilities.prototype.isReflectionEnabled = function () { return true; };
    ReflectionCapabilities.prototype.factory = function (t) { return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return new (t.bind.apply(t, tslib_1.__spread([void 0], args)))();
    }; };
    /** @internal */
    ReflectionCapabilities.prototype._zipTypesAndAnnotations = function (paramTypes, paramAnnotations) {
        var result;
        if (typeof paramTypes === 'undefined') {
            result = newArray(paramAnnotations.length);
        }
        else {
            result = newArray(paramTypes.length);
        }
        for (var i = 0; i < result.length; i++) {
            // TS outputs Object for parameters without types, while Traceur omits
            // the annotations. For now we preserve the Traceur behavior to aid
            // migration, but this can be revisited.
            if (typeof paramTypes === 'undefined') {
                result[i] = [];
            }
            else if (paramTypes[i] && paramTypes[i] != Object) {
                result[i] = [paramTypes[i]];
            }
            else {
                result[i] = [];
            }
            if (paramAnnotations && paramAnnotations[i] != null) {
                result[i] = result[i].concat(paramAnnotations[i]);
            }
        }
        return result;
    };
    ReflectionCapabilities.prototype._ownParameters = function (type, parentCtor) {
        var typeStr = type.toString();
        // If we have no decorators, we only have function.length as metadata.
        // In that case, to detect whether a child class declared an own constructor or not,
        // we need to look inside of that constructor to check whether it is
        // just calling the parent.
        // This also helps to work around for https://github.com/Microsoft/TypeScript/issues/12439
        // that sets 'design:paramtypes' to []
        // if a class inherits from another class but has no ctor declared itself.
        if (isDelegateCtor(typeStr)) {
            return null;
        }
        // Prefer the direct API.
        if (type.parameters && type.parameters !== parentCtor.parameters) {
            return type.parameters;
        }
        // API of tsickle for lowering decorators to properties on the class.
        var tsickleCtorParams = type.ctorParameters;
        if (tsickleCtorParams && tsickleCtorParams !== parentCtor.ctorParameters) {
            // Newer tsickle uses a function closure
            // Retain the non-function case for compatibility with older tsickle
            var ctorParameters = typeof tsickleCtorParams === 'function' ? tsickleCtorParams() : tsickleCtorParams;
            var paramTypes_1 = ctorParameters.map(function (ctorParam) { return ctorParam && ctorParam.type; });
            var paramAnnotations_1 = ctorParameters.map(function (ctorParam) {
                return ctorParam && convertTsickleDecoratorIntoMetadata(ctorParam.decorators);
            });
            return this._zipTypesAndAnnotations(paramTypes_1, paramAnnotations_1);
        }
        // API for metadata created by invoking the decorators.
        var paramAnnotations = type.hasOwnProperty(PARAMETERS) && type[PARAMETERS];
        var paramTypes = this._reflect && this._reflect.getOwnMetadata &&
            this._reflect.getOwnMetadata('design:paramtypes', type);
        if (paramTypes || paramAnnotations) {
            return this._zipTypesAndAnnotations(paramTypes, paramAnnotations);
        }
        // If a class has no decorators, at least create metadata
        // based on function.length.
        // Note: We know that this is a real constructor as we checked
        // the content of the constructor above.
        return newArray(type.length);
    };
    ReflectionCapabilities.prototype.parameters = function (type) {
        // Note: only report metadata if we have at least one class decorator
        // to stay in sync with the static reflector.
        if (!isType(type)) {
            return [];
        }
        var parentCtor = getParentCtor(type);
        var parameters = this._ownParameters(type, parentCtor);
        if (!parameters && parentCtor !== Object) {
            parameters = this.parameters(parentCtor);
        }
        return parameters || [];
    };
    ReflectionCapabilities.prototype._ownAnnotations = function (typeOrFunc, parentCtor) {
        // Prefer the direct API.
        if (typeOrFunc.annotations && typeOrFunc.annotations !== parentCtor.annotations) {
            var annotations = typeOrFunc.annotations;
            if (typeof annotations === 'function' && annotations.annotations) {
                annotations = annotations.annotations;
            }
            return annotations;
        }
        // API of tsickle for lowering decorators to properties on the class.
        if (typeOrFunc.decorators && typeOrFunc.decorators !== parentCtor.decorators) {
            return convertTsickleDecoratorIntoMetadata(typeOrFunc.decorators);
        }
        // API for metadata created by invoking the decorators.
        if (typeOrFunc.hasOwnProperty(ANNOTATIONS)) {
            return typeOrFunc[ANNOTATIONS];
        }
        return null;
    };
    ReflectionCapabilities.prototype.annotations = function (typeOrFunc) {
        if (!isType(typeOrFunc)) {
            return [];
        }
        var parentCtor = getParentCtor(typeOrFunc);
        var ownAnnotations = this._ownAnnotations(typeOrFunc, parentCtor) || [];
        var parentAnnotations = parentCtor !== Object ? this.annotations(parentCtor) : [];
        return parentAnnotations.concat(ownAnnotations);
    };
    ReflectionCapabilities.prototype._ownPropMetadata = function (typeOrFunc, parentCtor) {
        // Prefer the direct API.
        if (typeOrFunc.propMetadata &&
            typeOrFunc.propMetadata !== parentCtor.propMetadata) {
            var propMetadata = typeOrFunc.propMetadata;
            if (typeof propMetadata === 'function' && propMetadata.propMetadata) {
                propMetadata = propMetadata.propMetadata;
            }
            return propMetadata;
        }
        // API of tsickle for lowering decorators to properties on the class.
        if (typeOrFunc.propDecorators &&
            typeOrFunc.propDecorators !== parentCtor.propDecorators) {
            var propDecorators_1 = typeOrFunc.propDecorators;
            var propMetadata_1 = {};
            Object.keys(propDecorators_1).forEach(function (prop) {
                propMetadata_1[prop] = convertTsickleDecoratorIntoMetadata(propDecorators_1[prop]);
            });
            return propMetadata_1;
        }
        // API for metadata created by invoking the decorators.
        if (typeOrFunc.hasOwnProperty(PROP_METADATA)) {
            return typeOrFunc[PROP_METADATA];
        }
        return null;
    };
    ReflectionCapabilities.prototype.propMetadata = function (typeOrFunc) {
        if (!isType(typeOrFunc)) {
            return {};
        }
        var parentCtor = getParentCtor(typeOrFunc);
        var propMetadata = {};
        if (parentCtor !== Object) {
            var parentPropMetadata_1 = this.propMetadata(parentCtor);
            Object.keys(parentPropMetadata_1).forEach(function (propName) {
                propMetadata[propName] = parentPropMetadata_1[propName];
            });
        }
        var ownPropMetadata = this._ownPropMetadata(typeOrFunc, parentCtor);
        if (ownPropMetadata) {
            Object.keys(ownPropMetadata).forEach(function (propName) {
                var decorators = [];
                if (propMetadata.hasOwnProperty(propName)) {
                    decorators.push.apply(decorators, tslib_1.__spread(propMetadata[propName]));
                }
                decorators.push.apply(decorators, tslib_1.__spread(ownPropMetadata[propName]));
                propMetadata[propName] = decorators;
            });
        }
        return propMetadata;
    };
    ReflectionCapabilities.prototype.ownPropMetadata = function (typeOrFunc) {
        if (!isType(typeOrFunc)) {
            return {};
        }
        return this._ownPropMetadata(typeOrFunc, getParentCtor(typeOrFunc)) || {};
    };
    ReflectionCapabilities.prototype.hasLifecycleHook = function (type, lcProperty) {
        return type instanceof Type && lcProperty in type.prototype;
    };
    ReflectionCapabilities.prototype.guards = function (type) { return {}; };
    ReflectionCapabilities.prototype.getter = function (name) { return new Function('o', 'return o.' + name + ';'); };
    ReflectionCapabilities.prototype.setter = function (name) {
        return new Function('o', 'v', 'return o.' + name + ' = v;');
    };
    ReflectionCapabilities.prototype.method = function (name) {
        var functionBody = "if (!o." + name + ") throw new Error('\"" + name + "\" is undefined');\n        return o." + name + ".apply(o, args);";
        return new Function('o', 'args', functionBody);
    };
    // There is not a concept of import uri in Js, but this is useful in developing Dart applications.
    ReflectionCapabilities.prototype.importUri = function (type) {
        // StaticSymbol
        if (typeof type === 'object' && type['filePath']) {
            return type['filePath'];
        }
        // Runtime type
        return "./" + stringify(type);
    };
    ReflectionCapabilities.prototype.resourceUri = function (type) { return "./" + stringify(type); };
    ReflectionCapabilities.prototype.resolveIdentifier = function (name, moduleUrl, members, runtime) {
        return runtime;
    };
    ReflectionCapabilities.prototype.resolveEnum = function (enumIdentifier, name) { return enumIdentifier[name]; };
    return ReflectionCapabilities;
}());
export { ReflectionCapabilities };
function convertTsickleDecoratorIntoMetadata(decoratorInvocations) {
    if (!decoratorInvocations) {
        return [];
    }
    return decoratorInvocations.map(function (decoratorInvocation) {
        var decoratorType = decoratorInvocation.type;
        var annotationCls = decoratorType.annotationCls;
        var annotationArgs = decoratorInvocation.args ? decoratorInvocation.args : [];
        return new (annotationCls.bind.apply(annotationCls, tslib_1.__spread([void 0], annotationArgs)))();
    });
}
function getParentCtor(ctor) {
    var parentProto = ctor.prototype ? Object.getPrototypeOf(ctor.prototype) : null;
    var parentCtor = parentProto ? parentProto.constructor : null;
    // Note: We always use `Object` as the null value
    // to simplify checking later on.
    return parentCtor || Object;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdGlvbl9jYXBhYmlsaXRpZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZWZsZWN0aW9uL3JlZmxlY3Rpb25fY2FwYWJpbGl0aWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUM3QyxPQUFPLEVBQUMsV0FBVyxFQUFFLFVBQVUsRUFBRSxhQUFhLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUMxRSxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDdEMsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBTTVDOztHQUVHO0FBQ0gsTUFBTSxDQUFDLElBQU0sYUFBYSxHQUFHLDREQUE0RCxDQUFDO0FBQzFGLE1BQU0sQ0FBQyxJQUFNLGVBQWUsR0FBRywyQ0FBMkMsQ0FBQztBQUMzRSxNQUFNLENBQUMsSUFBTSx5QkFBeUIsR0FDbEMsa0VBQWtFLENBQUM7QUFDdkUsTUFBTSxDQUFDLElBQU0sa0NBQWtDLEdBQzNDLG1HQUFtRyxDQUFDO0FBRXhHOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLFVBQVUsY0FBYyxDQUFDLE9BQWU7SUFDNUMsT0FBTyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLGtDQUFrQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDbEYsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDbEYsQ0FBQztBQUVEO0lBR0UsZ0NBQVksT0FBYTtRQUFJLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxJQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUFDLENBQUM7SUFFNUUsb0RBQW1CLEdBQW5CLGNBQWlDLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztJQUUvQyx3Q0FBTyxHQUFQLFVBQVcsQ0FBVSxJQUF3QixPQUFPO1FBQUMsY0FBYzthQUFkLFVBQWMsRUFBZCxxQkFBYyxFQUFkLElBQWM7WUFBZCx5QkFBYzs7UUFBSyxZQUFJLENBQUMsWUFBRCxDQUFDLDZCQUFJLElBQUk7SUFBYixDQUFjLENBQUMsQ0FBQyxDQUFDO0lBRXpGLGdCQUFnQjtJQUNoQix3REFBdUIsR0FBdkIsVUFBd0IsVUFBaUIsRUFBRSxnQkFBdUI7UUFDaEUsSUFBSSxNQUFlLENBQUM7UUFFcEIsSUFBSSxPQUFPLFVBQVUsS0FBSyxXQUFXLEVBQUU7WUFDckMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUM1QzthQUFNO1lBQ0wsTUFBTSxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDdEM7UUFFRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN0QyxzRUFBc0U7WUFDdEUsbUVBQW1FO1lBQ25FLHdDQUF3QztZQUN4QyxJQUFJLE9BQU8sVUFBVSxLQUFLLFdBQVcsRUFBRTtnQkFDckMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQzthQUNoQjtpQkFBTSxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksTUFBTSxFQUFFO2dCQUNuRCxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUM3QjtpQkFBTTtnQkFDTCxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO2FBQ2hCO1lBQ0QsSUFBSSxnQkFBZ0IsSUFBSSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLEVBQUU7Z0JBQ25ELE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDbkQ7U0FDRjtRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFTywrQ0FBYyxHQUF0QixVQUF1QixJQUFlLEVBQUUsVUFBZTtRQUNyRCxJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDaEMsc0VBQXNFO1FBQ3RFLG9GQUFvRjtRQUNwRixvRUFBb0U7UUFDcEUsMkJBQTJCO1FBQzNCLDBGQUEwRjtRQUMxRixzQ0FBc0M7UUFDdEMsMEVBQTBFO1FBQzFFLElBQUksY0FBYyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQzNCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCx5QkFBeUI7UUFDekIsSUFBVSxJQUFLLENBQUMsVUFBVSxJQUFVLElBQUssQ0FBQyxVQUFVLEtBQUssVUFBVSxDQUFDLFVBQVUsRUFBRTtZQUM5RSxPQUFhLElBQUssQ0FBQyxVQUFVLENBQUM7U0FDL0I7UUFFRCxxRUFBcUU7UUFDckUsSUFBTSxpQkFBaUIsR0FBUyxJQUFLLENBQUMsY0FBYyxDQUFDO1FBQ3JELElBQUksaUJBQWlCLElBQUksaUJBQWlCLEtBQUssVUFBVSxDQUFDLGNBQWMsRUFBRTtZQUN4RSx3Q0FBd0M7WUFDeEMsb0VBQW9FO1lBQ3BFLElBQU0sY0FBYyxHQUNoQixPQUFPLGlCQUFpQixLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUM7WUFDdEYsSUFBTSxZQUFVLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxVQUFDLFNBQWMsSUFBSyxPQUFBLFNBQVMsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUEzQixDQUEyQixDQUFDLENBQUM7WUFDdkYsSUFBTSxrQkFBZ0IsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUN2QyxVQUFDLFNBQWM7Z0JBQ1gsT0FBQSxTQUFTLElBQUksbUNBQW1DLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQztZQUF0RSxDQUFzRSxDQUFDLENBQUM7WUFDaEYsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUMsWUFBVSxFQUFFLGtCQUFnQixDQUFDLENBQUM7U0FDbkU7UUFFRCx1REFBdUQ7UUFDdkQsSUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxJQUFLLElBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN0RixJQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYztZQUM1RCxJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM1RCxJQUFJLFVBQVUsSUFBSSxnQkFBZ0IsRUFBRTtZQUNsQyxPQUFPLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxVQUFVLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztTQUNuRTtRQUVELHlEQUF5RDtRQUN6RCw0QkFBNEI7UUFDNUIsOERBQThEO1FBQzlELHdDQUF3QztRQUN4QyxPQUFPLFFBQVEsQ0FBUSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVELDJDQUFVLEdBQVYsVUFBVyxJQUFlO1FBQ3hCLHFFQUFxRTtRQUNyRSw2Q0FBNkM7UUFDN0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNqQixPQUFPLEVBQUUsQ0FBQztTQUNYO1FBQ0QsSUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZDLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3ZELElBQUksQ0FBQyxVQUFVLElBQUksVUFBVSxLQUFLLE1BQU0sRUFBRTtZQUN4QyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUMxQztRQUNELE9BQU8sVUFBVSxJQUFJLEVBQUUsQ0FBQztJQUMxQixDQUFDO0lBRU8sZ0RBQWUsR0FBdkIsVUFBd0IsVUFBcUIsRUFBRSxVQUFlO1FBQzVELHlCQUF5QjtRQUN6QixJQUFVLFVBQVcsQ0FBQyxXQUFXLElBQVUsVUFBVyxDQUFDLFdBQVcsS0FBSyxVQUFVLENBQUMsV0FBVyxFQUFFO1lBQzdGLElBQUksV0FBVyxHQUFTLFVBQVcsQ0FBQyxXQUFXLENBQUM7WUFDaEQsSUFBSSxPQUFPLFdBQVcsS0FBSyxVQUFVLElBQUksV0FBVyxDQUFDLFdBQVcsRUFBRTtnQkFDaEUsV0FBVyxHQUFHLFdBQVcsQ0FBQyxXQUFXLENBQUM7YUFDdkM7WUFDRCxPQUFPLFdBQVcsQ0FBQztTQUNwQjtRQUVELHFFQUFxRTtRQUNyRSxJQUFVLFVBQVcsQ0FBQyxVQUFVLElBQVUsVUFBVyxDQUFDLFVBQVUsS0FBSyxVQUFVLENBQUMsVUFBVSxFQUFFO1lBQzFGLE9BQU8sbUNBQW1DLENBQU8sVUFBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQzFFO1FBRUQsdURBQXVEO1FBQ3ZELElBQUksVUFBVSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUMxQyxPQUFRLFVBQWtCLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDekM7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCw0Q0FBVyxHQUFYLFVBQVksVUFBcUI7UUFDL0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUN2QixPQUFPLEVBQUUsQ0FBQztTQUNYO1FBQ0QsSUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzdDLElBQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMxRSxJQUFNLGlCQUFpQixHQUFHLFVBQVUsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUNwRixPQUFPLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBRU8saURBQWdCLEdBQXhCLFVBQXlCLFVBQWUsRUFBRSxVQUFlO1FBQ3ZELHlCQUF5QjtRQUN6QixJQUFVLFVBQVcsQ0FBQyxZQUFZO1lBQ3hCLFVBQVcsQ0FBQyxZQUFZLEtBQUssVUFBVSxDQUFDLFlBQVksRUFBRTtZQUM5RCxJQUFJLFlBQVksR0FBUyxVQUFXLENBQUMsWUFBWSxDQUFDO1lBQ2xELElBQUksT0FBTyxZQUFZLEtBQUssVUFBVSxJQUFJLFlBQVksQ0FBQyxZQUFZLEVBQUU7Z0JBQ25FLFlBQVksR0FBRyxZQUFZLENBQUMsWUFBWSxDQUFDO2FBQzFDO1lBQ0QsT0FBTyxZQUFZLENBQUM7U0FDckI7UUFFRCxxRUFBcUU7UUFDckUsSUFBVSxVQUFXLENBQUMsY0FBYztZQUMxQixVQUFXLENBQUMsY0FBYyxLQUFLLFVBQVUsQ0FBQyxjQUFjLEVBQUU7WUFDbEUsSUFBTSxnQkFBYyxHQUFTLFVBQVcsQ0FBQyxjQUFjLENBQUM7WUFDeEQsSUFBTSxjQUFZLEdBQTJCLEVBQUUsQ0FBQztZQUNoRCxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFjLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBQSxJQUFJO2dCQUN0QyxjQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsbUNBQW1DLENBQUMsZ0JBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLENBQUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxjQUFZLENBQUM7U0FDckI7UUFFRCx1REFBdUQ7UUFDdkQsSUFBSSxVQUFVLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxFQUFFO1lBQzVDLE9BQVEsVUFBa0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztTQUMzQztRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELDZDQUFZLEdBQVosVUFBYSxVQUFlO1FBQzFCLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDdkIsT0FBTyxFQUFFLENBQUM7U0FDWDtRQUNELElBQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM3QyxJQUFNLFlBQVksR0FBMkIsRUFBRSxDQUFDO1FBQ2hELElBQUksVUFBVSxLQUFLLE1BQU0sRUFBRTtZQUN6QixJQUFNLG9CQUFrQixHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDekQsTUFBTSxDQUFDLElBQUksQ0FBQyxvQkFBa0IsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFDLFFBQVE7Z0JBQy9DLFlBQVksQ0FBQyxRQUFRLENBQUMsR0FBRyxvQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4RCxDQUFDLENBQUMsQ0FBQztTQUNKO1FBQ0QsSUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUN0RSxJQUFJLGVBQWUsRUFBRTtZQUNuQixNQUFNLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFDLFFBQVE7Z0JBQzVDLElBQU0sVUFBVSxHQUFVLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxZQUFZLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFO29CQUN6QyxVQUFVLENBQUMsSUFBSSxPQUFmLFVBQVUsbUJBQVMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFFO2lCQUM1QztnQkFDRCxVQUFVLENBQUMsSUFBSSxPQUFmLFVBQVUsbUJBQVMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxHQUFFO2dCQUM5QyxZQUFZLENBQUMsUUFBUSxDQUFDLEdBQUcsVUFBVSxDQUFDO1lBQ3RDLENBQUMsQ0FBQyxDQUFDO1NBQ0o7UUFDRCxPQUFPLFlBQVksQ0FBQztJQUN0QixDQUFDO0lBRUQsZ0RBQWUsR0FBZixVQUFnQixVQUFlO1FBQzdCLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDdkIsT0FBTyxFQUFFLENBQUM7U0FDWDtRQUNELE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDNUUsQ0FBQztJQUVELGlEQUFnQixHQUFoQixVQUFpQixJQUFTLEVBQUUsVUFBa0I7UUFDNUMsT0FBTyxJQUFJLFlBQVksSUFBSSxJQUFJLFVBQVUsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQzlELENBQUM7SUFFRCx1Q0FBTSxHQUFOLFVBQU8sSUFBUyxJQUEwQixPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFdEQsdUNBQU0sR0FBTixVQUFPLElBQVksSUFBYyxPQUFpQixJQUFJLFFBQVEsQ0FBQyxHQUFHLEVBQUUsV0FBVyxHQUFHLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFaEcsdUNBQU0sR0FBTixVQUFPLElBQVk7UUFDakIsT0FBaUIsSUFBSSxRQUFRLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxXQUFXLEdBQUcsSUFBSSxHQUFHLE9BQU8sQ0FBQyxDQUFDO0lBQ3hFLENBQUM7SUFFRCx1Q0FBTSxHQUFOLFVBQU8sSUFBWTtRQUNqQixJQUFNLFlBQVksR0FBRyxZQUFVLElBQUksNkJBQXVCLElBQUksNkNBQy9DLElBQUkscUJBQWtCLENBQUM7UUFDdEMsT0FBaUIsSUFBSSxRQUFRLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxZQUFZLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRUQsa0dBQWtHO0lBQ2xHLDBDQUFTLEdBQVQsVUFBVSxJQUFTO1FBQ2pCLGVBQWU7UUFDZixJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDaEQsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDekI7UUFDRCxlQUFlO1FBQ2YsT0FBTyxPQUFLLFNBQVMsQ0FBQyxJQUFJLENBQUcsQ0FBQztJQUNoQyxDQUFDO0lBRUQsNENBQVcsR0FBWCxVQUFZLElBQVMsSUFBWSxPQUFPLE9BQUssU0FBUyxDQUFDLElBQUksQ0FBRyxDQUFDLENBQUMsQ0FBQztJQUVqRSxrREFBaUIsR0FBakIsVUFBa0IsSUFBWSxFQUFFLFNBQWlCLEVBQUUsT0FBaUIsRUFBRSxPQUFZO1FBQ2hGLE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFDRCw0Q0FBVyxHQUFYLFVBQVksY0FBbUIsRUFBRSxJQUFZLElBQVMsT0FBTyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RGLDZCQUFDO0FBQUQsQ0FBQyxBQWxPRCxJQWtPQzs7QUFFRCxTQUFTLG1DQUFtQyxDQUFDLG9CQUEyQjtJQUN0RSxJQUFJLENBQUMsb0JBQW9CLEVBQUU7UUFDekIsT0FBTyxFQUFFLENBQUM7S0FDWDtJQUNELE9BQU8sb0JBQW9CLENBQUMsR0FBRyxDQUFDLFVBQUEsbUJBQW1CO1FBQ2pELElBQU0sYUFBYSxHQUFHLG1CQUFtQixDQUFDLElBQUksQ0FBQztRQUMvQyxJQUFNLGFBQWEsR0FBRyxhQUFhLENBQUMsYUFBYSxDQUFDO1FBQ2xELElBQU0sY0FBYyxHQUFHLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDaEYsWUFBVyxhQUFhLFlBQWIsYUFBYSw2QkFBSSxjQUFjLE1BQUU7SUFDOUMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBUyxhQUFhLENBQUMsSUFBYztJQUNuQyxJQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ2xGLElBQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ2hFLGlEQUFpRDtJQUNqRCxpQ0FBaUM7SUFDakMsT0FBTyxVQUFVLElBQUksTUFBTSxDQUFDO0FBQzlCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZSwgaXNUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge25ld0FycmF5fSBmcm9tICcuLi91dGlsL2FycmF5X3V0aWxzJztcbmltcG9ydCB7QU5OT1RBVElPTlMsIFBBUkFNRVRFUlMsIFBST1BfTUVUQURBVEF9IGZyb20gJy4uL3V0aWwvZGVjb3JhdG9ycyc7XG5pbXBvcnQge2dsb2JhbH0gZnJvbSAnLi4vdXRpbC9nbG9iYWwnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvc3RyaW5naWZ5JztcbmltcG9ydCB7UGxhdGZvcm1SZWZsZWN0aW9uQ2FwYWJpbGl0aWVzfSBmcm9tICcuL3BsYXRmb3JtX3JlZmxlY3Rpb25fY2FwYWJpbGl0aWVzJztcbmltcG9ydCB7R2V0dGVyRm4sIE1ldGhvZEZuLCBTZXR0ZXJGbn0gZnJvbSAnLi90eXBlcyc7XG5cblxuXG4vKipcbiAqIEF0dGVudGlvbjogVGhlc2UgcmVnZXggaGFzIHRvIGhvbGQgZXZlbiBpZiB0aGUgY29kZSBpcyBtaW5pZmllZCFcbiAqL1xuZXhwb3J0IGNvbnN0IERFTEVHQVRFX0NUT1IgPSAvXmZ1bmN0aW9uXFxzK1xcUytcXChcXClcXHMqe1tcXHNcXFNdK1xcLmFwcGx5XFwodGhpcyxcXHMqYXJndW1lbnRzXFwpLztcbmV4cG9ydCBjb25zdCBJTkhFUklURURfQ0xBU1MgPSAvXmNsYXNzXFxzK1tBLVphLXpcXGQkX10qXFxzKmV4dGVuZHNcXHMrW157XSt7LztcbmV4cG9ydCBjb25zdCBJTkhFUklURURfQ0xBU1NfV0lUSF9DVE9SID1cbiAgICAvXmNsYXNzXFxzK1tBLVphLXpcXGQkX10qXFxzKmV4dGVuZHNcXHMrW157XSt7W1xcc1xcU10qY29uc3RydWN0b3JcXHMqXFwoLztcbmV4cG9ydCBjb25zdCBJTkhFUklURURfQ0xBU1NfV0lUSF9ERUxFR0FURV9DVE9SID1cbiAgICAvXmNsYXNzXFxzK1tBLVphLXpcXGQkX10qXFxzKmV4dGVuZHNcXHMrW157XSt7W1xcc1xcU10qY29uc3RydWN0b3JcXHMqXFwoXFwpXFxzKntcXHMrc3VwZXJcXChcXC5cXC5cXC5hcmd1bWVudHNcXCkvO1xuXG4vKipcbiAqIERldGVybWluZSB3aGV0aGVyIGEgc3RyaW5naWZpZWQgdHlwZSBpcyBhIGNsYXNzIHdoaWNoIGRlbGVnYXRlcyBpdHMgY29uc3RydWN0b3JcbiAqIHRvIGl0cyBwYXJlbnQuXG4gKlxuICogVGhpcyBpcyBub3QgdHJpdmlhbCBzaW5jZSBjb21waWxlZCBjb2RlIGNhbiBhY3R1YWxseSBjb250YWluIGEgY29uc3RydWN0b3IgZnVuY3Rpb25cbiAqIGV2ZW4gaWYgdGhlIG9yaWdpbmFsIHNvdXJjZSBjb2RlIGRpZCBub3QuIEZvciBpbnN0YW5jZSwgd2hlbiB0aGUgY2hpbGQgY2xhc3MgY29udGFpbnNcbiAqIGFuIGluaXRpYWxpemVkIGluc3RhbmNlIHByb3BlcnR5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNEZWxlZ2F0ZUN0b3IodHlwZVN0cjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBERUxFR0FURV9DVE9SLnRlc3QodHlwZVN0cikgfHwgSU5IRVJJVEVEX0NMQVNTX1dJVEhfREVMRUdBVEVfQ1RPUi50ZXN0KHR5cGVTdHIpIHx8XG4gICAgICAoSU5IRVJJVEVEX0NMQVNTLnRlc3QodHlwZVN0cikgJiYgIUlOSEVSSVRFRF9DTEFTU19XSVRIX0NUT1IudGVzdCh0eXBlU3RyKSk7XG59XG5cbmV4cG9ydCBjbGFzcyBSZWZsZWN0aW9uQ2FwYWJpbGl0aWVzIGltcGxlbWVudHMgUGxhdGZvcm1SZWZsZWN0aW9uQ2FwYWJpbGl0aWVzIHtcbiAgcHJpdmF0ZSBfcmVmbGVjdDogYW55O1xuXG4gIGNvbnN0cnVjdG9yKHJlZmxlY3Q/OiBhbnkpIHsgdGhpcy5fcmVmbGVjdCA9IHJlZmxlY3QgfHwgZ2xvYmFsWydSZWZsZWN0J107IH1cblxuICBpc1JlZmxlY3Rpb25FbmFibGVkKCk6IGJvb2xlYW4geyByZXR1cm4gdHJ1ZTsgfVxuXG4gIGZhY3Rvcnk8VD4odDogVHlwZTxUPik6IChhcmdzOiBhbnlbXSkgPT4gVCB7IHJldHVybiAoLi4uYXJnczogYW55W10pID0+IG5ldyB0KC4uLmFyZ3MpOyB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfemlwVHlwZXNBbmRBbm5vdGF0aW9ucyhwYXJhbVR5cGVzOiBhbnlbXSwgcGFyYW1Bbm5vdGF0aW9uczogYW55W10pOiBhbnlbXVtdIHtcbiAgICBsZXQgcmVzdWx0OiBhbnlbXVtdO1xuXG4gICAgaWYgKHR5cGVvZiBwYXJhbVR5cGVzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmVzdWx0ID0gbmV3QXJyYXkocGFyYW1Bbm5vdGF0aW9ucy5sZW5ndGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgPSBuZXdBcnJheShwYXJhbVR5cGVzLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZXN1bHQubGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIFRTIG91dHB1dHMgT2JqZWN0IGZvciBwYXJhbWV0ZXJzIHdpdGhvdXQgdHlwZXMsIHdoaWxlIFRyYWNldXIgb21pdHNcbiAgICAgIC8vIHRoZSBhbm5vdGF0aW9ucy4gRm9yIG5vdyB3ZSBwcmVzZXJ2ZSB0aGUgVHJhY2V1ciBiZWhhdmlvciB0byBhaWRcbiAgICAgIC8vIG1pZ3JhdGlvbiwgYnV0IHRoaXMgY2FuIGJlIHJldmlzaXRlZC5cbiAgICAgIGlmICh0eXBlb2YgcGFyYW1UeXBlcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmVzdWx0W2ldID0gW107XG4gICAgICB9IGVsc2UgaWYgKHBhcmFtVHlwZXNbaV0gJiYgcGFyYW1UeXBlc1tpXSAhPSBPYmplY3QpIHtcbiAgICAgICAgcmVzdWx0W2ldID0gW3BhcmFtVHlwZXNbaV1dO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0W2ldID0gW107XG4gICAgICB9XG4gICAgICBpZiAocGFyYW1Bbm5vdGF0aW9ucyAmJiBwYXJhbUFubm90YXRpb25zW2ldICE9IG51bGwpIHtcbiAgICAgICAgcmVzdWx0W2ldID0gcmVzdWx0W2ldLmNvbmNhdChwYXJhbUFubm90YXRpb25zW2ldKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgX293blBhcmFtZXRlcnModHlwZTogVHlwZTxhbnk+LCBwYXJlbnRDdG9yOiBhbnkpOiBhbnlbXVtdfG51bGwge1xuICAgIGNvbnN0IHR5cGVTdHIgPSB0eXBlLnRvU3RyaW5nKCk7XG4gICAgLy8gSWYgd2UgaGF2ZSBubyBkZWNvcmF0b3JzLCB3ZSBvbmx5IGhhdmUgZnVuY3Rpb24ubGVuZ3RoIGFzIG1ldGFkYXRhLlxuICAgIC8vIEluIHRoYXQgY2FzZSwgdG8gZGV0ZWN0IHdoZXRoZXIgYSBjaGlsZCBjbGFzcyBkZWNsYXJlZCBhbiBvd24gY29uc3RydWN0b3Igb3Igbm90LFxuICAgIC8vIHdlIG5lZWQgdG8gbG9vayBpbnNpZGUgb2YgdGhhdCBjb25zdHJ1Y3RvciB0byBjaGVjayB3aGV0aGVyIGl0IGlzXG4gICAgLy8ganVzdCBjYWxsaW5nIHRoZSBwYXJlbnQuXG4gICAgLy8gVGhpcyBhbHNvIGhlbHBzIHRvIHdvcmsgYXJvdW5kIGZvciBodHRwczovL2dpdGh1Yi5jb20vTWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzEyNDM5XG4gICAgLy8gdGhhdCBzZXRzICdkZXNpZ246cGFyYW10eXBlcycgdG8gW11cbiAgICAvLyBpZiBhIGNsYXNzIGluaGVyaXRzIGZyb20gYW5vdGhlciBjbGFzcyBidXQgaGFzIG5vIGN0b3IgZGVjbGFyZWQgaXRzZWxmLlxuICAgIGlmIChpc0RlbGVnYXRlQ3Rvcih0eXBlU3RyKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gUHJlZmVyIHRoZSBkaXJlY3QgQVBJLlxuICAgIGlmICgoPGFueT50eXBlKS5wYXJhbWV0ZXJzICYmICg8YW55PnR5cGUpLnBhcmFtZXRlcnMgIT09IHBhcmVudEN0b3IucGFyYW1ldGVycykge1xuICAgICAgcmV0dXJuICg8YW55PnR5cGUpLnBhcmFtZXRlcnM7XG4gICAgfVxuXG4gICAgLy8gQVBJIG9mIHRzaWNrbGUgZm9yIGxvd2VyaW5nIGRlY29yYXRvcnMgdG8gcHJvcGVydGllcyBvbiB0aGUgY2xhc3MuXG4gICAgY29uc3QgdHNpY2tsZUN0b3JQYXJhbXMgPSAoPGFueT50eXBlKS5jdG9yUGFyYW1ldGVycztcbiAgICBpZiAodHNpY2tsZUN0b3JQYXJhbXMgJiYgdHNpY2tsZUN0b3JQYXJhbXMgIT09IHBhcmVudEN0b3IuY3RvclBhcmFtZXRlcnMpIHtcbiAgICAgIC8vIE5ld2VyIHRzaWNrbGUgdXNlcyBhIGZ1bmN0aW9uIGNsb3N1cmVcbiAgICAgIC8vIFJldGFpbiB0aGUgbm9uLWZ1bmN0aW9uIGNhc2UgZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBvbGRlciB0c2lja2xlXG4gICAgICBjb25zdCBjdG9yUGFyYW1ldGVycyA9XG4gICAgICAgICAgdHlwZW9mIHRzaWNrbGVDdG9yUGFyYW1zID09PSAnZnVuY3Rpb24nID8gdHNpY2tsZUN0b3JQYXJhbXMoKSA6IHRzaWNrbGVDdG9yUGFyYW1zO1xuICAgICAgY29uc3QgcGFyYW1UeXBlcyA9IGN0b3JQYXJhbWV0ZXJzLm1hcCgoY3RvclBhcmFtOiBhbnkpID0+IGN0b3JQYXJhbSAmJiBjdG9yUGFyYW0udHlwZSk7XG4gICAgICBjb25zdCBwYXJhbUFubm90YXRpb25zID0gY3RvclBhcmFtZXRlcnMubWFwKFxuICAgICAgICAgIChjdG9yUGFyYW06IGFueSkgPT5cbiAgICAgICAgICAgICAgY3RvclBhcmFtICYmIGNvbnZlcnRUc2lja2xlRGVjb3JhdG9ySW50b01ldGFkYXRhKGN0b3JQYXJhbS5kZWNvcmF0b3JzKSk7XG4gICAgICByZXR1cm4gdGhpcy5femlwVHlwZXNBbmRBbm5vdGF0aW9ucyhwYXJhbVR5cGVzLCBwYXJhbUFubm90YXRpb25zKTtcbiAgICB9XG5cbiAgICAvLyBBUEkgZm9yIG1ldGFkYXRhIGNyZWF0ZWQgYnkgaW52b2tpbmcgdGhlIGRlY29yYXRvcnMuXG4gICAgY29uc3QgcGFyYW1Bbm5vdGF0aW9ucyA9IHR5cGUuaGFzT3duUHJvcGVydHkoUEFSQU1FVEVSUykgJiYgKHR5cGUgYXMgYW55KVtQQVJBTUVURVJTXTtcbiAgICBjb25zdCBwYXJhbVR5cGVzID0gdGhpcy5fcmVmbGVjdCAmJiB0aGlzLl9yZWZsZWN0LmdldE93bk1ldGFkYXRhICYmXG4gICAgICAgIHRoaXMuX3JlZmxlY3QuZ2V0T3duTWV0YWRhdGEoJ2Rlc2lnbjpwYXJhbXR5cGVzJywgdHlwZSk7XG4gICAgaWYgKHBhcmFtVHlwZXMgfHwgcGFyYW1Bbm5vdGF0aW9ucykge1xuICAgICAgcmV0dXJuIHRoaXMuX3ppcFR5cGVzQW5kQW5ub3RhdGlvbnMocGFyYW1UeXBlcywgcGFyYW1Bbm5vdGF0aW9ucyk7XG4gICAgfVxuXG4gICAgLy8gSWYgYSBjbGFzcyBoYXMgbm8gZGVjb3JhdG9ycywgYXQgbGVhc3QgY3JlYXRlIG1ldGFkYXRhXG4gICAgLy8gYmFzZWQgb24gZnVuY3Rpb24ubGVuZ3RoLlxuICAgIC8vIE5vdGU6IFdlIGtub3cgdGhhdCB0aGlzIGlzIGEgcmVhbCBjb25zdHJ1Y3RvciBhcyB3ZSBjaGVja2VkXG4gICAgLy8gdGhlIGNvbnRlbnQgb2YgdGhlIGNvbnN0cnVjdG9yIGFib3ZlLlxuICAgIHJldHVybiBuZXdBcnJheTxhbnlbXT4odHlwZS5sZW5ndGgpO1xuICB9XG5cbiAgcGFyYW1ldGVycyh0eXBlOiBUeXBlPGFueT4pOiBhbnlbXVtdIHtcbiAgICAvLyBOb3RlOiBvbmx5IHJlcG9ydCBtZXRhZGF0YSBpZiB3ZSBoYXZlIGF0IGxlYXN0IG9uZSBjbGFzcyBkZWNvcmF0b3JcbiAgICAvLyB0byBzdGF5IGluIHN5bmMgd2l0aCB0aGUgc3RhdGljIHJlZmxlY3Rvci5cbiAgICBpZiAoIWlzVHlwZSh0eXBlKSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBjb25zdCBwYXJlbnRDdG9yID0gZ2V0UGFyZW50Q3Rvcih0eXBlKTtcbiAgICBsZXQgcGFyYW1ldGVycyA9IHRoaXMuX293blBhcmFtZXRlcnModHlwZSwgcGFyZW50Q3Rvcik7XG4gICAgaWYgKCFwYXJhbWV0ZXJzICYmIHBhcmVudEN0b3IgIT09IE9iamVjdCkge1xuICAgICAgcGFyYW1ldGVycyA9IHRoaXMucGFyYW1ldGVycyhwYXJlbnRDdG9yKTtcbiAgICB9XG4gICAgcmV0dXJuIHBhcmFtZXRlcnMgfHwgW107XG4gIH1cblxuICBwcml2YXRlIF9vd25Bbm5vdGF0aW9ucyh0eXBlT3JGdW5jOiBUeXBlPGFueT4sIHBhcmVudEN0b3I6IGFueSk6IGFueVtdfG51bGwge1xuICAgIC8vIFByZWZlciB0aGUgZGlyZWN0IEFQSS5cbiAgICBpZiAoKDxhbnk+dHlwZU9yRnVuYykuYW5ub3RhdGlvbnMgJiYgKDxhbnk+dHlwZU9yRnVuYykuYW5ub3RhdGlvbnMgIT09IHBhcmVudEN0b3IuYW5ub3RhdGlvbnMpIHtcbiAgICAgIGxldCBhbm5vdGF0aW9ucyA9ICg8YW55PnR5cGVPckZ1bmMpLmFubm90YXRpb25zO1xuICAgICAgaWYgKHR5cGVvZiBhbm5vdGF0aW9ucyA9PT0gJ2Z1bmN0aW9uJyAmJiBhbm5vdGF0aW9ucy5hbm5vdGF0aW9ucykge1xuICAgICAgICBhbm5vdGF0aW9ucyA9IGFubm90YXRpb25zLmFubm90YXRpb25zO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFubm90YXRpb25zO1xuICAgIH1cblxuICAgIC8vIEFQSSBvZiB0c2lja2xlIGZvciBsb3dlcmluZyBkZWNvcmF0b3JzIHRvIHByb3BlcnRpZXMgb24gdGhlIGNsYXNzLlxuICAgIGlmICgoPGFueT50eXBlT3JGdW5jKS5kZWNvcmF0b3JzICYmICg8YW55PnR5cGVPckZ1bmMpLmRlY29yYXRvcnMgIT09IHBhcmVudEN0b3IuZGVjb3JhdG9ycykge1xuICAgICAgcmV0dXJuIGNvbnZlcnRUc2lja2xlRGVjb3JhdG9ySW50b01ldGFkYXRhKCg8YW55PnR5cGVPckZ1bmMpLmRlY29yYXRvcnMpO1xuICAgIH1cblxuICAgIC8vIEFQSSBmb3IgbWV0YWRhdGEgY3JlYXRlZCBieSBpbnZva2luZyB0aGUgZGVjb3JhdG9ycy5cbiAgICBpZiAodHlwZU9yRnVuYy5oYXNPd25Qcm9wZXJ0eShBTk5PVEFUSU9OUykpIHtcbiAgICAgIHJldHVybiAodHlwZU9yRnVuYyBhcyBhbnkpW0FOTk9UQVRJT05TXTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBhbm5vdGF0aW9ucyh0eXBlT3JGdW5jOiBUeXBlPGFueT4pOiBhbnlbXSB7XG4gICAgaWYgKCFpc1R5cGUodHlwZU9yRnVuYykpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgY29uc3QgcGFyZW50Q3RvciA9IGdldFBhcmVudEN0b3IodHlwZU9yRnVuYyk7XG4gICAgY29uc3Qgb3duQW5ub3RhdGlvbnMgPSB0aGlzLl9vd25Bbm5vdGF0aW9ucyh0eXBlT3JGdW5jLCBwYXJlbnRDdG9yKSB8fCBbXTtcbiAgICBjb25zdCBwYXJlbnRBbm5vdGF0aW9ucyA9IHBhcmVudEN0b3IgIT09IE9iamVjdCA/IHRoaXMuYW5ub3RhdGlvbnMocGFyZW50Q3RvcikgOiBbXTtcbiAgICByZXR1cm4gcGFyZW50QW5ub3RhdGlvbnMuY29uY2F0KG93bkFubm90YXRpb25zKTtcbiAgfVxuXG4gIHByaXZhdGUgX293blByb3BNZXRhZGF0YSh0eXBlT3JGdW5jOiBhbnksIHBhcmVudEN0b3I6IGFueSk6IHtba2V5OiBzdHJpbmddOiBhbnlbXX18bnVsbCB7XG4gICAgLy8gUHJlZmVyIHRoZSBkaXJlY3QgQVBJLlxuICAgIGlmICgoPGFueT50eXBlT3JGdW5jKS5wcm9wTWV0YWRhdGEgJiZcbiAgICAgICAgKDxhbnk+dHlwZU9yRnVuYykucHJvcE1ldGFkYXRhICE9PSBwYXJlbnRDdG9yLnByb3BNZXRhZGF0YSkge1xuICAgICAgbGV0IHByb3BNZXRhZGF0YSA9ICg8YW55PnR5cGVPckZ1bmMpLnByb3BNZXRhZGF0YTtcbiAgICAgIGlmICh0eXBlb2YgcHJvcE1ldGFkYXRhID09PSAnZnVuY3Rpb24nICYmIHByb3BNZXRhZGF0YS5wcm9wTWV0YWRhdGEpIHtcbiAgICAgICAgcHJvcE1ldGFkYXRhID0gcHJvcE1ldGFkYXRhLnByb3BNZXRhZGF0YTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwcm9wTWV0YWRhdGE7XG4gICAgfVxuXG4gICAgLy8gQVBJIG9mIHRzaWNrbGUgZm9yIGxvd2VyaW5nIGRlY29yYXRvcnMgdG8gcHJvcGVydGllcyBvbiB0aGUgY2xhc3MuXG4gICAgaWYgKCg8YW55PnR5cGVPckZ1bmMpLnByb3BEZWNvcmF0b3JzICYmXG4gICAgICAgICg8YW55PnR5cGVPckZ1bmMpLnByb3BEZWNvcmF0b3JzICE9PSBwYXJlbnRDdG9yLnByb3BEZWNvcmF0b3JzKSB7XG4gICAgICBjb25zdCBwcm9wRGVjb3JhdG9ycyA9ICg8YW55PnR5cGVPckZ1bmMpLnByb3BEZWNvcmF0b3JzO1xuICAgICAgY29uc3QgcHJvcE1ldGFkYXRhID0gPHtba2V5OiBzdHJpbmddOiBhbnlbXX0+e307XG4gICAgICBPYmplY3Qua2V5cyhwcm9wRGVjb3JhdG9ycykuZm9yRWFjaChwcm9wID0+IHtcbiAgICAgICAgcHJvcE1ldGFkYXRhW3Byb3BdID0gY29udmVydFRzaWNrbGVEZWNvcmF0b3JJbnRvTWV0YWRhdGEocHJvcERlY29yYXRvcnNbcHJvcF0pO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gcHJvcE1ldGFkYXRhO1xuICAgIH1cblxuICAgIC8vIEFQSSBmb3IgbWV0YWRhdGEgY3JlYXRlZCBieSBpbnZva2luZyB0aGUgZGVjb3JhdG9ycy5cbiAgICBpZiAodHlwZU9yRnVuYy5oYXNPd25Qcm9wZXJ0eShQUk9QX01FVEFEQVRBKSkge1xuICAgICAgcmV0dXJuICh0eXBlT3JGdW5jIGFzIGFueSlbUFJPUF9NRVRBREFUQV07XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJvcE1ldGFkYXRhKHR5cGVPckZ1bmM6IGFueSk6IHtba2V5OiBzdHJpbmddOiBhbnlbXX0ge1xuICAgIGlmICghaXNUeXBlKHR5cGVPckZ1bmMpKSB7XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuICAgIGNvbnN0IHBhcmVudEN0b3IgPSBnZXRQYXJlbnRDdG9yKHR5cGVPckZ1bmMpO1xuICAgIGNvbnN0IHByb3BNZXRhZGF0YToge1trZXk6IHN0cmluZ106IGFueVtdfSA9IHt9O1xuICAgIGlmIChwYXJlbnRDdG9yICE9PSBPYmplY3QpIHtcbiAgICAgIGNvbnN0IHBhcmVudFByb3BNZXRhZGF0YSA9IHRoaXMucHJvcE1ldGFkYXRhKHBhcmVudEN0b3IpO1xuICAgICAgT2JqZWN0LmtleXMocGFyZW50UHJvcE1ldGFkYXRhKS5mb3JFYWNoKChwcm9wTmFtZSkgPT4ge1xuICAgICAgICBwcm9wTWV0YWRhdGFbcHJvcE5hbWVdID0gcGFyZW50UHJvcE1ldGFkYXRhW3Byb3BOYW1lXTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zdCBvd25Qcm9wTWV0YWRhdGEgPSB0aGlzLl9vd25Qcm9wTWV0YWRhdGEodHlwZU9yRnVuYywgcGFyZW50Q3Rvcik7XG4gICAgaWYgKG93blByb3BNZXRhZGF0YSkge1xuICAgICAgT2JqZWN0LmtleXMob3duUHJvcE1ldGFkYXRhKS5mb3JFYWNoKChwcm9wTmFtZSkgPT4ge1xuICAgICAgICBjb25zdCBkZWNvcmF0b3JzOiBhbnlbXSA9IFtdO1xuICAgICAgICBpZiAocHJvcE1ldGFkYXRhLmhhc093blByb3BlcnR5KHByb3BOYW1lKSkge1xuICAgICAgICAgIGRlY29yYXRvcnMucHVzaCguLi5wcm9wTWV0YWRhdGFbcHJvcE5hbWVdKTtcbiAgICAgICAgfVxuICAgICAgICBkZWNvcmF0b3JzLnB1c2goLi4ub3duUHJvcE1ldGFkYXRhW3Byb3BOYW1lXSk7XG4gICAgICAgIHByb3BNZXRhZGF0YVtwcm9wTmFtZV0gPSBkZWNvcmF0b3JzO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBwcm9wTWV0YWRhdGE7XG4gIH1cblxuICBvd25Qcm9wTWV0YWRhdGEodHlwZU9yRnVuYzogYW55KToge1trZXk6IHN0cmluZ106IGFueVtdfSB7XG4gICAgaWYgKCFpc1R5cGUodHlwZU9yRnVuYykpIHtcbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX293blByb3BNZXRhZGF0YSh0eXBlT3JGdW5jLCBnZXRQYXJlbnRDdG9yKHR5cGVPckZ1bmMpKSB8fCB7fTtcbiAgfVxuXG4gIGhhc0xpZmVjeWNsZUhvb2sodHlwZTogYW55LCBsY1Byb3BlcnR5OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHlwZSBpbnN0YW5jZW9mIFR5cGUgJiYgbGNQcm9wZXJ0eSBpbiB0eXBlLnByb3RvdHlwZTtcbiAgfVxuXG4gIGd1YXJkcyh0eXBlOiBhbnkpOiB7W2tleTogc3RyaW5nXTogYW55fSB7IHJldHVybiB7fTsgfVxuXG4gIGdldHRlcihuYW1lOiBzdHJpbmcpOiBHZXR0ZXJGbiB7IHJldHVybiA8R2V0dGVyRm4+bmV3IEZ1bmN0aW9uKCdvJywgJ3JldHVybiBvLicgKyBuYW1lICsgJzsnKTsgfVxuXG4gIHNldHRlcihuYW1lOiBzdHJpbmcpOiBTZXR0ZXJGbiB7XG4gICAgcmV0dXJuIDxTZXR0ZXJGbj5uZXcgRnVuY3Rpb24oJ28nLCAndicsICdyZXR1cm4gby4nICsgbmFtZSArICcgPSB2OycpO1xuICB9XG5cbiAgbWV0aG9kKG5hbWU6IHN0cmluZyk6IE1ldGhvZEZuIHtcbiAgICBjb25zdCBmdW5jdGlvbkJvZHkgPSBgaWYgKCFvLiR7bmFtZX0pIHRocm93IG5ldyBFcnJvcignXCIke25hbWV9XCIgaXMgdW5kZWZpbmVkJyk7XG4gICAgICAgIHJldHVybiBvLiR7bmFtZX0uYXBwbHkobywgYXJncyk7YDtcbiAgICByZXR1cm4gPE1ldGhvZEZuPm5ldyBGdW5jdGlvbignbycsICdhcmdzJywgZnVuY3Rpb25Cb2R5KTtcbiAgfVxuXG4gIC8vIFRoZXJlIGlzIG5vdCBhIGNvbmNlcHQgb2YgaW1wb3J0IHVyaSBpbiBKcywgYnV0IHRoaXMgaXMgdXNlZnVsIGluIGRldmVsb3BpbmcgRGFydCBhcHBsaWNhdGlvbnMuXG4gIGltcG9ydFVyaSh0eXBlOiBhbnkpOiBzdHJpbmcge1xuICAgIC8vIFN0YXRpY1N5bWJvbFxuICAgIGlmICh0eXBlb2YgdHlwZSA9PT0gJ29iamVjdCcgJiYgdHlwZVsnZmlsZVBhdGgnXSkge1xuICAgICAgcmV0dXJuIHR5cGVbJ2ZpbGVQYXRoJ107XG4gICAgfVxuICAgIC8vIFJ1bnRpbWUgdHlwZVxuICAgIHJldHVybiBgLi8ke3N0cmluZ2lmeSh0eXBlKX1gO1xuICB9XG5cbiAgcmVzb3VyY2VVcmkodHlwZTogYW55KTogc3RyaW5nIHsgcmV0dXJuIGAuLyR7c3RyaW5naWZ5KHR5cGUpfWA7IH1cblxuICByZXNvbHZlSWRlbnRpZmllcihuYW1lOiBzdHJpbmcsIG1vZHVsZVVybDogc3RyaW5nLCBtZW1iZXJzOiBzdHJpbmdbXSwgcnVudGltZTogYW55KTogYW55IHtcbiAgICByZXR1cm4gcnVudGltZTtcbiAgfVxuICByZXNvbHZlRW51bShlbnVtSWRlbnRpZmllcjogYW55LCBuYW1lOiBzdHJpbmcpOiBhbnkgeyByZXR1cm4gZW51bUlkZW50aWZpZXJbbmFtZV07IH1cbn1cblxuZnVuY3Rpb24gY29udmVydFRzaWNrbGVEZWNvcmF0b3JJbnRvTWV0YWRhdGEoZGVjb3JhdG9ySW52b2NhdGlvbnM6IGFueVtdKTogYW55W10ge1xuICBpZiAoIWRlY29yYXRvckludm9jYXRpb25zKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIHJldHVybiBkZWNvcmF0b3JJbnZvY2F0aW9ucy5tYXAoZGVjb3JhdG9ySW52b2NhdGlvbiA9PiB7XG4gICAgY29uc3QgZGVjb3JhdG9yVHlwZSA9IGRlY29yYXRvckludm9jYXRpb24udHlwZTtcbiAgICBjb25zdCBhbm5vdGF0aW9uQ2xzID0gZGVjb3JhdG9yVHlwZS5hbm5vdGF0aW9uQ2xzO1xuICAgIGNvbnN0IGFubm90YXRpb25BcmdzID0gZGVjb3JhdG9ySW52b2NhdGlvbi5hcmdzID8gZGVjb3JhdG9ySW52b2NhdGlvbi5hcmdzIDogW107XG4gICAgcmV0dXJuIG5ldyBhbm5vdGF0aW9uQ2xzKC4uLmFubm90YXRpb25BcmdzKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldFBhcmVudEN0b3IoY3RvcjogRnVuY3Rpb24pOiBUeXBlPGFueT4ge1xuICBjb25zdCBwYXJlbnRQcm90byA9IGN0b3IucHJvdG90eXBlID8gT2JqZWN0LmdldFByb3RvdHlwZU9mKGN0b3IucHJvdG90eXBlKSA6IG51bGw7XG4gIGNvbnN0IHBhcmVudEN0b3IgPSBwYXJlbnRQcm90byA/IHBhcmVudFByb3RvLmNvbnN0cnVjdG9yIDogbnVsbDtcbiAgLy8gTm90ZTogV2UgYWx3YXlzIHVzZSBgT2JqZWN0YCBhcyB0aGUgbnVsbCB2YWx1ZVxuICAvLyB0byBzaW1wbGlmeSBjaGVja2luZyBsYXRlciBvbi5cbiAgcmV0dXJuIHBhcmVudEN0b3IgfHwgT2JqZWN0O1xufVxuIl19