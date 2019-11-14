import { ComponentTemplate } from '../interfaces/definition';
import { LocalRefExtractor } from '../interfaces/node';
/**
 * Creates an LContainer for inline views, e.g.
 *
 * % if (showing) {
 *   <div></div>
 * % }
 *
 * @param index The index of the container in the data array
 *
 * @codeGenApi
 */
export declare function ɵɵcontainer(index: number): void;
/**
 * Creates an LContainer for an ng-template (dynamically-inserted view), e.g.
 *
 * <ng-template #foo>
 *    <div></div>
 * </ng-template>
 *
 * @param index The index of the container in the data array
 * @param templateFn Inline template
 * @param decls The number of nodes, local refs, and pipes for this template
 * @param vars The number of bindings for this template
 * @param tagName The name of the container element, if applicable
 * @param attrsIndex Index of template attributes in the `consts` array.
 * @param localRefs Index of the local references in the `consts` array.
 * @param localRefExtractor A function which extracts local-refs values from the template.
 *        Defaults to the current element associated with the local-ref.
 *
 * @codeGenApi
 */
export declare function ɵɵtemplate(index: number, templateFn: ComponentTemplate<any> | null, decls: number, vars: number, tagName?: string | null, attrsIndex?: number | null, localRefsIndex?: number | null, localRefExtractor?: LocalRefExtractor): void;
/**
 * Sets a container up to receive views.
 *
 * @param index The index of the container in the data array
 *
 * @codeGenApi
 */
export declare function ɵɵcontainerRefreshStart(index: number): void;
/**
 * Marks the end of the LContainer.
 *
 * Marking the end of LContainer is the time when to child views get inserted or removed.
 *
 * @codeGenApi
 */
export declare function ɵɵcontainerRefreshEnd(): void;
