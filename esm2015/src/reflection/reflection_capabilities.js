/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Type, isType } from '../type';
import { global, stringify } from '../util';
import { ANNOTATIONS, PARAMETERS, PROP_METADATA } from '../util/decorators';
/** *
 * Attention: These regex has to hold even if the code is minified!
  @type {?} */
export const DELEGATE_CTOR = /^function\s+\S+\(\)\s*{[\s\S]+\.apply\(this,\s*arguments\)/;
/** @type {?} */
export const INHERITED_CLASS = /^class\s+[A-Za-z\d$_]*\s*extends\s+[A-Za-z\d$_]+\s*{/;
/** @type {?} */
export const INHERITED_CLASS_WITH_CTOR = /^class\s+[A-Za-z\d$_]*\s*extends\s+[A-Za-z\d$_]+\s*{[\s\S]*constructor\s*\(/;
export class ReflectionCapabilities {
    /**
     * @param {?=} reflect
     */
    constructor(reflect) { this._reflect = reflect || global['Reflect']; }
    /**
     * @return {?}
     */
    isReflectionEnabled() { return true; }
    /**
     * @template T
     * @param {?} t
     * @return {?}
     */
    factory(t) { return (...args) => new t(...args); }
    /**
     * \@internal
     * @param {?} paramTypes
     * @param {?} paramAnnotations
     * @return {?}
     */
    _zipTypesAndAnnotations(paramTypes, paramAnnotations) {
        /** @type {?} */
        let result;
        if (typeof paramTypes === 'undefined') {
            result = new Array(paramAnnotations.length);
        }
        else {
            result = new Array(paramTypes.length);
        }
        for (let i = 0; i < result.length; i++) {
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
    }
    /**
     * @param {?} type
     * @param {?} parentCtor
     * @return {?}
     */
    _ownParameters(type, parentCtor) {
        /** @type {?} */
        const typeStr = type.toString();
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
        if ((/** @type {?} */ (type)).parameters && (/** @type {?} */ (type)).parameters !== parentCtor.parameters) {
            return (/** @type {?} */ (type)).parameters;
        }
        /** @type {?} */
        const tsickleCtorParams = (/** @type {?} */ (type)).ctorParameters;
        if (tsickleCtorParams && tsickleCtorParams !== parentCtor.ctorParameters) {
            /** @type {?} */
            const ctorParameters = typeof tsickleCtorParams === 'function' ? tsickleCtorParams() : tsickleCtorParams;
            /** @type {?} */
            const paramTypes = ctorParameters.map((ctorParam) => ctorParam && ctorParam.type);
            /** @type {?} */
            const paramAnnotations = ctorParameters.map((ctorParam) => ctorParam && convertTsickleDecoratorIntoMetadata(ctorParam.decorators));
            return this._zipTypesAndAnnotations(paramTypes, paramAnnotations);
        }
        /** @type {?} */
        const paramAnnotations = type.hasOwnProperty(PARAMETERS) && (/** @type {?} */ (type))[PARAMETERS];
        /** @type {?} */
        const paramTypes = this._reflect && this._reflect.getOwnMetadata &&
            this._reflect.getOwnMetadata('design:paramtypes', type);
        if (paramTypes || paramAnnotations) {
            return this._zipTypesAndAnnotations(paramTypes, paramAnnotations);
        }
        // If a class has no decorators, at least create metadata
        // based on function.length.
        // Note: We know that this is a real constructor as we checked
        // the content of the constructor above.
        return new Array((/** @type {?} */ (type.length))).fill(undefined);
    }
    /**
     * @param {?} type
     * @return {?}
     */
    parameters(type) {
        // Note: only report metadata if we have at least one class decorator
        // to stay in sync with the static reflector.
        if (!isType(type)) {
            return [];
        }
        /** @type {?} */
        const parentCtor = getParentCtor(type);
        /** @type {?} */
        let parameters = this._ownParameters(type, parentCtor);
        if (!parameters && parentCtor !== Object) {
            parameters = this.parameters(parentCtor);
        }
        return parameters || [];
    }
    /**
     * @param {?} typeOrFunc
     * @param {?} parentCtor
     * @return {?}
     */
    _ownAnnotations(typeOrFunc, parentCtor) {
        // Prefer the direct API.
        if ((/** @type {?} */ (typeOrFunc)).annotations && (/** @type {?} */ (typeOrFunc)).annotations !== parentCtor.annotations) {
            /** @type {?} */
            let annotations = (/** @type {?} */ (typeOrFunc)).annotations;
            if (typeof annotations === 'function' && annotations.annotations) {
                annotations = annotations.annotations;
            }
            return annotations;
        }
        // API of tsickle for lowering decorators to properties on the class.
        if ((/** @type {?} */ (typeOrFunc)).decorators && (/** @type {?} */ (typeOrFunc)).decorators !== parentCtor.decorators) {
            return convertTsickleDecoratorIntoMetadata((/** @type {?} */ (typeOrFunc)).decorators);
        }
        // API for metadata created by invoking the decorators.
        if (typeOrFunc.hasOwnProperty(ANNOTATIONS)) {
            return (/** @type {?} */ (typeOrFunc))[ANNOTATIONS];
        }
        return null;
    }
    /**
     * @param {?} typeOrFunc
     * @return {?}
     */
    annotations(typeOrFunc) {
        if (!isType(typeOrFunc)) {
            return [];
        }
        /** @type {?} */
        const parentCtor = getParentCtor(typeOrFunc);
        /** @type {?} */
        const ownAnnotations = this._ownAnnotations(typeOrFunc, parentCtor) || [];
        /** @type {?} */
        const parentAnnotations = parentCtor !== Object ? this.annotations(parentCtor) : [];
        return parentAnnotations.concat(ownAnnotations);
    }
    /**
     * @param {?} typeOrFunc
     * @param {?} parentCtor
     * @return {?}
     */
    _ownPropMetadata(typeOrFunc, parentCtor) {
        // Prefer the direct API.
        if ((/** @type {?} */ (typeOrFunc)).propMetadata &&
            (/** @type {?} */ (typeOrFunc)).propMetadata !== parentCtor.propMetadata) {
            /** @type {?} */
            let propMetadata = (/** @type {?} */ (typeOrFunc)).propMetadata;
            if (typeof propMetadata === 'function' && propMetadata.propMetadata) {
                propMetadata = propMetadata.propMetadata;
            }
            return propMetadata;
        }
        // API of tsickle for lowering decorators to properties on the class.
        if ((/** @type {?} */ (typeOrFunc)).propDecorators &&
            (/** @type {?} */ (typeOrFunc)).propDecorators !== parentCtor.propDecorators) {
            /** @type {?} */
            const propDecorators = (/** @type {?} */ (typeOrFunc)).propDecorators;
            /** @type {?} */
            const propMetadata = /** @type {?} */ ({});
            Object.keys(propDecorators).forEach(prop => {
                propMetadata[prop] = convertTsickleDecoratorIntoMetadata(propDecorators[prop]);
            });
            return propMetadata;
        }
        // API for metadata created by invoking the decorators.
        if (typeOrFunc.hasOwnProperty(PROP_METADATA)) {
            return (/** @type {?} */ (typeOrFunc))[PROP_METADATA];
        }
        return null;
    }
    /**
     * @param {?} typeOrFunc
     * @return {?}
     */
    propMetadata(typeOrFunc) {
        if (!isType(typeOrFunc)) {
            return {};
        }
        /** @type {?} */
        const parentCtor = getParentCtor(typeOrFunc);
        /** @type {?} */
        const propMetadata = {};
        if (parentCtor !== Object) {
            /** @type {?} */
            const parentPropMetadata = this.propMetadata(parentCtor);
            Object.keys(parentPropMetadata).forEach((propName) => {
                propMetadata[propName] = parentPropMetadata[propName];
            });
        }
        /** @type {?} */
        const ownPropMetadata = this._ownPropMetadata(typeOrFunc, parentCtor);
        if (ownPropMetadata) {
            Object.keys(ownPropMetadata).forEach((propName) => {
                /** @type {?} */
                const decorators = [];
                if (propMetadata.hasOwnProperty(propName)) {
                    decorators.push(...propMetadata[propName]);
                }
                decorators.push(...ownPropMetadata[propName]);
                propMetadata[propName] = decorators;
            });
        }
        return propMetadata;
    }
    /**
     * @param {?} type
     * @param {?} lcProperty
     * @return {?}
     */
    hasLifecycleHook(type, lcProperty) {
        return type instanceof Type && lcProperty in type.prototype;
    }
    /**
     * @param {?} type
     * @return {?}
     */
    guards(type) { return {}; }
    /**
     * @param {?} name
     * @return {?}
     */
    getter(name) { return /** @type {?} */ (new Function('o', 'return o.' + name + ';')); }
    /**
     * @param {?} name
     * @return {?}
     */
    setter(name) {
        return /** @type {?} */ (new Function('o', 'v', 'return o.' + name + ' = v;'));
    }
    /**
     * @param {?} name
     * @return {?}
     */
    method(name) {
        /** @type {?} */
        const functionBody = `if (!o.${name}) throw new Error('"${name}" is undefined');
        return o.${name}.apply(o, args);`;
        return /** @type {?} */ (new Function('o', 'args', functionBody));
    }
    /**
     * @param {?} type
     * @return {?}
     */
    importUri(type) {
        // StaticSymbol
        if (typeof type === 'object' && type['filePath']) {
            return type['filePath'];
        }
        // Runtime type
        return `./${stringify(type)}`;
    }
    /**
     * @param {?} type
     * @return {?}
     */
    resourceUri(type) { return `./${stringify(type)}`; }
    /**
     * @param {?} name
     * @param {?} moduleUrl
     * @param {?} members
     * @param {?} runtime
     * @return {?}
     */
    resolveIdentifier(name, moduleUrl, members, runtime) {
        return runtime;
    }
    /**
     * @param {?} enumIdentifier
     * @param {?} name
     * @return {?}
     */
    resolveEnum(enumIdentifier, name) { return enumIdentifier[name]; }
}
if (false) {
    /** @type {?} */
    ReflectionCapabilities.prototype._reflect;
}
/**
 * @param {?} decoratorInvocations
 * @return {?}
 */
function convertTsickleDecoratorIntoMetadata(decoratorInvocations) {
    if (!decoratorInvocations) {
        return [];
    }
    return decoratorInvocations.map(decoratorInvocation => {
        /** @type {?} */
        const decoratorType = decoratorInvocation.type;
        /** @type {?} */
        const annotationCls = decoratorType.annotationCls;
        /** @type {?} */
        const annotationArgs = decoratorInvocation.args ? decoratorInvocation.args : [];
        return new annotationCls(...annotationArgs);
    });
}
/**
 * @param {?} ctor
 * @return {?}
 */
function getParentCtor(ctor) {
    /** @type {?} */
    const parentProto = ctor.prototype ? Object.getPrototypeOf(ctor.prototype) : null;
    /** @type {?} */
    const parentCtor = parentProto ? parentProto.constructor : null;
    // Note: We always use `Object` as the null value
    // to simplify checking later on.
    return parentCtor || Object;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdGlvbl9jYXBhYmlsaXRpZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZWZsZWN0aW9uL3JlZmxlY3Rpb25fY2FwYWJpbGl0aWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDckMsT0FBTyxFQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDMUMsT0FBTyxFQUFDLFdBQVcsRUFBRSxVQUFVLEVBQUUsYUFBYSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7Ozs7QUFTMUUsYUFBYSxhQUFhLEdBQUcsNERBQTRELENBQUM7O0FBQzFGLGFBQWEsZUFBZSxHQUFHLHNEQUFzRCxDQUFDOztBQUN0RixhQUFhLHlCQUF5QixHQUNsQyw2RUFBNkUsQ0FBQztBQUVsRixNQUFNLE9BQU8sc0JBQXNCOzs7O0lBR2pDLFlBQVksT0FBYSxJQUFJLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxJQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFOzs7O0lBRTVFLG1CQUFtQixLQUFjLE9BQU8sSUFBSSxDQUFDLEVBQUU7Ozs7OztJQUUvQyxPQUFPLENBQUksQ0FBVSxJQUF3QixPQUFPLENBQUMsR0FBRyxJQUFXLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRTs7Ozs7OztJQUd6Rix1QkFBdUIsQ0FBQyxVQUFpQixFQUFFLGdCQUF1Qjs7UUFDaEUsSUFBSSxNQUFNLENBQVU7UUFFcEIsSUFBSSxPQUFPLFVBQVUsS0FBSyxXQUFXLEVBQUU7WUFDckMsTUFBTSxHQUFHLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQzdDO2FBQU07WUFDTCxNQUFNLEdBQUcs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Q0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQzs7SUFDbEYsTUFBTSxVQUFVLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7OztJQUdoRSxPQUFPLFVBQVUsSUFBSSxNQUFNLENBQUM7Q0FDN0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZSwgaXNUeXBlfSBmcm9tICcuLi90eXBlJztcbmltcG9ydCB7Z2xvYmFsLCBzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwnO1xuaW1wb3J0IHtBTk5PVEFUSU9OUywgUEFSQU1FVEVSUywgUFJPUF9NRVRBREFUQX0gZnJvbSAnLi4vdXRpbC9kZWNvcmF0b3JzJztcblxuaW1wb3J0IHtQbGF0Zm9ybVJlZmxlY3Rpb25DYXBhYmlsaXRpZXN9IGZyb20gJy4vcGxhdGZvcm1fcmVmbGVjdGlvbl9jYXBhYmlsaXRpZXMnO1xuaW1wb3J0IHtHZXR0ZXJGbiwgTWV0aG9kRm4sIFNldHRlckZufSBmcm9tICcuL3R5cGVzJztcblxuXG4vKipcbiAqIEF0dGVudGlvbjogVGhlc2UgcmVnZXggaGFzIHRvIGhvbGQgZXZlbiBpZiB0aGUgY29kZSBpcyBtaW5pZmllZCFcbiAqL1xuZXhwb3J0IGNvbnN0IERFTEVHQVRFX0NUT1IgPSAvXmZ1bmN0aW9uXFxzK1xcUytcXChcXClcXHMqe1tcXHNcXFNdK1xcLmFwcGx5XFwodGhpcyxcXHMqYXJndW1lbnRzXFwpLztcbmV4cG9ydCBjb25zdCBJTkhFUklURURfQ0xBU1MgPSAvXmNsYXNzXFxzK1tBLVphLXpcXGQkX10qXFxzKmV4dGVuZHNcXHMrW0EtWmEtelxcZCRfXStcXHMqey87XG5leHBvcnQgY29uc3QgSU5IRVJJVEVEX0NMQVNTX1dJVEhfQ1RPUiA9XG4gICAgL15jbGFzc1xccytbQS1aYS16XFxkJF9dKlxccypleHRlbmRzXFxzK1tBLVphLXpcXGQkX10rXFxzKntbXFxzXFxTXSpjb25zdHJ1Y3RvclxccypcXCgvO1xuXG5leHBvcnQgY2xhc3MgUmVmbGVjdGlvbkNhcGFiaWxpdGllcyBpbXBsZW1lbnRzIFBsYXRmb3JtUmVmbGVjdGlvbkNhcGFiaWxpdGllcyB7XG4gIHByaXZhdGUgX3JlZmxlY3Q6IGFueTtcblxuICBjb25zdHJ1Y3RvcihyZWZsZWN0PzogYW55KSB7IHRoaXMuX3JlZmxlY3QgPSByZWZsZWN0IHx8IGdsb2JhbFsnUmVmbGVjdCddOyB9XG5cbiAgaXNSZWZsZWN0aW9uRW5hYmxlZCgpOiBib29sZWFuIHsgcmV0dXJuIHRydWU7IH1cblxuICBmYWN0b3J5PFQ+KHQ6IFR5cGU8VD4pOiAoYXJnczogYW55W10pID0+IFQgeyByZXR1cm4gKC4uLmFyZ3M6IGFueVtdKSA9PiBuZXcgdCguLi5hcmdzKTsgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3ppcFR5cGVzQW5kQW5ub3RhdGlvbnMocGFyYW1UeXBlczogYW55W10sIHBhcmFtQW5ub3RhdGlvbnM6IGFueVtdKTogYW55W11bXSB7XG4gICAgbGV0IHJlc3VsdDogYW55W11bXTtcblxuICAgIGlmICh0eXBlb2YgcGFyYW1UeXBlcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJlc3VsdCA9IG5ldyBBcnJheShwYXJhbUFubm90YXRpb25zLmxlbmd0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCA9IG5ldyBBcnJheShwYXJhbVR5cGVzLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZXN1bHQubGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIFRTIG91dHB1dHMgT2JqZWN0IGZvciBwYXJhbWV0ZXJzIHdpdGhvdXQgdHlwZXMsIHdoaWxlIFRyYWNldXIgb21pdHNcbiAgICAgIC8vIHRoZSBhbm5vdGF0aW9ucy4gRm9yIG5vdyB3ZSBwcmVzZXJ2ZSB0aGUgVHJhY2V1ciBiZWhhdmlvciB0byBhaWRcbiAgICAgIC8vIG1pZ3JhdGlvbiwgYnV0IHRoaXMgY2FuIGJlIHJldmlzaXRlZC5cbiAgICAgIGlmICh0eXBlb2YgcGFyYW1UeXBlcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmVzdWx0W2ldID0gW107XG4gICAgICB9IGVsc2UgaWYgKHBhcmFtVHlwZXNbaV0gIT0gT2JqZWN0KSB7XG4gICAgICAgIHJlc3VsdFtpXSA9IFtwYXJhbVR5cGVzW2ldXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdFtpXSA9IFtdO1xuICAgICAgfVxuICAgICAgaWYgKHBhcmFtQW5ub3RhdGlvbnMgJiYgcGFyYW1Bbm5vdGF0aW9uc1tpXSAhPSBudWxsKSB7XG4gICAgICAgIHJlc3VsdFtpXSA9IHJlc3VsdFtpXS5jb25jYXQocGFyYW1Bbm5vdGF0aW9uc1tpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwcml2YXRlIF9vd25QYXJhbWV0ZXJzKHR5cGU6IFR5cGU8YW55PiwgcGFyZW50Q3RvcjogYW55KTogYW55W11bXXxudWxsIHtcbiAgICBjb25zdCB0eXBlU3RyID0gdHlwZS50b1N0cmluZygpO1xuICAgIC8vIElmIHdlIGhhdmUgbm8gZGVjb3JhdG9ycywgd2Ugb25seSBoYXZlIGZ1bmN0aW9uLmxlbmd0aCBhcyBtZXRhZGF0YS5cbiAgICAvLyBJbiB0aGF0IGNhc2UsIHRvIGRldGVjdCB3aGV0aGVyIGEgY2hpbGQgY2xhc3MgZGVjbGFyZWQgYW4gb3duIGNvbnN0cnVjdG9yIG9yIG5vdCxcbiAgICAvLyB3ZSBuZWVkIHRvIGxvb2sgaW5zaWRlIG9mIHRoYXQgY29uc3RydWN0b3IgdG8gY2hlY2sgd2hldGhlciBpdCBpc1xuICAgIC8vIGp1c3QgY2FsbGluZyB0aGUgcGFyZW50LlxuICAgIC8vIFRoaXMgYWxzbyBoZWxwcyB0byB3b3JrIGFyb3VuZCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8xMjQzOVxuICAgIC8vIHRoYXQgc2V0cyAnZGVzaWduOnBhcmFtdHlwZXMnIHRvIFtdXG4gICAgLy8gaWYgYSBjbGFzcyBpbmhlcml0cyBmcm9tIGFub3RoZXIgY2xhc3MgYnV0IGhhcyBubyBjdG9yIGRlY2xhcmVkIGl0c2VsZi5cbiAgICBpZiAoREVMRUdBVEVfQ1RPUi5leGVjKHR5cGVTdHIpIHx8XG4gICAgICAgIChJTkhFUklURURfQ0xBU1MuZXhlYyh0eXBlU3RyKSAmJiAhSU5IRVJJVEVEX0NMQVNTX1dJVEhfQ1RPUi5leGVjKHR5cGVTdHIpKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gUHJlZmVyIHRoZSBkaXJlY3QgQVBJLlxuICAgIGlmICgoPGFueT50eXBlKS5wYXJhbWV0ZXJzICYmICg8YW55PnR5cGUpLnBhcmFtZXRlcnMgIT09IHBhcmVudEN0b3IucGFyYW1ldGVycykge1xuICAgICAgcmV0dXJuICg8YW55PnR5cGUpLnBhcmFtZXRlcnM7XG4gICAgfVxuXG4gICAgLy8gQVBJIG9mIHRzaWNrbGUgZm9yIGxvd2VyaW5nIGRlY29yYXRvcnMgdG8gcHJvcGVydGllcyBvbiB0aGUgY2xhc3MuXG4gICAgY29uc3QgdHNpY2tsZUN0b3JQYXJhbXMgPSAoPGFueT50eXBlKS5jdG9yUGFyYW1ldGVycztcbiAgICBpZiAodHNpY2tsZUN0b3JQYXJhbXMgJiYgdHNpY2tsZUN0b3JQYXJhbXMgIT09IHBhcmVudEN0b3IuY3RvclBhcmFtZXRlcnMpIHtcbiAgICAgIC8vIE5ld2VyIHRzaWNrbGUgdXNlcyBhIGZ1bmN0aW9uIGNsb3N1cmVcbiAgICAgIC8vIFJldGFpbiB0aGUgbm9uLWZ1bmN0aW9uIGNhc2UgZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBvbGRlciB0c2lja2xlXG4gICAgICBjb25zdCBjdG9yUGFyYW1ldGVycyA9XG4gICAgICAgICAgdHlwZW9mIHRzaWNrbGVDdG9yUGFyYW1zID09PSAnZnVuY3Rpb24nID8gdHNpY2tsZUN0b3JQYXJhbXMoKSA6IHRzaWNrbGVDdG9yUGFyYW1zO1xuICAgICAgY29uc3QgcGFyYW1UeXBlcyA9IGN0b3JQYXJhbWV0ZXJzLm1hcCgoY3RvclBhcmFtOiBhbnkpID0+IGN0b3JQYXJhbSAmJiBjdG9yUGFyYW0udHlwZSk7XG4gICAgICBjb25zdCBwYXJhbUFubm90YXRpb25zID0gY3RvclBhcmFtZXRlcnMubWFwKFxuICAgICAgICAgIChjdG9yUGFyYW06IGFueSkgPT5cbiAgICAgICAgICAgICAgY3RvclBhcmFtICYmIGNvbnZlcnRUc2lja2xlRGVjb3JhdG9ySW50b01ldGFkYXRhKGN0b3JQYXJhbS5kZWNvcmF0b3JzKSk7XG4gICAgICByZXR1cm4gdGhpcy5femlwVHlwZXNBbmRBbm5vdGF0aW9ucyhwYXJhbVR5cGVzLCBwYXJhbUFubm90YXRpb25zKTtcbiAgICB9XG5cbiAgICAvLyBBUEkgZm9yIG1ldGFkYXRhIGNyZWF0ZWQgYnkgaW52b2tpbmcgdGhlIGRlY29yYXRvcnMuXG4gICAgY29uc3QgcGFyYW1Bbm5vdGF0aW9ucyA9IHR5cGUuaGFzT3duUHJvcGVydHkoUEFSQU1FVEVSUykgJiYgKHR5cGUgYXMgYW55KVtQQVJBTUVURVJTXTtcbiAgICBjb25zdCBwYXJhbVR5cGVzID0gdGhpcy5fcmVmbGVjdCAmJiB0aGlzLl9yZWZsZWN0LmdldE93bk1ldGFkYXRhICYmXG4gICAgICAgIHRoaXMuX3JlZmxlY3QuZ2V0T3duTWV0YWRhdGEoJ2Rlc2lnbjpwYXJhbXR5cGVzJywgdHlwZSk7XG4gICAgaWYgKHBhcmFtVHlwZXMgfHwgcGFyYW1Bbm5vdGF0aW9ucykge1xuICAgICAgcmV0dXJuIHRoaXMuX3ppcFR5cGVzQW5kQW5ub3RhdGlvbnMocGFyYW1UeXBlcywgcGFyYW1Bbm5vdGF0aW9ucyk7XG4gICAgfVxuXG4gICAgLy8gSWYgYSBjbGFzcyBoYXMgbm8gZGVjb3JhdG9ycywgYXQgbGVhc3QgY3JlYXRlIG1ldGFkYXRhXG4gICAgLy8gYmFzZWQgb24gZnVuY3Rpb24ubGVuZ3RoLlxuICAgIC8vIE5vdGU6IFdlIGtub3cgdGhhdCB0aGlzIGlzIGEgcmVhbCBjb25zdHJ1Y3RvciBhcyB3ZSBjaGVja2VkXG4gICAgLy8gdGhlIGNvbnRlbnQgb2YgdGhlIGNvbnN0cnVjdG9yIGFib3ZlLlxuICAgIHJldHVybiBuZXcgQXJyYXkoKDxhbnk+dHlwZS5sZW5ndGgpKS5maWxsKHVuZGVmaW5lZCk7XG4gIH1cblxuICBwYXJhbWV0ZXJzKHR5cGU6IFR5cGU8YW55Pik6IGFueVtdW10ge1xuICAgIC8vIE5vdGU6IG9ubHkgcmVwb3J0IG1ldGFkYXRhIGlmIHdlIGhhdmUgYXQgbGVhc3Qgb25lIGNsYXNzIGRlY29yYXRvclxuICAgIC8vIHRvIHN0YXkgaW4gc3luYyB3aXRoIHRoZSBzdGF0aWMgcmVmbGVjdG9yLlxuICAgIGlmICghaXNUeXBlKHR5cGUpKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIGNvbnN0IHBhcmVudEN0b3IgPSBnZXRQYXJlbnRDdG9yKHR5cGUpO1xuICAgIGxldCBwYXJhbWV0ZXJzID0gdGhpcy5fb3duUGFyYW1ldGVycyh0eXBlLCBwYXJlbnRDdG9yKTtcbiAgICBpZiAoIXBhcmFtZXRlcnMgJiYgcGFyZW50Q3RvciAhPT0gT2JqZWN0KSB7XG4gICAgICBwYXJhbWV0ZXJzID0gdGhpcy5wYXJhbWV0ZXJzKHBhcmVudEN0b3IpO1xuICAgIH1cbiAgICByZXR1cm4gcGFyYW1ldGVycyB8fCBbXTtcbiAgfVxuXG4gIHByaXZhdGUgX293bkFubm90YXRpb25zKHR5cGVPckZ1bmM6IFR5cGU8YW55PiwgcGFyZW50Q3RvcjogYW55KTogYW55W118bnVsbCB7XG4gICAgLy8gUHJlZmVyIHRoZSBkaXJlY3QgQVBJLlxuICAgIGlmICgoPGFueT50eXBlT3JGdW5jKS5hbm5vdGF0aW9ucyAmJiAoPGFueT50eXBlT3JGdW5jKS5hbm5vdGF0aW9ucyAhPT0gcGFyZW50Q3Rvci5hbm5vdGF0aW9ucykge1xuICAgICAgbGV0IGFubm90YXRpb25zID0gKDxhbnk+dHlwZU9yRnVuYykuYW5ub3RhdGlvbnM7XG4gICAgICBpZiAodHlwZW9mIGFubm90YXRpb25zID09PSAnZnVuY3Rpb24nICYmIGFubm90YXRpb25zLmFubm90YXRpb25zKSB7XG4gICAgICAgIGFubm90YXRpb25zID0gYW5ub3RhdGlvbnMuYW5ub3RhdGlvbnM7XG4gICAgICB9XG4gICAgICByZXR1cm4gYW5ub3RhdGlvbnM7XG4gICAgfVxuXG4gICAgLy8gQVBJIG9mIHRzaWNrbGUgZm9yIGxvd2VyaW5nIGRlY29yYXRvcnMgdG8gcHJvcGVydGllcyBvbiB0aGUgY2xhc3MuXG4gICAgaWYgKCg8YW55PnR5cGVPckZ1bmMpLmRlY29yYXRvcnMgJiYgKDxhbnk+dHlwZU9yRnVuYykuZGVjb3JhdG9ycyAhPT0gcGFyZW50Q3Rvci5kZWNvcmF0b3JzKSB7XG4gICAgICByZXR1cm4gY29udmVydFRzaWNrbGVEZWNvcmF0b3JJbnRvTWV0YWRhdGEoKDxhbnk+dHlwZU9yRnVuYykuZGVjb3JhdG9ycyk7XG4gICAgfVxuXG4gICAgLy8gQVBJIGZvciBtZXRhZGF0YSBjcmVhdGVkIGJ5IGludm9raW5nIHRoZSBkZWNvcmF0b3JzLlxuICAgIGlmICh0eXBlT3JGdW5jLmhhc093blByb3BlcnR5KEFOTk9UQVRJT05TKSkge1xuICAgICAgcmV0dXJuICh0eXBlT3JGdW5jIGFzIGFueSlbQU5OT1RBVElPTlNdO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGFubm90YXRpb25zKHR5cGVPckZ1bmM6IFR5cGU8YW55Pik6IGFueVtdIHtcbiAgICBpZiAoIWlzVHlwZSh0eXBlT3JGdW5jKSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBjb25zdCBwYXJlbnRDdG9yID0gZ2V0UGFyZW50Q3Rvcih0eXBlT3JGdW5jKTtcbiAgICBjb25zdCBvd25Bbm5vdGF0aW9ucyA9IHRoaXMuX293bkFubm90YXRpb25zKHR5cGVPckZ1bmMsIHBhcmVudEN0b3IpIHx8IFtdO1xuICAgIGNvbnN0IHBhcmVudEFubm90YXRpb25zID0gcGFyZW50Q3RvciAhPT0gT2JqZWN0ID8gdGhpcy5hbm5vdGF0aW9ucyhwYXJlbnRDdG9yKSA6IFtdO1xuICAgIHJldHVybiBwYXJlbnRBbm5vdGF0aW9ucy5jb25jYXQob3duQW5ub3RhdGlvbnMpO1xuICB9XG5cbiAgcHJpdmF0ZSBfb3duUHJvcE1ldGFkYXRhKHR5cGVPckZ1bmM6IGFueSwgcGFyZW50Q3RvcjogYW55KToge1trZXk6IHN0cmluZ106IGFueVtdfXxudWxsIHtcbiAgICAvLyBQcmVmZXIgdGhlIGRpcmVjdCBBUEkuXG4gICAgaWYgKCg8YW55PnR5cGVPckZ1bmMpLnByb3BNZXRhZGF0YSAmJlxuICAgICAgICAoPGFueT50eXBlT3JGdW5jKS5wcm9wTWV0YWRhdGEgIT09IHBhcmVudEN0b3IucHJvcE1ldGFkYXRhKSB7XG4gICAgICBsZXQgcHJvcE1ldGFkYXRhID0gKDxhbnk+dHlwZU9yRnVuYykucHJvcE1ldGFkYXRhO1xuICAgICAgaWYgKHR5cGVvZiBwcm9wTWV0YWRhdGEgPT09ICdmdW5jdGlvbicgJiYgcHJvcE1ldGFkYXRhLnByb3BNZXRhZGF0YSkge1xuICAgICAgICBwcm9wTWV0YWRhdGEgPSBwcm9wTWV0YWRhdGEucHJvcE1ldGFkYXRhO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHByb3BNZXRhZGF0YTtcbiAgICB9XG5cbiAgICAvLyBBUEkgb2YgdHNpY2tsZSBmb3IgbG93ZXJpbmcgZGVjb3JhdG9ycyB0byBwcm9wZXJ0aWVzIG9uIHRoZSBjbGFzcy5cbiAgICBpZiAoKDxhbnk+dHlwZU9yRnVuYykucHJvcERlY29yYXRvcnMgJiZcbiAgICAgICAgKDxhbnk+dHlwZU9yRnVuYykucHJvcERlY29yYXRvcnMgIT09IHBhcmVudEN0b3IucHJvcERlY29yYXRvcnMpIHtcbiAgICAgIGNvbnN0IHByb3BEZWNvcmF0b3JzID0gKDxhbnk+dHlwZU9yRnVuYykucHJvcERlY29yYXRvcnM7XG4gICAgICBjb25zdCBwcm9wTWV0YWRhdGEgPSA8e1trZXk6IHN0cmluZ106IGFueVtdfT57fTtcbiAgICAgIE9iamVjdC5rZXlzKHByb3BEZWNvcmF0b3JzKS5mb3JFYWNoKHByb3AgPT4ge1xuICAgICAgICBwcm9wTWV0YWRhdGFbcHJvcF0gPSBjb252ZXJ0VHNpY2tsZURlY29yYXRvckludG9NZXRhZGF0YShwcm9wRGVjb3JhdG9yc1twcm9wXSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBwcm9wTWV0YWRhdGE7XG4gICAgfVxuXG4gICAgLy8gQVBJIGZvciBtZXRhZGF0YSBjcmVhdGVkIGJ5IGludm9raW5nIHRoZSBkZWNvcmF0b3JzLlxuICAgIGlmICh0eXBlT3JGdW5jLmhhc093blByb3BlcnR5KFBST1BfTUVUQURBVEEpKSB7XG4gICAgICByZXR1cm4gKHR5cGVPckZ1bmMgYXMgYW55KVtQUk9QX01FVEFEQVRBXTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcm9wTWV0YWRhdGEodHlwZU9yRnVuYzogYW55KToge1trZXk6IHN0cmluZ106IGFueVtdfSB7XG4gICAgaWYgKCFpc1R5cGUodHlwZU9yRnVuYykpIHtcbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG4gICAgY29uc3QgcGFyZW50Q3RvciA9IGdldFBhcmVudEN0b3IodHlwZU9yRnVuYyk7XG4gICAgY29uc3QgcHJvcE1ldGFkYXRhOiB7W2tleTogc3RyaW5nXTogYW55W119ID0ge307XG4gICAgaWYgKHBhcmVudEN0b3IgIT09IE9iamVjdCkge1xuICAgICAgY29uc3QgcGFyZW50UHJvcE1ldGFkYXRhID0gdGhpcy5wcm9wTWV0YWRhdGEocGFyZW50Q3Rvcik7XG4gICAgICBPYmplY3Qua2V5cyhwYXJlbnRQcm9wTWV0YWRhdGEpLmZvckVhY2goKHByb3BOYW1lKSA9PiB7XG4gICAgICAgIHByb3BNZXRhZGF0YVtwcm9wTmFtZV0gPSBwYXJlbnRQcm9wTWV0YWRhdGFbcHJvcE5hbWVdO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnN0IG93blByb3BNZXRhZGF0YSA9IHRoaXMuX293blByb3BNZXRhZGF0YSh0eXBlT3JGdW5jLCBwYXJlbnRDdG9yKTtcbiAgICBpZiAob3duUHJvcE1ldGFkYXRhKSB7XG4gICAgICBPYmplY3Qua2V5cyhvd25Qcm9wTWV0YWRhdGEpLmZvckVhY2goKHByb3BOYW1lKSA9PiB7XG4gICAgICAgIGNvbnN0IGRlY29yYXRvcnM6IGFueVtdID0gW107XG4gICAgICAgIGlmIChwcm9wTWV0YWRhdGEuaGFzT3duUHJvcGVydHkocHJvcE5hbWUpKSB7XG4gICAgICAgICAgZGVjb3JhdG9ycy5wdXNoKC4uLnByb3BNZXRhZGF0YVtwcm9wTmFtZV0pO1xuICAgICAgICB9XG4gICAgICAgIGRlY29yYXRvcnMucHVzaCguLi5vd25Qcm9wTWV0YWRhdGFbcHJvcE5hbWVdKTtcbiAgICAgICAgcHJvcE1ldGFkYXRhW3Byb3BOYW1lXSA9IGRlY29yYXRvcnM7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHByb3BNZXRhZGF0YTtcbiAgfVxuXG4gIGhhc0xpZmVjeWNsZUhvb2sodHlwZTogYW55LCBsY1Byb3BlcnR5OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHlwZSBpbnN0YW5jZW9mIFR5cGUgJiYgbGNQcm9wZXJ0eSBpbiB0eXBlLnByb3RvdHlwZTtcbiAgfVxuXG4gIGd1YXJkcyh0eXBlOiBhbnkpOiB7W2tleTogc3RyaW5nXTogYW55fSB7IHJldHVybiB7fTsgfVxuXG4gIGdldHRlcihuYW1lOiBzdHJpbmcpOiBHZXR0ZXJGbiB7IHJldHVybiA8R2V0dGVyRm4+bmV3IEZ1bmN0aW9uKCdvJywgJ3JldHVybiBvLicgKyBuYW1lICsgJzsnKTsgfVxuXG4gIHNldHRlcihuYW1lOiBzdHJpbmcpOiBTZXR0ZXJGbiB7XG4gICAgcmV0dXJuIDxTZXR0ZXJGbj5uZXcgRnVuY3Rpb24oJ28nLCAndicsICdyZXR1cm4gby4nICsgbmFtZSArICcgPSB2OycpO1xuICB9XG5cbiAgbWV0aG9kKG5hbWU6IHN0cmluZyk6IE1ldGhvZEZuIHtcbiAgICBjb25zdCBmdW5jdGlvbkJvZHkgPSBgaWYgKCFvLiR7bmFtZX0pIHRocm93IG5ldyBFcnJvcignXCIke25hbWV9XCIgaXMgdW5kZWZpbmVkJyk7XG4gICAgICAgIHJldHVybiBvLiR7bmFtZX0uYXBwbHkobywgYXJncyk7YDtcbiAgICByZXR1cm4gPE1ldGhvZEZuPm5ldyBGdW5jdGlvbignbycsICdhcmdzJywgZnVuY3Rpb25Cb2R5KTtcbiAgfVxuXG4gIC8vIFRoZXJlIGlzIG5vdCBhIGNvbmNlcHQgb2YgaW1wb3J0IHVyaSBpbiBKcywgYnV0IHRoaXMgaXMgdXNlZnVsIGluIGRldmVsb3BpbmcgRGFydCBhcHBsaWNhdGlvbnMuXG4gIGltcG9ydFVyaSh0eXBlOiBhbnkpOiBzdHJpbmcge1xuICAgIC8vIFN0YXRpY1N5bWJvbFxuICAgIGlmICh0eXBlb2YgdHlwZSA9PT0gJ29iamVjdCcgJiYgdHlwZVsnZmlsZVBhdGgnXSkge1xuICAgICAgcmV0dXJuIHR5cGVbJ2ZpbGVQYXRoJ107XG4gICAgfVxuICAgIC8vIFJ1bnRpbWUgdHlwZVxuICAgIHJldHVybiBgLi8ke3N0cmluZ2lmeSh0eXBlKX1gO1xuICB9XG5cbiAgcmVzb3VyY2VVcmkodHlwZTogYW55KTogc3RyaW5nIHsgcmV0dXJuIGAuLyR7c3RyaW5naWZ5KHR5cGUpfWA7IH1cblxuICByZXNvbHZlSWRlbnRpZmllcihuYW1lOiBzdHJpbmcsIG1vZHVsZVVybDogc3RyaW5nLCBtZW1iZXJzOiBzdHJpbmdbXSwgcnVudGltZTogYW55KTogYW55IHtcbiAgICByZXR1cm4gcnVudGltZTtcbiAgfVxuICByZXNvbHZlRW51bShlbnVtSWRlbnRpZmllcjogYW55LCBuYW1lOiBzdHJpbmcpOiBhbnkgeyByZXR1cm4gZW51bUlkZW50aWZpZXJbbmFtZV07IH1cbn1cblxuZnVuY3Rpb24gY29udmVydFRzaWNrbGVEZWNvcmF0b3JJbnRvTWV0YWRhdGEoZGVjb3JhdG9ySW52b2NhdGlvbnM6IGFueVtdKTogYW55W10ge1xuICBpZiAoIWRlY29yYXRvckludm9jYXRpb25zKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIHJldHVybiBkZWNvcmF0b3JJbnZvY2F0aW9ucy5tYXAoZGVjb3JhdG9ySW52b2NhdGlvbiA9PiB7XG4gICAgY29uc3QgZGVjb3JhdG9yVHlwZSA9IGRlY29yYXRvckludm9jYXRpb24udHlwZTtcbiAgICBjb25zdCBhbm5vdGF0aW9uQ2xzID0gZGVjb3JhdG9yVHlwZS5hbm5vdGF0aW9uQ2xzO1xuICAgIGNvbnN0IGFubm90YXRpb25BcmdzID0gZGVjb3JhdG9ySW52b2NhdGlvbi5hcmdzID8gZGVjb3JhdG9ySW52b2NhdGlvbi5hcmdzIDogW107XG4gICAgcmV0dXJuIG5ldyBhbm5vdGF0aW9uQ2xzKC4uLmFubm90YXRpb25BcmdzKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldFBhcmVudEN0b3IoY3RvcjogRnVuY3Rpb24pOiBUeXBlPGFueT4ge1xuICBjb25zdCBwYXJlbnRQcm90byA9IGN0b3IucHJvdG90eXBlID8gT2JqZWN0LmdldFByb3RvdHlwZU9mKGN0b3IucHJvdG90eXBlKSA6IG51bGw7XG4gIGNvbnN0IHBhcmVudEN0b3IgPSBwYXJlbnRQcm90byA/IHBhcmVudFByb3RvLmNvbnN0cnVjdG9yIDogbnVsbDtcbiAgLy8gTm90ZTogV2UgYWx3YXlzIHVzZSBgT2JqZWN0YCBhcyB0aGUgbnVsbCB2YWx1ZVxuICAvLyB0byBzaW1wbGlmeSBjaGVja2luZyBsYXRlciBvbi5cbiAgcmV0dXJuIHBhcmVudEN0b3IgfHwgT2JqZWN0O1xufVxuIl19