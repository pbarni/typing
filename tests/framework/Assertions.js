// tests/framework/Assertions.js

function createAssertionsModule() {
    const deepEqual = (a, b) => {
        if (a === b) return true;
        if (a === null || typeof a !== 'object' || b === null || typeof b !== 'object') return false;
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        for (const key of keysA) {
            if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
        }
        return true;
    };

    const assertEqual = (actual, expected, message) => {
        if (actual !== expected) {
            const m = message ? `\n  Message:  ${message}` : '';
            throw new Error(`ASSERTION FAILED:${m}\n  Expected: "${expected}"\n  Actual:   "${actual}"`);
        }
    };

    const assertDeepEqual = (actual, expected, message) => {
        if (!deepEqual(actual, expected)) {
            const m = message ? `\n  Message:  ${message}` : '';
            const a = JSON.stringify(actual, null, 2);
            const e = JSON.stringify(expected, null, 2);
            throw new Error(`ASSERTION FAILED:${m}\n  Expected:\n${e}\n\n  Actual:\n${a}`);
        }
    };

    const assertTrue = (value, message) => {
        if (!value) {
            const m = message ? `\n  Message:  ${message}` : '';
            throw new Error(`ASSERTION FAILED:${m}\n  Expected: true\n  Actual:   ${value}`);
        }
    };

    return {
        assertEqual,
        assertDeepEqual,
        assertTrue,
    };
}