import { global, isString } from '../facade/lang';
/**
 * Component resolver that can load components lazily
 * @experimental
 */
export class SystemJsComponentResolver {
    constructor(_resolver) {
        this._resolver = _resolver;
    }
    resolveComponent(componentType) {
        if (isString(componentType)) {
            return global
                .System.import(componentType)
                .then((module /** TODO #9100 */) => this._resolver.resolveComponent(module.default));
        }
        else {
            return this._resolver.resolveComponent(componentType);
        }
    }
    clearCache() { }
}
//# sourceMappingURL=systemjs_component_resolver.js.map