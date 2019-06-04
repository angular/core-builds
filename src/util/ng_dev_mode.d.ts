/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
declare global {
    const ngDevMode: null | NgDevModePerfCounters;
    interface NgDevModePerfCounters {
        namedConstructors: boolean;
        firstTemplatePass: number;
        tNode: number;
        tView: number;
        rendererCreateTextNode: number;
        rendererSetText: number;
        rendererCreateElement: number;
        rendererAddEventListener: number;
        rendererSetAttribute: number;
        rendererRemoveAttribute: number;
        rendererSetProperty: number;
        rendererSetClassName: number;
        rendererAddClass: number;
        rendererRemoveClass: number;
        rendererSetStyle: number;
        rendererRemoveStyle: number;
        rendererDestroy: number;
        rendererDestroyNode: number;
        rendererMoveNode: number;
        rendererRemoveNode: number;
        rendererAppendChild: number;
        rendererInsertBefore: number;
        rendererCreateComment: number;
        styleMap: number;
        styleMapCacheMiss: number;
        classMap: number;
        classMapCacheMiss: number;
        stylingProp: number;
        stylingPropCacheMiss: number;
        stylingApply: number;
        stylingApplyCacheMiss: number;
    }
}
export declare function ngDevModeResetPerfCounters(): NgDevModePerfCounters;
