// test-framework.js

const Test = (() => {
    let testTree = { name: "Test Suite", children: [] };
    let suiteStack = [testTree];
    let currentBeforeEach = null;
    let currentAfterEach = null;

    function deepEqual(a, b) {
        if (a === b) return true;
        if (a === null || typeof a !== 'object' || b === null || typeof b !== 'object') return false;
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        for (const key of keysA) {
            if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
        }
        return true;
    }

    const describe = (suiteName, suiteFn) => {
        const parentSuite = suiteStack[suiteStack.length - 1];
        const newSuite = { name: suiteName, children: [] };
        parentSuite.children.push(newSuite);
        suiteStack.push(newSuite);
        const parentBeforeEach = currentBeforeEach;
        const parentAfterEach = currentAfterEach;
        currentBeforeEach = null;
        currentAfterEach = null;
        try {
            suiteFn();
        } finally {
            suiteStack.pop();
            currentBeforeEach = parentBeforeEach;
            currentAfterEach = parentAfterEach;
        }
    };

    const it = (description, testFn) => {
        const currentSuite = suiteStack[suiteStack.length - 1];
        try {
            if (currentBeforeEach) currentBeforeEach();
            testFn();
            currentSuite.children.push({ name: description, status: 'PASS' });
        } catch (error) {
            currentSuite.children.push({ name: description, status: 'FAIL', error });
        } finally {
            if (currentAfterEach) currentAfterEach();
        }
    };

    const summarize = () => {
        const collectStats = (suite) => {
            let stats = { passed: 0, failed: 0 };
            for (const child of suite.children) {
                if (child.status === 'PASS') stats.passed++;
                else if (child.status === 'FAIL') stats.failed++;
                else {
                    const nestedStats = collectStats(child);
                    stats.passed += nestedStats.passed;
                    stats.failed += nestedStats.failed;
                }
            }
            return stats;
        };

        // --- NEW, ENHANCED RECURSIVE REPORTER ---
        const printSuite = (suite) => {
            const stats = collectStats(suite);
            const total = stats.passed + stats.failed;
            const groupLabel = total > 0 ? `${suite.name} (${stats.passed}/${total} passed)` : suite.name;
            const groupColor = stats.failed > 0 ? 'color: #e74c3c;' : 'color: #2ecc71;';

            console.groupCollapsed(`%c${groupLabel}`, groupColor);

            // 1. Pre-sort children into categories
            const failedTests = suite.children.filter(c => c.status === 'FAIL');
            const passedTests = suite.children.filter(c => c.status === 'PASS');
            const nestedSuites = suite.children.filter(c => !c.status);

            // 2. Render failures first (if any)
            if (failedTests.length > 0) {
                console.group(`%c✗ Failed Tests`, 'color: #e74c3c;');
                failedTests.forEach(test => {
                    console.groupCollapsed(`%c${test.name}`, 'color: #e74c3c;');
                    console.error(test.error);
                    console.groupEnd();
                });
                console.groupEnd();
            }
            
            // 3. Render passed tests next (if any, and if user wants to see them)
            if (passedTests.length > 0) {
                console.groupCollapsed(`%c✓ Passed Tests`, 'color: #2ecc71;');
                passedTests.forEach(test => {
                    console.log(`%c${test.name}`, 'color: #2ecc71;');
                });
                console.groupEnd();
            }

            // 4. Recursively render nested suites last
            nestedSuites.forEach(subSuite => printSuite(subSuite));

            console.groupEnd();
        };
        
        console.group("--- Test Summary ---");
        
        // Start printing from the root's children to avoid the outer "Test Suite" group
        testTree.children.forEach(suite => printSuite(suite));

        const finalStats = collectStats(testTree);
        const totalCount = finalStats.passed + finalStats.failed;
        const summaryColor = finalStats.failed > 0 ? '#e74c3c' : '#2ecc71';

        console.log(`%cTotal Tests: ${totalCount} | Passed: ${finalStats.passed} | Failed: ${finalStats.failed}`, `color: ${summaryColor}; font-weight: bold; border-top: 1px solid #ccc; padding-top: 5px; margin-top: 10px;`);
        
        console.groupEnd();
    };

    const beforeEach = (fn) => { currentBeforeEach = fn; };
    const afterEach = (fn) => { currentAfterEach = fn; };
    const assertEqual = (actual, expected, message) => { if (actual !== expected) { const m = message ? `\n  Message:  ${message}` : ''; throw new Error(`ASSERTION FAILED:${m}\n  Expected: "${expected}"\n  Actual:   "${actual}"`); } };
    const assertDeepEqual = (actual, expected, message) => { if (!deepEqual(actual, expected)) { const m = message ? `\n  Message:  ${message}` : ''; const a = JSON.stringify(actual, null, 2); const e = JSON.stringify(expected, null, 2); throw new Error(`ASSERTION FAILED:${m}\n  Expected:\n${e}\n\n  Actual:\n${a}`); } };
    const assertTrue = (value, message) => { if (!value) { const m = message ? `\n  Message:  ${message}` : ''; throw new Error(`ASSERTION FAILED:${m}\n  Expected: true\n  Actual:   ${value}`); } };

    return { describe, it, beforeEach, afterEach, assertEqual, assertDeepEqual, assertTrue, summarize };
})();