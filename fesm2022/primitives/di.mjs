/**
 * @license Angular v20.1.0-next.3+sha-c5c9b0b
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

export { NOT_FOUND, NotFoundError, getCurrentInjector, inject, isNotFound, setCurrentInjector } from '../injector.mjs';

function registerInjectable(ctor, declaration) {
    ctor.ɵprov = declaration;
    return ctor;
}

export { registerInjectable };
//# sourceMappingURL=di.mjs.map
