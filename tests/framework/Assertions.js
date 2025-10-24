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

    const createError = (message, customData) => {
        const error = new Error(message);
        // Attach custom properties for the reporter to use
        Object.assign(error, customData);
        return error;
    };

    const assertEqual = (actual, expected, message) => {
        if (actual !== expected) {
            throw createError(`Assertion Failed: Expected "${expected}" but got "${actual}"`, {
                customMessage: message,
                expected: expected,
                actual: actual,
                type: 'assertEqual'
            });
        }
    };

    const assertDeepEqual = (actual, expected, message) => {
        if (!deepEqual(actual, expected)) {
             throw createError('Assertion Failed: Objects are not deeply equal', {
                customMessage: message,
                expected: expected,
                actual: actual,
                type: 'assertDeepEqual'
            });
        }
    };

    const assertTrue = (value, message) => {
        if (!value) {
            throw createError(`Assertion Failed: Expected true but got ${value}`, {
                customMessage: message,
                expected: true,
                actual: value,
                type: 'assertTrue'
            });
        }
    };

    return {
        assertEqual,
        assertDeepEqual,
        assertTrue,
    };
}