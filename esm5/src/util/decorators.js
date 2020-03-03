/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __read, __spread } from "tslib";
import { noSideEffects } from './closure';
export var ANNOTATIONS = '__annotations__';
export var PARAMETERS = '__parameters__';
export var PROP_METADATA = '__prop__metadata__';
/**
 * @suppress {globalThis}
 */
export function makeDecorator(name, props, parentClass, additionalProcessing, typeFn) {
    return noSideEffects(function () {
        var metaCtor = makeMetadataCtor(props);
        function DecoratorFactory() {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (this instanceof DecoratorFactory) {
                metaCtor.call.apply(metaCtor, __spread([this], args));
                return this;
            }
            var annotationInstance = new ((_a = DecoratorFactory).bind.apply(_a, __spread([void 0], args)))();
            return function TypeDecorator(cls) {
                if (typeFn)
                    typeFn.apply(void 0, __spread([cls], args));
                // Use of Object.defineProperty is important since it creates non-enumerable property which
                // prevents the property is copied during subclassing.
                var annotations = cls.hasOwnProperty(ANNOTATIONS) ?
                    cls[ANNOTATIONS] :
                    Object.defineProperty(cls, ANNOTATIONS, { value: [] })[ANNOTATIONS];
                annotations.push(annotationInstance);
                if (additionalProcessing)
                    additionalProcessing(cls);
                return cls;
            };
        }
        if (parentClass) {
            DecoratorFactory.prototype = Object.create(parentClass.prototype);
        }
        DecoratorFactory.prototype.ngMetadataName = name;
        DecoratorFactory.annotationCls = DecoratorFactory;
        return DecoratorFactory;
    });
}
function makeMetadataCtor(props) {
    return function ctor() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (props) {
            var values = props.apply(void 0, __spread(args));
            for (var propName in values) {
                this[propName] = values[propName];
            }
        }
    };
}
export function makeParamDecorator(name, props, parentClass) {
    return noSideEffects(function () {
        var metaCtor = makeMetadataCtor(props);
        function ParamDecoratorFactory() {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (this instanceof ParamDecoratorFactory) {
                metaCtor.apply(this, args);
                return this;
            }
            var annotationInstance = new ((_a = ParamDecoratorFactory).bind.apply(_a, __spread([void 0], args)))();
            ParamDecorator.annotation = annotationInstance;
            return ParamDecorator;
            function ParamDecorator(cls, unusedKey, index) {
                // Use of Object.defineProperty is important since it creates non-enumerable property which
                // prevents the property is copied during subclassing.
                var parameters = cls.hasOwnProperty(PARAMETERS) ?
                    cls[PARAMETERS] :
                    Object.defineProperty(cls, PARAMETERS, { value: [] })[PARAMETERS];
                // there might be gaps if some in between parameters do not have annotations.
                // we pad with nulls.
                while (parameters.length <= index) {
                    parameters.push(null);
                }
                (parameters[index] = parameters[index] || []).push(annotationInstance);
                return cls;
            }
        }
        if (parentClass) {
            ParamDecoratorFactory.prototype = Object.create(parentClass.prototype);
        }
        ParamDecoratorFactory.prototype.ngMetadataName = name;
        ParamDecoratorFactory.annotationCls = ParamDecoratorFactory;
        return ParamDecoratorFactory;
    });
}
export function makePropDecorator(name, props, parentClass, additionalProcessing) {
    return noSideEffects(function () {
        var metaCtor = makeMetadataCtor(props);
        function PropDecoratorFactory() {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (this instanceof PropDecoratorFactory) {
                metaCtor.apply(this, args);
                return this;
            }
            var decoratorInstance = new ((_a = PropDecoratorFactory).bind.apply(_a, __spread([void 0], args)))();
            function PropDecorator(target, name) {
                var constructor = target.constructor;
                // Use of Object.defineProperty is important since it creates non-enumerable property which
                // prevents the property is copied during subclassing.
                var meta = constructor.hasOwnProperty(PROP_METADATA) ?
                    constructor[PROP_METADATA] :
                    Object.defineProperty(constructor, PROP_METADATA, { value: {} })[PROP_METADATA];
                meta[name] = meta.hasOwnProperty(name) && meta[name] || [];
                meta[name].unshift(decoratorInstance);
                if (additionalProcessing)
                    additionalProcessing.apply(void 0, __spread([target, name], args));
            }
            return PropDecorator;
        }
        if (parentClass) {
            PropDecoratorFactory.prototype = Object.create(parentClass.prototype);
        }
        PropDecoratorFactory.prototype.ngMetadataName = name;
        PropDecoratorFactory.annotationCls = PropDecoratorFactory;
        return PropDecoratorFactory;
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3V0aWwvZGVjb3JhdG9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBSUgsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQTRCeEMsTUFBTSxDQUFDLElBQU0sV0FBVyxHQUFHLGlCQUFpQixDQUFDO0FBQzdDLE1BQU0sQ0FBQyxJQUFNLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQztBQUMzQyxNQUFNLENBQUMsSUFBTSxhQUFhLEdBQUcsb0JBQW9CLENBQUM7QUFFbEQ7O0dBRUc7QUFDSCxNQUFNLFVBQVUsYUFBYSxDQUN6QixJQUFZLEVBQUUsS0FBK0IsRUFBRSxXQUFpQixFQUNoRSxvQkFBOEMsRUFDOUMsTUFBZ0Q7SUFFbEQsT0FBTyxhQUFhLENBQUM7UUFDbkIsSUFBTSxRQUFRLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFekMsU0FBUyxnQkFBZ0I7O1lBQ29CLGNBQWM7aUJBQWQsVUFBYyxFQUFkLHFCQUFjLEVBQWQsSUFBYztnQkFBZCx5QkFBYzs7WUFDekQsSUFBSSxJQUFJLFlBQVksZ0JBQWdCLEVBQUU7Z0JBQ3BDLFFBQVEsQ0FBQyxJQUFJLE9BQWIsUUFBUSxZQUFNLElBQUksR0FBSyxJQUFJLEdBQUU7Z0JBQzdCLE9BQU8sSUFBK0IsQ0FBQzthQUN4QztZQUVELElBQU0sa0JBQWtCLFFBQU8sQ0FBQSxLQUFDLGdCQUF3QixDQUFBLG1DQUFJLElBQUksS0FBQyxDQUFDO1lBQ2xFLE9BQU8sU0FBUyxhQUFhLENBQUMsR0FBWTtnQkFDeEMsSUFBSSxNQUFNO29CQUFFLE1BQU0seUJBQUMsR0FBRyxHQUFLLElBQUksR0FBRTtnQkFDakMsMkZBQTJGO2dCQUMzRixzREFBc0Q7Z0JBQ3RELElBQU0sV0FBVyxHQUFH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RUFBRSxFQUFDLEtBQUssRUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUNsRixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUMzRCxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7Z0JBRXRDLElBQUksb0JBQW9CO29CQUFFLG9CQUFvQix5QkFBQyxNQUFNLEVBQUUsSUFBSSxHQUFLLElBQUksR0FBRTtZQUN4RSxDQUFDO1lBRUQsT0FBTyxhQUFhLENBQUM7UUFDdkIsQ0FBQztRQUVELElBQUksV0FBVyxFQUFFO1lBQ2Ysb0JBQW9CLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ3ZFO1FBRUQsb0JBQW9CLENBQUMsU0FBUyxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7UUFDL0Msb0JBQXFCLENBQUMsYUFBYSxHQUFHLG9CQUFvQixDQUFDO1FBQ2pFLE9BQU8sb0JBQW9CLENBQUM7SUFDOUIsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcblxuaW1wb3J0IHtub1NpZGVFZmZlY3RzfSBmcm9tICcuL2Nsb3N1cmUnO1xuXG5cblxuLyoqXG4gKiBBbiBpbnRlcmZhY2UgaW1wbGVtZW50ZWQgYnkgYWxsIEFuZ3VsYXIgdHlwZSBkZWNvcmF0b3JzLCB3aGljaCBhbGxvd3MgdGhlbSB0byBiZSB1c2VkIGFzXG4gKiBkZWNvcmF0b3JzIGFzIHdlbGwgYXMgQW5ndWxhciBzeW50YXguXG4gKlxuICogYGBgXG4gKiBAbmcuQ29tcG9uZW50KHsuLi59KVxuICogY2xhc3MgTXlDbGFzcyB7Li4ufVxuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFR5cGVEZWNvcmF0b3Ige1xuICAvKipcbiAgICogSW52b2tlIGFzIGRlY29yYXRvci5cbiAgICovXG4gIDxUIGV4dGVuZHMgVHlwZTxhbnk+Pih0eXBlOiBUKTogVDtcblxuICAvLyBNYWtlIFR5cGVEZWNvcmF0b3IgYXNzaWduYWJsZSB0byBidWlsdC1pbiBQYXJhbWV0ZXJEZWNvcmF0b3IgdHlwZS5cbiAgLy8gUGFyYW1ldGVyRGVjb3JhdG9yIGlzIGRlY2xhcmVkIGluIGxpYi5kLnRzIGFzIGEgYGRlY2xhcmUgdHlwZWBcbiAgLy8gc28gd2UgY2Fubm90IGRlY2xhcmUgdGhpcyBpbnRlcmZhY2UgYXMgYSBzdWJ0eXBlLlxuICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9pc3N1ZXMvMzM3OSNpc3N1ZWNvbW1lbnQtMTI2MTY5NDE3XG4gICh0YXJnZXQ6IE9iamVjdCwgcHJvcGVydHlLZXk/OiBzdHJpbmd8c3ltYm9sLCBwYXJhbWV0ZXJJbmRleD86IG51bWJlcik6IHZvaWQ7XG59XG5cbmV4cG9ydCBjb25zdCBBTk5PVEFUSU9OUyA9ICdfX2Fubm90YXRpb25zX18nO1xuZXhwb3J0IGNvbnN0IFBBUkFNRVRFUlMgPSAnX19wYXJhbWV0ZXJzX18nO1xuZXhwb3J0IGNvbnN0IFBST1BfTUVUQURBVEEgPSAnX19wcm9wX19tZXRhZGF0YV9fJztcblxuLyoqXG4gKiBAc3VwcHJlc3Mge2dsb2JhbFRoaXN9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYWtlRGVjb3JhdG9yPFQ+KFxuICAgIG5hbWU6IHN0cmluZywgcHJvcHM/OiAoLi4uYXJnczogYW55W10pID0+IGFueSwgcGFyZW50Q2xhc3M/OiBhbnksXG4gICAgYWRkaXRpb25hbFByb2Nlc3Npbmc/OiAodHlwZTogVHlwZTxUPikgPT4gdm9pZCxcbiAgICB0eXBlRm4/OiAodHlwZTogVHlwZTxUPiwgLi4uYXJnczogYW55W10pID0+IHZvaWQpOlxuICAgIHtuZXcgKC4uLmFyZ3M6IGFueVtdKTogYW55OyAoLi4uYXJnczogYW55W10pOiBhbnk7ICguLi5hcmdzOiBhbnlbXSk6IChjbHM6IGFueSkgPT4gYW55O30ge1xuICByZXR1cm4gbm9TaWRlRWZmZWN0cygoKSA9PiB7XG4gICAgY29uc3QgbWV0YUN0b3IgPSBtYWtlTWV0YWRhdGFDdG9yKHByb3BzKTtcblxuICAgIGZ1bmN0aW9uIERlY29yYXRvckZhY3RvcnkoXG4gICAgICAgIHRoaXM6IHVua25vd24gfCB0eXBlb2YgRGVjb3JhdG9yRmFjdG9yeSwgLi4uYXJnczogYW55W10pOiAoY2xzOiBUeXBlPFQ+KSA9PiBhbnkge1xuICAgICAgaWYgKHRoaXMgaW5zdGFuY2VvZiBEZWNvcmF0b3JGYWN0b3J5KSB7XG4gICAgICAgIG1ldGFDdG9yLmNhbGwodGhpcywgLi4uYXJncyk7XG4gICAgICAgIHJldHVybiB0aGlzIGFzIHR5cGVvZiBEZWNvcmF0b3JGYWN0b3J5O1xuICAgICAgfVxuXG4gICAgICBjb25zdCBhbm5vdGF0aW9uSW5zdGFuY2UgPSBuZXcgKERlY29yYXRvckZhY3RvcnkgYXMgYW55KSguLi5hcmdzKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbiBUeXBlRGVjb3JhdG9yKGNsczogVHlwZTxUPikge1xuICAgICAgICBpZiAodHlwZUZuKSB0eXBlRm4oY2xzLCAuLi5hcmdzKTtcbiAgICAgICAgLy8gVXNlIG9mIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSBpcyBpbXBvcnRhbnQgc2luY2UgaXQgY3JlYXRlcyBub24tZW51bWVyYWJsZSBwcm9wZXJ0eSB3aGljaFxuICAgICAgICAvLyBwcmV2ZW50cyB0aGUgcHJvcGVydHkgaXMgY29waWVkIGR1cmluZyBzdWJjbGFzc2luZy5cbiAgICAgICAgY29uc3QgYW5ub3RhdGlvbnMgPSBjbHMuaGFzT3duUHJvcGVydHkoQU5OT1RBVElPTlMpID9cbiAgICAgICAgICAgIChjbHMgYXMgYW55KVtBTk5PVEFUSU9OU10gOlxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNscywgQU5OT1RBVElPTlMsIHt2YWx1ZTogW119KVtBTk5PVEFUSU9OU107XG4gICAgICAgIGFubm90YXRpb25zLnB1c2goYW5ub3RhdGlvbkluc3RhbmNlKTtcblxuXG4gICAgICAgIGlmIChhZGRpdGlvbmFsUHJvY2Vzc2luZykgYWRkaXRpb25hbFByb2Nlc3NpbmcoY2xzKTtcblxuICAgICAgICByZXR1cm4gY2xzO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAocGFyZW50Q2xhc3MpIHtcbiAgICAgIERlY29yYXRvckZhY3RvcnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShwYXJlbnRDbGFzcy5wcm90b3R5cGUpO1xuICAgIH1cblxuICAgIERlY29yYXRvckZhY3RvcnkucHJvdG90eXBlLm5nTWV0YWRhdGFOYW1lID0gbmFtZTtcbiAgICAoRGVjb3JhdG9yRmFjdG9yeSBhcyBhbnkpLmFubm90YXRpb25DbHMgPSBEZWNvcmF0b3JGYWN0b3J5O1xuICAgIHJldHVybiBEZWNvcmF0b3JGYWN0b3J5IGFzIGFueTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG1ha2VNZXRhZGF0YUN0b3IocHJvcHM/OiAoLi4uYXJnczogYW55W10pID0+IGFueSk6IGFueSB7XG4gIHJldHVybiBmdW5jdGlvbiBjdG9yKHRoaXM6IGFueSwgLi4uYXJnczogYW55W10pIHtcbiAgICBpZiAocHJvcHMpIHtcbiAgICAgIGNvbnN0IHZhbHVlcyA9IHByb3BzKC4uLmFyZ3MpO1xuICAgICAgZm9yIChjb25zdCBwcm9wTmFtZSBpbiB2YWx1ZXMpIHtcbiAgICAgICAgdGhpc1twcm9wTmFtZV0gPSB2YWx1ZXNbcHJvcE5hbWVdO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VQYXJhbURlY29yYXRvcihcbiAgICBuYW1lOiBzdHJpbmcsIHByb3BzPzogKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnksIHBhcmVudENsYXNzPzogYW55KTogYW55IHtcbiAgcmV0dXJuIG5vU2lkZUVmZmVjdHMoKCkgPT4ge1xuICAgIGNvbnN0IG1ldGFDdG9yID0gbWFrZU1ldGFkYXRhQ3Rvcihwcm9wcyk7XG4gICAgZnVuY3Rpb24gUGFyYW1EZWNvcmF0b3JGYWN0b3J5KFxuICAgICAgICB0aGlzOiB1bmtub3duIHwgdHlwZW9mIFBhcmFtRGVjb3JhdG9yRmFjdG9yeSwgLi4uYXJnczogYW55W10pOiBhbnkge1xuICAgICAgaWYgKHRoaXMgaW5zdGFuY2VvZiBQYXJhbURlY29yYXRvckZhY3RvcnkpIHtcbiAgICAgICAgbWV0YUN0b3IuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgY29uc3QgYW5ub3RhdGlvbkluc3RhbmNlID0gbmV3ICg8YW55PlBhcmFtRGVjb3JhdG9yRmFjdG9yeSkoLi4uYXJncyk7XG5cbiAgICAgICg8YW55PlBhcmFtRGVjb3JhdG9yKS5hbm5vdGF0aW9uID0gYW5ub3RhdGlvbkluc3RhbmNlO1xuICAgICAgcmV0dXJuIFBhcmFtRGVjb3JhdG9yO1xuXG4gICAgICBmdW5jdGlvbiBQYXJhbURlY29yYXRvcihjbHM6IGFueSwgdW51c2VkS2V5OiBhbnksIGluZGV4OiBudW1iZXIpOiBhbnkge1xuICAgICAgICAvLyBVc2Ugb2YgT2JqZWN0LmRlZmluZVByb3BlcnR5IGlzIGltcG9ydGFudCBzaW5jZSBpdCBjcmVhdGVzIG5vbi1lbnVtZXJhYmxlIHByb3BlcnR5IHdoaWNoXG4gICAgICAgIC8vIHByZXZlbnRzIHRoZSBwcm9wZXJ0eSBpcyBjb3BpZWQgZHVyaW5nIHN1YmNsYXNzaW5nLlxuICAgICAgICBjb25zdCBwYXJhbWV0ZXJzID0gY2xzLmhhc093blByb3BlcnR5KFBBUkFNRVRFUlMpID9cbiAgICAgICAgICAgIChjbHMgYXMgYW55KVtQQVJBTUVURVJTXSA6XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2xzLCBQQVJBTUVURVJTLCB7dmFsdWU6IFtdfSlbUEFSQU1FVEVSU107XG5cbiAgICAgICAgLy8gdGhlcmUgbWlnaHQgYmUgZ2FwcyBpZiBzb21lIGluIGJldHdlZW4gcGFyYW1ldGVycyBkbyBub3QgaGF2ZSBhbm5vdGF0aW9ucy5cbiAgICAgICAgLy8gd2UgcGFkIHdpdGggbnVsbHMuXG4gICAgICAgIHdoaWxlIChwYXJhbWV0ZXJzLmxlbmd0aCA8PSBpbmRleCkge1xuICAgICAgICAgIHBhcmFtZXRlcnMucHVzaChudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIChwYXJhbWV0ZXJzW2luZGV4XSA9IHBhcmFtZXRlcnNbaW5kZXhdIHx8IFtdKS5wdXNoKGFubm90YXRpb25JbnN0YW5jZSk7XG4gICAgICAgIHJldHVybiBjbHM7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChwYXJlbnRDbGFzcykge1xuICAgICAgUGFyYW1EZWNvcmF0b3JGYWN0b3J5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUocGFyZW50Q2xhc3MucHJvdG90eXBlKTtcbiAgICB9XG4gICAgUGFyYW1EZWNvcmF0b3JGYWN0b3J5LnByb3RvdHlwZS5uZ01ldGFkYXRhTmFtZSA9IG5hbWU7XG4gICAgKDxhbnk+UGFyYW1EZWNvcmF0b3JGYWN0b3J5KS5hbm5vdGF0aW9uQ2xzID0gUGFyYW1EZWNvcmF0b3JGYWN0b3J5O1xuICAgIHJldHVybiBQYXJhbURlY29yYXRvckZhY3Rvcnk7XG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFrZVByb3BEZWNvcmF0b3IoXG4gICAgbmFtZTogc3RyaW5nLCBwcm9wcz86ICguLi5hcmdzOiBhbnlbXSkgPT4gYW55LCBwYXJlbnRDbGFzcz86IGFueSxcbiAgICBhZGRpdGlvbmFsUHJvY2Vzc2luZz86ICh0YXJnZXQ6IGFueSwgbmFtZTogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSkgPT4gdm9pZCk6IGFueSB7XG4gIHJldHVybiBub1NpZGVFZmZlY3RzKCgpID0+IHtcbiAgICBjb25zdCBtZXRhQ3RvciA9IG1ha2VNZXRhZGF0YUN0b3IocHJvcHMpO1xuXG4gICAgZnVuY3Rpb24gUHJvcERlY29yYXRvckZhY3RvcnkoXG4gICAgICAgIHRoaXM6IHVua25vd24gfCB0eXBlb2YgUHJvcERlY29yYXRvckZhY3RvcnksIC4uLmFyZ3M6IGFueVtdKTogYW55IHtcbiAgICAgIGlmICh0aGlzIGluc3RhbmNlb2YgUHJvcERlY29yYXRvckZhY3RvcnkpIHtcbiAgICAgICAgbWV0YUN0b3IuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkZWNvcmF0b3JJbnN0YW5jZSA9IG5ldyAoPGFueT5Qcm9wRGVjb3JhdG9yRmFjdG9yeSkoLi4uYXJncyk7XG5cbiAgICAgIGZ1bmN0aW9uIFByb3BEZWNvcmF0b3IodGFyZ2V0OiBhbnksIG5hbWU6IHN0cmluZykge1xuICAgICAgICBjb25zdCBjb25zdHJ1Y3RvciA9IHRhcmdldC5jb25zdHJ1Y3RvcjtcbiAgICAgICAgLy8gVXNlIG9mIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSBpcyBpbXBvcnRhbnQgc2luY2UgaXQgY3JlYXRlcyBub24tZW51bWVyYWJsZSBwcm9wZXJ0eSB3aGljaFxuICAgICAgICAvLyBwcmV2ZW50cyB0aGUgcHJvcGVydHkgaXMgY29waWVkIGR1cmluZyBzdWJjbGFzc2luZy5cbiAgICAgICAgY29uc3QgbWV0YSA9IGNvbnN0cnVjdG9yLmhhc093blByb3BlcnR5KFBST1BfTUVUQURBVEEpID9cbiAgICAgICAgICAgIChjb25zdHJ1Y3RvciBhcyBhbnkpW1BST1BfTUVUQURBVEFdIDpcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjb25zdHJ1Y3RvciwgUFJPUF9NRVRBREFUQSwge3ZhbHVlOiB7fX0pW1BST1BfTUVUQURBVEFdO1xuICAgICAgICBtZXRhW25hbWVdID0gbWV0YS5oYXNPd25Qcm9wZXJ0eShuYW1lKSAmJiBtZXRhW25hbWVdIHx8IFtdO1xuICAgICAgICBtZXRhW25hbWVdLnVuc2hpZnQoZGVjb3JhdG9ySW5zdGFuY2UpO1xuXG4gICAgICAgIGlmIChhZGRpdGlvbmFsUHJvY2Vzc2luZykgYWRkaXRpb25hbFByb2Nlc3NpbmcodGFyZ2V0LCBuYW1lLCAuLi5hcmdzKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFByb3BEZWNvcmF0b3I7XG4gICAgfVxuXG4gICAgaWYgKHBhcmVudENsYXNzKSB7XG4gICAgICBQcm9wRGVjb3JhdG9yRmFjdG9yeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHBhcmVudENsYXNzLnByb3RvdHlwZSk7XG4gICAgfVxuXG4gICAgUHJvcERlY29yYXRvckZhY3RvcnkucHJvdG90eXBlLm5nTWV0YWRhdGFOYW1lID0gbmFtZTtcbiAgICAoPGFueT5Qcm9wRGVjb3JhdG9yRmFjdG9yeSkuYW5ub3RhdGlvbkNscyA9IFByb3BEZWNvcmF0b3JGYWN0b3J5O1xuICAgIHJldHVybiBQcm9wRGVjb3JhdG9yRmFjdG9yeTtcbiAgfSk7XG59XG4iXX0=