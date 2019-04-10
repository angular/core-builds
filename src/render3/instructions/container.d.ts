import { ComponentTemplate } from '../interfaces/definition';
import { LocalRefExtractor, TAttributes } from '../interfaces/node';
/**
 * Creates an LContainer for inline views, e.g.
 *
 * % if (showing) {
 *   <div></div>
 * % }
 *
 * @param index The index of the container in the data array
 *
 * @publicApi
 */
export declare function Δcontainer(index: number): void;
/**
 * Creates an LContainer for an ng-template (dynamically-inserted view), e.g.
 *
 * <ng-template #foo>
 *    <div></div>
 * </ng-template>
 *
 * @param index The index of the container in the data array
 * @param templateFn Inline template
 * @param consts The number of nodes, local refs, and pipes for this template
 * @param vars The number of bindings for this template
 * @param tagName The name of the container element, if applicable
 * @param attrs The attrs attached to the container, if applicable
 * @param localRefs A set of local reference bindings on the element.
 * @param localRefExtractor A function which extracts local-refs values from the template.
 *        Defaults to the current element associated with the local-ref.
 *
 * @publicApi
 */
export declare function Δtemplate(index: number, templateFn: ComponentTemplate<any> | null, consts: number, vars: number, tagName?: string | null, attrs?: TAttributes | null, localRefs?: string[] | null, localRefExtractor?: LocalRefExtractor): void;
/**
 * Sets a container up to receive views.
 *
 * @param index The index of the container in the data array
 *
 * @publicApi
 */
export declare function ΔcontainerRefreshStart(index: number): void;
/**
 * Marks the end of the LContainer.
 *
 * Marking the end of LContainer is the time when to child views get inserted or removed.
 *
 * @publicApi
 */
export declare function ΔcontainerRefreshEnd(): void;
