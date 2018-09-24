/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../ng_dev_mode';
import { LContext } from '../context_discovery';
import { AnimationContext, ComponentInstance, DirectiveInstance, Player } from './interfaces';
export declare function addPlayer(ref: ComponentInstance | DirectiveInstance | HTMLElement, player: Player): void;
export declare function getPlayers(ref: ComponentInstance | DirectiveInstance | HTMLElement): Player[];
export declare function getOrCreateAnimationContext(target: {}, context?: LContext | null): AnimationContext;
