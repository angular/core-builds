import { isString, global } from '../../src/facade/lang';
/**
 * Component resolver that can load components lazily
 */
export class SystemJsComponentResolver {
    constructor(_resolver) {
        this._resolver = _resolver;
    }
    resolveComponent(componentType) {
        if (isString(componentType)) {
            return global.System.import(componentType).then(module => this._resolver.resolveComponent(module.default));
        }
        else {
            return this._resolver.resolveComponent(componentType);
        }
    }
    clearCache() { }
}
//# sourceMappingURL=systemjs_component_resolver.js.map