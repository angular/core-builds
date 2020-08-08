/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertNumber, assertString } from '../util/assert';
import { COMMENT_MARKER, ELEMENT_MARKER, getInstructionFromI18nMutateOpCode, getParentFromI18nMutateOpCode, getRefFromI18nMutateOpCode } from './interfaces/i18n';
/**
 * Converts `I18nUpdateOpCodes` array into a human readable format.
 *
 * This function is attached to the `I18nUpdateOpCodes.debug` property if `ngDevMode` is enabled.
 * This function provides a human readable view of the opcodes. This is useful when debugging the
 * application as well as writing more readable tests.
 *
 * @param this `I18nUpdateOpCodes` if attached as a method.
 * @param opcodes `I18nUpdateOpCodes` if invoked as a function.
 */
export function i18nUpdateOpCodesToString(opcodes) {
    const parser = new OpCodeParser(opcodes || (Array.isArray(this) ? this : []));
    let lines = [];
    function consumeOpCode(value) {
        const ref = value >>> 2 /* SHIFT_REF */;
        const opCode = value & 3 /* MASK_OPCODE */;
        switch (opCode) {
            case 0 /* Text */:
                return `(lView[${ref}] as Text).textContent = $$$`;
            case 1 /* Attr */:
                const attrName = parser.consumeString();
                const sanitizationFn = parser.consumeFunction();
                const value = sanitizationFn ? `(${sanitizationFn})($$$)` : '$$$';
                return `(lView[${ref}] as Element).setAttribute('${attrName}', ${value})`;
            case 2 /* IcuSwitch */:
                return `icuSwitchCase(lView[${ref}] as Comment, ${parser.consumeNumber()}, $$$)`;
            case 3 /* IcuUpdate */:
                return `icuUpdateCase(lView[${ref}] as Comment, ${parser.consumeNumber()})`;
        }
        throw new Error('unexpected OpCode');
    }
    while (parser.hasMore()) {
        let mask = parser.consumeNumber();
        let size = parser.consumeNumber();
        const end = parser.i + size;
        const statements = [];
        let statement = '';
        while (parser.i < end) {
            let value = parser.consumeNumberOrString();
            if (typeof value === 'string') {
                statement += value;
            }
            else if (value < 0) {
                // Negative numbers are ref indexes
                statement += '${lView[' + (0 - value) + ']}';
            }
            else {
                // Positive numbers are operations.
                const opCodeText = consumeOpCode(value);
                statements.push(opCodeText.replace('$$$', '`' + statement + '`') + ';');
                statement = '';
            }
        }
        lines.push(`if (mask & 0b${mask.toString(2)}) { ${statements.join(' ')} }`);
    }
    return lines;
}
/**
 * Converts `I18nMutableOpCodes` array into a human readable format.
 *
 * This function is attached to the `I18nMutableOpCodes.debug` if `ngDevMode` is enabled. This
 * function provides a human readable view of the opcodes. This is useful when debugging the
 * application as well as writing more readable tests.
 *
 * @param this `I18nMutableOpCodes` if attached as a method.
 * @param opcodes `I18nMutableOpCodes` if invoked as a function.
 */
