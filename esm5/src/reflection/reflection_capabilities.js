/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { Type, isType } from '../interface/type';
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
            result = new Array(paramAnnotations.length);
        }
        else {
            result = new Array(paramTypes.length);
        }
        for (var i = 0; i < result.length; i++) {
            // TS outputs Object for parameters without types, while Traceur omits
            // the annotations. For now we preserve the Traceur behavior to aid
            // migration, but this can be revisited.
            if (typeof paramTypes === 'undefined') {
                result[i] = [];
            }
            else if (paramTypes[i] != Object) {
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
        return new Array(type.length).fill(undefined);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdGlvbl9jYXBhYmlsaXRpZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZWZsZWN0aW9uL3JlZmxlY3Rpb25fY2FwYWJpbGl0aWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxXQUFXLEVBQUUsVUFBVSxFQUFFLGFBQWEsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQzFFLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN0QyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFPNUM7O0dBRUc7QUFDSCxNQUFNLENBQUMsSUFBTSxhQUFhLEdBQUcsNERBQTRELENBQUM7QUFDMUYsTUFBTSxDQUFDLElBQU0sZUFBZSxHQUFHLDJDQUEyQyxDQUFDO0FBQzNFLE1BQU0sQ0FBQyxJQUFNLHlCQUF5QixHQUNsQyxrRUFBa0UsQ0FBQztBQUN2RSxNQUFNLENBQUMsSUFBTSxrQ0FBa0MsR0FDM0MsbUdBQW1HLENBQUM7QUFFeEc7Ozs7Ozs7R0FPRztBQUNILE1BQU0sVUFBVSxjQUFjLENBQUMsT0FBZTtJQUM1QyxPQUFPLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksa0NBQWtDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNsRixDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNsRixDQUFDO0FBRUQ7SUFHRSxnQ0FBWSxPQUFhO1FBQUksSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQUMsQ0FBQztJQUU1RSxvREFBbUIsR0FBbkIsY0FBaUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBRS9DLHdDQUFPLEdBQVAsVUFBVyxDQUFVLElBQXdCLE9BQU87UUFBQyxjQUFjO2FBQWQsVUFBYyxFQUFkLHFCQUFjLEVBQWQsSUFBYztZQUFkLHlCQUFjOztRQUFLLFlBQUksQ0FBQyxZQUFELENBQUMsNkJBQUksSUFBSTtJQUFiLENBQWMsQ0FBQyxDQUFDLENBQUM7SUFFekYsZ0JBQWdCO0lBQ2hCLHdEQUF1QixHQUF2QixVQUF3QixVQUFpQixFQUFFLGdCQUF1QjtRQUNoRSxJQUFJLE1BQWUsQ0FBQztRQUVwQixJQUFJLE9BQU8sVUFBVSxLQUFLLFdBQVcsRUFBRTtZQUNyQyxNQUFNLEdBQUcsSUFBSSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDN0M7YUFBTTtZQUNMLE1BQU0sR0FBRyxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDdkM7UUFFRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN0QyxzRUFBc0U7WUFDdEUsbUVBQW1FO1lBQ25FLHdDQUF3QztZQUN4QyxJQUFJLE9BQU8sVUFBVSxLQUFLLFdBQVcsRUFBRTtnQkFDckMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQzthQUNoQjtpQkFBTSxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxNQUFNLEVBQUU7Z0JBQ2xDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQzdCO2lCQUFNO2dCQUNMLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7YUFDaEI7WUFDRCxJQUFJLGdCQUFnQixJQUFJLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksRUFBRTtnQkFDbkQsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNuRDtTQUNGO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVPLCtDQUFjLEdBQXRCLFVBQXVCLElBQWUsRUFBRSxVQUFlO1FBQ3JELElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNoQyxzRUFBc0U7UUFDdEUsb0ZBQW9GO1FBQ3BGLG9FQUFvRTtRQUNwRSwyQkFBMkI7UUFDM0IsMEZBQTBGO1FBQzFGLHNDQUFzQztRQUN0QywwRUFBMEU7UUFDMUUsSUFBSSxjQUFjLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDM0IsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELHlCQUF5QjtRQUN6QixJQUFVLElBQUssQ0FBQyxVQUFVLElBQVUsSUFBSyxDQUFDLFVBQVUsS0FBSyxVQUFVLENBQUMsVUFBVSxFQUFFO1lBQzlFLE9BQWEsSUFBSyxDQUFDLFVBQVUsQ0FBQztTQUMvQjtRQUVELHFFQUFxRTtRQUNyRSxJQUFNLGlCQUFpQixHQUFTLElBQUssQ0FBQyxjQUFjLENBQUM7UUFDckQsSUFBSSxpQkFBaUIsSUFBSSxpQkFBaUIsS0FBSyxVQUFVLENBQUMsY0FBYyxFQUFFO1lBQ3hFLHdDQUF3QztZQUN4QyxvRUFBb0U7WUFDcEUsSUFBTSxjQUFjLEdBQ2hCLE9BQU8saUJBQWlCLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQztZQUN0RixJQUFNLFlBQVUsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLFVBQUMsU0FBYyxJQUFLLE9BQUEsU0FBUyxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQTNCLENBQTJCLENBQUMsQ0FBQztZQUN2RixJQUFNLGtCQUFnQixHQUFHLGNBQWMsQ0FBQyxHQUFHLENBQ3ZDLFVBQUMsU0FBYztnQkFDWCxPQUFBLFNBQVMsSUFBSSxtQ0FBbUMsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDO1lBQXRFLENBQXNFLENBQUMsQ0FBQztZQUNoRixPQUFPLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxZQUFVLEVBQUUsa0JBQWdCLENBQUMsQ0FBQztTQUNuRTtRQUVELHVEQUF1RDtRQUN2RCxJQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLElBQUssSUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3RGLElBQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjO1lBQzVELElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzVELElBQUksVUFBVSxJQUFJLGdCQUFnQixFQUFFO1lBQ2xDLE9BQU8sSUFBSSxDQUFDLHVCQUF1QixDQUFDLFVBQVUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1NBQ25FO1FBRUQseURBQXlEO1FBQ3pELDRCQUE0QjtRQUM1Qiw4REFBOEQ7UUFDOUQsd0NBQXdDO1FBQ3hDLE9BQU8sSUFBSSxLQUFLLENBQU8sSUFBSSxDQUFDLE1BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBRUQsMkNBQVUsR0FBVixVQUFXLElBQWU7UUFDeEIscUVBQXFFO1FBQ3JFLDZDQUE2QztRQUM3QyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ2pCLE9BQU8sRUFBRSxDQUFDO1NBQ1g7UUFDRCxJQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkMsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDdkQsSUFBSSxDQUFDLFVBQVUsSUFBSSxVQUFVLEtBQUssTUFBTSxFQUFFO1lBQ3hDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQzFDO1FBQ0QsT0FBTyxVQUFVLElBQUksRUFBRSxDQUFDO0lBQzFCLENBQUM7SUFFTyxnREFBZSxHQUF2QixVQUF3QixVQUFxQixFQUFFLFVBQWU7UUFDNUQseUJBQXlCO1FBQ3pCLElBQVUsVUFBVyxDQUFDLFdBQVcsSUFBVSxVQUFXLENBQUMsV0FBVyxLQUFLLFVBQVUsQ0FBQyxXQUFXLEVBQUU7WUFDN0YsSUFBSSxXQUFXLEdBQVMsVUFBVyxDQUFDLFdBQVcsQ0FBQztZQUNoRCxJQUFJLE9BQU8sV0FBVyxLQUFLLFVBQVUsSUFBSSxXQUFXLENBQUMsV0FBVyxFQUFFO2dCQUNoRSxXQUFXLEdBQUcsV0FBVyxDQUFDLFdBQVcsQ0FBQzthQUN2QztZQUNELE9BQU8sV0FBVyxDQUFDO1NBQ3BCO1FBRUQscUVBQXFFO1FBQ3JFLElBQVUsVUFBVyxDQUFDLFVBQVUsSUFBVSxVQUFXLENBQUMsVUFBVSxLQUFLLFVBQVUsQ0FBQyxVQUFVLEVBQUU7WUFDMUYsT0FBTyxtQ0FBbUMsQ0FBTyxVQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDMUU7UUFFRCx1REFBdUQ7UUFDdkQsSUFBSSxVQUFVLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQzFDLE9BQVEsVUFBa0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUN6QztRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELDRDQUFXLEdBQVgsVUFBWSxVQUFxQjtRQUMvQixJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ3ZCLE9BQU8sRUFBRSxDQUFDO1NBQ1g7UUFDRCxJQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDN0MsSUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzFFLElBQU0saUJBQWlCLEdBQUcsVUFBVSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ3BGLE9BQU8saUJBQWlCLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFFTyxpREFBZ0IsR0FBeEIsVUFBeUIsVUFBZSxFQUFFLFVBQWU7UUFDdkQseUJBQXlCO1FBQ3pCLElBQVUsVUFBVyxDQUFDLFlBQVk7WUFDeEIsVUFBVyxDQUFDLFlBQVksS0FBSyxVQUFVLENBQUMsWUFBWSxFQUFFO1lBQzlELElBQUksWUFBWSxHQUFTLFVBQVcsQ0FBQyxZQUFZLENBQUM7WUFDbEQsSUFBSSxPQUFPLFlBQVksS0FBSyxVQUFVLElBQUksWUFBWSxDQUFDLFlBQVksRUFBRTtnQkFDbkUsWUFBWSxHQUFHLFlBQVksQ0FBQyxZQUFZLENBQUM7YUFDMUM7WUFDRCxPQUFPLFlBQVksQ0FBQztTQUNyQjtRQUVELHFFQUFxRTtRQUNyRSxJQUFVLFVBQVcsQ0FBQyxjQUFjO1lBQzFCLFVBQVcsQ0FBQyxjQUFjLEtBQUssVUFBVSxDQUFDLGNBQWMsRUFBRTtZQUNsRSxJQUFNLGdCQUFjLEdBQVMsVUFBVyxDQUFDLGNBQWMsQ0FBQztZQUN4RCxJQUFNLGNBQVksR0FBMkIsRUFBRSxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFBLElBQUk7Z0JBQ3RDLGNBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxtQ0FBbUMsQ0FBQyxnQkFBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDakYsQ0FBQyxDQUFDLENBQUM7WUFDSCxPQUFPLGNBQVksQ0FBQztTQUNyQjtRQUVELHVEQUF1RDtRQUN2RCxJQUFJLFVBQVUsQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLEVBQUU7WUFDNUMsT0FBUSxVQUFrQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1NBQzNDO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsNkNBQVksR0FBWixVQUFhLFVBQWU7UUFDMUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUN2QixPQUFPLEVBQUUsQ0FBQztTQUNYO1FBQ0QsSUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzdDLElBQU0sWUFBWSxHQUEyQixFQUFFLENBQUM7UUFDaEQsSUFBSSxVQUFVLEtBQUssTUFBTSxFQUFFO1lBQ3pCLElBQU0sb0JBQWtCLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN6RCxNQUFNLENBQUMsSUFBSSxDQUFDLG9CQUFrQixDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUMsUUFBUTtnQkFDL0MsWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFHLG9CQUFrQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hELENBQUMsQ0FBQyxDQUFDO1NBQ0o7UUFDRCxJQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3RFLElBQUksZUFBZSxFQUFFO1lBQ25CLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUMsUUFBUTtnQkFDNUMsSUFBTSxVQUFVLEdBQVUsRUFBRSxDQUFDO2dCQUM3QixJQUFJLFlBQVksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLEVBQUU7b0JBQ3pDLFVBQVUsQ0FBQyxJQUFJLE9BQWYsVUFBVSxtQkFBUyxZQUFZLENBQUMsUUFBUSxDQUFDLEdBQUU7aUJBQzVDO2dCQUNELFVBQVUsQ0FBQyxJQUFJLE9BQWYsVUFBVSxtQkFBUyxlQUFlLENBQUMsUUFBUSxDQUFDLEdBQUU7Z0JBQzlDLFlBQVksQ0FBQyxRQUFRLENBQUMsR0FBRyxVQUFVLENBQUM7WUFDdEMsQ0FBQyxDQUFDLENBQUM7U0FDSjtRQUNELE9BQU8sWUFBWSxDQUFDO0lBQ3RCLENBQUM7SUFFRCxnREFBZSxHQUFmLFVBQWdCLFVBQWU7UUFDN0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUN2QixPQUFPLEVBQUUsQ0FBQztTQUNYO1FBQ0QsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUM1RSxDQUFDO0lBRUQsaURBQWdCLEdBQWhCLFVBQWlCLElBQVMsRUFBRSxVQUFrQjtRQUM1QyxPQUFPLElBQUksWUFBWSxJQUFJLElBQUksVUFBVSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDOUQsQ0FBQztJQUVELHVDQUFNLEdBQU4sVUFBTyxJQUFTLElBQTBCLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztJQUV0RCx1Q0FBTSxHQUFOLFVBQU8sSUFBWSxJQUFjLE9BQWlCLElBQUksUUFBUSxDQUFDLEdBQUcsRUFBRSxXQUFXLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVoRyx1Q0FBTSxHQUFOLFVBQU8sSUFBWTtRQUNqQixPQUFpQixJQUFJLFFBQVEsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLFdBQVcsR0FBRyxJQUFJLEdBQUcsT0FBTyxDQUFDLENBQUM7SUFDeEUsQ0FBQztJQUVELHVDQUFNLEdBQU4sVUFBTyxJQUFZO1FBQ2pCLElBQU0sWUFBWSxHQUFHLFlBQVUsSUFBSSw2QkFBdUIsSUFBSSw2Q0FDL0MsSUFBSSxxQkFBa0IsQ0FBQztRQUN0QyxPQUFpQixJQUFJLFFBQVEsQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQzNELENBQUM7SUFFRCxrR0FBa0c7SUFDbEcsMENBQVMsR0FBVCxVQUFVLElBQVM7UUFDakIsZUFBZTtRQUNmLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUNoRCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUN6QjtRQUNELGVBQWU7UUFDZixPQUFPLE9BQUssU0FBUyxDQUFDLElBQUksQ0FBRyxDQUFDO0lBQ2hDLENBQUM7SUFFRCw0Q0FBVyxHQUFYLFVBQVksSUFBUyxJQUFZLE9BQU8sT0FBSyxTQUFTLENBQUMsSUFBSSxDQUFHLENBQUMsQ0FBQyxDQUFDO0lBRWpFLGtEQUFpQixHQUFqQixVQUFrQixJQUFZLEVBQUUsU0FBaUIsRUFBRSxPQUFpQixFQUFFLE9BQVk7UUFDaEYsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQUNELDRDQUFXLEdBQVgsVUFBWSxjQUFtQixFQUFFLElBQVksSUFBUyxPQUFPLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEYsNkJBQUM7QUFBRCxDQUFDLEFBbE9ELElBa09DOztBQUVELFNBQVMsbUNBQW1DLENBQUMsb0JBQTJCO0lBQ3RFLElBQUksQ0FBQyxvQkFBb0IsRUFBRTtRQUN6QixPQUFPLEVBQUUsQ0FBQztLQUNYO0lBQ0QsT0FBTyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsVUFBQSxtQkFBbUI7UUFDakQsSUFBTSxhQUFhLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxDQUFDO1FBQy9DLElBQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxhQUFhLENBQUM7UUFDbEQsSUFBTSxjQUFjLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUNoRixZQUFXLGFBQWEsWUFBYixhQUFhLDZCQUFJLGNBQWMsTUFBRTtJQUM5QyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxTQUFTLGFBQWEsQ0FBQyxJQUFjO0lBQ25DLElBQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDbEYsSUFBTSxVQUFVLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDaEUsaURBQWlEO0lBQ2pELGlDQUFpQztJQUNqQyxPQUFPLFVBQVUsSUFBSSxNQUFNLENBQUM7QUFDOUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUeXBlLCBpc1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7QU5OT1RBVElPTlMsIFBBUkFNRVRFUlMsIFBST1BfTUVUQURBVEF9IGZyb20gJy4uL3V0aWwvZGVjb3JhdG9ycyc7XG5pbXBvcnQge2dsb2JhbH0gZnJvbSAnLi4vdXRpbC9nbG9iYWwnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvc3RyaW5naWZ5JztcblxuaW1wb3J0IHtQbGF0Zm9ybVJlZmxlY3Rpb25DYXBhYmlsaXRpZXN9IGZyb20gJy4vcGxhdGZvcm1fcmVmbGVjdGlvbl9jYXBhYmlsaXRpZXMnO1xuaW1wb3J0IHtHZXR0ZXJGbiwgTWV0aG9kRm4sIFNldHRlckZufSBmcm9tICcuL3R5cGVzJztcblxuXG5cbi8qKlxuICogQXR0ZW50aW9uOiBUaGVzZSByZWdleCBoYXMgdG8gaG9sZCBldmVuIGlmIHRoZSBjb2RlIGlzIG1pbmlmaWVkIVxuICovXG5leHBvcnQgY29uc3QgREVMRUdBVEVfQ1RPUiA9IC9eZnVuY3Rpb25cXHMrXFxTK1xcKFxcKVxccyp7W1xcc1xcU10rXFwuYXBwbHlcXCh0aGlzLFxccyphcmd1bWVudHNcXCkvO1xuZXhwb3J0IGNvbnN0IElOSEVSSVRFRF9DTEFTUyA9IC9eY2xhc3NcXHMrW0EtWmEtelxcZCRfXSpcXHMqZXh0ZW5kc1xccytbXntdK3svO1xuZXhwb3J0IGNvbnN0IElOSEVSSVRFRF9DTEFTU19XSVRIX0NUT1IgPVxuICAgIC9eY2xhc3NcXHMrW0EtWmEtelxcZCRfXSpcXHMqZXh0ZW5kc1xccytbXntdK3tbXFxzXFxTXSpjb25zdHJ1Y3RvclxccypcXCgvO1xuZXhwb3J0IGNvbnN0IElOSEVSSVRFRF9DTEFTU19XSVRIX0RFTEVHQVRFX0NUT1IgPVxuICAgIC9eY2xhc3NcXHMrW0EtWmEtelxcZCRfXSpcXHMqZXh0ZW5kc1xccytbXntdK3tbXFxzXFxTXSpjb25zdHJ1Y3RvclxccypcXChcXClcXHMqe1xccytzdXBlclxcKFxcLlxcLlxcLmFyZ3VtZW50c1xcKS87XG5cbi8qKlxuICogRGV0ZXJtaW5lIHdoZXRoZXIgYSBzdHJpbmdpZmllZCB0eXBlIGlzIGEgY2xhc3Mgd2hpY2ggZGVsZWdhdGVzIGl0cyBjb25zdHJ1Y3RvclxuICogdG8gaXRzIHBhcmVudC5cbiAqXG4gKiBUaGlzIGlzIG5vdCB0cml2aWFsIHNpbmNlIGNvbXBpbGVkIGNvZGUgY2FuIGFjdHVhbGx5IGNvbnRhaW4gYSBjb25zdHJ1Y3RvciBmdW5jdGlvblxuICogZXZlbiBpZiB0aGUgb3JpZ2luYWwgc291cmNlIGNvZGUgZGlkIG5vdC4gRm9yIGluc3RhbmNlLCB3aGVuIHRoZSBjaGlsZCBjbGFzcyBjb250YWluc1xuICogYW4gaW5pdGlhbGl6ZWQgaW5zdGFuY2UgcHJvcGVydHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0RlbGVnYXRlQ3Rvcih0eXBlU3RyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIERFTEVHQVRFX0NUT1IudGVzdCh0eXBlU3RyKSB8fCBJTkhFUklURURfQ0xBU1NfV0lUSF9ERUxFR0FURV9DVE9SLnRlc3QodHlwZVN0cikgfHxcbiAgICAgIChJTkhFUklURURfQ0xBU1MudGVzdCh0eXBlU3RyKSAmJiAhSU5IRVJJVEVEX0NMQVNTX1dJVEhfQ1RPUi50ZXN0KHR5cGVTdHIpKTtcbn1cblxuZXhwb3J0IGNsYXNzIFJlZmxlY3Rpb25DYXBhYmlsaXRpZXMgaW1wbGVtZW50cyBQbGF0Zm9ybVJlZmxlY3Rpb25DYXBhYmlsaXRpZXMge1xuICBwcml2YXRlIF9yZWZsZWN0OiBhbnk7XG5cbiAgY29uc3RydWN0b3IocmVmbGVjdD86IGFueSkgeyB0aGlzLl9yZWZsZWN0ID0gcmVmbGVjdCB8fCBnbG9iYWxbJ1JlZmxlY3QnXTsgfVxuXG4gIGlzUmVmbGVjdGlvbkVuYWJsZWQoKTogYm9vbGVhbiB7IHJldHVybiB0cnVlOyB9XG5cbiAgZmFjdG9yeTxUPih0OiBUeXBlPFQ+KTogKGFyZ3M6IGFueVtdKSA9PiBUIHsgcmV0dXJuICguLi5hcmdzOiBhbnlbXSkgPT4gbmV3IHQoLi4uYXJncyk7IH1cblxuICAvKiogQGludGVybmFsICovXG4gIF96aXBUeXBlc0FuZEFubm90YXRpb25zKHBhcmFtVHlwZXM6IGFueVtdLCBwYXJhbUFubm90YXRpb25zOiBhbnlbXSk6IGFueVtdW10ge1xuICAgIGxldCByZXN1bHQ6IGFueVtdW107XG5cbiAgICBpZiAodHlwZW9mIHBhcmFtVHlwZXMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXN1bHQgPSBuZXcgQXJyYXkocGFyYW1Bbm5vdGF0aW9ucy5sZW5ndGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgPSBuZXcgQXJyYXkocGFyYW1UeXBlcy5sZW5ndGgpO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVzdWx0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBUUyBvdXRwdXRzIE9iamVjdCBmb3IgcGFyYW1ldGVycyB3aXRob3V0IHR5cGVzLCB3aGlsZSBUcmFjZXVyIG9taXRzXG4gICAgICAvLyB0aGUgYW5ub3RhdGlvbnMuIEZvciBub3cgd2UgcHJlc2VydmUgdGhlIFRyYWNldXIgYmVoYXZpb3IgdG8gYWlkXG4gICAgICAvLyBtaWdyYXRpb24sIGJ1dCB0aGlzIGNhbiBiZSByZXZpc2l0ZWQuXG4gICAgICBpZiAodHlwZW9mIHBhcmFtVHlwZXMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJlc3VsdFtpXSA9IFtdO1xuICAgICAgfSBlbHNlIGlmIChwYXJhbVR5cGVzW2ldICE9IE9iamVjdCkge1xuICAgICAgICByZXN1bHRbaV0gPSBbcGFyYW1UeXBlc1tpXV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHRbaV0gPSBbXTtcbiAgICAgIH1cbiAgICAgIGlmIChwYXJhbUFubm90YXRpb25zICYmIHBhcmFtQW5ub3RhdGlvbnNbaV0gIT0gbnVsbCkge1xuICAgICAgICByZXN1bHRbaV0gPSByZXN1bHRbaV0uY29uY2F0KHBhcmFtQW5ub3RhdGlvbnNbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcHJpdmF0ZSBfb3duUGFyYW1ldGVycyh0eXBlOiBUeXBlPGFueT4sIHBhcmVudEN0b3I6IGFueSk6IGFueVtdW118bnVsbCB7XG4gICAgY29uc3QgdHlwZVN0ciA9IHR5cGUudG9TdHJpbmcoKTtcbiAgICAvLyBJZiB3ZSBoYXZlIG5vIGRlY29yYXRvcnMsIHdlIG9ubHkgaGF2ZSBmdW5jdGlvbi5sZW5ndGggYXMgbWV0YWRhdGEuXG4gICAgLy8gSW4gdGhhdCBjYXNlLCB0byBkZXRlY3Qgd2hldGhlciBhIGNoaWxkIGNsYXNzIGRlY2xhcmVkIGFuIG93biBjb25zdHJ1Y3RvciBvciBub3QsXG4gICAgLy8gd2UgbmVlZCB0byBsb29rIGluc2lkZSBvZiB0aGF0IGNvbnN0cnVjdG9yIHRvIGNoZWNrIHdoZXRoZXIgaXQgaXNcbiAgICAvLyBqdXN0IGNhbGxpbmcgdGhlIHBhcmVudC5cbiAgICAvLyBUaGlzIGFsc28gaGVscHMgdG8gd29yayBhcm91bmQgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvMTI0MzlcbiAgICAvLyB0aGF0IHNldHMgJ2Rlc2lnbjpwYXJhbXR5cGVzJyB0byBbXVxuICAgIC8vIGlmIGEgY2xhc3MgaW5oZXJpdHMgZnJvbSBhbm90aGVyIGNsYXNzIGJ1dCBoYXMgbm8gY3RvciBkZWNsYXJlZCBpdHNlbGYuXG4gICAgaWYgKGlzRGVsZWdhdGVDdG9yKHR5cGVTdHIpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBQcmVmZXIgdGhlIGRpcmVjdCBBUEkuXG4gICAgaWYgKCg8YW55PnR5cGUpLnBhcmFtZXRlcnMgJiYgKDxhbnk+dHlwZSkucGFyYW1ldGVycyAhPT0gcGFyZW50Q3Rvci5wYXJhbWV0ZXJzKSB7XG4gICAgICByZXR1cm4gKDxhbnk+dHlwZSkucGFyYW1ldGVycztcbiAgICB9XG5cbiAgICAvLyBBUEkgb2YgdHNpY2tsZSBmb3IgbG93ZXJpbmcgZGVjb3JhdG9ycyB0byBwcm9wZXJ0aWVzIG9uIHRoZSBjbGFzcy5cbiAgICBjb25zdCB0c2lja2xlQ3RvclBhcmFtcyA9ICg8YW55PnR5cGUpLmN0b3JQYXJhbWV0ZXJzO1xuICAgIGlmICh0c2lja2xlQ3RvclBhcmFtcyAmJiB0c2lja2xlQ3RvclBhcmFtcyAhPT0gcGFyZW50Q3Rvci5jdG9yUGFyYW1ldGVycykge1xuICAgICAgLy8gTmV3ZXIgdHNpY2tsZSB1c2VzIGEgZnVuY3Rpb24gY2xvc3VyZVxuICAgICAgLy8gUmV0YWluIHRoZSBub24tZnVuY3Rpb24gY2FzZSBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG9sZGVyIHRzaWNrbGVcbiAgICAgIGNvbnN0IGN0b3JQYXJhbWV0ZXJzID1cbiAgICAgICAgICB0eXBlb2YgdHNpY2tsZUN0b3JQYXJhbXMgPT09ICdmdW5jdGlvbicgPyB0c2lja2xlQ3RvclBhcmFtcygpIDogdHNpY2tsZUN0b3JQYXJhbXM7XG4gICAgICBjb25zdCBwYXJhbVR5cGVzID0gY3RvclBhcmFtZXRlcnMubWFwKChjdG9yUGFyYW06IGFueSkgPT4gY3RvclBhcmFtICYmIGN0b3JQYXJhbS50eXBlKTtcbiAgICAgIGNvbnN0IHBhcmFtQW5ub3RhdGlvbnMgPSBjdG9yUGFyYW1ldGVycy5tYXAoXG4gICAgICAgICAgKGN0b3JQYXJhbTogYW55KSA9PlxuICAgICAgICAgICAgICBjdG9yUGFyYW0gJiYgY29udmVydFRzaWNrbGVEZWNvcmF0b3JJbnRvTWV0YWRhdGEoY3RvclBhcmFtLmRlY29yYXRvcnMpKTtcbiAgICAgIHJldHVybiB0aGlzLl96aXBUeXBlc0FuZEFubm90YXRpb25zKHBhcmFtVHlwZXMsIHBhcmFtQW5ub3RhdGlvbnMpO1xuICAgIH1cblxuICAgIC8vIEFQSSBmb3IgbWV0YWRhdGEgY3JlYXRlZCBieSBpbnZva2luZyB0aGUgZGVjb3JhdG9ycy5cbiAgICBjb25zdCBwYXJhbUFubm90YXRpb25zID0gdHlwZS5oYXNPd25Qcm9wZXJ0eShQQVJBTUVURVJTKSAmJiAodHlwZSBhcyBhbnkpW1BBUkFNRVRFUlNdO1xuICAgIGNvbnN0IHBhcmFtVHlwZXMgPSB0aGlzLl9yZWZsZWN0ICYmIHRoaXMuX3JlZmxlY3QuZ2V0T3duTWV0YWRhdGEgJiZcbiAgICAgICAgdGhpcy5fcmVmbGVjdC5nZXRPd25NZXRhZGF0YSgnZGVzaWduOnBhcmFtdHlwZXMnLCB0eXBlKTtcbiAgICBpZiAocGFyYW1UeXBlcyB8fCBwYXJhbUFubm90YXRpb25zKSB7XG4gICAgICByZXR1cm4gdGhpcy5femlwVHlwZXNBbmRBbm5vdGF0aW9ucyhwYXJhbVR5cGVzLCBwYXJhbUFubm90YXRpb25zKTtcbiAgICB9XG5cbiAgICAvLyBJZiBhIGNsYXNzIGhhcyBubyBkZWNvcmF0b3JzLCBhdCBsZWFzdCBjcmVhdGUgbWV0YWRhdGFcbiAgICAvLyBiYXNlZCBvbiBmdW5jdGlvbi5sZW5ndGguXG4gICAgLy8gTm90ZTogV2Uga25vdyB0aGF0IHRoaXMgaXMgYSByZWFsIGNvbnN0cnVjdG9yIGFzIHdlIGNoZWNrZWRcbiAgICAvLyB0aGUgY29udGVudCBvZiB0aGUgY29uc3RydWN0b3IgYWJvdmUuXG4gICAgcmV0dXJuIG5ldyBBcnJheSgoPGFueT50eXBlLmxlbmd0aCkpLmZpbGwodW5kZWZpbmVkKTtcbiAgfVxuXG4gIHBhcmFtZXRlcnModHlwZTogVHlwZTxhbnk+KTogYW55W11bXSB7XG4gICAgLy8gTm90ZTogb25seSByZXBvcnQgbWV0YWRhdGEgaWYgd2UgaGF2ZSBhdCBsZWFzdCBvbmUgY2xhc3MgZGVjb3JhdG9yXG4gICAgLy8gdG8gc3RheSBpbiBzeW5jIHdpdGggdGhlIHN0YXRpYyByZWZsZWN0b3IuXG4gICAgaWYgKCFpc1R5cGUodHlwZSkpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgY29uc3QgcGFyZW50Q3RvciA9IGdldFBhcmVudEN0b3IodHlwZSk7XG4gICAgbGV0IHBhcmFtZXRlcnMgPSB0aGlzLl9vd25QYXJhbWV0ZXJzKHR5cGUsIHBhcmVudEN0b3IpO1xuICAgIGlmICghcGFyYW1ldGVycyAmJiBwYXJlbnRDdG9yICE9PSBPYmplY3QpIHtcbiAgICAgIHBhcmFtZXRlcnMgPSB0aGlzLnBhcmFtZXRlcnMocGFyZW50Q3Rvcik7XG4gICAgfVxuICAgIHJldHVybiBwYXJhbWV0ZXJzIHx8IFtdO1xuICB9XG5cbiAgcHJpdmF0ZSBfb3duQW5ub3RhdGlvbnModHlwZU9yRnVuYzogVHlwZTxhbnk+LCBwYXJlbnRDdG9yOiBhbnkpOiBhbnlbXXxudWxsIHtcbiAgICAvLyBQcmVmZXIgdGhlIGRpcmVjdCBBUEkuXG4gICAgaWYgKCg8YW55PnR5cGVPckZ1bmMpLmFubm90YXRpb25zICYmICg8YW55PnR5cGVPckZ1bmMpLmFubm90YXRpb25zICE9PSBwYXJlbnRDdG9yLmFubm90YXRpb25zKSB7XG4gICAgICBsZXQgYW5ub3RhdGlvbnMgPSAoPGFueT50eXBlT3JGdW5jKS5hbm5vdGF0aW9ucztcbiAgICAgIGlmICh0eXBlb2YgYW5ub3RhdGlvbnMgPT09ICdmdW5jdGlvbicgJiYgYW5ub3RhdGlvbnMuYW5ub3RhdGlvbnMpIHtcbiAgICAgICAgYW5ub3RhdGlvbnMgPSBhbm5vdGF0aW9ucy5hbm5vdGF0aW9ucztcbiAgICAgIH1cbiAgICAgIHJldHVybiBhbm5vdGF0aW9ucztcbiAgICB9XG5cbiAgICAvLyBBUEkgb2YgdHNpY2tsZSBmb3IgbG93ZXJpbmcgZGVjb3JhdG9ycyB0byBwcm9wZXJ0aWVzIG9uIHRoZSBjbGFzcy5cbiAgICBpZiAoKDxhbnk+dHlwZU9yRnVuYykuZGVjb3JhdG9ycyAmJiAoPGFueT50eXBlT3JGdW5jKS5kZWNvcmF0b3JzICE9PSBwYXJlbnRDdG9yLmRlY29yYXRvcnMpIHtcbiAgICAgIHJldHVybiBjb252ZXJ0VHNpY2tsZURlY29yYXRvckludG9NZXRhZGF0YSgoPGFueT50eXBlT3JGdW5jKS5kZWNvcmF0b3JzKTtcbiAgICB9XG5cbiAgICAvLyBBUEkgZm9yIG1ldGFkYXRhIGNyZWF0ZWQgYnkgaW52b2tpbmcgdGhlIGRlY29yYXRvcnMuXG4gICAgaWYgKHR5cGVPckZ1bmMuaGFzT3duUHJvcGVydHkoQU5OT1RBVElPTlMpKSB7XG4gICAgICByZXR1cm4gKHR5cGVPckZ1bmMgYXMgYW55KVtBTk5PVEFUSU9OU107XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgYW5ub3RhdGlvbnModHlwZU9yRnVuYzogVHlwZTxhbnk+KTogYW55W10ge1xuICAgIGlmICghaXNUeXBlKHR5cGVPckZ1bmMpKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIGNvbnN0IHBhcmVudEN0b3IgPSBnZXRQYXJlbnRDdG9yKHR5cGVPckZ1bmMpO1xuICAgIGNvbnN0IG93bkFubm90YXRpb25zID0gdGhpcy5fb3duQW5ub3RhdGlvbnModHlwZU9yRnVuYywgcGFyZW50Q3RvcikgfHwgW107XG4gICAgY29uc3QgcGFyZW50QW5ub3RhdGlvbnMgPSBwYXJlbnRDdG9yICE9PSBPYmplY3QgPyB0aGlzLmFubm90YXRpb25zKHBhcmVudEN0b3IpIDogW107XG4gICAgcmV0dXJuIHBhcmVudEFubm90YXRpb25zLmNvbmNhdChvd25Bbm5vdGF0aW9ucyk7XG4gIH1cblxuICBwcml2YXRlIF9vd25Qcm9wTWV0YWRhdGEodHlwZU9yRnVuYzogYW55LCBwYXJlbnRDdG9yOiBhbnkpOiB7W2tleTogc3RyaW5nXTogYW55W119fG51bGwge1xuICAgIC8vIFByZWZlciB0aGUgZGlyZWN0IEFQSS5cbiAgICBpZiAoKDxhbnk+dHlwZU9yRnVuYykucHJvcE1ldGFkYXRhICYmXG4gICAgICAgICg8YW55PnR5cGVPckZ1bmMpLnByb3BNZXRhZGF0YSAhPT0gcGFyZW50Q3Rvci5wcm9wTWV0YWRhdGEpIHtcbiAgICAgIGxldCBwcm9wTWV0YWRhdGEgPSAoPGFueT50eXBlT3JGdW5jKS5wcm9wTWV0YWRhdGE7XG4gICAgICBpZiAodHlwZW9mIHByb3BNZXRhZGF0YSA9PT0gJ2Z1bmN0aW9uJyAmJiBwcm9wTWV0YWRhdGEucHJvcE1ldGFkYXRhKSB7XG4gICAgICAgIHByb3BNZXRhZGF0YSA9IHByb3BNZXRhZGF0YS5wcm9wTWV0YWRhdGE7XG4gICAgICB9XG4gICAgICByZXR1cm4gcHJvcE1ldGFkYXRhO1xuICAgIH1cblxuICAgIC8vIEFQSSBvZiB0c2lja2xlIGZvciBsb3dlcmluZyBkZWNvcmF0b3JzIHRvIHByb3BlcnRpZXMgb24gdGhlIGNsYXNzLlxuICAgIGlmICgoPGFueT50eXBlT3JGdW5jKS5wcm9wRGVjb3JhdG9ycyAmJlxuICAgICAgICAoPGFueT50eXBlT3JGdW5jKS5wcm9wRGVjb3JhdG9ycyAhPT0gcGFyZW50Q3Rvci5wcm9wRGVjb3JhdG9ycykge1xuICAgICAgY29uc3QgcHJvcERlY29yYXRvcnMgPSAoPGFueT50eXBlT3JGdW5jKS5wcm9wRGVjb3JhdG9ycztcbiAgICAgIGNvbnN0IHByb3BNZXRhZGF0YSA9IDx7W2tleTogc3RyaW5nXTogYW55W119Pnt9O1xuICAgICAgT2JqZWN0LmtleXMocHJvcERlY29yYXRvcnMpLmZvckVhY2gocHJvcCA9PiB7XG4gICAgICAgIHByb3BNZXRhZGF0YVtwcm9wXSA9IGNvbnZlcnRUc2lja2xlRGVjb3JhdG9ySW50b01ldGFkYXRhKHByb3BEZWNvcmF0b3JzW3Byb3BdKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHByb3BNZXRhZGF0YTtcbiAgICB9XG5cbiAgICAvLyBBUEkgZm9yIG1ldGFkYXRhIGNyZWF0ZWQgYnkgaW52b2tpbmcgdGhlIGRlY29yYXRvcnMuXG4gICAgaWYgKHR5cGVPckZ1bmMuaGFzT3duUHJvcGVydHkoUFJPUF9NRVRBREFUQSkpIHtcbiAgICAgIHJldHVybiAodHlwZU9yRnVuYyBhcyBhbnkpW1BST1BfTUVUQURBVEFdO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByb3BNZXRhZGF0YSh0eXBlT3JGdW5jOiBhbnkpOiB7W2tleTogc3RyaW5nXTogYW55W119IHtcbiAgICBpZiAoIWlzVHlwZSh0eXBlT3JGdW5jKSkge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cbiAgICBjb25zdCBwYXJlbnRDdG9yID0gZ2V0UGFyZW50Q3Rvcih0eXBlT3JGdW5jKTtcbiAgICBjb25zdCBwcm9wTWV0YWRhdGE6IHtba2V5OiBzdHJpbmddOiBhbnlbXX0gPSB7fTtcbiAgICBpZiAocGFyZW50Q3RvciAhPT0gT2JqZWN0KSB7XG4gICAgICBjb25zdCBwYXJlbnRQcm9wTWV0YWRhdGEgPSB0aGlzLnByb3BNZXRhZGF0YShwYXJlbnRDdG9yKTtcbiAgICAgIE9iamVjdC5rZXlzKHBhcmVudFByb3BNZXRhZGF0YSkuZm9yRWFjaCgocHJvcE5hbWUpID0+IHtcbiAgICAgICAgcHJvcE1ldGFkYXRhW3Byb3BOYW1lXSA9IHBhcmVudFByb3BNZXRhZGF0YVtwcm9wTmFtZV07XG4gICAgICB9KTtcbiAgICB9XG4gICAgY29uc3Qgb3duUHJvcE1ldGFkYXRhID0gdGhpcy5fb3duUHJvcE1ldGFkYXRhKHR5cGVPckZ1bmMsIHBhcmVudEN0b3IpO1xuICAgIGlmIChvd25Qcm9wTWV0YWRhdGEpIHtcbiAgICAgIE9iamVjdC5rZXlzKG93blByb3BNZXRhZGF0YSkuZm9yRWFjaCgocHJvcE5hbWUpID0+IHtcbiAgICAgICAgY29uc3QgZGVjb3JhdG9yczogYW55W10gPSBbXTtcbiAgICAgICAgaWYgKHByb3BNZXRhZGF0YS5oYXNPd25Qcm9wZXJ0eShwcm9wTmFtZSkpIHtcbiAgICAgICAgICBkZWNvcmF0b3JzLnB1c2goLi4ucHJvcE1ldGFkYXRhW3Byb3BOYW1lXSk7XG4gICAgICAgIH1cbiAgICAgICAgZGVjb3JhdG9ycy5wdXNoKC4uLm93blByb3BNZXRhZGF0YVtwcm9wTmFtZV0pO1xuICAgICAgICBwcm9wTWV0YWRhdGFbcHJvcE5hbWVdID0gZGVjb3JhdG9ycztcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcHJvcE1ldGFkYXRhO1xuICB9XG5cbiAgb3duUHJvcE1ldGFkYXRhKHR5cGVPckZ1bmM6IGFueSk6IHtba2V5OiBzdHJpbmddOiBhbnlbXX0ge1xuICAgIGlmICghaXNUeXBlKHR5cGVPckZ1bmMpKSB7XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9vd25Qcm9wTWV0YWRhdGEodHlwZU9yRnVuYywgZ2V0UGFyZW50Q3Rvcih0eXBlT3JGdW5jKSkgfHwge307XG4gIH1cblxuICBoYXNMaWZlY3ljbGVIb29rKHR5cGU6IGFueSwgbGNQcm9wZXJ0eTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHR5cGUgaW5zdGFuY2VvZiBUeXBlICYmIGxjUHJvcGVydHkgaW4gdHlwZS5wcm90b3R5cGU7XG4gIH1cblxuICBndWFyZHModHlwZTogYW55KToge1trZXk6IHN0cmluZ106IGFueX0geyByZXR1cm4ge307IH1cblxuICBnZXR0ZXIobmFtZTogc3RyaW5nKTogR2V0dGVyRm4geyByZXR1cm4gPEdldHRlckZuPm5ldyBGdW5jdGlvbignbycsICdyZXR1cm4gby4nICsgbmFtZSArICc7Jyk7IH1cblxuICBzZXR0ZXIobmFtZTogc3RyaW5nKTogU2V0dGVyRm4ge1xuICAgIHJldHVybiA8U2V0dGVyRm4+bmV3IEZ1bmN0aW9uKCdvJywgJ3YnLCAncmV0dXJuIG8uJyArIG5hbWUgKyAnID0gdjsnKTtcbiAgfVxuXG4gIG1ldGhvZChuYW1lOiBzdHJpbmcpOiBNZXRob2RGbiB7XG4gICAgY29uc3QgZnVuY3Rpb25Cb2R5ID0gYGlmICghby4ke25hbWV9KSB0aHJvdyBuZXcgRXJyb3IoJ1wiJHtuYW1lfVwiIGlzIHVuZGVmaW5lZCcpO1xuICAgICAgICByZXR1cm4gby4ke25hbWV9LmFwcGx5KG8sIGFyZ3MpO2A7XG4gICAgcmV0dXJuIDxNZXRob2RGbj5uZXcgRnVuY3Rpb24oJ28nLCAnYXJncycsIGZ1bmN0aW9uQm9keSk7XG4gIH1cblxuICAvLyBUaGVyZSBpcyBub3QgYSBjb25jZXB0IG9mIGltcG9ydCB1cmkgaW4gSnMsIGJ1dCB0aGlzIGlzIHVzZWZ1bCBpbiBkZXZlbG9waW5nIERhcnQgYXBwbGljYXRpb25zLlxuICBpbXBvcnRVcmkodHlwZTogYW55KTogc3RyaW5nIHtcbiAgICAvLyBTdGF0aWNTeW1ib2xcbiAgICBpZiAodHlwZW9mIHR5cGUgPT09ICdvYmplY3QnICYmIHR5cGVbJ2ZpbGVQYXRoJ10pIHtcbiAgICAgIHJldHVybiB0eXBlWydmaWxlUGF0aCddO1xuICAgIH1cbiAgICAvLyBSdW50aW1lIHR5cGVcbiAgICByZXR1cm4gYC4vJHtzdHJpbmdpZnkodHlwZSl9YDtcbiAgfVxuXG4gIHJlc291cmNlVXJpKHR5cGU6IGFueSk6IHN0cmluZyB7IHJldHVybiBgLi8ke3N0cmluZ2lmeSh0eXBlKX1gOyB9XG5cbiAgcmVzb2x2ZUlkZW50aWZpZXIobmFtZTogc3RyaW5nLCBtb2R1bGVVcmw6IHN0cmluZywgbWVtYmVyczogc3RyaW5nW10sIHJ1bnRpbWU6IGFueSk6IGFueSB7XG4gICAgcmV0dXJuIHJ1bnRpbWU7XG4gIH1cbiAgcmVzb2x2ZUVudW0oZW51bUlkZW50aWZpZXI6IGFueSwgbmFtZTogc3RyaW5nKTogYW55IHsgcmV0dXJuIGVudW1JZGVudGlmaWVyW25hbWVdOyB9XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRUc2lja2xlRGVjb3JhdG9ySW50b01ldGFkYXRhKGRlY29yYXRvckludm9jYXRpb25zOiBhbnlbXSk6IGFueVtdIHtcbiAgaWYgKCFkZWNvcmF0b3JJbnZvY2F0aW9ucykge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICByZXR1cm4gZGVjb3JhdG9ySW52b2NhdGlvbnMubWFwKGRlY29yYXRvckludm9jYXRpb24gPT4ge1xuICAgIGNvbnN0IGRlY29yYXRvclR5cGUgPSBkZWNvcmF0b3JJbnZvY2F0aW9uLnR5cGU7XG4gICAgY29uc3QgYW5ub3RhdGlvbkNscyA9IGRlY29yYXRvclR5cGUuYW5ub3RhdGlvbkNscztcbiAgICBjb25zdCBhbm5vdGF0aW9uQXJncyA9IGRlY29yYXRvckludm9jYXRpb24uYXJncyA/IGRlY29yYXRvckludm9jYXRpb24uYXJncyA6IFtdO1xuICAgIHJldHVybiBuZXcgYW5ub3RhdGlvbkNscyguLi5hbm5vdGF0aW9uQXJncyk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRQYXJlbnRDdG9yKGN0b3I6IEZ1bmN0aW9uKTogVHlwZTxhbnk+IHtcbiAgY29uc3QgcGFyZW50UHJvdG8gPSBjdG9yLnByb3RvdHlwZSA/IE9iamVjdC5nZXRQcm90b3R5cGVPZihjdG9yLnByb3RvdHlwZSkgOiBudWxsO1xuICBjb25zdCBwYXJlbnRDdG9yID0gcGFyZW50UHJvdG8gPyBwYXJlbnRQcm90by5jb25zdHJ1Y3RvciA6IG51bGw7XG4gIC8vIE5vdGU6IFdlIGFsd2F5cyB1c2UgYE9iamVjdGAgYXMgdGhlIG51bGwgdmFsdWVcbiAgLy8gdG8gc2ltcGxpZnkgY2hlY2tpbmcgbGF0ZXIgb24uXG4gIHJldHVybiBwYXJlbnRDdG9yIHx8IE9iamVjdDtcbn1cbiJdfQ==