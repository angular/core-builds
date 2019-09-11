/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
/**
 * Used as a state reference for update values between style/class binding instructions.
 */
export interface StylingState {
    classesBitMask: number;
    classesIndex: number;
    stylesBitMask: number;
    stylesIndex: number;
}
export declare const STYLING_INDEX_START_VALUE = 1;
export declare const BIT_MASK_START_VALUE = 0;
export declare function getStylingState(element: any, readFromMap?: boolean): StylingState;
export declare function resetStylingState(): void;
export declare function storeStylingState(element: any, state: StylingState): void;
export declare function deleteStylingStateFromStorage(element: any): void;
export declare function resetAllStylingState(): void;
