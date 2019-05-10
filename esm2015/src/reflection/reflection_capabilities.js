/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Type, isType } from '../interface/type';
import { ANNOTATIONS, PARAMETERS, PROP_METADATA } from '../util/decorators';
import { global } from '../util/global';
import { stringify } from '../util/stringify';
/**
 * Attention: These regex has to hold even if the code is minified!
 */
export const DELEGATE_CTOR = /^function\s+\S+\(\)\s*{[\s\S]+\.apply\(this,\s*arguments\)/;
export const INHERITED_CLASS = /^class\s+[A-Za-z\d$_]*\s*extends\s+[^{]+{/;
export const INHERITED_CLASS_WITH_CTOR = /^class\s+[A-Za-z\d$_]*\s*extends\s+[^{]+{[\s\S]*constructor\s*\(/;
export const INHERITED_CLASS_WITH_DELEGATE_CTOR = /^class\s+[A-Za-z\d$_]*\s*extends\s+[^{]+{[\s\S]*constructor\s*\(\)\s*{\s+super\(\.\.\.arguments\)/;
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
export class ReflectionCapabilities {
    constructor(reflect) { this._reflect = reflect || global['Reflect']; }
    isReflectionEnabled() { return true; }
    factory(t) { return (...args) => new t(...args); }
    /** @internal */
    _zipTypesAndAnnotations(paramTypes, paramAnnotations) {
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
    _ownParameters(type, parentCtor) {
        const typeStr = type.toString();
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
        const tsickleCtorParams = type.ctorParameters;
        if (tsickleCtorParams && tsickleCtorParams !== parentCtor.ctorParameters) {
            // Newer tsickle uses a function closure
            // Retain the non-function case for compatibility with older tsickle
            const ctorParameters = typeof tsickleCtorParams === 'function' ? tsickleCtorParams() : tsickleCtorParams;
            const paramTypes = ctorParameters.map((ctorParam) => ctorParam && ctorParam.type);
            const paramAnnotations = ctorParameters.map((ctorParam) => ctorParam && convertTsickleDecoratorIntoMetadata(ctorParam.decorators));
            return this._zipTypesAndAnnotations(paramTypes, paramAnnotations);
        }
        // API for metadata created by invoking the decorators.
        const paramAnnotations = type.hasOwnProperty(PARAMETERS) && type[PARAMETERS];
        const paramTypes = this._reflect && this._reflect.getOwnMetadata &&
            this._reflect.getOwnMetadata('design:paramtypes', type);
        if (paramTypes || paramAnnotations) {
            return this._zipTypesAndAnnotations(paramTypes, paramAnnotations);
        }
        // If a class has no decorators, at least create metadata
        // based on function.length.
        // Note: We know that this is a real constructor as we checked
        // the content of the constructor above.
        return new Array(type.length).fill(undefined);
    }
    parameters(type) {
        // Note: only report metadata if we have at least one class decorator
        // to stay in sync with the static reflector.
        if (!isType(type)) {
            return [];
        }
        const parentCtor = getParentCtor(type);
        let parameters = this._ownParameters(type, parentCtor);
        if (!parameters && parentCtor !== Object) {
            parameters = this.parameters(parentCtor);
        }
        return parameters || [];
    }
    _ownAnnotations(typeOrFunc, parentCtor) {
        // Prefer the direct API.
        if (typeOrFunc.annotations && typeOrFunc.annotations !== parentCtor.annotations) {
            let annotations = typeOrFunc.annotations;
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
    }
    annotations(typeOrFunc) {
        if (!isType(typeOrFunc)) {
            return [];
        }
        const parentCtor = getParentCtor(typeOrFunc);
        const ownAnnotations = this._ownAnnotations(typeOrFunc, parentCtor) || [];
        const parentAnnotations = parentCtor !== Object ? this.annotations(parentCtor) : [];
        return parentAnnotations.concat(ownAnnotations);
    }
    _ownPropMetadata(typeOrFunc, parentCtor) {
        // Prefer the direct API.
        if (typeOrFunc.propMetadata &&
            typeOrFunc.propMetadata !== parentCtor.propMetadata) {
            let propMetadata = typeOrFunc.propMetadata;
            if (typeof propMetadata === 'function' && propMetadata.propMetadata) {
                propMetadata = propMetadata.propMetadata;
            }
            return propMetadata;
        }
        // API of tsickle for lowering decorators to properties on the class.
        if (typeOrFunc.propDecorators &&
            typeOrFunc.propDecorators !== parentCtor.propDecorators) {
            const propDecorators = typeOrFunc.propDecorators;
            const propMetadata = {};
            Object.keys(propDecorators).forEach(prop => {
                propMetadata[prop] = convertTsickleDecoratorIntoMetadata(propDecorators[prop]);
            });
            return propMetadata;
        }
        // API for metadata created by invoking the decorators.
        if (typeOrFunc.hasOwnProperty(PROP_METADATA)) {
            return typeOrFunc[PROP_METADATA];
        }
        return null;
    }
    propMetadata(typeOrFunc) {
        if (!isType(typeOrFunc)) {
            return {};
        }
        const parentCtor = getParentCtor(typeOrFunc);
        const propMetadata = {};
        if (parentCtor !== Object) {
            const parentPropMetadata = this.propMetadata(parentCtor);
            Object.keys(parentPropMetadata).forEach((propName) => {
                propMetadata[propName] = parentPropMetadata[propName];
            });
        }
        const ownPropMetadata = this._ownPropMetadata(typeOrFunc, parentCtor);
        if (ownPropMetadata) {
            Object.keys(ownPropMetadata).forEach((propName) => {
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
    ownPropMetadata(typeOrFunc) {
        if (!isType(typeOrFunc)) {
            return {};
        }
        return this._ownPropMetadata(typeOrFunc, getParentCtor(typeOrFunc)) || {};
    }
    hasLifecycleHook(type, lcProperty) {
        return type instanceof Type && lcProperty in type.prototype;
    }
    guards(type) { return {}; }
    getter(name) { return new Function('o', 'return o.' + name + ';'); }
    setter(name) {
        return new Function('o', 'v', 'return o.' + name + ' = v;');
    }
    method(name) {
        const functionBody = `if (!o.${name}) throw new Error('"${name}" is undefined');
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
    resourceUri(type) { return `./${stringify(type)}`; }
    resolveIdentifier(name, moduleUrl, members, runtime) {
        return runtime;
    }
    resolveEnum(enumIdentifier, name) { return enumIdentifier[name]; }
}
function convertTsickleDecoratorIntoMetadata(decoratorInvocations) {
    if (!decoratorInvocations) {
        return [];
    }
    return decoratorInvocations.map(decoratorInvocation => {
        const decoratorType = decoratorInvocation.type;
        const annotationCls = decoratorType.annotationCls;
        const annotationArgs = decoratorInvocation.args ? decoratorInvocation.args : [];
        return new annotationCls(...annotationArgs);
    });
}
function getParentCtor(ctor) {
    const parentProto = ctor.prototype ? Object.getPrototypeOf(ctor.prototype) : null;
    const parentCtor = parentProto ? parentProto.constructor : null;
    // Note: We always use `Object` as the null value
    // to simplify checking later on.
    return parentCtor || Object;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdGlvbl9jYXBhYmlsaXRpZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZWZsZWN0aW9uL3JlZmxlY3Rpb25fY2FwYWJpbGl0aWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxJQUFJLEVBQUUsTUFBTSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDL0MsT0FBTyxFQUFDLFdBQVcsRUFBRSxVQUFVLEVBQUUsYUFBYSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDMUUsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3RDLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQU81Qzs7R0FFRztBQUNILE1BQU0sQ0FBQyxNQUFNLGFBQWEsR0FBRyw0REFBNEQsQ0FBQztBQUMxRixNQUFNLENBQUMsTUFBTSxlQUFlLEdBQUcsMkNBQTJDLENBQUM7QUFDM0UsTUFBTSxDQUFDLE1BQU0seUJBQXlCLEdBQ2xDLGtFQUFrRSxDQUFDO0FBQ3ZFLE1BQU0sQ0FBQyxNQUFNLGtDQUFrQyxHQUMzQyxtR0FBbUcsQ0FBQztBQUV4Rzs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxVQUFVLGNBQWMsQ0FBQyxPQUFlO0lBQzVDLE9BQU8sYUFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxrQ0FBa0MsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ2xGLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ2xGLENBQUM7QUFFRCxNQUFNLE9BQU8sc0JBQXNCO0lBR2pDLFlBQVksT0FBYSxJQUFJLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxJQUFJLE1BQU0sQ0FBQyxTQUFT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aEYsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQUNELFdBQVcsQ0FBQyxjQUFtQixFQUFFLElBQVksSUFBUyxPQUFPLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDckY7QUFFRCxTQUFTLG1DQUFtQyxDQUFDLG9CQUEyQjtJQUN0RSxJQUFJLENBQUMsb0JBQW9CLEVBQUU7UUFDekIsT0FBTyxFQUFFLENBQUM7S0FDWDtJQUNELE9BQU8sb0JBQW9CLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLEVBQUU7UUFDcEQsTUFBTSxhQUFhLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxDQUFDO1FBQy9DLE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxhQUFhLENBQUM7UUFDbEQsTUFBTSxjQUFjLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUNoRixPQUFPLElBQUksYUFBYSxDQUFDLEdBQUcsY0FBYyxDQUFDLENBQUM7SUFDOUMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBUyxhQUFhLENBQUMsSUFBYztJQUNuQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ2xGLE1BQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ2hFLGlEQUFpRDtJQUNqRCxpQ0FBaUM7SUFDakMsT0FBTyxVQUFVLElBQUksTUFBTSxDQUFDO0FBQzlCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZSwgaXNUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0FOTk9UQVRJT05TLCBQQVJBTUVURVJTLCBQUk9QX01FVEFEQVRBfSBmcm9tICcuLi91dGlsL2RlY29yYXRvcnMnO1xuaW1wb3J0IHtnbG9iYWx9IGZyb20gJy4uL3V0aWwvZ2xvYmFsJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5cbmltcG9ydCB7UGxhdGZvcm1SZWZsZWN0aW9uQ2FwYWJpbGl0aWVzfSBmcm9tICcuL3BsYXRmb3JtX3JlZmxlY3Rpb25fY2FwYWJpbGl0aWVzJztcbmltcG9ydCB7R2V0dGVyRm4sIE1ldGhvZEZuLCBTZXR0ZXJGbn0gZnJvbSAnLi90eXBlcyc7XG5cblxuXG4vKipcbiAqIEF0dGVudGlvbjogVGhlc2UgcmVnZXggaGFzIHRvIGhvbGQgZXZlbiBpZiB0aGUgY29kZSBpcyBtaW5pZmllZCFcbiAqL1xuZXhwb3J0IGNvbnN0IERFTEVHQVRFX0NUT1IgPSAvXmZ1bmN0aW9uXFxzK1xcUytcXChcXClcXHMqe1tcXHNcXFNdK1xcLmFwcGx5XFwodGhpcyxcXHMqYXJndW1lbnRzXFwpLztcbmV4cG9ydCBjb25zdCBJTkhFUklURURfQ0xBU1MgPSAvXmNsYXNzXFxzK1tBLVphLXpcXGQkX10qXFxzKmV4dGVuZHNcXHMrW157XSt7LztcbmV4cG9ydCBjb25zdCBJTkhFUklURURfQ0xBU1NfV0lUSF9DVE9SID1cbiAgICAvXmNsYXNzXFxzK1tBLVphLXpcXGQkX10qXFxzKmV4dGVuZHNcXHMrW157XSt7W1xcc1xcU10qY29uc3RydWN0b3JcXHMqXFwoLztcbmV4cG9ydCBjb25zdCBJTkhFUklURURfQ0xBU1NfV0lUSF9ERUxFR0FURV9DVE9SID1cbiAgICAvXmNsYXNzXFxzK1tBLVphLXpcXGQkX10qXFxzKmV4dGVuZHNcXHMrW157XSt7W1xcc1xcU10qY29uc3RydWN0b3JcXHMqXFwoXFwpXFxzKntcXHMrc3VwZXJcXChcXC5cXC5cXC5hcmd1bWVudHNcXCkvO1xuXG4vKipcbiAqIERldGVybWluZSB3aGV0aGVyIGEgc3RyaW5naWZpZWQgdHlwZSBpcyBhIGNsYXNzIHdoaWNoIGRlbGVnYXRlcyBpdHMgY29uc3RydWN0b3JcbiAqIHRvIGl0cyBwYXJlbnQuXG4gKlxuICogVGhpcyBpcyBub3QgdHJpdmlhbCBzaW5jZSBjb21waWxlZCBjb2RlIGNhbiBhY3R1YWxseSBjb250YWluIGEgY29uc3RydWN0b3IgZnVuY3Rpb25cbiAqIGV2ZW4gaWYgdGhlIG9yaWdpbmFsIHNvdXJjZSBjb2RlIGRpZCBub3QuIEZvciBpbnN0YW5jZSwgd2hlbiB0aGUgY2hpbGQgY2xhc3MgY29udGFpbnNcbiAqIGFuIGluaXRpYWxpemVkIGluc3RhbmNlIHByb3BlcnR5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNEZWxlZ2F0ZUN0b3IodHlwZVN0cjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBERUxFR0FURV9DVE9SLnRlc3QodHlwZVN0cikgfHwgSU5IRVJJVEVEX0NMQVNTX1dJVEhfREVMRUdBVEVfQ1RPUi50ZXN0KHR5cGVTdHIpIHx8XG4gICAgICAoSU5IRVJJVEVEX0NMQVNTLnRlc3QodHlwZVN0cikgJiYgIUlOSEVSSVRFRF9DTEFTU19XSVRIX0NUT1IudGVzdCh0eXBlU3RyKSk7XG59XG5cbmV4cG9ydCBjbGFzcyBSZWZsZWN0aW9uQ2FwYWJpbGl0aWVzIGltcGxlbWVudHMgUGxhdGZvcm1SZWZsZWN0aW9uQ2FwYWJpbGl0aWVzIHtcbiAgcHJpdmF0ZSBfcmVmbGVjdDogYW55O1xuXG4gIGNvbnN0cnVjdG9yKHJlZmxlY3Q/OiBhbnkpIHsgdGhpcy5fcmVmbGVjdCA9IHJlZmxlY3QgfHwgZ2xvYmFsWydSZWZsZWN0J107IH1cblxuICBpc1JlZmxlY3Rpb25FbmFibGVkKCk6IGJvb2xlYW4geyByZXR1cm4gdHJ1ZTsgfVxuXG4gIGZhY3Rvcnk8VD4odDogVHlwZTxUPik6IChhcmdzOiBhbnlbXSkgPT4gVCB7IHJldHVybiAoLi4uYXJnczogYW55W10pID0+IG5ldyB0KC4uLmFyZ3MpOyB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfemlwVHlwZXNBbmRBbm5vdGF0aW9ucyhwYXJhbVR5cGVzOiBhbnlbXSwgcGFyYW1Bbm5vdGF0aW9uczogYW55W10pOiBhbnlbXVtdIHtcbiAgICBsZXQgcmVzdWx0OiBhbnlbXVtdO1xuXG4gICAgaWYgKHR5cGVvZiBwYXJhbVR5cGVzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmVzdWx0ID0gbmV3IEFycmF5KHBhcmFtQW5ub3RhdGlvbnMubGVuZ3RoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ID0gbmV3IEFycmF5KHBhcmFtVHlwZXMubGVuZ3RoKTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlc3VsdC5sZW5ndGg7IGkrKykge1xuICAgICAgLy8gVFMgb3V0cHV0cyBPYmplY3QgZm9yIHBhcmFtZXRlcnMgd2l0aG91dCB0eXBlcywgd2hpbGUgVHJhY2V1ciBvbWl0c1xuICAgICAgLy8gdGhlIGFubm90YXRpb25zLiBGb3Igbm93IHdlIHByZXNlcnZlIHRoZSBUcmFjZXVyIGJlaGF2aW9yIHRvIGFpZFxuICAgICAgLy8gbWlncmF0aW9uLCBidXQgdGhpcyBjYW4gYmUgcmV2aXNpdGVkLlxuICAgICAgaWYgKHR5cGVvZiBwYXJhbVR5cGVzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXN1bHRbaV0gPSBbXTtcbiAgICAgIH0gZWxzZSBpZiAocGFyYW1UeXBlc1tpXSAhPSBPYmplY3QpIHtcbiAgICAgICAgcmVzdWx0W2ldID0gW3BhcmFtVHlwZXNbaV1dO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0W2ldID0gW107XG4gICAgICB9XG4gICAgICBpZiAocGFyYW1Bbm5vdGF0aW9ucyAmJiBwYXJhbUFubm90YXRpb25zW2ldICE9IG51bGwpIHtcbiAgICAgICAgcmVzdWx0W2ldID0gcmVzdWx0W2ldLmNvbmNhdChwYXJhbUFubm90YXRpb25zW2ldKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgX293blBhcmFtZXRlcnModHlwZTogVHlwZTxhbnk+LCBwYXJlbnRDdG9yOiBhbnkpOiBhbnlbXVtdfG51bGwge1xuICAgIGNvbnN0IHR5cGVTdHIgPSB0eXBlLnRvU3RyaW5nKCk7XG4gICAgLy8gSWYgd2UgaGF2ZSBubyBkZWNvcmF0b3JzLCB3ZSBvbmx5IGhhdmUgZnVuY3Rpb24ubGVuZ3RoIGFzIG1ldGFkYXRhLlxuICAgIC8vIEluIHRoYXQgY2FzZSwgdG8gZGV0ZWN0IHdoZXRoZXIgYSBjaGlsZCBjbGFzcyBkZWNsYXJlZCBhbiBvd24gY29uc3RydWN0b3Igb3Igbm90LFxuICAgIC8vIHdlIG5lZWQgdG8gbG9vayBpbnNpZGUgb2YgdGhhdCBjb25zdHJ1Y3RvciB0byBjaGVjayB3aGV0aGVyIGl0IGlzXG4gICAgLy8ganVzdCBjYWxsaW5nIHRoZSBwYXJlbnQuXG4gICAgLy8gVGhpcyBhbHNvIGhlbHBzIHRvIHdvcmsgYXJvdW5kIGZvciBodHRwczovL2dpdGh1Yi5jb20vTWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzEyNDM5XG4gICAgLy8gdGhhdCBzZXRzICdkZXNpZ246cGFyYW10eXBlcycgdG8gW11cbiAgICAvLyBpZiBhIGNsYXNzIGluaGVyaXRzIGZyb20gYW5vdGhlciBjbGFzcyBidXQgaGFzIG5vIGN0b3IgZGVjbGFyZWQgaXRzZWxmLlxuICAgIGlmIChpc0RlbGVnYXRlQ3Rvcih0eXBlU3RyKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gUHJlZmVyIHRoZSBkaXJlY3QgQVBJLlxuICAgIGlmICgoPGFueT50eXBlKS5wYXJhbWV0ZXJzICYmICg8YW55PnR5cGUpLnBhcmFtZXRlcnMgIT09IHBhcmVudEN0b3IucGFyYW1ldGVycykge1xuICAgICAgcmV0dXJuICg8YW55PnR5cGUpLnBhcmFtZXRlcnM7XG4gICAgfVxuXG4gICAgLy8gQVBJIG9mIHRzaWNrbGUgZm9yIGxvd2VyaW5nIGRlY29yYXRvcnMgdG8gcHJvcGVydGllcyBvbiB0aGUgY2xhc3MuXG4gICAgY29uc3QgdHNpY2tsZUN0b3JQYXJhbXMgPSAoPGFueT50eXBlKS5jdG9yUGFyYW1ldGVycztcbiAgICBpZiAodHNpY2tsZUN0b3JQYXJhbXMgJiYgdHNpY2tsZUN0b3JQYXJhbXMgIT09IHBhcmVudEN0b3IuY3RvclBhcmFtZXRlcnMpIHtcbiAgICAgIC8vIE5ld2VyIHRzaWNrbGUgdXNlcyBhIGZ1bmN0aW9uIGNsb3N1cmVcbiAgICAgIC8vIFJldGFpbiB0aGUgbm9uLWZ1bmN0aW9uIGNhc2UgZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBvbGRlciB0c2lja2xlXG4gICAgICBjb25zdCBjdG9yUGFyYW1ldGVycyA9XG4gICAgICAgICAgdHlwZW9mIHRzaWNrbGVDdG9yUGFyYW1zID09PSAnZnVuY3Rpb24nID8gdHNpY2tsZUN0b3JQYXJhbXMoKSA6IHRzaWNrbGVDdG9yUGFyYW1zO1xuICAgICAgY29uc3QgcGFyYW1UeXBlcyA9IGN0b3JQYXJhbWV0ZXJzLm1hcCgoY3RvclBhcmFtOiBhbnkpID0+IGN0b3JQYXJhbSAmJiBjdG9yUGFyYW0udHlwZSk7XG4gICAgICBjb25zdCBwYXJhbUFubm90YXRpb25zID0gY3RvclBhcmFtZXRlcnMubWFwKFxuICAgICAgICAgIChjdG9yUGFyYW06IGFueSkgPT5cbiAgICAgICAgICAgICAgY3RvclBhcmFtICYmIGNvbnZlcnRUc2lja2xlRGVjb3JhdG9ySW50b01ldGFkYXRhKGN0b3JQYXJhbS5kZWNvcmF0b3JzKSk7XG4gICAgICByZXR1cm4gdGhpcy5femlwVHlwZXNBbmRBbm5vdGF0aW9ucyhwYXJhbVR5cGVzLCBwYXJhbUFubm90YXRpb25zKTtcbiAgICB9XG5cbiAgICAvLyBBUEkgZm9yIG1ldGFkYXRhIGNyZWF0ZWQgYnkgaW52b2tpbmcgdGhlIGRlY29yYXRvcnMuXG4gICAgY29uc3QgcGFyYW1Bbm5vdGF0aW9ucyA9IHR5cGUuaGFzT3duUHJvcGVydHkoUEFSQU1FVEVSUykgJiYgKHR5cGUgYXMgYW55KVtQQVJBTUVURVJTXTtcbiAgICBjb25zdCBwYXJhbVR5cGVzID0gdGhpcy5fcmVmbGVjdCAmJiB0aGlzLl9yZWZsZWN0LmdldE93bk1ldGFkYXRhICYmXG4gICAgICAgIHRoaXMuX3JlZmxlY3QuZ2V0T3duTWV0YWRhdGEoJ2Rlc2lnbjpwYXJhbXR5cGVzJywgdHlwZSk7XG4gICAgaWYgKHBhcmFtVHlwZXMgfHwgcGFyYW1Bbm5vdGF0aW9ucykge1xuICAgICAgcmV0dXJuIHRoaXMuX3ppcFR5cGVzQW5kQW5ub3RhdGlvbnMocGFyYW1UeXBlcywgcGFyYW1Bbm5vdGF0aW9ucyk7XG4gICAgfVxuXG4gICAgLy8gSWYgYSBjbGFzcyBoYXMgbm8gZGVjb3JhdG9ycywgYXQgbGVhc3QgY3JlYXRlIG1ldGFkYXRhXG4gICAgLy8gYmFzZWQgb24gZnVuY3Rpb24ubGVuZ3RoLlxuICAgIC8vIE5vdGU6IFdlIGtub3cgdGhhdCB0aGlzIGlzIGEgcmVhbCBjb25zdHJ1Y3RvciBhcyB3ZSBjaGVja2VkXG4gICAgLy8gdGhlIGNvbnRlbnQgb2YgdGhlIGNvbnN0cnVjdG9yIGFib3ZlLlxuICAgIHJldHVybiBuZXcgQXJyYXkoKDxhbnk+dHlwZS5sZW5ndGgpKS5maWxsKHVuZGVmaW5lZCk7XG4gIH1cblxuICBwYXJhbWV0ZXJzKHR5cGU6IFR5cGU8YW55Pik6IGFueVtdW10ge1xuICAgIC8vIE5vdGU6IG9ubHkgcmVwb3J0IG1ldGFkYXRhIGlmIHdlIGhhdmUgYXQgbGVhc3Qgb25lIGNsYXNzIGRlY29yYXRvclxuICAgIC8vIHRvIHN0YXkgaW4gc3luYyB3aXRoIHRoZSBzdGF0aWMgcmVmbGVjdG9yLlxuICAgIGlmICghaXNUeXBlKHR5cGUpKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIGNvbnN0IHBhcmVudEN0b3IgPSBnZXRQYXJlbnRDdG9yKHR5cGUpO1xuICAgIGxldCBwYXJhbWV0ZXJzID0gdGhpcy5fb3duUGFyYW1ldGVycyh0eXBlLCBwYXJlbnRDdG9yKTtcbiAgICBpZiAoIXBhcmFtZXRlcnMgJiYgcGFyZW50Q3RvciAhPT0gT2JqZWN0KSB7XG4gICAgICBwYXJhbWV0ZXJzID0gdGhpcy5wYXJhbWV0ZXJzKHBhcmVudEN0b3IpO1xuICAgIH1cbiAgICByZXR1cm4gcGFyYW1ldGVycyB8fCBbXTtcbiAgfVxuXG4gIHByaXZhdGUgX293bkFubm90YXRpb25zKHR5cGVPckZ1bmM6IFR5cGU8YW55PiwgcGFyZW50Q3RvcjogYW55KTogYW55W118bnVsbCB7XG4gICAgLy8gUHJlZmVyIHRoZSBkaXJlY3QgQVBJLlxuICAgIGlmICgoPGFueT50eXBlT3JGdW5jKS5hbm5vdGF0aW9ucyAmJiAoPGFueT50eXBlT3JGdW5jKS5hbm5vdGF0aW9ucyAhPT0gcGFyZW50Q3Rvci5hbm5vdGF0aW9ucykge1xuICAgICAgbGV0IGFubm90YXRpb25zID0gKDxhbnk+dHlwZU9yRnVuYykuYW5ub3RhdGlvbnM7XG4gICAgICBpZiAodHlwZW9mIGFubm90YXRpb25zID09PSAnZnVuY3Rpb24nICYmIGFubm90YXRpb25zLmFubm90YXRpb25zKSB7XG4gICAgICAgIGFubm90YXRpb25zID0gYW5ub3RhdGlvbnMuYW5ub3RhdGlvbnM7XG4gICAgICB9XG4gICAgICByZXR1cm4gYW5ub3RhdGlvbnM7XG4gICAgfVxuXG4gICAgLy8gQVBJIG9mIHRzaWNrbGUgZm9yIGxvd2VyaW5nIGRlY29yYXRvcnMgdG8gcHJvcGVydGllcyBvbiB0aGUgY2xhc3MuXG4gICAgaWYgKCg8YW55PnR5cGVPckZ1bmMpLmRlY29yYXRvcnMgJiYgKDxhbnk+dHlwZU9yRnVuYykuZGVjb3JhdG9ycyAhPT0gcGFyZW50Q3Rvci5kZWNvcmF0b3JzKSB7XG4gICAgICByZXR1cm4gY29udmVydFRzaWNrbGVEZWNvcmF0b3JJbnRvTWV0YWRhdGEoKDxhbnk+dHlwZU9yRnVuYykuZGVjb3JhdG9ycyk7XG4gICAgfVxuXG4gICAgLy8gQVBJIGZvciBtZXRhZGF0YSBjcmVhdGVkIGJ5IGludm9raW5nIHRoZSBkZWNvcmF0b3JzLlxuICAgIGlmICh0eXBlT3JGdW5jLmhhc093blByb3BlcnR5KEFOTk9UQVRJT05TKSkge1xuICAgICAgcmV0dXJuICh0eXBlT3JGdW5jIGFzIGFueSlbQU5OT1RBVElPTlNdO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGFubm90YXRpb25zKHR5cGVPckZ1bmM6IFR5cGU8YW55Pik6IGFueVtdIHtcbiAgICBpZiAoIWlzVHlwZSh0eXBlT3JGdW5jKSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBjb25zdCBwYXJlbnRDdG9yID0gZ2V0UGFyZW50Q3Rvcih0eXBlT3JGdW5jKTtcbiAgICBjb25zdCBvd25Bbm5vdGF0aW9ucyA9IHRoaXMuX293bkFubm90YXRpb25zKHR5cGVPckZ1bmMsIHBhcmVudEN0b3IpIHx8IFtdO1xuICAgIGNvbnN0IHBhcmVudEFubm90YXRpb25zID0gcGFyZW50Q3RvciAhPT0gT2JqZWN0ID8gdGhpcy5hbm5vdGF0aW9ucyhwYXJlbnRDdG9yKSA6IFtdO1xuICAgIHJldHVybiBwYXJlbnRBbm5vdGF0aW9ucy5jb25jYXQob3duQW5ub3RhdGlvbnMpO1xuICB9XG5cbiAgcHJpdmF0ZSBfb3duUHJvcE1ldGFkYXRhKHR5cGVPckZ1bmM6IGFueSwgcGFyZW50Q3RvcjogYW55KToge1trZXk6IHN0cmluZ106IGFueVtdfXxudWxsIHtcbiAgICAvLyBQcmVmZXIgdGhlIGRpcmVjdCBBUEkuXG4gICAgaWYgKCg8YW55PnR5cGVPckZ1bmMpLnByb3BNZXRhZGF0YSAmJlxuICAgICAgICAoPGFueT50eXBlT3JGdW5jKS5wcm9wTWV0YWRhdGEgIT09IHBhcmVudEN0b3IucHJvcE1ldGFkYXRhKSB7XG4gICAgICBsZXQgcHJvcE1ldGFkYXRhID0gKDxhbnk+dHlwZU9yRnVuYykucHJvcE1ldGFkYXRhO1xuICAgICAgaWYgKHR5cGVvZiBwcm9wTWV0YWRhdGEgPT09ICdmdW5jdGlvbicgJiYgcHJvcE1ldGFkYXRhLnByb3BNZXRhZGF0YSkge1xuICAgICAgICBwcm9wTWV0YWRhdGEgPSBwcm9wTWV0YWRhdGEucHJvcE1ldGFkYXRhO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHByb3BNZXRhZGF0YTtcbiAgICB9XG5cbiAgICAvLyBBUEkgb2YgdHNpY2tsZSBmb3IgbG93ZXJpbmcgZGVjb3JhdG9ycyB0byBwcm9wZXJ0aWVzIG9uIHRoZSBjbGFzcy5cbiAgICBpZiAoKDxhbnk+dHlwZU9yRnVuYykucHJvcERlY29yYXRvcnMgJiZcbiAgICAgICAgKDxhbnk+dHlwZU9yRnVuYykucHJvcERlY29yYXRvcnMgIT09IHBhcmVudEN0b3IucHJvcERlY29yYXRvcnMpIHtcbiAgICAgIGNvbnN0IHByb3BEZWNvcmF0b3JzID0gKDxhbnk+dHlwZU9yRnVuYykucHJvcERlY29yYXRvcnM7XG4gICAgICBjb25zdCBwcm9wTWV0YWRhdGEgPSA8e1trZXk6IHN0cmluZ106IGFueVtdfT57fTtcbiAgICAgIE9iamVjdC5rZXlzKHByb3BEZWNvcmF0b3JzKS5mb3JFYWNoKHByb3AgPT4ge1xuICAgICAgICBwcm9wTWV0YWRhdGFbcHJvcF0gPSBjb252ZXJ0VHNpY2tsZURlY29yYXRvckludG9NZXRhZGF0YShwcm9wRGVjb3JhdG9yc1twcm9wXSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBwcm9wTWV0YWRhdGE7XG4gICAgfVxuXG4gICAgLy8gQVBJIGZvciBtZXRhZGF0YSBjcmVhdGVkIGJ5IGludm9raW5nIHRoZSBkZWNvcmF0b3JzLlxuICAgIGlmICh0eXBlT3JGdW5jLmhhc093blByb3BlcnR5KFBST1BfTUVUQURBVEEpKSB7XG4gICAgICByZXR1cm4gKHR5cGVPckZ1bmMgYXMgYW55KVtQUk9QX01FVEFEQVRBXTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcm9wTWV0YWRhdGEodHlwZU9yRnVuYzogYW55KToge1trZXk6IHN0cmluZ106IGFueVtdfSB7XG4gICAgaWYgKCFpc1R5cGUodHlwZU9yRnVuYykpIHtcbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG4gICAgY29uc3QgcGFyZW50Q3RvciA9IGdldFBhcmVudEN0b3IodHlwZU9yRnVuYyk7XG4gICAgY29uc3QgcHJvcE1ldGFkYXRhOiB7W2tleTogc3RyaW5nXTogYW55W119ID0ge307XG4gICAgaWYgKHBhcmVudEN0b3IgIT09IE9iamVjdCkge1xuICAgICAgY29uc3QgcGFyZW50UHJvcE1ldGFkYXRhID0gdGhpcy5wcm9wTWV0YWRhdGEocGFyZW50Q3Rvcik7XG4gICAgICBPYmplY3Qua2V5cyhwYXJlbnRQcm9wTWV0YWRhdGEpLmZvckVhY2goKHByb3BOYW1lKSA9PiB7XG4gICAgICAgIHByb3BNZXRhZGF0YVtwcm9wTmFtZV0gPSBwYXJlbnRQcm9wTWV0YWRhdGFbcHJvcE5hbWVdO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnN0IG93blByb3BNZXRhZGF0YSA9IHRoaXMuX293blByb3BNZXRhZGF0YSh0eXBlT3JGdW5jLCBwYXJlbnRDdG9yKTtcbiAgICBpZiAob3duUHJvcE1ldGFkYXRhKSB7XG4gICAgICBPYmplY3Qua2V5cyhvd25Qcm9wTWV0YWRhdGEpLmZvckVhY2goKHByb3BOYW1lKSA9PiB7XG4gICAgICAgIGNvbnN0IGRlY29yYXRvcnM6IGFueVtdID0gW107XG4gICAgICAgIGlmIChwcm9wTWV0YWRhdGEuaGFzT3duUHJvcGVydHkocHJvcE5hbWUpKSB7XG4gICAgICAgICAgZGVjb3JhdG9ycy5wdXNoKC4uLnByb3BNZXRhZGF0YVtwcm9wTmFtZV0pO1xuICAgICAgICB9XG4gICAgICAgIGRlY29yYXRvcnMucHVzaCguLi5vd25Qcm9wTWV0YWRhdGFbcHJvcE5hbWVdKTtcbiAgICAgICAgcHJvcE1ldGFkYXRhW3Byb3BOYW1lXSA9IGRlY29yYXRvcnM7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHByb3BNZXRhZGF0YTtcbiAgfVxuXG4gIG93blByb3BNZXRhZGF0YSh0eXBlT3JGdW5jOiBhbnkpOiB7W2tleTogc3RyaW5nXTogYW55W119IHtcbiAgICBpZiAoIWlzVHlwZSh0eXBlT3JGdW5jKSkge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fb3duUHJvcE1ldGFkYXRhKHR5cGVPckZ1bmMsIGdldFBhcmVudEN0b3IodHlwZU9yRnVuYykpIHx8IHt9O1xuICB9XG5cbiAgaGFzTGlmZWN5Y2xlSG9vayh0eXBlOiBhbnksIGxjUHJvcGVydHk6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0eXBlIGluc3RhbmNlb2YgVHlwZSAmJiBsY1Byb3BlcnR5IGluIHR5cGUucHJvdG90eXBlO1xuICB9XG5cbiAgZ3VhcmRzKHR5cGU6IGFueSk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHsgcmV0dXJuIHt9OyB9XG5cbiAgZ2V0dGVyKG5hbWU6IHN0cmluZyk6IEdldHRlckZuIHsgcmV0dXJuIDxHZXR0ZXJGbj5uZXcgRnVuY3Rpb24oJ28nLCAncmV0dXJuIG8uJyArIG5hbWUgKyAnOycpOyB9XG5cbiAgc2V0dGVyKG5hbWU6IHN0cmluZyk6IFNldHRlckZuIHtcbiAgICByZXR1cm4gPFNldHRlckZuPm5ldyBGdW5jdGlvbignbycsICd2JywgJ3JldHVybiBvLicgKyBuYW1lICsgJyA9IHY7Jyk7XG4gIH1cblxuICBtZXRob2QobmFtZTogc3RyaW5nKTogTWV0aG9kRm4ge1xuICAgIGNvbnN0IGZ1bmN0aW9uQm9keSA9IGBpZiAoIW8uJHtuYW1lfSkgdGhyb3cgbmV3IEVycm9yKCdcIiR7bmFtZX1cIiBpcyB1bmRlZmluZWQnKTtcbiAgICAgICAgcmV0dXJuIG8uJHtuYW1lfS5hcHBseShvLCBhcmdzKTtgO1xuICAgIHJldHVybiA8TWV0aG9kRm4+bmV3IEZ1bmN0aW9uKCdvJywgJ2FyZ3MnLCBmdW5jdGlvbkJvZHkpO1xuICB9XG5cbiAgLy8gVGhlcmUgaXMgbm90IGEgY29uY2VwdCBvZiBpbXBvcnQgdXJpIGluIEpzLCBidXQgdGhpcyBpcyB1c2VmdWwgaW4gZGV2ZWxvcGluZyBEYXJ0IGFwcGxpY2F0aW9ucy5cbiAgaW1wb3J0VXJpKHR5cGU6IGFueSk6IHN0cmluZyB7XG4gICAgLy8gU3RhdGljU3ltYm9sXG4gICAgaWYgKHR5cGVvZiB0eXBlID09PSAnb2JqZWN0JyAmJiB0eXBlWydmaWxlUGF0aCddKSB7XG4gICAgICByZXR1cm4gdHlwZVsnZmlsZVBhdGgnXTtcbiAgICB9XG4gICAgLy8gUnVudGltZSB0eXBlXG4gICAgcmV0dXJuIGAuLyR7c3RyaW5naWZ5KHR5cGUpfWA7XG4gIH1cblxuICByZXNvdXJjZVVyaSh0eXBlOiBhbnkpOiBzdHJpbmcgeyByZXR1cm4gYC4vJHtzdHJpbmdpZnkodHlwZSl9YDsgfVxuXG4gIHJlc29sdmVJZGVudGlmaWVyKG5hbWU6IHN0cmluZywgbW9kdWxlVXJsOiBzdHJpbmcsIG1lbWJlcnM6IHN0cmluZ1tdLCBydW50aW1lOiBhbnkpOiBhbnkge1xuICAgIHJldHVybiBydW50aW1lO1xuICB9XG4gIHJlc29sdmVFbnVtKGVudW1JZGVudGlmaWVyOiBhbnksIG5hbWU6IHN0cmluZyk6IGFueSB7IHJldHVybiBlbnVtSWRlbnRpZmllcltuYW1lXTsgfVxufVxuXG5mdW5jdGlvbiBjb252ZXJ0VHNpY2tsZURlY29yYXRvckludG9NZXRhZGF0YShkZWNvcmF0b3JJbnZvY2F0aW9uczogYW55W10pOiBhbnlbXSB7XG4gIGlmICghZGVjb3JhdG9ySW52b2NhdGlvbnMpIHtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgcmV0dXJuIGRlY29yYXRvckludm9jYXRpb25zLm1hcChkZWNvcmF0b3JJbnZvY2F0aW9uID0+IHtcbiAgICBjb25zdCBkZWNvcmF0b3JUeXBlID0gZGVjb3JhdG9ySW52b2NhdGlvbi50eXBlO1xuICAgIGNvbnN0IGFubm90YXRpb25DbHMgPSBkZWNvcmF0b3JUeXBlLmFubm90YXRpb25DbHM7XG4gICAgY29uc3QgYW5ub3RhdGlvbkFyZ3MgPSBkZWNvcmF0b3JJbnZvY2F0aW9uLmFyZ3MgPyBkZWNvcmF0b3JJbnZvY2F0aW9uLmFyZ3MgOiBbXTtcbiAgICByZXR1cm4gbmV3IGFubm90YXRpb25DbHMoLi4uYW5ub3RhdGlvbkFyZ3MpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0UGFyZW50Q3RvcihjdG9yOiBGdW5jdGlvbik6IFR5cGU8YW55PiB7XG4gIGNvbnN0IHBhcmVudFByb3RvID0gY3Rvci5wcm90b3R5cGUgPyBPYmplY3QuZ2V0UHJvdG90eXBlT2YoY3Rvci5wcm90b3R5cGUpIDogbnVsbDtcbiAgY29uc3QgcGFyZW50Q3RvciA9IHBhcmVudFByb3RvID8gcGFyZW50UHJvdG8uY29uc3RydWN0b3IgOiBudWxsO1xuICAvLyBOb3RlOiBXZSBhbHdheXMgdXNlIGBPYmplY3RgIGFzIHRoZSBudWxsIHZhbHVlXG4gIC8vIHRvIHNpbXBsaWZ5IGNoZWNraW5nIGxhdGVyIG9uLlxuICByZXR1cm4gcGFyZW50Q3RvciB8fCBPYmplY3Q7XG59XG4iXX0=