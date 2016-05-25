"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var lang_1 = require('../facade/lang');
var exceptions_1 = require('../facade/exceptions');
exports.AUTO_STYLE = "*";
var AnimationEntryMetadata = (function () {
    function AnimationEntryMetadata(name, definitions) {
        this.name = name;
        this.definitions = definitions;
    }
    return AnimationEntryMetadata;
}());
exports.AnimationEntryMetadata = AnimationEntryMetadata;
var AnimationStateMetadata = (function () {
    function AnimationStateMetadata() {
    }
    return AnimationStateMetadata;
}());
exports.AnimationStateMetadata = AnimationStateMetadata;
var AnimationStateDeclarationMetadata = (function (_super) {
    __extends(AnimationStateDeclarationMetadata, _super);
    function AnimationStateDeclarationMetadata(stateNameExpr, styles) {
        _super.call(this);
        this.stateNameExpr = stateNameExpr;
        this.styles = styles;
    }
    return AnimationStateDeclarationMetadata;
}(AnimationStateMetadata));
exports.AnimationStateDeclarationMetadata = AnimationStateDeclarationMetadata;
var AnimationStateTransitionMetadata = (function (_super) {
    __extends(AnimationStateTransitionMetadata, _super);
    function AnimationStateTransitionMetadata(stateChangeExpr, animation) {
        _super.call(this);
        this.stateChangeExpr = stateChangeExpr;
        this.animation = animation;
    }
    return AnimationStateTransitionMetadata;
}(AnimationStateMetadata));
exports.AnimationStateTransitionMetadata = AnimationStateTransitionMetadata;
var AnimationMetadata = (function () {
    function AnimationMetadata() {
    }
    return AnimationMetadata;
}());
exports.AnimationMetadata = AnimationMetadata;
var AnimationKeyframesSequenceMetadata = (function (_super) {
    __extends(AnimationKeyframesSequenceMetadata, _super);
    function AnimationKeyframesSequenceMetadata(steps) {
        _super.call(this);
        this.steps = steps;
    }
    return AnimationKeyframesSequenceMetadata;
}(AnimationMetadata));
exports.AnimationKeyframesSequenceMetadata = AnimationKeyframesSequenceMetadata;
var AnimationStyleMetadata = (function (_super) {
    __extends(AnimationStyleMetadata, _super);
    function AnimationStyleMetadata(styles, offset) {
        if (offset === void 0) { offset = null; }
        _super.call(this);
        this.styles = styles;
        this.offset = offset;
    }
    return AnimationStyleMetadata;
}(AnimationMetadata));
exports.AnimationStyleMetadata = AnimationStyleMetadata;
var AnimationAnimateMetadata = (function (_super) {
    __extends(AnimationAnimateMetadata, _super);
    function AnimationAnimateMetadata(timings, styles) {
        _super.call(this);
        this.timings = timings;
        this.styles = styles;
    }
    return AnimationAnimateMetadata;
}(AnimationMetadata));
exports.AnimationAnimateMetadata = AnimationAnimateMetadata;
var AnimationWithStepsMetadata = (function (_super) {
    __extends(AnimationWithStepsMetadata, _super);
    function AnimationWithStepsMetadata() {
        _super.call(this);
    }
    Object.defineProperty(AnimationWithStepsMetadata.prototype, "steps", {
        get: function () { throw new exceptions_1.BaseException('NOT IMPLEMENTED: Base Class'); },
        enumerable: true,
        configurable: true
    });
    return AnimationWithStepsMetadata;
}(AnimationMetadata));
exports.AnimationWithStepsMetadata = AnimationWithStepsMetadata;
var AnimationSequenceMetadata = (function (_super) {
    __extends(AnimationSequenceMetadata, _super);
    function AnimationSequenceMetadata(_steps) {
        _super.call(this);
        this._steps = _steps;
    }
    Object.defineProperty(AnimationSequenceMetadata.prototype, "steps", {
        get: function () { return this._steps; },
        enumerable: true,
        configurable: true
    });
    return AnimationSequenceMetadata;
}(AnimationWithStepsMetadata));
exports.AnimationSequenceMetadata = AnimationSequenceMetadata;
var AnimationGroupMetadata = (function (_super) {
    __extends(AnimationGroupMetadata, _super);
    function AnimationGroupMetadata(_steps) {
        _super.call(this);
        this._steps = _steps;
    }
    Object.defineProperty(AnimationGroupMetadata.prototype, "steps", {
        get: function () { return this._steps; },
        enumerable: true,
        configurable: true
    });
    return AnimationGroupMetadata;
}(AnimationWithStepsMetadata));
exports.AnimationGroupMetadata = AnimationGroupMetadata;
function animate(timing, styles) {
    if (styles === void 0) { styles = null; }
    var stylesEntry = styles;
    if (!lang_1.isPresent(stylesEntry)) {
        var EMPTY_STYLE = {};
        stylesEntry = new AnimationStyleMetadata([EMPTY_STYLE], 1);
    }
    return new AnimationAnimateMetadata(timing, stylesEntry);
}
exports.animate = animate;
function group(steps) {
    return new AnimationGroupMetadata(steps);
}
exports.group = group;
function sequence(steps) {
    return new AnimationSequenceMetadata(steps);
}
exports.sequence = sequence;
function style(tokens) {
    var input;
    var offset = null;
    if (lang_1.isString(tokens)) {
        input = [tokens];
    }
    else {
        if (lang_1.isArray(tokens)) {
            input = tokens;
        }
        else {
            input = [tokens];
        }
        input.forEach(function (entry) {
            var entryOffset = entry['offset'];
            if (lang_1.isPresent(entryOffset)) {
                offset = offset == null ? lang_1.NumberWrapper.parseFloat(entryOffset) : offset;
            }
        });
    }
    return new AnimationStyleMetadata(input, offset);
}
exports.style = style;
function state(stateNameExpr, styles) {
    return new AnimationStateDeclarationMetadata(stateNameExpr, styles);
}
exports.state = state;
function keyframes(steps) {
    var stepData = lang_1.isArray(steps)
        ? steps
        : [steps];
    return new AnimationKeyframesSequenceMetadata(stepData);
}
exports.keyframes = keyframes;
function transition(stateChangeExpr, animationData) {
    var animation = lang_1.isArray(animationData)
        ? new AnimationSequenceMetadata(animationData)
        : animationData;
    return new AnimationStateTransitionMetadata(stateChangeExpr, animation);
}
exports.transition = transition;
function trigger(name, animation) {
    var entry = lang_1.isArray(animation)
        ? animation
        : [animation];
    return new AnimationEntryMetadata(name, entry);
}
exports.trigger = trigger;
//# sourceMappingURL=metadata.js.map