export function i18nMutateOpCodesToString(opcodes) {
    const parser = new OpCodeParser(opcodes || (Array.isArray(this) ? this : []));
    let lines = [];
    function consumeOpCode(opCode) {
        const parent = getParentFromI18nMutateOpCode(opCode);
        const ref = getRefFromI18nMutateOpCode(opCode);
        switch (getInstructionFromI18nMutateOpCode(opCode)) {
            case 0 /* Select */:
                lastRef = ref;
                return '';
            case 1 /* AppendChild */:
                return `(lView[${parent}] as Element).appendChild(lView[${lastRef}])`;
            case 3 /* Remove */:
                return `(lView[${parent}] as Element).remove(lView[${ref}])`;
            case 4 /* Attr */:
                return `(lView[${ref}] as Element).setAttribute("${parser.consumeString()}", "${parser.consumeString()}")`;
            case 5 /* ElementEnd */:
                return `setPreviousOrParentTNode(tView.data[${ref}] as TNode)`;
            case 6 /* RemoveNestedIcu */:
                return `removeNestedICU(${ref})`;
        }
        throw new Error('Unexpected OpCode');
    }
    let lastRef = -1;
    while (parser.hasMore()) {
        let value = parser.consumeNumberStringOrMarker();
        if (value === COMMENT_MARKER) {
            const text = parser.consumeString();
            lastRef = parser.consumeNumber();
            lines.push(`lView[${lastRef}] = document.createComment("${text}")`);
        }
        else if (value === ELEMENT_MARKER) {
            const text = parser.consumeString();
            lastRef = parser.consumeNumber();
            lines.push(`lView[${lastRef}] = document.createElement("${text}")`);
        }
        else if (typeof value === 'string') {
            lastRef = parser.consumeNumber();
            lines.push(`lView[${lastRef}] = document.createTextNode("${value}")`);
        }
        else if (typeof value === 'number') {
            const line = consumeOpCode(value);
            line && lines.push(line);
        }
        else {
            throw new Error('Unexpected value');
        }
    }
    return lines;
}
class OpCodeParser {
    constructor(codes) {
        this.i = 0;
        this.codes = codes;
    }
    hasMore() {
        return this.i < this.codes.length;
    }
    consumeNumber() {
        let value = this.codes[this.i++];
        assertNumber(value, 'expecting number in OpCode');
        return value;
    }
    consumeString() {
        let value = this.codes[this.i++];
        assertString(value, 'expecting string in OpCode');
        return value;
    }
    consumeFunction() {
        let value = this.codes[this.i++];
        if (value === null || typeof value === 'function') {
            return value;
        }
        throw new Error('expecting function in OpCode');
    }
    consumeNumberOrString() {
        let value = this.codes[this.i++];
        if (typeof value === 'string') {
            return value;
        }
        assertNumber(value, 'expecting number or string in OpCode');
        return value;
    }
    consumeNumberStringOrMarker() {
        let value = this.codes[this.i++];
        if (typeof value === 'string' || typeof value === 'number' || value == COMMENT_MARKER ||
            value == ELEMENT_MARKER) {
            return value;
        }
        assertNumber(value, 'expecting number, string, COMMENT_MARKER or ELEMENT_MARKER in OpCode');
        return value;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bl9kZWJ1Zy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bl9kZWJ1Zy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFFLFlBQVksRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRTFELE9BQU8sRUFBQyxjQUFjLEVBQUUsY0FBYyxFQUFFLGtDQUFrQyxFQUFFLDZCQUE2QixFQUFFLDBCQUEwQixFQUEyRSxNQUFNLG1CQUFtQixDQUFDO0FBRTFPOzs7Ozs7Ozs7R0FTRztBQUNILE1BQU0sVUFBVSx5QkFBeUIsQ0FDUCxPQUEyQjtJQUMzRCxNQUFNLE1BQU0sR0FBRyxJQUFJLFlBQVksQ0FBQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDOUUsSUFBSSxLQUFLLEdBQWEsRUFBRSxDQUFDO0lBRXpCLFNBQVMsYUFBYSxDQUFDLEtBQWE7UUFDbEMsTUFBTSxHQUFHLEdBQUcsS0FBSyxzQkFBK0IsQ0FBQztRQUNqRCxNQUFNLE1BQU0sR0FBRyxLQUFLLHNCQUErQixDQUFDO1FBQ3BELFFBQVEsTUFBTSxFQUFFO1lBQ2Q7Z0JBQ0UsT0FBTyxVQUFVLEdBQUcsOEJBQThCLENBQUM7WUFDckQ7Z0JBQ0UsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN4QyxNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ2hELE1BQU0sS0FBSyxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsSUFBSSxjQUFjLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO2dCQUNsRSxPQUFPLFVBQVUsR0FBRywrQkFBK0IsUUFB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UUFDNUQsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQsMkJBQTJCO1FBQ3pCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDakMsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssSUFBSSxjQUFjO1lBQ2pGLEtBQUssSUFBSSxjQUFjLEVBQUU7WUFDM0IsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUNELFlBQVksQ0FBQyxLQUFLLEVBQUUsc0VBQXNFLENBQUMsQ0FBQztRQUM1RixPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydE51bWJlciwgYXNzZXJ0U3RyaW5nfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7Q09NTUVOVF9NQVJLRVIsIEVMRU1FTlRfTUFSS0VSLCBnZXRJbnN0cnVjdGlvbkZyb21JMThuTXV0YXRlT3BDb2RlLCBnZXRQYXJlbnRGcm9tSTE4bk11dGF0ZU9wQ29kZSwgZ2V0UmVmRnJvbUkxOG5NdXRhdGVPcENvZGUsIEkxOG5NdXRhdGVPcENvZGUsIEkxOG5NdXRhdGVPcENvZGVzLCBJMThuVXBkYXRlT3BDb2RlLCBJMThuVXBkYXRlT3BDb2Rlc30gZnJvbSAnLi9pbnRlcmZhY2VzL2kxOG4nO1xuXG4vKipcbiAqIENvbnZlcnRzIGBJMThuVXBkYXRlT3BDb2Rlc2AgYXJyYXkgaW50byBhIGh1bWFuIHJlYWRhYmxlIGZvcm1hdC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGF0dGFjaGVkIHRvIHRoZSBgSTE4blVwZGF0ZU9wQ29kZXMuZGVidWdgIHByb3BlcnR5IGlmIGBuZ0Rldk1vZGVgIGlzIGVuYWJsZWQuXG4gKiBUaGlzIGZ1bmN0aW9uIHByb3ZpZGVzIGEgaHVtYW4gcmVhZGFibGUgdmlldyBvZiB0aGUgb3Bjb2Rlcy4gVGhpcyBpcyB1c2VmdWwgd2hlbiBkZWJ1Z2dpbmcgdGhlXG4gKiBhcHBsaWNhdGlvbiBhcyB3ZWxsIGFzIHdyaXRpbmcgbW9yZSByZWFkYWJsZSB0ZXN0cy5cbiAqXG4gKiBAcGFyYW0gdGhpcyBgSTE4blVwZGF0ZU9wQ29kZXNgIGlmIGF0dGFjaGVkIGFzIGEgbWV0aG9kLlxuICogQHBhcmFtIG9wY29kZXMgYEkxOG5VcGRhdGVPcENvZGVzYCBpZiBpbnZva2VkIGFzIGEgZnVuY3Rpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuVXBkYXRlT3BDb2Rlc1RvU3RyaW5nKFxuICAgIHRoaXM6IEkxOG5VcGRhdGVPcENvZGVzfHZvaWQsIG9wY29kZXM/OiBJMThuVXBkYXRlT3BDb2Rlcyk6IHN0cmluZ1tdIHtcbiAgY29uc3QgcGFyc2VyID0gbmV3IE9wQ29kZVBhcnNlcihvcGNvZGVzIHx8IChBcnJheS5pc0FycmF5KHRoaXMpID8gdGhpcyA6IFtdKSk7XG4gIGxldCBsaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBmdW5jdGlvbiBjb25zdW1lT3BDb2RlKHZhbHVlOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIGNvbnN0IHJlZiA9IHZhbHVlID4+PiBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICBjb25zdCBvcENvZGUgPSB2YWx1ZSAmIEkxOG5VcGRhdGVPcENvZGUuTUFTS19PUENPREU7XG4gICAgc3dpdGNoIChvcENvZGUpIHtcbiAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5UZXh0OlxuICAgICAgICByZXR1cm4gYChsVmlld1ske3JlZn1dIGFzIFRleHQpLnRleHRDb250ZW50ID0gJCQkYDtcbiAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5BdHRyOlxuICAgICAgICBjb25zdCBhdHRyTmFtZSA9IHBhcnNlci5jb25zdW1lU3RyaW5nKCk7XG4gICAgICAgIGNvbnN0IHNhbml0aXphdGlvbkZuID0gcGFyc2VyLmNvbnN1bWVGdW5jdGlvbigpO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHNhbml0aXphdGlvbkZuID8gYCgke3Nhbml0aXphdGlvbkZufSkoJCQkKWAgOiAnJCQkJztcbiAgICAgICAgcmV0dXJuIGAobFZpZXdbJHtyZWZ9XSBhcyBFbGVtZW50KS5zZXRBdHRyaWJ1dGUoJyR7YXR0ck5hbWV9JywgJHt2YWx1ZX0pYDtcbiAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5JY3VTd2l0Y2g6XG4gICAgICAgIHJldHVybiBgaWN1U3dpdGNoQ2FzZShsVmlld1ske3JlZn1dIGFzIENvbW1lbnQsICR7cGFyc2VyLmNvbnN1bWVOdW1iZXIoKX0sICQkJClgO1xuICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLkljdVVwZGF0ZTpcbiAgICAgICAgcmV0dXJuIGBpY3VVcGRhdGVDYXNlKGxWaWV3WyR7cmVmfV0gYXMgQ29tbWVudCwgJHtwYXJzZXIuY29uc3VtZU51bWJlcigpfSlgO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3VuZXhwZWN0ZWQgT3BDb2RlJyk7XG4gIH1cblxuXG4gIHdoaWxlIChwYXJzZXIuaGFzTW9yZSgpKSB7XG4gICAgbGV0IG1hc2sgPSBwYXJzZXIuY29uc3VtZU51bWJlcigpO1xuICAgIGxldCBzaXplID0gcGFyc2VyLmNvbnN1bWVOdW1iZXIoKTtcbiAgICBjb25zdCBlbmQgPSBwYXJzZXIuaSArIHNpemU7XG4gICAgY29uc3Qgc3RhdGVtZW50czogc3RyaW5nW10gPSBbXTtcbiAgICBsZXQgc3RhdGVtZW50ID0gJyc7XG4gICAgd2hpbGUgKHBhcnNlci5pIDwgZW5kKSB7XG4gICAgICBsZXQgdmFsdWUgPSBwYXJzZXIuY29uc3VtZU51bWJlck9yU3RyaW5nKCk7XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICBzdGF0ZW1lbnQgKz0gdmFsdWU7XG4gICAgICB9IGVsc2UgaWYgKHZhbHVlIDwgMCkge1xuICAgICAgICAvLyBOZWdhdGl2ZSBudW1iZXJzIGFyZSByZWYgaW5kZXhlc1xuICAgICAgICBzdGF0ZW1lbnQgKz0gJyR7bFZpZXdbJyArICgwIC0gdmFsdWUpICsgJ119JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFBvc2l0aXZlIG51bWJlcnMgYXJlIG9wZXJhdGlvbnMuXG4gICAgICAgIGNvbnN0IG9wQ29kZVRleHQgPSBjb25zdW1lT3BDb2RlKHZhbHVlKTtcbiAgICAgICAgc3RhdGVtZW50cy5wdXNoKG9wQ29kZVRleHQucmVwbGFjZSgnJCQkJywgJ2AnICsgc3RhdGVtZW50ICsgJ2AnKSArICc7Jyk7XG4gICAgICAgIHN0YXRlbWVudCA9ICcnO1xuICAgICAgfVxuICAgIH1cbiAgICBsaW5lcy5wdXNoKGBpZiAobWFzayAmIDBiJHttYXNrLnRvU3RyaW5nKDIpfSkgeyAke3N0YXRlbWVudHMuam9pbignICcpfSB9YCk7XG4gIH1cbiAgcmV0dXJuIGxpbmVzO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGBJMThuTXV0YWJsZU9wQ29kZXNgIGFycmF5IGludG8gYSBodW1hbiByZWFkYWJsZSBmb3JtYXQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBhdHRhY2hlZCB0byB0aGUgYEkxOG5NdXRhYmxlT3BDb2Rlcy5kZWJ1Z2AgaWYgYG5nRGV2TW9kZWAgaXMgZW5hYmxlZC4gVGhpc1xuICogZnVuY3Rpb24gcHJvdmlkZXMgYSBodW1hbiByZWFkYWJsZSB2aWV3IG9mIHRoZSBvcGNvZGVzLiBUaGlzIGlzIHVzZWZ1bCB3aGVuIGRlYnVnZ2luZyB0aGVcbiAqIGFwcGxpY2F0aW9uIGFzIHdlbGwgYXMgd3JpdGluZyBtb3JlIHJlYWRhYmxlIHRlc3RzLlxuICpcbiAqIEBwYXJhbSB0aGlzIGBJMThuTXV0YWJsZU9wQ29kZXNgIGlmIGF0dGFjaGVkIGFzIGEgbWV0aG9kLlxuICogQHBhcmFtIG9wY29kZXMgYEkxOG5NdXRhYmxlT3BDb2Rlc2AgaWYgaW52b2tlZCBhcyBhIGZ1bmN0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bk11dGF0ZU9wQ29kZXNUb1N0cmluZyhcbiAgICB0aGlzOiBJMThuTXV0YXRlT3BDb2Rlc3x2b2lkLCBvcGNvZGVzPzogSTE4bk11dGF0ZU9wQ29kZXMpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IHBhcnNlciA9IG5ldyBPcENvZGVQYXJzZXIob3Bjb2RlcyB8fCAoQXJyYXkuaXNBcnJheSh0aGlzKSA/IHRoaXMgOiBbXSkpO1xuICBsZXQgbGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgZnVuY3Rpb24gY29uc3VtZU9wQ29kZShvcENvZGU6IG51bWJlcik6IHN0cmluZyB7XG4gICAgY29uc3QgcGFyZW50ID0gZ2V0UGFyZW50RnJvbUkxOG5NdXRhdGVPcENvZGUob3BDb2RlKTtcbiAgICBjb25zdCByZWYgPSBnZXRSZWZGcm9tSTE4bk11dGF0ZU9wQ29kZShvcENvZGUpO1xuICAgIHN3aXRjaCAoZ2V0SW5zdHJ1Y3Rpb25Gcm9tSTE4bk11dGF0ZU9wQ29kZShvcENvZGUpKSB7XG4gICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuU2VsZWN0OlxuICAgICAgICBsYXN0UmVmID0gcmVmO1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQ6XG4gICAgICAgIHJldHVybiBgKGxWaWV3WyR7cGFyZW50fV0gYXMgRWxlbWVudCkuYXBwZW5kQ2hpbGQobFZpZXdbJHtsYXN0UmVmfV0pYDtcbiAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmU6XG4gICAgICAgIHJldHVybiBgKGxWaWV3WyR7cGFyZW50fV0gYXMgRWxlbWVudCkucmVtb3ZlKGxWaWV3WyR7cmVmfV0pYDtcbiAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5BdHRyOlxuICAgICAgICByZXR1cm4gYChsVmlld1ske3JlZn1dIGFzIEVsZW1lbnQpLnNldEF0dHJpYnV0ZShcIiR7cGFyc2VyLmNvbnN1bWVTdHJpbmcoKX1cIiwgXCIke1xuICAgICAgICAgICAgcGFyc2VyLmNvbnN1bWVTdHJpbmcoKX1cIilgO1xuICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLkVsZW1lbnRFbmQ6XG4gICAgICAgIHJldHVybiBgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHRWaWV3LmRhdGFbJHtyZWZ9XSBhcyBUTm9kZSlgO1xuICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZU5lc3RlZEljdTpcbiAgICAgICAgcmV0dXJuIGByZW1vdmVOZXN0ZWRJQ1UoJHtyZWZ9KWA7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcignVW5leHBlY3RlZCBPcENvZGUnKTtcbiAgfVxuXG4gIGxldCBsYXN0UmVmID0gLTE7XG4gIHdoaWxlIChwYXJzZXIuaGFzTW9yZSgpKSB7XG4gICAgbGV0IHZhbHVlID0gcGFyc2VyLmNvbnN1bWVOdW1iZXJTdHJpbmdPck1hcmtlcigpO1xuICAgIGlmICh2YWx1ZSA9PT0gQ09NTUVOVF9NQVJLRVIpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBwYXJzZXIuY29uc3VtZVN0cmluZygpO1xuICAgICAgbGFzdFJlZiA9IHBhcnNlci5jb25zdW1lTnVtYmVyKCk7XG4gICAgICBsaW5lcy5wdXNoKGBsVmlld1ske2xhc3RSZWZ9XSA9IGRvY3VtZW50LmNyZWF0ZUNvbW1lbnQoXCIke3RleHR9XCIpYCk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gRUxFTUVOVF9NQVJLRVIpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBwYXJzZXIuY29uc3VtZVN0cmluZygpO1xuICAgICAgbGFzdFJlZiA9IHBhcnNlci5jb25zdW1lTnVtYmVyKCk7XG4gICAgICBsaW5lcy5wdXNoKGBsVmlld1ske2xhc3RSZWZ9XSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCIke3RleHR9XCIpYCk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBsYXN0UmVmID0gcGFyc2VyLmNvbnN1bWVOdW1iZXIoKTtcbiAgICAgIGxpbmVzLnB1c2goYGxWaWV3WyR7bGFzdFJlZn1dID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCIke3ZhbHVlfVwiKWApO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgICAgY29uc3QgbGluZSA9IGNvbnN1bWVPcENvZGUodmFsdWUpO1xuICAgICAgbGluZSAmJiBsaW5lcy5wdXNoKGxpbmUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuZXhwZWN0ZWQgdmFsdWUnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbGluZXM7XG59XG5cblxuY2xhc3MgT3BDb2RlUGFyc2VyIHtcbiAgaTogbnVtYmVyID0gMDtcbiAgY29kZXM6IGFueVtdO1xuXG4gIGNvbnN0cnVjdG9yKGNvZGVzOiBhbnlbXSkge1xuICAgIHRoaXMuY29kZXMgPSBjb2RlcztcbiAgfVxuXG4gIGhhc01vcmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuaSA8IHRoaXMuY29kZXMubGVuZ3RoO1xuICB9XG5cbiAgY29uc3VtZU51bWJlcigpOiBudW1iZXIge1xuICAgIGxldCB2YWx1ZSA9IHRoaXMuY29kZXNbdGhpcy5pKytdO1xuICAgIGFzc2VydE51bWJlcih2YWx1ZSwgJ2V4cGVjdGluZyBudW1iZXIgaW4gT3BDb2RlJyk7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgY29uc3VtZVN0cmluZygpOiBzdHJpbmcge1xuICAgIGxldCB2YWx1ZSA9IHRoaXMuY29kZXNbdGhpcy5pKytdO1xuICAgIGFzc2VydFN0cmluZyh2YWx1ZSwgJ2V4cGVjdGluZyBzdHJpbmcgaW4gT3BDb2RlJyk7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgY29uc3VtZUZ1bmN0aW9uKCk6IEZ1bmN0aW9ufG51bGwge1xuICAgIGxldCB2YWx1ZSA9IHRoaXMuY29kZXNbdGhpcy5pKytdO1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKCdleHBlY3RpbmcgZnVuY3Rpb24gaW4gT3BDb2RlJyk7XG4gIH1cblxuICBjb25zdW1lTnVtYmVyT3JTdHJpbmcoKTogbnVtYmVyfHN0cmluZyB7XG4gICAgbGV0IHZhbHVlID0gdGhpcy5jb2Rlc1t0aGlzLmkrK107XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgYXNzZXJ0TnVtYmVyKHZhbHVlLCAnZXhwZWN0aW5nIG51bWJlciBvciBzdHJpbmcgaW4gT3BDb2RlJyk7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgY29uc3VtZU51bWJlclN0cmluZ09yTWFya2VyKCk6IG51bWJlcnxzdHJpbmd8Q09NTUVOVF9NQVJLRVJ8RUxFTUVOVF9NQVJLRVIge1xuICAgIGxldCB2YWx1ZSA9IHRoaXMuY29kZXNbdGhpcy5pKytdO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgfHwgdmFsdWUgPT0gQ09NTUVOVF9NQVJLRVIgfHxcbiAgICAgICAgdmFsdWUgPT0gRUxFTUVOVF9NQVJLRVIpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgYXNzZXJ0TnVtYmVyKHZhbHVlLCAnZXhwZWN0aW5nIG51bWJlciwgc3RyaW5nLCBDT01NRU5UX01BUktFUiBvciBFTEVNRU5UX01BUktFUiBpbiBPcENvZGUnKTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbn1cbiJdfQ==