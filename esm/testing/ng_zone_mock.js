/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable, NgZone } from '../index';
import { EventEmitter, ObservableWrapper } from '../src/facade/async';
export class MockNgZone extends NgZone {
    constructor() {
        super({ enableLongStackTrace: false });
        this._mockOnStable = new EventEmitter(false);
    }
    get onStable() { return this._mockOnStable; }
    run(fn) { return fn(); }
    runOutsideAngular(fn) { return fn(); }
    simulateZoneExit() { ObservableWrapper.callNext(this.onStable, null); }
}
/** @nocollapse */
MockNgZone.decorators = [
    { type: Injectable },
];
/** @nocollapse */
MockNgZone.ctorParameters = [];
//# sourceMappingURL=ng_zone_mock.js.map