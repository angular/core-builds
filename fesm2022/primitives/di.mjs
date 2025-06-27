/**
 * @license Angular v20.1.0-next.3+sha-599baa2
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

export { NOT_FOUND, NotFoundError, getCurrentInjector, inject, isNotFound, setCurrentInjector } from '../injector.mjs';

function defineInjectable(opts) {
    return {
        token: opts.token,
        providedIn: opts.providedIn || null,
        factory: opts.factory,
        value: undefined,
    };
}
function registerInjectable(ctor, declaration) {
    ctor.ɵprov = declaration;
    return ctor;
}

export { defineInjectable, registerInjectable };
//# sourceMappingURL=di.mjs.map
