import { isPresent, isArray, isString, NumberWrapper } from '../facade/lang';
import { BaseException } from '../facade/exceptions';
export const AUTO_STYLE = "*";
export class AnimationEntryMetadata {
    constructor(name, definitions) {
        this.name = name;
        this.definitions = definitions;
    }
}
export class AnimationStateMetadata {
}
export class AnimationStateDeclarationMetadata extends AnimationStateMetadata {
    constructor(stateNameExpr, styles) {
        super();
        this.stateNameExpr = stateNameExpr;
        this.styles = styles;
    }
}
export class AnimationStateTransitionMetadata extends AnimationStateMetadata {
    constructor(stateChangeExpr, animation) {
        super();
        this.stateChangeExpr = stateChangeExpr;
        this.animation = animation;
    }
}
export class AnimationMetadata {
}
export class AnimationKeyframesSequenceMetadata extends AnimationMetadata {
    constructor(steps) {
        super();
        this.steps = steps;
    }
}
export class AnimationStyleMetadata extends AnimationMetadata {
    constructor(styles, offset = null) {
        super();
        this.styles = styles;
        this.offset = offset;
    }
}
export class AnimationAnimateMetadata extends AnimationMetadata {
    constructor(timings, styles) {
        super();
        this.timings = timings;
        this.styles = styles;
    }
}
export class AnimationWithStepsMetadata extends AnimationMetadata {
    constructor() {
        super();
    }
    get steps() { throw new BaseException('NOT IMPLEMENTED: Base Class'); }
}
export class AnimationSequenceMetadata extends AnimationWithStepsMetadata {
    constructor(_steps) {
        super();
        this._steps = _steps;
    }
    get steps() { return this._steps; }
}
export class AnimationGroupMetadata extends AnimationWithStepsMetadata {
    constructor(_steps) {
        super();
        this._steps = _steps;
    }
    get steps() { return this._steps; }
}
export function animate(timing, styles = null) {
    var stylesEntry = styles;
    if (!isPresent(stylesEntry)) {
        var EMPTY_STYLE = {};
        stylesEntry = new AnimationStyleMetadata([EMPTY_STYLE], 1);
    }
    return new AnimationAnimateMetadata(timing, stylesEntry);
}
export function group(steps) {
    return new AnimationGroupMetadata(steps);
}
export function sequence(steps) {
    return new AnimationSequenceMetadata(steps);
}
export function style(tokens) {
    var input;
    var offset = null;
    if (isString(tokens)) {
        input = [tokens];
    }
    else {
        if (isArray(tokens)) {
            input = tokens;
        }
        else {
            input = [tokens];
        }
        input.forEach(entry => {
            var entryOffset = entry['offset'];
            if (isPresent(entryOffset)) {
                offset = offset == null ? NumberWrapper.parseFloat(entryOffset) : offset;
            }
        });
    }
    return new AnimationStyleMetadata(input, offset);
}
export function state(stateNameExpr, styles) {
    return new AnimationStateDeclarationMetadata(stateNameExpr, styles);
}
export function keyframes(steps) {
    var stepData = isArray(steps)
        ? steps
        : [steps];
    return new AnimationKeyframesSequenceMetadata(stepData);
}
export function transition(stateChangeExpr, animationData) {
    var animation = isArray(animationData)
        ? new AnimationSequenceMetadata(animationData)
        : animationData;
    return new AnimationStateTransitionMetadata(stateChangeExpr, animation);
}
export function trigger(name, animation) {
    var entry = isArray(animation)
        ? animation
        : [animation];
    return new AnimationEntryMetadata(name, entry);
}
//# sourceMappingURL=metadata.js.map