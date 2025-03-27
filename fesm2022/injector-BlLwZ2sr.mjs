/**
 * @license Angular v20.0.0-next.4+sha-f7385b4
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

/**
 * Current injector value used by `inject`.
 * - `undefined`: it is an error to call `inject`
 * - `null`: `inject` can be called but there is no injector (limp-mode).
 * - Injector instance: Use the injector for resolution.
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

export { getCurrentInjector as g, setCurrentInjector as s };
//# sourceMappingURL=injector-BlLwZ2sr.mjs.map
