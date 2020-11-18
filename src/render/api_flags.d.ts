/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ViewEncapsulation } from '../metadata/view';
/**
 * Used by `RendererFactory2` to associate custom rendering data and styles
 * with a rendering implementation.
 *  @publicApi
 */
export interface RendererType2 {
    /**
     * A unique identifying string for the new renderer, used when creating
     * unique styles for encapsulation.
     */
    id: string;
    /**
     * The view encapsulation type, which determines how styles are applied to
     * DOM elements. One of
     * - `Emulated` (default): Emulate native scoping of styles.
     * - `Native`: Use the native encapsulation mechanism of the renderer.
     * - `ShadowDom`: Use modern [Shadow
     * DOM](https://w3c.github.io/webcomponents/spec/shadow/) and
     * create a ShadowRoot for component's host element.
     * - `None`: Do not provide any template or style encapsulation.
     */
    encapsulation: ViewEncapsulation;
    /**
     * Defines CSS styles to be stored on a renderer instance.
     */
    styles: (string | any[])[];
    /**
     * Defines arbitrary developer-defined data to be stored on a renderer instance.
     * This is useful for renderers that delegate to other renderers.
     */
    data: {
        [kind: string]: any;
    };
}
/**
 * Flags for renderer-specific style modifiers.
 * @publicApi
 */
export declare enum RendererStyleFlags2 {
    /**
     * Marks a style as important.
     */
    Important = 1,
    /**
     * Marks a style as using dash case naming (this-is-dash-case).
     */
    DashCase = 2
}
