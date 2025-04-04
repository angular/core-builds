'use strict';
/**
 * @license Angular v20.0.0-next.5+sha-9228a73
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var compiler = require('./compiler-BQ7R7w2v.js');
var ts = require('typescript');
var p = require('path');
var checker = require('./checker-BRvGmaOO.js');
require('os');

function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var p__namespace = /*#__PURE__*/_interopNamespaceDefault(p);

class XmlTagDefinition {
    closedByParent = false;
    implicitNamespacePrefix = null;
    isVoid = false;
    ignoreFirstLf = false;
    canSelfClose = true;
    preventNamespaceInheritance = false;
    requireExtraParent(currentParent) {
        return false;
    }
    isClosedByChild(name) {
        return false;
    }
    getContentType() {
        return compiler.TagContentType.PARSABLE_DATA;
    }
}
const _TAG_DEFINITION = new XmlTagDefinition();
function getXmlTagDefinition(tagName) {
    return _TAG_DEFINITION;
}

class XmlParser extends compiler.Parser {
    constructor() {
        super(getXmlTagDefinition);
    }
    parse(source, url, options = {}) {
        // Blocks and let declarations aren't supported in an XML context.
        return super.parse(source, url, {
            ...options,
            tokenizeBlocks: false,
            tokenizeLet: false,
            selectorlessEnabled: false,
        });
    }
}

const _VERSION$1 = '1.2';
const _XMLNS$1 = 'urn:oasis:names:tc:xliff:document:1.2';
// TODO(vicb): make this a param (s/_/-/)
const _DEFAULT_SOURCE_LANG$1 = 'en';
const _PLACEHOLDER_TAG$1 = 'x';
const _MARKER_TAG$1 = 'mrk';
const _FILE_TAG = 'file';
const _SOURCE_TAG$1 = 'source';
const _SEGMENT_SOURCE_TAG = 'seg-source';
const _ALT_TRANS_TAG = 'alt-trans';
const _TARGET_TAG$1 = 'target';
const _UNIT_TAG$1 = 'trans-unit';
const _CONTEXT_GROUP_TAG = 'context-group';
const _CONTEXT_TAG = 'context';
// https://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html
// https://docs.oasis-open.org/xliff/v1.2/xliff-profile-html/xliff-profile-html-1.2.html
class Xliff extends compiler.Serializer {
    write(messages, locale) {
        const visitor = new _WriteVisitor$1();
        const transUnits = [];
        messages.forEach((message) => {
            let contextTags = [];
            message.sources.forEach((source) => {
                let contextGroupTag = new compiler.Tag(_CONTEXT_GROUP_TAG, { purpose: 'location' });
                contextGroupTag.children.push(new compiler.CR(10), new compiler.Tag(_CONTEXT_TAG, { 'context-type': 'sourcefile' }, [
                    new compiler.Text$1(source.filePath),
                ]), new compiler.CR(10), new compiler.Tag(_CONTEXT_TAG, { 'context-type': 'linenumber' }, [
                    new compiler.Text$1(`${source.startLine}`),
                ]), new compiler.CR(8));
                contextTags.push(new compiler.CR(8), contextGroupTag);
            });
            const transUnit = new compiler.Tag(_UNIT_TAG$1, { id: message.id, datatype: 'html' });
            transUnit.children.push(new compiler.CR(8), new compiler.Tag(_SOURCE_TAG$1, {}, visitor.serialize(message.nodes)), ...contextTags);
            if (message.description) {
                transUnit.children.push(new compiler.CR(8), new compiler.Tag('note', { priority: '1', from: 'description' }, [
                    new compiler.Text$1(message.description),
                ]));
            }
            if (message.meaning) {
                transUnit.children.push(new compiler.CR(8), new compiler.Tag('note', { priority: '1', from: 'meaning' }, [new compiler.Text$1(message.meaning)]));
            }
            transUnit.children.push(new compiler.CR(6));
            transUnits.push(new compiler.CR(6), transUnit);
        });
        const body = new compiler.Tag('body', {}, [...transUnits, new compiler.CR(4)]);
        const file = new compiler.Tag('file', {
            'source-language': locale || _DEFAULT_SOURCE_LANG$1,
            datatype: 'plaintext',
            original: 'ng2.template',
        }, [new compiler.CR(4), body, new compiler.CR(2)]);
        const xliff = new compiler.Tag('xliff', { version: _VERSION$1, xmlns: _XMLNS$1 }, [
            new compiler.CR(2),
            file,
            new compiler.CR(),
        ]);
        return compiler.serialize([
            new compiler.Declaration({ version: '1.0', encoding: 'UTF-8' }),
            new compiler.CR(),
            xliff,
            new compiler.CR(),
        ]);
    }
    load(content, url) {
        // xliff to xml nodes
        const xliffParser = new XliffParser();
        const { locale, msgIdToHtml, errors } = xliffParser.parse(content, url);
        // xml nodes to i18n nodes
        const i18nNodesByMsgId = {};
        const converter = new XmlToI18n$1();
        Object.keys(msgIdToHtml).forEach((msgId) => {
            const { i18nNodes, errors: e } = converter.convert(msgIdToHtml[msgId], url);
            errors.push(...e);
            i18nNodesByMsgId[msgId] = i18nNodes;
        });
        if (errors.length) {
            throw new Error(`xliff parse errors:\n${errors.join('\n')}`);
        }
        return { locale: locale, i18nNodesByMsgId };
    }
    digest(message) {
        return compiler.digest(message);
    }
}
let _WriteVisitor$1 = class _WriteVisitor {
    visitText(text, context) {
        return [new compiler.Text$1(text.value)];
    }
    visitContainer(container, context) {
        const nodes = [];
        container.children.forEach((node) => nodes.push(...node.visit(this)));
        return nodes;
    }
    visitIcu(icu, context) {
        const nodes = [new compiler.Text$1(`{${icu.expressionPlaceholder}, ${icu.type}, `)];
        Object.keys(icu.cases).forEach((c) => {
            nodes.push(new compiler.Text$1(`${c} {`), ...icu.cases[c].visit(this), new compiler.Text$1(`} `));
        });
        nodes.push(new compiler.Text$1(`}`));
        return nodes;
    }
    visitTagPlaceholder(ph, context) {
        const ctype = getCtypeForTag(ph.tag);
        if (ph.isVoid) {
            // void tags have no children nor closing tags
            return [
                new compiler.Tag(_PLACEHOLDER_TAG$1, { id: ph.startName, ctype, 'equiv-text': `<${ph.tag}/>` }),
            ];
        }
        const startTagPh = new compiler.Tag(_PLACEHOLDER_TAG$1, {
            id: ph.startName,
            ctype,
            'equiv-text': `<${ph.tag}>`,
        });
        const closeTagPh = new compiler.Tag(_PLACEHOLDER_TAG$1, {
            id: ph.closeName,
            ctype,
            'equiv-text': `</${ph.tag}>`,
        });
        return [startTagPh, ...this.serialize(ph.children), closeTagPh];
    }
    visitPlaceholder(ph, context) {
        return [new compiler.Tag(_PLACEHOLDER_TAG$1, { id: ph.name, 'equiv-text': `{{${ph.value}}}` })];
    }
    visitBlockPlaceholder(ph, context) {
        const ctype = `x-${ph.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const startTagPh = new compiler.Tag(_PLACEHOLDER_TAG$1, {
            id: ph.startName,
            ctype,
            'equiv-text': `@${ph.name}`,
        });
        const closeTagPh = new compiler.Tag(_PLACEHOLDER_TAG$1, { id: ph.closeName, ctype, 'equiv-text': `}` });
        return [startTagPh, ...this.serialize(ph.children), closeTagPh];
    }
    visitIcuPlaceholder(ph, context) {
        const equivText = `{${ph.value.expression}, ${ph.value.type}, ${Object.keys(ph.value.cases)
            .map((value) => value + ' {...}')
            .join(' ')}}`;
        return [new compiler.Tag(_PLACEHOLDER_TAG$1, { id: ph.name, 'equiv-text': equivText })];
    }
    serialize(nodes) {
        return [].concat(...nodes.map((node) => node.visit(this)));
    }
};
// TODO(vicb): add error management (structure)
// Extract messages as xml nodes from the xliff file
class XliffParser {
    // using non-null assertions because they're re(set) by parse()
    _unitMlString;
    _errors;
    _msgIdToHtml;
    _locale = null;
    parse(xliff, url) {
        this._unitMlString = null;
        this._msgIdToHtml = {};
        const xml = new XmlParser().parse(xliff, url);
        this._errors = xml.errors;
        compiler.visitAll$1(this, xml.rootNodes, null);
        return {
            msgIdToHtml: this._msgIdToHtml,
            errors: this._errors,
            locale: this._locale,
        };
    }
    visitElement(element, context) {
        switch (element.name) {
            case _UNIT_TAG$1:
                this._unitMlString = null;
                const idAttr = element.attrs.find((attr) => attr.name === 'id');
                if (!idAttr) {
                    this._addError(element, `<${_UNIT_TAG$1}> misses the "id" attribute`);
                }
                else {
                    const id = idAttr.value;
                    if (this._msgIdToHtml.hasOwnProperty(id)) {
                        this._addError(element, `Duplicated translations for msg ${id}`);
                    }
                    else {
                        compiler.visitAll$1(this, element.children, null);
                        if (typeof this._unitMlString === 'string') {
                            this._msgIdToHtml[id] = this._unitMlString;
                        }
                        else {
                            this._addError(element, `Message ${id} misses a translation`);
                        }
                    }
                }
                break;
            // ignore those tags
            case _SOURCE_TAG$1:
            case _SEGMENT_SOURCE_TAG:
            case _ALT_TRANS_TAG:
                break;
            case _TARGET_TAG$1:
                const innerTextStart = element.startSourceSpan.end.offset;
                const innerTextEnd = element.endSourceSpan.start.offset;
                const content = element.startSourceSpan.start.file.content;
                const innerText = content.slice(innerTextStart, innerTextEnd);
                this._unitMlString = innerText;
                break;
            case _FILE_TAG:
                const localeAttr = element.attrs.find((attr) => attr.name === 'target-language');
                if (localeAttr) {
                    this._locale = localeAttr.value;
                }
                compiler.visitAll$1(this, element.children, null);
                break;
            default:
                // TODO(vicb): assert file structure, xliff version
                // For now only recurse on unhandled nodes
                compiler.visitAll$1(this, element.children, null);
        }
    }
    visitAttribute(attribute, context) { }
    visitText(text, context) { }
    visitComment(comment, context) { }
    visitExpansion(expansion, context) { }
    visitExpansionCase(expansionCase, context) { }
    visitBlock(block, context) { }
    visitBlockParameter(parameter, context) { }
    visitLetDeclaration(decl, context) { }
    visitComponent(component, context) { }
    visitDirective(directive, context) { }
    _addError(node, message) {
        this._errors.push(new compiler.I18nError(node.sourceSpan, message));
    }
}
// Convert ml nodes (xliff syntax) to i18n nodes
let XmlToI18n$1 = class XmlToI18n {
    // using non-null assertion because it's re(set) by convert()
    _errors;
    convert(message, url) {
        const xmlIcu = new XmlParser().parse(message, url, { tokenizeExpansionForms: true });
        this._errors = xmlIcu.errors;
        const i18nNodes = this._errors.length > 0 || xmlIcu.rootNodes.length == 0
            ? []
            : [].concat(...compiler.visitAll$1(this, xmlIcu.rootNodes));
        return {
            i18nNodes: i18nNodes,
            errors: this._errors,
        };
    }
    visitText(text, context) {
        return new compiler.Text$2(text.value, text.sourceSpan);
    }
    visitElement(el, context) {
        if (el.name === _PLACEHOLDER_TAG$1) {
            const nameAttr = el.attrs.find((attr) => attr.name === 'id');
            if (nameAttr) {
                return new compiler.Placeholder('', nameAttr.value, el.sourceSpan);
            }
            this._addError(el, `<${_PLACEHOLDER_TAG$1}> misses the "id" attribute`);
            return null;
        }
        if (el.name === _MARKER_TAG$1) {
            return [].concat(...compiler.visitAll$1(this, el.children));
        }
        this._addError(el, `Unexpected tag`);
        return null;
    }
    visitExpansion(icu, context) {
        const caseMap = {};
        compiler.visitAll$1(this, icu.cases).forEach((c) => {
            caseMap[c.value] = new compiler.Container(c.nodes, icu.sourceSpan);
        });
        return new compiler.Icu(icu.switchValue, icu.type, caseMap, icu.sourceSpan);
    }
    visitExpansionCase(icuCase, context) {
        return {
            value: icuCase.value,
            nodes: compiler.visitAll$1(this, icuCase.expression),
        };
    }
    visitComment(comment, context) { }
    visitAttribute(attribute, context) { }
    visitBlock(block, context) { }
    visitBlockParameter(parameter, context) { }
    visitLetDeclaration(decl, context) { }
    visitComponent(component, context) {
        this._addError(component, 'Unexpected node');
    }
    visitDirective(directive, context) {
        this._addError(directive, 'Unexpected node');
    }
    _addError(node, message) {
        this._errors.push(new compiler.I18nError(node.sourceSpan, message));
    }
};
function getCtypeForTag(tag) {
    switch (tag.toLowerCase()) {
        case 'br':
            return 'lb';
        case 'img':
            return 'image';
        default:
            return `x-${tag}`;
    }
}

const _VERSION = '2.0';
const _XMLNS = 'urn:oasis:names:tc:xliff:document:2.0';
// TODO(vicb): make this a param (s/_/-/)
const _DEFAULT_SOURCE_LANG = 'en';
const _PLACEHOLDER_TAG = 'ph';
const _PLACEHOLDER_SPANNING_TAG = 'pc';
const _MARKER_TAG = 'mrk';
const _XLIFF_TAG = 'xliff';
const _SOURCE_TAG = 'source';
const _TARGET_TAG = 'target';
const _UNIT_TAG = 'unit';
// https://docs.oasis-open.org/xliff/xliff-core/v2.0/os/xliff-core-v2.0-os.html
class Xliff2 extends compiler.Serializer {
    write(messages, locale) {
        const visitor = new _WriteVisitor();
        const units = [];
        messages.forEach((message) => {
            const unit = new compiler.Tag(_UNIT_TAG, { id: message.id });
            const notes = new compiler.Tag('notes');
            if (message.description || message.meaning) {
                if (message.description) {
                    notes.children.push(new compiler.CR(8), new compiler.Tag('note', { category: 'description' }, [new compiler.Text$1(message.description)]));
                }
                if (message.meaning) {
                    notes.children.push(new compiler.CR(8), new compiler.Tag('note', { category: 'meaning' }, [new compiler.Text$1(message.meaning)]));
                }
            }
            message.sources.forEach((source) => {
                notes.children.push(new compiler.CR(8), new compiler.Tag('note', { category: 'location' }, [
                    new compiler.Text$1(`${source.filePath}:${source.startLine}${source.endLine !== source.startLine ? ',' + source.endLine : ''}`),
                ]));
            });
            notes.children.push(new compiler.CR(6));
            unit.children.push(new compiler.CR(6), notes);
            const segment = new compiler.Tag('segment');
            segment.children.push(new compiler.CR(8), new compiler.Tag(_SOURCE_TAG, {}, visitor.serialize(message.nodes)), new compiler.CR(6));
            unit.children.push(new compiler.CR(6), segment, new compiler.CR(4));
            units.push(new compiler.CR(4), unit);
        });
        const file = new compiler.Tag('file', { 'original': 'ng.template', id: 'ngi18n' }, [
            ...units,
            new compiler.CR(2),
        ]);
        const xliff = new compiler.Tag(_XLIFF_TAG, { version: _VERSION, xmlns: _XMLNS, srcLang: locale || _DEFAULT_SOURCE_LANG }, [new compiler.CR(2), file, new compiler.CR()]);
        return compiler.serialize([
            new compiler.Declaration({ version: '1.0', encoding: 'UTF-8' }),
            new compiler.CR(),
            xliff,
            new compiler.CR(),
        ]);
    }
    load(content, url) {
        // xliff to xml nodes
        const xliff2Parser = new Xliff2Parser();
        const { locale, msgIdToHtml, errors } = xliff2Parser.parse(content, url);
        // xml nodes to i18n nodes
        const i18nNodesByMsgId = {};
        const converter = new XmlToI18n();
        Object.keys(msgIdToHtml).forEach((msgId) => {
            const { i18nNodes, errors: e } = converter.convert(msgIdToHtml[msgId], url);
            errors.push(...e);
            i18nNodesByMsgId[msgId] = i18nNodes;
        });
        if (errors.length) {
            throw new Error(`xliff2 parse errors:\n${errors.join('\n')}`);
        }
        return { locale: locale, i18nNodesByMsgId };
    }
    digest(message) {
        return compiler.decimalDigest(message);
    }
}
class _WriteVisitor {
    _nextPlaceholderId = 0;
    visitText(text, context) {
        return [new compiler.Text$1(text.value)];
    }
    visitContainer(container, context) {
        const nodes = [];
        container.children.forEach((node) => nodes.push(...node.visit(this)));
        return nodes;
    }
    visitIcu(icu, context) {
        const nodes = [new compiler.Text$1(`{${icu.expressionPlaceholder}, ${icu.type}, `)];
        Object.keys(icu.cases).forEach((c) => {
            nodes.push(new compiler.Text$1(`${c} {`), ...icu.cases[c].visit(this), new compiler.Text$1(`} `));
        });
        nodes.push(new compiler.Text$1(`}`));
        return nodes;
    }
    visitTagPlaceholder(ph, context) {
        const type = getTypeForTag(ph.tag);
        if (ph.isVoid) {
            const tagPh = new compiler.Tag(_PLACEHOLDER_TAG, {
                id: (this._nextPlaceholderId++).toString(),
                equiv: ph.startName,
                type: type,
                disp: `<${ph.tag}/>`,
            });
            return [tagPh];
        }
        const tagPc = new compiler.Tag(_PLACEHOLDER_SPANNING_TAG, {
            id: (this._nextPlaceholderId++).toString(),
            equivStart: ph.startName,
            equivEnd: ph.closeName,
            type: type,
            dispStart: `<${ph.tag}>`,
            dispEnd: `</${ph.tag}>`,
        });
        const nodes = [].concat(...ph.children.map((node) => node.visit(this)));
        if (nodes.length) {
            nodes.forEach((node) => tagPc.children.push(node));
        }
        else {
            tagPc.children.push(new compiler.Text$1(''));
        }
        return [tagPc];
    }
    visitPlaceholder(ph, context) {
        const idStr = (this._nextPlaceholderId++).toString();
        return [
            new compiler.Tag(_PLACEHOLDER_TAG, {
                id: idStr,
                equiv: ph.name,
                disp: `{{${ph.value}}}`,
            }),
        ];
    }
    visitBlockPlaceholder(ph, context) {
        const tagPc = new compiler.Tag(_PLACEHOLDER_SPANNING_TAG, {
            id: (this._nextPlaceholderId++).toString(),
            equivStart: ph.startName,
            equivEnd: ph.closeName,
            type: 'other',
            dispStart: `@${ph.name}`,
            dispEnd: `}`,
        });
        const nodes = [].concat(...ph.children.map((node) => node.visit(this)));
        if (nodes.length) {
            nodes.forEach((node) => tagPc.children.push(node));
        }
        else {
            tagPc.children.push(new compiler.Text$1(''));
        }
        return [tagPc];
    }
    visitIcuPlaceholder(ph, context) {
        const cases = Object.keys(ph.value.cases)
            .map((value) => value + ' {...}')
            .join(' ');
        const idStr = (this._nextPlaceholderId++).toString();
        return [
            new compiler.Tag(_PLACEHOLDER_TAG, {
                id: idStr,
                equiv: ph.name,
                disp: `{${ph.value.expression}, ${ph.value.type}, ${cases}}`,
            }),
        ];
    }
    serialize(nodes) {
        this._nextPlaceholderId = 0;
        return [].concat(...nodes.map((node) => node.visit(this)));
    }
}
// Extract messages as xml nodes from the xliff file
class Xliff2Parser {
    // using non-null assertions because they're all (re)set by parse()
    _unitMlString;
    _errors;
    _msgIdToHtml;
    _locale = null;
    parse(xliff, url) {
        this._unitMlString = null;
        this._msgIdToHtml = {};
        const xml = new XmlParser().parse(xliff, url);
        this._errors = xml.errors;
        compiler.visitAll$1(this, xml.rootNodes, null);
        return {
            msgIdToHtml: this._msgIdToHtml,
            errors: this._errors,
            locale: this._locale,
        };
    }
    visitElement(element, context) {
        switch (element.name) {
            case _UNIT_TAG:
                this._unitMlString = null;
                const idAttr = element.attrs.find((attr) => attr.name === 'id');
                if (!idAttr) {
                    this._addError(element, `<${_UNIT_TAG}> misses the "id" attribute`);
                }
                else {
                    const id = idAttr.value;
                    if (this._msgIdToHtml.hasOwnProperty(id)) {
                        this._addError(element, `Duplicated translations for msg ${id}`);
                    }
                    else {
                        compiler.visitAll$1(this, element.children, null);
                        if (typeof this._unitMlString === 'string') {
                            this._msgIdToHtml[id] = this._unitMlString;
                        }
                        else {
                            this._addError(element, `Message ${id} misses a translation`);
                        }
                    }
                }
                break;
            case _SOURCE_TAG:
                // ignore source message
                break;
            case _TARGET_TAG:
                const innerTextStart = element.startSourceSpan.end.offset;
                const innerTextEnd = element.endSourceSpan.start.offset;
                const content = element.startSourceSpan.start.file.content;
                const innerText = content.slice(innerTextStart, innerTextEnd);
                this._unitMlString = innerText;
                break;
            case _XLIFF_TAG:
                const localeAttr = element.attrs.find((attr) => attr.name === 'trgLang');
                if (localeAttr) {
                    this._locale = localeAttr.value;
                }
                const versionAttr = element.attrs.find((attr) => attr.name === 'version');
                if (versionAttr) {
                    const version = versionAttr.value;
                    if (version !== '2.0') {
                        this._addError(element, `The XLIFF file version ${version} is not compatible with XLIFF 2.0 serializer`);
                    }
                    else {
                        compiler.visitAll$1(this, element.children, null);
                    }
                }
                break;
            default:
                compiler.visitAll$1(this, element.children, null);
        }
    }
    visitAttribute(attribute, context) { }
    visitText(text, context) { }
    visitComment(comment, context) { }
    visitExpansion(expansion, context) { }
    visitExpansionCase(expansionCase, context) { }
    visitBlock(block, context) { }
    visitBlockParameter(parameter, context) { }
    visitLetDeclaration(decl, context) { }
    visitComponent(component, context) { }
    visitDirective(directive, context) { }
    _addError(node, message) {
        this._errors.push(new compiler.I18nError(node.sourceSpan, message));
    }
}
// Convert ml nodes (xliff syntax) to i18n nodes
class XmlToI18n {
    // using non-null assertion because re(set) by convert()
    _errors;
    convert(message, url) {
        const xmlIcu = new XmlParser().parse(message, url, { tokenizeExpansionForms: true });
        this._errors = xmlIcu.errors;
        const i18nNodes = this._errors.length > 0 || xmlIcu.rootNodes.length == 0
            ? []
            : [].concat(...compiler.visitAll$1(this, xmlIcu.rootNodes));
        return {
            i18nNodes,
            errors: this._errors,
        };
    }
    visitText(text, context) {
        return new compiler.Text$2(text.value, text.sourceSpan);
    }
    visitElement(el, context) {
        switch (el.name) {
            case _PLACEHOLDER_TAG:
                const nameAttr = el.attrs.find((attr) => attr.name === 'equiv');
                if (nameAttr) {
                    return [new compiler.Placeholder('', nameAttr.value, el.sourceSpan)];
                }
                this._addError(el, `<${_PLACEHOLDER_TAG}> misses the "equiv" attribute`);
                break;
            case _PLACEHOLDER_SPANNING_TAG:
                const startAttr = el.attrs.find((attr) => attr.name === 'equivStart');
                const endAttr = el.attrs.find((attr) => attr.name === 'equivEnd');
                if (!startAttr) {
                    this._addError(el, `<${_PLACEHOLDER_TAG}> misses the "equivStart" attribute`);
                }
                else if (!endAttr) {
                    this._addError(el, `<${_PLACEHOLDER_TAG}> misses the "equivEnd" attribute`);
                }
                else {
                    const startId = startAttr.value;
                    const endId = endAttr.value;
                    const nodes = [];
                    return nodes.concat(new compiler.Placeholder('', startId, el.sourceSpan), ...el.children.map((node) => node.visit(this, null)), new compiler.Placeholder('', endId, el.sourceSpan));
                }
                break;
            case _MARKER_TAG:
                return [].concat(...compiler.visitAll$1(this, el.children));
            default:
                this._addError(el, `Unexpected tag`);
        }
        return null;
    }
    visitExpansion(icu, context) {
        const caseMap = {};
        compiler.visitAll$1(this, icu.cases).forEach((c) => {
            caseMap[c.value] = new compiler.Container(c.nodes, icu.sourceSpan);
        });
        return new compiler.Icu(icu.switchValue, icu.type, caseMap, icu.sourceSpan);
    }
    visitExpansionCase(icuCase, context) {
        return {
            value: icuCase.value,
            nodes: [].concat(...compiler.visitAll$1(this, icuCase.expression)),
        };
    }
    visitComment(comment, context) { }
    visitAttribute(attribute, context) { }
    visitBlock(block, context) { }
    visitBlockParameter(parameter, context) { }
    visitLetDeclaration(decl, context) { }
    visitComponent(component, context) {
        this._addError(component, 'Unexpected node');
    }
    visitDirective(directive, context) {
        this._addError(directive, 'Unexpected node');
    }
    _addError(node, message) {
        this._errors.push(new compiler.I18nError(node.sourceSpan, message));
    }
}
function getTypeForTag(tag) {
    switch (tag.toLowerCase()) {
        case 'br':
        case 'b':
        case 'i':
        case 'u':
            return 'fmt';
        case 'img':
            return 'image';
        case 'a':
            return 'link';
        default:
            return 'other';
    }
}

/**
 * A container for message extracted from the templates.
 */
class MessageBundle {
    _htmlParser;
    _implicitTags;
    _implicitAttrs;
    _locale;
    _preserveWhitespace;
    _messages = [];
    constructor(_htmlParser, _implicitTags, _implicitAttrs, _locale = null, _preserveWhitespace = true) {
        this._htmlParser = _htmlParser;
        this._implicitTags = _implicitTags;
        this._implicitAttrs = _implicitAttrs;
        this._locale = _locale;
        this._preserveWhitespace = _preserveWhitespace;
    }
    updateFromTemplate(source, url, interpolationConfig) {
        const htmlParserResult = this._htmlParser.parse(source, url, {
            tokenizeExpansionForms: true,
            interpolationConfig,
        });
        if (htmlParserResult.errors.length) {
            return htmlParserResult.errors;
        }
        // Trim unnecessary whitespace from extracted messages if requested. This
        // makes the messages more durable to trivial whitespace changes without
        // affected message IDs.
        const rootNodes = this._preserveWhitespace
            ? htmlParserResult.rootNodes
            : compiler.visitAllWithSiblings(new compiler.WhitespaceVisitor(/* preserveSignificantWhitespace */ false), htmlParserResult.rootNodes);
        const i18nParserResult = compiler.extractMessages(rootNodes, interpolationConfig, this._implicitTags, this._implicitAttrs, 
        /* preserveSignificantWhitespace */ this._preserveWhitespace);
        if (i18nParserResult.errors.length) {
            return i18nParserResult.errors;
        }
        this._messages.push(...i18nParserResult.messages);
        return [];
    }
    // Return the message in the internal format
    // The public (serialized) format might be different, see the `write` method.
    getMessages() {
        return this._messages;
    }
    write(serializer, filterSources) {
        const messages = {};
        const mapperVisitor = new MapPlaceholderNames();
        // Deduplicate messages based on their ID
        this._messages.forEach((message) => {
            const id = serializer.digest(message);
            if (!messages.hasOwnProperty(id)) {
                messages[id] = message;
            }
            else {
                messages[id].sources.push(...message.sources);
            }
        });
        // Transform placeholder names using the serializer mapping
        const msgList = Object.keys(messages).map((id) => {
            const mapper = serializer.createNameMapper(messages[id]);
            const src = messages[id];
            const nodes = mapper ? mapperVisitor.convert(src.nodes, mapper) : src.nodes;
            let transformedMessage = new compiler.Message(nodes, {}, {}, src.meaning, src.description, id);
            transformedMessage.sources = src.sources;
            if (filterSources) {
                transformedMessage.sources.forEach((source) => (source.filePath = filterSources(source.filePath)));
            }
            return transformedMessage;
        });
        return serializer.write(msgList, this._locale);
    }
}
// Transform an i18n AST by renaming the placeholder nodes with the given mapper
class MapPlaceholderNames extends compiler.CloneVisitor {
    convert(nodes, mapper) {
        return mapper ? nodes.map((n) => n.visit(this, mapper)) : nodes;
    }
    visitTagPlaceholder(ph, mapper) {
        const startName = mapper.toPublicName(ph.startName);
        const closeName = ph.closeName ? mapper.toPublicName(ph.closeName) : ph.closeName;
        const children = ph.children.map((n) => n.visit(this, mapper));
        return new compiler.TagPlaceholder(ph.tag, ph.attrs, startName, closeName, children, ph.isVoid, ph.sourceSpan, ph.startSourceSpan, ph.endSourceSpan);
    }
    visitBlockPlaceholder(ph, mapper) {
        const startName = mapper.toPublicName(ph.startName);
        const closeName = ph.closeName ? mapper.toPublicName(ph.closeName) : ph.closeName;
        const children = ph.children.map((n) => n.visit(this, mapper));
        return new compiler.BlockPlaceholder(ph.name, ph.parameters, startName, closeName, children, ph.sourceSpan, ph.startSourceSpan, ph.endSourceSpan);
    }
    visitPlaceholder(ph, mapper) {
        return new compiler.Placeholder(ph.value, mapper.toPublicName(ph.name), ph.sourceSpan);
    }
    visitIcuPlaceholder(ph, mapper) {
        return new compiler.IcuPlaceholder(ph.value, mapper.toPublicName(ph.name), ph.sourceSpan);
    }
}

function compileClassMetadata(metadata) {
    const fnCall = internalCompileClassMetadata(metadata);
    return compiler.arrowFn([], [compiler.devOnlyGuardedExpression(fnCall).toStmt()]).callFn([]);
}
/** Compiles only the `setClassMetadata` call without any additional wrappers. */
function internalCompileClassMetadata(metadata) {
    return compiler.importExpr(compiler.Identifiers.setClassMetadata)
        .callFn([
        metadata.type,
        metadata.decorators,
        metadata.ctorParameters ?? compiler.literal(null),
        metadata.propDecorators ?? compiler.literal(null),
    ]);
}
/**
 * Wraps the `setClassMetadata` function with extra logic that dynamically
 * loads dependencies from `@defer` blocks.
 *
 * Generates a call like this:
 * ```ts
 * setClassMetadataAsync(type, () => [
 *   import('./cmp-a').then(m => m.CmpA);
 *   import('./cmp-b').then(m => m.CmpB);
 * ], (CmpA, CmpB) => {
 *   setClassMetadata(type, decorators, ctorParameters, propParameters);
 * });
 * ```
 *
 * Similar to the `setClassMetadata` call, it's wrapped into the `ngDevMode`
 * check to tree-shake away this code in production mode.
 */
function compileComponentClassMetadata(metadata, dependencies) {
    if (dependencies === null || dependencies.length === 0) {
        // If there are no deferrable symbols - just generate a regular `setClassMetadata` call.
        return compileClassMetadata(metadata);
    }
    return internalCompileSetClassMetadataAsync(metadata, dependencies.map((dep) => new compiler.FnParam(dep.symbolName, compiler.DYNAMIC_TYPE)), compileComponentMetadataAsyncResolver(dependencies));
}
/**
 * Internal logic used to compile a `setClassMetadataAsync` call.
 * @param metadata Class metadata for the internal `setClassMetadata` call.
 * @param wrapperParams Parameters to be set on the callback that wraps `setClassMetata`.
 * @param dependencyResolverFn Function to resolve the deferred dependencies.
 */
function internalCompileSetClassMetadataAsync(metadata, wrapperParams, dependencyResolverFn) {
    // Omit the wrapper since it'll be added around `setClassMetadataAsync` instead.
    const setClassMetadataCall = internalCompileClassMetadata(metadata);
    const setClassMetaWrapper = compiler.arrowFn(wrapperParams, [setClassMetadataCall.toStmt()]);
    const setClassMetaAsync = compiler.importExpr(compiler.Identifiers.setClassMetadataAsync)
        .callFn([metadata.type, dependencyResolverFn, setClassMetaWrapper]);
    return compiler.arrowFn([], [compiler.devOnlyGuardedExpression(setClassMetaAsync).toStmt()]).callFn([]);
}
/**
 * Compiles the function that loads the dependencies for the
 * entire component in `setClassMetadataAsync`.
 */
function compileComponentMetadataAsyncResolver(dependencies) {
    const dynamicImports = dependencies.map(({ symbolName, importPath, isDefaultImport }) => {
        // e.g. `(m) => m.CmpA`
        const innerFn = 
        // Default imports are always accessed through the `default` property.
        compiler.arrowFn([new compiler.FnParam('m', compiler.DYNAMIC_TYPE)], compiler.variable('m').prop(isDefaultImport ? 'default' : symbolName));
        // e.g. `import('./cmp-a').then(...)`
        return new compiler.DynamicImportExpr(importPath).prop('then').callFn([innerFn]);
    });
    // e.g. `() => [ ... ];`
    return compiler.arrowFn([], compiler.literalArr(dynamicImports));
}

/**
 * Every time we make a breaking change to the declaration interface or partial-linker behavior, we
 * must update this constant to prevent old partial-linkers from incorrectly processing the
 * declaration.
 *
 * Do not include any prerelease in these versions as they are ignored.
 */
const MINIMUM_PARTIAL_LINKER_VERSION$5 = '12.0.0';
/**
 * Minimum version at which deferred blocks are supported in the linker.
 */
const MINIMUM_PARTIAL_LINKER_DEFER_SUPPORT_VERSION = '18.0.0';
function compileDeclareClassMetadata(metadata) {
    const definitionMap = new compiler.DefinitionMap();
    definitionMap.set('minVersion', compiler.literal(MINIMUM_PARTIAL_LINKER_VERSION$5));
    definitionMap.set('version', compiler.literal('20.0.0-next.5+sha-9228a73'));
    definitionMap.set('ngImport', compiler.importExpr(compiler.Identifiers.core));
    definitionMap.set('type', metadata.type);
    definitionMap.set('decorators', metadata.decorators);
    definitionMap.set('ctorParameters', metadata.ctorParameters);
    definitionMap.set('propDecorators', metadata.propDecorators);
    return compiler.importExpr(compiler.Identifiers.declareClassMetadata).callFn([definitionMap.toLiteralMap()]);
}
function compileComponentDeclareClassMetadata(metadata, dependencies) {
    if (dependencies === null || dependencies.length === 0) {
        return compileDeclareClassMetadata(metadata);
    }
    const definitionMap = new compiler.DefinitionMap();
    const callbackReturnDefinitionMap = new compiler.DefinitionMap();
    callbackReturnDefinitionMap.set('decorators', metadata.decorators);
    callbackReturnDefinitionMap.set('ctorParameters', metadata.ctorParameters ?? compiler.literal(null));
    callbackReturnDefinitionMap.set('propDecorators', metadata.propDecorators ?? compiler.literal(null));
    definitionMap.set('minVersion', compiler.literal(MINIMUM_PARTIAL_LINKER_DEFER_SUPPORT_VERSION));
    definitionMap.set('version', compiler.literal('20.0.0-next.5+sha-9228a73'));
    definitionMap.set('ngImport', compiler.importExpr(compiler.Identifiers.core));
    definitionMap.set('type', metadata.type);
    definitionMap.set('resolveDeferredDeps', compileComponentMetadataAsyncResolver(dependencies));
    definitionMap.set('resolveMetadata', compiler.arrowFn(dependencies.map((dep) => new compiler.FnParam(dep.symbolName, compiler.DYNAMIC_TYPE)), callbackReturnDefinitionMap.toLiteralMap()));
    return compiler.importExpr(compiler.Identifiers.declareClassMetadataAsync).callFn([definitionMap.toLiteralMap()]);
}

/**
 * Creates an array literal expression from the given array, mapping all values to an expression
 * using the provided mapping function. If the array is empty or null, then null is returned.
 *
 * @param values The array to transfer into literal array expression.
 * @param mapper The logic to use for creating an expression for the array's values.
 * @returns An array literal expression representing `values`, or null if `values` is empty or
 * is itself null.
 */
function toOptionalLiteralArray(values, mapper) {
    if (values === null || values.length === 0) {
        return null;
    }
    return compiler.literalArr(values.map((value) => mapper(value)));
}
/**
 * Creates an object literal expression from the given object, mapping all values to an expression
 * using the provided mapping function. If the object has no keys, then null is returned.
 *
 * @param object The object to transfer into an object literal expression.
 * @param mapper The logic to use for creating an expression for the object's values.
 * @returns An object literal expression representing `object`, or null if `object` does not have
 * any keys.
 */
function toOptionalLiteralMap(object, mapper) {
    const entries = Object.keys(object).map((key) => {
        const value = object[key];
        return { key, value: mapper(value), quoted: true };
    });
    if (entries.length > 0) {
        return compiler.literalMap(entries);
    }
    else {
        return null;
    }
}
function compileDependencies(deps) {
    if (deps === 'invalid') {
        // The `deps` can be set to the string "invalid"  by the `unwrapConstructorDependencies()`
        // function, which tries to convert `ConstructorDeps` into `R3DependencyMetadata[]`.
        return compiler.literal('invalid');
    }
    else if (deps === null) {
        return compiler.literal(null);
    }
    else {
        return compiler.literalArr(deps.map(compileDependency));
    }
}
function compileDependency(dep) {
    const depMeta = new compiler.DefinitionMap();
    depMeta.set('token', dep.token);
    if (dep.attributeNameType !== null) {
        depMeta.set('attribute', compiler.literal(true));
    }
    if (dep.host) {
        depMeta.set('host', compiler.literal(true));
    }
    if (dep.optional) {
        depMeta.set('optional', compiler.literal(true));
    }
    if (dep.self) {
        depMeta.set('self', compiler.literal(true));
    }
    if (dep.skipSelf) {
        depMeta.set('skipSelf', compiler.literal(true));
    }
    return depMeta.toLiteralMap();
}

/**
 * Compile a directive declaration defined by the `R3DirectiveMetadata`.
 */
function compileDeclareDirectiveFromMetadata(meta) {
    const definitionMap = createDirectiveDefinitionMap(meta);
    const expression = compiler.importExpr(compiler.Identifiers.declareDirective).callFn([definitionMap.toLiteralMap()]);
    const type = compiler.createDirectiveType(meta);
    return { expression, type, statements: [] };
}
/**
 * Gathers the declaration fields for a directive into a `DefinitionMap`. This allows for reusing
 * this logic for components, as they extend the directive metadata.
 */
function createDirectiveDefinitionMap(meta) {
    const definitionMap = new compiler.DefinitionMap();
    const minVersion = getMinimumVersionForPartialOutput(meta);
    definitionMap.set('minVersion', compiler.literal(minVersion));
    definitionMap.set('version', compiler.literal('20.0.0-next.5+sha-9228a73'));
    // e.g. `type: MyDirective`
    definitionMap.set('type', meta.type.value);
    if (meta.isStandalone !== undefined) {
        definitionMap.set('isStandalone', compiler.literal(meta.isStandalone));
    }
    if (meta.isSignal) {
        definitionMap.set('isSignal', compiler.literal(meta.isSignal));
    }
    // e.g. `selector: 'some-dir'`
    if (meta.selector !== null) {
        definitionMap.set('selector', compiler.literal(meta.selector));
    }
    definitionMap.set('inputs', needsNewInputPartialOutput(meta)
        ? createInputsPartialMetadata(meta.inputs)
        : legacyInputsPartialMetadata(meta.inputs));
    definitionMap.set('outputs', compiler.conditionallyCreateDirectiveBindingLiteral(meta.outputs));
    definitionMap.set('host', compileHostMetadata(meta.host));
    definitionMap.set('providers', meta.providers);
    if (meta.queries.length > 0) {
        definitionMap.set('queries', compiler.literalArr(meta.queries.map(compileQuery)));
    }
    if (meta.viewQueries.length > 0) {
        definitionMap.set('viewQueries', compiler.literalArr(meta.viewQueries.map(compileQuery)));
    }
    if (meta.exportAs !== null) {
        definitionMap.set('exportAs', compiler.asLiteral(meta.exportAs));
    }
    if (meta.usesInheritance) {
        definitionMap.set('usesInheritance', compiler.literal(true));
    }
    if (meta.lifecycle.usesOnChanges) {
        definitionMap.set('usesOnChanges', compiler.literal(true));
    }
    if (meta.hostDirectives?.length) {
        definitionMap.set('hostDirectives', createHostDirectives(meta.hostDirectives));
    }
    definitionMap.set('ngImport', compiler.importExpr(compiler.Identifiers.core));
    return definitionMap;
}
/**
 * Determines the minimum linker version for the partial output
 * generated for this directive.
 *
 * Every time we make a breaking change to the declaration interface or partial-linker
 * behavior, we must update the minimum versions to prevent old partial-linkers from
 * incorrectly processing the declaration.
 *
 * NOTE: Do not include any prerelease in these versions as they are ignored.
 */
function getMinimumVersionForPartialOutput(meta) {
    // We are starting with the oldest minimum version that can work for common
    // directive partial compilation output. As we discover usages of new features
    // that require a newer partial output emit, we bump the `minVersion`. Our goal
    // is to keep libraries as much compatible with older linker versions as possible.
    let minVersion = '14.0.0';
    // Note: in order to allow consuming Angular libraries that have been compiled with 16.1+ in
    // Angular 16.0, we only force a minimum version of 16.1 if input transform feature as introduced
    // in 16.1 is actually used.
    const hasDecoratorTransformFunctions = Object.values(meta.inputs).some((input) => input.transformFunction !== null);
    if (hasDecoratorTransformFunctions) {
        minVersion = '16.1.0';
    }
    // If there are input flags and we need the new emit, use the actual minimum version,
    // where this was introduced. i.e. in 17.1.0
    // TODO(legacy-partial-output-inputs): Remove in v18.
    if (needsNewInputPartialOutput(meta)) {
        minVersion = '17.1.0';
    }
    // If there are signal-based queries, partial output generates an extra field
    // that should be parsed by linkers. Ensure a proper minimum linker version.
    if (meta.queries.some((q) => q.isSignal) || meta.viewQueries.some((q) => q.isSignal)) {
        minVersion = '17.2.0';
    }
    return minVersion;
}
/**
 * Gets whether the given directive needs the new input partial output structure
 * that can hold additional metadata like `isRequired`, `isSignal` etc.
 */
function needsNewInputPartialOutput(meta) {
    return Object.values(meta.inputs).some((input) => input.isSignal);
}
/**
 * Compiles the metadata of a single query into its partial declaration form as declared
 * by `R3DeclareQueryMetadata`.
 */
function compileQuery(query) {
    const meta = new compiler.DefinitionMap();
    meta.set('propertyName', compiler.literal(query.propertyName));
    if (query.first) {
        meta.set('first', compiler.literal(true));
    }
    meta.set('predicate', Array.isArray(query.predicate)
        ? compiler.asLiteral(query.predicate)
        : compiler.convertFromMaybeForwardRefExpression(query.predicate));
    if (!query.emitDistinctChangesOnly) {
        // `emitDistinctChangesOnly` is special because we expect it to be `true`.
        // Therefore we explicitly emit the field, and explicitly place it only when it's `false`.
        meta.set('emitDistinctChangesOnly', compiler.literal(false));
    }
    if (query.descendants) {
        meta.set('descendants', compiler.literal(true));
    }
    meta.set('read', query.read);
    if (query.static) {
        meta.set('static', compiler.literal(true));
    }
    if (query.isSignal) {
        meta.set('isSignal', compiler.literal(true));
    }
    return meta.toLiteralMap();
}
/**
 * Compiles the host metadata into its partial declaration form as declared
 * in `R3DeclareDirectiveMetadata['host']`
 */
function compileHostMetadata(meta) {
    const hostMetadata = new compiler.DefinitionMap();
    hostMetadata.set('attributes', toOptionalLiteralMap(meta.attributes, (expression) => expression));
    hostMetadata.set('listeners', toOptionalLiteralMap(meta.listeners, compiler.literal));
    hostMetadata.set('properties', toOptionalLiteralMap(meta.properties, compiler.literal));
    if (meta.specialAttributes.styleAttr) {
        hostMetadata.set('styleAttribute', compiler.literal(meta.specialAttributes.styleAttr));
    }
    if (meta.specialAttributes.classAttr) {
        hostMetadata.set('classAttribute', compiler.literal(meta.specialAttributes.classAttr));
    }
    if (hostMetadata.values.length > 0) {
        return hostMetadata.toLiteralMap();
    }
    else {
        return null;
    }
}
function createHostDirectives(hostDirectives) {
    const expressions = hostDirectives.map((current) => {
        const keys = [
            {
                key: 'directive',
                value: current.isForwardReference
                    ? compiler.generateForwardRef(current.directive.type)
                    : current.directive.type,
                quoted: false,
            },
        ];
        const inputsLiteral = current.inputs ? compiler.createHostDirectivesMappingArray(current.inputs) : null;
        const outputsLiteral = current.outputs
            ? compiler.createHostDirectivesMappingArray(current.outputs)
            : null;
        if (inputsLiteral) {
            keys.push({ key: 'inputs', value: inputsLiteral, quoted: false });
        }
        if (outputsLiteral) {
            keys.push({ key: 'outputs', value: outputsLiteral, quoted: false });
        }
        return compiler.literalMap(keys);
    });
    // If there's a forward reference, we generate a `function() { return [{directive: HostDir}] }`,
    // otherwise we can save some bytes by using a plain array, e.g. `[{directive: HostDir}]`.
    return compiler.literalArr(expressions);
}
/**
 * Generates partial output metadata for inputs of a directive.
 *
 * The generated structure is expected to match `R3DeclareDirectiveFacade['inputs']`.
 */
function createInputsPartialMetadata(inputs) {
    const keys = Object.getOwnPropertyNames(inputs);
    if (keys.length === 0) {
        return null;
    }
    return compiler.literalMap(keys.map((declaredName) => {
        const value = inputs[declaredName];
        return {
            key: declaredName,
            // put quotes around keys that contain potentially unsafe characters
            quoted: compiler.UNSAFE_OBJECT_KEY_NAME_REGEXP.test(declaredName),
            value: compiler.literalMap([
                { key: 'classPropertyName', quoted: false, value: compiler.asLiteral(value.classPropertyName) },
                { key: 'publicName', quoted: false, value: compiler.asLiteral(value.bindingPropertyName) },
                { key: 'isSignal', quoted: false, value: compiler.asLiteral(value.isSignal) },
                { key: 'isRequired', quoted: false, value: compiler.asLiteral(value.required) },
                { key: 'transformFunction', quoted: false, value: value.transformFunction ?? compiler.NULL_EXPR },
            ]),
        };
    }));
}
/**
 * Pre v18 legacy partial output for inputs.
 *
 * Previously, inputs did not capture metadata like `isSignal` in the partial compilation output.
 * To enable capturing such metadata, we restructured how input metadata is communicated in the
 * partial output. This would make libraries incompatible with older Angular FW versions where the
 * linker would not know how to handle this new "format". For this reason, if we know this metadata
 * does not need to be captured- we fall back to the old format. This is what this function
 * generates.
 *
 * See:
 * https://github.com/angular/angular/blob/d4b423690210872b5c32a322a6090beda30b05a3/packages/core/src/compiler/compiler_facade_interface.ts#L197-L199
 */
function legacyInputsPartialMetadata(inputs) {
    // TODO(legacy-partial-output-inputs): Remove function in v18.
    const keys = Object.getOwnPropertyNames(inputs);
    if (keys.length === 0) {
        return null;
    }
    return compiler.literalMap(keys.map((declaredName) => {
        const value = inputs[declaredName];
        const publicName = value.bindingPropertyName;
        const differentDeclaringName = publicName !== declaredName;
        let result;
        if (differentDeclaringName || value.transformFunction !== null) {
            const values = [compiler.asLiteral(publicName), compiler.asLiteral(declaredName)];
            if (value.transformFunction !== null) {
                values.push(value.transformFunction);
            }
            result = compiler.literalArr(values);
        }
        else {
            result = compiler.asLiteral(publicName);
        }
        return {
            key: declaredName,
            // put quotes around keys that contain potentially unsafe characters
            quoted: compiler.UNSAFE_OBJECT_KEY_NAME_REGEXP.test(declaredName),
            value: result,
        };
    }));
}

/**
 * Compile a component declaration defined by the `R3ComponentMetadata`.
 */
function compileDeclareComponentFromMetadata(meta, template, additionalTemplateInfo) {
    const definitionMap = createComponentDefinitionMap(meta, template, additionalTemplateInfo);
    const expression = compiler.importExpr(compiler.Identifiers.declareComponent).callFn([definitionMap.toLiteralMap()]);
    const type = compiler.createComponentType(meta);
    return { expression, type, statements: [] };
}
/**
 * Gathers the declaration fields for a component into a `DefinitionMap`.
 */
function createComponentDefinitionMap(meta, template, templateInfo) {
    const definitionMap = createDirectiveDefinitionMap(meta);
    const blockVisitor = new BlockPresenceVisitor();
    compiler.visitAll(blockVisitor, template.nodes);
    definitionMap.set('template', getTemplateExpression(template, templateInfo));
    if (templateInfo.isInline) {
        definitionMap.set('isInline', compiler.literal(true));
    }
    // Set the minVersion to 17.0.0 if the component is using at least one block in its template.
    // We don't do this for templates without blocks, in order to preserve backwards compatibility.
    if (blockVisitor.hasBlocks) {
        definitionMap.set('minVersion', compiler.literal('17.0.0'));
    }
    definitionMap.set('styles', toOptionalLiteralArray(meta.styles, compiler.literal));
    definitionMap.set('dependencies', compileUsedDependenciesMetadata(meta));
    definitionMap.set('viewProviders', meta.viewProviders);
    definitionMap.set('animations', meta.animations);
    if (meta.changeDetection !== null) {
        if (typeof meta.changeDetection === 'object') {
            throw new Error('Impossible state! Change detection flag is not resolved!');
        }
        definitionMap.set('changeDetection', compiler.importExpr(compiler.Identifiers.ChangeDetectionStrategy)
            .prop(compiler.ChangeDetectionStrategy[meta.changeDetection]));
    }
    if (meta.encapsulation !== compiler.ViewEncapsulation.Emulated) {
        definitionMap.set('encapsulation', compiler.importExpr(compiler.Identifiers.ViewEncapsulation).prop(compiler.ViewEncapsulation[meta.encapsulation]));
    }
    if (meta.interpolation !== compiler.DEFAULT_INTERPOLATION_CONFIG) {
        definitionMap.set('interpolation', compiler.literalArr([compiler.literal(meta.interpolation.start), compiler.literal(meta.interpolation.end)]));
    }
    if (template.preserveWhitespaces === true) {
        definitionMap.set('preserveWhitespaces', compiler.literal(true));
    }
    if (meta.defer.mode === 0 /* DeferBlockDepsEmitMode.PerBlock */) {
        const resolvers = [];
        let hasResolvers = false;
        for (const deps of meta.defer.blocks.values()) {
            // Note: we need to push a `null` even if there are no dependencies, because matching of
            // defer resolver functions to defer blocks happens by index and not adding an array
            // entry for a block can throw off the blocks coming after it.
            if (deps === null) {
                resolvers.push(compiler.literal(null));
            }
            else {
                resolvers.push(deps);
                hasResolvers = true;
            }
        }
        // If *all* the resolvers are null, we can skip the field.
        if (hasResolvers) {
            definitionMap.set('deferBlockDependencies', compiler.literalArr(resolvers));
        }
    }
    else {
        throw new Error('Unsupported defer function emit mode in partial compilation');
    }
    return definitionMap;
}
function getTemplateExpression(template, templateInfo) {
    // If the template has been defined using a direct literal, we use that expression directly
    // without any modifications. This is ensures proper source mapping from the partially
    // compiled code to the source file declaring the template. Note that this does not capture
    // template literals referenced indirectly through an identifier.
    if (templateInfo.inlineTemplateLiteralExpression !== null) {
        return templateInfo.inlineTemplateLiteralExpression;
    }
    // If the template is defined inline but not through a literal, the template has been resolved
    // through static interpretation. We create a literal but cannot provide any source span. Note
    // that we cannot use the expression defining the template because the linker expects the template
    // to be defined as a literal in the declaration.
    if (templateInfo.isInline) {
        return compiler.literal(templateInfo.content, null, null);
    }
    // The template is external so we must synthesize an expression node with
    // the appropriate source-span.
    const contents = templateInfo.content;
    const file = new compiler.ParseSourceFile(contents, templateInfo.sourceUrl);
    const start = new compiler.ParseLocation(file, 0, 0, 0);
    const end = computeEndLocation(file, contents);
    const span = new compiler.ParseSourceSpan(start, end);
    return compiler.literal(contents, null, span);
}
function computeEndLocation(file, contents) {
    const length = contents.length;
    let lineStart = 0;
    let lastLineStart = 0;
    let line = 0;
    do {
        lineStart = contents.indexOf('\n', lastLineStart);
        if (lineStart !== -1) {
            lastLineStart = lineStart + 1;
            line++;
        }
    } while (lineStart !== -1);
    return new compiler.ParseLocation(file, length, line, length - lastLineStart);
}
function compileUsedDependenciesMetadata(meta) {
    const wrapType = meta.declarationListEmitMode !== 0 /* DeclarationListEmitMode.Direct */
        ? compiler.generateForwardRef
        : (expr) => expr;
    if (meta.declarationListEmitMode === 3 /* DeclarationListEmitMode.RuntimeResolved */) {
        throw new Error(`Unsupported emit mode`);
    }
    return toOptionalLiteralArray(meta.declarations, (decl) => {
        switch (decl.kind) {
            case compiler.R3TemplateDependencyKind.Directive:
                const dirMeta = new compiler.DefinitionMap();
                dirMeta.set('kind', compiler.literal(decl.isComponent ? 'component' : 'directive'));
                dirMeta.set('type', wrapType(decl.type));
                dirMeta.set('selector', compiler.literal(decl.selector));
                dirMeta.set('inputs', toOptionalLiteralArray(decl.inputs, compiler.literal));
                dirMeta.set('outputs', toOptionalLiteralArray(decl.outputs, compiler.literal));
                dirMeta.set('exportAs', toOptionalLiteralArray(decl.exportAs, compiler.literal));
                return dirMeta.toLiteralMap();
            case compiler.R3TemplateDependencyKind.Pipe:
                const pipeMeta = new compiler.DefinitionMap();
                pipeMeta.set('kind', compiler.literal('pipe'));
                pipeMeta.set('type', wrapType(decl.type));
                pipeMeta.set('name', compiler.literal(decl.name));
                return pipeMeta.toLiteralMap();
            case compiler.R3TemplateDependencyKind.NgModule:
                const ngModuleMeta = new compiler.DefinitionMap();
                ngModuleMeta.set('kind', compiler.literal('ngmodule'));
                ngModuleMeta.set('type', wrapType(decl.type));
                return ngModuleMeta.toLiteralMap();
        }
    });
}
class BlockPresenceVisitor extends compiler.RecursiveVisitor {
    hasBlocks = false;
    visitDeferredBlock() {
        this.hasBlocks = true;
    }
    visitDeferredBlockPlaceholder() {
        this.hasBlocks = true;
    }
    visitDeferredBlockLoading() {
        this.hasBlocks = true;
    }
    visitDeferredBlockError() {
        this.hasBlocks = true;
    }
    visitIfBlock() {
        this.hasBlocks = true;
    }
    visitIfBlockBranch() {
        this.hasBlocks = true;
    }
    visitForLoopBlock() {
        this.hasBlocks = true;
    }
    visitForLoopBlockEmpty() {
        this.hasBlocks = true;
    }
    visitSwitchBlock() {
        this.hasBlocks = true;
    }
    visitSwitchBlockCase() {
        this.hasBlocks = true;
    }
}

/**
 * Every time we make a breaking change to the declaration interface or partial-linker behavior, we
 * must update this constant to prevent old partial-linkers from incorrectly processing the
 * declaration.
 *
 * Do not include any prerelease in these versions as they are ignored.
 */
const MINIMUM_PARTIAL_LINKER_VERSION$4 = '12.0.0';
function compileDeclareFactoryFunction(meta) {
    const definitionMap = new compiler.DefinitionMap();
    definitionMap.set('minVersion', compiler.literal(MINIMUM_PARTIAL_LINKER_VERSION$4));
    definitionMap.set('version', compiler.literal('20.0.0-next.5+sha-9228a73'));
    definitionMap.set('ngImport', compiler.importExpr(compiler.Identifiers.core));
    definitionMap.set('type', meta.type.value);
    definitionMap.set('deps', compileDependencies(meta.deps));
    definitionMap.set('target', compiler.importExpr(compiler.Identifiers.FactoryTarget).prop(compiler.FactoryTarget[meta.target]));
    return {
        expression: compiler.importExpr(compiler.Identifiers.declareFactory).callFn([definitionMap.toLiteralMap()]),
        statements: [],
        type: compiler.createFactoryType(meta),
    };
}

/**
 * Every time we make a breaking change to the declaration interface or partial-linker behavior, we
 * must update this constant to prevent old partial-linkers from incorrectly processing the
 * declaration.
 *
 * Do not include any prerelease in these versions as they are ignored.
 */
const MINIMUM_PARTIAL_LINKER_VERSION$3 = '12.0.0';
/**
 * Compile a Injectable declaration defined by the `R3InjectableMetadata`.
 */
function compileDeclareInjectableFromMetadata(meta) {
    const definitionMap = createInjectableDefinitionMap(meta);
    const expression = compiler.importExpr(compiler.Identifiers.declareInjectable).callFn([definitionMap.toLiteralMap()]);
    const type = compiler.createInjectableType(meta);
    return { expression, type, statements: [] };
}
/**
 * Gathers the declaration fields for a Injectable into a `DefinitionMap`.
 */
function createInjectableDefinitionMap(meta) {
    const definitionMap = new compiler.DefinitionMap();
    definitionMap.set('minVersion', compiler.literal(MINIMUM_PARTIAL_LINKER_VERSION$3));
    definitionMap.set('version', compiler.literal('20.0.0-next.5+sha-9228a73'));
    definitionMap.set('ngImport', compiler.importExpr(compiler.Identifiers.core));
    definitionMap.set('type', meta.type.value);
    // Only generate providedIn property if it has a non-null value
    if (meta.providedIn !== undefined) {
        const providedIn = compiler.convertFromMaybeForwardRefExpression(meta.providedIn);
        if (providedIn.value !== null) {
            definitionMap.set('providedIn', providedIn);
        }
    }
    if (meta.useClass !== undefined) {
        definitionMap.set('useClass', compiler.convertFromMaybeForwardRefExpression(meta.useClass));
    }
    if (meta.useExisting !== undefined) {
        definitionMap.set('useExisting', compiler.convertFromMaybeForwardRefExpression(meta.useExisting));
    }
    if (meta.useValue !== undefined) {
        definitionMap.set('useValue', compiler.convertFromMaybeForwardRefExpression(meta.useValue));
    }
    // Factories do not contain `ForwardRef`s since any types are already wrapped in a function call
    // so the types will not be eagerly evaluated. Therefore we do not need to process this expression
    // with `convertFromProviderExpression()`.
    if (meta.useFactory !== undefined) {
        definitionMap.set('useFactory', meta.useFactory);
    }
    if (meta.deps !== undefined) {
        definitionMap.set('deps', compiler.literalArr(meta.deps.map(compileDependency)));
    }
    return definitionMap;
}

/**
 * Every time we make a breaking change to the declaration interface or partial-linker behavior, we
 * must update this constant to prevent old partial-linkers from incorrectly processing the
 * declaration.
 *
 * Do not include any prerelease in these versions as they are ignored.
 */
const MINIMUM_PARTIAL_LINKER_VERSION$2 = '12.0.0';
function compileDeclareInjectorFromMetadata(meta) {
    const definitionMap = createInjectorDefinitionMap(meta);
    const expression = compiler.importExpr(compiler.Identifiers.declareInjector).callFn([definitionMap.toLiteralMap()]);
    const type = compiler.createInjectorType(meta);
    return { expression, type, statements: [] };
}
/**
 * Gathers the declaration fields for an Injector into a `DefinitionMap`.
 */
function createInjectorDefinitionMap(meta) {
    const definitionMap = new compiler.DefinitionMap();
    definitionMap.set('minVersion', compiler.literal(MINIMUM_PARTIAL_LINKER_VERSION$2));
    definitionMap.set('version', compiler.literal('20.0.0-next.5+sha-9228a73'));
    definitionMap.set('ngImport', compiler.importExpr(compiler.Identifiers.core));
    definitionMap.set('type', meta.type.value);
    definitionMap.set('providers', meta.providers);
    if (meta.imports.length > 0) {
        definitionMap.set('imports', compiler.literalArr(meta.imports));
    }
    return definitionMap;
}

/**
 * Every time we make a breaking change to the declaration interface or partial-linker behavior, we
 * must update this constant to prevent old partial-linkers from incorrectly processing the
 * declaration.
 *
 * Do not include any prerelease in these versions as they are ignored.
 */
const MINIMUM_PARTIAL_LINKER_VERSION$1 = '14.0.0';
function compileDeclareNgModuleFromMetadata(meta) {
    const definitionMap = createNgModuleDefinitionMap(meta);
    const expression = compiler.importExpr(compiler.Identifiers.declareNgModule).callFn([definitionMap.toLiteralMap()]);
    const type = compiler.createNgModuleType(meta);
    return { expression, type, statements: [] };
}
/**
 * Gathers the declaration fields for an NgModule into a `DefinitionMap`.
 */
function createNgModuleDefinitionMap(meta) {
    const definitionMap = new compiler.DefinitionMap();
    if (meta.kind === compiler.R3NgModuleMetadataKind.Local) {
        throw new Error('Invalid path! Local compilation mode should not get into the partial compilation path');
    }
    definitionMap.set('minVersion', compiler.literal(MINIMUM_PARTIAL_LINKER_VERSION$1));
    definitionMap.set('version', compiler.literal('20.0.0-next.5+sha-9228a73'));
    definitionMap.set('ngImport', compiler.importExpr(compiler.Identifiers.core));
    definitionMap.set('type', meta.type.value);
    // We only generate the keys in the metadata if the arrays contain values.
    // We must wrap the arrays inside a function if any of the values are a forward reference to a
    // not-yet-declared class. This is to support JIT execution of the `ɵɵngDeclareNgModule()` call.
    // In the linker these wrappers are stripped and then reapplied for the `ɵɵdefineNgModule()` call.
    if (meta.bootstrap.length > 0) {
        definitionMap.set('bootstrap', compiler.refsToArray(meta.bootstrap, meta.containsForwardDecls));
    }
    if (meta.declarations.length > 0) {
        definitionMap.set('declarations', compiler.refsToArray(meta.declarations, meta.containsForwardDecls));
    }
    if (meta.imports.length > 0) {
        definitionMap.set('imports', compiler.refsToArray(meta.imports, meta.containsForwardDecls));
    }
    if (meta.exports.length > 0) {
        definitionMap.set('exports', compiler.refsToArray(meta.exports, meta.containsForwardDecls));
    }
    if (meta.schemas !== null && meta.schemas.length > 0) {
        definitionMap.set('schemas', compiler.literalArr(meta.schemas.map((ref) => ref.value)));
    }
    if (meta.id !== null) {
        definitionMap.set('id', meta.id);
    }
    return definitionMap;
}

/**
 * Every time we make a breaking change to the declaration interface or partial-linker behavior, we
 * must update this constant to prevent old partial-linkers from incorrectly processing the
 * declaration.
 *
 * Do not include any prerelease in these versions as they are ignored.
 */
const MINIMUM_PARTIAL_LINKER_VERSION = '14.0.0';
/**
 * Compile a Pipe declaration defined by the `R3PipeMetadata`.
 */
function compileDeclarePipeFromMetadata(meta) {
    const definitionMap = createPipeDefinitionMap(meta);
    const expression = compiler.importExpr(compiler.Identifiers.declarePipe).callFn([definitionMap.toLiteralMap()]);
    const type = compiler.createPipeType(meta);
    return { expression, type, statements: [] };
}
/**
 * Gathers the declaration fields for a Pipe into a `DefinitionMap`.
 */
function createPipeDefinitionMap(meta) {
    const definitionMap = new compiler.DefinitionMap();
    definitionMap.set('minVersion', compiler.literal(MINIMUM_PARTIAL_LINKER_VERSION));
    definitionMap.set('version', compiler.literal('20.0.0-next.5+sha-9228a73'));
    definitionMap.set('ngImport', compiler.importExpr(compiler.Identifiers.core));
    // e.g. `type: MyPipe`
    definitionMap.set('type', meta.type.value);
    if (meta.isStandalone !== undefined) {
        definitionMap.set('isStandalone', compiler.literal(meta.isStandalone));
    }
    // e.g. `name: "myPipe"`
    definitionMap.set('name', compiler.literal(meta.pipeName));
    if (meta.pure === false) {
        // e.g. `pure: false`
        definitionMap.set('pure', compiler.literal(meta.pure));
    }
    return definitionMap;
}

/**
 * Generate an ngDevMode guarded call to setClassDebugInfo with the debug info about the class
 * (e.g., the file name in which the class is defined)
 */
function compileClassDebugInfo(debugInfo) {
    const debugInfoObject = {
        className: debugInfo.className,
    };
    // Include file path and line number only if the file relative path is calculated successfully.
    if (debugInfo.filePath) {
        debugInfoObject.filePath = debugInfo.filePath;
        debugInfoObject.lineNumber = debugInfo.lineNumber;
    }
    // Include forbidOrphanRendering only if it's set to true (to reduce generated code)
    if (debugInfo.forbidOrphanRendering) {
        debugInfoObject.forbidOrphanRendering = compiler.literal(true);
    }
    const fnCall = compiler.importExpr(compiler.Identifiers.setClassDebugInfo)
        .callFn([debugInfo.type, compiler.mapLiteral(debugInfoObject)]);
    const iife = compiler.arrowFn([], [compiler.devOnlyGuardedExpression(fnCall).toStmt()]);
    return iife.callFn([]);
}

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
/**
 * Compiles the expression that initializes HMR for a class.
 * @param meta HMR metadata extracted from the class.
 */
function compileHmrInitializer(meta) {
    const moduleName = 'm';
    const dataName = 'd';
    const timestampName = 't';
    const idName = 'id';
    const importCallbackName = `${meta.className}_HmrLoad`;
    const namespaces = meta.namespaceDependencies.map((dep) => {
        return new compiler.ExternalExpr({ moduleName: dep.moduleName, name: null });
    });
    // m.default
    const defaultRead = compiler.variable(moduleName).prop('default');
    // ɵɵreplaceMetadata(Comp, m.default, [...namespaces], [...locals], import.meta, id);
    const replaceCall = compiler.importExpr(compiler.Identifiers.replaceMetadata)
        .callFn([
        meta.type,
        defaultRead,
        compiler.literalArr(namespaces),
        compiler.literalArr(meta.localDependencies.map((l) => l.runtimeRepresentation)),
        compiler.variable('import').prop('meta'),
        compiler.variable(idName),
    ]);
    // (m) => m.default && ɵɵreplaceMetadata(...)
    const replaceCallback = compiler.arrowFn([new compiler.FnParam(moduleName)], defaultRead.and(replaceCall));
    // '<url>?c=' + id + '&t=' + encodeURIComponent(t)
    const urlValue = compiler.literal(`./@ng/component?c=`)
        .plus(compiler.variable(idName))
        .plus(compiler.literal('&t='))
        .plus(compiler.variable('encodeURIComponent').callFn([compiler.variable(timestampName)]));
    // import.meta.url
    const urlBase = compiler.variable('import').prop('meta').prop('url');
    // new URL(urlValue, urlBase).href
    const urlHref = new compiler.InstantiateExpr(compiler.variable('URL'), [urlValue, urlBase]).prop('href');
    // function Cmp_HmrLoad(t) {
    //   import(/* @vite-ignore */ urlHref).then((m) => m.default && replaceMetadata(...));
    // }
    const importCallback = new compiler.DeclareFunctionStmt(importCallbackName, [new compiler.FnParam(timestampName)], [
        // The vite-ignore special comment is required to prevent Vite from generating a superfluous
        // warning for each usage within the development code. If Vite provides a method to
        // programmatically avoid this warning in the future, this added comment can be removed here.
        new compiler.DynamicImportExpr(urlHref, null, '@vite-ignore')
            .prop('then')
            .callFn([replaceCallback])
            .toStmt(),
    ], null, compiler.StmtModifier.Final);
    // (d) => d.id === id && Cmp_HmrLoad(d.timestamp)
    const updateCallback = compiler.arrowFn([new compiler.FnParam(dataName)], compiler.variable(dataName)
        .prop('id')
        .identical(compiler.variable(idName))
        .and(compiler.variable(importCallbackName).callFn([compiler.variable(dataName).prop('timestamp')])));
    // Cmp_HmrLoad(Date.now());
    // Initial call to kick off the loading in order to avoid edge cases with components
    // coming from lazy chunks that change before the chunk has loaded.
    const initialCall = compiler.variable(importCallbackName)
        .callFn([compiler.variable('Date').prop('now').callFn([])]);
    // import.meta.hot
    const hotRead = compiler.variable('import').prop('meta').prop('hot');
    // import.meta.hot.on('angular:component-update', () => ...);
    const hotListener = hotRead
        .clone()
        .prop('on')
        .callFn([compiler.literal('angular:component-update'), updateCallback]);
    return compiler.arrowFn([], [
        // const id = <id>;
        new compiler.DeclareVarStmt(idName, compiler.literal(encodeURIComponent(`${meta.filePath}@${meta.className}`)), null, compiler.StmtModifier.Final),
        // function Cmp_HmrLoad() {...}.
        importCallback,
        // ngDevMode && Cmp_HmrLoad(Date.now());
        compiler.devOnlyGuardedExpression(initialCall).toStmt(),
        // ngDevMode && import.meta.hot && import.meta.hot.on(...)
        compiler.devOnlyGuardedExpression(hotRead.and(hotListener)).toStmt(),
    ])
        .callFn([]);
}
/**
 * Compiles the HMR update callback for a class.
 * @param definitions Compiled definitions for the class (e.g. `defineComponent` calls).
 * @param constantStatements Supporting constants statements that were generated alongside
 *  the definition.
 * @param meta HMR metadata extracted from the class.
 */
function compileHmrUpdateCallback(definitions, constantStatements, meta) {
    const namespaces = 'ɵɵnamespaces';
    const params = [meta.className, namespaces].map((name) => new compiler.FnParam(name, compiler.DYNAMIC_TYPE));
    const body = [];
    for (const local of meta.localDependencies) {
        params.push(new compiler.FnParam(local.name));
    }
    // Declare variables that read out the individual namespaces.
    for (let i = 0; i < meta.namespaceDependencies.length; i++) {
        body.push(new compiler.DeclareVarStmt(meta.namespaceDependencies[i].assignedName, compiler.variable(namespaces).key(compiler.literal(i)), compiler.DYNAMIC_TYPE, compiler.StmtModifier.Final));
    }
    body.push(...constantStatements);
    for (const field of definitions) {
        if (field.initializer !== null) {
            body.push(compiler.variable(meta.className).prop(field.name).set(field.initializer).toStmt());
            for (const stmt of field.statements) {
                body.push(stmt);
            }
        }
    }
    return new compiler.DeclareFunctionStmt(`${meta.className}_UpdateMetadata`, params, body, null, compiler.StmtModifier.Final);
}

/**
 * Base URL for the error details page.
 *
 * Keep the files below in full sync:
 *  - packages/compiler-cli/src/ngtsc/diagnostics/src/error_details_base_url.ts
 *  - packages/core/src/error_details_base_url.ts
 */
const ERROR_DETAILS_PAGE_BASE_URL = 'https://angular.dev/errors';

// Escape anything that isn't alphanumeric, '/' or '_'.
const CHARS_TO_ESCAPE = /[^a-zA-Z0-9/_]/g;
/**
 * An `AliasingHost` which generates and consumes alias re-exports when module names for each file
 * are determined by a `UnifiedModulesHost`.
 *
 * When using a `UnifiedModulesHost`, aliasing prevents issues with transitive dependencies. See the
 * README.md for more details.
 */
class UnifiedModulesAliasingHost {
    unifiedModulesHost;
    constructor(unifiedModulesHost) {
        this.unifiedModulesHost = unifiedModulesHost;
    }
    /**
     * With a `UnifiedModulesHost`, aliases are chosen automatically without the need to look through
     * the exports present in a .d.ts file, so we can avoid cluttering the .d.ts files.
     */
    aliasExportsInDts = false;
    maybeAliasSymbolAs(ref, context, ngModuleName, isReExport) {
        if (!isReExport) {
            // Aliasing is used with a UnifiedModulesHost to prevent transitive dependencies. Thus,
            // aliases
            // only need to be created for directives/pipes which are not direct declarations of an
            // NgModule which exports them.
            return null;
        }
        return this.aliasName(ref.node, context);
    }
    /**
     * Generates an `Expression` to import `decl` from `via`, assuming an export was added when `via`
     * was compiled per `maybeAliasSymbolAs` above.
     */
    getAliasIn(decl, via, isReExport) {
        if (!isReExport) {
            // Directly exported directives/pipes don't require an alias, per the logic in
            // `maybeAliasSymbolAs`.
            return null;
        }
        // viaModule is the module it'll actually be imported from.
        const moduleName = this.unifiedModulesHost.fileNameToModuleName(via.fileName, via.fileName);
        return new compiler.ExternalExpr({ moduleName, name: this.aliasName(decl, via) });
    }
    /**
     * Generates an alias name based on the full module name of the file which declares the aliased
     * directive/pipe.
     */
    aliasName(decl, context) {
        // The declared module is used to get the name of the alias.
        const declModule = this.unifiedModulesHost.fileNameToModuleName(decl.getSourceFile().fileName, context.fileName);
        const replaced = declModule.replace(CHARS_TO_ESCAPE, '_').replace(/\//g, '$');
        return 'ɵng$' + replaced + '$$' + decl.name.text;
    }
}
/**
 * An `AliasingHost` which exports directives from any file containing an NgModule in which they're
 * declared/exported, under a private symbol name.
 *
 * These exports support cases where an NgModule is imported deeply from an absolute module path
 * (that is, it's not part of an Angular Package Format entrypoint), and the compiler needs to
 * import any matched directives/pipes from the same path (to the NgModule file). See README.md for
 * more details.
 */
class PrivateExportAliasingHost {
    host;
    constructor(host) {
        this.host = host;
    }
    /**
     * Under private export aliasing, the `AbsoluteModuleStrategy` used for emitting references will
     * will select aliased exports that it finds in the .d.ts file for an NgModule's file. Thus,
     * emitting these exports in .d.ts is a requirement for the `PrivateExportAliasingHost` to
     * function correctly.
     */
    aliasExportsInDts = true;
    maybeAliasSymbolAs(ref, context, ngModuleName) {
        if (ref.hasOwningModuleGuess) {
            // Skip nodes that already have an associated absolute module specifier, since they can be
            // safely imported from that specifier.
            return null;
        }
        // Look for a user-provided export of `decl` in `context`. If one exists, then an alias export
        // is not needed.
        // TODO(alxhub): maybe add a host method to check for the existence of an export without going
        // through the entire list of exports.
        const exports = this.host.getExportsOfModule(context);
        if (exports === null) {
            // Something went wrong, and no exports were available at all. Bail rather than risk creating
            // re-exports when they're not needed.
            throw new Error(`Could not determine the exports of: ${context.fileName}`);
        }
        let found = false;
        exports.forEach((value) => {
            if (value.node === ref.node) {
                found = true;
            }
        });
        if (found) {
            // The module exports the declared class directly, no alias is necessary.
            return null;
        }
        return `ɵngExportɵ${ngModuleName}ɵ${ref.node.name.text}`;
    }
    /**
     * A `PrivateExportAliasingHost` only generates re-exports and does not direct the compiler to
     * directly consume the aliases it creates.
     *
     * Instead, they're consumed indirectly: `AbsoluteModuleStrategy` `ReferenceEmitterStrategy` will
     * select these alias exports automatically when looking for an export of the directive/pipe from
     * the same path as the NgModule was imported.
     *
     * Thus, `getAliasIn` always returns `null`.
     */
    getAliasIn() {
        return null;
    }
}
/**
 * A `ReferenceEmitStrategy` which will consume the alias attached to a particular `Reference` to a
 * directive or pipe, if it exists.
 */
class AliasStrategy {
    emit(ref, context, importMode) {
        if (importMode & checker.ImportFlags.NoAliasing || ref.alias === null) {
            return null;
        }
        return {
            kind: checker.ReferenceEmitKind.Success,
            expression: ref.alias,
            importedFile: 'unknown',
        };
    }
}

function relativePathBetween(from, to) {
    const relativePath = checker.stripExtension(checker.relative(checker.dirname(checker.resolve(from)), checker.resolve(to)));
    return relativePath !== '' ? checker.toRelativeImport(relativePath) : null;
}
function normalizeSeparators(path) {
    // TODO: normalize path only for OS that need it.
    return path.replace(/\\/g, '/');
}
/**
 * Attempts to generate a project-relative path for a file.
 * @param fileName Absolute path to the file.
 * @param rootDirs Root directories of the project.
 * @param compilerHost Host used to resolve file names.
 * @returns
 */
function getProjectRelativePath(fileName, rootDirs, compilerHost) {
    // Note: we need to pass both the file name and the root directories through getCanonicalFileName,
    // because the root directories might've been passed through it already while the source files
    // definitely have not. This can break the relative return value, because in some platforms
    // getCanonicalFileName lowercases the path.
    const filePath = compilerHost.getCanonicalFileName(fileName);
    for (const rootDir of rootDirs) {
        const rel = checker.relative(compilerHost.getCanonicalFileName(rootDir), filePath);
        if (!rel.startsWith('..')) {
            return rel;
        }
    }
    return null;
}

/**
 * `ImportRewriter` that does no rewriting.
 */
class NoopImportRewriter {
    rewriteSymbol(symbol, specifier) {
        return symbol;
    }
    rewriteSpecifier(specifier, inContextOfFile) {
        return specifier;
    }
    rewriteNamespaceImportIdentifier(specifier) {
        return specifier;
    }
}
/**
 * A mapping of supported symbols that can be imported from within @angular/core, and the names by
 * which they're exported from r3_symbols.
 */
const CORE_SUPPORTED_SYMBOLS = new Map([
    ['ɵɵdefineInjectable', 'ɵɵdefineInjectable'],
    ['ɵɵdefineInjector', 'ɵɵdefineInjector'],
    ['ɵɵdefineNgModule', 'ɵɵdefineNgModule'],
    ['ɵɵsetNgModuleScope', 'ɵɵsetNgModuleScope'],
    ['ɵɵinject', 'ɵɵinject'],
    ['ɵɵFactoryDeclaration', 'ɵɵFactoryDeclaration'],
    ['ɵsetClassMetadata', 'setClassMetadata'],
    ['ɵsetClassMetadataAsync', 'setClassMetadataAsync'],
    ['ɵɵInjectableDeclaration', 'ɵɵInjectableDeclaration'],
    ['ɵɵInjectorDeclaration', 'ɵɵInjectorDeclaration'],
    ['ɵɵNgModuleDeclaration', 'ɵɵNgModuleDeclaration'],
    ['ɵNgModuleFactory', 'NgModuleFactory'],
    ['ɵnoSideEffects', 'ɵnoSideEffects'],
]);
const CORE_MODULE = '@angular/core';
/**
 * `ImportRewriter` that rewrites imports from '@angular/core' to be imported from the r3_symbols.ts
 * file instead.
 */
class R3SymbolsImportRewriter {
    r3SymbolsPath;
    constructor(r3SymbolsPath) {
        this.r3SymbolsPath = r3SymbolsPath;
    }
    rewriteSymbol(symbol, specifier) {
        if (specifier !== CORE_MODULE) {
            // This import isn't from core, so ignore it.
            return symbol;
        }
        return validateAndRewriteCoreSymbol(symbol);
    }
    rewriteSpecifier(specifier, inContextOfFile) {
        if (specifier !== CORE_MODULE) {
            // This module isn't core, so ignore it.
            return specifier;
        }
        const relativePathToR3Symbols = relativePathBetween(inContextOfFile, this.r3SymbolsPath);
        if (relativePathToR3Symbols === null) {
            throw new Error(`Failed to rewrite import inside ${CORE_MODULE}: ${inContextOfFile} -> ${this.r3SymbolsPath}`);
        }
        return relativePathToR3Symbols;
    }
    rewriteNamespaceImportIdentifier(specifier) {
        return specifier;
    }
}
function validateAndRewriteCoreSymbol(name) {
    if (!CORE_SUPPORTED_SYMBOLS.has(name)) {
        throw new Error(`Importing unexpected symbol ${name} while compiling ${CORE_MODULE}`);
    }
    return CORE_SUPPORTED_SYMBOLS.get(name);
}

const AssumeEager = 'AssumeEager';
/**
 * Allows to register a symbol as deferrable and keep track of its usage.
 *
 * This information is later used to determine whether it's safe to drop
 * a regular import of this symbol (actually the entire import declaration)
 * in favor of using a dynamic import for cases when defer blocks are used.
 */
class DeferredSymbolTracker {
    typeChecker;
    onlyExplicitDeferDependencyImports;
    imports = new Map();
    /**
     * Map of a component class -> all import declarations that bring symbols
     * used within `@Component.deferredImports` field.
     */
    explicitlyDeferredImports = new Map();
    constructor(typeChecker, onlyExplicitDeferDependencyImports) {
        this.typeChecker = typeChecker;
        this.onlyExplicitDeferDependencyImports = onlyExplicitDeferDependencyImports;
    }
    /**
     * Given an import declaration node, extract the names of all imported symbols
     * and return them as a map where each symbol is a key and `AssumeEager` is a value.
     *
     * The logic recognizes the following import shapes:
     *
     * Case 1: `import {a, b as B} from 'a'`
     * Case 2: `import X from 'a'`
     * Case 3: `import * as x from 'a'`
     */
    extractImportedSymbols(importDecl) {
        const symbolMap = new Map();
        // Unsupported case: `import 'a'`
        if (importDecl.importClause === undefined) {
            throw new Error(`Provided import declaration doesn't have any symbols.`);
        }
        // If the entire import is a type-only import, none of the symbols can be eager.
        if (importDecl.importClause.isTypeOnly) {
            return symbolMap;
        }
        if (importDecl.importClause.namedBindings !== undefined) {
            const bindings = importDecl.importClause.namedBindings;
            if (ts.isNamedImports(bindings)) {
                // Case 1: `import {a, b as B} from 'a'`
                for (const element of bindings.elements) {
                    if (!element.isTypeOnly) {
                        symbolMap.set(element.name.text, AssumeEager);
                    }
                }
            }
            else {
                // Case 2: `import X from 'a'`
                symbolMap.set(bindings.name.text, AssumeEager);
            }
        }
        else if (importDecl.importClause.name !== undefined) {
            // Case 2: `import * as x from 'a'`
            symbolMap.set(importDecl.importClause.name.text, AssumeEager);
        }
        else {
            throw new Error('Unrecognized import structure.');
        }
        return symbolMap;
    }
    /**
     * Retrieves a list of import declarations that contain symbols used within
     * `@Component.deferredImports` of a specific component class, but those imports
     * can not be removed, since there are other symbols imported alongside deferred
     * components.
     */
    getNonRemovableDeferredImports(sourceFile, classDecl) {
        const affectedImports = [];
        const importDecls = this.explicitlyDeferredImports.get(classDecl) ?? [];
        for (const importDecl of importDecls) {
            if (importDecl.getSourceFile() === sourceFile && !this.canDefer(importDecl)) {
                affectedImports.push(importDecl);
            }
        }
        return affectedImports;
    }
    /**
     * Marks a given identifier and an associated import declaration as a candidate
     * for defer loading.
     */
    markAsDeferrableCandidate(identifier, importDecl, componentClassDecl, isExplicitlyDeferred) {
        if (this.onlyExplicitDeferDependencyImports && !isExplicitlyDeferred) {
            // Ignore deferrable candidates when only explicit deferred imports mode is enabled.
            // In that mode only dependencies from the `@Component.deferredImports` field are
            // defer-loadable.
            return;
        }
        if (isExplicitlyDeferred) {
            if (this.explicitlyDeferredImports.has(componentClassDecl)) {
                this.explicitlyDeferredImports.get(componentClassDecl).push(importDecl);
            }
            else {
                this.explicitlyDeferredImports.set(componentClassDecl, [importDecl]);
            }
        }
        let symbolMap = this.imports.get(importDecl);
        // Do we come across this import for the first time?
        if (!symbolMap) {
            symbolMap = this.extractImportedSymbols(importDecl);
            this.imports.set(importDecl, symbolMap);
        }
        if (!symbolMap.has(identifier.text)) {
            throw new Error(`The '${identifier.text}' identifier doesn't belong ` +
                `to the provided import declaration.`);
        }
        if (symbolMap.get(identifier.text) === AssumeEager) {
            // We process this symbol for the first time, populate references.
            symbolMap.set(identifier.text, this.lookupIdentifiersInSourceFile(identifier.text, importDecl));
        }
        const identifiers = symbolMap.get(identifier.text);
        // Drop the current identifier, since we are trying to make it deferrable
        // (it's used as a dependency in one of the defer blocks).
        identifiers.delete(identifier);
    }
    /**
     * Whether all symbols from a given import declaration have no references
     * in a source file, thus it's safe to use dynamic imports.
     */
    canDefer(importDecl) {
        if (!this.imports.has(importDecl)) {
            return false;
        }
        const symbolsMap = this.imports.get(importDecl);
        for (const refs of symbolsMap.values()) {
            if (refs === AssumeEager || refs.size > 0) {
                // There may be still eager references to this symbol.
                return false;
            }
        }
        return true;
    }
    /**
     * Returns a set of import declarations that is safe to remove
     * from the current source file and generate dynamic imports instead.
     */
    getDeferrableImportDecls() {
        const deferrableDecls = new Set();
        for (const [importDecl] of this.imports) {
            if (this.canDefer(importDecl)) {
                deferrableDecls.add(importDecl);
            }
        }
        return deferrableDecls;
    }
    lookupIdentifiersInSourceFile(name, importDecl) {
        const results = new Set();
        const visit = (node) => {
            // Don't record references from the declaration itself or inside
            // type nodes which will be stripped from the JS output.
            if (node === importDecl || ts.isTypeNode(node)) {
                return;
            }
            if (ts.isIdentifier(node) && node.text === name) {
                // Is `node` actually a reference to this symbol?
                const sym = this.typeChecker.getSymbolAtLocation(node);
                if (sym === undefined) {
                    return;
                }
                if (sym.declarations === undefined || sym.declarations.length === 0) {
                    return;
                }
                const importClause = sym.declarations[0];
                // Is declaration from this import statement?
                const decl = checker.getContainingImportDeclaration(importClause);
                if (decl !== importDecl) {
                    return;
                }
                // `node` *is* a reference to the same import.
                results.add(node);
            }
            ts.forEachChild(node, visit);
        };
        visit(importDecl.getSourceFile());
        return results;
    }
}

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
/**
 * Tracks which symbols are imported in specific files and under what names. Allows for efficient
 * querying for references to those symbols without having to consult the type checker early in the
 * process.
 *
 * Note that the tracker doesn't account for variable shadowing so a final verification with the
 * type checker may be necessary, depending on the context. Also does not track dynamic imports.
 */
class ImportedSymbolsTracker {
    fileToNamedImports = new WeakMap();
    fileToNamespaceImports = new WeakMap();
    /**
     * Checks if an identifier is a potential reference to a specific named import within the same
     * file.
     * @param node Identifier to be checked.
     * @param exportedName Name of the exported symbol that is being searched for.
     * @param moduleName Module from which the symbol should be imported.
     */
    isPotentialReferenceToNamedImport(node, exportedName, moduleName) {
        const sourceFile = node.getSourceFile();
        this.scanImports(sourceFile);
        const fileImports = this.fileToNamedImports.get(sourceFile);
        const moduleImports = fileImports.get(moduleName);
        const symbolImports = moduleImports?.get(exportedName);
        return symbolImports !== undefined && symbolImports.has(node.text);
    }
    /**
     * Checks if an identifier is a potential reference to a specific namespace import within the same
     * file.
     * @param node Identifier to be checked.
     * @param moduleName Module from which the namespace is imported.
     */
    isPotentialReferenceToNamespaceImport(node, moduleName) {
        const sourceFile = node.getSourceFile();
        this.scanImports(sourceFile);
        const namespaces = this.fileToNamespaceImports.get(sourceFile);
        return namespaces.get(moduleName)?.has(node.text) ?? false;
    }
    /**
     * Checks if a file has a named imported of a certain symbol.
     * @param sourceFile File to be checked.
     * @param exportedName Name of the exported symbol that is being checked.
     * @param moduleName Module that exports the symbol.
     */
    hasNamedImport(sourceFile, exportedName, moduleName) {
        this.scanImports(sourceFile);
        const fileImports = this.fileToNamedImports.get(sourceFile);
        const moduleImports = fileImports.get(moduleName);
        return moduleImports !== undefined && moduleImports.has(exportedName);
    }
    /**
     * Checks if a file has namespace imports of a certain symbol.
     * @param sourceFile File to be checked.
     * @param moduleName Module whose namespace import is being searched for.
     */
    hasNamespaceImport(sourceFile, moduleName) {
        this.scanImports(sourceFile);
        const namespaces = this.fileToNamespaceImports.get(sourceFile);
        return namespaces.has(moduleName);
    }
    /** Scans a `SourceFile` for import statements and caches them for later use. */
    scanImports(sourceFile) {
        if (this.fileToNamedImports.has(sourceFile) && this.fileToNamespaceImports.has(sourceFile)) {
            return;
        }
        const namedImports = new Map();
        const namespaceImports = new Map();
        this.fileToNamedImports.set(sourceFile, namedImports);
        this.fileToNamespaceImports.set(sourceFile, namespaceImports);
        // Only check top-level imports.
        for (const stmt of sourceFile.statements) {
            if (!ts.isImportDeclaration(stmt) ||
                !ts.isStringLiteralLike(stmt.moduleSpecifier) ||
                stmt.importClause?.namedBindings === undefined) {
                continue;
            }
            const moduleName = stmt.moduleSpecifier.text;
            if (ts.isNamespaceImport(stmt.importClause.namedBindings)) {
                // import * as foo from 'module'
                if (!namespaceImports.has(moduleName)) {
                    namespaceImports.set(moduleName, new Set());
                }
                namespaceImports.get(moduleName).add(stmt.importClause.namedBindings.name.text);
            }
            else {
                // import {foo, bar as alias} from 'module'
                for (const element of stmt.importClause.namedBindings.elements) {
                    const localName = element.name.text;
                    const exportedName = element.propertyName === undefined ? localName : element.propertyName.text;
                    if (!namedImports.has(moduleName)) {
                        namedImports.set(moduleName, new Map());
                    }
                    const localNames = namedImports.get(moduleName);
                    if (!localNames.has(exportedName)) {
                        localNames.set(exportedName, new Set());
                    }
                    localNames.get(exportedName)?.add(localName);
                }
            }
        }
    }
}

/**
 * A tool to track extra imports to be added to the generated files in the local compilation mode.
 *
 * This is needed for g3 bundling mechanism which requires dev files (= locally compiled) to have
 * imports resemble those generated for prod files (= full compilation mode). In full compilation
 * mode Angular compiler generates extra imports for statically analyzed component dependencies. We
 * need similar imports in local compilation as well.
 *
 * The tool offers API for adding local imports (to be added to a specific file) and global imports
 * (to be added to all the files in the local compilation). For more details on how these extra
 * imports are determined see this design doc:
 * https://docs.google.com/document/d/1dOWoSDvOY9ozlMmyCnxoFLEzGgHmTFVRAOVdVU-bxlI/edit?tab=t.0#heading=h.5n3k516r57g5
 *
 * An instance of this class will be passed to each annotation handler so that they can register the
 * extra imports that they see fit. Later on, the instance is passed to the Ivy transformer ({@link
 * ivyTransformFactory}) and it is used to add the extra imports registered by the handlers to the
 * import manager ({@link ImportManager}) in order to have these imports generated.
 *
 * The extra imports are all side effect imports, and so they are identified by a single string
 * containing the module name.
 *
 */
class LocalCompilationExtraImportsTracker {
    typeChecker;
    localImportsMap = new Map();
    globalImportsSet = new Set();
    /** Names of the files marked for extra import generation. */
    markedFilesSet = new Set();
    constructor(typeChecker) {
        this.typeChecker = typeChecker;
    }
    /**
     * Marks the source file for extra imports generation.
     *
     * The extra imports are generated only for the files marked through this method. In other words,
     * the method {@link getImportsForFile} returns empty if the file is not marked. This allows the
     * consumers of this tool to avoid generating extra imports for unrelated files (e.g., non-Angular
     * files)
     */
    markFileForExtraImportGeneration(sf) {
        this.markedFilesSet.add(sf.fileName);
    }
    /**
     * Adds an extra import to be added to the generated file of a specific source file.
     */
    addImportForFile(sf, moduleName) {
        if (!this.localImportsMap.has(sf.fileName)) {
            this.localImportsMap.set(sf.fileName, new Set());
        }
        this.localImportsMap.get(sf.fileName).add(moduleName);
    }
    /**
     * If the given node is an imported identifier, this method adds the module from which it is
     * imported as an extra import to the generated file of each source file in the compilation unit,
     * otherwise the method is noop.
     *
     * Adding an extra import to all files is not optimal though. There are rooms to optimize and a
     * add the import to a subset of files (e.g., exclude all the non Angular files as they don't need
     * any extra import). However for this first version of this feature we go by this mechanism for
     * simplicity. There will be on-going work to further optimize this method to add the extra import
     * to smallest possible candidate files instead of all files.
     */
    addGlobalImportFromIdentifier(node) {
        let identifier = null;
        if (ts.isIdentifier(node)) {
            identifier = node;
        }
        else if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression)) {
            identifier = node.expression;
        }
        if (identifier === null) {
            return;
        }
        const sym = this.typeChecker.getSymbolAtLocation(identifier);
        if (!sym?.declarations?.length) {
            return;
        }
        const importClause = sym.declarations[0];
        const decl = checker.getContainingImportDeclaration(importClause);
        if (decl !== null) {
            this.globalImportsSet.add(removeQuotations(decl.moduleSpecifier.getText()));
        }
    }
    /**
     * Returns the list of all module names that the given file should include as its extra imports.
     */
    getImportsForFile(sf) {
        if (!this.markedFilesSet.has(sf.fileName)) {
            return [];
        }
        return [...this.globalImportsSet, ...(this.localImportsMap.get(sf.fileName) ?? [])];
    }
}
function removeQuotations(s) {
    return s.substring(1, s.length - 1).trim();
}

/**
 * Used by `RouterEntryPointManager` and `NgModuleRouteAnalyzer` (which is in turn is used by
 * `NgModuleDecoratorHandler`) for resolving the module source-files references in lazy-loaded
 * routes (relative to the source-file containing the `NgModule` that provides the route
 * definitions).
 */
class ModuleResolver {
    program;
    compilerOptions;
    host;
    moduleResolutionCache;
    constructor(program, compilerOptions, host, moduleResolutionCache) {
        this.program = program;
        this.compilerOptions = compilerOptions;
        this.host = host;
        this.moduleResolutionCache = moduleResolutionCache;
    }
    resolveModule(moduleName, containingFile) {
        const resolved = checker.resolveModuleName(moduleName, containingFile, this.compilerOptions, this.host, this.moduleResolutionCache);
        if (resolved === undefined) {
            return null;
        }
        return checker.getSourceFileOrNull(this.program, checker.absoluteFrom(resolved.resolvedFileName));
    }
}

/**
 * A `MetadataReader` that can read metadata from `.d.ts` files, which have static Ivy properties
 * from an upstream compilation already.
 */
class DtsMetadataReader {
    checker;
    reflector;
    constructor(checker, reflector) {
        this.checker = checker;
        this.reflector = reflector;
    }
    /**
     * Read the metadata from a class that has already been compiled somehow (either it's in a .d.ts
     * file, or in a .ts file with a handwritten definition).
     *
     * @param ref `Reference` to the class of interest, with the context of how it was obtained.
     */
    getNgModuleMetadata(ref) {
        const clazz = ref.node;
        // This operation is explicitly not memoized, as it depends on `ref.ownedByModuleGuess`.
        // TODO(alxhub): investigate caching of .d.ts module metadata.
        const ngModuleDef = this.reflector
            .getMembersOfClass(clazz)
            .find((member) => member.name === 'ɵmod' && member.isStatic);
        if (ngModuleDef === undefined) {
            return null;
        }
        else if (
        // Validate that the shape of the ngModuleDef type is correct.
        ngModuleDef.type === null ||
            !ts.isTypeReferenceNode(ngModuleDef.type) ||
            ngModuleDef.type.typeArguments === undefined ||
            ngModuleDef.type.typeArguments.length !== 4) {
            return null;
        }
        // Read the ModuleData out of the type arguments.
        const [_, declarationMetadata, importMetadata, exportMetadata] = ngModuleDef.type.typeArguments;
        const declarations = checker.extractReferencesFromType(this.checker, declarationMetadata, ref.bestGuessOwningModule);
        const exports = checker.extractReferencesFromType(this.checker, exportMetadata, ref.bestGuessOwningModule);
        const imports = checker.extractReferencesFromType(this.checker, importMetadata, ref.bestGuessOwningModule);
        // The module is considered poisoned if it's exports couldn't be
        // resolved completely. This would make the module not necessarily
        // usable for scope computation relying on this module; so we propagate
        // this "incompleteness" information to the caller.
        const isPoisoned = exports.isIncomplete;
        return {
            kind: checker.MetaKind.NgModule,
            ref,
            declarations: declarations.result,
            isPoisoned,
            exports: exports.result,
            imports: imports.result,
            schemas: [],
            rawDeclarations: null,
            rawImports: null,
            rawExports: null,
            decorator: null,
            // NgModules declared outside the current compilation are assumed to contain providers, as it
            // would be a non-breaking change for a library to introduce providers at any point.
            mayDeclareProviders: true,
        };
    }
    /**
     * Read directive (or component) metadata from a referenced class in a .d.ts file.
     */
    getDirectiveMetadata(ref) {
        const clazz = ref.node;
        const def = this.reflector
            .getMembersOfClass(clazz)
            .find((field) => field.isStatic && (field.name === 'ɵcmp' || field.name === 'ɵdir'));
        if (def === undefined) {
            // No definition could be found.
            return null;
        }
        else if (def.type === null ||
            !ts.isTypeReferenceNode(def.type) ||
            def.type.typeArguments === undefined ||
            def.type.typeArguments.length < 2) {
            // The type metadata was the wrong shape.
            return null;
        }
        const isComponent = def.name === 'ɵcmp';
        const ctorParams = this.reflector.getConstructorParameters(clazz);
        // A directive is considered to be structural if:
        // 1) it's a directive, not a component, and
        // 2) it injects `TemplateRef`
        const isStructural = !isComponent &&
            ctorParams !== null &&
            ctorParams.some((param) => {
                return (param.typeValueReference.kind === 1 /* TypeValueReferenceKind.IMPORTED */ &&
                    param.typeValueReference.moduleName === '@angular/core' &&
                    param.typeValueReference.importedName === 'TemplateRef');
            });
        const ngContentSelectors = def.type.typeArguments.length > 6 ? checker.readStringArrayType(def.type.typeArguments[6]) : null;
        // Note: the default value is still `false` here, because only legacy .d.ts files written before
        // we had so many arguments use this default.
        const isStandalone = def.type.typeArguments.length > 7 && (checker.readBooleanType(def.type.typeArguments[7]) ?? false);
        const inputs = checker.ClassPropertyMapping.fromMappedObject(readInputsType(def.type.typeArguments[3]));
        const outputs = checker.ClassPropertyMapping.fromMappedObject(checker.readMapType(def.type.typeArguments[4], checker.readStringType));
        const hostDirectives = def.type.typeArguments.length > 8
            ? readHostDirectivesType(this.checker, def.type.typeArguments[8], ref.bestGuessOwningModule)
            : null;
        const isSignal = def.type.typeArguments.length > 9 && (checker.readBooleanType(def.type.typeArguments[9]) ?? false);
        // At this point in time, the `.d.ts` may not be fully extractable when
        // trying to resolve host directive types to their declarations.
        // If this cannot be done completely, the metadata is incomplete and "poisoned".
        const isPoisoned = hostDirectives !== null && hostDirectives?.isIncomplete;
        return {
            kind: checker.MetaKind.Directive,
            matchSource: checker.MatchSource.Selector,
            ref,
            name: clazz.name.text,
            isComponent,
            selector: checker.readStringType(def.type.typeArguments[1]),
            exportAs: checker.readStringArrayType(def.type.typeArguments[2]),
            inputs,
            outputs,
            hostDirectives: hostDirectives?.result ?? null,
            queries: checker.readStringArrayType(def.type.typeArguments[5]),
            ...checker.extractDirectiveTypeCheckMeta(clazz, inputs, this.reflector),
            baseClass: readBaseClass(clazz, this.checker, this.reflector),
            isPoisoned,
            isStructural,
            animationTriggerNames: null,
            ngContentSelectors,
            isStandalone,
            isSignal,
            // We do not transfer information about inputs from class metadata
            // via `.d.ts` declarations. This is fine because this metadata is
            // currently only used for classes defined in source files. E.g. in migrations.
            inputFieldNamesFromMetadataArray: null,
            // Imports are tracked in metadata only for template type-checking purposes,
            // so standalone components from .d.ts files don't have any.
            imports: null,
            rawImports: null,
            deferredImports: null,
            // The same goes for schemas.
            schemas: null,
            decorator: null,
            // Assume that standalone components from .d.ts files may export providers.
            assumedToExportProviders: isComponent && isStandalone,
            // `preserveWhitespaces` isn't encoded in the .d.ts and is only
            // used to increase the accuracy of a diagnostic.
            preserveWhitespaces: false,
            isExplicitlyDeferred: false,
        };
    }
    /**
     * Read pipe metadata from a referenced class in a .d.ts file.
     */
    getPipeMetadata(ref) {
        const def = this.reflector
            .getMembersOfClass(ref.node)
            .find((field) => field.isStatic && field.name === 'ɵpipe');
        if (def === undefined) {
            // No definition could be found.
            return null;
        }
        else if (def.type === null ||
            !ts.isTypeReferenceNode(def.type) ||
            def.type.typeArguments === undefined ||
            def.type.typeArguments.length < 2) {
            // The type metadata was the wrong shape.
            return null;
        }
        const type = def.type.typeArguments[1];
        if (!ts.isLiteralTypeNode(type) || !ts.isStringLiteral(type.literal)) {
            // The type metadata was the wrong type.
            return null;
        }
        const name = type.literal.text;
        const isStandalone = def.type.typeArguments.length > 2 && (checker.readBooleanType(def.type.typeArguments[2]) ?? false);
        return {
            kind: checker.MetaKind.Pipe,
            ref,
            name,
            nameExpr: null,
            isStandalone,
            decorator: null,
            isExplicitlyDeferred: false,
        };
    }
}
function readInputsType(type) {
    const inputsMap = {};
    if (ts.isTypeLiteralNode(type)) {
        for (const member of type.members) {
            if (!ts.isPropertySignature(member) ||
                member.type === undefined ||
                member.name === undefined ||
                (!ts.isStringLiteral(member.name) && !ts.isIdentifier(member.name))) {
                continue;
            }
            const stringValue = checker.readStringType(member.type);
            const classPropertyName = member.name.text;
            // Before v16 the inputs map has the type of `{[field: string]: string}`.
            // After v16 it has the type of `{[field: string]: {alias: string, required: boolean}}`.
            if (stringValue != null) {
                inputsMap[classPropertyName] = {
                    bindingPropertyName: stringValue,
                    classPropertyName,
                    required: false,
                    // Signal inputs were not supported pre v16- so those inputs are never signal based.
                    isSignal: false,
                    // Input transform are only tracked for locally-compiled directives. Directives coming
                    // from the .d.ts already have them included through `ngAcceptInputType` class members,
                    // or via the `InputSignal` type of the member.
                    transform: null,
                };
            }
            else {
                const config = checker.readMapType(member.type, (innerValue) => {
                    return checker.readStringType(innerValue) ?? checker.readBooleanType(innerValue);
                });
                inputsMap[classPropertyName] = {
                    classPropertyName,
                    bindingPropertyName: config.alias,
                    required: config.required,
                    isSignal: !!config.isSignal,
                    // Input transform are only tracked for locally-compiled directives. Directives coming
                    // from the .d.ts already have them included through `ngAcceptInputType` class members,
                    // or via the `InputSignal` type of the member.
                    transform: null,
                };
            }
        }
    }
    return inputsMap;
}
function readBaseClass(clazz, checker$1, reflector) {
    if (!checker.isNamedClassDeclaration(clazz)) {
        // Technically this is an error in a .d.ts file, but for the purposes of finding the base class
        // it's ignored.
        return reflector.hasBaseClass(clazz) ? 'dynamic' : null;
    }
    if (clazz.heritageClauses !== undefined) {
        for (const clause of clazz.heritageClauses) {
            if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
                const baseExpr = clause.types[0].expression;
                let symbol = checker$1.getSymbolAtLocation(baseExpr);
                if (symbol === undefined) {
                    return 'dynamic';
                }
                else if (symbol.flags & ts.SymbolFlags.Alias) {
                    symbol = checker$1.getAliasedSymbol(symbol);
                }
                if (symbol.valueDeclaration !== undefined &&
                    checker.isNamedClassDeclaration(symbol.valueDeclaration)) {
                    return new checker.Reference(symbol.valueDeclaration);
                }
                else {
                    return 'dynamic';
                }
            }
        }
    }
    return null;
}
function readHostDirectivesType(checker$1, type, bestGuessOwningModule) {
    if (!ts.isTupleTypeNode(type) || type.elements.length === 0) {
        return null;
    }
    const result = [];
    let isIncomplete = false;
    for (const hostDirectiveType of type.elements) {
        const { directive, inputs, outputs } = checker.readMapType(hostDirectiveType, (type) => type);
        if (directive) {
            if (!ts.isTypeQueryNode(directive)) {
                throw new Error(`Expected TypeQueryNode: ${checker.nodeDebugInfo(directive)}`);
            }
            const ref = checker.extraReferenceFromTypeQuery(checker$1, directive, type, bestGuessOwningModule);
            if (ref === null) {
                isIncomplete = true;
                continue;
            }
            result.push({
                directive: ref,
                isForwardReference: false,
                inputs: checker.readMapType(inputs, checker.readStringType),
                outputs: checker.readMapType(outputs, checker.readStringType),
            });
        }
    }
    return result.length > 0 ? { result, isIncomplete } : null;
}

/**
 * A registry of directive, pipe, and module metadata for types defined in the current compilation
 * unit, which supports both reading and registering.
 */
class LocalMetadataRegistry {
    directives = new Map();
    ngModules = new Map();
    pipes = new Map();
    getDirectiveMetadata(ref) {
        return this.directives.has(ref.node) ? this.directives.get(ref.node) : null;
    }
    getNgModuleMetadata(ref) {
        return this.ngModules.has(ref.node) ? this.ngModules.get(ref.node) : null;
    }
    getPipeMetadata(ref) {
        return this.pipes.has(ref.node) ? this.pipes.get(ref.node) : null;
    }
    registerDirectiveMetadata(meta) {
        this.directives.set(meta.ref.node, meta);
    }
    registerNgModuleMetadata(meta) {
        this.ngModules.set(meta.ref.node, meta);
    }
    registerPipeMetadata(meta) {
        this.pipes.set(meta.ref.node, meta);
    }
    getKnown(kind) {
        switch (kind) {
            case checker.MetaKind.Directive:
                return Array.from(this.directives.values()).map((v) => v.ref.node);
            case checker.MetaKind.Pipe:
                return Array.from(this.pipes.values()).map((v) => v.ref.node);
            case checker.MetaKind.NgModule:
                return Array.from(this.ngModules.values()).map((v) => v.ref.node);
        }
    }
}
/**
 * A `MetadataRegistry` which registers metadata with multiple delegate `MetadataRegistry`
 * instances.
 */
class CompoundMetadataRegistry {
    registries;
    constructor(registries) {
        this.registries = registries;
    }
    registerDirectiveMetadata(meta) {
        for (const registry of this.registries) {
            registry.registerDirectiveMetadata(meta);
        }
    }
    registerNgModuleMetadata(meta) {
        for (const registry of this.registries) {
            registry.registerNgModuleMetadata(meta);
        }
    }
    registerPipeMetadata(meta) {
        for (const registry of this.registries) {
            registry.registerPipeMetadata(meta);
        }
    }
}

/**
 * Tracks the mapping between external resources and the directives(s) which use them.
 *
 * This information is produced during analysis of the program and is used mainly to support
 * external tooling, for which such a mapping is challenging to determine without compiler
 * assistance.
 */
class ResourceRegistry {
    externalTemplateToComponentsMap = new Map();
    componentToTemplateMap = new Map();
    componentToStylesMap = new Map();
    externalStyleToComponentsMap = new Map();
    directiveToHostBindingsMap = new Map();
    getComponentsWithTemplate(template) {
        if (!this.externalTemplateToComponentsMap.has(template)) {
            return new Set();
        }
        return this.externalTemplateToComponentsMap.get(template);
    }
    registerResources(resources, directive) {
        if (resources.template !== null) {
            this.registerTemplate(resources.template, directive);
        }
        if (resources.styles !== null) {
            for (const style of resources.styles) {
                this.registerStyle(style, directive);
            }
        }
        if (resources.hostBindings !== null) {
            this.directiveToHostBindingsMap.set(directive, resources.hostBindings);
        }
    }
    registerTemplate(templateResource, component) {
        const { path } = templateResource;
        if (path !== null) {
            if (!this.externalTemplateToComponentsMap.has(path)) {
                this.externalTemplateToComponentsMap.set(path, new Set());
            }
            this.externalTemplateToComponentsMap.get(path).add(component);
        }
        this.componentToTemplateMap.set(component, templateResource);
    }
    getTemplate(component) {
        if (!this.componentToTemplateMap.has(component)) {
            return null;
        }
        return this.componentToTemplateMap.get(component);
    }
    registerStyle(styleResource, component) {
        const { path } = styleResource;
        if (!this.componentToStylesMap.has(component)) {
            this.componentToStylesMap.set(component, new Set());
        }
        if (path !== null) {
            if (!this.externalStyleToComponentsMap.has(path)) {
                this.externalStyleToComponentsMap.set(path, new Set());
            }
            this.externalStyleToComponentsMap.get(path).add(component);
        }
        this.componentToStylesMap.get(component).add(styleResource);
    }
    getStyles(component) {
        if (!this.componentToStylesMap.has(component)) {
            return new Set();
        }
        return this.componentToStylesMap.get(component);
    }
    getComponentsWithStyle(styleUrl) {
        if (!this.externalStyleToComponentsMap.has(styleUrl)) {
            return new Set();
        }
        return this.externalStyleToComponentsMap.get(styleUrl);
    }
    getHostBindings(directive) {
        return this.directiveToHostBindingsMap.get(directive) ?? null;
    }
}

/**
 * Determines whether types may or may not export providers to NgModules, by transitively walking
 * the NgModule & standalone import graph.
 */
class ExportedProviderStatusResolver {
    metaReader;
    /**
     * `ClassDeclaration`s that we are in the process of determining the provider status for.
     *
     * This is used to detect cycles in the import graph and avoid getting stuck in them.
     */
    calculating = new Set();
    constructor(metaReader) {
        this.metaReader = metaReader;
    }
    /**
     * Determines whether `ref` may or may not export providers to NgModules which import it.
     *
     * NgModules export providers if any are declared, and standalone components export providers from
     * their `imports` array (if any).
     *
     * If `true`, then `ref` should be assumed to export providers. In practice, this could mean
     * either that `ref` is a local type that we _know_ exports providers, or it's imported from a
     * .d.ts library and is declared in a way where the compiler cannot prove that it doesn't.
     *
     * If `false`, then `ref` is guaranteed not to export providers.
     *
     * @param `ref` the class for which the provider status should be determined
     * @param `dependencyCallback` a callback that, if provided, will be called for every type
     *     which is used in the determination of provider status for `ref`
     * @returns `true` if `ref` should be assumed to export providers, or `false` if the compiler can
     *     prove that it does not
     */
    mayExportProviders(ref, dependencyCallback) {
        if (this.calculating.has(ref.node)) {
            // For cycles, we treat the cyclic edge as not having providers.
            return false;
        }
        this.calculating.add(ref.node);
        if (dependencyCallback !== undefined) {
            dependencyCallback(ref);
        }
        try {
            const dirMeta = this.metaReader.getDirectiveMetadata(ref);
            if (dirMeta !== null) {
                if (!dirMeta.isComponent || !dirMeta.isStandalone) {
                    return false;
                }
                if (dirMeta.assumedToExportProviders) {
                    return true;
                }
                // If one of the imports contains providers, then so does this component.
                return (dirMeta.imports ?? []).some((importRef) => this.mayExportProviders(importRef, dependencyCallback));
            }
            const pipeMeta = this.metaReader.getPipeMetadata(ref);
            if (pipeMeta !== null) {
                return false;
            }
            const ngModuleMeta = this.metaReader.getNgModuleMetadata(ref);
            if (ngModuleMeta !== null) {
                if (ngModuleMeta.mayDeclareProviders) {
                    return true;
                }
                // If one of the NgModule's imports may contain providers, then so does this NgModule.
                return ngModuleMeta.imports.some((importRef) => this.mayExportProviders(importRef, dependencyCallback));
            }
            return false;
        }
        finally {
            this.calculating.delete(ref.node);
        }
    }
}

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
const EMPTY_ARRAY$1 = [];
/** Resolves the host directives of a directive to a flat array of matches. */
class HostDirectivesResolver {
    metaReader;
    cache = new Map();
    constructor(metaReader) {
        this.metaReader = metaReader;
    }
    /** Resolves all of the host directives that apply to a directive. */
    resolve(metadata) {
        if (this.cache.has(metadata.ref.node)) {
            return this.cache.get(metadata.ref.node);
        }
        const results = metadata.hostDirectives && metadata.hostDirectives.length > 0
            ? this.walkHostDirectives(metadata.hostDirectives, [])
            : EMPTY_ARRAY$1;
        this.cache.set(metadata.ref.node, results);
        return results;
    }
    /**
     * Traverses all of the host directive chains and produces a flat array of
     * directive metadata representing the host directives that apply to the host.
     */
    walkHostDirectives(directives, results) {
        for (const current of directives) {
            if (!checker.isHostDirectiveMetaForGlobalMode(current)) {
                throw new Error('Impossible state: resolving code path in local compilation mode');
            }
            const hostMeta = checker.flattenInheritedDirectiveMetadata(this.metaReader, current.directive);
            // This case has been checked for already and produces a diagnostic
            if (hostMeta === null) {
                continue;
            }
            if (hostMeta.hostDirectives) {
                this.walkHostDirectives(hostMeta.hostDirectives, results);
            }
            results.push({
                ...hostMeta,
                matchSource: checker.MatchSource.HostDirective,
                inputs: checker.ClassPropertyMapping.fromMappedObject(this.filterMappings(hostMeta.inputs, current.inputs, resolveInput)),
                outputs: checker.ClassPropertyMapping.fromMappedObject(this.filterMappings(hostMeta.outputs, current.outputs, resolveOutput)),
            });
        }
        return results;
    }
    /**
     * Filters the class property mappings so that only the allowed ones are present.
     * @param source Property mappings that should be filtered.
     * @param allowedProperties Property mappings that are allowed in the final results.
     * @param valueResolver Function used to resolve the value that is assigned to the final mapping.
     */
    filterMappings(source, allowedProperties, valueResolver) {
        const result = {};
        if (allowedProperties !== null) {
            for (const publicName in allowedProperties) {
                if (allowedProperties.hasOwnProperty(publicName)) {
                    const bindings = source.getByBindingPropertyName(publicName);
                    if (bindings !== null) {
                        for (const binding of bindings) {
                            result[binding.classPropertyName] = valueResolver(allowedProperties[publicName], binding);
                        }
                    }
                }
            }
        }
        return result;
    }
}
function resolveInput(bindingName, binding) {
    return {
        bindingPropertyName: bindingName,
        classPropertyName: binding.classPropertyName,
        required: binding.required,
        transform: binding.transform,
        isSignal: binding.isSignal,
    };
}
function resolveOutput(bindingName) {
    return bindingName;
}

class PartialEvaluator {
    host;
    checker;
    dependencyTracker;
    constructor(host, checker, dependencyTracker) {
        this.host = host;
        this.checker = checker;
        this.dependencyTracker = dependencyTracker;
    }
    evaluate(expr, foreignFunctionResolver) {
        const interpreter = new checker.StaticInterpreter(this.host, this.checker, this.dependencyTracker);
        const sourceFile = expr.getSourceFile();
        return interpreter.visit(expr, {
            originatingFile: sourceFile,
            absoluteModuleName: null,
            resolutionContext: sourceFile.fileName,
            scope: new Map(),
            foreignFunctionResolver,
        });
    }
}

function aliasTransformFactory(exportStatements) {
    return () => {
        return (file) => {
            if (ts.isBundle(file) || !exportStatements.has(file.fileName)) {
                return file;
            }
            const statements = [...file.statements];
            exportStatements.get(file.fileName).forEach(([moduleName, symbolName], aliasName) => {
                const stmt = ts.factory.createExportDeclaration(
                /* modifiers */ undefined, 
                /* isTypeOnly */ false, 
                /* exportClause */ ts.factory.createNamedExports([
                    ts.factory.createExportSpecifier(false, symbolName, aliasName),
                ]), 
                /* moduleSpecifier */ ts.factory.createStringLiteral(moduleName));
                statements.push(stmt);
            });
            return ts.factory.updateSourceFile(file, statements);
        };
    };
}

/// <reference types="node" />
function mark() {
    return process.hrtime();
}
function timeSinceInMicros(mark) {
    const delta = process.hrtime(mark);
    return delta[0] * 1000000 + Math.floor(delta[1] / 1000);
}

/// <reference types="node" />
/**
 * A `PerfRecorder` that actively tracks performance statistics.
 */
class ActivePerfRecorder {
    zeroTime;
    counters;
    phaseTime;
    bytes;
    currentPhase = checker.PerfPhase.Unaccounted;
    currentPhaseEntered;
    /**
     * Creates an `ActivePerfRecorder` with its zero point set to the current time.
     */
    static zeroedToNow() {
        return new ActivePerfRecorder(mark());
    }
    constructor(zeroTime) {
        this.zeroTime = zeroTime;
        this.currentPhaseEntered = this.zeroTime;
        this.counters = Array(checker.PerfEvent.LAST).fill(0);
        this.phaseTime = Array(checker.PerfPhase.LAST).fill(0);
        this.bytes = Array(checker.PerfCheckpoint.LAST).fill(0);
        // Take an initial memory snapshot before any other compilation work begins.
        this.memory(checker.PerfCheckpoint.Initial);
    }
    reset() {
        this.counters = Array(checker.PerfEvent.LAST).fill(0);
        this.phaseTime = Array(checker.PerfPhase.LAST).fill(0);
        this.bytes = Array(checker.PerfCheckpoint.LAST).fill(0);
        this.zeroTime = mark();
        this.currentPhase = checker.PerfPhase.Unaccounted;
        this.currentPhaseEntered = this.zeroTime;
    }
    memory(after) {
        this.bytes[after] = process.memoryUsage().heapUsed;
    }
    phase(phase) {
        const previous = this.currentPhase;
        this.phaseTime[this.currentPhase] += timeSinceInMicros(this.currentPhaseEntered);
        this.currentPhase = phase;
        this.currentPhaseEntered = mark();
        return previous;
    }
    inPhase(phase, fn) {
        const previousPhase = this.phase(phase);
        try {
            return fn();
        }
        finally {
            this.phase(previousPhase);
        }
    }
    eventCount(counter, incrementBy = 1) {
        this.counters[counter] += incrementBy;
    }
    /**
     * Return the current performance metrics as a serializable object.
     */
    finalize() {
        // Track the last segment of time spent in `this.currentPhase` in the time array.
        this.phase(checker.PerfPhase.Unaccounted);
        const results = {
            events: {},
            phases: {},
            memory: {},
        };
        for (let i = 0; i < this.phaseTime.length; i++) {
            if (this.phaseTime[i] > 0) {
                results.phases[checker.PerfPhase[i]] = this.phaseTime[i];
            }
        }
        for (let i = 0; i < this.phaseTime.length; i++) {
            if (this.counters[i] > 0) {
                results.events[checker.PerfEvent[i]] = this.counters[i];
            }
        }
        for (let i = 0; i < this.bytes.length; i++) {
            if (this.bytes[i] > 0) {
                results.memory[checker.PerfCheckpoint[i]] = this.bytes[i];
            }
        }
        return results;
    }
}
/**
 * A `PerfRecorder` that delegates to a target `PerfRecorder` which can be updated later.
 *
 * `DelegatingPerfRecorder` is useful when a compiler class that needs a `PerfRecorder` can outlive
 * the current compilation. This is true for most compiler classes as resource-only changes reuse
 * the same `NgCompiler` for a new compilation.
 */
class DelegatingPerfRecorder {
    target;
    constructor(target) {
        this.target = target;
    }
    eventCount(counter, incrementBy) {
        this.target.eventCount(counter, incrementBy);
    }
    phase(phase) {
        return this.target.phase(phase);
    }
    inPhase(phase, fn) {
        // Note: this doesn't delegate to `this.target.inPhase` but instead is implemented manually here
        // to avoid adding an additional frame of noise to the stack when debugging.
        const previousPhase = this.target.phase(phase);
        try {
            return fn();
        }
        finally {
            this.target.phase(previousPhase);
        }
    }
    memory(after) {
        this.target.memory(after);
    }
    reset() {
        this.target.reset();
    }
}

/**
 * The heart of Angular compilation.
 *
 * The `TraitCompiler` is responsible for processing all classes in the program. Any time a
 * `DecoratorHandler` matches a class, a "trait" is created to represent that Angular aspect of the
 * class (such as the class having a component definition).
 *
 * The `TraitCompiler` transitions each trait through the various phases of compilation, culminating
 * in the production of `CompileResult`s instructing the compiler to apply various mutations to the
 * class (like adding fields or type declarations).
 */
class TraitCompiler {
    handlers;
    reflector;
    perf;
    incrementalBuild;
    compileNonExportedClasses;
    compilationMode;
    dtsTransforms;
    semanticDepGraphUpdater;
    sourceFileTypeIdentifier;
    /**
     * Maps class declarations to their `ClassRecord`, which tracks the Ivy traits being applied to
     * those classes.
     */
    classes = new Map();
    /**
     * Maps source files to any class declaration(s) within them which have been discovered to contain
     * Ivy traits.
     */
    fileToClasses = new Map();
    /**
     * Tracks which source files have been analyzed but did not contain any traits. This set allows
     * the compiler to skip analyzing these files in an incremental rebuild.
     */
    filesWithoutTraits = new Set();
    reexportMap = new Map();
    handlersByName = new Map();
    constructor(handlers, reflector, perf, incrementalBuild, compileNonExportedClasses, compilationMode, dtsTransforms, semanticDepGraphUpdater, sourceFileTypeIdentifier) {
        this.handlers = handlers;
        this.reflector = reflector;
        this.perf = perf;
        this.incrementalBuild = incrementalBuild;
        this.compileNonExportedClasses = compileNonExportedClasses;
        this.compilationMode = compilationMode;
        this.dtsTransforms = dtsTransforms;
        this.semanticDepGraphUpdater = semanticDepGraphUpdater;
        this.sourceFileTypeIdentifier = sourceFileTypeIdentifier;
        for (const handler of handlers) {
            this.handlersByName.set(handler.name, handler);
        }
    }
    analyzeSync(sf) {
        this.analyze(sf, false);
    }
    analyzeAsync(sf) {
        return this.analyze(sf, true);
    }
    analyze(sf, preanalyze) {
        // We shouldn't analyze declaration, shim, or resource files.
        if (sf.isDeclarationFile ||
            this.sourceFileTypeIdentifier.isShim(sf) ||
            this.sourceFileTypeIdentifier.isResource(sf)) {
            return undefined;
        }
        // analyze() really wants to return `Promise<void>|void`, but TypeScript cannot narrow a return
        // type of 'void', so `undefined` is used instead.
        const promises = [];
        // Local compilation does not support incremental build.
        const priorWork = this.compilationMode !== checker.CompilationMode.LOCAL
            ? this.incrementalBuild.priorAnalysisFor(sf)
            : null;
        if (priorWork !== null) {
            this.perf.eventCount(checker.PerfEvent.SourceFileReuseAnalysis);
            if (priorWork.length > 0) {
                for (const priorRecord of priorWork) {
                    this.adopt(priorRecord);
                }
                this.perf.eventCount(checker.PerfEvent.TraitReuseAnalysis, priorWork.length);
            }
            else {
                this.filesWithoutTraits.add(sf);
            }
            // Skip the rest of analysis, as this file's prior traits are being reused.
            return;
        }
        const visit = (node) => {
            if (this.reflector.isClass(node)) {
                this.analyzeClass(node, preanalyze ? promises : null);
            }
            ts.forEachChild(node, visit);
        };
        visit(sf);
        if (!this.fileToClasses.has(sf)) {
            // If no traits were detected in the source file we record the source file itself to not have
            // any traits, such that analysis of the source file can be skipped during incremental
            // rebuilds.
            this.filesWithoutTraits.add(sf);
        }
        if (preanalyze && promises.length > 0) {
            return Promise.all(promises).then(() => undefined);
        }
        else {
            return undefined;
        }
    }
    recordFor(clazz) {
        if (this.classes.has(clazz)) {
            return this.classes.get(clazz);
        }
        else {
            return null;
        }
    }
    getAnalyzedRecords() {
        const result = new Map();
        for (const [sf, classes] of this.fileToClasses) {
            const records = [];
            for (const clazz of classes) {
                records.push(this.classes.get(clazz));
            }
            result.set(sf, records);
        }
        for (const sf of this.filesWithoutTraits) {
            result.set(sf, []);
        }
        return result;
    }
    /**
     * Import a `ClassRecord` from a previous compilation (only to be used in global compilation
     * modes)
     *
     * Traits from the `ClassRecord` have accurate metadata, but the `handler` is from the old program
     * and needs to be updated (matching is done by name). A new pending trait is created and then
     * transitioned to analyzed using the previous analysis. If the trait is in the errored state,
     * instead the errors are copied over.
     */
    adopt(priorRecord) {
        const record = {
            hasPrimaryHandler: priorRecord.hasPrimaryHandler,
            hasWeakHandlers: priorRecord.hasWeakHandlers,
            metaDiagnostics: priorRecord.metaDiagnostics,
            node: priorRecord.node,
            traits: [],
        };
        for (const priorTrait of priorRecord.traits) {
            const handler = this.handlersByName.get(priorTrait.handler.name);
            let trait = checker.Trait.pending(handler, priorTrait.detected);
            if (priorTrait.state === checker.TraitState.Analyzed || priorTrait.state === checker.TraitState.Resolved) {
                const symbol = this.makeSymbolForTrait(handler, record.node, priorTrait.analysis);
                trait = trait.toAnalyzed(priorTrait.analysis, priorTrait.analysisDiagnostics, symbol);
                if (trait.analysis !== null && trait.handler.register !== undefined) {
                    trait.handler.register(record.node, trait.analysis);
                }
            }
            else if (priorTrait.state === checker.TraitState.Skipped) {
                trait = trait.toSkipped();
            }
            record.traits.push(trait);
        }
        this.classes.set(record.node, record);
        const sf = record.node.getSourceFile();
        if (!this.fileToClasses.has(sf)) {
            this.fileToClasses.set(sf, new Set());
        }
        this.fileToClasses.get(sf).add(record.node);
    }
    scanClassForTraits(clazz) {
        if (!this.compileNonExportedClasses && !this.reflector.isStaticallyExported(clazz)) {
            return null;
        }
        const decorators = this.reflector.getDecoratorsOfDeclaration(clazz);
        return this.detectTraits(clazz, decorators);
    }
    detectTraits(clazz, decorators) {
        let record = this.recordFor(clazz);
        let foundTraits = [];
        // A set to track the non-Angular decorators in local compilation mode. An error will be issued
        // if non-Angular decorators is found in local compilation mode.
        const nonNgDecoratorsInLocalMode = this.compilationMode === checker.CompilationMode.LOCAL ? new Set(decorators) : null;
        for (const handler of this.handlers) {
            const result = handler.detect(clazz, decorators);
            if (result === undefined) {
                continue;
            }
            if (nonNgDecoratorsInLocalMode !== null && result.decorator !== null) {
                nonNgDecoratorsInLocalMode.delete(result.decorator);
            }
            const isPrimaryHandler = handler.precedence === checker.HandlerPrecedence.PRIMARY;
            const isWeakHandler = handler.precedence === checker.HandlerPrecedence.WEAK;
            const trait = checker.Trait.pending(handler, result);
            foundTraits.push(trait);
            if (record === null) {
                // This is the first handler to match this class. This path is a fast path through which
                // most classes will flow.
                record = {
                    node: clazz,
                    traits: [trait],
                    metaDiagnostics: null,
                    hasPrimaryHandler: isPrimaryHandler,
                    hasWeakHandlers: isWeakHandler,
                };
                this.classes.set(clazz, record);
                const sf = clazz.getSourceFile();
                if (!this.fileToClasses.has(sf)) {
                    this.fileToClasses.set(sf, new Set());
                }
                this.fileToClasses.get(sf).add(clazz);
            }
            else {
                // This is at least the second handler to match this class. This is a slower path that some
                // classes will go through, which validates that the set of decorators applied to the class
                // is valid.
                // Validate according to rules as follows:
                //
                // * WEAK handlers are removed if a non-WEAK handler matches.
                // * Only one PRIMARY handler can match at a time. Any other PRIMARY handler matching a
                //   class with an existing PRIMARY handler is an error.
                if (!isWeakHandler && record.hasWeakHandlers) {
                    // The current handler is not a WEAK handler, but the class has other WEAK handlers.
                    // Remove them.
                    record.traits = record.traits.filter((field) => field.handler.precedence !== checker.HandlerPrecedence.WEAK);
                    record.hasWeakHandlers = false;
                }
                else if (isWeakHandler && !record.hasWeakHandlers) {
                    // The current handler is a WEAK handler, but the class has non-WEAK handlers already.
                    // Drop the current one.
                    continue;
                }
                if (isPrimaryHandler && record.hasPrimaryHandler) {
                    // The class already has a PRIMARY handler, and another one just matched.
                    record.metaDiagnostics = [
                        {
                            category: ts.DiagnosticCategory.Error,
                            code: Number('-99' + checker.ErrorCode.DECORATOR_COLLISION),
                            file: checker.getSourceFile(clazz),
                            start: clazz.getStart(undefined, false),
                            length: clazz.getWidth(),
                            messageText: 'Two incompatible decorators on class',
                        },
                    ];
                    record.traits = foundTraits = [];
                    break;
                }
                // Otherwise, it's safe to accept the multiple decorators here. Update some of the metadata
                // regarding this class.
                record.traits.push(trait);
                record.hasPrimaryHandler = record.hasPrimaryHandler || isPrimaryHandler;
            }
        }
        if (nonNgDecoratorsInLocalMode !== null &&
            nonNgDecoratorsInLocalMode.size > 0 &&
            record !== null &&
            record.metaDiagnostics === null) {
            // Custom decorators found in local compilation mode! In this mode we don't support custom
            // decorators yet. But will eventually do (b/320536434). For now a temporary error is thrown.
            record.metaDiagnostics = [...nonNgDecoratorsInLocalMode].map((decorator) => ({
                category: ts.DiagnosticCategory.Error,
                code: Number('-99' + checker.ErrorCode.DECORATOR_UNEXPECTED),
                file: checker.getSourceFile(clazz),
                start: decorator.node.getStart(),
                length: decorator.node.getWidth(),
                messageText: 'In local compilation mode, Angular does not support custom decorators. Ensure all class decorators are from Angular.',
            }));
            record.traits = foundTraits = [];
        }
        return foundTraits.length > 0 ? foundTraits : null;
    }
    makeSymbolForTrait(handler, decl, analysis) {
        if (analysis === null) {
            return null;
        }
        const symbol = handler.symbol(decl, analysis);
        if (symbol !== null && this.semanticDepGraphUpdater !== null) {
            const isPrimary = handler.precedence === checker.HandlerPrecedence.PRIMARY;
            if (!isPrimary) {
                throw new Error(`AssertionError: ${handler.name} returned a symbol but is not a primary handler.`);
            }
            this.semanticDepGraphUpdater.registerSymbol(symbol);
        }
        return symbol;
    }
    analyzeClass(clazz, preanalyzeQueue) {
        const traits = this.scanClassForTraits(clazz);
        if (traits === null) {
            // There are no Ivy traits on the class, so it can safely be skipped.
            return;
        }
        for (const trait of traits) {
            const analyze = () => this.analyzeTrait(clazz, trait);
            let preanalysis = null;
            if (preanalyzeQueue !== null && trait.handler.preanalyze !== undefined) {
                // Attempt to run preanalysis. This could fail with a `FatalDiagnosticError`; catch it if it
                // does.
                try {
                    preanalysis = trait.handler.preanalyze(clazz, trait.detected.metadata) || null;
                }
                catch (err) {
                    if (err instanceof checker.FatalDiagnosticError) {
                        trait.toAnalyzed(null, [err.toDiagnostic()], null);
                        return;
                    }
                    else {
                        throw err;
                    }
                }
            }
            if (preanalysis !== null) {
                preanalyzeQueue.push(preanalysis.then(analyze));
            }
            else {
                analyze();
            }
        }
    }
    analyzeTrait(clazz, trait) {
        if (trait.state !== checker.TraitState.Pending) {
            throw new Error(`Attempt to analyze trait of ${clazz.name.text} in state ${checker.TraitState[trait.state]} (expected DETECTED)`);
        }
        this.perf.eventCount(checker.PerfEvent.TraitAnalyze);
        // Attempt analysis. This could fail with a `FatalDiagnosticError`; catch it if it does.
        let result;
        try {
            result = trait.handler.analyze(clazz, trait.detected.metadata);
        }
        catch (err) {
            if (err instanceof checker.FatalDiagnosticError) {
                trait.toAnalyzed(null, [err.toDiagnostic()], null);
                return;
            }
            else {
                throw err;
            }
        }
        const symbol = this.makeSymbolForTrait(trait.handler, clazz, result.analysis ?? null);
        if (result.analysis !== undefined && trait.handler.register !== undefined) {
            trait.handler.register(clazz, result.analysis);
        }
        trait = trait.toAnalyzed(result.analysis ?? null, result.diagnostics ?? null, symbol);
    }
    resolve() {
        const classes = this.classes.keys();
        for (const clazz of classes) {
            const record = this.classes.get(clazz);
            for (let trait of record.traits) {
                const handler = trait.handler;
                switch (trait.state) {
                    case checker.TraitState.Skipped:
                        continue;
                    case checker.TraitState.Pending:
                        throw new Error(`Resolving a trait that hasn't been analyzed: ${clazz.name.text} / ${trait.handler.name}`);
                    case checker.TraitState.Resolved:
                        throw new Error(`Resolving an already resolved trait`);
                }
                if (trait.analysis === null) {
                    // No analysis results, cannot further process this trait.
                    continue;
                }
                if (handler.resolve === undefined) {
                    // No resolution of this trait needed - it's considered successful by default.
                    trait = trait.toResolved(null, null);
                    continue;
                }
                let result;
                try {
                    result = handler.resolve(clazz, trait.analysis, trait.symbol);
                }
                catch (err) {
                    if (err instanceof checker.FatalDiagnosticError) {
                        trait = trait.toResolved(null, [err.toDiagnostic()]);
                        continue;
                    }
                    else {
                        throw err;
                    }
                }
                trait = trait.toResolved(result.data ?? null, result.diagnostics ?? null);
                if (result.reexports !== undefined) {
                    const fileName = clazz.getSourceFile().fileName;
                    if (!this.reexportMap.has(fileName)) {
                        this.reexportMap.set(fileName, new Map());
                    }
                    const fileReexports = this.reexportMap.get(fileName);
                    for (const reexport of result.reexports) {
                        fileReexports.set(reexport.asAlias, [reexport.fromModule, reexport.symbolName]);
                    }
                }
            }
        }
    }
    /**
     * Generate type-checking code into the `TypeCheckContext` for any components within the given
     * `ts.SourceFile`.
     */
    typeCheck(sf, ctx) {
        if (!this.fileToClasses.has(sf) || this.compilationMode === checker.CompilationMode.LOCAL) {
            return;
        }
        for (const clazz of this.fileToClasses.get(sf)) {
            const record = this.classes.get(clazz);
            for (const trait of record.traits) {
                if (trait.state !== checker.TraitState.Resolved) {
                    continue;
                }
                else if (trait.handler.typeCheck === undefined) {
                    continue;
                }
                if (trait.resolution !== null) {
                    trait.handler.typeCheck(ctx, clazz, trait.analysis, trait.resolution);
                }
            }
        }
    }
    runAdditionalChecks(sf, check) {
        if (this.compilationMode === checker.CompilationMode.LOCAL) {
            return [];
        }
        const classes = this.fileToClasses.get(sf);
        if (classes === undefined) {
            return [];
        }
        const diagnostics = [];
        for (const clazz of classes) {
            if (!checker.isNamedClassDeclaration(clazz)) {
                continue;
            }
            const record = this.classes.get(clazz);
            for (const trait of record.traits) {
                const result = check(clazz, trait.handler);
                if (result !== null) {
                    diagnostics.push(...result);
                }
            }
        }
        return diagnostics;
    }
    index(ctx) {
        for (const clazz of this.classes.keys()) {
            const record = this.classes.get(clazz);
            for (const trait of record.traits) {
                if (trait.state !== checker.TraitState.Resolved) {
                    // Skip traits that haven't been resolved successfully.
                    continue;
                }
                else if (trait.handler.index === undefined) {
                    // Skip traits that don't affect indexing.
                    continue;
                }
                if (trait.resolution !== null) {
                    trait.handler.index(ctx, clazz, trait.analysis, trait.resolution);
                }
            }
        }
    }
    xi18n(bundle) {
        for (const clazz of this.classes.keys()) {
            const record = this.classes.get(clazz);
            for (const trait of record.traits) {
                if (trait.state !== checker.TraitState.Analyzed && trait.state !== checker.TraitState.Resolved) {
                    // Skip traits that haven't been analyzed successfully.
                    continue;
                }
                else if (trait.handler.xi18n === undefined) {
                    // Skip traits that don't support xi18n.
                    continue;
                }
                if (trait.analysis !== null) {
                    trait.handler.xi18n(bundle, clazz, trait.analysis);
                }
            }
        }
    }
    updateResources(clazz) {
        // Local compilation does not support incremental
        if (this.compilationMode === checker.CompilationMode.LOCAL ||
            !this.reflector.isClass(clazz) ||
            !this.classes.has(clazz)) {
            return;
        }
        const record = this.classes.get(clazz);
        for (const trait of record.traits) {
            if (trait.state !== checker.TraitState.Resolved || trait.handler.updateResources === undefined) {
                continue;
            }
            trait.handler.updateResources(clazz, trait.analysis, trait.resolution);
        }
    }
    compile(clazz, constantPool) {
        const original = ts.getOriginalNode(clazz);
        if (!this.reflector.isClass(clazz) ||
            !this.reflector.isClass(original) ||
            !this.classes.has(original)) {
            return null;
        }
        const record = this.classes.get(original);
        let res = [];
        for (const trait of record.traits) {
            let compileRes;
            if (trait.state !== checker.TraitState.Resolved ||
                containsErrors(trait.analysisDiagnostics) ||
                containsErrors(trait.resolveDiagnostics)) {
                // Cannot compile a trait that is not resolved, or had any errors in its declaration.
                continue;
            }
            if (this.compilationMode === checker.CompilationMode.LOCAL) {
                // `trait.analysis` is non-null asserted here because TypeScript does not recognize that
                // `Readonly<unknown>` is nullable (as `unknown` itself is nullable) due to the way that
                // `Readonly` works.
                compileRes = trait.handler.compileLocal(clazz, trait.analysis, trait.resolution, constantPool);
            }
            else {
                // `trait.resolution` is non-null asserted below because TypeScript does not recognize that
                // `Readonly<unknown>` is nullable (as `unknown` itself is nullable) due to the way that
                // `Readonly` works.
                if (this.compilationMode === checker.CompilationMode.PARTIAL &&
                    trait.handler.compilePartial !== undefined) {
                    compileRes = trait.handler.compilePartial(clazz, trait.analysis, trait.resolution);
                }
                else {
                    compileRes = trait.handler.compileFull(clazz, trait.analysis, trait.resolution, constantPool);
                }
            }
            const compileMatchRes = compileRes;
            if (Array.isArray(compileMatchRes)) {
                for (const result of compileMatchRes) {
                    if (!res.some((r) => r.name === result.name)) {
                        res.push(result);
                    }
                }
            }
            else if (!res.some((result) => result.name === compileMatchRes.name)) {
                res.push(compileMatchRes);
            }
        }
        // Look up the .d.ts transformer for the input file and record that at least one field was
        // generated, which will allow the .d.ts to be transformed later.
        this.dtsTransforms
            .getIvyDeclarationTransform(original.getSourceFile())
            .addFields(original, res);
        // Return the instruction to the transformer so the fields will be added.
        return res.length > 0 ? res : null;
    }
    compileHmrUpdateCallback(clazz) {
        const original = ts.getOriginalNode(clazz);
        if (!this.reflector.isClass(clazz) ||
            !this.reflector.isClass(original) ||
            !this.classes.has(original)) {
            return null;
        }
        const record = this.classes.get(original);
        for (const trait of record.traits) {
            // Cannot compile a trait that is not resolved, or had any errors in its declaration.
            if (trait.state === checker.TraitState.Resolved &&
                trait.handler.compileHmrUpdateDeclaration !== undefined &&
                !containsErrors(trait.analysisDiagnostics) &&
                !containsErrors(trait.resolveDiagnostics)) {
                return trait.handler.compileHmrUpdateDeclaration(clazz, trait.analysis, trait.resolution);
            }
        }
        return null;
    }
    decoratorsFor(node) {
        const original = ts.getOriginalNode(node);
        if (!this.reflector.isClass(original) || !this.classes.has(original)) {
            return [];
        }
        const record = this.classes.get(original);
        const decorators = [];
        for (const trait of record.traits) {
            // In global compilation mode skip the non-resolved traits.
            if (this.compilationMode !== checker.CompilationMode.LOCAL && trait.state !== checker.TraitState.Resolved) {
                continue;
            }
            if (trait.detected.trigger !== null && ts.isDecorator(trait.detected.trigger)) {
                decorators.push(trait.detected.trigger);
            }
        }
        return decorators;
    }
    get diagnostics() {
        const diagnostics = [];
        for (const clazz of this.classes.keys()) {
            const record = this.classes.get(clazz);
            if (record.metaDiagnostics !== null) {
                diagnostics.push(...record.metaDiagnostics);
            }
            for (const trait of record.traits) {
                if ((trait.state === checker.TraitState.Analyzed || trait.state === checker.TraitState.Resolved) &&
                    trait.analysisDiagnostics !== null) {
                    diagnostics.push(...trait.analysisDiagnostics);
                }
                if (trait.state === checker.TraitState.Resolved) {
                    diagnostics.push(...(trait.resolveDiagnostics ?? []));
                }
            }
        }
        return diagnostics;
    }
    get exportStatements() {
        return this.reexportMap;
    }
}
function containsErrors(diagnostics) {
    return (diagnostics !== null &&
        diagnostics.some((diag) => diag.category === ts.DiagnosticCategory.Error));
}

/**
 * Keeps track of `DtsTransform`s per source file, so that it is known which source files need to
 * have their declaration file transformed.
 */
class DtsTransformRegistry {
    ivyDeclarationTransforms = new Map();
    getIvyDeclarationTransform(sf) {
        if (!this.ivyDeclarationTransforms.has(sf)) {
            this.ivyDeclarationTransforms.set(sf, new IvyDeclarationDtsTransform());
        }
        return this.ivyDeclarationTransforms.get(sf);
    }
    /**
     * Gets the dts transforms to be applied for the given source file, or `null` if no transform is
     * necessary.
     */
    getAllTransforms(sf) {
        // No need to transform if it's not a declarations file, or if no changes have been requested
        // to the input file. Due to the way TypeScript afterDeclarations transformers work, the
        // `ts.SourceFile` path is the same as the original .ts. The only way we know it's actually a
        // declaration file is via the `isDeclarationFile` property.
        if (!sf.isDeclarationFile) {
            return null;
        }
        const originalSf = ts.getOriginalNode(sf);
        let transforms = null;
        if (this.ivyDeclarationTransforms.has(originalSf)) {
            transforms = [];
            transforms.push(this.ivyDeclarationTransforms.get(originalSf));
        }
        return transforms;
    }
}
function declarationTransformFactory(transformRegistry, reflector, refEmitter, importRewriter) {
    return (context) => {
        const transformer = new DtsTransformer(context, reflector, refEmitter, importRewriter);
        return (fileOrBundle) => {
            if (ts.isBundle(fileOrBundle)) {
                // Only attempt to transform source files.
                return fileOrBundle;
            }
            const transforms = transformRegistry.getAllTransforms(fileOrBundle);
            if (transforms === null) {
                return fileOrBundle;
            }
            return transformer.transform(fileOrBundle, transforms);
        };
    };
}
/**
 * Processes .d.ts file text and adds static field declarations, with types.
 */
class DtsTransformer {
    ctx;
    reflector;
    refEmitter;
    importRewriter;
    constructor(ctx, reflector, refEmitter, importRewriter) {
        this.ctx = ctx;
        this.reflector = reflector;
        this.refEmitter = refEmitter;
        this.importRewriter = importRewriter;
    }
    /**
     * Transform the declaration file and add any declarations which were recorded.
     */
    transform(sf, transforms) {
        const imports = new checker.ImportManager({
            ...checker.presetImportManagerForceNamespaceImports,
            rewriter: this.importRewriter,
        });
        const visitor = (node) => {
            if (ts.isClassDeclaration(node)) {
                return this.transformClassDeclaration(node, transforms, imports);
            }
            else if (ts.isFunctionDeclaration(node)) {
                return this.transformFunctionDeclaration(node, transforms, imports);
            }
            else {
                // Otherwise return node as is.
                return ts.visitEachChild(node, visitor, this.ctx);
            }
        };
        // Recursively scan through the AST and process all nodes as desired.
        sf = ts.visitNode(sf, visitor, ts.isSourceFile) || sf;
        // Update/insert needed imports.
        return imports.transformTsFile(this.ctx, sf);
    }
    transformClassDeclaration(clazz, transforms, imports) {
        let elements = clazz.members;
        let elementsChanged = false;
        for (const transform of transforms) {
            if (transform.transformClassElement !== undefined) {
                for (let i = 0; i < elements.length; i++) {
                    const res = transform.transformClassElement(elements[i], imports);
                    if (res !== elements[i]) {
                        if (!elementsChanged) {
                            elements = [...elements];
                            elementsChanged = true;
                        }
                        elements[i] = res;
                    }
                }
            }
        }
        let newClazz = clazz;
        for (const transform of transforms) {
            if (transform.transformClass !== undefined) {
                // If no DtsTransform has changed the class yet, then the (possibly mutated) elements have
                // not yet been incorporated. Otherwise, `newClazz.members` holds the latest class members.
                const inputMembers = clazz === newClazz ? elements : newClazz.members;
                newClazz = transform.transformClass(newClazz, inputMembers, this.reflector, this.refEmitter, imports);
            }
        }
        // If some elements have been transformed but the class itself has not been transformed, create
        // an updated class declaration with the updated elements.
        if (elementsChanged && clazz === newClazz) {
            newClazz = ts.factory.updateClassDeclaration(
            /* node */ clazz, 
            /* modifiers */ clazz.modifiers, 
            /* name */ clazz.name, 
            /* typeParameters */ clazz.typeParameters, 
            /* heritageClauses */ clazz.heritageClauses, 
            /* members */ elements);
        }
        return newClazz;
    }
    transformFunctionDeclaration(declaration, transforms, imports) {
        let newDecl = declaration;
        for (const transform of transforms) {
            if (transform.transformFunctionDeclaration !== undefined) {
                newDecl = transform.transformFunctionDeclaration(newDecl, imports);
            }
        }
        return newDecl;
    }
}
class IvyDeclarationDtsTransform {
    declarationFields = new Map();
    addFields(decl, fields) {
        this.declarationFields.set(decl, fields);
    }
    transformClass(clazz, members, reflector, refEmitter, imports) {
        const original = ts.getOriginalNode(clazz);
        if (!this.declarationFields.has(original)) {
            return clazz;
        }
        const fields = this.declarationFields.get(original);
        const newMembers = fields.map((decl) => {
            const modifiers = [ts.factory.createModifier(ts.SyntaxKind.StaticKeyword)];
            const typeRef = checker.translateType(decl.type, original.getSourceFile(), reflector, refEmitter, imports);
            markForEmitAsSingleLine(typeRef);
            return ts.factory.createPropertyDeclaration(
            /* modifiers */ modifiers, 
            /* name */ decl.name, 
            /* questionOrExclamationToken */ undefined, 
            /* type */ typeRef, 
            /* initializer */ undefined);
        });
        return ts.factory.updateClassDeclaration(
        /* node */ clazz, 
        /* modifiers */ clazz.modifiers, 
        /* name */ clazz.name, 
        /* typeParameters */ clazz.typeParameters, 
        /* heritageClauses */ clazz.heritageClauses, 
        /* members */ [...members, ...newMembers]);
    }
}
function markForEmitAsSingleLine(node) {
    ts.setEmitFlags(node, ts.EmitFlags.SingleLine);
    ts.forEachChild(node, markForEmitAsSingleLine);
}

/**
 * Visit a node with the given visitor and return a transformed copy.
 */
function visit(node, visitor, context) {
    return visitor._visit(node, context);
}
/**
 * Abstract base class for visitors, which processes certain nodes specially to allow insertion
 * of other nodes before them.
 */
class Visitor {
    /**
     * Maps statements to an array of statements that should be inserted before them.
     */
    _before = new Map();
    /**
     * Maps statements to an array of statements that should be inserted after them.
     */
    _after = new Map();
    _visitListEntryNode(node, visitor) {
        const result = visitor(node);
        if (result.before !== undefined) {
            // Record that some nodes should be inserted before the given declaration. The declaration's
            // parent's _visit call is responsible for performing this insertion.
            this._before.set(result.node, result.before);
        }
        if (result.after !== undefined) {
            // Same with nodes that should be inserted after.
            this._after.set(result.node, result.after);
        }
        return result.node;
    }
    /**
     * Visit types of nodes which don't have their own explicit visitor.
     */
    visitOtherNode(node) {
        return node;
    }
    /**
     * @internal
     */
    _visit(node, context) {
        // First, visit the node. visitedNode starts off as `null` but should be set after visiting
        // is completed.
        let visitedNode = null;
        node = ts.visitEachChild(node, (child) => child && this._visit(child, context), context);
        if (ts.isClassDeclaration(node)) {
            visitedNode = this._visitListEntryNode(node, (node) => this.visitClassDeclaration(node));
        }
        else {
            visitedNode = this.visitOtherNode(node);
        }
        // If the visited node has a `statements` array then process them, maybe replacing the visited
        // node and adding additional statements.
        if (visitedNode && (ts.isBlock(visitedNode) || ts.isSourceFile(visitedNode))) {
            visitedNode = this._maybeProcessStatements(visitedNode);
        }
        return visitedNode;
    }
    _maybeProcessStatements(node) {
        // Shortcut - if every statement doesn't require nodes to be prepended or appended,
        // this is a no-op.
        if (node.statements.every((stmt) => !this._before.has(stmt) && !this._after.has(stmt))) {
            return node;
        }
        // Build a new list of statements and patch it onto the clone.
        const newStatements = [];
        node.statements.forEach((stmt) => {
            if (this._before.has(stmt)) {
                newStatements.push(...this._before.get(stmt));
                this._before.delete(stmt);
            }
            newStatements.push(stmt);
            if (this._after.has(stmt)) {
                newStatements.push(...this._after.get(stmt));
                this._after.delete(stmt);
            }
        });
        const statementsArray = ts.factory.createNodeArray(newStatements, node.statements.hasTrailingComma);
        if (ts.isBlock(node)) {
            return ts.factory.updateBlock(node, statementsArray);
        }
        else {
            return ts.factory.updateSourceFile(node, statementsArray, node.isDeclarationFile, node.referencedFiles, node.typeReferenceDirectives, node.hasNoDefaultLib, node.libReferenceDirectives);
        }
    }
}

const NO_DECORATORS = new Set();
const CLOSURE_FILE_OVERVIEW_REGEXP = /\s+@fileoverview\s+/i;
function ivyTransformFactory(compilation, reflector, importRewriter, defaultImportTracker, localCompilationExtraImportsTracker, perf, isCore, isClosureCompilerEnabled) {
    const recordWrappedNode = createRecorderFn(defaultImportTracker);
    return (context) => {
        return (file) => {
            return perf.inPhase(checker.PerfPhase.Compile, () => transformIvySourceFile(compilation, context, reflector, importRewriter, localCompilationExtraImportsTracker, file, isCore, isClosureCompilerEnabled, recordWrappedNode));
        };
    };
}
/**
 * Visits all classes, performs Ivy compilation where Angular decorators are present and collects
 * result in a Map that associates a ts.ClassDeclaration with Ivy compilation results. This visitor
 * does NOT perform any TS transformations.
 */
class IvyCompilationVisitor extends Visitor {
    compilation;
    constantPool;
    classCompilationMap = new Map();
    deferrableImports = new Set();
    constructor(compilation, constantPool) {
        super();
        this.compilation = compilation;
        this.constantPool = constantPool;
    }
    visitClassDeclaration(node) {
        // Determine if this class has an Ivy field that needs to be added, and compile the field
        // to an expression if so.
        const result = this.compilation.compile(node, this.constantPool);
        if (result !== null) {
            this.classCompilationMap.set(node, result);
            // Collect all deferrable imports declarations into a single set,
            // so that we can pass it to the transform visitor that will drop
            // corresponding regular import declarations.
            for (const classResult of result) {
                if (classResult.deferrableImports !== null && classResult.deferrableImports.size > 0) {
                    classResult.deferrableImports.forEach((importDecl) => this.deferrableImports.add(importDecl));
                }
            }
        }
        return { node };
    }
}
/**
 * Visits all classes and performs transformation of corresponding TS nodes based on the Ivy
 * compilation results (provided as an argument).
 */
class IvyTransformationVisitor extends Visitor {
    compilation;
    classCompilationMap;
    reflector;
    importManager;
    recordWrappedNodeExpr;
    isClosureCompilerEnabled;
    isCore;
    deferrableImports;
    constructor(compilation, classCompilationMap, reflector, importManager, recordWrappedNodeExpr, isClosureCompilerEnabled, isCore, deferrableImports) {
        super();
        this.compilation = compilation;
        this.classCompilationMap = classCompilationMap;
        this.reflector = reflector;
        this.importManager = importManager;
        this.recordWrappedNodeExpr = recordWrappedNodeExpr;
        this.isClosureCompilerEnabled = isClosureCompilerEnabled;
        this.isCore = isCore;
        this.deferrableImports = deferrableImports;
    }
    visitClassDeclaration(node) {
        // If this class is not registered in the map, it means that it doesn't have Angular decorators,
        // thus no further processing is required.
        if (!this.classCompilationMap.has(node)) {
            return { node };
        }
        const translateOptions = {
            recordWrappedNode: this.recordWrappedNodeExpr,
            annotateForClosureCompiler: this.isClosureCompilerEnabled,
        };
        // There is at least one field to add.
        const statements = [];
        const members = [...node.members];
        // Note: Class may be already transformed by e.g. Tsickle and
        // not have a direct reference to the source file.
        const sourceFile = ts.getOriginalNode(node).getSourceFile();
        for (const field of this.classCompilationMap.get(node)) {
            // Type-only member.
            if (field.initializer === null) {
                continue;
            }
            // Translate the initializer for the field into TS nodes.
            const exprNode = checker.translateExpression(sourceFile, field.initializer, this.importManager, translateOptions);
            // Create a static property declaration for the new field.
            const property = ts.factory.createPropertyDeclaration([ts.factory.createToken(ts.SyntaxKind.StaticKeyword)], field.name, undefined, undefined, exprNode);
            if (this.isClosureCompilerEnabled) {
                // Closure compiler transforms the form `Service.ɵprov = X` into `Service$ɵprov = X`. To
                // prevent this transformation, such assignments need to be annotated with @nocollapse.
                // Note that tsickle is typically responsible for adding such annotations, however it
                // doesn't yet handle synthetic fields added during other transformations.
                ts.addSyntheticLeadingComment(property, ts.SyntaxKind.MultiLineCommentTrivia, '* @nocollapse ', 
                /* hasTrailingNewLine */ false);
            }
            field.statements
                .map((stmt) => checker.translateStatement(sourceFile, stmt, this.importManager, translateOptions))
                .forEach((stmt) => statements.push(stmt));
            members.push(property);
        }
        const filteredDecorators = 
        // Remove the decorator which triggered this compilation, leaving the others alone.
        maybeFilterDecorator(ts.getDecorators(node), this.compilation.decoratorsFor(node));
        const nodeModifiers = ts.getModifiers(node);
        let updatedModifiers;
        if (filteredDecorators?.length || nodeModifiers?.length) {
            updatedModifiers = [...(filteredDecorators || []), ...(nodeModifiers || [])];
        }
        // Replace the class declaration with an updated version.
        node = ts.factory.updateClassDeclaration(node, updatedModifiers, node.name, node.typeParameters, node.heritageClauses || [], 
        // Map over the class members and remove any Angular decorators from them.
        members.map((member) => this._stripAngularDecorators(member)));
        return { node, after: statements };
    }
    visitOtherNode(node) {
        if (ts.isImportDeclaration(node) && this.deferrableImports.has(node)) {
            // Return `null` as an indication that this node should not be present
            // in the final AST. Symbols from this import would be imported via
            // dynamic imports.
            return null;
        }
        return node;
    }
    /**
     * Return all decorators on a `Declaration` which are from @angular/core, or an empty set if none
     * are.
     */
    _angularCoreDecorators(decl) {
        const decorators = this.reflector.getDecoratorsOfDeclaration(decl);
        if (decorators === null) {
            return NO_DECORATORS;
        }
        const coreDecorators = decorators
            .filter((dec) => this.isCore || isFromAngularCore(dec))
            .map((dec) => dec.node);
        if (coreDecorators.length > 0) {
            return new Set(coreDecorators);
        }
        else {
            return NO_DECORATORS;
        }
    }
    _nonCoreDecoratorsOnly(node) {
        const decorators = ts.getDecorators(node);
        // Shortcut if the node has no decorators.
        if (decorators === undefined) {
            return undefined;
        }
        // Build a Set of the decorators on this node from @angular/core.
        const coreDecorators = this._angularCoreDecorators(node);
        if (coreDecorators.size === decorators.length) {
            // If all decorators are to be removed, return `undefined`.
            return undefined;
        }
        else if (coreDecorators.size === 0) {
            // If no decorators need to be removed, return the original decorators array.
            return nodeArrayFromDecoratorsArray(decorators);
        }
        // Filter out the core decorators.
        const filtered = decorators.filter((dec) => !coreDecorators.has(dec));
        // If no decorators survive, return `undefined`. This can only happen if a core decorator is
        // repeated on the node.
        if (filtered.length === 0) {
            return undefined;
        }
        // Create a new `NodeArray` with the filtered decorators that sourcemaps back to the original.
        return nodeArrayFromDecoratorsArray(filtered);
    }
    /**
     * Remove Angular decorators from a `ts.Node` in a shallow manner.
     *
     * This will remove decorators from class elements (getters, setters, properties, methods) as well
     * as parameters of constructors.
     */
    _stripAngularDecorators(node) {
        const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
        const nonCoreDecorators = ts.canHaveDecorators(node)
            ? this._nonCoreDecoratorsOnly(node)
            : undefined;
        const combinedModifiers = [...(nonCoreDecorators || []), ...(modifiers || [])];
        if (ts.isParameter(node)) {
            // Strip decorators from parameters (probably of the constructor).
            node = ts.factory.updateParameterDeclaration(node, combinedModifiers, node.dotDotDotToken, node.name, node.questionToken, node.type, node.initializer);
        }
        else if (ts.isMethodDeclaration(node)) {
            // Strip decorators of methods.
            node = ts.factory.updateMethodDeclaration(node, combinedModifiers, node.asteriskToken, node.name, node.questionToken, node.typeParameters, node.parameters, node.type, node.body);
        }
        else if (ts.isPropertyDeclaration(node)) {
            // Strip decorators of properties.
            node = ts.factory.updatePropertyDeclaration(node, combinedModifiers, node.name, node.questionToken, node.type, node.initializer);
        }
        else if (ts.isGetAccessor(node)) {
            // Strip decorators of getters.
            node = ts.factory.updateGetAccessorDeclaration(node, combinedModifiers, node.name, node.parameters, node.type, node.body);
        }
        else if (ts.isSetAccessor(node)) {
            // Strip decorators of setters.
            node = ts.factory.updateSetAccessorDeclaration(node, combinedModifiers, node.name, node.parameters, node.body);
        }
        else if (ts.isConstructorDeclaration(node)) {
            // For constructors, strip decorators of the parameters.
            const parameters = node.parameters.map((param) => this._stripAngularDecorators(param));
            node = ts.factory.updateConstructorDeclaration(node, modifiers, parameters, node.body);
        }
        return node;
    }
}
/**
 * A transformer which operates on ts.SourceFiles and applies changes from an `IvyCompilation`.
 */
function transformIvySourceFile(compilation, context, reflector, importRewriter, localCompilationExtraImportsTracker, file, isCore, isClosureCompilerEnabled, recordWrappedNode) {
    const constantPool = new compiler.ConstantPool(isClosureCompilerEnabled);
    const importManager = new checker.ImportManager({
        ...checker.presetImportManagerForceNamespaceImports,
        rewriter: importRewriter,
    });
    // The transformation process consists of 2 steps:
    //
    //  1. Visit all classes, perform compilation and collect the results.
    //  2. Perform actual transformation of required TS nodes using compilation results from the first
    //     step.
    //
    // This is needed to have all `o.Expression`s generated before any TS transforms happen. This
    // allows `ConstantPool` to properly identify expressions that can be shared across multiple
    // components declared in the same file.
    // Step 1. Go though all classes in AST, perform compilation and collect the results.
    const compilationVisitor = new IvyCompilationVisitor(compilation, constantPool);
    visit(file, compilationVisitor, context);
    // Step 2. Scan through the AST again and perform transformations based on Ivy compilation
    // results obtained at Step 1.
    const transformationVisitor = new IvyTransformationVisitor(compilation, compilationVisitor.classCompilationMap, reflector, importManager, recordWrappedNode, isClosureCompilerEnabled, isCore, compilationVisitor.deferrableImports);
    let sf = visit(file, transformationVisitor, context);
    // Generate the constant statements first, as they may involve adding additional imports
    // to the ImportManager.
    const downlevelTranslatedCode = getLocalizeCompileTarget(context) < ts.ScriptTarget.ES2015;
    const constants = constantPool.statements.map((stmt) => checker.translateStatement(file, stmt, importManager, {
        recordWrappedNode,
        downlevelTaggedTemplates: downlevelTranslatedCode,
        downlevelVariableDeclarations: downlevelTranslatedCode,
        annotateForClosureCompiler: isClosureCompilerEnabled,
    }));
    // Preserve @fileoverview comments required by Closure, since the location might change as a
    // result of adding extra imports and constant pool statements.
    const fileOverviewMeta = isClosureCompilerEnabled ? getFileOverviewComment(sf.statements) : null;
    // Add extra imports.
    if (localCompilationExtraImportsTracker !== null) {
        for (const moduleName of localCompilationExtraImportsTracker.getImportsForFile(sf)) {
            importManager.addSideEffectImport(sf, moduleName);
        }
    }
    // Add new imports for this file.
    sf = importManager.transformTsFile(context, sf, constants);
    if (fileOverviewMeta !== null) {
        sf = insertFileOverviewComment(sf, fileOverviewMeta);
    }
    return sf;
}
/**
 * Compute the correct target output for `$localize` messages generated by Angular
 *
 * In some versions of TypeScript, the transformation of synthetic `$localize` tagged template
 * literals is broken. See https://github.com/microsoft/TypeScript/issues/38485
 *
 * Here we compute what the expected final output target of the compilation will
 * be so that we can generate ES5 compliant `$localize` calls instead of relying upon TS to do the
 * downleveling for us.
 */
function getLocalizeCompileTarget(context) {
    const target = context.getCompilerOptions().target || ts.ScriptTarget.ES2015;
    return target !== ts.ScriptTarget.JSON ? target : ts.ScriptTarget.ES2015;
}
function getFileOverviewComment(statements) {
    if (statements.length > 0) {
        const host = statements[0];
        let trailing = false;
        let comments = ts.getSyntheticLeadingComments(host);
        // If @fileoverview tag is not found in source file, tsickle produces fake node with trailing
        // comment and inject it at the very beginning of the generated file. So we need to check for
        // leading as well as trailing comments.
        if (!comments || comments.length === 0) {
            trailing = true;
            comments = ts.getSyntheticTrailingComments(host);
        }
        if (comments && comments.length > 0 && CLOSURE_FILE_OVERVIEW_REGEXP.test(comments[0].text)) {
            return { comments, host, trailing };
        }
    }
    return null;
}
function insertFileOverviewComment(sf, fileoverview) {
    const { comments, host, trailing } = fileoverview;
    // If host statement is no longer the first one, it means that extra statements were added at the
    // very beginning, so we need to relocate @fileoverview comment and cleanup the original statement
    // that hosted it.
    if (sf.statements.length > 0 && host !== sf.statements[0]) {
        if (trailing) {
            ts.setSyntheticTrailingComments(host, undefined);
        }
        else {
            ts.setSyntheticLeadingComments(host, undefined);
        }
        // Note: Do not use the first statement as it may be elided at runtime.
        // E.g. an import declaration that is type only.
        const commentNode = ts.factory.createNotEmittedStatement(sf);
        ts.setSyntheticLeadingComments(commentNode, comments);
        return ts.factory.updateSourceFile(sf, [commentNode, ...sf.statements], sf.isDeclarationFile, sf.referencedFiles, sf.typeReferenceDirectives, sf.hasNoDefaultLib, sf.libReferenceDirectives);
    }
    return sf;
}
function maybeFilterDecorator(decorators, toRemove) {
    if (decorators === undefined) {
        return undefined;
    }
    const filtered = decorators.filter((dec) => toRemove.find((decToRemove) => ts.getOriginalNode(dec) === decToRemove) === undefined);
    if (filtered.length === 0) {
        return undefined;
    }
    return ts.factory.createNodeArray(filtered);
}
function isFromAngularCore(decorator) {
    return decorator.import !== null && decorator.import.from === '@angular/core';
}
function createRecorderFn(defaultImportTracker) {
    return (node) => {
        const importDecl = checker.getDefaultImportDeclaration(node);
        if (importDecl !== null) {
            defaultImportTracker.recordUsedImport(importDecl);
        }
    };
}
/** Creates a `NodeArray` with the correct offsets from an array of decorators. */
function nodeArrayFromDecoratorsArray(decorators) {
    const array = ts.factory.createNodeArray(decorators);
    if (array.length > 0) {
        array.pos = decorators[0].pos;
        array.end = decorators[decorators.length - 1].end;
    }
    return array;
}

function resolveEnumValue(evaluator, metadata, field, enumSymbolName, isCore) {
    let resolved = null;
    if (metadata.has(field)) {
        const expr = metadata.get(field);
        const value = evaluator.evaluate(expr);
        if (value instanceof checker.EnumValue &&
            checker.isAngularCoreReferenceWithPotentialAliasing(value.enumRef, enumSymbolName, isCore)) {
            resolved = value.resolved;
        }
        else {
            throw checker.createValueHasWrongTypeError(expr, value, `${field} must be a member of ${enumSymbolName} enum from @angular/core`);
        }
    }
    return resolved;
}
/**
 * Resolves a EncapsulationEnum expression locally on best effort without having to calculate the
 * reference. This suites local compilation mode where each file is compiled individually.
 *
 * The static analysis is still needed in local compilation mode since the value of this enum will
 * be used later to decide the generated code for styles.
 */
function resolveEncapsulationEnumValueLocally(expr) {
    if (!expr) {
        return null;
    }
    const exprText = expr.getText().trim();
    for (const key in compiler.ViewEncapsulation) {
        if (!Number.isNaN(Number(key))) {
            continue;
        }
        const suffix = `ViewEncapsulation.${key}`;
        // Check whether the enum is imported by name or used by import namespace (e.g.,
        // core.ViewEncapsulation.None)
        if (exprText === suffix || exprText.endsWith(`.${suffix}`)) {
            const ans = Number(compiler.ViewEncapsulation[key]);
            return ans;
        }
    }
    return null;
}
/** Determines if the result of an evaluation is a string array. */
function isStringArray(resolvedValue) {
    return Array.isArray(resolvedValue) && resolvedValue.every((elem) => typeof elem === 'string');
}
function resolveLiteral(decorator, literalCache) {
    if (literalCache.has(decorator)) {
        return literalCache.get(decorator);
    }
    if (decorator.args === null || decorator.args.length !== 1) {
        throw new checker.FatalDiagnosticError(checker.ErrorCode.DECORATOR_ARITY_WRONG, decorator.node, `Incorrect number of arguments to @${decorator.name} decorator`);
    }
    const meta = checker.unwrapExpression(decorator.args[0]);
    if (!ts.isObjectLiteralExpression(meta)) {
        throw new checker.FatalDiagnosticError(checker.ErrorCode.DECORATOR_ARG_NOT_LITERAL, meta, `Decorator argument must be literal.`);
    }
    literalCache.set(decorator, meta);
    return meta;
}

function compileNgFactoryDefField(metadata) {
    const res = compiler.compileFactoryFunction(metadata);
    return {
        name: 'ɵfac',
        initializer: res.expression,
        statements: res.statements,
        type: res.type,
        deferrableImports: null,
    };
}
function compileDeclareFactory(metadata) {
    const res = compileDeclareFactoryFunction(metadata);
    return {
        name: 'ɵfac',
        initializer: res.expression,
        statements: res.statements,
        type: res.type,
        deferrableImports: null,
    };
}

/**
 * Registry that keeps track of classes that can be constructed via dependency injection (e.g.
 * injectables, directives, pipes).
 */
class InjectableClassRegistry {
    host;
    isCore;
    classes = new Map();
    constructor(host, isCore) {
        this.host = host;
        this.isCore = isCore;
    }
    registerInjectable(declaration, meta) {
        this.classes.set(declaration, meta);
    }
    getInjectableMeta(declaration) {
        // Figure out whether the class is injectable based on the registered classes, otherwise
        // fall back to looking at its members since we might not have been able to register the class
        // if it was compiled in another compilation unit.
        if (this.classes.has(declaration)) {
            return this.classes.get(declaration);
        }
        if (!checker.hasInjectableFields(declaration, this.host)) {
            return null;
        }
        const ctorDeps = checker.getConstructorDependencies(declaration, this.host, this.isCore);
        const meta = {
            ctorDeps: checker.unwrapConstructorDependencies(ctorDeps),
        };
        this.classes.set(declaration, meta);
        return meta;
    }
}

/**
 * Given a class declaration, generate a call to `setClassMetadata` with the Angular metadata
 * present on the class or its member fields. An ngDevMode guard is used to allow the call to be
 * tree-shaken away, as the `setClassMetadata` invocation is only needed for testing purposes.
 *
 * If no such metadata is present, this function returns `null`. Otherwise, the call is returned
 * as a `Statement` for inclusion along with the class.
 */
function extractClassMetadata(clazz, reflection, isCore, annotateForClosureCompiler, angularDecoratorTransform = (dec) => dec) {
    if (!reflection.isClass(clazz)) {
        return null;
    }
    const id = clazz.name;
    // Reflect over the class decorators. If none are present, or those that are aren't from
    // Angular, then return null. Otherwise, turn them into metadata.
    const classDecorators = reflection.getDecoratorsOfDeclaration(clazz);
    if (classDecorators === null) {
        return null;
    }
    const ngClassDecorators = classDecorators
        .filter((dec) => isAngularDecorator$1(dec, isCore))
        .map((decorator) => decoratorToMetadata(angularDecoratorTransform(decorator), annotateForClosureCompiler))
        // Since the `setClassMetadata` call is intended to be emitted after the class
        // declaration, we have to strip references to the existing identifiers or
        // TypeScript might generate invalid code when it emits to JS. In particular
        // this can break when emitting a class to ES5 which has a custom decorator
        // and is referenced inside of its own metadata (see #39509 for more information).
        .map((decorator) => removeIdentifierReferences(decorator, id.text));
    if (ngClassDecorators.length === 0) {
        return null;
    }
    const metaDecorators = new compiler.WrappedNodeExpr(ts.factory.createArrayLiteralExpression(ngClassDecorators));
    // Convert the constructor parameters to metadata, passing null if none are present.
    let metaCtorParameters = null;
    const classCtorParameters = reflection.getConstructorParameters(clazz);
    if (classCtorParameters !== null) {
        const ctorParameters = classCtorParameters.map((param) => ctorParameterToMetadata(param, isCore));
        metaCtorParameters = new compiler.ArrowFunctionExpr([], new compiler.LiteralArrayExpr(ctorParameters));
    }
    // Do the same for property decorators.
    let metaPropDecorators = null;
    const classMembers = reflection
        .getMembersOfClass(clazz)
        .filter((member) => !member.isStatic && member.decorators !== null && member.decorators.length > 0);
    const duplicateDecoratedMembers = classMembers.filter((member, i, arr) => arr.findIndex((arrayMember) => arrayMember.name === member.name) < i);
    if (duplicateDecoratedMembers.length > 0) {
        // This should theoretically never happen, because the only way to have duplicate instance
        // member names is getter/setter pairs and decorators cannot appear in both a getter and the
        // corresponding setter.
        throw new checker.FatalDiagnosticError(checker.ErrorCode.DUPLICATE_DECORATED_PROPERTIES, duplicateDecoratedMembers[0].nameNode ?? clazz, `Duplicate decorated properties found on class '${clazz.name.text}': ` +
            duplicateDecoratedMembers.map((member) => member.name).join(', '));
    }
    const decoratedMembers = classMembers.map((member) => classMemberToMetadata(member.nameNode ?? member.name, member.decorators, isCore));
    if (decoratedMembers.length > 0) {
        metaPropDecorators = new compiler.WrappedNodeExpr(ts.factory.createObjectLiteralExpression(decoratedMembers));
    }
    return {
        type: new compiler.WrappedNodeExpr(id),
        decorators: metaDecorators,
        ctorParameters: metaCtorParameters,
        propDecorators: metaPropDecorators,
    };
}
/**
 * Convert a reflected constructor parameter to metadata.
 */
function ctorParameterToMetadata(param, isCore) {
    // Parameters sometimes have a type that can be referenced. If so, then use it, otherwise
    // its type is undefined.
    const type = param.typeValueReference.kind !== 2 /* TypeValueReferenceKind.UNAVAILABLE */
        ? checker.valueReferenceToExpression(param.typeValueReference)
        : new compiler.LiteralExpr(undefined);
    const mapEntries = [
        { key: 'type', value: type, quoted: false },
    ];
    // If the parameter has decorators, include the ones from Angular.
    if (param.decorators !== null) {
        const ngDecorators = param.decorators
            .filter((dec) => isAngularDecorator$1(dec, isCore))
            .map((decorator) => decoratorToMetadata(decorator));
        const value = new compiler.WrappedNodeExpr(ts.factory.createArrayLiteralExpression(ngDecorators));
        mapEntries.push({ key: 'decorators', value, quoted: false });
    }
    return compiler.literalMap(mapEntries);
}
/**
 * Convert a reflected class member to metadata.
 */
function classMemberToMetadata(name, decorators, isCore) {
    const ngDecorators = decorators
        .filter((dec) => isAngularDecorator$1(dec, isCore))
        .map((decorator) => decoratorToMetadata(decorator));
    const decoratorMeta = ts.factory.createArrayLiteralExpression(ngDecorators);
    return ts.factory.createPropertyAssignment(name, decoratorMeta);
}
/**
 * Convert a reflected decorator to metadata.
 */
function decoratorToMetadata(decorator, wrapFunctionsInParens) {
    if (decorator.identifier === null) {
        throw new Error('Illegal state: synthesized decorator cannot be emitted in class metadata.');
    }
    // Decorators have a type.
    const properties = [
        ts.factory.createPropertyAssignment('type', decorator.identifier),
    ];
    // Sometimes they have arguments.
    if (decorator.args !== null && decorator.args.length > 0) {
        const args = decorator.args.map((arg) => {
            return wrapFunctionsInParens ? checker.wrapFunctionExpressionsInParens(arg) : arg;
        });
        properties.push(ts.factory.createPropertyAssignment('args', ts.factory.createArrayLiteralExpression(args)));
    }
    return ts.factory.createObjectLiteralExpression(properties, true);
}
/**
 * Whether a given decorator should be treated as an Angular decorator.
 *
 * Either it's used in @angular/core, or it's imported from there.
 */
function isAngularDecorator$1(decorator, isCore) {
    return isCore || (decorator.import !== null && decorator.import.from === '@angular/core');
}
/**
 * Recursively recreates all of the `Identifier` descendant nodes with a particular name inside
 * of an AST node, thus removing any references to them. Useful if a particular node has to be
 * taken from one place any emitted to another one exactly as it has been written.
 */
function removeIdentifierReferences(node, names) {
    const result = ts.transform(node, [
        (context) => (root) => ts.visitNode(root, function walk(current) {
            return (ts.isIdentifier(current) &&
                (typeof names === 'string' ? current.text === names : names.has(current.text))
                ? ts.factory.createIdentifier(current.text)
                : ts.visitEachChild(current, walk, context));
        }),
    ]);
    return result.transformed[0];
}

function extractClassDebugInfo(clazz, reflection, compilerHost, rootDirs, forbidOrphanRendering) {
    if (!reflection.isClass(clazz)) {
        return null;
    }
    const srcFile = clazz.getSourceFile();
    const srcFileMaybeRelativePath = getProjectRelativePath(srcFile.fileName, rootDirs, compilerHost);
    return {
        type: new compiler.WrappedNodeExpr(clazz.name),
        className: compiler.literal(clazz.name.getText()),
        filePath: srcFileMaybeRelativePath ? compiler.literal(srcFileMaybeRelativePath) : null,
        lineNumber: compiler.literal(srcFile.getLineAndCharacterOfPosition(clazz.name.pos).line + 1),
        forbidOrphanRendering,
    };
}

/**
 * This registry does nothing.
 */
class NoopReferencesRegistry {
    add(source, ...references) { }
}

function extractSchemas(rawExpr, evaluator, context) {
    const schemas = [];
    const result = evaluator.evaluate(rawExpr);
    if (!Array.isArray(result)) {
        throw checker.createValueHasWrongTypeError(rawExpr, result, `${context}.schemas must be an array`);
    }
    for (const schemaRef of result) {
        if (!(schemaRef instanceof checker.Reference)) {
            throw checker.createValueHasWrongTypeError(rawExpr, result, `${context}.schemas must be an array of schemas`);
        }
        const id = schemaRef.getIdentityIn(schemaRef.node.getSourceFile());
        if (id === null || schemaRef.ownedByModuleGuess !== '@angular/core') {
            throw checker.createValueHasWrongTypeError(rawExpr, result, `${context}.schemas must be an array of schemas`);
        }
        // Since `id` is the `ts.Identifier` within the schema ref's declaration file, it's safe to
        // use `id.text` here to figure out which schema is in use. Even if the actual reference was
        // renamed when the user imported it, these names will match.
        switch (id.text) {
            case 'CUSTOM_ELEMENTS_SCHEMA':
                schemas.push(compiler.CUSTOM_ELEMENTS_SCHEMA);
                break;
            case 'NO_ERRORS_SCHEMA':
                schemas.push(compiler.NO_ERRORS_SCHEMA);
                break;
            default:
                throw checker.createValueHasWrongTypeError(rawExpr, schemaRef, `'${schemaRef.debugName}' is not a valid ${context} schema`);
        }
    }
    return schemas;
}

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
/** Generates additional fields to be added to a class that has inputs with transform functions. */
function compileInputTransformFields(inputs) {
    const extraFields = [];
    for (const input of inputs) {
        // Note: Signal inputs capture their transform `WriteT` as part of the `InputSignal`.
        // Such inputs will not have a `transform` captured and not generate coercion members.
        if (input.transform) {
            extraFields.push({
                name: `ngAcceptInputType_${input.classPropertyName}`,
                type: compiler.transplantedType(input.transform.type),
                statements: [],
                initializer: null,
                deferrableImports: null,
            });
        }
    }
    return extraFields;
}

/**
 * Registry that keeps track of Angular declarations that are explicitly
 * marked for JIT compilation and are skipping compilation by trait handlers.
 */
class JitDeclarationRegistry {
    jitDeclarations = new Set();
}

/**
 * Represents a symbol that is recognizable across incremental rebuilds, which enables the captured
 * metadata to be compared to the prior compilation. This allows for semantic understanding of
 * the changes that have been made in a rebuild, which potentially enables more reuse of work
 * from the prior compilation.
 */
class SemanticSymbol {
    decl;
    /**
     * The path of the file that declares this symbol.
     */
    path;
    /**
     * The identifier of this symbol, or null if no identifier could be determined. It should
     * uniquely identify the symbol relative to `file`. This is typically just the name of a
     * top-level class declaration, as that uniquely identifies the class within the file.
     *
     * If the identifier is null, then this symbol cannot be recognized across rebuilds. In that
     * case, the symbol is always assumed to have semantically changed to guarantee a proper
     * rebuild.
     */
    identifier;
    constructor(
    /**
     * The declaration for this symbol.
     */
    decl) {
        this.decl = decl;
        this.path = checker.absoluteFromSourceFile(decl.getSourceFile());
        this.identifier = getSymbolIdentifier(decl);
    }
}
function getSymbolIdentifier(decl) {
    if (!ts.isSourceFile(decl.parent)) {
        return null;
    }
    // If this is a top-level class declaration, the class name is used as unique identifier.
    // Other scenarios are currently not supported and causes the symbol not to be identified
    // across rebuilds, unless the declaration node has not changed.
    return decl.name.text;
}

/**
 * Represents a declaration for which no semantic symbol has been registered. For example,
 * declarations from external dependencies have not been explicitly registered and are represented
 * by this symbol. This allows the unresolved symbol to still be compared to a symbol from a prior
 * compilation.
 */
class OpaqueSymbol extends SemanticSymbol {
    isPublicApiAffected() {
        return false;
    }
    isTypeCheckApiAffected() {
        return false;
    }
}
/**
 * The semantic dependency graph of a single compilation.
 */
class SemanticDepGraph {
    files = new Map();
    // Note: the explicit type annotation is used to work around a CI failure on Windows:
    // error TS2742: The inferred type of 'symbolByDecl' cannot be named without a reference to
    // '../../../../../../../external/npm/node_modules/typescript/lib/typescript'. This is likely
    // not portable. A type annotation is necessary.
    symbolByDecl = new Map();
    /**
     * Registers a symbol in the graph. The symbol is given a unique identifier if possible, such that
     * its equivalent symbol can be obtained from a prior graph even if its declaration node has
     * changed across rebuilds. Symbols without an identifier are only able to find themselves in a
     * prior graph if their declaration node is identical.
     */
    registerSymbol(symbol) {
        this.symbolByDecl.set(symbol.decl, symbol);
        if (symbol.identifier !== null) {
            // If the symbol has a unique identifier, record it in the file that declares it. This enables
            // the symbol to be requested by its unique name.
            if (!this.files.has(symbol.path)) {
                this.files.set(symbol.path, new Map());
            }
            this.files.get(symbol.path).set(symbol.identifier, symbol);
        }
    }
    /**
     * Attempts to resolve a symbol in this graph that represents the given symbol from another graph.
     * If no matching symbol could be found, null is returned.
     *
     * @param symbol The symbol from another graph for which its equivalent in this graph should be
     * found.
     */
    getEquivalentSymbol(symbol) {
        // First lookup the symbol by its declaration. It is typical for the declaration to not have
        // changed across rebuilds, so this is likely to find the symbol. Using the declaration also
        // allows to diff symbols for which no unique identifier could be determined.
        let previousSymbol = this.getSymbolByDecl(symbol.decl);
        if (previousSymbol === null && symbol.identifier !== null) {
            // The declaration could not be resolved to a symbol in a prior compilation, which may
            // happen because the file containing the declaration has changed. In that case we want to
            // lookup the symbol based on its unique identifier, as that allows us to still compare the
            // changed declaration to the prior compilation.
            previousSymbol = this.getSymbolByName(symbol.path, symbol.identifier);
        }
        return previousSymbol;
    }
    /**
     * Attempts to find the symbol by its identifier.
     */
    getSymbolByName(path, identifier) {
        if (!this.files.has(path)) {
            return null;
        }
        const file = this.files.get(path);
        if (!file.has(identifier)) {
            return null;
        }
        return file.get(identifier);
    }
    /**
     * Attempts to resolve the declaration to its semantic symbol.
     */
    getSymbolByDecl(decl) {
        if (!this.symbolByDecl.has(decl)) {
            return null;
        }
        return this.symbolByDecl.get(decl);
    }
}
/**
 * Implements the logic to go from a previous dependency graph to a new one, along with information
 * on which files have been affected.
 */
class SemanticDepGraphUpdater {
    priorGraph;
    newGraph = new SemanticDepGraph();
    /**
     * Contains opaque symbols that were created for declarations for which there was no symbol
     * registered, which happens for e.g. external declarations.
     */
    opaqueSymbols = new Map();
    constructor(
    /**
     * The semantic dependency graph of the most recently succeeded compilation, or null if this
     * is the initial build.
     */
    priorGraph) {
        this.priorGraph = priorGraph;
    }
    /**
     * Registers the symbol in the new graph that is being created.
     */
    registerSymbol(symbol) {
        this.newGraph.registerSymbol(symbol);
    }
    /**
     * Takes all facts that have been gathered to create a new semantic dependency graph. In this
     * process, the semantic impact of the changes is determined which results in a set of files that
     * need to be emitted and/or type-checked.
     */
    finalize() {
        if (this.priorGraph === null) {
            // If no prior dependency graph is available then this was the initial build, in which case
            // we don't need to determine the semantic impact as everything is already considered
            // logically changed.
            return {
                needsEmit: new Set(),
                needsTypeCheckEmit: new Set(),
                newGraph: this.newGraph,
            };
        }
        const needsEmit = this.determineInvalidatedFiles(this.priorGraph);
        const needsTypeCheckEmit = this.determineInvalidatedTypeCheckFiles(this.priorGraph);
        return {
            needsEmit,
            needsTypeCheckEmit,
            newGraph: this.newGraph,
        };
    }
    determineInvalidatedFiles(priorGraph) {
        const isPublicApiAffected = new Set();
        // The first phase is to collect all symbols which have their public API affected. Any symbols
        // that cannot be matched up with a symbol from the prior graph are considered affected.
        for (const symbol of this.newGraph.symbolByDecl.values()) {
            const previousSymbol = priorGraph.getEquivalentSymbol(symbol);
            if (previousSymbol === null || symbol.isPublicApiAffected(previousSymbol)) {
                isPublicApiAffected.add(symbol);
            }
        }
        // The second phase is to find all symbols for which the emit result is affected, either because
        // their used declarations have changed or any of those used declarations has had its public API
        // affected as determined in the first phase.
        const needsEmit = new Set();
        for (const symbol of this.newGraph.symbolByDecl.values()) {
            if (symbol.isEmitAffected === undefined) {
                continue;
            }
            const previousSymbol = priorGraph.getEquivalentSymbol(symbol);
            if (previousSymbol === null || symbol.isEmitAffected(previousSymbol, isPublicApiAffected)) {
                needsEmit.add(symbol.path);
            }
        }
        return needsEmit;
    }
    determineInvalidatedTypeCheckFiles(priorGraph) {
        const isTypeCheckApiAffected = new Set();
        // The first phase is to collect all symbols which have their public API affected. Any symbols
        // that cannot be matched up with a symbol from the prior graph are considered affected.
        for (const symbol of this.newGraph.symbolByDecl.values()) {
            const previousSymbol = priorGraph.getEquivalentSymbol(symbol);
            if (previousSymbol === null || symbol.isTypeCheckApiAffected(previousSymbol)) {
                isTypeCheckApiAffected.add(symbol);
            }
        }
        // The second phase is to find all symbols for which the emit result is affected, either because
        // their used declarations have changed or any of those used declarations has had its public API
        // affected as determined in the first phase.
        const needsTypeCheckEmit = new Set();
        for (const symbol of this.newGraph.symbolByDecl.values()) {
            if (symbol.isTypeCheckBlockAffected === undefined) {
                continue;
            }
            const previousSymbol = priorGraph.getEquivalentSymbol(symbol);
            if (previousSymbol === null ||
                symbol.isTypeCheckBlockAffected(previousSymbol, isTypeCheckApiAffected)) {
                needsTypeCheckEmit.add(symbol.path);
            }
        }
        return needsTypeCheckEmit;
    }
    /**
     * Creates a `SemanticReference` for the reference to `decl` using the expression `expr`. See
     * the documentation of `SemanticReference` for details.
     */
    getSemanticReference(decl, expr) {
        return {
            symbol: this.getSymbol(decl),
            importPath: getImportPath(expr),
        };
    }
    /**
     * Gets the `SemanticSymbol` that was registered for `decl` during the current compilation, or
     * returns an opaque symbol that represents `decl`.
     */
    getSymbol(decl) {
        const symbol = this.newGraph.getSymbolByDecl(decl);
        if (symbol === null) {
            // No symbol has been recorded for the provided declaration, which would be the case if the
            // declaration is external. Return an opaque symbol in that case, to allow the external
            // declaration to be compared to a prior compilation.
            return this.getOpaqueSymbol(decl);
        }
        return symbol;
    }
    /**
     * Gets or creates an `OpaqueSymbol` for the provided class declaration.
     */
    getOpaqueSymbol(decl) {
        if (this.opaqueSymbols.has(decl)) {
            return this.opaqueSymbols.get(decl);
        }
        const symbol = new OpaqueSymbol(decl);
        this.opaqueSymbols.set(decl, symbol);
        return symbol;
    }
}
function getImportPath(expr) {
    if (expr instanceof compiler.ExternalExpr) {
        return `${expr.value.moduleName}\$${expr.value.name}`;
    }
    else {
        return null;
    }
}

/**
 * Determines whether the provided symbols represent the same declaration.
 */
function isSymbolEqual(a, b) {
    if (a.decl === b.decl) {
        // If the declaration is identical then it must represent the same symbol.
        return true;
    }
    if (a.identifier === null || b.identifier === null) {
        // Unidentifiable symbols are assumed to be different.
        return false;
    }
    return a.path === b.path && a.identifier === b.identifier;
}
/**
 * Determines whether the provided references to a semantic symbol are still equal, i.e. represent
 * the same symbol and are imported by the same path.
 */
function isReferenceEqual(a, b) {
    if (!isSymbolEqual(a.symbol, b.symbol)) {
        // If the reference's target symbols are different, the reference itself is different.
        return false;
    }
    // The reference still corresponds with the same symbol, now check that the path by which it is
    // imported has not changed.
    return a.importPath === b.importPath;
}
function referenceEquality(a, b) {
    return a === b;
}
/**
 * Determines if the provided arrays are equal to each other, using the provided equality tester
 * that is called for all entries in the array.
 */
function isArrayEqual(a, b, equalityTester = referenceEquality) {
    if (a === null || b === null) {
        return a === b;
    }
    if (a.length !== b.length) {
        return false;
    }
    return !a.some((item, index) => !equalityTester(item, b[index]));
}
/**
 * Determines if the provided sets are equal to each other, using the provided equality tester.
 * Sets that only differ in ordering are considered equal.
 */
function isSetEqual(a, b, equalityTester = referenceEquality) {
    if (a === null || b === null) {
        return a === b;
    }
    if (a.size !== b.size) {
        return false;
    }
    for (const itemA of a) {
        let found = false;
        for (const itemB of b) {
            if (equalityTester(itemA, itemB)) {
                found = true;
                break;
            }
        }
        if (!found) {
            return false;
        }
    }
    return true;
}

/**
 * Converts the type parameters of the given class into their semantic representation. If the class
 * does not have any type parameters, then `null` is returned.
 */
function extractSemanticTypeParameters(node) {
    if (!ts.isClassDeclaration(node) || node.typeParameters === undefined) {
        return null;
    }
    return node.typeParameters.map((typeParam) => ({
        hasGenericTypeBound: typeParam.constraint !== undefined,
    }));
}
/**
 * Compares the list of type parameters to determine if they can be considered equal.
 */
function areTypeParametersEqual(current, previous) {
    // First compare all type parameters one-to-one; any differences mean that the list of type
    // parameters has changed.
    if (!isArrayEqual(current, previous, isTypeParameterEqual)) {
        return false;
    }
    // If there is a current list of type parameters and if any of them has a generic type constraint,
    // then the meaning of that type parameter may have changed without us being aware; as such we
    // have to assume that the type parameters have in fact changed.
    if (current !== null && current.some((typeParam) => typeParam.hasGenericTypeBound)) {
        return false;
    }
    return true;
}
function isTypeParameterEqual(a, b) {
    return a.hasGenericTypeBound === b.hasGenericTypeBound;
}

/**
 * A `ComponentScopeReader` that reads from an ordered set of child readers until it obtains the
 * requested scope.
 *
 * This is used to combine `ComponentScopeReader`s that read from different sources (e.g. from a
 * registry and from the incremental state).
 */
class CompoundComponentScopeReader {
    readers;
    constructor(readers) {
        this.readers = readers;
    }
    getScopeForComponent(clazz) {
        for (const reader of this.readers) {
            const meta = reader.getScopeForComponent(clazz);
            if (meta !== null) {
                return meta;
            }
        }
        return null;
    }
    getRemoteScope(clazz) {
        for (const reader of this.readers) {
            const remoteScope = reader.getRemoteScope(clazz);
            if (remoteScope !== null) {
                return remoteScope;
            }
        }
        return null;
    }
}

/**
 * Reads Angular metadata from classes declared in .d.ts files and computes an `ExportScope`.
 *
 * Given an NgModule declared in a .d.ts file, this resolver can produce a transitive `ExportScope`
 * of all of the directives/pipes it exports. It does this by reading metadata off of Ivy static
 * fields on directives, components, pipes, and NgModules.
 */
class MetadataDtsModuleScopeResolver {
    dtsMetaReader;
    aliasingHost;
    /**
     * Cache which holds fully resolved scopes for NgModule classes from .d.ts files.
     */
    cache = new Map();
    /**
     * @param dtsMetaReader a `MetadataReader` which can read metadata from `.d.ts` files.
     */
    constructor(dtsMetaReader, aliasingHost) {
        this.dtsMetaReader = dtsMetaReader;
        this.aliasingHost = aliasingHost;
    }
    /**
     * Resolve a `Reference`'d NgModule from a .d.ts file and produce a transitive `ExportScope`
     * listing the directives and pipes which that NgModule exports to others.
     *
     * This operation relies on a `Reference` instead of a direct TypeScript node as the `Reference`s
     * produced depend on how the original NgModule was imported.
     */
    resolve(ref) {
        const clazz = ref.node;
        const sourceFile = clazz.getSourceFile();
        if (!sourceFile.isDeclarationFile) {
            throw new Error(`Debug error: DtsModuleScopeResolver.read(${ref.debugName} from ${sourceFile.fileName}), but not a .d.ts file`);
        }
        if (this.cache.has(clazz)) {
            return this.cache.get(clazz);
        }
        // Build up the export scope - those directives and pipes made visible by this module.
        const dependencies = [];
        const meta = this.dtsMetaReader.getNgModuleMetadata(ref);
        if (meta === null) {
            this.cache.set(clazz, null);
            return null;
        }
        const declarations = new Set();
        for (const declRef of meta.declarations) {
            declarations.add(declRef.node);
        }
        // Only the 'exports' field of the NgModule's metadata is important. Imports and declarations
        // don't affect the export scope.
        for (const exportRef of meta.exports) {
            // Attempt to process the export as a directive.
            const directive = this.dtsMetaReader.getDirectiveMetadata(exportRef);
            if (directive !== null) {
                const isReExport = !declarations.has(exportRef.node);
                dependencies.push(this.maybeAlias(directive, sourceFile, isReExport));
                continue;
            }
            // Attempt to process the export as a pipe.
            const pipe = this.dtsMetaReader.getPipeMetadata(exportRef);
            if (pipe !== null) {
                const isReExport = !declarations.has(exportRef.node);
                dependencies.push(this.maybeAlias(pipe, sourceFile, isReExport));
                continue;
            }
            // Attempt to process the export as a module.
            const exportScope = this.resolve(exportRef);
            if (exportScope !== null) {
                // It is a module. Add exported directives and pipes to the current scope. This might
                // involve rewriting the `Reference`s to those types to have an alias expression if one is
                // required.
                if (this.aliasingHost === null) {
                    // Fast path when aliases aren't required.
                    dependencies.push(...exportScope.exported.dependencies);
                }
                else {
                    // It's necessary to rewrite the `Reference`s to add alias expressions. This way, imports
                    // generated to these directives and pipes will use a shallow import to `sourceFile`
                    // instead of a deep import directly to the directive or pipe class.
                    //
                    // One important check here is whether the directive/pipe is declared in the same
                    // source file as the re-exporting NgModule. This can happen if both a directive, its
                    // NgModule, and the re-exporting NgModule are all in the same file. In this case,
                    // no import alias is needed as it would go to the same file anyway.
                    for (const dep of exportScope.exported.dependencies) {
                        dependencies.push(this.maybeAlias(dep, sourceFile, /* isReExport */ true));
                    }
                }
            }
            continue;
            // The export was not a directive, a pipe, or a module. This is an error.
            // TODO(alxhub): produce a ts.Diagnostic
        }
        const exportScope = {
            exported: {
                dependencies,
                isPoisoned: meta.isPoisoned,
            },
        };
        this.cache.set(clazz, exportScope);
        return exportScope;
    }
    maybeAlias(dirOrPipe, maybeAliasFrom, isReExport) {
        const ref = dirOrPipe.ref;
        if (this.aliasingHost === null || ref.node.getSourceFile() === maybeAliasFrom) {
            return dirOrPipe;
        }
        const alias = this.aliasingHost.getAliasIn(ref.node, maybeAliasFrom, isReExport);
        if (alias === null) {
            return dirOrPipe;
        }
        return {
            ...dirOrPipe,
            ref: ref.cloneWithAlias(alias),
        };
    }
}

function getDiagnosticNode(ref, rawExpr) {
    // Show the diagnostic on the node within `rawExpr` which references the declaration
    // in question. `rawExpr` represents the raw expression from which `ref` was partially evaluated,
    // so use that to find the right node. Note that by the type system, `rawExpr` might be `null`, so
    // fall back on the declaration identifier in that case (even though in practice this should never
    // happen since local NgModules always have associated expressions).
    return rawExpr !== null ? ref.getOriginForDiagnostics(rawExpr) : ref.node.name;
}
function makeNotStandaloneDiagnostic(scopeReader, ref, rawExpr, kind) {
    const scope = scopeReader.getScopeForComponent(ref.node);
    let message = `The ${kind} '${ref.node.name.text}' appears in 'imports', but is not standalone and cannot be imported directly.`;
    let relatedInformation = undefined;
    if (scope !== null && scope.kind === checker.ComponentScopeKind.NgModule) {
        // The directive/pipe in question is declared in an NgModule. Check if it's also exported.
        const isExported = scope.exported.dependencies.some((dep) => dep.ref.node === ref.node);
        const relatedInfoMessageText = isExported
            ? `It can be imported using its '${scope.ngModule.name.text}' NgModule instead.`
            : `It's declared in the '${scope.ngModule.name.text}' NgModule, but is not exported. ` +
                'Consider exporting it and importing the NgModule instead.';
        relatedInformation = [checker.makeRelatedInformation(scope.ngModule.name, relatedInfoMessageText)];
    }
    if (relatedInformation === undefined) {
        // If no contextual pointers can be provided to suggest a specific remedy, then at least tell
        // the user broadly what they need to do.
        message += ' It must be imported via an NgModule.';
    }
    return checker.makeDiagnostic(checker.ErrorCode.COMPONENT_IMPORT_NOT_STANDALONE, getDiagnosticNode(ref, rawExpr), message, relatedInformation);
}
function makeUnknownComponentImportDiagnostic(ref, rawExpr) {
    return checker.makeDiagnostic(checker.ErrorCode.COMPONENT_UNKNOWN_IMPORT, getDiagnosticNode(ref, rawExpr), `Component imports must be standalone components, directives, pipes, or must be NgModules.`);
}
function makeUnknownComponentDeferredImportDiagnostic(ref, rawExpr) {
    return checker.makeDiagnostic(checker.ErrorCode.COMPONENT_UNKNOWN_DEFERRED_IMPORT, getDiagnosticNode(ref, rawExpr), `Component deferred imports must be standalone components, directives or pipes.`);
}

/** Value used to mark a module whose scope is in the process of being resolved. */
const IN_PROGRESS_RESOLUTION = {};
/**
 * A registry which collects information about NgModules, Directives, Components, and Pipes which
 * are local (declared in the ts.Program being compiled), and can produce `LocalModuleScope`s
 * which summarize the compilation scope of a component.
 *
 * This class implements the logic of NgModule declarations, imports, and exports and can produce,
 * for a given component, the set of directives and pipes which are "visible" in that component's
 * template.
 *
 * The `LocalModuleScopeRegistry` has two "modes" of operation. During analysis, data for each
 * individual NgModule, Directive, Component, and Pipe is added to the registry. No attempt is made
 * to traverse or validate the NgModule graph (imports, exports, etc). After analysis, one of
 * `getScopeOfModule` or `getScopeForComponent` can be called, which traverses the NgModule graph
 * and applies the NgModule logic to generate a `LocalModuleScope`, the full scope for the given
 * module or component.
 *
 * The `LocalModuleScopeRegistry` is also capable of producing `ts.Diagnostic` errors when Angular
 * semantics are violated.
 */
class LocalModuleScopeRegistry {
    localReader;
    fullReader;
    dependencyScopeReader;
    refEmitter;
    aliasingHost;
    /**
     * Tracks whether the registry has been asked to produce scopes for a module or component. Once
     * this is true, the registry cannot accept registrations of new directives/pipes/modules as it
     * would invalidate the cached scope data.
     */
    sealed = false;
    /**
     * A map of components from the current compilation unit to the NgModule which declared them.
     *
     * As components and directives are not distinguished at the NgModule level, this map may also
     * contain directives. This doesn't cause any problems but isn't useful as there is no concept of
     * a directive's compilation scope.
     */
    declarationToModule = new Map();
    /**
     * This maps from the directive/pipe class to a map of data for each NgModule that declares the
     * directive/pipe. This data is needed to produce an error for the given class.
     */
    duplicateDeclarations = new Map();
    moduleToRef = new Map();
    /**
     * A cache of calculated `LocalModuleScope`s for each NgModule declared in the current program.
  
     */
    cache = new Map();
    /**
     * Tracks the `RemoteScope` for components requiring "remote scoping".
     *
     * Remote scoping is when the set of directives which apply to a given component is set in the
     * NgModule's file instead of directly on the component def (which is sometimes needed to get
     * around cyclic import issues). This is not used in calculation of `LocalModuleScope`s, but is
     * tracked here for convenience.
     */
    remoteScoping = new Map();
    /**
     * Tracks errors accumulated in the processing of scopes for each module declaration.
     */
    scopeErrors = new Map();
    /**
     * Tracks which NgModules have directives/pipes that are declared in more than one module.
     */
    modulesWithStructuralErrors = new Set();
    constructor(localReader, fullReader, dependencyScopeReader, refEmitter, aliasingHost) {
        this.localReader = localReader;
        this.fullReader = fullReader;
        this.dependencyScopeReader = dependencyScopeReader;
        this.refEmitter = refEmitter;
        this.aliasingHost = aliasingHost;
    }
    /**
     * Add an NgModule's data to the registry.
     */
    registerNgModuleMetadata(data) {
        this.assertCollecting();
        const ngModule = data.ref.node;
        this.moduleToRef.set(data.ref.node, data.ref);
        // Iterate over the module's declarations, and add them to declarationToModule. If duplicates
        // are found, they're instead tracked in duplicateDeclarations.
        for (const decl of data.declarations) {
            this.registerDeclarationOfModule(ngModule, decl, data.rawDeclarations);
        }
    }
    registerDirectiveMetadata(directive) { }
    registerPipeMetadata(pipe) { }
    getScopeForComponent(clazz) {
        const scope = !this.declarationToModule.has(clazz)
            ? null
            : this.getScopeOfModule(this.declarationToModule.get(clazz).ngModule);
        return scope;
    }
    /**
     * If `node` is declared in more than one NgModule (duplicate declaration), then get the
     * `DeclarationData` for each offending declaration.
     *
     * Ordinarily a class is only declared in one NgModule, in which case this function returns
     * `null`.
     */
    getDuplicateDeclarations(node) {
        if (!this.duplicateDeclarations.has(node)) {
            return null;
        }
        return Array.from(this.duplicateDeclarations.get(node).values());
    }
    /**
     * Collects registered data for a module and its directives/pipes and convert it into a full
     * `LocalModuleScope`.
     *
     * This method implements the logic of NgModule imports and exports. It returns the
     * `LocalModuleScope` for the given NgModule if one can be produced, `null` if no scope was ever
     * defined, or the string `'error'` if the scope contained errors.
     */
    getScopeOfModule(clazz) {
        return this.moduleToRef.has(clazz)
            ? this.getScopeOfModuleReference(this.moduleToRef.get(clazz))
            : null;
    }
    /**
     * Retrieves any `ts.Diagnostic`s produced during the calculation of the `LocalModuleScope` for
     * the given NgModule, or `null` if no errors were present.
     */
    getDiagnosticsOfModule(clazz) {
        // Required to ensure the errors are populated for the given class. If it has been processed
        // before, this will be a no-op due to the scope cache.
        this.getScopeOfModule(clazz);
        if (this.scopeErrors.has(clazz)) {
            return this.scopeErrors.get(clazz);
        }
        else {
            return null;
        }
    }
    registerDeclarationOfModule(ngModule, decl, rawDeclarations) {
        const declData = {
            ngModule,
            ref: decl,
            rawDeclarations,
        };
        // First, check for duplicate declarations of the same directive/pipe.
        if (this.duplicateDeclarations.has(decl.node)) {
            // This directive/pipe has already been identified as being duplicated. Add this module to the
            // map of modules for which a duplicate declaration exists.
            this.duplicateDeclarations.get(decl.node).set(ngModule, declData);
        }
        else if (this.declarationToModule.has(decl.node) &&
            this.declarationToModule.get(decl.node).ngModule !== ngModule) {
            // This directive/pipe is already registered as declared in another module. Mark it as a
            // duplicate instead.
            const duplicateDeclMap = new Map();
            const firstDeclData = this.declarationToModule.get(decl.node);
            // Mark both modules as having duplicate declarations.
            this.modulesWithStructuralErrors.add(firstDeclData.ngModule);
            this.modulesWithStructuralErrors.add(ngModule);
            // Being detected as a duplicate means there are two NgModules (for now) which declare this
            // directive/pipe. Add both of them to the duplicate tracking map.
            duplicateDeclMap.set(firstDeclData.ngModule, firstDeclData);
            duplicateDeclMap.set(ngModule, declData);
            this.duplicateDeclarations.set(decl.node, duplicateDeclMap);
            // Remove the directive/pipe from `declarationToModule` as it's a duplicate declaration, and
            // therefore not valid.
            this.declarationToModule.delete(decl.node);
        }
        else {
            // This is the first declaration of this directive/pipe, so map it.
            this.declarationToModule.set(decl.node, declData);
        }
    }
    /**
     * Implementation of `getScopeOfModule` which accepts a reference to a class.
     */
    getScopeOfModuleReference(ref) {
        if (this.cache.has(ref.node)) {
            const cachedValue = this.cache.get(ref.node);
            if (cachedValue !== IN_PROGRESS_RESOLUTION) {
                return cachedValue;
            }
        }
        this.cache.set(ref.node, IN_PROGRESS_RESOLUTION);
        // Seal the registry to protect the integrity of the `LocalModuleScope` cache.
        this.sealed = true;
        // `ref` should be an NgModule previously added to the registry. If not, a scope for it
        // cannot be produced.
        const ngModule = this.localReader.getNgModuleMetadata(ref);
        if (ngModule === null) {
            this.cache.set(ref.node, null);
            return null;
        }
        // Errors produced during computation of the scope are recorded here. At the end, if this array
        // isn't empty then `undefined` will be cached and returned to indicate this scope is invalid.
        const diagnostics = [];
        // At this point, the goal is to produce two distinct transitive sets:
        // - the directives and pipes which are visible to components declared in the NgModule.
        // - the directives and pipes which are exported to any NgModules which import this one.
        // Directives and pipes in the compilation scope.
        const compilationDirectives = new Map();
        const compilationPipes = new Map();
        const declared = new Set();
        // Directives and pipes exported to any importing NgModules.
        const exportDirectives = new Map();
        const exportPipes = new Map();
        // The algorithm is as follows:
        // 1) Add all of the directives/pipes from each NgModule imported into the current one to the
        //    compilation scope.
        // 2) Add directives/pipes declared in the NgModule to the compilation scope. At this point, the
        //    compilation scope is complete.
        // 3) For each entry in the NgModule's exports:
        //    a) Attempt to resolve it as an NgModule with its own exported directives/pipes. If it is
        //       one, add them to the export scope of this NgModule.
        //    b) Otherwise, it should be a class in the compilation scope of this NgModule. If it is,
        //       add it to the export scope.
        //    c) If it's neither an NgModule nor a directive/pipe in the compilation scope, then this
        //       is an error.
        //
        let isPoisoned = false;
        if (this.modulesWithStructuralErrors.has(ngModule.ref.node)) {
            // If the module contains declarations that are duplicates, then it's considered poisoned.
            isPoisoned = true;
        }
        // 1) process imports.
        for (const decl of ngModule.imports) {
            const importScope = this.getExportedScope(decl, diagnostics, ref.node, 'import');
            if (importScope !== null) {
                if (importScope === 'invalid' ||
                    importScope === 'cycle' ||
                    importScope.exported.isPoisoned) {
                    // An import was an NgModule but contained errors of its own. Record this as an error too,
                    // because this scope is always going to be incorrect if one of its imports could not be
                    // read.
                    isPoisoned = true;
                    // Prevent the module from reporting a diagnostic about itself when there's a cycle.
                    if (importScope !== 'cycle') {
                        diagnostics.push(invalidTransitiveNgModuleRef(decl, ngModule.rawImports, 'import'));
                    }
                    if (importScope === 'invalid' || importScope === 'cycle') {
                        continue;
                    }
                }
                for (const dep of importScope.exported.dependencies) {
                    if (dep.kind === checker.MetaKind.Directive) {
                        compilationDirectives.set(dep.ref.node, dep);
                    }
                    else if (dep.kind === checker.MetaKind.Pipe) {
                        compilationPipes.set(dep.ref.node, dep);
                    }
                }
                // Successfully processed the import as an NgModule (even if it had errors).
                continue;
            }
            // The import wasn't an NgModule. Maybe it's a standalone entity?
            const directive = this.fullReader.getDirectiveMetadata(decl);
            if (directive !== null) {
                if (directive.isStandalone) {
                    compilationDirectives.set(directive.ref.node, directive);
                }
                else {
                    // Error: can't import a non-standalone component/directive.
                    diagnostics.push(makeNotStandaloneDiagnostic(this, decl, ngModule.rawImports, directive.isComponent ? 'component' : 'directive'));
                    isPoisoned = true;
                }
                continue;
            }
            // It wasn't a directive (standalone or otherwise). Maybe a pipe?
            const pipe = this.fullReader.getPipeMetadata(decl);
            if (pipe !== null) {
                if (pipe.isStandalone) {
                    compilationPipes.set(pipe.ref.node, pipe);
                }
                else {
                    diagnostics.push(makeNotStandaloneDiagnostic(this, decl, ngModule.rawImports, 'pipe'));
                    isPoisoned = true;
                }
                continue;
            }
            // This reference was neither another NgModule nor a standalone entity. Report it as invalid.
            diagnostics.push(invalidRef(decl, ngModule.rawImports, 'import'));
            isPoisoned = true;
        }
        // 2) add declarations.
        for (const decl of ngModule.declarations) {
            const directive = this.localReader.getDirectiveMetadata(decl);
            const pipe = this.localReader.getPipeMetadata(decl);
            if (directive !== null) {
                if (directive.isStandalone) {
                    const refType = directive.isComponent ? 'Component' : 'Directive';
                    diagnostics.push(checker.makeDiagnostic(checker.ErrorCode.NGMODULE_DECLARATION_IS_STANDALONE, decl.getOriginForDiagnostics(ngModule.rawDeclarations), `${refType} ${decl.node.name.text} is standalone, and cannot be declared in an NgModule. Did you mean to import it instead?`));
                    isPoisoned = true;
                    continue;
                }
                compilationDirectives.set(decl.node, { ...directive, ref: decl });
                if (directive.isPoisoned) {
                    isPoisoned = true;
                }
            }
            else if (pipe !== null) {
                if (pipe.isStandalone) {
                    diagnostics.push(checker.makeDiagnostic(checker.ErrorCode.NGMODULE_DECLARATION_IS_STANDALONE, decl.getOriginForDiagnostics(ngModule.rawDeclarations), `Pipe ${decl.node.name.text} is standalone, and cannot be declared in an NgModule. Did you mean to import it instead?`));
                    isPoisoned = true;
                    continue;
                }
                compilationPipes.set(decl.node, { ...pipe, ref: decl });
            }
            else {
                const errorNode = decl.getOriginForDiagnostics(ngModule.rawDeclarations);
                diagnostics.push(checker.makeDiagnostic(checker.ErrorCode.NGMODULE_INVALID_DECLARATION, errorNode, `The class '${decl.node.name.text}' is listed in the declarations ` +
                    `of the NgModule '${ngModule.ref.node.name.text}', but is not a directive, a component, or a pipe. ` +
                    `Either remove it from the NgModule's declarations, or add an appropriate Angular decorator.`, [checker.makeRelatedInformation(decl.node.name, `'${decl.node.name.text}' is declared here.`)]));
                isPoisoned = true;
                continue;
            }
            declared.add(decl.node);
        }
        // 3) process exports.
        // Exports can contain modules, components, or directives. They're processed differently.
        // Modules are straightforward. Directives and pipes from exported modules are added to the
        // export maps. Directives/pipes are different - they might be exports of declared types or
        // imported types.
        for (const decl of ngModule.exports) {
            // Attempt to resolve decl as an NgModule.
            const exportScope = this.getExportedScope(decl, diagnostics, ref.node, 'export');
            if (exportScope === 'invalid' ||
                exportScope === 'cycle' ||
                (exportScope !== null && exportScope.exported.isPoisoned)) {
                // An export was an NgModule but contained errors of its own. Record this as an error too,
                // because this scope is always going to be incorrect if one of its exports could not be
                // read.
                isPoisoned = true;
                // Prevent the module from reporting a diagnostic about itself when there's a cycle.
                if (exportScope !== 'cycle') {
                    diagnostics.push(invalidTransitiveNgModuleRef(decl, ngModule.rawExports, 'export'));
                }
                if (exportScope === 'invalid' || exportScope === 'cycle') {
                    continue;
                }
            }
            else if (exportScope !== null) {
                // decl is an NgModule.
                for (const dep of exportScope.exported.dependencies) {
                    if (dep.kind == checker.MetaKind.Directive) {
                        exportDirectives.set(dep.ref.node, dep);
                    }
                    else if (dep.kind === checker.MetaKind.Pipe) {
                        exportPipes.set(dep.ref.node, dep);
                    }
                }
            }
            else if (compilationDirectives.has(decl.node)) {
                // decl is a directive or component in the compilation scope of this NgModule.
                const directive = compilationDirectives.get(decl.node);
                exportDirectives.set(decl.node, directive);
            }
            else if (compilationPipes.has(decl.node)) {
                // decl is a pipe in the compilation scope of this NgModule.
                const pipe = compilationPipes.get(decl.node);
                exportPipes.set(decl.node, pipe);
            }
            else {
                // decl is an unknown export.
                const dirMeta = this.fullReader.getDirectiveMetadata(decl);
                const pipeMeta = this.fullReader.getPipeMetadata(decl);
                if (dirMeta !== null || pipeMeta !== null) {
                    const isStandalone = dirMeta !== null ? dirMeta.isStandalone : pipeMeta.isStandalone;
                    diagnostics.push(invalidReexport(decl, ngModule.rawExports, isStandalone));
                }
                else {
                    diagnostics.push(invalidRef(decl, ngModule.rawExports, 'export'));
                }
                isPoisoned = true;
                continue;
            }
        }
        const exported = {
            dependencies: [...exportDirectives.values(), ...exportPipes.values()],
            isPoisoned,
        };
        const reexports = this.getReexports(ngModule, ref, declared, exported.dependencies, diagnostics);
        // Finally, produce the `LocalModuleScope` with both the compilation and export scopes.
        const scope = {
            kind: checker.ComponentScopeKind.NgModule,
            ngModule: ngModule.ref.node,
            compilation: {
                dependencies: [...compilationDirectives.values(), ...compilationPipes.values()],
                isPoisoned,
            },
            exported,
            reexports,
            schemas: ngModule.schemas,
        };
        // Check if this scope had any errors during production.
        if (diagnostics.length > 0) {
            // Save the errors for retrieval.
            this.scopeErrors.set(ref.node, diagnostics);
            // Mark this module as being tainted.
            this.modulesWithStructuralErrors.add(ref.node);
        }
        this.cache.set(ref.node, scope);
        return scope;
    }
    /**
     * Check whether a component requires remote scoping.
     */
    getRemoteScope(node) {
        return this.remoteScoping.has(node) ? this.remoteScoping.get(node) : null;
    }
    /**
     * Set a component as requiring remote scoping, with the given directives and pipes to be
     * registered remotely.
     */
    setComponentRemoteScope(node, directives, pipes) {
        this.remoteScoping.set(node, { directives, pipes });
    }
    /**
     * Look up the `ExportScope` of a given `Reference` to an NgModule.
     *
     * The NgModule in question may be declared locally in the current ts.Program, or it may be
     * declared in a .d.ts file.
     *
     * @returns `null` if no scope could be found, or `'invalid'` if the `Reference` is not a valid
     *     NgModule.
     *
     * May also contribute diagnostics of its own by adding to the given `diagnostics`
     * array parameter.
     */
    getExportedScope(ref, diagnostics, ownerForErrors, type) {
        if (ref.node.getSourceFile().isDeclarationFile) {
            // The NgModule is declared in a .d.ts file. Resolve it with the `DependencyScopeReader`.
            if (!ts.isClassDeclaration(ref.node)) {
                // The NgModule is in a .d.ts file but is not declared as a ts.ClassDeclaration. This is an
                // error in the .d.ts metadata.
                const code = type === 'import' ? checker.ErrorCode.NGMODULE_INVALID_IMPORT : checker.ErrorCode.NGMODULE_INVALID_EXPORT;
                diagnostics.push(checker.makeDiagnostic(code, checker.identifierOfNode(ref.node) || ref.node, `Appears in the NgModule.${type}s of ${checker.nodeNameForError(ownerForErrors)}, but could not be resolved to an NgModule`));
                return 'invalid';
            }
            return this.dependencyScopeReader.resolve(ref);
        }
        else {
            if (this.cache.get(ref.node) === IN_PROGRESS_RESOLUTION) {
                diagnostics.push(checker.makeDiagnostic(type === 'import'
                    ? checker.ErrorCode.NGMODULE_INVALID_IMPORT
                    : checker.ErrorCode.NGMODULE_INVALID_EXPORT, checker.identifierOfNode(ref.node) || ref.node, `NgModule "${type}" field contains a cycle`));
                return 'cycle';
            }
            // The NgModule is declared locally in the current program. Resolve it from the registry.
            return this.getScopeOfModuleReference(ref);
        }
    }
    getReexports(ngModule, ref, declared, exported, diagnostics) {
        let reexports = null;
        const sourceFile = ref.node.getSourceFile();
        if (this.aliasingHost === null) {
            return null;
        }
        reexports = [];
        // Track re-exports by symbol name, to produce diagnostics if two alias re-exports would share
        // the same name.
        const reexportMap = new Map();
        // Alias ngModuleRef added for readability below.
        const ngModuleRef = ref;
        const addReexport = (exportRef) => {
            if (exportRef.node.getSourceFile() === sourceFile) {
                return;
            }
            const isReExport = !declared.has(exportRef.node);
            const exportName = this.aliasingHost.maybeAliasSymbolAs(exportRef, sourceFile, ngModule.ref.node.name.text, isReExport);
            if (exportName === null) {
                return;
            }
            if (!reexportMap.has(exportName)) {
                if (exportRef.alias && exportRef.alias instanceof compiler.ExternalExpr) {
                    reexports.push({
                        fromModule: exportRef.alias.value.moduleName,
                        symbolName: exportRef.alias.value.name,
                        asAlias: exportName,
                    });
                }
                else {
                    const emittedRef = this.refEmitter.emit(exportRef.cloneWithNoIdentifiers(), sourceFile);
                    checker.assertSuccessfulReferenceEmit(emittedRef, ngModuleRef.node.name, 'class');
                    const expr = emittedRef.expression;
                    if (!(expr instanceof compiler.ExternalExpr) ||
                        expr.value.moduleName === null ||
                        expr.value.name === null) {
                        throw new Error('Expected ExternalExpr');
                    }
                    reexports.push({
                        fromModule: expr.value.moduleName,
                        symbolName: expr.value.name,
                        asAlias: exportName,
                    });
                }
                reexportMap.set(exportName, exportRef);
            }
            else {
                // Another re-export already used this name. Produce a diagnostic.
                const prevRef = reexportMap.get(exportName);
                diagnostics.push(reexportCollision(ngModuleRef.node, prevRef, exportRef));
            }
        };
        for (const { ref } of exported) {
            addReexport(ref);
        }
        return reexports;
    }
    assertCollecting() {
        if (this.sealed) {
            throw new Error(`Assertion: LocalModuleScopeRegistry is not COLLECTING`);
        }
    }
}
/**
 * Produce a `ts.Diagnostic` for an invalid import or export from an NgModule.
 */
function invalidRef(decl, rawExpr, type) {
    const code = type === 'import' ? checker.ErrorCode.NGMODULE_INVALID_IMPORT : checker.ErrorCode.NGMODULE_INVALID_EXPORT;
    const resolveTarget = type === 'import' ? 'NgModule' : 'NgModule, Component, Directive, or Pipe';
    const message = `'${decl.node.name.text}' does not appear to be an ${resolveTarget} class.`;
    const library = decl.ownedByModuleGuess !== null ? ` (${decl.ownedByModuleGuess})` : '';
    const sf = decl.node.getSourceFile();
    let relatedMessage;
    // Provide extra context to the error for the user.
    if (!sf.isDeclarationFile) {
        // This is a file in the user's program. Highlight the class as undecorated.
        const annotationType = type === 'import' ? '@NgModule' : 'Angular';
        relatedMessage = `Is it missing an ${annotationType} annotation?`;
    }
    else if (sf.fileName.indexOf('node_modules') !== -1) {
        // This file comes from a third-party library in node_modules.
        relatedMessage =
            `This likely means that the library${library} which declares ${decl.debugName} is not ` +
                'compatible with Angular Ivy. Check if a newer version of the library is available, ' +
                "and update if so. Also consider checking with the library's authors to see if the " +
                'library is expected to be compatible with Ivy.';
    }
    else {
        // This is a monorepo style local dependency. Unfortunately these are too different to really
        // offer much more advice than this.
        relatedMessage = `This likely means that the dependency${library} which declares ${decl.debugName} is not compatible with Angular Ivy.`;
    }
    return checker.makeDiagnostic(code, getDiagnosticNode(decl, rawExpr), message, [
        checker.makeRelatedInformation(decl.node.name, relatedMessage),
    ]);
}
/**
 * Produce a `ts.Diagnostic` for an import or export which itself has errors.
 */
function invalidTransitiveNgModuleRef(decl, rawExpr, type) {
    const code = type === 'import' ? checker.ErrorCode.NGMODULE_INVALID_IMPORT : checker.ErrorCode.NGMODULE_INVALID_EXPORT;
    return checker.makeDiagnostic(code, getDiagnosticNode(decl, rawExpr), `This ${type} contains errors, which may affect components that depend on this NgModule.`);
}
/**
 * Produce a `ts.Diagnostic` for an exported directive or pipe which was not declared or imported
 * by the NgModule in question.
 */
function invalidReexport(decl, rawExpr, isStandalone) {
    // The root error is the same here - this export is not valid. Give a helpful error message based
    // on the specific circumstance.
    let message = `Can't be exported from this NgModule, as `;
    if (isStandalone) {
        // Standalone types need to be imported into an NgModule before they can be re-exported.
        message += 'it must be imported first';
    }
    else if (decl.node.getSourceFile().isDeclarationFile) {
        // Non-standalone types can be re-exported, but need to be imported into the NgModule first.
        // This requires importing their own NgModule.
        message += 'it must be imported via its NgModule first';
    }
    else {
        // Local non-standalone types must either be declared directly by this NgModule, or imported as
        // above.
        message +=
            'it must be either declared by this NgModule, or imported here via its NgModule first';
    }
    return checker.makeDiagnostic(checker.ErrorCode.NGMODULE_INVALID_REEXPORT, getDiagnosticNode(decl, rawExpr), message);
}
/**
 * Produce a `ts.Diagnostic` for a collision in re-export names between two directives/pipes.
 */
function reexportCollision(module, refA, refB) {
    const childMessageText = `This directive/pipe is part of the exports of '${module.name.text}' and shares the same name as another exported directive/pipe.`;
    return checker.makeDiagnostic(checker.ErrorCode.NGMODULE_REEXPORT_NAME_COLLISION, module.name, `
    There was a name collision between two classes named '${refA.node.name.text}', which are both part of the exports of '${module.name.text}'.

    Angular generates re-exports of an NgModule's exported directives/pipes from the module's source file in certain cases, using the declared name of the class. If two classes of the same name are exported, this automatic naming does not work.

    To fix this problem please re-export one or both classes directly from this file.
  `.trim(), [
        checker.makeRelatedInformation(refA.node.name, childMessageText),
        checker.makeRelatedInformation(refB.node.name, childMessageText),
    ]);
}

/**
 * Computes scope information to be used in template type checking.
 */
class TypeCheckScopeRegistry {
    scopeReader;
    metaReader;
    hostDirectivesResolver;
    /**
     * Cache of flattened directive metadata. Because flattened metadata is scope-invariant it's
     * cached individually, such that all scopes refer to the same flattened metadata.
     */
    flattenedDirectiveMetaCache = new Map();
    /**
     * Cache of the computed type check scope per NgModule declaration.
     */
    scopeCache = new Map();
    constructor(scopeReader, metaReader, hostDirectivesResolver) {
        this.scopeReader = scopeReader;
        this.metaReader = metaReader;
        this.hostDirectivesResolver = hostDirectivesResolver;
    }
    /**
     * Computes the type-check scope information for the component declaration. If the NgModule
     * contains an error, then 'error' is returned. If the component is not declared in any NgModule,
     * an empty type-check scope is returned.
     */
    getTypeCheckScope(node) {
        const matcher = new compiler.SelectorMatcher();
        const directives = [];
        const pipes = new Map();
        const scope = this.scopeReader.getScopeForComponent(node);
        if (scope === null) {
            return {
                matcher,
                directives,
                pipes,
                schemas: [],
                isPoisoned: false,
            };
        }
        const isNgModuleScope = scope.kind === checker.ComponentScopeKind.NgModule;
        const cacheKey = isNgModuleScope ? scope.ngModule : scope.component;
        const dependencies = isNgModuleScope ? scope.compilation.dependencies : scope.dependencies;
        if (this.scopeCache.has(cacheKey)) {
            return this.scopeCache.get(cacheKey);
        }
        let allDependencies = dependencies;
        if (!isNgModuleScope &&
            Array.isArray(scope.deferredDependencies) &&
            scope.deferredDependencies.length > 0) {
            allDependencies = [...allDependencies, ...scope.deferredDependencies];
        }
        for (const meta of allDependencies) {
            if (meta.kind === checker.MetaKind.Directive && meta.selector !== null) {
                const extMeta = this.getTypeCheckDirectiveMetadata(meta.ref);
                if (extMeta === null) {
                    continue;
                }
                // Carry over the `isExplicitlyDeferred` flag from the dependency info.
                const directiveMeta = this.applyExplicitlyDeferredFlag(extMeta, meta.isExplicitlyDeferred);
                matcher.addSelectables(compiler.CssSelector.parse(meta.selector), [
                    ...this.hostDirectivesResolver.resolve(directiveMeta),
                    directiveMeta,
                ]);
                directives.push(directiveMeta);
            }
            else if (meta.kind === checker.MetaKind.Pipe) {
                if (!ts.isClassDeclaration(meta.ref.node)) {
                    throw new Error(`Unexpected non-class declaration ${ts.SyntaxKind[meta.ref.node.kind]} for pipe ${meta.ref.debugName}`);
                }
                pipes.set(meta.name, meta);
            }
        }
        const typeCheckScope = {
            matcher,
            directives,
            pipes,
            schemas: scope.schemas,
            isPoisoned: scope.kind === checker.ComponentScopeKind.NgModule
                ? scope.compilation.isPoisoned || scope.exported.isPoisoned
                : scope.isPoisoned,
        };
        this.scopeCache.set(cacheKey, typeCheckScope);
        return typeCheckScope;
    }
    getTypeCheckDirectiveMetadata(ref) {
        const clazz = ref.node;
        if (this.flattenedDirectiveMetaCache.has(clazz)) {
            return this.flattenedDirectiveMetaCache.get(clazz);
        }
        const meta = checker.flattenInheritedDirectiveMetadata(this.metaReader, ref);
        if (meta === null) {
            return null;
        }
        this.flattenedDirectiveMetaCache.set(clazz, meta);
        return meta;
    }
    applyExplicitlyDeferredFlag(meta, isExplicitlyDeferred) {
        return isExplicitlyDeferred === true ? { ...meta, isExplicitlyDeferred } : meta;
    }
}

/**
 * Represents an Angular directive. Components are represented by `ComponentSymbol`, which inherits
 * from this symbol.
 */
class DirectiveSymbol extends SemanticSymbol {
    selector;
    inputs;
    outputs;
    exportAs;
    typeCheckMeta;
    typeParameters;
    baseClass = null;
    constructor(decl, selector, inputs, outputs, exportAs, typeCheckMeta, typeParameters) {
        super(decl);
        this.selector = selector;
        this.inputs = inputs;
        this.outputs = outputs;
        this.exportAs = exportAs;
        this.typeCheckMeta = typeCheckMeta;
        this.typeParameters = typeParameters;
    }
    isPublicApiAffected(previousSymbol) {
        // Note: since components and directives have exactly the same items contributing to their
        // public API, it is okay for a directive to change into a component and vice versa without
        // the API being affected.
        if (!(previousSymbol instanceof DirectiveSymbol)) {
            return true;
        }
        // Directives and components have a public API of:
        //  1. Their selector.
        //  2. The binding names of their inputs and outputs; a change in ordering is also considered
        //     to be a change in public API.
        //  3. The list of exportAs names and its ordering.
        return (this.selector !== previousSymbol.selector ||
            !isArrayEqual(this.inputs.propertyNames, previousSymbol.inputs.propertyNames) ||
            !isArrayEqual(this.outputs.propertyNames, previousSymbol.outputs.propertyNames) ||
            !isArrayEqual(this.exportAs, previousSymbol.exportAs));
    }
    isTypeCheckApiAffected(previousSymbol) {
        // If the public API of the directive has changed, then so has its type-check API.
        if (this.isPublicApiAffected(previousSymbol)) {
            return true;
        }
        if (!(previousSymbol instanceof DirectiveSymbol)) {
            return true;
        }
        // The type-check block also depends on the class property names, as writes property bindings
        // directly into the backing fields.
        if (!isArrayEqual(Array.from(this.inputs), Array.from(previousSymbol.inputs), isInputMappingEqual) ||
            !isArrayEqual(Array.from(this.outputs), Array.from(previousSymbol.outputs), isInputOrOutputEqual)) {
            return true;
        }
        // The type parameters of a directive are emitted into the type constructors in the type-check
        // block of a component, so if the type parameters are not considered equal then consider the
        // type-check API of this directive to be affected.
        if (!areTypeParametersEqual(this.typeParameters, previousSymbol.typeParameters)) {
            return true;
        }
        // The type-check metadata is used during TCB code generation, so any changes should invalidate
        // prior type-check files.
        if (!isTypeCheckMetaEqual(this.typeCheckMeta, previousSymbol.typeCheckMeta)) {
            return true;
        }
        // Changing the base class of a directive means that its inputs/outputs etc may have changed,
        // so the type-check block of components that use this directive needs to be regenerated.
        if (!isBaseClassEqual(this.baseClass, previousSymbol.baseClass)) {
            return true;
        }
        return false;
    }
}
function isInputMappingEqual(current, previous) {
    return isInputOrOutputEqual(current, previous) && current.required === previous.required;
}
function isInputOrOutputEqual(current, previous) {
    return (current.classPropertyName === previous.classPropertyName &&
        current.bindingPropertyName === previous.bindingPropertyName &&
        current.isSignal === previous.isSignal);
}
function isTypeCheckMetaEqual(current, previous) {
    if (current.hasNgTemplateContextGuard !== previous.hasNgTemplateContextGuard) {
        return false;
    }
    if (current.isGeneric !== previous.isGeneric) {
        // Note: changes in the number of type parameters is also considered in
        // `areTypeParametersEqual` so this check is technically not needed; it is done anyway for
        // completeness in terms of whether the `DirectiveTypeCheckMeta` struct itself compares
        // equal or not.
        return false;
    }
    if (!isArrayEqual(current.ngTemplateGuards, previous.ngTemplateGuards, isTemplateGuardEqual)) {
        return false;
    }
    if (!isSetEqual(current.coercedInputFields, previous.coercedInputFields)) {
        return false;
    }
    if (!isSetEqual(current.restrictedInputFields, previous.restrictedInputFields)) {
        return false;
    }
    if (!isSetEqual(current.stringLiteralInputFields, previous.stringLiteralInputFields)) {
        return false;
    }
    if (!isSetEqual(current.undeclaredInputFields, previous.undeclaredInputFields)) {
        return false;
    }
    return true;
}
function isTemplateGuardEqual(current, previous) {
    return current.inputName === previous.inputName && current.type === previous.type;
}
function isBaseClassEqual(current, previous) {
    if (current === null || previous === null) {
        return current === previous;
    }
    return isSymbolEqual(current, previous);
}

const TS_EXTENSIONS = /\.tsx?$/i;
/**
 * Replace the .ts or .tsx extension of a file with the shim filename suffix.
 */
function makeShimFileName(fileName, suffix) {
    return checker.absoluteFrom(fileName.replace(TS_EXTENSIONS, suffix));
}

/**
 * Generates and tracks shim files for each original `ts.SourceFile`.
 *
 * The `ShimAdapter` provides an API that's designed to be used by a `ts.CompilerHost`
 * implementation and allows it to include synthetic "shim" files in the program that's being
 * created. It works for both freshly created programs as well as with reuse of an older program
 * (which already may contain shim files and thus have a different creation flow).
 */
class ShimAdapter {
    delegate;
    /**
     * A map of shim file names to the `ts.SourceFile` generated for those shims.
     */
    shims = new Map();
    /**
     * A map of shim file names to existing shims which were part of a previous iteration of this
     * program.
     *
     * Not all of these shims will be inherited into this program.
     */
    priorShims = new Map();
    /**
     * File names which are already known to not be shims.
     *
     * This allows for short-circuit returns without the expense of running regular expressions
     * against the filename repeatedly.
     */
    notShims = new Set();
    /**
     * The shim generators supported by this adapter as well as extra precalculated data facilitating
     * their use.
     */
    generators = [];
    /**
     * A `Set` of shim `ts.SourceFile`s which should not be emitted.
     */
    ignoreForEmit = new Set();
    /**
     * A list of extra filenames which should be considered inputs to program creation.
     *
     * This includes any top-level shims generated for the program, as well as per-file shim names for
     * those files which are included in the root files of the program.
     */
    extraInputFiles;
    /**
     * Extension prefixes of all installed per-file shims.
     */
    extensionPrefixes = [];
    constructor(delegate, tsRootFiles, topLevelGenerators, perFileGenerators, oldProgram) {
        this.delegate = delegate;
        // Initialize `this.generators` with a regex that matches each generator's paths.
        for (const gen of perFileGenerators) {
            // This regex matches paths for shims from this generator. The first (and only) capture group
            // extracts the filename prefix, which can be used to find the original file that was used to
            // generate this shim.
            const pattern = `^(.*)\\.${gen.extensionPrefix}\\.ts$`;
            const regexp = new RegExp(pattern, 'i');
            this.generators.push({
                generator: gen,
                test: regexp,
                suffix: `.${gen.extensionPrefix}.ts`,
            });
            this.extensionPrefixes.push(gen.extensionPrefix);
        }
        // Process top-level generators and pre-generate their shims. Accumulate the list of filenames
        // as extra input files.
        const extraInputFiles = [];
        for (const gen of topLevelGenerators) {
            const sf = gen.makeTopLevelShim();
            checker.sfExtensionData(sf).isTopLevelShim = true;
            if (!gen.shouldEmit) {
                this.ignoreForEmit.add(sf);
            }
            const fileName = checker.absoluteFromSourceFile(sf);
            this.shims.set(fileName, sf);
            extraInputFiles.push(fileName);
        }
        // Add to that list the per-file shims associated with each root file. This is needed because
        // reference tagging alone may not work in TS compilations that have `noResolve` set. Such
        // compilations rely on the list of input files completely describing the program.
        for (const rootFile of tsRootFiles) {
            for (const gen of this.generators) {
                extraInputFiles.push(makeShimFileName(rootFile, gen.suffix));
            }
        }
        this.extraInputFiles = extraInputFiles;
        // If an old program is present, extract all per-file shims into a map, which will be used to
        // generate new versions of those shims.
        if (oldProgram !== null) {
            for (const oldSf of oldProgram.getSourceFiles()) {
                if (oldSf.isDeclarationFile || !checker.isFileShimSourceFile(oldSf)) {
                    continue;
                }
                this.priorShims.set(checker.absoluteFromSourceFile(oldSf), oldSf);
            }
        }
    }
    /**
     * Produce a shim `ts.SourceFile` if `fileName` refers to a shim file which should exist in the
     * program.
     *
     * If `fileName` does not refer to a potential shim file, `null` is returned. If a corresponding
     * base file could not be determined, `undefined` is returned instead.
     */
    maybeGenerate(fileName) {
        // Fast path: either this filename has been proven not to be a shim before, or it is a known
        // shim and no generation is required.
        if (this.notShims.has(fileName)) {
            return null;
        }
        else if (this.shims.has(fileName)) {
            return this.shims.get(fileName);
        }
        // .d.ts files can't be shims.
        if (checker.isDtsPath(fileName)) {
            this.notShims.add(fileName);
            return null;
        }
        // This is the first time seeing this path. Try to match it against a shim generator.
        for (const record of this.generators) {
            const match = record.test.exec(fileName);
            if (match === null) {
                continue;
            }
            // The path matched. Extract the filename prefix without the extension.
            const prefix = match[1];
            // This _might_ be a shim, if an underlying base file exists. The base file might be .ts or
            // .tsx.
            let baseFileName = checker.absoluteFrom(prefix + '.ts');
            // Retrieve the original file for which the shim will be generated.
            let inputFile = this.delegate.getSourceFile(baseFileName, ts.ScriptTarget.Latest);
            if (inputFile === undefined) {
                // No .ts file by that name - try .tsx.
                baseFileName = checker.absoluteFrom(prefix + '.tsx');
                inputFile = this.delegate.getSourceFile(baseFileName, ts.ScriptTarget.Latest);
            }
            if (inputFile === undefined || checker.isShim(inputFile)) {
                // This isn't a shim after all since there is no original file which would have triggered
                // its generation, even though the path is right. There are a few reasons why this could
                // occur:
                //
                // * when resolving an import to an .ngfactory.d.ts file, the module resolution algorithm
                //   will first look for an .ngfactory.ts file in its place, which will be requested here.
                // * when the user writes a bad import.
                // * when a file is present in one compilation and removed in the next incremental step.
                //
                // Note that this does not add the filename to `notShims`, so this path is not cached.
                // That's okay as these cases above are edge cases and do not occur regularly in normal
                // operations.
                return undefined;
            }
            // Actually generate and cache the shim.
            return this.generateSpecific(fileName, record.generator, inputFile);
        }
        // No generator matched.
        this.notShims.add(fileName);
        return null;
    }
    generateSpecific(fileName, generator, inputFile) {
        let priorShimSf = null;
        if (this.priorShims.has(fileName)) {
            // In the previous program a shim with this name already existed. It's passed to the shim
            // generator which may reuse it instead of generating a fresh shim.
            priorShimSf = this.priorShims.get(fileName);
            this.priorShims.delete(fileName);
        }
        const shimSf = generator.generateShimForFile(inputFile, fileName, priorShimSf);
        // Mark the new generated source file as a shim that originated from this generator.
        checker.sfExtensionData(shimSf).fileShim = {
            extension: generator.extensionPrefix,
            generatedFrom: checker.absoluteFromSourceFile(inputFile),
        };
        if (!generator.shouldEmit) {
            this.ignoreForEmit.add(shimSf);
        }
        this.shims.set(fileName, shimSf);
        return shimSf;
    }
}

/**
 * Manipulates the `referencedFiles` property of `ts.SourceFile`s to add references to shim files
 * for each original source file, causing the shims to be loaded into the program as well.
 *
 * `ShimReferenceTagger`s are intended to operate during program creation only.
 */
class ShimReferenceTagger {
    suffixes;
    /**
     * Tracks which original files have been processed and had shims generated if necessary.
     *
     * This is used to avoid generating shims twice for the same file.
     */
    tagged = new Set();
    /**
     * Whether shim tagging is currently being performed.
     */
    enabled = true;
    constructor(shimExtensions) {
        this.suffixes = shimExtensions.map((extension) => `.${extension}.ts`);
    }
    /**
     * Tag `sf` with any needed references if it's not a shim itself.
     */
    tag(sf) {
        if (!this.enabled ||
            sf.isDeclarationFile ||
            checker.isShim(sf) ||
            this.tagged.has(sf) ||
            !checker.isNonDeclarationTsPath(sf.fileName)) {
            return;
        }
        const ext = checker.sfExtensionData(sf);
        // If this file has never been tagged before, capture its `referencedFiles` in the extension
        // data.
        if (ext.originalReferencedFiles === null) {
            ext.originalReferencedFiles = sf.referencedFiles;
        }
        const referencedFiles = [...ext.originalReferencedFiles];
        const sfPath = checker.absoluteFromSourceFile(sf);
        for (const suffix of this.suffixes) {
            referencedFiles.push({
                fileName: makeShimFileName(sfPath, suffix),
                pos: 0,
                end: 0,
            });
        }
        ext.taggedReferenceFiles = referencedFiles;
        sf.referencedFiles = referencedFiles;
        this.tagged.add(sf);
    }
    /**
     * Disable the `ShimReferenceTagger` and free memory associated with tracking tagged files.
     */
    finalize() {
        this.enabled = false;
        this.tagged.clear();
    }
}

/**
 * Delegates all methods of `ts.CompilerHost` to a delegate, with the exception of
 * `getSourceFile`, `fileExists` and `writeFile` which are implemented in `TypeCheckProgramHost`.
 *
 * If a new method is added to `ts.CompilerHost` which is not delegated, a type error will be
 * generated for this class.
 */
let DelegatingCompilerHost$1 = class DelegatingCompilerHost {
    delegate;
    createHash;
    directoryExists;
    getCancellationToken;
    getCanonicalFileName;
    getCurrentDirectory;
    getDefaultLibFileName;
    getDefaultLibLocation;
    getDirectories;
    getEnvironmentVariable;
    getNewLine;
    getParsedCommandLine;
    getSourceFileByPath;
    readDirectory;
    readFile;
    realpath;
    resolveModuleNames;
    resolveTypeReferenceDirectives;
    trace;
    useCaseSensitiveFileNames;
    getModuleResolutionCache;
    hasInvalidatedResolutions;
    resolveModuleNameLiterals;
    resolveTypeReferenceDirectiveReferences;
    // jsDocParsingMode is not a method like the other elements above
    // TODO: ignore usage can be dropped once 5.2 support is dropped
    get jsDocParsingMode() {
        // @ts-ignore
        return this.delegate.jsDocParsingMode;
    }
    set jsDocParsingMode(mode) {
        // @ts-ignore
        this.delegate.jsDocParsingMode = mode;
    }
    constructor(delegate) {
        // Excluded are 'getSourceFile', 'fileExists' and 'writeFile', which are actually implemented by
        // `TypeCheckProgramHost` below.
        this.delegate = delegate;
        this.createHash = this.delegateMethod('createHash');
        this.directoryExists = this.delegateMethod('directoryExists');
        this.getCancellationToken = this.delegateMethod('getCancellationToken');
        this.getCanonicalFileName = this.delegateMethod('getCanonicalFileName');
        this.getCurrentDirectory = this.delegateMethod('getCurrentDirectory');
        this.getDefaultLibFileName = this.delegateMethod('getDefaultLibFileName');
        this.getDefaultLibLocation = this.delegateMethod('getDefaultLibLocation');
        this.getDirectories = this.delegateMethod('getDirectories');
        this.getEnvironmentVariable = this.delegateMethod('getEnvironmentVariable');
        this.getNewLine = this.delegateMethod('getNewLine');
        this.getParsedCommandLine = this.delegateMethod('getParsedCommandLine');
        this.getSourceFileByPath = this.delegateMethod('getSourceFileByPath');
        this.readDirectory = this.delegateMethod('readDirectory');
        this.readFile = this.delegateMethod('readFile');
        this.realpath = this.delegateMethod('realpath');
        this.resolveModuleNames = this.delegateMethod('resolveModuleNames');
        this.resolveTypeReferenceDirectives = this.delegateMethod('resolveTypeReferenceDirectives');
        this.trace = this.delegateMethod('trace');
        this.useCaseSensitiveFileNames = this.delegateMethod('useCaseSensitiveFileNames');
        this.getModuleResolutionCache = this.delegateMethod('getModuleResolutionCache');
        this.hasInvalidatedResolutions = this.delegateMethod('hasInvalidatedResolutions');
        this.resolveModuleNameLiterals = this.delegateMethod('resolveModuleNameLiterals');
        this.resolveTypeReferenceDirectiveReferences = this.delegateMethod('resolveTypeReferenceDirectiveReferences');
    }
    delegateMethod(name) {
        return this.delegate[name] !== undefined
            ? this.delegate[name].bind(this.delegate)
            : undefined;
    }
};
/**
 * A `ts.CompilerHost` which augments source files.
 */
class UpdatedProgramHost extends DelegatingCompilerHost$1 {
    originalProgram;
    shimExtensionPrefixes;
    /**
     * Map of source file names to `ts.SourceFile` instances.
     */
    sfMap;
    /**
     * The `ShimReferenceTagger` responsible for tagging `ts.SourceFile`s loaded via this host.
     *
     * The `UpdatedProgramHost` is used in the creation of a new `ts.Program`. Even though this new
     * program is based on a prior one, TypeScript will still start from the root files and enumerate
     * all source files to include in the new program.  This means that just like during the original
     * program's creation, these source files must be tagged with references to per-file shims in
     * order for those shims to be loaded, and then cleaned up afterwards. Thus the
     * `UpdatedProgramHost` has its own `ShimReferenceTagger` to perform this function.
     */
    shimTagger;
    constructor(sfMap, originalProgram, delegate, shimExtensionPrefixes) {
        super(delegate);
        this.originalProgram = originalProgram;
        this.shimExtensionPrefixes = shimExtensionPrefixes;
        this.shimTagger = new ShimReferenceTagger(this.shimExtensionPrefixes);
        this.sfMap = sfMap;
    }
    getSourceFile(fileName, languageVersionOrOptions, onError, shouldCreateNewSourceFile) {
        // Try to use the same `ts.SourceFile` as the original program, if possible. This guarantees
        // that program reuse will be as efficient as possible.
        let delegateSf = this.originalProgram.getSourceFile(fileName);
        if (delegateSf === undefined) {
            // Something went wrong and a source file is being requested that's not in the original
            // program. Just in case, try to retrieve it from the delegate.
            delegateSf = this.delegate.getSourceFile(fileName, languageVersionOrOptions, onError, shouldCreateNewSourceFile);
        }
        if (delegateSf === undefined) {
            return undefined;
        }
        // Look for replacements.
        let sf;
        if (this.sfMap.has(fileName)) {
            sf = this.sfMap.get(fileName);
            checker.copyFileShimData(delegateSf, sf);
        }
        else {
            sf = delegateSf;
        }
        // TypeScript doesn't allow returning redirect source files. To avoid unforeseen errors we
        // return the original source file instead of the redirect target.
        sf = checker.toUnredirectedSourceFile(sf);
        this.shimTagger.tag(sf);
        return sf;
    }
    postProgramCreationCleanup() {
        this.shimTagger.finalize();
    }
    writeFile() {
        throw new Error(`TypeCheckProgramHost should never write files`);
    }
    fileExists(fileName) {
        return this.sfMap.has(fileName) || this.delegate.fileExists(fileName);
    }
}
/**
 * Updates a `ts.Program` instance with a new one that incorporates specific changes, using the
 * TypeScript compiler APIs for incremental program creation.
 */
class TsCreateProgramDriver {
    originalProgram;
    originalHost;
    options;
    shimExtensionPrefixes;
    /**
     * A map of source file paths to replacement `ts.SourceFile`s for those paths.
     *
     * Effectively, this tracks the delta between the user's program (represented by the
     * `originalHost`) and the template type-checking program being managed.
     */
    sfMap = new Map();
    program;
    constructor(originalProgram, originalHost, options, shimExtensionPrefixes) {
        this.originalProgram = originalProgram;
        this.originalHost = originalHost;
        this.options = options;
        this.shimExtensionPrefixes = shimExtensionPrefixes;
        this.program = this.originalProgram;
    }
    supportsInlineOperations = true;
    getProgram() {
        return this.program;
    }
    updateFiles(contents, updateMode) {
        if (contents.size === 0) {
            // No changes have been requested. Is it safe to skip updating entirely?
            // If UpdateMode is Incremental, then yes. If UpdateMode is Complete, then it's safe to skip
            // only if there are no active changes already (that would be cleared by the update).
            if (updateMode !== checker.UpdateMode.Complete || this.sfMap.size === 0) {
                // No changes would be made to the `ts.Program` anyway, so it's safe to do nothing here.
                return;
            }
        }
        if (updateMode === checker.UpdateMode.Complete) {
            this.sfMap.clear();
        }
        for (const [filePath, { newText, originalFile }] of contents.entries()) {
            const sf = ts.createSourceFile(filePath, newText, ts.ScriptTarget.Latest, true);
            if (originalFile !== null) {
                sf[checker.NgOriginalFile] = originalFile;
            }
            this.sfMap.set(filePath, sf);
        }
        const host = new UpdatedProgramHost(this.sfMap, this.originalProgram, this.originalHost, this.shimExtensionPrefixes);
        const oldProgram = this.program;
        // Retag the old program's `ts.SourceFile`s with shim tags, to allow TypeScript to reuse the
        // most data.
        checker.retagAllTsFiles(oldProgram);
        this.program = ts.createProgram({
            host,
            rootNames: this.program.getRootFileNames(),
            options: this.options,
            oldProgram,
        });
        host.postProgramCreationCleanup();
        // Only untag the old program. The new program needs to keep the tagged files, because as of
        // TS 5.5 not having the files tagged while producing diagnostics can lead to errors. See:
        // https://github.com/microsoft/TypeScript/pull/58398
        checker.untagAllTsFiles(oldProgram);
    }
}

const FIELD_DECORATORS = [
    'Input',
    'Output',
    'ViewChild',
    'ViewChildren',
    'ContentChild',
    'ContentChildren',
    'HostBinding',
    'HostListener',
];
const LIFECYCLE_HOOKS = new Set([
    'ngOnChanges',
    'ngOnInit',
    'ngOnDestroy',
    'ngDoCheck',
    'ngAfterViewInit',
    'ngAfterViewChecked',
    'ngAfterContentInit',
    'ngAfterContentChecked',
]);
class DirectiveDecoratorHandler {
    reflector;
    evaluator;
    metaRegistry;
    scopeRegistry;
    metaReader;
    injectableRegistry;
    refEmitter;
    referencesRegistry;
    isCore;
    strictCtorDeps;
    semanticDepGraphUpdater;
    annotateForClosureCompiler;
    perf;
    importTracker;
    includeClassMetadata;
    typeCheckScopeRegistry;
    compilationMode;
    jitDeclarationRegistry;
    resourceRegistry;
    strictStandalone;
    implicitStandaloneValue;
    usePoisonedData;
    typeCheckHostBindings;
    constructor(reflector, evaluator, metaRegistry, scopeRegistry, metaReader, injectableRegistry, refEmitter, referencesRegistry, isCore, strictCtorDeps, semanticDepGraphUpdater, annotateForClosureCompiler, perf, importTracker, includeClassMetadata, typeCheckScopeRegistry, compilationMode, jitDeclarationRegistry, resourceRegistry, strictStandalone, implicitStandaloneValue, usePoisonedData, typeCheckHostBindings) {
        this.reflector = reflector;
        this.evaluator = evaluator;
        this.metaRegistry = metaRegistry;
        this.scopeRegistry = scopeRegistry;
        this.metaReader = metaReader;
        this.injectableRegistry = injectableRegistry;
        this.refEmitter = refEmitter;
        this.referencesRegistry = referencesRegistry;
        this.isCore = isCore;
        this.strictCtorDeps = strictCtorDeps;
        this.semanticDepGraphUpdater = semanticDepGraphUpdater;
        this.annotateForClosureCompiler = annotateForClosureCompiler;
        this.perf = perf;
        this.importTracker = importTracker;
        this.includeClassMetadata = includeClassMetadata;
        this.typeCheckScopeRegistry = typeCheckScopeRegistry;
        this.compilationMode = compilationMode;
        this.jitDeclarationRegistry = jitDeclarationRegistry;
        this.resourceRegistry = resourceRegistry;
        this.strictStandalone = strictStandalone;
        this.implicitStandaloneValue = implicitStandaloneValue;
        this.usePoisonedData = usePoisonedData;
        this.typeCheckHostBindings = typeCheckHostBindings;
    }
    precedence = checker.HandlerPrecedence.PRIMARY;
    name = 'DirectiveDecoratorHandler';
    detect(node, decorators) {
        // If a class is undecorated but uses Angular features, we detect it as an
        // abstract directive. This is an unsupported pattern as of v10, but we want
        // to still detect these patterns so that we can report diagnostics.
        if (!decorators) {
            const angularField = this.findClassFieldWithAngularFeatures(node);
            return angularField
                ? { trigger: angularField.node, decorator: null, metadata: null }
                : undefined;
        }
        else {
            const decorator = checker.findAngularDecorator(decorators, 'Directive', this.isCore);
            return decorator ? { trigger: decorator.node, decorator, metadata: decorator } : undefined;
        }
    }
    analyze(node, decorator) {
        // Skip processing of the class declaration if compilation of undecorated classes
        // with Angular features is disabled. Previously in ngtsc, such classes have always
        // been processed, but we want to enforce a consistent decorator mental model.
        // See: https://v9.angular.io/guide/migration-undecorated-classes.
        if (decorator === null) {
            // If compiling @angular/core, skip the diagnostic as core occasionally hand-writes
            // definitions.
            if (this.isCore) {
                return {};
            }
            return { diagnostics: [checker.getUndecoratedClassWithAngularFeaturesDiagnostic(node)] };
        }
        this.perf.eventCount(checker.PerfEvent.AnalyzeDirective);
        const directiveResult = checker.extractDirectiveMetadata(node, decorator, this.reflector, this.importTracker, this.evaluator, this.refEmitter, this.referencesRegistry, this.isCore, this.annotateForClosureCompiler, this.compilationMode, 
        /* defaultSelector */ null, this.strictStandalone, this.implicitStandaloneValue);
        // `extractDirectiveMetadata` returns `jitForced = true` when the `@Directive` has
        // set `jit: true`. In this case, compilation of the decorator is skipped. Returning
        // an empty object signifies that no analysis was produced.
        if (directiveResult.jitForced) {
            this.jitDeclarationRegistry.jitDeclarations.add(node);
            return {};
        }
        const analysis = directiveResult.metadata;
        let providersRequiringFactory = null;
        if (directiveResult !== undefined && directiveResult.decorator.has('providers')) {
            providersRequiringFactory = checker.resolveProvidersRequiringFactory(directiveResult.decorator.get('providers'), this.reflector, this.evaluator);
        }
        return {
            analysis: {
                inputs: directiveResult.inputs,
                inputFieldNamesFromMetadataArray: directiveResult.inputFieldNamesFromMetadataArray,
                outputs: directiveResult.outputs,
                meta: analysis,
                hostDirectives: directiveResult.hostDirectives,
                rawHostDirectives: directiveResult.rawHostDirectives,
                classMetadata: this.includeClassMetadata
                    ? extractClassMetadata(node, this.reflector, this.isCore, this.annotateForClosureCompiler)
                    : null,
                baseClass: checker.readBaseClass(node, this.reflector, this.evaluator),
                typeCheckMeta: checker.extractDirectiveTypeCheckMeta(node, directiveResult.inputs, this.reflector),
                providersRequiringFactory,
                isPoisoned: false,
                isStructural: directiveResult.isStructural,
                decorator: decorator?.node ?? null,
                hostBindingNodes: directiveResult.hostBindingNodes,
                resources: {
                    template: null,
                    styles: null,
                    hostBindings: checker.extractHostBindingResources(directiveResult.hostBindingNodes),
                },
            },
        };
    }
    symbol(node, analysis) {
        const typeParameters = extractSemanticTypeParameters(node);
        return new DirectiveSymbol(node, analysis.meta.selector, analysis.inputs, analysis.outputs, analysis.meta.exportAs, analysis.typeCheckMeta, typeParameters);
    }
    register(node, analysis) {
        // Register this directive's information with the `MetadataRegistry`. This ensures that
        // the information about the directive is available during the compile() phase.
        const ref = new checker.Reference(node);
        this.metaRegistry.registerDirectiveMetadata({
            kind: checker.MetaKind.Directive,
            matchSource: checker.MatchSource.Selector,
            ref,
            name: node.name.text,
            selector: analysis.meta.selector,
            exportAs: analysis.meta.exportAs,
            inputs: analysis.inputs,
            inputFieldNamesFromMetadataArray: analysis.inputFieldNamesFromMetadataArray,
            outputs: analysis.outputs,
            queries: analysis.meta.queries.map((query) => query.propertyName),
            isComponent: false,
            baseClass: analysis.baseClass,
            hostDirectives: analysis.hostDirectives,
            ...analysis.typeCheckMeta,
            isPoisoned: analysis.isPoisoned,
            isStructural: analysis.isStructural,
            animationTriggerNames: null,
            isStandalone: analysis.meta.isStandalone,
            isSignal: analysis.meta.isSignal,
            imports: null,
            rawImports: null,
            deferredImports: null,
            schemas: null,
            ngContentSelectors: null,
            decorator: analysis.decorator,
            preserveWhitespaces: false,
            // Directives analyzed within our own compilation are not _assumed_ to export providers.
            // Instead, we statically analyze their imports to make a direct determination.
            assumedToExportProviders: false,
            isExplicitlyDeferred: false,
        });
        this.resourceRegistry.registerResources(analysis.resources, node);
        this.injectableRegistry.registerInjectable(node, {
            ctorDeps: analysis.meta.deps,
        });
    }
    typeCheck(ctx, node, meta) {
        // Currently type checking in directives is only supported for host bindings
        // so we can skip everything below if type checking is disabled.
        if (!this.typeCheckHostBindings) {
            return;
        }
        if (!ts.isClassDeclaration(node) || (meta.isPoisoned && !this.usePoisonedData)) {
            return;
        }
        const scope = this.typeCheckScopeRegistry.getTypeCheckScope(node);
        if (scope.isPoisoned && !this.usePoisonedData) {
            // Don't type-check components that had errors in their scopes, unless requested.
            return;
        }
        const hostElement = checker.createHostElement('directive', meta.meta.selector, node, meta.hostBindingNodes.literal, meta.hostBindingNodes.bindingDecorators, meta.hostBindingNodes.listenerDecorators);
        if (hostElement !== null) {
            const binder = new compiler.R3TargetBinder(scope.matcher);
            const hostBindingsContext = {
                node: hostElement,
                sourceMapping: { type: 'direct', node },
            };
            ctx.addDirective(new checker.Reference(node), binder, scope.schemas, null, hostBindingsContext, meta.meta.isStandalone);
        }
    }
    resolve(node, analysis, symbol) {
        if (this.compilationMode === checker.CompilationMode.LOCAL) {
            return {};
        }
        if (this.semanticDepGraphUpdater !== null && analysis.baseClass instanceof checker.Reference) {
            symbol.baseClass = this.semanticDepGraphUpdater.getSymbol(analysis.baseClass.node);
        }
        const diagnostics = [];
        if (analysis.providersRequiringFactory !== null &&
            analysis.meta.providers instanceof compiler.WrappedNodeExpr) {
            const providerDiagnostics = checker.getProviderDiagnostics(analysis.providersRequiringFactory, analysis.meta.providers.node, this.injectableRegistry);
            diagnostics.push(...providerDiagnostics);
        }
        const directiveDiagnostics = checker.getDirectiveDiagnostics(node, this.injectableRegistry, this.evaluator, this.reflector, this.scopeRegistry, this.strictCtorDeps, 'Directive');
        if (directiveDiagnostics !== null) {
            diagnostics.push(...directiveDiagnostics);
        }
        const hostDirectivesDiagnotics = analysis.hostDirectives && analysis.rawHostDirectives
            ? checker.validateHostDirectives(analysis.rawHostDirectives, analysis.hostDirectives, this.metaReader)
            : null;
        if (hostDirectivesDiagnotics !== null) {
            diagnostics.push(...hostDirectivesDiagnotics);
        }
        if (diagnostics.length > 0) {
            return { diagnostics };
        }
        // Note: we need to produce *some* sort of the data in order
        // for the host binding diagnostics to be surfaced.
        return { data: {} };
    }
    compileFull(node, analysis, resolution, pool) {
        const fac = compileNgFactoryDefField(checker.toFactoryMetadata(analysis.meta, compiler.FactoryTarget.Directive));
        const def = compiler.compileDirectiveFromMetadata(analysis.meta, pool, compiler.makeBindingParser());
        const inputTransformFields = compileInputTransformFields(analysis.inputs);
        const classMetadata = analysis.classMetadata !== null
            ? compileClassMetadata(analysis.classMetadata).toStmt()
            : null;
        return checker.compileResults(fac, def, classMetadata, 'ɵdir', inputTransformFields, null /* deferrableImports */);
    }
    compilePartial(node, analysis, resolution) {
        const fac = compileDeclareFactory(checker.toFactoryMetadata(analysis.meta, compiler.FactoryTarget.Directive));
        const def = compileDeclareDirectiveFromMetadata(analysis.meta);
        const inputTransformFields = compileInputTransformFields(analysis.inputs);
        const classMetadata = analysis.classMetadata !== null
            ? compileDeclareClassMetadata(analysis.classMetadata).toStmt()
            : null;
        return checker.compileResults(fac, def, classMetadata, 'ɵdir', inputTransformFields, null /* deferrableImports */);
    }
    compileLocal(node, analysis, resolution, pool) {
        const fac = compileNgFactoryDefField(checker.toFactoryMetadata(analysis.meta, compiler.FactoryTarget.Directive));
        const def = compiler.compileDirectiveFromMetadata(analysis.meta, pool, compiler.makeBindingParser());
        const inputTransformFields = compileInputTransformFields(analysis.inputs);
        const classMetadata = analysis.classMetadata !== null
            ? compileClassMetadata(analysis.classMetadata).toStmt()
            : null;
        return checker.compileResults(fac, def, classMetadata, 'ɵdir', inputTransformFields, null /* deferrableImports */);
    }
    /**
     * Checks if a given class uses Angular features and returns the TypeScript node
     * that indicated the usage. Classes are considered using Angular features if they
     * contain class members that are either decorated with a known Angular decorator,
     * or if they correspond to a known Angular lifecycle hook.
     */
    findClassFieldWithAngularFeatures(node) {
        return this.reflector.getMembersOfClass(node).find((member) => {
            if (!member.isStatic &&
                member.kind === checker.ClassMemberKind.Method &&
                LIFECYCLE_HOOKS.has(member.name)) {
                return true;
            }
            if (member.decorators) {
                return member.decorators.some((decorator) => FIELD_DECORATORS.some((decoratorName) => checker.isAngularDecorator(decorator, decoratorName, this.isCore)));
            }
            return false;
        });
    }
}

/**
 * Creates a foreign function resolver to detect a `ModuleWithProviders<T>` type in a return type
 * position of a function or method declaration. A `SyntheticValue` is produced if such a return
 * type is recognized.
 *
 * @param reflector The reflection host to use for analyzing the syntax.
 * @param isCore Whether the @angular/core package is being compiled.
 */
function createModuleWithProvidersResolver(reflector, isCore) {
    /**
     * Retrieve an `NgModule` identifier (T) from the specified `type`, if it is of the form:
     * `ModuleWithProviders<T>`
     * @param type The type to reflect on.
     * @returns the identifier of the NgModule type if found, or null otherwise.
     */
    function _reflectModuleFromTypeParam(type, node) {
        // Examine the type of the function to see if it's a ModuleWithProviders reference.
        if (!ts.isTypeReferenceNode(type)) {
            return null;
        }
        const typeName = (type &&
            ((ts.isIdentifier(type.typeName) && type.typeName) ||
                (ts.isQualifiedName(type.typeName) && type.typeName.right))) ||
            null;
        if (typeName === null) {
            return null;
        }
        // Look at the type itself to see where it comes from.
        const id = reflector.getImportOfIdentifier(typeName);
        // If it's not named ModuleWithProviders, bail.
        if (id === null || id.name !== 'ModuleWithProviders') {
            return null;
        }
        // If it's not from @angular/core, bail.
        if (!isCore && id.from !== '@angular/core') {
            return null;
        }
        // If there's no type parameter specified, bail.
        if (type.typeArguments === undefined || type.typeArguments.length !== 1) {
            const parent = ts.isMethodDeclaration(node) && ts.isClassDeclaration(node.parent) ? node.parent : null;
            const symbolName = (parent && parent.name ? parent.name.getText() + '.' : '') +
                (node.name ? node.name.getText() : 'anonymous');
            throw new checker.FatalDiagnosticError(checker.ErrorCode.NGMODULE_MODULE_WITH_PROVIDERS_MISSING_GENERIC, type, `${symbolName} returns a ModuleWithProviders type without a generic type argument. ` +
                `Please add a generic type argument to the ModuleWithProviders type. If this ` +
                `occurrence is in library code you don't control, please contact the library authors.`);
        }
        const arg = type.typeArguments[0];
        return checker.typeNodeToValueExpr(arg);
    }
    /**
     * Retrieve an `NgModule` identifier (T) from the specified `type`, if it is of the form:
     * `A|B|{ngModule: T}|C`.
     * @param type The type to reflect on.
     * @returns the identifier of the NgModule type if found, or null otherwise.
     */
    function _reflectModuleFromLiteralType(type) {
        if (!ts.isIntersectionTypeNode(type)) {
            return null;
        }
        for (const t of type.types) {
            if (ts.isTypeLiteralNode(t)) {
                for (const m of t.members) {
                    const ngModuleType = (ts.isPropertySignature(m) &&
                        ts.isIdentifier(m.name) &&
                        m.name.text === 'ngModule' &&
                        m.type) ||
                        null;
                    let ngModuleExpression = null;
                    // Handle `: typeof X` or `: X` cases.
                    if (ngModuleType !== null && ts.isTypeQueryNode(ngModuleType)) {
                        ngModuleExpression = checker.entityNameToValue(ngModuleType.exprName);
                    }
                    else if (ngModuleType !== null) {
                        ngModuleExpression = checker.typeNodeToValueExpr(ngModuleType);
                    }
                    if (ngModuleExpression) {
                        return ngModuleExpression;
                    }
                }
            }
        }
        return null;
    }
    return (fn, callExpr, resolve, unresolvable) => {
        const rawType = fn.node.type;
        if (rawType === undefined) {
            return unresolvable;
        }
        const type = _reflectModuleFromTypeParam(rawType, fn.node) ?? _reflectModuleFromLiteralType(rawType);
        if (type === null) {
            return unresolvable;
        }
        const ngModule = resolve(type);
        if (!(ngModule instanceof checker.Reference) || !checker.isNamedClassDeclaration(ngModule.node)) {
            return unresolvable;
        }
        return new checker.SyntheticValue({
            ngModule: ngModule,
            mwpCall: callExpr,
        });
    };
}
function isResolvedModuleWithProviders(sv) {
    return (typeof sv.value === 'object' &&
        sv.value != null &&
        sv.value.hasOwnProperty('ngModule') &&
        sv.value.hasOwnProperty('mwpCall'));
}

/**
 * Represents an Angular NgModule.
 */
class NgModuleSymbol extends SemanticSymbol {
    hasProviders;
    remotelyScopedComponents = [];
    /**
     * `SemanticSymbol`s of the transitive imports of this NgModule which came from imported
     * standalone components.
     *
     * Standalone components are excluded/included in the `InjectorDef` emit output of the NgModule
     * based on whether the compiler can prove that their transitive imports may contain exported
     * providers, so a change in this set of symbols may affect the compilation output of this
     * NgModule.
     */
    transitiveImportsFromStandaloneComponents = new Set();
    constructor(decl, hasProviders) {
        super(decl);
        this.hasProviders = hasProviders;
    }
    isPublicApiAffected(previousSymbol) {
        if (!(previousSymbol instanceof NgModuleSymbol)) {
            return true;
        }
        // Changes in the provider status of this NgModule affect downstream dependencies, which may
        // consider provider status in their own emits.
        if (previousSymbol.hasProviders !== this.hasProviders) {
            return true;
        }
        return false;
    }
    isEmitAffected(previousSymbol) {
        if (!(previousSymbol instanceof NgModuleSymbol)) {
            return true;
        }
        // compare our remotelyScopedComponents to the previous symbol
        if (previousSymbol.remotelyScopedComponents.length !== this.remotelyScopedComponents.length) {
            return true;
        }
        for (const currEntry of this.remotelyScopedComponents) {
            const prevEntry = previousSymbol.remotelyScopedComponents.find((prevEntry) => {
                return isSymbolEqual(prevEntry.component, currEntry.component);
            });
            if (prevEntry === undefined) {
                // No previous entry was found, which means that this component became remotely scoped and
                // hence this NgModule needs to be re-emitted.
                return true;
            }
            if (!isArrayEqual(currEntry.usedDirectives, prevEntry.usedDirectives, isReferenceEqual)) {
                // The list of used directives or their order has changed. Since this NgModule emits
                // references to the list of used directives, it should be re-emitted to update this list.
                // Note: the NgModule does not have to be re-emitted when any of the directives has had
                // their public API changed, as the NgModule only emits a reference to the symbol by its
                // name. Therefore, testing for symbol equality is sufficient.
                return true;
            }
            if (!isArrayEqual(currEntry.usedPipes, prevEntry.usedPipes, isReferenceEqual)) {
                return true;
            }
        }
        if (previousSymbol.transitiveImportsFromStandaloneComponents.size !==
            this.transitiveImportsFromStandaloneComponents.size) {
            return true;
        }
        const previousImports = Array.from(previousSymbol.transitiveImportsFromStandaloneComponents);
        for (const transitiveImport of this.transitiveImportsFromStandaloneComponents) {
            const prevEntry = previousImports.find((prevEntry) => isSymbolEqual(prevEntry, transitiveImport));
            if (prevEntry === undefined) {
                return true;
            }
            if (transitiveImport.isPublicApiAffected(prevEntry)) {
                return true;
            }
        }
        return false;
    }
    isTypeCheckApiAffected(previousSymbol) {
        if (!(previousSymbol instanceof NgModuleSymbol)) {
            return true;
        }
        return false;
    }
    addRemotelyScopedComponent(component, usedDirectives, usedPipes) {
        this.remotelyScopedComponents.push({ component, usedDirectives, usedPipes });
    }
    addTransitiveImportFromStandaloneComponent(importedSymbol) {
        this.transitiveImportsFromStandaloneComponents.add(importedSymbol);
    }
}
/**
 * Compiles @NgModule annotations to ngModuleDef fields.
 */
class NgModuleDecoratorHandler {
    reflector;
    evaluator;
    metaReader;
    metaRegistry;
    scopeRegistry;
    referencesRegistry;
    exportedProviderStatusResolver;
    semanticDepGraphUpdater;
    isCore;
    refEmitter;
    annotateForClosureCompiler;
    onlyPublishPublicTypings;
    injectableRegistry;
    perf;
    includeClassMetadata;
    includeSelectorScope;
    compilationMode;
    localCompilationExtraImportsTracker;
    jitDeclarationRegistry;
    constructor(reflector, evaluator, metaReader, metaRegistry, scopeRegistry, referencesRegistry, exportedProviderStatusResolver, semanticDepGraphUpdater, isCore, refEmitter, annotateForClosureCompiler, onlyPublishPublicTypings, injectableRegistry, perf, includeClassMetadata, includeSelectorScope, compilationMode, localCompilationExtraImportsTracker, jitDeclarationRegistry) {
        this.reflector = reflector;
        this.evaluator = evaluator;
        this.metaReader = metaReader;
        this.metaRegistry = metaRegistry;
        this.scopeRegistry = scopeRegistry;
        this.referencesRegistry = referencesRegistry;
        this.exportedProviderStatusResolver = exportedProviderStatusResolver;
        this.semanticDepGraphUpdater = semanticDepGraphUpdater;
        this.isCore = isCore;
        this.refEmitter = refEmitter;
        this.annotateForClosureCompiler = annotateForClosureCompiler;
        this.onlyPublishPublicTypings = onlyPublishPublicTypings;
        this.injectableRegistry = injectableRegistry;
        this.perf = perf;
        this.includeClassMetadata = includeClassMetadata;
        this.includeSelectorScope = includeSelectorScope;
        this.compilationMode = compilationMode;
        this.localCompilationExtraImportsTracker = localCompilationExtraImportsTracker;
        this.jitDeclarationRegistry = jitDeclarationRegistry;
    }
    precedence = checker.HandlerPrecedence.PRIMARY;
    name = 'NgModuleDecoratorHandler';
    detect(node, decorators) {
        if (!decorators) {
            return undefined;
        }
        const decorator = checker.findAngularDecorator(decorators, 'NgModule', this.isCore);
        if (decorator !== undefined) {
            return {
                trigger: decorator.node,
                decorator: decorator,
                metadata: decorator,
            };
        }
        else {
            return undefined;
        }
    }
    analyze(node, decorator) {
        this.perf.eventCount(checker.PerfEvent.AnalyzeNgModule);
        const name = node.name.text;
        if (decorator.args === null || decorator.args.length > 1) {
            throw new checker.FatalDiagnosticError(checker.ErrorCode.DECORATOR_ARITY_WRONG, decorator.node, `Incorrect number of arguments to @NgModule decorator`);
        }
        // @NgModule can be invoked without arguments. In case it is, pretend as if a blank object
        // literal was specified. This simplifies the code below.
        const meta = decorator.args.length === 1
            ? checker.unwrapExpression(decorator.args[0])
            : ts.factory.createObjectLiteralExpression([]);
        if (!ts.isObjectLiteralExpression(meta)) {
            throw new checker.FatalDiagnosticError(checker.ErrorCode.DECORATOR_ARG_NOT_LITERAL, meta, '@NgModule argument must be an object literal');
        }
        const ngModule = checker.reflectObjectLiteral(meta);
        if (ngModule.has('jit')) {
            this.jitDeclarationRegistry.jitDeclarations.add(node);
            // The only allowed value is true, so there's no need to expand further.
            return {};
        }
        const forwardRefResolver = checker.createForwardRefResolver(this.isCore);
        const moduleResolvers = checker.combineResolvers([
            createModuleWithProvidersResolver(this.reflector, this.isCore),
            forwardRefResolver,
        ]);
        const diagnostics = [];
        // Resolving declarations
        let declarationRefs = [];
        const rawDeclarations = ngModule.get('declarations') ?? null;
        if (rawDeclarations !== null) {
            const declarationMeta = this.evaluator.evaluate(rawDeclarations, forwardRefResolver);
            declarationRefs = this.resolveTypeList(rawDeclarations, declarationMeta, name, 'declarations', 0, this.compilationMode === checker.CompilationMode.LOCAL).references;
            // Look through the declarations to make sure they're all a part of the current compilation.
            for (const ref of declarationRefs) {
                if (ref.node.getSourceFile().isDeclarationFile) {
                    const errorNode = ref.getOriginForDiagnostics(rawDeclarations);
                    diagnostics.push(checker.makeDiagnostic(checker.ErrorCode.NGMODULE_INVALID_DECLARATION, errorNode, `Cannot declare '${ref.node.name.text}' in an NgModule as it's not a part of the current compilation.`, [checker.makeRelatedInformation(ref.node.name, `'${ref.node.name.text}' is declared here.`)]));
                }
            }
        }
        if (diagnostics.length > 0) {
            return { diagnostics };
        }
        // Resolving imports
        let importRefs = [];
        let rawImports = ngModule.get('imports') ?? null;
        if (rawImports !== null) {
            const importsMeta = this.evaluator.evaluate(rawImports, moduleResolvers);
            const result = this.resolveTypeList(rawImports, importsMeta, name, 'imports', 0, this.compilationMode === checker.CompilationMode.LOCAL);
            if (this.compilationMode === checker.CompilationMode.LOCAL &&
                this.localCompilationExtraImportsTracker !== null) {
                // For generating extra imports in local mode, the NgModule imports that are from external
                // files (i.e., outside of the compilation unit) are to be added to all the files in the
                // compilation unit. This is because any external component that is a dependency of some
                // component in the compilation unit must be imported by one of these NgModule's external
                // imports (or the external component cannot be a dependency of that internal component).
                // This approach can be further optimized by adding these NgModule external imports to a
                // subset of files in the compilation unit and not all. See comments in {@link
                // LocalCompilationExtraImportsTracker} and {@link
                // LocalCompilationExtraImportsTracker#addGlobalImportFromIdentifier} for more details.
                for (const d of result.dynamicValues) {
                    this.localCompilationExtraImportsTracker.addGlobalImportFromIdentifier(d.node);
                }
            }
            importRefs = result.references;
        }
        // Resolving exports
        let exportRefs = [];
        const rawExports = ngModule.get('exports') ?? null;
        if (rawExports !== null) {
            const exportsMeta = this.evaluator.evaluate(rawExports, moduleResolvers);
            exportRefs = this.resolveTypeList(rawExports, exportsMeta, name, 'exports', 0, this.compilationMode === checker.CompilationMode.LOCAL).references;
            this.referencesRegistry.add(node, ...exportRefs);
        }
        // Resolving bootstrap
        let bootstrapRefs = [];
        const rawBootstrap = ngModule.get('bootstrap') ?? null;
        if (this.compilationMode !== checker.CompilationMode.LOCAL && rawBootstrap !== null) {
            const bootstrapMeta = this.evaluator.evaluate(rawBootstrap, forwardRefResolver);
            bootstrapRefs = this.resolveTypeList(rawBootstrap, bootstrapMeta, name, 'bootstrap', 0, 
            /* allowUnresolvedReferences */ false).references;
            // Verify that the `@NgModule.bootstrap` list doesn't have Standalone Components.
            for (const ref of bootstrapRefs) {
                const dirMeta = this.metaReader.getDirectiveMetadata(ref);
                if (dirMeta?.isStandalone) {
                    diagnostics.push(makeStandaloneBootstrapDiagnostic(node, ref, rawBootstrap));
                }
            }
        }
        const schemas = this.compilationMode !== checker.CompilationMode.LOCAL && ngModule.has('schemas')
            ? extractSchemas(ngModule.get('schemas'), this.evaluator, 'NgModule')
            : [];
        let id = null;
        if (ngModule.has('id')) {
            const idExpr = ngModule.get('id');
            if (!isModuleIdExpression(idExpr)) {
                id = new compiler.WrappedNodeExpr(idExpr);
            }
            else {
                const diag = checker.makeDiagnostic(checker.ErrorCode.WARN_NGMODULE_ID_UNNECESSARY, idExpr, `Using 'module.id' for NgModule.id is a common anti-pattern that is ignored by the Angular compiler.`);
                diag.category = ts.DiagnosticCategory.Warning;
                diagnostics.push(diag);
            }
        }
        const valueContext = node.getSourceFile();
        const exportedNodes = new Set(exportRefs.map((ref) => ref.node));
        const declarations = [];
        const exportedDeclarations = [];
        const bootstrap = bootstrapRefs.map((bootstrap) => this._toR3Reference(bootstrap.getOriginForDiagnostics(meta, node.name), bootstrap, valueContext));
        for (const ref of declarationRefs) {
            const decl = this._toR3Reference(ref.getOriginForDiagnostics(meta, node.name), ref, valueContext);
            declarations.push(decl);
            if (exportedNodes.has(ref.node)) {
                exportedDeclarations.push(decl.type);
            }
        }
        const imports = importRefs.map((imp) => this._toR3Reference(imp.getOriginForDiagnostics(meta, node.name), imp, valueContext));
        const exports = exportRefs.map((exp) => this._toR3Reference(exp.getOriginForDiagnostics(meta, node.name), exp, valueContext));
        const isForwardReference = (ref) => checker.isExpressionForwardReference(ref.value, node.name, valueContext);
        const containsForwardDecls = bootstrap.some(isForwardReference) ||
            declarations.some(isForwardReference) ||
            imports.some(isForwardReference) ||
            exports.some(isForwardReference);
        const type = checker.wrapTypeReference(this.reflector, node);
        let ngModuleMetadata;
        if (this.compilationMode === checker.CompilationMode.LOCAL) {
            ngModuleMetadata = {
                kind: compiler.R3NgModuleMetadataKind.Local,
                type,
                bootstrapExpression: rawBootstrap ? new compiler.WrappedNodeExpr(rawBootstrap) : null,
                declarationsExpression: rawDeclarations ? new compiler.WrappedNodeExpr(rawDeclarations) : null,
                exportsExpression: rawExports ? new compiler.WrappedNodeExpr(rawExports) : null,
                importsExpression: rawImports ? new compiler.WrappedNodeExpr(rawImports) : null,
                id,
                // Use `ɵɵsetNgModuleScope` to patch selector scopes onto the generated definition in a
                // tree-shakeable way.
                selectorScopeMode: compiler.R3SelectorScopeMode.SideEffect,
                // TODO: to be implemented as a part of FW-1004.
                schemas: [],
            };
        }
        else {
            ngModuleMetadata = {
                kind: compiler.R3NgModuleMetadataKind.Global,
                type,
                bootstrap,
                declarations,
                publicDeclarationTypes: this.onlyPublishPublicTypings ? exportedDeclarations : null,
                exports,
                imports,
                // Imported types are generally private, so include them unless restricting the .d.ts emit
                // to only public types.
                includeImportTypes: !this.onlyPublishPublicTypings,
                containsForwardDecls,
                id,
                // Use `ɵɵsetNgModuleScope` to patch selector scopes onto the generated definition in a
                // tree-shakeable way.
                selectorScopeMode: this.includeSelectorScope
                    ? compiler.R3SelectorScopeMode.SideEffect
                    : compiler.R3SelectorScopeMode.Omit,
                // TODO: to be implemented as a part of FW-1004.
                schemas: [],
            };
        }
        const rawProviders = ngModule.has('providers') ? ngModule.get('providers') : null;
        let wrappedProviders = null;
        // In most cases the providers will be an array literal. Check if it has any elements
        // and don't include the providers if it doesn't which saves us a few bytes.
        if (rawProviders !== null &&
            (!ts.isArrayLiteralExpression(rawProviders) || rawProviders.elements.length > 0)) {
            wrappedProviders = new compiler.WrappedNodeExpr(this.annotateForClosureCompiler
                ? checker.wrapFunctionExpressionsInParens(rawProviders)
                : rawProviders);
        }
        const topLevelImports = [];
        if (this.compilationMode !== checker.CompilationMode.LOCAL && ngModule.has('imports')) {
            const rawImports = checker.unwrapExpression(ngModule.get('imports'));
            let topLevelExpressions = [];
            if (ts.isArrayLiteralExpression(rawImports)) {
                for (const element of rawImports.elements) {
                    if (ts.isSpreadElement(element)) {
                        // Because `imports` allows nested arrays anyway, a spread expression (`...foo`) can be
                        // treated the same as a direct reference to `foo`.
                        topLevelExpressions.push(element.expression);
                        continue;
                    }
                    topLevelExpressions.push(element);
                }
            }
            else {
                // Treat the whole `imports` expression as top-level.
                topLevelExpressions.push(rawImports);
            }
            let absoluteIndex = 0;
            for (const importExpr of topLevelExpressions) {
                const resolved = this.evaluator.evaluate(importExpr, moduleResolvers);
                const { references, hasModuleWithProviders } = this.resolveTypeList(importExpr, [resolved], node.name.text, 'imports', absoluteIndex, 
                /* allowUnresolvedReferences */ false);
                absoluteIndex += references.length;
                topLevelImports.push({
                    expression: importExpr,
                    resolvedReferences: references,
                    hasModuleWithProviders,
                });
            }
        }
        const injectorMetadata = {
            name,
            type,
            providers: wrappedProviders,
            imports: [],
        };
        if (this.compilationMode === checker.CompilationMode.LOCAL) {
            // Adding NgModule's raw imports/exports to the injector's imports field in local compilation
            // mode.
            for (const exp of [rawImports, rawExports]) {
                if (exp === null) {
                    continue;
                }
                if (ts.isArrayLiteralExpression(exp)) {
                    // If array expression then add it entry-by-entry to the injector imports
                    if (exp.elements) {
                        injectorMetadata.imports.push(...exp.elements.map((n) => new compiler.WrappedNodeExpr(n)));
                    }
                }
                else {
                    // if not array expression then add it as is to the injector's imports field.
                    injectorMetadata.imports.push(new compiler.WrappedNodeExpr(exp));
                }
            }
        }
        const factoryMetadata = {
            name,
            type,
            typeArgumentCount: 0,
            deps: checker.getValidConstructorDependencies(node, this.reflector, this.isCore),
            target: compiler.FactoryTarget.NgModule,
        };
        // Remote scoping is used when adding imports to a component file would create a cycle. In such
        // circumstances the component scope is monkey-patched from the NgModule file instead.
        //
        // However, if the NgModule itself has a cycle with the desired component/directive
        // reference(s), then we need to be careful. This can happen for example if an NgModule imports
        // a standalone component and the component also imports the NgModule.
        //
        // In this case, it'd be tempting to rely on the compiler's cycle detector to automatically put
        // such circular references behind a function/closure. This requires global knowledge of the
        // import graph though, and we don't want to depend on such techniques for new APIs like
        // standalone components.
        //
        // Instead, we look for `forwardRef`s in the NgModule dependencies - an explicit signal from the
        // user that a reference may not be defined until a circular import is resolved. If an NgModule
        // contains forward-referenced declarations or imports, we assume that remotely scoped
        // components should also guard against cycles using a closure-wrapped scope.
        //
        // The actual detection here is done heuristically. The compiler doesn't actually know whether
        // any given `Reference` came from a `forwardRef`, but it does know when a `Reference` came from
        // a `ForeignFunctionResolver` _like_ the `forwardRef` resolver. So we know when it's safe to
        // not use a closure, and will use one just in case otherwise.
        const remoteScopesMayRequireCycleProtection = declarationRefs.some(isSyntheticReference) || importRefs.some(isSyntheticReference);
        return {
            diagnostics: diagnostics.length > 0 ? diagnostics : undefined,
            analysis: {
                id,
                schemas,
                mod: ngModuleMetadata,
                inj: injectorMetadata,
                fac: factoryMetadata,
                declarations: declarationRefs,
                rawDeclarations,
                imports: topLevelImports,
                rawImports,
                importRefs,
                exports: exportRefs,
                rawExports,
                providers: rawProviders,
                providersRequiringFactory: rawProviders
                    ? checker.resolveProvidersRequiringFactory(rawProviders, this.reflector, this.evaluator)
                    : null,
                classMetadata: this.includeClassMetadata
                    ? extractClassMetadata(node, this.reflector, this.isCore, this.annotateForClosureCompiler)
                    : null,
                factorySymbolName: node.name.text,
                remoteScopesMayRequireCycleProtection,
                decorator: decorator?.node ?? null,
            },
        };
    }
    symbol(node, analysis) {
        return new NgModuleSymbol(node, analysis.providers !== null);
    }
    register(node, analysis) {
        // Register this module's information with the LocalModuleScopeRegistry. This ensures that
        // during the compile() phase, the module's metadata is available for selector scope
        // computation.
        this.metaRegistry.registerNgModuleMetadata({
            kind: checker.MetaKind.NgModule,
            ref: new checker.Reference(node),
            schemas: analysis.schemas,
            declarations: analysis.declarations,
            imports: analysis.importRefs,
            exports: analysis.exports,
            rawDeclarations: analysis.rawDeclarations,
            rawImports: analysis.rawImports,
            rawExports: analysis.rawExports,
            decorator: analysis.decorator,
            mayDeclareProviders: analysis.providers !== null,
            isPoisoned: false,
        });
        this.injectableRegistry.registerInjectable(node, {
            ctorDeps: analysis.fac.deps,
        });
    }
    resolve(node, analysis) {
        if (this.compilationMode === checker.CompilationMode.LOCAL) {
            return {};
        }
        const scope = this.scopeRegistry.getScopeOfModule(node);
        const diagnostics = [];
        const scopeDiagnostics = this.scopeRegistry.getDiagnosticsOfModule(node);
        if (scopeDiagnostics !== null) {
            diagnostics.push(...scopeDiagnostics);
        }
        if (analysis.providersRequiringFactory !== null) {
            const providerDiagnostics = checker.getProviderDiagnostics(analysis.providersRequiringFactory, analysis.providers, this.injectableRegistry);
            diagnostics.push(...providerDiagnostics);
        }
        const data = {
            injectorImports: [],
        };
        // Add all top-level imports from the `imports` field to the injector imports.
        for (const topLevelImport of analysis.imports) {
            if (topLevelImport.hasModuleWithProviders) {
                // We have no choice but to emit expressions which contain MWPs, as we cannot filter on
                // individual references.
                data.injectorImports.push(new compiler.WrappedNodeExpr(topLevelImport.expression));
                continue;
            }
            const refsToEmit = [];
            let symbol = null;
            if (this.semanticDepGraphUpdater !== null) {
                const sym = this.semanticDepGraphUpdater.getSymbol(node);
                if (sym instanceof NgModuleSymbol) {
                    symbol = sym;
                }
            }
            for (const ref of topLevelImport.resolvedReferences) {
                const dirMeta = this.metaReader.getDirectiveMetadata(ref);
                if (dirMeta !== null) {
                    if (!dirMeta.isComponent) {
                        // Skip emit of directives in imports - directives can't carry providers.
                        continue;
                    }
                    // Check whether this component has providers.
                    const mayExportProviders = this.exportedProviderStatusResolver.mayExportProviders(dirMeta.ref, (importRef) => {
                        // We need to keep track of which transitive imports were used to decide
                        // `mayExportProviders`, since if those change in a future compilation this
                        // NgModule will need to be re-emitted.
                        if (symbol !== null && this.semanticDepGraphUpdater !== null) {
                            const importSymbol = this.semanticDepGraphUpdater.getSymbol(importRef.node);
                            symbol.addTransitiveImportFromStandaloneComponent(importSymbol);
                        }
                    });
                    if (!mayExportProviders) {
                        // Skip emit of components that don't carry providers.
                        continue;
                    }
                }
                const pipeMeta = dirMeta === null ? this.metaReader.getPipeMetadata(ref) : null;
                if (pipeMeta !== null) {
                    // Skip emit of pipes in imports - pipes can't carry providers.
                    continue;
                }
                refsToEmit.push(ref);
            }
            if (refsToEmit.length === topLevelImport.resolvedReferences.length) {
                // All references within this top-level import should be emitted, so just use the user's
                // expression.
                data.injectorImports.push(new compiler.WrappedNodeExpr(topLevelImport.expression));
            }
            else {
                // Some references have been filtered out. Emit references to individual classes.
                const context = node.getSourceFile();
                for (const ref of refsToEmit) {
                    const emittedRef = this.refEmitter.emit(ref, context);
                    checker.assertSuccessfulReferenceEmit(emittedRef, topLevelImport.expression, 'class');
                    data.injectorImports.push(emittedRef.expression);
                }
            }
        }
        if (scope !== null && !scope.compilation.isPoisoned) {
            // Using the scope information, extend the injector's imports using the modules that are
            // specified as module exports.
            const context = checker.getSourceFile(node);
            for (const exportRef of analysis.exports) {
                if (isNgModule(exportRef.node, scope.compilation)) {
                    const type = this.refEmitter.emit(exportRef, context);
                    checker.assertSuccessfulReferenceEmit(type, node, 'NgModule');
                    data.injectorImports.push(type.expression);
                }
            }
            for (const decl of analysis.declarations) {
                const dirMeta = this.metaReader.getDirectiveMetadata(decl);
                if (dirMeta !== null) {
                    const refType = dirMeta.isComponent ? 'Component' : 'Directive';
                    if (dirMeta.selector === null) {
                        throw new checker.FatalDiagnosticError(checker.ErrorCode.DIRECTIVE_MISSING_SELECTOR, decl.node, `${refType} ${decl.node.name.text} has no selector, please add it!`);
                    }
                    continue;
                }
            }
        }
        if (diagnostics.length > 0) {
            return { diagnostics };
        }
        if (scope === null ||
            scope.compilation.isPoisoned ||
            scope.exported.isPoisoned ||
            scope.reexports === null) {
            return { data };
        }
        else {
            return {
                data,
                reexports: scope.reexports,
            };
        }
    }
    compileFull(node, { inj, mod, fac, classMetadata, declarations, remoteScopesMayRequireCycleProtection, }, { injectorImports }) {
        const factoryFn = compileNgFactoryDefField(fac);
        const ngInjectorDef = compiler.compileInjector({
            ...inj,
            imports: injectorImports,
        });
        const ngModuleDef = compiler.compileNgModule(mod);
        const statements = ngModuleDef.statements;
        const metadata = classMetadata !== null ? compileClassMetadata(classMetadata) : null;
        this.insertMetadataStatement(statements, metadata);
        this.appendRemoteScopingStatements(statements, node, declarations, remoteScopesMayRequireCycleProtection);
        return this.compileNgModule(factoryFn, ngInjectorDef, ngModuleDef);
    }
    compilePartial(node, { inj, fac, mod, classMetadata }, { injectorImports }) {
        const factoryFn = compileDeclareFactory(fac);
        const injectorDef = compileDeclareInjectorFromMetadata({
            ...inj,
            imports: injectorImports,
        });
        const ngModuleDef = compileDeclareNgModuleFromMetadata(mod);
        const metadata = classMetadata !== null ? compileDeclareClassMetadata(classMetadata) : null;
        this.insertMetadataStatement(ngModuleDef.statements, metadata);
        // NOTE: no remote scoping required as this is banned in partial compilation.
        return this.compileNgModule(factoryFn, injectorDef, ngModuleDef);
    }
    compileLocal(node, { inj, mod, fac, classMetadata, declarations, remoteScopesMayRequireCycleProtection, }) {
        const factoryFn = compileNgFactoryDefField(fac);
        const ngInjectorDef = compiler.compileInjector({
            ...inj,
        });
        const ngModuleDef = compiler.compileNgModule(mod);
        const statements = ngModuleDef.statements;
        const metadata = classMetadata !== null ? compileClassMetadata(classMetadata) : null;
        this.insertMetadataStatement(statements, metadata);
        this.appendRemoteScopingStatements(statements, node, declarations, remoteScopesMayRequireCycleProtection);
        return this.compileNgModule(factoryFn, ngInjectorDef, ngModuleDef);
    }
    /**
     * Add class metadata statements, if provided, to the `ngModuleStatements`.
     */
    insertMetadataStatement(ngModuleStatements, metadata) {
        if (metadata !== null) {
            ngModuleStatements.unshift(metadata.toStmt());
        }
    }
    /**
     * Add remote scoping statements, as needed, to the `ngModuleStatements`.
     */
    appendRemoteScopingStatements(ngModuleStatements, node, declarations, remoteScopesMayRequireCycleProtection) {
        // Local compilation mode generates its own runtimes to compute the dependencies. So there no
        // need to add remote scope statements (which also conflicts with local compilation runtimes)
        if (this.compilationMode === checker.CompilationMode.LOCAL) {
            return;
        }
        const context = checker.getSourceFile(node);
        for (const decl of declarations) {
            const remoteScope = this.scopeRegistry.getRemoteScope(decl.node);
            if (remoteScope !== null) {
                const directives = remoteScope.directives.map((directive) => {
                    const type = this.refEmitter.emit(directive, context);
                    checker.assertSuccessfulReferenceEmit(type, node, 'directive');
                    return type.expression;
                });
                const pipes = remoteScope.pipes.map((pipe) => {
                    const type = this.refEmitter.emit(pipe, context);
                    checker.assertSuccessfulReferenceEmit(type, node, 'pipe');
                    return type.expression;
                });
                const directiveArray = new compiler.LiteralArrayExpr(directives);
                const pipesArray = new compiler.LiteralArrayExpr(pipes);
                const directiveExpr = remoteScopesMayRequireCycleProtection && directives.length > 0
                    ? new compiler.FunctionExpr([], [new compiler.ReturnStatement(directiveArray)])
                    : directiveArray;
                const pipesExpr = remoteScopesMayRequireCycleProtection && pipes.length > 0
                    ? new compiler.FunctionExpr([], [new compiler.ReturnStatement(pipesArray)])
                    : pipesArray;
                const componentType = this.refEmitter.emit(decl, context);
                checker.assertSuccessfulReferenceEmit(componentType, node, 'component');
                const declExpr = componentType.expression;
                const setComponentScope = new compiler.ExternalExpr(compiler.Identifiers.setComponentScope);
                const callExpr = new compiler.InvokeFunctionExpr(setComponentScope, [
                    declExpr,
                    directiveExpr,
                    pipesExpr,
                ]);
                ngModuleStatements.push(callExpr.toStmt());
            }
        }
    }
    compileNgModule(factoryFn, injectorDef, ngModuleDef) {
        const res = [
            factoryFn,
            {
                name: 'ɵmod',
                initializer: ngModuleDef.expression,
                statements: ngModuleDef.statements,
                type: ngModuleDef.type,
                deferrableImports: null,
            },
            {
                name: 'ɵinj',
                initializer: injectorDef.expression,
                statements: injectorDef.statements,
                type: injectorDef.type,
                deferrableImports: null,
            },
        ];
        return res;
    }
    _toR3Reference(origin, valueRef, valueContext) {
        if (valueRef.hasOwningModuleGuess) {
            return checker.toR3Reference(origin, valueRef, valueContext, this.refEmitter);
        }
        else {
            return checker.toR3Reference(origin, valueRef, valueContext, this.refEmitter);
        }
    }
    // Verify that a "Declaration" reference is a `ClassDeclaration` reference.
    isClassDeclarationReference(ref) {
        return this.reflector.isClass(ref.node);
    }
    /**
     * Compute a list of `Reference`s from a resolved metadata value.
     */
    resolveTypeList(expr, resolvedList, className, arrayName, absoluteIndex, allowUnresolvedReferences) {
        let hasModuleWithProviders = false;
        const refList = [];
        const dynamicValueSet = new Set();
        if (!Array.isArray(resolvedList)) {
            if (allowUnresolvedReferences) {
                return {
                    references: [],
                    hasModuleWithProviders: false,
                    dynamicValues: [],
                };
            }
            throw checker.createValueHasWrongTypeError(expr, resolvedList, `Expected array when reading the NgModule.${arrayName} of ${className}`);
        }
        for (let idx = 0; idx < resolvedList.length; idx++) {
            let entry = resolvedList[idx];
            // Unwrap ModuleWithProviders for modules that are locally declared (and thus static
            // resolution was able to descend into the function and return an object literal, a Map).
            if (entry instanceof checker.SyntheticValue && isResolvedModuleWithProviders(entry)) {
                entry = entry.value.ngModule;
                hasModuleWithProviders = true;
            }
            else if (entry instanceof Map && entry.has('ngModule')) {
                entry = entry.get('ngModule');
                hasModuleWithProviders = true;
            }
            if (Array.isArray(entry)) {
                // Recurse into nested arrays.
                const recursiveResult = this.resolveTypeList(expr, entry, className, arrayName, absoluteIndex, allowUnresolvedReferences);
                refList.push(...recursiveResult.references);
                for (const d of recursiveResult.dynamicValues) {
                    dynamicValueSet.add(d);
                }
                absoluteIndex += recursiveResult.references.length;
                hasModuleWithProviders = hasModuleWithProviders || recursiveResult.hasModuleWithProviders;
            }
            else if (entry instanceof checker.Reference) {
                if (!this.isClassDeclarationReference(entry)) {
                    throw checker.createValueHasWrongTypeError(entry.node, entry, `Value at position ${absoluteIndex} in the NgModule.${arrayName} of ${className} is not a class`);
                }
                refList.push(entry);
                absoluteIndex += 1;
            }
            else if (entry instanceof checker.DynamicValue && allowUnresolvedReferences) {
                dynamicValueSet.add(entry);
                continue;
            }
            else {
                // TODO(alxhub): Produce a better diagnostic here - the array index may be an inner array.
                throw checker.createValueHasWrongTypeError(expr, entry, `Value at position ${absoluteIndex} in the NgModule.${arrayName} of ${className} is not a reference`);
            }
        }
        return {
            references: refList,
            hasModuleWithProviders,
            dynamicValues: [...dynamicValueSet],
        };
    }
}
function isNgModule(node, compilation) {
    return !compilation.dependencies.some((dep) => dep.ref.node === node);
}
/**
 * Checks whether the given `ts.Expression` is the expression `module.id`.
 */
function isModuleIdExpression(expr) {
    return (ts.isPropertyAccessExpression(expr) &&
        ts.isIdentifier(expr.expression) &&
        expr.expression.text === 'module' &&
        expr.name.text === 'id');
}
/**
 * Helper method to produce a diagnostics for a situation when a standalone component
 * is referenced in the `@NgModule.bootstrap` array.
 */
function makeStandaloneBootstrapDiagnostic(ngModuleClass, bootstrappedClassRef, rawBootstrapExpr) {
    const componentClassName = bootstrappedClassRef.node.name.text;
    // Note: this error message should be aligned with the one produced by JIT.
    const message = //
     `The \`${componentClassName}\` class is a standalone component, which can ` +
        `not be used in the \`@NgModule.bootstrap\` array. Use the \`bootstrapApplication\` ` +
        `function for bootstrap instead.`;
    const relatedInformation = [
        checker.makeRelatedInformation(ngModuleClass, `The 'bootstrap' array is present on this NgModule.`),
    ];
    return checker.makeDiagnostic(checker.ErrorCode.NGMODULE_BOOTSTRAP_IS_STANDALONE, getDiagnosticNode(bootstrappedClassRef, rawBootstrapExpr), message, relatedInformation);
}
function isSyntheticReference(ref) {
    return ref.synthetic;
}

/**
 * Generate a diagnostic related information object that describes a potential cyclic import path.
 */
function makeCyclicImportInfo(ref, type, cycle) {
    const name = ref.debugName || '(unknown)';
    const path = cycle
        .getPath()
        .map((sf) => sf.fileName)
        .join(' -> ');
    const message = `The ${type} '${name}' is used in the template but importing it would create a cycle: `;
    return checker.makeRelatedInformation(ref.node, message + path);
}
/**
 * Checks whether a selector is a valid custom element tag name.
 * Based loosely on https://github.com/sindresorhus/validate-element-name.
 */
function checkCustomElementSelectorForErrors(selector) {
    // Avoid flagging components with an attribute or class selector. This isn't bulletproof since it
    // won't catch cases like `foo[]bar`, but we don't need it to be. This is mainly to avoid flagging
    // something like `foo-bar[baz]` incorrectly.
    if (selector.includes('.') || (selector.includes('[') && selector.includes(']'))) {
        return null;
    }
    if (!/^[a-z]/.test(selector)) {
        return 'Selector of a ShadowDom-encapsulated component must start with a lower case letter.';
    }
    if (/[A-Z]/.test(selector)) {
        return 'Selector of a ShadowDom-encapsulated component must all be in lower case.';
    }
    if (!selector.includes('-')) {
        return 'Selector of a component that uses ViewEncapsulation.ShadowDom must contain a hyphen.';
    }
    return null;
}

/** Determines the node to use for debugging purposes for the given TemplateDeclaration. */
function getTemplateDeclarationNodeForError(declaration) {
    return declaration.isInline ? declaration.expression : declaration.templateUrlExpression;
}
function extractTemplate(node, template, evaluator, depTracker, resourceLoader, options, compilationMode) {
    if (template.isInline) {
        let sourceStr;
        let sourceParseRange = null;
        let templateContent;
        let sourceMapping;
        let escapedString = false;
        let sourceMapUrl;
        // We only support SourceMaps for inline templates that are simple string literals.
        if (ts.isStringLiteral(template.expression) ||
            ts.isNoSubstitutionTemplateLiteral(template.expression)) {
            // the start and end of the `templateExpr` node includes the quotation marks, which we must
            // strip
            sourceParseRange = getTemplateRange(template.expression);
            sourceStr = template.expression.getSourceFile().text;
            templateContent = template.expression.text;
            escapedString = true;
            sourceMapping = {
                type: 'direct',
                node: template.expression,
            };
            sourceMapUrl = template.resolvedTemplateUrl;
        }
        else {
            const resolvedTemplate = evaluator.evaluate(template.expression);
            // The identifier used for @Component.template cannot be resolved in local compilation mode. An error specific to this situation is generated.
            checker.assertLocalCompilationUnresolvedConst(compilationMode, resolvedTemplate, template.expression, 'Unresolved identifier found for @Component.template field! ' +
                'Did you import this identifier from a file outside of the compilation unit? ' +
                'This is not allowed when Angular compiler runs in local mode. ' +
                'Possible solutions: 1) Move the declaration into a file within the ' +
                'compilation unit, 2) Inline the template, 3) Move the template into ' +
                'a separate .html file and include it using @Component.templateUrl');
            if (typeof resolvedTemplate !== 'string') {
                throw checker.createValueHasWrongTypeError(template.expression, resolvedTemplate, 'template must be a string');
            }
            // We do not parse the template directly from the source file using a lexer range, so
            // the template source and content are set to the statically resolved template.
            sourceStr = resolvedTemplate;
            templateContent = resolvedTemplate;
            sourceMapping = {
                type: 'indirect',
                node: template.expression,
                componentClass: node,
                template: templateContent,
            };
            // Indirect templates cannot be mapped to a particular byte range of any input file, since
            // they're computed by expressions that may span many files. Don't attempt to map them back
            // to a given file.
            sourceMapUrl = null;
        }
        return {
            ...parseExtractedTemplate(template, sourceStr, sourceParseRange, escapedString, sourceMapUrl, options),
            content: templateContent,
            sourceMapping,
            declaration: template,
        };
    }
    else {
        const templateContent = resourceLoader.load(template.resolvedTemplateUrl);
        if (depTracker !== null) {
            depTracker.addResourceDependency(node.getSourceFile(), checker.absoluteFrom(template.resolvedTemplateUrl));
        }
        return {
            ...parseExtractedTemplate(template, 
            /* sourceStr */ templateContent, 
            /* sourceParseRange */ null, 
            /* escapedString */ false, 
            /* sourceMapUrl */ template.resolvedTemplateUrl, options),
            content: templateContent,
            sourceMapping: {
                type: 'external',
                componentClass: node,
                node: template.templateUrlExpression,
                template: templateContent,
                templateUrl: template.resolvedTemplateUrl,
            },
            declaration: template,
        };
    }
}
function createEmptyTemplate(componentClass, component, containingFile) {
    const templateUrl = component.get('templateUrl');
    const template = component.get('template');
    return {
        content: '',
        diagNodes: [],
        nodes: [],
        errors: null,
        styles: [],
        styleUrls: [],
        ngContentSelectors: [],
        file: new compiler.ParseSourceFile('', ''),
        sourceMapping: templateUrl
            ? { type: 'direct', node: template }
            : {
                type: 'external',
                componentClass,
                node: templateUrl,
                template: '',
                templateUrl: 'missing.ng.html',
            },
        declaration: templateUrl
            ? {
                isInline: false,
                interpolationConfig: compiler.InterpolationConfig.fromArray(null),
                preserveWhitespaces: false,
                templateUrlExpression: templateUrl,
                templateUrl: 'missing.ng.html',
                resolvedTemplateUrl: '/missing.ng.html',
            }
            : {
                isInline: true,
                interpolationConfig: compiler.InterpolationConfig.fromArray(null),
                preserveWhitespaces: false,
                expression: template,
                templateUrl: containingFile,
                resolvedTemplateUrl: containingFile,
            },
    };
}
function parseExtractedTemplate(template, sourceStr, sourceParseRange, escapedString, sourceMapUrl, options) {
    // We always normalize line endings if the template has been escaped (i.e. is inline).
    const i18nNormalizeLineEndingsInICUs = escapedString || options.i18nNormalizeLineEndingsInICUs;
    const commonParseOptions = {
        interpolationConfig: template.interpolationConfig,
        range: sourceParseRange ?? undefined,
        enableI18nLegacyMessageIdFormat: options.enableI18nLegacyMessageIdFormat,
        i18nNormalizeLineEndingsInICUs,
        alwaysAttemptHtmlToR3AstConversion: options.usePoisonedData,
        escapedString,
        enableBlockSyntax: options.enableBlockSyntax,
        enableLetSyntax: options.enableLetSyntax,
    };
    const parsedTemplate = compiler.parseTemplate(sourceStr, sourceMapUrl ?? '', {
        ...commonParseOptions,
        preserveWhitespaces: template.preserveWhitespaces,
        preserveSignificantWhitespace: options.preserveSignificantWhitespace,
    });
    // Unfortunately, the primary parse of the template above may not contain accurate source map
    // information. If used directly, it would result in incorrect code locations in template
    // errors, etc. There are three main problems:
    //
    // 1. `preserveWhitespaces: false` or `preserveSignificantWhitespace: false` annihilates the
    //    correctness of template source mapping, as the whitespace transformation changes the
    //    contents of HTML text nodes before they're parsed into Angular expressions.
    // 2. `preserveLineEndings: false` causes growing misalignments in templates that use '\r\n'
    //    line endings, by normalizing them to '\n'.
    // 3. By default, the template parser strips leading trivia characters (like spaces, tabs, and
    //    newlines). This also destroys source mapping information.
    //
    // In order to guarantee the correctness of diagnostics, templates are parsed a second time
    // with the above options set to preserve source mappings.
    const { nodes: diagNodes } = compiler.parseTemplate(sourceStr, sourceMapUrl ?? '', {
        ...commonParseOptions,
        preserveWhitespaces: true,
        preserveLineEndings: true,
        preserveSignificantWhitespace: true,
        leadingTriviaChars: [],
    });
    return {
        ...parsedTemplate,
        diagNodes,
        file: new compiler.ParseSourceFile(sourceStr, sourceMapUrl ?? ''),
    };
}
function parseTemplateDeclaration(node, decorator, component, containingFile, evaluator, depTracker, resourceLoader, defaultPreserveWhitespaces) {
    let preserveWhitespaces = defaultPreserveWhitespaces;
    if (component.has('preserveWhitespaces')) {
        const expr = component.get('preserveWhitespaces');
        const value = evaluator.evaluate(expr);
        if (typeof value !== 'boolean') {
            throw checker.createValueHasWrongTypeError(expr, value, 'preserveWhitespaces must be a boolean');
        }
        preserveWhitespaces = value;
    }
    let interpolationConfig = compiler.DEFAULT_INTERPOLATION_CONFIG;
    if (component.has('interpolation')) {
        const expr = component.get('interpolation');
        const value = evaluator.evaluate(expr);
        if (!Array.isArray(value) ||
            value.length !== 2 ||
            !value.every((element) => typeof element === 'string')) {
            throw checker.createValueHasWrongTypeError(expr, value, 'interpolation must be an array with 2 elements of string type');
        }
        interpolationConfig = compiler.InterpolationConfig.fromArray(value);
    }
    if (component.has('templateUrl')) {
        const templateUrlExpr = component.get('templateUrl');
        const templateUrl = evaluator.evaluate(templateUrlExpr);
        if (typeof templateUrl !== 'string') {
            throw checker.createValueHasWrongTypeError(templateUrlExpr, templateUrl, 'templateUrl must be a string');
        }
        try {
            const resourceUrl = resourceLoader.resolve(templateUrl, containingFile);
            return {
                isInline: false,
                interpolationConfig,
                preserveWhitespaces,
                templateUrl,
                templateUrlExpression: templateUrlExpr,
                resolvedTemplateUrl: resourceUrl,
            };
        }
        catch (e) {
            if (depTracker !== null) {
                // The analysis of this file cannot be re-used if the template URL could
                // not be resolved. Future builds should re-analyze and re-attempt resolution.
                depTracker.recordDependencyAnalysisFailure(node.getSourceFile());
            }
            throw makeResourceNotFoundError(templateUrl, templateUrlExpr, 0 /* ResourceTypeForDiagnostics.Template */);
        }
    }
    else if (component.has('template')) {
        return {
            isInline: true,
            interpolationConfig,
            preserveWhitespaces,
            expression: component.get('template'),
            templateUrl: containingFile,
            resolvedTemplateUrl: containingFile,
        };
    }
    else {
        throw new checker.FatalDiagnosticError(checker.ErrorCode.COMPONENT_MISSING_TEMPLATE, decorator.node, 'component is missing a template');
    }
}
function preloadAndParseTemplate(evaluator, resourceLoader, depTracker, preanalyzeTemplateCache, node, decorator, component, containingFile, defaultPreserveWhitespaces, options, compilationMode) {
    if (component.has('templateUrl')) {
        // Extract the templateUrl and preload it.
        const templateUrlExpr = component.get('templateUrl');
        const templateUrl = evaluator.evaluate(templateUrlExpr);
        if (typeof templateUrl !== 'string') {
            throw checker.createValueHasWrongTypeError(templateUrlExpr, templateUrl, 'templateUrl must be a string');
        }
        try {
            const resourceUrl = resourceLoader.resolve(templateUrl, containingFile);
            const templatePromise = resourceLoader.preload(resourceUrl, {
                type: 'template',
                containingFile,
                className: node.name.text,
            });
            // If the preload worked, then actually load and parse the template, and wait for any
            // style URLs to resolve.
            if (templatePromise !== undefined) {
                return templatePromise.then(() => {
                    const templateDecl = parseTemplateDeclaration(node, decorator, component, containingFile, evaluator, depTracker, resourceLoader, defaultPreserveWhitespaces);
                    const template = extractTemplate(node, templateDecl, evaluator, depTracker, resourceLoader, options, compilationMode);
                    preanalyzeTemplateCache.set(node, template);
                    return template;
                });
            }
            else {
                return Promise.resolve(null);
            }
        }
        catch (e) {
            if (depTracker !== null) {
                // The analysis of this file cannot be re-used if the template URL could
                // not be resolved. Future builds should re-analyze and re-attempt resolution.
                depTracker.recordDependencyAnalysisFailure(node.getSourceFile());
            }
            throw makeResourceNotFoundError(templateUrl, templateUrlExpr, 0 /* ResourceTypeForDiagnostics.Template */);
        }
    }
    else {
        const templateDecl = parseTemplateDeclaration(node, decorator, component, containingFile, evaluator, depTracker, resourceLoader, defaultPreserveWhitespaces);
        const template = extractTemplate(node, templateDecl, evaluator, depTracker, resourceLoader, options, compilationMode);
        preanalyzeTemplateCache.set(node, template);
        return Promise.resolve(template);
    }
}
function getTemplateRange(templateExpr) {
    const startPos = templateExpr.getStart() + 1;
    const { line, character } = ts.getLineAndCharacterOfPosition(templateExpr.getSourceFile(), startPos);
    return {
        startPos,
        startLine: line,
        startCol: character,
        endPos: templateExpr.getEnd() - 1,
    };
}
function makeResourceNotFoundError(file, nodeForError, resourceType) {
    let errorText;
    switch (resourceType) {
        case 0 /* ResourceTypeForDiagnostics.Template */:
            errorText = `Could not find template file '${file}'.`;
            break;
        case 1 /* ResourceTypeForDiagnostics.StylesheetFromTemplate */:
            errorText = `Could not find stylesheet file '${file}' linked from the template.`;
            break;
        case 2 /* ResourceTypeForDiagnostics.StylesheetFromDecorator */:
            errorText = `Could not find stylesheet file '${file}'.`;
            break;
    }
    return new checker.FatalDiagnosticError(checker.ErrorCode.COMPONENT_RESOURCE_NOT_FOUND, nodeForError, errorText);
}
/**
 * Transforms the given decorator to inline external resources. i.e. if the decorator
 * resolves to `@Component`, the `templateUrl` and `styleUrls` metadata fields will be
 * transformed to their semantically-equivalent inline variants.
 *
 * This method is used for serializing decorators into the class metadata. The emitted
 * class metadata should not refer to external resources as this would be inconsistent
 * with the component definitions/declarations which already inline external resources.
 *
 * Additionally, the references to external resources would require libraries to ship
 * external resources exclusively for the class metadata.
 */
function transformDecoratorResources(dec, component, styles, template) {
    if (dec.name !== 'Component') {
        return dec;
    }
    // If no external resources are referenced, preserve the original decorator
    // for the best source map experience when the decorator is emitted in TS.
    if (!component.has('templateUrl') &&
        !component.has('styleUrls') &&
        !component.has('styleUrl') &&
        !component.has('styles')) {
        return dec;
    }
    const metadata = new Map(component);
    // Set the `template` property if the `templateUrl` property is set.
    if (metadata.has('templateUrl')) {
        metadata.delete('templateUrl');
        metadata.set('template', ts.factory.createStringLiteral(template.content));
    }
    if (metadata.has('styleUrls') || metadata.has('styleUrl') || metadata.has('styles')) {
        metadata.delete('styles');
        metadata.delete('styleUrls');
        metadata.delete('styleUrl');
        if (styles.length > 0) {
            const styleNodes = styles.reduce((result, style) => {
                if (style.trim().length > 0) {
                    result.push(ts.factory.createStringLiteral(style));
                }
                return result;
            }, []);
            if (styleNodes.length > 0) {
                metadata.set('styles', ts.factory.createArrayLiteralExpression(styleNodes));
            }
        }
    }
    // Convert the metadata to TypeScript AST object literal element nodes.
    const newMetadataFields = [];
    for (const [name, value] of metadata.entries()) {
        newMetadataFields.push(ts.factory.createPropertyAssignment(name, value));
    }
    // Return the original decorator with the overridden metadata argument.
    return { ...dec, args: [ts.factory.createObjectLiteralExpression(newMetadataFields)] };
}
function extractComponentStyleUrls(evaluator, component) {
    const styleUrlsExpr = component.get('styleUrls');
    const styleUrlExpr = component.get('styleUrl');
    if (styleUrlsExpr !== undefined && styleUrlExpr !== undefined) {
        throw new checker.FatalDiagnosticError(checker.ErrorCode.COMPONENT_INVALID_STYLE_URLS, styleUrlExpr, '@Component cannot define both `styleUrl` and `styleUrls`. ' +
            'Use `styleUrl` if the component has one stylesheet, or `styleUrls` if it has multiple');
    }
    if (styleUrlsExpr !== undefined) {
        return extractStyleUrlsFromExpression(evaluator, component.get('styleUrls'));
    }
    if (styleUrlExpr !== undefined) {
        const styleUrl = evaluator.evaluate(styleUrlExpr);
        if (typeof styleUrl !== 'string') {
            throw checker.createValueHasWrongTypeError(styleUrlExpr, styleUrl, 'styleUrl must be a string');
        }
        return [
            {
                url: styleUrl,
                source: 2 /* ResourceTypeForDiagnostics.StylesheetFromDecorator */,
                expression: styleUrlExpr,
            },
        ];
    }
    return [];
}
function extractStyleUrlsFromExpression(evaluator, styleUrlsExpr) {
    const styleUrls = [];
    if (ts.isArrayLiteralExpression(styleUrlsExpr)) {
        for (const styleUrlExpr of styleUrlsExpr.elements) {
            if (ts.isSpreadElement(styleUrlExpr)) {
                styleUrls.push(...extractStyleUrlsFromExpression(evaluator, styleUrlExpr.expression));
            }
            else {
                const styleUrl = evaluator.evaluate(styleUrlExpr);
                if (typeof styleUrl !== 'string') {
                    throw checker.createValueHasWrongTypeError(styleUrlExpr, styleUrl, 'styleUrl must be a string');
                }
                styleUrls.push({
                    url: styleUrl,
                    source: 2 /* ResourceTypeForDiagnostics.StylesheetFromDecorator */,
                    expression: styleUrlExpr,
                });
            }
        }
    }
    else {
        const evaluatedStyleUrls = evaluator.evaluate(styleUrlsExpr);
        if (!isStringArray(evaluatedStyleUrls)) {
            throw checker.createValueHasWrongTypeError(styleUrlsExpr, evaluatedStyleUrls, 'styleUrls must be an array of strings');
        }
        for (const styleUrl of evaluatedStyleUrls) {
            styleUrls.push({
                url: styleUrl,
                source: 2 /* ResourceTypeForDiagnostics.StylesheetFromDecorator */,
                expression: styleUrlsExpr,
            });
        }
    }
    return styleUrls;
}
function extractInlineStyleResources(component) {
    const styles = new Set();
    function stringLiteralElements(array) {
        return array.elements.filter((e) => ts.isStringLiteralLike(e));
    }
    const stylesExpr = component.get('styles');
    if (stylesExpr !== undefined) {
        if (ts.isArrayLiteralExpression(stylesExpr)) {
            for (const expression of stringLiteralElements(stylesExpr)) {
                styles.add({ path: null, node: expression });
            }
        }
        else if (ts.isStringLiteralLike(stylesExpr)) {
            styles.add({ path: null, node: stylesExpr });
        }
    }
    return styles;
}
function _extractTemplateStyleUrls(template) {
    if (template.styleUrls === null) {
        return [];
    }
    const expression = getTemplateDeclarationNodeForError(template.declaration);
    return template.styleUrls.map((url) => ({
        url,
        source: 1 /* ResourceTypeForDiagnostics.StylesheetFromTemplate */,
        expression,
    }));
}

/**
 * Represents an Angular component.
 */
class ComponentSymbol extends DirectiveSymbol {
    usedDirectives = [];
    usedPipes = [];
    isRemotelyScoped = false;
    isEmitAffected(previousSymbol, publicApiAffected) {
        if (!(previousSymbol instanceof ComponentSymbol)) {
            return true;
        }
        // Create an equality function that considers symbols equal if they represent the same
        // declaration, but only if the symbol in the current compilation does not have its public API
        // affected.
        const isSymbolUnaffected = (current, previous) => isReferenceEqual(current, previous) && !publicApiAffected.has(current.symbol);
        // The emit of a component is affected if either of the following is true:
        //  1. The component used to be remotely scoped but no longer is, or vice versa.
        //  2. The list of used directives has changed or any of those directives have had their public
        //     API changed. If the used directives have been reordered but not otherwise affected then
        //     the component must still be re-emitted, as this may affect directive instantiation order.
        //  3. The list of used pipes has changed, or any of those pipes have had their public API
        //     changed.
        return (this.isRemotelyScoped !== previousSymbol.isRemotelyScoped ||
            !isArrayEqual(this.usedDirectives, previousSymbol.usedDirectives, isSymbolUnaffected) ||
            !isArrayEqual(this.usedPipes, previousSymbol.usedPipes, isSymbolUnaffected));
    }
    isTypeCheckBlockAffected(previousSymbol, typeCheckApiAffected) {
        if (!(previousSymbol instanceof ComponentSymbol)) {
            return true;
        }
        // To verify that a used directive is not affected we need to verify that its full inheritance
        // chain is not present in `typeCheckApiAffected`.
        const isInheritanceChainAffected = (symbol) => {
            let currentSymbol = symbol;
            while (currentSymbol instanceof DirectiveSymbol) {
                if (typeCheckApiAffected.has(currentSymbol)) {
                    return true;
                }
                currentSymbol = currentSymbol.baseClass;
            }
            return false;
        };
        // Create an equality function that considers directives equal if they represent the same
        // declaration and if the symbol and all symbols it inherits from in the current compilation
        // do not have their type-check API affected.
        const isDirectiveUnaffected = (current, previous) => isReferenceEqual(current, previous) && !isInheritanceChainAffected(current.symbol);
        // Create an equality function that considers pipes equal if they represent the same
        // declaration and if the symbol in the current compilation does not have its type-check
        // API affected.
        const isPipeUnaffected = (current, previous) => isReferenceEqual(current, previous) && !typeCheckApiAffected.has(current.symbol);
        // The emit of a type-check block of a component is affected if either of the following is true:
        //  1. The list of used directives has changed or any of those directives have had their
        //     type-check API changed.
        //  2. The list of used pipes has changed, or any of those pipes have had their type-check API
        //     changed.
        return (!isArrayEqual(this.usedDirectives, previousSymbol.usedDirectives, isDirectiveUnaffected) ||
            !isArrayEqual(this.usedPipes, previousSymbol.usedPipes, isPipeUnaffected));
    }
}

/**
 * Collect the animation names from the static evaluation result.
 * @param value the static evaluation result of the animations
 * @param animationTriggerNames the animation names collected and whether some names could not be
 *     statically evaluated.
 */
function collectAnimationNames(value, animationTriggerNames) {
    if (value instanceof Map) {
        const name = value.get('name');
        if (typeof name === 'string') {
            animationTriggerNames.staticTriggerNames.push(name);
        }
        else {
            animationTriggerNames.includesDynamicAnimations = true;
        }
    }
    else if (Array.isArray(value)) {
        for (const resolvedValue of value) {
            collectAnimationNames(resolvedValue, animationTriggerNames);
        }
    }
    else {
        animationTriggerNames.includesDynamicAnimations = true;
    }
}
function isAngularAnimationsReference(reference, symbolName) {
    return (reference.ownedByModuleGuess === '@angular/animations' && reference.debugName === symbolName);
}
const animationTriggerResolver = (fn, node, resolve, unresolvable) => {
    const animationTriggerMethodName = 'trigger';
    if (!isAngularAnimationsReference(fn, animationTriggerMethodName)) {
        return unresolvable;
    }
    const triggerNameExpression = node.arguments[0];
    if (!triggerNameExpression) {
        return unresolvable;
    }
    const res = new Map();
    res.set('name', resolve(triggerNameExpression));
    return res;
};
function validateAndFlattenComponentImports(imports, expr, isDeferred) {
    const flattened = [];
    const errorMessage = isDeferred
        ? `'deferredImports' must be an array of components, directives, or pipes.`
        : `'imports' must be an array of components, directives, pipes, or NgModules.`;
    if (!Array.isArray(imports)) {
        const error = checker.createValueHasWrongTypeError(expr, imports, errorMessage).toDiagnostic();
        return {
            imports: [],
            diagnostics: [error],
        };
    }
    const diagnostics = [];
    for (let i = 0; i < imports.length; i++) {
        const ref = imports[i];
        if (Array.isArray(ref)) {
            const { imports: childImports, diagnostics: childDiagnostics } = validateAndFlattenComponentImports(ref, expr, isDeferred);
            flattened.push(...childImports);
            diagnostics.push(...childDiagnostics);
        }
        else if (ref instanceof checker.Reference) {
            if (checker.isNamedClassDeclaration(ref.node)) {
                flattened.push(ref);
            }
            else {
                diagnostics.push(checker.createValueHasWrongTypeError(ref.getOriginForDiagnostics(expr), ref, errorMessage).toDiagnostic());
            }
        }
        else if (isLikelyModuleWithProviders(ref)) {
            let origin = expr;
            if (ref instanceof checker.SyntheticValue) {
                // The `ModuleWithProviders` type originated from a foreign function declaration, in which
                // case the original foreign call is available which is used to get a more accurate origin
                // node that points at the specific call expression.
                origin = checker.getOriginNodeForDiagnostics(ref.value.mwpCall, expr);
            }
            diagnostics.push(checker.makeDiagnostic(checker.ErrorCode.COMPONENT_UNKNOWN_IMPORT, origin, `Component imports contains a ModuleWithProviders value, likely the result of a 'Module.forRoot()'-style call. ` +
                `These calls are not used to configure components and are not valid in standalone component imports - ` +
                `consider importing them in the application bootstrap instead.`));
        }
        else {
            let diagnosticNode;
            let diagnosticValue;
            if (ref instanceof checker.DynamicValue) {
                diagnosticNode = ref.node;
                diagnosticValue = ref;
            }
            else if (ts.isArrayLiteralExpression(expr) &&
                expr.elements.length === imports.length &&
                !expr.elements.some(ts.isSpreadAssignment) &&
                !imports.some(Array.isArray)) {
                // Reporting a diagnostic on the entire array can be noisy, especially if the user has a
                // large array. The most common case is that the array will be static so we can reliably
                // trace back a `ResolvedValue` back to its node using its index. This allows us to report
                // the exact node that caused the issue.
                diagnosticNode = expr.elements[i];
                diagnosticValue = ref;
            }
            else {
                diagnosticNode = expr;
                diagnosticValue = imports;
            }
            diagnostics.push(checker.createValueHasWrongTypeError(diagnosticNode, diagnosticValue, errorMessage).toDiagnostic());
        }
    }
    return { imports: flattened, diagnostics };
}
/**
 * Inspects `value` to determine if it resembles a `ModuleWithProviders` value. This is an
 * approximation only suitable for error reporting as any resolved object with an `ngModule`
 * key is considered a `ModuleWithProviders`.
 */
function isLikelyModuleWithProviders(value) {
    if (value instanceof checker.SyntheticValue && isResolvedModuleWithProviders(value)) {
        // This is a `ModuleWithProviders` as extracted from a foreign function call.
        return true;
    }
    if (value instanceof Map && value.has('ngModule')) {
        // A resolved `Map` with `ngModule` property would have been extracted from locally declared
        // functions that return a `ModuleWithProviders` object.
        return true;
    }
    return false;
}

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
/**
 * Determines the file-level dependencies that the HMR initializer needs to capture and pass along.
 * @param sourceFile File in which the file is being compiled.
 * @param definition Compiled component definition.
 * @param factory Compiled component factory.
 * @param deferBlockMetadata Metadata about the defer blocks in the component.
 * @param classMetadata Compiled `setClassMetadata` expression, if any.
 * @param debugInfo Compiled `setClassDebugInfo` expression, if any.
 */
function extractHmrDependencies(node, definition, factory, deferBlockMetadata, classMetadata, debugInfo, reflection, evaluator) {
    const name = ts.isClassDeclaration(node) && node.name ? node.name.text : null;
    const visitor = new PotentialTopLevelReadsVisitor();
    const sourceFile = ts.getOriginalNode(node).getSourceFile();
    // Visit all of the compiled expressions to look for potential
    // local references that would have to be retained.
    definition.expression.visitExpression(visitor, null);
    definition.statements.forEach((statement) => statement.visitStatement(visitor, null));
    factory.initializer?.visitExpression(visitor, null);
    factory.statements.forEach((statement) => statement.visitStatement(visitor, null));
    classMetadata?.visitStatement(visitor, null);
    debugInfo?.visitStatement(visitor, null);
    if (deferBlockMetadata.mode === 0 /* DeferBlockDepsEmitMode.PerBlock */) {
        deferBlockMetadata.blocks.forEach((loader) => loader?.visitExpression(visitor, null));
    }
    else {
        deferBlockMetadata.dependenciesFn?.visitExpression(visitor, null);
    }
    // Filter out only the references to defined top-level symbols. This allows us to ignore local
    // variables inside of functions. Note that we filter out the class name since it is always
    // defined and it saves us having to repeat this logic wherever the locals are consumed.
    const availableTopLevel = getTopLevelDeclarationNames(sourceFile);
    const local = [];
    const seenLocals = new Set();
    for (const readNode of visitor.allReads) {
        const readName = readNode instanceof compiler.ReadVarExpr ? readNode.name : readNode.text;
        if (readName !== name && !seenLocals.has(readName) && availableTopLevel.has(readName)) {
            const runtimeRepresentation = getRuntimeRepresentation(readNode, reflection, evaluator);
            if (runtimeRepresentation === null) {
                return null;
            }
            local.push({ name: readName, runtimeRepresentation });
            seenLocals.add(readName);
        }
    }
    return {
        local,
        external: Array.from(visitor.namespaceReads, (name, index) => ({
            moduleName: name,
            assignedName: `ɵhmr${index}`,
        })),
    };
}
/**
 * Gets a node that can be used to represent an identifier in the HMR replacement code at runtime.
 */
function getRuntimeRepresentation(node, reflection, evaluator) {
    if (node instanceof compiler.ReadVarExpr) {
        return compiler.variable(node.name);
    }
    // Const enums can't be passed by reference, because their values are inlined.
    // Pass in an object literal with all of the values instead.
    if (isConstEnumReference(node, reflection)) {
        const evaluated = evaluator.evaluate(node);
        if (evaluated instanceof Map) {
            const members = [];
            for (const [name, value] of evaluated.entries()) {
                if (value instanceof checker.EnumValue &&
                    (value.resolved == null ||
                        typeof value.resolved === 'string' ||
                        typeof value.resolved === 'boolean' ||
                        typeof value.resolved === 'number')) {
                    members.push({
                        key: name,
                        quoted: false,
                        value: compiler.literal(value.resolved),
                    });
                }
                else {
                    // TS is pretty restrictive about what values can be in a const enum so our evaluator
                    // should be able to handle them, however if we happen to hit such a case, we return null
                    // so the HMR update can be invalidated.
                    return null;
                }
            }
            return compiler.literalMap(members);
        }
    }
    return compiler.variable(node.text);
}
/**
 * Gets the names of all top-level declarations within the file (imports, declared classes etc).
 * @param sourceFile File in which to search for locals.
 */
function getTopLevelDeclarationNames(sourceFile) {
    const results = new Set();
    // Only look through the top-level statements.
    for (const node of sourceFile.statements) {
        // Class, function and const enum declarations need to be captured since they correspond
        // to runtime code. Intentionally excludes interfaces and type declarations.
        if (ts.isClassDeclaration(node) ||
            ts.isFunctionDeclaration(node) ||
            ts.isEnumDeclaration(node)) {
            if (node.name) {
                results.add(node.name.text);
            }
            continue;
        }
        // Variable declarations.
        if (ts.isVariableStatement(node)) {
            for (const decl of node.declarationList.declarations) {
                trackBindingName(decl.name, results);
            }
            continue;
        }
        // Import declarations.
        if (ts.isImportDeclaration(node) && node.importClause) {
            const importClause = node.importClause;
            // Skip over type-only imports since they won't be emitted to JS.
            if (importClause.isTypeOnly) {
                continue;
            }
            // import foo from 'foo'
            if (importClause.name) {
                results.add(importClause.name.text);
            }
            if (importClause.namedBindings) {
                const namedBindings = importClause.namedBindings;
                if (ts.isNamespaceImport(namedBindings)) {
                    // import * as foo from 'foo';
                    results.add(namedBindings.name.text);
                }
                else {
                    // import {foo} from 'foo';
                    namedBindings.elements.forEach((el) => {
                        if (!el.isTypeOnly) {
                            results.add(el.name.text);
                        }
                    });
                }
            }
            continue;
        }
    }
    return results;
}
/**
 * Adds all the variables declared through a `ts.BindingName` to a set of results.
 * @param node Node from which to start searching for variables.
 * @param results Set to which to add the matches.
 */
function trackBindingName(node, results) {
    if (ts.isIdentifier(node)) {
        results.add(node.text);
    }
    else {
        for (const el of node.elements) {
            if (!ts.isOmittedExpression(el)) {
                trackBindingName(el.name, results);
            }
        }
    }
}
/**
 * Visitor that will traverse an AST looking for potential top-level variable reads.
 * The reads are "potential", because the visitor doesn't account for local variables
 * inside functions.
 */
class PotentialTopLevelReadsVisitor extends compiler.RecursiveAstVisitor$1 {
    allReads = new Set();
    namespaceReads = new Set();
    visitExternalExpr(ast, context) {
        if (ast.value.moduleName !== null) {
            this.namespaceReads.add(ast.value.moduleName);
        }
        super.visitExternalExpr(ast, context);
    }
    visitReadVarExpr(ast, context) {
        this.allReads.add(ast);
        super.visitReadVarExpr(ast, context);
    }
    visitWrappedNodeExpr(ast, context) {
        if (this.isTypeScriptNode(ast.node)) {
            this.addAllTopLevelIdentifiers(ast.node);
        }
        super.visitWrappedNodeExpr(ast, context);
    }
    /**
     * Traverses a TypeScript AST and tracks all the top-level reads.
     * @param node Node from which to start the traversal.
     */
    addAllTopLevelIdentifiers = (node) => {
        if (ts.isIdentifier(node) && this.isTopLevelIdentifierReference(node)) {
            this.allReads.add(node);
        }
        else {
            ts.forEachChild(node, this.addAllTopLevelIdentifiers);
        }
    };
    /**
     * TypeScript identifiers are used both when referring to a variable (e.g. `console.log(foo)`)
     * and for names (e.g. `{foo: 123}`). This function determines if the identifier is a top-level
     * variable read, rather than a nested name.
     * @param identifier Identifier to check.
     */
    isTopLevelIdentifierReference(identifier) {
        let node = identifier;
        let parent = node.parent;
        // The parent might be undefined for a synthetic node or if `setParentNodes` is set to false
        // when the SourceFile was created. We can account for such cases using the type checker, at
        // the expense of performance. At the moment of writing, we're keeping it simple since the
        // compiler sets `setParentNodes: true`.
        if (!parent) {
            return false;
        }
        // Unwrap parenthesized identifiers, but use the closest parenthesized expression
        // as the reference node so that we can check cases like `{prop: ((value))}`.
        if (ts.isParenthesizedExpression(parent) && parent.expression === node) {
            while (parent && ts.isParenthesizedExpression(parent)) {
                node = parent;
                parent = parent.parent;
            }
        }
        // Identifier referenced at the top level. Unlikely.
        if (ts.isSourceFile(parent)) {
            return true;
        }
        // Identifier used inside a call is only top-level if it's an argument.
        // This also covers decorators since their expression is usually a call.
        if (ts.isCallExpression(parent)) {
            return parent.expression === node || parent.arguments.includes(node);
        }
        // Identifier used in a nested expression is only top-level if it's the actual expression.
        if (ts.isExpressionStatement(parent) ||
            ts.isPropertyAccessExpression(parent) ||
            ts.isComputedPropertyName(parent) ||
            ts.isTemplateSpan(parent) ||
            ts.isSpreadAssignment(parent) ||
            ts.isSpreadElement(parent) ||
            ts.isAwaitExpression(parent) ||
            ts.isNonNullExpression(parent) ||
            ts.isIfStatement(parent) ||
            ts.isDoStatement(parent) ||
            ts.isWhileStatement(parent) ||
            ts.isSwitchStatement(parent) ||
            ts.isCaseClause(parent) ||
            ts.isThrowStatement(parent) ||
            ts.isNewExpression(parent)) {
            return parent.expression === node;
        }
        // Identifier used in an array is only top-level if it's one of the elements.
        if (ts.isArrayLiteralExpression(parent)) {
            return parent.elements.includes(node);
        }
        // If the parent is an initialized node, the identifier is
        // at the top level if it's the initializer itself.
        if (ts.isPropertyAssignment(parent) ||
            ts.isParameter(parent) ||
            ts.isBindingElement(parent) ||
            ts.isPropertyDeclaration(parent) ||
            ts.isEnumMember(parent)) {
            return parent.initializer === node;
        }
        // Identifier in a function is top level if it's either the name or the initializer.
        if (ts.isVariableDeclaration(parent)) {
            return parent.name === node || parent.initializer === node;
        }
        // Identifier in a declaration is only top level if it's the name.
        // In shorthand assignments the name is also the value.
        if (ts.isClassDeclaration(parent) ||
            ts.isFunctionDeclaration(parent) ||
            ts.isShorthandPropertyAssignment(parent)) {
            return parent.name === node;
        }
        if (ts.isElementAccessExpression(parent)) {
            return parent.expression === node || parent.argumentExpression === node;
        }
        if (ts.isBinaryExpression(parent)) {
            return parent.left === node || parent.right === node;
        }
        if (ts.isForInStatement(parent) || ts.isForOfStatement(parent)) {
            return parent.expression === node || parent.initializer === node;
        }
        if (ts.isForStatement(parent)) {
            return (parent.condition === node || parent.initializer === node || parent.incrementor === node);
        }
        if (ts.isArrowFunction(parent)) {
            return parent.body === node;
        }
        // It's unlikely that we'll run into imports/exports in this use case.
        // We handle them since it's simple and for completeness' sake.
        if (ts.isImportSpecifier(parent) || ts.isExportSpecifier(parent)) {
            return (parent.propertyName || parent.name) === node;
        }
        if (ts.isConditionalExpression(parent)) {
            return parent.condition === node || parent.whenFalse === node || parent.whenTrue === node;
        }
        // Otherwise it's not top-level.
        return false;
    }
    /** Checks if a value is a TypeScript AST node. */
    isTypeScriptNode(value) {
        // If this is too permissive, we can also check for `getSourceFile`. This code runs
        // on a narrow set of use cases so checking for `kind` should be enough.
        return !!value && typeof value.kind === 'number';
    }
}
/** Checks whether a node is a reference to a const enum. */
function isConstEnumReference(node, reflection) {
    const parent = node.parent;
    // Only check identifiers that are in the form of `Foo.bar` where `Foo` is the node being checked.
    if (!parent ||
        !ts.isPropertyAccessExpression(parent) ||
        parent.expression !== node ||
        !ts.isIdentifier(parent.name)) {
        return false;
    }
    const declaration = reflection.getDeclarationOfIdentifier(node);
    return (declaration !== null &&
        ts.isEnumDeclaration(declaration.node) &&
        !!declaration.node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ConstKeyword));
}

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
/**
 * Extracts the HMR metadata for a class declaration.
 * @param clazz Class being analyzed.
 * @param reflection Reflection host.
 * @param compilerHost Compiler host to use when resolving file names.
 * @param rootDirs Root directories configured by the user.
 * @param definition Analyzed component definition.
 * @param factory Analyzed component factory.
 * @param deferBlockMetadata Metadata about the defer blocks in the component.
 * @param classMetadata Analyzed `setClassMetadata` expression, if any.
 * @param debugInfo Analyzed `setClassDebugInfo` expression, if any.
 */
function extractHmrMetatadata(clazz, reflection, evaluator, compilerHost, rootDirs, definition, factory, deferBlockMetadata, classMetadata, debugInfo) {
    if (!reflection.isClass(clazz)) {
        return null;
    }
    const sourceFile = ts.getOriginalNode(clazz).getSourceFile();
    const filePath = getProjectRelativePath(sourceFile.fileName, rootDirs, compilerHost) ||
        compilerHost.getCanonicalFileName(sourceFile.fileName);
    const dependencies = extractHmrDependencies(clazz, definition, factory, deferBlockMetadata, classMetadata, debugInfo, reflection, evaluator);
    if (dependencies === null) {
        return null;
    }
    const meta = {
        type: new compiler.WrappedNodeExpr(clazz.name),
        className: clazz.name.text,
        filePath,
        localDependencies: dependencies.local,
        namespaceDependencies: dependencies.external,
    };
    return meta;
}

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
/**
 * Gets the declaration for the function that replaces the metadata of a class during HMR.
 * @param compilationResults Code generated for the class during compilation.
 * @param meta HMR metadata about the class.
 * @param declaration Class for which the update declaration is being generated.
 */
function getHmrUpdateDeclaration(compilationResults, constantStatements, meta, declaration) {
    const namespaceSpecifiers = meta.namespaceDependencies.reduce((result, current) => {
        result.set(current.moduleName, current.assignedName);
        return result;
    }, new Map());
    const importRewriter = new HmrModuleImportRewriter(namespaceSpecifiers);
    const importManager = new checker.ImportManager({
        ...checker.presetImportManagerForceNamespaceImports,
        rewriter: importRewriter,
    });
    const callback = compileHmrUpdateCallback(compilationResults, constantStatements, meta);
    const sourceFile = ts.getOriginalNode(declaration).getSourceFile();
    const node = checker.translateStatement(sourceFile, callback, importManager);
    // The output AST doesn't support modifiers so we have to emit to
    // TS and then update the declaration to add `export default`.
    return ts.factory.updateFunctionDeclaration(node, [
        ts.factory.createToken(ts.SyntaxKind.ExportKeyword),
        ts.factory.createToken(ts.SyntaxKind.DefaultKeyword),
    ], node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type, node.body);
}
class HmrModuleImportRewriter {
    lookup;
    constructor(lookup) {
        this.lookup = lookup;
    }
    rewriteNamespaceImportIdentifier(specifier, moduleName) {
        return this.lookup.has(moduleName) ? this.lookup.get(moduleName) : specifier;
    }
    rewriteSymbol(symbol) {
        return symbol;
    }
    rewriteSpecifier(specifier) {
        return specifier;
    }
}

const EMPTY_ARRAY = [];
const isUsedDirective = (decl) => decl.kind === compiler.R3TemplateDependencyKind.Directive;
const isUsedPipe = (decl) => decl.kind === compiler.R3TemplateDependencyKind.Pipe;
/**
 * `DecoratorHandler` which handles the `@Component` annotation.
 */
class ComponentDecoratorHandler {
    reflector;
    evaluator;
    metaRegistry;
    metaReader;
    scopeReader;
    compilerHost;
    scopeRegistry;
    typeCheckScopeRegistry;
    resourceRegistry;
    isCore;
    strictCtorDeps;
    resourceLoader;
    rootDirs;
    defaultPreserveWhitespaces;
    i18nUseExternalIds;
    enableI18nLegacyMessageIdFormat;
    usePoisonedData;
    i18nNormalizeLineEndingsInICUs;
    moduleResolver;
    cycleAnalyzer;
    cycleHandlingStrategy;
    refEmitter;
    referencesRegistry;
    depTracker;
    injectableRegistry;
    semanticDepGraphUpdater;
    annotateForClosureCompiler;
    perf;
    hostDirectivesResolver;
    importTracker;
    includeClassMetadata;
    compilationMode;
    deferredSymbolTracker;
    forbidOrphanRendering;
    enableBlockSyntax;
    enableLetSyntax;
    externalRuntimeStyles;
    localCompilationExtraImportsTracker;
    jitDeclarationRegistry;
    i18nPreserveSignificantWhitespace;
    strictStandalone;
    enableHmr;
    implicitStandaloneValue;
    typeCheckHostBindings;
    constructor(reflector, evaluator, metaRegistry, metaReader, scopeReader, compilerHost, scopeRegistry, typeCheckScopeRegistry, resourceRegistry, isCore, strictCtorDeps, resourceLoader, rootDirs, defaultPreserveWhitespaces, i18nUseExternalIds, enableI18nLegacyMessageIdFormat, usePoisonedData, i18nNormalizeLineEndingsInICUs, moduleResolver, cycleAnalyzer, cycleHandlingStrategy, refEmitter, referencesRegistry, depTracker, injectableRegistry, semanticDepGraphUpdater, annotateForClosureCompiler, perf, hostDirectivesResolver, importTracker, includeClassMetadata, compilationMode, deferredSymbolTracker, forbidOrphanRendering, enableBlockSyntax, enableLetSyntax, externalRuntimeStyles, localCompilationExtraImportsTracker, jitDeclarationRegistry, i18nPreserveSignificantWhitespace, strictStandalone, enableHmr, implicitStandaloneValue, typeCheckHostBindings) {
        this.reflector = reflector;
        this.evaluator = evaluator;
        this.metaRegistry = metaRegistry;
        this.metaReader = metaReader;
        this.scopeReader = scopeReader;
        this.compilerHost = compilerHost;
        this.scopeRegistry = scopeRegistry;
        this.typeCheckScopeRegistry = typeCheckScopeRegistry;
        this.resourceRegistry = resourceRegistry;
        this.isCore = isCore;
        this.strictCtorDeps = strictCtorDeps;
        this.resourceLoader = resourceLoader;
        this.rootDirs = rootDirs;
        this.defaultPreserveWhitespaces = defaultPreserveWhitespaces;
        this.i18nUseExternalIds = i18nUseExternalIds;
        this.enableI18nLegacyMessageIdFormat = enableI18nLegacyMessageIdFormat;
        this.usePoisonedData = usePoisonedData;
        this.i18nNormalizeLineEndingsInICUs = i18nNormalizeLineEndingsInICUs;
        this.moduleResolver = moduleResolver;
        this.cycleAnalyzer = cycleAnalyzer;
        this.cycleHandlingStrategy = cycleHandlingStrategy;
        this.refEmitter = refEmitter;
        this.referencesRegistry = referencesRegistry;
        this.depTracker = depTracker;
        this.injectableRegistry = injectableRegistry;
        this.semanticDepGraphUpdater = semanticDepGraphUpdater;
        this.annotateForClosureCompiler = annotateForClosureCompiler;
        this.perf = perf;
        this.hostDirectivesResolver = hostDirectivesResolver;
        this.importTracker = importTracker;
        this.includeClassMetadata = includeClassMetadata;
        this.compilationMode = compilationMode;
        this.deferredSymbolTracker = deferredSymbolTracker;
        this.forbidOrphanRendering = forbidOrphanRendering;
        this.enableBlockSyntax = enableBlockSyntax;
        this.enableLetSyntax = enableLetSyntax;
        this.externalRuntimeStyles = externalRuntimeStyles;
        this.localCompilationExtraImportsTracker = localCompilationExtraImportsTracker;
        this.jitDeclarationRegistry = jitDeclarationRegistry;
        this.i18nPreserveSignificantWhitespace = i18nPreserveSignificantWhitespace;
        this.strictStandalone = strictStandalone;
        this.enableHmr = enableHmr;
        this.implicitStandaloneValue = implicitStandaloneValue;
        this.typeCheckHostBindings = typeCheckHostBindings;
        this.extractTemplateOptions = {
            enableI18nLegacyMessageIdFormat: this.enableI18nLegacyMessageIdFormat,
            i18nNormalizeLineEndingsInICUs: this.i18nNormalizeLineEndingsInICUs,
            usePoisonedData: this.usePoisonedData,
            enableBlockSyntax: this.enableBlockSyntax,
            enableLetSyntax: this.enableLetSyntax,
            preserveSignificantWhitespace: this.i18nPreserveSignificantWhitespace,
        };
        // Dependencies can't be deferred during HMR, because the HMR update module can't have
        // dynamic imports and its dependencies need to be passed in directly. If dependencies
        // are deferred, their imports will be deleted so we may lose the reference to them.
        this.canDeferDeps = !enableHmr;
    }
    literalCache = new Map();
    elementSchemaRegistry = new compiler.DomElementSchemaRegistry();
    /**
     * During the asynchronous preanalyze phase, it's necessary to parse the template to extract
     * any potential <link> tags which might need to be loaded. This cache ensures that work is not
     * thrown away, and the parsed template is reused during the analyze phase.
     */
    preanalyzeTemplateCache = new Map();
    preanalyzeStylesCache = new Map();
    /** Whether generated code for a component can defer its dependencies. */
    canDeferDeps;
    extractTemplateOptions;
    precedence = checker.HandlerPrecedence.PRIMARY;
    name = 'ComponentDecoratorHandler';
    detect(node, decorators) {
        if (!decorators) {
            return undefined;
        }
        const decorator = checker.findAngularDecorator(decorators, 'Component', this.isCore);
        if (decorator !== undefined) {
            return {
                trigger: decorator.node,
                decorator,
                metadata: decorator,
            };
        }
        else {
            return undefined;
        }
    }
    preanalyze(node, decorator) {
        // In preanalyze, resource URLs associated with the component are asynchronously preloaded via
        // the resourceLoader. This is the only time async operations are allowed for a component.
        // These resources are:
        //
        // - the templateUrl, if there is one
        // - any styleUrls if present
        // - any stylesheets referenced from <link> tags in the template itself
        //
        // As a result of the last one, the template must be parsed as part of preanalysis to extract
        // <link> tags, which may involve waiting for the templateUrl to be resolved first.
        // If preloading isn't possible, then skip this step.
        if (!this.resourceLoader.canPreload) {
            return undefined;
        }
        const meta = resolveLiteral(decorator, this.literalCache);
        const component = checker.reflectObjectLiteral(meta);
        const containingFile = node.getSourceFile().fileName;
        const resolveStyleUrl = (styleUrl) => {
            try {
                const resourceUrl = this.resourceLoader.resolve(styleUrl, containingFile);
                return this.resourceLoader.preload(resourceUrl, {
                    type: 'style',
                    containingFile,
                    className: node.name.text,
                });
            }
            catch {
                // Don't worry about failures to preload. We can handle this problem during analysis by
                // producing a diagnostic.
                return undefined;
            }
        };
        // A Promise that waits for the template and all <link>ed styles within it to be preloaded.
        const templateAndTemplateStyleResources = preloadAndParseTemplate(this.evaluator, this.resourceLoader, this.depTracker, this.preanalyzeTemplateCache, node, decorator, component, containingFile, this.defaultPreserveWhitespaces, this.extractTemplateOptions, this.compilationMode).then((template) => {
            if (template === null) {
                return { templateStyles: [], templateStyleUrls: [] };
            }
            let templateUrl;
            if (template.sourceMapping.type === 'external') {
                templateUrl = template.sourceMapping.templateUrl;
            }
            return {
                templateUrl,
                templateStyles: template.styles,
                templateStyleUrls: template.styleUrls,
            };
        });
        // Extract all the styleUrls in the decorator.
        const componentStyleUrls = extractComponentStyleUrls(this.evaluator, component);
        return templateAndTemplateStyleResources.then(async (templateInfo) => {
            // Extract inline styles, process, and cache for use in synchronous analyze phase
            let styles = null;
            // Order plus className allows inline styles to be identified per component by a preprocessor
            let orderOffset = 0;
            const rawStyles = checker.parseDirectiveStyles(component, this.evaluator, this.compilationMode);
            if (rawStyles?.length) {
                styles = await Promise.all(rawStyles.map((style) => this.resourceLoader.preprocessInline(style, {
                    type: 'style',
                    containingFile,
                    order: orderOffset++,
                    className: node.name.text,
                })));
            }
            if (templateInfo.templateStyles) {
                styles ??= [];
                styles.push(...(await Promise.all(templateInfo.templateStyles.map((style) => this.resourceLoader.preprocessInline(style, {
                    type: 'style',
                    containingFile: templateInfo.templateUrl ?? containingFile,
                    order: orderOffset++,
                    className: node.name.text,
                })))));
            }
            this.preanalyzeStylesCache.set(node, styles);
            if (this.externalRuntimeStyles) {
                // No preanalysis required for style URLs with external runtime styles
                return;
            }
            // Wait for both the template and all styleUrl resources to resolve.
            await Promise.all([
                ...componentStyleUrls.map((styleUrl) => resolveStyleUrl(styleUrl.url)),
                ...templateInfo.templateStyleUrls.map((url) => resolveStyleUrl(url)),
            ]);
        });
    }
    analyze(node, decorator) {
        this.perf.eventCount(checker.PerfEvent.AnalyzeComponent);
        const containingFile = node.getSourceFile().fileName;
        this.literalCache.delete(decorator);
        let diagnostics;
        let isPoisoned = false;
        // @Component inherits @Directive, so begin by extracting the @Directive metadata and building
        // on it.
        const directiveResult = checker.extractDirectiveMetadata(node, decorator, this.reflector, this.importTracker, this.evaluator, this.refEmitter, this.referencesRegistry, this.isCore, this.annotateForClosureCompiler, this.compilationMode, this.elementSchemaRegistry.getDefaultComponentElementName(), this.strictStandalone, this.implicitStandaloneValue);
        // `extractDirectiveMetadata` returns `jitForced = true` when the `@Component` has
        // set `jit: true`. In this case, compilation of the decorator is skipped. Returning
        // an empty object signifies that no analysis was produced.
        if (directiveResult.jitForced) {
            this.jitDeclarationRegistry.jitDeclarations.add(node);
            return {};
        }
        // Next, read the `@Component`-specific fields.
        const { decorator: component, metadata, inputs, outputs, hostDirectives, rawHostDirectives, } = directiveResult;
        const encapsulation = (this.compilationMode !== checker.CompilationMode.LOCAL
            ? resolveEnumValue(this.evaluator, component, 'encapsulation', 'ViewEncapsulation', this.isCore)
            : resolveEncapsulationEnumValueLocally(component.get('encapsulation'))) ??
            compiler.ViewEncapsulation.Emulated;
        let changeDetection = null;
        if (this.compilationMode !== checker.CompilationMode.LOCAL) {
            changeDetection = resolveEnumValue(this.evaluator, component, 'changeDetection', 'ChangeDetectionStrategy', this.isCore);
        }
        else if (component.has('changeDetection')) {
            changeDetection = new compiler.WrappedNodeExpr(component.get('changeDetection'));
        }
        let animations = null;
        let animationTriggerNames = null;
        if (component.has('animations')) {
            const animationExpression = component.get('animations');
            animations = new compiler.WrappedNodeExpr(animationExpression);
            const animationsValue = this.evaluator.evaluate(animationExpression, animationTriggerResolver);
            animationTriggerNames = { includesDynamicAnimations: false, staticTriggerNames: [] };
            collectAnimationNames(animationsValue, animationTriggerNames);
        }
        // Go through the root directories for this project, and select the one with the smallest
        // relative path representation.
        const relativeContextFilePath = this.rootDirs.reduce((previous, rootDir) => {
            const candidate = checker.relative(checker.absoluteFrom(rootDir), checker.absoluteFrom(containingFile));
            if (previous === undefined || candidate.length < previous.length) {
                return candidate;
            }
            else {
                return previous;
            }
        }, undefined);
        // Note that we could technically combine the `viewProvidersRequiringFactory` and
        // `providersRequiringFactory` into a single set, but we keep the separate so that
        // we can distinguish where an error is coming from when logging the diagnostics in `resolve`.
        let viewProvidersRequiringFactory = null;
        let providersRequiringFactory = null;
        let wrappedViewProviders = null;
        if (component.has('viewProviders')) {
            const viewProviders = component.get('viewProviders');
            viewProvidersRequiringFactory = checker.resolveProvidersRequiringFactory(viewProviders, this.reflector, this.evaluator);
            wrappedViewProviders = new compiler.WrappedNodeExpr(this.annotateForClosureCompiler
                ? checker.wrapFunctionExpressionsInParens(viewProviders)
                : viewProviders);
        }
        if (component.has('providers')) {
            providersRequiringFactory = checker.resolveProvidersRequiringFactory(component.get('providers'), this.reflector, this.evaluator);
        }
        let resolvedImports = null;
        let resolvedDeferredImports = null;
        let rawImports = component.get('imports') ?? null;
        let rawDeferredImports = component.get('deferredImports') ?? null;
        if ((rawImports || rawDeferredImports) && !metadata.isStandalone) {
            if (diagnostics === undefined) {
                diagnostics = [];
            }
            const importsField = rawImports ? 'imports' : 'deferredImports';
            diagnostics.push(checker.makeDiagnostic(checker.ErrorCode.COMPONENT_NOT_STANDALONE, component.get(importsField), `'${importsField}' is only valid on a component that is standalone.`, [
                checker.makeRelatedInformation(node.name, `Did you forget to add 'standalone: true' to this @Component?`),
            ]));
            // Poison the component so that we don't spam further template type-checking errors that
            // result from misconfigured imports.
            isPoisoned = true;
        }
        else if (this.compilationMode !== checker.CompilationMode.LOCAL &&
            (rawImports || rawDeferredImports)) {
            const importResolvers = checker.combineResolvers([
                createModuleWithProvidersResolver(this.reflector, this.isCore),
                checker.createForwardRefResolver(this.isCore),
            ]);
            const importDiagnostics = [];
            if (rawImports) {
                const expr = rawImports;
                const imported = this.evaluator.evaluate(expr, importResolvers);
                const { imports: flattened, diagnostics } = validateAndFlattenComponentImports(imported, expr, false /* isDeferred */);
                importDiagnostics.push(...diagnostics);
                resolvedImports = flattened;
                rawImports = expr;
            }
            if (rawDeferredImports) {
                const expr = rawDeferredImports;
                const imported = this.evaluator.evaluate(expr, importResolvers);
                const { imports: flattened, diagnostics } = validateAndFlattenComponentImports(imported, expr, true /* isDeferred */);
                importDiagnostics.push(...diagnostics);
                resolvedDeferredImports = flattened;
                rawDeferredImports = expr;
            }
            if (importDiagnostics.length > 0) {
                isPoisoned = true;
                if (diagnostics === undefined) {
                    diagnostics = [];
                }
                diagnostics.push(...importDiagnostics);
            }
        }
        let schemas = null;
        if (component.has('schemas') && !metadata.isStandalone) {
            if (diagnostics === undefined) {
                diagnostics = [];
            }
            diagnostics.push(checker.makeDiagnostic(checker.ErrorCode.COMPONENT_NOT_STANDALONE, component.get('schemas'), `'schemas' is only valid on a component that is standalone.`));
        }
        else if (this.compilationMode !== checker.CompilationMode.LOCAL && component.has('schemas')) {
            schemas = extractSchemas(component.get('schemas'), this.evaluator, 'Component');
        }
        else if (metadata.isStandalone) {
            schemas = [];
        }
        // Parse the template.
        // If a preanalyze phase was executed, the template may already exist in parsed form, so check
        // the preanalyzeTemplateCache.
        // Extract a closure of the template parsing code so that it can be reparsed with different
        // options if needed, like in the indexing pipeline.
        let template;
        if (this.preanalyzeTemplateCache.has(node)) {
            // The template was parsed in preanalyze. Use it and delete it to save memory.
            const preanalyzed = this.preanalyzeTemplateCache.get(node);
            this.preanalyzeTemplateCache.delete(node);
            template = preanalyzed;
        }
        else {
            try {
                const templateDecl = parseTemplateDeclaration(node, decorator, component, containingFile, this.evaluator, this.depTracker, this.resourceLoader, this.defaultPreserveWhitespaces);
                template = extractTemplate(node, templateDecl, this.evaluator, this.depTracker, this.resourceLoader, {
                    enableI18nLegacyMessageIdFormat: this.enableI18nLegacyMessageIdFormat,
                    i18nNormalizeLineEndingsInICUs: this.i18nNormalizeLineEndingsInICUs,
                    usePoisonedData: this.usePoisonedData,
                    enableBlockSyntax: this.enableBlockSyntax,
                    enableLetSyntax: this.enableLetSyntax,
                    preserveSignificantWhitespace: this.i18nPreserveSignificantWhitespace,
                }, this.compilationMode);
                if (this.compilationMode === checker.CompilationMode.LOCAL &&
                    template.errors &&
                    template.errors.length > 0) {
                    // Template errors are handled at the type check phase. But we skip this phase in local
                    // compilation mode. As a result we need to handle the errors now and add them to the diagnostics.
                    if (diagnostics === undefined) {
                        diagnostics = [];
                    }
                    diagnostics.push(...checker.getTemplateDiagnostics(template.errors, 
                    // Type check ID is required as part of the ype check, mainly for mapping the
                    // diagnostic back to its source. But here we are generating the diagnostic outside
                    // of the type check context, and so we skip the template ID.
                    '', template.sourceMapping));
                }
            }
            catch (e) {
                if (e instanceof checker.FatalDiagnosticError) {
                    diagnostics ??= [];
                    diagnostics.push(e.toDiagnostic());
                    isPoisoned = true;
                    // Create an empty template for the missing/invalid template.
                    // A build will still fail in this case. However, for the language service,
                    // this allows the component to exist in the compiler registry and prevents
                    // cascading diagnostics within an IDE due to "missing" components. The
                    // originating template related errors will still be reported in the IDE.
                    template = createEmptyTemplate(node, component, containingFile);
                }
                else {
                    throw e;
                }
            }
        }
        const templateResource = template.declaration.isInline
            ? { path: null, node: component.get('template') }
            : {
                path: checker.absoluteFrom(template.declaration.resolvedTemplateUrl),
                node: template.sourceMapping.node,
            };
        const relativeTemplatePath = getProjectRelativePath(templateResource.path ?? ts.getOriginalNode(node).getSourceFile().fileName, this.rootDirs, this.compilerHost);
        // Figure out the set of styles. The ordering here is important: external resources (styleUrls)
        // precede inline styles, and styles defined in the template override styles defined in the
        // component.
        let styles = [];
        const externalStyles = [];
        const hostBindingResources = checker.extractHostBindingResources(directiveResult.hostBindingNodes);
        const styleResources = extractInlineStyleResources(component);
        const styleUrls = [
            ...extractComponentStyleUrls(this.evaluator, component),
            ..._extractTemplateStyleUrls(template),
        ];
        for (const styleUrl of styleUrls) {
            try {
                const resourceUrl = this.resourceLoader.resolve(styleUrl.url, containingFile);
                if (this.externalRuntimeStyles) {
                    // External runtime styles are not considered disk-based and may not actually exist on disk
                    externalStyles.push(resourceUrl);
                    continue;
                }
                if (styleUrl.source === 2 /* ResourceTypeForDiagnostics.StylesheetFromDecorator */ &&
                    ts.isStringLiteralLike(styleUrl.expression)) {
                    // Only string literal values from the decorator are considered style resources
                    styleResources.add({
                        path: checker.absoluteFrom(resourceUrl),
                        node: styleUrl.expression,
                    });
                }
                const resourceStr = this.resourceLoader.load(resourceUrl);
                styles.push(resourceStr);
                if (this.depTracker !== null) {
                    this.depTracker.addResourceDependency(node.getSourceFile(), checker.absoluteFrom(resourceUrl));
                }
            }
            catch {
                if (this.depTracker !== null) {
                    // The analysis of this file cannot be re-used if one of the style URLs could
                    // not be resolved or loaded. Future builds should re-analyze and re-attempt
                    // resolution/loading.
                    this.depTracker.recordDependencyAnalysisFailure(node.getSourceFile());
                }
                if (diagnostics === undefined) {
                    diagnostics = [];
                }
                const resourceType = styleUrl.source === 2 /* ResourceTypeForDiagnostics.StylesheetFromDecorator */
                    ? 2 /* ResourceTypeForDiagnostics.StylesheetFromDecorator */
                    : 1 /* ResourceTypeForDiagnostics.StylesheetFromTemplate */;
                diagnostics.push(makeResourceNotFoundError(styleUrl.url, styleUrl.expression, resourceType).toDiagnostic());
            }
        }
        if (encapsulation === compiler.ViewEncapsulation.ShadowDom && metadata.selector !== null) {
            const selectorError = checkCustomElementSelectorForErrors(metadata.selector);
            if (selectorError !== null) {
                if (diagnostics === undefined) {
                    diagnostics = [];
                }
                diagnostics.push(checker.makeDiagnostic(checker.ErrorCode.COMPONENT_INVALID_SHADOW_DOM_SELECTOR, component.get('selector'), selectorError));
            }
        }
        // If inline styles were preprocessed use those
        let inlineStyles = null;
        if (this.preanalyzeStylesCache.has(node)) {
            inlineStyles = this.preanalyzeStylesCache.get(node);
            this.preanalyzeStylesCache.delete(node);
            if (inlineStyles?.length) {
                if (this.externalRuntimeStyles) {
                    // When external runtime styles is enabled, a list of URLs is provided
                    externalStyles.push(...inlineStyles);
                }
                else {
                    styles.push(...inlineStyles);
                }
            }
        }
        else {
            // Preprocessing is only supported asynchronously
            // If no style cache entry is present asynchronous preanalyze was not executed.
            // This protects against accidental differences in resource contents when preanalysis
            // is not used with a provided transformResource hook on the ResourceHost.
            if (this.resourceLoader.canPreprocess) {
                throw new Error('Inline resource processing requires asynchronous preanalyze.');
            }
            if (component.has('styles')) {
                const litStyles = checker.parseDirectiveStyles(component, this.evaluator, this.compilationMode);
                if (litStyles !== null) {
                    inlineStyles = [...litStyles];
                    styles.push(...litStyles);
                }
            }
            if (template.styles.length > 0) {
                styles.push(...template.styles);
            }
        }
        // Collect all explicitly deferred symbols from the `@Component.deferredImports` field
        // (if it exists) and populate the `DeferredSymbolTracker` state. These operations are safe
        // for the local compilation mode, since they don't require accessing/resolving symbols
        // outside of the current source file.
        let explicitlyDeferredTypes = null;
        if (metadata.isStandalone && rawDeferredImports !== null) {
            const deferredTypes = this.collectExplicitlyDeferredSymbols(rawDeferredImports);
            for (const [deferredType, importDetails] of deferredTypes) {
                explicitlyDeferredTypes ??= [];
                explicitlyDeferredTypes.push({
                    symbolName: importDetails.name,
                    importPath: importDetails.from,
                    isDefaultImport: isDefaultImport(importDetails.node),
                });
                this.deferredSymbolTracker.markAsDeferrableCandidate(deferredType, importDetails.node, node, true /* isExplicitlyDeferred */);
            }
        }
        const output = {
            analysis: {
                baseClass: checker.readBaseClass(node, this.reflector, this.evaluator),
                inputs,
                inputFieldNamesFromMetadataArray: directiveResult.inputFieldNamesFromMetadataArray,
                outputs,
                hostDirectives,
                rawHostDirectives,
                meta: {
                    ...metadata,
                    template,
                    encapsulation,
                    changeDetection,
                    interpolation: template.interpolationConfig ?? compiler.DEFAULT_INTERPOLATION_CONFIG,
                    styles,
                    externalStyles,
                    // These will be replaced during the compilation step, after all `NgModule`s have been
                    // analyzed and the full compilation scope for the component can be realized.
                    animations,
                    viewProviders: wrappedViewProviders,
                    i18nUseExternalIds: this.i18nUseExternalIds,
                    relativeContextFilePath,
                    rawImports: rawImports !== null ? new compiler.WrappedNodeExpr(rawImports) : undefined,
                    relativeTemplatePath,
                },
                typeCheckMeta: checker.extractDirectiveTypeCheckMeta(node, inputs, this.reflector),
                classMetadata: this.includeClassMetadata
                    ? extractClassMetadata(node, this.reflector, this.isCore, this.annotateForClosureCompiler, (dec) => transformDecoratorResources(dec, component, styles, template))
                    : null,
                classDebugInfo: extractClassDebugInfo(node, this.reflector, this.compilerHost, this.rootDirs, 
                /* forbidOrphanRenderering */ this.forbidOrphanRendering),
                template,
                providersRequiringFactory,
                viewProvidersRequiringFactory,
                inlineStyles,
                styleUrls,
                resources: {
                    styles: styleResources,
                    template: templateResource,
                    hostBindings: hostBindingResources,
                },
                isPoisoned,
                animationTriggerNames,
                rawImports,
                resolvedImports,
                rawDeferredImports,
                resolvedDeferredImports,
                explicitlyDeferredTypes,
                schemas,
                decorator: decorator?.node ?? null,
                hostBindingNodes: directiveResult.hostBindingNodes,
            },
            diagnostics,
        };
        return output;
    }
    symbol(node, analysis) {
        const typeParameters = extractSemanticTypeParameters(node);
        return new ComponentSymbol(node, analysis.meta.selector, analysis.inputs, analysis.outputs, analysis.meta.exportAs, analysis.typeCheckMeta, typeParameters);
    }
    register(node, analysis) {
        // Register this component's information with the `MetadataRegistry`. This ensures that
        // the information about the component is available during the compile() phase.
        const ref = new checker.Reference(node);
        this.metaRegistry.registerDirectiveMetadata({
            kind: checker.MetaKind.Directive,
            matchSource: checker.MatchSource.Selector,
            ref,
            name: node.name.text,
            selector: analysis.meta.selector,
            exportAs: analysis.meta.exportAs,
            inputs: analysis.inputs,
            inputFieldNamesFromMetadataArray: analysis.inputFieldNamesFromMetadataArray,
            outputs: analysis.outputs,
            queries: analysis.meta.queries.map((query) => query.propertyName),
            isComponent: true,
            baseClass: analysis.baseClass,
            hostDirectives: analysis.hostDirectives,
            ...analysis.typeCheckMeta,
            isPoisoned: analysis.isPoisoned,
            isStructural: false,
            isStandalone: analysis.meta.isStandalone,
            isSignal: analysis.meta.isSignal,
            imports: analysis.resolvedImports,
            rawImports: analysis.rawImports,
            deferredImports: analysis.resolvedDeferredImports,
            animationTriggerNames: analysis.animationTriggerNames,
            schemas: analysis.schemas,
            decorator: analysis.decorator,
            assumedToExportProviders: false,
            ngContentSelectors: analysis.template.ngContentSelectors,
            preserveWhitespaces: analysis.template.preserveWhitespaces ?? false,
            isExplicitlyDeferred: false,
        });
        this.resourceRegistry.registerResources(analysis.resources, node);
        this.injectableRegistry.registerInjectable(node, {
            ctorDeps: analysis.meta.deps,
        });
    }
    index(context, node, analysis) {
        if (analysis.isPoisoned && !this.usePoisonedData) {
            return null;
        }
        const scope = this.scopeReader.getScopeForComponent(node);
        const selector = analysis.meta.selector;
        const matcher = new compiler.SelectorMatcher();
        if (scope !== null) {
            let { dependencies, isPoisoned } = scope.kind === checker.ComponentScopeKind.NgModule ? scope.compilation : scope;
            if ((isPoisoned || (scope.kind === checker.ComponentScopeKind.NgModule && scope.exported.isPoisoned)) &&
                !this.usePoisonedData) {
                // Don't bother indexing components which had erroneous scopes, unless specifically
                // requested.
                return null;
            }
            for (const dep of dependencies) {
                if (dep.kind === checker.MetaKind.Directive && dep.selector !== null) {
                    matcher.addSelectables(compiler.CssSelector.parse(dep.selector), [
                        ...this.hostDirectivesResolver.resolve(dep),
                        dep,
                    ]);
                }
            }
        }
        const binder = new compiler.R3TargetBinder(matcher);
        const boundTemplate = binder.bind({ template: analysis.template.diagNodes });
        context.addComponent({
            declaration: node,
            selector,
            boundTemplate,
            templateMeta: {
                isInline: analysis.template.declaration.isInline,
                file: analysis.template.file,
            },
        });
        return null;
    }
    typeCheck(ctx, node, meta) {
        if (!ts.isClassDeclaration(node) || (meta.isPoisoned && !this.usePoisonedData)) {
            return;
        }
        const scope = this.typeCheckScopeRegistry.getTypeCheckScope(node);
        if (scope.isPoisoned && !this.usePoisonedData) {
            // Don't type-check components that had errors in their scopes, unless requested.
            return;
        }
        const binder = new compiler.R3TargetBinder(scope.matcher);
        const templateContext = {
            nodes: meta.template.diagNodes,
            pipes: scope.pipes,
            sourceMapping: meta.template.sourceMapping,
            file: meta.template.file,
            parseErrors: meta.template.errors,
            preserveWhitespaces: meta.meta.template.preserveWhitespaces ?? false,
        };
        const hostElement = this.typeCheckHostBindings
            ? checker.createHostElement('component', meta.meta.selector, node, meta.hostBindingNodes.literal, meta.hostBindingNodes.bindingDecorators, meta.hostBindingNodes.listenerDecorators)
            : null;
        const hostBindingsContext = hostElement === null
            ? null
            : {
                node: hostElement,
                sourceMapping: { type: 'direct', node },
            };
        ctx.addDirective(new checker.Reference(node), binder, scope.schemas, templateContext, hostBindingsContext, meta.meta.isStandalone);
    }
    extendedTemplateCheck(component, extendedTemplateChecker) {
        return extendedTemplateChecker.getDiagnosticsForComponent(component);
    }
    templateSemanticsCheck(component, templateSemanticsChecker) {
        return templateSemanticsChecker.getDiagnosticsForComponent(component);
    }
    resolve(node, analysis, symbol) {
        const metadata = analysis.meta;
        const diagnostics = [];
        const context = checker.getSourceFile(node);
        // Check if there are some import declarations that contain symbols used within
        // the `@Component.deferredImports` field, but those imports contain other symbols
        // and thus the declaration can not be removed. This diagnostics is shared between local and
        // global compilation modes.
        const nonRemovableImports = this.deferredSymbolTracker.getNonRemovableDeferredImports(context, node);
        if (nonRemovableImports.length > 0) {
            for (const importDecl of nonRemovableImports) {
                const diagnostic = checker.makeDiagnostic(checker.ErrorCode.DEFERRED_DEPENDENCY_IMPORTED_EAGERLY, importDecl, `This import contains symbols that are used both inside and outside of the ` +
                    `\`@Component.deferredImports\` fields in the file. This renders all these ` +
                    `defer imports useless as this import remains and its module is eagerly loaded. ` +
                    `To fix this, make sure that all symbols from the import are *only* used within ` +
                    `\`@Component.deferredImports\` arrays and there are no other references to those ` +
                    `symbols present in this file.`);
                diagnostics.push(diagnostic);
            }
            return { diagnostics };
        }
        let data;
        if (this.compilationMode === checker.CompilationMode.LOCAL) {
            // Initial value in local compilation mode.
            data = {
                declarations: EMPTY_ARRAY,
                declarationListEmitMode: !analysis.meta.isStandalone || analysis.rawImports !== null
                    ? 3 /* DeclarationListEmitMode.RuntimeResolved */
                    : 0 /* DeclarationListEmitMode.Direct */,
                deferPerBlockDependencies: this.locateDeferBlocksWithoutScope(analysis.template),
                deferBlockDepsEmitMode: 1 /* DeferBlockDepsEmitMode.PerComponent */,
                deferrableDeclToImportDecl: new Map(),
                deferPerComponentDependencies: analysis.explicitlyDeferredTypes ?? [],
            };
            if (this.localCompilationExtraImportsTracker === null) {
                // In local compilation mode the resolve phase is only needed for generating extra imports.
                // Otherwise we can skip it.
                return { data };
            }
        }
        else {
            // Initial value in global compilation mode.
            data = {
                declarations: EMPTY_ARRAY,
                declarationListEmitMode: 0 /* DeclarationListEmitMode.Direct */,
                deferPerBlockDependencies: new Map(),
                deferBlockDepsEmitMode: 0 /* DeferBlockDepsEmitMode.PerBlock */,
                deferrableDeclToImportDecl: new Map(),
                deferPerComponentDependencies: [],
            };
        }
        if (this.semanticDepGraphUpdater !== null && analysis.baseClass instanceof checker.Reference) {
            symbol.baseClass = this.semanticDepGraphUpdater.getSymbol(analysis.baseClass.node);
        }
        if (analysis.isPoisoned && !this.usePoisonedData) {
            return {};
        }
        const scope = this.scopeReader.getScopeForComponent(node);
        if (scope !== null) {
            // Replace the empty components and directives from the analyze() step with a fully expanded
            // scope. This is possible now because during resolve() the whole compilation unit has been
            // fully analyzed.
            //
            // First it needs to be determined if actually importing the directives/pipes used in the
            // template would create a cycle. Currently ngtsc refuses to generate cycles, so an option
            // known as "remote scoping" is used if a cycle would be created. In remote scoping, the
            // module file sets the directives/pipes on the ɵcmp of the component, without
            // requiring new imports (but also in a way that breaks tree shaking).
            //
            // Determining this is challenging, because the TemplateDefinitionBuilder is responsible for
            // matching directives and pipes in the template; however, that doesn't run until the actual
            // compile() step. It's not possible to run template compilation sooner as it requires the
            // ConstantPool for the overall file being compiled (which isn't available until the
            // transform step).
            //
            // Instead, directives/pipes are matched independently here, using the R3TargetBinder. This
            // is an alternative implementation of template matching which is used for template
            // type-checking and will eventually replace matching in the TemplateDefinitionBuilder.
            const isModuleScope = scope.kind === checker.ComponentScopeKind.NgModule;
            // Dependencies coming from the regular `imports` field.
            const dependencies = isModuleScope ? scope.compilation.dependencies : scope.dependencies;
            // Dependencies from the `@Component.deferredImports` field.
            const explicitlyDeferredDependencies = getExplicitlyDeferredDeps(scope);
            // Mark the component is an NgModule-based component with its NgModule in a different file
            // then mark this file for extra import generation
            if (isModuleScope && context.fileName !== checker.getSourceFile(scope.ngModule).fileName) {
                this.localCompilationExtraImportsTracker?.markFileForExtraImportGeneration(context);
            }
            // Make sure that `@Component.imports` and `@Component.deferredImports` do not have
            // the same dependencies.
            if (metadata.isStandalone &&
                analysis.rawDeferredImports !== null &&
                explicitlyDeferredDependencies.length > 0) {
                const diagnostic = validateNoImportOverlap(dependencies, explicitlyDeferredDependencies, analysis.rawDeferredImports);
                if (diagnostic !== null) {
                    diagnostics.push(diagnostic);
                }
            }
            // Set up the R3TargetBinder.
            const binder = createTargetBinder(dependencies);
            let allDependencies = dependencies;
            let deferBlockBinder = binder;
            // If there are any explicitly deferred dependencies (via `@Component.deferredImports`),
            // re-compute the list of dependencies and create a new binder for defer blocks. This
            // is because we have deferred dependencies that are not in the standard imports list
            // and need to be referenced later when determining what dependencies need to be in a
            // defer function / instruction call. Otherwise they end up treated as a standard
            // import, which is wrong.
            if (explicitlyDeferredDependencies.length > 0) {
                allDependencies = [...explicitlyDeferredDependencies, ...dependencies];
                deferBlockBinder = createTargetBinder(allDependencies);
            }
            // Set up the pipes map that is later used to determine which dependencies are used in
            // the template.
            const pipes = extractPipes(allDependencies);
            // Next, the component template AST is bound using the R3TargetBinder. This produces a
            // BoundTarget, which is similar to a ts.TypeChecker.
            const bound = binder.bind({ template: metadata.template.nodes });
            // Find all defer blocks used in the template and for each block
            // bind its own scope.
            const deferBlocks = new Map();
            for (const deferBlock of bound.getDeferBlocks()) {
                deferBlocks.set(deferBlock, deferBlockBinder.bind({ template: deferBlock.children }));
            }
            // Register all Directives and Pipes used at the top level (outside
            // of any defer blocks), which would be eagerly referenced.
            const eagerlyUsed = new Set();
            if (this.enableHmr) {
                // In HMR we need to preserve all the dependencies, because they have to remain consistent
                // with the initially-generated code no matter what the template looks like.
                for (const dep of dependencies) {
                    if (dep.ref.node !== node) {
                        eagerlyUsed.add(dep.ref.node);
                    }
                    else {
                        const used = bound.getEagerlyUsedDirectives();
                        if (used.some((current) => current.ref.node === node)) {
                            eagerlyUsed.add(node);
                        }
                    }
                }
            }
            else {
                for (const dir of bound.getEagerlyUsedDirectives()) {
                    eagerlyUsed.add(dir.ref.node);
                }
                for (const name of bound.getEagerlyUsedPipes()) {
                    if (!pipes.has(name)) {
                        continue;
                    }
                    eagerlyUsed.add(pipes.get(name).ref.node);
                }
            }
            // Set of Directives and Pipes used across the entire template,
            // including all defer blocks.
            const wholeTemplateUsed = new Set(eagerlyUsed);
            for (const bound of deferBlocks.values()) {
                for (const dir of bound.getUsedDirectives()) {
                    wholeTemplateUsed.add(dir.ref.node);
                }
                for (const name of bound.getUsedPipes()) {
                    if (!pipes.has(name)) {
                        continue;
                    }
                    wholeTemplateUsed.add(pipes.get(name).ref.node);
                }
            }
            const declarations = new Map();
            // Transform the dependencies list, filtering out unused dependencies.
            for (const dep of allDependencies) {
                // Only emit references to each dependency once.
                if (declarations.has(dep.ref.node)) {
                    continue;
                }
                switch (dep.kind) {
                    case checker.MetaKind.Directive:
                        if (!wholeTemplateUsed.has(dep.ref.node) || dep.matchSource !== checker.MatchSource.Selector) {
                            continue;
                        }
                        const dirType = this.refEmitter.emit(dep.ref, context);
                        checker.assertSuccessfulReferenceEmit(dirType, node.name, dep.isComponent ? 'component' : 'directive');
                        declarations.set(dep.ref.node, {
                            kind: compiler.R3TemplateDependencyKind.Directive,
                            ref: dep.ref,
                            type: dirType.expression,
                            importedFile: dirType.importedFile,
                            selector: dep.selector,
                            inputs: dep.inputs.propertyNames,
                            outputs: dep.outputs.propertyNames,
                            exportAs: dep.exportAs,
                            isComponent: dep.isComponent,
                        });
                        break;
                    case checker.MetaKind.Pipe:
                        if (!wholeTemplateUsed.has(dep.ref.node)) {
                            continue;
                        }
                        const pipeType = this.refEmitter.emit(dep.ref, context);
                        checker.assertSuccessfulReferenceEmit(pipeType, node.name, 'pipe');
                        declarations.set(dep.ref.node, {
                            kind: compiler.R3TemplateDependencyKind.Pipe,
                            type: pipeType.expression,
                            name: dep.name,
                            ref: dep.ref,
                            importedFile: pipeType.importedFile,
                        });
                        break;
                    case checker.MetaKind.NgModule:
                        const ngModuleType = this.refEmitter.emit(dep.ref, context);
                        checker.assertSuccessfulReferenceEmit(ngModuleType, node.name, 'NgModule');
                        declarations.set(dep.ref.node, {
                            kind: compiler.R3TemplateDependencyKind.NgModule,
                            type: ngModuleType.expression,
                            importedFile: ngModuleType.importedFile,
                        });
                        break;
                }
            }
            const getSemanticReference = (decl) => this.semanticDepGraphUpdater.getSemanticReference(decl.ref.node, decl.type);
            if (this.semanticDepGraphUpdater !== null) {
                symbol.usedDirectives = Array.from(declarations.values())
                    .filter(isUsedDirective)
                    .map(getSemanticReference);
                symbol.usedPipes = Array.from(declarations.values())
                    .filter(isUsedPipe)
                    .map(getSemanticReference);
            }
            const eagerDeclarations = Array.from(declarations.values()).filter((decl) => decl.kind === compiler.R3TemplateDependencyKind.NgModule || eagerlyUsed.has(decl.ref.node));
            // Process information related to defer blocks
            if (this.compilationMode !== checker.CompilationMode.LOCAL) {
                this.resolveDeferBlocks(node, deferBlocks, declarations, data, analysis, eagerlyUsed);
            }
            const cyclesFromDirectives = new Map();
            const cyclesFromPipes = new Map();
            // Scan through the directives/pipes actually used in the template and check whether any
            // import which needs to be generated would create a cycle. This check is skipped for
            // standalone components as the dependencies of a standalone component have already been
            // imported directly by the user, so Angular won't introduce any imports that aren't already
            // in the user's program.
            if (!metadata.isStandalone) {
                for (const usedDep of eagerDeclarations) {
                    const cycle = this._checkForCyclicImport(usedDep.importedFile, usedDep.type, context);
                    if (cycle !== null) {
                        switch (usedDep.kind) {
                            case compiler.R3TemplateDependencyKind.Directive:
                                cyclesFromDirectives.set(usedDep, cycle);
                                break;
                            case compiler.R3TemplateDependencyKind.Pipe:
                                cyclesFromPipes.set(usedDep, cycle);
                                break;
                        }
                    }
                }
            }
            // Check whether any usages of standalone components in imports requires the dependencies
            // array to be wrapped in a closure. This check is technically a heuristic as there's no
            // direct way to check whether a `Reference` came from a `forwardRef`. Instead, we check if
            // the reference is `synthetic`, implying it came from _any_ foreign function resolver,
            // including the `forwardRef` resolver.
            const standaloneImportMayBeForwardDeclared = analysis.resolvedImports !== null && analysis.resolvedImports.some((ref) => ref.synthetic);
            const cycleDetected = cyclesFromDirectives.size !== 0 || cyclesFromPipes.size !== 0;
            if (!cycleDetected) {
                // No cycle was detected. Record the imports that need to be created in the cycle detector
                // so that future cyclic import checks consider their production.
                for (const { type, importedFile } of eagerDeclarations) {
                    this.maybeRecordSyntheticImport(importedFile, type, context);
                }
                // Check whether the dependencies arrays in ɵcmp need to be wrapped in a closure.
                // This is required if any dependency reference is to a declaration in the same file
                // but declared after this component.
                const declarationIsForwardDeclared = eagerDeclarations.some((decl) => checker.isExpressionForwardReference(decl.type, node.name, context));
                if (this.compilationMode !== checker.CompilationMode.LOCAL &&
                    (declarationIsForwardDeclared || standaloneImportMayBeForwardDeclared)) {
                    data.declarationListEmitMode = 1 /* DeclarationListEmitMode.Closure */;
                }
                data.declarations = eagerDeclarations;
                // Register extra local imports.
                if (this.compilationMode === checker.CompilationMode.LOCAL &&
                    this.localCompilationExtraImportsTracker !== null) {
                    // In global compilation mode `eagerDeclarations` contains "all" the component
                    // dependencies, whose import statements will be added to the file. In local compilation
                    // mode `eagerDeclarations` only includes the "local" dependencies, meaning those that are
                    // declared inside this compilation unit.Here the import info of these local dependencies
                    // are added to the tracker so that we can generate extra imports representing these local
                    // dependencies. For non-local dependencies we use another technique of adding some
                    // best-guess extra imports globally to all files using
                    // `localCompilationExtraImportsTracker.addGlobalImportFromIdentifier`.
                    for (const { type } of eagerDeclarations) {
                        if (type instanceof compiler.ExternalExpr && type.value.moduleName) {
                            this.localCompilationExtraImportsTracker.addImportForFile(context, type.value.moduleName);
                        }
                    }
                }
            }
            else {
                if (this.cycleHandlingStrategy === 0 /* CycleHandlingStrategy.UseRemoteScoping */) {
                    // Declaring the directiveDefs/pipeDefs arrays directly would require imports that would
                    // create a cycle. Instead, mark this component as requiring remote scoping, so that the
                    // NgModule file will take care of setting the directives for the component.
                    this.scopeRegistry.setComponentRemoteScope(node, eagerDeclarations.filter(isUsedDirective).map((dir) => dir.ref), eagerDeclarations.filter(isUsedPipe).map((pipe) => pipe.ref));
                    symbol.isRemotelyScoped = true;
                    // If a semantic graph is being tracked, record the fact that this component is remotely
                    // scoped with the declaring NgModule symbol as the NgModule's emit becomes dependent on
                    // the directive/pipe usages of this component.
                    if (this.semanticDepGraphUpdater !== null &&
                        scope.kind === checker.ComponentScopeKind.NgModule &&
                        scope.ngModule !== null) {
                        const moduleSymbol = this.semanticDepGraphUpdater.getSymbol(scope.ngModule);
                        if (!(moduleSymbol instanceof NgModuleSymbol)) {
                            throw new Error(`AssertionError: Expected ${scope.ngModule.name} to be an NgModuleSymbol.`);
                        }
                        moduleSymbol.addRemotelyScopedComponent(symbol, symbol.usedDirectives, symbol.usedPipes);
                    }
                }
                else {
                    // We are not able to handle this cycle so throw an error.
                    const relatedMessages = [];
                    for (const [dir, cycle] of cyclesFromDirectives) {
                        relatedMessages.push(makeCyclicImportInfo(dir.ref, dir.isComponent ? 'component' : 'directive', cycle));
                    }
                    for (const [pipe, cycle] of cyclesFromPipes) {
                        relatedMessages.push(makeCyclicImportInfo(pipe.ref, 'pipe', cycle));
                    }
                    throw new checker.FatalDiagnosticError(checker.ErrorCode.IMPORT_CYCLE_DETECTED, node, 'One or more import cycles would need to be created to compile this component, ' +
                        'which is not supported by the current compiler configuration.', relatedMessages);
                }
            }
        }
        else {
            // If there is no scope, we can still use the binder to retrieve *some* information about the
            // deferred blocks.
            data.deferPerBlockDependencies = this.locateDeferBlocksWithoutScope(metadata.template);
        }
        // Run diagnostics only in global mode.
        if (this.compilationMode !== checker.CompilationMode.LOCAL) {
            // Validate `@Component.imports` and `@Component.deferredImports` fields.
            if (analysis.resolvedImports !== null && analysis.rawImports !== null) {
                const importDiagnostics = validateStandaloneImports(analysis.resolvedImports, analysis.rawImports, this.metaReader, this.scopeReader, false /* isDeferredImport */);
                diagnostics.push(...importDiagnostics);
            }
            if (analysis.resolvedDeferredImports !== null && analysis.rawDeferredImports !== null) {
                const importDiagnostics = validateStandaloneImports(analysis.resolvedDeferredImports, analysis.rawDeferredImports, this.metaReader, this.scopeReader, true /* isDeferredImport */);
                diagnostics.push(...importDiagnostics);
            }
            if (analysis.providersRequiringFactory !== null &&
                analysis.meta.providers instanceof compiler.WrappedNodeExpr) {
                const providerDiagnostics = checker.getProviderDiagnostics(analysis.providersRequiringFactory, analysis.meta.providers.node, this.injectableRegistry);
                diagnostics.push(...providerDiagnostics);
            }
            if (analysis.viewProvidersRequiringFactory !== null &&
                analysis.meta.viewProviders instanceof compiler.WrappedNodeExpr) {
                const viewProviderDiagnostics = checker.getProviderDiagnostics(analysis.viewProvidersRequiringFactory, analysis.meta.viewProviders.node, this.injectableRegistry);
                diagnostics.push(...viewProviderDiagnostics);
            }
            const directiveDiagnostics = checker.getDirectiveDiagnostics(node, this.injectableRegistry, this.evaluator, this.reflector, this.scopeRegistry, this.strictCtorDeps, 'Component');
            if (directiveDiagnostics !== null) {
                diagnostics.push(...directiveDiagnostics);
            }
            const hostDirectivesDiagnostics = analysis.hostDirectives && analysis.rawHostDirectives
                ? checker.validateHostDirectives(analysis.rawHostDirectives, analysis.hostDirectives, this.metaReader)
                : null;
            if (hostDirectivesDiagnostics !== null) {
                diagnostics.push(...hostDirectivesDiagnostics);
            }
        }
        if (diagnostics.length > 0) {
            return { diagnostics };
        }
        return { data };
    }
    xi18n(ctx, node, analysis) {
        ctx.updateFromTemplate(analysis.template.content, analysis.template.declaration.resolvedTemplateUrl, analysis.template.interpolationConfig ?? compiler.DEFAULT_INTERPOLATION_CONFIG);
    }
    updateResources(node, analysis) {
        const containingFile = node.getSourceFile().fileName;
        // If the template is external, re-parse it.
        const templateDecl = analysis.template.declaration;
        if (!templateDecl.isInline) {
            analysis.template = extractTemplate(node, templateDecl, this.evaluator, this.depTracker, this.resourceLoader, this.extractTemplateOptions, this.compilationMode);
        }
        // Update any external stylesheets and rebuild the combined 'styles' list.
        // TODO(alxhub): write tests for styles when the primary compiler uses the updateResources
        // path
        let styles = [];
        if (analysis.styleUrls !== null) {
            for (const styleUrl of analysis.styleUrls) {
                try {
                    const resolvedStyleUrl = this.resourceLoader.resolve(styleUrl.url, containingFile);
                    const styleText = this.resourceLoader.load(resolvedStyleUrl);
                    styles.push(styleText);
                }
                catch (e) {
                    // Resource resolve failures should already be in the diagnostics list from the analyze
                    // stage. We do not need to do anything with them when updating resources.
                }
            }
        }
        if (analysis.inlineStyles !== null) {
            for (const styleText of analysis.inlineStyles) {
                styles.push(styleText);
            }
        }
        for (const styleText of analysis.template.styles) {
            styles.push(styleText);
        }
        analysis.meta.styles = styles.filter((s) => s.trim().length > 0);
    }
    compileFull(node, analysis, resolution, pool) {
        if (analysis.template.errors !== null && analysis.template.errors.length > 0) {
            return [];
        }
        const perComponentDeferredDeps = this.canDeferDeps
            ? this.resolveAllDeferredDependencies(resolution)
            : null;
        const defer = this.compileDeferBlocks(resolution);
        const meta = {
            ...analysis.meta,
            ...resolution,
            defer,
        };
        const fac = compileNgFactoryDefField(checker.toFactoryMetadata(meta, compiler.FactoryTarget.Component));
        if (perComponentDeferredDeps !== null) {
            removeDeferrableTypesFromComponentDecorator(analysis, perComponentDeferredDeps);
        }
        const def = compiler.compileComponentFromMetadata(meta, pool, compiler.makeBindingParser());
        const inputTransformFields = compileInputTransformFields(analysis.inputs);
        const classMetadata = analysis.classMetadata !== null
            ? compileComponentClassMetadata(analysis.classMetadata, perComponentDeferredDeps).toStmt()
            : null;
        const debugInfo = analysis.classDebugInfo !== null
            ? compileClassDebugInfo(analysis.classDebugInfo).toStmt()
            : null;
        const hmrMeta = this.enableHmr
            ? extractHmrMetatadata(node, this.reflector, this.evaluator, this.compilerHost, this.rootDirs, def, fac, defer, classMetadata, debugInfo)
            : null;
        const hmrInitializer = hmrMeta ? compileHmrInitializer(hmrMeta).toStmt() : null;
        const deferrableImports = this.canDeferDeps
            ? this.deferredSymbolTracker.getDeferrableImportDecls()
            : null;
        return checker.compileResults(fac, def, classMetadata, 'ɵcmp', inputTransformFields, deferrableImports, debugInfo, hmrInitializer);
    }
    compilePartial(node, analysis, resolution) {
        if (analysis.template.errors !== null && analysis.template.errors.length > 0) {
            return [];
        }
        const templateInfo = {
            content: analysis.template.content,
            sourceUrl: analysis.template.declaration.resolvedTemplateUrl,
            isInline: analysis.template.declaration.isInline,
            inlineTemplateLiteralExpression: analysis.template.sourceMapping.type === 'direct'
                ? new compiler.WrappedNodeExpr(analysis.template.sourceMapping.node)
                : null,
        };
        const perComponentDeferredDeps = this.canDeferDeps
            ? this.resolveAllDeferredDependencies(resolution)
            : null;
        const defer = this.compileDeferBlocks(resolution);
        const meta = {
            ...analysis.meta,
            ...resolution,
            defer,
        };
        const fac = compileDeclareFactory(checker.toFactoryMetadata(meta, compiler.FactoryTarget.Component));
        const inputTransformFields = compileInputTransformFields(analysis.inputs);
        const def = compileDeclareComponentFromMetadata(meta, analysis.template, templateInfo);
        const classMetadata = analysis.classMetadata !== null
            ? compileComponentDeclareClassMetadata(analysis.classMetadata, perComponentDeferredDeps).toStmt()
            : null;
        const hmrMeta = this.enableHmr
            ? extractHmrMetatadata(node, this.reflector, this.evaluator, this.compilerHost, this.rootDirs, def, fac, defer, classMetadata, null)
            : null;
        const hmrInitializer = hmrMeta ? compileHmrInitializer(hmrMeta).toStmt() : null;
        const deferrableImports = this.canDeferDeps
            ? this.deferredSymbolTracker.getDeferrableImportDecls()
            : null;
        return checker.compileResults(fac, def, classMetadata, 'ɵcmp', inputTransformFields, deferrableImports, null, hmrInitializer);
    }
    compileLocal(node, analysis, resolution, pool) {
        // In the local compilation mode we can only rely on the information available
        // within the `@Component.deferredImports` array, because in this mode compiler
        // doesn't have information on which dependencies belong to which defer blocks.
        const deferrableTypes = this.canDeferDeps ? analysis.explicitlyDeferredTypes : null;
        const defer = this.compileDeferBlocks(resolution);
        const meta = {
            ...analysis.meta,
            ...resolution,
            defer,
        };
        if (deferrableTypes !== null) {
            removeDeferrableTypesFromComponentDecorator(analysis, deferrableTypes);
        }
        const fac = compileNgFactoryDefField(checker.toFactoryMetadata(meta, compiler.FactoryTarget.Component));
        const def = compiler.compileComponentFromMetadata(meta, pool, compiler.makeBindingParser());
        const inputTransformFields = compileInputTransformFields(analysis.inputs);
        const classMetadata = analysis.classMetadata !== null
            ? compileComponentClassMetadata(analysis.classMetadata, deferrableTypes).toStmt()
            : null;
        const debugInfo = analysis.classDebugInfo !== null
            ? compileClassDebugInfo(analysis.classDebugInfo).toStmt()
            : null;
        const hmrMeta = this.enableHmr
            ? extractHmrMetatadata(node, this.reflector, this.evaluator, this.compilerHost, this.rootDirs, def, fac, defer, classMetadata, debugInfo)
            : null;
        const hmrInitializer = hmrMeta ? compileHmrInitializer(hmrMeta).toStmt() : null;
        const deferrableImports = this.canDeferDeps
            ? this.deferredSymbolTracker.getDeferrableImportDecls()
            : null;
        return checker.compileResults(fac, def, classMetadata, 'ɵcmp', inputTransformFields, deferrableImports, debugInfo, hmrInitializer);
    }
    compileHmrUpdateDeclaration(node, analysis, resolution) {
        if (analysis.template.errors !== null && analysis.template.errors.length > 0) {
            return null;
        }
        // Create a brand-new constant pool since there shouldn't be any constant sharing.
        const pool = new compiler.ConstantPool();
        const defer = this.compileDeferBlocks(resolution);
        const meta = {
            ...analysis.meta,
            ...resolution,
            defer,
        };
        const fac = compileNgFactoryDefField(checker.toFactoryMetadata(meta, compiler.FactoryTarget.Component));
        const def = compiler.compileComponentFromMetadata(meta, pool, compiler.makeBindingParser());
        const classMetadata = analysis.classMetadata !== null
            ? compileComponentClassMetadata(analysis.classMetadata, null).toStmt()
            : null;
        const debugInfo = analysis.classDebugInfo !== null
            ? compileClassDebugInfo(analysis.classDebugInfo).toStmt()
            : null;
        const hmrMeta = this.enableHmr
            ? extractHmrMetatadata(node, this.reflector, this.evaluator, this.compilerHost, this.rootDirs, def, fac, defer, classMetadata, debugInfo)
            : null;
        const res = checker.compileResults(fac, def, classMetadata, 'ɵcmp', null, null, debugInfo, null);
        return hmrMeta === null || res.length === 0
            ? null
            : getHmrUpdateDeclaration(res, pool.statements, hmrMeta, node);
    }
    /**
     * Locates defer blocks in case scope information is not available.
     * For example, this happens in the local compilation mode.
     */
    locateDeferBlocksWithoutScope(template) {
        const deferBlocks = new Map();
        const directivelessBinder = new compiler.R3TargetBinder(new compiler.SelectorMatcher());
        const bound = directivelessBinder.bind({ template: template.nodes });
        const deferredBlocks = bound.getDeferBlocks();
        for (const block of deferredBlocks) {
            // We can't determine the dependencies without a scope so we leave them empty.
            deferBlocks.set(block, []);
        }
        return deferBlocks;
    }
    /**
     * Computes a list of deferrable symbols based on dependencies from
     * the `@Component.imports` field and their usage in `@defer` blocks.
     */
    resolveAllDeferredDependencies(resolution) {
        const seenDeps = new Set();
        const deferrableTypes = [];
        // Go over all dependencies of all defer blocks and update the value of
        // the `isDeferrable` flag and the `importPath` to reflect the current
        // state after visiting all components during the `resolve` phase.
        for (const [_, deps] of resolution.deferPerBlockDependencies) {
            for (const deferBlockDep of deps) {
                const node = deferBlockDep.declaration.node;
                const importDecl = resolution.deferrableDeclToImportDecl.get(node) ?? null;
                if (importDecl !== null && this.deferredSymbolTracker.canDefer(importDecl)) {
                    deferBlockDep.isDeferrable = true;
                    deferBlockDep.importPath = importDecl.moduleSpecifier.text;
                    deferBlockDep.isDefaultImport = isDefaultImport(importDecl);
                    // The same dependency may be used across multiple deferred blocks. De-duplicate it
                    // because it can throw off other logic further down the compilation pipeline.
                    // Note that the logic above needs to run even if the dependency is seen before,
                    // because the object literals are different between each block.
                    if (!seenDeps.has(node)) {
                        seenDeps.add(node);
                        deferrableTypes.push(deferBlockDep);
                    }
                }
            }
        }
        return deferrableTypes;
    }
    /**
     * Collects deferrable symbols from the `@Component.deferredImports` field.
     */
    collectExplicitlyDeferredSymbols(rawDeferredImports) {
        const deferredTypes = new Map();
        if (!ts.isArrayLiteralExpression(rawDeferredImports)) {
            return deferredTypes;
        }
        for (const element of rawDeferredImports.elements) {
            const node = checker.tryUnwrapForwardRef(element, this.reflector) || element;
            if (!ts.isIdentifier(node)) {
                // Can't defer-load non-literal references.
                continue;
            }
            const imp = this.reflector.getImportOfIdentifier(node);
            if (imp !== null) {
                deferredTypes.set(node, imp);
            }
        }
        return deferredTypes;
    }
    /**
     * Check whether adding an import from `origin` to the source-file corresponding to `expr` would
     * create a cyclic import.
     *
     * @returns a `Cycle` object if a cycle would be created, otherwise `null`.
     */
    _checkForCyclicImport(importedFile, expr, origin) {
        const imported = checker.resolveImportedFile(this.moduleResolver, importedFile, expr, origin);
        if (imported === null) {
            return null;
        }
        // Check whether the import is legal.
        return this.cycleAnalyzer.wouldCreateCycle(origin, imported);
    }
    maybeRecordSyntheticImport(importedFile, expr, origin) {
        const imported = checker.resolveImportedFile(this.moduleResolver, importedFile, expr, origin);
        if (imported === null) {
            return;
        }
        this.cycleAnalyzer.recordSyntheticImport(origin, imported);
    }
    /**
     * Resolves information about defer blocks dependencies to make it
     * available for the final `compile` step.
     */
    resolveDeferBlocks(componentClassDecl, deferBlocks, deferrableDecls, resolutionData, analysisData, eagerlyUsedDecls) {
        // Collect all deferred decls from all defer blocks from the entire template
        // to intersect with the information from the `imports` field of a particular
        // Component.
        const allDeferredDecls = new Set();
        for (const [deferBlock, bound] of deferBlocks) {
            const usedDirectives = new Set(bound.getEagerlyUsedDirectives().map((d) => d.ref.node));
            const usedPipes = new Set(bound.getEagerlyUsedPipes());
            let deps;
            if (resolutionData.deferPerBlockDependencies.has(deferBlock)) {
                deps = resolutionData.deferPerBlockDependencies.get(deferBlock);
            }
            else {
                deps = [];
                resolutionData.deferPerBlockDependencies.set(deferBlock, deps);
            }
            for (const decl of Array.from(deferrableDecls.values())) {
                if (decl.kind === compiler.R3TemplateDependencyKind.NgModule) {
                    continue;
                }
                if (decl.kind === compiler.R3TemplateDependencyKind.Directive &&
                    !usedDirectives.has(decl.ref.node)) {
                    continue;
                }
                if (decl.kind === compiler.R3TemplateDependencyKind.Pipe && !usedPipes.has(decl.name)) {
                    continue;
                }
                // Collect initial information about this dependency.
                // `isDeferrable`, `importPath` and `isDefaultImport` will be
                // added later during the `compile` step.
                deps.push({
                    typeReference: decl.type,
                    symbolName: decl.ref.node.name.text,
                    isDeferrable: false,
                    importPath: null,
                    isDefaultImport: false,
                    declaration: decl.ref,
                });
                allDeferredDecls.add(decl.ref.node);
            }
        }
        // For standalone components with the `imports` and `deferredImports` fields -
        // inspect the list of referenced symbols and mark the ones used in defer blocks
        // as potential candidates for defer loading.
        if (analysisData.meta.isStandalone) {
            if (analysisData.rawImports !== null) {
                this.registerDeferrableCandidates(componentClassDecl, analysisData.rawImports, false /* isDeferredImport */, allDeferredDecls, eagerlyUsedDecls, resolutionData);
            }
            if (analysisData.rawDeferredImports !== null) {
                this.registerDeferrableCandidates(componentClassDecl, analysisData.rawDeferredImports, true /* isDeferredImport */, allDeferredDecls, eagerlyUsedDecls, resolutionData);
            }
        }
    }
    /**
     * Inspects provided imports expression (either `@Component.imports` or
     * `@Component.deferredImports`) and registers imported types as deferrable
     * candidates.
     */
    registerDeferrableCandidates(componentClassDecl, importsExpr, isDeferredImport, allDeferredDecls, eagerlyUsedDecls, resolutionData) {
        if (!ts.isArrayLiteralExpression(importsExpr)) {
            return;
        }
        for (const element of importsExpr.elements) {
            const node = checker.tryUnwrapForwardRef(element, this.reflector) || element;
            if (!ts.isIdentifier(node)) {
                // Can't defer-load non-literal references.
                continue;
            }
            const imp = this.reflector.getImportOfIdentifier(node);
            if (imp === null) {
                // Can't defer-load symbols which aren't imported.
                continue;
            }
            const decl = this.reflector.getDeclarationOfIdentifier(node);
            if (decl === null) {
                // Can't defer-load symbols which don't exist.
                continue;
            }
            if (!checker.isNamedClassDeclaration(decl.node)) {
                // Can't defer-load symbols which aren't classes.
                continue;
            }
            // Are we even trying to defer-load this symbol?
            if (!allDeferredDecls.has(decl.node)) {
                continue;
            }
            if (eagerlyUsedDecls.has(decl.node)) {
                // Can't defer-load symbols that are eagerly referenced as a dependency
                // in a template outside of a defer block.
                continue;
            }
            // Is it a standalone directive/component?
            const dirMeta = this.metaReader.getDirectiveMetadata(new checker.Reference(decl.node));
            if (dirMeta !== null && !dirMeta.isStandalone) {
                continue;
            }
            // Is it a standalone pipe?
            const pipeMeta = this.metaReader.getPipeMetadata(new checker.Reference(decl.node));
            if (pipeMeta !== null && !pipeMeta.isStandalone) {
                continue;
            }
            if (dirMeta === null && pipeMeta === null) {
                // This is not a directive or a pipe.
                continue;
            }
            // Keep track of how this class made it into the current source file
            // (which ts.ImportDeclaration was used for this symbol).
            resolutionData.deferrableDeclToImportDecl.set(decl.node, imp.node);
            this.deferredSymbolTracker.markAsDeferrableCandidate(node, imp.node, componentClassDecl, isDeferredImport);
        }
    }
    compileDeferBlocks(resolution) {
        const { deferBlockDepsEmitMode: mode, deferPerBlockDependencies: perBlockDeps, deferPerComponentDependencies: perComponentDeps, } = resolution;
        if (mode === 0 /* DeferBlockDepsEmitMode.PerBlock */) {
            if (!perBlockDeps) {
                throw new Error('Internal error: deferPerBlockDependencies must be present when compiling in PerBlock mode');
            }
            const blocks = new Map();
            for (const [block, dependencies] of perBlockDeps) {
                blocks.set(block, dependencies.length === 0 ? null : compiler.compileDeferResolverFunction({ mode, dependencies }));
            }
            return { mode, blocks };
        }
        if (mode === 1 /* DeferBlockDepsEmitMode.PerComponent */) {
            if (!perComponentDeps) {
                throw new Error('Internal error: deferPerComponentDependencies must be present in PerComponent mode');
            }
            return {
                mode,
                dependenciesFn: perComponentDeps.length === 0
                    ? null
                    : compiler.compileDeferResolverFunction({ mode, dependencies: perComponentDeps }),
            };
        }
        throw new Error(`Invalid deferBlockDepsEmitMode. Cannot compile deferred block metadata.`);
    }
}
/**
 * Creates an instance of a target binder based on provided dependencies.
 */
function createTargetBinder(dependencies) {
    const matcher = new compiler.SelectorMatcher();
    for (const dep of dependencies) {
        if (dep.kind === checker.MetaKind.Directive && dep.selector !== null) {
            matcher.addSelectables(compiler.CssSelector.parse(dep.selector), [dep]);
        }
    }
    return new compiler.R3TargetBinder(matcher);
}
/**
 * Returns the list of dependencies from `@Component.deferredImports` if provided.
 */
function getExplicitlyDeferredDeps(scope) {
    return scope.kind === checker.ComponentScopeKind.NgModule
        ? []
        : scope.deferredDependencies;
}
function extractPipes(dependencies) {
    const pipes = new Map();
    for (const dep of dependencies) {
        if (dep.kind === checker.MetaKind.Pipe) {
            pipes.set(dep.name, dep);
        }
    }
    return pipes;
}
/**
 * Drop references to existing imports for deferrable symbols that should be present
 * in the `setClassMetadataAsync` call. Otherwise, an import declaration gets retained.
 */
function removeDeferrableTypesFromComponentDecorator(analysis, deferrableTypes) {
    if (analysis.classMetadata) {
        const deferrableSymbols = new Set(deferrableTypes.map((t) => t.symbolName));
        const rewrittenDecoratorsNode = removeIdentifierReferences(analysis.classMetadata.decorators.node, deferrableSymbols);
        analysis.classMetadata.decorators = new compiler.WrappedNodeExpr(rewrittenDecoratorsNode);
    }
}
/**
 * Validates that `@Component.imports` and `@Component.deferredImports` do not have
 * overlapping dependencies.
 */
function validateNoImportOverlap(eagerDeps, deferredDeps, rawDeferredImports) {
    let diagnostic = null;
    const eagerDepsSet = new Set();
    for (const eagerDep of eagerDeps) {
        eagerDepsSet.add(eagerDep.ref.node);
    }
    for (const deferredDep of deferredDeps) {
        if (eagerDepsSet.has(deferredDep.ref.node)) {
            const classInfo = deferredDep.ref.debugName
                ? `The \`${deferredDep.ref.debugName}\``
                : 'One of the dependencies';
            diagnostic = checker.makeDiagnostic(checker.ErrorCode.DEFERRED_DEPENDENCY_IMPORTED_EAGERLY, getDiagnosticNode(deferredDep.ref, rawDeferredImports), `\`${classInfo}\` is imported via both \`@Component.imports\` and ` +
                `\`@Component.deferredImports\`. To fix this, make sure that ` +
                `dependencies are imported only once.`);
            break;
        }
    }
    return diagnostic;
}
function validateStandaloneImports(importRefs, importExpr, metaReader, scopeReader, isDeferredImport) {
    const diagnostics = [];
    for (const ref of importRefs) {
        const dirMeta = metaReader.getDirectiveMetadata(ref);
        if (dirMeta !== null) {
            if (!dirMeta.isStandalone) {
                // Directly importing a directive that's not standalone is an error.
                diagnostics.push(makeNotStandaloneDiagnostic(scopeReader, ref, importExpr, dirMeta.isComponent ? 'component' : 'directive'));
            }
            continue;
        }
        const pipeMeta = metaReader.getPipeMetadata(ref);
        if (pipeMeta !== null) {
            if (!pipeMeta.isStandalone) {
                diagnostics.push(makeNotStandaloneDiagnostic(scopeReader, ref, importExpr, 'pipe'));
            }
            continue;
        }
        const ngModuleMeta = metaReader.getNgModuleMetadata(ref);
        if (!isDeferredImport && ngModuleMeta !== null) {
            // Importing NgModules is always legal in `@Component.imports`,
            // but not supported in `@Component.deferredImports`.
            continue;
        }
        // Make an error?
        const error = isDeferredImport
            ? makeUnknownComponentDeferredImportDiagnostic(ref, importExpr)
            : makeUnknownComponentImportDiagnostic(ref, importExpr);
        diagnostics.push(error);
    }
    return diagnostics;
}
/** Returns whether an ImportDeclaration is a default import. */
function isDefaultImport(node) {
    return node.importClause !== undefined && node.importClause.namedBindings === undefined;
}

/**
 * Adapts the `compileInjectable` compiler for `@Injectable` decorators to the Ivy compiler.
 */
class InjectableDecoratorHandler {
    reflector;
    evaluator;
    isCore;
    strictCtorDeps;
    injectableRegistry;
    perf;
    includeClassMetadata;
    compilationMode;
    errorOnDuplicateProv;
    constructor(reflector, evaluator, isCore, strictCtorDeps, injectableRegistry, perf, includeClassMetadata, compilationMode, 
    /**
     * What to do if the injectable already contains a ɵprov property.
     *
     * If true then an error diagnostic is reported.
     * If false then there is no error and a new ɵprov property is not added.
     */
    errorOnDuplicateProv = true) {
        this.reflector = reflector;
        this.evaluator = evaluator;
        this.isCore = isCore;
        this.strictCtorDeps = strictCtorDeps;
        this.injectableRegistry = injectableRegistry;
        this.perf = perf;
        this.includeClassMetadata = includeClassMetadata;
        this.compilationMode = compilationMode;
        this.errorOnDuplicateProv = errorOnDuplicateProv;
    }
    precedence = checker.HandlerPrecedence.SHARED;
    name = 'InjectableDecoratorHandler';
    detect(node, decorators) {
        if (!decorators) {
            return undefined;
        }
        const decorator = checker.findAngularDecorator(decorators, 'Injectable', this.isCore);
        if (decorator !== undefined) {
            return {
                trigger: decorator.node,
                decorator: decorator,
                metadata: decorator,
            };
        }
        else {
            return undefined;
        }
    }
    analyze(node, decorator) {
        this.perf.eventCount(checker.PerfEvent.AnalyzeInjectable);
        const meta = extractInjectableMetadata(node, decorator, this.reflector);
        const decorators = this.reflector.getDecoratorsOfDeclaration(node);
        return {
            analysis: {
                meta,
                ctorDeps: extractInjectableCtorDeps(node, meta, decorator, this.reflector, this.isCore, this.strictCtorDeps),
                classMetadata: this.includeClassMetadata
                    ? extractClassMetadata(node, this.reflector, this.isCore)
                    : null,
                // Avoid generating multiple factories if a class has
                // more Angular decorators, apart from Injectable.
                needsFactory: !decorators ||
                    decorators.every((current) => !checker.isAngularCore(current) || current.name === 'Injectable'),
            },
        };
    }
    symbol() {
        return null;
    }
    register(node, analysis) {
        if (this.compilationMode === checker.CompilationMode.LOCAL) {
            return;
        }
        this.injectableRegistry.registerInjectable(node, {
            ctorDeps: analysis.ctorDeps,
        });
    }
    resolve(node, analysis) {
        if (this.compilationMode === checker.CompilationMode.LOCAL) {
            return {};
        }
        if (requiresValidCtor(analysis.meta)) {
            const diagnostic = checker.checkInheritanceOfInjectable(node, this.injectableRegistry, this.reflector, this.evaluator, this.strictCtorDeps, 'Injectable');
            if (diagnostic !== null) {
                return {
                    diagnostics: [diagnostic],
                };
            }
        }
        return {};
    }
    compileFull(node, analysis) {
        return this.compile(compileNgFactoryDefField, (meta) => compiler.compileInjectable(meta, false), compileClassMetadata, node, analysis);
    }
    compilePartial(node, analysis) {
        return this.compile(compileDeclareFactory, compileDeclareInjectableFromMetadata, compileDeclareClassMetadata, node, analysis);
    }
    compileLocal(node, analysis) {
        return this.compile(compileNgFactoryDefField, (meta) => compiler.compileInjectable(meta, false), compileClassMetadata, node, analysis);
    }
    compile(compileFactoryFn, compileInjectableFn, compileClassMetadataFn, node, analysis) {
        const results = [];
        if (analysis.needsFactory) {
            const meta = analysis.meta;
            const factoryRes = compileFactoryFn(checker.toFactoryMetadata({ ...meta, deps: analysis.ctorDeps }, compiler.FactoryTarget.Injectable));
            if (analysis.classMetadata !== null) {
                factoryRes.statements.push(compileClassMetadataFn(analysis.classMetadata).toStmt());
            }
            results.push(factoryRes);
        }
        const ɵprov = this.reflector.getMembersOfClass(node).find((member) => member.name === 'ɵprov');
        if (ɵprov !== undefined && this.errorOnDuplicateProv) {
            throw new checker.FatalDiagnosticError(checker.ErrorCode.INJECTABLE_DUPLICATE_PROV, ɵprov.nameNode || ɵprov.node || node, 'Injectables cannot contain a static ɵprov property, because the compiler is going to generate one.');
        }
        if (ɵprov === undefined) {
            // Only add a new ɵprov if there is not one already
            const res = compileInjectableFn(analysis.meta);
            results.push({
                name: 'ɵprov',
                initializer: res.expression,
                statements: res.statements,
                type: res.type,
                deferrableImports: null,
            });
        }
        return results;
    }
}
/**
 * Read metadata from the `@Injectable` decorator and produce the `IvyInjectableMetadata`, the
 * input metadata needed to run `compileInjectable`.
 *
 * A `null` return value indicates this is @Injectable has invalid data.
 */
function extractInjectableMetadata(clazz, decorator, reflector) {
    const name = clazz.name.text;
    const type = checker.wrapTypeReference(reflector, clazz);
    const typeArgumentCount = reflector.getGenericArityOfClass(clazz) || 0;
    if (decorator.args === null) {
        throw new checker.FatalDiagnosticError(checker.ErrorCode.DECORATOR_NOT_CALLED, decorator.node, '@Injectable must be called');
    }
    if (decorator.args.length === 0) {
        return {
            name,
            type,
            typeArgumentCount,
            providedIn: compiler.createMayBeForwardRefExpression(new compiler.LiteralExpr(null), 0 /* ForwardRefHandling.None */),
        };
    }
    else if (decorator.args.length === 1) {
        const metaNode = decorator.args[0];
        // Firstly make sure the decorator argument is an inline literal - if not, it's illegal to
        // transport references from one location to another. This is the problem that lowering
        // used to solve - if this restriction proves too undesirable we can re-implement lowering.
        if (!ts.isObjectLiteralExpression(metaNode)) {
            throw new checker.FatalDiagnosticError(checker.ErrorCode.DECORATOR_ARG_NOT_LITERAL, metaNode, `@Injectable argument must be an object literal`);
        }
        // Resolve the fields of the literal into a map of field name to expression.
        const meta = checker.reflectObjectLiteral(metaNode);
        const providedIn = meta.has('providedIn')
            ? getProviderExpression(meta.get('providedIn'), reflector)
            : compiler.createMayBeForwardRefExpression(new compiler.LiteralExpr(null), 0 /* ForwardRefHandling.None */);
        let deps = undefined;
        if ((meta.has('useClass') || meta.has('useFactory')) && meta.has('deps')) {
            const depsExpr = meta.get('deps');
            if (!ts.isArrayLiteralExpression(depsExpr)) {
                throw new checker.FatalDiagnosticError(checker.ErrorCode.VALUE_NOT_LITERAL, depsExpr, `@Injectable deps metadata must be an inline array`);
            }
            deps = depsExpr.elements.map((dep) => getDep(dep, reflector));
        }
        const result = { name, type, typeArgumentCount, providedIn };
        if (meta.has('useValue')) {
            result.useValue = getProviderExpression(meta.get('useValue'), reflector);
        }
        else if (meta.has('useExisting')) {
            result.useExisting = getProviderExpression(meta.get('useExisting'), reflector);
        }
        else if (meta.has('useClass')) {
            result.useClass = getProviderExpression(meta.get('useClass'), reflector);
            result.deps = deps;
        }
        else if (meta.has('useFactory')) {
            result.useFactory = new compiler.WrappedNodeExpr(meta.get('useFactory'));
            result.deps = deps;
        }
        return result;
    }
    else {
        throw new checker.FatalDiagnosticError(checker.ErrorCode.DECORATOR_ARITY_WRONG, decorator.args[2], 'Too many arguments to @Injectable');
    }
}
/**
 * Get the `R3ProviderExpression` for this `expression`.
 *
 * The `useValue`, `useExisting` and `useClass` properties might be wrapped in a `ForwardRef`, which
 * needs to be unwrapped. This function will do that unwrapping and set a flag on the returned
 * object to indicate whether the value needed unwrapping.
 */
function getProviderExpression(expression, reflector) {
    const forwardRefValue = checker.tryUnwrapForwardRef(expression, reflector);
    return compiler.createMayBeForwardRefExpression(new compiler.WrappedNodeExpr(forwardRefValue ?? expression), forwardRefValue !== null ? 2 /* ForwardRefHandling.Unwrapped */ : 0 /* ForwardRefHandling.None */);
}
function extractInjectableCtorDeps(clazz, meta, decorator, reflector, isCore, strictCtorDeps) {
    if (decorator.args === null) {
        throw new checker.FatalDiagnosticError(checker.ErrorCode.DECORATOR_NOT_CALLED, decorator.node, '@Injectable must be called');
    }
    let ctorDeps = null;
    if (decorator.args.length === 0) {
        // Ideally, using @Injectable() would have the same effect as using @Injectable({...}), and be
        // subject to the same validation. However, existing Angular code abuses @Injectable, applying
        // it to things like abstract classes with constructors that were never meant for use with
        // Angular's DI.
        //
        // To deal with this, @Injectable() without an argument is more lenient, and if the
        // constructor signature does not work for DI then a factory definition (ɵfac) that throws is
        // generated.
        if (strictCtorDeps && !checker.isAbstractClassDeclaration(clazz)) {
            ctorDeps = checker.getValidConstructorDependencies(clazz, reflector, isCore);
        }
        else {
            ctorDeps = checker.unwrapConstructorDependencies(checker.getConstructorDependencies(clazz, reflector, isCore));
        }
        return ctorDeps;
    }
    else if (decorator.args.length === 1) {
        const rawCtorDeps = checker.getConstructorDependencies(clazz, reflector, isCore);
        if (strictCtorDeps && !checker.isAbstractClassDeclaration(clazz) && requiresValidCtor(meta)) {
            // Since use* was not provided for a concrete class, validate the deps according to
            // strictCtorDeps.
            ctorDeps = checker.validateConstructorDependencies(clazz, rawCtorDeps);
        }
        else {
            ctorDeps = checker.unwrapConstructorDependencies(rawCtorDeps);
        }
    }
    return ctorDeps;
}
function requiresValidCtor(meta) {
    return (meta.useValue === undefined &&
        meta.useExisting === undefined &&
        meta.useClass === undefined &&
        meta.useFactory === undefined);
}
function getDep(dep, reflector) {
    const meta = {
        token: new compiler.WrappedNodeExpr(dep),
        attributeNameType: null,
        host: false,
        optional: false,
        self: false,
        skipSelf: false,
    };
    function maybeUpdateDecorator(dec, reflector, token) {
        const source = reflector.getImportOfIdentifier(dec);
        if (source === null || source.from !== '@angular/core') {
            return false;
        }
        switch (source.name) {
            case 'Inject':
                if (token !== undefined) {
                    meta.token = new compiler.WrappedNodeExpr(token);
                }
                break;
            case 'Optional':
                meta.optional = true;
                break;
            case 'SkipSelf':
                meta.skipSelf = true;
                break;
            case 'Self':
                meta.self = true;
                break;
            default:
                return false;
        }
        return true;
    }
    if (ts.isArrayLiteralExpression(dep)) {
        dep.elements.forEach((el) => {
            let isDecorator = false;
            if (ts.isIdentifier(el)) {
                isDecorator = maybeUpdateDecorator(el, reflector);
            }
            else if (ts.isNewExpression(el) && ts.isIdentifier(el.expression)) {
                const token = (el.arguments && el.arguments.length > 0 && el.arguments[0]) || undefined;
                isDecorator = maybeUpdateDecorator(el.expression, reflector, token);
            }
            if (!isDecorator) {
                meta.token = new compiler.WrappedNodeExpr(el);
            }
        });
    }
    return meta;
}

/**
 * Represents an Angular pipe.
 */
class PipeSymbol extends SemanticSymbol {
    name;
    constructor(decl, name) {
        super(decl);
        this.name = name;
    }
    isPublicApiAffected(previousSymbol) {
        if (!(previousSymbol instanceof PipeSymbol)) {
            return true;
        }
        return this.name !== previousSymbol.name;
    }
    isTypeCheckApiAffected(previousSymbol) {
        return this.isPublicApiAffected(previousSymbol);
    }
}
class PipeDecoratorHandler {
    reflector;
    evaluator;
    metaRegistry;
    scopeRegistry;
    injectableRegistry;
    isCore;
    perf;
    includeClassMetadata;
    compilationMode;
    generateExtraImportsInLocalMode;
    strictStandalone;
    implicitStandaloneValue;
    constructor(reflector, evaluator, metaRegistry, scopeRegistry, injectableRegistry, isCore, perf, includeClassMetadata, compilationMode, generateExtraImportsInLocalMode, strictStandalone, implicitStandaloneValue) {
        this.reflector = reflector;
        this.evaluator = evaluator;
        this.metaRegistry = metaRegistry;
        this.scopeRegistry = scopeRegistry;
        this.injectableRegistry = injectableRegistry;
        this.isCore = isCore;
        this.perf = perf;
        this.includeClassMetadata = includeClassMetadata;
        this.compilationMode = compilationMode;
        this.generateExtraImportsInLocalMode = generateExtraImportsInLocalMode;
        this.strictStandalone = strictStandalone;
        this.implicitStandaloneValue = implicitStandaloneValue;
    }
    precedence = checker.HandlerPrecedence.PRIMARY;
    name = 'PipeDecoratorHandler';
    detect(node, decorators) {
        if (!decorators) {
            return undefined;
        }
        const decorator = checker.findAngularDecorator(decorators, 'Pipe', this.isCore);
        if (decorator !== undefined) {
            return {
                trigger: decorator.node,
                decorator: decorator,
                metadata: decorator,
            };
        }
        else {
            return undefined;
        }
    }
    analyze(clazz, decorator) {
        this.perf.eventCount(checker.PerfEvent.AnalyzePipe);
        const name = clazz.name.text;
        const type = checker.wrapTypeReference(this.reflector, clazz);
        if (decorator.args === null) {
            throw new checker.FatalDiagnosticError(checker.ErrorCode.DECORATOR_NOT_CALLED, decorator.node, `@Pipe must be called`);
        }
        if (decorator.args.length !== 1) {
            throw new checker.FatalDiagnosticError(checker.ErrorCode.DECORATOR_ARITY_WRONG, decorator.node, '@Pipe must have exactly one argument');
        }
        const meta = checker.unwrapExpression(decorator.args[0]);
        if (!ts.isObjectLiteralExpression(meta)) {
            throw new checker.FatalDiagnosticError(checker.ErrorCode.DECORATOR_ARG_NOT_LITERAL, meta, '@Pipe must have a literal argument');
        }
        const pipe = checker.reflectObjectLiteral(meta);
        if (!pipe.has('name')) {
            throw new checker.FatalDiagnosticError(checker.ErrorCode.PIPE_MISSING_NAME, meta, `@Pipe decorator is missing name field`);
        }
        const pipeNameExpr = pipe.get('name');
        const pipeName = this.evaluator.evaluate(pipeNameExpr);
        if (typeof pipeName !== 'string') {
            throw checker.createValueHasWrongTypeError(pipeNameExpr, pipeName, `@Pipe.name must be a string`);
        }
        let pure = true;
        if (pipe.has('pure')) {
            const expr = pipe.get('pure');
            const pureValue = this.evaluator.evaluate(expr);
            if (typeof pureValue !== 'boolean') {
                throw checker.createValueHasWrongTypeError(expr, pureValue, `@Pipe.pure must be a boolean`);
            }
            pure = pureValue;
        }
        let isStandalone = this.implicitStandaloneValue;
        if (pipe.has('standalone')) {
            const expr = pipe.get('standalone');
            const resolved = this.evaluator.evaluate(expr);
            if (typeof resolved !== 'boolean') {
                throw checker.createValueHasWrongTypeError(expr, resolved, `standalone flag must be a boolean`);
            }
            isStandalone = resolved;
            if (!isStandalone && this.strictStandalone) {
                throw new checker.FatalDiagnosticError(checker.ErrorCode.NON_STANDALONE_NOT_ALLOWED, expr, `Only standalone pipes are allowed when 'strictStandalone' is enabled.`);
            }
        }
        return {
            analysis: {
                meta: {
                    name,
                    type,
                    typeArgumentCount: this.reflector.getGenericArityOfClass(clazz) || 0,
                    pipeName,
                    deps: checker.getValidConstructorDependencies(clazz, this.reflector, this.isCore),
                    pure,
                    isStandalone,
                },
                classMetadata: this.includeClassMetadata
                    ? extractClassMetadata(clazz, this.reflector, this.isCore)
                    : null,
                pipeNameExpr,
                decorator: decorator?.node ?? null,
            },
        };
    }
    symbol(node, analysis) {
        return new PipeSymbol(node, analysis.meta.pipeName);
    }
    register(node, analysis) {
        const ref = new checker.Reference(node);
        this.metaRegistry.registerPipeMetadata({
            kind: checker.MetaKind.Pipe,
            ref,
            name: analysis.meta.pipeName,
            nameExpr: analysis.pipeNameExpr,
            isStandalone: analysis.meta.isStandalone,
            decorator: analysis.decorator,
            isExplicitlyDeferred: false,
        });
        this.injectableRegistry.registerInjectable(node, {
            ctorDeps: analysis.meta.deps,
        });
    }
    resolve(node) {
        if (this.compilationMode === checker.CompilationMode.LOCAL) {
            return {};
        }
        const duplicateDeclData = this.scopeRegistry.getDuplicateDeclarations(node);
        if (duplicateDeclData !== null) {
            // This pipe was declared twice (or more).
            return {
                diagnostics: [checker.makeDuplicateDeclarationError(node, duplicateDeclData, 'Pipe')],
            };
        }
        return {};
    }
    compileFull(node, analysis) {
        const fac = compileNgFactoryDefField(checker.toFactoryMetadata(analysis.meta, compiler.FactoryTarget.Pipe));
        const def = compiler.compilePipeFromMetadata(analysis.meta);
        const classMetadata = analysis.classMetadata !== null
            ? compileClassMetadata(analysis.classMetadata).toStmt()
            : null;
        return checker.compileResults(fac, def, classMetadata, 'ɵpipe', null, null /* deferrableImports */);
    }
    compilePartial(node, analysis) {
        const fac = compileDeclareFactory(checker.toFactoryMetadata(analysis.meta, compiler.FactoryTarget.Pipe));
        const def = compileDeclarePipeFromMetadata(analysis.meta);
        const classMetadata = analysis.classMetadata !== null
            ? compileDeclareClassMetadata(analysis.classMetadata).toStmt()
            : null;
        return checker.compileResults(fac, def, classMetadata, 'ɵpipe', null, null /* deferrableImports */);
    }
    compileLocal(node, analysis) {
        const fac = compileNgFactoryDefField(checker.toFactoryMetadata(analysis.meta, compiler.FactoryTarget.Pipe));
        const def = compiler.compilePipeFromMetadata(analysis.meta);
        const classMetadata = analysis.classMetadata !== null
            ? compileClassMetadata(analysis.classMetadata).toStmt()
            : null;
        return checker.compileResults(fac, def, classMetadata, 'ɵpipe', null, null /* deferrableImports */);
    }
}

/**
 * @module
 * @description
 * Entry point for all public APIs of the compiler-cli package.
 */
new compiler.Version('20.0.0-next.5+sha-9228a73');

/**
 * Whether a given decorator should be treated as an Angular decorator.
 * Either it's used in @angular/core, or it's imported from there.
 */
function isAngularDecorator(decorator, isCore) {
    return isCore || (decorator.import !== null && decorator.import.from === '@angular/core');
}
/**
 * Extracts the type of the decorator (the function or expression invoked), as well as all the
 * arguments passed to the decorator. Returns an AST with the form:
 *
 *     // For @decorator(arg1, arg2)
 *     { type: decorator, args: [arg1, arg2] }
 */
function extractMetadataFromSingleDecorator(decorator, diagnostics) {
    const metadataProperties = [];
    const expr = decorator.expression;
    switch (expr.kind) {
        case ts.SyntaxKind.Identifier:
            // The decorator was a plain @Foo.
            metadataProperties.push(ts.factory.createPropertyAssignment('type', expr));
            break;
        case ts.SyntaxKind.CallExpression:
            // The decorator was a call, like @Foo(bar).
            const call = expr;
            metadataProperties.push(ts.factory.createPropertyAssignment('type', call.expression));
            if (call.arguments.length) {
                const args = [];
                for (const arg of call.arguments) {
                    args.push(arg);
                }
                const argsArrayLiteral = ts.factory.createArrayLiteralExpression(ts.factory.createNodeArray(args, true));
                metadataProperties.push(ts.factory.createPropertyAssignment('args', argsArrayLiteral));
            }
            break;
        default:
            diagnostics.push({
                file: decorator.getSourceFile(),
                start: decorator.getStart(),
                length: decorator.getEnd() - decorator.getStart(),
                messageText: `${ts.SyntaxKind[decorator.kind]} not implemented in gathering decorator metadata.`,
                category: ts.DiagnosticCategory.Error,
                code: 0,
            });
            break;
    }
    return ts.factory.createObjectLiteralExpression(metadataProperties);
}
/**
 * createCtorParametersClassProperty creates a static 'ctorParameters' property containing
 * downleveled decorator information.
 *
 * The property contains an arrow function that returns an array of object literals of the shape:
 *     static ctorParameters = () => [{
 *       type: SomeClass|undefined,  // the type of the param that's decorated, if it's a value.
 *       decorators: [{
 *         type: DecoratorFn,  // the type of the decorator that's invoked.
 *         args: [ARGS],       // the arguments passed to the decorator.
 *       }]
 *     }];
 */
function createCtorParametersClassProperty(diagnostics, entityNameToExpression, ctorParameters, isClosureCompilerEnabled) {
    const params = [];
    for (const ctorParam of ctorParameters) {
        if (!ctorParam.type && ctorParam.decorators.length === 0) {
            params.push(ts.factory.createNull());
            continue;
        }
        const paramType = ctorParam.type
            ? typeReferenceToExpression(entityNameToExpression, ctorParam.type)
            : undefined;
        const members = [
            ts.factory.createPropertyAssignment('type', paramType || ts.factory.createIdentifier('undefined')),
        ];
        const decorators = [];
        for (const deco of ctorParam.decorators) {
            decorators.push(extractMetadataFromSingleDecorator(deco, diagnostics));
        }
        if (decorators.length) {
            members.push(ts.factory.createPropertyAssignment('decorators', ts.factory.createArrayLiteralExpression(decorators)));
        }
        params.push(ts.factory.createObjectLiteralExpression(members));
    }
    const initializer = ts.factory.createArrowFunction(undefined, undefined, [], undefined, ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), ts.factory.createArrayLiteralExpression(params, true));
    const ctorProp = ts.factory.createPropertyDeclaration([ts.factory.createToken(ts.SyntaxKind.StaticKeyword)], 'ctorParameters', undefined, undefined, initializer);
    return ctorProp;
}
/**
 * Returns an expression representing the (potentially) value part for the given node.
 *
 * This is a partial re-implementation of TypeScript's serializeTypeReferenceNode. This is a
 * workaround for https://github.com/Microsoft/TypeScript/issues/17516 (serializeTypeReferenceNode
 * not being exposed). In practice this implementation is sufficient for Angular's use of type
 * metadata.
 */
function typeReferenceToExpression(entityNameToExpression, node) {
    let kind = node.kind;
    if (ts.isLiteralTypeNode(node)) {
        // Treat literal types like their base type (boolean, string, number).
        kind = node.literal.kind;
    }
    switch (kind) {
        case ts.SyntaxKind.FunctionType:
        case ts.SyntaxKind.ConstructorType:
            return ts.factory.createIdentifier('Function');
        case ts.SyntaxKind.ArrayType:
        case ts.SyntaxKind.TupleType:
            return ts.factory.createIdentifier('Array');
        case ts.SyntaxKind.TypePredicate:
        case ts.SyntaxKind.TrueKeyword:
        case ts.SyntaxKind.FalseKeyword:
        case ts.SyntaxKind.BooleanKeyword:
            return ts.factory.createIdentifier('Boolean');
        case ts.SyntaxKind.StringLiteral:
        case ts.SyntaxKind.StringKeyword:
            return ts.factory.createIdentifier('String');
        case ts.SyntaxKind.ObjectKeyword:
            return ts.factory.createIdentifier('Object');
        case ts.SyntaxKind.NumberKeyword:
        case ts.SyntaxKind.NumericLiteral:
            return ts.factory.createIdentifier('Number');
        case ts.SyntaxKind.TypeReference:
            const typeRef = node;
            // Ignore any generic types, just return the base type.
            return entityNameToExpression(typeRef.typeName);
        case ts.SyntaxKind.UnionType:
            const childTypeNodes = node.types.filter((t) => !(ts.isLiteralTypeNode(t) && t.literal.kind === ts.SyntaxKind.NullKeyword));
            return childTypeNodes.length === 1
                ? typeReferenceToExpression(entityNameToExpression, childTypeNodes[0])
                : undefined;
        default:
            return undefined;
    }
}
/**
 * Checks whether a given symbol refers to a value that exists at runtime (as distinct from a type).
 *
 * Expands aliases, which is important for the case where
 *   import * as x from 'some-module';
 * and x is now a value (the module object).
 */
function symbolIsRuntimeValue(typeChecker, symbol) {
    if (symbol.flags & ts.SymbolFlags.Alias) {
        symbol = typeChecker.getAliasedSymbol(symbol);
    }
    // Note that const enums are a special case, because
    // while they have a value, they don't exist at runtime.
    return (symbol.flags & ts.SymbolFlags.Value & ts.SymbolFlags.ConstEnumExcludes) !== 0;
}
/**
 * Gets a transformer for downleveling Angular constructor parameter and property decorators.
 *
 * Note that Angular class decorators are never processed as those rely on side effects that
 * would otherwise no longer be executed. i.e. the creation of a component definition.
 *
 * @param typeChecker Reference to the program's type checker.
 * @param host Reflection host that is used for determining decorators.
 * @param diagnostics List which will be populated with diagnostics if any.
 * @param isCore Whether the current TypeScript program is for the `@angular/core` package.
 * @param isClosureCompilerEnabled Whether closure annotations need to be added where needed.
 * @param shouldTransformClass Optional function to check if a given class should be transformed.
 */
function getDownlevelDecoratorsTransform(typeChecker, host, diagnostics, isCore, isClosureCompilerEnabled, shouldTransformClass) {
    /**
     * createPropDecoratorsClassProperty creates a static 'propDecorators'
     * property containing type information for every property that has a
     * decorator applied.
     *
     *     static propDecorators: {[key: string]: {type: Function, args?:
     * any[]}[]} = { propA: [{type: MyDecorator, args: [1, 2]}, ...],
     *       ...
     *     };
     */
    function createPropDecoratorsClassProperty(diagnostics, properties) {
        //  `static propDecorators: {[key: string]: ` + {type: Function, args?:
        //  any[]}[] + `} = {\n`);
        const entries = [];
        for (const [name, decorators] of properties.entries()) {
            entries.push(ts.factory.createPropertyAssignment(name, ts.factory.createArrayLiteralExpression(decorators.map((deco) => extractMetadataFromSingleDecorator(deco, diagnostics)))));
        }
        const initializer = ts.factory.createObjectLiteralExpression(entries, true);
        const prop = ts.factory.createPropertyDeclaration([ts.factory.createToken(ts.SyntaxKind.StaticKeyword)], 'propDecorators', undefined, undefined, initializer);
        return prop;
    }
    return (context) => {
        // Ensure that referenced type symbols are not elided by TypeScript. Imports for
        // such parameter type symbols previously could be type-only, but now might be also
        // used in the `ctorParameters` static property as a value. We want to make sure
        // that TypeScript does not elide imports for such type references. Read more
        // about this in the description for `loadIsReferencedAliasDeclarationPatch`.
        const referencedParameterTypes = checker.loadIsReferencedAliasDeclarationPatch(context);
        /**
         * Converts an EntityName (from a type annotation) to an expression (accessing a value).
         *
         * For a given qualified name, this walks depth first to find the leftmost identifier,
         * and then converts the path into a property access that can be used as expression.
         */
        function entityNameToExpression(name) {
            const symbol = typeChecker.getSymbolAtLocation(name);
            // Check if the entity name references a symbol that is an actual value. If it is not, it
            // cannot be referenced by an expression, so return undefined.
            if (!symbol ||
                !symbolIsRuntimeValue(typeChecker, symbol) ||
                !symbol.declarations ||
                symbol.declarations.length === 0) {
                return undefined;
            }
            // If we deal with a qualified name, build up a property access expression
            // that could be used in the JavaScript output.
            if (ts.isQualifiedName(name)) {
                const containerExpr = entityNameToExpression(name.left);
                if (containerExpr === undefined) {
                    return undefined;
                }
                return ts.factory.createPropertyAccessExpression(containerExpr, name.right);
            }
            const decl = symbol.declarations[0];
            // If the given entity name has been resolved to an alias import declaration,
            // ensure that the alias declaration is not elided by TypeScript, and use its
            // name identifier to reference it at runtime.
            if (checker.isAliasImportDeclaration(decl)) {
                referencedParameterTypes?.add(decl);
                // If the entity name resolves to an alias import declaration, we reference the
                // entity based on the alias import name. This ensures that TypeScript properly
                // resolves the link to the import. Cloning the original entity name identifier
                // could lead to an incorrect resolution at local scope. e.g. Consider the following
                // snippet: `constructor(Dep: Dep) {}`. In such a case, the local `Dep` identifier
                // would resolve to the actual parameter name, and not to the desired import.
                // This happens because the entity name identifier symbol is internally considered
                // as type-only and therefore TypeScript tries to resolve it as value manually.
                // We can help TypeScript and avoid this non-reliable resolution by using an identifier
                // that is not type-only and is directly linked to the import alias declaration.
                if (decl.name !== undefined) {
                    return ts.setOriginalNode(ts.factory.createIdentifier(decl.name.text), decl.name);
                }
            }
            // Clone the original entity name identifier so that it can be used to reference
            // its value at runtime. This is used when the identifier is resolving to a file
            // local declaration (otherwise it would resolve to an alias import declaration).
            return ts.setOriginalNode(ts.factory.createIdentifier(name.text), name);
        }
        /**
         * Transforms a class element. Returns a three tuple of name, transformed element, and
         * decorators found. Returns an undefined name if there are no decorators to lower on the
         * element, or the element has an exotic name.
         */
        function transformClassElement(element) {
            element = ts.visitEachChild(element, decoratorDownlevelVisitor, context);
            const decoratorsToKeep = [];
            const toLower = [];
            const decorators = host.getDecoratorsOfDeclaration(element) || [];
            for (const decorator of decorators) {
                // We only deal with concrete nodes in TypeScript sources, so we don't
                // need to handle synthetically created decorators.
                const decoratorNode = decorator.node;
                if (!isAngularDecorator(decorator, isCore)) {
                    decoratorsToKeep.push(decoratorNode);
                    continue;
                }
                toLower.push(decoratorNode);
            }
            if (!toLower.length)
                return [undefined, element, []];
            if (!element.name || !ts.isIdentifier(element.name)) {
                // Method has a weird name, e.g.
                //   [Symbol.foo]() {...}
                diagnostics.push({
                    file: element.getSourceFile(),
                    start: element.getStart(),
                    length: element.getEnd() - element.getStart(),
                    messageText: `Cannot process decorators for class element with non-analyzable name.`,
                    category: ts.DiagnosticCategory.Error,
                    code: 0,
                });
                return [undefined, element, []];
            }
            const elementModifiers = ts.canHaveModifiers(element) ? ts.getModifiers(element) : undefined;
            let modifiers;
            if (decoratorsToKeep.length || elementModifiers?.length) {
                modifiers = ts.setTextRange(ts.factory.createNodeArray([...decoratorsToKeep, ...(elementModifiers || [])]), element.modifiers);
            }
            return [element.name.text, cloneClassElementWithModifiers(element, modifiers), toLower];
        }
        /**
         * Transforms a constructor. Returns the transformed constructor and the list of parameter
         * information collected, consisting of decorators and optional type.
         */
        function transformConstructor(ctor) {
            ctor = ts.visitEachChild(ctor, decoratorDownlevelVisitor, context);
            const newParameters = [];
            const oldParameters = ctor.parameters;
            const parametersInfo = [];
            for (const param of oldParameters) {
                const decoratorsToKeep = [];
                const paramInfo = { decorators: [], type: null };
                const decorators = host.getDecoratorsOfDeclaration(param) || [];
                for (const decorator of decorators) {
                    // We only deal with concrete nodes in TypeScript sources, so we don't
                    // need to handle synthetically created decorators.
                    const decoratorNode = decorator.node;
                    if (!isAngularDecorator(decorator, isCore)) {
                        decoratorsToKeep.push(decoratorNode);
                        continue;
                    }
                    paramInfo.decorators.push(decoratorNode);
                }
                if (param.type) {
                    // param has a type provided, e.g. "foo: Bar".
                    // The type will be emitted as a value expression in entityNameToExpression, which takes
                    // care not to emit anything for types that cannot be expressed as a value (e.g.
                    // interfaces).
                    paramInfo.type = param.type;
                }
                parametersInfo.push(paramInfo);
                // Must pass 'undefined' to avoid emitting decorator metadata.
                let modifiers;
                const paramModifiers = ts.getModifiers(param);
                if (decoratorsToKeep.length || paramModifiers?.length) {
                    modifiers = [...decoratorsToKeep, ...(paramModifiers || [])];
                }
                const newParam = ts.factory.updateParameterDeclaration(param, modifiers, param.dotDotDotToken, param.name, param.questionToken, param.type, param.initializer);
                newParameters.push(newParam);
            }
            const updated = ts.factory.updateConstructorDeclaration(ctor, ts.getModifiers(ctor), newParameters, ctor.body);
            return [updated, parametersInfo];
        }
        /**
         * Transforms a single class declaration:
         * - dispatches to strip decorators on members
         * - converts decorators on the class to annotations
         * - creates a ctorParameters property
         * - creates a propDecorators property
         */
        function transformClassDeclaration(classDecl) {
            const newMembers = [];
            const decoratedProperties = new Map();
            let classParameters = null;
            for (const member of classDecl.members) {
                switch (member.kind) {
                    case ts.SyntaxKind.PropertyDeclaration:
                    case ts.SyntaxKind.GetAccessor:
                    case ts.SyntaxKind.SetAccessor:
                    case ts.SyntaxKind.MethodDeclaration: {
                        const [name, newMember, decorators] = transformClassElement(member);
                        newMembers.push(newMember);
                        if (name)
                            decoratedProperties.set(name, decorators);
                        continue;
                    }
                    case ts.SyntaxKind.Constructor: {
                        const ctor = member;
                        if (!ctor.body)
                            break;
                        const [newMember, parametersInfo] = transformConstructor(member);
                        classParameters = parametersInfo;
                        newMembers.push(newMember);
                        continue;
                    }
                }
                newMembers.push(ts.visitEachChild(member, decoratorDownlevelVisitor, context));
            }
            // Note: The `ReflectionHost.getDecoratorsOfDeclaration()` method will not
            // return all decorators, but only ones that could be possible Angular decorators.
            const possibleAngularDecorators = host.getDecoratorsOfDeclaration(classDecl) || [];
            // Keep track if we come across an Angular class decorator. This is used
            // to determine whether constructor parameters should be captured or not.
            const hasAngularDecorator = possibleAngularDecorators.some((d) => isAngularDecorator(d, isCore));
            if (classParameters) {
                if (hasAngularDecorator || classParameters.some((p) => !!p.decorators.length)) {
                    // Capture constructor parameters if the class has Angular decorator applied,
                    // or if any of the parameters has decorators applied directly.
                    newMembers.push(createCtorParametersClassProperty(diagnostics, entityNameToExpression, classParameters));
                }
            }
            if (decoratedProperties.size) {
                newMembers.push(createPropDecoratorsClassProperty(diagnostics, decoratedProperties));
            }
            const members = ts.setTextRange(ts.factory.createNodeArray(newMembers, classDecl.members.hasTrailingComma), classDecl.members);
            return ts.factory.updateClassDeclaration(classDecl, classDecl.modifiers, classDecl.name, classDecl.typeParameters, classDecl.heritageClauses, members);
        }
        /**
         * Transformer visitor that looks for Angular decorators and replaces them with
         * downleveled static properties. Also collects constructor type metadata for
         * class declaration that are decorated with an Angular decorator.
         */
        function decoratorDownlevelVisitor(node) {
            if (ts.isClassDeclaration(node) &&
                (shouldTransformClass === undefined || shouldTransformClass(node))) {
                return transformClassDeclaration(node);
            }
            return ts.visitEachChild(node, decoratorDownlevelVisitor, context);
        }
        return (sf) => {
            // Downlevel decorators and constructor parameter types. We will keep track of all
            // referenced constructor parameter types so that we can instruct TypeScript to
            // not elide their imports if they previously were only type-only.
            return ts.visitEachChild(sf, decoratorDownlevelVisitor, context);
        };
    };
}
function cloneClassElementWithModifiers(node, modifiers) {
    let clone;
    if (ts.isMethodDeclaration(node)) {
        clone = ts.factory.createMethodDeclaration(modifiers, node.asteriskToken, node.name, node.questionToken, node.typeParameters, node.parameters, node.type, node.body);
    }
    else if (ts.isPropertyDeclaration(node)) {
        clone = ts.factory.createPropertyDeclaration(modifiers, node.name, node.questionToken, node.type, node.initializer);
    }
    else if (ts.isGetAccessor(node)) {
        clone = ts.factory.createGetAccessorDeclaration(modifiers, node.name, node.parameters, node.type, node.body);
    }
    else if (ts.isSetAccessor(node)) {
        clone = ts.factory.createSetAccessorDeclaration(modifiers, node.name, node.parameters, node.body);
    }
    else {
        throw new Error(`Unsupported decorated member with kind ${ts.SyntaxKind[node.kind]}`);
    }
    return ts.setOriginalNode(clone, node);
}

/**
 * Creates an import and access for a given Angular core import while
 * ensuring the decorator symbol access can be traced back to an Angular core
 * import in order to make the synthetic decorator compatible with the JIT
 * decorator downlevel transform.
 */
function createSyntheticAngularCoreDecoratorAccess(factory, importManager, ngClassDecorator, sourceFile, decoratorName) {
    const classDecoratorIdentifier = ts.isIdentifier(ngClassDecorator.identifier)
        ? ngClassDecorator.identifier
        : ngClassDecorator.identifier.expression;
    return factory.createPropertyAccessExpression(importManager.addImport({
        exportModuleSpecifier: '@angular/core',
        exportSymbolName: null,
        requestedFile: sourceFile,
    }), 
    // The synthetic identifier may be checked later by the downlevel decorators
    // transform to resolve to an Angular import using `getSymbolAtLocation`. We trick
    // the transform to think it's not synthetic and comes from Angular core.
    ts.setOriginalNode(factory.createIdentifier(decoratorName), classDecoratorIdentifier));
}
/** Casts the given expression as `any`. */
function castAsAny(factory, expr) {
    return factory.createAsExpression(expr, factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
}

/**
 * Transform that will automatically add an `@Input` decorator for all signal
 * inputs in Angular classes. The decorator will capture metadata of the signal
 * input, derived from the `input()/input.required()` initializer.
 *
 * This transform is useful for JIT environments where signal inputs would like to be
 * used. e.g. for Angular CLI unit testing. In such environments, signal inputs are not
 * statically retrievable at runtime. JIT compilation needs to know about all possible inputs
 * before instantiating directives. A decorator exposes this information to the class without
 * the class needing to be instantiated.
 */
const signalInputsTransform = (member, sourceFile, host, factory, importTracker, importManager, classDecorator, isCore) => {
    // If the field already is decorated, we handle this gracefully and skip it.
    if (host
        .getDecoratorsOfDeclaration(member.node)
        ?.some((d) => checker.isAngularDecorator(d, 'Input', isCore))) {
        return member.node;
    }
    const inputMapping = checker.tryParseSignalInputMapping(member, host, importTracker);
    if (inputMapping === null) {
        return member.node;
    }
    const fields = {
        'isSignal': factory.createTrue(),
        'alias': factory.createStringLiteral(inputMapping.bindingPropertyName),
        'required': inputMapping.required ? factory.createTrue() : factory.createFalse(),
        // For signal inputs, transforms are captured by the input signal. The runtime will
        // determine whether a transform needs to be run via the input signal, so the `transform`
        // option is always `undefined`.
        'transform': factory.createIdentifier('undefined'),
    };
    const newDecorator = factory.createDecorator(factory.createCallExpression(createSyntheticAngularCoreDecoratorAccess(factory, importManager, classDecorator, sourceFile, 'Input'), undefined, [
        // Cast to `any` because `isSignal` will be private, and in case this
        // transform is used directly as a pre-compilation step, the decorator should
        // not fail. It is already validated now due to us parsing the input metadata.
        castAsAny(factory, factory.createObjectLiteralExpression(Object.entries(fields).map(([name, value]) => factory.createPropertyAssignment(name, value)))),
    ]));
    return factory.updatePropertyDeclaration(member.node, [newDecorator, ...(member.node.modifiers ?? [])], member.name, member.node.questionToken, member.node.type, member.node.initializer);
};

/**
 * Transform that automatically adds `@Input` and `@Output` to members initialized as `model()`.
 * It is useful for JIT environments where models can't be recognized based on the initializer.
 */
const signalModelTransform = (member, sourceFile, host, factory, importTracker, importManager, classDecorator, isCore) => {
    if (host.getDecoratorsOfDeclaration(member.node)?.some((d) => {
        return checker.isAngularDecorator(d, 'Input', isCore) || checker.isAngularDecorator(d, 'Output', isCore);
    })) {
        return member.node;
    }
    const modelMapping = checker.tryParseSignalModelMapping(member, host, importTracker);
    if (modelMapping === null) {
        return member.node;
    }
    const inputConfig = factory.createObjectLiteralExpression([
        factory.createPropertyAssignment('isSignal', modelMapping.input.isSignal ? factory.createTrue() : factory.createFalse()),
        factory.createPropertyAssignment('alias', factory.createStringLiteral(modelMapping.input.bindingPropertyName)),
        factory.createPropertyAssignment('required', modelMapping.input.required ? factory.createTrue() : factory.createFalse()),
    ]);
    const inputDecorator = createDecorator('Input', 
    // Config is cast to `any` because `isSignal` will be private, and in case this
    // transform is used directly as a pre-compilation step, the decorator should
    // not fail. It is already validated now due to us parsing the input metadata.
    factory.createAsExpression(inputConfig, factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)), classDecorator, factory, sourceFile, importManager);
    const outputDecorator = createDecorator('Output', factory.createStringLiteral(modelMapping.output.bindingPropertyName), classDecorator, factory, sourceFile, importManager);
    return factory.updatePropertyDeclaration(member.node, [inputDecorator, outputDecorator, ...(member.node.modifiers ?? [])], member.node.name, member.node.questionToken, member.node.type, member.node.initializer);
};
function createDecorator(name, config, classDecorator, factory, sourceFile, importManager) {
    const callTarget = createSyntheticAngularCoreDecoratorAccess(factory, importManager, classDecorator, sourceFile, name);
    return factory.createDecorator(factory.createCallExpression(callTarget, undefined, [config]));
}

/**
 * Transform that will automatically add an `@Output` decorator for all initializer API
 * outputs in Angular classes. The decorator will capture metadata of the output, such
 * as the alias.
 *
 * This transform is useful for JIT environments. In such environments, such outputs are not
 * statically retrievable at runtime. JIT compilation needs to know about all possible outputs
 * before instantiating directives. A decorator exposes this information to the class without
 * the class needing to be instantiated.
 */
const initializerApiOutputTransform = (member, sourceFile, host, factory, importTracker, importManager, classDecorator, isCore) => {
    // If the field already is decorated, we handle this gracefully and skip it.
    if (host
        .getDecoratorsOfDeclaration(member.node)
        ?.some((d) => checker.isAngularDecorator(d, 'Output', isCore))) {
        return member.node;
    }
    const output = checker.tryParseInitializerBasedOutput(member, host, importTracker);
    if (output === null) {
        return member.node;
    }
    const newDecorator = factory.createDecorator(factory.createCallExpression(createSyntheticAngularCoreDecoratorAccess(factory, importManager, classDecorator, sourceFile, 'Output'), undefined, [factory.createStringLiteral(output.metadata.bindingPropertyName)]));
    return factory.updatePropertyDeclaration(member.node, [newDecorator, ...(member.node.modifiers ?? [])], member.node.name, member.node.questionToken, member.node.type, member.node.initializer);
};

/** Maps a query function to its decorator. */
const queryFunctionToDecorator = {
    viewChild: 'ViewChild',
    viewChildren: 'ViewChildren',
    contentChild: 'ContentChild',
    contentChildren: 'ContentChildren',
};
/**
 * Transform that will automatically add query decorators for all signal-based
 * queries in Angular classes. The decorator will capture metadata of the signal
 * query, derived from the initializer-based API call.
 *
 * This transform is useful for JIT environments where signal queries would like to be
 * used. e.g. for Angular CLI unit testing. In such environments, signal queries are not
 * statically retrievable at runtime. JIT compilation needs to know about all possible queries
 * before instantiating directives to construct the definition. A decorator exposes this
 * information to the class without the class needing to be instantiated.
 */
const queryFunctionsTransforms = (member, sourceFile, host, factory, importTracker, importManager, classDecorator, isCore) => {
    const decorators = host.getDecoratorsOfDeclaration(member.node);
    // If the field already is decorated, we handle this gracefully and skip it.
    const queryDecorators = decorators && checker.getAngularDecorators(decorators, checker.queryDecoratorNames, isCore);
    if (queryDecorators !== null && queryDecorators.length > 0) {
        return member.node;
    }
    const queryDefinition = checker.tryParseSignalQueryFromInitializer(member, host, importTracker);
    if (queryDefinition === null) {
        return member.node;
    }
    const callArgs = queryDefinition.call.arguments;
    const newDecorator = factory.createDecorator(factory.createCallExpression(createSyntheticAngularCoreDecoratorAccess(factory, importManager, classDecorator, sourceFile, queryFunctionToDecorator[queryDefinition.name]), undefined, 
    // All positional arguments of the query functions can be mostly re-used as is
    // for the decorator. i.e. predicate is always first argument. Options are second.
    [
        queryDefinition.call.arguments[0],
        // Note: Casting as `any` because `isSignal` is not publicly exposed and this
        // transform might pre-transform TS sources.
        castAsAny(factory, factory.createObjectLiteralExpression([
            ...(callArgs.length > 1 ? [factory.createSpreadAssignment(callArgs[1])] : []),
            factory.createPropertyAssignment('isSignal', factory.createTrue()),
        ])),
    ]));
    return factory.updatePropertyDeclaration(member.node, [newDecorator, ...(member.node.modifiers ?? [])], member.node.name, member.node.questionToken, member.node.type, member.node.initializer);
};

/** Decorators for classes that should be transformed. */
const decoratorsWithInputs = ['Directive', 'Component'];
/**
 * List of possible property transforms.
 * The first one matched on a class member will apply.
 */
const propertyTransforms = [
    signalInputsTransform,
    initializerApiOutputTransform,
    queryFunctionsTransforms,
    signalModelTransform,
];
/**
 * Creates an AST transform that looks for Angular classes and transforms
 * initializer-based declared members to work with JIT compilation.
 *
 * For example, an `input()` member may be transformed to add an `@Input`
 * decorator for JIT.
 *
 * @param host Reflection host
 * @param importTracker Import tracker for efficient import checking.
 * @param isCore Whether this transforms runs against `@angular/core`.
 * @param shouldTransformClass Optional function to check if a given class should be transformed.
 */
function getInitializerApiJitTransform(host, importTracker, isCore, shouldTransformClass) {
    return (ctx) => {
        return (sourceFile) => {
            const importManager = new checker.ImportManager();
            sourceFile = ts.visitNode(sourceFile, createTransformVisitor(ctx, host, importManager, importTracker, isCore, shouldTransformClass), ts.isSourceFile);
            return importManager.transformTsFile(ctx, sourceFile);
        };
    };
}
function createTransformVisitor(ctx, host, importManager, importTracker, isCore, shouldTransformClass) {
    const visitor = (node) => {
        if (ts.isClassDeclaration(node) && node.name !== undefined) {
            const originalNode = ts.getOriginalNode(node, ts.isClassDeclaration);
            // Note: Attempt to detect the `angularDecorator` on the original node of the class.
            // That is because e.g. Tsickle or other transforms might have transformed the node
            // already to transform decorators.
            const angularDecorator = host
                .getDecoratorsOfDeclaration(originalNode)
                ?.find((d) => decoratorsWithInputs.some((name) => checker.isAngularDecorator(d, name, isCore)));
            if (angularDecorator !== undefined &&
                (shouldTransformClass === undefined || shouldTransformClass(node))) {
                let hasChanged = false;
                const sourceFile = originalNode.getSourceFile();
                const members = node.members.map((memberNode) => {
                    if (!ts.isPropertyDeclaration(memberNode)) {
                        return memberNode;
                    }
                    const member = checker.reflectClassMember(memberNode);
                    if (member === null) {
                        return memberNode;
                    }
                    // Find the first matching transform and update the class member.
                    for (const transform of propertyTransforms) {
                        const newNode = transform({ ...member, node: memberNode }, sourceFile, host, ctx.factory, importTracker, importManager, angularDecorator, isCore);
                        if (newNode !== member.node) {
                            hasChanged = true;
                            return newNode;
                        }
                    }
                    return memberNode;
                });
                if (hasChanged) {
                    return ctx.factory.updateClassDeclaration(node, node.modifiers, node.name, node.typeParameters, node.heritageClauses, members);
                }
            }
        }
        return ts.visitEachChild(node, visitor, ctx);
    };
    return visitor;
}

/**
 * JIT transform for Angular applications. Used by the Angular CLI for unit tests and
 * explicit JIT applications.
 *
 * The transforms include:
 *
 *  - A transform for downleveling Angular decorators and Angular-decorated class constructor
 *    parameters for dependency injection. This transform can be used by the CLI for JIT-mode
 *    compilation where constructor parameters and associated Angular decorators should be
 *    downleveled so that apps are not exposed to the ES2015 temporal dead zone limitation
 *    in TypeScript. See https://github.com/angular/angular-cli/pull/14473 for more details.
 *
 *  - A transform for adding `@Input` to signal inputs. Signal inputs cannot be recognized
 *    at runtime using reflection. That is because the class would need to be instantiated-
 *    but is not possible before creation. To fix this for JIT, a decorator is automatically
 *    added that will declare the input as a signal input while also capturing the necessary
 *    metadata
 */
function angularJitApplicationTransform(program, isCore = false, shouldTransformClass) {
    const typeChecker = program.getTypeChecker();
    const reflectionHost = new checker.TypeScriptReflectionHost(typeChecker);
    const importTracker = new ImportedSymbolsTracker();
    const downlevelDecoratorTransform = getDownlevelDecoratorsTransform(typeChecker, reflectionHost, [], isCore, 
    /* enableClosureCompiler */ false, shouldTransformClass);
    const initializerApisJitTransform = getInitializerApiJitTransform(reflectionHost, importTracker, isCore, shouldTransformClass);
    return (ctx) => {
        return (sourceFile) => {
            sourceFile = initializerApisJitTransform(ctx)(sourceFile);
            sourceFile = downlevelDecoratorTransform(ctx)(sourceFile);
            return sourceFile;
        };
    };
}

const UNKNOWN_ERROR_CODE = 500;
exports.EmitFlags = void 0;
(function (EmitFlags) {
    EmitFlags[EmitFlags["DTS"] = 1] = "DTS";
    EmitFlags[EmitFlags["JS"] = 2] = "JS";
    EmitFlags[EmitFlags["Metadata"] = 4] = "Metadata";
    EmitFlags[EmitFlags["I18nBundle"] = 8] = "I18nBundle";
    EmitFlags[EmitFlags["Codegen"] = 16] = "Codegen";
    EmitFlags[EmitFlags["Default"] = 19] = "Default";
    EmitFlags[EmitFlags["All"] = 31] = "All";
})(exports.EmitFlags || (exports.EmitFlags = {}));

function i18nGetExtension(formatName) {
    const format = formatName.toLowerCase();
    switch (format) {
        case 'xmb':
            return 'xmb';
        case 'xlf':
        case 'xlif':
        case 'xliff':
        case 'xlf2':
        case 'xliff2':
            return 'xlf';
    }
    throw new Error(`Unsupported format "${formatName}"`);
}
function i18nExtract(formatName, outFile, host, options, bundle, pathResolve = p__namespace.resolve) {
    formatName = formatName || 'xlf';
    // Checks the format and returns the extension
    const ext = i18nGetExtension(formatName);
    const content = i18nSerialize(bundle, formatName, options);
    const dstFile = outFile || `messages.${ext}`;
    const dstPath = pathResolve(options.outDir || options.basePath, dstFile);
    host.writeFile(dstPath, content, false, undefined, []);
    return [dstPath];
}
function i18nSerialize(bundle, formatName, options) {
    const format = formatName.toLowerCase();
    let serializer;
    switch (format) {
        case 'xmb':
            serializer = new compiler.Xmb();
            break;
        case 'xliff2':
        case 'xlf2':
            serializer = new Xliff2();
            break;
        case 'xlf':
        case 'xliff':
        default:
            serializer = new Xliff();
    }
    return bundle.write(serializer, getPathNormalizer(options.basePath));
}
function getPathNormalizer(basePath) {
    // normalize source paths by removing the base path and always using "/" as a separator
    return (sourcePath) => {
        sourcePath = basePath ? p__namespace.relative(basePath, sourcePath) : sourcePath;
        return sourcePath.split(p__namespace.sep).join('/');
    };
}

/**
 * Converts a `string` version into an array of numbers
 * @example
 * toNumbers('2.0.1'); // returns [2, 0, 1]
 */
function toNumbers(value) {
    // Drop any suffixes starting with `-` so that versions like `1.2.3-rc.5` are treated as `1.2.3`.
    const suffixIndex = value.lastIndexOf('-');
    return value
        .slice(0, suffixIndex === -1 ? value.length : suffixIndex)
        .split('.')
        .map((segment) => {
        const parsed = parseInt(segment, 10);
        if (isNaN(parsed)) {
            throw Error(`Unable to parse version string ${value}.`);
        }
        return parsed;
    });
}
/**
 * Compares two arrays of positive numbers with lexicographical order in mind.
 *
 * However - unlike lexicographical order - for arrays of different length we consider:
 * [1, 2, 3] = [1, 2, 3, 0] instead of [1, 2, 3] < [1, 2, 3, 0]
 *
 * @param a The 'left hand' array in the comparison test
 * @param b The 'right hand' in the comparison test
 * @returns {-1|0|1} The comparison result: 1 if a is greater, -1 if b is greater, 0 is the two
 * arrays are equals
 */
function compareNumbers(a, b) {
    const max = Math.max(a.length, b.length);
    const min = Math.min(a.length, b.length);
    for (let i = 0; i < min; i++) {
        if (a[i] > b[i])
            return 1;
        if (a[i] < b[i])
            return -1;
    }
    if (min !== max) {
        const longestArray = a.length === max ? a : b;
        // The result to return in case the to arrays are considered different (1 if a is greater,
        // -1 if b is greater)
        const comparisonResult = a.length === max ? 1 : -1;
        // Check that at least one of the remaining elements is greater than 0 to consider that the two
        // arrays are different (e.g. [1, 0] and [1] are considered the same but not [1, 0, 1] and [1])
        for (let i = min; i < max; i++) {
            if (longestArray[i] > 0) {
                return comparisonResult;
            }
        }
    }
    return 0;
}
/**
 * Compares two versions
 *
 * @param v1 The 'left hand' version in the comparison test
 * @param v2 The 'right hand' version in the comparison test
 * @returns {-1|0|1} The comparison result: 1 if v1 is greater, -1 if v2 is greater, 0 is the two
 * versions are equals
 */
function compareVersions(v1, v2) {
    return compareNumbers(toNumbers(v1), toNumbers(v2));
}

/**
 * Minimum supported TypeScript version
 * ∀ supported typescript version v, v >= MIN_TS_VERSION
 *
 * Note: this check is disabled in g3, search for
 * `angularCompilerOptions.disableTypeScriptVersionCheck` config param value in g3.
 */
const MIN_TS_VERSION = '5.8.0';
/**
 * Supremum of supported TypeScript versions
 * ∀ supported typescript version v, v < MAX_TS_VERSION
 * MAX_TS_VERSION is not considered as a supported TypeScript version
 *
 * Note: this check is disabled in g3, search for
 * `angularCompilerOptions.disableTypeScriptVersionCheck` config param value in g3.
 */
const MAX_TS_VERSION = '5.9.0';
/**
 * The currently used version of TypeScript, which can be adjusted for testing purposes using
 * `setTypeScriptVersionForTesting` and `restoreTypeScriptVersionForTesting` below.
 */
let tsVersion = ts.version;
/**
 * Checks whether a given version ∈ [minVersion, maxVersion[.
 * An error will be thrown when the given version ∉ [minVersion, maxVersion[.
 *
 * @param version The version on which the check will be performed
 * @param minVersion The lower bound version. A valid version needs to be greater than minVersion
 * @param maxVersion The upper bound version. A valid version needs to be strictly less than
 * maxVersion
 *
 * @throws Will throw an error if the given version ∉ [minVersion, maxVersion[
 */
function checkVersion(version, minVersion, maxVersion) {
    if (compareVersions(version, minVersion) < 0 || compareVersions(version, maxVersion) >= 0) {
        throw new Error(`The Angular Compiler requires TypeScript >=${minVersion} and <${maxVersion} but ${version} was found instead.`);
    }
}
function verifySupportedTypeScriptVersion() {
    checkVersion(tsVersion, MIN_TS_VERSION, MAX_TS_VERSION);
}

/**
 * Analyzes a `ts.Program` for cycles.
 */
class CycleAnalyzer {
    importGraph;
    /**
     * Cycle detection is requested with the same `from` source file for all used directives and pipes
     * within a component, which makes it beneficial to cache the results as long as the `from` source
     * file has not changed. This avoids visiting the import graph that is reachable from multiple
     * directives/pipes more than once.
     */
    cachedResults = null;
    constructor(importGraph) {
        this.importGraph = importGraph;
    }
    /**
     * Check for a cycle to be created in the `ts.Program` by adding an import between `from` and
     * `to`.
     *
     * @returns a `Cycle` object if an import between `from` and `to` would create a cycle; `null`
     *     otherwise.
     */
    wouldCreateCycle(from, to) {
        // Try to reuse the cached results as long as the `from` source file is the same.
        if (this.cachedResults === null || this.cachedResults.from !== from) {
            this.cachedResults = new CycleResults(from, this.importGraph);
        }
        // Import of 'from' -> 'to' is illegal if an edge 'to' -> 'from' already exists.
        return this.cachedResults.wouldBeCyclic(to) ? new Cycle(this.importGraph, from, to) : null;
    }
    /**
     * Record a synthetic import from `from` to `to`.
     *
     * This is an import that doesn't exist in the `ts.Program` but will be considered as part of the
     * import graph for cycle creation.
     */
    recordSyntheticImport(from, to) {
        this.cachedResults = null;
        this.importGraph.addSyntheticImport(from, to);
    }
}
const NgCyclicResult = Symbol('NgCyclicResult');
/**
 * Stores the results of cycle detection in a memory efficient manner. A symbol is attached to
 * source files that indicate what the cyclic analysis result is, as indicated by two markers that
 * are unique to this instance. This alleviates memory pressure in large import graphs, as each
 * execution is able to store its results in the same memory location (i.e. in the symbol
 * on the source file) as earlier executions.
 */
class CycleResults {
    from;
    importGraph;
    cyclic = {};
    acyclic = {};
    constructor(from, importGraph) {
        this.from = from;
        this.importGraph = importGraph;
    }
    wouldBeCyclic(sf) {
        const cached = this.getCachedResult(sf);
        if (cached !== null) {
            // The result for this source file has already been computed, so return its result.
            return cached;
        }
        if (sf === this.from) {
            // We have reached the source file that we want to create an import from, which means that
            // doing so would create a cycle.
            return true;
        }
        // Assume for now that the file will be acyclic; this prevents infinite recursion in the case
        // that `sf` is visited again as part of an existing cycle in the graph.
        this.markAcyclic(sf);
        const imports = this.importGraph.importsOf(sf);
        for (const imported of imports) {
            if (this.wouldBeCyclic(imported)) {
                this.markCyclic(sf);
                return true;
            }
        }
        return false;
    }
    /**
     * Returns whether the source file is already known to be cyclic, or `null` if the result is not
     * yet known.
     */
    getCachedResult(sf) {
        const result = sf[NgCyclicResult];
        if (result === this.cyclic) {
            return true;
        }
        else if (result === this.acyclic) {
            return false;
        }
        else {
            // Either the symbol is missing or its value does not correspond with one of the current
            // result markers. As such, the result is unknown.
            return null;
        }
    }
    markCyclic(sf) {
        sf[NgCyclicResult] = this.cyclic;
    }
    markAcyclic(sf) {
        sf[NgCyclicResult] = this.acyclic;
    }
}
/**
 * Represents an import cycle between `from` and `to` in the program.
 *
 * This class allows us to do the work to compute the cyclic path between `from` and `to` only if
 * needed.
 */
class Cycle {
    importGraph;
    from;
    to;
    constructor(importGraph, from, to) {
        this.importGraph = importGraph;
        this.from = from;
        this.to = to;
    }
    /**
     * Compute an array of source-files that illustrates the cyclic path between `from` and `to`.
     *
     * Note that a `Cycle` will not be created unless a path is available between `to` and `from`,
     * so `findPath()` will never return `null`.
     */
    getPath() {
        return [this.from, ...this.importGraph.findPath(this.to, this.from)];
    }
}

/**
 * A cached graph of imports in the `ts.Program`.
 *
 * The `ImportGraph` keeps track of dependencies (imports) of individual `ts.SourceFile`s. Only
 * dependencies within the same program are tracked; imports into packages on NPM are not.
 */
class ImportGraph {
    checker;
    perf;
    imports = new Map();
    constructor(checker, perf) {
        this.checker = checker;
        this.perf = perf;
    }
    /**
     * List the direct (not transitive) imports of a given `ts.SourceFile`.
     *
     * This operation is cached.
     */
    importsOf(sf) {
        if (!this.imports.has(sf)) {
            this.imports.set(sf, this.scanImports(sf));
        }
        return this.imports.get(sf);
    }
    /**
     * Find an import path from the `start` SourceFile to the `end` SourceFile.
     *
     * This function implements a breadth first search that results in finding the
     * shortest path between the `start` and `end` points.
     *
     * @param start the starting point of the path.
     * @param end the ending point of the path.
     * @returns an array of source files that connect the `start` and `end` source files, or `null` if
     *     no path could be found.
     */
    findPath(start, end) {
        if (start === end) {
            // Escape early for the case where `start` and `end` are the same.
            return [start];
        }
        const found = new Set([start]);
        const queue = [new Found(start, null)];
        while (queue.length > 0) {
            const current = queue.shift();
            const imports = this.importsOf(current.sourceFile);
            for (const importedFile of imports) {
                if (!found.has(importedFile)) {
                    const next = new Found(importedFile, current);
                    if (next.sourceFile === end) {
                        // We have hit the target `end` path so we can stop here.
                        return next.toPath();
                    }
                    found.add(importedFile);
                    queue.push(next);
                }
            }
        }
        return null;
    }
    /**
     * Add a record of an import from `sf` to `imported`, that's not present in the original
     * `ts.Program` but will be remembered by the `ImportGraph`.
     */
    addSyntheticImport(sf, imported) {
        if (isLocalFile(imported)) {
            this.importsOf(sf).add(imported);
        }
    }
    scanImports(sf) {
        return this.perf.inPhase(checker.PerfPhase.CycleDetection, () => {
            const imports = new Set();
            // Look through the source file for import and export statements.
            for (const stmt of sf.statements) {
                if ((!ts.isImportDeclaration(stmt) && !ts.isExportDeclaration(stmt)) ||
                    stmt.moduleSpecifier === undefined) {
                    continue;
                }
                if (ts.isImportDeclaration(stmt) &&
                    stmt.importClause !== undefined &&
                    isTypeOnlyImportClause(stmt.importClause)) {
                    // Exclude type-only imports as they are always elided, so they don't contribute to
                    // cycles.
                    continue;
                }
                const symbol = this.checker.getSymbolAtLocation(stmt.moduleSpecifier);
                if (symbol === undefined || symbol.valueDeclaration === undefined) {
                    // No symbol could be found to skip over this import/export.
                    continue;
                }
                const moduleFile = symbol.valueDeclaration;
                if (ts.isSourceFile(moduleFile) && isLocalFile(moduleFile)) {
                    // Record this local import.
                    imports.add(moduleFile);
                }
            }
            return imports;
        });
    }
}
function isLocalFile(sf) {
    return !sf.isDeclarationFile;
}
function isTypeOnlyImportClause(node) {
    // The clause itself is type-only (e.g. `import type {foo} from '...'`).
    if (node.isTypeOnly) {
        return true;
    }
    // All the specifiers in the cause are type-only (e.g. `import {type a, type b} from '...'`).
    if (node.namedBindings !== undefined &&
        ts.isNamedImports(node.namedBindings) &&
        node.namedBindings.elements.every((specifier) => specifier.isTypeOnly)) {
        return true;
    }
    return false;
}
/**
 * A helper class to track which SourceFiles are being processed when searching for a path in
 * `getPath()` above.
 */
class Found {
    sourceFile;
    parent;
    constructor(sourceFile, parent) {
        this.sourceFile = sourceFile;
        this.parent = parent;
    }
    /**
     * Back track through this found SourceFile and its ancestors to generate an array of
     * SourceFiles that form am import path between two SourceFiles.
     */
    toPath() {
        const array = [];
        let current = this;
        while (current !== null) {
            array.push(current.sourceFile);
            current = current.parent;
        }
        // Pushing and then reversing, O(n), rather than unshifting repeatedly, O(n^2), avoids
        // manipulating the array on every iteration: https://stackoverflow.com/a/26370620
        return array.reverse();
    }
}

/** Type of top-level documentation entry. */
var EntryType;
(function (EntryType) {
    EntryType["Block"] = "block";
    EntryType["Component"] = "component";
    EntryType["Constant"] = "constant";
    EntryType["Decorator"] = "decorator";
    EntryType["Directive"] = "directive";
    EntryType["Element"] = "element";
    EntryType["Enum"] = "enum";
    EntryType["Function"] = "function";
    EntryType["Interface"] = "interface";
    EntryType["NgModule"] = "ng_module";
    EntryType["Pipe"] = "pipe";
    EntryType["TypeAlias"] = "type_alias";
    EntryType["UndecoratedClass"] = "undecorated_class";
    EntryType["InitializerApiFunction"] = "initializer_api_function";
})(EntryType || (EntryType = {}));
/** Types of class members */
var MemberType;
(function (MemberType) {
    MemberType["Property"] = "property";
    MemberType["Method"] = "method";
    MemberType["Getter"] = "getter";
    MemberType["Setter"] = "setter";
    MemberType["EnumItem"] = "enum_item";
})(MemberType || (MemberType = {}));
var DecoratorType;
(function (DecoratorType) {
    DecoratorType["Class"] = "class";
    DecoratorType["Member"] = "member";
    DecoratorType["Parameter"] = "parameter";
})(DecoratorType || (DecoratorType = {}));
/** Informational tags applicable to class members. */
var MemberTags;
(function (MemberTags) {
    MemberTags["Abstract"] = "abstract";
    MemberTags["Static"] = "static";
    MemberTags["Readonly"] = "readonly";
    MemberTags["Protected"] = "protected";
    MemberTags["Optional"] = "optional";
    MemberTags["Input"] = "input";
    MemberTags["Output"] = "output";
    MemberTags["Inherited"] = "override";
})(MemberTags || (MemberTags = {}));

/** Gets whether a symbol's name indicates it is an Angular-private API. */
function isAngularPrivateName(name) {
    const firstChar = name[0] ?? '';
    return firstChar === 'ɵ' || firstChar === '_';
}

/** Gets a list of all the generic type parameters for a declaration. */
function extractGenerics(declaration) {
    return (declaration.typeParameters?.map((typeParam) => ({
        name: typeParam.name.getText(),
        constraint: typeParam.constraint?.getText(),
        default: typeParam.default?.getText(),
    })) ?? []);
}

/**
 * RegExp to match the `@` character follow by any Angular decorator, used to escape Angular
 * decorators in JsDoc blocks so that they're not parsed as JsDoc tags.
 */
const decoratorExpression = /@(?=(Injectable|Component|Directive|Pipe|NgModule|Input|Output|HostBinding|HostListener|Inject|Optional|Self|Host|SkipSelf|ViewChild|ViewChildren|ContentChild|ContentChildren))/g;
/** Gets the set of JsDoc tags applied to a node. */
function extractJsDocTags(node) {
    const escapedNode = getEscapedNode(node);
    return ts.getJSDocTags(escapedNode).map((t) => {
        return {
            name: t.tagName.getText(),
            comment: unescapeAngularDecorators(ts.getTextOfJSDocComment(t.comment) ?? ''),
        };
    });
}
/**
 * Gets the JsDoc description for a node. If the node does not have
 * a description, returns the empty string.
 */
function extractJsDocDescription(node) {
    const escapedNode = getEscapedNode(node);
    // If the node is a top-level statement (const, class, function, etc.), we will get
    // a `ts.JSDoc` here. If the node is a `ts.ParameterDeclaration`, we will get
    // a `ts.JSDocParameterTag`.
    const commentOrTag = ts.getJSDocCommentsAndTags(escapedNode).find((d) => {
        return ts.isJSDoc(d) || ts.isJSDocParameterTag(d);
    });
    const comment = commentOrTag?.comment ?? '';
    const description = typeof comment === 'string' ? comment : (ts.getTextOfJSDocComment(comment) ?? '');
    return unescapeAngularDecorators(description);
}
/**
 * Gets the raw JsDoc applied to a node.
 * If the node does not have a JsDoc block, returns the empty string.
 */
function extractRawJsDoc(node) {
    // Assume that any node has at most one JsDoc block.
    const comment = ts.getJSDocCommentsAndTags(node).find(ts.isJSDoc)?.getFullText() ?? '';
    return unescapeAngularDecorators(comment);
}
/**
 * Gets an "escaped" version of the node by copying its raw JsDoc into a new source file
 * on top of a dummy class declaration. For the purposes of JsDoc extraction, we don't actually
 * care about the node itself, only its JsDoc block.
 */
function getEscapedNode(node) {
    // TODO(jelbourn): It's unclear whether we need to escape @param JsDoc, since they're unlikely
    //    to have an Angular decorator on the beginning of a line. If we do need to escape them,
    //    it will require some more complicated copying below.
    if (ts.isParameter(node)) {
        return node;
    }
    const rawComment = extractRawJsDoc(node);
    const escaped = escapeAngularDecorators(rawComment);
    const file = ts.createSourceFile('x.ts', `${escaped}class X {}`, ts.ScriptTarget.ES2020, true);
    return file.statements.find((s) => ts.isClassDeclaration(s));
}
/** Escape the `@` character for Angular decorators. */
function escapeAngularDecorators(comment) {
    return comment.replace(decoratorExpression, '_NG_AT_');
}
/** Unescapes the `@` character for Angular decorators. */
function unescapeAngularDecorators(comment) {
    return comment.replace(/_NG_AT_/g, '@');
}

/** Gets the string representation of a node's resolved type. */
function extractResolvedTypeString(node, checker) {
    return checker.typeToString(checker.getTypeAtLocation(node), undefined, ts.TypeFormatFlags.NoTruncation);
}

class FunctionExtractor {
    name;
    exportDeclaration;
    typeChecker;
    constructor(name, exportDeclaration, typeChecker) {
        this.name = name;
        this.exportDeclaration = exportDeclaration;
        this.typeChecker = typeChecker;
    }
    extract() {
        // TODO: is there any real situation in which the signature would not be available here?
        //     Is void a better type?
        const signature = this.typeChecker.getSignatureFromDeclaration(this.exportDeclaration);
        const returnType = signature
            ? this.typeChecker.typeToString(this.typeChecker.getReturnTypeOfSignature(signature), undefined, 
            // This ensures that e.g. `T | undefined` is not reduced to `T`.
            ts.TypeFormatFlags.NoTypeReduction | ts.TypeFormatFlags.NoTruncation)
            : 'unknown';
        const implementation = findImplementationOfFunction(this.exportDeclaration, this.typeChecker) ??
            this.exportDeclaration;
        const type = this.typeChecker.getTypeAtLocation(this.exportDeclaration);
        const overloads = ts.isConstructorDeclaration(this.exportDeclaration)
            ? constructorOverloads(this.exportDeclaration, this.typeChecker)
            : extractCallSignatures(this.name, this.typeChecker, type);
        const jsdocsTags = extractJsDocTags(implementation);
        const description = extractJsDocDescription(implementation);
        return {
            name: this.name,
            signatures: overloads,
            implementation: {
                params: extractAllParams(implementation.parameters, this.typeChecker),
                isNewType: ts.isConstructSignatureDeclaration(implementation),
                returnType,
                returnDescription: jsdocsTags.find((tag) => tag.name === 'returns')?.comment,
                generics: extractGenerics(implementation),
                name: this.name,
                description,
                entryType: EntryType.Function,
                jsdocTags: jsdocsTags,
                rawComment: extractRawJsDoc(implementation),
            },
            entryType: EntryType.Function,
            description,
            jsdocTags: jsdocsTags,
            rawComment: extractRawJsDoc(implementation),
        };
    }
}
function constructorOverloads(constructorDeclaration, typeChecker) {
    const classDeclaration = constructorDeclaration.parent;
    const constructorNode = classDeclaration.members.filter((member) => {
        return ts.isConstructorDeclaration(member) && !member.body;
    });
    return constructorNode.map((n) => {
        return {
            name: 'constructor',
            params: extractAllParams(n.parameters, typeChecker),
            returnType: typeChecker.getTypeAtLocation(classDeclaration)?.symbol.name,
            description: extractJsDocDescription(n),
            entryType: EntryType.Function,
            jsdocTags: extractJsDocTags(n),
            rawComment: extractRawJsDoc(n),
            generics: extractGenerics(n),
            isNewType: false,
        };
    });
}
/** Extracts parameters of the given parameter declaration AST nodes. */
function extractAllParams(params, typeChecker) {
    return params.map((param) => ({
        name: param.name.getText(),
        description: extractJsDocDescription(param),
        type: extractResolvedTypeString(param, typeChecker),
        isOptional: !!(param.questionToken || param.initializer),
        isRestParam: !!param.dotDotDotToken,
    }));
}
/** Filters the list signatures to valid function and initializer API signatures. */
function filterSignatureDeclarations(signatures) {
    const result = [];
    for (const signature of signatures) {
        const decl = signature.getDeclaration();
        if (ts.isFunctionDeclaration(decl) ||
            ts.isCallSignatureDeclaration(decl) ||
            ts.isMethodDeclaration(decl) ||
            ts.isConstructSignatureDeclaration(decl)) {
            result.push({ signature, decl });
        }
    }
    return result;
}
function extractCallSignatures(name, typeChecker, type) {
    return filterSignatureDeclarations(type.getCallSignatures()).map(({ decl, signature }) => ({
        name,
        entryType: EntryType.Function,
        description: extractJsDocDescription(decl),
        generics: extractGenerics(decl),
        isNewType: false,
        jsdocTags: extractJsDocTags(decl),
        params: extractAllParams(decl.parameters, typeChecker),
        rawComment: extractRawJsDoc(decl),
        returnType: typeChecker.typeToString(typeChecker.getReturnTypeOfSignature(signature), undefined, 
        // This ensures that e.g. `T | undefined` is not reduced to `T`.
        ts.TypeFormatFlags.NoTypeReduction | ts.TypeFormatFlags.NoTruncation),
    }));
}
/** Finds the implementation of the given function declaration overload signature. */
function findImplementationOfFunction(node, typeChecker) {
    if (node.body !== undefined || node.name === undefined) {
        return node;
    }
    const symbol = typeChecker.getSymbolAtLocation(node.name);
    const implementation = symbol?.declarations?.find((s) => ts.isFunctionDeclaration(s) && s.body !== undefined);
    return implementation;
}

/**
 * Check if the member has a JSDoc @internal or a @internal is a normal comment
 */
function isInternal(member) {
    return (extractJsDocTags(member).some((tag) => tag.name === 'internal') ||
        hasLeadingInternalComment(member));
}
/*
 * Check if the member has a comment block with @internal
 */
function hasLeadingInternalComment(member) {
    const memberText = member.getSourceFile().text;
    return (ts.reduceEachLeadingCommentRange(memberText, member.getFullStart(), (pos, end, kind, hasTrailingNewLine, containsInternal) => {
        return containsInternal || memberText.slice(pos, end).includes('@internal');
    }, 
    /* state */ false, 
    /* initial */ false) ?? false);
}

/** Extractor to pull info for API reference documentation for a TypeScript class or interface. */
class ClassExtractor {
    declaration;
    typeChecker;
    constructor(declaration, typeChecker) {
        this.declaration = declaration;
        this.typeChecker = typeChecker;
    }
    /** Extract docs info specific to classes. */
    extract() {
        return {
            name: this.declaration.name.text,
            isAbstract: this.isAbstract(),
            entryType: ts.isInterfaceDeclaration(this.declaration)
                ? EntryType.Interface
                : EntryType.UndecoratedClass,
            members: this.extractSignatures().concat(this.extractAllClassMembers()),
            generics: extractGenerics(this.declaration),
            description: extractJsDocDescription(this.declaration),
            jsdocTags: extractJsDocTags(this.declaration),
            rawComment: extractRawJsDoc(this.declaration),
            extends: this.extractInheritance(this.declaration),
            implements: this.extractInterfaceConformance(this.declaration),
        };
    }
    /** Extracts doc info for a class's members. */
    extractAllClassMembers() {
        const members = [];
        for (const member of this.getMemberDeclarations()) {
            if (this.isMemberExcluded(member))
                continue;
            const memberEntry = this.extractClassMember(member);
            if (memberEntry) {
                members.push(memberEntry);
            }
        }
        return members;
    }
    /** Extract docs for a class's members (methods and properties).  */
    extractClassMember(memberDeclaration) {
        if (this.isMethod(memberDeclaration)) {
            return this.extractMethod(memberDeclaration);
        }
        else if (this.isProperty(memberDeclaration) &&
            !this.hasPrivateComputedProperty(memberDeclaration)) {
            return this.extractClassProperty(memberDeclaration);
        }
        else if (ts.isAccessor(memberDeclaration)) {
            return this.extractGetterSetter(memberDeclaration);
        }
        else if (ts.isConstructorDeclaration(memberDeclaration)) {
            return this.extractConstructor(memberDeclaration);
        }
        // We only expect methods, properties, and accessors. If we encounter something else,
        // return undefined and let the rest of the program filter it out.
        return undefined;
    }
    /** Extract docs for all call signatures in the current class/interface. */
    extractSignatures() {
        return this.computeAllSignatureDeclarations().map((s) => this.extractSignature(s));
    }
    /** Extracts docs for a class method. */
    extractMethod(methodDeclaration) {
        const functionExtractor = new FunctionExtractor(methodDeclaration.name.getText(), methodDeclaration, this.typeChecker);
        return {
            ...functionExtractor.extract(),
            memberType: MemberType.Method,
            memberTags: this.getMemberTags(methodDeclaration),
        };
    }
    /** Extracts docs for a signature element (usually inside an interface). */
    extractSignature(signature) {
        // No name for the function if we are dealing with call signatures.
        // For construct signatures we are using `new` as the name of the function for now.
        // TODO: Consider exposing a new entry type for signature types.
        const functionExtractor = new FunctionExtractor(ts.isConstructSignatureDeclaration(signature) ? 'new' : '', signature, this.typeChecker);
        return {
            ...functionExtractor.extract(),
            memberType: MemberType.Method,
            memberTags: [],
        };
    }
    /** Extracts doc info for a property declaration. */
    extractClassProperty(propertyDeclaration) {
        return {
            name: propertyDeclaration.name.getText(),
            type: extractResolvedTypeString(propertyDeclaration, this.typeChecker),
            memberType: MemberType.Property,
            memberTags: this.getMemberTags(propertyDeclaration),
            description: extractJsDocDescription(propertyDeclaration),
            jsdocTags: extractJsDocTags(propertyDeclaration),
        };
    }
    /** Extracts doc info for an accessor member (getter/setter). */
    extractGetterSetter(accessor) {
        return {
            ...this.extractClassProperty(accessor),
            memberType: ts.isGetAccessor(accessor) ? MemberType.Getter : MemberType.Setter,
        };
    }
    extractConstructor(constructorDeclaration) {
        const functionExtractor = new FunctionExtractor('constructor', constructorDeclaration, this.typeChecker);
        return {
            ...functionExtractor.extract(),
            memberType: MemberType.Method,
            memberTags: this.getMemberTags(constructorDeclaration),
        };
    }
    extractInheritance(declaration) {
        if (!declaration.heritageClauses) {
            return undefined;
        }
        for (const clause of declaration.heritageClauses) {
            if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
                // We are assuming a single class can only extend one class.
                const types = clause.types;
                if (types.length > 0) {
                    const baseClass = types[0];
                    return baseClass.getText();
                }
            }
        }
        return undefined;
    }
    extractInterfaceConformance(declaration) {
        const implementClause = declaration.heritageClauses?.find((clause) => clause.token === ts.SyntaxKind.ImplementsKeyword);
        return implementClause?.types.map((m) => m.getText()) ?? [];
    }
    /** Gets the tags for a member (protected, readonly, static, etc.) */
    getMemberTags(member) {
        const tags = this.getMemberTagsFromModifiers(member.modifiers ?? []);
        if (member.questionToken) {
            tags.push(MemberTags.Optional);
        }
        if (member.parent !== this.declaration) {
            tags.push(MemberTags.Inherited);
        }
        return tags;
    }
    /** Computes all signature declarations of the class/interface. */
    computeAllSignatureDeclarations() {
        const type = this.typeChecker.getTypeAtLocation(this.declaration);
        const signatures = [...type.getCallSignatures(), ...type.getConstructSignatures()];
        const result = [];
        for (const signature of signatures) {
            const decl = signature.getDeclaration();
            if (this.isDocumentableSignature(decl) && this.isDocumentableMember(decl)) {
                result.push(decl);
            }
        }
        return result;
    }
    /** Gets all member declarations, including inherited members. */
    getMemberDeclarations() {
        // We rely on TypeScript to resolve all the inherited members to their
        // ultimate form via `getProperties`. This is important because child
        // classes may narrow types or add method overloads.
        const type = this.typeChecker.getTypeAtLocation(this.declaration);
        const members = type.getProperties();
        const constructor = type.getSymbol()?.members?.get(ts.InternalSymbolName.Constructor);
        // While the properties of the declaration type represent the properties that exist
        // on a class *instance*, static members are properties on the class symbol itself.
        const typeOfConstructor = this.typeChecker.getTypeOfSymbol(type.symbol);
        const staticMembers = typeOfConstructor.getProperties();
        const result = [];
        for (const member of [...(constructor ? [constructor] : []), ...members, ...staticMembers]) {
            // A member may have multiple declarations in the case of function overloads.
            const memberDeclarations = this.filterMethodOverloads(member.getDeclarations() ?? []);
            for (const memberDeclaration of memberDeclarations) {
                if (this.isDocumentableMember(memberDeclaration)) {
                    result.push(memberDeclaration);
                }
            }
        }
        return result;
    }
    /** The result only contains properties, method implementations and abstracts */
    filterMethodOverloads(declarations) {
        return declarations.filter((declaration, index) => {
            // Check if the declaration is a function or method
            if (ts.isFunctionDeclaration(declaration) ||
                ts.isMethodDeclaration(declaration) ||
                ts.isConstructorDeclaration(declaration)) {
                // TypeScript ensures that all declarations for a given abstract method appear consecutively.
                const nextDeclaration = declarations[index + 1];
                const isNextMethodWithSameName = nextDeclaration &&
                    ((ts.isMethodDeclaration(nextDeclaration) &&
                        nextDeclaration.name.getText() === declaration.name?.getText()) ||
                        (ts.isConstructorDeclaration(nextDeclaration) &&
                            ts.isConstructorDeclaration(declaration)));
                // Return only the last occurrence of a method to avoid overload duplication.
                // Subsequent overloads or implementations are handled separately by the function extractor.
                return !isNextMethodWithSameName;
            }
            // Include non-method declarations, such as properties, without filtering.
            return true;
        });
    }
    /** Get the tags for a member that come from the declaration modifiers. */
    getMemberTagsFromModifiers(mods) {
        const tags = [];
        for (const mod of mods) {
            const tag = this.getTagForMemberModifier(mod);
            if (tag)
                tags.push(tag);
        }
        return tags;
    }
    /** Gets the doc tag corresponding to a class member modifier (readonly, protected, etc.). */
    getTagForMemberModifier(mod) {
        switch (mod.kind) {
            case ts.SyntaxKind.StaticKeyword:
                return MemberTags.Static;
            case ts.SyntaxKind.ReadonlyKeyword:
                return MemberTags.Readonly;
            case ts.SyntaxKind.ProtectedKeyword:
                return MemberTags.Protected;
            case ts.SyntaxKind.AbstractKeyword:
                return MemberTags.Abstract;
            default:
                return undefined;
        }
    }
    /**
     * Gets whether a given class member should be excluded from public API docs.
     * This is the case if:
     *  - The member does not have a name
     *  - The member is neither a method nor property
     *  - The member is private
     *  - The member has a name that marks it as Angular-internal.
     *  - The member is marked as internal via JSDoc.
     */
    isMemberExcluded(member) {
        if (ts.isConstructorDeclaration(member)) {
            // A constructor has no name
            return false;
        }
        return (!member.name ||
            !this.isDocumentableMember(member) ||
            (!ts.isCallSignatureDeclaration(member) &&
                member.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.PrivateKeyword)) ||
            member.name.getText() === 'prototype' ||
            isAngularPrivateName(member.name.getText()) ||
            isInternal(member));
    }
    /** Gets whether a class member is a method, property, or accessor. */
    isDocumentableMember(member) {
        return (this.isMethod(member) ||
            this.isProperty(member) ||
            ts.isAccessor(member) ||
            ts.isConstructorDeclaration(member) ||
            // Signatures are documentable if they are part of an interface.
            ts.isCallSignatureDeclaration(member));
    }
    /** Check if the parameter is a constructor parameter with a public modifier */
    isPublicConstructorParameterProperty(node) {
        if (ts.isParameterPropertyDeclaration(node, node.parent) && node.modifiers) {
            return node.modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.PublicKeyword);
        }
        return false;
    }
    /** Gets whether a member is a property. */
    isProperty(member) {
        // Classes have declarations, interface have signatures
        return (ts.isPropertyDeclaration(member) ||
            ts.isPropertySignature(member) ||
            this.isPublicConstructorParameterProperty(member));
    }
    /** Gets whether a member is a method. */
    isMethod(member) {
        // Classes have declarations, interface have signatures
        return ts.isMethodDeclaration(member) || ts.isMethodSignature(member);
    }
    /** Gets whether the given signature declaration is documentable. */
    isDocumentableSignature(signature) {
        return (ts.isConstructSignatureDeclaration(signature) || ts.isCallSignatureDeclaration(signature));
    }
    /** Gets whether the declaration for this extractor is abstract. */
    isAbstract() {
        const modifiers = this.declaration.modifiers ?? [];
        return modifiers.some((mod) => mod.kind === ts.SyntaxKind.AbstractKeyword);
    }
    /**
     * Check wether a member has a private computed property name like [ɵWRITABLE_SIGNAL]
     *
     * This will prevent exposing private computed properties in the docs.
     */
    hasPrivateComputedProperty(property) {
        return (ts.isComputedPropertyName(property.name) && property.name.expression.getText().startsWith('ɵ'));
    }
}
/** Extractor to pull info for API reference documentation for an Angular directive. */
class DirectiveExtractor extends ClassExtractor {
    reference;
    metadata;
    constructor(declaration, reference, metadata, checker) {
        super(declaration, checker);
        this.reference = reference;
        this.metadata = metadata;
    }
    /** Extract docs info for directives and components (including underlying class info). */
    extract() {
        return {
            ...super.extract(),
            isStandalone: this.metadata.isStandalone,
            selector: this.metadata.selector ?? '',
            exportAs: this.metadata.exportAs ?? [],
            entryType: this.metadata.isComponent ? EntryType.Component : EntryType.Directive,
        };
    }
    /** Extracts docs info for a directive property, including input/output metadata. */
    extractClassProperty(propertyDeclaration) {
        const entry = super.extractClassProperty(propertyDeclaration);
        const inputMetadata = this.getInputMetadata(propertyDeclaration);
        if (inputMetadata) {
            entry.memberTags.push(MemberTags.Input);
            entry.inputAlias = inputMetadata.bindingPropertyName;
            entry.isRequiredInput = inputMetadata.required;
        }
        const outputMetadata = this.getOutputMetadata(propertyDeclaration);
        if (outputMetadata) {
            entry.memberTags.push(MemberTags.Output);
            entry.outputAlias = outputMetadata.bindingPropertyName;
        }
        return entry;
    }
    /** Gets the input metadata for a directive property. */
    getInputMetadata(prop) {
        const propName = prop.name.getText();
        return this.metadata.inputs?.getByClassPropertyName(propName) ?? undefined;
    }
    /** Gets the output metadata for a directive property. */
    getOutputMetadata(prop) {
        const propName = prop.name.getText();
        return this.metadata?.outputs?.getByClassPropertyName(propName) ?? undefined;
    }
}
/** Extractor to pull info for API reference documentation for an Angular pipe. */
class PipeExtractor extends ClassExtractor {
    reference;
    metadata;
    constructor(declaration, reference, metadata, typeChecker) {
        super(declaration, typeChecker);
        this.reference = reference;
        this.metadata = metadata;
    }
    extract() {
        return {
            ...super.extract(),
            pipeName: this.metadata.name,
            entryType: EntryType.Pipe,
            isStandalone: this.metadata.isStandalone,
        };
    }
}
/** Extractor to pull info for API reference documentation for an Angular pipe. */
class NgModuleExtractor extends ClassExtractor {
    reference;
    metadata;
    constructor(declaration, reference, metadata, typeChecker) {
        super(declaration, typeChecker);
        this.reference = reference;
        this.metadata = metadata;
    }
    extract() {
        return {
            ...super.extract(),
            entryType: EntryType.NgModule,
        };
    }
}
/** Extracts documentation info for a class, potentially including Angular-specific info.  */
function extractClass(classDeclaration, metadataReader, typeChecker) {
    const ref = new checker.Reference(classDeclaration);
    let extractor;
    let directiveMetadata = metadataReader.getDirectiveMetadata(ref);
    let pipeMetadata = metadataReader.getPipeMetadata(ref);
    let ngModuleMetadata = metadataReader.getNgModuleMetadata(ref);
    if (directiveMetadata) {
        extractor = new DirectiveExtractor(classDeclaration, ref, directiveMetadata, typeChecker);
    }
    else if (pipeMetadata) {
        extractor = new PipeExtractor(classDeclaration, ref, pipeMetadata, typeChecker);
    }
    else if (ngModuleMetadata) {
        extractor = new NgModuleExtractor(classDeclaration, ref, ngModuleMetadata, typeChecker);
    }
    else {
        extractor = new ClassExtractor(classDeclaration, typeChecker);
    }
    return extractor.extract();
}
/** Extracts documentation info for an interface. */
function extractInterface(declaration, typeChecker) {
    const extractor = new ClassExtractor(declaration, typeChecker);
    return extractor.extract();
}

/** Name of the tag indicating that an object literal should be shown as an enum in docs. */
const LITERAL_AS_ENUM_TAG = 'object-literal-as-enum';
/** Extracts documentation entry for a constant. */
function extractConstant(declaration, typeChecker) {
    // For constants specifically, we want to get the base type for any literal types.
    // For example, TypeScript by default extracts `const PI = 3.14` as PI having a type of the
    // literal `3.14`. We don't want this behavior for constants, since generally one wants the
    // _value_ of the constant to be able to change between releases without changing the type.
    // `VERSION` is a good example here; the version is always a `string`, but the actual value of
    // the version string shouldn't matter to the type system.
    const resolvedType = typeChecker.getBaseTypeOfLiteralType(typeChecker.getTypeAtLocation(declaration));
    // In the TS AST, the leading comment for a variable declaration is actually
    // on the ancestor `ts.VariableStatement` (since a single variable statement may
    // contain multiple variable declarations).
    const rawComment = extractRawJsDoc(declaration.parent.parent);
    const jsdocTags = extractJsDocTags(declaration);
    const description = extractJsDocDescription(declaration);
    const name = declaration.name.getText();
    // Some constants have to be treated as enums for documentation purposes.
    if (jsdocTags.some((tag) => tag.name === LITERAL_AS_ENUM_TAG)) {
        return {
            name,
            entryType: EntryType.Enum,
            members: extractLiteralPropertiesAsEnumMembers(declaration),
            rawComment,
            description,
            jsdocTags: jsdocTags.filter((tag) => tag.name !== LITERAL_AS_ENUM_TAG),
        };
    }
    return {
        name: name,
        type: typeChecker.typeToString(resolvedType),
        entryType: EntryType.Constant,
        rawComment,
        description,
        jsdocTags,
    };
}
/** Gets whether a given constant is an Angular-added const that should be ignored for docs. */
function isSyntheticAngularConstant(declaration) {
    return declaration.name.getText() === 'USED_FOR_NG_TYPE_CHECKING';
}
/**
 * Extracts the properties of a variable initialized as an object literal as if they were enum
 * members. Will throw for any variables that can't be statically analyzed easily.
 */
function extractLiteralPropertiesAsEnumMembers(declaration) {
    let initializer = declaration.initializer;
    // Unwrap `as` and parenthesized expressions.
    while (initializer &&
        (ts.isAsExpression(initializer) || ts.isParenthesizedExpression(initializer))) {
        initializer = initializer.expression;
    }
    if (initializer === undefined || !ts.isObjectLiteralExpression(initializer)) {
        throw new Error(`Declaration tagged with "${LITERAL_AS_ENUM_TAG}" must be initialized to an object literal, but received ${initializer ? ts.SyntaxKind[initializer.kind] : 'undefined'}`);
    }
    return initializer.properties.map((prop) => {
        if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) {
            throw new Error(`Property in declaration tagged with "${LITERAL_AS_ENUM_TAG}" must be a property assignment with a static name`);
        }
        if (!ts.isNumericLiteral(prop.initializer) && !ts.isStringLiteralLike(prop.initializer)) {
            throw new Error(`Property in declaration tagged with "${LITERAL_AS_ENUM_TAG}" must be initialized to a number or string literal`);
        }
        return {
            name: prop.name.text,
            type: `${declaration.name.getText()}.${prop.name.text}`,
            value: prop.initializer.getText(),
            memberType: MemberType.EnumItem,
            jsdocTags: extractJsDocTags(prop),
            description: extractJsDocDescription(prop),
            memberTags: [],
        };
    });
}

/** Extracts an API documentation entry for an Angular decorator. */
function extractorDecorator(declaration, typeChecker) {
    const documentedNode = getDecoratorJsDocNode(declaration);
    const decoratorType = getDecoratorType(declaration);
    if (!decoratorType) {
        throw new Error(`"${declaration.name.getText()} is not a decorator."`);
    }
    return {
        name: declaration.name.getText(),
        decoratorType: decoratorType,
        entryType: EntryType.Decorator,
        rawComment: extractRawJsDoc(documentedNode),
        description: extractJsDocDescription(documentedNode),
        jsdocTags: extractJsDocTags(documentedNode),
        members: getDecoratorOptions(declaration, typeChecker),
    };
}
/** Gets whether the given variable declaration is an Angular decorator declaration. */
function isDecoratorDeclaration(declaration) {
    return !!getDecoratorType(declaration);
}
/** Gets whether an interface is the options interface for a decorator in the same file. */
function isDecoratorOptionsInterface(declaration) {
    return declaration
        .getSourceFile()
        .statements.some((s) => ts.isVariableStatement(s) &&
        s.declarationList.declarations.some((d) => isDecoratorDeclaration(d) && d.name.getText() === declaration.name.getText()));
}
/** Gets the type of decorator, or undefined if the declaration is not a decorator. */
function getDecoratorType(declaration) {
    // All Angular decorators are initialized with one of `makeDecorator`, `makePropDecorator`,
    // or `makeParamDecorator`.
    const initializer = declaration.initializer?.getFullText() ?? '';
    if (initializer.includes('makeDecorator'))
        return DecoratorType.Class;
    if (initializer.includes('makePropDecorator'))
        return DecoratorType.Member;
    if (initializer.includes('makeParamDecorator'))
        return DecoratorType.Parameter;
    return undefined;
}
/** Gets the doc entry for the options object for an Angular decorator */
function getDecoratorOptions(declaration, typeChecker) {
    const name = declaration.name.getText();
    // Every decorator has an interface with its options in the same SourceFile.
    // Queries, however, are defined as a type alias pointing to an interface.
    const optionsDeclaration = declaration.getSourceFile().statements.find((node) => {
        return ((ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) &&
            node.name.getText() === name);
    });
    if (!optionsDeclaration) {
        throw new Error(`Decorator "${name}" has no corresponding options interface.`);
    }
    let optionsInterface;
    if (ts.isTypeAliasDeclaration(optionsDeclaration)) {
        // We hard-code the assumption that if the decorator's option type is a type alias,
        // it resolves to a single interface (this is true for all query decorators at time of
        // this writing).
        const aliasedType = typeChecker.getTypeAtLocation(optionsDeclaration.type);
        optionsInterface = (aliasedType.getSymbol()?.getDeclarations() ?? []).find((d) => ts.isInterfaceDeclaration(d));
    }
    else {
        optionsInterface = optionsDeclaration;
    }
    if (!optionsInterface || !ts.isInterfaceDeclaration(optionsInterface)) {
        throw new Error(`Options for decorator "${name}" is not an interface.`);
    }
    // Take advantage of the interface extractor to pull the appropriate member info.
    // Hard code the knowledge that decorator options only have properties, never methods.
    return extractInterface(optionsInterface, typeChecker).members;
}
/**
 * Gets the call signature node that has the decorator's public JsDoc block.
 *
 * Every decorator has three parts:
 * - A const that has the actual decorator.
 * - An interface with the same name as the const that documents the decorator's options.
 * - An interface suffixed with "Decorator" that has the decorator's call signature and JsDoc block.
 *
 * For the description and JsDoc tags, we need the interface suffixed with "Decorator".
 */
function getDecoratorJsDocNode(declaration) {
    const name = declaration.name.getText();
    // Assume the existence of an interface in the same file with the same name
    // suffixed with "Decorator".
    const decoratorInterface = declaration.getSourceFile().statements.find((s) => {
        return ts.isInterfaceDeclaration(s) && s.name.getText() === `${name}Decorator`;
    });
    if (!decoratorInterface || !ts.isInterfaceDeclaration(decoratorInterface)) {
        throw new Error(`No interface "${name}Decorator" found.`);
    }
    // The public-facing JsDoc for each decorator is on one of its interface's call signatures.
    const callSignature = decoratorInterface.members.find((node) => {
        // The description block lives on one of the call signatures for this interface.
        return ts.isCallSignatureDeclaration(node) && extractRawJsDoc(node);
    });
    if (!callSignature || !ts.isCallSignatureDeclaration(callSignature)) {
        throw new Error(`No call signature with JsDoc on "${name}Decorator"`);
    }
    return callSignature;
}

/** Extracts documentation entry for an enum. */
function extractEnum(declaration, typeChecker) {
    return {
        name: declaration.name.getText(),
        entryType: EntryType.Enum,
        members: extractEnumMembers(declaration, typeChecker),
        rawComment: extractRawJsDoc(declaration),
        description: extractJsDocDescription(declaration),
        jsdocTags: extractJsDocTags(declaration),
    };
}
/** Extracts doc info for an enum's members. */
function extractEnumMembers(declaration, checker) {
    return declaration.members.map((member) => ({
        name: member.name.getText(),
        type: extractResolvedTypeString(member, checker),
        value: getEnumMemberValue(member),
        memberType: MemberType.EnumItem,
        jsdocTags: extractJsDocTags(member),
        description: extractJsDocDescription(member),
        memberTags: [],
    }));
}
/** Gets the explicitly assigned value for an enum member, or an empty string if there is none. */
function getEnumMemberValue(memberNode) {
    // If the enum member has a child number literal or string literal,
    // we use that literal as the "value" of the member.
    const literal = memberNode.getChildren().find((n) => {
        return (ts.isNumericLiteral(n) ||
            ts.isStringLiteral(n) ||
            (ts.isPrefixUnaryExpression(n) &&
                n.operator === ts.SyntaxKind.MinusToken &&
                ts.isNumericLiteral(n.operand)));
    });
    return literal?.getText() ?? '';
}

/** JSDoc used to recognize an initializer API function. */
const initializerApiTag = 'initializerApiFunction';
/**
 * Checks whether the given node corresponds to an initializer API function.
 *
 * An initializer API function is a function declaration or variable declaration
 * that is explicitly annotated with `@initializerApiFunction`.
 *
 * Note: The node may be a function overload signature that is automatically
 * resolved to its implementation to detect the JSDoc tag.
 */
function isInitializerApiFunction(node, typeChecker) {
    // If this is matching an overload signature, resolve to the implementation
    // as it would hold the `@initializerApiFunction` tag.
    if (ts.isFunctionDeclaration(node) && node.name !== undefined && node.body === undefined) {
        const implementation = findImplementationOfFunction(node, typeChecker);
        if (implementation !== undefined) {
            node = implementation;
        }
    }
    if (!ts.isFunctionDeclaration(node) && !ts.isVariableDeclaration(node)) {
        return false;
    }
    let tagContainer = ts.isFunctionDeclaration(node) ? node : getContainerVariableStatement(node);
    if (tagContainer === null) {
        return false;
    }
    const tags = ts.getJSDocTags(tagContainer);
    return tags.some((t) => t.tagName.text === initializerApiTag);
}
/**
 * Extracts the given node as initializer API function and returns
 * a docs entry that can be rendered to represent the API function.
 */
function extractInitializerApiFunction(node, typeChecker) {
    if (node.name === undefined || !ts.isIdentifier(node.name)) {
        throw new Error(`Initializer API: Expected literal variable name.`);
    }
    const container = ts.isFunctionDeclaration(node) ? node : getContainerVariableStatement(node);
    if (container === null) {
        throw new Error('Initializer API: Could not find container AST node of variable.');
    }
    const name = node.name.text;
    const type = typeChecker.getTypeAtLocation(node);
    // Top-level call signatures. E.g. `input()`, `input<ReadT>(initialValue: ReadT)`. etc.
    const callFunction = extractFunctionWithOverloads(name, type, typeChecker);
    // Sub-functions like `input.required()`.
    const subFunctions = [];
    for (const property of type.getProperties()) {
        const subName = property.getName();
        const subDecl = property.getDeclarations()?.[0];
        if (subDecl === undefined || !ts.isPropertySignature(subDecl)) {
            throw new Error(`Initializer API: Could not resolve declaration of sub-property: ${name}.${subName}`);
        }
        const subType = typeChecker.getTypeAtLocation(subDecl);
        subFunctions.push(extractFunctionWithOverloads(subName, subType, typeChecker));
    }
    let jsdocTags;
    let description;
    let rawComment;
    // Extract container API documentation.
    // The container description describes the overall function, while
    // we allow the individual top-level call signatures to represent
    // their individual overloads.
    if (ts.isFunctionDeclaration(node)) {
        const implementation = findImplementationOfFunction(node, typeChecker);
        if (implementation === undefined) {
            throw new Error(`Initializer API: Could not find implementation of function: ${name}`);
        }
        callFunction.implementation = {
            name,
            entryType: EntryType.Function,
            isNewType: false,
            description: extractJsDocDescription(implementation),
            generics: extractGenerics(implementation),
            jsdocTags: extractJsDocTags(implementation),
            params: extractAllParams(implementation.parameters, typeChecker),
            rawComment: extractRawJsDoc(implementation),
            returnType: typeChecker.typeToString(typeChecker.getReturnTypeOfSignature(typeChecker.getSignatureFromDeclaration(implementation))),
        };
        jsdocTags = callFunction.implementation.jsdocTags;
        description = callFunction.implementation.description;
        rawComment = callFunction.implementation.description;
    }
    else {
        jsdocTags = extractJsDocTags(container);
        description = extractJsDocDescription(container);
        rawComment = extractRawJsDoc(container);
    }
    // Extract additional docs metadata from the initializer API JSDoc tag.
    const metadataTag = jsdocTags.find((t) => t.name === initializerApiTag);
    if (metadataTag === undefined) {
        throw new Error('Initializer API: Detected initializer API function does ' +
            `not have "@initializerApiFunction" tag: ${name}`);
    }
    let parsedMetadata = undefined;
    if (metadataTag.comment.trim() !== '') {
        try {
            parsedMetadata = JSON.parse(metadataTag.comment);
        }
        catch (e) {
            throw new Error(`Could not parse initializer API function metadata: ${e}`);
        }
    }
    return {
        entryType: EntryType.InitializerApiFunction,
        name,
        description,
        jsdocTags,
        rawComment,
        callFunction,
        subFunctions,
        __docsMetadata__: parsedMetadata,
    };
}
/**
 * Gets the container node of the given variable declaration.
 *
 * A variable declaration may be annotated with e.g. `@initializerApiFunction`,
 * but the JSDoc tag is not attached to the node, but to the containing variable
 * statement.
 */
function getContainerVariableStatement(node) {
    if (!ts.isVariableDeclarationList(node.parent)) {
        return null;
    }
    if (!ts.isVariableStatement(node.parent.parent)) {
        return null;
    }
    return node.parent.parent;
}
/**
 * Extracts all given signatures and returns them as a function with
 * overloads.
 *
 * The implementation of the function may be attached later, or may
 * be non-existent. E.g. initializer APIs declared using an interface
 * with call signatures do not have an associated implementation function
 * that is statically retrievable. The constant holds the overall API description.
 */
function extractFunctionWithOverloads(name, type, typeChecker) {
    return {
        name,
        signatures: extractCallSignatures(name, typeChecker, type),
        // Implementation may be populated later.
        implementation: null,
    };
}

/** Extract the documentation entry for a type alias. */
function extractTypeAlias(declaration) {
    // TODO: this does not yet resolve type queries (`typeof`). We may want to
    //     fix this eventually, but for now it does not appear that any type aliases in
    //     Angular's public API rely on this.
    return {
        name: declaration.name.getText(),
        type: declaration.type.getText(),
        entryType: EntryType.TypeAlias,
        generics: extractGenerics(declaration),
        rawComment: extractRawJsDoc(declaration),
        description: extractJsDocDescription(declaration),
        jsdocTags: extractJsDocTags(declaration),
    };
}

/**
 * For a given SourceFile, it extracts all imported symbols from other Angular packages.
 *
 * @returns a map Symbol => Package, eg: ApplicationRef => @angular/core
 */
function getImportedSymbols(sourceFile) {
    const importSpecifiers = new Map();
    function visit(node) {
        if (ts.isImportDeclaration(node)) {
            let moduleSpecifier = node.moduleSpecifier.getText(sourceFile).replace(/['"]/g, '');
            if (moduleSpecifier.startsWith('@angular/')) {
                const namedBindings = node.importClause?.namedBindings;
                if (namedBindings && ts.isNamedImports(namedBindings)) {
                    namedBindings.elements.forEach((importSpecifier) => {
                        const importName = importSpecifier.name.text;
                        const importAlias = importSpecifier.propertyName
                            ? importSpecifier.propertyName.text
                            : undefined;
                        importSpecifiers.set(importAlias ?? importName, moduleSpecifier);
                    });
                }
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    return importSpecifiers;
}

/**
 * Extracts all information from a source file that may be relevant for generating
 * public API documentation.
 */
class DocsExtractor {
    typeChecker;
    metadataReader;
    constructor(typeChecker, metadataReader) {
        this.typeChecker = typeChecker;
        this.metadataReader = metadataReader;
    }
    /**
     * Gets the set of all documentable entries from a source file, including
     * declarations that are re-exported from this file as an entry-point.
     *
     * @param sourceFile The file from which to extract documentable entries.
     */
    extractAll(sourceFile, rootDir, privateModules) {
        const entries = [];
        const symbols = new Map();
        const exportedDeclarations = this.getExportedDeclarations(sourceFile);
        for (const [exportName, node] of exportedDeclarations) {
            // Skip any symbols with an Angular-internal name.
            if (isAngularPrivateName(exportName)) {
                continue;
            }
            const entry = this.extractDeclaration(node);
            if (entry && !isIgnoredDocEntry(entry)) {
                // The source file parameter is the package entry: the index.ts
                // We want the real source file of the declaration.
                const realSourceFile = node.getSourceFile();
                /**
                 * The `sourceFile` from `extractAll` is the main entry-point file of a package.
                 * Usually following a format like `export * from './public_api';`, simply re-exporting.
                 * It is necessary to pick-up every import from the actual source files
                 * where declarations are living, so that we can determine what symbols
                 * are actually referenced in the context of that particular declaration
                 * By doing this, the generation remains independent from other packages
                 */
                const importedSymbols = getImportedSymbols(realSourceFile);
                importedSymbols.forEach((moduleName, symbolName) => {
                    if (symbolName.startsWith('ɵ') || privateModules.has(moduleName)) {
                        return;
                    }
                    if (symbols.has(symbolName) && symbols.get(symbolName) !== moduleName) {
                        // If this ever throws, we need to improve the symbol extraction strategy
                        throw new Error(`Ambigous symbol \`${symbolName}\` exported by both ${symbols.get(symbolName)} & ${moduleName}`);
                    }
                    symbols.set(symbolName, moduleName);
                });
                // Set the source code references for the extracted entry.
                entry.source = {
                    filePath: getRelativeFilePath(realSourceFile, rootDir),
                    // Start & End are off by 1
                    startLine: ts.getLineAndCharacterOfPosition(realSourceFile, node.getStart()).line + 1,
                    endLine: ts.getLineAndCharacterOfPosition(realSourceFile, node.getEnd()).line + 1,
                };
                // The exported name of an API may be different from its declaration name, so
                // use the declaration name.
                entries.push({ ...entry, name: exportName });
            }
        }
        return { entries, symbols };
    }
    /** Extract the doc entry for a single declaration. */
    extractDeclaration(node) {
        // Ignore anonymous classes.
        if (checker.isNamedClassDeclaration(node)) {
            return extractClass(node, this.metadataReader, this.typeChecker);
        }
        if (isInitializerApiFunction(node, this.typeChecker)) {
            return extractInitializerApiFunction(node, this.typeChecker);
        }
        if (ts.isInterfaceDeclaration(node) && !isIgnoredInterface(node)) {
            return extractInterface(node, this.typeChecker);
        }
        if (ts.isFunctionDeclaration(node)) {
            // Name is guaranteed to be set, because it's exported directly.
            const functionExtractor = new FunctionExtractor(node.name.getText(), node, this.typeChecker);
            return functionExtractor.extract();
        }
        if (ts.isVariableDeclaration(node) && !isSyntheticAngularConstant(node)) {
            return isDecoratorDeclaration(node)
                ? extractorDecorator(node, this.typeChecker)
                : extractConstant(node, this.typeChecker);
        }
        if (ts.isTypeAliasDeclaration(node)) {
            return extractTypeAlias(node);
        }
        if (ts.isEnumDeclaration(node)) {
            return extractEnum(node, this.typeChecker);
        }
        return null;
    }
    /** Gets the list of exported declarations for doc extraction. */
    getExportedDeclarations(sourceFile) {
        // Use the reflection host to get all the exported declarations from this
        // source file entry point.
        const reflector = new checker.TypeScriptReflectionHost(this.typeChecker, false, true);
        const exportedDeclarationMap = reflector.getExportsOfModule(sourceFile);
        // Augment each declaration with the exported name in the public API.
        let exportedDeclarations = Array.from(exportedDeclarationMap?.entries() ?? []).map(([exportName, declaration]) => [exportName, declaration.node]);
        // Sort the declaration nodes into declaration position because their order is lost in
        // reading from the export map. This is primarily useful for testing and debugging.
        return exportedDeclarations.sort(([a, declarationA], [b, declarationB]) => declarationA.pos - declarationB.pos);
    }
}
/** Gets whether an interface should be ignored for docs extraction. */
function isIgnoredInterface(node) {
    // We filter out all interfaces that end with "Decorator" because we capture their
    // types as part of the main decorator entry (which are declared as constants).
    // This approach to dealing with decorators is admittedly fuzzy, but this aspect of
    // the framework's source code is unlikely to change. We also filter out the interfaces
    // that contain the decorator options.
    return node.name.getText().endsWith('Decorator') || isDecoratorOptionsInterface(node);
}
/**
 * Whether the doc entry should be ignored.
 *
 * Note: We cannot check whether a node is marked as docs private
 * before extraction because the extractor may find the attached
 * JSDoc tags on different AST nodes. For example, a variable declaration
 * never has JSDoc tags attached, but rather the parent variable statement.
 */
function isIgnoredDocEntry(entry) {
    const isDocsPrivate = entry.jsdocTags.find((e) => e.name === 'docsPrivate');
    if (isDocsPrivate !== undefined && isDocsPrivate.comment === '') {
        throw new Error(`Docs extraction: Entry "${entry.name}" is marked as ` +
            `"@docsPrivate" but without reasoning.`);
    }
    return isDocsPrivate !== undefined;
}
function getRelativeFilePath(sourceFile, rootDir) {
    const fullPath = sourceFile.fileName;
    const relativePath = fullPath.replace(rootDir, '');
    return relativePath;
}

/// <reference types="node" />
class FlatIndexGenerator {
    entryPoint;
    moduleName;
    flatIndexPath;
    shouldEmit = true;
    constructor(entryPoint, relativeFlatIndexPath, moduleName) {
        this.entryPoint = entryPoint;
        this.moduleName = moduleName;
        this.flatIndexPath =
            checker.join(checker.dirname(entryPoint), relativeFlatIndexPath).replace(/\.js$/, '') + '.ts';
    }
    makeTopLevelShim() {
        const relativeEntryPoint = relativePathBetween(this.flatIndexPath, this.entryPoint);
        const contents = `/**
 * Generated bundle index. Do not edit.
 */

export * from '${relativeEntryPoint}';
`;
        const genFile = ts.createSourceFile(this.flatIndexPath, contents, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS);
        if (this.moduleName !== null) {
            genFile.moduleName = this.moduleName;
        }
        return genFile;
    }
}

function findFlatIndexEntryPoint(rootFiles) {
    // There are two ways for a file to be recognized as the flat module index:
    // 1) if it's the only file!!!!!!
    // 2) (deprecated) if it's named 'index.ts' and has the shortest path of all such files.
    const tsFiles = rootFiles.filter((file) => checker.isNonDeclarationTsPath(file));
    let resolvedEntryPoint = null;
    if (tsFiles.length === 1) {
        // There's only one file - this is the flat module index.
        resolvedEntryPoint = tsFiles[0];
    }
    else {
        // In the event there's more than one TS file, one of them can still be selected as the
        // flat module index if it's named 'index.ts'. If there's more than one 'index.ts', the one
        // with the shortest path wins.
        //
        // This behavior is DEPRECATED and only exists to support existing usages.
        for (const tsFile of tsFiles) {
            if (checker.getFileSystem().basename(tsFile) === 'index.ts' &&
                (resolvedEntryPoint === null || tsFile.length <= resolvedEntryPoint.length)) {
                resolvedEntryPoint = tsFile;
            }
        }
    }
    return resolvedEntryPoint;
}

/**
 * Produce `ts.Diagnostic`s for classes that are visible from exported types (e.g. directives
 * exposed by exported `NgModule`s) that are not themselves exported.
 *
 * This function reconciles two concepts:
 *
 * A class is Exported if it's exported from the main library `entryPoint` file.
 * A class is Visible if, via Angular semantics, a downstream consumer can import an Exported class
 * and be affected by the class in question. For example, an Exported NgModule may expose a
 * directive class to its consumers. Consumers that import the NgModule may have the directive
 * applied to elements in their templates. In this case, the directive is considered Visible.
 *
 * `checkForPrivateExports` attempts to verify that all Visible classes are Exported, and report
 * `ts.Diagnostic`s for those that aren't.
 *
 * @param entryPoint `ts.SourceFile` of the library's entrypoint, which should export the library's
 * public API.
 * @param checker `ts.TypeChecker` for the current program.
 * @param refGraph `ReferenceGraph` tracking the visibility of Angular types.
 * @returns an array of `ts.Diagnostic`s representing errors when visible classes are not exported
 * properly.
 */
function checkForPrivateExports(entryPoint, checker$1, refGraph) {
    const diagnostics = [];
    // Firstly, compute the exports of the entry point. These are all the Exported classes.
    const topLevelExports = new Set();
    // Do this via `ts.TypeChecker.getExportsOfModule`.
    const moduleSymbol = checker$1.getSymbolAtLocation(entryPoint);
    if (moduleSymbol === undefined) {
        throw new Error(`Internal error: failed to get symbol for entrypoint`);
    }
    const exportedSymbols = checker$1.getExportsOfModule(moduleSymbol);
    // Loop through the exported symbols, de-alias if needed, and add them to `topLevelExports`.
    // TODO(alxhub): use proper iteration when build.sh is removed. (#27762)
    exportedSymbols.forEach((symbol) => {
        if (symbol.flags & ts.SymbolFlags.Alias) {
            symbol = checker$1.getAliasedSymbol(symbol);
        }
        const decl = symbol.valueDeclaration;
        if (decl !== undefined) {
            topLevelExports.add(decl);
        }
    });
    // Next, go through each exported class and expand it to the set of classes it makes Visible,
    // using the `ReferenceGraph`. For each Visible class, verify that it's also Exported, and queue
    // an error if it isn't. `checkedSet` ensures only one error is queued per class.
    const checkedSet = new Set();
    // Loop through each Exported class.
    // TODO(alxhub): use proper iteration when the legacy build is removed. (#27762)
    topLevelExports.forEach((mainExport) => {
        // Loop through each class made Visible by the Exported class.
        refGraph.transitiveReferencesOf(mainExport).forEach((transitiveReference) => {
            // Skip classes which have already been checked.
            if (checkedSet.has(transitiveReference)) {
                return;
            }
            checkedSet.add(transitiveReference);
            // Verify that the Visible class is also Exported.
            if (!topLevelExports.has(transitiveReference)) {
                // This is an error, `mainExport` makes `transitiveReference` Visible, but
                // `transitiveReference` is not Exported from the entrypoint. Construct a diagnostic to
                // give to the user explaining the situation.
                const descriptor = getDescriptorOfDeclaration(transitiveReference);
                const name = getNameOfDeclaration(transitiveReference);
                // Construct the path of visibility, from `mainExport` to `transitiveReference`.
                let visibleVia = 'NgModule exports';
                const transitivePath = refGraph.pathFrom(mainExport, transitiveReference);
                if (transitivePath !== null) {
                    visibleVia = transitivePath.map((seg) => getNameOfDeclaration(seg)).join(' -> ');
                }
                const diagnostic = {
                    category: ts.DiagnosticCategory.Error,
                    code: checker.ngErrorCode(checker.ErrorCode.SYMBOL_NOT_EXPORTED),
                    file: transitiveReference.getSourceFile(),
                    ...getPosOfDeclaration(transitiveReference),
                    messageText: `Unsupported private ${descriptor} ${name}. This ${descriptor} is visible to consumers via ${visibleVia}, but is not exported from the top-level library entrypoint.`,
                };
                diagnostics.push(diagnostic);
            }
        });
    });
    return diagnostics;
}
function getPosOfDeclaration(decl) {
    const node = getIdentifierOfDeclaration(decl) || decl;
    return {
        start: node.getStart(),
        length: node.getEnd() + 1 - node.getStart(),
    };
}
function getIdentifierOfDeclaration(decl) {
    if ((ts.isClassDeclaration(decl) ||
        ts.isVariableDeclaration(decl) ||
        ts.isFunctionDeclaration(decl)) &&
        decl.name !== undefined &&
        ts.isIdentifier(decl.name)) {
        return decl.name;
    }
    else {
        return null;
    }
}
function getNameOfDeclaration(decl) {
    const id = getIdentifierOfDeclaration(decl);
    return id !== null ? id.text : '(unnamed)';
}
function getDescriptorOfDeclaration(decl) {
    switch (decl.kind) {
        case ts.SyntaxKind.ClassDeclaration:
            return 'class';
        case ts.SyntaxKind.FunctionDeclaration:
            return 'function';
        case ts.SyntaxKind.VariableDeclaration:
            return 'variable';
        case ts.SyntaxKind.EnumDeclaration:
            return 'enum';
        default:
            return 'declaration';
    }
}

class ReferenceGraph {
    references = new Map();
    add(from, to) {
        if (!this.references.has(from)) {
            this.references.set(from, new Set());
        }
        this.references.get(from).add(to);
    }
    transitiveReferencesOf(target) {
        const set = new Set();
        this.collectTransitiveReferences(set, target);
        return set;
    }
    pathFrom(source, target) {
        return this.collectPathFrom(source, target, new Set());
    }
    collectPathFrom(source, target, seen) {
        if (source === target) {
            // Looking for a path from the target to itself - that path is just the target. This is the
            // "base case" of the search.
            return [target];
        }
        else if (seen.has(source)) {
            // The search has already looked through this source before.
            return null;
        }
        // Consider outgoing edges from `source`.
        seen.add(source);
        if (!this.references.has(source)) {
            // There are no outgoing edges from `source`.
            return null;
        }
        else {
            // Look through the outgoing edges of `source`.
            // TODO(alxhub): use proper iteration when the legacy build is removed. (#27762)
            let candidatePath = null;
            this.references.get(source).forEach((edge) => {
                // Early exit if a path has already been found.
                if (candidatePath !== null) {
                    return;
                }
                // Look for a path from this outgoing edge to `target`.
                const partialPath = this.collectPathFrom(edge, target, seen);
                if (partialPath !== null) {
                    // A path exists from `edge` to `target`. Insert `source` at the beginning.
                    candidatePath = [source, ...partialPath];
                }
            });
            return candidatePath;
        }
    }
    collectTransitiveReferences(set, decl) {
        if (this.references.has(decl)) {
            // TODO(alxhub): use proper iteration when the legacy build is removed. (#27762)
            this.references.get(decl).forEach((ref) => {
                if (!set.has(ref)) {
                    set.add(ref);
                    this.collectTransitiveReferences(set, ref);
                }
            });
        }
    }
}

/**
 * An implementation of the `DependencyTracker` dependency graph API.
 *
 * The `FileDependencyGraph`'s primary job is to determine whether a given file has "logically"
 * changed, given the set of physical changes (direct changes to files on disk).
 *
 * A file is logically changed if at least one of three conditions is met:
 *
 * 1. The file itself has physically changed.
 * 2. One of its dependencies has physically changed.
 * 3. One of its resource dependencies has physically changed.
 */
class FileDependencyGraph {
    nodes = new Map();
    addDependency(from, on) {
        this.nodeFor(from).dependsOn.add(checker.absoluteFromSourceFile(on));
    }
    addResourceDependency(from, resource) {
        this.nodeFor(from).usesResources.add(resource);
    }
    recordDependencyAnalysisFailure(file) {
        this.nodeFor(file).failedAnalysis = true;
    }
    getResourceDependencies(from) {
        const node = this.nodes.get(from);
        return node ? [...node.usesResources] : [];
    }
    /**
     * Update the current dependency graph from a previous one, incorporating a set of physical
     * changes.
     *
     * This method performs two tasks:
     *
     * 1. For files which have not logically changed, their dependencies from `previous` are added to
     *    `this` graph.
     * 2. For files which have logically changed, they're added to a set of logically changed files
     *    which is eventually returned.
     *
     * In essence, for build `n`, this method performs:
     *
     * G(n) + L(n) = G(n - 1) + P(n)
     *
     * where:
     *
     * G(n) = the dependency graph of build `n`
     * L(n) = the logically changed files from build n - 1 to build n.
     * P(n) = the physically changed files from build n - 1 to build n.
     */
    updateWithPhysicalChanges(previous, changedTsPaths, deletedTsPaths, changedResources) {
        const logicallyChanged = new Set();
        for (const sf of previous.nodes.keys()) {
            const sfPath = checker.absoluteFromSourceFile(sf);
            const node = previous.nodeFor(sf);
            if (isLogicallyChanged(sf, node, changedTsPaths, deletedTsPaths, changedResources)) {
                logicallyChanged.add(sfPath);
            }
            else if (!deletedTsPaths.has(sfPath)) {
                this.nodes.set(sf, {
                    dependsOn: new Set(node.dependsOn),
                    usesResources: new Set(node.usesResources),
                    failedAnalysis: false,
                });
            }
        }
        return logicallyChanged;
    }
    nodeFor(sf) {
        if (!this.nodes.has(sf)) {
            this.nodes.set(sf, {
                dependsOn: new Set(),
                usesResources: new Set(),
                failedAnalysis: false,
            });
        }
        return this.nodes.get(sf);
    }
}
/**
 * Determine whether `sf` has logically changed, given its dependencies and the set of physically
 * changed files and resources.
 */
function isLogicallyChanged(sf, node, changedTsPaths, deletedTsPaths, changedResources) {
    // A file is assumed to have logically changed if its dependencies could not be determined
    // accurately.
    if (node.failedAnalysis) {
        return true;
    }
    const sfPath = checker.absoluteFromSourceFile(sf);
    // A file is logically changed if it has physically changed itself (including being deleted).
    if (changedTsPaths.has(sfPath) || deletedTsPaths.has(sfPath)) {
        return true;
    }
    // A file is logically changed if one of its dependencies has physically changed.
    for (const dep of node.dependsOn) {
        if (changedTsPaths.has(dep) || deletedTsPaths.has(dep)) {
            return true;
        }
    }
    // A file is logically changed if one of its resources has physically changed.
    for (const dep of node.usesResources) {
        if (changedResources.has(dep)) {
            return true;
        }
    }
    return false;
}

/**
 * Discriminant of the `IncrementalState` union.
 */
var IncrementalStateKind;
(function (IncrementalStateKind) {
    IncrementalStateKind[IncrementalStateKind["Fresh"] = 0] = "Fresh";
    IncrementalStateKind[IncrementalStateKind["Delta"] = 1] = "Delta";
    IncrementalStateKind[IncrementalStateKind["Analyzed"] = 2] = "Analyzed";
})(IncrementalStateKind || (IncrementalStateKind = {}));

/**
 * Discriminant of the `Phase` type union.
 */
var PhaseKind;
(function (PhaseKind) {
    PhaseKind[PhaseKind["Analysis"] = 0] = "Analysis";
    PhaseKind[PhaseKind["TypeCheckAndEmit"] = 1] = "TypeCheckAndEmit";
})(PhaseKind || (PhaseKind = {}));
/**
 * Manages the incremental portion of an Angular compilation, allowing for reuse of a prior
 * compilation if available, and producing an output state for reuse of the current compilation in a
 * future one.
 */
class IncrementalCompilation {
    depGraph;
    versions;
    step;
    phase;
    /**
     * `IncrementalState` of this compilation if it were to be reused in a subsequent incremental
     * compilation at the current moment.
     *
     * Exposed via the `state` read-only getter.
     */
    _state;
    constructor(state, depGraph, versions, step) {
        this.depGraph = depGraph;
        this.versions = versions;
        this.step = step;
        this._state = state;
        // The compilation begins in analysis phase.
        this.phase = {
            kind: PhaseKind.Analysis,
            semanticDepGraphUpdater: new SemanticDepGraphUpdater(step !== null ? step.priorState.semanticDepGraph : null),
        };
    }
    /**
     * Begin a fresh `IncrementalCompilation`.
     */
    static fresh(program, versions) {
        const state = {
            kind: IncrementalStateKind.Fresh,
        };
        return new IncrementalCompilation(state, new FileDependencyGraph(), versions, /* reuse */ null);
    }
    static incremental(program, newVersions, oldProgram, oldState, modifiedResourceFiles, perf) {
        return perf.inPhase(checker.PerfPhase.Reconciliation, () => {
            const physicallyChangedTsFiles = new Set();
            const changedResourceFiles = new Set(modifiedResourceFiles ?? []);
            let priorAnalysis;
            switch (oldState.kind) {
                case IncrementalStateKind.Fresh:
                    // Since this line of program has never been successfully analyzed to begin with, treat
                    // this as a fresh compilation.
                    return IncrementalCompilation.fresh(program, newVersions);
                case IncrementalStateKind.Analyzed:
                    // The most recent program was analyzed successfully, so we can use that as our prior
                    // state and don't need to consider any other deltas except changes in the most recent
                    // program.
                    priorAnalysis = oldState;
                    break;
                case IncrementalStateKind.Delta:
                    // There is an ancestor program which was analyzed successfully and can be used as a
                    // starting point, but we need to determine what's changed since that program.
                    priorAnalysis = oldState.lastAnalyzedState;
                    for (const sfPath of oldState.physicallyChangedTsFiles) {
                        physicallyChangedTsFiles.add(sfPath);
                    }
                    for (const resourcePath of oldState.changedResourceFiles) {
                        changedResourceFiles.add(resourcePath);
                    }
                    break;
            }
            const oldVersions = priorAnalysis.versions;
            const oldFilesArray = oldProgram.getSourceFiles().map(toOriginalSourceFile);
            const oldFiles = new Set(oldFilesArray);
            const deletedTsFiles = new Set(oldFilesArray.map((sf) => checker.absoluteFromSourceFile(sf)));
            for (const possiblyRedirectedNewFile of program.getSourceFiles()) {
                const sf = toOriginalSourceFile(possiblyRedirectedNewFile);
                const sfPath = checker.absoluteFromSourceFile(sf);
                // Since we're seeing a file in the incoming program with this name, it can't have been
                // deleted.
                deletedTsFiles.delete(sfPath);
                if (oldFiles.has(sf)) {
                    // This source file has the same object identity as in the previous program. We need to
                    // determine if it's really the same file, or if it might have changed versions since the
                    // last program without changing its identity.
                    // If there's no version information available, then this is the same file, and we can
                    // skip it.
                    if (oldVersions === null || newVersions === null) {
                        continue;
                    }
                    // If a version is available for the file from both the prior and the current program, and
                    // that version is the same, then this is the same file, and we can skip it.
                    if (oldVersions.has(sfPath) &&
                        newVersions.has(sfPath) &&
                        oldVersions.get(sfPath) === newVersions.get(sfPath)) {
                        continue;
                    }
                    // Otherwise, assume that the file has changed. Either its versions didn't match, or we
                    // were missing version information about it on one side for some reason.
                }
                // Bail out if a .d.ts file changes - the semantic dep graph is not able to process such
                // changes correctly yet.
                if (sf.isDeclarationFile) {
                    return IncrementalCompilation.fresh(program, newVersions);
                }
                // The file has changed physically, so record it.
                physicallyChangedTsFiles.add(sfPath);
            }
            // Remove any files that have been deleted from the list of physical changes.
            for (const deletedFileName of deletedTsFiles) {
                physicallyChangedTsFiles.delete(checker.resolve(deletedFileName));
            }
            // Use the prior dependency graph to project physical changes into a set of logically changed
            // files.
            const depGraph = new FileDependencyGraph();
            const logicallyChangedTsFiles = depGraph.updateWithPhysicalChanges(priorAnalysis.depGraph, physicallyChangedTsFiles, deletedTsFiles, changedResourceFiles);
            // Physically changed files aren't necessarily counted as logically changed by the dependency
            // graph (files do not have edges to themselves), so add them to the logical changes
            // explicitly.
            for (const sfPath of physicallyChangedTsFiles) {
                logicallyChangedTsFiles.add(sfPath);
            }
            // Start off in a `DeltaIncrementalState` as a delta against the previous successful analysis,
            // until this compilation completes its own analysis.
            const state = {
                kind: IncrementalStateKind.Delta,
                physicallyChangedTsFiles,
                changedResourceFiles,
                lastAnalyzedState: priorAnalysis,
            };
            return new IncrementalCompilation(state, depGraph, newVersions, {
                priorState: priorAnalysis,
                logicallyChangedTsFiles,
            });
        });
    }
    get state() {
        return this._state;
    }
    get semanticDepGraphUpdater() {
        if (this.phase.kind !== PhaseKind.Analysis) {
            throw new Error(`AssertionError: Cannot update the SemanticDepGraph after analysis completes`);
        }
        return this.phase.semanticDepGraphUpdater;
    }
    recordSuccessfulAnalysis(traitCompiler) {
        if (this.phase.kind !== PhaseKind.Analysis) {
            throw new Error(`AssertionError: Incremental compilation in phase ${PhaseKind[this.phase.kind]}, expected Analysis`);
        }
        const { needsEmit, needsTypeCheckEmit, newGraph } = this.phase.semanticDepGraphUpdater.finalize();
        // Determine the set of files which have already been emitted.
        let emitted;
        if (this.step === null) {
            // Since there is no prior compilation, no files have yet been emitted.
            emitted = new Set();
        }
        else {
            // Begin with the files emitted by the prior successful compilation, but remove those which we
            // know need to bee re-emitted.
            emitted = new Set(this.step.priorState.emitted);
            // Files need re-emitted if they've logically changed.
            for (const sfPath of this.step.logicallyChangedTsFiles) {
                emitted.delete(sfPath);
            }
            // Files need re-emitted if they've semantically changed.
            for (const sfPath of needsEmit) {
                emitted.delete(sfPath);
            }
        }
        // Transition to a successfully analyzed compilation. At this point, a subsequent compilation
        // could use this state as a starting point.
        this._state = {
            kind: IncrementalStateKind.Analyzed,
            versions: this.versions,
            depGraph: this.depGraph,
            semanticDepGraph: newGraph,
            priorAnalysis: traitCompiler.getAnalyzedRecords(),
            typeCheckResults: null,
            emitted,
        };
        // We now enter the type-check and emit phase of compilation.
        this.phase = {
            kind: PhaseKind.TypeCheckAndEmit,
            needsEmit,
            needsTypeCheckEmit,
        };
    }
    recordSuccessfulTypeCheck(results) {
        if (this._state.kind !== IncrementalStateKind.Analyzed) {
            throw new Error(`AssertionError: Expected successfully analyzed compilation.`);
        }
        else if (this.phase.kind !== PhaseKind.TypeCheckAndEmit) {
            throw new Error(`AssertionError: Incremental compilation in phase ${PhaseKind[this.phase.kind]}, expected TypeCheck`);
        }
        this._state.typeCheckResults = results;
    }
    recordSuccessfulEmit(sf) {
        if (this._state.kind !== IncrementalStateKind.Analyzed) {
            throw new Error(`AssertionError: Expected successfully analyzed compilation.`);
        }
        this._state.emitted.add(checker.absoluteFromSourceFile(sf));
    }
    priorAnalysisFor(sf) {
        if (this.step === null) {
            return null;
        }
        const sfPath = checker.absoluteFromSourceFile(sf);
        // If the file has logically changed, its previous analysis cannot be reused.
        if (this.step.logicallyChangedTsFiles.has(sfPath)) {
            return null;
        }
        const priorAnalysis = this.step.priorState.priorAnalysis;
        if (!priorAnalysis.has(sf)) {
            return null;
        }
        return priorAnalysis.get(sf);
    }
    priorTypeCheckingResultsFor(sf) {
        if (this.phase.kind !== PhaseKind.TypeCheckAndEmit) {
            throw new Error(`AssertionError: Expected successfully analyzed compilation.`);
        }
        if (this.step === null) {
            return null;
        }
        const sfPath = checker.absoluteFromSourceFile(sf);
        // If the file has logically changed, or its template type-checking results have semantically
        // changed, then past type-checking results cannot be reused.
        if (this.step.logicallyChangedTsFiles.has(sfPath) ||
            this.phase.needsTypeCheckEmit.has(sfPath)) {
            return null;
        }
        // Past results also cannot be reused if they're not available.
        if (this.step.priorState.typeCheckResults === null ||
            !this.step.priorState.typeCheckResults.has(sfPath)) {
            return null;
        }
        const priorResults = this.step.priorState.typeCheckResults.get(sfPath);
        // If the past results relied on inlining, they're not safe for reuse.
        if (priorResults.hasInlines) {
            return null;
        }
        return priorResults;
    }
    safeToSkipEmit(sf) {
        // If this is a fresh compilation, it's never safe to skip an emit.
        if (this.step === null) {
            return false;
        }
        const sfPath = checker.absoluteFromSourceFile(sf);
        // If the file has itself logically changed, it must be emitted.
        if (this.step.logicallyChangedTsFiles.has(sfPath)) {
            return false;
        }
        if (this.phase.kind !== PhaseKind.TypeCheckAndEmit) {
            throw new Error(`AssertionError: Expected successful analysis before attempting to emit files`);
        }
        // If during analysis it was determined that this file has semantically changed, it must be
        // emitted.
        if (this.phase.needsEmit.has(sfPath)) {
            return false;
        }
        // Generally it should be safe to assume here that the file was previously emitted by the last
        // successful compilation. However, as a defense-in-depth against incorrectness, we explicitly
        // check that the last emit included this file, and re-emit it otherwise.
        return this.step.priorState.emitted.has(sfPath);
    }
}
/**
 * To accurately detect whether a source file was affected during an incremental rebuild, the
 * "original" source file needs to be consistently used.
 *
 * First, TypeScript may have created source file redirects when declaration files of the same
 * version of a library are included multiple times. The non-redirected source file should be used
 * to detect changes, as otherwise the redirected source files cause a mismatch when compared to
 * a prior program.
 *
 * Second, the program that is used for template type checking may contain mutated source files, if
 * inline type constructors or inline template type-check blocks had to be used. Such source files
 * store their original, non-mutated source file from the original program in a symbol. For
 * computing the affected files in an incremental build this original source file should be used, as
 * the mutated source file would always be considered affected.
 */
function toOriginalSourceFile(sf) {
    const unredirectedSf = checker.toUnredirectedSourceFile(sf);
    const originalFile = unredirectedSf[checker.NgOriginalFile];
    if (originalFile !== undefined) {
        return originalFile;
    }
    else {
        return unredirectedSf;
    }
}

/**
 * A noop implementation of `IncrementalBuildStrategy` which neither returns nor tracks any
 * incremental data.
 */
/**
 * Tracks an `IncrementalState` within the strategy itself.
 */
class TrackedIncrementalBuildStrategy {
    state = null;
    isSet = false;
    getIncrementalState() {
        return this.state;
    }
    setIncrementalState(state) {
        this.state = state;
        this.isSet = true;
    }
    toNextBuildStrategy() {
        const strategy = new TrackedIncrementalBuildStrategy();
        // Only reuse state that was explicitly set via `setIncrementalState`.
        strategy.state = this.isSet ? this.state : null;
        return strategy;
    }
}

/**
 * Describes the kind of identifier found in a template.
 */
var IdentifierKind;
(function (IdentifierKind) {
    IdentifierKind[IdentifierKind["Property"] = 0] = "Property";
    IdentifierKind[IdentifierKind["Method"] = 1] = "Method";
    IdentifierKind[IdentifierKind["Element"] = 2] = "Element";
    IdentifierKind[IdentifierKind["Template"] = 3] = "Template";
    IdentifierKind[IdentifierKind["Attribute"] = 4] = "Attribute";
    IdentifierKind[IdentifierKind["Reference"] = 5] = "Reference";
    IdentifierKind[IdentifierKind["Variable"] = 6] = "Variable";
    IdentifierKind[IdentifierKind["LetDeclaration"] = 7] = "LetDeclaration";
})(IdentifierKind || (IdentifierKind = {}));
/**
 * Describes the absolute byte offsets of a text anchor in a source code.
 */
class AbsoluteSourceSpan {
    start;
    end;
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
}

/**
 * A context for storing indexing information about components of a program.
 *
 * An `IndexingContext` collects component and template analysis information from
 * `DecoratorHandler`s and exposes them to be indexed.
 */
class IndexingContext {
    components = new Set();
    /**
     * Adds a component to the context.
     */
    addComponent(info) {
        this.components.add(info);
    }
}

/**
 * Visits the AST of an Angular template syntax expression, finding interesting
 * entities (variable references, etc.). Creates an array of Entities found in
 * the expression, with the location of the Entities being relative to the
 * expression.
 *
 * Visiting `text {{prop}}` will return
 * `[TopLevelIdentifier {name: 'prop', span: {start: 7, end: 11}}]`.
 */
class ExpressionVisitor extends compiler.RecursiveAstVisitor {
    expressionStr;
    absoluteOffset;
    boundTemplate;
    targetToIdentifier;
    identifiers = [];
    errors = [];
    constructor(expressionStr, absoluteOffset, boundTemplate, targetToIdentifier) {
        super();
        this.expressionStr = expressionStr;
        this.absoluteOffset = absoluteOffset;
        this.boundTemplate = boundTemplate;
        this.targetToIdentifier = targetToIdentifier;
    }
    /**
     * Returns identifiers discovered in an expression.
     *
     * @param ast expression AST to visit
     * @param source expression AST source code
     * @param absoluteOffset absolute byte offset from start of the file to the start of the AST
     * source code.
     * @param boundTemplate bound target of the entire template, which can be used to query for the
     * entities expressions target.
     * @param targetToIdentifier closure converting a template target node to its identifier.
     */
    static getIdentifiers(ast, source, absoluteOffset, boundTemplate, targetToIdentifier) {
        const visitor = new ExpressionVisitor(source, absoluteOffset, boundTemplate, targetToIdentifier);
        visitor.visit(ast);
        return { identifiers: visitor.identifiers, errors: visitor.errors };
    }
    visit(ast) {
        ast.visit(this);
    }
    visitPropertyRead(ast, context) {
        this.visitIdentifier(ast, IdentifierKind.Property);
        super.visitPropertyRead(ast, context);
    }
    visitPropertyWrite(ast, context) {
        this.visitIdentifier(ast, IdentifierKind.Property);
        super.visitPropertyWrite(ast, context);
    }
    /**
     * Visits an identifier, adding it to the identifier store if it is useful for indexing.
     *
     * @param ast expression AST the identifier is in
     * @param kind identifier kind
     */
    visitIdentifier(ast, kind) {
        // The definition of a non-top-level property such as `bar` in `{{foo.bar}}` is currently
        // impossible to determine by an indexer and unsupported by the indexing module.
        // The indexing module also does not currently support references to identifiers declared in the
        // template itself, which have a non-null expression target.
        if (!(ast.receiver instanceof compiler.ImplicitReceiver)) {
            return;
        }
        // The source span of the requested AST starts at a location that is offset from the expression.
        let identifierStart = ast.sourceSpan.start - this.absoluteOffset;
        if (ast instanceof compiler.PropertyRead || ast instanceof compiler.PropertyWrite) {
            // For `PropertyRead` and `PropertyWrite`, the identifier starts at the `nameSpan`, not
            // necessarily the `sourceSpan`.
            identifierStart = ast.nameSpan.start - this.absoluteOffset;
        }
        if (!this.expressionStr.substring(identifierStart).startsWith(ast.name)) {
            this.errors.push(new Error(`Impossible state: "${ast.name}" not found in "${this.expressionStr}" at location ${identifierStart}`));
            return;
        }
        // Join the relative position of the expression within a node with the absolute position
        // of the node to get the absolute position of the expression in the source code.
        const absoluteStart = this.absoluteOffset + identifierStart;
        const span = new AbsoluteSourceSpan(absoluteStart, absoluteStart + ast.name.length);
        const targetAst = this.boundTemplate.getExpressionTarget(ast);
        const target = targetAst ? this.targetToIdentifier(targetAst) : null;
        const identifier = {
            name: ast.name,
            span,
            kind,
            target,
        };
        this.identifiers.push(identifier);
    }
}
/**
 * Visits the AST of a parsed Angular template. Discovers and stores
 * identifiers of interest, deferring to an `ExpressionVisitor` as needed.
 */
let TemplateVisitor$1 = class TemplateVisitor extends compiler.RecursiveVisitor {
    boundTemplate;
    // Identifiers of interest found in the template.
    identifiers = new Set();
    errors = [];
    // Map of targets in a template to their identifiers.
    targetIdentifierCache = new Map();
    // Map of elements and templates to their identifiers.
    elementAndTemplateIdentifierCache = new Map();
    /**
     * Creates a template visitor for a bound template target. The bound target can be used when
     * deferred to the expression visitor to get information about the target of an expression.
     *
     * @param boundTemplate bound template target
     */
    constructor(boundTemplate) {
        super();
        this.boundTemplate = boundTemplate;
    }
    /**
     * Visits a node in the template.
     *
     * @param node node to visit
     */
    visit(node) {
        node.visit(this);
    }
    visitAll(nodes) {
        nodes.forEach((node) => this.visit(node));
    }
    /**
     * Add an identifier for an HTML element and visit its children recursively.
     *
     * @param element
     */
    visitElement(element) {
        const elementIdentifier = this.elementOrTemplateToIdentifier(element);
        if (elementIdentifier !== null) {
            this.identifiers.add(elementIdentifier);
        }
        this.visitAll(element.references);
        this.visitAll(element.inputs);
        this.visitAll(element.attributes);
        this.visitAll(element.directives);
        this.visitAll(element.children);
        this.visitAll(element.outputs);
    }
    visitTemplate(template) {
        const templateIdentifier = this.elementOrTemplateToIdentifier(template);
        if (templateIdentifier !== null) {
            this.identifiers.add(templateIdentifier);
        }
        this.visitAll(template.directives);
        this.visitAll(template.variables);
        this.visitAll(template.attributes);
        this.visitAll(template.templateAttrs);
        this.visitAll(template.children);
        this.visitAll(template.references);
    }
    visitBoundAttribute(attribute) {
        // If the bound attribute has no value, it cannot have any identifiers in the value expression.
        if (attribute.valueSpan === undefined) {
            return;
        }
        const { identifiers, errors } = ExpressionVisitor.getIdentifiers(attribute.value, attribute.valueSpan.toString(), attribute.valueSpan.start.offset, this.boundTemplate, this.targetToIdentifier.bind(this));
        identifiers.forEach((id) => this.identifiers.add(id));
        this.errors.push(...errors);
    }
    visitBoundEvent(attribute) {
        this.visitExpression(attribute.handler);
    }
    visitBoundText(text) {
        this.visitExpression(text.value);
    }
    visitReference(reference) {
        const referenceIdentifier = this.targetToIdentifier(reference);
        if (referenceIdentifier === null) {
            return;
        }
        this.identifiers.add(referenceIdentifier);
    }
    visitVariable(variable) {
        const variableIdentifier = this.targetToIdentifier(variable);
        if (variableIdentifier === null) {
            return;
        }
        this.identifiers.add(variableIdentifier);
    }
    visitDeferredBlock(deferred) {
        deferred.visitAll(this);
    }
    visitDeferredBlockPlaceholder(block) {
        this.visitAll(block.children);
    }
    visitDeferredBlockError(block) {
        this.visitAll(block.children);
    }
    visitDeferredBlockLoading(block) {
        this.visitAll(block.children);
    }
    visitDeferredTrigger(trigger) {
        if (trigger instanceof compiler.BoundDeferredTrigger) {
            this.visitExpression(trigger.value);
        }
    }
    visitSwitchBlock(block) {
        this.visitExpression(block.expression);
        this.visitAll(block.cases);
    }
    visitSwitchBlockCase(block) {
        block.expression && this.visitExpression(block.expression);
        this.visitAll(block.children);
    }
    visitForLoopBlock(block) {
        block.item.visit(this);
        this.visitAll(block.contextVariables);
        this.visitExpression(block.expression);
        this.visitAll(block.children);
        block.empty?.visit(this);
    }
    visitForLoopBlockEmpty(block) {
        this.visitAll(block.children);
    }
    visitIfBlock(block) {
        this.visitAll(block.branches);
    }
    visitIfBlockBranch(block) {
        block.expression && this.visitExpression(block.expression);
        block.expressionAlias?.visit(this);
        this.visitAll(block.children);
    }
    visitLetDeclaration(decl) {
        const identifier = this.targetToIdentifier(decl);
        if (identifier !== null) {
            this.identifiers.add(identifier);
        }
        this.visitExpression(decl.value);
    }
    visitComponent(component) {
        throw new Error('TODO');
    }
    visitDirective(directive) {
        throw new Error('TODO');
    }
    /** Creates an identifier for a template element or template node. */
    elementOrTemplateToIdentifier(node) {
        // If this node has already been seen, return the cached result.
        if (this.elementAndTemplateIdentifierCache.has(node)) {
            return this.elementAndTemplateIdentifierCache.get(node);
        }
        let name;
        let kind;
        if (node instanceof compiler.Template) {
            name = node.tagName ?? 'ng-template';
            kind = IdentifierKind.Template;
        }
        else {
            name = node.name;
            kind = IdentifierKind.Element;
        }
        // Namespaced elements have a particular format for `node.name` that needs to be handled.
        // For example, an `<svg>` element has a `node.name` of `':svg:svg'`.
        // TODO(alxhub): properly handle namespaced elements
        if (name.startsWith(':')) {
            name = name.split(':').pop();
        }
        const sourceSpan = node.startSourceSpan;
        // An element's or template's source span can be of the form `<element>`, `<element />`, or
        // `<element></element>`. Only the selector is interesting to the indexer, so the source is
        // searched for the first occurrence of the element (selector) name.
        const start = this.getStartLocation(name, sourceSpan);
        if (start === null) {
            return null;
        }
        const absoluteSpan = new AbsoluteSourceSpan(start, start + name.length);
        // Record the nodes's attributes, which an indexer can later traverse to see if any of them
        // specify a used directive on the node.
        const attributes = node.attributes.map(({ name, sourceSpan }) => {
            return {
                name,
                span: new AbsoluteSourceSpan(sourceSpan.start.offset, sourceSpan.end.offset),
                kind: IdentifierKind.Attribute,
            };
        });
        const usedDirectives = this.boundTemplate.getDirectivesOfNode(node) || [];
        const identifier = {
            name,
            span: absoluteSpan,
            kind,
            attributes: new Set(attributes),
            usedDirectives: new Set(usedDirectives.map((dir) => {
                return {
                    node: dir.ref.node,
                    selector: dir.selector,
                };
            })),
            // cast b/c pre-TypeScript 3.5 unions aren't well discriminated
        };
        this.elementAndTemplateIdentifierCache.set(node, identifier);
        return identifier;
    }
    /** Creates an identifier for a template reference or template variable target. */
    targetToIdentifier(node) {
        // If this node has already been seen, return the cached result.
        if (this.targetIdentifierCache.has(node)) {
            return this.targetIdentifierCache.get(node);
        }
        const { name, sourceSpan } = node;
        const start = this.getStartLocation(name, sourceSpan);
        if (start === null) {
            return null;
        }
        const span = new AbsoluteSourceSpan(start, start + name.length);
        let identifier;
        if (node instanceof compiler.Reference) {
            // If the node is a reference, we care about its target. The target can be an element, a
            // template, a directive applied on a template or element (in which case the directive field
            // is non-null), or nothing at all.
            const refTarget = this.boundTemplate.getReferenceTarget(node);
            let target = null;
            if (refTarget) {
                let node = null;
                let directive = null;
                if (refTarget instanceof compiler.Element || refTarget instanceof compiler.Template) {
                    node = this.elementOrTemplateToIdentifier(refTarget);
                }
                else {
                    node = this.elementOrTemplateToIdentifier(refTarget.node);
                    directive = refTarget.directive.ref.node;
                }
                if (node === null) {
                    return null;
                }
                target = {
                    node,
                    directive,
                };
            }
            identifier = {
                name,
                span,
                kind: IdentifierKind.Reference,
                target,
            };
        }
        else if (node instanceof compiler.Variable) {
            identifier = {
                name,
                span,
                kind: IdentifierKind.Variable,
            };
        }
        else {
            identifier = {
                name,
                span,
                kind: IdentifierKind.LetDeclaration,
            };
        }
        this.targetIdentifierCache.set(node, identifier);
        return identifier;
    }
    /** Gets the start location of a string in a SourceSpan */
    getStartLocation(name, context) {
        const localStr = context.toString();
        if (!localStr.includes(name)) {
            this.errors.push(new Error(`Impossible state: "${name}" not found in "${localStr}"`));
            return null;
        }
        return context.start.offset + localStr.indexOf(name);
    }
    /**
     * Visits a node's expression and adds its identifiers, if any, to the visitor's state.
     * Only ASTs with information about the expression source and its location are visited.
     *
     * @param node node whose expression to visit
     */
    visitExpression(ast) {
        // Only include ASTs that have information about their source and absolute source spans.
        if (ast instanceof compiler.ASTWithSource && ast.source !== null) {
            // Make target to identifier mapping closure stateful to this visitor instance.
            const targetToIdentifier = this.targetToIdentifier.bind(this);
            const absoluteOffset = ast.sourceSpan.start;
            const { identifiers, errors } = ExpressionVisitor.getIdentifiers(ast, ast.source, absoluteOffset, this.boundTemplate, targetToIdentifier);
            identifiers.forEach((id) => this.identifiers.add(id));
            this.errors.push(...errors);
        }
    }
};
/**
 * Traverses a template AST and builds identifiers discovered in it.
 *
 * @param boundTemplate bound template target, which can be used for querying expression targets.
 * @return identifiers in template
 */
function getTemplateIdentifiers(boundTemplate) {
    const visitor = new TemplateVisitor$1(boundTemplate);
    if (boundTemplate.target.template !== undefined) {
        visitor.visitAll(boundTemplate.target.template);
    }
    return { identifiers: visitor.identifiers, errors: visitor.errors };
}

/**
 * Generates `IndexedComponent` entries from a `IndexingContext`, which has information
 * about components discovered in the program registered in it.
 *
 * The context must be populated before `generateAnalysis` is called.
 */
function generateAnalysis(context) {
    const analysis = new Map();
    context.components.forEach(({ declaration, selector, boundTemplate, templateMeta }) => {
        const name = declaration.name.getText();
        const usedComponents = new Set();
        const usedDirs = boundTemplate.getUsedDirectives();
        usedDirs.forEach((dir) => {
            if (dir.isComponent) {
                usedComponents.add(dir.ref.node);
            }
        });
        // Get source files for the component and the template. If the template is inline, its source
        // file is the component's.
        const componentFile = new compiler.ParseSourceFile(declaration.getSourceFile().getFullText(), declaration.getSourceFile().fileName);
        let templateFile;
        if (templateMeta.isInline) {
            templateFile = componentFile;
        }
        else {
            templateFile = templateMeta.file;
        }
        const { identifiers, errors } = getTemplateIdentifiers(boundTemplate);
        analysis.set(declaration, {
            name,
            selector,
            file: componentFile,
            template: {
                identifiers,
                usedComponents,
                isInline: templateMeta.isInline,
                file: templateFile,
            },
            errors,
        });
    });
    return analysis;
}

/**
 * An index of all NgModules that export or re-export a given trait.
 */
class NgModuleIndexImpl {
    metaReader;
    localReader;
    constructor(metaReader, localReader) {
        this.metaReader = metaReader;
        this.localReader = localReader;
    }
    // A map from an NgModule's Class Declaration to the "main" reference to that module, aka the one
    // present in the reader metadata object
    ngModuleAuthoritativeReference = new Map();
    // A map from a Directive/Pipe's class declaration to the class declarations of all re-exporting
    // NgModules
    typeToExportingModules = new Map();
    indexed = false;
    updateWith(cache, key, elem) {
        if (cache.has(key)) {
            cache.get(key).add(elem);
        }
        else {
            const set = new Set();
            set.add(elem);
            cache.set(key, set);
        }
    }
    index() {
        const seenTypesWithReexports = new Map();
        const locallyDeclaredDirsAndNgModules = [
            ...this.localReader.getKnown(checker.MetaKind.NgModule),
            ...this.localReader.getKnown(checker.MetaKind.Directive),
        ];
        for (const decl of locallyDeclaredDirsAndNgModules) {
            // Here it's safe to create a new Reference because these are known local types.
            this.indexTrait(new checker.Reference(decl), seenTypesWithReexports);
        }
        this.indexed = true;
    }
    indexTrait(ref, seenTypesWithReexports) {
        if (seenTypesWithReexports.has(ref.node)) {
            // We've processed this type before.
            return;
        }
        seenTypesWithReexports.set(ref.node, new Set());
        const meta = this.metaReader.getDirectiveMetadata(ref) ?? this.metaReader.getNgModuleMetadata(ref);
        if (meta === null) {
            return;
        }
        // Component + NgModule: recurse into imports
        if (meta.imports !== null) {
            for (const childRef of meta.imports) {
                this.indexTrait(childRef, seenTypesWithReexports);
            }
        }
        if (meta.kind === checker.MetaKind.NgModule) {
            if (!this.ngModuleAuthoritativeReference.has(ref.node)) {
                this.ngModuleAuthoritativeReference.set(ref.node, ref);
            }
            for (const childRef of meta.exports) {
                this.indexTrait(childRef, seenTypesWithReexports);
                const childMeta = this.metaReader.getDirectiveMetadata(childRef) ??
                    this.metaReader.getPipeMetadata(childRef) ??
                    this.metaReader.getNgModuleMetadata(childRef);
                if (childMeta === null) {
                    continue;
                }
                switch (childMeta.kind) {
                    case checker.MetaKind.Directive:
                    case checker.MetaKind.Pipe:
                        this.updateWith(this.typeToExportingModules, childRef.node, ref.node);
                        this.updateWith(seenTypesWithReexports, ref.node, childRef.node);
                        break;
                    case checker.MetaKind.NgModule:
                        if (seenTypesWithReexports.has(childRef.node)) {
                            for (const reexported of seenTypesWithReexports.get(childRef.node)) {
                                this.updateWith(this.typeToExportingModules, reexported, ref.node);
                                this.updateWith(seenTypesWithReexports, ref.node, reexported);
                            }
                        }
                        break;
                }
            }
        }
    }
    getNgModulesExporting(directiveOrPipe) {
        if (!this.indexed) {
            this.index();
        }
        if (!this.typeToExportingModules.has(directiveOrPipe)) {
            return [];
        }
        const refs = [];
        for (const ngModule of this.typeToExportingModules.get(directiveOrPipe)) {
            if (this.ngModuleAuthoritativeReference.has(ngModule)) {
                refs.push(this.ngModuleAuthoritativeReference.get(ngModule));
            }
        }
        return refs;
    }
}

const CSS_PREPROCESSOR_EXT = /(\.scss|\.sass|\.less|\.styl)$/;
const RESOURCE_MARKER = '.$ngresource$';
const RESOURCE_MARKER_TS = RESOURCE_MARKER + '.ts';
/**
 * `ResourceLoader` which delegates to an `NgCompilerAdapter`'s resource loading methods.
 */
class AdapterResourceLoader {
    adapter;
    options;
    cache = new Map();
    fetching = new Map();
    lookupResolutionHost;
    canPreload;
    canPreprocess;
    constructor(adapter, options) {
        this.adapter = adapter;
        this.options = options;
        this.lookupResolutionHost = createLookupResolutionHost(this.adapter);
        this.canPreload = !!this.adapter.readResource;
        this.canPreprocess = !!this.adapter.transformResource;
    }
    /**
     * Resolve the url of a resource relative to the file that contains the reference to it.
     * The return value of this method can be used in the `load()` and `preload()` methods.
     *
     * Uses the provided CompilerHost if it supports mapping resources to filenames.
     * Otherwise, uses a fallback mechanism that searches the module resolution candidates.
     *
     * @param url The, possibly relative, url of the resource.
     * @param fromFile The path to the file that contains the URL of the resource.
     * @returns A resolved url of resource.
     * @throws An error if the resource cannot be resolved.
     */
    resolve(url, fromFile) {
        let resolvedUrl = null;
        if (this.adapter.resourceNameToFileName) {
            resolvedUrl = this.adapter.resourceNameToFileName(url, fromFile, (url, fromFile) => this.fallbackResolve(url, fromFile));
        }
        else {
            resolvedUrl = this.fallbackResolve(url, fromFile);
        }
        if (resolvedUrl === null) {
            throw new Error(`HostResourceResolver: could not resolve ${url} in context of ${fromFile})`);
        }
        return resolvedUrl;
    }
    /**
     * Preload the specified resource, asynchronously.
     *
     * Once the resource is loaded, its value is cached so it can be accessed synchronously via the
     * `load()` method.
     *
     * @param resolvedUrl The url (resolved by a call to `resolve()`) of the resource to preload.
     * @param context Information about the resource such as the type and containing file.
     * @returns A Promise that is resolved once the resource has been loaded or `undefined` if the
     * file has already been loaded.
     * @throws An Error if pre-loading is not available.
     */
    preload(resolvedUrl, context) {
        if (!this.adapter.readResource) {
            throw new Error('HostResourceLoader: the CompilerHost provided does not support pre-loading resources.');
        }
        if (this.cache.has(resolvedUrl)) {
            return undefined;
        }
        else if (this.fetching.has(resolvedUrl)) {
            return this.fetching.get(resolvedUrl);
        }
        let result = this.adapter.readResource(resolvedUrl);
        if (this.adapter.transformResource && context.type === 'style') {
            const resourceContext = {
                type: 'style',
                containingFile: context.containingFile,
                resourceFile: resolvedUrl,
                className: context.className,
            };
            result = Promise.resolve(result).then(async (str) => {
                const transformResult = await this.adapter.transformResource(str, resourceContext);
                return transformResult === null ? str : transformResult.content;
            });
        }
        if (typeof result === 'string') {
            this.cache.set(resolvedUrl, result);
            return undefined;
        }
        else {
            const fetchCompletion = result.then((str) => {
                this.fetching.delete(resolvedUrl);
                this.cache.set(resolvedUrl, str);
            });
            this.fetching.set(resolvedUrl, fetchCompletion);
            return fetchCompletion;
        }
    }
    /**
     * Preprocess the content data of an inline resource, asynchronously.
     *
     * @param data The existing content data from the inline resource.
     * @param context Information regarding the resource such as the type and containing file.
     * @returns A Promise that resolves to the processed data. If no processing occurs, the
     * same data string that was passed to the function will be resolved.
     */
    async preprocessInline(data, context) {
        if (!this.adapter.transformResource || context.type !== 'style') {
            return data;
        }
        const transformResult = await this.adapter.transformResource(data, {
            type: 'style',
            containingFile: context.containingFile,
            resourceFile: null,
            order: context.order,
            className: context.className,
        });
        if (transformResult === null) {
            return data;
        }
        return transformResult.content;
    }
    /**
     * Load the resource at the given url, synchronously.
     *
     * The contents of the resource may have been cached by a previous call to `preload()`.
     *
     * @param resolvedUrl The url (resolved by a call to `resolve()`) of the resource to load.
     * @returns The contents of the resource.
     */
    load(resolvedUrl) {
        if (this.cache.has(resolvedUrl)) {
            return this.cache.get(resolvedUrl);
        }
        const result = this.adapter.readResource
            ? this.adapter.readResource(resolvedUrl)
            : this.adapter.readFile(resolvedUrl);
        if (typeof result !== 'string') {
            throw new Error(`HostResourceLoader: loader(${resolvedUrl}) returned a Promise`);
        }
        this.cache.set(resolvedUrl, result);
        return result;
    }
    /**
     * Invalidate the entire resource cache.
     */
    invalidate() {
        this.cache.clear();
    }
    /**
     * Attempt to resolve `url` in the context of `fromFile`, while respecting the rootDirs
     * option from the tsconfig. First, normalize the file name.
     */
    fallbackResolve(url, fromFile) {
        let candidateLocations;
        if (url.startsWith('/')) {
            // This path is not really an absolute path, but instead the leading '/' means that it's
            // rooted in the project rootDirs. So look for it according to the rootDirs.
            candidateLocations = this.getRootedCandidateLocations(url);
        }
        else {
            // This path is a "relative" path and can be resolved as such. To make this easier on the
            // downstream resolver, the './' prefix is added if missing to distinguish these paths from
            // absolute node_modules paths.
            if (!url.startsWith('.')) {
                url = `./${url}`;
            }
            candidateLocations = this.getResolvedCandidateLocations(url, fromFile);
        }
        for (const candidate of candidateLocations) {
            if (this.adapter.fileExists(candidate)) {
                return candidate;
            }
            else if (CSS_PREPROCESSOR_EXT.test(candidate)) {
                /**
                 * If the user specified styleUrl points to *.scss, but the Sass compiler was run before
                 * Angular, then the resource may have been generated as *.css. Simply try the resolution
                 * again.
                 */
                const cssFallbackUrl = candidate.replace(CSS_PREPROCESSOR_EXT, '.css');
                if (this.adapter.fileExists(cssFallbackUrl)) {
                    return cssFallbackUrl;
                }
            }
        }
        return null;
    }
    getRootedCandidateLocations(url) {
        // The path already starts with '/', so add a '.' to make it relative.
        const segment = ('.' + url);
        return this.adapter.rootDirs.map((rootDir) => checker.join(rootDir, segment));
    }
    /**
     * TypeScript provides utilities to resolve module names, but not resource files (which aren't
     * a part of the ts.Program). However, TypeScript's module resolution can be used creatively
     * to locate where resource files should be expected to exist. Since module resolution returns
     * a list of file names that were considered, the loader can enumerate the possible locations
     * for the file by setting up a module resolution for it that will fail.
     */
    getResolvedCandidateLocations(url, fromFile) {
        const failedLookup = ts.resolveModuleName(url + RESOURCE_MARKER, fromFile, this.options, this.lookupResolutionHost);
        if (failedLookup.failedLookupLocations === undefined) {
            throw new Error(`Internal error: expected to find failedLookupLocations during resolution of resource '${url}' in context of ${fromFile}`);
        }
        return failedLookup.failedLookupLocations
            .filter((candidate) => candidate.endsWith(RESOURCE_MARKER_TS))
            .map((candidate) => candidate.slice(0, -RESOURCE_MARKER_TS.length));
    }
}
/**
 * Derives a `ts.ModuleResolutionHost` from a compiler adapter that recognizes the special resource
 * marker and does not go to the filesystem for these requests, as they are known not to exist.
 */
function createLookupResolutionHost(adapter) {
    return {
        directoryExists(directoryName) {
            if (directoryName.includes(RESOURCE_MARKER)) {
                return false;
            }
            else if (adapter.directoryExists !== undefined) {
                return adapter.directoryExists(directoryName);
            }
            else {
                // TypeScript's module resolution logic assumes that the directory exists when no host
                // implementation is available.
                return true;
            }
        },
        fileExists(fileName) {
            if (fileName.includes(RESOURCE_MARKER)) {
                return false;
            }
            else {
                return adapter.fileExists(fileName);
            }
        },
        readFile: adapter.readFile.bind(adapter),
        getCurrentDirectory: adapter.getCurrentDirectory.bind(adapter),
        getDirectories: adapter.getDirectories?.bind(adapter),
        realpath: adapter.realpath?.bind(adapter),
        trace: adapter.trace?.bind(adapter),
        useCaseSensitiveFileNames: typeof adapter.useCaseSensitiveFileNames === 'function'
            ? adapter.useCaseSensitiveFileNames.bind(adapter)
            : adapter.useCaseSensitiveFileNames,
    };
}

/**
 * Computes scopes for standalone components based on their `imports`, expanding imported NgModule
 * scopes where necessary.
 */
class StandaloneComponentScopeReader {
    metaReader;
    localModuleReader;
    dtsModuleReader;
    cache = new Map();
    constructor(metaReader, localModuleReader, dtsModuleReader) {
        this.metaReader = metaReader;
        this.localModuleReader = localModuleReader;
        this.dtsModuleReader = dtsModuleReader;
    }
    getScopeForComponent(clazz) {
        if (!this.cache.has(clazz)) {
            const clazzRef = new checker.Reference(clazz);
            const clazzMeta = this.metaReader.getDirectiveMetadata(clazzRef);
            if (clazzMeta === null || !clazzMeta.isComponent || !clazzMeta.isStandalone) {
                this.cache.set(clazz, null);
                return null;
            }
            // A standalone component always has itself in scope, so add `clazzMeta` during
            // initialization.
            const dependencies = new Set([clazzMeta]);
            const deferredDependencies = new Set();
            const seen = new Set([clazz]);
            let isPoisoned = clazzMeta.isPoisoned;
            if (clazzMeta.imports !== null) {
                for (const ref of clazzMeta.imports) {
                    if (seen.has(ref.node)) {
                        continue;
                    }
                    seen.add(ref.node);
                    const dirMeta = this.metaReader.getDirectiveMetadata(ref);
                    if (dirMeta !== null) {
                        dependencies.add({ ...dirMeta, ref });
                        isPoisoned = isPoisoned || dirMeta.isPoisoned || !dirMeta.isStandalone;
                        continue;
                    }
                    const pipeMeta = this.metaReader.getPipeMetadata(ref);
                    if (pipeMeta !== null) {
                        dependencies.add({ ...pipeMeta, ref });
                        isPoisoned = isPoisoned || !pipeMeta.isStandalone;
                        continue;
                    }
                    const ngModuleMeta = this.metaReader.getNgModuleMetadata(ref);
                    if (ngModuleMeta !== null) {
                        dependencies.add({ ...ngModuleMeta, ref });
                        let ngModuleScope;
                        if (ref.node.getSourceFile().isDeclarationFile) {
                            ngModuleScope = this.dtsModuleReader.resolve(ref);
                        }
                        else {
                            ngModuleScope = this.localModuleReader.getScopeOfModule(ref.node);
                        }
                        if (ngModuleScope === null) {
                            // This technically shouldn't happen, but mark the scope as poisoned just in case.
                            isPoisoned = true;
                            continue;
                        }
                        isPoisoned = isPoisoned || ngModuleScope.exported.isPoisoned;
                        for (const dep of ngModuleScope.exported.dependencies) {
                            if (!seen.has(dep.ref.node)) {
                                seen.add(dep.ref.node);
                                dependencies.add(dep);
                            }
                        }
                        continue;
                    }
                    // Import was not a component/directive/pipe/NgModule, which is an error and poisons the
                    // scope.
                    isPoisoned = true;
                }
            }
            if (clazzMeta.deferredImports !== null) {
                for (const ref of clazzMeta.deferredImports) {
                    const dirMeta = this.metaReader.getDirectiveMetadata(ref);
                    if (dirMeta !== null) {
                        deferredDependencies.add({ ...dirMeta, ref, isExplicitlyDeferred: true });
                        isPoisoned = isPoisoned || dirMeta.isPoisoned || !dirMeta.isStandalone;
                        continue;
                    }
                    const pipeMeta = this.metaReader.getPipeMetadata(ref);
                    if (pipeMeta !== null) {
                        deferredDependencies.add({ ...pipeMeta, ref, isExplicitlyDeferred: true });
                        isPoisoned = isPoisoned || !pipeMeta.isStandalone;
                        continue;
                    }
                }
            }
            this.cache.set(clazz, {
                kind: checker.ComponentScopeKind.Standalone,
                component: clazz,
                dependencies: Array.from(dependencies),
                deferredDependencies: Array.from(deferredDependencies),
                isPoisoned,
                schemas: clazzMeta.schemas ?? [],
            });
        }
        return this.cache.get(clazz);
    }
    getRemoteScope() {
        return null;
    }
}

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
/** Names of known signal functions. */
const SIGNAL_FNS = new Set([
    'WritableSignal',
    'Signal',
    'InputSignal',
    'InputSignalWithTransform',
    'ModelSignal',
]);
/** Returns whether a symbol is a reference to a signal. */
function isSignalReference(symbol) {
    return ((symbol.kind === checker.SymbolKind.Expression ||
        symbol.kind === checker.SymbolKind.Variable ||
        symbol.kind === checker.SymbolKind.LetDeclaration) &&
        // Note that `tsType.symbol` isn't optional in the typings,
        // but it appears that it can be undefined at runtime.
        ((symbol.tsType.symbol !== undefined && isSignalSymbol(symbol.tsType.symbol)) ||
            (symbol.tsType.aliasSymbol !== undefined && isSignalSymbol(symbol.tsType.aliasSymbol))));
}
/** Checks whether a symbol points to a signal. */
function isSignalSymbol(symbol) {
    const declarations = symbol.getDeclarations();
    return (declarations !== undefined &&
        declarations.some((decl) => {
            const fileName = decl.getSourceFile().fileName;
            return ((ts.isInterfaceDeclaration(decl) || ts.isTypeAliasDeclaration(decl)) &&
                SIGNAL_FNS.has(decl.name.text) &&
                (fileName.includes('@angular/core') || fileName.includes('angular2/rc/packages/core')));
        }));
}

/**
 * This abstract class provides a base implementation for the run method.
 */
class TemplateCheckWithVisitor {
    /**
     * When extended diagnostics were first introduced, the visitor wasn't implemented correctly
     * which meant that it wasn't visiting the `templateAttrs` of structural directives (e.g.
     * the expression of `*ngIf`). Fixing the issue causes a lot of internal breakages and will likely
     * need to be done in a major version to avoid external breakages. This flag is used to opt out
     * pre-existing diagnostics from the correct behavior until the breakages have been fixed while
     * ensuring that newly-written diagnostics are correct from the beginning.
     * TODO(crisbeto): remove this flag and fix the internal brekages.
     */
    canVisitStructuralAttributes = true;
    /**
     * Base implementation for run function, visits all nodes in template and calls
     * `visitNode()` for each one.
     */
    run(ctx, component, template) {
        const visitor = new TemplateVisitor(ctx, component, this);
        return visitor.getDiagnostics(template);
    }
}
/**
 * Visits all nodes in a template (TmplAstNode and AST) and calls `visitNode` for each one.
 */
class TemplateVisitor extends compiler.RecursiveAstVisitor {
    ctx;
    component;
    check;
    diagnostics = [];
    constructor(ctx, component, check) {
        super();
        this.ctx = ctx;
        this.component = component;
        this.check = check;
    }
    visit(node, context) {
        this.diagnostics.push(...this.check.visitNode(this.ctx, this.component, node));
        node.visit(this);
    }
    visitAllNodes(nodes) {
        for (const node of nodes) {
            this.visit(node);
        }
    }
    visitAst(ast) {
        if (ast instanceof compiler.ASTWithSource) {
            ast = ast.ast;
        }
        this.visit(ast);
    }
    visitElement(element) {
        this.visitAllNodes(element.attributes);
        this.visitAllNodes(element.inputs);
        this.visitAllNodes(element.outputs);
        this.visitAllNodes(element.directives);
        this.visitAllNodes(element.references);
        this.visitAllNodes(element.children);
    }
    visitTemplate(template) {
        const isInlineTemplate = template.tagName === 'ng-template';
        this.visitAllNodes(template.attributes);
        if (isInlineTemplate) {
            // Only visit input/outputs if this isn't an inline template node generated for a structural
            // directive (like `<div *ngIf></div>`). These nodes would be visited when the underlying
            // element of an inline template node is processed.
            this.visitAllNodes(template.inputs);
            this.visitAllNodes(template.outputs);
        }
        this.visitAllNodes(template.directives);
        // TODO(crisbeto): remove this condition when deleting `canVisitStructuralAttributes`.
        if (this.check.canVisitStructuralAttributes || isInlineTemplate) {
            // `templateAttrs` aren't transferred over to the inner element so we always have to visit them.
            this.visitAllNodes(template.templateAttrs);
        }
        this.visitAllNodes(template.variables);
        this.visitAllNodes(template.references);
        this.visitAllNodes(template.children);
    }
    visitContent(content) {
        this.visitAllNodes(content.children);
    }
    visitVariable(variable) { }
    visitReference(reference) { }
    visitTextAttribute(attribute) { }
    visitUnknownBlock(block) { }
    visitBoundAttribute(attribute) {
        this.visitAst(attribute.value);
    }
    visitBoundEvent(attribute) {
        this.visitAst(attribute.handler);
    }
    visitText(text) { }
    visitBoundText(text) {
        this.visitAst(text.value);
    }
    visitIcu(icu) {
        Object.keys(icu.vars).forEach((key) => this.visit(icu.vars[key]));
        Object.keys(icu.placeholders).forEach((key) => this.visit(icu.placeholders[key]));
    }
    visitDeferredBlock(deferred) {
        deferred.visitAll(this);
    }
    visitDeferredTrigger(trigger) {
        if (trigger instanceof compiler.BoundDeferredTrigger) {
            this.visitAst(trigger.value);
        }
    }
    visitDeferredBlockPlaceholder(block) {
        this.visitAllNodes(block.children);
    }
    visitDeferredBlockError(block) {
        this.visitAllNodes(block.children);
    }
    visitDeferredBlockLoading(block) {
        this.visitAllNodes(block.children);
    }
    visitSwitchBlock(block) {
        this.visitAst(block.expression);
        this.visitAllNodes(block.cases);
    }
    visitSwitchBlockCase(block) {
        block.expression && this.visitAst(block.expression);
        this.visitAllNodes(block.children);
    }
    visitForLoopBlock(block) {
        block.item.visit(this);
        this.visitAllNodes(block.contextVariables);
        this.visitAst(block.expression);
        this.visitAllNodes(block.children);
        block.empty?.visit(this);
    }
    visitForLoopBlockEmpty(block) {
        this.visitAllNodes(block.children);
    }
    visitIfBlock(block) {
        this.visitAllNodes(block.branches);
    }
    visitIfBlockBranch(block) {
        block.expression && this.visitAst(block.expression);
        block.expressionAlias?.visit(this);
        this.visitAllNodes(block.children);
    }
    visitLetDeclaration(decl) {
        this.visitAst(decl.value);
    }
    visitComponent(component) {
        this.visitAllNodes(component.attributes);
        this.visitAllNodes(component.inputs);
        this.visitAllNodes(component.outputs);
        this.visitAllNodes(component.directives);
        this.visitAllNodes(component.references);
        this.visitAllNodes(component.children);
    }
    visitDirective(directive) {
        this.visitAllNodes(directive.attributes);
        this.visitAllNodes(directive.inputs);
        this.visitAllNodes(directive.outputs);
        this.visitAllNodes(directive.references);
    }
    getDiagnostics(template) {
        this.diagnostics = [];
        this.visitAllNodes(template);
        return this.diagnostics;
    }
}

/** Names of known signal instance properties. */
const SIGNAL_INSTANCE_PROPERTIES = new Set(['set', 'update', 'asReadonly']);
/**
 * Names of known function instance properties.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function#instance_properties
 */
const FUNCTION_INSTANCE_PROPERTIES = new Set(['name', 'length', 'prototype']);
/**
 * Ensures Signals are invoked when used in template interpolations.
 */
class InterpolatedSignalCheck extends TemplateCheckWithVisitor {
    code = checker.ErrorCode.INTERPOLATED_SIGNAL_NOT_INVOKED;
    visitNode(ctx, component, node) {
        // interpolations like `{{ mySignal }}`
        if (node instanceof compiler.Interpolation) {
            return node.expressions
                .filter((item) => item instanceof compiler.PropertyRead)
                .flatMap((item) => buildDiagnosticForSignal(ctx, item, component));
        }
        // bound properties like `[prop]="mySignal"`
        else if (node instanceof compiler.BoundAttribute) {
            // we skip the check if the node is an input binding
            const usedDirectives = ctx.templateTypeChecker.getUsedDirectives(component);
            if (usedDirectives !== null &&
                usedDirectives.some((dir) => dir.inputs.getByBindingPropertyName(node.name) !== null)) {
                return [];
            }
            // otherwise, we check if the node is
            if (
            // a bound property like `[prop]="mySignal"`
            (node.type === compiler.BindingType.Property ||
                // or a class binding like `[class.myClass]="mySignal"`
                node.type === compiler.BindingType.Class ||
                // or a style binding like `[style.width]="mySignal"`
                node.type === compiler.BindingType.Style ||
                // or an attribute binding like `[attr.role]="mySignal"`
                node.type === compiler.BindingType.Attribute ||
                // or an animation binding like `[@myAnimation]="mySignal"`
                node.type === compiler.BindingType.Animation) &&
                node.value instanceof compiler.ASTWithSource &&
                node.value.ast instanceof compiler.PropertyRead) {
                return buildDiagnosticForSignal(ctx, node.value.ast, component);
            }
        }
        return [];
    }
}
function isFunctionInstanceProperty(name) {
    return FUNCTION_INSTANCE_PROPERTIES.has(name);
}
function isSignalInstanceProperty(name) {
    return SIGNAL_INSTANCE_PROPERTIES.has(name);
}
function buildDiagnosticForSignal(ctx, node, component) {
    // check for `{{ mySignal }}`
    const symbol = ctx.templateTypeChecker.getSymbolOfNode(node, component);
    if (symbol !== null && symbol.kind === checker.SymbolKind.Expression && isSignalReference(symbol)) {
        const templateMapping = ctx.templateTypeChecker.getSourceMappingAtTcbLocation(symbol.tcbLocation);
        const errorString = `${node.name} is a function and should be invoked: ${node.name}()`;
        const diagnostic = ctx.makeTemplateDiagnostic(templateMapping.span, errorString);
        return [diagnostic];
    }
    // check for `{{ mySignal.name }}` or `{{ mySignal.length }}` or `{{ mySignal.prototype }}`
    // as these are the names of instance properties of Function, the compiler does _not_ throw an
    // error.
    // We also check for `{{ mySignal.set }}` or `{{ mySignal.update }}` or
    // `{{ mySignal.asReadonly }}` as these are the names of instance properties of Signal
    const symbolOfReceiver = ctx.templateTypeChecker.getSymbolOfNode(node.receiver, component);
    if ((isFunctionInstanceProperty(node.name) || isSignalInstanceProperty(node.name)) &&
        symbolOfReceiver !== null &&
        symbolOfReceiver.kind === checker.SymbolKind.Expression &&
        isSignalReference(symbolOfReceiver)) {
        const templateMapping = ctx.templateTypeChecker.getSourceMappingAtTcbLocation(symbolOfReceiver.tcbLocation);
        const errorString = `${node.receiver.name} is a function and should be invoked: ${node.receiver.name}()`;
        const diagnostic = ctx.makeTemplateDiagnostic(templateMapping.span, errorString);
        return [diagnostic];
    }
    return [];
}
const factory$b = {
    code: checker.ErrorCode.INTERPOLATED_SIGNAL_NOT_INVOKED,
    name: checker.ExtendedTemplateDiagnosticName.INTERPOLATED_SIGNAL_NOT_INVOKED,
    create: () => new InterpolatedSignalCheck(),
};

/**
 * Ensures the two-way binding syntax is correct.
 * Parentheses should be inside the brackets "[()]".
 * Will return diagnostic information when "([])" is found.
 */
class InvalidBananaInBoxCheck extends TemplateCheckWithVisitor {
    code = checker.ErrorCode.INVALID_BANANA_IN_BOX;
    visitNode(ctx, component, node) {
        if (!(node instanceof compiler.BoundEvent))
            return [];
        const name = node.name;
        if (!name.startsWith('[') || !name.endsWith(']'))
            return [];
        const boundSyntax = node.sourceSpan.toString();
        const expectedBoundSyntax = boundSyntax.replace(`(${name})`, `[(${name.slice(1, -1)})]`);
        const diagnostic = ctx.makeTemplateDiagnostic(node.sourceSpan, `In the two-way binding syntax the parentheses should be inside the brackets, ex. '${expectedBoundSyntax}'.
        Find more at https://angular.dev/guide/templates/two-way-binding`);
        return [diagnostic];
    }
}
const factory$a = {
    code: checker.ErrorCode.INVALID_BANANA_IN_BOX,
    name: checker.ExtendedTemplateDiagnosticName.INVALID_BANANA_IN_BOX,
    create: () => new InvalidBananaInBoxCheck(),
};

/**
 * The list of known control flow directives present in the `CommonModule`,
 * and their corresponding imports.
 *
 * Note: there is no `ngSwitch` here since it's typically used as a regular
 * binding (e.g. `[ngSwitch]`), however the `ngSwitchCase` and `ngSwitchDefault`
 * are used as structural directives and a warning would be generated. Once the
 * `CommonModule` is included, the `ngSwitch` would also be covered.
 */
const KNOWN_CONTROL_FLOW_DIRECTIVES = new Map([
    ['ngIf', { directive: 'NgIf', builtIn: '@if' }],
    ['ngFor', { directive: 'NgFor', builtIn: '@for' }],
    ['ngSwitchCase', { directive: 'NgSwitchCase', builtIn: '@switch with @case' }],
    ['ngSwitchDefault', { directive: 'NgSwitchDefault', builtIn: '@switch with @default' }],
]);
/**
 * Ensures that there are no known control flow directives (such as *ngIf and *ngFor)
 * used in a template of a *standalone* component without importing a `CommonModule`. Returns
 * diagnostics in case such a directive is detected.
 *
 * Note: this check only handles the cases when structural directive syntax is used (e.g. `*ngIf`).
 * Regular binding syntax (e.g. `[ngIf]`) is handled separately in type checker and treated as a
 * hard error instead of a warning.
 */
class MissingControlFlowDirectiveCheck extends TemplateCheckWithVisitor {
    code = checker.ErrorCode.MISSING_CONTROL_FLOW_DIRECTIVE;
    run(ctx, component, template) {
        const componentMetadata = ctx.templateTypeChecker.getDirectiveMetadata(component);
        // Avoid running this check for non-standalone components.
        if (!componentMetadata || !componentMetadata.isStandalone) {
            return [];
        }
        return super.run(ctx, component, template);
    }
    visitNode(ctx, component, node) {
        if (!(node instanceof compiler.Template))
            return [];
        const controlFlowAttr = node.templateAttrs.find((attr) => KNOWN_CONTROL_FLOW_DIRECTIVES.has(attr.name));
        if (!controlFlowAttr)
            return [];
        const symbol = ctx.templateTypeChecker.getSymbolOfNode(node, component);
        if (symbol === null || symbol.directives.length > 0) {
            return [];
        }
        const sourceSpan = controlFlowAttr.keySpan || controlFlowAttr.sourceSpan;
        const directiveAndBuiltIn = KNOWN_CONTROL_FLOW_DIRECTIVES.get(controlFlowAttr.name);
        const errorMessage = `The \`*${controlFlowAttr.name}\` directive was used in the template, ` +
            `but neither the \`${directiveAndBuiltIn?.directive}\` directive nor the \`CommonModule\` was imported. ` +
            `Use Angular's built-in control flow ${directiveAndBuiltIn?.builtIn} or ` +
            `make sure that either the \`${directiveAndBuiltIn?.directive}\` directive or the \`CommonModule\` ` +
            `is included in the \`@Component.imports\` array of this component.`;
        const diagnostic = ctx.makeTemplateDiagnostic(sourceSpan, errorMessage);
        return [diagnostic];
    }
}
const factory$9 = {
    code: checker.ErrorCode.MISSING_CONTROL_FLOW_DIRECTIVE,
    name: checker.ExtendedTemplateDiagnosticName.MISSING_CONTROL_FLOW_DIRECTIVE,
    create: (options) => {
        return new MissingControlFlowDirectiveCheck();
    },
};

/**
 * Ensures a user doesn't forget to omit `let` when using ngfor.
 * Will return diagnostic information when `let` is missing.
 */
class MissingNgForOfLetCheck extends TemplateCheckWithVisitor {
    code = checker.ErrorCode.MISSING_NGFOROF_LET;
    visitNode(ctx, component, node) {
        if (!(node instanceof compiler.Template)) {
            return [];
        }
        if (node.templateAttrs.length === 0) {
            return [];
        }
        const attr = node.templateAttrs.find((x) => x.name === 'ngFor');
        if (attr === undefined) {
            return [];
        }
        if (node.variables.length > 0) {
            return [];
        }
        const errorString = 'Your ngFor is missing a value. Did you forget to add the `let` keyword?';
        const diagnostic = ctx.makeTemplateDiagnostic(attr.sourceSpan, errorString);
        return [diagnostic];
    }
}
const factory$8 = {
    code: checker.ErrorCode.MISSING_NGFOROF_LET,
    name: checker.ExtendedTemplateDiagnosticName.MISSING_NGFOROF_LET,
    create: () => new MissingNgForOfLetCheck(),
};

/**
 * Ensures the left side of a nullish coalescing operation is nullable.
 * Returns diagnostics for the cases where the operator is useless.
 * This check should only be use if `strictNullChecks` is enabled,
 * otherwise it would produce inaccurate results.
 */
class NullishCoalescingNotNullableCheck extends TemplateCheckWithVisitor {
    canVisitStructuralAttributes = false;
    code = checker.ErrorCode.NULLISH_COALESCING_NOT_NULLABLE;
    visitNode(ctx, component, node) {
        if (!(node instanceof compiler.Binary) || node.operation !== '??')
            return [];
        const symbolLeft = ctx.templateTypeChecker.getSymbolOfNode(node.left, component);
        if (symbolLeft === null || symbolLeft.kind !== checker.SymbolKind.Expression) {
            return [];
        }
        const typeLeft = symbolLeft.tsType;
        if (typeLeft.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
            // We should not make assumptions about the any and unknown types; using a nullish coalescing
            // operator is acceptable for those.
            return [];
        }
        // If the left operand's type is different from its non-nullable self, then it must
        // contain a null or undefined so this nullish coalescing operator is useful. No diagnostic to
        // report.
        if (typeLeft.getNonNullableType() !== typeLeft)
            return [];
        const symbol = ctx.templateTypeChecker.getSymbolOfNode(node, component);
        if (symbol.kind !== checker.SymbolKind.Expression) {
            return [];
        }
        const templateMapping = ctx.templateTypeChecker.getSourceMappingAtTcbLocation(symbol.tcbLocation);
        if (templateMapping === null) {
            return [];
        }
        const diagnostic = ctx.makeTemplateDiagnostic(templateMapping.span, `The left side of this nullish coalescing operation does not include 'null' or 'undefined' in its type, therefore the '??' operator can be safely removed.`);
        return [diagnostic];
    }
}
const factory$7 = {
    code: checker.ErrorCode.NULLISH_COALESCING_NOT_NULLABLE,
    name: checker.ExtendedTemplateDiagnosticName.NULLISH_COALESCING_NOT_NULLABLE,
    create: (options) => {
        // Require `strictNullChecks` to be enabled.
        const strictNullChecks = options.strictNullChecks === undefined ? !!options.strict : !!options.strictNullChecks;
        if (!strictNullChecks) {
            return null;
        }
        return new NullishCoalescingNotNullableCheck();
    },
};

/**
 * Ensures the left side of an optional chain operation is nullable.
 * Returns diagnostics for the cases where the operator is useless.
 * This check should only be use if `strictNullChecks` is enabled,
 * otherwise it would produce inaccurate results.
 */
class OptionalChainNotNullableCheck extends TemplateCheckWithVisitor {
    canVisitStructuralAttributes = false;
    code = checker.ErrorCode.OPTIONAL_CHAIN_NOT_NULLABLE;
    visitNode(ctx, component, node) {
        if (!(node instanceof compiler.SafeCall) &&
            !(node instanceof compiler.SafePropertyRead) &&
            !(node instanceof compiler.SafeKeyedRead))
            return [];
        const symbolLeft = ctx.templateTypeChecker.getSymbolOfNode(node.receiver, component);
        if (symbolLeft === null || symbolLeft.kind !== checker.SymbolKind.Expression) {
            return [];
        }
        const typeLeft = symbolLeft.tsType;
        if (typeLeft.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
            // We should not make assumptions about the any and unknown types; using a nullish coalescing
            // operator is acceptable for those.
            return [];
        }
        // If the left operand's type is different from its non-nullable self, then it must
        // contain a null or undefined so this nullish coalescing operator is useful. No diagnostic to
        // report.
        if (typeLeft.getNonNullableType() !== typeLeft)
            return [];
        const symbol = ctx.templateTypeChecker.getSymbolOfNode(node, component);
        if (symbol.kind !== checker.SymbolKind.Expression) {
            return [];
        }
        const templateMapping = ctx.templateTypeChecker.getSourceMappingAtTcbLocation(symbol.tcbLocation);
        if (templateMapping === null) {
            return [];
        }
        const advice = node instanceof compiler.SafePropertyRead
            ? `the '?.' operator can be replaced with the '.' operator`
            : `the '?.' operator can be safely removed`;
        const diagnostic = ctx.makeTemplateDiagnostic(templateMapping.span, `The left side of this optional chain operation does not include 'null' or 'undefined' in its type, therefore ${advice}.`);
        return [diagnostic];
    }
}
const factory$6 = {
    code: checker.ErrorCode.OPTIONAL_CHAIN_NOT_NULLABLE,
    name: checker.ExtendedTemplateDiagnosticName.OPTIONAL_CHAIN_NOT_NULLABLE,
    create: (options) => {
        // Require `strictNullChecks` to be enabled.
        const strictNullChecks = options.strictNullChecks === undefined ? !!options.strict : !!options.strictNullChecks;
        if (!strictNullChecks) {
            return null;
        }
        return new OptionalChainNotNullableCheck();
    },
};

const NG_SKIP_HYDRATION_ATTR_NAME = 'ngSkipHydration';
/**
 * Ensures that the special attribute `ngSkipHydration` is not a binding and has no other
 * value than `"true"` or an empty value.
 */
class NgSkipHydrationSpec extends TemplateCheckWithVisitor {
    code = checker.ErrorCode.SKIP_HYDRATION_NOT_STATIC;
    visitNode(ctx, component, node) {
        /** Binding should always error */
        if (node instanceof compiler.BoundAttribute && node.name === NG_SKIP_HYDRATION_ATTR_NAME) {
            const errorString = `ngSkipHydration should not be used as a binding.`;
            const diagnostic = ctx.makeTemplateDiagnostic(node.sourceSpan, errorString);
            return [diagnostic];
        }
        /** No value, empty string or `"true"` are the only valid values */
        const acceptedValues = ['true', '' /* empty string */];
        if (node instanceof compiler.TextAttribute &&
            node.name === NG_SKIP_HYDRATION_ATTR_NAME &&
            !acceptedValues.includes(node.value) &&
            node.value !== undefined) {
            const errorString = `ngSkipHydration only accepts "true" or "" as value or no value at all. For example 'ngSkipHydration="true"' or 'ngSkipHydration'`;
            const diagnostic = ctx.makeTemplateDiagnostic(node.sourceSpan, errorString);
            return [diagnostic];
        }
        return [];
    }
}
const factory$5 = {
    code: checker.ErrorCode.SKIP_HYDRATION_NOT_STATIC,
    name: checker.ExtendedTemplateDiagnosticName.SKIP_HYDRATION_NOT_STATIC,
    create: () => new NgSkipHydrationSpec(),
};

const STYLE_SUFFIXES = ['px', '%', 'em'];
/**
 * A check which detects when the `.px`, `.%`, and `.em` suffixes are used with an attribute
 * binding. These suffixes are only available for style bindings.
 */
class SuffixNotSupportedCheck extends TemplateCheckWithVisitor {
    code = checker.ErrorCode.SUFFIX_NOT_SUPPORTED;
    visitNode(ctx, component, node) {
        if (!(node instanceof compiler.BoundAttribute))
            return [];
        if (!node.keySpan.toString().startsWith('attr.') ||
            !STYLE_SUFFIXES.some((suffix) => node.name.endsWith(`.${suffix}`))) {
            return [];
        }
        const diagnostic = ctx.makeTemplateDiagnostic(node.keySpan, `The ${STYLE_SUFFIXES.map((suffix) => `'.${suffix}'`).join(', ')} suffixes are only supported on style bindings.`);
        return [diagnostic];
    }
}
const factory$4 = {
    code: checker.ErrorCode.SUFFIX_NOT_SUPPORTED,
    name: checker.ExtendedTemplateDiagnosticName.SUFFIX_NOT_SUPPORTED,
    create: () => new SuffixNotSupportedCheck(),
};

/**
 * Ensures that attributes that have the "special" angular binding prefix (attr., style., and
 * class.) are interpreted as bindings. For example, `<div attr.id="my-id"></div>` will not
 * interpret this as an `AttributeBinding` to `id` but rather just a `TmplAstTextAttribute`. This
 * is likely not the intent of the developer. Instead, the intent is likely to have the `id` be set
 * to 'my-id'.
 */
class TextAttributeNotBindingSpec extends TemplateCheckWithVisitor {
    code = checker.ErrorCode.TEXT_ATTRIBUTE_NOT_BINDING;
    visitNode(ctx, component, node) {
        if (!(node instanceof compiler.TextAttribute))
            return [];
        const name = node.name;
        if (!name.startsWith('attr.') && !name.startsWith('style.') && !name.startsWith('class.')) {
            return [];
        }
        let errorString;
        if (name.startsWith('attr.')) {
            const staticAttr = name.replace('attr.', '');
            errorString = `Static attributes should be written without the 'attr.' prefix.`;
            if (node.value) {
                errorString += ` For example, ${staticAttr}="${node.value}".`;
            }
        }
        else {
            const expectedKey = `[${name}]`;
            const expectedValue = 
            // true/false are special cases because we don't want to convert them to strings but
            // rather maintain the logical true/false when bound.
            node.value === 'true' || node.value === 'false' ? node.value : `'${node.value}'`;
            errorString = 'Attribute, style, and class bindings should be enclosed with square braces.';
            if (node.value) {
                errorString += ` For example, '${expectedKey}="${expectedValue}"'.`;
            }
        }
        const diagnostic = ctx.makeTemplateDiagnostic(node.sourceSpan, errorString);
        return [diagnostic];
    }
}
const factory$3 = {
    code: checker.ErrorCode.TEXT_ATTRIBUTE_NOT_BINDING,
    name: checker.ExtendedTemplateDiagnosticName.TEXT_ATTRIBUTE_NOT_BINDING,
    create: () => new TextAttributeNotBindingSpec(),
};

/**
 * Ensures that function in event bindings are called. For example, `<button (click)="myFunc"></button>`
 * will not call `myFunc` when the button is clicked. Instead, it should be `<button (click)="myFunc()"></button>`.
 * This is likely not the intent of the developer. Instead, the intent is likely to call `myFunc`.
 */
class UninvokedFunctionInEventBindingSpec extends TemplateCheckWithVisitor {
    code = checker.ErrorCode.UNINVOKED_FUNCTION_IN_EVENT_BINDING;
    visitNode(ctx, component, node) {
        // If the node is not a bound event, skip it.
        if (!(node instanceof compiler.BoundEvent))
            return [];
        // If the node is not a regular or animation event, skip it.
        if (node.type !== compiler.ParsedEventType.Regular && node.type !== compiler.ParsedEventType.Animation)
            return [];
        if (!(node.handler instanceof compiler.ASTWithSource))
            return [];
        const sourceExpressionText = node.handler.source || '';
        if (node.handler.ast instanceof compiler.Chain) {
            // (click)="increment; decrement"
            return node.handler.ast.expressions.flatMap((expression) => assertExpressionInvoked(expression, component, node, sourceExpressionText, ctx));
        }
        if (node.handler.ast instanceof compiler.Conditional) {
            // (click)="true ? increment : decrement"
            const { trueExp, falseExp } = node.handler.ast;
            return [trueExp, falseExp].flatMap((expression) => assertExpressionInvoked(expression, component, node, sourceExpressionText, ctx));
        }
        // (click)="increment"
        return assertExpressionInvoked(node.handler.ast, component, node, sourceExpressionText, ctx);
    }
}
/**
 * Asserts that the expression is invoked.
 * If the expression is a property read, and it has a call signature, a diagnostic is generated.
 */
function assertExpressionInvoked(expression, component, node, expressionText, ctx) {
    if (expression instanceof compiler.Call || expression instanceof compiler.SafeCall) {
        return []; // If the method is called, skip it.
    }
    if (!(expression instanceof compiler.PropertyRead) && !(expression instanceof compiler.SafePropertyRead)) {
        return []; // If the expression is not a property read, skip it.
    }
    const symbol = ctx.templateTypeChecker.getSymbolOfNode(expression, component);
    if (symbol !== null && symbol.kind === checker.SymbolKind.Expression) {
        if (symbol.tsType.getCallSignatures()?.length > 0) {
            const fullExpressionText = generateStringFromExpression(expression, expressionText);
            const errorString = `Function in event binding should be invoked: ${fullExpressionText}()`;
            return [ctx.makeTemplateDiagnostic(node.sourceSpan, errorString)];
        }
    }
    return [];
}
function generateStringFromExpression(expression, source) {
    return source.substring(expression.span.start, expression.span.end);
}
const factory$2 = {
    code: checker.ErrorCode.UNINVOKED_FUNCTION_IN_EVENT_BINDING,
    name: checker.ExtendedTemplateDiagnosticName.UNINVOKED_FUNCTION_IN_EVENT_BINDING,
    create: () => new UninvokedFunctionInEventBindingSpec(),
};

/**
 * Ensures that parentheses are used to disambiguate precedence when nullish coalescing is mixed
 * with logical and/or. Returns diagnostics for the cases where parentheses are needed.
 */
class UnparenthesizedNullishCoalescing extends TemplateCheckWithVisitor {
    code = checker.ErrorCode.UNPARENTHESIZED_NULLISH_COALESCING;
    visitNode(ctx, component, node) {
        if (node instanceof compiler.Binary) {
            if (node.operation === '&&' || node.operation === '||') {
                if ((node.left instanceof compiler.Binary && node.left.operation === '??') ||
                    (node.right instanceof compiler.Binary && node.right.operation === '??')) {
                    const symbol = ctx.templateTypeChecker.getSymbolOfNode(node, component);
                    if (symbol?.kind !== checker.SymbolKind.Expression) {
                        return [];
                    }
                    const sourceMapping = ctx.templateTypeChecker.getSourceMappingAtTcbLocation(symbol.tcbLocation);
                    if (sourceMapping === null) {
                        return [];
                    }
                    const diagnostic = ctx.makeTemplateDiagnostic(sourceMapping.span, `Parentheses are required to disambiguate precedence when mixing '??' with '&&' and '||'.`);
                    return [diagnostic];
                }
            }
        }
        return [];
    }
}
const factory$1 = {
    code: checker.ErrorCode.UNPARENTHESIZED_NULLISH_COALESCING,
    name: checker.ExtendedTemplateDiagnosticName.UNPARENTHESIZED_NULLISH_COALESCING,
    create: () => new UnparenthesizedNullishCoalescing(),
};

/**
 * Ensures that all `@let` declarations in a template are used.
 */
class UnusedLetDeclarationCheck extends TemplateCheckWithVisitor {
    code = checker.ErrorCode.UNUSED_LET_DECLARATION;
    analysis = new Map();
    run(ctx, component, template) {
        super.run(ctx, component, template);
        const diagnostics = [];
        const { allLetDeclarations, usedLetDeclarations } = this.getAnalysis(component);
        for (const decl of allLetDeclarations) {
            if (!usedLetDeclarations.has(decl)) {
                diagnostics.push(ctx.makeTemplateDiagnostic(decl.sourceSpan, `@let ${decl.name} is declared but its value is never read.`));
            }
        }
        this.analysis.clear();
        return diagnostics;
    }
    visitNode(ctx, component, node) {
        if (node instanceof compiler.LetDeclaration) {
            this.getAnalysis(component).allLetDeclarations.add(node);
        }
        else if (node instanceof compiler.AST) {
            const unwrappedNode = node instanceof compiler.ASTWithSource ? node.ast : node;
            const target = ctx.templateTypeChecker.getExpressionTarget(unwrappedNode, component);
            if (target !== null && target instanceof compiler.LetDeclaration) {
                this.getAnalysis(component).usedLetDeclarations.add(target);
            }
        }
        return [];
    }
    getAnalysis(node) {
        if (!this.analysis.has(node)) {
            this.analysis.set(node, { allLetDeclarations: new Set(), usedLetDeclarations: new Set() });
        }
        return this.analysis.get(node);
    }
}
const factory = {
    code: checker.ErrorCode.UNUSED_LET_DECLARATION,
    name: checker.ExtendedTemplateDiagnosticName.UNUSED_LET_DECLARATION,
    create: () => new UnusedLetDeclarationCheck(),
};

/**
 * A label referring to a `ts.DiagnosticCategory` or `'suppress'`, meaning the associated diagnostic
 * should not be displayed at all.
 *
 * @publicApi
 */
exports.DiagnosticCategoryLabel = void 0;
(function (DiagnosticCategoryLabel) {
    /** Treat the diagnostic as a warning, don't fail the compilation. */
    DiagnosticCategoryLabel["Warning"] = "warning";
    /** Treat the diagnostic as a hard error, fail the compilation. */
    DiagnosticCategoryLabel["Error"] = "error";
    /** Ignore the diagnostic altogether. */
    DiagnosticCategoryLabel["Suppress"] = "suppress";
})(exports.DiagnosticCategoryLabel || (exports.DiagnosticCategoryLabel = {}));

class ExtendedTemplateCheckerImpl {
    partialCtx;
    templateChecks;
    constructor(templateTypeChecker, typeChecker, templateCheckFactories, options) {
        this.partialCtx = { templateTypeChecker, typeChecker };
        this.templateChecks = new Map();
        for (const factory of templateCheckFactories) {
            // Read the diagnostic category from compiler options.
            const category = diagnosticLabelToCategory(options?.extendedDiagnostics?.checks?.[factory.name] ??
                options?.extendedDiagnostics?.defaultCategory ??
                exports.DiagnosticCategoryLabel.Warning);
            // Skip the diagnostic if suppressed via compiler options.
            if (category === null) {
                continue;
            }
            // Try to create the check.
            const check = factory.create(options);
            // Skip the diagnostic if it was disabled due to unsupported options. For example, this can
            // happen if the check requires `strictNullChecks: true` but that flag is disabled in compiler
            // options.
            if (check === null) {
                continue;
            }
            // Use the check.
            this.templateChecks.set(check, category);
        }
    }
    getDiagnosticsForComponent(component) {
        const template = this.partialCtx.templateTypeChecker.getTemplate(component);
        // Skip checks if component has no template. This can happen if the user writes a
        // `@Component()` but doesn't add the template, could happen in the language service
        // when users are in the middle of typing code.
        if (template === null) {
            return [];
        }
        const diagnostics = [];
        for (const [check, category] of this.templateChecks.entries()) {
            const ctx = {
                ...this.partialCtx,
                // Wrap `templateTypeChecker.makeTemplateDiagnostic()` to implicitly provide all the known
                // options.
                makeTemplateDiagnostic: (span, message, relatedInformation) => {
                    return this.partialCtx.templateTypeChecker.makeTemplateDiagnostic(component, span, category, check.code, message, relatedInformation);
                },
            };
            diagnostics.push(...check.run(ctx, component, template));
        }
        return diagnostics;
    }
}
/**
 * Converts a `DiagnosticCategoryLabel` to its equivalent `ts.DiagnosticCategory` or `null` if
 * the label is `DiagnosticCategoryLabel.Suppress`.
 */
function diagnosticLabelToCategory(label) {
    switch (label) {
        case exports.DiagnosticCategoryLabel.Warning:
            return ts.DiagnosticCategory.Warning;
        case exports.DiagnosticCategoryLabel.Error:
            return ts.DiagnosticCategory.Error;
        case exports.DiagnosticCategoryLabel.Suppress:
            return null;
        default:
            return assertNever(label);
    }
}
function assertNever(value) {
    throw new Error(`Unexpected call to 'assertNever()' with value:\n${value}`);
}

const ALL_DIAGNOSTIC_FACTORIES = [
    factory$a,
    factory$7,
    factory$6,
    factory$9,
    factory$3,
    factory$8,
    factory$4,
    factory$b,
    factory$2,
    factory,
    factory$5,
    factory$1,
];
const SUPPORTED_DIAGNOSTIC_NAMES = new Set([
    checker.ExtendedTemplateDiagnosticName.CONTROL_FLOW_PREVENTING_CONTENT_PROJECTION,
    checker.ExtendedTemplateDiagnosticName.UNUSED_STANDALONE_IMPORTS,
    ...ALL_DIAGNOSTIC_FACTORIES.map((factory) => factory.name),
]);

class TemplateSemanticsCheckerImpl {
    templateTypeChecker;
    constructor(templateTypeChecker) {
        this.templateTypeChecker = templateTypeChecker;
    }
    getDiagnosticsForComponent(component) {
        const template = this.templateTypeChecker.getTemplate(component);
        return template !== null
            ? TemplateSemanticsVisitor.visit(template, component, this.templateTypeChecker)
            : [];
    }
}
/** Visitor that verifies the semantics of a template. */
class TemplateSemanticsVisitor extends compiler.RecursiveVisitor {
    expressionVisitor;
    constructor(expressionVisitor) {
        super();
        this.expressionVisitor = expressionVisitor;
    }
    static visit(nodes, component, templateTypeChecker) {
        const diagnostics = [];
        const expressionVisitor = new ExpressionsSemanticsVisitor(templateTypeChecker, component, diagnostics);
        const templateVisitor = new TemplateSemanticsVisitor(expressionVisitor);
        nodes.forEach((node) => node.visit(templateVisitor));
        return diagnostics;
    }
    visitBoundEvent(event) {
        super.visitBoundEvent(event);
        event.handler.visit(this.expressionVisitor, event);
    }
}
/** Visitor that verifies the semantics of the expressions within a template. */
class ExpressionsSemanticsVisitor extends compiler.RecursiveAstVisitor {
    templateTypeChecker;
    component;
    diagnostics;
    constructor(templateTypeChecker, component, diagnostics) {
        super();
        this.templateTypeChecker = templateTypeChecker;
        this.component = component;
        this.diagnostics = diagnostics;
    }
    visitPropertyWrite(ast, context) {
        super.visitPropertyWrite(ast, context);
        this.checkForIllegalWriteInEventBinding(ast, context);
    }
    visitPropertyRead(ast, context) {
        super.visitPropertyRead(ast, context);
        this.checkForIllegalWriteInTwoWayBinding(ast, context);
    }
    checkForIllegalWriteInEventBinding(ast, context) {
        if (!(context instanceof compiler.BoundEvent) || !(ast.receiver instanceof compiler.ImplicitReceiver)) {
            return;
        }
        const target = this.templateTypeChecker.getExpressionTarget(ast, this.component);
        if (target instanceof compiler.Variable) {
            const errorMessage = `Cannot use variable '${target.name}' as the left-hand side of an assignment expression. Template variables are read-only.`;
            this.diagnostics.push(this.makeIllegalTemplateVarDiagnostic(target, context, errorMessage));
        }
    }
    checkForIllegalWriteInTwoWayBinding(ast, context) {
        // Only check top-level property reads inside two-way bindings for illegal assignments.
        if (!(context instanceof compiler.BoundEvent) ||
            context.type !== compiler.ParsedEventType.TwoWay ||
            !(ast.receiver instanceof compiler.ImplicitReceiver) ||
            ast !== unwrapAstWithSource(context.handler)) {
            return;
        }
        const target = this.templateTypeChecker.getExpressionTarget(ast, this.component);
        const isVariable = target instanceof compiler.Variable;
        const isLet = target instanceof compiler.LetDeclaration;
        if (!isVariable && !isLet) {
            return;
        }
        // Two-way bindings to template variables are only allowed if the variables are signals.
        const symbol = this.templateTypeChecker.getSymbolOfNode(target, this.component);
        if (symbol !== null && !isSignalReference(symbol)) {
            let errorMessage;
            if (isVariable) {
                errorMessage = `Cannot use a non-signal variable '${target.name}' in a two-way binding expression. Template variables are read-only.`;
            }
            else {
                errorMessage = `Cannot use non-signal @let declaration '${target.name}' in a two-way binding expression. @let declarations are read-only.`;
            }
            this.diagnostics.push(this.makeIllegalTemplateVarDiagnostic(target, context, errorMessage));
        }
    }
    makeIllegalTemplateVarDiagnostic(target, expressionNode, errorMessage) {
        const span = target instanceof compiler.Variable ? target.valueSpan || target.sourceSpan : target.sourceSpan;
        return this.templateTypeChecker.makeTemplateDiagnostic(this.component, expressionNode.handlerSpan, ts.DiagnosticCategory.Error, checker.ngErrorCode(checker.ErrorCode.WRITE_TO_READ_ONLY_VARIABLE), errorMessage, [
            {
                text: `'${target.name}' is declared here.`,
                start: span.start.offset,
                end: span.end.offset,
                sourceFile: this.component.getSourceFile(),
            },
        ]);
    }
}
function unwrapAstWithSource(ast) {
    return ast instanceof compiler.ASTWithSource ? ast.ast : ast;
}

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
/** APIs whose usages should be checked by the rule. */
const APIS_TO_CHECK = [
    checker.INPUT_INITIALIZER_FN,
    checker.MODEL_INITIALIZER_FN,
    ...checker.OUTPUT_INITIALIZER_FNS,
    ...checker.QUERY_INITIALIZER_FNS,
];
/**
 * Rule that flags any initializer APIs that are used outside of an initializer.
 */
class InitializerApiUsageRule {
    reflector;
    importedSymbolsTracker;
    constructor(reflector, importedSymbolsTracker) {
        this.reflector = reflector;
        this.importedSymbolsTracker = importedSymbolsTracker;
    }
    shouldCheck(sourceFile) {
        // Skip the traversal if there are no imports of the initializer APIs.
        return APIS_TO_CHECK.some(({ functionName, owningModule }) => {
            return (this.importedSymbolsTracker.hasNamedImport(sourceFile, functionName, owningModule) ||
                this.importedSymbolsTracker.hasNamespaceImport(sourceFile, owningModule));
        });
    }
    checkNode(node) {
        // We only care about call expressions.
        if (!ts.isCallExpression(node)) {
            return null;
        }
        // Unwrap any parenthesized and `as` expressions since they don't affect the runtime behavior.
        while (node.parent &&
            (ts.isParenthesizedExpression(node.parent) || ts.isAsExpression(node.parent))) {
            node = node.parent;
        }
        if (!node.parent || !ts.isCallExpression(node)) {
            return null;
        }
        const identifiedInitializer = checker.tryParseInitializerApi(APIS_TO_CHECK, node, this.reflector, this.importedSymbolsTracker);
        if (identifiedInitializer === null) {
            return null;
        }
        const functionName = identifiedInitializer.api.functionName +
            (identifiedInitializer.isRequired ? '.required' : '');
        if (ts.isPropertyDeclaration(node.parent) && node.parent.initializer === node) {
            let closestClass = node.parent;
            while (closestClass && !ts.isClassDeclaration(closestClass)) {
                closestClass = closestClass.parent;
            }
            if (closestClass && ts.isClassDeclaration(closestClass)) {
                const decorators = this.reflector.getDecoratorsOfDeclaration(closestClass);
                const isComponentOrDirective = decorators !== null &&
                    decorators.some((decorator) => {
                        return (decorator.import?.from === '@angular/core' &&
                            (decorator.name === 'Component' || decorator.name === 'Directive'));
                    });
                return isComponentOrDirective
                    ? null
                    : checker.makeDiagnostic(checker.ErrorCode.UNSUPPORTED_INITIALIZER_API_USAGE, node, `Unsupported call to the ${functionName} function. This function can only be used as the initializer ` +
                        `of a property on a @Component or @Directive class.`);
            }
        }
        return checker.makeDiagnostic(checker.ErrorCode.UNSUPPORTED_INITIALIZER_API_USAGE, node, `Unsupported call to the ${functionName} function. This function can only be called in the initializer of a class member.`);
    }
}

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
/**
 * Rule that flags unused symbols inside of the `imports` array of a component.
 */
class UnusedStandaloneImportsRule {
    templateTypeChecker;
    typeCheckingConfig;
    importedSymbolsTracker;
    constructor(templateTypeChecker, typeCheckingConfig, importedSymbolsTracker) {
        this.templateTypeChecker = templateTypeChecker;
        this.typeCheckingConfig = typeCheckingConfig;
        this.importedSymbolsTracker = importedSymbolsTracker;
    }
    shouldCheck(sourceFile) {
        return (this.typeCheckingConfig.unusedStandaloneImports !== 'suppress' &&
            (this.importedSymbolsTracker.hasNamedImport(sourceFile, 'Component', '@angular/core') ||
                this.importedSymbolsTracker.hasNamespaceImport(sourceFile, '@angular/core')));
    }
    checkNode(node) {
        if (!ts.isClassDeclaration(node)) {
            return null;
        }
        const metadata = this.templateTypeChecker.getDirectiveMetadata(node);
        if (!metadata ||
            !metadata.isStandalone ||
            metadata.rawImports === null ||
            metadata.imports === null ||
            metadata.imports.length === 0) {
            return null;
        }
        const usedDirectives = this.templateTypeChecker.getUsedDirectives(node);
        const usedPipes = this.templateTypeChecker.getUsedPipes(node);
        // These will be null if the component is invalid for some reason.
        if (!usedDirectives || !usedPipes) {
            return null;
        }
        const unused = this.getUnusedSymbols(metadata, new Set(usedDirectives.map((dir) => dir.ref.node)), new Set(usedPipes));
        if (unused === null) {
            return null;
        }
        const propertyAssignment = closestNode(metadata.rawImports, ts.isPropertyAssignment);
        const category = this.typeCheckingConfig.unusedStandaloneImports === 'error'
            ? ts.DiagnosticCategory.Error
            : ts.DiagnosticCategory.Warning;
        if (unused.length === metadata.imports.length && propertyAssignment !== null) {
            return checker.makeDiagnostic(checker.ErrorCode.UNUSED_STANDALONE_IMPORTS, propertyAssignment.name, 'All imports are unused', undefined, category);
        }
        return unused.map((ref) => {
            const diagnosticNode = ref.getIdentityInExpression(metadata.rawImports) ||
                ref.getIdentityIn(node.getSourceFile()) ||
                metadata.rawImports;
            return checker.makeDiagnostic(checker.ErrorCode.UNUSED_STANDALONE_IMPORTS, diagnosticNode, `${ref.node.name.text} is not used within the template of ${metadata.name}`, undefined, category);
        });
    }
    getUnusedSymbols(metadata, usedDirectives, usedPipes) {
        const { imports, rawImports } = metadata;
        if (imports === null || rawImports === null) {
            return null;
        }
        let unused = null;
        for (const current of imports) {
            const currentNode = current.node;
            const dirMeta = this.templateTypeChecker.getDirectiveMetadata(currentNode);
            if (dirMeta !== null) {
                if (dirMeta.isStandalone &&
                    !usedDirectives.has(currentNode) &&
                    !this.isPotentialSharedReference(current, rawImports)) {
                    unused ??= [];
                    unused.push(current);
                }
                continue;
            }
            const pipeMeta = this.templateTypeChecker.getPipeMetadata(currentNode);
            if (pipeMeta !== null &&
                pipeMeta.isStandalone &&
                !usedPipes.has(pipeMeta.name) &&
                !this.isPotentialSharedReference(current, rawImports)) {
                unused ??= [];
                unused.push(current);
            }
        }
        return unused;
    }
    /**
     * Determines if an import reference *might* be coming from a shared imports array.
     * @param reference Reference to be checked.
     * @param rawImports AST node that defines the `imports` array.
     */
    isPotentialSharedReference(reference, rawImports) {
        // If the reference is defined directly in the `imports` array, it cannot be shared.
        if (reference.getIdentityInExpression(rawImports) !== null) {
            return false;
        }
        // The reference might be shared if it comes from an exported array. If the variable is local
        /// to the file, then it likely isn't shared. Note that this has the potential for false
        // positives if a non-exported array of imports is shared between components in the same
        // file. This scenario is unlikely and even if we report the diagnostic for it, it would be
        // okay since the user only has to refactor components within the same file, rather than the
        // entire application.
        let current = reference.getIdentityIn(rawImports.getSourceFile());
        while (current !== null) {
            if (ts.isVariableStatement(current)) {
                return !!current.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
            }
            // `Node.parent` can be undefined, but the TS types don't reflect it.
            // Coerce to null so the value is consitent with the type.
            current = current.parent ?? null;
        }
        // Otherwise the reference likely comes from an imported
        // symbol like an array of shared common components.
        return true;
    }
}
/** Gets the closest parent node of a certain type. */
function closestNode(start, predicate) {
    let current = start.parent;
    while (current) {
        if (predicate(current)) {
            return current;
        }
        else {
            current = current.parent;
        }
    }
    return null;
}

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
/**
 * Validates that TypeScript files match a specific set of rules set by the Angular compiler.
 */
class SourceFileValidator {
    rules;
    constructor(reflector, importedSymbolsTracker, templateTypeChecker, typeCheckingConfig) {
        this.rules = [new InitializerApiUsageRule(reflector, importedSymbolsTracker)];
        {
            this.rules.push(new UnusedStandaloneImportsRule(templateTypeChecker, typeCheckingConfig, importedSymbolsTracker));
        }
    }
    /**
     * Gets the diagnostics for a specific file, or null if the file is valid.
     * @param sourceFile File to be checked.
     */
    getDiagnosticsForFile(sourceFile) {
        if (sourceFile.isDeclarationFile || sourceFile.fileName.endsWith('.ngtypecheck.ts')) {
            return null;
        }
        let rulesToRun = null;
        for (const rule of this.rules) {
            if (rule.shouldCheck(sourceFile)) {
                rulesToRun ??= [];
                rulesToRun.push(rule);
            }
        }
        if (rulesToRun === null) {
            return null;
        }
        let fileDiagnostics = null;
        sourceFile.forEachChild(function walk(node) {
            // Note: non-null assertion is here because of g3.
            for (const rule of rulesToRun) {
                const nodeDiagnostics = rule.checkNode(node);
                if (nodeDiagnostics !== null) {
                    fileDiagnostics ??= [];
                    if (Array.isArray(nodeDiagnostics)) {
                        fileDiagnostics.push(...nodeDiagnostics);
                    }
                    else {
                        fileDiagnostics.push(nodeDiagnostics);
                    }
                }
            }
            node.forEachChild(walk);
        });
        return fileDiagnostics;
    }
}

function coreHasSymbol(program, symbol) {
    const checker = program.getTypeChecker();
    for (const sf of program.getSourceFiles().filter(isMaybeCore)) {
        const sym = checker.getSymbolAtLocation(sf);
        if (sym === undefined || sym.exports === undefined) {
            continue;
        }
        if (!sym.exports.has('ɵɵtemplate')) {
            // This is not @angular/core.
            continue;
        }
        return sym.exports.has(symbol.name);
    }
    // No @angular/core file found, so we have no information.
    return null;
}
function isMaybeCore(sf) {
    return (sf.isDeclarationFile &&
        sf.fileName.includes('@angular/core') &&
        sf.fileName.endsWith('index.d.ts'));
}

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var re = {exports: {}};

var constants;
var hasRequiredConstants;

function requireConstants () {
	if (hasRequiredConstants) return constants;
	hasRequiredConstants = 1;
	// Note: this is the semver.org version of the spec that it implements
	// Not necessarily the package version of this code.
	const SEMVER_SPEC_VERSION = '2.0.0';

	const MAX_LENGTH = 256;
	const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER ||
	/* istanbul ignore next */ 9007199254740991;

	// Max safe segment length for coercion.
	const MAX_SAFE_COMPONENT_LENGTH = 16;

	// Max safe length for a build identifier. The max length minus 6 characters for
	// the shortest version with a build 0.0.0+BUILD.
	const MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;

	const RELEASE_TYPES = [
	  'major',
	  'premajor',
	  'minor',
	  'preminor',
	  'patch',
	  'prepatch',
	  'prerelease',
	];

	constants = {
	  MAX_LENGTH,
	  MAX_SAFE_COMPONENT_LENGTH,
	  MAX_SAFE_BUILD_LENGTH,
	  MAX_SAFE_INTEGER,
	  RELEASE_TYPES,
	  SEMVER_SPEC_VERSION,
	  FLAG_INCLUDE_PRERELEASE: 0b001,
	  FLAG_LOOSE: 0b010,
	};
	return constants;
}

var debug_1;
var hasRequiredDebug;

function requireDebug () {
	if (hasRequiredDebug) return debug_1;
	hasRequiredDebug = 1;
	const debug = (
	  typeof process === 'object' &&
	  process.env &&
	  process.env.NODE_DEBUG &&
	  /\bsemver\b/i.test(process.env.NODE_DEBUG)
	) ? (...args) => console.error('SEMVER', ...args)
	  : () => {};

	debug_1 = debug;
	return debug_1;
}

var hasRequiredRe;

function requireRe () {
	if (hasRequiredRe) return re.exports;
	hasRequiredRe = 1;
	(function (module, exports) {
		const {
		  MAX_SAFE_COMPONENT_LENGTH,
		  MAX_SAFE_BUILD_LENGTH,
		  MAX_LENGTH,
		} = requireConstants();
		const debug = requireDebug();
		exports = module.exports = {};

		// The actual regexps go on exports.re
		const re = exports.re = [];
		const safeRe = exports.safeRe = [];
		const src = exports.src = [];
		const safeSrc = exports.safeSrc = [];
		const t = exports.t = {};
		let R = 0;

		const LETTERDASHNUMBER = '[a-zA-Z0-9-]';

		// Replace some greedy regex tokens to prevent regex dos issues. These regex are
		// used internally via the safeRe object since all inputs in this library get
		// normalized first to trim and collapse all extra whitespace. The original
		// regexes are exported for userland consumption and lower level usage. A
		// future breaking change could export the safer regex only with a note that
		// all input should have extra whitespace removed.
		const safeRegexReplacements = [
		  ['\\s', 1],
		  ['\\d', MAX_LENGTH],
		  [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH],
		];

		const makeSafeRegex = (value) => {
		  for (const [token, max] of safeRegexReplacements) {
		    value = value
		      .split(`${token}*`).join(`${token}{0,${max}}`)
		      .split(`${token}+`).join(`${token}{1,${max}}`);
		  }
		  return value
		};

		const createToken = (name, value, isGlobal) => {
		  const safe = makeSafeRegex(value);
		  const index = R++;
		  debug(name, index, value);
		  t[name] = index;
		  src[index] = value;
		  safeSrc[index] = safe;
		  re[index] = new RegExp(value, isGlobal ? 'g' : undefined);
		  safeRe[index] = new RegExp(safe, isGlobal ? 'g' : undefined);
		};

		// The following Regular Expressions can be used for tokenizing,
		// validating, and parsing SemVer version strings.

		// ## Numeric Identifier
		// A single `0`, or a non-zero digit followed by zero or more digits.

		createToken('NUMERICIDENTIFIER', '0|[1-9]\\d*');
		createToken('NUMERICIDENTIFIERLOOSE', '\\d+');

		// ## Non-numeric Identifier
		// Zero or more digits, followed by a letter or hyphen, and then zero or
		// more letters, digits, or hyphens.

		createToken('NONNUMERICIDENTIFIER', `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);

		// ## Main Version
		// Three dot-separated numeric identifiers.

		createToken('MAINVERSION', `(${src[t.NUMERICIDENTIFIER]})\\.` +
		                   `(${src[t.NUMERICIDENTIFIER]})\\.` +
		                   `(${src[t.NUMERICIDENTIFIER]})`);

		createToken('MAINVERSIONLOOSE', `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` +
		                        `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` +
		                        `(${src[t.NUMERICIDENTIFIERLOOSE]})`);

		// ## Pre-release Version Identifier
		// A numeric identifier, or a non-numeric identifier.

		createToken('PRERELEASEIDENTIFIER', `(?:${src[t.NUMERICIDENTIFIER]
		}|${src[t.NONNUMERICIDENTIFIER]})`);

		createToken('PRERELEASEIDENTIFIERLOOSE', `(?:${src[t.NUMERICIDENTIFIERLOOSE]
		}|${src[t.NONNUMERICIDENTIFIER]})`);

		// ## Pre-release Version
		// Hyphen, followed by one or more dot-separated pre-release version
		// identifiers.

		createToken('PRERELEASE', `(?:-(${src[t.PRERELEASEIDENTIFIER]
		}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);

		createToken('PRERELEASELOOSE', `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]
		}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);

		// ## Build Metadata Identifier
		// Any combination of digits, letters, or hyphens.

		createToken('BUILDIDENTIFIER', `${LETTERDASHNUMBER}+`);

		// ## Build Metadata
		// Plus sign, followed by one or more period-separated build metadata
		// identifiers.

		createToken('BUILD', `(?:\\+(${src[t.BUILDIDENTIFIER]
		}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);

		// ## Full Version String
		// A main version, followed optionally by a pre-release version and
		// build metadata.

		// Note that the only major, minor, patch, and pre-release sections of
		// the version string are capturing groups.  The build metadata is not a
		// capturing group, because it should not ever be used in version
		// comparison.

		createToken('FULLPLAIN', `v?${src[t.MAINVERSION]
		}${src[t.PRERELEASE]}?${
		  src[t.BUILD]}?`);

		createToken('FULL', `^${src[t.FULLPLAIN]}$`);

		// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
		// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
		// common in the npm registry.
		createToken('LOOSEPLAIN', `[v=\\s]*${src[t.MAINVERSIONLOOSE]
		}${src[t.PRERELEASELOOSE]}?${
		  src[t.BUILD]}?`);

		createToken('LOOSE', `^${src[t.LOOSEPLAIN]}$`);

		createToken('GTLT', '((?:<|>)?=?)');

		// Something like "2.*" or "1.2.x".
		// Note that "x.x" is a valid xRange identifer, meaning "any version"
		// Only the first item is strictly required.
		createToken('XRANGEIDENTIFIERLOOSE', `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
		createToken('XRANGEIDENTIFIER', `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);

		createToken('XRANGEPLAIN', `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})` +
		                   `(?:\\.(${src[t.XRANGEIDENTIFIER]})` +
		                   `(?:\\.(${src[t.XRANGEIDENTIFIER]})` +
		                   `(?:${src[t.PRERELEASE]})?${
		                     src[t.BUILD]}?` +
		                   `)?)?`);

		createToken('XRANGEPLAINLOOSE', `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})` +
		                        `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` +
		                        `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` +
		                        `(?:${src[t.PRERELEASELOOSE]})?${
		                          src[t.BUILD]}?` +
		                        `)?)?`);

		createToken('XRANGE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
		createToken('XRANGELOOSE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);

		// Coercion.
		// Extract anything that could conceivably be a part of a valid semver
		createToken('COERCEPLAIN', `${'(^|[^\\d])' +
		              '(\\d{1,'}${MAX_SAFE_COMPONENT_LENGTH}})` +
		              `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?` +
		              `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
		createToken('COERCE', `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
		createToken('COERCEFULL', src[t.COERCEPLAIN] +
		              `(?:${src[t.PRERELEASE]})?` +
		              `(?:${src[t.BUILD]})?` +
		              `(?:$|[^\\d])`);
		createToken('COERCERTL', src[t.COERCE], true);
		createToken('COERCERTLFULL', src[t.COERCEFULL], true);

		// Tilde ranges.
		// Meaning is "reasonably at or greater than"
		createToken('LONETILDE', '(?:~>?)');

		createToken('TILDETRIM', `(\\s*)${src[t.LONETILDE]}\\s+`, true);
		exports.tildeTrimReplace = '$1~';

		createToken('TILDE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
		createToken('TILDELOOSE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);

		// Caret ranges.
		// Meaning is "at least and backwards compatible with"
		createToken('LONECARET', '(?:\\^)');

		createToken('CARETTRIM', `(\\s*)${src[t.LONECARET]}\\s+`, true);
		exports.caretTrimReplace = '$1^';

		createToken('CARET', `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
		createToken('CARETLOOSE', `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);

		// A simple gt/lt/eq thing, or just "" to indicate "any version"
		createToken('COMPARATORLOOSE', `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
		createToken('COMPARATOR', `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);

		// An expression to strip any whitespace between the gtlt and the thing
		// it modifies, so that `> 1.2.3` ==> `>1.2.3`
		createToken('COMPARATORTRIM', `(\\s*)${src[t.GTLT]
		}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
		exports.comparatorTrimReplace = '$1$2$3';

		// Something like `1.2.3 - 1.2.4`
		// Note that these all use the loose form, because they'll be
		// checked against either the strict or loose comparator form
		// later.
		createToken('HYPHENRANGE', `^\\s*(${src[t.XRANGEPLAIN]})` +
		                   `\\s+-\\s+` +
		                   `(${src[t.XRANGEPLAIN]})` +
		                   `\\s*$`);

		createToken('HYPHENRANGELOOSE', `^\\s*(${src[t.XRANGEPLAINLOOSE]})` +
		                        `\\s+-\\s+` +
		                        `(${src[t.XRANGEPLAINLOOSE]})` +
		                        `\\s*$`);

		// Star ranges basically just allow anything at all.
		createToken('STAR', '(<|>)?=?\\s*\\*');
		// >=0.0.0 is like a star
		createToken('GTE0', '^\\s*>=\\s*0\\.0\\.0\\s*$');
		createToken('GTE0PRE', '^\\s*>=\\s*0\\.0\\.0-0\\s*$'); 
	} (re, re.exports));
	return re.exports;
}

var parseOptions_1;
var hasRequiredParseOptions;

function requireParseOptions () {
	if (hasRequiredParseOptions) return parseOptions_1;
	hasRequiredParseOptions = 1;
	// parse out just the options we care about
	const looseOption = Object.freeze({ loose: true });
	const emptyOpts = Object.freeze({ });
	const parseOptions = options => {
	  if (!options) {
	    return emptyOpts
	  }

	  if (typeof options !== 'object') {
	    return looseOption
	  }

	  return options
	};
	parseOptions_1 = parseOptions;
	return parseOptions_1;
}

var identifiers;
var hasRequiredIdentifiers;

function requireIdentifiers () {
	if (hasRequiredIdentifiers) return identifiers;
	hasRequiredIdentifiers = 1;
	const numeric = /^[0-9]+$/;
	const compareIdentifiers = (a, b) => {
	  const anum = numeric.test(a);
	  const bnum = numeric.test(b);

	  if (anum && bnum) {
	    a = +a;
	    b = +b;
	  }

	  return a === b ? 0
	    : (anum && !bnum) ? -1
	    : (bnum && !anum) ? 1
	    : a < b ? -1
	    : 1
	};

	const rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);

	identifiers = {
	  compareIdentifiers,
	  rcompareIdentifiers,
	};
	return identifiers;
}

var semver$2;
var hasRequiredSemver$1;

function requireSemver$1 () {
	if (hasRequiredSemver$1) return semver$2;
	hasRequiredSemver$1 = 1;
	const debug = requireDebug();
	const { MAX_LENGTH, MAX_SAFE_INTEGER } = requireConstants();
	const { safeRe: re, safeSrc: src, t } = requireRe();

	const parseOptions = requireParseOptions();
	const { compareIdentifiers } = requireIdentifiers();
	class SemVer {
	  constructor (version, options) {
	    options = parseOptions(options);

	    if (version instanceof SemVer) {
	      if (version.loose === !!options.loose &&
	        version.includePrerelease === !!options.includePrerelease) {
	        return version
	      } else {
	        version = version.version;
	      }
	    } else if (typeof version !== 'string') {
	      throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`)
	    }

	    if (version.length > MAX_LENGTH) {
	      throw new TypeError(
	        `version is longer than ${MAX_LENGTH} characters`
	      )
	    }

	    debug('SemVer', version, options);
	    this.options = options;
	    this.loose = !!options.loose;
	    // this isn't actually relevant for versions, but keep it so that we
	    // don't run into trouble passing this.options around.
	    this.includePrerelease = !!options.includePrerelease;

	    const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);

	    if (!m) {
	      throw new TypeError(`Invalid Version: ${version}`)
	    }

	    this.raw = version;

	    // these are actually numbers
	    this.major = +m[1];
	    this.minor = +m[2];
	    this.patch = +m[3];

	    if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
	      throw new TypeError('Invalid major version')
	    }

	    if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
	      throw new TypeError('Invalid minor version')
	    }

	    if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
	      throw new TypeError('Invalid patch version')
	    }

	    // numberify any prerelease numeric ids
	    if (!m[4]) {
	      this.prerelease = [];
	    } else {
	      this.prerelease = m[4].split('.').map((id) => {
	        if (/^[0-9]+$/.test(id)) {
	          const num = +id;
	          if (num >= 0 && num < MAX_SAFE_INTEGER) {
	            return num
	          }
	        }
	        return id
	      });
	    }

	    this.build = m[5] ? m[5].split('.') : [];
	    this.format();
	  }

	  format () {
	    this.version = `${this.major}.${this.minor}.${this.patch}`;
	    if (this.prerelease.length) {
	      this.version += `-${this.prerelease.join('.')}`;
	    }
	    return this.version
	  }

	  toString () {
	    return this.version
	  }

	  compare (other) {
	    debug('SemVer.compare', this.version, this.options, other);
	    if (!(other instanceof SemVer)) {
	      if (typeof other === 'string' && other === this.version) {
	        return 0
	      }
	      other = new SemVer(other, this.options);
	    }

	    if (other.version === this.version) {
	      return 0
	    }

	    return this.compareMain(other) || this.comparePre(other)
	  }

	  compareMain (other) {
	    if (!(other instanceof SemVer)) {
	      other = new SemVer(other, this.options);
	    }

	    return (
	      compareIdentifiers(this.major, other.major) ||
	      compareIdentifiers(this.minor, other.minor) ||
	      compareIdentifiers(this.patch, other.patch)
	    )
	  }

	  comparePre (other) {
	    if (!(other instanceof SemVer)) {
	      other = new SemVer(other, this.options);
	    }

	    // NOT having a prerelease is > having one
	    if (this.prerelease.length && !other.prerelease.length) {
	      return -1
	    } else if (!this.prerelease.length && other.prerelease.length) {
	      return 1
	    } else if (!this.prerelease.length && !other.prerelease.length) {
	      return 0
	    }

	    let i = 0;
	    do {
	      const a = this.prerelease[i];
	      const b = other.prerelease[i];
	      debug('prerelease compare', i, a, b);
	      if (a === undefined && b === undefined) {
	        return 0
	      } else if (b === undefined) {
	        return 1
	      } else if (a === undefined) {
	        return -1
	      } else if (a === b) {
	        continue
	      } else {
	        return compareIdentifiers(a, b)
	      }
	    } while (++i)
	  }

	  compareBuild (other) {
	    if (!(other instanceof SemVer)) {
	      other = new SemVer(other, this.options);
	    }

	    let i = 0;
	    do {
	      const a = this.build[i];
	      const b = other.build[i];
	      debug('build compare', i, a, b);
	      if (a === undefined && b === undefined) {
	        return 0
	      } else if (b === undefined) {
	        return 1
	      } else if (a === undefined) {
	        return -1
	      } else if (a === b) {
	        continue
	      } else {
	        return compareIdentifiers(a, b)
	      }
	    } while (++i)
	  }

	  // preminor will bump the version up to the next minor release, and immediately
	  // down to pre-release. premajor and prepatch work the same way.
	  inc (release, identifier, identifierBase) {
	    if (release.startsWith('pre')) {
	      if (!identifier && identifierBase === false) {
	        throw new Error('invalid increment argument: identifier is empty')
	      }
	      // Avoid an invalid semver results
	      if (identifier) {
	        const r = new RegExp(`^${this.options.loose ? src[t.PRERELEASELOOSE] : src[t.PRERELEASE]}$`);
	        const match = `-${identifier}`.match(r);
	        if (!match || match[1] !== identifier) {
	          throw new Error(`invalid identifier: ${identifier}`)
	        }
	      }
	    }

	    switch (release) {
	      case 'premajor':
	        this.prerelease.length = 0;
	        this.patch = 0;
	        this.minor = 0;
	        this.major++;
	        this.inc('pre', identifier, identifierBase);
	        break
	      case 'preminor':
	        this.prerelease.length = 0;
	        this.patch = 0;
	        this.minor++;
	        this.inc('pre', identifier, identifierBase);
	        break
	      case 'prepatch':
	        // If this is already a prerelease, it will bump to the next version
	        // drop any prereleases that might already exist, since they are not
	        // relevant at this point.
	        this.prerelease.length = 0;
	        this.inc('patch', identifier, identifierBase);
	        this.inc('pre', identifier, identifierBase);
	        break
	      // If the input is a non-prerelease version, this acts the same as
	      // prepatch.
	      case 'prerelease':
	        if (this.prerelease.length === 0) {
	          this.inc('patch', identifier, identifierBase);
	        }
	        this.inc('pre', identifier, identifierBase);
	        break
	      case 'release':
	        if (this.prerelease.length === 0) {
	          throw new Error(`version ${this.raw} is not a prerelease`)
	        }
	        this.prerelease.length = 0;
	        break

	      case 'major':
	        // If this is a pre-major version, bump up to the same major version.
	        // Otherwise increment major.
	        // 1.0.0-5 bumps to 1.0.0
	        // 1.1.0 bumps to 2.0.0
	        if (
	          this.minor !== 0 ||
	          this.patch !== 0 ||
	          this.prerelease.length === 0
	        ) {
	          this.major++;
	        }
	        this.minor = 0;
	        this.patch = 0;
	        this.prerelease = [];
	        break
	      case 'minor':
	        // If this is a pre-minor version, bump up to the same minor version.
	        // Otherwise increment minor.
	        // 1.2.0-5 bumps to 1.2.0
	        // 1.2.1 bumps to 1.3.0
	        if (this.patch !== 0 || this.prerelease.length === 0) {
	          this.minor++;
	        }
	        this.patch = 0;
	        this.prerelease = [];
	        break
	      case 'patch':
	        // If this is not a pre-release version, it will increment the patch.
	        // If it is a pre-release it will bump up to the same patch version.
	        // 1.2.0-5 patches to 1.2.0
	        // 1.2.0 patches to 1.2.1
	        if (this.prerelease.length === 0) {
	          this.patch++;
	        }
	        this.prerelease = [];
	        break
	      // This probably shouldn't be used publicly.
	      // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
	      case 'pre': {
	        const base = Number(identifierBase) ? 1 : 0;

	        if (this.prerelease.length === 0) {
	          this.prerelease = [base];
	        } else {
	          let i = this.prerelease.length;
	          while (--i >= 0) {
	            if (typeof this.prerelease[i] === 'number') {
	              this.prerelease[i]++;
	              i = -2;
	            }
	          }
	          if (i === -1) {
	            // didn't increment anything
	            if (identifier === this.prerelease.join('.') && identifierBase === false) {
	              throw new Error('invalid increment argument: identifier already exists')
	            }
	            this.prerelease.push(base);
	          }
	        }
	        if (identifier) {
	          // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
	          // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
	          let prerelease = [identifier, base];
	          if (identifierBase === false) {
	            prerelease = [identifier];
	          }
	          if (compareIdentifiers(this.prerelease[0], identifier) === 0) {
	            if (isNaN(this.prerelease[1])) {
	              this.prerelease = prerelease;
	            }
	          } else {
	            this.prerelease = prerelease;
	          }
	        }
	        break
	      }
	      default:
	        throw new Error(`invalid increment argument: ${release}`)
	    }
	    this.raw = this.format();
	    if (this.build.length) {
	      this.raw += `+${this.build.join('.')}`;
	    }
	    return this
	  }
	}

	semver$2 = SemVer;
	return semver$2;
}

var parse_1;
var hasRequiredParse;

function requireParse () {
	if (hasRequiredParse) return parse_1;
	hasRequiredParse = 1;
	const SemVer = requireSemver$1();
	const parse = (version, options, throwErrors = false) => {
	  if (version instanceof SemVer) {
	    return version
	  }
	  try {
	    return new SemVer(version, options)
	  } catch (er) {
	    if (!throwErrors) {
	      return null
	    }
	    throw er
	  }
	};

	parse_1 = parse;
	return parse_1;
}

var valid_1;
var hasRequiredValid$1;

function requireValid$1 () {
	if (hasRequiredValid$1) return valid_1;
	hasRequiredValid$1 = 1;
	const parse = requireParse();
	const valid = (version, options) => {
	  const v = parse(version, options);
	  return v ? v.version : null
	};
	valid_1 = valid;
	return valid_1;
}

var clean_1;
var hasRequiredClean;

function requireClean () {
	if (hasRequiredClean) return clean_1;
	hasRequiredClean = 1;
	const parse = requireParse();
	const clean = (version, options) => {
	  const s = parse(version.trim().replace(/^[=v]+/, ''), options);
	  return s ? s.version : null
	};
	clean_1 = clean;
	return clean_1;
}

var inc_1;
var hasRequiredInc;

function requireInc () {
	if (hasRequiredInc) return inc_1;
	hasRequiredInc = 1;
	const SemVer = requireSemver$1();

	const inc = (version, release, options, identifier, identifierBase) => {
	  if (typeof (options) === 'string') {
	    identifierBase = identifier;
	    identifier = options;
	    options = undefined;
	  }

	  try {
	    return new SemVer(
	      version instanceof SemVer ? version.version : version,
	      options
	    ).inc(release, identifier, identifierBase).version
	  } catch (er) {
	    return null
	  }
	};
	inc_1 = inc;
	return inc_1;
}

var diff_1;
var hasRequiredDiff;

function requireDiff () {
	if (hasRequiredDiff) return diff_1;
	hasRequiredDiff = 1;
	const parse = requireParse();

	const diff = (version1, version2) => {
	  const v1 = parse(version1, null, true);
	  const v2 = parse(version2, null, true);
	  const comparison = v1.compare(v2);

	  if (comparison === 0) {
	    return null
	  }

	  const v1Higher = comparison > 0;
	  const highVersion = v1Higher ? v1 : v2;
	  const lowVersion = v1Higher ? v2 : v1;
	  const highHasPre = !!highVersion.prerelease.length;
	  const lowHasPre = !!lowVersion.prerelease.length;

	  if (lowHasPre && !highHasPre) {
	    // Going from prerelease -> no prerelease requires some special casing

	    // If the low version has only a major, then it will always be a major
	    // Some examples:
	    // 1.0.0-1 -> 1.0.0
	    // 1.0.0-1 -> 1.1.1
	    // 1.0.0-1 -> 2.0.0
	    if (!lowVersion.patch && !lowVersion.minor) {
	      return 'major'
	    }

	    // If the main part has no difference
	    if (lowVersion.compareMain(highVersion) === 0) {
	      if (lowVersion.minor && !lowVersion.patch) {
	        return 'minor'
	      }
	      return 'patch'
	    }
	  }

	  // add the `pre` prefix if we are going to a prerelease version
	  const prefix = highHasPre ? 'pre' : '';

	  if (v1.major !== v2.major) {
	    return prefix + 'major'
	  }

	  if (v1.minor !== v2.minor) {
	    return prefix + 'minor'
	  }

	  if (v1.patch !== v2.patch) {
	    return prefix + 'patch'
	  }

	  // high and low are preleases
	  return 'prerelease'
	};

	diff_1 = diff;
	return diff_1;
}

var major_1;
var hasRequiredMajor;

function requireMajor () {
	if (hasRequiredMajor) return major_1;
	hasRequiredMajor = 1;
	const SemVer = requireSemver$1();
	const major = (a, loose) => new SemVer(a, loose).major;
	major_1 = major;
	return major_1;
}

var minor_1;
var hasRequiredMinor;

function requireMinor () {
	if (hasRequiredMinor) return minor_1;
	hasRequiredMinor = 1;
	const SemVer = requireSemver$1();
	const minor = (a, loose) => new SemVer(a, loose).minor;
	minor_1 = minor;
	return minor_1;
}

var patch_1;
var hasRequiredPatch;

function requirePatch () {
	if (hasRequiredPatch) return patch_1;
	hasRequiredPatch = 1;
	const SemVer = requireSemver$1();
	const patch = (a, loose) => new SemVer(a, loose).patch;
	patch_1 = patch;
	return patch_1;
}

var prerelease_1;
var hasRequiredPrerelease;

function requirePrerelease () {
	if (hasRequiredPrerelease) return prerelease_1;
	hasRequiredPrerelease = 1;
	const parse = requireParse();
	const prerelease = (version, options) => {
	  const parsed = parse(version, options);
	  return (parsed && parsed.prerelease.length) ? parsed.prerelease : null
	};
	prerelease_1 = prerelease;
	return prerelease_1;
}

var compare_1;
var hasRequiredCompare;

function requireCompare () {
	if (hasRequiredCompare) return compare_1;
	hasRequiredCompare = 1;
	const SemVer = requireSemver$1();
	const compare = (a, b, loose) =>
	  new SemVer(a, loose).compare(new SemVer(b, loose));

	compare_1 = compare;
	return compare_1;
}

var rcompare_1;
var hasRequiredRcompare;

function requireRcompare () {
	if (hasRequiredRcompare) return rcompare_1;
	hasRequiredRcompare = 1;
	const compare = requireCompare();
	const rcompare = (a, b, loose) => compare(b, a, loose);
	rcompare_1 = rcompare;
	return rcompare_1;
}

var compareLoose_1;
var hasRequiredCompareLoose;

function requireCompareLoose () {
	if (hasRequiredCompareLoose) return compareLoose_1;
	hasRequiredCompareLoose = 1;
	const compare = requireCompare();
	const compareLoose = (a, b) => compare(a, b, true);
	compareLoose_1 = compareLoose;
	return compareLoose_1;
}

var compareBuild_1;
var hasRequiredCompareBuild;

function requireCompareBuild () {
	if (hasRequiredCompareBuild) return compareBuild_1;
	hasRequiredCompareBuild = 1;
	const SemVer = requireSemver$1();
	const compareBuild = (a, b, loose) => {
	  const versionA = new SemVer(a, loose);
	  const versionB = new SemVer(b, loose);
	  return versionA.compare(versionB) || versionA.compareBuild(versionB)
	};
	compareBuild_1 = compareBuild;
	return compareBuild_1;
}

var sort_1;
var hasRequiredSort;

function requireSort () {
	if (hasRequiredSort) return sort_1;
	hasRequiredSort = 1;
	const compareBuild = requireCompareBuild();
	const sort = (list, loose) => list.sort((a, b) => compareBuild(a, b, loose));
	sort_1 = sort;
	return sort_1;
}

var rsort_1;
var hasRequiredRsort;

function requireRsort () {
	if (hasRequiredRsort) return rsort_1;
	hasRequiredRsort = 1;
	const compareBuild = requireCompareBuild();
	const rsort = (list, loose) => list.sort((a, b) => compareBuild(b, a, loose));
	rsort_1 = rsort;
	return rsort_1;
}

var gt_1;
var hasRequiredGt;

function requireGt () {
	if (hasRequiredGt) return gt_1;
	hasRequiredGt = 1;
	const compare = requireCompare();
	const gt = (a, b, loose) => compare(a, b, loose) > 0;
	gt_1 = gt;
	return gt_1;
}

var lt_1;
var hasRequiredLt;

function requireLt () {
	if (hasRequiredLt) return lt_1;
	hasRequiredLt = 1;
	const compare = requireCompare();
	const lt = (a, b, loose) => compare(a, b, loose) < 0;
	lt_1 = lt;
	return lt_1;
}

var eq_1;
var hasRequiredEq;

function requireEq () {
	if (hasRequiredEq) return eq_1;
	hasRequiredEq = 1;
	const compare = requireCompare();
	const eq = (a, b, loose) => compare(a, b, loose) === 0;
	eq_1 = eq;
	return eq_1;
}

var neq_1;
var hasRequiredNeq;

function requireNeq () {
	if (hasRequiredNeq) return neq_1;
	hasRequiredNeq = 1;
	const compare = requireCompare();
	const neq = (a, b, loose) => compare(a, b, loose) !== 0;
	neq_1 = neq;
	return neq_1;
}

var gte_1;
var hasRequiredGte;

function requireGte () {
	if (hasRequiredGte) return gte_1;
	hasRequiredGte = 1;
	const compare = requireCompare();
	const gte = (a, b, loose) => compare(a, b, loose) >= 0;
	gte_1 = gte;
	return gte_1;
}

var lte_1;
var hasRequiredLte;

function requireLte () {
	if (hasRequiredLte) return lte_1;
	hasRequiredLte = 1;
	const compare = requireCompare();
	const lte = (a, b, loose) => compare(a, b, loose) <= 0;
	lte_1 = lte;
	return lte_1;
}

var cmp_1;
var hasRequiredCmp;

function requireCmp () {
	if (hasRequiredCmp) return cmp_1;
	hasRequiredCmp = 1;
	const eq = requireEq();
	const neq = requireNeq();
	const gt = requireGt();
	const gte = requireGte();
	const lt = requireLt();
	const lte = requireLte();

	const cmp = (a, op, b, loose) => {
	  switch (op) {
	    case '===':
	      if (typeof a === 'object') {
	        a = a.version;
	      }
	      if (typeof b === 'object') {
	        b = b.version;
	      }
	      return a === b

	    case '!==':
	      if (typeof a === 'object') {
	        a = a.version;
	      }
	      if (typeof b === 'object') {
	        b = b.version;
	      }
	      return a !== b

	    case '':
	    case '=':
	    case '==':
	      return eq(a, b, loose)

	    case '!=':
	      return neq(a, b, loose)

	    case '>':
	      return gt(a, b, loose)

	    case '>=':
	      return gte(a, b, loose)

	    case '<':
	      return lt(a, b, loose)

	    case '<=':
	      return lte(a, b, loose)

	    default:
	      throw new TypeError(`Invalid operator: ${op}`)
	  }
	};
	cmp_1 = cmp;
	return cmp_1;
}

var coerce_1;
var hasRequiredCoerce;

function requireCoerce () {
	if (hasRequiredCoerce) return coerce_1;
	hasRequiredCoerce = 1;
	const SemVer = requireSemver$1();
	const parse = requireParse();
	const { safeRe: re, t } = requireRe();

	const coerce = (version, options) => {
	  if (version instanceof SemVer) {
	    return version
	  }

	  if (typeof version === 'number') {
	    version = String(version);
	  }

	  if (typeof version !== 'string') {
	    return null
	  }

	  options = options || {};

	  let match = null;
	  if (!options.rtl) {
	    match = version.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
	  } else {
	    // Find the right-most coercible string that does not share
	    // a terminus with a more left-ward coercible string.
	    // Eg, '1.2.3.4' wants to coerce '2.3.4', not '3.4' or '4'
	    // With includePrerelease option set, '1.2.3.4-rc' wants to coerce '2.3.4-rc', not '2.3.4'
	    //
	    // Walk through the string checking with a /g regexp
	    // Manually set the index so as to pick up overlapping matches.
	    // Stop when we get a match that ends at the string end, since no
	    // coercible string can be more right-ward without the same terminus.
	    const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
	    let next;
	    while ((next = coerceRtlRegex.exec(version)) &&
	        (!match || match.index + match[0].length !== version.length)
	    ) {
	      if (!match ||
	            next.index + next[0].length !== match.index + match[0].length) {
	        match = next;
	      }
	      coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
	    }
	    // leave it in a clean state
	    coerceRtlRegex.lastIndex = -1;
	  }

	  if (match === null) {
	    return null
	  }

	  const major = match[2];
	  const minor = match[3] || '0';
	  const patch = match[4] || '0';
	  const prerelease = options.includePrerelease && match[5] ? `-${match[5]}` : '';
	  const build = options.includePrerelease && match[6] ? `+${match[6]}` : '';

	  return parse(`${major}.${minor}.${patch}${prerelease}${build}`, options)
	};
	coerce_1 = coerce;
	return coerce_1;
}

var lrucache;
var hasRequiredLrucache;

function requireLrucache () {
	if (hasRequiredLrucache) return lrucache;
	hasRequiredLrucache = 1;
	class LRUCache {
	  constructor () {
	    this.max = 1000;
	    this.map = new Map();
	  }

	  get (key) {
	    const value = this.map.get(key);
	    if (value === undefined) {
	      return undefined
	    } else {
	      // Remove the key from the map and add it to the end
	      this.map.delete(key);
	      this.map.set(key, value);
	      return value
	    }
	  }

	  delete (key) {
	    return this.map.delete(key)
	  }

	  set (key, value) {
	    const deleted = this.delete(key);

	    if (!deleted && value !== undefined) {
	      // If cache is full, delete the least recently used item
	      if (this.map.size >= this.max) {
	        const firstKey = this.map.keys().next().value;
	        this.delete(firstKey);
	      }

	      this.map.set(key, value);
	    }

	    return this
	  }
	}

	lrucache = LRUCache;
	return lrucache;
}

var range;
var hasRequiredRange;

function requireRange () {
	if (hasRequiredRange) return range;
	hasRequiredRange = 1;
	const SPACE_CHARACTERS = /\s+/g;

	// hoisted class for cyclic dependency
	class Range {
	  constructor (range, options) {
	    options = parseOptions(options);

	    if (range instanceof Range) {
	      if (
	        range.loose === !!options.loose &&
	        range.includePrerelease === !!options.includePrerelease
	      ) {
	        return range
	      } else {
	        return new Range(range.raw, options)
	      }
	    }

	    if (range instanceof Comparator) {
	      // just put it in the set and return
	      this.raw = range.value;
	      this.set = [[range]];
	      this.formatted = undefined;
	      return this
	    }

	    this.options = options;
	    this.loose = !!options.loose;
	    this.includePrerelease = !!options.includePrerelease;

	    // First reduce all whitespace as much as possible so we do not have to rely
	    // on potentially slow regexes like \s*. This is then stored and used for
	    // future error messages as well.
	    this.raw = range.trim().replace(SPACE_CHARACTERS, ' ');

	    // First, split on ||
	    this.set = this.raw
	      .split('||')
	      // map the range to a 2d array of comparators
	      .map(r => this.parseRange(r.trim()))
	      // throw out any comparator lists that are empty
	      // this generally means that it was not a valid range, which is allowed
	      // in loose mode, but will still throw if the WHOLE range is invalid.
	      .filter(c => c.length);

	    if (!this.set.length) {
	      throw new TypeError(`Invalid SemVer Range: ${this.raw}`)
	    }

	    // if we have any that are not the null set, throw out null sets.
	    if (this.set.length > 1) {
	      // keep the first one, in case they're all null sets
	      const first = this.set[0];
	      this.set = this.set.filter(c => !isNullSet(c[0]));
	      if (this.set.length === 0) {
	        this.set = [first];
	      } else if (this.set.length > 1) {
	        // if we have any that are *, then the range is just *
	        for (const c of this.set) {
	          if (c.length === 1 && isAny(c[0])) {
	            this.set = [c];
	            break
	          }
	        }
	      }
	    }

	    this.formatted = undefined;
	  }

	  get range () {
	    if (this.formatted === undefined) {
	      this.formatted = '';
	      for (let i = 0; i < this.set.length; i++) {
	        if (i > 0) {
	          this.formatted += '||';
	        }
	        const comps = this.set[i];
	        for (let k = 0; k < comps.length; k++) {
	          if (k > 0) {
	            this.formatted += ' ';
	          }
	          this.formatted += comps[k].toString().trim();
	        }
	      }
	    }
	    return this.formatted
	  }

	  format () {
	    return this.range
	  }

	  toString () {
	    return this.range
	  }

	  parseRange (range) {
	    // memoize range parsing for performance.
	    // this is a very hot path, and fully deterministic.
	    const memoOpts =
	      (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) |
	      (this.options.loose && FLAG_LOOSE);
	    const memoKey = memoOpts + ':' + range;
	    const cached = cache.get(memoKey);
	    if (cached) {
	      return cached
	    }

	    const loose = this.options.loose;
	    // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
	    const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
	    range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
	    debug('hyphen replace', range);

	    // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
	    range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
	    debug('comparator trim', range);

	    // `~ 1.2.3` => `~1.2.3`
	    range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
	    debug('tilde trim', range);

	    // `^ 1.2.3` => `^1.2.3`
	    range = range.replace(re[t.CARETTRIM], caretTrimReplace);
	    debug('caret trim', range);

	    // At this point, the range is completely trimmed and
	    // ready to be split into comparators.

	    let rangeList = range
	      .split(' ')
	      .map(comp => parseComparator(comp, this.options))
	      .join(' ')
	      .split(/\s+/)
	      // >=0.0.0 is equivalent to *
	      .map(comp => replaceGTE0(comp, this.options));

	    if (loose) {
	      // in loose mode, throw out any that are not valid comparators
	      rangeList = rangeList.filter(comp => {
	        debug('loose invalid filter', comp, this.options);
	        return !!comp.match(re[t.COMPARATORLOOSE])
	      });
	    }
	    debug('range list', rangeList);

	    // if any comparators are the null set, then replace with JUST null set
	    // if more than one comparator, remove any * comparators
	    // also, don't include the same comparator more than once
	    const rangeMap = new Map();
	    const comparators = rangeList.map(comp => new Comparator(comp, this.options));
	    for (const comp of comparators) {
	      if (isNullSet(comp)) {
	        return [comp]
	      }
	      rangeMap.set(comp.value, comp);
	    }
	    if (rangeMap.size > 1 && rangeMap.has('')) {
	      rangeMap.delete('');
	    }

	    const result = [...rangeMap.values()];
	    cache.set(memoKey, result);
	    return result
	  }

	  intersects (range, options) {
	    if (!(range instanceof Range)) {
	      throw new TypeError('a Range is required')
	    }

	    return this.set.some((thisComparators) => {
	      return (
	        isSatisfiable(thisComparators, options) &&
	        range.set.some((rangeComparators) => {
	          return (
	            isSatisfiable(rangeComparators, options) &&
	            thisComparators.every((thisComparator) => {
	              return rangeComparators.every((rangeComparator) => {
	                return thisComparator.intersects(rangeComparator, options)
	              })
	            })
	          )
	        })
	      )
	    })
	  }

	  // if ANY of the sets match ALL of its comparators, then pass
	  test (version) {
	    if (!version) {
	      return false
	    }

	    if (typeof version === 'string') {
	      try {
	        version = new SemVer(version, this.options);
	      } catch (er) {
	        return false
	      }
	    }

	    for (let i = 0; i < this.set.length; i++) {
	      if (testSet(this.set[i], version, this.options)) {
	        return true
	      }
	    }
	    return false
	  }
	}

	range = Range;

	const LRU = requireLrucache();
	const cache = new LRU();

	const parseOptions = requireParseOptions();
	const Comparator = requireComparator();
	const debug = requireDebug();
	const SemVer = requireSemver$1();
	const {
	  safeRe: re,
	  t,
	  comparatorTrimReplace,
	  tildeTrimReplace,
	  caretTrimReplace,
	} = requireRe();
	const { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = requireConstants();

	const isNullSet = c => c.value === '<0.0.0-0';
	const isAny = c => c.value === '';

	// take a set of comparators and determine whether there
	// exists a version which can satisfy it
	const isSatisfiable = (comparators, options) => {
	  let result = true;
	  const remainingComparators = comparators.slice();
	  let testComparator = remainingComparators.pop();

	  while (result && remainingComparators.length) {
	    result = remainingComparators.every((otherComparator) => {
	      return testComparator.intersects(otherComparator, options)
	    });

	    testComparator = remainingComparators.pop();
	  }

	  return result
	};

	// comprised of xranges, tildes, stars, and gtlt's at this point.
	// already replaced the hyphen ranges
	// turn into a set of JUST comparators.
	const parseComparator = (comp, options) => {
	  debug('comp', comp, options);
	  comp = replaceCarets(comp, options);
	  debug('caret', comp);
	  comp = replaceTildes(comp, options);
	  debug('tildes', comp);
	  comp = replaceXRanges(comp, options);
	  debug('xrange', comp);
	  comp = replaceStars(comp, options);
	  debug('stars', comp);
	  return comp
	};

	const isX = id => !id || id.toLowerCase() === 'x' || id === '*';

	// ~, ~> --> * (any, kinda silly)
	// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0-0
	// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0-0
	// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0-0
	// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0-0
	// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0-0
	// ~0.0.1 --> >=0.0.1 <0.1.0-0
	const replaceTildes = (comp, options) => {
	  return comp
	    .trim()
	    .split(/\s+/)
	    .map((c) => replaceTilde(c, options))
	    .join(' ')
	};

	const replaceTilde = (comp, options) => {
	  const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
	  return comp.replace(r, (_, M, m, p, pr) => {
	    debug('tilde', comp, _, M, m, p, pr);
	    let ret;

	    if (isX(M)) {
	      ret = '';
	    } else if (isX(m)) {
	      ret = `>=${M}.0.0 <${+M + 1}.0.0-0`;
	    } else if (isX(p)) {
	      // ~1.2 == >=1.2.0 <1.3.0-0
	      ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0-0`;
	    } else if (pr) {
	      debug('replaceTilde pr', pr);
	      ret = `>=${M}.${m}.${p}-${pr
	      } <${M}.${+m + 1}.0-0`;
	    } else {
	      // ~1.2.3 == >=1.2.3 <1.3.0-0
	      ret = `>=${M}.${m}.${p
	      } <${M}.${+m + 1}.0-0`;
	    }

	    debug('tilde return', ret);
	    return ret
	  })
	};

	// ^ --> * (any, kinda silly)
	// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0-0
	// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0-0
	// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0-0
	// ^1.2.3 --> >=1.2.3 <2.0.0-0
	// ^1.2.0 --> >=1.2.0 <2.0.0-0
	// ^0.0.1 --> >=0.0.1 <0.0.2-0
	// ^0.1.0 --> >=0.1.0 <0.2.0-0
	const replaceCarets = (comp, options) => {
	  return comp
	    .trim()
	    .split(/\s+/)
	    .map((c) => replaceCaret(c, options))
	    .join(' ')
	};

	const replaceCaret = (comp, options) => {
	  debug('caret', comp, options);
	  const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
	  const z = options.includePrerelease ? '-0' : '';
	  return comp.replace(r, (_, M, m, p, pr) => {
	    debug('caret', comp, _, M, m, p, pr);
	    let ret;

	    if (isX(M)) {
	      ret = '';
	    } else if (isX(m)) {
	      ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
	    } else if (isX(p)) {
	      if (M === '0') {
	        ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
	      } else {
	        ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
	      }
	    } else if (pr) {
	      debug('replaceCaret pr', pr);
	      if (M === '0') {
	        if (m === '0') {
	          ret = `>=${M}.${m}.${p}-${pr
	          } <${M}.${m}.${+p + 1}-0`;
	        } else {
	          ret = `>=${M}.${m}.${p}-${pr
	          } <${M}.${+m + 1}.0-0`;
	        }
	      } else {
	        ret = `>=${M}.${m}.${p}-${pr
	        } <${+M + 1}.0.0-0`;
	      }
	    } else {
	      debug('no pr');
	      if (M === '0') {
	        if (m === '0') {
	          ret = `>=${M}.${m}.${p
	          }${z} <${M}.${m}.${+p + 1}-0`;
	        } else {
	          ret = `>=${M}.${m}.${p
	          }${z} <${M}.${+m + 1}.0-0`;
	        }
	      } else {
	        ret = `>=${M}.${m}.${p
	        } <${+M + 1}.0.0-0`;
	      }
	    }

	    debug('caret return', ret);
	    return ret
	  })
	};

	const replaceXRanges = (comp, options) => {
	  debug('replaceXRanges', comp, options);
	  return comp
	    .split(/\s+/)
	    .map((c) => replaceXRange(c, options))
	    .join(' ')
	};

	const replaceXRange = (comp, options) => {
	  comp = comp.trim();
	  const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
	  return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
	    debug('xRange', comp, ret, gtlt, M, m, p, pr);
	    const xM = isX(M);
	    const xm = xM || isX(m);
	    const xp = xm || isX(p);
	    const anyX = xp;

	    if (gtlt === '=' && anyX) {
	      gtlt = '';
	    }

	    // if we're including prereleases in the match, then we need
	    // to fix this to -0, the lowest possible prerelease value
	    pr = options.includePrerelease ? '-0' : '';

	    if (xM) {
	      if (gtlt === '>' || gtlt === '<') {
	        // nothing is allowed
	        ret = '<0.0.0-0';
	      } else {
	        // nothing is forbidden
	        ret = '*';
	      }
	    } else if (gtlt && anyX) {
	      // we know patch is an x, because we have any x at all.
	      // replace X with 0
	      if (xm) {
	        m = 0;
	      }
	      p = 0;

	      if (gtlt === '>') {
	        // >1 => >=2.0.0
	        // >1.2 => >=1.3.0
	        gtlt = '>=';
	        if (xm) {
	          M = +M + 1;
	          m = 0;
	          p = 0;
	        } else {
	          m = +m + 1;
	          p = 0;
	        }
	      } else if (gtlt === '<=') {
	        // <=0.7.x is actually <0.8.0, since any 0.7.x should
	        // pass.  Similarly, <=7.x is actually <8.0.0, etc.
	        gtlt = '<';
	        if (xm) {
	          M = +M + 1;
	        } else {
	          m = +m + 1;
	        }
	      }

	      if (gtlt === '<') {
	        pr = '-0';
	      }

	      ret = `${gtlt + M}.${m}.${p}${pr}`;
	    } else if (xm) {
	      ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
	    } else if (xp) {
	      ret = `>=${M}.${m}.0${pr
	      } <${M}.${+m + 1}.0-0`;
	    }

	    debug('xRange return', ret);

	    return ret
	  })
	};

	// Because * is AND-ed with everything else in the comparator,
	// and '' means "any version", just remove the *s entirely.
	const replaceStars = (comp, options) => {
	  debug('replaceStars', comp, options);
	  // Looseness is ignored here.  star is always as loose as it gets!
	  return comp
	    .trim()
	    .replace(re[t.STAR], '')
	};

	const replaceGTE0 = (comp, options) => {
	  debug('replaceGTE0', comp, options);
	  return comp
	    .trim()
	    .replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], '')
	};

	// This function is passed to string.replace(re[t.HYPHENRANGE])
	// M, m, patch, prerelease, build
	// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
	// 1.2.3 - 3.4 => >=1.2.0 <3.5.0-0 Any 3.4.x will do
	// 1.2 - 3.4 => >=1.2.0 <3.5.0-0
	// TODO build?
	const hyphenReplace = incPr => ($0,
	  from, fM, fm, fp, fpr, fb,
	  to, tM, tm, tp, tpr) => {
	  if (isX(fM)) {
	    from = '';
	  } else if (isX(fm)) {
	    from = `>=${fM}.0.0${incPr ? '-0' : ''}`;
	  } else if (isX(fp)) {
	    from = `>=${fM}.${fm}.0${incPr ? '-0' : ''}`;
	  } else if (fpr) {
	    from = `>=${from}`;
	  } else {
	    from = `>=${from}${incPr ? '-0' : ''}`;
	  }

	  if (isX(tM)) {
	    to = '';
	  } else if (isX(tm)) {
	    to = `<${+tM + 1}.0.0-0`;
	  } else if (isX(tp)) {
	    to = `<${tM}.${+tm + 1}.0-0`;
	  } else if (tpr) {
	    to = `<=${tM}.${tm}.${tp}-${tpr}`;
	  } else if (incPr) {
	    to = `<${tM}.${tm}.${+tp + 1}-0`;
	  } else {
	    to = `<=${to}`;
	  }

	  return `${from} ${to}`.trim()
	};

	const testSet = (set, version, options) => {
	  for (let i = 0; i < set.length; i++) {
	    if (!set[i].test(version)) {
	      return false
	    }
	  }

	  if (version.prerelease.length && !options.includePrerelease) {
	    // Find the set of versions that are allowed to have prereleases
	    // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
	    // That should allow `1.2.3-pr.2` to pass.
	    // However, `1.2.4-alpha.notready` should NOT be allowed,
	    // even though it's within the range set by the comparators.
	    for (let i = 0; i < set.length; i++) {
	      debug(set[i].semver);
	      if (set[i].semver === Comparator.ANY) {
	        continue
	      }

	      if (set[i].semver.prerelease.length > 0) {
	        const allowed = set[i].semver;
	        if (allowed.major === version.major &&
	            allowed.minor === version.minor &&
	            allowed.patch === version.patch) {
	          return true
	        }
	      }
	    }

	    // Version has a -pre, but it's not one of the ones we like.
	    return false
	  }

	  return true
	};
	return range;
}

var comparator;
var hasRequiredComparator;

function requireComparator () {
	if (hasRequiredComparator) return comparator;
	hasRequiredComparator = 1;
	const ANY = Symbol('SemVer ANY');
	// hoisted class for cyclic dependency
	class Comparator {
	  static get ANY () {
	    return ANY
	  }

	  constructor (comp, options) {
	    options = parseOptions(options);

	    if (comp instanceof Comparator) {
	      if (comp.loose === !!options.loose) {
	        return comp
	      } else {
	        comp = comp.value;
	      }
	    }

	    comp = comp.trim().split(/\s+/).join(' ');
	    debug('comparator', comp, options);
	    this.options = options;
	    this.loose = !!options.loose;
	    this.parse(comp);

	    if (this.semver === ANY) {
	      this.value = '';
	    } else {
	      this.value = this.operator + this.semver.version;
	    }

	    debug('comp', this);
	  }

	  parse (comp) {
	    const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
	    const m = comp.match(r);

	    if (!m) {
	      throw new TypeError(`Invalid comparator: ${comp}`)
	    }

	    this.operator = m[1] !== undefined ? m[1] : '';
	    if (this.operator === '=') {
	      this.operator = '';
	    }

	    // if it literally is just '>' or '' then allow anything.
	    if (!m[2]) {
	      this.semver = ANY;
	    } else {
	      this.semver = new SemVer(m[2], this.options.loose);
	    }
	  }

	  toString () {
	    return this.value
	  }

	  test (version) {
	    debug('Comparator.test', version, this.options.loose);

	    if (this.semver === ANY || version === ANY) {
	      return true
	    }

	    if (typeof version === 'string') {
	      try {
	        version = new SemVer(version, this.options);
	      } catch (er) {
	        return false
	      }
	    }

	    return cmp(version, this.operator, this.semver, this.options)
	  }

	  intersects (comp, options) {
	    if (!(comp instanceof Comparator)) {
	      throw new TypeError('a Comparator is required')
	    }

	    if (this.operator === '') {
	      if (this.value === '') {
	        return true
	      }
	      return new Range(comp.value, options).test(this.value)
	    } else if (comp.operator === '') {
	      if (comp.value === '') {
	        return true
	      }
	      return new Range(this.value, options).test(comp.semver)
	    }

	    options = parseOptions(options);

	    // Special cases where nothing can possibly be lower
	    if (options.includePrerelease &&
	      (this.value === '<0.0.0-0' || comp.value === '<0.0.0-0')) {
	      return false
	    }
	    if (!options.includePrerelease &&
	      (this.value.startsWith('<0.0.0') || comp.value.startsWith('<0.0.0'))) {
	      return false
	    }

	    // Same direction increasing (> or >=)
	    if (this.operator.startsWith('>') && comp.operator.startsWith('>')) {
	      return true
	    }
	    // Same direction decreasing (< or <=)
	    if (this.operator.startsWith('<') && comp.operator.startsWith('<')) {
	      return true
	    }
	    // same SemVer and both sides are inclusive (<= or >=)
	    if (
	      (this.semver.version === comp.semver.version) &&
	      this.operator.includes('=') && comp.operator.includes('=')) {
	      return true
	    }
	    // opposite directions less than
	    if (cmp(this.semver, '<', comp.semver, options) &&
	      this.operator.startsWith('>') && comp.operator.startsWith('<')) {
	      return true
	    }
	    // opposite directions greater than
	    if (cmp(this.semver, '>', comp.semver, options) &&
	      this.operator.startsWith('<') && comp.operator.startsWith('>')) {
	      return true
	    }
	    return false
	  }
	}

	comparator = Comparator;

	const parseOptions = requireParseOptions();
	const { safeRe: re, t } = requireRe();
	const cmp = requireCmp();
	const debug = requireDebug();
	const SemVer = requireSemver$1();
	const Range = requireRange();
	return comparator;
}

var satisfies_1;
var hasRequiredSatisfies;

function requireSatisfies () {
	if (hasRequiredSatisfies) return satisfies_1;
	hasRequiredSatisfies = 1;
	const Range = requireRange();
	const satisfies = (version, range, options) => {
	  try {
	    range = new Range(range, options);
	  } catch (er) {
	    return false
	  }
	  return range.test(version)
	};
	satisfies_1 = satisfies;
	return satisfies_1;
}

var toComparators_1;
var hasRequiredToComparators;

function requireToComparators () {
	if (hasRequiredToComparators) return toComparators_1;
	hasRequiredToComparators = 1;
	const Range = requireRange();

	// Mostly just for testing and legacy API reasons
	const toComparators = (range, options) =>
	  new Range(range, options).set
	    .map(comp => comp.map(c => c.value).join(' ').trim().split(' '));

	toComparators_1 = toComparators;
	return toComparators_1;
}

var maxSatisfying_1;
var hasRequiredMaxSatisfying;

function requireMaxSatisfying () {
	if (hasRequiredMaxSatisfying) return maxSatisfying_1;
	hasRequiredMaxSatisfying = 1;
	const SemVer = requireSemver$1();
	const Range = requireRange();

	const maxSatisfying = (versions, range, options) => {
	  let max = null;
	  let maxSV = null;
	  let rangeObj = null;
	  try {
	    rangeObj = new Range(range, options);
	  } catch (er) {
	    return null
	  }
	  versions.forEach((v) => {
	    if (rangeObj.test(v)) {
	      // satisfies(v, range, options)
	      if (!max || maxSV.compare(v) === -1) {
	        // compare(max, v, true)
	        max = v;
	        maxSV = new SemVer(max, options);
	      }
	    }
	  });
	  return max
	};
	maxSatisfying_1 = maxSatisfying;
	return maxSatisfying_1;
}

var minSatisfying_1;
var hasRequiredMinSatisfying;

function requireMinSatisfying () {
	if (hasRequiredMinSatisfying) return minSatisfying_1;
	hasRequiredMinSatisfying = 1;
	const SemVer = requireSemver$1();
	const Range = requireRange();
	const minSatisfying = (versions, range, options) => {
	  let min = null;
	  let minSV = null;
	  let rangeObj = null;
	  try {
	    rangeObj = new Range(range, options);
	  } catch (er) {
	    return null
	  }
	  versions.forEach((v) => {
	    if (rangeObj.test(v)) {
	      // satisfies(v, range, options)
	      if (!min || minSV.compare(v) === 1) {
	        // compare(min, v, true)
	        min = v;
	        minSV = new SemVer(min, options);
	      }
	    }
	  });
	  return min
	};
	minSatisfying_1 = minSatisfying;
	return minSatisfying_1;
}

var minVersion_1;
var hasRequiredMinVersion;

function requireMinVersion () {
	if (hasRequiredMinVersion) return minVersion_1;
	hasRequiredMinVersion = 1;
	const SemVer = requireSemver$1();
	const Range = requireRange();
	const gt = requireGt();

	const minVersion = (range, loose) => {
	  range = new Range(range, loose);

	  let minver = new SemVer('0.0.0');
	  if (range.test(minver)) {
	    return minver
	  }

	  minver = new SemVer('0.0.0-0');
	  if (range.test(minver)) {
	    return minver
	  }

	  minver = null;
	  for (let i = 0; i < range.set.length; ++i) {
	    const comparators = range.set[i];

	    let setMin = null;
	    comparators.forEach((comparator) => {
	      // Clone to avoid manipulating the comparator's semver object.
	      const compver = new SemVer(comparator.semver.version);
	      switch (comparator.operator) {
	        case '>':
	          if (compver.prerelease.length === 0) {
	            compver.patch++;
	          } else {
	            compver.prerelease.push(0);
	          }
	          compver.raw = compver.format();
	          /* fallthrough */
	        case '':
	        case '>=':
	          if (!setMin || gt(compver, setMin)) {
	            setMin = compver;
	          }
	          break
	        case '<':
	        case '<=':
	          /* Ignore maximum versions */
	          break
	        /* istanbul ignore next */
	        default:
	          throw new Error(`Unexpected operation: ${comparator.operator}`)
	      }
	    });
	    if (setMin && (!minver || gt(minver, setMin))) {
	      minver = setMin;
	    }
	  }

	  if (minver && range.test(minver)) {
	    return minver
	  }

	  return null
	};
	minVersion_1 = minVersion;
	return minVersion_1;
}

var valid;
var hasRequiredValid;

function requireValid () {
	if (hasRequiredValid) return valid;
	hasRequiredValid = 1;
	const Range = requireRange();
	const validRange = (range, options) => {
	  try {
	    // Return '*' instead of '' so that truthiness works.
	    // This will throw if it's invalid anyway
	    return new Range(range, options).range || '*'
	  } catch (er) {
	    return null
	  }
	};
	valid = validRange;
	return valid;
}

var outside_1;
var hasRequiredOutside;

function requireOutside () {
	if (hasRequiredOutside) return outside_1;
	hasRequiredOutside = 1;
	const SemVer = requireSemver$1();
	const Comparator = requireComparator();
	const { ANY } = Comparator;
	const Range = requireRange();
	const satisfies = requireSatisfies();
	const gt = requireGt();
	const lt = requireLt();
	const lte = requireLte();
	const gte = requireGte();

	const outside = (version, range, hilo, options) => {
	  version = new SemVer(version, options);
	  range = new Range(range, options);

	  let gtfn, ltefn, ltfn, comp, ecomp;
	  switch (hilo) {
	    case '>':
	      gtfn = gt;
	      ltefn = lte;
	      ltfn = lt;
	      comp = '>';
	      ecomp = '>=';
	      break
	    case '<':
	      gtfn = lt;
	      ltefn = gte;
	      ltfn = gt;
	      comp = '<';
	      ecomp = '<=';
	      break
	    default:
	      throw new TypeError('Must provide a hilo val of "<" or ">"')
	  }

	  // If it satisfies the range it is not outside
	  if (satisfies(version, range, options)) {
	    return false
	  }

	  // From now on, variable terms are as if we're in "gtr" mode.
	  // but note that everything is flipped for the "ltr" function.

	  for (let i = 0; i < range.set.length; ++i) {
	    const comparators = range.set[i];

	    let high = null;
	    let low = null;

	    comparators.forEach((comparator) => {
	      if (comparator.semver === ANY) {
	        comparator = new Comparator('>=0.0.0');
	      }
	      high = high || comparator;
	      low = low || comparator;
	      if (gtfn(comparator.semver, high.semver, options)) {
	        high = comparator;
	      } else if (ltfn(comparator.semver, low.semver, options)) {
	        low = comparator;
	      }
	    });

	    // If the edge version comparator has a operator then our version
	    // isn't outside it
	    if (high.operator === comp || high.operator === ecomp) {
	      return false
	    }

	    // If the lowest version comparator has an operator and our version
	    // is less than it then it isn't higher than the range
	    if ((!low.operator || low.operator === comp) &&
	        ltefn(version, low.semver)) {
	      return false
	    } else if (low.operator === ecomp && ltfn(version, low.semver)) {
	      return false
	    }
	  }
	  return true
	};

	outside_1 = outside;
	return outside_1;
}

var gtr_1;
var hasRequiredGtr;

function requireGtr () {
	if (hasRequiredGtr) return gtr_1;
	hasRequiredGtr = 1;
	// Determine if version is greater than all the versions possible in the range.
	const outside = requireOutside();
	const gtr = (version, range, options) => outside(version, range, '>', options);
	gtr_1 = gtr;
	return gtr_1;
}

var ltr_1;
var hasRequiredLtr;

function requireLtr () {
	if (hasRequiredLtr) return ltr_1;
	hasRequiredLtr = 1;
	const outside = requireOutside();
	// Determine if version is less than all the versions possible in the range
	const ltr = (version, range, options) => outside(version, range, '<', options);
	ltr_1 = ltr;
	return ltr_1;
}

var intersects_1;
var hasRequiredIntersects;

function requireIntersects () {
	if (hasRequiredIntersects) return intersects_1;
	hasRequiredIntersects = 1;
	const Range = requireRange();
	const intersects = (r1, r2, options) => {
	  r1 = new Range(r1, options);
	  r2 = new Range(r2, options);
	  return r1.intersects(r2, options)
	};
	intersects_1 = intersects;
	return intersects_1;
}

var simplify;
var hasRequiredSimplify;

function requireSimplify () {
	if (hasRequiredSimplify) return simplify;
	hasRequiredSimplify = 1;
	// given a set of versions and a range, create a "simplified" range
	// that includes the same versions that the original range does
	// If the original range is shorter than the simplified one, return that.
	const satisfies = requireSatisfies();
	const compare = requireCompare();
	simplify = (versions, range, options) => {
	  const set = [];
	  let first = null;
	  let prev = null;
	  const v = versions.sort((a, b) => compare(a, b, options));
	  for (const version of v) {
	    const included = satisfies(version, range, options);
	    if (included) {
	      prev = version;
	      if (!first) {
	        first = version;
	      }
	    } else {
	      if (prev) {
	        set.push([first, prev]);
	      }
	      prev = null;
	      first = null;
	    }
	  }
	  if (first) {
	    set.push([first, null]);
	  }

	  const ranges = [];
	  for (const [min, max] of set) {
	    if (min === max) {
	      ranges.push(min);
	    } else if (!max && min === v[0]) {
	      ranges.push('*');
	    } else if (!max) {
	      ranges.push(`>=${min}`);
	    } else if (min === v[0]) {
	      ranges.push(`<=${max}`);
	    } else {
	      ranges.push(`${min} - ${max}`);
	    }
	  }
	  const simplified = ranges.join(' || ');
	  const original = typeof range.raw === 'string' ? range.raw : String(range);
	  return simplified.length < original.length ? simplified : range
	};
	return simplify;
}

var subset_1;
var hasRequiredSubset;

function requireSubset () {
	if (hasRequiredSubset) return subset_1;
	hasRequiredSubset = 1;
	const Range = requireRange();
	const Comparator = requireComparator();
	const { ANY } = Comparator;
	const satisfies = requireSatisfies();
	const compare = requireCompare();

	// Complex range `r1 || r2 || ...` is a subset of `R1 || R2 || ...` iff:
	// - Every simple range `r1, r2, ...` is a null set, OR
	// - Every simple range `r1, r2, ...` which is not a null set is a subset of
	//   some `R1, R2, ...`
	//
	// Simple range `c1 c2 ...` is a subset of simple range `C1 C2 ...` iff:
	// - If c is only the ANY comparator
	//   - If C is only the ANY comparator, return true
	//   - Else if in prerelease mode, return false
	//   - else replace c with `[>=0.0.0]`
	// - If C is only the ANY comparator
	//   - if in prerelease mode, return true
	//   - else replace C with `[>=0.0.0]`
	// - Let EQ be the set of = comparators in c
	// - If EQ is more than one, return true (null set)
	// - Let GT be the highest > or >= comparator in c
	// - Let LT be the lowest < or <= comparator in c
	// - If GT and LT, and GT.semver > LT.semver, return true (null set)
	// - If any C is a = range, and GT or LT are set, return false
	// - If EQ
	//   - If GT, and EQ does not satisfy GT, return true (null set)
	//   - If LT, and EQ does not satisfy LT, return true (null set)
	//   - If EQ satisfies every C, return true
	//   - Else return false
	// - If GT
	//   - If GT.semver is lower than any > or >= comp in C, return false
	//   - If GT is >=, and GT.semver does not satisfy every C, return false
	//   - If GT.semver has a prerelease, and not in prerelease mode
	//     - If no C has a prerelease and the GT.semver tuple, return false
	// - If LT
	//   - If LT.semver is greater than any < or <= comp in C, return false
	//   - If LT is <=, and LT.semver does not satisfy every C, return false
	//   - If GT.semver has a prerelease, and not in prerelease mode
	//     - If no C has a prerelease and the LT.semver tuple, return false
	// - Else return true

	const subset = (sub, dom, options = {}) => {
	  if (sub === dom) {
	    return true
	  }

	  sub = new Range(sub, options);
	  dom = new Range(dom, options);
	  let sawNonNull = false;

	  OUTER: for (const simpleSub of sub.set) {
	    for (const simpleDom of dom.set) {
	      const isSub = simpleSubset(simpleSub, simpleDom, options);
	      sawNonNull = sawNonNull || isSub !== null;
	      if (isSub) {
	        continue OUTER
	      }
	    }
	    // the null set is a subset of everything, but null simple ranges in
	    // a complex range should be ignored.  so if we saw a non-null range,
	    // then we know this isn't a subset, but if EVERY simple range was null,
	    // then it is a subset.
	    if (sawNonNull) {
	      return false
	    }
	  }
	  return true
	};

	const minimumVersionWithPreRelease = [new Comparator('>=0.0.0-0')];
	const minimumVersion = [new Comparator('>=0.0.0')];

	const simpleSubset = (sub, dom, options) => {
	  if (sub === dom) {
	    return true
	  }

	  if (sub.length === 1 && sub[0].semver === ANY) {
	    if (dom.length === 1 && dom[0].semver === ANY) {
	      return true
	    } else if (options.includePrerelease) {
	      sub = minimumVersionWithPreRelease;
	    } else {
	      sub = minimumVersion;
	    }
	  }

	  if (dom.length === 1 && dom[0].semver === ANY) {
	    if (options.includePrerelease) {
	      return true
	    } else {
	      dom = minimumVersion;
	    }
	  }

	  const eqSet = new Set();
	  let gt, lt;
	  for (const c of sub) {
	    if (c.operator === '>' || c.operator === '>=') {
	      gt = higherGT(gt, c, options);
	    } else if (c.operator === '<' || c.operator === '<=') {
	      lt = lowerLT(lt, c, options);
	    } else {
	      eqSet.add(c.semver);
	    }
	  }

	  if (eqSet.size > 1) {
	    return null
	  }

	  let gtltComp;
	  if (gt && lt) {
	    gtltComp = compare(gt.semver, lt.semver, options);
	    if (gtltComp > 0) {
	      return null
	    } else if (gtltComp === 0 && (gt.operator !== '>=' || lt.operator !== '<=')) {
	      return null
	    }
	  }

	  // will iterate one or zero times
	  for (const eq of eqSet) {
	    if (gt && !satisfies(eq, String(gt), options)) {
	      return null
	    }

	    if (lt && !satisfies(eq, String(lt), options)) {
	      return null
	    }

	    for (const c of dom) {
	      if (!satisfies(eq, String(c), options)) {
	        return false
	      }
	    }

	    return true
	  }

	  let higher, lower;
	  let hasDomLT, hasDomGT;
	  // if the subset has a prerelease, we need a comparator in the superset
	  // with the same tuple and a prerelease, or it's not a subset
	  let needDomLTPre = lt &&
	    !options.includePrerelease &&
	    lt.semver.prerelease.length ? lt.semver : false;
	  let needDomGTPre = gt &&
	    !options.includePrerelease &&
	    gt.semver.prerelease.length ? gt.semver : false;
	  // exception: <1.2.3-0 is the same as <1.2.3
	  if (needDomLTPre && needDomLTPre.prerelease.length === 1 &&
	      lt.operator === '<' && needDomLTPre.prerelease[0] === 0) {
	    needDomLTPre = false;
	  }

	  for (const c of dom) {
	    hasDomGT = hasDomGT || c.operator === '>' || c.operator === '>=';
	    hasDomLT = hasDomLT || c.operator === '<' || c.operator === '<=';
	    if (gt) {
	      if (needDomGTPre) {
	        if (c.semver.prerelease && c.semver.prerelease.length &&
	            c.semver.major === needDomGTPre.major &&
	            c.semver.minor === needDomGTPre.minor &&
	            c.semver.patch === needDomGTPre.patch) {
	          needDomGTPre = false;
	        }
	      }
	      if (c.operator === '>' || c.operator === '>=') {
	        higher = higherGT(gt, c, options);
	        if (higher === c && higher !== gt) {
	          return false
	        }
	      } else if (gt.operator === '>=' && !satisfies(gt.semver, String(c), options)) {
	        return false
	      }
	    }
	    if (lt) {
	      if (needDomLTPre) {
	        if (c.semver.prerelease && c.semver.prerelease.length &&
	            c.semver.major === needDomLTPre.major &&
	            c.semver.minor === needDomLTPre.minor &&
	            c.semver.patch === needDomLTPre.patch) {
	          needDomLTPre = false;
	        }
	      }
	      if (c.operator === '<' || c.operator === '<=') {
	        lower = lowerLT(lt, c, options);
	        if (lower === c && lower !== lt) {
	          return false
	        }
	      } else if (lt.operator === '<=' && !satisfies(lt.semver, String(c), options)) {
	        return false
	      }
	    }
	    if (!c.operator && (lt || gt) && gtltComp !== 0) {
	      return false
	    }
	  }

	  // if there was a < or >, and nothing in the dom, then must be false
	  // UNLESS it was limited by another range in the other direction.
	  // Eg, >1.0.0 <1.0.1 is still a subset of <2.0.0
	  if (gt && hasDomLT && !lt && gtltComp !== 0) {
	    return false
	  }

	  if (lt && hasDomGT && !gt && gtltComp !== 0) {
	    return false
	  }

	  // we needed a prerelease range in a specific tuple, but didn't get one
	  // then this isn't a subset.  eg >=1.2.3-pre is not a subset of >=1.0.0,
	  // because it includes prereleases in the 1.2.3 tuple
	  if (needDomGTPre || needDomLTPre) {
	    return false
	  }

	  return true
	};

	// >=1.2.3 is lower than >1.2.3
	const higherGT = (a, b, options) => {
	  if (!a) {
	    return b
	  }
	  const comp = compare(a.semver, b.semver, options);
	  return comp > 0 ? a
	    : comp < 0 ? b
	    : b.operator === '>' && a.operator === '>=' ? b
	    : a
	};

	// <=1.2.3 is higher than <1.2.3
	const lowerLT = (a, b, options) => {
	  if (!a) {
	    return b
	  }
	  const comp = compare(a.semver, b.semver, options);
	  return comp < 0 ? a
	    : comp > 0 ? b
	    : b.operator === '<' && a.operator === '<=' ? b
	    : a
	};

	subset_1 = subset;
	return subset_1;
}

var semver$1;
var hasRequiredSemver;

function requireSemver () {
	if (hasRequiredSemver) return semver$1;
	hasRequiredSemver = 1;
	// just pre-load all the stuff that index.js lazily exports
	const internalRe = requireRe();
	const constants = requireConstants();
	const SemVer = requireSemver$1();
	const identifiers = requireIdentifiers();
	const parse = requireParse();
	const valid = requireValid$1();
	const clean = requireClean();
	const inc = requireInc();
	const diff = requireDiff();
	const major = requireMajor();
	const minor = requireMinor();
	const patch = requirePatch();
	const prerelease = requirePrerelease();
	const compare = requireCompare();
	const rcompare = requireRcompare();
	const compareLoose = requireCompareLoose();
	const compareBuild = requireCompareBuild();
	const sort = requireSort();
	const rsort = requireRsort();
	const gt = requireGt();
	const lt = requireLt();
	const eq = requireEq();
	const neq = requireNeq();
	const gte = requireGte();
	const lte = requireLte();
	const cmp = requireCmp();
	const coerce = requireCoerce();
	const Comparator = requireComparator();
	const Range = requireRange();
	const satisfies = requireSatisfies();
	const toComparators = requireToComparators();
	const maxSatisfying = requireMaxSatisfying();
	const minSatisfying = requireMinSatisfying();
	const minVersion = requireMinVersion();
	const validRange = requireValid();
	const outside = requireOutside();
	const gtr = requireGtr();
	const ltr = requireLtr();
	const intersects = requireIntersects();
	const simplifyRange = requireSimplify();
	const subset = requireSubset();
	semver$1 = {
	  parse,
	  valid,
	  clean,
	  inc,
	  diff,
	  major,
	  minor,
	  patch,
	  prerelease,
	  compare,
	  rcompare,
	  compareLoose,
	  compareBuild,
	  sort,
	  rsort,
	  gt,
	  lt,
	  eq,
	  neq,
	  gte,
	  lte,
	  cmp,
	  coerce,
	  Comparator,
	  Range,
	  satisfies,
	  toComparators,
	  maxSatisfying,
	  minSatisfying,
	  minVersion,
	  validRange,
	  outside,
	  gtr,
	  ltr,
	  intersects,
	  simplifyRange,
	  subset,
	  SemVer,
	  re: internalRe.re,
	  src: internalRe.src,
	  tokens: internalRe.t,
	  SEMVER_SPEC_VERSION: constants.SEMVER_SPEC_VERSION,
	  RELEASE_TYPES: constants.RELEASE_TYPES,
	  compareIdentifiers: identifiers.compareIdentifiers,
	  rcompareIdentifiers: identifiers.rcompareIdentifiers,
	};
	return semver$1;
}

var semverExports = requireSemver();
var semver = /*@__PURE__*/getDefaultExportFromCjs(semverExports);

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
// Note: semver isn't available internally so this import will be commented out.
// When adding more dependencies here, the caretaker may have to update a patch internally.
/**
 * Whether a version of `@angular/core` supports a specific feature.
 * @param coreVersion Current version of core.
 * @param minVersion Minimum required version for the feature.
 */
function coreVersionSupportsFeature(coreVersion, minVersion) {
    // A version of `20.0.0-next.5+sha-9228a73` usually means that core is at head so it supports
    // all features. Use string interpolation prevent the placeholder from being replaced
    // with the current version during build time.
    if (coreVersion === `0.0.0-${'PLACEHOLDER'}`) {
        return true;
    }
    return semver.satisfies(coreVersion, minVersion, { includePrerelease: true });
}

/**
 * Discriminant type for a `CompilationTicket`.
 */
var CompilationTicketKind;
(function (CompilationTicketKind) {
    CompilationTicketKind[CompilationTicketKind["Fresh"] = 0] = "Fresh";
    CompilationTicketKind[CompilationTicketKind["IncrementalTypeScript"] = 1] = "IncrementalTypeScript";
    CompilationTicketKind[CompilationTicketKind["IncrementalResource"] = 2] = "IncrementalResource";
})(CompilationTicketKind || (CompilationTicketKind = {}));
/**
 * Create a `CompilationTicket` for a brand new compilation, using no prior state.
 */
function freshCompilationTicket(tsProgram, options, incrementalBuildStrategy, programDriver, perfRecorder, enableTemplateTypeChecker, usePoisonedData) {
    return {
        kind: CompilationTicketKind.Fresh,
        tsProgram,
        options,
        incrementalBuildStrategy,
        programDriver,
        enableTemplateTypeChecker,
        usePoisonedData,
        perfRecorder: perfRecorder ?? ActivePerfRecorder.zeroedToNow(),
    };
}
/**
 * Create a `CompilationTicket` as efficiently as possible, based on a previous `NgCompiler`
 * instance and a new `ts.Program`.
 */
function incrementalFromCompilerTicket(oldCompiler, newProgram, incrementalBuildStrategy, programDriver, modifiedResourceFiles, perfRecorder) {
    const oldProgram = oldCompiler.getCurrentProgram();
    const oldState = oldCompiler.incrementalStrategy.getIncrementalState(oldProgram);
    if (oldState === null) {
        // No incremental step is possible here, since no IncrementalState was found for the old
        // program.
        return freshCompilationTicket(newProgram, oldCompiler.options, incrementalBuildStrategy, programDriver, perfRecorder, oldCompiler.enableTemplateTypeChecker, oldCompiler.usePoisonedData);
    }
    if (perfRecorder === null) {
        perfRecorder = ActivePerfRecorder.zeroedToNow();
    }
    const incrementalCompilation = IncrementalCompilation.incremental(newProgram, versionMapFromProgram(newProgram, programDriver), oldProgram, oldState, modifiedResourceFiles, perfRecorder);
    return {
        kind: CompilationTicketKind.IncrementalTypeScript,
        enableTemplateTypeChecker: oldCompiler.enableTemplateTypeChecker,
        usePoisonedData: oldCompiler.usePoisonedData,
        options: oldCompiler.options,
        incrementalBuildStrategy,
        incrementalCompilation,
        programDriver,
        newProgram,
        perfRecorder,
    };
}
/**
 * The heart of the Angular Ivy compiler.
 *
 * The `NgCompiler` provides an API for performing Angular compilation within a custom TypeScript
 * compiler. Each instance of `NgCompiler` supports a single compilation, which might be
 * incremental.
 *
 * `NgCompiler` is lazy, and does not perform any of the work of the compilation until one of its
 * output methods (e.g. `getDiagnostics`) is called.
 *
 * See the README.md for more information.
 */
class NgCompiler {
    adapter;
    options;
    inputProgram;
    programDriver;
    incrementalStrategy;
    incrementalCompilation;
    usePoisonedData;
    livePerfRecorder;
    /**
     * Lazily evaluated state of the compilation.
     *
     * This is created on demand by calling `ensureAnalyzed`.
     */
    compilation = null;
    /**
     * Any diagnostics related to the construction of the compilation.
     *
     * These are diagnostics which arose during setup of the host and/or program.
     */
    constructionDiagnostics = [];
    /**
     * Non-template diagnostics related to the program itself. Does not include template
     * diagnostics because the template type checker memoizes them itself.
     *
     * This is set by (and memoizes) `getNonTemplateDiagnostics`.
     */
    nonTemplateDiagnostics = null;
    closureCompilerEnabled;
    currentProgram;
    entryPoint;
    moduleResolver;
    resourceManager;
    cycleAnalyzer;
    ignoreForDiagnostics;
    ignoreForEmit;
    enableTemplateTypeChecker;
    enableBlockSyntax;
    enableLetSyntax;
    angularCoreVersion;
    enableHmr;
    implicitStandaloneValue;
    /**
     * `NgCompiler` can be reused for multiple compilations (for resource-only changes), and each
     * new compilation uses a fresh `PerfRecorder`. Thus, classes created with a lifespan of the
     * `NgCompiler` use a `DelegatingPerfRecorder` so the `PerfRecorder` they write to can be updated
     * with each fresh compilation.
     */
    delegatingPerfRecorder;
    /**
     * Convert a `CompilationTicket` into an `NgCompiler` instance for the requested compilation.
     *
     * Depending on the nature of the compilation request, the `NgCompiler` instance may be reused
     * from a previous compilation and updated with any changes, it may be a new instance which
     * incrementally reuses state from a previous compilation, or it may represent a fresh
     * compilation entirely.
     */
    static fromTicket(ticket, adapter) {
        switch (ticket.kind) {
            case CompilationTicketKind.Fresh:
                return new NgCompiler(adapter, ticket.options, ticket.tsProgram, ticket.programDriver, ticket.incrementalBuildStrategy, IncrementalCompilation.fresh(ticket.tsProgram, versionMapFromProgram(ticket.tsProgram, ticket.programDriver)), ticket.enableTemplateTypeChecker, ticket.usePoisonedData, ticket.perfRecorder);
            case CompilationTicketKind.IncrementalTypeScript:
                return new NgCompiler(adapter, ticket.options, ticket.newProgram, ticket.programDriver, ticket.incrementalBuildStrategy, ticket.incrementalCompilation, ticket.enableTemplateTypeChecker, ticket.usePoisonedData, ticket.perfRecorder);
            case CompilationTicketKind.IncrementalResource:
                const compiler = ticket.compiler;
                compiler.updateWithChangedResources(ticket.modifiedResourceFiles, ticket.perfRecorder);
                return compiler;
        }
    }
    constructor(adapter, options, inputProgram, programDriver, incrementalStrategy, incrementalCompilation, enableTemplateTypeChecker, usePoisonedData, livePerfRecorder) {
        this.adapter = adapter;
        this.options = options;
        this.inputProgram = inputProgram;
        this.programDriver = programDriver;
        this.incrementalStrategy = incrementalStrategy;
        this.incrementalCompilation = incrementalCompilation;
        this.usePoisonedData = usePoisonedData;
        this.livePerfRecorder = livePerfRecorder;
        this.angularCoreVersion = options['_angularCoreVersion'] ?? null;
        this.delegatingPerfRecorder = new DelegatingPerfRecorder(this.perfRecorder);
        this.usePoisonedData = usePoisonedData || !!options._compilePoisonedComponents;
        this.enableTemplateTypeChecker =
            enableTemplateTypeChecker || !!options._enableTemplateTypeChecker;
        // TODO(crisbeto): remove this flag and base `enableBlockSyntax` on the `angularCoreVersion`.
        this.enableBlockSyntax = options['_enableBlockSyntax'] ?? true;
        this.enableLetSyntax = options['_enableLetSyntax'] ?? true;
        // Standalone by default is enabled since v19. We need to toggle it here,
        // because the language service extension may be running with the latest
        // version of the compiler against an older version of Angular.
        this.implicitStandaloneValue =
            this.angularCoreVersion === null ||
                coreVersionSupportsFeature(this.angularCoreVersion, '>= 19.0.0');
        this.enableHmr = !!options['_enableHmr'];
        this.constructionDiagnostics.push(...this.adapter.constructionDiagnostics, ...verifyCompatibleTypeCheckOptions(this.options));
        this.currentProgram = inputProgram;
        this.closureCompilerEnabled = !!this.options.annotateForClosureCompiler;
        this.entryPoint =
            adapter.entryPoint !== null ? checker.getSourceFileOrNull(inputProgram, adapter.entryPoint) : null;
        const moduleResolutionCache = ts.createModuleResolutionCache(this.adapter.getCurrentDirectory(), 
        // doen't retain a reference to `this`, if other closures in the constructor here reference
        // `this` internally then a closure created here would retain them. This can cause major
        // memory leak issues since the `moduleResolutionCache` is a long-lived object and finds its
        // way into all kinds of places inside TS internal objects.
        this.adapter.getCanonicalFileName.bind(this.adapter));
        this.moduleResolver = new ModuleResolver(inputProgram, this.options, this.adapter, moduleResolutionCache);
        this.resourceManager = new AdapterResourceLoader(adapter, this.options);
        this.cycleAnalyzer = new CycleAnalyzer(new ImportGraph(inputProgram.getTypeChecker(), this.delegatingPerfRecorder));
        this.incrementalStrategy.setIncrementalState(this.incrementalCompilation.state, inputProgram);
        this.ignoreForDiagnostics = new Set(inputProgram.getSourceFiles().filter((sf) => this.adapter.isShim(sf)));
        this.ignoreForEmit = this.adapter.ignoreForEmit;
        let dtsFileCount = 0;
        let nonDtsFileCount = 0;
        for (const sf of inputProgram.getSourceFiles()) {
            if (sf.isDeclarationFile) {
                dtsFileCount++;
            }
            else {
                nonDtsFileCount++;
            }
        }
        livePerfRecorder.eventCount(checker.PerfEvent.InputDtsFile, dtsFileCount);
        livePerfRecorder.eventCount(checker.PerfEvent.InputTsFile, nonDtsFileCount);
    }
    get perfRecorder() {
        return this.livePerfRecorder;
    }
    updateWithChangedResources(changedResources, perfRecorder) {
        this.livePerfRecorder = perfRecorder;
        this.delegatingPerfRecorder.target = perfRecorder;
        perfRecorder.inPhase(checker.PerfPhase.ResourceUpdate, () => {
            if (this.compilation === null) {
                // Analysis hasn't happened yet, so no update is necessary - any changes to resources will
                // be captured by the initial analysis pass itself.
                return;
            }
            this.resourceManager.invalidate();
            const classesToUpdate = new Set();
            for (const resourceFile of changedResources) {
                for (const templateClass of this.getComponentsWithTemplateFile(resourceFile)) {
                    classesToUpdate.add(templateClass);
                }
                for (const styleClass of this.getComponentsWithStyleFile(resourceFile)) {
                    classesToUpdate.add(styleClass);
                }
            }
            for (const clazz of classesToUpdate) {
                this.compilation.traitCompiler.updateResources(clazz);
                if (!ts.isClassDeclaration(clazz)) {
                    continue;
                }
                this.compilation.templateTypeChecker.invalidateClass(clazz);
            }
        });
    }
    /**
     * Get the resource dependencies of a file.
     *
     * If the file is not part of the compilation, an empty array will be returned.
     */
    getResourceDependencies(file) {
        this.ensureAnalyzed();
        return this.incrementalCompilation.depGraph.getResourceDependencies(file);
    }
    /**
     * Get all Angular-related diagnostics for this compilation.
     */
    getDiagnostics() {
        const diagnostics = [...this.getNonTemplateDiagnostics()];
        // Type check code may throw fatal diagnostic errors if e.g. the type check
        // block cannot be generated. Gracefully return the associated diagnostic.
        // Note: If a fatal diagnostic is raised, do not repeat the same diagnostics
        // by running the extended template checking code, which will attempt to
        // generate the same TCB.
        try {
            diagnostics.push(...this.getTemplateDiagnostics(), ...this.runAdditionalChecks());
        }
        catch (err) {
            if (!checker.isFatalDiagnosticError(err)) {
                throw err;
            }
            diagnostics.push(err.toDiagnostic());
        }
        return this.addMessageTextDetails(diagnostics);
    }
    /**
     * Get all Angular-related diagnostics for this compilation.
     *
     * If a `ts.SourceFile` is passed, only diagnostics related to that file are returned.
     */
    getDiagnosticsForFile(file, optimizeFor) {
        const diagnostics = [
            ...this.getNonTemplateDiagnostics().filter((diag) => diag.file === file),
        ];
        // Type check code may throw fatal diagnostic errors if e.g. the type check
        // block cannot be generated. Gracefully return the associated diagnostic.
        // Note: If a fatal diagnostic is raised, do not repeat the same diagnostics
        // by running the extended template checking code, which will attempt to
        // generate the same TCB.
        try {
            diagnostics.push(...this.getTemplateDiagnosticsForFile(file, optimizeFor), ...this.runAdditionalChecks(file));
        }
        catch (err) {
            if (!checker.isFatalDiagnosticError(err)) {
                throw err;
            }
            diagnostics.push(err.toDiagnostic());
        }
        return this.addMessageTextDetails(diagnostics);
    }
    /**
     * Get all `ts.Diagnostic`s currently available that pertain to the given component.
     */
    getDiagnosticsForComponent(component) {
        const compilation = this.ensureAnalyzed();
        const ttc = compilation.templateTypeChecker;
        const diagnostics = [];
        // Type check code may throw fatal diagnostic errors if e.g. the type check
        // block cannot be generated. Gracefully return the associated diagnostic.
        // Note: If a fatal diagnostic is raised, do not repeat the same diagnostics
        // by running the extended template checking code, which will attempt to
        // generate the same TCB.
        try {
            diagnostics.push(...ttc.getDiagnosticsForComponent(component));
            const { extendedTemplateChecker, templateSemanticsChecker } = compilation;
            if (templateSemanticsChecker !== null) {
                diagnostics.push(...templateSemanticsChecker.getDiagnosticsForComponent(component));
            }
            if (this.options.strictTemplates && extendedTemplateChecker !== null) {
                diagnostics.push(...extendedTemplateChecker.getDiagnosticsForComponent(component));
            }
        }
        catch (err) {
            if (!checker.isFatalDiagnosticError(err)) {
                throw err;
            }
            diagnostics.push(err.toDiagnostic());
        }
        return this.addMessageTextDetails(diagnostics);
    }
    /**
     * Add Angular.io error guide links to diagnostics for this compilation.
     */
    addMessageTextDetails(diagnostics) {
        return diagnostics.map((diag) => {
            if (diag.code && checker.COMPILER_ERRORS_WITH_GUIDES.has(checker.ngErrorCode(diag.code))) {
                return {
                    ...diag,
                    messageText: diag.messageText +
                        `. Find more at ${ERROR_DETAILS_PAGE_BASE_URL}/NG${checker.ngErrorCode(diag.code)}`,
                };
            }
            return diag;
        });
    }
    /**
     * Get all setup-related diagnostics for this compilation.
     */
    getOptionDiagnostics() {
        return this.constructionDiagnostics;
    }
    /**
     * Get the current `ts.Program` known to this `NgCompiler`.
     *
     * Compilation begins with an input `ts.Program`, and during template type-checking operations new
     * `ts.Program`s may be produced using the `ProgramDriver`. The most recent such `ts.Program` to
     * be produced is available here.
     *
     * This `ts.Program` serves two key purposes:
     *
     * * As an incremental starting point for creating the next `ts.Program` based on files that the
     *   user has changed (for clients using the TS compiler program APIs).
     *
     * * As the "before" point for an incremental compilation invocation, to determine what's changed
     *   between the old and new programs (for all compilations).
     */
    getCurrentProgram() {
        return this.currentProgram;
    }
    getTemplateTypeChecker() {
        if (!this.enableTemplateTypeChecker) {
            throw new Error('The `TemplateTypeChecker` does not work without `enableTemplateTypeChecker`.');
        }
        return this.ensureAnalyzed().templateTypeChecker;
    }
    /**
     * Retrieves the `ts.Declaration`s for any component(s) which use the given template file.
     */
    getComponentsWithTemplateFile(templateFilePath) {
        const { resourceRegistry } = this.ensureAnalyzed();
        return resourceRegistry.getComponentsWithTemplate(checker.resolve(templateFilePath));
    }
    /**
     * Retrieves the `ts.Declaration`s for any component(s) which use the given template file.
     */
    getComponentsWithStyleFile(styleFilePath) {
        const { resourceRegistry } = this.ensureAnalyzed();
        return resourceRegistry.getComponentsWithStyle(checker.resolve(styleFilePath));
    }
    /**
     * Retrieves external resources for the given directive.
     */
    getDirectiveResources(classDecl) {
        if (!checker.isNamedClassDeclaration(classDecl)) {
            return null;
        }
        const { resourceRegistry } = this.ensureAnalyzed();
        const styles = resourceRegistry.getStyles(classDecl);
        const template = resourceRegistry.getTemplate(classDecl);
        const hostBindings = resourceRegistry.getHostBindings(classDecl);
        return { styles, template, hostBindings };
    }
    getMeta(classDecl) {
        if (!checker.isNamedClassDeclaration(classDecl)) {
            return null;
        }
        const ref = new checker.Reference(classDecl);
        const { metaReader } = this.ensureAnalyzed();
        const meta = metaReader.getPipeMetadata(ref) ?? metaReader.getDirectiveMetadata(ref);
        if (meta === null) {
            return null;
        }
        return meta;
    }
    /**
     * Perform Angular's analysis step (as a precursor to `getDiagnostics` or `prepareEmit`)
     * asynchronously.
     *
     * Normally, this operation happens lazily whenever `getDiagnostics` or `prepareEmit` are called.
     * However, certain consumers may wish to allow for an asynchronous phase of analysis, where
     * resources such as `styleUrls` are resolved asynchronously. In these cases `analyzeAsync` must
     * be called first, and its `Promise` awaited prior to calling any other APIs of `NgCompiler`.
     */
    async analyzeAsync() {
        if (this.compilation !== null) {
            return;
        }
        await this.perfRecorder.inPhase(checker.PerfPhase.Analysis, async () => {
            this.compilation = this.makeCompilation();
            const promises = [];
            for (const sf of this.inputProgram.getSourceFiles()) {
                if (sf.isDeclarationFile) {
                    continue;
                }
                let analysisPromise = this.compilation.traitCompiler.analyzeAsync(sf);
                if (analysisPromise !== undefined) {
                    promises.push(analysisPromise);
                }
            }
            await Promise.all(promises);
            this.perfRecorder.memory(checker.PerfCheckpoint.Analysis);
            this.resolveCompilation(this.compilation.traitCompiler);
        });
    }
    /**
     * Fetch transformers and other information which is necessary for a consumer to `emit` the
     * program with Angular-added definitions.
     */
    prepareEmit() {
        const compilation = this.ensureAnalyzed();
        // Untag all the files, otherwise TS 5.4 may end up emitting
        // references to typecheck files (see #56945 and #57135).
        checker.untagAllTsFiles(this.inputProgram);
        const coreImportsFrom = compilation.isCore ? getR3SymbolsFile(this.inputProgram) : null;
        let importRewriter;
        if (coreImportsFrom !== null) {
            importRewriter = new R3SymbolsImportRewriter(coreImportsFrom.fileName);
        }
        else {
            importRewriter = new NoopImportRewriter();
        }
        const defaultImportTracker = new checker.DefaultImportTracker();
        const before = [
            ivyTransformFactory(compilation.traitCompiler, compilation.reflector, importRewriter, defaultImportTracker, compilation.localCompilationExtraImportsTracker, this.delegatingPerfRecorder, compilation.isCore, this.closureCompilerEnabled),
            aliasTransformFactory(compilation.traitCompiler.exportStatements),
            defaultImportTracker.importPreservingTransformer(),
        ];
        // If there are JIT declarations, wire up the JIT transform and efficiently
        // run it against the target declarations.
        if (compilation.supportJitMode && compilation.jitDeclarationRegistry.jitDeclarations.size > 0) {
            const { jitDeclarations } = compilation.jitDeclarationRegistry;
            const jitDeclarationsArray = Array.from(jitDeclarations);
            const jitDeclarationOriginalNodes = new Set(jitDeclarationsArray.map((d) => ts.getOriginalNode(d)));
            const sourceFilesWithJit = new Set(jitDeclarationsArray.map((d) => d.getSourceFile().fileName));
            before.push((ctx) => {
                const reflectionHost = new checker.TypeScriptReflectionHost(this.inputProgram.getTypeChecker());
                const jitTransform = angularJitApplicationTransform(this.inputProgram, compilation.isCore, (node) => {
                    // Class may be synthetic at this point due to Ivy transform.
                    node = ts.getOriginalNode(node, ts.isClassDeclaration);
                    return reflectionHost.isClass(node) && jitDeclarationOriginalNodes.has(node);
                })(ctx);
                return (sourceFile) => {
                    if (!sourceFilesWithJit.has(sourceFile.fileName)) {
                        return sourceFile;
                    }
                    return jitTransform(sourceFile);
                };
            });
        }
        const afterDeclarations = [];
        // In local compilation mode we don't make use of .d.ts files for Angular compilation, so their
        // transformation can be ditched.
        if (this.options.compilationMode !== 'experimental-local' &&
            compilation.dtsTransforms !== null) {
            afterDeclarations.push(declarationTransformFactory(compilation.dtsTransforms, compilation.reflector, compilation.refEmitter, importRewriter));
        }
        // Only add aliasing re-exports to the .d.ts output if the `AliasingHost` requests it.
        if (compilation.aliasingHost !== null && compilation.aliasingHost.aliasExportsInDts) {
            afterDeclarations.push(aliasTransformFactory(compilation.traitCompiler.exportStatements));
        }
        return { transformers: { before, afterDeclarations } };
    }
    /**
     * Run the indexing process and return a `Map` of all indexed components.
     *
     * See the `indexing` package for more details.
     */
    getIndexedComponents() {
        const compilation = this.ensureAnalyzed();
        const context = new IndexingContext();
        compilation.traitCompiler.index(context);
        return generateAnalysis(context);
    }
    /**
     * Gets information for the current program that may be used to generate API
     * reference documentation. This includes Angular-specific information, such
     * as component inputs and outputs.
     *
     * @param entryPoint Path to the entry point for the package for which API
     *     docs should be extracted.
     *
     * @returns A map of symbols with their associated module, eg: ApplicationRef => @angular/core
     */
    getApiDocumentation(entryPoint, privateModules) {
        const compilation = this.ensureAnalyzed();
        const checker = this.inputProgram.getTypeChecker();
        const docsExtractor = new DocsExtractor(checker, compilation.metaReader);
        const entryPointSourceFile = this.inputProgram.getSourceFiles().find((sourceFile) => {
            // TODO: this will need to be more specific than `.includes`, but the exact path comparison
            //     will be easier to figure out when the pipeline is running end-to-end.
            return sourceFile.fileName.includes(entryPoint);
        });
        if (!entryPointSourceFile) {
            throw new Error(`Entry point "${entryPoint}" not found in program sources.`);
        }
        // TODO: Technically the current directory is not the root dir.
        // Should probably be derived from the config.
        const rootDir = this.inputProgram.getCurrentDirectory();
        return docsExtractor.extractAll(entryPointSourceFile, rootDir, privateModules);
    }
    /**
     * Collect i18n messages into the `Xi18nContext`.
     */
    xi18n(ctx) {
        // Note that the 'resolve' phase is not strictly necessary for xi18n, but this is not currently
        // optimized.
        const compilation = this.ensureAnalyzed();
        compilation.traitCompiler.xi18n(ctx);
    }
    /**
     * Emits the JavaScript module that can be used to replace the metadata of a class during HMR.
     * @param node Class for which to generate the update module.
     */
    emitHmrUpdateModule(node) {
        const { traitCompiler, reflector } = this.ensureAnalyzed();
        if (!reflector.isClass(node)) {
            return null;
        }
        const callback = traitCompiler.compileHmrUpdateCallback(node);
        if (callback === null) {
            return null;
        }
        const sourceFile = node.getSourceFile();
        const printer = ts.createPrinter();
        const nodeText = printer.printNode(ts.EmitHint.Unspecified, callback, sourceFile);
        return ts.transpileModule(nodeText, {
            compilerOptions: this.options,
            fileName: sourceFile.fileName,
            reportDiagnostics: false,
        }).outputText;
    }
    ensureAnalyzed() {
        if (this.compilation === null) {
            this.analyzeSync();
        }
        return this.compilation;
    }
    analyzeSync() {
        this.perfRecorder.inPhase(checker.PerfPhase.Analysis, () => {
            this.compilation = this.makeCompilation();
            for (const sf of this.inputProgram.getSourceFiles()) {
                if (sf.isDeclarationFile) {
                    continue;
                }
                this.compilation.traitCompiler.analyzeSync(sf);
            }
            this.perfRecorder.memory(checker.PerfCheckpoint.Analysis);
            this.resolveCompilation(this.compilation.traitCompiler);
        });
    }
    resolveCompilation(traitCompiler) {
        this.perfRecorder.inPhase(checker.PerfPhase.Resolve, () => {
            traitCompiler.resolve();
            // At this point, analysis is complete and the compiler can now calculate which files need to
            // be emitted, so do that.
            this.incrementalCompilation.recordSuccessfulAnalysis(traitCompiler);
            this.perfRecorder.memory(checker.PerfCheckpoint.Resolve);
        });
    }
    get fullTemplateTypeCheck() {
        // Determine the strictness level of type checking based on compiler options. As
        // `strictTemplates` is a superset of `fullTemplateTypeCheck`, the former implies the latter.
        // Also see `verifyCompatibleTypeCheckOptions` where it is verified that `fullTemplateTypeCheck`
        // is not disabled when `strictTemplates` is enabled.
        const strictTemplates = !!this.options.strictTemplates;
        return strictTemplates || !!this.options.fullTemplateTypeCheck;
    }
    getTypeCheckingConfig() {
        // Determine the strictness level of type checking based on compiler options. As
        // `strictTemplates` is a superset of `fullTemplateTypeCheck`, the former implies the latter.
        // Also see `verifyCompatibleTypeCheckOptions` where it is verified that `fullTemplateTypeCheck`
        // is not disabled when `strictTemplates` is enabled.
        const strictTemplates = !!this.options.strictTemplates;
        const useInlineTypeConstructors = this.programDriver.supportsInlineOperations;
        const checkTwoWayBoundEvents = this.options['_checkTwoWayBoundEvents'] ?? false;
        // Check whether the loaded version of `@angular/core` in the `ts.Program` supports unwrapping
        // writable signals for type-checking. If this check fails to find a suitable .d.ts file, fall
        // back to version detection. Only Angular versions greater than 17.2 have the necessary symbols
        // to type check signals in two-way bindings. We also allow version 0.0.0 in case somebody is
        // using Angular at head.
        let allowSignalsInTwoWayBindings = coreHasSymbol(this.inputProgram, compiler.Identifiers.unwrapWritableSignal) ??
            (this.angularCoreVersion === null ||
                coreVersionSupportsFeature(this.angularCoreVersion, '>= 17.2.0'));
        // First select a type-checking configuration, based on whether full template type-checking is
        // requested.
        let typeCheckingConfig;
        if (this.fullTemplateTypeCheck) {
            typeCheckingConfig = {
                applyTemplateContextGuards: strictTemplates,
                checkQueries: false,
                checkTemplateBodies: true,
                alwaysCheckSchemaInTemplateBodies: true,
                checkTypeOfInputBindings: strictTemplates,
                honorAccessModifiersForInputBindings: false,
                checkControlFlowBodies: true,
                strictNullInputBindings: strictTemplates,
                checkTypeOfAttributes: strictTemplates,
                // Even in full template type-checking mode, DOM binding checks are not quite ready yet.
                checkTypeOfDomBindings: false,
                checkTypeOfOutputEvents: strictTemplates,
                checkTypeOfAnimationEvents: strictTemplates,
                // Checking of DOM events currently has an adverse effect on developer experience,
                // e.g. for `<input (blur)="update($event.target.value)">` enabling this check results in:
                // - error TS2531: Object is possibly 'null'.
                // - error TS2339: Property 'value' does not exist on type 'EventTarget'.
                checkTypeOfDomEvents: strictTemplates,
                checkTypeOfDomReferences: strictTemplates,
                // Non-DOM references have the correct type in View Engine so there is no strictness flag.
                checkTypeOfNonDomReferences: true,
                // Pipes are checked in View Engine so there is no strictness flag.
                checkTypeOfPipes: true,
                strictSafeNavigationTypes: strictTemplates,
                useContextGenericType: strictTemplates,
                strictLiteralTypes: true,
                enableTemplateTypeChecker: this.enableTemplateTypeChecker,
                useInlineTypeConstructors,
                // Warnings for suboptimal type inference are only enabled if in Language Service mode
                // (providing the full TemplateTypeChecker API) and if strict mode is not enabled. In strict
                // mode, the user is in full control of type inference.
                suggestionsForSuboptimalTypeInference: this.enableTemplateTypeChecker && !strictTemplates,
                controlFlowPreventingContentProjection: this.options.extendedDiagnostics?.defaultCategory || exports.DiagnosticCategoryLabel.Warning,
                unusedStandaloneImports: this.options.extendedDiagnostics?.defaultCategory || exports.DiagnosticCategoryLabel.Warning,
                allowSignalsInTwoWayBindings,
                checkTwoWayBoundEvents,
            };
        }
        else {
            typeCheckingConfig = {
                applyTemplateContextGuards: false,
                checkQueries: false,
                checkTemplateBodies: false,
                checkControlFlowBodies: false,
                // Enable deep schema checking in "basic" template type-checking mode only if Closure
                // compilation is requested, which is a good proxy for "only in google3".
                alwaysCheckSchemaInTemplateBodies: this.closureCompilerEnabled,
                checkTypeOfInputBindings: false,
                strictNullInputBindings: false,
                honorAccessModifiersForInputBindings: false,
                checkTypeOfAttributes: false,
                checkTypeOfDomBindings: false,
                checkTypeOfOutputEvents: false,
                checkTypeOfAnimationEvents: false,
                checkTypeOfDomEvents: false,
                checkTypeOfDomReferences: false,
                checkTypeOfNonDomReferences: false,
                checkTypeOfPipes: false,
                strictSafeNavigationTypes: false,
                useContextGenericType: false,
                strictLiteralTypes: false,
                enableTemplateTypeChecker: this.enableTemplateTypeChecker,
                useInlineTypeConstructors,
                // In "basic" template type-checking mode, no warnings are produced since most things are
                // not checked anyways.
                suggestionsForSuboptimalTypeInference: false,
                controlFlowPreventingContentProjection: this.options.extendedDiagnostics?.defaultCategory || exports.DiagnosticCategoryLabel.Warning,
                unusedStandaloneImports: this.options.extendedDiagnostics?.defaultCategory || exports.DiagnosticCategoryLabel.Warning,
                allowSignalsInTwoWayBindings,
                checkTwoWayBoundEvents,
            };
        }
        // Apply explicitly configured strictness flags on top of the default configuration
        // based on "fullTemplateTypeCheck".
        if (this.options.strictInputTypes !== undefined) {
            typeCheckingConfig.checkTypeOfInputBindings = this.options.strictInputTypes;
            typeCheckingConfig.applyTemplateContextGuards = this.options.strictInputTypes;
        }
        if (this.options.strictInputAccessModifiers !== undefined) {
            typeCheckingConfig.honorAccessModifiersForInputBindings =
                this.options.strictInputAccessModifiers;
        }
        if (this.options.strictNullInputTypes !== undefined) {
            typeCheckingConfig.strictNullInputBindings = this.options.strictNullInputTypes;
        }
        if (this.options.strictOutputEventTypes !== undefined) {
            typeCheckingConfig.checkTypeOfOutputEvents = this.options.strictOutputEventTypes;
            typeCheckingConfig.checkTypeOfAnimationEvents = this.options.strictOutputEventTypes;
        }
        if (this.options.strictDomEventTypes !== undefined) {
            typeCheckingConfig.checkTypeOfDomEvents = this.options.strictDomEventTypes;
        }
        if (this.options.strictSafeNavigationTypes !== undefined) {
            typeCheckingConfig.strictSafeNavigationTypes = this.options.strictSafeNavigationTypes;
        }
        if (this.options.strictDomLocalRefTypes !== undefined) {
            typeCheckingConfig.checkTypeOfDomReferences = this.options.strictDomLocalRefTypes;
        }
        if (this.options.strictAttributeTypes !== undefined) {
            typeCheckingConfig.checkTypeOfAttributes = this.options.strictAttributeTypes;
        }
        if (this.options.strictContextGenerics !== undefined) {
            typeCheckingConfig.useContextGenericType = this.options.strictContextGenerics;
        }
        if (this.options.strictLiteralTypes !== undefined) {
            typeCheckingConfig.strictLiteralTypes = this.options.strictLiteralTypes;
        }
        if (this.options.extendedDiagnostics?.checks?.controlFlowPreventingContentProjection !== undefined) {
            typeCheckingConfig.controlFlowPreventingContentProjection =
                this.options.extendedDiagnostics.checks.controlFlowPreventingContentProjection;
        }
        if (this.options.extendedDiagnostics?.checks?.unusedStandaloneImports !== undefined) {
            typeCheckingConfig.unusedStandaloneImports =
                this.options.extendedDiagnostics.checks.unusedStandaloneImports;
        }
        return typeCheckingConfig;
    }
    getTemplateDiagnostics() {
        const compilation = this.ensureAnalyzed();
        const diagnostics = [];
        // Get diagnostics for all files.
        for (const sf of this.inputProgram.getSourceFiles()) {
            if (sf.isDeclarationFile || this.adapter.isShim(sf)) {
                continue;
            }
            diagnostics.push(...compilation.templateTypeChecker.getDiagnosticsForFile(sf, checker.OptimizeFor.WholeProgram));
        }
        const program = this.programDriver.getProgram();
        this.incrementalStrategy.setIncrementalState(this.incrementalCompilation.state, program);
        this.currentProgram = program;
        return diagnostics;
    }
    getTemplateDiagnosticsForFile(sf, optimizeFor) {
        const compilation = this.ensureAnalyzed();
        // Get the diagnostics.
        const diagnostics = [];
        if (!sf.isDeclarationFile && !this.adapter.isShim(sf)) {
            diagnostics.push(...compilation.templateTypeChecker.getDiagnosticsForFile(sf, optimizeFor));
        }
        const program = this.programDriver.getProgram();
        this.incrementalStrategy.setIncrementalState(this.incrementalCompilation.state, program);
        this.currentProgram = program;
        return diagnostics;
    }
    getNonTemplateDiagnostics() {
        if (this.nonTemplateDiagnostics === null) {
            const compilation = this.ensureAnalyzed();
            this.nonTemplateDiagnostics = [...compilation.traitCompiler.diagnostics];
            if (this.entryPoint !== null && compilation.exportReferenceGraph !== null) {
                this.nonTemplateDiagnostics.push(...checkForPrivateExports(this.entryPoint, this.inputProgram.getTypeChecker(), compilation.exportReferenceGraph));
            }
        }
        return this.nonTemplateDiagnostics;
    }
    runAdditionalChecks(sf) {
        const diagnostics = [];
        const compilation = this.ensureAnalyzed();
        const { extendedTemplateChecker, templateSemanticsChecker, sourceFileValidator } = compilation;
        const files = sf ? [sf] : this.inputProgram.getSourceFiles();
        for (const sf of files) {
            if (sourceFileValidator !== null) {
                const sourceFileDiagnostics = sourceFileValidator.getDiagnosticsForFile(sf);
                if (sourceFileDiagnostics !== null) {
                    diagnostics.push(...sourceFileDiagnostics);
                }
            }
            if (templateSemanticsChecker !== null) {
                diagnostics.push(...compilation.traitCompiler.runAdditionalChecks(sf, (clazz, handler) => {
                    return handler.templateSemanticsCheck?.(clazz, templateSemanticsChecker) || null;
                }));
            }
            if (this.options.strictTemplates && extendedTemplateChecker !== null) {
                diagnostics.push(...compilation.traitCompiler.runAdditionalChecks(sf, (clazz, handler) => {
                    return handler.extendedTemplateCheck?.(clazz, extendedTemplateChecker) || null;
                }));
            }
        }
        return diagnostics;
    }
    makeCompilation() {
        const isCore = this.options._isAngularCoreCompilation ?? isAngularCorePackage(this.inputProgram);
        // Note: If this compilation builds `@angular/core`, we always build in full compilation
        // mode. Code inside the core package is always compatible with itself, so it does not
        // make sense to go through the indirection of partial compilation
        let compilationMode = checker.CompilationMode.FULL;
        if (!isCore) {
            switch (this.options.compilationMode) {
                case 'full':
                    compilationMode = checker.CompilationMode.FULL;
                    break;
                case 'partial':
                    compilationMode = checker.CompilationMode.PARTIAL;
                    break;
                case 'experimental-local':
                    compilationMode = checker.CompilationMode.LOCAL;
                    break;
            }
        }
        const checker$1 = this.inputProgram.getTypeChecker();
        const reflector = new checker.TypeScriptReflectionHost(checker$1, compilationMode === checker.CompilationMode.LOCAL);
        // Construct the ReferenceEmitter.
        let refEmitter;
        let aliasingHost = null;
        if (this.adapter.unifiedModulesHost === null ||
            (!this.options['_useHostForImportGeneration'] &&
                !this.options['_useHostForImportAndAliasGeneration'])) {
            let localImportStrategy;
            // The strategy used for local, in-project imports depends on whether TS has been configured
            // with rootDirs. If so, then multiple directories may be mapped in the same "module
            // namespace" and the logic of `LogicalProjectStrategy` is required to generate correct
            // imports which may cross these multiple directories. Otherwise, plain relative imports are
            // sufficient.
            if (this.options.rootDirs !== undefined && this.options.rootDirs.length > 0) {
                // rootDirs logic is in effect - use the `LogicalProjectStrategy` for in-project relative
                // imports.
                localImportStrategy = new checker.LogicalProjectStrategy(reflector, new checker.LogicalFileSystem([...this.adapter.rootDirs], this.adapter));
            }
            else {
                // Plain relative imports are all that's needed.
                localImportStrategy = new checker.RelativePathStrategy(reflector);
            }
            // The CompilerHost doesn't have fileNameToModuleName, so build an NPM-centric reference
            // resolution strategy.
            refEmitter = new checker.ReferenceEmitter([
                // First, try to use local identifiers if available.
                new checker.LocalIdentifierStrategy(),
                // Next, attempt to use an absolute import.
                new checker.AbsoluteModuleStrategy(this.inputProgram, checker$1, this.moduleResolver, reflector),
                // Finally, check if the reference is being written into a file within the project's .ts
                // sources, and use a relative import if so. If this fails, ReferenceEmitter will throw
                // an error.
                localImportStrategy,
            ]);
            // If an entrypoint is present, then all user imports should be directed through the
            // entrypoint and private exports are not needed. The compiler will validate that all
            // publicly visible directives/pipes are importable via this entrypoint.
            if (this.entryPoint === null && this.options.generateDeepReexports === true) {
                // No entrypoint is present and deep re-exports were requested, so configure the aliasing
                // system to generate them.
                aliasingHost = new PrivateExportAliasingHost(reflector);
            }
        }
        else {
            // The CompilerHost supports fileNameToModuleName, so use that to emit imports.
            refEmitter = new checker.ReferenceEmitter([
                // First, try to use local identifiers if available.
                new checker.LocalIdentifierStrategy(),
                // Then use aliased references (this is a workaround to StrictDeps checks).
                ...(this.options['_useHostForImportAndAliasGeneration'] ? [new AliasStrategy()] : []),
                // Then use fileNameToModuleName to emit imports.
                new checker.UnifiedModulesStrategy(reflector, this.adapter.unifiedModulesHost),
            ]);
            if (this.options['_useHostForImportAndAliasGeneration']) {
                aliasingHost = new UnifiedModulesAliasingHost(this.adapter.unifiedModulesHost);
            }
        }
        const evaluator = new PartialEvaluator(reflector, checker$1, this.incrementalCompilation.depGraph);
        const dtsReader = new DtsMetadataReader(checker$1, reflector);
        const localMetaRegistry = new LocalMetadataRegistry();
        const localMetaReader = localMetaRegistry;
        const depScopeReader = new MetadataDtsModuleScopeResolver(dtsReader, aliasingHost);
        const metaReader = new checker.CompoundMetadataReader([localMetaReader, dtsReader]);
        const ngModuleIndex = new NgModuleIndexImpl(metaReader, localMetaReader);
        const ngModuleScopeRegistry = new LocalModuleScopeRegistry(localMetaReader, metaReader, depScopeReader, refEmitter, aliasingHost);
        const standaloneScopeReader = new StandaloneComponentScopeReader(metaReader, ngModuleScopeRegistry, depScopeReader);
        const scopeReader = new CompoundComponentScopeReader([
            ngModuleScopeRegistry,
            standaloneScopeReader,
        ]);
        const semanticDepGraphUpdater = this.incrementalCompilation.semanticDepGraphUpdater;
        const metaRegistry = new CompoundMetadataRegistry([localMetaRegistry, ngModuleScopeRegistry]);
        const injectableRegistry = new InjectableClassRegistry(reflector, isCore);
        const hostDirectivesResolver = new HostDirectivesResolver(metaReader);
        const exportedProviderStatusResolver = new ExportedProviderStatusResolver(metaReader);
        const importTracker = new ImportedSymbolsTracker();
        const typeCheckScopeRegistry = new TypeCheckScopeRegistry(scopeReader, metaReader, hostDirectivesResolver);
        // If a flat module entrypoint was specified, then track references via a `ReferenceGraph` in
        // order to produce proper diagnostics for incorrectly exported directives/pipes/etc. If there
        // is no flat module entrypoint then don't pay the cost of tracking references.
        let referencesRegistry;
        let exportReferenceGraph = null;
        if (this.entryPoint !== null) {
            exportReferenceGraph = new ReferenceGraph();
            referencesRegistry = new ReferenceGraphAdapter(exportReferenceGraph);
        }
        else {
            referencesRegistry = new NoopReferencesRegistry();
        }
        const dtsTransforms = new DtsTransformRegistry();
        const resourceRegistry = new ResourceRegistry();
        const deferredSymbolsTracker = new DeferredSymbolTracker(this.inputProgram.getTypeChecker(), this.options.onlyExplicitDeferDependencyImports ?? false);
        let localCompilationExtraImportsTracker = null;
        if (compilationMode === checker.CompilationMode.LOCAL && this.options.generateExtraImportsInLocalMode) {
            localCompilationExtraImportsTracker = new LocalCompilationExtraImportsTracker(checker$1);
        }
        // Cycles are handled in full and local compilation modes by "remote scoping".
        // "Remote scoping" does not work well with tree shaking for libraries.
        // So in partial compilation mode, when building a library, a cycle will cause an error.
        const cycleHandlingStrategy = compilationMode === checker.CompilationMode.PARTIAL
            ? 1 /* CycleHandlingStrategy.Error */
            : 0 /* CycleHandlingStrategy.UseRemoteScoping */;
        const strictCtorDeps = this.options.strictInjectionParameters || false;
        const supportJitMode = this.options['supportJitMode'] ?? true;
        const supportTestBed = this.options['supportTestBed'] ?? true;
        const externalRuntimeStyles = this.options['externalRuntimeStyles'] ?? false;
        const typeCheckHostBindings = this.options.typeCheckHostBindings ?? false;
        // Libraries compiled in partial mode could potentially be used with TestBed within an
        // application. Since this is not known at library compilation time, support is required to
        // prevent potential downstream application testing breakage.
        if (supportTestBed === false && compilationMode === checker.CompilationMode.PARTIAL) {
            throw new Error('TestBed support ("supportTestBed" option) cannot be disabled in partial compilation mode.');
        }
        if (supportJitMode === false && compilationMode === checker.CompilationMode.PARTIAL) {
            throw new Error('JIT mode support ("supportJitMode" option) cannot be disabled in partial compilation mode.');
        }
        // Currently forbidOrphanComponents depends on the code generated behind ngJitMode flag. Until
        // we come up with a better design for these flags, it is necessary to have the JIT mode in
        // order for forbidOrphanComponents to be able to work properly.
        if (supportJitMode === false && this.options.forbidOrphanComponents) {
            throw new Error('JIT mode support ("supportJitMode" option) cannot be disabled when forbidOrphanComponents is set to true');
        }
        const jitDeclarationRegistry = new JitDeclarationRegistry();
        // Set up the IvyCompilation, which manages state for the Ivy transformer.
        const handlers = [
            new ComponentDecoratorHandler(reflector, evaluator, metaRegistry, metaReader, scopeReader, this.adapter, ngModuleScopeRegistry, typeCheckScopeRegistry, resourceRegistry, isCore, strictCtorDeps, this.resourceManager, this.adapter.rootDirs, this.options.preserveWhitespaces || false, this.options.i18nUseExternalIds !== false, this.options.enableI18nLegacyMessageIdFormat !== false, this.usePoisonedData, this.options.i18nNormalizeLineEndingsInICUs === true, this.moduleResolver, this.cycleAnalyzer, cycleHandlingStrategy, refEmitter, referencesRegistry, this.incrementalCompilation.depGraph, injectableRegistry, semanticDepGraphUpdater, this.closureCompilerEnabled, this.delegatingPerfRecorder, hostDirectivesResolver, importTracker, supportTestBed, compilationMode, deferredSymbolsTracker, !!this.options.forbidOrphanComponents, this.enableBlockSyntax, this.enableLetSyntax, externalRuntimeStyles, localCompilationExtraImportsTracker, jitDeclarationRegistry, this.options.i18nPreserveWhitespaceForLegacyExtraction ?? true, !!this.options.strictStandalone, this.enableHmr, this.implicitStandaloneValue, typeCheckHostBindings),
            // TODO(alxhub): understand why the cast here is necessary (something to do with `null`
            // not being assignable to `unknown` when wrapped in `Readonly`).
            new DirectiveDecoratorHandler(reflector, evaluator, metaRegistry, ngModuleScopeRegistry, metaReader, injectableRegistry, refEmitter, referencesRegistry, isCore, strictCtorDeps, semanticDepGraphUpdater, this.closureCompilerEnabled, this.delegatingPerfRecorder, importTracker, supportTestBed, typeCheckScopeRegistry, compilationMode, jitDeclarationRegistry, resourceRegistry, !!this.options.strictStandalone, this.implicitStandaloneValue, this.usePoisonedData, typeCheckHostBindings),
            // Pipe handler must be before injectable handler in list so pipe factories are printed
            // before injectable factories (so injectable factories can delegate to them)
            new PipeDecoratorHandler(reflector, evaluator, metaRegistry, ngModuleScopeRegistry, injectableRegistry, isCore, this.delegatingPerfRecorder, supportTestBed, compilationMode, !!this.options.generateExtraImportsInLocalMode, !!this.options.strictStandalone, this.implicitStandaloneValue),
            new InjectableDecoratorHandler(reflector, evaluator, isCore, strictCtorDeps, injectableRegistry, this.delegatingPerfRecorder, supportTestBed, compilationMode),
            new NgModuleDecoratorHandler(reflector, evaluator, metaReader, metaRegistry, ngModuleScopeRegistry, referencesRegistry, exportedProviderStatusResolver, semanticDepGraphUpdater, isCore, refEmitter, this.closureCompilerEnabled, this.options.onlyPublishPublicTypingsForNgModules ?? false, injectableRegistry, this.delegatingPerfRecorder, supportTestBed, supportJitMode, compilationMode, localCompilationExtraImportsTracker, jitDeclarationRegistry),
        ];
        const traitCompiler = new TraitCompiler(handlers, reflector, this.delegatingPerfRecorder, this.incrementalCompilation, this.options.compileNonExportedClasses !== false, compilationMode, dtsTransforms, semanticDepGraphUpdater, this.adapter);
        // Template type-checking may use the `ProgramDriver` to produce new `ts.Program`(s). If this
        // happens, they need to be tracked by the `NgCompiler`.
        const notifyingDriver = new NotifyingProgramDriverWrapper(this.programDriver, (program) => {
            this.incrementalStrategy.setIncrementalState(this.incrementalCompilation.state, program);
            this.currentProgram = program;
        });
        const typeCheckingConfig = this.getTypeCheckingConfig();
        const templateTypeChecker = new checker.TemplateTypeCheckerImpl(this.inputProgram, notifyingDriver, traitCompiler, typeCheckingConfig, refEmitter, reflector, this.adapter, this.incrementalCompilation, metaReader, localMetaReader, ngModuleIndex, scopeReader, typeCheckScopeRegistry, this.delegatingPerfRecorder);
        // Only construct the extended template checker if the configuration is valid and usable.
        const extendedTemplateChecker = this.constructionDiagnostics.length === 0
            ? new ExtendedTemplateCheckerImpl(templateTypeChecker, checker$1, ALL_DIAGNOSTIC_FACTORIES, this.options)
            : null;
        const templateSemanticsChecker = this.constructionDiagnostics.length === 0
            ? new TemplateSemanticsCheckerImpl(templateTypeChecker)
            : null;
        const sourceFileValidator = this.constructionDiagnostics.length === 0
            ? new SourceFileValidator(reflector, importTracker, templateTypeChecker, typeCheckingConfig)
            : null;
        return {
            isCore,
            traitCompiler,
            reflector,
            scopeRegistry: ngModuleScopeRegistry,
            dtsTransforms,
            exportReferenceGraph,
            metaReader,
            typeCheckScopeRegistry,
            aliasingHost,
            refEmitter,
            templateTypeChecker,
            resourceRegistry,
            extendedTemplateChecker,
            localCompilationExtraImportsTracker,
            jitDeclarationRegistry,
            templateSemanticsChecker,
            sourceFileValidator,
            supportJitMode,
        };
    }
}
/**
 * Determine if the given `Program` is @angular/core.
 */
function isAngularCorePackage(program) {
    // Look for its_just_angular.ts somewhere in the program.
    const r3Symbols = getR3SymbolsFile(program);
    if (r3Symbols === null) {
        return false;
    }
    // Look for the constant ITS_JUST_ANGULAR in that file.
    return r3Symbols.statements.some((stmt) => {
        // The statement must be a variable declaration statement.
        if (!ts.isVariableStatement(stmt)) {
            return false;
        }
        // It must be exported.
        const modifiers = ts.getModifiers(stmt);
        if (modifiers === undefined ||
            !modifiers.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword)) {
            return false;
        }
        // It must declare ITS_JUST_ANGULAR.
        return stmt.declarationList.declarations.some((decl) => {
            // The declaration must match the name.
            if (!ts.isIdentifier(decl.name) || decl.name.text !== 'ITS_JUST_ANGULAR') {
                return false;
            }
            // It must initialize the variable to true.
            if (decl.initializer === undefined || decl.initializer.kind !== ts.SyntaxKind.TrueKeyword) {
                return false;
            }
            // This definition matches.
            return true;
        });
    });
}
/**
 * Find the 'r3_symbols.ts' file in the given `Program`, or return `null` if it wasn't there.
 */
function getR3SymbolsFile(program) {
    return (program.getSourceFiles().find((file) => file.fileName.indexOf('r3_symbols.ts') >= 0) || null);
}
/**
 * Since "strictTemplates" is a true superset of type checking capabilities compared to
 * "fullTemplateTypeCheck", it is required that the latter is not explicitly disabled if the
 * former is enabled.
 */
function* verifyCompatibleTypeCheckOptions(options) {
    if (options.fullTemplateTypeCheck === false && options.strictTemplates === true) {
        yield makeConfigDiagnostic({
            category: ts.DiagnosticCategory.Error,
            code: checker.ErrorCode.CONFIG_STRICT_TEMPLATES_IMPLIES_FULL_TEMPLATE_TYPECHECK,
            messageText: `
Angular compiler option "strictTemplates" is enabled, however "fullTemplateTypeCheck" is disabled.

Having the "strictTemplates" flag enabled implies that "fullTemplateTypeCheck" is also enabled, so
the latter can not be explicitly disabled.

One of the following actions is required:
1. Remove the "fullTemplateTypeCheck" option.
2. Remove "strictTemplates" or set it to 'false'.

More information about the template type checking compiler options can be found in the documentation:
https://angular.dev/tools/cli/template-typecheck
      `.trim(),
        });
    }
    if (options.extendedDiagnostics && options.strictTemplates === false) {
        yield makeConfigDiagnostic({
            category: ts.DiagnosticCategory.Error,
            code: checker.ErrorCode.CONFIG_EXTENDED_DIAGNOSTICS_IMPLIES_STRICT_TEMPLATES,
            messageText: `
Angular compiler option "extendedDiagnostics" is configured, however "strictTemplates" is disabled.

Using "extendedDiagnostics" requires that "strictTemplates" is also enabled.

One of the following actions is required:
1. Remove "strictTemplates: false" to enable it.
2. Remove "extendedDiagnostics" configuration to disable them.
      `.trim(),
        });
    }
    const allowedCategoryLabels = Array.from(Object.values(exports.DiagnosticCategoryLabel));
    const defaultCategory = options.extendedDiagnostics?.defaultCategory;
    if (defaultCategory && !allowedCategoryLabels.includes(defaultCategory)) {
        yield makeConfigDiagnostic({
            category: ts.DiagnosticCategory.Error,
            code: checker.ErrorCode.CONFIG_EXTENDED_DIAGNOSTICS_UNKNOWN_CATEGORY_LABEL,
            messageText: `
Angular compiler option "extendedDiagnostics.defaultCategory" has an unknown diagnostic category: "${defaultCategory}".

Allowed diagnostic categories are:
${allowedCategoryLabels.join('\n')}
      `.trim(),
        });
    }
    for (const [checkName, category] of Object.entries(options.extendedDiagnostics?.checks ?? {})) {
        if (!SUPPORTED_DIAGNOSTIC_NAMES.has(checkName)) {
            yield makeConfigDiagnostic({
                category: ts.DiagnosticCategory.Error,
                code: checker.ErrorCode.CONFIG_EXTENDED_DIAGNOSTICS_UNKNOWN_CHECK,
                messageText: `
Angular compiler option "extendedDiagnostics.checks" has an unknown check: "${checkName}".

Allowed check names are:
${Array.from(SUPPORTED_DIAGNOSTIC_NAMES).join('\n')}
        `.trim(),
            });
        }
        if (!allowedCategoryLabels.includes(category)) {
            yield makeConfigDiagnostic({
                category: ts.DiagnosticCategory.Error,
                code: checker.ErrorCode.CONFIG_EXTENDED_DIAGNOSTICS_UNKNOWN_CATEGORY_LABEL,
                messageText: `
Angular compiler option "extendedDiagnostics.checks['${checkName}']" has an unknown diagnostic category: "${category}".

Allowed diagnostic categories are:
${allowedCategoryLabels.join('\n')}
        `.trim(),
            });
        }
    }
}
function makeConfigDiagnostic({ category, code, messageText, }) {
    return {
        category,
        code: checker.ngErrorCode(code),
        file: undefined,
        start: undefined,
        length: undefined,
        messageText,
    };
}
class ReferenceGraphAdapter {
    graph;
    constructor(graph) {
        this.graph = graph;
    }
    add(source, ...references) {
        for (const { node } of references) {
            let sourceFile = node.getSourceFile();
            if (sourceFile === undefined) {
                sourceFile = ts.getOriginalNode(node).getSourceFile();
            }
            // Only record local references (not references into .d.ts files).
            if (sourceFile === undefined || !checker.isDtsPath(sourceFile.fileName)) {
                this.graph.add(source, node);
            }
        }
    }
}
class NotifyingProgramDriverWrapper {
    delegate;
    notifyNewProgram;
    getSourceFileVersion;
    constructor(delegate, notifyNewProgram) {
        this.delegate = delegate;
        this.notifyNewProgram = notifyNewProgram;
        this.getSourceFileVersion = this.delegate.getSourceFileVersion?.bind(this);
    }
    get supportsInlineOperations() {
        return this.delegate.supportsInlineOperations;
    }
    getProgram() {
        return this.delegate.getProgram();
    }
    updateFiles(contents, updateMode) {
        this.delegate.updateFiles(contents, updateMode);
        this.notifyNewProgram(this.delegate.getProgram());
    }
}
function versionMapFromProgram(program, driver) {
    if (driver.getSourceFileVersion === undefined) {
        return null;
    }
    const versions = new Map();
    for (const possiblyRedirectedSourceFile of program.getSourceFiles()) {
        const sf = checker.toUnredirectedSourceFile(possiblyRedirectedSourceFile);
        versions.set(checker.absoluteFromSourceFile(sf), driver.getSourceFileVersion(sf));
    }
    return versions;
}

// A persistent source of bugs in CompilerHost delegation has been the addition by TS of new,
// optional methods on ts.CompilerHost. Since these methods are optional, it's not a type error that
// the delegating host doesn't implement or delegate them. This causes subtle runtime failures. No
// more. This infrastructure ensures that failing to delegate a method is a compile-time error.
/**
 * Delegates all methods of `ExtendedTsCompilerHost` to a delegate, with the exception of
 * `getSourceFile` and `fileExists` which are implemented in `NgCompilerHost`.
 *
 * If a new method is added to `ts.CompilerHost` which is not delegated, a type error will be
 * generated for this class.
 */
class DelegatingCompilerHost {
    delegate;
    createHash;
    directoryExists;
    fileNameToModuleName;
    getCancellationToken;
    getCanonicalFileName;
    getCurrentDirectory;
    getDefaultLibFileName;
    getDefaultLibLocation;
    getDirectories;
    getEnvironmentVariable;
    getModifiedResourceFiles;
    getNewLine;
    getParsedCommandLine;
    getSourceFileByPath;
    readDirectory;
    readFile;
    readResource;
    transformResource;
    realpath;
    resolveModuleNames;
    resolveTypeReferenceDirectives;
    resourceNameToFileName;
    trace;
    useCaseSensitiveFileNames;
    writeFile;
    getModuleResolutionCache;
    hasInvalidatedResolutions;
    resolveModuleNameLiterals;
    resolveTypeReferenceDirectiveReferences;
    // jsDocParsingMode is not a method like the other elements above
    // TODO: ignore usage can be dropped once 5.2 support is dropped
    get jsDocParsingMode() {
        // @ts-ignore
        return this.delegate.jsDocParsingMode;
    }
    set jsDocParsingMode(mode) {
        // @ts-ignore
        this.delegate.jsDocParsingMode = mode;
    }
    constructor(delegate) {
        this.delegate = delegate;
        // Excluded are 'getSourceFile' and 'fileExists', which are actually implemented by
        // NgCompilerHost
        // below.
        this.createHash = this.delegateMethod('createHash');
        this.directoryExists = this.delegateMethod('directoryExists');
        this.fileNameToModuleName = this.delegateMethod('fileNameToModuleName');
        this.getCancellationToken = this.delegateMethod('getCancellationToken');
        this.getCanonicalFileName = this.delegateMethod('getCanonicalFileName');
        this.getCurrentDirectory = this.delegateMethod('getCurrentDirectory');
        this.getDefaultLibFileName = this.delegateMethod('getDefaultLibFileName');
        this.getDefaultLibLocation = this.delegateMethod('getDefaultLibLocation');
        this.getDirectories = this.delegateMethod('getDirectories');
        this.getEnvironmentVariable = this.delegateMethod('getEnvironmentVariable');
        this.getModifiedResourceFiles = this.delegateMethod('getModifiedResourceFiles');
        this.getNewLine = this.delegateMethod('getNewLine');
        this.getParsedCommandLine = this.delegateMethod('getParsedCommandLine');
        this.getSourceFileByPath = this.delegateMethod('getSourceFileByPath');
        this.readDirectory = this.delegateMethod('readDirectory');
        this.readFile = this.delegateMethod('readFile');
        this.readResource = this.delegateMethod('readResource');
        this.transformResource = this.delegateMethod('transformResource');
        this.realpath = this.delegateMethod('realpath');
        this.resolveModuleNames = this.delegateMethod('resolveModuleNames');
        this.resolveTypeReferenceDirectives = this.delegateMethod('resolveTypeReferenceDirectives');
        this.resourceNameToFileName = this.delegateMethod('resourceNameToFileName');
        this.trace = this.delegateMethod('trace');
        this.useCaseSensitiveFileNames = this.delegateMethod('useCaseSensitiveFileNames');
        this.writeFile = this.delegateMethod('writeFile');
        this.getModuleResolutionCache = this.delegateMethod('getModuleResolutionCache');
        this.hasInvalidatedResolutions = this.delegateMethod('hasInvalidatedResolutions');
        this.resolveModuleNameLiterals = this.delegateMethod('resolveModuleNameLiterals');
        this.resolveTypeReferenceDirectiveReferences = this.delegateMethod('resolveTypeReferenceDirectiveReferences');
    }
    delegateMethod(name) {
        return this.delegate[name] !== undefined
            ? this.delegate[name].bind(this.delegate)
            : undefined;
    }
}
/**
 * A wrapper around `ts.CompilerHost` (plus any extension methods from `ExtendedTsCompilerHost`).
 *
 * In order for a consumer to include Angular compilation in their TypeScript compiler, the
 * `ts.Program` must be created with a host that adds Angular-specific files (e.g.
 * the template type-checking file, etc) to the compilation. `NgCompilerHost` is the
 * host implementation which supports this.
 *
 * The interface implementations here ensure that `NgCompilerHost` fully delegates to
 * `ExtendedTsCompilerHost` methods whenever present.
 */
class NgCompilerHost extends DelegatingCompilerHost {
    shimAdapter;
    shimTagger;
    entryPoint = null;
    constructionDiagnostics;
    inputFiles;
    rootDirs;
    constructor(delegate, inputFiles, rootDirs, shimAdapter, shimTagger, entryPoint, diagnostics) {
        super(delegate);
        this.shimAdapter = shimAdapter;
        this.shimTagger = shimTagger;
        this.entryPoint = entryPoint;
        this.constructionDiagnostics = diagnostics;
        this.inputFiles = [...inputFiles, ...shimAdapter.extraInputFiles];
        this.rootDirs = rootDirs;
        if (this.resolveModuleNames === undefined) {
            // In order to reuse the module resolution cache during the creation of the type-check
            // program, we'll need to provide `resolveModuleNames` if the delegate did not provide one.
            this.resolveModuleNames = this.createCachedResolveModuleNamesFunction();
        }
    }
    /**
     * Retrieves a set of `ts.SourceFile`s which should not be emitted as JS files.
     *
     * Available after this host is used to create a `ts.Program` (which causes all the files in the
     * program to be enumerated).
     */
    get ignoreForEmit() {
        return this.shimAdapter.ignoreForEmit;
    }
    /**
     * Retrieve the array of shim extension prefixes for which shims were created for each original
     * file.
     */
    get shimExtensionPrefixes() {
        return this.shimAdapter.extensionPrefixes;
    }
    /**
     * Performs cleanup that needs to happen after a `ts.Program` has been created using this host.
     */
    postProgramCreationCleanup() {
        this.shimTagger.finalize();
    }
    /**
     * Create an `NgCompilerHost` from a delegate host, an array of input filenames, and the full set
     * of TypeScript and Angular compiler options.
     */
    static wrap(delegate, inputFiles, options, oldProgram) {
        const topLevelShimGenerators = [];
        const perFileShimGenerators = [];
        const rootDirs = checker.getRootDirs(delegate, options);
        perFileShimGenerators.push(new checker.TypeCheckShimGenerator());
        let diagnostics = [];
        const normalizedTsInputFiles = [];
        for (const inputFile of inputFiles) {
            if (!checker.isNonDeclarationTsPath(inputFile)) {
                continue;
            }
            normalizedTsInputFiles.push(checker.resolve(inputFile));
        }
        let entryPoint = null;
        if (options.flatModuleOutFile != null && options.flatModuleOutFile !== '') {
            entryPoint = findFlatIndexEntryPoint(normalizedTsInputFiles);
            if (entryPoint === null) {
                // This error message talks specifically about having a single .ts file in "files". However
                // the actual logic is a bit more permissive. If a single file exists, that will be taken,
                // otherwise the highest level (shortest path) "index.ts" file will be used as the flat
                // module entry point instead. If neither of these conditions apply, the error below is
                // given.
                //
                // The user is not informed about the "index.ts" option as this behavior is deprecated -
                // an explicit entrypoint should always be specified.
                diagnostics.push({
                    category: ts.DiagnosticCategory.Error,
                    code: checker.ngErrorCode(checker.ErrorCode.CONFIG_FLAT_MODULE_NO_INDEX),
                    file: undefined,
                    start: undefined,
                    length: undefined,
                    messageText: 'Angular compiler option "flatModuleOutFile" requires one and only one .ts file in the "files" field.',
                });
            }
            else {
                const flatModuleId = options.flatModuleId || null;
                const flatModuleOutFile = normalizeSeparators(options.flatModuleOutFile);
                const flatIndexGenerator = new FlatIndexGenerator(entryPoint, flatModuleOutFile, flatModuleId);
                topLevelShimGenerators.push(flatIndexGenerator);
            }
        }
        const shimAdapter = new ShimAdapter(delegate, normalizedTsInputFiles, topLevelShimGenerators, perFileShimGenerators, oldProgram);
        const shimTagger = new ShimReferenceTagger(perFileShimGenerators.map((gen) => gen.extensionPrefix));
        return new NgCompilerHost(delegate, inputFiles, rootDirs, shimAdapter, shimTagger, entryPoint, diagnostics);
    }
    /**
     * Check whether the given `ts.SourceFile` is a shim file.
     *
     * If this returns false, the file is user-provided.
     */
    isShim(sf) {
        return checker.isShim(sf);
    }
    /**
     * Check whether the given `ts.SourceFile` is a resource file.
     *
     * This simply returns `false` for the compiler-cli since resource files are not added as root
     * files to the project.
     */
    isResource(sf) {
        return false;
    }
    getSourceFile(fileName, languageVersionOrOptions, onError, shouldCreateNewSourceFile) {
        // Is this a previously known shim?
        const shimSf = this.shimAdapter.maybeGenerate(checker.resolve(fileName));
        if (shimSf !== null) {
            // Yes, so return it.
            return shimSf;
        }
        // No, so it's a file which might need shims (or a file which doesn't exist).
        const sf = this.delegate.getSourceFile(fileName, languageVersionOrOptions, onError, shouldCreateNewSourceFile);
        if (sf === undefined) {
            return undefined;
        }
        this.shimTagger.tag(sf);
        return sf;
    }
    fileExists(fileName) {
        // Consider the file as existing whenever
        //  1) it really does exist in the delegate host, or
        //  2) at least one of the shim generators recognizes it
        // Note that we can pass the file name as branded absolute fs path because TypeScript
        // internally only passes POSIX-like paths.
        //
        // Also note that the `maybeGenerate` check below checks for both `null` and `undefined`.
        return (this.delegate.fileExists(fileName) ||
            this.shimAdapter.maybeGenerate(checker.resolve(fileName)) != null);
    }
    get unifiedModulesHost() {
        return this.fileNameToModuleName !== undefined ? this : null;
    }
    createCachedResolveModuleNamesFunction() {
        const moduleResolutionCache = ts.createModuleResolutionCache(this.getCurrentDirectory(), this.getCanonicalFileName.bind(this));
        return (moduleNames, containingFile, reusedNames, redirectedReference, options) => {
            return moduleNames.map((moduleName) => {
                const module = ts.resolveModuleName(moduleName, containingFile, options, this, moduleResolutionCache, redirectedReference);
                return module.resolvedModule;
            });
        };
    }
}

/**
 * Entrypoint to the Angular Compiler (Ivy+) which sits behind the `api.Program` interface, allowing
 * it to be a drop-in replacement for the legacy View Engine compiler to tooling such as the
 * command-line main() function or the Angular CLI.
 */
class NgtscProgram {
    options;
    compiler;
    /**
     * The primary TypeScript program, which is used for analysis and emit.
     */
    tsProgram;
    host;
    incrementalStrategy;
    constructor(rootNames, options, delegateHost, oldProgram) {
        this.options = options;
        const perfRecorder = ActivePerfRecorder.zeroedToNow();
        perfRecorder.phase(checker.PerfPhase.Setup);
        // First, check whether the current TS version is supported.
        if (!options.disableTypeScriptVersionCheck) {
            verifySupportedTypeScriptVersion();
        }
        // In local compilation mode there are almost always (many) emit errors due to imports that
        // cannot be resolved. So we should emit regardless.
        if (options.compilationMode === 'experimental-local') {
            options.noEmitOnError = false;
        }
        const reuseProgram = oldProgram?.compiler.getCurrentProgram();
        this.host = NgCompilerHost.wrap(delegateHost, rootNames, options, reuseProgram ?? null);
        if (reuseProgram !== undefined) {
            // Prior to reusing the old program, restore shim tagging for all its `ts.SourceFile`s.
            // TypeScript checks the `referencedFiles` of `ts.SourceFile`s for changes when evaluating
            // incremental reuse of data from the old program, so it's important that these match in order
            // to get the most benefit out of reuse.
            checker.retagAllTsFiles(reuseProgram);
        }
        this.tsProgram = perfRecorder.inPhase(checker.PerfPhase.TypeScriptProgramCreate, () => ts.createProgram(this.host.inputFiles, options, this.host, reuseProgram));
        perfRecorder.phase(checker.PerfPhase.Unaccounted);
        perfRecorder.memory(checker.PerfCheckpoint.TypeScriptProgramCreate);
        this.host.postProgramCreationCleanup();
        const programDriver = new TsCreateProgramDriver(this.tsProgram, this.host, this.options, this.host.shimExtensionPrefixes);
        this.incrementalStrategy =
            oldProgram !== undefined
                ? oldProgram.incrementalStrategy.toNextBuildStrategy()
                : new TrackedIncrementalBuildStrategy();
        const modifiedResourceFiles = new Set();
        if (this.host.getModifiedResourceFiles !== undefined) {
            const strings = this.host.getModifiedResourceFiles();
            if (strings !== undefined) {
                for (const fileString of strings) {
                    modifiedResourceFiles.add(checker.absoluteFrom(fileString));
                }
            }
        }
        let ticket;
        if (oldProgram === undefined) {
            ticket = freshCompilationTicket(this.tsProgram, options, this.incrementalStrategy, programDriver, perfRecorder, 
            /* enableTemplateTypeChecker */ false, 
            /* usePoisonedData */ false);
        }
        else {
            ticket = incrementalFromCompilerTicket(oldProgram.compiler, this.tsProgram, this.incrementalStrategy, programDriver, modifiedResourceFiles, perfRecorder);
        }
        // Create the NgCompiler which will drive the rest of the compilation.
        this.compiler = NgCompiler.fromTicket(ticket, this.host);
    }
    getTsProgram() {
        return this.tsProgram;
    }
    getReuseTsProgram() {
        return this.compiler.getCurrentProgram();
    }
    getTsOptionDiagnostics(cancellationToken) {
        return this.compiler.perfRecorder.inPhase(checker.PerfPhase.TypeScriptDiagnostics, () => this.tsProgram.getOptionsDiagnostics(cancellationToken));
    }
    getTsSyntacticDiagnostics(sourceFile, cancellationToken) {
        return this.compiler.perfRecorder.inPhase(checker.PerfPhase.TypeScriptDiagnostics, () => {
            const ignoredFiles = this.compiler.ignoreForDiagnostics;
            let res;
            if (sourceFile !== undefined) {
                if (ignoredFiles.has(sourceFile)) {
                    return [];
                }
                res = this.tsProgram.getSyntacticDiagnostics(sourceFile, cancellationToken);
            }
            else {
                const diagnostics = [];
                for (const sf of this.tsProgram.getSourceFiles()) {
                    if (!ignoredFiles.has(sf)) {
                        diagnostics.push(...this.tsProgram.getSyntacticDiagnostics(sf, cancellationToken));
                    }
                }
                res = diagnostics;
            }
            return res;
        });
    }
    getTsSemanticDiagnostics(sourceFile, cancellationToken) {
        // No TS semantic check should be done in local compilation mode, as it is always full of errors
        // due to cross file imports.
        if (this.options.compilationMode === 'experimental-local') {
            return [];
        }
        return this.compiler.perfRecorder.inPhase(checker.PerfPhase.TypeScriptDiagnostics, () => {
            const ignoredFiles = this.compiler.ignoreForDiagnostics;
            let res;
            if (sourceFile !== undefined) {
                if (ignoredFiles.has(sourceFile)) {
                    return [];
                }
                res = this.tsProgram.getSemanticDiagnostics(sourceFile, cancellationToken);
            }
            else {
                const diagnostics = [];
                for (const sf of this.tsProgram.getSourceFiles()) {
                    if (!ignoredFiles.has(sf)) {
                        diagnostics.push(...this.tsProgram.getSemanticDiagnostics(sf, cancellationToken));
                    }
                }
                res = diagnostics;
            }
            return res;
        });
    }
    getNgOptionDiagnostics(cancellationToken) {
        return this.compiler.getOptionDiagnostics();
    }
    getNgStructuralDiagnostics(cancellationToken) {
        return [];
    }
    getNgSemanticDiagnostics(fileName, cancellationToken) {
        let sf = undefined;
        if (fileName !== undefined) {
            sf = this.tsProgram.getSourceFile(fileName);
            if (sf === undefined) {
                // There are no diagnostics for files which don't exist in the program - maybe the caller
                // has stale data?
                return [];
            }
        }
        if (sf === undefined) {
            return this.compiler.getDiagnostics();
        }
        else {
            return this.compiler.getDiagnosticsForFile(sf, checker.OptimizeFor.WholeProgram);
        }
    }
    /**
     * Ensure that the `NgCompiler` has properly analyzed the program, and allow for the asynchronous
     * loading of any resources during the process.
     *
     * This is used by the Angular CLI to allow for spawning (async) child compilations for things
     * like SASS files used in `styleUrls`.
     */
    loadNgStructureAsync() {
        return this.compiler.analyzeAsync();
    }
    listLazyRoutes(entryRoute) {
        return [];
    }
    emitXi18n() {
        const ctx = new MessageBundle(new compiler.HtmlParser(), [], {}, this.options.i18nOutLocale ?? null, this.options.i18nPreserveWhitespaceForLegacyExtraction);
        this.compiler.xi18n(ctx);
        i18nExtract(this.options.i18nOutFormat ?? null, this.options.i18nOutFile ?? null, this.host, this.options, ctx, checker.resolve);
    }
    emit(opts) {
        // Check if emission of the i18n messages bundle was requested.
        if (opts !== undefined &&
            opts.emitFlags !== undefined &&
            opts.emitFlags & exports.EmitFlags.I18nBundle) {
            this.emitXi18n();
            // `api.EmitFlags` is a View Engine compiler concept. We only pay attention to the absence of
            // the other flags here if i18n emit was requested (since this is usually done in the xi18n
            // flow, where we don't want to emit JS at all).
            if (!(opts.emitFlags & exports.EmitFlags.JS)) {
                return {
                    diagnostics: [],
                    emitSkipped: true,
                    emittedFiles: [],
                };
            }
        }
        const forceEmit = opts?.forceEmit ?? false;
        this.compiler.perfRecorder.memory(checker.PerfCheckpoint.PreEmit);
        const res = this.compiler.perfRecorder.inPhase(checker.PerfPhase.TypeScriptEmit, () => {
            const { transformers } = this.compiler.prepareEmit();
            const ignoreFiles = this.compiler.ignoreForEmit;
            const emitCallback = (opts?.emitCallback ??
                defaultEmitCallback);
            const writeFile = (fileName, data, writeByteOrderMark, onError, sourceFiles) => {
                if (sourceFiles !== undefined) {
                    // Record successful writes for any `ts.SourceFile` (that's not a declaration file)
                    // that's an input to this write.
                    for (const writtenSf of sourceFiles) {
                        if (writtenSf.isDeclarationFile) {
                            continue;
                        }
                        this.compiler.incrementalCompilation.recordSuccessfulEmit(writtenSf);
                    }
                }
                this.host.writeFile(fileName, data, writeByteOrderMark, onError, sourceFiles);
            };
            const customTransforms = opts && opts.customTransformers;
            const beforeTransforms = transformers.before || [];
            const afterDeclarationsTransforms = transformers.afterDeclarations;
            if (customTransforms !== undefined && customTransforms.beforeTs !== undefined) {
                beforeTransforms.push(...customTransforms.beforeTs);
            }
            const emitResults = [];
            for (const targetSourceFile of this.tsProgram.getSourceFiles()) {
                if (targetSourceFile.isDeclarationFile || ignoreFiles.has(targetSourceFile)) {
                    continue;
                }
                if (!forceEmit && this.compiler.incrementalCompilation.safeToSkipEmit(targetSourceFile)) {
                    this.compiler.perfRecorder.eventCount(checker.PerfEvent.EmitSkipSourceFile);
                    continue;
                }
                this.compiler.perfRecorder.eventCount(checker.PerfEvent.EmitSourceFile);
                emitResults.push(emitCallback({
                    targetSourceFile,
                    program: this.tsProgram,
                    host: this.host,
                    options: this.options,
                    emitOnlyDtsFiles: false,
                    writeFile,
                    customTransformers: {
                        before: beforeTransforms,
                        after: customTransforms && customTransforms.afterTs,
                        afterDeclarations: afterDeclarationsTransforms,
                    },
                }));
            }
            this.compiler.perfRecorder.memory(checker.PerfCheckpoint.Emit);
            // Run the emit, including a custom transformer that will downlevel the Ivy decorators in
            // code.
            return ((opts && opts.mergeEmitResultsCallback) || mergeEmitResults)(emitResults);
        });
        // Record performance analysis information to disk if we've been asked to do so.
        if (this.options.tracePerformance !== undefined) {
            const perf = this.compiler.perfRecorder.finalize();
            checker.getFileSystem().writeFile(checker.getFileSystem().resolve(this.options.tracePerformance), JSON.stringify(perf, null, 2));
        }
        return res;
    }
    getIndexedComponents() {
        return this.compiler.getIndexedComponents();
    }
    /**
     * Gets information for the current program that may be used to generate API
     * reference documentation. This includes Angular-specific information, such
     * as component inputs and outputs.
     *
     * @param entryPoint Path to the entry point for the package for which API
     *     docs should be extracted.
     */
    getApiDocumentation(entryPoint, privateModules) {
        return this.compiler.getApiDocumentation(entryPoint, privateModules);
    }
    getEmittedSourceFiles() {
        throw new Error('Method not implemented.');
    }
}
const defaultEmitCallback = ({ program, targetSourceFile, writeFile, cancellationToken, emitOnlyDtsFiles, customTransformers, }) => program.emit(targetSourceFile, writeFile, cancellationToken, emitOnlyDtsFiles, customTransformers);
function mergeEmitResults(emitResults) {
    const diagnostics = [];
    let emitSkipped = false;
    const emittedFiles = [];
    for (const er of emitResults) {
        diagnostics.push(...er.diagnostics);
        emitSkipped = emitSkipped || er.emitSkipped;
        emittedFiles.push(...(er.emittedFiles || []));
    }
    return { diagnostics, emitSkipped, emittedFiles };
}

var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["debug"] = 0] = "debug";
    LogLevel[LogLevel["info"] = 1] = "info";
    LogLevel[LogLevel["warn"] = 2] = "warn";
    LogLevel[LogLevel["error"] = 3] = "error";
})(LogLevel || (LogLevel = {}));

checker.setFileSystem(new checker.NodeJSFileSystem());

exports.DtsMetadataReader = DtsMetadataReader;
exports.NgtscProgram = NgtscProgram;
exports.PartialEvaluator = PartialEvaluator;
exports.UNKNOWN_ERROR_CODE = UNKNOWN_ERROR_CODE;
exports.extractTemplate = extractTemplate;
