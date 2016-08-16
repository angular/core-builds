/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { global, isFunction, isPresent, stringify } from '../facade/lang';
import { Type } from '../type';
export class ReflectionCapabilities {
    constructor(reflect) {
        this._reflect = reflect || global.Reflect;
    }
    isReflectionEnabled() { return true; }
    factory(t) {
        var prototype = t.prototype;
        return function (...args) {
            var instance = Object.create(prototype);
            t.apply(instance, args);
            return instance;
        };
    }
    /** @internal */
    _zipTypesAndAnnotations(paramTypes /** TODO #9100 */, paramAnnotations /** TODO #9100 */) {
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
            if (isPresent(paramAnnotations) && isPresent(paramAnnotations[i])) {
                result[i] = result[i].concat(paramAnnotations[i]);
            }
        }
        return result;
    }
    parameters(typeOrFunc) {
        // Prefer the direct API.
        if (isPresent(typeOrFunc.parameters)) {
            return typeOrFunc.parameters;
        }
        // API of tsickle for lowering decorators to properties on the class.
        if (isPresent(typeOrFunc.ctorParameters)) {
            let ctorParameters = typeOrFunc.ctorParameters;
            let paramTypes = ctorParameters.map((ctorParam /** TODO #9100 */) => ctorParam && ctorParam.type);
            let paramAnnotations = ctorParameters.map((ctorParam /** TODO #9100 */) => ctorParam && convertTsickleDecoratorIntoMetadata(ctorParam.decorators));
            return this._zipTypesAndAnnotations(paramTypes, paramAnnotations);
        }
        // API for metadata created by invoking the decorators.
        if (isPresent(this._reflect) && isPresent(this._reflect.getMetadata)) {
            var paramAnnotations = this._reflect.getMetadata('parameters', typeOrFunc);
            var paramTypes = this._reflect.getMetadata('design:paramtypes', typeOrFunc);
            if (isPresent(paramTypes) || isPresent(paramAnnotations)) {
                return this._zipTypesAndAnnotations(paramTypes, paramAnnotations);
            }
        }
        // The array has to be filled with `undefined` because holes would be skipped by `some`
        let parameters = new Array(typeOrFunc.length);
        parameters.fill(undefined);
        return parameters;
    }
    annotations(typeOrFunc) {
        // Prefer the direct API.
        if (isPresent(typeOrFunc.annotations)) {
            var annotations = typeOrFunc.annotations;
            if (isFunction(annotations) && annotations.annotations) {
                annotations = annotations.annotations;
            }
            return annotations;
        }
        // API of tsickle for lowering decorators to properties on the class.
        if (isPresent(typeOrFunc.decorators)) {
            return convertTsickleDecoratorIntoMetadata(typeOrFunc.decorators);
        }
        // API for metadata created by invoking the decorators.
        if (isPresent(this._reflect) && isPresent(this._reflect.getMetadata)) {
            var annotations = this._reflect.getMetadata('annotations', typeOrFunc);
            if (isPresent(annotations))
                return annotations;
        }
        return [];
    }
    propMetadata(typeOrFunc) {
        // Prefer the direct API.
        if (isPresent(typeOrFunc.propMetadata)) {
            var propMetadata = typeOrFunc.propMetadata;
            if (isFunction(propMetadata) && propMetadata.propMetadata) {
                propMetadata = propMetadata.propMetadata;
            }
            return propMetadata;
        }
        // API of tsickle for lowering decorators to properties on the class.
        if (isPresent(typeOrFunc.propDecorators)) {
            let propDecorators = typeOrFunc.propDecorators;
            let propMetadata = {};
            Object.keys(propDecorators).forEach(prop => {
                propMetadata[prop] = convertTsickleDecoratorIntoMetadata(propDecorators[prop]);
            });
            return propMetadata;
        }
        // API for metadata created by invoking the decorators.
        if (isPresent(this._reflect) && isPresent(this._reflect.getMetadata)) {
            var propMetadata = this._reflect.getMetadata('propMetadata', typeOrFunc);
            if (isPresent(propMetadata))
                return propMetadata;
        }
        return {};
    }
    // Note: JavaScript does not support to query for interfaces during runtime.
    // However, we can't throw here as the reflector will always call this method
    // when asked for a lifecycle interface as this is what we check in Dart.
    interfaces(type) { return []; }
    hasLifecycleHook(type, lcInterface, lcProperty) {
        if (!(type instanceof Type))
            return false;
        var proto = type.prototype;
        return !!proto[lcProperty];
    }
    getter(name) { return new Function('o', 'return o.' + name + ';'); }
    setter(name) {
        return new Function('o', 'v', 'return o.' + name + ' = v;');
    }
    method(name) {
        let functionBody = `if (!o.${name}) throw new Error('"${name}" is undefined');
        return o.${name}.apply(o, args);`;
        return new Function('o', 'args', functionBody);
    }
    // There is not a concept of import uri in Js, but this is useful in developing Dart applications.
    importUri(type) {
        // StaticSymbol
        if (typeof type === 'object' && type['filePath']) {
            return type['filePath'];
        }
        // Runtime type
        return `./${stringify(type)}`;
    }
}
function convertTsickleDecoratorIntoMetadata(decoratorInvocations) {
    if (!decoratorInvocations) {
        return [];
    }
    return decoratorInvocations.map(decoratorInvocation => {
        var decoratorType = decoratorInvocation.type;
        var annotationCls = decoratorType.annotationCls;
        var annotationArgs = decoratorInvocation.args ? decoratorInvocation.args : [];
        var annotation = Object.create(annotationCls.prototype);
        annotationCls.apply(annotation, annotationArgs);
        return annotation;
    });
}
//# sourceMappingURL=reflection_capabilities.js.map