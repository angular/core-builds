/**
 * @license Angular v21.1.0+sha-e828f1c
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */

let _currentInjector = undefined;
function getCurrentInjector() {
  return _currentInjector;
}
function setCurrentInjector(injector) {
  const former = _currentInjector;
  _currentInjector = injector;
  return former;
}
function inject(token, options) {
  const currentInjector = getCurrentInjector();
  if (!currentInjector) {
    throw new Error('Current injector is not set.');
  }
  if (!token.ɵprov) {
    throw new Error('Token is not an injectable');
  }
  return currentInjector.retrieve(token, options);
}

const NOT_FOUND = Symbol('NotFound');
class NotFoundError extends Error {
  name = 'ɵNotFound';
  constructor(message) {
    super(message);
  }
}
function isNotFound(e) {
  return e === NOT_FOUND || e?.name === 'ɵNotFound';
}

export { NOT_FOUND, NotFoundError, getCurrentInjector, inject, isNotFound, setCurrentInjector };
//# sourceMappingURL=_not_found-chunk.mjs.map
