/**
 * @license Angular v22.0.0-next.0+sha-bdbb7cc
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */

export { NOT_FOUND, NotFoundError, getCurrentInjector, inject, isNotFound, setCurrentInjector } from './_not_found-chunk.mjs';

function defineInjectable(opts) {
  return {
    token: opts.token,
    providedIn: opts.providedIn || null,
    factory: opts.factory,
    value: undefined
  };
}
function registerInjectable(ctor, declaration) {
  ctor.ɵprov = declaration;
  return ctor;
}

export { defineInjectable, registerInjectable };
//# sourceMappingURL=primitives-di.mjs.map
