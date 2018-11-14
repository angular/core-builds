/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RenderUtil } from './interfaces';
export declare function getDefaultRenderUtil(): RenderUtil;
export declare class DefaultRenderUtil implements RenderUtil {
    getComputedStyle(element: HTMLElement, prop: string): string;
    fireReflow(element: HTMLElement, frameCallback?: () => any): void;
    setTimeout(fn: Function, time: number): any;
    clearTimeout(timeoutVal: any): void;
    setTransition(element: HTMLElement, value: string | null): void;
}
