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
        if (DELEGATE_CTOR.exec(typeStr) ||
            (INHERITED_CLASS.exec(typeStr) && !INHERITED_CLASS_WITH_CTOR.exec(typeStr))) {
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
        return this._ownPropMetadata(typeOrFunc, Object) || {};
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdGlvbl9jYXBhYmlsaXRpZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZWZsZWN0aW9uL3JlZmxlY3Rpb25fY2FwYWJpbGl0aWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxXQUFXLEVBQUUsVUFBVSxFQUFFLGFBQWEsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQzFFLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN0QyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFPNUM7O0dBRUc7QUFDSCxNQUFNLENBQUMsSUFBTSxhQUFhLEdBQUcsNERBQTRELENBQUM7QUFDMUYsTUFBTSxDQUFDLElBQU0sZUFBZSxHQUFHLDJDQUEyQyxDQUFDO0FBQzNFLE1BQU0sQ0FBQyxJQUFNLHlCQUF5QixHQUNsQyxrRUFBa0UsQ0FBQztBQUV2RTtJQUdFLGdDQUFZLE9BQWE7UUFBSSxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7SUFBQyxDQUFDO0lBRTVFLG9EQUFtQixHQUFuQixjQUFpQyxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUM7SUFFL0Msd0NBQU8sR0FBUCxVQUFXLENBQVUsSUFBd0IsT0FBTztRQUFDLGNBQWM7YUFBZCxVQUFjLEVBQWQscUJBQWMsRUFBZCxJQUFjO1lBQWQseUJBQWM7O1FBQUssWUFBSSxDQUFDLFlBQUQsQ0FBQyw2QkFBSSxJQUFJO0lBQWIsQ0FBYyxDQUFDLENBQUMsQ0FBQztJQUV6RixnQkFBZ0I7SUFDaEIsd0RBQXVCLEdBQXZCLFVBQXdCLFVBQWlCLEVBQUUsZ0JB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Y0FBbUIsRUFBRSxJQUFZLElBQVMsT0FBTyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RGLDZCQUFDO0FBQUQsQ0FBQyxBQW5PRCxJQW1PQzs7QUFFRCxTQUFTLG1DQUFtQyxDQUFDLG9CQUEyQjtJQUN0RSxJQUFJLENBQUMsb0JBQW9CLEVBQUU7UUFDekIsT0FBTyxFQUFFLENBQUM7S0FDWDtJQUNELE9BQU8sb0JBQW9CLENBQUMsR0FBRyxDQUFDLFVBQUEsbUJBQW1CO1FBQ2pELElBQU0sYUFBYSxHQUFHLG1CQUFtQixDQUFDLElBQUksQ0FBQztRQUMvQyxJQUFNLGFBQWEsR0FBRyxhQUFhLENBQUMsYUFBYSxDQUFDO1FBQ2xELElBQU0sY0FBYyxHQUFHLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDaEYsWUFBVyxhQUFhLFlBQWIsYUFBYSw2QkFBSSxjQUFjLE1BQUU7SUFDOUMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBUyxhQUFhLENBQUMsSUFBYztJQUNuQyxJQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ2xGLElBQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ2hFLGlEQUFpRDtJQUNqRCxpQ0FBaUM7SUFDakMsT0FBTyxVQUFVLElBQUksTUFBTSxDQUFDO0FBQzlCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZSwgaXNUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0FOTk9UQVRJT05TLCBQQVJBTUVURVJTLCBQUk9QX01FVEFEQVRBfSBmcm9tICcuLi91dGlsL2RlY29yYXRvcnMnO1xuaW1wb3J0IHtnbG9iYWx9IGZyb20gJy4uL3V0aWwvZ2xvYmFsJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5cbmltcG9ydCB7UGxhdGZvcm1SZWZsZWN0aW9uQ2FwYWJpbGl0aWVzfSBmcm9tICcuL3BsYXRmb3JtX3JlZmxlY3Rpb25fY2FwYWJpbGl0aWVzJztcbmltcG9ydCB7R2V0dGVyRm4sIE1ldGhvZEZuLCBTZXR0ZXJGbn0gZnJvbSAnLi90eXBlcyc7XG5cblxuXG4vKipcbiAqIEF0dGVudGlvbjogVGhlc2UgcmVnZXggaGFzIHRvIGhvbGQgZXZlbiBpZiB0aGUgY29kZSBpcyBtaW5pZmllZCFcbiAqL1xuZXhwb3J0IGNvbnN0IERFTEVHQVRFX0NUT1IgPSAvXmZ1bmN0aW9uXFxzK1xcUytcXChcXClcXHMqe1tcXHNcXFNdK1xcLmFwcGx5XFwodGhpcyxcXHMqYXJndW1lbnRzXFwpLztcbmV4cG9ydCBjb25zdCBJTkhFUklURURfQ0xBU1MgPSAvXmNsYXNzXFxzK1tBLVphLXpcXGQkX10qXFxzKmV4dGVuZHNcXHMrW157XSt7LztcbmV4cG9ydCBjb25zdCBJTkhFUklURURfQ0xBU1NfV0lUSF9DVE9SID1cbiAgICAvXmNsYXNzXFxzK1tBLVphLXpcXGQkX10qXFxzKmV4dGVuZHNcXHMrW157XSt7W1xcc1xcU10qY29uc3RydWN0b3JcXHMqXFwoLztcblxuZXhwb3J0IGNsYXNzIFJlZmxlY3Rpb25DYXBhYmlsaXRpZXMgaW1wbGVtZW50cyBQbGF0Zm9ybVJlZmxlY3Rpb25DYXBhYmlsaXRpZXMge1xuICBwcml2YXRlIF9yZWZsZWN0OiBhbnk7XG5cbiAgY29uc3RydWN0b3IocmVmbGVjdD86IGFueSkgeyB0aGlzLl9yZWZsZWN0ID0gcmVmbGVjdCB8fCBnbG9iYWxbJ1JlZmxlY3QnXTsgfVxuXG4gIGlzUmVmbGVjdGlvbkVuYWJsZWQoKTogYm9vbGVhbiB7IHJldHVybiB0cnVlOyB9XG5cbiAgZmFjdG9yeTxUPih0OiBUeXBlPFQ+KTogKGFyZ3M6IGFueVtdKSA9PiBUIHsgcmV0dXJuICguLi5hcmdzOiBhbnlbXSkgPT4gbmV3IHQoLi4uYXJncyk7IH1cblxuICAvKiogQGludGVybmFsICovXG4gIF96aXBUeXBlc0FuZEFubm90YXRpb25zKHBhcmFtVHlwZXM6IGFueVtdLCBwYXJhbUFubm90YXRpb25zOiBhbnlbXSk6IGFueVtdW10ge1xuICAgIGxldCByZXN1bHQ6IGFueVtdW107XG5cbiAgICBpZiAodHlwZW9mIHBhcmFtVHlwZXMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXN1bHQgPSBuZXcgQXJyYXkocGFyYW1Bbm5vdGF0aW9ucy5sZW5ndGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgPSBuZXcgQXJyYXkocGFyYW1UeXBlcy5sZW5ndGgpO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVzdWx0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBUUyBvdXRwdXRzIE9iamVjdCBmb3IgcGFyYW1ldGVycyB3aXRob3V0IHR5cGVzLCB3aGlsZSBUcmFjZXVyIG9taXRzXG4gICAgICAvLyB0aGUgYW5ub3RhdGlvbnMuIEZvciBub3cgd2UgcHJlc2VydmUgdGhlIFRyYWNldXIgYmVoYXZpb3IgdG8gYWlkXG4gICAgICAvLyBtaWdyYXRpb24sIGJ1dCB0aGlzIGNhbiBiZSByZXZpc2l0ZWQuXG4gICAgICBpZiAodHlwZW9mIHBhcmFtVHlwZXMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJlc3VsdFtpXSA9IFtdO1xuICAgICAgfSBlbHNlIGlmIChwYXJhbVR5cGVzW2ldICE9IE9iamVjdCkge1xuICAgICAgICByZXN1bHRbaV0gPSBbcGFyYW1UeXBlc1tpXV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHRbaV0gPSBbXTtcbiAgICAgIH1cbiAgICAgIGlmIChwYXJhbUFubm90YXRpb25zICYmIHBhcmFtQW5ub3RhdGlvbnNbaV0gIT0gbnVsbCkge1xuICAgICAgICByZXN1bHRbaV0gPSByZXN1bHRbaV0uY29uY2F0KHBhcmFtQW5ub3RhdGlvbnNbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcHJpdmF0ZSBfb3duUGFyYW1ldGVycyh0eXBlOiBUeXBlPGFueT4sIHBhcmVudEN0b3I6IGFueSk6IGFueVtdW118bnVsbCB7XG4gICAgY29uc3QgdHlwZVN0ciA9IHR5cGUudG9TdHJpbmcoKTtcbiAgICAvLyBJZiB3ZSBoYXZlIG5vIGRlY29yYXRvcnMsIHdlIG9ubHkgaGF2ZSBmdW5jdGlvbi5sZW5ndGggYXMgbWV0YWRhdGEuXG4gICAgLy8gSW4gdGhhdCBjYXNlLCB0byBkZXRlY3Qgd2hldGhlciBhIGNoaWxkIGNsYXNzIGRlY2xhcmVkIGFuIG93biBjb25zdHJ1Y3RvciBvciBub3QsXG4gICAgLy8gd2UgbmVlZCB0byBsb29rIGluc2lkZSBvZiB0aGF0IGNvbnN0cnVjdG9yIHRvIGNoZWNrIHdoZXRoZXIgaXQgaXNcbiAgICAvLyBqdXN0IGNhbGxpbmcgdGhlIHBhcmVudC5cbiAgICAvLyBUaGlzIGFsc28gaGVscHMgdG8gd29yayBhcm91bmQgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvMTI0MzlcbiAgICAvLyB0aGF0IHNldHMgJ2Rlc2lnbjpwYXJhbXR5cGVzJyB0byBbXVxuICAgIC8vIGlmIGEgY2xhc3MgaW5oZXJpdHMgZnJvbSBhbm90aGVyIGNsYXNzIGJ1dCBoYXMgbm8gY3RvciBkZWNsYXJlZCBpdHNlbGYuXG4gICAgaWYgKERFTEVHQVRFX0NUT1IuZXhlYyh0eXBlU3RyKSB8fFxuICAgICAgICAoSU5IRVJJVEVEX0NMQVNTLmV4ZWModHlwZVN0cikgJiYgIUlOSEVSSVRFRF9DTEFTU19XSVRIX0NUT1IuZXhlYyh0eXBlU3RyKSkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIFByZWZlciB0aGUgZGlyZWN0IEFQSS5cbiAgICBpZiAoKDxhbnk+dHlwZSkucGFyYW1ldGVycyAmJiAoPGFueT50eXBlKS5wYXJhbWV0ZXJzICE9PSBwYXJlbnRDdG9yLnBhcmFtZXRlcnMpIHtcbiAgICAgIHJldHVybiAoPGFueT50eXBlKS5wYXJhbWV0ZXJzO1xuICAgIH1cblxuICAgIC8vIEFQSSBvZiB0c2lja2xlIGZvciBsb3dlcmluZyBkZWNvcmF0b3JzIHRvIHByb3BlcnRpZXMgb24gdGhlIGNsYXNzLlxuICAgIGNvbnN0IHRzaWNrbGVDdG9yUGFyYW1zID0gKDxhbnk+dHlwZSkuY3RvclBhcmFtZXRlcnM7XG4gICAgaWYgKHRzaWNrbGVDdG9yUGFyYW1zICYmIHRzaWNrbGVDdG9yUGFyYW1zICE9PSBwYXJlbnRDdG9yLmN0b3JQYXJhbWV0ZXJzKSB7XG4gICAgICAvLyBOZXdlciB0c2lja2xlIHVzZXMgYSBmdW5jdGlvbiBjbG9zdXJlXG4gICAgICAvLyBSZXRhaW4gdGhlIG5vbi1mdW5jdGlvbiBjYXNlIGZvciBjb21wYXRpYmlsaXR5IHdpdGggb2xkZXIgdHNpY2tsZVxuICAgICAgY29uc3QgY3RvclBhcmFtZXRlcnMgPVxuICAgICAgICAgIHR5cGVvZiB0c2lja2xlQ3RvclBhcmFtcyA9PT0gJ2Z1bmN0aW9uJyA/IHRzaWNrbGVDdG9yUGFyYW1zKCkgOiB0c2lja2xlQ3RvclBhcmFtcztcbiAgICAgIGNvbnN0IHBhcmFtVHlwZXMgPSBjdG9yUGFyYW1ldGVycy5tYXAoKGN0b3JQYXJhbTogYW55KSA9PiBjdG9yUGFyYW0gJiYgY3RvclBhcmFtLnR5cGUpO1xuICAgICAgY29uc3QgcGFyYW1Bbm5vdGF0aW9ucyA9IGN0b3JQYXJhbWV0ZXJzLm1hcChcbiAgICAgICAgICAoY3RvclBhcmFtOiBhbnkpID0+XG4gICAgICAgICAgICAgIGN0b3JQYXJhbSAmJiBjb252ZXJ0VHNpY2tsZURlY29yYXRvckludG9NZXRhZGF0YShjdG9yUGFyYW0uZGVjb3JhdG9ycykpO1xuICAgICAgcmV0dXJuIHRoaXMuX3ppcFR5cGVzQW5kQW5ub3RhdGlvbnMocGFyYW1UeXBlcywgcGFyYW1Bbm5vdGF0aW9ucyk7XG4gICAgfVxuXG4gICAgLy8gQVBJIGZvciBtZXRhZGF0YSBjcmVhdGVkIGJ5IGludm9raW5nIHRoZSBkZWNvcmF0b3JzLlxuICAgIGNvbnN0IHBhcmFtQW5ub3RhdGlvbnMgPSB0eXBlLmhhc093blByb3BlcnR5KFBBUkFNRVRFUlMpICYmICh0eXBlIGFzIGFueSlbUEFSQU1FVEVSU107XG4gICAgY29uc3QgcGFyYW1UeXBlcyA9IHRoaXMuX3JlZmxlY3QgJiYgdGhpcy5fcmVmbGVjdC5nZXRPd25NZXRhZGF0YSAmJlxuICAgICAgICB0aGlzLl9yZWZsZWN0LmdldE93bk1ldGFkYXRhKCdkZXNpZ246cGFyYW10eXBlcycsIHR5cGUpO1xuICAgIGlmIChwYXJhbVR5cGVzIHx8IHBhcmFtQW5ub3RhdGlvbnMpIHtcbiAgICAgIHJldHVybiB0aGlzLl96aXBUeXBlc0FuZEFubm90YXRpb25zKHBhcmFtVHlwZXMsIHBhcmFtQW5ub3RhdGlvbnMpO1xuICAgIH1cblxuICAgIC8vIElmIGEgY2xhc3MgaGFzIG5vIGRlY29yYXRvcnMsIGF0IGxlYXN0IGNyZWF0ZSBtZXRhZGF0YVxuICAgIC8vIGJhc2VkIG9uIGZ1bmN0aW9uLmxlbmd0aC5cbiAgICAvLyBOb3RlOiBXZSBrbm93IHRoYXQgdGhpcyBpcyBhIHJlYWwgY29uc3RydWN0b3IgYXMgd2UgY2hlY2tlZFxuICAgIC8vIHRoZSBjb250ZW50IG9mIHRoZSBjb25zdHJ1Y3RvciBhYm92ZS5cbiAgICByZXR1cm4gbmV3IEFycmF5KCg8YW55PnR5cGUubGVuZ3RoKSkuZmlsbCh1bmRlZmluZWQpO1xuICB9XG5cbiAgcGFyYW1ldGVycyh0eXBlOiBUeXBlPGFueT4pOiBhbnlbXVtdIHtcbiAgICAvLyBOb3RlOiBvbmx5IHJlcG9ydCBtZXRhZGF0YSBpZiB3ZSBoYXZlIGF0IGxlYXN0IG9uZSBjbGFzcyBkZWNvcmF0b3JcbiAgICAvLyB0byBzdGF5IGluIHN5bmMgd2l0aCB0aGUgc3RhdGljIHJlZmxlY3Rvci5cbiAgICBpZiAoIWlzVHlwZSh0eXBlKSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBjb25zdCBwYXJlbnRDdG9yID0gZ2V0UGFyZW50Q3Rvcih0eXBlKTtcbiAgICBsZXQgcGFyYW1ldGVycyA9IHRoaXMuX293blBhcmFtZXRlcnModHlwZSwgcGFyZW50Q3Rvcik7XG4gICAgaWYgKCFwYXJhbWV0ZXJzICYmIHBhcmVudEN0b3IgIT09IE9iamVjdCkge1xuICAgICAgcGFyYW1ldGVycyA9IHRoaXMucGFyYW1ldGVycyhwYXJlbnRDdG9yKTtcbiAgICB9XG4gICAgcmV0dXJuIHBhcmFtZXRlcnMgfHwgW107XG4gIH1cblxuICBwcml2YXRlIF9vd25Bbm5vdGF0aW9ucyh0eXBlT3JGdW5jOiBUeXBlPGFueT4sIHBhcmVudEN0b3I6IGFueSk6IGFueVtdfG51bGwge1xuICAgIC8vIFByZWZlciB0aGUgZGlyZWN0IEFQSS5cbiAgICBpZiAoKDxhbnk+dHlwZU9yRnVuYykuYW5ub3RhdGlvbnMgJiYgKDxhbnk+dHlwZU9yRnVuYykuYW5ub3RhdGlvbnMgIT09IHBhcmVudEN0b3IuYW5ub3RhdGlvbnMpIHtcbiAgICAgIGxldCBhbm5vdGF0aW9ucyA9ICg8YW55PnR5cGVPckZ1bmMpLmFubm90YXRpb25zO1xuICAgICAgaWYgKHR5cGVvZiBhbm5vdGF0aW9ucyA9PT0gJ2Z1bmN0aW9uJyAmJiBhbm5vdGF0aW9ucy5hbm5vdGF0aW9ucykge1xuICAgICAgICBhbm5vdGF0aW9ucyA9IGFubm90YXRpb25zLmFubm90YXRpb25zO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFubm90YXRpb25zO1xuICAgIH1cblxuICAgIC8vIEFQSSBvZiB0c2lja2xlIGZvciBsb3dlcmluZyBkZWNvcmF0b3JzIHRvIHByb3BlcnRpZXMgb24gdGhlIGNsYXNzLlxuICAgIGlmICgoPGFueT50eXBlT3JGdW5jKS5kZWNvcmF0b3JzICYmICg8YW55PnR5cGVPckZ1bmMpLmRlY29yYXRvcnMgIT09IHBhcmVudEN0b3IuZGVjb3JhdG9ycykge1xuICAgICAgcmV0dXJuIGNvbnZlcnRUc2lja2xlRGVjb3JhdG9ySW50b01ldGFkYXRhKCg8YW55PnR5cGVPckZ1bmMpLmRlY29yYXRvcnMpO1xuICAgIH1cblxuICAgIC8vIEFQSSBmb3IgbWV0YWRhdGEgY3JlYXRlZCBieSBpbnZva2luZyB0aGUgZGVjb3JhdG9ycy5cbiAgICBpZiAodHlwZU9yRnVuYy5oYXNPd25Qcm9wZXJ0eShBTk5PVEFUSU9OUykpIHtcbiAgICAgIHJldHVybiAodHlwZU9yRnVuYyBhcyBhbnkpW0FOTk9UQVRJT05TXTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBhbm5vdGF0aW9ucyh0eXBlT3JGdW5jOiBUeXBlPGFueT4pOiBhbnlbXSB7XG4gICAgaWYgKCFpc1R5cGUodHlwZU9yRnVuYykpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgY29uc3QgcGFyZW50Q3RvciA9IGdldFBhcmVudEN0b3IodHlwZU9yRnVuYyk7XG4gICAgY29uc3Qgb3duQW5ub3RhdGlvbnMgPSB0aGlzLl9vd25Bbm5vdGF0aW9ucyh0eXBlT3JGdW5jLCBwYXJlbnRDdG9yKSB8fCBbXTtcbiAgICBjb25zdCBwYXJlbnRBbm5vdGF0aW9ucyA9IHBhcmVudEN0b3IgIT09IE9iamVjdCA/IHRoaXMuYW5ub3RhdGlvbnMocGFyZW50Q3RvcikgOiBbXTtcbiAgICByZXR1cm4gcGFyZW50QW5ub3RhdGlvbnMuY29uY2F0KG93bkFubm90YXRpb25zKTtcbiAgfVxuXG4gIHByaXZhdGUgX293blByb3BNZXRhZGF0YSh0eXBlT3JGdW5jOiBhbnksIHBhcmVudEN0b3I6IGFueSk6IHtba2V5OiBzdHJpbmddOiBhbnlbXX18bnVsbCB7XG4gICAgLy8gUHJlZmVyIHRoZSBkaXJlY3QgQVBJLlxuICAgIGlmICgoPGFueT50eXBlT3JGdW5jKS5wcm9wTWV0YWRhdGEgJiZcbiAgICAgICAgKDxhbnk+dHlwZU9yRnVuYykucHJvcE1ldGFkYXRhICE9PSBwYXJlbnRDdG9yLnByb3BNZXRhZGF0YSkge1xuICAgICAgbGV0IHByb3BNZXRhZGF0YSA9ICg8YW55PnR5cGVPckZ1bmMpLnByb3BNZXRhZGF0YTtcbiAgICAgIGlmICh0eXBlb2YgcHJvcE1ldGFkYXRhID09PSAnZnVuY3Rpb24nICYmIHByb3BNZXRhZGF0YS5wcm9wTWV0YWRhdGEpIHtcbiAgICAgICAgcHJvcE1ldGFkYXRhID0gcHJvcE1ldGFkYXRhLnByb3BNZXRhZGF0YTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwcm9wTWV0YWRhdGE7XG4gICAgfVxuXG4gICAgLy8gQVBJIG9mIHRzaWNrbGUgZm9yIGxvd2VyaW5nIGRlY29yYXRvcnMgdG8gcHJvcGVydGllcyBvbiB0aGUgY2xhc3MuXG4gICAgaWYgKCg8YW55PnR5cGVPckZ1bmMpLnByb3BEZWNvcmF0b3JzICYmXG4gICAgICAgICg8YW55PnR5cGVPckZ1bmMpLnByb3BEZWNvcmF0b3JzICE9PSBwYXJlbnRDdG9yLnByb3BEZWNvcmF0b3JzKSB7XG4gICAgICBjb25zdCBwcm9wRGVjb3JhdG9ycyA9ICg8YW55PnR5cGVPckZ1bmMpLnByb3BEZWNvcmF0b3JzO1xuICAgICAgY29uc3QgcHJvcE1ldGFkYXRhID0gPHtba2V5OiBzdHJpbmddOiBhbnlbXX0+e307XG4gICAgICBPYmplY3Qua2V5cyhwcm9wRGVjb3JhdG9ycykuZm9yRWFjaChwcm9wID0+IHtcbiAgICAgICAgcHJvcE1ldGFkYXRhW3Byb3BdID0gY29udmVydFRzaWNrbGVEZWNvcmF0b3JJbnRvTWV0YWRhdGEocHJvcERlY29yYXRvcnNbcHJvcF0pO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gcHJvcE1ldGFkYXRhO1xuICAgIH1cblxuICAgIC8vIEFQSSBmb3IgbWV0YWRhdGEgY3JlYXRlZCBieSBpbnZva2luZyB0aGUgZGVjb3JhdG9ycy5cbiAgICBpZiAodHlwZU9yRnVuYy5oYXNPd25Qcm9wZXJ0eShQUk9QX01FVEFEQVRBKSkge1xuICAgICAgcmV0dXJuICh0eXBlT3JGdW5jIGFzIGFueSlbUFJPUF9NRVRBREFUQV07XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJvcE1ldGFkYXRhKHR5cGVPckZ1bmM6IGFueSk6IHtba2V5OiBzdHJpbmddOiBhbnlbXX0ge1xuICAgIGlmICghaXNUeXBlKHR5cGVPckZ1bmMpKSB7XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuICAgIGNvbnN0IHBhcmVudEN0b3IgPSBnZXRQYXJlbnRDdG9yKHR5cGVPckZ1bmMpO1xuICAgIGNvbnN0IHByb3BNZXRhZGF0YToge1trZXk6IHN0cmluZ106IGFueVtdfSA9IHt9O1xuICAgIGlmIChwYXJlbnRDdG9yICE9PSBPYmplY3QpIHtcbiAgICAgIGNvbnN0IHBhcmVudFByb3BNZXRhZGF0YSA9IHRoaXMucHJvcE1ldGFkYXRhKHBhcmVudEN0b3IpO1xuICAgICAgT2JqZWN0LmtleXMocGFyZW50UHJvcE1ldGFkYXRhKS5mb3JFYWNoKChwcm9wTmFtZSkgPT4ge1xuICAgICAgICBwcm9wTWV0YWRhdGFbcHJvcE5hbWVdID0gcGFyZW50UHJvcE1ldGFkYXRhW3Byb3BOYW1lXTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zdCBvd25Qcm9wTWV0YWRhdGEgPSB0aGlzLl9vd25Qcm9wTWV0YWRhdGEodHlwZU9yRnVuYywgcGFyZW50Q3Rvcik7XG4gICAgaWYgKG93blByb3BNZXRhZGF0YSkge1xuICAgICAgT2JqZWN0LmtleXMob3duUHJvcE1ldGFkYXRhKS5mb3JFYWNoKChwcm9wTmFtZSkgPT4ge1xuICAgICAgICBjb25zdCBkZWNvcmF0b3JzOiBhbnlbXSA9IFtdO1xuICAgICAgICBpZiAocHJvcE1ldGFkYXRhLmhhc093blByb3BlcnR5KHByb3BOYW1lKSkge1xuICAgICAgICAgIGRlY29yYXRvcnMucHVzaCguLi5wcm9wTWV0YWRhdGFbcHJvcE5hbWVdKTtcbiAgICAgICAgfVxuICAgICAgICBkZWNvcmF0b3JzLnB1c2goLi4ub3duUHJvcE1ldGFkYXRhW3Byb3BOYW1lXSk7XG4gICAgICAgIHByb3BNZXRhZGF0YVtwcm9wTmFtZV0gPSBkZWNvcmF0b3JzO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBwcm9wTWV0YWRhdGE7XG4gIH1cblxuICBvd25Qcm9wTWV0YWRhdGEodHlwZU9yRnVuYzogYW55KToge1trZXk6IHN0cmluZ106IGFueVtdfSB7XG4gICAgaWYgKCFpc1R5cGUodHlwZU9yRnVuYykpIHtcbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX293blByb3BNZXRhZGF0YSh0eXBlT3JGdW5jLCBPYmplY3QpIHx8IHt9O1xuICB9XG5cbiAgaGFzTGlmZWN5Y2xlSG9vayh0eXBlOiBhbnksIGxjUHJvcGVydHk6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0eXBlIGluc3RhbmNlb2YgVHlwZSAmJiBsY1Byb3BlcnR5IGluIHR5cGUucHJvdG90eXBlO1xuICB9XG5cbiAgZ3VhcmRzKHR5cGU6IGFueSk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHsgcmV0dXJuIHt9OyB9XG5cbiAgZ2V0dGVyKG5hbWU6IHN0cmluZyk6IEdldHRlckZuIHsgcmV0dXJuIDxHZXR0ZXJGbj5uZXcgRnVuY3Rpb24oJ28nLCAncmV0dXJuIG8uJyArIG5hbWUgKyAnOycpOyB9XG5cbiAgc2V0dGVyKG5hbWU6IHN0cmluZyk6IFNldHRlckZuIHtcbiAgICByZXR1cm4gPFNldHRlckZuPm5ldyBGdW5jdGlvbignbycsICd2JywgJ3JldHVybiBvLicgKyBuYW1lICsgJyA9IHY7Jyk7XG4gIH1cblxuICBtZXRob2QobmFtZTogc3RyaW5nKTogTWV0aG9kRm4ge1xuICAgIGNvbnN0IGZ1bmN0aW9uQm9keSA9IGBpZiAoIW8uJHtuYW1lfSkgdGhyb3cgbmV3IEVycm9yKCdcIiR7bmFtZX1cIiBpcyB1bmRlZmluZWQnKTtcbiAgICAgICAgcmV0dXJuIG8uJHtuYW1lfS5hcHBseShvLCBhcmdzKTtgO1xuICAgIHJldHVybiA8TWV0aG9kRm4+bmV3IEZ1bmN0aW9uKCdvJywgJ2FyZ3MnLCBmdW5jdGlvbkJvZHkpO1xuICB9XG5cbiAgLy8gVGhlcmUgaXMgbm90IGEgY29uY2VwdCBvZiBpbXBvcnQgdXJpIGluIEpzLCBidXQgdGhpcyBpcyB1c2VmdWwgaW4gZGV2ZWxvcGluZyBEYXJ0IGFwcGxpY2F0aW9ucy5cbiAgaW1wb3J0VXJpKHR5cGU6IGFueSk6IHN0cmluZyB7XG4gICAgLy8gU3RhdGljU3ltYm9sXG4gICAgaWYgKHR5cGVvZiB0eXBlID09PSAnb2JqZWN0JyAmJiB0eXBlWydmaWxlUGF0aCddKSB7XG4gICAgICByZXR1cm4gdHlwZVsnZmlsZVBhdGgnXTtcbiAgICB9XG4gICAgLy8gUnVudGltZSB0eXBlXG4gICAgcmV0dXJuIGAuLyR7c3RyaW5naWZ5KHR5cGUpfWA7XG4gIH1cblxuICByZXNvdXJjZVVyaSh0eXBlOiBhbnkpOiBzdHJpbmcgeyByZXR1cm4gYC4vJHtzdHJpbmdpZnkodHlwZSl9YDsgfVxuXG4gIHJlc29sdmVJZGVudGlmaWVyKG5hbWU6IHN0cmluZywgbW9kdWxlVXJsOiBzdHJpbmcsIG1lbWJlcnM6IHN0cmluZ1tdLCBydW50aW1lOiBhbnkpOiBhbnkge1xuICAgIHJldHVybiBydW50aW1lO1xuICB9XG4gIHJlc29sdmVFbnVtKGVudW1JZGVudGlmaWVyOiBhbnksIG5hbWU6IHN0cmluZyk6IGFueSB7IHJldHVybiBlbnVtSWRlbnRpZmllcltuYW1lXTsgfVxufVxuXG5mdW5jdGlvbiBjb252ZXJ0VHNpY2tsZURlY29yYXRvckludG9NZXRhZGF0YShkZWNvcmF0b3JJbnZvY2F0aW9uczogYW55W10pOiBhbnlbXSB7XG4gIGlmICghZGVjb3JhdG9ySW52b2NhdGlvbnMpIHtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgcmV0dXJuIGRlY29yYXRvckludm9jYXRpb25zLm1hcChkZWNvcmF0b3JJbnZvY2F0aW9uID0+IHtcbiAgICBjb25zdCBkZWNvcmF0b3JUeXBlID0gZGVjb3JhdG9ySW52b2NhdGlvbi50eXBlO1xuICAgIGNvbnN0IGFubm90YXRpb25DbHMgPSBkZWNvcmF0b3JUeXBlLmFubm90YXRpb25DbHM7XG4gICAgY29uc3QgYW5ub3RhdGlvbkFyZ3MgPSBkZWNvcmF0b3JJbnZvY2F0aW9uLmFyZ3MgPyBkZWNvcmF0b3JJbnZvY2F0aW9uLmFyZ3MgOiBbXTtcbiAgICByZXR1cm4gbmV3IGFubm90YXRpb25DbHMoLi4uYW5ub3RhdGlvbkFyZ3MpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0UGFyZW50Q3RvcihjdG9yOiBGdW5jdGlvbik6IFR5cGU8YW55PiB7XG4gIGNvbnN0IHBhcmVudFByb3RvID0gY3Rvci5wcm90b3R5cGUgPyBPYmplY3QuZ2V0UHJvdG90eXBlT2YoY3Rvci5wcm90b3R5cGUpIDogbnVsbDtcbiAgY29uc3QgcGFyZW50Q3RvciA9IHBhcmVudFByb3RvID8gcGFyZW50UHJvdG8uY29uc3RydWN0b3IgOiBudWxsO1xuICAvLyBOb3RlOiBXZSBhbHdheXMgdXNlIGBPYmplY3RgIGFzIHRoZSBudWxsIHZhbHVlXG4gIC8vIHRvIHNpbXBsaWZ5IGNoZWNraW5nIGxhdGVyIG9uLlxuICByZXR1cm4gcGFyZW50Q3RvciB8fCBPYmplY3Q7XG59XG4iXX0=