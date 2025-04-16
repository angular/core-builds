'use strict';
/**
 * @license Angular v20.0.0-next.6+sha-f22c72b
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

/**
 * Gets the leading line whitespace of a given node.
 *
 * Useful for inserting e.g. TODOs without breaking indentation.
 */
function getLeadingLineWhitespaceOfNode(node) {
    const fullText = node.getFullText().substring(0, node.getStart() - node.getFullStart());
    let result = '';
    for (let i = fullText.length - 1; i > -1; i--) {
        // Note: LF line endings are `\n` while CRLF are `\r\n`. This logic should cover both, because
        // we start from the beginning of the node and go backwards so will always hit `\n` first.
        if (fullText[i] !== '\n') {
            result = fullText[i] + result;
        }
        else {
            break;
        }
    }
    return result;
}

exports.getLeadingLineWhitespaceOfNode = getLeadingLineWhitespaceOfNode;
