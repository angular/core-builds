/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export let LifecycleHooks = {};
LifecycleHooks.OnInit = 0;
LifecycleHooks.OnDestroy = 1;
LifecycleHooks.DoCheck = 2;
LifecycleHooks.OnChanges = 3;
LifecycleHooks.AfterContentInit = 4;
LifecycleHooks.AfterContentChecked = 5;
LifecycleHooks.AfterViewInit = 6;
LifecycleHooks.AfterViewChecked = 7;
LifecycleHooks[LifecycleHooks.OnInit] = "OnInit";
LifecycleHooks[LifecycleHooks.OnDestroy] = "OnDestroy";
LifecycleHooks[LifecycleHooks.DoCheck] = "DoCheck";
LifecycleHooks[LifecycleHooks.OnChanges] = "OnChanges";
LifecycleHooks[LifecycleHooks.AfterContentInit] = "AfterContentInit";
LifecycleHooks[LifecycleHooks.AfterContentChecked] = "AfterContentChecked";
LifecycleHooks[LifecycleHooks.AfterViewInit] = "AfterViewInit";
LifecycleHooks[LifecycleHooks.AfterViewChecked] = "AfterViewChecked";
export const /** @type {?} */ LIFECYCLE_HOOKS_VALUES = [
    LifecycleHooks.OnInit, LifecycleHooks.OnDestroy, LifecycleHooks.DoCheck, LifecycleHooks.OnChanges,
    LifecycleHooks.AfterContentInit, LifecycleHooks.AfterContentChecked, LifecycleHooks.AfterViewInit,
    LifecycleHooks.AfterViewChecked
];
/**
 * \@whatItDoes Lifecycle hook that is called when any data-bound property of a directive changes.
 * \@howToUse
 * {\@example core/ts/metadata/lifecycle_hooks_spec.ts region='OnChanges'}
 *
 * \@description
 * `ngOnChanges` is called right after the data-bound properties have been checked and before view
 * and content children are checked if at least one of them has changed.
 * The `changes` parameter contains the changed properties.
 *
 * See {\@linkDocs guide/lifecycle-hooks#onchanges "Lifecycle Hooks Guide"}.
 *
 * \@stable
 * @abstract
 */
export class OnChanges {
    /**
     * @abstract
     * @param {?} changes
     * @return {?}
     */
    ngOnChanges(changes) { }
}
/**
 * \@whatItDoes Lifecycle hook that is called after data-bound properties of a directive are
 * initialized.
 * \@howToUse
 * {\@example core/ts/metadata/lifecycle_hooks_spec.ts region='OnInit'}
 *
 * \@description
 * `ngOnInit` is called right after the directive's data-bound properties have been checked for the
 * first time, and before any of its children have been checked. It is invoked only once when the
 * directive is instantiated.
 *
 * See {\@linkDocs guide/lifecycle-hooks "Lifecycle Hooks Guide"}.
 *
 * \@stable
 * @abstract
 */
export class OnInit {
    /**
     * @abstract
     * @return {?}
     */
    ngOnInit() { }
}
/**
 * \@whatItDoes Lifecycle hook that is called when Angular dirty checks a directive.
 * \@howToUse
 * {\@example core/ts/metadata/lifecycle_hooks_spec.ts region='DoCheck'}
 *
 * \@description
 * `ngDoCheck` gets called to check the changes in the directives in addition to the default
 * algorithm. The default change detection algorithm looks for differences by comparing
 * bound-property values by reference across change detection runs.
 *
 * Note that a directive typically should not use both `DoCheck` and {\@link OnChanges} to respond to
 * changes on the same input, as `ngOnChanges` will continue to be called when the default change
 * detector detects changes.
 *
 * See {\@link KeyValueDiffers} and {\@link IterableDiffers} for implementing custom dirty checking
 * for collections.
 *
 * See {\@linkDocs guide/lifecycle-hooks#docheck "Lifecycle Hooks Guide"}.
 *
 * \@stable
 * @abstract
 */
export class DoCheck {
    /**
     * @abstract
     * @return {?}
     */
    ngDoCheck() { }
}
/**
 * \@whatItDoes Lifecycle hook that is called when a directive, pipe or service is destroyed.
 * \@howToUse
 * {\@example core/ts/metadata/lifecycle_hooks_spec.ts region='OnDestroy'}
 *
 * \@description
 * `ngOnDestroy` callback is typically used for any custom cleanup that needs to occur when the
 * instance is destroyed.
 *
 * See {\@linkDocs guide/lifecycle-hooks "Lifecycle Hooks Guide"}.
 *
 * \@stable
 * @abstract
 */
export class OnDestroy {
    /**
     * @abstract
     * @return {?}
     */
    ngOnDestroy() { }
}
/**
 *
 * \@whatItDoes Lifecycle hook that is called after a directive's content has been fully
 * initialized.
 * \@howToUse
 * {\@example core/ts/metadata/lifecycle_hooks_spec.ts region='AfterContentInit'}
 *
 * \@description
 * See {\@linkDocs guide/lifecycle-hooks#aftercontent "Lifecycle Hooks Guide"}.
 *
 * \@stable
 * @abstract
 */
export class AfterContentInit {
    /**
     * @abstract
     * @return {?}
     */
    ngAfterContentInit() { }
}
/**
 * \@whatItDoes Lifecycle hook that is called after every check of a directive's content.
 * \@howToUse
 * {\@example core/ts/metadata/lifecycle_hooks_spec.ts region='AfterContentChecked'}
 *
 * \@description
 * See {\@linkDocs guide/lifecycle-hooks#aftercontent "Lifecycle Hooks Guide"}.
 *
 * \@stable
 * @abstract
 */
export class AfterContentChecked {
    /**
     * @abstract
     * @return {?}
     */
    ngAfterContentChecked() { }
}
/**
 * \@whatItDoes Lifecycle hook that is called after a component's view has been fully
 * initialized.
 * \@howToUse
 * {\@example core/ts/metadata/lifecycle_hooks_spec.ts region='AfterViewInit'}
 *
 * \@description
 * See {\@linkDocs guide/lifecycle-hooks#afterview "Lifecycle Hooks Guide"}.
 *
 * \@stable
 * @abstract
 */
export class AfterViewInit {
    /**
     * @abstract
     * @return {?}
     */
    ngAfterViewInit() { }
}
/**
 * \@whatItDoes Lifecycle hook that is called after every check of a component's view.
 * \@howToUse
 * {\@example core/ts/metadata/lifecycle_hooks_spec.ts region='AfterViewChecked'}
 *
 * \@description
 * See {\@linkDocs guide/lifecycle-hooks#afterview "Lifecycle Hooks Guide"}.
 *
 * \@stable
 * @abstract
 */
export class AfterViewChecked {
    /**
     * @abstract
     * @return {?}
     */
    ngAfterViewChecked() { }
}
//# sourceMappingURL=lifecycle_hooks.js.map