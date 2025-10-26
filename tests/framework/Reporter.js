// tests/framework/Reporter.js

export function createReporterModule() {
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

    const printSuite = (suite) => {
        const stats = collectStats(suite);
        const total = stats.passed + stats.failed;
        const groupLabel = total > 0 ? `${suite.name} (${stats.passed}/${total} passed)` : suite.name;
        const groupColor = stats.failed > 0 ? 'color: #e74c3c;' : 'color: #2ecc71;';

        if (total > 0) {
            console.groupCollapsed(`%c${groupLabel}`, groupColor);
        } else if (suite.children.length > 0) {
            console.groupCollapsed(groupLabel);
        } else {
             return;
        }

        const failedTests = suite.children.filter(c => c.status === 'FAIL');
        const passedTests = suite.children.filter(c => c.status === 'PASS');
        const nestedSuites = suite.children.filter(c => !c.status);

        if (failedTests.length > 0) {
            console.group(`%c✗ Failed Tests`, 'color: #e74c3c;');
            failedTests.forEach(test => {
                const { customMessage, expected, actual } = test.error;

                // --- NEW: Custom Formatted Output ---
                // Start with the test name
                let summary = [`%c✗ ${test.name}`];
                let styles = ['color: #e74c3c; font-weight: bold;'];
                
                // Build a clean, multi-line details string
                let details = '';
                if (customMessage) {
                    details += `\n    Message:  ${customMessage}`;
                }
                // Use JSON.stringify to handle objects and strings gracefully
                if (expected !== undefined) {
                    details += `\n    Expected: ${JSON.stringify(expected)}`;
                }
                if (actual !== undefined) {
                    details += `\n    Actual:   ${JSON.stringify(actual)}`;
                }

                // Append the details as a normal, un-styled string part
                summary[0] += details;

                // Log the formatted summary
                console.log(summary.join(''), ...styles);
            });
            console.groupEnd();
        }

        if (passedTests.length > 0) {
            console.groupCollapsed(`%c✓ Passed Tests`, 'color: #2ecc71;');
            passedTests.forEach(test => console.log(`%c${test.name}`, 'color: #2ecc71;'));
            console.groupEnd();
        }
        nestedSuites.forEach(subSuite => printSuite(subSuite));
        console.groupEnd();
    };

    return {
        summarize(testTree) {
            console.group("--- Test Summary ---");
            testTree.children.forEach(suite => printSuite(suite));

            const finalStats = collectStats(testTree);
            const totalCount = finalStats.passed + finalStats.failed;
            const summaryColor = finalStats.failed > 0 ? '#e74c3c' : '#2ecc71';
            console.log(`%cTotal Tests: ${totalCount} | Passed: ${finalStats.passed} | Failed: ${finalStats.failed}`, `color: ${summaryColor}; font-weight: bold; border-top: 1px solid #ccc; padding-top: 5px; margin-top: 10px;`);
            console.groupEnd();
        }
    };
}