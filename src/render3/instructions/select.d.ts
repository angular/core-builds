/**
 * Selects an element for later binding instructions.
 *
 * Used in conjunction with instructions like {@link property} to act on elements with specified
 * indices, for example those created with {@link element} or {@link elementStart}.
 *
 * ```ts
 * (rf: RenderFlags, ctx: any) => {
 *   if (rf & 1) {
 *     element(0, 'div');
 *   }
 *   if (rf & 2) {
 *     select(0); // Select the <div/> created above.
 *     property('title', 'test');
 *   }
 *  }
 * ```
 * @param index the index of the item to act on with the following instructions
 *
 * @publicApi
 */
export declare function Δselect(index: number): void;
